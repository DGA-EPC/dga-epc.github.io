/* Script commun des pages de théorie (fichiers *_th.html)
   Bouton « Version papier (PDF) » : toutes les parties l'une après l'autre, puis la fenêtre d'impression.
   Une page peut adapter le comportement en définissant avant ce script un objet PAPER :
     PAPER.count        nombre de positions (par défaut A.length)
     PAPER.stepOf(p)    partie de la position p (par défaut A[p].step)
     PAPER.answer()     donne la bonne réponse à toutes les questions (par défaut : STEPS[..].ph[..].q.ok) */
(function(){
  const P = (typeof PAPER !== 'undefined') ? PAPER : {};
  const count  = P.count  || (() => A.length);
  const stepOf = P.stepOf || (p => A[p].step);
  const answer = P.answer || (() => A.forEach(({step, ph}) => {
    const q = typeof STEPS !== 'undefined' && STEPS[step] && STEPS[step].ph[ph] && STEPS[step].ph[ph].q;
    if (q){ ANS[step] = q.ok; ANS[step + '.' + ph] = q.ok; }
  }));

  const paper = document.createElement('div');
  paper.id = 'paper';
  document.body.appendChild(paper);

  function build(){
    const ANSW = (typeof ANS !== 'undefined') ? ANS : {};   // réponses aux questions (certaines pages n'en ont pas)
    const keepPos = pos, keepAns = {...ANSW};
    answer();
    const parts = [];                                  // {step, texts, title, extra, stage}
    for (let p = 0; p < count(); p++){
      pos = p; render();
      const s = stepOf(p), ex = document.getElementById('explain');
      let part = parts[parts.length - 1];
      if (!part || part.step !== s) parts.push(part = {step: s, texts: []});
      ex.querySelectorAll('.steptext').forEach(t => { if (!part.texts.includes(t.innerHTML)) part.texts.push(t.innerHTML); });
      // la dernière position de la partie donne le titre, les encadrés et la scène complète
      const cl = ex.cloneNode(true);
      const ti = cl.querySelector('.steptitle');
      part.title = ti ? ti.innerHTML : '';
      cl.querySelectorAll('.steptitle,.steptext,.stepno,.progress').forEach(e => e.remove());
      part.extra = cl.innerHTML;
      part.stage = document.querySelector('.stage').innerHTML;
    }
    paper.innerHTML = parts.map(x => `<section class="pstep"><h1>${x.title}</h1>
      <div class="ptext">${x.texts.map(t => `<p>${t}</p>`).join('')}${x.extra}</div>
      <div class="stage">${x.stage}</div></section>`).join('') + `<div class="pfoot">${document.title}</div>`;
    paper.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));   // pas de doublons d'id
    Object.keys(ANSW).forEach(k => delete ANSW[k]); Object.assign(ANSW, keepAns);
    pos = keepPos; render();
  }
  window.buildPaper = build;

  const nav = document.getElementById('quit').closest('.nav');
  const box = document.createElement('div');
  box.className = 'nav exit';
  box.innerHTML = '<button class="btn paper" id="paper-btn">🖨 Version papier (PDF)</button>';
  nav.after(box);
  document.getElementById('paper-btn').addEventListener('click', () => { build(); window.print(); });
  window.addEventListener('afterprint', () => { paper.innerHTML = ''; });
})();

/* Typographie : espace insécable avant les deux-points, pour qu'ils ne partent jamais seuls à la ligne */
(function(){
  const fix = root => {
    if (!root) return;
    if (root.nodeType === 3){ if (root.nodeValue.includes(' :')) root.nodeValue = root.nodeValue.replace(/ :/g, '\u00a0:'); return; }
    if (root.nodeType !== 1 || root.closest('script,style')) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) if (n.nodeValue.includes(' :')) n.nodeValue = n.nodeValue.replace(/ :/g, '\u00a0:');
  };
  fix(document.body);
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(fix))).observe(document.body, {childList:true, subtree:true});
})();

/* Deuxième rangée de barres : aller à la FIN d'une partie, tout complété (bonnes réponses remplies)
   Une page peut la désactiver en définissant FIN_BARS = false avant ce script. */
(function(){
  if (typeof FIN_BARS !== 'undefined' && FIN_BARS === false) return;
  if (typeof A === 'undefined' || !document.getElementById('dots')) return;
  const P = (typeof PAPER !== 'undefined') ? PAPER : {};
  const count  = P.count  || (() => A.length);
  const stepOf = P.stepOf || (p => A[p].step);
  const nSteps = (typeof STEPS !== 'undefined') ? STEPS.length : Math.max(...Array.from({length:count()}, (_,p)=>stepOf(p))) + 1;
  const title = i => (typeof STEPS !== 'undefined' && STEPS[i]) ? STEPS[i].title : (typeof TITLES !== 'undefined' ? TITLES[i] : '');
  const L = i => String.fromCharCode(65+i);
  const answerUpTo = s => {
    if (typeof ANS === 'undefined') return;
    if (P.answer) { P.answer(); return; }
    A.forEach(({step, ph}) => { if (step > s) return;
      const q = typeof STEPS !== 'undefined' && STEPS[step] && STEPS[step].ph[ph] && STEPS[step].ph[ph].q;
      if (q){ ANS[step] = q.ok; ANS[step + '.' + ph] = q.ok; } });
  };
  const row = document.createElement('div');
  row.className = 'dots fin'; row.id = 'dots-fin';
  row.innerHTML = Array.from({length:nSteps}, (_,i)=>`<button class="dot" data-s="${i}" title="${L(i)}. ${title(i)} · tout complété" aria-label="${L(i)}. ${title(i)} · tout complété"></button>`).join('');
  document.getElementById('dots').after(row);
  row.addEventListener('click', e => {
    const b = e.target.closest('.dot'); if (!b) return;
    const s = +b.dataset.s; let last = -1;
    for (let p = 0; p < count(); p++) if (stepOf(p) === s) last = p;
    if (last < 0) return;
    answerUpTo(s); pos = last; render();
  });
})();

