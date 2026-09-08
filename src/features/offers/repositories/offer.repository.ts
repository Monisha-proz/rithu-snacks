import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type { GetOffersParams, OfferListItem, OfferType } from "../types";

const offerInclude = {
  offer_products: { include: { products: { select: { uuid: true } } } },
} satisfies Prisma.OfferInclude;

type OfferWithProducts = Prisma.OfferGetPayload<{ include: typeof offerInclude }>;

function toOfferListItem(offer: OfferWithProducts): OfferListItem {
  return {
    id: Number(offer.id),
    name: offer.name,
    type: offer.type as OfferType,
    value: Number(offer.value),
    minOrderAmount: offer.minOrderAmount != null ? Number(offer.minOrderAmount) : null,
    isActive: offer.isActive,
    startsAt: offer.startsAt,
    endsAt: offer.ends_at,
    createdAt: offer.createdAt,
    productUuids: offer.offer_products
      .map((op) => op.products?.uuid)
      .filter((uuid): uuid is string => !!uuid),
  };
}

function buildOfferWhere(params: GetOffersParams): Prisma.OfferWhereInput {
  const where: Prisma.OfferWhereInput = {};

  if (params.isActive !== undefined) {
    where.isActive = params.isActive;
  }

  if (params.search) {
    where.OR = [{ name: { contains: params.search } }];
  }

  return where;
}

export const offerRepository = {
  async findAll(params: GetOffersParams = {}) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const where = buildOfferWhere(params);

    const [data, total] = await Promise.all([
      db.offer.findMany({
        where,
        include: offerInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.offer.count({ where }),
    ]);

    return {
      data: data.map(toOfferListItem),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: number) {
    const offer = await db.offer.findUnique({
      where: { id },
      include: offerInclude,
    });
    return offer ? toOfferListItem(offer) : null;
  },

  async create(data: {
    name: string;
    type: OfferType;
    value: number;
    minOrderAmount?: number;
    isActive?: boolean;
    startsAt?: Date;
    endsAt?: Date;
    productIds: bigint[];
  }) {
    const offer = await db.offer.create({
      data: {
        name: data.name,
        type: data.type,
        value: data.value,
        minOrderAmount: data.minOrderAmount,
        isActive: data.isActive ?? true,
        startsAt: data.startsAt,
        ends_at: data.endsAt,
        offer_products: {
          create: data.productIds.map((productId) => ({ product_id: productId })),
        },
      },
      include: offerInclude,
    });
    return toOfferListItem(offer);
  },

  async update(
    id: number,
    data: {
      name?: string;
      type?: OfferType;
      value?: number;
      minOrderAmount?: number;
      isActive?: boolean;
      startsAt?: Date;
      endsAt?: Date;
      productIds?: bigint[];
    }
  ) {
    const updateData: Prisma.OfferUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.minOrderAmount !== undefined) updateData.minOrderAmount = data.minOrderAmount;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.startsAt !== undefined) updateData.startsAt = data.startsAt;
    if (data.endsAt !== undefined) updateData.ends_at = data.endsAt;

    const offer = await db.$transaction(async (tx) => {
      if (data.productIds !== undefined) {
        await tx.offer_products.deleteMany({ where: { offer_id: id } });
        updateData.offer_products = {
          create: data.productIds.map((productId) => ({ product_id: productId })),
        };
      }

      return tx.offer.update({
        where: { id },
        data: updateData,
        include: offerInclude,
      });
    });

    return toOfferListItem(offer);
  },

  async delete(id: number) {
    return db.offer.delete({ where: { id } });
  },

  async findActiveByProductIds(productIds: bigint[]) {
    if (productIds.length === 0) return [];

    const now = new Date();
    const rows = await db.offer_products.findMany({
      where: {
        product_id: { in: productIds },
        is_active: true,
        offers: {
          isActive: true,
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [{ OR: [{ ends_at: null }, { ends_at: { gte: now } }] }],
        },
      },
      include: { offers: true },
    });

    return rows.map((row) => ({
      productId: row.product_id,
      offer: {
        id: Number(row.offers.id),
        type: row.offers.type as OfferType,
        value: Number(row.offers.value),
        minOrderAmount:
          row.offers.minOrderAmount != null ? Number(row.offers.minOrderAmount) : null,
      },
    }));
  },
};
