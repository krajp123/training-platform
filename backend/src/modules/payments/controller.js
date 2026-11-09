import crypto from 'node:crypto';
import Razorpay from 'razorpay';

function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const error = new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.');
    error.statusCode = 500;
    throw error;
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function createPaymentOrder(request, response, next) {
  try {
    const amount = Number(request.body?.amount);
    const currency = String(request.body?.currency || 'INR').toUpperCase();

    if (!Number.isFinite(amount) || amount <= 0) {
      const error = new Error('A valid amount is required to create the payment order.');
      error.statusCode = 400;
      throw error;
    }

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: { ...(request.body?.notes || {}) },
    });

    return response.json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      order,
    });
  } catch (error) {
    return next(error);
  }
}

export async function verifyPaymentSignature(request, response, next) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = request.body || {};

    if (!process.env.RAZORPAY_KEY_SECRET) {
      const error = new Error('Razorpay secret is not configured.');
      error.statusCode = 500;
      throw error;
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      const error = new Error('Payment verification data is incomplete.');
      error.statusCode = 400;
      throw error;
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = generatedSignature === razorpay_signature;

    return response.json({
      success: isValid,
      message: isValid ? 'Payment verified successfully.' : 'Payment signature could not be verified.',
    });
  } catch (error) {
    return next(error);
  }
}
