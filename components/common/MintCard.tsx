import { cn } from "@/lib/utils";

export function MintCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-surface-mint p-4 shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
