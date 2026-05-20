import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

import { InvestmentAccessForm } from "@/components/investment/investment-access-form";

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
      <section className="shell section stack-xl">
        <div className="hero-band investment-public-hero">
          <div className="stack-md">
            <p className="eyebrow">Phronesia Investment Challenge</p>
            <h1 className="display compact">Learn investing through a protected student simulation.</h1>
            <p className="lede compact-lede">
              Students build virtual portfolios, write investment theses, and learn how diversification, risk,
              transaction costs, and market discipline shape decisions. Market data is available only inside the
              password-protected student competition area.
            </p>
            <div className="cta-row">
              <a className="button primary" href="#join-investment-challenge">
                Join with code
              </a>
              <Link className="button secondary" href="/investment-challenge/rules">
                Read Rules
              </Link>
              <Link className="button secondary" href="/sign-in">
                Sign in
              </Link>
            </div>
          </div>
          <InvestmentAccessForm />
        </div>

        <section className="grid four">
          {topics.map((topic) => (
            <article className="panel compact-panel stack-sm" key={topic}>
              <p className="eyebrow">Learn</p>
              <h3>{topic}</h3>
              <p className="muted">Covered through guided portfolio decisions and student-friendly explanations.</p>
            </article>
          ))}
        </section>

        <section className="panel stack-md">
          <div className="section-header">
            <div>
              <p className="eyebrow">How it works</p>
              <h2>Competition access first, market data second.</h2>
            </div>
            <span className="pill">Free educational use</span>
          </div>
          <div className="process-grid">
            {steps.map(([number, title, body]) => (
              <article className="process-card" key={title}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid two" id="join-investment-challenge">
          <InvestmentAccessForm />
          <article className="panel stack-md investment-disclaimer">
            <p className="eyebrow">Important disclaimer</p>
            <h2>Educational simulation only.</h2>
            <p>
              Phronesia is a free educational simulation. No real money is used. This is not financial advice. No
              brokerage execution happens, and market data is used only inside the student competition area.
            </p>
            <p className="muted">
              Phronesia does not resell market data as a standalone product and does not provide professional trading,
              brokerage, or investment advisory services.
            </p>
          </article>
        </section>
      </section>
    </>
  );
}
