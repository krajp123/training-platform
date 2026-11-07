function parseJsonResponse(text) {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    if (error instanceof SyntaxError) return undefined;
    throw error;
  }
}

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
  const result = parseJsonResponse(await response.text());
  if (!response.ok) {
    throw new Error(result?.error || `Request failed with status ${response.status}.`);
  }
  if (result === null) throw new Error(`The server returned an empty response (HTTP ${response.status}).`);
  if (result === undefined) throw new Error(`The server returned an invalid JSON response (HTTP ${response.status}).`);
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
