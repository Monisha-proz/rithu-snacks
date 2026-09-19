"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { sanitizeRichText } from "@/lib/sanitize-html";

interface ExpandableRichTextProps {
  html: string;
  className?: string;
  toggleClassName?: string;
  clampClassName?: string;
  characterThreshold?: number;
}

function ExpandableRichText({
  html,
  className = "",
  toggleClassName = "text-sm font-medium text-primary hover:underline mt-1",
  clampClassName = "line-clamp-3",
  characterThreshold = 200,
}: ExpandableRichTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Extract plain text length from HTML
  const plainTextLength = useMemo(() => {
    return html
      ? html.replace(/<[^>]*>/g, "").replace(/&[a-z0-9#]+;/gi, " ").trim().length
      : 0;
  }, [html]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const checkOverflow = () => {
      // If plain text is short and content does not overflow client height, don't show toggle
      if (plainTextLength < characterThreshold && el.scrollHeight <= el.clientHeight + 4) {
        setCanExpand(false);
        return;
      }

      if (!expanded) {
        const hasOverflow = el.scrollHeight > el.clientHeight + 4;
        setCanExpand(hasOverflow || plainTextLength >= characterThreshold);
      }
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
    };
  }, [html, expanded, plainTextLength, characterThreshold]);

  const sanitizedHtml = useMemo(() => sanitizeRichText(html || ""), [html]);

  if (!html) return null;

  return (
    <div className="w-full min-w-0">
      <div
        ref={contentRef}
        className={`rich-text-content break-words [overflow-wrap:anywhere] ${className} ${expanded || !canExpand ? "" : clampClassName}`}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className={toggleClassName}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

export { ExpandableRichText };

