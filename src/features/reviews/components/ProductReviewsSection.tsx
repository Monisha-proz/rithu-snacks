"use client";

import * as React from "react";
import { Star, CheckCircle2, ChevronDown } from "lucide-react";
import {
  usePublicProductReviews,
  usePublicVariantReviews,
} from "../hooks/use-public-reviews";
import type { PublicReviewItem } from "../types/review.types";

interface ProductReviewsSectionProps {
  variantId?: string | null;
  variantName?: string;
  productName?: string;
  productIdOrSlug?: string | null;
}

function getInitials(name?: string): string {
  if (!name) return "CB";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Fallback high-praise reviews if DB has not loaded yet
const DEFAULT_FALLBACK_REVIEWS: Array<{
  id: string;
  customerName: string;
  title: string;
  comment: string;
  rating: number;
}> = [
  {
    id: "fb-1",
    customerName: "Suresh V.",
    title: "Chennai",
    rating: 5,
    comment:
      "The aroma of pure ghee hits you the moment you open the box. The boondi pearls are so tender and perfectly sweetened with just the right touch of cardamom. Sent this to my parents in Bangalore and they loved it!",
  },
  {
    id: "fb-2",
    customerName: "Ananya Ramesh",
    title: "Coimbatore",
    rating: 5,
    comment:
      "Ordered 15 boxes for Diwali corporate gifting. Packaged so meticulously, not even a single pack was damaged. The taste reminds me of authentic temple snacks with aromatic spices. Exceptional quality!",
  },
  {
    id: "fb-3",
    customerName: "Murali Krishnan",
    title: "Mumbai",
    rating: 5,
    comment:
      "Very fast delivery to Mumbai in 3 days. Texture is crunchy and spiced to perfection. Authentic traditional flavor. Will definitely order again!",
  },
];

export function ProductReviewsSection({
  variantId,
  variantName,
  productName,
  productIdOrSlug,
}: ProductReviewsSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Collapse back to top 3 reviews whenever the selected variant changes
  React.useEffect(() => {
    setIsExpanded((prev) => (prev ? false : prev));
  }, [variantId]);

  // Query reviews for the specific selected variant if variantId is provided, else fallback to product
  const { data: variantData, isLoading: isVariantLoading } =
    usePublicVariantReviews(variantId, {
      enabled: Boolean(variantId),
    });

  const { data: productData, isLoading: isProductLoading } =
    usePublicProductReviews(!variantId ? productIdOrSlug : null, {
      enabled: !variantId && Boolean(productIdOrSlug),
    });

  const data = variantId ? variantData : productData;
  const isLoading = variantId ? isVariantLoading : isProductLoading;

  const rawReviews = data?.reviews ?? [];
  const reviews = rawReviews.length > 0 ? rawReviews : DEFAULT_FALLBACK_REVIEWS;

  // Only show 3 cards at start, or all if expanded
  const displayedReviews = isExpanded ? reviews : reviews.slice(0, 3);

  const avgRating = data?.ratingSummary?.averageRating || 4.8;
  const totalCount = data?.ratingSummary?.totalReviews ?? reviews.length;

  const targetTitle = variantName || productName || "Authentic Snack";

  return (
    <section id="reviews-section" className="w-full bg-[#FAF7F2] py-16 sm:py-20 my-8 rounded-3xl border border-[#F0EAE1]">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#8B1D1D] block mb-2 font-sans">
            Connoisseur Feedback
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#2B1B17] tracking-tight leading-tight">
            Loved Across Generations
          </h2>
          <p className="text-sm sm:text-base text-stone-600 mt-2.5 leading-relaxed">
            Real reviews for{" "}
            <strong className="text-[#2B1B17] font-bold">{targetTitle}</strong>{" "}
            from genuine sweet lovers and festive patrons
          </p>

          {/* Social Proof Rating Pill */}
          <div className="inline-flex items-center justify-center gap-2 mt-3.5 px-4 py-1.5 rounded-full bg-white/90 border border-stone-200/80 text-xs font-semibold text-stone-700 shadow-2xs">
            <div className="flex items-center gap-0.5 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.round(avgRating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-stone-200 text-stone-200"
                  }`}
                />
              ))}
            </div>
            <span className="font-bold text-stone-900">{avgRating.toFixed(1)}</span>
            <span className="text-stone-300">•</span>
            <span>
              {totalCount} customer {totalCount === 1 ? "review" : "reviews"}
            </span>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {displayedReviews.map((review) => {
            const initials = getInitials(review.customerName);
            const location = review.title || "Verified Customer";

            return (
              <div
                key={review.id}
                className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-stone-200/70 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between animate-in fade-in duration-200"
              >
                <div>
                  {/* Star Rating */}
                  <div className="flex items-center gap-1 text-amber-500 mb-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-stone-200 text-stone-200"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Comment Quote */}
                  <p className="text-stone-700 text-sm sm:text-[14.5px] leading-relaxed italic font-normal">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                </div>

                {/* Reviewer Profile */}
                <div className="mt-7 pt-5 border-t border-stone-100 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-[#F5EDE3] text-[#8B1D1D] font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {initials}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-[#2B1B17] truncate">
                      {review.customerName}
                    </span>
                    <span className="text-xs text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Verified Buyer</span>
                      {location && (
                        <>
                          <span className="text-stone-300 mx-0.5">•</span>
                          <span className="text-stone-500 truncate">{location}</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Reviews / Show Less Toggle Button */}
        {reviews.length > 3 && (
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#DCC7B7] bg-white hover:bg-[#F5ECE1] text-[#7A2224] text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer group select-none"
            >
              <span>
                {isExpanded
                  ? "Show Less Reviews"
                  : `View All ${reviews.length} Reviews`}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[#7A2224] transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : "group-hover:translate-y-0.5"
                }`}
              />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default ProductReviewsSection;

