"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardFullData, getDashboardStats } from "../api/get-stats";
import type { DashboardFullData, DashboardStats, TimePeriod } from "../types";

export function useDashboardData(period: TimePeriod = "this_month") {
  return useQuery<DashboardFullData>({
    queryKey: ["dashboard", "full-data", period],
    queryFn: () => getDashboardFullData(period),
    staleTime: 1000 * 60 * 2, // 2 minutes cache
    refetchOnWindowFocus: true,
  });
}

// Backward-compatible hook
export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: getDashboardStats,
  });
}
