export function toast(message, type = 'info') {
  const region = document.querySelector('#toast-region');
  if (!region) return;
  const item = document.createElement('div');
  item.className = `toast ${type}`;
  item.textContent = message;
  region.append(item);
  setTimeout(() => item.remove(), 4800);
}

export async function submitWithFeedback(button, action, successText) {
  if (button) { button.disabled = true; button.dataset.label ||= button.textContent; button.textContent = 'Guardando…'; }
  try {
    const result = await action();
    if (successText) toast(successText, 'success');
    return result;
  } finally {
    if (button?.isConnected) { button.disabled = false; button.textContent = button.dataset.label; }
  }
}
