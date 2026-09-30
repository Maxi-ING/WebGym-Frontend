import { getExercises, getSessions, addSession, removeSession, getGoals, saveGoal } from '../api/training.js';
import { decimal, escapeHtml, messageFromError, shortDate, todayLocal } from '../utils/format.js';
import { toast } from '../ui/toast.js';

export async function mountTraining(root, { refresh }) {
  const [exercises, sessions, goals] = await Promise.all([getExercises(), getSessions(), getGoals()]);
  const options = exercises.map((item) => `<option value="${item.id}">${escapeHtml(item.nombre)}</option>`).join('');
  const recent = sessions.slice(0, 5);
  root.innerHTML = `<div class="page-head"><div><h1>Registra tu entrenamiento</h1><p>Cada sesión alimenta tus gráficos y la tendencia del modelo.</p></div><span class="pill">PASO 2 DE 3</span></div>
    <div class="grid grid-two">
      <section class="card"><div class="card-header"><div><h2>Nueva sesión</h2><p>Completa el ejercicio realizado.</p></div></div>
        <form id="training-form"><div class="form-grid">
          <label><span class="label">Fecha</span><input class="field" type="date" name="fecha" required max="${todayLocal()}" value="${todayLocal()}" /></label>
          <label><span class="label">Ejercicio</span><select class="field" name="ejercicio_id" required>${options}</select></label>
        </div><div class="form-grid three" style="margin-top:20px">
          <label><span class="label">Series</span><input class="field" type="number" name="series" min="1" max="50" required value="3" /></label>
          <label><span class="label">Repeticiones</span><input class="field" type="number" name="repeticiones" min="1" max="100" required value="8" /></label>
          <label><span class="label">Carga (kg)</span><input class="field" type="number" name="carga_kg" min="0" max="1000" step="0.01" required placeholder="40" /></label>
        </div><div class="info-box" style="margin:40px 0"><div class="eyebrow">Resumen de la sesión</div><strong id="volume-preview" style="font-size:1.5rem;color:var(--navy)">— kg</strong><span class="muted small"> de volumen estimado</span><div id="volume-details" class="muted small"></div></div>
        <button class="button wide" type="submit" ${exercises.length ? '' : 'disabled'}>Guardar entrenamiento →</button></form>
      </section>
      <section class="card"><div class="card-header"><div><h2>Historial reciente</h2><p>Sesiones que has registrado</p></div></div>
        ${recent.length ? `<ul class="data-list">${recent.map((s) => `<li><div><strong>${escapeHtml(s.registros.map((r) => r.ejercicio).join(', '))}</strong><small>${shortDate(s.fecha)} · ${s.registros.map((r) => `${r.series} × ${r.repeticiones}`).join(' / ')}</small></div><div class="row"><strong>${decimal(Math.max(...s.registros.map((r) => r.carga_kg)))} kg</strong><button type="button" class="button danger small" data-delete="${s.id}" aria-label="Eliminar sesión de ${shortDate(s.fecha)}">×</button></div></li>`).join('')}</ul>` : '<div class="empty">Aún no hay entrenamientos. Registra tu primera sesión.</div>'}
        <p class="small muted" style="margin-top:20px">${sessions.length} ${sessions.length === 1 ? 'sesión registrada' : 'sesiones registradas'} en tu cuenta.</p>
      </section>
    </div>
    <section class="card" style="margin-top:20px"><div class="card-header"><div><h2>Meta de carga</h2><p>El análisis podrá estimar cuándo alcanzarías esta carga.</p></div></div>
      <form id="goal-form" class="form-grid three"><label><span class="label">Ejercicio</span><select class="field" name="ejercicio_id">${options}</select></label>
        <label><span class="label">Meta (kg)</span><input class="field" type="number" name="carga_objetivo_kg" min="0.01" max="1000" step="0.01" required placeholder="50" /></label>
        <button class="button" style="align-self:end" type="submit" ${exercises.length ? '' : 'disabled'}>Guardar meta</button></form>
      ${goals.length ? `<p class="small muted" style="margin:20px 0 0">Metas actuales: ${goals.map((m) => `${escapeHtml(m.ejercicio)} · ${decimal(m.carga_objetivo_kg)} kg`).join(' · ')}</p>` : ''}
    </section>`;
  const form = root.querySelector('#training-form');
  const preview = () => {
    const data = new FormData(form);
    const count = Number(data.get('series')); const reps = Number(data.get('repeticiones')); const load = Number(data.get('carga_kg'));
    root.querySelector('#volume-preview').textContent = data.get('carga_kg') !== '' && count && reps ? `${decimal(count * reps * load, 0)} kg` : '— kg';
    root.querySelector('#volume-details').textContent = `${count || 0} series × ${reps || 0} repeticiones × ${data.get('carga_kg') || 0} kg`;
  };
  form.addEventListener('input', preview); preview();
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); const data = new FormData(form);
    const button = form.querySelector('[type="submit"]'); button.disabled = true;
    try {
      await addSession({ fecha: data.get('fecha'), registros: [{
        ejercicio_id: Number(data.get('ejercicio_id')), series: Number(data.get('series')),
        repeticiones: Number(data.get('repeticiones')), carga_kg: Number(data.get('carga_kg')),
      }] });
      toast('Entrenamiento guardado.', 'success'); await refresh();
    } catch (error) { toast(messageFromError(error), 'error'); button.disabled = false; }
  });
  root.querySelector('#goal-form').addEventListener('submit', async (event) => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const button = event.currentTarget.querySelector('[type="submit"]'); button.disabled = true;
    try { await saveGoal(Number(data.get('ejercicio_id')), { carga_objetivo_kg: Number(data.get('carga_objetivo_kg')) }); toast('Meta guardada.', 'success'); await refresh(); }
    catch (error) { toast(messageFromError(error), 'error'); button.disabled = false; }
  });
  root.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', async () => {
    if (!confirm('¿Eliminar esta sesión de entrenamiento?')) return;
    button.disabled = true;
    try { await removeSession(button.dataset.delete); toast('Sesión eliminada.', 'success'); await refresh(); }
    catch (error) { toast(messageFromError(error), 'error'); button.disabled = false; }
  }));
}
