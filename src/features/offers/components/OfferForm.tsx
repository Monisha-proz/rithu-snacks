"use client";

import * as React from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layers, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/Alert";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSwitch } from "@/components/forms/FormSwitch";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Label } from "@/components/forms/label";
import { cn } from "@/lib/utils";
import {
  createOfferSchema,
  type CreateOfferSchemaInput,
} from "../validations/offer.schema";
import {
  OFFER_TYPE_OPTIONS,
  offerValueFieldLabel,
} from "../constants/offer-options";
import { OfferTargetPicker } from "./OfferTargetPicker";
import { OfferPreview } from "./OfferPreview";
import { useOfferItemTargets } from "../hooks";
import type { OfferItemTarget, OfferLevel, OfferListItem, OfferType } from "../types";

export interface OfferFormProps {
  initialData?: OfferListItem | null;
  isLoading?: boolean;
  submitLabel?: string;
  serverError?: string | null;
  onCancel: () => void;
  onSubmit: (data: CreateOfferSchemaInput) => void | Promise<void>;
}

/** `<input type="date">` needs `yyyy-MM-dd`, not an ISO timestamp. */
function toDateInputValue(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** `<input type="time">` needs `HH:mm`. */
function toTimeInputValue(
  value: string | Date | null | undefined,
  defaultTime = "00:00"
): string {
  if (!value) return defaultTime;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return defaultTime;
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function todayInputValue(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildDefaults(offer?: OfferListItem | null): CreateOfferSchemaInput {
  if (!offer) {
    const today = todayInputValue();
    return {
      name: "",
      code: "",
      level: "product",
      type: "percentage",
      value: "" as unknown as number,
      buyQuantity: null,
      getQuantity: null,
      minQuantity: 1,
      maxQuantity: null,
      minCartValue: null,
      maxDiscountAmount: null,
      priority: "" as unknown as number,
      terms: "",
      startDate: today,
      startTime: "00:00",
      endDate: today,
      endTime: "23:59",
      isActive: true,
      productIds: [],
      itemIds: [],
    };
  }

  const startDate = toDateInputValue(offer.startsAt) || todayInputValue();
  const startTime = toTimeInputValue(offer.startsAt, "00:00");
  const endDate = toDateInputValue(offer.endsAt) || todayInputValue();
  const endTime = toTimeInputValue(offer.endsAt, "23:59");

  return {
    name: offer.name,
    code: offer.code ?? "",
    level: offer.level,
    type: offer.type,
    value: offer.value,
    buyQuantity: offer.buyQuantity,
    getQuantity: offer.getQuantity,
    minQuantity: offer.minQuantity,
    maxQuantity: offer.maxQuantity,
    minCartValue: offer.minCartValue,
    maxDiscountAmount: offer.maxDiscountAmount,
    priority: offer.priority,
    terms: offer.terms ?? "",
    startDate,
    startTime,
    endDate,
    endTime,
    isActive: offer.isActive,
    productIds: offer.products.map((p) => p.id),
    itemIds: offer.items.map((i) => i.id),
  };
}

export function OfferForm({
  initialData,
  isLoading,
  submitLabel = "Save Offer",
  serverError,
  onCancel,
  onSubmit,
}: OfferFormProps) {
  const methods = useForm<CreateOfferSchemaInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createOfferSchema) as any,
    defaultValues: buildDefaults(initialData),
    mode: "onBlur",
  });

  const { control, setValue, formState } = methods;

  const level = (useWatch({ control, name: "level" }) ?? "product") as OfferLevel;
  const type = (useWatch({ control, name: "type" }) ?? "percentage") as OfferType;
  const watchedProductIds = useWatch({ control, name: "productIds" });
  const watchedItemIds = useWatch({ control, name: "itemIds" });
  // Memoised so the `?? []` fallback does not hand downstream hooks a fresh
  // array identity on every render.
  const productIds = React.useMemo(
    () => (watchedProductIds ?? []) as string[],
    [watchedProductIds]
  );
  const itemIds = React.useMemo(
    () => (watchedItemIds ?? []) as string[],
    [watchedItemIds]
  );
  const value = Number(useWatch({ control, name: "value" }) ?? 0);
  const minQuantity = Number(useWatch({ control, name: "minQuantity" }) ?? 1);
  const maxQuantity = useWatch({ control, name: "maxQuantity" }) as number | null;
  const maxDiscountAmount = useWatch({ control, name: "maxDiscountAmount" }) as number | null;
  const buyQuantity = useWatch({ control, name: "buyQuantity" }) as number | null;
  const getQuantity = useWatch({ control, name: "getQuantity" }) as number | null;
  const startDate = (useWatch({ control, name: "startDate" }) ?? "") as string;
  const startTime = (useWatch({ control, name: "startTime" }) ?? "") as string;
  const endDate = (useWatch({ control, name: "endDate" }) ?? "") as string;
  const endTime = (useWatch({ control, name: "endTime" }) ?? "") as string;

  const previewStartsAt = React.useMemo(() => {
    if (!startDate) return "";
    const time = startTime || "00:00";
    return `${startDate}T${time.length === 5 ? `${time}:00` : time}`;
  }, [startDate, startTime]);

  const previewEndsAt = React.useMemo(() => {
    if (!endDate) return "";
    const time = endTime || "23:59";
    return `${endDate}T${time.length === 5 ? `${time}:59` : time}`;
  }, [endDate, endTime]);

  const isActive = Boolean(useWatch({ control, name: "isActive" }));

  // The picker's own Category/Product dropdowns are navigation, not offer
  // data, so they are local state rather than form fields.
  const [categoryId, setCategoryId] = React.useState("");
  const [productFilterId, setProductFilterId] = React.useState("");

  // Sample pack sizes for the preview: the exact items for an item-wise
  // offer, or the pack sizes under the first selected product otherwise.
  const { data: previewItemsForProduct = [] } = useOfferItemTargets({
    productId: level === "product" ? productIds[0] : undefined,
    enabled: level === "product" && productIds.length > 0,
  });

  const { data: itemsForSelection = [] } = useOfferItemTargets({
    productId: productFilterId || undefined,
    enabled: level === "item",
  });

  const selectedItemDetails = React.useMemo<OfferItemTarget[]>(() => {
    const byId = new Map<string, OfferItemTarget>();
    for (const item of [...(initialData?.items ?? []), ...itemsForSelection]) {
      byId.set(item.id, item);
    }
    return itemIds
      .map((id) => byId.get(id))
      .filter((item): item is OfferItemTarget => Boolean(item));
  }, [itemIds, itemsForSelection, initialData]);

  const previewItems =
    level === "item" ? selectedItemDetails : previewItemsForProduct;

  const setLevel = (next: OfferLevel) => {
    setValue("level", next, { shouldValidate: false });
    // The other level's selection is cleared, so an offer can never carry a
    // hidden target list from the tab the admin switched away from.
    if (next === "product") {
      setValue("itemIds", [], { shouldValidate: false });
    } else {
      setValue("productIds", [], { shouldValidate: false });
    }
  };

  // Revalidate relevant fields when the offer type changes if the form has been touched
  React.useEffect(() => {
    if (formState.isSubmitted || formState.touchedFields.value) {
      methods.trigger(["value", "maxDiscountAmount", "buyQuantity", "getQuantity"]);
    }
  }, [type, methods, formState.isSubmitted, formState.touchedFields.value]);

  const showValueField = type !== "bxgy";
  const showBxgyFields = type === "bxgy";
  const showMaxDiscount = type === "percentage" || type === "flat";

  const targetError =
    level === "product"
      ? (formState.errors.productIds?.message as string | undefined)
      : (formState.errors.itemIds?.message as string | undefined);

  const handleFormSubmit = (data: CreateOfferSchemaInput) => {
    const startsAt = data.startDate
      ? `${data.startDate}T${data.startTime ? (data.startTime.length === 5 ? `${data.startTime}:00` : data.startTime) : "00:00:00"}`
      : data.startsAt;
    const endsAt = data.endDate
      ? `${data.endDate}T${data.endTime ? (data.endTime.length === 5 ? `${data.endTime}:59` : data.endTime) : "23:59:59"}`
      : data.endsAt;

    return onSubmit({
      ...data,
      startsAt,
      endsAt,
    });
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(handleFormSubmit)}
        className="space-y-6"
        noValidate
      >
        {serverError && <Alert variant="error">{serverError}</Alert>}

        {/* Offer level ------------------------------------------------- */}
        <section className="space-y-2">
          <Label>
            Offer Level<span className="text-error-600 font-bold ml-1">*</span>
          </Label>
          <div
            role="tablist"
            aria-label="Offer level"
            className="inline-flex w-full rounded-xl border border-neutral-200 bg-neutral-100 p-1 sm:w-auto mb-2.5 ml-2"
          >
            {(
              [
                { value: "product", label: "Product-wise", icon: Package },
                { value: "item", label: "Item/Variant-wise", icon: Layers },
              ] as const
            ).map((option) => {
              const Icon = option.icon;
              const selected = level === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setLevel(option.value)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer",
                    selected
                      ? "bg-white text-neutral-900 shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-neutral-500">
            {level === "product"
              ? "Applies to every item and pack size under the selected products."
              : "Applies only to the exact pack sizes you select."}
          </p>
        </section>

        {/* Basics ------------------------------------------------------ */}
        <section className="grid gap-4 sm:grid-cols-2">
          <FormInput
            name="name"
            label="Offer Name"
            required
            maxLength={150}
            placeholder="e.g. Diwali Festival Offer"
          />
          <FormInput
            name="code"
            label="Offer / Coupon Code"
            placeholder="Optional, e.g. DIWALI15"
            isSlug={false}
            maxLength={50}
            description="Leave blank for an automatic offer that needs no code."
          />
        </section>

        {/* Targets ----------------------------------------------------- */}
        <section className="rounded-xl border border-neutral-200 p-4">
          <h3 className="mb-4 text-sm font-semibold text-neutral-900">
            {level === "product" ? "Products" : "Items / Variants"}
          </h3>
          <OfferTargetPicker
            level={level}
            categoryId={categoryId}
            onCategoryChange={setCategoryId}
            productId={productFilterId}
            onProductChange={setProductFilterId}
            selectedProductIds={productIds}
            onSelectedProductIdsChange={(ids) =>
              setValue("productIds", ids, { shouldValidate: true })
            }
            selectedItemIds={itemIds}
            onSelectedItemIdsChange={(ids) =>
              setValue("itemIds", ids, { shouldValidate: true })
            }
            preloadedItems={initialData?.items}
            preloadedProducts={initialData?.products}
            error={targetError}
          />
        </section>

        {/* Discount ---------------------------------------------------- */}
        <section className="grid gap-4 sm:grid-cols-2">
          <FormSelect
            name="type"
            label="Offer Type"
            required
            options={[...OFFER_TYPE_OPTIONS]}
          />

          {showValueField && (
            <FormInput
              name="value"
              type="number"
              step="0.01"
              min={0.01}
              max={type === "percentage" ? 100 : 99999999.99}
              label={offerValueFieldLabel(type)}
              required
              placeholder="0"
            />
          )}

          {showBxgyFields && (
            <>
              <FormInput
                name="buyQuantity"
                type="number"
                min={1}
                max={99999}
                step={1}
                label="Buy Quantity"
                required
                placeholder="e.g. 2"
              />
              <FormInput
                name="getQuantity"
                type="number"
                min={1}
                max={99999}
                step={1}
                label="Get Quantity (free)"
                required
                placeholder="e.g. 1"
              />
            </>
          )}
        </section>

        {/* Limits ------------------------------------------------------ */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormInput
            name="minQuantity"
            type="number"
            min={1}
            max={99999}
            step={1}
            label="Minimum Quantity"
            required
          />
          <FormInput
            name="maxQuantity"
            type="number"
            min={1}
            max={99999}
            step={1}
            label="Maximum Quantity"
            placeholder="Optional"
            description="Units beyond this pay full price."
          />
          <FormInput
            name="minCartValue"
            type="number"
            step="0.01"
            min={0}
            max={99999999.99}
            label="Minimum Cart Value (₹)"
            placeholder="Optional"
          />
          {showMaxDiscount && (
            <FormInput
              name="maxDiscountAmount"
              type="number"
              step="0.01"
              min={0}
              max={99999999.99}
              label="Maximum Discount (₹)"
              placeholder="Optional"
            />
          )}
        </section>

        {/* Schedule & priority ----------------------------------------- */}
        <section className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <h3 className="text-sm font-semibold text-neutral-900">
              Schedule &amp; Priority
            </h3>
            <span className="text-xs text-neutral-500">
              Select date, start &amp; end time, and conflict priority
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <FormInput
              name="startDate"
              type="date"
              label="Start Date"
              required
            />
            <FormInput
              name="startTime"
              type="time"
              label="Start Time"
              required
            />
            <FormInput
              name="endDate"
              type="date"
              label="End Date"
              required
            />
            <FormInput
              name="endTime"
              type="time"
              label="End Time"
              required
            />
            <FormInput
              name="priority"
              type="number"
              min={0}
              max={1000}
              step={1}
              label="Priority"
              placeholder="0"
              required
              description="Higher wins on conflict."
            />
          </div>
        </section>

        {/* Terms & status ---------------------------------------------- */}
        <section className="space-y-4">
          <FormTextarea
            name="terms"
            label="Terms & Conditions"
            rows={3}
            maxLength={5000}
            placeholder="Shown to customers on the product page. Optional."
          />

          <div className="flex items-center justify-between rounded-xl border border-neutral-200 p-4">
            <FormSwitch
              label="Offer Status"
              description={
                isActive
                  ? "Active - customers will see this offer inside its date window."
                  : "Inactive - saved but never applied."
              }
              checked={isActive}
              onCheckedChange={(checked) =>
                setValue("isActive", checked, { shouldValidate: false })
              }
            />
            <Badge variant={isActive ? "success" : "secondary"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </section>

        {/* Preview ------------------------------------------------------ */}
        <OfferPreview
          level={level}
          type={type}
          value={value}
          buyQuantity={buyQuantity}
          getQuantity={getQuantity}
          minQuantity={minQuantity}
          maxQuantity={maxQuantity}
          maxDiscountAmount={maxDiscountAmount}
          startsAt={previewStartsAt}
          endsAt={previewEndsAt}
          sampleItems={previewItems}
        />

        <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <FormSubmitButton
            isLoading={isLoading}
            className="rounded-xl bg-[var(--color-secondary-600)] px-6 font-semibold text-white hover:bg-[var(--color-secondary-700)]"
          >
            {submitLabel}
          </FormSubmitButton>
        </div>
      </form>
    </FormProvider>
  );
}
