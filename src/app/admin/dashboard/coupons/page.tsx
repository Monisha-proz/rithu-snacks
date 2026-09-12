"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
} from "@/features/coupons/hooks";
import { DataTable } from "@/components/admin/data-table/DataTable";
import {
  AdminPageHeader,
  AdminContent,
} from "@/components/admin/AdminPageHeader";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormModal } from "@/components/common/FormModal";
import { SearchInput } from "@/components/ui/search-input";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  createCouponSchema,
  type CreateCouponSchemaInput,
} from "@/features/coupons/validations/coupon.schema";
import type { ColumnDef } from "@tanstack/react-table";
import type { CouponListItem } from "@/features/coupons/types";

const typeBadgeVariant: Record<string, "info" | "success"> = {
  PERCENTAGE: "info",
  FIXED: "success",
};

export default function AdminCouponsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponListItem | null>(null);

  const { data, isLoading, error, refetch } = useCoupons({
    page,
    limit: pageSize,
    search: search || undefined,
  });

  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon();
  const deleteMutation = useDeleteCoupon();

  const coupons = data?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCouponSchemaInput>({
    resolver: zodResolver(createCouponSchema),
    defaultValues: {
      code: "",
      type: "PERCENTAGE",
      value: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (editingCoupon) {
      reset({
        code: editingCoupon.code,
        type: editingCoupon.type as "PERCENTAGE" | "FIXED",
        value: editingCoupon.value,
        minOrderAmount: editingCoupon.minOrderAmount ?? undefined,
        maxDiscount: editingCoupon.maxDiscount ?? undefined,
        usageLimit: editingCoupon.usageLimit ?? undefined,
        isActive: editingCoupon.isActive,
        startsAt: editingCoupon.startsAt
          ? new Date(editingCoupon.startsAt).toISOString().split("T")[0]
          : undefined,
        expiresAt: editingCoupon.expiresAt
          ? new Date(editingCoupon.expiresAt).toISOString().split("T")[0]
          : undefined,
      });
    } else {
      reset({ code: "", type: "PERCENTAGE", value: 0, isActive: true });
    }
  }, [editingCoupon, reset]);

  const onSubmit = (formData: CreateCouponSchemaInput) => {
    if (editingCoupon) {
      updateMutation.mutate(
        { id: editingCoupon.id, data: formData },
        {
          onSuccess: () => {
            setModalOpen(false);
            setEditingCoupon(null);
          },
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setModalOpen(false);
          reset();
        },
      });
    }
  };

  const handleOpenModal = (coupon?: CouponListItem) => {
    if (coupon) {
      setEditingCoupon(coupon);
    } else {
      setEditingCoupon(null);
    }
    setModalOpen(true);
  };

  const columns: ColumnDef<CouponListItem, unknown>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <p className="font-mono font-semibold text-neutral-900">{row.original.code}</p>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={typeBadgeVariant[row.original.type] ?? "secondary"}>
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "value",
      header: "Value",
      cell: ({ row }) => (
        <span className="font-semibold text-neutral-900">
          {row.original.type === "PERCENTAGE"
            ? `${row.original.value}%`
            : `₹${row.original.value}`}
        </span>
      ),
    },
    {
      id: "usage",
      header: "Usage",
      cell: ({ row }) => (
        <span className="text-neutral-700 text-xs sm:text-sm">
          {row.original.usedCount}
          {row.original.usageLimit ? ` / ${row.original.usageLimit}` : ""}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "success" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "expiresAt",
      header: "Expiry",
      cell: ({ row }) => (
        <span className="text-neutral-600 text-xs">
          {row.original.expiresAt
            ? new Date(row.original.expiresAt).toLocaleDateString("en-IN")
            : "No expiry"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenModal(row.original)}
            className="h-8 w-8 text-neutral-500 hover:text-secondary-700 hover:bg-secondary-50 cursor-pointer"
            title="Edit coupon"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteId(row.original.id)}
            className="h-8 w-8 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
            title="Delete coupon"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading && !data) return <AdminTableSkeleton />;
  if (error) return <ErrorState message="Failed to load coupons" onRetry={() => refetch()} />;

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <AdminPageHeader
        title="Coupons"
        description="Manage discount coupons"
      />

      <AdminContent className="flex-1 min-h-0 overflow-hidden">
        <div className="flex h-full flex-col overflow-hidden bg-[var(--color-background)] py-1 rounded-2xl">
          {/* Search + Add Button Header */}
          <div className="flex-shrink-0 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <SearchInput
              placeholder="Search coupons..."
              defaultValue={search}
              onSearch={(val) => {
                setSearch(val);
                setPage(1);
              }}
              className="w-full max-w-md"
            />

            <Button
              type="button"
              onClick={() => handleOpenModal()}
              className="h-11 rounded-xl bg-[var(--color-secondary-600)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-secondary-700)] cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Coupon
            </Button>
          </div>

          {/* Table Container */}
          <div className="mt-6 flex-1 min-h-0 overflow-hidden flex flex-col">
            <DataTable
              columns={columns}
              data={coupons}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 30, 50]}
              page={data?.meta?.page ?? page}
              totalPages={
                data?.meta?.totalPages ??
                Math.max(1, Math.ceil((data?.meta?.total ?? coupons.length) / pageSize))
              }
              totalItems={data?.meta?.total ?? coupons.length}
              onPageChange={setPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
              emptyMessage={
                search
                  ? "No coupons match your search."
                  : "No coupons created yet."
              }
              className="bg-white"
            />
          </div>
        </div>
      </AdminContent>

      <FormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCoupon(null);
        }}
        title={editingCoupon ? "Edit Coupon" : "Add Coupon"}
        description={editingCoupon ? "Update coupon details" : "Create a new coupon"}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                setEditingCoupon(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-[var(--color-secondary-600)] hover:bg-[var(--color-secondary-700)] text-white"
            >
              {editingCoupon ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code <span className="text-error-600">*</span>
            </label>
            <input
              {...register("code")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="e.g. SUMMER20"
            />
            {errors.code && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.code.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="text-error-600">*</span>
              </label>
              <select
                {...register("type")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value <span className="text-error-600">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register("value", { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="0"
              />
              {errors.value && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.value.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Order Amount
              </label>
              <input
                type="number"
                step="0.01"
                {...register("minOrderAmount", { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Discount
              </label>
              <input
                type="number"
                step="0.01"
                {...register("maxDiscount", { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usage Limit
            </label>
            <input
              type="number"
              {...register("usageLimit", { valueAsNumber: true })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Unlimited"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Starts At
              </label>
              <input
                type="date"
                {...register("startsAt")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expires At
              </label>
              <input
                type="date"
                {...register("expiresAt")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register("isActive")}
              id="isActive"
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId, {
              onSuccess: () => setDeleteId(null),
            });
          }
        }}
        title="Delete Coupon"
        description="Are you sure you want to delete this coupon? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
