# Engineering decisions

Decision status reflects the repository as of 2026-08-14. “Implemented” means code exists and relevant local checks passed; it does not imply public deployment or database-backed integration verification unless explicitly stated.

## D001 — Monetary values use integer cents

**Status:** Implemented
**Decision:** Store and calculate monetary values as integer cents rather than JavaScript floating-point dollar values.
**Context:** Order totals and settlement balances require exact arithmetic.
**Reason:** Binary floating-point arithmetic can introduce rounding errors that are unacceptable in financial invariants.
**Tradeoffs:** API and UI boundaries must convert between decimal-dollar input/display and cents, and currency must be made explicit before supporting multiple currencies.

## D002 — Order status is derived

**Status:** Implemented
**Decision:** Do not persist order status as authoritative data. Derive it in this order: fully paid → `paid`; otherwise past due → `overdue`; otherwise some payment → `partially_paid`; otherwise → `pending`.
**Context:** Status is a projection of the order total, payment history, and due date.
**Reason:** One source of truth avoids status becoming inconsistent with actual settlements. A fully paid overdue order remains `paid`.
**Tradeoffs:** Filtering requires payment aggregation and derivation. The current application-memory filter is simple but needs a paginated/materialized read model at scale.

## D003 — Orders become financially immutable after first payment

**Status:** Implemented
**Decision:** Once an order receives a payment, reject all order updates and deletion. This includes line items, quantities, unit prices, totals, due date, and customer metadata.
**Context:** Payments were accepted against a specific order value and context.
**Reason:** Existing payments must remain reconcilable and auditable against the order they settled.
**Tradeoffs:** The implementation is stricter than freezing only total-affecting fields. Corrections require future reversal/versioning workflows rather than in-place edits.

## D004 — Server owns financial calculations

**Status:** Implemented
**Decision:** The frontend may calculate previews, but services recalculate totals and validate payments server-side.
**Context:** Browser state and request bodies are untrusted.
**Reason:** Financial invariants cannot depend on UI behavior or client-calculated totals.
**Tradeoffs:** Some calculations intentionally occur twice: once for responsive UX and once authoritatively on the server.

## D005 — Payments use a separate collection

**Status:** Implemented
**Decision:** Store each payment separately from its order.
**Context:** An order may receive multiple partial payments over time.
**Reason:** Separate records provide independent payment history, clearer auditability and queries, avoid indefinitely growing embedded arrays, and create a clear transaction boundary.
**Tradeoffs:** Reads must aggregate payment totals; the current services do this explicitly rather than caching a balance on the order.

## D006 — Single Next.js deployment

**Status:** Implemented and publicly deployed
**Decision:** Use one Next.js App Router application for the React UI and REST endpoints rather than separate frontend and Express deployments.
**Context:** This is a time-constrained take-home that still needs clean backend architecture.
**Reason:** A single deployment is the fastest reliable delivery path while module boundaries preserve separation of concerns.
**Tradeoffs:** UI and API scale together. A separate service should only be introduced when operational or organizational needs justify it.

## D007 — Prevent concurrent overpayment

**Status:** Implemented, covered by an opt-in replica-set integration test, and verified against the deployed Atlas replica set
**Decision:** Enforce `sum(payments) <= order.totalCents` with a MongoDB transaction that validates the balance, increments the order's private `paymentVersion`, and inserts the payment.
**Context:** If requests A and B both read a remaining balance of 1000 and both submit 600, both cannot succeed. Transactions that only insert different payment documents can still suffer write skew.
**Reason:** Updating the same order document creates a write conflict. MongoDB retries the conflicting transaction, which recomputes the balance and rejects an overpayment.
**Tradeoffs:** Transactions require Atlas or another replica set. The database integration test runs only against a dedicated non-production replica set, while a live two-request `$600 + $600` test against a `$1,000` order also verified that exactly one payment succeeds and the other is rejected.

## D008 — Financial API errors are actionable

**Status:** Implemented
**Decision:** Return stable machine-readable error codes, human-readable messages, and resolution context when applicable.
**Context:** Integrations and UI flows must distinguish validation, ownership, locking, fully paid, and overpayment outcomes.
**Reason:** Callers can handle domain failures safely without parsing prose. Overpayment returns `PAYMENT_EXCEEDS_BALANCE` plus `remainingAmountCents`.
**Tradeoffs:** Error contracts become part of the API surface and should remain backward compatible.

## D009 — Calendar dates use UTC day semantics

**Status:** Implemented
**Decision:** Store due dates and payment dates at UTC midnight and consider an order overdue only after its UTC due-date day has passed.
**Context:** The product currently has no account-specific timezone setting.
**Reason:** Explicit UTC date semantics avoid server-local timezone differences and premature overdue status on the due date.
**Tradeoffs:** A production multi-region product should define account/legal timezone policies and render dates accordingly.
