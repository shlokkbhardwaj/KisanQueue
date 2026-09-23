import { env } from '../config/env.js';

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export function notFound(req, res) {
  res.status(404).json({ success: false, error: 'Route not found' });
}

// Postgres / PostgREST codes that mean "the database is not set up as the code expects".
const SCHEMA_ERROR_CODES = new Set(['42P01', '42703', 'PGRST200', 'PGRST204', 'PGRST205']);

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let status = err.status || 500;
  if (status >= 500 || !err.status) console.error(err); // expected 4xx errors are not logged as crashes

  let message = err.message || 'Internal server error';
  const body = { success: false };

  if (SCHEMA_ERROR_CODES.has(err.code)) {
    // Never hide these: they are the real reason a page shows "Unable to load".
    status = 500;
    body.code = err.code;
    body.hint = 'The database schema does not match what the backend expects. Run backend/supabase/schema.sql and the files in backend/supabase/migrations/.';
    message = `Database error: ${err.message}`;
  }

  if (status >= 500 && env.isProduction) {
    message = 'Internal server error';
    delete body.hint;
    delete body.code;
  }

  body.error = message;
  res.status(status).json(body);
}
