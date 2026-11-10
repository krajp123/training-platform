import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { ObjectId } from 'mongodb';
import { getAuthenticatedUser, getDatabase } from '../auth/service.js';
import { initializeCatalog, recordAdminAction } from '../../data/persistent-store.js';

function makeError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw makeError('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the backend environment.', 503);
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

async function getLearner(request) {
  return getAuthenticatedUser(request.get('authorization')?.replace(/^Bearer\s+/i, ''));
}

async function grantOrderEnrollments(database, userId, order) {
  await database.collection('enrollments').bulkWrite(order.courseIds.map((courseId) => ({
    updateOne: {
      filter: { userId, courseId },
      update: { $setOnInsert: { userId, courseId, progress: 0, createdAt: new Date(), orderId: order.razorpayOrderId } },
      upsert: true,
    },
  })));
}

async function countCouponUseOnce(database, orderId, couponCode) {
  if (!couponCode) return;
  const claim = await database.collection('orders').updateOne(
    { _id: orderId, couponCounted: { $ne: true } },
    { $set: { couponCounted: true } },
  );
  if (claim.modifiedCount) await database.collection('coupons').updateOne({ code: couponCode }, { $inc: { usedCount: 1 } });
}

export async function createPaymentOrder(request, response, next) {
  try {
    const user = await getLearner(request);
    const courseIds = Array.isArray(request.body?.courseIds)
      ? [...new Set(request.body.courseIds.map(Number))]
      : [];
    if (!courseIds.length || courseIds.length > 20 || courseIds.some((id) => !Number.isSafeInteger(id) || id < 1)) {
      throw makeError('Select between 1 and 20 valid courses to continue.', 400);
    }

    const database = await initializeCatalog();
    const courses = await database.collection('courses')
      .find({ id: { $in: courseIds }, status: 'published' })
      .toArray();
    if (courses.length !== courseIds.length) throw makeError('One or more selected courses are no longer available.', 400);

    const alreadyEnrolled = await database.collection('enrollments').findOne({
      userId: user._id,
      courseId: { $in: courseIds },
    });
    if (alreadyEnrolled) throw makeError('You are already enrolled in one of the selected courses.', 409);

    const subtotal = courses.reduce((sum, course) => sum + Number(course.price), 0);
    let discount = 0;
    let coupon;
    const couponCode = String(request.body?.couponCode || '').trim().toUpperCase();
    if (couponCode) {
      coupon = await database.collection('coupons').findOne({ code: couponCode, status: 'active' });
      const now = new Date();
      if (!coupon || (coupon.startsAt && coupon.startsAt > now) || (coupon.endsAt && coupon.endsAt < now)
        || (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses)
        || (coupon.courseIds?.length && !courseIds.some((id) => coupon.courseIds.includes(id)))) {
        throw makeError('This coupon is not currently valid for the selected courses.', 400);
      }
      const applicableSubtotal = coupon.courseIds?.length
        ? courses.filter((course) => coupon.courseIds.includes(course.id)).reduce((sum, course) => sum + Number(course.price), 0)
        : subtotal;
      discount = coupon.discountType === 'percent'
        ? Math.round(applicableSubtotal * coupon.value / 100)
        : Math.min(applicableSubtotal, coupon.value);
    }
    const amount = Math.max(0, subtotal - discount);
    if (amount === 0) {
      const order = {
        razorpayOrderId: `free_${crypto.randomUUID()}`,
        userId: user._id,
        userEmail: user.identifier,
        userName: user.name,
        courseIds,
        courseTitles: courses.map((course) => course.title),
        subtotal,
        discount,
        couponCode: coupon?.code || '',
        amount: 0,
        currency: 'INR',
        status: 'paid',
        paidAt: new Date(),
        createdAt: new Date(),
      };
      const savedOrder = await database.collection('orders').insertOne(order);
      await grantOrderEnrollments(database, user._id, { ...order, _id: savedOrder.insertedId });
      await countCouponUseOnce(database, savedOrder.insertedId, order.couponCode);
      return response.status(201).json({
        freeEnrollment: true,
        message: 'Coupon applied. Course access is active.',
        summary: { subtotal, discount, amount, courseTitles: order.courseTitles },
      });
    }

    const razorpay = getRazorpayInstance();
    const receipt = `skillpath_${crypto.randomUUID().replaceAll('-', '').slice(0, 32)}`;
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt,
      notes: { userId: String(user._id), courseIds: courseIds.join(',') },
    });
    const order = {
      razorpayOrderId: razorpayOrder.id,
      receipt,
      userId: user._id,
      userEmail: user.identifier,
      userName: user.name,
      courseIds,
      courseTitles: courses.map((course) => course.title),
      subtotal,
      discount,
      couponCode: coupon?.code || '',
      amount,
      amountMinor: razorpayOrder.amount,
      currency: 'INR',
      status: 'pending',
      createdAt: new Date(),
    };
    await database.collection('orders').insertOne(order);
    response.status(201).json({
      keyId: process.env.RAZORPAY_KEY_ID,
      order: { id: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency },
      summary: { subtotal, discount, amount, courseTitles: order.courseTitles },
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyPaymentSignature(request, response, next) {
  try {
    const user = await getLearner(request);
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = request.body || {};
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw makeError('Razorpay secret is not configured.', 503);
    if (![orderId, paymentId, signature].every((value) => typeof value === 'string' && value.length > 0)) {
      throw makeError('Payment verification data is incomplete.', 400);
    }

    const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest();
    let supplied;
    try {
      supplied = Buffer.from(signature, 'hex');
    } catch {
      throw makeError('Payment signature could not be verified.', 400);
    }
    if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
      throw makeError('Payment signature could not be verified.', 400);
    }

    const database = await initializeCatalog();
    const orders = database.collection('orders');
    const order = await orders.findOne({ razorpayOrderId: orderId, userId: user._id });
    if (!order) throw makeError('Payment order not found for this account.', 404);
    if (order.status === 'paid') {
      if (order.razorpayPaymentId !== paymentId) throw makeError('This order was verified with a different payment.', 409);
      await grantOrderEnrollments(database, user._id, order);
      await countCouponUseOnce(database, order._id, order.couponCode);
      return response.json({ success: true, message: 'Payment was already verified.' });
    }
    if (order.status !== 'pending') throw makeError('This order cannot be verified in its current state.', 409);

    const result = await orders.updateOne(
      { _id: order._id, status: 'pending' },
      { $set: { status: 'paid', razorpayPaymentId: paymentId, paidAt: new Date(), updatedAt: new Date() } },
    );
    if (!result.modifiedCount) {
      const latest = await orders.findOne({ _id: order._id });
      if (latest?.status === 'paid' && latest.razorpayPaymentId === paymentId) {
        await grantOrderEnrollments(database, user._id, latest);
        await countCouponUseOnce(database, latest._id, latest.couponCode);
        return response.json({ success: true, message: 'Payment was already verified.' });
      }
      throw makeError('The order changed while payment was being verified.', 409);
    }
    await grantOrderEnrollments(database, user._id, order);
    await countCouponUseOnce(database, order._id, order.couponCode);
    response.json({ success: true, message: 'Payment verified and course access granted.' });
  } catch (error) {
    next(error);
  }
}

export async function listOrders(request, response, next) {
  try {
    const database = await initializeCatalog();
    const status = String(request.query.status || '');
    const search = String(request.query.search || '').trim().slice(0, 100);
    const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(request.query.limit, 10) || 50));
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.$or = [
      { userEmail: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
      { razorpayOrderId: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
      { userName: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
    ];
    const [orders, total] = await Promise.all([
      database.collection('orders').find(filter, { projection: { userId: 0 } })
        .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
      database.collection('orders').countDocuments(filter),
    ]);
    response.json({
      orders: orders.map(({ _id, ...order }) => ({ id: String(_id), ...order })),
      page, limit, total,
    });
  } catch (error) {
    next(error);
  }
}

export async function refundPayment(request, response, next) {
  try {
    const id = String(request.params.id || '');
    const amount = request.body?.amount === undefined ? undefined : Number(request.body.amount);
    if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) throw makeError('Refund amount must be greater than zero.', 400);
    const database = await initializeCatalog();
    const orders = database.collection('orders');
    const filter = id.match(/^[a-f\d]{24}$/i)
      ? { $or: [{ razorpayOrderId: id }, { _id: new ObjectId(id) }] }
      : { razorpayOrderId: id };
    const order = await orders.findOne(filter);
    if (!order) throw makeError('Order not found.', 404);
    if (!order.razorpayPaymentId || !['paid', 'partially_refunded'].includes(order.status)) throw makeError('Only captured payments can be refunded.', 409);
    const remaining = Number((order.amount - (order.refundedAmount || 0)).toFixed(2));
    const refundAmount = amount ?? remaining;
    if (refundAmount > remaining) throw makeError('Refund amount cannot exceed the remaining captured amount.', 400);

    const claim = await orders.updateOne(
      { _id: order._id, status: order.status, refundedAmount: order.refundedAmount || 0 },
      { $set: { status: 'refund_pending', updatedAt: new Date() } },
    );
    if (!claim.modifiedCount) throw makeError('Another refund is already being processed for this order.', 409);
    let refund;
    try {
      refund = await getRazorpayInstance().payments.refund(order.razorpayPaymentId, {
        amount: Math.round(refundAmount * 100),
        notes: { orderId: order.razorpayOrderId, requestedBy: request.admin.email },
      });
    } catch (error) {
      if (Number(error.statusCode) >= 400 && Number(error.statusCode) < 500) {
        await orders.updateOne({ _id: order._id, status: 'refund_pending' }, { $set: { status: order.status, updatedAt: new Date() } });
      }
      throw error;
    }
    const refundedAmount = Number(((order.refundedAmount || 0) + refundAmount).toFixed(2));
    const status = refundedAmount >= order.amount ? 'refunded' : 'partially_refunded';
    const updated = await orders.updateOne(
      { _id: order._id, status: 'refund_pending' },
      { $set: { status, refundedAmount, updatedAt: new Date() }, $push: { refunds: { id: refund.id, amount: refundAmount, status: refund.status, createdAt: new Date(), requestedBy: request.admin.email } } },
    );
    if (!updated.modifiedCount) throw makeError(`Refund ${refund.id} was accepted, but order status could not be updated. Reconcile this refund before retrying.`, 503);
    await recordAdminAction(request, 'payment.refunded', 'order', order.razorpayOrderId, { amount: refundAmount, refundId: refund.id });
    response.json({ refundId: refund.id, amount: refundAmount, status });
  } catch (error) {
    next(error);
  }
}

export async function learnerOrders(request, response, next) {
  try {
    const user = await getLearner(request);
    const database = await getDatabase();
    const orders = await database.collection('orders').find({ userId: user._id }, { projection: { userId: 0 } }).sort({ createdAt: -1 }).limit(50).toArray();
    response.json({
      orders: orders.map(({ _id, ...order }) => ({
        ...order,
        refunds: order.refunds?.map(({ requestedBy, ...refund }) => refund),
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function markPaymentFailed(request, response, next) {
  try {
    const user = await getLearner(request);
    const orderId = String(request.body?.orderId || '');
    const reason = String(request.body?.reason || 'Payment was not completed.').slice(0, 500);
    const database = await initializeCatalog();
    const result = await database.collection('orders').updateOne(
      { razorpayOrderId: orderId, userId: user._id, status: 'pending' },
      { $set: { status: 'failed', failureReason: reason, updatedAt: new Date() } },
    );
    if (!result.modifiedCount) throw makeError('Pending order not found.', 404);
    response.json({ status: 'failed' });
  } catch (error) {
    next(error);
  }
}

export async function getOrderReceipt(request, response, next) {
  try {
    const user = await getLearner(request);
    const database = await initializeCatalog();
    const order = await database.collection('orders').findOne({
      $or: [
        { razorpayOrderId: request.params.id, userId: user._id },
        ...(ObjectId.isValid(request.params.id) ? [{ _id: new ObjectId(request.params.id), userId: user._id }] : []),
      ],
      status: { $in: ['paid', 'partially_refunded', 'refunded'] },
    }, { projection: { userId: 0 } });
    if (!order) throw makeError('Receipt is not available for this order.', 404);
    const { _id, ...receipt } = order;
    receipt.refunds = receipt.refunds?.map(({ requestedBy, ...refund }) => refund);
    response.json({ receipt: { ...receipt, id: String(_id), issuer: 'SCS Academy' } });
  } catch (error) {
    next(error);
  }
}
