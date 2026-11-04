/* SGQ SENAC — versão mobile. JS puro, sem dependências.
   Usa o MESMO schema e a MESMA chave de localStorage do desktop (sgq_senac_v1),
   então os dados são compatíveis quando as duas versões rodam na mesma origem. */
'use strict';

/* ============ Dados ============ */
const KEY = 'sgq_senac_v1';
const blank = () => ({problems:[], pareto:[], ishikawa:{problema:'', cats:{metodo:[],maquina:[],medida:[],meioAmbiente:[],maoDeObra:[],materiaPrima:[]}},
  whys:{problema:'', chain:[]}, flow:[], w2h:[]});
function load(){ try{ const r = localStorage.getItem(KEY); if(r) return Object.assign(blank(), JSON.parse(r)); }catch(e){} return blank(); }
let DB = load();
const save = () => { try{ localStorage.setItem(KEY, JSON.stringify(DB)); }catch(e){ toast('Não foi possível salvar neste navegador.'); } };

/* ============ Helpers ============ */
const $ = id => document.getElementById(id);
const uid = () => 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const h = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const ico = n => `<svg class="i" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const del = (act, id, lbl, v='') => `<button class="icon del" data-act="${act}" data-id="${id}" data-v="${v}" aria-label="${lbl}">${ico('trash')}</button>`;
const empty = (t, extra='') => `<div class="empty"><span>${t}</span>${extra}</div>`;
const gs = p => p.g * p.u * p.t;
const lvl = s => s >= 64 ? ['hi','Crítico'] : s >= 27 ? ['mid','Atenção'] : ['lo','Baixo'];   // mesmos cortes do desktop
const STAT = {'A iniciar':'', 'Em andamento':'mid', 'Concluído':'lo', 'Atrasado':'hi'};
const dt = d => d ? d.split('-').reverse().join('/') : '';
const conf = s => { const r = s.checklist.filter(c => c.status==='ok' || c.status==='nao'); return r.length ? Math.round(r.filter(c => c.status==='ok').length / r.length * 100) : null; };
let tt; function toast(m){ const t = $('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2600); }
function foc(id){ const e = document.querySelector(`[data-id="${id}"][data-f]`); if(e){ e.scrollIntoView({block:'center'}); e.focus(); } }
function stats(){
  const tot = DB.w2h.length, done = DB.w2h.filter(r => r.status==='Concluído').length;
  const cs = DB.flow.map(conf).filter(c => c !== null), ncs = [];
  DB.flow.forEach(s => s.checklist.filter(c => c.status==='nao').forEach(c => ncs.push(s.nome + ': ' + c.texto)));
  return {np:DB.problems.length, tot, done, pct: tot ? Math.round(done/tot*100) : 0, avg: cs.length ? Math.round(cs.reduce((a,b) => a+b, 0)/cs.length) : null, ncs};
}

/* ============ Navegação por hash (botão Voltar do celular funciona) ============ */
const MODS = [['dashboard','Painel PDCA'],['fluxo','Fluxograma'],['pop','POP'],['checklist','Checklist'],['gut','Matriz GUT'],
  ['pareto','Pareto'],['ishikawa','Ishikawa'],['porques','5 Porquês'],['w2h','Plano 5W2H'],['relatorios','Relatórios']];
const BNAV = ['dashboard','fluxo','w2h','relatorios'];
$('sideLinks').innerHTML = MODS.map(([k,n], i) => `<a href="#${k}" data-v="${k}"><span class="num">${String(i).padStart(2,'0')}</span>${n}</a>`).join('');
$('hdrDate').textContent = new Date().toLocaleDateString('pt-BR');

let V = 'dashboard', CUR = null, RF = {tipo:'', status:''}, first = true;
const cur = () => DB.flow.find(s => s.id === CUR) || DB.flow[0] || null;
const R = {dashboard:rDash, fluxo:rFlow, pop:rPop, checklist:rCk, gut:rGut, pareto:rPar, ishikawa:rIshi, porques:rWhy, w2h:rW2h, relatorios:rRel};

function show(v){
  if(!R[v]) v = 'dashboard';
  V = v; closeLayer();
  document.querySelectorAll('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v));
  document.querySelectorAll('[data-v]').forEach(a => { const on = a.dataset.v === v; a.classList.toggle('active', on); on ? a.setAttribute('aria-current','page') : a.removeAttribute('aria-current'); });
  $('bMore').classList.toggle('active', !BNAV.includes(v));
  R[v]();
  window.scrollTo(0, 0);
  if(!first){ const t = $('t-' + v); t.tabIndex = -1; t.focus({preventScroll:true}); }   // leitores de tela anunciam a nova tela
  first = false;
}
window.addEventListener('hashchange', () => show(location.hash.slice(1)));

/* ============ Camadas: drawer e bottom sheet (overlay, ESC, foco, inert) ============ */
let layer = null, opener = null;
const BG = ['appHeader','bnav','main','side','sheet'];
function openLayer(el, focusEl){
  if(layer) closeLayer();
  opener = document.activeElement; layer = el;
  BG.forEach(i => { if($(i) !== el) $(i).inert = true; });     // foco e leitor de tela ficam presos na camada
  if(el.id === 'side'){ el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true'); }
  $('scrim').hidden = false; document.body.classList.add('lock');
  el.classList.add('open');
  setTimeout(() => (focusEl || el.querySelector('input,select,textarea,button,a'))?.focus(), 60);
}
function closeLayer(){
  if(!layer) return;
  layer.classList.remove('open');
  if(layer.id === 'side'){ layer.removeAttribute('role'); layer.removeAttribute('aria-modal'); }
  BG.forEach(i => $(i).inert = false);
  $('scrim').hidden = true; document.body.classList.remove('lock');
  const o = opener; layer = null; opener = null;
  if(o && document.contains(o)) o.focus();
}
function sheet(title, html){ $('sheetT').textContent = title; $('sheetB').innerHTML = html; openLayer($('sheet')); }
function ask(title, msg, yes, fn){ ask.fn = fn; sheet(title, `<p>${msg}</p><div class="actions"><button class="btn ghost" data-act="close">Cancelar</button><button class="btn danger" data-act="ask-yes">${yes}</button></div>`); }
$('bMore').addEventListener('click', () => openLayer($('side'), $('closeSide')));
$('closeSide').addEventListener('click', closeLayer);
$('scrim').addEventListener('click', closeLayer);
document.addEventListener('keydown', e => { if(e.key === 'Escape' && layer) closeLayer(); });

/* ============ 00 · Painel PDCA ============ */
function rDash(){
  const s = stats(), top = [...DB.problems].sort((a,b) => gs(b) - gs(a)).slice(0,3), by = {};
  DB.w2h.forEach(r => by[r.status] = (by[r.status]||0) + 1);
  const li = (a, e) => a.length ? a.map(x => `<li>${h(x)}</li>`).join('') : `<li class="muted">${e}</li>`;
  const kpi = (c, l, href, n, t) => `<a class="kpi ${c}" href="#${href}"><span class="letter" aria-hidden="true">${l}</span><b>${n}</b><small>${t}</small></a>`;
  const ph = (c, t, items) => `<div class="card phase ${c}"><h3>${t}</h3><ul>${items}</ul></div>`;
  $('dash').innerHTML = `<div class="kpis">
      ${kpi('plan','P','gut', s.np, 'problemas na Matriz GUT')}
      ${kpi('do','D','w2h', s.pct + '%', 'ações do 5W2H concluídas')}
      ${kpi('check','C','checklist', s.avg === null ? '—' : s.avg + '%', 'conformidade média')}
      ${kpi('act','A','relatorios', s.ncs.length, 'não conformidades abertas')}</div>
    ${ph('plan','Planejar', li(top.map(p => (p.nome || '(sem nome)') + ' — score ' + gs(p)), 'Nenhum problema priorizado ainda'))}
    ${ph('do','Executar', li(Object.entries(by).map(([k,c]) => k + ': ' + c), 'Nenhuma ação cadastrada no 5W2H'))}
    ${ph('check','Verificar', li(DB.flow.map(x => { const c = conf(x); return x.nome + ': ' + (c === null ? 'sem checklist' : c + '%'); }), 'Nenhuma etapa cadastrada no fluxograma'))}
    ${ph('act','Agir', li(s.ncs.slice(0,4), 'Nenhuma não conformidade em aberto'))}
    <p class="cycle-note">Planejar → Executar → Verificar → Agir → volta a Planejar</p>`;
}

/* ============ 01 · Fluxograma (vertical) ============ */
function rFlow(){
  $('flowList').innerHTML = DB.flow.length ? DB.flow.map((s, i) => {
    const c = conf(s), nc = s.checklist.some(x => x.status === 'nao');
    return `<li class="step${s.decisao ? ' dec' : ''}">
      <button class="step-main" data-act="open" data-id="${s.id}" aria-label="Abrir POP e checklist: ${h(s.nome)}">
        <span class="idx">${s.decisao ? '◇ DECISÃO' : 'ETAPA ' + (i+1)}</span><span class="nm">${h(s.nome)}</span>
        <span class="rs">${h(s.responsavel || 'Sem responsável')}</span>
        <span class="bd">${c !== null ? `<span class="pill">${c}%</span>` : ''}${nc ? '<span class="dot" role="img" aria-label="Não conformidade em aberto"></span>' : ''}</span>
      </button>${del('flow-del', s.id, 'Remover etapa ' + h(s.nome))}</li>`;
  }).join('') : `<li>${empty('Nenhuma etapa cadastrada ainda. Comece pela primeira etapa do processo.')}</li>`;
}
function flowForm(){
  sheet('Nova etapa', `<form data-form="step" class="item">
    <label class="f"><span>Nome da etapa</span><input type="text" name="nome" required placeholder="Ex.: Inspeção de recebimento"></label>
    <label class="f"><span>Responsável</span><input type="text" name="resp" placeholder="Quem executa a etapa"></label>
    <label class="chk"><input type="checkbox" name="dec"> Esta etapa envolve uma decisão</label>
    <button class="btn orange block" type="submit">Salvar etapa</button></form>`);
}

/* ============ 02/03 · POP e Checklist (mesma etapa selecionada) ============ */
function stationBar(v){
  const s = cur();
  return `<div class="seg" role="group" aria-label="Documento da etapa"><a href="#pop"${v==='pop' ? ' aria-current="page"' : ''}>POP</a><a href="#checklist"${v==='checklist' ? ' aria-current="page"' : ''}>Checklist</a></div>
    ${DB.flow.length > 1 ? `<label class="f pick"><span>Etapa</span><select data-act="pick">${DB.flow.map(x => `<option value="${x.id}"${s && x.id === s.id ? ' selected' : ''}>${h(x.nome)}</option>`).join('')}</select></label>` : ''}`;
}
const noStep = () => empty('Cadastre uma etapa no Fluxograma para criar o POP e o Checklist dela.', '<a class="btn orange" href="#fluxo">Ir para o Fluxograma</a>');
function rPop(){
  const s = cur(); if(!s){ $('popBox').innerHTML = noStep(); return; }
  const p = s.pop;
  const f = (k, l, type='text', ph='') => `<label class="f"><span>${l}</span><input type="${type}" data-k="pop" data-f="${k}" value="${h(p[k])}" placeholder="${ph}"></label>`;
  const ta = (k, l, ph, rows=4) => `<label class="f"><span>${l}</span><textarea rows="${rows}" data-k="pop" data-f="${k}" placeholder="${ph}">${h(p[k])}</textarea></label>`;
  const ac = (t, b, o) => `<details class="acc"${o ? ' open' : ''}><summary>${t}</summary><div class="acc-b">${b}</div></details>`;
  $('popBox').innerHTML = stationBar('pop') + `<div class="card pophead"><div class="tb"><small>Procedimento Operacional Padrão</small><div class="t">${h(s.nome)}</div></div></div>
    <div class="acc-grid">${ac('Identificação', f('empresa','Empresa') + `<div class="g2">${f('codigo','Código','text','POP-001')}${f('versao','Versão')}</div>` + f('dataEmissao','Emissão','date'), true)}
    ${ac('Objetivo', ta('objetivo','Objetivo','Para que serve este procedimento?'), true)}
    ${ac('Documentos de referência', ta('referencias','Referências','Leis, normas, manuais...'))}
    ${ac('Passo a passo', ta('descricao','Descrição','O que fazer, como fazer e quem faz...', 8))}
    ${ac('Histórico de revisões', ta('historico','Gestão de mudanças','Data - o que mudou - aprovado por...'))}</div>
    <div class="actions no-print"><button class="btn ghost" data-act="print">${ico('print')}Exportar / imprimir POP (PDF)</button></div>`;
}
function rCk(){
  const s = cur(); if(!s){ $('ckBox').innerHTML = noStep(); return; }
  const c = conf(s);
  const items = s.checklist.map(i => `<li class="card item ck"><div class="ck-top"><p>${h(i.texto)}</p>${del('ck-del', i.id, 'Remover item')}</div>
    <div class="opts" role="group" aria-label="Resultado do item">${[['ok','Conforme'],['nao','Não conforme'],['na','N/A']].map(([v,l]) =>
      `<button class="${v}${i.status === v ? ' sel' : ''}" aria-pressed="${i.status === v}" data-act="ck-set" data-id="${i.id}" data-v="${v}">${l}</button>`).join('')}</div>
    ${i.status === 'nao' ? `<div class="just"><label class="f"><span>Justificativa (obrigatória)</span><textarea rows="3" data-k="ck" data-id="${i.id}" data-f="obs" placeholder="Descreva o desvio observado">${h(i.obs)}</textarea></label>
      <label class="btn ghost file"><input class="sr" type="file" accept="image/*" capture="environment" data-k="foto" data-id="${i.id}">${i.foto ? 'Foto: ' + h(i.foto) : 'Anexar foto'}</label>
      <div class="g2"><button class="btn orange" data-act="ck-w2h" data-id="${i.id}">Abrir ação 5W2H</button><button class="btn ghost" data-act="ck-gut" data-id="${i.id}">Matriz GUT</button></div></div>` : ''}</li>`).join('');
  $('ckBox').innerHTML = stationBar('checklist') + `<div class="meter"><div><small>Conformidade</small><div class="pct">${c === null ? '—' : c + '%'}</div></div><div class="bar" role="img" aria-label="Conformidade ${c || 0}%"><i style="width:${c || 0}%"></i></div></div>
    ${s.checklist.length ? `<ul class="list">${items}</ul>` : empty('Nenhum item de verificação cadastrado ainda.')}
    <form class="addrow" data-form="ck" style="margin-top:10px"><input type="text" name="t" placeholder="Novo item de verificação" aria-label="Novo item de verificação"><button class="btn orange" type="submit">${ico('plus')}Item</button></form>`;
}

/* ============ 04 · Matriz GUT (cards; re-render só quando muda o score) ============ */
function rGut(){
  const L = [...DB.problems].sort((a,b) => gs(b) - gs(a));
  $('gutList').innerHTML = L.length ? L.map(p => {
    const s = gs(p), [c, t] = lvl(s);
    const sel = (f, n) => `<label class="f"><span>${n}</span><select data-k="gut" data-id="${p.id}" data-f="${f}">${[1,2,3,4,5].map(v => `<option${p[f] == v ? ' selected' : ''}>${v}</option>`).join('')}</select></label>`;
    return `<li class="card item"><label class="f"><span>Problema</span><input type="text" data-k="gut" data-id="${p.id}" data-f="nome" value="${h(p.nome)}" placeholder="Descreva o problema"></label>
      <div class="g3">${sel('g','Gravid.')}${sel('u','Urgência')}${sel('t','Tendên.')}</div>
      <div class="foot"><span class="score">Score <b>${s}</b></span><span class="stamp ${c}">${t}</span>${del('gut-del', p.id, 'Remover problema')}</div></li>`;
  }).join('') : `<li>${empty('Nenhum problema cadastrado ainda.')}</li>`;
}

/* ============ 05 · Pareto (gráfico em SVG puro) ============ */
function rPar(){
  $('parList').innerHTML = DB.pareto.length ? DB.pareto.map(p => `<li class="card row2">
    <label class="f"><span>Causa / defeito</span><input type="text" data-k="par" data-id="${p.id}" data-f="causa" value="${h(p.causa)}" placeholder="Causa ou defeito"></label>
    <label class="f"><span>Freq.</span><input type="number" min="0" inputmode="numeric" data-k="par" data-id="${p.id}" data-f="freq" value="${p.freq}"></label>
    ${del('par-del', p.id, 'Remover causa')}</li>`).join('') : `<li>${empty('Nenhuma causa cadastrada ainda.')}</li>`;
  chart();
}
function chart(){
  const d = [...DB.pareto].filter(p => p.causa).sort((a,b) => b.freq - a.freq), box = $('pChart'), lg = $('pLeg');
  if(!d.length){ box.innerHTML = empty('Cadastre causas com frequência para ver o gráfico.'); lg.innerHTML = ''; return; }
  const W = 360, H = 250, L = 34, Rr = 34, T = 14, B = 26, pw = W - L - Rr, ph = H - T - B;
  const tot = d.reduce((s,p) => s + p.freq, 0) || 1, max = Math.max(...d.map(p => p.freq), 1), bw = pw / d.length;
  const y = pc => T + ph - pc / 100 * ph;           // escala direita (% acumulado)
  let acc = 0, pts = [], rows = [];
  const bars = d.map((p, i) => {
    const before = acc / tot * 100; acc += p.freq; const pc = acc / tot * 100, bh = p.freq / max * ph, cx = L + i * bw + bw / 2;
    pts.push([cx, y(pc)]); rows.push([p, pc, before < 80]);
    return `<rect x="${cx - bw * .38}" y="${T + ph - bh}" width="${bw * .76}" height="${bh}" fill="var(--blue-800)"/><text x="${cx}" y="${H - 9}" text-anchor="middle" class="ax">${i + 1}</text>`;
  }).join('');
  const grid = [0,25,50,75,100].map(v => `<line x1="${L}" x2="${W - Rr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${W - Rr + 4}" y="${y(v) + 3}" class="ax">${v}%</text>`).join('');
  const resumo = `Gráfico de Pareto com ${d.length} causas. Maior: ${d[0].causa}, ${Math.round(d[0].freq / tot * 100)}% das ocorrências.`;
  box.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${h(resumo)}"><title>${h(resumo)}</title>${grid}
    <text x="${L - 4}" y="${T + 3}" text-anchor="end" class="ax">${max}</text><text x="${L - 4}" y="${T + ph + 3}" text-anchor="end" class="ax">0</text>${bars}
    <line x1="${L}" x2="${W - Rr}" y1="${y(80)}" y2="${y(80)}" stroke="var(--danger)" stroke-width="1.5" stroke-dasharray="6 4"/>
    <polyline points="${pts.map(q => q.join(',')).join(' ')}" fill="none" stroke="var(--orange-600)" stroke-width="2.5"/>
    ${pts.map(q => `<circle cx="${q[0]}" cy="${q[1]}" r="3.5" fill="var(--orange-600)"/>`).join('')}</svg>
    <div class="keys"><span><i style="background:var(--blue-800)"></i>Frequência</span><span><i style="background:var(--orange-600)"></i>% acumulado</span><span><i style="background:var(--danger)"></i>Linha 80%</span></div>`;
  lg.innerHTML = rows.map(([p, pc, vital], i) => `<li><span class="n">${i + 1}</span><span class="t">${h(p.causa)}</span>${vital ? '<span class="stamp mid">Vital</span>' : ''}<span class="v">${p.freq} · ${pc.toFixed(0)}%</span></li>`).join('');
}

