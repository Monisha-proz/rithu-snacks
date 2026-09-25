"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminBulkOrderKeys } from "@/lib/api/query-keys";
import { toast } from "@/components/ui/Toast";
import { submitBulkOrderEnquiry } from "../api/bulk-order.api";
import type { BulkOrderEnquiryResponse } from "../types";
import type { CreateBulkOrderInput } from "../validations/bulk-order.schema";

export function useSubmitBulkOrderEnquiry() {
  const queryClient = useQueryClient();

  return useMutation<BulkOrderEnquiryResponse, Error, CreateBulkOrderInput>({
    mutationFn: submitBulkOrderEnquiry,
    meta: { skipToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminBulkOrderKeys.all });
      toast.success("Bulk order submitted successfully");
    },
    onError: (error) => {
      toast.error(
        "Submission Failed",
        error.message || "Failed to submit your bulk order enquiry."
      );
    },
  });
}
