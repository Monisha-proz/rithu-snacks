import { ApiError } from "@/lib/api/api-error";
import { productRepository } from "@/features/products/repositories/product.repository";
import { offerRepository } from "../repositories/offer.repository";
import type { GetOffersParams, CreateOfferInput, UpdateOfferInput } from "../types";

async function resolveProductIds(uuids: string[]) {
  const products = await Promise.all(uuids.map((uuid) => productRepository.findByUuid(uuid)));
  const missingIndex = products.findIndex((product) => !product);
  if (missingIndex !== -1) {
    throw ApiError.notFound(`Product not found: ${uuids[missingIndex]}`);
  }
  return products.map((product) => product!.id);
}

export const offerService = {
  async getOffers(params: GetOffersParams = {}) {
    return offerRepository.findAll(params);
  },

  async getOffer(id: number) {
    const offer = await offerRepository.findById(id);
    if (!offer) {
      throw ApiError.notFound("Offer not found");
    }
    return offer;
  },

  async createOffer(data: CreateOfferInput) {
    const productIds = await resolveProductIds(data.productUuids);

    return offerRepository.create({
      name: data.name,
      type: data.type,
      value: data.value,
      minOrderAmount: data.minOrderAmount,
      isActive: data.isActive ?? true,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      productIds,
    });
  },

  async updateOffer(id: number, data: UpdateOfferInput) {
    const existing = await offerRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("Offer not found");
    }

    const productIds =
      data.productUuids !== undefined ? await resolveProductIds(data.productUuids) : undefined;

    return offerRepository.update(id, {
      name: data.name,
      type: data.type,
      value: data.value,
      minOrderAmount: data.minOrderAmount,
      isActive: data.isActive,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      productIds,
    });
  },

  async deleteOffer(id: number) {
    const existing = await offerRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("Offer not found");
    }
    return offerRepository.delete(id);
  },

  async calculateCartDiscount(
    items: { productId: bigint; quantity: number; lineTotal: number }[],
    subtotal: number
  ) {
    if (items.length === 0) return 0;

    const activeOffers = await offerRepository.findActiveByProductIds(
      items.map((item) => item.productId)
    );

    const offersByProduct = new Map<string, (typeof activeOffers)[number]["offer"][]>();
    for (const row of activeOffers) {
      const key = row.productId.toString();
      const list = offersByProduct.get(key) ?? [];
      list.push(row.offer);
      offersByProduct.set(key, list);
    }

    let totalDiscount = 0;
    for (const item of items) {
      const offers = offersByProduct.get(item.productId.toString()) ?? [];
      let bestDiscount = 0;

      for (const offer of offers) {
        if (offer.minOrderAmount != null && subtotal < offer.minOrderAmount) continue;
        // BXGY offers require buy/get quantity config not yet in the schema; skipped for now.
        if (offer.type === "bxgy") continue;

        const discount =
          offer.type === "percentage"
            ? (item.lineTotal * offer.value) / 100
            : offer.value * item.quantity;

        bestDiscount = Math.max(bestDiscount, Math.min(discount, item.lineTotal));
      }

      totalDiscount += bestDiscount;
    }

    return totalDiscount;
  },
};
