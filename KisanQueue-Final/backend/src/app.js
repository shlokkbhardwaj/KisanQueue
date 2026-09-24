import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';

/*
 * CORS: which web pages may call this API from a browser.
 *
 * FRONTEND_ORIGIN may hold one origin or a comma-separated list, e.g.
 *   FRONTEND_ORIGIN=http://localhost:5500,http://127.0.0.1:5500
 * "localhost" and "127.0.0.1" are DIFFERENT origins to a browser. VS Code Live Server usually opens
 * http://127.0.0.1:5500, so an allow-list containing only http://localhost:5500 silently blocks every
 * request ("Failed to fetch" -> "Unable to load crops"). Outside production, any localhost /
 * 127.0.0.1 port (and pages opened straight from disk, whose origin is "null") are therefore allowed.
 * Authentication uses an Authorization header (no cookies), so this does not enable cross-site
 * request forgery.
 */
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
const warnedOrigins = new Set();

export function isOriginAllowed(origin) {
  if (!origin) return true;                              // curl, server-to-server, same-origin
  if (env.frontendOrigin === '*') return true;
  if (env.frontendOrigins.includes(origin)) return true;
  if (!env.isProduction && (LOCAL_ORIGIN.test(origin) || origin === 'null')) return true;
  return false;
}

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({
    origin(origin, callback) {
      const allowed = isOriginAllowed(origin);
      if (!allowed && !warnedOrigins.has(origin)) {
        warnedOrigins.add(origin);
        console.warn(`CORS: blocked a request from origin "${origin}". Add it to FRONTEND_ORIGIN in backend/.env (comma-separated for several).`);
      }
      callback(null, allowed);
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600
  }));
  app.use(express.json({ limit: '100kb' }));
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
  app.use('/api', routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
