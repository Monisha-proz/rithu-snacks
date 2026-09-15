import { z } from "zod";

export const createAdminGstRateSchema = z
  .object({
    name: z
      .string({ message: "GST rate name is required" })
      .trim()
      .min(1, "GST rate name is required")
      .max(100, "GST rate name cannot exceed 100 characters"),
    cgstPercent: z
      .number({ message: "CGST % is required" })
      .gt(0, "CGST % must be greater than 0")
      .max(100, "CGST % cannot exceed 100"),
    sgstPercent: z
      .number({ message: "SGST % is required" })
      .gt(0, "SGST % must be greater than 0")
      .max(100, "SGST % cannot exceed 100"),
    igstPercent: z
      .number({ message: "IGST % is required" })
      .gt(0, "IGST % must be greater than 0")
      .max(100, "IGST % cannot exceed 100"),
  })
  .strict();

export type CreateAdminGstRateInput = z.infer<typeof createAdminGstRateSchema>;

export const updateAdminGstRateSchema = createAdminGstRateSchema
  .partial()
  .strict();

export type UpdateAdminGstRateInput = z.infer<typeof updateAdminGstRateSchema>;

export const adminGstRatesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(10).optional(),
  search: z.string().trim().optional(),
});

export type AdminGstRatesQueryInput = z.infer<typeof adminGstRatesQuerySchema>;
