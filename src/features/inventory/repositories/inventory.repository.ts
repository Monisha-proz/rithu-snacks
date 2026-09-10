import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type { inventory_transactions_type } from "@/generated/prisma";

interface FindAllParams {
  page?: number;
  limit?: number;
  search?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
}

interface FindTransactionsParams {
  page?: number;
  limit?: number;
  type?: inventory_transactions_type;
}

export const inventoryRepository = {
  async findAll(params: FindAllParams) {
    const { page = 1, limit = 10, search, lowStock, outOfStock } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryWhereInput = { is_active: true };

    if (search) {
      where.variant_unit_price = {
        variant: {
          product: {
            name: { contains: search },
          },
        },
      };
    }

    if (lowStock) {
      where.quantity_available = { gt: 0 };
    }

    if (outOfStock) {
      where.quantity_available = 0;
    }

    const [data, total] = await Promise.all([
      db.inventory.findMany({
        where,
        include: {
          variant_unit_price: {
            include: {
              variant: {
                select: {
                  id: true,
                  variant_name: true,
                  product: {
                    select: { id: true, name: true, slug: true },
                  },
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      db.inventory.count({ where }),
    ]);

    return { data, total };
  },

  async findById(id: number | bigint) {
    return db.inventory.findUnique({
      where: { id: BigInt(id) },
      include: {
        variant_unit_price: {
          include: {
            variant: {
              select: {
                id: true,
                variant_name: true,
                product: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
          },
        },
      },
    });
  },

  async findByVariantUnitPriceId(variantUnitPriceId: number | bigint) {
    return db.inventory.findFirst({
      where: {
        variantUnitPriceId: BigInt(variantUnitPriceId),
        is_active: true,
      },
    });
  },

  async create(data: Prisma.InventoryCreateInput) {
    return db.inventory.create({ data });
  },

  async update(id: number | bigint, data: Prisma.InventoryUpdateInput) {
    return db.inventory.update({ where: { id: BigInt(id) }, data });
  },

  async findTransactionsByVariantUnitPriceId(
    variantUnitPriceId: number | bigint,
    params: FindTransactionsParams
  ) {
    const { page = 1, limit = 20, type } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryTransactionWhereInput = {
      variant_unit_price_id: BigInt(variantUnitPriceId),
      is_active: true,
    };

    if (type) {
      where.type = type;
    }

    const [data, total] = await Promise.all([
      db.inventoryTransaction.findMany({
        where,
        include: {
          variant_unit_price: {
            include: {
              variant: {
                select: {
                  product: { select: { name: true } },
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.inventoryTransaction.count({ where }),
    ]);

    return { data, total };
  },

  async createTransaction(
    data: Prisma.InventoryTransactionCreateInput
  ) {
    return db.inventoryTransaction.create({ data });
  },
};
