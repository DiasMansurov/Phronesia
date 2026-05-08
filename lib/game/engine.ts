import { getBenchmarksForCountry, getDifficulty, getScenario } from "@/lib/game/content";
import { buildTheoryCard, scenarioLearningLevel } from "@/lib/game/learning";
import type {
  CitizenGroupImpact,
  DifficultyId,
  ElectionNight,
  HistoryEntry,
  LearningMode,
  MandatePresentation,
  MacroState,
  PolicyComplexity,
  Policies,
  RoundBriefing,
  RunState,
  Scenario,
  ScenarioGoal
} from "@/lib/game/types";

export const MAX_ROUNDS = 8;
export const REELECTION_ROUND = 4;
export const REELECTION_THRESHOLD = 40;
export const DEFAULT_POLICY_COMPLEXITY: PolicyComplexity = "combined";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function defaultPolicies(): Policies {
  return {
    interestRate: 4.5,
    reserveRequirement: 10,
    bondPurchases: 0,
    incomeTaxRate: 22,
    indirectTaxRate: 6,
    currentSpending: 19,
    transferPayments: 4,
    capitalSpending: 3,
    educationTraining: 3,
    marketReforms: 5,
    bankRegulation: 5,
    investorTransparency: 5,
    bondIssuance: 0,
    financialEducation: 3,
    consumerCreditRules: 5,
    depositInsurance: 4
  };
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function formatSignedNumber(value: number, digits = 1) {
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}`;
}

function chooseByIndex<T>(items: T[], index: number) {
  return items[((index % items.length) + items.length) % items.length];
}

function callValue(call: { value?: number; electoralVotes?: number }) {
  return call.value ?? call.electoralVotes ?? 0;
}

function approvalTemplate(copy: string, approval: number) {
  return copy.replaceAll("{approval}", approval.toFixed(0));
}

function scoreEntry(avgGrowth: number, avgUnemployment: number, avgInflation: number, approval: number) {
  return 60 + 6.5 * avgGrowth - 3.1 * avgUnemployment - 2.2 * Math.abs(avgInflation - 2.3) + 0.42 * approval;
}

export function deriveInitialState(scenario: Scenario, difficultyId: DifficultyId): MacroState {
  const difficulty = getDifficulty(difficultyId);
  const stats = scenario.startingStats;
  const mechanics = scenario.mechanics;
  const potentialGrowth = clamp(
    2.3 + (stats.growth - 2.2) * 0.18 - Math.max(0, stats.debt - 90) * 0.003,
    1.3,
    3.9
  );
  const outputGap = clamp(stats.growth - potentialGrowth, -4.5, 4.5);
  const naturalUnemployment = clamp(
    5.0 - Math.max(0, potentialGrowth - 2.2) * 0.35 + Math.max(0, stats.debt - 100) * 0.003,
    3.8,
    6.7
  );
  const productivity = clamp(
    1.7 + Math.max(0, potentialGrowth - 2.0) * 0.7 * mechanics.policyTradeoffs.supplyResponse,
    0.8,
    4.2
  );
  const inequality = clamp(
    41 + Math.max(0, stats.unemployment - 4.8) * 1.25 + Math.max(0, stats.inflation - 3.0) * 0.28,
    34,
    62
  );
  const poverty = clamp(
    9 + Math.max(0, stats.unemployment - 4.5) * 0.95 + Math.max(0, stats.inflation - 3.0) * 0.14,
    5,
    24
  );
  const consumerConfidence = clamp(
    52 + stats.growth * 1.8 - Math.abs(stats.inflation - 2.3) * 1.4 - Math.max(0, stats.unemployment - 5.5) * 1.2,
    15,
    85
  );
  const businessConfidence = clamp(
    53 + stats.growth * 1.5 - Math.abs(stats.inflation - 2.3) * 1.0 - Math.max(0, stats.unemployment - 6.0) * 1.0,
    15,
    85
  );
  const policyCredibility = clamp(
    58 - Math.abs(stats.inflation - 2.3) * 2.2 - Math.max(0, -stats.budget - 6.0) * 0.8,
    20,
    82
  );
  const competitiveness = clamp(
    50 +
      productivity * 3.2 * mechanics.externalBalance.competitivenessWeight -
      stats.inflation * 1.6 * mechanics.externalBalance.importPassThrough +
      stats.netExports * 1.4 * mechanics.externalBalance.tradeSensitivity,
    20,
    82
  );
  const sovereignYield = clamp(
    1.4 +
      stats.inflation * 0.22 +
      Math.max(0, stats.debt - 70) * 0.035 +
      Math.max(0, -stats.budget) * 0.18 -
      policyCredibility * 0.018,
    0.4,
    18
  );
  const currencyIndex = clamp(
    100 +
      stats.netExports * 1.6 * mechanics.externalBalance.tradeSensitivity +
      (2.3 - stats.inflation) * 1.15 -
      Math.max(0, stats.debt - 90) * 0.12 +
      competitiveness * 0.12,
    45,
    135
  );
  const equityMarket = clamp(
    82 +
      stats.growth * 5 +
      businessConfidence * 0.35 -
      stats.unemployment * 1.8 -
      sovereignYield * 1.9,
    35,
    165
  );
  const bankingStress = clamp(
    18 +
      Math.max(0, stats.unemployment - 4.5) * 1.4 +
      Math.max(0, stats.inflation - 3) * 1.2 +
      Math.max(0, stats.debt - 85) * 0.12 +
      sovereignYield * 1.1 -
      consumerConfidence * 0.08,
    4,
    92
  );
  const householdDebt = clamp(
    68 +
      Math.max(0, stats.unemployment - 4.5) * 1.8 +
      Math.max(0, 3.5 - stats.inflation) * 1.2 +
      Math.max(0, stats.growth) * 1.5 +
      Math.max(0, sovereignYield - 4) * 1.6,
    25,
    155
  );
  const defaultRisk = clamp(
    8 +
      Math.max(0, householdDebt - 75) * 0.16 +
      Math.max(0, stats.unemployment - 5) * 1.4 +
      Math.max(0, stats.inflation - 4) * 0.75 +
      Math.max(0, sovereignYield - 5) * 1.2,
    2,
    60
  );

  return {
    round: 0,
    calendarYear: scenario.startingYear,
    approval: difficulty.startingApproval,
    growth: stats.growth,
    potentialGrowth,
    outputGap,
    unemployment: stats.unemployment,
    naturalUnemployment,
    inflation: stats.inflation,
    budgetBalance: stats.budget,
    debtRatio: stats.debt,
    netExports: scenario.mode === "open" ? stats.netExports : 0,
    inequality,
    poverty,
    consumerConfidence,
    businessConfidence,
    policyCredibility,
    productivity,
    competitiveness,
    externalDemand: clamp(50 + stats.netExports * 2.5 * mechanics.externalBalance.tradeSensitivity, 36, 64),
    sovereignYield,
    currencyIndex,
    equityMarket,
    bankingStress,
    householdDebt,
    defaultRisk
  };
}

function buildPolicyMix(policies: Policies, scenario: Scenario) {
  const tradeoffs = scenario.mechanics.policyTradeoffs;
  const easyCredit = 5 - policies.consumerCreditRules;
  const strictCredit = policies.consumerCreditRules - 5;
  const safeBanking = policies.bankRegulation - 5;
  const confidencePolicy = policies.investorTransparency - 5;
  const financeEducation = policies.financialEducation - 3;
  const depositTrust = policies.depositInsurance - 4;
  return {
    monetary:
      (4.5 - policies.interestRate) * 0.42 * tradeoffs.monetaryTransmission +
      (10 - policies.reserveRequirement) * 0.16 * tradeoffs.reserveTransmission +
      (policies.bondPurchases / 250) * ((tradeoffs.monetaryTransmission + tradeoffs.reserveTransmission) / 2),
    fiscalDemand:
      (policies.currentSpending - 19) * 0.24 * tradeoffs.fiscalTransmission +
      (policies.transferPayments - 4) * 0.2 * tradeoffs.transferEffectiveness -
      (policies.incomeTaxRate - 22) * 0.18 * tradeoffs.taxSensitivity -
      (policies.indirectTaxRate - 6) * 0.12 * tradeoffs.inflationSensitivity +
      easyCredit * 0.11 -
      Math.max(0, safeBanking) * 0.06 +
      Math.max(0, depositTrust) * 0.025 +
      confidencePolicy * 0.05,
    redistribution:
      (policies.transferPayments - 4) * 0.9 * tradeoffs.transferEffectiveness +
      (policies.incomeTaxRate - 22) * 0.2 * tradeoffs.taxSensitivity -
      (policies.marketReforms - 5) * 0.14 * tradeoffs.reformEquityCost -
      financeEducation * 0.2,
    supply:
      ((policies.capitalSpending - 3) * 0.23 +
        (policies.educationTraining - 3) * 0.26 +
      financeEducation * 0.12 +
      confidencePolicy * 0.05 -
      Math.max(0, depositTrust - 3) * 0.02 -
      Math.max(0, safeBanking) * 0.03 -
        Math.max(0, strictCredit - 2) * 0.04 +
        (policies.marketReforms - 5) * 0.11 -
        (policies.indirectTaxRate - 6) * 0.05) *
      tradeoffs.supplyResponse,
    inflation:
      (policies.currentSpending - 19) * 0.1 * tradeoffs.fiscalTransmission +
      (policies.transferPayments - 4) * 0.06 * tradeoffs.transferEffectiveness +
      (policies.indirectTaxRate - 6) * 0.18 * tradeoffs.inflationSensitivity -
      (policies.interestRate - 4.5) * 0.16 * tradeoffs.monetaryTransmission -
      (policies.reserveRequirement - 10) * 0.05 * tradeoffs.reserveTransmission +
      (policies.bondPurchases / 650) * tradeoffs.monetaryTransmission -
      (policies.capitalSpending - 3) * 0.04 * tradeoffs.supplyResponse -
      (policies.educationTraining - 3) * 0.05 * tradeoffs.supplyResponse +
      easyCredit * 0.05 -
      Math.max(0, safeBanking) * 0.035 -
      financeEducation * 0.025 -
      Math.max(0, depositTrust) * 0.01
  };
}

function demandLabel(value: number) {
  if (value >= 1) return "strongly expansionary";
  if (value >= 0.25) return "expansionary";
  if (value > -0.25) return "broadly neutral";
  if (value > -1) return "contractionary";
  return "strongly contractionary";
}

function supplyLabel(value: number) {
  if (value >= 1) return "strongly supportive of LRAS growth";
  if (value >= 0.25) return "supportive of LRAS growth";
  if (value > -0.25) return "roughly neutral for LRAS";
  if (value > -1) return "weak for LRAS";
  return "damaging for LRAS";
}

function policyImpactSummary(previous: MacroState, next: MacroState, policies: Policies, scenario: Scenario) {
  const mix = buildPolicyMix(policies, scenario);
  const notes = [
    `Demand was ${demandLabel(mix.monetary + mix.fiscalDemand)}.`,
    `Supply policy was ${supplyLabel(mix.supply)}.`
  ];

  if (next.inflation < previous.inflation - 0.3) notes.push("Inflation eased.");
  else if (next.inflation > previous.inflation + 0.3) notes.push("Inflation accelerated.");
  else notes.push("Inflation was broadly stable.");

  if (next.unemployment < previous.unemployment - 0.2) notes.push("Unemployment fell.");
  else if (next.unemployment > previous.unemployment + 0.2) notes.push("Unemployment rose.");
  else notes.push("Unemployment barely moved.");

  if (next.approval > previous.approval + 1) notes.push("Approval improved.");
  else if (next.approval < previous.approval - 1) notes.push("Approval slipped.");
  else notes.push("Approval stayed near flat.");

  if (next.netExports > previous.netExports + 0.2) notes.push("External balance improved.");
  else if (next.netExports < previous.netExports - 0.2) notes.push("External balance weakened.");

  if (next.sovereignYield > previous.sovereignYield + 0.35) notes.push("Bond investors demanded a higher yield.");
  else if (next.sovereignYield < previous.sovereignYield - 0.35) notes.push("Government borrowing costs eased.");

  if (next.bankingStress > previous.bankingStress + 2) notes.push("Banking stress rose as credit conditions tightened.");
  else if (next.bankingStress < previous.bankingStress - 2) notes.push("Credit conditions became calmer.");

  if (policies.bankRegulation > 6.5) notes.push("Bank regulation leaned safer, reducing crisis risk but limiting easy credit.");
  if (policies.investorTransparency > 6.5) notes.push("Transparent policy helped investor confidence.");
  if (policies.bondIssuance > 150) notes.push("Bond issuance funded policy room while adding debt-service risk.");
  if (policies.financialEducation > 4.5) notes.push("Financial literacy investment improved long-run household resilience.");
  if (policies.consumerCreditRules < 4) notes.push("Easy consumer credit lifted demand but increased default risk.");
  else if (policies.consumerCreditRules > 8) notes.push("Strict consumer credit rules reduced debt risk but cooled spending.");
  if (policies.depositInsurance > 6) notes.push("Deposit insurance reduced bank-run risk, but it added contingent public responsibility.");

  return notes.join(" ");
}

function citizenImpactSummary(previous: MacroState, next: MacroState) {
  const notes: string[] = [];

  if (next.inflation > 4.5) {
    notes.push("Households felt a clear squeeze as prices rose fast for everyday essentials.");
  } else if (next.inflation < 1) {
    notes.push("Prices were fairly calm, so families got some breathing room in weekly budgets.");
  } else {
    notes.push("Most families saw fairly stable prices in shops and bills.");
  }

  if (next.unemployment < previous.unemployment - 0.25) {
    notes.push("Job prospects improved and more households could feel safer about income.");
  } else if (next.unemployment > previous.unemployment + 0.25) {
    notes.push("Job insecurity increased, so more households worried about layoffs and weaker income.");
  } else {
    notes.push("The labor market felt steady, with no dramatic change in job security.");
  }

  if (next.poverty < previous.poverty - 0.2 && next.inequality < previous.inequality - 0.2) {
    notes.push("Lower-income households benefited most as pressure on poverty and inequality eased.");
  } else if (next.poverty > previous.poverty + 0.2 || next.inequality > previous.inequality + 0.3) {
    notes.push("The strain fell hardest on poorer households, and the gains were distributed less evenly.");
  }

  if (next.consumerConfidence > previous.consumerConfidence + 1.5) {
    notes.push("Consumers became more willing to spend rather than delay purchases.");
  } else if (next.consumerConfidence < previous.consumerConfidence - 1.5) {
    notes.push("Consumers turned more cautious and were more likely to cut back spending.");
  }

  return notes.join(" ");
}

function historyRow(current: MacroState, note: string, citizenImpact: string, score: number): HistoryEntry {
  return {
    year: current.calendarYear,
    growth: current.growth,
    unemployment: current.unemployment,
    inflation: current.inflation,
    budgetBalance: current.budgetBalance,
    debtRatio: current.debtRatio,
    netExports: current.netExports,
    sovereignYield: current.sovereignYield,
    currencyIndex: current.currencyIndex,
    equityMarket: current.equityMarket,
    bankingStress: current.bankingStress,
    householdDebt: current.householdDebt,
    defaultRisk: current.defaultRisk,
    approval: current.approval,
    score,
    note,
    citizenImpact
  };
}

function goalsAchieved(goals: ScenarioGoal[], current: MacroState) {
  return goals
    .filter((goal) => {
      const value = current[goal.metric];
      return goal.comparator === "gte" ? value >= goal.value : value <= goal.value;
    })
    .map((goal) => goal.label);
}

function dominantPressure(current: MacroState) {
  const pressures = [
    { topic: "inflation" as const, score: Math.abs(current.inflation - 2.3) + Math.max(0, current.inflation - 3.5) },
    { topic: "unemployment" as const, score: Math.max(0, current.unemployment - 4.6) + Math.max(0, 2 - current.growth) },
    { topic: "approval" as const, score: Math.max(0, 52 - current.approval) / 4 + Math.max(0, current.debtRatio - 90) / 30 },
    { topic: "markets" as const, score: Math.max(0, -current.budgetBalance - 4) / 2 + Math.max(0, current.debtRatio - 85) / 25 }
  ];

  return pressures.sort((a, b) => b.score - a.score)[0]?.topic ?? "approval";
}

function citizenGroupBreakdown(previous: MacroState, current: MacroState): CitizenGroupImpact[] {
  const workingFamilies: CitizenGroupImpact = {
    group: "Working families",
    effect:
      current.inflation > 4.5
        ? "Paychecks stretched less far as food, transport, and utilities rose faster than comfort levels."
        : current.inflation < 1.5
          ? "Stable prices gave household budgets more predictability and made routine expenses easier to plan."
          : "Budgets stayed manageable, though families still noticed the trade-off between stable prices and slower policy change.",
    tone: current.inflation > 4.5 ? "negative" : current.inflation < 1.5 ? "positive" : "mixed"
  };

  const jobseekers: CitizenGroupImpact = {
    group: "Jobseekers and younger workers",
    effect:
      current.unemployment < previous.unemployment - 0.25
        ? "The hiring climate improved, so entry-level and returning workers saw more openings and a better chance of mobility."
        : current.unemployment > previous.unemployment + 0.25
          ? "A tighter labor market left more applicants competing for fewer openings, especially those with less experience."
          : "The labor market felt steady, with enough hiring to avoid panic but not enough to feel generous.",
    tone: current.unemployment < previous.unemployment - 0.25 ? "positive" : current.unemployment > previous.unemployment + 0.25 ? "negative" : "mixed"
  };

  const lowerIncome: CitizenGroupImpact = {
    group: "Lower-income households",
    effect:
      current.poverty < previous.poverty - 0.15 && current.inequality < previous.inequality - 0.2
        ? "Transfers and job conditions eased the sharpest pressure, so the most vulnerable households felt some relief."
        : current.poverty > previous.poverty + 0.15 || current.inequality > previous.inequality + 0.25
          ? "The burden landed hardest here, where even small rises in prices or lost hours quickly turned into real hardship."
          : "Conditions did not dramatically improve, but they also avoided a broad deterioration among the most exposed households.",
    tone:
      current.poverty < previous.poverty - 0.15 && current.inequality < previous.inequality - 0.2
        ? "positive"
        : current.poverty > previous.poverty + 0.15 || current.inequality > previous.inequality + 0.25
          ? "negative"
          : "mixed"
  };

  const middleClass: CitizenGroupImpact = {
    group: "Savers, borrowers, and the middle class",
    effect:
      current.consumerConfidence > previous.consumerConfidence + 1.5
        ? "Confidence improved enough that households felt safer making larger purchases and longer-term plans."
        : current.consumerConfidence < previous.consumerConfidence - 1.5
          ? "Caution spread through household decisions, with more families delaying big purchases and holding tighter cash buffers."
          : "Most households stayed watchful rather than enthusiastic, waiting for clearer proof that the trend was durable.",
    tone:
      current.consumerConfidence > previous.consumerConfidence + 1.5
        ? "positive"
        : current.consumerConfidence < previous.consumerConfidence - 1.5
          ? "negative"
          : "mixed"
  };

  return [workingFamilies, jobseekers, lowerIncome, middleClass];
}

function criticismHeadline(topic: ReturnType<typeof dominantPressure>, current: MacroState, mandate: MandatePresentation) {
  const government = mandate.governmentLabel;
  const leader = mandate.officeTitle;
  const options = {
    inflation: [
      "An Administration of Great Conviction and Unhelpful Prices",
      `${government} Demonstrates Remarkable Faith That Families Will Ignore Arithmetic`,
      "Another Year of Elegant Speeches and Inconvenient Grocery Receipts"
    ],
    unemployment: [
      `The ${leader} Continues the Bold Experiment of Explaining Away Empty Paychecks`,
      "A Masterclass in Confidence, Lightly Interrupted by the Labor Market",
      "The Jobs Plan Remains Deeply Committed to Potential"
    ],
    approval: [
      `${government} Still Mistaking Endurance for Enthusiasm`,
      "The Public Once Again Fails to Appreciate the Administration's Self-Regard",
      "An Impressive Supply of Certainty Meets a Distinct Shortage of Gratitude"
    ],
    markets: [
      "Fiscal Improvisation Rebranded as Vision",
      `${government} Introduces a Fresh Theory of Discipline Without Restraint`,
      "Confidence in Command Remains Strongest Inside the Command Room"
    ]
  } satisfies Record<ReturnType<typeof dominantPressure>, string[]>;

  return chooseByIndex(options[topic], Math.round(current.approval + current.inflation + current.unemployment));
}

function criticismBody(topic: ReturnType<typeof dominantPressure>, previous: MacroState, current: MacroState, policies: Policies, scenario: Scenario) {
  const mix = buildPolicyMix(policies, scenario);
  const demandStance = demandLabel(mix.monetary + mix.fiscalDemand);
  const supplyStance = supplyLabel(mix.supply);
  const government = scenario.mechanics.mandate.governmentLabel;

  switch (topic) {
    case "inflation":
      return `Commentators noted that the administration pursued a ${demandStance} stance with the serene confidence of people who rarely buy their own groceries. Inflation moved from ${previous.inflation.toFixed(1)}% to ${current.inflation.toFixed(1)}%, which critics described as a sophisticated way of reminding households that theory and checkout lines do not always collaborate. The government's team insists this reflects discipline. Observers generously agreed that it certainly reflects something.`;
    case "unemployment":
      return `The ${government} spent the year speaking about resilience in the polished tone usually reserved for people not sending out their fiftieth job application. Unemployment closed at ${current.unemployment.toFixed(1)}%, and editorial writers suggested the administration has developed a rare talent for sounding decisive while the labor market remains unconvinced. The official line is that the foundations are improving. So, critics replied, is everyone's ability to recognize delayed progress dressed up as strategy.`;
    case "markets":
      return `Analysts described the policy mix as ${demandStance} on demand and ${supplyStance}, which is an impressive amount of movement for a government still trying to look as though every outcome was intentional. Debt reached ${current.debtRatio.toFixed(1)}% of GDP, and budget credibility remained a conversation piece rather than a settled fact. In fairness to the administration, few teams could make fiscal strain look this curated.`;
    default:
      return `The leader continued to govern with the kind of composure that suggests either admirable steadiness or a touching unfamiliarity with public irritation. Approval now sits at ${current.approval.toFixed(0)}%, and critics observed that the administration keeps asking voters to confuse endurance with affection. Advisers call that leadership under pressure. Less sentimental readers called it an advanced form of optimism.`;
  }
}

