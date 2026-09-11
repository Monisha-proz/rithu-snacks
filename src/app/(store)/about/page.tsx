import { Metadata } from "next";
import {
  AboutHeroSection,
  AboutOurStorySection,
  AboutFounderSection,
} from "@/components/storefront/about";

export const metadata: Metadata = {
  title: "About Us - Zelleroa | Elegance in Every Stitch",
  description:
    "Learn about Zelleroa, delivering bespoke fashion, contemporary craftsmanship, and timeless designer clothing crafted with care.",
};

export default function AboutPage() {
  return (
    <div className="w-full">
      {/* 1. Hero Banner: Tradition in Every Bite */}
      <AboutHeroSection />

      {/* 2. Our Story: Rooted in tradition, growing with purpose */}
      <AboutOurStorySection />

      {/* 3. The Woman Behind The Vision: Dr. S. Anita */}
      <AboutFounderSection />
    </div>
  );
}
