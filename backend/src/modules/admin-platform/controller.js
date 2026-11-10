import nodemailer from 'nodemailer';
import { ObjectId } from 'mongodb';
import { initializeCatalog, nextCatalogId, recordAdminAction } from '../../data/persistent-store.js';
import { getAuthenticatedUser } from '../auth/service.js';

const COURSE_FIELDS = ['title', 'category', 'level', 'instructor', 'duration', 'lessons', 'price', 'oldPrice', 'image', 'color', 'status'];
const ALLOWED_COURSE_STATUSES = new Set(['draft', 'published', 'archived']);

function fail(status, message) {
  const error = new Error(message);
  error.statusCode = status;
  throw error;
}

function sendError(response, status, message) {
  return response.status(status).json({ error: message });
}

function parseDate(value, label) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) fail(400, `${label} must be a valid date.`);
  return date;
}

function parseDateRangeEnd(value) {
  const date = parseDate(value, 'to');
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) date.setUTCHours(23, 59, 59, 999);
  return date;
}

function safeId(value, label = 'ID') {
  if (!ObjectId.isValid(value)) fail(400, `${label} is invalid.`);
  return new ObjectId(value);
}

function csvCell(value) {
  const text = value instanceof Date ? value.toISOString() : String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function csvResponse(response, filename, headers, rows) {
  response.type('text/csv; charset=utf-8');
  response.set('Content-Disposition', `attachment; filename="${filename}"`);
  response.send([headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n'));
}

function makeMailer() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    fail(503, 'SMTP is not configured. Set SMTP_USER and SMTP_PASSWORD to send email.');
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
}

async function getCourse(database, courseId) {
  const id = Number(courseId);
  if (!Number.isSafeInteger(id) || id < 1) fail(400, 'A valid course ID is required.');
  const course = await database.collection('courses').findOne({ id });
  if (!course) fail(404, 'Course not found.');
  return course;
}

export async function getAnalytics(request, response, next) {
  try {
    const database = await initializeCatalog();
    const to = parseDateRangeEnd(request.query.to) || new Date();
    const from = parseDate(request.query.from, 'from') || new Date(to.getTime() - 29 * 24 * 60 * 60 * 1000);
    const courseId = request.query.courseId ? Number(request.query.courseId) : null;
    const category = String(request.query.category || '').trim();
    if (from > to) return sendError(response, 400, 'from must be earlier than to.');
    if (courseId !== null && (!Number.isSafeInteger(courseId) || courseId < 1)) return sendError(response, 400, 'courseId must be a positive integer.');
    const courseFilter = {
      ...(category ? { category: { $regex: `^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } } : {}),
      ...(courseId ? { id: courseId } : {}),
    };
    const courseIdsByCategory = category
      ? (await database.collection('courses').find(courseFilter, { projection: { id: 1 } }).toArray()).map((course) => course.id)
      : null;
    const enrollmentFilter = { createdAt: { $gte: from, $lte: to } };
    const selectedCourseIds = courseIdsByCategory
      ? (courseId ? courseIdsByCategory.filter((id) => id === courseId) : courseIdsByCategory)
      : (courseId ? [courseId] : null);
    if (selectedCourseIds) enrollmentFilter.courseId = { $in: selectedCourseIds };
    const courseArrayFilter = selectedCourseIds ? { courseIds: { $in: selectedCourseIds } } : {};
    const [learners, courses, enrollments, orders, paidOrders, popularCourses, enrollmentTrend, revenueTrend, signups] = await Promise.all([
      database.collection('users').countDocuments({ createdAt: { $gte: from, $lte: to } }),
      database.collection('courses').countDocuments(courseFilter),
      database.collection('enrollments').countDocuments(enrollmentFilter),
      database.collection('orders').countDocuments({ createdAt: enrollmentFilter.createdAt, ...courseArrayFilter }),
      database.collection('orders').aggregate([
        { $match: { status: { $in: ['paid', 'partially_refunded'] }, paidAt: enrollmentFilter.createdAt, ...courseArrayFilter } },
        { $group: { _id: null, amount: { $sum: { $subtract: ['$amount', { $ifNull: ['$refundedAmount', 0] }] } } } },
      ]).next(),
      database.collection('enrollments').aggregate([
        { $match: enrollmentFilter },
        { $group: { _id: '$courseId', enrollments: { $sum: 1 } } },
        { $sort: { enrollments: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'courses', localField: '_id', foreignField: 'id', as: 'course' } },
        { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, courseId: '$_id', title: { $ifNull: ['$course.title', 'Deleted course'] }, category: '$course.category', enrollments: 1 } },
      ]).toArray(),
      database.collection('enrollments').aggregate([
        { $match: enrollmentFilter },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, enrollments: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]).toArray(),
      database.collection('orders').aggregate([
        { $match: { status: { $in: ['paid', 'partially_refunded'] }, paidAt: enrollmentFilter.createdAt, ...courseArrayFilter } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } }, amount: { $sum: { $subtract: ['$amount', { $ifNull: ['$refundedAmount', 0] }] } } } },
        { $sort: { _id: 1 } },
      ]).toArray(),
      database.collection('users').find(
        { createdAt: { $gte: from, $lte: to } },
        { projection: { name: 1, identifier: 1, createdAt: 1 } },
      ).sort({ createdAt: -1 }).limit(10).toArray(),
    ]);

    response.json({
      learners, courses, enrollments, orders, revenue: paidOrders?.amount || 0,
      popularCourses, enrollmentTrend, revenueTrend,
      recentSignups: signups.map(({ _id, ...user }) => ({ id: String(_id), ...user })),
    });
  } catch (error) {
    next(error);
  }
}

export async function exportReport(request, response, next) {
  try {
    const database = await initializeCatalog();
    const type = String(request.query.type || '');
    const from = parseDate(request.query.from, 'from');
    const to = parseDateRangeEnd(request.query.to);
    if (from && to && from > to) return sendError(response, 400, 'from must be earlier than to.');
    const dateFilter = from || to ? { createdAt: { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) } } : {};
    const courseId = request.query.courseId ? Number(request.query.courseId) : null;
    if (courseId !== null && (!Number.isSafeInteger(courseId) || courseId < 1)) return sendError(response, 400, 'courseId must be a positive integer.');
    const category = String(request.query.category || '').trim();
    const courseFilter = {
      ...(courseId ? { id: courseId } : {}),
      ...(category ? { category: { $regex: `^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } } : {}),
    };
    const courseIds = courseId || category
      ? (await database.collection('courses').find(courseFilter, { projection: { id: 1 } }).toArray()).map((course) => course.id)
      : null;

    if (type === 'learners') {
      const users = await database.collection('users').find(dateFilter).project({ passwordHash: 0, passwordSalt: 0 }).sort({ createdAt: -1 }).toArray();
      return csvResponse(response, 'learners.csv', ['id', 'name', 'emailOrPhone', 'status', 'createdAt'],
        users.map((user) => [user._id, user.name, user.identifier, user.status || 'active', user.createdAt]));
    }
    if (type === 'enrollments') {
      const enrollments = await database.collection('enrollments').aggregate([
        { $match: { ...dateFilter, ...(courseIds ? { courseId: { $in: courseIds } } : {}) } },
        { $lookup: { from: 'courses', localField: 'courseId', foreignField: 'id', as: 'course' } },
        { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'learner' } },
        { $unwind: { path: '$learner', preserveNullAndEmptyArrays: true } },
      ]).toArray();
      return csvResponse(response, 'enrollments.csv', ['learner', 'identifier', 'course', 'progress', 'createdAt'],
        enrollments.map((item) => [item.learner?.name, item.learner?.identifier, item.course?.title, item.progress, item.createdAt]));
    }
    if (type === 'orders') {
      const orders = await database.collection('orders').find({
        ...dateFilter,
        ...(courseIds ? { courseIds: { $in: courseIds } } : {}),
      }).sort({ createdAt: -1 }).toArray();
      return csvResponse(response, 'orders.csv', ['orderId', 'learner', 'amount', 'currency', 'status', 'createdAt', 'paidAt'],
        orders.map((item) => [item.razorpayOrderId || item._id, item.userEmail, item.amount, item.currency, item.status, item.createdAt, item.paidAt]));
    }
    if (type === 'courses') {
      const courses = await database.collection('courses').find(courseFilter).sort({ id: 1 }).toArray();
      return csvResponse(response, 'courses.csv', COURSE_FIELDS, courses.map((course) => COURSE_FIELDS.map((field) => course[field])));
    }
    return sendError(response, 400, 'type must be courses, learners, enrollments, or orders.');
  } catch (error) {
    next(error);
  }
}

export async function listCourseSections(request, response, next) {
  try {
    const database = await initializeCatalog();
    const course = await getCourse(database, request.params.courseId);
    response.json({ sections: course.sections || [] });
  } catch (error) {
    next(error);
  }
}

export async function createCourseSection(request, response, next) {
  try {
    const title = String(request.body?.title || '').trim();
    if (!title || title.length > 160) return sendError(response, 400, 'Section title is required and must be at most 160 characters.');
    const database = await initializeCatalog();
    const course = await getCourse(database, request.params.courseId);
    const section = { id: new ObjectId().toString(), title, lessons: [], createdAt: new Date() };
    await database.collection('courses').updateOne({ id: course.id }, { $push: { sections: section }, $set: { updatedAt: new Date() } });
    await recordAdminAction(request, 'course.section_created', 'course', course.id, { sectionId: section.id });
    response.status(201).json(section);
  } catch (error) {
    next(error);
  }
}

export async function updateCourseSection(request, response, next) {
  try {
    const title = String(request.body?.title || '').trim();
    if (!title || title.length > 160) return sendError(response, 400, 'Section title is required and must be at most 160 characters.');
    const database = await initializeCatalog();
    const course = await getCourse(database, request.params.courseId);
    const section = (course.sections || []).find((item) => item.id === request.params.sectionId);
    if (!section) return sendError(response, 404, 'Course section not found.');
    await database.collection('courses').updateOne(
      { id: course.id, 'sections.id': section.id },
      { $set: { 'sections.$.title': title, updatedAt: new Date() } },
    );
    await recordAdminAction(request, 'course.section_updated', 'course', course.id, { sectionId: section.id });
    response.json({ ...section, title });
  } catch (error) {
    next(error);
  }
}

export async function deleteCourseSection(request, response, next) {
  try {
    const database = await initializeCatalog();
    const course = await getCourse(database, request.params.courseId);
    const result = await database.collection('courses').updateOne(
      { id: course.id },
      { $pull: { sections: { id: request.params.sectionId } }, $set: { updatedAt: new Date() } },
    );
    if (!result.modifiedCount) return sendError(response, 404, 'Course section not found.');
    await recordAdminAction(request, 'course.section_deleted', 'course', course.id, { sectionId: request.params.sectionId });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function createLesson(request, response, next) {
  try {
    const title = String(request.body?.title || '').trim();
    const videoUrl = String(request.body?.videoUrl || '').trim();
    if (!title || title.length > 160) return sendError(response, 400, 'Lesson title is required and must be at most 160 characters.');
    if (videoUrl && !isWebUrl(videoUrl)) return sendError(response, 400, 'videoUrl must be an HTTP or HTTPS URL.');
    const database = await initializeCatalog();
    const course = await getCourse(database, request.params.courseId);
    const section = (course.sections || []).find((item) => item.id === request.params.sectionId);
    if (!section) return sendError(response, 404, 'Course section not found.');
    const lesson = {
      id: new ObjectId().toString(),
      title,
      description: String(request.body?.description || '').slice(0, 4000),
      videoUrl,
      preview: request.body?.preview === true,
      durationMinutes: Math.max(0, Number(request.body?.durationMinutes) || 0),
      attachments: Array.isArray(request.body?.attachments)
        ? request.body.attachments.filter((item) => item && isWebUrl(item.url)).slice(0, 10)
        : [],
      createdAt: new Date(),
    };
    await database.collection('courses').updateOne(
      { id: course.id, 'sections.id': section.id },
      { $push: { 'sections.$.lessons': lesson }, $set: { updatedAt: new Date() } },
    );
    await recordAdminAction(request, 'course.lesson_created', 'course', course.id, { sectionId: section.id, lessonId: lesson.id });
    response.status(201).json(lesson);
  } catch (error) {
    next(error);
  }
}

export async function updateLesson(request, response, next) {
  try {
    const database = await initializeCatalog();
    const course = await getCourse(database, request.params.courseId);
    const sectionIndex = (course.sections || []).findIndex((item) => item.id === request.params.sectionId);
    if (sectionIndex < 0) return sendError(response, 404, 'Course section not found.');
    const section = course.sections[sectionIndex];
    const lessonIndex = (section.lessons || []).findIndex((item) => item.id === request.params.lessonId);
    if (lessonIndex < 0) return sendError(response, 404, 'Lesson not found.');
    const old = section.lessons[lessonIndex];
    const title = request.body?.title === undefined ? old.title : String(request.body.title).trim();
    const videoUrl = request.body?.videoUrl === undefined ? old.videoUrl : String(request.body.videoUrl).trim();
    if (!title || title.length > 160) return sendError(response, 400, 'Lesson title is required and must be at most 160 characters.');
    if (videoUrl && !isWebUrl(videoUrl)) return sendError(response, 400, 'videoUrl must be an HTTP or HTTPS URL.');
    const lesson = {
      ...old,
      title,
      videoUrl,
      ...(request.body?.description !== undefined ? { description: String(request.body.description).slice(0, 4000) } : {}),
      ...(request.body?.preview !== undefined ? { preview: request.body.preview === true } : {}),
      ...(request.body?.durationMinutes !== undefined ? { durationMinutes: Math.max(0, Number(request.body.durationMinutes) || 0) } : {}),
      updatedAt: new Date(),
    };
    section.lessons[lessonIndex] = lesson;
    await database.collection('courses').updateOne({ id: course.id }, { $set: { sections: course.sections, updatedAt: new Date() } });
    await recordAdminAction(request, 'course.lesson_updated', 'course', course.id, { lessonId: lesson.id });
    response.json(lesson);
  } catch (error) {
    next(error);
  }
}

export async function deleteLesson(request, response, next) {
  try {
    const database = await initializeCatalog();
    const course = await getCourse(database, request.params.courseId);
    const section = (course.sections || []).find((item) => item.id === request.params.sectionId);
    if (!section) return sendError(response, 404, 'Course section not found.');
    const lessons = section.lessons || [];
    if (!lessons.some((item) => item.id === request.params.lessonId)) return sendError(response, 404, 'Lesson not found.');
    await database.collection('courses').updateOne(
      { id: course.id, 'sections.id': section.id },
      { $pull: { 'sections.$.lessons': { id: request.params.lessonId } }, $set: { updatedAt: new Date() } },
    );
    await recordAdminAction(request, 'course.lesson_deleted', 'course', course.id, { lessonId: request.params.lessonId });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
}

function isWebUrl(value) {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export async function listCoupons(_request, response, next) {
  try {
    const database = await initializeCatalog();
    const coupons = await database.collection('coupons').find().sort({ createdAt: -1 }).toArray();
    response.json({ coupons: coupons.map(({ _id, ...coupon }) => ({ id: String(_id), ...coupon })) });
  } catch (error) {
    next(error);
  }
}

export async function createCoupon(request, response, next) {
  try {
    const code = String(request.body?.code || '').trim().toUpperCase();
    const discountType = request.body?.discountType;
    const value = Number(request.body?.value);
    const maxUses = Number(request.body?.maxUses ?? 0);
    const courseIds = Array.isArray(request.body?.courseIds) ? [...new Set(request.body.courseIds.map(Number))] : [];
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return sendError(response, 400, 'Coupon code must be 3-32 letters, numbers, hyphens, or underscores.');
    if (!['percent', 'fixed'].includes(discountType) || !Number.isFinite(value) || value <= 0) return sendError(response, 400, 'Enter a valid discount type and value.');
    if (discountType === 'percent' && value > 100) return sendError(response, 400, 'Percentage discounts cannot exceed 100.');
    if (!Number.isSafeInteger(maxUses) || maxUses < 0) return sendError(response, 400, 'Maximum uses must be a non-negative integer.');
    if (courseIds.length > 100 || courseIds.some((id) => !Number.isSafeInteger(id) || id < 1)) return sendError(response, 400, 'Course restrictions must contain valid course IDs.');
    const database = await initializeCatalog();
    const existing = await database.collection('coupons').findOne({ code });
    if (existing) return sendError(response, 409, 'A coupon with this code already exists.');
    const coupon = {
      code, discountType, value,
      maxUses,
      usedCount: 0,
      startsAt: parseDate(request.body?.startsAt, 'startsAt'),
      endsAt: parseDate(request.body?.endsAt, 'endsAt'),
      courseIds,
      status: request.body?.status === 'inactive' ? 'inactive' : 'active',
      createdAt: new Date(),
      createdBy: request.admin.email,
    };
    if (coupon.startsAt && coupon.endsAt && coupon.startsAt >= coupon.endsAt) return sendError(response, 400, 'endsAt must be later than startsAt.');
    if (courseIds.length) {
      const count = await database.collection('courses').countDocuments({ id: { $in: courseIds } });
      if (count !== courseIds.length) return sendError(response, 400, 'One or more restricted courses do not exist.');
    }
    const result = await database.collection('coupons').insertOne(coupon);
    await recordAdminAction(request, 'coupon.created', 'coupon', result.insertedId, { code });
    response.status(201).json({ id: String(result.insertedId), ...coupon });
  } catch (error) {
    next(error);
  }
}

export async function updateCoupon(request, response, next) {
  try {
    const database = await initializeCatalog();
    const _id = safeId(request.params.id, 'Coupon ID');
    const current = await database.collection('coupons').findOne({ _id });
    if (!current) return sendError(response, 404, 'Coupon not found.');
    const status = request.body?.status;
    if (!['active', 'inactive'].includes(status)) return sendError(response, 400, 'status must be active or inactive.');
    await database.collection('coupons').updateOne({ _id }, { $set: { status, updatedAt: new Date() } });
    await recordAdminAction(request, 'coupon.updated', 'coupon', _id, { code: current.code, status });
    response.json({ id: String(_id), ...current, status, updatedAt: new Date() });
  } catch (error) {
    next(error);
  }
}

export async function createPromotion(request, response, next) {
  try {
    const title = String(request.body?.title || '').trim();
    const courseId = Number(request.body?.courseId);
    const startsAt = parseDate(request.body?.startsAt, 'startsAt');
    const endsAt = parseDate(request.body?.endsAt, 'endsAt');
    if (!title || title.length > 120 || !Number.isSafeInteger(courseId) || !startsAt || !endsAt || startsAt >= endsAt) {
      return sendError(response, 400, 'Provide a title, course, and valid promotion start/end dates.');
    }
    const database = await initializeCatalog();
    const course = await getCourse(database, courseId);
    if (course.status !== 'published') return sendError(response, 400, 'Promotions can only be scheduled for published courses.');
    const promotion = { title, courseId, courseTitle: course.title, startsAt, endsAt, bannerText: String(request.body?.bannerText || '').slice(0, 240), createdAt: new Date() };
    const result = await database.collection('promotions').insertOne(promotion);
    await recordAdminAction(request, 'promotion.created', 'promotion', result.insertedId, { title });
    response.status(201).json({ id: String(result.insertedId), ...promotion });
  } catch (error) {
    next(error);
  }
}

export async function listPromotions(_request, response, next) {
  try {
    const database = await initializeCatalog();
    const promotions = await database.collection('promotions').find().sort({ startsAt: 1 }).toArray();
    response.json({ promotions: promotions.map(({ _id, ...promotion }) => ({ id: String(_id), ...promotion })) });
  } catch (error) {
    next(error);
  }
}

export async function deletePromotion(request, response, next) {
  try {
    const database = await initializeCatalog();
    const _id = safeId(request.params.id, 'Promotion ID');
    const result = await database.collection('promotions').deleteOne({ _id });
    if (!result.deletedCount) return sendError(response, 404, 'Promotion not found.');
    await recordAdminAction(request, 'promotion.deleted', 'promotion', _id);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function listSettings(_request, response, next) {
  try {
    const database = await initializeCatalog();
    const settings = await database.collection('platform_settings').findOne({ _id: 'main' });
    const courses = await database.collection('courses').distinct('category');
    response.json({
      settings: settings?.values || { platformName: 'SCS Academy', supportEmail: '', timezone: 'Asia/Kolkata', notifications: { email: false, announcements: true } },
      categories: settings?.values?.categories || courses.filter(Boolean).sort(),
      integrations: {
        razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
        smtp: Boolean(process.env.SMTP_USER && process.env.SMTP_PASSWORD),
        twilio: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function saveSettings(request, response, next) {
  try {
    const values = request.body?.settings;
    if (!values || typeof values !== 'object' || Array.isArray(values)) return sendError(response, 400, 'settings must be an object.');
    const allowed = ['platformName', 'supportEmail', 'timezone', 'notifications', 'categories'];
    const settings = Object.fromEntries(allowed.filter((key) => values[key] !== undefined).map((key) => [key, values[key]]));
    if (settings.platformName !== undefined && (typeof settings.platformName !== 'string' || settings.platformName.trim().length > 120)) return sendError(response, 400, 'platformName must be at most 120 characters.');
    if (settings.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.supportEmail)) return sendError(response, 400, 'supportEmail must be a valid email address.');
    if (settings.notifications && typeof settings.notifications !== 'object') return sendError(response, 400, 'notifications must be an object.');
    if (settings.categories !== undefined && (!Array.isArray(settings.categories)
      || settings.categories.length > 100
      || settings.categories.some((category) => typeof category !== 'string' || !category.trim() || category.length > 80))) {
      return sendError(response, 400, 'categories must be an array of up to 100 non-empty names.');
    }
    const database = await initializeCatalog();
    await database.collection('platform_settings').updateOne(
      { _id: 'main' },
      { $set: { values: settings, updatedAt: new Date(), updatedBy: request.admin.email } },
      { upsert: true },
    );
    await recordAdminAction(request, 'settings.updated', 'settings', 'main', { keys: Object.keys(settings) });
    response.json({ settings });
  } catch (error) {
    next(error);
  }
}

export async function listPublicContent(_request, response, next) {
  try {
    const database = await initializeCatalog();
    const now = new Date();
    const [banners, announcements, faqs, promotions] = await Promise.all([
      database.collection('banners').find({ status: 'published', $or: [{ publishAt: { $exists: false } }, { publishAt: { $lte: now } }] }).sort({ createdAt: -1 }).limit(10).toArray(),
      database.collection('announcements').find({ status: 'published', $or: [{ publishAt: { $exists: false } }, { publishAt: { $lte: now } }] }).sort({ createdAt: -1 }).limit(20).toArray(),
      database.collection('help_content').find({ type: 'faq', status: 'published', $or: [{ publishAt: { $exists: false } }, { publishAt: { $lte: now } }] }).sort({ createdAt: 1 }).limit(100).toArray(),
      database.collection('promotions').aggregate([
        { $match: { startsAt: { $lte: now }, endsAt: { $gte: now } } },
        { $lookup: { from: 'courses', localField: 'courseId', foreignField: 'id', as: 'course' } },
        { $unwind: '$course' },
        { $match: { 'course.status': 'published' } },
        { $set: { courseTitle: '$course.title' } },
        { $project: { course: 0 } },
        { $sort: { startsAt: 1 } },
        { $limit: 20 },
      ]).toArray(),
    ]);
    response.json({
      banners: banners.map(({ _id, ...item }) => ({ id: String(_id), ...item })),
      announcements: announcements.map(({ _id, ...item }) => ({ id: String(_id), ...item })),
      faqs: faqs.map(({ _id, ...item }) => ({ id: String(_id), ...item })),
      promotions: promotions.map(({ _id, ...item }) => ({ id: String(_id), ...item })),
    });
  } catch (error) {
    next(error);
  }
}

export async function listCourseContent(request, response, next) {
  try {
    const courseId = Number(request.params.courseId);
    if (!Number.isSafeInteger(courseId) || courseId < 1) return sendError(response, 400, 'A valid course ID is required.');
    const database = await initializeCatalog();
    const course = await database.collection('courses').findOne({ id: courseId, status: 'published' });
    if (!course) return sendError(response, 404, 'Course not found.');
    const token = request.get('authorization')?.replace(/^Bearer\s+/i, '');
    let enrolled = false;
    if (token) {
      try {
        const user = await getAuthenticatedUser(token);
        enrolled = Boolean(await database.collection('enrollments').findOne({ userId: user._id, courseId }));
      } catch (error) {
        if (error.statusCode !== 401) throw error;
      }
    }
    const sections = (course.sections || []).map((section) => ({
      ...section,
      lessons: enrolled ? section.lessons : (section.lessons || []).filter((lesson) => lesson.preview).map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        durationMinutes: lesson.durationMinutes,
        videoUrl: lesson.videoUrl,
        attachments: lesson.attachments,
        preview: true,
      })),
    })).filter((section) => enrolled || section.lessons.length);
    response.json({ courseId, enrolled, sections });
  } catch (error) {
    next(error);
  }
}

export async function listContent(request, response, next) {
  try {
    const database = await initializeCatalog();
    const collectionName = String(request.params.type || '');
    const collections = { banners: 'banners', announcements: 'announcements', help: 'help_content', templates: 'email_templates' };
    if (!collections[collectionName]) return sendError(response, 400, 'Unknown content type.');
    const collection = database.collection(collections[collectionName]);
    const filter = collectionName === 'help' ? {} : {};
    const content = await collection.find(filter).sort({ createdAt: -1 }).limit(250).toArray();
    response.json({ items: content.map(({ _id, ...item }) => ({ id: String(_id), ...item })) });
  } catch (error) {
    next(error);
  }
}

export async function createContent(request, response, next) {
  try {
    const collectionName = String(request.params.type || '');
    const collections = { banners: 'banners', announcements: 'announcements', help: 'help_content', templates: 'email_templates' };
    if (!collections[collectionName]) return sendError(response, 400, 'Unknown content type.');
    const title = String(request.body?.title || '').trim();
    const body = String(request.body?.body || '').trim();
    if (!title || title.length > 180 || !body || body.length > 20000) return sendError(response, 400, 'Title and content are required and within the supported size.');
    const status = ['draft', 'published', 'archived'].includes(request.body?.status) ? request.body.status : 'draft';
    const item = {
      title,
      body,
      type: collectionName === 'help' ? String(request.body?.kind || 'faq') : collectionName,
      status,
      link: String(request.body?.link || '').trim(),
      publishAt: parseDate(request.body?.publishAt, 'publishAt'),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: request.admin.email,
    };
    if (item.link && !isWebUrl(item.link)) return sendError(response, 400, 'link must be an HTTP or HTTPS URL.');
    const database = await initializeCatalog();
    const result = await database.collection(collections[collectionName]).insertOne(item);
    await recordAdminAction(request, 'content.created', collectionName, result.insertedId, { title });
    response.status(201).json({ id: String(result.insertedId), ...item });
  } catch (error) {
    next(error);
  }
}

export async function updateContent(request, response, next) {
  try {
    const collectionName = String(request.params.type || '');
    const collections = { banners: 'banners', announcements: 'announcements', help: 'help_content', templates: 'email_templates' };
    if (!collections[collectionName]) return sendError(response, 400, 'Unknown content type.');
    const _id = safeId(request.params.id, 'Content ID');
    const changes = {};
    if (request.body?.status !== undefined) {
      if (!['draft', 'published', 'archived'].includes(request.body.status)) return sendError(response, 400, 'Invalid content status.');
      changes.status = request.body.status;
    }
    if (request.body?.title !== undefined) changes.title = String(request.body.title).trim().slice(0, 180);
    if (request.body?.body !== undefined) changes.body = String(request.body.body).slice(0, 20000);
    if (request.body?.publishAt !== undefined) changes.publishAt = parseDate(request.body.publishAt, 'publishAt');
    changes.updatedAt = new Date();
    const database = await initializeCatalog();
    const result = await database.collection(collections[collectionName]).findOneAndUpdate({ _id }, { $set: changes }, { returnDocument: 'after' });
    if (!result) return sendError(response, 404, 'Content item not found.');
    const { _id: savedId, ...item } = result;
    await recordAdminAction(request, 'content.updated', collectionName, savedId, { title: item.title });
    response.json({ id: String(savedId), ...item });
  } catch (error) {
    next(error);
  }
}

export async function deleteContent(request, response, next) {
  try {
    const collectionName = String(request.params.type || '');
    const collections = { banners: 'banners', announcements: 'announcements', help: 'help_content', templates: 'email_templates' };
    if (!collections[collectionName]) return sendError(response, 400, 'Unknown content type.');
    const _id = safeId(request.params.id, 'Content ID');
    const database = await initializeCatalog();
    const result = await database.collection(collections[collectionName]).deleteOne({ _id });
    if (!result.deletedCount) return sendError(response, 404, 'Content item not found.');
    await recordAdminAction(request, 'content.deleted', collectionName, _id);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function sendCampaign(request, response, next) {
  try {
    const subject = String(request.body?.subject || '').trim();
    const body = String(request.body?.body || '').trim();
    if (!subject || subject.length > 200 || !body || body.length > 20000) return sendError(response, 400, 'Campaign subject and message are required.');
    const database = await initializeCatalog();
    const users = await database.collection('users').find(
      { type: 'email', status: { $ne: 'suspended' }, emailMarketingConsent: true, emailOptOut: { $ne: true } },
      { projection: { identifier: 1 } },
    ).toArray();
    if (!users.length) return response.json({ sent: 0, failed: 0 });
    const mailer = makeMailer();
    let sent = 0;
    let failed = 0;
    for (let offset = 0; offset < users.length; offset += 25) {
      const results = await Promise.allSettled(users.slice(offset, offset + 25).map((user) => mailer.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.identifier,
        subject,
        text: body,
      })));
      sent += results.filter((result) => result.status === 'fulfilled').length;
      failed += results.filter((result) => result.status === 'rejected').length;
    }
    const campaign = { subject, body, sent, failed, createdAt: new Date(), createdBy: request.admin.email };
    await database.collection('email_campaigns').insertOne(campaign);
    await recordAdminAction(request, 'campaign.sent', 'email_campaign', subject, { sent, failed });
    response.json({ sent, failed });
  } catch (error) {
    next(error);
  }
}

export async function importCourses(request, response, next) {
  try {
    const input = request.body?.courses;
    if (!Array.isArray(input) || !input.length || input.length > 500) return sendError(response, 400, 'courses must be an array containing 1 to 500 courses.');
    const validated = [];
    for (const [index, raw] of input.entries()) {
      const course = Object.fromEntries(COURSE_FIELDS.filter((field) => raw?.[field] !== undefined).map((field) => [field, raw[field]]));
      for (const field of ['title', 'category', 'instructor', 'level', 'duration']) {
        if (typeof course[field] !== 'string' || !course[field].trim() || course[field].length > 180) {
          return sendError(response, 400, `Course ${index + 1} needs a non-empty ${field} (up to 180 characters).`);
        }
      }
      if (!ALLOWED_COURSE_STATUSES.has(course.status || 'draft')) return sendError(response, 400, `Course ${index + 1} status must be draft, published, or archived.`);
      for (const field of ['price', 'oldPrice', 'lessons']) {
        if (course[field] !== undefined && (!Number.isFinite(Number(course[field])) || Number(course[field]) < 0)) {
          return sendError(response, 400, `Course ${index + 1} ${field} must be a non-negative number.`);
        }
      }
      if (course.image && !isWebUrl(String(course.image))) return sendError(response, 400, `Course ${index + 1} image must be an HTTP or HTTPS URL.`);
      validated.push({
        ...course,
        title: course.title.trim(),
        category: course.category.trim(),
        instructor: course.instructor.trim(),
        level: course.level.trim(),
        duration: course.duration.trim(),
        lessons: Number(course.lessons) || 0,
        price: Number(course.price) || 0,
        oldPrice: Number(course.oldPrice) || 0,
        status: course.status || 'draft',
        rating: 'New',
        students: '0',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    const database = await initializeCatalog();
    const imported = await Promise.all(validated.map(async (course) => ({ id: await nextCatalogId('courses'), ...course })));
    await database.collection('courses').insertMany(imported, { ordered: true });
    await recordAdminAction(request, 'courses.imported', 'course', 'bulk', { count: imported.length });
    response.status(201).json({ imported: imported.length });
  } catch (error) {
    next(error);
  }
}

export async function listSupportTickets(request, response, next) {
  try {
    const database = await initializeCatalog();
    const status = String(request.query.status || '');
    const filter = status ? { status } : {};
    const tickets = await database.collection('support_tickets').find(filter).sort({ updatedAt: -1 }).limit(200).toArray();
    response.json({ tickets: tickets.map(({ _id, ...ticket }) => ({ id: String(_id), ...ticket })) });
  } catch (error) {
    next(error);
  }
}

export async function createSupportTicket(request, response, next) {
  try {
    const subject = String(request.body?.subject || '').trim();
    const body = String(request.body?.body || '').trim();
    if (!subject || subject.length > 180 || !body || body.length > 10000) return sendError(response, 400, 'A subject and message are required.');
    const database = await initializeCatalog();
    const ticket = {
      userId: request.user._id,
      userName: request.user.name,
      userEmail: request.user.identifier,
      subject,
      body,
      status: 'open',
      priority: 'normal',
      notes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await database.collection('support_tickets').insertOne(ticket);
    response.status(201).json({ id: String(result.insertedId), subject, status: ticket.status, createdAt: ticket.createdAt });
  } catch (error) {
    next(error);
  }
}

export async function updateSupportTicket(request, response, next) {
  try {
    const _id = safeId(request.params.id, 'Ticket ID');
    const status = request.body?.status;
    const priority = request.body?.priority;
    if (status !== undefined && !['open', 'in_progress', 'resolved', 'closed'].includes(status)) return sendError(response, 400, 'Invalid ticket status.');
    if (priority !== undefined && !['low', 'normal', 'high', 'urgent'].includes(priority)) return sendError(response, 400, 'Invalid ticket priority.');
    const database = await initializeCatalog();
    const collection = database.collection('support_tickets');
    const ticket = await collection.findOne({ _id });
    if (!ticket) return sendError(response, 404, 'Support ticket not found.');
    const updates = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    const note = String(request.body?.note || '').trim();
    if (note) updates.$push = { notes: { author: request.admin.email, body: note.slice(0, 4000), createdAt: new Date() } };
    if (updates.$push) {
      const { $push, ...fields } = updates;
      await collection.updateOne({ _id }, { $set: fields, $push });
    } else {
      await collection.updateOne({ _id }, { $set: updates });
    }
    await recordAdminAction(request, 'support_ticket.updated', 'support_ticket', _id, { status, priority });
    response.json({ id: String(_id), status: status || ticket.status, priority: priority || ticket.priority });
  } catch (error) {
    next(error);
  }
}

export async function createReview(request, response, next) {
  try {
    const courseId = Number(request.body?.courseId);
    const rating = Number(request.body?.rating);
    const body = String(request.body?.body || '').trim();
    if (!Number.isSafeInteger(courseId) || courseId < 1 || !Number.isInteger(rating) || rating < 1 || rating > 5 || !body || body.length > 5000) {
      return sendError(response, 400, 'Provide a course, a rating from 1 to 5, and a review under 5000 characters.');
    }
    const database = await initializeCatalog();
    const enrollment = await database.collection('enrollments').findOne({ courseId, userId: request.user._id });
    if (!enrollment) return sendError(response, 403, 'Enroll in this course before submitting a review.');
    const review = {
      courseId,
      userId: request.user._id,
      userName: request.user.name,
      rating,
      body,
      status: 'pending',
      createdAt: new Date(),
    };
    const result = await database.collection('course_reviews').updateOne(
      { courseId, userId: request.user._id },
      { $set: { ...review, updatedAt: new Date() } },
      { upsert: true },
    );
    response.status(201).json({ id: String(result.upsertedId || ''), status: review.status });
  } catch (error) {
    next(error);
  }
}

export async function listReviews(_request, response, next) {
  try {
    const database = await initializeCatalog();
    const reviews = await database.collection('course_reviews').find().sort({ createdAt: -1 }).limit(250).toArray();
    response.json({ reviews: reviews.map(({ _id, ...review }) => ({ id: String(_id), ...review })) });
  } catch (error) {
    next(error);
  }
}

export async function moderateReview(request, response, next) {
  try {
    const _id = safeId(request.params.id, 'Review ID');
    const status = request.body?.status;
    if (!['approved', 'rejected'].includes(status)) return sendError(response, 400, 'status must be approved or rejected.');
    const database = await initializeCatalog();
    const result = await database.collection('course_reviews').findOneAndUpdate(
      { _id },
      { $set: { status, moderatedBy: request.admin.email, moderatedAt: new Date() } },
      { returnDocument: 'after' },
    );
    if (!result) return sendError(response, 404, 'Review not found.');
    await recordAdminAction(request, `review.${status}`, 'course_review', _id);
    response.json({ id: String(_id), status });
  } catch (error) {
    next(error);
  }
}

export async function listLearnerProfile(request, response, next) {
  try {
    const learnerId = safeId(request.params.learnerId, 'Learner ID');
    const database = await initializeCatalog();
    const [user, profile, enrollments] = await Promise.all([
      database.collection('users').findOne({ _id: learnerId }, { projection: { passwordHash: 0, passwordSalt: 0 } }),
      database.collection('profiles').findOne({ userId: learnerId }, { projection: { _id: 0, userId: 0, 'resume.data': 0, 'avatar.data': 0 } }),
      database.collection('enrollments').aggregate([
        { $match: { userId: learnerId } },
        { $lookup: { from: 'courses', localField: 'courseId', foreignField: 'id', as: 'course' } },
        { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, courseId: 1, progress: 1, createdAt: 1, courseTitle: { $ifNull: ['$course.title', 'Deleted course'] } } },
      ]).toArray(),
    ]);
    if (!user) return sendError(response, 404, 'Learner not found.');
    response.json({
      learner: { id: String(user._id), name: user.name, identifier: user.identifier, phone: user.phone, status: user.status || 'active', createdAt: user.createdAt, profile },
      enrollments,
    });
  } catch (error) {
    next(error);
  }
}

export async function createManualEnrollment(request, response, next) {
  try {
    const learnerId = safeId(request.body?.learnerId, 'Learner ID');
    const courseId = Number(request.body?.courseId);
    if (!Number.isSafeInteger(courseId) || courseId < 1) return sendError(response, 400, 'A valid course ID is required.');
    const database = await initializeCatalog();
    const [learner, course] = await Promise.all([
      database.collection('users').findOne({ _id: learnerId, status: { $ne: 'suspended' } }),
      database.collection('courses').findOne({ id: courseId, status: 'published' }),
    ]);
    if (!learner) return sendError(response, 404, 'Active learner not found.');
    if (!course) return sendError(response, 404, 'Published course not found.');
    const result = await database.collection('enrollments').updateOne(
      { userId: learnerId, courseId },
      { $setOnInsert: { userId: learnerId, courseId, progress: 0, createdAt: new Date(), grantedBy: request.admin.email } },
      { upsert: true },
    );
    await recordAdminAction(request, 'enrollment.granted', 'enrollment', `${learnerId}:${courseId}`, { learner: learner.identifier, course: course.title });
    response.status(result.upsertedCount ? 201 : 200).json({ enrolled: true, learnerId: String(learnerId), courseId });
  } catch (error) {
    next(error);
  }
}

export async function revokeEnrollment(request, response, next) {
  try {
    const enrollmentId = safeId(request.params.id, 'Enrollment ID');
    const database = await initializeCatalog();
    const enrollment = await database.collection('enrollments').findOne({ _id: enrollmentId });
    if (!enrollment) return sendError(response, 404, 'Enrollment not found.');
    await database.collection('enrollments').deleteOne({ _id: enrollmentId });
    await recordAdminAction(request, 'enrollment.revoked', 'enrollment', enrollmentId, { courseId: enrollment.courseId, learnerId: String(enrollment.userId) });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function transferEnrollment(request, response, next) {
  try {
    const enrollmentId = safeId(request.params.id, 'Enrollment ID');
    const courseId = Number(request.body?.courseId);
    if (!Number.isSafeInteger(courseId) || courseId < 1) return sendError(response, 400, 'A valid target course ID is required.');
    const database = await initializeCatalog();
    const collection = database.collection('enrollments');
    const enrollment = await collection.findOne({ _id: enrollmentId });
    const course = await database.collection('courses').findOne({ id: courseId, status: 'published' });
    if (!enrollment || !course) return sendError(response, 404, 'Enrollment or published target course not found.');
    await collection.deleteOne({ userId: enrollment.userId, courseId });
    const result = await collection.updateOne(
      { _id: enrollmentId },
      { $set: { courseId, progress: 0, updatedAt: new Date(), transferredBy: request.admin.email } },
    );
    if (!result.matchedCount) return sendError(response, 404, 'Enrollment not found.');
    await recordAdminAction(request, 'enrollment.transferred', 'enrollment', enrollmentId, { targetCourseId: courseId });
    response.json({ id: String(enrollmentId), courseId, progress: 0 });
  } catch (error) {
    next(error);
  }
}

export async function validateCoupon(request, response, next) {
  try {
    const code = String(request.body?.code || '').trim().toUpperCase();
    const courseIds = Array.isArray(request.body?.courseIds)
      ? [...new Set(request.body.courseIds.map(Number))]
      : [Number(request.body?.courseId)];
    if (!courseIds.length || courseIds.length > 20 || courseIds.some((id) => !Number.isSafeInteger(id) || id < 1)) {
      return sendError(response, 400, 'Select between 1 and 20 valid courses.');
    }
    const database = await initializeCatalog();
    const coupon = await database.collection('coupons').findOne({ code, status: 'active' });
    if (!coupon) return sendError(response, 404, 'Coupon code is not valid.');
    const now = new Date();
    if ((coupon.startsAt && coupon.startsAt > now) || (coupon.endsAt && coupon.endsAt < now)
      || (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses)) {
      return sendError(response, 400, 'This coupon is not currently available for the selected course.');
    }
    const courses = await database.collection('courses').find({ id: { $in: courseIds }, status: 'published' }).toArray();
    if (courses.length !== courseIds.length) return sendError(response, 400, 'One or more selected courses are no longer available.');
    const applicableCourses = coupon.courseIds?.length
      ? courses.filter((course) => coupon.courseIds.includes(course.id))
      : courses;
    if (!applicableCourses.length) return sendError(response, 400, 'This coupon is not available for the selected courses.');
    const applicableSubtotal = applicableCourses.reduce((sum, course) => sum + Number(course.price), 0);
    const discount = coupon.discountType === 'percent'
      ? Math.round(applicableSubtotal * coupon.value / 100)
      : Math.min(applicableSubtotal, coupon.value);
    const subtotal = courses.reduce((sum, course) => sum + Number(course.price), 0);
    response.json({ code, discount, subtotal, amount: Math.max(0, subtotal - discount) });
  } catch (error) {
    next(error);
  }
}

export async function listReviewsPublic(request, response, next) {
  try {
    const courseId = Number(request.params.courseId);
    if (!Number.isSafeInteger(courseId) || courseId < 1) return sendError(response, 400, 'A valid course ID is required.');
    const database = await initializeCatalog();
    const reviews = await database.collection('course_reviews').find({ courseId, status: 'approved' }, { projection: { userId: 0 } }).sort({ createdAt: -1 }).limit(50).toArray();
    response.json({ reviews: reviews.map(({ _id, ...review }) => ({ id: String(_id), ...review })) });
  } catch (error) {
    next(error);
  }
}