function buildRoundBriefing(previous: MacroState, current: MacroState, policies: Policies, scenario: Scenario): RoundBriefing {
  const leadTopic = dominantPressure(current);
  const policySummary = policyImpactSummary(previous, current, policies, scenario);
  const citizenSummary = citizenImpactSummary(previous, current);
  const theoryCard = buildTheoryCard(previous, current, policies);

  return {
    round: current.round,
    year: current.calendarYear,
    strapline: `Year ${current.round} closes with inflation at ${current.inflation.toFixed(1)}%, unemployment at ${current.unemployment.toFixed(1)}%, and approval at ${current.approval.toFixed(0)}%.`,
    policySummary,
    citizenSummary,
    citizenGroups: citizenGroupBreakdown(previous, current),
    criticismHeadline: criticismHeadline(leadTopic, current, scenario.mechanics.mandate),
    criticismBody: criticismBody(leadTopic, previous, current, policies, scenario),
    theoryCard
  };
}

function buildElectionNight(reelected: boolean, approval: number, scenario: Scenario): ElectionNight {
  const mandate = scenario.mechanics.mandate;
  const template = mandate.electionNight;
  const outcome = reelected ? "won" : "lost";
  const calls = template.calls[outcome];
  const seedVotes = template.seedVotes[outcome];
  const playerVotes =
    seedVotes.player +
    calls.filter((call) => call.winner === "player").reduce((sum, call) => sum + callValue(call), 0);
  const oppositionVotes =
    seedVotes.opposition +
    calls.filter((call) => call.winner === "opposition").reduce((sum, call) => sum + callValue(call), 0);

  return {
    model: mandate.electionModel,
    headline: reelected ? template.headlineWon : template.headlineLost,
    intro: approvalTemplate(template.intro, approval),
    totalSeconds: template.totalSeconds,
    targetLabel: template.targetLabel,
    voteUnitLabel: template.voteUnitLabel,
    voteUnitShortLabel: template.voteUnitShortLabel,
    playerLabel: template.playerLabel,
    oppositionLabel: template.oppositionLabel,
    playerCallLabel: template.playerCallLabel,
    oppositionCallLabel: template.oppositionCallLabel,
    callGroupLabel: template.callGroupLabel,
    liveCountLabel: template.liveCountLabel,
    finalCountLabel: template.finalCountLabel,
    pendingCallCopy: template.pendingCallCopy,
    interimDeskCopy: template.interimDeskCopy,
    settledWinCopy: template.settledWinCopy,
    settledLossCopy: template.settledLossCopy,
    targetVotes: template.targetVotes,
    playerVotes,
    oppositionVotes,
    calls,
    outcome,
    closingMessage: reelected ? template.winCopy : template.lossCopy
  };
}

