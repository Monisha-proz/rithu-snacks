"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";

interface FormCheckboxProps {
  name: string;
  label: string;
  description?: string;
  className?: string;
}

function FormCheckbox({ name, label, description, className }: FormCheckboxProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Checkbox
          label={label}
          description={description}
          checked={Boolean(field.value)}
          onChange={field.onChange}
          error={fieldState.error?.message}
          className={className}
        />
      )}
    />
  );
}

export { FormCheckbox };
