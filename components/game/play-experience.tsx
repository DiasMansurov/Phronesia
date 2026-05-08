"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";

import { track } from "@/lib/analytics";
import { getScenario } from "@/lib/game/content";
import { advanceRun, compareToBenchmarks, defaultPolicies, updatePolicies } from "@/lib/game/engine";
import { pct, signedPct, whole } from "@/lib/game/format";
import { getProfile, registerCompletedRun } from "@/lib/game/profile";
import { getActiveRunId, getRun, saveRun, setActiveRunId } from "@/lib/game/storage";
import type {
  ClassroomPolicyDecision,
  ElectionNight,
  Policies,
  PolicyComplexity,
  PolicyEffectDirection,
  PolicyPrediction,
  RoundBriefing,
  RunState
} from "@/lib/game/types";

type InsightDetailKey = "household" | "mandate" | "briefing";
type MacroStat = {
  label: string;
  value: string;
  help: string;
};

type ClassroomContext = {
  membership: {
    classId: string;
    groupId: string;
    profileId: string;
  };
  classroom: {
    id: string;
    name: string;
  };
  group: {
    id: string;
    name: string;
  } | null;
};

type PolicyRow = {
  key: keyof Policies;
  label: string;
  category: "macro" | "finance";
  min: number;
  max: number;
  step: number;
  help: string;
  toolkits: PolicyComplexity[];
  formatValue: (value: number) => string;
};

const POLICY_TOOLKIT_LABELS: Record<PolicyComplexity, string> = {
  tutorial: "First Day Tutorial",
  fiscal: "Fiscal Only",
  monetary: "Monetary Only",
  combined: "Combined Core",
  advanced: "Full Cabinet"
};

const POLICY_ROWS: PolicyRow[] = [
  {
    key: "interestRate",
    label: "Base rate",
    category: "macro",
    min: 0,
    max: 10,
    step: 0.5,
    help: "Higher rates cool inflation and demand. Lower rates push borrowing and growth.",
    toolkits: ["tutorial", "monetary", "combined", "advanced"],
    formatValue: (value) => `${value.toFixed(1)}%`
  },
  {
    key: "reserveRequirement",
    label: "Reserve requirement",
    category: "macro",
    min: 4,
    max: 18,
    step: 0.5,
    help: "A higher reserve requirement tightens bank lending. A lower one frees more credit into the economy.",
    toolkits: ["monetary", "combined", "advanced"],
    formatValue: (value) => `${value.toFixed(1)}%`
  },
  {
    key: "bondPurchases",
    label: "Bond purchases",
    category: "macro",
    min: -300,
    max: 600,
    step: 25,
    help: "Positive values mean the central bank is buying government bonds. Negative values mean it is selling them back.",
    toolkits: ["monetary", "combined", "advanced"],
    formatValue: (value) => `${value >= 0 ? "+" : ""}$${whole.format(value)}B`
  },
  {
    key: "incomeTaxRate",
    label: "Tax rate",
    category: "macro",
    min: 15,
    max: 35,
    step: 0.5,
    help: "Higher taxes strengthen the budget but restrain disposable income and demand.",
    toolkits: ["tutorial", "fiscal", "combined", "advanced"],
    formatValue: (value) => `${value.toFixed(1)}%`
  },
  {
    key: "currentSpending",
    label: "Government spending",
    category: "macro",
    min: 14,
    max: 28,
    step: 0.5,
    help: "Fast demand support, but repeated expansion can strain the budget and credibility.",
    toolkits: ["tutorial", "fiscal", "combined", "advanced"],
    formatValue: (value) => `${value.toFixed(1)}%`
  },
  {
    key: "transferPayments",
    label: "Transfer payments",
    category: "macro",
    min: 0,
    max: 10,
    step: 0.5,
    help: "Supports vulnerable households, equity, and near-term consumption.",
    toolkits: ["fiscal", "combined", "advanced"],
    formatValue: (value) => `${value.toFixed(1)}%`
  },
  {
    key: "indirectTaxRate",
    label: "Sales / VAT tax",
    category: "macro",
    min: 0,
    max: 15,
    step: 0.5,
    help: "Raises revenue, but it can worsen cost-push inflation when overused.",
    toolkits: ["advanced"],
    formatValue: (value) => `${value.toFixed(1)}%`
  },
  {
    key: "capitalSpending",
    label: "Infrastructure spending",
    category: "macro",
    min: 0,
    max: 8,
    step: 0.5,
    help: "Builds future capacity and productivity rather than just this year's demand.",
    toolkits: ["advanced"],
    formatValue: (value) => `${value.toFixed(1)}%`
  },
  {
    key: "educationTraining",
    label: "Education and training",
    category: "macro",
    min: 0,
    max: 8,
    step: 0.5,
    help: "Lowers structural unemployment and can reduce inequality over time.",
    toolkits: ["advanced"],
    formatValue: (value) => `${value.toFixed(1)}%`
  },
  {
    key: "marketReforms",
    label: "Competition and labor reform",
    category: "macro",
    min: 0,
    max: 10,
    step: 0.5,
    help: "Can improve efficiency and competitiveness, but overly aggressive reform can hurt equity.",
    toolkits: ["advanced"],
    formatValue: (value) => `${value.toFixed(1)}%`
  },
  {
    key: "bankRegulation",
    label: "Bank regulation",
    category: "finance",
    min: 0,
    max: 10,
    step: 0.5,
    help: "Stronger regulation lowers banking crisis risk, but very strict rules can reduce lending and investment.",
    toolkits: ["combined", "advanced"],
    formatValue: (value) => `${value.toFixed(1)}/10`
  },
  {
    key: "investorTransparency",
    label: "Investor confidence policy",
    category: "finance",
    min: 0,
    max: 10,
    step: 0.5,
    help: "Clear, stable, predictable policy improves confidence, supports stocks and currency, and can lower borrowing costs.",
    toolkits: ["combined", "advanced"],
    formatValue: (value) => `${value.toFixed(1)}/10`
  },
  {
    key: "bondIssuance",
    label: "Issue government bonds",
    category: "finance",
    min: 0,
    max: 600,
    step: 25,
    help: "Bond issuance raises money for government action now, but debt and yields can rise if investors worry about sustainability.",
    toolkits: ["advanced"],
    formatValue: (value) => `$${whole.format(value)}B`
  },
  {
    key: "financialEducation",
    label: "Financial education",
    category: "finance",
    min: 0,
    max: 8,
    step: 0.5,
    help: "Improves saving, borrowing discipline, and long-run household resilience. The payoff is slower but educationally powerful.",
    toolkits: ["combined", "advanced"],
    formatValue: (value) => `${value.toFixed(1)}%`
  },
  {
    key: "consumerCreditRules",
    label: "Consumer credit rules",
    category: "finance",
    min: 0,
    max: 10,
    step: 0.5,
    help: "Loose credit supports consumption but increases default risk. Strict credit protects stability but can slow demand.",
    toolkits: ["advanced"],
    formatValue: (value) => `${value.toFixed(1)}/10`
  },
  {
    key: "depositInsurance",
    label: "Deposit insurance",
    category: "finance",
    min: 0,
    max: 10,
    step: 0.5,
    help: "Protects depositors and reduces bank-run panic, but can create public liabilities and moral hazard if regulation is weak.",
    toolkits: ["combined", "advanced"],
    formatValue: (value) => `${value.toFixed(1)}/10`
  }
];

