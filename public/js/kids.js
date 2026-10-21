(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const sessionKey = 'lectoaprende-session';
  const savedKey = 'lectoaprende-aventuras-v2';
  const voiceKey = 'lectoaprende-voice';
  const fallbackVoiceKey = 'lectoaprende-voz-dispositivo';
  const modules = ['Letras y sonidos', 'Letras parecidas', 'Construyo sílabas', 'Armo palabras', 'Detectives de vocales', 'La isla de las rimas', 'La montaña de palmadas', 'La ciudad de las oraciones'];
  const worldIcons = ['🌿','🌼','🌊','🏰','🔍','🎶','👏','🏙️'];
  const storyIds = ['luna','sapo','semilla','cometa'];
  const challengesPerWorld = 5;
  const sample = '¡Hola, soy Lito! Vamos a aprender jugando. ¡Tú puedes!';
  const hasSpeech = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const spanishVoices = () => hasSpeech ? speechSynthesis.getVoices().filter(v => /^es(?:-|$)/i.test(v.lang)) : [];
  let voiceStatus = null, activeAudio = null, audioController = null, activeAudioUrl = null, speakNumber = 0;
  let voiceStatusPromise = null, autoSpeakToken = 0;
  const autoSpoken = new Set();
  const choice = () => localStorage.getItem(voiceKey) || 'lito';
  const defaultSave = () => ({ completed: [], stories: [], attempts: { total: 0, correct: 0 } });
  const validExercise = id => /^m[1-8]-e[1-5]$/.test(id);
  function stored() {
    try {
      const data = JSON.parse(localStorage.getItem(savedKey) || 'null');
      if (data && Array.isArray(data.completed) && Array.isArray(data.stories)) {
        const attempts = data.attempts && typeof data.attempts === 'object' ? data.attempts : {};
        return {
          completed: [...new Set(data.completed.filter(id => typeof id === 'string' && validExercise(id)))],
          stories: [...new Set(data.stories.filter(id => storyIds.includes(id)))],
          attempts: {
            total: Number.isSafeInteger(attempts.total) && attempts.total >= 0 ? attempts.total : 0,
            correct: Number.isSafeInteger(attempts.correct) && attempts.correct >= 0 ? Math.min(attempts.correct, attempts.total || 0) : 0
          }
        };
      }
    } catch (_) { /* Puede estar deshabilitado el almacenamiento del navegador. */ }
    return defaultSave();
  }
  function saveData(data) {
    try { localStorage.setItem(savedKey, JSON.stringify(data)); return true; }
    catch (_) { return false; }
  }
  function saveActivity(kind, id) {
    const d = stored();
    if (!d[kind].includes(id)) d[kind].push(id);
    return saveData(d);
  }
  function saveAttempt(correct) {
    const d = stored();
    d.attempts.total += 1;
    if (correct) d.attempts.correct += 1;
    return saveData(d);
  }
  function starsFor(count) { return count >= 5 ? 3 : count >= 3 ? 2 : count >= 1 ? 1 : 0; }
  function completedCount(moduleId) { return stored().completed.filter(id => id.startsWith(`m${moduleId}-`)).length; }
  // Un mundo sólo se abre tras completar los cinco retos de CADA mundo anterior.
  function worldUnlocked(moduleId) {
    for (let previous=1; previous<moduleId; previous++) if (completedCount(previous)!==challengesPerWorld) return false;
    return true;
  }
  function animateMascot(mood = 'talking') {
    document.querySelectorAll('.mascot,.mini-lito').forEach(el => {
      el.classList.remove('mascot-talking', 'mascot-celebrate');
      void el.offsetWidth;
      el.classList.add(mood === 'celebrate' ? 'mascot-celebrate' : 'mascot-talking');
      setTimeout(() => el.classList.remove('mascot-talking','mascot-celebrate'), 1200);
    });
  }
  function voiceScore(v) {
    const name = v.name.toLowerCase(), lang = v.lang.toLowerCase();
    return (/natural|neural|premium|enhanced|online/.test(name) ? 25 : 0) +
      (/marina|paulina|sabina|helena|monica|mónica|sofia|sofía|dalia|paloma|google español/.test(name) ? 20 : 0) +
      (lang === 'es-cr' ? 8 : lang === 'es-mx' ? 7 : 0);
  }
  function preferredVoice() {
    const voices = spanishVoices();
    const configuredChoice = choice();
    const explicit = voices.find(v => `${v.name}|${v.lang}` === configuredChoice);
    if (explicit) return explicit;
    // Conservar la misma voz del dispositivo entre mundos y entre páginas.
    let remembered = null;
    try { remembered = localStorage.getItem(fallbackVoiceKey); } catch (_) { /* Sin almacenamiento. */ }
    const fixed = voices.find(v => `${v.name}|${v.lang}` === remembered);
    if (fixed) return fixed;
    const best = [...voices].sort((a,b) => voiceScore(b)-voiceScore(a))[0] || null;
    if (best) {
      try { localStorage.setItem(fallbackVoiceKey, `${best.name}|${best.lang}`); }
      catch (_) { /* El lector funciona sin almacenamiento. */ }
    }
    return best;
  }
  function stopSound() {
    window.LectoMusic?.onNarrationEnd();
    autoSpeakToken++;
    speakNumber++;
    if (audioController) { audioController.abort(); audioController = null; }
    if (activeAudio) { activeAudio.pause(); activeAudio.removeAttribute('src'); activeAudio = null; }
    if (activeAudioUrl) { URL.revokeObjectURL(activeAudioUrl); activeAudioUrl = null; }
    if (hasSpeech) speechSynthesis.cancel();
  }
  function deviceSpeak(text, requestNumber) {
    if (!hasSpeech) return false;
    const msg = new SpeechSynthesisUtterance(text), selected = preferredVoice();
    if (selected) { msg.voice = selected; msg.lang = selected.lang; }
    else msg.lang = 'es-MX';
    msg.rate = .88; msg.pitch = 1.13; msg.volume = 1;
    const onFinish = () => { if (requestNumber === speakNumber) window.LectoMusic?.onNarrationEnd(); };
    msg.onend = onFinish;
    msg.onerror = onFinish;
    speechSynthesis.speak(msg);
    return true;
  }
  async function speak(text) {
    if (!text) return false;
    stopSound();
    animateMascot();
    const requestNumber = speakNumber;
    window.LectoMusic?.onNarrationStart();
    const clean = text.replace(/[🌟💡🎉✨]/gu,'').trim();
    const status = $('voice-status');
    if (choice() !== 'lito' || !voiceStatus?.configured) {
      const success = deviceSpeak(clean, requestNumber);
      if (!success) window.LectoMusic?.onNarrationEnd();
      if (!success && status) status.textContent = 'Este dispositivo no puede reproducir audio. Pruebe Chrome o Edge.';
      return success;
    }
    try {
      const controller = new AbortController(); audioController = controller;
      if (status) status.textContent = 'Lito prepara su voz…';
      const response = await fetch('/api/voice/speak', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({text:clean}), signal:controller.signal
      });
      if (!response.ok) throw new Error(`Audio no disponible (${response.status})`);
      const blob = await response.blob();
      if (requestNumber !== speakNumber) return false;
      audioController = null;
      activeAudioUrl = URL.createObjectURL(blob);
      const player = new Audio(activeAudioUrl); activeAudio = player;
      const cleanup = () => {
        if (requestNumber === speakNumber) window.LectoMusic?.onNarrationEnd();
        if (activeAudio === player) {
          activeAudio = null;
          if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
          activeAudioUrl = null;
        }
      };
      player.addEventListener('ended', cleanup, { once:true });
      player.addEventListener('error', cleanup, { once:true });
      await player.play();
      if (status) status.textContent = '🔊 Reproduciendo Marina, la voz infantil de Lito.';
      return true;
    } catch (_) {
      if (requestNumber !== speakNumber) return false;
      audioController = null;
      window.LectoMusic?.onNarrationEnd();
      if (activeAudio) { activeAudio.pause(); activeAudio.removeAttribute('src'); }
      if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
      activeAudioUrl = null; activeAudio = null;
      // Si Marina está activada, no reemplazarla por otra voz inesperada
      // a mitad de un mundo. El botón permite volver a intentarlo.
      const message = '🔊 Lito no pudo hablar ahora. Pulsa «Escuchar a Lito» para reintentar.';
      if (status) status.textContent = message;
      else if ($('status')) $('status').textContent = message;
      else if ($('story-message')) $('story-message').textContent = message;
      return false;
    }
  }
  // Anuncia una sola vez cada reto/página, al entrar, sin requerir pulsar «Escuchar».
  // Las lecturas pendientes se anulan si el niño cambia de página o usa el botón manual.
  function autoSpeakOnce(key, text) {
    if (!text || autoSpoken.has(key)) return;
    autoSpoken.add(key);
    const token=++autoSpeakToken;
    Promise.resolve(voiceStatusPromise).then(() => {
      if (token===autoSpeakToken) return speak(text);
    }).catch(() => { /* El botón manual sigue disponible si falla el audio. */ });
  }
  async function checkVoiceStatus() {
    try {
      const r = await fetch('/api/voice/status',{cache:'no-store'});
      voiceStatus = r.ok ? (await r.json()).data : {configured:false};
    } catch (_) { voiceStatus = { configured:false }; }
    updateVoiceSettings();
  }
  function updateVoiceSettings() {
    const select = $('voice-select'); if (!select) return;
    const value = choice(); select.replaceChildren();
    select.add(new Option('🌈 Lito infantil · Marina (recomendada)','lito'));
    select.add(new Option('🎧 Voz de este dispositivo','auto'));
    for (const v of spanishVoices().sort((a,b)=>voiceScore(b)-voiceScore(a)))
      select.add(new Option(`${v.name} (${v.lang})`,`${v.name}|${v.lang}`));
    select.value = [...select.options].some(o=>o.value===value) ? value : 'lito';
    const status = $('voice-status');
    if (status) status.textContent = voiceStatus?.configured ?
      'Marina está configurada. Pulse «Escuchar prueba» para oírla.' :
      'Para escuchar a Marina, complete la configuración Azure del servidor. Se utiliza la voz del dispositivo mientras tanto.';
    const details = $('voice-setup'); if (details) details.hidden = Boolean(voiceStatus?.configured);
  }
  function voiceSettings() {
    if (!$('voice-select')) return;
    updateVoiceSettings();
    if (hasSpeech) speechSynthesis.addEventListener('voiceschanged',updateVoiceSettings);
    $('voice-select').onchange=()=>{localStorage.setItem(voiceKey,$('voice-select').value);updateVoiceSettings();speak(sample);};
    $('voice-preview').onclick=()=>speak(sample);
    $('voice-auto').onclick=()=>{localStorage.setItem(voiceKey,'lito');updateVoiceSettings();speak(sample);};
  }
  async function api(url,options) {
    const r=await fetch(url,options), body=await r.json();
    if (!r.ok) throw new Error(body.message||body.error?.message||'Error de conexión');
    return body.data;
  }
  async function session() {
    const old = sessionStorage.getItem(sessionKey);
    if (old) {
      try { await api(`/api/sessions/${encodeURIComponent(old)}/progress`); return old; }
      catch (_) { sessionStorage.removeItem(sessionKey); }
    }
    const result = await api('/api/sessions',{method:'POST'});
    sessionStorage.setItem(sessionKey,result.sessionId);
    return result.sessionId;
  }
  async function safeSessionRequest(endpoint) {
    const id = sessionStorage.getItem(sessionKey); if (!id) return null;
    try {return await api(`/api/sessions/${encodeURIComponent(id)}/${endpoint}`);}
    catch (_) { sessionStorage.removeItem(sessionKey); return null; }
  }
  function confetti() {
    const el=$('confetti'); if (!el) return;
    el.replaceChildren();
    for(let i=0;i<20;i++){
      const s=document.createElement('span'); s.className='confetti-piece';
      s.style.setProperty('--x',`${Math.random()*100}%`);
      s.style.setProperty('--delay',`${Math.random()*.7}s`);
      s.style.setProperty('--hue',`${Math.floor(Math.random()*360)}`);
      el.append(s);
    }
    setTimeout(()=>el.replaceChildren(),2600);
  }
  function updateMenu() {
    if (!$('adventure-map')) return;
    for (let id=1;id<=modules.length;id++) {
      const count=completedCount(id), stars=starsFor(count);
      const progress=$(`map-progress-${id}`);
      if (progress) progress.textContent=`${count}/${challengesPerWorld} retos · ${'⭐'.repeat(stars)}${'☆'.repeat(3-stars)}`;
      const card=$(`map-card-${id}`);
      if (card) {
        const unlocked=worldUnlocked(id);
        card.classList.toggle('map-done', count===challengesPerWorld);
        card.classList.toggle('map-locked', !unlocked);
        if (unlocked) {
          card.href=`/module${id}`;
          card.removeAttribute('aria-disabled');
          card.removeAttribute('aria-label');
          card.tabIndex=0;
        } else {
          card.removeAttribute('href');
          card.setAttribute('aria-disabled', 'true');
          card.setAttribute('aria-label', `Mundo ${id} bloqueado. Completa el Mundo ${id-1} y los anteriores.`);
          card.tabIndex=-1;
        }
        const tag=card.querySelector('.pill');
        if (tag) tag.textContent=unlocked ? `Mundo ${id}${count===challengesPerWorld?' · ✅ Completado':''}` : `🔒 Mundo ${id} bloqueado`;
      }
      if (progress && !worldUnlocked(id)) progress.textContent=`🔒 Completa los mundos anteriores para jugar · ${count}/5 retos`;
    }
    const s=stored();
    if ($('journey-summary')) $('journey-summary').textContent=`${s.completed.length} de ${modules.length * challengesPerWorld} retos superados · ${s.stories.length} de ${storyIds.length} cuentos leídos`;
  }
  async function game() {
    const id=Number(location.pathname.match(/module(\d+)/)?.[1]);
    if (!id || id>modules.length || !$('options')) return;
    $('title').textContent=modules[id-1];
    $('number').textContent=`Mundo ${id} de ${modules.length}`;
    if (!worldUnlocked(id)) {
      const required=modules.map((_,i)=>i+1).find(m=>m<modules.length && !worldUnlocked(m+1));
      const previous=Math.min(required || id-1, id-1);
      $('exercise-count').textContent='🔒 Mundo bloqueado';
      $('instruction').textContent=`Para abrir este mundo, termina primero los ${challengesPerWorld} retos del Mundo ${previous}.`;
      $('prompt').textContent='🔒 ¡Sigue tu aventura en orden!';
      $('status').textContent=`Regresa al Mundo ${previous} y completa sus retos para desbloquear el siguiente.`;
      $('visual-hint').hidden=true;
      $('options').replaceChildren();
      $('listen').classList.add('hide');
      $('finish').href=`/module${previous}`;
      $('finish').textContent=`🌟 Jugar Mundo ${previous}`;
      $('finish').classList.remove('hide');
      return;
    }
    let all=[];
    try {all=await api(`/api/modules/${id}/exercises`);await session();}
    catch (_) { $('status').textContent='No se pudo iniciar. Comprueba tu conexión e inténtalo de nuevo.';return; }
    if (!all.length) { $('status').textContent='Este mundo no tiene retos disponibles.'; return; }
    window.LectoMusic?.enter('world', id);
    const replay=new URLSearchParams(location.search).has('repetir');
    const firstPending=()=>all.findIndex(e=>!stored().completed.includes(e.id));
    let index=replay ? 0 : firstPending(), busy=false, selected=[], current=null, nextIndex=null;
    function setBar() {
      const done=replay ? (index<0 ? all.length : index) : all.filter(e=>stored().completed.includes(e.id)).length;
      const percentage=Math.round(done/all.length*100);
      $('bar').style.width=`${percentage}%`;
      $('track').setAttribute('aria-valuenow',percentage);
    }
    function showContinue() {
      $('finish').href=id<modules.length?`/module${id+1}`:'/progress';
      $('finish').textContent=id<modules.length?`➡️ Ir al Mundo ${id+1}`:'🏆 Ver mis premios';
      $('finish').classList.remove('hide');
    }
    function completeWorld() {
      index=-1;
      $('exercise-count').textContent=`${all.length} de ${all.length} retos superados`;
      $('instruction').textContent='¡Completaste los retos de este mundo!';
      $('prompt').textContent='🏆 ¡Aventura terminada!';
      $('visual-hint').hidden=true;
      $('options').replaceChildren();
      $('order').classList.add('hide');
      $('retry').classList.add('hide'); $('next').classList.add('hide');
      showContinue();
      $('repeat').href=`/module${id}?repetir=1`;
      $('repeat').classList.remove('hide');
      $('status').textContent='¡Fantástico! Puedes volver a practicar o ver tus premios.';
      setBar();
    }
    function render() {
      if(index<0) {completeWorld();return;}
      current=all[index];busy=false;selected=[];nextIndex=null;
      $('exercise-count').textContent=`Reto ${index+1} de ${all.length}`;
      $('instruction').textContent=current.instruction;
      $('prompt').textContent=current.prompt;
      $('visual-hint').textContent=current.visualHint || '';
      $('visual-hint').hidden=!current.visualHint;
      $('options').replaceChildren();
      $('options').classList.toggle('two',current.options.length===2);
      $('order').textContent='';$('order').classList.add('hide');
      $('retry').classList.add('hide');$('next').classList.add('hide');$('finish').classList.add('hide');$('repeat').classList.add('hide');
      setBar();
      $('status').textContent='✨ ¡Escucha, observa y elige con calma!';
      $('listen').onclick=()=>speak(current.instruction);
      autoSpeakOnce(`reto-${current.id}`, current.instruction);
      current.options.forEach(value=>{
        const b=document.createElement('button');b.type='button';b.className='option';b.textContent=value;
        b.setAttribute('aria-label',`Elegir ${value}`); b.onclick=()=>choose(value,b);$('options').append(b);
      });
      $('retry').onclick=()=>{
        busy=false;selected=[];$('retry').classList.add('hide');
        $('order').textContent='';$('order').classList.add('hide');
        $('options').querySelectorAll('button').forEach(b=>{
          b.disabled=false;b.classList.remove('wrong','correct','picked');
        });
        $('status').textContent='💛 ¡Puedes volver a intentarlo!';
        $('options').querySelector('button')?.focus();
      };
    }
    async function choose(value,btn) {
      if (busy) return;
      if (current.type==='order-syllables' || current.type==='order-words') {
        selected.push(value);btn.disabled=true;btn.classList.add('picked');
        $('order').classList.remove('hide');
        $('order').textContent=current.type==='order-words'?`Tu oración: ${selected.join(' ')}`:`Tu palabra: ${selected.join(' – ')}`;
        if (selected.length<current.options.length) return;
      } else if (current.type==='build-syllable') {
        const initial=current.prompt.split('+')[0].trim();
        $('order').textContent=`${initial} + ${value} = ${initial}${value}`;
        $('order').classList.remove('hide');
      }
      busy=true;
      $('options').querySelectorAll('button').forEach(b=>b.disabled=true);
      try {
        const sid=await session();
        const result=await api(`/api/sessions/${encodeURIComponent(sid)}/attempts`,{
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({moduleId:id,exerciseId:current.id,answer:['order-syllables','order-words'].includes(current.type)?selected:value})
        });
        saveAttempt(result.correct);
        $('status').textContent=result.feedback;
        if(result.correct){
          saveActivity('completed',current.id);animateMascot('celebrate');confetti();
          btn.classList.add('correct');
          if(['order-syllables','order-words'].includes(current.type)) $('options').querySelectorAll('button').forEach(b=>b.classList.add('correct'));
          nextIndex=replay ? (index+1<all.length?index+1:-1) : firstPending();
          if(nextIndex===-1){
            showContinue();
            $('repeat').href=`/module${id}?repetir=1`;
            $('repeat').classList.remove('hide');
            $('status').textContent='🏆 ¡Terminaste todos los retos de este mundo!';
            speak('¡Terminaste esta aventura! Estoy muy orgulloso de tu esfuerzo.');
          } else { $('next').classList.remove('hide'); speak(result.feedback); }
          const done=replay ? index+1 : all.filter(e=>stored().completed.includes(e.id)).length;
          const pct=Math.round(done/all.length*100);
          $('bar').style.width=`${pct}%`;
          $('track').setAttribute('aria-valuenow',pct);
        } else {
          speak(result.feedback);
          btn.classList.add('wrong');$('retry').classList.remove('hide');
        }
      } catch (_) {
        $('status').textContent='No se pudo guardar el intento. Comprueba la conexión y vuelve a intentarlo.';
        $('retry').classList.remove('hide');
      }
    }
    $('next').onclick=()=>{if(nextIndex!==null){index=nextIndex;render();}};
    render();
  }
  async function showProgress() {
    if (!$('cards')) return;
    const save=stored(); const server=await safeSessionRequest('progress');
    let total=0;
    for(let m=1;m<=modules.length;m++) {
      const n=completedCount(m),stars=starsFor(n);total+=stars;
      const item=document.createElement('article');item.className='star-card';
      const h=document.createElement('h3');h.textContent=`${worldIcons[m-1]} ${modules[m-1]}`;
      const p=document.createElement('p');p.className='stars';p.textContent='⭐'.repeat(stars)+'☆'.repeat(3-stars);
      p.setAttribute('aria-label',`${stars} de 3 estrellas`);
      const detail=document.createElement('p');detail.textContent=`${n} de ${challengesPerWorld} retos superados`;
      const unlocked=worldUnlocked(m);
      const link=document.createElement(unlocked?'a':'span');
      if (unlocked) link.href=`/module${m}${n===challengesPerWorld?'?repetir=1':''}`;
      link.className=unlocked?'navbtn':'navbtn progress-locked';
      link.textContent=unlocked?(n===challengesPerWorld?'Repetir aventura ↗':'Seguir jugando ↗'):`🔒 Completa el Mundo ${m-1}`;
      item.append(h,p,detail,link);$('cards').append(item);
    }
    $('total').textContent=`¡Tienes ${total} de ${modules.length*3} estrellas!`;
    const badges=[
      ...modules.map((title,i)=>({name:`Explorador: ${title}`,icon:worldIcons[i],on:completedCount(i+1)===challengesPerWorld})),
      {name:'Lector de la luna',icon:'🌙',on:save.stories.includes('luna')},
      {name:'Amigo de Sapo',icon:'🐸',on:save.stories.includes('sapo')},
      {name:'Jardinero paciente',icon:'🌱',on:save.stories.includes('semilla')},
      {name:'Amigo que comparte',icon:'🪁',on:save.stories.includes('cometa')}
    ];
    for(const b of badges){
      const el=document.createElement('div');el.className=`badge-sticker${b.on?' earned':''}`;
      const icon=document.createElement('span');icon.className='sticker-icon';icon.textContent=b.on?b.icon:'🔒';
      const label=document.createElement('span');label.textContent=b.name;
      el.append(icon,label);$('stickers').append(el);
    }
    const nextModule=modules.map((_,i)=>i+1).find(m=>completedCount(m)<challengesPerWorld);
    $('advice').textContent= total===modules.length*3 ? '¡Increíble! Completaste los ocho mundos. ¿Vamos por un cuento?' :
      `Las estrellas aparecen al superar 1, 3 y 5 retos. Continúa con ${modules[nextModule-1]}. ¡Cada paso cuenta!`;
    if($('progress-detail')) $('progress-detail').textContent=server?
      'El historial de intentos del servidor es temporal. Tus retos y pegatinas quedan guardados en este navegador.' :
      'Tus retos y pegatinas se guardan en este navegador, sin nombres ni cuentas.';
  }
  async function storyMode() {
    if (!$('story-library')) return;
    let stories=[];
    try {const r=await fetch('/data/stories.json');if(!r.ok)throw Error();stories=await r.json();}
    catch (_) { $('story-message').textContent='No se pudieron cargar los cuentos.';return; }
    const id=new URLSearchParams(location.search).get('cuento');
    const active=stories.find(s=>s.id===id);
    if (!active){
      $('story-library').hidden=false;$('story-reader').hidden=true;
      for(const s of stories){
        const link=document.createElement('a');link.className='story-tile';link.href=`/stories?cuento=${encodeURIComponent(s.id)}`;
        const scene=document.createElement('span');scene.className='story-icon';scene.textContent=s.icon;
        const title=document.createElement('h2');title.textContent=s.title;
        const sub=document.createElement('p');sub.textContent=s.subtitle;
        const state=document.createElement('span');state.className='pill';state.textContent=stored().stories.includes(s.id)?'🏅 Pegatina conseguida':'📖 Leer cuento';
        link.append(scene,title,sub,state);$('story-library').append(link);
      }
      return;
    }
    $('story-library').hidden=true;$('story-reader').hidden=false;
    window.LectoMusic?.enter('story',active.id);
    $('story-title').textContent=active.title;
    $('story-subtitle').textContent=active.subtitle;
    let page=0, quiz=false;
    function renderPage(){
      quiz=false;$('story-quiz').hidden=true;$('story-page').hidden=false;
      const data=active.pages[page];
      $('story-scene').textContent=data.scene;
      $('story-text').textContent=data.text;
      $('page-number').textContent=`Página ${page+1} de ${active.pages.length}`;
      $('story-prev').disabled=page===0;
      $('story-next').textContent=page===active.pages.length-1?'Responder pregunta →':'Siguiente página →';
      $('story-listen').onclick=()=>speak(data.text);
      autoSpeakOnce(`cuento-${active.id}-pagina-${page}`, data.text);
    }
    function quizView(){
      quiz=true;$('story-page').hidden=true;$('story-quiz').hidden=false;
      $('story-question').textContent=active.question;
      $('story-answer-options').replaceChildren();
      $('story-result').textContent='';
      active.answers.forEach((answer,index)=>{
        const b=document.createElement('button');b.className='option answer-tile';b.textContent=answer;b.type='button';
        b.onclick=()=>{
          if(index===active.correctIndex){
            saveActivity('stories',active.id);$('story-result').textContent=active.correctMessage+' 🏅 ¡Ganaste una pegatina!';
            speak(active.correctMessage);animateMascot('celebrate');confetti();
            $('story-answer-options').querySelectorAll('button').forEach(x=>x.disabled=true);
            b.classList.add('correct');$('story-back').hidden=false;
          }else{$('story-result').textContent=active.tryMessage; speak(active.tryMessage);b.classList.add('wrong');}
        };
        $('story-answer-options').append(b);
      });
      $('story-question-listen').onclick=()=>speak(active.question);
      autoSpeakOnce(`cuento-${active.id}-pregunta`, active.question);
    }
    $('story-prev').onclick=()=>{if(page>0){page--;renderPage();}};
    $('story-next').onclick=()=>{if(page<active.pages.length-1){page++;renderPage();}else quizView();};
    $('story-back').hidden=true;renderPage();
  }
  async function adults() {
    if (!$('adult-summary')) return;
    const summary=await safeSessionRequest('adult-summary');
    const saved=stored();
    const completedModules=modules.map((_,i)=>`${modules[i]}: ${completedCount(i+1)}/${challengesPerWorld}`).join(' · ');
    const recommendation=modules.map((_,i)=>i+1).find(m=>completedCount(m)<challengesPerWorld);
    $('adult-summary').textContent=`Retos superados: ${saved.completed.length}/${modules.length*challengesPerWorld}. Cuentos completados: ${saved.stories.length}/${storyIds.length}. `+
      `Intentos registrados en este navegador: ${saved.attempts.total} (${saved.attempts.correct} correctos). `+
      `${completedModules}. `+
      (recommendation?`Siguiente práctica recomendada: ${modules[recommendation-1]}.`:'¡Los ocho mundos están completos!')+
      (summary?` Intentos de la sesión temporal del servidor: ${summary.attempts}.`:'');
    $('reset').onclick=async()=>{
      if(!confirm('¿Desea borrar los retos y pegatinas guardados en este navegador?'))return;
      const id=sessionStorage.getItem(sessionKey);
      if(id){try{await api(`/api/sessions/${encodeURIComponent(id)}`,{method:'DELETE'});}catch(_){} }
      sessionStorage.removeItem(sessionKey);
      try {localStorage.removeItem(savedKey);} catch (_) { $('message').textContent='No se pudo borrar el almacenamiento del navegador.'; return; }
      $('adult-summary').textContent='Progreso reiniciado.';
      $('message').textContent='Listo. Se borraron los logros guardados en este navegador.';
    };
  }
  voiceStatusPromise=checkVoiceStatus();
  if ($('adventure-map')) updateMenu();
  if ($('options')) game();
  if ($('cards')) showProgress();
  if ($('story-library')) storyMode();
  if ($('adult-summary')) adults();
  const welcome=$('welcome-audio');
  if(welcome) {
    const greeting='¡Hola, amiguito! Soy Lito y te acompaño en esta aventura. ¡Vamos a jugar!';
    welcome.onclick=()=>speak(greeting);
    autoSpeakOnce('bienvenida', greeting);
  }
  const stop=$('stop-audio');if(stop)stop.onclick=stopSound;
  voiceSettings();
})();
