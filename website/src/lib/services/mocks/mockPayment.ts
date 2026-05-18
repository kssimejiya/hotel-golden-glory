import type { PaymentService } from "../types";

export const mockPayment: PaymentService = {
  async createOrder({ amountInPaise, bookingId }) {
    await new Promise((r) => setTimeout(r, 800));
    const orderId = `order_mock_${Date.now()}_${bookingId}`;
    console.log(
      `[mockPayment] order ${orderId} for ${bookingId} (₹${amountInPaise / 100})`
    );
    return { orderId, razorpayKey: "rzp_test_mock_key" };
  },

  async verifyPayment({ orderId }) {
    await new Promise((r) => setTimeout(r, 800));
    const verified = Math.random() > 0.1;
    console.log(`[mockPayment] verify ${orderId} → ${verified ? "ok" : "fail"}`);
    return { verified };
  },
};
