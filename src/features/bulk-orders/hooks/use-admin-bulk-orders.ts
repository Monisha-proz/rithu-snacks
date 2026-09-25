"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { adminBulkOrderKeys } from "@/lib/api/query-keys";
import {
  getAdminBulkOrders,
  getAdminBulkOrderDetail,
} from "../api/admin-bulk-order.api";
import type { AdminBulkOrderListInput } from "../validations/bulk-order.schema";
import type {
  AdminBulkOrderListResponse,
  BulkOrderEnquiryResponse,
} from "../types";

export interface UseAdminBulkOrdersOptions {
  refetchInterval?: number | false;
  enabled?: boolean;
}

export function useAdminBulkOrders(
  params?: Partial<AdminBulkOrderListInput>,
  options?: UseAdminBulkOrdersOptions
) {
  return useQuery<AdminBulkOrderListResponse>({
    queryKey: adminBulkOrderKeys.list(params as Record<string, unknown>),
    queryFn: () => getAdminBulkOrders(params),
    placeholderData: keepPreviousData,
    staleTime: 4 * 1000,
    refetchInterval: options?.refetchInterval !== undefined ? options.refetchInterval : 5000,
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true,
  });
}

export function useAdminBulkOrderDetail(uuid?: string | null) {
  return useQuery<BulkOrderEnquiryResponse>({
    queryKey: adminBulkOrderKeys.detail(uuid || ""),
    queryFn: () => getAdminBulkOrderDetail(uuid!),
    enabled: Boolean(uuid && uuid.trim().length > 0),
    staleTime: 10 * 1000,
  });
}
