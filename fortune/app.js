// X Destiny — screens
(() => {
"use strict";
const $app = document.getElementById("app"), $nav = document.getElementById("nav");
const store = {
  get(k, d){ try{ const v = localStorage.getItem("xdest." + k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem("xdest." + k, JSON.stringify(v)); }catch(e){} }
};
const settings = Object.assign({lang:"en", lmt:true, big:false, zi:"late", eot:false}, store.get("settings", {}));
const LANG = settings.lang === "ko" ? "ko" : "en";
const T = LANG === "ko" ? TX_KO : TX_EN, U = T.ui;
document.documentElement.lang = LANG;
document.documentElement.classList.toggle("big", !!settings.big);
const saveSettings = () => store.set("settings", settings);
const people = () => store.get("people", []);
let activeId = store.get("active", null);
const STEMS = ENG.STEMS, BR = ENG.BRANCHES;
const EL_COLOR = ["#4f9a5c","#d0663a","#c9a24a","#aeb4c4","#3f7fc4"];
const SIGN_GLYPH = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"].map(g => g + "︎");
const PL_GLYPH = {Sun:"☉",Moon:"☽",Mercury:"☿",Venus:"♀",Mars:"♂",Jupiter:"♃",Saturn:"♄",Uranus:"♅",Neptune:"♆",Pluto:"♇",Node:"☊"};
const g = n => PL_GLYPH[n] + "︎";
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const strip = h => String(h).replace(/<br>/g, "\n").replace(/<[^>]+>/g, "");
function toast(m){ const t = document.createElement("div"); t.className = "toast"; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 2200); }
async function copy(text){ try { await navigator.clipboard.writeText(text); return true; } catch(e){
  const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select();
  let ok = false; try{ ok = document.execCommand("copy"); }catch(_){} ta.remove(); return ok; } }
const gzStr = (s, b) => `${STEMS[s]}${BR[b]}`;
const gzRead = (s, b) => LANG === "ko" ? `${T.stemRead[s]}${T.brRead[b]}` : `${T.stemRead[s]}-${T.brRead[b]}`;
const gzFull = (s, b) => `${gzStr(s, b)} (${gzRead(s, b)})`;
const elName = e => T.els[e].n;
const signName = i => T.signs[i][0];
const degStr = d => `${Math.floor(d)}°${String(Math.floor((d % 1) * 60)).padStart(2, "0")}′`;
const tgN = k => T.tg[k].n;
const cityLabel = c => LANG === "ko" ? c[1] : c[0];

/* ---------- compute & cache ---------- */
const cache = {};
function calc(p){
  const key = p.id + JSON.stringify(p) + settings.lmt + settings.zi + settings.eot + new Date().toDateString();
  if (!cache[key]){ const R = ENG.compute(p, {lmt:settings.lmt, zi:settings.zi, eot:settings.eot});
    try { R.pro = PRO.analyze(R, new Date());
      R.saju.strength = R.pro.strength; R.saju.fav = {group:R.pro.groupOfEl(R.pro.yong), el:R.pro.yong}; R.saju.favGroups = R.pro.favGroups;
    } catch(e){ console.error(e); }
    cache[key] = R; }
  return cache[key];
}
function active(){ const ps = people(); return ps.find(p => p.id === activeId) || ps[0] || null; }

/* ---------- nav ---------- */
let tab = "today";
const NAV = [
  ["today", '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>'],
  ["saju", '<rect x="3" y="4" width="4" height="16" rx="1"/><rect x="10" y="4" width="4" height="16" rx="1"/><rect x="17" y="4" width="4" height="16" rx="1"/>'],
  ["stars", '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>'],
  ["toj", '<path d="M4 5h16M4 9.5h6.5M13.5 9.5H20M4 14h16M4 18.5h6.5M13.5 18.5H20"/>'],
  ["iching", '<path d="M5 5h14M5 9h5.5M13.5 9H19M5 13h14M5 17h5.5M13.5 17H19M5 21h14" />'],
  ["year", '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'],
  ["people", '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1.2-3.6 3.6-5.5 6.5-5.5s5.3 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.6c2.6.1 4.5 1.8 5.5 4.8"/>']
];
const VIEWS = {today:viewToday, saju:viewSaju, stars:viewStars, toj:viewToj, iching:viewIching, year:viewYear, people:viewPeople};
const TJ = TOJ_TX[LANG], SJ = SJ_TX[LANG];
const sajuState = {sub:5};
function renderNav(){
  $nav.innerHTML = NAV.map(n => `<button data-t="${n[0]}" class="${tab === n[0] ? "on" : ""}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${n[1]}</svg>${n[0] === "iching" ? (LANG === "ko" ? "주역" : "I Ching") : n[0] === "toj" ? TJ.title : n[0] === "people" ? CT_TX[LANG].nav : U.nav[n[0]]}</button>`).join("");
  $nav.querySelectorAll("button").forEach(b => b.onclick = () => go(b.dataset.t));
}
function go(t){ tab = t; renderNav(); VIEWS[t](); window.scrollTo(0, 0); }
const head = (title, sub) => `<header class="ph"><div class="brand">X DESTINY</div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</header>`;
function whoBar(p){
  const ps = people();
  return `<div class="who"><span>${U.viewing(esc(p.name))}</span>${ps.length > 1 ? `<select id="whosel" aria-label="${U.switchP}">${ps.map(x => `<option value="${x.id}"${x.id === p.id ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select>` : ""}</div>`;
}
function bindWho(){ const s = document.getElementById("whosel"); if (s) s.onchange = () => { activeId = s.value; store.set("active", activeId); VIEWS[tab](); }; }
function needProfile(){
  $app.innerHTML = head(U.app, U.tagline) + `<div class="empty"><div class="globe"></div><p>${U.noProfile}</p><button class="cta" id="mk">${U.create}</button></div>`;
  document.getElementById("mk").onclick = () => profileForm(null);
}
const sec = (title, body, cls) => `<section class="card ${cls || ""}"><h2>${title}</h2>${body}</section>`;

/* ---------- widgets ---------- */
function ring(score, size, label){
  const r = size / 2 - 7, c = 2 * Math.PI * r, off = c * (1 - score / 100);
  return `<svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${label} ${score}">
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="7"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="url(#gold)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 ${size/2} ${size/2})"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" class="ringn">${score}</text></svg>`;
}
const bar = (v, max, color) => `<div class="bar"><i style="width:${Math.max(3, v / max * 100)}%;background:${color || "linear-gradient(90deg,#b98f45,#f0d79a)"}"></i></div>`;
const chip = (txt, color) => `<span class="chip" style="--c:${color}">${txt}</span>`;

function readingHTML(R){
  const secs = READING.natal(R, LANG, {geokName:k => (SJ.geok[k] || SJ.special[k] || [k])[0], okName:k => (SJ.ok[k] || [k])[0], okText:k => (SJ.ok[k] || ["", ""])[1], badName:k => (SJ.bad[k] || [k])[0], badText:k => (SJ.bad[k] || ["", ""])[1], specialText:k => (SJ.special[k] || ["", ""])[1]});
  const K = LANG === "ko", B = K ? "근거" : "Basis", O = K ? "원문" : "Original";
  return secs.map(x => sec(x.h, (x.verse ? `<blockquote class="verse">${x.verse}</blockquote><details><summary class="note">${O}</summary><p class="note">${x.zh}</p></details>` : "")
    + (x.p || []).map(t => `<p>${t}</p>`).join("")
    + (!x.verse && x.zh ? `<details><summary class="note">${K ? "『궁통보감』 원문" : "Qiongtong Baojian text"}</summary><p class="note">${x.zh}</p></details>` : "")
    + (x.luck ? x.luck.map(l => `<div class="row2${l.now ? " pos" : ""}${l.w === "down" || l.w === "downL" ? " neg" : ""}"><b>${l.head}${l.now ? (K ? " · 지금" : " · now") : ""}</b><p class="note">${l.sub}</p><p>${l.tx}</p>${l.rel.length ? `<p class="note">${l.rel.join(" · ")}</p>` : ""}</div>`).join("") : "")
    + (x.basis ? `<p class="note">${B}: ${x.basis}</p>` : ""))).join("");
}
function periodHTML(R, s, b, title){
  const P = READING.period(R, s, b, LANG);
  return sec(title, P.lines.map(t => `<p>${t}</p>`).join("") + `<p class="lead"><b>${P.verdict}</b></p><p class="note">${LANG === "ko" ? "근거: 십성의 통설적 의미, 용신·기신 판단(천간 4 : 지지 6), 원국 지지와의 충·합" : "Basis: conventional ten-god meanings, useful/adverse judgement (stem 4 : branch 6), clashes and combinations with natal branches"}</p>`);
}
/* ---------- TODAY ---------- */
const RK = {yong:"yong", hee:"hee", gi:"gi", gu:"gu", han:"han"};
const BRN = LANG === "ko" ? {liuhe:"육합", sanhe:"반합", chong:"충", hai:"해", same:"같은 지지"} : {liuhe:"six-harmony", sanhe:"half three-harmony", chong:"clash", hai:"harm", same:"same branch"};
function pillarFacts(R, s, b){
  const S = R.saju, X = R.pro, dm = S.dm, roleOf = e => SJ.roles[X.roleName ? X.roleName(e) : ""] || "";
  const rel = [0,1,2,3].filter(i => S.P[i]).map(i => { const k = ENG.branchRel(S.P[i].b, b); return k ? `${U.pillars[i]} ${BR[S.P[i].b]} — ${BRN[k]}` : ""; }).filter(Boolean);
  return `<div class="lucky"><div><span>${LANG === "ko" ? "천간 십성" : "Stem god"}</span><b>${tgN(ENG.tenGod(dm, s))}</b></div><div><span>${LANG === "ko" ? "지지 십성" : "Branch god"}</span><b>${tgN(ENG.tenGod(dm, ENG.BR_MAIN_STEM(b)))}</b></div><div><span>${U.stageL}</span><b>${T.stages[PRO.stage(dm, b)]}</b></div></div>
    <p class="note">${LANG === "ko" ? "오행 역할" : "Element roles"}: ${STEMS[s]} ${elName(ENG.STEM_EL[s])} → ${roleOf(ENG.STEM_EL[s])} · ${BR[b]} ${elName(ENG.BR_EL[b])} → ${roleOf(ENG.BR_EL[b])}</p>
    ${rel.length ? `<p class="note">${LANG === "ko" ? "원국과의 관계" : "With the natal chart"}: ${rel.join(" · ")}</p>` : ""}`;
}
const todState = {mode:"day", sit:"wed", off:0};
const glossHTML = keys => { const G = GLOSS[LANG === "ko" ? "ko" : "en"], ks = keys.filter(k => G[k]); if (!ks.length) return "";
  return sec(LANG === "ko" ? "용어 풀이" : "Glossary", ks.map(k => `<details><summary><b>${k}</b></summary><p class="note">${G[k]}</p></details>`).join("")); };
const WINDK = () => READING.L[LANG === "ko" ? "ko" : "en"].wind;
const dLabel = d => d.toLocaleDateString(LANG === "ko" ? "ko-KR" : "en-US", {month:"numeric", day:"numeric", weekday:"short"});
function almRow(o){
  const K = LANG === "ko", W = WINDK();
  return `<div class="row2${o.mine ? " neg" : o.good && !o.allBad ? " pos" : ""}"><b>${dLabel(o.date)} · ${STEMS[o.s]}${BR[o.b]} ${K ? `(${"갑을병정무기경신임계"[o.s]}${"자축인묘진사오미신유술해"[o.b]})` : ""}</b>
    <p class="note">${o.tsK} ${o.tsType === "黄道" ? (K ? "황도일" : "yellow-path") : (K ? "흑도일" : "black-path")} · ${o.zxK}${K ? "일" : ""} · ${o.xiuK}수(${o.xiuLuck === "吉" ? (K ? "길" : "good") : (K ? "흉" : "bad")})${o.wind ? ` · ${W[o.wind]}` : ""}${o.mine ? ` · <b>${K ? "본인 충일" : "your clash day"}</b>` : ""}</p>
    <p>${o.allBad ? (K ? "모든 일이 마땅치 않은 날" : "Nothing is suitable") : `${K ? "의" : "Do"}: ${o.yiK.slice(0, 6).join(", ")}`}</p></div>`;
}
function viewToday(){
  const p = active(); if (!p) return needProfile();
  const R = calc(p), now = new Date(), K = LANG === "ko", st = todState, X = R.pro;
  const seg = `<div class="seg" id="tmode">${[["day", K ? "오늘" : "Today"], ["week", K ? "이번 주" : "This week"], ["month", K ? "이번 달" : "This month"], ["pick", K ? "택일 (상황별)" : "Date picking"]].map(([k, l]) => `<button data-tm="${k}"${st.mode === k ? ' class="on"' : ""}>${l}</button>`).join("")}</div>`;
  let body = "";
  if (st.mode === "day"){
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + st.off), o = ALM.day(d, R), H = ALM.hours(d), E = T.els[X.yong];
    const chongMe = o.mine ? `<p class="warn">${K ? `오늘의 지지 ${BR[o.b]}가 본인의 ${o.chYear ? "띠(연지)" : ""}${o.chYear && o.chDay ? "·" : ""}${o.chDay ? "일지" : ""}와 충합니다 — 택일에서는 본인과 충하는 날을 피합니다.` : "Today's branch clashes your year or day branch — date selection avoids such days."}</p>` : "";
    body = `<div class="seg ysel">${[-1, 0, 1].map(k => `<button data-off="${st.off + k}"${k === 0 ? ' class="on"' : ""}>${dLabel(new Date(now.getFullYear(), now.getMonth(), now.getDate() + st.off + k))}</button>`).join("")}</div>
      ${sec(`${K ? "일진" : "Day pillar"} · ${gzFull(o.s, o.b)} · ${K ? "음력" : "lunar"} ${o.lunar}`, chongMe + pillarFacts(R, o.s, o.b))}
      ${periodHTML(R, o.s, o.b, READING.L[K ? "ko" : "en"].period.dayH)}
      ${sec(K ? "통서로 본 이날" : "The almanac for this day", `
        <div class="lucky"><div><span>${K ? "천신" : "Spirit"}</span><b>${o.tsK} · ${o.tsType === "黄道" ? (K ? "황도" : "yellow") : (K ? "흑도" : "black")}</b></div><div><span>${K ? "건제" : "Officer"}</span><b>${o.zxK}${K ? "일" : ""}</b></div><div><span>${K ? "28수" : "Mansion"}</span><b>${o.xiuK} · ${o.xiuLuck === "吉" ? (K ? "길" : "good") : (K ? "흉" : "bad")}</b></div></div>
        <div class="row2 pos"><b>${K ? "마땅한 일 (의)" : "Suitable"}</b><p>${o.yiK.join(", ") || "—"}</p></div>
        <div class="row2 neg"><b>${K ? "꺼리는 일 (기)" : "Avoid"}</b><p>${o.jiK.join(", ") || "—"}</p></div>
        <div class="row2"><b>${K ? "길신" : "Good spirits"}</b><p>${o.jsK.join(", ") || "—"}</p></div>
        <div class="row2"><b>${K ? "흉살" : "Bad spirits"}</b><p>${o.xsK.join(", ") || "—"}</p></div>
        <div class="lucky"><div><span>${K ? "충하는 띠" : "Clashes"}</span><b>${ALM.ANIMAL(o.chongB)}${K ? "띠" : ""}</b></div><div><span>${K ? "살 방위" : "Sha direction"}</span><b>${o.sha}</b></div><div><span>${K ? "구성" : "Star"}</span><b>${o.star}</b></div></div>
        <div class="lucky"><div><span>${K ? "희신 방위" : "Joy"}</span><b>${o.xi}</b></div><div><span>${K ? "재신 방위" : "Wealth"}</span><b>${o.cai}</b></div><div><span>${K ? "복신 방위" : "Fortune"}</span><b>${o.fu}</b></div></div>
        <div class="row2"><b>${K ? "팽조백기" : "Peng Zu taboos"}</b><p>${o.pzK.join("<br>")}</p></div>
        <div class="row2"><b>${K ? `${o.xiuK}수의 노래 (성수가)` : `Verse of the ${o.xiuK} mansion`}</b><p>${o.xiuSongK}</p><details><summary class="note">${K ? "원문" : "Original"}</summary><p class="note">${o.xiuSong}</p></details></div>
        <p class="note">${K ? "절기" : "Season"}: ${o.houK} (${o.hou})</p>
        <p class="note">${K ? "근거: 전통 통서(협기변방서 계통)의 택일 항목을 그대로 옮겼습니다." : "Basis: traditional almanac (Xie Ji Bian Fang Shu tradition) entries as given."}</p>`)}
      ${sec(K ? "시간별 길흉 (12시진)" : "Hours (12 double-hours)", H.map(h => `<div class="row2${h.type === "黄道" ? " pos" : " neg"}"><b>${h.from}–${h.to} · ${h.gz}</b><p class="note">${h.tsK} · ${h.type === "黄道" ? (K ? "황도" : "yellow") : (K ? "흑도" : "black")} · ${K ? "충" : "clash"} ${ALM.ANIMAL(h.chongB)}${(R.saju.P[0].b + 6) % 12 === BR.indexOf(h.gz[1]) || (R.saju.P[2].b + 6) % 12 === BR.indexOf(h.gz[1]) ? (K ? " · 본인 충" : " · clashes you") : ""}</p>${h.yiK.length ? `<p>${K ? "의" : "Do"}: ${h.yiK.join(", ")}</p>` : ""}</div>`).join(""))}
      ${sec(`${SJ.roles.yong} · ${elName(X.yong)}`, `<div class="lucky"><div><span>${U.luckyColor}</span><b>${E.color}</b></div><div><span>${U.luckyNum}</span><b>${E.nums}</b></div><div><span>${U.luckyDir}</span><b>${E.dir}</b></div></div><p class="note">${K ? "오행의 오방색·하도수·방위 대응" : "Classical five-element colour, Hetu number and direction"}</p>`)}
      ${glossHTML(K ? ["일진","황도일·흑도일","건제12신","28수","의·기","길신·흉살","팽조백기","충일","희신 방위·재신 방위·복신 방위","살 방위","구성","72후","십성","12운성","용신"] : ["Day pillar","Yellow/black path day","Twelve officers","28 mansions","Suitable/avoid","Peng Zu taboos","Clash day","72 pentads","Ten gods","Useful god"])}`;
  } else if (st.mode === "week" || st.mode === "month"){
    const days = st.mode === "week" ? 7 : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const start = st.mode === "week" ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : new Date(now.getFullYear(), now.getMonth(), 1);
    const list = Array.from({length:days}, (_, i) => ALM.day(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i), R));
    const good = list.filter(o => o.good && !o.mine && !o.allBad).length, mine = list.filter(o => o.mine).length;
    const m = R.months.find(x => x.m === now.getMonth() + 1);
    body = (st.mode === "month" && m ? periodHTML(R, m.s, m.b, `${READING.L[K ? "ko" : "en"].period.monthH} · ${gzFull(m.s, m.b)}`) : "")
      + sec(st.mode === "week" ? (K ? "앞으로 7일" : "Next 7 days") : (K ? `${now.getMonth() + 1}월 전체` : "The whole month"), `<p class="note">${K ? `황도일 ${good}일 · 본인 충일 ${mine}일 (초록 = 황도일, 붉은색 = 본인 충일)` : `${good} yellow-path days · ${mine} clash days`}</p>` + list.map(almRow).join(""))
      + glossHTML(K ? ["황도일·흑도일","건제12신","28수","의·기","충일"] : ["Yellow/black path day","Twelve officers","28 mansions","Suitable/avoid","Clash day"]);
  } else {
    const S = ALM.SIT.find(x => x[0] === st.sit), list = ALM.pick(st.sit, now, 90, R);
    body = sec(K ? "무엇을 하려 하나요" : "What are you planning?", `<div class="chips">${ALM.SIT.map(x => `<button data-sit="${x[0]}" class="${st.sit === x[0] ? "on" : ""}">${K ? x[1] : x[2]}</button>`).join("")}</div>
        <p class="note">${K ? `앞으로 90일 중 통서에서 '${S[1]}'에 해당하는 일을 '마땅한 일'로 꼽고 '꺼리는 일'로 꼽지 않은 날입니다. '모든 일이 마땅치 않은 날'과 본인 충일은 뺐습니다. 초록은 황도일입니다.` : `Days in the next 90 where the almanac lists this activity as suitable and not to avoid; days marked 'nothing suitable' and your clash days are excluded. Green = yellow-path day.`}</p>`)
      + sec(`${K ? S[1] : S[2]} · ${list.length}${K ? "일" : " days"}`, list.length ? list.map(almRow).join("") : `<p>${K ? "해당하는 날이 없습니다." : "No matching days."}</p>`)
      + glossHTML(K ? ["택일","의·기","황도일·흑도일","충일"] : ["Suitable/avoid","Yellow/black path day","Clash day"]);
  }
  $app.innerHTML = head(U.todayH, now.toLocaleDateString(K ? "ko-KR" : "en-US", {weekday:"long", year:"numeric", month:"long", day:"numeric"})) + whoBar(p) + seg + body + `<p class="disc">${U.disc}</p>`;
  bindWho();
  $app.querySelectorAll("[data-tm]").forEach(b => b.onclick = () => { st.mode = b.dataset.tm; st.off = 0; viewToday(); });
  $app.querySelectorAll("[data-off]").forEach(b => b.onclick = () => { st.off = +b.dataset.off; viewToday(); });
  $app.querySelectorAll("[data-sit]").forEach(b => b.onclick = () => { st.sit = b.dataset.sit; viewToday(); });
}

/* ---------- SAJU ---------- */
function viewSaju(){
  const p = active(); if (!p) return needProfile();
  const R = calc(p), S = R.saju, X = R.pro, dm = S.dm, sub = sajuState.sub;
  const order = [3, 2, 1, 0];
  const pn = i => U.pillars[i];
  const elChip = e => `<span class="chip" style="--c:${EL_COLOR[e]}">${elName(e)}</span>`;
  const tabs = `<div class="subtabs" role="tablist">${SJ.sub.map((t, i) => `<button role="tab" data-sub="${i}" class="${i === sub ? "on" : ""}">${t}</button>`).join("")}</div>`;
  let body = "";
  if (sub === 0){
    const col = i => { const x = S.P[i]; if (!x) return `<div class="pc empty"><div class="pl">${pn(i)}</div><div class="unk">?</div></div>`;
      return `<div class="pc${i === 2 ? " me" : ""}"><div class="pl">${pn(i)}</div>
        <div class="tg">${i === 2 ? U.self : tgN(x.tgS)}</div>
        <div class="ch" style="--c:${EL_COLOR[ENG.STEM_EL[x.s]]}">${STEMS[x.s]}<small>${T.stemRead[x.s]} · ${elName(ENG.STEM_EL[x.s])}</small></div>
        <div class="ch" style="--c:${EL_COLOR[ENG.BR_EL[x.b]]}">${BR[x.b]}<small>${T.brRead[x.b]} · ${T.animals[x.b][0]}</small></div>
        <div class="tg">${tgN(x.tgB)}</div>
        <div class="hd">${X.hid[i].map(h => `<span style="color:${EL_COLOR[ENG.STEM_EL[h.s]]}">${STEMS[h.s]}</span>`).join("")}</div>
        <div class="st">${T.stages[x.stage]}</div><div class="st">${SJ.sp12[X.sinsal12[i]].split(" — ")[0]}</div>
        <div class="st ny">${LANG === "ko" ? SJ.nayinKo[X.nayin[i]] : X.NAYIN[X.nayin[i]]}</div></div>`; };
    const lmtMin = p.time && settings.lmt ? Math.round(R.B.place.lon * 4 + (settings.eot ? ENG.eqTime(R.B.utc) : 0) - ENG.tzOffsetMin(R.B.utc, R.B.place.tz)) : null;
    const flags = X.dayFlags.map(f => `<li>${SJ.dayFlag[f]}</li>`).join("");
    const deuk = [X.deukryeong, X.deukji, X.deukse, X.roots.length > 0];
    body = `<section class="card"><div class="pillars">${order.map(col).join("")}</div>
        <div class="pnote">${!p.time ? SJ.timeNeed : lmtMin !== null ? U.lmtNote(lmtMin) : ""}</div>
        <div class="legend"><span>${U.stem}·${U.branch}</span><span>${U.hidden}</span><span>${U.stageL}</span><span>${LANG === "ko" ? "12신살·납음" : "spirit star · nayin"}</span></div></section>
      ${sec(`${SJ.ilju} · ${X.dayGZ} (${gzRead(S.P[2].s, S.P[2].b)})`, `<div class="dmh" style="--c:${EL_COLOR[ENG.STEM_EL[dm]]}"><span class="big">${STEMS[dm]}</span><div><b>${T.dm[dm][0]}</b><small>${T.yy[dm % 2]} ${elName(ENG.STEM_EL[dm])}</small></div></div>
        <p class="lead">${SJ.iljuLine(X.dayGZ, T.dm[dm][0], SJ.iljuImg[S.P[2].b], tgN(S.P[2].tgB), SJ.stageText[X.dayStage].split(" — ")[0])}</p><p>${T.dm[dm][1]}</p>${flags ? `<ul class="bul">${flags}</ul>` : ""}`)}
      ${sec(SJ.strengthH, `<p class="lead"><b>${SJ.bands[X.band][0]}</b></p><p>${SJ.bands[X.band][1]}</p>
        <div class="deuk">${deuk.map((v, i) => `<div class="${v ? "y" : "n"}"><b>${SJ.deuk[i]}</b><span>${i === 3 ? (v ? SJ.roots(X.roots.length) : SJ.no) : v ? SJ.yes : SJ.no}</span><small>${SJ.deukText[i]}</small></div>`).join("")}</div>`)}
      ${sec(SJ.elH, `<div class="els">${X.elPctFull.map((v, e) => `<div class="er"><span style="color:${EL_COLOR[e]}">${elName(e)}</span>${bar(v, 50, EL_COLOR[e])}<b class="pc2">${Math.round(v)}%</b></div>`).join("")}</div>`)}
      ${sec(SJ.tgH, `<div class="tgg">${Object.keys(X.tgW).map(k => `<div class="er"><span>${tgN(k)}</span>${bar(X.tgW[k], 40)}<b class="pc2">${Math.round(X.tgW[k])}%</b></div>`).join("")}</div>
        <div class="lucky">${["companion","output","wealth","officer","resource"].map(g => `<div><span>${T.groups[g]}</span><b>${Math.round(X.grpPct[g])}%</b></div>`).join("")}</div>`)}
      ${sec(SJ.hidH, `<div class="hidt">${[0,1,2,3].filter(i => S.P[i]).map(i => `<div><b>${pn(i)} ${BR[S.P[i].b]}</b>${X.hid[i].map(h => `<span style="--c:${EL_COLOR[ENG.STEM_EL[h.s]]}"><em>${STEMS[h.s]}</em> ${SJ.hidRole[h.role]} · ${SJ.days(h.days)} · ${tgN(h.tg)}</span>`).join("")}</div>`).join("")}</div>
        ${X.saryeong ? `<p class="lead">${SJ.saryeongL}: <b>${STEMS[X.saryeong.s]}</b> — ${SJ.saryeong(SJ.terms[X.saryeong.term] || X.saryeong.term, X.saryeong.day, STEMS[X.saryeong.s], tgN(X.saryeong.tg))}</p>` : ""}`)}
      ${sec(LANG === "ko" ? "공망·태원·명궁" : "Void, conception & life palace", `<div class="lucky"><div><span>${SJ.gongH}</span><b>${X.kong.map(b => BR[b]).join("")}</b></div>${X.taiyuan ? `<div><span>${SJ.taiyuanL}</span><b>${toHanja(X.taiyuan)}</b></div>` : ""}${X.minggong ? `<div><span>${SJ.minggongL}</span><b>${toHanja(X.minggong)}</b></div>` : ""}</div>`)}`;
  } else if (sub === 1){
    const G = X.special ? SJ.special[X.special] : SJ.geok[X.geok];
    const R5 = ["yong","hee","gi","gu","han"], roleEl = {yong:X.yong, hee:X.hee, gi:X.gi, gu:X.gu, han:X.han};
    const E = T.els[X.yong];
    body = `${sec(SJ.geokH, `<p class="lead"><b class="gname">${G[0]}</b> ${X.special ? "" : `<span class="gchip g${{seong:0, seongpa:2, pa:4, pyeong:2}[X.geokGrade]}">${SJ.geokGrade[X.geokGrade][0]}</span>`}</p>
        <p>${G[1]}</p>${X.special ? `<p class="note">${SJ.specialNote}</p>` : `<p class="note">${LANG === "ko" ? "격을 정한 글자" : "Structure taken from"}: ${pn(1)} ${BR[S.P[1].b]} → <b>${STEMS[X.geokStem]}</b></p>
        <p>${SJ.geokGrade[X.geokGrade][1]}</p>
        ${X.ok.map(k => `<div class="row2 pos"><b>✓ ${SJ.ok[k][0]}</b><p>${SJ.ok[k][1]}</p></div>`).join("")}
        ${X.bad.map(k => `<div class="row2 neg"><b>✕ ${SJ.bad[k][0]}</b><p>${SJ.bad[k][1]}</p></div>`).join("")}`}
        ${!X.special ? `<p class="note">${SJ.careerH}: ${G[2]}</p>` : ""}`)}
      ${sec(SJ.yongH, `<div class="roles">${R5.filter(r => roleEl[r] !== undefined).map(r => `<div class="rl r-${r}"><span>${SJ.roles[r]}</span><b style="color:${EL_COLOR[roleEl[r]]}">${elName(roleEl[r])}</b><small>${T.groups[X.groupOfEl(roleEl[r])]}</small></div>`).join("")}</div>
        <p class="lead">${SJ.method[X.method]}</p>
        ${R5.filter(r => roleEl[r] !== undefined).map(r => `<div class="row2"><b>${SJ.roles[r]} · ${elName(roleEl[r])}</b><p>${SJ.roleText[r]}</p></div>`).join("")}`)}
      ${(() => { const TH = TIAOHOU.get(dm, S.P[1].b); if (!TH) return "";
        const K = LANG === "ko", EK = K ? ["목","화","토","금","수"] : ["Wood","Fire","Earth","Metal","Water"];
        const nm = st => `${T.stemRead[st]}${K ? EK[ENG.STEM_EL[st]] : " " + EK[ENG.STEM_EL[st]]}`;
        const where = st => { const top = [0,1,2,3].filter(i => S.P[i] && S.P[i].s === st && i !== 2).map(i => pn(i)); const hid = [0,1,2,3].filter(i => S.P[i] && X.hid[i].some(h => h.s === st)).map(i => pn(i));
          return top.length ? (K ? `천간에 드러남 (${top.join("·")})` : `visible stem (${top.join(", ")})`) : hid.length ? (K ? `지장간에 숨음 (${hid.join("·")})` : `hidden stem (${hid.join(", ")})`) : (K ? "없음" : "absent"); };
        return sec(K ? "궁통보감 조후 용신" : "Seasonal useful god (Qiongtong Baojian)", `<p class="lead">${TH.use.map(nm).join(" → ")}</p>
          ${TH.use.map(st => `<div class="row2"><b style="color:${EL_COLOR[ENG.STEM_EL[st]]}">${nm(st)}</b><p>${where(st)}</p></div>`).join("")}
          <p>${TH.ko}</p><details><summary class="note">${K ? "원문 보기" : "Original text"}</summary><p class="note">${TH.zh}</p></details>
          <p class="note">${K ? "출처: 『궁통보감』 원문. 억부 용신과 다를 수 있으며, 두 기준을 함께 봅니다." : "Source: Qiongtong Baojian. It may differ from the strength-based useful god; read both."}</p>`); })()}
      ${sec(`${SJ.yongUse} · ${elName(X.yong)}`, `<div class="lucky"><div><span>${U.luckyColor}</span><b>${E.color}</b></div><div><span>${U.luckyNum}</span><b>${E.nums}</b></div><div><span>${U.luckyDir}</span><b>${E.dir}</b></div></div>
`)}`;
  } else if (sub === 2){
    const posLabel = pos => pos.map(pn).join("·");
    body = `${sec(SJ.relH, X.rels.length ? X.rels.map(r => `<div class="row2 ${["chong","hyeong","samhyeong","jahyeong","pa","hai","wonjin","stemChong"].includes(r.k) ? "neg" : ["gwimun"].includes(r.k) ? "" : "pos"}"><b>${SJ.rel[r.k][0]} · <span class="han">${r.ch}</span>${r.el != null ? ` → ${elName(r.el)}` : ""} <span class="orb">${posLabel(r.pos)} (${SJ.pairs[r.pos.join("")] || ""})</span></b><p>${SJ.rel[r.k][1]}</p></div>`).join("") : `<p>${SJ.relNone}</p>`)}
      ${sec(SJ.starH, X.stars.length ? X.stars.map(s => `<div class="row2"><b>${SJ.star[s.k][0]} <span class="orb">${s.k === "hyeonchim" ? "" : posLabel(s.pos)}</span></b><p>${SJ.star[s.k][1]}</p></div>`).join("") : `<p>${SJ.starNone}</p>`)}
      ${sec(SJ.sinsal12H, [0,1,2,3].filter(i => S.P[i]).map(i => `<div class="row2"><b>${pn(i)} ${BR[S.P[i].b]}</b><p>${SJ.sp12[X.sinsal12[i]]}</p></div>`).join(""))}
      ${sec(SJ.stage12H, [0,1,2,3].filter(i => S.P[i]).map(i => `<div class="row2"><b>${pn(i)} ${BR[S.P[i].b]} · ${T.stages[S.P[i].stage]}</b><p>${SJ.stageText[S.P[i].stage]}</p></div>`).join(""))}`;
  } else if (sub === 3){
    const pal = [0,1,2,3].map(i => { const x = S.P[i]; if (!x) return `<div class="row2"><b>${SJ.palace[i][0]}</b><p class="note">${SJ.timeNeed}</p></div>`;
      const k = i === 2 ? S.P[2].tgB : x.tgS, grp = ENG.TG_GROUP[k];
      return `<div class="row2"><b>${SJ.palace[i][0]} · ${gzStr(x.s, x.b)} · ${tgN(k)}</b><small class="note">${SJ.palace[i][1]}</small><p>${SJ.palaceGroup[grp][i]}</p></div>`; }).join("");
    const kinKeys = ["spouse","children","father","mother","siblings"];
    const kin = kinKeys.map(k => { const K = X.kin[k], where = [...new Set(K.loc.filter(l => l.at !== "h").map(l => pn(l.i)))].join("·");
      const star = k === "spouse" || k === "children" ? SJ.kinStar(p.gender, k) : k === "father" ? tgN("piancai") : k === "mother" ? `${tgN("zhengyin")}·${tgN("pianyin")}` : `${tgN("bijian")}·${tgN("jiecai")}`;
      return `<div class="row2"><b>${SJ.kin[k]} <span class="orb">${star}${where ? ` · ${where}` : ""}</span></b><p>${SJ.kinLevel[K.level]}${K.clash ? " " + SJ.kinClash : ""}${K.empty ? " " + SJ.kinEmpty : ""}</p></div>`; }).join("");
    body = `${sec(SJ.palaceH, pal)}
      ${sec(SJ.spouseH, `<p class="lead"><b>${BR[S.P[2].b]} · ${tgN(X.spouseGod)}</b></p><p>${SJ.spouseGod[X.spouseGod]}</p>${[...new Set(X.dayHit)].map(k => SJ.dayHitText[k] ? `<p class="note">• ${SJ.dayHitText[k]}</p>` : "").join("")}`)}
      ${sec(SJ.kinH, (p.gender ? "" : `<p class="note">${SJ.kinNoGender}</p>`) + kin)}`;
  } else if (sub === 5){
    body = readingHTML(R) + reportButtons();
  } else {
    const relLines = rel => rel.map(([k, i]) => SJ.luckRelText(k, pn(i))).filter(Boolean);
    body = sec(SJ.luckH, X.luck.length ? X.luck.map(L => `<div class="lkd${L.now ? " on" : ""}"><div class="lkh"><span class="lkgz"><b style="color:${EL_COLOR[ENG.STEM_EL[L.s]]}">${STEMS[L.s]}</b><b style="color:${EL_COLOR[ENG.BR_EL[L.b]]}">${BR[L.b]}</b></span>
        <div><b>${SJ.ageL(L.age)} · ${L.y0}–${L.y1}${L.now ? ` <em class="nowb">${SJ.nowLuck}</em>` : ""}</b><small>${tgN(L.tg)} / ${tgN(L.tgB)} · ${SJ.luckRole(L.rs, L.rb, SJ.roles)} · ${T.stages[L.stage]}</small></div></div>
        ${relLines(L.rel).length ? `<p class="note">${relLines(L.rel).join(" · ")}</p>` : ""}</div>`).join("") : `<p>${U.noLuck}</p>`)
      + sec(SJ.yearsH, X.years.map(Y => `<div class="row2"><b>${Y.y} ${gzFull(Y.s, Y.b)} · ${SJ.yearAge(Y.age)}</b><p>${tgN(Y.tg)}${relLines(Y.rel).length ? ` · ${relLines(Y.rel).join(" · ")}` : ""}</p></div>`).join(""))
      + reportButtons();
  }
  $app.innerHTML = head(U.sajuH, `${esc(p.name)} · ${birthLine(p, R)}`) + whoBar(p) + tabs + body + `<p class="disc">${U.disc}</p>`;
  bindWho(); bindReport(R);
  $app.querySelectorAll("[data-sub]").forEach(b => b.onclick = () => { sajuState.sub = Math.min(5, +b.dataset.sub); viewSaju(); const t = $app.querySelector(".subtabs .on"); if (t) t.scrollIntoView({inline:"center", block:"nearest"}); });
}
const toHanja = x => x;
function birthLine(p, R){
  const d = `${R.B.y}-${String(R.B.m).padStart(2, "0")}-${String(R.B.d).padStart(2, "0")}`;
  const lun = `${LANG === "ko" ? "음력" : "lunar"} ${R.B.lunarY}.${R.B.lunarM}.${R.B.lunarD}${R.B.lunarLeap ? (LANG === "ko" ? " 윤" : " leap") : ""}`;
  return `${d}${p.time ? " " + p.time : ""} (${lun}) · ${esc(p.place.label || "")}`;
}

/* ---------- STARS ---------- */
function wheel(W){
  const S = 340, C = S / 2, R1 = 160, R2 = 130, R3 = 104, R4 = 78;
  const base = W.ang ? W.ang.asc : 0;
  const P = (lon, r) => { const th = (180 + (lon - base)) * Math.PI / 180; return [C + r * Math.cos(th), C - r * Math.sin(th)]; };
  let s = `<svg class="wheel" viewBox="0 0 ${S} ${S}" role="img" aria-label="${U.westH}">`;
  s += `<circle cx="${C}" cy="${C}" r="${R1}" class="w1"/><circle cx="${C}" cy="${C}" r="${R2}" class="w2"/><circle cx="${C}" cy="${C}" r="${R4}" class="w3"/>`;
  const ELC = ["#d0663a","#4f9a5c","#9aa6c4","#3f7fc4"];
  for (let i = 0; i < 12; i++){
    const [x1, y1] = P(i * 30, R2), [x2, y2] = P(i * 30, R1), [tx, ty] = P(i * 30 + 15, (R1 + R2) / 2);
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="wl"/><text x="${tx}" y="${ty}" class="sg" fill="${ELC[i % 4]}" text-anchor="middle" dominant-baseline="central">${SIGN_GLYPH[i]}</text>`;
    if (W.ang){ const [a1, b1] = P(i * 30, R4), [a2, b2] = P(i * 30, R2); s += `<line x1="${a1}" y1="${b1}" x2="${a2}" y2="${b2}" class="wh"/>`; }
  }
  // aspects
  const pos = {}; W.pl.forEach(p => pos[p.n] = p.lon);
  W.asp.forEach(a => { if (a.k === "conjunction") return; const [x1, y1] = P(pos[a.a], R4 - 2), [x2, y2] = P(pos[a.b], R4 - 2);
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="as ${["square","opposition"].includes(a.k) ? "hard" : "soft"}"/>`; });
  // planets with simple de-overlap
  const pl = W.pl.map(p => ({...p, d:p.lon})).sort((a, b) => a.lon - b.lon);
  for (let k = 0; k < 3; k++) for (let i = 1; i < pl.length; i++){ if (pl[i].d - pl[i - 1].d < 7) pl[i].d = pl[i - 1].d + 7; }
  pl.forEach(p => { const [x, y] = P(p.d, R3), [mx, my] = P(p.lon, R2 - 2), [nx, ny] = P(p.lon, R2 - 8);
    s += `<line x1="${mx}" y1="${my}" x2="${nx}" y2="${ny}" class="tick"/><text x="${x}" y="${y}" class="pg${p.n === "Sun" || p.n === "Moon" ? " lum" : ""}" text-anchor="middle" dominant-baseline="central">${g(p.n)}</text>`; });
  if (W.ang){ const [ax, ay] = P(W.ang.asc, R1 + 2), [bx, by] = P(W.ang.asc, R4), [mx, my] = P(W.ang.mc, R1 + 2), [nx, ny] = P(W.ang.mc, R4);
    s += `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" class="axis"/><line x1="${mx}" y1="${my}" x2="${nx}" y2="${ny}" class="axis"/>`;
    const [lx, ly] = P(W.ang.asc, R1 - 40); s += `<text x="${lx}" y="${ly - 8}" class="axl">AC</text>`;
    const [qx, qy] = P(W.ang.mc, R1 - 40); s += `<text x="${qx + 8}" y="${qy}" class="axl">MC</text>`; }
  return s + `</svg>`;
}
function viewStars(){
  const p = active(); if (!p) return needProfile();
  const R = calc(p), W = R.west, V = R.vedic;
  const big = [["Sun", W.pl[0].sign, 2], ["Moon", W.pl[1].sign, 3]];
  const asc = W.ang ? Math.floor(W.ang.asc / 30) : null;
  const card3 = (lbl, glyph, si, line, deg) => `<div class="b3"><div class="g3">${glyph}</div><span>${lbl}</span><b>${signName(si)}</b><small>${deg}</small><p>${line}</p></div>`;
  $app.innerHTML = head(U.westH, `${esc(p.name)} · ${birthLine(p, R)}`) + whoBar(p) + `
    <section class="card wheelc">${wheel(W)}<div class="pnote">${W.ang ? U.housesNote : U.noAsc}</div></section>
    ${sec(U.bigThree, `<div class="big3">${card3(U.sunL, g("Sun"), W.pl[0].sign, T.signs[W.pl[0].sign][2], degStr(W.pl[0].deg))}${card3(U.moonL, g("Moon"), W.pl[1].sign, T.signs[W.pl[1].sign][3], degStr(W.pl[1].deg))}${asc !== null ? card3(U.ascL, "AC", asc, T.signs[asc][4], degStr(W.ang.asc % 30)) : `<div class="b3 off"><div class="g3">AC</div><span>${U.ascL}</span><p>${U.noAsc}</p></div>`}</div>
      ${W.moonUncertain ? `<p class="note">${U.moonUnc}</p>` : ""}`)}
    ${sec(U.planetsH, `<div class="ptab">${W.pl.map(x => `<div class="pr"><span class="gl">${g(x.n)}</span><span class="pn">${T.planets[x.n][0]}${x.rx && x.n !== "Node" ? ` <em>${U.rx}</em>` : ""}</span><span class="ps">${SIGN_GLYPH[x.sign]} ${signName(x.sign)} ${degStr(x.deg)}</span>${x.house ? `<span class="ph2">${x.house}H</span>` : ""}<small>${T.planets[x.n][1]} · ${T.signs[x.sign][1]}${x.house ? ` · ${T.houses[x.house - 1]}` : ""}</small></div>`).join("")}</div>`)}
    ${sec(U.aspectsH, W.asp.length ? W.asp.map(a => `<div class="row2"><b>${g(a.a)} ${T.planets[a.a][0]} · ${T.aspects[a.k][0]} · ${g(a.b)} ${T.planets[a.b][0]}</b><p>${T.planets[a.a][1]} ${LANG === "ko" ? "과(와)" : "and"} ${T.planets[a.b][1]}${LANG === "ko" ? "가 " : " "}${T.aspects[a.k][1]}${LANG === "ko" ? "" : "."} <span class="orb">${LANG === "ko" ? "오차" : "orb"} ${a.orb.toFixed(1)}°</span></p></div>`).join("") : "<p>—</p>")}
    ${sec(U.balanceH, `<div class="els">${W.elems.map((c, i) => `<div class="er"><span>${T.elemNames[i]}</span>${bar(c, 8, ["#d0663a","#4f9a5c","#9aa6c4","#3f7fc4"][i])}<b>${c}</b></div>`).join("")}</div>
      <div class="els">${W.modes.map((c, i) => `<div class="er"><span>${T.modeNames[i]}</span>${bar(c, 8)}<b>${c}</b></div>`).join("")}</div>`)}
    <section class="card"><h2>${U.vedicH}</h2><p class="note">${U.vedicNote(V.ayanamsa)}</p>
      <div class="lucky v3"><div><span>${U.moonRashi}</span><b>${T.rashi[V.moonSign]}</b></div><div><span>${U.sunSid}</span><b>${T.rashi[V.sunSign]}</b></div><div><span>${U.lagna}</span><b>${V.lagna !== null ? T.rashi[V.lagna] : "—"}</b></div></div>
      <h3>${U.nakH}</h3><p class="lead"><b>${T.naks[V.nak][0]}</b> · ${U.pada(V.pada)}</p><p>${T.naks[V.nak][1]}</p>
      <h3>${U.dashaH}</h3>
      <div class="row2"><b>${U.maha}: ${T.dashaName[V.maha.lord]} <span class="orb">${U.until(U.fmtDate(V.maha.to))}</span></b><p>${T.dasha[V.maha.lord]}</p></div>
      ${V.antar ? `<div class="row2"><b>${U.antar}: ${T.dashaName[V.antar.lord]} <span class="orb">${U.until(U.fmtDate(V.antar.to))}</span></b><p>${T.dasha[V.antar.lord]}</p></div>` : ""}
      <div class="dseq">${V.seq.filter(s => s.to > Date.now() - 20 * 365 * 864e5).slice(0, 6).map(s => `<span class="${s === V.maha ? "on" : ""}">${T.dashaName[s.lord]}<small>${new Date(s.from).getFullYear()}–${new Date(s.to).getFullYear()}</small></span>`).join("")}</div></section>
    ${reportButtons()}
    <p class="disc">${U.disc}</p>`;
  bindWho(); bindReport(R);
}

