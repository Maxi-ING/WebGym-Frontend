import { request } from './client.js';

export const getProfile = () => request('/api/perfil');
export const saveProfile = (body) => request('/api/perfil/datos', { method: 'PUT', body });
export const getMeasurements = () => request('/api/perfil/mediciones');
export const addMeasurement = (body) => request('/api/perfil/mediciones', { method: 'POST', body });
