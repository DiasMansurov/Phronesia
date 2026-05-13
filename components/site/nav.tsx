import Link from "next/link";
import Image from "next/image";

import { AuthControls } from "@/components/site/auth-controls";

const links = [
  { href: "/", label: "Home" },
  { href: "/learn", label: "Learn" },
  { href: "/articles", label: "Articles" },
  { href: "/finance-lab", label: "Finance Lab" },
  { href: "/scenarios", label: "Scenarios" },
  { href: "/play/setup", label: "Play" },
  { href: "/olympiad", label: "Olympiad" },
  { href: "/rankings", label: "Rankings" },
  { href: "/progress", label: "Progress" },
  { href: "/teachers", label: "Teachers" },
  { href: "/about", label: "About" }
];

export function SiteNav() {
  return (
    <header className="site-header">
      <div className="shell nav-shell">
        <Link href="/" className="brand-mark">
          <Image
            src="/phronesia-logo.svg"
            alt="Phronesia logo"
            width={72}
            height={72}
            className="brand-logo"
          />
          <span className="brand-copy">
            <span className="brand-kicker">Finance simulation school</span>
            <span className="brand-title">Phronesia</span>
          </span>
        </Link>
        <div className="nav-center">
          <p className="nav-caption">Finance and economics education through simulation, markets, and decision feedback.</p>
          <nav className="nav-links" aria-label="Primary">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={link.href === "/play/setup" ? false : undefined}
                className={link.href === "/finance-lab" || link.href === "/play/setup" ? "nav-cta" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <AuthControls />
      </div>
    </header>
  );
}
