// X Tarot v2 — 전문 리딩 엔진 & 화면
(() => {
"use strict";
const $app = document.getElementById("app");
const $nav = document.getElementById("nav");
const byId = Object.fromEntries(DECK.map(c => [c.id, c]));
const IDX = Object.fromEntries(DECK.map((c, i) => [c.id, i]));
const EL_THEME = {fire:"열정 · 행동 · 일", water:"감정 · 관계 · 마음", air:"생각 · 소통 · 결정", earth:"돈 · 현실 · 건강"};

/* ---------- storage ---------- */
const store = {
  get(k, d){ try{ const v = localStorage.getItem("xtarot." + k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem("xtarot." + k, JSON.stringify(v)); }catch(e){} }
};
let settings = Object.assign({reversals:true, tipHidden:false, bd:""}, store.get("settings", {}));
const saveSettings = () => store.set("settings", settings);

/* ---------- random ---------- */
function rand(n){ const a = new Uint32Array(1); const lim = Math.floor(0x100000000 / n) * n; let x;
  do { crypto.getRandomValues(a); x = a[0]; } while (x >= lim); return x % n; }
function shuffled(){
  const d = DECK.map(c => c.id);
  for (let i = d.length - 1; i > 0; i--){ const j = rand(i + 1); [d[i], d[j]] = [d[j], d[i]]; }
  return d.map(id => ({id, r: settings.reversals ? rand(2) === 1 : false}));
}

/* ---------- art ---------- */
// 1909 Rider-Waite-Smith (public domain) — 78 cards in one sprite: 13 cols x 6 rows
const art = id => { const i = IDX[id];
  return `<div class="ci" role="img" aria-label="${byId[id].name}" style="background-position:${(i % 13) * 100 / 12}% ${Math.floor(i / 13) * 100 / 5}%"></div>`; };
document.body.insertAdjacentHTML("afterbegin", `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<pattern id="xtbp" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M5 0L10 5L5 10L0 5Z" fill="none" stroke="#d9b46a" stroke-width=".35" opacity=".45"/></pattern>
<radialGradient id="xtbg" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#2b2a6e"/><stop offset="1" stop-color="#0d1129"/></radialGradient></defs></svg>`);
const BACK = (() => {
  let p = ""; for (let i = 0; i < 12; i++){ const a = i*Math.PI/6;
    p += `<line x1="50" y1="85" x2="${50+30*Math.cos(a)}" y2="${85+30*Math.sin(a)}" stroke="#d9b46a" stroke-width=".5" opacity=".7"/>`; }
  return `<svg viewBox="0 0 100 170" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
<rect width="100" height="170" fill="url(#xtbg)"/><rect width="100" height="170" fill="url(#xtbp)"/>
<rect x="5" y="5" width="90" height="160" rx="5" fill="none" stroke="#d9b46a" stroke-width="1.4"/>
<rect x="9" y="9" width="82" height="152" rx="3" fill="none" stroke="#d9b46a" stroke-width=".5"/>
<circle cx="50" cy="85" r="30" fill="#0d1129" stroke="#d9b46a" stroke-width="1"/>${p}
<circle cx="50" cy="85" r="17" fill="#0d1129" stroke="#d9b46a" stroke-width=".8"/>
<path d="M42 77l16 16M58 77l-16 16" stroke="#f0d79a" stroke-width="3.2" stroke-linecap="round"/>
<path d="M50 40l3 6-3 6-3-6zM50 118l3 6-3 6-3-6z" fill="#d9b46a"/></svg>`;
})();

/* ---------- helpers ---------- */
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
function toast(msg){ const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 1800); }
function fmtDate(t){ const d = new Date(t);
  return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }
async function copy(text){
  try { await navigator.clipboard.writeText(text); return true; } catch(e){
    const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); let ok = false; try{ ok = document.execCommand("copy"); }catch(_){} ta.remove(); return ok; }
}
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const ds = n => String(n).split("").reduce((a, b) => a + +b, 0);

/* ---------- card logic ---------- */
const kw = (c, r) => (r ? c.rev : c.up).split(" · ")[0];
const score = (c, r) => !r ? c.yn : (c.yn > 0 ? c.yn - 2 : c.yn < 0 ? c.yn + 1 : -1);
const pipVal = c => c.arcana === "major" ? c.number : (c.court ? 0 : c.number);
const cname = (c, r) => c.name + (r ? "(역)" : "");
function relation(e1, e2){
  if (e1 === e2) return ["강화", "같은 원소라 서로의 힘을 키웁니다."];
  const k = [e1, e2].sort().join("-");
  if (k === "air-fire" || k === "earth-water") return ["우호", "서로 돕는 원소라 흐름이 자연스럽게 이어집니다."];
  if (k === "fire-water" || k === "air-earth") return ["대립", "서로 부딪히는 원소라 긴장이 있고 조율이 필요합니다."];
  return ["중립", "큰 충돌 없이 각자의 역할을 합니다."];
}
function toneOf(avg){
  if (avg >= 1) return ["매우 긍정", "전체적으로 매우 밝은 흐름입니다. 자신 있게 나아가도 좋습니다."];
  if (avg >= 0.3) return ["긍정", "긍정적인 흐름입니다. 다가온 기회를 적극적으로 활용하세요."];
  if (avg > -0.3) return ["변동", "길흉이 섞인 흐름입니다. 선택과 태도가 결과를 좌우합니다."];
  if (avg > -1) return ["도전", "도전이 많은 흐름입니다. 신중하게 대비하면 충분히 극복할 수 있습니다."];
  return ["어려움", "어려운 시기입니다. 무리하지 말고 기반을 지키며 때를 기다리세요."];
}

/* ---------- reading state ---------- */
let R = null;
let tab = "read";
const spreadOf = r => SPREADS[r.key];
const domainOf = r => { const sp = spreadOf(r); return (sp.variants && sp.variants[r.v || 0].domain) || sp.domain; };
function positions(r){
  const sp = spreadOf(r);
  if (sp.variants) return sp.variants[r.v || 0].pos;
  if (sp.dynamic === "year"){ const d = new Date(r.t); const out = [["올해의 테마","앞으로 12개월을 관통하는 큰 흐름"]];
    for (let i = 0; i < 12; i++){ const m = new Date(d.getFullYear(), d.getMonth() + i, 1);
      out.push([`${m.getMonth()+1}월`, `${m.getFullYear()}년 ${m.getMonth()+1}월의 흐름`]); } return out; }
  if (sp.dynamic === "week"){ const W = "일월화수목금토", out = [];
    for (let i = 0; i < 7; i++){ const d = new Date(r.t + i * 864e5);
      out.push([`${d.getMonth()+1}/${d.getDate()} ${W[d.getDay()]}`, i === 0 ? "오늘의 흐름과 조언" : "이날의 흐름과 조언"]); } return out; }
  if (sp.choice){ const A = r.a || "A", B = r.b || "B";
    return sp.pos.map(p => p.map(s => s.replace(/^A /, A + " ").replace(/^B /, B + " "))); }
  return sp.pos;
}
function badge(r, i){
  const sp = spreadOf(r);
  if (sp.dynamic === "year") return i === 0 ? "★" : positions(r)[i][0].replace("월", "");
  return i + 1;
}
const spreadTitle = r => { const sp = spreadOf(r); return sp.variants ? `${sp.title} · ${sp.variants[r.v || 0].name}` : sp.title; };

/* ---------- navigation ---------- */
const NAV = [
  ["read","리딩",'<path d="M12 2l2.4 7.2H22l-6 4.5 2.3 7.3L12 16.6 5.7 21l2.3-7.3-6-4.5h7.6z"/>'],
  ["lib","사전",'<rect x="3" y="3" width="7" height="11" rx="1.5"/><rect x="14" y="3" width="7" height="11" rx="1.5"/><path d="M3 18h18M3 21h12"/>'],
  ["hist","기록",'<path d="M4 5h16M4 10h16M4 15h10M4 20h7"/>'],
  ["tools","도구",'<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>']
];
function renderNav(){
  $nav.innerHTML = NAV.map(n => `<button data-t="${n[0]}" class="${tab === n[0] ? "on" : ""}" aria-label="${n[1]}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${n[2]}</svg>${n[1]}</button>`).join("");
  $nav.querySelectorAll("button").forEach(b => b.onclick = () => ({read:home, lib:library, hist:history, tools:tools})[b.dataset.t]());
}
function topbar(title, back){
  return `<div class="top">${back ? `<button class="iconbtn" id="back" aria-label="뒤로">‹</button>` : `<div style="width:44px"></div>`}<h2>${title}</h2><div style="width:44px"></div></div>`;
}

/* ---------- HOME ---------- */
function home(){
  R = null; tab = "read"; renderNav();
  const groups = ["기본","주제별","심층","시기"];
  const tip = (!isStandalone() && !settings.tipHidden) ? `<div class="tip"><button id="tipx" aria-label="닫기">×</button>
    <b>앱처럼 쓰기</b><br>${isIOS() ? "Safari 하단 <b>공유 버튼</b> → <b>홈 화면에 추가</b>"
      : "Chrome 오른쪽 위 <b>⋮ 메뉴</b> → <b>홈 화면에 추가</b>"}</div>` : "";
  $app.innerHTML = `
  <div class="hero"><h1>X TAROT</h1><p>마음을 가라앉히고, 질문을 떠올리세요</p></div>
  <button class="mbtn" data-s="one"><div class="ic">1</div><div><b>오늘의 카드</b><span>하루를 여는 한 장의 메시지</span></div></button>
  ${groups.map(g => `<div class="grp">${g === "기본" ? "기본 리딩" : g === "주제별" ? "주제별 리딩" : g === "심층" ? "심층 리딩" : "시기 리딩"}</div>
    <div class="sgrid">${Object.entries(SPREADS).filter(([k, s]) => s.group === g && k !== "one").map(([k, s]) =>
      `<button class="sbtn" data-s="${k}"><div class="ic">${s.icon}</div><b>${s.title}</b><span>${s.desc}</span><em>${s.count}장</em></button>`).join("")}</div>`).join("")}
  ${tip}`;
  $app.querySelectorAll("[data-s]").forEach(b => b.onclick = () => start(b.dataset.s));
  const tx = document.getElementById("tipx"); if (tx) tx.onclick = () => { settings.tipHidden = true; saveSettings(); home(); };
  window.scrollTo(0, 0);
}

/* ---------- READING FLOW ---------- */
function start(key){
  R = {key, v:0, q:"", a:"", b:"", t:Date.now(), deck:null, picked:[], flipped:new Set(), saved:false, stage:"ask", memo:""};
  renderReading();
}
function renderReading(){
  const sp = spreadOf(R);
  let body = "";
  if (R.stage === "ask"){
    body = `<p class="sdesc">${sp.desc} · ${sp.count}장</p>
      ${sp.variants ? `<div class="lbl">관점 선택</div><div class="chips" id="vars">${sp.variants.map((v, i) => `<button class="chip${i === R.v ? " on" : ""}" data-v="${i}">${v.name}</button>`).join("")}</div>` : ""}
      ${sp.choice ? `<div class="lbl">두 가지 선택지</div><div class="ab"><input class="inp" id="oa" maxlength="20" placeholder="A (예: 이직)" value="${esc(R.a)}"><input class="inp" id="ob" maxlength="20" placeholder="B (예: 현 직장)" value="${esc(R.b)}"></div>` : ""}
      <div class="lbl">질문 (선택)</div>
      <textarea class="q" id="q" placeholder="예: ${esc(sp.tips[0])}" maxlength="200">${esc(R.q)}</textarea>
      <div class="chips">${sp.tips.map(t => `<button class="chip tipq">${esc(t)}</button>`).join("")}</div>
      <p class="hint">${sp.dynamic === "year" ? "이번 달부터 12개월의 흐름을 봅니다." : sp.dynamic === "week" ? "오늘부터 7일의 흐름을 봅니다." : "질문을 구체적으로 적을수록 해석이 선명해집니다."}</p>
      <button class="cta" id="go">카드 섞기</button>`;
  } else if (R.stage === "shuffle"){
    body = `${R.q ? `<div class="qshow">“${esc(R.q)}”</div>` : ""}
      <div class="shuffle"><div>${BACK}</div><div class="s1">${BACK}</div><div class="s2">${BACK}</div></div>
      <p class="hint">카드를 섞고 있습니다…</p>`;
  } else {
    body = `${R.q ? `<div class="qshow">“${esc(R.q)}”</div>` : ""}<div class="board" id="board"></div><div id="below"></div>`;
  }
  $app.innerHTML = topbar(R.stage === "ask" ? sp.title : spreadTitle(R), true) + body;
  document.getElementById("back").onclick = () => R.fromHistory ? history() : home();
  if (R.stage === "ask"){
    const vars = document.getElementById("vars");
    if (vars) vars.querySelectorAll(".chip").forEach(c => c.onclick = () => {
      R.v = +c.dataset.v; vars.querySelectorAll(".chip").forEach(x => x.classList.toggle("on", x === c)); });
    $app.querySelectorAll(".tipq").forEach(c => c.onclick = () => { document.getElementById("q").value = c.textContent; });
    document.getElementById("go").onclick = () => {
      R.q = document.getElementById("q").value.trim();
      if (sp.choice){ R.a = document.getElementById("oa").value.trim(); R.b = document.getElementById("ob").value.trim(); }
      R.t = Date.now(); R.deck = shuffled(); R.stage = "shuffle"; renderReading();
      setTimeout(() => { R.stage = "pick"; renderReading(); }, 1600);
    };
  }
  if (R.stage === "pick" || R.stage === "reveal" || R.stage === "done"){ layoutBoard(); renderBelow(); }
  window.scrollTo(0, 0);
}

function layoutBoard(){
  const board = document.getElementById("board"); if (!board) return;
  const sp = spreadOf(R), rot = sp.rot || [];
  const W = Math.min($app.clientWidth - 32, 460);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  sp.layout.forEach((p, i) => { const r = rot.includes(i), hw = r ? .85 : .5, hh = r ? .5 : .85;
    x0 = Math.min(x0, p[0] - hw); x1 = Math.max(x1, p[0] + hw); y0 = Math.min(y0, p[1] - hh); y1 = Math.max(y1, p[1] + hh); });
  const w = Math.min(W / (x1 - x0), sp.maxW || 120);
  board.style.width = ((x1 - x0) * w) + "px";
  board.style.height = ((y1 - y0) * w + (sp.labels ? 26 : 0)) + "px";
  board.style.setProperty("--w", w + "px");
  board.classList.toggle("small", w < 60);
  board.innerHTML = sp.layout.map((p, i) =>
    `<div class="slot${rot.includes(i) ? " rot" : ""}" data-i="${i}" style="left:${(p[0] - x0) * w}px;top:${(p[1] - y0) * w}px">${slotInner(i)}</div>`).join("");
  board.querySelectorAll(".slot").forEach(s => s.onclick = () => tapSlot(+s.dataset.i));
}
function slotInner(i){
  const sp = spreadOf(R), pk = R.picked[i], P = positions(R);
  const lab = sp.labels && sp.count > 1 ? `<div class="lab">${esc(P[i][0])}</div>` : "";
  const num = sp.count > 1 ? `<div class="num">${badge(R, i)}</div>` : "";
  if (!pk) return `<div class="ph"></div>${num}${lab}`;
  const fl = R.flipped.has(i);
  return `${num}<div class="card${fl ? " flipped" : ""}" style="${R.stage === "done" ? "animation:none" : ""}"><div class="inner">
    <div class="face back">${BACK}</div><div class="face front${pk.r ? " rev" : ""}">${art(pk.id)}</div></div></div>${lab}`;
}
function updateSlot(i){ const s = document.querySelector(`.slot[data-i="${i}"]`); if (s) s.innerHTML = slotInner(i); }

function renderBelow(){
  const el = document.getElementById("below"); const n = spreadOf(R).count;
  if (R.stage === "pick"){
    el.innerHTML = `<div class="counter">카드 ${n - R.picked.length}장을 골라주세요</div>
      <div class="deckwrap"><div class="strip">${R.deck.map((c, i) => `<button class="bk" data-k="${i}" aria-label="카드">${BACK}</button>`).join("")}</div></div>
      <p class="hint">← 좌우로 넘기며 끌리는 카드를 탭하세요 →</p>
      <button class="cta ghost" id="auto">자동으로 뽑기</button>`;
    el.querySelectorAll(".bk").forEach(b => b.onclick = () => pick(+b.dataset.k, b));
    document.getElementById("auto").onclick = () => {
      if (R.autoing) return; R.autoing = true;
      const avail = [...el.querySelectorAll(".bk:not(.gone)")], need = n - R.picked.length;
      for (let j = 0; j < need; j++){ const b = avail.splice(rand(avail.length), 1)[0]; setTimeout(() => pick(+b.dataset.k, b), j * 140); }
    };
  } else if (R.stage === "reveal"){
    el.innerHTML = `<p class="hint" style="margin-top:22px">카드를 탭해서 한 장씩 뒤집으세요</p><button class="cta" id="all">모두 뒤집기</button>`;
    document.getElementById("all").onclick = () => { for (let i = 0; i < n; i++) setTimeout(() => flip(i), i * 130); };
  } else if (R.stage === "done"){
    el.innerHTML = results();
    bindResults(el);
  }
}
function pick(k, btn){
  const n = spreadOf(R).count;
  if (R.picked.length >= n || btn.classList.contains("gone")) return;
  btn.classList.add("gone");
  const i = R.picked.length; R.picked.push(R.deck[k]); updateSlot(i);
  const c = document.querySelector(".counter"); if (c) c.textContent = R.picked.length < n ? `카드 ${n - R.picked.length}장을 더 골라주세요` : "준비 완료";
  if (R.picked.length === n) setTimeout(() => { R.stage = "reveal"; renderBelow(); }, 450);
}
function tapSlot(i){
  const pk = R.picked[i]; if (!pk || R.stage === "pick") return;
  if (!R.flipped.has(i)) flip(i); else showCard(pk.id, pk.r, positions(R)[i]);
}
function flip(i){
  if (R.flipped.has(i)) return;
  R.flipped.add(i);
  const card = document.querySelector(`.slot[data-i="${i}"] .card`); if (card) card.classList.add("flipped");
  if (R.flipped.size === spreadOf(R).count) setTimeout(() => { R.stage = "done"; save(); renderBelow();
    document.getElementById("below").scrollIntoView({behavior:"smooth", block:"start"}); }, 800);
}

/* ---------- INTERPRETATION ENGINE ---------- */
function analyze(){
  const sp = spreadOf(R), P = positions(R), dom = domainOf(R);
  const C = R.picked.map((p, i) => { const c = byId[p.id]; return {i, c, r:p.r, s:score(c, p.r), pos:P[i]}; });
  return {sp, P, dom, C, n:C.length, avg:mean(C.map(x => x.s))};
}
function results(){
  const A = analyze(), {sp, C, n, dom} = A;
  const out = [];
  out.push(headline(A));
  if (dom === "yesno") out.push(yesNo(A));
  if (sp.choice) out.push(compareChoice(A));
  if (sp.timeline) out.push(timeline(A));
  out.push(`<h3>위치별 리딩</h3>` + C.map(x => item(x, A)).join(""));
  if (sp.pairs && sp.pairs.length) out.push(`<h3>카드 간 관계</h3>` + sp.pairs.map(p => pairHTML(A, p)).join(""));
  if (n >= 3) out.push(energy(A));
  const cb = combos(A); if (cb) out.push(cb);
  if (n >= 3) out.push(quint(A));
  out.push(advice(A));
  out.push(`<h3>리딩 노트</h3><textarea class="q" id="memo" placeholder="느낀 점, 실제로 일어난 일을 기록해 두세요. 리딩 실력이 늘어납니다." maxlength="1000">${esc(R.memo)}</textarea>
    <button class="cta" id="cp" style="margin-top:16px">AI 심층 해석용 복사 (Claude에 붙여넣기)</button>
    <div class="btns"><button class="cta ghost" id="again">다시 뽑기</button><button class="cta ghost" id="homeb">${R.fromHistory ? "기록으로" : "홈으로"}</button></div>`);
  return `<div class="res">${out.join("")}</div>`;
}
function bindResults(el){
  document.getElementById("cp").onclick = async () => toast(await copy(aiText()) ? "복사됨 — Claude에 붙여넣으세요" : "복사 실패");
  document.getElementById("again").onclick = () => { const k = R.key, v = R.v; start(k); R.v = v; renderReading(); };
  document.getElementById("homeb").onclick = () => R.fromHistory ? history() : home();
  el.querySelectorAll(".it").forEach(x => x.onclick = () => { const p = R.picked[+x.dataset.i]; showCard(p.id, p.r, positions(R)[+x.dataset.i]); });
  el.querySelectorAll("[data-card]").forEach(x => x.onclick = () => showCard(x.dataset.card, false, null));
  let mt; document.getElementById("memo").oninput = e => { R.memo = e.target.value; clearTimeout(mt); mt = setTimeout(saveMemo, 400); };
}

function headline(A){
  const {sp, C, n, avg} = A;
  let line;
  if (n === 1){ const x = C[0]; line = `<b>${cname(x.c, x.r)}</b> — 오늘의 키워드는 <b>${kw(x.c, x.r)}</b>`; }
  else line = sp.key.map(i => `${esc(C[i].pos[0])} <b>${cname(C[i].c, C[i].r)}</b>`).join(" → ");
  const t = toneOf(avg), pct = Math.max(3, Math.min(97, (avg + 2) / 4 * 100));
  return `<div class="head"><div class="hl">핵심 메시지</div><div class="line">${line}</div>
    <div class="gauge"><i style="left:${pct}%"></i></div><div class="glab"><span>도전</span><span>흐름 지수 · <b>${t[0]}</b></span><span>긍정</span></div>
    <p>${t[1]}</p></div>`;
}
function item(x, A){
  const {c, r, i, pos} = x, dom = A.dom, isAdv = (A.sp.adv || []).includes(i);
  let extra = "";
  if (dom === "love") extra += `<p class="m2"><i>연애</i>${c.l}${r ? " 다만 역방향이라 이 흐름이 약하거나 늦어질 수 있습니다." : ""}</p>`;
  if (dom === "work") extra += `<p class="m2"><i>일·재물</i>${c.w}${r ? " 다만 역방향이라 이 흐름이 약하거나 늦어질 수 있습니다." : ""}</p>`;
  if (isAdv) extra += `<p class="m2"><i>조언</i>${c.a}</p>`;
  return `<div class="it" data-i="${i}"><div class="mini${r ? " rev" : ""}">${art(c.id)}</div><div class="itb">
    <div class="p">${A.n > 1 ? badge(R, i) + ". " : ""}${esc(pos[0])}</div>
    <div class="n">${c.name}<span class="tag ${r ? "rv" : "up"}">${r ? "역방향" : "정방향"}</span></div>
    <div class="k">${r ? c.rev : c.up}</div>
    <p class="m">${r ? c.r : c.u}</p>${extra}
    <div class="d">${esc(pos[1])}</div></div></div>`;
}
function pairHTML(A, p){
  const a = A.C[p[0]], b = A.C[p[1]], rel = relation(a.c.el, b.c.el);
  let cmp;
  const flow = p[2].includes("→");
  if (flow) cmp = b.s - a.s >= 2 ? "뒤로 갈수록 흐름이 크게 좋아집니다." : b.s - a.s >= 1 ? "흐름이 점차 나아집니다." :
    b.s - a.s <= -2 ? "뒤로 갈수록 어려움이 커집니다. 미리 대비하세요." : b.s - a.s <= -1 ? "흐름이 다소 약해집니다." : "비슷한 강도의 기운이 이어집니다.";
  else cmp = b.s > a.s + 1 ? `'${esc(b.pos[0])}' 쪽 기운이 더 밝습니다.` : a.s > b.s + 1 ? `'${esc(a.pos[0])}' 쪽 기운이 더 강합니다.` : "두 위치의 기운이 비슷하게 맞서 있습니다.";
  return `<div class="pair"><b>${esc(p[2])}</b>
    <div class="pc">${cname(a.c, a.r)} (${ELEMENTS[a.c.el].ko}) ↔ ${cname(b.c, b.r)} (${ELEMENTS[b.c.el].ko}) · 원소 <b>${rel[0]}</b></div>
    <p>${rel[1]} ${cmp}</p></div>`;
}
function yesNo(A){
  const C = A.C, total = C[0].s + C[1].s + C[2].s * 1.5;
  const v = total >= 3 ? ["예", "흐름이 분명하게 긍정적입니다. 진행해도 좋습니다."] :
    total >= 1 ? ["아마도 예", "긍정 쪽으로 기울어 있습니다. 핵심 변수만 잘 관리하면 됩니다."] :
    total > -1 ? ["보류 · 조건부", "아직 결정되지 않았습니다. 조건이 바뀌면 결과도 달라집니다."] :
    total > -3 ? ["아마도 아니오", "부정 쪽으로 기울어 있습니다. 지금은 신중함이 필요합니다."] :
    ["아니오", "흐름이 분명하게 막혀 있습니다. 다른 길이나 시기를 찾으세요."];
  return `<div class="verdict"><div class="hl">판정</div><b>${v[0]}</b><p>${v[1]}</p><div class="vs">기운 점수 ${total > 0 ? "+" : ""}${total.toFixed(1)} (결과 카드 1.5배 가중)</div></div>`;
}
function compareChoice(A){
  const C = A.C, a = R.a || "A", b = R.b || "B";
  const sa = C[1].s + C[2].s * 1.5, sb = C[3].s + C[4].s * 1.5;
  const bar = s => Math.max(4, Math.min(100, (s + 5) / 10 * 100));
  const v = sa - sb >= 1.5 ? `<b>${esc(a)}</b> 쪽 흐름이 더 밝습니다.` : sb - sa >= 1.5 ? `<b>${esc(b)}</b> 쪽 흐름이 더 밝습니다.` :
    "두 길의 차이가 크지 않습니다. 결과 카드의 내용과 나의 가치관을 기준으로 선택하세요.";
  return `<div class="verdict"><div class="hl">선택 비교</div>
    <div class="cmp"><div><span>${esc(a)}</span><div class="bar"><i style="width:${bar(sa)}%"></i></div><small>결과: ${cname(C[2].c, C[2].r)}</small></div>
    <div><span>${esc(b)}</span><div class="bar"><i style="width:${bar(sb)}%"></i></div><small>결과: ${cname(C[4].c, C[4].r)}</small></div></div>
    <p>${v}</p></div>`;
}
function timeline(A){
  const list = A.sp.dynamic === "year" ? A.C.slice(1) : A.C;
  const hi = Math.max(...list.map(x => x.s)), lo = Math.min(...list.map(x => x.s));
  const best = list.filter(x => x.s === hi).slice(0, 3), worst = lo < 0 ? list.filter(x => x.s === lo).slice(0, 3) : [];
  const fmt = arr => arr.map(x => `<b>${esc(x.pos[0])}</b>(${cname(x.c, x.r)})`).join(", ");
  return `<div class="verdict"><div class="hl">${A.sp.dynamic === "year" ? "한 해의 흐름" : "한 주의 흐름"}</div>
    <p>가장 좋은 시기: ${fmt(best)}</p>
    <p>${worst.length ? `주의할 시기: ${fmt(worst)}` : "특별히 어려운 시기는 보이지 않습니다."}</p></div>`;
}
function energy(A){
  const {C, n} = A, out = [];
  const ec = {fire:0, water:0, air:0, earth:0}; C.forEach(x => ec[x.c.el]++);
  const bars = Object.keys(ec).map(e => `<div class="eb"><span>${ELEMENTS[e].ko}</span><div class="bar"><i style="width:${ec[e] / n * 100}%;background:${ELEMENTS[e].color}"></i></div><span>${ec[e]}</span></div>`).join("");
  const sorted = Object.entries(ec).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] >= 2 && sorted[0][1] > sorted[1][1]) out.push(`<b>${ELEMENTS[sorted[0][0]].ko}</b> 원소가 우세합니다. 이 질문의 중심은 <b>${EL_THEME[sorted[0][0]]}</b>입니다.`);
  if (n >= 5) Object.keys(ec).filter(e => !ec[e]).forEach(e => out.push(`<b>${ELEMENTS[e].ko}</b> 원소가 없습니다. ${ELEMENTS[e].lack}`));
  const majors = C.filter(x => x.c.arcana === "major").length;
  if (majors / n >= .5) out.push(`메이저 카드가 ${majors}장입니다. 개인의 노력을 넘어서는 큰 흐름과 인생의 전환점이 작용합니다.`);
  else if (majors === 0) out.push("메이저 카드가 없습니다. 운명적인 사건보다 일상의 선택과 행동으로 충분히 바꿀 수 있는 문제입니다.");
  else out.push(`메이저 카드 ${majors}장 — 큰 흐름과 일상의 선택이 함께 작용합니다.`);
  const revs = C.filter(x => x.r).length;
  if (settings.reversals || revs){
    if (revs / n >= .5) out.push(`역방향이 ${revs}장입니다. 지연, 내적 저항, 재검토가 필요한 부분이 많습니다. 서두르기보다 점검이 우선입니다.`);
    else if (revs === 0) out.push("모든 카드가 정방향입니다. 에너지가 막힘 없이 흐르고 있습니다.");
  }
  const courts = C.filter(x => x.c.court).length;
  if (courts >= 2) out.push(`인물 카드가 ${courts}장입니다. 주변 사람들의 영향과 관계가 결과에 크게 작용합니다.`);
  const rc = {}; C.filter(x => x.c.arcana === "minor").forEach(x => rc[x.c.number] = (rc[x.c.number] || 0) + 1);
  Object.entries(rc).filter(([k, v]) => v >= 2).forEach(([k, v]) => out.push(`${+k <= 10 ? "숫자 " + (k === "1" ? "에이스" : k) : RANKS[k - 1][0]} 카드가 ${v}장 — ${RANK_REPEAT[k - 1]}`));
  const pv = C.filter(x => x.c.arcana === "minor" && !x.c.court).map(x => x.c.number);
  if (pv.length >= 3){ const m = mean(pv);
    out.push(`마이너 카드의 평균 숫자는 ${m.toFixed(1)}입니다. ${m <= 3.5 ? "일이 아직 <b>초기 단계</b>에 있습니다." : m <= 6.5 ? "일이 <b>한창 진행 중</b>입니다." : "일이 <b>마무리 단계</b>에 들어섰습니다."}`); }
  return `<h3>에너지 분석</h3><div class="ebars">${bars}</div><ul class="bul">${out.map(s => `<li>${s}</li>`).join("")}</ul>`;
}
function combos(A){
  const ids = new Set(A.C.map(x => x.c.id));
  const hit = COMBOS.filter(c => ids.has(c[0]) && ids.has(c[1]));
  if (!hit.length) return "";
  return `<h3>특별 조합</h3>` + hit.map(h => `<div class="pair"><b>${byId[h[0]].name} + ${byId[h[1]].name}</b><p>${h[2]}</p></div>`).join("");
}
function quintCard(A){ let s = A.C.reduce((a, x) => a + pipVal(x.c), 0); while (s > 21) s = ds(s); return byId["M" + s]; }
function quint(A){
  const q = quintCard(A), inSpread = A.C.some(x => x.c.id === q.id);
  return `<h3>정수 카드 (퀸테센스)</h3><div class="qc" data-card="${q.id}"><div class="mini">${art(q.id)}</div><div>
    <div class="n">${q.name}</div><p class="m">${q.a}</p>
    <div class="d">모든 카드의 숫자를 더해 메이저 아르카나로 환원한 카드로, 이 리딩 전체를 관통하는 근본 메시지입니다.${inSpread ? " 리딩에 이미 나온 카드라 메시지가 특히 강조됩니다." : ""}</div></div></div>`;
}
function advice(A){
  const {sp, C, n} = A, list = [];
  (sp.adv || []).forEach(i => list.push(`<b>${esc(C[i].pos[0])}</b> · ${cname(C[i].c, C[i].r)}: ${C[i].c.a}`));
  const last = sp.key[sp.key.length - 1];
  if (!(sp.adv || []).includes(last)) list.push(`<b>${esc(C[last].pos[0])}</b> · ${cname(C[last].c, C[last].r)}: ${C[last].r ? "이 흐름을 바로잡으려면 — " : ""}${C[last].c.a}`);
  if (n >= 3){ const q = quintCard(A); list.push(`<b>정수 카드</b> · ${q.name}: ${q.a}`); }
  return `<h3>종합 조언</h3><ul class="bul adv">${list.map(s => `<li>${s}</li>`).join("")}</ul>`;
}
function aiText(){
  const A = analyze(), dom = {love:"연애·관계", work:"일·재물", yesno:"예/아니오", general:"일반"}[A.dom];
  const lines = A.C.map(x => `${badge(R, x.i)}. [${x.pos[0]}: ${x.pos[1]}] ${x.c.name} (${x.c.en}) — ${x.r ? "역방향" : "정방향"}`);
  return `당신은 경험 많은 전문 타로 리더입니다. 아래 리딩을 해석해 주세요.

질문: ${R.q || "(질문 없음 — 전반적인 흐름)"}
${A.sp.choice ? `선택지: A=${R.a || "A"}, B=${R.b || "B"}\n` : ""}스프레드: ${spreadTitle(R)} (${A.n}장, 주제: ${dom})
덱: 라이더-웨이트-스미스

${lines.join("\n")}

다음 순서로 한국어로 정리해 주세요:
1) 핵심 결론 한 문단
2) 위치별 해석 (위치의 의미와 카드를 연결)
3) 카드 간 관계와 흐름 (원소 상응, 메이저/마이너 비율, 반복되는 숫자·수트)
4) 주의할 점
5) 구체적이고 실천 가능한 조언 3가지`;
}

