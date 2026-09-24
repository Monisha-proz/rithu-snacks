"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Info } from "lucide-react";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { FormImageUpload } from "@/components/forms/form-image-upload";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Label } from "@/components/forms/label";

const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name is required")
    .max(200, "Product name cannot exceed 200 characters"),
  slug: z
    .string()
    .trim()
    .min(1, "Product code is required")
    .max(220, "Product code cannot exceed 220 characters"),
  categoryId: z
    .string()
    .min(1, "Please select a category"),
  brandId: z
    .string()
    .optional(),
  hsnCodeId: z
    .string()
    .optional()
    .nullable(),
  productImage: z.string().optional().nullable(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export interface ProductOption {
  value: string;
  label: string;
  slug?: string;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormValues>;
  initialImageUrl?: string | null;
  isEditing?: boolean;
  categories: ProductOption[];
  brands?: ProductOption[];
  hsnCodes: ProductOption[];
  onSubmit: (data: ProductFormValues) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

function ProductForm({
  initialData,
  initialImageUrl = null,
  isEditing = false,
  categories = [],
  brands = [],
  hsnCodes = [],
  onSubmit,
  isLoading = false,
  submitLabel = "Save Product",
}: ProductFormProps) {
  const defaultBrandId =
    initialData?.brandId || (brands && brands.length > 0 ? brands[0].value : "");

  // Helper to compute prefix from category code/slug
  const computePrefix = (catVal?: string): string => {
    const c = categories.find((item) => item.value === catVal);
    const cSlug = c?.slug?.trim() || "";

    if (cSlug) {
      return `${cSlug.toUpperCase()}_`;
    }
    return "";
  };

  const initialCatId = initialData?.categoryId || "";
  const initialPrefix = computePrefix(initialCatId);

  const extractInitialExtraSlug = (fullSlug?: string, prefix?: string): string => {
    if (!fullSlug) return "";
    if (prefix && fullSlug.startsWith(prefix)) {
      return fullSlug.slice(prefix.length);
    }
    // Clean and return uppercase with underscores
    return fullSlug.replace(/[-\s]+/g, "_").replace(/[^A-Za-z0-9_]/g, "").toUpperCase();
  };

  const [extraSlug, setExtraSlug] = useState<string>(() =>
    extractInitialExtraSlug(initialData?.slug, initialPrefix)
  );
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

  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      categoryId: initialData?.categoryId || "",
      brandId: defaultBrandId,
      hsnCodeId: initialData?.hsnCodeId || "",
      productImage: initialImageUrl || "",
    },
  });

  const selectedCategoryId = methods.watch("categoryId");

  // Dynamic non-editable prefix based on currently selected Category
  const slugPrefix = useMemo(
    () => computePrefix(selectedCategoryId),
    [selectedCategoryId, categories]
  );

  // Sync combined product code into form state whenever prefix or extraSlug updates
  useEffect(() => {
    const fullSlug = `${slugPrefix}${extraSlug}`.trim();
    methods.setValue("slug", fullSlug, {
      shouldValidate: methods.formState.isSubmitted,
    });
  }, [slugPrefix, extraSlug, methods]);

  // Ensure default brandId is populated
  useEffect(() => {
    if (!methods.getValues("brandId") && defaultBrandId) {
      methods.setValue("brandId", defaultBrandId);
    }
  }, [defaultBrandId, methods]);

  const handleExtraSlugChange = (raw: string) => {
    // Format product code: uppercase, convert spaces to underscore, keep special characters
    const formatted = raw
      .toUpperCase()
      .replace(/\s+/g, "_");
    setExtraSlug(formatted);
    if (extraSlugError) setExtraSlugError(null);
    methods.clearErrors("slug");
  };

  const handleFormSubmit = async (formData: ProductFormValues) => {
    // 1. Ensure brandId is set to default if empty
    const finalBrandId = formData.brandId || defaultBrandId;

    // 2. Validate category selection
    if (!formData.categoryId) {
      methods.setError("categoryId", { message: "Please select a category" });
      return;
    }

    // 3. Admin must enter product code
    if (!extraSlug.trim()) {
      const msg = "Please enter the product code (cannot be empty)";
      setExtraSlugError(msg);
      methods.setError("slug", {
        type: "manual",
        message: msg,
      });
      return;
    }

    const finalSlug = `${slugPrefix}${extraSlug.trim()}`;
    await onSubmit({
      ...formData,
      brandId: finalBrandId,
      slug: finalSlug,
      hsnCodeId: formData.hsnCodeId ? formData.hsnCodeId : null,
    });
  };

  const categoryOptions = categories;
  const hsnCodeOptions = useMemo(() => {
    return [
      { value: "", label: "None / Not Applicable" },
      ...hsnCodes,
    ];
  }, [hsnCodes]);

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        {/* Row 1: Product Name & Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            name="name"
            label="Product Name"
            placeholder="Enter product name"
            required
          />

          <FormSelect
            name="categoryId"
            label="Category"
            placeholder="Select category"
            options={categoryOptions}
            required
          />
        </div>

        {/* Row 2: Product Code (full width) */}
        <div className="pt-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Label className="flex items-center gap-1">
              Product Code <span className="text-error-600 font-bold ml-1">*</span>
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
                        Enter product code (special characters allowed, e.g. BANANA_CHIPS). Category code prefix is automatically applied.
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
            {/* Non-editable Category Code prefix */}
            <div
              className="flex items-center px-3.5 bg-theme-surface-alt border-r border-theme-border text-theme-text-secondary font-mono text-xs font-semibold select-none max-w-[60%] shrink-0 truncate"
              title={
                slugPrefix
                  ? `Category Prefix: ${slugPrefix}`
                  : "Select Category to auto-generate prefix"
              }
            >
              {slugPrefix ? (
                <span className="font-semibold text-theme-text-primary tracking-wide truncate">
                  {slugPrefix}
                </span>
              ) : (
                <span className="text-theme-text-muted italic text-[11px]">
                  [category_code]_
                </span>
              )}
            </div>

            {/* Editable extra code for the product */}
            <input
              type="text"
              value={extraSlug}
              onChange={(e) => handleExtraSlugChange(e.target.value)}
              placeholder="Enter product code"
              className="flex-1 min-w-0 px-3.5 py-2 text-sm text-theme-text-primary bg-transparent outline-none font-mono placeholder:text-theme-text-muted placeholder:font-sans uppercase"
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
                      {extraSlug || "ENTER_PRODUCT_CODE"}
                    </span>
                  </span>
                ) : (
                  <span className="text-theme-text-muted italic font-sans">
                    Select category to generate prefix
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Row 3: HSN Code */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormSelect
            name="hsnCodeId"
            label="HSN Code"
            placeholder={hsnCodes.length > 0 ? "Select HSN code" : "None / No HSN codes available"}
            options={hsnCodeOptions}
            description="Optional: Harmonized System of Nomenclature code for GST"
          />
        </div>

        <FormImageUpload
          name="productImage"
          label="Product Image"
          folder="products"
          infoMessage="Upload a JPG, PNG, or WebP image up to 5MB. Recommended size: 500 × 500 px."
        />

        <div className="flex justify-end pt-4">
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

export { ProductForm };
