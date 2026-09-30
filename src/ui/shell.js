import { escapeHtml } from '../utils/format.js';
import { demoMode } from '../api/client.js';

const sections = [
  ['perfil', 'Perfil'], ['entrenamiento', 'Entrenamiento'],
  ['progreso', 'Progreso'], ['analisis', 'Análisis'],
];

export function shell(user, active) {
  const label = sections.find(([key]) => key === active)?.[1] || 'Tu perfil';
  const name = escapeHtml(user.nombre);
  const navigation = sections.map(([key, title], index) => `
    <a class="nav-link" href="#/${key}" ${key === active ? 'aria-current="page"' : ''}>
      <span class="nav-number">${String(index + 1).padStart(2, '0')}</span>${title}
    </a>`).join('');

  return `<div class="shell">
    <aside class="sidebar">
      <a class="brand" href="#/perfil"><span class="brand-mark" aria-hidden="true">+</span>FitAnalytics</a>
      <div class="brand-subtitle">Tu progreso, en datos</div>
      <nav class="nav-list" aria-label="Secciones">${navigation}</nav>
      <div class="sidebar-bottom"><div class="avatar" aria-hidden="true">${name.slice(0, 1).toUpperCase()}</div><div><strong>${name}</strong><span>${demoMode ? 'Vista de ejemplo' : 'Cuenta personal'}</span></div></div>
      <button id="signout" class="sidebar-signout" type="button">Cerrar sesión</button>
    </aside>
    <div class="workspace">
      <header class="topbar"><div><div class="eyebrow">FitAnalytics AI</div><p class="topbar-label">${label}</p></div>
        <span class="topbar-status">${demoMode ? 'Vista previa · datos ficticios' : 'Tu historial personal'}</span>
      </header>
      <main class="content" id="page-content" tabindex="-1" aria-live="polite"></main>
    </div>
  </div>`;
}
