import { courses, liveClasses, createLiveClassId } from '../data/store.js';
import { validateLiveClass } from '../utils/validation.js';

function sendError(response, status, message) {
  return response.status(status).json({ error: message });
}

function initialsFor(name) {
  return name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

export function listLiveClasses(_request, response) {
  response.json(liveClasses);
}

export function createLiveClass(request, response) {
  const validationError = validateLiveClass(request.body);
  if (validationError) return sendError(response, 400, validationError);
  if (!courses.some((course) => course.title === request.body.course)) {
    return sendError(response, 400, 'Select an existing course.');
  }

  const liveClass = {
    id: createLiveClassId(),
    ...request.body,
    initials: initialsFor(request.body.instructor),
    status: 'Upcoming',
    color: 'upcoming',
  };
  liveClasses.push(liveClass);
  response.status(201).json(liveClass);
}

export function deleteLiveClass(request, response) {
  const index = liveClasses.findIndex((item) => item.id === Number(request.params.id));
  if (index === -1) return sendError(response, 404, 'Live class not found.');
  liveClasses.splice(index, 1);
  response.status(204).end();
}
