// X Destiny — calculation engine
// Saju (Four Pillars), Western natal chart, Vedic (Jyotish), Chinese zodiac, Numerology, Tojeong Bigyeol, compatibility, daily/monthly/yearly scores.
// Relies on lunar-javascript (Solar/Lunar/EightChar/LunarMonth) and astronomy-engine (Astronomy), both MIT.
const ENG = (() => {
"use strict";
const STEMS = "甲乙丙丁戊己庚辛壬癸", BRANCHES = "子丑寅卯辰巳午未申酉戌亥";
const ELS = ["wood","fire","earth","metal","water"];
const STEM_EL = [0,0,1,1,2,2,3,3,4,4];
const BR_EL = [4,2,0,0,2,1,1,2,3,3,2,4];
const BR_POL = [0,1,0,1,0,1,0,1,0,1,0,1]; // 0 = yang
const HIDDEN = ["癸","己癸辛","甲丙戊","乙","戊乙癸","丙庚戊","丁己","己丁乙","庚壬戊","辛","戊辛丁","壬甲"];
const si = c => STEMS.indexOf(c), bi = c => BRANCHES.indexOf(c);
const mod = (n, m) => ((n % m) + m) % m;
const GEN = (a, b) => mod(b - a, 5) === 1;   // a produces b
const CTRL = (a, b) => mod(b - a, 5) === 2;  // a controls b

/* ---------- time ---------- */
function tzOffsetMin(utcMs, tz){
  const f = new Intl.DateTimeFormat("en-US", {timeZone:tz, hourCycle:"h23", year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit"});
  const p = {}; f.formatToParts(new Date(utcMs)).forEach(x => p[x.type] = +x.value);
  return (Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second) - Math.floor(utcMs / 1000) * 1000) / 60000;
}
function localToUtc(y, m, d, h, mi, tz){
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const o1 = tzOffsetMin(guess, tz); let utc = guess - o1 * 60000;
  const o2 = tzOffsetMin(utc, tz); if (o2 !== o1) utc = guess - o2 * 60000;
  return utc;
}
const fields = ms => { const d = new Date(ms); return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()]; };

// Normalize a profile into a birth moment
function birthOf(p, opt){
  let y = p.y, m = p.m, d = p.d;
  if (p.cal === "lunar"){ const s = Lunar.fromYmd(p.y, p.leap ? -p.m : p.m, p.d).getSolar(); y = s.getYear(); m = s.getMonth(); d = s.getDay(); }
  const hasTime = !!p.time;
  const [hh, mm] = hasTime ? p.time.split(":").map(Number) : [12, 0];
  const place = p.place || {lat:37.5665, lon:126.978, tz:"Asia/Seoul"};
  const utc = localToUtc(y, m, d, hh, mm, place.tz);
  const lun = Solar.fromYmd(y, m, d).getLunar();
  return {y, m, d, hh, mm, hasTime, place, utc, lunarY:lun.getYear(), lunarM:Math.abs(lun.getMonth()), lunarD:lun.getDay(), lunarLeap:lun.getMonth() < 0, lmtCorr:opt.lmt !== false, eot:!!opt.eot && opt.lmt !== false, sect:opt.zi === "early" ? 1 : 2};
}

/* equation of time (minutes), NOAA approximation — apparent minus mean solar time */
function eqTime(utc){ const d = new Date(utc), n = (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5;
  const b = 2 * Math.PI * (n - 81) / 364; return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b); }
/* ---------- Saju ---------- */
function tenGod(dm, stemIdx){
  const a = STEM_EL[dm], b = STEM_EL[stemIdx], same = (dm % 2) === (stemIdx % 2);
  if (a === b) return same ? "bijian" : "jiecai";
  if (GEN(a, b)) return same ? "shishen" : "shangguan";
  if (CTRL(a, b)) return same ? "piancai" : "zhengcai";
  if (CTRL(b, a)) return same ? "qisha" : "zhengguan";
  return same ? "pianyin" : "zhengyin";
}
const TG_GROUP = {bijian:"companion", jiecai:"companion", shishen:"output", shangguan:"output", piancai:"wealth", zhengcai:"wealth", qisha:"officer", zhengguan:"officer", pianyin:"resource", zhengyin:"resource"};
const BR_MAIN_STEM = b => si(HIDDEN[b][0]);
const STAGE_START = [11,6,2,9,2,9,5,0,8,3]; // 장생 branch for each stem
function stage(stemIdx, brIdx){ const s = STAGE_START[stemIdx]; return stemIdx % 2 === 0 ? mod(brIdx - s, 12) : mod(s - brIdx, 12); }
const LIU_HE = [[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]];
const HAI = [[0,7],[1,6],[2,5],[3,4],[8,11],[9,10]];
const SAN_HE = [[8,0,4],[2,6,10],[5,9,1],[11,3,7]];
const STEM_HE = [[0,5],[1,6],[2,7],[3,8],[4,9]];
const STEM_CHONG = [[0,6],[1,7],[2,8],[3,9]];
const pairIn = (list, a, b) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
function branchRel(a, b){
  if (a === b) return "same";
  if (mod(a - b, 12) === 6) return "chong";
  if (pairIn(LIU_HE, a, b)) return "liuhe";
  if (SAN_HE.some(g => g.includes(a) && g.includes(b))) return "sanhe";
  if (pairIn(HAI, a, b)) return "hai";
  return "";
}
function stemRel(a, b){ if (pairIn(STEM_HE, a, b)) return "he"; if (pairIn(STEM_CHONG, a, b)) return "chong"; return ""; }
const groupOf = b => SAN_HE.findIndex(g => g.includes(b));
const PEACH = [9,3,6,0], HORSE = [2,8,11,5], CANOPY = [4,10,1,7]; // by san-he group index (申子辰, 寅午戌, 巳酉丑, 亥卯未)
const NOBLE = [[1,7],[0,8],[11,9],[11,9],[1,7],[0,8],[1,7],[2,6],[5,3],[5,3]];

function saju(B, gender){
  const bj = fields(B.utc + 8 * 3600e3);
  const ecBJ = Solar.fromYmdHms(...bj).getLunar().getEightChar();
  let lf;
  if (B.hasTime) lf = fields(B.lmtCorr ? B.utc + (B.place.lon * 4 + (B.eot ? eqTime(B.utc) : 0)) * 60000 : B.utc + tzOffsetMin(B.utc, B.place.tz) * 60000);
  else lf = [B.y, B.m, B.d, 12, 0, 0];
  const ecL = Solar.fromYmdHms(...lf).getLunar().getEightChar(); ecL.setSect(B.sect || 2);
  const gz = [ecBJ.getYear(), ecBJ.getMonth(), ecL.getDay(), B.hasTime ? ecL.getTime() : null];
  const P = gz.map((g, i) => g ? {i, s:si(g[0]), b:bi(g[1])} : null);
  const dm = P[2].s;
  P.forEach(p => { if (!p) return;
    p.tgS = p.i === 2 ? "self" : tenGod(dm, p.s);
    p.tgB = tenGod(dm, BR_MAIN_STEM(p.b));
    p.hidden = [...HIDDEN[p.b]].map(c => ({s:si(c), tg:tenGod(dm, si(c))}));
    p.stage = stage(dm, p.b);
  });
  // five elements (stems + branch main elements)
  const count = [0,0,0,0,0];
  P.forEach(p => { if (!p) return; count[STEM_EL[p.s]]++; count[BR_EL[p.b]]++; });
  // strength: month branch weighs most
  const dEl = STEM_EL[dm], supports = e => e === dEl || GEN(e, dEl);
  let sup = 0, tot = 0;
  const add = (e, w) => { tot += w; if (supports(e)) sup += w; };
  P.forEach(p => { if (!p) return; if (p.i !== 2) add(STEM_EL[p.s], 1); add(BR_EL[p.b], p.i === 1 ? 3 : p.i === 2 ? 1.5 : 1); });
  const ratio = sup / tot, strength = ratio >= 0.55 ? "strong" : ratio <= 0.42 ? "weak" : "balanced";
  const rel = {companion:dEl, output:mod(dEl + 1, 5), wealth:mod(dEl + 2, 5), officer:mod(dEl + 3, 5), resource:mod(dEl + 4, 5)};
  const pickMin = keys => keys.map(k => [k, rel[k]]).sort((a, b) => count[a[1]] - count[b[1]])[0];
  const fav = strength === "weak" ? pickMin(["resource","companion"]) : strength === "strong" ? pickMin(["output","wealth","officer"]) : [null, count.indexOf(Math.min(...count))];
  const favGroups = strength === "weak" ? ["resource","companion"] : strength === "strong" ? ["output","wealth","officer"] : ["output","resource"];
  // symbolic stars (신살)
  const brs = P.filter(Boolean).map(p => p.b), stars = [];
  [P[0].b, P[2].b].forEach(base => { const g = groupOf(base);
    if (brs.includes(PEACH[g]) && !stars.includes("peach")) stars.push("peach");
    if (brs.includes(HORSE[g]) && !stars.includes("horse")) stars.push("horse");
    if (brs.includes(CANOPY[g]) && !stars.includes("canopy")) stars.push("canopy"); });
  if (brs.some(b => NOBLE[dm].includes(b))) stars.push("noble");
  // luck pillars (대운)
  let luck = [];
  if (gender === "m" || gender === "f"){
    const yun = ecBJ.getYun(gender === "m" ? 1 : 0);
    luck = yun.getDaYun().slice(1, 10).map(d => { const g = d.getGanZhi(); return {gz:g, s:si(g[0]), b:bi(g[1]), y0:d.getStartYear(), y1:d.getEndYear(), age:d.getStartYear() - B.y, tg:tenGod(dm, si(g[0]))}; });
  }
  return {P, dm, count, strength, ratio, fav:{group:fav[0], el:fav[1]}, favGroups, stars, luck};
}
function yearPillar(year){ const g = Solar.fromYmd(year, 7, 1).getLunar().getYearInGanZhiByLiChun(); return {gz:g, s:si(g[0]), b:bi(g[1])}; }
function monthPillars(year){
  return Array.from({length:12}, (_, i) => { const g = Solar.fromYmd(year, i + 1, 20).getLunar().getMonthInGanZhiExact(); return {m:i + 1, gz:g, s:si(g[0]), b:bi(g[1])}; });
}
function dayPillar(date){ const g = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate()).getLunar().getDayInGanZhi(); return {gz:g, s:si(g[0]), b:bi(g[1])}; }

/* ---------- Western astrology ---------- */
const BODIES = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto"];
const norm = x => mod(x, 360);
function lonOf(body, t){
  if (body === "Sun") return Astronomy.SunPosition(t).elon;
  if (body === "Moon") return Astronomy.EclipticGeoMoon(t).lon;
  return Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body[body], t, true)).elon;
}
function obliquity(t){ const T = t.tt / 36525; return 23.4392911 - 0.0130042 * T; }
function angles(utc, lat, lon){
  const t = Astronomy.MakeTime(new Date(utc));
  const ramc = norm(Astronomy.SiderealTime(t) * 15 + lon) * Math.PI / 180, e = obliquity(t) * Math.PI / 180, f = lat * Math.PI / 180;
  const asc = norm(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(e) + Math.tan(f) * Math.sin(e))) * 180 / Math.PI);
  const mc = norm(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(e)) * 180 / Math.PI);
  return {asc, mc};
}
function meanNode(t){ const T = t.tt / 36525; return norm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T); }
const ASPECTS = [["conjunction",0,8],["sextile",60,5],["square",90,7],["trine",120,7],["opposition",180,8]];
function western(B){
  const t = Astronomy.MakeTime(new Date(B.utc)), t2 = t.AddDays(1);
  const pl = BODIES.map(n => { const l = lonOf(n, t); let rx = false;
    if (n !== "Sun" && n !== "Moon"){ const d = norm(lonOf(n, t2) - l); rx = d > 180; }
    return {n, lon:l, sign:Math.floor(l / 30), deg:l % 30, rx}; });
  pl.push({n:"Node", lon:meanNode(t), sign:Math.floor(meanNode(t) / 30), deg:meanNode(t) % 30, rx:true});
  let ang = null, moonUncertain = false;
  if (B.hasTime){ ang = angles(B.utc, B.place.lat, B.place.lon);
    const as = Math.floor(ang.asc / 30); pl.forEach(p => p.house = mod(p.sign - as, 12) + 1); }
  else {
    const d0 = localToUtc(B.y, B.m, B.d, 0, 0, B.place.tz), d1 = d0 + 864e5 - 60000;
    moonUncertain = Math.floor(lonOf("Moon", Astronomy.MakeTime(new Date(d0))) / 30) !== Math.floor(lonOf("Moon", Astronomy.MakeTime(new Date(d1))) / 30);
  }
  const asp = [], core = pl.filter(p => !["Uranus","Neptune","Pluto","Node"].includes(p.n));
  for (let i = 0; i < core.length; i++) for (let j = i + 1; j < core.length; j++){
    const d = Math.abs(norm(core[i].lon - core[j].lon + 180) - 180);
    for (const [k, a, o] of ASPECTS){ const orb = o + ((core[i].n === "Sun" || core[i].n === "Moon" || core[j].n === "Sun" || core[j].n === "Moon") ? 2 : 0);
      if (Math.abs(d - a) <= orb){ asp.push({a:core[i].n, b:core[j].n, k, orb:Math.abs(d - a)}); break; } } }
  asp.sort((x, y) => x.orb - y.orb);
  const elems = [0,0,0,0], modes = [0,0,0]; // fire earth air water / cardinal fixed mutable
  pl.slice(0, 10).forEach(p => { elems[p.sign % 4]++; modes[p.sign % 3]++; });
  if (ang){ elems[Math.floor(ang.asc / 30) % 4]++; modes[Math.floor(ang.asc / 30) % 3]++; }
  return {pl, ang, asp:asp.slice(0, 10), elems, modes, moonUncertain};
}

