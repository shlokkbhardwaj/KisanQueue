# Kisan Queue — SIH-ready consolidated build

## What is included
- Farmer authentication, booking, token and live queue APIs
- Consistent `/api` response contract for crops
- Fresh Supabase schema + security migrations + seed data
- Server-backed staff authentication with roles: operator, supervisor, admin
- Centre-scoped staff authorization
- Real staff queue API: call, serve, hold, resume, complete, skip, recall
- Queue event audit table
- Staff pages 11–13 connected to the backend
- Staff helper `staff-app.js`
- Real CSV export on the reports page
- No staff demo passwords in frontend source
- No `.env` or service-role secret included

## Setup
1. Create a fresh Supabase project.
2. Run, in order:
   - `backend/supabase/migrations/001_initial_schema.sql`
   - `backend/supabase/migrations/002_auth_and_security.sql`
   - `backend/supabase/migrations/003_staff_and_queue.sql`
   - `backend/supabase/seed.sql`
3. Copy `backend/.env.example` to `backend/.env` and add your newly rotated service-role key.
4. From `backend/`, run `npm install`.
5. Create a staff account without putting its password in source:
   `STAFF_PASSWORD="ChooseARealPassword1" node scripts/create-staff.mjs OP001 "Centre Operator" operator 1`
6. Start the API with `npm run dev`.
7. Serve the HTML files through a local HTTP server (for example VS Code Live Server).

## Security
The original submission contained a service-role key. Rotate that key in Supabase before using this build. Never upload `backend/.env` or expose the service-role key to frontend code.

## Verification
All modified JavaScript files pass Node syntax checks. The automated test suite should be run after a normal `npm install`; this working environment could not complete dependency installation, so no fresh test count is claimed here.
