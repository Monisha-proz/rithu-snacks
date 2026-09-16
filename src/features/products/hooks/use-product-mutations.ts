"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productKeys, variantKeys } from "@/lib/api/query-keys";
import {
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  bulkDeleteAdminProducts,
} from "../api/get-products";

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createAdminProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["customer", "catalog"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      uuid,
      data,
    }: {
      uuid: string;
      data: Record<string, unknown>;
    }) => updateAdminProduct(uuid, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.uuid) });
      queryClient.invalidateQueries({
        queryKey: [...productKeys.all, "images", variables.uuid],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "products", "detail", variables.uuid],
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["customer", "catalog"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => deleteAdminProduct(uuid),
    meta: { skipToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: variantKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "variants"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["customer", "catalog"] });
    },
  });
}

export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuids: string[]) => bulkDeleteAdminProducts(uuids),
    meta: { skipToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: variantKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "variants"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["customer", "catalog"] });
    },
  });
}



export function useCreateProductImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productUuid,
      images,
    }: {
      productUuid: string;
      images: Array<{
        imageUrl: string;
        sortOrder?: number;
        isPrimary?: boolean;
      }>;
    }) => {
      const { createAdminProductImages } = await import("../api/get-products");
      return createAdminProductImages(productUuid, images);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({
        queryKey: [...productKeys.all, "images", variables.productUuid],
      });
      queryClient.invalidateQueries({ queryKey: ["customer", "catalog"] });
    },
  });
}

export function useUpdateProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productUuid,
      imageId,
      data,
    }: {
      productUuid: string;
      imageId: string;
      data: { imageUrl?: string; sortOrder?: number };
    }) => {
      const { updateAdminProductImage } = await import("../api/get-products");
      return updateAdminProductImage(productUuid, imageId, data);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({
        queryKey: [...productKeys.all, "images", variables.productUuid],
      });
      queryClient.invalidateQueries({ queryKey: ["customer", "catalog"] });
    },
  });
}

export function useSetPrimaryProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productUuid,
      imageId,
    }: {
      productUuid: string;
      imageId: string;
    }) => {
      const { setPrimaryAdminProductImage } = await import("../api/get-products");
      return setPrimaryAdminProductImage(productUuid, imageId);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({
        queryKey: [...productKeys.all, "images", variables.productUuid],
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productUuid),
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "products", "detail", variables.productUuid],
      });
      queryClient.invalidateQueries({ queryKey: ["customer", "catalog"] });
    },
  });
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productUuid,
      imageId,
    }: {
      productUuid: string;
      imageId: string;
    }) => {
      const { deleteAdminProductImage } = await import("../api/get-products");
      return deleteAdminProductImage(productUuid, imageId);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({
        queryKey: [...productKeys.all, "images", variables.productUuid],
      });
      queryClient.invalidateQueries({ queryKey: ["customer", "catalog"] });
    },
  });
}
