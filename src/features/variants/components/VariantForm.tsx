"use client";

import React, { useMemo, useEffect, useState, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Info } from "lucide-react";
import type { UnitOption } from "../types";
import { vegTypeEnum } from "@/features/products/validations/admin-product.schema";
import { FormInput } from "@/components/forms/form-input";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormRichText } from "@/components/forms/form-rich-text";
import { FormSelect } from "@/components/forms/form-select";
import { FormCheckbox } from "@/components/forms/form-checkbox";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Label } from "@/components/forms/label";

const vegTypeOptions = [
  { label: "Vegetarian (Veg)", value: "veg" },
  { label: "Non-Vegetarian (Non-Veg)", value: "nonveg" },
  { label: "Vegan", value: "vegan" },
  { label: "Not Applicable (N/A)", value: "na" },
];

// Item-level fields only. Unit + price combinations (sku, unit, base price)
// are managed separately per (unit) via VariantUnitPriceList, since one item
// can now be sold in multiple pack sizes at different prices.
const variantFormSchema = z.object({
  productId: z
    .string()
    .uuid("Invalid Product UUID format")
    .optional(),
  variantName: z
    .string({ message: "Item name is required" })
    .trim()
    .min(1, "Item name cannot be empty")
    .max(100, "Item name cannot exceed 100 characters"),
  slug: z
    .string({ message: "Item code is required" })
    .trim()
    .min(1, "Item code cannot be empty")
    .max(255, "Item code cannot exceed 255 characters"),
  shortDescription: z
    .string()
    .trim()
    .max(500, "Short description cannot exceed 500 characters")
    .optional(),
  description: z.string().trim().optional(),
  ingredients: z.string().trim().optional(),
  isReadyToMix: z.boolean(),
  cookingRecipe: z.string().trim().optional(),
  shelfLife: z
    .string()
    .trim()
    .max(100, "Best before cannot exceed 100 characters")
    .optional(),
  vegType: vegTypeEnum,
  isFeatured: z.boolean(),
});

export type VariantFormValues = z.infer<typeof variantFormSchema>;

export interface SelectOption {
  value: string;
  label: string;
  slug?: string; // Product Code
}

export type UnitFormItem = UnitOption | (SelectOption & {
  id?: string;
  type?: "weight" | "volume" | "count";
  code?: string;
  name?: string;
  conversionFactor?: number;
});

interface VariantFormProps {
  initialData?: Partial<VariantFormValues>;
  isEditing?: boolean;
  fixedProductId?: string;
  fixedProductSlug?: string;
  products?: SelectOption[];
  onSubmit: (data: VariantFormValues) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

function VariantForm({
  initialData,
  isEditing: _isEditing = false,
  fixedProductId,
  fixedProductSlug,
  products = [],
  onSubmit,
  isLoading = false,
  submitLabel = "Save Item",
}: VariantFormProps) {
  // Helper to compute prefix from Product Code / Slug
  const computePrefix = (prodId?: string): string => {
    if (fixedProductSlug) {
      return `${fixedProductSlug.toUpperCase().trim()}_`;
    }
    const p = products.find((item) => item.value === prodId);
    const pSlug = p?.slug?.trim() || "";
    if (pSlug) {
      return `${pSlug.toUpperCase()}_`;
    }
    return "";
  };

  const initialProductId = fixedProductId || initialData?.productId || "";
  const initialPrefix = computePrefix(initialProductId);

  const extractInitialExtraSlug = (fullSlug?: string, prefix?: string): string => {
    if (!fullSlug) return "";
    if (prefix && fullSlug.startsWith(prefix)) {
      return fullSlug.slice(prefix.length);
    }
    return fullSlug.replace(/\s+/g, "_").toUpperCase();
  };

  const [extraSlug, setExtraSlug] = useState<string>(() =>
    extractInitialExtraSlug(initialData?.slug, initialPrefix)
  );
  // Once the admin edits the code by hand, stop auto-filling it from the Item
  // Name so we never silently overwrite a deliberate choice. Editing an
  // existing item (which already has a slug) counts as "already set".
  const [codeTouched, setCodeTouched] = useState<boolean>(() => Boolean(initialData?.slug));
  const [extraSlugError, setExtraSlugError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showInfo) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setShowInfo(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showInfo]);

  const methods = useForm<VariantFormValues>({
    resolver: zodResolver(variantFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      productId: fixedProductId || initialData?.productId || "",
      variantName: initialData?.variantName || "",
      slug: initialData?.slug || "",
      shortDescription: initialData?.shortDescription || "",
      description: initialData?.description || "",
      ingredients: initialData?.ingredients || "",
      isReadyToMix: initialData?.isReadyToMix ?? false,
      cookingRecipe: initialData?.cookingRecipe || "",
      shelfLife: initialData?.shelfLife || "",
      vegType: initialData?.vegType || "na",
      isFeatured: initialData?.isFeatured ?? false,
    },
  });

  const selectedProductId = methods.watch("productId");
  const watchedVariantName = methods.watch("variantName");
  const watchedIsReadyToMix = methods.watch("isReadyToMix");

