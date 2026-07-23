# Design System — Golf Tournament Frontend

Derived from the Flutter reference app `livescoringfrontendv1` (read-only visual/UX reference). Do **not** port Flutter architecture, widgets, or networking patterns.

## Personality

Light, club-green livescoring UI — fairway mint cards on a soft sage-grey radial wash. Icon-forward and thumb-friendly for on-course use. Utilitarian bold typography for player names; tournament-board feel for leaderboards. Closer to a golf clubhouse handout than a neon TV graphic.

German tournament copy is optional; English is fine for the new web app unless product asks otherwise.

## Color tokens

| Token | Hex | Role |
|-------|-----|------|
| `--primary` | `#2E7D32` | Titles, icons, selected chips, primary CTAs |
| `--mint` / `--surface-mint` | `#E1F2D9` | Cards, headers, circular action buttons |
| `--gradient-core` | `#959F96` | Radial gradient center |
| `--gradient-edge` | `#E5E5E5` | Radial gradient outer stops / page wash |
| `--surface` | `#FFFFFF` | Tables, admin panels, dialogs |
| `--surface-translucent` | `rgba(255,255,255,0.31)` | Landing CTAs, score rows |
| `--foreground` | `#1A1A1A` | Primary text |
| `--muted` | `#5C6B5C` / `black54` | Secondary text |
| `--success` | `#4CAF50` | Success snackbars / confirm |
| `--error` | `#B42318` / red | Errors |
| `--rank-gold` | amber ~`#FFB300` | Rank 1 |
| `--rank-silver` | grey ~`#9E9E9E` | Rank 2 |
| `--rank-bronze` | orange ~`#E65100` | Rank 3 |

### Golf score color convention (display only)

- Under / better (to-par negative or red convention in Flutter): use red tones for under-par totals when matching Flutter
- Over par: dark text
- Even: primary green

Do **not** invent scoring math — only color backend-provided values.

## Background

Default page background:

```css
background: radial-gradient(circle at 50% 40%, #959F96 0%, #E5E5E5 70%, #E5E5E5 100%);
```

Prefer this soft wash over flat white for public screens (home, scoring, leaderboard, display). Admin may use the same wash with white content cards for readability.

## Typography

- System / Geist sans (no custom display font required)
- Landing hero: ~32px, bold, primary green
- Screen titles: ~24px, extra-bold, primary green
- Player first name: 15–18px, black, weight 800–900
- Player last / secondary: slightly smaller, muted
- Filter chips: ~10–12px, semibold
- Large hole number: ~32px bold

## Shape & elevation

- Card radius: **16–20px** (mint panels)
- Row / chip radius: **8–12px**
- Landing CTA height: **60px**, radius **16px**
- Circular action buttons: **70–80px** diameter
- Shadows: soft only (`black12` / `black26`, blur 1–4, offset ~0 2–3) — avoid heavy multi-layer shadows

## Layout patterns

1. **No heavy top AppBar on public screens** — full-bleed gradient + SafeArea-like padding + mint header card.
2. **Landing**: centered icon + title + stacked full-width translucent CTAs.
3. **Leaderboard**: mint header (trophy + title) → filter chips (not Material tabs) → column rows → optional circular bottom actions.
4. **Scoring**: mint hole header → per-player score cards with ± steppers → circular bottom actions (send / board / home).
5. **Admin (new)**: same palette; desktop-first forms and tables in white cards on the radial wash; destructive actions need confirmation.

## Navigation / UX differences from Flutter

| Flutter | New web |
|---------|---------|
| QR scan to join scoring | **Name-based registration** — pick player from list / search, then SignalR `RegisterScoringClient` |
| No admin screens | Full **Admin** area for players, flights, tournament day |
| Circular bottom nav on many screens | Keep circular / large tap actions on mobile scoring & leaderboard; use header nav for desktop |

## Interaction

- Large tap targets on scoring (±, send)
- Connecting: spinner + “Connecting…”
- Empty: muted icon + short explanation
- Errors: red text / alert; allow retry
- Success: brief green confirmation
- Destructive admin: confirm dialog required
- One shared SignalR connection; show connection status when it affects UX

## Components to prefer

`AppShell` (gradient), `MintCard`, `PrimaryCta`, `FilterChip`, `CircularAction`, `ScoreStepper`, `PlayerScoreCard`, `LeaderboardTable`, `ConfirmDialog`, `ConnectionStatus`, `AdminSection`

## Anti-patterns

- Do not copy Flutter Provider / widget trees
- Do not calculate handicaps or rankings in the UI
- Do not use purple/indigo AI-default themes or dark mode by default
- Do not use QR for scoring registration
- Do not put `fetch` / hub invokes inside presentational leaves — use services + hooks
