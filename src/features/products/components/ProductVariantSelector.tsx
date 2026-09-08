"use client";

import * as React from "react";
import Link from "next/link";
import { Star, ChevronRight, Check, Plus, ShoppingBag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveSnackFallbackImage } from "@/lib/storefront";
import { formatMeasurementLabel } from "@/features/variants/utils/measurement.util";
import { useAddToCart } from "@/features/cart/hooks/use-cart";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/Toast";
import { ProductImage } from "@/components/common/ProductImage";
import type { CustomerVariantListItemDto } from "../types";

interface ProductVariantSelectorProps {
  variants: CustomerVariantListItemDto[];
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
  productName?: string;
  categoryName?: string;
  className?: string;
}

const FESTIVE_BADGES = [
  "Pure Ghee",
  "Spicy Savory",
  "Bestseller",
  "Tea-Time Classic",
  "Traditional",
  "Crispy Crunch",
  "Signature Recipe",
  "Chef Special",
];

export function ProductVariantSelector({
  variants,
  selectedVariantId,
  onSelect,
  productName,
  categoryName,
  className,
}: ProductVariantSelectorProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const addToCart = useAddToCart();
  const [addingVariantId, setAddingVariantId] = React.useState<string | null>(null);

  if (!variants || variants.length <= 1) return null;

  const handleQuickAdd = (
    e: React.MouseEvent,
    variant: CustomerVariantListItemDto
  ) => {
    e.stopPropagation();

    if (!session) {
      const returnUrl =
        typeof window !== "undefined" ? window.location.pathname : "/products";
      router.push(`/login?callbackUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    const defaultUnit =
      variant.unitPrices?.find((u) => u.isDefault) || variant.unitPrices?.[0];
    if (!defaultUnit) {
      onSelect(variant.id);
      return;
    }

    setAddingVariantId(variant.id);
    addToCart.mutate(
      { variantUnitPriceId: defaultUnit.id, quantity: 1 },
      {
        onSuccess: () => {
          toast.success("Added to box", variant.variantName);
          setAddingVariantId(null);
        },
        onError: () => {
          toast.error("Could not add item to cart");
          setAddingVariantId(null);
        },
      }
    );
  };

  return (
    <section className={cn("w-full", className)}>
      {/* Section Header matching festive design */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
        <div>
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#8B1D1D] block mb-1 font-sans">
            COMPLETE YOUR FESTIVE BOX
          </span>
          <h2 className="font-serif text-xl sm:text-2xl lg:text-[34px] font-bold text-[#2B1B17] tracking-tight leading-tight">
            You May Also Like
          </h2>
        </div>

        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#8B1D1D] hover:text-[#5A1911] transition-colors self-start sm:self-auto group"
        >
          <span>View All Sweets & Savories</span>
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Fully Responsive Grid: 2 columns on mobile, 3 on tablet, 4 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
        {variants.map((variant, idx) => {
          const isSelected = selectedVariantId === variant.id;
          const badge = FESTIVE_BADGES[idx % FESTIVE_BADGES.length];
          const displayImage =
            variant.primaryImage || resolveSnackFallbackImage(variant.variantName);

          const defaultUnitPrice =
            variant.unitPrices?.find((u) => u.isDefault) || variant.unitPrices?.[0];
          const price = defaultUnitPrice?.sellingPrice ?? variant.salePrice ?? variant.basePrice ?? 0;
          const measurementLabel = defaultUnitPrice?.measurement
            ? formatMeasurementLabel(defaultUnitPrice.measurement as any)
            : "200 g";

          const isAddingThis = addingVariantId === variant.id;

          return (
            <div
              key={variant.id}
              onClick={() => onSelect(variant.id)}
              className={cn(
                "group bg-white rounded-xl sm:rounded-3xl border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between select-none",
                isSelected
                  ? "border-[#8B1D1D] shadow-md ring-2 ring-[#8B1D1D]/20"
                  : "border-stone-200/80 shadow-2xs hover:shadow-lg hover:border-stone-300"
              )}
            >
              {/* Card Image with Badge & Fallback */}
              <div className="relative aspect-square sm:aspect-4/3 w-full overflow-hidden bg-stone-50">
                {/* Festive Tag */}
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 bg-white/95 backdrop-blur-xs text-[#2B1B17] font-bold text-[9px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-xs border border-stone-200/50">
                  {badge}
                </div>

                {/* Active Indicator Badge */}
                {isSelected && (
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 bg-[#8B1D1D] text-white font-bold text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider flex items-center gap-1">
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
                    <span className="hidden xs:inline sm:inline">Viewing</span>
                  </div>
                )}

                {/* Snack Image using ProductImage with SVG Fallback */}
                <ProductImage
                  src={displayImage}
                  alt={variant.variantName}
                  fallbackText={variant.variantName}
                  containerClassName="w-full h-full aspect-square sm:aspect-4/3"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Card Body */}
              <div className="p-2.5 sm:p-4 lg:p-5 flex flex-col justify-between flex-1">
                <div>
                  {/* Category / Product Subtitle */}
                  <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-0.5 sm:mb-1 truncate">
                    {categoryName || productName || "Traditional Snack"}
                  </span>

                  {/* Variant Title */}
                  <h3 className="font-serif text-xs sm:text-base lg:text-lg font-bold text-stone-900 group-hover:text-[#8B1D1D] transition-colors leading-tight sm:leading-snug line-clamp-2 sm:line-clamp-1">
                    {variant.variantName}
                  </h3>

                  {/* Pack Size / Subtitle info */}
                  <p className="text-[10px] sm:text-xs text-stone-500 mt-0.5 sm:mt-1 truncate">
                    Pack: {measurementLabel} • Fresh Batch
                  </p>

                  {/* 5 Star Rating */}
                  <div className="flex items-center gap-0.5 sm:gap-1 mt-1.5 sm:mt-2 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-[10px] sm:text-[11px] font-medium text-stone-500 ml-0.5 sm:ml-1">
                      (5)
                    </span>
                  </div>
                </div>

                {/* Price and Add+ button */}
                <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-stone-100 flex items-center justify-between gap-1">
                  <div>
                    <span className="text-xs sm:text-base lg:text-lg font-extrabold text-stone-900">
                      ₹{price.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(e, variant)}
                    disabled={variant.outOfStock || isAddingThis}
                    className={cn(
                      "px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 select-none shrink-0",
                      variant.outOfStock
                        ? "bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed"
                        : isSelected
                        ? "bg-[#8B1D1D] text-white hover:bg-[#6D1515] shadow-xs"
                        : "bg-white text-stone-800 border border-stone-300 hover:bg-[#8B1D1D] hover:text-white hover:border-[#8B1D1D]"
                    )}
                  >
                    {isAddingThis ? (
                      <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ProductVariantSelector;
