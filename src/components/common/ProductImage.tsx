"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface ProductImageProps {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
  aspectRatio?: "square" | "video" | "4/3" | "auto";
  badge?: React.ReactNode;
  fallbackText?: string;
}

/**
 * Beautiful authentic South Indian snack SVG fallback illustration
 */
export function SnackFallbackIllustration({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden select-none bg-gradient-to-br from-[#FFF9F2] via-[#FFF1E5] to-[#FDE8D4] text-[#8B1D1D] p-1.5 sm:p-2.5 text-center w-full h-full",
        className
      )}
      aria-label={title || "Authentic Snack"}
    >
      {/* Decorative background radial pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#8B1D1D_0.75px,transparent_0.75px)] opacity-[0.06] [background-size:8px_8px]" />

      {/* Center Illustration */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-full max-h-full">
        <div className="w-7 h-7 sm:w-10 sm:h-10 md:w-14 md:h-14 rounded-full bg-white/90 shadow-2xs border border-[#8B1D1D]/15 flex items-center justify-center p-1 sm:p-2 backdrop-blur-xs flex-shrink-0">
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full text-[#8B1D1D]"
          >
            {/* Urli / Bowl */}
            <path
              d="M8 36C8 47.0457 18.7452 56 32 56C45.2548 56 56 47.0457 56 36H8Z"
              fill="#E3A857"
              fillOpacity="0.3"
              stroke="#8B1D1D"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <ellipse
              cx="32"
              cy="36"
              rx="24"
              ry="7"
              fill="#F4D39B"
              stroke="#8B1D1D"
              strokeWidth="2.5"
            />
            {/* Murukku / Ribbon pakoda spirals */}
            <path
              d="M24 33C24 28 28 24 32 24C36 24 40 28 38 33C37 36 34 37 32 37"
              stroke="#8B1D1D"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M18 34C19 26 26 20 33 20C41 20 46 25 45 32"
              stroke="#C97A1E"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Steam / Aroma curls */}
            <path
              d="M28 16C27 13 29 11 29 9"
              stroke="#8B1D1D"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
            <path
              d="M35 15C36 12 34 10 35 7"
              stroke="#8B1D1D"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
          </svg>
        </div>

        {/* Brand signature & label (adaptive) */}
        <span className="hidden sm:block font-serif font-bold text-[11px] md:text-sm tracking-wide text-[#8B1D1D] mt-1 line-clamp-1">
          Rithu&apos;s
        </span>
        {title && (
          <span className="hidden md:block text-[10px] text-[#8B1D1D]/70 font-medium line-clamp-1">
            {title}
          </span>
        )}
      </div>
    </div>
  );
}

// Global cache of URLs that failed to load, preventing repeated slow network timeouts across cards
const FAILED_IMAGE_URLS = new Set<string>();

function isUnresolvableImageSrc(src?: string | null): boolean {
  if (!src) return true;
  const trimmed = src.trim();
  if (
    trimmed === "" ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "/images/placeholder.png" ||
    (trimmed.startsWith("/logos/") && trimmed.endsWith(".png"))
  ) {
    return true;
  }
  return FAILED_IMAGE_URLS.has(trimmed);
}

export function ProductImage({
  src,
  alt,
  fill = true,
  width,
  height,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
  className,
  containerClassName,
  aspectRatio = "square",
  badge,
  fallbackText,
}: ProductImageProps) {
  const isInvalidSrc = isUnresolvableImageSrc(src);
  const [hasError, setHasError] = useState(isInvalidSrc);
  const [isLoading, setIsLoading] = useState(!isInvalidSrc);

  const isMountedRef = useRef(false);
  const hasLoadedBeforeMountRef = useRef(false);
  const prevSrcRef = useRef(src);

  useEffect(() => {
    isMountedRef.current = true;
    if (hasLoadedBeforeMountRef.current) {
      setIsLoading(false);
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (prevSrcRef.current !== src) {
      prevSrcRef.current = src;
      const invalid = isUnresolvableImageSrc(src);
      setHasError(invalid);
      setIsLoading(!invalid);
      hasLoadedBeforeMountRef.current = false;
    }
  }, [src]);

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "video"
      ? "aspect-video"
      : aspectRatio === "4/3"
      ? "aspect-4/3"
      : "";

  const handleImageLoad = () => {
    if (isMountedRef.current) {
      setIsLoading(false);
    } else {
      hasLoadedBeforeMountRef.current = true;
    }
  };

  const handleImageError = () => {
    if (src) {
      FAILED_IMAGE_URLS.add(src.trim());
    }
    if (isMountedRef.current) {
      setHasError(true);
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-stone-50",
        aspectClass,
        containerClassName
      )}
    >
      {badge && <div className="absolute top-3 left-3 z-20 pointer-events-none">{badge}</div>}

      {isInvalidSrc || hasError ? (
        <SnackFallbackIllustration
          className={cn("w-full h-full", className)}
          title={fallbackText || alt}
        />
      ) : (
        <>
          {isLoading && (
            <div className="absolute inset-0 z-10 animate-pulse bg-gradient-to-br from-stone-100 via-amber-50/40 to-stone-100" />
          )}

          {fill ? (
            <Image
              src={src!}
              alt={alt || "Rithu Snack Product"}
              fill
              sizes={sizes}
              priority={priority}
              onLoad={handleImageLoad}
              onError={handleImageError}
              className={cn(
                "object-cover transition-opacity duration-300",
                isLoading ? "opacity-0" : "opacity-100",
                className
              )}
            />
          ) : (
            <Image
              src={src!}
              alt={alt || "Rithu Snack Product"}
              width={width || 400}
              height={height || 400}
              sizes={sizes}
              priority={priority}
              onLoad={handleImageLoad}
              onError={handleImageError}
              className={cn(
                "object-cover transition-opacity duration-300",
                isLoading ? "opacity-0" : "opacity-100",
                className
              )}
            />
          )}
        </>
      )}
    </div>
  );
}
