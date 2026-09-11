import React from "react";
import Image from "next/image";
import { Quote } from "lucide-react";

export function AboutFounderSection() {
  return (
    <section className="bg-about-founder-bg py-16 sm:py-24 px-6 lg:px-16 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Founder Biography & Signature */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Eyebrow */}
            <span className="text-xs font-bold tracking-widest text-about-eyebrow uppercase mb-3 block">
              THE WOMAN BEHIND THE VISION
            </span>

            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-about-heading leading-[1.2] tracking-tight mb-6">
              Crafting timeless fashion with
              <br className="hidden sm:inline" />
              {" "}passion & purpose
            </h2>

            {/* Paragraphs */}
            <div className="space-y-4 text-about-body text-sm sm:text-base leading-relaxed mb-8 max-w-xl">
              <p>
                With a deep love for textiles, tailoring, and contemporary silhouettes, Zelleroa was founded to bring together timeless elegance, artisan detailing, and accessible luxury.
              </p>
              <p>
                Every collection is born from an uncompromising commitment to premium breathable fabrics, flattering fits, and styles that empower everyday confidence.
              </p>
            </div>

            {/* Founder Signature Block */}
            <div className="pt-6 border-t border-about-divider flex flex-wrap items-center justify-between gap-6 w-full max-w-xl">
              <div>
                <h4 className="font-bold text-base sm:text-lg text-about-heading">
                  Creative Direction
                </h4>
                <p className="text-[10px] sm:text-[11px] tracking-wider uppercase font-semibold text-neutral-500 mt-0.5">
                  FOUNDER & DESIGN HEAD — ZELLEROA
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Arch Shape with Image & Overlaid Quote Card */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative flex flex-col items-center justify-end w-full max-w-[340px] sm:max-w-[370px]">
              {/* Outer Arch Frame */}
              <div className="w-full p-2.5 sm:p-3 rounded-t-full bg-white/40 border border-about-divider/60 shadow-sm">
                {/* Inner Arch Body with Image */}
                <div className="w-full h-[380px] sm:h-[430px] rounded-t-full relative overflow-hidden shadow-inner bg-neutral-100">
                </div>
              </div>

              {/* Overlaid Dark Quote Box */}
              <div className="w-[96%] sm:w-[100%] bg-about-quote-bg text-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-white/10 -mt-16 sm:-mt-20 relative z-10 text-left">
                {/* Quote Icon */}
                <span className="text-about-quote-accent text-3xl sm:text-4xl leading-none select-none block mb-2 font-bold">
                  <Quote />
                </span>
                <p className="italic text-xs sm:text-sm text-neutral-200/95 leading-relaxed font-normal">
                  "True style is where thoughtful design, exquisite fabrics, and effortless comfort effortlessly come together."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutFounderSection;