/* ============ 06 · Ishikawa (vertical: eixo à esquerda, causas abaixo) ============ */
const CATS = [['metodo','Método'],['maquina','Máquina'],['medida','Medida'],['meioAmbiente','Meio Ambiente'],['maoDeObra','Mão de Obra'],['materiaPrima','Matéria-Prima']];
function rIshi(){
  $('ishiP').value = DB.ishikawa.problema || '';
  const prev = {}; document.querySelectorAll('#ishiCats details').forEach(d => prev[d.dataset.c] = d.open);   // preserva abertos/fechados
  $('ishiCats').innerHTML = CATS.map(([k, n]) => {
    const it = DB.ishikawa.cats[k] || [];
    return `<details class="cat" data-c="${k}"${prev[k] === false ? '' : ' open'}><summary>${n} <span class="pill">${it.length}</span></summary>
      <ul>${it.map(i => `<li><span>${h(i.texto)}</span>${del('ishi-del', i.id, 'Remover causa', k)}</li>`).join('')}</ul>
      <form data-form="ishi" data-c="${k}" class="addrow"><input type="text" name="t" placeholder="Adicionar causa" aria-label="Adicionar causa em ${n}"><button class="btn ghost" type="submit" aria-label="Adicionar">${ico('plus')}</button></form></details>`;
  }).join('');
}

