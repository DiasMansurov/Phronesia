import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Finance Lab",
  description: "Explore Phronesia mini-labs for markets, interest rates, savings, bonds, loans, risk, and diversification.",
  alternates: {
    canonical: "/finance-lab"
  }
};

const miniLabs = [
  {
    title: "Stock Index",
    topic: "Market reaction",
    signal: "Stock index",
    value: "104",
    scenario: "finance-market-stock-reaction",
    controls: ["Rates", "Confidence", "Bank stability"],
    explanation: "Stocks react to expected profits, interest rates, uncertainty, and investor confidence."
  },
  {
    title: "Loan Affordability",
    topic: "Interest rates",
    signal: "Loan affordability",
    value: "62",
    scenario: "finance-policy-rate-markets",
    controls: ["Base rate", "Inflation", "Currency"],
    explanation: "Higher rates can reduce inflation and support the currency, but borrowing becomes more expensive."
  },
  {
    title: "Real Savings",
    topic: "Inflation",
    signal: "Real savings",
    value: "-4.1%",
    scenario: "finance-basics-inflation-savings",
    controls: ["Inflation", "Savings rate", "Financial education"],
    explanation: "Savings need to be judged in real terms. If inflation is higher than the return, purchasing power falls."
  },
  {
    title: "Bond Yield",
    topic: "Debt markets",
    signal: "Bond yield",
    value: "6.8%",
    scenario: "finance-market-bond-yield-pressure",
    controls: ["Debt", "Deficit", "Credibility"],
    explanation: "Investors demand higher yields when debt, deficits, inflation, or credibility risk becomes too large."
  },
  {
    title: "Default Risk",
    topic: "Consumer credit",
    signal: "Default risk",
    value: "24",
    scenario: "finance-market-consumer-credit-boom",
    controls: ["Credit rules", "Rates", "Household income"],
    explanation: "Easy credit can lift consumption now, but excessive borrowing raises default risk later."
  },
  {
    title: "Portfolio Risk",
    topic: "Diversification",
    signal: "Portfolio risk",
    value: "Medium",
    scenario: "finance-basics-simple-investment",
    controls: ["Cash", "Stocks", "Bonds"],
    explanation: "Diversification spreads risk because the investor does not depend on one asset only."
  }
];

const dashboards = [
  ["Stock Market Index", "Expected profits, rates, bank stress, and investor confidence"],
  ["Bond Yields", "Debt sustainability, inflation, deficits, and repayment risk"],
  ["Exchange Rate", "Investor trust, trade balance, inflation, and interest-rate differentials"],
  ["Investor Confidence", "Policy predictability, controlled debt, low inflation, and financial stability"],
  ["Banking Stability", "Loan quality, bank regulation, defaults, and liquidity"],
  ["Household Savings", "Inflation, interest income, uncertainty, and financial literacy"],
  ["Household Debt", "Credit access, rates, income, and default risk"],
  ["Credit Rating", "Debt, deficits, growth prospects, and credibility"]
];

const reactionMap = [
  ["Raise interest rates", "Inflation pressure can fall, currency may strengthen, stocks may weaken, and loans become expensive."],
  ["Issue more bonds", "The government receives funding now, but debt and bond yields can rise if investors worry."],
  ["Increase bank regulation", "Banking stability improves, but lending can slow if rules become too strict."],
  ["Loosen consumer credit", "Consumption rises in the short run, while household debt and default risk increase."],
  ["Invest in financial education", "Savings behavior improves, risky borrowing falls, and long-term stability rises."],
  ["Improve investor confidence", "Stocks and currency can recover, yields may fall, and investment becomes easier."]
];

const testSignals = [
  "Stock index reaction",
  "Bond yield changes",
  "Currency pressure",
  "Debt and default risk",
  "Portfolio diversification"
];

