import { demoRequest } from './demo.js';

let csrfToken = '';
export const demoMode = import.meta.env.VITE_DEMO_MODE === 'true';

export class ApiError extends Error {
  constructor(status, detail) {
    super(typeof detail === 'string' ? detail : 'Error en la solicitud');
    this.status = status;
    this.detail = detail;
  }
}

export function setCsrf(token) { csrfToken = token || ''; }

export async function request(path, { method = 'GET', body, signal } = {}) {
  if (demoMode) {
    const data = await demoRequest(path, { method, body });
    if (data?.csrf_token) setCsrf(data.csrf_token);
    return data;
  }
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET') headers['X-CSRF-Token'] = csrfToken;
  let response;
  try {
    response = await fetch(path, {
      method, headers, credentials: 'same-origin', signal,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa la configuración de la API.');
  }
  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, data?.detail || 'No se pudo completar la solicitud.');
  if (data?.csrf_token) setCsrf(data.csrf_token);
  return data;
}

export const getCsrf = () => request('/api/auth/csrf');
