import Link from "next/link";
import { cn } from "@/lib/utils";

type CommonProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type LinkProps = CommonProps & { href: string };

export function PrimaryCta(props: ButtonProps | LinkProps) {
  const classes = cn(
    "flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-surface-translucent px-5 text-lg font-semibold text-primary shadow-[var(--shadow-soft)] transition hover:bg-white/50 disabled:cursor-not-allowed disabled:opacity-60",
    props.className,
  );

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {props.children}
      </Link>
    );
  }

  const { children, className, ...rest } = props as ButtonProps;
  return (
    <button type="button" className={cn(classes, className)} {...rest}>
      {children}
    </button>
  );
}
