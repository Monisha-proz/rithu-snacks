import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { variantService } from "@/features/variants/services/variant.service";
import {
  updateAdminVariantSchema,
  type UpdateAdminVariantInput,
} from "@/features/variants/validations/admin-variant.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const productUuid = context.params?.uuid;
      const variantUuid = context.params?.variantUuid;
      if (!productUuid || !variantUuid) {
        throw ApiError.badRequest("Product UUID and Variant UUID are required");
      }

      const variant = await variantService.getAdminVariantByUuid(
        productUuid,
        variantUuid
      );
      return apiSuccess(variant, "Variant fetched successfully");
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
  }
);

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const productUuid = context.params?.uuid;
      const variantUuid = context.params?.variantUuid;
      if (!productUuid || !variantUuid) {
        throw ApiError.badRequest("Product UUID and Variant UUID are required");
      }

      const body = context.body as UpdateAdminVariantInput;
      const adminEmail = context.session?.user?.email ?? undefined;

      const variant = await variantService.updateAdminVariant(
        productUuid,
        variantUuid,
        body,
        adminEmail
      );

      let successMessage = "Variant updated successfully";
      const keys = Object.keys(body).filter(
        (key) => (body as Record<string, unknown>)[key] !== undefined
      );
      if (keys.length === 1) {
        if (body.isActive !== undefined) {
          successMessage = body.isActive
            ? "Variant marked as active successfully."
            : "Variant marked as inactive successfully.";
        } else if (body.outOfStock !== undefined) {
          successMessage = body.outOfStock
            ? "Product marked as out of stock successfully."
            : "Product marked as in stock successfully.";
        }
      }

      return apiSuccess(variant, successMessage);
    },
  },
  {
    method: "PUT",
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: updateAdminVariantSchema,
  }
);

export const DELETE = createApiHandler(
  {
    DELETE: async (_request, context) => {
      const productUuid = context.params?.uuid;
      const variantUuid = context.params?.variantUuid;
      if (!productUuid || !variantUuid) {
        throw ApiError.badRequest("Product UUID and Variant UUID are required");
      }

      const adminEmail = context.session?.user?.email ?? undefined;
      const result = await variantService.deleteAdminVariant(
        productUuid,
        variantUuid,
        adminEmail
      );

      return apiSuccess(null, result.message);
    },
  },
  {
    method: "DELETE",
    requireAuth: true,
    requiredRole: ["ADMIN"],
  }
);
