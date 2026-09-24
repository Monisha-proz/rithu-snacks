/**
 * Service to lookup Indian postal pincode details from Postal Pincode API
 * API Endpoint: https://api.postalpincode.in/pincode/{pincode}
 */

export interface PostalPincodeOffice {
  Name: string;
  Description?: string | null;
  BranchType?: string;
  DeliveryStatus?: string;
  Circle?: string;
  District: string;
  Division?: string;
  Region?: string;
  Block?: string;
  State: string;
  Country?: string;
  Pincode?: string;
}

export interface PostalPincodeResponseItem {
  Message: string;
  Status: "Success" | "Error" | string;
  PostOffice: PostalPincodeOffice[] | null;
}

export interface PincodeLookupSuccess {
  success: true;
  pincode: string;
  state: string;
  district: string;
  country: string;
  cities: string[];
}

export interface PincodeLookupFailure {
  success: false;
  pincode: string;
  error: string;
}

export type PincodeLookupResult = PincodeLookupSuccess | PincodeLookupFailure;

// In-memory cache to prevent redundant HTTP requests for the same pincode
const pincodeCache = new Map<string, PincodeLookupResult>();

export async function lookupPincode(pincode: string): Promise<PincodeLookupResult> {
  const cleanPin = pincode.replace(/\D/g, "").slice(0, 6);
  if (cleanPin.length !== 6) {
    return {
      success: false,
      pincode: cleanPin,
      error: "PIN code must be 6 digits",
    };
  }

  if (pincodeCache.has(cleanPin)) {
    return pincodeCache.get(cleanPin)!;
  }

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const failure: PincodeLookupFailure = {
        success: false,
        pincode: cleanPin,
        error: `Failed to fetch pincode details (HTTP ${response.status})`,
      };
      return failure;
    }

    const data: PostalPincodeResponseItem[] = await response.json();
    const firstResult = data?.[0];

    if (
      firstResult &&
      firstResult.Status === "Success" &&
      Array.isArray(firstResult.PostOffice) &&
      firstResult.PostOffice.length > 0
    ) {
      const offices = firstResult.PostOffice;
      const state = offices[0]?.State?.trim() || "";
      const district = offices[0]?.District?.trim() || "";
      const country = offices[0]?.Country?.trim() || "India";

      // Extract unique city / post office area names
      const citySet = new Set<string>();
      for (const office of offices) {
        if (office.Name && office.Name.trim()) {
          citySet.add(office.Name.trim());
        }
      }

      const cities = Array.from(citySet);
      if (cities.length === 0 && district) {
        cities.push(district);
      }

      const successResult: PincodeLookupSuccess = {
        success: true,
        pincode: cleanPin,
        state,
        district,
        country,
        cities,
      };

      pincodeCache.set(cleanPin, successResult);
      return successResult;
    }

    const failure: PincodeLookupFailure = {
      success: false,
      pincode: cleanPin,
      error: firstResult?.Message || "No records found for this PIN code",
    };
    return failure;
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Network error during PIN code lookup";
    return {
      success: false,
      pincode: cleanPin,
      error: errorMsg,
    };
  }
}
