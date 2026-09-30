import { todayLocal } from '../utils/format.js';

const key = 'fitanalytics-preview-v1';
const catalog = [
  { id: 1, nombre: 'Sentadilla', unidad: 'kg' },
  { id: 2, nombre: 'Press de banca', unidad: 'kg' },
  { id: 3, nombre: 'Peso muerto', unidad: 'kg' },
  { id: 4, nombre: 'Press militar', unidad: 'kg' },
  { id: 5, nombre: 'Remo con barra', unidad: 'kg' },
];

function localIso(day) {
  return [day.getFullYear(), String(day.getMonth() + 1).padStart(2, '0'), String(day.getDate()).padStart(2, '0')].join('-');
}

function seed() {
  const monday = new Date();
  monday.setHours(12, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const sessions = Array.from({ length: 8 }, (_, index) => {
    const day = new Date(monday); day.setDate(day.getDate() - (7 - index) * 7);
    const carga_kg = 32 + index * 2;
    return { id: index + 1, fecha: localIso(day), registros: [{ id: index + 1, ejercicio_id: 1, ejercicio: 'Sentadilla', series: 3, repeticiones: 8, carga_kg, volumen_kg: 3 * 8 * carga_kg }] };
  });
  const measurements = [81.2, 80.8, 80.4, 80].map((peso_kg, index) => {
    const day = new Date(monday); day.setDate(day.getDate() - (3 - index) * 7);
    return { id: index + 1, fecha: localIso(day), peso_kg };
  });
  return { loggedIn: false, user: { id: 1, nombre: 'Usuario de prueba', correo: 'demo@example.com', edad: 25, talla_m: 1.75, objetivo: 'Mejorar fuerza por ejercicio', perfil_completo: true, peso_kg: 80, imc: 26.1 }, sessions, measurements, goals: [{ ejercicio_id: 1, ejercicio: 'Sentadilla', carga_objetivo_kg: 50, estado: 'activa' }], nextId: 9 };
}

function load() {
  try { return JSON.parse(localStorage.getItem(key)) || seed(); }
  catch { return seed(); }
}
function save(state) { localStorage.setItem(key, JSON.stringify(state)); }
function fail(status, detail) { const error = new Error(detail); error.status = status; error.detail = detail; throw error; }
const withProfile = (state) => state.user?.perfil_completo || fail(409, 'Completa primero los datos iniciales del perfil');

export async function demoRequest(path, { method = 'GET', body } = {}) {
  const state = load();
  if (path === '/api/auth/csrf') return { csrf_token: 'vista-previa' };
  if (path === '/api/auth/registro' && method === 'POST') {
    state.user = { id: 2, nombre: body.nombre, correo: body.correo, edad: null, talla_m: null, peso_kg: null, imc: null, objetivo: null, perfil_completo: false };
    state.sessions = []; state.measurements = []; state.goals = []; state.loggedIn = true;
    save(state); return { usuario: state.user, csrf_token: 'vista-previa' };
  }
  if (path === '/api/auth/ingreso' && method === 'POST') {
    if (body.correo === 'demo@example.com') {
      const demo = seed(); demo.loggedIn = true; save(demo);
      return { usuario: demo.user, csrf_token: 'vista-previa' };
    }
    if (body.correo !== state.user?.correo) fail(401, 'Usa la cuenta creada en esta vista previa o el ejemplo ficticio.');
    state.loggedIn = true; save(state);
    return { usuario: state.user, csrf_token: 'vista-previa' };
  }
  if (!state.loggedIn) fail(401, 'Inicia sesión');
  if (path === '/api/auth/yo' && method === 'GET') return state.user;
  if (path === '/api/auth/salir' && method === 'POST') { state.loggedIn = false; save(state); return { mensaje: 'Sesión cerrada' }; }
  if (path === '/api/perfil' && method === 'GET') return state.user;
  if (path === '/api/perfil/datos' && method === 'PUT') {
    const imc = Math.round(body.peso_kg / (body.talla_m ** 2) * 10) / 10;
    Object.assign(state.user, { ...body, imc, perfil_completo: true });
    const date = todayLocal();
    const last = state.measurements.find((m) => m.fecha === date);
    if (last) last.peso_kg = body.peso_kg;
    else state.measurements.push({ id: state.nextId++, fecha: date, peso_kg: body.peso_kg });
    save(state); return state.user;
  }
  withProfile(state);
  if (path === '/api/perfil/mediciones' && method === 'GET') return [...state.measurements].sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (path === '/api/perfil/mediciones' && method === 'POST') {
    const item = { id: state.nextId++, ...body }; state.measurements.push(item);
    const latest = [...state.measurements].sort((a, b) => a.fecha.localeCompare(b.fecha)).at(-1);
    state.user.peso_kg = latest.peso_kg;
    state.user.imc = Math.round(latest.peso_kg / state.user.talla_m ** 2 * 10) / 10;
    save(state); return item;
  }
  if (path === '/api/ejercicios' && method === 'GET') return catalog;
  if (path === '/api/sesiones' && method === 'GET') return [...state.sessions].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
  if (path === '/api/sesiones' && method === 'POST') {
    const item = { id: state.nextId++, fecha: body.fecha, registros: body.registros.map((r) => ({
      ...r, id: state.nextId++, ejercicio: catalog.find((e) => e.id === r.ejercicio_id)?.nombre || 'Ejercicio',
      volumen_kg: r.series * r.repeticiones * r.carga_kg,
    })) };
    state.sessions.push(item); save(state); return item;
  }
  if (path.startsWith('/api/sesiones/') && method === 'DELETE') {
    state.sessions = state.sessions.filter((s) => s.id !== Number(path.split('/').at(-1))); save(state); return null;
  }
  if (path === '/api/metas' && method === 'GET') return state.goals;
  if (path.startsWith('/api/metas/') && method === 'PUT') {
    const exerciseId = Number(path.split('/').at(-1));
    state.goals = state.goals.filter((g) => g.ejercicio_id !== exerciseId);
    const goal = { ejercicio_id: exerciseId, ejercicio: catalog.find((e) => e.id === exerciseId)?.nombre, carga_objetivo_kg: body.carga_objetivo_kg, estado: 'activa' };
    state.goals.push(goal); save(state); return goal;
  }
  if (path === '/api/progreso' && method === 'GET') {
    const byExercise = catalog.map((e) => ({ ejercicio_id: e.id, nombre: e.nombre, puntos: state.sessions.flatMap((s) => s.registros.filter((r) => r.ejercicio_id === e.id).map((r) => ({ fecha: s.fecha, carga_kg: r.carga_kg, volumen_kg: r.volumen_kg }))).sort((a, b) => a.fecha.localeCompare(b.fecha)) })).filter((e) => e.puntos.length);
    return { perfil: state.user, sesiones_total: state.sessions.length, volumen_total_kg: state.sessions.reduce((total, s) => total + s.registros.reduce((part, r) => part + r.volumen_kg, 0), 0), mediciones: [...state.measurements].sort((a, b) => a.fecha.localeCompare(b.fecha)), ejercicios: byExercise };
  }
  if (path.startsWith('/api/analisis/') && method === 'POST') return demoAnalysis(state, Number(path.split('/').at(-1)));
  fail(404, 'Ruta de vista previa no disponible');
}

function demoAnalysis(state, exerciseId) {
  const weekly = new Map();
  for (const session of state.sessions) for (const record of session.registros) {
    if (record.ejercicio_id !== exerciseId) continue;
    const date = new Date(`${session.fecha}T12:00:00`);
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    const week = localIso(date);
    weekly.set(week, Math.max(weekly.get(week) || 0, record.carga_kg));
  }
  const history = [...weekly].sort(([a], [b]) => a.localeCompare(b)).map(([semana, carga_kg]) => ({ semana, carga_kg }));
  const common = { ejercicio_id: exerciseId, ejercicio: catalog.find((e) => e.id === exerciseId)?.nombre, historial: history, semanas_registradas: history.length };
  if (history.length < 4) return { ...common, estado: 'datos_insuficientes', prediccion: null, mensaje: 'Registra cargas en al menos cuatro semanas distintas para obtener una proyección. Vista previa con datos ficticios.' };
  const first = new Date(`${history[0].semana}T12:00:00`);
  const x = history.map((p) => (new Date(`${p.semana}T12:00:00`) - first) / 604800000);
  const y = history.map((p) => p.carga_kg);
  const xm = x.reduce((a, b) => a + b, 0) / x.length; const ym = y.reduce((a, b) => a + b, 0) / y.length;
  const slope = x.reduce((a, value, i) => a + (value - xm) * (y[i] - ym), 0) / x.reduce((a, value) => a + (value - xm) ** 2, 0);
  const intercept = ym - slope * xm;
  const latest = history.at(-1); const target = state.goals.find((g) => g.ejercicio_id === exerciseId)?.carga_objetivo_kg ?? null;
  const stateName = target != null && latest.carga_kg >= target ? 'meta_alcanzada' : slope <= 0 ? 'tendencia_no_positiva' : 'proyeccion';
  let prediction = null;
  if (stateName === 'proyeccion') {
    const next = new Date(`${latest.semana}T12:00:00`); next.setDate(next.getDate() + 7);
    const weeks = target == null ? null : Math.max(1, Math.ceil((target - intercept) / slope - x.at(-1)));
    const targetDate = new Date(`${latest.semana}T12:00:00`);
    if (weeks != null) targetDate.setDate(targetDate.getDate() + 7 * weeks);
    prediction = { pendiente_kg_semana: Math.round(slope * 100) / 100, proxima_semana: localIso(next), carga_estimada_kg: Math.round((intercept + slope * (x.at(-1) + 1)) * 100) / 100, error_ultima_semana_kg: null, preliminar: history.length < 6, meta_kg: target, semanas_para_meta: weeks != null && weeks <= 52 ? weeks : null, semana_meta_estimada: weeks != null && weeks <= 52 ? localIso(targetDate) : null };
  }
  const message = stateName === 'proyeccion' ? 'Tu carga muestra una tendencia ascendente. Esta vista previa usa datos ficticios; la aplicación real calcula el modelo en el backend.' : stateName === 'meta_alcanzada' ? 'Ya alcanzaste la meta registrada. Vista previa con datos ficticios.' : 'La tendencia no es positiva. Vista previa con datos ficticios.';
  return { ...common, estado: stateName, pendiente_kg_semana: Math.round(slope * 100) / 100, semanas_activas_ultimas_4: 4, prediccion: prediction, mensaje: message };
}
