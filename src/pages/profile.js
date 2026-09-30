import { getProfile, getMeasurements, addMeasurement } from '../api/profile.js';
import { openProfileDialog } from '../ui/dialog.js';
import { toast } from '../ui/toast.js';
import { decimal, escapeHtml, messageFromError, shortDate, todayLocal } from '../utils/format.js';

export async function mountProfile(root, { user, onProfileSaved }) {
  const [profile, measurements] = await Promise.all([getProfile(), getMeasurements()]);
  root.innerHTML = `<div class="page-head"><div><h1>Tu perfil</h1><p>Tus datos iniciales, medidas y objetivo en un solo lugar.</p></div><span class="pill">PERFIL</span></div>
    <div class="grid grid-two">
      <section class="card"><div class="card-header"><h2>Datos personales</h2><button class="button secondary small" id="edit-profile">EDITAR DATOS</button></div>
        <hr class="divider" /><div class="profile-fields two">
          <div><div class="metric-label">Nombre</div><strong>${escapeHtml(profile.nombre)}</strong></div>
          <div><div class="metric-label">Correo</div><strong>${escapeHtml(profile.correo)}</strong></div>
        </div><hr class="divider" /><div class="profile-fields">
          <div><div class="metric-label">Edad</div><strong>${profile.edad} años</strong></div>
          <div><div class="metric-label">Estatura</div><strong>${decimal(profile.talla_m, 2)} m</strong></div>
          <div><div class="metric-label">Peso actual</div><strong>${decimal(profile.peso_kg)} kg</strong></div>
        </div><hr class="divider" /><div class="metric-label">Objetivo principal</div><strong>${escapeHtml(profile.objetivo)}</strong>
      </section>
      <section class="card"><h2>Indicador corporal</h2><p class="muted small">IMC de referencia</p>
        <div class="metric-value" style="color:var(--blue);font-size:3rem">${decimal(profile.imc)}</div>
        <p class="muted small">Calculado con ${decimal(profile.peso_kg)} kg y ${decimal(profile.talla_m, 2)} m.</p>
        <div class="info-box" style="margin-top:35px"><strong>Información orientativa</strong>No sustituye una evaluación profesional de salud.</div>
      </section>
    </div>
    <div class="grid grid-even" style="margin-top:20px">
      <section class="card"><h2>Registrar peso</h2><p class="muted small">Añade una medición para ver su evolución.</p>
        <form id="measurement-form" class="form-grid"><label><span class="label">Fecha</span><input class="field" type="date" name="fecha" required max="${todayLocal()}" value="${todayLocal()}" /></label>
          <label><span class="label">Peso (kg)</span><input class="field" type="number" name="peso_kg" min="0.01" max="500" step="0.01" required placeholder="80" /></label>
          <button class="button" type="submit">Guardar medición</button></form>
      </section>
      <section class="card"><h2>Mediciones recientes</h2>
        ${measurements.length ? `<ul class="data-list">${measurements.slice(-3).reverse().map((m) => `<li><span>${shortDate(m.fecha)}</span><strong>${decimal(m.peso_kg)} kg</strong></li>`).join('')}</ul>` : '<div class="empty">Tu primera medición se registrará al completar el perfil.</div>'}
      </section>
    </div>
    <section class="card" style="margin-top:20px"><h2>Tus siguientes pasos</h2><ol class="steps-list"><li>Registra tu entrenamiento y la carga usada.</li><li>Visualiza gráficos cuando acumules datos.</li><li>Pulsa Analizar cuando quieras generar una proyección.</li></ol></section>`;
  root.querySelector('#edit-profile').addEventListener('click', () => openProfileDialog(profile, onProfileSaved));
  root.querySelector('#measurement-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('[type="submit"]'); button.disabled = true;
    const data = new FormData(form);
    try {
      await addMeasurement({ fecha: data.get('fecha'), peso_kg: Number(data.get('peso_kg')) });
      toast('Medición guardada.', 'success');
      onProfileSaved(await getProfile());
    } catch (error) { toast(messageFromError(error), 'error'); button.disabled = false; }
  });
}
