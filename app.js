// theXresearch Tarot — app logic
(() => {
"use strict";
const $app = document.getElementById("app");
const byId = Object.fromEntries(DECK.map(c => [c.id, c]));
const COLOR = {wands:"#c4612f", cups:"#2f6fb5", swords:"#5d6f86", pentacles:"#3f8a4c"};

/* ---------- storage ---------- */
const store = {
  get(k, d){ try{ const v = localStorage.getItem("xtarot." + k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem("xtarot." + k, JSON.stringify(v)); }catch(e){} }
};
let settings = Object.assign({reversals:true, tipHidden:false}, store.get("settings", {}));
const saveSettings = () => store.set("settings", settings);

/* ---------- random ---------- */
function rand(n){ const a = new Uint32Array(1); const lim = Math.floor(0x100000000 / n) * n; let x;
  do { crypto.getRandomValues(a); x = a[0]; } while (x >= lim); return x % n; }
function shuffled(){
  const d = DECK.map(c => c.id);
  for (let i = d.length - 1; i > 0; i--){ const j = rand(i + 1); [d[i], d[j]] = [d[j], d[i]]; }
  return d.map(id => ({id, r: settings.reversals ? rand(2) === 1 : false}));
}

/* ---------- SVG card art (original design) ---------- */
function icon(suit, x, y, s, col){
  const t = `transform="translate(${x} ${y}) scale(${s})"`;
  if (suit === "wands") return `<g ${t} fill="${col}" stroke="${col}"><path d="M0-10V10" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="-2.6" cy="-5" rx="2" ry="1" transform="rotate(-35 -2.6 -5)"/><ellipse cx="2.6" cy="-1" rx="2" ry="1" transform="rotate(35 2.6 -1)"/><ellipse cx="-2.4" cy="3.5" rx="1.8" ry=".9" transform="rotate(-35 -2.4 3.5)"/></g>`;
  if (suit === "cups") return `<g ${t} fill="${col}"><path d="M-6.5-8h13a6.5 6.5 0 0 1-6.5 8.5A6.5 6.5 0 0 1-6.5-8z"/><rect x="-1" y=".3" width="2" height="6"/><path d="M-5 9.5q5-4 10 0z"/></g>`;
  if (suit === "swords") return `<g ${t} fill="${col}"><path d="M0-11l2.2 14h-4.4z"/><rect x="-5.5" y="3" width="11" height="1.8" rx=".9"/><rect x="-.9" y="4.8" width="1.8" height="4.5"/><circle cx="0" cy="10.2" r="1.3"/></g>`;
  // pentacles
  let st = ""; for (let i = 0; i < 5; i++){ const a = -Math.PI/2 + i*4*Math.PI/5; st += (i?"L":"M") + (6.6*Math.cos(a)).toFixed(2) + " " + (6.6*Math.sin(a)).toFixed(2); }
  return `<g ${t}><circle r="8.6" fill="none" stroke="${col}" stroke-width="1.6"/><path d="${st}Z" fill="none" stroke="${col}" stroke-width="1.3" stroke-linejoin="round"/></g>`;
}
const PIPS = {
  1:[[50,86]], 2:[[50,56],[50,116]], 3:[[50,50],[50,86],[50,122]],
  4:[[33,58],[67,58],[33,114],[67,114]], 5:[[33,56],[67,56],[50,86],[33,116],[67,116]],
  6:[[33,52],[67,52],[33,86],[67,86],[33,120],[67,120]],
  7:[[33,52],[67,52],[50,69],[33,86],[67,86],[33,120],[67,120]],
  8:[[33,50],[67,50],[50,68],[33,86],[67,86],[50,104],[33,122],[67,122]],
  9:[[33,47],[67,47],[33,73],[67,73],[50,86],[33,99],[67,99],[33,125],[67,125]],
  10:[[33,47],[67,47],[50,60],[33,73],[67,73],[33,99],[67,99],[50,112],[33,125],[67,125]]
};
function frame(col, inner, top, bottom){
  return `<svg viewBox="0 0 100 170" xmlns="http://www.w3.org/2000/svg">
<rect width="100" height="170" fill="#f4ecda"/>
<rect x="4" y="4" width="92" height="162" rx="5" fill="none" stroke="${col}" stroke-width="1.6"/>
<rect x="7" y="7" width="86" height="156" rx="3.5" fill="none" stroke="${col}" stroke-width=".5" opacity=".6"/>
<text x="50" y="22" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" fill="${col}">${top}</text>
${inner}
<rect x="10" y="144" width="80" height="16" rx="3" fill="${col}"/>
<text x="50" y="155.5" text-anchor="middle" font-family="-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="${bottom.length > 7 ? 7 : 8.5}" font-weight="700" fill="#f4ecda">${bottom}</text>
</svg>`;
}
function majorArt(n){
  const col = "#5b3d8c", g = "#b8903f";
  let rays = ""; for (let i = 0; i < 24; i++){ const a = i*Math.PI/12, r1 = 24, r2 = i%2 ? 31 : 36;
    rays += `<line x1="${50+r1*Math.cos(a)}" y1="${84+r1*Math.sin(a)}" x2="${50+r2*Math.cos(a)}" y2="${84+r2*Math.sin(a)}" stroke="${g}" stroke-width="${i%2?.8:1.4}"/>`; }
  let motif = "";
  if (n === 17) motif = `<path d="M50 70l3.5 10.5H64l-8.5 6.5 3.2 10.5L50 91l-8.7 6.5 3.2-10.5L36 80.5h10.5z" fill="${col}"/>`;
  else if (n === 18) motif = `<path d="M55 68a16 16 0 1 0 0 32a12.5 12.5 0 1 1 0-32z" fill="${col}"/>`;
  else if (n === 19) motif = `<circle cx="50" cy="84" r="13" fill="${g}"/><circle cx="50" cy="84" r="9" fill="${col}"/>`;
  else motif = `<text x="50" y="91.5" text-anchor="middle" font-family="Georgia,serif" font-size="${ROMAN[n].length > 3 ? 13 : 18}" font-weight="700" fill="${col}">${ROMAN[n]}</text>`;
  const inner = `<circle cx="50" cy="84" r="40" fill="none" stroke="${g}" stroke-width=".6"/>${rays}
<circle cx="50" cy="84" r="22" fill="#efe2c4" stroke="${col}" stroke-width="1.4"/>${motif}
<path d="M18 38l4-6 4 6M74 38l4-6 4 6M18 130l4 6 4-6M74 130l4 6 4-6" fill="none" stroke="${g}" stroke-width="1"/>`;
  return inner;
}
function cardSVG(c){
  if (c.arcana === "major") return frame("#5b3d8c", majorArt(c.number), c.roman, c.name);
  const col = COLOR[c.suit];
  if (!c.court){
    const s = c.number === 1 ? 2.6 : 1.05;
    const inner = PIPS[c.number].map(p => icon(c.suit, p[0], p[1], s, col)).join("");
    return frame(col, inner, c.number === 1 ? "ACE" : c.number, c.name);
  }
  const rank = ["P","N","Q","K"][c.number - 11];
  const crown = c.number >= 13
    ? `<path d="M34 52l6 10 10-14 10 14 6-10v14H34z" fill="${col}" opacity=".85"/>`
    : `<path d="M40 60h20v4H40z" fill="${col}" opacity=".85"/>`;
  const inner = `${crown}<circle cx="50" cy="96" r="27" fill="none" stroke="${col}" stroke-width="1.2"/>
${icon(c.suit, 50, 96, 2.2, col)}<text x="86" y="22" text-anchor="end" font-family="Georgia,serif" font-size="10" font-weight="700" fill="${col}">${rank}</text>`;
  return frame(col, inner, "", c.name);
}
const BACK = (() => {
  let p = ""; for (let i = 0; i < 12; i++){ const a = i*Math.PI/6;
    p += `<line x1="50" y1="85" x2="${50+30*Math.cos(a)}" y2="${85+30*Math.sin(a)}" stroke="#d9b46a" stroke-width=".5" opacity=".7"/>`; }
  return `<svg viewBox="0 0 100 170" xmlns="http://www.w3.org/2000/svg">

<rect width="100" height="170" fill="url(#xtbg)"/><rect width="100" height="170" fill="url(#xtbp)"/>
<rect x="5" y="5" width="90" height="160" rx="5" fill="none" stroke="#d9b46a" stroke-width="1.4"/>
<rect x="9" y="9" width="82" height="152" rx="3" fill="none" stroke="#d9b46a" stroke-width=".5"/>
<circle cx="50" cy="85" r="30" fill="#0d1129" stroke="#d9b46a" stroke-width="1"/>${p}
<circle cx="50" cy="85" r="17" fill="#0d1129" stroke="#d9b46a" stroke-width=".8"/>
<path d="M42 77l16 16M58 77l-16 16" stroke="#f0d79a" stroke-width="3.2" stroke-linecap="round"/>
<path d="M50 40l3 6-3 6-3-6zM50 118l3 6-3 6-3-6z" fill="#d9b46a"/></svg>`;
})();
// shared SVG defs (one copy for the whole page)
document.body.insertAdjacentHTML("afterbegin", `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><pattern id="xtbp" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M5 0L10 5L5 10L0 5Z" fill="none" stroke="#d9b46a" stroke-width=".35" opacity=".45"/></pattern>
<radialGradient id="xtbg" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#2b2a6e"/><stop offset="1" stop-color="#0d1129"/></radialGradient></defs></svg>`);
const svgCache = {};
const IDX = Object.fromEntries(DECK.map((c, i) => [c.id, i]));
// 1909 Rider-Waite-Smith (public domain) — 78 cards in one sprite: 13 cols x 6 rows
const art = id => { const i = IDX[id];
  return `<div class="ci" role="img" aria-label="${byId[id].name}" style="background-position:${(i % 13) * 100 / 12}% ${Math.floor(i / 13) * 100 / 5}%"></div>`; };
const artSVG = id => svgCache[id] || (svgCache[id] = cardSVG(byId[id]));

/* ---------- helpers ---------- */
const esc = s => String(s).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
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

/* ---------- state ---------- */
let R = null; // current reading

/* ---------- HOME ---------- */
function home(){
  R = null;
  const tip = (!isStandalone() && !settings.tipHidden) ? `<div class="tip"><button id="tipx" aria-label="닫기">×</button>
    <b>앱처럼 쓰기</b><br>${isIOS()
      ? "Safari 하단 <b>공유 버튼</b> → <b>홈 화면에 추가</b>"
      : "Chrome 오른쪽 위 <b>⋮ 메뉴</b> → <b>홈 화면에 추가</b> (또는 앱 설치)"}</div>` : "";
  $app.innerHTML = `
  <div class="hero"><div class="logo">${BACK.replace('<svg ','<svg style="width:76px;height:76px;border-radius:14px" preserveAspectRatio="xMidYMid slice" ')}</div>
    <h1>X TAROT</h1><p>마음을 가라앉히고, 질문을 떠올리세요</p></div>
  <div class="menu">
    <button class="mbtn" data-s="one"><div class="ic">1</div><div><b>오늘의 카드</b><span>하루의 메시지 한 장</span></div></button>
    <button class="mbtn" data-s="three"><div class="ic">3</div><div><b>3장 스프레드</b><span>과거 · 현재 · 미래</span></div></button>
    <button class="mbtn" data-s="celtic"><div class="ic">10</div><div><b>켈틱 크로스</b><span>깊이 있는 10장 리딩</span></div></button>
    <button class="mbtn" id="hist"><div class="ic">☰</div><div><b>리딩 기록</b><span>${store.get("history", []).length}개 저장됨</span></div></button>
  </div>
  <div class="row"><div>역방향 카드 사용<small>끄면 모든 카드가 정방향으로 나옵니다</small></div>
    <button class="sw ${settings.reversals ? "on" : ""}" id="rv" aria-label="역방향 토글"></button></div>
  ${tip}`;
  $app.querySelectorAll("[data-s]").forEach(b => b.onclick = () => start(b.dataset.s));
  document.getElementById("hist").onclick = history;
  document.getElementById("rv").onclick = e => { settings.reversals = !settings.reversals; saveSettings(); e.currentTarget.classList.toggle("on"); };
  const tx = document.getElementById("tipx"); if (tx) tx.onclick = () => { settings.tipHidden = true; saveSettings(); home(); };
  window.scrollTo(0, 0);
}

/* ---------- READING ---------- */
function start(key){
  R = {key, sp: SPREADS[key], q: "", deck: null, picked: [], flipped: new Set(), saved: false, stage: "ask"};
  if (key === "one"){ R.q = ""; }
  renderReading();
}
function topbar(title){
  return `<div class="top"><button class="iconbtn" id="back" aria-label="뒤로">‹</button><h2>${title}</h2><div style="width:44px"></div></div>`;
}
function renderReading(){
  const sp = R.sp;
  let body = "";
  if (R.stage === "ask"){
    body = `<p class="hint" style="margin-top:4px">${sp.count === 1 ? "오늘 마음에 둔 것이 있다면 적어보세요 (선택)" : "질문을 구체적으로 적을수록 해석이 선명해집니다 (선택)"}</p>
      <textarea class="q" id="q" placeholder="${sp.count === 1 ? "예: 오늘 하루 나에게 필요한 것은?" : "예: 새 사업을 지금 시작해도 될까?"}" maxlength="200">${esc(R.q)}</textarea>
      <button class="cta" id="go">카드 섞기</button>`;
  } else if (R.stage === "shuffle"){
    body = `${R.q ? `<div class="qshow">“${esc(R.q)}”</div>` : ""}
      <div class="shuffle"><div>${BACK}</div><div class="s1">${BACK}</div><div class="s2">${BACK}</div></div>
      <p class="hint">카드를 섞고 있습니다…</p>`;
  } else {
    body = `${R.q ? `<div class="qshow">“${esc(R.q)}”</div>` : ""}<div class="board" id="board"></div><div id="below"></div>`;
  }
  $app.innerHTML = topbar(sp.title) + body;
  document.getElementById("back").onclick = () => (R.stage === "done" && R.fromHistory) ? history() : home();
  if (R.stage === "ask"){
    const go = () => { R.q = document.getElementById("q").value.trim(); R.deck = shuffled(); R.stage = "shuffle"; renderReading();
      setTimeout(() => { R.stage = "pick"; renderReading(); }, 1600); };
    document.getElementById("go").onclick = go;
  }
  if (R.stage === "pick" || R.stage === "reveal" || R.stage === "done"){ layoutBoard(); renderBelow(); }
  window.scrollTo(0, 0);
}

function boardWidth(){ return Math.min($app.clientWidth - 32, 440); }
function layoutBoard(){
  const board = document.getElementById("board"); const W = boardWidth(); const n = R.sp.count;
  let html = "";
  if (R.key === "celtic"){
    const w = W / 5.3, h = w * 1.7, g = w * .14, gs = h * .07;
    const H = 4*h + 3*gs, ym = H/2, sx = 1.4*w;
    const c0 = w/2, c1 = c0 + sx, c2 = c1 + sx, c3 = c2 + 1.5*w;
    const P = [[c1,ym],[c1,ym],[c1,ym+h+g],[c0,ym],[c1,ym-h-g],[c2,ym]];
    for (let k = 0; k < 4; k++) P.push([c3, H - h/2 - k*(h+gs)]);
    board.className = "board"; board.style.width = (c3 + w/2) + "px"; board.style.height = H + "px"; board.style.setProperty("--w", w + "px");
    P.forEach((p, i) => html += `<div class="slot${i === 1 ? " rot" : ""}" data-i="${i}" style="left:${p[0]}px;top:${p[1]}px">${slotInner(i, false)}</div>`);
  } else {
    const w = n === 1 ? Math.min(W*.5, 190) : Math.min((W - 24)/3, 130);
    board.className = "board flex"; board.style.width = W + "px"; board.style.height = "auto";
    board.style.setProperty("--w", w + "px"); board.style.setProperty("--gap", (n === 1 ? 0 : 12) + "px");
    for (let i = 0; i < n; i++) html += `<div class="slot" data-i="${i}">${slotInner(i, true)}</div>`;
  }
  board.innerHTML = html;
  board.querySelectorAll(".slot").forEach(s => s.onclick = () => tapSlot(+s.dataset.i));
}
function slotInner(i, label){
  const sp = R.sp, pk = R.picked[i];
  const lab = label && sp.count > 1 ? `<div class="lab">${sp.pos[i][0]}</div>` : "";
  const num = sp.count > 1 ? `<div class="num">${i+1}</div>` : "";
  if (!pk) return `<div class="ph">${sp.count > 1 ? i+1 : ""}</div>${num}${lab}`;
  const fl = R.flipped.has(i);
  return `${num}<div class="card${fl ? " flipped" : ""}" style="${R.stage === "done" ? "animation:none" : ""}"><div class="inner">
    <div class="face back">${BACK}</div><div class="face front${pk.r ? " rev" : ""}">${art(pk.id)}</div></div></div>${lab}`;
}
function updateSlot(i){
  const s = document.querySelector(`.slot[data-i="${i}"]`); if (!s) return;
  s.innerHTML = slotInner(i, R.key !== "celtic");
}

function renderBelow(){
  const el = document.getElementById("below"); const n = R.sp.count;
  if (R.stage === "pick"){
    const left = n - R.picked.length;
    el.innerHTML = `<div class="counter" style="margin-top:18px">카드 ${left}장을 골라주세요</div>
      <div class="deckwrap"><div class="strip" id="strip">${R.deck.map((c, i) => `<button class="bk" data-k="${i}" aria-label="카드">${BACK}</button>`).join("")}</div></div>
      <p class="hint">← 좌우로 넘기며 끌리는 카드를 탭하세요 →</p>
      <button class="cta ghost" id="auto">자동으로 뽑기</button>`;
    el.querySelectorAll(".bk").forEach(b => b.onclick = () => pick(+b.dataset.k, b));
    document.getElementById("auto").onclick = () => {
      if (R.autoing) return; R.autoing = true;
      const avail = [...el.querySelectorAll(".bk:not(.gone)")];
      const need = n - R.picked.length;
      for (let j = 0; j < need; j++){ const b = avail.splice(rand(avail.length), 1)[0];
        setTimeout(() => pick(+b.dataset.k, b), j * 180); }
    };
  } else if (R.stage === "reveal"){
    el.innerHTML = `<p class="hint" style="margin-top:22px">카드를 탭해서 한 장씩 뒤집으세요</p>
      <button class="cta" id="all">모두 뒤집기</button>`;
    document.getElementById("all").onclick = () => { for (let i = 0; i < n; i++) setTimeout(() => flip(i), i*160); };
  } else if (R.stage === "done"){
    el.innerHTML = results();
    document.getElementById("cp").onclick = async () => toast(await copy(aiText()) ? "복사됨 — Claude에 붙여넣으세요" : "복사 실패");
    document.getElementById("again").onclick = () => start(R.key);
    document.getElementById("homeb").onclick = home;
    el.querySelectorAll(".it").forEach(x => x.onclick = () => detail(+x.dataset.i));
  }
}
function pick(k, btn){
  const n = R.sp.count;
  if (R.picked.length >= n || btn.classList.contains("gone")) return;
  btn.classList.add("gone");
  const i = R.picked.length; R.picked.push(R.deck[k]); updateSlot(i);
  const c = document.querySelector(".counter"); if (c) c.textContent = R.picked.length < n ? `카드 ${n - R.picked.length}장을 더 골라주세요` : "준비 완료";
  if (R.picked.length === n){ setTimeout(() => { R.stage = "reveal"; renderBelow(); }, 500); }
}
function tapSlot(i){
  if (!R.picked[i]) return;
  if (R.stage === "pick") return;
  if (!R.flipped.has(i)) flip(i); else detail(i);
}
function flip(i){
  if (R.flipped.has(i)) return;
  R.flipped.add(i);
  const card = document.querySelector(`.slot[data-i="${i}"] .card`); if (card) card.classList.add("flipped");
  if (R.flipped.size === R.sp.count) setTimeout(() => { R.stage = "done"; save(); renderBelow();
    document.getElementById("below").scrollIntoView({behavior:"smooth", block:"start"}); }, 800);
}

/* ---------- interpretation ---------- */
function summary(){
  const P = R.picked.map(p => ({...p, c: byId[p.id]})); const n = P.length; const out = [];
  const majors = P.filter(p => p.c.arcana === "major").length;
  const revs = P.filter(p => p.r).length;
  const courts = P.filter(p => p.c.court).length;
  const suitCnt = {}; P.forEach(p => { if (p.c.suit) suitCnt[p.c.suit] = (suitCnt[p.c.suit] || 0) + 1; });

  if (n === 1){
    const p = P[0];
    out.push(`<b>${p.c.name}</b>${p.r ? " (역방향)" : ""} — 오늘의 키워드는 <b>${(p.r ? p.c.rev : p.c.up).split(" · ")[0]}</b>입니다.`);
    out.push(p.r
      ? `역방향은 이 카드의 에너지가 막혀 있거나 지나치게 작용하고 있다는 신호입니다. 오늘은 <b>${p.c.up.split(" · ")[0]}</b>의 균형을 되찾는 데 의식을 두세요.`
      : `이 에너지가 자연스럽게 흐르는 날입니다. <b>${p.c.up}</b>을(를) 적극적으로 활용해 보세요.`);
    out.push(p.c.arcana === "major" ? "메이저 아르카나가 나왔습니다. 작은 일보다 방향과 태도에 관한 메시지로 받아들이세요."
      : `${SUITS[p.c.suit].ko}(${SUITS[p.c.suit].el})의 카드 — 오늘은 <b>${SUITS[p.c.suit].theme}</b> 영역에서 이 메시지가 드러날 가능성이 큽니다.`);
    return out;
  }
  if (n === 3){
    const k = P.map(p => (p.r ? p.c.rev : p.c.up).split(" · ")[0]);
    out.push(`흐름: <b>${k[0]}</b> → <b>${k[1]}</b> → <b>${k[2]}</b>`);
  } else {
    const kw = i => `${P[i].c.name}${P[i].r ? "(역)" : ""} — ${(P[i].r ? P[i].c.rev : P[i].c.up).split(" · ")[0]}`;
    out.push(`핵심: 현재 상황은 <b>${kw(0)}</b>, 이를 가로막는 힘은 <b>${kw(1)}</b>입니다.`);
    out.push(`가까운 미래 <b>${kw(5)}</b>를 거쳐, 최종 결과는 <b>${kw(9)}</b>로 향합니다.`);
    out.push(`마음속 희망과 두려움은 <b>${kw(8)}</b> — 결과를 바꿀 열쇠는 나의 태도(7번: <b>${kw(6)}</b>)에 있습니다.`);
  }
  const mr = majors / n;
  if (mr >= .5) out.push(`메이저 카드가 ${majors}장으로 많습니다. 개인의 노력을 넘어서는 큰 흐름과 전환점이 작용하는 시기입니다.`);
  else if (majors === 0) out.push("메이저 카드가 없습니다. 운명적 사건보다는 일상의 선택과 행동으로 충분히 조절할 수 있는 문제입니다.");
  const top = Object.entries(suitCnt).sort((a, b) => b[1] - a[1]);
  if (top.length && top[0][1] >= 2 && (top.length === 1 || top[0][1] > top[1][1])){
    const s = SUITS[top[0][0]];
    out.push(`${s.ko}(${s.el}) 카드가 ${top[0][1]}장으로 우세합니다 — 이 질문의 중심은 <b>${s.theme}</b>입니다.`);
  }
  if (revs / n >= .5) out.push(`역방향이 ${revs}장입니다. 지연, 내적 저항, 재검토가 필요한 부분이 있습니다. 서두르기보다 점검이 우선입니다.`);
  else if (revs === 0 && settings.reversals) out.push("모든 카드가 정방향입니다. 에너지가 막힘 없이 흐르고 있습니다.");
  if (courts >= 2) out.push(`인물 카드가 ${courts}장 — 주변 사람들의 영향과 관계가 결과에 크게 작용합니다.`);
  return out;
}
function results(){
  const sp = R.sp;
  const items = R.picked.map((p, i) => { const c = byId[p.id];
    return `<div class="it" data-i="${i}"><div class="mini${p.r ? " rev" : ""}">${art(p.id)}</div><div>
      <div class="p">${sp.count > 1 ? (i+1) + ". " : ""}${sp.pos[i][0]}</div>
      <div class="n">${c.name}<span class="tag ${p.r ? "rv" : "up"}">${p.r ? "역방향" : "정방향"}</span></div>
      <div class="k">${p.r ? c.rev : c.up}</div><div class="d">${sp.pos[i][1]}</div></div></div>`; }).join("");
  return `<div class="res"><h3>카드별 해석</h3>${items}
    <h3>종합 리딩</h3><div class="sum">${summary().map(s => `<p>${s}</p>`).join("")}</div>
    <button class="cta" id="cp" style="margin-top:16px">AI 해석용 복사 (Claude에 붙여넣기)</button>
    <div class="btns"><button class="cta ghost" id="again">다시 뽑기</button><button class="cta ghost" id="homeb">홈으로</button></div></div>`;
}
function aiText(){
  const sp = R.sp;
  const lines = R.picked.map((p, i) => { const c = byId[p.id];
    return `${i+1}. [${sp.pos[i][0]}] ${c.name} (${c.en}) — ${p.r ? "역방향" : "정방향"}`; });
  return `타로 리딩 해석을 부탁합니다.\n\n질문: ${R.q || "(질문 없음 — 전반적인 흐름)"}\n스프레드: ${sp.title}\n\n${lines.join("\n")}\n\n각 위치의 의미와 카드 조합의 흐름을 종합해서, 구체적인 해석과 실천 가능한 조언을 한국어로 정리해 주세요.`;
}
function detail(i){
  const p = R.picked[i], c = byId[p.id], pos = R.sp.pos[i];
  const m = document.createElement("div"); m.className = "modal";
  const extra = c.suit ? `<div class="blk"><i>수트</i>${SUITS[c.suit].ko} · ${SUITS[c.suit].el}의 원소 — ${SUITS[c.suit].theme}</div>`
    : `<div class="blk"><i>메이저 아르카나 ${c.roman}</i>인생의 큰 흐름과 영적 성장 단계를 나타내는 카드</div>`;
  m.innerHTML = `<div class="mbox"><div class="big${p.r ? " rev" : ""}">${art(p.id)}</div>
    <h4>${c.name}</h4><div class="en">${c.en} · ${p.r ? "역방향" : "정방향"}</div>
    <div class="blk"><i>위치 — ${pos[0]}</i>${pos[1]}</div>
    <div class="blk${p.r ? "" : " on"}"><i>정방향</i>${c.up}</div>
    <div class="blk${p.r ? " on" : ""}"><i>역방향</i>${c.rev}</div>${extra}
    <button class="cta ghost" style="margin-top:14px">닫기</button></div>`;
  m.onclick = e => { if (e.target === m || e.target.tagName === "BUTTON") m.remove(); };
  document.body.appendChild(m);
}

/* ---------- history ---------- */
function save(){
  if (R.saved || R.fromHistory) return; R.saved = true;
  const h = store.get("history", []);
  h.unshift({t: Date.now(), k: R.key, q: R.q, c: R.picked.map(p => [p.id, p.r ? 1 : 0])});
  store.set("history", h.slice(0, 50));
}
function history(){
  R = null;
  const h = store.get("history", []);
  $app.innerHTML = topbar("리딩 기록") + (h.length ? h.map((x, i) => `<button class="hi" data-i="${i}">
      <div class="t">${fmtDate(x.t)} · ${SPREADS[x.k].title}</div><b>${x.q ? esc(x.q) : "질문 없음"}</b>
      <div class="c">${x.c.slice(0, 4).map(c => byId[c[0]].name + (c[1] ? "(역)" : "")).join(", ")}${x.c.length > 4 ? " 외 " + (x.c.length - 4) + "장" : ""}</div></button>`).join("")
    + `<button class="cta ghost" id="clr" style="margin-top:10px">기록 전체 삭제</button>`
    : `<div class="empty">아직 저장된 리딩이 없습니다</div>`);
  document.getElementById("back").onclick = home;
  $app.querySelectorAll(".hi").forEach(b => b.onclick = () => { const x = h[+b.dataset.i];
    R = {key: x.k, sp: SPREADS[x.k], q: x.q, picked: x.c.map(c => ({id: c[0], r: !!c[1]})),
      flipped: new Set(x.c.map((_, i) => i)), stage: "done", saved: true, fromHistory: true};
    renderReading(); });
  const clr = document.getElementById("clr");
  if (clr) clr.onclick = () => { if (clr.dataset.arm){ store.set("history", []); history(); } else { clr.dataset.arm = 1; clr.textContent = "한 번 더 누르면 전체 삭제"; setTimeout(() => { if (clr.isConnected){ delete clr.dataset.arm; clr.textContent = "기록 전체 삭제"; } }, 3000); } };
  window.scrollTo(0, 0);
}

/* ---------- resize ---------- */
let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => {
  if (R && document.getElementById("board")){ layoutBoard(); } }, 150); });

/* ---------- service worker ---------- */
if ("serviceWorker" in navigator && location.protocol === "https:"){
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

home();
})();
