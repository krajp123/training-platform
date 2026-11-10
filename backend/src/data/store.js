import { courses as courseSeed } from './seed.js';

export const courses = courseSeed.map((course) => ({ ...course }));
export const enrollments = new Set(courses.filter((course) => course.enrolled).map((course) => course.id));

let nextCourseId = Math.max(...courses.map((course) => course.id)) + 1;

export function createCourseId() {
  return nextCourseId++;
}