const ageState = {dec:-1, open:-1};
function ageHTML(R){
  const K = LANG === "ko", S = R.saju, P = S.P, dm = S.dm, by = R.B.y, W = WINDK(), nowAge = new Date().getFullYear() - by + 1;
  const dec = ageState.dec < 0 ? Math.max(0, Math.floor((nowAge - 1) / 10)) : ageState.dec;
  const sj = (b, y) => { const g = [0,1,2,3].find(x => [[8,0,4],[5,9,1],[2,6,10],[11,3,7]][x].includes(R.zod.animal)), st = [2,11,8,5][g]; const k = ((y - st) % 12 + 12) % 12; return k < 3 ? (K ? ["들삼재","눌삼재","날삼재"][k] : ["Calamity yr 1","Calamity yr 2","Calamity yr 3"][k]) : ""; };
  const rows = [];
  for (let a = dec * 10 + 1; a <= dec * 10 + 10; a++){
    const y = by + a - 1, yp = ENG.yearPillar(y), Lk = (R.pro.luck || []).find(l => y >= l.y0 && y <= l.y1);
    const w = READING.windOf(R.pro.roleName([0,0,1,1,2,2,3,3,4,4][yp.s]), R.pro.roleName([4,2,0,0,2,1,1,2,3,3,2,4][yp.b]));
    const ch = [0,2].filter(i => (P[i].b + 6) % 12 === yp.b).map(i => i === 0 ? (K ? "띠 충" : "year clash") : (K ? "일지 충" : "day clash"));
    const tags = [W[w], ...ch, sj(yp.b, yp.b)].filter(Boolean);
    rows.push(`<div class="row2${a === nowAge ? " pos" : ""}${w === "down" || ch.length ? " neg" : ""}" data-age="${a}"><b>${K ? `${a}세` : `Age ${a}`} · ${y} · ${STEMS[yp.s]}${BR[yp.b]}${Lk ? ` <span class="orb">${K ? "대운" : "luck"} ${STEMS[Lk.s]}${BR[Lk.b]}</span>` : ""}</b>
      <p class="note">${tgN(ENG.tenGod(dm, yp.s))} · ${T.stages[PRO.stage(dm, yp.b)]} · ${tags.join(" · ")}</p>
      ${ageState.open === a ? READING.period(R, yp.s, yp.b, LANG).lines.map(t => `<p>${t}</p>`).join("") + `<p><b>${READING.period(R, yp.s, yp.b, LANG).verdict}</b></p>` : ""}</div>`);
  }
  return sec(K ? "나이별 운의 흐름" : "Year by year, by age", `<div class="chips">${Array.from({length:9}, (_, i) => `<button data-dec="${i}" class="${i === dec ? "on" : ""}">${K ? `${i * 10 + 1}–${i * 10 + 10}세` : `${i * 10 + 1}–${i * 10 + 10}`}</button>`).join("")}</div>
    <p class="note">${K ? "줄을 누르면 그해의 기운 읽기가 열립니다. 세는나이 기준, 해는 입춘으로 바뀝니다." : "Tap a row to open that year's reading. Korean age; years change at the Start of Spring."}</p>${rows.join("")}`);
}
/* ---------- YEAR ---------- */
function viewYear(){
  const p = active(); if (!p) return needProfile();
  const R = calc(p), S = R.saju, y = R.year, yp = R.yp;
  const Z = R.zod, nowM = new Date().getMonth() + 1;
  const jupH = ((R.transit.jup - R.west.pl[0].sign + 12) % 12) + 1, satH = ((R.transit.sat - R.west.pl[0].sign + 12) % 12) + 1;
  $app.innerHTML = head(U.yearH(y), esc(p.name)) + whoBar(p) + `
    ${sec(`${U.sewoon} · ${gzFull(yp.s, yp.b)}`, pillarFacts(R, yp.s, yp.b) + (R.curLuck ? `<p class="note">${U.luckCur}: ${gzFull(R.curLuck.s, R.curLuck.b)} · ${tgN(R.curLuck.tg)}</p>` : ""))}
    ${periodHTML(R, yp.s, yp.b, READING.L[LANG === "ko" ? "ko" : "en"].period.yearH)}
    ${(() => { const m = R.months.find(x => x.m === nowM); return m ? periodHTML(R, m.s, m.b, `${READING.L[LANG === "ko" ? "ko" : "en"].period.monthH} · ${STEMS[m.s]}${BR[m.b]}`) : ""; })()}
    ${sec(U.monthsH, `<div class="months">${R.months.map(m => `<div class="mo${m.m === nowM ? " on" : ""}"><span>${U.monthName(m.m)}</span><b>${STEMS[m.s]}${BR[m.b]}</b><small>${tgN(m.tg)}</small></div>`).join("")}</div>
      <p class="note">${LANG === "ko" ? "월 기준은 절기(절입일)입니다." : "Months follow the solar terms of the Chinese calendar."}</p>`)}
    ${sec(U.zodH, `<p class="lead">${U.yourAnimal}: <b>${T.animals[Z.animal][0]}</b> · ${U.zodYear(T.animals[Z.yearBranch][0])}${BRN[Z.rel] ? ` — ${BRN[Z.rel]}` : ""}</p>
      ${Z.samjae ? `<p class="warn">${T.samjae[Z.samjae]}</p>` : ""}
      <div class="lucky"><div><span>${U.bestMatch}</span><b>${Z.best.map(b => T.animals[b][0]).join(", ")}</b></div><div><span>${U.clash}</span><b>${T.animals[Z.worst][0]}</b></div></div>`)}
    ${ageHTML(R)}
    ${sec(U.transitH, `<p>${U.jupLine(signName(R.transit.jup), jupH, T.houses[jupH - 1])}</p><p>${U.satLine(signName(R.transit.sat), satH, T.houses[satH - 1])}</p>`)}
    ${sec(`${U.nextYear} · ${y + 1}`, pillarFacts(R, R.ypNext.s, R.ypNext.b))}
    ${reportButtons()}
    <p class="disc">${U.disc}</p>`;
  bindWho(); bindReport(R);
  $app.querySelectorAll("[data-dec]").forEach(b => b.onclick = () => { ageState.dec = +b.dataset.dec; ageState.open = -1; viewYear(); });
  $app.querySelectorAll("[data-age]").forEach(b => b.onclick = () => { ageState.open = ageState.open === +b.dataset.age ? -1 : +b.dataset.age; const y = window.scrollY; viewYear(); window.scrollTo(0, y); });
}

