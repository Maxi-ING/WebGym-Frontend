import { getCsrf, demoMode } from './api/client.js';
import { currentUser, logout } from './api/auth.js';
import { shell } from './ui/shell.js';
import { clearCharts } from './ui/charts.js';
import { openProfileDialog } from './ui/dialog.js';
import { toast } from './ui/toast.js';
import { mountAuth } from './pages/auth.js';
import { mountProfile } from './pages/profile.js';
import { mountTraining } from './pages/training.js';
import { mountProgress } from './pages/progress.js';
import { mountAnalysis } from './pages/analysis.js';
import { messageFromError } from './utils/format.js';

const pages = {
  perfil: mountProfile,
  entrenamiento: mountTraining,
  progreso: mountProgress,
  analisis: mountAnalysis,
};

export function startApp(root) {
  let user = null;
  let sequence = 0;
  let closeDialog = null;

  async function render() {
    const call = ++sequence;
    closeDialog?.(); closeDialog = null;
    clearCharts();
    if (!user) {
      document.title = 'Accede | FitAnalytics AI';
      mountAuth(root, (authenticated) => {
        user = authenticated;
        window.location.hash = '#/perfil';
        void render();
      });
      return;
    }
    const requested = window.location.hash.replace(/^#\//, '');
    const active = user.perfil_completo && pages[requested] ? requested : 'perfil';
    document.title = `${active[0].toUpperCase() + active.slice(1)} | FitAnalytics AI`;
    root.innerHTML = shell(user, active);
    const content = root.querySelector('#page-content');
    root.querySelector('#signout').addEventListener('click', async () => {
      try { await logout(); user = null; window.location.hash = '#/acceso'; void render(); }
      catch (error) { toast(messageFromError(error), 'error'); }
    });
    if (!user.perfil_completo) {
      content.innerHTML = '<div class="page-head"><div><h1>Bienvenido a FitAnalytics AI</h1><p>Completa tus datos iniciales para abrir tu perfil.</p></div></div><section class="card"><h2>Tu primer paso</h2><p>Edad, estatura, peso actual y objetivo personal.</p></section>';
      closeDialog = openProfileDialog(user, (updated) => { user = updated; closeDialog = null; void render(); }, { mandatory: true });
      return;
    }
    content.innerHTML = '<div class="loading">Cargando tus datos…</div>';
    try {
      await pages[active](content, {
        user,
        refresh: render,
        onProfileSaved: (updated) => { user = updated; void render(); },
      });
    } catch (error) {
      if (call !== sequence) return;
      if (error.status === 401) { user = null; void render(); return; }
      content.innerHTML = `<section class="card"><h1>No pudimos cargar esta sección</h1><p id="page-error" class="muted"></p><button class="button" id="retry-page" type="button">Reintentar</button></section>`;
      content.querySelector('#page-error').textContent = messageFromError(error);
      content.querySelector('#retry-page').addEventListener('click', () => void render());
    }
  }

  async function bootstrap() {
    root.innerHTML = '<div class="loading">Preparando FitAnalytics AI…</div>';
    try {
      await getCsrf();
      try { user = await currentUser(); }
      catch (error) { if (error.status !== 401) throw error; }
      await render();
    } catch (error) {
      root.innerHTML = `<main class="auth-main" style="min-height:100vh"><section class="card" style="max-width:550px"><h1>Sin conexión con el backend</h1><p id="connection-error" class="muted"></p><p class="small muted">${demoMode ? 'Recarga para abrir la vista previa.' : 'Inicia FastAPI o configura el proxy /api para continuar.'}</p><button id="retry-connection" class="button">Reintentar</button></section></main>`;
      root.querySelector('#connection-error').textContent = messageFromError(error);
      root.querySelector('#retry-connection').addEventListener('click', () => void bootstrap());
    }
  }

  window.addEventListener('hashchange', () => void render());
  void bootstrap();
}
