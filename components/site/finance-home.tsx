"use client";

import Link from "next/link";
import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from "react";

import type { ArticleSummary } from "@/lib/articles";
import { SCENARIOS } from "@/lib/game/content";
import {
  getNextScenario,
  getScenarioLearningProfile,
  getUserLevel,
  USER_LEVELS,
  type UserLevelId
} from "@/lib/game/curriculum";
import { loadRuns } from "@/lib/game/storage";

const benefitCards = [
  {
    value: "Interactive",
    label: "Simulations",
    body: "Markets, policy, investing, and personal finance become choices with visible consequences."
  },
  {
    value: "$100k",
    label: "Virtual portfolio",
    body: "Students practice portfolio decisions with educational virtual cash and no real-money risk."
  },
  {
    value: "Scenario",
    label: "Feedback",
    body: "Each simulation connects the decision, the outcome, the score, and the tradeoff."
  },
  {
    value: "Progress",
    label: "Tracking",
    body: "Students can track finance learning progress, achievements, best scores, and next scenarios."
  }
];

const problemCards = [
  {
    title: "Concepts without decisions",
    body: "Students can understand finance and economics ideas through short explanations, but the ideas stay abstract without practice."
  },
  {
    title: "No safe place to test ideas",
    body: "Investment concepts are hard to learn with real money, so Phronesia uses a free virtual portfolio simulation."
  },
  {
    title: "Scenarios without feedback",
    body: "A choice matters only when students can review the outcome, score, and feedback behind the tradeoff."
  },
  {
    title: "Progress is hard to see",
    body: "Saved concepts, rankings, and progress tracking help students see what they have practiced and what to try next."
  }
];

const processSteps = [
  {
    step: "01",
    title: "Learn the concept",
    body: "Understand finance and economics ideas through short explanations and examples.",
    href: "/learn"
  },
  {
    step: "02",
    title: "Make a decision",
    body: "Set a budget, trade, policy move, or personal finance choice inside the simulation.",
    href: "/play/setup"
  },
  {
    step: "03",
    title: "Simulate the outcome",
    body: "Make decisions in realistic finance and economics situations and see the consequences.",
    href: "/scenarios"
  },
  {
    step: "04",
    title: "Reflect and improve",
    body: "Review the outcome, score, and feedback so the tradeoff is clear.",
    href: "/progress"
  }
];

const featureCards = [
  {
    title: "Finance Lab",
    body: "Test market mechanics and finance ideas in focused interactive labs.",
    href: "/finance-lab",
    action: "Open Lab"
  },
  {
    title: "Market Simulation",
    body: "Practice how stocks, bonds, currencies, banks, debt, and confidence react to decisions.",
    href: "/play/setup?scenario=finance-market-stock-reaction",
    action: "Try Simulation"
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
    body: "See finance simulation rankings, scenario ladders, school leaderboards, and policy score comparisons.",
    href: "/rankings",
    action: "View Rankings"
  },
  {
    title: "Student Progress",
    body: "Track Phronesia finance learning progress, achievements, best scores, and recommended next scenarios.",
    href: "/progress",
    action: "View Progress"
  },
  {
    title: "Olympiad Practice",
    body: "Open structured economics and finance competition practice through the Olympiad portal.",
    href: "/olympiad",
    action: "Open Olympiad"
  }
];

const systemNodes = ["Concepts", "Decisions", "Simulations", "Feedback", "Progress"];

const splitSections = [
  {
    eyebrow: "Decision-making",
    title: "Make decisions in realistic finance and economics situations.",
    body: "Phronesia lets students choose a concept, scenario, market, or investing challenge, then make a choice inside the simulation.",
    href: "/scenarios",
    action: "Browse Scenarios",
    metric: "Choice",
    metricLabel: "budget, trade, policy, or finance decision"
  },
  {
    eyebrow: "Scenario feedback",
    title: "See what changes after every choice.",
    body: "Students review the consequence, score, and explanation so the tradeoff is clear instead of theoretical.",
    href: "/play/setup",
    action: "Start Learning",
    metric: "Result",
    metricLabel: "outcome, score, and feedback loop"
  },
  {
    eyebrow: "Progress tracking",
    title: "Use progress, rankings, and saved concepts to improve.",
    body: "Phronesia connects completed simulations, achievements, best scores, rankings, and recommended next scenarios.",
    href: "/progress",
    action: "View Progress",
    metric: "Progress",
    metricLabel: "completed simulations and next steps"
  }
];