export function rankTitle(score: number) {
  if (score >= 130) return "Economic Legend";
  if (score >= 112) return "National Architect";
  if (score >= 96) return "Majority Builder";
  if (score >= 78) return "Cabinet Closer";
  return "Policy Staffer";
}

export function createRun(
  scenarioId: string,
  difficultyId: DifficultyId,
  opts?: { challengeId?: string; policyComplexity?: PolicyComplexity; learningMode?: LearningMode }
): RunState {
  const scenario = getScenario(scenarioId);
  const difficulty = getDifficulty(difficultyId);
  const politicalPressure = scenario.mechanics.politicalPressure;
  const mandate = scenario.mechanics.mandate;
  const current = deriveInitialState(scenario, difficultyId);
  const score = scoreEntry(current.growth, current.unemployment, current.inflation, current.approval);
  const approvalFloor = clamp(difficulty.approvalFloor + politicalPressure.approvalFloorShift, 25, 52);
  const reelectionRound = politicalPressure.reelectionRound ?? REELECTION_ROUND;
  const reelectionThreshold = politicalPressure.reelectionThreshold;

  return {
    version: 2,
    runId: crypto.randomUUID(),
    scenarioId,
    challengeId: opts?.challengeId,
    scenarioTitle: scenario.title,
    difficultyId,
    policyComplexity: opts?.policyComplexity ?? DEFAULT_POLICY_COMPLEXITY,
    learningMode: opts?.learningMode ?? "learning",
    learningLevelId: scenarioLearningLevel(scenario),
    offerTier: scenario.offerTier,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    inaugurationAcknowledged: false,
    maxRounds: MAX_ROUNDS,
    approvalFloor,
    reelectionRound,
    reelectionThreshold,
    reelected: null,
    complete: false,
    victory: false,
    score,
    rankTitle: rankTitle(score),
    policies: defaultPolicies(),
    current,
    history: [
      historyRow(
        current,
        "Inherited macro baseline from the selected historical administration.",
        "Families begin your reign carrying the living-cost, job, and confidence conditions of the selected historical starting point.",
        score
      )
    ],
    milestoneNotes: [
      scenario.summary,
      scenario.mechanics.summary,
      `Primary goal: ${scenario.goals[0]?.label ?? "Finish the mandate with a strong record."}`,
      ...scenario.mechanics.notes.slice(0, 2),
      `${mandate.checkpointVerb.charAt(0).toUpperCase() + mandate.checkpointVerb.slice(1)} after round ${reelectionRound} with at least ${reelectionThreshold}% approval.`,
      `Avoid impeachment by staying above ${approvalFloor}% approval.`
    ],
    goalsAchieved: [],
    summary: undefined
  };
}

