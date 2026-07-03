const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const FX = 300; // RM → KRW approximate

const KO_A_SOURCE = path.join(PUBLIC, 'index-en.html');
const KO_B_SOURCE = path.join(PUBLIC, 'index.html');
const KO_A_OUT = path.join(PUBLIC, 'index-ko-a.html');
const KO_B_OUT = path.join(PUBLIC, 'index-ko-b.html');

const SHARED_REPLACEMENTS = [
  ['<html lang="en">', '<html lang="ko">'],
  ['const SEED_FUND = 50;', 'const SEED_FUND = 20000;'],
  ['const DEFAULT_WAGE = 8.72;', 'const DEFAULT_WAGE = 10320;'],
  ['const RM_PER_USD = 4.47;', 'const KRW_PER_USD = 1350;'],
  ['function fmtRM(value)', 'function fmtKRW(value)'],
  ['return `RM ${Math.round(value).toLocaleString(\'en-MY\')}`;', 'return `₩${Math.round(value).toLocaleString(\'ko-KR\')}`;'],
  ['function balanceToUsd(balanceRM)', 'function balanceToUsd(balanceKRW)'],
  ['return balanceRM / RM_PER_USD;', 'return balanceKRW / KRW_PER_USD;'],
  ['function getInvestmentRate(balanceRM)', 'function getInvestmentRate(balanceKRW)'],
  ['const usd = balanceToUsd(balanceRM);', 'const usd = balanceToUsd(balanceKRW);'],
  ['function getTierInfo(balanceRM)', 'function getTierInfo(balanceKRW)'],
  ['RM_PER_USD,', 'KRW_PER_USD,'],
  ['fmtRM,', 'fmtKRW,'],
  ['F.fmtRM', 'F.fmtKRW'],
  ["new Intl.NumberFormat('en-MY'", "new Intl.NumberFormat('ko-KR'"],
  [".toLocaleString('en-MY')", ".toLocaleString('ko-KR')"],
  ['price: 2000,', 'price: 600000,'],
  ['amount: 150,', 'amount: 45000,'],
  ['wage: 10,', 'wage: 10320,'],
  ['targetAmount: 2000,', 'targetAmount: 600000,'],
  ['depositAmount: 150,', 'depositAmount: 45000,'],
  ['commitPriceInput(fallback = 2000)', 'commitPriceInput(fallback = 600000)'],
  ['commitAmountInput(fallback = 150)', 'commitAmountInput(fallback = 45000)'],
  ['commitWageInput(fallback = 10)', 'commitWageInput(fallback = 10320)'],
  ["parseRmField('amountInput', 2000)", "parseRmField('amountInput', 600000)"],
  ["parseRmField('depositInput', 150)", "parseRmField('depositInput', 45000)"],
  ['wage: state.wage || 10,', 'wage: state.wage || 10320,'],
  ['Math.max(10, Math.round(num))', 'Math.max(1000, Math.round(num))'],
  ['if (amount >= 500) return 50;', 'if (amount >= 500000) return 50000;'],
  ['if (amount >= 100) return 25;', 'if (amount >= 100000) return 25000;'],
  ['return 10;', 'return 10000;'],
  ['if (monthlyBudget < 30) return', 'if (monthlyBudget < 9000) return'],
  ['if (monthlyBudget < 80) return', 'if (monthlyBudget < 24000) return'],
  ['if (monthlyBudget < 250) return', 'if (monthlyBudget < 75000) return'],
  ['value="2000"', 'value="600000"'],
  ['value="150"', 'value="45000"'],
  ['value="10"', 'value="10320"'],
  ['<span>RM</span>', '<span>₩</span>'],
  ['<span class="route-save-currency">RM</span>', '<span class="route-save-currency">₩</span>'],
  ['placeholder="RM 2,000"', 'placeholder="₩600,000"'],
  ['placeholder="RM 150 / month"', 'placeholder="₩45,000 / 월"'],
  ['placeholder="RM 150 / mo"', 'placeholder="₩45,000 / 월"'],
  ['RM 2,000', '₩600,000'],
  ['RM 760', '₩228,000'],
  ['RM 1,240', '₩372,000'],
  ['RM 50', '₩20,000'],
  ['RM 150', '₩45,000'],
  ['RM50', '₩20,000'],
  ['Malaysia', '한국'],
  ['malaysia', 'korea'],
  ["item: 'WishItem'", "item: '위시템'"],
  ["itemName || 'WishItem'", "itemName || '위시템'"],
  ["item || 'WishItem'", "item || '위시템'"],
  ["'WishItem'", "'위시템'"],
  ['brand: \'WishRace\'', "brand: 'WishRace', locale: 'ko'"],
  // CYCLES labelKo
  ["labelKo: 'Daily'", "labelKo: '매일'"],
  ["labelKo: 'Weekly'", "labelKo: '매주'"],
  ["labelKo: '2×/week'", "labelKo: '주 2회'"],
  ["labelKo: 'Monthly'", "labelKo: '매월'"],
  // Cycle display helper injection point
  ['const fmt = new Intl.NumberFormat', `const CYCLE_LABEL_KO = {
    'Daily': '매일',
    '3×/week': '주 3회',
    '2×/week': '주 2회',
    'Weekly': '매주',
    'Monthly': '매월',
  };
  function cycleLabelKo(cycle) { return CYCLE_LABEL_KO[cycle] || cycle; }

  const fmt = new Intl.NumberFormat`],
  ['if (cycleBtn) cycleBtn.textContent = state.cycle;', 'if (cycleBtn) cycleBtn.textContent = cycleLabelKo(state.cycle);'],
  ['.map((cycle) => `<button type="button" data-cycle="${cycle}">${cycle}</button>`)', '.map((cycle) => `<button type="button" data-cycle="${cycle}">${cycleLabelKo(cycle)}</button>`)'],
  ['if ($(\'routeCycleBtn\')) $(\'routeCycleBtn\').textContent = state.cycle;', 'if ($(\'routeCycleBtn\')) $(\'routeCycleBtn\').textContent = cycleLabelKo(state.cycle);'],
];

