import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/api-response";
import { createApiHandler } from "@/lib/api/api-handler";
import { getDashboardData } from "@/features/dashboard/repositories/dashboard.repository";
import type { TimePeriod } from "@/features/dashboard/types";

async function handleGetDashboardStats(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") as TimePeriod) || "this_month";
  const data = await getDashboardData(period);
  return apiSuccess(data);
}

export const GET = createApiHandler(
  { GET: handleGetDashboardStats },
  { requireAuth: true, requiredRole: ["ADMIN", "STAFF"] }
);
