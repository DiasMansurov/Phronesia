import Link from "next/link";
import Image from "next/image";

import { AuthControls } from "@/components/site/auth-controls";

const links = [
  { href: "/", label: "Home" },
  { href: "/play/setup", label: "Play" },
  { href: "/learn", label: "Learn" },
  { href: "/scenarios", label: "Scenarios" },
  { href: "/finance-lab", label: "Finance Lab" },
  { href: "/rankings", label: "Rankings" },
  { href: "/teachers/classes", label: "My Classes" },
  { href: "/teachers", label: "Teachers" },
  { href: "/championship", label: "Championships" }
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
            <span className="brand-kicker">Free School Macro Game</span>
            <span className="brand-title">Phronesia</span>
          </span>
        </Link>
        <div className="nav-center">
          <p className="nav-caption">Educational economics and finance simulator for schools, competitions, and self-study.</p>
          <nav className="nav-links" aria-label="Primary">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={link.href === "/play/setup" ? false : undefined}
                className={link.href === "/play/setup" || link.href === "/teachers/classes" ? "nav-cta" : undefined}
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
