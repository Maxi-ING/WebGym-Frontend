import test from 'node:test';
import assert from 'node:assert/strict';
import { demoRequest } from '../src/api/demo.js';
import { escapeHtml, shortDate } from '../src/utils/format.js';

const cache = new Map();
globalThis.localStorage = {
  getItem: (key) => cache.get(key) ?? null,
  setItem: (key, value) => cache.set(key, value),
};

test('la cuenta ficticia muestra ocho semanas y proyección únicamente al solicitarla', async () => {
  cache.clear();
  const login = await demoRequest('/api/auth/ingreso', { method: 'POST', body: { correo: 'demo@example.com' } });
  assert.equal(login.usuario.perfil_completo, true);
  const progress = await demoRequest('/api/progreso');
  assert.equal(progress.sesiones_total, 8);
  assert.equal('prediccion' in progress, false);
  const result = await demoRequest('/api/analisis/1', { method: 'POST' });
  assert.equal(result.prediccion.pendiente_kg_semana, 2);
  assert.equal(result.prediccion.semanas_para_meta, 2);
});

test('una cuenta nueva requiere perfil y no hereda el historial demo', async () => {
  cache.clear();
  const created = await demoRequest('/api/auth/registro', {
    method: 'POST', body: { nombre: 'Ana', correo: 'ana@example.com', clave: 'UnaClaveLarga123!' },
  });
  assert.equal(created.usuario.perfil_completo, false);
  await assert.rejects(demoRequest('/api/progreso'), (error) => error.status === 409);
  const profile = await demoRequest('/api/perfil/datos', {
    method: 'PUT', body: { edad: 25, talla_m: 1.75, peso_kg: 80, objetivo: 'Mejorar fuerza' },
  });
  assert.equal(profile.imc, 26.1);
  assert.equal((await demoRequest('/api/progreso')).sesiones_total, 0);
  assert.equal((await demoRequest('/api/analisis/1', { method: 'POST' })).estado, 'datos_insuficientes');
});

test('los textos recibidos se escapan antes de insertarlos en HTML', () => {
  assert.equal(escapeHtml('<script>"&'), '&lt;script&gt;&quot;&amp;');
  assert.notEqual(shortDate('2026-09-29'), '—');
});
