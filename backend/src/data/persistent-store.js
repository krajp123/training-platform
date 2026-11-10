import { getDatabase } from '../modules/auth/service.js';
import { courses as courseSeed } from './seed.js';

let initialization;

export async function initializeCatalog() {
  if (!initialization) {
    initialization = (async () => {
      const database = await getDatabase();
      const courses = database.collection('courses');
      const enrollments = database.collection('enrollments');
      await Promise.all([
        courses.createIndex({ id: 1 }, { unique: true }),
        enrollments.createIndex({ courseId: 1, userId: 1 }, { unique: true }),
        database.collection('orders').createIndex({ razorpayOrderId: 1 }, { unique: true, sparse: true }),
        database.collection('coupons').createIndex({ code: 1 }, { unique: true }),
        database.collection('admin_users').createIndex({ email: 1 }, { unique: true }),
        database.collection('support_tickets').createIndex({ status: 1, updatedAt: -1 }),
        database.collection('course_reviews').createIndex({ courseId: 1, status: 1, createdAt: -1 }),
        database.collection('course_reviews').createIndex({ courseId: 1, userId: 1 }, { unique: true }),
        database.collection('admin_audit_logs').createIndex({ createdAt: -1 }),
      ]);

      if (await courses.countDocuments() === 0) {
        await courses.insertMany(courseSeed.map((course) => ({
          ...course,
          status: 'published',
          createdAt: new Date(),
          updatedAt: new Date(),
        })));
      }
      const latestCourse = await courses.find().sort({ id: -1 }).limit(1).next();
      await database.collection('sequences').updateOne(
        { _id: 'courses' },
        { $max: { value: Number(latestCourse?.id || 0) } },
        { upsert: true },
      );
      return database;
    })().catch((error) => {
      initialization = undefined;
      throw error;
    });
  }
  return initialization;
}

export async function nextCatalogId(name) {
  const database = await initializeCatalog();
  const sequence = await database.collection('sequences').findOneAndUpdate(
    { _id: name },
    { $inc: { value: 1 } },
    { returnDocument: 'after' },
  );
  if (!sequence) throw new Error(`Could not allocate an ID for ${name}.`);
  return sequence.value;
}

export async function recordAdminAction(request, action, resource, resourceId, details = {}) {
  const database = await initializeCatalog();
  await database.collection('admin_audit_logs').insertOne({
    actor: request.admin?.email || 'admin',
    action,
    resource,
    resourceId: String(resourceId),
    details,
    createdAt: new Date(),
  });
}
