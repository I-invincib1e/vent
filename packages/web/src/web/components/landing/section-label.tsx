export function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <p className="font-mono text-xs tracking-[0.25em] uppercase text-ember mb-4">
      {index} — {label}
    </p>
  );
}