const TEXT_REPLACEMENTS = [
  // Input screen
  ['⚡ No signup · No payment · 10-sec result', '⚡ 가입 없음 · 결제 없음 · 10초면 바로 확인'],
  ['How long until you can buy it?', '내 위시템, 언제쯤 손에 넣을 수 있을까?'],
  ["Pick a popular wish or type your own. We'll show your normal saving date and a faster route.", '사고 싶은 위시템을 고르거나 직접 입력해 보세요. 일반 저축보다 목표를 앞당길 수 있는 최적의 플랜을 찾아드려요.'],
  ['1. What do you want?', '1. 사고 싶은 위시템'],
  ['placeholder="e.g. iPhone, concert ticket, Bangkok trip"', 'placeholder="예: 아이폰, 콘서트 티켓, 항공권"'],
  ['aria-label="Popular wish examples"', 'aria-label="인기 위시템 예시"'],
  ['data-item="iPhone 15" data-amount="4399" data-deposit="200"', 'data-item="아이폰 15" data-amount="1300000" data-deposit="60000"'],
  ['📱 iPhone', '📱 아이폰'],
  ['data-item="Concert ticket" data-amount="600" data-deposit="80"', 'data-item="콘서트 티켓" data-amount="180000" data-deposit="24000"'],
  ['🎤 Concert', '🎤 콘서트'],
  ['data-item="Bangkok trip" data-amount="1500" data-deposit="150"', 'data-item="항공권" data-amount="450000" data-deposit="45000"'],
  ['✈️ Bangkok trip', '✈️ 항공권'],
  ['data-item="Laptop" data-amount="3200" data-deposit="200"', 'data-item="노트북" data-amount="1000000" data-deposit="60000"'],
  ['💻 Laptop', '💻 노트북'],
  ['data-item="PS5" data-amount="2499" data-deposit="150"', 'data-item="PS5" data-amount="750000" data-deposit="45000"'],
  ['data-item="Motorcycle deposit" data-amount="1000" data-deposit="120"', 'data-item="차량 계약금" data-amount="300000" data-deposit="36000"'],
  ['🏍️ Motor deposit', '🏍️ 차량 계약금'],
  ['✏️ Enter here', '✏️ 직접 입력'],
  ['2. Price', '2. 가격'],
  ['3. I can save', '3. 저축 가능 금액'],
  ['Use RM. You can change the numbers anytime.', '원화(₩) 기준입니다. 숫자는 언제든 바꿀 수 있어요.'],
  ['Example result', '예시 결과'],
  ['<strong id="previewItemName">Your wish</strong>', '<strong id="previewItemName">내 위시템</strong>'],
  ['<small>Normal saving</small>', '<small>일반 저축 (시중은행 평균)</small>'],
  ['<small>Faster route</small>', '<small>빠른 경로</small>'],
  ['Target timeline', '목표 기간'],
  ['data-months="3">3 months</button>', 'data-months="3">3개월</button>'],
  ['data-months="6">6 months</button>', 'data-months="6">6개월</button>'],
  ['data-months="12">1 year</button>', 'data-months="12">1년</button>'],
  ['data-months="60">Someday</button>', 'data-months="60">언젠가</button>'],
  ['This is a simple calculator preview. No bank login, no card, no payment required.', '간단한 계산기 미리보기입니다. 은행 로그인, 카드, 결제가 필요하지 않아요.'],
  ['Scroll for more', '아래로 스크롤'],
  ['See My Result', '내 결과 보기'],
  // Loading
  ['Calculating Wish D-Day', '위시템 D-Day 계산 중'],
  ['aria-label="Loading progress"', 'aria-label="로딩 진행률"'],
  ['Crunching your arrival date...', '도착 예정일을 계산하고 있어요...'],
  ['Analysing your saving speed', '저축 속도를 분석 중'],
  ['Checking your savings pace', '저축 속도를 확인 중'],
  // Results - common
  ['✨ WishRace Challenge', '✨ 위시레이스 챌린지'],
  ['Your WishItem plan is ready!', '위시템 플랜이 준비됐어!'],
  ["Let's map out how you reach your WishItem based on your goal", '목표를 기준으로 위시템에 도달하는 방법을 계산했어'],
  ['<small>My WishItem</small>', '<small>내 위시템</small>'],
  ['<small>My wish item</small>', '<small>내 위시템</small>'],
  ['aria-label="WishItem price"', 'aria-label="위시템 가격"'],
  ['aria-label="Wish item price"', 'aria-label="위시템 가격"'],
  ['<small>Target timeline</small>', '<small>목표 기간</small>'],
  ['<small>Days to goal</small>', '<small>목표까지 일수</small>'],
  ['365 days', '365일'],
  ['aria-label="Target timeline"', 'aria-label="목표 기간"'],
  ['aria-label="Days to reach goal"', 'aria-label="목표까지 일수"'],
  ['<span class="route-view-copy">days</span>', '<span class="route-view-copy">일</span>'],
  ['Buy your iPad 26 hrs sooner than regular saving!', '일반 저축보다 iPad를 26시간 더 빨리!'],
  ['Goal progress chart', '목표 진행 차트'],
  ['<span><i class="route-dot"></i>Regular saving 🏦</span>', '<span><i class="route-dot"></i>일반 저축 (시중은행 평균) 🏦</span>'],
  ['<span><i class="route-dot orange"></i>WishBooster invest sim 🚀 (current goal)</span>', '<span><i class="route-dot orange"></i>위시 부스터 🚀 (현재 목표)</span>'],
  ['aria-label="Calculation assumptions"', 'aria-label="계산 가정"'],
  ['aria-label="How we calculate"', 'aria-label="계산 방식"'],
  ['Assumptions: regular saving 3% p.a.; WishBooster 1.6% monthly compound on principal balance (20.98% p.a.)', '기준: 일반 저축 연 3%, 위시부스터는 원금 잔액에 월 1.6% 복리 (연 20.98%)'],
  ['Basis: regular savings at 3% p.a.; WishBooster at 1.6% monthly compound on balance (~20.98% p.a.)', '기준: 일반 저축 연 3%, 위시부스터는 잔액에 월 1.6% 복리 (연 ~20.98%)'],
  ['Tap chart for details', '그래프 선을 터치해 보세요'],
  ['aria-label="Goal progress chart"', 'aria-label="목표 진행 차트"'],
  ['aria-label="Chart settings"', 'aria-label="차트 설정"'],
  ['<span class="route-save-lead">I want to save</span>', '<span class="route-save-lead">저축 금액</span>'],
  ['💡 Tweak the amount to reach your goal faster!', '💡 금액을 조절해 목표에 더 빨리 도달하세요!'],
  ['aria-label="Decrease savings amount"', 'aria-label="저축 금액 줄이기"'],
  ['aria-label="Weekly savings amount"', 'aria-label="저축 금액"'],
  ['aria-label="Increase savings amount"', 'aria-label="저축 금액 늘리기"'],
  ['id="routeCycleBtn" type="button">Weekly</button>', 'id="routeCycleBtn" type="button">매주</button>'],
  ['*Saving RM 150/mo equals about 17 hrs of hustle at your hourly rate.', '*월 ₩45,000 저축은 시급 기준 약 17시간 분량이에요.'],
  ['My hourly rate RM', '내 시급 ₩'],
  ['aria-label="Hourly rate"', 'aria-label="시급"'],
  ['· hustle saved calc', '· 노동 시간 환산'],
  ['Show chart for next', '차트 표시 기간'],
  ['Show up to', '차트 표시 기간'],
  ['aria-label="Chart display period"', 'aria-label="차트 표시 기간"'],
  ['aria-label="Chart time range"', 'aria-label="차트 표시 기간"'],
  ['aria-label="Increase years"', 'aria-label="기간 늘리기"'],
  ['aria-label="Decrease years"', 'aria-label="기간 줄이기"'],
  ['<span class="route-view-copy">years</span>', '<span class="route-view-copy">년</span>'],
  ['<span class="route-view-copy">years ahead</span>', '<span class="route-view-copy">년</span>'],
  ['Goal hit chance --%', '목표 달성 확률 --%'],
  ['Keep this up — you\'re almost there!', '이 속도면 거의 다 왔어요!'],
  ['Recommended race (fastest!)', '추천 레이스 (가장 빠름!)'],
  ['Try saving RM 150/mo', '월 ₩45,000 저축 추천'],
  ['More race results', '추가 레이스 결과'],
  ['WishItem goal', '위시템 목표'],
  ['WishBooster saves you 1.1 days of hustle!', '위시부스터로 1.1일 분 노동을 절약!'],
  ['WishBooster is an investment-based feature.', '위시부스터는 투자 기반 기능이에요.'],
  ['Based on an 8-hr workday earned via investment gains', '투자 수익으로 8시간 근무일을 벌었다는 가정'],
  ['Goal amount', '목표 금액'],
  ['Time saved', '절약 시간'],
  ['Hustle saved', '노동 절약'],
  ['View calculation assumptions', '계산 가정 보기'],
  ['Base hourly rate RM', '기준 시급 ₩'],
  ['This will be managed automatically after official launch.', '정식 출시 후 자동으로 관리됩니다.'],
  ['These results are simulations — not guaranteed returns or investment advice. Actual outcomes may vary with market conditions.', '본 결과는 시뮬레이션으로, 수익을 보장하거나 투자 조언이 아닙니다. 실제 결과는 시장 상황에 따라 달라질 수 있어요.'],
  // Contact
  ['Join early access &<br>lock in up to RM 50', '얼리 액세스 신청하고<br>최대 ₩20,000 선점하기'],
  ['Drop your email to save your results and get notified to claim your RM 50 launch bonus when we launch.', '이메일을 남기면 결과를 저장하고 출시 시 ₩20,000 런칭 보너스를 받을 수 있어요.'],
  ['Drop your email to save your results and get notified to claim your RM 50 launch boost when we launch.', '이메일을 남기면 결과를 저장하고 출시 시 ₩20,000 런칭 부스트를 받을 수 있어요.'],
  ['Email', '이메일'],
  ['placeholder="example@email.com"', 'placeholder="example@email.com"'],
  ['Your info is only used for launch alerts and early-access perks — kept safe, always.', '입력 정보는 출시 알림과 얼리 액세스 혜택에만 사용되며 안전하게 보관됩니다.'],
  ['Your info is only used for launch alerts and early-access rewards — kept safe, never spammed.', '입력 정보는 출시 알림과 얼리 액세스 혜택에만 사용되며 안전하게 보관됩니다.'],
  ['⚠️ The RM 50 bonus can only be withdrawn after you complete your WishItem challenge.', '⚠️ ₩20,000 보너스는 위시템 챌린지 완료 후에만 출금할 수 있어요.'],
  ['⚠️ The RM 50 boost can only be withdrawn after you complete the WishRace challenge.', '⚠️ ₩20,000 부스트는 위시레이스 챌린지 완료 후에만 출금할 수 있어요.'],
  ['Save results & get notified', '결과 저장하고 알림 받기'],
  // Complete
  ["You're on the list!", '사전 등록 완료!'],
  ["We'll email you the moment we launch. Checked your WishItem race? Share the challenge — let your friends see how long their wish takes!", '출시 즉시 이메일로 알려드릴게요. 내 위시템 레이스를 확인했다면 친구들에게 챌린지를 공유해 보세요!'],
  ["We'll email you the moment we launch. Checked your WishRace? Share the challenge — let your friends see how long their wish takes too!", '출시 즉시 이메일로 알려드릴게요. 위시레이스를 확인했다면 친구들에게 챌린지를 공유해 보세요!'],
  ['🔗 Share the challenge with friends', '🔗 친구에게 챌린지 공유하기'],
  // Dashboard
  ['piggy bank', '저금통'],
  ['Saved so far', '현재 모은 금액'],
  ['Left to go', '남은 금액'],
  ['To go', '남은 금액'],
  ['Race bonus', '레이스 보너스'],
  ['Race boost', '레이스 부스트'],
  ['Up to RM 50', '최대 ₩20,000'],
  ['WishRace Challenge in progress!', '위시레이스 챌린지 진행 중!'],
  ['WishRace challenge in progress!', '위시레이스 챌린지 진행 중!'],
  ['🎉 Preview goal reached', '🎉 목표 달성 미리보기'],
  // s8
  ['WishItem unlocked!', '위시템 달성!'],
  ["You've saved <span id=\"s8GoalAmt\">RM 2,000</span> — goal complete!", '<span id="s8GoalAmt">₩600,000</span>을 모두 모았습니다!'],
  ["You've saved <span id=\"s8GoalAmt\">RM 2,000</span>!", '<span id="s8GoalAmt">₩600,000</span>을 모두 모았습니다!'],
  ['🛍 Buy <span id="s8ItemName">iPad</span>', '🛍 <span id="s8ItemName">iPad</span> 구매하기'],
  ['Flex to friends', '친구에게 자랑하기'],
  ['Challenge text copied! Share it with your friends 🔗', '챌린지 문구가 복사됐어요! 친구들에게 공유해 보세요 🔗'],
  // B variant compare bar
  ['<small>Regular savings 🏦</small>', '<small>일반 저축 (시중은행 평균) 🏦</small>'],
  ['<small>With investing 🚀</small>', '<small>위시 부스터 🚀</small>'],
  // Recommend modal
  ['How should I save?', '어떻게 저축할까요?'],
  ['aria-label="Close recommendation popup"', 'aria-label="추천 팝업 닫기"'],
  ['aria-label="Close recommendations"', 'aria-label="추천 닫기"'],
  ['Save little & often', '소액·자주 저축'],
  ['Split your monthly budget into a comfy rhythm.', '월 예산을 편한 리듬으로 나눠 저축해요.'],
  ['Split your monthly budget into a rhythm that feels easy.', '월 예산을 편한 리듬으로 나눠 저축해요.'],
  ['One big deposit', '한 번에 크게 저축'],
  ['Drop a bigger lump sum at the start of each month to hit your timeline.', '매월 초에 큰 금액을 넣어 목표 기간에 맞춰요.'],
  ['Save big in one go', '한 번에 크게 저축'],
  ['Put a lump sum in at the start of each month to hit your timeline.', '매월 초에 큰 금액을 넣어 목표 기간에 맞춰요.'],
  ['Pick whichever feels easier for you.', '편한 방식을 골라보세요.'],
  ['Pick whichever style feels easier for you.', '편한 방식을 골라보세요.'],
  ['<span id="goalChartItemName">WishItem</span>', '<span id="goalChartItemName">위시템</span>'],
  ['<div class="mini-stat-val" id="miniSaved">30 days</div>', '<div class="mini-stat-val" id="miniSaved">30일</div>'],
  ['<div class="mini-stat-val accent" id="miniLabor">1.1 days</div>', '<div class="mini-stat-val accent" id="miniLabor">1.1일</div>'],
  ['Calculating your Wish D-Day', '위시템 D-Day 계산 중'],
  ['Buy it</button>', '구매하기</button>'],
  ['Apply', '적용'],
];

