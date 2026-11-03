import { courses, enrollments } from '../../data/store.js';

export function createEnrollment(request, response) {
  const courseId = Number(request.body?.courseId);
  const course = courses.find((item) => item.id === courseId);
  if (!course) return response.status(404).json({ error: 'Course not found.' });

  enrollments.add(courseId);
  response.status(201).json({ course: { ...course, enrolled: true, progress: 0 } });
}
