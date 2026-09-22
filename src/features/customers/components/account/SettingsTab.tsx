"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/Toast";

export function SettingsTab() {
  const [prefs, setPrefs] = useState({
    whatsapp: true,
    festiveOffers: true,
    newsletter: false,
    restock: true,
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    field: string,
    val: string
  ) => {
    setter(val);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!currentPassword.trim()) {
      errors.currentPassword = "Current password is required";
    }
    if (!newPassword.trim()) {
      errors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      errors.newPassword = "New password must be at least 6 characters long";
    }
    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Confirm password is required";
    } else if (newPassword && newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return;
    }

    // Success feedback via floating toast (top-right)
    toast.success("Password changed successfully.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setFieldErrors({});
  };

  const notificationOptions = [
    {
      key: "whatsapp" as const,
      label: "Order updates on WhatsApp",
      hint: "Dispatch, live delivery, and delay alerts sent directly to your phone",
    },
    {
      key: "festiveOffers" as const,
      label: "Festive offers & pre-book alerts",
      hint: "Diwali, Pongal, and seasonal homemade snack drops",
    },
    {
      key: "newsletter" as const,
      label: "Email newsletter",
      hint: "Traditional recipes and newly added snacks twice a month",
    },
    {
      key: "restock" as const,
      label: "Restock reminders",
      hint: "Notifications when a saved wishlist item is back in stock",
    },
  ];

  return (
    <div className="flex flex-col gap-5 min-w-0">
      {/* Notifications Preferences */}
      <div className="bg-theme-surface border border-theme-border rounded-2xl overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-theme-border-subtle bg-theme-surface-alt">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-theme-text-secondary">
            Notification Preferences
          </h2>
        </div>

        <div className="flex flex-col divide-y divide-theme-border-subtle">
          {notificationOptions.map((opt) => {
            const isChecked = prefs[opt.key];

            return (
              <div
                key={opt.key}
                className="flex items-center justify-between gap-4 p-4 sm:p-5"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs sm:text-sm font-semibold text-theme-text-primary">
                    {opt.label}
                  </div>
                  <div className="text-xs text-theme-text-muted font-light mt-0.5">
                    {opt.hint}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPrefs({ ...prefs, [opt.key]: !isChecked })}
                  className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center flex-shrink-0 cursor-pointer ${
                    isChecked ? "bg-theme-status-del-fg justify-end" : "bg-theme-border justify-start"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white block shadow-xs" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-theme-surface border border-theme-border rounded-2xl overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-theme-border-subtle bg-theme-surface-alt">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-theme-text-secondary">
            Change Password
          </h2>
        </div>

        <form onSubmit={handlePasswordSubmit} noValidate className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="currentPassword"
                className="text-[11px] font-semibold uppercase tracking-wider text-theme-text-muted"
              >
                Current Password <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <Input
                id="currentPassword"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => handleFieldChange(setCurrentPassword, "currentPassword", e.target.value)}
                placeholder="Enter current password"
                className={`bg-theme-surface-warm min-h-[44px] ${
                  fieldErrors.currentPassword ? "border-red-500 bg-red-50/20" : ""
                }`}
              />
              {fieldErrors.currentPassword && (
                <span className="text-xs text-red-500 font-medium">{fieldErrors.currentPassword}</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="newPassword"
                className="text-[11px] font-semibold uppercase tracking-wider text-theme-text-muted"
              >
                New Password <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <Input
                id="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => handleFieldChange(setNewPassword, "newPassword", e.target.value)}
                placeholder="Enter new password"
                className={`bg-theme-surface-warm min-h-[44px] ${
                  fieldErrors.newPassword ? "border-red-500 bg-red-50/20" : ""
                }`}
              />
              {fieldErrors.newPassword && (
                <span className="text-xs text-red-500 font-medium">{fieldErrors.newPassword}</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="confirmPassword"
                className="text-[11px] font-semibold uppercase tracking-wider text-theme-text-muted"
              >
                Confirm Password <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => handleFieldChange(setConfirmPassword, "confirmPassword", e.target.value)}
                placeholder="Re-enter new password"
                className={`bg-theme-surface-warm min-h-[44px] ${
                  fieldErrors.confirmPassword ? "border-red-500 bg-red-50/20" : ""
                }`}
              />
              {fieldErrors.confirmPassword && (
                <span className="text-xs text-red-500 font-medium">{fieldErrors.confirmPassword}</span>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="bg-theme-secondary hover:bg-theme-secondary-hover text-theme-secondary-fg text-xs font-semibold uppercase tracking-wider py-3.5 px-7 rounded-lg transition-colors cursor-pointer min-h-[44px]"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
