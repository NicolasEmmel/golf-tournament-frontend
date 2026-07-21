import Link from "next/link";
import { APP_NAME, routes } from "@/lib/constants";
import { cn } from "@/lib/utils";

const navItems = [
  { href: routes.leaderboard, label: "Leaderboard" },
  { href: routes.scoring, label: "Scoring" },
  { href: routes.display, label: "Display" },
  { href: routes.admin, label: "Admin" },
] as const;

export function AppHeader({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80",
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href={routes.home} className="text-lg font-semibold text-primary">
          {APP_NAME}
        </Link>
        <nav aria-label="Main" className="flex flex-wrap gap-1 sm:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-primary/10 hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
