import { ApiError } from "@/lib/api/api-error";
import { couponRepository } from "../repositories/coupon.repository";
import type { GetCouponsParams, CreateCouponInput, UpdateCouponInput } from "../types";

export const couponService = {
  async getCoupons(params: GetCouponsParams = {}) {
    return couponRepository.findAll(params);
  },

  async getCoupon(id: number) {
    const coupon = await couponRepository.findById(id);
    if (!coupon) {
      throw ApiError.notFound("Coupon not found");
    }
    return coupon;
  },

  async createCoupon(data: CreateCouponInput) {
    const code = data.code.trim().toUpperCase();
    const existing = await couponRepository.findByCode(code);
    if (existing) {
      throw ApiError.conflict("A coupon with this code already exists");
    }

    if (data.startsAt && data.expiresAt && new Date(data.expiresAt) < new Date(data.startsAt)) {
      throw ApiError.badRequest("Expiry date cannot be earlier than start date");
    }

    const couponType =
      String(data.type).toLowerCase() === "percentage" ? ("percentage" as const) : ("flat" as const);

    return couponRepository.create({
      code,
      type: couponType,
      value: data.value,
      minOrderAmount: data.minOrderAmount,
      maxDiscount: data.maxDiscount,
      usageLimit: data.usageLimit,
      isActive: data.isActive ?? true,
      startsAt: data.startsAt,
      expiresAt: data.expiresAt,
    });
  },

  async updateCoupon(id: number, data: UpdateCouponInput) {
    const existing = await couponRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("Coupon not found");
    }

    const code = data.code !== undefined ? data.code.trim().toUpperCase() : undefined;
    if (code && code !== existing.code) {
      const codeExists = await couponRepository.findByCode(code);
      if (codeExists) {
        throw ApiError.conflict("A coupon with this code already exists");
      }
    }

    const effectiveStartsAt = data.startsAt !== undefined ? data.startsAt : existing.startsAt;
    const effectiveExpiresAt = data.expiresAt !== undefined ? data.expiresAt : existing.expiresAt;
    if (
      effectiveStartsAt &&
      effectiveExpiresAt &&
      new Date(effectiveExpiresAt) < new Date(effectiveStartsAt)
    ) {
      throw ApiError.badRequest("Expiry date cannot be earlier than start date");
    }

    const updateData: Record<string, unknown> = {};
    if (code !== undefined) updateData.code = code;
    if (data.type !== undefined) {
      updateData.type =
        String(data.type).toLowerCase() === "percentage" ? "percentage" : "flat";
    }
    if (data.value !== undefined) updateData.value = data.value;
    if (data.minOrderAmount !== undefined) updateData.minOrderAmount = data.minOrderAmount;
    if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount;
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.startsAt !== undefined) updateData.startsAt = data.startsAt;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt;

    return couponRepository.update(id, updateData as never);
  },

  async deleteCoupon(id: number) {
    const existing = await couponRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("Coupon not found");
    }
    return couponRepository.delete(id);
  },
};
