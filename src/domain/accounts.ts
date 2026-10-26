"use client";

import { useMemo, useSyncExternalStore } from "react";
import { personById, type Person, type Role } from "./people";
import { seedHouseholds } from "./seed";
import { useSession, setSession } from "./session";

export type FamilyRole = Exclude<Role, "advisor">;

export type Account = {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: Role;
  householdId: string;
  heirId?: string;
  verified: boolean;
  salt: string;
  passwordHash: string;
};

const KEY = "legacyai.accounts.v4";
const OTP_KEY = "legacyai.otp.v1";

/** Demo password for every seeded seat. */
export const DEMO_PASSWORD = "LegacyAI1";

/** Pilot OTP shown after create account. */
export const DEMO_OTP = "246810";

const SEED: Account[] = [
  {
    id: "priya",
    email: "advisor@legacyai.com",
    phone: "+1 412 555 0101",
    name: "Advisor",
    role: "advisor",
    householdId: "whitmore",
    verified: true,
    salt: "priya-salt",
    passwordHash: "e2d2df1045443021e62dba10820925c4f10a7ac05f114cd8cd1a62fd168cf68c",
  },
  {
    id: "margaret",
    email: "principal@legacyai.com",
    phone: "+1 412 555 0102",
    name: "Principal",
    role: "principal",
    householdId: "whitmore",
    verified: true,
    salt: "margaret-salt",
    passwordHash: "4a5d43530541163c4582fe8714157e667c6e2793801ec719501584689d144312",
  },
  {
    id: "david",
    email: "heir@legacyai.com",
    phone: "+1 412 555 0103",
    name: "Heir",
    role: "heir",
    householdId: "whitmore",
    heirId: "david",
    verified: true,
    salt: "elena-salt",
    passwordHash: "5b6c6ba89496dd5301f3ddab5bdf5398ea55886d9aecb969ac503b2e161ee4b8",
  },
];

export const DEMO_ACCOUNTS = SEED.map(({ id, email, name, role }) => ({
  id,
  email,
  name,
  role,
}));

type PendingOtp = {
  accountId: string;
  channel: "email" | "phone";
  code: string;
  sentTo: string;
};

const listeners = new Set<() => void>();
let accounts: Account[] = SEED;
let loaded = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    const stored = raw ? (JSON.parse(raw) as Account[]) : [];
    const byId = new Map<string, Account>();
    if (Array.isArray(stored)) {
      for (const account of stored) {
        if (account?.id && account.email && account.passwordHash) {
          byId.set(account.id, {
            ...account,
            phone: account.phone ?? "",
            verified: account.verified ?? false,
            householdId: account.householdId ?? "",
          });
        }
      }
    }
    for (const account of SEED) {
      byId.set(account.id, account);
    }
    accounts = [...byId.values()];
    window.localStorage.setItem(KEY, JSON.stringify(accounts));
  } catch {
    accounts = SEED;
  }
}

function persist() {
  window.localStorage.setItem(KEY, JSON.stringify(accounts));
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  load();
  return accounts;
}

function getServerSnapshot() {
  return SEED;
}

export function useAccounts() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").trim();
}

export async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toPerson(account: Account): Person {
  const known = personById(account.id);
  if (known) return { ...known, name: account.name };
  const roleLabel =
    account.role === "advisor" ? "Advisor" : account.role === "principal" ? "Principal" : "Heir";
  return {
    id: account.id,
    role: account.role,
    name: account.name,
    roleLabel,
    detail: "",
    sees: "",
    hidden: "",
    householdId: account.householdId,
    heirId: account.heirId,
  };
}

export function useAccount() {
  const session = useSession();
  const list = useAccounts();
  return list.find((item) => item.id === session?.accountId) ?? null;
}

export function usePerson() {
  const account = useAccount();
  return useMemo(() => (account ? toPerson(account) : null), [account]);
}

/** Home desk for each signed-in role */
export function nextPathFor(account: Account | null) {
  if (!account) return "/sign-in";
  if (!account.verified) return "/verify";
  if (account.role !== "advisor" && !account.householdId) return "/setup";
  if (account.role === "advisor") return "/dashboard";
  if (account.role === "principal") return `/hub/${account.householdId}`;
  // Featured Heir lands on intake; Sibling on their hub space
  if (account.role === "heir" && account.heirId === "david") return "/customer";
  if (account.role === "heir" && account.heirId) {
    return `/hub/${account.householdId}/heirs/${account.heirId}?live=1`;
  }
  return "/customer";
}

