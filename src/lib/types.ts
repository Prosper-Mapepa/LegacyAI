export type CustomerStatus =
  | "New"
  | "Approved"
  | "Notified"
  | "Engaged"
  | "Meeting booked";

export type Habit =
  | "smoking"
  | "heavy_alcohol"
  | "sedentary"
  | "poor_sleep"
  | "other";

export type PlannedLoan =
  | "car"
  | "personal"
  | "property"
  | "education"
  | "other";

export type ConditionBand =
  | "none"
  | "manageable_ongoing"
  | "serious_ongoing";

export type ExposureLabel = "Low" | "Moderate" | "Elevated" | "High";

export type Role = "rm" | "customer";

export type ContactMethod = "phone" | "email" | "video";

export interface MonthlySpend {
  year: number;
  month: number; // 1-12
  amount: number;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  balance: number;
  monthlySalary: number;
  monthlyExpenses: number;
  householdMembers: number;
  otherYearlyEarnings: number;
  spendingHistory: MonthlySpend[];
  status: CustomerStatus;
  /** Featured demo customer flag */
  featured?: boolean;
}

export interface Heir {
  id: string;
  customerId: string;
  name: string;
  relationship: string;
}

export interface PlannerInput {
  totalFund: number;
  age: number;
  monthlySalary: number;
  monthlyExpenses: number;
  householdMembers: number;
  plannedLoans: PlannedLoan[];
  medicationMonthlyExpense?: number;
  habits?: Habit[];
  conditionsText?: string;
}

/** Persisted planner state — never stores raw health text */
export interface PlannerPersistedState {
  totalFund: number;
  age: number;
  monthlySalary: number;
  monthlyExpenses: number;
  householdMembers: number;
  plannedLoans: PlannedLoan[];
  conditionBand: ConditionBand | null;
  conditionUnclassified: boolean;
  medicationBurdenFactor: number; // 0-1 coarse factor
  habitCount: number; // 0-3 coarse
  preferredContact?: ContactMethod;
  preferredTime?: string;
  healthConsentGiven: boolean;
}

export interface EmergencyExposure {
  /** Internal only — never shown in UI */
  riskScore: number;
  /** Internal only — never shown in UI */
  emergencyFrequencyPerYear: number;
  label: ExposureLabel;
  drivers: string[];
}

export interface AllocationResult {
  liquidity: number;
  safe: number;
  growth: number;
  amounts: {
    liquidity: number;
    safe: number;
    growth: number;
  };
  reasons: string[];
}

export interface GrowthProjectionPoint {
  year: number;
  value: number;
}

export interface IntakeAnswers {
  lastNameConfirmed: boolean;
  age?: number;
  monthlySalary?: number;
  monthlyExpenses?: number;
  householdMembers?: number;
  totalFund?: number;
  plannedLoans: PlannedLoan[];
  healthConsentGiven: boolean;
  medicationMonthlyExpense?: number;
  habits: Habit[];
  conditionsText?: string;
  preferredContact?: ContactMethod;
  preferredTime?: string;
  completed: boolean;
}

export interface CustomerPlanSnapshot {
  customerId: string;
  exposureLabel: ExposureLabel;
  drivers: string[];
  allocation: AllocationResult;
  age: number;
  householdMembers: number;
  plannedLoans: PlannedLoan[];
  totalFund: number;
  monthlySalary: number;
  monthlyExpenses: number;
  preferredContact?: ContactMethod;
  preferredTime?: string;
  updatedAt: string;
}