/* ---------- TOJEONG ---------- */
const tojState = {yOff:0};
function viewToj(){
  const p = active(); if (!p) return needProfile();
  const R = calc(p), ly = TOJ.currentLunarYear() + tojState.yOff, C = TOJ.code(R.B, ly), K = LANG === "ko";
  const row = (a, b) => `<div class="row2"><b>${a}</b><p>${b}</p></div>`;
  $app.innerHTML = head(TJ.title, esc(p.name)) + whoBar(p) + `
    <div class="seg ysel">${[0, 1].map(i => `<button data-yo="${i}"${tojState.yOff === i ? ' class="on"' : ""}>${TOJ.currentLunarYear() + i}</button>`).join("")}</div>
    <section class="card c"><p class="note">${TJ.lyear(ly)}</p><b class="code big">${C.code}</b><p class="lead">${K ? "상괘" : "Upper"} ${C.up} · ${K ? "중괘" : "Middle"} ${C.mid} · ${K ? "하괘" : "Lower"} ${C.low}</p></section>
    ${sec(K ? "작괘 과정" : "How the reading is drawn",
      row(`${K ? "상괘" : "Upper"} = ${C.up}`, `(${K ? "세는나이" : "age (Korean count)"} ${C.age} + ${K ? "태세" : "year pillar"} ${C.tyGz} ${C.tyN}) = ${C.age + C.tyN} ÷ 8 → ${K ? "나머지" : "remainder"} ${C.up}`) +
      row(`${K ? "중괘" : "Middle"} = ${C.mid}`, `(${K ? `당년 생월(음 ${C.bm}월) 날수` : `days in birth month (lunar ${C.bm}) this year`} ${C.days} + ${K ? "월건" : "month pillar"} ${C.mGz} ${C.mN}) = ${C.days + C.mN} ÷ 6 → ${K ? "나머지" : "remainder"} ${C.mid}`) +
      row(`${K ? "하괘" : "Lower"} = ${C.low}`, `(${K ? "생일" : "birth day"} ${C.bd} + ${K ? "일진" : "day pillar"} ${C.dGz} ${C.dN}) = ${C.bd + C.dN} ÷ 3 → ${K ? "나머지" : "remainder"} ${C.low}`) +
      `<p class="note">${TJ.method} ${K ? "나머지가 0이면 나누는 수(8·6·3)를 씁니다." : "A remainder of 0 counts as the divisor (8, 6, 3)."}</p>`)}
    ${sec(K ? "원문" : "Original verse", `<p>${K ? `${C.code}괘의 원문은 정본(원문 수록본)을 확보해 옮긴 뒤 수록합니다. 확인되지 않은 풀이는 싣지 않습니다.` : `The original verse for reading ${C.code} will be added once an authentic edition is transcribed. Unverified interpretations are not shown.`}</p>`)}
    <p class="disc">${U.disc}</p>`;
  bindWho();
  $app.querySelectorAll("[data-yo]").forEach(b => b.onclick = () => { tojState.yOff = +b.dataset.yo; viewToj(); });
}