/* ---------- card detail ---------- */
function showCard(id, rev, pos){
  const c = byId[id];
  const meta = c.arcana === "major"
    ? `<span>메이저 ${c.roman}</span><span>원소 ${ELEMENTS[c.el].ko}</span><span>점성 ${c.astro}</span>`
    : `<span>${SUITS[c.suit].ko} · ${ELEMENTS[c.el].ko}</span><span>${c.court ? RANKS[c.number - 1][0] : "숫자 " + c.number}: ${RANK_MEAN[c.number - 1]}</span>`;
  const m = document.createElement("div"); m.className = "modal";
  m.innerHTML = `<div class="mbox" role="dialog" aria-label="${c.name}"><div class="big${rev ? " rev" : ""}">${art(id)}</div>
    <h4>${c.name}</h4><div class="en">${c.en}${pos ? " · " + (rev ? "역방향" : "정방향") : ""}</div>
    <div class="meta">${meta}</div>
    ${pos ? `<div class="blk"><i>위치 — ${esc(pos[0])}</i>${esc(pos[1])}</div>` : ""}
    <div class="blk"><i>그림의 상징</i>${c.d}</div>
    <div class="blk${pos && !rev ? " on" : ""}"><i>정방향 · ${c.up}</i>${c.u}</div>
    <div class="blk${pos && rev ? " on" : ""}"><i>역방향 · ${c.rev}</i>${c.r}</div>
    <div class="blk"><i>연애</i>${c.l}</div>
    <div class="blk"><i>일 · 재물</i>${c.w}</div>
    <div class="blk"><i>조언</i>${c.a}</div>
    <button class="cta ghost" style="margin-top:14px">닫기</button></div>`;
  m.onclick = e => { if (e.target === m || e.target.tagName === "BUTTON") m.remove(); };
  document.body.appendChild(m);
}

