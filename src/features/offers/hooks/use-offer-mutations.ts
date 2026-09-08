"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { offerKeys } from "@/lib/api/query-keys";
import { createOffer, updateOffer, deleteOffer } from "../api/get-offers";

export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createOffer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offerKeys.all });
    },
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      updateOffer(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: offerKeys.all });
      queryClient.invalidateQueries({ queryKey: offerKeys.detail(variables.id) });
    },
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteOffer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offerKeys.all });
    },
  });
}
