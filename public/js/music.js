/* LectoAprende · música instrumental original, sin servicios externos.
 * Cada mundo y cada cuento tiene 2 arreglos que se alternan entre visitas.
 * El volumen baja automáticamente cuando habla Lito.
 */
(() => {
  'use strict';
  const button = document.getElementById('music-toggle');
  if (!button) return;
  const valid = new Set(['mundo1','mundo2','mundo3','mundo4','mundo5','mundo6','mundo7','mundo8',
    'luna','sapo','semilla','cometa']);
  const settingKey = 'lectoaprende-musica-activada';
  const visitPrefix = 'lectoaprende-musica-ultima-';
  const gentleVolume = 0.18;
  const narratedVolume = 0.025;
  let enabled = true;
  try { enabled = localStorage.getItem(settingKey) !== 'false'; }
  catch (_) { /* El audio funciona sin almacenamiento. */ }
  if (typeof Audio !== 'function') {
    button.disabled = true;
    button.textContent = '🎵 Música no disponible';
    return;
  }
  const player = new Audio();
  player.loop = true;
  player.preload = 'auto';
  player.volume = gentleVolume;
  let current = null;
  let speaking = false;
  let blocked = false;
  let playbackToken = 0;

  function refreshButton() {
    if (!enabled) {
      button.textContent = '🎵 Activar música';
      button.setAttribute('aria-pressed','false');
      button.title = 'Activar música de fondo';
    } else if (blocked || player.paused) {
      button.textContent = '🎵 Activar música';
      button.setAttribute('aria-pressed','false');
      button.title = 'El navegador puede requerir que pulses aquí para iniciar el sonido';
    } else {
      button.textContent = '🔇 Silenciar música';
      button.setAttribute('aria-pressed','true');
      button.title = 'Silenciar la música sin apagar la voz de Lito';
    }
  }
  function play() {
    if (!current || !enabled || document.hidden) { refreshButton(); return; }
    const token = ++playbackToken;
    try {
      const promise = player.play();
      if (promise && typeof promise.then === 'function') {
        promise.then(() => {
          if (token !== playbackToken) return;
          blocked = false;
          refreshButton();
        }).catch(() => {
          if (token !== playbackToken) return;
          blocked = true;
          refreshButton();
        });
      } else { blocked = false; refreshButton(); }
    } catch (_) { blocked = true; refreshButton(); }
  }
  function enter(kind, id) {
    const name = kind === 'world' ? `mundo${id}` : kind === 'story' ? String(id) : '';
    if (!valid.has(name)) return;
    const key = visitPrefix + name;
    let previous = 0;
    try { previous = Number(localStorage.getItem(key)) || 0; } catch (_) {}
    const next = previous === 1 ? 2 : 1;
    try { localStorage.setItem(key,String(next)); } catch (_) {}
    playbackToken++;
    player.pause();
    player.src = `/audio/music/${name}-${next}.mp3`;
    player.load();
    player.volume = speaking ? narratedVolume : gentleVolume;
    current = name;
    blocked = false;
    play();
  }
  function onNarrationStart() {
    speaking = true;
    player.volume = narratedVolume;
  }
  function onNarrationEnd() {
    speaking = false;
    player.volume = gentleVolume;
  }
  button.addEventListener('click', () => {
    if (enabled && !player.paused && !blocked) {
      enabled = false;
      playbackToken++;
      player.pause();
    } else {
      enabled = true;
      blocked = false;
      play();
    }
    try { localStorage.setItem(settingKey, String(enabled)); } catch (_) {}
    refreshButton();
  });
  player.addEventListener('error', () => { blocked = true; refreshButton(); });
  player.addEventListener('playing', () => { blocked = false; refreshButton(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { playbackToken++; player.pause(); refreshButton(); }
    else play();
  });
  window.addEventListener('pagehide', () => { playbackToken++; player.pause(); });
  window.LectoMusic = { enter, onNarrationStart, onNarrationEnd };
  refreshButton();
})();
