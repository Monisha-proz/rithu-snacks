import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function createClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  const url = new URL(databaseUrl);
  const adapter = new PrismaMariaDb({
    host: url.hostname === "localhost" ? "127.0.0.1" : url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: 5,
    allowPublicKeyRetrieval: true,
  });
  return new PrismaClient({ adapter });
}

const prisma = createClient();

async function main() {
  console.log("=========================================");
  console.log("STARTING ZELLEROA DATABASE SEEDING");
  console.log("=========================================\n");

  await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0;");

  const tablesToClear = [
    "return_items",
    "return_requests",
    "shipments",
    "reviews",
    "review_images",
    "order_items",
    "order_addresses",
    "order_status_history",
    "payments",
    "payment_transactions",
    "orders",
    "cart_items",
    "carts",
    "wishlist_items",
    "inventories",
    "inventory_transactions",
    "variant_price_history",
    "variant_unit_prices",
    "product_variant_images",
    "product_variants",
    "product_images",
    "product_tag_maps",
    "combo_product_items",
    "offer_products",
    "products",
    "product_category_images",
    "product_categories",
    "produt_brand_images",
    "product_brands",
    "product_units",
    "customer_addresses",
    "companies",
  ];

  for (const table of tablesToClear) {
    try {
      if (table === "product_units") {
        await prisma.$executeRawUnsafe("UPDATE `product_units` SET `base_unit_id` = NULL;");
      }
      await prisma.$executeRawUnsafe(`DELETE FROM \`${table}\`;`);
      console.log(`✓ Cleared table: ${table}`);
    } catch (e: any) {
      console.warn(`! Warning on clearing ${table}: ${e.message}`);
    }
  }

  await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1;");
  console.log("Database cleared successfully.\n");

  // 1. ROLES & USERS
  console.log("1. SEEDING ROLES & USERS...");
  const adminPassword = await bcrypt.hash("admin123", 12);
  const customerPassword = await bcrypt.hash("customer123", 12);

  const getOrCreateRole = async (name: string, slug: string, description: string) => {
    let role = await prisma.role.findFirst({ where: { slug } });
    if (!role) {
      role = await prisma.role.create({
        data: { name, slug, description },
      });
    }
    return role;
  };

  const adminRole = await getOrCreateRole("ADMIN", "admin", "Administrator with full store access");
  await getOrCreateRole("STAFF", "staff", "Staff member");
  const customerRole = await getOrCreateRole("CUSTOMER", "customer", "Registered customer");

  // Admin user
  let adminUser = await prisma.user.findFirst({ where: { email: "admin@zelleroa.com" } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        uuid: crypto.randomUUID(),
        name: "Zelleroa Admin",
        email: "admin@zelleroa.com",
        password_hash: adminPassword,
        roleId: adminRole.id,
        status: "active",
        email_verified_at: new Date(),
      },
    });
  }

  // Backup admin user for easy login
  let legacyAdmin = await prisma.user.findFirst({ where: { email: "admin@rithusnacks.com" } });
  if (!legacyAdmin) {
    legacyAdmin = await prisma.user.create({
      data: {
        uuid: crypto.randomUUID(),
        name: "Admin",
        email: "admin@rithusnacks.com",
        password_hash: adminPassword,
        roleId: adminRole.id,
        status: "active",
        email_verified_at: new Date(),
      },
    });
  }

  // Customer users
  let customerUser = await prisma.user.findFirst({ where: { email: "customer@zelleroa.com" } });
  if (!customerUser) {
    customerUser = await prisma.user.create({
      data: {
        uuid: crypto.randomUUID(),
        name: "Priya Sharma",
        email: "customer@zelleroa.com",
        phone: "9876543210",
        password_hash: customerPassword,
        roleId: customerRole.id,
        status: "active",
        email_verified_at: new Date(),
      },
    });
  }

  let demoCustomer = await prisma.user.findFirst({ where: { email: "customer@example.com" } });
  if (!demoCustomer) {
    demoCustomer = await prisma.user.create({
      data: {
        uuid: crypto.randomUUID(),
        name: "Aarav Patel",
        email: "customer@example.com",
        phone: "9876500000",
        password_hash: customerPassword,
        roleId: customerRole.id,
        status: "active",
        email_verified_at: new Date(),
      },
    });
  }

  console.log(`✓ Admin User: admin@zelleroa.com / admin123`);
  console.log(`✓ Admin User (alt): admin@rithusnacks.com / admin123`);
  console.log(`✓ Customer User: customer@zelleroa.com / customer123`);
  console.log(`✓ Customer User: customer@example.com / customer123\n`);

  // 2. CUSTOMER ADDRESSES
  console.log("2. SEEDING CUSTOMER ADDRESSES...");
  await prisma.customerAddress.create({
    data: {
      uuid: crypto.randomUUID(),
      userId: customerUser.id,
      label: "Home",
      addressType: "shipping",
      full_name: "Priya Sharma",
      phone: "9876543210",
      address_line1: "Flat 402, Prestige Royale, 12th Main Road",
      address_line2: "Indiranagar",
      landmark: "Near Metro Station",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038",
      country: "India",
      isDefault: true,
      status: true,
      is_active: true,
    },
  });

  await prisma.customerAddress.create({
    data: {
      uuid: crypto.randomUUID(),
      userId: demoCustomer.id,
      label: "Apartment",
      addressType: "shipping",
      full_name: "Aarav Patel",
      phone: "9876500000",
      address_line1: "Villa 18, Palm Meadows, Whitefield",
      address_line2: "EPIP Zone",
      landmark: "Opposite Tech Park",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560066",
      country: "India",
      isDefault: true,
      status: true,
      is_active: true,
    },
  });
  console.log(`✓ Created default shipping addresses in Bengaluru\n`);

  // 3. COMPANY PROFILE
  console.log("3. SEEDING COMPANY PROFILE...");
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO \`companies\` (
        \`uuid\`, \`company_name\`, \`email\`, \`phone\`, \`address\`, \`city\`, \`state\`, \`country\`, \`pincode\`,
        \`gst_number\`, \`pan_number\`, \`website\`, \`is_active\`, \`created_at\`, \`updated_at\`
      ) VALUES (
        UUID(), 'Zelleroa Couture & Lifestyle', 'support@zelleroa.com', '+91 9876543210',
        '104, Boutique Boulevard, 100 Feet Road, Indiranagar', 'Bengaluru', 'Karnataka', 'India', '560038',
        '29AAAAA0000A1Z5', 'AAAAA0000A', 'https://zelleroa.com', 1, NOW(), NOW()
      );
    `);
    console.log(`✓ Created Zelleroa company profile\n`);
  } catch (e: any) {
    console.warn(`! Company insert notice: ${e.message}\n`);
  }

  // 4. PRODUCT UNITS
  console.log("4. SEEDING PRODUCT UNITS...");
  const createUnit = async (name: string, code: string, type: "count" | "weight" | "volume" = "count") => {
    return prisma.product_units.create({
      data: {
        uuid: crypto.randomUUID(),
        name,
        code,
        type,
        conversion_factor: 1,
        is_active: true,
        status: true,
      },
    });
  };

  const unitPiece = await createUnit("Piece", "pc", "count");
  const unitOneSize = await createUnit("One Size", "Standard", "count");
  const unitXS = await createUnit("Extra Small", "XS", "count");
  const unitS = await createUnit("Small", "S", "count");
  const unitM = await createUnit("Medium", "M", "count");
  const unitL = await createUnit("Large", "L", "count");
  const unitXL = await createUnit("Extra Large", "XL", "count");
  const unitXXL = await createUnit("Double XL", "XXL", "count");
  const unit30 = await createUnit("Waist 30", "30", "count");
  const unit32 = await createUnit("Waist 32", "32", "count");
  const unit34 = await createUnit("Waist 34", "34", "count");
  const unit36 = await createUnit("Waist 36", "36", "count");

  console.log(`✓ Created apparel & accessory size units\n`);

  // 5. BRANDS
  console.log("5. SEEDING BRANDS...");
  const brandCouture = await prisma.productBrand.create({
    data: {
      uuid: crypto.randomUUID(),
      name: "Zelleroa Couture",
      slug: "zelleroa-couture",
      description: "Signature designer dresses, gowns, and ethnic couture crafted with handpicked fabrics.",
      isActive: true,
      status: true,
    },
  });

  const brandChrono = await prisma.productBrand.create({
    data: {
      uuid: crypto.randomUUID(),
      name: "Zelleroa Chrono",
      slug: "zelleroa-chrono",
      description: "Precision engineered luxury timepieces, automatic watches, and minimalist chronographs.",
      isActive: true,
      status: true,
    },
  });

  const brandAtelier = await prisma.productBrand.create({
    data: {
      uuid: crypto.randomUUID(),
      name: "Zelleroa Atelier",
      slug: "zelleroa-atelier",
      description: "Artisan handcrafted full-grain leather bags, clutches, and premium everyday accessories.",
      isActive: true,
      status: true,
    },
  });
  console.log(`✓ Created 3 Zelleroa brands\n`);

  // 6. CATEGORIES
  console.log("6. SEEDING CATEGORIES...");
  const categoryDefs = [
    {
      name: "Dresses & Gowns",
      slug: "dresses-gowns",
      description: "Bespoke evening gowns, cocktail dresses, tiered maxis, and contemporary party wear.",
      image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80",
    },
    {
      name: "Kurtis & Ethnic Wear",
      slug: "kurtis-ethnic-wear",
      description: "Heritage handloom kurtis, embroidered Anarkali sets, and regal festive ethnic ensembles.",
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
    },
    {
      name: "Shirts & Tops",
      slug: "shirts-tops",
      description: "Pure French linen relaxed shirts, classic Oxford button-downs, and delicate silk blouses.",
      image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
    },
    {
      name: "Luxury Watches",
      slug: "luxury-watches",
      description: "Sophisticated analog chronographs, sapphire-glass automatics, and minimalist rose gold timepieces.",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
    },
    {
      name: "Bags & Accessories",
      slug: "bags-accessories",
      description: "Full-grain leather totes, quilted crossbody bags, and artisan polarized sunglasses.",
      image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80",
    },
    {
      name: "Jeans & Trousers",
      slug: "jeans-trousers",
      description: "Tailored Italian stretch chinos, selvedge denim jeans, and versatile everyday trousers.",
      image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80",
    },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoryDefs) {
    const created = await prisma.productCategory.create({
      data: {
        uuid: crypto.randomUUID(),
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.image,
        isActive: true,
        status: true,
      },
    });
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO \`product_category_images\` (\`category_id\`, \`image_url\`, \`is_primary\`, \`sort_order\`, \`created_at\`, \`updated_at\`)
         VALUES (?, ?, 1, 0, NOW(), NOW())`,
        created.id,
        cat.image
      );
    } catch (e: any) {}
    categories[cat.slug] = created;
    console.log(`✓ Category: ${cat.name}`);
  }
  console.log("");

  // 7. 20 DIVERSE PRODUCTS
  console.log("7. SEEDING 20 REALISTIC PRODUCTS ACROSS CATEGORIES...");

  const productList = [
    // --- Category 1: Dresses & Gowns (4 products) ---
    {
      name: "Emerald Silk Satin Maxi Dress",
      slug: "emerald-silk-satin-maxi-dress",
      categorySlug: "dresses-gowns",
      brandId: brandCouture.id,
      image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80",
      description: "Draped in fluid emerald green silk satin with a cowl neckline and graceful floor-length silhouette. Ideal for evening soirees and galas.",
      packSizes: [
        { unitId: unitXS.id, value: 1, price: 2499, sku: "ZEL-DRS-01-XS", isDefault: false },
        { unitId: unitS.id, value: 1, price: 2499, sku: "ZEL-DRS-01-S", isDefault: false },
        { unitId: unitM.id, value: 1, price: 2499, sku: "ZEL-DRS-01-M", isDefault: true },
        { unitId: unitL.id, value: 1, price: 2499, sku: "ZEL-DRS-01-L", isDefault: false },
        { unitId: unitXL.id, value: 1, price: 2599, sku: "ZEL-DRS-01-XL", isDefault: false },
      ],
    },
    {
      name: "Midnight Velvet Off-Shoulder Evening Gown",
      slug: "midnight-velvet-evening-gown",
      categorySlug: "dresses-gowns",
      brandId: brandCouture.id,
      image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=80",
      description: "Luxurious deep navy velvet tailored with an off-shoulder neckline and side slit, delivering effortless red-carpet sophistication.",
      packSizes: [
        { unitId: unitS.id, value: 1, price: 3899, sku: "ZEL-DRS-02-S", isDefault: false },
        { unitId: unitM.id, value: 1, price: 3899, sku: "ZEL-DRS-02-M", isDefault: true },
        { unitId: unitL.id, value: 1, price: 3899, sku: "ZEL-DRS-02-L", isDefault: false },
        { unitId: unitXL.id, value: 1, price: 3999, sku: "ZEL-DRS-02-XL", isDefault: false },
      ],
    },
    {
      name: "Blush Rose Pleated Cocktail Dress",
      slug: "blush-rose-pleated-cocktail-dress",
      categorySlug: "dresses-gowns",
      brandId: brandCouture.id,
      image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80",
      description: "Delicate micro-pleated georgette cocktail dress with an empire waistline and tie-back closure. Light, breezy, and timeless.",
      packSizes: [
        { unitId: unitXS.id, value: 1, price: 2199, sku: "ZEL-DRS-03-XS", isDefault: false },
        { unitId: unitS.id, value: 1, price: 2199, sku: "ZEL-DRS-03-S", isDefault: false },
        { unitId: unitM.id, value: 1, price: 2199, sku: "ZEL-DRS-03-M", isDefault: true },
        { unitId: unitL.id, value: 1, price: 2199, sku: "ZEL-DRS-03-L", isDefault: false },
      ],
    },
    {
      name: "Floral Tiered Chiffon Sundress",
      slug: "floral-tiered-chiffon-sundress",
      categorySlug: "dresses-gowns",
      brandId: brandCouture.id,
      image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80",
      description: "Pastel botanic floral prints blooming over a tiered lightweight chiffon silhouette. Finished with ruffled cap sleeves.",
      packSizes: [
        { unitId: unitS.id, value: 1, price: 1899, sku: "ZEL-DRS-04-S", isDefault: false },
        { unitId: unitM.id, value: 1, price: 1899, sku: "ZEL-DRS-04-M", isDefault: true },
        { unitId: unitL.id, value: 1, price: 1899, sku: "ZEL-DRS-04-L", isDefault: false },
        { unitId: unitXL.id, value: 1, price: 1999, sku: "ZEL-DRS-04-XL", isDefault: false },
      ],
    },

    // --- Category 2: Kurtis & Ethnic Wear (4 products) ---
    {
      name: "Chanderi Silk Embroidered Anarkali Set",
      slug: "chanderi-silk-embroidered-anarkali-set",
      categorySlug: "kurtis-ethnic-wear",
      brandId: brandCouture.id,
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
      description: "Opulent Chanderi silk flared Anarkali paired with matching pants and an organza dupatta featuring exquisite golden zari embroidery.",
      packSizes: [
        { unitId: unitS.id, value: 1, price: 3499, sku: "ZEL-ETH-01-S", isDefault: false },
        { unitId: unitM.id, value: 1, price: 3499, sku: "ZEL-ETH-01-M", isDefault: true },
        { unitId: unitL.id, value: 1, price: 3499, sku: "ZEL-ETH-01-L", isDefault: false },
        { unitId: unitXL.id, value: 1, price: 3599, sku: "ZEL-ETH-01-XL", isDefault: false },
        { unitId: unitXXL.id, value: 1, price: 3699, sku: "ZEL-ETH-01-XXL", isDefault: false },
      ],
    },
    {
      name: "Handloom Cotton Straight Kurti with Trousers",
      slug: "handloom-cotton-straight-kurti",
      categorySlug: "kurtis-ethnic-wear",
      brandId: brandCouture.id,
      image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80",
      description: "Pure breathable handspun cotton straight-fit kurti in earthy beige with button details, matched with tapered cropped trousers.",
      packSizes: [
        { unitId: unitS.id, value: 1, price: 1499, sku: "ZEL-ETH-02-S", isDefault: false },
        { unitId: unitM.id, value: 1, price: 1499, sku: "ZEL-ETH-02-M", isDefault: true },
        { unitId: unitL.id, value: 1, price: 1499, sku: "ZEL-ETH-02-L", isDefault: false },
        { unitId: unitXL.id, value: 1, price: 1549, sku: "ZEL-ETH-02-XL", isDefault: false },
      ],
    },
    {
      name: "Royal Indigo Ajrakh Block-Print Kurta",
      slug: "royal-indigo-ajrakh-print-kurta",
      categorySlug: "kurtis-ethnic-wear",
      brandId: brandCouture.id,
      image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80",
      description: "Authentic artisanal Ajrakh mud-resist hand block print dyed in organic indigo. Features a round neck with subtle kantha hand stitching.",
      packSizes: [
        { unitId: unitM.id, value: 1, price: 1799, sku: "ZEL-ETH-03-M", isDefault: true },
        { unitId: unitL.id, value: 1, price: 1799, sku: "ZEL-ETH-03-L", isDefault: false },
        { unitId: unitXL.id, value: 1, price: 1899, sku: "ZEL-ETH-03-XL", isDefault: false },
        { unitId: unitXXL.id, value: 1, price: 1999, sku: "ZEL-ETH-03-XXL", isDefault: false },
      ],
    },
    {
      name: "Festive Zari Border Tussar Silk Kurti",
      slug: "festive-zari-border-tussar-kurti",
      categorySlug: "kurtis-ethnic-wear",
      brandId: brandCouture.id,
      image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&auto=format&fit=crop&q=80",
      description: "Rich textured Tussar silk in mustard gold bordered by woven antique zari, offering effortless grandeur for poojas and celebrations.",
      packSizes: [
        { unitId: unitS.id, value: 1, price: 2299, sku: "ZEL-ETH-04-S", isDefault: false },
        { unitId: unitM.id, value: 1, price: 2299, sku: "ZEL-ETH-04-M", isDefault: true },
        { unitId: unitL.id, value: 1, price: 2299, sku: "ZEL-ETH-04-L", isDefault: false },
        { unitId: unitXL.id, value: 1, price: 2399, sku: "ZEL-ETH-04-XL", isDefault: false },
      ],
    },

    // --- Category 3: Shirts & Tops (3 products) ---
    {
      name: "Pure French Linen Relaxed Shirt",
      slug: "pure-french-linen-relaxed-shirt",
      categorySlug: "shirts-tops",
      brandId: brandCouture.id,
      image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
      description: "Pre-washed 100% Normandy flax linen shirt with mother-of-pearl buttons. Unrivaled breathability and lived-in drape.",
      packSizes: [
        { unitId: unitS.id, value: 1, price: 1999, sku: "ZEL-SHR-01-S", isDefault: false },
        { unitId: unitM.id, value: 1, price: 1999, sku: "ZEL-SHR-01-M", isDefault: true },
        { unitId: unitL.id, value: 1, price: 1999, sku: "ZEL-SHR-01-L", isDefault: false },
        { unitId: unitXL.id, value: 1, price: 2099, sku: "ZEL-SHR-01-XL", isDefault: false },
      ],
    },
    {
      name: "Oxford Classic Slim-Fit Cotton Shirt",
      slug: "oxford-classic-slim-fit-cotton-shirt",
      categorySlug: "shirts-tops",
      brandId: brandCouture.id,
      image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
      description: "Woven from 2-ply combed organic cotton with a button-down collar. The quintessential wardrobe cornerstone from office to dinner.",
      packSizes: [
        { unitId: unitS.id, value: 1, price: 1699, sku: "ZEL-SHR-02-S", isDefault: false },
        { unitId: unitM.id, value: 1, price: 1699, sku: "ZEL-SHR-02-M", isDefault: true },
        { unitId: unitL.id, value: 1, price: 1699, sku: "ZEL-SHR-02-L", isDefault: false },
        { unitId: unitXL.id, value: 1, price: 1799, sku: "ZEL-SHR-02-XL", isDefault: false },
      ],
    },
    {
      name: "Textured Cuban Collar Resort Shirt",
      slug: "textured-cuban-collar-resort-shirt",
      categorySlug: "shirts-tops",
      brandId: brandCouture.id,
      image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop&q=80",
      description: "Airy waffle-knit cotton blend with an open camp collar and relaxed shoulder fit. Perfectly styled for warm vacations and weekends.",
      packSizes: [
        { unitId: unitM.id, value: 1, price: 1599, sku: "ZEL-SHR-03-M", isDefault: true },
        { unitId: unitL.id, value: 1, price: 1599, sku: "ZEL-SHR-03-L", isDefault: false },
        { unitId: unitXL.id, value: 1, price: 1699, sku: "ZEL-SHR-03-XL", isDefault: false },
      ],
    },

    // --- Category 4: Luxury Watches (3 products) ---
    {
      name: "AeroChrono Classic Tachymeter Watch",
      slug: "aerochrono-classic-tachymeter-watch",
      categorySlug: "luxury-watches",
      brandId: brandChrono.id,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
      description: "Surgical-grade 316L stainless steel case, scratch-resistant sapphire crystal, Japanese quartz movement, and 50M water resistance.",
      packSizes: [
        { unitId: unitOneSize.id, value: 1, price: 6499, sku: "ZEL-WTC-01-STD", isDefault: true },
      ],
    },
    {
      name: "Aura Rose Gold Minimalist Women's Watch",
      slug: "aura-rose-gold-minimalist-watch",
      categorySlug: "luxury-watches",
      brandId: brandChrono.id,
      image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80",
      description: "Ultra-slim 6mm case with a genuine mother-of-pearl dial and adjustable stainless steel rose gold mesh strap. Subtle, radiant luxury.",
      packSizes: [
        { unitId: unitOneSize.id, value: 1, price: 4999, sku: "ZEL-WTC-02-STD", isDefault: true },
      ],
    },
    {
      name: "Heritage Automatic Skeleton Leather Watch",
      slug: "heritage-automatic-skeleton-leather-watch",
      categorySlug: "luxury-watches",
      brandId: brandChrono.id,
      image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80",
      description: "Exhibition caseback showing an intricate 21-jewel self-winding mechanical movement paired with hand-stitched Italian leather strap.",
      packSizes: [
        { unitId: unitOneSize.id, value: 1, price: 8999, sku: "ZEL-WTC-03-STD", isDefault: true },
      ],
    },

    // --- Category 5: Bags & Accessories (3 products) ---
    {
      name: "Sienna Full-Grain Leather Everyday Tote",
      slug: "sienna-full-grain-leather-tote",
      categorySlug: "bags-accessories",
      brandId: brandAtelier.id,
      image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80",
      description: "Spacious handcrafted vegetable-tanned leather tote with padded laptop sleeve, interior organizer pockets, and solid brass hardware.",
      packSizes: [
        { unitId: unitOneSize.id, value: 1, price: 3999, sku: "ZEL-BAG-01-STD", isDefault: true },
      ],
    },
    {
      name: "Capri Quilted Crossbody Chain Bag",
      slug: "capri-quilted-crossbody-chain-bag",
      categorySlug: "bags-accessories",
      brandId: brandAtelier.id,
      image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80",
      description: "Iconic diamond quilt stitching on supple lambskin leather with a polished gold-finish sliding chain strap. Versatile crossbody or shoulder bag.",
      packSizes: [
        { unitId: unitOneSize.id, value: 1, price: 2899, sku: "ZEL-BAG-02-STD", isDefault: true },
      ],
    },
    {
      name: "Artisan Handcrafted Polarized Acetate Sunglasses",
      slug: "artisan-polarized-acetate-sunglasses",
      categorySlug: "bags-accessories",
      brandId: brandAtelier.id,
      image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80",
      description: "Premium Italian Mazzucchelli acetate frame with Category 3 UV400 polarized lenses and durable 5-barrel hinges. Includes leather case.",
      packSizes: [
        { unitId: unitOneSize.id, value: 1, price: 1899, sku: "ZEL-ACC-01-STD", isDefault: true },
      ],
    },

    // --- Category 6: Jeans & Trousers (3 products) ---
    {
      name: "Tailored Italian Stretch Cotton Chinos",
      slug: "tailored-italian-stretch-cotton-chinos",
      categorySlug: "jeans-trousers",
      brandId: brandCouture.id,
      image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80",
      description: "Slim-tapered silhouette woven from 98% mercerized cotton and 2% elastane for effortless comfort, movement, and sharp creases.",
      packSizes: [
        { unitId: unit30.id, value: 30, price: 2199, sku: "ZEL-TRS-01-30", isDefault: false },
        { unitId: unit32.id, value: 32, price: 2199, sku: "ZEL-TRS-01-32", isDefault: true },
        { unitId: unit34.id, value: 34, price: 2199, sku: "ZEL-TRS-01-34", isDefault: false },
        { unitId: unit36.id, value: 36, price: 2299, sku: "ZEL-TRS-01-36", isDefault: false },
      ],
    },
    {
      name: "Vintage Indigo Selvedge Denim Jeans",
      slug: "vintage-indigo-selvedge-denim-jeans",
      categorySlug: "jeans-trousers",
      brandId: brandCouture.id,
      image: "https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80",
      description: "13.5oz shuttle-loom woven Japanese selvedge denim. Finished with red ID ticker, copper rivets, and a classic regular-straight cut.",
      packSizes: [
        { unitId: unit30.id, value: 30, price: 2799, sku: "ZEL-TRS-02-30", isDefault: false },
        { unitId: unit32.id, value: 32, price: 2799, sku: "ZEL-TRS-02-32", isDefault: true },
        { unitId: unit34.id, value: 34, price: 2799, sku: "ZEL-TRS-02-34", isDefault: false },
        { unitId: unit36.id, value: 36, price: 2899, sku: "ZEL-TRS-02-36", isDefault: false },
      ],
    },
    {
      name: "Pleated High-Waisted Wide Leg Trousers",
      slug: "pleated-high-waisted-wide-leg-trousers",
      categorySlug: "jeans-trousers",
      brandId: brandCouture.id,
      image: "https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=800&auto=format&fit=crop&q=80",
      description: "Contemporary front pleats with a fluid wide leg fall and high-rise waistband. Effortless quiet luxury paired with tucked-in blouses.",
      packSizes: [
        { unitId: unitS.id, value: 1, price: 2399, sku: "ZEL-TRS-03-S", isDefault: false },
        { unitId: unitM.id, value: 1, price: 2399, sku: "ZEL-TRS-03-M", isDefault: true },
        { unitId: unitL.id, value: 1, price: 2399, sku: "ZEL-TRS-03-L", isDefault: false },
      ],
    },
  ];

  let totalProducts = 0;
  let totalVariants = 0;
  let totalUnitPrices = 0;

  const seededProductRecords: any[] = [];
  const seededVariantRecords: any[] = [];
  const seededUnitPriceRecords: any[] = [];

  for (const item of productList) {
    const category = categories[item.categorySlug];
    const defaultPack = item.packSizes.find((p) => p.isDefault) ?? item.packSizes[0];

    // 1. Create Product
    const product = await prisma.product.create({
      data: {
        uuid: crypto.randomUUID(),
        name: item.name,
        slug: item.slug,
        sku: defaultPack.sku,
        base_price: defaultPack.price,
        categoryId: category.id,
        brandId: item.brandId,
        isActive: true,
        status: true,
      },
    });
    seededProductRecords.push(product);

    // Add Primary Product Image
    try {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          image_url: item.image,
          isPrimary: true,
          sortOrder: 0,
        },
      });
    } catch (e: any) {
      console.warn(`! productImage notice: ${e.message}`);
    }

    // 2. Create Product Variant
    const variant = await prisma.productVariant.create({
      data: {
        uuid: crypto.randomUUID(),
        productId: product.id,
        variant_name: "Standard Fit",
        slug: `${item.slug}-standard`,
        short_description: item.description.slice(0, 150),
        description: item.description,
        is_default: true,
        isActive: true,
        is_featured: true,
        out_of_stock: false,
        veg_type: "na",
      },
    });
    seededVariantRecords.push(variant);

    // Add Variant Image
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO \`product_variant_images\` (
          \`uuid\`, \`variant_id\`, \`image_url\`, \`is_primary\`, \`sort_order\`, \`created_at\`, \`updated_at\`
        ) VALUES (
          UUID(), ?, ?, 1, 0, NOW(), NOW()
        )`,
        variant.id,
        item.image
      );
    } catch (e: any) {
      console.warn(`! variant image notice: ${e.message}`);
    }

    // 3. Create Variant Unit Prices & Inventories
    for (const pack of item.packSizes) {
      const unitPrice = await prisma.variantUnitPrice.create({
        data: {
          uuid: crypto.randomUUID(),
          variant_id: variant.id,
          unit_id: pack.unitId,
          unit_value: pack.value,
          sku: pack.sku,
          base_price: pack.price,
          is_default: pack.isDefault,
          isActive: true,
        },
      });
      seededUnitPriceRecords.push(unitPrice);

      // 4. Create Inventory record (100 units available in stock!)
      await prisma.inventory.create({
        data: {
          variantUnitPriceId: unitPrice.id,
          quantity_available: 100,
          quantity_reserved: 0,
          reorderLevel: 10,
          warehouse_location: "Bengaluru Main Hub",
          is_active: true,
        },
      });

      totalUnitPrices++;
    }

    totalVariants++;
    totalProducts++;
    console.log(`✓ Product #${totalProducts}: ${item.name} (${item.packSizes.length} sizes/options, In Stock)`);
  }

  // 8. SAMPLE ORDERS FOR CLIENT DEMO
  console.log("\n8. SEEDING REALISTIC SAMPLE ORDERS FOR CLIENT DEMO...");

  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO \`payment_methods\` (\`id\`, \`name\`, \`code\`, \`is_active\`, \`created_at\`, \`updated_at\`)
      VALUES (1, 'Razorpay', 'razorpay', 1, NOW(), NOW())
      ON DUPLICATE KEY UPDATE \`name\` = 'Razorpay', \`is_active\` = 1
    `);
  } catch (e: any) {
    console.warn(`! payment_methods notice: ${e.message}`);
  }

  const sampleOrderConfigs = [
    {
      orderNumber: "ZEL-2026-1001",
      status: "delivered",
      paymentStatus: "paid",
      productIdx: 0, // Emerald Silk Satin Maxi Dress
      qty: 1,
      totalAmount: 2499,
      notes: "Please deliver in luxury gift wrapping box",
    },
    {
      orderNumber: "ZEL-2026-1002",
      status: "shipped",
      paymentStatus: "paid",
      productIdx: 11, // AeroChrono Watch
      qty: 1,
      totalAmount: 6499,
      notes: "Express air shipping requested",
    },
    {
      orderNumber: "ZEL-2026-1003",
      status: "confirmed",
      paymentStatus: "paid",
      productIdx: 8, // French Linen Shirt
      qty: 2,
      totalAmount: 3998,
      notes: "Doorstep delivery after 4 PM",
    },
  ];

  for (const ord of sampleOrderConfigs) {
    const prod = seededProductRecords[ord.productIdx];
    const varnt = seededVariantRecords[ord.productIdx];
    const unitPrc = seededUnitPriceRecords.find((up) => up.variant_id === varnt.id && up.is_default);

    const createdOrder = await prisma.order.create({
      data: {
        uuid: crypto.randomUUID(),
        orderNumber: ord.orderNumber,
        userId: customerUser.id,
        order_status: ord.status as any,
        payment_status: ord.paymentStatus as any,
        subtotal: ord.totalAmount,
        discountAmount: 0,
        taxAmount: 0,
        shipping_charge: 0,
        totalAmount: ord.totalAmount,
        notes: ord.notes,
        placed_at: new Date(Date.now() - 86400000 * 2),
      },
    });

    // Order Address
    await prisma.orderAddress.create({
      data: {
        uuid: crypto.randomUUID(),
        orderId: createdOrder.id,
        type: "shipping",
        full_name: "Priya Sharma",
        phone: "9876543210",
        address_line1: "Flat 402, Prestige Royale, 12th Main Road",
        address_line2: "Indiranagar",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560038",
        country: "India",
      },
    });

    // Order Item
    await prisma.orderItem.create({
      data: {
        uuid: crypto.randomUUID(),
        orderId: createdOrder.id,
        productId: prod.id,
        variantId: varnt.id,
        variantUnitPriceId: unitPrc?.id ?? null,
        product_name_snapshot: prod.name,
        variant_snapshot: "Standard Fit",
        sku_snapshot: prod.sku,
        quantity: ord.qty,
        unit_price: Number(prod.base_price),
        total_price: ord.totalAmount,
      },
    });

    // Payment Method & Payment Record
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO \`payments\` (
          \`order_id\`, \`payment_method_id\`, \`amount\`, \`currency\`, \`status\`, \`gateway\`, \`gateway_payment_id\`, \`created_at\`, \`updated_at\`
        ) VALUES (
          ?, 1, ?, 'INR', 'success', 'razorpay', 'pay_sample_${ord.orderNumber}', NOW(), NOW()
        )`,
        createdOrder.id,
        ord.totalAmount
      );
    } catch (e: any) {
      console.warn(`! payment record notice: ${e.message}`);
    }

    console.log(`✓ Sample Order #${ord.orderNumber}: ₹${ord.totalAmount} (${ord.status.toUpperCase()})`);
  }

  // 9. SAMPLE 5-STAR REVIEWS
  console.log("\n9. SEEDING VERIFIED CUSTOMER REVIEWS...");
  const reviewsData = [
    {
      productIdx: 0,
      title: "Breath-taking drape and luxury feel",
      comment: "The emerald color is even more vibrant in person! The silk quality feels exceptional, and the fit around the waist is so flattering.",
      rating: 5,
    },
    {
      productIdx: 4,
      title: "Finest Anarkali I have ever owned",
      comment: "The zari embroidery has such delicate craftsmanship. Perfect for family weddings and festive events. Highly recommended!",
      rating: 5,
    },
    {
      productIdx: 11,
      title: "Exquisite chronograph watch",
      comment: "Solid weight, sapphire crystal clarity, and very smooth second hand. Looks like a timepiece thrice the price.",
      rating: 5,
    },
    {
      productIdx: 14,
      title: "Supple leather and very spacious",
      comment: "Easily fits my 15-inch laptop, planner, and daily essentials. The vegetable-tanned leather smells amazing and gets softer every day.",
      rating: 5,
    },
  ];

  for (const rev of reviewsData) {
    const prod = seededProductRecords[rev.productIdx];
    try {
      await prisma.review.create({
        data: {
          uuid: crypto.randomUUID(),
          productId: prod.id,
          userId: customerUser.id,
          title: rev.title,
          comment: rev.comment,
          rating: rev.rating,
          isApproved: true,
          is_active: true,
        },
      });
      console.log(`✓ Review on ${prod.name}: "${rev.title}" (${rev.rating}★)`);
    } catch (e: any) {
      console.warn(`! review notice: ${e.message}`);
    }
  }

  console.log("\n=========================================");
  console.log("ZELLEROA DEMO DATABASE READY!");
  console.log("=========================================");
  console.log(`✓ Database: zelleroa_db`);
  console.log(`✓ Categories: 6 (Dresses, Ethnic Wear, Shirts, Watches, Bags, Jeans)`);
  console.log(`✓ Products: ${totalProducts}`);
  console.log(`✓ Size Options / Unit Prices: ${totalUnitPrices} (All In Stock: 100 units each)`);
  console.log(`✓ Admin User: admin@zelleroa.com / admin123`);
  console.log(`✓ Customer User: customer@zelleroa.com / customer123`);
  console.log(`✓ Demo Orders: 3 (Delivered, Shipped, Confirmed)`);
  console.log(`✓ Verified Reviews: 4`);
  console.log("=========================================\n");
}

main()
  .catch((e) => {
    console.error("FATAL ERROR IN SEEDING:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
