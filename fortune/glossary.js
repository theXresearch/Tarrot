// 용어 풀이 — standard definitions of the terms the app shows (no interpretation added).
const GLOSS = {
ko:{
 "일진":"그날의 간지. 60갑자가 하루에 하나씩 돌아갑니다.", "세운":"그해의 간지(태세). 입춘을 기준으로 바뀝니다.", "월운":"그달의 간지(월건). 절기의 절입일을 기준으로 바뀝니다.", "대운":"출생 월주에서 순행 또는 역행하여 10년마다 바뀌는 운. 성별과 연간의 음양으로 방향이 정해집니다.",
 "천간":"갑·을·병·정·무·기·경·신·임·계의 열 글자. 드러난 기운을 나타냅니다.", "지지":"자·축·인·묘·진·사·오·미·신·유·술·해의 열두 글자. 계절과 바탕을 나타냅니다.", "지장간":"지지 속에 숨어 있는 천간. 월률분야에 따라 날수가 나뉩니다.",
 "일간":"태어난 날의 천간. 사주에서 '나'에 해당합니다.", "십성":"일간과 다른 글자의 생극 관계를 열 가지로 나눈 이름 — 비견·겁재·식신·상관·편재·정재·편관·정관·편인·정인.",
 "용신":"사주의 균형을 위해 가장 필요한 오행.", "희신":"용신을 돕는 오행.", "기신":"용신을 해치는 오행.", "구신":"기신을 돕는 오행.", "한신":"용신과 기신 어느 쪽에도 크게 관여하지 않는 오행.",
 "억부":"일간이 강하면 누르고 약하면 돕는 방식으로 용신을 정하는 법.", "조후":"태어난 계절의 추위·더위, 마름·습함을 고르게 하는 오행으로 용신을 정하는 법.", "격국":"월지(태어난 달)의 기운을 기준으로 정한 사주의 구조.",
 "신강·신약":"일간을 돕는 힘(인성·비겁)이 많으면 신강, 적으면 신약입니다.", "12운성":"일간이 각 지지에서 갖는 기운의 단계 — 장생·목욕·관대·건록·제왕·쇠·병·사·묘·절·태·양.",
 "충":"서로 마주 보는 지지(여섯 칸 떨어진)가 부딪치는 관계 — 자오·축미·인신·묘유·진술·사해.", "합":"지지 또는 천간이 서로 끌어당겨 묶이는 관계. 육합·삼합·반합·천간합이 있습니다.", "형":"지지끼리 서로 해치는 관계 — 인사신·축술미·자묘 등.", "원진":"서로 미워하고 꺼리는 지지의 짝.", "공망":"일주가 속한 순(旬)에서 짝이 없는 두 지지. 비어 있는 자리로 봅니다.",
 "삼재":"띠를 기준으로 세 해 동안 이어지는 조심의 시기. 첫해를 들삼재, 둘째 해를 눌삼재, 셋째 해를 날삼재라 합니다.",
 "황도일·흑도일":"그날을 맡은 열두 천신 중 청룡·명당·금궤·천덕·옥당·사명이 맡으면 황도일(길), 천형·주작·백호·천뢰·현무·구진이 맡으면 흑도일(흉)입니다.",
 "건제12신":"건·제·만·평·정·집·파·위·성·수·개·폐의 열두 날. 월건을 기준으로 날마다 돌아가며 할 일과 피할 일의 바탕이 됩니다.",
 "28수":"하늘을 스물여덟 별자리로 나눈 것. 날마다 하나가 맡으며, 통서에는 별마다 길흉과 노래(성수가)가 있습니다.",
 "의·기":"통서(전통 역서)에 실린 그날 하기에 마땅한 일(의)과 꺼리는 일(기).", "길신·흉살":"그날에 드는 좋은 신(길신)과 나쁜 살(흉살)의 이름. 통서의 택일 근거입니다.",
 "팽조백기":"날의 천간과 지지마다 하지 말라는 일을 전하는 옛 금기.", "72후":"한 해를 닷새씩 72개로 나눈 절기의 자연 현상.", "구성":"일백·이흑·삼벽·사록·오황·육백·칠적·팔백·구자의 아홉 별. 해·달·날마다 돌아갑니다.",
 "충일":"그날 지지가 본인의 띠(연지)나 일지와 충하는 날. 택일에서는 본인과 충하는 날을 피합니다.", "택일":"하려는 일에 맞는 날을 통서의 의·기, 황도일, 본인의 충일을 기준으로 고르는 일.",
 "희신 방위·재신 방위·복신 방위":"통서에서 그날 기쁨·재물·복의 신이 있다고 하는 방향.", "살 방위":"통서에서 그날 살이 있다고 하는 방향."
},
en:{
 "Day pillar":"The stem-branch of the day; the sixty-cycle advances one per day.", "Year pillar":"The stem-branch of the year, changing at the Start of Spring.", "Month pillar":"The stem-branch of the month, changing at each solar term.", "Luck pillar":"A ten-year period derived forward or backward from the birth month pillar.",
 "Ten gods":"Names for how each character relates to the day master by generation and control.", "Useful god":"The element the chart most needs for balance.", "Adverse":"The element that harms the useful god.",
 "Clash":"Opposing branches six apart that strike each other.", "Combination":"Stems or branches that draw together and bind.", "Void":"The two branches left unpaired in the day pillar's decade.",
 "Three Calamities":"A three-year period of caution counted from the zodiac animal.", "Yellow/black path day":"A day ruled by one of twelve spirits; six make a yellow-path (good) day, six a black-path (bad) day.",
 "Twelve officers":"The twelve day types (Establish, Remove, Full, Balance, Settle, Hold, Break, Danger, Success, Receive, Open, Close) cycling from the month branch.",
 "28 mansions":"The sky divided into twenty-eight lunar mansions; one governs each day, with a traditional verse.", "Suitable/avoid":"Activities the traditional almanac lists as suitable or to avoid that day.",
 "Peng Zu taboos":"Old taboos attached to each day's stem and branch.", "72 pentads":"The year split into seventy-two five-day natural phenomena.", "Clash day":"A day whose branch clashes your year or day branch; date selection avoids it."
}};
