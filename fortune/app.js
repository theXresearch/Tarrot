// X Destiny — screens
(() => {
"use strict";
const $app = document.getElementById("app"), $nav = document.getElementById("nav");
const store = {
  get(k, d){ try{ const v = localStorage.getItem("xdest." + k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem("xdest." + k, JSON.stringify(v)); }catch(e){} }
};
const settings = Object.assign({lang:"en", lmt:true, big:false}, store.get("settings", {}));
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
  const key = p.id + JSON.stringify(p) + settings.lmt + new Date().toDateString();
  if (!cache[key]) cache[key] = ENG.compute(p, {lmt:settings.lmt});
  return cache[key];
}
function active(){ const ps = people(); return ps.find(p => p.id === activeId) || ps[0] || null; }

/* ---------- nav ---------- */
let tab = "today";
const NAV = [
  ["today", '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>'],
  ["saju", '<rect x="3" y="4" width="4" height="16" rx="1"/><rect x="10" y="4" width="4" height="16" rx="1"/><rect x="17" y="4" width="4" height="16" rx="1"/>'],
  ["stars", '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>'],
  ["year", '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'],
  ["people", '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1.2-3.6 3.6-5.5 6.5-5.5s5.3 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.6c2.6.1 4.5 1.8 5.5 4.8"/>']
];
const VIEWS = {today:viewToday, saju:viewSaju, stars:viewStars, year:viewYear, people:viewPeople};
function renderNav(){
  $nav.innerHTML = NAV.map(n => `<button data-t="${n[0]}" class="${tab === n[0] ? "on" : ""}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${n[1]}</svg>${U.nav[n[0]]}</button>`).join("");
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

/* ---------- TODAY ---------- */
function viewToday(){
  const p = active(); if (!p) return needProfile();
  const R = calc(p), now = new Date(), D = ENG.daily(R, now);
  const fav = R.saju.fav.el, E = T.els[fav];
  const week = Array.from({length:7}, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i); return {d, s:ENG.daily(R, d).sc.overall}; });
  const cats = ["love","money","work","health"];
  $app.innerHTML = head(U.todayH, now.toLocaleDateString(LANG === "ko" ? "ko-KR" : "en-US", {weekday:"long", year:"numeric", month:"long", day:"numeric"})) + whoBar(p) + `
    <section class="card hero2"><div class="hr">${ring(D.sc.overall, 132, T.cats.overall)}<div class="cats">${cats.map(k => `<div class="cat"><span>${T.cats[k]}</span>${bar(D.sc[k], 100)}<b>${D.sc[k]}</b></div>`).join("")}</div></div>
      <p class="lead">${U.dayPillar(`<b>${gzFull(D.d.s, D.d.b)}</b>`, `<b>${tgN(D.tg)}</b>`)}</p>
      <p>${T.tg[D.tg].d} ${T.dayRel[D.br] || ""}</p></section>
    ${sec(U.moonIn(signName(D.moonSign), D.house), `<p>${T.moonDay[D.house]}</p>`)}
    ${sec(U.numH, `<p>${U.pday(D.pd, T.pd[D.pd])}</p>`)}
    ${sec(U.lucky, `<div class="lucky"><div><span>${U.luckyEl}</span><b style="color:${EL_COLOR[fav]}">${E.n}</b></div><div><span>${U.luckyColor}</span><b>${E.color}</b></div><div><span>${U.luckyNum}</span><b>${E.nums}</b></div><div><span>${U.luckyDir}</span><b>${E.dir}</b></div></div>`)}
    ${sec(LANG === "ko" ? "이번 주 흐름" : "The week ahead", `<div class="week">${week.map((w, i) => `<div class="wd${i === 0 ? " on" : ""}"><div class="wb"><i style="height:${w.s}%"></i></div><b>${w.s}</b><span>${w.d.toLocaleDateString(LANG === "ko" ? "ko-KR" : "en-US", {weekday:"short"})}</span></div>`).join("")}</div>`)}
    <p class="disc">${U.disc}</p>`;
  bindWho();
}

/* ---------- SAJU ---------- */
function viewSaju(){
  const p = active(); if (!p) return needProfile();
  const R = calc(p), S = R.saju, dm = S.dm;
  const order = [3, 2, 1, 0];
  const col = i => { const x = S.P[i]; if (!x) return `<div class="pc empty"><div class="pl">${U.pillars[i]}</div><div class="unk">?</div></div>`;
    return `<div class="pc${i === 2 ? " me" : ""}"><div class="pl">${U.pillars[i]}</div>
      <div class="tg">${i === 2 ? U.self : tgN(x.tgS)}</div>
      <div class="ch" style="--c:${EL_COLOR[ENG.STEM_EL[x.s]]}">${STEMS[x.s]}<small>${T.stemRead[x.s]} · ${elName(ENG.STEM_EL[x.s])}</small></div>
      <div class="ch" style="--c:${EL_COLOR[ENG.BR_EL[x.b]]}">${BR[x.b]}<small>${T.brRead[x.b]} · ${T.animals[x.b][0]}</small></div>
      <div class="tg">${tgN(x.tgB)}</div>
      <div class="hd">${x.hidden.map(h => `<span style="color:${EL_COLOR[ENG.STEM_EL[h.s]]}">${STEMS[h.s]}</span>`).join("")}</div>
      <div class="st">${T.stages[x.stage]}</div></div>`; };
  const maxC = Math.max(...S.count), minC = Math.min(...S.count);
  const elRows = S.count.map((c, e) => `<div class="er"><span style="color:${EL_COLOR[e]}">${elName(e)}</span>${bar(c, Math.max(4, maxC), EL_COLOR[e])}<b>${c}</b></div>`).join("");
  const elNotes = [];
  S.count.forEach((c, e) => { if (c >= 3 && c === maxC) elNotes.push(`<b>${elName(e)}</b> ↑ ${T.els[e].excess}`); if (c === 0) elNotes.push(`<b>${elName(e)}</b> ↓ ${T.els[e].lack}`); });
  const fav = S.fav.el, nowY = new Date().getFullYear();
  const lmtMin = p.time && settings.lmt ? Math.round(R.B.place.lon * 4 - ENG.tzOffsetMin(R.B.utc, R.B.place.tz)) : null;
  $app.innerHTML = head(U.sajuH, `${esc(p.name)} · ${birthLine(p, R)}`) + whoBar(p) + `
    <section class="card"><div class="pillars">${order.map(col).join("")}</div>
      <div class="pnote">${!p.time ? U.timeNoteSaju : lmtMin !== null ? U.lmtNote(lmtMin) : ""}</div>
      <div class="legend"><span>${U.stem}·${U.branch}</span><span>${U.hidden}</span><span>${U.stageL}</span></div></section>
    ${sec(`${U.dmH} · ${STEMS[dm]} ${T.stemRead[dm]}`, `<div class="dmh" style="--c:${EL_COLOR[ENG.STEM_EL[dm]]}"><span class="big">${STEMS[dm]}</span><div><b>${T.dm[dm][0]}</b><small>${T.yy[dm % 2]} ${elName(ENG.STEM_EL[dm])}</small></div></div><p>${T.dm[dm][1]}</p>
      <h3>${T.strength[S.strength][0]}</h3><p>${T.strength[S.strength][1]}</p>`)}
    ${sec(U.elH, `<div class="els">${elRows}</div>${elNotes.length ? `<ul class="bul">${elNotes.map(x => `<li>${x}</li>`).join("")}</ul>` : ""}`)}
    ${sec(U.favH, `<div class="fav" style="--c:${EL_COLOR[fav]}"><b>${elName(fav)}</b><span>${T.els[fav].nature}</span></div>
      <div class="lucky"><div><span>${U.luckyColor}</span><b>${T.els[fav].color}</b></div><div><span>${U.luckyNum}</span><b>${T.els[fav].nums}</b></div><div><span>${U.luckyDir}</span><b>${T.els[fav].dir}</b></div></div><p class="note">${U.favNote}</p>`)}
    ${S.stars.length ? sec(U.starsH, S.stars.map(k => `<div class="row2"><b>${T.stars[k][0]}</b><p>${T.stars[k][1]}</p></div>`).join("")) : ""}
    ${sec(U.luckH, S.luck.length ? `<div class="luck">${S.luck.map(l => { const on = nowY >= l.y0 && nowY <= l.y1;
        return `<div class="lk${on ? " on" : ""}"><span>${U.ageFrom(l.age)}</span><b style="color:${EL_COLOR[ENG.STEM_EL[l.s]]}">${STEMS[l.s]}</b><b style="color:${EL_COLOR[ENG.BR_EL[l.b]]}">${BR[l.b]}</b><small>${tgN(l.tg)}</small><em>${l.y0}</em>${on ? `<i>${U.luckNow}</i>` : ""}</div>`; }).join("")}</div>
      ${R.curLuck ? `<p class="lead">${U.luckCur}: <b>${gzFull(R.curLuck.s, R.curLuck.b)}</b> · ${tgN(R.curLuck.tg)}</p><p>${T.tg[R.curLuck.tg].y}</p>` : ""}` : `<p>${U.noLuck}</p>`)}
    ${sec(LANG === "ko" ? "십신으로 본 성향" : "Ten Gods in your chart", tgSummary(S))}
    ${reportButtons()}
    <p class="disc">${U.disc}</p>`;
  bindWho(); bindReport(R);
}
function tgSummary(S){
  const seen = [];
  S.P.forEach(x => { if (!x) return; if (x.i !== 2 && !seen.includes(x.tgS)) seen.push(x.tgS); if (!seen.includes(x.tgB)) seen.push(x.tgB); });
  return seen.slice(0, 5).map(k => `<div class="row2"><b>${tgN(k)}</b><p>${T.tg[k].t}</p></div>`).join("");
}
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

/* ---------- YEAR ---------- */
function viewYear(){
  const p = active(); if (!p) return needProfile();
  const R = calc(p), S = R.saju, y = R.year, yp = R.yp, tg = ENG.tenGod(S.dm, yp.s);
  const ys = ENG.periodScore(S, yp.s, yp.b), rel = ENG.branchRel(S.P[2].b, yp.b);
  const Z = R.zod, nowM = new Date().getMonth() + 1;
  const jupH = ((R.transit.jup - R.west.pl[0].sign + 12) % 12) + 1, satH = ((R.transit.sat - R.west.pl[0].sign + 12) % 12) + 1;
  const ntg = ENG.tenGod(S.dm, R.ypNext.s);
  $app.innerHTML = head(U.yearH(y), esc(p.name)) + whoBar(p) + `
    <section class="card hero2"><div class="hr">${ring(ys, 120, y)}<div><p class="lead">${U.sewoon}: <b>${gzFull(yp.s, yp.b)}</b></p><p class="tgbig">${tgN(tg)}</p></div></div>
      <p>${T.tg[tg].y}</p>${T.dayRel[rel] ? `<p class="note">${T.dayRel[rel].replace(LANG === "ko" ? "오늘의" : "Today's", LANG === "ko" ? "올해의" : "This year's").replace(LANG === "ko" ? "오늘은" : "today's", LANG === "ko" ? "올해는" : "this year's")}</p>` : ""}
      ${R.curLuck ? `<p class="note">${U.luckCur}: ${gzFull(R.curLuck.s, R.curLuck.b)} · ${tgN(R.curLuck.tg)}</p>` : ""}</section>
    ${sec(U.monthsH, `<div class="months">${R.months.map(m => `<div class="mo${m.m === nowM ? " on" : ""}"><span>${U.monthName(m.m)}</span><b>${STEMS[m.s]}${BR[m.b]}</b><div class="mb"><i style="width:${m.score}%"></i></div><small>${tgN(m.tg)}</small></div>`).join("")}</div>
      <p class="note">${LANG === "ko" ? "월 기준은 절기(절입일)입니다." : "Months follow the solar terms of the Chinese calendar."}</p>`)}
    ${sec(U.tojH, `<p class="note">${U.tojIntro}</p><p class="lead">${U.tojCode(`<b class="code">${R.toj.code}</b>`)} · ${U.koreanAge(R.toj.age)}</p>
      <div class="row2"><b>${U.tojParts[0]} · ${T.toj.upName[R.toj.up]}</b><p>${T.toj.up[R.toj.up]}</p></div>
      <div class="row2"><b>${U.tojParts[1]}</b><p>${T.toj.mid[R.toj.mid]}</p></div>
      <div class="row2"><b>${U.tojParts[2]}</b><p>${T.toj.low[R.toj.low]}</p></div><p class="note">${U.tojNote}</p>`)}
    ${sec(U.zodH, `<div class="zod"><span class="zc">${BR[Z.animal]}</span><div><b>${U.yourAnimal}: ${T.animals[Z.animal][0]}</b><p>${T.animals[Z.animal][1]}</p></div></div>
      <p class="lead">${U.zodYear(T.animals[Z.yearBranch][0])}</p><p>${T.zodRel[Z.rel]}</p>
      ${Z.samjae ? `<p class="warn">${T.samjae[Z.samjae]}</p>` : ""}
      <div class="lucky"><div><span>${U.bestMatch}</span><b>${Z.best.map(b => T.animals[b][0]).join(", ")}</b></div><div><span>${U.clash}</span><b>${T.animals[Z.worst][0]}</b></div></div>`)}
    ${sec(U.numH, `<div class="lucky"><div><span>${U.lifePath}</span><b class="num">${R.num.lp}</b></div><div><span>${U.persYear}</span><b class="num">${R.num.py}</b></div>${R.num.expr ? `<div><span>${U.expr}</span><b class="num">${R.num.expr}</b></div>` : ""}</div>
      <p><b>${U.lifePath} ${R.num.lp}</b> — ${T.lp[R.num.lp]}</p><p><b>${U.persYear} ${R.num.py}</b> — ${T.py[R.num.py]}</p>${R.num.expr ? `<p><b>${U.expr} ${R.num.expr}</b> — ${T.lp[R.num.expr]}</p>` : ""}`)}
    ${sec(U.transitH, `<p>${U.jupLine(signName(R.transit.jup), jupH, T.houses[jupH - 1])}</p><p>${U.satLine(signName(R.transit.sat), satH, T.houses[satH - 1])}</p>`)}
    ${sec(`${U.nextYear} · ${y + 1}`, `<p class="lead"><b>${gzFull(R.ypNext.s, R.ypNext.b)}</b> · ${tgN(ntg)}</p><p>${T.tg[ntg].y}</p>`)}
    ${reportButtons()}
    <p class="disc">${U.disc}</p>`;
  bindWho(); bindReport(R);
}

/* ---------- PEOPLE ---------- */
function viewPeople(){
  const ps = people(), a = active();
  $app.innerHTML = head(U.peopleH) + `
    <div class="plist">${ps.map(p => { const R = calc(p);
      return `<div class="pp${a && a.id === p.id ? " on" : ""}"><div class="pa" style="--c:${EL_COLOR[ENG.STEM_EL[R.saju.dm]]}">${STEMS[R.saju.dm]}</div>
        <div class="pi"><b>${esc(p.name)}</b><small>${R.B.y}.${R.B.m}.${R.B.d}${p.time ? " " + p.time : ""} · ${signName(R.west.pl[0].sign)} · ${T.animals[R.zod.animal][0]}</small></div>
        <div class="pb"><button class="mini" data-use="${p.id}">${a && a.id === p.id ? U.active : U.use}</button><button class="mini ghost" data-edit="${p.id}">${U.edit}</button></div></div>`; }).join("")}</div>
    <button class="cta" id="add">${U.addPerson}</button>
    ${sec(U.compatH, ps.length < 2 ? `<p>${U.noOthers}</p>` : `<p class="note">${U.compatPick}</p><div class="two"><select id="c1">${ps.map((p, i) => `<option value="${p.id}"${i === 0 ? " selected" : ""}>${esc(p.name)}</option>`).join("")}</select><select id="c2">${ps.map((p, i) => `<option value="${p.id}"${i === 1 ? " selected" : ""}>${esc(p.name)}</option>`).join("")}</select></div><button class="cta ghost" id="cgo">${U.compatGo}</button><div id="cres"></div>`)}
    ${sec(U.settingsH, `
      <div class="srow"><div>${U.lang}</div><div class="seg" id="lang"><button data-l="en"${LANG === "en" ? ' class="on"' : ""}>EN</button><button data-l="ko"${LANG === "ko" ? ' class="on"' : ""}>한국어</button></div></div>
      <div class="srow"><div>${U.lmtL}<small>${U.lmtS}</small></div><button class="sw${settings.lmt ? " on" : ""}" id="lmt" aria-label="${U.lmtL}"></button></div>
      <div class="srow"><div>${LANG === "ko" ? "큰 글씨" : "Large text"}</div><button class="sw${settings.big ? " on" : ""}" id="bigt" aria-label="Large text"></button></div>`)}
    ${sec(U.backup, `<div class="two"><button class="cta" id="exp">${U.exp}</button><button class="cta ghost" id="imp">${U.imp}</button></div><input type="file" id="impf" accept="application/json,.json" hidden>`)}
    ${sec(U.aboutH, `<p class="note">${U.about}</p><p><a class="lnk" href="../">${U.tarotLink} →</a></p>`)}`;
  $app.querySelectorAll("[data-use]").forEach(b => b.onclick = () => { activeId = b.dataset.use; store.set("active", activeId); go("today"); });
  $app.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => profileForm(people().find(p => p.id === b.dataset.edit)));
  document.getElementById("add").onclick = () => profileForm(null);
  const cgo = document.getElementById("cgo");
  if (cgo) cgo.onclick = () => {
    const A = people().find(p => p.id === document.getElementById("c1").value), B2 = people().find(p => p.id === document.getElementById("c2").value);
    if (!A || !B2 || A.id === B2.id) return;
    const C = ENG.compat(calc(A), calc(B2));
    document.getElementById("cres").innerHTML = `<div class="hr" style="margin-top:14px">${ring(C.score, 110, U.compatScore)}<div><p class="lead"><b>${esc(A.name)}</b> & <b>${esc(B2.name)}</b></p><p class="note">${U.compatScore}</p></div></div>
      ${C.factors.map(([k, v]) => `<div class="row2 ${v > 0 ? "pos" : "neg"}"><p>${v > 0 ? "＋" : "－"} ${T.cf[k]}</p></div>`).join("")}`;
  };
  document.querySelectorAll("#lang button").forEach(b => b.onclick = () => { if (b.dataset.l === LANG) return; settings.lang = b.dataset.l; saveSettings(); location.reload(); });
  document.getElementById("lmt").onclick = e => { settings.lmt = !settings.lmt; saveSettings(); e.currentTarget.classList.toggle("on"); };
  document.getElementById("bigt").onclick = e => { settings.big = !settings.big; saveSettings(); e.currentTarget.classList.toggle("on"); document.documentElement.classList.toggle("big", settings.big); };
  document.getElementById("exp").onclick = async () => {
    const blob = new Blob([JSON.stringify({app:"xdestiny", v:1, people:people(), settings})], {type:"application/json"});
    const name = `xdestiny-backup-${new Date().toISOString().slice(0, 10)}.json`;
    try { const f = new File([blob], name, {type:"application/json"}); if (navigator.canShare && navigator.canShare({files:[f]})){ await navigator.share({files:[f], title:"X Destiny"}); return; } } catch(e){ if (e && e.name === "AbortError") return; }
    const a2 = document.createElement("a"); a2.href = URL.createObjectURL(blob); a2.download = name; document.body.appendChild(a2); a2.click(); a2.remove(); toast(U.exported);
  };
  const impf = document.getElementById("impf");
  document.getElementById("imp").onclick = () => impf.click();
  impf.onchange = async () => { try { const d = JSON.parse(await impf.files[0].text()); if (d.app !== "xdestiny") throw 0;
    const ps2 = people(), ids = new Set(ps2.map(x => x.id)), add = (d.people || []).filter(x => !ids.has(x.id)); store.set("people", ps2.concat(add)); toast(U.imported(add.length)); viewPeople(); }
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
  if (S.stars.length) L.push(`${U.starsH}: ${S.stars.map(k => T.stars[k][0]).join(", ")}`);
  if (R.curLuck) L.push(`${U.luckCur}: ${gzFull(R.curLuck.s, R.curLuck.b)} (${tgN(R.curLuck.tg)})`);
  L.push(`${U.sewoon} ${R.year}: ${gzFull(R.yp.s, R.yp.b)} (${tgN(ENG.tenGod(S.dm, R.yp.s))}) — ${T.tg[ENG.tenGod(S.dm, R.yp.s)].y}`);
  L.push("", `■ ${U.westH}`, `${U.sunL} ${signName(W.pl[0].sign)} ${degStr(W.pl[0].deg)} · ${U.moonL} ${signName(W.pl[1].sign)} ${degStr(W.pl[1].deg)}${W.ang ? ` · ${U.ascL} ${signName(Math.floor(W.ang.asc / 30))} ${degStr(W.ang.asc % 30)}` : ""}`);
  L.push(W.pl.slice(2).map(x => `${T.planets[x.n][0]} ${signName(x.sign)} ${degStr(x.deg)}${x.house ? ` (${x.house}H)` : ""}${x.rx && x.n !== "Node" ? " Rx" : ""}`).join(", "));
  L.push(`${U.aspectsH}: ${W.asp.slice(0, 6).map(a => `${T.planets[a.a][0]} ${T.aspects[a.k][0]} ${T.planets[a.b][0]}`).join(", ")}`);
  L.push("", `■ ${U.vedicH}`, `${U.moonRashi} ${T.rashi[V.moonSign]} · ${U.nakH} ${T.naks[V.nak][0]} (${U.pada(V.pada)}) · ${U.maha} ${T.dashaName[V.maha.lord]}${V.antar ? ` / ${U.antar} ${T.dashaName[V.antar.lord]}` : ""}`);
  L.push("", `■ ${U.zodH}: ${T.animals[R.zod.animal][0]} — ${T.zodRel[R.zod.rel]}${R.zod.samjae ? " " + T.samjae[R.zod.samjae] : ""}`);
  L.push(`■ ${U.numH}: ${U.lifePath} ${R.num.lp}, ${U.persYear} ${R.num.py}${R.num.expr ? `, ${U.expr} ${R.num.expr}` : ""}`);
  L.push(`■ ${U.tojH}: ${R.toj.code} — ${T.toj.up[R.toj.up]} ${T.toj.mid[R.toj.mid]} ${T.toj.low[R.toj.low]}`);
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
