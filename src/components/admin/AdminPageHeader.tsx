"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AdminBreadcrumb, type BreadcrumbItem } from "./AdminBreadcrumb";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode | BreadcrumbItem[];
  children?: React.ReactNode;
  className?: string;
}

function AdminPageHeader({
  title,
  description,
  subtitle,
  actions,
  breadcrumbs,
  children,
  className,
}: AdminPageHeaderProps) {
  const renderedBreadcrumbs = Array.isArray(breadcrumbs) ? (
    <AdminBreadcrumb items={breadcrumbs} />
  ) : (
    breadcrumbs
  );
  const displayDescription = description || subtitle;

  return (
    <div className={cn("space-y-3 sm:space-y-4 flex-shrink-0 min-w-0 w-full", className)}>
      {renderedBreadcrumbs}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">{title}</h1>
          {displayDescription && (
            <p className="mt-1 text-xs sm:text-sm text-gray-500 leading-relaxed">{displayDescription}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

interface AdminContentProps {
  children: React.ReactNode;
  className?: string;
}

function AdminContent({ children, className }: AdminContentProps) {
  return (
    <div className={cn("mt-3 sm:mt-5 flex-1 min-h-0 min-w-0 flex flex-col w-full", className)}>
      {children}
    </div>
  );
}

export { AdminPageHeader, AdminContent };
export type { AdminPageHeaderProps, AdminContentProps };
