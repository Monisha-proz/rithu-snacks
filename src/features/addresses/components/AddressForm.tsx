"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createAddressSchema,
  type CreateAddressSchemaInput,
} from "../validations/address.schema";
import type { AddressItem } from "../types";
import { usePincodeLookup } from "@/lib/pincode";
import { Select } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface AddressFormProps {
  defaultValues?: AddressItem | null;
  isSubmitting?: boolean;
  onSubmit: (data: CreateAddressSchemaInput) => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500 font-medium">{message}</p>;
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

export function AddressForm({
  defaultValues,
  isSubmitting = false,
  onSubmit,
}: AddressFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm<CreateAddressSchemaInput>({
    resolver: zodResolver(createAddressSchema),
    defaultValues: {
      firstName: defaultValues?.firstName ?? "",
      lastName: defaultValues?.lastName ?? "",
      phone: defaultValues?.phone ?? "",
      addressLine1: defaultValues?.addressLine1 ?? "",
      addressLine2: defaultValues?.addressLine2 ?? "",
      city: defaultValues?.city ?? "",
      state: defaultValues?.state ?? "",
      postalCode: defaultValues?.postalCode ?? "",
      country: defaultValues?.country ?? "India",
      isDefault: defaultValues?.isDefault ?? false,
    },
  });

  const {
    isLoading: isPincodeLoading,
    cityOptions,
    fetchPincode,
  } = usePincodeLookup();

  const currentCity = watch("city");
  const currentPostalCode = watch("postalCode");

  const addressCityOptions = React.useMemo(() => {
    const opts = cityOptions.map((c) => ({ value: c, label: c }));
    if (currentCity && !cityOptions.includes(currentCity)) {
      return [{ value: currentCity, label: currentCity }, ...opts];
    }
    return opts;
  }, [cityOptions, currentCity]);

  React.useEffect(() => {
    if (defaultValues?.postalCode && defaultValues.postalCode.length === 6) {
      fetchPincode(defaultValues.postalCode);
    }
  }, [defaultValues?.postalCode, fetchPincode]);

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "").slice(0, 6);
    setValue("postalCode", rawVal, { shouldValidate: true, shouldDirty: true });

    if (rawVal.length === 6) {
      fetchPincode(rawVal, (data) => {
        if (data.state) {
          setValue("state", data.state, { shouldValidate: true, shouldDirty: true });
          clearErrors("state");
        }
        if (data.defaultCity) {
          const selectedCity = data.cities.includes(currentCity) ? currentCity : data.defaultCity;
          setValue("city", selectedCity, { shouldValidate: true, shouldDirty: true });
          clearErrors("city");
        }
      });
    }
  };

  return (
    <form id="address-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-error-600">*</span>
          </label>
          <input {...register("firstName")} className={inputClass} placeholder="First name" />
          <FieldError message={errors.firstName?.message} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input {...register("lastName")} className={inputClass} placeholder="Last name" />
          <FieldError message={errors.lastName?.message} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mobile <span className="text-error-600">*</span>
        </label>
        <input {...register("phone")} className={inputClass} placeholder="Mobile number" />
        <FieldError message={errors.phone?.message} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
            <span>Pincode <span className="text-error-600">*</span></span>
            {isPincodeLoading && (
              <span className="text-xs text-primary font-normal flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Fetching area...
              </span>
            )}
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={currentPostalCode}
            onChange={handlePostalCodeChange}
            className={inputClass}
            placeholder="6-digit Pincode"
          />
          <FieldError message={errors.postalCode?.message} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
            <span>City / Area <span className="text-error-600">*</span></span>
            {cityOptions.length > 0 && (
              <span className="text-xs text-gray-500 font-normal">
                ({cityOptions.length} areas found)
              </span>
            )}
          </label>
          {cityOptions.length > 0 ? (
            <Select
              value={currentCity}
              onValueChange={(val) => {
                setValue("city", val, { shouldValidate: true, shouldDirty: true });
                clearErrors("city");
              }}
              options={addressCityOptions}
              placeholder="Select City / Area"
              error={Boolean(errors.city)}
            />
          ) : (
            <input {...register("city")} className={inputClass} placeholder="City" />
          )}
          <FieldError message={errors.city?.message} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State <span className="text-error-600">*</span>
          </label>
          <input {...register("state")} className={inputClass} placeholder="State" />
          <FieldError message={errors.state?.message} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <input {...register("country")} className={inputClass} placeholder="Country" />
          <FieldError message={errors.country?.message} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 1 <span className="text-error-600">*</span>
        </label>
        <input {...register("addressLine1")} className={inputClass} placeholder="House no, street, area" />
        <FieldError message={errors.addressLine1?.message} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 2
        </label>
        <input {...register("addressLine2")} className={inputClass} placeholder="Apartment, landmark (optional)" />
        <FieldError message={errors.addressLine2?.message} />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isDefault"
          {...register("isDefault")}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
          Set as default address
        </label>
      </div>

      {isSubmitting && (
        <p className="text-sm text-muted-foreground">Saving address...</p>
      )}
    </form>
  );
}