export function updatePolicies(run: RunState, partial: Partial<Policies>): RunState {
  return {
    ...run,
    policies: { ...run.policies, ...partial },
    updatedAt: new Date().toISOString()
  };
}

function finalScore(history: HistoryEntry[], multiplier: number) {
  const avgGrowth = average(history.map((item) => item.growth));
  const avgUnemployment = average(history.map((item) => item.unemployment));
  const avgInflation = average(history.map((item) => item.inflation));
  const avgApproval = average(history.map((item) => item.approval));
  const avgDebt = average(history.map((item) => item.debtRatio ?? 75));
  const avgBondYield = average(history.map((item) => item.sovereignYield ?? 4));
  const avgEquityMarket = average(history.map((item) => item.equityMarket ?? 90));
  const avgBankingStress = average(history.map((item) => item.bankingStress ?? 25));
  const financeAdjustment =
    10 +
    Math.max(0, avgEquityMarket - 90) * 0.04 -
    Math.max(0, avgDebt - 90) * 0.12 -
    Math.max(0, avgBondYield - 5) * 1.7 -
    Math.max(0, avgBankingStress - 35) * 0.18;
  return (scoreEntry(avgGrowth, avgUnemployment, avgInflation, avgApproval) + financeAdjustment) * multiplier;
}

