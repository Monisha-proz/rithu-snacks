"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">
      {/* 8 KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-stone-200/80 bg-white p-4.5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20 bg-stone-200" />
              <Skeleton className="h-8 w-8 rounded-xl bg-stone-200" />
            </div>
            <Skeleton className="h-8 w-28 bg-stone-200" />
            <Skeleton className="h-3 w-36 bg-stone-100" />
          </div>
        ))}
      </div>

      {/* Sales Overview Chart Skeleton */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-48 bg-stone-200" />
            <Skeleton className="h-3 w-64 bg-stone-100" />
          </div>
          <Skeleton className="h-8 w-36 rounded-xl bg-stone-200" />
        </div>
        <div className="grid grid-cols-3 gap-4 pt-2">
          <Skeleton className="h-12 w-full bg-stone-100 rounded-xl" />
          <Skeleton className="h-12 w-full bg-stone-100 rounded-xl" />
          <Skeleton className="h-12 w-full bg-stone-100 rounded-xl" />
        </div>
        <Skeleton className="h-56 sm:h-72 w-full rounded-2xl bg-stone-100" />
      </div>

      {/* Two Column Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 sm:p-6 space-y-4">
          <Skeleton className="h-5 w-32 bg-stone-200" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full bg-stone-100 rounded-lg" />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 sm:p-6 space-y-4">
          <Skeleton className="h-5 w-40 bg-stone-200" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <Skeleton className="h-10 w-10 rounded-xl bg-stone-200" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-32 bg-stone-200" />
                  <Skeleton className="h-2.5 w-20 bg-stone-100" />
                </div>
                <Skeleton className="h-6 w-16 bg-stone-200" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Skeleton */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-44 bg-stone-200" />
          <Skeleton className="h-7 w-28 bg-stone-100 rounded-lg" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full bg-stone-100 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