const A_ONLY = [
  ['<!-- WishRace design share — single offline HTML', '<!-- KR work copy (A안): cloned from index-en.html (Malaysia A) — 한국 배포용 수정본 -->\n<!-- WishRace design share — single offline HTML'],
  ['<title>WishRace — Get what you want, faster</title>', '<title>위시레이스 — 원하는 걸 더 빨리</title>'],
  ['WishBooster is landing in Malaysia soon.', '위시부스터가 곧 한국에 상륙해요.'],
  ['Claim up to RM 50 race bonus', '레이스 보너스 최대 ₩20,000 받기'],
  ['<p class="result-hero-big" id="resultHeroBig">WishBooster saves you 1.1 days of hustle!</p>', '<p class="result-hero-big" id="resultHeroBig">위시부스터로 1.1일 분 노동을 절약!</p>'],
];

const B_ONLY = [
  ['<!-- WishRace B (control) — minimized result screen vs A -->', '<!-- KR work copy (B안): cloned from index.html (Malaysia B) — 한국 배포용 수정본 -->\n<!-- WishRace B (control) — minimized result screen vs A -->'],
  ['<title>WishRace B — Get what you want, faster</title>', '<title>위시레이스 B — 원하는 걸 더 빨리</title>'],
  ['WishRace is landing in Malaysia soon.', '위시레이스가 곧 한국에 상륙해요.'],
  ['Claim up to RM 50 race boost', '레이스 부스트 최대 ₩20,000 받기'],
];

