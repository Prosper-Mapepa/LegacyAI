"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  demoStepById,
  domainRoleForTab,
  hubStep,
  isIntakeUnlocked,
  isOutreachUnlocked,
  matchDemoStep,
  outreachStep,
  personMatchesStepRole,
  roleSwitchHref,
  type DemoStep,
  type DemoStepId,
} from "@/lib/demo-flow";
import { usePerson } from "@/domain/accounts";
import { useLegacy } from "@/domain/store";
import { FEATURED_HEIR_ID } from "@/data/story";
import { useDemoStore } from "@/store/demo-store";

const SEEN_KEY = "legacyai.briefings.v3";

type BriefingContextValue = {
  requestStep: (href: string, stepId?: DemoStepId) => void;
  showHelp: (stepId?: DemoStepId) => void;
  hideHelp: () => void;
  helpOpen: boolean;
  allowPromptOpen: boolean;
  showAllowPrompt: () => void;
  hideAllowPrompt: () => void;
  notifyPromptOpen: boolean;
  showNotifyPrompt: () => void;
  hideNotifyPrompt: () => void;
};

const BriefingContext = createContext<BriefingContextValue | null>(null);

function readSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.sessionStorage.getItem(SEEN_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(list) ? list : []);
  } catch {
    return new Set();
  }
}

function writeSeen(seen: Set<string>) {
  window.sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
}

