// X Destiny — 명리 감정 (expert reading). Every judgement is composed from a classical rule applied to the computed chart:
// 『적천수』(滴天髓) 천간론·쇠왕·한난·조습·하지장, 『자평진전』(子平眞詮) 용신·순역, 『궁통보감』(窮通寶鑑) 조후, 궁위·십성의 통설.
// No scores. Each section carries its basis so the reading can be checked against the source.
const READING = (() => {
"use strict";
const EL = {ko:["목","화","토","금","수"], en:["Wood","Fire","Earth","Metal","Water"]};
const STK = {ko:"갑을병정무기경신임계", en:["Jia","Yi","Bing","Ding","Wu","Ji","Geng","Xin","Ren","Gui"]};
const BRK = {ko:"자축인묘진사오미신유술해", en:["Zi","Chou","Yin","Mao","Chen","Si","Wu","Wei","Shen","You","Xu","Hai"]};
const SE = [0,0,1,1,2,2,3,3,4,4];
const TGK = {ko:{bijian:"비견",jiecai:"겁재",shishen:"식신",shangguan:"상관",piancai:"편재",zhengcai:"정재",qisha:"편관",zhengguan:"정관",pianyin:"편인",zhengyin:"정인"},
             en:{bijian:"Peer",jiecai:"Rival",shishen:"Output",shangguan:"Hurting Officer",piancai:"Indirect Wealth",zhengcai:"Direct Wealth",qisha:"Seven Killings",zhengguan:"Direct Officer",pianyin:"Indirect Resource",zhengyin:"Direct Resource"}};
// classical core meaning of each ten god (통설)
const TGM = {ko:{bijian:"나와 같은 힘 — 자립·동료·경쟁", jiecai:"나를 닮은 다른 힘 — 경쟁·분탈·추진", shishen:"내가 낳는 순한 힘 — 의식주·표현·여유", shangguan:"내가 낳는 날선 힘 — 재주·말·규칙에 대한 도전",
  piancai:"내가 다스리는 유동의 재물 — 사업·활동·사람 운용", zhengcai:"내가 다스리는 고정의 재물 — 성실·관리·저축", qisha:"나를 치는 힘 — 압박·위기·결단·권위", zhengguan:"나를 바르게 다스리는 힘 — 규범·직위·명예",
  pianyin:"나를 낳는 치우친 힘 — 특수한 배움·직관·고독", zhengyin:"나를 낳는 바른 힘 — 학문·보호·문서·어른"},
  en:{bijian:"the same strength as you — independence, peers, competition", jiecai:"a rival strength — competition, sharing out, drive", shishen:"what you gently produce — livelihood, expression, ease", shangguan:"what you sharply produce — talent, speech, challenge to rules",
  piancai:"wealth you move — business, activity, managing people", zhengcai:"wealth you keep — diligence, management, savings", qisha:"what strikes you — pressure, crisis, decision, authority", zhengguan:"what rightly governs you — rules, position, honour",
  pianyin:"one-sided support — unusual learning, intuition, solitude", zhengyin:"proper support — learning, protection, documents, elders"}};
const GRPK = {ko:{companion:"비겁",output:"식상",wealth:"재성",officer:"관성",resource:"인성"}, en:{companion:"peers",output:"output",wealth:"wealth",officer:"officer",resource:"resource"}};
const ROLE = {ko:{yong:"용신",hee:"희신",han:"한신",gu:"구신",gi:"기신"}, en:{yong:"useful",hee:"favourable",han:"neutral",gu:"aggravating",gi:"adverse"}};
const PAL = {ko:["연지(조상·부모·윗사람)","월지(부모·형제·사회·직업 환경)","일지(배우자·자신의 거처)","시지(자녀·아랫사람·말년·계획)"],
             en:["year branch (ancestors, parents, superiors)","month branch (family, society, work environment)","day branch (spouse, your own home)","hour branch (children, juniors, later life, plans)"]};
const J = (w, a, b) => { const c = String(w).trim().slice(-1).charCodeAt(0); return w + ((c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28) ? a : b); };
const stripHan = s => String(s || "").replace(/\s*[（(][^)）]*[)）]/g, "").trim();

/* ---------- 『적천수』 천간론: verse + translation + chart-specific application ---------- */
const VERSE = [
 {zh:"甲木参天，脱胎要火。春不容金，秋不容土。火炽乘龙，水宕骑虎。地润天和，植立千古。",
  ko:"갑목은 하늘을 찌르니 껍질을 벗으려면 불이 필요하다. 봄에는 금을 용납하지 않고, 가을에는 흙을 용납하지 않는다. 불이 거세면 용(진토)을 타고, 물이 넘치면 범(인목)을 탄다. 땅이 촉촉하고 하늘이 온화하면 천년을 우뚝 선다.",
  en:"Jia wood reaches the sky; to shed its husk it needs fire. In spring it cannot bear metal, in autumn it cannot bear earth. When fire blazes it rides the dragon (Chen); when water floods it rides the tiger (Yin). With moist ground and a mild sky it stands a thousand years."},
 {zh:"乙木虽柔，刲羊解牛。怀丁抱丙，跨凤乘猴。虚湿之地，骑马亦忧。藤萝系甲，可春可秋。",
  ko:"을목은 부드러우나 양(미)과 소(축)를 가를 수 있다. 정과 병을 품으면 닭(유)과 원숭이(신)를 타도 된다. 비고 젖은 땅에서는 말(오)을 타도 근심이다. 등나무가 갑에 기대면 봄도 가을도 괜찮다.",
  en:"Yi wood is soft, yet it can carve the goat (Wei) and the ox (Chou). Holding Ding and Bing it can ride the rooster (You) and the monkey (Shen). On hollow, wet ground even riding the horse (Wu) is a worry. A vine tied to Jia does well in spring or autumn."},
 {zh:"丙火猛烈，欺霜侮雪。能煅庚金，逢辛反怯。土众成慈，水猖显节。虎马犬乡，甲木若来，必当焚灭。",
  ko:"병화는 사나워 서리와 눈을 업신여긴다. 경금을 단련할 수 있으나 신을 만나면 도리어 겁낸다. 흙이 많으면 자애로워지고, 물이 날뛰면 절개가 드러난다. 범·말·개(인오술)의 고장에 갑목까지 오면 반드시 타서 사라진다.",
  en:"Bing fire is fierce and scorns frost and snow. It can forge Geng metal but grows timid before Xin. Much earth makes it kind; raging water shows its integrity. In the land of tiger, horse and dog (Yin-Wu-Xu), if Jia wood comes too, it burns itself out."},
 {zh:"丁火柔中，内性昭融。抱乙而孝，合壬而忠。旺而不烈，衰而不穷，如有嫡母，可秋可冬。",
  ko:"정화는 부드럽고 알맞아 속이 밝고 따뜻하다. 을을 품으면 효성스럽고 임과 합하면 충성스럽다. 왕해도 사납지 않고 쇠해도 다하지 않으니, 적모(갑목)가 있으면 가을도 겨울도 괜찮다.",
  en:"Ding fire is soft and centred, bright and warm within. Embracing Yi it is filial; joining Ren it is loyal. Strong, it is not violent; weak, it is not exhausted. With its true mother (Jia) it does well in autumn or winter."},
 {zh:"戊土固重，既中且正。静翕动辟，万物司命。水润物生，火燥物病。若在艮坤，怕冲宜静。",
  ko:"무토는 단단하고 무거우며 가운데이고 바르다. 고요하면 모으고 움직이면 열어 만물의 명을 맡는다. 물이 적시면 만물이 살고 불이 메마르게 하면 만물이 병든다. 간곤(인·신)에 있으면 충을 두려워하니 고요함이 마땅하다.",
  en:"Wu earth is solid and heavy, central and upright. Still, it gathers; moving, it opens — it governs the fate of all things. Moistened by water things live; parched by fire they sicken. On the Gen-Kun axis (Yin, Shen) it fears clashes and should stay still."},
 {zh:"己土卑湿，中正蓄藏。不愁木盛，不畏水狂。火少火晦，金多金光。若要物旺，宜助宜帮。",
  ko:"기토는 낮고 젖어 있으나 가운데이고 바르며 품어 저장한다. 나무가 성해도 근심하지 않고 물이 날뛰어도 두려워하지 않는다. 불이 적으면 불이 어두워지고, 금이 많으면 금이 빛난다. 만물을 왕성하게 하려면 도와주어야 한다.",
  en:"Ji earth is low and moist, yet central and upright, storing and holding. It does not worry at abundant wood nor fear raging water. With little fire, the fire is dimmed; with much metal, the metal shines. To make things flourish it needs help and support."},
 {zh:"庚金带煞，刚健为最。得水而清，得火而锐。土润则生，土干则脆。能赢甲兄，输于乙妹。",
  ko:"경금은 살기를 띠어 굳세기가 으뜸이다. 물을 얻으면 맑아지고 불을 얻으면 날카로워진다. 흙이 촉촉하면 살고 흙이 마르면 부서진다. 갑 형은 이기나 을 누이에게는 진다.",
  en:"Geng metal carries killing force, the hardest of all. Water makes it clear, fire makes it sharp. Moist earth gives it life, dry earth makes it brittle. It beats its elder brother Jia but loses to its younger sister Yi."},
 {zh:"辛金软弱，温润而清。畏土之叠，乐水之盈。能扶社稷，能救生灵。热则喜母，寒则喜丁。",
  ko:"신금은 부드럽고 약하나 따뜻하고 윤기 있고 맑다. 흙이 겹침을 두려워하고 물이 가득함을 즐긴다. 나라를 붙들고 생명을 구할 수 있다. 더우면 어머니(토)를 반기고, 추우면 정화를 반긴다.",
  en:"Xin metal is soft and weak, warm, lustrous and clear. It fears piled-up earth and delights in abundant water. It can uphold the state and save lives. When hot it welcomes its mother (earth); when cold it welcomes Ding."},
 {zh:"壬水通河，能泄金气，刚中之德，周流不滞。通根透癸，冲天奔地。化则有情，从则相济。",
  ko:"임수는 은하에 통해 금의 기운을 빼낼 수 있고, 굳세고 알맞은 덕으로 두루 흘러 막히지 않는다. 뿌리가 통하고 계수가 드러나면 하늘을 찌르고 땅을 내달린다. 변화하면 정이 있고 따르면 서로 돕는다.",
  en:"Ren water joins the Milky Way and drains the force of metal; firm and centred, it flows everywhere without stopping. Rooted and with Gui showing, it surges to the sky and rushes over the land. Transformed, it is affectionate; following, it helps."},
 {zh:"癸水至弱，达于天津。得龙而运，功化斯神。不愁火土，不论庚辛。合戊见火，化象斯真。",
  ko:"계수는 지극히 약하나 하늘 나루에 닿는다. 용(진토)을 얻어 움직이면 그 공과 변화가 신묘하다. 불과 흙을 근심하지 않고 경신을 따지지 않는다. 무와 합하고 불을 보면 변화의 형상이 참되다.",
  en:"Gui water is the weakest, yet it reaches the heavenly ford. Moving with the dragon (Chen), its work and transformation are marvellous. It does not worry about fire and earth, nor depend on Geng and Xin. Joined with Wu and meeting fire, its transformation is true."}
];
// chart-specific checks against each verse (only statements the verse itself makes)
function verseChecks(dm, c){
  const K = c.ko, out = [], add = (ko, en) => out.push(K ? ko : en), hasS = s => c.stems.includes(s), hasB = b => c.brs.includes(b), e = c.el, sea = c.season;
  if (dm === 0){
    if (sea === 0) add(e[3] >= 25 ? "봄에 태어났는데 금이 강합니다 — '봄에는 금을 용납하지 않는다'에 걸립니다." : "봄에 태어났고 금이 강하지 않아 '봄에는 금을 용납하지 않는다'의 꺼림을 피했습니다.", e[3] >= 25 ? "Born in spring with strong metal — this is the 'spring cannot bear metal' warning." : "Born in spring without strong metal, so the 'spring cannot bear metal' warning is avoided.");
    if (sea === 3) add(e[2] >= 25 ? "가을에 태어났는데 흙이 많습니다 — '가을에는 흙을 용납하지 않는다'에 걸립니다." : "가을에 태어났으나 흙이 많지 않아 '가을에는 흙을 용납하지 않는다'의 꺼림을 피했습니다.", e[2] >= 25 ? "Born in autumn with much earth — the 'autumn cannot bear earth' warning applies." : "Born in autumn without much earth, so that warning is avoided.");
    if (e[1] >= 30) add(hasB(4) ? "불이 거센데 진토(용)가 있어 '불이 거세면 용을 탄다'의 조건을 갖췄습니다." : "불이 거센데 진토(용)가 없어 열기를 식힐 받침이 부족합니다.", hasB(4) ? "Fire blazes and Chen (the dragon) is present — the verse's remedy is there." : "Fire blazes but there is no Chen (the dragon) to cool it.");
    if (e[4] >= 30) add(hasB(2) ? "물이 넘치는데 인목(범)이 있어 '물이 넘치면 범을 탄다'의 조건을 갖췄습니다." : "물이 넘치는데 인목(범)이 없어 떠내려갈 염려가 있습니다.", hasB(2) ? "Water floods and Yin (the tiger) is present — the remedy is there." : "Water floods with no Yin (the tiger) to anchor it.");
    if (e[1] >= 12) add("불(자식)이 있어 '껍질을 벗으려면 불이 필요하다'는 조건이 채워졌습니다.", "Fire is present, meeting the need 'to shed its husk it needs fire'."); else add("불이 약해 재능을 드러낼 통로가 좁습니다 — 원문은 갑목에게 불을 요구합니다.", "Fire is weak; the verse says Jia needs fire to show itself.");
  } else if (dm === 1){
    if (hasS(2) || hasS(3)) add("병·정이 천간에 있어 '정과 병을 품는다'에 해당합니다." + (hasB(8) || hasB(9) ? " 그래서 신·유 금의 자리도 감당합니다." : ""), "Bing or Ding shows, so it 'holds Ding and Bing'" + (hasB(8) || hasB(9) ? " and can carry the metal branches Shen/You." : "."));
    else if (hasB(8) || hasB(9)) add("신·유 금의 자리가 있는데 병·정이 드러나지 않아 금의 압박을 받기 쉽습니다.", "Metal branches are present without Bing/Ding to answer them.");
    if (e[4] >= 30) add("물이 많아 '비고 젖은 땅에서는 말을 타도 근심'에 해당합니다 — 불과 흙으로 말려야 합니다.", "Much water: 'on hollow, wet ground even the horse is a worry' — it needs drying fire and earth.");
    if (hasS(0)) add("갑목이 천간에 있어 '등나무가 갑에 기대니 봄도 가을도 괜찮다'에 해당합니다.", "Jia shows, so 'the vine tied to Jia does well in spring or autumn'.");
  } else if (dm === 2){
    if (hasS(6)) add("경금이 있어 '경금을 단련한다' — 힘을 쓸 대상이 분명합니다.", "Geng is present — 'it can forge Geng': a clear object for its strength.");
    if (hasS(7)) add("신금이 있어 '신을 만나면 도리어 겁낸다'(병신합)에 해당합니다 — 기세가 묶이기 쉽습니다.", "Xin is present — 'it grows timid before Xin' (Bing-Xin combine).");
    if (e[2] >= 30) add("흙이 많아 '흙이 많으면 자애로워진다'에 해당합니다.", "Much earth — 'much earth makes it kind'.");
    if (e[4] >= 30) add("물이 많아 '물이 날뛰면 절개가 드러난다'에 해당합니다.", "Much water — 'raging water shows its integrity'.");
    if ([2,6,10].filter(hasB).length >= 2 && hasS(0)) add("인·오·술 불의 자리에 갑목까지 있어 '반드시 타서 사라진다'는 경계에 해당합니다.", "Fire branches Yin-Wu-Xu with Jia present — the verse's warning of burning out applies.");
  } else if (dm === 3){
    if (hasS(1)) add("을목을 품어 '을을 품으면 효성스럽다'에 해당합니다.", "Yi is present — 'embracing Yi it is filial'.");
    if (hasS(8)) add("임수와 합해 '임과 합하면 충성스럽다'에 해당합니다.", "Ren is present — 'joining Ren it is loyal'.");
    if (sea === 3 || sea === 4) add(c.hasJia ? "가을·겨울 출생이지만 갑목(적모)이 있어 '가을도 겨울도 괜찮다'의 조건을 갖췄습니다." : "가을·겨울 출생인데 갑목(적모)이 보이지 않아 불씨를 이어 줄 나무가 아쉽습니다.", c.hasJia ? "Autumn/winter birth, but Jia (the true mother) is there — the verse's condition is met." : "Autumn/winter birth with no Jia to keep the flame alive.");
  } else if (dm === 4){
    add(e[4] >= 12 ? "물이 적셔 주어 '물이 적시면 만물이 산다'에 해당합니다." : "물이 부족합니다 — 원문은 무토에 물의 적심을 요구합니다.", e[4] >= 12 ? "Water moistens it — 'moistened by water things live'." : "Water is scarce; the verse asks for moisture.");
    if (e[1] >= 35 && e[4] < 10) add("불이 강하고 물이 없어 '불이 메마르게 하면 만물이 병든다'에 해당합니다.", "Strong fire and no water — 'parched by fire things sicken'.");
    if ((c.dayB === 2 || c.dayB === 8 || c.monB === 2 || c.monB === 8)) add(c.chongNatal ? "간곤(인·신)의 자리에 있으면서 원국에 충이 있어 '충을 두려워한다'는 경계에 걸립니다." : "간곤(인·신)의 자리에 있으나 원국에 충이 없어 고요함을 지키고 있습니다.", c.chongNatal ? "Seated on Yin/Shen with a clash in the chart — the verse's fear of clashes applies." : "Seated on Yin/Shen with no clash — it keeps its stillness.");
  } else if (dm === 5){
    if (e[0] >= 30) add("나무가 많으나 원문은 '나무가 성해도 근심하지 않는다'고 합니다.", "Much wood, but the verse says Ji 'does not worry at abundant wood'.");
    if (e[4] >= 30) add("물이 많으나 원문은 '물이 날뛰어도 두려워하지 않는다'고 합니다.", "Much water, but the verse says Ji 'does not fear raging water'.");
    if (e[1] < 10) add("불이 적어 '불이 적으면 불이 어두워진다'에 해당합니다 — 따뜻함이 아쉽습니다.", "Little fire — 'with little fire, the fire is dimmed'.");
    if (e[3] >= 25) add("금이 많아 '금이 많으면 금이 빛난다'에 해당합니다 — 재주가 드러납니다.", "Much metal — 'with much metal, the metal shines'.");
    if (c.band <= 1) add("일간이 약해 '만물을 왕성하게 하려면 도와주어야 한다'에 해당합니다.", "The day master is weak — 'it needs help and support'.");
  } else if (dm === 6){
    if (e[4] >= 12) add("물을 얻어 '맑아진다'에 해당합니다.", "Water is present — 'water makes it clear'.");
    if (e[1] >= 12) add("불을 얻어 '날카로워진다'에 해당합니다.", "Fire is present — 'fire makes it sharp'.");
    if (e[2] >= 30) add(e[4] >= 10 ? "흙이 많고 촉촉하여 '흙이 촉촉하면 산다'에 해당합니다." : "흙이 많고 메말라 '흙이 마르면 부서진다'에 해당합니다.", e[4] >= 10 ? "Much moist earth — 'moist earth gives it life'." : "Much dry earth — 'dry earth makes it brittle'.");
    if (hasS(1)) add("을목이 있어 '을 누이에게 진다'(을경합)에 해당합니다 — 정에 끌리기 쉽습니다.", "Yi is present — 'it loses to its sister Yi' (Yi-Geng combine).");
  } else if (dm === 7){
    if (e[2] >= 35) add("흙이 겹쳐 '흙이 겹침을 두려워한다'에 해당합니다 — 묻히지 않게 씻어 줄 물이 필요합니다.", "Earth piles up — 'it fears piled-up earth'; it needs water to wash it.");
    if (e[4] >= 20) add("물이 넉넉해 '물이 가득함을 즐긴다'에 해당합니다.", "Water is ample — 'it delights in abundant water'.");
    if (sea === 1) add(e[2] >= 10 ? "더운 계절에 태어나 '더우면 어머니(토)를 반긴다' — 흙이 있어 다행입니다." : "더운 계절에 태어났는데 흙이 적어 '더우면 어머니를 반긴다'의 받침이 약합니다.", e[2] >= 10 ? "Born hot, and earth (its mother) is there as the verse wishes." : "Born hot with little earth to shelter it.");
    if (sea === 4) add(hasS(3) || c.hidDing ? "추운 계절에 태어나 '추우면 정화를 반긴다' — 정화가 있습니다." : "추운 계절에 태어났는데 정화가 보이지 않습니다 — 원문은 정화를 반긴다고 합니다.", hasS(3) || c.hidDing ? "Born cold, and Ding is there as the verse wishes." : "Born cold with no Ding, which the verse welcomes.");
  } else if (dm === 8){
    if (hasS(9) && e[4] >= 30) add("뿌리가 통하고 계수가 드러나 '하늘을 찌르고 땅을 내달린다'에 해당합니다 — 기세를 이끌 물길이 필요합니다.", "Rooted with Gui showing — it 'surges to the sky'; it needs a channel.");
    if (hasS(3)) add("정화와 합해 '변화하면 정이 있다'에 해당합니다.", "Ding is present — 'transformed, it is affectionate'.");
  } else if (dm === 9){
    if (hasB(4)) add("진토(용)가 있어 '용을 얻어 움직이면 공과 변화가 신묘하다'에 해당합니다.", "Chen (the dragon) is present — its work and change are 'marvellous'.");
    if (e[1] + e[2] >= 45) add("불과 흙이 많으나 원문은 '불과 흙을 근심하지 않는다'고 합니다.", "Much fire and earth, but the verse says Gui 'does not worry about fire and earth'.");
    if (hasS(4) && e[1] >= 15) add("무토와 합하고 불이 있어 '변화의 형상이 참되다'에 해당합니다.", "Joined with Wu and meeting fire — 'its transformation is true'.");
  }
  return out;
}
/* ---------- text pieces ---------- */
const L = {
 ko:{
  h:{sum:"한눈에 보는 판단", nature:"일간의 본성 — 『적천수』", str:"강약 — 힘의 크기", geok:"격국 — 삶의 그릇", yong:"용신 — 필요한 기운", clim:"한난조습 — 사주의 온도와 습도", el:"오행의 치우침", tg:"십성으로 본 성향", fame:"부와 귀의 조건 — 『적천수』 하지장", fam:"궁위와 인연", luck:"대운의 흐름", adv:"용신을 쓰는 법"},
  basis:"근거", orig:"원문", seasonName:["봄","여름","환절기","가을","겨울"],
  bandName:["극신약","신약","중화","신강","극신강"],
  strRule:"『적천수』 쇠왕: \"왕하면 빼고 덜어야 하고, 쇠하면 돕고 도와야 한다.\"",
  strTx:[ "일간이 매우 약합니다. 원칙대로라면 일간을 돕는 인성(배움·후원)과 비겁(동료)이 들어올 때 일어섭니다. 다만 너무 약해 버틸 뿌리가 없으면 강한 기운을 따르는 '종격'으로 보아야 하는지를 함께 살펴야 합니다.",
          "일간이 약한 편입니다. 인성과 비겁의 도움이 들어오는 때와 사람이 힘이 되며, 혼자 큰 짐을 지는 방식은 맞지 않습니다.",
          "일간의 힘이 알맞게 짜였습니다. 한쪽으로 크게 기울지 않아 운의 흐름에 따라 쓰임이 달라집니다.",
          "일간이 강한 편입니다. 힘을 밖으로 쓰는 식상(표현)·재성(재물)·관성(책임)으로 풀어낼 때 성취가 납니다.",
          "일간이 매우 강합니다. 넘치는 힘을 빼 줄 통로가 핵심이며, 막히면 고집과 충돌로 나타납니다. 너무 강해 거스를 수 없으면 그 기운을 따르는 '종왕·종강'으로 봅니다."],
  deuk:(r, j, s) => `월지(계절)의 도움 ${r ? "있음" : "없음"} · 일지(앉은 자리)의 도움 ${j ? "있음" : "없음"} · 천간의 도움 ${s ? "있음" : "없음"}`,
  geokRule:"『자평진전』: \"팔자의 용신은 오로지 월령에서 구한다. 재·관·인·식은 좋은 것이니 순하게 쓰고, 살·상관·겁재·양인은 좋지 않은 것이니 거슬러 쓴다.\"",
  shun:"순용의 격 — 월령의 기운이 본래 좋은 것이라 그것을 생해 주고 보호할 때 격이 섭니다.", ni:"역용의 격 — 월령의 기운이 거친 것이라 그것을 제어하고 다스릴 때 격이 섭니다.",
  grade:{seong:"격이 성립했습니다(성격). 월령의 기운을 살리는 짝이 갖추어졌습니다.", seongpa:"격을 이루는 요소와 깨는 요소가 함께 있습니다. 운에서 어느 쪽을 돕느냐에 따라 오르내림이 큽니다.", pa:"격을 깨는 요소가 있습니다(파격). 그 병을 고칠 운이 올 때 크게 풀립니다.", pyeong:"뚜렷하게 이루거나 깨는 요소가 없는 평범한 격입니다. 운의 영향을 많이 받습니다."},
  okH:"격을 이루는 요소", badH:"격을 깨는 요소",
  yongRule:"억부(강약 조절)와 조후(계절의 온도 조절)를 함께 봅니다. 『궁통보감』은 계절을 먼저 보고, 겨울·여름처럼 춥고 더운 달에는 조후를 앞세우는 것이 통설입니다.",
  same:(y) => `억부와 조후가 모두 ${J(y, "을", "를")} 가리킵니다. 두 기준이 일치하니 이 기운이 들어오는 때가 가장 분명한 기회입니다.`,
  diff:(y, j) => `억부(강약)로는 ${J(y, "이", "가")} 필요하고, 『궁통보감』은 이 달에 태어난 이 일간에게 ${J(j, "을", "를")} 씁니다. 두 기준이 다릅니다.`,
  diffWeak:(y, j) => `일간이 약하니 먼저 일간을 살리는 ${J(y, "을", "를")} 쓰고, ${J(j, "은", "는")} 일간이 힘을 얻은 뒤에 씁니다 — 『적천수』의 '쇠하면 돕는다'가 앞섭니다.`,
  diffStrong:(y, j) => `일간이 강하니 『궁통보감』의 ${J(j, "으로", "로")} 다스리는 길과 억부의 ${J(y, "을", "를")} 함께 쓸 수 있습니다. 운에서 둘 중 무엇이 오느냐에 따라 쓰임이 갈립니다.`,
  diffUrgent:(j) => `일간의 힘이 알맞고 춥거나 더운 달에 태어났으니, 『궁통보감』의 ${J(j, "을", "를")} 먼저 보는 것이 통설의 순서입니다.`,
  diffMild:(y) => `일간의 힘이 알맞고 봄·가을에 태어나 계절의 치우침이 덜하니, 억부의 ${J(y, "을", "를")} 중심으로 봅니다.`,
  climRule:"『적천수』: \"하늘에는 춥고 따뜻함이 있고, 땅에는 마르고 젖음이 있다. 너무 젖으면 막혀 이룸이 없고, 너무 마르면 사나워 화가 있다.\"",
  cold:"추운 기운(금·수)이 무겁고 따뜻한 불이 부족합니다. 마음과 일이 굳기 쉬우니 불의 기운(따뜻한 사람·환경·남쪽·여름 운)이 풀어 줍니다.", hot:"더운 기운(목·화)이 무겁고 식혀 줄 물이 부족합니다. 서두르고 지치기 쉬우니 물의 기운(차분한 사람·북쪽·겨울 운)이 균형을 잡아 줍니다.",
  wet:"습한 기운이 지나쳐 일이 늘어지거나 막히기 쉽습니다.", dry:"메마른 기운이 지나쳐 성급함과 충돌이 생기기 쉽습니다.", tempOk:"춥고 더움, 마르고 젖음이 크게 치우치지 않았습니다.",
  excess:(e, g) => `${J(e, "이", "가")} 매우 많습니다. 나와의 관계로 보면 ${g}에 해당하니, 그 성질이 삶에서 크게 드러나되 지나치면 병이 됩니다.`,
  lack:(e, g) => `${J(e, "이", "가")} 거의 없습니다. ${g}에 해당하는 영역이 원국에서는 약하게 드러나며, 운에서 그 기운이 올 때 채워집니다.`,
  elOk:"오행이 크게 치우치지 않았습니다.",
  tgTop:(n, m) => `가장 두드러진 십성은 ${n}입니다 — ${m}.`, monTg:(n, m) => `월령(사회적 바탕)의 십성은 ${n}입니다 — ${m}.`, dayTg:(n, m) => `배우자 자리(일지)의 십성은 ${n}입니다 — ${m}.`,
  fameRule:"『적천수』 하지장: \"부를 어찌 아는가? 재의 기운이 문을 통한다.\" \"귀를 어찌 아는가? 관성이 이치에 맞게 모인다.\" \"길함을 어찌 아는가? 반기는 기운이 곁에서 돕는다.\"",
  richY:"재성이 있고 그것을 감당하거나 생해 줄 힘(일간의 힘 또는 식상)이 있어 '재의 기운이 문을 통한다'의 조건에 가깝습니다.", richW:"재성은 있으나 일간이 약해 감당이 어렵습니다(재다신약) — 재물보다 몸과 힘을 먼저 세워야 합니다.", richC:"비겁이 많아 재물을 다툽니다(군겁쟁재) — 동업과 보증을 조심해야 합니다.", richN:"원국에 재성이 거의 드러나지 않습니다 — 재물은 운에서 재성이 올 때 열립니다.",
  nobleY:"관성이 있고 인성이나 재성이 받쳐 주어 '관성이 이치에 맞게 모인다'의 조건에 가깝습니다.", nobleM:"정관과 편관이 섞여 있어(관살혼잡) 진로가 한 갈래로 모이기 어렵습니다.", nobleW:"관성이 있으나 받쳐 주는 인성·재성이 약합니다.", nobleN:"원국에 관성이 거의 드러나지 않습니다 — 직위와 명예는 운에서 관성이 올 때 열립니다.",
  helpY:"용신·희신이 천간에 드러나 '반기는 기운이 곁에서 돕는다'에 해당합니다.", helpN:"용신·희신이 천간에 드러나지 않아, 도움은 주로 운에서 옵니다.",
  palRule:"궁위의 통설: 연주는 조상·부모, 월주는 부모·형제·사회, 일지는 배우자, 시주는 자녀·말년.",
  spouse:(g, has) => g === "m" ? (has ? "남자에게 배우자의 별인 재성이 원국에 있습니다." : "남자에게 배우자의 별인 재성이 원국에 약합니다 — 인연이 늦거나 담백할 수 있습니다.") : g === "f" ? (has ? "여자에게 배우자의 별인 관성이 원국에 있습니다." : "여자에게 배우자의 별인 관성이 원국에 약합니다 — 인연이 늦거나 담백할 수 있습니다.") : "",
  dayHit:(t) => `배우자 자리(일지)가 원국 안에서 ${J(t, "을", "를")} 받습니다 — 가정과 거처에 변동이 잦을 수 있으니 서로의 공간을 존중하는 것이 좋습니다.`, dayCalm:"배우자 자리(일지)가 원국 안에서 충·형을 받지 않아 비교적 안정되어 있습니다.",
  luckRule:"대운은 지지(10년의 계절)를 더 무겁게 봅니다. 그 기운이 용신·희신이면 순풍, 기신·구신이면 역풍입니다. 원국 지지와 충하면 그 자리가 뜻하는 일에 변동이 옵니다.",
  wind:{up:"순풍기", upL:"다소 순한 시기", mix:"엇갈린 시기", flat:"평온한 시기", downL:"다소 거친 시기", down:"역풍기"},
  windTx:{up:"용신 쪽 기운이 들어오니 나아가고 넓혀도 되는 시기입니다.", upL:"돕는 기운이 한쪽에서 들어옵니다 — 준비된 일은 밀어도 되나 무리한 확장은 아닙니다.", downL:"거친 기운이 한쪽에서 들어옵니다 — 큰 결정은 신중히, 기존의 것을 다지십시오.", mix:"좋은 기운과 거친 기운이 섞여 일의 성패가 갈립니다 — 선택과 집중이 필요합니다.", flat:"크게 돕지도 막지도 않는 기운입니다 — 꾸준함이 결과를 만듭니다.", down:"기신 쪽 기운이 들어오니 확장보다 지키기, 건강과 관계 관리가 먼저입니다."},
  chongAt:(p) => `${p}를 충 — 이 자리가 뜻하는 일에 변동`, heAt:(p) => `${p}와 합 — 이 자리가 뜻하는 일에 결속·인연`,
  age:a => `${a}세~`,
  advRule:"용신 오행의 통설적 대응(방위·색·계절)과 『자평진전』의 원칙 '용신을 돕는 때에 나아가고, 해치는 때에 지킨다'.",
  adv:(y, d, c, s, gi) => `${J(y, "이", "가")} 이 사주를 돕는 기운입니다. ${d} 방향, ${c} 계열, ${s}의 기운이 도움이 됩니다. ${y}의 운이 오는 해와 달에는 나아가고, ${gi}의 운이 겹치는 때에는 무리한 확장을 피하고 지키십시오.`,
  seasonsOf:["봄","여름","환절기(늦여름)","가을","겨울"], dirs:["동쪽","남쪽","중앙","서쪽","북쪽"], cols:["푸른색·초록","붉은색","노란색·갈색","흰색·은색","검은색·남색"],
  sumLine:(dm, mb, band, g, grade, y) => `${dm} 일간이 ${mb}월에 태어났습니다. 힘은 ${band}, 그릇은 ${g}(${grade}), 가장 필요한 기운은 ${y}입니다.`,
  gradeShort:{seong:"성격",seongpa:"성패 혼재",pa:"파격",pyeong:"평격"},
  period:{dayH:"오늘의 기운 읽기", yearH:"올해의 기운 읽기", monthH:"이번 달", tg:(n, m) => `천간은 ${n} — ${m}.`, role:(sR, bR) => `천간의 오행은 ${sR}, 지지의 오행은 ${bR}입니다.`,
   rel:(t) => `원국과의 관계: ${t}.`, noRel:"원국 지지와 특별한 충·합이 없습니다.",
   verdict:{up:"용신 쪽 기운이 들어오는 때 — 계획한 일을 밀고 나가기 좋습니다.", upL:"돕는 기운이 한쪽에서 들어오는 때 — 준비된 일은 진행해도 좋습니다.", downL:"거친 기운이 한쪽에서 들어오는 때 — 서두르지 말고 확인하며 가십시오.", mix:"돕는 기운과 거친 기운이 섞인 때 — 중요한 결정은 한 번 더 확인하십시오.", flat:"평이한 기운 — 하던 일을 꾸준히 이어 가십시오.", down:"기신 쪽 기운이 들어오는 때 — 새 일을 벌이기보다 지키고 정리하십시오."}}
 },
 en:{
  h:{sum:"At a glance", nature:"The day master's nature — Di Tian Sui", str:"Strength", geok:"Structure — the vessel of a life", yong:"Useful god — what the chart needs", clim:"Cold, heat, dryness and damp", el:"Element imbalance", tg:"Character through the ten gods", fame:"Conditions for wealth and rank — Di Tian Sui", fam:"Palaces and relationships", luck:"The luck-pillar journey", adv:"How to use the useful god"},
  basis:"Basis", orig:"Original", seasonName:["spring","summer","transition","autumn","winter"],
  bandName:["very weak","weak","balanced","strong","very strong"],
  strRule:"Di Tian Sui, 'Prosperity and decline': \"The strong should be drained and reduced; the weak should be supported and helped.\"",
  strTx:["The day master is very weak. By the rule it rises when resource (learning, patrons) and peers come in; if it has no root at all, check whether it should instead follow the dominant force (a 'follow' structure).",
         "The day master is on the weak side. Times and people that bring resource and peers are its strength; carrying great loads alone does not suit it.",
         "The day master is fairly balanced. Without a strong lean, its use changes with the luck cycles.",
         "The day master is on the strong side. Achievement comes by spending strength outward — output, wealth and responsibility.",
         "The day master is very strong. A channel to drain the surplus is the key; blocked, it shows as stubbornness and conflict. If it is too strong to oppose, read it as following its own force."],
  deuk:(r, j, s) => `Season supports: ${r ? "yes" : "no"} · Seat supports: ${j ? "yes" : "no"} · Stems support: ${s ? "yes" : "no"}`,
  geokRule:"Zi Ping Zhen Quan: \"The useful god is sought only in the month command. Wealth, officer, resource and output are benign and used by supporting them; killings, hurting officer, rival and blade are harsh and used by restraining them.\"",
  shun:"A 'supported' structure — the month's force is benign and the structure stands when it is fed and protected.", ni:"A 'restrained' structure — the month's force is harsh and the structure stands when it is controlled.",
  grade:{seong:"The structure is formed: what the month force needs is present.", seongpa:"Both forming and breaking factors are present; which side the luck cycles feed decides the swings.", pa:"A breaking factor is present; it opens up when a luck cycle cures that flaw.", pyeong:"No clear forming or breaking factor; it leans on the luck cycles."},
  okH:"Forming factors", badH:"Breaking factors",
  yongRule:"Both strength balance and seasonal climate are weighed. The Qiongtong Baojian reads the season first; in cold and hot months climate is usually put first.",
  same:(y) => `Strength and climate both point to ${y}. With both methods agreeing, times bringing ${y} are the clearest openings.`,
  diff:(y, j) => `Strength balance calls for ${y}; the Qiongtong Baojian prescribes ${j} for this day master in this month. The two differ.`,
  diffWeak:(y, j) => `The day master is weak, so first use ${y} to support it; ${j} comes after it has gained strength — Di Tian Sui's 'support the weak' takes precedence.`,
  diffStrong:(y, j) => `The day master is strong, so the seasonal ${j} and the balancing ${y} can both serve; which luck brings decides the use.`,
  diffUrgent:(j) => `The day master is balanced and born in a cold or hot month, so the usual order puts the seasonal ${j} first.`,
  diffMild:(y) => `The day master is balanced and born in spring or autumn, so strength balance (${y}) leads.`,
  climRule:"Di Tian Sui: \"Heaven has cold and warmth; earth has dryness and damp. Too damp, things stall and nothing is achieved; too dry, things turn fierce and bring harm.\"",
  cold:"Cold forces (metal, water) are heavy and warming fire is lacking. Things tend to freeze; fire — warm people, the south, summer cycles — loosens them.", hot:"Hot forces (wood, fire) are heavy and cooling water is lacking. Haste and fatigue come easily; water — calm people, the north, winter cycles — restores balance.",
  wet:"Damp is excessive; matters drag or stall.", dry:"Dryness is excessive; impatience and conflict come easily.", tempOk:"Cold, heat, dryness and damp are not strongly skewed.",
  excess:(e, g) => `${e} is very abundant. In relation to you it is ${g}; its qualities show strongly in life and turn into trouble when overdone.`,
  lack:(e, g) => `${e} is nearly absent. The area of ${g} shows weakly in the chart and fills in when luck brings it.`,
  elOk:"The elements are not strongly skewed.",
  tgTop:(n, m) => `The most prominent ten god is ${n} — ${m}.`, monTg:(n, m) => `The month command's ten god is ${n} — ${m}.`, dayTg:(n, m) => `The spouse palace (day branch) holds ${n} — ${m}.`,
  fameRule:"Di Tian Sui, 'How to know': \"How to know wealth? The force of wealth passes through the gate.\" \"How to know rank? The officer star gathers in good order.\" \"How to know good fortune? Welcome forces stand by as helpers.\"",
  richY:"Wealth is present and there is strength (the day master or output) to carry or feed it — close to 'wealth passes through the gate'.", richW:"Wealth is present but the day master is too weak to carry it — build strength before wealth.", richC:"Many peers contend for wealth — be careful with partnerships and guarantees.", richN:"Wealth barely shows in the chart; it opens when luck brings wealth.",
  nobleY:"The officer star is present and backed by resource or wealth — close to 'the officer gathers in good order'.", nobleM:"Direct and seven-killings officers are mixed; the career path struggles to settle into one line.", nobleW:"The officer star is present but its backing is weak.", nobleN:"The officer star barely shows; position and honour open when luck brings it.",
  helpY:"Useful or favourable elements show in the stems — 'welcome forces stand by as helpers'.", helpN:"Useful and favourable elements do not show in the stems; help comes mainly through luck.",
  palRule:"Palace convention: year pillar = ancestors and parents, month = family and society, day branch = spouse, hour = children and later life.",
  spouse:(g, has) => g === "m" ? (has ? "For a man, the spouse star (wealth) is present." : "For a man, the spouse star (wealth) is weak — partnership may come late or be low-key.") : g === "f" ? (has ? "For a woman, the spouse star (officer) is present." : "For a woman, the spouse star (officer) is weak — partnership may come late or be low-key.") : "",
  dayHit:(t) => `The spouse palace (day branch) receives ${t} within the chart — home and partnership may change often; give each other space.`, dayCalm:"The spouse palace is not clashed or punished within the chart; it is comparatively stable.",
  luckRule:"Luck pillars are weighed mainly by their branch (the ten-year season). Useful or favourable elements make a tailwind; adverse ones a headwind. A clash with a natal branch brings change to what that palace stands for.",
  wind:{up:"Tailwind", upL:"Mild tailwind", mix:"Mixed", flat:"Calm", downL:"Mild headwind", down:"Headwind"},
  windTx:{up:"Useful energy arrives — a time to advance and expand.", upL:"Help comes from one side — push prepared work, but don't over-expand.", downL:"Harshness comes from one side — be careful with big decisions; consolidate.", mix:"Helpful and harsh forces mix; outcomes split — choose and focus.", flat:"Neither helping nor blocking — steadiness produces the result.", down:"Adverse energy arrives — guard rather than expand; health and relationships first."},
  chongAt:(p) => `clashes the ${p} — change in what it stands for`, heAt:(p) => `combines with the ${p} — bonds in what it stands for`,
  age:a => `from ${a}`,
  advRule:"Classical correspondences of the useful element (direction, colour, season) and Zi Ping's principle: advance when the useful god is fed, guard when it is harmed.",
  adv:(y, d, c, s, gi) => `${y} is what helps this chart: the ${d}, ${c} tones and the energy of ${s}. Advance in years and months that bring ${y}; when ${gi} comes, avoid over-expansion and hold your ground.`,
  seasonsOf:["spring","summer","late summer","autumn","winter"], dirs:["east","south","centre","west","north"], cols:["blue-green","red","yellow-brown","white-silver","black-navy"],
  sumLine:(dm, mb, band, g, grade, y) => `A ${dm} day master born in the ${mb} month. Strength: ${band}; structure: ${g} (${grade}); most needed: ${y}.`,
  gradeShort:{seong:"formed",seongpa:"mixed",pa:"broken",pyeong:"plain"},
  period:{dayH:"Reading today's energy", yearH:"Reading this year's energy", monthH:"This month", tg:(n, m) => `The stem is ${n} — ${m}.`, role:(sR, bR) => `Its stem element is ${sR}; its branch element is ${bR}.`,
   rel:(t) => `With the natal chart: ${t}.`, noRel:"No notable clash or combination with the natal branches.",
   verdict:{up:"Useful energy arrives — good for pushing planned work forward.", upL:"Help comes from one side — prepared work can proceed.", downL:"Harshness comes from one side — don't rush; check as you go.", mix:"Helpful and harsh energy mix — double-check important decisions.", flat:"Ordinary energy — keep steadily at what you are doing.", down:"Adverse energy arrives — consolidate and tidy rather than start new things."}}
 }
};
/* ---------- helpers on the computed chart ---------- */
function ctx(R, lang){
  const S = R.saju, X = R.pro, P = S.P, dm = S.dm, ko = lang === "ko";
  const stems = [0,1,3].filter(i => P[i]).map(i => P[i].s), brs = P.filter(Boolean).map(p => p.b);
  const hidAll = X.hid.flat ? X.hid.flat() : [].concat(...X.hid);
  const chongNatal = X.rels && X.rels.some ? X.rels.some(r => r.k === "chong" || r[0] === "chong") : false;
  return {ko, S, X, P, dm, stems, brs, el:X.elPctFull, season:X.season, band:X.band, dayB:P[2].b, monB:P[1].b, chongNatal,
    hasJia:stems.includes(0) || hidAll.some(h => h && h.s === 0), hidDing:hidAll.some(h => h && h.s === 3)};
}
const windOf = (rs, rb) => { const v = r => ({yong:2, hee:1, han:0, gu:-1, gi:-2})[r] || 0, a = v(rs), b = v(rb), t = 0.4 * a + 0.6 * b;
  if (a * b < 0) return "mix";
  return t >= 1 ? "up" : t >= 0.4 ? "upL" : t <= -1 ? "down" : t <= -0.4 ? "downL" : "flat"; };
function natal(R, lang, opt){
  opt = opt || {}; const T = L[lang] || L.ko, c = ctx(R, lang), {X, P, dm} = c, K = c.ko;
  const E = EL[K ? "ko" : "en"], stN = s => K ? STK.ko[s] : STK.en[s], brN = b => K ? BRK.ko[b] : BRK.en[b], tgN = k => TGK[K ? "ko" : "en"][k], tgM = k => TGM[K ? "ko" : "en"][k];
  const geokName = opt.geokName || (k => k), okName = opt.okName || (k => k), badName = opt.badName || (k => k), okText = opt.okText || (() => ""), badText = opt.badText || (() => "");
  const secs = [];
  // 1 summary
  const gName = X.special ? stripHan(geokName(X.special)) : stripHan(geokName(X.geok));
  secs.push({h:T.h.sum, p:[T.sumLine(`${stN(dm)}${E[SE[dm]]}`, brN(P[1].b), T.bandName[X.band], gName, T.gradeShort[X.geokGrade] || "", E[X.yong])]});
  // 2 nature (Di Tian Sui verse)
  const V = VERSE[dm]; secs.push({h:T.h.nature, verse:V[K ? "ko" : "en"], zh:V.zh, p:verseChecks(dm, c), basis:K ? "『적천수』 천간론" : "Di Tian Sui, the ten stems"});
  // 3 strength
  secs.push({h:T.h.str, p:[`${T.bandName[X.band]} — ${T.deuk(X.deukryeong, X.deukji, X.deukse)}.`, T.strTx[X.band]], basis:T.strRule});
  // 4 structure
  if (!X.special){
    const shun = ["zhengguan","zhengcai","piancai","zhengyin","pianyin","shishen"].includes(X.geok);
    const okL = X.ok.map(k => `＋ ${stripHan(okName(k))} — ${okText(k)}`), badL = X.bad.map(k => `－ ${stripHan(badName(k))} — ${badText(k)}`);
    secs.push({h:T.h.geok, p:[`${gName}: ${shun ? T.shun : T.ni}`, T.grade[X.geokGrade], ...okL, ...badL], basis:T.geokRule});
  } else secs.push({h:T.h.geok, p:[`${gName}: ${opt.specialText ? opt.specialText(X.special) : ""}`], basis:T.geokRule});
  // 5 useful god: strength vs climate
  const TH = typeof TIAOHOU !== "undefined" ? TIAOHOU.get(dm, P[1].b) : null;
  if (TH){ const jEls = [...new Set(TH.use.map(s => SE[s]))], urgent = [5,6,7,11,0,1].includes(P[1].b);
    const jTxt = TH.use.map(s => `${stN(s)}${E[SE[s]]}`).join("·");
    secs.push({h:T.h.yong, p:jEls.includes(X.yong) ? [T.same(E[X.yong])] : [T.diff(E[X.yong], jTxt), X.band <= 1 ? T.diffWeak(E[X.yong], jTxt) : X.band >= 3 ? T.diffStrong(E[X.yong], jTxt) : urgent ? T.diffUrgent(jTxt) : T.diffMild(E[X.yong])],
      basis:T.yongRule, zh:TH.zh}); }
  // 6 climate
  const e = X.elPctFull, cold = e[3] + e[4], warm = e[0] + e[1], cl = [];
  if ([11,0,1].includes(P[1].b) && e[1] < 12) cl.push(T.cold); else if ([5,6,7].includes(P[1].b) && e[4] < 12) cl.push(T.hot);
  if (cold >= 55) cl.push(T.wet); else if (warm >= 55) cl.push(T.dry);
  secs.push({h:T.h.clim, p:cl.length ? cl : [T.tempOk], basis:T.climRule});
  // 7 element skew
  const grpOf = el => GRPK[K ? "ko" : "en"][X.groupOfEl(el)], sk = [];
  e.forEach((p, i) => { if (p >= 30) sk.push(T.excess(E[i], grpOf(i))); else if (p < 6) sk.push(T.lack(E[i], grpOf(i))); });
  secs.push({h:T.h.el, p:sk.length ? sk : [T.elOk], basis:K ? "오행 분포(지장간 포함)와 일간 기준 십성 대응" : "Element distribution (with hidden stems) mapped to ten-god groups"});
  // 8 ten gods
  const top = Object.entries(X.tgW).filter(([k]) => k !== "bijian" || true).sort((a, b) => b[1] - a[1])[0][0];
  const monTg = ENG.tenGod(dm, ENG.BR_MAIN_STEM(P[1].b)), dayTg = ENG.tenGod(dm, ENG.BR_MAIN_STEM(P[2].b));
  secs.push({h:T.h.tg, p:[T.monTg(tgN(monTg), tgM(monTg)), T.tgTop(tgN(top), tgM(top)), T.dayTg(tgN(dayTg), tgM(dayTg))], basis:K ? "십성의 통설적 의미 — 월령은 사회적 바탕, 일지는 배우자 자리" : "Conventional ten-god meanings; month = social ground, day branch = spouse palace"});
  // 9 wealth & rank (何知章)
  const g = X.grpPct, f = [];
  if (X.bad.includes("gungeopjaengjae")) f.push(T.richC); else if (g.wealth < 4) f.push(T.richN); else if (X.band <= 1 && g.wealth >= 25) f.push(T.richW); else if (X.band >= 2 || g.output >= 8) f.push(T.richY); else f.push(T.richW);
  if (g.officer < 4) f.push(T.nobleN); else if (X.bad.includes("gwansalhonjap")) f.push(T.nobleM); else if (g.resource >= 8 || g.wealth >= 8) f.push(T.nobleY); else f.push(T.nobleW);
  f.push([0,1,3].some(i => P[i] && [X.yong, X.hee].includes(SE[P[i].s])) ? T.helpY : T.helpN);
  secs.push({h:T.h.fame, p:f, basis:T.fameRule});
  // 10 palaces
  const fam = [], gender = (R.p && R.p.gender) || opt.gender || "";
  const sp = T.spouse(gender, gender === "m" ? g.wealth >= 6 : g.officer >= 6); if (sp) fam.push(sp);
  const dHit = [0,1,3].filter(i => P[i] && (Math.abs(P[i].b - P[2].b) === 6)).length;
  fam.push(dHit ? T.dayHit(K ? "충" : "a clash") : T.dayCalm);
  secs.push({h:T.h.fam, p:fam, basis:T.palRule});
  // 11 luck journey
  if (X.luck && X.luck.length){
    const items = X.luck.map(Lk => { const w = windOf(Lk.rs, Lk.rb), rel = (Lk.rel || []).filter(([k]) => k === "chong" || k === "liuhe").map(([k, i]) => k === "chong" ? T.chongAt(PAL[K ? "ko" : "en"][i]) : T.heAt(PAL[K ? "ko" : "en"][i]));
      return {now:Lk.now, head:`${T.age(Lk.age)} ${stN(Lk.s)}${brN(Lk.b)} · ${T.wind[w]}`, w, sub:`${tgN(Lk.tg)} / ${ROLE[K ? "ko" : "en"][Lk.rs]}·${ROLE[K ? "ko" : "en"][Lk.rb]}`, tx:T.windTx[w], rel}; });
    secs.push({h:T.h.luck, luck:items, basis:T.luckRule});
  }
  // 12 advice
  secs.push({h:T.h.adv, p:[T.adv(E[X.yong], T.dirs[X.yong], T.cols[X.yong], T.seasonsOf[X.yong], E[X.gi])], basis:T.advRule});
  return secs;
}
// one period pillar (day, month, year) read against the chart
function period(R, s, b, lang){
  const T = (L[lang] || L.ko).period, K = lang === "ko", X = R.pro, dm = R.saju.dm, E = EL[K ? "ko" : "en"];
  const tg = ENG.tenGod(dm, s), rs = X.roleName(SE[s]), rb = X.roleName([4,2,0,0,2,1,1,2,3,3,2,4][b]);
  const w = windOf(rs, rb), R2 = ROLE[K ? "ko" : "en"];
  const rels = R.saju.P.map((p, i) => p ? (Math.abs(p.b - b) === 6 ? (L[lang] || L.ko).chongAt(PAL[K ? "ko" : "en"][i]) : (((p.b + b) % 12) === 1 ? (L[lang] || L.ko).heAt(PAL[K ? "ko" : "en"][i]) : "")) : "").filter(Boolean);
  return {w, lines:[T.tg(TGK[K ? "ko" : "en"][tg], TGM[K ? "ko" : "en"][tg]), T.role(`${E[SE[s]]}(${R2[rs]})`, `${E[[4,2,0,0,2,1,1,2,3,3,2,4][b]]}(${R2[rb]})`), rels.length ? T.rel(rels.join(" · ")) : T.noRel], verdict:T.verdict[w], H:T};
}
return {natal, period, L, windOf};
})();
