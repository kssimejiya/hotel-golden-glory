import type { AvailabilityService } from "../types";
import type { RoomSlug } from "@/types";

const baseInventory: Record<RoomSlug, number> = {
  deluxe: 13,
  superior: 13,
  premium: 2,
  "blues-suite": 6,
};

const holds = new Map<string, number>();

function getKey(slug: RoomSlug, date: string): string {
  return `${slug}_${date}`;
}

function getDatesInRange(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const current = new Date(checkIn);
  const end = new Date(checkOut);
  while (current < end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function getAvailableForDate(slug: RoomSlug, date: string): number {
  const held = holds.get(getKey(slug, date)) ?? 0;
  return baseInventory[slug] - held;
}

export const mockAvailability: AvailabilityService = {
  async check({ roomSlug, checkIn, checkOut, rooms }) {
    await new Promise((r) => setTimeout(r, 300));
    const dates = getDatesInRange(checkIn, checkOut);
    const nights = dates.length;
    let minAvailable = baseInventory[roomSlug];

    for (const date of dates) {
      const avail = getAvailableForDate(roomSlug, date);
      if (avail < minAvailable) minAvailable = avail;
    }

    return {
      available: minAvailable >= rooms,
      remainingInventory: minAvailable,
      nights,
    };
  },
};

export function holdRooms(slug: RoomSlug, checkIn: string, checkOut: string, rooms: number): void {
  const dates = getDatesInRange(checkIn, checkOut);
  for (const date of dates) {
    const key = getKey(slug, date);
    holds.set(key, (holds.get(key) ?? 0) + rooms);
  }
}

export function releaseRooms(slug: RoomSlug, checkIn: string, checkOut: string, rooms: number): void {
  const dates = getDatesInRange(checkIn, checkOut);
  for (const date of dates) {
    const key = getKey(slug, date);
    const current = holds.get(key) ?? 0;
    holds.set(key, Math.max(0, current - rooms));
  }
}
