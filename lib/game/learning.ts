import type { LearningLevelId, MacroState, Policies, Scenario, TheoryCard } from "@/lib/game/types";
import { BEGINNER_LESSONS, getPolicyTheoryCard, GLOSSARY_TERMS, TEXTBOOK_CASE_STUDIES } from "@/lib/game/theory-content";

export { BEGINNER_LESSONS, GLOSSARY_TERMS, TEXTBOOK_CASE_STUDIES };

export const LEARNING_LEVELS: Array<{
  id: LearningLevelId;
  label: string;
  title: string;
  summary: string;
  concepts: string[];
}> = [
  {
    id: "tutorial",
    label: "Level 0",
    title: "First Day as President",
    summary: "Learn the four basic indicators: inflation, unemployment, GDP growth, and approval.",
    concepts: ["inflation", "unemployment", "GDP growth", "approval"]
  },
  {
    id: "basic",
    label: "Level 1",
    title: "Basic Economy",
    summary: "See why every policy choice creates trade-offs between jobs, prices, growth, and debt.",
    concepts: ["government spending", "taxes", "budget deficit", "trade-offs"]
  },
  {
    id: "policy",
    label: "Level 2",
    title: "Policy Tools",
    summary: "Use fiscal, monetary, and supply-side tools with clearer strategic intent.",
    concepts: ["fiscal policy", "monetary policy", "supply-side reform", "public investment"]
  },
  {
    id: "finance",
    label: "Level 3",
    title: "Finance and Markets",
    summary: "Watch bond yields, currency, stock markets, and banking stress react to policy.",
    concepts: ["stocks", "bonds", "exchange rates", "investor confidence"]
  },
  {
    id: "crisis",
    label: "Level 4",
    title: "Crisis Management",
    summary: "Handle inflation shocks, recessions, debt stress, currency pressure, and banking risk together.",
    concepts: ["recession", "debt crisis", "currency crisis", "banking stability"]
  },
  {
    id: "historical",
    label: "Level 5",
    title: "Historical Scenarios",
    summary: "Apply what you learned to real and historically inspired cases across countries.",
    concepts: ["historical context", "institutions", "external shocks", "policy credibility"]
  },
  {
    id: "competitive",
    label: "Level 6",
    title: "Competitive Mode",
    summary: "Play under standardized conditions with fewer hints and leaderboard-ready scoring.",
    concepts: ["score optimization", "risk control", "long-term sustainability", "rankings"]
  }
];

export function scenarioLearningLevel(scenario: Scenario): LearningLevelId {
  const stats = scenario.startingStats;
  const id = scenario.id;

  if (id === "us-1958-rebuild") return "tutorial";
  if (id.startsWith("finance-")) return "finance";
  if (id === "us-1983-recovery" || id === "us-1999-golden-run") return "basic";
  if (scenario.country !== "United States" && scenario.startingYear < 2020) return "historical";
  if (id.includes("2009") || id.includes("financial") || stats.debt > 120) return "finance";
  if (Math.abs(stats.inflation) > 10 || stats.unemployment > 10 || stats.growth < -3 || stats.debt > 100) return "crisis";
  if (scenario.startingYear >= 2025) return "policy";
  return "policy";
}

export function getLearningLevel(id: LearningLevelId) {
  return LEARNING_LEVELS.find((level) => level.id === id) ?? LEARNING_LEVELS[0];
}

function delta(after: number, before: number) {
  return after - before;
}

function direction(after: number, before: number, threshold: number) {
  const change = delta(after, before);
  if (Math.abs(change) < threshold) return "flat";
  return change > 0 ? "up" : "down";
}

