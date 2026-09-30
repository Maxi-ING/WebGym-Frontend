import { getExercises, getGoals } from '../api/training.js';
import { runAnalysis } from '../api/analytics.js';
import { clearCharts, projectionChart } from '../ui/charts.js';
import { toast } from '../ui/toast.js';
import { decimal, escapeHtml, messageFromError, shortDate } from '../utils/format.js';

export async function mountAnalysis(root) {
  const [exercises, goals] = await Promise.all([getExercises(), getGoals()]);
  const options = exercises.map((exercise) => `<option value="${exercise.id}">${escapeHtml(exercise.nombre)}</option>`).join('');
  let selected = goals[0]?.ejercicio_id || exercises[0]?.id;
  let result = null;

  function render() {
    clearCharts();
    const current = result?.historial.at(-1)?.carga_kg;
    const forecast = result?.prediccion;
    const percent = forecast?.meta_kg && current != null ? Math.min(100, Math.round(current / forecast.meta_kg * 100)) : null;
    root.innerHTML = `<div class="page-head"><div><h1>Análisis de tu progreso</h1><p>La predicción se calcula solo cuando pulsas el botón.</p></div>${result ? '<span class="pill">RESULTADO SOLICITADO</span>' : ''}</div>
      <section class="card"><div class="grid grid-even"><div><h2>Elige un ejercicio</h2><p class="muted small">Usaremos únicamente tus registros de ese ejercicio.</p>
        <label class="label" for="analysis-exercise">Ejercicio</label><select id="analysis-exercise" class="field" ${exercises.length ? '' : 'disabled'}>${options}</select></div>
        <div><h2>Tu análisis, cuando lo necesites</h2><p class="muted small">Se necesitan cargas de cuatro semanas distintas para una proyección preliminar.</p>
          <button class="button" id="analyze-button" type="button" ${exercises.length ? '' : 'disabled'}>Analizar mi progreso →</button></div></div></section>
      <div id="analysis-output">${result ? resultHtml(result, percent, current) : '<section class="card" style="margin-top:20px"><div class="empty">Aquí aparecerán el gráfico, la estimación orientativa y un mensaje después de solicitar el análisis. Tu panel de progreso no ejecuta el modelo.</div></section>'}</div>`;
    const select = root.querySelector('#analysis-exercise');
    if (select && selected) select.value = String(selected);
    select?.addEventListener('change', (event) => { selected = Number(event.target.value); result = null; render(); });
    root.querySelector('#analyze-button')?.addEventListener('click', async (event) => {
      const button = event.currentTarget; button.disabled = true; button.textContent = 'Analizando…';
      try { result = await runAnalysis(selected); render(); }
      catch (error) { toast(messageFromError(error), 'error'); button.disabled = false; button.textContent = 'Analizar mi progreso →'; }
    });
    if (result?.historial.length) projectionChart(root.querySelector('#projection-chart'), result);
  }
  render();
}

function resultHtml(result, percent, current) {
  const prediction = result.prediccion;
  const title = escapeHtml(result.ejercicio);
  const message = escapeHtml(result.mensaje);
  const label = result.estado === 'proyeccion' ? 'PROYECCIÓN ORIENTATIVA' : result.estado === 'datos_insuficientes' ? 'DATOS INSUFICIENTES' : result.estado === 'meta_alcanzada' ? 'META ALCANZADA' : 'TENDENCIA ACTUAL';
  return `<div class="grid grid-two analysis-result">
    <section class="card chart-card wide"><h2>${title}: carga y proyección</h2><p class="muted small">${result.semanas_registradas} semanas registradas${prediction ? ' · tramo estimado' : ''}</p>
      ${result.historial.length ? `<div class="chart-container"><canvas id="projection-chart" role="img" aria-label="Historial de carga y estimación"></canvas></div><p class="chart-caption">Azul: carga registrada. Verde discontinuo: estimación del modelo.</p>` : '<div class="empty">Registra sesiones para mostrar tu historial.</div>'}
    </section>
    <section class="card"><h2>Resultado del modelo</h2><span class="pill ${prediction ? 'amber' : 'green'}">${label}</span>
      ${prediction ? `<div class="result-number">${prediction.semanas_para_meta == null ? `${decimal(prediction.carga_estimada_kg)} kg` : `≈ ${prediction.semanas_para_meta} ${prediction.semanas_para_meta === 1 ? 'semana' : 'semanas'}`}</div>
        <p class="muted small">${prediction.semanas_para_meta == null ? `Carga estimada para la semana del ${shortDate(prediction.proxima_semana)}.` : `para acercarte a la meta de ${decimal(prediction.meta_kg)} kg`}</p>
        <div class="result-details"><div><span>Carga actual</span><strong>${decimal(current)} kg</strong></div>
          ${percent == null ? '' : `<div><span>Avance</span><strong>${percent} %</strong></div>`}
          <div><span>Datos usados</span><strong>${result.semanas_registradas} semanas</strong></div>
          <div><span>Tendencia</span><strong>${decimal(result.pendiente_kg_semana, 2)} kg/semana</strong></div></div>
        <div class="info-box amber" style="margin-top:27px"><strong>${prediction.preliminar ? 'Estimación preliminar' : 'Estimación orientativa'}</strong>La evolución real puede variar; no es una fecha garantizada.</div>` : `<div class="result-details"><div><span>Semanas registradas</span><strong>${result.semanas_registradas}</strong></div>${result.pendiente_kg_semana == null ? '' : `<div><span>Tendencia</span><strong>${decimal(result.pendiente_kg_semana, 2)} kg/semana</strong></div>`}</div>`}
    </section></div><section class="card" style="margin-top:20px"><h2>Sugerencia según tu avance</h2><div class="info-box green"><strong>${prediction ? 'Mensaje de seguimiento' : 'Qué hacer ahora'}</strong>${message}</div></section>`;
}
