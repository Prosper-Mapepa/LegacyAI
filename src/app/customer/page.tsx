"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronLeft, Mail } from "lucide-react";
import { PhoneFrame } from "@/components/phone-frame";
import { Button } from "@/components/ui/button";
import { getFeaturedCustomer } from "@/data/mock";
import { useDemoStore } from "@/store/demo-store";
import { cn } from "@/lib/utils";

type DemoStep = "push" | "email";

/** Step 1 — push notification only (no profile / greeting card). */
function PushNotification({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex h-full min-h-[520px] flex-1 flex-col justify-center gap-5 bg-gradient-to-b from-slate-100 to-slate-200 px-5 py-8">
      <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-pnc-orange">
        Tap notification
      </p>

      <div className="rounded-2xl p-0.5 ring-4 ring-pnc-orange/40">
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            "w-full rounded-2xl border-2 border-pnc-orange bg-white p-4 text-left shadow-lg transition-colors",
            "hover:bg-orange-50 active:bg-orange-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pnc-orange"
          )}
          aria-label="Open invite email"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pnc-orange text-white shadow-md">
              <Bell className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 pt-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-pnc-navy">LegacyAI</p>
                <p className="shrink-0 text-[11px] text-pnc-slate">now</p>
              </div>
              <p className="mt-1 text-sm font-medium leading-snug text-pnc-navy">
                New message from your advisor
              </p>
              <p className="mt-1 text-xs leading-relaxed text-pnc-slate">
                Open your invite email to begin the LegacyAI planning intake.
              </p>
            </div>
          </div>
        </button>
      </div>

      <p className="text-center text-xs text-pnc-slate">
        Opens the email next — not the chatbot yet
      </p>
    </div>
  );
}

/** Step 2 — email inside the same phone frame; CTA starts intake. */
function InviteEmail({
  firstName,
  lastName,
  onBack,
  onStartIntake,
}: {
  firstName: string;
  lastName: string;
  onBack: () => void;
  onStartIntake: () => void;
}) {
  return (
    <div className="flex h-full min-h-[520px] flex-1 flex-col bg-[#eef1f6]">
      <div className="flex shrink-0 items-center gap-2 border-b border-pnc-border bg-white px-2 py-2.5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-0.5 rounded-md px-2 py-1.5 text-sm font-medium text-pnc-blue hover:bg-pnc-bg"
          aria-label="Back to notification"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Inbox
        </button>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
          <Mail className="h-4 w-4 shrink-0 text-pnc-blue" aria-hidden />
          <span className="truncate text-sm font-semibold text-pnc-navy">
            Mail
          </span>
        </div>
        <span className="w-14 shrink-0" aria-hidden />
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-3">
        <article className="flex flex-1 flex-col rounded-xl bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-pnc-orange">
            Invite email
          </p>
          <h2 className="mt-2 text-base font-bold leading-snug text-pnc-navy">
            Your LegacyAI planning invite
          </h2>

          <dl className="mt-3 space-y-1.5 border-b border-pnc-border pb-3 text-xs">
            <div className="flex gap-2">
              <dt className="w-12 shrink-0 text-pnc-slate">From</dt>
              <dd className="font-medium text-pnc-navy">
                LegacyAI Concierge
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-12 shrink-0 text-pnc-slate">To</dt>
              <dd className="font-medium text-pnc-navy">
                {firstName} {lastName}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-12 shrink-0 text-pnc-slate">Subject</dt>
              <dd className="font-medium text-pnc-navy">
                Start your emergency-fund plan
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex-1 space-y-3 text-sm leading-relaxed text-pnc-navy">
            <p>Hi {firstName},</p>
            <p>
              Your relationship manager invited you to complete a short{" "}
              <strong>LegacyAI</strong> intake. In a few questions, we&apos;ll
              sketch how to split your fund across Liquidity, Safe Investment,
              and Growth.
            </p>
            <p>
              This is guidance only. An RM reviews every recommendation before
              you act. Optional details are skippable anytime.
            </p>
            <p className="text-xs text-pnc-slate">
              Demo prototype · synthetic data · not a real bank email
            </p>
          </div>

          <Button
            type="button"
            className="mt-5 w-full"
            onClick={onStartIntake}
          >
            Open intake chat
          </Button>
        </article>
      </div>
    </div>
  );
}

export default function CustomerNotificationPage() {
  const router = useRouter();
  const customers = useDemoStore((s) => s.customers);
  const setNotificationSeen = useDemoStore((s) => s.setNotificationSeen);
  const setRole = useDemoStore((s) => s.setRole);
  const featured =
    customers.find((c) => c.featured) ?? getFeaturedCustomer();
  const [step, setStep] = useState<DemoStep>("push");

  function openEmail() {
    setNotificationSeen(true);
    setStep("email");
  }

  function startIntake() {
    setRole("customer");
    router.push("/customer/chat");
  }

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    function apply() {
      document.body.classList.toggle("demo-mobile-immersive", mq.matches);
    }
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      document.body.classList.remove("demo-mobile-immersive");
    };
  }, []);

  const screen =
    step === "push" ? (
      <PushNotification onOpen={openEmail} />
    ) : (
      <InviteEmail
        firstName={featured.firstName}
        lastName={featured.lastName}
        onBack={() => setStep("push")}
        onStartIntake={startIntake}
      />
    );

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 lg:max-w-none">
      <div className="hidden items-center justify-between gap-3 lg:flex">
        <div>
          <h1 className="text-2xl font-bold text-pnc-navy">Use AI Demo</h1>
          <p className="mt-1 text-sm text-pnc-slate">
            Notification → email → intake
          </p>
        </div>
        <Link
          href="/rm"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-pnc-blue hover:text-pnc-blue-light"
        >
          Go to RM Dashboard
          <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="-mx-3 flex justify-center lg:mx-0 lg:py-2">
        <PhoneFrame
          title={step === "push" ? "Messages" : "Mail"}
          className="max-lg:max-w-none"
          chrome
        >
          {screen}
        </PhoneFrame>
      </div>
    </div>
  );
}
