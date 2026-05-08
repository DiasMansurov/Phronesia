import type { LearningLevelId, Policies, TheoryCard } from "@/lib/game/types";

type TheoryRule = {
  id: string;
  actionName: string;
  title: string;
  keyConcept: string;
  relatedGlossaryTerms: string[];
  difficultyLevel: LearningLevelId;
  matchScore: (policies: Policies) => number;
  whatHappened: string;
  explanation: string;
  learnMore: string;
};

export const GLOSSARY_TERMS = [
  {
    term: "Aggregate demand",
    definition:
      "Total spending on an economy's goods and services: consumption, investment, government spending, and net exports."
  },
  {
    term: "Aggregate supply",
    definition:
      "The economy's productive capacity. Better infrastructure, skills, technology, and competition can raise it over time."
  },
  {
    term: "Inflation",
    definition: "A rise in the general price level. High inflation reduces purchasing power because money buys less than before."
  },
  {
    term: "Unemployment",
    definition:
      "The share of workers who want a job but cannot find one. Policy can reduce it, but pushing demand too hard may raise inflation."
  },
  {
    term: "GDP growth",
    definition: "The rate at which the economy produces more goods and services. Growth usually helps jobs and confidence."
  },
  {
    term: "Consumption",
    definition:
      "Household spending on goods and services. Taxes, interest rates, confidence, and credit conditions can all change consumption."
  },
  {
    term: "Investment",
    definition:
      "Spending by businesses or government that increases productive capacity or future income."
  },
  {
    term: "Government spending",
    definition:
      "Public spending on services, transfers, infrastructure, and investment. It directly affects aggregate demand."
  },
  {
    term: "Fiscal policy",
    definition: "Government choices about taxes, spending, transfers, borrowing, and public investment."
  },
  {
    term: "Monetary policy",
    definition: "Central-bank choices such as interest rates, reserve rules, and bond purchases."
  },
  {
    term: "Money supply",
    definition:
      "The amount of money available in the economy. If it grows much faster than real output, inflation risk can rise."
  },
  {
    term: "Interest rates",
    definition: "The price of borrowing money. Higher rates can cool inflation but make loans and investment more expensive."
  },
  {
    term: "Budget deficit",
    definition: "When government spending is greater than government revenue in a year."
  },
  {
    term: "National debt",
    definition: "The total amount the government owes from past borrowing."
  },
  {
    term: "Stock market",
    definition: "A market for ownership shares in companies. It often reacts to expected profits, interest rates, and confidence."
  },
  {
    term: "Bonds",
    definition: "Loans made to governments or companies. Bond buyers receive interest, and risky borrowers must pay higher yields."
  },
  {
    term: "Bond yields",
    definition: "The return investors demand for lending money to the government. Higher yields make debt more expensive."
  },
  {
    term: "Exchange rate",
    definition: "The value of one currency compared with another. A weaker currency can make imports costlier and exports cheaper."
  },
  {
    term: "Investor confidence",
    definition: "How willing investors are to hold a country's assets. It falls when debt, inflation, or crisis risk look unsafe."
  },
  {
    term: "Banking stability",
    definition: "How safe the banking and credit system looks. It weakens when defaults, bond losses, or risky lending rise."
  },
  {
    term: "Deposit insurance",
    definition:
      "A promise that household bank deposits are protected if a bank fails. It can prevent panic, but it must be paired with supervision."
  },
  {
    term: "Bank run",
    definition:
      "A panic where many depositors try to withdraw money at once because they fear a bank may fail."
  },
  {
    term: "Consumer credit",
    definition:
      "Loans to households, such as credit cards, auto loans, and consumer borrowing. It can support spending but create default risk."
  },
  {
    term: "Financial stability",
    definition:
      "The ability of banks, markets, borrowers, and investors to keep functioning without a damaging credit or confidence crisis."
  },
  {
    term: "Financial literacy",
    definition:
      "The ability to understand saving, borrowing, investing, inflation, diversification, and risk."
  },
  {
    term: "Household savings",
    definition:
      "Money households keep for the future. Inflation reduces its purchasing power, while sound financial choices can protect it."
  },
  {
    term: "Household debt",
    definition:
      "Money owed by households through mortgages, credit cards, and consumer loans. It can support spending but becomes dangerous when repayment risk rises."
  },
  {
    term: "Credit rating",
    definition: "An assessment of how risky it is to lend to a borrower. A weaker rating can push borrowing costs higher."
  },
  {
    term: "Diversification",
    definition: "Holding different assets so one bad outcome does not determine the whole portfolio."
  },
  {
    term: "Recession",
    definition: "A period when economic activity falls or stays weak. Recessions usually raise unemployment and reduce confidence."
  }
];

