import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiCreated } from "@/lib/api/api-response";
import { offerService } from "@/features/offers/services/offer.service";
import { getOffersQuerySchema, createOfferSchema } from "@/features/offers/validations/offer.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const query = context.query as ReturnType<typeof getOffersQuerySchema.parse>;
      const result = await offerService.getOffers({
        page: query.page,
        limit: query.limit,
        search: query.search,
        isActive: query.isActive,
      });
      return apiSuccess(result.data, "Offers fetched successfully", 200, result.meta);
    },
  },
  { querySchema: getOffersQuerySchema }
);

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as ReturnType<typeof createOfferSchema.parse>;
      const offer = await offerService.createOffer({
        ...body,
        startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
        endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
      });
      return apiCreated(offer, "Offer created successfully");
    },
  },
  {
    method: "POST",
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: createOfferSchema,
  }
);
