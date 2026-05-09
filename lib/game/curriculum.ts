import type { LearningLevelId, MacroState, RunState, Scenario } from "@/lib/game/types";

export type UserLevelId = "beginner" | "basic" | "intermediate" | "advanced";

export type ScenarioDifficultyLabel = "Beginner" | "Basic" | "Intermediate" | "Advanced" | "Expert";

export type ScenarioLearningProfile = {
  level: 1 | 2 | 3 | 4 | 5;
  title: string;
  difficulty: ScenarioDifficultyLabel;
  audienceLevel: UserLevelId;
  estimatedMinutes: number;
  track: "Financial Basics" | "Markets and Money" | "Policy and Finance" | "Crisis Management" | "Expert Simulation";
  concepts: string[];
  recommendation: string;
};

export const USER_LEVELS: Array<{
  id: UserLevelId;
  label: string;
  title: string;
  summary: string;
  recommendation: string;
}> = [
  {
    id: "beginner",
    label: "Beginner",
    title: "I am new to finance and economics.",
    summary: "Start with savings, inflation, loans, budgeting, and simple interest-rate choices.",
    recommendation: "Short guided cases with plain-language theory cards after each decision."
  },
  {
    id: "basic",
    label: "Basic",
    title: "I know simple concepts like inflation, taxes, and savings.",
    summary: "Move into markets, bonds, currencies, and risk without jumping straight into crises.",
    recommendation: "Finance-first scenarios with simple dashboards and clear trade-offs."
  },
  {
    id: "intermediate",
    label: "Intermediate",
    title: "I understand markets, interest rates, and policy.",
    summary: "Practice how policy choices affect investors, credit, debt, and financial stability.",
    recommendation: "Scenarios where markets react to rates, debt, regulation, and confidence."
  },
  {
    id: "advanced",
    label: "Advanced",
    title: "I want complex crisis scenarios and competitive challenges.",
    summary: "Handle multi-variable crises with rising yields, currency pressure, bank stress, and public anger.",
    recommendation: "Challenge-style cases that reward balanced financial stability."
  }
];

export const FINANCE_PROGRESSION_LEVELS: Array<{
  id: 1 | 2 | 3 | 4 | 5;
  label: string;
  title: string;
  summary: string;
  concepts: string[];
}> = [
  {
    id: 1,
    label: "Level 1",
    title: "Financial Basics",
    summary: "Understand how inflation, saving, borrowing, spending, and interest rates affect ordinary people.",
    concepts: ["savings", "inflation", "loans", "budgeting", "interest rates"]
  },
  {
    id: 2,
    label: "Level 2",
    title: "Markets and Money",
    summary: "Learn how stocks, bonds, currencies, risk, return, diversification, and investor confidence work.",
    concepts: ["stocks", "bonds", "exchange rates", "risk and return", "diversification"]
  },
  {
    id: 3,
    label: "Level 3",
    title: "Policy and Finance",
    summary: "See how policy choices move financial markets, public debt, inflation, credit, and employment.",
    concepts: ["interest rates", "government debt", "taxes", "public spending", "monetary policy"]
  },
  {
    id: 4,
    label: "Level 4",
    title: "Crisis Management",
    summary: "Manage banking, currency, stock-market, inflation, debt, and household-credit crises.",
    concepts: ["banking crisis", "currency crisis", "stock crash", "debt crisis", "household debt"]
  },
  {
    id: 5,
    label: "Level 5",
    title: "Expert Simulation",
    summary: "Compete in complex simulations where several financial and economic problems hit at once.",
    concepts: ["capital flight", "bank panic", "bond yields", "stagflation", "investor confidence"]
  }
];

