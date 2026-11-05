// X Destiny — professional Saju analysis layer
// 월률분야 hidden stems & 사령, weighted strength (득령·득지·득세·통근), 격국 with 성격/파격,
// 억부·조후·종격 용신 with 희·기·구·한신, full 합충형파해·원진·귀문, 20+ 신살, 12신살,
// 공망, 납음, 궁위·육친, 일주론, 대운·세운 scoring, health/career/wealth/spouse indicators.
const PRO = (() => {
"use strict";
const ST = "甲乙丙丁戊己庚辛壬癸", BR = "子丑寅卯辰巳午未申酉戌亥";
const SE = [0,0,1,1,2,2,3,3,4,4], BE = [4,2,0,0,2,1,1,2,3,3,2,4];
const mod = (a, n) => ((a % n) + n) % n;
const si = c => ST.indexOf(c), bi = c => BR.indexOf(c);
// 월률분야: [stem, days] in order 여기 → 중기 → 정기
const HID = [[["壬",10],["癸",20]],[["癸",9],["辛",3],["己",18]],[["戊",7],["丙",7],["甲",16]],[["甲",10],["乙",20]],
  [["乙",9],["癸",3],["戊",18]],[["戊",7],["庚",7],["丙",16]],[["丙",10],["己",9],["丁",11]],[["丁",9],["乙",3],["己",18]],
  [["戊",7],["壬",7],["庚",16]],[["庚",10],["辛",20]],[["辛",9],["丁",3],["戊",18]],[["戊",7],["甲",7],["壬",16]]];
const ROLE_OF = (h, n) => h === n - 1 ? "main" : (n === 3 && h === 1 ? "mid" : "rem"); // 정기/중기/여기
const STAGE_START = [11,6,2,9,2,9,5,0,8,3];
const stage = (s, b) => s % 2 === 0 ? mod(b - STAGE_START[s], 12) : mod(STAGE_START[s] - b, 12);
const tenGod = (dm, s) => ENG.tenGod(dm, s);
const GROUP = {bijian:"companion", jiecai:"companion", shishen:"output", shangguan:"output", piancai:"wealth", zhengcai:"wealth", qisha:"officer", zhengguan:"officer", pianyin:"resource", zhengyin:"resource"};
const GROUPS = ["companion","output","wealth","officer","resource"];
const W_STEM = [10, 10, 0, 10], W_BR = [10, 30, 15, 15];

/* ---- relation tables ---- */
const pairIn = (list, a, b) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
const STEM_HE = [[0,5,2],[1,6,3],[2,7,4],[3,8,0],[4,9,1]]; // with transformed element
const STEM_CHONG = [[0,6],[1,7],[2,8],[3,9]];
const LIU_HE = [[0,1,2],[2,11,0],[3,10,1],[4,9,3],[5,8,4],[6,7,1]];
const SAN_HE = [[8,0,4,4],[11,3,7,0],[2,6,10,1],[5,9,1,3]]; // members + element; centre = [1]
const BANG_HE = [[2,3,4,0],[5,6,7,1],[8,9,10,3],[11,0,1,4]];
const XING3 = [[2,5,8],[1,10,7]]; // 寅巳申, 丑戌未
const ZIXING = [4,6,9,11];
const PO = [[0,9],[3,6],[4,1],[7,10],[2,11],[5,8]];
const HAI = [[0,7],[1,6],[2,5],[3,4],[8,11],[9,10]];
const WONJIN = [[0,7],[1,6],[2,9],[3,8],[4,11],[5,10]];
const GWIMUN = [[0,9],[1,6],[2,7],[3,8],[4,11],[5,10]];

/* ---- symbolic stars ---- */
const NOBLE = [[1,7],[0,8],[11,9],[11,9],[1,7],[0,8],[1,7],[2,6],[5,3],[5,3]];
const MUNCHANG = [5,6,8,9,8,9,11,0,2,3];
const HAKDANG = [11,6,2,9,2,9,5,0,8,3];
const ROK = [2,3,5,6,5,6,8,9,11,0];
const YANGIN = [3,null,6,null,6,null,9,null,0,null];
const GEUMYEO = [4,5,7,8,7,8,10,11,1,2];
const HONGYEOM = [6,8,2,7,4,4,10,9,0,8];
const CHEONDEOK = {2:"丁",3:"申",4:"壬",5:"辛",6:"亥",7:"甲",8:"癸",9:"寅",10:"丙",11:"乙",0:"巳",1:"庚"};
const grpOf = b => SAN_HE.findIndex(g => g.slice(0, 3).includes(b));
const WOLDEOK_STEM = [8, 0, 2, 6]; // index follows SAN_HE order: 申子辰 壬, 亥卯未 甲, 寅午戌 丙, 巳酉丑 庚
const PEACH = [9, 0, 3, 6], HORSE = [2, 5, 8, 11], CANOPY = [4, 7, 10, 1]; // per SAN_HE order
const GOSIN = b => [2,2,5,5,5,8,8,8,11,11,11,2][b], GWASUK = b => [10,10,1,1,1,4,4,4,7,7,7,10][b];
const GOEGANG = ["庚辰","庚戌","壬辰","壬戌","戊戌"];
const BAEKHO = ["甲辰","乙未","丙戌","丁丑","戊辰","壬戌","癸丑"];
const ILGWI = ["丁酉","丁亥","癸卯","癸巳"], ILDEOK = ["甲寅","丙辰","戊辰","庚辰","壬戌"];
const SPS = ["jisal","nyeonsal","wolsal","mangsin","jangseong","banan","yeokma","yukhae","hwagae","geopsal","jaesal","cheonsal"]; // 12신살 from 지살
const NAYIN = ["海中金","爐中火","大林木","路傍土","劍鋒金","山頭火","澗下水","城頭土","白蠟金","楊柳木","泉中水","屋上土","霹靂火","松柏木","長流水","砂中金","山下火","平地木","壁上土","金箔金","覆燈火","天河水","大驛土","釵釧金","桑柘木","大溪水","沙中土","天上火","石榴木","大海水"];
const NAYIN_EL = [3,1,0,2,3,1,4,2,3,0,4,2,1,0,4,3,1,0,2,3,1,4,2,3,0,4,2,1,0,4];
const jiazi = (s, b) => mod(6 * s - 5 * b, 60);

function analyze(R, now){
  const S = R.saju, P = S.P, dm = S.dm, dEl = SE[dm], has = P.map(Boolean);
  const gender = R.p.gender;
  const elOfGroup = g => mod(dEl + GROUPS.indexOf(g), 5);
  const groupOfEl = e => GROUPS[mod(e - dEl, 5)];
  /* --- hidden stems with weights, 사령 --- */
  const hid = P.map(p => p ? HID[p.b].map(([c, d], h, arr) => ({s:si(c), days:d, role:ROLE_OF(h, arr.length), tg:tenGod(dm, si(c))})) : null);
  let saryeong = null;
  try {
    const bj = new Date(R.B.utc + 8 * 3600e3);
    const lun = Solar.fromYmdHms(bj.getUTCFullYear(), bj.getUTCMonth() + 1, bj.getUTCDate(), bj.getUTCHours(), bj.getUTCMinutes(), 0).getLunar();
    const js = lun.getPrevJie().getSolar();
    const jUtc = Date.UTC(js.getYear(), js.getMonth() - 1, js.getDay(), js.getHour(), js.getMinute(), js.getSecond()) - 8 * 3600e3;
    const elapsed = (R.B.utc - jUtc) / 864e5;
    let acc = 0, pick = hid[1][hid[1].length - 1];
    for (const h of hid[1]){ acc += h.days; if (elapsed < acc){ pick = h; break; } }
    saryeong = {s:pick.s, tg:pick.tg, day:Math.floor(elapsed) + 1, term:lun.getPrevJie().getName()};
  } catch(e){}
  /* --- weighted elements & groups --- */
  const elW = [0,0,0,0,0];
  let total = 0;
  P.forEach((p, i) => { if (!p) return;
    if (i !== 2){ elW[SE[p.s]] += W_STEM[i]; total += W_STEM[i]; }
    const sum = hid[i].reduce((a, h) => a + h.days, 0);
    hid[i].forEach(h => elW[SE[h.s]] += W_BR[i] * h.days / sum); total += W_BR[i]; });
  const elPct = elW.map(w => Math.round(w / total * 1000) / 10);
  const elFull = elW.slice(); elFull[dEl] += 10; const tf = total + 10;
  const elPctFull = elFull.map(w => Math.round(w / tf * 1000) / 10);
  const grpPct = {}; GROUPS.forEach(g => grpPct[g] = elPct[elOfGroup(g)]);
  const tgW = {}; Object.keys(GROUP).forEach(k => tgW[k] = 0);
  P.forEach((p, i) => { if (!p) return; if (i !== 2) tgW[tenGod(dm, p.s)] += W_STEM[i];
    const sum = hid[i].reduce((a, h) => a + h.days, 0); hid[i].forEach(h => tgW[h.tg] += W_BR[i] * h.days / sum); });
  Object.keys(tgW).forEach(k => tgW[k] = Math.round(tgW[k] / total * 1000) / 10);
  /* --- strength --- */
  const supEl = e => e === dEl || mod(e + 1, 5) === dEl;
  const score = Math.round(grpPct.companion + grpPct.resource);
  const mainEl = b => SE[si(HID[b][HID[b].length - 1][0])];
  const deukryeong = supEl(mainEl(P[1].b)), deukji = supEl(mainEl(P[2].b));
  const supStems = [0, 1, 3].filter(i => P[i] && supEl(SE[P[i].s])).length;
  const roots = [];
  P.forEach((p, i) => { if (!p) return; hid[i].forEach(h => { if (SE[h.s] === dEl) roots.push({i, role:h.role}); }); });
  const deukse = supStems >= 2 || (supStems >= 1 && roots.length >= 2);
  const band = score < 20 ? 0 : score < 35 ? 1 : score < 50 ? 2 : score < 65 ? 3 : 4; // 극신약 신약 중화 신강 극신강
  const strength = band <= 1 ? "weak" : band >= 3 ? "strong" : "balanced";
  /* --- presence helpers --- */
  const stemTGs = [0, 1, 3].filter(i => P[i]).map(i => tenGod(dm, P[i].s));
  const hasStem = k => stemTGs.includes(k);
  const hasGrpStem = g => stemTGs.some(k => GROUP[k] === g);
  const hasG = g => hasGrpStem(g) || grpPct[g] >= 12;
  /* --- 격국 --- */
  const mh = hid[1], order = mh.slice().reverse();
  let gStem = order.find(h => [0, 1, 3].some(i => P[i] && P[i].s === h.s)) || order[0];
  let gtg = gStem.tg, geok;
  if (GROUP[gtg] === "companion"){
    const other = order.find(h => GROUP[h.tg] !== "companion" && [0, 1, 3].some(i => P[i] && P[i].s === h.s));
    if (other){ gStem = other; gtg = other.tg; }
  }
  if (GROUP[gtg] === "companion"){ const stg = stage(dm, P[1].b); geok = stg === 3 ? "geonrok" : (stg === 4 && dm % 2 === 0) ? "yangin" : "wolgeop"; }
  else geok = gtg;
  let special = null;
  const noRoot = !roots.some(r => r.role !== "rem");
  if (score < 16 && noRoot && !hasGrpStem("resource")){
    const g = ["output","wealth","officer"].sort((a, b) => grpPct[b] - grpPct[a])[0];
    special = {output:"jongA", wealth:"jongJae", officer:"jongSal"}[g];
  } else if (score > 84 && grpPct.officer < 6 && !hasGrpStem("officer")){
    special = grpPct.companion >= grpPct.resource ? "jongWang" : "jongGang";
  }
  /* 성격/파격 */
  const ok = [], bad = [];
  const monthChong = P.some((p, i) => p && i !== 1 && mod(p.b - P[1].b, 12) === 6);
  switch (GROUP[gtg] === "companion" ? "companion" : gtg){
    case "zhengguan":
      if (hasG("wealth")) ok.push("jaesaenggwan"); if (hasG("resource")) ok.push("gwaninsangsaeng");
      if (hasStem("shangguan") && !hasG("resource")) bad.push("sanggwangyeongwan"); if (hasStem("qisha")) bad.push("gwansalhonjap"); break;
    case "qisha":
      if (hasG("output") && (hasStem("shishen") || tgW.shishen >= 8)) ok.push("siksinjesal"); if (hasG("resource")) ok.push("sarinsangsaeng");
      if (!ok.length) bad.push(hasG("wealth") ? "jaesaengsal" : "salmuje"); break;
    case "zhengcai": case "piancai":
      if (hasG("output")) ok.push("siksangsaengjae"); if (hasG("officer")) ok.push("jaesaenggwan");
      if (grpPct.companion >= 30 && !hasG("officer")) bad.push("gungeopjaengjae"); if (score < 30) bad.push("jaedasinyak"); break;
    case "shishen":
      if (hasG("wealth")) ok.push("siksinsaengjae"); if (hasStem("qisha")) ok.push("siksinjesal");
      if (hasStem("pianyin") && !hasG("wealth")) bad.push("dosik"); break;
    case "shangguan":
      if (hasG("wealth")) ok.push("sanggwansaengjae"); if (hasG("resource")) ok.push("sanggwanpaein");
      if (hasStem("zhengguan") && !hasG("resource")) bad.push("sanggwangyeongwan"); break;
    case "zhengyin": case "pianyin":
      if (hasG("officer")) ok.push("gwaninsangsaeng"); if (score >= 50 && hasG("output")) ok.push("insikgyeomjeon");
      if (hasGrpStem("wealth") && grpPct.wealth >= 22 && !hasG("companion")) bad.push("tamjaegoein"); break;
    default:
      if (hasG("officer")) ok.push(geok === "yangin" ? "yanginhapsal" : "rokgyeomgwan");
      if (hasG("output") && hasG("wealth")) ok.push("siksangsaengjae");
      if (!ok.length) bad.push("bigeopdokwang");
  }
  if (monthChong) bad.push("wolchung");
  const geokGrade = ok.length && !bad.length ? "seong" : ok.length && bad.length ? "seongpa" : !ok.length && bad.length ? "pa" : "pyeong";
  /* --- 용신 --- */
  const season = [4,4,0,0,0,1,1,1,3,3,3,4][P[1].b]; // element of the month's season (子丑 winter … 申酉戌 autumn); 寅卯辰 spring
  const johuNeed = [11,0,1,2].includes(P[1].b) ? 1 : [5,6,7].includes(P[1].b) ? 4 : null;
  const johuUrgent = johuNeed !== null && elPct[johuNeed] < 6 && !(johuNeed === 1 && dEl === 1) && !(johuNeed === 4 && dEl === 4);
  let yong, hee, method;
  if (special){
    const g = {jongA:"output", jongJae:"wealth", jongSal:"officer", jongWang:"companion", jongGang:"resource"}[special];
    yong = elOfGroup(g); hee = special === "jongA" ? elOfGroup("wealth") : special === "jongGang" ? elOfGroup("companion") : mod(yong - 1, 5); method = "jong";
  } else {
    if (band <= 1){
      const drain = ["officer","wealth","output"].sort((a, b) => grpPct[b] - grpPct[a])[0];
      if (drain === "wealth"){ yong = elOfGroup("companion"); hee = elOfGroup("resource"); }
      else { yong = elOfGroup("resource"); hee = elOfGroup("companion"); }
    } else if (band >= 3){
      if (grpPct.companion >= grpPct.resource){
        if ((grpPct.officer >= 6 || hasGrpStem("officer")) && grpPct.officer < 25){ yong = elOfGroup("officer"); hee = elOfGroup("wealth"); }
        else { yong = elOfGroup("output"); hee = elOfGroup("wealth"); }
      } else { yong = elOfGroup("wealth"); hee = elOfGroup("output"); }
    } else {
      const top = GROUPS.slice().sort((a, b) => grpPct[b] - grpPct[a])[0];
      if (top === "officer"){ yong = elOfGroup("resource"); hee = elOfGroup("companion"); }
      else if (top === "wealth"){ yong = elOfGroup("companion"); hee = elOfGroup("resource"); }
      else if (top === "output"){ yong = elOfGroup("wealth"); hee = elOfGroup("officer"); }
      else if (top === "companion"){ if (grpPct.officer >= 6){ yong = elOfGroup("officer"); hee = elOfGroup("wealth"); } else { yong = elOfGroup("output"); hee = elOfGroup("wealth"); } }
      else { yong = elOfGroup("wealth"); hee = elOfGroup("output"); }
    }
    method = "eokbu";
    if (johuUrgent && johuNeed !== mod(yong + 3, 5)){
      if (johuNeed !== yong){ hee = yong; yong = johuNeed; }
      method = "johu";
    }
  }
  const gi = mod(yong + 3, 5), gu = mod(yong + 2, 5);
  let han = [0,1,2,3,4].find(e => ![yong, hee, gi, gu].includes(e));
  if (hee === gi || hee === gu){ hee = mod(yong - 1, 5); han = [0,1,2,3,4].find(e => ![yong, hee, gi, gu].includes(e)); }
  const role = [0,0,0,0,0]; role[yong] = 2; role[hee] = 1; role[gi] = -2; role[gu] = -1; if (han !== undefined) role[han] = 0;
  const roleName = e => e === yong ? "yong" : e === hee ? "hee" : e === gi ? "gi" : e === gu ? "gu" : "han";
  const favGroups = GROUPS.filter(g => role[elOfGroup(g)] > 0);
  /* --- interactions among natal pillars --- */
  const rels = [], idx = [0, 1, 2, 3].filter(i => P[i]);
  for (let a = 0; a < idx.length; a++) for (let b = a + 1; b < idx.length; b++){
    const i = idx[a], j = idx[b], x = P[i], y = P[j];
    const sh = STEM_HE.find(([p, q]) => (p === x.s && q === y.s) || (p === y.s && q === x.s));
    if (sh) rels.push({k:"stemHe", pos:[i, j], ch:ST[x.s] + ST[y.s], el:sh[2]});
    if (pairIn(STEM_CHONG, x.s, y.s)) rels.push({k:"stemChong", pos:[i, j], ch:ST[x.s] + ST[y.s]});
    const B1 = x.b, B2 = y.b, ch = BR[B1] + BR[B2];
    const lh = LIU_HE.find(([p, q]) => (p === B1 && q === B2) || (p === B2 && q === B1));
    if (lh) rels.push({k:"liuhe", pos:[i, j], ch, el:lh[2]});
    if (mod(B1 - B2, 12) === 6) rels.push({k:"chong", pos:[i, j], ch});
    const sg = SAN_HE.find(g => g.slice(0, 3).includes(B1) && g.slice(0, 3).includes(B2) && B1 !== B2);
    if (sg && (B1 === sg[1] || B2 === sg[1])) rels.push({k:"banhe", pos:[i, j], ch, el:sg[3]});
    if (XING3.some(g => g.includes(B1) && g.includes(B2) && B1 !== B2) || pairIn([[0,3]], B1, B2)) rels.push({k:"hyeong", pos:[i, j], ch});
    if (B1 === B2 && ZIXING.includes(B1)) rels.push({k:"jahyeong", pos:[i, j], ch});
    if (pairIn(PO, B1, B2)) rels.push({k:"pa", pos:[i, j], ch});
    if (pairIn(HAI, B1, B2)) rels.push({k:"hai", pos:[i, j], ch});
    if (pairIn(WONJIN, B1, B2)) rels.push({k:"wonjin", pos:[i, j], ch});
    if (pairIn(GWIMUN, B1, B2)) rels.push({k:"gwimun", pos:[i, j], ch});
  }
  const brSet = idx.map(i => P[i].b);
  SAN_HE.forEach(g => { if (g.slice(0, 3).every(b => brSet.includes(b))) rels.push({k:"sanhe", pos:idx.filter(i => g.slice(0, 3).includes(P[i].b)), ch:g.slice(0, 3).map(b => BR[b]).join(""), el:g[3]}); });
  BANG_HE.forEach(g => { if (g.slice(0, 3).every(b => brSet.includes(b))) rels.push({k:"banghe", pos:idx.filter(i => g.slice(0, 3).includes(P[i].b)), ch:g.slice(0, 3).map(b => BR[b]).join(""), el:g[3]}); });
  XING3.forEach(g => { if (g.every(b => brSet.includes(b))) rels.push({k:"samhyeong", pos:idx.filter(i => g.includes(P[i].b)), ch:g.map(b => BR[b]).join("")}); });
  /* --- 신살 --- */
  const stars = [], addStar = (k, pos) => { if (pos.length) stars.push({k, pos}); };
  const findBr = list => idx.filter(i => list.includes(P[i].b));
  addStar("cheoneul", findBr(NOBLE[dm]));
  addStar("munchang", findBr([MUNCHANG[dm]]));
  addStar("hakdang", findBr([HAKDANG[dm]]));
  addStar("rok", findBr([ROK[dm]]).filter(i => i !== 1 || geok !== "geonrok"));
  if (YANGIN[dm] !== null) addStar("yangin", findBr([YANGIN[dm]]));
  addStar("geumyeo", findBr([GEUMYEO[dm]]));
  addStar("hongyeom", findBr([HONGYEOM[dm]]));
  const cd = CHEONDEOK[P[1].b]; addStar("cheondeok", idx.filter(i => i !== 1 ? (si(cd) >= 0 ? P[i].s === si(cd) : P[i].b === bi(cd)) : false));
  const wd = WOLDEOK_STEM[grpOf(P[1].b)]; addStar("woldeok", idx.filter(i => P[i].s === wd));
  const sh = new Set();
  [0, 2].forEach(base => { const g = grpOf(P[base].b);
    [["peach", PEACH[g]], ["horse", HORSE[g]], ["canopy", CANOPY[g]]].forEach(([k, b]) => { idx.filter(i => i !== base && P[i].b === b).forEach(i => sh.add(k + ":" + i)); }); });
  ["peach","horse","canopy"].forEach(k => addStar(k, [...new Set([...sh].filter(x => x.startsWith(k)).map(x => +x.split(":")[1]))]));
  if (GOEGANG.includes(ST[P[2].s] + BR[P[2].b])) addStar("goegang", [2]);
  addStar("baekho", idx.filter(i => BAEKHO.includes(ST[P[i].s] + BR[P[i].b])));
  if (ILGWI.includes(ST[P[2].s] + BR[P[2].b])) addStar("ilgwi", [2]);
  if (ILDEOK.includes(ST[P[2].s] + BR[P[2].b])) addStar("ildeok", [2]);
  addStar("gosin", idx.filter(i => i !== 0 && P[i].b === GOSIN(P[0].b)));
  addStar("gwasuk", idx.filter(i => i !== 0 && P[i].b === GWASUK(P[0].b)));
  const needle = idx.filter(i => [0, 7].includes(P[i].s)).length + idx.filter(i => [3, 6, 8].includes(P[i].b)).length;
  if (needle >= 3) addStar("hyeonchim", idx);
  const kongS = mod(P[2].b - P[2].s, 12), kong = [mod(kongS - 2, 12), mod(kongS - 1, 12)];
  addStar("gongmang", idx.filter(i => i !== 2 && kong.includes(P[i].b)));
  if (rels.some(r => r.k === "wonjin")) addStar("wonjinsal", [...new Set(rels.filter(r => r.k === "wonjin").flatMap(r => r.pos))]);
  if (rels.some(r => r.k === "gwimun")) addStar("gwimunsal", [...new Set(rels.filter(r => r.k === "gwimun").flatMap(r => r.pos))]);
  // 12신살 based on the year branch
  const g0 = SAN_HE[grpOf(P[0].b)][0];
  const sinsal12 = P.map(p => p ? SPS[mod(p.b - g0, 12)] : null);
  /* --- 납음, 태원, 명궁 --- */
  const nayin = P.map(p => p ? Math.floor(jiazi(p.s, p.b) / 2) : null);
  let taiyuan = null, minggong = null;
  try { const bj = new Date(R.B.utc + 8 * 3600e3);
    const ec = Solar.fromYmdHms(bj.getUTCFullYear(), bj.getUTCMonth() + 1, bj.getUTCDate(), bj.getUTCHours(), bj.getUTCMinutes(), 0).getLunar().getEightChar();
    taiyuan = ec.getTaiYuan(); if (R.B.hasTime) minggong = ec.getMingGong(); } catch(e){}
  /* --- 일주 --- */
  const dayGZ = ST[P[2].s] + BR[P[2].b];
  const dayFlags = [];
  if (SE[P[2].s] === BE[P[2].b]) dayFlags.push("ganyeojidong");
  if (GOEGANG.includes(dayGZ)) dayFlags.push("goegang"); if (BAEKHO.includes(dayGZ)) dayFlags.push("baekho");
  if (ILGWI.includes(dayGZ)) dayFlags.push("ilgwi"); if (ILDEOK.includes(dayGZ)) dayFlags.push("ildeok");
  if (P[2].b === YANGIN[dm]) dayFlags.push("yangin");
  /* --- 육친 --- */
  const locate = keys => { const out = [];
    P.forEach((p, i) => { if (!p) return; if (i !== 2 && keys.includes(tenGod(dm, p.s))) out.push({i, at:"s"});
      hid[i].forEach(h => { if (keys.includes(h.tg)) out.push({i, at:h.role === "main" ? "b" : "h"}); }); }); return out; };
  const REL6 = gender === "f" ?
    {spouse:["zhengguan","qisha"], children:["shishen","shangguan"], father:["piancai"], mother:["zhengyin","pianyin"], siblings:["bijian","jiecai"]} :
    {spouse:["zhengcai","piancai"], children:["qisha","zhengguan"], father:["piancai"], mother:["zhengyin","pianyin"], siblings:["bijian","jiecai"]};
  const kin = {};
  Object.entries(REL6).forEach(([k, keys]) => { const loc = locate(keys);
    const w = keys.reduce((a, t) => a + tgW[t], 0);
    const hit = loc.filter(l => l.at !== "h").map(l => l.i);
    const clash = rels.filter(r => ["chong","hyeong","samhyeong"].includes(r.k) && r.pos.some(i => hit.includes(i))).length > 0;
    const empty = hit.length > 0 && hit.every(i => kong.includes(P[i].b) && i !== 2);
    kin[k] = {loc, w:Math.round(w * 10) / 10, level:w < 3 ? 0 : w < 14 ? 1 : w < 28 ? 2 : 3, clash, empty};
  });
  const spouseGod = tenGod(dm, si(HID[P[2].b][HID[P[2].b].length - 1][0]));
  const dayHit = rels.filter(r => r.pos.includes(2) && r.pos.length >= 2 && ["chong","hyeong","jahyeong","samhyeong","liuhe","wonjin","pa","hai","banhe","sanhe"].includes(r.k)).map(r => r.k);
  /* --- luck cycles --- */
  const relWith = (b, s) => {
    const out = [];
    idx.forEach(i => { const x = P[i].b;
      if (mod(x - b, 12) === 6) out.push(["chong", i]);
      else if (pairIn(LIU_HE.map(v => v.slice(0, 2)), x, b)) out.push(["liuhe", i]);
      else if (SAN_HE.some(g => g.slice(0, 3).includes(x) && g.slice(0, 3).includes(b) && x !== b)) out.push(["banhe", i]);
      if (XING3.some(g => g.includes(x) && g.includes(b) && x !== b) || pairIn([[0,3]], x, b)) out.push(["hyeong", i]);
      if (pairIn(WONJIN, x, b)) out.push(["wonjin", i]);
      if (s != null && i !== 2 && pairIn(STEM_HE.map(v => v.slice(0, 2)), P[i].s, s)) out.push(["stemHe", i]);
      if (s != null && pairIn(STEM_CHONG, P[i].s, s)) out.push(["stemChong", i]);
    });
    if (s != null && pairIn(STEM_HE.map(v => v.slice(0, 2)), dm, s)) out.push(["stemHe", 2]);
    return out;
  };
  const STG_SC = [3,0,2,4,4,0,-2,-3,-2,-4,0,1];
  const scorePeriod = (s, b) => {
    const rs = role[SE[s]], rb = role[BE[b]];
    let sc = 60 + 6 * rs + 8 * rb + STG_SC[stage(dm, b)];
    relWith(b, s).forEach(([k, i]) => { if (k === "chong") sc -= i === 2 ? 7 : i === 1 ? 6 : 3; if (k === "hyeong") sc -= 2; if (k === "wonjin" && i === 2) sc -= 2;
      if ((k === "liuhe" || k === "banhe") && i === 2) sc += 3; });
    return Math.max(15, Math.min(96, Math.round(sc)));
  };
  const nowY = (now || new Date()).getFullYear();
  const luck = S.luck.map(L => ({...L, tgB:tenGod(dm, si(HID[L.b][HID[L.b].length - 1][0])), rs:roleName(SE[L.s]), rb:roleName(BE[L.b]), stage:stage(dm, L.b), rel:relWith(L.b, L.s), score:scorePeriod(L.s, L.b), now:nowY >= L.y0 && nowY <= L.y1}));
  const years = Array.from({length:11}, (_, k) => { const y = nowY + k, yp = ENG.yearPillar(y);
    return {y, s:yp.s, b:yp.b, tg:tenGod(dm, yp.s), tgB:tenGod(dm, si(HID[yp.b][HID[yp.b].length - 1][0])), rs:roleName(SE[yp.s]), rb:roleName(BE[yp.b]), rel:relWith(yp.b, yp.s), score:scorePeriod(yp.s, yp.b), age:y - R.B.y + 1}; });
  /* --- indicators --- */
  const wealthType = score >= 50 && grpPct.wealth >= 18 ? "singangjaewang" : score < 35 && grpPct.wealth >= 25 ? "jaedasinyak" :
    grpPct.wealth < 4 ? "mujae" : grpPct.companion >= 35 && grpPct.wealth < 15 ? "gungeop" : grpPct.output >= 14 && grpPct.wealth >= 8 ? "siksangsaengjae" : "normal";
  const health = [];
  elPctFull.forEach((p, e) => { if (p >= 32) health.push({e, t:"excess"}); else if (p < 5) health.push({e, t:"lack"}); });
  const domGroup = GROUPS.slice().sort((a, b) => grpPct[b] - grpPct[a]);
  return {hid, saryeong, elPct, elPctFull, grpPct, tgW, score, band, strength, deukryeong, deukji, deukse, roots, supStems,
    geok, geokStem:gStem.s, special, ok, bad, geokGrade, yong, hee, gi, gu, han, role, roleName, method, johuNeed, johuUrgent, season, favGroups,
    rels, stars, sinsal12, kong, nayin, taiyuan, minggong, dayGZ, dayFlags, dayStage:stage(dm, P[2].b), kin, spouseGod, dayHit,
    luck, years, wealthType, health, domGroup, elOfGroup, groupOfEl, NAYIN, NAYIN_EL, stage};
}
return {analyze, HID, stage, NAYIN, NAYIN_EL};
})();
