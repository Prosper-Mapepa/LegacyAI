"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Crisp LegacyAI mark — no badge background.
 * `onDark`: white wordmark for navy surfaces (phone frame).
 * default: navy wordmark for light surfaces (site header).
 */
export function BrandLogo({
  className,
  onDark = false,
  showWordmark = true,
  size = "md",
}: {
  className?: string;
  onDark?: boolean;
  showWordmark?: boolean;
  size?: "sm" | "md";
}) {
  const uid = useId().replace(/:/g, "");
  const gradId = `lGrad-${uid}`;
  const legacyFill = onDark ? "#FFFFFF" : "#0A2540";
  const aiFill = "#F57C00";
  const iconClass = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  const textClass =
    size === "sm"
      ? "text-[0.95rem] font-bold tracking-tight leading-none"
      : "text-[1.2rem] font-bold tracking-tight leading-none";

  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      role="img"
      aria-label="LegacyAI"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className={cn("shrink-0", iconClass)}
      >
        <path
          d="M12 10h18c2.2 0 4 1.8 4 4v8H22v24h28v10H16c-2.2 0-4-1.8-4-4V10z"
          fill={`url(#${gradId})`}
        />
        <circle cx="28" cy="22" r="4.2" fill="#1A73E8" />
        <rect x="24.8" y="27" width="6.4" height="14" rx="3.2" fill="#1A73E8" />
        <circle cx="38" cy="26" r="3.2" fill="#F57C00" />
        <rect x="35.6" y="30" width="4.8" height="10" rx="2.4" fill="#F57C00" />
        <path d="M46 24l12 8-12 8V24z" fill="#F57C00" />
        <defs>
          <linearGradient
            id={gradId}
            x1="12"
            y1="10"
            x2="50"
            y2="56"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#4DA3FF" />
            <stop offset="1" stopColor="#0052CC" />
          </linearGradient>
        </defs>
      </svg>

      {showWordmark && (
        <span className={cn("flex items-baseline", textClass)}>
          <span style={{ color: legacyFill }}>Legacy</span>
          <span style={{ color: aiFill }}>AI</span>
        </span>
      )}
    </span>
  );
}
