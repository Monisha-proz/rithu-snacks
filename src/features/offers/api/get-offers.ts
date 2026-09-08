import { apiClient } from "@/lib/api/api-client";
import type { OfferListItem, GetOffersResult } from "../types";

export async function getOffers(params?: Record<string, string | number | boolean | undefined | null>) {
  const response = await apiClient.get<OfferListItem[]>("/api/offers", { params });
  return {
    data: response.data!,
    meta: response.meta!,
  } satisfies GetOffersResult;
}

export async function getOffer(id: number) {
  const response = await apiClient.get<OfferListItem>(`/api/offers/${id}`);
  return response;
}

export async function createOffer(data: Record<string, unknown>) {
  const response = await apiClient.post<OfferListItem>("/api/offers", data);
  return response;
}

export async function updateOffer(id: number, data: Record<string, unknown>) {
  const response = await apiClient.put<OfferListItem>(`/api/offers/${id}`, data);
  return response;
}

export async function deleteOffer(id: number) {
  const response = await apiClient.delete<null>(`/api/offers/${id}`);
  return response;
}