const PROFILE_MAP: Record<string, ScenarioLearningProfile> = {
  "finance-basics-inflation-savings": {
    level: 1,
    title: "Inflation and Savings",
    difficulty: "Beginner",
    audienceLevel: "beginner",
    estimatedMinutes: 5,
    track: "Financial Basics",
    concepts: ["inflation", "purchasing power", "savings", "real return"],
    recommendation: "Best first scenario for learning why money loses value when prices rise."
  },
  "finance-basics-first-loan": {
    level: 1,
    title: "First Loan Decision",
    difficulty: "Beginner",
    audienceLevel: "beginner",
    estimatedMinutes: 5,
    track: "Financial Basics",
    concepts: ["loans", "interest rates", "monthly payments", "loan affordability"],
    recommendation: "A simple case about borrowing costs and household choices."
  },
  "finance-basics-budget-balance": {
    level: 1,
    title: "Budget Balance",
    difficulty: "Beginner",
    audienceLevel: "beginner",
    estimatedMinutes: 7,
    track: "Financial Basics",
    concepts: ["budgeting", "saving", "debt", "trade-offs"],
    recommendation: "Practice balancing spending, savings, and debt without crisis pressure."
  },
  "finance-basics-emergency-fund": {
    level: 1,
    title: "Emergency Fund",
    difficulty: "Beginner",
    audienceLevel: "beginner",
    estimatedMinutes: 6,
    track: "Financial Basics",
    concepts: ["emergency fund", "uncertainty", "savings", "household resilience"],
    recommendation: "Learn why savings matter before shocks arrive."
  },
  "finance-basics-simple-investment": {
    level: 1,
    title: "Simple Investment Choice",
    difficulty: "Basic",
    audienceLevel: "basic",
    estimatedMinutes: 8,
    track: "Financial Basics",
    concepts: ["cash", "stocks", "bonds", "diversification"],
    recommendation: "A safe introduction to risk, return, and diversification."
  },
  "finance-market-stock-reaction": {
    level: 2,
    title: "Stock Market Reaction",
    difficulty: "Intermediate",
    audienceLevel: "intermediate",
    estimatedMinutes: 10,
    track: "Markets and Money",
    concepts: ["stock market", "expected profits", "interest rates", "confidence"],
    recommendation: "Shows why markets react before households feel the full effect."
  },
  "finance-market-bond-yield-pressure": {
    level: 2,
    title: "Bond Yield Pressure",
    difficulty: "Intermediate",
    audienceLevel: "intermediate",
    estimatedMinutes: 10,
    track: "Markets and Money",
    concepts: ["bonds", "bond yields", "government debt", "risk premium"],
    recommendation: "Use this to understand why debt can make borrowing more expensive."
  },
  "finance-market-currency-depreciation": {
    level: 2,
    title: "Currency Depreciation",
    difficulty: "Intermediate",
    audienceLevel: "intermediate",
    estimatedMinutes: 10,
    track: "Markets and Money",
    concepts: ["exchange rates", "imports", "inflation", "investor confidence"],
    recommendation: "Connect currency weakness to inflation and imported goods."
  },
  "finance-market-consumer-credit-boom": {
    level: 2,
    title: "Consumer Credit Boom",
    difficulty: "Intermediate",
    audienceLevel: "intermediate",
    estimatedMinutes: 10,
    track: "Markets and Money",
    concepts: ["consumer credit", "household debt", "defaults", "aggregate demand"],
    recommendation: "Learn why easy credit helps growth first and creates risk later."
  },
  "finance-market-banking-regulation": {
    level: 2,
    title: "Banking Regulation",
    difficulty: "Intermediate",
    audienceLevel: "intermediate",
    estimatedMinutes: 10,
    track: "Markets and Money",
    concepts: ["bank regulation", "lending", "financial stability", "credit risk"],
    recommendation: "Balance safer banks against less credit for households and firms."
  },
  "finance-policy-rate-markets": {
    level: 3,
    title: "Interest Rates and Markets",
    difficulty: "Intermediate",
    audienceLevel: "intermediate",
    estimatedMinutes: 10,
    track: "Policy and Finance",
    concepts: ["interest rates", "stocks", "currency", "loan affordability"],
    recommendation: "A bridge between finance decisions and macro policy."
  },
  "finance-policy-public-debt": {
    level: 3,
    title: "Government Debt and Confidence",
    difficulty: "Advanced",
    audienceLevel: "advanced",
    estimatedMinutes: 12,
    track: "Policy and Finance",
    concepts: ["government debt", "credit rating", "bond yields", "investor confidence"],
    recommendation: "Good for learning how public borrowing shapes market trust."
  },
  "finance-crisis-banking-panic": {
    level: 4,
    title: "Banking Panic",
    difficulty: "Advanced",
    audienceLevel: "advanced",
    estimatedMinutes: 15,
    track: "Crisis Management",
    concepts: ["bank runs", "deposit insurance", "liquidity", "moral hazard"],
    recommendation: "Stop panic while avoiding unlimited bailouts."
  },
  "finance-crisis-debt-confidence": {
    level: 4,
    title: "Debt Crisis",
    difficulty: "Advanced",
    audienceLevel: "advanced",
    estimatedMinutes: 15,
    track: "Crisis Management",
    concepts: ["debt crisis", "bond yields", "credit rating", "fiscal credibility"],
    recommendation: "Restore trust without crushing growth."
  },
  "finance-crisis-stock-market-crash": {
    level: 4,
    title: "Stock Market Crash",
    difficulty: "Advanced",
    audienceLevel: "advanced",
    estimatedMinutes: 15,
    track: "Crisis Management",
    concepts: ["market panic", "liquidity", "confidence", "interest rates"],
    recommendation: "Manage investors, banks, households, and unemployment at once."
  },
  "finance-crisis-currency-defense": {
    level: 4,
    title: "Currency Crisis",
    difficulty: "Advanced",
    audienceLevel: "advanced",
    estimatedMinutes: 15,
    track: "Crisis Management",
    concepts: ["currency crisis", "capital flight", "inflation", "interest rates"],
    recommendation: "Defend the currency without destroying growth."
  },
  "finance-crisis-inflation-control": {
    level: 4,
    title: "Inflation Crisis",
    difficulty: "Advanced",
    audienceLevel: "advanced",
    estimatedMinutes: 15,
    track: "Crisis Management",
    concepts: ["inflation expectations", "rates", "unemployment", "savings"],
    recommendation: "Reduce inflation while protecting households from a deep slump."
  },
  "finance-expert-global-financial-crisis": {
    level: 5,
    title: "Global Financial Crisis",
    difficulty: "Expert",
    audienceLevel: "advanced",
    estimatedMinutes: 18,
    track: "Expert Simulation",
    concepts: ["bank failures", "unemployment", "debt", "market panic"],
    recommendation: "A full macro-finance stress test for advanced players."
  },
  "finance-expert-stagflation": {
    level: 5,
    title: "Stagflation",
    difficulty: "Expert",
    audienceLevel: "advanced",
    estimatedMinutes: 18,
    track: "Expert Simulation",
    concepts: ["stagflation", "supply shock", "inflation", "unemployment"],
    recommendation: "High inflation and high unemployment leave no easy answer."
  },
  "finance-expert-emerging-market-crisis": {
    level: 5,
    title: "Emerging Market Crisis",
    difficulty: "Expert",
    audienceLevel: "advanced",
    estimatedMinutes: 18,
    track: "Expert Simulation",
    concepts: ["currency collapse", "capital flight", "foreign debt", "inflation"],
    recommendation: "A hard case about external credibility and domestic pain."
  },
  "finance-expert-housing-bubble": {
    level: 5,
    title: "Housing Bubble",
    difficulty: "Expert",
    audienceLevel: "advanced",
    estimatedMinutes: 18,
    track: "Expert Simulation",
    concepts: ["housing bubble", "credit rules", "leverage", "bank stability"],
    recommendation: "Decide whether to cool the boom before a crash."
  },
  "finance-expert-investor-confidence-collapse": {
    level: 5,
    title: "Investor Confidence Collapse",
    difficulty: "Expert",
    audienceLevel: "advanced",
    estimatedMinutes: 18,
    track: "Expert Simulation",
    concepts: ["investor confidence", "bond yields", "currency", "fiscal limits"],
    recommendation: "Rebuild trust while public approval is already fragile."
  },
  "finance-2026-inflation-savings": {
    level: 1,
    title: "Inflation and Savings",
    difficulty: "Beginner",
    audienceLevel: "beginner",
    estimatedMinutes: 7,
    track: "Financial Basics",
    concepts: ["inflation", "savings", "currency", "financial education"],
    recommendation: "A guided finance case about purchasing power."
  },
  "finance-2026-household-debt-crisis": {
    level: 2,
    title: "Household Debt Crisis",
    difficulty: "Intermediate",
    audienceLevel: "intermediate",
    estimatedMinutes: 12,
    track: "Markets and Money",
    concepts: ["household debt", "consumer credit", "defaults", "banking stress"],
    recommendation: "Learn how personal borrowing becomes a macro-financial risk."
  },
  "finance-2026-investment-bubble": {
    level: 5,
    title: "Investment Boom and Bubble",
    difficulty: "Expert",
    audienceLevel: "advanced",
    estimatedMinutes: 15,
    track: "Expert Simulation",
    concepts: ["asset bubble", "credit", "expectations", "risk management"],
    recommendation: "Useful after you understand stocks, credit, and regulation."
  },
  "finance-2026-stock-market-crash": {
    level: 4,
    title: "Stock Market Crash",
    difficulty: "Advanced",
    audienceLevel: "advanced",
    estimatedMinutes: 15,
    track: "Crisis Management",
    concepts: ["stock market", "confidence", "liquidity", "bank support"],
    recommendation: "Practice crisis communication and market stabilization."
  },
  "finance-2026-debt-crisis": {
    level: 4,
    title: "Debt Crisis",
    difficulty: "Advanced",
    audienceLevel: "advanced",
    estimatedMinutes: 15,
    track: "Crisis Management",
    concepts: ["debt", "bond yields", "credit rating", "investor confidence"],
    recommendation: "A strong case for understanding sovereign borrowing."
  },
  "finance-2026-currency-crisis": {
    level: 4,
    title: "Currency Crisis",
    difficulty: "Advanced",
    audienceLevel: "advanced",
    estimatedMinutes: 15,
    track: "Crisis Management",
    concepts: ["exchange rates", "inflation", "capital flight", "interest rates"],
    recommendation: "Learn why defending a currency creates domestic trade-offs."
  },
  "finance-2008-banking-crisis": {
    level: 5,
    title: "Banking Crisis",
    difficulty: "Expert",
    audienceLevel: "advanced",
    estimatedMinutes: 18,
    track: "Expert Simulation",
    concepts: ["bank crisis", "bailouts", "deposit insurance", "moral hazard"],
    recommendation: "A complex banking-system case for advanced players."
  }
};

