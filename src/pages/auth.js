import { login, register } from '../api/auth.js';
import { demoMode } from '../api/client.js';
import { messageFromError } from '../utils/format.js';

export function mountAuth(root, onAuthenticated) {
  let mode = 'registro';
  function render() {
    root.innerHTML = `<div class="auth-shell">
      <aside class="auth-aside">
        <a class="brand" href="#/acceso"><span class="brand-mark" aria-hidden="true">+</span>FitAnalytics AI</a>
        <div class="auth-pitch"><h1>Tu entrenamiento, explicado con datos.</h1>
          <ul><li><span class="auth-check">✓</span> Registra sesiones y medidas.</li>
              <li><span class="auth-check">✓</span> Consulta tu progreso en gráficos.</li>
              <li><span class="auth-check">✓</span> Analiza una meta cuando quieras.</li></ul></div>
        <footer>${demoMode ? 'Vista previa · datos ficticios' : 'Tus datos, bajo tu control.'}</footer>
      </aside>
      <main class="auth-main"><section class="card auth-card" aria-labelledby="auth-title">
        <h1 id="auth-title">Accede a FitAnalytics AI</h1>
        <p class="muted">Crea una cuenta o ingresa para continuar.</p>
        <div class="tabs" role="tablist" aria-label="Tipo de acceso">
          <button class="tab" type="button" data-tab="registro" role="tab" aria-selected="${mode === 'registro'}">Crear cuenta</button>
          <button class="tab" type="button" data-tab="ingreso" role="tab" aria-selected="${mode === 'ingreso'}">Iniciar sesión</button>
        </div>
        <form id="auth-form" class="auth-form">
          ${mode === 'registro' ? '<label><span class="label">Nombre</span><input class="field" name="nombre" autocomplete="name" required minlength="2" maxlength="100" placeholder="Tu nombre" /></label>' : ''}
          <label><span class="label">Correo electrónico</span><input class="field" type="email" name="correo" autocomplete="email" required placeholder="tu@correo.com" /></label>
          <label><span class="label">Contraseña</span><input class="field" type="password" name="clave" autocomplete="${mode === 'registro' ? 'new-password' : 'current-password'}" required ${mode === 'registro' ? 'minlength="12"' : ''} placeholder="${mode === 'registro' ? 'Al menos 12 caracteres' : 'Tu contraseña'}" /></label>
          <p class="form-error" id="auth-error" role="alert" hidden></p>
          <button class="button wide" type="submit">${mode === 'registro' ? 'Crear cuenta →' : 'Iniciar sesión →'}</button>
        </form>
        ${demoMode ? '<button class="button secondary wide" type="button" id="demo-access" style="margin-top:14px">Ver ejemplo con 8 semanas ficticias</button>' : ''}
        <p class="auth-hint">${mode === 'registro' ? 'Después completarás tus datos iniciales.' : 'Continúa con tu historial de entrenamiento.'}</p>
      </section></main>
    </div>`;
    root.querySelectorAll('[data-tab]').forEach((tab) => tab.addEventListener('click', () => {
      mode = tab.dataset.tab;
      render();
      root.querySelector('[name="nombre"], [name="correo"]').focus();
    }));
    root.querySelector('#auth-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      const button = form.querySelector('[type="submit"]');
      const errorEl = form.querySelector('#auth-error');
      button.disabled = true; errorEl.hidden = true;
      try {
        const body = { correo: String(data.get('correo')).trim(), clave: String(data.get('clave')) };
        if (mode === 'registro') body.nombre = String(data.get('nombre')).trim();
        const response = mode === 'registro' ? await register(body) : await login(body);
        onAuthenticated(response.usuario);
      } catch (error) {
        errorEl.textContent = messageFromError(error);
        errorEl.hidden = false;
        button.disabled = false;
      }
    });
    root.querySelector('#demo-access')?.addEventListener('click', async (event) => {
      const button = event.currentTarget; button.disabled = true;
      try { onAuthenticated((await login({ correo: 'demo@example.com', clave: 'EjemploSeguro123!' })).usuario); }
      catch (error) { root.querySelector('#auth-error').textContent = messageFromError(error); root.querySelector('#auth-error').hidden = false; button.disabled = false; }
    });
  }
  render();
}