/* ---------- Vedic (sidereal, Lahiri) ---------- */
const DASHA = [["Ketu",7],["Venus",20],["Sun",6],["Moon",10],["Mars",7],["Rahu",18],["Jupiter",16],["Saturn",19],["Mercury",17]];
const YEAR_MS = 365.2425 * 864e5;
function ayanamsa(t){ return 23.85305 + (t.ut / 365.25) * 50.2788 / 3600; }
function vedic(B, W, now){
  const t = Astronomy.MakeTime(new Date(B.utc)), ay = ayanamsa(t);
  const sid = x => norm(x - ay);
  const moon = sid(W.pl[1].lon), span = 360 / 27;
  const nak = Math.floor(moon / span), within = (moon % span) / span, pada = Math.floor(within * 4) + 1;
  const start = nak % 9; let cur = B.utc + DASHA[start][1] * (1 - within) * YEAR_MS, idx = start;
  const seq = [{lord:DASHA[start][0], from:B.utc, to:cur}];
  while (cur < now + 200 * YEAR_MS && seq.length < 12){ idx = (idx + 1) % 9; const to = cur + DASHA[idx][1] * YEAR_MS; seq.push({lord:DASHA[idx][0], from:cur, to}); cur = to; }
  const maha = seq.find(s => now >= s.from && now < s.to) || seq[0];
  // antardasha
  const mi = DASHA.findIndex(d => d[0] === maha.lord), fullLen = DASHA[mi][1] * YEAR_MS;
  let a0 = maha.to - fullLen, antar = null;
  for (let k = 0; k < 9; k++){ const L = DASHA[(mi + k) % 9]; const len = fullLen * L[1] / 120; if (now >= a0 && now < a0 + len){ antar = {lord:L[0], from:a0, to:a0 + len}; break; } a0 += len; }
  return {ayanamsa:ay, sunSign:Math.floor(sid(W.pl[0].lon) / 30), moonSign:Math.floor(moon / 30), lagna:W.ang ? Math.floor(sid(W.ang.asc) / 30) : null,
    nak, pada, maha, antar, seq};
}