/* Raccourcis communs aux pages de théorie
   F : plein écran (comme F11) · S : cacher / afficher la partie gauche · + / − (pavé numérique) : A+ / A−
   1, 2 (3, 4…) : 1re, 2e… réponse de la question à se poser.
   Partie gauche cachée : la question à se poser s'affiche dans un bandeau en bas, avec sa correction après la réponse. */
(function(){
  const aside = document.querySelector('aside'), ex = document.getElementById('explain'),
        zm = document.getElementById('zm'), zp = document.getElementById('zp');
  if (zm) zm.title = 'Réduire la taille (touche −)';
  if (zp) zp.title = 'Agrandir la taille (touche +)';
  if (aside){
    const k = document.createElement('div'); k.className = 'keys';
    k.innerHTML = '<kbd>F</kbd> plein écran &nbsp;·&nbsp; <kbd>S</kbd> masquer la partie gauche';
    aside.append(k);
  }
  const tip = document.createElement('div'); tip.className = 'side-tip';
  tip.innerHTML = '<kbd>S</kbd> afficher la partie gauche';
  document.body.append(tip);
  const bar = document.createElement('div'); bar.className = 'qbar'; bar.hidden = true;
  document.body.append(bar);

  /* ---- La question en cours (dans la partie gauche) ---- */
  const qBox = () => { const c = ex && ex.querySelector('.choices'); return c ? (c.closest('.calc') || c.parentNode) : null; };
  const choices = () => { const q = qBox(); return q ? [...q.querySelectorAll('.ch')] : []; };
  const open = () => choices().some(b => !b.disabled);          // question pas encore répondue

  /* ---- Bandeau ---- */
  let side = true, hold = false, holdT = null, here = '';
  const where = () => {                                          // position dans la page (le texte de l'étape peut changer après la réponse)
    try { if (typeof pos !== 'undefined') return String(pos); } catch(e){}
    const t = ex && ex.querySelector('.steptitle'); return t ? t.textContent : '';
  };
  function update(){
    const w = where(); if (w !== here){ here = w; hold = false; clearTimeout(holdT); }   // on a changé d'étape
    const q = qBox(), show = !side && q && (open() || hold);
    bar.hidden = !show; document.body.classList.toggle('has-qbar', !!show);
    if (!show){ bar.innerHTML = ''; return; }
    const c = q.cloneNode(true);
    c.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
    c.querySelectorAll('.hint').forEach(e=>e.remove());
    bar.innerHTML = ''; bar.append(c);
    if (open()){ const k = document.createElement('div'); k.className = 'qkeys'; const n = choices().length; k.innerHTML = n > 2 ? `Touches <kbd>1</kbd> à <kbd>${n}</kbd> pour répondre.` : 'Touches <kbd>1</kbd> et <kbd>2</kbd> pour répondre.'; bar.append(k); }
  }
  const answered = () => { if (side) return; hold = true; clearTimeout(holdT); holdT = setTimeout(()=>{ hold = false; update(); }, 2500); };
  function answer(i){                                            // i = 0 (gauche), 1 (droite)
    const b = choices().filter(b => !b.disabled)[i]; if (!b) return;
    answered(); b.click();
  }
  bar.addEventListener('click', e => {                           // un bouton du bandeau clique le vrai bouton
    const b = e.target.closest('.ch'); if (!b || b.disabled) return;
    const i = [...bar.querySelectorAll('.ch')].indexOf(b), orig = choices()[i];
    if (orig && !orig.disabled){ answered(); orig.click(); }
  });
  if (ex) new MutationObserver(() => update()).observe(ex, {childList:true, subtree:true});

  /* ---- Partie gauche ---- */
  try { side = localStorage.getItem('theorie-side') !== '0'; } catch(e){}
  const applySide = () => {
    document.body.classList.toggle('noside', !side);
    try { localStorage.setItem('theorie-side', side ? '1' : '0'); } catch(e){}
    update();
    window.dispatchEvent(new Event('resize'));   // les graphiques et lignes du temps se réajustent
  };
  applySide();

  const full = () => {
    if (document.fullscreenElement) document.exitFullscreen && document.exitFullscreen();
    else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(()=>{});
  };

  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;   // on tape dans un champ
    const c = e.code;
    if (c === 'KeyF'){ e.preventDefault(); full(); }
    else if (c === 'KeyS'){ e.preventDefault(); side = !side; applySide(); }
    else if (c === 'NumpadAdd'){ e.preventDefault(); zp && zp.click(); }
    else if (c === 'NumpadSubtract'){ e.preventDefault(); zm && zm.click(); }
    else if (/^(Digit|Numpad)[1-9]$/.test(c)){ const i = +c.slice(-1) - 1; if (choices()[i]){ e.preventDefault(); answer(i); } }
  });
})();
