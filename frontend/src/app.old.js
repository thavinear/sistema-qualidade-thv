/* App module extracted from original sistema-qualidade.html
   Kept functions as-is and exposed needed handlers on window to preserve
   inline `onclick`/`oninput` usages. */

/* ===================== SISTEMA INTEGRADO DE GESTAO DA QUALIDADE ===================== */

const STORE_KEY = 'sgq_senac_v1';

function loadDB(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return {
    problems: [],
    pareto: [],
    ishikawa: {problema:'', cats:{metodo:[],maquina:[],medida:[],meioAmbiente:[],maoDeObra:[],materiaPrima:[]}},
    whys: {problema:'', chain:[]},
    flow: [],
    w2h: []
  };
}
let DB = loadDB();
function saveDB(){ localStorage.setItem(STORE_KEY, JSON.stringify(DB)); }
function uid(){ return 'id'+Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

function toast(msg){
  const t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=>t.classList.remove('show'), 2600);
}

/* ---------------- NAV / TABS ---------------- */
function setActiveView(viewName){
  const btns = document.querySelectorAll('nav.tabs button[data-view]');
  btns.forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewName));

  document.querySelectorAll('section.view').forEach(section => {
    section.classList.toggle('active', section.id === `view-${viewName}`);
  });

  if(viewName === 'dashboard') renderDashboard();
  if(viewName === 'pareto') renderParetoChart();
  if(viewName === 'reports') renderReport();
}

document.addEventListener('DOMContentLoaded', ()=>{
  const tabNav = document.getElementById('tabNav');
  if(tabNav) tabNav.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-view]');
    if(!btn) return;
    setActiveView(btn.dataset.view);
  });

  const hdr = document.getElementById('hdrDate');
  if(hdr) hdr.textContent = new Date().toLocaleDateString('pt-BR');
});

/* ===================== MATRIZ GUT ===================== */
function gutAddRow(){
  const id = uid();
  DB.problems.push({id, nome:'', g:3,u:3,t:3});
  saveDB();
  gutRender();
  // focus the newly created input
  setTimeout(()=>{
    const body = document.getElementById('gutBody');
    const input = body && body.querySelector(`tr[data-id="${id}"] input[type=text]`);
    if(input) input.focus();
  }, 50);
}
function gutUpdate(id, field, val){
  const p = DB.problems.find(x=>x.id===id); if(!p) return;
  p[field] = (field==='nome') ? val : Number(val);
  saveDB();
  // update only the UI parts that depend on the changed data
  const row = document.querySelector(`#gutBody tr[data-id="${id}"]`);
  if(row) updateGutRowUI(row, p);
}
function gutRemove(id){
  DB.problems = DB.problems.filter(x=>x.id!==id);
  saveDB(); gutRender();
}
function updateGutRowUI(row, p){
  const score = p.g*p.u*p.t;
  const scoreTd = row.querySelector('.gut-score');
  if(scoreTd) scoreTd.textContent = score;
  const stamp = row.querySelector('.stamp');
  if(stamp){
    let cls='lo'; if(score>=64) cls='hi'; else if(score>=27) cls='mid';
    stamp.className = 'stamp ' + cls;
    stamp.textContent = cls==='hi'?'Crítico':cls==='mid'?'Atenção':'Baixo';
  }
}
function gutRender(){
  const body = document.getElementById('gutBody');
  const empty = document.getElementById('gutEmpty');
  if(!body) return;
  const sorted = [...DB.problems].sort((a,b)=> (b.g*b.u*b.t)-(a.g*a.u*a.t));
  if(empty) empty.style.display = sorted.length? 'none':'block';
  body.innerHTML = '';
  sorted.forEach(p=>{
    const tr = document.createElement('tr');
    tr.dataset.id = p.id;

    // name cell
    const tdName = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Descreva o problema';
    input.value = p.nome || '';
    input.addEventListener('input', (e)=> gutUpdate(p.id, 'nome', e.target.value));
    tdName.appendChild(input);
    tr.appendChild(tdName);

    // selects for g,u,t
    ['g','u','t'].forEach(key=>{
      const td = document.createElement('td');
      const sel = document.createElement('select');
      [1,2,3,4,5].forEach(v=>{ const opt = document.createElement('option'); opt.value = v; opt.text = v; if(p[key]==v) opt.selected = true; sel.appendChild(opt); });
      sel.addEventListener('change', (e)=> gutUpdate(p.id, key, e.target.value));
      td.appendChild(sel);
      tr.appendChild(td);
    });

    // score
    const tdScore = document.createElement('td'); tdScore.className = 'gut-score'; tdScore.textContent = p.g*p.u*p.t; tr.appendChild(tdScore);

    // priority stamp
    const tdStamp = document.createElement('td');
    const span = document.createElement('span');
    span.className = 'stamp ' + ( (p.g*p.u*p.t)>=64 ? 'hi' : ( (p.g*p.u*p.t)>=27 ? 'mid' : 'lo') );
    span.textContent = ( (p.g*p.u*p.t)>=64 ? 'Crítico' : ( (p.g*p.u*p.t)>=27 ? 'Atenção' : 'Baixo') );
    tdStamp.appendChild(span); tr.appendChild(tdStamp);

    // actions
    const tdAct = document.createElement('td');
    const btn = document.createElement('button'); btn.className = 'small-icon-btn'; btn.title = 'Remover'; btn.textContent = '🗑';
    btn.addEventListener('click', ()=> gutRemove(p.id));
    tdAct.appendChild(btn); tr.appendChild(tdAct);

    body.appendChild(tr);
  });
}

