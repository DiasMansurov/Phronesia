import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";

import { HomeHeroActions, HomeLaunchPanel } from "@/components/site/home-launch-panel";
import { getDailyChallenge, getWeeklyFeatured } from "@/lib/game/challenges";
import { SCENARIOS } from "@/lib/game/content";
import { LEARNING_LEVELS } from "@/lib/game/learning";

const campaignStats = [
  { value: "Learning", label: "theory cards" },
  { value: "Finance", label: "markets linked to policy" },
  { value: "Challenge", label: "ranking mode path" }
];

const focusPoints = [
  {
    title: "See trade-offs fast",
    body: "Inflation, jobs, growth, debt, and approval move together in every run."
  },
  {
    title: "Free for school use",
    body: "Teachers can use it for lessons, revision, and homework without a paywall."
  },
  {
    title: "Add financial pressure",
    body: "Bond yields, currency pressure, equity sentiment, and banking stress now react to the policy mix."
  }
];

const teacherUses = [
  "Lesson starter",
  "Revision homework",
  "Policy writing prompt"
];

const featuredScenarios = SCENARIOS.slice(0, 4);

const trustLinks = [
  { href: "/schools/privacy", label: "School privacy" },
  { href: "/schools/dpa", label: "School DPA" },
  { href: "/accessibility", label: "Accessibility" }
];

export const metadata: Metadata = {
  title: "Educational Economics and Finance Simulator",
  description:
    "Phronesia is a free educational simulation platform that teaches economics and financial decision-making through interactive policy challenges.",
  alternates: {
    canonical: "/"
  }
};

export default function HomePage() {
  const daily = getDailyChallenge();
  const weekly = getWeeklyFeatured();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Phronesia",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: "https://phronesia.org",
    description:
      "A free educational economics and finance simulation platform with theory cards, finance dashboards, classroom-ready runs, and policy trade-off gameplay.",
    audience: [
      {
        "@type": "EducationalAudience",
        educationalRole: "student"
      },
      {
        "@type": "EducationalAudience",
        educationalRole: "teacher"
      }
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    publisher: {
      "@type": "Organization",
      name: "Phronesia",
      url: "https://phronesia.org"
    }
  };

  return (
    <section className="shell section home-page stack-2xl">
      <Script
        id="home-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="hero-briefing compact-hero-briefing">
        <div className="hero-main compact-hero-main stack-lg">
          <div className="hero-topline compact-hero-topline">
            <div className="hero-seal compact-hero-seal">
              <Image
                src="/phronesia-logo.svg"
                alt="Phronesia brand mark"
                width={160}
                height={160}
                className="hero-logo"
                priority
              />
            </div>
            <div className="hero-title-stack stack-sm">
              <p className="eyebrow">Educational economics and finance simulator</p>
              <h1 className="display compact-home-display">Learn economics by ruling an economy.</h1>
              <p className="lede compact-hero-lede">
                Phronesia teaches economics and financial decision-making through interactive policy challenges,
                theory cards, market reactions, and classroom-ready Policy Briefs.
              </p>
            </div>
          </div>

          <div className="briefing-ledger compact-ledger" aria-label="Key product highlights">
            {campaignStats.map((stat) => (
              <article key={stat.label} className="ledger-cell compact-ledger-cell">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>

          <HomeHeroActions />
        </div>

        <HomeLaunchPanel
          daily={{ label: daily.label, objective: daily.objective }}
          weekly={{ label: weekly.label, objective: weekly.objective }}
        />
      </section>

      <section className="focus-strip" aria-label="Product summary">
        {focusPoints.map((item) => (
          <article key={item.title} className="focus-item">
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </article>
        ))}
      </section>

      <section className="panel stack-md platform-loop-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Core Game Loop</p>
            <h2>Decide, simulate, explain, improve.</h2>
          </div>
          <Link className="button secondary" href="/learn">
            Open Learn
          </Link>
        </div>
        <div className="platform-loop-grid">
          {[
            ["1", "Read the situation", "The game gives a country, crisis, and goals in simple language."],
            ["2", "Set policy", "Choose taxes, spending, rates, investment, and market-facing tools."],
            ["3", "See consequences", "Inflation, jobs, growth, debt, approval, currency, stocks, and bond yields move."],
            ["4", "Learn the theory", "A short card explains the economic logic behind the result."]
          ].map(([step, title, body]) => (
            <article key={step} className="goal-item platform-loop-card">
              <span>{step}</span>
              <strong>{title}</strong>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel stack-md">
        <div className="section-header">
          <div>
            <p className="eyebrow">Learning Path</p>
            <h2>Beginner to competitive without dropping a new player into chaos.</h2>
          </div>
          <Link className="button secondary" href="/scenarios">
            Browse Scenarios
          </Link>
        </div>
        <div className="level-path-grid expanded">
          {LEARNING_LEVELS.map((level) => (
            <article key={level.id} className="level-path-card active">
              <span>{level.label}</span>
              <strong>{level.title}</strong>
              <small>{level.summary}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="overview-grid">
        <article className="overview-panel panel stack-md">
          <p className="eyebrow">Why it works</p>
          <h2>It teaches through consequences, not textbook friction.</h2>
          <div className="overview-list">
            <div className="overview-row">Monetary, fiscal, and supply-side choices affect multiple outcomes at once.</div>
            <div className="overview-row">Theory cards explain the causal chain immediately after a decision.</div>
            <div className="overview-row">Policy Briefs turn each run into evidence of learning.</div>
          </div>
        </article>

        <article className="overview-panel panel stack-md">
          <p className="eyebrow">For teachers</p>
          <h2>A platform for lessons, competitions, and measurable learning impact.</h2>
          <div className="teacher-chip-row">
            {teacherUses.map((item) => (
              <span key={item} className="teacher-chip">
                {item}
              </span>
            ))}
          </div>
          <p className="muted compact-copy">
            Use Learning Mode for guided practice, Challenge Mode for fair competition, and Policy Briefs for reflection.
          </p>
          <div className="cta-row">
            <Link className="button secondary" href="/teachers/classes">
              My Classes
            </Link>
            <Link className="text-link" href="/teachers">
              For teachers
            </Link>
            <Link className="text-link" href="/schools/privacy">
              Review school policies
            </Link>
          </div>
        </article>
      </section>

      <section className="scenario-atlas compact-scenario-atlas stack-md">
        <div className="section-header atlas-header">
          <div>
            <p className="eyebrow">Featured scenarios</p>
            <h2>Four fast ways to start.</h2>
          </div>
          <Link className="text-link" href="/play/setup" prefetch={false}>
            View all scenarios
          </Link>
        </div>

        <div className="scenario-atlas-grid compact-scenario-grid">
          {featuredScenarios.map((scenario) => (
            <article key={scenario.id} className="atlas-card compact-atlas-card">
              <div className="card-topline">
                <span className="pill">{scenario.heroTag}</span>
                <span className="mini-status positive">Playable</span>
              </div>
              <h3>{scenario.title}</h3>
              <p className="muted">{scenario.subtitle}</p>
              <p>{scenario.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bottom-rail">
        <article className="bottom-cta">
          <p className="eyebrow">Free for schools</p>
          <h2>Open a run or review the teacher path.</h2>
          <div className="cta-row">
            <Link className="button primary" href="/play/setup" prefetch={false}>
              Start a run
            </Link>
            <Link className="button secondary" href="/teachers/classes">
              My Classes
            </Link>
          </div>
        </article>
        <div className="trust-inline">
          {trustLinks.map((item) => (
            <Link key={item.href} href={item.href} className="trust-inline-link">
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
