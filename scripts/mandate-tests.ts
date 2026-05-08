import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { SCENARIOS, getScenario } from "@/lib/game/content";
import { advanceRun, createRun } from "@/lib/game/engine";
import type { RunState } from "@/lib/game/types";

const SNAPSHOT_COUNTRIES = [
  "United States",
  "Canada",
  "Germany",
  "France",
  "Nigeria",
  "China",
  "Saudi Arabia",
  "Singapore",
  "Sri Lanka",
  "Kazakhstan"
] as const;

const SNAPSHOT_EXPECTATIONS = {
  "United States": ["us-electoral-college", "Reelection", "State Calls", "California"],
  Canada: ["parliamentary-majority", "Federal election", "Province And Riding Blocs", "Ontario suburban ridings"],
  Germany: ["mixed-member-coalition", "Bundestag coalition test", "Constituency And List Blocs", "North Rhine-Westphalia constituency seats"],
  France: ["presidential-runoff", "Presidential runoff", "Runoff Blocs", "Paris and inner suburbs"],
  Nigeria: ["federal-presidential-spread", "Federal spread mandate", "Geopolitical Zone Blocs", "Lagos and southwest"],
  China: ["single-party-performance-compact", "Performance compact review", "Household And Provincial Confidence Blocs", "Coastal export provinces"],
  "Saudi Arabia": ["royal-executive-compact", "Vision compact review", "Development And Regional Blocs", "Riyadh investment corridor"],
  Singapore: ["parliamentary-majority", "Parliamentary mandate", "Constituency Groups", "Central business districts"],
  "Sri Lanka": ["managed-presidential-mandate", "Crisis legitimacy vote", "District And Confidence Blocs", "Colombo urban districts"],
  Kazakhstan: ["managed-presidential-mandate", "Managed mandate review", "Regional Confidence Blocs", "Almaty household confidence"]
} as const;

const LEGACY_SCENARIOS = [
  "us-1958-rebuild",
  "uk-1976-imf-crunch",
  "france-1983-rigueur",
  "singapore-2001-trade-slump",
  "egypt-2016-float"
] as const;

function checkpointReady(run: RunState, approval: number): RunState {
  return {
    ...run,
    current: {
      ...run.current,
      round: run.reelectionRound - 1,
      approval,
      growth: 3,
      unemployment: 4.2,
      inflation: 2.3,
      budgetBalance: -2,
      debtRatio: Math.min(run.current.debtRatio, 95),
      inequality: 40,
      poverty: 9,
      consumerConfidence: 65,
      businessConfidence: 65,
      policyCredibility: 70
    }
  };
}

function latestElection(run: RunState) {
  return run.history[run.history.length - 1]?.electionNight ?? null;
}

function byCountry() {
  const map = new Map<string, (typeof SCENARIOS)[number]>();
  for (const scenario of SCENARIOS) {
    if (!map.has(scenario.country)) map.set(scenario.country, scenario);
  }
  return map;
}

function mandateSignature(scenario: (typeof SCENARIOS)[number]) {
  const mandate = scenario.mechanics.mandate;
  return [
    mandate.electionModel,
    mandate.checkpointLabel,
    mandate.electionNight.callGroupLabel,
    mandate.electionNight.calls.won[0]?.label
  ].join("|");
}

test("every scenario declares a mandate presentation", () => {
  for (const scenario of SCENARIOS) {
    assert.ok(scenario.mechanics.mandate.electionModel, scenario.id);
    assert.ok(scenario.mechanics.mandate.officeTitle, scenario.id);
    assert.ok(scenario.mechanics.mandate.checkpointLabel, scenario.id);
    assert.ok(scenario.mechanics.mandate.electionNight.calls.won.length >= 4, scenario.id);
    assert.ok(scenario.mechanics.mandate.electionNight.calls.lost.length >= 4, scenario.id);
  }
});

test("createRun milestone copy uses mandate language", () => {
  for (const scenarioId of LEGACY_SCENARIOS) {
    const scenario = getScenario(scenarioId);
    const run = createRun(scenarioId, "summit");
    const checkpointNote = run.milestoneNotes.find((note) =>
      note.toLowerCase().includes(scenario.mechanics.mandate.checkpointVerb)
    );

    assert.ok(checkpointNote, scenarioId);
    assert.equal(run.reelectionThreshold, scenario.mechanics.politicalPressure.reelectionThreshold);
    assert.equal(run.reelectionRound, scenario.mechanics.politicalPressure.reelectionRound ?? 4);
  }
});

