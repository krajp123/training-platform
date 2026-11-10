import { ObjectId } from 'mongodb';
import { initializeCatalog, recordAdminAction } from '../../data/persistent-store.js';
import { getUserAvatar, getUserResume, requestOtp } from '../auth/service.js';

function sendError(response, status, message) {
  return response.status(status).json({ error: message });
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getAdminOverview(request, response, next) {
  try {
    const database = await initializeCatalog();
    const [learners, courses, enrollments, orders, supportTickets, revenue, auditActivity, paidOrders] = await Promise.all([
      database.collection('users').countDocuments(),
      database.collection('courses').countDocuments(),
      database.collection('enrollments').countDocuments(),
      database.collection('orders').countDocuments(),
      database.collection('support_tickets').countDocuments({ status: { $nin: ['resolved', 'closed'] } }),
      database.collection('orders').aggregate([
        { $match: { status: { $in: ['paid', 'partially_refunded'] } } },
        { $group: { _id: null, amount: { $sum: { $subtract: ['$amount', { $ifNull: ['$refundedAmount', 0] }] } } } },
      ]).next(),
      database.collection('admin_audit_logs').find({}, { projection: { _id: 0 } })
        .sort({ createdAt: -1 }).limit(8).toArray(),
      database.collection('orders').find(
        { status: { $in: ['paid', 'partially_refunded', 'refunded'] } },
        { projection: { userEmail: 1, courseTitles: 1, amount: 1, status: 1, razorpayOrderId: 1, paidAt: 1, createdAt: 1 } },
      ).sort({ paidAt: -1, createdAt: -1 }).limit(8).toArray(),
    ]);
    const recentActivity = [
      ...auditActivity,
      ...paidOrders.map((order) => ({
        actor: order.userEmail,
        action: `payment.${order.status}`,
        resource: 'order',
        resourceId: order.razorpayOrderId,
        details: { courses: order.courseTitles, amount: order.amount },
        createdAt: order.paidAt || order.createdAt,
      })),
    ].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt)).slice(0, 8);
    const canViewFinance = ['owner', 'finance'].includes(request.admin?.role);
    const visibleActivity = request.admin?.role === 'owner'
      ? recentActivity
      : request.admin?.role === 'finance'
        ? recentActivity.filter((item) => item.resource === 'order')
        : [];

    response.json({
      learners,
      courses,
      enrollments,
      orders: canViewFinance ? orders : 0,
      openSupportTickets: supportTickets,
      revenue: canViewFinance ? revenue?.amount || 0 : 0,
      recentActivity: visibleActivity,
    });
  } catch (error) {
    next(error);
  }
}

export async function listAdminLearners(request, response, next) {
  try {
    const database = await initializeCatalog();
    const search = String(request.query.search || '').trim().slice(0, 100);
    const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(request.query.limit, 10) || 50));
    const filter = search
      ? { $or: ['name', 'identifier', 'phone'].map((field) => ({ [field]: { $regex: escapeRegex(search), $options: 'i' } })) }
      : {};
    const [learners, total] = await Promise.all([
      database.collection('users')
        .find(filter, { projection: { name: 1, identifier: 1, type: 1, phone: 1, createdAt: 1, status: 1 } })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      database.collection('users').countDocuments(filter),
    ]);
    response.json({
      learners: learners.map(({ _id, ...learner }) => ({ id: String(_id), ...learner, status: learner.status || 'active' })),
      page,
      limit,
      total,
    });
  } catch (error) {
    next(error);
  }
}

export async function setLearnerStatus(request, response, next) {
  try {
    const { id } = request.params;
    if (!ObjectId.isValid(id)) return sendError(response, 400, 'A valid learner ID is required.');
    const status = request.body?.status;
    if (!['active', 'suspended'].includes(status)) {
      return sendError(response, 400, 'status must be active or suspended.');
    }

    const database = await initializeCatalog();
    const users = database.collection('users');
    const learner = await users.findOne({ _id: new ObjectId(id) }, { projection: { name: 1, identifier: 1 } });
    if (!learner) return sendError(response, 404, 'Learner not found.');
    await users.updateOne({ _id: learner._id }, { $set: { status, updatedAt: new Date() } });
    await recordAdminAction(request, `learner.${status}`, 'learner', id, { name: learner.name });
    response.json({ id, status });
  } catch (error) {
    next(error);
  }
}

