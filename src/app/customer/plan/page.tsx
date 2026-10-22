"use client";

import { PhoneFrame } from "@/components/phone-frame";
import { PlannerApp } from "@/components/planner/planner-app";

export default function CustomerPlanPage() {
  return (
    <div className="space-y-4">
      <div className="text-center md:text-left">
        <h1 className="text-xl font-bold text-pnc-navy sm:text-2xl">
          Your LegacyAI plan
        </h1>
        <p className="hidden text-sm text-pnc-slate md:block">
          Customer view — rendered in a mobile frame for the demo journey.
        </p>
      </div>
      <div className="flex justify-center">
        <PhoneFrame title="Your plan">
          <div className="p-3 sm:p-4">
            <PlannerApp title="Your plan" stacked />
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
}
