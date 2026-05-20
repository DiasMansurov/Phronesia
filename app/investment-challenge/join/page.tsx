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
    <section className="shell section stack-xl">
      <div className="hero-band compact">
        <div className="stack-sm">
          <p className="eyebrow">Protected student access</p>
          <h1 className="display compact">Join your investment competition.</h1>
          <p className="lede compact-lede">
            Enter your competition code manually, then use your team name and team password to create or return to the
            same shared team portfolio.
          </p>
          <div className="cta-row">
            <Link className="button secondary" href="/investment-challenge">
              Back to overview
            </Link>
            <Link className="button secondary" href="/investment-challenge/rules">
              Read Rules
            </Link>
          </div>
        </div>
        <article className="panel compact-panel stack-sm">
          <p className="eyebrow">Privacy</p>
          <p>
            Public pages do not show stock prices, portfolio values, or trade tools. Market data appears only after
            team access is verified.
          </p>
        </article>
      </div>

      <InvestmentTeamJoin />
    </section>
  );
}
