"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { DEMO_PASSWORD, signIn, usePerson } from "@/domain/accounts";
import { PILOT_HOUSEHOLD_ID } from "@/data/story";
import {
  demoStepById,
  personMatchesStepRole,
  ROLE_SEAT_EMAIL,
  type DemoStepId,
} from "@/lib/demo-flow";

const TOUR_DONE_KEY = "legacyai.tourDone";

type TourStep = {
  id: string;
  href: string;
  flowStepId: DemoStepId;
  target: string;
  title: string;
  body: string;
  roleLabel: string;
};

/** Spotlight only the action button to click at each stage. */
export const TOUR_STEPS: TourStep[] = [
  {
    id: "to-book",
    href: "/dashboard",
    flowStepId: "signal",
    target: "next-step",
    title: "Go to Book",
    body: "Tap Next to open the family book after you’ve reviewed the analysis.",
    roleLabel: "Advisor",
  },
  {
    id: "open-desk",
    href: "/workbench",
    flowStepId: "book",
    target: "open-desk",
    title: "Open Whitfield",
    body: "Tap Open desk to work the featured family.",
    roleLabel: "Advisor",
  },
  {
    id: "to-hub",
    href: "/workbench",
    flowStepId: "book",
    target: "next-step",
    title: "Go to Hub",
    body: "Tap Next so the Principal can allow a call.",
    roleLabel: "Advisor",
  },
  {
    id: "allow",
    href: `/hub/${PILOT_HOUSEHOLD_ID}`,
    flowStepId: "hub",
    target: "allow-call",
    title: "Allow the call",
    body: "Tap Allow call on Heir. Outreach stays locked until you do.",
    roleLabel: "Principal",
  },
  {
    id: "outreach",
    href: "/rm",
    flowStepId: "outreach",
    target: "outreach-call",
    title: "Start outreach",
    body: "Tap Call (or Continue to Intake) to run outreach and send the email.",
    roleLabel: "Advisor",
  },
  {
    id: "intake",
    href: "/customer",
    flowStepId: "intake",
    target: "intake-push",
    title: "Open intake",
    body: "Tap the notification — then the invite — to start the chat.",
    roleLabel: "Heir",
  },
  {
    id: "to-plan",
    href: "/customer",
    flowStepId: "intake",
    target: "next-step",
    title: "Go to Plan",
    body: "When the chat is ready, tap Next to review the draft plan.",
    roleLabel: "Heir",
  },
  {
    id: "finish-plan",
    href: "/customer/plan",
    flowStepId: "plan",
    target: "next-step",
    title: "Finish the plan",
    body: "Choose Save or Reinvest in the phone, then tap Next to return.",
    roleLabel: "Heir",
  },
  {
    id: "report",
    href: "/report",
    flowStepId: "report",
    target: "next-step",
    title: "View the report",
    body: "You’re on the full client report. Tap Next when you’re done exploring.",
    roleLabel: "Advisor",
  },
];

type Rect = { top: number; left: number; width: number; height: number };

type SystemTourContextValue = {
  open: boolean;
  openTour: (startAt?: number) => void;
  closeTour: () => void;
};

const SystemTourContext = createContext<SystemTourContextValue | null>(null);

export function useSystemTour() {
  const ctx = useContext(SystemTourContext);
  if (!ctx) {
    throw new Error("useSystemTour must be used within SystemTourProvider");
  }
  return ctx;
}

export function useSystemTourOptional() {
  return useContext(SystemTourContext);
}

function pathMatches(href: string, path: string) {
  if (path === href) return true;
  if (
    href === "/customer" &&
    path.startsWith("/customer") &&
    !path.startsWith("/customer/plan") &&
    !path.startsWith("/customer/chat")
  ) {
    return true;
  }
  if (href.startsWith("/hub") && path.startsWith("/hub")) return true;
  if (href !== "/" && path.startsWith(`${href}/`)) return true;
  return false;
}

