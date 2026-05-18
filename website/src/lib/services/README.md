# Service Layer

All booking services are accessed through `src/lib/services/index.ts`, which currently exports mock implementations. To swap to real services, replace the import and assignment for each service — one file at a time.

**AvailabilityService** — Replace `mockAvailability` with a Firestore-backed implementation that queries a `room_inventory` collection keyed by `${roomSlug}_${date}`. The interface returns `{ available, remainingInventory, nights }`.

**PaymentService** — Replace `mockPayment` with a server action that calls the Razorpay Orders API (`POST /v1/orders`) for `createOrder`, and verifies the payment signature using `razorpay.payments.verify` for `verifyPayment`. The `razorpayKey` returned should be `process.env.RAZORPAY_KEY_ID`.

**BookingRepository** — Replace `mockBookingRepo` with Firestore. Collection: `bookings`, document ID: the generated `bookingId`. The `create` method writes the full `Booking` document; `getById` reads it; `updateStatus` uses `updateDoc` with a partial update.

**NotificationService** — Replace `mockNotifications` with Resend (email), MSG91 (SMS), and a Slack/email webhook (hotel alert). Each method should be independently swappable. The `Booking` object passed contains all fields needed to render templates.