/* ---------- I CHING ---------- */
const iState = {method:"yarrow", manual:[7,8,7,8,7,8], q:"", res:null};
function hexSVG(vals, useTo){
  const W = 92, h = 9, gap = 6;
  return `<svg viewBox="0 0 ${W} ${6 * (h + gap)}" width="${W}" class="hexsvg">${vals.map((v, i) => { const y = (5 - i) * (h + gap);
    const yang = useTo ? (v === 7 || v === 6) : (v === 7 || v === 9), mv = !useTo && (v === 6 || v === 9);
    const col = mv ? "#f0d79a" : "currentColor";
    return (yang ? `<rect x="0" y="${y}" width="${W}" height="${h}" rx="2" fill="${col}"/>` : `<rect x="0" y="${y}" width="${W * 0.42}" height="${h}" rx="2" fill="${col}"/><rect x="${W * 0.58}" y="${y}" width="${W * 0.42}" height="${h}" rx="2" fill="${col}"/>`) +
      (mv ? `<text x="${W / 2}" y="${y + h - 1}" text-anchor="middle" font-size="${yang ? 9 : 11}" font-weight="700" fill="${yang ? "#1a1530" : "#f0d79a"}">${v === 9 ? "○" : "×"}</text>` : ""); }).join("")}</svg>`;
}
function viewIching(){
  const K = LANG === "ko", st = iState, R = st.res;
  const VN = K ? {6:"노음 6 (변)", 7:"소양 7", 8:"소음 8", 9:"노양 9 (변)"} : {6:"old yin 6 (moving)", 7:"young yang 7", 8:"young yin 8", 9:"old yang 9 (moving)"};
  const hexName = H => K ? `${H.ko} (${H.n})` : `${H.n}. ${H.zh_name}`;
  const txt = t => { const H = t.hex, idx = t.kind === "judgment" ? 0 : t.kind === "use" ? 7 : t.i + 1;
    const label = t.kind === "judgment" ? (K ? `${H.ko} · 괘사` : `${hexName(H)} · judgment`) : t.kind === "use" ? (K ? `${H.ko} · ${H.n === 1 ? "용구" : "용육"}` : `${hexName(H)} · ${H.n === 1 ? "use nines" : "use sixes"}`) : `${K ? H.ko : hexName(H)} · ${ICHING.lineName(t.i, H.bits[t.i] === "1", K)}`;
    return `<div class="row2${t.main ? " pos" : ""}"><b>${t.main ? (K ? "● 위주 · " : "● main · ") : ""}${label}</b><p>${H.kt[idx]}</p><details><summary class="note">${K ? "원문" : "Original"}</summary><p class="note">${H.zh[idx]}</p></details></div>`; };
  let res = "";
  if (R){
    res = `<section class="card"><div style="display:flex;gap:22px;justify-content:center;align-items:flex-end;text-align:center">
        <div>${hexSVG(R.vals)}<p class="lead"><b>${R.B.ko}</b></p><small class="note">${K ? "본괘" : "Primary"} · ${R.B.n} · ${K ? `위 ${R.B.up} / 아래 ${R.B.lo}` : ""}</small></div>
        ${R.Z ? `<div style="font-size:22px;opacity:.6">→</div><div>${hexSVG(R.vals, true)}<p class="lead"><b>${R.Z.ko}</b></p><small class="note">${K ? "지괘" : "Resulting"} · ${R.Z.n}</small></div>` : ""}</div>
        <p class="note c">${R.vals.map((v, i) => `${ICHING.lineName(i, v === 7 || v === 9, K)} ${v}`).join(" · ")}</p>
        ${st.q ? `<p class="c">“${esc(st.q)}”</p>` : ""}</section>
      ${sec(K ? "읽는 법" : "How to read", `<p>${ICHING.RULE[LANG][R.rule]}</p><p class="note">${K ? "출처" : "Source"}: ${ICHING.SOURCE}</p>`)}
      ${sec(K ? "점사" : "The text", R.texts.map(txt).join(""))}`;
  }
  $app.innerHTML = head(K ? "주역" : "I Ching", K ? "괘를 얻고 주희 『역학계몽』의 법으로 읽습니다" : "Cast a hexagram and read it by Zhu Xi's rules") + `
    <section class="card"><label class="lbl">${K ? "물음 (선택)" : "Question (optional)"}</label><textarea class="inp" id="iq" rows="2">${esc(st.q)}</textarea>
      <div class="seg" id="im" style="margin-top:10px">${[["yarrow", K ? "시초법" : "Yarrow"], ["coin", K ? "동전법" : "Coins"], ["manual", K ? "직접 입력" : "Enter lines"]].map(([k, l]) => `<button data-im="${k}"${st.method === k ? ' class="on"' : ""}>${l}</button>`).join("")}</div>
      ${st.method === "manual" ? `<p class="note">${K ? "아래(초효)부터 위(상효)까지, 실제로 시초나 동전으로 얻은 수를 고르세요." : "From the bottom line up, enter the numbers you obtained."}</p>${[5,4,3,2,1,0].map(i => `<div class="srow"><div style="white-space:nowrap;min-width:64px">${K ? ["초효","2효","3효","4효","5효","상효"][i] : `Line ${i + 1}`}</div><select data-ml="${i}" style="flex:1">${[6,7,8,9].map(v => `<option value="${v}"${st.manual[i] === v ? " selected" : ""}>${VN[v]}</option>`).join("")}</select></div>`).join("")}` :
        `<p class="note">${st.method === "yarrow" ? (K ? "시초 49책을 네 번 나누어 한 효를 얻는 대연지수법의 확률(노음 1/16 · 소양 5/16 · 소음 7/16 · 노양 3/16)로 여섯 효를 얻습니다." : "Six lines with the probabilities of the yarrow-stalk method (6: 1/16, 7: 5/16, 8: 7/16, 9: 3/16).") : (K ? "동전 셋을 던져 앞면 3, 뒷면 2로 더하는 척전법(6·9 각 1/8, 7·8 각 3/8)으로 여섯 효를 얻습니다." : "Three coins, heads 3 and tails 2 (6 and 9: 1/8 each; 7 and 8: 3/8 each).")}</p>`}
      <button class="cta" id="icast">${K ? "괘 얻기" : "Cast"}</button></section>
    ${res}
    <p class="disc">${U.disc}</p>`;
  $app.querySelectorAll("[data-im]").forEach(b => b.onclick = () => { st.q = document.getElementById("iq").value; st.method = b.dataset.im; viewIching(); });
  $app.querySelectorAll("[data-ml]").forEach(sl => sl.onchange = () => { st.manual[+sl.dataset.ml] = +sl.value; });
  document.getElementById("icast").onclick = () => { st.q = document.getElementById("iq").value.trim();
    st.res = ICHING.read(st.method === "manual" ? st.manual.slice() : ICHING.cast(st.method)); viewIching(); window.scrollTo(0, 0); };
}

