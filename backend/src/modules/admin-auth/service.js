import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { connectDatabase } from '../auth/service.js';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const EMAIL_CHANGE_TTL_MS = 10 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const EMAIL_RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_EMAIL_OTP_ATTEMPTS = 5;
let sessionCollectionPromise;
let securityIndexesPromise;

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
    const overrides = database.collection('admin_auth_overrides');
    const matchingOverride = configuredUsers.length
      ? await overrides.findOne({ email, sourceEmail: { $in: configuredUsers.map((item) => item.email) } })
      : null;
    const configured = matchingOverride
      ? configuredUsers.find((item) => item.email === matchingOverride.sourceEmail)
      : configuredUsers.find((item) => item.email === email);
    if (configured) {
      const override = matchingOverride || await overrides.findOne({ sourceEmail: configured.email });
      const emailMatches = !override || override.email === email;
      const passwordMatches = override?.passwordHash
        ? await verifyPassword(credentials, override.passwordSalt, override.passwordHash)
        : matches(credentials, configured.password);
      if (emailMatches && passwordMatches) {
        admin = { email, role: configured.role, sourceEmail: configured.email };
      }
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
    ...(admin.sourceEmail ? { sourceEmail: admin.sourceEmail } : {}),
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
  const configuredUsers = getConfiguredAdmins();
  const sourceEmail = session.sourceEmail
    || configuredUsers.find((item) => item.email === session.email)?.email;
  if (sourceEmail) {
    const configured = configuredUsers.find((item) => item.email === sourceEmail);
    if (!configured) return null;
    const override = await (await connectDatabase()).collection('admin_auth_overrides').findOne({ sourceEmail });
    return { email: override?.email || configured.email, role: configured.role, sourceEmail };
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
  const configuredUsers = getConfiguredAdmins();
  const overrides = configuredUsers.length
    ? await database.collection('admin_auth_overrides').find({ sourceEmail: { $in: configuredUsers.map((item) => item.email) } }).toArray()
    : [];
  const overridesBySourceEmail = new Map(overrides.map((override) => [override.sourceEmail, override]));
  const configured = configuredUsers.map(({ email, role }) => ({
    email: overridesBySourceEmail.get(email)?.email || email,
    role,
    source: 'environment',
  }));
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
  const configuredUsers = getConfiguredAdmins();
  const overrides = configuredUsers.length
    ? await database.collection('admin_auth_overrides').find({ sourceEmail: { $in: configuredUsers.map((item) => item.email) } }).toArray()
    : [];
  const configuredEmails = new Set(configuredUsers.map((admin) => (
    overrides.find((override) => override.sourceEmail === admin.email)?.email || admin.email
  )));
  if (existing || configuredEmails.has(email)) {
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

function getAdminIdentity(admin) {
  if (admin.id) return { identityKey: `managed:${admin.id}`, adminUserId: admin.id };
  if (admin.sourceEmail) return { identityKey: `environment:${admin.sourceEmail}`, sourceEmail: admin.sourceEmail };
  throw makeError('This admin session cannot manage account security. Sign in again.', 401);
}

function normalizeAdminEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw makeError('Enter a valid email address.', 400);
  }
  return email;
}

function otpHash(otp) {
  if (!process.env.OTP_SECRET) throw makeError('OTP_SECRET must be configured to change admin email addresses.', 503);
  return crypto.createHmac('sha256', process.env.OTP_SECRET).update(`admin-email-change:${otp}`).digest('hex');
}

function createMailer() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw makeError('SMTP is not configured. Set SMTP_USER and SMTP_PASSWORD to send admin security emails.', 503);
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
}