test("advanceRun produces country-appropriate won and lost mandate nights for every country", () => {
  for (const scenario of byCountry().values()) {
    const scenarioId = scenario.id;
    const won = advanceRun(checkpointReady(createRun(scenarioId, "summit"), 88));
    const lost = advanceRun(checkpointReady(createRun(scenarioId, "summit"), 8));
    const wonNight = latestElection(won);
    const lostNight = latestElection(lost);

    assert.equal(wonNight?.model, scenario.mechanics.mandate.electionModel, `${scenarioId} won model`);
    assert.equal(lostNight?.model, scenario.mechanics.mandate.electionModel, `${scenarioId} lost model`);
    assert.equal(wonNight?.outcome, "won", `${scenarioId} won outcome`);
    assert.equal(lostNight?.outcome, "lost", `${scenarioId} lost outcome`);
    assert.ok(won.reelected, `${scenarioId} should survive high-approval checkpoint`);
    assert.equal(lost.complete, true, `${scenarioId} should end after failed checkpoint`);
  }
});

test("non-US mandate templates do not leak US electoral presentation", () => {
  for (const scenario of SCENARIOS.filter((item) => item.country !== "United States")) {
    const serialized = JSON.stringify(scenario.mechanics.mandate);

    assert.doesNotMatch(serialized, /White House|electoral votes|\bEV\b|California|Texas|Wisconsin|Georgia/, scenario.id);

    if (scenario.politicalSystem.includes("Parliamentary") && scenario.country !== "South Africa") {
      assert.notEqual(scenario.mechanics.mandate.officeTitle, "President", scenario.id);
    }
  }
});

test("single-party and absolute monarchy templates avoid competitive opposition framing", () => {
  for (const scenario of SCENARIOS.filter((item) =>
    item.politicalSystem === "Single-Party State" || item.politicalSystem === "Absolute Monarchy"
  )) {
    const night = scenario.mechanics.mandate.electionNight;
    const visibleCopy = [
      night.headlineWon,
      night.headlineLost,
      night.playerLabel,
      night.oppositionLabel,
      night.playerCallLabel,
      night.oppositionCallLabel,
      night.callGroupLabel,
      night.winCopy,
      night.lossCopy
    ].join(" ");

    assert.doesNotMatch(visibleCopy, /opposition|challenger|election night/i, scenario.id);
  }
});

test("each country has a distinct mandate signature and no playable country uses a raw generic base", () => {
  const signatures = new Map<string, string>();
  const rawGenericSignatures = new Set([
    "national-mandate|National mandate vote|Regional Blocs|Capital region",
    "parliamentary-majority|Parliamentary election|Seat Blocs|Capital districts",
    "national-mandate|Legitimacy review|Confidence Blocs|Capital region"
  ]);

  for (const scenario of byCountry().values()) {
    const signature = mandateSignature(scenario);

    assert.ok(!rawGenericSignatures.has(signature), `${scenario.country} still uses a raw generic mandate`);
    assert.ok(!signatures.has(signature), `${scenario.country} shares mandate signature with ${signatures.get(signature)}`);
    signatures.set(signature, scenario.country);
  }
});

test("key country mandate snapshots stay recognizable", () => {
  const countries = byCountry();

  for (const country of SNAPSHOT_COUNTRIES) {
    const scenario = countries.get(country);
    assert.ok(scenario, country);

    const [model, checkpointLabel, callGroupLabel, firstCall] = SNAPSHOT_EXPECTATIONS[country];
    assert.equal(scenario.mechanics.mandate.electionModel, model, country);
    assert.equal(scenario.mechanics.mandate.checkpointLabel, checkpointLabel, country);
    assert.equal(scenario.mechanics.mandate.electionNight.callGroupLabel, callGroupLabel, country);
    assert.equal(scenario.mechanics.mandate.electionNight.calls.won[0]?.label, firstCall, country);
  }
});

test("play UI renders generic mandate fields instead of hard-coded US calls", () => {
  const source = fs.readFileSync("components/game/play-experience.tsx", "utf8");

  assert.doesNotMatch(source, />State Calls</);
  assert.doesNotMatch(source, />Target: \{electionNight\.targetVotes\}</);
  assert.doesNotMatch(source, />Start Second Term</);
});
