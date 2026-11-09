import { clearAdminToken, getAdminToken } from '../auth/adminSession.js';

export async function apiRequest(url, options) {
  const headers = new Headers(options?.headers || {});
  const token = getAdminToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    clearAdminToken();
    window.dispatchEvent(new Event('admin-session-expired'));
  }
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || 'The request could not be completed.');
    error.status = response.status;
    throw error;
  }
  return data;
}
