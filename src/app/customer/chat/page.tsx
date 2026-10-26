"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PhoneFrame } from "@/components/phone-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFeaturedCustomer } from "@/data/mock";
import {
  assessEmergencyExposure,
  mapConditionsText,
  recommendAllocation,
} from "@/lib/ai";
import type { Habit, PlannedLoan, ContactMethod } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";
import { useIsMobileLg } from "@/hooks/use-media-query";
import {
  MOBILE_HEADER_OFFSET,
  useVisualViewportHeight,
} from "@/hooks/use-visual-viewport";
import { useDemoStore } from "@/store/demo-store";
import {
  INTAKE_FINISH_LOADER,
  ProcessLoader,
} from "@/components/process-loader";
import { AiDecisionFlow } from "@/components/ai-decision-flow";
import { IntakeGate } from "@/components/intake-gate";
import {
  INTAKE_PHONE_CLASS,
  IntakeChecklist,
  IntakeStage,
} from "@/components/intake-stage";
import { FAMILY_LAST_NAME } from "@/data/story";

type StepId =
  | "lastname"
  | "age"
  | "salary"
  | "expenses"
  | "household"
  | "fund"
  | "loans"
  | "consent"
  | "medication"
  | "habits"
  | "conditions"
  | "contact"
  | "time"
  | "done";

interface ChatMessage {
  id: string;
  from: "bot" | "user";
  text: string;
}

const LOANS: { value: PlannedLoan; label: string }[] = [
  { value: "car", label: "Car" },
  { value: "personal", label: "Personal" },
  { value: "property", label: "Property" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
];

const HABITS: { value: Habit; label: string }[] = [
  { value: "smoking", label: "Smoking" },
  { value: "heavy_alcohol", label: "Heavy alcohol" },
  { value: "sedentary", label: "Sedentary" },
  { value: "poor_sleep", label: "Poor sleep" },
  { value: "other", label: "Other" },
];

const STEPS: StepId[] = [
  "lastname",
  "age",
  "salary",
  "expenses",
  "household",
  "fund",
  "loans",
  "consent",
  "medication",
  "habits",
  "conditions",
  "contact",
  "time",
  "done",
];

const TIME_PERIODS = ["Morning", "Afternoon", "Evening"] as const;
type TimePeriod = (typeof TIME_PERIODS)[number];

const TIMES_BY_PERIOD: Record<TimePeriod, string[]> = {
  Morning: ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM"],
  Afternoon: ["12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"],
  Evening: ["5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"],
};

const TIMEZONES = [
  { id: "ET", label: "Eastern (ET)" },
  { id: "CT", label: "Central (CT)" },
  { id: "MT", label: "Mountain (MT)" },
  { id: "PT", label: "Pacific (PT)" },
] as const;

/** Parse birthday text into age; falls back to defaultAge if unparseable. */
function ageFromBirthday(raw: string, defaultAge: number): number {
  const trimmed = raw.trim();
  if (!trimmed) return defaultAge;

  // Plain age still accepted
  if (/^\d{1,3}$/.test(trimmed)) {
    const n = Number(trimmed);
    return n > 0 && n < 120 ? n : defaultAge;
  }

  const normalized = trimmed.replace(/[.]/g, "/").replace(/-/g, "/");
  const parts = normalized.split("/").map((p) => p.trim());
  let year: number | null = null;
  let month: number | null = null;
  let day: number | null = null;

  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number);
    if (a > 31) {
      year = a;
      month = b;
      day = c;
    } else if (c > 31) {
      month = a;
      day = b;
      year = c;
    }
  }

  if (year == null || month == null || day == null) {
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) {
      const birth = new Date(parsed);
      year = birth.getFullYear();
      month = birth.getMonth() + 1;
      day = birth.getDate();
    }
  }

  if (year == null || month == null || day == null) return defaultAge;
  if (year < 1900 || year > new Date().getFullYear()) return defaultAge;

  const today = new Date();
  let age = today.getFullYear() - year;
  const hadBirthday =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!hadBirthday) age -= 1;
  return age > 0 && age < 120 ? age : defaultAge;
}

