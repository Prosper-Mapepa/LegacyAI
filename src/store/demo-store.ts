"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { customers as seedCustomers, FEATURED_CUSTOMER_ID } from "@/data/mock";
import {
  assessEmergencyExposure,
  deriveSensitiveFactors,
  recommendAllocation,
} from "@/lib/ai";
import type {
  Customer,
  CustomerPlanSnapshot,
  CustomerStatus,
  Habit,
  IntakeAnswers,
  PlannedLoan,
  PlannerInput,
  Role,
} from "@/lib/types";

function cloneCustomers(): Customer[] {
  return seedCustomers.map((c) => ({
    ...c,
    spendingHistory: c.spendingHistory.map((s) => ({ ...s })),
  }));
}

const defaultIntake: IntakeAnswers = {
  lastNameConfirmed: false,
  plannedLoans: [],
  healthConsentGiven: false,
  habits: [],
  completed: false,
};

interface DemoState {
  role: Role;
  customers: Customer[];
  selectedCustomerId: string | null;
  intake: IntakeAnswers;
  planSnapshot: CustomerPlanSnapshot | null;
  /** Coarse factors only — never raw health text */
  sensitiveMeta: {
    conditionBand: string | null;
    conditionUnclassified: boolean;
    medicationBurdenFactor: number;
    habitCount: number;
  } | null;
  notificationSeen: boolean;
  heirChoice: "save" | "reinvest" | null;

  setRole: (role: Role) => void;
  selectCustomer: (id: string | null) => void;
  updateCustomerStatus: (id: string, status: CustomerStatus) => void;
  approveOutreach: (id: string) => void;
  sendNotification: (id: string) => void;
  bookMeeting: (id: string) => void;
  setNotificationSeen: (seen: boolean) => void;
  updateIntake: (partial: Partial<IntakeAnswers>) => void;
  completeIntake: () => void;
  setHeirChoice: (choice: "save" | "reinvest" | null) => void;
  clearSensitiveHealth: () => void;
  updatePlanFromInput: (input: PlannerInput) => void;
  resetDemo: () => void;
}

