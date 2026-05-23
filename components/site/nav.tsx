"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Show } from "@clerk/nextjs";

import { AuthControls } from "@/components/site/auth-controls";

const links = [
  { href: "/", label: "Home" },
  { href: "/learn", label: "Learn" },
  { href: "/finance-lab", label: "Finance Lab" },
  { href: "/scenarios", label: "Scenarios" },
  { href: "/articles", label: "Articles" },
  { href: "/rankings", label: "Rankings" },
  { href: "/progress", label: "Progress" },
  { href: "/olympiad", label: "Olympiad" }
];

const investmentLink = { href: "/investment-challenge", label: "Investment" };

export function SiteNav() {
  const pathname = usePathname();
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="site-header">
      <div className="shell nav-shell">
        <Link href="/" className="brand-mark">
          <Image
            src="/phronesia-p-mark.svg"
            alt="Phronesia logo"
            width={48}
            height={48}
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
              <NavLink key={link.href} href={link.href} label={link.label} active={isActive(link.href)} />
            ))}
            {hasClerk ? (
              <Show when="signed-in">
                <NavLink
                  href={investmentLink.href}
                  label={investmentLink.label}
                  active={isActive(investmentLink.href)}
                  cta
                />
              </Show>
            ) : null}
          </nav>
        </div>
        <AuthControls />
      </div>
    </header>
  );
}

function NavLink({ href, label, active, cta = false }: { href: string; label: string; active: boolean; cta?: boolean }) {
  return (
    <Link href={href} className={[cta ? "nav-cta" : "", active ? "active" : ""].filter(Boolean).join(" ")}>
      {label}
    </Link>
  );
}
