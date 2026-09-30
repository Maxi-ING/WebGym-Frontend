import { request } from './client.js';

export const getProgress = () => request('/api/progreso');
export const runAnalysis = (exerciseId) => request(`/api/analisis/${encodeURIComponent(exerciseId)}`, { method: 'POST' });