const MACRO_STAT_HELP: Record<string, string> = {
  Growth:
    "Annual real GDP growth. Each year the engine combines demand pressure from policy, confidence, external demand, and supply capacity, then compares it with potential growth.",
  Inflation:
    "Annual inflation rate. It rises when demand exceeds capacity, indirect taxes or import costs add pressure, and credibility weakens; it falls when demand cools.",
  Unemployment:
    "Share of workers without jobs. It falls when growth runs above potential and rises when demand is weak; training and supply policy can lower the natural rate over time.",
  Budget:
    "Government budget balance as a share of GDP. Positive means surplus, negative means deficit; it reflects tax revenue, spending, transfers, investment, and the economic cycle.",
  "Debt / GDP":
    "Public debt as a share of annual GDP. Deficits add to debt, while growth and surpluses make the ratio easier to manage.",
  Productivity:
    "Supply-side capacity in the economy. It is calculated from potential growth and improves through infrastructure, education and training, and credible reform.",
  Inequality:
    "Distribution pressure index. It rises with unemployment, inflation, and harsh reform costs, and falls when transfers, progressive taxation, and training protect households.",
  Poverty:
    "Estimated poverty rate. It rises when joblessness and inflation hurt households, and falls when growth and transfer payments reach vulnerable groups.",
  "Net exports":
    "Exports minus imports as a share of GDP. It improves when competitiveness and external demand rise, and weakens when domestic demand pulls in more imports.",
  Competitiveness:
    "Trade competitiveness index. The engine builds it from productivity gains, lower inflation, spare capacity, indirect tax pressure, and scenario-specific trade weights.",
  "Bond yield":
    "Estimated government borrowing rate. It rises when inflation, debt, deficits, and risk premiums worry investors; credible policy and bond purchases can ease it.",
  "Currency index":
    "A financial-market currency index where 100 is the inherited baseline. It responds to rates, inflation credibility, trade balance, debt pressure, and competitiveness.",
  "Equity market":
    "A broad stock-market confidence index. Growth, productivity, and business confidence lift it; high yields, inflation, and banking stress drag it down.",
  "Banking stress":
    "Stress in the banking and credit system. High rates, weak jobs, inflation, and bond-market pressure raise it; liquidity support and confidence reduce it.",
  "Investor confidence":
    "A composite confidence score built from credibility, business confidence, currency strength, banking stability, and borrowing costs.",
  "Credit rating":
    "A simple classroom rating based on debt, bond yields, banking stress, inflation, and policy credibility.",
  "Household savings":
    "A purchasing-power index for ordinary savers. High inflation hurts it, while credible policy, financial education, and reasonable interest rates help protect it.",
  "Loan affordability":
    "How easy it is for households and firms to borrow responsibly. Lower rates and easier credit raise affordability, but weak banks or high inflation reduce it.",
  "Inflation impact":
    "The estimated annual purchasing-power loss from inflation. If inflation is 8%, money saved in cash loses meaningful real value unless returns compensate.",
  "Household debt":
    "A household balance-sheet pressure index. Easy credit and weak financial education can raise debt, while stricter credit and literacy programs reduce it.",
  "Default risk":
    "Estimated risk that households and firms cannot repay loans. It rises with high debt, unemployment, inflation, and banking stress.",
  "Banking stability":
    "A safety score for the banking system. Stronger regulation, deposit insurance, and lower default risk improve it."
};

const DEFAULT_PREDICTION: PolicyPrediction = {
  aggregateDemand: "no_change",
  aggregateSupply: "no_change",
  unemployment: "no_change",
  inflation: "no_change",
  explanation: ""
};

const DIRECTION_OPTIONS: Array<{ value: PolicyEffectDirection; label: string }> = [
  { value: "increase", label: "Increase" },
  { value: "decrease", label: "Decrease" },
  { value: "no_change", label: "No material change" }
];

const DIRECTION_LABELS: Record<PolicyEffectDirection, string> = {
  increase: "Increase",
  decrease: "Decrease",
  no_change: "No material change"
};

const FEEDBACK_MARK_LABELS = {
  correct: "Correct",
  partial: "Partially correct",
  incorrect: "Incorrect"
} as const;

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function electionBaseVotes(night: ElectionNight, winner: "player" | "opposition") {
  const calledVotes = night.calls
    .filter((call) => call.winner === winner)
    .reduce((sum, call) => sum + (call.value ?? call.electoralVotes ?? 0), 0);
  const totalVotes = winner === "player" ? night.playerVotes : night.oppositionVotes;
  return totalVotes - calledVotes;
}

