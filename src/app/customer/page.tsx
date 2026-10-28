"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronLeft } from "lucide-react";
import { IntakeGate } from "@/components/intake-gate";
import {
  INTAKE_PHONE_CLASS,
  IntakeChecklist,
  IntakeStage,
} from "@/components/intake-stage";
import { PhoneFrame } from "@/components/phone-frame";
import { Button } from "@/components/ui/button";
import { getFeaturedCustomer } from "@/data/mock";
import { useIsMobileLg } from "@/hooks/use-media-query";
import { useDemoStore } from "@/store/demo-store";
import { cn } from "@/lib/utils";

type DemoStep = "push" | "email";

/** Step 1 — push notification (top of screen). */
function PushNotification({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 bg-gradient-to-b from-slate-100 to-slate-200 px-4 pt-4 pb-8">
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
              <Bell className="notif-bell-vibrate h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 pt-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-pnc-navy">LegacyAI</p>
                <p className="shrink-0 text-[11px] text-pnc-slate">now</p>
              </div>
              <p className="mt-1 text-sm font-medium leading-snug text-pnc-navy">
                Your advisor invited your family to LegacyAI. Tap to review
                securely in the app.
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

/** Step 2 — full-bleed mail layout; CTA opens intake. */
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
    <div className="flex h-full min-h-0 flex-1 flex-col bg-white">
      <header className="flex shrink-0 items-center gap-1 border-b border-pnc-border px-2 py-2.5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-0.5 rounded-md px-2 py-1.5 text-sm font-semibold text-pnc-blue hover:bg-pnc-bg"
          aria-label="Back to notification"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
          Inbox
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold leading-snug tracking-tight text-pnc-navy">
          Your LegacyAI planning invite
        </h2>

        <div className="mt-4 flex items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pnc-blue text-sm font-bold text-white"
            aria-hidden
          >
            L
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-semibold text-pnc-navy">
                LegacyAI Concierge
              </p>
              <p className="shrink-0 text-[11px] text-pnc-slate">Today</p>
            </div>
            <p className="mt-0.5 text-xs text-pnc-slate">
              to {firstName} {lastName}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3.5 text-[15px] leading-relaxed text-pnc-navy">
          <p>Hi {firstName},</p>
          <p>
            Your Advisor invited you (the Heir on Whitfield family) to complete a short{" "}
            <strong>LegacyAI</strong> intake. Answer a few questions and we
            will sketch how to split your fund across Liquidity, Safe
            Investment, and Growth.
          </p>
          <p>
            Guidance only — an RM reviews every recommendation before you act.
            Optional details can be skipped anytime.
          </p>
          <p className="text-xs leading-normal text-pnc-slate">
            Demo prototype · synthetic data · not a real bank email
          </p>
        </div>
      </div>

      <div className="shrink-0 border-t border-pnc-border bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button type="button" className="h-11 w-full text-base" onClick={onStartIntake}>
          Open intake chat
        </Button>
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
  const isMobile = useIsMobileLg();

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
    <IntakeGate>
      <IntakeStage
        title="Customer intake"
        body="Work in the phone. When the chat is done, use Next: Plan above."
        ariaLabel="Customer intake"
        nextHref="/customer/chat"
        nextStepId="intake"
        nextLabel="Next: Chat →"
        nextDisabled={step !== "email"}
        nextDisabledHint="Open the invite email and start intake first"
        aside={
          <>
            <IntakeChecklist
              items={[
                {
                  n: 1,
                  label: "Tap the notification",
                  done: step !== "push",
                  active: step === "push",
                },
                {
                  n: 2,
                  label: "Open the invite email",
                  done: step === "email",
                  active: step === "email",
                },
                {
                  n: 3,
                  label: "Start intake chat",
                  done: false,
                  active: step === "email",
                },
              ]}
            />
            <p className="mt-4 text-sm text-white/70">
              Last name for the chat:{" "}
              <strong className="text-white">{featured.lastName}</strong>
            </p>
          </>
        }
        phone={
          <PhoneFrame
            title={step === "push" ? "Messages" : "Mail"}
            className={cn(
              isMobile ? "h-full max-w-none" : INTAKE_PHONE_CLASS,
            )}
            fillHeight
            chrome={!isMobile}
          >
            {screen}
          </PhoneFrame>
        }
      />
    </IntakeGate>
  );
}
