# UI guidelines

SettleFlow should feel like a serious B2B finance operations tool: calm, precise, and easy to scan.

## Principles

- Prefer clarity over decoration.
- Give financial data strong hierarchy and consistent alignment.
- Use consistent spacing and obvious primary actions.
- Keep layouts restrained and responsive.
- Show helpful empty, error, success, loading, and disabled states.
- Avoid unnecessary animation, gradients, glass effects, and decorative dashboard widgets.

## Dashboard

The primary orders table contains:

```text
Customer
Status
Total
Paid
Due
Due date
```

Use compact, readable badges for `Pending`, `Partially paid`, `Paid`, and `Overdue`. Right-align numeric financial columns. Keep status filters discoverable and preserve table readability before adding more summary widgets.

## Money and dates

- Display currency consistently, for example `$1,250.00`.
- Never expose raw cents to users.
- Keep API/domain field names explicit about cents.
- Treat due dates as calendar dates and avoid timezone-induced display shifts.

## Forms and actions

- Use explicit accessible labels and appropriate input types.
- Provide immediate previews where useful, while making the server authoritative.
- Show submitting/loading and disabled states for mutations.
- Display useful server error messages directly when safe.
- Make the maximum permitted payment obvious.
- Hide or disable payment creation when fully paid, while retaining server enforcement.

## Required states

Every meaningful screen or action should consider:

- loading/submitting
- empty
- error
- success
- disabled/locked

Order detail pages should explain financial locking after settlement starts rather than merely removing controls.
