import { request } from './client.js';

export const currentUser = () => request('/api/auth/yo');
export const register = (body) => request('/api/auth/registro', { method: 'POST', body });
export const login = (body) => request('/api/auth/ingreso', { method: 'POST', body });
export const logout = () => request('/api/auth/salir', { method: 'POST' });