export async function listAdminEnrollments(request, response, next) {
  try {
    const database = await initializeCatalog();
    const limit = Math.min(100, Math.max(1, Number.parseInt(request.query.limit, 10) || 100));
    const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
    const match = {};
    if (request.query.courseId) {
      const courseId = Number(request.query.courseId);
      if (!Number.isSafeInteger(courseId) || courseId < 1) return sendError(response, 400, 'courseId must be a positive integer.');
      match.courseId = courseId;
    }
    if (request.query.from || request.query.to) {
      const from = request.query.from ? new Date(request.query.from) : null;
      const to = request.query.to ? new Date(request.query.to) : null;
      if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) return sendError(response, 400, 'Enrollment date filters must be valid dates.');
      if (from && to && from > to) return sendError(response, 400, 'from must be earlier than to.');
      match.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
    }
    if (request.query.status === 'completed') match.progress = 100;
    if (request.query.status === 'active') match.progress = { $lt: 100 };
    if (request.query.status && !['active', 'completed', 'revoked'].includes(request.query.status)) return sendError(response, 400, 'status must be active or completed.');

    const pipeline = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $lookup: { from: 'courses', localField: 'courseId', foreignField: 'id', as: 'course' } },
      { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'learner' } },
      { $unwind: { path: '$learner', preserveNullAndEmptyArrays: true } },
      ...(request.query.search ? [{
        $match: {
          $or: ['learner.name', 'learner.identifier', 'course.title'].map((field) => ({
            [field]: { $regex: escapeRegex(String(request.query.search).slice(0, 100)), $options: 'i' },
          })),
        },
      }] : []),
      {
        $project: {
          _id: 0,
          id: { $toString: '$_id' },
          courseId: 1,
          progress: 1,
          createdAt: 1,
          learnerName: { $ifNull: ['$learner.name', 'Unknown learner'] },
          learnerIdentifier: '$learner.identifier',
          courseTitle: { $ifNull: ['$course.title', 'Deleted course'] },
          courseStatus: '$course.status',
        },
      },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];
    const enrollments = await database.collection('enrollments').aggregate(pipeline).toArray();
    response.json({ enrollments, page, limit });
  } catch (error) {
    next(error);
  }
}