/* ============ 07 · 5 Porquês (lista encadeada vertical) ============ */
function rWhy(){
  $('whyP').value = DB.whys.problema || '';
  const c = DB.whys.chain;
  $('whyChain').innerHTML = (c.length ? c.map((w, i) => `<div class="why"><div class="why-n">${i + 1}</div><div class="why-b">
      <label class="f"><span>Por quê? (nível ${i + 1} de 5)</span><input type="text" data-k="why" data-id="${i}" data-f="resposta" value="${h(w.resposta)}" placeholder="Responda para liberar o próximo nível"></label>
      ${i === c.length - 1 ? `<button class="btn ghost" data-act="why-undo" data-id="${i}">Desfazer este nível</button>` : ''}</div></div>`).join('')
    : empty('Nenhum “por quê” registrado ainda.', '<button class="btn orange" data-act="why-add">Perguntar “Por quê?”</button>')) + '<div id="whyActs"></div>';
  whyActs();
}
function whyActs(){
  const c = DB.whys.chain, last = c[c.length - 1], ok = last && last.resposta.trim();
  $('whyActs').innerHTML = (c.length && c.length < 5 && ok ? '<button class="btn orange block" data-act="why-add">Perguntar novamente “Por quê?”</button>' : '') +
    (ok ? `<div class="card root" style="margin:14px 0 0"><h3>Causa raiz identificada</h3><p>${h(last.resposta)}</p><button class="btn orange block" data-act="why-send">Enviar para o 5W2H</button></div>` : '');
}

