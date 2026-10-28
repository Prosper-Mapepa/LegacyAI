"use client";

import { useMemo } from "react";
import { CustomerPanel } from "@/components/rm/customer-panel";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobileLg } from "@/hooks/use-media-query";
import { scoreCustomer } from "@/lib/ai";
import { avgYearlySpending, cn, formatCurrency } from "@/lib/utils";
import {
  matchesBalanceTarget,
  useDemoStore,
  type OutreachTarget,
} from "@/store/demo-store";
import { BalanceTargetControl } from "./balance-target";

const STATUS_VARIANT: Record<
  string,
  "muted" | "default" | "warning" | "orange" | "success"
> = {
  New: "muted",
  Approved: "default",
  Notified: "warning",
  Engaged: "orange",
  "Meeting booked": "success",
};

/** Step 1 — ranked client book with figures and full report panel (read-only actions). */
export function ClientAnalysisBook({
  target,
}: {
  target?: OutreachTarget;
}) {
  const customers = useDemoStore((s) => s.customers);
  const selectedCustomerId = useDemoStore((s) => s.selectedCustomerId);
  const selectCustomer = useDemoStore((s) => s.selectCustomer);
  const outreachTarget = useDemoStore((s) => s.outreachTarget);
  const filter = target ?? outreachTarget;
  const isMobile = useIsMobileLg();

  const rows = useMemo(() => {
    return customers
      .filter((c) => matchesBalanceTarget(c.balance, filter))
      .map((c) => {
        const yearly = avgYearlySpending(c.spendingHistory);
        return {
          customer: c,
          yearly,
          score: scoreCustomer(c),
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [customers, filter]);

  const selected =
    customers.find((c) => c.id === selectedCustomerId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Calculated figures across the book. Open a row for the full report.
        </p>
        <BalanceTargetControl />
      </div>

      <div className="space-y-2 lg:hidden">
        {rows.map(({ customer, yearly, score }) => {
          const active = customer.id === selectedCustomerId;
          return (
            <button
              key={customer.id}
              type="button"
              onClick={() => selectCustomer(customer.id)}
              className={cn(
                "w-full rounded-lg border border-pnc-border bg-white p-3 text-left shadow-sm transition-colors",
                active &&
                  "border-pnc-orange bg-orange-50/70 ring-1 ring-pnc-orange/40",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-pnc-navy">
                    {customer.firstName} {customer.lastName}
                    {customer.featured && (
                      <span className="ml-2 text-[10px] font-semibold uppercase text-pnc-orange">
                        Featured
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-pnc-slate">
                    {formatCurrency(customer.balance)} ·{" "}
                    {formatCurrency(yearly)}/yr spend
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="inline-flex h-7 min-w-[2rem] items-center justify-center rounded bg-pnc-navy px-2 text-xs font-bold text-white">
                    {score}
                  </span>
                  <Badge variant={STATUS_VARIANT[customer.status] ?? "muted"}>
                    {customer.status}
                  </Badge>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-pnc-slate">
                  Other: {formatCurrency(customer.otherYearlyEarnings)}
                </span>
                <span className="text-xs font-medium text-pnc-navy">
                  Age {customer.age}
                </span>
              </div>
            </button>
          );
        })}
        {rows.length === 0 && (
          <p className="rounded-lg border border-pnc-border bg-white p-6 text-sm text-pnc-slate">
            No customers match this filter.
          </p>
        )}
      </div>

      <div
        className={cn(
          "hidden gap-0 rounded-lg border border-pnc-border bg-white lg:grid",
          selected ? "lg:grid-cols-[1fr_380px]" : "",
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">
              Clients ranked for LegacyAI analysis
            </caption>
            <thead className="border-b border-pnc-border bg-pnc-bg text-xs uppercase tracking-wide text-pnc-slate">
              <tr>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Name
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Balance
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Avg yearly spending
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Other earnings
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Age
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  AI priority
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ customer, yearly, score }) => {
                const active = customer.id === selectedCustomerId;
                return (
                  <tr
                    key={customer.id}
                    tabIndex={0}
                    onClick={() => selectCustomer(customer.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectCustomer(customer.id);
                      }
                    }}
                    className={cn(
                      "cursor-pointer border-b border-pnc-border outline-none hover:bg-blue-50/60 focus-visible:bg-blue-50",
                      active && "bg-orange-50/70",
                      customer.featured && "font-medium",
                    )}
                    aria-selected={active}
                  >
                    <td className="px-3 py-2.5 text-pnc-navy">
                      {customer.firstName} {customer.lastName}
                      {customer.featured && (
                        <span className="ml-2 text-[10px] font-semibold uppercase text-pnc-orange">
                          Featured
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {formatCurrency(customer.balance)}
                    </td>
                    <td className="px-3 py-2.5">{formatCurrency(yearly)}</td>
                    <td className="px-3 py-2.5">
                      {formatCurrency(customer.otherYearlyEarnings)}
                    </td>
                    <td className="px-3 py-2.5">{customer.age}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex h-7 min-w-[2rem] items-center justify-center rounded bg-pnc-navy px-2 text-xs font-bold text-white">
                        {score}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge
                        variant={STATUS_VARIANT[customer.status] ?? "muted"}
                      >
                        {customer.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="p-6 text-sm text-pnc-slate">
              No customers match this filter.
            </p>
          )}
        </div>

        {selected && (
          <div className="min-h-[520px]">
            <CustomerPanel
              customer={selected}
              plan={null}
              mode="analysis"
              onClose={() => selectCustomer(null)}
            />
          </div>
        )}
      </div>

      <Sheet
        open={isMobile && !!selected}
        onOpenChange={(open) => {
          if (!open) selectCustomer(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full max-w-full p-0 sm:max-w-md [&>button]:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>
              {selected
                ? `${selected.firstName} ${selected.lastName}`
                : "Customer"}
            </SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="h-full min-h-0 overflow-hidden">
              <CustomerPanel
                customer={selected}
                plan={null}
                mode="analysis"
                onClose={() => selectCustomer(null)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {!selected && (
        <p className="text-sm text-muted">
          Select a customer to open the full report. Tip: start with{" "}
          <button
            type="button"
            className="font-semibold text-blue underline"
            onClick={() => {
              const featured = customers.find((c) => c.featured);
              if (featured) selectCustomer(featured.id);
            }}
          >
            Heir Whitfield
          </button>
          .
        </p>
      )}
    </div>
  );
}
