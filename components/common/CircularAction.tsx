import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  icon: React.ReactNode;
  variant?: "mint" | "primary";
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
};

export function CircularAction({
  label,
  onClick,
  icon,
  variant = "mint",
  disabled,
  href,
}: Props) {
  const classes = cn(
    "flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-full shadow-[var(--shadow-soft)] transition disabled:opacity-50",
    variant === "primary"
      ? "bg-primary text-primary-foreground"
      : "bg-surface-mint text-primary",
  );

  const content = (
    <>
      <span className="[&>svg]:h-6 [&>svg]:w-6">{icon}</span>
      <span className="text-[10px] font-semibold uppercase">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-disabled={disabled}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {content}
    </button>
  );
}
