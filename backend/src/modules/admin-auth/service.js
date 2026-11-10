import crypto from 'node:crypto';
import { connectDatabase } from '../auth/service.js';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
let sessionCollectionPromise;

const roles = new Set(['owner', 'course_manager', 'support', 'finance']);

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
  const email = String(rawEmail || '').trim().toLowerCase();
  const credentials = String(password || '');
  const database = await connectDatabase();
  const adminUser = await database.collection('admin_users').findOne({ email, status: 'active' });
  let admin;

  if (adminUser && await verifyPassword(credentials, adminUser.passwordSalt, adminUser.passwordHash)) {
    admin = { email: adminUser.email, role: adminUser.role, userId: adminUser._id };
  } else {
    const configuredUsers = getConfiguredAdmins();
    const configured = configuredUsers.find((item) => item.email === email);
    if (configured && matches(credentials, configured.password)) {
      admin = { email, role: configured.role };
    }
  }
  if (!admin) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await (await getSessions()).insertOne({
    tokenHash: hash(token),
    email: admin.email,
    role: admin.role,
    ...(admin.userId ? { userId: admin.userId } : {}),
    createdAt: new Date(),
    expiresAt,
  });

  return {
    token,
    admin: { email: admin.email, role: admin.role },
    expiresAt,
  };
}

export async function getAdminSession(token) {
  if (!token) return null;
  const session = await (await getSessions()).findOne({
    tokenHash: hash(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;
  if (session.userId) {
    const adminUser = await (await connectDatabase()).collection('admin_users').findOne({ _id: session.userId, status: 'active' });
    if (!adminUser) return null;
    return { email: adminUser.email, role: adminUser.role, id: String(adminUser._id) };
  }
  return { email: session.email, role: session.role || 'owner' };
}

export async function deleteAdminSession(token) {
  if (!token) return;
  await (await getSessions()).deleteOne({ tokenHash: hash(token) });
}

function getConfiguredAdmins() {
  const values = [];
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    values.push({
      email: process.env.ADMIN_EMAIL.trim().toLowerCase(),
      password: process.env.ADMIN_PASSWORD,
      role: process.env.ADMIN_ROLE || 'owner',
    });
  }
  if (process.env.ADMIN_USERS_JSON) {
    let configured;
    try {
      configured = JSON.parse(process.env.ADMIN_USERS_JSON);
    } catch {
      const error = new Error('ADMIN_USERS_JSON must contain a valid JSON array.');
      error.statusCode = 503;
      throw error;
    }
    if (!Array.isArray(configured)) {
      const error = new Error('ADMIN_USERS_JSON must contain a valid JSON array.');
      error.statusCode = 503;
      throw error;
    }
    for (const item of configured) {
      const email = String(item?.email || '').trim().toLowerCase();
      const password = String(item?.password || '');
      const role = String(item?.role || '');
      if (!email || password.length < 12 || !roles.has(role)) {
        const error = new Error('Each ADMIN_USERS_JSON entry needs an email, a password of at least 12 characters, and a valid role.');
        error.statusCode = 503;
        throw error;
      }
      values.push({ email, password, role });
    }
  }
  return values;
}

function derivePassword(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key.toString('base64'));
    });
  });
}

async function verifyPassword(password, salt, expectedHash) {
  const actual = Buffer.from(await derivePassword(password, Buffer.from(salt, 'base64')));
  const expected = Buffer.from(expectedHash);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export async function listAdminUsers() {
  const database = await connectDatabase();
  const configured = getConfiguredAdmins().map(({ email, role }) => ({ email, role, source: 'environment' }));
  const stored = await database.collection('admin_users')
    .find({}, { projection: { email: 1, role: 1, status: 1, createdAt: 1 } })
    .sort({ createdAt: 1 })
    .toArray();
  return [...configured, ...stored.map(({ _id, ...user }) => ({ id: String(_id), source: 'managed', ...user }))];
}

export async function createAdminUser({ email: rawEmail, password, role }) {
  const email = String(rawEmail || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw makeError('Enter a valid admin email address.', 400);
  if (normalizedPassword.length < 12 || normalizedPassword.length > 128) {
    throw makeError('Admin passwords must be between 12 and 128 characters.', 400);
  }
  if (!roles.has(role) || role === 'owner') throw makeError('Select a supported non-owner admin role.', 400);

  const database = await connectDatabase();
  const existing = await database.collection('admin_users').findOne({ email });
  if (existing || getConfiguredAdmins().some((admin) => admin.email === email)) {
    throw makeError('An admin with this email already exists.', 409);
  }
  const salt = crypto.randomBytes(16);
  const passwordHash = await derivePassword(normalizedPassword, salt);
  const result = await database.collection('admin_users').insertOne({
    email,
    role,
    status: 'active',
    passwordSalt: salt.toString('base64'),
    passwordHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { id: String(result.insertedId), email, role, status: 'active' };
}

export async function updateAdminUser(id, { role, status }) {
  const { ObjectId } = await import('mongodb');
  if (!ObjectId.isValid(id)) throw makeError('A valid admin ID is required.', 400);
  if (role !== undefined && (!roles.has(role) || role === 'owner')) throw makeError('Select a supported non-owner admin role.', 400);
  if (status !== undefined && !['active', 'disabled'].includes(status)) throw makeError('status must be active or disabled.', 400);
  const changes = { updatedAt: new Date() };
  if (role !== undefined) changes.role = role;
  if (status !== undefined) changes.status = status;
  const database = await connectDatabase();
  const result = await database.collection('admin_users').findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: changes },
    { returnDocument: 'after', projection: { passwordHash: 0, passwordSalt: 0 } },
  );
  if (!result) throw makeError('Admin user not found.', 404);
  return { id: String(result._id), email: result.email, role: result.role, status: result.status };
}

function makeError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
