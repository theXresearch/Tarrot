// X Tarot v3 — 상담용 전문 리딩 엔진 & 화면
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
  set(k, v){ try{ localStorage.setItem("xtarot." + k, JSON.stringify(v)); return true; }catch(e){ toast("저장 공간이 부족합니다. 백업 후 기록을 정리하세요."); return false; } }
};
let settings = Object.assign({reversals:true, tipHidden:false, bd:"", quick:false, big:false}, store.get("settings", {}));
const saveSettings = () => store.set("settings", settings);
const clients = () => store.get("clients", []);
const clientById = id => clients().find(c => c.id === id);
let cur = store.get("cur", null); if (cur && !clientById(cur)) cur = null;
const setCur = id => { cur = id || null; store.set("cur", cur); };
document.documentElement.classList.toggle("big", !!settings.big);

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
const strip = h => String(h).replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'");
const dot = s => /[.!?]$/.test(s) ? s : s + ".";
function toast(msg){ const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2200); }
const pad = n => String(n).padStart(2, "0");
function fmtDate(t){ const d = new Date(t); return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; }
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
async function copy(text){
  try { await navigator.clipboard.writeText(text); return true; } catch(e){
    const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); let ok = false; try{ ok = document.execCommand("copy"); }catch(_){} ta.remove(); return ok; }
}
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const ds = n => String(n).split("").reduce((a, b) => a + +b, 0);
function twoTap(btn, label, armed, fn){
  btn.onclick = () => { if (btn.dataset.arm){ fn(); return; } btn.dataset.arm = 1; btn.textContent = armed;
    setTimeout(() => { if (btn.isConnected){ delete btn.dataset.arm; btn.textContent = label; } }, 3000); };
}

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
  if (avg > -1) return ["도전", "도전이 있는 흐름입니다. 신중하게 대비하면 충분히 극복할 수 있습니다."];
  return ["어려움", "지금은 버티는 시기입니다. 무리하지 말고 기반을 지키며 때를 기다리세요."];
}
function timing(c, r){
  let t;
  if (c.arcana === "major") t = MAJOR_TIME[c.number] || "상황이 충분히 무르익을 때, 대략 1~3개월";
  else if (c.court) t = ["곧, 작은 소식이나 시작으로","빠르게, 2~3주 안","무르익은 뒤, 몇 달 안","가장 늦게, 기반이 갖춰진 뒤"][c.number - 11];
  else { const n = c.number, u = SUIT_TIME[c.suit][0]; t = `약 ${u === "일~주" ? `${n}일~${n}주` : n + u} 안팎`; }
  return t + (c.suit ? ` · 계절로는 ${SUIT_TIME[c.suit][1]}` : "") + (r ? " (역방향이라 예상보다 늦어질 수 있습니다)" : "");
}
const SENS = [
  [/자살|죽고\s*싶|죽을까|목숨을|살기\s*싫|사라지고\s*싶/, "crisis", "지금 많이 힘드시다면 혼자 견디지 마세요. 미국은 988(전화·문자), 한국은 109(자살예방상담)에서 24시간 이야기를 들어 줍니다."],
  [/건강|질병|병원|아프|수술|(?:^|\s)암(?:이|을|은|\s|$)|임신|출산|치료|진단|증상|복용/, "health", "건강 질문입니다. 타로는 마음의 흐름을 보는 참고 도구일 뿐, 진단이나 치료를 대신할 수 없습니다. 증상이 있다면 꼭 의사와 상담하세요."],
  [/소송|재판|변호사|고소|법적|형사|합의금/, "legal", "법률 문제는 반드시 변호사와 상담해 결정하세요. 카드는 마음가짐과 흐름을 참고하는 용도입니다."],
  [/투자|주식|코인|비트코인|대출|부동산|매수|매도/, "money", "투자 결정은 카드만으로 하지 마세요. 객관적인 자료와 전문가의 조언을 함께 확인하세요."]
];
const sensOf = q => q ? SENS.filter(s => s[0].test(q)) : [];

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
const badge = (r, i) => spreadOf(r).dynamic === "year" ? (i === 0 ? "★" : positions(r)[i][0].replace("월", "")) : i + 1;
const spreadTitle = r => { const sp = spreadOf(r); return sp.variants ? `${sp.title} · ${sp.variants[r.v || 0].name}` : sp.title; };

/* ---------- navigation ---------- */
const NAV = [
  ["read","리딩",'<path d="M12 2l2.4 7.2H22l-6 4.5 2.3 7.3L12 16.6 5.7 21l2.3-7.3-6-4.5h7.6z"/>'],
  ["cl","손님",'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'],
  ["lib","사전",'<rect x="3" y="3" width="7" height="11" rx="1.5"/><rect x="14" y="3" width="7" height="11" rx="1.5"/><path d="M3 18h18M3 21h12"/>'],
  ["hist","기록",'<path d="M4 5h16M4 10h16M4 15h10M4 20h7"/>'],
  ["tools","도구",'<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>']
];
function renderNav(){
  $nav.innerHTML = NAV.map(n => `<button data-t="${n[0]}" class="${tab === n[0] ? "on" : ""}" aria-label="${n[1]}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${n[2]}</svg>${n[1]}</button>`).join("");
  $nav.querySelectorAll("button").forEach(b => b.onclick = () => ({read:home, cl:clientsView, lib:library, hist:history, tools:tools})[b.dataset.t]());
}
const topbar = (title, back) =>
  `<div class="top">${back ? `<button class="iconbtn" id="back" aria-label="뒤로">‹</button>` : `<div style="width:44px"></div>`}<h2>${title}</h2><div style="width:44px"></div></div>`;
function curBanner(){
  const c = cur && clientById(cur); if (!c) return "";
  return `<div class="curb"><span>상담 중 · <b>${esc(c.name)}</b> 님</span><button id="curx">상담 종료</button></div>`;
}
function bindCur(after){ const x = document.getElementById("curx"); if (x) x.onclick = () => { setCur(null); toast("상담을 종료했습니다"); after(); }; }

/* ---------- HOME ---------- */
let topicSel = -1;
function home(){
  R = null; tab = "read"; renderNav();
  const groups = [["기본","기본 리딩"],["주제별","주제별 리딩"],["심층","심층 리딩"],["시기","시기 리딩"]];
  const tip = (!isStandalone() && !settings.tipHidden) ? `<div class="tip"><button id="tipx" aria-label="닫기">×</button>
    <b>앱처럼 쓰기</b><br>${isIOS() ? "Safari 하단 <b>공유 버튼</b> → <b>홈 화면에 추가</b>" : "Chrome 오른쪽 위 <b>⋮ 메뉴</b> → <b>홈 화면에 추가</b>"}</div>` : "";
  const reco = topicSel >= 0 ? `<div class="reco">${TOPICS[topicSel][1].map(([k, v, why], j) => { const s = SPREADS[k];
      return `<button class="rbtn" data-s="${k}" data-v="${v}">${j === 0 ? '<span class="rtag">추천</span>' : ""}<div class="ic">${s.icon}</div><div><b>${s.variants ? s.title + " · " + s.variants[v].name : s.title}</b><span>${why}</span></div></button>`; }).join("")}</div>` : "";
  $app.innerHTML = `${curBanner()}
  <div class="hero"><h1>X TAROT</h1><p>마음을 가라앉히고, 질문을 떠올리세요</p></div>
  <div class="lbl">무엇이 궁금하세요?</div>
  <div class="chips" id="topics">${TOPICS.map((t, i) => `<button class="chip${i === topicSel ? " on" : ""}" data-t="${i}">${t[0]}</button>`).join("")}</div>
  ${reco}
  <button class="mbtn" data-s="one"><div class="ic">1</div><div><b>오늘의 카드</b><span>${cur ? "손님의 오늘 메시지 한 장" : "하루 한 장, 오늘의 메시지"}</span></div></button>
  ${groups.map(([g, label]) => `<div class="grp">${label}</div>
    <div class="sgrid">${Object.entries(SPREADS).filter(([k, s]) => s.group === g && k !== "one").map(([k, s]) =>
      `<button class="sbtn" data-s="${k}"><div class="ic">${s.icon}</div><b>${s.title}</b><span>${s.desc}</span><em>${s.count}장</em></button>`).join("")}</div>`).join("")}
  ${tip}`;
  $app.querySelectorAll("[data-s]").forEach(b => b.onclick = () => start(b.dataset.s, +(b.dataset.v || 0)));
  $app.querySelectorAll("#topics .chip").forEach(b => b.onclick = () => { const t = +b.dataset.t; topicSel = topicSel === t ? -1 : t; home(); });
  const tx = document.getElementById("tipx"); if (tx) tx.onclick = () => { settings.tipHidden = true; saveSettings(); home(); };
  bindCur(home);
  window.scrollTo(0, 0);
}