function buildSnapshot(
  customerId: string,
  input: PlannerInput,
  contact?: { preferredContact?: IntakeAnswers["preferredContact"]; preferredTime?: string }
): CustomerPlanSnapshot {
  const exposure = assessEmergencyExposure(input);
  const allocation = recommendAllocation(input, exposure);
  return {
    customerId,
    exposureLabel: exposure.label,
    drivers: exposure.drivers,
    allocation,
    age: input.age,
    householdMembers: input.householdMembers,
    plannedLoans: input.plannedLoans,
    totalFund: input.totalFund,
    monthlySalary: input.monthlySalary,
    monthlyExpenses: input.monthlyExpenses,
    preferredContact: contact?.preferredContact,
    preferredTime: contact?.preferredTime,
    updatedAt: new Date().toISOString(),
  };
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      role: "rm",
      customers: cloneCustomers(),
      selectedCustomerId: FEATURED_CUSTOMER_ID,
      intake: { ...defaultIntake },
      planSnapshot: null,
      sensitiveMeta: null,
      notificationSeen: false,
      heirChoice: null,

      setRole: (role) => set({ role }),

      selectCustomer: (id) => set({ selectedCustomerId: id }),

      updateCustomerStatus: (id, status) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === id ? { ...c, status } : c
          ),
        })),

      approveOutreach: (id) => {
        const c = get().customers.find((x) => x.id === id);
        if (c && c.status === "New") {
          get().updateCustomerStatus(id, "Approved");
        }
      },

      sendNotification: (id) => {
        const c = get().customers.find((x) => x.id === id);
        if (c && (c.status === "Approved" || c.status === "New")) {
          if (c.status === "New") {
            get().updateCustomerStatus(id, "Approved");
          }
          get().updateCustomerStatus(id, "Notified");
          set({ notificationSeen: false });
        }
      },

      bookMeeting: (id) => {
        const c = get().customers.find((x) => x.id === id);
        if (c && c.status === "Engaged") {
          get().updateCustomerStatus(id, "Meeting booked");
        }
      },

      setNotificationSeen: (seen) => set({ notificationSeen: seen }),

      updateIntake: (partial) =>
        set((s) => ({ intake: { ...s.intake, ...partial } })),

      completeIntake: () => {
        const { intake, customers } = get();
        const featured =
          customers.find((c) => c.featured) ??
          customers.find((c) => c.id === FEATURED_CUSTOMER_ID)!;

        const input: PlannerInput = {
          totalFund: intake.totalFund ?? featured.balance,
          age: intake.age ?? featured.age,
          monthlySalary: intake.monthlySalary ?? featured.monthlySalary,
          monthlyExpenses: intake.monthlyExpenses ?? featured.monthlyExpenses,
          householdMembers:
            intake.householdMembers ?? featured.householdMembers,
          plannedLoans: (intake.plannedLoans ?? []) as PlannedLoan[],
          medicationMonthlyExpense: intake.healthConsentGiven
            ? intake.medicationMonthlyExpense
            : undefined,
          habits: intake.healthConsentGiven
            ? (intake.habits as Habit[])
            : undefined,
          conditionsText: intake.healthConsentGiven
            ? intake.conditionsText
            : undefined,
        };

        const factors = deriveSensitiveFactors({
          medicationMonthlyExpense: input.medicationMonthlyExpense,
          monthlySalary: input.monthlySalary,
          habits: input.habits,
          conditionsText: input.conditionsText,
        });

        // Discard raw health text from intake persistence
        const cleanedIntake: IntakeAnswers = {
          ...intake,
          completed: true,
          conditionsText: undefined,
          medicationMonthlyExpense: undefined,
          habits: [],
        };

        const snapshot = buildSnapshot(featured.id, input, {
          preferredContact: intake.preferredContact,
          preferredTime: intake.preferredTime,
        });

        set({
          intake: cleanedIntake,
          planSnapshot: snapshot,
          sensitiveMeta: factors,
          customers: get().customers.map((c) =>
            c.id === featured.id ? { ...c, status: "Engaged" as const } : c
          ),
        });
      },

      setHeirChoice: (choice) => set({ heirChoice: choice }),

      clearSensitiveHealth: () => {
        const { planSnapshot, customers, intake } = get();
        const featured =
          customers.find((c) => c.featured) ??
          customers.find((c) => c.id === FEATURED_CUSTOMER_ID)!;

        const input: PlannerInput = {
          totalFund: planSnapshot?.allocation
            ? planSnapshot.allocation.amounts.liquidity +
              planSnapshot.allocation.amounts.safe +
              planSnapshot.allocation.amounts.growth
            : intake.totalFund ?? featured.balance,
          age: planSnapshot?.age ?? intake.age ?? featured.age,
          monthlySalary: intake.monthlySalary ?? featured.monthlySalary,
          monthlyExpenses: intake.monthlyExpenses ?? featured.monthlyExpenses,
          householdMembers:
            planSnapshot?.householdMembers ??
            intake.householdMembers ??
            featured.householdMembers,
          plannedLoans:
            planSnapshot?.plannedLoans ?? intake.plannedLoans ?? [],
        };

        const snapshot = buildSnapshot(featured.id, input, {
          preferredContact:
            planSnapshot?.preferredContact ?? intake.preferredContact,
          preferredTime: planSnapshot?.preferredTime ?? intake.preferredTime,
        });

        set({
          sensitiveMeta: null,
          planSnapshot: snapshot,
          intake: {
            ...intake,
            healthConsentGiven: false,
            medicationMonthlyExpense: undefined,
            habits: [],
            conditionsText: undefined,
          },
        });
      },

      updatePlanFromInput: (input) => {
        const factors = deriveSensitiveFactors({
          medicationMonthlyExpense: input.medicationMonthlyExpense,
          monthlySalary: input.monthlySalary,
          habits: input.habits,
          conditionsText: input.conditionsText,
        });

        // Persist without raw text
        const cleanInput: PlannerInput = {
          ...input,
          conditionsText: undefined,
        };
        void cleanInput;

        const customerId =
          get().planSnapshot?.customerId ?? FEATURED_CUSTOMER_ID;
        const snapshot = buildSnapshot(customerId, input, {
          preferredContact: get().planSnapshot?.preferredContact,
          preferredTime: get().planSnapshot?.preferredTime,
        });

        set({
          planSnapshot: snapshot,
          sensitiveMeta: {
            conditionBand: factors.conditionBand,
            conditionUnclassified: factors.conditionUnclassified,
            medicationBurdenFactor: factors.medicationBurdenFactor,
            habitCount: factors.habitCount,
          },
        });
      },

      resetDemo: () =>
        set({
          role: "rm",
          customers: cloneCustomers(),
          selectedCustomerId: FEATURED_CUSTOMER_ID,
          intake: { ...defaultIntake, plannedLoans: [], habits: [] },
          planSnapshot: null,
          sensitiveMeta: null,
          notificationSeen: false,
          heirChoice: null,
        }),
    }),
    {
      name: "legacyai-demo",
      partialize: (state) => ({
        role: state.role,
        customers: state.customers.map((c) => ({
          ...c,
          // Keep spending history for charts
        })),
        selectedCustomerId: state.selectedCustomerId,
        intake: {
          ...state.intake,
          // Never persist raw health text
          conditionsText: undefined,
          medicationMonthlyExpense: undefined,
          habits: [] as Habit[],
        },
        planSnapshot: state.planSnapshot,
        sensitiveMeta: state.sensitiveMeta,
        notificationSeen: state.notificationSeen,
        heirChoice: state.heirChoice,
      }),
    }
  )
);
