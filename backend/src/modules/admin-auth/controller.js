import { deleteAdminSession, getAdminSession, loginAdmin } from './service.js';

function bearerToken(request) {
  return request.get('authorization')?.replace(/^Bearer\s+/i, '');
}

export async function login(request, response, next) {
  try {
    return response.json(await loginAdmin(request.body || {}));
  } catch (error) {
    return next(error);
  }
}

export async function currentAdmin(request, response, next) {
  try {
    const admin = await getAdminSession(bearerToken(request));
    if (!admin) return response.status(401).json({ error: 'Your admin session has expired. Please sign in again.' });
    return response.json({ admin });
  } catch (error) {
    return next(error);
  }
}

export async function logout(request, response, next) {
  try {
    await deleteAdminSession(bearerToken(request));
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
}

export async function requireAdmin(request, response, next) {
  try {
    const admin = await getAdminSession(bearerToken(request));
    if (!admin) return response.status(401).json({ error: 'Admin authentication required.' });
    request.admin = admin;
    return next();
  } catch (error) {
    return next(error);
  }
}
