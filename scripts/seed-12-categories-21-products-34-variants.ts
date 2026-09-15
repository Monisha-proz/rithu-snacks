import "dotenv/config";
import crypto from "crypto";
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

interface SeedVariant {
  name: string;
  sku: string;
  price200: number;
  price500: number;
  img: string;
  ingredients: string;
  shelfLife: string;
}

interface SeedProduct {
  name: string;
  slug: string;
  description: string;
  variants: SeedVariant[];
}

interface SeedCategory {
  uuid?: string;
  name: string;
  slug: string;
  description: string;
  products: SeedProduct[];
}

const SEED_DATA: SeedCategory[] = [
  // 1. Traditional Murukku (Preserve uuid if available)
  {
    uuid: "77d24016-c93e-4152-ab48-00e07398653b",
    name: "Traditional Murukku",
    slug: "traditional-murukku",
    description: "Crispy, golden spiral savories hand-pressed using rice flour, urad dal, cumin seeds, and pure butter.",
    products: [
      {
        name: "Kai Murukku",
        slug: "kai-murukku",
        description: "Artisanal hand-twisted spiral murukku with timeless crunch and buttery aroma.",
        variants: [
          {
            name: "Traditional Kai Murukku",
            sku: "KM-TRAD",
            price200: 120,
            price500: 280,
            img: "/snacksLogos/kai_murukku.svg",
            ingredients: "Raw Rice Flour, Urad Dal Flour, Pure Butter, Cumin Seeds, Sesame Seeds, Cold-Pressed Oil, Salt",
            shelfLife: "Best before 45 days from manufacture",
          },
          {
            name: "Butter Kai Murukku",
            sku: "KM-BTR",
            price200: 130,
            price500: 300,
            img: "/snacksLogos/special_butter_murukku.svg",
            ingredients: "Raw Rice Flour, Extra Desi Butter, Roasted Gram Flour, Sesame Seeds, Salt",
            shelfLife: "Best before 45 days from manufacture",
          },
        ],
      },
      {
        name: "Thenkuzhal Murukku",
        slug: "thenkuzhal-murukku",
        description: "Classic South Indian festival murukku with delicate tubular crunch and fragrant cumin.",
        variants: [
          {
            name: "Classic Thenkuzhal Murukku",
            sku: "TM-CLASSIC",
            price200: 110,
            price500: 260,
            img: "/snacksLogos/thenkuzhal_murukku.svg",
            ingredients: "Rice Flour, Urad Flour, Cumin Seeds, Butter, Cold-Pressed Oil, Salt",
            shelfLife: "Best before 45 days from manufacture",
          },
          {
            name: "Cumin & Sesame Thenkuzhal",
            sku: "TM-CUMIN",
            price200: 115,
            price500: 270,
            img: "/snacksLogos/thenkuzhal_murukku.svg",
            ingredients: "Rice Flour, Roasted Urad Dal, White Sesame, Cumin, Hing, Salt",
            shelfLife: "Best before 45 days from manufacture",
          },
        ],
      },
      {
        name: "Butter Murukku",
        slug: "butter-murukku",
        description: "Melt-in-mouth star-shaped butter murukku made with rich churned farm butter.",
        variants: [
          {
            name: "Special Butter Murukku",
            sku: "BM-SPEC",
            price200: 125,
            price500: 290,
            img: "/snacksLogos/special_butter_murukku.svg",
            ingredients: "Fine Rice Flour, Churned Cow Butter, Gram Flour, Cumin, Asafoetida, Salt",
            shelfLife: "Best before 45 days from manufacture",
          },
        ],
      },
    ],
  },

  // 2. Authentic Mixtures (UUID referenced by user: 99fef6a3-24bc-444e-8253-c3c4d50dce1b)
  {
    uuid: "99fef6a3-24bc-444e-8253-c3c4d50dce1b",
    name: "Authentic Mixtures",
    slug: "authentic-mixtures",
    description: "Crunchy medley of spicy boondi, sev, fried cashews, roasted groundnuts, and aromatic curry leaves.",
    products: [
      {
        name: "Special Madras Mixture",
        slug: "special-madras-mixture",
        description: "Iconic Madras tea-time savory mixture with cashews, peanuts, ribbon pakoda, and curry leaves.",
        variants: [
          {
            name: "Traditional Madras Mixture",
            sku: "MM-TRAD",
            price200: 115,
            price500: 270,
            img: "/snacksLogos/mixture.svg",
            ingredients: "Gram Flour Boondi, Sev, Ribbon Pakoda, Whole Cashews, Peanuts, Fried Curry Leaves, Red Chilli, Hing, Salt",
            shelfLife: "Best before 45 days from manufacture",
          },
          {
            name: "Spicy Garlic Madras Mixture",
            sku: "MM-GARLIC",
            price200: 120,
            price500: 280,
            img: "/snacksLogos/mixture.svg",
            ingredients: "Gram Flour Boondi, Sev, Crushed Garlic, Roasted Peanuts, Curry Leaves, Red Chilli Powder, Salt",
            shelfLife: "Best before 45 days from manufacture",
          },
        ],
      },
      {
        name: "Bombay Dry Fruit Mixture",
        slug: "bombay-dry-fruit-mixture",
        description: "Crispy cornflakes, almonds, cashews, raisins, and spicy potato shoestrings in sweet-savory balance.",
        variants: [
          {
            name: "Royal Bombay Cornflake Mixture",
            sku: "BM-ROYAL",
            price200: 140,
            price500: 330,
            img: "/snacksLogos/mixture.svg",
            ingredients: "Golden Cornflakes, Roasted Almonds, Cashews, Golden Raisins, Potato Laccha, Spices, Sugar Dust, Rock Salt",
            shelfLife: "Best before 60 days from manufacture",
          },
        ],
      },
    ],
  },

  // 3. Crispy Chips
  {
    uuid: "b0890d8d-960a-4a36-ae9f-12218593f619",
    name: "Crispy Chips",
    slug: "crispy-chips",
    description: "Wafer-thin raw banana, tapioca, and potato crisps fried in fresh cold-pressed groundnut and coconut oils.",
    products: [
      {
        name: "Nendran Banana Chips",
        slug: "nendran-banana-chips",
        description: "Kerala-style crisp raw Nendran plantain chips with authentic golden hue and mild sea salt seasoning.",
        variants: [
          {
            name: "Coconut Oil Nendran Banana Chips",
            sku: "BC-COCO",
            price200: 135,
            price500: 320,
            img: "/snacksLogos/special_spicy_chips.svg",
            ingredients: "Fresh Raw Nendran Bananas, Pure Cold-Pressed Coconut Oil, Turmeric, Sea Salt",
            shelfLife: "Best before 45 days from manufacture",
          },
          {
            name: "Malabar Pepper Banana Chips",
            sku: "BC-PEPPER",
            price200: 140,
            price500: 330,
            img: "/snacksLogos/special_spicy_chips.svg",
            ingredients: "Raw Nendran Bananas, Pure Coconut Oil, Crushed Tellicherry Black Pepper, Rock Salt",
            shelfLife: "Best before 45 days from manufacture",
          },
        ],
      },
      {
        name: "Spicy Tapioca Chips",
        slug: "spicy-tapioca-chips",
        description: "Crunchy Maravalli Kizhangu (Tapioca) chips tossed in hot South Indian red chilli and rock salt.",
        variants: [
          {
            name: "Crispy Red Chilli Tapioca Chips",
            sku: "TC-CHILLI",
            price200: 100,
            price500: 240,
            img: "/snacksLogos/special_spicy_chips.svg",
            ingredients: "Farm-Fresh Tapioca, Refined Groundnut Oil, Guntur Red Chilli Powder, Salt",
            shelfLife: "Best before 45 days from manufacture",
          },
          {
            name: "Salted Tapioca Finger Sticks",
            sku: "TC-SALT",
            price200: 105,
            price500: 250,
            img: "/snacksLogos/special_spicy_chips.svg",
            ingredients: "Fresh Tapioca Shoestrings, Pure Groundnut Oil, Rock Salt",
            shelfLife: "Best before 45 days from manufacture",
          },
        ],
      },
    ],
  },

  // 4. Pakoda & Savories
  {
    uuid: "7758387e-f1cb-4ca8-8211-0a77979da411",
    name: "Pakoda & Savories",
    slug: "pakoda-savories",
    description: "Crunchy tea-time cashew pakodas, ribbon sev, spicy omapodi, and evening savory munchies.",
    products: [
      {
        name: "Mundhiri (Cashew) Pakoda",
        slug: "mundhiri-cashew-pakoda",
        description: "Decadent whole cashews coated in spiced gram flour batter and fried to golden crispness.",
        variants: [
          {
            name: "Whole Cashew Nut Pakoda",
            sku: "CP-WHOLE",
            price200: 195,
            price500: 460,
            img: "/snacksLogos/special_spicy_chips.svg",
            ingredients: "Whole Cashews, Gram Flour (Besan), Rice Flour, Curry Leaves, Red Chilli, Hing, Salt",
            shelfLife: "Best before 30 days from manufacture",
          },
          {
            name: "Ghee Masala Cashew Pakoda",
            sku: "CP-GHEE",
            price200: 215,
            price500: 500,
            img: "/snacksLogos/special_spicy_chips.svg",
            ingredients: "Premium Cashews, Pure Desi Ghee, Gram Flour, Garam Masala, Ginger, Curry Leaves, Salt",
            shelfLife: "Best before 30 days from manufacture",
          },
        ],
      },
      {
        name: "Ribbon Pakoda",
        slug: "ribbon-pakoda",
        description: "Classic flat ribbon-shaped savory crisps made with rice flour, gram flour, cumin, and hing.",
        variants: [
          {
            name: "Crunchy Ribbon Pakoda",
            sku: "RP-CRUNCH",
            price200: 110,
            price500: 260,
            img: "/traditionLogos/4.svg",
            ingredients: "Rice Flour, Gram Flour, Butter, Chilli Powder, Cumin, Hing, Salt",
            shelfLife: "Best before 45 days from manufacture",
          },
          {
            name: "Spicy Poondu (Garlic) Ribbon Pakoda",
            sku: "RP-GARLIC",
            price200: 120,
            price500: 280,
            img: "/traditionLogos/4.svg",
            ingredients: "Rice Flour, Besan, Fresh Garlic Paste, Red Chilli, Sesame Seeds, Salt",
            shelfLife: "Best before 45 days from manufacture",
          },
        ],
      },
    ],
  },

  // 5. South Indian Sweets
  {
    uuid: "be310f58-3c65-45cf-84a0-388f03210e02",
    name: "South Indian Sweets",
    slug: "south-indian-sweets",
    description: "Authentic traditional sweets made with pure cow ghee, cane sugar, cardamom, and roasted dry fruits.",
    products: [
      {
        name: "Special Mysore Pak",
        slug: "special-mysore-pak",
        description: "Heavenly melt-in-mouth confection made with aromatic pure desi ghee, roasted besan, and cardamom.",
        variants: [
          {
            name: "Traditional Pure Ghee Mysore Pak",
            sku: "MP-GHEE",
            price200: 175,
            price500: 340,
            img: "/snacksLogos/palkova.svg",
            ingredients: "Pure Cow Ghee, Gram Flour (Besan), Cane Sugar, Cardamom Powder",
            shelfLife: "Best before 21 days from manufacture",
          },
          {
            name: "Soft Melt Mysore Pak",
            sku: "MP-SOFT",
            price200: 190,
            price500: 370,
            img: "/snacksLogos/palkova.svg",
            ingredients: "Extra Desi Ghee, Fine Sifted Besan, Organic Sugar Syrup, Cardamom Extract",
            shelfLife: "Best before 21 days from manufacture",
          },
        ],
      },
      {
        name: "Pure Ghee Besan Laddu",
        slug: "pure-ghee-besan-laddu",
        description: "Slow-roasted coarse gram flour laddus simmered in rich golden ghee and scented with cardamom.",
        variants: [
          {
            name: "Pistachio Roasted Besan Laddu",
            sku: "BL-PISTA",
            price200: 160,
            price500: 310,
            img: "/snacksLogos/laddu.svg",
            ingredients: "Coarse Gram Flour, Pure Ghee, Sugar, Sliced Pistachios, Cardamom",
            shelfLife: "Best before 25 days from manufacture",
          },
          {
            name: "Cardamom Besan Laddu",
            sku: "BL-ELAICHI",
            price200: 150,
            price500: 290,
            img: "/snacksLogos/laddu.svg",
            ingredients: "Gram Flour, Desi Ghee, Pure Bura Sugar, Elaichi Powder, Golden Raisins",
            shelfLife: "Best before 25 days from manufacture",
          },
        ],
      },
    ],
  },

  // 6. Festive Gift Boxes
  {
    name: "Festive Gift Boxes",
    slug: "festive-gift-boxes",
    description: "Premium curated gift boxes blending handmade sweets, savories, and traditional treats for celebrations.",
    products: [
      {
        name: "Diwali Royal Celebration Box",
        slug: "diwali-royal-celebration-box",
        description: "Lavish gift assortment featuring Mysore Pak, Cashew Pakoda, Madras Mixture, and Besan Laddus.",
        variants: [
          {
            name: "Royal Celebration Hamper 1kg",
            sku: "GB-ROYAL",
            price200: 650,
            price500: 650,
            img: "/logos/explore_category.svg",
            ingredients: "Mysore Pak (250g), Madras Mixture (250g), Kai Murukku (250g), Besan Laddu (250g)",
            shelfLife: "Best before 30 days from dispatch",
          },
          {
            name: "Deluxe Sweet & Savory Box 1.5kg",
            sku: "GB-DELUXE",
            price200: 950,
            price500: 950,
            img: "/logos/explore_category.svg",
            ingredients: "Pure Ghee Mysore Pak, Cashew Pakoda, Kai Murukku, Laddu, Bombay Mixture",
            shelfLife: "Best before 30 days from dispatch",
          },
        ],
      },
      {
        name: "Grand Heritage Festive Box",
        slug: "grand-heritage-festive-box",
        description: "Opulent festive gift trunk packed with 6 tin-sealed traditional savories and sweets.",
        variants: [
          {
            name: "Grand Heritage Gift Box 2kg",
            sku: "GB-HERITAGE",
            price200: 1250,
            price500: 1250,
            img: "/logos/explore_category.svg",
            ingredients: "Assorted Hand-crafted Murukku, Mixture, Pakoda, Mysore Pak, Halwa, Laddus",
            shelfLife: "Best before 30 days from dispatch",
          },
        ],
      },
    ],
  },

  // 7. Spicy Sev & Omapodi
  {
    name: "Spicy Sev & Omapodi",
    slug: "spicy-sev-omapodi",
    description: "Aromatic thin strands of carom seed sev, peppery karasev, and crunchy garlic ribbons.",
    products: [
      {
        name: "Crispy Ajwain Omapodi",
        slug: "crispy-ajwain-omapodi",
        description: "Light and digestive thin golden noodle savories infused with fragrant ajwain water.",
        variants: [
          {
            name: "Delicate Ajwain Omapodi",
            sku: "OP-DELICATE",
            price200: 100,
            price500: 240,
            img: "/snacksLogos/kai_murukku.svg",
            ingredients: "Besan, Rice Flour, Ajwain (Omam) Extract, Butter, Salt",
            shelfLife: "Best before 45 days from manufacture",
          },
          {
            name: "Butter Omapodi",
            sku: "OP-BUTTER",
            price200: 115,
            price500: 270,
            img: "/snacksLogos/kai_murukku.svg",
            ingredients: "Gram Flour, Churned Butter, Ajwain, Hing, Salt",
            shelfLife: "Best before 45 days from manufacture",
          },
        ],
      },
      {
        name: "Spicy Garlic Karasev",
        slug: "spicy-garlic-karasev",
        description: "Bold and chunky crunchy sev loaded with crushed black pepper and rustic country garlic.",
        variants: [
          {
            name: "Country Garlic Karasev",
            sku: "KS-GARLIC",
            price200: 115,
            price500: 270,
            img: "/snacksLogos/special_butter_murukku.svg",
            ingredients: "Gram Flour, Crushed Fresh Garlic, Black Pepper, Cumin Seeds, Salt",
            shelfLife: "Best before 45 days from manufacture",
          },
          {
            name: "Crushed Black Pepper Karasev",
            sku: "KS-PEPPER",
            price200: 120,
            price500: 280,
            img: "/snacksLogos/special_butter_murukku.svg",
            ingredients: "Besan, Tellicherry Black Pepper, Cumin, Hing, Pure Oil, Salt",
            shelfLife: "Best before 45 days from manufacture",
          },
        ],
      },
    ],
  },

  // 8. Bakery & Tea Toast
  {
    name: "Bakery & Tea Toast",
    slug: "bakery-tea-toast",
    description: "Crispy double-baked tea rusks and traditional melt-in-mouth salt butter cookies.",
    products: [
      {
        name: "Salt Butter Cookies",
        slug: "salt-butter-cookies",
        description: "Classic tea-shop butter cookies baked to golden perfection with a touch of crystal sea salt.",
        variants: [
          {
            name: "Authentic Salt Butter Cookies",
            sku: "SBC-ORIG",
            price200: 130,
            price500: 250,
            img: "/categoryLogos/bakery_logo.svg",
            ingredients: "Wheat Flour, Pure Butter, Cane Sugar, Sea Salt, Cardamom Essence",
            shelfLife: "Best before 60 days from manufacture",
          },
        ],
      },
      {
        name: "Crunchy Elaichi Milk Rusk",
        slug: "crunchy-elaichi-milk-rusk",
        description: "Golden twice-baked toast sweetened with farm milk and infused with aromatic elaichi.",
        variants: [
          {
            name: "Cardamom Milk Tea Rusk",
            sku: "MR-ELAICHI",
            price200: 95,
            price500: 180,
            img: "/categoryLogos/bakery_logo.svg",
            ingredients: "Wheat Flour, Milk Solids, Pure Sugar, Yeast, Green Cardamom Seeds",
            shelfLife: "Best before 90 days from manufacture",
          },
        ],
      },
    ],
  },

  // 9. Healthy & Millet Snacks
  {
    uuid: "365e22fd-330e-4349-abf7-560e57dc399d",
    name: "Healthy & Millet Snacks",
    slug: "healthy-millet-snacks",
    description: "Nutritious fiber-packed snacks made with finger millet (ragi), pearl millet (kambu), and foxtail millets.",
    products: [
      {
        name: "Ragi Millet Ribbon Crisps",
        slug: "ragi-millet-ribbon-crisps",
        description: "Iron and calcium-rich finger millet crisps seasoned with cumin, sesame, and Himalayan pink salt.",
        variants: [
          {
            name: "Organic Ragi Ribbon Pakoda",
            sku: "RM-RIBBON",
            price200: 130,
            price500: 300,
            img: "/pledgeLogos/protein.svg",
            ingredients: "Organic Ragi (Finger Millet) Flour, Roasted Gram Flour, Sesame Seeds, Pink Salt",
            shelfLife: "Best before 45 days from manufacture",
          },
          {
            name: "Ragi Garlic Crisps",
            sku: "RM-GARLIC",
            price200: 135,
            price500: 310,
            img: "/pledgeLogos/protein.svg",
            ingredients: "Ragi Flour, Fresh Garlic, Curry Leaves, Red Chilli, Hing, Salt",
            shelfLife: "Best before 45 days from manufacture",
          },
        ],
      },
      {
        name: "Kambu (Bajra) Sev",
        slug: "kambu-bajra-sev",
        description: "Wholesome pearl millet sev with crisp crunch and pleasant nutty aroma.",
        variants: [
          {
            name: "Kambu Roasted Millet Sev",
            sku: "KS-ROAST",
            price200: 125,
            price500: 290,
            img: "/pledgeLogos/gluten.svg",
            ingredients: "Kambu (Bajra) Flour, Besan, Cumin, Carom Seeds, Cold-Pressed Oil, Salt",
            shelfLife: "Best before 45 days from manufacture",
          },
        ],
      },
    ],
  },

  // 10. Roasted Nuts & Seeds
  {
    name: "Roasted Nuts & Seeds",
    slug: "roasted-nuts-seeds",
    description: "Slow-roasted cashews, spiced peanuts, and crunchy seeds tossed in desi spices.",
    products: [
      {
        name: "Spicy Malabar Pepper Cashews",
        slug: "spicy-malabar-pepper-cashews",
        description: "Jumbo Goan whole cashews dry-roasted in pure ghee and dusted with cracked Malabar black pepper.",
        variants: [
          {
            name: "Whole Roasted Pepper Cashews",
            sku: "RC-PEPPER",
            price200: 240,
            price500: 570,
            img: "/categoryLogos/bites_logo.svg",
            ingredients: "Jumbo Whole Cashews (W240), Pure Cow Ghee, Crushed Tellicherry Black Pepper, Rock Salt",
            shelfLife: "Best before 60 days from manufacture",
          },
        ],
      },
    ],
  },

  // 11. Traditional Mittai & Halwa
  {
    name: "Traditional Mittai & Halwa",
    slug: "traditional-mittai-halwa",
    description: "Classic South Indian heritage confections including Tirunelveli ghee halwa and peanut chikki.",
    products: [
      {
        name: "Authentic Tirunelveli Wheat Halwa",
        slug: "authentic-tirunelveli-wheat-halwa",
        description: "World-famous dark amber wheat halwa slow-cooked for hours with pure desi ghee and crunchy cashews.",
        variants: [
          {
            name: "Pure Desi Ghee Wheat Halwa",
            sku: "TH-GHEE",
            price200: 160,
            price500: 310,
            img: "/traditionLogos/01.svg",
            ingredients: "Fermented Whole Wheat Milk, Pure Cow Ghee, Organic Cane Sugar, Roasted Cashew Nuts, Cardamom",
            shelfLife: "Best before 30 days from manufacture",
          },
        ],
      },
    ],
  },

  // 12. Chettinad Specials
  {
    name: "Chettinad Specials",
    slug: "chettinad-specials",
    description: "Spice-rich heritage snack treasures from the Chettinad region made using generational recipes.",
    products: [],
  },
];

