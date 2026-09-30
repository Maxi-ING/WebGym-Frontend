import { getProgress } from '../api/analytics.js';
import { getGoals } from '../api/training.js';
import { clearCharts, weightChart, loadChart } from '../ui/charts.js';
import { decimal, escapeHtml } from '../utils/format.js';

export async function mountProgress(root) {
  const [data, goals] = await Promise.all([getProgress(), getGoals()]);
  const exercises = data.ejercicios;
  let exerciseId = goals.find((g) => exercises.some((e) => e.ejercicio_id === g.ejercicio_id))?.ejercicio_id || exercises[0]?.ejercicio_id;
  function render() {
    clearCharts();
    const exercise = exercises.find((item) => item.ejercicio_id === Number(exerciseId));
    const points = exercise?.puntos || [];
    const goal = goals.find((g) => g.ejercicio_id === Number(exerciseId));
    const currentLoad = points.length ? Math.max(...points.map((p) => p.carga_kg)) : null;
    const lastVolume = points.at(-1)?.volumen_kg;
    const percent = goal && currentLoad != null ? Math.min(100, Math.round(100 * currentLoad / goal.carga_objetivo_kg)) : 0;
    root.innerHTML = `<div class="page-head"><div><h1>Tu progreso en un vistazo</h1><p>Indicadores calculados a partir de las sesiones y mediciones registradas.</p></div><span class="pill">PASO 3 DE 3</span></div>
      <div class="grid stats-grid">
        <section class="card"><div class="metric-label">Peso actual</div><div class="metric-value">${data.perfil.peso_kg == null ? '—' : decimal(data.perfil.peso_kg) + ' kg'}</div><p class="metric-note">Última medición</p></section>
        <section class="card"><div class="metric-label">IMC de referencia</div><div class="metric-value">${decimal(data.perfil.imc)}</div><p class="metric-note">Adultos · orientativo</p></section>
        <section class="card"><div class="metric-label">Carga máxima</div><div class="metric-value">${currentLoad == null ? '—' : decimal(currentLoad) + ' kg'}</div><p class="metric-note">${exercise ? escapeHtml(exercise.nombre) : 'Sin ejercicios'}</p></section>
        <section class="card"><div class="metric-label">Volumen reciente</div><div class="metric-value">${lastVolume == null ? '—' : decimal(lastVolume, 0) + ' kg'}</div><p class="metric-note">Último registro del ejercicio</p></section>
      </div>
      <div class="grid grid-even" style="margin-top:20px">
        <section class="card chart-card"><h2>Peso corporal</h2><p class="muted small">Evolución de mediciones</p>
          ${data.mediciones.length ? '<div class="chart-container"><canvas id="weight-chart" aria-label="Gráfico de peso corporal" role="img"></canvas></div>' : '<div class="empty">Completa tu perfil y registra medidas para ver el gráfico.</div>'}
        </section>
        <section class="card chart-card"><div class="card-header"><div><h2>Fuerza por ejercicio</h2><p>Carga registrada en tus sesiones</p></div></div>
          ${exercises.length ? `<label class="sr-only" for="progress-exercise">Ejercicio</label><select id="progress-exercise" class="field" style="max-width:250px">${exercises.map((e) => `<option value="${e.ejercicio_id}" ${e.ejercicio_id === Number(exerciseId) ? 'selected' : ''}>${escapeHtml(e.nombre)}</option>`).join('')}</select><div class="chart-container"><canvas id="load-chart" aria-label="Gráfico de carga por ejercicio" role="img"></canvas></div>` : '<div class="empty">Registra una sesión para ver la evolución de tu carga.</div>'}
        </section>
      </div>
      <section class="card" style="margin-top:20px"><div class="grid grid-even"><div><h2>Resumen de actividad</h2><p>${data.sesiones_total} ${data.sesiones_total === 1 ? 'sesión registrada' : 'sesiones registradas'}</p><p class="muted small">Volumen acumulado: ${decimal(data.volumen_total_kg, 0)} kg</p></div>
        <div><div class="metric-label">Meta de carga</div><div class="metric-value" style="font-size:1.35rem">${goal ? `${currentLoad == null ? '—' : decimal(currentLoad)} de ${decimal(goal.carga_objetivo_kg)} kg` : 'Sin meta configurada'}</div>
          ${goal ? `<div class="progress-track" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100" aria-label="Avance hacia la meta"><div class="progress-fill" style="width:${percent}%"></div></div>` : '<p class="muted small">Agrega una meta en Entrenamiento.</p>'}</div></div></section>`;
    if (data.mediciones.length) weightChart(root.querySelector('#weight-chart'), data.mediciones);
    if (points.length) loadChart(root.querySelector('#load-chart'), points);
    root.querySelector('#progress-exercise')?.addEventListener('change', (event) => { exerciseId = Number(event.target.value); render(); });
  }
  render();
}
