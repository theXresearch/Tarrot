// X Tarot v4 — bilingual professional reading engine (EN default, KO optional)
(() => {
"use strict";
const $app = document.getElementById("app");
const $nav = document.getElementById("nav");
const byId = Object.fromEntries(DECK.map(c => [c.id, c]));
const IDX = Object.fromEntries(DECK.map((c, i) => [c.id, i]));
const EL_THEME = S.ene.elTheme;

/* ---------- storage ---------- */
const store = {
  get(k, d){ try{ const v = localStorage.getItem("xtarot." + k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem("xtarot." + k, JSON.stringify(v)); return true; }catch(e){ toast(S.storageFull); return false; } }
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
const artHi = id => art(id).replace("></div>", `><img class="hii" src="hi/${id}.jpg" alt="" decoding="async"></div>`);
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
const fmtDate = t => S.fmtDate(t);
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
const cname = (c, r) => c.name + (r ? S.revMark : "");
function relation(e1, e2){
  if (e1 === e2) return S.rel.same;
  const k = [e1, e2].sort().join("-");
  if (k === "air-fire" || k === "earth-water") return S.rel.friend;
  if (k === "fire-water" || k === "air-earth") return S.rel.oppose;
  return S.rel.neutral;
}
function toneOf(avg){
  return S.tone[avg >= 1 ? 0 : avg >= 0.3 ? 1 : avg > -0.3 ? 2 : avg > -1 ? 3 : 4];
}
function timing(c, r){
  let t;
  if (c.arcana === "major") t = MAJOR_TIME[c.number] || S.majorTimeDef;
  else if (c.court) t = S.courtTime[c.number - 11];
  else t = S.minorTime(c.number, c.suit);
  return t + (c.suit ? S.season(c.suit) : "") + (r ? S.revLate : "");
}
const SENS = S.sens;
const sensOf = q => q ? SENS.filter(s => s[0].test(q)) : [];

/* ---------- reading state ---------- */
let R = null;
let tab = "read";
const spreadOf = r => SPREADS[r.key];
const domainOf = r => { const sp = spreadOf(r); return (sp.variants && sp.variants[r.v || 0].domain) || sp.domain; };
function positions(r){
  const sp = spreadOf(r);
  if (sp.variants) return sp.variants[r.v || 0].pos;
  if (sp.dynamic === "year"){ const d = new Date(r.t); const out = [S.yearTheme];
    for (let i = 0; i < 12; i++){ const m = new Date(d.getFullYear(), d.getMonth() + i, 1); out.push(S.monthLbl(m.getMonth(), m.getFullYear())); } return out; }
  if (sp.dynamic === "week"){ const out = [];
    for (let i = 0; i < 7; i++){ const d = new Date(r.t + i * 864e5); out.push([S.dayLbl(d), i === 0 ? S.dayToday : S.dayOther]); } return out; }
  if (sp.choice){ const A = r.a || "A", B = r.b || "B";
    return sp.pos.map(p => p.map(s => s.replace(/\{A\}/g, A).replace(/\{B\}/g, B))); }
  return sp.pos;
}
const badge = (r, i) => { if (spreadOf(r).dynamic !== "year") return i + 1; if (i === 0) return "★"; const d = new Date(r.t); return new Date(d.getFullYear(), d.getMonth() + i - 1, 1).getMonth() + 1; };
const spreadTitle = r => { const sp = spreadOf(r); return sp.variants ? `${sp.title} · ${sp.variants[r.v || 0].name}` : sp.title; };

/* ---------- navigation ---------- */
const NAV = [
  ["read",S.nav.read,'<path d="M12 2l2.4 7.2H22l-6 4.5 2.3 7.3L12 16.6 5.7 21l2.3-7.3-6-4.5h7.6z"/>'],
  ["cl",S.nav.cl,'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'],
  ["lib",S.nav.lib,'<rect x="3" y="3" width="7" height="11" rx="1.5"/><rect x="14" y="3" width="7" height="11" rx="1.5"/><path d="M3 18h18M3 21h12"/>'],
  ["hist",S.nav.hist,'<path d="M4 5h16M4 10h16M4 15h10M4 20h7"/>'],
  ["tools",S.nav.tools,'<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>']
];
function renderNav(){
  releaseWake();
  $nav.innerHTML = NAV.map(n => `<button data-t="${n[0]}" class="${tab === n[0] ? "on" : ""}" aria-label="${n[1]}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${n[2]}</svg>${n[1]}</button>`).join("");
  $nav.querySelectorAll("button").forEach(b => b.onclick = () => ({read:home, cl:clientsView, lib:library, hist:history, tools:tools})[b.dataset.t]());
}
const topbar = (title, back) =>
  `<div class="top">${back ? `<button class="iconbtn" id="back" aria-label="${S.back}">‹</button>` : `<div style="width:44px"></div>`}<h2>${title}</h2><div style="width:44px"></div></div>`;
function curBanner(){
  const c = cur && clientById(cur); if (!c) return "";
  return `<div class="curb"><span>${S.cur(esc(c.name))}</span><button id="curx">${S.endSess}</button></div>`;
}
function bindCur(after){ const x = document.getElementById("curx"); if (x) x.onclick = () => { setCur(null); toast(S.sessEnded); after(); }; }

/* ---------- HOME ---------- */
let topicSel = -1, homeQ = "";
function qReco(q){
  return `<div class="reco">${routeQuestion(q).map(([, k, v, why], j) => { const s = SPREADS[k];
    return `<button class="rbtn" data-s="${k}" data-v="${v}" data-q="${esc(q)}">${j === 0 ? '<span class="rtag">${S.recTag}</span>' : ""}<div class="ic">${s.icon}</div><div><b>${s.variants ? s.title + " · " + s.variants[v].name : s.title}</b><span>${why}</span></div></button>`; }).join("")}</div>`;
}
function home(){
  R = null; tab = "read"; renderNav(); releaseWake();
  const groups = Object.entries(S.groups);
  const tip = (!isStandalone() && !settings.tipHidden) ? `<div class="tip"><button id="tipx" aria-label="${S.close}">×</button>
    <b>${S.installT}</b><br>${isIOS() ? S.installIOS : S.installAnd}</div>` : "";
  const reco = topicSel >= 0 ? `<div class="reco">${TOPICS[topicSel][1].map(([k, v, why], j) => { const s = SPREADS[k];
      return `<button class="rbtn" data-s="${k}" data-v="${v}">${j === 0 ? '<span class="rtag">${S.recTag}</span>' : ""}<div class="ic">${s.icon}</div><div><b>${s.variants ? s.title + " · " + s.variants[v].name : s.title}</b><span>${why}</span></div></button>`; }).join("")}</div>` : "";
  $app.innerHTML = `${curBanner()}
  <div class="langsw" role="group" aria-label="Language"><button data-l="en"${LANG === "en" ? ' class="on"' : ""}>EN</button><button data-l="ko"${LANG === "ko" ? ' class="on"' : ""}>한국어</button></div>
  <div class="hero"><h1>X TAROT</h1><p>${S.heroSub}</p></div>
  <div class="ask1"><div class="lbl" style="margin-top:0">${S.askFirst}</div>
    <div class="ab1"><input class="inp" id="hq" maxlength="200" placeholder="${S.hqPh}" value="${esc(homeQ)}"><button class="cta" id="hqgo">${S.find}</button></div>
    <div id="hqr">${homeQ ? qReco(homeQ) : ""}</div></div>
  <div class="lbl">${S.orTopic}</div>
  <div class="chips" id="topics">${TOPICS.map((t, i) => `<button class="chip${i === topicSel ? " on" : ""}" data-t="${i}">${t[0]}</button>`).join("")}</div>
  ${reco}
  <button class="mbtn" data-s="one"><div class="ic">1</div><div><b>${S.todayTitle}</b><span>${S.todaySub(cur)}</span></div></button>
  ${groups.map(([g, label]) => `<div class="grp">${label}</div>
    <div class="sgrid">${Object.entries(SPREADS).filter(([k, s]) => s.group === g && k !== "one").map(([k, s]) =>
      `<button class="sbtn" data-s="${k}"><div class="ic">${s.icon}</div><b>${s.title}</b><span>${s.desc}</span><em>${S.nCards(s.count)}</em></button>`).join("")}</div>`).join("")}
  ${tip}`;
  const bindS = root => root.querySelectorAll("[data-s]").forEach(b => b.onclick = () => start(b.dataset.s, +(b.dataset.v || 0), b.dataset.q || ""));
  bindS($app);
  const hq = document.getElementById("hq");
  const findQ = () => { homeQ = hq.value.trim(); if (!homeQ){ toast(S.enterQ); return; }
    const box = document.getElementById("hqr"); box.innerHTML = qReco(homeQ); bindS(box); };
  document.getElementById("hqgo").onclick = findQ;
  hq.onkeydown = e => { if (e.key === "Enter"){ e.preventDefault(); findQ(); } };
  $app.querySelectorAll("#topics .chip").forEach(b => b.onclick = () => { const t = +b.dataset.t; topicSel = topicSel === t ? -1 : t; home(); });
  const tx = document.getElementById("tipx"); if (tx) tx.onclick = () => { settings.tipHidden = true; saveSettings(); home(); };
  bindCur(home); bindLang();
  window.scrollTo(0, 0);
}
function setLang(l){ if (l === LANG) return; settings.lang = l; saveSettings(); location.reload(); }
function bindLang(){ document.querySelectorAll("[data-l]").forEach(b => b.onclick = () => setLang(b.dataset.l)); }

/* ---------- READING FLOW ---------- */
function start(key, v, q){
  if (key === "one"){
    const today = store.get("history", []).find(x => x.k === "one" && (x.cl || null) === (cur || null) && sameDay(x.t, Date.now()));
    if (today){ openHistory(today, S.todayLocked(cur)); return; }
  }
  R = {key, v:v || 0, q:q || "", a:"", b:"", t:Date.now(), deck:null, picked:[], flipped:new Set(), saved:false, stage:"ask", memo:"", cl:cur};
  renderReading();
}
function openHistory(x, note){
  R = {key:x.k, v:x.v || 0, q:x.q, a:x.a || "", b:x.b || "", t:x.t, memo:x.m || "", cl:x.cl || null, note,
    picked:x.c.map(c => ({id:c[0], r:!!c[1]})), flipped:new Set(x.c.map((_, i) => i)), stage:"done", saved:true, fromHistory:true};
  renderReading();
}
function whoSelect(){
  const cs = clients();
  return `<div class="lbl">${S.who}</div><select class="inp" id="who"><option value="">${S.me}</option>
    ${cs.map(c => `<option value="${c.id}"${R.cl === c.id ? " selected" : ""}>${esc(c.name)}</option>`).join("")}<option value="__new">${S.newCl}</option></select>
    <div class="ab" id="nw" hidden style="margin-top:8px"><input class="inp" id="nn" maxlength="30" placeholder="${S.clName}"><button class="cta" id="nnok">${S.add}</button></div>`;
}
function qPicker(){
  const groups = qListFor(R.key, R.v); if (!groups.length) return "";
  const g = Math.min(R.qg || 0, groups.length - 1);
  return `${groups.length > 1 ? `<div class="qtabs">${groups.map((x, i) => `<button class="qtab${i === g ? " on" : ""}" data-g="${i}">${x[0]}</button>`).join("")}</div>` : ""}
    <div class="qlist">${groups[g][1].map(q => `<button class="qitem${q === R.q ? " on" : ""}">${esc(q)}</button>`).join("")}</div>`;
}
function bindQPick(){
  const box = document.getElementById("qpick"); if (!box) return;
  box.querySelectorAll(".qtab").forEach(t => t.onclick = () => { R.q = document.getElementById("q").value; R.qg = +t.dataset.g; box.innerHTML = qPicker(); bindQPick(); });
  box.querySelectorAll(".qitem").forEach(b => b.onclick = () => {
    const q = b.textContent, ta = document.getElementById("q"); ta.value = q; R.q = q;
    box.querySelectorAll(".qitem").forEach(x => x.classList.toggle("on", x === b));
    const ab = CHOICE_AB[q]; if (ab && document.getElementById("oa")){ document.getElementById("oa").value = ab[0]; document.getElementById("ob").value = ab[1]; }
    ta.classList.add("pulse"); setTimeout(() => ta.classList.remove("pulse"), 600);
  });
}
function renderReading(){
  const sp = spreadOf(R);
  let body = "";
  if (R.stage === "ask"){
    body = `<p class="sdesc">${sp.desc} · ${S.nCards(sp.count)}</p>${whoSelect()}
      ${sp.variants ? `<div class="lbl">${S.persp}</div><div class="chips" id="vars">${sp.variants.map((v, i) => `<button class="chip${i === R.v ? " on" : ""}" data-v="${i}">${v.name}</button>`).join("")}</div>` : ""}
      ${sp.choice ? `<div class="lbl">${S.twoOpt}</div><div class="ab"><input class="inp" id="oa" maxlength="24" placeholder="${S.optA}" value="${esc(R.a)}"><input class="inp" id="ob" maxlength="24" placeholder="${S.optB}" value="${esc(R.b)}"></div>` : ""}
      <div class="lbl">${S.question} <span class="lbls">${S.qHint}</span></div>
      <textarea class="q" id="q" placeholder="${S.eg}${esc(sp.tips[0])}" maxlength="200">${esc(R.q)}</textarea>
      <div class="lbl">${S.common}</div><div id="qpick">${qPicker()}</div>
      <p class="qguide">${S.qguide(sp.dynamic)}</p>
      <details class="sec posprev"><summary>${S.posN(sp.count)}</summary><div class="secb"><ol class="plist">${positions(R).map(p => `<li><b>${esc(p[0])}</b> — ${esc(p[1])}</li>`).join("")}</ol></div></details>
      <div id="warn"></div>
      <button class="cta" id="go">${S.shuffle}</button>`;
  } else if (R.stage === "shuffle"){
    body = `${R.q ? `<div class="qshow">“${esc(R.q)}”</div>` : ""}
      <div class="sky"><canvas class="stars"></canvas><div class="riffle" id="rf">${Array.from({length:16}, () => `<div class="rc">${BACK}</div>`).join("")}</div></div>
      <div class="scount"><span class="sdot"></span>${S.scount}</div>
      <p class="hint">${S.shufHint}</p>
      <button class="cta" id="stop" disabled>${S.stop}</button>`;
  } else if (R.stage === "cut"){
    body = `${R.q ? `<div class="qshow">“${esc(R.q)}”</div>` : ""}
      <p class="hint" style="margin-top:20px">${S.cutHint}</p>
      <div class="piles">${[0,1,2].map(i => `<button class="pile" data-p="${i}" aria-label="${S.pileAria(i + 1)}"><div>${BACK}</div><div>${BACK}</div><div>${BACK}</div><span>${S.piles[i]}</span></button>`).join("")}</div>`;
  } else {
    body = `${R.note ? `<div class="note">${esc(R.note)}</div>` : ""}${R.cl && clientById(R.cl) ? `<div class="who">${S.whoLine(esc(clientById(R.cl).name), fmtDate(R.t))}</div>` : ""}
      ${R.q ? `<div class="qshow">“${esc(R.q)}”</div>` : ""}<div class="board" id="board"></div><div id="below"></div>`;
  }
  $app.innerHTML = topbar(R.stage === "ask" ? sp.title : spreadTitle(R), true) + body;
  document.getElementById("back").onclick = () => R.fromHistory ? history() : home();
  if (R.stage === "ask") bindAsk(sp);
  if (R.stage === "shuffle"){
    startStars(document.querySelector(".sky .stars"));
    keepAwake();
    const stop = document.getElementById("stop");
    riffle(document.getElementById("rf"), n => { const sc = document.getElementById("sc"); if (sc) sc.textContent = n; R.deck = shuffled(); if (n >= 1 && stop.isConnected) stop.disabled = false; });
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
    const name = document.getElementById("nn").value.trim(); if (!name){ toast(S.nameReq); return; }
    const c = {id:"c" + Date.now(), name, bd:"", note:"", t:Date.now()}; const cs = clients(); cs.unshift(c); store.set("clients", cs);
    R.q = document.getElementById("q").value; R.cl = c.id; setCur(c.id); toast(S.registered(name)); renderReading();
  };
  const vars = document.getElementById("vars");
  if (vars) vars.querySelectorAll(".chip").forEach(c => c.onclick = () => {
    R.v = +c.dataset.v; vars.querySelectorAll(".chip").forEach(x => x.classList.toggle("on", x === c));
    R.qg = 0; document.getElementById("qpick").innerHTML = qPicker(); bindQPick();
    document.querySelector(".posprev .plist").innerHTML = positions(R).map(p => `<li><b>${esc(p[0])}</b> — ${esc(p[1])}</li>`).join(""); });
  bindQPick();
  const go = force => {
    R.q = document.getElementById("q").value.trim();
    if (sp.choice){ R.a = document.getElementById("oa").value.trim(); R.b = document.getElementById("ob").value.trim(); }
    if (!force && R.q){
      const prev = store.get("history", []).find(x => x.k === R.key && x.q === R.q && (x.cl || null) === (R.cl || null) && Date.now() - x.t < 864e5);
      if (prev){
        const h = Math.max(1, Math.round((Date.now() - prev.t) / 36e5));
        document.getElementById("warn").innerHTML = `<div class="note">${S.dup(h)}
          <div class="btns"><button class="cta ghost" id="prevr">${S.prevRes}</button><button class="cta ghost" id="force">${S.redo}</button></div></div>`;
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
    <div class="face back">${BACK}</div><div class="face front${pk.r ? " rev" : ""}">${artHi(pk.id)}</div></div></div>${lab}`;
}
function updateSlot(i){ const s = document.querySelector(`.slot[data-i="${i}"]`); if (s) s.innerHTML = slotInner(i); }
function renderBelow(){
  const el = document.getElementById("below"); const n = spreadOf(R).count;
  if (R.stage === "pick"){
    el.innerHTML = `<div class="counter">${S.pickN(n - R.picked.length)}</div>
      <div class="wheelwrap" id="ww"><canvas class="stars"></canvas><div class="halo"></div><div class="wheel" id="wheel"></div></div>
      <p class="hint">${S.wheelHint}</p>
      <button class="cta ghost" id="auto">${S.fate}</button>`;
    initWheel();
  } else if (R.stage === "reveal"){
    el.innerHTML = `<p class="hint" style="margin-top:22px">${S.revealHint}</p><button class="cta" id="all">${S.flipAll}</button>`;
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
    R.flying--; R.picked[slotI] = R.deck[k]; (new Image()).src = `hi/${R.deck[k].id}.jpg`; updateSlot(slotI);
    const s = document.querySelector(`.slot[data-i="${slotI}"]`); if (s){ s.classList.add("land"); setTimeout(() => s.classList.remove("land"), 900); }
    const left = n - R.picked.filter(Boolean).length;
    const c = document.querySelector(".counter"); if (c) c.textContent = left > 0 ? S.pickMore(left) : S.ready;
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

/* ---------- riffle shuffle animation (연출 — 실제 셔플은 매 회 crypto로 수행) ---------- */
function riffle(box, onCycle){
  const cards = [...box.querySelectorAll(".rc")], n = cards.length, half = n / 2;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const set = (el, x, y, r, z, delay) => { el.style.transitionDelay = delay + "ms"; el.style.transform = `translate(${x}px,${y}px) rotate(${r}deg)`; el.style.zIndex = z; };
  let order = cards.map((_, i) => i), cycle = 0;
  const stackAt = (x, r, list, base, d) => list.forEach((ci, j) => set(cards[ci], x + j * .4, -j * 1.2, r, base + j, d ? j * 12 : 0));
  stackAt(0, 0, order, 1, false);
  const step = () => {
    if (!box.isConnected) return;
    // 1) 덱을 반으로 나눔
    const L = order.slice(0, half), Rt = order.slice(half);
    stackAt(-78, -10, L, 1, true); stackAt(78, 10, Rt, 1, true);
    setTimeout(() => {
      if (!box.isConnected) return;
      // 2) 양쪽에서 번갈아 떨어뜨리며 섞음 (리플)
      const merged = []; let li = 0, ri = 0;
      while (li < L.length || ri < Rt.length){
        const takeL = ri >= Rt.length || (li < L.length && Math.random() < .5);
        merged.push(takeL ? L[li++] : Rt[ri++]);
      }
      merged.forEach((ci, j) => set(cards[ci], (Math.random() - .5) * 8, -j * 1.2, (Math.random() - .5) * 6, 100 + j, j * 55));
      order = merged;
      setTimeout(() => {
        if (!box.isConnected) return;
        // 3) 가지런히 정리
        stackAt(0, 0, order, 1, false);
        cycle++; onCycle(cycle);
        setTimeout(step, reduce ? 900 : 380);
      }, merged.length * 55 + 320);
    }, 420);
  };
  setTimeout(step, 250);
}
let wakeLock = null;
async function keepAwake(){ try { if ("wakeLock" in navigator && !wakeLock){ wakeLock = await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release", () => { wakeLock = null; }); } } catch(e){} }
function releaseWake(){ try { if (wakeLock) wakeLock.release(); } catch(e){} wakeLock = null; }
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && R) keepAwake(); });

/* ---------- card wheel (연출 전용 — 카드는 이미 셔플된 덱 순서에서 뽑힘) ---------- */
let WH = null;
function initWheel(){
  keepAwake();
  const ww = document.getElementById("ww"), wheel = document.getElementById("wheel");
  startStars(ww.querySelector(".stars"));
  const W = ww.clientWidth, H = ww.clientHeight, cw = 60, chh = 102;
  const Rr = Math.max(360, W * 1.1), step = (34 / Rr) * 180 / Math.PI;
  const cx = W / 2, cy = H * 0.5 + Rr;
  const avail = R.deck.map((_, k) => k);
  wheel.innerHTML = avail.map(k => `<button class="wc" data-k="${k}" aria-label="${S.cardAria}">${BACK}</button>`).join("");
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
  if (!R.flipped.has(i)){ flip(i); setTimeout(() => { if (R && R.picked[i]) viewer(spreadList(), i); }, 850); }
  else viewer(spreadList(), i);
}
function flip(i){
  if (R.flipped.has(i)) return;
  R.flipped.add(i);
  const card = document.querySelector(`.slot[data-i="${i}"] .card`);
  if (card){ card.classList.add("flipped"); const s = card.parentElement;
    setTimeout(() => { const f = card.querySelector(".front"); if (f){ f.style.transform = "rotateY(180deg) translateZ(.1px)"; void f.offsetWidth; f.style.transform = ""; } }, 760); setTimeout(() => { s.classList.add("flash"); setTimeout(() => s.classList.remove("flash"), 1100); }, 250); }
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
const mainText = x => (x.t === "ch" && !x.r && x.c.yn >= 0) ? S.shadowLead(dot(x.c.sh)) : (x.r ? x.c.r : x.c.u);
function domText(x, dom){
  if (x.t === "ch" && !x.r && x.c.yn >= 0) return "";
  if (dom === "love") return dot(x.r ? x.c.lr : x.c.l);
  if (dom === "work") return dot(x.r ? x.c.wr : x.c.w);
  return "";
}
function yesNoVerdict(A){
  const C = A.C, total = C[0].s + C[1].s + C[2].s * 1.5;
  const v = S.yn[total >= 3 ? 0 : total >= 1 ? 1 : total > -1 ? 2 : total > -3 ? 3 : 4];
  return {total, v};
}
function choiceVerdict(A){
  const C = A.C, a = R.a || "A", b = R.b || "B";
  const sa = C[1].s + C[2].s * 1.5, sb = C[3].s + C[4].s * 1.5;
  const win = sa - sb >= 1.5 ? 0 : sb - sa >= 1.5 ? 1 : -1;
  const text = win === 0 ? S.choiceWin(esc(a)) : win === 1 ? S.choiceWin(esc(b)) : S.choiceEven;
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
  if (sp.dynamic === "year") return S.oneYear(cname(C[0].c, C[0].r), kw(C[0].c, C[0].r));
  if (sp.dynamic === "week") return S.oneWeek(toneOf(A.avg)[0]);
  const last = C[sp.key[sp.key.length - 1]];
  return S.oneConc(cname(last.c, last.r), kw(last.c, last.r));
}
function story(A){
  const {sp, C, n, dom} = A, s = [], T = S.st;
  if (n === 1){ const x = C[0]; return T.single(nm(x), mainText(x), domText(x, dom), x.c.a); }
  if (sp.dynamic){
    const ti = timelineInfo(A), x = C[0], f = arr => arr.map(y => T.tl(esc(y.pos[0]), cname(y.c, y.r))).join(", ");
    s.push(sp.dynamic === "year" ? T.year(nm(x), mainText(x)) : T.week(nm(x), mainText(x)));
    s.push(T.best(f(ti.best)));
    s.push(ti.worst.length ? T.worst(f(ti.worst)) : T.noWorst);
    return s.join(" ");
  }
  if (dom === "yesno"){ const y = yesNoVerdict(A);
    s.push(T.ynAns(y.v[0], y.v[1]));
    s.push(T.ynVar(nm(C[1]), mainText(C[1])));
    s.push(T.adv(C[1].c.a)); return s.join(" "); }
  const k0 = C[sp.key[0]], kl = C[sp.key[sp.key.length - 1]];
  if (sp.choice){ const cv = choiceVerdict(A);
    s.push(T.chNow(nm(C[0]), mainText(C[0])));
    s.push(T.chPaths(esc(cv.a), nm(C[2]), esc(cv.b), nm(C[4])));
    s.push(cv.text); return s.join(" "); }
  s.push(T.center(nm(k0), mainText(k0)));
  (sp.ch || []).forEach(i => s.push(T.obstacle(nm(C[i]), mainText(C[i]))));
  (sp.adv || []).filter(i => i !== sp.key[0]).forEach(i => s.push(T.cardsAdv(C[i].c.a)));
  if (kl !== k0){ s.push(T.leads(nm(kl), mainText(kl)));
    const d = domText(kl, dom); if (d) s.push(T.lens(dom, d)); }
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
    <div class="head"><div class="hl">${R.q ? S.ansQ : S.ansR}</div>
    <div class="one">${oneLine(A)}</div>${A.dom === "yesno" ? `<div class="vs">${S.score((t => (t > 0 ? "+" : "") + t.toFixed(1))(yesNoVerdict(A).total))}</div>` : ""}
    <p class="story">${story(A)}</p>
    ${tc ? `<div class="when"><i>${S.when}</i>${timing(tc.c, tc.r)}<small>${S.whenNote(tc.c.name)}</small></div>` : ""}
    <div class="gauge"><i style="left:${pct}%"></i></div><div class="glab"><span>${S.gauge[0]}</span><span>${S.gauge[1]} · <b>${t[0]}</b></span><span>${S.gauge[2]}</span></div></div>
    ${calm.length ? `<div class="note calm">${calm.map(id => CALM[id]).join("<br>")}</div>` : ""}`;
}
const sec = (title, body, open) => `<details class="sec"${open ? " open" : ""}><summary>${title}</summary><div class="secb">${body}</div></details>`;
function results(){
  const A = analyze(), {sp, C, n, dom} = A, out = [answerBox(A)];
  if (sp.choice){ const cv = choiceVerdict(A), bar = s => Math.max(4, Math.min(100, (s + 5) / 10 * 100));
    out.push(`<div class="verdict"><div class="hl">${S.choiceCmp}</div><div class="cmp">
      <div><span>${esc(cv.a)}</span><div class="bar"><i style="width:${bar(cv.sa)}%"></i></div><small>${S.result}: ${cname(C[2].c, C[2].r)}</small></div>
      <div><span>${esc(cv.b)}</span><div class="bar"><i style="width:${bar(cv.sb)}%"></i></div><small>${S.result}: ${cname(C[4].c, C[4].r)}</small></div></div><p>${cv.text}</p></div>`); }
  out.push(sec(S.secPos(n), C.map(x => item(x, A)).join(""), n <= 3));
  if (sp.pairs && sp.pairs.length) out.push(sec(S.secRel, sp.pairs.map(p => pairHTML(A, p)).join(""), false));
  if (n >= 3) out.push(sec(S.secEnergy, energy(A), false));
  const cb = combos(A); if (cb) out.push(sec(S.secCombo, cb, true));
  if (n >= 3) out.push(sec(S.secQuint, quint(A), false));
  out.push(advice(A));
  out.push(`<h3>${S.notesH}</h3><textarea class="q" id="memo" placeholder="${S.memoPh}" maxlength="2000">${esc(R.memo)}</textarea>
    <div class="btns"><button class="cta" id="share">${S.share}</button><button class="cta ghost" id="cp">${S.aiCopy}</button></div>
    <div class="btns"><button class="cta ghost" id="again">${S.newR}</button><button class="cta ghost" id="homeb">${R.fromHistory ? S.toHist : S.toHome}</button></div>
    <p class="disc">${S.disc}</p>`);
  return `<div class="res">${out.join("")}</div>`;
}
function bindResults(el){
  document.getElementById("cp").onclick = async () => toast(await copy(aiText()) ? S.copiedAI : S.copyFail);
  document.getElementById("share").onclick = async () => {
    const text = shareText();
    if (navigator.share){ try { await navigator.share({title:S.shareTitle, text}); return; } catch(e){ if (e && e.name === "AbortError") return; } }
    toast(await copy(text) ? S.sharedCopy : S.copyFail);
  };
  document.getElementById("again").onclick = () => start(R.key, R.v);
  document.getElementById("homeb").onclick = () => R.fromHistory ? history() : home();
  el.querySelectorAll(".it").forEach(x => x.onclick = () => viewer(spreadList(), +x.dataset.i));
  el.querySelectorAll("[data-card]").forEach(x => x.onclick = () => showCard(x.dataset.card, false, null));
  let mt; document.getElementById("memo").oninput = e => { R.memo = e.target.value; clearTimeout(mt); mt = setTimeout(saveMemo, 400); };
}
function item(x, A){
  const {c, r, i, pos, t} = x, dom = A.dom, isAdv = (A.sp.adv || []).includes(i);
  const d = domText(x, dom);
  let extra = d ? `<p class="m2"><i>${dom === "love" ? S.love : S.work}</i>${d}</p>` : "";
  if (isAdv) extra += `<p class="m2"><i>${S.advice}</i>${c.a}</p>`;
  if (CALM[c.id]) extra += `<p class="m2 calmi"><i>${S.calm}</i>${CALM[c.id]}</p>`;
  return `<div class="it" data-i="${i}"><div class="mini${r ? " rev" : ""}">${art(c.id)}</div><div class="itb">
    <div class="p">${A.n > 1 ? badge(R, i) + ". " : ""}${esc(pos[0])}${t === "ch" ? ` <span class="pt">${S.chTag}</span>` : t === "hf" ? ` <span class="pt">${S.hfTag}</span>` : ""}</div>
    <div class="n">${c.name}<span class="tag ${r ? "rv" : "up"}">${r ? S.rv : S.up}</span></div>
    <div class="k">${r ? c.rev : c.up}</div>
    <p class="m">${mainText(x)}</p>${extra}
    <div class="d">${esc(pos[1])}</div></div></div>`;
}
function pairHTML(A, p){
  const a = A.C[p[0]], b = A.C[p[1]], rel = relation(a.c.el, b.c.el);
  let cmp;
  const chx = [a, b].find(x => x.t === "ch");
  const P = S.pair, df = b.s - a.s;
  if (chx) cmp = (chx.s <= -1 || chx.r) ? P.chStrong : P.chWeak;
  else if (p[2].includes("→")) cmp = df >= 2 ? P.f2 : df >= 1 ? P.f1 : df <= -2 ? P.fm2 : df <= -1 ? P.fm1 : P.f0;
  else cmp = b.s > a.s + 1 ? P.brighter(esc(b.pos[0])) : a.s > b.s + 1 ? P.brighter(esc(a.pos[0])) : P.even;
  return `<div class="pair"><b>${esc(p[2])}</b>
    <div class="pc">${cname(a.c, a.r)} (${ELEMENTS[a.c.el].ko}) ↔ ${cname(b.c, b.r)} (${ELEMENTS[b.c.el].ko}) · ${P.el(rel[0])}</div>
    <p>${rel[1]} ${cmp}</p></div>`;
}
function energy(A){
  const {C, n} = A, out = [];
  const ec = {fire:0, water:0, air:0, earth:0}; C.forEach(x => ec[x.c.el]++);
  const bars = Object.keys(ec).map(e => `<div class="eb"><span>${ELEMENTS[e].ko}</span><div class="bar"><i style="width:${ec[e] / n * 100}%;background:${ELEMENTS[e].color}"></i></div><span>${ec[e]}</span></div>`).join("");
  const sorted = Object.entries(ec).sort((a, b) => b[1] - a[1]), E = S.ene;
  if (sorted[0][1] >= 2 && sorted[0][1] > sorted[1][1]) out.push(E.dom(ELEMENTS[sorted[0][0]].ko, EL_THEME[sorted[0][0]]));
  if (n >= 5) Object.keys(ec).filter(e => !ec[e]).forEach(e => out.push(E.miss(ELEMENTS[e].ko, ELEMENTS[e].lack)));
  const majors = C.filter(x => x.c.arcana === "major").length;
  out.push(majors / n >= .5 ? E.majMany(majors) : majors === 0 ? E.majNone : E.majSome(majors));
  const revs = C.filter(x => x.r).length;
  if (revs / n >= .5) out.push(E.revMany(revs));
  else if (revs === 0 && settings.reversals) out.push(E.allUp);
  const courts = C.filter(x => x.c.court).length;
  if (courts >= 2) out.push(E.courts(courts));
  const rc = {}; C.filter(x => x.c.arcana === "minor").forEach(x => rc[x.c.number] = (rc[x.c.number] || 0) + 1);
  Object.entries(rc).filter(([k, v]) => v >= 2).forEach(([k, v]) => out.push(E.rank(+k, v, RANK_REPEAT[k - 1])));
  const pv = C.filter(x => x.c.arcana === "minor" && !x.c.court).map(x => x.c.number);
  if (pv.length >= 3){ const m = mean(pv); out.push(E.avg(m.toFixed(1), m <= 3.5 ? 0 : m <= 6.5 ? 1 : 2)); }
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
    <div class="d">${S.quintNote}${inSpread ? S.quintIn : ""}</div></div></div>`;
}
function adviceList(A){
  const {sp, C, n} = A, list = [];
  (sp.adv || []).forEach(i => list.push(`<b>${esc(C[i].pos[0])}</b> · ${cname(C[i].c, C[i].r)}: ${C[i].c.a}`));
  const last = sp.key[sp.key.length - 1];
  if (!(sp.adv || []).includes(last)) list.push(`<b>${esc(C[last].pos[0])}</b> · ${cname(C[last].c, C[last].r)}: ${C[last].r ? S.fixFlow : ""}${C[last].c.a}`);
  (sp.ch || []).forEach(i => list.push(`<b>${S.obsLbl}</b> · ${S.obsTxt(esc(C[i].c.sh))}`));
  if (n >= 3){ const q = quintCard(A); list.push(`<b>${S.quintLbl}</b> · ${q.name}: ${q.a}`); }
  return list;
}
const advice = A => `<h3>${S.adviceH}</h3><ul class="bul adv">${adviceList(A).map(s => `<li>${s}</li>`).join("")}</ul>`;
function shareText(){
  const A = analyze(), tc = timingCard(A), H = S.sh;
  const L = [H.head(fmtDate(R.t)), `${H.spread}: ${spreadTitle(R)}`];
  if (R.q) L.push(`${H.q}: ${R.q}`);
  L.push("", `${H.ans}: ${strip(oneLine(A))}`, strip(story(A)));
  if (tc) L.push(`${H.when}: ${timing(tc.c, tc.r)}`);
  L.push("", H.cards);
  A.C.forEach(x => L.push(`${badge(R, x.i)}. ${x.pos[0]} — ${cname(x.c, x.r)}: ${kw(x.c, x.r)}`));
  L.push("", H.adv, ...adviceList(A).map(s => "- " + strip(s)));
  L.push("", H.foot);
  return L.join("\n");
}
function aiText(){
  const A = analyze();
  const lines = A.C.map(x => `${badge(R, x.i)}. [${x.pos[0]}: ${x.pos[1]}${x.t === "ch" ? S.aiCh : ""}] ${x.c.name}${LANG === "ko" ? ` (${x.c.en})` : ""} — ${x.r ? S.rv : S.up}`);
  return S.ai(R.q, A.sp.choice ? S.aiOpt(R.a || "A", R.b || "B") : "", spreadTitle(R), A.n, S.aiDom[A.dom], lines.join("\n"));
}

/* ---------- card viewer (거의 전체 화면, 좌우로 넘기며 읽기) ---------- */
const showCard = (id, rev, pos) => viewer([{id, r:rev, pos}], 0);
function spreadList(){
  const A = analyze();
  return A.C.map(x => ({id:x.c.id, r:x.r, pos:x.pos, badge:badge(R, x.i), x, dom:A.dom}));
}
function viewer(list, idx){
  const old = document.querySelector(".viewer"); if (old) old.remove();
  const v = document.createElement("div"); v.className = "viewer"; v.setAttribute("role", "dialog");
  document.body.appendChild(v); document.body.style.overflow = "hidden";
  const close = () => { v.remove(); document.body.style.overflow = ""; document.removeEventListener("keydown", key); };
  const key = e => { if (e.key === "Escape") close(); else if (e.key === "ArrowRight") go(1); else if (e.key === "ArrowLeft") go(-1); };
  document.addEventListener("keydown", key);
  const go = d => { const n = idx + d; if (n < 0 || n >= list.length) return; idx = n; draw(d); };
  const draw = dir => {
    const it = list[idx], c = byId[it.id], rev = it.r, pos = it.pos, x = it.x;
    const V = S.v, meta = c.arcana === "major"
      ? `<span>${V.major(c.roman)}</span><span>${V.el(ELEMENTS[c.el].ko)}</span><span>${V.astro(c.astro)}</span>`
      : `<span>${SUITS[c.suit].ko} · ${ELEMENTS[c.el].ko}</span><span>${c.court ? RANKS[c.number - 1][0] : V.num(c.number)}: ${RANK_MEAN[c.number - 1]}</span>`;
    let reading = "";
    if (x){
      const d = domText(x, it.dom);
      reading = `<div class="blk on"><i>${V.inPos}${x.t === "ch" ? V.chS : x.t === "hf" ? V.hfS : ""}</i>${mainText(x)}${d ? `<br><span class="sub">${it.dom === "love" ? S.love : S.work}: ${d}</span>` : ""}</div>`;
    }
    v.innerHTML = `<div class="vtop"><span class="vc">${list.length > 1 ? `${idx + 1} / ${list.length}` : ""}</span>
        <span class="vp">${pos ? `${it.badge ? it.badge + ". " : ""}${esc(pos[0])}` : esc(c.name)}</span><button class="vx" aria-label="${S.close}">✕</button></div>
      <div class="vscroll">
        <button class="vcard${rev ? " rev" : ""}${dir ? (dir > 0 ? " in-r" : " in-l") : ""}" aria-label="${V.zoom}">${art(c.id)}<img src="hi/${c.id}.jpg" alt="" onload="this.classList.add('ok')"></button>
        <div class="vname">${c.name}${pos ? `<span class="tag ${rev ? "rv" : "up"}">${rev ? S.rv : S.up}</span>` : ""}</div>
        <div class="ven">${V.sub(c)}</div>
        <div class="vkw">${rev ? c.rev : c.up}</div>
        <div class="vbody">
          ${CALM[c.id] ? `<div class="blk calmb"><i>${V.calmH}</i>${CALM[c.id]}</div>` : ""}
          ${pos ? `<div class="blk"><i>${V.posH(esc(pos[0]))}</i>${esc(pos[1])}</div>` : ""}
          ${reading}
          <div class="blk"><i>${V.img}</i>${c.d}</div>
          <div class="blk${pos && !rev ? " on" : ""}"><i>${V.upH(c.up)}</i>${c.u}</div>
          <div class="blk${pos && rev ? " on" : ""}"><i>${V.rvH(c.rev)}</i>${c.r}</div>
          <div class="blk"><i>${V.loveH}</i>${V.upP}${c.l}<br>${V.rvP}${dot(c.lr)}</div>
          <div class="blk"><i>${V.workH}</i>${V.upP}${c.w}<br>${V.rvP}${dot(c.wr)}</div>
          <div class="blk"><i>${V.shH}</i>${dot(c.sh)}</div>
          <div class="blk"><i>${V.advH}</i>${c.a}</div>
          <div class="blk"><i>${V.whenH}</i>${timing(c, rev)}</div>
          <div class="meta">${meta}</div>
        </div>
      </div>
      ${list.length > 1 ? `<div class="vnav"><button class="vb" data-d="-1"${idx === 0 ? " disabled" : ""}>${V.prev}</button><button class="vb" data-d="1"${idx === list.length - 1 ? " disabled" : ""}>${V.next}</button></div>` : ""}`;
    v.querySelector(".vx").onclick = close;
    v.querySelectorAll(".vb").forEach(b => b.onclick = () => go(+b.dataset.d));
    const card = v.querySelector(".vcard");
    card.onclick = () => v.classList.toggle("solo");
    let sx = null, sy = 0;
    card.onpointerdown = e => { sx = e.clientX; sy = e.clientY; };
    card.onpointerup = e => { if (sx === null) return; const dx = e.clientX - sx, dy = Math.abs(e.clientY - sy); sx = null;
      if (Math.abs(dx) > 50 && dy < 60){ e.preventDefault(); card.onclick = null; setTimeout(() => go(dx < 0 ? 1 : -1), 0); } };
    v.querySelector(".vscroll").scrollTop = 0;
    [idx - 1, idx + 1].forEach(j => { if (list[j]) (new Image()).src = `hi/${list[j].id}.jpg`; });
  };
  draw(0);
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
  return `<button class="hi" data-i="${i}"><div class="t">${fmtDate(x.t)} · ${spreadTitle(r)}${x.m ? ` <span class="mt">${S.memo}</span>` : ""}</div>
    <b>${c ? `<span class="cn">${esc(c.name)}</span> ` : ""}${x.q ? esc(x.q) : S.noQ}</b>
    <div class="c">${x.c.slice(0, 4).map(c => byId[c[0]].name + (c[1] ? S.revMark : "")).join(", ")}${x.c.length > 4 ? S.more(x.c.length - 4) : ""}</div></button>`; };
let histF = "all";
let histQ = "";
function history(){
  R = null; tab = "hist"; renderNav();
  const all = store.get("history", []).filter(x => SPREADS[x.k]);
  const hq = histQ.toLowerCase();
  const h = all.filter(x => (histF === "all" || (histF === "me" ? !x.cl : !!x.cl)) &&
    (!hq || [x.q, x.m, (x.cl && clientById(x.cl) || {}).name, SPREADS[x.k].title, ...x.c.map(c => byId[c[0]].name)].join(" ").toLowerCase().includes(hq)));
  let stats = "";
  if (h.length >= 3){
    const cnt = {}, ec = {fire:0, water:0, air:0, earth:0}; let total = 0;
    h.forEach(x => x.c.forEach(([id]) => { cnt[id] = (cnt[id] || 0) + 1; ec[byId[id].el]++; total++; }));
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const topEl = Object.entries(ec).sort((a, b) => b[1] - a[1])[0][0];
    stats = `<div class="stats"><div class="st"><b>${h.length}</b><span>${S.statR}</span></div><div class="st"><b>${total}</b><span>${S.statC}</span></div><div class="st"><b>${ELEMENTS[topEl].ko}</b><span>${S.statE}</span></div></div>
      <div class="lbl">${S.freq}</div><div class="topc">${top.map(([id, k]) => `<button class="lc" data-card="${id}"><div class="lci">${art(id)}</div><span>${byId[id].name} · ${S.times(k)}</span></button>`).join("")}</div>`;
  }
  $app.innerHTML = topbar(S.histT, false) + `<input class="inp" id="hs" type="search" placeholder="${S.histPh}" value="${esc(histQ)}">` +
    `<div class="chips" id="hf">${[["all",S.histF[0]],["me",S.histF[1]],["cl",S.histF[2]]].map(f => `<button class="chip${histF === f[0] ? " on" : ""}" data-f="${f[0]}">${f[1]}</button>`).join("")}</div>` +
    stats + (h.length ? `<div class="lbl">${S.recent}</div>` + h.map(histItem).join("")
    : `<div class="empty">${S.histEmpty}</div>`);
  $app.querySelectorAll("#hf .chip").forEach(b => b.onclick = () => { histF = b.dataset.f; history(); });
  const hs = document.getElementById("hs"); let ht;
  hs.oninput = () => { clearTimeout(ht); ht = setTimeout(() => { histQ = hs.value.trim(); history(); const n = document.getElementById("hs"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 300); };
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
  const B = S.birth, labels = ch.length === 1 ? [B.both] : ch.map((_, i) => i === 0 ? B.pers : i === ch.length - 1 ? B.soul : B.mid);
  const yc = chainOf(M + D + new Date().getFullYear())[0];
  return `<div class="bcs">${ch.map((n, i) => bcItem(n, labels[i])).join("")}${bcItem(yc, B.year(new Date().getFullYear()))}</div>`;
}
const bcItem = (n, label) => { const c = byId["M" + n];
  return `<button class="bc" data-card="${c.id}"><div class="mini">${art(c.id)}</div><div><div class="p">${label}</div><div class="n">${c.name} (${c.roman})</div><div class="m">${c.u}</div></div></button>`; };
let clQ = "";
function clientsView(){
  R = null; tab = "cl"; renderNav();
  const h = store.get("history", []);
  $app.innerHTML = topbar(S.clT, false) + curBanner() + `
    <button class="cta" id="addc">${S.addCl}</button>
    <div class="tcard" id="addf" hidden style="margin-top:12px"><div class="lbl" style="margin-top:0">${S.nameL}</div><input class="inp" id="cn" maxlength="30" placeholder="${S.namePh}">
      <div class="lbl">${S.bdL}</div><input class="inp" id="cb" type="date">
      <div class="lbl">${S.memoL}</div><textarea class="q" id="cm" maxlength="500" placeholder="${S.memoPh2}"></textarea>
      <div class="btns"><button class="cta" id="csave">${S.saveStart}</button><button class="cta ghost" id="ccancel">${S.cancel}</button></div></div>
    <input class="inp" id="cq" type="search" placeholder="${S.clSearch}" value="${esc(clQ)}" style="margin-top:14px">
    <div id="clist"></div>
    <p class="disc">${S.privacy}</p>`;
  const draw = () => {
    const list = clients().filter(c => !clQ || c.name.toLowerCase().includes(clQ.toLowerCase()));
    document.getElementById("clist").innerHTML = list.length ? list.map(c => { const rs = h.filter(x => x.cl === c.id);
      return `<button class="hi" data-id="${c.id}"><div class="t">${rs.length ? S.sessCnt(rs.length, fmtDate(rs[0].t)) : S.noSess}${cur === c.id ? ` <span class="mt">${S.inSess}</span>` : ""}</div>
        <b>${esc(c.name)}</b>${c.note ? `<div class="c">${esc(c.note.slice(0, 40))}</div>` : ""}</button>`; }).join("")
      : `<div class="empty">${clQ ? S.noMatch : S.noCl}</div>`;
    document.querySelectorAll("#clist .hi").forEach(b => b.onclick = () => clientDetail(b.dataset.id));
  };
  document.getElementById("cq").oninput = e => { clQ = e.target.value.trim(); draw(); };
  document.getElementById("addc").onclick = () => { document.getElementById("addf").hidden = false; document.getElementById("cn").focus(); };
  document.getElementById("ccancel").onclick = () => { document.getElementById("addf").hidden = true; };
  document.getElementById("csave").onclick = () => {
    const name = document.getElementById("cn").value.trim(); if (!name){ toast(S.nameReq); return; }
    const c = {id:"c" + Date.now(), name, bd:document.getElementById("cb").value, note:document.getElementById("cm").value.trim(), t:Date.now()};
    const cs = clients(); cs.unshift(c); store.set("clients", cs); setCur(c.id); toast(S.sessStart(name)); home();
  };
  bindCur(clientsView); draw(); window.scrollTo(0, 0);
}
function clientDetail(id){
  const c = clientById(id); if (!c){ clientsView(); return; }
  const rs = store.get("history", []).filter(x => x.cl === id);
  $app.innerHTML = topbar(S.clTitle(esc(c.name)), true) + `
    <div class="btns" style="margin-top:0"><button class="cta" id="cstart">${cur === id ? S.contSess : S.startSess}</button><button class="cta ghost" id="cdel">${S.delCl}</button></div>
    <div class="tcard" style="margin-top:14px"><div class="lbl" style="margin-top:0">${S.bdL2}</div><input class="inp" id="cb" type="date" value="${esc(c.bd)}">
      <div id="cbc">${birthHTML(c.bd)}</div>
      <div class="lbl">${S.memoL2}</div><textarea class="q" id="cm" maxlength="500">${esc(c.note)}</textarea></div>
    <div class="lbl">${S.sessions(rs.length)}</div>
    ${rs.length ? rs.map((x, i) => histItem(x, i)).join("") : `<div class="empty">${S.noSessYet}</div>`}`;
  const upd = patch => { const cs = clients(), e = cs.find(x => x.id === id); Object.assign(e, patch); store.set("clients", cs); };
  document.getElementById("back").onclick = clientsView;
  document.getElementById("cstart").onclick = () => { setCur(id); home(); };
  twoTap(document.getElementById("cdel"), S.delCl, S.delConfirm, () => {
    store.set("clients", clients().filter(x => x.id !== id)); if (cur === id) setCur(null); toast(S.deleted); clientsView(); });
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
  const F = ["all","major","wands","cups","swords","pentacles"].map((k, i) => [k, S.libF[i]]);
  $app.innerHTML = topbar(S.libT, false) + `<input class="inp" id="ls" type="search" placeholder="${S.libPh}" value="${esc(libQ)}">
    <div class="chips" id="lf">${F.map(f => `<button class="chip${libF === f[0] ? " on" : ""}" data-f="${f[0]}">${f[1]}</button>`).join("")}</div><div class="lgrid" id="lg"></div>`;
  const draw = () => {
    const q = libQ.toLowerCase();
    const list = DECK.filter(c => (libF === "all" || (libF === "major" ? c.arcana === "major" : c.suit === libF)) &&
      (!q || [c.name, c.en, c.up, c.rev, c.u, c.l, c.w, c.sh].join(" ").toLowerCase().includes(q)));
    document.getElementById("lg").innerHTML = list.length ? list.map(c => `<button class="lc" data-card="${c.id}"><div class="lci">${art(c.id)}</div><span>${c.name}</span></button>`).join("")
      : `<div class="empty" style="grid-column:1/-1">${S.noMatch}</div>`;
    const lst = list.map(c => ({id:c.id, r:false, pos:null}));
    document.querySelectorAll("#lg [data-card]").forEach((b, j) => b.onclick = () => viewer(lst, j));
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
  $app.innerHTML = topbar(S.toolsT, false) + `
  <div class="tcard"><h3>${S.setH}</h3>
    <div class="row"><div>${S.langL}<small>${S.langS}</small></div><div class="langsw inline" role="group" aria-label="Language"><button data-l="en"${LANG === "en" ? ' class="on"' : ""}>EN</button><button data-l="ko"${LANG === "ko" ? ' class="on"' : ""}>한국어</button></div></div>
    <div class="sp"></div>${sw("rv", settings.reversals, S.revL, S.revS)}
    <div class="sp"></div>${sw("qk", settings.quick, S.quickL, S.quickS)}
    <div class="sp"></div>${sw("bg", settings.big, S.bigL, S.bigS)}</div>
  <div class="tcard"><h3>${S.birthH}</h3><p>${S.birthP}</p>
    <input class="inp" id="bd" type="date" value="${esc(settings.bd)}"><div id="bdout">${birthHTML(settings.bd)}</div></div>
  <div class="tcard"><h3>${S.bkH}</h3><p>${S.bkP}</p>
    <div class="btns" style="margin-top:0"><button class="cta" id="exp">${S.exp}</button><button class="cta ghost" id="imp">${S.imp}</button></div>
    <input type="file" id="impf" accept="application/json,.json" hidden></div>
  <div class="tcard"><h3>${S.clrH}</h3><p>${S.clrP}</p><button class="cta ghost" id="clr">${S.clrBtn}</button></div>
  <div class="tcard"><h3>${S.infoH}</h3><p>${S.infoP}</p></div>`;
  bindLang();
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
      if (navigator.canShare && navigator.canShare({files:[f]})){ await navigator.share({files:[f], title:S.bkTitle}); return; } } catch(e){ if (e && e.name === "AbortError") return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast(S.exported);
  };
  const impf = document.getElementById("impf");
  document.getElementById("imp").onclick = () => impf.click();
  impf.onchange = async () => {
    const f = impf.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text()); if (d.app !== "xtarot") throw new Error("format");
      const h = store.get("history", []), ht = new Set(h.map(x => x.t)), nh = (d.history || []).filter(x => !ht.has(x.t));
      const cs = clients(), ci = new Set(cs.map(x => x.id)), nc = (d.clients || []).filter(x => !ci.has(x.id));
      store.set("history", h.concat(nh).sort((a, b) => b.t - a.t)); store.set("clients", cs.concat(nc));
      toast(S.imported(nh.length, nc.length));
    } catch(e){ toast(S.badFile); }
    impf.value = "";
  };
  twoTap(document.getElementById("clr"), S.clrBtn, S.clrConfirm, () => { store.set("history", []); toast(S.cleared); tools(); });
  window.scrollTo(0, 0);
}

/* ---------- resize / sw ---------- */
let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (R && document.getElementById("board")) layoutBoard(); }, 150); });
if ("serviceWorker" in navigator && location.protocol === "https:"){
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
home();
})();
