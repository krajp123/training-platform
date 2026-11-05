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
  if (existing && existing.createdAt.getTime() + RESEND_COOLDOWN_MS > Date.now()) {
    const error = new Error('Please wait before requesting another OTP.');
    error.statusCode = 429;
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
  await sendOtp(identifier, otp);
  return { message: `Verification code sent to your ${identifier.type}.`, expiresInSeconds: OTP_TTL_MS / 1000 };
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
