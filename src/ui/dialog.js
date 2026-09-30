import { saveProfile } from '../api/profile.js';
import { escapeHtml, messageFromError } from '../utils/format.js';

export function openProfileDialog(user, onSaved, { mandatory = false } = {}) {
  const backdrop = document.createElement('div');
  backdrop.className = 'dialog-backdrop';
  const weight = user.peso_kg ?? '';
  backdrop.innerHTML = `<section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
    <div class="eyebrow">${mandatory ? 'Antes de comenzar' : 'Tu información'}</div>
    <h2 id="dialog-title">${mandatory ? 'Completa tus datos iniciales' : 'Editar datos personales'}</h2>
    <p>Ingresa tus medidas para calcular el IMC y personalizar tu historial. El IMC es orientativo.</p>
    <form id="profile-dialog-form" class="dialog-form">
      <div class="form-grid">
        <label class="form-field"><span class="label">Edad (18 años o más)</span><input class="field" name="edad" type="number" min="18" max="120" required value="${user.edad ?? ''}" /></label>
        <label class="form-field"><span class="label">Estatura (m)</span><input class="field" name="talla_m" type="number" min="0.8" max="2.5" step="0.01" required value="${user.talla_m ?? ''}" /></label>
        <label class="form-field"><span class="label">Peso actual (kg)</span><input class="field" name="peso_kg" type="number" min="0.01" max="500" step="0.01" required value="${weight}" /></label>
        <label class="form-field full"><span class="label">Objetivo principal</span><input class="field" name="objetivo" minlength="3" maxlength="240" required placeholder="Por ejemplo, mejorar mi fuerza" value="${escapeHtml(user.objetivo ?? '')}" /></label>
      </div>
      <p id="dialog-error" class="form-error" role="alert" hidden></p>
      <div class="dialog-actions">${mandatory ? '' : '<button class="button secondary" type="button" id="dialog-cancel">Cancelar</button>'}<button class="button" type="submit">Guardar datos</button></div>
    </form>
  </section>`;
  document.body.append(backdrop);
  const previousFocus = document.activeElement;
  const close = () => { backdrop.remove(); previousFocus?.focus?.(); };
  if (!mandatory) {
    backdrop.querySelector('#dialog-cancel').addEventListener('click', close);
    backdrop.addEventListener('click', (event) => { if (event.target === backdrop) close(); });
  }
  const keydown = (event) => {
    if (event.key === 'Escape' && !mandatory) close();
    if (event.key === 'Tab') {
      const focusable = [...backdrop.querySelectorAll('input, button')];
      const first = focusable[0]; const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  };
  backdrop.addEventListener('keydown', keydown);
  backdrop.querySelector('input').focus();
  backdrop.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('[type="submit"]');
    const data = new FormData(form);
    const errorEl = form.querySelector('#dialog-error');
    button.disabled = true; errorEl.hidden = true;
    try {
      const updated = await saveProfile({
        edad: Number(data.get('edad')), talla_m: Number(data.get('talla_m')),
        peso_kg: Number(data.get('peso_kg')), objetivo: String(data.get('objetivo')).trim(),
      });
      close();
      onSaved(updated);
    } catch (error) {
      errorEl.textContent = messageFromError(error);
      errorEl.hidden = false;
    } finally { button.disabled = false; }
  });
  return close;
}
