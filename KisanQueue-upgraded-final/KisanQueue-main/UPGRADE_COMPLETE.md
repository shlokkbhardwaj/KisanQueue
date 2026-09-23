# Kisan Queue — Upgrade Complete

This package preserves the existing 16-page frontend, farmer/staff authentication, booking,
queue console, Supabase schema, and deployment configuration.

## Added
- Database-backed mandi price API: `GET /api/prices`
- Farmer dashboard mandi price checker
- Live staff analytics API: `GET /api/staff/analytics`
- Reports page wired to live booking/queue data instead of hard-coded demo metrics
- Automated, deduplicated turn-approaching in-app queue notifications
- Notification read-state compatibility (`read` + `read_at`)
- Production-safe `staff-app.js` API resolution (localhost only for local development)
- Queue ETA prediction metadata explaining the calculation method
- Migration `005_smart_queue_prices_analytics.sql`

## Data integrity
- No market price is generated or presented as live unless it exists in the `prices` table.
- Queue ETA is calculated from actual queue position and completed service-time records.
- Existing authentication and booking flows are preserved.

## Validation
- JavaScript syntax checks passed for the modified backend/shared JS files.
- The included test suite could not be executed in this isolated packaging environment because
  dependency installation did not complete; run `npm.cmd install` followed by `npm.cmd test`
  on the development machine before deployment.
