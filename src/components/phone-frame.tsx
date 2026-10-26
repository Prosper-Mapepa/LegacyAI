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
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <time
      dateTime={now.toISOString()}
      className={className}
      suppressHydrationWarning
    >
      {formatClock(now)}
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
  const homeBar =
    tone === "dark" ? "bg-[#061226]" : "bg-[#f7f9fc]";
  const homePill = tone === "dark" ? "bg-white/25" : "bg-slate-300";

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-lg bg-transparent md:max-w-[390px]",
        fillHeight && "flex h-full min-h-0 flex-col",
        className,
      )}
    >
      <div
        className={cn(
          "overflow-hidden",
          // Navy shell so rounded corners never flash white outside the bezel
          chrome ? "bg-pnc-navy" : tone === "dark" ? "bg-[#061226]" : "bg-white",
          fillHeight && "flex h-full min-h-0 flex-col",
          chrome &&
            "rounded-[1.25rem] border-[8px] border-pnc-navy shadow-xl sm:rounded-[2rem] sm:border-[10px]",
        )}
      >
        {chrome && (
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
        )}

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

        {chrome && (
          <div className={cn("flex shrink-0 justify-center py-2", homeBar)}>
            <div className={cn("h-1 w-28 rounded-full", homePill)} aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}