export function isDeskReady(account: Account | null) {
  if (!account?.verified) return false;
  if (account.role === "advisor") return true;
  return Boolean(account.householdId);
}

export async function signIn(email: string, password: string) {
  load();
  const account = accounts.find((item) => item.email === normalizeEmail(email));
  if (!account) return { error: "No account uses that email." as const, account: null };
  const hash = await hashPassword(password, account.salt);
  if (hash !== account.passwordHash) {
    return { error: "That password does not match." as const, account: null };
  }
  setSession(account.id);
  return { error: null, account };
}

export async function register(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
  role: FamilyRole;
}) {
  load();
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  const phone = input.phone.trim();
  if (name.length < 2) return { error: "Enter your name." as const, account: null };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email." as const, account: null };
  }
  if (normalizePhone(phone).length < 10) {
    return { error: "Enter a valid phone number." as const, account: null };
  }
  if (accounts.some((item) => item.email === email)) {
    return { error: "An account already uses that email." as const, account: null };
  }
  if (accounts.some((item) => normalizePhone(item.phone) === normalizePhone(phone))) {
    return { error: "An account already uses that phone number." as const, account: null };
  }
  if (input.password.length < 8) {
    return { error: "Use at least 8 characters." as const, account: null };
  }
  if (input.password !== input.confirm) {
    return { error: "Those passwords do not match." as const, account: null };
  }
  if (input.role !== "principal" && input.role !== "heir") {
    return { error: "Choose principal or heir." as const, account: null };
  }

  const salt = crypto.randomUUID();
  const account: Account = {
    id: crypto.randomUUID(),
    email,
    phone,
    name,
    role: input.role,
    householdId: "",
    verified: false,
    salt,
    passwordHash: await hashPassword(input.password, salt),
  };
  accounts = [...accounts, account];
  persist();
  setSession(account.id);
  return { error: null, account };
}

export function startOtp(accountId: string, channel: "email" | "phone") {
  load();
  const account = accounts.find((item) => item.id === accountId);
  if (!account) return "That account was not found.";
  const pending: PendingOtp = {
    accountId,
    channel,
    code: DEMO_OTP,
    sentTo: channel === "email" ? account.email : account.phone,
  };
  window.sessionStorage.setItem(OTP_KEY, JSON.stringify(pending));
  return null;
}

export function readPendingOtp(): PendingOtp | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(OTP_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingOtp;
  } catch {
    return null;
  }
}

export function confirmOtp(accountId: string, code: string) {
  load();
  const pending = readPendingOtp();
  if (!pending || pending.accountId !== accountId) {
    return "Send a code first.";
  }
  if (code.trim() !== pending.code) return "That code does not match.";
  accounts = accounts.map((account) =>
    account.id === accountId ? { ...account, verified: true } : account,
  );
  persist();
  window.sessionStorage.removeItem(OTP_KEY);
  return null;
}

export function completeSetup(input: {
  accountId: string;
  familyName: string;
  heirFirstName?: string;
}) {
  load();
  const account = accounts.find((item) => item.id === input.accountId);
  if (!account) return "That account was not found.";
  if (!account.verified) return "Verify your email or phone first.";
  if (account.role === "advisor") return "Advisors do not set a family here.";

  const family = input.familyName.trim().toLowerCase();
  if (family.length < 2) return "Enter the family name.";

  const household = seedHouseholds.find(
    (item) => item.familyName.toLowerCase() === family,
  );
  if (!household) {
    return "That family is not on the bank record in this pilot. Enter the name exactly as it appears on the plan.";
  }

  if (account.role === "principal") {
    accounts = accounts.map((item) =>
      item.id === account.id ? { ...item, householdId: household.id, heirId: undefined } : item,
    );
    persist();
    return null;
  }

  const first = (input.heirFirstName ?? "").trim().toLowerCase();
  if (first.length < 2) return "Enter your first name as it appears on the plan.";
  const heir = household.heirs.find((item) => item.firstName.toLowerCase() === first);
  if (!heir) {
    return "That person is not on the plan for this family. Enter the first name exactly.";
  }
  accounts = accounts.map((item) =>
    item.id === account.id
      ? { ...item, householdId: household.id, heirId: heir.id }
      : item,
  );
  persist();
  return null;
}