async function ensureSecurityIndexes(database) {
  if (!securityIndexesPromise) {
    securityIndexesPromise = Promise.all([
      database.collection('admin_email_change_challenges').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      database.collection('admin_password_reset_tokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    ]).catch((error) => {
      securityIndexesPromise = null;
      throw error;
    });
  }
  await securityIndexesPromise;
}

async function assertAdminEmailAvailable(database, email, identity) {
  const managed = await database.collection('admin_users').findOne({ email });
  if (managed && managed._id.toString() !== identity.adminUserId) {
    throw makeError('That email address is already assigned to an admin account.', 409);
  }

  const configuredUsers = getConfiguredAdmins();
  const overrides = configuredUsers.length
    ? await database.collection('admin_auth_overrides').find({ sourceEmail: { $in: configuredUsers.map((item) => item.email) } }).toArray()
    : [];
  for (const configured of configuredUsers) {
    const override = overrides.find((item) => item.sourceEmail === configured.email);
    const currentEmail = override?.email || configured.email;
    if (currentEmail === email && identity.sourceEmail !== configured.email) {
      throw makeError('That email address is already assigned to an admin account.', 409);
    }
  }
}

export async function requestAdminEmailChange(admin, { email: rawEmail }) {
  const email = normalizeAdminEmail(rawEmail);
  if (email === admin.email) throw makeError('Enter an email address different from your current one.', 400);
  const identity = getAdminIdentity(admin);
  const database = await connectDatabase();
  await ensureSecurityIndexes(database);
  await assertAdminEmailAvailable(database, email, identity);

  const challenges = database.collection('admin_email_change_challenges');
  const previous = await challenges.findOne({ identityKey: identity.identityKey });
  if (previous && Date.now() - previous.createdAt.getTime() < EMAIL_RESEND_COOLDOWN_MS) {
    throw makeError('Wait one minute before requesting another verification code.', 429);
  }

  const otp = String(crypto.randomInt(100000, 1000000));
  const hashedOtp = otpHash(otp);
  await challenges.deleteMany({ identityKey: identity.identityKey });
  const challenge = {
    ...identity,
    identityKey: identity.identityKey,
    email,
    otpHash: hashedOtp,
    attempts: 0,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + EMAIL_CHANGE_TTL_MS),
  };
  await challenges.insertOne(challenge);
  try {
    await createMailer().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Verify your SCS Academy admin email',
      text: `Your admin email verification code is ${otp}. It expires in 10 minutes.`,
    });
  } catch (error) {
    await challenges.deleteOne({ identityKey: identity.identityKey, otpHash: challenge.otpHash });
    console.error('Admin email verification delivery failed:', error);
    throw makeError('The verification email could not be sent. Check SMTP configuration and try again.', 503);
  }
  return { message: 'A verification code has been sent to the new email address.' };
}

export async function verifyAdminEmailChange(admin, { email: rawEmail, otp: rawOtp }) {
  const email = normalizeAdminEmail(rawEmail);
  const otp = String(rawOtp || '').trim();
  if (!/^\d{6}$/.test(otp)) throw makeError('Enter the six-digit verification code.', 400);
  const identity = getAdminIdentity(admin);
  const database = await connectDatabase();
  const challenges = database.collection('admin_email_change_challenges');
  const challenge = await challenges.findOne({
    identityKey: identity.identityKey,
    email,
    expiresAt: { $gt: new Date() },
  });
  if (!challenge) throw makeError('The verification code expired or was not found. Request a new code.', 400);
  if (!matches(otpHash(otp), challenge.otpHash)) {
    const attempts = challenge.attempts + 1;
    if (attempts >= MAX_EMAIL_OTP_ATTEMPTS) {
      await challenges.deleteOne({ _id: challenge._id });
      throw makeError('Too many incorrect codes. Request a new verification code.', 429);
    }
    await challenges.updateOne({ _id: challenge._id }, { $set: { attempts } });
    throw makeError('The verification code is incorrect.', 400);
  }

  await assertAdminEmailAvailable(database, email, identity);
  if (identity.adminUserId) {
    const { ObjectId } = await import('mongodb');
    const result = await database.collection('admin_users').updateOne(
      { _id: new ObjectId(identity.adminUserId), status: 'active' },
      { $set: { email, updatedAt: new Date() } },
    );
    if (!result.matchedCount) throw makeError('Admin account not found.', 404);
  } else {
    await database.collection('admin_auth_overrides').updateOne(
      { sourceEmail: identity.sourceEmail },
      { $set: { email, updatedAt: new Date() }, $setOnInsert: { sourceEmail: identity.sourceEmail, createdAt: new Date() } },
      { upsert: true },
    );
  }
  await challenges.deleteOne({ _id: challenge._id });
  await database.collection('admin_password_reset_tokens').deleteMany({ identityKey: identity.identityKey });
  return { email, message: 'Admin email updated successfully.' };
}

