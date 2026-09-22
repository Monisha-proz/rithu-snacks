"use client";

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Info } from "lucide-react";
import { Select, type SelectOption } from "@/components/ui/select";
import { Label } from "./label";

interface FormSelectProps {
  name: string;
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  description?: string;
  infoMessage?: string;
  required?: boolean;
}

function FormSelect({
  name,
  label,
  options,
  placeholder,
  description,
  infoMessage,
  required,
}: FormSelectProps) {
  const { control } = useFormContext();
  const [showInfo, setShowInfo] = React.useState(false);
  const infoRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!showInfo) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setShowInfo(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showInfo]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className="pt-0">
          {label && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <Label htmlFor={name} className="flex items-center gap-1">
                {label}
                {required && (
                  <span className="text-error-600 font-bold ml-1">*</span>
                )}
              </Label>
              {infoMessage && (
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
                    <div className="absolute right-0 top-full mt-1.5 z-50 w-72 sm:w-80 rounded-xl bg-white border border-neutral-200/90 p-3 text-xs text-neutral-700 shadow-xl shadow-neutral-900/10 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-[var(--color-secondary-600)] shrink-0 mt-0.5" />
                          <p className="leading-relaxed text-[var(--color-neutral-800)]">
                            {infoMessage}
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
              )}
            </div>
          )}
          <Select
            {...field}
            options={options}
            placeholder={placeholder}
            error={fieldState.error?.message}
          />
          {description && !fieldState.error && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}
    />
  );
}

export { FormSelect };
