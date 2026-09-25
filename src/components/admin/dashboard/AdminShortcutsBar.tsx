"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, FolderPlus, Truck, Users, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminShortcutsBar() {
  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-4.5 sm:p-5 shadow-2xs">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
          Store Administration Shortcuts
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* 1. Add Product (Primary Highlight) */}
        <Link
          href="/admin/dashboard/products/create"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--secondary-base,#7a2224)] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[var(--secondary-shade-200,#4a140d)] transition-all shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </Link>

        {/* 2. New Category */}
        <Link
          href="/admin/dashboard/categories/create"
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-white hover:text-stone-900 hover:border-stone-300 transition-all shrink-0 cursor-pointer"
        >
          <FolderPlus className="h-4 w-4 text-stone-500" />
          <span>New Category</span>
        </Link>

        {/* 3. Shipment Manifest */}
        <Link
          href="/admin/dashboard/orders"
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-white hover:text-stone-900 hover:border-stone-300 transition-all shrink-0 cursor-pointer"
        >
          <Truck className="h-4 w-4 text-stone-500" />
          <span>Shipment Manifest</span>
        </Link>

        {/* 4. Customer CRM */}
        <Link
          href="/admin/dashboard/customers"
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-white hover:text-stone-900 hover:border-stone-300 transition-all shrink-0 cursor-pointer"
        >
          <Users className="h-4 w-4 text-stone-500" />
          <span>Customer CRM</span>
        </Link>

        {/* 5. Batch GST Report */}
        <Link
          href="/admin/dashboard/reports"
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-white hover:text-stone-900 hover:border-stone-300 transition-all shrink-0 cursor-pointer"
        >
          <FileText className="h-4 w-4 text-stone-500" />
          <span>Batch GST Report</span>
        </Link>
      </div>
    </div>
  );
}