/* ===================== PARETO ===================== */
let paretoChartObj = null;
function paretoAddRow(){
  DB.pareto.push({id:uid(), causa:'', freq:0});
  saveDB(); paretoRender();
}
function paretoUpdate(id, field, val){
  const p = DB.pareto.find(x=>x.id===id); if(!p) return;
  p[field] = field==='freq' ? Number(val) : val;
  saveDB(); paretoRender();
}
function paretoRemove(id){
  DB.pareto = DB.pareto.filter(x=>x.id!==id);
  saveDB(); paretoRender();
}
function paretoRender(){
  const body = document.getElementById('paretoBody');
  const empty = document.getElementById('paretoEmpty');
  if(empty) empty.style.display = DB.pareto.length? 'none':'block';
  if(!body) return;
  body.innerHTML = DB.pareto.map(p=>`<tr>
    <td><input type="text" value="${escapeAttr(p.causa)}" placeholder="Causa ou defeito" oninput="paretoUpdate('${p.id}','causa',this.value)"></td>
    <td><input type="number" min="0" value="${p.freq}" oninput="paretoUpdate('${p.id}','freq',this.value)"></td>
    <td><button class="small-icon-btn" title="Remover" onclick="paretoRemove('${p.id}')">🗑</button></td>
  </tr>`).join('');
  renderParetoChart();
}
function renderParetoChart(){
  const canvas = document.getElementById('paretoChart');
  if(!canvas || typeof Chart==='undefined') return;
  const data = [...DB.pareto].filter(p=>p.causa).sort((a,b)=>b.freq-a.freq);
  const total = data.reduce((s,p)=>s+p.freq,0) || 1;
  let acc = 0;
  const acumulado = data.map(p=>{ acc += p.freq; return +(acc/total*100).toFixed(1); });
  const ctx = canvas.getContext('2d');
  if(paretoChartObj) paretoChartObj.destroy();
  paretoChartObj = new Chart(ctx, {
    data:{
      labels: data.map(p=>p.causa),
      datasets:[
        {type:'bar', label:'Frequência', data:data.map(p=>p.freq), backgroundColor:'#00457c', yAxisID:'y', order:2},
        {type:'line', label:'% Acumulado', data:acumulado, borderColor:'#f47b20', backgroundColor:'#f47b20', yAxisID:'y1', tension:.25, order:1, pointRadius:3},
        {type:'line', label:'Linha 80%', data:data.map(()=>80), borderColor:'#b3382c', borderDash:[6,4], pointRadius:0, yAxisID:'y1', order:0}
      ]
    },
    options:{
      responsive:true,
      interaction:{mode:'index', intersect:false},
      scales:{
        y:{position:'left', title:{display:true,text:'Frequência'}},
        y1:{position:'right', min:0, max:100, grid:{drawOnChartArea:false}, title:{display:true,text:'% acumulado'}}
      },
      plugins:{legend:{position:'bottom', labels:{boxWidth:12,font:{size:11}}}}
    }
  });
}

/* ===================== ISHIKAWA ===================== */
const ISHI_CATS = [
  ['metodo','Método'],['maquina','Máquina'],['medida','Medida'],
  ['meioAmbiente','Meio Ambiente'],['maoDeObra','Mão de Obra'],['materiaPrima','Matéria-Prima']
];
function ishiSaveProblema(){
  const el = document.getElementById('ishiProblema'); if(!el) return;
  DB.ishikawa.problema = el.value;
  saveDB();
}
function ishiAddItem(cat, inputEl){
  const val = inputEl.value.trim();
  if(!val) return;
  DB.ishikawa.cats[cat].push({id:uid(), texto:val});
  inputEl.value='';
  saveDB(); ishiRender();
}
function ishiRemoveItem(cat, id){
  DB.ishikawa.cats[cat] = DB.ishikawa.cats[cat].filter(i=>i.id!==id);
  saveDB(); ishiRender();
}
function ishiRender(){
  const el = document.getElementById('ishiProblema'); if(el) el.value = DB.ishikawa.problema || '';
  const wrap = document.getElementById('ishiCats');
  if(!wrap) return;
  wrap.innerHTML = ISHI_CATS.map(([key,label])=>{
    const items = DB.ishikawa.cats[key] || [];
    return `<div class="ishi-cat">
      <h5>${label}</h5>
      <ul>${items.map(i=>`<li><span>${escapeHtml(i.texto)}</span><button class="small-icon-btn" onclick="ishiRemoveItem('${key}','${i.id}')">🗑</button></li>`).join('') || '<li style="color:#93a2b0;border:none;">Nenhuma causa ainda</li>'}</ul>
      <div class="add-row">
        <input type="text" placeholder="Adicionar causa..." onkeydown="if(event.key==='Enter'){ishiAddItem('${key}',this)}">
        <button class="btn small ghost" onclick="ishiAddItem('${key}', this.previousElementSibling)">+</button>
      </div>
    </div>`;
  }).join('');
}