/* ---------- Numerology ---------- */
const MASTER = [11, 22, 33];
const dsum = n => String(n).split("").reduce((a, b) => a + +b, 0);
const red = (n, keep) => { while (n > 9 && !(keep && MASTER.includes(n))) n = dsum(n); return n; };
function numerology(B, name, now){
  const lp = red(red(B.m, true) + red(B.d, true) + red(B.y, true), true);
  const py = red(B.m + B.d + dsum(now.getFullYear())), pm = red(py + now.getMonth() + 1), pd = red(pm + now.getDate());
  const letters = (name || "").toUpperCase().replace(/[^A-Z]/g, "");
  const expr = letters ? red([...letters].reduce((a, c) => a + ((c.charCodeAt(0) - 65) % 9) + 1, 0), true) : null;
  return {lp, py, pm, pd, expr, bday:red(B.d, true)};
}

/* ---------- Chinese zodiac ---------- */
function zodiac(B, year){
  const animal = bi(Solar.fromYmd(B.y, B.m, B.d).getLunar().getYearZhi());
  const yb = yearPillar(year).b;
  const rel = branchRel(animal, yb);
  // 삼재 (Korean three-year cycle of caution)
  const g = groupOf(animal), START = [2,8,11,5]; // 申子辰→寅 ... starting branch of the 3 years
  const k = mod(yb - START[g], 12), samjae = k < 3 ? k + 1 : 0;
  const best = [...new Set([...SAN_HE[g].filter(x => x !== animal), LIU_HE.find(p => p.includes(animal)).find(x => x !== animal)])];
  return {animal, rel, samjae, best, worst:mod(animal + 6, 12), yearBranch:yb};
}

