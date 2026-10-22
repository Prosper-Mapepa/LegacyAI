"use client";

import { useMemo, useState } from "react";
import { Sparkline } from "@/components/rm/sparkline";
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
import { useDemoStore } from "@/store/demo-store";

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

export default function RmDashboardPage() {
  const customers = useDemoStore((s) => s.customers);
  const selectedCustomerId = useDemoStore((s) => s.selectedCustomerId);
  const selectCustomer = useDemoStore((s) => s.selectCustomer);
  const approveOutreach = useDemoStore((s) => s.approveOutreach);
  const sendNotification = useDemoStore((s) => s.sendNotification);
  const bookMeeting = useDemoStore((s) => s.bookMeeting);
  const planSnapshot = useDemoStore((s) => s.planSnapshot);
  const [filter100k, setFilter100k] = useState(true);
  const isMobile = useIsMobileLg();

  const rows = useMemo(() => {
    return customers
      .filter((c) => (filter100k ? c.balance >= 100_000 : true))
      .map((c) => {
        const yearly = avgYearlySpending(c.spendingHistory);
        const spark = c.spendingHistory
          .filter((_, i) => i % 3 === 0)
          .map((r, i) => ({ i, v: r.amount }));
        return {
          customer: c,
          yearly,
          spark,
          score: scoreCustomer(c),
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [customers, filter100k]);

  const selected =
    customers.find((c) => c.id === selectedCustomerId) ?? null;

  const panelProps = selected
    ? {
        customer: selected,
        plan: planSnapshot,
        onApprove: () => approveOutreach(selected.id),
        onNotify: () => sendNotification(selected.id),
        onBook: () => bookMeeting(selected.id),
        onClose: () => selectCustomer(null),
      }
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-pnc-navy sm:text-2xl">
            RM Dashboard
          </h1>
          <p className="text-sm text-pnc-slate">
            AI-prioritized customers for LegacyAI outreach.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-pnc-navy">
          <input
            type="checkbox"
            checked={filter100k}
            onChange={(e) => setFilter100k(e.target.checked)}
            className="h-4 w-4 accent-pnc-orange"
          />
          Target: balance ≥ $100,000
        </label>
      </div>

      {/* Mobile card list */}
      <div className="space-y-2 lg:hidden">
        {rows.map(({ customer, yearly, spark, score }) => {
          const active = customer.id === selectedCustomerId;
          return (
            <button
              key={customer.id}
              type="button"
              onClick={() => selectCustomer(customer.id)}
              className={cn(
                "w-full rounded-lg border border-pnc-border bg-white p-3 text-left shadow-sm transition-colors",
                active && "border-pnc-orange bg-orange-50/70 ring-1 ring-pnc-orange/40"
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
                <Sparkline
                  data={spark}
                  ariaLabel={`Five-year spending trend for ${customer.firstName}`}
                />
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

      {/* Desktop table + side panel */}
      <div
        className={cn(
          "hidden gap-0 rounded-lg border border-pnc-border bg-white lg:grid",
          selected ? "lg:grid-cols-[1fr_380px]" : ""
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">
              Customers prioritized for LegacyAI outreach
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
                  5-yr spending
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
              {rows.map(({ customer, yearly, spark, score }) => {
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
                      customer.featured && "font-medium"
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
                    <td className="px-3 py-2.5">
                      <Sparkline
                        data={spark}
                        ariaLabel={`Five-year spending trend for ${customer.firstName}`}
                      />
                    </td>
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

        {panelProps && (
          <div className="min-h-[520px]">
            <CustomerPanel {...panelProps} />
          </div>
        )}
      </div>

      {/* Mobile detail sheet */}
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
          {panelProps && (
            <div className="h-full min-h-0 overflow-hidden">
              <CustomerPanel {...panelProps} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {!selected && (
        <p className="text-sm text-pnc-slate">
          Select a customer to open details. Tip: start with the{" "}
          <button
            type="button"
            className="font-semibold text-pnc-blue underline"
            onClick={() => {
              const featured = customers.find((c) => c.featured);
              if (featured) selectCustomer(featured.id);
            }}
          >
            featured customer
          </button>
          .
        </p>
      )}
    </div>
  );
}
