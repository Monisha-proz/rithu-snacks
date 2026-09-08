"use client";

import { useQuery } from "@tanstack/react-query";
import { offerKeys } from "@/lib/api/query-keys";
import { getOffers, getOffer } from "../api/get-offers";
import type { GetOffersParams } from "../types";

export function useOffers(params?: GetOffersParams) {
  const queryParams: Record<string, string | number | boolean | undefined> = {};
  if (params?.page) queryParams.page = params.page;
  if (params?.limit) queryParams.limit = params.limit;
  if (params?.search) queryParams.search = params.search;
  if (params?.isActive !== undefined) queryParams.isActive = params.isActive;

  return useQuery({
    queryKey: offerKeys.list(queryParams),
    queryFn: () => getOffers(queryParams),
  });
}

export function useOffer(id: number | null) {
  return useQuery({
    queryKey: offerKeys.detail(id ?? ""),
    queryFn: () => getOffer(id!),
    enabled: id !== null,
  });
}

export { useCreateOffer, useUpdateOffer, useDeleteOffer } from "./use-offer-mutations";
