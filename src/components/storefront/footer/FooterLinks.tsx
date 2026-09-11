"use client";

import * as React from "react";

export interface FooterLinksProps {
  title: string;
  items: string[];
  className?: string;
  onItemClick?: (item: string) => void;
}

export function FooterLinks({
  title,
  items,
  className = "",
  onItemClick,
}: FooterLinksProps) {

  return (
    <div className={className}>
      <h3 className="text-[24px] sm:text-[28px] lg:text-xl font-semibold mb-6">
        {title}
      </h3>

      <ul className="space-y-3 text-gray-200 header-font">
        {items.map((item) => (
          <li key={item}>
            <span
              className="inline-block cursor-pointer select-none transition-all duration-200 hover:text-amber-300 hover:translate-x-1.5"
              onClick={() => onItemClick?.(item)}
              role={onItemClick ? "button" : undefined}
              tabIndex={onItemClick ? 0 : undefined}
              onKeyDown={(e) => {
                if (onItemClick && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onItemClick(item);
                }
              }}
            >
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FooterLinks;
