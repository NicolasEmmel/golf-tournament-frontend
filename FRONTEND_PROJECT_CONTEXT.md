# Golf Tournament Live Scoring Frontend
## AI Product Specification and Cursor Context

## 1. Project Overview

This project is a new frontend for a multi-day golf tournament live-scoring application.

The frontend must be built from scratch using Next.js, React, and TypeScript. It replaces an older Flutter frontend while preserving the general visual appearance, interaction patterns, and user experience of that application.

The old Flutter repository is a visual and functional reference only. Its architecture, state-management approach, and implementation patterns must not be copied directly.

The frontend communicates with the existing .NET 8 ASP.NET Core backend through SignalR and, where required, REST endpoints.

The frontend should support:

- Live score entry
- Live leaderboard viewing
- Tournament administration
- Multi-day tournament management
- Separate leaderboards for men, women, and seniors
- Large-screen spectator displays
- Automatic SignalR reconnection
- Responsive use on phones, tablets, laptops, and televisions

## 2. Source Repositories

### Existing backend

Repository:

`NicolasEmmel/golf-tournament-backend`

The backend is the source of truth for:

- Players
- Flights
- Scores
- Tournament state
- Current tournament day
- Leaderboards
- Handicap and scoring calculations

The frontend must not duplicate backend scoring logic.

### Old Flutter frontend

Repository:

`NicolasEmmel/livescoringfrontendv1`

Use this repository only to understand:

- Visual layout
- Color usage
- Screen structure
- Navigation patterns
- Score-entry workflow
- Leaderboard presentation
- User interaction patterns

Do not port Flutter widgets, providers, state management, networking code, or application architecture.

### New frontend

Create a completely new GitHub repository for this project.

Suggested repository name:

`golf-tournament-frontend`

The repository should contain only the new Next.js frontend.

## 3. Technology Stack

Use the following stack:

- Next.js with App Router
- React
- TypeScript
- Tailwind CSS
- SignalR JavaScript client
- ESLint
- Prettier
- Vitest or Jest for unit tests
- Playwright for end-to-end tests

Optional UI utilities may be introduced when useful:

- shadcn/ui
- Lucide icons
- Zod
- React Hook Form

Avoid adding large dependencies unless they provide clear value.

Do not use Redux unless the application later develops state-management requirements that cannot reasonably be handled through React Context and custom hooks.

## 4. Core Principles

The frontend should prioritize:

- Simplicity
- Clear separation of concerns
- Type safety
- Accessibility
- Mobile-first responsive design
- Reliable real-time updates
- Graceful reconnect behavior
- Reusable components
- Easy maintenance
- Visual consistency

Avoid:

- Over-engineering
- Large global state stores
- Business logic inside presentation components
- Duplicate score calculations
- Tight coupling between pages and SignalR
- Direct backend calls scattered throughout components
- Copying architecture from the old Flutter application

## 5. Suggested Project Structure

