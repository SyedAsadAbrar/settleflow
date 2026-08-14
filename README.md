# SettleFlow — Orders and Settlements

SettleFlow is a backend-first financial operations application for creating customer orders and applying partial or full payments. It keeps the order balance auditable, derives status from financial facts, and prevents overpayment even when payment requests arrive concurrently.

**Live application:** [settleflow-ten.vercel.app](https://settleflow-ten.vercel.app)

## What is implemented

- Email/password signup, login, logout, and current-user APIs
- bcrypt password hashing and signed JWT sessions in `httpOnly` cookies
- User-scoped order CRUD APIs with server-side validation and total calculation
- Partial and full payments with an actionable overpayment error
- MongoDB transaction and order-document contention for concurrent payment safety
- Derived `pending`, `partially_paid`, `paid`, and `overdue` statuses
- Financial immutability after the first payment
- Responsive dashboard, status filters, summary metrics, order form, detail view, and payment history
- Pure domain tests, strict TypeScript, linting, production build, CI, and Docker support

## Architecture

This is one Next.js App Router application to minimize deployment and operational overhead while keeping backend boundaries explicit:

```text
src/
  app/
    api/                     # HTTP transport: auth, parsing, response codes
    (auth)/                  # Login and signup UI
    (app)/                   # Authenticated dashboard and order UI
  components/                # Reusable and interactive React UI
  lib/
    auth/                    # JWT cookie session
    db/                      # Cached Mongoose connection
    http/                    # Consistent API errors
  models/                    # MongoDB schemas and indexes
  modules/
    orders/                  # Validation, pure domain rules, services
    payments/                # Validation, pure domain rules, services
    users/                   # Authentication service
  types/                     # API/domain view types
tests/                       # Fast domain tests
```

Route handlers are intentionally thin. Zod owns transport validation, pure functions own calculations and state derivation, services enforce ownership and orchestration, and Mongoose models own persistence shape. React components never decide whether a payment is financially valid.

## Data model and indexes

### Users

`email`, `passwordHash`, and timestamps. A unique email index provides both lookup performance and the final defense against signup races. Password hashes are excluded from normal queries.

### Orders

`userId`, customer, UTC date-only due date, embedded line items, authoritative `totalCents`, an internal `paymentVersion`, and timestamps.

- `{ userId: 1, createdAt: -1 }` serves the user's dashboard in its default order.
- `{ userId: 1, dueDate: 1 }` supports per-user due-date and overdue scans.

Line items are embedded because they are owned by and read with the order, and are immutable after settlement starts. `paymentVersion` is not a balance; it is a contention token used to prevent transaction write skew.

### Payments

`userId`, `orderId`, `amountCents`, UTC date-only payment date, optional note, and timestamps.

- `{ orderId: 1, createdAt: -1 }` supports payment history and balance aggregation for one order.
- `{ userId: 1, orderId: 1 }` supports ownership-scoped payment lookups and aggregation.

Payments are separate immutable financial facts, rather than a growing array on the order. This avoids unbounded order documents and makes settlement history independently queryable.

## Financial decisions

### Money uses integer cents

MongoDB and domain code store `$1,000.00` as `100000`. API inputs accept a plain decimal dollar string/number with at most two decimal places, convert it without floating-point multiplication, and then work exclusively in cents. The API recomputes the total from line items; the browser total is only a preview.

### Status is derived

Status is not persisted:

1. `paid` when payments meet the total, even after the due date
2. `overdue` when an unpaid balance remains and the UTC due-date calendar day has passed
3. `partially_paid` when some money has been received
4. otherwise `pending`

This prevents contradictions such as a fully settled order carrying `partially_paid`. A due date is treated as a date, not an instant: it becomes overdue on the following UTC calendar day.

### Orders lock after settlement starts

Once any payment exists, `PATCH` and `DELETE` return `ORDER_LOCKED`. Changing line items, prices, total, or due date after money has been applied would undermine reconciliation. The API enforces the rule inside a transaction; disabled UI controls are not a security boundary.

## Concurrent payment correctness

The unsafe workflow is: two requests each read a $1,000 balance, each accepts $600, and each inserts a different payment. A transaction that only reads the sum and inserts a new payment still permits this write-skew pattern because the inserts do not conflict.

SettleFlow's payment transaction therefore:

1. scopes and reads the order by authenticated `userId`
2. aggregates payments and validates the remaining balance
3. increments that order's private `paymentVersion`
4. inserts the payment

Both concurrent transactions must write the same order document. MongoDB produces a write conflict for one transaction; the driver retries its callback against a fresh snapshot, recomputes the paid amount, and rejects the now-excessive payment. The order does **not** cache `amountPaid` or status, so payments remain the source of truth.

MongoDB transactions require Atlas or another replica set. This application intentionally fails rather than falling back to an unsafe non-transactional payment write.

## REST API

All success payloads use `{ "data": ... }`. Errors use:

```json
{
  "error": {
    "code": "PAYMENT_EXCEEDS_BALANCE",
    "message": "Payment exceeds the remaining balance.",
    "remainingAmountCents": 60000
  }
}
```

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/signup` | Create account and session |
| POST | `/api/auth/login` | Create session |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Return current user |
| GET | `/api/orders?status=pending` | List/filter owned orders |
| POST | `/api/orders` | Create an owned order |
| GET | `/api/orders/:id` | Return order and payment history |
| PATCH | `/api/orders/:id` | Replace editable order fields |
| DELETE | `/api/orders/:id` | Delete an unpaid order |
| GET | `/api/orders/:id/payments` | List order payments |
| POST | `/api/orders/:id/payments` | Record a payment transactionally |

Order input uses `customer`, `dueDate: "YYYY-MM-DD"`, and line items containing `description`, `quantity`, and decimal-dollar `unitPrice`. Payment input uses decimal-dollar `amount`, `paymentDate: "YYYY-MM-DD"`, and optional `note`.

## Security

- Passwords use bcrypt cost factor 12 and are never serialized.
- JWTs use HS256 with a required 32+ character secret and seven-day expiry.
- Session cookies are `httpOnly`, `SameSite=Lax`, path-scoped, and `Secure` in production.
- APIs derive user identity from the signed cookie and include `userId` in every resource query. Browser-provided user IDs are ignored.
- Zod validates request bodies; malformed IDs and JSON receive stable errors; unexpected stack traces are not returned.
- Baseline response headers disable MIME sniffing, framing, and unnecessary browser capabilities.
- Secrets are environment variables and `.env*` is excluded from source control and Docker context.

For a public production system I would additionally add rate limits to auth and mutation routes, CSRF tokens or strict Origin checks for state-changing requests, password-reset/email-verification flows, session revocation/rotation, and a stronger Content Security Policy.

## Local development

Requirements: Node.js 22, pnpm 10, and a MongoDB Atlas database (or local replica set).

```bash
cp .env.example .env.local
corepack pnpm install
corepack pnpm dev
```

Configure:

```text
MONGODB_URI=mongodb+srv://...
JWT_SECRET=a-random-secret-with-at-least-32-characters
```

Open `http://localhost:3000`, create an account, and run the required scenario: create a `$1,000` order, pay `$400`, pay `$600`, then verify another `$1` is rejected.

## Verification

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

Tests cover multi-line cents totals, every status branch, exact and excessive balances, payment after full settlement, order immutability, and decimal input parsing. The GitHub Actions workflow runs install, lint, typecheck, tests, and build.

The suite also includes a database-backed concurrent-payment test. It is skipped locally unless `RUN_DB_TESTS=1` and `MONGODB_URI` point to a dedicated non-production Atlas replica-set database. In GitHub Actions it runs automatically after adding a repository secret named `MONGODB_TEST_URI`; never use the production URI for this test because it creates and then cleans up a temporary account and order.

## Deployment

### Vercel + Atlas

1. Import the repository into Vercel.
2. Add `MONGODB_URI` and a production `JWT_SECRET` to the Production environment.
3. In Atlas, create a least-privilege database user and permit Vercel egress (a private/network integration is preferable to broad public access).
4. Deploy, exercise signup and the full settlement scenario, then put the URL at the top of this README.

### Docker / AWS path

The multi-stage Dockerfile produces the Next.js standalone server as a non-root user. A production AWS shape could use ECR + ECS Fargate behind an ALB, Secrets Manager for configuration, CloudWatch/OpenTelemetry for logs and traces, and either Atlas with private connectivity or DocumentDB only after compatibility testing. Vercel is the pragmatic take-home deployment; moving hosts does not improve the core financial design.

## Scope tradeoffs and production roadmap

Implemented status filtering derives all statuses after one orders query and one grouped payment query, then filters in application memory. This is coherent for take-home-sized account data and avoids an N+1 query. At scale I would add pagination and a transactionally maintained/materialized balance read model, with a reconciliation job against immutable payments.

Not implemented, and deliberately kept off today's critical path:

- **Idempotency keys:** require `Idempotency-Key` on payment mutations, store a per-user key plus request hash and response under a unique compound index, and create/check it in the same transaction. Same key + same hash replays the stored response; same key + different hash returns a conflict.
- **Payment reversals/refunds:** append compensating financial events rather than editing/deleting payment history.
- **Richer audit log:** record order and payment lifecycle events with actor, entity, safe metadata, request ID, and timestamp.
- **Observability:** structured logs, correlation IDs, tracing, payment-failure metrics, latency/error dashboards, and actionable alerts.
- **Platform hardening:** RBAC, backup/PITR restore drills, key rotation, WAF/rate limiting, private database networking, dependency/security scanning, and staged CI/CD with migration/index checks.
- **Scale features:** cursor pagination, server-side materialized status filters, exports, multi-currency with explicit currency fields, and account time-zone policies.

These are production improvements, not claims about the current implementation.