/* ============ 08 · 5W2H (cards) ============ */
function fillWho(){
  const s = $('w2hFWho'), v = s.value, w = [...new Set(DB.w2h.map(r => r.who).filter(Boolean))];
  s.innerHTML = '<option value="">Todos</option>' + w.map(x => `<option${x === v ? ' selected' : ''}>${h(x)}</option>`).join('');
}
function rW2h(){
  fillWho();
  const fw = $('w2hFWho').value, fs = $('w2hFSt').value, L = DB.w2h.filter(r => (!fw || r.who === fw) && (!fs || r.status === fs));
  $('w2hList').innerHTML = L.length ? L.map(r => {
    const t = (k, l, type='text', ph='') => `<label class="f"><span>${l}</span><input type="${type}" data-k="w2h" data-id="${r.id}" data-f="${k}" value="${h(r[k])}" placeholder="${ph}"></label>`;
    return `<li class="card item"><div class="foot top"><span class="stamp ${STAT[r.status] || ''}">${h(r.status)}</span><span class="pill">${h(r.origem || 'Manual')}</span>${del('w2h-del', r.id, 'Remover ação')}</div>
      ${t('what','What · O quê')}${t('why','Why · Por quê')}<div class="g2">${t('where','Where · Onde')}${t('who','Who · Quem')}</div>
      <div class="g2">${t('when','When · Quando','date')}${t('howmuch','How much','text','R$')}</div>${t('how','How · Como')}
      <label class="f"><span>Status</span><select data-k="w2h" data-id="${r.id}" data-f="status">${Object.keys(STAT).map(o => `<option${o === r.status ? ' selected' : ''}>${o}</option>`).join('')}</select></label></li>`;
  }).join('') : `<li>${empty('Nenhuma ação encontrada.')}</li>`;
}