/* ---------- CONSULTATION ---------- */
const CT = CT_TX[LANG];
const consultState = {topic:null, mode:"love", a:null, b:null};
const TOPIC_ICON = {compat:"合", business:"財", health:"健", love:"緣", career:"官", move:"移", legal:"訟"};
function topicGrid(){
  return `<div class="tgrid">${Object.keys(CT.topics).map(k => `<button class="tcard" data-topic="${k}"><span class="tic">${TOPIC_ICON[k]}</span><b>${CT.topics[k][0]}</b><small>${CT.topics[k][1]}</small></button>`).join("")}</div>`;
}
const fmtTxt = (v, ...a) => typeof v === "function" ? v(...a) : (v || "");
function barChart(items, label, hiFn){
  return `<div class="mchart">${items.map(it => `<div class="mcol${hiFn && hiFn(it) === 1 ? " best" : hiFn && hiFn(it) === -1 ? " warn" : ""}"><b>${it.score}</b><div class="wb"><i style="height:${it.score}%"></i></div><span>${label(it)}</span></div>`).join("")}</div>`;
}
function bestWorst(list, key, fmt, nb, nw){
  const s = list.slice().sort((a, b) => b[key] - a[key]);
  return `<div class="lucky"><div><span>${CT.bestL}</span><b>${s.slice(0, nb || 3).map(fmt).join(", ")}</b></div><div><span>${CT.warnL}</span><b>${s.slice(-(nw || 2)).reverse().map(fmt).join(", ")}</b></div></div>`;
}
const notesAll = () => store.get("notes", {});
function notesBlock(pid, topic){
  const list = (notesAll()[pid] || []).slice().reverse();
  return sec(CT.notesH, `<textarea class="inp note-in" id="nt" rows="3" placeholder="${CT.notesPh}"></textarea><button class="cta ghost" id="ntsave">${CT.notesSave}</button>
    <div class="nlist">${list.length ? list.map(n => `<div class="nrow"><small>${new Date(n.d).toLocaleString(LANG === "ko" ? "ko-KR" : "en-US")} · ${CT.topics[n.topic] ? CT.topics[n.topic][0] : ""}</small><p>${esc(n.text).replace(/\n/g, "<br>")}</p><button class="mini ghost" data-ndel="${n.d}">${CT.del}</button></div>`).join("") : `<p class="note">${CT.notesEmpty}</p>`}</div>`, "noprint");
}
function bindNotes(pid, topic){
  const sv = document.getElementById("ntsave"); if (!sv) return;
  sv.onclick = () => { const t = document.getElementById("nt").value.trim(); if (!t) return; const all = notesAll(); (all[pid] = all[pid] || []).push({d:Date.now(), topic, text:t}); store.set("notes", all); toast(CT.notesSaved); viewConsult(topic); };
  $app.querySelectorAll("[data-ndel]").forEach(b => b.onclick = () => { if (!b.dataset.arm){ b.dataset.arm = 1; b.textContent = "✕ ?"; return; }
    const all = notesAll(); all[pid] = (all[pid] || []).filter(n => String(n.d) !== b.dataset.ndel); store.set("notes", all); viewConsult(topic); });
}
function personSel(id, cur){ return `<select id="${id}">${people().map(p => `<option value="${p.id}"${p.id === cur ? " selected" : ""}>${esc(p.name)}</option>`).join("")}</select>`; }
function viewConsult(topic){
  consultState.topic = topic;
  const ps = people(); if (!ps.length) return needProfile();
  const cur = active() || ps[0];
  consultState.a = consultState.a && ps.some(p => p.id === consultState.a) ? consultState.a : cur.id;
  const pA = ps.find(p => p.id === consultState.a), RA = calc(pA), X = RA.pro;
  const ymL = it => `${it.m}`, yL = it => `'${String(it.y).slice(2)}`;
  let body = "", title = CT.topics[topic][0];
  if (topic === "compat"){
    if (ps.length < 2) body = `<p class="note">${CT.needTwo}</p>`;
    else {
      if (!consultState.b || consultState.b === consultState.a || !ps.some(p => p.id === consultState.b)) consultState.b = (ps.find(p => p.id !== consultState.a) || ps[0]).id;
      const pB = ps.find(p => p.id === consultState.b), RB = calc(pB), mode = consultState.mode;
      const C = CONSULT.compat(RA, RB, mode), nA = esc(pA.name), nB = esc(pB.name);
      const txt = x => { const v = CT.f[x.k]; if (!v) return ""; if (typeof v !== "function") return v; return x.who ? (x.who === "A" ? v(nA, nB) : v(nB, nA)) : v(nA, nB); };
      const pos = C.f.filter(x => x.v > 0).map(txt).filter(Boolean), neg = C.f.filter(x => x.v < 0).map(txt).filter(Boolean);
      const facts = [[pA, RA], [pB, RB]].map(([p, R]) => `<div><b>${esc(p.name)}</b><span>${gzStr(R.saju.P[2].s, R.saju.P[2].b)} · ${T.animals[R.zod.animal][0]} · ${SJ.roles.yong} ${elName(R.pro.yong)}</span></div>`).join("");
      body = `<div class="seg mseg">${Object.keys(CT.modes).map(m => `<button data-mode2="${m}"${m === mode ? ' class="on"' : ""}>${CT.modes[m]}</button>`).join("")}</div>
        <div class="two picks noprint"><label>${CT.clientL}${personSel("ca", consultState.a)}</label><label>${CT.partnerL}${personSel("cb", consultState.b)}</label></div>
        <div id="crep"><section class="card"><div class="cfacts">${facts}</div></section>
        ${pos.length ? sec(LANG === "ko" ? "맞는 점 (합·생·용신 보완)" : "Harmonies", pos.map(t => `<div class="row2 pos"><p>＋ ${t}</p></div>`).join("")) : ""}
        ${neg.length ? sec(LANG === "ko" ? "부딪는 점 (충·형·원진)" : "Frictions", neg.map(t => `<div class="row2 neg"><p>－ ${t}</p></div>`).join("")) : ""}</div>`;
    }
  } else if (topic === "business"){
    body = `<div id="crep">${sec(CT.industryH, `<div class="ind"><div><b style="color:${EL_COLOR[X.yong]}">${SJ.roles.yong} · ${elName(X.yong)}</b>${CT.industry[X.yong].map(x => `<span>${x}</span>`).join("")}</div><div><b style="color:${EL_COLOR[X.hee]}">${SJ.roles.hee} · ${elName(X.hee)}</b>${CT.industry[X.hee].map(x => `<span>${x}</span>`).join("")}</div></div>
        <p class="note">${LANG === "ko" ? "기신 오행" : "Unfavourable element"}: ${elName(X.gi)} — ${CT.industry[X.gi].slice(0, 3).join(", ")}</p>`)}</div>`;
  } else if (topic === "health"){
    const H = CONSULT.health(RA), O = CT.organ;
    const organCard = el => `<div class="organ" style="--c:${EL_COLOR[el]}"><b>${O[el].n} <span class="orb">${Math.round(X.elPctFull[el])}%</span></b><p><em>${LANG === "ko" ? "관련 장부" : "Systems"}:</em> ${O[el].o}</p></div>`;
    body = `<p class="note c">${CT.healthDisc}</p><div id="crep">${sec(CT.vulH, (H.top.length ? H.top : H.vul.slice(0, 2)).map(v => organCard(v.el)).join("") + `<p class="note">${LANG === "ko" ? "오행이 지나치거나 모자란 장부 (오행·장부 상응)" : "Organs of the excessive or deficient elements (five-element correspondence)"}</p>`)}</div>`;
  } else {
    const TP = CONSULT.topic(RA, topic);
    const extra = topic === "love" ? `<h3>${SJ.spouseH}</h3><p>${BR[RA.saju.P[2].b]} · ${tgN(X.spouseGod)}</p>` :
      topic === "move" ? `<div class="lucky"><div><span>${CT.dirL} (${SJ.roles.yong})</span><b>${T.els[X.yong].dir}</b></div><div><span>${CT.dirL} (${SJ.roles.hee})</span><b>${T.els[X.hee].dir}</b></div><div><span>${LANG === "ko" ? "기신 방향" : "Unfavourable"}</span><b>${T.els[X.gi].dir}</b></div></div>` : "";
    body = `<div id="crep">${sec(CT.natalL, `${TP.natal.map(k => `<div class="row2"><p>• ${CT.natal[k]}</p></div>`).join("")}${extra}`)}</div>`;
  }
  const selA = topic === "compat" ? "" : `<div class="who noprint"><span>${CT.clientL}</span>${personSel("ca", consultState.a)}</div>`;
  $app.innerHTML = `<div class="noprint"><button class="backb" id="cback">${CT.back}</button></div>` + head(title, topic === "compat" ? "" : `${esc(pA.name)} · ${birthLine(pA, RA)}`) + selA + body +
    `<div class="two rep noprint"><button class="cta" id="cshare">${CT.shareRep}</button><button class="cta ghost" id="cprint">${CT.print}</button></div>` +
    notesBlock(consultState.a, topic) + `<p class="disc">${CT.disc}</p>`;
  document.getElementById("cback").onclick = () => { consultState.topic = null; viewPeople(); window.scrollTo(0, 0); };
  const ca = document.getElementById("ca"); if (ca) ca.onchange = () => { consultState.a = ca.value; viewConsult(topic); };
  const cb = document.getElementById("cb"); if (cb) cb.onchange = () => { consultState.b = cb.value; viewConsult(topic); };
  $app.querySelectorAll("[data-mode2]").forEach(b => b.onclick = () => { consultState.mode = b.dataset.mode2; viewConsult(topic); });
  document.getElementById("cprint").onclick = () => window.print();
  document.getElementById("cshare").onclick = async () => {
    const el = document.getElementById("crep"); const text = `X Destiny — ${title}\n${topic === "compat" ? "" : pA.name + "\n"}\n${el ? el.innerText : ""}\n\n※ ${CT.disc}`;
    if (navigator.share){ try { await navigator.share({title:`X Destiny — ${title}`, text}); return; } catch(e){ if (e && e.name === "AbortError") return; } }
    toast(await copy(text) ? U.shared : U.copyFail); };
  bindNotes(consultState.a, topic);
  window.scrollTo(0, 0);
}

