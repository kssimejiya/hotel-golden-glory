
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
