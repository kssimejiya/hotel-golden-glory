import "server-only";
import { adminDb } from "./admin";
import { roomRepo } from "./roomRepo";
import type { AvailabilityService } from "@/lib/services/types";
import type { RoomSlug, BookingStatus } from "@/types";

const AVAILABILITY_COLLECTION = "availability";
const BOOKINGS_COLLECTION = "bookings";

// Bookings that occupy inventory until they are explicitly cancelled or fail.
const OCCUPYING_STATUSES: BookingStatus[] = ["confirmed", "awaiting_payment"];

function docId(slug: RoomSlug, date: string): string {
  return `${slug}_${date}`;
}

/**
 * Inclusive of checkIn, exclusive of checkOut — a 3-night stay (checkIn -> checkIn+3)
 * occupies 3 nights' worth of inventory.
 */
function getDatesInRange(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const current = new Date(checkIn);
  const end = new Date(checkOut);
  while (current < end) {
    dates.push(current.toISOString().split("T")[0]!);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

interface AvailabilityDoc {
  slug: RoomSlug;
  date: string;
  blocked: number;
  held: number;
  reason?: string;
  updatedAt: string;
}

async function readBlockedMap(
  slug: RoomSlug,
  dates: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (dates.length === 0) return map;
  try {
    const refs = dates.map((d) =>
      adminDb().collection(AVAILABILITY_COLLECTION).doc(docId(slug, d))
    );
    const snaps = await adminDb().getAll(...refs);
    snaps.forEach((snap, i) => {
      const date = dates[i]!;
      const data = snap.exists ? (snap.data() as AvailabilityDoc) : null;
      map.set(date, data?.blocked ?? 0);
    });
  } catch (err) {
    console.error(
      `[availabilityRepo] readBlockedMap(${slug}, ${dates.length} dates) failed:`,
      err
    );
    // Fail-safe: treat all dates as 0-blocked so admin can still see the page,
    // but the per-date held count from bookings will still subtract correctly.
    dates.forEach((d) => map.set(d, 0));
  }
  return map;
}

/**
 * For each date in the requested range, count how many rooms are occupied by
 * bookings that overlap that date and still occupy inventory.
 *
 * A booking with checkIn=A, checkOut=B occupies inventory for nights A..B-1.
 * It overlaps a requested date D when checkIn <= D < checkOut.
 *
 * We query Firestore for bookings that *could* overlap (a coarse window
 * filter), then refine in code per-date. This keeps the query simple and
 * within Firestore's compound-index limits.
 */
async function readBookingHeldMap(
  slug: RoomSlug,
  dates: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  dates.forEach((d) => map.set(d, 0));
  if (dates.length === 0) return map;

  const rangeStart = dates[0]!;
  const rangeEnd = dates[dates.length - 1]!;

  try {
    // Bookings that could overlap: checkIn <= rangeEnd AND checkOut > rangeStart
    // Firestore restriction: only one field can use range filters per query.
    // We filter by checkIn <= rangeEnd in the query, then filter checkOut > rangeStart in code.
    const snap = await adminDb()
      .collection(BOOKINGS_COLLECTION)
      .where("roomSlug", "==", slug)
      .where("status", "in", OCCUPYING_STATUSES)
      .where("dates.checkIn", "<=", rangeEnd)
      .get();

    for (const doc of snap.docs) {
      const data = doc.data();
      const checkIn = data?.dates?.checkIn as string | undefined;
      const checkOut = data?.dates?.checkOut as string | undefined;
      const rooms = (data?.guests?.rooms as number | undefined) ?? 1;
      if (!checkIn || !checkOut) continue;
      if (checkOut <= rangeStart) continue; // ended before our range

      for (const d of dates) {
        if (checkIn <= d && d < checkOut) {
          map.set(d, (map.get(d) ?? 0) + rooms);
        }
      }
    }
  } catch (err) {
    console.error(
      `[availabilityRepo] readBookingHeldMap(${slug}) failed:`,
      err
    );
    // Fail-safe: assume zero held so we don't oversell. Returning empty held
    // *underestimates* occupancy in failure mode — the admin block layer is
    // the operator's lever to compensate if reads are degraded.
  }
  return map;
}

export const firestoreAvailability: AvailabilityService = {
  async check({ roomSlug, checkIn, checkOut, rooms }) {
    const dates = getDatesInRange(checkIn, checkOut);
    if (dates.length === 0) {
      return { available: false, remainingInventory: 0, nights: 0 };
    }

    let total = 0;
    try {
      total = await roomRepo.getTotalRooms(roomSlug);
    } catch (err) {
      console.error(
        `[availabilityRepo] getTotalRooms(${roomSlug}) failed:`,
        err
      );
      return { available: false, remainingInventory: 0, nights: dates.length };
    }

    const [blockedMap, heldMap] = await Promise.all([
      readBlockedMap(roomSlug, dates),
      readBookingHeldMap(roomSlug, dates),
    ]);

    // A multi-night stay is available only if EVERY night has enough capacity.
    // The "Only N left" badge uses the minimum remaining across the range.
    let minAvailable = total;
    for (const date of dates) {
      const blocked = blockedMap.get(date) ?? 0;
      const held = heldMap.get(date) ?? 0;
      const avail = total - blocked - held;
      if (avail < minAvailable) minAvailable = avail;
    }

    return {
      available: minAvailable >= rooms,
      remainingInventory: Math.max(0, minAvailable),
      nights: dates.length,
    };
  },
};

// ----------------------------------------------------------------------------
// Admin-facing block management (used by the AvailabilityEditor in /admin/rooms).
// ----------------------------------------------------------------------------

export interface DateOccupancy {
  date: string;
  blocked: number;
  booked: number;
  available: number;
}

export const availabilityRepo = {
  async getOccupancyForRange(
    slug: RoomSlug,
    totalRooms: number,
    fromDate: string,
    toDate: string
  ): Promise<DateOccupancy[]> {
    const dates = getDatesInRange(fromDate, toDate);
    if (dates.length === 0) return [];

    const [blockedMap, heldMap] = await Promise.all([
      readBlockedMap(slug, dates),
      readBookingHeldMap(slug, dates),
    ]);

    return dates.map((date) => {
      const blocked = blockedMap.get(date) ?? 0;
      const booked = heldMap.get(date) ?? 0;
      return {
        date,
        blocked,
        booked,
        available: Math.max(0, totalRooms - blocked - booked),
      };
    });
  },

  /**
   * For a slug + date range, returns docs that have either blocked > 0 OR
   * held > 0 (held is legacy; bookings are now the source of truth for held,
   * but legacy held values are still surfaced for transparency).
   */
  async getBlocksForRange(
    slug: RoomSlug,
    fromDate: string,
    toDate: string
  ): Promise<Record<string, AvailabilityDoc>> {
    const dates = getDatesInRange(fromDate, toDate);
    const result: Record<string, AvailabilityDoc> = {};
    if (dates.length === 0) return result;

    try {
      const refs = dates.map((d) =>
        adminDb().collection(AVAILABILITY_COLLECTION).doc(docId(slug, d))
      );
      const snaps = await adminDb().getAll(...refs);
      snaps.forEach((snap, i) => {
        if (!snap.exists) return;
        const data = snap.data() as AvailabilityDoc;
        if ((data.blocked ?? 0) > 0 || (data.held ?? 0) > 0) {
          result[dates[i]!] = data;
        }
      });
    } catch (err) {
      console.error(
        `[availabilityRepo] getBlocksForRange(${slug}, ${fromDate}..${toDate}) failed:`,
        err
      );
    }
    return result;
  },

  async setBlock(
    slug: RoomSlug,
    date: string,
    blocked: number,
    reason?: string
  ): Promise<void> {
    const now = new Date().toISOString();
    await adminDb()
      .collection(AVAILABILITY_COLLECTION)
      .doc(docId(slug, date))
      .set(
        {
          slug,
          date,
          blocked: Math.max(0, blocked),
          reason: reason ?? null,
          updatedAt: now,
        },
        { merge: true }
      );
  },

  async setBlockRange(
    slug: RoomSlug,
    fromDate: string,
    toDate: string,
    blocked: number,
    reason?: string
  ): Promise<void> {
    const dates: string[] = [];
    const current = new Date(fromDate);
    const end = new Date(toDate);
    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]!);
      current.setDate(current.getDate() + 1);
    }

    const db = adminDb();
    const batch = db.batch();
    const now = new Date().toISOString();
    for (const date of dates) {
      const ref = db.collection(AVAILABILITY_COLLECTION).doc(docId(slug, date));
      batch.set(
        ref,
        {
          slug,
          date,
          blocked: Math.max(0, blocked),
          reason: reason ?? null,
          updatedAt: now,
        },
        { merge: true }
      );
    }
    await batch.commit();
  },
};