function previewText(text: string | null | undefined, max = 180) {
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}...`;
}

function signedChange(after: number | undefined, before: number | undefined) {
  if (typeof after !== "number" || typeof before !== "number") return "Outcome pending";
  const change = after - before;
  if (Math.abs(change) < 0.05) return "No material change";
  return change > 0 ? `Increased by ${pct(change)}` : `Decreased by ${pct(Math.abs(change))}`;
}

function clampDisplay(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function creditRating(current: RunState["current"]) {
  const stress =
    Math.max(0, current.debtRatio - 70) * 0.18 +
    Math.max(0, current.sovereignYield - 4) * 3.4 +
    Math.max(0, current.bankingStress - 35) * 0.22 +
    Math.max(0, current.inflation - 4) * 0.8 -
    Math.max(0, current.policyCredibility - 55) * 0.16;
  if (stress < 5) return "AAA";
  if (stress < 12) return "AA";
  if (stress < 20) return "A";
  if (stress < 30) return "BBB";
  if (stress < 42) return "BB";
  return "B";
}

function PolicyControlGroup({
  title,
  eyebrow,
  rows,
  run,
  activePolicyHelp,
  setActivePolicyHelp,
  onPolicyChange,
  finance = false
}: {
  title: string;
  eyebrow: string;
  rows: PolicyRow[];
  run: RunState;
  activePolicyHelp: keyof Policies | null;
  setActivePolicyHelp: Dispatch<SetStateAction<keyof Policies | null>>;
  onPolicyChange: (key: keyof Policies, value: number) => void;
  finance?: boolean;
}) {
  return (
    <section className={`policy-control-group stack-sm ${finance ? "finance-policy-group" : ""}`}>
      <div className="policy-group-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3>{title}</h3>
        </div>
        {finance ? <span className="pill">Stocks, bonds, credit, savings</span> : null}
      </div>
      <div className="policy-command-list">
        {rows.map((row) => {
          const tooltipOpen = activePolicyHelp === row.key;
          return (
            <div key={row.key} className="policy-control-row">
              <div className="policy-control-top">
                <div className="policy-control-heading">
                  <div className="policy-control-label-wrap">
                    <span className="policy-control-label">{row.label}</span>
                    <button
                      className="info-button"
                      type="button"
                      aria-label={`Explain ${row.label}`}
                      aria-expanded={tooltipOpen}
                      onMouseEnter={() => setActivePolicyHelp(row.key)}
                      onMouseLeave={() => setActivePolicyHelp((current) => (current === row.key ? null : current))}
                      onFocus={() => setActivePolicyHelp(row.key)}
                      onBlur={() => setActivePolicyHelp((current) => (current === row.key ? null : current))}
                      onClick={() => setActivePolicyHelp((current) => (current === row.key ? null : row.key))}
                    >
                      i
                    </button>
                  </div>
                  <strong className="policy-control-value">{row.formatValue(run.policies[row.key])}</strong>
                </div>
                {tooltipOpen ? <div className="policy-tooltip">{row.help}</div> : null}
              </div>
              <input
                type="range"
                min={row.min}
                max={row.max}
                step={row.step}
                value={run.policies[row.key]}
                disabled={run.complete}
                onChange={(event) => onPolicyChange(row.key, Number(event.target.value))}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function PlayExperience() {
  const router = useRouter();
  const params = useSearchParams();
  const [run, setRun] = useState<RunState | null>(null);
  const [status, setStatus] = useState("");
  const [profileName, setProfileName] = useState("");
  const [inaugurationOpen, setInaugurationOpen] = useState(false);
  const [newsModal, setNewsModal] = useState<RoundBriefing | null>(null);
  const [briefingStep, setBriefingStep] = useState(0);
  const [queuedElectionNight, setQueuedElectionNight] = useState<ElectionNight | null>(null);
  const [electionNight, setElectionNight] = useState<ElectionNight | null>(null);
  const [electionElapsed, setElectionElapsed] = useState(0);
  const [activePolicyHelp, setActivePolicyHelp] = useState<keyof Policies | null>(null);
  const [activeMacroHelp, setActiveMacroHelp] = useState<string | null>(null);
  const [activeInsightDetail, setActiveInsightDetail] = useState<InsightDetailKey | null>(null);
  const [classroomContext, setClassroomContext] = useState<ClassroomContext | null>(null);
  const [studentFeedback, setStudentFeedback] = useState<ClassroomPolicyDecision[]>([]);
  const [predictionOpen, setPredictionOpen] = useState(false);
  const [prediction, setPrediction] = useState<PolicyPrediction>(DEFAULT_PREDICTION);
  const [predictionStatus, setPredictionStatus] = useState("");
  const [predictionSaving, setPredictionSaving] = useState(false);
  const [glossaryStatus, setGlossaryStatus] = useState("");

  useEffect(() => {
    const runId = params.get("run") ?? getActiveRunId();
    if (!runId) {
      setStatus("No active run found. Start a new reign from setup.");
      return;
    }

    const nextRun = getRun(runId);
    if (!nextRun) {
      setStatus("That run could not be found in browser storage.");
      return;
    }

    setRun(nextRun);
    setInaugurationOpen(!nextRun.inaugurationAcknowledged && nextRun.current.round === 0 && !nextRun.complete);
    setActiveRunId(nextRun.runId);
    setProfileName(getProfile().displayName);
    track("page_view", { page: "/play", runId: nextRun.runId });
  }, [params]);

  useEffect(() => {
    async function loadClassroomContext() {
      try {
        const response = await fetch("/api/classroom/context", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        setClassroomContext(data.context ?? null);
      } catch {
        setClassroomContext(null);
      }
    }

    void loadClassroomContext();
  }, []);

  useEffect(() => {
    if (!run?.runId) return;
    void loadStudentFeedback(run.runId);
  }, [run?.runId]);

  useEffect(() => {
    if (!run?.complete || newsModal || electionNight) return;
    const timeout = window.setTimeout(() => {
      router.push(`/play/results/${run.runId}`);
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [electionNight, newsModal, router, run]);

  useEffect(() => {
    if (!electionNight) {
      setElectionElapsed(0);
      return;
    }

    setElectionElapsed(0);
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const nextElapsed = Math.min(electionNight.totalSeconds, (Date.now() - startedAt) / 1000);
      setElectionElapsed(nextElapsed);
      if (nextElapsed >= electionNight.totalSeconds) {
        window.clearInterval(interval);
      }
    }, 150);

    return () => window.clearInterval(interval);
  }, [electionNight]);

  function save(nextRun: RunState) {
    setRun(nextRun);
    saveRun(nextRun);
  }

  function syncCompletedRun(nextRun: RunState) {
    void fetch("/api/runs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        runId: nextRun.runId,
        scenarioId: nextRun.scenarioId,
        scenarioTitle: nextRun.scenarioTitle,
        difficultyId: nextRun.difficultyId,
        score: nextRun.score,
        rankTitle: nextRun.rankTitle,
        victory: nextRun.victory,
        summary: nextRun.summary,
        roundsCompleted: nextRun.current.round,
        avgGrowth: average(nextRun.history.map((item) => item.growth)),
        avgInflation: average(nextRun.history.map((item) => item.inflation)),
        avgUnemployment: average(nextRun.history.map((item) => item.unemployment)),
        avgApproval: average(nextRun.history.map((item) => item.approval))
      })
    }).catch(() => null);
  }

  async function loadStudentFeedback(runId: string) {
    try {
      const response = await fetch(`/api/classroom/feedback/${runId}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setStudentFeedback(data.decisions ?? []);
    } catch {
      setStudentFeedback([]);
    }
  }

  async function postClassroomDecision(phase: "begin" | "complete", baseRun: RunState, submittedPrediction: PolicyPrediction, nextRun?: RunState) {
    const latestEntry = nextRun?.history[nextRun.history.length - 1];
    const response = await fetch("/api/classroom/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phase,
        runId: baseRun.runId,
        scenarioId: baseRun.scenarioId,
        scenarioTitle: baseRun.scenarioTitle,
        difficultyId: baseRun.difficultyId,
        round: baseRun.current.round + 1,
        year: baseRun.current.calendarYear + 1,
        policies: baseRun.policies,
        beforeState: baseRun.current,
        afterState: nextRun?.current,
        prediction: submittedPrediction,
        policySummary: latestEntry?.briefing?.policySummary ?? latestEntry?.note,
        citizenSummary: latestEntry?.briefing?.citizenSummary ?? latestEntry?.citizenImpact,
        scoreAfter: latestEntry?.score ?? nextRun?.score,
        runComplete: nextRun?.complete ?? false,
        finalScore: nextRun?.complete ? nextRun.score : null,
        rankTitle: nextRun?.rankTitle,
        victory: nextRun?.victory,
        summary: nextRun?.summary,
        roundsCompleted: nextRun?.current.round
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error ?? "Unable to save classroom prediction.");
    }
    return data;
  }

  function finalizeAdvancedRun(nextRun: RunState) {
    save(nextRun);
    openRoundEvents(nextRun);
    track("round_advanced", { runId: nextRun.runId, round: nextRun.current.round });

    if (nextRun.complete) {
      setActiveRunId(null);
      const nextProfile = registerCompletedRun(nextRun);
      setProfileName(nextProfile.displayName);
      syncCompletedRun(nextRun);
      track(nextRun.victory ? "run_completed" : "run_failed", {
        runId: nextRun.runId,
        score: nextRun.score,
        scenarioId: nextRun.scenarioId
      });
    }
  }

  function onPolicyChange(key: keyof Policies, value: number) {
    if (!run || run.complete) return;
    save(updatePolicies(run, { [key]: value }));
  }

  function onResetPolicies() {
    if (!run || run.complete) return;
    save(updatePolicies(run, defaultPolicies()));
  }

  function openRoundEvents(nextRun: RunState) {
    const latestEntry = nextRun.history[nextRun.history.length - 1];
    if (latestEntry?.briefing) {
      setNewsModal(latestEntry.briefing);
      setBriefingStep(0);
      setGlossaryStatus("");
    }
    setQueuedElectionNight(latestEntry?.electionNight ?? null);
  }

  function onAdvance() {
    if (!run || run.complete || inaugurationOpen) return;
    setPrediction(DEFAULT_PREDICTION);
    setPredictionStatus("");
    setPredictionOpen(true);
  }

  async function onSubmitPrediction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!run || run.complete || predictionSaving) return;

    const submittedPrediction = {
      ...prediction,
      explanation: prediction.explanation.trim()
    };

    if (!submittedPrediction.explanation) {
      setPredictionStatus("Explain your reasoning before the year is simulated.");
      return;
    }

    setPredictionSaving(true);
    setPredictionStatus(classroomContext ? "Saving your prediction for your teacher..." : "Simulating the year...");

    try {
      if (classroomContext) {
        await postClassroomDecision("begin", run, submittedPrediction);
      }

      const nextRun = advanceRun(run);

      if (classroomContext) {
        setPredictionStatus("Saving the outcome for your teacher...");
        await postClassroomDecision("complete", run, submittedPrediction, nextRun);
      }

      setPredictionOpen(false);
      setPrediction(DEFAULT_PREDICTION);
      setPredictionStatus("");
      finalizeAdvancedRun(nextRun);
      if (classroomContext) {
        void loadStudentFeedback(nextRun.runId);
      }
    } catch (error) {
      setPredictionStatus(error instanceof Error ? error.message : "Unable to save the classroom decision.");
    } finally {
      setPredictionSaving(false);
    }
  }

  function closeNewsModal() {
    setNewsModal(null);
    setBriefingStep(0);
    if (queuedElectionNight) {
      setElectionNight(queuedElectionNight);
      setQueuedElectionNight(null);
    }
  }

  function advanceBriefing() {
    if (!newsModal) return;
    if (briefingStep < briefingStepCount - 1) {
      setBriefingStep((current) => current + 1);
      return;
    }
    closeNewsModal();
  }

  function addTheoryToGlossary(card: RoundBriefing["theoryCard"]) {
    if (!card) return;
    const terms = card.relatedGlossaryTerms?.length ? card.relatedGlossaryTerms : [card.keyConcept];
    const current = JSON.parse(window.localStorage.getItem("pm.v1.savedGlossary") ?? "[]") as string[];
    const next = Array.from(new Set([...current, ...terms]));
    window.localStorage.setItem("pm.v1.savedGlossary", JSON.stringify(next));
    setGlossaryStatus(`${terms.length} concept${terms.length === 1 ? "" : "s"} saved to your glossary.`);
  }

  function acknowledgeInauguration() {
    if (!run) return;
    const nextRun = {
      ...run,
      inaugurationAcknowledged: true,
      updatedAt: new Date().toISOString()
    };
    save(nextRun);
    setInaugurationOpen(false);
    track("inauguration_acknowledged", { runId: nextRun.runId, scenarioId: nextRun.scenarioId });
  }

  function continueAfterElectionNight() {
    if (!run || !electionNight) return;
    if (electionElapsed < electionNight.totalSeconds) return;

    if (run.complete) {
      router.push(`/play/results/${run.runId}`);
      return;
    }

    setElectionNight(null);
  }

  if (!run) {
    return (
      <section className="shell section">
        <div className="panel stack-md">
          <h1>Launch a run first</h1>
          <p className="muted">{status}</p>
          <Link className="button primary" href="/play/setup">
            Go To Setup
          </Link>
        </div>
      </section>
    );
  }

  const scenario = getScenario(run.scenarioId);
  const mandate = scenario.mechanics.mandate;
  const benchmark = compareToBenchmarks(run.score, scenario.country);
  const latestYear = run.history[run.history.length - 1];
  const reelectionRound = run.reelectionRound ?? 4;
  const reelectionThreshold = run.reelectionThreshold ?? 40;
  const firstGoal = scenario.goals[0]?.label ?? "stabilize the economy and retain public trust";
  const electionStatus =
    run.current.round < reelectionRound
      ? `${mandate.checkpointLabel} after year ${reelectionRound}. You need ${reelectionThreshold}% approval.`
      : run.reelected
        ? mandate.securedLabel
        : run.complete && run.current.round === reelectionRound
          ? mandate.lostLabel
          : mandate.unresolvedLabel;
  const visiblePolicies = POLICY_ROWS.filter((row) => row.toolkits.includes(run.policyComplexity));
  const macroPolicyRows = visiblePolicies.filter((row) => row.category === "macro");
  const financePolicyRows = visiblePolicies.filter((row) => row.category === "finance");
  const learningMode = run.learningMode ?? "learning";
  const briefingStepCount = learningMode === "challenge" ? 3 : 4;
  const briefingLabel =
    briefingStep === 0
      ? "Policy effect"
      : briefingStep === 1
        ? "Citizen impact"
        : briefingStep === 2
          ? "Theory card"
          : "The evening column";

  const visibleCalls = electionNight?.calls.filter((call) => call.secondsFromStart <= electionElapsed) ?? [];
  const electionFinished = Boolean(electionNight && electionElapsed >= electionNight.totalSeconds);
  const livePlayerVotes =
    (electionNight ? electionBaseVotes(electionNight, "player") : 0) +
    visibleCalls.filter((call) => call.winner === "player").reduce((sum, call) => sum + (call.value ?? call.electoralVotes ?? 0), 0);
  const liveOppositionVotes =
    (electionNight ? electionBaseVotes(electionNight, "opposition") : 0) +
    visibleCalls.filter((call) => call.winner === "opposition").reduce((sum, call) => sum + (call.value ?? call.electoralVotes ?? 0), 0);
  const presidencyProgress = Math.min(100, (run.current.round / run.maxRounds) * 100);
  const reelectionProgress = Math.min(100, (reelectionRound / run.maxRounds) * 100);
  const mandateSummary = run.complete
    ? run.summary ?? "This term has concluded."
    : run.current.round >= reelectionRound
      ? mandate.postCheckpointSummary
      : `You are still in the first mandate. Reach year ${reelectionRound} above ${reelectionThreshold}% approval to ${mandate.checkpointVerb}.`;
  const officeTitle = `${mandate.officeTitle} of ${scenario.country}`;
  const macroStats: MacroStat[] = [
    { label: "Growth", value: pct(run.current.growth), help: MACRO_STAT_HELP.Growth },
    { label: "Inflation", value: pct(run.current.inflation), help: MACRO_STAT_HELP.Inflation },
    { label: "Unemployment", value: pct(run.current.unemployment), help: MACRO_STAT_HELP.Unemployment },
    { label: "Budget", value: signedPct(run.current.budgetBalance), help: MACRO_STAT_HELP.Budget },
    { label: "Debt / GDP", value: pct(run.current.debtRatio), help: MACRO_STAT_HELP["Debt / GDP"] },
    { label: "Productivity", value: pct(run.current.productivity), help: MACRO_STAT_HELP.Productivity },
    { label: "Inequality", value: run.current.inequality.toFixed(1), help: MACRO_STAT_HELP.Inequality },
    { label: "Poverty", value: pct(run.current.poverty), help: MACRO_STAT_HELP.Poverty },
    ...(scenario.mode === "open"
      ? [
          { label: "Net exports", value: signedPct(run.current.netExports), help: MACRO_STAT_HELP["Net exports"] },
          { label: "Competitiveness", value: whole.format(run.current.competitiveness), help: MACRO_STAT_HELP.Competitiveness }
        ]
      : [])
  ];
  const financialStats: MacroStat[] = [
    { label: "Bond yield", value: pct(run.current.sovereignYield), help: MACRO_STAT_HELP["Bond yield"] },
    { label: "Currency index", value: whole.format(run.current.currencyIndex), help: MACRO_STAT_HELP["Currency index"] },
    { label: "Equity market", value: whole.format(run.current.equityMarket), help: MACRO_STAT_HELP["Equity market"] },
    { label: "Investor confidence", value: whole.format(clampDisplay(
      run.current.policyCredibility * 0.45 +
        run.current.businessConfidence * 0.22 +
        run.current.currencyIndex * 0.12 +
        (100 - run.current.bankingStress) * 0.2 -
        Math.max(0, run.current.sovereignYield - 5) * 2.4,
      0,
      100
    )), help: MACRO_STAT_HELP["Investor confidence"] },
    { label: "Credit rating", value: creditRating(run.current), help: MACRO_STAT_HELP["Credit rating"] },
    { label: "Banking stability", value: whole.format(clampDisplay(100 - run.current.bankingStress, 0, 100)), help: MACRO_STAT_HELP["Banking stability"] },
    { label: "Banking stress", value: whole.format(run.current.bankingStress), help: MACRO_STAT_HELP["Banking stress"] },
    { label: "Household debt", value: whole.format(run.current.householdDebt), help: MACRO_STAT_HELP["Household debt"] },
    { label: "Default risk", value: pct(run.current.defaultRisk), help: MACRO_STAT_HELP["Default risk"] },
    { label: "Household savings", value: whole.format(clampDisplay(
      100 -
        Math.max(0, run.current.inflation - 2.3) * 3.2 +
        Math.max(0, run.policies.interestRate - 2) * 1.4 +
        Math.max(0, run.policies.financialEducation - 3) * 2.2 -
        Math.max(0, run.current.defaultRisk - 20) * 0.25,
      35,
      125
    )), help: MACRO_STAT_HELP["Household savings"] },
    { label: "Loan affordability", value: whole.format(clampDisplay(
      92 -
        run.policies.interestRate * 4.5 -
        Math.max(0, run.policies.consumerCreditRules - 5) * 3.4 -
        Math.max(0, run.current.bankingStress - 35) * 0.45 +
        Math.max(0, 5 - run.policies.consumerCreditRules) * 2.8,
      15,
      115
    )), help: MACRO_STAT_HELP["Loan affordability"] },
    { label: "Inflation impact", value: pct(Math.max(0, run.current.inflation)), help: MACRO_STAT_HELP["Inflation impact"] }
  ];
  const markedFeedback = studentFeedback.filter((decision) => decision.feedback);

  return (
    <>
      <section className="shell section stack-lg play-shell">
        <section className="panel presidency-panel stack-md">
          <div className="presidency-header">
            <div className="stack-sm presidency-copy">
              <p className="eyebrow">{profileName}&apos;s active reign</p>
              <h1 className="display compact">{scenario.title}</h1>
              <p className="lede compact-lede">{scenario.summary}</p>
            </div>
            <div className="presidency-summary-grid">
              <article className="summary-kpi">
                <span>Live score</span>
                <strong>{whole.format(run.score)}</strong>
              </article>
              <article className="summary-kpi">
                <span>Approval</span>
                <strong>{whole.format(run.current.approval)}</strong>
              </article>
              <article className="summary-kpi">
                <span>Closest benchmark</span>
                <strong>{benchmark.nearest}</strong>
              </article>
            </div>
          </div>

          <div className="presidency-progress-box">
            <div className="presidency-progress-head">
              <div>
                <p className="eyebrow">Mandate Progress</p>
                <h2>Year {run.current.round} / {run.maxRounds}</h2>
              </div>
              <div className="pill-row">
                <span className="pill">{POLICY_TOOLKIT_LABELS[run.policyComplexity]}</span>
                <span className="pill">{learningMode === "challenge" ? "Challenge Mode" : "Learning Mode"}</span>
                <span className="pill">Impeachment floor {run.approvalFloor}</span>
                <span className="pill">{electionStatus}</span>
              </div>
            </div>

            <div className="play-progress-track" aria-label={`Year ${run.current.round} of ${run.maxRounds}`}>
              <div className="play-progress-fill" style={{ width: `${presidencyProgress}%` }} />
              <div className="play-progress-marker" style={{ left: `${reelectionProgress}%` }}>
                <span>{mandate.progressMarkerLabel}</span>
              </div>
            </div>

            <div className="progress-caption">
              <span>Start of mandate</span>
              <span>Year {reelectionRound} checkpoint</span>
              <span>End of mandate</span>
            </div>
            {run.complete ? <p className="muted small">Opening your ranked result automatically...</p> : null}
          </div>
        </section>

        <section className="panel command-summary-panel stack-md">
          <div className="section-header">
            <div>
              <p className="eyebrow">Command Summary</p>
              <h2>Macro state, country structure, and mandate goals in one view</h2>
            </div>
            <div className="pill-row">
              <span className="pill">{scenario.country}</span>
              <span className="pill">{scenario.politicalSystem}</span>
              <span className="pill">{run.rankTitle}</span>
            </div>
          </div>

          <div className="command-summary-grid">
            <section className="summary-section stack-sm">
              <div className="stack-xs">
                <p className="eyebrow">Current Economy</p>
                <h3>Macro snapshot</h3>
              </div>
              <div className="macro-stat-grid">
                {macroStats.map((stat) => {
                  const tooltipOpen = activeMacroHelp === stat.label;
                  return (
                  <div
                    key={stat.label}
                    className="stat-card macro-stat-card"
                    tabIndex={0}
                    onMouseEnter={() => setActiveMacroHelp(stat.label)}
                    onMouseLeave={() => setActiveMacroHelp((current) => (current === stat.label ? null : current))}
                    onFocus={() => setActiveMacroHelp(stat.label)}
                    onBlur={() => setActiveMacroHelp((current) => (current === stat.label ? null : current))}
                  >
                    <span className="macro-stat-label">
                      {stat.label}
                      <button
                        className="info-button compact-info-button"
                        type="button"
                        aria-label={`Explain ${stat.label}`}
                        aria-expanded={tooltipOpen}
                        onClick={(event) => {
                          event.stopPropagation();
                          setActiveMacroHelp((current) => (current === stat.label ? null : stat.label));
                        }}
                      >
                        i
                      </button>
                    </span>
                    <strong>{stat.value}</strong>
                    {tooltipOpen ? <div className="policy-tooltip macro-tooltip">{stat.help}</div> : null}
                  </div>
                  );
                })}
              </div>
            </section>

            <section className="summary-section stack-sm finance-section">
              <div className="stack-xs">
                <p className="eyebrow">Finance Desk</p>
                <h3>Markets, currency, and banking pressure</h3>
                <p className="muted">
                  Investors now react to your fiscal credibility, monetary stance, and growth outlook every year.
                </p>
              </div>
              <div className="macro-stat-grid finance-stat-grid">
                {financialStats.map((stat) => {
                  const tooltipOpen = activeMacroHelp === stat.label;
                  return (
                    <div
                      key={stat.label}
                      className="stat-card macro-stat-card finance-stat-card"
                      tabIndex={0}
                      onMouseEnter={() => setActiveMacroHelp(stat.label)}
                      onMouseLeave={() => setActiveMacroHelp((current) => (current === stat.label ? null : current))}
                      onFocus={() => setActiveMacroHelp(stat.label)}
                      onBlur={() => setActiveMacroHelp((current) => (current === stat.label ? null : current))}
                    >
                      <span className="macro-stat-label">
                        {stat.label}
                        <button
                          className="info-button compact-info-button"
                          type="button"
                          aria-label={`Explain ${stat.label}`}
                          aria-expanded={tooltipOpen}
                          onClick={(event) => {
                            event.stopPropagation();
                            setActiveMacroHelp((current) => (current === stat.label ? null : stat.label));
                          }}
                        >
                          i
                        </button>
                      </span>
                      <strong>{stat.value}</strong>
                      {tooltipOpen ? <div className="policy-tooltip macro-tooltip">{stat.help}</div> : null}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="summary-section stack-sm">
              <div className="stack-xs">
                <p className="eyebrow">Structural Context</p>
                <h3>{scenario.country} at a glance</h3>
                <p className="muted">{scenario.mechanics.summary}</p>
              </div>
              <div className="timeline compact-list">
                {scenario.mechanics.notes.slice(0, 3).map((note) => (
                  <div key={note} className="timeline-item">
                    {note}
                  </div>
                ))}
              </div>
            </section>

            <section className="summary-section stack-sm">
              <div className="stack-xs">
                <p className="eyebrow">Mandate Goals</p>
                <h3>Scenario targets</h3>
              </div>
              <div className="goal-list compact-list">
                {scenario.goals.map((goal) => (
                  <div key={goal.label} className={`goal-item ${run.goalsAchieved.includes(goal.label) ? "complete" : ""}`}>
                    {goal.label}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>

        <section className="panel policy-command-panel stack-md">
          <div className="section-header policy-command-header">
            <div>
              <p className="eyebrow">Policy Board</p>
              <h2>
                {run.policyComplexity === "fiscal"
                  ? "Fiscal policy board"
                  : run.policyComplexity === "monetary"
                    ? "Monetary policy board"
                    : run.policyComplexity === "combined"
                      ? "Combined fiscal and monetary board"
                      : "Full macro policy board"}
              </h2>
            </div>
            <div className="policy-command-actions">
              <button className="button secondary" onClick={onResetPolicies} type="button">
                Reset Policies
              </button>
              {!run.complete ? (
                <button className="button primary" onClick={onAdvance} type="button" disabled={inaugurationOpen || predictionSaving}>
                  {inaugurationOpen ? "Awaiting inauguration oath" : predictionSaving ? "Saving..." : "Set Policies"}
                </button>
              ) : (
                <div className="pill">Final results opening...</div>
              )}
            </div>
          </div>

          <div className="policy-section-stack">
            <PolicyControlGroup
              title="Economic policy"
              eyebrow="Macro levers"
              rows={macroPolicyRows}
              run={run}
              activePolicyHelp={activePolicyHelp}
              setActivePolicyHelp={setActivePolicyHelp}
              onPolicyChange={onPolicyChange}
            />

            {financePolicyRows.length ? (
              <PolicyControlGroup
                title="Financial decisions"
                eyebrow="Finance Lab"
                rows={financePolicyRows}
                run={run}
                activePolicyHelp={activePolicyHelp}
                setActivePolicyHelp={setActivePolicyHelp}
                onPolicyChange={onPolicyChange}
                finance
              />
            ) : null}
          </div>
        </section>

        <section className="insight-grid">
          <article className="panel insight-panel stack-sm">
            <div className="stack-xs">
              <p className="eyebrow">Household Impact</p>
              <h2>How ordinary people felt this year</h2>
            </div>
            <p className="muted insight-preview">
              {previewText(
                latestYear.citizenImpact ??
                  "Families are still living with the inherited conditions from the starting year of your reign."
              )}
            </p>
            <button className="button secondary" onClick={() => setActiveInsightDetail("household")} type="button">
              Open Details
            </button>
          </article>

          <article className="panel insight-panel stack-sm">
            <div className="stack-xs">
              <p className="eyebrow">Latest Briefing</p>
              <h2>{latestYear.briefing?.strapline ?? "The press room is waiting for the next year to close."}</h2>
            </div>
            <p className="muted insight-preview">{previewText(latestYear.note)}</p>
            <button
              className="button secondary"
              onClick={() => {
                if (latestYear.briefing) {
                  setNewsModal(latestYear.briefing);
                  setBriefingStep(0);
                  return;
                }
                setActiveInsightDetail("briefing");
              }}
              type="button"
            >
              Open Details
            </button>
          </article>

          <article className="panel insight-panel stack-sm">
            <div className="stack-xs">
              <p className="eyebrow">Mandate Status</p>
              <h2>{run.rankTitle}</h2>
            </div>
            <p className="muted insight-preview">{previewText(mandateSummary)}</p>
            <button className="button secondary" onClick={() => setActiveInsightDetail("mandate")} type="button">
              Open Details
            </button>
          </article>
        </section>

        <div className="history-stack stack-md">
          <section className="panel stack-sm compact-panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">Year-by-Year Record</p>
                <h2>Compact enough to scan, detailed enough to debrief</h2>
              </div>
            </div>
            <div className="table-wrap compact-table-wrap">
              <table className="record-table compact-record-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Growth</th>
                    <th>Inflation</th>
                    <th>Unemp.</th>
                    <th>Approval</th>
                    <th>Policy Effect</th>
                    <th>Citizen Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {run.history.map((entry) => (
                    <tr key={`${entry.year}-${entry.approval}`}>
                      <td>{entry.year}</td>
                      <td>{pct(entry.growth)}</td>
                      <td>{pct(entry.inflation)}</td>
                      <td>{pct(entry.unemployment)}</td>
                      <td>{whole.format(entry.approval)}</td>
                      <td>{entry.note}</td>
                      <td>{entry.citizenImpact ?? "Citizen effects were not recorded for this older save."}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel stack-sm compact-panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">Milestones</p>
                <h2>Latest mandate signals</h2>
              </div>
            </div>
            <div className="timeline compact-list">
              {run.milestoneNotes.slice(-4).map((item, index) => (
                <div key={`${item}-${index}`} className="timeline-item">
                  {item}
                </div>
              ))}
            </div>
          </section>

          {classroomContext ? (
            <section className="panel stack-sm compact-panel">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Teacher Feedback</p>
                  <h2>Marks and comments from your class teacher</h2>
                </div>
                <span className="pill">{classroomContext.classroom.name}</span>
              </div>
              {markedFeedback.length ? (
                <div className="feedback-list">
                  {markedFeedback.map((decision) => (
                    <article key={decision.id} className="feedback-card stack-xs">
                      <div className="stat-row">
                        <strong>Year {decision.round}: {FEEDBACK_MARK_LABELS[decision.feedback!.mark]}</strong>
                        <span className="mini-status open">Reviewed</span>
                      </div>
                      <p className="muted small">{decision.feedback?.comment || "No written comment added yet."}</p>
                      <p className="muted small">
                        Your prediction: AD {DIRECTION_LABELS[decision.prediction.aggregateDemand].toLowerCase()},
                        AS {DIRECTION_LABELS[decision.prediction.aggregateSupply].toLowerCase()},
                        unemployment {DIRECTION_LABELS[decision.prediction.unemployment].toLowerCase()},
                        inflation {DIRECTION_LABELS[decision.prediction.inflation].toLowerCase()}.
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="muted">
                  Your classroom predictions will appear here once your teacher has marked them.
                </p>
              )}
            </section>
          ) : null}
        </div>
      </section>

      {predictionOpen ? (
        <div className="overlay-shell" role="dialog" aria-modal="true" aria-labelledby="prediction-modal-title">
          <form className="overlay-card prediction-overlay stack-md" onSubmit={onSubmitPrediction}>
            <div className="section-header">
              <div>
                <p className="eyebrow">Classroom Reasoning Check</p>
                <h2 id="prediction-modal-title">Predict the macro effects before the year runs</h2>
                <p className="muted">
                  Set out what you expect your policy mix to do. Your teacher will see this prediction alongside the actual result.
                </p>
              </div>
              <span className="pill">
                {classroomContext
                  ? `${classroomContext.classroom.name}${classroomContext.group ? ` · ${classroomContext.group.name}` : ""}`
                  : "Solo run"}
              </span>
            </div>

            <div className="prediction-grid">
              {[
                ["aggregateDemand", "Aggregate Demand"],
                ["aggregateSupply", "Aggregate Supply"],
                ["unemployment", "Unemployment"],
                ["inflation", "Inflation"]
              ].map(([key, label]) => (
                <fieldset key={key} className="prediction-row">
                  <legend>{label}</legend>
                  <div className="prediction-options">
                    {DIRECTION_OPTIONS.map((option) => (
                      <label key={option.value} className={`prediction-option ${prediction[key as keyof PolicyPrediction] === option.value ? "selected" : ""}`}>
                        <input
                          type="radio"
                          name={key}
                          value={option.value}
                          checked={prediction[key as keyof PolicyPrediction] === option.value}
                          onChange={() =>
                            setPrediction((current) => ({
                              ...current,
                              [key]: option.value
                            }))
                          }
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>

            <label className="form-field">
              <span>Why do you expect these effects?</span>
              <textarea
                className="prediction-textarea"
                value={prediction.explanation}
                onChange={(event) => setPrediction((current) => ({ ...current, explanation: event.target.value }))}
                placeholder="Explain the causal chain: policy tools, AD/AS shifts, jobs, prices, confidence, and any trade-offs."
                required
                rows={5}
              />
            </label>

            <div className="section-header prediction-actions">
              <p className="form-status">{predictionStatus}</p>
              <div className="cta-row">
                <button
                  className="button secondary"
                  type="button"
                  disabled={predictionSaving}
                  onClick={() => {
                    setPredictionOpen(false);
                    setPredictionStatus("");
                  }}
                >
                  Back To Policies
                </button>
                <button className="button primary" type="submit" disabled={predictionSaving}>
                  {predictionSaving ? "Saving..." : "Submit Prediction And Simulate Year"}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      {activeInsightDetail ? (
        <div className="overlay-shell" role="dialog" aria-modal="true" aria-labelledby="insight-detail-title">
          <div className="overlay-card stack-md insight-overlay">
            <div className="section-header">
              <div>
                <p className="eyebrow">
                  {activeInsightDetail === "household"
                    ? "Household Impact"
                    : activeInsightDetail === "mandate"
                      ? "Mandate Status"
                      : "Latest Briefing"}
                </p>
                <h2 id="insight-detail-title">
                  {activeInsightDetail === "household"
                    ? "How households experienced the latest year"
                    : activeInsightDetail === "mandate"
                      ? run.rankTitle
                      : "Detailed press note"}
                </h2>
              </div>
              <button className="button secondary" onClick={() => setActiveInsightDetail(null)} type="button">
                Close
              </button>
            </div>

            {activeInsightDetail === "household" ? (
              <div className="stack-md">
                <p className="lede compact-lede">
                  {latestYear.citizenImpact ??
                    "Families are still living with the inherited conditions from the starting year of your reign."}
                </p>
                {latestYear.briefing?.citizenGroups?.length ? (
                  <div className="briefing-groups">
                    {latestYear.briefing.citizenGroups.map((group) => (
                      <article key={group.group} className={`briefing-group ${group.tone}`}>
                        <div className="stat-row">
                          <strong>{group.group}</strong>
                          <span className={`mini-status ${group.tone}`}>{group.tone}</span>
                        </div>
                        <p className="muted">{group.effect}</p>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeInsightDetail === "mandate" ? (
              <div className="stack-md">
                <p className="lede compact-lede">{mandateSummary}</p>
                <div className="timeline compact-list">
                  <div className="timeline-item">{electionStatus}</div>
                  {run.milestoneNotes.slice(-4).map((item, index) => (
                    <div key={`${item}-${index}`} className="timeline-item">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {activeInsightDetail === "briefing" ? (
              <div className="stack-md">
                <p className="lede compact-lede">{latestYear.note}</p>
                <p className="muted">
                  A richer three-part briefing will appear here once a round generates a full briefing package.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {newsModal ? (
        <div className="overlay-shell" role="dialog" aria-modal="true" aria-labelledby="news-modal-title">
          <div className="overlay-card news-overlay">
            <div className="section-header">
              <div>
                <p className="eyebrow">Year-End Briefing</p>
                <h2 id="news-modal-title">Year {newsModal.round} briefing {briefingStep + 1} / {briefingStepCount}</h2>
                <p className="muted">{newsModal.strapline}</p>
              </div>
              <span className="pill">{briefingLabel}</span>
            </div>

            {briefingStep === 0 ? (
              <div className="stack-md">
                <section className="panel compact-panel stack-sm">
                  <p className="eyebrow">Economic Summary</p>
                  <h3>The policy effect this year</h3>
                  <p className="lede compact-lede">{newsModal.policySummary}</p>
                </section>
              </div>
            ) : null}

            {briefingStep === 1 ? (
              <div className="stack-md">
                <section className="panel compact-panel stack-sm">
                  <p className="eyebrow">Citizen Impact</p>
                  <h3>How the year landed across the country</h3>
                  <p className="lede compact-lede">{newsModal.citizenSummary}</p>
                </section>
                <div className="briefing-groups">
                  {newsModal.citizenGroups.map((group) => (
                    <article key={group.group} className={`briefing-group ${group.tone}`}>
                      <div className="stat-row">
                        <strong>{group.group}</strong>
                        <span className={`mini-status ${group.tone}`}>{group.tone}</span>
                      </div>
                      <p className="muted">{group.effect}</p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {briefingStep === 2 && learningMode === "learning" ? (
              <div className="stack-md">
                <section className="panel compact-panel theory-card stack-sm">
                  <p className="eyebrow">Theory Card</p>
                  {newsModal.theoryCard?.actionName ? (
                    <span className="mini-status open">Action: {newsModal.theoryCard.actionName}</span>
                  ) : null}
                  <h3>{newsModal.theoryCard?.title ?? "What economic concept explains this?"}</h3>
                  {newsModal.theoryCard?.whatHappened ? (
                    <div className="goal-item">
                      <span className="eyebrow">What happened?</span>
                      <span>{newsModal.theoryCard.whatHappened}</span>
                    </div>
                  ) : null}
                  <p className="lede compact-lede">
                    {newsModal.theoryCard?.explanation ??
                      "This result came from a policy trade-off: one target improved while another indicator absorbed the cost."}
                  </p>
                  <div className="goal-item data-source-note">
                    <span className="eyebrow">Key Concept</span>
                    <span>{newsModal.theoryCard?.keyConcept ?? "policy trade-offs"}</span>
                  </div>
                  <p className="muted">{newsModal.theoryCard?.learnMore}</p>
                  {newsModal.theoryCard?.relatedGlossaryTerms?.length ? (
                    <div className="pill-row">
                      {newsModal.theoryCard.relatedGlossaryTerms.map((term) => (
                        <span key={term} className="pill">{term}</span>
                      ))}
                    </div>
                  ) : null}
                  <div className="cta-row">
                    <Link className="button secondary" href="/learn">
                      Learn More
                    </Link>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => addTheoryToGlossary(newsModal.theoryCard)}
                    >
                      Add To Glossary
                    </button>
                  </div>
                  {glossaryStatus ? <p className="form-status">{glossaryStatus}</p> : null}
                </section>
              </div>
            ) : null}

            {(learningMode === "challenge" ? briefingStep === 2 : briefingStep === 3) ? (
              <div className="stack-md">
                <section className="panel compact-panel criticism-panel stack-sm">
                  <p className="eyebrow">Evening Column</p>
                  <h3>{newsModal.criticismHeadline}</h3>
                  <p>{newsModal.criticismBody}</p>
                </section>
              </div>
            ) : null}

            <div className="section-header">
              <p className="muted">
                {briefingStep === 0
                  ? "Acknowledge the policy outcome to review how different groups experienced it."
                  : briefingStep === 1
                    ? learningMode === "learning"
                      ? "Acknowledge the citizen impact to open the short theory card."
                      : "Acknowledge the citizen impact to read the final editorial sting."
                    : briefingStep === 2 && learningMode === "learning"
                      ? "Use the concept, then read how the press framed the same result."
                      : "Close the briefing and move on."}
              </p>
              <button className="button primary" onClick={advanceBriefing} type="button">
                {briefingStep === 0
                  ? "Acknowledge Policy Effect"
                  : briefingStep === 1
                    ? learningMode === "learning"
                      ? "Open Theory Card"
                      : "Acknowledge Citizen Impact"
                    : briefingStep === 2 && learningMode === "learning"
                      ? "Continue To Evening Column"
                    : queuedElectionNight
                      ? "Continue To Election Night"
                      : "Close Briefing"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {inaugurationOpen ? (
        <div className="overlay-shell" role="dialog" aria-modal="true" aria-labelledby="inauguration-modal-title">
          <div className="overlay-card inauguration-overlay">
            <div className="stack-sm">
              <p className="eyebrow">Inauguration Day</p>
              <h2 id="inauguration-modal-title">You are now the {officeTitle}.</h2>
              <p className="muted">
                You have inherited the <strong>{scenario.title}</strong> brief in {scenario.startingYear}, and every
                policy choice from this point will shape growth, inflation, jobs, inequality, and the public mood.
              </p>
            </div>

            <div className="inauguration-grid">
              <section className="panel compact-panel stack-sm">
                <p className="eyebrow">Your Role</p>
                <h3>Chief steward of the economy</h3>
                <p>
                  Lead a {scenario.politicalSystem.toLowerCase()} through a high-pressure macro cycle. Balance monetary,
                  fiscal, and supply-side tools while protecting approval and governing credibility.
                </p>
              </section>

              <section className="panel compact-panel stack-sm">
                <p className="eyebrow">Your Mission</p>
                <h3>Win the public and master the trade-offs</h3>
                <p>
                  Your immediate mission is to {firstGoal.charAt(0).toLowerCase() + firstGoal.slice(1)} while keeping
                  households on side and building a record strong enough to {mandate.checkpointVerb}.
                </p>
              </section>
            </div>

            <section className="panel compact-panel inauguration-term stack-sm">
              <p className="eyebrow">Term Reminder</p>
              <h3>This first mandate lasts four years.</h3>
              <p>
                After year {reelectionRound}, {mandate.checkpointAudience} judge your first mandate. If approval falls
                below {reelectionThreshold}%, {mandate.failureConsequence}
              </p>
            </section>

            <div className="section-header">
              <p className="muted">Acknowledge the mandate to begin governing.</p>
              <button className="button primary" onClick={acknowledgeInauguration} type="button">
                I Accept This Mandate
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {electionNight ? (
        <div className="overlay-shell" role="dialog" aria-modal="true" aria-labelledby="election-modal-title">
          <div className="overlay-card election-overlay">
            <div className="stack-sm">
              <p className="eyebrow">Election Night Live</p>
              <h2 id="election-modal-title">{electionNight.headline}</h2>
              <p className="muted">{electionNight.intro}</p>
            </div>

            <div className="election-scoreboard">
              <div className="election-score player">
                <span>{electionNight.playerLabel ?? "You"}</span>
                <strong>{livePlayerVotes}</strong>
              </div>
              <div className="election-progress">
                <span>{electionFinished ? electionNight.finalCountLabel ?? "Final count" : electionNight.liveCountLabel ?? "Live count"}</span>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${(Math.min(electionNight.totalSeconds, electionElapsed) / electionNight.totalSeconds) * 100}%` }}
                  />
                </div>
                <span>
                  {electionNight.targetLabel ?? "Target"}: {electionNight.targetVotes} {electionNight.voteUnitLabel ?? ""}
                </span>
              </div>
              <div className="election-score opposition">
                <span>{electionNight.oppositionLabel ?? "Opposition"}</span>
                <strong>{liveOppositionVotes}</strong>
              </div>
            </div>

            <div className="grid two election-grid">
              <div className="stack-sm">
                <p className="eyebrow">{electionNight.callGroupLabel ?? "Calls"}</p>
                <div className="election-call-list">
                  {electionNight.calls.map((call) => {
                    const revealed = call.secondsFromStart <= electionElapsed;
                    const callLabel = call.label ?? call.state ?? "Undeclared bloc";
                    const callValue = call.value ?? call.electoralVotes ?? 0;
                    const callUnit = electionNight.voteUnitShortLabel ?? electionNight.voteUnitLabel ?? "";
                    const winnerCopy =
                      call.winner === "player"
                        ? electionNight.playerCallLabel ?? "Called for you"
                        : electionNight.oppositionCallLabel ?? "Called for the opposition";
                    return (
                      <div key={callLabel} className={`election-call ${revealed ? "revealed" : "pending"} ${revealed ? call.winner : ""}`}>
                        <div className="stat-row">
                          <strong>{callLabel}</strong>
                          <span>{callValue} {callUnit}</span>
                        </div>
                        <p className="muted small">
                          {revealed ? `${winnerCopy}. ${call.analysis}` : electionNight.pendingCallCopy ?? "Still too close to call."}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <section className="panel compact-panel election-summary-panel">
                <p className="eyebrow">Network Desk</p>
                <h3>{electionFinished ? electionNight.closingMessage : electionNight.interimDeskCopy ?? "Anchors are waiting on late results."}</h3>
                <p className="muted">
                  {electionFinished
                    ? electionNight.outcome === "won"
                      ? electionNight.settledWinCopy ?? "The final calls are in. The next mandate begins immediately."
                      : electionNight.settledLossCopy ?? "The result is settled. Your time in office ends tonight."
                    : electionNight.interimDeskCopy ?? "Each call shifts the live total until the result settles."}
                </p>
                {electionFinished ? (
                  <button className="button primary" onClick={continueAfterElectionNight} type="button">
                    {run.complete ? "Continue To Results" : "Start New Mandate"}
                  </button>
                ) : null}
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