/* ---------- history ---------- */
function save(){
  if (R.saved || R.fromHistory) return; R.saved = true;
  const h = store.get("history", []);
  h.unshift({t:R.t, k:R.key, v:R.v, q:R.q, a:R.a, b:R.b, m:"", c:R.picked.map(p => [p.id, p.r ? 1 : 0])});
  store.set("history", h.slice(0, 100));
}
function saveMemo(){
  const h = store.get("history", []), e = h.find(x => x.t === R.t);
  if (e){ e.m = R.memo; store.set("history", h); }
}
function history(){
  R = null; tab = "hist"; renderNav();
  const h = store.get("history", []).filter(x => SPREADS[x.k]);
  let stats = "";
  if (h.length >= 3){
    const cnt = {}, ec = {fire:0, water:0, air:0, earth:0}; let total = 0, revs = 0;
    h.forEach(x => x.c.forEach(([id, r]) => { cnt[id] = (cnt[id] || 0) + 1; ec[byId[id].el]++; total++; revs += r; }));
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const topEl = Object.entries(ec).sort((a, b) => b[1] - a[1])[0][0];
    stats = `<div class="stats"><div class="st"><b>${h.length}</b><span>리딩</span></div><div class="st"><b>${total}</b><span>뽑은 카드</span></div><div class="st"><b>${ELEMENTS[topEl].ko}</b><span>가장 많은 원소</span></div></div>
      <div class="lbl">자주 나온 카드</div><div class="topc">${top.map(([id, k]) => `<button class="lc" data-card="${id}"><div class="lci">${art(id)}</div><span>${byId[id].name} · ${k}회</span></button>`).join("")}</div>`;
  }
  $app.innerHTML = topbar("리딩 기록", false) + stats + (h.length ? `<div class="lbl">최근 리딩</div>` + h.map((x, i) => {
      const r = {key:x.k, v:x.v, t:x.t, a:x.a, b:x.b};
      return `<button class="hi" data-i="${i}"><div class="t">${fmtDate(x.t)} · ${spreadTitle(r)}${x.m ? ' <span class="mt">메모</span>' : ""}</div><b>${x.q ? esc(x.q) : "질문 없음"}</b>
      <div class="c">${x.c.slice(0, 4).map(c => byId[c[0]].name + (c[1] ? "(역)" : "")).join(", ")}${x.c.length > 4 ? " 외 " + (x.c.length - 4) + "장" : ""}</div></button>`; }).join("")
    + `<button class="cta ghost" id="clr" style="margin-top:10px">기록 전체 삭제</button>`
    : `<div class="empty">아직 저장된 리딩이 없습니다.<br>리딩을 마치면 자동으로 저장됩니다.</div>`);
  $app.querySelectorAll("[data-card]").forEach(b => b.onclick = () => showCard(b.dataset.card, false, null));
  $app.querySelectorAll(".hi").forEach(b => b.onclick = () => { const x = h[+b.dataset.i];
    R = {key:x.k, v:x.v || 0, q:x.q, a:x.a || "", b:x.b || "", t:x.t, memo:x.m || "", picked:x.c.map(c => ({id:c[0], r:!!c[1]})),
      flipped:new Set(x.c.map((_, i) => i)), stage:"done", saved:true, fromHistory:true};
    renderReading(); });
  const clr = document.getElementById("clr");
  if (clr) clr.onclick = () => { if (clr.dataset.arm){ store.set("history", []); history(); }
    else { clr.dataset.arm = 1; clr.textContent = "한 번 더 누르면 전체 삭제"; setTimeout(() => { if (clr.isConnected){ delete clr.dataset.arm; clr.textContent = "기록 전체 삭제"; } }, 3000); } };
  window.scrollTo(0, 0);
}

