"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CompanySettingsForm } from "@/features/company";
import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Settings"
        subtitle="Manage company profile, contact information, branding, and tax compliance details"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Settings" },
        ]}
      />

      <CompanySettingsForm />
    </div>
  );
}
