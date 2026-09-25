"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, AlertTriangle, AlertCircle, RefreshCw } from "lucide-react";
import type { RestockAlertDto } from "@/features/dashboard/types";
import { cn } from "@/lib/utils";

interface RestockAlertsSectionProps {
  alerts: RestockAlertDto[];
}

export function RestockAlertsSection({ alerts }: RestockAlertsSectionProps) {
  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-100">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
              Restock &amp; Procurement Alerts
            </h2>
            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-rose-500/20">
              {alerts.length} Urgent Items
            </span>
          </div>
          <p className="mt-0.5 text-xs text-stone-500">
            Supplies falling below threshold safety buffers at the Central Dispatch Depot
          </p>
        </div>

        <Link
          href="/admin/dashboard/inventory"
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors shrink-0"
        >
          <span>Manage All Inventory</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Grid of Cards or Empty State */}
      {alerts.length === 0 ? (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-emerald-900 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">All Inventory Healthy</h3>
              <p className="text-xs text-emerald-700">No items are currently below safety reorder threshold buffers.</p>
            </div>
          </div>
          <Link
            href="/admin/dashboard/inventory"
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-2xs"
          >
            <span>View Inventory Levels</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {alerts.map((item) => {
            const isCritical = item.status === "critical";
            const isOut = item.status === "out_of_stock";
            const percent = Math.min(Math.round((item.available / (item.minThreshold || 1)) * 100), 100);

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-stone-200/80 bg-stone-50/50 p-4 shadow-2xs hover:bg-white hover:shadow-xs transition-all"
              >
                <div>
                  {/* Top: Name & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-xs sm:text-sm font-bold text-stone-900">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        SKU: {item.sku}
                      </p>
                    </div>

                    {/* Badge */}
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ring-1",
                        isOut
                          ? "bg-rose-100 text-rose-800 ring-rose-600/20"
                          : isCritical
                          ? "bg-rose-50 text-rose-700 ring-rose-500/20"
                          : "bg-amber-50 text-amber-700 ring-amber-600/20"
                      )}
                    >
                      {isOut ? "Out of Stock" : isCritical ? "Critical" : "Low Stock"}
                    </span>
                  </div>

                  {/* Stock Level comparison */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-600">
                        Available:{" "}
                        <strong
                          className={cn(
                            "font-bold",
                            item.available === 0 ? "text-rose-600" : "text-amber-600"
                          )}
                        >
                          {item.available} {item.unit}
                        </strong>
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Min: {item.minThreshold} {item.unit}
                      </span>
                    </div>

                    {/* Progress Meter */}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          item.available === 0
                            ? "w-0"
                            : isCritical
                            ? "bg-rose-600"
                            : "bg-amber-500"
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-4 pt-3 border-t border-stone-200/60">
                  <Link
                    href={`/admin/dashboard/inventory`}
                    className={cn(
                      "flex w-full items-center justify-center rounded-lg px-3 py-1.5 text-xs font-bold transition-all shadow-2xs",
                      isCritical || isOut
                        ? "bg-[var(--secondary-base,#7a2224)] text-white hover:bg-[var(--secondary-shade-200,#4a140d)]"
                        : "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400"
                    )}
                  >
                    {item.actionLabel}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