export const THEORY_CARD_RULES: TheoryRule[] = [
  {
    id: "decrease-taxes",
    actionName: "Decrease taxes",
    title: "Why can lower taxes increase demand?",
    keyConcept: "aggregate demand",
    relatedGlossaryTerms: ["Fiscal policy", "Aggregate demand", "Consumption", "Budget deficit"],
    difficultyLevel: "basic",
    matchScore: (policies) => Math.max(0, 21 - policies.incomeTaxRate),
    whatHappened:
      "Households kept more income after taxes, so consumption pressure increased. Growth and jobs can improve, but inflation and the deficit may rise.",
    explanation:
      "Lower taxes increase disposable income, meaning households have more money after paying taxes. When households spend more, consumption rises, and consumption is one component of aggregate demand. If the economy has spare capacity, real GDP can grow and unemployment can fall. If demand rises too quickly, inflation and the budget deficit can increase.",
    learnMore:
      "In AD-AS terms, lower taxes usually shift aggregate demand to the right. The short-run effect is stronger when confidence is low and unemployment is high."
  },
  {
    id: "increase-taxes",
    actionName: "Increase taxes",
    title: "Why can higher taxes slow inflation?",
    keyConcept: "fiscal policy",
    relatedGlossaryTerms: ["Fiscal policy", "Aggregate demand", "Consumption", "Budget deficit"],
    difficultyLevel: "basic",
    matchScore: (policies) => Math.max(0, policies.incomeTaxRate - 24),
    whatHappened:
      "Households had less disposable income, so consumption pressure weakened. That can cool inflation, but growth and jobs may slow.",
    explanation:
      "Higher taxes reduce disposable income, so households usually spend less. Lower consumption reduces aggregate demand. This can ease inflation pressure and improve the government budget if spending is controlled, but weaker demand may slow GDP growth and increase unemployment.",
    learnMore:
      "Tax increases are contractionary fiscal policy when they reduce private spending more than they improve confidence."
  },
  {
    id: "increase-spending",
    actionName: "Increase government spending",
    title: "Why can spending raise GDP and inflation?",
    keyConcept: "government spending",
    relatedGlossaryTerms: ["Fiscal policy", "Aggregate demand", "Inflation", "National debt"],
    difficultyLevel: "basic",
    matchScore: (policies) => Math.max(0, policies.currentSpending - 20.5) + Math.max(0, policies.transferPayments - 5.5),
    whatHappened:
      "Government demand entered the economy directly. GDP and employment can improve, but debt and inflation risk can rise.",
    explanation:
      "Government spending is itself a component of aggregate demand. More spending can increase output and reduce unemployment, especially during a recession. But if the economy is already close to full capacity, extra demand can push prices up. If spending is financed by borrowing, government debt may also rise.",
    learnMore:
      "Fiscal stimulus is most useful when demand is weak. It is riskier when inflation is already high or the debt path looks unsustainable."
  },
  {
    id: "decrease-spending",
    actionName: "Decrease government spending",
    title: "Why can spending cuts reduce demand?",
    keyConcept: "budget deficit",
    relatedGlossaryTerms: ["Fiscal policy", "Aggregate demand", "Budget deficit", "Unemployment"],
    difficultyLevel: "basic",
    matchScore: (policies) => Math.max(0, 17.5 - policies.currentSpending),
    whatHappened:
      "Public demand weakened, helping the budget and inflation pressure. The cost is that growth and employment may suffer.",
    explanation:
      "Lower government spending reduces aggregate demand. This can help reduce inflation and improve the budget balance, but it may also slow economic growth and increase unemployment. Cutting spending too quickly is especially risky when the economy is already weak.",
    learnMore:
      "Austerity can restore debt credibility, but the timing matters because weak demand can make the debt ratio harder to improve."
  },
  {
    id: "increase-rates",
    actionName: "Increase interest rates",
    title: "Why do higher rates cool demand?",
    keyConcept: "interest rates",
    relatedGlossaryTerms: ["Monetary policy", "Interest rates", "Inflation", "Exchange rate"],
    difficultyLevel: "policy",
    matchScore: (policies) => Math.max(0, policies.interestRate - 5.2),
    whatHappened:
      "Borrowing became more expensive. Inflation pressure can fall, but loans, investment, jobs, and stocks may weaken.",
    explanation:
      "Higher interest rates make borrowing more expensive for consumers and businesses. This reduces consumption and investment, so aggregate demand shifts left. Inflation may fall, but unemployment can rise and GDP growth may slow. Higher rates can also strengthen the currency because investors may prefer assets that pay higher returns.",
    learnMore:
      "Central banks use interest rates to influence demand, inflation expectations, exchange rates, and credit conditions."
  },
  {
    id: "decrease-rates",
    actionName: "Decrease interest rates",
    title: "Why can lower rates lift borrowing?",
    keyConcept: "monetary policy",
    relatedGlossaryTerms: ["Monetary policy", "Interest rates", "Investment", "Stock market"],
    difficultyLevel: "policy",
    matchScore: (policies) => Math.max(0, 3.6 - policies.interestRate),
    whatHappened:
      "Credit became cheaper. Demand, investment, and stocks can rise, while inflation and currency pressure can also increase.",
    explanation:
      "Lower interest rates make borrowing cheaper. This encourages households to spend and businesses to invest, increasing aggregate demand. GDP may grow and unemployment may fall, but inflation may increase if demand becomes too strong. Lower rates can also weaken the currency if investors expect lower returns.",
    learnMore:
      "Rate cuts are most powerful when banks are willing to lend and households are confident enough to borrow."
  },
  {
    id: "money-expansion",
    actionName: "Print money / expansionary monetary policy",
    title: "Why can money creation raise inflation risk?",
    keyConcept: "money supply",
    relatedGlossaryTerms: ["Monetary policy", "Inflation", "Exchange rate", "Investor confidence"],
    difficultyLevel: "policy",
    matchScore: (policies) => Math.max(0, (policies.bondPurchases - 175) / 80),
    whatHappened:
      "Liquidity support made borrowing conditions easier. It can help in a slump, but too much money creation can weaken currency confidence.",
    explanation:
      "Increasing the money supply can stimulate demand in the short term because more money is available for spending and lending. But if money supply grows faster than real output, inflation can rise. Excessive monetary expansion can reduce confidence in the currency.",
    learnMore:
      "Bond purchases can lower yields and support liquidity, but credibility matters: investors ask whether money growth is temporary or uncontrolled."
  },
  {
    id: "supply-investment",
    actionName: "Supply-side investment",
    title: "Why does supply policy work slowly?",
    keyConcept: "aggregate supply",
    relatedGlossaryTerms: ["Aggregate supply", "Investment", "GDP growth", "Unemployment"],
    difficultyLevel: "policy",
    matchScore: (policies) => Math.max(0, policies.capitalSpending - 4.2) + Math.max(0, policies.educationTraining - 4.2),
    whatHappened:
      "The economy's productive capacity improved. The payoff is slower than stimulus but healthier for long-term growth.",
    explanation:
      "Investment in education, infrastructure, technology, or productivity can increase long-term productive capacity. This can shift aggregate supply to the right, allowing the economy to grow without creating as much inflation. Supply-side policies usually take longer to show results.",
    learnMore:
      "Strong supply policy can raise potential GDP, reduce structural unemployment, and make inflation control less painful."
  },
  {
    id: "bank-regulation",
    actionName: "Regulate banks",
    title: "Why can stronger bank rules reduce crisis risk?",
    keyConcept: "banking stability",
    relatedGlossaryTerms: ["Banking stability", "Consumer credit", "Investment", "Financial stability"],
    difficultyLevel: "finance",
    matchScore: (policies) => Math.max(0, policies.bankRegulation - 6.1),
    whatHappened:
      "Banking stability improved and crisis risk fell. The trade-off is that banks may lend less aggressively.",
    explanation:
      "Stronger bank regulation can reduce risky lending and make the financial system safer. However, if regulation is too strict, banks may issue fewer loans. Less lending can reduce investment and slow economic growth in the short run.",
    learnMore:
      "Financial regulation tries to reduce systemic risk without cutting off useful credit to households and firms."
  },
  {
    id: "investor-confidence",
    actionName: "Build investor confidence",
    title: "Why does policy credibility move markets?",
    keyConcept: "investor confidence",
    relatedGlossaryTerms: ["Investor confidence", "Stock market", "Exchange rate", "Bond yields"],
    difficultyLevel: "finance",
    matchScore: (policies) => Math.max(0, policies.investorTransparency - 6.2),
    whatHappened:
      "Predictable policy improved confidence. Stocks, currency, investment, and borrowing costs can all respond.",
    explanation:
      "Investor confidence reflects how safe and attractive investors believe the economy is. Stable inflation, controlled debt, and predictable policy usually increase confidence. When confidence rises, investment and stock prices may increase, the currency can strengthen, and government borrowing costs can fall.",
    learnMore:
      "Confidence is not just mood. It changes the risk premium investors demand for holding a country's assets."
  },
  {
    id: "issue-bonds",
    actionName: "Issue government bonds",
    title: "Why do bonds fund policy but add risk?",
    keyConcept: "bonds",
    relatedGlossaryTerms: ["Bonds", "National debt", "Bond yields", "Credit rating"],
    difficultyLevel: "finance",
    matchScore: (policies) => Math.max(0, policies.bondIssuance / 110),
    whatHappened:
      "The government gained financing capacity now, but future debt service and investor risk concerns increased.",
    explanation:
      "Government bonds are a way for governments to borrow money. Investors buy bonds and receive interest. Bonds can fund infrastructure or crisis support, but if debt becomes too high, investors may demand higher yields because they see the country as riskier.",
    learnMore:
      "Borrowing can be productive when it finances growth-enhancing investment. It becomes dangerous when it only postpones an unsustainable budget problem."
  },
  {
    id: "financial-literacy",
    actionName: "Invest in financial education",
    title: "Why does financial literacy improve stability?",
    keyConcept: "financial literacy",
    relatedGlossaryTerms: ["Household savings", "Diversification", "Consumer credit", "Banking stability"],
    difficultyLevel: "finance",
    matchScore: (policies) => Math.max(0, policies.financialEducation - 4.2),
    whatHappened:
      "Households became better at saving, borrowing, and managing risk. The effect is gradual but improves resilience.",
    explanation:
      "Financial literacy helps people make better decisions about saving, borrowing, investing, and managing risk. A financially educated population is less likely to take unsustainable debt and more likely to plan for the future. That can reduce defaults and improve long-term financial stability.",
    learnMore:
      "This is a slow policy, but it connects macro stability with ordinary household choices."
  },
  {
    id: "credit-rules",
    actionName: "Regulate consumer credit",
    title: "Why can easy credit become risky?",
    keyConcept: "consumer credit",
    relatedGlossaryTerms: ["Consumer credit", "Consumption", "Banking stability", "Household savings"],
    difficultyLevel: "finance",
    matchScore: (policies) => Math.max(0, 3.8 - policies.consumerCreditRules) + Math.max(0, policies.consumerCreditRules - 8.2) * 0.65,
    whatHappened:
      "Credit rules changed household borrowing. Easy credit can boost demand now, while strict credit reduces risk but may slow spending.",
    explanation:
      "Consumer credit allows households to borrow money for spending. This can increase demand in the short term, but excessive borrowing can create financial instability if households cannot repay their loans. Very strict credit rules reduce debt risk but can also slow consumption and growth.",
    learnMore:
      "The useful level of credit depends on incomes, interest rates, bank balance sheets, and whether borrowing funds productive activity or fragile consumption."
  },
  {
    id: "deposit-insurance",
    actionName: "Strengthen deposit insurance",
    title: "Why can deposit insurance stop bank runs?",
    keyConcept: "deposit insurance",
    relatedGlossaryTerms: ["Deposit insurance", "Bank run", "Banking stability", "Financial stability"],
    difficultyLevel: "finance",
    matchScore: (policies) => Math.max(0, policies.depositInsurance - 6.1),
    whatHappened:
      "Depositors trusted banks more, so panic risk fell. The government also accepted more responsibility if banks fail.",
    explanation:
      "Deposit insurance protects people's bank deposits if a bank fails. This can prevent panic and bank runs because households know their savings are safer. But it must be combined with bank regulation, otherwise banks may take excessive risks while expecting public protection.",
    learnMore:
      "Deposit insurance is strongest when supervision, capital rules, and credible public finances support it."
  }
];

