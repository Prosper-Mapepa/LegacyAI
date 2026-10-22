"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Mail } from "lucide-react";
import { PhoneFrame } from "@/components/phone-frame";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFeaturedCustomer } from "@/data/mock";
import { useDemoStore } from "@/store/demo-store";
import { cn } from "@/lib/utils";

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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
          <h1 className="text-xl font-bold text-pnc-navy sm:text-2xl">
            Customer notification
          </h1>
          <Link
            href="/rm"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-pnc-blue hover:text-pnc-blue-light"
          >
            Go to RM dashboard
            <span aria-hidden>→</span>
          </Link>
        </div>
        <p className="text-sm text-pnc-navy/80">
          {notified
            ? "Tap the highlighted notification to open the AI chatbot and complete your intake."
            : "Tap the highlighted notification to interact with the AI chatbot, or send it from the RM dashboard first."}
        </p>
      </div>

      <Tabs defaultValue="push">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="push" className="flex-1 sm:flex-none">
            Push
          </TabsTrigger>
          <TabsTrigger value="email" className="flex-1 sm:flex-none">
            Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="push">
          <div className="flex justify-end py-4">
            <PhoneFrame title="Messages">
              <div className="flex min-h-[560px] flex-col gap-3 bg-gradient-to-b from-slate-100 to-slate-200 p-4">
                <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-pnc-orange">
                  Tap notification
                </p>

                <div className="rounded-2xl p-0.5 ring-4 ring-pnc-orange/40">
                  <button
                    type="button"
                    onClick={openIntake}
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
                        <p className="text-xs font-medium text-pnc-slate">
                          Now
                        </p>
                        <p className="mt-1 text-sm font-semibold text-pnc-navy">
                          Ready to plan your emergency fund?
                        </p>
                        <p className="mt-1 text-xs text-pnc-slate">
                          Your relationship manager invited you to a short
                          intake. Tap to get started.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
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
              <p>
                <span className="text-pnc-slate">From:</span> LegacyAI Concierge
                &lt;legacyai@example-bank.test&gt;
              </p>
              <p>
                <span className="text-pnc-slate">To:</span> {featured.firstName}{" "}
                {featured.lastName}
              </p>
              <p>
                <span className="text-pnc-slate">Subject:</span> Your LegacyAI
                emergency-fund invitation
              </p>
              <hr className="border-pnc-border" />
              <p className="text-pnc-navy">Hi {featured.firstName},</p>
              <p className="text-pnc-navy">
                Based on your relationship with us, your advisor invited you to
                try <strong>LegacyAI</strong> — a short, guided way to think
                about diversifying your fund across Liquidity, Safe Investment,
                and Growth.
              </p>
              <p className="text-pnc-navy">
                Everything is guidance only. An RM reviews recommendations before
                you act. Optional health details personalize your emergency
                buffer only and are never used for eligibility or pricing.
              </p>
              <Button type="button" onClick={openIntake}>
                Start LegacyAI intake
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