  // Dynamic non-editable prefix based on currently selected Product
  const slugPrefix = useMemo(
    () => computePrefix(selectedProductId || fixedProductId),
    [selectedProductId, fixedProductId, fixedProductSlug, products]
  );

  // Sync combined variant code into form state whenever prefix or extraSlug updates
  useEffect(() => {
    const fullSlug = `${slugPrefix}${extraSlug}`.trim();
    methods.setValue("slug", fullSlug, {
      shouldValidate: methods.formState.isSubmitted,
    });
  }, [slugPrefix, extraSlug, methods]);

  // Fill in the Item Code from the Item Name automatically, so most admins
  // never have to think about it. Stops as soon as they edit the code by hand.
  useEffect(() => {
    if (codeTouched) return;
    const auto = (watchedVariantName || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    setExtraSlug(auto);
  }, [watchedVariantName, codeTouched]);

  useEffect(() => {
    if (initialData) {
      methods.reset({
        productId: fixedProductId || initialData.productId || "",
        variantName: initialData.variantName || "",
        slug: initialData.slug || "",
        shortDescription: initialData.shortDescription || "",
        description: initialData.description || "",
        ingredients: initialData.ingredients || "",
        isReadyToMix: initialData.isReadyToMix ?? false,
        cookingRecipe: initialData.cookingRecipe || "",
        shelfLife: initialData.shelfLife || "",
        vegType: initialData.vegType || "na",
        isFeatured: initialData.isFeatured ?? false,
      });

      setExtraSlug(extractInitialExtraSlug(initialData.slug, initialPrefix));
      setCodeTouched(Boolean(initialData.slug));
    }
  }, [initialData, fixedProductId, initialPrefix, methods]);

  const productOptions = useMemo(
    () => products,
    [products]
  );

  const handleExtraSlugChange = (raw: string) => {
    // Format variant code: uppercase, convert spaces to underscore, allow special characters
    const formatted = raw
      .toUpperCase()
      .replace(/\s+/g, "_");
    setExtraSlug(formatted);
    setCodeTouched(true);
    if (extraSlugError) setExtraSlugError(null);
    methods.clearErrors("slug");
  };

  const handleFormSubmit = async (data: VariantFormValues) => {
    if (!fixedProductId && !data.productId) {
      methods.setError("productId", { message: "Please select a product" });
      return;
    }

    if (!extraSlug.trim()) {
      const msg = "Please enter the Item code (cannot be empty)";
      setExtraSlugError(msg);
      methods.setError("slug", {
        type: "manual",
        message: msg,
      });
      return;
    }

    const finalSlug = `${slugPrefix}${extraSlug.trim()}`;

    if (finalSlug.length > 255) {
      const msg = "Item code cannot exceed 255 characters";
      setExtraSlugError(msg);
      methods.setError("slug", {
        type: "manual",
        message: msg,
      });
      return;
    }

    const submissionPayload: VariantFormValues = {
      ...data,
      slug: finalSlug,
    };

    await onSubmit(submissionPayload);
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        {/* Row 1: Product & Item Name (or Item Name & Dietary Type if product is fixed) */}
        {!fixedProductId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormSelect
              name="productId"
              label="Product"
              placeholder="Select product"
              options={productOptions}
              required
            />

            <FormInput
              name="variantName"
              label="Item Name"
              placeholder="Enter item name"
              maxLength={100}
              required
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              name="variantName"
              label="Item Name"
              placeholder="Enter item name"
              maxLength={100}
              required
            />

            <FormSelect
              name="vegType"
              label="Dietary Type"
              placeholder="Select dietary type"
              options={vegTypeOptions}
              required
            />
          </div>
        )}

        {/* Row 2: Item Code (Full Width) with Category + Product Code Prefix & Floating Info Pop-Up */}
        <div className="pt-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Label className="flex items-center gap-1">
              Item Code (fills in automatically)
              <span className="text-error-600 font-bold ml-1">*</span>
            </Label>
            <div className="relative inline-flex items-center" ref={infoRef}>
              <button
                type="button"
                onClick={() => setShowInfo((prev) => !prev)}
                className="text-neutral-400 hover:text-[var(--color-secondary-600)] transition-colors focus:outline-none cursor-pointer rounded-full p-0.5"
                title="Click for more information"
                aria-label="Information"
              >
                <Info className="h-3.5 w-3.5" />
              </button>

              {showInfo && (
                <div className="absolute left-0 top-full mt-1.5 z-50 w-72 sm:w-80 rounded-xl bg-white border border-neutral-200/90 p-3 text-xs text-neutral-700 shadow-xl shadow-neutral-900/10 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-[var(--color-secondary-600)] shrink-0 mt-0.5" />
                      <p className="leading-relaxed text-[var(--color-neutral-800)]">
                        This is a short internal code used to identify the item — it fills in
                        by itself from the Item Name, with the product's code added in front.
                        You only need to change it if you want a shorter or different code.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInfo(false)}
                      className="text-neutral-400 hover:text-neutral-700 font-bold text-sm leading-none ml-1 p-0.5 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className={`flex items-stretch h-11 rounded-xl border transition-all ${
              extraSlugError || methods.formState.errors.slug
                ? "border-theme-status-can-fg ring-2 ring-theme-status-can-fg/20"
                : "border-theme-border focus-within:border-theme-primary focus-within:ring-2 focus-within:ring-theme-primary/20 hover:border-theme-border-accent"
            } bg-theme-surface overflow-hidden`}
          >
            {/* Non-editable Category + Product Code prefix */}
            <div
              className="flex items-center px-4 bg-theme-surface-alt border-r border-theme-border text-theme-text-secondary font-mono text-xs font-semibold select-none max-w-[60%] shrink-0 truncate"
              title={
                slugPrefix
                  ? `Product Prefix: ${slugPrefix}`
                  : "Select Product to auto-generate prefix"
              }
            >
              {slugPrefix ? (
                <span className="font-semibold text-theme-text-primary tracking-wide truncate">
                  {slugPrefix}
                </span>
              ) : (
                <span className="text-theme-text-muted italic text-[11px]">
                  [category_product_code]_
                </span>
              )}
            </div>

            {/* Editable extra code for the variant */}
            <input
              type="text"
              value={extraSlug}
              maxLength={255}
              onChange={(e) => handleExtraSlugChange(e.target.value)}
              placeholder="Enter item code"
              className="flex-1 min-w-0 px-4 py-2 text-sm text-theme-text-primary bg-transparent outline-none font-mono placeholder:text-theme-text-muted placeholder:font-sans uppercase"
            />
          </div>

          {/* Helper message / live preview / error */}
          <div className="mt-1.5 min-h-[18px]">
            {extraSlugError || methods.formState.errors.slug?.message ? (
              <p className="text-xs text-red-500 font-medium">
                {extraSlugError || methods.formState.errors.slug?.message}
              </p>
            ) : (
              <p className="text-[11px] text-theme-text-muted font-mono flex items-center gap-1.5 flex-wrap">
                <span className="font-sans font-medium text-theme-text-secondary">Full Code:</span>
                {slugPrefix || extraSlug ? (
                  <span className="text-theme-primary font-semibold bg-theme-surface-alt px-2 py-0.5 rounded border border-theme-border">
                    {slugPrefix}
                    <span className={extraSlug ? "text-theme-text-primary font-bold" : "text-theme-text-muted italic font-normal"}>
                      {extraSlug || "ENTER_ITEM_CODE"}
                    </span>
                  </span>
                ) : (
                  <span className="text-theme-text-muted italic font-sans">
                    Select product to generate prefix
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Row 3: Dietary Type & Best Before (or just Best Before if Dietary Type is in Row 1) */}
        {!fixedProductId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormSelect
              name="vegType"
              label="Dietary Type"
              placeholder="Select dietary type"
              options={vegTypeOptions}
              required
            />

            <FormInput
              name="shelfLife"
              label="Best Before"
              placeholder="Enter best before / shelf life"
              maxLength={100}
            />
          </div>
        ) : (
          <FormInput
            name="shelfLife"
            label="Best Before"
            placeholder="Enter best before / shelf life"
            maxLength={100}
          />
        )}

        {/* Row 4: Item Options (Featured Item & Ready to Mix side-by-side cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <div className="flex items-start p-3.5 rounded-xl border border-theme-border bg-theme-surface hover:border-theme-border-accent transition-colors">
            <FormCheckbox
              name="isFeatured"
              label="Featured Item"
              description="Display this item prominently in featured sections"
            />
          </div>

          <div className="flex items-start p-3.5 rounded-xl border border-theme-border bg-theme-surface hover:border-theme-border-accent transition-colors">
            <FormCheckbox
              name="isReadyToMix"
              label="Ready to Mix"
              description="Enable if this item needs to be mixed/prepared before eating"
            />
          </div>
        </div>

        {/* Row 5: Cooking Recipe - only relevant for Ready to Mix items */}
        {watchedIsReadyToMix && (
          <FormTextarea
            name="cookingRecipe"
            label="Cooking Recipe"
            placeholder="Enter preparation or cooking instructions"
            rows={4}
          />
        )}

        {/* Row 6: Short Description */}
        <FormTextarea
          name="shortDescription"
          label="Short Description"
          placeholder="Brief summary of the item (max 500 characters)"
          maxLength={500}
          rows={2}
        />

        {/* Row 7: Description */}
        <FormRichText
          name="description"
          label="Description"
          placeholder="Detailed item information and description"
        />

        {/* Row 8: Ingredients */}
        <FormTextarea
          name="ingredients"
          label="Ingredients"
          placeholder="Enter ingredients (separated by commas)"
          rows={3}
        />

        <div className="flex justify-end pt-2">
          <FormSubmitButton
            isLoading={isLoading}
            className="h-11 rounded-xl bg-[var(--color-secondary-600)] px-6 text-sm font-semibold text-white hover:bg-[var(--color-secondary-700)]"
          >
            {submitLabel}
          </FormSubmitButton>
        </div>
      </form>
    </FormProvider>
  );
}

export { VariantForm };