/* ============ 09 · Relatórios (lista + filtros em bottom sheet) ============ */
function rRel(){
  const s = stats(), rows = [];
  DB.problems.forEach(p => { const [c, t] = lvl(gs(p)); rows.push({tp:'GUT', t:p.nome || '(sem nome)', d:'Score ' + gs(p), c, b:t}); });
  DB.w2h.forEach(r => rows.push({tp:'5W2H', t:r.what || '(sem descrição)', d:[r.who, dt(r.when)].filter(Boolean).join(' · ') || 'Sem responsável e prazo', c:STAT[r.status] || '', b:r.status, st:r.status}));
  DB.flow.forEach(f => f.checklist.filter(c => c.status === 'nao').forEach(c => rows.push({tp:'NC', t:c.texto, d:f.nome, c:'hi', b:'Aberta'})));
  const L = rows.filter(r => (!RF.tipo || r.tp === RF.tipo) && (!RF.status || r.st === RF.status)), n = (RF.tipo ? 1 : 0) + (RF.status ? 1 : 0);
  const kpi = (c, l, hr, v, t) => `<a class="kpi ${c}" href="#${hr}"><span class="letter" aria-hidden="true">${l}</span><b>${v}</b><small>${t}</small></a>`;
  $('relBox').innerHTML = `<div class="kpis">${kpi('plan','P','gut', s.np, 'problemas (GUT)')}${kpi('do','D','w2h', s.pct + '%', 'ações concluídas')}${kpi('check','C','checklist', s.avg === null ? '—' : s.avg + '%', 'conformidade média')}${kpi('act','A','relatorios', s.ncs.length, 'não conformidades')}</div>
    <div class="bar-tools no-print"><button class="btn ghost" data-act="rel-filter">${ico('filter')}Filtros${n ? ' (' + n + ')' : ''}</button><button class="btn ghost" data-act="print">${ico('print')}Imprimir</button></div>
    ${n ? `<div class="chips">${RF.tipo ? `<span class="pill">Tipo: ${RF.tipo === 'NC' ? 'Não conformidade' : RF.tipo}</span>` : ''}${RF.status ? `<span class="pill">Status: ${RF.status}</span>` : ''}<button class="btn ghost" data-act="rel-clear" style="min-height:36px">Limpar</button></div>` : ''}
    ${L.length ? `<ul class="list cols">${L.map(r => `<li class="card rep"><div class="m"><span class="pill">${r.tp}</span><span class="stamp ${r.c}">${h(r.b)}</span></div><div class="t">${h(r.t)}</div><div class="d">${h(r.d)}</div></li>`).join('')}</ul>` : empty('Nada para mostrar com estes filtros.')}`;
}
function relFilter(){
  const o = (a, v) => a.map(x => `<option value="${x[0]}"${x[0] === v ? ' selected' : ''}>${x[1]}</option>`).join('');
  sheet('Filtros', `<form data-form="flt" class="item">
    <label class="f"><span>Tipo de registro</span><select name="tipo">${o([['','Todos'],['GUT','Problemas (GUT)'],['5W2H','Ações (5W2H)'],['NC','Não conformidades']], RF.tipo)}</select></label>
    <label class="f"><span>Status da ação (só 5W2H)</span><select name="status">${o([['','Todos'],...Object.keys(STAT).map(k => [k, k])], RF.status)}</select></label>
    <div class="actions"><button class="btn ghost" type="button" data-act="rel-clear">Limpar</button><button class="btn orange" type="submit">Aplicar filtros</button></div></form>`);
}

