const STRIPE_SEGMENTS = [
  { grow: 2, color: '#FFCE00' },
  { grow: 1, color: '#0055B8' },
  { grow: 1, color: '#E31F1A' },
] as const;

/** Decorative tricolor stripe in flag proportions (2:1:1). */
export function GovStripe() {
  return (
    <div aria-hidden="true" className="flex h-1 w-full">
      {STRIPE_SEGMENTS.map((segment) => (
        <div key={segment.color} style={{ flexGrow: segment.grow, backgroundColor: segment.color }} />
      ))}
    </div>
  );
}
