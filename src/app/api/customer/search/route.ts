import { z } from "zod";
import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { catalogService } from "@/features/customers/services/catalog.service";

const searchQuerySchema = z.object({
  q: z.string().optional().default(""),
});

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const query = (context.query || {}) as { q?: string };
      const q = (query.q || "").trim();

      if (q.length < 2) {
        return apiSuccess(
          {
            categories: [],
            products: [],
            items: [],
            total: 0,
          },
          "Search results fetched successfully",
          200
        );
      }

      const result = await catalogService.globalSearch(q);

      return apiSuccess(
        result,
        "Search results fetched successfully",
        200
      );
    },
  },
  {
    querySchema: searchQuerySchema,
  }
);
