export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

export function decimal(value, digits = 1) {
  const number = Number(value);
  return Number.isFinite(number)
    ? new Intl.NumberFormat('es-PE', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(number)
    : '—';
}

export function shortDate(value) {
  if (!value) return '—';
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return '—';
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(year, month - 1, day));
}

export function todayLocal() {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
}

export function messageFromError(error) {
  if (typeof error?.detail === 'string') return error.detail;
  if (Array.isArray(error?.detail)) return error.detail.map((item) => item.msg).join(' · ');
  return error?.message || 'No se pudo completar la operación.';
}
