"use client";

import { formatCurrency } from "@/lib/utils";
import {
  type BalanceOperator,
  useDemoStore,
} from "@/store/demo-store";

const OPERATORS: { value: BalanceOperator; label: string }[] = [
  { value: "gte", label: "≥" },
  { value: "gt", label: ">" },
  { value: "lte", label: "≤" },
  { value: "lt", label: "<" },
];

const PRESETS = [50_000, 100_000, 250_000, 500_000] as const;

export function BalanceTargetControl() {
  const target = useDemoStore((s) => s.outreachTarget);
  const setOutreachTarget = useDemoStore((s) => s.setOutreachTarget);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-white px-3 py-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-ink">
        <input
          type="checkbox"
          checked={target.enabled}
          onChange={(e) => setOutreachTarget({ enabled: e.target.checked })}
          className="h-4 w-4 accent-orange"
        />
        Target
      </label>

      <select
        aria-label="Balance comparison"
        disabled={!target.enabled}
        value={target.operator}
        onChange={(e) =>
          setOutreachTarget({ operator: e.target.value as BalanceOperator })
        }
        className="h-9 rounded-lg border border-line bg-mist px-2 text-sm font-bold text-ink disabled:opacity-40"
      >
        {OPERATORS.map((op) => (
          <option key={op.value} value={op.value}>
            balance {op.label}
          </option>
        ))}
      </select>

      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
          $
        </span>
        <input
          type="text"
          inputMode="numeric"
          aria-label="Minimum balance target"
          disabled={!target.enabled}
          value={target.amount.toLocaleString("en-US")}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, "");
            setOutreachTarget({ amount: raw ? Number(raw) : 0 });
          }}
          className="h-9 w-[7.5rem] rounded-lg border border-line bg-white pl-6 pr-2 text-sm font-semibold text-ink disabled:opacity-40"
        />
      </div>

      <div className="flex flex-wrap gap-1">
        {PRESETS.map((amount) => {
          const active = target.enabled && target.amount === amount;
          return (
            <button
              key={amount}
              type="button"
              disabled={!target.enabled}
              onClick={() => setOutreachTarget({ amount })}
              className={`h-8 rounded-md px-2 text-xs font-bold transition disabled:opacity-40 ${
                active
                  ? "bg-orange text-ink"
                  : "bg-mist text-muted hover:text-ink"
              }`}
            >
              {formatCurrency(amount, true)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