/* ===================== 5 PORQUES ===================== */
function whySaveProblema(){
  const el = document.getElementById('whyProblema'); if(!el) return;
  DB.whys.problema = el.value; saveDB();
}
function whyUpdate(idx, val){ DB.whys.chain[idx].resposta = val; saveDB(); whyRender(); }
function whyAddNext(){ if(DB.whys.chain.length>=5) return; DB.whys.chain.push({pergunta:'Por quê?', resposta:''}); saveDB(); whyRender(); }
function whyRemoveFrom(idx){ DB.whys.chain = DB.whys.chain.slice(0, idx); saveDB(); whyRender(); }
function whySendToAction(){
  const causaRaiz = DB.whys.chain.length ? DB.whys.chain[DB.whys.chain.length-1].resposta : '';
  if(!causaRaiz){ toast('Preencha a cadeia de porquês antes de enviar.'); return; }
  DB.w2h.push({id:uid(), what:'Eliminar causa raiz: '+causaRaiz, why:DB.whys.problema||'Investigação dos 5 Porquês', where:'', who:'', when:'', how:'', howmuch:'', status:'A iniciar', origem:'5 Porquês'});
  saveDB();
  toast('Causa raiz enviada para o Plano 5W2H.');
}
function whyRender(){
  const el = document.getElementById('whyProblema'); if(el) el.value = DB.whys.problema || '';
  const wrap = document.getElementById('whyChain'); if(!wrap) return;
  if(!DB.whys.chain.length){
    wrap.innerHTML = `<div class="empty">Nenhum "por quê" registrado ainda.</div><div style="margin-top:14px;"><button class="btn orange" onclick="whyAddNext()">+ Perguntar "Por quê?"</button></div>`;
    return;
  }
  let html = DB.whys.chain.map((w,idx)=>`
    <div class="why-step">
      <div class="why-num">${idx+1}</div>
      <div class="why-body">
        <label>Por quê? (nível ${idx+1})</label>
        <input type="text" value="${escapeAttr(w.resposta)}" placeholder="Responda para liberar o próximo nível" oninput="whyUpdate(${idx}, this.value)">
        ${idx===DB.whys.chain.length-1 ? `<button class="btn small ghost" onclick="whyRemoveFrom(${idx})">Desfazer este nível</button>` : ''}
      </div>
    </div>`).join('');
  wrap.innerHTML = html;
  const last = DB.whys.chain[DB.whys.chain.length-1];
  const canAdvance = last.resposta && last.resposta.trim().length>0;
  if(DB.whys.chain.length<5 && canAdvance){ wrap.innerHTML += `<div style="margin:12px 0;"><button class="btn orange" onclick="whyAddNext()">+ Perguntar novamente "Por quê?"</button></div>`; }
  if(canAdvance){
    wrap.innerHTML += `<div class="card" style="background:#e7f5ee;border-color:#1f7a4d;"><h3 style="color:#1f7a4d;border:none;">Causa raiz identificada</h3><p style="margin:0 0 12px;font-size:13.5px;">${escapeHtml(last.resposta)}</p><button class="btn orange" onclick="whySendToAction()">Enviar causa raiz para o 5W2H →</button></div>`;
  }
}

/* ===================== 5W2H ===================== */
function w2hAddRow(){ DB.w2h.push({id:uid(), what:'', why:'', where:'', who:'', when:'', how:'', howmuch:'', status:'A iniciar', origem:'Manual'}); saveDB(); w2hRender(); }
function w2hSyncResponsibleFilter(){
  const whoSel = document.getElementById('w2hFilterWho');
  if(!whoSel) return;
  const currentWho = whoSel.value || '';
  const whos = [...new Set(DB.w2h.map(r=>r.who).filter(Boolean))];
  const nextValue = whos.includes(currentWho) ? currentWho : '';
  whoSel.innerHTML = '<option value="">Todos</option>' + whos.map(w=>`<option value="${escapeAttr(w)}" ${w===nextValue?'selected':''}>${escapeHtml(w)}</option>`).join('');
  whoSel.value = nextValue;
}
function w2hUpdate(id, field, val){
  const r = DB.w2h.find(x=>x.id===id); if(!r) return;
  r[field] = val;
  saveDB();
  if(field === 'who') w2hSyncResponsibleFilter();
}
function w2hRemove(id){ DB.w2h = DB.w2h.filter(x=>x.id!==id); saveDB(); w2hRender(); }
function w2hRender(){
  const body = document.getElementById('w2hBody'); if(!body) return;
  const empty = document.getElementById('w2hEmpty');
  w2hSyncResponsibleFilter();
  const fWho = document.getElementById('w2hFilterWho') ? document.getElementById('w2hFilterWho').value : '';
  const fStatus = document.getElementById('w2hFilterStatus') ? document.getElementById('w2hFilterStatus').value : '';
  const list = DB.w2h.filter(r => (!fWho || r.who===fWho) && (!fStatus || r.status===fStatus));
  if(empty) empty.style.display = list.length? 'none':'block';
  const statusOpts = s => ['A iniciar','Em andamento','Concluído','Atrasado'].map(o=>`<option ${o===s?'selected':''}>${o}</option>`).join('');
  body.innerHTML = list.map(r=>`<tr>
    <td><input type="text" value="${escapeAttr(r.what)}" oninput="w2hUpdate('${r.id}','what',this.value)"></td>
    <td><input type="text" value="${escapeAttr(r.why)}" oninput="w2hUpdate('${r.id}','why',this.value)"></td>
    <td><input type="text" value="${escapeAttr(r.where)}" oninput="w2hUpdate('${r.id}','where',this.value)"></td>
    <td><input type="text" value="${escapeAttr(r.who)}" oninput="w2hUpdate('${r.id}','who',this.value)"></td>
    <td><input type="date" value="${escapeAttr(r.when)}" oninput="w2hUpdate('${r.id}','when',this.value)"></td>
    <td><input type="text" value="${escapeAttr(r.how)}" oninput="w2hUpdate('${r.id}','how',this.value)"></td>
    <td><input type="text" value="${escapeAttr(r.howmuch)}" placeholder="R$" oninput="w2hUpdate('${r.id}','howmuch',this.value)"></td>
    <td><select onchange="w2hUpdate('${r.id}','status',this.value)">${statusOpts(r.status)}</select></td>
    <td><button class="small-icon-btn" onclick="w2hRemove('${r.id}')" title="Remover">🗑</button></td>
  </tr>`).join('');
}