export function getUserLevel(id: UserLevelId) {
  return USER_LEVELS.find((level) => level.id === id) ?? USER_LEVELS[0];
}

export function getProgressionLevel(id: 1 | 2 | 3 | 4 | 5) {
  return FINANCE_PROGRESSION_LEVELS.find((level) => level.id === id) ?? FINANCE_PROGRESSION_LEVELS[0];
}

export function getScenarioLearningProfile(scenario: Pick<Scenario, "id" | "title" | "heroTag" | "startingYear">): ScenarioLearningProfile {
  const mapped = PROFILE_MAP[scenario.id];
  if (mapped) return mapped;

  if (scenario.heroTag.toLowerCase().includes("finance")) {
    return {
      level: 2,
      title: scenario.title,
      difficulty: "Intermediate",
      audienceLevel: "intermediate",
      estimatedMinutes: 10,
      track: "Markets and Money",
      concepts: ["finance", "markets", "confidence"],
      recommendation: "A finance case that connects market reactions with policy decisions."
    };
  }

  if (scenario.startingYear >= 2025) {
    return {
      level: 3,
      title: scenario.title,
      difficulty: "Intermediate",
      audienceLevel: "intermediate",
      estimatedMinutes: 12,
      track: "Policy and Finance",
      concepts: ["policy", "inflation", "debt", "growth"],
      recommendation: "A modern policy case with finance indicators in the dashboard."
    };
  }

  return {
    level: 3,
    title: scenario.title,
    difficulty: "Basic",
    audienceLevel: "basic",
    estimatedMinutes: 10,
    track: "Policy and Finance",
    concepts: ["trade-offs", "inflation", "jobs", "growth"],
    recommendation: "A policy case that supports the finance curriculum."
  };
}

