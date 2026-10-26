# LegacyAI

One complete demo flow for inheritance continuity and wealth transition.

## Full path

Shared chrome on every advisor stage: step rail, orange **Next**, matching headers, and a **briefing modal** before each step.

**Roles (same Pilot family everywhere):** Advisor · Principal · Heir · Sibling

1. **Signal** — `/dashboard`
2. **Book** — `/workbench` → Pilot family desk
3. **Hub** — `/hub/whitmore` · Principal invites Heir and **allows a call**
4. **Outreach** — `/rm` · unlocked only after Hub approval · **Heir Pilot**
5. **Intake** — `/customer` → `/customer/chat` · last name **Pilot**
6. **Plan** — `/customer/plan`

Synthetic pilot data only. Not financial advice.

## Setup

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Start full demo** (Advisor seat, password `LegacyAI1`).

## Notes

- Outreach stays locked until Heir is invited and a call is allowed in the Hub.
- `/planner` redirects to `/customer/plan` (one plan surface).
- Ask LegacyAI is desk Q&A; intake chat is the Heir journey step.
- **Reset demo** clears continuity book and wealth demo store together.
