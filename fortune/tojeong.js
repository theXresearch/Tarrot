// X Destiny — Tojeong Bigyeol engine (year · month · week · day) + bilingual texts
// Classical structure: 상괘 (8 trigrams) × 중괘 (6 line positions) × 하괘 (3) = 144 readings.
// Yearly and lunar-monthly readings follow the classical method; daily/weekly readings apply the
// same 선천수 arithmetic to each day's 일진 (an X Destiny extension, labelled as such in the UI).
const TOJ = (() => {
"use strict";
const ST = "甲乙丙丁戊己庚辛壬癸", BRS = "子丑寅卯辰巳午未申酉戌亥";
const SC_STEM = [9,8,7,6,5,9,8,7,6,5], SC_BR = [9,8,7,6,5,4,9,8,7,6,5,4];
const mod = (a, n) => ((a % n) + n) % n;
const scNum = gz => SC_STEM[ST.indexOf(gz[0])] + SC_BR[BRS.indexOf(gz[1])];
// trigram 1..8 = 乾 兌 離 震 巽 坎 艮 坤 ; element index: 0 wood 1 fire 2 earth 3 metal 4 water
const TRI_EL = [null, 3, 3, 1, 0, 0, 4, 2, 2];
const GLYPH = [null, "☰","☱","☲","☳","☴","☵","☶","☷"];
const HAN = [null, "乾","兌","離","震","巽","坎","艮","坤"];
const UP_BASE = [0, 7, 6, 5, 1, 3, -7, -3, 2];
const YAO = [0, -2, 5, -5, 1, 7, -3];
const LOW = [0, 3, 1, -1];
const REL_SC = {saeng:10, bihwa:5, jae:4, seol:-1, gwan:-9};
const DOM_BIAS = [null, [6,8,-2,-1,3,6],[5,3,8,-2,4,5],[4,7,3,-3,4,2],[3,6,-3,-2,7,2],[6,4,4,0,6,5],[-6,-2,-3,-6,-4,-2],[3,-2,4,0,-4,2],[5,1,7,2,1,4]];
const LOW_DOM = [null, [0,4,0,0,2,1],[4,0,1,3,0,0],[0,0,4,0,0,5]];
const SEASON_EL = [null, 0,0,2,1,1,2,3,3,2,4,4,2];
const ZREL = {liuhe:8, sanhe:5, same:1, hai:-4, chong:-10, "":0};
const clamp = (x, a, b) => Math.max(a, Math.min(b, Math.round(x)));
// relation of "other" element to "self" element
function rel(self, other){
  if (self === other) return "bihwa";
  if (mod(other + 1, 5) === self) return "saeng";
  if (mod(self + 1, 5) === other) return "seol";
  if (mod(self + 2, 5) === other) return "jae";
  return "gwan";
}
function grade(s){ return s >= 78 ? 0 : s >= 68 ? 1 : s >= 55 ? 2 : s >= 45 ? 3 : 4; }

function code(B, ly){
  const age = ly - B.lunarY + 1;
  const up = mod(age + scNum(ENG.yearPillar(ly).gz), 8) || 8;
  const bm = Math.abs(B.lunarM), lm = LunarMonth.fromYm(ly, bm), days = lm.getDayCount();
  const mid = mod(days + scNum(Lunar.fromYmd(ly, bm, 1).getMonthInGanZhi()), 6) || 6;
  const dd = Math.min(B.lunarD, days);
  const low = mod(B.lunarD + scNum(Lunar.fromYmd(ly, bm, dd).getDayInGanZhi()), 3) || 3;
  return {up, mid, low, code:up * 100 + mid * 10 + low, age};
}
function month(c, m, yScore){
  const tri = mod(c.up + m - 1, 8) || 8, yao = mod(c.mid + m - 1, 6) || 6;
  const r = rel(TRI_EL[c.up], TRI_EL[tri]);
  const se = SEASON_EL[m], te = TRI_EL[tri];
  const fit = se === te || mod(se + 1, 5) === te ? 3 : mod(se + 2, 5) === te ? -3 : 0;
  const score = clamp(60 + REL_SC[r] + 0.8 * YAO[yao] + fit + 0.4 * (yScore - 60), 25, 95);
  return {m, tri, yao, rel:r, score, v:(m + c.low) % 3};
}
const cache = {};
function year(R, ly){
  const key = R.p.id + "|" + ly + "|" + R.B.lunarY + R.B.lunarM + R.B.lunarD;
  if (cache[key]) return cache[key];
  const c = code(R.B, ly);
  const score = clamp(60 + 1.6 * (UP_BASE[c.up] + YAO[c.mid] + LOW[c.low]), 30, 92);
  const dom = DOM_BIAS[c.up].map((b, i) => clamp(score + b + LOW_DOM[c.low][i], 25, 96));
  const months = Array.from({length:12}, (_, i) => month(c, i + 1, score));
  months.forEach(mo => { const lm = LunarMonth.fromYm(ly, mo.m);
    mo.from = Solar.fromJulianDay(lm.getFirstJulianDay()); mo.to = Solar.fromJulianDay(lm.getFirstJulianDay() + lm.getDayCount() - 1); });
  const sorted = months.slice().sort((a, b) => b.score - a.score);
  const leap = LunarYear.fromYear(ly).getLeapMonth();
  return cache[key] = {...c, ly, score, grade:grade(score), dom, months, best:sorted.slice(0, 3).map(x => x.m), worst:sorted.slice(-2).map(x => x.m), leap};
}
function lunarOf(date){ return Lunar.fromDate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)); }
function day(R, date){
  const L = lunarOf(date), ly = L.getYear(), lm = Math.abs(L.getMonth()), ld = L.getDay();
  const Y = year(R, ly), gz = L.getDayInGanZhi(), n = scNum(gz);
  const tri = mod(n + ld + Y.up, 8) || 8, yao = mod(n + lm + Y.mid, 6) || 6;
  const r = rel(TRI_EL[Y.up], TRI_EL[tri]);
  const zr = ENG.branchRel(R.zod.animal, BRS.indexOf(gz[1]));
  const mo = Y.months[lm - 1];
  const score = clamp(58 + 0.9 * REL_SC[r] + 0.8 * YAO[yao] + ZREL[zr] + 0.3 * (mo.score - 60), 20, 97);
  return {date, ly, lm, ld, leapM:L.getMonth() < 0, gz, tri, yao, rel:r, zr, score, v:ld % 2, Y};
}
function week(R, start){
  const days = Array.from({length:7}, (_, i) => day(R, new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)));
  const avg = Math.round(days.reduce((a, d) => a + d.score, 0) / 7);
  const best = days.reduce((a, d) => d.score > a.score ? d : a), worst = days.reduce((a, d) => d.score < a.score ? d : a);
  return {days, avg, grade:grade(avg), best, worst};
}
function currentLunarYear(date){ return lunarOf(date || new Date()).getYear(); }
return {code, year, month, day, week, rel, grade, currentLunarYear, lunarOf, GLYPH, HAN, TRI_EL};
})();

