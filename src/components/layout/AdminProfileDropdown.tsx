"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/features/auth/api/auth.api";
import {
  LayoutDashboard,
  ShoppingBag,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export interface AdminProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail?: string | null;
  userRole?: string | null;
  userInitials: string;
  variant?: "desktop" | "mobile";
  className?: string;
}

export function AdminProfileDropdown({
  isOpen,
  onClose,
  userName,
  userEmail,
  userRole = "ADMIN",
  userInitials,
  variant = "desktop",
  className,
}: AdminProfileDropdownProps) {
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    onClose();
    await logoutUser("/login");
  };

  const isMobile = variant === "mobile";

  return (
    <>
      {isOpen && (
        <div
          className={cn(
            "z-50 w-72 sm:w-80 rounded-2xl bg-white border border-stone-200/90 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.18)] p-2.5 transition-all",
            isMobile
              ? "absolute bottom-full mb-3 right-1 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-150"
              : "absolute top-full mt-2.5 right-0 animate-in fade-in slide-in-from-top-2 duration-150",
            className
          )}
          role="menu"
          aria-orientation="vertical"
        >
          {/* Header Info Card */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50/80 border border-stone-100">
            <div className="w-10 h-10 rounded-full bg-theme-primary text-theme-primary-fg text-xs font-bold flex items-center justify-center border border-theme-border-accent shadow-2xs select-none shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-xs sm:text-sm text-theme-text-primary truncate">
                  {userName || "Administrator"}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 tracking-wide uppercase">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  {userRole === "STAFF" ? "Staff" : "Admin"}
                </span>
              </div>
              {userEmail && (
                <p className="text-[11px] text-theme-text-muted truncate mt-0.5">
                  {userEmail}
                </p>
              )}
            </div>
          </div>

          {/* Menu Options */}
          <div className="py-2 space-y-1">
            {/* Option 1: Admin Dashboard */}
            <button
              type="button"
              onClick={() => handleNavigate("/admin/dashboard")}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50/80 text-left transition-colors group cursor-pointer border border-transparent hover:border-amber-200/60"
              role="menuitem"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-theme-text-primary group-hover:text-amber-900 flex items-center gap-1">
                    <span>Admin Dashboard</span>
                  </div>
                  <p className="text-[11px] text-theme-text-muted group-hover:text-amber-700/80 truncate">
                    Manage orders, products & store
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
            </button>

            {/* Option 2: Customer Dashboard */}
            <button
              type="button"
              onClick={() => handleNavigate("/profile")}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/80 text-left transition-colors group cursor-pointer border border-transparent hover:border-emerald-200/60"
              role="menuitem"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-theme-text-primary group-hover:text-emerald-900 flex items-center gap-1">
                    <span>Customer Dashboard</span>
                  </div>
                  <p className="text-[11px] text-theme-text-muted group-hover:text-emerald-700/80 truncate">
                    My orders, addresses & account
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-stone-100 my-1" />

          {/* Sign Out Action */}
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            role="menuitem"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        description="Are you sure you want to sign out of your account?"
        confirmText="Sign Out"
        variant="destructive"
      />
    </>
  );
}

export default AdminProfileDropdown;
