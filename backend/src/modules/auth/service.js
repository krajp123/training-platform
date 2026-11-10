import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { MongoClient } from 'mongodb';

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

let client;
let database;

export function getDatabase() {
  if (!database) {
    const uri = process.env.MONGODB_URI;
    const databaseName = process.env.MONGODB_DB || 'skillpath';
    if (!uri) throw new Error('MONGODB_URI is not configured.');
    client = new MongoClient(uri);
    database = client.connect().then(async (connection) => {
      const db = connection.db(databaseName);
      await db.collection('users').createIndex({ identifier: 1 }, { unique: true });
      await db.collection('users').createIndex({ phone: 1 }, { unique: true, sparse: true });
      await db.collection('otp_challenges').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      await db.collection('password_login_attempts').createIndex({ attemptKey: 1 }, { unique: true });
      await db.collection('password_login_attempts').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      return db;
    });
  }
  return database;
}

export async function connectDatabase() {
  const db = await getDatabase();
  await db.command({ ping: 1 });
  return db;
}

function normalizeIdentifier(identifier) {
  const value = String(identifier || '').trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { type: 'email', value: value.toLowerCase() };
  }
  if (/^\+[1-9]\d{7,14}$/.test(value)) {
    return { type: 'phone', value };
  }
  const error = new Error('Enter a valid email address or phone number with country code, such as +919876543210.');
  error.statusCode = 400;
  throw error;
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(`${otp}:${process.env.OTP_SECRET || 'development-only-change-me'}`).digest('hex');
}

function createOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

async function sendOtp(identifier, otp) {
  if (identifier.type === 'email') {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      throw new Error('Gmail SMTP credentials are not configured. Set SMTP_USER and SMTP_PASSWORD.');
    }
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 465),
      secure: process.env.SMTP_SECURE !== 'false',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: identifier.value,
      subject: 'Your SCS Academy verification code',
      text: `Your SCS Academy verification code is ${otp}. It expires in 10 minutes.`,
    });
    return;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !from) throw new Error('Twilio credentials are not configured.');
  await twilio(accountSid, authToken).messages.create({
    body: `Your SCS Academy verification code is ${otp}. It expires in 10 minutes.`,
    from,
    to: identifier.value,
  });
}

export async function requestOtp({ identifier: rawIdentifier, purpose, name }) {
  if (!['login', 'signup'].includes(purpose)) {
    const error = new Error('OTP purpose must be login or signup.');
    error.statusCode = 400;
    throw error;
  }
  const identifier = normalizeIdentifier(rawIdentifier);
  if (purpose === 'signup' && !String(name || '').trim()) {
    const error = new Error('Full name is required for signup.');
    error.statusCode = 400;
    throw error;
  }

  const db = await getDatabase();
  const challenges = db.collection('otp_challenges');
  const existing = await challenges.findOne({ identifier: identifier.value, purpose });
  const cooldownRemaining = existing
    ? existing.createdAt.getTime() + RESEND_COOLDOWN_MS - Date.now()
    : 0;
  if (cooldownRemaining > 0) {
    const retryAfterSeconds = Math.ceil(cooldownRemaining / 1000);
    const error = new Error(`Please wait ${retryAfterSeconds} seconds before requesting another OTP.`);
    error.statusCode = 429;
    error.retryAfterSeconds = retryAfterSeconds;
    throw error;
  }

  if (purpose === 'login') {
    const user = await db.collection('users').findOne({ identifier: identifier.value });
    if (!user) {
      const error = new Error('No account exists for this email or phone number. Please sign up first.');
      error.statusCode = 404;
      throw error;
    }
    if (user.status === 'suspended') throw makeError('This account has been suspended. Contact support for assistance.', 403);
    if (user.twoFactorEnabled) {
      const error = new Error('Two-factor authentication is enabled. Sign in with your password to continue.');
      error.statusCode = 403;
      throw error;
    }
  }

  const otp = createOtp();
  await challenges.updateOne(
    { identifier: identifier.value, purpose },
    { $set: { identifier: identifier.value, type: identifier.type, purpose, name: String(name || '').trim(), otpHash: hashOtp(otp), createdAt: new Date(), expiresAt: new Date(Date.now() + OTP_TTL_MS), attempts: 0 } },
    { upsert: true },
  );
  try {
    await sendOtp(identifier, otp);
  } catch (error) {
    await challenges.deleteOne({ identifier: identifier.value, purpose, otpHash: hashOtp(otp) });
    throw error;
  }
  return {
    message: `Verification code sent to your ${identifier.type}.`,
    expiresInSeconds: OTP_TTL_MS / 1000,
  };
}