/* ============ Eventos (delegação) ============ */
const ACT = {
  close: closeLayer,
  'ask-yes': () => { const f = ask.fn; closeLayer(); f && f(); },
  'flow-add': flowForm,
  open: id => { CUR = id; location.hash = '#pop'; },
  'flow-del': id => { const s = DB.flow.find(x => x.id === id); ask('Remover etapa', `Remover “${h(s.nome)}” e todo o POP e Checklist vinculados?`, 'Remover', () => { DB.flow = DB.flow.filter(x => x.id !== id); if(CUR === id) CUR = null; save(); rFlow(); toast('Etapa removida.'); }); },
  'gut-add': () => { const id = uid(); DB.problems.push({id, nome:'', g:3, u:3, t:3}); save(); rGut(); foc(id); },
  'gut-del': id => { DB.problems = DB.problems.filter(x => x.id !== id); save(); rGut(); },
  'par-add': () => { const id = uid(); DB.pareto.push({id, causa:'', freq:0}); save(); rPar(); foc(id); },
  'par-del': id => { DB.pareto = DB.pareto.filter(x => x.id !== id); save(); rPar(); },
  'ishi-del': (id, c) => { DB.ishikawa.cats[c] = DB.ishikawa.cats[c].filter(x => x.id !== id); save(); rIshi(); },
  'why-add': () => { if(DB.whys.chain.length < 5){ DB.whys.chain.push({pergunta:'Por quê?', resposta:''}); save(); rWhy(); const i = $('whyChain').querySelectorAll('input'); i[i.length - 1]?.focus(); } },
  'why-undo': id => { DB.whys.chain = DB.whys.chain.slice(0, +id); save(); rWhy(); },
  'why-send': () => { const c = DB.whys.chain, r = c.length ? c[c.length - 1].resposta : ''; if(!r){ toast('Preencha a cadeia de porquês antes de enviar.'); return; }
    DB.w2h.push({id:uid(), what:'Eliminar causa raiz: ' + r, why:DB.whys.problema || 'Investigação dos 5 Porquês', where:'', who:'', when:'', how:'', howmuch:'', status:'A iniciar', origem:'5 Porquês'}); save(); toast('Causa raiz enviada para o Plano 5W2H.'); },
  'w2h-add': () => { const id = uid(); DB.w2h.push({id, what:'', why:'', where:'', who:'', when:'', how:'', howmuch:'', status:'A iniciar', origem:'Manual'}); save(); rW2h(); foc(id); },
  'w2h-del': id => { DB.w2h = DB.w2h.filter(x => x.id !== id); save(); rW2h(); },
  'ck-set': (id, v) => { const i = cur().checklist.find(x => x.id === id); i.status = v; save(); rCk(); },
  'ck-del': id => { const s = cur(); s.checklist = s.checklist.filter(x => x.id !== id); save(); rCk(); },
  'ck-w2h': id => { const s = cur(), i = s.checklist.find(x => x.id === id);
    DB.w2h.push({id:uid(), what:'Corrigir não conformidade: ' + i.texto, why:i.obs || 'Item reprovado no checklist', where:s.nome, who:s.responsavel || '', when:'', how:'', howmuch:'', status:'A iniciar', origem:'Checklist'}); save(); toast('Ação corretiva registrada no 5W2H.'); },
  'ck-gut': id => { const s = cur(), i = s.checklist.find(x => x.id === id); DB.problems.push({id:uid(), nome:'[' + s.nome + '] ' + i.texto, g:4, u:4, t:3}); save(); toast('Desvio registrado na Matriz GUT.'); },
  print: (id, v, b) => { b.classList.add('loading'); b.disabled = true; setTimeout(() => { window.print(); b.classList.remove('loading'); b.disabled = false; }, 250); },
  'rel-filter': relFilter,
  'rel-clear': () => { RF = {tipo:'', status:''}; closeLayer(); rRel(); }
};
document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if(b && ACT[b.dataset.act] && b.tagName !== 'SELECT') ACT[b.dataset.act](b.dataset.id, b.dataset.v, b); });

