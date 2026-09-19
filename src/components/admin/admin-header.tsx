"use client";

import { Bell, Menu, ShoppingBag, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/common/dropdown";
import { useSession } from "next-auth/react";
import { logoutUser } from "@/features/auth/api/auth.api";
import { getInitials } from "@/lib/utils";

interface AdminHeaderProps {
  onMenuClick: () => void;
}

function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await logoutUser("/admin/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 lg:hidden">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="font-hanken text-secondary-600 text-lg font-semibold">Admin Dashboard</h1>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-neutral-600">
          <Bell className="h-5 w-5" />
        </Button>

        <Dropdown
          trigger={
            <Button variant="ghost" className="flex items-center gap-2">
              <div className="bg-secondary-600 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white">
                {session?.user?.name ? getInitials(session.user.name) : "A"}
              </div>
              <span className="hidden text-sm md:inline">{session?.user?.name || "Admin"}</span>
            </Button>
          }
        >
          <DropdownItem onClick={() => router.push("/")}>
            <span className="flex items-center gap-2 text-xs">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
              Customer Pages
            </span>
          </DropdownItem>
          <DropdownItem onClick={() => router.push("/profile")}>
            <span className="flex items-center gap-2 text-xs">
              Customer Account
            </span>
          </DropdownItem>
          <DropdownItem onClick={handleLogout}>
            <span className="flex items-center gap-2 text-xs text-red-600">
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </span>
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}

export { AdminHeader };