async function main() {
  console.log("=========================================");
  console.log("STARTING SEED: 12 CATEGORIES, 21 PRODUCTS, 34 VARIANTS");
  console.log("=========================================");

  // 1. Get or create weight unit (Gram)
  let gramUnit = await prisma.product_units.findFirst({ where: { code: "g" } });
  if (!gramUnit) {
    gramUnit = await prisma.product_units.create({
      data: {
        uuid: crypto.randomUUID(),
        name: "Gram",
        code: "g",
        type: "weight",
        conversion_factor: 0.001,
        is_active: true,
        status: true,
      },
    });
  }

  // 2. Get or create brand (Rithu's Snacks)
  let brand = await prisma.productBrand.findFirst({ where: { slug: "rithus-snacks" } });
  if (!brand) {
    brand = await prisma.productBrand.create({
      data: {
        uuid: crypto.randomUUID(),
        name: "Rithu's Snacks",
        slug: "rithus-snacks",
        description: "Authentic, handcrafted South Indian traditional snacks and sweets.",
        isActive: true,
        status: true,
      },
    });
  }

  // 3. Clean up any temporary cascade test products/categories
  await prisma.productVariant.deleteMany({
    where: { slug: { startsWith: "cascade" } },
  });
  await prisma.product.deleteMany({
    where: { slug: { startsWith: "cascade" } },
  });
  await prisma.productCategory.deleteMany({
    where: { slug: { startsWith: "cascade" } },
  });

  let createdCategoriesCount = 0;
  let createdProductsCount = 0;
  let createdVariantsCount = 0;

  for (const catData of SEED_DATA) {
    // Find existing category by uuid or slug, or create
    let category = catData.uuid
      ? await prisma.productCategory.findFirst({ where: { uuid: catData.uuid } })
      : null;

    if (!category) {
      category = await prisma.productCategory.findFirst({ where: { slug: catData.slug } });
    }

    if (!category) {
      category = await prisma.productCategory.create({
        data: {
          uuid: catData.uuid || crypto.randomUUID(),
          name: catData.name,
          slug: catData.slug,
          description: catData.description,
          isActive: true,
          status: true,
        },
      });
    } else {
      category = await prisma.productCategory.update({
        where: { id: category.id },
        data: {
          name: catData.name,
          slug: catData.slug,
          description: catData.description,
          isActive: true,
          status: true,
          deleted_at: null,
        },
      });
    }
    createdCategoriesCount++;
    console.log(`\n📂 [Category ${createdCategoriesCount}/12] ${category.name} (${category.uuid})`);

    for (const prodData of catData.products) {
      let product = await prisma.product.findFirst({
        where: { slug: prodData.slug },
      });

      if (!product) {
        product = await prisma.product.create({
          data: {
            uuid: crypto.randomUUID(),
            name: prodData.name,
            slug: prodData.slug,
            sku: `PRD-${prodData.slug.toUpperCase()}`,
            base_price: prodData.variants[0].price200,
            categoryId: category.id,
            brandId: brand.id,
            isActive: true,
            status: true,
          },
        });
      } else {
        product = await prisma.product.update({
          where: { id: product.id },
          data: {
            name: prodData.name,
            categoryId: category.id,
            brandId: brand.id,
            base_price: prodData.variants[0].price200,
            isActive: true,
            status: true,
            deleted_at: null,
          },
        });
      }
      createdProductsCount++;
      console.log(`  📦 [Product ${createdProductsCount}/21] ${product.name}`);

      // Ensure product image exists
      const existingProdImg = await prisma.productImage.findFirst({
        where: { productId: product.id },
      });
      if (!existingProdImg) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            image_url: prodData.variants[0].img,
            isPrimary: true,
            sortOrder: 1,
            is_active: true,
          },
        });
      }

      for (let vIdx = 0; vIdx < prodData.variants.length; vIdx++) {
        const vData = prodData.variants[vIdx];
        const vSlug = `${prodData.slug}-${vData.sku.toLowerCase()}`;

        let variant = await prisma.productVariant.findFirst({
          where: { slug: vSlug, productId: product.id },
        });

        if (!variant) {
          variant = await prisma.productVariant.create({
            data: {
              uuid: crypto.randomUUID(),
              productId: product.id,
              variant_name: vData.name,
              slug: vSlug,
              is_default: vIdx === 0,
              isActive: true,
              out_of_stock: false,
              short_description: `Freshly prepared ${vData.name}.`,
              description: `${vData.name} freshly made in small batches using traditional South Indian recipes with pure ingredients.`,
              is_featured: true,
              ingredients: vData.ingredients,
              shelf_life: vData.shelfLife,
              veg_type: "veg",
            },
          });
        } else {
          variant = await prisma.productVariant.update({
            where: { id: variant.id },
            data: {
              variant_name: vData.name,
              isActive: true,
              out_of_stock: false,
              is_default: vIdx === 0,
              ingredients: vData.ingredients,
              shelf_life: vData.shelfLife,
              veg_type: "veg",
              deleted_at: null,
            },
          });
        }
        createdVariantsCount++;
        console.log(`    ✦ [Variant ${createdVariantsCount}/34] ${variant.variant_name}`);

        // Ensure variant image exists
        const existingVarImg = await prisma.product_variant_images.findFirst({
          where: { variant_id: variant.id },
        });
        if (!existingVarImg) {
          await prisma.product_variant_images.create({
            data: {
              uuid: crypto.randomUUID(),
              variant_id: variant.id,
              image_url: vData.img,
              is_primary: true,
              sort_order: 1,
              is_active: true,
            },
          });
        }

        // Unit Price 200g/250g (Default pack size)
        const unitVal1 = vData.price200 > 500 ? 1000 : vData.name.includes("Mysore") || vData.name.includes("Halwa") || vData.name.includes("Laddu") || vData.name.includes("Cookies") ? 250 : 200;
        const sku1 = `${vData.sku}-${unitVal1}G`;
        let up1 = await prisma.variantUnitPrice.findFirst({
          where: { sku: sku1 },
        });

        if (!up1) {
          up1 = await prisma.variantUnitPrice.create({
            data: {
              uuid: crypto.randomUUID(),
              variant_id: variant.id,
              unit_id: gramUnit.id,
              unit_value: unitVal1,
              sku: sku1,
              base_price: vData.price200,
              is_default: true,
              isActive: true,
            },
          });
        } else {
          up1 = await prisma.variantUnitPrice.update({
            where: { id: up1.id },
            data: {
              variant_id: variant.id,
              base_price: vData.price200,
              unit_value: unitVal1,
              is_default: true,
              isActive: true,
              deleted_at: null,
            },
          });
        }

        // Inventory for unit 1
        const inv1 = await prisma.inventory.findFirst({
          where: { variantUnitPriceId: up1.id },
        });
        if (!inv1) {
          await prisma.inventory.create({
            data: {
              variantUnitPriceId: up1.id,
              quantity_available: 100,
              quantity_reserved: 0,
              reorderLevel: 10,
              is_active: true,
            },
          });
        } else {
          await prisma.inventory.update({
            where: { id: inv1.id },
            data: { quantity_available: 100, is_active: true },
          });
        }

        // Unit Price 500g (if applicable)
        if (vData.price500 !== vData.price200) {
          const unitVal2 = 500;
          const sku2 = `${vData.sku}-${unitVal2}G`;
          let up2 = await prisma.variantUnitPrice.findFirst({
            where: { sku: sku2 },
          });

          if (!up2) {
            up2 = await prisma.variantUnitPrice.create({
              data: {
                uuid: crypto.randomUUID(),
                variant_id: variant.id,
                unit_id: gramUnit.id,
                unit_value: unitVal2,
                sku: sku2,
                base_price: vData.price500,
                is_default: false,
                isActive: true,
              },
            });
          } else {
            up2 = await prisma.variantUnitPrice.update({
              where: { id: up2.id },
              data: {
                variant_id: variant.id,
                base_price: vData.price500,
                unit_value: unitVal2,
                is_default: false,
                isActive: true,
                deleted_at: null,
              },
            });
          }

          const inv2 = await prisma.inventory.findFirst({
            where: { variantUnitPriceId: up2.id },
          });
          if (!inv2) {
            await prisma.inventory.create({
              data: {
                variantUnitPriceId: up2.id,
                quantity_available: 80,
                quantity_reserved: 0,
                reorderLevel: 10,
                is_active: true,
              },
            });
          } else {
            await prisma.inventory.update({
              where: { id: inv2.id },
              data: { quantity_available: 80, is_active: true },
            });
          }
        }
      }
    }
  }

  console.log("\n=========================================");
  console.log(`SEED COMPLETE:`);
  console.log(`✓ Total Categories: ${createdCategoriesCount}`);
  console.log(`✓ Total Products:   ${createdProductsCount}`);
  console.log(`✓ Total Variants:   ${createdVariantsCount}`);
  console.log("=========================================");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
