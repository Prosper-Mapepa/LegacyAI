import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

/**
 * On desktop/tablet: demo phone chrome.
 * On real mobile viewports: full-width native content (no fake bezel).
 */
export function PhoneFrame({
  children,
  title = "LegacyAI",
  className,
  fillHeight = false,
}: {
  children: ReactNode;
  title?: string;
  className?: string;
  /** Stretch to fill parent height (used by mobile chat shell). */
  fillHeight?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-lg md:max-w-[390px]",
        fillHeight && "flex h-full min-h-0 flex-col",
        className
      )}
    >
      <div
        className={cn(
          "overflow-hidden bg-white",
          fillHeight && "flex h-full min-h-0 flex-col",
          "md:rounded-[2rem] md:border-[10px] md:border-pnc-navy md:shadow-xl"
        )}
      >
        <div className="hidden shrink-0 items-center justify-between gap-2 bg-pnc-navy px-3 py-2.5 text-white md:flex">
          <span className="w-8 shrink-0 text-[10px] font-medium opacity-80">
            9:41
          </span>
          <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
            <BrandLogo onDark size="sm" />
            <span className="truncate text-[10px] font-medium text-white/75">
              {title}
            </span>
          </div>
          <span
            className="w-8 shrink-0 text-right text-[10px] opacity-80"
            aria-hidden
          >
            ●●
          </span>
        </div>

        <div
          className={cn(
            "phone-frame-content flex min-h-0 flex-col overflow-x-hidden bg-[#f7f9fc]",
            fillHeight
              ? "h-full flex-1"
              : "min-h-[min(70vh,560px)] md:min-h-[640px] md:max-h-[720px] md:overflow-y-auto"
          )}
        >
          {children}
        </div>

        <div className="hidden shrink-0 justify-center bg-white py-2 md:flex">
          <div className="h-1 w-28 rounded-full bg-slate-300" aria-hidden />
        </div>
      </div>
    </div>
  );
}