export function profileToLearningLevel(profile: ScenarioLearningProfile): LearningLevelId {
  if (profile.level === 1) return profile.difficulty === "Beginner" ? "tutorial" : "basic";
  if (profile.level === 2) return "finance";
  if (profile.level === 3) return "policy";
  if (profile.level === 4) return "crisis";
  return "competitive";
}

export function userLevelToLearningLevel(id: UserLevelId): LearningLevelId {
  if (id === "beginner") return "tutorial";
  if (id === "basic") return "finance";
  if (id === "intermediate") return "policy";
  return "crisis";
}

function audienceRank(id: UserLevelId) {
  return USER_LEVELS.findIndex((level) => level.id === id);
}

export function isRecommendedForUserLevel(scenario: Scenario, userLevel: UserLevelId) {
  const profile = getScenarioLearningProfile(scenario);
  if (userLevel === "beginner") return profile.level <= 1;
  if (userLevel === "basic") return profile.level <= 2;
  if (userLevel === "intermediate") return profile.level >= 2 && profile.level <= 3;
  return profile.level >= 4;
}

export function getRecommendedScenarios(userLevel: UserLevelId, scenarios: Scenario[], limit = 4) {
  const targetRank = audienceRank(userLevel);
  return [...scenarios]
    .sort((left, right) => {
      const leftProfile = getScenarioLearningProfile(left);
      const rightProfile = getScenarioLearningProfile(right);
      const leftDistance = Math.abs(audienceRank(leftProfile.audienceLevel) - targetRank);
      const rightDistance = Math.abs(audienceRank(rightProfile.audienceLevel) - targetRank);
      if (leftDistance !== rightDistance) return leftDistance - rightDistance;
      if (leftProfile.level !== rightProfile.level) return leftProfile.level - rightProfile.level;
      return left.title.localeCompare(right.title);
    })
    .filter((scenario) => isRecommendedForUserLevel(scenario, userLevel))
    .slice(0, limit);
}

