async function requestJson(url, options) {
  const token = localStorage.getItem('scs_session_token');
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (response.status === 204) return null;
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || `Request failed with status ${response.status}.`);
  }
  return result;
}

export function getJson(url) {
  return requestJson(url);
}

export async function getBlob(url) {
  const token = localStorage.getItem('scs_session_token');
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;
    try {
      const result = await response.json();
      message = result.error || message;
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
    throw new Error(message);
  }
  return response.blob();
}

export function postJson(url, body) {
  return requestJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function patchJson(url, body) {
  return requestJson(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function deleteJson(url) {
  return requestJson(url, { method: 'DELETE' });
}

export function uploadFile(url, fieldName, file) {
  const body = new FormData();
  body.append(fieldName, file);
  return requestJson(url, { method: 'POST', body });
}
