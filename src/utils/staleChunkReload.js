// After a deploy, an already-open tab still points at the OLD hashed chunk files
// (e.g. TicketFormPage-abc123.js), which no longer exist on the server — the
// page goes blank with 404s. Vite fires `vite:preloadError` in that case; reload
// once to pick up the new build. The sessionStorage flag prevents a reload loop
// if the 404 is real.
export function reloadOnStaleChunk() {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    try {
      if (sessionStorage.getItem('chunk-reloaded')) return;
      sessionStorage.setItem('chunk-reloaded', '1');
    } catch { /* storage blocked — still reload once below */ }
    window.location.reload();
  });
  // Clear the flag on a healthy load so the next deploy can auto-recover again.
  window.addEventListener('load', () => {
    setTimeout(() => { try { sessionStorage.removeItem('chunk-reloaded'); } catch { /* ignore */ } }, 5000);
  });
}
