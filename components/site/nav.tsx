"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { AuthControls } from "@/components/site/auth-controls";

const links = [
  { href: "/", label: "Home" },
  { href: "/learn", label: "Learn" },
  { href: "/finance-lab", label: "Finance Lab" },
  { href: "/scenarios", label: "Scenarios" },
  { href: "/investment-challenge", label: "Investment" },
  { href: "/articles", label: "Articles" },
  { href: "/rankings", label: "Rankings" },
  { href: "/progress", label: "Progress" },
  { href: "/olympiad", label: "Olympiad" }
];

export function SiteNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

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
                className={[link.href === "/investment-challenge" ? "nav-cta" : "", isActive(link.href) ? "active" : ""]
                  .filter(Boolean)
                  .join(" ")}
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