/* ---------- library ---------- */
let libF = "all", libQ = "";
function library(){
  R = null; tab = "lib"; renderNav();
  const F = [["all","전체"],["major","메이저"],["wands","완드"],["cups","컵"],["swords","소드"],["pentacles","펜타클"]];
  $app.innerHTML = topbar("카드 사전", false) + `<input class="inp" id="ls" type="search" placeholder="카드 이름 · 키워드 검색 (예: 사랑, 돈)" value="${esc(libQ)}">
    <div class="chips" id="lf">${F.map(f => `<button class="chip${libF === f[0] ? " on" : ""}" data-f="${f[0]}">${f[1]}</button>`).join("")}</div><div class="lgrid" id="lg"></div>`;
  const draw = () => {
    const q = libQ.toLowerCase();
    const list = DECK.filter(c => (libF === "all" || (libF === "major" ? c.arcana === "major" : c.suit === libF)) &&
      (!q || [c.name, c.en, c.up, c.rev, c.u, c.l, c.w].join(" ").toLowerCase().includes(q)));
    document.getElementById("lg").innerHTML = list.length ? list.map(c => `<button class="lc" data-card="${c.id}"><div class="lci">${art(c.id)}</div><span>${c.name}</span></button>`).join("")
      : `<div class="empty" style="grid-column:1/-1">검색 결과가 없습니다</div>`;
    document.querySelectorAll("#lg [data-card]").forEach(b => b.onclick = () => showCard(b.dataset.card, false, null));
  };
  document.getElementById("ls").oninput = e => { libQ = e.target.value.trim(); draw(); };
  document.querySelectorAll("#lf .chip").forEach(b => b.onclick = () => { libF = b.dataset.f;
    document.querySelectorAll("#lf .chip").forEach(x => x.classList.toggle("on", x === b)); draw(); });
  draw(); window.scrollTo(0, 0);
}