/* ---------- Tojeong Bigyeol ---------- */
const SC_STEM = [9,8,7,6,5,9,8,7,6,5], SC_BR = [9,8,7,6,5,4,9,8,7,6,5,4];
const scNum = gz => SC_STEM[si(gz[0])] + SC_BR[bi(gz[1])];
function tojeong(B, year){
  const age = year - B.lunarY + 1;
  const up = mod(age + scNum(yearPillar(year).gz), 8) || 8;
  const lm = LunarMonth.fromYm(year, B.lunarM), days = lm.getDayCount();
  const mgz = Lunar.fromYmd(year, B.lunarM, 1).getMonthInGanZhi();
  const mid = mod(days + scNum(mgz), 6) || 6;
  const dd = Math.min(B.lunarD, days), dgz = Lunar.fromYmd(year, B.lunarM, dd).getDayInGanZhi();
  const low = mod(B.lunarD + scNum(dgz), 3) || 3;
  return {up, mid, low, code:up * 100 + mid * 10 + low, age};
}

/* ---------- scores ---------- */
const MOON_HOUSE_SCORE = [0,5,3,2,0,8,-3,4,-6,5,6,8,-6];
const REL_SCORE = {liuhe:10, sanhe:7, same:2, hai:-5, chong:-12, "":0};
const clamp = x => Math.max(18, Math.min(98, Math.round(x)));
function scoreTG(S, tg){ return S.favGroups.includes(TG_GROUP[tg]) ? 14 : -7; }
function daily(prof, date){
  const S = prof.saju, d = dayPillar(date), tg = tenGod(S.dm, d.s), grp = TG_GROUP[tg];
  const br = branchRel(S.P[2].b, d.b);
  const t = Astronomy.MakeTime(new Date(date.getTime())), moonSign = Math.floor(lonOf("Moon", t) / 30);
  const house = mod(moonSign - prof.west.pl[0].sign, 12) + 1;
  const pyD = red(prof.B.m + prof.B.d + dsum(date.getFullYear())), pd = red(red(pyD + date.getMonth() + 1) + date.getDate());
  const base = 58 + scoreTG(S, tg) + REL_SCORE[br] + MOON_HOUSE_SCORE[house] + ([0,4,1,5,0,2,4,0,6,2][pd] || 0);
  const peach = groupOf(S.P[0].b) >= 0 && PEACH[groupOf(S.P[0].b)] === d.b;
  const sc = {
    overall:clamp(base),
    love:clamp(base + ([5,7].includes(house) ? 12 : 0) + (grp === "output" ? 6 : 0) + (peach ? 10 : 0) + (br === "chong" ? -6 : 0)),
    money:clamp(base + (grp === "wealth" ? 12 : 0) + ([2,11].includes(house) ? 8 : 0) + (house === 8 ? -6 : 0) + (grp === "companion" ? -5 : 0)),
    work:clamp(base + (grp === "officer" ? 10 : 0) + ([10,6].includes(house) ? 8 : 0) + (grp === "resource" ? 4 : 0)),
    health:clamp(base + (tg === "qisha" ? -8 : 0) + ([6,12].includes(house) ? -8 : 0) + (grp === "companion" ? 5 : 0) + (br === "chong" ? -4 : 0))
  };
  return {d, tg, grp, br, moonSign, house, pd, sc, peach};
}
function periodScore(S, s, b){ return clamp(60 + scoreTG(S, tenGod(S.dm, s)) + REL_SCORE[branchRel(S.P[2].b, b)]); }

