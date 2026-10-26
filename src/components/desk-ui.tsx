import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Lane } from "@/domain/types";

const LANE_LABEL: Record<Lane, string> = {
  gap: "Needs you",
  ready: "Ready",
  watch: "Waiting",
  hold: "Do not call",
};

const LANE_DOT: Record<Lane, string> = {
  gap: "bg-orange",
  ready: "bg-blue",
  watch: "bg-faint",
  hold: "bg-ink",
};

const LANE_CLASS: Record<Lane, string> = {
  gap: "bg-orange-soft text-ink",
  ready: "bg-blue-soft text-blue",
  watch: "bg-mist text-muted",
  hold: "bg-mist text-ink",
};

export function LaneChip({ lane }: { lane: Lane }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold sm:text-sm ${LANE_CLASS[lane]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${LANE_DOT[lane]}`} aria-hidden />
      {LANE_LABEL[lane]}
    </span>
  );
}

export function buttonClass(variant: "primary" | "quiet" | "blue" = "quiet") {
  const look =
    variant === "primary"
      ? "border-transparent bg-orange text-ink shadow-sm hover:bg-orange-deep"
      : variant === "blue"
        ? "border-transparent bg-blue text-white shadow-sm hover:bg-[#00588f]"
        : "border-line bg-white text-ink hover:bg-mist";
  return `inline-flex min-h-11 items-center justify-center rounded-lg border px-5 text-base font-semibold transition ${look}`;
}

export function Button({
  variant = "quiet",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "quiet" | "blue";
}) {
  return (
    <button
      {...props}
      className={`${buttonClass(variant)} disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    />
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`surface p-6 sm:p-7 ${className}`}>{children}</section>;
}

export function Kicker({ children }: { children: ReactNode }) {
  return <p className="text-base font-semibold text-blue">{children}</p>;
}