/* ===================== FLUXOGRAMA + POP + CHECKLIST ===================== */
function flowAddStep(){
  const nome = prompt('Nome da etapa do processo:');
  if(!nome) return;
  const responsavel = prompt('Responsável pela etapa:') || '';
  const decisao = confirm('Esta etapa envolve uma tomada de decisão? (OK = sim / Cancelar = não)');
  DB.flow.push({
    id: uid(), nome, responsavel, decisao,
    pop: {empresa:'SENAC', codigo:'', versao:'01', dataEmissao:new Date().toISOString().slice(0,10), objetivo:'', referencias:'', descricao:'', historico:''},
    checklist: []
  });
  saveDB(); flowRender();
}
function flowRemoveStep(id, ev){ ev.stopPropagation(); if(!confirm('Remover esta etapa e todo o POP/Checklist vinculado?')) return; DB.flow = DB.flow.filter(f=>f.id!==id); saveDB(); flowRender(); }
function flowRender(){
  const track = document.getElementById('flowTrack'); if(!track) return;
  let html = '';
  DB.flow.forEach((step, idx)=>{
    const conf = checklistConformity(step);
    const hasNC = step.checklist.some(c=>c.status==='nao');
    html += `<div class="flow-step ${step.decisao?'decision':''}" onclick="openStation('${step.id}')">
      <span class="step-idx">${step.decisao? '◇ DECISÃO':'ETAPA '+(idx+1)}</span>
      <div class="step-name">${escapeHtml(step.nome)}</div>
      <div class="step-resp">${escapeHtml(step.responsavel||'Sem responsável')}</div>
      <div class="step-badges">
        ${conf!==null?`<span class="pill" style="padding:1px 6px;">${conf}%</span>`:''}
        ${hasNC?'<span class="badge-dot" style="background:#b3382c;" title="Não conformidade em aberto"></span>':''}
      </div>
      <button class="small-icon-btn" style="position:absolute;top:6px;right:6px;" onclick="flowRemoveStep('${step.id}', event)">✕</button>
    </div>`;
    if(idx < DB.flow.length-1) html += `<div class="flow-arrow"></div>`;
  });
  if(DB.flow.length) html += `<div class="flow-arrow"></div>`;
  html += `<div class="flow-add" onclick="flowAddStep()">+ Nova etapa</div>`;
  track.innerHTML = html;
}
function checklistConformity(step){ const relevant = step.checklist.filter(c=>c.status==='ok'||c.status==='nao'); if(!relevant.length) return null; const ok = relevant.filter(c=>c.status==='ok').length; return Math.round(ok/relevant.length*100); }

let currentStationId = null; let currentSub = 'pop';
function openStation(id){
  currentStationId = id; currentSub = 'pop';
  const step = DB.flow.find(f=>f.id===id); if(!step) return;
  const st = document.getElementById('stationTitle'); if(st) st.textContent = 'Estação: ' + step.nome;
  const overlay = document.getElementById('overlay'); if(overlay) overlay.classList.add('open');
  const panel = document.getElementById('stationPanel'); if(panel) panel.classList.add('open');
  document.querySelectorAll('.panel-subtabs button').forEach(b=>b.classList.toggle('active', b.dataset.sub==='pop'));
  document.getElementById('sub-pop').classList.add('active');
  document.getElementById('sub-checklist').classList.remove('active');
  renderPOP(step); renderChecklist(step);
}
function closeStation(){ const ov=document.getElementById('overlay'); if(ov) ov.classList.remove('open'); const pan=document.getElementById('stationPanel'); if(pan) pan.classList.remove('open'); currentStationId = null; flowRender(); renderDashboard(); }
function stationSubtab(sub){ currentSub = sub; document.querySelectorAll('.panel-subtabs button').forEach(b=>b.classList.toggle('active', b.dataset.sub===sub)); document.getElementById('sub-pop').classList.toggle('active', sub==='pop'); document.getElementById('sub-checklist').classList.toggle('active', sub==='checklist'); }

function popUpdate(field, val){ const step = DB.flow.find(f=>f.id===currentStationId); if(!step) return; step.pop[field] = val; saveDB(); }
function renderPOP(step){
  const p = step.pop; const sub = document.getElementById('sub-pop'); if(!sub) return;
  sub.innerHTML = `
    <div class="pop-doc">
      <div class="pop-doc-head">
        <div class="titleblock">
          <small>Procedimento Operacional Padrão</small>
          <div style="font-family:var(--display);font-size:17px;font-weight:600;color:var(--blue-900);margin-top:4px;">${escapeHtml(step.nome)}</div>
        </div>
        <div class="meta">
          <div><span>Empresa</span><input type="text" style="width:120px;padding:2px 5px;" value="${escapeAttr(p.empresa)}" onchange="popUpdate('empresa',this.value)"></div>
          <div><span>Código</span><input type="text" style="width:120px;padding:2px 5px;" placeholder="POP-001" value="${escapeAttr(p.codigo)}" onchange="popUpdate('codigo',this.value)"></div>
          <div><span>Versão</span><input type="text" style="width:120px;padding:2px 5px;" value="${escapeAttr(p.versao)}" onchange="popUpdate('versao',this.value)"></div>
          <div><span>Emissão</span><input type="date" style="width:120px;padding:2px 5px;" value="${escapeAttr(p.dataEmissao)}" onchange="popUpdate('dataEmissao',this.value)"></div>
        </div>
      </div>
      <div class="pop-section">
        <label>Objetivo</label>
        <textarea placeholder="Para que serve este procedimento?" onchange="popUpdate('objetivo',this.value)">${escapeHtml(p.objetivo)}</textarea>
      </div>
      <div class="pop-section">
        <label>Documentos de referência</label>
        <textarea placeholder="Leis, normas, manuais..." onchange="popUpdate('referencias',this.value)">${escapeHtml(p.referencias)}</textarea>
      </div>
      <div class="pop-section">
        <label>Descrição do passo a passo</label>
        <textarea style="min-height:120px;" placeholder="O que fazer, como fazer e quem faz..." onchange="popUpdate('descricao',this.value)">${escapeHtml(p.descricao)}</textarea>
      </div>
      <div class="pop-section">
        <label>Gestão de mudanças / histórico de revisões</label>
        <textarea placeholder="Data - o que mudou - aprovado por..." onchange="popUpdate('historico',this.value)">${escapeHtml(p.historico)}</textarea>
      </div>
    </div>
    <div style="margin-top:14px;" class="no-print">
      <button class="btn ghost" onclick="window.print()">🖨 Exportar / Imprimir POP (PDF)</button>
    </div>
  `;
}

