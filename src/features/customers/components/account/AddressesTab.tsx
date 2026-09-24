"use client";

import React, { useState } from "react";
import {
  useCustomerAddresses,
  useCreateCustomerAddress,
  useUpdateCustomerAddress,
  useDeleteCustomerAddress,
} from "../../hooks/use-customer-address";
import {
  createCustomerAddressSchema,
  updateCustomerAddressSchema,
  type CreateCustomerAddressInput,
} from "../../validations/customer-address.schema";
import type { CustomerAddressResponse } from "../../types/customer-address.types";
import { CustomDropdown } from "./CustomDropdown";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/Toast";
import { usePincodeLookup } from "@/lib/pincode";
import { Loader2 } from "lucide-react";

const LABEL_OPTIONS = [
  { value: "home", label: "Home" },
  { value: "work", label: "Work / Office" },
  { value: "parents", label: "Parents / Family" },
  { value: "other", label: "Other" },
];

type AddressFormData = {
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  addressType: "shipping" | "billing";
  isDefault: boolean;
};

export function AddressesTab() {
  const { data: addresses = [], isLoading, error, refetch } = useCustomerAddresses();
  const createMutation = useCreateCustomerAddress();
  const updateMutation = useUpdateCustomerAddress();
  const deleteMutation = useDeleteCustomerAddress();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<CustomerAddressResponse | null>(null);

  const {
    isLoading: isPincodeLoading,
    cityOptions,
    fetchPincode,
    resetLookup,
  } = usePincodeLookup();

  const [formData, setFormData] = useState<AddressFormData>({
    label: "home",
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    addressType: "shipping",
    isDefault: false,
  });

  const validateAddressField = (field: string, value: string): string => {
    switch (field) {
      case "fullName": {
        const trimmed = value.trim();
        if (!trimmed) return "Full name is required";
        if (trimmed.length < 2) return "Full name must be at least 2 characters";
        if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) return "Full name can only contain letters and spaces";
        if (trimmed.length > 150) return "Full name cannot exceed 150 characters";
        return "";
      }
      case "phone": {
        const digits = value.replace(/\D/g, "");
        if (!digits) return "Phone number is required";
        if (!/^[6-9]/.test(digits)) return "Phone number must start with 6, 7, 8, or 9";
        if (digits.length < 10) return "Phone number must be exactly 10 digits";
        return "";
      }
      case "addressLine1": {
        const trimmed = value.trim();
        if (!trimmed) return "Address Line 1 is required";
        if (trimmed.length < 3) return "Address must be at least 3 characters";
        if (trimmed.length > 255) return "Address Line 1 cannot exceed 255 characters";
        return "";
      }
      case "city": {
        const trimmed = value.trim();
        if (!trimmed) return "City is required";
        if (trimmed.length < 2) return "City must be at least 2 characters";
        if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) return "City can only contain letters and spaces";
        if (trimmed.length > 100) return "City cannot exceed 100 characters";
        return "";
      }
      case "state": {
        const trimmed = value.trim();
        if (!trimmed) return "State is required";
        return "";
      }
      case "pincode": {
        const digits = value.replace(/\D/g, "");
        if (!digits) return "PIN code is required";
        if (digits.startsWith("0")) return "Invalid PIN code (cannot start with 0)";
        if (digits.length < 6) return "PIN code must be exactly 6 digits";
        return "";
      }
      default:
        return "";
    }
  };

  const handleFieldChange = (field: keyof AddressFormData, rawValue: string | boolean) => {
    let value = rawValue;

    if (field === "phone" && typeof rawValue === "string") {
      value = rawValue.replace(/\D/g, "").slice(0, 10);
    } else if (field === "pincode" && typeof rawValue === "string") {
      const cleanDigits = rawValue.replace(/\D/g, "").slice(0, 6);
      value = cleanDigits;

      if (cleanDigits.length === 6) {
        fetchPincode(cleanDigits, (data) => {
          setFormData((prev) => ({
            ...prev,
            state: data.state || prev.state,
            city: data.cities.includes(prev.city)
              ? prev.city
              : data.defaultCity || prev.city,
          }));

          if (editingId) {
            setDirtyFields((prev) => {
              const next = new Set(prev);
              if (data.state) next.add("state");
              if (data.defaultCity) next.add("city");
              next.add("pincode");
              return next;
            });
          }

          setFieldErrors((prev) => {
            const next = { ...prev };
            delete next.pincode;
            delete next.state;
            delete next.city;
            return next;
          });
        });
      }
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
    if (editingId) {
      setDirtyFields((prev) => new Set(prev).add(field));
    }

    if (typeof value === "string") {
      const errorMsg = validateAddressField(field, value);
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (errorMsg) {
          next[field] = errorMsg;
        } else {
          delete next[field];
        }
        return next;
      });
    }

    if (serverError) {
      setServerError(null);
    }
  };

  const handleStartEdit = (address: CustomerAddressResponse) => {
    const loadedData: AddressFormData = {
      label: address.label || "home",
      fullName: address.fullName || "",
      phone: address.phone ? address.phone.replace(/^\+91/, "").trim() : "",
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      landmark: address.landmark || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
      country: address.country || "India",
      addressType: (address.addressType as "shipping" | "billing") || "shipping",
      isDefault: Boolean(address.isDefault),
    };

    setFormData(loadedData);
    setDirtyFields(new Set());
    setEditingId(address.id);
    setFieldErrors({});
    setServerError(null);
    setIsAdding(true);

    if (address.pincode && address.pincode.length === 6) {
      fetchPincode(address.pincode);
    } else {
      resetLookup();
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setDirtyFields(new Set());
    setFieldErrors({});
    setServerError(null);
    resetLookup();
    setFormData({
      label: "home",
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      addressType: "shipping",
      isDefault: false,
    });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setFieldErrors({});
    setServerError(null);

    if (editingId) {
      // EDIT MODE: If no fields were touched, exit gracefully
      if (dirtyFields.size === 0) {
        handleCancel();
        return;
      }

      // Construct payload containing strictly only dirty/touched fields
      const dirtyPayload: Record<string, any> = {};
      if (dirtyFields.has("fullName")) dirtyPayload.fullName = formData.fullName.trim();
      if (dirtyFields.has("phone")) dirtyPayload.phone = formData.phone.trim();
      if (dirtyFields.has("label")) dirtyPayload.label = formData.label.trim() || undefined;
      if (dirtyFields.has("addressType")) dirtyPayload.addressType = formData.addressType;
      if (dirtyFields.has("addressLine1")) dirtyPayload.addressLine1 = formData.addressLine1.trim();
      if (dirtyFields.has("addressLine2")) dirtyPayload.addressLine2 = formData.addressLine2.trim() || undefined;
      if (dirtyFields.has("landmark")) dirtyPayload.landmark = formData.landmark.trim() || undefined;
      if (dirtyFields.has("city")) dirtyPayload.city = formData.city.trim();
      if (dirtyFields.has("state")) dirtyPayload.state = formData.state.trim();
      if (dirtyFields.has("pincode")) dirtyPayload.pincode = formData.pincode.trim();
      if (dirtyFields.has("isDefault")) dirtyPayload.isDefault = formData.isDefault;

      // Validate only modified fields with update schema
      const validationResult = updateCustomerAddressSchema.safeParse(dirtyPayload);
      if (!validationResult.success) {
        const errors: Record<string, string> = {};
        validationResult.error.issues.forEach((issue) => {
          const fieldName = String(issue.path[0] || "general");
          if (!errors[fieldName]) {
            errors[fieldName] = issue.message;
          }
        });
        setFieldErrors(errors);
        return;
      }

      try {
        await updateMutation.mutateAsync({
          uuid: editingId,
          data: dirtyPayload,
        });
        toast.success("Address updated successfully!");
        handleCancel();
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : "Failed to update address. Please verify your details.";
        setServerError(errorMsg);
        toast.error(errorMsg);
      }
    } else {
      // CREATE MODE: Full payload validation and submission
      const payload: CreateCustomerAddressInput = {
        label: formData.label.trim() || undefined,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim() || undefined,
        landmark: formData.landmark.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        country: formData.country || "India",
        addressType: formData.addressType || "shipping",
        isDefault: formData.isDefault,
      };

      const validationResult = createCustomerAddressSchema.safeParse(payload);
      if (!validationResult.success) {
        const errors: Record<string, string> = {};
        validationResult.error.issues.forEach((issue) => {
          const fieldName = String(issue.path[0] || "general");
          if (!errors[fieldName]) {
            errors[fieldName] = issue.message;
          }
        });
        setFieldErrors(errors);
        return;
      }

      try {
        await createMutation.mutateAsync(payload);
        toast.success("Address added successfully!");
        handleCancel();
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : "Failed to save address. Please verify your details.";
        setServerError(errorMsg);
        toast.error(errorMsg);
      }
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await updateMutation.mutateAsync({
        uuid: addressId,
        data: { isDefault: true },
      });
      toast.success("Default delivery address updated!");
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update default address.";
      toast.error(errorMsg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!addressToDelete) return;
    const targetId = addressToDelete.id;
    try {
      await deleteMutation.mutateAsync(targetId);
      toast.success("Address deleted successfully!");
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to delete address.";
      toast.error(errorMsg);
    } finally {
      setAddressToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="bg-theme-surface border border-theme-border rounded-xl p-5 animate-pulse space-y-3 overflow-hidden"
          >
            <div className="h-5 rounded w-1/3 skeleton-shimmer" />
            <div className="h-10 rounded w-full skeleton-shimmer" />
            <div className="h-4 rounded w-1/2 skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-theme-surface border border-theme-border rounded-2xl p-8 text-center space-y-4">
        <p className="text-sm text-theme-text-muted">Failed to load saved addresses.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="bg-theme-primary text-theme-primary-fg px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {/* Tab Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-theme-text-secondary">
          {isAdding
            ? editingId
              ? "Edit Delivery Address"
              : "New Delivery Address"
            : "Saved Addresses"}
        </h2>
        {!isAdding && (
          <button
            type="button"
            onClick={() => {
              handleCancel();
              setIsAdding(true);
            }}
            className="bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-fg text-xs font-semibold uppercase tracking-wider py-2.5 px-5 rounded-lg transition-colors cursor-pointer min-h-[40px]"
          >
            Add New Address
          </button>
        )}
      </div>

      {/* Add / Edit Address Form */}
      {isAdding ? (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-theme-surface border border-theme-border rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs transition-all relative"
        >
          {/* Header with Title and Address Type Toggle */}
          <div className="flex items-center justify-between gap-3 flex-wrap pb-3 border-b border-theme-border-subtle">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-theme-text-secondary">
              {editingId ? "Edit Delivery Address" : "New Delivery Address"}
            </h3>

            {/* Address Type Toggle (Shipping / Billing) */}
            <div className="flex items-center gap-1 bg-theme-surface-warm p-1 rounded-xl border border-theme-border">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleFieldChange("addressType", "shipping")}
                className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                  formData.addressType === "shipping"
                    ? "bg-theme-secondary text-theme-secondary-fg shadow-xs"
                    : "text-theme-text-muted hover:text-theme-text-primary"
                }`}
              >
                Shipping
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleFieldChange("addressType", "billing")}
                className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                  formData.addressType === "billing"
                    ? "bg-theme-secondary text-theme-secondary-fg shadow-xs"
                    : "text-theme-text-muted hover:text-theme-text-primary"
                }`}
              >
                Billing
              </button>
            </div>
          </div>

          {/* Server Error Banner */}
          {serverError && (
            <div className="bg-theme-status-can-bg border border-red-200 text-theme-status-can-fg p-3.5 rounded-lg text-xs font-medium">
              <span className="font-semibold">Validation Error:</span> {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-theme-text-secondary">
                Full Name <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <input
                type="text"
                disabled={isSubmitting}
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => handleFieldChange("fullName", e.target.value)}
                className={`border rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm focus:border-theme-primary transition-colors disabled:opacity-50 ${
                  fieldErrors.fullName ? "border-red-500 bg-red-50/20" : "border-theme-border-input"
                }`}
              />
              {fieldErrors.fullName && (
                <span className="text-xs text-red-500 font-medium">{fieldErrors.fullName}</span>
              )}
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-theme-text-secondary">
                Phone Number (10 digits) <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                disabled={isSubmitting}
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) => handleFieldChange("phone", e.target.value)}
                className={`border rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm focus:border-theme-primary transition-colors disabled:opacity-50 ${
                  fieldErrors.phone ? "border-red-500 bg-red-50/20" : "border-theme-border-input"
                }`}
              />
              {fieldErrors.phone && (
                <span className="text-xs text-red-500 font-medium">{fieldErrors.phone}</span>
              )}
            </div>

            {/* Custom Dropdown for Address Label */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-theme-text-secondary">
                Address Label
              </label>
              <CustomDropdown
                options={LABEL_OPTIONS}
                value={formData.label}
                onChange={(val) => handleFieldChange("label", val)}
                disabled={isSubmitting}
              />
            </div>

            {/* PIN Code */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-theme-text-secondary flex items-center justify-between">
                <span>
                  PIN Code (6 digits) <span className="text-red-500 font-bold ml-0.5">*</span>
                </span>
                {isPincodeLoading && (
                  <span className="text-[10px] text-theme-primary flex items-center gap-1 font-normal">
                    <Loader2 className="w-3 h-3 animate-spin" /> Fetching area...
                  </span>
                )}
              </label>
              <input
                type="text"
                inputMode="numeric"
                disabled={isSubmitting}
                maxLength={6}
                placeholder="Enter 6-digit PIN code"
                value={formData.pincode}
                onChange={(e) => handleFieldChange("pincode", e.target.value)}
                className={`border rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm focus:border-theme-primary transition-colors disabled:opacity-50 ${
                  fieldErrors.pincode ? "border-red-500 bg-red-50/20" : "border-theme-border-input"
                }`}
              />
              {fieldErrors.pincode && (
                <span className="text-xs text-red-500 font-medium">{fieldErrors.pincode}</span>
              )}
            </div>

            {/* Address Line 1 */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-semibold text-theme-text-secondary">
                Flat / House No., Building, Street <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <input
                type="text"
                disabled={isSubmitting}
                placeholder="Enter house / flat no., building, street"
                value={formData.addressLine1}
                onChange={(e) => handleFieldChange("addressLine1", e.target.value)}
                className={`border rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm focus:border-theme-primary transition-colors disabled:opacity-50 ${
                  fieldErrors.addressLine1 ? "border-red-500 bg-red-50/20" : "border-theme-border-input"
                }`}
              />
              {fieldErrors.addressLine1 && (
                <span className="text-xs text-red-500 font-medium">{fieldErrors.addressLine1}</span>
              )}
            </div>

            {/* Address Line 2 */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-semibold text-theme-text-secondary">
                Address Line 2 (Area, Colony, Sector)
              </label>
              <input
                type="text"
                disabled={isSubmitting}
                placeholder="Enter area, colony, sector (optional)"
                value={formData.addressLine2}
                onChange={(e) => handleFieldChange("addressLine2", e.target.value)}
                className={`border rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm focus:border-theme-primary transition-colors disabled:opacity-50 ${
                  fieldErrors.addressLine2 ? "border-red-500 bg-red-50/20" : "border-theme-border-input"
                }`}
              />
              {fieldErrors.addressLine2 && (
                <span className="text-xs text-red-500 font-medium">{fieldErrors.addressLine2}</span>
              )}
            </div>

            {/* Landmark */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-semibold text-theme-text-secondary">
                Landmark (Optional)
              </label>
              <input
                type="text"
                disabled={isSubmitting}
                placeholder="Enter landmark (optional)"
                value={formData.landmark}
                onChange={(e) => handleFieldChange("landmark", e.target.value)}
                className="border border-theme-border-input rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm focus:border-theme-primary transition-colors disabled:opacity-50"
              />
            </div>

            {/* City */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-theme-text-secondary flex items-center justify-between">
                <span>
                  City / Area <span className="text-red-500 font-bold ml-0.5">*</span>
                </span>
                {cityOptions.length > 0 && (
                  <span className="text-[10px] text-theme-text-muted font-normal">
                    ({cityOptions.length} areas found)
                  </span>
                )}
              </label>
              {cityOptions.length > 0 ? (
                <CustomDropdown
                  options={
                    formData.city && !cityOptions.includes(formData.city)
                      ? [{ value: formData.city, label: formData.city }, ...cityOptions.map((c) => ({ value: c, label: c }))]
                      : cityOptions.map((c) => ({ value: c, label: c }))
                  }
                  value={formData.city}
                  onChange={(val) => handleFieldChange("city", val)}
                  placeholder="Select City / Area"
                  disabled={isSubmitting}
                  error={fieldErrors.city}
                />
              ) : (
                <input
                  type="text"
                  disabled={isSubmitting}
                  placeholder="Enter your city"
                  value={formData.city}
                  onChange={(e) => handleFieldChange("city", e.target.value)}
                  className={`border rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm focus:border-theme-primary transition-colors disabled:opacity-50 ${
                    fieldErrors.city ? "border-red-500 bg-red-50/20" : "border-theme-border-input"
                  }`}
                />
              )}
              {fieldErrors.city && !cityOptions.length && (
                <span className="text-xs text-red-500 font-medium">{fieldErrors.city}</span>
              )}
            </div>

            {/* State */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-theme-text-secondary">
                State <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <input
                type="text"
                disabled={isSubmitting}
                placeholder="Enter your state"
                value={formData.state}
                onChange={(e) => handleFieldChange("state", e.target.value)}
                className={`border rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm focus:border-theme-primary transition-colors disabled:opacity-50 ${
                  fieldErrors.state ? "border-red-500 bg-red-50/20" : "border-theme-border-input"
                }`}
              />
              {fieldErrors.state && (
                <span className="text-xs text-red-500 font-medium">{fieldErrors.state}</span>
              )}
            </div>

            {/* Set as Default Checkbox */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none pt-2 sm:col-span-2">
              <input
                type="checkbox"
                disabled={isSubmitting}
                checked={formData.isDefault}
                onChange={(e) => handleFieldChange("isDefault", e.target.checked)}
                className="w-4 h-4 rounded text-theme-primary accent-theme-primary cursor-pointer disabled:opacity-50"
              />
              <span className="text-xs font-medium text-theme-text-primary">
                Set as default delivery address
              </span>
            </label>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-theme-secondary hover:bg-theme-secondary-hover text-theme-secondary-fg text-xs font-semibold uppercase tracking-wider py-2.5 px-6 rounded-lg transition-colors cursor-pointer min-h-[40px] disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && (
                <svg className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSubmitting
                ? editingId
                  ? "Updating..."
                  : "Saving..."
                : editingId
                ? "Update Address"
                : "Save Address"}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCancel}
              className="border border-theme-border text-theme-text-subtle text-xs font-semibold uppercase tracking-wider py-2.5 px-5 rounded-lg cursor-pointer hover:bg-theme-surface-alt transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : addresses.length === 0 ? (
        <div className="bg-theme-surface border border-theme-border rounded-2xl p-10 text-center shadow-2xs">
          <p className="text-sm text-theme-text-muted">No saved delivery addresses found.</p>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="bg-theme-secondary hover:bg-theme-secondary-hover text-theme-secondary-fg text-xs font-semibold uppercase tracking-wider py-3 px-6 rounded-lg transition-colors cursor-pointer mt-4 min-h-[44px]"
          >
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addresses.map((a: CustomerAddressResponse) => {
            const labelUpper = (a.label || "Delivery").toUpperCase();
            const isBilling = a.addressType === "billing";

            return (
              <div
                key={a.id}
                className="bg-theme-surface border border-theme-border rounded-xl p-5 flex flex-col justify-between gap-3 shadow-2xs hover:border-theme-primary/30 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold uppercase tracking-wider text-theme-primary">
                      {labelUpper}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isBilling
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {a.addressType || "shipping"}
                    </span>
                    {a.isDefault && (
                      <span className="bg-theme-status-out-bg text-theme-status-out-fg text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>

                  <div className="text-sm font-bold text-theme-text-primary">
                    {a.fullName}
                  </div>
                  <div className="text-xs sm:text-sm text-theme-text-primary font-normal leading-relaxed">
                    {a.addressLine1}
                    {a.addressLine2 ? `, ${a.addressLine2}` : ""}
                    {a.landmark ? ` (Near ${a.landmark})` : ""}, {a.city} — {a.pincode}, {a.state}
                  </div>
                  <div className="text-xs text-theme-text-secondary font-medium">
                    Phone: {a.phone}
                  </div>
                </div>

                {/* Card Action Buttons: Set as Default, Edit & Delete */}
                <div className="flex items-center gap-4 pt-2 border-t border-theme-border-subtle text-xs">
                  {!a.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(a.id)}
                      disabled={updateMutation.isPending || deleteMutation.isPending}
                      className="font-medium text-theme-primary hover:text-theme-secondary cursor-pointer transition-colors disabled:opacity-50"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={updateMutation.isPending || deleteMutation.isPending}
                    onClick={() => handleStartEdit(a)}
                    className="font-medium text-theme-secondary hover:text-theme-primary cursor-pointer transition-colors ml-auto disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={updateMutation.isPending || deleteMutation.isPending}
                    onClick={() => setAddressToDelete(a)}
                    className="font-medium text-theme-status-can-fg hover:text-red-700 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(addressToDelete)}
        onClose={() => setAddressToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Address"
        description={`Are you sure you want to delete the saved address for "${addressToDelete?.fullName || "this contact"}"? This action cannot be undone.`}
        confirmText={deleteMutation.isPending ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
