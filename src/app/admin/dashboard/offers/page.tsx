"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOffers, useCreateOffer, useUpdateOffer, useDeleteOffer } from "@/features/offers/hooks";
import { useAdminProducts } from "@/features/products/hooks/use-products";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { AdminPageHeader, AdminContent } from "@/components/admin/AdminPageHeader";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormModal } from "@/components/common/FormModal";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createOfferSchema, type CreateOfferSchemaInput } from "@/features/offers/validations/offer.schema";
import type { ColumnDef } from "@tanstack/react-table";
import type { OfferListItem } from "@/features/offers/types";

const typeBadgeVariant: Record<string, "info" | "success" | "secondary"> = {
  percentage: "info",
  flat: "success",
  bxgy: "secondary",
};

const typeLabel: Record<string, string> = {
  percentage: "Percentage",
  flat: "Flat",
  bxgy: "Buy X Get Y",
};

export default function AdminOffersPage() {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<OfferListItem | null>(null);
  const [productSearch, setProductSearch] = useState("");

  const { data, isLoading, error, refetch } = useOffers();
  const { data: productsData } = useAdminProducts({ search: productSearch || undefined, limit: 50 });

  const createMutation = useCreateOffer();
  const updateMutation = useUpdateOffer();
  const deleteMutation = useDeleteOffer();

  const offers = data?.data ?? [];
  const products = productsData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateOfferSchemaInput>({
    resolver: zodResolver(createOfferSchema),
    defaultValues: {
      name: "",
      type: "percentage",
      value: 0,
      isActive: true,
      productUuids: [],
    },
  });

  useEffect(() => {
    if (editingOffer) {
      reset({
        name: editingOffer.name,
        type: editingOffer.type,
        value: editingOffer.value,
        minOrderAmount: editingOffer.minOrderAmount ?? undefined,
        isActive: editingOffer.isActive,
        startsAt: editingOffer.startsAt
          ? new Date(editingOffer.startsAt).toISOString().split("T")[0]
          : undefined,
        endsAt: editingOffer.endsAt
          ? new Date(editingOffer.endsAt).toISOString().split("T")[0]
          : undefined,
        productUuids: editingOffer.productUuids,
      });
    } else {
      reset({ name: "", type: "percentage", value: 0, isActive: true, productUuids: [] });
    }
  }, [editingOffer, reset]);

  const onSubmit = (formData: CreateOfferSchemaInput) => {
    if (editingOffer) {
      updateMutation.mutate(
        { id: editingOffer.id, data: formData },
        {
          onSuccess: () => {
            setModalOpen(false);
            setEditingOffer(null);
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

  const handleOpenModal = (offer?: OfferListItem) => {
    setEditingOffer(offer ?? null);
    setModalOpen(true);
  };

  const columns: ColumnDef<OfferListItem, unknown>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <p className="font-medium">{row.original.name}</p>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={typeBadgeVariant[row.original.type] ?? "secondary"}>
          {typeLabel[row.original.type] ?? row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "value",
      header: "Value",
      cell: ({ row }) =>
        row.original.type === "percentage" ? `${row.original.value}%` : `₹${row.original.value}`,
    },
    {
      id: "products",
      header: "Products",
      cell: ({ row }) => <span>{row.original.productUuids.length}</span>,
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
      accessorKey: "endsAt",
      header: "Ends",
      cell: ({ row }) =>
        row.original.endsAt ? new Date(row.original.endsAt).toLocaleDateString("en-IN") : "No end date",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleOpenModal(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.original.id)}>
            <Trash2 className="h-4 w-4 text-error-600" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) return <AdminTableSkeleton />;
  if (error) return <ErrorState message="Failed to load offers" onRetry={() => refetch()} />;

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <AdminBreadcrumb items={[{ label: "Marketing" }, { label: "Offers" }]} />
      <AdminPageHeader
        title="Offers"
        description="Manage promotional offers"
        actions={
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Offer
          </Button>
        }
      />
      <AdminContent className="flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <DataTable
            columns={columns}
            data={offers}
            searchKey="name"
            searchPlaceholder="Search offers..."
            pageSize={20}
            className="bg-white border border-neutral-200"
          />
        </div>
      </AdminContent>

      <FormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingOffer(null);
        }}
        title={editingOffer ? "Edit Offer" : "Add Offer"}
        description={editingOffer ? "Update offer details" : "Create a new promotional offer"}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                setEditingOffer(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingOffer ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-error-600">*</span>
            </label>
            <input
              {...register("name")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="e.g. Diwali Sale"
            />
            {errors.name && <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>}
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
                <option value="percentage">Percentage</option>
                <option value="flat">Flat Amount</option>
                <option value="bxgy">Buy X Get Y</option>
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
              {errors.value && <p className="mt-1 text-sm text-error-600">{errors.value.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount</label>
            <input
              type="number"
              step="0.01"
              {...register("minOrderAmount", {
                setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
              })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Starts At</label>
              <input
                type="date"
                {...register("startsAt")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ends At</label>
              <input
                type="date"
                {...register("endsAt")}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Products <span className="text-error-600">*</span>
            </label>
            <input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Search products..."
            />
            <Controller
              control={control}
              name="productUuids"
              render={({ field }) => (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-300 divide-y divide-gray-100">
                  {products.length === 0 && (
                    <p className="p-3 text-sm text-gray-400">No products found</p>
                  )}
                  {products.map((product) => {
                    const checked = field.value?.includes(product.id) ?? false;
                    return (
                      <label
                        key={product.id}
                        className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const current = field.value ?? [];
                            field.onChange(
                              e.target.checked
                                ? [...current, product.id]
                                : current.filter((uuid) => uuid !== product.id)
                            );
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        {product.name}
                      </label>
                    );
                  })}
                </div>
              )}
            />
            {errors.productUuids && (
              <p className="mt-1 text-sm text-error-600">{errors.productUuids.message}</p>
            )}
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
        title="Delete Offer"
        description="Are you sure you want to delete this offer? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