export async function getLearnerProfile(request, response, next) {
  try {
    if (!ObjectId.isValid(request.params.id)) return sendError(response, 400, 'A valid learner ID is required.');
    const learnerId = new ObjectId(request.params.id);
    const database = await initializeCatalog();
    const [user, profile, enrollments, tickets] = await Promise.all([
      database.collection('users').findOne({ _id: learnerId }, { projection: { passwordHash: 0, passwordSalt: 0 } }),
      database.collection('profiles').findOne({ userId: learnerId }, { projection: { _id: 0, userId: 0, 'resume.data': 0, 'avatar.data': 0 } }),
      database.collection('enrollments').aggregate([
        { $match: { userId: learnerId } },
        { $lookup: { from: 'courses', localField: 'courseId', foreignField: 'id', as: 'course' } },
        { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, courseId: 1, progress: 1, createdAt: 1, courseTitle: { $ifNull: ['$course.title', 'Deleted course'] } } },
      ]).toArray(),
      database.collection('support_tickets').find({ userId: learnerId }, { projection: { subject: 1, status: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(10).toArray(),
    ]);
    if (!user) return sendError(response, 404, 'Learner not found.');
    response.json({
      learner: {
        id: String(learnerId),
        name: user.name,
        identifier: user.identifier,
        type: user.type,
        phone: user.phone,
        status: user.status || 'active',
        createdAt: user.createdAt,
        profile,
      },
      enrollments,
      supportTickets: tickets.map(({ _id, ...ticket }) => ({ id: String(_id), ...ticket })),
    });
  } catch (error) {
    next(error);
  }
}

export async function getLearnerAvatar(request, response, next) {
  try {
    if (!ObjectId.isValid(request.params.id)) return sendError(response, 400, 'A valid learner ID is required.');
    const avatar = await getUserAvatar(new ObjectId(request.params.id));
    response.set({
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    response.type(avatar.contentType);
    return response.send(avatar.data);
  } catch (error) {
    return next(error);
  }
}

export async function downloadLearnerResume(request, response, next) {
  try {
    if (!ObjectId.isValid(request.params.id)) return sendError(response, 400, 'A valid learner ID is required.');
    const resume = await getUserResume(new ObjectId(request.params.id));
    const filename = resume.filename.replace(/[\r\n"]/g, '_');
    response.set({
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(resume.filename)}`,
      'X-Content-Type-Options': 'nosniff',
    });
    response.type(resume.contentType || 'application/octet-stream');
    return response.send(resume.data);
  } catch (error) {
    return next(error);
  }
}

export async function updateLearnerProfile(request, response, next) {
  try {
    if (!ObjectId.isValid(request.params.id)) return sendError(response, 400, 'A valid learner ID is required.');
    const learnerId = new ObjectId(request.params.id);
    const name = request.body?.name === undefined ? undefined : String(request.body.name).trim();
    if (name !== undefined && (!name || name.length > 120)) return sendError(response, 400, 'Learner name is required and must be at most 120 characters.');
    const allowed = ['headline', 'jobTitle', 'companyName', 'location', 'about'];
    const profile = Object.fromEntries(allowed.filter((field) => request.body?.profile?.[field] !== undefined)
      .map((field) => [field, String(request.body.profile[field]).trim().slice(0, field === 'about' ? 4000 : 180)]));
    if (name === undefined && !Object.keys(profile).length) return sendError(response, 400, 'Provide a learner name or profile fields to update.');
    const database = await initializeCatalog();
    const learner = await database.collection('users').findOne({ _id: learnerId });
    if (!learner) return sendError(response, 404, 'Learner not found.');
    if (name !== undefined) await database.collection('users').updateOne({ _id: learnerId }, { $set: { name, updatedAt: new Date() } });
    if (Object.keys(profile).length) {
      await database.collection('profiles').updateOne(
        { userId: learnerId },
        { $set: { ...profile, userId: learnerId, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true },
      );
    }
    await recordAdminAction(request, 'learner.profile_updated', 'learner', learnerId, { fields: [...Object.keys(profile), ...(name !== undefined ? ['name'] : [])] });
    response.json({ id: String(learnerId), name: name ?? learner.name, profile });
  } catch (error) {
    next(error);
  }
}

export async function sendLearnerLoginCode(request, response, next) {
  try {
    if (!ObjectId.isValid(request.params.id)) return sendError(response, 400, 'A valid learner ID is required.');
    const learnerId = new ObjectId(request.params.id);
    const database = await initializeCatalog();
    const learner = await database.collection('users').findOne({ _id: learnerId, status: { $ne: 'suspended' } }, { projection: { identifier: 1 } });
    if (!learner) return sendError(response, 404, 'Active learner not found.');
    const result = await requestOtp({ identifier: learner.identifier, purpose: 'login' });
    await recordAdminAction(request, 'learner.login_code_requested', 'learner', learnerId);
    response.json(result);
  } catch (error) {
    next(error);
  }
}

export async function setEnrollmentProgress(request, response, next) {
  try {
    const { id } = request.params;
    const progress = request.body?.progress;
    if (!ObjectId.isValid(id)) return sendError(response, 400, 'A valid enrollment ID is required.');
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      return sendError(response, 400, 'progress must be an integer from 0 to 100.');
    }

    const database = await initializeCatalog();
    const enrollmentId = new ObjectId(id);
    const enrollment = await database.collection('enrollments').findOne({ _id: enrollmentId }, { projection: { courseId: 1 } });
    if (!enrollment) return sendError(response, 404, 'Enrollment not found.');
    const result = await database.collection('enrollments').updateOne(
      { _id: enrollmentId },
      { $set: { progress, updatedAt: new Date() } },
    );
    if (!result.matchedCount) return sendError(response, 404, 'Enrollment not found.');
    await recordAdminAction(request, 'enrollment.progress_updated', 'enrollment', id, { progress });
    response.json({ id, progress });
  } catch (error) {
    next(error);
  }
}

export async function getAuditLog(request, response, next) {
  try {
    const database = await initializeCatalog();
    const limit = Math.min(100, Math.max(1, Number.parseInt(request.query.limit, 10) || 50));
    const entries = await database.collection('admin_audit_logs')
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    response.json({ entries });
  } catch (error) {
    next(error);
  }
}
