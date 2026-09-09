import { db } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma";

export const addressRepository = {
  async findAllByUser(userId: number | bigint) {
    return db.customerAddress.findMany({
      where: { userId: BigInt(userId) },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  },

  async findById(id: number | bigint, userId: number | bigint) {
    return db.customerAddress.findFirst({
      where: { id: BigInt(id), userId: BigInt(userId) },
    });
  },

  async findDefault(userId: number | bigint) {
    return db.customerAddress.findFirst({
      where: { userId: BigInt(userId), isDefault: true },
    });
  },

  async countByUser(userId: number | bigint) {
    return db.customerAddress.count({ where: { userId: BigInt(userId) } });
  },

  async create(userId: number | bigint, data: any) {
    return db.customerAddress.create({
      data: {
        userId: BigInt(userId),
        full_name: data.full_name ?? `${data.firstName || ""} ${data.lastName || ""}`.trim(),
        phone: data.phone,
        address_line1: data.address_line1 ?? data.addressLine1,
        address_line2: data.address_line2 ?? data.addressLine2 ?? null,
        city: data.city,
        state: data.state,
        pincode: data.pincode ?? data.postalCode ?? "",
        country: data.country ?? "India",
        isDefault: data.isDefault ?? false,
      },
    });
  },

  async update(id: number | bigint, userId: number | bigint, data: any) {
    const updateData: any = {};
    if (data.firstName !== undefined || data.lastName !== undefined) {
      updateData.full_name = `${data.firstName || ""} ${data.lastName || ""}`.trim();
    }
    if (data.full_name !== undefined) updateData.full_name = data.full_name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.addressLine1 !== undefined) updateData.address_line1 = data.addressLine1;
    if (data.address_line1 !== undefined) updateData.address_line1 = data.address_line1;
    if (data.addressLine2 !== undefined) updateData.address_line2 = data.addressLine2;
    if (data.address_line2 !== undefined) updateData.address_line2 = data.address_line2;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.postalCode !== undefined) updateData.pincode = data.postalCode;
    if (data.pincode !== undefined) updateData.pincode = data.pincode;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

    return db.customerAddress.updateMany({
      where: { id: BigInt(id), userId: BigInt(userId) },
      data: updateData,
    });
  },

  async delete(id: number | bigint, userId: number | bigint) {
    return db.customerAddress.deleteMany({
      where: { id: BigInt(id), userId: BigInt(userId) },
    });
  },

  async clearDefault(userId: number | bigint) {
    return db.customerAddress.updateMany({
      where: { userId: BigInt(userId), isDefault: true },
      data: { isDefault: false },
    });
  },

  async setDefault(id: number | bigint, userId: number | bigint) {
    return db.$transaction([
      db.customerAddress.updateMany({
        where: { userId: BigInt(userId), isDefault: true },
        data: { isDefault: false },
      }),
      db.customerAddress.updateMany({
        where: { id: BigInt(id), userId: BigInt(userId) },
        data: { isDefault: true },
      }),
    ]);
  },
};