/* ---------- tools ---------- */
function chainOf(sum){
  let s = sum; while (s > 22) s = ds(s);
  if (s === 22) return [0, 4];
  const ch = [s]; let t = s; while (t > 9){ t = ds(t); ch.push(t); } return ch;
}
function tools(){
  R = null; tab = "tools"; renderNav();
  const y = new Date().getFullYear();
  $app.innerHTML = topbar("도구", false) + `
  <div class="tcard"><h3>탄생 카드</h3><p>생년월일(양력)의 숫자를 더해 메이저 아르카나로 환원합니다. 평생 지니는 성격과 영혼의 과제를 보여 줍니다.</p>
    <div class="ab"><input class="inp" id="bd" type="date" value="${esc(settings.bd)}"><button class="cta" id="bdgo">계산</button></div><div id="bdout"></div></div>
  <div class="tcard"><h3>올해의 카드</h3><p>생일(월·일)과 연도를 더해 그해의 주제를 봅니다. 위의 생년월일을 사용합니다.</p>
    <div class="ab"><input class="inp" id="yy" type="number" inputmode="numeric" min="1900" max="2100" value="${y}"><button class="cta" id="yygo">계산</button></div><div id="yyout"></div></div>
  <div class="tcard"><h3>설정</h3>
    <div class="row"><div>역방향 카드 사용<small>끄면 모든 카드가 정방향으로 나옵니다</small></div><button class="sw ${settings.reversals ? "on" : ""}" id="rv" aria-label="역방향 토글"></button></div></div>
  <div class="tcard"><h3>정보</h3><p>X Tarot v2.0 · theXresearch<br>카드 그림: 1909년 라이더-웨이트-스미스 덱(일러스트 Pamela Colman Smith), 미국 퍼블릭 도메인.<br>리딩 기록은 이 기기의 브라우저에만 저장됩니다.</p></div>`;
  const cardsHTML = (ch, labels) => `<div class="bcs">${ch.map((n, i) => { const c = byId["M" + n];
    return `<button class="bc" data-card="${c.id}"><div class="mini">${art(c.id)}</div><div><div class="p">${labels[i]}</div><div class="n">${c.name} (${c.roman})</div><div class="m">${c.u}</div></div></button>`; }).join("")}</div>`;
  const bind = el => el.querySelectorAll("[data-card]").forEach(b => b.onclick = () => showCard(b.dataset.card, false, null));
  const parse = () => { const v = document.getElementById("bd").value; if (!v) return null; const [Y, M, D] = v.split("-").map(Number); return {Y, M, D}; };
  document.getElementById("bdgo").onclick = () => {
    const b = parse(), out = document.getElementById("bdout"); if (!b){ out.innerHTML = `<p class="err">생년월일을 입력하세요.</p>`; return; }
    settings.bd = document.getElementById("bd").value; saveSettings();
    const ch = chainOf(b.Y + b.M + b.D);
    const labels = ch.length === 1 ? ["성격 · 영혼 카드"] : ch.map((_, i) => i === 0 ? "성격 카드" : i === ch.length - 1 ? "영혼 카드" : "보조 카드");
    out.innerHTML = cardsHTML(ch, labels); bind(out);
  };
  document.getElementById("yygo").onclick = () => {
    const b = parse(), out = document.getElementById("yyout"), Y = +document.getElementById("yy").value;
    if (!b){ out.innerHTML = `<p class="err">위에 생년월일을 먼저 입력하세요.</p>`; return; }
    if (!Y){ out.innerHTML = `<p class="err">연도를 입력하세요.</p>`; return; }
    const ch = chainOf(b.M + b.D + Y);
    out.innerHTML = cardsHTML([ch[0]], [`${Y}년의 카드`]); bind(out);
  };
  document.getElementById("rv").onclick = e => { settings.reversals = !settings.reversals; saveSettings(); e.currentTarget.classList.toggle("on"); };
  if (settings.bd) document.getElementById("bdgo").click();
  window.scrollTo(0, 0);
}

/* ---------- resize / sw ---------- */
let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (R && document.getElementById("board")) layoutBoard(); }, 150); });
if ("serviceWorker" in navigator && location.protocol === "https:"){
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
home();
})();