/* ---------- READING FLOW ---------- */
function start(key, v){
  if (key === "one"){
    const today = store.get("history", []).find(x => x.k === "one" && (x.cl || null) === (cur || null) && sameDay(x.t, Date.now()));
    if (today){ openHistory(today, `오늘의 카드는 하루 한 장입니다. ${cur ? "이 손님은" : ""} 오늘 이미 뽑은 카드입니다. 내일 새 카드를 뽑을 수 있습니다.`); return; }
  }
  R = {key, v:v || 0, q:"", a:"", b:"", t:Date.now(), deck:null, picked:[], flipped:new Set(), saved:false, stage:"ask", memo:"", cl:cur};
  renderReading();
}
function openHistory(x, note){
  R = {key:x.k, v:x.v || 0, q:x.q, a:x.a || "", b:x.b || "", t:x.t, memo:x.m || "", cl:x.cl || null, note,
    picked:x.c.map(c => ({id:c[0], r:!!c[1]})), flipped:new Set(x.c.map((_, i) => i)), stage:"done", saved:true, fromHistory:true};
  renderReading();
}
function whoSelect(){
  const cs = clients();
  return `<div class="lbl">상담 대상</div><select class="inp" id="who"><option value="">나 (본인)</option>
    ${cs.map(c => `<option value="${c.id}"${R.cl === c.id ? " selected" : ""}>${esc(c.name)}</option>`).join("")}<option value="__new">+ 새 손님 등록</option></select>
    <div class="ab" id="nw" hidden style="margin-top:8px"><input class="inp" id="nn" maxlength="30" placeholder="손님 이름"><button class="cta" id="nnok">등록</button></div>`;
}
function renderReading(){
  const sp = spreadOf(R);
  let body = "";
  if (R.stage === "ask"){
    body = `<p class="sdesc">${sp.desc} · ${sp.count}장</p>${whoSelect()}
      ${sp.variants ? `<div class="lbl">관점 선택</div><div class="chips" id="vars">${sp.variants.map((v, i) => `<button class="chip${i === R.v ? " on" : ""}" data-v="${i}">${v.name}</button>`).join("")}</div>` : ""}
      ${sp.choice ? `<div class="lbl">두 가지 선택지</div><div class="ab"><input class="inp" id="oa" maxlength="20" placeholder="A (예: 이직)" value="${esc(R.a)}"><input class="inp" id="ob" maxlength="20" placeholder="B (예: 현 직장)" value="${esc(R.b)}"></div>` : ""}
      <div class="lbl">질문</div>
      <textarea class="q" id="q" placeholder="예: ${esc(sp.tips[0])}" maxlength="200">${esc(R.q)}</textarea>
      <div class="chips">${sp.tips.map(t => `<button class="chip tipq">${esc(t)}</button>`).join("")}</div>
      <p class="qguide">좋은 질문: “~하면 어떻게 될까?”, “~를 위해 무엇을 해야 할까?”처럼 열린 질문이 더 깊은 답을 줍니다. ${sp.dynamic === "year" ? "이번 달부터 12개월을 봅니다." : sp.dynamic === "week" ? "오늘부터 7일을 봅니다." : ""}</p>
      <div id="warn"></div>
      <button class="cta" id="go">카드 섞기</button>`;
  } else if (R.stage === "shuffle"){
    body = `${R.q ? `<div class="qshow">“${esc(R.q)}”</div>` : ""}
      <div class="sky"><canvas class="stars"></canvas><div class="orbit"><div class="orb"></div>${[0,1,2,3,4,5].map(i => `<div class="oc" style="--i:${i}">${BACK}</div>`).join("")}</div></div>
      <p class="hint">질문을 마음속으로 떠올리며 원하는 만큼 섞으세요.<br>손님이 직접 멈추게 하세요.</p>
      <button class="cta" id="stop" disabled>그만 섞기</button>`;
  } else if (R.stage === "cut"){
    body = `${R.q ? `<div class="qshow">“${esc(R.q)}”</div>` : ""}
      <p class="hint" style="margin-top:20px">덱을 세 묶음으로 나눴습니다.<br>마음이 가는 묶음 하나를 고르세요.</p>
      <div class="piles">${[0,1,2].map(i => `<button class="pile" data-p="${i}" aria-label="${i+1}번째 묶음"><div>${BACK}</div><div>${BACK}</div><div>${BACK}</div><span>${["첫째","둘째","셋째"][i]}</span></button>`).join("")}</div>`;
  } else {
    body = `${R.note ? `<div class="note">${esc(R.note)}</div>` : ""}${R.cl && clientById(R.cl) ? `<div class="who">${esc(clientById(R.cl).name)} 님 · ${fmtDate(R.t)}</div>` : ""}
      ${R.q ? `<div class="qshow">“${esc(R.q)}”</div>` : ""}<div class="board" id="board"></div><div id="below"></div>`;
  }
  $app.innerHTML = topbar(R.stage === "ask" ? sp.title : spreadTitle(R), true) + body;
  document.getElementById("back").onclick = () => R.fromHistory ? history() : home();
  if (R.stage === "ask") bindAsk(sp);
  if (R.stage === "shuffle"){
    startStars(document.querySelector(".sky .stars"));
    const stop = document.getElementById("stop");
    setTimeout(() => { if (stop.isConnected) stop.disabled = false; }, 1200);
    stop.onclick = () => { R.deck = shuffled(); R.stage = "cut"; renderReading(); };
  }
  if (R.stage === "cut") $app.querySelectorAll(".pile").forEach(b => b.onclick = () => {
    const p = +b.dataset.p, piles = [R.deck.slice(0, 26), R.deck.slice(26, 52), R.deck.slice(52)];
    R.deck = piles[p].concat(piles.filter((_, i) => i !== p).flat());
    b.classList.add("chosen"); setTimeout(() => { R.stage = "pick"; renderReading(); }, 350);
  });
  if (["pick","reveal","done"].includes(R.stage)){ layoutBoard(); renderBelow(); }
  window.scrollTo(0, 0);
}
function bindAsk(sp){
  const who = document.getElementById("who"), nw = document.getElementById("nw");
  who.onchange = () => { if (who.value === "__new"){ nw.hidden = false; document.getElementById("nn").focus(); } else { nw.hidden = true; R.cl = who.value || null; setCur(R.cl); } };
  document.getElementById("nnok").onclick = () => {
    const name = document.getElementById("nn").value.trim(); if (!name){ toast("손님 이름을 입력하세요"); return; }
    const c = {id:"c" + Date.now(), name, bd:"", note:"", t:Date.now()}; const cs = clients(); cs.unshift(c); store.set("clients", cs);
    R.q = document.getElementById("q").value; R.cl = c.id; setCur(c.id); toast(`${name} 님을 등록했습니다`); renderReading();
  };
  const vars = document.getElementById("vars");
  if (vars) vars.querySelectorAll(".chip").forEach(c => c.onclick = () => {
    R.v = +c.dataset.v; vars.querySelectorAll(".chip").forEach(x => x.classList.toggle("on", x === c)); });
  $app.querySelectorAll(".tipq").forEach(c => c.onclick = () => { document.getElementById("q").value = c.textContent; });
  const go = force => {
    R.q = document.getElementById("q").value.trim();
    if (sp.choice){ R.a = document.getElementById("oa").value.trim(); R.b = document.getElementById("ob").value.trim(); }
    if (!force && R.q){
      const prev = store.get("history", []).find(x => x.k === R.key && x.q === R.q && (x.cl || null) === (R.cl || null) && Date.now() - x.t < 864e5);
      if (prev){
        const h = Math.max(1, Math.round((Date.now() - prev.t) / 36e5));
        document.getElementById("warn").innerHTML = `<div class="note">같은 질문으로 약 ${h}시간 전에 리딩했습니다. 타로는 처음 뽑은 카드가 답입니다. 원하는 답이 나올 때까지 다시 뽑으면 답이 흐려집니다.
          <div class="btns"><button class="cta ghost" id="prevr">이전 결과 보기</button><button class="cta ghost" id="force">상황이 바뀌어 다시 보기</button></div></div>`;
        document.getElementById("prevr").onclick = () => openHistory(prev, null);
        document.getElementById("force").onclick = () => go(true);
        document.getElementById("warn").scrollIntoView({behavior:"smooth", block:"center"});
        return;
      }
    }
    R.t = Date.now();
    if (settings.quick){ R.deck = shuffled(); R.stage = "pick"; renderReading(); setTimeout(() => { const a = document.getElementById("auto"); if (a) a.click(); }, 400); }
    else { R.stage = "shuffle"; renderReading(); }
  };
  document.getElementById("go").onclick = () => go(false);
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
      <div class="wheelwrap" id="ww"><canvas class="stars"></canvas><div class="halo"></div><div class="wheel" id="wheel"></div></div>
      <p class="hint">손가락으로 카드 바퀴를 돌리세요.<br>가운데 떠오른 카드나 끌리는 카드를 탭하면 뽑힙니다.</p>
      <button class="cta ghost" id="auto">운명에 맡기기</button>`;
    initWheel();
  } else if (R.stage === "reveal"){
    el.innerHTML = `<p class="hint" style="margin-top:22px">카드를 탭해서 한 장씩 뒤집으세요</p><button class="cta" id="all">모두 뒤집기</button>`;
    document.getElementById("all").onclick = () => { for (let i = 0; i < n; i++) setTimeout(() => flip(i), i * 130); };
  } else if (R.stage === "done"){
    el.innerHTML = results();
    bindResults(el);
  }
}
function pick(k, fromEl){
  const n = spreadOf(R).count;
  if ((R.nextSlot || 0) >= n) return false;
  const i = R.nextSlot = (R.nextSlot || 0) + 1, slotI = i - 1;
  R.flying = (R.flying || 0) + 1;
  const done = () => {
    R.flying--; R.picked[slotI] = R.deck[k]; updateSlot(slotI);
    const s = document.querySelector(`.slot[data-i="${slotI}"]`); if (s){ s.classList.add("land"); setTimeout(() => s.classList.remove("land"), 900); }
    const left = n - R.picked.filter(Boolean).length;
    const c = document.querySelector(".counter"); if (c) c.textContent = left > 0 ? `카드 ${left}장을 더 골라주세요` : "준비 완료";
    if (left === 0 && !R.flying) setTimeout(() => { if (R.stage === "pick"){ R.stage = "reveal"; WH = null; renderBelow(); } }, 500);
  };
  const slot = document.querySelector(`.slot[data-i="${slotI}"]`);
  if (!fromEl || !slot || matchMedia("(prefers-reduced-motion: reduce)").matches){ done(); return true; }
  const a = fromEl.getBoundingClientRect(), b = slot.getBoundingClientRect();
  const f = document.createElement("div"); f.className = "fly"; f.innerHTML = BACK;
  Object.assign(f.style, {left:a.left + "px", top:a.top + "px", width:a.width + "px", height:a.height + "px"});
  document.body.appendChild(f);
  const sw = slot.classList.contains("rot") ? b.height : b.width, sh = slot.classList.contains("rot") ? b.width : b.height;
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    f.style.transform = `translate(${dx}px,${dy}px) scale(${sw / a.width},${sh / a.height})${slot.classList.contains("rot") ? " rotate(90deg)" : ""}`;
    f.classList.add("go");
  }));
  setTimeout(() => { f.remove(); done(); }, 720);
  return true;
}

/* ---------- card wheel (연출 전용 — 카드는 이미 셔플된 덱 순서에서 뽑힘) ---------- */
let WH = null;
function initWheel(){
  const ww = document.getElementById("ww"), wheel = document.getElementById("wheel");
  startStars(ww.querySelector(".stars"));
  const W = ww.clientWidth, H = ww.clientHeight, cw = 60, chh = 102;
  const Rr = Math.max(360, W * 1.1), step = (34 / Rr) * 180 / Math.PI;
  const cx = W / 2, cy = H * 0.5 + Rr;
  const avail = R.deck.map((_, k) => k);
  wheel.innerHTML = avail.map(k => `<button class="wc" data-k="${k}" aria-label="카드">${BACK}</button>`).join("");
  WH = {ww, wheel, W, H, cw, chh, Rr, step, cx, cy, rot:0, vel:0, focus:-1, raf:0, busy:false,
        els:[...wheel.querySelectorAll(".wc")]};
  wheelLayout();
  let drag = null;
  ww.onpointerdown = e => { if (WH.busy) return; cancelAnimationFrame(WH.raf); drag = {x:e.clientX, t:performance.now(), moved:0}; WH.vel = 0; };
  ww.onpointermove = e => { if (!drag) return;
    const now = performance.now(), dx = e.clientX - drag.x, dDeg = dx / WH.Rr * 180 / Math.PI * 1.15;
    drag.moved += Math.abs(dx); drag.x = e.clientX;
    WH.vel = dDeg / Math.max(8, now - drag.t) * 16; drag.t = now;
    WH.rot = clampRot(WH.rot + dDeg); wheelLayout(); };
  const end = e => { if (!drag) return; const d = drag; drag = null;
    if (d.moved < 8){ const t = document.elementFromPoint(e.clientX, e.clientY); const c = t && t.closest(".wc"); if (c) chooseFromWheel(c); return; }
    coast(); };
  ww.onpointerup = end; ww.onpointercancel = () => { drag = null; coast(); };
  document.getElementById("auto").onclick = autoPick;
}
function clampRot(r){ const m = WH.els.length, lim = (m - 1) / 2 * WH.step + 2; return Math.max(-lim, Math.min(lim, r)); }
function wheelLayout(){
  const {els, step, rot, cx, cy, cw, chh, Rr} = WH, m = els.length;
  let best = -1, bestA = 999;
  els.forEach((el, j) => { const a = (j - (m - 1) / 2) * step + rot; if (Math.abs(a) < bestA){ bestA = Math.abs(a); best = j; } el._a = a; });
  if (best !== WH.focus){ WH.focus = best; if (navigator.vibrate) try{ navigator.vibrate(4); }catch(e){} }
  els.forEach((el, j) => {
    const a = el._a, f = j === best, vis = Math.abs(a) < 62;
    el.style.visibility = vis ? "visible" : "hidden";
    if (!vis) return;
    el.style.transform = `translate(${cx - cw / 2}px,${cy - chh / 2}px) rotate(${a}deg) translateY(${-Rr - (f ? 26 : 0)}px) scale(${f ? 1.18 : 1})`;
    el.style.zIndex = f ? 200 : 100 - Math.round(Math.abs(a));
    el.classList.toggle("focus", f);
  });
}
function coast(onStop, decay){
  const tick = () => {
    WH.rot = clampRot(WH.rot + WH.vel); WH.vel *= (decay || 0.94); wheelLayout();
    if (Math.abs(WH.vel) > 0.04){ WH.raf = requestAnimationFrame(tick); return; }
    // 가장 가까운 카드에 정렬
    const m = WH.els.length, target = -((WH.focus - (m - 1) / 2) * WH.step);
    const snap = () => { WH.rot += (target - WH.rot) * 0.25; wheelLayout();
      if (Math.abs(target - WH.rot) > 0.02) WH.raf = requestAnimationFrame(snap); else { WH.rot = target; wheelLayout(); if (onStop) onStop(); } };
    snap();
  };
  WH.raf = requestAnimationFrame(tick);
}
function chooseFromWheel(el){
  if (!WH || !el.isConnected) return;
  if (!pick(+el.dataset.k, el)) return;
  el.classList.add("taken");
  WH.els = WH.els.filter(x => x !== el);
  WH.wheel.classList.add("ease");
  setTimeout(() => { el.remove(); }, 10);
  WH.rot = clampRot(WH.rot); wheelLayout();
  setTimeout(() => { if (WH) WH.wheel.classList.remove("ease"); }, 380);
}
function autoPick(){
  if (!WH || WH.busy) return; WH.busy = true;
  const btn = document.getElementById("auto"); if (btn) btn.disabled = true;
  const n = spreadOf(R).count;
  const next = () => {
    if (!WH) return;
    if ((R.nextSlot || 0) >= n){ WH.busy = false; return; }
    if (settings.quick){ chooseFromWheel(WH.els[WH.focus]); setTimeout(next, 220); return; }
    const first = !R.spun; R.spun = true;
    WH.vel = (rand(2) ? 1 : -1) * (first ? 6 + rand(6) : 1.5 + rand(3));
    coast(() => setTimeout(() => { if (WH){ chooseFromWheel(WH.els[WH.focus]); setTimeout(next, first ? 500 : 300); } }, first ? 250 : 120), first ? 0.95 : 0.86);
  };
  next();
}
let starRaf = 0;
function startStars(cv){
  if (!cv || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
  cv.width = w * dpr; cv.height = h * dpr; const g = cv.getContext("2d"); g.scale(dpr, dpr);
  const S = Array.from({length:Math.round(w * h / 1800)}, () => ({x:Math.random() * w, y:Math.random() * h, r:Math.random() * 1.3 + .3, p:Math.random() * 6.3, s:Math.random() * .03 + .01, gold:Math.random() < .3}));
  cancelAnimationFrame(starRaf);
  const draw = () => {
    if (!cv.isConnected) return;
    g.clearRect(0, 0, w, h);
    S.forEach(s => { s.p += s.s; const o = .25 + .75 * (0.5 + 0.5 * Math.sin(s.p));
      g.globalAlpha = o; g.fillStyle = s.gold ? "#f0d79a" : "#ffffff"; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 6.283); g.fill(); });
    starRaf = requestAnimationFrame(draw);
  };
  draw();
}
function tapSlot(i){
  const pk = R.picked[i]; if (!pk || R.stage === "pick") return;
  if (!R.flipped.has(i)) flip(i); else showCard(pk.id, pk.r, positions(R)[i]);
}
function flip(i){
  if (R.flipped.has(i)) return;
  R.flipped.add(i);
  const card = document.querySelector(`.slot[data-i="${i}"] .card`);
  if (card){ card.classList.add("flipped"); const s = card.parentElement; setTimeout(() => { s.classList.add("flash"); setTimeout(() => s.classList.remove("flash"), 1100); }, 250); }
  if (R.flipped.size === spreadOf(R).count) setTimeout(() => { R.stage = "done"; save(); renderBelow();
    document.getElementById("below").scrollIntoView({behavior:"smooth", block:"start"}); }, 800);
}

/* ---------- INTERPRETATION ENGINE ---------- */
function analyze(){
  const sp = spreadOf(R), P = positions(R), dom = domainOf(R), ch = sp.ch || [], hf = sp.hf || [];
  const C = R.picked.map((p, i) => { const c = byId[p.id];
    return {i, c, r:p.r, s:score(c, p.r), pos:P[i], t:ch.includes(i) ? "ch" : hf.includes(i) ? "hf" : ""}; });
  const core = C.filter(x => !x.t);
  return {sp, P, dom, C, n:C.length, avg:mean((core.length ? core : C).map(x => x.s))};
}
// 위치를 반영한 해석: 장애 자리에 좋은 카드가 오면 그 카드의 그림자를 읽는다
const mainText = x => (x.t === "ch" && !x.r && x.c.yn >= 0) ? `걸림돌 자리에서는 이 카드의 그림자를 읽습니다. ${dot(x.c.sh)}` : (x.r ? x.c.r : x.c.u);
function domText(x, dom){
  if (x.t === "ch" && !x.r && x.c.yn >= 0) return "";
  if (dom === "love") return dot(x.r ? x.c.lr : x.c.l);
  if (dom === "work") return dot(x.r ? x.c.wr : x.c.w);
  return "";
}
function yesNoVerdict(A){
  const C = A.C, total = C[0].s + C[1].s + C[2].s * 1.5;
  const v = total >= 3 ? ["예", "흐름이 분명하게 긍정적입니다. 진행해도 좋습니다."] :
    total >= 1 ? ["아마도 예", "긍정 쪽으로 기울어 있습니다. 핵심 변수만 잘 관리하면 됩니다."] :
    total > -1 ? ["보류 · 조건부", "아직 결정되지 않았습니다. 조건이 바뀌면 결과도 달라집니다."] :
    total > -3 ? ["아마도 아니오", "부정 쪽으로 기울어 있습니다. 지금은 신중함이 필요합니다."] :
    ["아니오", "흐름이 분명하게 막혀 있습니다. 다른 길이나 다른 시기를 찾으세요."];
  return {total, v};
}
function choiceVerdict(A){
  const C = A.C, a = R.a || "A", b = R.b || "B";
  const sa = C[1].s + C[2].s * 1.5, sb = C[3].s + C[4].s * 1.5;
  const win = sa - sb >= 1.5 ? 0 : sb - sa >= 1.5 ? 1 : -1;
  const text = win === 0 ? `<b>${esc(a)}</b> 쪽 흐름이 더 밝습니다.` : win === 1 ? `<b>${esc(b)}</b> 쪽 흐름이 더 밝습니다.` :
    "두 길의 차이가 크지 않습니다. 결과 카드의 내용과 자신의 가치관을 기준으로 선택하세요.";
  return {sa, sb, win, text, a, b};
}
function timelineInfo(A){
  const list = A.sp.dynamic === "year" ? A.C.slice(1) : A.C;
  const hi = Math.max(...list.map(x => x.s)), lo = Math.min(...list.map(x => x.s));
  return {best:list.filter(x => x.s === hi).slice(0, 3), worst:lo < 0 ? list.filter(x => x.s === lo).slice(0, 3) : []};
}
const nm = x => `<b>${cname(x.c, x.r)}</b>`;
function oneLine(A){
  const {sp, C, n, dom} = A;
  if (dom === "yesno") return yesNoVerdict(A).v[0];
  if (sp.choice) return choiceVerdict(A).text;
  if (n === 1) return `${cname(C[0].c, C[0].r)} — ${kw(C[0].c, C[0].r)}`;
  if (sp.dynamic === "year") return `올해의 테마 · ${cname(C[0].c, C[0].r)} — ${kw(C[0].c, C[0].r)}`;
  if (sp.dynamic === "week") return `이번 주 흐름 · ${toneOf(A.avg)[0]}`;
  const last = C[sp.key[sp.key.length - 1]];
  return `결론 카드 · ${cname(last.c, last.r)} — ${kw(last.c, last.r)}`;
}
function story(A){
  const {sp, C, n, dom} = A, s = [];
  if (n === 1){ const x = C[0]; s.push(`${nm(x)} 카드가 나왔습니다. ${mainText(x)}`); const d = domText(x, dom); if (d) s.push(d); s.push(`조언은 “${x.c.a}”입니다.`); return s.join(" "); }
  if (sp.dynamic){
    const ti = timelineInfo(A), x = C[0], f = arr => arr.map(y => `${esc(y.pos[0])}(${cname(y.c, y.r)})`).join(", ");
    s.push(sp.dynamic === "year" ? `앞으로 1년을 관통하는 카드는 ${nm(x)}입니다. ${mainText(x)}` : `오늘은 ${nm(x)} 카드의 날입니다. ${mainText(x)}`);
    s.push(`가장 흐름이 좋은 시기는 ${f(ti.best)}입니다.`);
    s.push(ti.worst.length ? `${f(ti.worst)}에는 무리하지 말고 조심하세요.` : "특별히 어려운 시기는 보이지 않습니다.");
    return s.join(" ");
  }
  if (dom === "yesno"){ const y = yesNoVerdict(A);
    s.push(`답은 <b>‘${y.v[0]}’</b>입니다. ${y.v[1]}`);
    s.push(`결과를 좌우하는 변수는 ${nm(C[1])} 카드입니다. ${mainText(C[1])}`);
    s.push(`조언은 “${C[1].c.a}”입니다.`); return s.join(" "); }
  const k0 = C[sp.key[0]], kl = C[sp.key[sp.key.length - 1]];
  if (sp.choice){ const cv = choiceVerdict(A);
    s.push(`지금 ${nm(C[0])} 카드가 보여 주듯, ${mainText(C[0])}`);
    s.push(`${esc(cv.a)}을(를) 택하면 ${nm(C[2])}, ${esc(cv.b)}을(를) 택하면 ${nm(C[4])} 카드로 이어집니다.`);
    s.push(cv.text); return s.join(" "); }
  s.push(`지금 상황의 중심에는 ${nm(k0)} 카드가 있습니다. ${mainText(k0)}`);
  (sp.ch || []).forEach(i => s.push(`걸림돌은 ${nm(C[i])} 카드입니다. ${mainText(C[i])}`));
  (sp.adv || []).filter(i => i !== sp.key[0]).forEach(i => s.push(`카드가 권하는 해법은 “${C[i].c.a}”입니다.`));
  if (kl !== k0){ s.push(`이 흐름대로 가면 ${nm(kl)} 카드로 이어집니다. ${mainText(kl)}`);
    const d = domText(kl, dom); if (d) s.push(`${dom === "love" ? "관계로 보면" : "일·재물로 보면"} ${d}`); }
  s.push(toneOf(A.avg)[1]);
  return s.join(" ");
}
function timingCard(A){
  const {sp, C, n, dom} = A;
  if (sp.dynamic || n === 1) return null;
  if (dom === "yesno") return C[2];
  if (sp.choice){ const cv = choiceVerdict(A); return cv.win === 1 ? C[4] : C[2]; }
  return C[sp.key[sp.key.length - 1]];
}
function answerBox(A){
  const sens = sensOf(R.q), tc = timingCard(A), t = toneOf(A.avg), pct = Math.max(3, Math.min(97, (A.avg + 2) / 4 * 100));
  const calm = [...new Set(A.C.filter(x => CALM[x.c.id]).map(x => x.c.id))];
  return `${sens.map(s => `<div class="note ${s[1]}">${s[2]}</div>`).join("")}
    <div class="head"><div class="hl">${R.q ? "질문에 대한 답" : "리딩의 답"}</div>
    <div class="one">${oneLine(A)}</div>${A.dom === "yesno" ? `<div class="vs">기운 점수 ${(t => (t > 0 ? "+" : "") + t.toFixed(1))(yesNoVerdict(A).total)} · 결과 카드 1.5배 가중</div>` : ""}
    <p class="story">${story(A)}</p>
    ${tc ? `<div class="when"><i>시기</i>${timing(tc.c, tc.r)}<small>결론 카드(${tc.c.name})로 본 전통 타이밍 기법의 참고 시기</small></div>` : ""}
    <div class="gauge"><i style="left:${pct}%"></i></div><div class="glab"><span>도전</span><span>흐름 지수 · <b>${t[0]}</b></span><span>긍정</span></div></div>
    ${calm.length ? `<div class="note calm">${calm.map(id => CALM[id]).join("<br>")}</div>` : ""}`;
}
const sec = (title, body, open) => `<details class="sec"${open ? " open" : ""}><summary>${title}</summary><div class="secb">${body}</div></details>`;
function results(){
  const A = analyze(), {sp, C, n, dom} = A, out = [answerBox(A)];
  if (sp.choice){ const cv = choiceVerdict(A), bar = s => Math.max(4, Math.min(100, (s + 5) / 10 * 100));
    out.push(`<div class="verdict"><div class="hl">선택 비교</div><div class="cmp">
      <div><span>${esc(cv.a)}</span><div class="bar"><i style="width:${bar(cv.sa)}%"></i></div><small>결과: ${cname(C[2].c, C[2].r)}</small></div>
      <div><span>${esc(cv.b)}</span><div class="bar"><i style="width:${bar(cv.sb)}%"></i></div><small>결과: ${cname(C[4].c, C[4].r)}</small></div></div><p>${cv.text}</p></div>`); }
  out.push(sec(`위치별 리딩 · ${n}장`, C.map(x => item(x, A)).join(""), n <= 3));
  if (sp.pairs && sp.pairs.length) out.push(sec("카드 간 관계", sp.pairs.map(p => pairHTML(A, p)).join(""), false));
  if (n >= 3) out.push(sec("에너지 분석", energy(A), false));
  const cb = combos(A); if (cb) out.push(sec("특별 조합", cb, true));
  if (n >= 3) out.push(sec("정수 카드 (퀸테센스)", quint(A), false));
  out.push(advice(A));
  out.push(`<h3>리딩 노트</h3><textarea class="q" id="memo" placeholder="상담 내용, 손님 반응, 실제로 일어난 일을 기록해 두세요." maxlength="2000">${esc(R.memo)}</textarea>
    <div class="btns"><button class="cta" id="share">결과 보내기</button><button class="cta ghost" id="cp">AI 심층 해석 복사</button></div>
    <div class="btns"><button class="cta ghost" id="again">새 리딩</button><button class="cta ghost" id="homeb">${R.fromHistory ? "기록으로" : "홈으로"}</button></div>
    <p class="disc">타로는 마음의 흐름을 비추는 참고 자료입니다. 중요한 결정은 스스로의 판단과 전문가의 조언을 함께 고려하세요.</p>`);
  return `<div class="res">${out.join("")}</div>`;
}
function bindResults(el){
  document.getElementById("cp").onclick = async () => toast(await copy(aiText()) ? "복사됨 — Claude에 붙여넣으세요" : "복사 실패");
  document.getElementById("share").onclick = async () => {
    const text = shareText();
    if (navigator.share){ try { await navigator.share({title:"X Tarot 리딩", text}); return; } catch(e){ if (e && e.name === "AbortError") return; } }
    toast(await copy(text) ? "결과를 복사했습니다. 메시지에 붙여넣으세요" : "복사 실패");
  };
  document.getElementById("again").onclick = () => start(R.key, R.v);
  document.getElementById("homeb").onclick = () => R.fromHistory ? history() : home();
  el.querySelectorAll(".it").forEach(x => x.onclick = () => { const p = R.picked[+x.dataset.i]; showCard(p.id, p.r, positions(R)[+x.dataset.i]); });
  el.querySelectorAll("[data-card]").forEach(x => x.onclick = () => showCard(x.dataset.card, false, null));
  let mt; document.getElementById("memo").oninput = e => { R.memo = e.target.value; clearTimeout(mt); mt = setTimeout(saveMemo, 400); };
}
function item(x, A){
  const {c, r, i, pos, t} = x, dom = A.dom, isAdv = (A.sp.adv || []).includes(i);
  const d = domText(x, dom);
  let extra = d ? `<p class="m2"><i>${dom === "love" ? "연애" : "일·재물"}</i>${d}</p>` : "";
  if (isAdv) extra += `<p class="m2"><i>조언</i>${c.a}</p>`;
  if (CALM[c.id]) extra += `<p class="m2 calmi"><i>안심</i>${CALM[c.id]}</p>`;
  return `<div class="it" data-i="${i}"><div class="mini${r ? " rev" : ""}">${art(c.id)}</div><div class="itb">
    <div class="p">${A.n > 1 ? badge(R, i) + ". " : ""}${esc(pos[0])}${t === "ch" ? ' <span class="pt">걸림돌</span>' : t === "hf" ? ' <span class="pt">희망·두려움</span>' : ""}</div>
    <div class="n">${c.name}<span class="tag ${r ? "rv" : "up"}">${r ? "역방향" : "정방향"}</span></div>
    <div class="k">${r ? c.rev : c.up}</div>
    <p class="m">${mainText(x)}</p>${extra}
    <div class="d">${esc(pos[1])}</div></div></div>`;
}
function pairHTML(A, p){
  const a = A.C[p[0]], b = A.C[p[1]], rel = relation(a.c.el, b.c.el);
  let cmp;
  const chx = [a, b].find(x => x.t === "ch");
  if (chx) cmp = (chx.s <= -1 || chx.r) ? "걸림돌이 만만치 않습니다. 정면으로 부딪히기보다 돌아가는 전략이 필요합니다." : "걸림돌은 크지 않습니다. 의식하고 관리하면 충분히 넘을 수 있습니다.";
  else if (p[2].includes("→")) cmp = b.s - a.s >= 2 ? "뒤로 갈수록 흐름이 크게 좋아집니다." : b.s - a.s >= 1 ? "흐름이 점차 나아집니다." :
    b.s - a.s <= -2 ? "뒤로 갈수록 어려움이 커집니다. 미리 대비하세요." : b.s - a.s <= -1 ? "흐름이 다소 약해집니다." : "비슷한 강도의 기운이 이어집니다.";
  else cmp = b.s > a.s + 1 ? `‘${esc(b.pos[0])}’ 쪽 기운이 더 밝습니다.` : a.s > b.s + 1 ? `‘${esc(a.pos[0])}’ 쪽 기운이 더 밝습니다.` : "두 위치의 기운이 비슷하게 맞서 있습니다.";
  return `<div class="pair"><b>${esc(p[2])}</b>
    <div class="pc">${cname(a.c, a.r)} (${ELEMENTS[a.c.el].ko}) ↔ ${cname(b.c, b.r)} (${ELEMENTS[b.c.el].ko}) · 원소 <b>${rel[0]}</b></div>
    <p>${rel[1]} ${cmp}</p></div>`;
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
  if (revs / n >= .5) out.push(`역방향이 ${revs}장입니다. 지연, 내적 저항, 재검토가 필요한 부분이 많습니다. 서두르기보다 점검이 우선입니다.`);
  else if (revs === 0 && settings.reversals) out.push("모든 카드가 정방향입니다. 에너지가 막힘 없이 흐르고 있습니다.");
  const courts = C.filter(x => x.c.court).length;
  if (courts >= 2) out.push(`인물 카드가 ${courts}장입니다. 주변 사람들의 영향과 관계가 결과에 크게 작용합니다.`);
  const rc = {}; C.filter(x => x.c.arcana === "minor").forEach(x => rc[x.c.number] = (rc[x.c.number] || 0) + 1);
  Object.entries(rc).filter(([k, v]) => v >= 2).forEach(([k, v]) => out.push(`${+k <= 10 ? (k === "1" ? "에이스" : "숫자 " + k) : RANKS[k - 1][0]} 카드가 ${v}장 — ${RANK_REPEAT[k - 1]}`));
  const pv = C.filter(x => x.c.arcana === "minor" && !x.c.court).map(x => x.c.number);
  if (pv.length >= 3){ const m = mean(pv);
    out.push(`마이너 카드의 평균 숫자는 ${m.toFixed(1)}입니다. ${m <= 3.5 ? "일이 아직 <b>초기 단계</b>에 있습니다." : m <= 6.5 ? "일이 <b>한창 진행 중</b>입니다." : "일이 <b>마무리 단계</b>에 들어섰습니다."}`); }
  return `<div class="ebars">${bars}</div><ul class="bul">${out.map(s => `<li>${s}</li>`).join("")}</ul>`;
}
function combos(A){
  const ids = new Set(A.C.map(x => x.c.id));
  const hit = COMBOS.filter(c => ids.has(c[0]) && ids.has(c[1]));
  return hit.map(h => `<div class="pair"><b>${byId[h[0]].name} + ${byId[h[1]].name}</b><p>${h[2]}</p></div>`).join("");
}
function quintCard(A){ let s = A.C.reduce((a, x) => a + pipVal(x.c), 0); while (s > 21) s = ds(s); return byId["M" + s]; }
function quint(A){
  const q = quintCard(A), inSpread = A.C.some(x => x.c.id === q.id);
  return `<div class="qc" data-card="${q.id}"><div class="mini">${art(q.id)}</div><div>
    <div class="n">${q.name}</div><p class="m">${q.a}</p>
    <div class="d">모든 카드의 숫자를 더해 메이저 아르카나로 환원한 카드로, 이 리딩 전체를 관통하는 근본 메시지입니다.${inSpread ? " 리딩에 이미 나온 카드라 메시지가 특히 강조됩니다." : ""}</div></div></div>`;
}
function adviceList(A){
  const {sp, C, n} = A, list = [];
  (sp.adv || []).forEach(i => list.push(`<b>${esc(C[i].pos[0])}</b> · ${cname(C[i].c, C[i].r)}: ${C[i].c.a}`));
  const last = sp.key[sp.key.length - 1];
  if (!(sp.adv || []).includes(last)) list.push(`<b>${esc(C[last].pos[0])}</b> · ${cname(C[last].c, C[last].r)}: ${C[last].r ? "이 흐름을 바로잡으려면 — " : ""}${C[last].c.a}`);
  (sp.ch || []).forEach(i => list.push(`<b>걸림돌 대처</b> · ${esc(C[i].c.sh)}을(를) 경계하세요.`));
  if (n >= 3){ const q = quintCard(A); list.push(`<b>정수 카드</b> · ${q.name}: ${q.a}`); }
  return list;
}
const advice = A => `<h3>종합 조언</h3><ul class="bul adv">${adviceList(A).map(s => `<li>${s}</li>`).join("")}</ul>`;
function shareText(){
  const A = analyze(), tc = timingCard(A);
  const L = [`[X Tarot 리딩] ${fmtDate(R.t)}`, `스프레드: ${spreadTitle(R)}`];
  if (R.q) L.push(`질문: ${R.q}`);
  L.push("", `■ 답: ${strip(oneLine(A))}`, strip(story(A)));
  if (tc) L.push(`■ 시기: ${timing(tc.c, tc.r)}`);
  L.push("", "■ 카드");
  A.C.forEach(x => L.push(`${badge(R, x.i)}. ${x.pos[0]} — ${cname(x.c, x.r)}: ${kw(x.c, x.r)}`));
  L.push("", "■ 조언", ...adviceList(A).map(s => "- " + strip(s)));
  L.push("", "※ 타로는 마음의 흐름을 비추는 참고 자료입니다.");
  return L.join("\n");
}
function aiText(){
  const A = analyze(), dom = {love:"연애·관계", work:"일·재물", yesno:"예/아니오", general:"일반"}[A.dom];
  const lines = A.C.map(x => `${badge(R, x.i)}. [${x.pos[0]}: ${x.pos[1]}${x.t === "ch" ? " / 걸림돌 위치" : ""}] ${x.c.name} (${x.c.en}) — ${x.r ? "역방향" : "정방향"}`);
  return `당신은 25년 경력의 전문 타로 리더입니다. 아래 리딩을 손님에게 설명하듯 해석해 주세요.

질문: ${R.q || "(질문 없음 — 전반적인 흐름)"}
${A.sp.choice ? `선택지: A=${R.a || "A"}, B=${R.b || "B"}\n` : ""}스프레드: ${spreadTitle(R)} (${A.n}장, 주제: ${dom})
덱: 라이더-웨이트-스미스

${lines.join("\n")}

다음 순서로 한국어로 정리해 주세요:
1) 질문에 대한 핵심 답 (한 문단)
2) 위치별 해석 (위치의 의미와 카드를 연결, 걸림돌 위치는 카드의 그림자로 해석)
3) 카드 간 관계와 흐름 (원소 상응, 메이저/마이너 비율, 반복되는 숫자·수트)
4) 예상 시기
5) 구체적이고 실천 가능한 조언 3가지
무서운 카드(죽음, 탑 등)는 손님이 오해하지 않도록 상징적 의미를 먼저 설명해 주세요.`;
}

/* ---------- card detail ---------- */
function showCard(id, rev, pos){
  const c = byId[id];
  const meta = c.arcana === "major"
    ? `<span>메이저 ${c.roman}</span><span>원소 ${ELEMENTS[c.el].ko}</span><span>점성 ${c.astro}</span>`
    : `<span>${SUITS[c.suit].ko} · ${ELEMENTS[c.el].ko}</span><span>${c.court ? RANKS[c.number - 1][0] : "숫자 " + c.number}: ${RANK_MEAN[c.number - 1]}</span>`;
  const m = document.createElement("div"); m.className = "modal";
  m.innerHTML = `<div class="mbox" role="dialog" aria-label="${c.name}"><button class="big${rev ? " rev" : ""}" id="bigc" aria-label="크게 보기">${art(id)}</button>
    <div class="zoomh">그림을 누르면 크게 볼 수 있습니다</div>
    <h4>${c.name}</h4><div class="en">${c.en}${pos ? " · " + (rev ? "역방향" : "정방향") : ""}</div>
    <div class="meta">${meta}</div>
    ${CALM[id] ? `<div class="blk calmb"><i>안심하세요</i>${CALM[id]}</div>` : ""}
    ${pos ? `<div class="blk"><i>위치 — ${esc(pos[0])}</i>${esc(pos[1])}</div>` : ""}
    <div class="blk"><i>그림의 상징</i>${c.d}</div>
    <div class="blk${pos && !rev ? " on" : ""}"><i>정방향 · ${c.up}</i>${c.u}</div>
    <div class="blk${pos && rev ? " on" : ""}"><i>역방향 · ${c.rev}</i>${c.r}</div>
    <div class="blk"><i>연애</i>정: ${c.l}<br>역: ${dot(c.lr)}</div>
    <div class="blk"><i>일 · 재물</i>정: ${c.w}<br>역: ${dot(c.wr)}</div>
    <div class="blk"><i>그림자 (걸림돌 자리에서)</i>${dot(c.sh)}</div>
    <div class="blk"><i>조언</i>${c.a}</div>
    <div class="blk"><i>시기</i>${timing(c, false)}</div>
    <button class="cta ghost" id="mclose" style="margin-top:14px">닫기</button></div>`;
  m.onclick = e => { if (e.target === m || e.target.id === "mclose") m.remove(); };
  m.querySelector("#bigc").onclick = () => {
    const f = document.createElement("div"); f.className = "full";
    f.innerHTML = `<div class="fc${rev ? " rev" : ""}">${art(id)}</div><p>${c.name}${rev ? " · 역방향" : ""} — 화면을 누르면 닫힙니다</p>`;
    f.onclick = () => f.remove(); document.body.appendChild(f);
  };
  document.body.appendChild(m);
}

/* ---------- history ---------- */
function save(){
  if (R.saved || R.fromHistory) return; R.saved = true;
  const h = store.get("history", []);
  h.unshift({t:R.t, k:R.key, v:R.v, q:R.q, a:R.a, b:R.b, m:"", cl:R.cl || null, c:R.picked.map(p => [p.id, p.r ? 1 : 0])});
  store.set("history", h.slice(0, 500));
}
function saveMemo(){
  const h = store.get("history", []), e = h.find(x => x.t === R.t);
  if (e){ e.m = R.memo; store.set("history", h); }
}
const histItem = (x, i) => { const r = {key:x.k, v:x.v, t:x.t, a:x.a, b:x.b}, c = x.cl && clientById(x.cl);
  return `<button class="hi" data-i="${i}"><div class="t">${fmtDate(x.t)} · ${spreadTitle(r)}${x.m ? ' <span class="mt">메모</span>' : ""}</div>
    <b>${c ? `<span class="cn">${esc(c.name)}</span> ` : ""}${x.q ? esc(x.q) : "질문 없음"}</b>
    <div class="c">${x.c.slice(0, 4).map(c => byId[c[0]].name + (c[1] ? "(역)" : "")).join(", ")}${x.c.length > 4 ? " 외 " + (x.c.length - 4) + "장" : ""}</div></button>`; };
let histF = "all";
function history(){
  R = null; tab = "hist"; renderNav();
  const all = store.get("history", []).filter(x => SPREADS[x.k]);
  const h = all.filter(x => histF === "all" || (histF === "me" ? !x.cl : !!x.cl));
  let stats = "";
  if (h.length >= 3){
    const cnt = {}, ec = {fire:0, water:0, air:0, earth:0}; let total = 0;
    h.forEach(x => x.c.forEach(([id]) => { cnt[id] = (cnt[id] || 0) + 1; ec[byId[id].el]++; total++; }));
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const topEl = Object.entries(ec).sort((a, b) => b[1] - a[1])[0][0];
    stats = `<div class="stats"><div class="st"><b>${h.length}</b><span>리딩</span></div><div class="st"><b>${total}</b><span>뽑은 카드</span></div><div class="st"><b>${ELEMENTS[topEl].ko}</b><span>가장 많은 원소</span></div></div>
      <div class="lbl">자주 나온 카드</div><div class="topc">${top.map(([id, k]) => `<button class="lc" data-card="${id}"><div class="lci">${art(id)}</div><span>${byId[id].name} · ${k}회</span></button>`).join("")}</div>`;
  }
  $app.innerHTML = topbar("리딩 기록", false) +
    `<div class="chips" id="hf">${[["all","전체"],["me","나"],["cl","손님"]].map(f => `<button class="chip${histF === f[0] ? " on" : ""}" data-f="${f[0]}">${f[1]}</button>`).join("")}</div>` +
    stats + (h.length ? `<div class="lbl">최근 리딩</div>` + h.map(histItem).join("")
    : `<div class="empty">아직 저장된 리딩이 없습니다.<br>리딩을 마치면 자동으로 저장됩니다.</div>`);
  $app.querySelectorAll("#hf .chip").forEach(b => b.onclick = () => { histF = b.dataset.f; history(); });
  $app.querySelectorAll("[data-card]").forEach(b => b.onclick = () => showCard(b.dataset.card, false, null));
  $app.querySelectorAll(".hi").forEach(b => b.onclick = () => openHistory(h[+b.dataset.i], null));
  window.scrollTo(0, 0);
}

/* ---------- clients ---------- */
function chainOf(sum){
  let s = sum; while (s > 22) s = ds(s);
  if (s === 22) return [0, 4];
  const ch = [s]; let t = s; while (t > 9){ t = ds(t); ch.push(t); } return ch;
}
function birthHTML(bd){
  if (!bd) return "";
  const [Y, M, D] = bd.split("-").map(Number); if (!Y || !M || !D) return "";
  const ch = chainOf(Y + M + D);
  const labels = ch.length === 1 ? ["성격 · 영혼 카드"] : ch.map((_, i) => i === 0 ? "성격 카드" : i === ch.length - 1 ? "영혼 카드" : "보조 카드");
  const yc = chainOf(M + D + new Date().getFullYear())[0];
  return `<div class="bcs">${ch.map((n, i) => bcItem(n, labels[i])).join("")}${bcItem(yc, `${new Date().getFullYear()}년의 카드`)}</div>`;
}
const bcItem = (n, label) => { const c = byId["M" + n];
  return `<button class="bc" data-card="${c.id}"><div class="mini">${art(c.id)}</div><div><div class="p">${label}</div><div class="n">${c.name} (${c.roman})</div><div class="m">${c.u}</div></div></button>`; };
let clQ = "";
function clientsView(){
  R = null; tab = "cl"; renderNav();
  const h = store.get("history", []);
  $app.innerHTML = topbar("손님 관리", false) + curBanner() + `
    <button class="cta" id="addc">+ 새 손님 등록</button>
    <div class="tcard" id="addf" hidden style="margin-top:12px"><div class="lbl" style="margin-top:0">이름</div><input class="inp" id="cn" maxlength="30" placeholder="손님 이름 (필수)">
      <div class="lbl">생년월일 (양력, 선택)</div><input class="inp" id="cb" type="date">
      <div class="lbl">메모 (선택)</div><textarea class="q" id="cm" maxlength="500" placeholder="관심사, 상담 주제 등"></textarea>
      <div class="btns"><button class="cta" id="csave">저장하고 상담 시작</button><button class="cta ghost" id="ccancel">취소</button></div></div>
    <input class="inp" id="cq" type="search" placeholder="손님 검색" value="${esc(clQ)}" style="margin-top:14px">
    <div id="clist"></div>
    <p class="disc">손님 정보는 이 기기 안에만 저장되며 어디로도 전송되지 않습니다. 도구 탭에서 백업할 수 있습니다.</p>`;
  const draw = () => {
    const list = clients().filter(c => !clQ || c.name.includes(clQ));
    document.getElementById("clist").innerHTML = list.length ? list.map(c => { const rs = h.filter(x => x.cl === c.id);
      return `<button class="hi" data-id="${c.id}"><div class="t">${rs.length ? `상담 ${rs.length}회 · 최근 ${fmtDate(rs[0].t)}` : "상담 기록 없음"}${cur === c.id ? ' <span class="mt">상담 중</span>' : ""}</div>
        <b>${esc(c.name)}</b>${c.note ? `<div class="c">${esc(c.note.slice(0, 40))}</div>` : ""}</button>`; }).join("")
      : `<div class="empty">${clQ ? "검색 결과가 없습니다" : "등록된 손님이 없습니다.<br>손님을 등록하면 손님별로 상담 기록이 쌓입니다."}</div>`;
    document.querySelectorAll("#clist .hi").forEach(b => b.onclick = () => clientDetail(b.dataset.id));
  };
  document.getElementById("cq").oninput = e => { clQ = e.target.value.trim(); draw(); };
  document.getElementById("addc").onclick = () => { document.getElementById("addf").hidden = false; document.getElementById("cn").focus(); };
  document.getElementById("ccancel").onclick = () => { document.getElementById("addf").hidden = true; };
  document.getElementById("csave").onclick = () => {
    const name = document.getElementById("cn").value.trim(); if (!name){ toast("손님 이름을 입력하세요"); return; }
    const c = {id:"c" + Date.now(), name, bd:document.getElementById("cb").value, note:document.getElementById("cm").value.trim(), t:Date.now()};
    const cs = clients(); cs.unshift(c); store.set("clients", cs); setCur(c.id); toast(`${name} 님 상담을 시작합니다`); home();
  };
  bindCur(clientsView); draw(); window.scrollTo(0, 0);
}
function clientDetail(id){
  const c = clientById(id); if (!c){ clientsView(); return; }
  const rs = store.get("history", []).filter(x => x.cl === id);
  $app.innerHTML = topbar(esc(c.name) + " 님", true) + `
    <div class="btns" style="margin-top:0"><button class="cta" id="cstart">${cur === id ? "상담 계속하기" : "이 손님 상담 시작"}</button><button class="cta ghost" id="cdel">손님 삭제</button></div>
    <div class="tcard" style="margin-top:14px"><div class="lbl" style="margin-top:0">생년월일 (양력)</div><input class="inp" id="cb" type="date" value="${esc(c.bd)}">
      <div id="cbc">${birthHTML(c.bd)}</div>
      <div class="lbl">메모</div><textarea class="q" id="cm" maxlength="500">${esc(c.note)}</textarea></div>
    <div class="lbl">상담 기록 · ${rs.length}회</div>
    ${rs.length ? rs.map((x, i) => histItem(x, i)).join("") : `<div class="empty">아직 상담 기록이 없습니다</div>`}`;
  const upd = patch => { const cs = clients(), e = cs.find(x => x.id === id); Object.assign(e, patch); store.set("clients", cs); };
  document.getElementById("back").onclick = clientsView;
  document.getElementById("cstart").onclick = () => { setCur(id); home(); };
  twoTap(document.getElementById("cdel"), "손님 삭제", "한 번 더 누르면 삭제", () => {
    store.set("clients", clients().filter(x => x.id !== id)); if (cur === id) setCur(null); toast("삭제했습니다 (상담 기록은 남습니다)"); clientsView(); });
  const bindBc = () => document.querySelectorAll("#cbc [data-card]").forEach(b => b.onclick = () => showCard(b.dataset.card, false, null));
  document.getElementById("cb").onchange = e => { upd({bd:e.target.value}); document.getElementById("cbc").innerHTML = birthHTML(e.target.value); bindBc(); };
  let mt; document.getElementById("cm").oninput = e => { clearTimeout(mt); mt = setTimeout(() => upd({note:e.target.value}), 400); };
  bindBc();
  $app.querySelectorAll(".hi").forEach(b => b.onclick = () => openHistory(rs[+b.dataset.i], null));
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
      (!q || [c.name, c.en, c.up, c.rev, c.u, c.l, c.w, c.sh].join(" ").toLowerCase().includes(q)));
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
function tools(){
  R = null; tab = "tools"; renderNav();
  const sw = (id, on, label, sub) => `<div class="row"><div>${label}<small>${sub}</small></div><button class="sw ${on ? "on" : ""}" id="${id}" aria-label="${label}"></button></div>`;
  $app.innerHTML = topbar("도구", false) + `
  <div class="tcard"><h3>나의 탄생 카드</h3><p>생년월일(양력)의 숫자를 더해 메이저 아르카나로 환원합니다. 평생 지니는 성격과 영혼의 과제, 그리고 올해의 주제를 보여 줍니다. 손님의 탄생 카드는 손님 탭에서 생년월일을 넣으면 나옵니다.</p>
    <input class="inp" id="bd" type="date" value="${esc(settings.bd)}"><div id="bdout">${birthHTML(settings.bd)}</div></div>
  <div class="tcard"><h3>설정</h3>
    ${sw("rv", settings.reversals, "역방향 카드 사용", "끄면 모든 카드가 정방향으로 나옵니다")}
    <div class="sp"></div>${sw("qk", settings.quick, "빠른 진행", "셔플·덱 나누기 의식을 건너뛰고 바로 뽑습니다")}
    <div class="sp"></div>${sw("bg", settings.big, "큰 글씨", "손님과 함께 화면을 볼 때 읽기 쉽게")}</div>
  <div class="tcard"><h3>백업</h3><p>리딩 기록과 손님 정보는 이 기기에만 저장됩니다. 폰을 바꾸거나 브라우저 데이터를 지우기 전에 백업 파일을 저장하세요.</p>
    <div class="btns" style="margin-top:0"><button class="cta" id="exp">백업 저장</button><button class="cta ghost" id="imp">백업 불러오기</button></div>
    <input type="file" id="impf" accept="application/json,.json" hidden></div>
  <div class="tcard"><h3>기록 정리</h3><p>모든 리딩 기록을 지웁니다. 손님 목록은 남습니다.</p><button class="cta ghost" id="clr">기록 전체 삭제</button></div>
  <div class="tcard"><h3>정보</h3><p>X Tarot v3.0 · theXresearch<br>카드 그림: 1909년 라이더-웨이트-스미스 덱(일러스트 Pamela Colman Smith), 미국 퍼블릭 도메인.<br>시기 판단은 수트·숫자에 따른 전통 타이밍 기법을 따릅니다.</p></div>`;
  const bd = document.getElementById("bd");
  const bindBc = () => document.querySelectorAll("#bdout [data-card]").forEach(b => b.onclick = () => showCard(b.dataset.card, false, null));
  bd.onchange = () => { settings.bd = bd.value; saveSettings(); document.getElementById("bdout").innerHTML = birthHTML(bd.value); bindBc(); };
  bindBc();
  const tog = (id, key, fx) => document.getElementById(id).onclick = e => { settings[key] = !settings[key]; saveSettings(); e.currentTarget.classList.toggle("on"); if (fx) fx(); };
  tog("rv", "reversals"); tog("qk", "quick"); tog("bg", "big", () => document.documentElement.classList.toggle("big", settings.big));
  document.getElementById("exp").onclick = async () => {
    const data = {app:"xtarot", v:3, at:Date.now(), history:store.get("history", []), clients:clients(), settings};
    const d = new Date(), name = `xtarot-backup-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}.json`;
    const blob = new Blob([JSON.stringify(data)], {type:"application/json"});
    try { const f = new File([blob], name, {type:"application/json"});
      if (navigator.canShare && navigator.canShare({files:[f]})){ await navigator.share({files:[f], title:"X Tarot 백업"}); return; } } catch(e){ if (e && e.name === "AbortError") return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast("백업 파일을 저장했습니다");
  };
  const impf = document.getElementById("impf");
  document.getElementById("imp").onclick = () => impf.click();
  impf.onchange = async () => {
    const f = impf.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text()); if (d.app !== "xtarot") throw new Error("형식");
      const h = store.get("history", []), ht = new Set(h.map(x => x.t)), nh = (d.history || []).filter(x => !ht.has(x.t));
      const cs = clients(), ci = new Set(cs.map(x => x.id)), nc = (d.clients || []).filter(x => !ci.has(x.id));
      store.set("history", h.concat(nh).sort((a, b) => b.t - a.t)); store.set("clients", cs.concat(nc));
      toast(`리딩 ${nh.length}개, 손님 ${nc.length}명을 불러왔습니다`);
    } catch(e){ toast("X Tarot 백업 파일이 아닙니다. 파일을 확인하세요."); }
    impf.value = "";
  };
  twoTap(document.getElementById("clr"), "기록 전체 삭제", "한 번 더 누르면 전체 삭제", () => { store.set("history", []); toast("기록을 삭제했습니다"); tools(); });
  window.scrollTo(0, 0);
}

/* ---------- resize / sw ---------- */
let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (R && document.getElementById("board")) layoutBoard(); }, 150); });
if ("serviceWorker" in navigator && location.protocol === "https:"){
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
home();
})();
