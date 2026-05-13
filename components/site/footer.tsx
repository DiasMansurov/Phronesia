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
            <p className="footer-heading">Explore</p>
            <Link href="/play/setup" prefetch={false}>
              Start Learning
            </Link>
            <Link href="/learn">Learn</Link>
            <Link href="/articles">Articles</Link>
            <Link href="/finance-lab">Finance Lab</Link>
            <Link href="/scenarios">Scenarios</Link>
            <Link href="/olympiad">Olympiad Portal</Link>
            <Link href="/results">Organizer Results</Link>
            <Link href="/rankings">View Rankings</Link>
            <Link href="/progress">Progress</Link>
            <Link href="/championship">Championship</Link>
            <Link href="/join">Student Join</Link>
          </div>
          <div className="footer-link-column">
            <p className="footer-heading">Teachers</p>
            <Link href="/teachers">Teacher Overview</Link>
            <Link href="/teachers/classes">Teacher Classes</Link>
            <Link href="/schools/privacy">School Privacy</Link>
            <Link href="/schools/dpa">School DPA</Link>
          </div>
          <div className="footer-link-column">
            <p className="footer-heading">Trust</p>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/accessibility">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
