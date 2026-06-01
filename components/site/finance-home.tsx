"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { ArticleSummary } from "@/lib/articles";
import { SCENARIOS } from "@/lib/game/content";
import {
  getNextScenario,
  getRecommendedScenarios,
  USER_LEVELS,
  type UserLevelId
} from "@/lib/game/curriculum";
import { loadRuns } from "@/lib/game/storage";

const benefitCards = [
  {
    label: "Interactive Simulations",
    body: "Students learn markets, money, policy, and risk by making decisions and reading the outcome."
  },
  {
    label: "Investment Challenges",
    body: "Practice portfolio decisions with virtual cash, cached stock prices, and no real-money investing."
  },
  {
    label: "Scenario-Based Learning",
    body: "Every scenario connects a choice to visible consequences, scores, and feedback."
  },
  {
    label: "Progress Tracking",
    body: "Completed simulations, rankings, and saved learning paths help students improve over time."
  }
];

const problemCards = [
  {
    title: "Definitions are not enough",
    body: "Students can memorize inflation, bonds, GDP, or diversification without practicing how those ideas change a real decision."
  },
  {
    title: "Tradeoffs stay hidden",
    body: "Phronesia makes the cost of every choice visible: households, markets, debt, risk, approval, and long-term stability all react."
  },
  {
    title: "Feedback needs to be immediate",
    body: "Theory cards and score breakdowns explain why a result happened while the decision is still fresh."
  }
];

const processSteps = [
  {
    step: "01",
    title: "Learn the concept",
    body: "Build finance and economics foundations with short lessons, examples, and saved concepts."
  },
  {
    step: "02",
    title: "Make a decision",
    body: "Set a budget, trade, policy move, or personal finance choice inside the simulation."
  },
  {
    step: "03",
    title: "Simulate the outcome",
    body: "Review how markets, households, debt, inflation, and confidence respond to the choice."
  },
  {
    step: "04",
    title: "Reflect and improve",
    body: "Use score feedback, rankings, articles, and progress tracking to understand the tradeoff."
  }
];

const activeCompetitionStats = [
  { label: "Prize fund", value: "₸3,000,000" },
  { label: "Teams", value: "2–5 students" },
  { label: "Format", value: "Online investment simulation" },
  { label: "Starts", value: "June 22" },
  { label: "Eligibility", value: "Grades 7–12" }
];

const heroSupportItems = ["Simulations", "Finance Lab", "Scenario Library", "Investment Challenge"];

const platformLinks = [
  {
    title: "Finance Lab",
    body: "Test market mechanics and finance ideas in focused interactive labs.",
    href: "/finance-lab",
    action: "Open Lab"
  },
  {
    title: "Market Simulation",
    body: "Practice portfolio decisions with virtual cash, cached stock prices, and risk feedback.",
    href: "/investment-challenge",
    action: "Open Simulation"
  },
  {
    title: "Investment Challenge",
    body: "Build a free virtual portfolio and learn risk through an educational simulation with no real money.",
    href: "/investment-challenge",
    action: "Start Challenge"
  },
  {
    title: "Economic Scenarios",
    body: "Make decisions in realistic finance and economics situations and see the consequences.",
    href: "/scenarios",
    action: "Browse Scenarios"
  },
  {
    title: "Articles",
    body: "Read concise explainers behind the simulations and market decisions.",
    href: "/articles",
    action: "Read Articles"
  },
  {
    title: "Rankings",
    body: "Compare scenario scores, challenge results, and decision performance.",
    href: "/rankings",
    action: "View Rankings"
  },
  {
    title: "Student Progress",
    body: "Track completed scenarios, level growth, badges, and recommended next steps.",
    href: "/progress",
    action: "Open Progress"
  },
  {
    title: "Competition Access",
    body: "Run competition cases where teams submit decisions and organizers review results.",
    href: "/olympiad",
    action: "Open Competition"
  }
];

const systemNodes = ["Concepts", "Decisions", "Simulations", "Feedback", "Progress"];

const splitSections = [
  {
    eyebrow: "Practice without real-world risk",
    title: "Try hard decisions in a safe educational simulation.",
    body: "Phronesia lets students test investing, budgeting, policy, debt, and market choices with virtual outcomes. No real money is used, and the experience is not financial advice.",
    href: "/investment-challenge",
    action: "Open Investment Challenge"
  },
  {
    eyebrow: "Understand markets through decisions",
    title: "See how markets, rates, debt, and confidence connect.",
    body: "Finance Lab and scenarios show how stock prices, bond yields, exchange rates, household welfare, and inflation react when a decision changes the system.",
    href: "/finance-lab",
    action: "Explore Finance Lab"
  },
  {
    eyebrow: "Track progress and improve",
    title: "Move from beginner concepts to advanced cases.",
    body: "Progress pages, rankings, articles, and recommended scenarios help students keep learning after each simulation ends.",
    href: "/progress",
    action: "View Progress"
  }
];

