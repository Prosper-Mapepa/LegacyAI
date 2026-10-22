"use client";

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function HowItWorks({
  iconOnly = false,
}: {
  /** Compact trigger for narrow headers */
  iconOnly?: boolean;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {iconOnly ? (
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label="How this works"
          >
            <Info className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Info className="h-4 w-4" aria-hidden />
            How this works
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>How LegacyAI works</SheetTitle>
          <SheetDescription>
            Transparency for this clickable prototype.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4 text-sm text-pnc-navy">
          <p>
            The AI uses customer-provided and consented data only, and an RM
            reviews every recommendation before the customer acts.
          </p>
          <p>
            Optional health-related inputs (medication expense, habits, and
            current conditions) affect only the emergency buffer sizing. They
            are never used for eligibility, pricing, or product selection.
          </p>
          <p>
            Raw health text is mapped on-device into a coarse band and discarded
            immediately. The RM view never shows raw health or habit inputs —
            only a qualitative emergency-exposure label and the recommended
            plan.
          </p>
          <p>
            Allocation weights are configurable defaults a bank&apos;s advisors
            would calibrate. This experience is guidance only, not financial
            advice.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
