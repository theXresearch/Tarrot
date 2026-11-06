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
let tab = (new URLSearchParams(location.search).get("tab") === "pic") ? "pic" : "today";
const NAV = [
  ["today", '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>'],
  ["saju", '<rect x="3" y="4" width="4" height="16" rx="1"/><rect x="10" y="4" width="4" height="16" rx="1"/><rect x="17" y="4" width="4" height="16" rx="1"/>'],
  ["stars", '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>'],
  ["toj", '<path d="M4 5h16M4 9.5h6.5M13.5 9.5H20M4 14h16M4 18.5h6.5M13.5 18.5H20"/>'],
  ["pic", '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 16l2.5-3 2 2 3-4 2.5 5"/><circle cx="9.5" cy="8" r="1.4"/>'],
  ["year", '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'],
  ["people", '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1.2-3.6 3.6-5.5 6.5-5.5s5.3 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.6c2.6.1 4.5 1.8 5.5 4.8"/>']
];
const VIEWS = {today:viewToday, saju:viewSaju, stars:viewStars, toj:viewToj, pic:viewPic, year:viewYear, people:viewPeople};
function viewPic(){ const p = active(); if (!p) return needProfile(); PICTURE.render($app, calc(p), p, LANG, head(LANG === "ko" ? "그림 사주" : "Picture Saju", LANG === "ko" ? "사주를 81장의 인생 카드로 읽습니다" : "Your saju read as 81 life cards"), whoBar(p), bindWho); }
const TJ = TOJ_TX[LANG], SJ = SJ_TX[LANG];
const sajuState = {sub:0};
function renderNav(){
  $nav.innerHTML = NAV.map(n => `<button data-t="${n[0]}" class="${tab === n[0] ? "on" : ""}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${n[1]}</svg>${n[0] === "pic" ? (LANG === "ko" ? "그림사주" : "Picture") : n[0] === "toj" ? TJ.title : n[0] === "people" ? CT_TX[LANG].nav : U.nav[n[0]]}</button>`).join("");
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
    ${tojDayCard(R, now)}
    ${sec(U.moonIn(signName(D.moonSign), D.house), `<p>${T.moonDay[D.house]}</p>`)}
    ${sec(U.numH, `<p>${U.pday(D.pd, T.pd[D.pd])}</p>`)}
    ${sec(U.lucky, `<div class="lucky"><div><span>${U.luckyEl}</span><b style="color:${EL_COLOR[fav]}">${E.n}</b></div><div><span>${U.luckyColor}</span><b>${E.color}</b></div><div><span>${U.luckyNum}</span><b>${E.nums}</b></div><div><span>${U.luckyDir}</span><b>${E.dir}</b></div></div>`)}
    ${sec(LANG === "ko" ? "이번 주 흐름" : "The week ahead", `<div class="week">${week.map((w, i) => `<div class="wd${i === 0 ? " on" : ""}"><div class="wb"><i style="height:${w.s}%"></i></div><b>${w.s}</b><span>${w.d.toLocaleDateString(LANG === "ko" ? "ko-KR" : "en-US", {weekday:"short"})}</span></div>`).join("")}</div>`)}
    <p class="disc">${U.disc}</p>`;
  bindWho(); bindTjLinks();
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
      ${sec(SJ.strengthH, `<div class="meter"><div class="mt"><i style="left:${Math.min(98, Math.max(2, X.score))}%"></i></div><div class="ml">${SJ.bands.map(b => `<span>${b[0].split("(")[0]}</span>`).join("")}</div></div>
        <p class="lead"><b>${SJ.bands[X.band][0]}</b> · ${SJ.scoreL} ${X.score}</p><p>${SJ.bands[X.band][1]}</p>
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
        <p class="lead">${SJ.method[X.method]}</p>${X.method === "johu" ? `<p>${SJ.johuNote[X.johuNeed]}</p>` : X.johuNeed !== null && X.method !== "jong" ? `<p class="note">${SJ.johuMinor[X.johuNeed]}</p>` : ""}
        ${R5.filter(r => roleEl[r] !== undefined).map(r => `<div class="row2"><b>${SJ.roles[r]} · ${elName(roleEl[r])}</b><p>${SJ.roleText[r]}</p></div>`).join("")}`)}
      ${sec(`${SJ.yongUse} · ${elName(X.yong)}`, `<div class="lucky"><div><span>${U.luckyColor}</span><b>${E.color}</b></div><div><span>${U.luckyNum}</span><b>${E.nums}</b></div><div><span>${U.luckyDir}</span><b>${E.dir}</b></div></div>
        <p><b>${LANG === "ko" ? "어울리는 분야" : "Fitting fields"}:</b> ${SJ.elFields[X.yong]}</p><p><b>${LANG === "ko" ? "생활 속 개운법" : "Everyday luck habits"}:</b> ${SJ.elHabits[X.yong]}</p>`)}`;
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
      return `<div class="row2"><b>${SJ.kin[k]} <span class="orb">${star} · ${K.w}%${where ? ` · ${where}` : ""}</span></b>${bar(K.w, 40)}<p>${SJ.kinLevel[K.level]}${K.clash ? " " + SJ.kinClash : ""}${K.empty ? " " + SJ.kinEmpty : ""}</p></div>`; }).join("");
    body = `${sec(SJ.palaceH, pal)}
      ${sec(SJ.spouseH, `<p class="lead"><b>${BR[S.P[2].b]} · ${tgN(X.spouseGod)}</b></p><p>${SJ.spouseGod[X.spouseGod]}</p>${[...new Set(X.dayHit)].map(k => SJ.dayHitText[k] ? `<p class="note">• ${SJ.dayHitText[k]}</p>` : "").join("")}`)}
      ${sec(SJ.kinH, (p.gender ? "" : `<p class="note">${SJ.kinNoGender}</p>`) + kin)}`;
  } else if (sub === 4){
    const tone = sc => SJ.luckTone.find(([t]) => sc >= t)[1];
    const relLines = rel => rel.map(([k, i]) => SJ.luckRelText(k, pn(i))).filter(Boolean);
    body = sec(SJ.luckH, X.luck.length ? X.luck.map(L => `<div class="lkd${L.now ? " on" : ""}"><div class="lkh"><span class="lkgz"><b style="color:${EL_COLOR[ENG.STEM_EL[L.s]]}">${STEMS[L.s]}</b><b style="color:${EL_COLOR[ENG.BR_EL[L.b]]}">${BR[L.b]}</b></span>
        <div><b>${SJ.ageL(L.age)} · ${L.y0}–${L.y1}${L.now ? ` <em class="nowb">${SJ.nowLuck}</em>` : ""}</b><small>${tgN(L.tg)} / ${tgN(L.tgB)} · ${SJ.luckRole(L.rs, L.rb, SJ.roles)} · ${T.stages[L.stage]}</small></div><span class="tjsc sm">${L.score}</span></div>
        ${bar(L.score, 100)}<p>${tone(L.score)} <b>${tgN(L.tg)}</b> — ${T.tg[L.tg].t}</p>${relLines(L.rel).length ? `<p class="note">${relLines(L.rel).join(" · ")}</p>` : ""}</div>`).join("") : `<p>${U.noLuck}</p>`)
      + sec(SJ.yearsH, `<div class="yrs">${X.years.map(Y => `<div class="yr${Y.score >= 72 ? " good" : Y.score < 45 ? " bad" : ""}"><b>${Y.y}</b><span class="han">${STEMS[Y.s]}${BR[Y.b]}</span><small>${tgN(Y.tg)}</small><div class="mb"><i style="width:${Y.score}%"></i></div><em>${Y.score}</em></div>`).join("")}</div>
        ${X.years.slice(0, 3).map(Y => `<div class="row2"><b>${Y.y} ${gzFull(Y.s, Y.b)} · ${SJ.yearAge(Y.age)} · ${Y.score}</b><p>${tone(Y.score)} ${T.tg[Y.tg].y}${relLines(Y.rel).length ? ` <span class="note">(${relLines(Y.rel).join(" · ")})</span>` : ""}</p></div>`).join("")}`);
  } else {
    const G = X.special ? SJ.special[X.special] : SJ.geok[X.geok];
    const cur = X.luck.find(l => l.now), tone = sc => SJ.luckTone.find(([t]) => sc >= t)[1];
    const sumTxt = SJ.summary({ilju:`${X.dayGZ}(${T.dm[dm][0]})`, band:SJ.bands[X.band][0], geok:G[0], grade:X.special ? "—" : SJ.geokGrade[X.geokGrade][0], yong:elName(X.yong), hee:elName(X.hee), gi:elName(X.gi),
      luck:cur ? SJ.luckSum(gzStr(cur.s, cur.b), cur.score, tone(cur.score)) : ""});
    const top2 = X.domGroup.slice(0, 2);
    const ys = X.years.slice(1), good = ys.filter(y => y.score >= 70).slice(0, 4).map(y => y.y), badY = ys.filter(y => y.score < 45).slice(0, 3).map(y => y.y);
    body = `${sec(SJ.summaryH, `<p class="lead">${sumTxt}</p>`)}
      ${sec(SJ.personaH, `<p>${T.dm[dm][1]}</p><p>${SJ.groupPersona[top2[0]]} ${SJ.groupPersona[top2[1]]}</p><p class="note">${G[1]}</p>`)}
      ${sec(SJ.careerH, `${!X.special ? `<p><b>${G[0]}</b> — ${G[2]}</p>` : ""}<p>${top2.map(g => `<b>${T.groups[g]}</b>: ${SJ.groupCareer[g]}`).join("<br>")}</p><p class="note">${LANG === "ko" ? "용신 분야" : "Useful God fields"}: ${SJ.elFields[X.yong]}</p>`)}
      ${sec(SJ.wealthH, `<p>${SJ.wealth[X.wealthType]}</p>`)}
      ${sec(SJ.healthH, X.health.length ? X.health.map(h => `<p>• ${SJ.healthLine(elName(h.e), h.t, SJ.organs[h.e])}</p>`).join("") + `<p class="note">${LANG === "ko" ? `기신 ${elName(X.gi)} — ${SJ.organs[X.gi]} 계통을 평소 관리하십시오.` : `Unfavourable element ${elName(X.gi)} — keep an eye on your ${SJ.organs[X.gi]}.`}</p>` : `<p>${SJ.healthOk}</p>`)}
      ${sec(SJ.keyH, `<div class="lucky"><div><span>${SJ.nextGood}</span><b>${good.join(", ") || "—"}</b></div><div><span>${SJ.nextBad}</span><b>${badY.join(", ") || "—"}</b></div></div>
        <p class="note">${SJ.settingsNote}</p>`)}
      ${reportButtons()}`;
  }
  $app.innerHTML = head(U.sajuH, `${esc(p.name)} · ${birthLine(p, R)}`) + whoBar(p) + tabs + body + `<p class="disc">${U.disc}</p>`;
  bindWho(); bindReport(R);
  $app.querySelectorAll("[data-sub]").forEach(b => b.onclick = () => { sajuState.sub = +b.dataset.sub; viewSaju(); const t = $app.querySelector(".subtabs .on"); if (t) t.scrollIntoView({inline:"center", block:"nearest"}); });
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
    ${tojYearCard(R)}
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
  bindWho(); bindReport(R); bindTjLinks();
}

