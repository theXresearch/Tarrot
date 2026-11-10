// 통서(通書) — day / hour almanac from lunar-javascript, rendered in Korean; personal flags from the chart (충일·용신일).
const ALM = (() => {
"use strict";
const K = ALM_KO;
const NUMK = {"一":"일","二":"이","三":"삼","四":"사","五":"오","六":"육","七":"칠","八":"팔","九":"구"}, COLK = {"白":"백","黑":"흑","碧":"벽","绿":"록","黄":"황","赤":"적","紫":"자"}, ELK = {"水":"수","土":"토","木":"목","金":"금","火":"화"};
const BRZ = "子丑寅卯辰巳午未申酉戌亥", STZ = "甲乙丙丁戊己庚辛壬癸";
const ANIK = ["쥐","소","범","토끼","용","뱀","말","양","원숭이","닭","개","돼지"];
const dirK = s => String(s || "").replace(/[东南西北正中]/g, c => ({"东":"동","南":"남","西":"서","北":"북","正":"정","中":"중"})[c]);
const yj = a => (a || []).map(x => K.YJ[x] || x);
const sn = a => (a || []).map(x => K.SN[x] || x);
const star = s => { s = String(s || ""); return (NUMK[s[0]] || "") + (COLK[s[1]] || "") + (ELK[s[2]] || ""); };
const gzi = g => [STZ.indexOf(g[0]), BRZ.indexOf(g[1])];
function day(date, R){
  const L = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate()).getLunar();
  const xiu = L.getXiu(), dGz = L.getDayInGanZhi(), [ds, db] = gzi(dGz);
  const pz = [L.getPengZuGan(), L.getPengZuZhi()];
  const o = {date, gz:dGz, s:ds, b:db, lunar:`${Math.abs(L.getMonth())}.${L.getDay()}${L.getMonth() < 0 ? " (윤)" : ""}`,
    zx:L.getZhiXing(), zxK:K.ZX[L.getZhiXing()] || "", ts:L.getDayTianShen(), tsK:K.SN[L.getDayTianShen()] || "", tsType:L.getDayTianShenType(), tsLuck:L.getDayTianShenLuck(),
    xiu, xiuK:K.XIU[xiu] || xiu, xiuLuck:L.getXiuLuck(), xiuSong:L.getXiuSong(), xiuSongK:K.XS[xiu] || "",
    yi:L.getDayYi(), ji:L.getDayJi(), yiK:yj(L.getDayYi()), jiK:yj(L.getDayJi()),
    jsK:sn(L.getDayJiShen()), xsK:sn(L.getDayXiongSha()), chongB:(db + 6) % 12, sha:dirK(L.getDaySha()),
    xi:dirK(L.getDayPositionXiDesc()), cai:dirK(L.getDayPositionCaiDesc()), fu:dirK(L.getDayPositionFuDesc()),
    pz, pzK:pz.map(x => K.PZ[x] || x), star:star(L.getDayNineStar().toString()), hou:L.getWuHou(), houK:K.HOU[L.getWuHou()] || L.getWuHou(), houName:L.getHou()};
  o.good = o.tsType === "黄道"; o.allBad = o.yi.includes("诸事不宜");
  if (R){ const P = R.saju.P; o.chYear = (P[0].b + 6) % 12 === db; o.chDay = (P[2].b + 6) % 12 === db; o.mine = o.chYear || o.chDay;
    if (typeof READING !== "undefined" && READING.windOf) o.wind = READING.windOf(R.pro.roleName([0,0,1,1,2,2,3,3,4,4][ds]), R.pro.roleName([4,2,0,0,2,1,1,2,3,3,2,4][db])); }
  return o;
}
function hours(date){
  const L = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate()).getLunar();
  return L.getTimes().slice(0, 12).map((t, i) => ({gz:t.getGanZhi(), from:`${String((i * 2 + 23) % 24).padStart(2, "0")}:00`, to:`${String((i * 2 + 1) % 24).padStart(2, "0")}:00`,
    tsK:K.SN[t.getTianShen()] || t.getTianShen(), type:t.getTianShenType(), luck:t.getTianShenLuck(), chongB:(BRZ.indexOf(t.getGanZhi()[1]) + 6) % 12, yiK:yj(t.getYi()).slice(0, 4), jiK:yj(t.getJi()).slice(0, 4)}));
}
// 택일: situations mapped to the almanac's own activity terms
const SIT = [
 ["wed","혼인","Wedding",["嫁娶"]], ["engage","약혼·상견례","Engagement",["订婚","纳采","订盟"]], ["move","이사·입주","Moving in",["移徙","入宅"]], ["open","개업·영업 시작","Opening a business",["开市"]],
 ["contract","계약·거래","Contracts & deals",["立券","交易","立券交易"]], ["travel","여행·출장","Travel",["出行"]], ["build","공사·착공","Construction",["动土","修造","起基","起基动土"]],
 ["med","치료·수술","Medical treatment",["求医疗病","治病","求医","针灸"]], ["study","입학·배움 시작","Starting study",["入学","习艺"]], ["hire","사람 고용","Hiring",["雇佣","进人口"]],
 ["car","차 구입","Buying a car",["买车"]], ["realty","부동산 매입","Buying property",["置产"]], ["money","재물·투자 들임","Receiving money",["纳财","求财"]], ["funeral","장례","Funeral",["安葬"]], ["law","소송","Lawsuit",["词讼"]]];
function pick(sitKey, from, days, R){
  const S = SIT.find(x => x[0] === sitKey); if (!S) return [];
  const out = [];
  for (let i = 0; i < days; i++){ const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i), o = day(d, R);
    if (o.allBad || o.mine) continue; if (!S[3].some(t => o.yi.includes(t))) continue; if (S[3].some(t => o.ji.includes(t))) continue;
    out.push(o); }
  return out;
}
const ANIMAL = b => ANIK[b];
return {day, hours, pick, SIT, ANIMAL};
})();
