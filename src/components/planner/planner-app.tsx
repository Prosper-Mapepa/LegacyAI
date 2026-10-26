"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PlannerForm,
  formToPlannerInput,
  type PlannerFormState,
} from "@/components/planner/planner-form";
import { PlannerResults } from "@/components/planner/planner-results";
import { getFeaturedCustomer, getHeirForCustomer } from "@/data/mock";
import {
  assessEmergencyExposure,
  mapConditionsText,
  recommendAllocation,
} from "@/lib/ai";
import type { Habit, PlannedLoan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";

function buildFormFromStore(
  intake: ReturnType<typeof useDemoStore.getState>["intake"],
  planSnapshot: ReturnType<typeof useDemoStore.getState>["planSnapshot"]
): PlannerFormState {
  const featured = getFeaturedCustomer();
  const totalFromPlan = planSnapshot
    ? planSnapshot.allocation.amounts.liquidity +
      planSnapshot.allocation.amounts.safe +
      planSnapshot.allocation.amounts.growth
    : undefined;

  return {
    totalFund:
      intake.totalFund ??
      planSnapshot?.totalFund ??
      totalFromPlan ??
      featured.balance,
    age: intake.age ?? planSnapshot?.age ?? featured.age,
    monthlySalary:
      intake.monthlySalary ??
      planSnapshot?.monthlySalary ??
      featured.monthlySalary,
    monthlyExpenses:
      intake.monthlyExpenses ??
      planSnapshot?.monthlyExpenses ??
      featured.monthlyExpenses,
    householdMembers:
      intake.householdMembers ??
      planSnapshot?.householdMembers ??
      featured.householdMembers,
    plannedLoans: (intake.plannedLoans?.length
      ? intake.plannedLoans
      : planSnapshot?.plannedLoans ?? []) as PlannedLoan[],
    healthConsent: intake.healthConsentGiven ?? false,
    medicationMonthlyExpense:
      intake.medicationMonthlyExpense != null
        ? String(intake.medicationMonthlyExpense)
        : "",
    habits: (intake.habits ?? []) as Habit[],
    conditionsText: intake.conditionsText ?? "",
    skipMedication: false,
    skipHabits: false,
    skipConditions: false,
  };
}

export function PlannerApp({
  title = "Emergency Fund Diversification Planner",
  syncToStore = true,
  /** Compact phone-friendly layout. */
  stacked = false,
}: {
  title?: string;
  syncToStore?: boolean;
  stacked?: boolean;
}) {
  const intake = useDemoStore((s) => s.intake);
  const planSnapshot = useDemoStore((s) => s.planSnapshot);
  const heirChoice = useDemoStore((s) => s.heirChoice);
  const setHeirChoice = useDemoStore((s) => s.setHeirChoice);
  const updatePlanFromInput = useDemoStore((s) => s.updatePlanFromInput);
  const clearSensitiveHealth = useDemoStore((s) => s.clearSensitiveHealth);
  const featured = getFeaturedCustomer();
  const heir = getHeirForCustomer(featured.id);

  const [form, setForm] = useState<PlannerFormState>(() =>
    buildFormFromStore(intake, planSnapshot)
  );
  const [debouncedForm, setDebouncedForm] = useState(form);
  const [hydrated, setHydrated] = useState(false);

  // Rehydrate once from persisted intake / plan after Zustand loads
  useEffect(() => {
    if (hydrated) return;
    setForm(buildFormFromStore(intake, planSnapshot));
    setDebouncedForm(buildFormFromStore(intake, planSnapshot));
    setHydrated(true);
  }, [intake, planSnapshot, hydrated]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedForm(form), 300);
    return () => clearTimeout(t);
  }, [form]);

  const input = useMemo(
    () => formToPlannerInput(debouncedForm),
    [debouncedForm]
  );

  const exposure = useMemo(() => assessEmergencyExposure(input), [input]);
  const allocation = useMemo(
    () => recommendAllocation(input, exposure),
    [input, exposure]
  );

  const unclassified =
    !!input.conditionsText &&
    mapConditionsText(input.conditionsText).unclassified;

  useEffect(() => {
    if (!syncToStore || !hydrated) return;
    updatePlanFromInput(input);
  }, [input, syncToStore, updatePlanFromInput, hydrated]);

  function handleDeleteHealth() {
    setForm((f) => ({
      ...f,
      healthConsent: false,
      medicationMonthlyExpense: "",
      habits: [],
      conditionsText: "",
      skipMedication: false,
      skipHabits: false,
      skipConditions: false,
    }));
    clearSensitiveHealth();
  }

  const fromIntake = intake.completed;

  return (
    <div
      className={cn(
        "space-y-4 text-sm leading-relaxed text-pnc-navy",
        stacked && "text-[15px]"
      )}
    >
      <div
        className={
          stacked
            ? "space-y-1"
            : "rounded-xl border border-pnc-border bg-white px-5 py-4 shadow-sm"
        }
      >
        <h1
          className={
            stacked
              ? "text-lg font-bold tracking-tight text-pnc-navy"
              : "text-xl font-bold tracking-tight text-pnc-navy sm:text-2xl"
          }
        >
          {title}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-pnc-navy">
          {fromIntake
            ? "Prefilled from your intake — edit anything and the plan updates instantly."
            : "Enter your details below. The diversification plan updates instantly. No risk percentages or emergency probabilities are shown."}
        </p>
      </div>

      <div
        className={
          stacked ? "flex flex-col gap-3" : "grid gap-6 lg:grid-cols-2"
        }
      >
        <div
          className={
            stacked
              ? "rounded-lg border border-pnc-border bg-white p-3"
              : "rounded-lg border border-pnc-border bg-white p-4 sm:p-5"
          }
        >
          <PlannerForm
            form={form}
            onChange={setForm}
            onDeleteHealth={handleDeleteHealth}
            compact={stacked}
          />
        </div>
        <PlannerResults
          input={input}
          exposure={exposure}
          allocation={allocation}
          unclassifiedNote={unclassified}
          heir={heir}
          heirChoice={heirChoice}
          onHeirChoice={setHeirChoice}
          compact={stacked}
        />
      </div>
    </div>
  );
}
