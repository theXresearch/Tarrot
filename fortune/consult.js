// X Destiny — consultation engines: compatibility, business, health, and topic timing
const CONSULT = (() => {
"use strict";
const SE = [0,0,1,1,2,2,3,3,4,4], BE = [4,2,0,0,2,1,1,2,3,3,2,4];
const MAIN = [9,5,0,1,4,2,3,5,6,7,4,8]; // main hidden stem of each branch
const mod = (a, n) => ((a % n) + n) % n;
const pairIn = (list, a, b) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
const LIU = [[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]], SAN = [[8,0,4],[11,3,7],[2,6,10],[5,9,1]];
const XING = [[2,5],[5,8],[2,8],[1,10],[10,7],[1,7],[0,3]], ZIX = [4,6,9,11];
const HAI = [[0,7],[1,6],[2,5],[3,4],[8,11],[9,10]], PO = [[0,9],[3,6],[4,1],[7,10],[2,11],[5,8]];
const WONJIN = [[0,7],[1,6],[2,9],[3,8],[4,11],[5,10]], GWIMUN = [[0,9],[1,6],[2,7],[3,8],[4,11],[5,10]];
const STEM_HE = [[0,5],[1,6],[2,7],[3,8],[4,9]], STEM_CHONG = [[0,6],[1,7],[2,8],[3,9]];
const PEACH = [9,0,3,6], HORSE = [2,5,8,11];
const grp = b => SAN.findIndex(g => g.includes(b));
function brRel(a, b){
  const out = [];
  if (a === b) out.push(ZIX.includes(a) ? "jahyeong" : "same");
  if (mod(a - b, 12) === 6) out.push("chong");
  if (pairIn(LIU, a, b)) out.push("liuhe");
  if (a !== b && SAN.some(g => g.includes(a) && g.includes(b))) out.push("sanhe");
  if (pairIn(XING, a, b)) out.push("hyeong");
  if (pairIn(WONJIN, a, b)) out.push("wonjin");
  if (pairIn(GWIMUN, a, b) && !out.includes("wonjin")) out.push("gwimun");
  if (pairIn(HAI, a, b)) out.push("hai");
  if (pairIn(PO, a, b)) out.push("pa");
  return out;
}
const tenGod = (dm, s) => ENG.tenGod(dm, s);
const G = k => ENG.TG_GROUP[k];
const clamp = (x, a = 15, b = 98) => Math.max(a, Math.min(b, Math.round(x)));

/* ================= COMPATIBILITY ================= */
// mode: "love" | "biz" | "friend"
function compat(RA, RB, mode){
  const A = RA.pro, B = RB.pro, PA = RA.saju.P, PB = RB.saju.P, f = [];
  const add = (k, v, cat, who) => f.push({k, v, cat, who});
  const dA = PA[2].s, dB = PB[2].s, eA = SE[dA], eB = SE[dB];
  // 1. day masters
  if (pairIn(STEM_HE, dA, dB)) add("dmHe", 12, "emo");
  else if (pairIn(STEM_CHONG, dA, dB)) add("dmChong", -8, "emo");
  if (eA === eB) add("dmSame", mode === "love" ? 2 : 4, "emo");
  else if (mod(eA + 1, 5) === eB) add("dmGenAB", 6, "emo");
  else if (mod(eB + 1, 5) === eA) add("dmGenBA", 6, "emo");
  else if (mod(eA + 2, 5) === eB){
    if (mode === "love" && RA.p.gender === "m" && RB.p.gender === "f") add("dmTradAB", 4, "attr");
    else add("dmCtrlAB", mode === "biz" ? -2 : -4, "emo");
  } else if (mod(eB + 2, 5) === eA){
    if (mode === "love" && RB.p.gender === "m" && RA.p.gender === "f") add("dmTradBA", 4, "attr");
    else add("dmCtrlBA", mode === "biz" ? -2 : -4, "emo");
  }
  // 2. day branches (spouse palace / daily life)
  const W = {liuhe:10, sanhe:7, same:2, jahyeong:-4, chong:-12, hyeong:-7, wonjin:-8, gwimun:-4, hai:-5, pa:-4};
  brRel(PA[2].b, PB[2].b).forEach(k => add("day_" + k, W[k] * (mode === "love" ? 1 : 0.6), mode === "love" ? "attr" : "life"));
  // 3. year branches (animal signs)
  const WY = {liuhe:5, sanhe:5, same:1, jahyeong:-1, chong:-6, hyeong:-3, wonjin:-5, gwimun:-2, hai:-3, pa:-2};
  brRel(PA[0].b, PB[0].b).forEach(k => add("year_" + k, WY[k], "life"));
  // 4. month branches (family background / rhythm)
  const WM = {liuhe:3, sanhe:3, same:1, jahyeong:0, chong:-4, hyeong:-2, wonjin:-2, gwimun:0, hai:-1, pa:-1};
  brRel(PA[1].b, PB[1].b).forEach(k => add("month_" + k, WM[k], "life"));
  // 5. Useful God complement (the core professional criterion)
  const comp = (X, Y, who) => {
    const giv = Y.elPctFull[X.yong];
    if (giv >= 25) add("yongBig", 10, "emo", who); else if (giv >= 15) add("yongMid", 6, "emo", who); else if (giv < 6) add("yongLow", -2, "emo", who);
    if (Y.elPctFull[X.gi] >= 35) add("giHeavy", -6, "emo", who);
  };
  comp(A, B, "A"); comp(B, A, "B");
  // 6. spouse stars meet (romance)
  if (mode === "love"){
    const starMatch = (X, RX, eOther, who) => {
      if (RX.p.gender === "m" && mod(SE[RX.saju.P[2].s] + 2, 5) === eOther) add("starMatchM", 6, "attr", who);
      if (RX.p.gender === "f" && mod(SE[RX.saju.P[2].s] + 3, 5) === eOther) add("starMatchF", 6, "attr", who);
    };
    starMatch(A, RA, eB, "A"); starMatch(B, RB, eA, "B");
    const pk = (P, R) => PEACH.includes(P[0].b) || P.some(p => p && p.b === PEACH[grp(P[2].b)]);
    if (pk(PA) && pk(PB)) add("bothPeach", 2, "attr");
    const lonely = X => X.stars.some(s => s.k === "gosin" || s.k === "gwasuk");
    if (lonely(A) && lonely(B)) add("bothLonely", -3, "stab");
  }
  // 7. combined balance
  const comb = [0,1,2,3,4].map(e => (A.elPctFull[e] + B.elPctFull[e]) / 2);
  if (comb.every(v => v >= 9)) add("balanced", 4, "stab"); else if (comb.some(v => v < 4)) add("missing", -2, "stab");
  // 8. strength combination
  if (A.band >= 3 && B.band >= 3) add("twoStrong", mode === "friend" ? -1 : -4, "life");
  else if ((A.band >= 3 && B.band <= 1) || (B.band >= 3 && A.band <= 1)) add("strongWeak", 3, "life");
  else if (A.band <= 1 && B.band <= 1) add("twoWeak", -1, "life");
  const harsh = X => X.stars.some(s => ["goegang","yangin","baekho"].includes(s.k) && s.pos.includes(2));
  if (harsh(A) && harsh(B)) add("twoHarsh", -4, "stab");
  // 9. money (business & marriage)
  const moneyRel = (X, eY, who) => {
    const eX = SE[X === A ? dA : dB];
    if (eX === eY && X.grpPct.wealth < 15) add("rivalMoney", mode === "biz" ? -7 : -3, "money", who);
    if (mod(eX + 2, 5) === eY) add("bringsMoney", mode === "biz" ? 6 : 3, "money", who);
    if (mod(eX + 1, 5) === eY && mode === "biz") add("drainsTalent", 2, "money", who);
  };
  moneyRel(A, eB, "A"); moneyRel(B, eA, "B");
  if (A.wealthType === "gungeop" && B.wealthType === "gungeop") add("bothGungeop", -5, "money");
  // 10. luck timing
  const nowA = A.luck.find(l => l.now), nowB = B.luck.find(l => l.now);
  const yA = A.years, yB = B.years, sync = yA.map((y, i) => ({y:y.y, a:y.score, b:yB[i].score, s:Math.round((y.score + yB[i].score) / 2)}));
  const avgNow = nowA && nowB ? (nowA.score + nowB.score) / 2 : null;
  if (avgNow !== null){ if (avgNow >= 68) add("luckBothGood", 4, "stab"); else if (avgNow < 45) add("luckBothLow", -3, "stab");
    if (Math.abs(nowA.score - nowB.score) >= 30) add("luckGap", -2, "stab"); }
  // marriage / launch windows
  const windows = sync.filter(x => x.y > yA[0].y - 1).map(x => {
    const yp = ENG.yearPillar(x.y), why = [];
    if (mode === "love"){
      [[RA, PA], [RB, PB]].forEach(([R, P]) => { const tg = G(tenGod(P[2].s, yp.s));
        if ((R.p.gender === "m" && tg === "wealth") || (R.p.gender === "f" && tg === "officer")) why.push("spouseYear");
        if (["liuhe","sanhe"].some(k => brRel(P[2].b, yp.b).includes(k))) why.push("dayHe"); });
    } else {
      [PA, PB].forEach(P => { const tg = G(tenGod(P[2].s, yp.s)); if (tg === "wealth" || tg === "output") why.push("moneyYear"); });
    }
    return {...x, why:[...new Set(why)], hit:why.length};
  });
  const best = windows.filter(w => w.s >= 58).sort((a, b) => (b.hit * 6 + b.s) - (a.hit * 6 + a.s)).slice(0, 3).sort((a, b) => a.y - b.y);
  // totals
  const raw = f.reduce((a, x) => a + x.v, 0);
  const total = clamp(62 + raw * 0.9, 20, 98);
  const cat = c => clamp(62 + f.filter(x => x.cat === c).reduce((a, x) => a + x.v, 0) * 1.4, 15, 98);
  const sub = mode === "love" ? {emo:cat("emo"), attr:cat("attr"), life:cat("life"), money:cat("money"), stab:cat("stab")} :
    {emo:cat("emo"), life:cat("life"), money:cat("money"), stab:cat("stab")};
  const grade = total >= 85 ? 0 : total >= 72 ? 1 : total >= 58 ? 2 : total >= 45 ? 3 : 4;
  return {mode, f, total, sub, grade, sync, best, nowA, nowB};
}

/* ================= BUSINESS / WEALTH ================= */
function business(R){
  const X = R.pro, t = X.tgW, s = X.score;
  const type = {
    owner: t.piancai * 1.3 + t.shishen * 0.6 + t.shangguan * 0.6 + t.jiecai * 0.4 + (s >= 45 ? 10 : 0) + t.qisha * 0.3,
    org: t.zhengguan * 1.4 + t.zhengcai * 0.8 + t.zhengyin * 0.8 + t.qisha * 0.4 + (X.geokGrade === "seong" ? 4 : 0),
    pro: t.shangguan * 1.1 + t.pianyin * 1.1 + t.shishen * 0.8 + t.zhengyin * 0.4,
    invest: t.piancai * 1.0 + t.pianyin * 0.6 + t.qisha * 0.6 + (s >= 50 ? 8 : -4)
  };
  const tot = Object.values(type).reduce((a, b) => a + Math.max(b, 0), 0) || 1;
  const types = Object.entries(type).map(([k, v]) => [k, Math.round(Math.max(v, 0) / tot * 100)]).sort((a, b) => b[1] - a[1]);
  const partner = X.grpPct.companion >= 30 ? (X.grpPct.wealth < 15 ? "solo" : "careful") : X.grpPct.companion < 10 ? "need" : "ok";
  const scale = s >= 50 && X.grpPct.wealth >= 15 ? "big" : s < 35 ? "small" : "mid";
  const style = X.domGroup.find(g => g !== "companion") || "output";
  const risks = [];
  if (X.wealthType === "gungeop" || X.bad.includes("gungeopjaengjae")) risks.push("guarantee");
  if (X.wealthType === "jaedasinyak" || X.bad.includes("jaedasinyak")) risks.push("overexpand");
  if (X.bad.includes("sanggwangyeongwan")) risks.push("authority");
  if (X.bad.includes("jaesaengsal") || X.bad.includes("salmuje")) risks.push("legal");
  if (X.bad.includes("tamjaegoein")) risks.push("documents");
  if (X.bad.includes("wolchung")) risks.push("relocation");
  if (X.grpPct.output < 5) risks.push("noProduct");
  if (X.grpPct.officer < 4) risks.push("noSystem");
  const yearsRank = X.years.map(y => {
    const g1 = G(y.tg), g2 = G(y.tgB);
    let sc = y.score + (["wealth","output"].includes(g1) ? 5 : 0) + (["wealth","output"].includes(g2) ? 6 : 0) - (g1 === "companion" && X.grpPct.wealth < 15 ? 6 : 0);
    return {...y, biz:clamp(sc)};
  });
  return {types, partner, scale, style, risks, years:yearsRank, months:periods(R, "money", 12)};
}

/* ================= HEALTH ================= */
function health(R){
  const X = R.pro, P = R.saju.P, e = X.elPctFull;
  const vul = [0,1,2,3,4].map(el => {
    const ctrl = mod(el + 3, 5); // element that controls el
    let v = 0;
    if (e[el] < 6) v += 30 - e[el] * 3; else if (e[el] < 12) v += 10;
    if (e[el] > 35) v += (e[el] - 35) * 1.2 + 10;
    v += Math.max(0, e[ctrl] - 25) * 0.8;
    if (X.gi === el || X.gu === el) v += 4;
    return {el, v:Math.round(v), why:e[el] < 12 ? "lack" : e[el] > 35 ? "excess" : e[ctrl] > 25 ? "controlled" : "ok"};
  }).sort((a, b) => b.v - a.v);
  const seasonHot = [5,6,7].includes(P[1].b), seasonCold = [11,0,1].includes(P[1].b);
  const temp = e[1] - e[4] + (seasonHot ? 12 : seasonCold ? -12 : 0);
  const wetBr = P.filter(p => p && [4,1,0,11].includes(p.b)).length, dryBr = P.filter(p => p && [10,7,5,6].includes(p.b)).length;
  const moist = e[4] - e[1] + (wetBr - dryBr) * 6;
  const constitution = Math.abs(temp) < 12 && Math.abs(moist) < 12 ? "balanced" : temp >= 0 ? (moist >= 0 ? "hotWet" : "hotDry") : (moist >= 0 ? "coldWet" : "coldDry");
  const flags = [];
  if (X.stars.some(s => ["yangin","baekho"].includes(s.k))) flags.push("accident");
  if (X.rels.some(r => ["hyeong","samhyeong"].includes(r.k))) flags.push("surgery");
  if (X.stars.some(s => ["gwimunsal","wonjinsal"].includes(s.k)) || X.tgW.pianyin >= 18) flags.push("nerves");
  if (X.band >= 4 || X.band <= 0) flags.push("extreme");
  const years = X.years.map(y => {
    let risk = 0;
    if (X.role[SE[y.s]] < 0) risk += 2; if (X.role[BE[y.b]] < 0) risk += 3;
    const r = brRel(P[2].b, y.b); if (r.includes("chong")) risk += 4; if (r.includes("hyeong")) risk += 2;
    if (P.some(p => p && brRel(p.b, y.b).includes("chong") && [0,1,3].includes(p.i))) risk += 1;
    if (["甲辰","乙未","丙戌","丁丑","戊辰","壬戌","癸丑"].includes(ENG.STEMS[y.s] + ENG.BRANCHES[y.b])) risk += 2;
    return {...y, risk, level:risk >= 7 ? 2 : risk >= 4 ? 1 : 0};
  });
  return {vul, top:vul.filter(v => v.v >= 8).slice(0, 3), constitution, temp:Math.round(temp), moist:Math.round(moist), flags, years, months:periods(R, "health", 12)};
}

/* ================= TOPIC TIMING ================= */
// topics: love, money, career, move, legal, health
function natalTopic(R, topic){
  const X = R.pro, P = R.saju.P, g = R.p.gender, out = [];
  if (topic === "love"){
    const k = X.kin.spouse; out.push("spouseLevel" + k.level);
    if (X.stars.some(s => s.k === "peach")) out.push("peach"); if (X.stars.some(s => s.k === "hongyeom")) out.push("hongyeom");
    if (X.stars.some(s => s.k === "gosin" || s.k === "gwasuk")) out.push("lonely");
    if (X.dayHit.includes("chong")) out.push("dayChong"); if (X.dayHit.some(k => ["liuhe","banhe","sanhe"].includes(k))) out.push("dayHe");
    if (g === "f" && X.bad.includes("gwansalhonjap")) out.push("honjap"); if (g === "m" && X.grpPct.companion >= 30) out.push("rivalLove");
    if (!g) out.push("noGender");
  } else if (topic === "career"){
    if (X.grpPct.officer >= 15) out.push("officerStrong"); else if (X.grpPct.officer < 5) out.push("officerWeak");
    if (X.ok.includes("gwaninsangsaeng")) out.push("gwanin"); if (X.grpPct.resource >= 15) out.push("resourceStrong");
    if (X.stars.some(s => s.k === "munchang" || s.k === "hakdang")) out.push("scholar");
    if (X.bad.includes("sanggwangyeongwan")) out.push("sanggwan"); if (X.stars.some(s => s.k === "cheoneul")) out.push("noble");
  } else if (topic === "move"){
    if (X.stars.some(s => s.k === "horse")) out.push("horse"); if (X.sinsal12.includes("yeokma") || X.sinsal12.includes("jisal")) out.push("jisal");
    if (X.rels.some(r => r.k === "chong")) out.push("chongNatal"); if (X.bad.includes("wolchung")) out.push("wolchung");
    out.push("dir");
  } else if (topic === "legal"){
    if (X.grpPct.officer >= 30) out.push("officerHeavy"); if (X.rels.some(r => ["hyeong","samhyeong"].includes(r.k))) out.push("hyeong");
    if (X.bad.includes("sanggwangyeongwan")) out.push("sanggwan"); if (X.stars.some(s => s.k === "cheoneul" || s.k === "cheondeok" || s.k === "woldeok")) out.push("protect");
    if (X.grpPct.resource >= 15) out.push("resource");
  }
  return out;
}
const TOPIC_TARGET = {love:null, money:["wealth","output"], career:["officer","resource"], move:[], legal:["resource"], health:[]};
function periodScore(R, topic, s, b){
  const X = R.pro, P = R.saju.P, dm = P[2].s, g = R.p.gender;
  const tgS = G(tenGod(dm, s)), tgB = G(tenGod(dm, MAIN[b]));
  let sc = 56 + X.role[SE[s]] * 4 + X.role[BE[b]] * 5;
  const why = [];
  const tgt = topic === "love" ? (g === "f" ? ["officer"] : ["wealth"]) : TOPIC_TARGET[topic];
  if (tgt && tgt.length){ const hit = (tgt.includes(tgS) ? 1 : 0) + (tgt.includes(tgB) ? 1 : 0); if (hit){ sc += 6 * hit; why.push("target"); } }
  const rd = brRel(P[2].b, b), rm = brRel(P[1].b, b);
  if (topic === "love"){
    if (rd.some(k => k === "liuhe" || k === "sanhe")){ sc += 8; why.push("dayHe"); }
    if (b === PEACH[grp(P[0].b)] || b === PEACH[grp(P[2].b)]){ sc += 5; why.push("peach"); }
    if (rd.includes("chong")){ sc -= 7; why.push("dayChong"); }
  } else if (topic === "move"){
    if (b === HORSE[grp(P[0].b)] || b === HORSE[grp(P[2].b)]){ sc += 8; why.push("horse"); }
    if (rd.includes("chong") || rm.includes("chong")){ sc += 6; why.push("chongMove"); }
  } else if (topic === "legal"){
    if (tgS === "officer" && X.role[SE[s]] < 0){ sc -= 8; why.push("officerBad"); }
    if (rd.includes("hyeong") || rm.includes("hyeong")){ sc -= 6; why.push("hyeong"); }
    if (rd.includes("chong")){ sc -= 4; why.push("dayChong"); }
  } else if (topic === "health"){
    if (rd.includes("chong")){ sc -= 8; why.push("dayChong"); } if (rd.includes("hyeong")){ sc -= 4; why.push("hyeong"); }
  } else if (topic === "money"){
    if (tgS === "companion" && X.grpPct.wealth < 15){ sc -= 6; why.push("rival"); }
    if (rd.some(k => k === "liuhe" || k === "sanhe")){ sc += 3; why.push("dayHe"); }
  } else if (topic === "career"){
    if (rm.includes("chong")){ sc -= 4; why.push("monthChong"); }
    if (tgS === "output" && X.grpPct.officer >= 10 && G(tenGod(dm, s)) === "output" && tenGod(dm, s) === "shangguan"){ sc -= 5; why.push("sanggwan"); }
  }
  return {score:clamp(sc), why};
}
function periods(R, topic, count){
  const now = new Date(), out = [];
  for (let i = 0; i < count; i++){
    const d = new Date(now.getFullYear(), now.getMonth() + i, 15);
    const gz = Solar.fromYmd(d.getFullYear(), d.getMonth() + 1, 15).getLunar().getMonthInGanZhiExact();
    const s = ENG.STEMS.indexOf(gz[0]), b = ENG.BRANCHES.indexOf(gz[1]);
    out.push({y:d.getFullYear(), m:d.getMonth() + 1, s, b, ...periodScore(R, topic, s, b)});
  }
  return out;
}
function topic(R, t){
  const years = R.pro.years.map(y => ({...y, ...periodScore(R, t, y.s, y.b)}));
  return {natal:natalTopic(R, t), years, months:periods(R, t, 12)};
}
return {compat, business, health, topic, periods, brRel};
})();
