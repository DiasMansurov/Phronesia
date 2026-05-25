import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Phronesia Investment Challenge — Educational Virtual Portfolio Simulation",
  description:
    "Join a free educational investment simulation where students build virtual portfolios and learn stocks, ETFs, diversification, risk, and financial decision-making. No real money is used.",
  alternates: {
    canonical: "https://phronesia.org/investment-challenge"
  },
  openGraph: {
    title: "Phronesia Investment Challenge — Educational Virtual Portfolio Simulation",
    description:
      "Join a free educational investment simulation where students build virtual portfolios and learn stocks, ETFs, diversification, risk, and financial decision-making. No real money is used.",
    url: "https://phronesia.org/investment-challenge",
    siteName: "Phronesia",
    type: "website"
  }
};

const steps = [
  ["01", "Join a competition", "Enter a student competition code or sign in with your Phronesia account."],
  ["02", "Build a virtual portfolio", "Inside the protected area, teams use $100,000 in virtual cash. No real money is used."],
  ["03", "Explain your thesis", "Students explain asset choices, risks, diversification, and macro factors."],
  ["04", "Reflect on results", "Rankings and score breakdowns help students learn from decisions, not just memorize terms."]
];

const topics = ["Stocks", "ETFs", "Diversification", "Risk and return", "Market hours", "Investment thesis", "Transaction costs", "Portfolio discipline"];

const heroMetrics = [
  ["Access", "Protected", "No public market prices"],
  ["Starting capital", "$100,000", "Virtual cash only"],
  ["Mode", "Team-based", "Shared portfolio login"],
  ["Data", "Private area", "Server-side cached prices"]
];

const platformCards = [
  {
    title: "Competition access",
    body: "Students enter a competition code, team name, and team password before any market data or trade tools are shown."
  },
  {
    title: "Portfolio decisions",
    body: "Teams build a virtual portfolio, manage cash, account for commission, and review holdings inside the protected area."
  },
  {
    title: "Reflection and thesis",
    body: "Each team explains why it chose assets, what risks it expects, and how diversification fits the portfolio."
  }
];

export default function InvestmentChallengePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EducationalApplication",
    name: "Phronesia Investment Challenge",
    url: "https://phronesia.org/investment-challenge",
    applicationCategory: "EducationalApplication",
    description:
      "Students join a free protected educational investment simulation to learn investing, diversification, risk, and finance. No real money is used.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    }
  };

  return (
    <>
      <Script
        id="investment-challenge-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="investment-section investment-public-page stack-xl">
        <div className="investment-premium-hero shell">
          <div className="investment-hero-content">
            <p className="premium-eyebrow">Phronesia Investment Challenge</p>
            <h1>Learn investing through a protected student simulation.</h1>
            <p className="premium-lede">
              Students build virtual portfolios, write investment theses, and learn how diversification, risk,
              transaction costs, and market discipline shape decisions. Market data is available only inside the
              password-protected student competition area.
            </p>
            <div className="premium-actions">
              <Link className="button primary" href="/investment-challenge/join">
                Join with code
              </Link>
              <Link className="button secondary" href="/investment-challenge/rules">
                Read Rules
              </Link>
              <Link className="button secondary" href="/articles">
                Read Articles
              </Link>
            </div>
            <p className="investment-hero-note">
              Phronesia is free. No real money is used. This is not financial advice.
            </p>
          </div>

          <aside className="investment-hero-dashboard" aria-label="Protected Investment Challenge preview">
            <div className="investment-dashboard-topline">
              <span>Student area preview</span>
              <b>Protected</b>
            </div>
            <div className="investment-preview-main-card">
              <span>Access model</span>
              <strong>No public market prices</strong>
              <p>Portfolio values, trade tickets, and rankings stay hidden until team access is verified.</p>
            </div>
            <div className="investment-hero-metric-grid">
              {heroMetrics.map(([label, value, detail]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <small>{detail}</small>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="shell stack-xl">
          <section className="investment-light-section stack-md">
            <div className="section-header">
              <div>
                <p className="eyebrow">How it works</p>
                <h2>Competition access first, market data second.</h2>
              </div>
              <span className="pill">Free educational use</span>
            </div>
            <div className="investment-process-grid">
              {steps.map(([number, title, body]) => (
                <article className="investment-process-card" key={title}>
                  <span>{number}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="investment-feature-band">
            {platformCards.map((card) => (
              <article className="investment-feature-card" key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </section>

          <section className="investment-light-section stack-md">
            <div className="section-header">
              <div>
                <p className="eyebrow">Concepts students practice</p>
                <h2>Portfolio decisions become finance lessons.</h2>
              </div>
            </div>
            <div className="investment-topic-grid">
              {topics.map((topic) => (
                <article className="investment-topic-card" key={topic}>
                  <span>Learn</span>
                  <strong>{topic}</strong>
                  <p>Covered through guided portfolio decisions and student-friendly explanations.</p>
                </article>
              ))}
            </div>
          </section>

          <section className="investment-final-split" id="join-investment-challenge">
            <article className="investment-split-copy">
              <p className="eyebrow">Student competition access</p>
              <h2>Join with your organizer’s code.</h2>
              <p>
                The code is not shown or pre-filled. Your organizer will give your team the competition code, team name,
                and team password to enter the protected simulation.
              </p>
              <Link className="button primary" href="/investment-challenge/join">
                Join Competition
              </Link>
            </article>
            <article className="investment-compliance-card">
              <p className="eyebrow">Important disclaimer</p>
              <h2>Educational simulation only.</h2>
              <p>
                Phronesia is a free educational simulation. No real money is used. This is not financial advice. No
                brokerage execution happens, and market data is used only inside the student competition area.
              </p>
              <p>
                Phronesia does not resell market data as a standalone product and does not provide professional trading,
                brokerage, or investment advisory services.
              </p>
            </article>
          </section>
        </div>
      </section>
    </>
  );
}
