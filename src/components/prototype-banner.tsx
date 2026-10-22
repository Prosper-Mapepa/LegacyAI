/** Always-visible demo disclaimer — reduces phishing false positives. */
export function PrototypeBanner() {
  return (
    <div
      role="status"
      className="w-full border-b border-amber-300 bg-amber-100 px-3 py-2 text-center text-xs font-semibold leading-snug text-amber-950 sm:text-sm"
    >
      Demo prototype only · Synthetic data · Not a real bank · Not financial
      advice · No real accounts or money
    </div>
  );
}
