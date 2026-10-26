import { writeBrief } from "@/domain/brief";
import { seedHouseholds } from "@/domain/seed";
import { assessHousehold, rankBook } from "@/domain/signal";
import type { Household } from "@/domain/types";

export async function GET() {
  const now = new Date();
  const ranked = rankBook(seedHouseholds, now).map((assessment) => ({
    ...assessment,
    brief: writeBrief(
      seedHouseholds.find((item) => item.id === assessment.householdId)!,
      assessment,
    ),
  }));
  return Response.json({
    book: "Advisor · Pittsburgh pilot",
    scenario: "inheritance before the transfer",
    ranked,
  });
}

function isHeir(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const heir = value as Record<string, unknown>;
  return typeof heir.id === "string" && typeof heir.firstName === "string";
}

function isHousehold(value: unknown): value is Household {
  if (!value || typeof value !== "object") return false;
  const household = value as Household;
  return (
    typeof household.id === "string" &&
    typeof household.reviewOn === "string" &&
    Array.isArray(household.heirs) &&
    household.heirs.every(isHeir) &&
    Boolean(household.principal?.firstName) &&
    Boolean(household.advisor?.name)
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a household record as JSON." }, { status: 400 });
  }
  const payload = body as { household?: unknown; now?: string };
  if (!isHousehold(payload.household)) {
    return Response.json(
      { error: "The body needs a household with an id, review date, principal, advisor, and heirs." },
      { status: 400 },
    );
  }
  const now = payload.now ? new Date(payload.now) : new Date();
  if (Number.isNaN(now.getTime())) {
    return Response.json({ error: "The now field is not a date." }, { status: 400 });
  }
  const assessment = assessHousehold(payload.household, now);
  return Response.json({
    assessment,
    brief: writeBrief(payload.household, assessment),
  });
}
