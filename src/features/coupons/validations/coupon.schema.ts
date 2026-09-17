import { z } from "zod";

export const getCouponsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type GetCouponsQueryInput = z.infer<typeof getCouponsQuerySchema>;

export const couponBaseSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(50, "Code cannot exceed 50 characters"),
  type: z.enum(["PERCENTAGE", "FIXED"], {
    message: "Type must be Percentage or Fixed Amount",
  }),
  value: z
    .union([z.number(), z.string()])
    .refine((v) => v !== "" && v !== undefined && v !== null, "Value is required")
    .transform((v) => (typeof v === "string" ? Number(v) : v))
    .refine((v) => Number.isFinite(v) && v > 0, "Value must be positive"),
  minOrderAmount: z
    .union([z.number(), z.string()])
    .refine((v) => v !== "" && v !== undefined && v !== null, "Min order amount is required")
    .transform((v) => (typeof v === "string" ? Number(v) : v))
    .refine((v) => Number.isFinite(v) && v >= 0, "Min order amount cannot be negative"),
  maxDiscount: z
    .union([z.number(), z.string()])
    .refine((v) => v !== "" && v !== undefined && v !== null, "Max discount is required")
    .transform((v) => (typeof v === "string" ? Number(v) : v))
    .refine((v) => Number.isFinite(v) && v > 0, "Max discount must be greater than 0"),
  usageLimit: z
    .union([z.number(), z.string()])
    .refine((v) => v !== "" && v !== undefined && v !== null, "Usage limit is required")
    .transform((v) => (typeof v === "string" ? Number(v) : v))
    .refine(
      (v) => Number.isFinite(v) && Number.isInteger(v) && v >= 1,
      "Usage limit must be at least 1"
    ),
  isActive: z.boolean().optional().default(true),
  startsAt: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v === "" || v === null || v === undefined ? undefined : v)),
  expiresAt: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v === "" || v === null || v === undefined ? undefined : v)),
});

export const createCouponSchema = couponBaseSchema
  .refine(
    (data) => {
      if (data.type === "PERCENTAGE" && typeof data.value === "number") {
        return data.value <= 100;
      }
      return true;
    },
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["value"],
    }
  )
  .refine(
    (data) => {
      if (data.startsAt && data.expiresAt) {
        return new Date(data.expiresAt) >= new Date(data.startsAt);
      }
      return true;
    },
    {
      message: "Expiry date cannot be earlier than start date",
      path: ["expiresAt"],
    }
  );

export type CreateCouponSchemaInput = z.infer<typeof createCouponSchema>;

export const updateCouponSchema = couponBaseSchema
  .partial()
  .refine(
    (data) => {
      if (data.type === "PERCENTAGE" && typeof data.value === "number") {
        return data.value <= 100;
      }
      return true;
    },
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["value"],
    }
  )
  .refine(
    (data) => {
      if (data.startsAt && data.expiresAt) {
        return new Date(data.expiresAt) >= new Date(data.startsAt);
      }
      return true;
    },
    {
      message: "Expiry date cannot be earlier than start date",
      path: ["expiresAt"],
    }
  );

export type UpdateCouponSchemaInput = z.infer<typeof updateCouponSchema>;
