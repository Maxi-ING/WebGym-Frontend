import { request } from './client.js';

export const getExercises = () => request('/api/ejercicios');
export const getSessions = () => request('/api/sesiones');
export const addSession = (body) => request('/api/sesiones', { method: 'POST', body });
export const removeSession = (id) => request(`/api/sesiones/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const getGoals = () => request('/api/metas');
export const saveGoal = (id, body) => request(`/api/metas/${encodeURIComponent(id)}`, { method: 'PUT', body });
