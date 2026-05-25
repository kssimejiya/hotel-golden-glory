import "server-only";
import Razorpay from "razorpay";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  throw new Error(
    "[razorpay/server] RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables."
  );
}

let cached: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!cached) {
    cached = new Razorpay({
      key_id: RAZORPAY_KEY_ID!,
      key_secret: RAZORPAY_KEY_SECRET!,
    });
  }
  return cached;
}

export { RAZORPAY_KEY_SECRET };
