# Delivery checklist

Checked items are present in the repository and were reasonably verified. Deployment and database-backed integration work remain unchecked until they actually occur.

## Foundation

- [x] Project initialized
- [x] Dependencies configured
- [x] Environment example
- [x] MongoDB connection

## Authentication

- [x] User model
- [x] Signup
- [x] Login
- [x] Logout
- [x] Current user
- [x] Ownership enforcement

## Orders

- [x] Order model
- [x] Validation
- [x] Create order
- [x] List orders
- [x] Get order
- [x] Update order
- [x] Delete order
- [x] Calculate authoritative total
- [x] Financial locking after first payment

## Payments

- [x] Payment model
- [x] Record payment
- [x] Payment history
- [x] Partial payments
- [x] Overpayment rejection
- [x] Actionable error
- [x] Concurrency protection
- [x] Updated balance/status response

## Domain logic

- [x] Integer-cents money
- [x] Total calculation
- [x] Status derivation
- [x] Amount paid
- [x] Amount due

## Frontend

- [x] Signup/login
- [x] Dashboard
- [x] Status filtering
- [x] Create order
- [x] Order detail
- [x] Payment form
- [x] Loading/submitting states
- [x] Error states
- [x] Empty states

## Tests

- [x] Order total calculation
- [x] Status derivation
- [x] Partial payments
- [x] Exact final payment
- [x] Overpayment rejection
- [x] Overdue handling
- [x] Order locking
- [ ] Replica-set concurrency integration test

## Delivery

- [x] Lint
- [x] Typecheck
- [x] Tests
- [x] Production build
- [x] MongoDB Atlas configured
- [x] Public deployment
- [x] Deployed production smoke test
- [x] README
- [x] Live URL added to README

## Optional

- [ ] Audit log
- [ ] Idempotency key
- [x] CI
- [x] Vercel Web Analytics
- [ ] Additional UI polish

## Last verified

On 2026-08-14, after adding Vercel Web Analytics, `pnpm lint`, `pnpm typecheck`, 18 Vitest tests, and the Webpack production build completed successfully. The Atlas-backed application was manually exercised through the deployed UI. The public login route returned HTTP 200 from Vercel, and the unauthenticated current-user API returned the expected 401 response. The only remaining verification gap is the replica-set concurrency integration test.
