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
import { useDemoStore } from "@/store/demo-store";

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

function promptFor(step: StepId, lastName: string): string {
  switch (step) {
    case "lastname":
      return `Welcome to LegacyAI. To confirm it's you, what's your last name?`;
    case "age":
      return `Thanks, ${lastName}. What's your age?`;
    case "salary":
      return "What's your monthly salary (before tax)?";
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
      return "Preferred time slot for your RM?";
    case "done":
      return "Thanks, your relationship manager will reach out.";
  }
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
  const [planPreview, setPlanPreview] = useState<{
    label: string;
    liquidity: number;
    safe: number;
    growth: number;
  } | null>(null);
  const [unclassified, setUnclassified] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const step = STEPS[stepIndex];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, stepIndex]);

  function push(from: "bot" | "user", msg: string) {
    setMessages((m) => [
      ...m,
      { id: `m${m.length}-${Date.now()}`, from, text: msg },
    ]);
  }

  function advance(nextIndex: number, nextLocal = localAnswers) {
    const nextStep = STEPS[nextIndex];
    setStepIndex(nextIndex);
    if (nextStep && nextStep !== "done") {
      push("bot", promptFor(nextStep, featured.lastName));
    }
    if (nextStep === "done") {
      finish(nextLocal);
    }
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
    setPlanPreview({
      label: exposure.label,
      liquidity: alloc.liquidity,
      safe: alloc.safe,
      growth: alloc.growth,
    });
    if (answers.conditionsText) {
      setUnclassified(mapConditionsText(answers.conditionsText).unclassified);
    }
    completeIntake();
    push("bot", "Thanks, your relationship manager will reach out.");
  }

  function submitText() {
    const value = text.trim();
    if (!value && step !== "conditions" && step !== "medication") return;
    push("user", value || "(skipped)");
    setText("");

    const next = { ...localAnswers };

    switch (step) {
      case "lastname": {
        if (value.toLowerCase() !== featured.lastName.toLowerCase()) {
          push(
            "bot",
            `Hmm, that doesn't match our records. Try again (hint: ${featured.lastName}).`
          );
          return;
        }
        updateIntake({ lastNameConfirmed: true });
        advance(stepIndex + 1, next);
        return;
      }
      case "age":
        next.age = Number(value) || featured.age;
        break;
      case "salary":
        next.monthlySalary = Number(value.replace(/[,$]/g, "")) || featured.monthlySalary;
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
    push("user", "Skip");
    advance(stepIndex + 1);
  }

  if (intake.completed && planSnapshot && step !== "done" && !planPreview) {
    // Already completed in prior session
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-pnc-navy sm:text-2xl">
          LegacyAI intake
        </h1>
        <p className="text-sm text-pnc-slate">
          One question at a time — chatbot style.
        </p>
      </div>

      <div className="flex justify-center">
        <PhoneFrame title="LegacyAI Chat">
          <div className="flex min-h-[560px] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto p-3">
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

              {step === "done" && planPreview && (
                <div className="rounded-xl border border-pnc-border bg-white p-3 text-sm shadow-sm">
                  <p className="font-semibold text-pnc-navy">
                    Your plan preview
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
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-pnc-border bg-white p-3">
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
                      onClick={() => {
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
                      onClick={() => {
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
                      onClick={() => {
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
                      onClick={() => {
                        push("user", "Skip optional health fields");
                        // Jump past medication, habits, conditions
                        const next = {
                          ...localAnswers,
                          healthConsentGiven: false,
                        };
                        setLocalAnswers(next);
                        setStepIndex(STEPS.indexOf("contact"));
                        push("bot", promptFor("contact", featured.lastName));
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
                      onClick={() => {
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
                    <Button size="sm" variant="outline" onClick={skipSensitive}>
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
                      onClick={() => {
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
                <div className="flex flex-wrap gap-2">
                  {["Morning", "Afternoon", "Evening"].map((slot) => (
                    <Button
                      key={slot}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        push("user", slot);
                        const next = {
                          ...localAnswers,
                          preferredTime: slot,
                        };
                        setLocalAnswers(next);
                        updateIntake({ preferredTime: slot });
                        advance(stepIndex + 1, next);
                      }}
                    >
                      {slot}
                    </Button>
                  ))}
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
                    className="min-w-0 flex-1"
                    placeholder={
                      step === "fund"
                        ? formatCurrency(100_000)
                        : step === "lastname"
                          ? "Last name"
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
                      onClick={skipSensitive}
                    >
                      Skip
                    </Button>
                  )}
                  <Button type="submit" size="sm" className="shrink-0">
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
        </PhoneFrame>
      </div>
    </div>
  );
}
