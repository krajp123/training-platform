import { requestOtp, verifyOtp } from './service.js';

export async function sendOtp(request, response, next) {
  try {
    const result = await requestOtp(request.body);
    return response.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function verify(request, response, next) {
  try {
    const result = await verifyOtp(request.body);
    return response.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}
