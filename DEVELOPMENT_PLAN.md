# Development Plan

Cal Booking is a compact production-like MVP for 30-minute meeting booking. The project should stay contract-first, small, and focused on the public booking flow plus a protected admin area.

## Current Baseline

- Public booking page with event type selection, available slots, and guest booking.
- Admin login with email/password, HttpOnly cookie sessions, and protected admin routes.
- Admin appointments list with cancellation.
- Admin settings for availability and public profile.
- NestJS API, React/Vite frontend, SQLite persistence with Drizzle ORM.
- TypeSpec contract, OpenAPI output, API contract docs, Vitest API tests, Playwright e2e tests, and Docker runtime.

## Development Principles

- Keep the MVP scope narrow: no external calendars, payments, teams, OAuth, public registration, or email delivery unless explicitly requested.
- Update `typespec/main.tsp`, `docs/openapi.yaml`, and `docs/api-contract.md` whenever request or response shapes change.
- Keep slot availability and double-booking protection on the server.
- Store timestamps in UTC and convert only at UI boundaries.
- Protect every `/api/admin/*` endpoint with session auth.
- Do not commit `.env`, secrets, SQLite databases, `node_modules`, or build artifacts.

## Agent Task Backlog

### Backend Agent

- Review booking creation for race conditions and keep database-level protection against double booking.
- Add focused API tests for invalid dates, unavailable slots, cancelled booking behavior, and auth failures.
- Harden DTO validation messages and keep error responses aligned with the API contract.
- Review session expiration, cookie flags, and production defaults.

### Frontend Agent

- Improve empty, loading, and error states across public and admin pages.
- Make booking and admin flows consistently responsive on narrow mobile screens.
- Add clear timezone display near all slot and appointment timestamps.
- Keep UI behavior driven by API data rather than duplicating availability rules in the browser.

### Tester Agent

- Expand Playwright coverage for admin login failures, availability edits, profile edits, and booking cancellation regressions.
- Add regression tests for slot reappearance after cancellation.
- Verify Docker dev override browser flow on `127.0.0.1`.
- Document manual smoke checks for deployed environments.

### API Contract Agent

- Audit implementation against `docs/api-contract.md` after each endpoint change.
- Regenerate and review `docs/openapi.yaml` after TypeSpec edits.
- Keep public and admin error shapes consistent and predictable.

### DevOps Agent

- Keep production Docker Compose free of published host ports.
- Verify `/api/health` in local container and deployed runtime.
- Document required Render environment variables and persistent storage tradeoffs.
- Review image size and build cache opportunities without complicating the runtime.

### Reviewer Agent

- Prioritize security, auth boundaries, timestamp consistency, and double-booking risks.
- Check that new tests cover any changed booking or admin behavior.
- Confirm workflow files under `.github/workflows` remain intact.

## Suggested Next Milestones

1. Contract and validation audit for all API endpoints.
2. Booking race-condition hardening with regression tests.
3. Admin settings e2e coverage.
4. Mobile UI pass for public booking and admin appointments.
5. Docker and deployment smoke-test documentation.
