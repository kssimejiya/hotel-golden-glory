/**
 * Grant or revoke the `admin: true` custom claim on a Firebase Auth user.
 *
 * Setup:
 *   1. Create the user in Firebase Console → Authentication → Users → Add user.
 *   2. Run this script to flip the admin claim on:
 *        npx tsx scripts/set-admin-claim.ts staff@theblueshotels.com
 *   3. Have the user sign in (or sign out and back in) so a new ID token
 *      is minted with the updated claim. Existing sessions need to be
 *      revoked to take effect immediately — pass --revoke to force that:
 *        npx tsx scripts/set-admin-claim.ts staff@theblueshotels.com --revoke
 *
 * To revoke admin access:
 *        npx tsx scripts/set-admin-claim.ts staff@theblueshotels.com --off
 *
 * Existing custom claims on the user are preserved; only the `admin` field
 * is changed.
 *
 * Requires the same FIREBASE_ADMIN_* env vars as the Next.js runtime.
 */
import { auth } from "./lib/init-admin";

async function main() {
  const args = process.argv.slice(2);
  const email = args.find((a) => !a.startsWith("--"));
  const turnOff = args.includes("--off");
  const revoke = args.includes("--revoke");

  if (!email) {
    console.error(
      "Usage: tsx scripts/set-admin-claim.ts <email> [--off] [--revoke]"
    );
    process.exit(1);
  }

  const user = await auth().getUserByEmail(email);
  const existing = user.customClaims ?? {};
  const updated = { ...existing, admin: !turnOff };
  await auth().setCustomUserClaims(user.uid, updated);

  console.log(
    `${turnOff ? "Revoked" : "Granted"} admin claim for ${email} (uid: ${user.uid})`
  );
  console.log("Updated claims:", updated);

  if (revoke || turnOff) {
    await auth().revokeRefreshTokens(user.uid);
    console.log(
      "Refresh tokens revoked. The user will need to sign in again."
    );
  } else {
    console.log(
      "Note: existing sessions still have the old claim until the user re-signs-in (or pass --revoke)."
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