const TOJ_TX = {
ko:{
  title:"토정비결", tabs:["오늘","이번 주","월별","한 해"],
  intro:"조선 명종 때 토정 이지함 선생이 남긴 한 해 운세법. 음력 생년월일과 그해의 간지로 상괘·중괘·하괘를 뽑아 144괘 중 하나를 얻고, 그 괘로 한 해와 열두 달을 풉니다.",
  method:"상괘 = (세는나이 + 태세수) ÷ 8의 나머지 · 중괘 = (생월 날수 + 월건수) ÷ 6의 나머지 · 하괘 = (생일 + 일진수) ÷ 3의 나머지. 선천수: 甲己子午 9, 乙庚丑未 8, 丙辛寅申 7, 丁壬卯酉 6, 戊癸辰戌 5, 巳亥 4.",
  extNote:"일별·주별 운세는 토정비결의 선천수 계산을 그날의 일진에 적용한 X Destiny의 확장 풀이입니다. 연·월 운세가 고전 방식입니다.",
  textNote:"풀이는 괘의 구조(상괘=팔괘, 중괘=효위, 하괘=천·지·인)에 따라 새로 쓴 것이며, 옛 144괘 원문을 옮긴 것이 아닙니다.",
  lyear:y => `${y}년 (음력)`, code:"괘", age:a => `세는나이 ${a}세`, yearSel:["올해","내년"],
  tri:[null,"건(乾) · 하늘","태(兌) · 못","리(離) · 불","진(震) · 우레","손(巽) · 바람","감(坎) · 물","간(艮) · 산","곤(坤) · 땅"],
  triShort:[null,"건","태","리","진","손","감","간","곤"],
  dir:[null,"서북","서","남","동","동남","북","동북","서남"],
  yaoName:[null,"초효 · 잠룡(潛龍)","2효 · 현룡(見龍)","3효 · 건너는 때","4효 · 도약 직전","5효 · 비룡(飛龍)","상효 · 항룡(亢龍)"],
  lowName:[null,"천(天) · 시운","지(地) · 기반","인(人) · 인연"],
  parts:["상괘 · 한 해의 바탕","중괘 · 운의 단계","하괘 · 힘쓸 곳"],
  grades:["대길","길","평","주의","근신"],
  gradeText:["막힘이 적고 뜻한 바를 이루기 쉬운 해입니다.","노력이 결실로 이어지는 해입니다.","좋고 나쁨이 섞여 있어 쓰기 나름인 해입니다.","고비가 있으니 지키는 데 힘써야 하는 해입니다.","몸을 낮추고 내실을 다지면 다음 해의 복이 되는 해입니다."],
  weekGrade:["막힘없이 풀리는 한 주입니다.","힘을 낸 만큼 돌아오는 한 주입니다.","무난한 한 주. 기본에 충실하십시오.","고르지 않은 한 주. 중요한 일은 좋은 날에 몰아 두십시오.","쉬어 가는 한 주. 큰 결정은 다음 주로 미루십시오."],
  upImg:[null,"하늘이 높고 맑으니","못물이 잔잔히 차오르니","해가 중천에 떠오르니","우레가 산천을 울리니","바람이 들판을 건너니","깊은 물이 굽이쳐 흐르니","큰 산이 길을 막아 서니","대지가 만물을 품으니"],
  midImg:[null,"씨앗은 아직 땅속에 잠들어 있다.","싹이 돋아 뿌리를 내린다.","외나무다리를 건너는 형국이다.","문 앞에 귀인이 서 있다.","용이 구름을 타고 하늘을 난다.","달도 차면 기우는 법이다."],
  lowImg:[null,"하늘의 때를 기다리라.","발밑을 단단히 다지라.","사람 속에 길이 있다."],
  upCore:[null,
    "하늘의 기운을 얻은 해. 뜻을 높이 세우고 바른길을 걸으면 이름과 자리가 함께 올라갑니다. 강한 기운이 지나치면 독단이 되니 굳셈 속에 너그러움을 품으십시오.",
    "못에 물이 차듯 기쁨과 인연이 모이는 해. 사람을 통해 재물과 즐거움이 들어옵니다. 말이 복도 되고 화도 되니 입을 다스리는 것이 이 해의 열쇠입니다.",
    "해가 높이 떠 만물을 비추는 해. 숨은 실력이 드러나고 문서와 명예에 경사가 있습니다. 불은 붙기도 쉽고 꺼지기도 쉬우니 처음의 열정을 끝까지 지키십시오.",
    "우레가 잠든 땅을 깨우는 해. 새로 시작하고 움직이는 일에 힘이 실립니다. 놀랄 일이 생겨도 중심을 잡으면 오히려 전화위복이 됩니다.",
    "바람이 틈마다 스며드는 해. 부드럽게 잇고 오가는 일에서 이익이 납니다. 결단을 미루면 바람에 흩어지니 정할 것은 제때 정하십시오.",
    "깊은 물을 건너는 해. 험한 고비가 있으나 물이 길을 찾듯 지혜와 인내로 통과합니다. 서두르면 빠지고 신중하면 건너니 돈·사람·건강을 지키는 데 힘쓰십시오.",
    "산처럼 멈추어 서는 해. 나아가기보다 머물러 다지는 것이 이롭습니다. 지금 쌓은 것이 다음 상승의 발판이 되니 조급해하지 마십시오.",
    "대지가 만물을 기르는 해. 앞서기보다 받쳐 주고, 서두르기보다 꾸준할 때 큰 결실을 거둡니다. 가정과 터전이 복의 뿌리입니다."],
  yaoText:[null,
    "아직 드러낼 때가 아닙니다. 배우고 준비하며 기반을 닦으면 하반기에 길이 열립니다.",
    "실력이 드러나기 시작합니다. 좋은 협력자를 만나 힘을 합치면 크게 이룹니다.",
    "조심하지 않으면 미끄러질 수 있는 고비입니다. 아침저녁으로 스스로를 살피면 허물이 없습니다.",
    "높은 자리에 가까워졌으나 아직 머뭇거림이 있습니다. 때를 보아 한 걸음 뛰어오르십시오.",
    "운이 정점에 이르는 때입니다. 크게 펼치되 얻은 것을 나누면 오래갑니다.",
    "너무 높이 오르면 뉘우침이 있습니다. 욕심을 덜고 마무리와 정리에 힘쓰십시오."],
  lowText:[null,
    "하늘의 때를 따르는 해. 억지로 만들기보다 흐름을 타면 뜻밖의 도움이 옵니다.",
    "땅을 다지는 해. 재물·집·건강처럼 발밑의 일을 먼저 챙겨야 운이 섭니다.",
    "사람이 운을 여는 해. 인연과 평판을 어떻게 다루느냐가 한 해의 성패를 가릅니다."],
  doms:["재물","직업·사업","애정·가정","건강","이동·여행","대인·귀인"],
  domText:[null,
    ["큰 돈의 흐름에 가까워지는 해. 정당한 일에서 나오는 수입이 커지니 투기보다 본업에 무게를 두십시오.","윗사람의 신임을 얻고 자리가 올라갈 수 있습니다. 책임을 피하지 마십시오.","집안의 기둥 역할이 무겁습니다. 고집을 줄이면 집안이 편안합니다.","머리·폐·뼈를 살피십시오. 과로가 가장 큰 적입니다.","서북쪽이 길하며 공적인 출장과 이동에 득이 있습니다.","나이 많은 귀인이나 공직에 있는 사람이 돕습니다."],
    ["말과 거래에서 돈이 생깁니다. 작은 이익이 모여 곳간이 차니 유흥비만 경계하십시오.","상담·영업·교육처럼 입으로 하는 일이 빛납니다. 설득력이 무기입니다.","연애운과 혼인운이 밝습니다. 웃음이 많은 집에 복이 들어옵니다.","입·치아·호흡기를 조심하고 술자리를 줄이십시오.","서쪽이 길하며 모임과 여행에서 좋은 인연을 만납니다.","후배나 젊은 여성이 기쁜 소식을 전합니다. 말실수로 구설에 오르지 않도록 하십시오."],
    ["이름이 알려지며 돈이 따릅니다. 문서·계약에서 이익이 있으니 꼼꼼히 확인하십시오.","실력이 드러나고 평가받는 해. 시험·승진·발표에 좋습니다.","정열이 큰 해. 쉽게 타오르고 쉽게 식으니 서두르지 마십시오.","심장·눈·혈압을 살피고 열을 다스리십시오.","남쪽이 길하며 밝은 곳으로 나아가는 이동이 이롭습니다.","학식 있는 사람, 문서로 맺은 인연이 힘이 됩니다. 시비는 피하십시오."],
    ["새 일을 벌여 돈을 만드는 해. 움직이는 만큼 벌지만 무리한 확장은 금물입니다.","개업·이직·새 프로젝트에 기운이 있습니다. 첫걸음을 과감하게 떼십시오.","갑작스러운 만남과 다툼이 함께 옵니다. 성급한 말을 아끼십시오.","간·근육·발을 조심하고 놀라거나 다치는 일에 주의하십시오.","동쪽이 길하며 이사·이동·출장이 많은 해입니다.","활동적인 동료나 장남이 기회를 가져옵니다."],
    ["거래와 유통에서 이익이 납니다. 꾸준히 드나드는 돈이 한 번의 큰 돈보다 낫습니다.","협상·무역·연결하는 일이 순조롭습니다. 부드럽게 스며들 때 이깁니다.","소개로 좋은 인연이 닿습니다. 우유부단함만 버리면 됩니다.","호흡기·신경·허리를 살피고 찬 바람을 조심하십시오.","동남쪽이 길하며 먼 곳에서 소식과 이익이 옵니다.","중개하는 사람이 다리를 놓아 줍니다."],
    ["돈이 물처럼 들고 납니다. 보증·투기·동업을 삼가면 지킬 수 있습니다.","고비가 있으나 지혜로 넘는 해. 정면 돌파보다 우회가 낫습니다.","속마음을 알기 어려운 해. 오해가 쌓이지 않게 대화를 늘리십시오.","신장·방광·혈액순환을 살피고 물가와 밤길을 조심하십시오.","북쪽은 신중히. 먼 길은 준비를 철저히 하십시오.","숨은 조력자가 있으나 겉으로만 웃는 사람의 속을 살피십시오."],
    ["쌓고 지키는 해. 부동산·저축처럼 묵히는 재물이 이롭습니다.","멈춰 서서 다지는 해. 무리하게 나아가기보다 자격과 실력을 쌓으십시오.","가족과의 시간이 복이 됩니다. 고집으로 벽을 쌓지 마십시오.","위장·관절·허리를 살피고 체중을 관리하십시오.","동북쪽이 길하나 큰 이동보다 머무름이 낫습니다.","오랜 친구나 고향 사람이 힘이 됩니다."],
    ["땅에 씨를 뿌리듯 차곡차곡 모이는 해. 부동산과 실물 자산이 길합니다.","앞장서기보다 받쳐 줄 때 공이 큽니다. 성실함이 결국 인정받습니다.","어머니와 배우자의 덕이 큽니다. 집안이 화목하면 모든 일이 풀립니다.","소화기와 피부를 살피고 규칙적인 식사를 지키십시오.","서남쪽이 길하며 가까운 곳, 고향에서 이익이 있습니다.","넉넉한 동료와 어머니뻘 여성이 돕습니다."]],
  advH:"올해의 세 가지 지침",
  upAdv:[null,"바른길을 지키고 큰 그림을 그리십시오.","말을 아끼고 감사를 표현하십시오.","시작한 일을 끝까지 밝히십시오.","놀라도 중심을 잃지 마십시오.","정할 것은 제때 정하십시오.","보증·투기·과음을 멀리하십시오.","조급함을 버리고 쌓으십시오.","가정과 기본을 먼저 챙기십시오."],
  yaoAdv:[null,"배우고 준비하는 데 투자하십시오.","좋은 협력자와 손을 잡으십시오.","매사에 한 번 더 확인하십시오.","기회가 오면 한 걸음 뛰어오르십시오.","얻은 것을 나누어 복을 키우십시오.","욕심을 덜고 마무리에 힘쓰십시오."],
  lowAdv:[null,"흐름을 거스르지 말고 때를 기다리십시오.","재정과 건강의 기초를 다지십시오.","사람을 귀하게 여기고 평판을 지키십시오."],
  monthName:m => ["","정월","2월","3월","4월","5월","6월","7월","8월","9월","10월","동짓달","섣달"][m],
  monthsH:"열두 달 운세", bestM:"좋은 달", warnM:"조심할 달", leapNote:m => `올해는 윤${m}월이 있습니다. 윤달은 앞달(${m}월)의 운을 따릅니다.`,
  focus:"이달의 초점", dirL:"길한 방향", range:(a, b) => `양력 ${a} ~ ${b}`,
  triFocus:[null,"명예·직장·윗사람","대화·연애·모임","문서·시험·명성","시작·이동·도전","거래·소식·교류","자금 흐름·건강·위험 관리","휴식·저축·집","가정·협력·실속"],
  mTpl:{
    saeng:[["귀인이 손을 내미는 달","윗사람이나 문서의 도움으로 일이 쉽게 풀립니다. 청하면 얻습니다."],["순풍에 돛을 단 달","미루던 일을 꺼내 보십시오. 막혔던 길이 뚫립니다."],["단비가 내리는 달","몸과 마음이 회복되고 지원이 따릅니다. 배우고 계약하기 좋습니다."]],
    bihwa:[["벗과 함께 가는 달","동료와 형제의 힘이 큽니다. 다만 돈을 나누는 일은 분명히 해 두십시오."],["어깨를 나란히 하는 달","경쟁자가 생기지만 그 덕에 실력이 늘어납니다."],["제자리를 지키는 달","큰 변화는 없으나 안정적입니다. 하던 일을 꾸준히 하십시오."]],
    seol:[["재주를 펼치는 달","표현하고 만들고 가르치는 일에 좋으나 기운이 빠지기 쉬우니 쉼을 챙기십시오."],["베풀어 복을 짓는 달","남을 돕는 일이 훗날의 복이 됩니다. 지출은 계획적으로 하십시오."],["말이 많아지는 달","생각을 펼치기 좋지만 말이 앞서면 구설이 따릅니다."]],
    jae:[["재물을 거두는 달","노력한 만큼 손에 쥐는 달. 거래와 수금에 힘쓰십시오."],["기회를 잡는 달","눈앞의 이익이 보입니다. 욕심을 한 뼘만 줄이면 온전히 얻습니다."],["바쁘게 뛰는 달","일이 많고 돈도 돌지만 몸이 지칩니다. 건강을 함께 챙기십시오."]],
    gwan:[["몸을 낮추는 달","윗선의 압박이나 뜻밖의 일이 생깁니다. 정면으로 맞서지 말고 물러서서 살피십시오."],["관재·구설을 조심할 달","서류와 법규, 말을 조심하십시오. 보증과 다툼은 피하는 것이 상책입니다."],["시험받는 달","어려움이 오지만 견디면 신용이 쌓입니다. 무리한 결정은 다음 달로 미루십시오."]]},
  yaoMonth:[null,"준비하는 마음으로 임하면 좋습니다.","협력하면 힘이 두 배가 됩니다.","작은 실수가 커질 수 있으니 확인 또 확인.","한 단계 올라설 기회가 엿보입니다.","이달은 주도권을 쥘 수 있습니다.","정리하고 마무리하는 데 힘쓰십시오."],
  dayHead:{saeng:"도움받는 날", bihwa:"평온한 날", seol:"베푸는 날", jae:"실속 있는 날", gwan:"조심할 날"},
  dayText:{
    saeng:["찾아가 청하면 얻는 날. 서류·계약·부탁하기에 좋습니다.","생각지 못한 도움이 옵니다. 고마움을 표현하면 복이 커집니다."],
    bihwa:["하던 일을 꾸준히 하면 무난합니다. 동료와 보조를 맞추십시오.","친구·동료와 함께하면 즐겁습니다. 돈 문제만 분명히 하십시오."],
    seol:["아이디어와 표현이 빛나는 날. 다만 지치기 쉬우니 쉼을 챙기십시오.","남을 도우면 돌아오는 날. 지갑은 조금 닫아 두십시오."],
    jae:["노력이 결과로 이어지는 날. 거래·수금·정리에 좋습니다.","기회가 보이면 잡되 욕심은 한 뼘만 줄이십시오."],
    gwan:["말과 서류를 조심하고, 다툼이 생기면 한발 물러서십시오.","큰 결정은 미루고 기본에 충실하면 무사히 지나갑니다."]},
  zrText:{liuhe:"띠와 일진이 합을 이루어 사람 운이 좋습니다.", sanhe:"띠와 일진이 어울려 협력이 순조롭습니다.", chong:"띠와 일진이 충하니 이동·운전·다툼을 조심하십시오.", hai:"띠와 일진이 해(害)를 이루니 오해를 조심하십시오.", same:"", "":""},
  luckyDo:[null,"중요한 사람을 만나고 결정하기","감사 인사와 맛있는 식사","서류 정리·발표·공부","새로 시작하기·운동","연락하고 소개받기","생각을 정리하고 계획 세우기","정리정돈·충분한 휴식","가족 챙기기·집안일"],
  avoid:[null,"고집과 독단","말실수·과음","성급한 다툼","충동구매·과속","우유부단·약속 번복","보증·도박·밤길","미루기·혼자 고립되기","남의 일 떠안기"],
  dayTri:"일괘", doL:"하면 좋은 일", avoidL:"피할 일", lunarDate:(m, d, leap) => `음력 ${leap ? "윤" : ""}${m}월 ${d}일`,
  thisMonth:"이번 달 흐름", weekBest:"가장 좋은 날", weekWarn:"조심할 날", weekAvg:"주간 평균",
  prev:"이전", next:"다음", today:"오늘", open:"토정비결 자세히 보기", score:"운세 지수", domH:"분야별 운세", nextYearH:"내년 토정 미리보기",
  yaoL:"효위", codeL:c => `${c}괘`},
en:{
  title:"Tojeong", tabs:["Today","Week","Months","Year"],
  intro:"Korea's best-loved new-year oracle, left by the Joseon scholar Yi Ji-ham (Tojeong) in the 1500s. Your lunar birthday and the year's stem-branch pair produce an upper, middle and lower number — one of 144 readings that colours the year and each of its twelve lunar months.",
  method:"Upper = (Korean age + year number) mod 8 · Middle = (days in your birth month + month number) mod 6 · Lower = (birth day + day number) mod 3. Innate numbers: 甲己子午 9, 乙庚丑未 8, 丙辛寅申 7, 丁壬卯酉 6, 戊癸辰戌 5, 巳亥 4.",
  extNote:"Daily and weekly readings apply Tojeong's innate-number arithmetic to each day's stem-branch — an X Destiny extension. The yearly and monthly readings follow the classical method.",
  textNote:"Interpretations are newly written from the structure of the reading (upper = trigram, middle = line position, lower = Heaven · Earth · Humanity); they do not reproduce the old 144 verses.",
  lyear:y => `Lunar year ${y}`, code:"Reading", age:a => `Korean age ${a}`, yearSel:["This year","Next year"],
  tri:[null,"Qián ☰ Heaven","Duì ☱ Lake","Lí ☲ Fire","Zhèn ☳ Thunder","Xùn ☴ Wind","Kǎn ☵ Water","Gèn ☶ Mountain","Kūn ☷ Earth"],
  triShort:[null,"Heaven","Lake","Fire","Thunder","Wind","Water","Mountain","Earth"],
  dir:[null,"Northwest","West","South","East","Southeast","North","Northeast","Southwest"],
  yaoName:[null,"1st line · The hidden dragon","2nd line · The dragon in the field","3rd line · The crossing","4th line · Poised to leap","5th line · The flying dragon","Top line · The dragon that overreaches"],
  lowName:[null,"Heaven · timing","Earth · foundations","Humanity · people"],
  parts:["Upper · the year's ground","Middle · the stage you're at","Lower · where to put your effort"],
  grades:["Very favorable","Favorable","Steady","Caution","Lie low"],
  gradeText:["Few obstacles — a year when intentions come true.","A year when effort turns into results.","A mixed year — it becomes what you make of it.","There are hard passages; this is a year for protecting what you have.","Keep a low profile and build substance — it becomes next year's luck."],
  weekGrade:["A week where things flow.","You get back what you put in this week.","A steady week — stick to the basics.","An uneven week — stack important tasks on the good days.","A week to coast. Hold big decisions until next week."],
  upImg:[null,"Heaven stands high and clear;","The lake slowly fills;","The sun climbs to its zenith;","Thunder wakes the hills;","Wind moves across the fields;","Deep water winds its way;","A mountain stands across the road;","The earth holds all things;"],
  midImg:[null,"the seed still sleeps beneath the soil.","the shoot breaks ground and takes root.","you are crossing a narrow bridge.","a helper waits at your gate.","the dragon rides the clouds.","even the full moon must wane."],
  lowImg:[null,"Wait for heaven's timing.","Make the ground beneath you firm.","Your road runs through people."],
  upCore:[null,
    "A year with Heaven's force behind it. Aim high and walk the straight road, and your name and position rise together. Strength overplayed turns into stubbornness — keep some generosity inside the steel.",
    "Joy and connection gather like water filling a lake. Money and good times arrive through people. Words can bless or burn this year; how you use your mouth is the key.",
    "The sun is high and everything is visible. Hidden ability comes to light, with good news around documents and reputation. Fire catches fast and fades fast — carry your first enthusiasm all the way through.",
    "Thunder wakes the sleeping ground. Fresh starts and movement carry real power. Surprises will come; keep your centre and they turn into blessings.",
    "Wind finds every gap. Gains come from connecting, trading and moving gently between people. Put decisions off and they scatter — decide what needs deciding, on time.",
    "A year of crossing deep water. There are hard passages, but like water you find the way through with patience and wit. Rush and you sink; go carefully and you cross. Guard your money, your people and your health.",
    "A year to stand still like a mountain. Consolidating beats charging ahead. What you build now is the platform for the next climb — don't be impatient.",
    "The earth nourishes everything. Supporting rather than leading, and steadiness rather than speed, bring the big harvest. Home and foundations are the root of your luck."],
  yaoText:[null,
    "It isn't time to show your hand yet. Study, prepare and lay foundations, and the road opens in the second half of the year.",
    "Your ability begins to show. Join forces with the right collaborator and you achieve far more.",
    "A slippery passage if you're careless. Check yourself morning and evening and you'll come through without blame.",
    "You are close to a higher place but still hesitating. Watch for the moment, then take the leap.",
    "Your fortune reaches its peak. Spread your wings — and share what you gain so it lasts.",
    "Climb too high and regret follows. Ease off ambition and put your energy into finishing and tidying up."],
  lowText:[null,
    "A year of Heaven's timing. Ride the current rather than forcing things, and unexpected help arrives.",
    "A year of Earth. Money, home and health — the ground under your feet — must come first for your luck to stand.",
    "A year of Humanity. How you handle relationships and reputation decides the year."],
  doms:["Money","Career","Love & home","Health","Travel & moves","People & helpers"],
  domText:[null,
    ["You come close to bigger money. Earned income grows — lean on your real work, not speculation.","Superiors trust you and promotion is possible. Don't dodge responsibility.","You carry the weight of the household. Soften the stubborn streak and home stays calm.","Watch your head, lungs and bones. Overwork is the main enemy.","Northwest is lucky; official trips and business travel pay off.","Older mentors and people in public roles help you."],
    ["Money comes through talk and trade. Small gains fill the vault — just watch spending on fun.","Work that uses your voice — sales, counselling, teaching — shines. Persuasion is your weapon.","Bright for romance and marriage. Luck comes to a house full of laughter.","Look after your mouth, teeth and breathing, and cut back on drinking.","West is lucky; gatherings and trips bring good connections.","Younger people bring happy news. Keep loose talk from turning into gossip."],
    ["Recognition brings money. Contracts and paperwork pay — read them closely.","Your skill is seen and judged. Good for exams, promotions and presentations.","Passion runs high this year. It flares fast and fades fast — don't rush.","Watch your heart, eyes and blood pressure; keep the heat down.","South is lucky; moves toward brighter places pay off.","Learned people and bonds sealed on paper support you. Avoid quarrels."],
    ["Money comes from starting things. You earn as much as you move — but don't overextend.","Strong energy for launches, job changes and new projects. Take the first step boldly.","Sudden meetings and sudden quarrels come together. Hold back hasty words.","Mind your liver, muscles and feet; be careful of shocks and injuries.","East is lucky; a year of moving house, travel and trips.","An energetic colleague or eldest son brings opportunity."],
    ["Profit through trade and distribution. Steady flows beat one big windfall.","Negotiation, trade and connecting roles go smoothly. You win by seeping in gently.","A good match arrives through an introduction — if you stop dithering.","Look after your breathing, nerves and lower back; avoid cold drafts.","Southeast is lucky; news and gain come from far away.","A go-between builds the bridge for you."],
    ["Money flows in and out like water. Avoid guaranteeing loans, speculation and partnerships and you'll keep it.","Hard passages, crossed with wit. A detour beats a frontal charge.","Hearts are hard to read this year. Talk more before misunderstandings pile up.","Look after kidneys, bladder and circulation; be careful near water and on roads at night.","Go carefully toward the north. Prepare thoroughly for long trips.","There are hidden helpers — but look closely at those who only smile on the surface."],
    ["A year to save and hold. Assets you let sit — property, savings — do best.","Stop and consolidate. Build credentials and skill rather than pushing forward.","Time with family is the blessing. Don't let stubbornness build walls.","Watch your stomach, joints and back; manage your weight.","Northeast is lucky, but staying put beats big moves.","Old friends and people from home support you."],
    ["Wealth gathers like seeds sown in a field. Property and real assets do well.","You earn more credit supporting than leading. Diligence is noticed in the end.","Strong blessings from mother and spouse. When home is harmonious, everything else unknots.","Look after digestion and skin; keep regular meals.","Southwest is lucky; gains come from places close to home.","Generous colleagues and motherly women help you."]],
  advH:"Three guidelines for the year",
  upAdv:[null,"Walk the straight road and think big.","Spend words carefully and say thank you often.","Carry what you start all the way to the end.","When startled, keep your centre.","Decide what must be decided, on time.","Stay away from loan guarantees, speculation and heavy drinking.","Drop the impatience and keep building.","Put home and the basics first."],
  yaoAdv:[null,"Invest in learning and preparation.","Join hands with good collaborators.","Double-check everything.","When the chance comes, take the leap.","Share what you gain and your luck grows.","Ease off ambition and focus on finishing well."],
  lowAdv:[null,"Don't swim against the current — wait for the moment.","Strengthen the basics of money and health.","Value people and protect your reputation."],
  monthName:m => `Lunar month ${m}`,
  monthsH:"The twelve lunar months", bestM:"Best months", warnM:"Careful months", leapNote:m => `This year has a leap month after month ${m}; it follows the reading of month ${m}.`,
  focus:"Focus", dirL:"Lucky direction", range:(a, b) => `${a} – ${b}`,
  triFocus:[null,"reputation, career, superiors","conversation, romance, gatherings","documents, exams, recognition","new starts, travel, challenges","deals, news, networking","cash flow, health, risk control","rest, saving, home","family, teamwork, substance"],
  mTpl:{
    saeng:[["A helper reaches out","Support from a superior or a document makes things easy. Ask and you'll receive."],["Wind in your sails","Bring out what you've been postponing — blocked roads open."],["Welcome rain","Body and mind recover and support arrives. Good for learning and signing."]],
    bihwa:[["Walking with friends","Colleagues and siblings are your strength — just keep money arrangements clear."],["Shoulder to shoulder","A rival appears, and your skills sharpen because of it."],["Holding your ground","Little changes, but things are stable. Keep doing what you're doing."]],
    seol:[["Show your talent","Great for creating, expressing and teaching — but energy drains, so rest."],["Give and build credit","Helping others becomes future luck. Keep spending planned."],["A talkative month","Good for sharing ideas, but words that run ahead invite gossip."]],
    jae:[["Harvest month","You hold what you earned. Push deals and collect what's owed."],["Seize the opening","Profit is in sight. Trim your appetite by a hand's width and you get all of it."],["On the run","Lots of work, lots of cash moving — and a tired body. Look after your health."]],
    gwan:[["Bow your head","Pressure from above or a surprise arrives. Step back and observe rather than fight."],["Watch paperwork and gossip","Be careful with documents, rules and words. Avoid guarantees and disputes."],["A test of endurance","Difficulty comes, but enduring it builds trust. Put risky decisions off a month."]]},
  yaoMonth:[null,"Treat it as preparation time.","Teamwork doubles your strength.","Small slips can grow — check, then check again.","A chance to step up appears.","You can take the lead this month.","Focus on wrapping up and tidying."],
  dayHead:{saeng:"A day of support", bihwa:"A calm day", seol:"A giving day", jae:"A productive day", gwan:"A careful day"},
  dayText:{
    saeng:["Ask and you'll receive. Good for paperwork, contracts and favours.","Unexpected help arrives. Saying thank you multiplies it."],
    bihwa:["Keep doing what you're doing and all is well. Stay in step with colleagues.","Time with friends is fun — just keep money matters clear."],
    seol:["Ideas and expression shine — but you tire easily, so rest.","Help someone and it comes back. Keep your wallet a little closed."],
    jae:["Effort turns into results. Good for deals, collecting and sorting things out.","Grab the chance you see — with a little less greed."],
    gwan:["Mind your words and documents; if a quarrel starts, step back.","Hold big decisions and stick to basics — the day passes safely."]},
  zrText:{liuhe:"The day's branch harmonises with your animal — good for people.", sanhe:"The day's branch works with your animal — teamwork flows.", chong:"The day's branch clashes with your animal — careful with travel, driving and arguments.", hai:"The day's branch harms your animal — watch for misunderstandings.", same:"", "":""},
  luckyDo:[null,"meet key people and make decisions","say thanks; share a good meal","sort papers, present, study","start something; exercise","reach out; ask for introductions","think things through; make plans","tidy up; rest well","look after family and home"],
  avoid:[null,"stubbornness and going it alone","loose talk and heavy drinking","hot-headed arguments","impulse buys and speeding","dithering and broken promises","guarantees, gambling, late nights out","procrastinating and isolating","taking on other people's burdens"],
  dayTri:"Day trigram", doL:"Do", avoidL:"Avoid", lunarDate:(m, d, leap) => `Lunar ${leap ? "leap " : ""}${m}/${d}`,
  thisMonth:"This month", weekBest:"Best day", weekWarn:"Careful day", weekAvg:"Weekly average",
  prev:"Previous", next:"Next", today:"Today", open:"Open full Tojeong reading", score:"Fortune index", domH:"By area of life", nextYearH:"Next year's Tojeong",
  yaoL:"Line", codeL:c => `Reading ${c}`}
};