function checklistAddItem(){ const step = DB.flow.find(f=>f.id===currentStationId); if(!step) return; const texto = document.getElementById('newChecklistItem').value.trim(); if(!texto) return; step.checklist.push({id:uid(), texto, status:'', obs:'', foto:''}); saveDB(); renderChecklist(step); }
function checklistSetStatus(itemId, status){ const step = DB.flow.find(f=>f.id===currentStationId); if(!step) return; const item = step.checklist.find(i=>i.id===itemId); if(!item) return; item.status = status; saveDB(); renderChecklist(step); }
function checklistSetObs(itemId, val){ const step = DB.flow.find(f=>f.id===currentStationId); if(!step) return; const item = step.checklist.find(i=>i.id===itemId); if(!item) return; item.obs = val; saveDB(); }
function checklistSetFoto(itemId, files){ const step = DB.flow.find(f=>f.id===currentStationId); if(!step) return; const item = step.checklist.find(i=>i.id===itemId); if(!item) return; item.foto = files && files[0] ? files[0].name : ''; saveDB(); renderChecklist(step); }
function checklistRemoveItem(itemId){ const step = DB.flow.find(f=>f.id===currentStationId); if(!step) return; step.checklist = step.checklist.filter(i=>i.id!==itemId); saveDB(); renderChecklist(step); }
function checklistSendToAction(itemId){ const step = DB.flow.find(f=>f.id===currentStationId); if(!step) return; const item = step.checklist.find(i=>i.id===itemId); if(!item) return; DB.w2h.push({ id:uid(), what:'Corrigir não conformidade: '+item.texto, why:item.obs||'Item reprovado no checklist', where:step.nome, who:step.responsavel||'', when:'', how:'', howmuch:'', status:'A iniciar', origem:'Checklist' }); saveDB(); toast('Ação corretiva registrada no 5W2H.'); }
function checklistSendToGUT(itemId){ const step = DB.flow.find(f=>f.id===currentStationId); if(!step) return; const item = step.checklist.find(i=>i.id===itemId); if(!item) return; DB.problems.push({id:uid(), nome:'['+step.nome+'] '+item.texto, g:4,u:4,t:3}); saveDB(); toast('Desvio registrado na Matriz GUT para priorização.'); }
function renderChecklist(step){
  const conf = checklistConformity(step);
  const wrap = document.getElementById('sub-checklist'); if(!wrap) return;
  let html = `<div class="conf-meter"><div style="flex:none;"><div class="stat-label" style="color:var(--ink-soft);font-size:11px;text-transform:uppercase;">Conformidade</div><div class="pct">${conf===null? '—' : conf+'%'}</div></div><div class="bar"><div class="bar-fill" style="width:${conf||0}%;"></div></div></div>`;
  html += step.checklist.map(item=>`
    <div class="check-item">
      <div class="ci-top">
        <div class="ci-text">${escapeHtml(item.texto)}</div>
        <div class="ci-options">
          <button class="ok ${item.status==='ok'?'sel':''}" onclick="checklistSetStatus('${item.id}','ok')">Conforme</button>
          <button class="no ${item.status==='nao'?'sel':''}" onclick="checklistSetStatus('${item.id}','nao')">Não conforme</button>
          <button class="na ${item.status==='na'?'sel':''}" onclick="checklistSetStatus('${item.id}','na')">N/A</button>
        </div>
        <button class="small-icon-btn" onclick="checklistRemoveItem('${item.id}')">🗑</button>
      </div>
      ${item.status==='nao' ? `
        <div class="ci-just">
          <label>Justificativa (obrigatória)</label>
          <textarea placeholder="Descreva o desvio observado" onchange="checklistSetObs('${item.id}',this.value)">${escapeHtml(item.obs)}</textarea>
          <div style="display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap;">
            <label style="margin:0;"><input type="file" accept="image/*" style="width:auto;" onchange="checklistSetFoto('${item.id}', this.files)"></label>
            ${item.foto? `<span class="pill">📎 ${escapeHtml(item.foto)}</span>` : ''}
            <button class="btn small orange" onclick="checklistSendToAction('${item.id}')">Abrir ação no 5W2H</button>
            <button class="btn small ghost" onclick="checklistSendToGUT('${item.id}')">Registrar na Matriz GUT</button>
          </div>
        </div>` : ''}
    </div>`).join('');

  html += `<div style="display:flex;gap:8px;margin-top:6px;"><input type="text" id="newChecklistItem" placeholder="Novo item de verificação..." onkeydown="if(event.key==='Enter'){checklistAddItem()}"><button class="btn orange" style="flex:none;" onclick="checklistAddItem()">+ Item</button></div>`;
  if(!step.checklist.length){
    html = `<div class="empty" style="margin-bottom:14px;">Nenhum item de verificação cadastrado ainda.</div><div style="display:flex;gap:8px;"><input type="text" id="newChecklistItem" placeholder="Novo item de verificação..." onkeydown="if(event.key==='Enter'){checklistAddItem()}"><button class="btn orange" style="flex:none;" onclick="checklistAddItem()">+ Item</button></div>`;
  }
  wrap.innerHTML = html;
}

