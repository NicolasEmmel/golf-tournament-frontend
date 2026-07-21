import Link from "next/link";
import { ConnectionStatus } from "@/components/common/ConnectionStatus";
import { PageContainer } from "@/components/common/PageContainer";
import { routes } from "@/lib/constants";
import { environment } from "@/lib/environment";

const entryPoints = [
  {
    href: routes.leaderboard,
    title: "Leaderboard",
    description: "Live standings for spectators and players.",
  },
  {
    href: routes.scoring,
    title: "Score entry",
    description: "Mobile-friendly scoring for your assigned flight.",
  },
  {
    href: routes.display,
    title: "Big screen",
    description: "High-contrast display for clubhouses and TVs.",
  },
  {
    href: routes.admin,
    title: "Administration",
    description: "Players, flights, and tournament day management.",
  },
] as const;

export default function HomePage() {
  return (
    <PageContainer
      title="Welcome"
      description="Choose a view to get started. Real-time updates will connect to the tournament backend once SignalR is wired up (Phase 4)."
    >
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <ConnectionStatus state="disconnected" />
        <span className="text-sm text-muted">
          API: {environment.apiBaseUrl}
        </span>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {entryPoints.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block h-full rounded-lg border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <h2 className="text-lg font-semibold text-primary">
                {item.title}
              </h2>
              <p className="mt-2 text-sm text-muted">{item.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
