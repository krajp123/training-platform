import { courses as courseSeed, liveClasses as liveClassSeed } from './seed.js';

export const courses = courseSeed.map((course) => ({ ...course }));
export const liveClasses = liveClassSeed.map((liveClass) => ({ ...liveClass }));
export const enrollments = new Set(courses.filter((course) => course.enrolled).map((course) => course.id));

let nextCourseId = Math.max(...courses.map((course) => course.id)) + 1;
let nextClassId = Math.max(...liveClasses.map((liveClass) => liveClass.id)) + 1;

export function createCourseId() {
  return nextCourseId++;
}

export function createLiveClassId() {
  return nextClassId++;
}
