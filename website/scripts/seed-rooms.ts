/**
 * Seed Firestore rooms collection with initial data from content.ts.
 * Run with: npm run seed:rooms  (or: npx tsx scripts/seed-rooms.ts)
 *
 * Idempotent — uses { merge: true } so re-runs only fill missing fields
 * (won't overwrite edits made through the admin panel).
 */
import { db, projectId } from "./lib/init-admin";
import { rooms } from "../src/lib/content";

async function main() {
  console.log(`Seeding ${rooms.length} rooms into Firestore project ${projectId}...`);
  for (const room of rooms) {
    const ref = db().collection("rooms").doc(room.slug);
    const existing = await ref.get();
    const data = {
      totalRooms: room.totalRooms,
      heroImage: room.heroImage,
      gallery: room.gallery,
      rates: room.rates,
      updatedAt: new Date().toISOString(),
    };
    if (existing.exists) {
      console.log(`  · ${room.slug} already exists — skipping`);
      continue;
    }
    await ref.set(data);
    console.log(`  ✓ ${room.slug} created`);
  }
  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
