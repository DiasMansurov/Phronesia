import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Finance Lab",
  description: "Learn how policy decisions affect stocks, bonds, exchange rates, banking stability, and household savings.",
  alternates: {
    canonical: "/finance-lab"
  }
};

const financeSignals = [
  {
    title: "Bond yields",
    body: "Government borrowing costs rise when investors worry about inflation, debt, deficits, or credibility."
  },
  {
    title: "Exchange rate",
    body: "The currency strengthens when investors trust policy and weakens when inflation or debt risk rises."
  },
  {
    title: "Stock market",
    body: "Stocks respond to expected profits, growth, interest rates, and confidence."
  },
  {
    title: "Banking stability",
    body: "Stress rises when credit gets tight, unemployment rises, or government bond losses hit banks."
  },
  {
    title: "Household savings",
    body: "Inflation reduces purchasing power, while higher interest rates can improve savings returns but make loans costlier."
  },
  {
    title: "Household debt",
    body: "Debt rises when credit is easy and confidence is high. It becomes dangerous when rates, unemployment, or defaults rise."
  },
  {
    title: "Loan affordability",
    body: "Borrowing is easier when rates are low and banks are healthy, but easy loans can create debt fragility."
  },
  {
    title: "Credit rating",
    body: "A rating summarizes repayment risk. High debt, weak credibility, and banking stress can push ratings down."
  },
  {
    title: "Investor confidence",
    body: "Confidence falls when policy looks unsustainable and improves when inflation, debt, and growth are credible."
  }
];

const policyExamples = [
  ["Raise interest rates", "Inflation may fall, the currency may strengthen, stocks may weaken, and unemployment can rise."],
  ["Increase spending", "Growth and approval can improve, but inflation, debt, and bond yields may rise."],
  ["Buy bonds", "Yields may fall and liquidity improves, but too much support can weaken credibility and currency value."],
  ["Let debt rise too far", "Credit rating pressure grows, bond yields rise, and future spending becomes harder."],
  ["Strengthen bank regulation", "Banking stability improves, but banks may lend less aggressively."],
  ["Loosen consumer credit", "Consumption can rise now, while household debt and default risk rise later."],
  ["Introduce deposit insurance", "Bank-run risk falls, but the government carries more responsibility if banks fail."]
];

const portfolioLessons = [
  ["Cash", "Stable in nominal terms, but inflation can quietly reduce purchasing power."],
  ["Stocks", "Higher potential return, higher short-term volatility, and sensitive to confidence and rates."],
  ["Bonds", "Usually steadier than stocks, but prices and yields react to interest rates and credit risk."],
  ["Gold / foreign currency", "Can hedge currency or inflation stress, but does not guarantee income."],
  ["Diversified mix", "Reduces dependence on one asset and makes the result less fragile."]
];

const financeCases = [
  ["Banking Crisis", "Risky lending damages banks. Regulation, liquidity, and deposit insurance can restore trust, but bailouts raise debt."],
  ["Stock Market Crash", "Equities fall when expected profits, confidence, or liquidity collapse. Policy communication and stability matter."],
  ["Debt Crisis", "High debt can push bond yields up and weaken credit ratings, making every future budget choice harder."],
  ["Currency Crisis", "A falling currency can raise import prices and inflation. Rates, credibility, and external balance all matter."],
  ["Household Debt Crisis", "Easy credit supports spending first, then defaults can hit banks and jobs."],
  ["Inflation And Savings", "Cash savings lose purchasing power when inflation is high. Real return matters more than nominal return."],
  ["Investment Bubble", "Fast-rising asset prices can hide leverage and risk until expectations reverse."]
];

export default function FinanceLabPage() {
  return (
    <section className="shell section stack-lg">
      <div className="hero-band compact">
        <div className="stack-sm">
          <p className="eyebrow">Finance Lab</p>
          <h1 className="display compact">Markets are not a mini-game. They react to your policy.</h1>
          <p className="lede compact-lede">
            Finance Lab connects macroeconomics with stocks, bonds, exchange rates, investor confidence, and real household effects.
          </p>
          <Link className="button primary" href="/play/setup" prefetch={false}>
            Play A Finance Scenario
          </Link>
        </div>
        <div className="panel compact-panel stack-sm finance-section">
          <p className="eyebrow">Investor View</p>
          <h2>What citizens and investors feel</h2>
          <div className="goal-list compact-list">
            <div className="goal-item">Inflation reduces purchasing power.</div>
            <div className="goal-item">Higher rates make mortgages and business loans more expensive.</div>
            <div className="goal-item">Weak confidence can lower stocks and raise bond yields.</div>
          </div>
        </div>
      </div>

      <section className="finance-lab-grid">
        {financeSignals.map((signal) => (
          <article key={signal.title} className="panel compact-panel stack-sm">
            <p className="eyebrow">Signal</p>
            <h2>{signal.title}</h2>
            <p className="muted">{signal.body}</p>
          </article>
        ))}
      </section>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Policy Reactions</p>
            <h2>Examples players see inside the simulation.</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table className="record-table">
            <thead>
              <tr>
                <th>Policy move</th>
                <th>Likely market reaction</th>
              </tr>
            </thead>
            <tbody>
              {policyExamples.map(([move, effect]) => (
                <tr key={move}>
                  <td>{move}</td>
                  <td>{effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Finance Cases</p>
            <h2>Scenario types the simulator now supports.</h2>
            <p className="muted">
              These cases connect financial literacy with macro outcomes: banks, credit, savings, markets, currency, debt, and confidence.
            </p>
          </div>
          <Link className="button secondary" href="/scenarios">
            Browse Scenarios
          </Link>
        </div>
        <div className="case-study-grid">
          {financeCases.map(([title, body]) => (
            <article key={title} className="case-study-card stack-sm">
              <span className="mini-status open">Finance scenario</span>
              <h3>{title}</h3>
              <p className="muted">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Stock And Bond Education</p>
            <h2>A mini-mode idea for risk, return, inflation, and diversification.</h2>
            <p className="muted">
              This is not a trading casino. It teaches why different assets react differently when inflation, rates, currency pressure, and confidence change.
            </p>
          </div>
        </div>
        <div className="finance-lab-grid">
          {portfolioLessons.map(([asset, lesson]) => (
            <article key={asset} className="goal-item">
              <strong>{asset}</strong>
              <p className="muted small">{lesson}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
