"use client";

import { CalendarDays, Plane, Users } from "lucide-react";
import Link from "next/link";
import { FairwayShell } from "@/components/common/FairwayShell";
import { MintCard } from "@/components/common/MintCard";
import { routes } from "@/lib/constants";

const sections = [
  {
    href: routes.adminPlayers,
    label: "Spieler",
    detail: "Spieler anlegen, bearbeiten und entfernen",
    icon: Users,
  },
  {
    href: routes.adminFlights,
    label: "Flights",
    detail: "Tägliche Flights und Spielerzuweisungen",
    icon: Plane,
  },
  {
    href: routes.adminTournament,
    label: "Turnier",
    detail: "Aktueller Tag, Platzinfo und Reset",
    icon: CalendarDays,
  },
] as const;

export default function AdminPage() {
  return (
    <FairwayShell>
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <MintCard>
          <h1 className="text-3xl font-black text-primary">Verwaltung</h1>
          <p className="mt-2 text-sm text-muted">
            Spieler, Flights und Turniertag verwalten. Löschaktionen müssen
            bestätigt werden.
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