export async function requestAdminPasswordReset(admin) {
  const identity = getAdminIdentity(admin);
  const database = await connectDatabase();
  await ensureSecurityIndexes(database);
  const resetTokens = database.collection('admin_password_reset_tokens');
  const previous = await resetTokens.findOne({ identityKey: identity.identityKey });
  if (previous && Date.now() - previous.createdAt.getTime() < EMAIL_RESEND_COOLDOWN_MS) {
    throw makeError('Wait one minute before requesting another password link.', 429);
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hash(token);
  await resetTokens.deleteMany({ identityKey: identity.identityKey });
  await resetTokens.insertOne({
    ...identity,
    identityKey: identity.identityKey,
    email: admin.email,
    tokenHash,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
  });

  let resetUrl;
  try {
    let appUrl;
    try {
      appUrl = new URL(process.env.ADMIN_APP_URL || 'http://127.0.0.1:5174');
    } catch {
      throw makeError('ADMIN_APP_URL must be a valid admin-site URL.', 503);
    }
    if (!['http:', 'https:'].includes(appUrl.protocol) || (process.env.NODE_ENV === 'production' && appUrl.protocol !== 'https:')) {
      throw makeError('ADMIN_APP_URL must use HTTP or HTTPS, and HTTPS in production.', 503);
    }
    resetUrl = new URL('/', appUrl);
    resetUrl.searchParams.set('passwordResetToken', token);
    await createMailer().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: admin.email,
      subject: 'Reset your SCS Academy admin password',
      text: `Use this one-time link to reset your admin password. It expires in 30 minutes:\n\n${resetUrl.toString()}\n\nIf you did not request this, you can ignore this email.`,
    });
  } catch (error) {
    await resetTokens.deleteOne({ tokenHash });
    console.error('Admin password reset email delivery failed:', error);
    if (error.statusCode) throw error;
    throw makeError('The password reset email could not be sent. Check SMTP configuration and try again.', 503);
  }
  return { message: `A password reset link has been sent to ${admin.email}.` };
}

export async function completeAdminPasswordReset({ token: rawToken, password: rawPassword }) {
  const token = String(rawToken || '').trim();
  const password = String(rawPassword || '');
  if (!/^[a-f\d]{64}$/i.test(token)) throw makeError('The password reset link is invalid or expired.', 400);
  if (password.length < 12 || password.length > 128) {
    throw makeError('Admin passwords must be between 12 and 128 characters.', 400);
  }
  const database = await connectDatabase();
  await ensureSecurityIndexes(database);
  const tokenHash = hash(token);
  const resetTokens = database.collection('admin_password_reset_tokens');
  const reset = await resetTokens.findOne({ tokenHash, expiresAt: { $gt: new Date() } });
  if (!reset) throw makeError('The password reset link is invalid or expired.', 400);
  const consumed = await resetTokens.deleteOne({ _id: reset._id, expiresAt: { $gt: new Date() } });
  if (!consumed.deletedCount) throw makeError('The password reset link is invalid or expired.', 400);

  const salt = crypto.randomBytes(16);
  const passwordHash = await derivePassword(password, salt);
  if (reset.adminUserId) {
    const { ObjectId } = await import('mongodb');
    const result = await database.collection('admin_users').updateOne(
      { _id: new ObjectId(reset.adminUserId), status: 'active' },
      { $set: { passwordSalt: salt.toString('base64'), passwordHash, updatedAt: new Date() } },
    );
    if (!result.matchedCount) throw makeError('Admin account not found.', 404);
    await (await getSessions()).deleteMany({ userId: new ObjectId(reset.adminUserId) });
  } else {
    if (!getConfiguredAdmins().some((configured) => configured.email === reset.sourceEmail)) {
      throw makeError('Admin account is no longer configured.', 404);
    }
    await database.collection('admin_auth_overrides').updateOne(
      { sourceEmail: reset.sourceEmail },
      {
        $set: { email: reset.email, passwordSalt: salt.toString('base64'), passwordHash, updatedAt: new Date() },
        $setOnInsert: { sourceEmail: reset.sourceEmail, createdAt: new Date() },
      },
      { upsert: true },
    );
    await (await getSessions()).deleteMany({
      $or: [
        { sourceEmail: reset.sourceEmail },
        { email: reset.sourceEmail },
        { email: reset.email },
      ],
    });
  }
  return { message: 'Password updated. Sign in with your new password.' };
}

function makeError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