/* ---------- compatibility ---------- */
function compat(A, Bp){
  const a = A.saju, b = Bp.saju, f = [];
  let sc = 55;
  const sr = stemRel(a.dm, b.dm), ea = STEM_EL[a.dm], eb = STEM_EL[b.dm];
  if (sr === "he"){ sc += 18; f.push(["stemHe", 1]); } else if (sr === "chong"){ sc -= 12; f.push(["stemChong", -1]); }
  else if (ea === eb){ sc += 5; f.push(["stemSame", 1]); } else if (GEN(ea, eb) || GEN(eb, ea)){ sc += 10; f.push(["stemGen", 1]); } else { sc -= 4; f.push(["stemCtrl", -1]); }
  const dr = branchRel(a.P[2].b, b.P[2].b);
  if (dr === "liuhe"){ sc += 12; f.push(["dayLiuhe", 1]); } else if (dr === "sanhe"){ sc += 9; f.push(["daySanhe", 1]); } else if (dr === "chong"){ sc -= 14; f.push(["dayChong", -1]); } else if (dr === "hai"){ sc -= 6; f.push(["dayHai", -1]); }
  const za = A.zod.animal, zb = Bp.zod.animal, zr = branchRel(za, zb);
  if (zr === "liuhe" || zr === "sanhe"){ sc += 9; f.push(["zodGood", 1]); } else if (zr === "chong"){ sc -= 9; f.push(["zodChong", -1]); }
  const weakA = a.count.indexOf(Math.min(...a.count)), strongB = b.count.indexOf(Math.max(...b.count));
  const weakB = b.count.indexOf(Math.min(...b.count)), strongA = a.count.indexOf(Math.max(...a.count));
  if (weakA === strongB || weakB === strongA){ sc += 8; f.push(["elComplement", 1]); }
  const elSign = s => s % 4
  const comp = (x, y) => x === y ? 2 : ((x === 0 && y === 2) || (x === 2 && y === 0) || (x === 1 && y === 3) || (x === 3 && y === 1)) ? 1 : 0;
  const sun = comp(elSign(A.west.pl[0].sign), elSign(Bp.west.pl[0].sign));
  if (sun > 0){ sc += 6; f.push(["sunHarmony", 1]); } else { sc -= 3; f.push(["sunTension", -1]); }
  const moon = comp(elSign(A.west.pl[1].sign), elSign(Bp.west.pl[1].sign));
  if (moon > 0){ sc += 6; f.push(["moonHarmony", 1]); }
  const grpN = n => [1,5,7].includes(n % 11 || n) ? 0 : [2,4,8].includes(n % 11 || n) ? 1 : 2;
  if (grpN(A.num.lp) === grpN(Bp.num.lp)){ sc += 5; f.push(["lpHarmony", 1]); }
  return {score:clamp(sc), factors:f};
}

