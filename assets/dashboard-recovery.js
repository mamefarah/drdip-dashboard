(() => {
  function byId(id) {
    return document.getElementById(id);
  }

  function clearFilterControls() {
    document.querySelectorAll('.filters-grid select:not(.locked-select), .filters-grid input').forEach(input => {
      input.value = '';
    });
  }

  function showRecoveryMessage(message) {
    const alert = byId('alert');
    if (!alert) return;
    alert.textContent = message;
    alert.className = 'alert';
    alert.classList.remove('hidden');
    setTimeout(() => alert.classList.add('hidden'), 5000);
  }

  function recoverFilteredData() {
    try {
      if (typeof state === 'undefined' || typeof render !== 'function') return false;
      if (!Array.isArray(state.records)) return false;
      if (!state.records.length) return false;
      if (Array.isArray(state.filtered) && state.filtered.length > 0) return true;

      clearFilterControls();
      state.filtered = [...state.records];
      render();

      const filtered = byId('hdr-filtered');
      if (filtered) filtered.textContent = state.filtered.length.toLocaleString();

      showRecoveryMessage(`Loaded ${state.filtered.length.toLocaleString()} Somali Region records. Filters were reset to show all data.`);
      return true;
    } catch (error) {
      console.warn('Dashboard recovery failed:', error);
      return false;
    }
  }

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (recoverFilteredData() || attempts >= 20) clearInterval(timer);
  }, 500);

  window.addEventListener('focus', recoverFilteredData);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) recoverFilteredData();
  });
})();
