import crypto from 'node:crypto';
import { connectDatabase } from '../auth/service.js';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
let sessionCollectionPromise;

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function matches(value, expected) {
  const actualHash = Buffer.from(hash(value), 'hex');
  const expectedHash = Buffer.from(hash(expected), 'hex');
  return crypto.timingSafeEqual(actualHash, expectedHash);
}

async function getSessions() {
  if (!sessionCollectionPromise) {
    sessionCollectionPromise = connectDatabase().then(async (database) => {
      const sessions = database.collection('admin_sessions');
      await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      return sessions;
    });
  }
  return sessionCollectionPromise;
}

export async function loginAdmin({ email: rawEmail, password }) {
  const configuredEmail = process.env.ADMIN_EMAIL;
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredEmail || !configuredPassword) {
    const error = new Error('Admin login is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD on the backend.');
    error.statusCode = 503;
    throw error;
  }

  const email = String(rawEmail || '').trim().toLowerCase();
  const validEmail = matches(email, configuredEmail.trim().toLowerCase());
  const validPassword = matches(String(password || ''), configuredPassword);
  if (!validEmail || !validPassword) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await (await getSessions()).insertOne({
    tokenHash: hash(token),
    email: configuredEmail.trim().toLowerCase(),
    createdAt: new Date(),
    expiresAt,
  });

  return {
    token,
    admin: { email: configuredEmail.trim().toLowerCase() },
    expiresAt,
  };
}

export async function getAdminSession(token) {
  if (!token) return null;
  const session = await (await getSessions()).findOne({
    tokenHash: hash(token),
    expiresAt: { $gt: new Date() },
  });
  return session ? { email: session.email } : null;
}

export async function deleteAdminSession(token) {
  if (!token) return;
  await (await getSessions()).deleteOne({ tokenHash: hash(token) });
}