export const BEGINNER_LESSONS = [
  {
    title: "Economics starts with trade-offs",
    source: "Inspired by Mankiw & Taylor, Economics, 5th ed.",
    body:
      "A government cannot maximize every goal at once. Lower unemployment, lower inflation, faster growth, lower debt, and higher approval often pull in different directions. The game teaches this by making every policy improve some indicators while putting pressure on others."
  },
  {
    title: "Aggregate demand is the spending side of the economy",
    source: "Inspired by Mankiw & Taylor chapters on AD/AS and stabilization policy.",
    body:
      "Consumption, investment, government spending, and net exports form total demand. Tax cuts, spending increases, and lower interest rates usually push demand up. That can raise GDP and jobs in the short run, but it can also create inflation if the economy is near capacity."
  },
  {
    title: "Aggregate supply is the capacity side",
    source: "Inspired by Mankiw & Taylor chapters on aggregate supply and supply-side policy.",
    body:
      "Infrastructure, education, competition, technology, and stable institutions help the economy produce more over time. These policies are slower than stimulus, but they can raise long-run growth without creating as much inflation."
  },
  {
    title: "Financial markets price risk",
    source: "Inspired by CFA Level I readings on fixed income, equity, and risk-return trade-offs.",
    body:
      "Stocks, bonds, currencies, and banks react to policy because investors compare expected return with risk. High debt, unstable inflation, weak banks, or unpredictable policy can raise borrowing costs and reduce confidence."
  },
  {
    title: "Diversification protects against one bad outcome",
    source: "Inspired by CFA Level I portfolio and diversification concepts.",
    body:
      "A household, investor, or country is safer when it does not depend on one asset, one sector, or one source of financing. Diversification does not remove risk, but it reduces the damage from a single shock."
  },
  {
    title: "Banks connect finance to the real economy",
    source: "Inspired by textbook financial-system and banking-stability concepts.",
    body:
      "Banks turn deposits into loans. If lending is responsible, households and firms can invest and spend. If lending becomes reckless, defaults can damage banks and force the whole economy into a credit crunch."
  }
];