function readStoredLevel(): UserLevelId {
  if (typeof window === "undefined") return "beginner";
  const stored = window.localStorage.getItem("phronesia.userLevel");
  return USER_LEVELS.some((level) => level.id === stored) ? (stored as UserLevelId) : "beginner";
}

function SectionHeader({
  eyebrow,
  title,
  body,
  action
}: {
  eyebrow: string;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="premium-section-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {body ? <p>{body}</p> : null}
      {action ? <div className="premium-header-action">{action}</div> : null}
    </div>
  );
}

function BenefitCard({ value, label, body }: { value: string; label: string; body: string }) {
  return (
    <article className="premium-stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
      <p>{body}</p>
    </article>
  );
}

function ProcessCard({ step, title, body, href }: { step: string; title: string; body: string; href: string }) {
  return (
    <Link className="premium-process-card" href={href} prefetch={href === "/play/setup" ? false : undefined}>
      <span>{step}</span>
      <strong>{title}</strong>
      <p>{body}</p>
    </Link>
  );
}

function FeatureCard({
  title,
  body,
  href,
  action,
  index
}: {
  title: string;
  body: string;
  href: string;
  action: string;
  index: number;
}) {
  return (
    <Link className="premium-feature-card" href={href} prefetch={href.startsWith("/play/setup") ? false : undefined}>
      <div className="premium-feature-index" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
      <span>{action}</span>
    </Link>
  );
}

function DashboardPreview({
  selectedLevel,
  completedCount,
  nextScenario,
  nextProfile,
  featuredArticle
}: {
  selectedLevel: string;
  completedCount: number;
  nextScenario: ReturnType<typeof getNextScenario>;
  nextProfile: ReturnType<typeof getScenarioLearningProfile>;
  featuredArticle?: ArticleSummary;
}) {
  return (
    <aside className="premium-dashboard-card" aria-label="Finance learning dashboard preview">
      <div className="dashboard-topline">
        <span>Simulation Preview</span>
        <strong>{selectedLevel}</strong>
      </div>

      <div className="dashboard-primary-metric">
        <span>Recommended next</span>
        <strong>{nextScenario.title}</strong>
        <small>
          {nextProfile.difficulty} · {nextProfile.estimatedMinutes} min · {nextProfile.concepts.slice(0, 2).join(", ")}
        </small>
      </div>

      <div className="dashboard-chart" aria-hidden="true">
        {[38, 54, 46, 72, 63, 86, 78, 94].map((height, index) => (
          <i key={index} style={{ height: `${height}%` }} />
        ))}
      </div>

      <div className="dashboard-metric-grid">
        <div>
          <span>Portfolio signal</span>
          <strong>$100k</strong>
        </div>
        <div>
          <span>Completed</span>
          <strong>{completedCount}</strong>
        </div>
        <div>
          <span>Scenarios</span>
          <strong>{SCENARIOS.length}</strong>
        </div>
        <div>
          <span>Feedback</span>
          <strong>Active</strong>
        </div>
      </div>

      <div className="dashboard-feedback">
        <span>Consequence</span>
        <p>Review the outcome, score, and feedback so the tradeoff is clear.</p>
      </div>

      {featuredArticle ? (
        <Link className="dashboard-article-link" href={`/articles/${featuredArticle.slug}`}>
          <span>{featuredArticle.category}</span>
          <strong>{featuredArticle.title}</strong>
        </Link>
      ) : null}
    </aside>
  );
}

function SystemDiagram() {
  return (
    <div className="premium-foundation-diagram" aria-label="Phronesia education system">
      <div className="foundation-orbit">
        {systemNodes.map((node, index) => (
          <span key={node} style={{ "--node-index": index } as CSSProperties}>
            {node}
          </span>
        ))}
        <strong>Education system</strong>
      </div>
      <div className="foundation-status-card">
        <span>System active</span>
        <strong>Concepts, decisions, simulations, feedback, and progress.</strong>
        <p>
          Phronesia connects lessons, finance dashboards, scenario decisions, investment practice, rankings, and
          classroom-ready results into one learning loop.
        </p>
      </div>
    </div>
  );
}

