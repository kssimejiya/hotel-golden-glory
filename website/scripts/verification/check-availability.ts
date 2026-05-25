/**
 * Check availability for a room against real Firestore data.
 *
 * Usage:  npx tsx scripts/verification/check-availability.ts <roomSlug> <checkIn> <checkOut>
 * Example: npx tsx scripts/verification/check-availability.ts deluxe 2026-06-15 2026-06-17
 */
import { db } from "../lib/init-admin";

type RoomSlug = "deluxe" | "superior" | "premium" | "blues-suite";
type BookingStatus = "confirmed" | "awaiting_payment";

const OCCUPYING_STATUSES: BookingStatus[] = ["confirmed", "awaiting_payment"];

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

async function main() {
  const [roomSlug, checkIn, checkOut] = process.argv.slice(2);
  if (!roomSlug || !checkIn || !checkOut) {
    console.error("Usage: npx tsx scripts/verification/check-availability.ts <roomSlug> <checkIn> <checkOut>");
    console.error("Example: npx tsx scripts/verification/check-availability.ts deluxe 2026-06-15 2026-06-17");
    process.exit(1);
  }

  const firestore = db();
  const dates = getDatesInRange(checkIn, checkOut);
  if (dates.length === 0) {
    console.error("Invalid date range — checkOut must be after checkIn.");
    process.exit(1);
  }

  console.log(`\nChecking availability: ${roomSlug} · ${checkIn} → ${checkOut} (${dates.length} night${dates.length > 1 ? "s" : ""})`);
  console.log(`Nights: ${dates.join(", ")}\n`);

  // 1. Get totalRooms from Firestore (with static fallback)
  const roomDoc = await firestore.collection("rooms").doc(roomSlug).get();
  const staticTotals: Record<string, number> = {
    deluxe: 13, superior: 10, premium: 2, "blues-suite": 6,
  };
  const totalRooms = (roomDoc.exists ? roomDoc.data()?.totalRooms : null) ?? staticTotals[roomSlug] ?? 0;
  console.log(`Total inventory: ${totalRooms} rooms${roomDoc.exists ? " (from Firestore)" : " (static fallback)"}`);

  // 2. Read admin blocks
  const blockRefs = dates.map((d) =>
    firestore.collection("availability").doc(`${roomSlug}_${d}`)
  );
  const blockSnaps = await firestore.getAll(...blockRefs);
  const blockedMap = new Map<string, number>();
  blockSnaps.forEach((snap, i) => {
    blockedMap.set(dates[i]!, snap.exists ? ((snap.data() as { blocked?: number }).blocked ?? 0) : 0);
  });

  // 3. Read booking-held counts
  const rangeStart = dates[0]!;
  const rangeEnd = dates[dates.length - 1]!;
  const bookingSnap = await firestore
    .collection("bookings")
    .where("roomSlug", "==", roomSlug)
    .where("status", "in", OCCUPYING_STATUSES)
    .where("dates.checkIn", "<=", rangeEnd)
    .get();

  const heldMap = new Map<string, number>();
  dates.forEach((d) => heldMap.set(d, 0));

  const overlappingBookings: Array<{ id: string; checkIn: string; checkOut: string; rooms: number; status: string }> = [];

  for (const doc of bookingSnap.docs) {
    const data = doc.data();
    const bCheckIn = data?.dates?.checkIn as string | undefined;
    const bCheckOut = data?.dates?.checkOut as string | undefined;
    const rooms = (data?.guests?.rooms as number | undefined) ?? 1;
    const status = data?.status as string;
    if (!bCheckIn || !bCheckOut) continue;
    if (bCheckOut <= rangeStart) continue;

    let overlaps = false;
    for (const d of dates) {
      if (bCheckIn <= d && d < bCheckOut) {
        heldMap.set(d, (heldMap.get(d) ?? 0) + rooms);
        overlaps = true;
      }
    }
    if (overlaps) {
      overlappingBookings.push({ id: doc.id, checkIn: bCheckIn, checkOut: bCheckOut, rooms, status });
    }
  }

  // 4. Print per-night breakdown
  console.log(`\n${"Night".padEnd(14)} ${"Total".padStart(6)} ${"Blocked".padStart(8)} ${"Held".padStart(6)} ${"Remaining".padStart(10)}`);
  console.log("─".repeat(48));

  let minRemaining = totalRooms;
  for (const date of dates) {
    const blocked = blockedMap.get(date) ?? 0;
    const held = heldMap.get(date) ?? 0;
    const remaining = totalRooms - blocked - held;
    if (remaining < minRemaining) minRemaining = remaining;
    console.log(`${date.padEnd(14)} ${String(totalRooms).padStart(6)} ${String(blocked).padStart(8)} ${String(held).padStart(6)} ${String(remaining).padStart(10)}`);
  }

  console.log("─".repeat(48));
  console.log(`Min remaining across all nights: ${minRemaining}`);
  console.log(`Available for 1 room: ${minRemaining >= 1 ? "YES" : "NO"}\n`);

  // 5. Print overlapping bookings
  if (overlappingBookings.length > 0) {
    console.log(`Overlapping bookings (${overlappingBookings.length}):`);
    for (const b of overlappingBookings) {
      console.log(`  ${b.id}  ${b.checkIn} → ${b.checkOut}  ×${b.rooms} room${b.rooms > 1 ? "s" : ""}  [${b.status}]`);
    }
  } else {
    console.log("No overlapping bookings found.");
  }
  console.log();
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
