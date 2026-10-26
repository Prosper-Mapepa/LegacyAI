"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Signal = {
  id: string;
  label: string;
  finding: string;
};

type Bucket = {
  id: string;
  title: string;
  body: string;
  pct: number;
  /** Dollar amount when a full client report is available */
  amount?: number;
};

export type ClientReportView = {
  name: string;
  figures: { label: string; value: string }[];
  reasons?: string[];
  exposureLabel?: string;
  score?: number;
  status?: string;
};

const DEFAULT_SIGNALS: Signal[] = [
  {
    id: "spend",
    label: "Spending history",
    finding: "Five-year spend pattern sets the emergency buffer floor.",
  },
  {
    id: "cash",
    label: "Idle cash",
    finding: "Deposit balance flagged as put-to-work capacity.",
  },
  {
    id: "income",
    label: "Income & expenses",
    finding: "Net monthly cash flow shapes near-term Safe share.",
  },
  {
    id: "risk",
    label: "Risk profile",
    finding: "Risk band caps Growth so the plan stays reviewable.",
  },
  {
    id: "medical",
    label: "Medical needs",
    finding: "Only consented factors tilt liquidity — never raw notes.",
  },
  {
    id: "future",
    label: "Future plan",
    finding: "Stated goals keep Safe sized for the next 1–3 years.",
  },
];

const DEFAULT_BUCKETS: Bucket[] = [
  {
    id: "emergency",
    title: "Emergency",
    body: "Liquid buffer from monthly spending.",
    pct: 28,
  },
  {
    id: "safe",
    title: "Safe",
    body: "Near-term needs, low volatility.",
    pct: 37,
  },
  {
    id: "growth",
    title: "Growth",
    body: "Long-term compounding at stated risk.",
    pct: 35,
  },
];

type Phase = "boot" | "scan" | "reason" | "suggest" | "ready";

type AiDecisionFlowProps = {
  animate?: boolean;
  /** Desk / side panel layout */
  compact?: boolean;
  /** Stacked layout that fits inside the phone frame */
  phone?: boolean;
  className?: string;
  onComplete?: () => void;
  signals?: Signal[];
  buckets?: Bucket[];
  subject?: string;
  /** Client name + calculated figures shown in the full report */
  report?: ClientReportView | null;
  defaultCollapsed?: boolean;
  collapsible?: boolean;
};

const COLLAPSE_KEY = "legacyai.model.collapsed";

/**
 * Live AI console: scans signals, reasons, then surfaces a suggested split.
 */