/* Grava campos de texto em silêncio enquanto digita (sem re-render, para não perder o foco
   nem fechar o teclado). Só re-renderiza quando a mudança altera ordem/filtros. */
function setF(t, commit){
  const {k, id, f} = t.dataset, v = t.value;
  if(k === 'gut'){ const p = DB.problems.find(x => x.id === id); if(!p) return; p[f] = f === 'nome' ? v : Number(v); save(); if(commit && f !== 'nome') rGut(); }
  else if(k === 'par'){ const p = DB.pareto.find(x => x.id === id); if(!p) return; p[f] = f === 'freq' ? Math.max(0, Number(v) || 0) : v; save(); chart(); }
  else if(k === 'w2h'){ const r = DB.w2h.find(x => x.id === id); if(!r) return; r[f] = v; save(); if(commit && f === 'status') rW2h(); else if(commit && f === 'who') fillWho(); }
  else if(k === 'pop'){ const s = cur(); if(s){ s.pop[f] = v; save(); } }
  else if(k === 'ck'){ const i = cur().checklist.find(x => x.id === id); if(i){ i.obs = v; save(); } }
  else if(k === 'why'){ DB.whys.chain[+id].resposta = v; save(); whyActs(); }
  else if(k === 'whyP'){ DB.whys.problema = v; save(); }
  else if(k === 'ishiP'){ DB.ishikawa.problema = v; save(); }
  else if(k === 'w2hF' && commit) rW2h();
}
document.addEventListener('input', e => { if(e.target.dataset.k) setF(e.target, false); });
document.addEventListener('change', e => {
  const t = e.target;
  if(t.dataset.act === 'pick'){ CUR = t.value; R[V](); }
  else if(t.dataset.k === 'foto'){ const i = cur().checklist.find(x => x.id === t.dataset.id); i.foto = t.files[0] ? t.files[0].name : ''; save(); rCk(); }
  else if(t.dataset.k) setF(t, true);
});
document.addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target, n = f.dataset.form, el = f.elements;
  if(n === 'step'){
    const nome = el.nome.value.trim(); if(!nome) return;
    DB.flow.push({id:uid(), nome, responsavel:el.resp.value.trim(), decisao:el.dec.checked,
      pop:{empresa:'SENAC', codigo:'', versao:'01', dataEmissao:new Date().toISOString().slice(0,10), objetivo:'', referencias:'', descricao:'', historico:''}, checklist:[]});
    save(); closeLayer(); rFlow(); toast('Etapa adicionada.');
  } else if(n === 'ishi'){
    const v = el.t.value.trim(); if(!v) return;
    DB.ishikawa.cats[f.dataset.c].push({id:uid(), texto:v}); save(); rIshi();
    document.querySelector(`#ishiCats [data-c="${f.dataset.c}"] input`)?.focus();   // permite digitar várias causas seguidas
  } else if(n === 'ck'){
    const v = el.t.value.trim(); if(!v) return;
    cur().checklist.push({id:uid(), texto:v, status:'', obs:'', foto:''}); save(); rCk(); $('ckBox').querySelector('form input').focus();
  } else if(n === 'flt'){ RF = {tipo:el.tipo.value, status:el.status.value}; closeLayer(); rRel(); }
});

/* ============ Início ============ */
show(location.hash.slice(1) || 'dashboard');