function SplitSection({
  eyebrow,
  title,
  body,
  href,
  action,
  metric,
  metricLabel,
  index
}: {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  action: string;
  metric: string;
  metricLabel: string;
  index: number;
}) {
  return (
    <section className={`premium-split-section ${index % 2 ? "is-reversed" : ""}`}>
      <div className="premium-split-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{body}</p>
        <Link className="button secondary" href={href} prefetch={href === "/play/setup" ? false : undefined}>
          {action}
        </Link>
      </div>
      <div className="premium-split-visual" aria-hidden="true">
        <span>{metric}</span>
        <strong>{metricLabel}</strong>
        <i />
        <i />
        <i />
      </div>
    </section>
  );
}

export function FinanceHome({ featuredArticles = [] }: { featuredArticles?: ArticleSummary[] }) {
  const [userLevel, setUserLevel] = useState<UserLevelId>("beginner");
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useEffect(() => {
    const storedLevel = readStoredLevel();
    setUserLevel(storedLevel);
    setCompletedIds(loadRuns().filter((run) => run.complete).map((run) => run.scenarioId));
  }, []);

  const nextScenario = useMemo(() => getNextScenario(userLevel, completedIds, SCENARIOS), [completedIds, userLevel]);
  const selectedLevel = getUserLevel(userLevel);
  const nextProfile = getScenarioLearningProfile(nextScenario);
  const featuredArticle = featuredArticles[0];

  return (
    <section className="shell section phronesia-home premium-home">
      <section className="premium-hero">
        <div className="premium-hero-copy">
          <div className="premium-hero-kicker">
            <span>Finance simulation school</span>
            <span>Decision feedback platform</span>
          </div>

          <div className="stack-md">
            <p className="eyebrow">Phronesia</p>
            <h1>Learn finance by making decisions.</h1>
            <p>
              Phronesia turns markets, policy, investing, and personal finance into interactive simulations where
              students see the consequences of every choice.
            </p>
          </div>

          <div className="premium-hero-actions">
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
        </div>

        <DashboardPreview
          selectedLevel={selectedLevel.label}
          completedCount={completedIds.length}
          nextScenario={nextScenario}
          nextProfile={nextProfile}
          featuredArticle={featuredArticle}
        />
      </section>

      <section className="premium-section premium-benefits-section">
        <SectionHeader
          eyebrow="Learning benefits"
          title="Simulation-based finance practice students can measure."
          body="The platform focuses on practice: concepts, scenarios, investing, feedback, and progress tracking."
        />
        <div className="premium-stats-grid">
          {benefitCards.map((benefit) => (
            <BenefitCard key={benefit.label} {...benefit} />
          ))}
        </div>
      </section>

      <section className="premium-section premium-problem-section">
        <SectionHeader
          eyebrow="The problem"
          title="Why passive finance education does not work."
          body="Students need to make decisions, see consequences, and review feedback before finance and economics feel practical."
        />
        <div className="premium-problem-grid">
          {problemCards.map((card) => (
            <article className="premium-problem-card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="premium-section premium-system-section">
        <SectionHeader
          eyebrow="How it works"
          title="Choose, decide, see what changes."
          body="The whole learning loop fits into one short simulation."
        />
        <div className="premium-process-grid">
          {processSteps.map((step) => (
            <ProcessCard key={step.step} {...step} />
          ))}
        </div>
      </section>

      <section className="premium-section premium-features-section">
        <SectionHeader
          eyebrow="Core capabilities"
          title="What you can do on Phronesia."
          body="Use the main product pages when you want the full lessons, labs, simulations, rankings, and articles."
        />
        <div className="premium-feature-grid">
          {featureCards.map((feature, index) => (
            <FeatureCard key={feature.href} index={index} {...feature} />
          ))}
        </div>
      </section>

      <section className="premium-section premium-foundation-section">
        <SectionHeader
          eyebrow="The foundation"
          title="Phronesia is an education system, not just a website."
          body="Every part of the platform connects concepts, decisions, simulations, feedback, and progress."
        />
        <SystemDiagram />
      </section>

      <div className="premium-split-stack">
        {splitSections.map((section, index) => (
          <SplitSection key={section.title} index={index} {...section} />
        ))}
      </div>

      <section className="premium-final-cta">
        <div>
          <p className="premium-eyebrow">Start Learning</p>
          <h2>Start learning economics by making decisions, not memorizing definitions.</h2>
        </div>
        <div className="premium-final-actions">
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