/* ---------- PEOPLE ---------- */
function viewPeople(){
  const ps = people(), a = active();
  $app.innerHTML = head(CT.hubH, CT.hubSub) + `
    <div class="plist">${ps.map(p => { const R = calc(p);
      return `<div class="pp${a && a.id === p.id ? " on" : ""}"><div class="pa" style="--c:${EL_COLOR[ENG.STEM_EL[R.saju.dm]]}">${STEMS[R.saju.dm]}</div>
        <div class="pi"><b>${esc(p.name)}</b><small>${R.B.y}.${R.B.m}.${R.B.d}${p.time ? " " + p.time : ""} · ${signName(R.west.pl[0].sign)} · ${T.animals[R.zod.animal][0]}</small></div>
        <div class="pb"><button class="mini" data-use="${p.id}">${a && a.id === p.id ? U.active : U.use}</button><button class="mini ghost" data-edit="${p.id}">${U.edit}</button></div></div>`; }).join("")}</div>
    <button class="cta" id="add">${U.addPerson}</button>
    ${sec(CT.hubH, topicGrid())}
    ${sec(U.settingsH, `
      <div class="srow"><div>${U.lang}</div><div class="seg" id="lang"><button data-l="en"${LANG === "en" ? ' class="on"' : ""}>EN</button><button data-l="ko"${LANG === "ko" ? ' class="on"' : ""}>한국어</button></div></div>
      <div class="srow"><div>${U.lmtL}<small>${U.lmtS}</small></div><button class="sw${settings.lmt ? " on" : ""}" id="lmt" aria-label="${U.lmtL}"></button></div>
      <div class="srow"><div>${SJ.eotL}<small>${SJ.eotS}</small></div><button class="sw${settings.eot ? " on" : ""}" id="eot" aria-label="${SJ.eotL}"></button></div>
      <div class="srow col"><div>${SJ.ziL}</div><div class="seg" id="zi"><button data-z="late"${settings.zi !== "early" ? ' class="on"' : ""}>${SJ.ziLate}</button><button data-z="early"${settings.zi === "early" ? ' class="on"' : ""}>${SJ.ziEarly}</button></div></div>
      <div class="srow"><div>${LANG === "ko" ? "큰 글씨" : "Large text"}</div><button class="sw${settings.big ? " on" : ""}" id="bigt" aria-label="Large text"></button></div>`)}
    ${sec(U.backup, `<div class="two"><button class="cta" id="exp">${U.exp}</button><button class="cta ghost" id="imp">${U.imp}</button></div><input type="file" id="impf" accept="application/json,.json" hidden>`)}
    ${sec(U.aboutH, `<p class="note">${U.about}</p><p><a class="lnk" href="../">${U.tarotLink} →</a></p>`)}`;
  $app.querySelectorAll("[data-use]").forEach(b => b.onclick = () => { activeId = b.dataset.use; store.set("active", activeId); go("today"); });
  $app.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => profileForm(people().find(p => p.id === b.dataset.edit)));
  document.getElementById("add").onclick = () => profileForm(null);
  $app.querySelectorAll("[data-topic]").forEach(b => b.onclick = () => viewConsult(b.dataset.topic));
  document.querySelectorAll("#lang button").forEach(b => b.onclick = () => { if (b.dataset.l === LANG) return; settings.lang = b.dataset.l; saveSettings(); location.reload(); });
  document.getElementById("lmt").onclick = e => { settings.lmt = !settings.lmt; saveSettings(); e.currentTarget.classList.toggle("on"); };
  document.getElementById("eot").onclick = e => { settings.eot = !settings.eot; saveSettings(); e.currentTarget.classList.toggle("on"); };
  document.querySelectorAll("#zi button").forEach(b => b.onclick = () => { settings.zi = b.dataset.z; saveSettings(); document.querySelectorAll("#zi button").forEach(x => x.classList.toggle("on", x === b)); });
  document.getElementById("bigt").onclick = e => { settings.big = !settings.big; saveSettings(); e.currentTarget.classList.toggle("on"); document.documentElement.classList.toggle("big", settings.big); };
  document.getElementById("exp").onclick = async () => {
    const blob = new Blob([JSON.stringify({app:"xdestiny", v:2, people:people(), settings, notes:store.get("notes", {})})], {type:"application/json"});
    const name = `xdestiny-backup-${new Date().toISOString().slice(0, 10)}.json`;
    try { const f = new File([blob], name, {type:"application/json"}); if (navigator.canShare && navigator.canShare({files:[f]})){ await navigator.share({files:[f], title:"X Destiny"}); return; } } catch(e){ if (e && e.name === "AbortError") return; }
    const a2 = document.createElement("a"); a2.href = URL.createObjectURL(blob); a2.download = name; document.body.appendChild(a2); a2.click(); a2.remove(); toast(U.exported);
  };
  const impf = document.getElementById("impf");
  document.getElementById("imp").onclick = () => impf.click();
  impf.onchange = async () => { try { const d = JSON.parse(await impf.files[0].text()); if (d.app !== "xdestiny") throw 0;
    const ps2 = people(), ids = new Set(ps2.map(x => x.id)), add = (d.people || []).filter(x => !ids.has(x.id)); store.set("people", ps2.concat(add)); if (d.notes){ const n = store.get("notes", {}); Object.keys(d.notes).forEach(k => { if (!n[k]) n[k] = d.notes[k]; }); store.set("notes", n); } toast(U.imported(add.length)); viewPeople(); }
    catch(e){ toast(U.badFile); } impf.value = ""; };
}