function readStoredLevel(): UserLevelId {
  if (typeof window === "undefined") return "beginner";
  const stored = window.localStorage.getItem("phronesia.userLevel");
  return USER_LEVELS.some((level) => level.id === stored) ? (stored as UserLevelId) : "beginner";
}

export function FinanceHome({ featuredArticles = [] }: { featuredArticles?: ArticleSummary[] }) {
  const [userLevel, setUserLevel] = useState<UserLevelId>("beginner");
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useEffect(() => {
    const storedLevel = readStoredLevel();
    setUserLevel(storedLevel);
    setCompletedIds(loadRuns().filter((run) => run.complete).map((run) => run.scenarioId));
  }, []);

  const beginnerRecommendations = useMemo(() => getRecommendedScenarios("beginner", SCENARIOS, 2), []);
  const nextScenario = useMemo(() => getNextScenario(userLevel, completedIds, SCENARIOS), [completedIds, userLevel]);
  const beginnerScenario = beginnerRecommendations[0] ?? nextScenario;
  const featuredArticle = featuredArticles[0];

  return (
    <section className="premium-home">
      <div className="premium-hero-band">
        <div className="premium-orb orb-one" aria-hidden="true" />
        <div className="premium-orb orb-two" aria-hidden="true" />

        <div className="shell olympiad-announcement-bar">
          <Link href="/olympiad">
            <span>Live now:</span>
            <strong>Teenvestor Investment Competition</strong>
            <span>₸3,000,000 prize fund</span>
            <span>Starts June 22</span>
            <span>Grades 7–12</span>
            <em>View details -&gt;</em>
          </Link>
        </div>

        <section className="premium-hero shell">
          <div className="premium-hero-copy">
            <p className="premium-eyebrow">Phronesia</p>
            <h1>Learn finance by making decisions.</h1>
            <p className="premium-lede">
              Phronesia turns markets, policy, investing, and personal finance into interactive simulations where
              students see the consequences of every choice.
            </p>
            <div className="premium-actions">
              <Link className="button primary" href="/play/setup" prefetch={false}>
                Start Learning
              </Link>
              <Link className="button secondary" href="/scenarios">
                Explore Scenarios
              </Link>
            </div>
            <p className="premium-disclaimer">
              Educational simulation only. No real money is used. This is not financial advice.
            </p>
            <div className="hero-support-row" aria-label="Phronesia learning areas">
              {heroSupportItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="premium-section shell active-competition-section" aria-labelledby="active-competition-title">
        <article className="active-competition-card">
          <div className="active-competition-copy">
            <p className="premium-eyebrow">Active Competition</p>
            <h2 id="active-competition-title">Teenvestor Investment Competition</h2>
            <p>
              An international investment competition designed to develop financial thinking, analytical skills, and
              practical investing knowledge among students.
            </p>
            <div className="active-competition-actions">
              <Link className="button primary" href="/olympiad">
                View Competition
              </Link>
              <Link className="button secondary" href="/olympiad#registration">
                Register
              </Link>
            </div>
            <small>Follow @teenvestor.school and @phronesia_ for updates.</small>
          </div>
          <div className="active-competition-stats" aria-label="Teenvestor Investment Competition facts">
            {activeCompetitionStats.map((stat) => (
              <div key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="premium-section shell benefit-strip">
        <div className="section-kicker">
          <p className="premium-eyebrow">Product overview</p>
          <h2>What you can do on Phronesia</h2>
        </div>
        <div className="benefit-grid">
          {benefitCards.map((card) => (
            <article className="benefit-card" key={card.label}>
              <span>{card.label}</span>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="premium-section shell problem-section">
        <div className="problem-copy">
          <p className="premium-eyebrow">The learning gap</p>
          <h2>Finance education becomes clearer when students practice decisions, not only memorize terms.</h2>
          <p>
            Phronesia is a student-led finance and economics education platform for learning business, investing, and
            decision-making through simulations, market choices, and scenario-based feedback.
          </p>
        </div>
        <div className="problem-card-grid">
          {problemCards.map((card) => (
            <article className="problem-card" key={card.title}>
              <strong>{card.title}</strong>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="premium-section shell process-section">
        <div className="section-kicker">
          <p className="premium-eyebrow">How it works</p>
          <h2>Choose, decide, see what changes.</h2>
          <p>The whole learning loop fits into one short simulation.</p>
        </div>
        <div className="process-grid">
          {processSteps.map((item) => (
            <article className="process-card" key={item.step}>
              <span>{item.step}</span>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="premium-section shell capability-section">
        <div className="section-kicker">
          <p className="premium-eyebrow">Explore the platform</p>
          <h2>Find the right place to start.</h2>
          <p>Use the main product pages when you want the full lessons, labs, simulations, and articles.</p>
        </div>
        <div className="capability-grid">
          {platformLinks.map((item) => (
            <Link className="capability-card" href={item.href} key={`${item.title}-${item.href}`}>
              <span>{item.title}</span>
              <p>{item.body}</p>
              <strong>{item.action}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="premium-section shell system-foundation">
        <div className="system-copy">
          <p className="premium-eyebrow">Education system</p>
          <h2>A simulation engine for concepts, choices, feedback, and progress.</h2>
          <p>
            Phronesia connects short explanations to actions, then connects those actions to market and household
            outcomes so students can understand why a result happened.
          </p>
        </div>
        <div className="system-diagram" aria-label="Phronesia learning system">
          {systemNodes.map((node, index) => (
            <div className="system-node" key={node}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{node}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="premium-section shell split-stack">
        {splitSections.map((section, index) => (
          <article className="split-panel" key={section.title}>
            <div>
              <p className="premium-eyebrow">{section.eyebrow}</p>
              <h2>{section.title}</h2>
            </div>
            <div>
              <p>{section.body}</p>
              <Link className="text-link" href={section.href}>
                {section.action}
              </Link>
            </div>
            <div className="split-index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </div>
          </article>
        ))}
      </section>

      <section className="premium-section shell recommended-section" id="recommended">
        <div className="section-kicker">
          <div className="recommended-heading-copy">
            <p className="premium-eyebrow">Start here</p>
            <h2>Try a focused preview, then open the full pages.</h2>
          </div>
          <Link className="button secondary" href="/scenarios">
            Browse All Scenarios
          </Link>
        </div>

        <div className="recommended-grid">
          <article className="recommended-card">
            <div className="card-meta">
              <span>Beginner</span>
              <span>6-7 min</span>
              <span>Budgeting &amp; saving</span>
            </div>
            <h3>Beginner Finance Simulation</h3>
            <p>Start with a beginner simulation, make a decision, and use the feedback to understand the tradeoff.</p>
            <div className="card-actions">
              <Link className="button primary" href={`/play/setup?scenario=${beginnerScenario.id}`} prefetch={false}>
                Start
              </Link>
              <Link className="text-link" href="/scenarios">
                View library
              </Link>
            </div>
          </article>

          <article className="recommended-card">
            <div className="card-meta">
              <span>Competition</span>
              <span>Challenge</span>
              <span>Finance &amp; economics</span>
            </div>
            <h3>Competition Practice</h3>
            <p>Open a competition-style challenge and practice applying economic and financial reasoning under pressure.</p>
            <div className="card-actions olympiad-card-actions">
              <Link className="button primary" href="/olympiad">
                View competition
              </Link>
              <Link className="text-link" href="/olympiad">
                Open competition page
              </Link>
            </div>
          </article>

          {featuredArticle ? (
            <article className="recommended-card article-card">
              <div className="card-meta">
                <span>{featuredArticle.category}</span>
                <span>{featuredArticle.level}</span>
              </div>
              <h3>{featuredArticle.title}</h3>
              <p>{featuredArticle.excerpt}</p>
              <div className="card-actions">
                <Link className="button primary" href={`/articles/${featuredArticle.slug}`}>
                  Read article
                </Link>
                <Link className="text-link" href="/articles">
                  View all articles
                </Link>
              </div>
            </article>
          ) : null}
        </div>
      </section>

      <section className="premium-final-cta shell">
        <div>
          <p className="premium-eyebrow">Start Learning</p>
          <h2>Start learning economics by making decisions, not memorizing definitions.</h2>
        </div>
        <div className="premium-actions">
          <Link className="button primary" href="/play/setup" prefetch={false}>
            Start Learning
          </Link>
          <Link className="button secondary" href="/learn">
            Learn Concepts First
          </Link>
        </div>
      </section>
    </section>
  );
}
