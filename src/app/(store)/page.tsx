
import {
  HeroSlider,
  CategorySection,
  ProductSection,
  Banner,
  Pledge,
  Tradition,
  Features,
  Feedback,
  OfferPopup,
  OfferReels,
} from "@/components/storefront";

export default function HomePage() {
  return (
    <div className="bg-white">
      <OfferPopup />
      <HeroSlider />
      <CategorySection />
      <ProductSection />
      <Banner />
      <OfferReels />
      <Pledge />
      <Tradition />
      <Features />
      <Feedback />
    </div>
  );
}
