import Link from "next/link";
import { PageContainer } from "@/components/common/PageContainer";
import { routes } from "@/lib/constants";

const sections = [
  { href: routes.adminPlayers, label: "Players", detail: "Create and edit players" },
  { href: routes.adminFlights, label: "Flights", detail: "Daily flights and assignments" },
  {
    href: routes.adminTournament,
    label: "Tournament",
    detail: "Current day, reset, and state",
  },
] as const;

export default function AdminPage() {
  return (
    <PageContainer
      title="Administration"
      description="Desktop-first tournament setup. REST integration coming in Phase 7."
    >
      <ul className="grid gap-4 md:grid-cols-3">
        {sections.map((section) => (
          <li key={section.href}>
            <Link
              href={section.href}
              className="block rounded-lg border border-border bg-surface p-5 hover:border-primary/40"
            >
              <h2 className="font-semibold text-primary">{section.label}</h2>
              <p className="mt-1 text-sm text-muted">{section.detail}</p>
            </Link>
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
