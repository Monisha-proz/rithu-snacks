import type { OfferComputedStatus, OfferLevel, OfferType } from "../types";

export const OFFER_LEVEL_LABELS: Record<OfferLevel, string> = {
  product: "Product-wise",
  item: "Item/Variant-wise",
};

export const OFFER_LEVEL_OPTIONS = [
  { value: "product", label: OFFER_LEVEL_LABELS.product },
  { value: "item", label: OFFER_LEVEL_LABELS.item },
] as const;

export const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  percentage: "Percentage Discount",
  flat: "Fixed Amount Discount",
  special_price: "Special Offer Price",
  bxgy: "Buy X Get Y",
};

export const OFFER_TYPE_OPTIONS = [
  { value: "percentage", label: OFFER_TYPE_LABELS.percentage },
  { value: "flat", label: OFFER_TYPE_LABELS.flat },
  { value: "special_price", label: OFFER_TYPE_LABELS.special_price },
  { value: "bxgy", label: OFFER_TYPE_LABELS.bxgy },
] as const;

export const OFFER_STATUS_LABELS: Record<OfferComputedStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  scheduled: "Scheduled",
  expired: "Expired",
};

/** Maps a computed status onto the shared Badge variants. */
export const OFFER_STATUS_BADGE: Record<
  OfferComputedStatus,
  "success" | "destructive" | "info" | "warning"
> = {
  active: "success",
  inactive: "destructive",
  scheduled: "info",
  expired: "warning",
};

export const OFFER_TYPE_BADGE: Record<
  OfferType,
  "info" | "success" | "warning" | "secondary"
> = {
  percentage: "info",
  flat: "success",
  special_price: "warning",
  bxgy: "secondary",
};

/** How the discount reads in a table cell, e.g. "15% OFF" or "₹50 OFF". */
export function formatOfferDiscount(offer: {
  type: OfferType;
  value: number;
  buyQuantity?: number | null;
  getQuantity?: number | null;
}): string {
  switch (offer.type) {
    case "percentage":
      return `${offer.value}% OFF`;
    case "flat":
      return `₹${offer.value} OFF`;
    case "special_price":
      return `At ₹${offer.value}`;
    case "bxgy":
      return `Buy ${offer.buyQuantity ?? "?"} Get ${offer.getQuantity ?? "?"}`;
    default:
      return "-";
  }
}

/** The label the discount-value field takes for the selected offer type. */
export function offerValueFieldLabel(type: OfferType): string {
  switch (type) {
    case "percentage":
      return "Discount Percentage (%)";
    case "flat":
      return "Discount Amount (₹)";
    case "special_price":
      return "Special Offer Price (₹)";
    default:
      return "Discount Value";
  }
}

/**
 * Format a single offer date cleanly, including time when specified.
 */
export function formatOfferDate(
  value: string | Date | null | undefined,
  includeTime = true
): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const formattedDate = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (includeTime) {
    const formattedTime = date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${formattedDate}, ${formattedTime}`;
  }

  return formattedDate;
}

/**
 * Formats offer validity range with start date, end date, and their times.
 */
export function formatOfferValidity(
  startsAt: string | Date | null | undefined,
  endsAt: string | Date | null | undefined,
  includeTime = true
): string {
  if (!startsAt && !endsAt) return "—";
  if (!startsAt) return `Until ${formatOfferDate(endsAt, includeTime)}`;
  if (!endsAt) return `From ${formatOfferDate(startsAt, includeTime)}`;

  const startDate = startsAt instanceof Date ? startsAt : new Date(startsAt);
  const endDate = endsAt instanceof Date ? endsAt : new Date(endsAt);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return "—";

  const startFormatted = formatOfferDate(startDate, includeTime);
  const endFormatted = formatOfferDate(endDate, includeTime);

  if (startFormatted === endFormatted) {
    return startFormatted;
  }

  return `${startFormatted} — ${endFormatted}`;
}
