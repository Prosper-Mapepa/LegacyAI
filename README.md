# LegacyAI (prototype)

Clickable prototype of an AI-assisted wealth-transition and emergency-fund diversification flow for a bank. **Synthetic data only — not financial advice.**

Stack: Next.js (App Router), TypeScript, Tailwind CSS, shadcn-style Radix UI, Recharts, Zustand, Vitest.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm test          # Vitest unit tests for /lib/ai.ts
npm run build     # Production build
```

## Demo script (~2 minutes)

1. **RM filters $100K+** — Open **RM view** → `/rm`. Confirm “Target: balance ≥ $100,000” is on. Find **Jordan Whitfield** (Featured).
2. **Open featured customer** — Click the row. Side panel shows spending charts and a plain-English “why this customer” summary.
3. **Approve and notify** — Click **Approve outreach**, then **Send notification**. Status becomes **Notified**.
4. **Customer notification** — Switch to **Customer view** → `/customer`. Tap the push notification (or use the email tab) to open intake.
5. **Intake with / without health fields** — Complete the chat: confirm last name `Whitfield`, answer basics, then either continue through optional medication / habits / conditions or **Skip all**. End with contact method + time. Status becomes **Engaged**; a plan preview appears.
6. **Plan updates instantly** — Open `/customer/plan` or `/planner`. Change age, expenses, or optional health fields — the exposure label and Liquidity / Safe / Growth donut recompute after ~300ms (no risk % shown).
7. **Heir transfer** — Scroll to **Heir transfer** (Maya Whitfield). Choose **Save** or **Reinvest with LegacyAI**.
8. **RM books meeting** — Switch back to **RM view**, open Jordan, review exposure label + plan (no raw health data), click **Book meeting**.

Use **Reset demo** in the header anytime to clear `localStorage` state.

## Architecture notes

| Path | Role |
|------|------|
| `/data/mock.ts` | 15 synthetic customers, 5 years of monthly spending, featured heir |
| `/lib/ai.ts` | Pure typed “AI”: `scoreCustomer`, `summarizeSpending`, `assessEmergencyExposure`, `recommendAllocation`, `explainAllocation`, `projectGrowth` |
| `/lib/types.ts` | Shared types including `PlannerInput` |
| `/store/demo-store.ts` | Zustand + localStorage; never persists raw health text |
| `/rm` | Relationship manager dashboard |
| `/customer` | Notification (phone frame) |
| `/customer/chat` | Intake chatbot |
| `/customer/plan`, `/planner` | Live diversification planner |

Sensitive inputs are consent-gated, individually skippable, reduced to coarse bands on the client, and discarded from persistence. They affect **only** the emergency buffer — never eligibility, pricing, or product selection.
