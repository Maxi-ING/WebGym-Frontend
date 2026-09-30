import { Chart, CategoryScale, LinearScale, LineController, LineElement, PointElement, Tooltip, Legend, Filler, BarController, BarElement } from 'chart.js';

Chart.register(CategoryScale, LinearScale, LineController, LineElement, PointElement, Tooltip, Legend, Filler, BarController, BarElement);
const active = new Set();

export function clearCharts() {
  for (const chart of active) chart.destroy();
  active.clear();
}

function line(canvas, labels, datasets, unit) {
  if (!canvas) return;
  const chart = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: datasets.length > 1, position: 'bottom' }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} ${unit}` } } },
      scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 7 } }, y: { beginAtZero: false, ticks: { callback: (value) => `${value} ${unit}` }, grid: { color: '#e7eef5' } } },
    },
  });
  active.add(chart);
}

const series = (label, values, color) => ({ label, data: values, borderColor: color, backgroundColor: color, pointBackgroundColor: 'white', pointBorderWidth: 2.5, pointRadius: 4, tension: .25, borderWidth: 3, spanGaps: false });

export function weightChart(canvas, points) {
  line(canvas, points.map((p) => p.fecha.slice(5)), [series('Peso', points.map((p) => p.peso_kg), '#287bea')], 'kg');
}

export function loadChart(canvas, points) {
  line(canvas, points.map((p) => p.fecha.slice(5)), [series('Carga máxima', points.map((p) => p.carga_kg), '#139a78')], 'kg');
}

export function projectionChart(canvas, result) {
  const history = result.historial;
  const forecast = result.prediccion;
  const labels = history.map((p) => p.semana.slice(5));
  const observed = history.map((p) => p.carga_kg);
  const projected = Array(history.length).fill(null);
  if (forecast) {
    labels.push(forecast.proxima_semana.slice(5));
    observed.push(null);
    projected[history.length - 1] = history.at(-1).carga_kg;
    projected.push(forecast.carga_estimada_kg);
    if (forecast.semanas_para_meta > 1 && forecast.semana_meta_estimada) {
      labels.push(forecast.semana_meta_estimada.slice(5));
      observed.push(null);
      projected.push(forecast.meta_kg);
    }
  }
  const datasets = [series('Registrado', observed, '#287bea')];
  if (forecast) datasets.push({ ...series('Estimación', projected, '#119a79'), borderDash: [7, 5] });
  line(canvas, labels, datasets, 'kg');
}
