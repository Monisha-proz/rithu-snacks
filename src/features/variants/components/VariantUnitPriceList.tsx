"use client";

import React, { useState } from "react";
import { Plus, Pencil, Trash2, Star, Loader2, Tag, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, type SelectOption } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useUnits } from "@/features/units/hooks";
import type { AdminUnitResponse } from "@/features/units/types";
import {
  useVariantUnitPrices,
  useCreateVariantUnitPrice,
  useUpdateVariantUnitPrice,
  useDeleteVariantUnitPrice,
} from "../hooks";
import type { VariantUnitPriceResponse } from "../types";

interface UnitPriceRowFormState {
  unitId: string;
  unitValue: string;
  sku: string;
  basePrice: string;
  isDefault: boolean;
  isActive: boolean;
}

const emptyRow: UnitPriceRowFormState = {
  unitId: "",
  unitValue: "",
  sku: "",
  basePrice: "",
  isDefault: false,
  isActive: true,
};

interface VariantUnitPriceListProps {
  productUuid: string;
  variantUuid: string;
}

/**
 * Manages the (unit, price) combinations for a single item/variant, e.g.
 * "500g @ Rs.99" and "1kg @ Rs.180" under the same item. Selling price is not
 * collected here - the storefront computes it from basePrice minus any
 * active offer/discount.
 */
