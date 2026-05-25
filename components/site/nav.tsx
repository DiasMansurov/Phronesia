"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Show } from "@clerk/nextjs";
import { useEffect, useRef, useState, type FocusEvent } from "react";

import { AuthControls } from "@/components/site/auth-controls";

const visibleLinks = [
  { href: "/", label: "Home" },
  { href: "/learn", label: "Learn" },
  { href: "/finance-lab", label: "Finance Lab" },
  { href: "/scenarios", label: "Scenarios" }
];

const dropdownGroups = [
  {
    label: "Resources",
    items: [
      { href: "/articles", label: "Articles", description: "Short finance explainers and knowledge base." },
      { href: "/progress", label: "Progress", description: "Track learning progress, badges, and saved runs." }
    ]
  },
  {
    label: "Compete",
    items: [
      { href: "/rankings", label: "Rankings", description: "Compare scores and challenge results." },
      { href: "/olympiad", label: "Olympiad", description: "Enter official competition cases." }
    ]
  }
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
            {visibleLinks.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} active={isActive(link.href)} />
            ))}
            {dropdownGroups.map((group) => (
              <NavDropdown
                key={group.label}
                label={group.label}
                items={group.items}
                active={group.items.some((item) => isActive(item.href))}
                isActive={isActive}
              />
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

function NavDropdown({
  label,
  items,
  active,
  isActive
}: {
  label: string;
  items: Array<{ href: string; label: string; description: string }>;
  active: boolean;
  isActive: (href: string) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const closeTimeout = useRef<number | null>(null);

  useEffect(() => () => clearCloseTimeout(), []);

  function clearCloseTimeout() {
    if (closeTimeout.current !== null) {
      window.clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  }

  function openDropdown() {
    clearCloseTimeout();
    setOpen(true);
  }

  function closeDropdown() {
    clearCloseTimeout();
    closeTimeout.current = window.setTimeout(() => {
      setOpen(false);
      closeTimeout.current = null;
    }, 180);
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget;
    if (!nextTarget || !event.currentTarget.contains(nextTarget as Node)) {
      closeDropdown();
    }
  }

  return (
    <div
      className={`nav-dropdown ${active ? "active" : ""} ${open ? "open" : ""}`}
      onMouseEnter={openDropdown}
      onMouseLeave={closeDropdown}
      onFocus={openDropdown}
      onBlur={handleBlur}
    >
      <button className="nav-dropdown-trigger" type="button" aria-haspopup="true" aria-expanded={open}>
        <span>{label}</span>
        <span className="nav-chevron" aria-hidden="true" />
      </button>
      <div className="nav-dropdown-menu">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className={`nav-dropdown-item ${isActive(item.href) ? "active" : ""}`}>
            <span>{item.label}</span>
            <small>{item.description}</small>
          </Link>
        ))}
      </div>
    </div>
  );
}

function NavLink({ href, label, active, cta = false }: { href: string; label: string; active: boolean; cta?: boolean }) {
  return (
    <Link href={href} className={[cta ? "nav-cta" : "", active ? "active" : ""].filter(Boolean).join(" ")}>
      {label}
    </Link>
  );
}
