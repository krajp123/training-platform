import { getAuthenticatedUser } from '../auth/service.js';
import { initializeCatalog } from '../../data/persistent-store.js';

export async function listMyEnrollments(request, response, next) {
  try {
    const user = await getAuthenticatedUser(request.get('authorization')?.replace(/^Bearer\s+/i, ''));
    const database = await initializeCatalog();
    const enrollments = await database.collection('enrollments')
      .find({ userId: user._id })
      .sort({ createdAt: -1 })
      .toArray();
    const courseIds = enrollments.map(({ courseId }) => courseId);
    const courses = courseIds.length
      ? await database.collection('courses').find({ id: { $in: courseIds } }).toArray()
      : [];
    const coursesById = new Map(courses.map((course) => [course.id, course]));
    const enrolledCourses = enrollments.flatMap((enrollment) => {
      const course = coursesById.get(enrollment.courseId);
      if (!course) return [];
      const courseData = { ...course, enrolled: true, progress: enrollment.progress || 0 };
      delete courseData._id;
      delete courseData.sections;
      return [courseData];
    });

    response.json({
      courses: enrolledCourses,
      enrollments: enrollments.flatMap((enrollment) => {
        if (!coursesById.has(enrollment.courseId)) return [];
        const enrollmentData = { ...enrollment };
        delete enrollmentData._id;
        delete enrollmentData.userId;
        return [{ ...enrollmentData, course: enrolledCourses.find((course) => course.id === enrollment.courseId) }];
      }),
    });
  } catch (error) {
    next(error);
  }
}

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
    const coursePrice = Number(course.price);
    if (!Number.isFinite(coursePrice) || coursePrice !== 0) {
      return response.status(409).json({ error: 'Paid courses must be purchased through secure checkout.' });
    }

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
