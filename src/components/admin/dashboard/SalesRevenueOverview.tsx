"use client";

import * as React from "react";
import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import type { ChartDataPoint, OverviewMetrics } from "@/features/dashboard/types";
import { cn } from "@/lib/utils";
import { TrendingUp, ShieldCheck, ArrowDownRight } from "lucide-react";

interface SalesRevenueOverviewProps {
  data: ChartDataPoint[];
  overview: OverviewMetrics;
  periodLabel?: string;
}

export function SalesRevenueOverview({
  data,
  overview,
  periodLabel = "Current Cycle",
}: SalesRevenueOverviewProps) {
  const [viewMode, setViewMode] = useState<"revenue" | "volume">("revenue");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Find peak index by default if none hovered
  const peakIndex = data.findIndex((d) => d.isPeak);
  const activeIndex = hoveredIndex !== null ? hoveredIndex : peakIndex !== -1 ? peakIndex : data.length - 1;
  const activePoint = data[activeIndex] || data[0];

  // SVG dimensions
  const width = 1000;
  const height = 300;
  const paddingX = 50;
  const paddingY = 40;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Values calculation
  const values = data.map((d) => (viewMode === "revenue" ? d.revenue : d.orders));
  const maxVal = Math.max(...values, 1) * 1.2;
  const minVal = 0;

  // Coordinates calculation
  const points = data.map((d, i) => {
    const val = viewMode === "revenue" ? d.revenue : d.orders;
    const x = paddingX + (i / (data.length - 1 || 1)) * chartWidth;
    const y = height - paddingY - ((val - minVal) / (maxVal - minVal)) * chartHeight;
    return { x, y, data: d, val };
  });

  // Generate smooth cubic bezier SVG path string
  const generateSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    let path = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return path;
  };

  const linePath = generateSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1]?.x || width},${height - paddingY} L ${points[0]?.x || 0},${height - paddingY} Z`;

  // Grid levels
  const gridLevels = [0.8, 0.5, 0.2];

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs">
      {/* Top Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
              Sales &amp; Revenue Overview
            </h2>
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600">
              {periodLabel}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-stone-500">
            Tracking organic snacks demand across domestic dispatch zones
          </p>
        </div>

        {/* View Toggle */}
        <div className="inline-flex items-center rounded-xl bg-stone-100/90 p-1 border border-stone-200/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("revenue")}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
              viewMode === "revenue"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-500 hover:text-stone-900"
            )}
          >
            Revenue (₹)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("volume")}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
              viewMode === "volume"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-500 hover:text-stone-900"
            )}
          >
            Order Volume
          </button>
        </div>
      </div>

      {/* Sub-Metrics Row */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-stone-500">Average Order Value</span>
          <span className="mt-0.5 text-lg sm:text-xl font-bold text-stone-900">
            {formatPrice(overview.averageOrderValue)}
          </span>
          <span className="mt-1 flex items-center text-xs font-semibold text-emerald-600">
            <TrendingUp className="mr-1 h-3 w-3" />
            {overview.aovComparisonText}
          </span>
        </div>

        <div className="flex flex-col border-stone-100 sm:border-l sm:pl-4">
          <span className="text-xs font-medium text-stone-500">Gross Margin</span>
          <span className="mt-0.5 text-lg sm:text-xl font-bold text-stone-900">
            {overview.grossMarginPercent}%
          </span>
          <span className="mt-1 flex items-center text-xs font-semibold text-stone-600">
            <ShieldCheck className="mr-1 h-3 w-3 text-emerald-600" />
            {overview.grossMarginLabel}
          </span>
        </div>

        <div className="flex flex-col border-stone-100 sm:border-l sm:pl-4">
          <span className="text-xs font-medium text-stone-500">Return &amp; RTO Rate</span>
          <span className="mt-0.5 text-lg sm:text-xl font-bold text-stone-900">
            {overview.returnRtoRatePercent}%
          </span>
          <span className="mt-1 text-xs font-medium text-stone-500">
            {overview.returnRtoComparisonText}
          </span>
        </div>
      </div>

      {/* SVG Interactive Spline Chart */}
      <div className="relative mt-6 w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 sm:h-72 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Soft Gradient for Area */}
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.28" />
              <stop offset="50%" stopColor="#eab308" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.01" />
            </linearGradient>

            {/* Stroke Gradient */}
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#15803d" />
              <stop offset="55%" stopColor="#16a34a" />
              <stop offset="75%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines & scale ticks */}
          {gridLevels.map((lvl, idx) => {
            const yPos = height - paddingY - lvl * chartHeight;
            const labelVal = Math.round(maxVal * lvl);
            const displayLabel = viewMode === "revenue" ? `₹${Math.round(labelVal / 1000)}k` : `${labelVal}`;
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={yPos}
                  x2={width - paddingX}
                  y2={yPos}
                  stroke="#e7e5e4"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 10}
                  y={yPos + 4}
                  textAnchor="end"
                  className="text-[11px] fill-stone-400 font-medium"
                >
                  {displayLabel}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#areaGradient)" />

          {/* Main Spline Line */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active / Peak Drop line */}
          {points[activeIndex] && (
            <g>
              <line
                x1={points[activeIndex].x}
                y1={points[activeIndex].y}
                x2={points[activeIndex].x}
                y2={height - paddingY}
                stroke="#16a34a"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={points[activeIndex].x}
                cy={points[activeIndex].y}
                r="6"
                fill="#ffffff"
                stroke="#15803d"
                strokeWidth="3"
                className="transition-all duration-150"
              />
            </g>
          )}

          {/* Interactive Hover Zones */}
          {points.map((pt, i) => (
            <g
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              <rect
                x={pt.x - chartWidth / (points.length * 2)}
                y={0}
                width={chartWidth / points.length}
                height={height}
                fill="transparent"
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === i ? 5 : 3}
                fill="#ffffff"
                stroke="#15803d"
                strokeWidth="2"
                opacity={hoveredIndex === i || pt.data.isPeak ? 1 : 0.4}
              />
            </g>
          ))}
        </svg>

        {/* Floating Tooltip Bubble for Active/Peak Point */}
        {points[activeIndex] && (
          <div
            className="pointer-events-none absolute z-20 transition-all duration-200"
            style={{
              left: `${(points[activeIndex].x / width) * 100}%`,
              top: `${Math.max(10, (points[activeIndex].y / height) * 100 - 32)}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="rounded-xl bg-stone-900/95 px-3.5 py-2 text-white shadow-xl backdrop-blur-xs ring-1 ring-white/10 min-w-44 text-left">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-stone-300">
                  {points[activeIndex].data.date}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <div className="text-sm font-extrabold text-white mt-0.5">
                {viewMode === "revenue"
                  ? formatPrice(points[activeIndex].data.revenue)
                  : `${points[activeIndex].data.orders} Orders`}
              </div>
              <div className="text-[11px] text-stone-300 font-medium truncate mt-0.5">
                {points[activeIndex].data.orders} Orders &bull; Top: {points[activeIndex].data.topProduct || "Salem Banana Chips"}
              </div>
            </div>
          </div>
        )}

        {/* X-Axis Date Labels */}
        <div className="mt-2 flex justify-between px-6 text-[11px] font-semibold text-stone-500">
          {data.map((item, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={item.date}
                type="button"
                onClick={() => setHoveredIndex(idx)}
                className={cn(
                  "transition-colors text-center cursor-pointer",
                  isSelected
                    ? "font-bold text-emerald-700 underline underline-offset-4"
                    : "hover:text-stone-900"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
