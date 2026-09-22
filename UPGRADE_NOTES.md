# Kisan Queue / Farmer Queue — upgrade notes

Copy the files in this zip over your project (`P:\InsightX-SIH26032-FarmerQueue`), keeping the folder paths.
Your `backend\.env` and `node_modules` are **not** in the zip and are untouched. No new npm packages are needed.

## 1. Database changes (do this first)
Open Supabase → SQL Editor → paste and run **`backend/supabase/migrations/001_auth_and_security.sql`** once.
It is safe to re-run and never deletes or edits existing rows. It:
- creates `farmer_credentials` (password **hash** per farmer) and `farmer_sessions` (SHA-256 of the login token);
- adds unique indexes so two tokens can't share a number and identical active bookings can't be duplicated
  (skipped with a NOTICE if your current data already has duplicates);
- turns Row Level Security ON for every table with no policies, so the public *anon* key can read nothing.
  The backend uses the service-role key, which bypasses RLS, so the app keeps working.

## 2. Environment variables (names only — see `backend/.env.example`)
`PORT`, `FRONTEND_ORIGIN` (comma-separated list), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
Optional: `NODE_ENV`, `SESSION_TTL_HOURS` (168), `SLOT_MINUTES` (30), `SLOT_CAPACITY` (20),
`APP_TIMEZONE` (Asia/Kolkata), `ENABLE_DIAGNOSTICS`.
Outside production any `localhost` / `127.0.0.1` port is accepted, so Live Server on either address works.

**Security:** your original zip contained `backend/.env` with the service-role key and there was no `.gitignore`.
A `.gitignore` is included now. Please **rotate the service-role key** in Supabase (Settings → API) and put the new
one in `.env`, especially if the folder was ever shared, zipped or pushed.

## 3. Run (PowerShell)
```powershell
cd P:\InsightX-SIH26032-FarmerQueue\backend
npm.cmd test        # 15 API tests, no Supabase needed
npm.cmd run dev     # API on http://localhost:5000
```
Then open `page01-landing.html` with VS Code Live Server (or any static server on port 5500).
Quick check: <http://localhost:5000/api/health>, <http://localhost:5000/api/crops>, and
<http://localhost:5000/api/health/db> (tells you exactly which table/column is missing if something is wrong).

## 4. What changed
**Backend (`backend/src`)** — new: `app.js`, `controllers/auth|notification.controller.js`, `middleware/auth|rateLimit.js`,
`services/slots|queue|notification.service.js`, `utils/`. Changed: booking, queue, mandi, payment, farmer, health
controllers, `routes/index.js`, `server.js`, `config/env|supabase.js`, `middleware/error.js`, `package.json` (test script).
- Login is backend-owned (mobile number + password, scrypt hash, revocable server-side sessions, rate-limited).
- Booking / token / payment / notification endpoints only return the logged-in farmer's own records.
- Bookings validate the centre accepts the crop, the slot exists, isn't past and isn't full; duplicates and double-clicks are safe.
- Real 30-minute slots from each centre's opening hours, real booked counts, real queue position.
  Wait time is shown only after ≥3 tokens were completed that day — never invented.
- `GET /mandis` accepts `lat/lng/radiusKm/cropId/includeCrops`; new `GET /mandis/:id/slots`, `/bookings/mine`,
  `/bookings/:id/cancel`, `/auth/*`, `/notifications`, `/health/db`. `POST /farmers` is retired (410) — use `/auth/register`.

**Frontend** — new: `kq-app.js` (shared API/login/location helper), `page02a-farmer-login.html`.
Rewritten on real data: pages 03, 04, 05, 06, 07, 08, 09 and the voice assistant. Patched: 01, 02, 10.
- "Unable to load crops": the most likely cause was CORS (Live Server on `127.0.0.1` vs `.env` allowing only `localhost`).
  That is fixed, and the page now shows the real cause plus a **Try again** button (network / server error / empty table).
- Location is opt-in ("Use my location"), rounded, kept in memory only, never saved; if denied the pages still work by search.
- Voice assistant: centres, tokens, queue, payments and cancel come from the API (login needed for personal data);
  full reply sets for Hindi, English, Bengali, Marathi, Gujarati, Punjabi, Tamil, Telugu, Kannada, Malayalam, Bhojpuri.

## 5. Test plan (about 10 minutes)
1. Log out. Open `page03-slot-booking.html` → you are sent to the login page.
2. **Register** (`page02`): weak password is refused; strong password creates the account and logs you in.
3. **Logout** (header button) → **wrong password** shows an error → **login** returns you to where you were.
4. **Crop → quantity**: crops load from the database; enter e.g. 25 quintals.
5. **Centre**: only centres that accept the crop appear. Try "Use my location" (allowed and blocked) and the search box.
6. **Slot**: pick a date; slots come from the centre's hours; a full slot is disabled.
7. **Booking → token**: confirm; the success screen shows a real token (not `#A252`). Double-clicking makes only one booking.
8. **Page 04**: same token, centre, crop, quantity. Copy copies the token. Cancel changes it to Cancelled.
9. **Page 08 / 06 / 05**: queue position, dashboard and timeline show your own booking. Payments show only rows in the `payments` table.
10. **Logout** → protected pages redirect to login again.

Automated versions (need Python + Playwright, dev only): `backend/test/browser/*.py` — they start the real API on an in-memory
database (`backend/test/dev-fake-server.mjs`) and a static server on 5500.

## 6. Known limits — please read
- **Not tested against your live Supabase** (no access from here). Everything was tested against an in-memory stand-in that
  mimics the tables in `schema.sql`. Run `/api/health/db` after the migration to confirm your real schema matches.
- **Staff / operations pages 11–16 are unchanged** and still a prototype: demo staff logins are inside the page script, there
  are no API calls and no session check. They need their own staff auth + queue-console endpoints before any real use.
- Page 10 (centre alerts) has no data source; it is now clearly labelled as sample content.
- Market prices and transport cost have no data source; the voice assistant says so instead of quoting numbers.
- Payments are **records only** (there is no payment gateway). Rows must be written by the procurement/treasury system.
- No "forgot password" flow yet (the login page says to contact the centre).
- Non-Hindi/English voice replies were written without a native reviewer; Odia and Assamese still fall back to Hindi.
- If a centre's `operating_hours` text can't be read, standard 9:00–17:00 slots are used and the page says so.

## Step 3 — Staff operations

Staff authentication is now server-backed. Use `backend/scripts/create-staff.mjs` to create the first staff account; passwords are never stored in source or seed SQL. Pages 11–13 use the staff API and no longer use demo credentials or localStorage queue data.

### Creating staff securely

1. Run the three SQL migrations in `backend/supabase/migrations/` in order, then `backend/supabase/seed.sql`.
2. Set the rotated Supabase service-role key in `backend/.env` locally (never commit it).
3. Create staff with an environment-only password:
   `STAFF_PASSWORD="ChooseARealPassword1" node backend/scripts/create-staff.mjs OP001 "Centre Operator" operator 1`
4. Staff login is now API-backed; credentials are not present in HTML/JavaScript.

- Centre naming was centralized: the backend procurement-centre directory is now the source of truth. Legacy `Centre A/B/C` labels were removed from user-facing pages, and migration `004_canonical_centre_names.sql` normalizes older demo labels.