/* ---------- TOJEONG ---------- */
const tojState = {mode:"day", dOff:0, wOff:0, yOff:0};
const LOC = LANG === "ko" ? "ko-KR" : "en-US";
const midnight = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const triGlyph = (t, cls) => `<span class="tri ${cls || ""}" style="--c:${EL_COLOR[TOJ.TRI_EL[t]]}">${TOJ.GLYPH[t]}</span>`;
const yaoLadder = pos => `<div class="ladder" aria-label="${TJ.yaoL} ${pos}">${[6,5,4,3,2,1].map(i => `<i class="${i === pos ? "on" : ""}"><b>${i === 6 ? (LANG === "ko" ? "상" : "6") : i}</b></i>`).join("")}</div>`;
const gradeChip = g => `<span class="gchip g${g}">${TJ.grades[g]}</span>`;
const sMD = so => LANG === "ko" ? `${so.getMonth()}/${so.getDay()}` : new Date(so.getYear(), so.getMonth() - 1, so.getDay()).toLocaleDateString(LOC, {month:"short", day:"numeric"});
function tojDayCard(R, date){
  const D = TOJ.day(R, date);
  return `<section class="card"><h2>${TJ.title} · ${TJ.dayTri}</h2>
    <div class="tjhead">${triGlyph(D.tri, "md")}<div><b>${TJ.dayHead[D.rel]}</b><small>${TJ.tri[D.tri]} · ${TJ.lunarDate(D.lm, D.ld, D.leapM)}</small></div><span class="tjsc">${D.score}</span></div>
    <p>${TJ.dayText[D.rel][D.v]} ${TJ.zrText[D.zr]}</p><button class="cta ghost" data-tj="day">${TJ.open} →</button></section>`;
}
function tojYearCard(R){
  const Y = TOJ.year(R, TOJ.currentLunarYear());
  return `<section class="card"><h2>${TJ.title} · ${TJ.lyear(Y.ly)}</h2>
    <div class="tjhead">${triGlyph(Y.up, "md")}<div><b class="code">${Y.code}</b> ${gradeChip(Y.grade)}<small>${TJ.tri[Y.up]} · ${TJ.age(Y.age)}</small></div><span class="tjsc">${Y.score}</span></div>
    <p class="poem">${TJ.upImg[Y.up]} ${TJ.midImg[Y.mid]}<br>${TJ.lowImg[Y.low]}</p><p>${TJ.upCore[Y.up]}</p>
    <button class="cta ghost" data-tj="year">${TJ.open} →</button></section>`;
}
function bindTjLinks(){ $app.querySelectorAll("[data-tj]").forEach(b => b.onclick = () => { tojState.mode = b.dataset.tj; tojState.dOff = 0; go("toj"); }); }
function stepper(label, sub){
  return `<div class="stepr"><button class="iconb" data-st="-1" aria-label="${TJ.prev}">‹</button><div><b>${label}</b>${sub ? `<small>${sub}</small>` : ""}</div><button class="iconb" data-st="1" aria-label="${TJ.next}">›</button></div>`;
}
function monthCard(M, isNow){
  const [h, body] = TJ.mTpl[M.rel][M.v];
  return `<div class="tjm${isNow ? " on" : ""}" id="tjm${M.m}"><div class="tjmh">${triGlyph(M.tri, "sm")}<div><b>${TJ.monthName(M.m)} · ${h}</b><small>${TJ.range(sMD(M.from), sMD(M.to))}</small></div><span class="tjsc sm">${M.score}</span></div>
    ${bar(M.score, 100)}<p>${body} ${TJ.yaoMonth[M.yao]}</p>
    <div class="tjkv"><span>${TJ.focus}: <b>${TJ.triFocus[M.tri]}</b></span><span>${TJ.dirL}: <b>${TJ.dir[M.tri]}</b></span></div></div>`;
}
function viewToj(){
  const p = active(); if (!p) return needProfile();
  const R = calc(p), st = tojState, today = midnight(new Date());
  const tabs = ["day","week","month","year"];
  let body = "";
  if (st.mode === "day"){
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + st.dOff), D = TOJ.day(R, date);
    const M = D.Y.months[D.lm - 1];
    body = stepper(date.toLocaleDateString(LOC, {weekday:"long", month:"long", day:"numeric"}), `${TJ.lunarDate(D.lm, D.ld, D.leapM)} · ${D.gz}${st.dOff ? ` · <a href="#" id="tjtoday">${TJ.today}</a>` : ""}`) + `
      <section class="card"><div class="tjhero">${triGlyph(D.tri, "lg")}<div><small>${TJ.dayTri}</small><b>${TJ.tri[D.tri]}</b><h3>${TJ.dayHead[D.rel]}</h3></div>${ring(D.score, 96, TJ.score)}</div>
        <p class="lead">${TJ.dayText[D.rel][D.v]}</p>${TJ.zrText[D.zr] ? `<p>${TJ.zrText[D.zr]}</p>` : ""}<p class="note">${TJ.yaoName[D.yao]} — ${TJ.yaoMonth[D.yao]}</p>
        <div class="lucky"><div><span>${TJ.doL}</span><b>${TJ.luckyDo[D.tri]}</b></div><div><span>${TJ.avoidL}</span><b>${TJ.avoid[D.tri]}</b></div><div><span>${TJ.dirL}</span><b>${TJ.dir[D.tri]}</b></div><div><span>${TJ.focus}</span><b>${TJ.triFocus[D.tri]}</b></div></div></section>
      ${sec(`${TJ.thisMonth} · ${TJ.monthName(D.lm)}`, monthCard(M, false))}
      <p class="note c">${TJ.extNote}</p>`;
  } else if (st.mode === "week"){
    const mon = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7) + 7 * st.wOff), W = TOJ.week(R, mon);
    const f = d => d.toLocaleDateString(LOC, {month:"short", day:"numeric"});
    body = stepper(`${f(W.days[0].date)} – ${f(W.days[6].date)}`, st.wOff ? `<a href="#" id="tjtoday">${TJ.today}</a>` : "") + `
      <section class="card"><div class="hr">${ring(W.avg, 104, TJ.weekAvg)}<div><p class="lead">${gradeChip(W.grade)}</p><p>${TJ.weekGrade[W.grade]}</p>
        <p class="note">${TJ.weekBest}: <b>${W.best.date.toLocaleDateString(LOC, {weekday:"short"})}</b> · ${TJ.weekWarn}: <b>${W.worst.date.toLocaleDateString(LOC, {weekday:"short"})}</b></p></div></div></section>
      <section class="card"><div class="wlist">${W.days.map(d => { const off = Math.round((d.date - today) / 864e5);
        return `<button class="wrow${off === 0 ? " on" : ""}" data-off="${off}">${triGlyph(d.tri, "sm")}<div><b>${d.date.toLocaleDateString(LOC, {weekday:"short", month:"numeric", day:"numeric"})} · ${TJ.dayHead[d.rel]}</b><small>${TJ.lunarDate(d.lm, d.ld, d.leapM)} · ${d.gz} · ${TJ.dayText[d.rel][d.v]}</small>${bar(d.score, 100)}</div><span class="tjsc sm">${d.score}</span></button>`; }).join("")}</div></section>
      <p class="note c">${TJ.extNote}</p>`;
  } else {
    const ly = TOJ.currentLunarYear() + st.yOff, Y = TOJ.year(R, ly), nowL = TOJ.lunarOf(new Date()), curM = nowL.getYear() === ly ? Math.abs(nowL.getMonth()) : 0;
    const ysel = `<div class="seg ysel">${TJ.yearSel.map((t, i) => `<button data-yo="${i}"${st.yOff === i ? ' class="on"' : ""}>${t} · ${TOJ.currentLunarYear() + i}</button>`).join("")}</div>`;
    const chart = `<div class="mchart">${Y.months.map(m => `<a href="#tjm${m.m}" class="mcol${m.m === curM ? " on" : ""}${Y.best.includes(m.m) ? " best" : ""}${Y.worst.includes(m.m) ? " warn" : ""}"><b>${m.score}</b><div class="wb"><i style="height:${m.score}%"></i></div><span>${m.m}</span></a>`).join("")}</div>`;
    const bw = `<div class="lucky"><div><span>${TJ.bestM}</span><b>${Y.best.map(TJ.monthName).join(", ")}</b></div><div><span>${TJ.warnM}</span><b>${Y.worst.map(TJ.monthName).join(", ")}</b></div></div>`;
    if (st.mode === "month"){
      body = ysel + `<section class="card"><h2>${TJ.monthsH} · ${TJ.lyear(ly)}</h2>${chart}${bw}${Y.leap ? `<p class="note">${TJ.leapNote(Y.leap)}</p>` : ""}</section>
        <section class="card">${Y.months.map(m => monthCard(m, m.m === curM)).join("")}</section>`;
    } else {
      const N = TOJ.year(R, ly + 1);
      body = ysel + `
      <section class="card tjyear"><div class="tjhero">${triGlyph(Y.up, "lg")}<div><small>${TJ.lyear(ly)} · ${TJ.age(Y.age)}</small><b class="code big">${Y.code}</b>${gradeChip(Y.grade)}</div>${ring(Y.score, 96, TJ.score)}</div>
        <p class="poem">${TJ.upImg[Y.up]} ${TJ.midImg[Y.mid]}<br>${TJ.lowImg[Y.low]}</p><p class="lead">${TJ.gradeText[Y.grade]}</p></section>
      <section class="card"><h2>${LANG === "ko" ? "총론" : "The year at a glance"}</h2>
        <div class="tjpart">${triGlyph(Y.up, "sm")}<div><b>${TJ.parts[0]} · ${TJ.tri[Y.up]}</b><p>${TJ.upCore[Y.up]}</p></div></div>
        <div class="tjpart">${yaoLadder(Y.mid)}<div><b>${TJ.parts[1]} · ${TJ.yaoName[Y.mid]}</b><p>${TJ.yaoText[Y.mid]}</p></div></div>
        <div class="tjpart"><span class="tri sm low">${["","天","地","人"][Y.low]}</span><div><b>${TJ.parts[2]} · ${TJ.lowName[Y.low]}</b><p>${TJ.lowText[Y.low]}</p></div></div></section>
      ${sec(TJ.domH, TJ.doms.map((n, i) => `<div class="dom"><div class="domh"><b>${n}</b>${bar(Y.dom[i], 100)}<span>${Y.dom[i]}</span></div><p>${TJ.domText[Y.up][i]}</p></div>`).join(""))}
      ${sec(TJ.advH, `<ol class="adv"><li>${TJ.upAdv[Y.up]}</li><li>${TJ.yaoAdv[Y.mid]}</li><li>${TJ.lowAdv[Y.low]}</li></ol>`)}
      ${sec(TJ.monthsH, chart + bw + `<button class="cta ghost" data-mode="month">${TJ.monthsH} →</button>`)}
      ${st.yOff === 0 ? sec(`${TJ.nextYearH} · ${ly + 1}`, `<div class="tjhead">${triGlyph(N.up, "md")}<div><b class="code">${N.code}</b> ${gradeChip(N.grade)}<small>${TJ.tri[N.up]}</small></div><span class="tjsc">${N.score}</span></div><p class="poem">${TJ.upImg[N.up]} ${TJ.midImg[N.mid]}<br>${TJ.lowImg[N.low]}</p>`) : ""}
      ${sec(LANG === "ko" ? "토정비결이란" : "About Tojeong", `<p>${TJ.intro}</p><p class="note">${TJ.method}</p><p class="note">${TJ.textNote}</p>`)}`;
    }
  }
  $app.innerHTML = head(TJ.title, esc(p.name)) + whoBar(p) + `<div class="seg tjtabs">${tabs.map((t, i) => `<button data-m="${t}"${st.mode === t ? ' class="on"' : ""}>${TJ.tabs[i]}</button>`).join("")}</div>` + body + `<p class="disc">${U.disc}</p>`;
  bindWho();
  $app.querySelectorAll(".tjtabs button").forEach(b => b.onclick = () => { st.mode = b.dataset.m; viewToj(); });
  $app.querySelectorAll("[data-st]").forEach(b => b.onclick = () => { if (st.mode === "day") st.dOff += +b.dataset.st; else st.wOff += +b.dataset.st; viewToj(); });
  const tt = document.getElementById("tjtoday"); if (tt) tt.onclick = e => { e.preventDefault(); st.dOff = 0; st.wOff = 0; viewToj(); };
  $app.querySelectorAll("[data-off]").forEach(b => b.onclick = () => { st.mode = "day"; st.dOff = +b.dataset.off; viewToj(); window.scrollTo(0, 0); });
  $app.querySelectorAll("[data-yo]").forEach(b => b.onclick = () => { st.yOff = +b.dataset.yo; viewToj(); });
  $app.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => { st.mode = b.dataset.mode; viewToj(); window.scrollTo(0, 0); });
  $app.querySelectorAll(".mcol").forEach(a => a.onclick = e => { e.preventDefault(); const id = a.getAttribute("href").slice(1);
    if (st.mode !== "month"){ st.mode = "month"; viewToj(); } const el = document.getElementById(id); if (el) el.scrollIntoView({behavior:"smooth", block:"center"}); });
  if (st.mode === "month"){ const on = $app.querySelector(".tjm.on"); if (on) setTimeout(() => on.scrollIntoView({block:"center"}), 50); }
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
      const pos = C.f.filter(x => x.v > 0).sort((a, b) => b.v - a.v).map(txt).filter(Boolean), neg = C.f.filter(x => x.v < 0).sort((a, b) => a.v - b.v).map(txt).filter(Boolean);
      const facts = [[pA, RA], [pB, RB]].map(([p, R]) => `<div><b>${esc(p.name)}</b><span>${X === R.pro ? "" : ""}${gzStr(R.saju.P[2].s, R.saju.P[2].b)} · ${T.animals[R.zod.animal][0]} · ${SJ.roles.yong} ${elName(R.pro.yong)}</span></div>`).join("");
      body = `<div class="seg mseg">${Object.keys(CT.modes).map(m => `<button data-mode2="${m}"${m === mode ? ' class="on"' : ""}>${CT.modes[m]}</button>`).join("")}</div>
        <div class="two picks noprint"><label>${CT.clientL}${personSel("ca", consultState.a)}</label><label>${CT.partnerL}${personSel("cb", consultState.b)}</label></div>
        <div id="crep">
        <section class="card"><div class="hr">${ring(C.total, 120, "")}<div><p class="lead"><b>${mode === "love" ? CT.aVsB(nA, nB) : `${nA} & ${nB}`}</b></p><p class="tgbig">${CT.grades[mode][C.grade]}</p></div></div>
          <p>${CT.gradeText[mode][C.grade]}</p><div class="cfacts">${facts}</div></section>
        ${sec(CT.modes[mode], `<div class="cats">${Object.keys(C.sub).map(k => `<div class="cat wide"><span>${CT.subs[k]}</span>${bar(C.sub[k], 100)}<b>${C.sub[k]}</b></div>`).join("")}</div>`)}
        ${pos.length ? sec(LANG === "ko" ? "잘 맞는 점" : "What works", pos.map(t => `<div class="row2 pos"><p>＋ ${t}</p></div>`).join("")) : ""}
        ${neg.length ? sec(LANG === "ko" ? "조심할 점" : "Watch out for", neg.map(t => `<div class="row2 neg"><p>－ ${t}</p></div>`).join("")) : ""}
        ${sec(CT.windowsH[mode], C.best.length ? C.best.map(w => `<div class="row2"><b>${w.y} · ${gzFull(ENG.yearPillar(w.y).s, ENG.yearPillar(w.y).b)} · ${w.s}</b><p>${w.why.map(k => CT.why[k]).join(" · ") || (LANG === "ko" ? "두 사람 모두 운이 좋은 해" : "both fortunes are strong")}</p></div>`).join("") : `<p class="note">—</p>`)}
        ${sec(CT.syncH, `<div class="sync">${C.sync.map(x => `<div><span>'${String(x.y).slice(2)}</span><i class="a" style="height:${x.a * 0.8}px"></i><i class="b" style="height:${x.b * 0.8}px"></i></div>`).join("")}</div><div class="slg"><span class="a">${nA}</span><span class="b">${nB}</span></div>`)}
        ${sec(CT.adviceH, `<ol class="adv">${CT.advice[mode].map(a => `<li>${a}</li>`).join("")}</ol>`)}
        </div>`;
    }
  } else if (topic === "business"){
    const B = CONSULT.business(RA), E = T.els[X.yong];
    body = `<div id="crep">${sec(CT.typeH, B.types.map(([k, v], i) => `<div class="row2${i === 0 ? " pos" : ""}"><b>${CT.types[k][0]} · ${v}%</b>${bar(v, 60)}${i < 2 ? `<p>${CT.types[k][1]}</p>` : ""}</div>`).join(""))}
      ${sec(CT.styleH, `<p>${CT.style[B.style]}</p><h3>${CT.partnerH}</h3><p>${CT.partner[B.partner]}</p><h3>${CT.scaleH}</h3><p>${CT.scale[B.scale]}</p><h3>${SJ.wealthH}</h3><p>${SJ.wealth[X.wealthType]}</p>`)}
      ${sec(CT.industryH, `<div class="ind"><div><b style="color:${EL_COLOR[X.yong]}">${SJ.roles.yong} · ${elName(X.yong)}</b>${CT.industry[X.yong].map(x => `<span>${x}</span>`).join("")}</div><div><b style="color:${EL_COLOR[X.hee]}">${SJ.roles.hee} · ${elName(X.hee)}</b>${CT.industry[X.hee].map(x => `<span>${x}</span>`).join("")}</div></div>
        <p class="note">${LANG === "ko" ? "피해야 할 업종 기운" : "Industries to avoid"}: ${elName(X.gi)} — ${CT.industry[X.gi].slice(0, 3).join(", ")}</p>`)}
      ${sec(CT.brandH, `<p>${CT.brand(E.color, E.nums, E.dir)}</p>`)}
      ${sec(CT.risksH, B.risks.length ? B.risks.map(k => `<div class="row2 neg"><p>－ ${CT.risks[k]}</p></div>`).join("") : `<p>—</p>`)}
      ${sec(CT.bizYearsH, barChart(B.years.map(y => ({...y, score:y.biz})), yL, it => it.score >= 72 ? 1 : it.score < 45 ? -1 : 0) + bestWorst(B.years, "biz", y => `${y.y}`))}
      ${sec(CT.monthsL, barChart(B.months, ymL, it => it.score >= 72 ? 1 : it.score < 45 ? -1 : 0) + bestWorst(B.months, "score", m => CT.ym(m.y, m.m)))}</div>`;
  } else if (topic === "health"){
    const H = CONSULT.health(RA), O = CT.organ;
    const organCard = (el, why) => `<div class="organ" style="--c:${EL_COLOR[el]}"><b>${O[el].n}${why ? ` <span class="orb">${CT.why3[why]} · ${Math.round(X.elPctFull[el])}%</span>` : ""}</b>
      <p><em>${LANG === "ko" ? "관련" : "Systems"}:</em> ${O[el].o}</p><p><em>${LANG === "ko" ? "나타나기 쉬운 신호" : "Typical signs"}:</em> ${O[el].s}</p>
      <p><em>${LANG === "ko" ? "음식" : "Food"}:</em> ${O[el].food}</p><p><em>${LANG === "ko" ? "운동" : "Exercise"}:</em> ${O[el].ex} · <em>${LANG === "ko" ? "주의 계절" : "Season"}:</em> ${O[el].season}</p><p><em>${LANG === "ko" ? "생활" : "Habits"}:</em> ${O[el].habit}</p></div>`;
    body = `<p class="note c">${CT.healthDisc}</p><div id="crep">
      ${sec(CT.constH, `<div class="tm"><span>${LANG === "ko" ? "한(寒)" : "Cold"}</span><div class="mt2"><i style="left:${50 + Math.max(-45, Math.min(45, H.temp))}%"></i></div><span>${LANG === "ko" ? "열(熱)" : "Hot"}</span></div>
        <div class="tm"><span>${LANG === "ko" ? "조(燥)" : "Dry"}</span><div class="mt2 w"><i style="left:${50 + Math.max(-45, Math.min(45, H.moist))}%"></i></div><span>${LANG === "ko" ? "습(濕)" : "Damp"}</span></div><p class="lead">${CT.const[H.constitution]}</p>`)}
      ${sec(CT.vulH, (H.top.length ? H.top : H.vul.slice(0, 2)).map(v => organCard(v.el, v.why)).join(""))}
      ${sec(LANG === "ko" ? `개운 건강법 · 용신 ${elName(X.yong)}` : `Strengthening habits · Useful God ${elName(X.yong)}`, organCard(X.yong, null))}
      ${H.flags.length ? sec(CT.flagsH, H.flags.map(k => `<div class="row2 neg"><p>${CT.flags[k]}</p></div>`).join("")) : ""}
      ${sec(CT.healthYearsH, `<div class="yrs">${H.years.map(y => `<div class="yr${y.level === 2 ? " bad" : y.level === 0 ? " good" : ""}"><b>${y.y}</b><span class="han">${STEMS[y.s]}${BR[y.b]}</span><small>${CT.hl[y.level]}</small></div>`).join("")}</div>`)}
      ${sec(CT.monthsL, barChart(H.months, ymL, it => it.score >= 72 ? 1 : it.score < 45 ? -1 : 0) + bestWorst(H.months, "score", m => CT.ym(m.y, m.m)))}</div>`;
  } else {
    const TP = CONSULT.topic(RA, topic);
    const whyTxt = it => it.why.map(k => CT.whyM[k]).filter(Boolean).join(" · ");
    const top = TP.months.slice().sort((a, b) => b.score - a.score);
    const extra = topic === "love" ? `<h3>${SJ.spouseH}</h3><p>${SJ.spouseGod[X.spouseGod]}</p>` :
      topic === "move" ? `<div class="lucky"><div><span>${CT.dirL} (${SJ.roles.yong})</span><b>${T.els[X.yong].dir}</b></div><div><span>${CT.dirL} (${SJ.roles.hee})</span><b>${T.els[X.hee].dir}</b></div><div><span>${LANG === "ko" ? "피할 방향" : "Avoid"}</span><b>${T.els[X.gi].dir}</b></div></div>` : "";
    body = `<div id="crep">${sec(CT.natalL, `<p class="note">${CT.topicIntro[topic]}</p>${TP.natal.map(k => `<div class="row2"><p>• ${CT.natal[k]}</p></div>`).join("")}${extra}`)}
      ${sec(CT.monthsL, barChart(TP.months, ymL, it => it.score >= 72 ? 1 : it.score < 45 ? -1 : 0) +
        `<h3>${CT.bestL}</h3>${top.slice(0, 3).map(m => `<div class="row2 pos"><b>${CT.ym(m.y, m.m)} · ${gzStr(m.s, m.b)} · ${m.score}</b><p>${whyTxt(m) || "—"}</p></div>`).join("")}
         <h3>${CT.warnL}</h3>${top.slice(-2).reverse().map(m => `<div class="row2 neg"><b>${CT.ym(m.y, m.m)} · ${gzStr(m.s, m.b)} · ${m.score}</b><p>${whyTxt(m) || "—"}</p></div>`).join("")}`)}
      ${sec(CT.yearsL, barChart(TP.years, yL, it => it.score >= 72 ? 1 : it.score < 45 ? -1 : 0) + bestWorst(TP.years, "score", y => `${y.y}`))}</div>`;
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
    ${sec(U.aboutH, `<p class="note">${U.about}</p><p><a class="lnk" href="../">${U.tarotLink} →</a></p><p><a class="lnk" href="../dream/">X Dream Picture →</a></p>`)}`;
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
    L.push(`${SJ.strengthH}: ${SJ.bands[X.band][0]} (${X.score}) · ${SJ.geokH}: ${G[0]}${X.special ? "" : ` (${SJ.geokGrade[X.geokGrade][0]}${X.ok.length ? ", " + X.ok.map(k => SJ.ok[k][0]).join(", ") : ""}${X.bad.length ? ", " + X.bad.map(k => SJ.bad[k][0]).join(", ") : ""})`}`);
    L.push(`${SJ.roles.yong} ${elName(X.yong)} · ${SJ.roles.hee} ${elName(X.hee)} · ${SJ.roles.gi} ${elName(X.gi)} · ${SJ.roles.gu} ${elName(X.gu)} — ${SJ.method[X.method]}`);
    L.push(`${SJ.elH}: ${X.elPctFull.map((v, e) => `${elName(e)} ${Math.round(v)}%`).join(", ")}`);
    if (X.rels.length) L.push(`${SJ.relH}: ${X.rels.map(r => `${SJ.rel[r.k][0]} ${r.ch}`).join(", ")}`);
    if (X.stars.length) L.push(`${SJ.starH}: ${X.stars.map(st => SJ.star[st.k][0]).join(", ")}`);
    L.push(`${SJ.spouseH}: ${tgN(X.spouseGod)} · ${SJ.wealthH}: ${SJ.wealth[X.wealthType].split(" — ")[0]}`);
    if (X.luck.length) L.push(`${SJ.luckH}: ${X.luck.map(l => `${l.age}${LANG === "ko" ? "세" : ""} ${gzStr(l.s, l.b)} ${l.score}`).join(" · ")}`);
    L.push(`${SJ.yearsH}: ${X.years.map(y => `${y.y} ${gzStr(y.s, y.b)} ${y.score}`).join(" · ")}`);
  } else if (S.stars.length) L.push(`${U.starsH}: ${S.stars.map(k => T.stars[k][0]).join(", ")}`);
  if (R.curLuck) L.push(`${U.luckCur}: ${gzFull(R.curLuck.s, R.curLuck.b)} (${tgN(R.curLuck.tg)})`);
  L.push(`${U.sewoon} ${R.year}: ${gzFull(R.yp.s, R.yp.b)} (${tgN(ENG.tenGod(S.dm, R.yp.s))}) — ${T.tg[ENG.tenGod(S.dm, R.yp.s)].y}`);
  L.push("", `■ ${U.westH}`, `${U.sunL} ${signName(W.pl[0].sign)} ${degStr(W.pl[0].deg)} · ${U.moonL} ${signName(W.pl[1].sign)} ${degStr(W.pl[1].deg)}${W.ang ? ` · ${U.ascL} ${signName(Math.floor(W.ang.asc / 30))} ${degStr(W.ang.asc % 30)}` : ""}`);
  L.push(W.pl.slice(2).map(x => `${T.planets[x.n][0]} ${signName(x.sign)} ${degStr(x.deg)}${x.house ? ` (${x.house}H)` : ""}${x.rx && x.n !== "Node" ? " Rx" : ""}`).join(", "));
  L.push(`${U.aspectsH}: ${W.asp.slice(0, 6).map(a => `${T.planets[a.a][0]} ${T.aspects[a.k][0]} ${T.planets[a.b][0]}`).join(", ")}`);
  L.push("", `■ ${U.vedicH}`, `${U.moonRashi} ${T.rashi[V.moonSign]} · ${U.nakH} ${T.naks[V.nak][0]} (${U.pada(V.pada)}) · ${U.maha} ${T.dashaName[V.maha.lord]}${V.antar ? ` / ${U.antar} ${T.dashaName[V.antar.lord]}` : ""}`);
  L.push("", `■ ${U.zodH}: ${T.animals[R.zod.animal][0]} — ${T.zodRel[R.zod.rel]}${R.zod.samjae ? " " + T.samjae[R.zod.samjae] : ""}`);
  L.push(`■ ${U.numH}: ${U.lifePath} ${R.num.lp}, ${U.persYear} ${R.num.py}${R.num.expr ? `, ${U.expr} ${R.num.expr}` : ""}`);
  { const TY = TOJ.year(R, TOJ.currentLunarYear()); L.push(`■ ${TJ.title} ${TJ.lyear(TY.ly)}: ${TY.code} (${TJ.grades[TY.grade]}) — ${TJ.upImg[TY.up]} ${TJ.midImg[TY.mid]} ${TJ.lowImg[TY.low]}`, `${TJ.upCore[TY.up]} ${TJ.yaoText[TY.mid]} ${TJ.lowText[TY.low]}`, TY.months.map(m => `${TJ.monthName(m.m)} ${m.score}`).join(" · ")); }
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
