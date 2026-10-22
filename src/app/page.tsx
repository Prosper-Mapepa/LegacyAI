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
    <div className="flex flex-col gap-6 md:gap-8 lg:gap-10">
      <section className="rounded-2xl bg-gradient-to-br from-pnc-navy via-[#0d3a6e] to-pnc-blue px-5 py-10 text-white sm:px-8 sm:py-14 md:px-12 md:py-16 lg:px-14 lg:py-20">
        <h1 className="max-w-4xl text-3xl font-bold tracking-tight leading-[1.2] sm:text-4xl md:text-5xl md:leading-[1.15] lg:text-6xl">
          <span className="text-ai-glow">AI-Assisted</span>
          <span className="mt-2 block text-white sm:mt-3">
            Wealth Transition &amp; Emergency-Fund Diversification
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-blue-100 sm:mt-6 sm:text-lg md:text-xl md:leading-relaxed">
          A clickable prototype: identify $100K+ customers, approve outreach,
          complete intake, and guide Liquidity / Safe / Growth diversification
          from qualitative emergency exposure — with RM review before action.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:gap-4">
          <Button asChild size="lg" className="w-full text-base sm:w-auto sm:min-w-[10rem]">
            <Link href="/customer">Use AI Demo</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full border-white/40 bg-white/10 text-base text-white hover:bg-white/20 sm:w-auto sm:min-w-[10rem]"
          >
            <Link href="/rm">Start As RM</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full border-white/40 bg-white/10 text-base text-white hover:bg-white/20 sm:w-auto sm:min-w-[10rem]"
          >
            <Link href="/planner">Open Planner</Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 md:gap-6">
        <Card className="shadow-none">
          <CardHeader className="space-y-2 p-5 pb-3 sm:p-6 sm:pb-3">
            <CardTitle className="text-lg sm:text-xl">1. RM Outreach</CardTitle>
            <CardDescription className="text-sm leading-relaxed text-pnc-navy/80 sm:text-base">
              Filter $100K+, approve, and notify the featured customer.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
            <Button asChild variant="secondary" size="lg" className="text-sm">
              <Link href="/rm">RM Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="space-y-2 p-5 pb-3 sm:p-6 sm:pb-3">
            <CardTitle className="text-lg sm:text-xl">2. Customer Intake</CardTitle>
            <CardDescription className="text-sm leading-relaxed text-pnc-navy/80 sm:text-base">
              Notification → invite email → guided intake with optional health
              consent.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
            <Button asChild variant="secondary" size="lg" className="text-sm">
              <Link href="/customer">Customer View</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-none sm:col-span-2 md:col-span-1">
          <CardHeader className="space-y-2 p-5 pb-3 sm:p-6 sm:pb-3">
            <CardTitle className="text-lg sm:text-xl">3. Live Plan</CardTitle>
            <CardDescription className="text-sm leading-relaxed text-pnc-navy/80 sm:text-base">
              Instant recompute of exposure label and diversification guidance.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
            <Button asChild variant="secondary" size="lg" className="text-sm">
              <Link href="/planner">Planner</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