export default function FinanceLabPage() {
  return (
    <section className="finance-lab-page">
      <section className="finance-lab-hero-band">
        <div className="shell finance-lab-hero">
          <div className="finance-lab-hero-copy stack-md">
            <div className="stack-sm">
              <p className="eyebrow">Finance Lab</p>
              <h1 className="display market-display">Experiment with markets before the crisis starts.</h1>
              <p className="lede market-lede">
                Finance Lab is the place to understand savings, loans, stocks, bonds, currencies, banks, debt,
                and risk before entering full simulations.
              </p>
            </div>
            <div className="cta-row">
              <Link className="button primary" href="/play/setup?scenario=finance-basics-inflation-savings" prefetch={false}>
                Start Beginner Lab
              </Link>
              <Link className="button secondary" href="/investment-challenge">
                Open Investment Challenge
              </Link>
              <Link className="button secondary" href="/scenarios">
                Browse Finance Cases
              </Link>
            </div>
          </div>

          <aside className="finance-lab-workflow-card">
            <p className="eyebrow">What you can test</p>
            <div className="finance-test-list">
              {testSignals.map((signal, index) => (
                <div key={signal} className="finance-test-item">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{signal}</strong>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="finance-lab-band finance-entry-band">
        <div className="shell">
          <article className="finance-feature-card">
            <div className="finance-feature-copy">
              <div className="card-topline">
                <span className="pill">Paper trading</span>
                <span className="mini-status open">Virtual portfolio</span>
              </div>
              <h2>Build a virtual portfolio</h2>
              <p>
                Start with $100,000 in virtual capital, compare risk and return, and write a simple investment thesis.
              </p>
            </div>
            <div className="finance-feature-metrics" aria-label="Investment challenge highlights">
              <div>
                <span>Starting cash</span>
                <strong>$100k</strong>
              </div>
              <div>
                <span>Focus</span>
                <strong>Risk & return</strong>
              </div>
            </div>
            <Link className="button primary" href="/investment-challenge">
              Launch Investment Challenge
            </Link>
          </article>
        </div>
      </section>

      <section className="finance-lab-band finance-mini-band">
        <div className="shell stack-lg">
          <div className="finance-lab-section-header">
            <p className="eyebrow">Mini-lab pathway</p>
            <h2>Choose a mini-lab and test one market signal.</h2>
            <p>
              Each mini-lab focuses on one financial indicator, shows what moves it, and connects you to a related scenario.
            </p>
          </div>

          <div className="finance-mini-intro">
            <strong>Start with one signal.</strong>
            <p>
              Adjust the drivers, read the market reaction, then open the scenario that uses the same finance concept.
            </p>
          </div>

          <div className="finance-mini-grid">
            {miniLabs.map((lab, index) => (
              <article key={lab.title} className="finance-mini-card">
                <div className="card-topline">
                  <span className="pill">Mini-lab {index + 1}</span>
                  <span className="mini-status open">{lab.topic}</span>
                </div>
                <div className="finance-mini-copy">
                  <h3>{lab.title}</h3>
                  <p>{lab.explanation}</p>
                </div>
                <div className="finance-mini-metric">
                  <span>{lab.signal}</span>
                  <strong>{lab.value}</strong>
                </div>
                <div className="finance-driver-list" aria-label={`${lab.title} drivers`}>
                  {lab.controls.map((control) => (
                    <span key={control}>{control}</span>
                  ))}
                </div>
                <div className="finance-card-cta">
                  <Link className="text-link" href={`/play/setup?scenario=${lab.scenario}`} prefetch={false}>
                    Try related scenario
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="finance-lab-band finance-signals-band">
        <div className="shell">
          <section className="finance-reference-panel stack-md">
            <div className="finance-lab-section-header">
              <p className="eyebrow">Financial signals</p>
              <h2>Signals students learn to read.</h2>
              <p>
                These indicators appear across simulations so finance does not feel separate from economics.
              </p>
            </div>
            <div className="finance-signal-preview">
              {dashboards.slice(0, 6).map(([title, body]) => (
                <article key={title} className="finance-signal-card">
                  <strong>{title}</strong>
                  <p>{body}</p>
                </article>
              ))}
            </div>
            <details className="finance-details-panel">
              <summary>View all finance signals</summary>
              <div className="finance-signal-list">
                {dashboards.slice(6).map(([title, body]) => (
                  <div key={title} className="finance-signal-row">
                    <strong>{title}</strong>
                    <p>{body}</p>
                  </div>
                ))}
              </div>
            </details>
          </section>
        </div>
      </section>

      <section className="finance-lab-band finance-reactions-band">
        <div className="shell">
          <section className="finance-reference-panel stack-md">
            <div className="finance-lab-section-header">
              <p className="eyebrow">Cause and effect</p>
              <h2>How decisions move financial markets.</h2>
            </div>
            <div className="finance-reaction-list">
              {reactionMap.map(([decision, reaction], index) => (
                <details key={decision} className="finance-reaction-row" open={index < 3}>
                  <summary>{decision}</summary>
                  <p>{reaction}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </section>
    </section>
  );
}