/* ---------- main ---------- */
function compute(p, opt){
  const now = opt.now || new Date();
  const B = birthOf(p, opt);
  const S = saju(B, p.gender);
  const W = western(B);
  const V = vedic(B, W, now.getTime());
  const out = {p, B, saju:S, west:W, vedic:V, num:numerology(B, p.name, now), zod:zodiac(B, now.getFullYear()), year:now.getFullYear()};
  out.toj = tojeong(B, now.getFullYear());
  out.yp = yearPillar(now.getFullYear()); out.ypNext = yearPillar(now.getFullYear() + 1);
  out.months = monthPillars(now.getFullYear()).map(x => ({...x, tg:tenGod(S.dm, x.s), score:periodScore(S, x.s, x.b), rel:branchRel(S.P[2].b, x.b)}));
  out.curLuck = S.luck.find(l => now.getFullYear() >= l.y0 && now.getFullYear() <= l.y1) || null;
  const tr = Astronomy.MakeTime(now);
  out.transit = {jup:Math.floor(lonOf("Jupiter", tr) / 30), sat:Math.floor(lonOf("Saturn", tr) / 30)};
  return out;
}
return {eqTime, compute, daily, compat, tenGod, TG_GROUP, STEMS, BRANCHES, STEM_EL, BR_EL, BR_POL, ELS, branchRel, stemRel, periodScore, yearPillar, localToUtc, tzOffsetMin, DASHA, BODIES};
})();
