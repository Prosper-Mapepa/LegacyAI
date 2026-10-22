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
    <div className="flex min-h-0 flex-col gap-4 md:gap-5">
      <section className="rounded-xl bg-gradient-to-br from-pnc-navy via-[#0d3a6e] to-pnc-blue px-4 py-6 text-white sm:px-6 sm:py-8 md:px-10 md:py-9">
        <h1 className="max-w-2xl text-2xl font-bold tracking-tight leading-[1.25] sm:text-3xl md:text-4xl md:leading-[1.3]">
          <span className="text-ai-glow">AI-Assisted</span>
          <span className="mt-1 block text-white">
            Wealth Transition &amp; Emergency-Fund Diversification
          </span>
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100 md:mt-4 md:text-base">
          A clickable prototype: identify $100K+ customers, approve outreach,
          complete intake, and guide Liquidity / Safe / Growth diversification
          from qualitative emergency exposure — with RM review before action.
        </p>
        <div className="mt-4 flex flex-col gap-2.5 sm:mt-5 sm:flex-row sm:flex-wrap sm:gap-3">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/customer">Use AI Demo</Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            className="w-full sm:w-auto"
          >
            <Link href="/customer/chat">Chat</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full border-white/40 bg-white/10 text-white hover:bg-white/20 sm:w-auto"
          >
            <Link href="/rm">Start As RM</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full border-white/40 bg-white/10 text-white hover:bg-white/20 sm:w-auto"
          >
            <Link href="/planner">Open Planner</Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
        <Card className="shadow-none">
          <CardHeader className="pb-2 pt-4 sm:pt-5">
            <CardTitle className="text-base">1. RM Outreach</CardTitle>
            <CardDescription className="text-[0.95em] text-pnc-navy/75">
              Filter $100K+, approve, and notify the featured customer.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4 sm:pb-5">
            <Button asChild variant="secondary" size="sm">
              <Link href="/rm">RM Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="pb-2 pt-4 sm:pt-5">
            <CardTitle className="text-base">2. Customer Intake</CardTitle>
            <CardDescription className="text-[0.95em] text-pnc-navy/75">
              Notification → chatbot intake with optional health consent.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4 sm:pb-5">
            <Button asChild variant="secondary" size="sm">
              <Link href="/customer">Customer View</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-none sm:col-span-2 md:col-span-1">
          <CardHeader className="pb-2 pt-4 sm:pt-5">
            <CardTitle className="text-base">3. Live Plan</CardTitle>
            <CardDescription className="text-[0.95em] text-pnc-navy/75">
              Instant recompute of exposure label and diversification guidance.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4 sm:pb-5">
            <Button asChild variant="secondary" size="sm">
              <Link href="/planner">Planner</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
