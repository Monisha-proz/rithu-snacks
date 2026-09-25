import { apiClient } from "@/lib/api/api-client";
import type { DashboardFullData, TimePeriod } from "../types";

export type { DashboardStats, DashboardFullData, TimePeriod } from "../types";

export async function getDashboardFullData(period: TimePeriod = "this_month"): Promise<DashboardFullData> {
  const response = await apiClient.get<DashboardFullData>(`/api/dashboard/stats?period=${period}`);
  return response.data!;
}

// Backward-compatible alias
export async function getDashboardStats(): Promise<DashboardFullData["stats"]> {
  const data = await getDashboardFullData();
  return data.stats;
}
