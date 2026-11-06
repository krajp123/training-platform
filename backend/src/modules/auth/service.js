import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { MongoClient } from 'mongodb';

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

let client;
let database;

function getDatabase() {
  if (!database) {
    const uri = process.env.MONGODB_URI;
    const databaseName = process.env.MONGODB_DB || 'skillpath';
    if (!uri) throw new Error('MONGODB_URI is not configured.');
    client = new MongoClient(uri);
    database = client.connect().then(async (connection) => {
      const db = connection.db(databaseName);
      await db.collection('users').createIndex({ identifier: 1 }, { unique: true });
      await db.collection('otp_challenges').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
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
  let user = await users.findOne({ identifier: identifier.value });
  if (!user && purpose === 'signup') {
    user = { identifier: identifier.value, type: identifier.type, name: String(name || challenge.name || '').trim(), createdAt: new Date(), updatedAt: new Date() };
    const result = await users.insertOne(user);
    user._id = result.insertedId;
  }
  if (!user) {
    const error = new Error('Account not found. Please sign up first.');
    error.statusCode = 404;
    throw error;
  }

  const token = crypto.randomBytes(32).toString('hex');
  await db.collection('sessions').insertOne({ tokenHash: hashOtp(token), userId: user._id, createdAt: new Date(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
  return { token, user: { id: String(user._id), name: user.name, identifier: user.identifier, type: user.type } };
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
  return user;
}

export async function getUserProfile(userId) {
  const db = await getDatabase();
  const [user, profile] = await Promise.all([
    db.collection('users').findOne({ _id: userId }, { projection: { name: 1, identifier: 1, type: 1 } }),
    db.collection('profiles').findOne({ userId }, { projection: { _id: 0, userId: 0, 'resume.data': 0, 'avatar.data': 0 } }),
  ]);
  return {
    name: user?.name || '',
    identifier: user?.identifier || '',
    type: user?.type || '',
    headline: '',
    jobTitle: '',
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
  'personal', 'about', 'skills', 'workExperience', 'education',
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
    personal: ['name', 'headline', 'jobTitle', 'experienceYears', 'specialization', 'location'],
    about: ['about', 'languages'],
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