export function compareToBenchmarks(score: number, country: string) {
  const entries = getBenchmarksForCountry(country).sort((a, b) => b.score - a.score);

  const nearest =
    entries.reduce((best, entry) => {
      const gap = Math.abs(entry.score - score);
      if (!best || gap < best.gap) return { name: entry.name, gap };
      return best;
    }, null as null | { name: string; gap: number })?.name ?? "Benchmark leader";

  return { entries, nearest };
}

export function buildBenchmarkPlacement(candidate: {
  name: string;
  score: number;
}, country: string) {
  return [
    ...getBenchmarksForCountry(country).map((item) => ({
      country: item.country,
      name: item.name,
      officeLabel: item.officeLabel,
      score: item.score,
      isPlayer: false
    })),
    { country, officeLabel: "Player", ...candidate, isPlayer: true }
  ]
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function advanceRun(run: RunState): RunState {
  if (run.complete) return run;

  const scenario = getScenario(run.scenarioId);
  const difficulty = getDifficulty(run.difficultyId);
  const politicalPressure = scenario.mechanics.politicalPressure;
  const mandate = scenario.mechanics.mandate;
  const externalBalance = scenario.mechanics.externalBalance;
  const policyTradeoffs = scenario.mechanics.policyTradeoffs;
  const reelectionRound = run.reelectionRound ?? REELECTION_ROUND;
  const reelectionThreshold = run.reelectionThreshold ?? REELECTION_THRESHOLD;
  const current = run.current;
  const policies = run.policies;
  const mix = buildPolicyMix(policies, scenario);
  const open = scenario.mode === "open";
  const easyCredit = 5 - policies.consumerCreditRules;
  const strictCredit = policies.consumerCreditRules - 5;
  const bankSafety = policies.bankRegulation - 5;
  const confidencePolicy = policies.investorTransparency - 5;
  const financeEducation = policies.financialEducation - 3;
  const debtIssuancePressure = policies.bondIssuance / 100;
  const depositTrust = policies.depositInsurance - 4;

  const nextPotentialGrowth = clamp(
    current.potentialGrowth +
      mix.supply * 0.11 +
      financeEducation * 0.012 +
      confidencePolicy * 0.006 -
      Math.max(0, bankSafety - 2) * 0.01 -
      Math.max(0, current.policyCredibility - 55) * 0.004 -
      Math.max(0, current.debtRatio - 110) * 0.004 * difficulty.debtSensitivity,
    1.2,
    4.5
  );

  const confidencePulse =
    (current.consumerConfidence - 50) * 0.018 + (current.businessConfidence - 50) * 0.018;

  const nextOutputGap = clamp(
    current.outputGap * 0.46 +
      mix.monetary +
      mix.fiscalDemand +
      confidencePulse -
      Math.max(0, bankSafety - 1) * 0.025 +
      Math.max(0, easyCredit) * 0.04 -
      Math.max(0, current.debtRatio - 105) * 0.01 * difficulty.debtSensitivity,
    -5.2,
    5.2
  );

  const nextGrowth = clamp(
    (nextPotentialGrowth + nextOutputGap * 0.84 + mix.supply * 0.16) * difficulty.growthMultiplier,
    -5.5,
    8.5
  );

  const nextNaturalUnemployment = clamp(
    current.naturalUnemployment -
      (policies.educationTraining - 3) * 0.08 * policyTradeoffs.supplyResponse -
      financeEducation * 0.035 * policyTradeoffs.supplyResponse -
      (policies.marketReforms - 5) * 0.05 * (0.7 + policyTradeoffs.supplyResponse * 0.3) +
      Math.max(0, policies.indirectTaxRate - 6) * 0.01 * externalBalance.importPassThrough,
    3.4,
    7
  );

  const nextInflation = clamp(
    (current.inflation * 0.42 +
      1.15 +
      nextOutputGap * 0.55 +
      mix.inflation -
      mix.supply * 0.18 -
      Math.max(0, policies.interestRate - 4.5) * 0.1 * policyTradeoffs.monetaryTransmission +
      Math.max(0, policies.reserveRequirement - 10) * 0.02 * policyTradeoffs.reserveTransmission -
      Math.max(0, 10 - policies.reserveRequirement) * 0.03 * policyTradeoffs.reserveTransmission +
      (policies.bondPurchases / 900) * policyTradeoffs.monetaryTransmission +
      (open ? Math.max(0, -current.netExports) * 0.025 * externalBalance.importPassThrough : 0) +
      (open ? Math.max(0, 50 - current.competitiveness) * 0.015 * externalBalance.importPassThrough : 0) +
      (100 - current.policyCredibility) * 0.01) *
      difficulty.inflationMultiplier,
    -1.5,
    15
  );

  const nextUnemployment = clamp(
    current.unemployment -
      0.34 * (nextGrowth - nextPotentialGrowth) +
      Math.max(0, nextNaturalUnemployment - current.naturalUnemployment) * 0.35 +
      Math.max(0, nextInflation - 8) * 0.04,
    2.5,
    15.5
  );

  const revenue =
    17.1 +
    (policies.incomeTaxRate - 22) * 0.56 +
    (policies.indirectTaxRate - 6) * 0.34 +
    nextGrowth * 0.16;
  const spending =
    17 +
    (policies.currentSpending - 19) * 0.76 +
    (policies.transferPayments - 4) * 0.68 +
    (policies.capitalSpending - 3) * 0.56 +
    (policies.educationTraining - 3) * 0.46 +
    financeEducation * 0.28 +
    Math.max(0, bankSafety) * 0.08 +
    Math.max(0, confidencePolicy) * 0.06 +
    Math.max(0, nextUnemployment - 5.5) * 0.18;
  const nextBudget = clamp(revenue - spending, -18, 7);

  const nextDebt = clamp(
    current.debtRatio -
      nextBudget +
      Math.max(0, policies.interestRate - nextGrowth) * 0.05 * difficulty.debtSensitivity -
      Math.max(0, policies.bondPurchases) * 0.002 +
      debtIssuancePressure * 1.1 -
      (nextGrowth + nextInflation) * 0.2,
    20,
    220
  );

  const nextProductivity = clamp(
    current.productivity +
      (policies.capitalSpending - 3) * 0.08 * policyTradeoffs.supplyResponse +
      (policies.educationTraining - 3) * 0.11 * policyTradeoffs.supplyResponse +
      financeEducation * 0.045 * policyTradeoffs.supplyResponse +
      (policies.marketReforms - 5) * 0.03 * policyTradeoffs.supplyResponse,
    0.6,
    5.4
  );

  const nextInequality = clamp(
    current.inequality +
      Math.max(0, nextUnemployment - 5.1) * 0.34 +
      Math.max(0, nextInflation - 4) * 0.08 -
      (policies.transferPayments - 4) * 0.75 * policyTradeoffs.transferEffectiveness -
      (policies.incomeTaxRate - 22) * 0.16 * policyTradeoffs.taxSensitivity -
      (policies.educationTraining - 3) * 0.16 * policyTradeoffs.transferEffectiveness +
      financeEducation * -0.11 * policyTradeoffs.transferEffectiveness +
      Math.max(0, 3 - policies.consumerCreditRules) * 0.18 +
      (policies.marketReforms - 5) * 0.14 * policyTradeoffs.reformEquityCost,
    28,
    76
  );

  const nextPoverty = clamp(
    current.poverty +
      Math.max(0, nextUnemployment - 4.8) * 0.45 +
      Math.max(0, nextInflation - 3.5) * 0.09 -
      (policies.transferPayments - 4) * 0.55 * policyTradeoffs.transferEffectiveness -
      financeEducation * 0.08 * policyTradeoffs.transferEffectiveness -
      Math.max(0, nextGrowth - 1.5) * 0.08,
    4,
    30
  );

  const nextCredibility = clamp(
    current.policyCredibility * 0.6 +
      20 +
      (3.4 - Math.abs(nextInflation - 2.3)) * 4 -
      Math.max(0, -nextBudget - 7) * 0.55 -
      Math.abs(policies.interestRate - 4.5) * 0.8 -
      Math.max(0, policies.bondPurchases - 250) * 0.018 -
      Math.max(0, policies.bondIssuance - 150) * 0.018 +
      confidencePolicy * 2.2 +
      Math.max(0, bankSafety) * 0.9 +
      Math.max(0, depositTrust) * 0.8 -
      Math.max(0, depositTrust - 4) * 0.35 +
      financeEducation * 0.7 -
      Math.max(0, -easyCredit - 3) * 0.35 -
      Math.max(0, easyCredit - 2) * 1.2,
    10,
    95
  );

  const nextCompetitiveness = open
    ? clamp(
        current.competitiveness * 0.55 +
          23 +
          nextProductivity * 5 * difficulty.competitivenessMultiplier * externalBalance.competitivenessWeight -
          nextInflation * 1.7 * externalBalance.importPassThrough -
          Math.max(0, nextOutputGap) * 0.8 * externalBalance.tradeSensitivity -
          (policies.indirectTaxRate - 6) * 0.5,
        20,
        86
      )
    : current.competitiveness;

  const nextExternalDemand = open
    ? clamp(current.externalDemand * (0.9 - externalBalance.tradeSensitivity * 0.02) + 6 * externalBalance.tradeSensitivity, 36, 66)
    : current.externalDemand;
  const nextNetExports = open
    ? clamp(
        current.netExports * (0.42 + externalBalance.tradeSensitivity * 0.06) +
          (nextCompetitiveness - 50) * 0.08 * externalBalance.competitivenessWeight -
          nextOutputGap * 0.28 * externalBalance.tradeSensitivity +
          (nextExternalDemand - 50) * 0.05 * externalBalance.tradeSensitivity,
        -10,
        4
      )
    : 0;

  const nextConsumerConfidence = clamp(
    current.consumerConfidence * 0.52 +
      24 +
      nextGrowth * 1.45 -
      Math.abs(nextInflation - 2.3) * 1.2 -
      Math.max(0, nextUnemployment - 6) * 1 -
      Math.max(0, -nextBudget - 8) * 0.25 -
      Math.max(0, easyCredit) * 0.6 -
      Math.max(0, strictCredit - 2) * 0.42 +
      Math.max(0, depositTrust) * 0.25 +
      financeEducation * 0.55 +
      (open ? Math.max(0, -nextNetExports) * 0.2 * externalBalance.approvalWeight : 0),
    10,
    90
  );

  const nextBusinessConfidence = clamp(
    current.businessConfidence * 0.54 +
      23 +
      nextGrowth * 1.35 -
      (policies.incomeTaxRate - 22) * 0.18 * policyTradeoffs.taxSensitivity -
      (policies.interestRate - 4.5) * 0.7 * policyTradeoffs.monetaryTransmission -
      (policies.reserveRequirement - 10) * 0.45 * policyTradeoffs.reserveTransmission +
      (policies.bondPurchases / 120) * policyTradeoffs.monetaryTransmission +
      Math.abs(nextInflation - 2.3) * 0.85 +
      (policies.marketReforms - 5) * 0.8 * policyTradeoffs.supplyResponse +
      confidencePolicy * 1.35 -
      Math.max(0, bankSafety - 1) * 0.72 +
      Math.max(0, easyCredit) * 0.55 -
      Math.max(0, strictCredit - 2) * 0.62 +
      Math.max(0, depositTrust) * 0.25 -
      Math.max(0, depositTrust - 4) * 0.2 +
      (open ? nextNetExports * 0.6 * externalBalance.tradeSensitivity : 0),
    10,
    90
  );

  const nextSovereignYield = clamp(
    current.sovereignYield * 0.45 +
      1.2 +
      nextInflation * 0.22 +
      Math.max(0, nextDebt - 70) * 0.035 +
      Math.max(0, -nextBudget) * 0.2 +
      policies.interestRate * 0.32 -
      nextCredibility * 0.022 -
      Math.max(0, policies.bondPurchases) * 0.0025 +
      Math.max(0, policies.bondIssuance) * 0.0045 -
      confidencePolicy * 0.06 -
      Math.max(0, bankSafety) * 0.035,
    0.35,
    22
  );
  const nextCurrencyIndex = clamp(
    current.currencyIndex * 0.48 +
      52 +
      nextNetExports * 1.25 * externalBalance.tradeSensitivity +
      (nextCompetitiveness - 50) * 0.22 +
      (policies.interestRate - 4.5) * 0.85 -
      Math.max(0, nextInflation - 3) * 1.2 -
      Math.max(0, nextDebt - 95) * 0.08 +
      confidencePolicy * 0.75 -
      Math.max(0, easyCredit - 2) * 0.55 -
      Math.max(0, policies.bondIssuance - 250) * 0.015,
    35,
    145
  );
  const nextBankingStress = clamp(
    current.bankingStress * 0.46 +
      15 +
      Math.max(0, nextUnemployment - 5.2) * 1.5 +
      Math.max(0, nextInflation - 5) * 1.1 +
      Math.max(0, nextSovereignYield - 5) * 1.9 +
      Math.max(0, policies.reserveRequirement - 10) * 0.9 -
      Math.max(0, policies.bondPurchases) * 0.006 -
      bankSafety * 1.25 -
      Math.max(0, depositTrust) * 1.35 +
      Math.max(0, depositTrust - 4) * 0.45 -
      financeEducation * 0.9 +
      Math.max(0, easyCredit - 1) * 1.3 +
      Math.max(0, strictCredit - 3) * 0.55 -
      confidencePolicy * 0.45 -
      nextConsumerConfidence * 0.08,
    3,
    96
  );
  const nextHouseholdDebt = clamp(
    current.householdDebt * 0.58 +
      31 +
      Math.max(0, easyCredit) * 4.6 -
      Math.max(0, strictCredit) * 2.6 -
      financeEducation * 1.7 -
      Math.max(0, policies.interestRate - 5) * 0.8 +
      Math.max(0, nextGrowth - 2) * 1.1 +
      Math.max(0, nextUnemployment - 6) * 0.9,
    20,
    180
  );
  const nextDefaultRisk = clamp(
    current.defaultRisk * 0.46 +
      7 +
      Math.max(0, nextHouseholdDebt - 80) * 0.16 +
      Math.max(0, nextUnemployment - 5.2) * 1.6 +
      Math.max(0, nextInflation - 4) * 0.9 +
      Math.max(0, nextSovereignYield - 5) * 1.2 -
      financeEducation * 1.1 -
      Math.max(0, bankSafety) * 0.65 -
      Math.max(0, depositTrust) * 0.35,
    1,
    72
  );
  const nextEquityMarket = clamp(
    current.equityMarket * 0.5 +
      48 +
      nextGrowth * 5.6 +
      nextBusinessConfidence * 0.36 +
      nextProductivity * 2.4 -
      nextSovereignYield * 2.1 -
      nextBankingStress * 0.42 -
      Math.max(0, nextInflation - 4) * 1.4 +
      confidencePolicy * 1.8 +
      Math.max(0, policies.bondIssuance) * 0.018 -
      Math.max(0, bankSafety - 2) * 0.75 -
      nextDefaultRisk * 0.22 -
      Math.max(0, strictCredit - 2) * 0.7,
    25,
    180
  );

  const approvalDelta =
      nextGrowth * 1.1 -
      Math.max(0, nextUnemployment - 5) * 1.45 -
      Math.abs(nextInflation - 2.3) * 0.95 -
      Math.max(0, nextDebt - 110) * 0.04 * difficulty.debtSensitivity -
      Math.max(0, nextInequality - 46) * 0.08 -
      Math.max(0, nextPoverty - 12) * 0.14 +
      (nextCredibility - current.policyCredibility) * 0.08 +
      (nextEquityMarket - current.equityMarket) * 0.018 -
      Math.max(0, nextSovereignYield - 7) * 0.22 -
      Math.max(0, nextBankingStress - 55) * 0.08 +
      Math.max(0, nextDefaultRisk - 25) * -0.06 +
      financeEducation * 0.08 +
      (open ? nextNetExports * 0.32 * externalBalance.approvalWeight : 0) -
      current.round * politicalPressure.incumbencyDrag;

  const nextApproval = clamp(
    current.approval + approvalDelta * politicalPressure.approvalVolatility,
    5,
    88
  );

  const nextCurrent: MacroState = {
    round: current.round + 1,
    calendarYear: current.calendarYear + 1,
    approval: nextApproval,
    growth: nextGrowth,
    potentialGrowth: nextPotentialGrowth,
    outputGap: nextOutputGap,
    unemployment: nextUnemployment,
    naturalUnemployment: nextNaturalUnemployment,
    inflation: nextInflation,
    budgetBalance: nextBudget,
    debtRatio: nextDebt,
    netExports: nextNetExports,
    inequality: nextInequality,
    poverty: nextPoverty,
    consumerConfidence: nextConsumerConfidence,
    businessConfidence: nextBusinessConfidence,
    policyCredibility: nextCredibility,
    productivity: nextProductivity,
    competitiveness: nextCompetitiveness,
    externalDemand: nextExternalDemand,
    sovereignYield: nextSovereignYield,
    currencyIndex: nextCurrencyIndex,
    equityMarket: nextEquityMarket,
    bankingStress: nextBankingStress,
    householdDebt: nextHouseholdDebt,
    defaultRisk: nextDefaultRisk
  };

  const roughScore = scoreEntry(nextGrowth, nextUnemployment, nextInflation, nextApproval);
  const briefing = buildRoundBriefing(current, nextCurrent, policies, scenario);
  const failedReelection = nextCurrent.round === reelectionRound && nextApproval < reelectionThreshold;
  const reelectionWon = nextCurrent.round === reelectionRound && nextApproval >= reelectionThreshold;
  const electionNight =
    nextCurrent.round === reelectionRound ? buildElectionNight(reelectionWon, nextApproval, scenario) : null;
  const nextHistory = [
    ...run.history,
    {
      ...historyRow(
        nextCurrent,
        policyImpactSummary(current, nextCurrent, policies, scenario),
        citizenImpactSummary(current, nextCurrent),
        roughScore
      ),
      briefing,
      electionNight
    }
  ];
  const goals = goalsAchieved(scenario.goals, nextCurrent);
  const score = finalScore(nextHistory, difficulty.scoreMultiplier);
  const impeached = nextApproval < run.approvalFloor && !failedReelection;
  const reelected = failedReelection
    ? false
    : nextCurrent.round >= reelectionRound
      ? run.reelected ?? true
      : run.reelected ?? null;
  const victory = nextCurrent.round >= MAX_ROUNDS && nextApproval >= run.approvalFloor;
  const complete = victory || impeached || failedReelection;
  const summary = complete
    ? victory
      ? `You completed the full mandate and landed closest to ${compareToBenchmarks(score, scenario.country).nearest}.`
      : failedReelection
        ? `You lost the ${mandate.checkpointLabel.toLowerCase()} after four years because approval fell below ${reelectionThreshold}%.`
        : `You were forced from office after approval fell below ${run.approvalFloor}%.`
    : run.summary;

  const milestone =
    nextCurrent.round === reelectionRound
      ? failedReelection
        ? `${mandate.checkpointLabel}: you fell short with ${nextApproval.toFixed(0)}% approval.`
        : `${mandate.checkpointLabel}: you cleared the test with ${nextApproval.toFixed(0)}% approval.`
      : impeached
        ? `Impeachment triggered after approval crashed to ${nextApproval.toFixed(0)}%.`
      : nextCurrent.round === MAX_ROUNDS
        ? "Final round resolved."
        : `Round ${nextCurrent.round} settled with ${nextApproval.toFixed(0)} approval.`;

  return {
    ...run,
    updatedAt: new Date().toISOString(),
    complete,
    victory,
    score,
    rankTitle: rankTitle(score),
    reelectionRound,
    reelectionThreshold,
    reelected,
    current: nextCurrent,
    history: nextHistory,
    goalsAchieved: goals,
    summary,
    milestoneNotes: [...run.milestoneNotes, milestone]
  };
}
