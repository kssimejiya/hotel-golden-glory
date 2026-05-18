import { z } from "zod";

export const guestDetailsSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z
    .string()
    .email("Please enter a valid email address"),
  phone: z
    .string()
    .regex(/^\+91\d{10}$/, "Please enter a valid 10-digit Indian mobile number"),
  specialRequests: z.string().max(500, "Special requests are too long").optional(),
  gstin: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Please enter a valid GSTIN"
    )
    .optional()
    .or(z.literal("")),
  arrivalTime: z.string().optional(),
});

export type GuestDetailsFormValues = z.infer<typeof guestDetailsSchema>;

export const datesSchema = z
  .object({
    checkIn: z.string().min(1, "Please select a check-in date"),
    checkOut: z.string().min(1, "Please select a check-out date"),
  })
  .refine(
    (data) => {
      if (!data.checkIn || !data.checkOut) return true;
      return new Date(data.checkOut) > new Date(data.checkIn);
    },
    { message: "Check-out must be after check-in", path: ["checkOut"] }
  );
