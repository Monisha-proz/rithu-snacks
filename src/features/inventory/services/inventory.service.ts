import { db } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/api-error";
import { inventoryRepository } from "../repositories/inventory.repository";
import type {
  GetInventoryParams,
  InventoryListItem,
  AdjustStockInput,
  CreateInventoryInput,
  InventoryTransactionItem,
} from "../types";

function mapToInventoryListItem(item: any): InventoryListItem {
  const v = item.variant_unit_price?.variant;
  const prod = v?.product;
  const available = Number(item.quantity_available ?? 0);
  const reserved = Number(item.quantity_reserved ?? 0);

  return {
    id: Number(item.id),
    productId: prod?.id ? Number(prod.id) : 0,
    variantId: v?.id ? Number(v.id) : null,
    quantity: available,
    reservedQuantity: reserved,
    reorderLevel: Number(item.reorderLevel ?? 0),
    availableQuantity: available - reserved,
    productName: prod?.name ?? "Unknown Product",
    productSlug: prod?.slug ?? "",
    variantName: v?.variant_name ?? undefined,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export const inventoryService = {
  async getInventory(params: GetInventoryParams) {
    const { data, total } = await inventoryRepository.findAll(params);

    return {
      data: data.map(mapToInventoryListItem),
      meta: {
        page: params.page || 1,
        limit: params.limit || 10,
        total,
        totalPages: Math.ceil(total / (params.limit || 10)),
      },
    };
  },

  async getInventoryItem(id: number) {
    const item = await inventoryRepository.findById(id);
    if (!item) {
      throw ApiError.notFound("Inventory item not found");
    }
    return mapToInventoryListItem(item);
  },

  async adjustStock(input: AdjustStockInput) {
    const inventory = await inventoryRepository.findById(input.inventoryId);
    if (!inventory) {
      throw ApiError.notFound("Inventory item not found");
    }

    const currentQty = inventory.quantity_available;
    const newQuantity = currentQty + input.quantity;

    if (newQuantity < 0) {
      throw ApiError.badRequest(
        `Insufficient stock. Available: ${currentQty}, Requested: ${Math.abs(input.quantity)}`
      );
    }

    const txType = input.quantity >= 0 ? ("in" as const) : ("out" as const);

    const transaction = await db.$transaction(async (tx) => {
      const txn = await tx.inventoryTransaction.create({
        data: {
          variant_unit_price: { connect: { id: inventory.variantUnitPriceId } },
          type: txType,
          quantity: Math.abs(input.quantity),
          note: input.notes ?? undefined,
        },
      });
      await tx.inventory.update({
        where: { id: BigInt(input.inventoryId) },
        data: { quantity_available: newQuantity },
      });
      return txn;
    });

    return transaction;
  },

  async createInventory(input: CreateInventoryInput) {
    const existing = await inventoryRepository.findByVariantUnitPriceId(
      input.variantId || input.productId
    );

    if (existing) {
      throw ApiError.conflict(
        "Inventory record already exists for this unit price"
      );
    }

    const inventory = await inventoryRepository.create({
      variant_unit_price: { connect: { id: BigInt(input.variantId || input.productId) } },
      quantity_available: input.quantity,
      reorderLevel: input.reorderLevel ?? 10,
    });

    return mapToInventoryListItem(inventory);
  },

  async getLowStock() {
    const items = await db.inventory.findMany({
      where: {
        is_active: true,
        quantity_available: { gt: 0 },
      },
      include: {
        variant_unit_price: {
          include: {
            variant: {
              select: {
                id: true,
                variant_name: true,
                product: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
      },
    });

    const lowStockItems = items.filter(
      (item) => item.quantity_available <= item.reorderLevel
    );

    return lowStockItems.map(mapToInventoryListItem);
  },

  async getOutOfStock() {
    const items = await db.inventory.findMany({
      where: { is_active: true, quantity_available: 0 },
      include: {
        variant_unit_price: {
          include: {
            variant: {
              select: {
                id: true,
                variant_name: true,
                product: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
      },
    });

    return items.map(mapToInventoryListItem);
  },

  async getTransactions(
    inventoryId: number,
    params: { page?: number; limit?: number; type?: string }
  ) {
    const inventory = await inventoryRepository.findById(inventoryId);
    if (!inventory) {
      throw ApiError.notFound("Inventory item not found");
    }

    const { data, total } =
      await inventoryRepository.findTransactionsByVariantUnitPriceId(
        inventory.variantUnitPriceId,
        {
          page: params.page,
          limit: params.limit,
          type: params.type as any,
        }
      );

    const mapped: InventoryTransactionItem[] = data.map((t) => ({
      id: Number(t.id),
      inventoryId: Number(inventory.id),
      type: t.type,
      quantity: t.quantity,
      referenceType: t.referenceType,
      referenceId: t.referenceId ? Number(t.referenceId) : null,
      notes: t.note,
      createdAt: t.createdAt,
      productName: (t as any).variant_unit_price?.variant?.product?.name ?? "",
    }));

    return {
      data: mapped,
      meta: {
        page: params.page || 1,
        limit: params.limit || 20,
        total,
        totalPages: Math.ceil(total / (params.limit || 20)),
      },
    };
  },
};
