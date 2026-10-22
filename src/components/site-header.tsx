"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, RotateCcw } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { HowItWorks } from "@/components/how-it-works";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDemoStore } from "@/store/demo-store";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const role = useDemoStore((s) => s.role);
  const setRole = useDemoStore((s) => s.setRole);
  const resetDemo = useDemoStore((s) => s.resetDemo);
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function switchRole(next: "rm" | "customer") {
    setRole(next);
    if (next === "rm") router.push("/rm");
    else router.push("/customer");
  }

  function handleReset() {
    resetDemo();
    setMenuOpen(false);
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

  const menuLinkClass = (active: boolean) =>
    cn(
      "block rounded-md px-3 py-3 text-base font-medium",
      active
        ? "bg-orange-50 font-semibold text-pnc-navy"
        : "text-pnc-navy hover:bg-pnc-bg"
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

  const desktopNavLinks = (
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

  function closeAndGo() {
    setMenuOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-pnc-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:px-4 md:grid md:h-[4.25rem] md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-3 md:py-0">
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
          {desktopNavLinks}
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
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </Button>
            <SheetContent side="right" className="w-[min(100%,20rem)] p-0">
              <SheetHeader className="border-b border-pnc-border px-4 py-4 text-left">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile primary" className="flex flex-col p-2">
                {role === "rm" ? (
                  <Link
                    href="/rm"
                    className={menuLinkClass(pathname.startsWith("/rm"))}
                    aria-current={
                      pathname.startsWith("/rm") ? "page" : undefined
                    }
                    onClick={closeAndGo}
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
                        className={menuLinkClass(active)}
                        aria-current={active ? "page" : undefined}
                        onClick={closeAndGo}
                      >
                        {l.label}
                      </Link>
                    );
                  })
                )}
                <Link
                  href="/planner"
                  className={menuLinkClass(pathname === "/planner")}
                  aria-current={pathname === "/planner" ? "page" : undefined}
                  onClick={closeAndGo}
                >
                  Planner
                </Link>
                <Link
                  href="/"
                  className={menuLinkClass(pathname === "/")}
                  aria-current={pathname === "/" ? "page" : undefined}
                  onClick={closeAndGo}
                >
                  Home
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
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
    </header>
  );
}