function promptFor(step: StepId, lastName: string): string {
  switch (step) {
    case "lastname":
      return `Welcome to LegacyAI. To confirm it's you, what's your last name?`;
    case "age":
      return `Thanks, ${lastName}. What's your birthday?`;
    case "salary":
      return "What's your monthly income (before tax)?";
    case "expenses":
      return "About how much do you spend each month?";
    case "household":
      return "How many family members live at home (including you)?";
    case "fund":
      return "What total fund should we plan with? (Default $100,000)";
    case "loans":
      return "Any planned loans or big expenses? Select all that apply, or skip.";
    case "consent":
      return "Share optional details to personalize your emergency buffer. Skip anything you prefer — no penalty to the plan.";
    case "medication":
      return "Monthly medication expense? (optional — you can skip)";
    case "habits":
      return "Any lifestyle factors to consider? (optional chips — or skip)";
    case "conditions":
      return "Current diseases (if any)? Free text is mapped locally and discarded. Or skip.";
    case "contact":
      return "Preferred contact method?";
    case "time":
      return "When should your RM reach you? Pick a time and timezone.";
    case "done":
      return "Thanks, your relationship manager will reach out.";
  }
}

function thinkingActionsFor(nextStep: StepId | undefined): string[] {
  switch (nextStep) {
    case "age":
      return ["Verifying identity", "Opening your profile", "Thinking"];
    case "salary":
    case "expenses":
    case "household":
    case "fund":
      return ["Saving your answer", "Updating intake", "Thinking"];
    case "loans":
      return ["Reviewing cash flow", "Thinking"];
    case "consent":
      return ["Noting planned expenses", "Thinking"];
    case "medication":
    case "habits":
    case "conditions":
      return ["Personalizing buffer", "Thinking"];
    case "contact":
      return ["Wrapping optional details", "Thinking"];
    case "time":
      return ["Saving preference", "Thinking"];
    case "done":
      return [
        "Analyzing your answers",
        "Assessing emergency exposure",
        "Building Liquidity · Safe · Growth",
        "Almost ready",
      ];
    default:
      return ["Thinking", "Preparing next question"];
  }
}

function ThinkingBubble({ label }: { label: string }) {
  return (
    <div
      className="flex max-w-[90%] items-center gap-3 rounded-2xl border border-pnc-border bg-white px-3.5 py-3 text-sm text-pnc-slate shadow-sm"
      aria-live="polite"
      aria-label={label}
    >
      <span className="process-spinner shrink-0 !h-5 !w-5 !border-2" aria-hidden />
      <div className="min-w-0">
        <p className="font-semibold text-pnc-navy">{label}</p>
        <p className="mt-0.5 text-xs text-pnc-slate">LegacyAI is working on your answer…</p>
      </div>
    </div>
  );
}

