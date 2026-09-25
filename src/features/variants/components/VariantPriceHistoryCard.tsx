"use client";

import React, { useState, useMemo } from "react";
import {
  History,
  BarChart3,
  List,
  User,
  IndianRupee,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { variantKeys } from "@/lib/api/query-keys";
import { useVariantPriceHistory } from "../hooks";
import type {
  AdminVariantResponse,
  VariantPriceHistoryResponse,
  VariantUnitPriceResponse,
} from "../types";

export interface VariantPriceHistoryCardProps {
  variant: AdminVariantResponse;
  gstPercent?: number;
}

type RangeOption = "30D" | "6M" | "1Y";

const RANGE_OPTIONS: { label: string; value: RangeOption; desc: string }[] = [
  { label: "30 Days", value: "30D", desc: "5-day intervals, last 30 days" },
  { label: "6 Months", value: "6M", desc: "monthly average, last 6 months" },
  { label: "1 Year", value: "1Y", desc: "monthly average, last 12 months" },
];

const VARIANT_COLORS = [
  {
    name: "emerald",
    bg: "bg-emerald-600",
    text: "text-emerald-700",
    border: "border-emerald-500",
    dot: "bg-emerald-500",
    hex: "#059669",
  },
  {
    name: "indigo",
    bg: "bg-indigo-600",
    text: "text-indigo-700",
    border: "border-indigo-500",
    dot: "bg-indigo-500",
    hex: "#4f46e5",
  },
  {
    name: "amber",
    bg: "bg-amber-600",
    text: "text-amber-700",
    border: "border-amber-500",
    dot: "bg-amber-500",
    hex: "#d97706",
  },
  {
    name: "rose",
    bg: "bg-rose-600",
    text: "text-rose-700",
    border: "border-rose-500",
    dot: "bg-rose-500",
    hex: "#e11d48",
  },
  {
    name: "teal",
    bg: "bg-teal-600",
    text: "text-teal-700",
    border: "border-teal-500",
    dot: "bg-teal-500",
    hex: "#0d9488",
  },
];

function getUnitLabel(up: VariantUnitPriceResponse | null | undefined): string {
  if (!up) return "Variant";
  const val = up.measurement?.value ?? "";
  const unit = up.unitCode || up.measurement?.unit || "";
  if (val && unit) return `${val} ${unit}`;
  if (val) return String(val);
  if (unit) return unit;
  return up.sku || "Variant";
}

function formatChartDate(monthStr: string): { label: string; fullDate: string } {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const parts = monthStr.split("-");

  if (parts.length === 3) {
    const [yearStr, monthNumStr, dayNumStr] = parts;
    const mIdx = parseInt(monthNumStr, 10) - 1;
    const mName = months[mIdx] || monthNumStr;
    const day = parseInt(dayNumStr, 10);
    return {
      label: `${day} ${mName}`,
      fullDate: `${day} ${mName} ${yearStr}`,
    };
  }

  if (parts.length === 2) {
    const [yearStr, monthNumStr] = parts;
    const mIdx = parseInt(monthNumStr, 10) - 1;
    const mName = months[mIdx] || monthNumStr;
    return {
      label: mName,
      fullDate: `${mName} ${yearStr}`,
    };
  }

  return { label: monthStr, fullDate: monthStr };
}

export function VariantPriceHistoryCard({
  variant,
  gstPercent = 18,
}: VariantPriceHistoryCardProps) {
  const unitPrices = useMemo(() => variant.unitPrices ?? [], [variant.unitPrices]);

  // "all" shows both/all variants side-by-side; or a specific unitPrice.id
  const [selectedView, setSelectedView] = useState<"all" | string>(
    unitPrices.length > 1 ? "all" : (unitPrices[0]?.id ?? "")
  );

  // Active unit for single-variant cards (Pricing & Tax Breakdown, Timeline List)
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);

  const activeUnitPrice = useMemo(() => {
    return (
      unitPrices.find(
        (up) =>
          up.id ===
          (activeUnitId || (selectedView !== "all" ? selectedView : null))
      ) ??
      unitPrices.find((up) => up.isDefault) ??
      unitPrices[0] ??
      null
    );
  }, [unitPrices, activeUnitId, selectedView]);

  const [activeTab, setActiveTab] = useState<"graph" | "list">("graph");
  const [range, setRange] = useState<RangeOption>("1Y");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const periodApiVal = useMemo(() => {
    if (range === "30D") return "1m";
    if (range === "6M") return "6m";
    return "1y";
  }, [range]);

  const activeRangeDesc = useMemo(() => {
    return (
      RANGE_OPTIONS.find((r) => r.value === range)?.desc ??
      "monthly average, last 12 months"
    );
  }, [range]);

  // Parallel chart queries for all unit prices
  const chartQueries = useQueries({
    queries: unitPrices.map((up) => ({
      queryKey: [
        ...variantKeys.all,
        "price-history-chart",
        up.id,
        periodApiVal,
      ] as const,
      queryFn: async () => {
        const { getVariantPriceHistoryChart } = await import(
          "../api/get-variants"
        );
        return getVariantPriceHistoryChart(up.id, periodApiVal);
      },
      enabled: !!up.id,
    })),
  });

  // Timeline list data for the active unit
  const { data: historyApiResponse, isLoading: isLoadingHistory } =
    useVariantPriceHistory(activeUnitPrice?.id ?? null, {
      pageSize: 50,
      sortOrder: "desc",
    });

  const rawHistoryList: VariantPriceHistoryResponse[] = useMemo(() => {
    return (historyApiResponse?.data as VariantPriceHistoryResponse[]) ?? [];
  }, [historyApiResponse]);

  // Pricing calculations for the active unit
  const basePrice = Number(activeUnitPrice?.basePrice) || 0;
  const gstAmount = Math.round((basePrice * gstPercent) / (100 + gstPercent));
  const taxableValue = basePrice - gstAmount;

  // Build unified multi-variant timeline data
  const timelinePoints = useMemo(() => {
    const primaryItems = chartQueries.find((q) => q.data && q.data.length > 0)?.data;

    let dateKeys: string[] = [];

    if (primaryItems && primaryItems.length > 0) {
      dateKeys = primaryItems.map((item) => item.month);
    } else {
      const now = new Date();
      if (range === "30D") {
        const dayIntervals = [29, 24, 19, 14, 9, 4, 0];
        dateKeys = dayIntervals.map((daysAgo) => {
          const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}`;
        });
      } else {
        const count = range === "6M" ? 6 : 12;
        for (let i = count - 1; i >= 0; i--) {
          const d = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)
          );
          const y = d.getUTCFullYear();
          const m = String(d.getUTCMonth() + 1).padStart(2, "0");
          dateKeys.push(`${y}-${m}`);
        }
      }
    }

    return dateKeys.map((dateKey, ptIdx) => {
      const formatted = formatChartDate(dateKey);

      const variantItems = unitPrices.map((up, vIdx) => {
        const qData = chartQueries[vIdx]?.data;
        const matched =
          qData?.find((item) => item.month === dateKey) ?? qData?.[ptIdx];
        const price = matched ? matched.price : Number(up.basePrice) || 0;
        const color = VARIANT_COLORS[vIdx % VARIANT_COLORS.length];

        return {
          unitPriceId: up.id,
          unitName: getUnitLabel(up),
          sku: up.sku,
          isDefault: !!up.isDefault,
          price,
          color,
        };
      });

      return {
        dateKey,
        label: formatted.label,
        fullDate: formatted.fullDate,
        variants: variantItems,
      };
    });
  }, [chartQueries, unitPrices, range]);

  // Determine min, max, span for bar heights
  const { maxVal, minVal, span } = useMemo(() => {
    let allPrices: number[] = [];

    if (selectedView === "all") {
      allPrices = timelinePoints.flatMap((tp) =>
        tp.variants.map((v) => v.price)
      );
    } else {
      allPrices = timelinePoints.flatMap((tp) =>
        tp.variants
          .filter((v) => v.unitPriceId === selectedView)
          .map((v) => v.price)
      );
    }

    if (allPrices.length === 0) {
      allPrices = unitPrices.map((up) => Number(up.basePrice) || 0);
    }

    const max = Math.max(...allPrices, 1);
    const min = Math.min(...allPrices);
    return {
      maxVal: max,
      minVal: min,
      span: Math.max(1, max - min),
    };
  }, [timelinePoints, selectedView, unitPrices]);

  if (unitPrices.length === 0) {
    return (
      <div className="bg-white border border-cream-border rounded-2xl overflow-hidden shadow-xs p-6 text-center text-xs text-neutral-500">
        No unit / price combinations have been added for this item yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. PRICING & GST BREAKDOWN CARD */}
      <div className="bg-white border border-cream-border rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-cream-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-secondary-600" />
            <h2 className="text-[15px] font-bold text-neutral-900 tracking-tight">
              Pricing Overview & Tax Breakdown
            </h2>
          </div>

          {/* Unit selector dropdown inside Pricing Overview */}
          {unitPrices.length > 1 && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="pricing-unit-select"
                className="text-xs font-semibold text-neutral-500 whitespace-nowrap"
              >
                Variant:
              </label>
              <div className="relative">
                <select
                  id="pricing-unit-select"
                  value={activeUnitPrice?.id}
                  onChange={(e) => {
                    const id = e.target.value;
                    setActiveUnitId(id);
                    setSelectedView(id);
                  }}
                  className="bg-cream-50 border border-cream-border rounded-xl px-3 py-1.5 text-xs font-bold text-neutral-800 shadow-2xs hover:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-500/20 pr-8 cursor-pointer appearance-none"
                >
                  {unitPrices.map((up) => (
                    <option key={up.id} value={up.id}>
                      {getUnitLabel(up)} — ₹{(Number(up.basePrice) || 0).toLocaleString("en-IN")}
                      {up.isDefault ? " (Default)" : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Base Price */}
          <div className="border-2 border-secondary-200 bg-secondary-50/40 rounded-xl p-4 flex flex-col justify-between gap-1 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-secondary-800 uppercase">
                Base Price ({getUnitLabel(activeUnitPrice)})
              </span>
              {activeUnitPrice?.isDefault && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  Default
                </span>
              )}
            </div>
            <span className="text-xl sm:text-2xl font-bold text-secondary-900 font-mono">
              ₹{basePrice.toLocaleString("en-IN")}.00
            </span>
            <span className="text-[11px] text-secondary-700 font-medium">
              Selling price on the storefront is computed from this minus any
              active offer/discount
            </span>
          </div>

          {/* SKU */}
          <div className="border border-cream-border rounded-xl p-4 bg-cream-50/40 flex flex-col justify-between gap-1">
            <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
              SKU
            </span>
            <span className="text-lg font-bold text-neutral-900 font-mono">
              {activeUnitPrice?.sku || "—"}
            </span>
            <span className="text-[11px] text-neutral-500 font-medium">
              Pack Size: {getUnitLabel(activeUnitPrice)}
            </span>
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="border border-cream-border-subtle rounded-xl divide-y divide-cream-border-subtle bg-cream-50/30 text-xs sm:text-sm">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-neutral-500 font-medium">Taxable Value</span>
              <span className="font-bold text-neutral-900 font-mono">
                ₹{taxableValue.toLocaleString("en-IN")}.00
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-neutral-500 font-medium">
                GST @ {gstPercent}% (CGST {gstPercent / 2}% + SGST{" "}
                {gstPercent / 2}%)
              </span>
              <span className="font-bold text-neutral-900 font-mono">
                ₹{gstAmount.toLocaleString("en-IN")}.00
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 bg-secondary-50/60 font-semibold text-secondary-900">
              <span className="font-bold">Base Price (Inclusive of GST)</span>
              <span className="font-bold text-base font-mono">
                ₹{basePrice.toLocaleString("en-IN")}.00
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PRICE HISTORY CARD (GRAPH & TIMELINE LIST) */}
      <div className="bg-white border border-cream-border rounded-2xl overflow-hidden shadow-xs">
        {/* Card Header with Dropdown on the right */}
        <div className="px-6 py-4 border-b border-cream-border flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-secondary-600" />
            <h2 className="text-[15px] font-bold text-neutral-900 tracking-tight">
              Price History & Timeline
            </h2>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* VARIANT SELECT DROPDOWN */}
            {unitPrices.length > 1 && (
              <div className="flex items-center gap-1.5">
                <label
                  htmlFor="history-variant-dropdown"
                  className="text-xs font-semibold text-neutral-500 whitespace-nowrap"
                >
                  Variant:
                </label>
                <div className="relative">
                  <select
                    id="history-variant-dropdown"
                    value={selectedView}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedView(val);
                      if (val !== "all") {
                        setActiveUnitId(val);
                      }
                    }}
                    className="bg-cream-50 border border-cream-border rounded-xl px-3 py-1.5 text-xs font-bold text-neutral-800 shadow-2xs hover:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-500/20 pr-8 cursor-pointer appearance-none"
                  >
                    <option value="all">
                      All Variants (Compare Both)
                    </option>
                    {unitPrices.map((up) => (
                      <option key={up.id} value={up.id}>
                        {getUnitLabel(up)} — ₹{(Number(up.basePrice) || 0).toLocaleString("en-IN")}{up.isDefault ? " (Default)" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* View Tab Toggle (Graph vs Timeline List) */}
            <div className="flex items-center p-1 bg-cream-200 border border-cream-border rounded-xl gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab("graph")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "graph"
                    ? "bg-secondary-600 text-cream-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-white"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Graph</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("list")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "list"
                    ? "bg-secondary-600 text-cream-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-white"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Timeline List</span>
              </button>
            </div>
          </div>
        </div>

        {activeTab === "graph" && (
          <div className="p-6">
            {/* Summary Row: Left Side Price badges, Right Side 30D / 6M / 1Y range filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              {/* Dynamic Price Display */}
              {selectedView === "all" ? (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-neutral-400">
                    Comparing {unitPrices.length} Variants
                  </span>
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                    {unitPrices.map((up, idx) => {
                      const color = VARIANT_COLORS[idx % VARIANT_COLORS.length];
                      const p = Number(up.basePrice) || 0;
                      return (
                        <div
                          key={up.id}
                          className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-cream-border shadow-2xs"
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${color.bg}`} />
                          <span className="text-xs font-bold text-neutral-700">
                            {getUnitLabel(up)}:
                          </span>
                          <span className="text-base sm:text-lg font-bold text-neutral-900 font-mono">
                            ₹{p.toLocaleString("en-IN")}.00
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-neutral-400">
                    Base price comparison · {activeRangeDesc}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-bold text-neutral-900 font-mono">
                      ₹
                      {(
                        Number(
                          unitPrices.find((up) => up.id === selectedView)
                            ?.basePrice || basePrice
                        ) || 0
                      ).toLocaleString("en-IN")}
                      .00
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-secondary-50 text-secondary-700 border border-secondary-200">
                      {getUnitLabel(
                        unitPrices.find((up) => up.id === selectedView) ||
                          activeUnitPrice
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Base price trend · {activeRangeDesc}
                  </p>
                </div>
              )}

              {/* Range Filter Buttons: 30 Days | 6 Months | 1 Year */}
              <div className="flex items-center gap-1 bg-cream-100 p-1 rounded-xl border border-cream-border shadow-2xs self-start sm:self-auto">
                {RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRange(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      range === opt.value
                        ? "bg-secondary-600 text-cream-white shadow-xs"
                        : "text-neutral-500 hover:text-neutral-900 hover:bg-white"
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CHART CANVAS */}
            <div className="rounded-2xl bg-cream-50/50 border border-cream-border p-5 overflow-x-auto">
              <div className="min-w-max">
                {/* Single unified flex row for all columns: Bars + Date aligned together */}
                <div className="flex items-end gap-3 sm:gap-6 pb-2 border-b border-cream-border">
                  {timelinePoints.map((pt, idx) => {
                    const isHot = hoveredIndex === idx;

                    const renderedVariants =
                      selectedView === "all"
                        ? pt.variants
                        : pt.variants.filter(
                            (v) => v.unitPriceId === selectedView
                          );

                    const colWidth =
                      selectedView === "all"
                        ? Math.max(68, renderedVariants.length * 38)
                        : 60;

                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className="flex flex-col items-center relative group cursor-pointer"
                        style={{ width: `${colWidth}px` }}
                      >
                        {/* Hover Tooltip */}
                        {isHot && (
                          <div className="absolute z-30 bottom-[180px] mb-2 left-1/2 -translate-x-1/2 rounded-xl bg-neutral-900 text-white px-3.5 py-2 text-left shadow-xl pointer-events-none whitespace-nowrap border border-neutral-700 animate-in fade-in-0 duration-150">
                            <div className="text-[10px] text-neutral-300 font-semibold mb-1 pb-1 border-b border-neutral-800">
                              {pt.fullDate}
                            </div>
                            <div className="space-y-1">
                              {renderedVariants.map((v) => (
                                <div
                                  key={v.unitPriceId}
                                  className="flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`w-2 h-2 rounded-full ${v.color.bg}`}
                                    />
                                    <span className="text-neutral-300">
                                      {v.unitName}:
                                    </span>
                                  </div>
                                  <span className="font-bold font-mono text-emerald-400">
                                    ₹{v.price.toLocaleString("en-IN")}.00
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Chart Area - Fixed height 150px, flex items-end ensures bars stick to baseline */}
                        <div className="h-[150px] w-full flex items-end justify-center gap-2">
                          {renderedVariants.map((v) => {
                            // Calculate explicit height in pixels (from 28px min to 118px max)
                            const barHeightPx =
                              span > 0
                                ? Math.round(
                                    28 + ((v.price - minVal) / span) * 90
                                  )
                                : 65;

                            const barWidth =
                              selectedView === "all" ? "w-7 sm:w-8" : "w-10 sm:w-12";

                            return (
                              <div
                                key={v.unitPriceId}
                                className={`flex flex-col items-center justify-end ${barWidth}`}
                              >
                                {/* Price label above the bar */}
                                <span
                                  className={`text-[9.5px] sm:text-[10px] font-mono font-semibold mb-1 transition-colors whitespace-nowrap ${
                                    isHot
                                      ? "text-neutral-900 font-bold"
                                      : "text-neutral-500"
                                  }`}
                                >
                                  ₹{v.price}
                                </span>

                                {/* The Bar itself with explicit height in pixels */}
                                <div
                                  style={{ height: `${barHeightPx}px` }}
                                  className={`w-full rounded-t-lg transition-all duration-200 ${
                                    v.color.bg
                                  } ${
                                    isHot
                                      ? "brightness-110 shadow-md scale-y-[1.02]"
                                      : "shadow-2xs opacity-95 hover:opacity-100"
                                  }`}
                                />
                              </div>
                            );
                          })}
                        </div>

                        {/* Date label directly beneath this exact column */}
                        <div className="mt-2.5 text-center text-[11px] font-semibold text-neutral-500 whitespace-nowrap">
                          {pt.label}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend below the chart when comparing all */}
                {selectedView === "all" && unitPrices.length > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-4 mt-2 flex-wrap text-xs">
                    <span className="text-neutral-400 font-medium text-[11px]">
                      Legend:
                    </span>
                    {unitPrices.map((up, idx) => {
                      const color = VARIANT_COLORS[idx % VARIANT_COLORS.length];
                      const p = Number(up.basePrice) || 0;
                      return (
                        <button
                          key={up.id}
                          type="button"
                          onClick={() => {
                            setSelectedView(up.id);
                            setActiveUnitId(up.id);
                          }}
                          className="flex items-center gap-1.5 font-medium text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer bg-white px-2.5 py-1 rounded-md border border-cream-border shadow-2xs hover:border-secondary-400"
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${color.bg}`}
                          />
                          <span className="font-bold">{getUnitLabel(up)}</span>
                          <span className="font-mono text-neutral-400">
                            (₹{p.toLocaleString("en-IN")})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "list" && (
          <div className="p-6">
            {/* Dropdown in Timeline List View when there are multiple variants */}
            {unitPrices.length > 1 && (
              <div className="mb-5 pb-4 border-b border-cream-border flex items-center justify-between gap-3 flex-wrap">
                <span className="text-xs font-semibold text-neutral-500">
                  Showing audit log for:
                </span>
                <div className="relative">
                  <select
                    value={activeUnitPrice?.id}
                    onChange={(e) => setActiveUnitId(e.target.value)}
                    className="bg-cream-50 border border-cream-border rounded-xl px-3 py-1.5 text-xs font-bold text-neutral-800 shadow-2xs hover:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-500/20 pr-8 cursor-pointer appearance-none"
                  >
                    {unitPrices.map((up) => (
                      <option key={up.id} value={up.id}>
                        {getUnitLabel(up)} — ₹{(Number(up.basePrice) || 0).toLocaleString("en-IN")}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {isLoadingHistory ? (
              <div className="py-12 text-center text-xs text-neutral-400">
                Loading price history timeline...
              </div>
            ) : rawHistoryList.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center gap-2">
                <History className="w-8 h-8 text-neutral-300" />
                <p className="text-sm font-bold text-neutral-800">
                  Initial Price Recorded for {getUnitLabel(activeUnitPrice)}
                </p>
                <p className="text-xs text-neutral-400 max-w-sm">
                  This unit price is currently ₹{basePrice.toLocaleString("en-IN")}.
                  Historical revisions will appear here when this pack size's base price is
                  modified.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-cream-border">
                {rawHistoryList.map((item, idx) => {
                  const changedDateStr = item.changedAt
                    ? new Date(item.changedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "—";

                  const oldBase = item.oldPrice ?? item.oldBasePrice ?? null;
                  const newBase = item.newPrice ?? item.newBasePrice ?? null;

                  const isPriceReduced =
                    oldBase !== null && newBase !== null && newBase < oldBase;
                  const isPriceIncreased =
                    oldBase !== null && newBase !== null && newBase > oldBase;

                  return (
                    <div key={item.id || idx} className="relative group">
                      <span
                        className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                          idx === 0
                            ? "bg-secondary-600 text-white"
                            : "bg-cream-200 text-neutral-500"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      </span>

                      <div className="rounded-xl border border-cream-border p-4 bg-white hover:bg-cream-50/50 transition-colors shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-neutral-900">
                              {newBase !== null && oldBase !== null
                                ? `Base Price: ₹${oldBase} → ₹${newBase}`
                                : newBase !== null
                                ? `Base Price set to ₹${newBase}`
                                : "Price Revised"}
                            </span>

                            {isPriceReduced && (
                              <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                <ArrowDownRight className="w-3 h-3 mr-0.5" />
                                Reduced
                              </span>
                            )}

                            {isPriceIncreased && (
                              <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                                Increased
                              </span>
                            )}
                          </div>

                          <span className="text-xs text-neutral-400 font-medium">
                            {changedDateStr}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                          <User className="w-3.5 h-3.5 opacity-60" />
                          <span>
                            Changed by:{" "}
                            <strong className="text-neutral-700">
                              {item.changedBy?.name || "Admin / Operations Team"}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default VariantPriceHistoryCard;