/* ===================== DASHBOARD PDCA ===================== */
function renderDashboard(){
  const elPlan = document.getElementById('pdcaPlanStat'); if(elPlan) elPlan.textContent = DB.problems.length;
  const topProblems = [...DB.problems].sort((a,b)=>(b.g*b.u*b.t)-(a.g*a.u*a.t)).slice(0,3);
  const elTop = document.getElementById('pdcaPlanTop'); if(elTop) elTop.innerHTML = topProblems.length ? topProblems.map(p=>`<li>${escapeHtml(p.nome||'(sem nome)')} — score ${p.g*p.u*p.t}</li>`).join('') : '<li>Nenhum problema priorizado ainda</li>';
  const elDo = document.getElementById('pdcaDoStat'); const total = DB.w2h.length; const done = DB.w2h.filter(r=>r.status==='Concluído').length; if(elDo) elDo.textContent = total ? Math.round(done/total*100)+'%' : '0%';
  const elDoList = document.getElementById('pdcaDoList'); const byStatus = {}; DB.w2h.forEach(r=>{ byStatus[r.status] = (byStatus[r.status]||0)+1; }); if(elDoList) elDoList.innerHTML = total ? Object.entries(byStatus).map(([s,c])=>`<li>${s}: ${c}</li>`).join('') : '<li>Nenhuma ação cadastrada no 5W2H</li>';
  const elCheck = document.getElementById('pdcaCheckStat'); const confs = DB.flow.map(checklistConformity).filter(c=>c!==null); const avgConf = confs.length ? Math.round(confs.reduce((a,b)=>a+b,0)/confs.length) : null; if(elCheck) elCheck.textContent = avgConf===null ? '—' : avgConf+'%';
  const elCheckList = document.getElementById('pdcaCheckList'); if(elCheckList) elCheckList.innerHTML = DB.flow.length ? DB.flow.map(s=>{ const c=checklistConformity(s); return `<li>${escapeHtml(s.nome)}: ${c===null?'sem checklist':c+'%'}</li>`; }).join('') : '<li>Nenhuma etapa cadastrada no fluxograma</li>';
  const elAct = document.getElementById('pdcaActStat'); let ncCount = 0; const ncList = []; DB.flow.forEach(s=>{ s.checklist.filter(c=>c.status==='nao').forEach(c=>{ ncCount++; ncList.push(s.nome+': '+c.texto); }); }); if(elAct) elAct.textContent = ncCount; const elActList = document.getElementById('pdcaActList'); if(elActList) elActList.innerHTML = ncList.length ? ncList.slice(0,4).map(t=>`<li>${escapeHtml(t)}</li>`).join('') : '<li>Nenhuma não conformidade em aberto</li>';
}