export function getNextScenario(userLevel: UserLevelId, completedScenarioIds: string[], scenarios: Scenario[]) {
  return getRecommendedScenarios(userLevel, scenarios, 12).find((scenario) => !completedScenarioIds.includes(scenario.id))
    ?? getRecommendedScenarios(userLevel, scenarios, 1)[0]
    ?? scenarios[0];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function scoreMetric(value: number, target: number, tolerance: number) {
  return clamp(100 - Math.abs(value - target) * tolerance, 0, 100);
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

export function buildPolicyScoreBreakdown(run: RunState) {
  const current = run.current;
  const categories = [
    {
      label: "Financial Stability",
      score: clamp(100 - current.bankingStress * 0.85 - current.defaultRisk * 0.45 + Math.max(0, 90 - current.householdDebt) * 0.08, 0, 100)
    },
    {
      label: "Market Confidence",
      score: clamp(current.equityMarket * 0.42 + current.currencyIndex * 0.24 + current.policyCredibility * 0.42 - current.sovereignYield * 2.3, 0, 100)
    },
    {
      label: "Inflation Control",
      score: scoreMetric(current.inflation, 2.5, current.inflation > 8 ? 8 : 10)
    },
    {
      label: "Debt Sustainability",
      score: clamp(104 - Math.max(0, current.debtRatio - 45) * 0.62 + current.budgetBalance * 2.2 - current.sovereignYield * 1.8, 0, 100)
    },
    {
      label: "Household Welfare",
      score: clamp(100 - current.unemployment * 5.4 - Math.max(0, current.inflation - 2.5) * 3.2 + current.consumerConfidence * 0.35 - current.defaultRisk * 0.4, 0, 100)
    },
    {
      label: "Growth and Employment",
      score: clamp(58 + current.growth * 7.5 - Math.max(0, current.unemployment - 4.8) * 5.5 + current.businessConfidence * 0.28, 0, 100)
    },
    {
      label: "Risk Management",
      score: clamp(100 - current.bankingStress * 0.55 - current.defaultRisk * 0.75 - Math.max(0, current.sovereignYield - 4) * 4.2, 0, 100)
    },
    {
      label: "Long-term Sustainability",
      score: clamp(45 + current.productivity * 7.5 + current.competitiveness * 0.35 + current.policyCredibility * 0.3 - Math.max(0, current.debtRatio - 90) * 0.22, 0, 100)
    }
  ].map((category) => ({ ...category, score: Math.round(category.score) }));
  const overall = Math.round(average(categories.map((category) => category.score)));
  return { overall, categories };
}

export function estimatePercentile(score: number) {
  return clamp(Math.round(8 + score * 0.86), 5, 99);
}

export function estimateScenarioRank(score: number, pool = 3420) {
  const percentile = estimatePercentile(score);
  return Math.max(1, Math.round(pool * (1 - percentile / 100)));
}

export function inferWeakAreas(current: MacroState) {
  const pressures = [
    { label: "financial stability", score: current.bankingStress + current.defaultRisk * 0.9 },
    { label: "debt sustainability", score: Math.max(0, current.debtRatio - 75) + Math.max(0, current.sovereignYield - 4) * 5 },
    { label: "inflation control", score: Math.max(0, current.inflation - 3) * 5 },
    { label: "household welfare", score: Math.max(0, current.unemployment - 5) * 5 + Math.max(0, current.defaultRisk - 12) },
    { label: "market confidence", score: Math.max(0, 90 - current.equityMarket) + Math.max(0, 92 - current.currencyIndex) }
  ];
  return pressures.sort((a, b) => b.score - a.score).slice(0, 2).map((item) => item.label);
}