/* ---------- profile form ---------- */
function profileForm(p){
  const isNew = !p; p = p || {id:"p" + Date.now(), name:"", gender:"", cal:"solar", leap:false, y:1990, m:1, d:1, time:"", place:null};
  const yNow = new Date().getFullYear();
  const opts = (a, b, v) => Array.from({length:b - a + 1}, (_, i) => a + i).map(n => `<option${n === v ? " selected" : ""}>${n}</option>`).join("");
  $app.innerHTML = head(isNew ? U.addPerson.replace("+ ", "") : esc(p.name)) + `
    <section class="card form">
      <label>${U.name}</label><input class="inp" id="fn" maxlength="40" placeholder="${U.namePh}" value="${esc(p.name)}">
      <label>${U.gender} <small>${U.genderNote}</small></label><div class="seg" id="fg"><button data-v="m"${p.gender === "m" ? ' class="on"' : ""}>${U.male}</button><button data-v="f"${p.gender === "f" ? ' class="on"' : ""}>${U.female}</button></div>
      <label>${U.date}</label><div class="seg" id="fc"><button data-v="solar"${p.cal !== "lunar" ? ' class="on"' : ""}>${U.solar}</button><button data-v="lunar"${p.cal === "lunar" ? ' class="on"' : ""}>${U.lunar}</button></div>
      <div class="three"><select id="fy" aria-label="year">${opts(1900, yNow, p.y)}</select><select id="fm" aria-label="month">${opts(1, 12, p.m)}</select><select id="fd" aria-label="day">${opts(1, 31, p.d)}</select></div>
      <label class="chk" id="leapw"${p.cal === "lunar" ? "" : " hidden"}><input type="checkbox" id="fl"${p.leap ? " checked" : ""}> ${U.leap}</label>
      <label>${U.time}</label><div class="two"><input class="inp" id="ft" type="time" value="${esc(p.time)}"${p.time ? "" : " disabled"}><label class="chk"><input type="checkbox" id="fu"${p.time ? "" : " checked"}> ${U.timeUnknown}</label></div>
      <small class="hint">${U.timeNote}</small>
      <label>${U.place}</label><input class="inp" id="fp" placeholder="${U.placePh}" value="${esc(p.place ? p.place.label : "")}" autocomplete="off"><div id="fps" class="sugg"></div>
      <div id="fcust" hidden><div class="three"><input class="inp" id="flat" type="number" step="0.0001" placeholder="${U.lat}"><input class="inp" id="flon" type="number" step="0.0001" placeholder="${U.lon}"><select id="ftz">${TIMEZONES.map(z => `<option>${z}</option>`).join("")}</select></div></div>
      <div class="two" style="margin-top:18px"><button class="cta" id="fsave">${U.save}</button><button class="cta ghost" id="fcancel">${U.cancel}</button></div>
      ${isNew ? "" : `<button class="cta ghost danger" id="fdel" style="margin-top:10px">${U.del}</button>`}
    </section>`;
  let place = p.place;
  const seg = id => document.querySelectorAll(`#${id} button`).forEach(b => b.onclick = () => { document.querySelectorAll(`#${id} button`).forEach(x => x.classList.toggle("on", x === b));
    if (id === "fc") document.getElementById("leapw").hidden = b.dataset.v !== "lunar"; });
  seg("fg"); seg("fc");
  const fu = document.getElementById("fu"), ft = document.getElementById("ft");
  fu.onchange = () => { ft.disabled = fu.checked; if (!fu.checked && !ft.value) ft.value = "12:00"; };
  const fp = document.getElementById("fp"), fps = document.getElementById("fps");
  const showSugg = () => { const q = fp.value.trim().toLowerCase();
    const hits = CITIES.map((c, i) => [c, i]).filter(([c]) => !q || c[0].toLowerCase().includes(q) || c[1].includes(q)).slice(0, 8);
    fps.innerHTML = hits.map(([c, i]) => `<button data-ci="${i}">${cityLabel(c)} <small>${c[2]} · ${c[5]}</small></button>`).join("") + `<button data-ci="custom">${U.custom}</button>`;
    fps.querySelectorAll("button").forEach(b => b.onclick = () => {
      if (b.dataset.ci === "custom"){ document.getElementById("fcust").hidden = false; place = null; fps.innerHTML = ""; return; }
      const c = CITIES[+b.dataset.ci]; place = {lat:c[3], lon:c[4], tz:c[5], label:cityLabel(c)}; fp.value = place.label; fps.innerHTML = ""; document.getElementById("fcust").hidden = true; }); };
  fp.onfocus = showSugg; fp.oninput = () => { place = null; showSugg(); };
  document.getElementById("fcancel").onclick = () => go(tab === "people" ? "people" : tab);
  document.getElementById("fsave").onclick = () => {
    const name = document.getElementById("fn").value.trim(); if (!name){ toast(U.required); return; }
    if (!place && !document.getElementById("fcust").hidden){
      const lat = parseFloat(document.getElementById("flat").value), lon = parseFloat(document.getElementById("flon").value);
      if (!isNaN(lat) && !isNaN(lon)) place = {lat, lon, tz:document.getElementById("ftz").value, label:`${lat.toFixed(2)}, ${lon.toFixed(2)}`}; }
    if (!place){ const c = CITIES[0]; place = {lat:c[3], lon:c[4], tz:c[5], label:cityLabel(c)}; }
    const rec = {id:p.id, name, gender:(document.querySelector("#fg .on") || {}).dataset ? document.querySelector("#fg .on") && document.querySelector("#fg .on").dataset.v || "" : "",
      cal:document.querySelector("#fc .on").dataset.v, leap:document.getElementById("fl").checked,
      y:+document.getElementById("fy").value, m:+document.getElementById("fm").value, d:+document.getElementById("fd").value,
      time:fu.checked ? "" : ft.value, place};
    try { ENG.compute(rec, {lmt:settings.lmt}); } catch(e){ toast(LANG === "ko" ? "날짜를 확인하세요 (음력 날짜가 없는 날일 수 있습니다)" : "Please check the date — that lunar date may not exist."); return; }
    const ps = people(), i = ps.findIndex(x => x.id === rec.id); if (i >= 0) ps[i] = rec; else ps.push(rec);
    store.set("people", ps); activeId = rec.id; store.set("active", activeId); toast(U.saved); go("today");
  };
  const del = document.getElementById("fdel");
  if (del) del.onclick = () => { if (!del.dataset.arm){ del.dataset.arm = 1; del.textContent = U.delConfirm; return; }
    store.set("people", people().filter(x => x.id !== p.id)); if (activeId === p.id){ activeId = null; store.set("active", null); } go("people"); };
  window.scrollTo(0, 0);
}

