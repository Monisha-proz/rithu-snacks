import type { Metadata } from "next";
import { FaqSection } from "@/components/storefront/faq";

export const metadata: Metadata = {
  title: "FAQs - Zelleroa | Orders, Sizing, Fabrics & Gifting",
  description:
    "Answers to common questions about delivery, size guide, fabric care, packaging, bulk corporate orders, returns and exchanges at Zelleroa.",
};

export default function FaqPage() {
  return <FaqSection />;
}