export async function verifyOtp({ identifier: rawIdentifier, purpose, otp, name }) {
  const identifier = normalizeIdentifier(rawIdentifier);
  const db = await getDatabase();
  const challenges = db.collection('otp_challenges');
  const challenge = await challenges.findOne({ identifier: identifier.value, purpose });
  if (!challenge || challenge.expiresAt < new Date()) {
    const error = new Error('This OTP has expired. Request a new code.');
    error.statusCode = 400;
    throw error;
  }
  if (challenge.attempts >= MAX_ATTEMPTS) {
    const error = new Error('Too many incorrect attempts. Request a new OTP.');
    error.statusCode = 429;
    throw error;
  }
  if (challenge.otpHash !== hashOtp(String(otp || '').trim())) {
    await challenges.updateOne({ _id: challenge._id }, { $inc: { attempts: 1 } });
    const error = new Error('Incorrect OTP.');
    error.statusCode = 400;
    throw error;
  }

  await challenges.deleteOne({ _id: challenge._id });
  const users = db.collection('users');
  let user = purpose === 'two-factor-login' && challenge.userId
    ? await users.findOne({ _id: challenge.userId })
    : await users.findOne({ identifier: identifier.value });
  if (!user && purpose === 'signup') {
    user = {
      identifier: identifier.value,
      type: identifier.type,
      name: String(name || challenge.name || '').trim(),
      ...(identifier.type === 'phone' ? { phone: identifier.value, phoneVerified: true } : {}),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await users.insertOne(user);
    user._id = result.insertedId;
  }
  if (!user) {
    const error = new Error('Account not found. Please sign up first.');
    error.statusCode = 404;
    throw error;
  }
  assertActiveUser(user);

  if (purpose === 'login' && user.twoFactorEnabled) {
    throw makeError('Two-factor authentication is enabled. Sign in with your password to continue.', 403);
  }
  if (purpose === 'two-factor-login' && !user.twoFactorEnabled) {
    const error = new Error('Two-factor authentication is no longer enabled for this account.');
    error.statusCode = 400;
    throw error;
  }
  return createSession(user);
}

function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  return getDatabase().then(async (db) => {
    await db.collection('sessions').insertOne({
      tokenHash: hashOtp(token),
      userId: user._id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    return {
      token,
      user: {
        id: String(user._id),
        name: user.name,
        identifier: user.identifier,
        type: user.type,
      },
    };
  });
}

export { normalizeIdentifier };

export async function getAuthenticatedUser(token) {
  if (!token) {
    const error = new Error('Authentication required.');
    error.statusCode = 401;
    throw error;
  }
  const db = await getDatabase();
  const session = await db.collection('sessions').findOne({
    tokenHash: hashOtp(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session) {
    const error = new Error('Your session has expired. Please sign in again.');
    error.statusCode = 401;
    throw error;
  }
  const user = await db.collection('users').findOne({ _id: session.userId });
  if (!user) {
    const error = new Error('Account not found.');
    error.statusCode = 401;
    throw error;
  }
  assertActiveUser(user);
  return user;
}

function makeError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function assertActiveUser(user) {
  if (user.status === 'suspended') {
    throw makeError('This account has been suspended. Contact support for assistance.', 403);
  }
}

async function sendChallenge(identifier, purpose, extra = {}) {
  const db = await getDatabase();
  const challenges = db.collection('otp_challenges');
  const challengeFilter = { identifier: identifier.value, purpose, ...extra };
  const existing = await challenges.findOne(challengeFilter);
  const cooldownRemaining = existing
    ? existing.createdAt.getTime() + RESEND_COOLDOWN_MS - Date.now()
    : 0;
  if (cooldownRemaining > 0) {
    const retryAfterSeconds = Math.ceil(cooldownRemaining / 1000);
    const error = makeError(`Please wait ${retryAfterSeconds} seconds before requesting another OTP.`, 429);
    error.retryAfterSeconds = retryAfterSeconds;
    throw error;
  }

  const otp = createOtp();
  const challenge = {
    identifier: identifier.value,
    type: identifier.type,
    purpose,
    otpHash: hashOtp(otp),
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    attempts: 0,
    ...extra,
  };
  await challenges.updateOne(
    challengeFilter,
    { $set: challenge },
    { upsert: true },
  );
  try {
    await sendOtp(identifier, otp);
  } catch (error) {
    await challenges.deleteOne({ ...challengeFilter, otpHash: challenge.otpHash });
    throw error;
  }
  return { message: `Verification code sent to your ${identifier.type}.`, expiresInSeconds: OTP_TTL_MS / 1000 };
}

function normalizePassword(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw makeError('Password must be between 8 and 128 characters.');
  }
  return password;
}

function derivePassword(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

async function passwordMatches(user, password) {
  if (typeof password !== 'string' || password.length > 128 || !user.passwordHash || !user.passwordSalt) return false;
  const supplied = await derivePassword(password, Buffer.from(user.passwordSalt, 'base64'));
  const stored = Buffer.from(user.passwordHash, 'base64');
  return stored.length === supplied.length && crypto.timingSafeEqual(stored, supplied);
}

export async function setUserPassword(userId, { password, currentPassword }) {
  const normalizedPassword = normalizePassword(password);
  const db = await getDatabase();
  const users = db.collection('users');
  const user = await users.findOne({ _id: userId });
  if (!user) throw makeError('Account not found.', 404);
  if (user.passwordHash && !(await passwordMatches(user, currentPassword || ''))) {
    throw makeError('Current password is incorrect.', 401);
  }

  const salt = crypto.randomBytes(16);
  const passwordHash = await derivePassword(normalizedPassword, salt);
  await users.updateOne(
    { _id: userId },
    { $set: { passwordSalt: salt.toString('base64'), passwordHash: passwordHash.toString('base64'), updatedAt: new Date() } },
  );
  return { passwordEnabled: true };
}

export async function passwordLogin({ identifier: rawIdentifier, password, remoteAddress = '' }) {
  const identifier = normalizeIdentifier(rawIdentifier);
  const db = await getDatabase();
  const attemptKey = crypto.createHash('sha256')
    .update(`${identifier.value}:${remoteAddress}`)
    .digest('hex');
  const attempts = db.collection('password_login_attempts');
  const existingAttempts = await attempts.findOne({ attemptKey });
  if (existingAttempts?.attempts >= 5 && existingAttempts.expiresAt > new Date()) {
    throw makeError('Too many sign-in attempts. Please wait 15 minutes and try again.', 429);
  }
  const user = await db.collection('users').findOne({
    $or: [{ identifier: identifier.value }, { phone: identifier.value }],
  });
  if (!user?.passwordHash || !(await passwordMatches(user, String(password || '')))) {
    await attempts.updateOne(
      { attemptKey },
      { $inc: { attempts: 1 }, $set: { expiresAt: new Date(Date.now() + 15 * 60 * 1000) } },
      { upsert: true },
    );
    throw makeError('Invalid email/phone number or password.', 401);
  }
  assertActiveUser(user);
  await attempts.deleteOne({ attemptKey });

  if (user.twoFactorEnabled) {
    const verifiedPhone = user.phone || (user.type === 'phone' ? user.identifier : '');
    if (!verifiedPhone || !(user.phoneVerified ?? user.type === 'phone')) {
      throw makeError('Add and verify a phone number before using two-factor sign-in.', 400);
    }
    await sendChallenge({ type: 'phone', value: verifiedPhone }, 'two-factor-login', { userId: user._id });
    return { requiresOtp: true, identifier: verifiedPhone, message: 'A verification code was sent to your verified phone.' };
  }

  return createSession(user);
}

export async function requestPhoneVerification(userId, rawPhone) {
  const phone = normalizeIdentifier(rawPhone);
  if (phone.type !== 'phone') throw makeError('Enter a phone number with country code, such as +919876543210.');
  const db = await getDatabase();
  const user = await db.collection('users').findOne({ _id: userId });
  if (!user) throw makeError('Account not found.', 404);
  if (user.phone === phone.value && user.phoneVerified) {
    throw makeError('This phone number is already verified on your account.');
  }
  const existingPhoneUser = await db.collection('users').findOne({
    phone: phone.value,
    _id: { $ne: userId },
  });
  const primaryUser = await db.collection('users').findOne({
    identifier: phone.value,
    _id: { $ne: userId },
  });
  if (existingPhoneUser || primaryUser) throw makeError('This phone number is already associated with another account.', 409);

  await sendChallenge(phone, 'phone-link', { userId });
  return { message: 'Verification code sent to your phone.', expiresInSeconds: OTP_TTL_MS / 1000 };
}

export async function verifyPhoneNumber(userId, { phone: rawPhone, otp }) {
  const phone = normalizeIdentifier(rawPhone);
  if (phone.type !== 'phone') throw makeError('Enter a valid phone number with country code.');
  const db = await getDatabase();
  const challenges = db.collection('otp_challenges');
  const challenge = await challenges.findOne({ identifier: phone.value, purpose: 'phone-link', userId });
  if (!challenge || challenge.expiresAt < new Date()) throw makeError('This OTP has expired. Request a new code.');
  if (challenge.attempts >= MAX_ATTEMPTS) throw makeError('Too many incorrect attempts. Request a new OTP.', 429);
  if (challenge.otpHash !== hashOtp(String(otp || '').trim())) {
    await challenges.updateOne({ _id: challenge._id }, { $inc: { attempts: 1 } });
    throw makeError('Incorrect OTP.');
  }

  await db.collection('users').updateOne(
    { _id: userId },
    { $set: { phone: phone.value, phoneVerified: true, updatedAt: new Date() } },
  );
  await challenges.deleteOne({ _id: challenge._id });
  return { phone: phone.value, phoneVerified: true };
}

export async function requestTwoFactorChange(userId) {
  const db = await getDatabase();
  const user = await db.collection('users').findOne({ _id: userId });
  if (!user) throw makeError('Account not found.', 404);
  if (!user.passwordHash) throw makeError('Create a password before enabling two-factor authentication.');
  const verifiedPhone = user.phone || (user.type === 'phone' ? user.identifier : '');
  if (!verifiedPhone || !(user.phoneVerified ?? user.type === 'phone')) throw makeError('Add and verify a phone number before enabling two-factor authentication.');
  await sendChallenge({ type: 'phone', value: verifiedPhone }, 'two-factor-change', { userId });
  return { message: `Verification code sent to ${verifiedPhone}.`, expiresInSeconds: OTP_TTL_MS / 1000 };
}

export async function verifyTwoFactorChange(userId, { otp, enabled }) {
  if (typeof enabled !== 'boolean') throw makeError('Choose whether to enable or disable two-factor authentication.');
  const db = await getDatabase();
  const challenges = db.collection('otp_challenges');
  const user = await db.collection('users').findOne({ _id: userId });
  if (!user) throw makeError('Account not found.', 404);
  const challenge = await challenges.findOne({
    identifier: user.phone || (user.type === 'phone' ? user.identifier : ''),
    purpose: 'two-factor-change',
    userId,
  });
  if (!challenge || challenge.expiresAt < new Date()) throw makeError('This OTP has expired. Request a new code.');
  if (challenge.attempts >= MAX_ATTEMPTS) throw makeError('Too many incorrect attempts. Request a new OTP.', 429);
  if (challenge.otpHash !== hashOtp(String(otp || '').trim())) {
    await challenges.updateOne({ _id: challenge._id }, { $inc: { attempts: 1 } });
    throw makeError('Incorrect OTP.');
  }
  if (enabled && (!user.passwordHash || !user.phoneVerified)) {
    throw makeError('A password and verified phone are required for two-factor authentication.');
  }

  await db.collection('users').updateOne({ _id: userId }, { $set: { twoFactorEnabled: enabled, updatedAt: new Date() } });
  await challenges.deleteOne({ _id: challenge._id });
  return { twoFactorEnabled: enabled };
}

export async function getUserProfile(userId) {
  const db = await getDatabase();
  const [user, profile] = await Promise.all([
    db.collection('users').findOne({ _id: userId }, { projection: { name: 1, identifier: 1, type: 1, phone: 1, phoneVerified: 1, passwordHash: 1, twoFactorEnabled: 1, emailMarketingConsent: 1 } }),
    db.collection('profiles').findOne({ userId }, { projection: { _id: 0, userId: 0, 'resume.data': 0, 'avatar.data': 0 } }),
  ]);
  return {
    name: user?.name || '',
    identifier: user?.identifier || '',
    type: user?.type || '',
    phone: user?.phone || (user?.type === 'phone' ? user.identifier : ''),
    phoneVerified: user?.phoneVerified ?? user?.type === 'phone',
    passwordEnabled: Boolean(user?.passwordHash),
    twoFactorEnabled: Boolean(user?.twoFactorEnabled),
    emailMarketingConsent: user?.emailMarketingConsent === true,
    headline: '',
    jobTitle: '',
    companyName: '',
    experienceYears: '',
    specialization: '',
    location: '',
    about: '',
    languages: [],
    skills: { Expert: [], Intermediate: [], Beginner: [] },
    workExperience: [],
    education: [],
    certifications: [],
    badges: [],
    interests: [],
    applauds: 0,
    avatar: null,
    ...profile,
  };
}

export async function setEmailMarketingConsent(userId, consent) {
  if (typeof consent !== 'boolean') throw makeError('emailMarketingConsent must be true or false.');
  const db = await getDatabase();
  await db.collection('users').updateOne({ _id: userId }, { $set: { emailMarketingConsent: consent, updatedAt: new Date() } });
  return consent;
}

export async function saveUserAvatar(userId, file) {
  const signatures = {
    'image/jpeg': (data) => data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff,
    'image/png': (data) => data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    'image/webp': (data) => data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP',
  };
  if (!file || file.size > 2 * 1024 * 1024 || !signatures[file.mimetype]?.(file.buffer)) {
    const error = new Error('Profile photo must be a JPEG, PNG, or WebP image smaller than 2 MB.');
    error.statusCode = 400;
    throw error;
  }
  const db = await getDatabase();
  await db.collection('profiles').updateOne(
    { userId },
    {
      $set: {
        avatar: {
          filename: file.originalname.slice(0, 180),
          contentType: file.mimetype,
          size: file.size,
          data: file.buffer,
          updatedAt: new Date(),
        },
        userId,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );
  return { filename: file.originalname, contentType: file.mimetype, size: file.size };
}

export async function getUserAvatar(userId) {
  const db = await getDatabase();
  const profile = await db.collection('profiles').findOne(
    { userId, 'avatar.data': { $exists: true } },
    { projection: { _id: 0, 'avatar.data': 1, 'avatar.contentType': 1 } },
  );
  if (!profile?.avatar?.data) {
    const error = new Error('No profile photo has been uploaded.');
    error.statusCode = 404;
    throw error;
  }
  const data = Buffer.isBuffer(profile.avatar.data)
    ? profile.avatar.data
    : profile.avatar.data.value(true);
  return { ...profile.avatar, data };
}

export async function removeUserAvatar(userId) {
  const db = await getDatabase();
  const result = await db.collection('profiles').updateOne(
    { userId, avatar: { $exists: true } },
    { $unset: { avatar: '' }, $set: { updatedAt: new Date() } },
  );
  if (!result.modifiedCount) {
    const error = new Error('No profile photo to remove.');
    error.statusCode = 404;
    throw error;
  }
}

export async function saveUserResume(userId, file) {
  if (!file || file.size > 5 * 1024 * 1024) {
    const error = new Error('Resume must be a file smaller than 5 MB.');
    error.statusCode = 400;
    throw error;
  }
  const extension = file.originalname.split('.').pop()?.toLowerCase();
  if (!['pdf', 'doc', 'docx'].includes(extension)) {
    const error = new Error('Resume must be a PDF, DOC, or DOCX file.');
    error.statusCode = 400;
    throw error;
  }
  const db = await getDatabase();
  await db.collection('profiles').updateOne(
    { userId },
    {
      $set: {
        resume: {
          filename: file.originalname.slice(0, 180),
          contentType: file.mimetype,
          size: file.size,
          data: file.buffer,
          updatedAt: new Date(),
        },
        userId,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );
  return { filename: file.originalname, size: file.size };
}

export async function getUserResume(userId) {
  const db = await getDatabase();
  const profile = await db.collection('profiles').findOne(
    { userId, 'resume.data': { $exists: true } },
    { projection: { _id: 0, 'resume.data': 1, 'resume.contentType': 1, 'resume.filename': 1 } },
  );
  if (!profile?.resume?.data) {
    const error = new Error('No resume has been uploaded.');
    error.statusCode = 404;
    throw error;
  }
  const data = Buffer.isBuffer(profile.resume.data)
    ? profile.resume.data
    : profile.resume.data.value(true);
  return { ...profile.resume, data };
}

export async function removeUserResume(userId) {
  const db = await getDatabase();
  const result = await db.collection('profiles').updateOne(
    { userId, resume: { $exists: true } },
    { $unset: { resume: '' }, $set: { updatedAt: new Date() } },
  );
  if (!result.modifiedCount) {
    const error = new Error('No resume to remove.');
    error.statusCode = 404;
    throw error;
  }
}

const profileSections = new Set([
  'personal', 'about', 'socialLinks', 'skills', 'workExperience', 'education',
  'certifications', 'badges', 'interests',
]);

export async function updateUserProfile(userId, section, data) {
  if (!profileSections.has(section) || !data || typeof data !== 'object' || Array.isArray(data)) {
    const error = new Error('Invalid profile section.');
    error.statusCode = 400;
    throw error;
  }
  const db = await getDatabase();
  const allowedFields = {
    personal: ['name', 'headline', 'jobTitle', 'companyName', 'experienceYears', 'specialization', 'location'],
    about: ['about', 'languages'],
    socialLinks: ['socialLinks'],
    skills: ['skills'],
    workExperience: ['workExperience'],
    education: ['education'],
    certifications: ['certifications'],
    badges: ['badges'],
    interests: ['interests'],
  }[section];
  const updates = {};
  for (const field of allowedFields) {
    if (Object.hasOwn(data, field)) updates[field] = data[field];
  }
  if (!Object.keys(updates).length) {
    const error = new Error('No editable profile fields provided.');
    error.statusCode = 400;
    throw error;
  }
  for (const [field, value] of Object.entries(updates)) {
    if (typeof value === 'string' && value.length > 5000) {
      const error = new Error(`${field} is too long.`);
      error.statusCode = 400;
      throw error;
    }
    if (updates.socialLinks !== undefined) {
      if (!updates.socialLinks || typeof updates.socialLinks !== 'object' || Array.isArray(updates.socialLinks)) {
        throw makeError('Social links must be an object.');
      }
      const links = {};
      for (const key of ['website', 'linkedin', 'instagram', 'youtube']) {
        const value = String(updates.socialLinks[key] || '').trim();
        if (!value) {
          links[key] = '';
          continue;
        }
        if (value.length > 500) throw makeError(`${key} link is too long.`);
        let parsed;
        try {
          parsed = new URL(value);
        } catch {
          throw makeError(`Enter a valid URL for ${key}.`);
        }
        if (!['http:', 'https:'].includes(parsed.protocol)) throw makeError(`${key} link must use HTTP or HTTPS.`);
        links[key] = parsed.toString();
      }
      updates.socialLinks = links;
    }
    if (Array.isArray(value) && value.length > 50) {
      const error = new Error(`${field} has too many entries.`);
      error.statusCode = 400;
      throw error;
    }
  }
  if (updates.name !== undefined) {
    const name = String(updates.name).trim();
    if (!name || name.length > 100) {
      const error = new Error('Name must be between 1 and 100 characters.');
      error.statusCode = 400;
      throw error;
    }
    await db.collection('users').updateOne({ _id: userId }, { $set: { name, updatedAt: new Date() } });
    delete updates.name;
  }
  if (Object.keys(updates).length) {
    await db.collection('profiles').updateOne(
      { userId },
      { $set: { ...updates, userId, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
  }
  return getUserProfile(userId);
}
