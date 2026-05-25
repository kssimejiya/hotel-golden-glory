import "server-only";
import crypto from "node:crypto";
import { getRazorpay, RAZORPAY_KEY_SECRET } from "@/lib/razorpay/server";
import type { PaymentService } from "./types";

const NEXT_PUBLIC_RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

export const razorpayPayment: PaymentService = {
  async createOrder({ amountInPaise, bookingId, receipt }) {
    const rzp = getRazorpay();
    try {
      const order = await rzp.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt,
        notes: { bookingId },
      });
      console.log(
        `[razorpayPayment] order ${order.id} created for ${bookingId} (₹${amountInPaise / 100})`
      );
      return {
        orderId: order.id,
        razorpayKey: NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
      };
    } catch (err) {
      console.error(
        `[razorpayPayment] createOrder failed for ${bookingId}:`,
        err
      );
      throw new Error("Failed to create payment order. Please try again.");
    }
  },

  async verifyPayment({ orderId, paymentId, signature }) {
    try {
      const body = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET!)
        .update(body)
        .digest("hex");

      const expected = Buffer.from(expectedSignature, "hex");
      const received = Buffer.from(signature, "hex");

      if (expected.length !== received.length) {
        console.warn(
          `[razorpayPayment] signature length mismatch for ${orderId}`
        );
        return { verified: false };
      }

      const verified = crypto.timingSafeEqual(expected, received);

      console.log(
        `[razorpayPayment] verify ${orderId} → ${verified ? "ok" : "fail"}`
      );
      return { verified };
    } catch (err) {
      console.error(
        `[razorpayPayment] verifyPayment failed for ${orderId}:`,
        err
      );
      return { verified: false };
    }
  },
};