function VariantUnitPriceList({ productUuid, variantUuid }: VariantUnitPriceListProps) {
  const { data: unitPrices = [], isLoading } = useVariantUnitPrices(productUuid, variantUuid);
  const { data: unitsData } = useUnits({ pageSize: 100 });
  const units = unitsData?.data ?? [];

  const createMutation = useCreateVariantUnitPrice();
  const updateMutation = useUpdateVariantUnitPrice();
  const deleteMutation = useDeleteVariantUnitPrice();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UnitPriceRowFormState>(emptyRow);
  const [fieldErrors, setFieldErrors] = useState<{
    unitId?: string;
    unitValue?: string;
    sku?: string;
    basePrice?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VariantUnitPriceResponse | null>(null);

  const resetForm = () => {
    setForm(emptyRow);
    setFieldErrors({});
    setFormError(null);
    setIsAdding(false);
    setEditingId(null);
  };

  const startAdd = () => {
    setForm(emptyRow);
    setFieldErrors({});
    setFormError(null);
    setEditingId(null);
    setIsAdding(true);
  };

  const startEdit = (item: VariantUnitPriceResponse) => {
    setForm({
      unitId: item.unitId,
      unitValue: String(item.unitValue ?? ""),
      sku: item.sku,
      basePrice: String(item.basePrice ?? ""),
      isDefault: item.isDefault,
      isActive: item.isActive,
    });
    setFieldErrors({});
    setFormError(null);
    setIsAdding(false);
    setEditingId(item.id);
  };

  const validateField = (name: keyof UnitPriceRowFormState, value: unknown): string | undefined => {
    if (name === "unitId") {
      if (!value) return "Please select a unit";
    }
    if (name === "unitValue") {
      const strVal = String(value ?? "").trim();
      if (!strVal) return "Pack size is required";
      const num = Number(strVal);
      if (Number.isNaN(num) || num <= 0) return "Pack size must be greater than 0";
      if (strVal.length > 10 || num > 99999999.99) return "Pack size exceeds maximum allowed amount";
    }
    if (name === "sku") {
      const strVal = String(value ?? "").trim();
      if (!strVal) return "SKU is required";
      if (strVal.length > 100) return "SKU cannot exceed 100 characters";
    }
    if (name === "basePrice") {
      const strVal = String(value ?? "").trim();
      if (!strVal) return "Base price is required";
      const num = Number(strVal);
      if (Number.isNaN(num) || num < 0) return "Base price cannot be negative";
      if (strVal.length > 10 || num > 99999999.99) return "Price exceeds maximum allowed amount";
    }
    return undefined;
  };

  const handleFieldChange = (name: keyof UnitPriceRowFormState, value: string | boolean) => {
    setForm((f) => ({ ...f, [name]: value }));
    setFormError(null);
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      const err = validateField(name, value);
      setFieldErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const isBusy = createMutation.isPending || updateMutation.isPending;

  const handleSave = async () => {
    setFormError(null);

    const errors: typeof fieldErrors = {};

    const unitIdErr = validateField("unitId", form.unitId);
    if (unitIdErr) errors.unitId = unitIdErr;

    const unitValueErr = validateField("unitValue", form.unitValue);
    if (unitValueErr) errors.unitValue = unitValueErr;

    const skuErr = validateField("sku", form.sku);
    if (skuErr) errors.sku = skuErr;

    const basePriceErr = validateField("basePrice", form.basePrice);
    if (basePriceErr) errors.basePrice = basePriceErr;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    const unitValue = Number(form.unitValue);
    const basePrice = Number(form.basePrice);

    const payload = {
      unitId: form.unitId,
      unitValue,
      sku: form.sku.trim(),
      basePrice,
      isDefault: form.isDefault,
      isActive: form.isActive,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          productUuid,
          variantUuid,
          unitPriceUuid: editingId,
          data: payload,
        });
      } else {
        await createMutation.mutateAsync({
          productUuid,
          variantUuid,
          data: payload,
        });
      }
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save unit price";
      setFormError(message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({
        productUuid,
        variantUuid,
        unitPriceUuid: deleteTarget.id,
      });
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete unit price", err);
    }
  };

  const showForm = isAdding || Boolean(editingId);

  return (
    <div className="bg-white border border-cream-border rounded-2xl overflow-hidden shadow-xs">
      <div className="px-6 py-4.5 border-b border-cream-border flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-neutral-900 tracking-tight flex items-center gap-2">
          <Tag className="w-4 h-4 text-secondary-600" />
          <span>Units & Pricing</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cream-200 text-neutral-600 border border-cream-border">
            {unitPrices.length}
          </span>
        </h2>

        {!showForm && (
          <Button
            type="button"
            size="sm"
            onClick={startAdd}
            disabled={isBusy}
            className="h-8.5 px-3.5 rounded-lg text-xs font-bold text-white bg-[var(--color-secondary-600)] hover:bg-[var(--color-secondary-700)] active:bg-[var(--color-secondary-800)] border border-[var(--color-secondary-700)]/60 shadow-xs hover:shadow-sm active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
            <span>Add unit + price</span>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="p-6 flex items-center justify-center text-neutral-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : (
        <div className="divide-y divide-cream-border-subtle">
          {unitPrices.length === 0 && !showForm && (
            <div className="py-8 px-6 text-center space-y-3">
              <p className="text-xs font-medium text-neutral-600">
                No unit / price combinations yet. Add one to make this item purchasable.
              </p>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200/80 rounded-lg py-1.5 px-3 max-w-md mx-auto">
                <span>⚠️ If price details are not entered, this item remains in the <strong>Inactive list</strong> and hidden from customers.</span>
              </div>
            </div>
          )}

          {unitPrices.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 px-6 py-3.5 hover:bg-cream-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-900">
                      {item.measurement?.value} {item.unitCode || item.measurement?.unit}
                    </span>
                    {item.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold">
                        <Star className="w-3 h-3" /> Default
                      </span>
                    )}
                    {!item.isActive && (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 text-[10px] font-bold border border-neutral-200">
                        Inactive
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-500 font-mono truncate">
                    SKU: {item.sku}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-bold text-secondary-900 font-mono">
                  ₹{item.basePrice.toLocaleString("en-IN")}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEdit(item)}
                    disabled={isBusy}
                    className="h-8 w-8 text-neutral-500 hover:text-secondary-700 hover:bg-secondary-50 disabled:opacity-40"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(item)}
                    disabled={isBusy}
                    className="h-8 w-8 text-neutral-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-40"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {showForm && (
            <div className="p-6 bg-cream-50/60 space-y-4">
              <p className="text-xs text-neutral-500 -mt-1">
                Add one row for every pack size you sell this item in — e.g. 250 Grams, 500
                Grams and 1 Kilogram can each have their own price.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={form.unitId}
                    onValueChange={(val) => handleFieldChange("unitId", val)}
                    disabled={isBusy}
                    placeholder="Select unit"
                    error={fieldErrors.unitId}
                    options={units.map((u: AdminUnitResponse) => ({
                      value: String(u.id),
                      label: `${u.name} (${u.code})`,
                    }))}
                    className="h-10 rounded-xl"
                  />
                  {!fieldErrors.unitId && (
                    <p className="text-[11px] text-neutral-400 mt-1">
                      What is it measured in — Grams, Kilograms, Millilitres, or just a count.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                    Pack Size <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="99999999.99"
                    maxLength={10}
                    value={form.unitValue}
                    onChange={(e) => handleFieldChange("unitValue", e.target.value)}
                    disabled={isBusy}
                    placeholder="Enter measurement value"
                    className={`w-full h-10 px-3 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 disabled:opacity-60 disabled:bg-neutral-100 ${
                      fieldErrors.unitValue
                        ? "border-red-500 ring-2 ring-red-500/10 focus:border-red-500 focus:ring-red-500/20"
                        : "border-neutral-200 focus:ring-secondary-600/20 focus:border-secondary-600"
                    }`}
                  />
                  {fieldErrors.unitValue ? (
                    <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.unitValue}</p>
                  ) : (
                    <p className="text-[11px] text-neutral-400 mt-1">
                      How much is in one pack (max 10 digits, e.g. 500 for a 500 Gram pack).
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                    SKU (pack code) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={form.sku}
                    onChange={(e) => handleFieldChange("sku", e.target.value)}
                    disabled={isBusy}
                    placeholder="Enter SKU code"
                    className={`w-full h-10 px-3 rounded-lg border text-sm font-mono bg-white focus:outline-none focus:ring-2 disabled:opacity-60 disabled:bg-neutral-100 ${
                      fieldErrors.sku
                        ? "border-red-500 ring-2 ring-red-500/10 focus:border-red-500 focus:ring-red-500/20"
                        : "border-neutral-200 focus:ring-secondary-600/20 focus:border-secondary-600"
                    }`}
                  />
                  {fieldErrors.sku ? (
                    <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.sku}</p>
                  ) : (
                    <p className="text-[11px] text-neutral-400 mt-1">
                      A unique code just for this pack size (max 100 characters).
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                    Price per pack (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="99999999.99"
                    maxLength={10}
                    value={form.basePrice}
                    onChange={(e) => handleFieldChange("basePrice", e.target.value)}
                    disabled={isBusy}
                    placeholder="Enter price per pack"
                    className={`w-full h-10 px-3 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 disabled:opacity-60 disabled:bg-neutral-100 ${
                      fieldErrors.basePrice
                        ? "border-red-500 ring-2 ring-red-500/10 focus:border-red-500 focus:ring-red-500/20"
                        : "border-neutral-200 focus:ring-secondary-600/20 focus:border-secondary-600"
                    }`}
                  />
                  {fieldErrors.basePrice ? (
                    <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.basePrice}</p>
                  ) : (
                    <p className="text-[11px] text-neutral-400 mt-1">
                      What customer pays for this pack (max 10 digits).
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => handleFieldChange("isDefault", e.target.checked)}
                    disabled={isBusy}
                    className="rounded border-neutral-300"
                  />
                  Show this size first (default)
                </label>

                <label className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => handleFieldChange("isActive", e.target.checked)}
                    disabled={isBusy}
                    className="rounded border-neutral-300"
                  />
                  Active (customers can buy this size)
                </label>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <span className="leading-relaxed">{formError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={resetForm} disabled={isBusy}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isBusy}
                  className="bg-[var(--color-secondary-600)] text-white hover:bg-[var(--color-secondary-700)]"
                >
                  {isBusy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : null}
                  {editingId ? "Save Changes" : "Add"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Unit Price"
        description={`Are you sure you want to delete the "${deleteTarget?.sku}" unit price? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

export { VariantUnitPriceList };