export default function CustomerChatPage() {
  const featured = getFeaturedCustomer();
  const updateIntake = useDemoStore((s) => s.updateIntake);
  const completeIntake = useDemoStore((s) => s.completeIntake);
  const intake = useDemoStore((s) => s.intake);
  const planSnapshot = useDemoStore((s) => s.planSnapshot);

  const [stepIndex, setStepIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m0",
      from: "bot",
      text: promptFor("lastname", featured.lastName),
    },
  ]);
  const [text, setText] = useState("");
  const [selectedLoans, setSelectedLoans] = useState<PlannedLoan[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<Habit[]>([]);
  const [localAnswers, setLocalAnswers] = useState({
    age: featured.age,
    monthlySalary: featured.monthlySalary,
    monthlyExpenses: featured.monthlyExpenses,
    householdMembers: featured.householdMembers,
    totalFund: 100_000,
    plannedLoans: [] as PlannedLoan[],
    healthConsentGiven: false,
    medicationMonthlyExpense: undefined as number | undefined,
    habits: [] as Habit[],
    conditionsText: undefined as string | undefined,
    preferredContact: undefined as ContactMethod | undefined,
    preferredTime: undefined as string | undefined,
  });
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("Morning");
  const [timeZone, setTimeZone] = useState<(typeof TIMEZONES)[number]["id"]>("ET");
  const [planPreview, setPlanPreview] = useState<{
    label: string;
    liquidity: number;
    safe: number;
    growth: number;
  } | null>(null);
  const [unclassified, setUnclassified] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingLabel, setThinkingLabel] = useState("Thinking");
  const [finishLoader, setFinishLoader] = useState(false);
  const [showPhoneAi, setShowPhoneAi] = useState(false);
  const [aiBuckets, setAiBuckets] = useState<
    { id: string; title: string; body: string; pct: number }[] | null
  >(null);
  const [pendingFinish, setPendingFinish] = useState<typeof localAnswers | null>(
    null,
  );
  const messagesRef = useRef<HTMLDivElement>(null);
  const thinkingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thinkingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const chatHeight = useVisualViewportHeight(MOBILE_HEADER_OFFSET);
  const isMobile = useIsMobileLg();

  const step = STEPS[stepIndex];

  function clearThinkingTimers() {
    if (thinkingTimeoutRef.current) {
      clearTimeout(thinkingTimeoutRef.current);
      thinkingTimeoutRef.current = null;
    }
    if (thinkingIntervalRef.current) {
      clearInterval(thinkingIntervalRef.current);
      thinkingIntervalRef.current = null;
    }
  }

  function replyWithThinking(
    then: () => void,
    actions: string[],
    delayMs = 1000
  ) {
    clearThinkingTimers();
    setIsThinking(true);
    setThinkingLabel(actions[0] ?? "Thinking");
    let i = 0;
    if (actions.length > 1) {
      thinkingIntervalRef.current = setInterval(() => {
        i = (i + 1) % actions.length;
        setThinkingLabel(actions[i] ?? "Thinking");
      }, 700);
    }
    thinkingTimeoutRef.current = setTimeout(() => {
      clearThinkingTimers();
      setIsThinking(false);
      then();
    }, delayMs);
  }

  // Scroll only inside the chat pane — never the page (avoids jump on mobile keyboard).
  useEffect(() => {
    const pane = messagesRef.current;
    if (!pane) return;
    pane.scrollTop = pane.scrollHeight;
  }, [messages, stepIndex, chatHeight, isThinking, thinkingLabel]);

  useEffect(() => () => clearThinkingTimers(), []);

  // Lock page scroll on mobile while the fixed chat shell is showing.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    function apply() {
      const on = mq.matches;
      document.documentElement.classList.toggle("chat-mobile-lock", on);
      document.body.classList.toggle("chat-mobile-lock", on);
      if (on) window.scrollTo(0, 0);
    }
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      document.documentElement.classList.remove("chat-mobile-lock");
      document.body.classList.remove("chat-mobile-lock");
    };
  }, []);

  function push(from: "bot" | "user", msg: string) {
    setMessages((m) => [
      ...m,
      { id: `m${m.length}-${Date.now()}`, from, text: msg },
    ]);
  }

  function advance(nextIndex: number, nextLocal = localAnswers) {
    const nextStep = STEPS[nextIndex];
    const actions = thinkingActionsFor(nextStep);
    const delayMs =
      nextStep === "done"
        ? 2200
        : 850 + Math.floor(Math.random() * 450);

    replyWithThinking(
      () => {
        setStepIndex(nextIndex);
        if (nextStep === "done") {
          setPendingFinish(nextLocal);
          setFinishLoader(true);
        } else if (nextStep) {
          push("bot", promptFor(nextStep, featured.lastName));
        }
      },
      actions,
      delayMs
    );
  }

  function finish(answers = localAnswers) {
    updateIntake({
      lastNameConfirmed: true,
      age: answers.age,
      monthlySalary: answers.monthlySalary,
      monthlyExpenses: answers.monthlyExpenses,
      householdMembers: answers.householdMembers,
      totalFund: answers.totalFund,
      plannedLoans: answers.plannedLoans,
      healthConsentGiven: answers.healthConsentGiven,
      medicationMonthlyExpense: answers.medicationMonthlyExpense,
      habits: answers.habits,
      conditionsText: answers.conditionsText,
      preferredContact: answers.preferredContact,
      preferredTime: answers.preferredTime,
      completed: true,
    });

    const input = {
      totalFund: answers.totalFund,
      age: answers.age,
      monthlySalary: answers.monthlySalary,
      monthlyExpenses: answers.monthlyExpenses,
      householdMembers: answers.householdMembers,
      plannedLoans: answers.plannedLoans,
      medicationMonthlyExpense: answers.healthConsentGiven
        ? answers.medicationMonthlyExpense
        : undefined,
      habits: answers.healthConsentGiven ? answers.habits : undefined,
      conditionsText: answers.healthConsentGiven
        ? answers.conditionsText
        : undefined,
    };
    const exposure = assessEmergencyExposure(input);
    const alloc = recommendAllocation(input, exposure);
    const preview = {
      label: exposure.label,
      liquidity: alloc.liquidity,
      safe: alloc.safe,
      growth: alloc.growth,
    };
    setPlanPreview(preview);
    if (answers.conditionsText) {
      setUnclassified(mapConditionsText(answers.conditionsText).unclassified);
    }
    completeIntake();
    push("bot", "Thanks, your relationship manager will reach out.");
    return preview;
  }

  function submitText() {
    if (isThinking) return;
    const value = text.trim();
    if (!value && step !== "conditions" && step !== "medication") return;
    push("user", value || "(skipped)");
    setText("");

    const next = { ...localAnswers };

    switch (step) {
      case "lastname": {
        if (value.toLowerCase() !== featured.lastName.toLowerCase()) {
          replyWithThinking(
            () => {
              push(
                "bot",
                `Hmm, that doesn't match our records. Try again (hint: ${featured.lastName}).`
              );
            },
            ["Checking identity", "Looking up your profile", "Thinking"],
            1100
          );
          return;
        }
        updateIntake({ lastNameConfirmed: true });
        advance(stepIndex + 1, next);
        return;
      }
      case "age":
        next.age = ageFromBirthday(value, featured.age);
        break;
      case "salary":
        next.monthlySalary =
          Number(value.replace(/[,$]/g, "")) || featured.monthlySalary;
        break;
      case "expenses":
        next.monthlyExpenses =
          Number(value.replace(/[,$]/g, "")) || featured.monthlyExpenses;
        break;
      case "household":
        next.householdMembers = Number(value) || 1;
        break;
      case "fund":
        next.totalFund = Number(value.replace(/[,$]/g, "")) || 100_000;
        break;
      case "medication":
        if (value) next.medicationMonthlyExpense = Number(value.replace(/[,$]/g, ""));
        break;
      case "conditions":
        if (value) next.conditionsText = value;
        break;
      default:
        break;
    }

    setLocalAnswers(next);
    updateIntake(next);
    advance(stepIndex + 1, next);
  }

  function skipSensitive() {
    if (isThinking) return;
    push("user", "Skip");
    advance(stepIndex + 1);
  }

  if (intake.completed && planSnapshot && step !== "done" && !planPreview) {
    // Already completed in prior session
  }

  const confirmed = stepIndex > 0;
  const answering = stepIndex > 0 && step !== "done";
  const finished = step === "done";

  const phoneBusy = finishLoader || showPhoneAi;

  return (
    <IntakeGate>
      <IntakeStage
        title="Intake chat"
        body="One question at a time in the phone. When you finish, continue with Next: Plan."
        ariaLabel="Intake chat"
        nextHref="/customer/plan"
        nextStepId="plan"
        nextLabel="Next: Plan →"
        nextDisabled={!intake.completed || phoneBusy}
        nextDisabledHint="Finish the intake questions in the phone first"
        aside={
          <>
            <IntakeChecklist
              items={[
                {
                  n: 1,
                  label: "Confirm last name",
                  done: confirmed,
                  active: step === "lastname",
                },
                {
                  n: 2,
                  label: "Answer intake questions",
                  done: finished,
                  active: answering,
                },
                {
                  n: 3,
                  label: "Review draft plan",
                  done: Boolean(planPreview) && !phoneBusy,
                  active: phoneBusy || (finished && !planPreview),
                },
              ]}
            />
            <p className="mt-4 text-sm text-white/70">
              Last name:{" "}
              <strong className="text-white">{FAMILY_LAST_NAME}</strong>
            </p>
          </>
        }
        phone={
        <div
          className={cn(!isMobile && "contents")}
          style={
            isMobile && chatHeight != null
              ? { height: chatHeight, maxHeight: chatHeight }
              : undefined
          }
        >
        <PhoneFrame
          title={
            finishLoader
              ? "Building plan"
              : showPhoneAi
                ? "AI analysis"
                : "LegacyAI Chat"
          }
          className={cn(
            isMobile ? "h-full max-w-none" : INTAKE_PHONE_CLASS,
          )}
          fillHeight
          chrome={!isMobile}
        >
          {finishLoader ? (
            <div className="flex h-full min-h-0 flex-1 flex-col justify-center overflow-y-auto bg-[#f7f9fc] p-3">
              <ProcessLoader
                variant="card"
                title="Turning answers into a plan"
                stages={INTAKE_FINISH_LOADER}
                stageMs={850}
                className="max-w-none border-0 p-3 shadow-none sm:p-3"
                onDone={() => {
                  const preview = pendingFinish
                    ? finish(pendingFinish)
                    : planPreview;
                  setPendingFinish(null);
                  if (preview) {
                    setAiBuckets([
                      {
                        id: "emergency",
                        title: "Emergency",
                        body: "",
                        pct: preview.liquidity,
                      },
                      {
                        id: "safe",
                        title: "Safe",
                        body: "",
                        pct: preview.safe,
                      },
                      {
                        id: "growth",
                        title: "Growth",
                        body: "",
                        pct: preview.growth,
                      },
                    ]);
                  }
                  setFinishLoader(false);
                  setShowPhoneAi(true);
                }}
              />
            </div>
          ) : showPhoneAi ? (
            <AiDecisionFlow
              phone
              animate
              subject="your intake"
              buckets={aiBuckets ?? undefined}
              onComplete={() => setShowPhoneAi(false)}
            />
          ) : (
          <div className="flex h-full min-h-0 flex-1 flex-col">
            <div
              ref={messagesRef}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                    m.from === "bot"
                      ? "bg-white text-pnc-navy shadow-sm"
                      : "ml-auto bg-pnc-blue text-white"
                  )}
                >
                  {m.text}
                </div>
              ))}

              {isThinking && <ThinkingBubble label={thinkingLabel} />}

              {step === "done" && planPreview && (
                <div className="rounded-xl border border-pnc-border bg-white p-3 text-sm shadow-sm">
                  <p className="font-semibold text-pnc-navy">
                    Your Plan Preview
                  </p>
                  <p className="mt-1 text-pnc-slate">
                    Emergency exposure:{" "}
                    <span className="font-semibold text-pnc-navy">
                      {planPreview.label}
                    </span>
                  </p>
                  <ul className="mt-2 space-y-1 text-pnc-navy">
                    <li>Liquidity {planPreview.liquidity}%</li>
                    <li>Safe Investment {planPreview.safe}%</li>
                    <li>Growth {planPreview.growth}%</li>
                  </ul>
                  {unclassified && (
                    <p className="mt-2 text-xs text-pnc-warning">
                      We couldn&apos;t classify this; an advisor can refine it.
                    </p>
                  )}
                  <Button asChild size="sm" className="mt-3 w-full">
                    <Link href="/customer/plan">Open full plan</Link>
                  </Button>
                </div>
              )}
            </div>

            <div
              className={cn(
                "mt-auto shrink-0 border-t border-pnc-border bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
                isThinking && "pointer-events-none opacity-60"
              )}
            >
              {step === "loans" && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {LOANS.map((l) => {
                      const active = selectedLoans.includes(l.value);
                      return (
                        <button
                          key={l.value}
                          type="button"
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs",
                            active
                              ? "border-pnc-blue bg-pnc-blue text-white"
                              : "border-pnc-border"
                          )}
                          onClick={() =>
                            setSelectedLoans((prev) =>
                              active
                                ? prev.filter((x) => x !== l.value)
                                : [...prev, l.value]
                            )
                          }
                        >
                          {l.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={isThinking}
                      onClick={() => {
                        if (isThinking) return;
                        push(
                          "user",
                          selectedLoans.length
                            ? selectedLoans.join(", ")
                            : "None"
                        );
                        const next = {
                          ...localAnswers,
                          plannedLoans: selectedLoans,
                        };
                        setLocalAnswers(next);
                        updateIntake({ plannedLoans: selectedLoans });
                        advance(stepIndex + 1, next);
                      }}
                    >
                      Continue
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isThinking}
                      onClick={() => {
                        if (isThinking) return;
                        push("user", "Skip");
                        advance(stepIndex + 1);
                      }}
                    >
                      Skip
                    </Button>
                  </div>
                </div>
              )}

              {step === "consent" && (
                <div className="space-y-2">
                  <p className="text-xs text-pnc-slate">
                    Optional fields: medication, habits, conditions. Affect
                    emergency buffer only.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={isThinking}
                      onClick={() => {
                        if (isThinking) return;
                        push("user", "I'll share optional details");
                        const next = {
                          ...localAnswers,
                          healthConsentGiven: true,
                        };
                        setLocalAnswers(next);
                        updateIntake({ healthConsentGiven: true });
                        advance(stepIndex + 1, next);
                      }}
                    >
                      Continue
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isThinking}
                      onClick={() => {
                        if (isThinking) return;
                        push("user", "Skip optional health fields");
                        const next = {
                          ...localAnswers,
                          healthConsentGiven: false,
                        };
                        setLocalAnswers(next);
                        updateIntake({ healthConsentGiven: false });
                        replyWithThinking(
                          () => {
                            setStepIndex(STEPS.indexOf("contact"));
                            push(
                              "bot",
                              promptFor("contact", featured.lastName)
                            );
                          },
                          ["Skipping optional fields", "Thinking"],
                          1000
                        );
                      }}
                    >
                      Skip all
                    </Button>
                  </div>
                </div>
              )}

              {step === "habits" && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {HABITS.map((h) => {
                      const active = selectedHabits.includes(h.value);
                      return (
                        <button
                          key={h.value}
                          type="button"
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs",
                            active
                              ? "border-pnc-orange bg-pnc-orange text-white"
                              : "border-pnc-border"
                          )}
                          onClick={() =>
                            setSelectedHabits((prev) =>
                              active
                                ? prev.filter((x) => x !== h.value)
                                : [...prev, h.value]
                            )
                          }
                        >
                          {h.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={isThinking}
                      onClick={() => {
                        if (isThinking) return;
                        push(
                          "user",
                          selectedHabits.length
                            ? selectedHabits.join(", ")
                            : "None"
                        );
                        const next = {
                          ...localAnswers,
                          habits: selectedHabits,
                        };
                        setLocalAnswers(next);
                        advance(stepIndex + 1, next);
                      }}
                    >
                      Continue
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isThinking}
                      onClick={skipSensitive}
                    >
                      Skip
                    </Button>
                  </div>
                </div>
              )}

              {step === "contact" && (
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["phone", "Phone"],
                      ["email", "Email"],
                      ["video", "Video"],
                    ] as const
                  ).map(([value, label]) => (
                    <Button
                      key={value}
                      size="sm"
                      variant="outline"
                      disabled={isThinking}
                      onClick={() => {
                        if (isThinking) return;
                        push("user", label);
                        const next = {
                          ...localAnswers,
                          preferredContact: value,
                        };
                        setLocalAnswers(next);
                        updateIntake({ preferredContact: value });
                        advance(stepIndex + 1, next);
                      }}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              )}

              {step === "time" && (
                <div className="space-y-3">
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-pnc-slate">
                      Time of day
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {TIME_PERIODS.map((period) => (
                        <Button
                          key={period}
                          size="sm"
                          variant={timePeriod === period ? "default" : "outline"}
                          disabled={isThinking}
                          onClick={() => setTimePeriod(period)}
                        >
                          {period}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-pnc-slate">
                      Time
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {TIMES_BY_PERIOD[timePeriod].map((slot) => (
                        <Button
                          key={slot}
                          size="sm"
                          variant="outline"
                          disabled={isThinking}
                          onClick={() => {
                            if (isThinking) return;
                            const label = `${timePeriod} · ${slot} · ${timeZone}`;
                            push("user", label);
                            const next = {
                              ...localAnswers,
                              preferredTime: label,
                            };
                            setLocalAnswers(next);
                            updateIntake({ preferredTime: label });
                            advance(stepIndex + 1, next);
                          }}
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-pnc-slate">
                      Timezone
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {TIMEZONES.map((tz) => (
                        <Button
                          key={tz.id}
                          size="sm"
                          variant={timeZone === tz.id ? "default" : "outline"}
                          disabled={isThinking}
                          onClick={() => setTimeZone(tz.id)}
                        >
                          {tz.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {(step === "lastname" ||
                step === "age" ||
                step === "salary" ||
                step === "expenses" ||
                step === "household" ||
                step === "fund" ||
                step === "medication" ||
                step === "conditions") && (
                <form
                  className="flex min-w-0 flex-wrap gap-2 sm:flex-nowrap"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitText();
                  }}
                >
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isThinking}
                    onFocus={() => {
                      // Keep page pinned; only the message list may scroll.
                      window.scrollTo(0, 0);
                      requestAnimationFrame(() => {
                        window.scrollTo(0, 0);
                        const pane = messagesRef.current;
                        if (pane) pane.scrollTop = pane.scrollHeight;
                      });
                    }}
                    className="min-w-0 flex-1"
                    enterKeyHint="send"
                    autoComplete="off"
                    placeholder={
                      step === "fund"
                        ? formatCurrency(100_000)
                        : step === "lastname"
                          ? "Last name"
                          : step === "age"
                            ? "MM/DD/YYYY"
                            : step === "salary"
                              ? "Monthly income"
                              : "Type your answer"
                    }
                    aria-label="Chat answer"
                  />
                  {(step === "medication" || step === "conditions") && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      disabled={isThinking}
                      onClick={skipSensitive}
                    >
                      Skip
                    </Button>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    className="shrink-0"
                    disabled={isThinking}
                  >
                    Send
                  </Button>
                </form>
              )}

              {step === "done" && (
                <Button asChild className="w-full">
                  <Link href="/customer/plan">View full plan</Link>
                </Button>
              )}
            </div>
          </div>
          )}
        </PhoneFrame>
        </div>
        }
      />
    </IntakeGate>
  );
}