export function AiDecisionFlow({
  animate = true,
  compact = false,
  phone = false,
  className,
  onComplete,
  signals = DEFAULT_SIGNALS,
  buckets = DEFAULT_BUCKETS,
  subject = "this record",
  report = null,
  defaultCollapsed = false,
  collapsible = !phone,
}: AiDecisionFlowProps) {
  /** Always open by default so the full pass is visible */
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [phase, setPhase] = useState<Phase>(animate ? "boot" : "ready");
  const [cursor, setCursor] = useState(animate ? 0 : signals.length);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!collapsible || phone || typeof window === "undefined") return;
    try {
      // Prefer expanded; only honor an explicit Collapse from this session
      const raw = window.sessionStorage.getItem(COLLAPSE_KEY);
      if (raw === "1") setCollapsed(true);
      else setCollapsed(false);
    } catch {
      /* ignore */
    }
  }, [collapsible, phone]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.sessionStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const statusLine = useMemo(() => {
    if (phase === "boot") return `Opening ${subject}…`;
    if (phase === "scan" && cursor < signals.length) {
      return `Reading ${signals[cursor].label.toLowerCase()}…`;
    }
    if (phase === "reason") return "Weighing tradeoffs across the six signals…";
    if (phase === "suggest") return "Drafting Emergency · Safe · Growth…";
    return "Suggestion ready — Advisor sets the final split.";
  }, [cursor, phase, signals, subject]);

  useEffect(() => {
    setTyped("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(statusLine.slice(0, i));
      if (i >= statusLine.length) window.clearInterval(id);
    }, 18);
    return () => window.clearInterval(id);
  }, [statusLine]);

  useEffect(() => {
    if (!animate) {
      setPhase("ready");
      setCursor(signals.length);
      return;
    }
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setPhase("scan"), 450));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [animate, signals.length]);

  useEffect(() => {
    if (!animate || phase !== "scan") return;
    if (cursor >= signals.length) {
      const t = window.setTimeout(() => setPhase("reason"), 350);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(
      () => setCursor((c) => c + 1),
      phone || compact ? 380 : 520,
    );
    return () => window.clearTimeout(t);
  }, [animate, compact, cursor, phase, phone, signals.length]);

  useEffect(() => {
    if (!animate) return;
    const timers: number[] = [];
    if (phase === "reason") {
      timers.push(window.setTimeout(() => setPhase("suggest"), 1100));
    } else if (phase === "suggest") {
      timers.push(window.setTimeout(() => setPhase("ready"), 900));
    } else if (phase === "ready") {
      timers.push(window.setTimeout(() => onComplete?.(), 200));
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [animate, onComplete, phase]);

  const showBuckets = phase === "suggest" || phase === "ready";
  const done = phase === "ready" || !animate;

  if (phone) {
    return (
      <PhoneAiPanel
        className={className}
        phase={phase}
        cursor={cursor}
        typed={typed}
        done={done}
        animate={animate}
        showBuckets={showBuckets}
        signals={signals}
        buckets={buckets}
      />
    );
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#b8d4e8] bg-white shadow-sm",
        compact ? "p-4" : "p-5 sm:p-6",
        className,
      )}
      aria-label="AI analysis for the Advisor"
      aria-live="polite"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse at 10% 0%, #e8f4fb 0%, transparent 50%), radial-gradient(ellipse at 90% 100%, #fff4eb 0%, transparent 45%)",
        }}
      />

      <header className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-blue">
            LegacyAI model
            {report?.name ? (
              <span className="text-muted"> · {report.name}</span>
            ) : null}
          </p>
          <h2
            className={cn(
              "font-display mt-1 tracking-tight text-navy",
              compact ? "text-xl" : "text-2xl sm:text-[1.75rem]",
            )}
          >
            {report?.name ? (
              <>
                Full report ·{" "}
                <span className="text-blue">{report.name}</span>
              </>
            ) : (
              <>
                Analyzed by AI.{" "}
                <span className="text-blue">Decided by you.</span>
              </>
            )}
          </h2>
          {collapsed && (
            <p className="mt-1 text-sm text-muted">
              {done
                ? "Suggestion ready — expand to review the split."
                : "Model is running — expand to watch the pass."}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {!collapsed && <PhasePills phase={phase} />}
          {collapsible && (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-expanded={!collapsed}
              className="inline-flex h-9 items-center rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink hover:bg-mist"
            >
              {collapsed ? "Expand" : "Collapse"}
            </button>
          )}
        </div>
      </header>

      {!collapsed && (
        <>
          {report && (
            <ClientFiguresPanel report={report} className="relative mt-4" />
          )}

          <div
            className={cn(
              "relative mt-4 overflow-hidden rounded-xl border border-navy/15 bg-navy text-white",
              compact ? "p-3.5" : "p-4 sm:p-5",
            )}
          >
            <ConsoleBody
              typed={typed}
              done={done}
              phase={phase}
              cursor={cursor}
              animate={animate}
              signals={signals}
            />
          </div>

          <BucketRow
            buckets={buckets}
            show={showBuckets}
            animate={animate}
            className="mt-4 grid gap-2 sm:grid-cols-3"
          />

          {report?.reasons && report.reasons.length > 0 && showBuckets && (
            <div className="relative mt-4 rounded-xl border border-line bg-white/80 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-blue">
                Model rationale
              </p>
              <ul className="mt-2 space-y-1.5">
                {report.reasons.map((reason) => (
                  <li
                    key={reason}
                    className="text-sm leading-6 text-ink before:mr-2 before:text-orange before:content-['•']"
                  >
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p
            className={cn(
              "relative mt-4 text-sm leading-6 text-muted",
              done && "font-semibold text-ink",
            )}
          >
            {done
              ? "Ready for your judgment — change any number before the customer sees it."
              : "AI is working. Final numbers stay with the Advisor."}
          </p>
        </>
      )}
    </section>
  );
}

function ClientFiguresPanel({
  report,
  className,
}: {
  report: ClientReportView;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-white/90 p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue">
            Calculated figures
          </p>
          <p className="font-display mt-1 text-xl text-navy sm:text-2xl">
            {report.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {report.score != null && (
            <span className="rounded-lg bg-navy px-2.5 py-1 font-bold text-white">
              Priority {report.score}
            </span>
          )}
          {report.exposureLabel && (
            <span className="rounded-lg bg-blue-soft px-2.5 py-1 font-semibold text-blue">
              Exposure {report.exposureLabel}
            </span>
          )}
          {report.status && (
            <span className="rounded-lg border border-line px-2.5 py-1 font-semibold text-ink">
              {report.status}
            </span>
          )}
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {report.figures.map((fig) => (
          <div key={fig.label} className="min-w-0">
            <dt className="text-xs text-muted">{fig.label}</dt>
            <dd className="mt-0.5 truncate text-base font-bold text-ink">
              {fig.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PhoneAiPanel({
  className,
  phase,
  cursor,
  typed,
  done,
  animate,
  showBuckets,
  signals,
  buckets,
}: {
  className?: string;
  phase: Phase;
  cursor: number;
  typed: string;
  done: boolean;
  animate: boolean;
  showBuckets: boolean;
  signals: Signal[];
  buckets: Bucket[];
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#f7f9fc]",
        className,
      )}
      aria-label="AI analysis"
      aria-live="polite"
    >
      <div className="shrink-0 border-b border-line bg-white px-3 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-blue">
          LegacyAI model
        </p>
        <h2 className="font-display mt-0.5 text-lg leading-snug tracking-tight text-navy">
          Analyzed by AI.{" "}
          <span className="text-blue">Decided by you.</span>
        </h2>
        <PhasePills phase={phase} className="mt-2" />
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3">
        <div className="overflow-hidden rounded-xl bg-navy p-3 text-white">
          <ConsoleBody
            typed={typed}
            done={done}
            phase={phase}
            cursor={cursor}
            animate={animate}
            signals={signals}
          />
        </div>

        <BucketRow
          buckets={buckets}
          show={showBuckets}
          animate={animate}
          className="grid grid-cols-3 gap-1.5"
          phone
        />

        <p
          className={cn(
            "text-xs leading-5 text-muted",
            done && "font-semibold text-ink",
          )}
        >
          {done
            ? "Suggestion ready. Open the full plan to review the split."
            : "AI is working inside your intake…"}
        </p>
      </div>
    </div>
  );
}

function ConsoleBody({
  typed,
  done,
  phase,
  cursor,
  animate,
  signals,
}: {
  typed: string;
  done: boolean;
  phase: Phase;
  cursor: number;
  animate: boolean;
  signals: Signal[];
}) {
  return (
    <>
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange",
            !done && "ai-live-dot",
          )}
          aria-hidden
        />
        <p className="min-w-0 break-words font-mono text-xs leading-5 text-white/90 sm:text-sm">
          <span className="text-orange">ai</span>
          <span className="text-white/40"> › </span>
          {typed}
          {!done && <span className="ai-caret ml-0.5 inline-block">▍</span>}
        </p>
      </div>

      <ul className="mt-3 grid gap-1.5">
        {signals.map((signal, i) => {
          const active = phase === "scan" && i === cursor;
          const complete =
            i < cursor ||
            phase === "reason" ||
            phase === "suggest" ||
            phase === "ready";
          const visible = complete || active || !animate;
          if (!visible && animate) return null;
          return (
            <li
              key={signal.id}
              className={cn(
                "flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs transition-all duration-300 sm:text-sm",
                active && "bg-white/10",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded text-[10px] font-bold",
                  complete
                    ? "bg-orange text-ink"
                    : active
                      ? "border border-orange/60 text-orange"
                      : "bg-white/10 text-white/40",
                )}
              >
                {complete ? "✓" : active ? "…" : "·"}
              </span>
              <span className="min-w-0">
                <span className="font-semibold text-white">{signal.label}</span>
                {(complete || !animate) && (
                  <span className="mt-0.5 block text-[11px] leading-4 text-white/65">
                    {signal.finding}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      {(phase === "reason" || phase === "suggest" || phase === "ready") && (
        <p
          className={cn(
            "mt-3 border-t border-white/10 pt-3 text-[11px] leading-5 text-white/80 sm:text-sm sm:leading-6",
            phase === "reason" && "ai-reason-pulse",
          )}
        >
          {phase === "reason"
            ? "Cross-checking liquidity vs. risk, then sizing Safe…"
            : "Model proposes a split. You adjust. Nothing moves without both."}
        </p>
      )}
    </>
  );
}

function BucketRow({
  buckets,
  show,
  animate,
  className,
  phone,
}: {
  buckets: Bucket[];
  show: boolean;
  animate: boolean;
  className?: string;
  phone?: boolean;
}) {
  return (
    <div
      className={cn(
        "transition-all duration-500",
        show ? "opacity-100 translate-y-0" : "opacity-35 translate-y-1",
        className,
      )}
    >
      {buckets.map((bucket, i) => (
        <div
          key={bucket.id}
          className={cn(
            "rounded-xl border border-line bg-white",
            phone ? "p-2" : "p-3.5",
          )}
          style={{ transitionDelay: show ? `${i * 100}ms` : "0ms" }}
        >
          <div className="flex items-baseline justify-between gap-1">
            <p
              className={cn(
                "font-display font-bold text-navy",
                phone ? "text-xs" : "text-base",
              )}
            >
              {bucket.title}
            </p>
            <p
              className={cn(
                "font-bold text-blue",
                phone ? "text-xs" : "text-sm",
              )}
            >
              {show || !animate ? `${bucket.pct}%` : "—"}
            </p>
          </div>
          {bucket.amount != null && (show || !animate) && !phone && (
            <p className="mt-0.5 text-sm font-semibold text-ink">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }).format(bucket.amount)}
            </p>
          )}
          <div className={cn("overflow-hidden rounded-full bg-mist", phone ? "mt-1.5 h-1" : "mt-2 h-1.5")}>
            <div
              className="h-full rounded-full bg-orange transition-[width] duration-700 ease-out"
              style={{
                width: show || !animate ? `${bucket.pct}%` : "0%",
                transitionDelay: show ? `${150 + i * 120}ms` : "0ms",
              }}
            />
          </div>
          {!phone && (
            <p className="mt-2 text-xs leading-5 text-muted">{bucket.body}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function PhasePills({
  phase,
  className,
}: {
  phase: Phase;
  className?: string;
}) {
  const steps: { id: Phase; label: string }[] = [
    { id: "scan", label: "Scan" },
    { id: "reason", label: "Reason" },
    { id: "suggest", label: "Suggest" },
    { id: "ready", label: "Ready" },
  ];
  const order: Phase[] = ["boot", "scan", "reason", "suggest", "ready"];
  const current = order.indexOf(phase);

  return (
    <ol
      className={cn("flex flex-wrap gap-1", className)}
      aria-label="AI stages"
    >
      {steps.map((step) => {
        const idx = order.indexOf(step.id);
        const active =
          phase === step.id || (phase === "boot" && step.id === "scan");
        const done = current > idx;
        return (
          <li
            key={step.id}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              active && "bg-orange text-ink",
              done && !active && "bg-blue-soft text-blue",
              !active && !done && "bg-mist text-faint",
            )}
          >
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}