export function buildTheoryCard(previous: MacroState, current: MacroState, policies: Policies): TheoryCard {
  const actionCard = getPolicyTheoryCard(policies);
  if (actionCard) return actionCard;

  const inflation = direction(current.inflation, previous.inflation, 0.25);
  const unemployment = direction(current.unemployment, previous.unemployment, 0.2);
  const yieldMove = direction(current.sovereignYield, previous.sovereignYield, 0.25);
  const currency = direction(current.currencyIndex, previous.currencyIndex, 1.5);
  const stocks = direction(current.equityMarket, previous.equityMarket, 2);
  const spendingExpansion = policies.currentSpending > 20 || policies.transferPayments > 5;
  const tighterMoney = policies.interestRate > 5 || policies.reserveRequirement > 11;
  const easierMoney = policies.interestRate < 3.5 || policies.bondPurchases > 150;

  if (tighterMoney && inflation !== "up") {
    return {
      title: "Why can higher rates cool inflation?",
      keyConcept: "interest rates",
      explanation:
        "Higher interest rates make borrowing more expensive. That usually slows consumer spending and business investment, which reduces demand pressure and can bring inflation down. The trade-off is that jobs and stock markets may weaken when credit becomes tighter.",
      learnMore: "Interest rates are a central-bank tool for managing demand and inflation expectations."
    };
  }

  if (easierMoney && (currency === "down" || inflation === "up")) {
    return {
      title: "Why can easy money weaken the currency?",
      keyConcept: "exchange rates",
      explanation:
        "Lower rates and bond purchases can support demand in the short run. But if investors think money is too loose, inflation expectations rise and the currency can lose value. A weaker currency can also make imports more expensive.",
      learnMore: "Exchange rates connect domestic policy with global investor confidence."
    };
  }

  if (spendingExpansion && inflation === "up") {
    return {
      title: "Why did inflation rise after more spending?",
      keyConcept: "aggregate demand",
      explanation:
        "Government spending puts more money into the economy and can raise demand for goods and services. If production cannot expand quickly enough, prices rise. This is why stimulus can help jobs but also create inflation pressure.",
      learnMore: "Aggregate demand is total spending by households, firms, government, and foreign buyers."
    };
  }

  if (yieldMove === "up") {
    return {
      title: "Why did bond yields rise?",
      keyConcept: "government debt",
      explanation:
        "Bond yields rise when investors demand more compensation for lending to the government. High debt, deficits, inflation, or weaker credibility can all increase that risk premium. Higher yields make future borrowing more expensive.",
      learnMore: "Bond markets are one way financial markets discipline government policy."
    };
  }

  if (stocks === "down") {
    return {
      title: "Why did stocks fall?",
      keyConcept: "risk and return",
      explanation:
        "Stock markets react to expected profits and the cost of capital. Higher rates, weak growth, banking stress, or lower confidence can reduce expected returns. That is why a policy that fights inflation can still hurt equities in the short run.",
      learnMore: "Stocks are forward-looking, so they often move before ordinary people feel the full effect."
    };
  }

  if (unemployment === "down") {
    return {
      title: "Why did unemployment fall?",
      keyConcept: "GDP and jobs",
      explanation:
        "When growth improves, firms usually need more workers to produce goods and services. That can lower unemployment and raise household confidence. If the economy runs too hot, though, job gains can come with higher inflation.",
      learnMore: "Employment usually improves when actual growth rises above the economy's sustainable speed."
    };
  }

  return {
    title: "What was the main trade-off?",
    keyConcept: "policy trade-offs",
    explanation:
      "Economic policy rarely improves every indicator at once. A choice that helps growth or jobs can raise inflation or debt, while a choice that restores credibility can slow demand. The skill is to decide which problem is most urgent.",
    learnMore: "Good policy is about managing trade-offs, not finding a button that fixes everything."
  };
}

export function investorView(current: MacroState) {
  const notes = [];
  if (current.inflation > 6) notes.push("Inflation is high, so household savings are losing purchasing power.");
  if (current.sovereignYield > 7) notes.push("Government borrowing is expensive, which limits future fiscal space.");
  if (current.currencyIndex < 85) notes.push("The currency is weak, so imported goods and foreign-currency debt feel more painful.");
  if (current.equityMarket < 75) notes.push("Equity markets are cautious because expected profits or confidence have weakened.");
  if (current.bankingStress > 55) notes.push("Banking stress is elevated, so households and firms may find credit harder to access.");
  return notes.length ? notes : ["Households, firms, and investors see a broadly stable financial environment for now."];
}

export function improvementFocus(current: MacroState) {
  const pressures = [
    { label: "bring inflation closer to target", score: Math.abs(current.inflation - 2.3) + Math.max(0, current.inflation - 5) },
    { label: "reduce unemployment without overheating demand", score: Math.max(0, current.unemployment - 5) },
    { label: "restore debt sustainability", score: Math.max(0, current.debtRatio - 80) / 12 },
    { label: "rebuild investor confidence and lower bond yields", score: Math.max(0, current.sovereignYield - 5) + Math.max(0, current.bankingStress - 45) / 10 },
    { label: "protect approval while explaining painful trade-offs", score: Math.max(0, 55 - current.approval) / 8 }
  ];
  return pressures.sort((a, b) => b.score - a.score)[0]?.label ?? "keep a balanced policy mix";
}
