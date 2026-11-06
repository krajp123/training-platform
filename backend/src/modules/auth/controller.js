import {
  getAuthenticatedUser,
  getUserAvatar,
  getUserProfile,
  getUserResume,
  removeUserAvatar,
  removeUserResume,
  requestOtp,
  saveUserAvatar,
  saveUserResume,
  updateUserProfile,
  verifyOtp,
} from './service.js';

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

export async function getProfile(request, response, next) {
  try {
    const user = await getAuthenticatedUser(request.get('authorization')?.replace(/^Bearer\s+/i, ''));
    return response.json({ profile: await getUserProfile(user._id) });
  } catch (error) {
    return next(error);
  }
}

export async function saveProfile(request, response, next) {
  try {
    const user = await getAuthenticatedUser(request.get('authorization')?.replace(/^Bearer\s+/i, ''));
    const profile = await updateUserProfile(user._id, request.body.section, request.body.data);
    return response.json({ profile });
  } catch (error) {
    return next(error);
  }
}

export async function uploadResume(request, response, next) {
  try {
    const user = await getAuthenticatedUser(request.get('authorization')?.replace(/^Bearer\s+/i, ''));
    const resume = await saveUserResume(user._id, request.file);
    return response.json({ resume });
  } catch (error) {
    return next(error);
  }
}

export async function downloadResume(request, response, next) {
  try {
    const user = await getAuthenticatedUser(request.get('authorization')?.replace(/^Bearer\s+/i, ''));
    const resume = await getUserResume(user._id);
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

export async function deleteResume(request, response, next) {
  try {
    const user = await getAuthenticatedUser(request.get('authorization')?.replace(/^Bearer\s+/i, ''));
    await removeUserResume(user._id);
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
}

export async function uploadAvatar(request, response, next) {
  try {
    const user = await getAuthenticatedUser(request.get('authorization')?.replace(/^Bearer\s+/i, ''));
    const avatar = await saveUserAvatar(user._id, request.file);
    return response.json({ avatar });
  } catch (error) {
    return next(error);
  }
}

export async function getAvatar(request, response, next) {
  try {
    const user = await getAuthenticatedUser(request.get('authorization')?.replace(/^Bearer\s+/i, ''));
    const avatar = await getUserAvatar(user._id);
    response.set('Cache-Control', 'private, no-store');
    response.type(avatar.contentType);
    return response.send(avatar.data);
  } catch (error) {
    return next(error);
  }
}

export async function deleteAvatar(request, response, next) {
  try {
    const user = await getAuthenticatedUser(request.get('authorization')?.replace(/^Bearer\s+/i, ''));
    await removeUserAvatar(user._id);
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
}