```text
golf-tournament-frontend/
├── app/
│   ├── admin/
│   │   ├── page.tsx
│   │   ├── players/
│   │   ├── flights/
│   │   └── tournament/
│   ├── leaderboard/
│   │   └── page.tsx
│   ├── scoring/
│   │   └── page.tsx
│   ├── display/
│   │   └── page.tsx
│   ├── error.tsx
│   ├── loading.tsx
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── page.tsx
├── components/
│   ├── admin/
│   ├── common/
│   ├── leaderboard/
│   ├── scoring/
│   ├── tournament/
│   └── ui/
├── context/
│   ├── SignalRContext.tsx
│   └── TournamentContext.tsx
├── hooks/
│   ├── useLeaderboard.ts
│   ├── useSignalR.ts
│   ├── useTournament.ts
│   └── useFlightScoring.ts
├── lib/
│   ├── constants.ts
│   ├── environment.ts
│   ├── errors.ts
│   └── utils.ts
├── models/
│   ├── flight.ts
│   ├── leaderboard.ts
│   ├── player.ts
│   ├── score.ts
│   └── tournament.ts
├── services/
│   ├── api/
│   │   ├── adminApi.ts
│   │   ├── playerApi.ts
│   │   └── tournamentApi.ts
│   └── signalr/
│       ├── connection.ts
│       ├── events.ts
│       └── tournamentHub.ts
├── public/
├── styles/
├── tests/
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

Keep folders focused and avoid creating files before they are required.

## 6. Application Routes

### 6.1 Home

Route: `/`

Purpose:

- Entry point for the application
- Clear navigation to leaderboard, scoring, admin, and display views
- Display connection and tournament status when useful

### 6.2 Leaderboard

Route: `/leaderboard`

Purpose:

- Public spectator leaderboard
- Mobile and desktop friendly
- Updates automatically through SignalR
- Allows switching leaderboard category

Categories:

- Overall
- Men
- Women
- Seniors
- Gross
- Net

The exact filters should follow backend capabilities and message contracts.

The page should show:

- Player rank
- Player name
- Current day
- Total score
- Daily score
- Gross score
- Net score
- Holes completed
- Status such as finished or in progress

### 6.3 Score Entry

Route: `/scoring`

Purpose:

- Used by a scoring device assigned to a flight
- Optimized primarily for mobile devices
- Allows quick score entry with minimal taps

On registration, the scoring client must receive:

- Current tournament day
- Assigned flight
- Players in the flight
- Existing scores
- Current hole
- Relevant connection state

The score-entry page should:

- Show one hole at a time
- Show hole number, par, and stroke index
- Show every player in the flight
- Allow score increase and decrease
- Prevent invalid scores
- Clearly show saved and unsaved states
- Allow navigation between holes
- Restore state after reconnect
- Prevent accidental loss of entered scores
- Display connection errors clearly

### 6.4 Admin

Route: `/admin`

Purpose:

- Tournament administration
- Desktop-first, but still responsive

Admin functions include:

- Create players
- Edit players
- Remove players
- View all registered players
- Create daily flights
- Assign players to flights
- Change current tournament day
- Reset the tournament
- Inspect tournament state
- Inspect current flights
- Inspect current scores
- Trigger supported administrative backend functions

Destructive actions must require confirmation.

### 6.5 Display

Route: `/display`

Purpose:

- Large-screen leaderboard for clubhouses, televisions, and public viewing
- Full-screen capable
- High contrast
- Large typography
- Minimal controls
- Automatic leaderboard rotation may be added later

The display page should:

- Refresh only through live state updates
- Remain readable from a distance
- Avoid unnecessary navigation elements
- Recover automatically from temporary connection loss

## 7. Data Models

Frontend models must mirror backend contracts but should remain independent TypeScript types.

Example:

```ts
export interface Player {
  uuid: string;
  name: string;
  handicap: number;
  gender: Gender;
}
```

Expected frontend model groups:

- Player
- Hole
- Flight
- PlayerFlight
- PlayerScore
- LeaderboardEntry
- TournamentState
- SignalR registration payloads
- SignalR event payloads
- Admin request DTOs

Do not invent fields that are not supported by the backend.

When backend contracts change, update frontend types immediately.

## 8. SignalR Architecture

SignalR is the main real-time communication mechanism.

The application should use one shared connection per browser session.

Create a central `SignalRProvider` that:

- Creates the connection
- Starts the connection
- Tracks connection state
- Registers event handlers
- Handles reconnection
- Exposes typed actions
- Cleans up listeners
- Prevents duplicate subscriptions

No page or leaf component should create its own SignalR connection.

### 8.1 Connection States

Expose at least:

- Disconnected
- Connecting
- Connected
- Reconnecting
- Failed

The UI should visually communicate connection state when it affects usability.

### 8.2 Reconnection

Use automatic reconnection with a controlled retry strategy.

On reconnect:

1. Re-register the client if required.
2. Request or receive current authoritative state.
3. Replace stale local state.
4. Restore the user to the correct flight and hole.
5. Resume receiving live updates.

Do not assume events missed during disconnection can be reconstructed from local state.

### 8.3 SignalR Events

Create typed constants or wrappers for all hub methods and client events.

Example structure:

```ts
export const TournamentHubEvents = {
  LeaderboardUpdated: "LeaderboardUpdated",
  FlightUpdated: "FlightUpdated",
  ScoreUpdated: "ScoreUpdated",
  TournamentDayChanged: "TournamentDayChanged",
  TournamentReset: "TournamentReset",
} as const;
```

Actual names must exactly match the backend hub contract.

Avoid hardcoded SignalR method names inside components.

### 8.4 Client Registration

A scorekeeping client should register using the backend-supported identifier or flight-assignment mechanism.

After registration, the frontend should receive authoritative state containing:

- Flight
- Players
- Scores
- Current tournament day
- Current hole where available

The frontend must not assume that a previous local session is still valid.

## 9. REST API Usage

Use REST only for backend functions exposed through HTTP.

All HTTP calls should be centralized in service modules.

Do not call `fetch` directly from presentation components.

Each API service should:

- Use environment-based backend URLs
- Return typed results
- Handle non-success responses
- Normalize errors
- Avoid hiding important server messages
- Support cancellation where useful

## 10. State Management

Use:

- React Context for shared application infrastructure
- Custom hooks for feature-specific state
- Local component state for UI-only concerns
- Server Components only where they add value
- Client Components for live SignalR-driven screens

Suggested shared contexts:

### SignalRContext

Stores:

- Connection state
- Connection instance
- Typed hub actions
- Last connection error

### TournamentContext

Stores only globally relevant current state, such as:

- Current tournament day
- Tournament status
- Shared leaderboard snapshot when appropriate

Avoid storing every form field and UI toggle globally.

## 11. UI and Visual Design

The new frontend should recreate the recognizable look of the Flutter application while improving consistency and responsiveness.

Use the Flutter project to identify:

- Primary colors
- Background colors
- Typography hierarchy
- Card styling
- Button styling
- Table styling
- Spacing
- Score controls
- Navigation behavior
- Leaderboard layout

Translate those patterns into reusable Tailwind-based components.

Do not aim for a pixel-by-pixel Flutter implementation when that would harm web usability.

### 11.1 Design System

Create reusable tokens for:

- Primary color
- Secondary color
- Accent color
- Success
- Warning
- Error
- Background
- Surface
- Border
- Text colors
- Border radii
- Shadows
- Spacing

Avoid arbitrary one-off values throughout the application.

### 11.2 Reusable Components

Likely shared components include:

- AppHeader
- PageContainer
- ConnectionStatus
- LoadingState
- ErrorState
- EmptyState
- ConfirmDialog
- PlayerCard
- ScoreStepper
- HoleHeader
- LeaderboardTable
- LeaderboardTabs
- FlightCard
- AdminSection
- StatusBadge

Only create abstractions after multiple pages need them.

## 12. Responsive Behavior

Use mobile-first design.

### Mobile

Primary use case for score entry:

- Large tap targets
- Sticky navigation where helpful
- Minimal text entry
- No horizontal scrolling for score entry
- Clear score controls
- Fast one-handed operation

### Tablet

Useful for:

- Score entry
- Flight management
- Leaderboard viewing

### Desktop

Primary use case for:

- Administration
- Detailed leaderboards

### Large display

Primary use case for:

- Public leaderboard
- High visibility
- Large text
- Reduced interaction

## 13. Score Entry UX

Score entry must be fast and resistant to mistakes.

Recommended interaction:

1. The scorer opens the scoring route.
2. The client registers.
3. The assigned flight is loaded.
4. The current hole is displayed.
5. Scores are entered for each player.
6. Scores are submitted.
7. The UI confirms successful save.
8. The user advances to the next hole.

Important behaviors:

- Disable duplicate submissions while a request is pending.
- Preserve entered values during temporary connection issues.
- Clearly distinguish local unsaved values from backend-confirmed values.
- Do not silently overwrite user input.
- Show validation errors close to the relevant player.
- Keep navigation available for correcting earlier holes.

## 14. Leaderboard Behavior

The leaderboard should use backend-calculated values.

The frontend may:

- Sort only if the backend contract explicitly allows or requires it
- Filter by category
- Format values for display
- Highlight changes
- Show tied positions

The frontend must not independently calculate:

- Gross score
- Net score
- Playing handicap
- Course handicap
- Tournament totals
- Ranking rules

## 15. Loading, Empty, and Error States

Every main screen must define:

- Initial loading state
- Empty state
- Disconnected state
- Reconnecting state
- Backend error state
- Invalid route or registration state

Avoid blank pages and generic “Something went wrong” messages when a more useful message is available.

## 16. Accessibility

Follow accessible web practices:

- Semantic HTML
- Keyboard-accessible controls
- Visible focus states
- Sufficient contrast
- Proper button labels
- Form labels
- Accessible dialogs
- Screen-reader-friendly status announcements
- Do not rely on color alone to communicate state

## 17. Security

- Never expose backend secrets in frontend code.
- Only public environment variables may use the `NEXT_PUBLIC_` prefix.
- Never commit `.env.local`.
- Validate and sanitize user-entered values.
- Treat admin authorization as a backend responsibility.
- Do not rely on hidden buttons for access control.
- Avoid logging sensitive data in the browser.

## 18. Environment Configuration

Use environment variables.

Example:

```env
NEXT_PUBLIC_API_BASE_URL=https://example.fly.dev
NEXT_PUBLIC_SIGNALR_HUB_URL=https://example.fly.dev/hubs/tournament
```

Create `.env.example` with placeholders.

Do not commit real production secrets or environment-specific credentials.

## 19. Backend Integration Rules

Before implementing frontend integration:

1. Inspect the backend hub.
2. Identify exact hub method names.
3. Identify exact client event names.
4. Identify DTO structures.
5. Identify REST routes.
6. Confirm CORS configuration.
7. Confirm SignalR transport and authentication requirements.
8. Generate matching TypeScript models.

Never guess backend contracts when they can be read from the backend repository.

## 20. Testing Strategy

### 20.1 Unit Tests

Test:

- Formatting utilities
- State reducers
- SignalR event mapping
- Leaderboard filtering
- Validation logic
- Error normalization

### 20.2 Component Tests

Test:

- Score controls
- Leaderboard rows
- Connection-status display
- Confirmation dialogs
- Form validation

### 20.3 End-to-End Tests

Use Playwright for critical workflows:

- Open public leaderboard
- Register scorekeeping client
- Receive flight state
- Enter and submit score
- Recover after reconnect
- Create player in admin
- Change tournament day
- Reset tournament with confirmation

External backend calls may be mocked for predictable automated tests.

## 21. Logging and Diagnostics

In development:

- Log SignalR lifecycle events
- Log registration failures
- Log malformed payloads
- Log API failures

In production:

- Avoid noisy logs
- Avoid personal or sensitive data
- Keep useful error context
- Consider adding an error-monitoring service later

## 22. Deployment

The frontend should be deployable independently from the backend.

Preferred options:

- Vercel
- Fly.io
- Another platform that supports Next.js

The deployment configuration must support:

- Environment variables
- HTTPS
- Correct backend CORS settings
- SignalR WebSocket connections
- Preview deployments where appropriate

The backend remains deployed separately on Fly.io.

## 23. Git and GitHub Workflow

GitHub is the canonical source-control system.

Create a new repository for the frontend rather than modifying the old Flutter repository.

Initialize the repository with:

- README
- Next.js `.gitignore`
- `.env.example`
- Project context document
- Cursor rules
- License if desired

Development principles:

- Keep `main` stable and deployable.
- Use feature branches for larger changes.
- Make small, focused commits.
- Use descriptive commit messages.
- Do not mix unrelated refactoring into feature work.
- Open pull requests for significant changes.
- Never commit secrets.
- Update context documentation when architecture changes.

Suggested branch names:

- `feature/project-foundation`
- `feature/signalr-connection`
- `feature/leaderboard`
- `feature/scoring`
- `feature/admin`
- `feature/display-mode`

## 24. Implementation Phases

### Phase 1: Project Foundation

- Create new GitHub repository
- Create Next.js TypeScript project
- Configure Tailwind
- Configure linting and formatting
- Add environment handling
- Add base layout
- Add project context and Cursor rules

### Phase 2: Backend Contract Discovery

- Inspect backend models
- Inspect SignalR hub methods
- Inspect SignalR events
- Inspect REST endpoints
- Create TypeScript contracts
- Document integration contract

### Phase 3: Visual Foundation

- Inspect Flutter screens
- Extract visual design patterns
- Create design tokens
- Build reusable layout components
- Create empty page structures

Do not implement backend logic yet.

### Phase 4: SignalR Infrastructure

- Create shared connection provider
- Add typed event handlers
- Add reconnect logic
- Add connection-status component
- Add registration flow

### Phase 5: Leaderboard

- Build leaderboard page
- Connect live events
- Add category filters
- Add responsive layouts
- Add empty and error states

### Phase 6: Score Entry

- Build flight registration
- Load assigned flight
- Build hole navigation
- Build score controls
- Submit scores
- Handle reconnect and stale state

### Phase 7: Administration

- Player management
- Flight creation
- Day management
- Tournament reset
- Destructive-action confirmations

### Phase 8: Display Mode

- Fullscreen leaderboard
- Large-screen layout
- Reconnect handling
- Optional category rotation

### Phase 9: Testing and Deployment

- Add unit tests
- Add end-to-end tests
- Configure deployment
- Verify SignalR in production
- Verify mobile behavior
- Verify large-screen behavior

## 25. Cursor Instructions

When using Cursor for this project:

- Inspect the backend repository before writing integration code.
- Inspect the Flutter repository only for design and UX reference.
- Never copy Flutter architecture into the Next.js project.
- Build one feature at a time.
- Keep SignalR connection logic centralized.
- Keep backend calls out of presentation components.
- Use typed models for all backend payloads.
- Avoid speculative features.
- Do not calculate official golf scoring values in the frontend.
- Reuse components where it improves consistency.
- Avoid abstractions that are only used once.
- Add tests for critical behavior.
- Update this document when important decisions change.
- Suggest a focused commit message after completing a logical unit of work.

## 26. Definition of Done

A feature is complete when:

- It matches the intended visual design.
- It works at required responsive sizes.
- It uses typed backend contracts.
- It handles loading and failure states.
- It does not create duplicate SignalR subscriptions.
- It preserves backend authority.
- It passes linting.
- It passes relevant tests.
- It introduces no secrets or hardcoded production credentials.
- It is documented where necessary.

## 27. Initial Cursor Prompt

Use the following prompt when starting the new project:

```text
Create a completely new Next.js frontend for the golf tournament live-scoring application described in PROJECT_CONTEXT.md.

Use the existing Flutter repository only as a visual and UX reference. Do not copy its architecture or implementation patterns.

Before implementing backend integration, inspect the existing .NET backend repository and document its SignalR methods, client events, DTOs, and REST endpoints.

Start only with Phase 1: create the project foundation, folder structure, formatting configuration, environment setup, shared layout, placeholder routes, and documentation. Do not implement scoring, leaderboard logic, admin logic, or SignalR integration yet.

Create the new project in its own GitHub repository. Keep the main branch stable, use focused commits, and do not commit secrets.
```