export const TEXTBOOK_CASE_STUDIES = [
  {
    title: "Case Study: Tax cut during weak growth",
    level: "Beginner",
    concept: "Aggregate demand",
    setup:
      "The economy has high unemployment and low inflation. The president cuts income taxes to give households more disposable income.",
    lesson:
      "When spare capacity exists, extra consumption can raise GDP and reduce unemployment. But if the same tax cut happens when inflation is already high, it may mostly push prices up and widen the deficit."
  },
  {
    title: "Case Study: Raising rates to fight inflation",
    level: "Basic policy",
    concept: "Monetary policy",
    setup:
      "Inflation is above target and the currency is weakening. The central bank raises interest rates.",
    lesson:
      "Higher rates can reduce borrowing and cool demand, which helps inflation. The cost is weaker investment, lower stock prices, more expensive loans, and possibly higher unemployment."
  },
  {
    title: "Case Study: Bond-funded infrastructure",
    level: "Finance",
    concept: "Bonds and debt sustainability",
    setup:
      "The government issues bonds to finance infrastructure. Roads, energy systems, or digital networks can raise future productivity.",
    lesson:
      "Borrowing can be smart when it builds future capacity. It becomes risky if debt rises faster than growth or if investors demand higher yields because they doubt repayment discipline."
  },
  {
    title: "Case Study: Easy credit boom",
    level: "Finance",
    concept: "Consumer credit and banking stability",
    setup:
      "Banks loosen lending rules. Consumption rises and GDP improves at first.",
    lesson:
      "Easy credit can boost demand, but excessive household debt creates default risk. If households cannot repay loans, banks weaken and a financial crisis can spread to the real economy."
  },
  {
    title: "Case Study: Diversified savings",
    level: "Financial literacy",
    concept: "Risk, return, and diversification",
    setup:
      "A household holds all savings as cash during high inflation, while another mixes cash, bonds, and diversified equities.",
    lesson:
      "Cash is stable in nominal terms but loses purchasing power when inflation is high. Diversified portfolios still carry risk, but they can reduce dependence on one outcome and help protect long-run wealth."
  },
  {
    title: "Case Study: Automatic stabilizers",
    level: "Policy tools",
    concept: "Fiscal stabilization",
    setup:
      "A recession raises unemployment. Tax revenue falls automatically and welfare payments rise without a new law.",
    lesson:
      "Automatic stabilizers soften the fall in household income and demand. They can reduce the need for rushed policy changes, but they also widen the budget deficit during downturns."
  },
  {
    title: "Case Study: Deposit insurance and panic",
    level: "Finance",
    concept: "Bank runs",
    setup:
      "Rumors spread that several banks may fail. Households rush to withdraw deposits, even from banks that might otherwise survive.",
    lesson:
      "Deposit insurance can stop panic by reassuring depositors, but it must be paired with regulation. If banks know deposits are protected and rules are weak, they may take too much risk."
  }
];

export function getPolicyTheoryCard(policies: Policies): TheoryCard | null {
  const best = THEORY_CARD_RULES.map((rule) => ({ rule, score: rule.matchScore(policies) }))
    .filter((item) => item.score > 0.25)
    .sort((left, right) => right.score - left.score)[0];

  if (!best) return null;

  return {
    actionName: best.rule.actionName,
    title: best.rule.title,
    whatHappened: best.rule.whatHappened,
    explanation: best.rule.explanation,
    keyConcept: best.rule.keyConcept,
    learnMore: best.rule.learnMore,
    relatedGlossaryTerms: best.rule.relatedGlossaryTerms,
    difficultyLevel: best.rule.difficultyLevel
  };
}
