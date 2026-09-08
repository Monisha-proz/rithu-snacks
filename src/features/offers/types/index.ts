export type OfferType = "percentage" | "flat" | "bxgy";

export interface OfferListItem {
  id: number;
  name: string;
  type: OfferType;
  value: number;
  minOrderAmount: number | null;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  productUuids: string[];
}

export interface GetOffersParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface GetOffersResult {
  data: OfferListItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreateOfferInput {
  name: string;
  type: OfferType;
  value: number;
  minOrderAmount?: number;
  isActive?: boolean;
  startsAt?: Date;
  endsAt?: Date;
  productUuids: string[];
}

export type UpdateOfferInput = Partial<CreateOfferInput>;
