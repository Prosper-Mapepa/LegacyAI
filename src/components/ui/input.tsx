import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        // text-base (16px) on small screens prevents iOS Safari zoom-on-focus
        "flex h-10 w-full min-w-0 rounded-md border border-pnc-border bg-white px-3 py-2 text-base text-pnc-navy placeholder:text-pnc-slate/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pnc-blue disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
