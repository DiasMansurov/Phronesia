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
    title: "Market Simulator",
    signal: "Stock index",
    value: "104",
    scenario: "finance-market-stock-reaction",
    controls: ["Rates", "Confidence", "Bank stability"],
    explanation: "Stocks react to expected profits, interest rates, uncertainty, and investor confidence."
  },
  {
    title: "Interest Rate Simulator",
    signal: "Loan affordability",
    value: "62",
    scenario: "finance-policy-rate-markets",
    controls: ["Base rate", "Inflation", "Currency"],
    explanation: "Higher rates can reduce inflation and support the currency, but borrowing becomes more expensive."
  },
  {
    title: "Inflation and Savings",
    signal: "Real savings",
    value: "-4.1%",
    scenario: "finance-basics-inflation-savings",
    controls: ["Inflation", "Savings rate", "Financial education"],
    explanation: "Savings need to be judged in real terms. If inflation is higher than the return, purchasing power falls."
  },
  {
    title: "Bonds and Debt",
    signal: "Bond yield",
    value: "6.8%",
    scenario: "finance-market-bond-yield-pressure",
    controls: ["Debt", "Deficit", "Credibility"],
    explanation: "Investors demand higher yields when debt, deficits, inflation, or credibility risk becomes too large."
  },
  {
    title: "Loan and Household Debt",
    signal: "Default risk",
    value: "24",
    scenario: "finance-market-consumer-credit-boom",
    controls: ["Credit rules", "Rates", "Household income"],
    explanation: "Easy credit can lift consumption now, but excessive borrowing raises default risk later."
  },
  {
    title: "Risk and Diversification",
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

export default function FinanceLabPage() {
  return (
    <section className="shell section stack-2xl">
      <div className="market-hero market-page-hero">
        <div className="market-hero-copy stack-lg">
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
        <aside className="market-terminal">
          <div className="terminal-topline">
            <span>Finance dashboard</span>
            <strong>Live signals</strong>
          </div>
          <div className="mini-chart finance-chart" aria-hidden="true">
            {[58, 46, 72, 64, 81, 55, 91, 76].map((height, index) => (
              <span key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="terminal-grid">
            <div><span>Stocks</span><strong>104</strong></div>
            <div><span>Yield</span><strong>5.2%</strong></div>
            <div><span>Currency</span><strong>93</strong></div>
            <div><span>Debt risk</span><strong>41</strong></div>
          </div>
        </aside>
      </div>

      <section className="finance-mini-lab-grid">
        <article className="mini-lab-card investment-lab-card">
          <div className="card-topline">
            <span className="pill">Paper trading</span>
            <span className="mini-status open">Virtual portfolio</span>
          </div>
          <div className="mini-lab-value">
            <span>Starting cash</span>
            <strong>$100k</strong>
          </div>
          <p>
            Build a virtual portfolio with US stocks and ETFs, write an investment thesis, and compare your score on
            return, risk, diversification, thesis quality, and drawdown control.
          </p>
          <Link className="text-link" href="/investment-challenge">
            Launch Investment Challenge
          </Link>
        </article>
        {miniLabs.map((lab, index) => (
          <article key={lab.title} className="mini-lab-card">
            <div className="card-topline">
              <span className="pill">Mini-lab {index + 1}</span>
              <span className="mini-status open">{lab.signal}</span>
            </div>
            <div className="mini-lab-value">
              <span>{lab.signal}</span>
              <strong>{lab.value}</strong>
            </div>
            <div className="mini-slider-stack" aria-hidden="true">
              {lab.controls.map((control, controlIndex) => (
                <div key={control} className="mini-slider">
                  <span>{control}</span>
                  <i style={{ width: `${52 + controlIndex * 13}%` }} />
                </div>
              ))}
            </div>
            <p>{lab.explanation}</p>
            <Link className="text-link" href={`/play/setup?scenario=${lab.scenario}`} prefetch={false}>
              Try related scenario
            </Link>
          </article>
        ))}
      </section>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Financial dashboard</p>
            <h2>The signals students learn to read.</h2>
            <p className="muted">
              These indicators appear across simulations so finance does not feel separate from economics.
            </p>
          </div>
        </div>
        <div className="finance-lab-grid">
          {dashboards.map(([title, body]) => (
            <article key={title} className="goal-item">
              <strong>{title}</strong>
              <p className="muted small">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Cause and effect</p>
            <h2>How decisions move financial markets.</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table className="record-table">
            <thead>
              <tr>
                <th>Decision</th>
                <th>Likely finance reaction</th>
              </tr>
            </thead>
            <tbody>
              {reactionMap.map(([decision, reaction]) => (
                <tr key={decision}>
                  <td>{decision}</td>
                  <td>{reaction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
