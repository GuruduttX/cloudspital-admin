import { createHash, timingSafeEqual } from 'node:crypto';

export const hashToken = (value) => createHash('sha256').update(value).digest('hex');
export const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase();
export const validEmail = (value) => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const digest = (value) => createHash('sha256').update(value).digest();

/** Read only on the server. No fallback credentials when configuration is missing. */
export function configuredAdmin(environment = process.env) {
  const email = normalizeEmail(environment.ADMIN_EMAIL);
  const password = environment.ADMIN_PASSWORD;
  if (!validEmail(email) || !password || password.length > 128) return null;
  return {
    email,
    password,
    name: environment.ADMIN_NAME?.trim() || 'Administrator',
    // Changing either credential invalidates sessions from the previous configuration.
    credentialVersion: hashToken(JSON.stringify([email, password])),
  };
}

export function verifyCredentials(email, password, admin) {
  if (!admin || typeof password !== 'string' || !password || password.length > 128) return false;
  const emailMatches = timingSafeEqual(digest(normalizeEmail(email)), digest(admin.email));
  const passwordMatches = timingSafeEqual(digest(password), digest(admin.password));
  return emailMatches && passwordMatches;
}
