import { z } from "zod";

export const getOffersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type GetOffersQueryInput = z.infer<typeof getOffersQuerySchema>;

export const createOfferSchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
  type: z.enum(["percentage", "flat", "bxgy"]),
  value: z.number().positive("Value must be positive"),
  minOrderAmount: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  productUuids: z.array(z.string().min(1)).min(1, "Select at least one product"),
});

export type CreateOfferSchemaInput = z.infer<typeof createOfferSchema>;

export const updateOfferSchema = createOfferSchema.partial();

export type UpdateOfferSchemaInput = z.infer<typeof updateOfferSchema>;
