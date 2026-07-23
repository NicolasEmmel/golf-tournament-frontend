"use client";

import { CalendarDays, Plane, Users } from "lucide-react";
import Link from "next/link";
import { FairwayShell } from "@/components/common/FairwayShell";
import { MintCard } from "@/components/common/MintCard";
import { routes } from "@/lib/constants";

const sections = [
  {
    href: routes.adminPlayers,
    label: "Players",
    detail: "Create, edit, and remove players",
    icon: Users,
  },
  {
    href: routes.adminFlights,
    label: "Flights",
    detail: "Daily flights and player assignments",
    icon: Plane,
  },
  {
    href: routes.adminTournament,
    label: "Tournament",
    detail: "Current day, course info, and reset",
    icon: CalendarDays,
  },
] as const;

export default function AdminPage() {
  return (
    <FairwayShell>
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <MintCard>
          <h1 className="text-3xl font-black text-primary">Administration</h1>
          <p className="mt-2 text-sm text-muted">
            Manage players, flights, and tournament day. Destructive actions
            require confirmation.
          </p>
        </MintCard>

        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {sections.map((section) => (
            <li key={section.href}>
              <Link
                href={section.href}
                className="block h-full rounded-2xl bg-surface p-5 shadow-[var(--shadow-soft)] transition hover:ring-2 hover:ring-primary/30"
              >
                <section.icon className="h-8 w-8 text-primary" />
                <h2 className="mt-3 text-lg font-bold text-primary">
                  {section.label}
                </h2>
                <p className="mt-1 text-sm text-muted">{section.detail}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </FairwayShell>
  );
}