/* ---------- report ---------- */
const reportButtons = () => `<div class="two rep"><button class="cta" id="rshare">${U.share}</button><button class="cta ghost" id="rai">${U.copyAI}</button></div>`;
function reportText(R){
  const p = R.p, S = R.saju, W = R.west, V = R.vedic, L = [];
  L.push(`X Destiny — ${p.name}`, birthLine(p, R).replace(/&amp;/g, "&"));
  L.push("", `■ ${U.sajuH}`, S.P.map((x, i) => x ? `${U.pillars[i]} ${gzFull(x.s, x.b)}` : `${U.pillars[i]} ?`).join(" · "));
  L.push(`${U.dmH}: ${STEMS[S.dm]} ${T.dm[S.dm][0]} — ${T.dm[S.dm][1]}`, `${T.strength[S.strength][0]}: ${T.strength[S.strength][1]}`);
  L.push(`${U.elH}: ${S.count.map((c, e) => `${elName(e)} ${c}`).join(", ")} · ${U.favH}: ${elName(S.fav.el)}`);
  if (R.pro){ const X = R.pro, G = X.special ? SJ.special[X.special] : SJ.geok[X.geok];
    L.push(`${SJ.strengthH}: ${SJ.bands[X.band][0]} · ${SJ.geokH}: ${G[0]}${X.special ? "" : ` (${SJ.geokGrade[X.geokGrade][0]}${X.ok.length ? ", " + X.ok.map(k => SJ.ok[k][0]).join(", ") : ""}${X.bad.length ? ", " + X.bad.map(k => SJ.bad[k][0]).join(", ") : ""})`}`);
    L.push(`${SJ.roles.yong} ${elName(X.yong)} · ${SJ.roles.hee} ${elName(X.hee)} · ${SJ.roles.gi} ${elName(X.gi)} · ${SJ.roles.gu} ${elName(X.gu)} — ${SJ.method[X.method]}`);
    L.push(`${SJ.elH}: ${X.elPctFull.map((v, e) => `${elName(e)} ${Math.round(v)}%`).join(", ")}`);
    if (X.rels.length) L.push(`${SJ.relH}: ${X.rels.map(r => `${SJ.rel[r.k][0]} ${r.ch}`).join(", ")}`);
    if (X.stars.length) L.push(`${SJ.starH}: ${X.stars.map(st => SJ.star[st.k][0]).join(", ")}`);
    L.push(`${SJ.spouseH}: ${tgN(X.spouseGod)}`);
    if (X.luck.length) L.push(`${SJ.luckH}: ${X.luck.map(l => `${l.age}${LANG === "ko" ? "세" : ""} ${gzStr(l.s, l.b)}`).join(" · ")}`);
    L.push(`${SJ.yearsH}: ${X.years.map(y => `${y.y} ${gzStr(y.s, y.b)}`).join(" · ")}`);
  } else if (S.stars.length) L.push(`${U.starsH}: ${S.stars.map(k => T.stars[k][0]).join(", ")}`);
  if (R.curLuck) L.push(`${U.luckCur}: ${gzFull(R.curLuck.s, R.curLuck.b)} (${tgN(R.curLuck.tg)})`);
  L.push(`${U.sewoon} ${R.year}: ${gzFull(R.yp.s, R.yp.b)} (${tgN(ENG.tenGod(S.dm, R.yp.s))})`);
  L.push("", `■ ${U.westH}`, `${U.sunL} ${signName(W.pl[0].sign)} ${degStr(W.pl[0].deg)} · ${U.moonL} ${signName(W.pl[1].sign)} ${degStr(W.pl[1].deg)}${W.ang ? ` · ${U.ascL} ${signName(Math.floor(W.ang.asc / 30))} ${degStr(W.ang.asc % 30)}` : ""}`);
  L.push(W.pl.slice(2).map(x => `${T.planets[x.n][0]} ${signName(x.sign)} ${degStr(x.deg)}${x.house ? ` (${x.house}H)` : ""}${x.rx && x.n !== "Node" ? " Rx" : ""}`).join(", "));
  L.push(`${U.aspectsH}: ${W.asp.slice(0, 6).map(a => `${T.planets[a.a][0]} ${T.aspects[a.k][0]} ${T.planets[a.b][0]}`).join(", ")}`);
  L.push("", `■ ${U.vedicH}`, `${U.moonRashi} ${T.rashi[V.moonSign]} · ${U.nakH} ${T.naks[V.nak][0]} (${U.pada(V.pada)}) · ${U.maha} ${T.dashaName[V.maha.lord]}${V.antar ? ` / ${U.antar} ${T.dashaName[V.antar.lord]}` : ""}`);
  L.push("", `■ ${U.zodH}: ${T.animals[R.zod.animal][0]}${R.zod.samjae ? " " + T.samjae[R.zod.samjae] : ""}`);
  { const TC = TOJ.code(R.B, TOJ.currentLunarYear()); L.push(`■ ${TJ.title} ${TJ.lyear(TOJ.currentLunarYear())}: ${TC.code}`); }
  L.push("", `※ ${U.disc}`);
  return L.join("\n");
}
function bindReport(R){
  const s = document.getElementById("rshare"), a = document.getElementById("rai"); if (!s) return;
  s.onclick = async () => { const text = reportText(R);
    if (navigator.share){ try { await navigator.share({title:"X Destiny", text}); return; } catch(e){ if (e && e.name === "AbortError") return; } }
    toast(await copy(text) ? U.shared : U.copyFail); };
  a.onclick = async () => toast(await copy(U.aiPrompt(reportText(R))) ? U.copied : U.copyFail);
}

/* ---------- start ---------- */
document.body.insertAdjacentHTML("afterbegin", `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="gold" x1="0" x2="1"><stop offset="0" stop-color="#b98f45"/><stop offset="1" stop-color="#f0d79a"/></linearGradient></defs></svg>`);
if ("serviceWorker" in navigator && location.protocol === "https:") window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
renderNav(); VIEWS[tab]();
})();
