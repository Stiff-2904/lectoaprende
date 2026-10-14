(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const sessionKey = 'lectoaprende-session';
  const savedKey = 'lectoaprende-aventuras-v2';
  const voiceKey = 'lectoaprende-voice';
  const modules = ['Letras y sonidos', 'Letras parecidas', 'Construyo sílabas', 'Armo palabras'];
  const sample = '¡Hola, soy Lito! Vamos a aprender jugando. ¡Tú puedes!';
  const hasSpeech = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const spanishVoices = () => hasSpeech ? speechSynthesis.getVoices().filter(v => /^es(?:-|$)/i.test(v.lang)) : [];
  let voiceStatus = null, activeAudio = null, audioController = null, activeAudioUrl = null, speakNumber = 0;
  const choice = () => localStorage.getItem(voiceKey) || 'lito';
  const defaultSave = () => ({ completed: [], stories: [] });
  function stored() {
    try {
      const data = JSON.parse(localStorage.getItem(savedKey) || 'null');
      if (Array.isArray(data?.completed) && Array.isArray(data?.stories)) return data;
    } catch (_) { /* Almacenamiento vacío o incompatible */ }
    return defaultSave();
  }
  function saveActivity(kind, id) {
    const d = stored();
    if (!d[kind].includes(id)) d[kind].push(id);
    localStorage.setItem(savedKey, JSON.stringify(d));
  }
  function starsFor(count) { return count >= 5 ? 3 : count >= 3 ? 2 : count >= 1 ? 1 : 0; }
  function completedCount(moduleId) { return stored().completed.filter(id => id.startsWith(`m${moduleId}-`)).length; }
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
    return voices.find(v => `${v.name}|${v.lang}` === choice()) ||
      [...voices].sort((a,b) => voiceScore(b)-voiceScore(a))[0] || null;
  }
  function stopSound() {
    speakNumber++;
    if (audioController) { audioController.abort(); audioController = null; }
    if (activeAudio) { activeAudio.pause(); activeAudio.removeAttribute('src'); activeAudio = null; }
    if (activeAudioUrl) { URL.revokeObjectURL(activeAudioUrl); activeAudioUrl = null; }
    if (hasSpeech) speechSynthesis.cancel();
  }
  function deviceSpeak(text) {
    if (!hasSpeech) return false;
    const msg = new SpeechSynthesisUtterance(text), selected = preferredVoice();
    if (selected) { msg.voice = selected; msg.lang = selected.lang; }
    else msg.lang = 'es-MX';
    msg.rate = .88; msg.pitch = 1.13; msg.volume = 1;
    speechSynthesis.speak(msg);
    return true;
  }
  async function speak(text) {
    if (!text) return false;
    stopSound();
    animateMascot();
    const requestNumber = speakNumber;
    const clean = text.replace(/[🌟💡🎉✨]/gu,'').trim();
    const status = $('voice-status');
    if (choice() !== 'lito' || !voiceStatus?.configured) {
      const success = deviceSpeak(clean);
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
      if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
      activeAudioUrl = null; activeAudio = null;
      const success = deviceSpeak(clean);
      if (status) status.textContent = success ? 'Se utilizó la voz del dispositivo.' : 'No fue posible reproducir el audio.';
      return success;
    }
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
    if (!r.ok) throw new Error(body.message||body.error||'Error de conexión');
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
    for (let id=1;id<=4;id++) {
      const count=completedCount(id), stars=starsFor(count);
      const progress=$(`map-progress-${id}`);
      if (progress) progress.textContent=`${count}/5 retos · ${'⭐'.repeat(stars)}${'☆'.repeat(3-stars)}`;
      const card=$(`map-card-${id}`);
      if (card) card.classList.toggle('map-done', count===5);
    }
    const s=stored();
    if ($('journey-summary')) $('journey-summary').textContent=`${s.completed.length} de 20 retos superados · ${s.stories.length} de 2 cuentos leídos`;
  }
  async function game() {
    const id=Number(location.pathname.match(/module(\d+)/)?.[1]);
    if (!id || id>4 || !$('options')) return;
    $('title').textContent=modules[id-1];
    $('number').textContent=`Mundo ${id} de 4`;
    let all=[];
    try {all=await api(`/api/modules/${id}/exercises`);await session();}
    catch (_) { $('status').textContent='No se pudo iniciar. Compruebe que el servidor esté funcionando.';return; }
    if (!all.length) { $('status').textContent='No hay retos todavía.'; return; }
    let index=0, busy=false, selected=[], current=null;
    function render() {
      current=all[index]; busy=false; selected=[];
      $('exercise-count').textContent=`Reto ${index+1} de ${all.length}`;
      $('instruction').textContent=current.instruction;
      $('prompt').textContent=current.prompt;
      $('visual-hint').textContent=current.visualHint || '';
      $('visual-hint').hidden=!current.visualHint;
      $('options').replaceChildren();
      $('options').classList.toggle('two',current.options.length===2);
      $('order').textContent='';$('order').classList.add('hide');
      $('retry').classList.add('hide');$('next').classList.add('hide');$('finish').classList.add('hide');
      $('bar').style.width=`${index/all.length*100}%`;
      $('track').setAttribute('aria-valuenow',Math.round(index/all.length*100));
      $('status').textContent='✨ ¡Escucha, observa y elige con calma!';
      $('listen').onclick=()=>speak(current.instruction);
      current.options.forEach(value=>{
        const b=document.createElement('button');b.type='button';b.className='option';b.textContent=value;
        b.setAttribute('aria-label',`Elegir ${value}`); b.onclick=()=>choose(value,b);$('options').append(b);
      });
      $('retry').onclick=()=>{
        busy=false;selected=[];$('retry').classList.add('hide');
        $('order').textContent='';$('order').classList.add('hide');
        $('options').querySelectorAll('button').forEach(b=>{b.disabled=false;b.classList.remove('wrong','correct');});
        $('status').textContent='💛 ¡Puedes volver a intentarlo!';
        speak(current.instruction);
      };
    }
    async function choose(value,btn) {
      if (busy) return;
      if (current.type==='order-syllables') {
        selected.push(value);btn.disabled=true;btn.classList.add('picked');
        $('order').classList.remove('hide');
        $('order').textContent=`Tu palabra: ${selected.join(' – ')}`;
        if (selected.length<current.options.length) return;
      }
      busy=true;
      $('options').querySelectorAll('button').forEach(b=>b.disabled=true);
      try {
        const sid=await session();
        const result=await api(`/api/sessions/${encodeURIComponent(sid)}/attempts`,{
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({moduleId:id,exerciseId:current.id,answer:current.type==='order-syllables'?selected:value})
        });
        $('status').textContent=result.feedback;
        speak(result.feedback);
        if(result.correct){
          saveActivity('completed',current.id); animateMascot('celebrate'); confetti();
          btn.classList.add('correct');
          $('bar').style.width=`${(index+1)/all.length*100}%`;
          $('track').setAttribute('aria-valuenow',Math.round((index+1)/all.length*100));
          if(index===all.length-1){
            $('finish').classList.remove('hide');
            $('status').textContent='🏆 ¡Terminaste todos los retos de este mundo!';
            speak('¡Terminaste esta aventura! Estoy muy orgulloso de tu esfuerzo.');
          } else {$('next').classList.remove('hide');}
        } else {
          btn.classList.add('wrong');$('retry').classList.remove('hide');
        }
      } catch (_) {
        $('status').textContent='No se pudo guardar el intento. Vuelve a intentarlo.';
        $('retry').classList.remove('hide');
      }
    }
    $('next').onclick=()=>{if(index<all.length-1){index++;render();}};
    render();
  }
  async function showProgress() {
    if (!$('cards')) return;
    const save=stored(); const server=await safeSessionRequest('progress');
    let total=0;
    for(let m=1;m<=4;m++) {
      const n=completedCount(m),stars=starsFor(n);total+=stars;
      const item=document.createElement('article');item.className='star-card';
      const h=document.createElement('h3');h.textContent=`${['🌿','🌼','🌊','🏰'][m-1]} ${modules[m-1]}`;
      const p=document.createElement('p');p.className='stars';p.textContent='⭐'.repeat(stars)+'☆'.repeat(3-stars);
      p.setAttribute('aria-label',`${stars} de 3 estrellas`);
      const detail=document.createElement('p');detail.textContent=`${n} de 5 retos superados`;
      const link=document.createElement('a');link.href=`/module${m}`;link.className='navbtn';link.textContent=n===5?'Repetir aventura ↗':'Seguir jugando ↗';
      item.append(h,p,detail,link);$('cards').append(item);
    }
    $('total').textContent=`¡Tienes ${total} de 12 estrellas!`;
    const badges=[
      ...modules.map((title,i)=>({name:`Explorador: ${title}`,icon:['🌿','🌼','🌊','🏰'][i],on:completedCount(i+1)===5})),
      {name:'Lector de la luna',icon:'🌙',on:save.stories.includes('luna')},
      {name:'Amigo de Sapo',icon:'🐸',on:save.stories.includes('sapo')}
    ];
    for(const b of badges){
      const el=document.createElement('div');el.className=`badge-sticker${b.on?' earned':''}`;
      const icon=document.createElement('span');icon.className='sticker-icon';icon.textContent=b.on?b.icon:'🔒';
      const label=document.createElement('span');label.textContent=b.name;
      el.append(icon,label);$('stickers').append(el);
    }
    $('advice').textContent= total===12 ? '¡Increíble! Completaste las cuatro aventuras. ¿Vamos por un cuento?' :
      'Las estrellas aparecen al superar 1, 3 y 5 retos de cada mundo. ¡Cada paso cuenta!';
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
    }
    $('story-prev').onclick=()=>{if(page>0){page--;renderPage();}};
    $('story-next').onclick=()=>{if(page<active.pages.length-1){page++;renderPage();}else quizView();};
    $('story-back').hidden=true;renderPage();
  }
  async function adults() {
    if (!$('adult-summary')) return;
    const summary=await safeSessionRequest('adult-summary');
    const saved=stored();
    $('adult-summary').textContent=`Retos superados en este navegador: ${saved.completed.length}/20 · Cuentos terminados: ${saved.stories.length}/2. `+
      (summary?`Intentos de la sesión actual: ${summary.attempts}; correctos: ${summary.correctAttempts}.`:'Los intentos del servidor se reinician al apagarlo.');
    $('reset').onclick=async()=>{
      if(!confirm('¿Desea borrar los retos y pegatinas guardados en este navegador?'))return;
      const id=sessionStorage.getItem(sessionKey);
      if(id){try{await api(`/api/sessions/${encodeURIComponent(id)}`,{method:'DELETE'});}catch(_){} }
      sessionStorage.removeItem(sessionKey);localStorage.removeItem(savedKey);
      $('adult-summary').textContent='Progreso reiniciado.';
      $('message').textContent='Listo. Se borraron los logros guardados en este navegador.';
    };
  }
  if ($('adventure-map')) updateMenu();
  if ($('options')) game();
  if ($('cards')) showProgress();
  if ($('story-library')) storyMode();
  if ($('adult-summary')) adults();
  const welcome=$('welcome-audio');
  if(welcome)welcome.onclick=()=>speak('¡Hola, amiguito! Soy Lito y te acompaño en esta aventura. ¡Vamos a jugar!');
  const stop=$('stop-audio');if(stop)stop.onclick=stopSound;
  voiceSettings();checkVoiceStatus();
})();
