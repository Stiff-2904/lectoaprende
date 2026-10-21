/* LectoAprende · música instrumental original.
 * Los navegadores pueden bloquear la reproducción hasta una interacción real.
 * Al producirse el bloqueo mostramos un aviso y reintentamos en el primer toque del juego.
 */
(() => {
  'use strict';
  const button = document.getElementById('music-toggle');
  if (!button) return;
  const notice = document.getElementById('music-help');
  const valid = new Set(['mundo1','mundo2','mundo3','mundo4','mundo5','mundo6','mundo7','mundo8',
    'luna','sapo','semilla','cometa']);
  const settingKey = 'lectoaprende-musica-activada';
  const visitPrefix = 'lectoaprende-musica-ultima-';
  const gentleVolume = 0.38; // Ambiente audible, sin competir con Lito.
  const narratedVolume = 0.075; // Suavizar cuando hay narración.
  let enabled = true;
  try { enabled = localStorage.getItem(settingKey) !== 'false'; }
  catch (_) { /* Audio disponible sin almacenamiento. */ }
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
  let missingFile = false;
  let playbackToken = 0;
  let narrationTimer = null;

  function message(text) {
    if (!notice) return;
    notice.textContent = text || '';
    notice.hidden = !text;
  }
  function refreshButton() {
    if (!enabled) {
      button.textContent = '🎵 Activar música';
      button.setAttribute('aria-pressed','false');
      button.title = 'Activar música de fondo';
      message('');
    } else if (missingFile) {
      button.textContent = '🎵 Reintentar música';
      button.setAttribute('aria-pressed','false');
      button.title = 'Volver a intentar cargar el audio';
      message('No se pudo cargar la pista de este mundo o cuento. Comprueba que la carpeta public/audio/music esté publicada.');
    } else if (blocked || player.paused) {
      button.textContent = '▶️ Iniciar música';
      button.setAttribute('aria-pressed','false');
      button.title = 'Toca para que comience la música';
      message(current ? '🎶 Tu navegador necesita un toque para iniciar el sonido. Pulsa «Iniciar música» o toca cualquier actividad.' : '');
    } else {
      button.textContent = '🔇 Silenciar música';
      button.setAttribute('aria-pressed','true');
      button.title = 'Silenciar la música sin apagar a Lito';
      message('');
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
          missingFile = false;
          refreshButton();
        }).catch(error => {
          if (token !== playbackToken) return;
          blocked = true;
          missingFile = error?.name === 'NotSupportedError';
          refreshButton();
        });
      } else { blocked = false; missingFile = false; refreshButton(); }
    } catch (error) {
      blocked = true;
      missingFile = error?.name === 'NotSupportedError';
      refreshButton();
    }
  }
  function enter(kind, id) {
    const name = kind === 'world' ? `mundo${id}` : kind === 'story' ? String(id) : '';
    if (!valid.has(name)) return;
    const key = visitPrefix + name;
    let previous = 0;
    try { previous = Number(localStorage.getItem(key)) || 0; } catch (_) {}
    const next = previous === 1 ? 2 : 1;
    try { localStorage.setItem(key, String(next)); } catch (_) {}
    playbackToken++;
    player.pause();
    player.src = `/audio/music/${name}-${next}.mp3`;
    player.load();
    player.volume = speaking ? narratedVolume : gentleVolume;
    current = name;
    blocked = false;
    missingFile = false;
    play();
  }
  function onNarrationEnd() {
    speaking = false;
    if (narrationTimer !== null && typeof clearTimeout === 'function') clearTimeout(narrationTimer);
    narrationTimer = null;
    player.volume = gentleVolume;
  }
  function onNarrationStart() {
    speaking = true;
    player.volume = narratedVolume;
    if (narrationTimer !== null && typeof clearTimeout === 'function') clearTimeout(narrationTimer);
    // Salvaguarda: una voz bloqueada nunca deja la música inaudible indefinidamente.
    narrationTimer = typeof setTimeout === 'function' ? setTimeout(onNarrationEnd, 45000) : null;
  }
  button.addEventListener('click', () => {
    if (enabled && !player.paused && !blocked) {
      enabled = false;
      playbackToken++;
      player.pause();
    } else {
      enabled = true;
      blocked = false;
      missingFile = false;
      play();
    }
    try { localStorage.setItem(settingKey, String(enabled)); } catch (_) {}
    refreshButton();
  });
  // Cualquier toque en una actividad también permite iniciar música sin botón adicional.
  // Ignorar el propio botón para no invertir su estado por un doble evento.
  document.addEventListener('click', event => {
    if (button.contains(event.target)) return;
    if (enabled && current && (blocked || player.paused) && !missingFile) play();
  });
  player.addEventListener('error', () => {
    if (!current) return;
    missingFile = true;
    blocked = true;
    refreshButton();
  });
  player.addEventListener('playing', () => {
    blocked = false;
    missingFile = false;
    refreshButton();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { playbackToken++; player.pause(); refreshButton(); }
    else play();
  });
  window.addEventListener('pagehide', () => {
    playbackToken++;
    player.pause();
    if (narrationTimer !== null && typeof clearTimeout === 'function') clearTimeout(narrationTimer);
  });
  window.LectoMusic = { enter, onNarrationStart, onNarrationEnd };
  refreshButton();
})();
