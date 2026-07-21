# Golf Tournament Live Scoring — Frontend

Next.js (App Router) frontend for the [golf-tournament-backend](https://github.com/NicolasEmmel/golf-tournament-backend) live scoring API.

## Status

**Phase 1 complete:** project foundation, routes, design tokens, typed backend contract docs, and test tooling. SignalR, scoring, leaderboard, and admin flows are not implemented yet.

See `FRONTEND_PROJECT_CONTEXT.md` for the full product spec and phased plan.

## Stack

- Next.js · React · TypeScript · Tailwind CSS
- Vitest (unit) · Playwright (e2e)
- SignalR client (Phase 4)

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright |

## Backend integration

- Contract: [`docs/BACKEND_CONTRACT.md`](docs/BACKEND_CONTRACT.md)
- Types: [`models/tournament.ts`](models/tournament.ts)
- Hub events: [`services/signalr/events.ts`](services/signalr/events.ts)

Production backend: `https://golf-tournament-backend.fly.dev`

## Routes

| Path | Purpose |
|------|---------|
| `/` | Home / navigation |
| `/leaderboard` | Public leaderboard |
| `/scoring` | Mobile score entry |
| `/display` | Large-screen display |
| `/admin` | Administration hub |
| `/admin/players` | Player management |
| `/admin/flights` | Flights |
| `/admin/tournament` | Tournament day / reset |

## License

MIT (add `LICENSE` when publishing the repository).
