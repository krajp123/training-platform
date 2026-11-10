export function validateCourse(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return 'Request body must be a JSON object.';
  }
  const requiredText = ['title', 'category', 'level', 'instructor', 'duration', 'hours'];
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
  if (!['Beginner', 'Intermediate', 'Advanced', 'Foundation', 'Career Track'].includes(input.level)) {
    return 'level must be Beginner, Intermediate, Advanced, Foundation, or Career Track.';
  }
  return null;
}
