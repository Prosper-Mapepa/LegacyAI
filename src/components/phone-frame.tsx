"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

function formatClock(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function LiveClock({ className }: { className?: string }) {
  // null until mount — avoids SSR/client clock hydration mismatch
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <time
      dateTime={now?.toISOString()}
      className={className}
      suppressHydrationWarning
    >
      {now ? formatClock(now) : "\u00a0"}
    </time>
  );
}

/**
 * Phone mockup for the demo journey.
 * `chrome={false}` = full-bleed content (immersive mobile chat).
 */
export function PhoneFrame({
  children,
  title = "LegacyAI",
  className,
  fillHeight = false,
  chrome = true,
  tone = "light",
}: {
  children: ReactNode;
  title?: string;
  className?: string;
  /** Stretch to fill parent height (used by mobile chat shell). */
  fillHeight?: boolean;
  /** Show device bezel / status bar / home indicator. */
  chrome?: boolean;
  /** light = mist content; dark = navy call / stage screens */
  tone?: "light" | "dark";
}) {
  const contentBg = tone === "dark" ? "bg-[#061226]" : "bg-[#f7f9fc]";
  const homeBar = tone === "dark" ? "bg-[#061226]" : "bg-[#f7f9fc]";
  const homePill = tone === "dark" ? "bg-white/25" : "bg-slate-300";

  return (
    <div
      className={cn(
        "mx-auto w-full bg-transparent",
        // Default phone width; callers can override via className (e.g. landing hero).
        !className?.includes("max-w-") && "max-w-lg md:max-w-[390px]",
        fillHeight && "flex h-full min-h-0 flex-col",
        className,
      )}
    >
      {chrome ? (
        <div
          className={cn(
            "overflow-hidden bg-pnc-navy",
            // Slim navy bezel + crisp outer edge (no muddy double border)
            "rounded-[1.35rem] p-[9px] shadow-[0_18px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/15 sm:rounded-[1.75rem] sm:p-[10px]",
            fillHeight && "flex h-full min-h-0 flex-1 flex-col",
          )}
        >
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[0.95rem] sm:rounded-[1.25rem]",
              tone === "dark" ? "bg-[#061226]" : "bg-[#f7f9fc]",
            )}
          >
            <div className="flex shrink-0 items-center justify-between gap-2 bg-pnc-navy px-3 py-2.5 text-white">
              <LiveClock className="w-14 shrink-0 text-[10px] font-medium tabular-nums opacity-90" />
              <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
                <Logo className="h-6" />
                <span className="truncate text-[10px] font-medium text-white/75">
                  {title}
                </span>
              </div>
              <span
                className="w-14 shrink-0 text-right text-[10px] opacity-80"
                aria-hidden
              >
                ●●
              </span>
            </div>

            <div
              className={cn(
                "phone-frame-content flex min-h-0 flex-1 flex-col overflow-x-hidden",
                contentBg,
                fillHeight
                  ? "overflow-hidden"
                  : "min-h-[min(70vh,560px)] md:min-h-[640px] md:max-h-[720px] md:overflow-y-auto",
              )}
            >
              {children}
            </div>

            <div className={cn("flex shrink-0 justify-center py-2", homeBar)}>
              <div
                className={cn("h-1 w-28 rounded-full", homePill)}
                aria-hidden
              />
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "overflow-hidden",
            tone === "dark" ? "bg-[#061226]" : "bg-white",
            fillHeight && "flex h-full min-h-0 flex-col",
          )}
        >
          <div
            className={cn(
              "phone-frame-content flex min-h-0 flex-col overflow-x-hidden",
              contentBg,
              fillHeight
                ? "h-full min-h-0 flex-1 overflow-hidden"
                : "min-h-[min(70vh,560px)] md:min-h-[640px] md:max-h-[720px] md:overflow-y-auto",
            )}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
