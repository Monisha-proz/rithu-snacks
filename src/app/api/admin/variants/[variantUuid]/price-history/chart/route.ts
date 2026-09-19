import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { variantUnitPriceService } from "@/features/variants/services/variant-unit-price.service";

// NOTE: `variantUuid` here is the VariantUnitPrice UUID - see price-history/route.ts.
export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const unitPriceUuid = context.params?.variantUuid;
      if (!unitPriceUuid || typeof unitPriceUuid !== "string") {
        throw ApiError.badRequest("Invalid variant unit price UUID");
      }

      const period =
        (typeof context.searchParams?.get === "function"
          ? context.searchParams.get("period")
          : null) ||
        (context.query as Record<string, any>)?.period ||
        "1y";

      const chartData = await variantUnitPriceService.getPriceHistoryChart(
        unitPriceUuid,
        period
      );

      return apiSuccess(
        chartData,
        "Variant price history chart fetched successfully",
        200
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
  }
);
