"use client";

import { useSession } from "next-auth/react";
import {
  Package,
  FolderTree,
  Users,
  ShoppingCart,
  DollarSign,
  Clock,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useDashboardStats } from "@/features/dashboard/hooks";
import { formatPrice } from "@/lib/utils";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminPageHeader, AdminContent } from "@/components/admin/AdminPageHeader";
import { SalesChart } from "@/components/admin/dashboard/SalesChart";
import { RecentOrders, type DummyOrder } from "@/components/admin/dashboard/RecentOrders";
import { TopProducts, type DummyProduct } from "@/components/admin/dashboard/TopProducts";
import {
  LowStockAlerts,
  type DummyLowStockItem,
} from "@/components/admin/dashboard/LowStockAlerts";

const DUMMY_SALES_DATA = [
  { label: "Mon", value: 12500 },
  { label: "Tue", value: 18200 },
  { label: "Wed", value: 9800 },
  { label: "Thu", value: 22100 },
  { label: "Fri", value: 27400 },
  { label: "Sat", value: 31200 },
  { label: "Sun", value: 19600 },
];

const DUMMY_ORDERS: DummyOrder[] = [
  { id: "#ORD-1042", customer: "Aarav Sharma", date: "Sep 3, 2026", amount: 1249, status: "Delivered" },
  { id: "#ORD-1041", customer: "Priya Nair", date: "Sep 3, 2026", amount: 899, status: "Processing" },
  { id: "#ORD-1040", customer: "Rohan Iyer", date: "Sep 2, 2026", amount: 2150, status: "Pending" },
  { id: "#ORD-1039", customer: "Sneha Reddy", date: "Sep 2, 2026", amount: 540, status: "Delivered" },
  { id: "#ORD-1038", customer: "Kabir Menon", date: "Sep 1, 2026", amount: 375, status: "Cancelled" },
];

const DUMMY_TOP_PRODUCTS: DummyProduct[] = [
  { id: "p1", name: "Silk Maxi Dress", category: "Dresses", unitsSold: 142, revenue: 354858 },
  { id: "p2", name: "Classic Chronograph Watch", category: "Watches", unitsSold: 88, revenue: 571912 },
  { id: "p3", name: "Embroidered Anarkali Set", category: "Ethnic Wear", unitsSold: 115, revenue: 402385 },
  { id: "p4", name: "French Linen Relaxed Shirt", category: "Shirts", unitsSold: 160, revenue: 319840 },
];

const DUMMY_LOW_STOCK: DummyLowStockItem[] = [
  { id: "l1", name: "Blush Rose Cocktail Dress (Size M)", sku: "DRS-BLUSH-M", stock: 3, reorderLevel: 10 },
  { id: "l2", name: "AeroChrono Watch (Black/Silver)", sku: "WTC-AERO-01", stock: 2, reorderLevel: 8 },
  { id: "l3", name: "Italian Leather Tote Bag", sku: "BAG-TOTE-BRN", stock: 4, reorderLevel: 10 },
];

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const { data: stats, isLoading, error, refetch } = useDashboardStats();

  if (isLoading) {
    return <AdminTableSkeleton showStats />;
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load dashboard stats. Please try again."
        onRetry={refetch}
      />
    );
  }

  return (
    <div>
      <AdminPageHeader
        title={`Welcome back, ${session?.user?.name || "Admin"}`}
        description="Here's what's happening with your store today."
        breadcrumbs={<AdminBreadcrumb items={[{ label: "Dashboard" }]} />}
      />

      <AdminContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Products"
            value={stats?.totalProducts ?? 0}
            icon={Package}
            description="All products in store"
          />
          <StatsCard
            title="Total Categories"
            value={stats?.totalCategories ?? 0}
            icon={FolderTree}
            description="Product categories"
          />
          <StatsCard
            title="Total Customers"
            value={stats?.totalCustomers ?? 0}
            icon={Users}
            description="Registered customers"
          />
          <StatsCard
            title="Total Orders"
            value={stats?.totalOrders ?? 0}
            icon={ShoppingCart}
            description="All time orders"
          />
          <StatsCard
            title="Revenue"
            value={formatPrice(stats?.totalRevenue ?? 0)}
            icon={DollarSign}
            description="Total revenue"
          />
          <StatsCard
            title="Pending Orders"
            value={stats?.pendingOrders ?? 0}
            icon={Clock}
            description="Awaiting processing"
          />
          <StatsCard
            title="Low Stock"
            value={stats?.lowStock ?? 0}
            icon={AlertTriangle}
            description="Items below reorder level"
          />
          <StatsCard
            title="Today's Orders"
            value={stats?.todayOrders ?? 0}
            icon={Calendar}
            description="Orders placed today"
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SalesChart data={DUMMY_SALES_DATA} />
          </div>
          <TopProducts products={DUMMY_TOP_PRODUCTS} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentOrders orders={DUMMY_ORDERS} />
          </div>
          <LowStockAlerts items={DUMMY_LOW_STOCK} />
        </div>
      </AdminContent>
    </div>
  );
}
