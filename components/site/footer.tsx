import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-column stack-sm">
          <div className="footer-brand">
            <Image
              src="/phronesia-logo.svg"
              alt="Phronesia logo"
              width={84}
              height={84}
              className="footer-logo"
            />
            <div>
              <p className="eyebrow">Phronesia</p>
              <p className="footer-title">Finance education through simulation</p>
            </div>
          </div>
          <p className="footer-copy">
            A finance and economics simulation platform where students learn markets, money, risk, debt, and policy
            through decisions, theory cards, finance dashboards, and classroom-ready results.
          </p>
          <p className="footer-copy small">
            Copyright &copy; {year} Phronesia. All rights reserved.
          </p>
        </div>
        <div className="footer-link-groups">
          <div className="footer-link-column">
            <p className="footer-heading">Platform</p>
            <Link href="/play/setup" prefetch={false}>
              Start Learning
            </Link>
            <Link href="/learn">Learn</Link>
            <Link href="/finance-lab">Finance Lab</Link>
            <Link href="/scenarios">Scenarios</Link>
            <Link href="/progress">Progress</Link>
          </div>
          <div className="footer-link-column">
            <p className="footer-heading">Learn</p>
            <Link href="/articles">Articles</Link>
            <Link href="/investment-challenge">Investment Challenge</Link>
            <Link href="/investment-challenge/options">Options Simulator</Link>
            <Link href="/rankings">Rankings</Link>
            <Link href="/olympiad">Competition Portal</Link>
          </div>
          <div className="footer-link-column">
            <p className="footer-heading">Company</p>
            <Link href="/teachers">Teachers</Link>
            <Link href="/teachers/classes">Classes</Link>
            <Link href="/championship">Championship</Link>
            <Link href="/results">Organizer Results</Link>
            <Link href="/about">About</Link>
          </div>
          <div className="footer-link-column">
            <p className="footer-heading">Legal</p>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/accessibility">Accessibility</Link>
            <Link href="/security">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