const JS_STRING_REPLACEMENTS = [
  ["'Analysing your saving speed'", "'저축 속도를 분석 중'"],
  ["'Calculating your WishItem finish line'", "'위시템 도착일을 계산 중'"],
  ["'Finding a faster route'", "'더 빠른 경로를 찾는 중'"],
  ["'Calculating hustle hours saved'", "'노동 절약 시간을 계산 중'"],
  ["'Your hustle savings are in!'", "'노동 절약 결과가 나왔어요!'"],
  ["return m ? `Arrives in ${m} mo` : 'Not reached'", "return m ? `${m}개월 후 도착` : '도달 불가'"],
  ["preview.normalMonths + ' mo'", "preview.normalMonths + '개월'"],
  ["preview.fasterMonths + ' mo'", "preview.fasterMonths + '개월'"],
  ["const item = $('itemInput')?.value.trim() || 'Your wish'", "const item = $('itemInput')?.value.trim() || '내 위시템'"],
  ["title: 'One big deposit'", "title: '한 번에 크게 저축'"],
  ["title: 'Save little & often'", "title: '소액·자주 저축'"],
  ["`To hit ${fmt.format(days)} days, drop RM ${formatPerCycle(perCycleAmount)} at the start of each month — fastest way.`", "`${fmt.format(days)}일 안에 달성하려면 매월 초 ₩${formatPerCycle(perCycleAmount)}을 넣는 게 가장 빨라요.`"],
  ["`To hit your timeline in ${fmt.format(days)} days, drop RM ${formatPerCycle(perCycleAmount)} at the start of each month — fastest way.`", "`${fmt.format(days)}일 안에 달성하려면 매월 초 ₩${formatPerCycle(perCycleAmount)}을 넣는 게 가장 빨라요.`"],
  ["`Saving RM ${fmt.format(monthlyBudget)}/mo split as ${cycle} gets you there in ~${fmt.format(days)} days.`", "`월 ₩${fmt.format(monthlyBudget)}을 ${cycleLabelKo(cycle)}로 나누면 약 ${fmt.format(days)}일 안에 도달해요.`"],
  ["`Saving RM ${fmt.format(monthlyBudget)}/month split ${cycle} gets you there in ~${fmt.format(days)} days.`", "`월 ₩${fmt.format(monthlyBudget)}을 ${cycleLabelKo(cycle)}로 나누면 약 ${fmt.format(days)}일 안에 도달해요.`"],
  ["`At RM ${fmt.format(monthlyBudget)}/mo, reaching your goal within 30 years is unlikely.`", "`월 ₩${fmt.format(monthlyBudget)}으로는 30년 안에 목표 달성이 어려워요.`"],
  ["`At RM ${fmt.format(monthlyBudget)}/month, hitting your goal within 30 years is tough.`", "`월 ₩${fmt.format(monthlyBudget)}으로는 30년 안에 목표 달성이 어려워요.`"],
  ["`${fmt.format(state.targetDays)} days`", "`${fmt.format(state.targetDays)}일`"],
  ["`${Math.max(1, Math.round(days))} days`", "`${Math.max(1, Math.round(days))}일`"],
  ["`${laborHours} hrs sooner than regular saving — ${item} unlocked!`", "`일반 저축보다 ${laborHours}시간 더 빨리 — ${item} 달성!`"],
  ["`Reach your ${item} goal faster with WishBooster!`", "`위시부스터로 ${item} 목표에 더 빨리 도달하세요!`"],
  ["'🎉 Got it!'", "'🎉 달성!'"],
  ["`*Saving RM ${Math.round(monthlyBudget).toLocaleString('en-MY')}/mo equals about ${depositLaborHours} hrs of hustle at your hourly rate.`", "`*월 ₩${Math.round(monthlyBudget).toLocaleString('ko-KR')} 저축은 시급 기준 약 ${depositLaborHours}시간 분량이에요.`"],
  ["`*Saving RM ${Math.round(monthlyBudget).toLocaleString('en-MY')}/month equals ${depositLaborHours} hrs of work at your hourly rate.`", "`*월 ₩${Math.round(monthlyBudget).toLocaleString('ko-KR')} 저축은 시급 기준 약 ${depositLaborHours}시간 분량이에요.`"],
  ["? `WishBooster saves you ${laborDays} days of hustle!`", "? `위시부스터로 ${laborDays}일 분 노동을 절약!`"],
  [": 'Save hustle hours with WishBooster!'", ": '위시부스터로 노동 시간을 절약하세요!'"],
  ["? `WishBooster means ${laborDays} fewer days of grinding!`", "? `위시부스터로 ${laborDays}일 분 노동을 절약!`"],
  [": 'Use WishBooster to save work hours!'", ": '위시부스터로 노동 시간을 절약하세요!'"],
  ["{ label: 'Regular saving', kind: 'saving'", "{ label: '일반 저축 (시중은행 평균)', kind: 'saving'"],
  ["{ label: 'WishBooster', kind: 'wish'", "{ label: '위시 부스터', kind: 'wish'"],
  ["nearest.kind === 'saving' ? 'Saving baseline' : `RM ${fmt.format(diff)} more than saving`", "nearest.kind === 'saving' ? '저축 기준' : `저축보다 ₩${fmt.format(diff)} 더`"],
  ["`Goal hit chance ${chance}%`", "`목표 달성 확률 ${chance}%`"],
  ["`${chance}% chance to hit goal`", "`목표 달성 확률 ${chance}%`"],
  ["`Try saving RM ${fmt.format(cardRecommendation.monthlyBudget)}/mo`", "`월 ₩${fmt.format(cardRecommendation.monthlyBudget)} 저축 추천`"],
  ["`Try saving RM ${fmt.format(cardRecommendation.monthlyBudget)}/month`", "`월 ₩${fmt.format(cardRecommendation.monthlyBudget)} 저축 추천`"],
  ['🎯 Goal · RM ${fmt.format(goal)}', '🎯 목표 · ₩${fmt.format(goal)}'],
  ["`<span><i class=\"route-dot\"></i>Regular saving 🏦</span>`", "`<span><i class=\"route-dot\"></i>일반 저축 (시중은행 평균) 🏦</span>`"],
  ["`<span><i class=\"route-dot orange\"></i>WishBooster invest sim 🚀 (current goal)</span>`", "`<span><i class=\"route-dot orange\"></i>위시 부스터 🚀 (현재 목표)</span>`"],
  ["${state.extraRoutes.length ? '<span><i class=\"route-dot blue\"></i>Extra race ⚡ (custom)</span>' : ''}", "${state.extraRoutes.length ? '<span><i class=\"route-dot blue\"></i>추가 레이스 ⚡ (맞춤)</span>' : ''}"],
  ["return { unit: 'day', aria: 'Daily savings amount' }", "return { unit: '일', aria: '일일 저축 금액' }"],
  ["return { unit: 'time', aria: 'Per-deposit savings amount' }", "return { unit: '회', aria: '회당 저축 금액' }"],
  ["return { unit: 'wk', aria: 'Weekly savings amount' }", "return { unit: '주', aria: '주간 저축 금액' }"],
  ["return { unit: 'mo', aria: 'Monthly savings amount' }", "return { unit: '월', aria: '월간 저축 금액' }"],
  ["return `My WishItem: ${item} · Try yours too. ${url}`", "return `내 위시템: ${item} · 나도 해보기. ${url}`"],
  ["`Goal ${goalAmount}`", "`목표 ${goalAmount}`"],
  ["savingDays != null ? `Regular saving: ${savingDays} days` : 'Regular saving: —'", "savingDays != null ? `일반 저축: ${savingDays}일` : '일반 저축: —'"],
  ["wishRaceDays != null ? `With WishBooster: ${wishRaceDays} days` : 'With WishBooster: —'", "wishRaceDays != null ? `위시부스터: ${wishRaceDays}일` : '위시부스터: —'"],
  ["wishRaceDays != null ? `WishBooster: ${wishRaceDays} days` : 'WishBooster: —'", "wishRaceDays != null ? `위시부스터: ${wishRaceDays}일` : '위시부스터: —'"],
  ["daysSaved != null ? `${daysSaved} days saved` : 'Time saved: —'", "daysSaved != null ? `${daysSaved}일 절약` : '절약 시간: —'"],
  ["survivalPct != null ? `Goal hit chance ${survivalPct}%` : 'Goal hit chance —'", "survivalPct != null ? `목표 달성 확률 ${survivalPct}%` : '목표 달성 확률 —'"],
  ["'Try your WishItem too.'", "'나도 위시템 챌린지 해보기.'"],
  ["const text = `WishRace goal: ${state.itemName} ${F.fmtRM(state.targetAmount)}! 🎯`", "const text = `위시레이스 목표: ${state.itemName} ${F.fmtKRW(state.targetAmount)}! 🎯`"],
  ["navigator.share({ title: 'WishRace', text, url: location.href })", "navigator.share({ title: '위시레이스', text, url: location.href })"],
  ["const raw = prompt('Enter your hourly rate (RM)', state.wage.toFixed(2))", "const raw = prompt('시급을 입력하세요 (₩)', String(Math.round(state.wage)))"],
  ["`Reach your ${item} goal faster with WishBooster!`", "`위시부스터로 ${item} 목표에 더 빨리 도달하세요!`"],
  ["? `WishBooster returns saved you ${laborDays} days of work. Open a linked account and start booster mode!`", "? `위시부스터 수익으로 ${laborDays}일 분 노동을 절약했어요. 연계 계좌를 열고 부스터 모드를 시작하세요!`"],
  ['>🎉 Got it!<', '>🎉 달성!<'],
  ["label: '3 mo'", "label: '3개월'"],
  ["label: '6 mo'", "label: '6개월'"],
  ["label: '9 mo'", "label: '9개월'"],
  ["label: '12 mo'", "label: '12개월'"],
  ["return `${Math.max(1, Math.round(days / 30))} mo`", "return `${Math.max(1, Math.round(days / 30))}개월`"],
  ["return m ? `${m} mo to go` : 'Not reached'", "return m ? `${m}개월 남음` : '도달 불가'"],
  ["`*Saving ₩${Math.round(monthlyBudget).toLocaleString('ko-KR')}/mo equals about ${depositLaborHours} hrs of hustle at your hourly rate.`", "`*월 ₩${Math.round(monthlyBudget).toLocaleString('ko-KR')} 저축은 시급 기준 약 ${depositLaborHours}시간 분량이에요.`"],
  ["`*Saving ₩${Math.round(monthlyBudget).toLocaleString('ko-KR')}/month equals ${depositLaborHours} hrs of work at your hourly rate.`", "`*월 ₩${Math.round(monthlyBudget).toLocaleString('ko-KR')} 저축은 시급 기준 약 ${depositLaborHours}시간 분량이에요.`"],
  [": 'Booster runs can lighten your hustle load'", ": '부스터로 노동 부담을 줄일 수 있어요'"],
  ["? `Investing saved you ${laborDays} days (${laborHours} hrs) of work!`", "? `투자로 ${laborDays}일(${laborHours}시간) 분 노동을 절약!`"],
  ["? `Investment returns covered ${laborHours} hrs of your work`", "? `투자 수익이 ${laborHours}시간 분 노동을 대신했어요`"],
  ["{ label: 'Regular savings', kind: 'saving'", "{ label: '일반 저축 (시중은행 평균)', kind: 'saving'"],
  ["nearest.kind === 'saving' ? 'Savings baseline' : `₩${fmt.format(diff)} more than savings`", "nearest.kind === 'saving' ? '저축 기준' : `저축보다 ₩${fmt.format(diff)} 더`"],
  ["tooltip.innerHTML = `<strong>${dateFromDay(nearest.point.day)} · ${nearest.label}</strong>Progress ${progress.toFixed(0)}%<br>${nearest.label} ₩${fmt.format(amount)}<br>${diffLine}`", "tooltip.innerHTML = `<strong>${dateFromDay(nearest.point.day)} · ${nearest.label}</strong> 진행 ${progress.toFixed(0)}%<br>${nearest.label} ₩${fmt.format(amount)}<br>${diffLine}`"],
  ["tooltip.innerHTML = `<strong>${dateFromDay(nearest.point.day)} · ${nearest.label}</strong> · ${progress.toFixed(0)}% there<br>${nearest.label} ₩${fmt.format(amount)}<br>${diffLine}`", "tooltip.innerHTML = `<strong>${dateFromDay(nearest.point.day)} · ${nearest.label}</strong> · ${progress.toFixed(0)}% 달성<br>${nearest.label} ₩${fmt.format(amount)}<br>${diffLine}`"],
  ["savingDays != null ? `Regular save: ${savingDays} days` : 'Regular save: —'", "savingDays != null ? `일반 저축: ${savingDays}일` : '일반 저축: —'"],
  ["daysSaved != null ? `Save ${daysSaved} days` : '절약 시간: —'", "daysSaved != null ? `${daysSaved}일 절약` : '절약 시간: —'"],
  ["`My WishItem: ${item}`", "`내 위시템: ${item}`"],
  ["daysSaved != null ? `${daysSaved} days saved` : '절약 시간: —'", "daysSaved != null ? `${daysSaved}일 절약` : '절약 시간: —'"],
  ["setText('resultHeroSub', `${state.itemName} goal`)", "setText('resultHeroSub', `${state.itemName} 목표`)"],
  ["setText('miniLaborLabel', 'Work saved')", "setText('miniLaborLabel', '노동 절약')"],
  ["`${monthlyBudget}/mo · ${cycleLabel}`", "`${monthlyBudget}/월 · ${cycleShareKo}`"],
  ["const cycleLabel = r.cycle || KEY_TO_ROUTE_CYCLE[state.cycleKey] || 'Weekly';", "const cycleLabel = r.cycle || KEY_TO_ROUTE_CYCLE[state.cycleKey] || 'Weekly';\n    const cycleShareKo = { Daily: '매일', '3×/week': '주 3회', '2×/week': '주 2회', Weekly: '매주', Monthly: '매월' }[cycleLabel] || cycleLabel;"],
  ["label: 'Today'", "label: '오늘'"],
  ["label: '1 yr'", "label: '1년'"],
  ["label: `${year} yr`", "label: `${year}년`"],
  ["label: `${years} yr`", "label: `${years}년`"],
  ["toLocaleDateString('en-MY'", "toLocaleDateString('ko-KR'"],
  ["toLocaleString('en-MY'", "toLocaleString('ko-KR'"],
  ["$('miniSaved').textContent = daysSaved > 0 ? `${daysSaved} days` : '—'", "$('miniSaved').textContent = daysSaved > 0 ? `${daysSaved}일` : '—'"],
  ["$('miniLabor').textContent = laborHours > 0 ? `${laborDays} days` : '—'", "$('miniLabor').textContent = laborHours > 0 ? `${laborDays}일` : '—'"],
  ["setText('miniLabor', laborHours > 0 ? `${laborDays} days` : '—')", "setText('miniLabor', laborHours > 0 ? `${laborDays}일` : '—')"],
  ["setText('miniSaved', daysSaved > 0 ? `${daysSaved} days` : '—')", "setText('miniSaved', daysSaved > 0 ? `${daysSaved}일` : '—')"],
  ["setText('goalCompareSaved', laborHours > 0 ? `${laborHours} hrs` : '—')", "setText('goalCompareSaved', laborHours > 0 ? `${laborHours}시간` : '—')"],
  [": 'Investing can save you work hours!'", ": '투자로 노동 시간을 절약할 수 있어요!'"],
  [": 'Booster mode can lighten your work load'", ": '부스터로 노동 부담을 줄일 수 있어요'"],
  [": 'Booster mode can lighten your work load';", ": '부스터로 노동 부담을 줄일 수 있어요';"],
  [": 'Open a linked account and start booster mode to save work hours with investment returns.'", ": '연계 계좌를 열고 부스터 모드를 시작해 투자 수익으로 노동 시간을 절약하세요.'"],
  ["'Calculating wish arrival line'", "'위시템 도착일을 계산 중'"],
  ["'Calculating hours saved'", "'노동 절약 시간을 계산 중'"],
  ["'Your saved work hours are in!'", "'노동 절약 결과가 나왔어요!'"],
  ["return { unit: 'deposit', aria: 'Per-deposit savings amount' }", "return { unit: '회', aria: '회당 저축 금액' }"],
  ["return { unit: 'week', aria: 'Weekly savings amount' }", "return { unit: '주', aria: '주간 저축 금액' }"],
  ["return { unit: 'month', aria: 'Monthly savings amount' }", "return { unit: '월', aria: '월간 저축 금액' }"],
  ['Apply', '적용'],
];

