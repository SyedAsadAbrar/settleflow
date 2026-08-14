# Repository guidance

SettleFlow is a time-constrained, backend-first take-home. Prioritize financial correctness, a coherent implementation, and shipping over unnecessary abstractions.

## Before changing code

- Read the relevant project documents before making significant changes.
- Treat documented architectural and domain decisions as the current source of truth.
- Do not silently change an established decision. If a genuine architectural decision changes, update `docs/DECISIONS.md` with the new rationale and tradeoffs.
- Check `TASKS.md` for the current implemented/planned boundary, and update it after completing meaningful work.
- Never mark work complete unless it is implemented and reasonably verified.

## Engineering rules

- Keep REST route handlers thin: authenticate, parse, validate, call a service, and format the response.
- Keep authoritative business logic in reusable domain/service modules, not React components.
- Perform authoritative financial calculations and validation server-side. UI calculations are previews only.
- Preserve integer-cents money, derived order status, user-scoped resource access, order locking after settlement starts, and concurrent-overpayment protection.
- Use strict TypeScript and avoid `any`.
- Prefer small focused functions and avoid dependencies or abstractions that do not materially improve the submission.
- Run appropriate lint, typecheck, tests, and build checks after meaningful changes.
- Never claim a test, build, integration, or deployment passed unless it was actually run successfully.
- Clearly distinguish implemented functionality from production recommendations.

## Documentation map

- `docs/ARCHITECTURE.md` → system structure and boundaries
- `docs/DECISIONS.md` → important decisions and rationale
- `docs/UI_GUIDELINES.md` → visual and product conventions
- `TASKS.md` → current delivery progress

Keep these files useful and concise. Update documentation when implementation changes so future sessions do not inherit stale assumptions.
