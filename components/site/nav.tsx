"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Show, useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState, type FocusEvent } from "react";

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
      { href: "/olympiad", label: "Competition", description: "View the Teenvestor Investment Competition." }
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
                <AdminResultsNavLink active={isActive("/results") || isActive("/investment-challenge/admin/results")} />
              </Show>
            ) : null}
            <NavLink
              href={investmentLink.href}
              label={investmentLink.label}
              active={isActive(investmentLink.href)}
              cta
            />
          </nav>
        </div>
      </div>
    </header>
  );
}

function AdminResultsNavLink({ active }: { active: boolean }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [showAdminResults, setShowAdminResults] = useState(false);
  const adminEmail = user?.primaryEmailAddress?.emailAddress ?? "";

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !adminEmail) {
      setShowAdminResults(false);
      return;
    }

    const controller = new AbortController();
    let retryTimer: number | null = null;

    function checkAdminAccess(attempt = 0) {
      fetch("/api/investment/admin/access", {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
        signal: controller.signal
      })
      .then((response) => (response.ok ? response.json() : { isAdmin: false }))
      .then((data) => {
        if (data?.isAdmin) {
          setShowAdminResults(true);
          return;
        }
        if ((data?.reason === "signed_out" || data?.reason === "missing_email") && attempt < 3) {
          retryTimer = window.setTimeout(() => checkAdminAccess(attempt + 1), 450);
          return;
        }
        setShowAdminResults(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setShowAdminResults(false);
      });
    }

    checkAdminAccess();

    return () => {
      controller.abort();
      if (retryTimer !== null) window.clearTimeout(retryTimer);
    };
  }, [isLoaded, isSignedIn, adminEmail]);

  if (!showAdminResults) return null;
  return <NavLink href="/results" label="Results" active={active} />;
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
      <span className="nav-dropdown-bridge" aria-hidden="true" />
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
