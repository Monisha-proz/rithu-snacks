"use client";

import { useState, useCallback, useRef } from "react";
import { lookupPincode, type PincodeLookupSuccess } from "./pincode-lookup";

export interface UsePincodeLookupOptions {
  onSuccess?: (data: {
    state: string;
    district: string;
    country: string;
    cities: string[];
    defaultCity: string;
  }) => void;
  onError?: (error: string) => void;
}

export function usePincodeLookup(options: UsePincodeLookupOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [district, setDistrict] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const lastFetchedPinRef = useRef<string>("");
  const optionsRef = useRef<UsePincodeLookupOptions>(options);
  optionsRef.current = options;

  const fetchPincode = useCallback(
    async (
      pincode: string,
      customSuccessCallback?: (data: {
        state: string;
        district: string;
        country: string;
        cities: string[];
        defaultCity: string;
      }) => void
    ) => {
      const cleanPin = pincode.replace(/\D/g, "").slice(0, 6);
      if (cleanPin.length !== 6) {
        setCityOptions([]);
        setDistrict("");
        setState("");
        setError(null);
        return;
      }

      if (lastFetchedPinRef.current === cleanPin) {
        return;
      }

      setIsLoading(true);
      setError(null);

      const result = await lookupPincode(cleanPin);
      setIsLoading(false);

      if (result.success) {
        lastFetchedPinRef.current = cleanPin;
        setCityOptions(result.cities);
        setDistrict(result.district);
        setState(result.state);
        setCountry(result.country);
        setError(null);

        const callbackPayload = {
          state: result.state,
          district: result.district,
          country: result.country,
          cities: result.cities,
          defaultCity: result.cities[0] || result.district,
        };

        if (customSuccessCallback) {
          customSuccessCallback(callbackPayload);
        }
        if (optionsRef.current?.onSuccess) {
          optionsRef.current.onSuccess(callbackPayload);
        }
      } else {
        setCityOptions([]);
        setError(result.error);
        if (optionsRef.current?.onError) {
          optionsRef.current.onError(result.error);
        }
      }
    },
    []
  );

  const resetLookup = useCallback(() => {
    lastFetchedPinRef.current = "";
    setCityOptions([]);
    setDistrict("");
    setState("");
    setCountry("");
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    cityOptions,
    district,
    state,
    country,
    error,
    fetchPincode,
    resetLookup,
    setCityOptions,
  };
}