function applyReplacements(content, pairs) {
  const sorted = [...pairs].sort((a, b) => b[0].length - a[0].length);
  let out = content;
  for (const [from, to] of sorted) {
    out = out.split(from).join(to);
  }
  return out;
}

function buildKoPage(sourcePath, variantReplacements, outPath, label) {
  let content = fs.readFileSync(sourcePath, 'utf8');
  content = applyReplacements(content, variantReplacements);
  content = applyReplacements(content, TEXT_REPLACEMENTS);
  content = applyReplacements(content, SHARED_REPLACEMENTS);
  content = applyReplacements(content, JS_STRING_REPLACEMENTS);

  // Remaining RM patterns in JS template strings
  content = content.replace(/RM \$\{/g, '₩${');
  content = content.replace(/RM `/g, '₩`');

  // Post-pass: leftover English fragments after currency swap
  content = content.replace(
    /`\*Saving ₩\$\{Math\.round\(monthlyBudget\)\.toLocaleString\('ko-KR'\)\}\/mo equals about \$\{depositLaborHours\} hrs of hustle at your hourly rate\.`/g,
    "`*월 ₩${Math.round(monthlyBudget).toLocaleString('ko-KR')} 저축은 시급 기준 약 ${depositLaborHours}시간 분량이에요.`"
  );
  content = content.replace(
    /`\*Saving ₩\$\{Math\.round\(monthlyBudget\)\.toLocaleString\('ko-KR'\)\}\/month equals \$\{depositLaborHours\} hrs of work at your hourly rate\.`/g,
    "`*월 ₩${Math.round(monthlyBudget).toLocaleString('ko-KR')} 저축은 시급 기준 약 ${depositLaborHours}시간 분량이에요.`"
  );
  content = content.replace(
    /<\/strong>Progress \$\{progress\.toFixed\(0\)\}%<br>/g,
    '</strong> 진행 ${progress.toFixed(0)}%<br>'
  );
  content = content.replace(
    /<\/strong> · \$\{progress\.toFixed\(0\)\}% there<br>/g,
    '</strong> · ${progress.toFixed(0)}% 달성<br>'
  );
  content = content.replace(
    /nearest\.kind === 'saving' \? 'Savings baseline' : `₩\$\{fmt\.format\(diff\)\} more than savings`/g,
    "nearest.kind === 'saving' ? '저축 기준' : `저축보다 ₩${fmt.format(diff)} 더`"
  );
  content = content.replace(
    /const text = `WishRace goal: \$\{state\.itemName\} \$\{F\.fmtKRW\(state\.targetAmount\)\}! 🎯`;/g,
    'const text = `위시레이스 목표: ${state.itemName} ${F.fmtKRW(state.targetAmount)}! 🎯`;'
  );
  content = content.replace(/>🎉 Got it!</g, '>🎉 달성!<');
  content = content.replace(/\$\{daysSaved\} days/g, '${daysSaved}일');
  content = content.replace(/\$\{laborDays\} days/g, '${laborDays}일');
  content = content.replace(/\$\{laborHours\} hrs/g, '${laborHours}시간');

  fs.writeFileSync(outPath, content, 'utf8');
  console.log(`[KO] Wrote ${label}: ${outPath} (${content.length} bytes)`);
}

function swapKoTracker(outPath) {
  const replacer =
    /<script>\r?\n\(function \(\) \{\r?\n  const STORAGE_KEY = 'wishfast_events';[\s\S]*?\}\)\(\);\r?\n\r?\n<\/script>/;
  let content = fs.readFileSync(outPath, 'utf8');
  if (!replacer.test(content)) {
    if (content.includes('tracker-ko.js')) return;
    console.warn(`[KO] Inline tracker not found in ${outPath}; skip swap`);
    return;
  }
  content = content.replace(replacer, '<script src="/js/tracker-ko.js"></script>');
  content = content.replace(
    'Tracking: LocalStorage wishfast_events / wishfast_contacts',
    'Tracking: LocalStorage wishfast_ko_events / wishfast_ko_contacts'
  );
  content = content.replace(
    'With node server.js: also posts to /api/events · /api/contacts -->',
    'Tracking KR: /api/ko/events · /api/ko/contacts (server-ko.js for KR-only deploy) -->'
  );
  fs.writeFileSync(outPath, content, 'utf8');
  console.log(`[KO] Swapped tracker → tracker-ko.js in ${outPath}`);
}

buildKoPage(KO_A_SOURCE, A_ONLY, KO_A_OUT, 'index-ko-a.html (A)');
buildKoPage(KO_B_SOURCE, B_ONLY, KO_B_OUT, 'index-ko-b.html (B)');
swapKoTracker(KO_A_OUT);
swapKoTracker(KO_B_OUT);
