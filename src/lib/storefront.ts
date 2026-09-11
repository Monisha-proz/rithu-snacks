import { SNACKSLOGOS, type StorefrontProduct } from "@/constants/storefront";
import { getImageUrl } from "@/lib/utils";
import { formatMeasurementLabel } from "@/features/variants/utils/measurement.util";
import type { CustomerVariantListItemDto } from "@/features/customers/types";
import type { CartItemResponse } from "@/features/cart/types";
import type { CustomerWishlistItemDto } from "@/features/wishlist/types";

/**
 * Best-effort decorative fallback image when an apparel/clothing variant has no uploaded image yet.
 */
export function resolveProductFallbackImage(_name: string): string {
  return "/images/category_img.png";
}

// Backward compatibility alias for any existing callers
export const resolveSnackFallbackImage = resolveProductFallbackImage;

/**
 * Maps a real customer-catalog variant (one storefront clothing item, e.g. "Floral Maxi Dress")
 * into the shape the storefront ProductCard renders. Carries available clothing sizes
 * (unitPrices), each with its own VariantUnitPrice UUID (what cart/wishlist APIs key off).
 */
export function mapVariantToStorefrontProduct(
  variant: CustomerVariantListItemDto
): StorefrontProduct {
  const isDummyImage =
    variant.primaryImage?.startsWith("/logos/") && variant.primaryImage?.endsWith(".png");

  const imageUrl = !isDummyImage && variant.primaryImage
    ? getImageUrl(variant.primaryImage)
    : resolveSnackFallbackImage(variant.productName || variant.variantName);

  return {
    id: variant.id,
    productId: variant.productId,
    name: variant.productName || variant.variantName,
    image: imageUrl,
    outOfStock: variant.outOfStock,
    unitPrices: (variant.unitPrices ?? []).map((up) => ({
      id: up.id,
      label: formatMeasurementLabel(up.measurement),
      sku: up.sku,
      basePrice: up.basePrice,
      sellingPrice: up.sellingPrice,
      isDefault: up.isDefault,
    })),
  };
}

/**
 * Maps one real cart line (already resolved to a specific pack size) into
 * the shape ProductCard's "cart" mode renders.
 */
export function mapCartItemToStorefrontProduct(item: CartItemResponse): StorefrontProduct {
  const isDummyImage =
    item.primaryImage?.startsWith("/logos/") && item.primaryImage?.endsWith(".png");

  return {
    id: item.variantId,
    productId: item.productId,
    name: item.variantName || item.productName,
    image: !isDummyImage && item.primaryImage
      ? getImageUrl(item.primaryImage)
      : resolveSnackFallbackImage(item.productName || item.variantName),
    unitPrices: [
      {
        id: item.variantUnitPriceId,
        label: formatMeasurementLabel(item.measurement),
        sku: "",
        // The struck-through price is today's catalog price, so the card
        // shows the offer saving rather than a stale add-to-cart price.
        basePrice: item.basePrice,
        sellingPrice: item.currentPrice,
        isDefault: true,
      },
    ],
  };
}

/**
 * Maps one real wishlist row (already resolved to a specific pack size) into
 * the shape ProductCard's "wishlist" mode renders.
 */
export function mapWishlistItemToStorefrontProduct(
  item: CustomerWishlistItemDto
): StorefrontProduct {
  return {
    id: item.variantId,
    productId: item.product.id,
    name: item.variantName || item.product.name,
    image: item.primaryImage
      ? getImageUrl(item.primaryImage)
      : resolveSnackFallbackImage(item.product.name || item.variantName),
    outOfStock: !item.isAvailable,
    unitPrices: [
      {
        id: item.variantUnitPriceId,
        label: formatMeasurementLabel(item.measurement),
        sku: item.sku,
        basePrice: item.basePrice,
        sellingPrice: item.price,
        isDefault: true,
      },
    ],
  };
}
