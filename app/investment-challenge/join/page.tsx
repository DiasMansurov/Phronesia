import type { Metadata } from "next";
import Link from "next/link";

import { InvestmentTeamJoin } from "@/components/investment/investment-team-join";

export const metadata: Metadata = {
  title: "Join Investment Challenge",
  description:
    "Enter your Phronesia Investment Challenge competition code, team name, and team password to access the protected educational simulation.",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default function InvestmentChallengeJoinPage() {
  return (
    <section className="investment-section investment-join-page stack-xl">
      <div className="investment-premium-hero investment-join-hero shell">
        <div className="investment-hero-content">
          <p className="premium-eyebrow">Protected student access</p>
          <h1>Join your investment competition.</h1>
          <p className="premium-lede">
            Enter your competition code manually, then use your team name and team password to create or return to the
            same shared team portfolio.
          </p>
          <div className="premium-actions">
            <Link className="button secondary" href="/investment-challenge">
              Back to overview
            </Link>
            <Link className="button secondary" href="/investment-challenge/rules">
              Read Rules
            </Link>
          </div>
        </div>
        <article className="investment-hero-dashboard investment-access-preview">
          <div className="investment-dashboard-topline">
            <span>Access sequence</span>
            <b>3 steps</b>
          </div>
          <div className="investment-access-steps">
            <div><span>01</span><strong>Competition code</strong></div>
            <div><span>02</span><strong>Team name</strong></div>
            <div><span>03</span><strong>Team password</strong></div>
          </div>
          <p>
            Public pages do not show stock prices, portfolio values, or trade tools. Market data appears only after
            team access is verified.
          </p>
        </article>
      </div>

      <div className="shell">
        <InvestmentTeamJoin />
      </div>
    </section>
  );
}
