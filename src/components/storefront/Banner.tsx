"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { LOGOS } from "@/constants/storefront";
import { useCustomerBanners } from "@/features/banners/hooks";
import { Section } from "./Section";

export function Banner() {
  const { data: offerBanners } = useCustomerBanners({ position: "home-offer" });

  if (!offerBanners || offerBanners.length === 0) {
    return (
      <Section className="py-4 sm:py-6 md:py-8">
        <div className="w-full overflow-hidden rounded-2xl shadow-xs">
          <Image
            src={LOGOS.banner}
            alt="banner"
            width={1400}
            height={400}
            className="w-full h-auto block hover:scale-[1.01] transition-transform duration-300"
          />
        </div>
      </Section>
    );
  }

  return (
    <Section className="py-4 sm:py-6 md:py-8">
      <div className="w-full space-y-4">
        {offerBanners.map((banner) => {
          const image = (
            <Image
              src={banner.imageUrl}
              alt={banner.title || "Offer banner"}
              width={1400}
              height={400}
              className="w-full h-auto block hover:scale-[1.01] transition-transform duration-300"
            />
          );
          return (
            <div key={banner.id} className="w-full overflow-hidden rounded-2xl shadow-xs">
              {banner.linkUrl ? <Link href={banner.linkUrl}>{image}</Link> : image}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

export default Banner;
