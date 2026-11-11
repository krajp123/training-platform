import { initializeCatalog, nextCatalogId, recordAdminAction } from '../../data/persistent-store.js';
import { validateCourse } from '../../utils/validation.js';

function sendError(response, status, message) {
  return response.status(status).json({ error: message });
}

function initialsFor(name) {
  return name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

export async function listCourses(_request, response, next) {
  try {
    const database = await initializeCatalog();
    const courses = await database.collection('courses')
      .find({ $or: [{ status: 'published' }, { status: { $exists: false } }] })
      .sort({ id: 1 })
      .toArray();
    response.json(courses.map(({ _id, sections, ...course }) => course));
  } catch (error) {
    next(error);
  }
}

async function homepageFeaturedCourseIds(database) {
  const [settings, publishedCourses] = await Promise.all([
    database.collection('platform_settings').findOne({ _id: 'homepage-featured-courses' }),
    database.collection('courses')
      .find({ $or: [{ status: 'published' }, { status: { $exists: false } }] })
      .sort({ id: 1 })
      .toArray(),
  ]);
  const publishedIds = new Set(publishedCourses.map((course) => course.id));
  if (Array.isArray(settings?.courseIds)) {
    return [...new Set(settings.courseIds.filter((id) => publishedIds.has(id)))].slice(0, 3);
  }
  return publishedCourses.slice(0, 3).map((course) => course.id);
}

export async function listHomepageFeaturedCourses(_request, response, next) {
  try {
    const database = await initializeCatalog();
    const courseIds = await homepageFeaturedCourseIds(database);
    const courses = await database.collection('courses')
      .find({ id: { $in: courseIds }, $or: [{ status: 'published' }, { status: { $exists: false } }] })
      .toArray();
    const coursesById = new Map(courses.map((course) => [course.id, course]));
    response.json(courseIds.map((id) => coursesById.get(id)).filter(Boolean)
      .map(({ _id, sections, ...course }) => course));
  } catch (error) {
    next(error);
  }
}

export async function getAdminHomepageFeaturedCourses(_request, response, next) {
  try {
    const database = await initializeCatalog();
    response.json({ courseIds: await homepageFeaturedCourseIds(database) });
  } catch (error) {
    next(error);
  }
}

export async function saveHomepageFeaturedCourses(request, response, next) {
  try {
    const { courseIds } = request.body || {};
    if (!Array.isArray(courseIds) || courseIds.length > 3
      || courseIds.some((id) => !Number.isSafeInteger(id) || id < 1)
      || new Set(courseIds).size !== courseIds.length) {
      return sendError(response, 400, 'Select up to three distinct courses for the homepage.');
    }

    const database = await initializeCatalog();
    const publishedCount = await database.collection('courses').countDocuments({
      id: { $in: courseIds },
      $or: [{ status: 'published' }, { status: { $exists: false } }],
    });
    if (publishedCount !== courseIds.length) {
      return sendError(response, 400, 'All selected homepage courses must be published.');
    }

    await database.collection('platform_settings').updateOne(
      { _id: 'homepage-featured-courses' },
      { $set: { courseIds, updatedAt: new Date() } },
      { upsert: true },
    );
    await recordAdminAction(request, 'homepage.courses.updated', 'homepage', 'featured-courses', { courseIds });
    response.json({ courseIds });
  } catch (error) {
    next(error);
  }
}

export async function listAdminCourses(_request, response, next) {
  try {
    const database = await initializeCatalog();
    const courses = await database.collection('courses').find().sort({ id: 1 }).toArray();
    response.json(courses.map(({ _id, ...course }) => course));
  } catch (error) {
    next(error);
  }
}

export async function createCourse(request, response, next) {
  try {
    const validationError = validateCourse(request.body);
    if (validationError) return sendError(response, 400, validationError);

    const database = await initializeCatalog();
    if (request.body.status !== undefined && !['draft', 'published', 'archived'].includes(request.body.status)) {
      return sendError(response, 400, 'status must be draft, published, or archived.');
    }
    const fields = courseFields(request.body);
    const instructor = fields.instructor.trim();
    const course = {
      id: await nextCatalogId('courses'),
      ...fields,
      title: fields.title.trim(),
      category: fields.category.trim(),
      hours: fields.hours.trim(),
      instructor,
      initials: initialsFor(instructor),
      rating: 'New',
      students: '0',
      lessons: Number(fields.lessons),
      price: Number(fields.price),
      oldPrice: Number(fields.oldPrice),
      progress: 0,
      enrolled: false,
      status: fields.status || 'published',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await database.collection('courses').insertOne(course);
    await recordAdminAction(request, 'course.created', 'course', course.id, { title: course.title });
    response.status(201).json(course);
  } catch (error) {
    next(error);
  }
}

export async function updateCourse(request, response, next) {
  try {
    const database = await initializeCatalog();
    const collection = database.collection('courses');
    const id = Number(request.params.id);
    const course = await collection.findOne({ id });
    if (!course) return sendError(response, 404, 'Course not found.');
    if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
      return sendError(response, 400, 'Request body must be a JSON object.');
    }

    const changes = courseFields(request.body);
    if (changes.status !== undefined && !['draft', 'published', 'archived'].includes(changes.status)) {
      return sendError(response, 400, 'status must be draft, published, or archived.');
    }
    const updated = { ...course, ...changes };
    const validationError = validateCourse(updated);
    if (validationError) return sendError(response, 400, validationError);
    const instructor = updated.instructor.trim();
    const saved = {
      ...updated,
      title: updated.title.trim(),
      category: updated.category.trim(),
      hours: updated.hours.trim(),
      instructor,
      initials: initialsFor(instructor),
      lessons: Number(updated.lessons),
      price: Number(updated.price),
      oldPrice: Number(updated.oldPrice),
      status: updated.status || 'published',
      updatedAt: new Date(),
    };
    delete saved._id;
    await collection.updateOne({ id }, { $set: saved });
    await recordAdminAction(request, 'course.updated', 'course', id, { title: saved.title });
    response.json(saved);
  } catch (error) {
    next(error);
  }
}

function courseFields(input) {
  const allowed = ['title', 'category', 'level', 'instructor', 'duration', 'hours', 'lessons', 'price', 'oldPrice', 'image', 'color', 'status'];
  return Object.fromEntries(allowed.filter((field) => input[field] !== undefined).map((field) => [field, input[field]]));
}

export async function deleteCourse(request, response, next) {
  try {
    const database = await initializeCatalog();
    const id = Number(request.params.id);
    const courses = database.collection('courses');
    const course = await courses.findOne({ id });
    if (!course) return sendError(response, 404, 'Course not found.');

    await courses.deleteOne({ id });
    await recordAdminAction(request, 'course.deleted', 'course', id, { title: course.title });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
}
