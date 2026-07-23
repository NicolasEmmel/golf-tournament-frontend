import { cn } from "@/lib/utils";

export function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition",
        selected
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-surface-translucent text-foreground/80 hover:bg-white/50",
      )}
    >
      {label}
    </button>
  );
}
