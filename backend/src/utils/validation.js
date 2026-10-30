export function validateCourse(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return 'Request body must be a JSON object.';
  }
  const requiredText = ['title', 'category', 'level', 'instructor', 'duration'];
  for (const field of requiredText) {
    if (typeof input[field] !== 'string' || !input[field].trim()) {
      return `${field} is required.`;
    }
  }
  for (const field of ['price', 'oldPrice', 'lessons']) {
    if (!Number.isFinite(Number(input[field])) || Number(input[field]) < 0) {
      return `${field} must be a non-negative number.`;
    }
  }
  if (input.level !== 'Beginner' && input.level !== 'Intermediate') {
    return 'level must be Beginner or Intermediate.';
  }
  return null;
}

export function validateLiveClass(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return 'Request body must be a JSON object.';
  }
  for (const field of ['title', 'course', 'instructor', 'time', 'date']) {
    if (typeof input[field] !== 'string' || !input[field].trim()) {
      return `${field} is required.`;
    }
  }
  return null;
}
