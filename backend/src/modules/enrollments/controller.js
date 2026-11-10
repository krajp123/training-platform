import { getAuthenticatedUser } from '../auth/service.js';
import { initializeCatalog } from '../../data/persistent-store.js';

export async function createEnrollment(request, response, next) {
  try {
    const user = await getAuthenticatedUser(request.get('authorization')?.replace(/^Bearer\s+/i, ''));
    const courseId = Number(request.body?.courseId);
    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
      return response.status(400).json({ error: 'A valid courseId is required.' });
    }

    const database = await initializeCatalog();
    const course = await database.collection('courses').findOne({ id: courseId, status: 'published' });
    if (!course) return response.status(404).json({ error: 'Course not found.' });

    await database.collection('enrollments').updateOne(
      { courseId, userId: user._id },
      { $setOnInsert: { courseId, userId: user._id, progress: 0, createdAt: new Date() } },
      { upsert: true },
    );
    const { _id, ...courseData } = course;
    response.status(201).json({ course: { ...courseData, enrolled: true, progress: 0 } });
  } catch (error) {
    next(error);
  }
}
