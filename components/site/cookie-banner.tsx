"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { COOKIE_CONSENT_KEY, cookiesRequireConsent, inferRegionFromLocale } from "@/lib/policy";

type CookieChoice = "accepted" | "essential";

function readStoredChoice() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(COOKIE_CONSENT_KEY) as CookieChoice | null;
}

export function CookieBanner() {
  const [choice, setChoice] = useState<CookieChoice | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setChoice(readStoredChoice());
    setLoaded(true);
  }, []);

  const region = useMemo(() => {
    if (typeof navigator === "undefined") return "OTHER";
    return inferRegionFromLocale(navigator.language);
  }, []);

  const showBanner = loaded && cookiesRequireConsent(region) && !choice;

  function save(next: CookieChoice) {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, next);
    setChoice(next);
  }

  if (!showBanner) return null;

  return (
    <aside className="cookie-banner" role="dialog" aria-live="polite" aria-label="Cookie notice">
      <div className="cookie-banner-copy stack-sm">
        <p className="eyebrow">Cookie Notice</p>
        <h2>We only use essential cookies by default.</h2>
        <p className="muted">
          In the UK and EU, we ask before enabling non-essential analytics. Classroom accounts are never used for ads
          or behavioral profiling.
        </p>
      </div>
      <div className="cookie-banner-actions">
        <button className="button secondary" type="button" onClick={() => save("essential")}>
          Essential only
        </button>
        <button className="button primary" type="button" onClick={() => save("accepted")}>
          Accept analytics
        </button>
      </div>
      <Link className="text-link" href="/cookies">
        Read the cookie policy
      </Link>
    </aside>
  );
}