export function StepBriefingProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const person = usePerson();
  const { state } = useLegacy();
  const customers = useDemoStore((s) => s.customers);
  const [pending, setPending] = useState<DemoStep | null>(null);
  const [allowPrompt, setAllowPrompt] = useState(false);
  const [notifyPrompt, setNotifyPrompt] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(() => new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSeen(readSeen());
    setReady(true);
  }, []);

  const markSeen = useCallback((id: string) => {
    setSeen((prev) => {
      const next = new Set(prev);
      next.add(id);
      writeSeen(next);
      return next;
    });
  }, []);

  const showHelp = useCallback(
    (stepId?: DemoStepId) => {
      setAllowPrompt(false);
      setNotifyPrompt(false);
      const step = stepId ? demoStepById(stepId) : matchDemoStep(path);
      setPending({ ...step, href: step.href });
    },
    [path],
  );

  const hideHelp = useCallback(() => {
    if (pending) markSeen(pending.id);
    setPending(null);
  }, [markSeen, pending]);

  const showAllowPrompt = useCallback(() => {
    setPending(null);
    setNotifyPrompt(false);
    setAllowPrompt(true);
  }, []);

  const hideAllowPrompt = useCallback(() => setAllowPrompt(false), []);

  const showNotifyPrompt = useCallback(() => {
    setPending(null);
    setAllowPrompt(false);
    setNotifyPrompt(true);
  }, []);

  const hideNotifyPrompt = useCallback(() => setNotifyPrompt(false), []);

  const requestStep = useCallback(
    (href: string, stepId?: DemoStepId) => {
      const step = stepId ? demoStepById(stepId) : matchDemoStep(href);
      const target = href || step.href;
      const requiredRole = domainRoleForTab(step.role);

      if (step.id === "outreach" && !isOutreachUnlocked(state.households)) {
        const onHub = path.startsWith("/hub");
        if (onHub) {
          setAllowPrompt(true);
          return;
        }
        const hub = hubStep();
        router.push(hub.href);
        window.setTimeout(() => setAllowPrompt(true), 200);
        return;
      }

      if (
        (step.id === "intake" || step.id === "plan") &&
        !isIntakeUnlocked(customers)
      ) {
        const onRm = path.startsWith("/rm");
        if (onRm) {
          setNotifyPrompt(true);
          return;
        }
        const outreach = outreachStep();
        router.push(outreach.href);
        window.setTimeout(() => setNotifyPrompt(true), 200);
        return;
      }

      // Step needs a different seat → sign in as that role first
      if (person && person.role !== requiredRole) {
        setAllowPrompt(false);
        setNotifyPrompt(false);
        setPending(null);
        router.push(roleSwitchHref({ ...step, href: target }, target));
        return;
      }

      // Navigate first — briefing opens on the destination step via path effect
      setAllowPrompt(false);
      setNotifyPrompt(false);
      setPending(null);
      router.push(target);
    },
    [customers, path, person, router, state.households],
  );

  useEffect(() => {
    if (!ready || !person) return;
    if (path === "/" || path.startsWith("/sign-") || path.startsWith("/switch-role")) {
      setPending(null);
      return;
    }
    const step = matchDemoStep(path);
    if (!personMatchesStepRole(person.role, step.role)) return;
    // No auto “What’s happening” modals — open via Guide when needed
    if (seen.has(step.id)) {
      setPending((current) =>
        current?.id === step.id ? null : current,
      );
    }
  }, [path, person, ready, seen]);

  const confirm = useCallback(() => {
    if (!pending) return;
    markSeen(pending.id);
    setPending(null);
  }, [markSeen, pending]);

  const focusAllowCall = useCallback(() => {
    setAllowPrompt(false);
    const hub = hubStep();
    if (!path.startsWith("/hub")) {
      router.push(`${hub.href}#allow-call-${FEATURED_HEIR_ID}`);
      return;
    }
    const el = document.getElementById(`allow-call-${FEATURED_HEIR_ID}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
  }, [path, router]);

  const value = useMemo(
    () => ({
      requestStep,
      showHelp,
      hideHelp,
      helpOpen: Boolean(pending),
      allowPromptOpen: allowPrompt,
      showAllowPrompt,
      hideAllowPrompt,
      notifyPromptOpen: notifyPrompt,
      showNotifyPrompt,
      hideNotifyPrompt,
    }),
    [
      requestStep,
      showHelp,
      hideHelp,
      pending,
      allowPrompt,
      showAllowPrompt,
      hideAllowPrompt,
      notifyPrompt,
      showNotifyPrompt,
      hideNotifyPrompt,
    ],
  );

  return (
    <BriefingContext.Provider value={value}>
      {children}
      {pending && person ? (
        <BriefingModal step={pending} onStart={confirm} onHide={hideHelp} />
      ) : null}
      {allowPrompt ? (
        <AllowCallPrompt
          invited={Boolean(
            state.households
              .flatMap((h) => h.heirs)
              .find((h) => h.id === FEATURED_HEIR_ID)?.invited,
          )}
          onClose={hideAllowPrompt}
          onShowButton={focusAllowCall}
        />
      ) : null}
      {notifyPrompt ? (
        <NotifyPrompt
          onClose={hideNotifyPrompt}
          onGoOutreach={() => {
            setNotifyPrompt(false);
            router.push(outreachStep().href);
          }}
        />
      ) : null}
    </BriefingContext.Provider>
  );
}

export function useStepBriefing() {
  const ctx = useContext(BriefingContext);
  if (!ctx) {
    return {
      requestStep: (href: string) => {
        if (typeof window !== "undefined") window.location.assign(href);
      },
      showHelp: () => {},
      hideHelp: () => {},
      helpOpen: false,
      allowPromptOpen: false,
      showAllowPrompt: () => {},
      hideAllowPrompt: () => {},
      notifyPromptOpen: false,
      showNotifyPrompt: () => {},
      hideNotifyPrompt: () => {},
    };
  }
  return ctx;
}

function NotifyPrompt({
  onClose,
  onGoOutreach,
}: {
  onClose: () => void;
  onGoOutreach: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/55 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notify-prompt-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-7">
        <p className="text-sm font-bold text-orange">Intake is locked</p>
        <h2
          id="notify-prompt-title"
          className="font-display mt-2 text-2xl tracking-tight text-ink"
        >
          Send notification first
        </h2>
        <p className="mt-3 text-base leading-7 text-muted">
          Approve outreach for Heir Whitfield, then tap{" "}
          <strong className="text-ink">Send notification</strong>. Intake opens
          only after that invite goes out.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-4 text-sm font-semibold text-ink hover:bg-mist"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onGoOutreach}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-orange px-5 text-sm font-bold text-ink hover:bg-orange-deep"
          >
            Go to Outreach →
          </button>
        </div>
      </div>
    </div>
  );
}

function AllowCallPrompt({
  invited,
  onClose,
  onShowButton,
}: {
  invited: boolean;
  onClose: () => void;
  onShowButton: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/55 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="allow-call-prompt-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-7">
        <p className="text-sm font-bold text-orange">Outreach is locked</p>
        <h2
          id="allow-call-prompt-title"
          className="font-display mt-2 text-2xl tracking-tight text-ink"
        >
          Allow a call first
        </h2>
        <p className="mt-3 text-base leading-7 text-muted">
          {invited ? (
            <>
              Heir is invited. Tap{" "}
              <strong className="text-ink">Allow call</strong> on Heir&apos;s card —
              that is the Principal approval Outreach needs.
            </>
          ) : (
            <>
              Invite Heir first, then tap{" "}
              <strong className="text-ink">Allow call</strong> on Heir&apos;s card.
              Outreach stays locked until that approval.
            </>
          )}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-4 text-sm font-semibold text-ink hover:bg-mist"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onShowButton}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-orange px-5 text-sm font-bold text-ink hover:bg-orange-deep"
          >
            {invited ? "Show Allow call →" : "Go to Hub →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BriefingModal({
  step,
  onStart,
  onHide,
}: {
  step: DemoStep;
  onStart: () => void;
  onHide: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/55 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="step-briefing-title"
    >
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-blue">
              Step {step.n} · {step.label}
            </p>
            <p className="mt-1 inline-flex rounded-full bg-orange-soft px-2.5 py-0.5 text-sm font-bold text-ink">
              {step.role}
            </p>
          </div>
          <button
            type="button"
            onClick={onHide}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-muted hover:bg-mist hover:text-ink"
          >
            Hide
          </button>
        </div>

        <h2
          id="step-briefing-title"
          className="font-display mt-4 text-2xl tracking-tight text-ink sm:text-3xl"
        >
          What&apos;s happening
        </h2>
        <p className="mt-3 text-base font-semibold text-blue">{step.briefing.youAre}</p>
        <p className="mt-2 text-base leading-7 text-muted">{step.briefing.why}</p>

        <ol className="mt-5 grid gap-2">
          {step.briefing.doThis.map((item, index) => (
            <li
              key={item}
              className="flex gap-3 rounded-xl bg-mist px-3.5 py-3 text-base leading-6 text-ink"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-white">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={onStart}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-orange px-6 text-base font-bold text-ink hover:bg-orange-deep"
        >
          Got it — continue →
        </button>
      </div>
    </div>
  );
}

export function StepLink({
  href,
  stepId,
  className,
  children,
  ...rest
}: {
  href: string;
  stepId?: DemoStepId;
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick">) {
  const { requestStep } = useStepBriefing();
  return (
    <button
      type="button"
      className={className}
      onClick={() => requestStep(href, stepId)}
      {...rest}
    >
      {children}
    </button>
  );
}