/* ===================== HELPERS ===================== */
function escapeHtml(str){ return String(str||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function escapeAttr(str){ return escapeHtml(str); }

/* ===================== INIT ===================== */
function initAll(){ gutRender(); paretoRender(); ishiRender(); whyRender(); w2hRender(); flowRender(); renderDashboard(); }

/* ===================== REPORTS / PDF GENERATION ===================== */
function renderReport(){
  // prepare form defaults
  const dateEl = document.getElementById('reportDate'); if(dateEl && !dateEl.value) dateEl.value = new Date().toISOString().slice(0,10);
  const previewCard = document.getElementById('reportPreviewCard'); if(previewCard) previewCard.style.display = 'none';
}

function buildReportHtml(opts){
  // opts contains selections and metadata
  const title = escapeHtml(opts.title || 'Relatório de análise');
  const owner = escapeHtml(opts.owner || '');
  const sector = escapeHtml(opts.sector || '');
  const date = escapeHtml(opts.date || new Date().toISOString().slice(0,10));
  const problem = escapeHtml(opts.problem || '');
  const notes = escapeHtml(opts.notes || '');

  let html = `<div class="r-doc">
    <div class="r-header"><div style="text-align:center"><h1>SISTEMA INTEGRADO DE GESTÃO DA QUALIDADE</h1><h2>RELATÓRIO DE ANÁLISE DA QUALIDADE</h2></div>
      <div style="margin-top:12px;padding:10px 6px;border-radius:6px;background:#f8f9fb;border:1px solid #eef3f6">
        <strong>Título:</strong> ${title}<br>
        <strong>Responsável:</strong> ${owner} &nbsp; • &nbsp; <strong>Setor:</strong> ${sector} &nbsp; • &nbsp; <strong>Data:</strong> ${date}
      </div>
    </div>`;

  html += `<div class="report-section"><h4>1. Descrição do problema</h4><div>${problem || '<em>Sem descrição fornecida.</em>'}</div></div>`;

  // GUT
  if(opts.incGUT){
    html += `<div class="report-section report-gut"><h4>2. Matriz GUT</h4>`;
    if(DB.problems && DB.problems.length){
      const sorted = [...DB.problems].sort((a,b)=> (b.g*b.u*b.t)-(a.g*a.u*a.t));
      html += `<table><thead><tr><th>Problema</th><th>G</th><th>U</th><th>T</th><th>Score</th><th>Prioridade</th></tr></thead><tbody>`;
      sorted.forEach(p=>{ const score = p.g*p.u*p.t; const pr = score>=64? 'Crítico' : score>=27? 'Atenção' : 'Baixo'; html += `<tr><td>${escapeHtml(p.nome||'')}</td><td>${p.g}</td><td>${p.u}</td><td>${p.t}</td><td>${score}</td><td>${pr}</td></tr>`; });
      html += `</tbody></table>`;
    } else html += '<div class="empty">Nenhum problema cadastrado.</div>';
    html += `</div>`;
  }

  // Pareto: include canvas image placeholder
  if(opts.incPareto){
    html += `<div class="report-section"><h4>3. Pareto</h4><div id="reportParetoWrap">`;
    // if a canvas exists, clone it
    const pc = document.getElementById('paretoChart');
    if(pc){ html += `<div style="max-width:520px;margin:8px 0;"><canvas id="reportParetoCanvas" width="${pc.width}" height="${pc.height}"></canvas></div>`; }
    else html += '<div class="empty">Gráfico não disponível.</div>';
    html += `</div></div>`;
  }

  // Ishikawa
  if(opts.incIshi){
    html += `<div class="report-section"><h4>4. Diagrama de Ishikawa</h4>`;
    const ish = DB.ishikawa || {problema:'',cats:{}};
    html += `<div><strong>Problema:</strong> ${escapeHtml(ish.problema||'')}</div>`;
    html += `<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:8px">`;
    Object.entries(ish.cats || {}).forEach(([k,arr])=>{ html += `<div style="min-width:140px"><strong>${escapeHtml(k)}</strong><ul>${(arr||[]).map(i=>`<li>${escapeHtml(i.texto)}</li>`).join('')||'<li>-</li>'}</ul></div>`; });
    html += `</div></div>`;
  }

  // 5 Porquês
  if(opts.incWhys){
    html += `<div class="report-section"><h4>5. 5 Porquês</h4>`;
    if(DB.whys && DB.whys.chain && DB.whys.chain.length){ html += `<ol>` + DB.whys.chain.map(w=>`<li>${escapeHtml(w.resposta)}</li>`).join('') + `</ol>`; }
    else html += '<div class="empty">Nenhuma cadeia de porquês registrada.</div>';
    html += `</div>`;
  }

  // 5W2H
  if(opts.incW2H){
    html += `<div class="report-section"><h4>6. 5W2H</h4>`;
    if(DB.w2h && DB.w2h.length){ html += `<table><thead><tr><th>O quê</th><th>Por quê</th><th>Onde</th><th>Quem</th><th>Quando</th><th>Como</th><th>Quanto</th></tr></thead><tbody>`;
      DB.w2h.forEach(r=>{ html += `<tr><td>${escapeHtml(r.what)}</td><td>${escapeHtml(r.why)}</td><td>${escapeHtml(r.where)}</td><td>${escapeHtml(r.who)}</td><td>${escapeHtml(r.when)}</td><td>${escapeHtml(r.how)}</td><td>${escapeHtml(r.howmuch)}</td></tr>`; });
      html += `</tbody></table>`;
    } else html += '<div class="empty">Nenhuma ação cadastrada.</div>';
    html += `</div>`;
  }

  // Fluxograma
  if(opts.incFlow){
    html += `<div class="report-section"><h4>7. Fluxograma</h4>`;
    if(DB.flow && DB.flow.length){ html += `<ol>` + DB.flow.map(s=>`<li><strong>${escapeHtml(s.nome)}</strong> — ${escapeHtml(s.responsavel||'')}</li>`).join('') + `</ol>`; }
    else html += '<div class="empty">Nenhuma etapa cadastrada.</div>';
    html += `</div>`;
  }

  html += `<div class="report-section"><h4>8. Observações / Conclusão</h4><div>${notes || '<em>Sem observações.</em>'}</div></div>`;

  html += `<div class="report-footer"><div>Sistema Integrado de Gestão da Qualidade</div><div class="page-num">Página 1 de 1</div></div>`;

  html += `</div>`;
  return html;
}

function renderReportPreview(){
  const opts = {
    title: document.getElementById('reportTitle')?.value,
    owner: document.getElementById('reportOwner')?.value,
    sector: document.getElementById('reportSector')?.value,
    date: document.getElementById('reportDate')?.value,
    problem: document.getElementById('reportProblem')?.value,
    notes: document.getElementById('reportNotes')?.value,
    incGUT: !!document.getElementById('incGUT')?.checked,
    incPareto: !!document.getElementById('incPareto')?.checked,
    incIshi: !!document.getElementById('incIshi')?.checked,
    incWhys: !!document.getElementById('incWhys')?.checked,
    incW2H: !!document.getElementById('incW2H')?.checked,
    incFlow: !!document.getElementById('incFlow')?.checked
  };
  const preview = document.getElementById('reportPreview'); if(!preview) return;
  preview.innerHTML = buildReportHtml(opts);

  // If pareto chart selected, clone canvas data into preview canvas
  if(opts.incPareto){
    const src = document.getElementById('paretoChart');
    const dst = document.getElementById('reportParetoCanvas');
    if(src && dst){ try{ dst.getContext('2d').drawImage(src,0,0, dst.width, dst.height); }catch(e){}
    }
  }

  const previewCard = document.getElementById('reportPreviewCard'); if(previewCard) previewCard.style.display = '';
  // scroll to preview
  setTimeout(()=>{ previewCard.scrollIntoView({behavior:'smooth'}); }, 60);
}

async function generateReportPDF(){
  const preview = document.getElementById('reportPreview'); if(!preview){ toast('Gere a pré-visualização antes de exportar.'); return; }
  // use html2canvas + jspdf
  try{
    const { jsPDF } = window.jspdf || {};
    if(!window.html2canvas || !jsPDF){ toast('Bibliotecas de PDF não carregadas.'); return; }

    // clone preview to avoid on-screen effects
    const clone = preview.cloneNode(true);
    clone.style.width = '800px'; clone.style.padding='18px'; clone.style.background='#fff';
    document.body.appendChild(clone); // temporarily attach
    const canvas = await window.html2canvas(clone, {scale:2, useCORS:true, backgroundColor:'#ffffff'});
    document.body.removeChild(clone);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p','pt','a4');
    const margin = 40; const pageWidth = pdf.internal.pageSize.getWidth(); const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - margin*2; const imgHeight = canvas.height * imgWidth / canvas.width;

    // if image fits on one page
    if(imgHeight <= pageHeight - margin*2){
      pdf.addImage(imgData,'PNG',margin,margin,imgWidth,imgHeight);
    } else {
      // slice in canvas-space
      const scale = imgWidth / canvas.width;
      const pageHeightPx = Math.floor((pageHeight - margin*2) / scale);
      let sY = 0;
      while(sY < canvas.height){
        const sliceH = Math.min(pageHeightPx, canvas.height - sY);
        const tmp = document.createElement('canvas'); tmp.width = canvas.width; tmp.height = sliceH;
        const tctx = tmp.getContext('2d'); tctx.drawImage(canvas, 0, sY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        const img = tmp.toDataURL('image/png');
        const h = sliceH * scale;
        pdf.addImage(img,'PNG',margin,margin,imgWidth,h);
        sY += sliceH;
        if(sY < canvas.height) pdf.addPage();
      }
    }

    // file name
    const title = document.getElementById('reportTitle')?.value || 'relatorio-qualidade';
    const date = (document.getElementById('reportDate')?.value || new Date().toISOString().slice(0,10)).replaceAll('-','');
    const safe = title.replace(/[^a-z0-9\-_]/gi,'-').toLowerCase();
    const fname = `relatorio-${safe}-${date}.pdf`;
    pdf.save(fname);
  }catch(e){ console.error(e); toast('Erro ao gerar PDF: '+(e.message||e)); }
}


// expose functions used inline in templates to window so behavior is preserved
const _exports = [
  'gutAddRow','gutUpdate','gutRemove','gutRender',
  'paretoAddRow','paretoUpdate','paretoRemove','paretoRender','renderParetoChart',
  'ishiSaveProblema','ishiAddItem','ishiRemoveItem','ishiRender',
  'whySaveProblema','whyUpdate','whyAddNext','whyRemoveFrom','whySendToAction','whyRender',
  'w2hAddRow','w2hUpdate','w2hRemove','w2hRender',
  'flowAddStep','flowRemoveStep','flowRender','openStation','closeStation','stationSubtab',
  'popUpdate','renderPOP','checklistAddItem','checklistSetStatus','checklistSetObs','checklistSetFoto','checklistRemoveItem','checklistSendToAction','checklistSendToGUT','renderChecklist',
  'renderDashboard','toast','initAll','uid','saveDB','loadDB','escapeHtml','escapeAttr'
];
_exports.push('renderReport','renderReportPreview','generateReportPDF');
_exports.forEach(name=>{ try{ if(typeof eval(name) !== 'undefined') window[name] = eval(name); }catch(e){} });

// init on load
document.addEventListener('DOMContentLoaded', ()=>{ initAll(); });

// report buttons wiring
document.addEventListener('DOMContentLoaded', ()=>{
  try{
    const bPrev = document.getElementById('btnPreview'); if(bPrev) bPrev.addEventListener('click', renderReportPreview);
    const bGen = document.getElementById('btnGenerate'); if(bGen) bGen.addEventListener('click', ()=>{ renderReportPreview(); setTimeout(generateReportPDF, 350); });
    const bBack = document.getElementById('btnBackToForm'); if(bBack) bBack.addEventListener('click', ()=>{ const card=document.getElementById('reportPreviewCard'); if(card) card.style.display='none'; window.scrollTo({top:0,behavior:'smooth'}); });
    const bGen2 = document.getElementById('btnGenerateFromPreview'); if(bGen2) bGen2.addEventListener('click', generateReportPDF);
  }catch(e){}
});

export {};

// Mobile menu toggle: keeps sidebar usable on small screens
document.addEventListener('DOMContentLoaded', ()=>{
  try{
    const toggle = document.getElementById('mobileMenuToggle');
    const nav = document.querySelector('nav.tabs');
    if(toggle && nav){
      toggle.addEventListener('click', (e)=>{
        e.stopPropagation(); nav.classList.toggle('open');
        // close when clicking outside
        if(nav.classList.contains('open')){
          const closeFn = (ev)=>{ if(!nav.contains(ev.target) && ev.target !== toggle){ nav.classList.remove('open'); document.removeEventListener('click', closeFn); } };
          setTimeout(()=>document.addEventListener('click', closeFn), 60);
        }
      });
    }
  }catch(e){/* non-critical */}
});
