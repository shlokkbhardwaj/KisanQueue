import crypto from 'node:crypto';
import { promisify } from 'node:util';

/*
 * Password hashing with scrypt (built into Node.js - no extra dependency).
 * scrypt is a memory-hard password KDF recommended by OWASP, comparable to bcrypt.
 *
 * Stored format:  scrypt$N$r$p$<salt base64>$<hash base64>
 * The parameters are stored with every hash so they can be raised later without
 * invalidating existing passwords.
 */

const scrypt = promisify(crypto.scrypt);

const N = 2 ** 15; // CPU/memory cost (~32 MiB per hash)
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const MAX_MEMORY = 128 * 1024 * 1024;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890',
  'qwerty123', 'qwertyuiop', 'iloveyou', 'abc12345', 'admin123', 'welcome123',
  'kisan123', 'kisanqueue', 'farmer123', 'farmerqueue'
]);

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(String(password), salt, KEY_LENGTH, { N, r: R, p: P, maxmem: MAX_MEMORY });
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  try {
    const [scheme, n, r, p, saltB64, hashB64] = String(stored || '').split('$');
    if (scheme !== 'scrypt') return false;
    const salt = Buffer.from(saltB64, 'base64');
    const expected = Buffer.from(hashB64, 'base64');
    const derived = await scrypt(String(password), salt, expected.length, {
      N: Number(n), r: Number(r), p: Number(p), maxmem: MAX_MEMORY
    });
    return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

let dummyHashPromise = null;
/** Verify against a throw-away hash so "unknown mobile" costs the same time as "wrong password". */
export async function burnPasswordCheck(password) {
  dummyHashPromise ||= hashPassword(crypto.randomBytes(12).toString('hex'));
  await verifyPassword(password, await dummyHashPromise);
}

/** Returns an error message, or null when the password is acceptable. */
export function validatePassword(password, { mobile } = {}) {
  if (typeof password !== 'string' || !password) return 'Password is required.';
  if (password.length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (password.length > PASSWORD_MAX_LENGTH) return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Password must contain at least one letter and one number.';
  if (mobile && password.includes(String(mobile))) return 'Password must not contain your mobile number.';
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return 'This password is too common. Please choose a different one.';
  return null;
}

export function hashSessionToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export function newSessionToken() {
  return crypto.randomBytes(32).toString('base64url');
}
