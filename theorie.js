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
