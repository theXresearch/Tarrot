// X Tarot — language layer. English is the default; Korean is optional.
const LANG = (() => { try { const s = JSON.parse(localStorage.getItem("xtarot.settings") || "{}"); return s.lang === "ko" ? "ko" : "en"; } catch(e){ return "en"; } })();
document.documentElement.lang = LANG;

const MON_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW_EN = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

const STR = {
ko: {
  nav:{read:"리딩", cl:"손님", lib:"사전", hist:"기록", tools:"도구"},
  back:"뒤로", close:"닫기", storageFull:"저장 공간이 부족합니다. 백업 후 기록을 정리하세요.",
  fmtDate:t => { const d = new Date(t), p = n => String(n).padStart(2, "0"); return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`; },
  cur:n => `상담 중 · <b>${n}</b> 님`, endSess:"상담 종료", sessEnded:"상담을 종료했습니다",
  heroSub:"마음을 가라앉히고, 질문을 떠올리세요", askFirst:"질문으로 시작하기", hqPh:"예: 헤어진 그 사람과 다시 만날 수 있을까?", find:"찾기", enterQ:"질문을 입력하세요",
  orTopic:"또는 주제로 고르기", recTag:"추천", todayTitle:"오늘의 카드", todaySub:c => c ? "손님의 오늘 메시지 한 장" : "하루 한 장, 오늘의 메시지",
  groups:{"기본":"기본 리딩","주제별":"주제별 리딩","심층":"심층 리딩","시기":"시기 리딩"}, nCards:n => `${n}장`,
  installT:"앱처럼 쓰기", installIOS:"Safari 하단 <b>공유 버튼</b> → <b>홈 화면에 추가</b>", installAnd:"Chrome 오른쪽 위 <b>⋮ 메뉴</b> → <b>홈 화면에 추가</b>",
  todayLocked:c => `오늘의 카드는 하루 한 장입니다. ${c ? "이 손님은 " : ""}오늘 이미 뽑은 카드입니다. 내일 새 카드를 뽑을 수 있습니다.`,
  who:"상담 대상", me:"나 (본인)", newCl:"+ 새 손님 등록", clName:"손님 이름", add:"등록", nameReq:"손님 이름을 입력하세요", registered:n => `${n} 님을 등록했습니다`,
  persp:"관점 선택", twoOpt:"두 가지 선택지", optA:"A (예: 이직)", optB:"B (예: 현 직장)",
  question:"질문", qHint:"직접 쓰거나 아래에서 고르세요", eg:"예: ", common:"자주 하는 질문",
  qguide:d => `좋은 질문: “~하면 어떻게 될까?”, “~를 위해 무엇을 해야 할까?”처럼 열린 질문이 더 깊은 답을 줍니다. ${d === "year" ? "이번 달부터 12개월을 봅니다." : d === "week" ? "오늘부터 7일을 봅니다." : ""}`,
  posN:n => `이 스프레드의 자리 · ${n}곳`, shuffle:"카드 섞기",
  scount:'카드를 섞고 있습니다 · 셔플 <b id="sc">0</b>회', shufHint:"질문을 마음속으로 떠올리며 원하는 만큼 섞으세요.<br>손님이 직접 멈추게 하세요.", stop:"그만 섞기",
  cutHint:"덱을 세 묶음으로 나눴습니다.<br>마음이 가는 묶음 하나를 고르세요.", piles:["첫째","둘째","셋째"], pileAria:i => `${i}번째 묶음`,
  whoLine:(n, d) => `${n} 님 · ${d}`,
  dup:h => `같은 질문으로 약 ${h}시간 전에 리딩했습니다. 타로는 처음 뽑은 카드가 답입니다. 원하는 답이 나올 때까지 다시 뽑으면 답이 흐려집니다.`, prevRes:"이전 결과 보기", redo:"상황이 바뀌어 다시 보기",
  pickN:n => `카드 ${n}장을 골라주세요`, pickMore:n => `카드 ${n}장을 더 골라주세요`, ready:"준비 완료",
  wheelHint:"손가락으로 카드 바퀴를 돌리세요.<br>가운데 떠오른 카드나 끌리는 카드를 탭하면 뽑힙니다.", fate:"운명에 맡기기", cardAria:"카드",
  revealHint:"카드를 탭해서 한 장씩 뒤집으세요", flipAll:"모두 뒤집기",
  revMark:"(역)", up:"정방향", rv:"역방향",
  yearTheme:["올해의 테마","앞으로 12개월을 관통하는 큰 흐름"], monthLbl:(m, y) => [`${m + 1}월`, `${y}년 ${m + 1}월의 흐름`],
  dayLbl:d => `${d.getMonth()+1}/${d.getDate()} ${"일월화수목금토"[d.getDay()]}`, dayToday:"오늘의 흐름과 조언", dayOther:"이날의 흐름과 조언",
  rel:{same:["강화","같은 원소라 서로의 힘을 키웁니다."], friend:["우호","서로 돕는 원소라 흐름이 자연스럽게 이어집니다."], oppose:["대립","서로 부딪히는 원소라 긴장이 있고 조율이 필요합니다."], neutral:["중립","큰 충돌 없이 각자의 역할을 합니다."]},
  tone:[["매우 긍정","전체적으로 매우 밝은 흐름입니다. 자신 있게 나아가도 좋습니다."],["긍정","긍정적인 흐름입니다. 다가온 기회를 적극적으로 활용하세요."],["변동","길흉이 섞인 흐름입니다. 선택과 태도가 결과를 좌우합니다."],["도전","도전이 있는 흐름입니다. 신중하게 대비하면 충분히 극복할 수 있습니다."],["어려움","지금은 버티는 시기입니다. 무리하지 말고 기반을 지키며 때를 기다리세요."]],
  majorTimeDef:"상황이 충분히 무르익을 때, 대략 1~3개월", courtTime:["곧, 작은 소식이나 시작으로","빠르게, 2~3주 안","무르익은 뒤, 몇 달 안","가장 늦게, 기반이 갖춰진 뒤"],
  minorTime:(n, s) => `약 ${({wands:`${n}일~${n}주`, cups:`${n}주`, swords:`${n}일`, pentacles:`${n}개월`})[s]} 안팎`,
  season:s => ` · 계절로는 ${({wands:"봄", cups:"여름", swords:"가을", pentacles:"겨울"})[s]}`, revLate:" (역방향이라 예상보다 늦어질 수 있습니다)",
  sens:[
    [/자살|죽고\s*싶|죽을까|목숨을|살기\s*싫|사라지고\s*싶/, "crisis", "지금 많이 힘드시다면 혼자 견디지 마세요. 미국은 988(전화·문자), 한국은 109(자살예방상담)에서 24시간 이야기를 들어 줍니다."],
    [/건강|질병|병원|아프|수술|(?:^|\s)암(?:이|을|은|\s|$)|임신|출산|치료|진단|증상|복용/, "health", "건강 질문입니다. 타로는 마음의 흐름을 보는 참고 도구일 뿐, 진단이나 치료를 대신할 수 없습니다. 증상이 있다면 꼭 의사와 상담하세요."],
    [/소송|재판|변호사|고소|법적|형사|합의금/, "legal", "법률 문제는 반드시 변호사와 상담해 결정하세요. 카드는 마음가짐과 흐름을 참고하는 용도입니다."],
    [/투자|주식|코인|비트코인|대출|부동산|매수|매도/, "money", "투자 결정은 카드만으로 하지 마세요. 객관적인 자료와 전문가의 조언을 함께 확인하세요."]],
  shadowLead:sh => `걸림돌 자리에서는 이 카드의 그림자를 읽습니다. ${sh}`,
  yn:[["예","흐름이 분명하게 긍정적입니다. 진행해도 좋습니다."],["아마도 예","긍정 쪽으로 기울어 있습니다. 핵심 변수만 잘 관리하면 됩니다."],["보류 · 조건부","아직 결정되지 않았습니다. 조건이 바뀌면 결과도 달라집니다."],["아마도 아니오","부정 쪽으로 기울어 있습니다. 지금은 신중함이 필요합니다."],["아니오","흐름이 분명하게 막혀 있습니다. 다른 길이나 다른 시기를 찾으세요."]],
  choiceWin:n => `<b>${n}</b> 쪽 흐름이 더 밝습니다.`, choiceEven:"두 길의 차이가 크지 않습니다. 결과 카드의 내용과 자신의 가치관을 기준으로 선택하세요.",
  oneYear:(c, k) => `올해의 테마 · ${c} — ${k}`, oneWeek:t => `이번 주 흐름 · ${t}`, oneConc:(c, k) => `결론 카드 · ${c} — ${k}`,
  st:{
    single:(nm, main, dom, a) => `${nm} 카드가 나왔습니다. ${main}${dom ? " " + dom : ""} 조언은 “${a}”입니다.`,
    year:(nm, main) => `앞으로 1년을 관통하는 카드는 ${nm}입니다. ${main}`, week:(nm, main) => `오늘은 ${nm} 카드의 날입니다. ${main}`,
    best:l => `가장 흐름이 좋은 시기는 ${l}입니다.`, worst:l => `${l}에는 무리하지 말고 조심하세요.`, noWorst:"특별히 어려운 시기는 보이지 않습니다.",
    tl:(pos, c) => `${pos}(${c})`,
    ynAns:(v, d) => `답은 <b>‘${v}’</b>입니다. ${d}`, ynVar:(nm, main) => `결과를 좌우하는 변수는 ${nm} 카드입니다. ${main}`, adv:a => `조언은 “${a}”입니다.`,
    chNow:(nm, main) => `지금 ${nm} 카드가 보여 주듯, ${main}`, chPaths:(a, n1, b, n2) => `${a}을(를) 택하면 ${n1}, ${b}을(를) 택하면 ${n2} 카드로 이어집니다.`,
    center:(nm, main) => `지금 상황의 중심에는 ${nm} 카드가 있습니다. ${main}`, obstacle:(nm, main) => `걸림돌은 ${nm} 카드입니다. ${main}`,
    cardsAdv:a => `카드가 권하는 해법은 “${a}”입니다.`, leads:(nm, main) => `이 흐름대로 가면 ${nm} 카드로 이어집니다. ${main}`,
    lens:(dom, d) => `${dom === "love" ? "관계로 보면" : "일·재물로 보면"} ${d}`
  },
  ansQ:"질문에 대한 답", ansR:"리딩의 답", score:t => `기운 점수 ${t} · 결과 카드 1.5배 가중`, when:"시기", whenNote:n => `결론 카드(${n})로 본 전통 타이밍 기법의 참고 시기`,
  gauge:["도전","흐름 지수","긍정"],
  choiceCmp:"선택 비교", result:"결과", secPos:n => `위치별 리딩 · ${n}장`, secRel:"카드 간 관계", secEnergy:"에너지 분석", secCombo:"특별 조합", secQuint:"정수 카드 (퀸테센스)",
  notesH:"리딩 노트", memoPh:"상담 내용, 손님 반응, 실제로 일어난 일을 기록해 두세요.", share:"결과 보내기", aiCopy:"AI 심층 해석 복사", newR:"새 리딩", toHist:"기록으로", toHome:"홈으로",
  disc:"타로는 마음의 흐름을 비추는 참고 자료입니다. 중요한 결정은 스스로의 판단과 전문가의 조언을 함께 고려하세요.",
  copiedAI:"복사됨 — Claude에 붙여넣으세요", copyFail:"복사 실패", sharedCopy:"결과를 복사했습니다. 메시지에 붙여넣으세요", shareTitle:"X Tarot 리딩",
  love:"연애", work:"일·재물", advice:"조언", calm:"안심", chTag:"걸림돌", hfTag:"희망·두려움",
  pair:{chStrong:"걸림돌이 만만치 않습니다. 정면으로 부딪히기보다 돌아가는 전략이 필요합니다.", chWeak:"걸림돌은 크지 않습니다. 의식하고 관리하면 충분히 넘을 수 있습니다.",
    f2:"뒤로 갈수록 흐름이 크게 좋아집니다.", f1:"흐름이 점차 나아집니다.", fm2:"뒤로 갈수록 어려움이 커집니다. 미리 대비하세요.", fm1:"흐름이 다소 약해집니다.", f0:"비슷한 강도의 기운이 이어집니다.",
    brighter:p => `‘${p}’ 쪽 기운이 더 밝습니다.`, even:"두 위치의 기운이 비슷하게 맞서 있습니다.", el:r => `원소 <b>${r}</b>`},
  ene:{elTheme:{fire:"열정 · 행동 · 일", water:"감정 · 관계 · 마음", air:"생각 · 소통 · 결정", earth:"돈 · 현실 · 건강"},
    dom:(e, t) => `<b>${e}</b> 원소가 우세합니다. 이 질문의 중심은 <b>${t}</b>입니다.`, miss:(e, l) => `<b>${e}</b> 원소가 없습니다. ${l}`,
    majMany:n => `메이저 카드가 ${n}장입니다. 개인의 노력을 넘어서는 큰 흐름과 인생의 전환점이 작용합니다.`, majNone:"메이저 카드가 없습니다. 운명적인 사건보다 일상의 선택과 행동으로 충분히 바꿀 수 있는 문제입니다.",
    majSome:n => `메이저 카드 ${n}장 — 큰 흐름과 일상의 선택이 함께 작용합니다.`, revMany:n => `역방향이 ${n}장입니다. 지연, 내적 저항, 재검토가 필요한 부분이 많습니다. 서두르기보다 점검이 우선입니다.`,
    allUp:"모든 카드가 정방향입니다. 에너지가 막힘 없이 흐르고 있습니다.", courts:n => `인물 카드가 ${n}장입니다. 주변 사람들의 영향과 관계가 결과에 크게 작용합니다.`,
    rank:(k, v, t) => `${k <= 10 ? (k === 1 ? "에이스" : "숫자 " + k) : RANKS[k - 1][0]} 카드가 ${v}장 — ${t}`,
    avg:(m, i) => `마이너 카드의 평균 숫자는 ${m}입니다. ${["일이 아직 <b>초기 단계</b>에 있습니다.","일이 <b>한창 진행 중</b>입니다.","일이 <b>마무리 단계</b>에 들어섰습니다."][i]}`},
  quintNote:"모든 카드의 숫자를 더해 메이저 아르카나로 환원한 카드로, 이 리딩 전체를 관통하는 근본 메시지입니다.", quintIn:" 리딩에 이미 나온 카드라 메시지가 특히 강조됩니다.",
  fixFlow:"이 흐름을 바로잡으려면 — ", obsLbl:"걸림돌 대처", obsTxt:sh => `${sh}을(를) 경계하세요.`, quintLbl:"정수 카드", adviceH:"종합 조언",
  sh:{head:d => `[X Tarot 리딩] ${d}`, spread:"스프레드", q:"질문", ans:"■ 답", when:"■ 시기", cards:"■ 카드", adv:"■ 조언", foot:"※ 타로는 마음의 흐름을 비추는 참고 자료입니다."},
  ai:(q, opt, spread, n, dom, lines) => `당신은 25년 경력의 전문 타로 리더입니다. 아래 리딩을 손님에게 설명하듯 해석해 주세요.

질문: ${q || "(질문 없음 — 전반적인 흐름)"}
${opt}스프레드: ${spread} (${n}장, 주제: ${dom})
덱: 라이더-웨이트-스미스

${lines}

다음 순서로 한국어로 정리해 주세요:
1) 질문에 대한 핵심 답 (한 문단)
2) 위치별 해석 (위치의 의미와 카드를 연결, 걸림돌 위치는 카드의 그림자로 해석)
3) 카드 간 관계와 흐름 (원소 상응, 메이저/마이너 비율, 반복되는 숫자·수트)
4) 예상 시기
5) 구체적이고 실천 가능한 조언 3가지
무서운 카드(죽음, 탑 등)는 손님이 오해하지 않도록 상징적 의미를 먼저 설명해 주세요.`,
  aiDom:{love:"연애·관계", work:"일·재물", yesno:"예/아니오", general:"일반"}, aiOpt:(a, b) => `선택지: A=${a}, B=${b}\n`, aiCh:" / 걸림돌 위치",
  v:{major:r => `메이저 ${r}`, el:e => `원소 ${e}`, astro:a => `점성 ${a}`, num:n => `숫자 ${n}`, sub:c => c.en,
    inPos:"이 자리에서의 해석", chS:" · 걸림돌", hfS:" · 희망과 두려움", zoom:"그림만 크게 보기", calmH:"안심하세요", posH:p => `위치 — ${p}`, img:"그림의 상징",
    upH:k => `정방향 · ${k}`, rvH:k => `역방향 · ${k}`, loveH:"연애", workH:"일 · 재물", upP:"정: ", rvP:"역: ", shH:"그림자 (걸림돌 자리에서)", advH:"조언", whenH:"시기",
    prev:"‹ 이전 카드", next:"다음 카드 ›"},
  memo:"메모", noQ:"질문 없음", more:n => ` 외 ${n}장`, statR:"리딩", statC:"뽑은 카드", statE:"가장 많은 원소", freq:"자주 나온 카드", times:k => `${k}회`,
  histT:"리딩 기록", histPh:"질문 · 손님 이름 · 카드 · 메모 검색", histF:["전체","나","손님"], recent:"최근 리딩", histEmpty:"아직 저장된 리딩이 없습니다.<br>리딩을 마치면 자동으로 저장됩니다.",
  birth:{both:"성격 · 영혼 카드", pers:"성격 카드", soul:"영혼 카드", mid:"보조 카드", year:y => `${y}년의 카드`},
  clT:"손님 관리", addCl:"+ 새 손님 등록", nameL:"이름", namePh:"손님 이름 (필수)", bdL:"생년월일 (양력, 선택)", memoL:"메모 (선택)", memoPh2:"관심사, 상담 주제 등",
  saveStart:"저장하고 상담 시작", cancel:"취소", clSearch:"손님 검색", privacy:"손님 정보는 이 기기 안에만 저장되며 어디로도 전송되지 않습니다. 도구 탭에서 백업할 수 있습니다.",
  sessCnt:(n, d) => `상담 ${n}회 · 최근 ${d}`, noSess:"상담 기록 없음", inSess:"상담 중", noMatch:"검색 결과가 없습니다", noCl:"등록된 손님이 없습니다.<br>손님을 등록하면 손님별로 상담 기록이 쌓입니다.",
  sessStart:n => `${n} 님 상담을 시작합니다`, clTitle:n => `${n} 님`, contSess:"상담 계속하기", startSess:"이 손님 상담 시작", delCl:"손님 삭제", delConfirm:"한 번 더 누르면 삭제",
  deleted:"삭제했습니다 (상담 기록은 남습니다)", bdL2:"생년월일 (양력)", memoL2:"메모", sessions:n => `상담 기록 · ${n}회`, noSessYet:"아직 상담 기록이 없습니다",
  libT:"카드 사전", libPh:"카드 이름 · 키워드 검색 (예: 사랑, 돈)", libF:["전체","메이저","완드","컵","소드","펜타클"],
  toolsT:"도구", birthH:"나의 탄생 카드", birthP:"생년월일(양력)의 숫자를 더해 메이저 아르카나로 환원합니다. 평생 지니는 성격과 영혼의 과제, 그리고 올해의 주제를 보여 줍니다. 손님의 탄생 카드는 손님 탭에서 생년월일을 넣으면 나옵니다.",
  setH:"설정", langL:"언어 · Language", langS:"앱의 표시 언어", revL:"역방향 카드 사용", revS:"끄면 모든 카드가 정방향으로 나옵니다", quickL:"빠른 진행", quickS:"셔플·덱 나누기 의식을 건너뛰고 바로 뽑습니다", bigL:"큰 글씨", bigS:"손님과 함께 화면을 볼 때 읽기 쉽게",
  bkH:"백업", bkP:"리딩 기록과 손님 정보는 이 기기에만 저장됩니다. 폰을 바꾸거나 브라우저 데이터를 지우기 전에 백업 파일을 저장하세요.", exp:"백업 저장", imp:"백업 불러오기", bkTitle:"X Tarot 백업",
  exported:"백업 파일을 저장했습니다", imported:(a, b) => `리딩 ${a}개, 손님 ${b}명을 불러왔습니다`, badFile:"X Tarot 백업 파일이 아닙니다. 파일을 확인하세요.",
  clrH:"기록 정리", clrP:"모든 리딩 기록을 지웁니다. 손님 목록은 남습니다.", clrBtn:"기록 전체 삭제", clrConfirm:"한 번 더 누르면 전체 삭제", cleared:"기록을 삭제했습니다",
  infoH:"정보", infoP:"X Tarot v4.0 · theXresearch<br>카드 그림: 1909년 라이더-웨이트-스미스 덱(일러스트 Pamela Colman Smith), 미국 퍼블릭 도메인.<br>시기 판단은 수트·숫자에 따른 전통 타이밍 기법을 따릅니다."
},
en: {
  nav:{read:"Read", cl:"Clients", lib:"Cards", hist:"Journal", tools:"Tools"},
  back:"Back", close:"Close", storageFull:"Storage is full. Back up your journal, then clear older readings.",
  fmtDate:t => { const d = new Date(t), h = d.getHours(), p = n => String(n).padStart(2, "0"); return `${MON_EN[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${h % 12 || 12}:${p(d.getMinutes())} ${h < 12 ? "AM" : "PM"}`; },
  cur:n => `In session · <b>${n}</b>`, endSess:"End session", sessEnded:"Session ended",
  heroSub:"Quiet your mind. Hold your question.", askFirst:"Begin with a question", hqPh:"e.g. Will they come back to me?", find:"Find", enterQ:"Type your question first",
  orTopic:"Or choose a theme", recTag:"Best fit", todayTitle:"Card of the Day", todaySub:c => c ? "Your client's message for today" : "One card, once a day",
  groups:{"기본":"Essentials","주제별":"By Theme","심층":"In Depth","시기":"Timing"}, nCards:n => plural(n, "card"),
  installT:"Install it like an app", installIOS:"In Safari, tap <b>Share</b> → <b>Add to Home Screen</b>", installAnd:"In Chrome, tap <b>⋮</b> → <b>Add to Home screen</b>",
  todayLocked:c => `The Card of the Day is drawn once a day. ${c ? "This client has" : "You've"} already drawn today's card — a new one waits tomorrow.`,
  who:"Reading for", me:"Myself", newCl:"+ New client", clName:"Client name", add:"Add", nameReq:"Enter the client's name", registered:n => `${n} added`,
  persp:"Choose a lens", twoOpt:"Your two options", optA:"Option A (e.g. New job)", optB:"Option B (e.g. Stay)",
  question:"Your question", qHint:"Write your own or choose one below", eg:"e.g. ", common:"Common questions",
  qguide:d => `Open questions — “What happens if…?”, “What do I need to…?” — invite the richest answers. ${d === "year" ? "This reading covers twelve months, starting this month." : d === "week" ? "This reading covers seven days, starting today." : ""}`,
  posN:n => `The positions · ${n}`, shuffle:"Shuffle the cards",
  scount:'Shuffling · <b id="sc">0</b> riffles', shufHint:"Hold your question in mind and shuffle as long as feels right.<br>Let the querent decide when to stop.", stop:"Stop shuffling",
  cutHint:"The deck is cut into three piles.<br>Choose the one you're drawn to.", piles:["Left","Center","Right"], pileAria:i => `Pile ${i}`,
  whoLine:(n, d) => `${n} · ${d}`,
  dup:h => `You asked this exact question about ${h === 1 ? "an hour" : h + " hours"} ago. In tarot, the first draw is the answer — redrawing until you like the result only muddies it.`, prevRes:"View that reading", redo:"Things have changed — read again",
  pickN:n => `Choose ${plural(n, "card")}`, pickMore:n => `Choose ${n} more`, ready:"Ready",
  wheelHint:"Spin the wheel with your finger.<br>Tap the rising card — or any card that calls to you.", fate:"Let fate choose", cardAria:"Card",
  revealHint:"Tap each card to turn it over", flipAll:"Turn all cards",
  revMark:" (Rx)", up:"Upright", rv:"Reversed",
  yearTheme:["The year's theme","The current running through the next twelve months"], monthLbl:(m, y) => [MON_EN[m], `The flow of ${MONTH_EN[m]} ${y}`],
  dayLbl:d => `${DOW_EN[d.getDay()]} ${d.getMonth()+1}/${d.getDate()}`, dayToday:"Today's energy and guidance", dayOther:"The energy and guidance for this day",
  rel:{same:["Reinforcing","Sharing an element, these cards amplify each other."], friend:["Supportive","These elements support each other, so the energy flows naturally."], oppose:["Opposing","These elements pull against each other — tension that needs balancing."], neutral:["Neutral","No major clash; each plays its own role."]},
  tone:[["Very favorable","A strongly positive current. Move forward with confidence."],["Favorable","A positive current. Make the most of the opportunities arriving."],["Mixed","Light and shadow in equal measure. Your choices and attitude will decide the outcome."],["Challenging","There are challenges here, but careful preparation will carry you through."],["Difficult","A season for holding steady. Don't force things — protect your foundation and wait for the right moment."]],
  majorTimeDef:"When conditions have fully ripened — roughly one to three months", courtTime:["Soon, through news or a small beginning","Fast — within two to three weeks","Once things mature, within a few months","Last of all, once the foundation is in place"],
  minorTime:(n, s) => ({wands:`Within about ${plural(n, "day")} to ${plural(n, "week")}`, cups:`Within about ${plural(n, "week")}`, swords:`Within about ${plural(n, "day")}`, pentacles:`In around ${plural(n, "month")}`})[s],
  season:s => ` · in ${({wands:"spring", cups:"summer", swords:"autumn", pentacles:"winter"})[s]}`, revLate:" (reversed — likely later than expected)",
  sens:[
    [/suicid|kill myself|end my life|want to die|don'?t want to live|disappear forever/i, "crisis", "If you're going through something painful right now, please don't carry it alone. In the US, call or text 988; in Korea, call 109. Someone is there, day and night."],
    [/health|illness|\bsick\b|hospital|surgery|cancer|pregnan|diagnos|symptom|medication|treatment/i, "health", "This is a health question. Tarot is a tool for reflection, not a substitute for diagnosis or treatment. If you have symptoms, please see a doctor."],
    [/lawsuit|\bcourt\b|lawyer|attorney|\bsue\b|legal|custody|settlement/i, "legal", "For legal matters, decide with a qualified attorney. The cards can speak to mindset and momentum, nothing more."],
    [/invest|stock|crypto|bitcoin|\bloan\b|mortgage|real estate|buy property|trading/i, "money", "Don't make investment decisions on the cards alone. Weigh the facts and seek professional financial advice."]],
  shadowLead:sh => `In the obstacle position, read this card's shadow: ${sh}`,
  yn:[["Yes","The current is clearly positive. Go ahead."],["Likely yes","It leans positive. Handle the deciding factor well."],["Undecided","Not settled yet — if conditions change, so will the outcome."],["Likely no","It leans negative. Proceed with caution for now."],["No","The way is clearly blocked. Look for another path, or another time."]],
  choiceWin:n => `<b>${n}</b> looks like the brighter path.`, choiceEven:"There's little difference between the two paths. Let the outcome cards — and your own values — decide.",
  oneYear:(c, k) => `The year's theme · ${c} — ${k}`, oneWeek:t => `The week's current · ${t}`, oneConc:(c, k) => `Outcome · ${c} — ${k}`,
  st:{
    single:(nm, main, dom, a) => `${nm} appears. ${main}${dom ? " " + dom : ""} The advice: “${a}”`,
    year:(nm, main) => `The card running through the year ahead is ${nm}. ${main}`, week:(nm, main) => `Today belongs to ${nm}. ${main}`,
    best:l => `The strongest stretch: ${l}.`, worst:l => `Go gently around ${l}.`, noWorst:"No especially difficult period stands out.",
    tl:(pos, c) => `${pos} (${c})`,
    ynAns:(v, d) => `The answer is <b>“${v}.”</b> ${d}`, ynVar:(nm, main) => `The deciding factor is ${nm}. ${main}`, adv:a => `The advice: “${a}”`,
    chNow:(nm, main) => `Right now, ${nm} sets the scene. ${main}`, chPaths:(a, n1, b, n2) => `Choosing “${a}” leads to ${n1}; choosing “${b}” leads to ${n2}.`,
    center:(nm, main) => `At the heart of the situation is ${nm}. ${main}`, obstacle:(nm, main) => `The obstacle is ${nm}. ${main}`,
    cardsAdv:a => `The cards advise: “${a}”`, leads:(nm, main) => `If things continue as they are, the path leads to ${nm}. ${main}`,
    lens:(dom, d) => `${dom === "love" ? "In matters of the heart:" : "In work and money:"} ${d}`
  },
  ansQ:"The answer", ansR:"The reading", score:t => `Energy score ${t} · outcome card weighted ×1.5`, when:"Timing", whenNote:n => `Traditional timing, read from the outcome card (${n})`,
  gauge:["Challenging","Flow","Favorable"],
  choiceCmp:"Comparing the paths", result:"Outcome", secPos:n => `Card by card · ${n}`, secRel:"How the cards relate", secEnergy:"Energy analysis", secCombo:"Notable pairings", secQuint:"Quintessence",
  notesH:"Reading notes", memoPh:"Record the session, the client's reactions, and what actually happened later.", share:"Send results", aiCopy:"Copy for AI deep reading", newR:"New reading", toHist:"Back to journal", toHome:"Home",
  disc:"Tarot is a mirror for reflection, not a fixed prediction. For important decisions, weigh your own judgment and professional advice.",
  copiedAI:"Copied — paste it into Claude", copyFail:"Couldn't copy", sharedCopy:"Results copied. Paste them into a message", shareTitle:"X Tarot reading",
  love:"Love", work:"Work & money", advice:"Advice", calm:"Reassurance", chTag:"Obstacle", hfTag:"Hopes & fears",
  pair:{chStrong:"This obstacle is significant. Work around it rather than meeting it head-on.", chWeak:"The obstacle is modest. Stay aware of it and you'll clear it.",
    f2:"Things improve markedly further along.", f1:"Things gradually get better.", fm2:"Difficulty builds further along — prepare in advance.", fm1:"The energy weakens somewhat.", f0:"The energy holds at a similar level.",
    brighter:p => `“${p}” carries the brighter energy.`, even:"The two positions are evenly matched.", el:r => `Elements: <b>${r}</b>`},
  ene:{elTheme:{fire:"passion, action and work", water:"emotion, relationships and the heart", air:"thought, communication and decisions", earth:"money, practical matters and health"},
    dom:(e, t) => `<b>${e}</b> dominates. At the heart of this question: <b>${t}</b>.`, miss:(e, l) => `<b>${e}</b> is absent. ${l}`,
    majMany:n => `${n} Major Arcana: forces larger than personal effort are at work — a genuine turning point.`, majNone:"No Major Arcana: this is less about fate and more about everyday choices you can change.",
    majSome:n => `${plural(n, "Major Arcana card")} — fate and everyday choice are working together.`, revMany:n => `${n} reversed cards: delay, inner resistance and a need to re-examine. Review before you rush.`,
    allUp:"Every card is upright: the energy is flowing freely.", courts:n => `${n} court cards: other people and their influence weigh heavily on the outcome.`,
    rank:(k, v, t) => `${["Aces","Twos","Threes","Fours","Fives","Sixes","Sevens","Eights","Nines","Tens","Pages","Knights","Queens","Kings"][k - 1]} ×${v} — ${t}`,
    avg:(m, i) => `The minor cards average ${m}. ${["Things are still at an <b>early stage</b>.","Things are <b>well underway</b>.","Things are entering the <b>final stage</b>."][i]}`},
  quintNote:"Add the numbers of every card and reduce to a Major Arcana: this card distills the core message of the whole reading.", quintIn:" It already appears in the spread, so its message carries extra weight.",
  fixFlow:"To turn this around: ", obsLbl:"Navigating the obstacle", obsTxt:sh => `Watch for ${sh.charAt(0).toLowerCase() + sh.slice(1)}.`, quintLbl:"Quintessence", adviceH:"Guidance",
  sh:{head:d => `[X Tarot Reading] ${d}`, spread:"Spread", q:"Question", ans:"■ Answer", when:"■ Timing", cards:"■ Cards", adv:"■ Guidance", foot:"※ Tarot is a mirror for reflection, not a fixed prediction."},
  ai:(q, opt, spread, n, dom, lines) => `You are a professional tarot reader with twenty-five years of experience. Interpret the reading below as you would for a client sitting across from you.

Question: ${q || "(No question — a general reading)"}
${opt}Spread: ${spread} (${n} cards, theme: ${dom})
Deck: Rider–Waite–Smith

${lines}

Please write your answer in English, in this order:
1) The core answer to the question (one paragraph)
2) Position by position (connect each card to the meaning of its position; read obstacle positions through the card's shadow)
3) How the cards relate (elemental dignities, the balance of Major and Minor Arcana, repeating numbers or suits)
4) Likely timing
5) Three concrete, actionable pieces of advice
For cards that can frighten a client — Death, the Tower and the like — explain their symbolic meaning first so nothing is misunderstood.`,
  aiDom:{love:"love & relationships", work:"work & money", yesno:"yes or no", general:"general"}, aiOpt:(a, b) => `Options: A = ${a}, B = ${b}\n`, aiCh:" / obstacle position",
  v:{major:r => `Major Arcana ${r}`, el:e => `Element: ${e}`, astro:a => `Astrology: ${a}`, num:n => `Number ${n}`, sub:c => c.arcana === "major" ? `Major Arcana · ${c.roman}` : `${SUITS[c.suit].ko} · Minor Arcana`,
    inPos:"In this position", chS:" · obstacle", hfS:" · hopes & fears", zoom:"View the artwork only", calmH:"A gentle note", posH:p => `Position — ${p}`, img:"Imagery",
    upH:k => `Upright · ${k}`, rvH:k => `Reversed · ${k}`, loveH:"Love", workH:"Work & money", upP:"Upright: ", rvP:"Reversed: ", shH:"Shadow (in an obstacle position)", advH:"Advice", whenH:"Timing",
    prev:"‹ Previous", next:"Next ›"},
  memo:"Note", noQ:"No question", more:n => ` +${n} more`, statR:"Readings", statC:"Cards drawn", statE:"Leading element", freq:"Most frequent cards", times:k => `×${k}`,
  histT:"Reading Journal", histPh:"Search questions, clients, cards, notes", histF:["All","Mine","Clients"], recent:"Recent readings", histEmpty:"No readings yet.<br>Each reading is saved here automatically.",
  birth:{both:"Personality & Soul card", pers:"Personality card", soul:"Soul card", mid:"Middle card", year:y => `Year card · ${y}`},
  clT:"Clients", addCl:"+ Add a client", nameL:"Name", namePh:"Client name (required)", bdL:"Date of birth (optional)", memoL:"Notes (optional)", memoPh2:"Interests, recurring themes…",
  saveStart:"Save & begin session", cancel:"Cancel", clSearch:"Search clients", privacy:"Client details stay on this device and are never sent anywhere. Back them up from Tools.",
  sessCnt:(n, d) => `${plural(n, "session")} · last ${d}`, noSess:"No sessions yet", inSess:"In session", noMatch:"No matches", noCl:"No clients yet.<br>Add a client to keep a separate history for each person.",
  sessStart:n => `Session with ${n} started`, clTitle:n => n, contSess:"Continue session", startSess:"Begin a session", delCl:"Delete client", delConfirm:"Tap again to delete",
  deleted:"Client deleted (their readings are kept)", bdL2:"Date of birth", memoL2:"Notes", sessions:n => `Sessions · ${n}`, noSessYet:"No sessions yet",
  libT:"The Deck", libPh:"Search by name or keyword (e.g. love, money)", libF:["All","Major","Wands","Cups","Swords","Pentacles"],
  toolsT:"Tools", birthH:"My Birth Cards", birthP:"Add the digits of your birth date and reduce them to the Major Arcana: the cards of your lifelong personality and soul lesson, plus this year's theme. For a client, enter their birth date under Clients.",
  setH:"Settings", langL:"Language · 언어", langS:"Display language", revL:"Use reversed cards", revS:"When off, every card is drawn upright", quickL:"Quick mode", quickS:"Skip the shuffle and cut rituals and draw at once", bigL:"Large text", bigS:"Easier to read when sharing the screen with a client",
  bkH:"Backup", bkP:"Your journal and client details live only on this device. Save a backup before changing phones or clearing browser data.", exp:"Save backup", imp:"Restore backup", bkTitle:"X Tarot backup",
  exported:"Backup saved", imported:(a, b) => `Restored ${plural(a, "reading")} and ${plural(b, "client")}`, badFile:"That isn't an X Tarot backup file. Please check the file.",
  clrH:"Clear journal", clrP:"Deletes every reading. Your client list is kept.", clrBtn:"Delete all readings", clrConfirm:"Tap again to delete everything", cleared:"Journal cleared",
  infoH:"About", infoP:"X Tarot v4.0 · theXresearch<br>Artwork: the 1909 Rider–Waite–Smith deck, illustrated by Pamela Colman Smith — public domain in the United States.<br>Timing follows traditional suit-and-number methods."
}
};
const S = STR[LANG];

// Apply the English edition to the shared data before the app starts
if (LANG === "en"){
  DECK.forEach(c => { const e = CARD_EN[c.id];
    Object.assign(c, {name:c.en, up:e[0], rev:e[1], d:e[2], u:e[3], r:e[4], l:e[5], w:e[6], a:e[7], sh:e[8], lr:e[9], wr:e[10]});
    if (c.arcana === "major") c.astro = e[11]; });
  Object.entries(EN_GLOBALS.suits).forEach(([k, v]) => { SUITS[k].ko = v[0]; SUITS[k].theme = v[1]; });
  Object.entries(EN_GLOBALS.elements).forEach(([k, v]) => { ELEMENTS[k].ko = v[0]; ELEMENTS[k].lack = v[1]; });
  RANKS.forEach(r => { r[0] = r[1]; });
  RANK_MEAN.splice(0, RANK_MEAN.length, ...EN_GLOBALS.rankMean);
  RANK_REPEAT.splice(0, RANK_REPEAT.length, ...EN_GLOBALS.rankRepeat);
  COMBOS.forEach((c, i) => { c[2] = EN_GLOBALS.combos[i]; });
  Object.keys(CALM).forEach(k => { CALM[k] = EN_GLOBALS.calm[k]; });
  Object.keys(MAJOR_TIME).forEach(k => delete MAJOR_TIME[k]); Object.assign(MAJOR_TIME, EN_GLOBALS.majorTime);
  Object.entries(SPREADS_EN).forEach(([k, v]) => { const sp = SPREADS[k];
    ["title","desc","pos","tips","pairs","icon"].forEach(f => { if (v[f]) sp[f] = v[f]; });
    if (v.variants) v.variants.forEach((x, i) => { sp.variants[i].name = x.name; sp.variants[i].pos = x.pos; }); });
  TOPICS.splice(0, TOPICS.length, ...TOPICS_EN);
  Object.keys(QUESTIONS).forEach(k => delete QUESTIONS[k]); Object.assign(QUESTIONS, QUESTIONS_EN);
  Object.keys(CHOICE_AB).forEach(k => delete CHOICE_AB[k]); Object.assign(CHOICE_AB, CHOICE_AB_EN);
  QUESTION_ROUTES.splice(0, QUESTION_ROUTES.length, ...ROUTES_EN);
  ROUTE_FALLBACK.splice(0, ROUTE_FALLBACK.length, ...ROUTE_FALLBACK_EN);
  document.title = "X Tarot";
}
