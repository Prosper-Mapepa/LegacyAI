"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { HowItWorks } from "@/components/how-it-works";
import { Button } from "@/components/ui/button";
import { useDemoStore } from "@/store/demo-store";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const role = useDemoStore((s) => s.role);
  const setRole = useDemoStore((s) => s.setRole);
  const resetDemo = useDemoStore((s) => s.resetDemo);
  const router = useRouter();
  const pathname = usePathname();

  function switchRole(next: "rm" | "customer") {
    setRole(next);
    if (next === "rm") router.push("/rm");
    else router.push("/customer");
  }

  function handleReset() {
    resetDemo();
    router.push("/rm");
  }

  const customerLinks = [
    { href: "/customer", label: "Use AI Demo" },
    { href: "/customer/chat", label: "Intake" },
    { href: "/customer/plan", label: "Plan" },
  ];

  const linkClass = (active: boolean) =>
    cn(
      "relative rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3 sm:py-2",
      active
        ? "bg-orange-50 font-semibold text-pnc-navy after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-pnc-orange"
        : "text-pnc-slate hover:bg-pnc-bg hover:text-pnc-navy"
    );

  const roleSwitcher = (compact: boolean) => (
    <div
      role="group"
      aria-label="Role switcher"
      className="flex shrink-0 rounded-md border border-pnc-border p-0.5"
    >
      <button
        type="button"
        onClick={() => switchRole("rm")}
        className={cn(
          "rounded px-2 py-1.5 text-xs font-semibold sm:px-3",
          role === "rm"
            ? "bg-pnc-blue text-white"
            : "text-pnc-slate hover:text-pnc-navy"
        )}
        aria-pressed={role === "rm"}
      >
        {compact ? "RM" : "RM view"}
      </button>
      <button
        type="button"
        onClick={() => switchRole("customer")}
        className={cn(
          "rounded px-2 py-1.5 text-xs font-semibold sm:px-3",
          role === "customer"
            ? "bg-pnc-orange text-white"
            : "text-pnc-slate hover:text-pnc-navy"
        )}
        aria-pressed={role === "customer"}
      >
        {compact ? "Customer" : "Customer view"}
      </button>
    </div>
  );

  const navLinks = (
    <>
      {role === "rm" ? (
        <Link
          href="/rm"
          className={linkClass(pathname.startsWith("/rm"))}
          aria-current={pathname.startsWith("/rm") ? "page" : undefined}
        >
          RM Dashboard
        </Link>
      ) : (
        customerLinks.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={linkClass(active)}
              aria-current={active ? "page" : undefined}
            >
              {l.label}
            </Link>
          );
        })
      )}
      <Link
        href="/planner"
        className={linkClass(pathname === "/planner")}
        aria-current={pathname === "/planner" ? "page" : undefined}
      >
        Planner
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-pnc-border bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:px-4 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-3 md:py-3">
        <div className="min-w-0 justify-self-start">
          <Link
            href="/"
            className="inline-flex max-w-full items-center no-underline hover:opacity-90"
          >
            <BrandLogo className="max-w-full" />
          </Link>
        </div>

        <nav
          aria-label="Primary"
          className="hidden items-center justify-center gap-1 md:flex"
        >
          {navLinks}
        </nav>

        {/* Mobile actions */}
        <div className="flex items-center justify-end gap-1.5 md:hidden">
          {roleSwitcher(true)}
          <HowItWorks iconOnly />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            aria-label="Reset demo"
            className="shrink-0"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        {/* Desktop actions */}
        <div className="hidden flex-wrap items-center justify-end gap-2 justify-self-end md:flex">
          {roleSwitcher(false)}
          <HowItWorks />
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Reset demo
          </Button>
        </div>
      </div>

      <nav
        aria-label="Mobile primary"
        className="flex items-center justify-center gap-0.5 overflow-x-auto border-t border-pnc-border px-2 py-1.5 text-[13px] md:hidden"
      >
        {navLinks}
      </nav>
    </header>
  );
}