function measureTarget(id: string): Rect | null {
  const el =
    document.querySelector(`[data-tour="${id}"]:not([disabled])`) ??
    document.querySelector(`[data-tour="${id}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  const after = el.getBoundingClientRect();
  return {
    top: after.top,
    left: after.left,
    width: after.width,
    height: after.height,
  };
}

/** Keep the tip outside the cutout — never stacked on top of a large target. */
function tipPosition(highlight: Rect | null): CSSProperties {
  const width = 320;
  const tipH = 200;
  const margin = 16;

  if (!highlight) {
    return {
      top: "50%",
      left: "50%",
      width,
      transform: "translate(-50%, -50%)",
    };
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = 12;
  const oversized =
    highlight.height > vh * 0.38 || highlight.width > vw * 0.72;

  if (oversized) {
    return {
      top: Math.min(vh - tipH - margin, Math.max(margin, highlight.top + 12)),
      left: Math.min(vw - width - margin, Math.max(margin, vw - width - margin)),
      width,
    };
  }

  const below = highlight.top + highlight.height + gap;
  const above = highlight.top - gap;
  const spaceBelow = vh - (highlight.top + highlight.height);
  const placeBelow = spaceBelow >= tipH + margin || highlight.top < tipH + margin;

  let top = placeBelow ? below : above;
  let left = highlight.left + highlight.width / 2 - width / 2;
  left = Math.min(Math.max(margin, left), vw - width - margin);

  if (!placeBelow) {
    return { top, left, width, transform: "translateY(-100%)" };
  }
  if (top + tipH > vh - margin) {
    top = Math.max(margin, highlight.top - gap);
    return { top, left, width, transform: "translateY(-100%)" };
  }
  return { top, left, width };
}

export function SystemTourProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const person = usePerson();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const navigating = useRef(false);

  const markDone = useCallback(() => {
    try {
      sessionStorage.setItem(TOUR_DONE_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const closeTour = useCallback(() => {
    markDone();
    setOpen(false);
    setRect(null);
    navigating.current = false;
  }, [markDone]);

  const openTour = useCallback(
    (startAt = 0) => {
      if (!person) return;
      setIndex(Math.max(0, Math.min(startAt, TOUR_STEPS.length - 1)));
      setOpen(true);
    },
    [person],
  );

  const step = TOUR_STEPS[index];
  const flow = step ? demoStepById(step.flowStepId) : null;
  const roleOk = Boolean(
    person && flow && personMatchesStepRole(person.role, flow.role),
  );
  const routeOk = Boolean(step && pathMatches(step.href, path));
  const readyForTip = open && roleOk && routeOk;

  useEffect(() => {
    if (!open || !step || !person || !flow) return;
    if (path.startsWith("/switch-role") || path.startsWith("/sign-")) return;

    const needRole = !personMatchesStepRole(person.role, flow.role);
    const needRoute = !pathMatches(step.href, path);
    if (!needRole && !needRoute) return;
    if (navigating.current) return;

    navigating.current = true;
    void (async () => {
      try {
        if (needRole) {
          await signIn(ROLE_SEAT_EMAIL[flow.role], DEMO_PASSWORD);
        }
        if (needRoute) router.push(step.href);
      } finally {
        window.setTimeout(() => {
          navigating.current = false;
        }, 450);
      }
    })();
  }, [open, step, flow, person, path, router]);

  const refreshRect = useCallback(() => {
    if (!readyForTip || !step) {
      setRect(null);
      return;
    }
    setRect(measureTarget(step.target));
  }, [readyForTip, step]);

  useLayoutEffect(() => {
    if (!open) return;
    refreshRect();
    const timers = [100, 350, 700, 1200].map((ms) =>
      window.setTimeout(refreshRect, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [open, index, path, person?.role, readyForTip, refreshRect]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => refreshRect();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, refreshRect]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTour();
      if (event.key === "ArrowRight") {
        setIndex((i) => Math.min(i + 1, TOUR_STEPS.length - 1));
      }
      if (event.key === "ArrowLeft") {
        setIndex((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, closeTour]);

  useEffect(() => {
    if (open && !person) {
      setOpen(false);
      setRect(null);
    }
  }, [open, person]);

  // Advance when the user clicks the highlighted action
  useEffect(() => {
    if (!open || !step) return;
    const onClick = (event: MouseEvent) => {
      const node = event.target;
      if (!(node instanceof Element)) return;
      const hit = node.closest(`[data-tour="${step.target}"]`);
      if (!hit) return;
      window.setTimeout(() => {
        setIndex((i) => {
          if (i >= TOUR_STEPS.length - 1) {
            markDone();
            setOpen(false);
            setRect(null);
            return i;
          }
          return i + 1;
        });
      }, 280);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [open, step, markDone]);

  const value = useMemo(
    () => ({ open, openTour, closeTour }),
    [open, openTour, closeTour],
  );

  const pad = 6;
  const highlight = rect
    ? {
        top: Math.max(4, rect.top - pad),
        left: Math.max(4, rect.left - pad),
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  const isFirst = index === 0;
  const isLast = index === TOUR_STEPS.length - 1;

  return (
    <SystemTourContext.Provider value={value}>
      {children}

      {open && person && step && (
        <div className="pointer-events-none fixed inset-0 z-[70]" aria-live="polite">
          {/* Block clicks everywhere except the highlighted button */}
          {highlight ? (
            <>
              <div
                className="pointer-events-auto absolute inset-x-0 top-0 z-[70]"
                style={{ height: Math.max(0, highlight.top) }}
                aria-hidden
              />
              <div
                className="pointer-events-auto absolute left-0 z-[70]"
                style={{
                  top: highlight.top,
                  width: Math.max(0, highlight.left),
                  height: highlight.height,
                }}
                aria-hidden
              />
              <div
                className="pointer-events-auto absolute z-[70]"
                style={{
                  top: highlight.top,
                  left: highlight.left + highlight.width,
                  right: 0,
                  height: highlight.height,
                }}
                aria-hidden
              />
              <div
                className="pointer-events-auto absolute inset-x-0 bottom-0 z-[70]"
                style={{ top: highlight.top + highlight.height }}
                aria-hidden
              />
            </>
          ) : (
            <div className="pointer-events-auto absolute inset-0 z-[70]" aria-hidden />
          )}

          <svg className="pointer-events-none absolute inset-0 z-[71] h-full w-full">
            <defs>
              <mask id="legacy-tour-mask">
                <rect width="100%" height="100%" fill="white" />
                {highlight && (
                  <rect
                    x={highlight.left}
                    y={highlight.top}
                    width={highlight.width}
                    height={highlight.height}
                    rx={10}
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(3, 34, 82, 0.55)"
              mask="url(#legacy-tour-mask)"
            />
          </svg>

          {highlight && (
            <div
              aria-hidden
              className="pointer-events-none absolute z-[71] rounded-[10px] ring-2 ring-orange"
              style={{
                top: highlight.top,
                left: highlight.left,
                width: highlight.width,
                height: highlight.height,
              }}
            />
          )}

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="system-tour-title"
            className="pointer-events-auto absolute z-[72] rounded-xl bg-[#0b1f3a] text-white shadow-2xl ring-1 ring-white/10"
            style={tipPosition(highlight)}
          >
            <div className="flex items-center justify-between gap-3 px-4 pt-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-orange">
                Tour · {index + 1} / {TOUR_STEPS.length}
              </p>
              <button
                type="button"
                onClick={closeTour}
                className="text-sm font-semibold text-white/45 transition hover:text-white"
              >
                Skip
              </button>
            </div>

            <div className="px-4 pt-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                {step.roleLabel}
              </p>
              <h2
                id="system-tour-title"
                className="font-display mt-1 text-lg tracking-tight text-white"
              >
                {step.title}
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-white/65">{step.body}</p>
              {!highlight && (
                <p className="mt-2 text-xs text-orange/90">Opening…</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 px-4 py-3.5">
              <button
                type="button"
                disabled={isFirst}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                className="inline-flex min-h-9 items-center rounded-lg border border-white/20 px-3.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isLast) closeTour();
                  else setIndex((i) => Math.min(i + 1, TOUR_STEPS.length - 1));
                }}
                className="inline-flex min-h-9 items-center rounded-lg bg-orange px-4 text-sm font-bold text-ink transition hover:bg-orange-deep"
              >
                {isLast ? "Done" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SystemTourContext.Provider>
  );
}
