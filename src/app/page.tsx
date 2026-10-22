import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="rounded-xl bg-gradient-to-br from-pnc-navy via-[#0d3a6e] to-pnc-blue px-4 py-8 text-white sm:px-6 sm:py-12 md:px-10">
        <h1 className="max-w-2xl text-2xl font-bold tracking-tight leading-[1.25] sm:text-3xl md:text-4xl md:leading-[1.3]">
          <span className="text-ai-glow">AI-assisted</span>
          <span className="mt-1 block text-white">
            wealth transition &amp; emergency-fund diversification
          </span>
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-blue-100 md:text-base">
          A clickable prototype: identify $100K+ customers, approve outreach,
          complete intake, and guide Liquidity / Safe / Growth diversification
          from qualitative emergency exposure — with RM review before action.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/rm">Start as RM</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full border-white/40 bg-white/10 text-white hover:bg-white/20 sm:w-auto"
          >
            <Link href="/planner">Open planner</Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. RM outreach</CardTitle>
            <CardDescription className="text-[0.95em] text-pnc-navy/75">
              Filter $100K+, approve, and notify the featured customer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" size="sm">
              <Link href="/rm">RM dashboard</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Customer intake</CardTitle>
            <CardDescription className="text-[0.95em] text-pnc-navy/75">
              Notification → chatbot intake with optional health consent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" size="sm">
              <Link href="/customer">Customer view</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Live plan</CardTitle>
            <CardDescription className="text-[0.95em] text-pnc-navy/75">
              Instant recompute of exposure label and diversification guidance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" size="sm">
              <Link href="/planner">Planner</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
