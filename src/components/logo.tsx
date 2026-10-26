export function Logo({ className = "h-16" }: { className?: string }) {
  return <img src="/logo-mark.png" alt="LegacyAI" className={`block w-auto ${className}`} />;
}
