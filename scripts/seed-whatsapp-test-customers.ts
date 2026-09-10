import { db } from "../src/lib/db/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const TEST_CUSTOMERS = [
  { phone: "7305996058", name: "Test Customer 1" },
  { phone: "9677313783", name: "Test Customer 2" },
  { phone: "8124311701", name: "Test Customer 3" },
  { phone: "7305727605", name: "Test Customer 4" },
  { phone: "9952253789", name: "Test Customer 5" },
  { phone: "6383642455", name: "Test Customer 6" },
];

async function main() {
  console.log("Seeding WhatsApp flow test customers...");

  const customerRole = await db.role.findFirst({
    where: { slug: "customer" },
  });

  if (!customerRole) {
    throw new Error("Customer role not found in database");
  }

  const defaultPassword = await bcrypt.hash("Rithu@12345", 10);

  const results = [];

  for (const item of TEST_CUSTOMERS) {
    const rawDigits = item.phone.replace(/\D/g, "");
    const formattedWithPlus = `+91${rawDigits}`;
    const email = `test_${rawDigits}@rithusnacks.com`;

    // Check if user already exists
    let user = await db.user.findFirst({
      where: {
        OR: [
          { phone: rawDigits },
          { phone: formattedWithPlus },
          { email },
        ],
      },
    });

    if (!user) {
      const userUuid = crypto.randomUUID();
      user = await db.user.create({
        data: {
          uuid: userUuid,
          roleId: customerRole.id,
          name: item.name,
          email,
          phone: formattedWithPlus,
          password_hash: defaultPassword,
          status: "active",
          is_active: true,
          email_verified_at: new Date(),
          phone_verified_at: new Date(),
        },
      });
      console.log(`Created user: ${user.name} (${user.phone}) [ID: ${user.id}]`);
    } else {
      console.log(`User already exists: ${user.name} (${user.phone}) [ID: ${user.id}]`);
    }

    // Check customer profile
    let profile = await db.customer_profiles.findFirst({
      where: { user_id: user.id },
    });

    if (!profile) {
      const profileUuid = crypto.randomUUID();
      const referralCode = "REF" + (user.uuid || profileUuid).replace(/-/g, "").slice(0, 8).toUpperCase();

      profile = await db.customer_profiles.create({
        data: {
          uuid: profileUuid,
          user_id: user.id,
          name: item.name,
          email: user.email,
          phone: formattedWithPlus,
          is_whatsapp: true,
          whatsapp_no: formattedWithPlus,
          referral_code: referralCode,
          is_active: true,
          status: true,
        },
      });
      console.log(`Created customer profile: ${profile.name} (${profile.whatsapp_no}) [ID: ${profile.id}]`);
    } else {
      // Ensure whatsapp fields are active
      profile = await db.customer_profiles.update({
        where: { id: profile.id },
        data: {
          name: item.name,
          phone: formattedWithPlus,
          is_whatsapp: true,
          whatsapp_no: formattedWithPlus,
          is_active: true,
          status: true,
        },
      });
      console.log(`Updated customer profile: ${profile.name} (${profile.whatsapp_no}) [ID: ${profile.id}]`);
    }

    results.push({
      id: String(profile.id),
      userId: String(user.id),
      name: profile.name,
      phone: profile.whatsapp_no,
    });
  }

  console.log("\nSuccessfully configured all WhatsApp test customers:");
  console.table(results);
}

main()
  .catch((err) => {
    console.error("Error seeding test customers:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
    process.exit(0);
  });
