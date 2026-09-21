// Two ways people miss in-app notifications: they don't have the browser tab
// focused, or they just don't glance at the bell icon. A short sound plus an
// OS-level desktop notification (which pops up even when the tab is in the
// background or minimized) covers both.

const MUTE_KEY = 'sahyog_notif_muted';

export function isSoundMuted() {
  return localStorage.getItem(MUTE_KEY) === '1';
}

export function setSoundMuted(muted) {
  localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
}

// Synthesized two-note "ding" via Web Audio — no external audio file to host,
// no asset-loading/CORS concerns, works the moment the page loads.
export function playNotificationSound() {
  if (isSoundMuted()) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const playNote = (freq, startAt, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startAt);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + startAt);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startAt);
      osc.stop(ctx.currentTime + startAt + duration);
    };
    playNote(880, 0, 0.18);
    playNote(1174.66, 0.14, 0.22);
    setTimeout(() => ctx.close(), 600);
  } catch {
    // Audio can fail for lots of harmless reasons (autoplay policy before any
    // click on the page, unsupported browser) — never let this break the app.
  }
}

// Ask once per browser (the browser itself remembers the answer). Call this
// from a real user action (e.g. opening the bell) — browsers ignore silent
// permission requests on page load in most cases anyway.
export function requestDesktopPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') Notification.requestPermission().catch(() => {});
}

// Only pop an OS-level alert when the tab isn't the one they're looking at —
// if it's focused, the bell + sound is already enough, a desktop popup on
// top of that is just noise.
export function showDesktopNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (document.visibilityState === 'visible') return;
  try {
    new Notification(title, { body });
  } catch {
    // Some browsers (older mobile Safari, some in-app webviews) throw on
    // `new Notification(...)` even when the API exists — never crash for this.
  }
}
