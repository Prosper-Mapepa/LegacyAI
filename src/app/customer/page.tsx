"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Mail } from "lucide-react";
import { PhoneFrame } from "@/components/phone-frame";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFeaturedCustomer } from "@/data/mock";
import { useDemoStore } from "@/store/demo-store";
import { cn } from "@/lib/utils";

function NotificationCard({
  firstName,
  onOpen,
}: {
  firstName: string;
  onOpen: () => void;
}) {
  return (
    <div className="flex min-h-[560px] flex-1 flex-col gap-3 bg-gradient-to-b from-slate-100 to-slate-200 p-4 md:min-h-0">
      <div className="rounded-xl bg-white p-4 shadow-sm md:hidden">
        <p className="text-sm text-pnc-slate">Home</p>
        <p className="mt-2 text-lg font-semibold text-pnc-navy">
          Good afternoon, {firstName}
        </p>
      </div>

      <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-pnc-orange">
        Tap notification
      </p>

      <div className="rounded-2xl p-0.5 ring-4 ring-pnc-orange/40">
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            "w-full rounded-2xl border-2 border-pnc-orange bg-white p-4 text-left shadow-lg",
            "hover:bg-orange-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pnc-orange"
          )}
          aria-label="Open invitation — tap to continue"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pnc-orange text-white shadow-md">
              <Bell className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-medium text-pnc-slate">Now</p>
              <p className="mt-1 text-sm font-semibold text-pnc-navy">
                [Demo] Ready to plan your emergency fund?
              </p>
              <p className="mt-1 text-xs text-pnc-slate">
                Demo invite from your RM. Synthetic data only — tap to open the
                AI chatbot intake.
              </p>
            </div>
          </div>
        </button>
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

  const notified =
    featured.status === "Notified" ||
    featured.status === "Engaged" ||
    featured.status === "Meeting booked";

  function openIntake() {
    setNotificationSeen(true);
    setRole("customer");
    router.push("/customer/chat");
  }

  // Immersive mobile: lock page chrome / footer under the notification screen.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
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

  return (
    <div className="md:space-y-4">
      {/* Page chrome — desktop / tablet only */}
      <div className="mb-4 hidden space-y-2 md:block">
        <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
          <h1 className="text-xl font-bold text-pnc-navy sm:text-2xl">
            Use AI Demo
          </h1>
          <Link
            href="/rm"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-pnc-blue hover:text-pnc-blue-light"
          >
            Go to RM Dashboard
            <span aria-hidden>→</span>
          </Link>
        </div>
        <p className="text-sm text-pnc-navy/80">
          {notified
            ? "Tap the highlighted notification to open the AI chatbot and complete your intake."
            : "Tap the highlighted notification to interact with the AI chatbot, or send it from the RM dashboard first."}
        </p>
      </div>

      {/* Desktop: tabs + phone frame */}
      <div className="hidden md:block">
        <Tabs defaultValue="push">
          <TabsList>
            <TabsTrigger value="push">Push</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="push">
            <div className="flex justify-end py-4">
              <PhoneFrame title="Messages">
                <NotificationCard
                  firstName={featured.firstName}
                  onOpen={openIntake}
                />
              </PhoneFrame>
            </div>
          </TabsContent>

          <TabsContent value="email">
            <div className="mx-auto max-w-xl rounded-lg border border-pnc-border bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-pnc-border bg-pnc-bg px-4 py-3">
                <Mail className="h-4 w-4 text-pnc-blue" aria-hidden />
                <span className="text-sm font-semibold text-pnc-navy">
                  Email preview
                </span>
              </div>
              <div className="space-y-3 p-5 text-sm">
                <p className="rounded-md bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-950">
                  Mock email preview for this demo — not a real message from a
                  bank.
                </p>
                <p>
                  <span className="text-pnc-slate">From:</span> LegacyAI Demo
                  &lt;demo@legacyai.example&gt;
                </p>
                <p>
                  <span className="text-pnc-slate">To:</span>{" "}
                  {featured.firstName} {featured.lastName}{" "}
                  <span className="text-pnc-slate">(synthetic)</span>
                </p>
                <p>
                  <span className="text-pnc-slate">Subject:</span> [DEMO]
                  LegacyAI emergency-fund invitation
                </p>
                <hr className="border-pnc-border" />
                <p className="text-pnc-navy">Hi {featured.firstName},</p>
                <p className="text-pnc-navy">
                  This is a <strong>clickable prototype</strong>. Your advisor
                  (in the demo) invited you to try <strong>LegacyAI</strong>.
                </p>
                <Button type="button" onClick={openIntake}>
                  Start LegacyAI Intake
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile: immersive notification only — no page title / tabs */}
      <div className="-mx-3 -mt-3 md:hidden">
        <div className="min-h-[calc(100dvh-3.5rem)] bg-gradient-to-b from-slate-100 to-slate-200">
          <NotificationCard
            firstName={featured.firstName}
            onOpen={openIntake}
          />
        </div>
      </div>
    </div>
  );
}
