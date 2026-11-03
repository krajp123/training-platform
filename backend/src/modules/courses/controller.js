import { courses, enrollments, liveClasses, createCourseId } from '../../data/store.js';
import { validateCourse } from '../../utils/validation.js';

function sendError(response, status, message) {
  return response.status(status).json({ error: message });
}

function initialsFor(name) {
  return name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

export function listCourses(_request, response) {
  response.json(courses.map((course) => ({ ...course, enrolled: enrollments.has(course.id) })));
}

export function createCourse(request, response) {
  const validationError = validateCourse(request.body);
  if (validationError) return sendError(response, 400, validationError);

  const course = {
    id: createCourseId(),
    ...request.body,
    title: request.body.title.trim(),
    category: request.body.category.trim(),
    instructor: request.body.instructor.trim(),
    initials: initialsFor(request.body.instructor),
    rating: 'New',
    students: '0',
    lessons: Number(request.body.lessons),
    price: Number(request.body.price),
    oldPrice: Number(request.body.oldPrice),
    progress: 0,
    enrolled: false,
  };
  courses.push(course);
  response.status(201).json(course);
}

export function updateCourse(request, response) {
  const course = courses.find((item) => item.id === Number(request.params.id));
  if (!course) return sendError(response, 404, 'Course not found.');

  const updated = { ...course, ...request.body };
  const validationError = validateCourse(updated);
  if (validationError) return sendError(response, 400, validationError);

  Object.assign(course, updated, {
    title: updated.title.trim(),
    category: updated.category.trim(),
    instructor: updated.instructor.trim(),
    initials: initialsFor(updated.instructor),
    lessons: Number(updated.lessons),
    price: Number(updated.price),
    oldPrice: Number(updated.oldPrice),
  });
  response.json({ ...course, enrolled: enrollments.has(course.id) });
}

export function deleteCourse(request, response) {
  const index = courses.findIndex((item) => item.id === Number(request.params.id));
  if (index === -1) return sendError(response, 404, 'Course not found.');

  const [removedCourse] = courses.splice(index, 1);
  enrollments.delete(removedCourse.id);
  for (let classIndex = liveClasses.length - 1; classIndex >= 0; classIndex -= 1) {
    if (liveClasses[classIndex].course === removedCourse.title) liveClasses.splice(classIndex, 1);
  }
  response.status(204).end();
}
