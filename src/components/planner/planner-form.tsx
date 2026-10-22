"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Habit, PlannedLoan, PlannerInput } from "@/lib/types";
import { cn } from "@/lib/utils";

const LOAN_OPTIONS: { value: PlannedLoan; label: string }[] = [
  { value: "car", label: "Car" },
  { value: "personal", label: "Personal" },
  { value: "property", label: "Property" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
];

const HABIT_OPTIONS: { value: Habit; label: string }[] = [
  { value: "smoking", label: "Smoking" },
  { value: "heavy_alcohol", label: "Heavy alcohol" },
  { value: "sedentary", label: "Sedentary" },
  { value: "poor_sleep", label: "Poor sleep" },
  { value: "other", label: "Other" },
];

function WhyAsk({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex text-pnc-slate hover:text-pnc-blue"
          aria-label="Why we ask"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}

export interface PlannerFormState {
  totalFund: number;
  age: number;
  monthlySalary: number;
  monthlyExpenses: number;
  householdMembers: number;
  plannedLoans: PlannedLoan[];
  healthConsent: boolean;
  medicationMonthlyExpense: string;
  habits: Habit[];
  conditionsText: string;
  skipMedication: boolean;
  skipHabits: boolean;
  skipConditions: boolean;
}

export function formToPlannerInput(form: PlannerFormState): PlannerInput {
  return {
    totalFund: form.totalFund,
    age: form.age,
    monthlySalary: form.monthlySalary,
    monthlyExpenses: form.monthlyExpenses,
    householdMembers: form.householdMembers,
    plannedLoans: form.plannedLoans,
    medicationMonthlyExpense:
      form.healthConsent &&
      !form.skipMedication &&
      form.medicationMonthlyExpense !== ""
        ? Number(form.medicationMonthlyExpense)
        : undefined,
    habits:
      form.healthConsent && !form.skipHabits && form.habits.length > 0
        ? form.habits
        : undefined,
    conditionsText:
      form.healthConsent && !form.skipConditions && form.conditionsText.trim()
        ? form.conditionsText
        : undefined,
  };
}

function Field({
  id,
  label,
  children,
  className,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <Label htmlFor={id} className="text-sm font-medium text-pnc-navy">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function PlannerForm({
  form,
  onChange,
  onDeleteHealth,
  compact = false,
}: {
  form: PlannerFormState;
  onChange: (next: PlannerFormState) => void;
  onDeleteHealth: () => void;
  compact?: boolean;
}) {
  function toggleLoan(loan: PlannedLoan) {
    const has = form.plannedLoans.includes(loan);
    onChange({
      ...form,
      plannedLoans: has
        ? form.plannedLoans.filter((l) => l !== loan)
        : [...form.plannedLoans, loan],
    });
  }

  function toggleHabit(habit: Habit) {
    const has = form.habits.includes(habit);
    onChange({
      ...form,
      habits: has
        ? form.habits.filter((h) => h !== habit)
        : [...form.habits, habit],
    });
  }

  const inputClass = cn(
    "h-10 w-full min-w-0 text-sm text-pnc-navy",
    compact && "h-9 px-2"
  );

  return (
    <div className={cn("space-y-5 text-sm text-pnc-navy", compact && "space-y-3")}>
      <fieldset className="space-y-3">
        <legend className="text-base font-semibold text-pnc-navy">
          Your details
        </legend>

        <div
          className={cn(
            "grid gap-2.5",
            compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"
          )}
        >
          <Field
            id="totalFund"
            label="Total fund ($)"
            className={compact ? "col-span-2" : "sm:col-span-2"}
          >
            <Input
              id="totalFund"
              type="number"
              min={1000}
              className={inputClass}
              value={form.totalFund}
              onChange={(e) =>
                onChange({ ...form, totalFund: Number(e.target.value) || 0 })
              }
            />
          </Field>

          <Field id="age" label="Age">
            <Input
              id="age"
              type="number"
              min={18}
              max={100}
              className={inputClass}
              value={form.age}
              onChange={(e) =>
                onChange({ ...form, age: Number(e.target.value) || 0 })
              }
            />
          </Field>

          <Field id="household" label="Household size">
            <Input
              id="household"
              type="number"
              min={1}
              max={20}
              className={inputClass}
              value={form.householdMembers}
              onChange={(e) =>
                onChange({
                  ...form,
                  householdMembers: Number(e.target.value) || 1,
                })
              }
            />
          </Field>

          <Field id="salary" label="Monthly salary ($)">
            <Input
              id="salary"
              type="number"
              min={0}
              className={inputClass}
              value={form.monthlySalary}
              onChange={(e) =>
                onChange({
                  ...form,
                  monthlySalary: Number(e.target.value) || 0,
                })
              }
            />
          </Field>

          <Field id="expenses" label="Monthly expenses ($)">
            <Input
              id="expenses"
              type="number"
              min={0}
              className={inputClass}
              value={form.monthlyExpenses}
              onChange={(e) =>
                onChange({
                  ...form,
                  monthlyExpenses: Number(e.target.value) || 0,
                })
              }
            />
          </Field>
        </div>

        <div className="space-y-2 pt-1">
          <Label className="text-sm font-medium text-pnc-navy">
            Planned loans (optional)
          </Label>
          <div
            className={cn(
              "grid gap-2",
              compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"
            )}
          >
            {LOAN_OPTIONS.map((opt) => {
              const active = form.plannedLoans.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleLoan(opt.value)}
                  className={cn(
                    "rounded-md border px-2 py-2 text-sm font-medium",
                    active
                      ? "border-pnc-blue bg-pnc-blue text-white"
                      : "border-pnc-border bg-white text-pnc-navy"
                  )}
                  aria-pressed={active}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </fieldset>

      <fieldset
        className={cn(
          "space-y-3 rounded-lg border border-dashed border-pnc-border bg-pnc-bg/40",
          compact ? "p-3" : "p-4"
        )}
      >
        <legend className="px-1 text-base font-semibold text-pnc-navy">
          Optional buffer details
        </legend>

        {!form.healthConsent ? (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-pnc-navy">
              Share these to personalize your emergency buffer. Optional — skip
              anything you prefer. Affects buffer only, never eligibility or
              pricing.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => onChange({ ...form, healthConsent: true })}
              >
                Add optional details
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onChange({
                    ...form,
                    healthConsent: false,
                    skipMedication: true,
                    skipHabits: true,
                    skipConditions: true,
                  })
                }
              >
                Skip
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="medication" className="text-sm font-medium">
                  Medication ($/mo)
                </Label>
                <WhyAsk text="Why we ask: recurring medication costs can raise how much cash you may want on hand. Optional — skip with no penalty." />
              </div>
              {!form.skipMedication ? (
                <div className="flex gap-2">
                  <Input
                    id="medication"
                    type="number"
                    min={0}
                    placeholder="Optional"
                    className={inputClass}
                    value={form.medicationMonthlyExpense}
                    onChange={(e) =>
                      onChange({
                        ...form,
                        medicationMonthlyExpense: e.target.value,
                      })
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onChange({
                        ...form,
                        skipMedication: true,
                        medicationMonthlyExpense: "",
                      })
                    }
                  >
                    Skip
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange({ ...form, skipMedication: false })}
                >
                  Add medication expense
                </Button>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm font-medium">Lifestyle factors</Label>
                <WhyAsk text="Why we ask: lifestyle factors can inform a larger liquid buffer. Optional — skip with no penalty. We store only a coarse count, never details." />
              </div>
              {!form.skipHabits ? (
                <>
                  <div className="grid grid-cols-2 gap-1.5">
                    {HABIT_OPTIONS.map((opt) => {
                      const active = form.habits.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleHabit(opt.value)}
                          className={cn(
                            "rounded-md border px-2 py-2 text-sm font-medium",
                            active
                              ? "border-pnc-orange bg-pnc-orange text-white"
                              : "border-pnc-border bg-white text-pnc-navy"
                          )}
                          aria-pressed={active}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onChange({
                        ...form,
                        skipHabits: true,
                        habits: [],
                      })
                    }
                  >
                    Skip habits
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange({ ...form, skipHabits: false })}
                >
                  Add habits
                </Button>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="conditions" className="text-sm font-medium">
                  Current diseases (if any)
                </Label>
                <WhyAsk text="Why we ask: a coarse health band can personalize your emergency buffer. Free text is mapped locally and discarded — we never store diagnoses." />
              </div>
              {!form.skipConditions ? (
                <div className="space-y-2">
                  <textarea
                    id="conditions"
                    rows={2}
                    className="w-full rounded-md border border-pnc-border bg-white px-2 py-1.5 text-sm"
                    placeholder="Optional free text"
                    value={form.conditionsText}
                    onChange={(e) =>
                      onChange({ ...form, conditionsText: e.target.value })
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onChange({
                        ...form,
                        skipConditions: true,
                        conditionsText: "",
                      })
                    }
                  >
                    Skip
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange({ ...form, skipConditions: false })}
                >
                  Add conditions note
                </Button>
              )}
            </div>

            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={onDeleteHealth}
            >
              Delete my health info
            </Button>
          </div>
        )}
      </fieldset>
    </div>
  );
}
