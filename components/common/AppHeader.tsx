import Link from "next/link";
import { APP_NAME, routes } from "@/lib/constants";
import { cn } from "@/lib/utils";

const navItems = [
  { href: routes.leaderboard, label: "Rangliste" },
  { href: routes.scoring, label: "Scoring" },
  { href: routes.display, label: "Anzeige" },
  { href: routes.admin, label: "Admin" },
] as const;

export function AppHeader({
  className,
  minimal = false,
}: {
  className?: string;
  minimal?: boolean;
}) {
  if (minimal) return null;

  return (
    <header
      className={cn(
        // On-course mobile: no top bar — circular actions / page CTAs cover nav.
        "hidden border-b border-black/5 bg-surface-mint/90 backdrop-blur md:block",
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href={routes.home} className="text-lg font-bold text-primary">
          {APP_NAME}
        </Link>
        <nav aria-label="Hauptnavigation" className="flex flex-wrap gap-1 sm:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-primary/10 hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
