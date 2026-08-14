# SettleFlow architecture

This document describes the implemented architecture. Update it whenever the implementation materially changes.

## Application architecture

SettleFlow is a single Next.js and TypeScript application containing both the React UI and REST API. It uses:

- Next.js App Router
- React and TypeScript
- Next.js REST route handlers
- MongoDB Atlas-compatible transactions through Mongoose
- Zod request validation
- Tailwind CSS
- Vitest domain tests plus an opt-in Atlas replica-set integration test

A separate Express deployment is intentionally not used. One deployable application reduces delivery and operational overhead for the take-home while internal modules preserve backend boundaries.

## Request and UI flow

```text
HTTP / route handler
        ↓
authentication + request validation
        ↓
service / domain logic
        ↓
Mongoose persistence
        ↓
MongoDB
```

```text
React UI
   ↓
REST API or server-side service read
   ↓
authoritative server-side rules
```

Route handlers authenticate, parse input, invoke services, and translate errors. Zod schemas own boundary validation. Pure domain functions own totals, balances, payment validation, and status derivation. Services enforce ownership and coordinate transactions. Mongoose models define persistence and indexes.

React may calculate a total for immediate preview, but it is never authoritative. Mutations go through REST endpoints. Authenticated server components may call read services directly to avoid internal HTTP requests.

## Repository boundaries

```text
src/
  app/
    api/                    REST transport
    (auth)/                 login and signup UI
    (app)/                  authenticated product UI
  components/               reusable and interactive UI
  lib/
    auth/                    JWT cookie session
    db/                      cached Mongoose connection
    http/                    API errors and client helpers
    validation.ts            shared request-boundary validation
  models/                    Mongoose schemas and indexes
  modules/
    orders/                  order schemas, domain rules, services
    payments/                payment schemas, domain rules, views, services
    users/                   authentication schemas and services
  types/                     shared view/domain types
tests/                       domain tests and opt-in database integration tests
```

The main domain areas are authentication, orders, and payments.

## Money

All persisted monetary values are integer cents:

```text
$10.00  = 1000
$500.00 = 50000
```

Fields expose their unit through names such as `unitPriceCents`, `totalCents`, `amountCents`, `amountPaidCents`, and `amountDueCents`. Decimal-dollar strings/numbers are accepted only at the API boundary and converted before domain calculations. The server recalculates order totals from line items.

## Order status

Status is derived, not persisted as authoritative state. Precedence is:

```text
amount paid >= total  → paid
otherwise past due    → overdue
otherwise paid > 0    → partially_paid
otherwise             → pending
```

A fully paid order remains `paid` after its due date. Due dates are stored as UTC date-only values and become overdue on the following UTC calendar day.

List queries fetch the user's orders and grouped payment totals, derive status in the application, and then apply an optional status filter. This is suitable for take-home scale; pagination and a materialized balance/status read model are production scale-up options.

## Order immutability

The implemented rule is intentionally stricter than only freezing total-affecting fields: after the first payment, the API rejects all order updates and deletion with `ORDER_LOCKED`. This keeps the workflow simple and prevents changes to financial or due-date context after settlement begins.

The server enforces locking in a transaction. UI state is not treated as a security boundary.

## Payments and concurrency

Payments are separate immutable records. Payment creation must preserve:

```text
sum(payments.amountCents) <= order.totalCents
```

The payment service uses a MongoDB transaction to read the owned order, aggregate its payments, validate the balance, update the order's private `paymentVersion`, and insert the payment. The `paymentVersion` write forces simultaneous payment transactions to contend on the same order document. A conflicting transaction is retried against a fresh snapshot and must revalidate the new remaining balance.

This design requires MongoDB Atlas or another replica set. There is deliberately no unsafe non-transactional fallback.

The repository includes a concurrent-payment integration test. It runs only when `RUN_DB_TESTS=1` and `MONGODB_URI` point to a dedicated non-production replica-set database; CI enables it when its `MONGODB_TEST_URI` secret is configured.

## Authentication and authorization

- Users authenticate with email and password.
- Passwords are hashed with bcrypt.
- A signed JWT is stored in an `httpOnly`, `SameSite=Lax` cookie that is `Secure` in production.
- API routes derive identity from the server-verified cookie.
- Every order and payment operation includes the authenticated `userId` in its persistence query.
- Client-supplied user IDs are never trusted.

## Data model

### User

```text
_id
email                 unique
passwordHash          excluded from normal queries
createdAt
updatedAt
```

### Order

```text
_id
userId
customer
dueDate
lineItems[]
  description
  quantity
  unitPriceCents
totalCents
paymentVersion        internal transaction contention token
createdAt
updatedAt
```

Indexes:

```text
{ userId: 1, createdAt: -1 }
{ userId: 1, dueDate: 1 }
```

### Payment

```text
_id
userId
orderId
amountCents
paymentDate
note
createdAt
updatedAt             supplied by Mongoose timestamps
```

Indexes:

```text
{ orderId: 1, createdAt: -1 }
{ userId: 1, orderId: 1 }
```

Payments remain separate for independent history, auditability, targeted queries, bounded order documents, and a clear transactional boundary.
