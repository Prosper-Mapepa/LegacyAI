import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

/** Compact header placeholder while the real nav hydrates. */
export function HeaderSkeleton() {
  return (
    <header
      className="fixed inset-x-0 top-0 z-40 border-b border-pnc-border bg-white"
      aria-hidden
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 sm:px-4 md:h-[4.25rem]">
        <BrandLogo />
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 animate-pulse rounded-md bg-pnc-bg" />
          <div className="hidden h-8 w-8 animate-pulse rounded-md bg-pnc-bg sm:block" />
        </div>
      </div>
    </header>
  );
}

/**
 * Branded demo loader — used for Zustand hydration and route transitions.
 */
export function SiteLoader({
  className,
  label = "Loading demo",
  fullPage = false,
}: {
  className?: string;
  label?: string;
  /** Fill the main content area (centered). */
  fullPage?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex flex-col items-center justify-center gap-5",
        fullPage && "min-h-[min(60vh,28rem)] py-10",
        className
      )}
    >
      <div className="relative flex flex-col items-center gap-4">
        <div className="loader-logo-pulse">
          <BrandLogo size="md" />
        </div>

        <div className="w-44 overflow-hidden rounded-full bg-pnc-border/70 sm:w-52">
          <div className="loader-bar h-1 rounded-full bg-gradient-to-r from-pnc-blue via-pnc-orange to-pnc-blue" />
        </div>

        <p className="text-sm font-medium text-pnc-navy">
          {label}
          <span className="loader-dots text-pnc-orange" aria-hidden>
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>
        <span className="sr-only">{label}…</span>
      </div>
    </div>
  );
}
