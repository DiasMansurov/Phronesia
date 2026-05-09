export type EconomyMode = "closed" | "open";
export type PoliticalSystem =
  | "Presidential Republic"
  | "Parliamentary Democracy"
  | "Parliamentary Republic"
  | "Parliamentary Monarchy"
  | "Federal Republic"
  | "Federal Parliamentary Democracy"
  | "Constitutional Monarchy"
  | "Single-Party State"
  | "Absolute Monarchy"
  | "Technocratic Republic"
  | "Semi-Presidential Republic";
export type ElectionModel =
  | "us-electoral-college"
  | "parliamentary-majority"
  | "presidential-runoff"
  | "presidential-plurality"
  | "federal-presidential-spread"
  | "managed-presidential-mandate"
  | "single-party-performance-compact"
  | "royal-executive-compact"
  | "mixed-member-coalition"
  | "proportional-coalition"
  | "national-mandate";
export type OfferTier = "free" | "premium" | "teacher";
export type DifficultyId = "foundation" | "summit" | "gauntlet";
export type PolicyComplexity = "tutorial" | "fiscal" | "monetary" | "combined" | "advanced";
export type LearningMode = "learning" | "challenge";
export type LearningLevelId =
  | "tutorial"
  | "basic"
  | "policy"
  | "finance"
  | "crisis"
  | "historical"
  | "competitive";

export type Policies = {
  interestRate: number;
  reserveRequirement: number;
  bondPurchases: number;
  incomeTaxRate: number;
  indirectTaxRate: number;
  currentSpending: number;
  transferPayments: number;
  capitalSpending: number;
  educationTraining: number;
  marketReforms: number;
  bankRegulation: number;
  investorTransparency: number;
  bondIssuance: number;
  financialEducation: number;
  consumerCreditRules: number;
  depositInsurance: number;
};

export type CitizenGroupImpact = {
  group: string;
  effect: string;
  tone: "positive" | "mixed" | "negative";
};

export type TheoryCard = {
  title: string;
  actionName?: string;
  whatHappened?: string;
  explanation: string;
  keyConcept: string;
  learnMore: string;
  relatedGlossaryTerms?: string[];
  difficultyLevel?: LearningLevelId;
};

export type RoundBriefing = {
  round: number;
  year: number;
  strapline: string;
  policySummary: string;
  citizenSummary: string;
  citizenGroups: CitizenGroupImpact[];
  criticismHeadline: string;
  criticismBody: string;
  theoryCard?: TheoryCard;
};

export type ElectionCall = {
  label?: string;
  value?: number;
  state?: string;
  electoralVotes?: number;
  winner: "player" | "opposition";
  secondsFromStart: number;
  analysis: string;
};

export type ElectionNight = {
  model?: ElectionModel;
  headline: string;
  intro: string;
  totalSeconds: number;
  targetLabel?: string;
  voteUnitLabel?: string;
  voteUnitShortLabel?: string;
  playerLabel?: string;
  oppositionLabel?: string;
  playerCallLabel?: string;
  oppositionCallLabel?: string;
  callGroupLabel?: string;
  liveCountLabel?: string;
  finalCountLabel?: string;
  pendingCallCopy?: string;
  interimDeskCopy?: string;
  settledWinCopy?: string;
  settledLossCopy?: string;
  targetVotes: number;
  playerVotes: number;
  oppositionVotes: number;
  calls: ElectionCall[];
  outcome: "won" | "lost";
  closingMessage: string;
};

export type ElectionNightTemplate = {
  headlineWon: string;
  headlineLost: string;
  intro: string;
  totalSeconds: number;
  targetVotes: number;
  targetLabel: string;
  voteUnitLabel: string;
  voteUnitShortLabel: string;
  playerLabel: string;
  oppositionLabel: string;
  playerCallLabel: string;
  oppositionCallLabel: string;
  callGroupLabel: string;
  liveCountLabel: string;
  finalCountLabel: string;
  pendingCallCopy: string;
  interimDeskCopy: string;
  settledWinCopy: string;
  settledLossCopy: string;
  seedVotes: {
    won: { player: number; opposition: number };
    lost: { player: number; opposition: number };
  };
  calls: {
    won: ElectionCall[];
    lost: ElectionCall[];
  };
  winCopy: string;
  lossCopy: string;
};

export type MandatePresentation = {
  electionModel: ElectionModel;
  officeTitle: string;
  governmentLabel: string;
  checkpointLabel: string;
  checkpointVerb: string;
  checkpointAudience: string;
  progressMarkerLabel: string;
  securedLabel: string;
  lostLabel: string;
  unresolvedLabel: string;
  postCheckpointSummary: string;
  failureConsequence: string;
  electionNight: ElectionNightTemplate;
};

export type MacroState = {
  round: number;
  calendarYear: number;
  approval: number;
  growth: number;
  potentialGrowth: number;
  outputGap: number;
  unemployment: number;
  naturalUnemployment: number;
  inflation: number;
  budgetBalance: number;
  debtRatio: number;
  netExports: number;
  inequality: number;
  poverty: number;
  consumerConfidence: number;
  businessConfidence: number;
  policyCredibility: number;
  productivity: number;
  competitiveness: number;
  externalDemand: number;
  sovereignYield: number;
  currencyIndex: number;
  equityMarket: number;
  bankingStress: number;
  householdDebt: number;
  defaultRisk: number;
};

export type ScenarioGoal = {
  label: string;
  metric:
    | "approval"
    | "inflation"
    | "unemployment"
    | "debtRatio"
    | "growth"
    | "netExports";
  comparator: "gte" | "lte";
  value: number;
};

export type ScenarioMechanics = {
  summary: string;
  notes: string[];
  mandate: MandatePresentation;
  politicalPressure: {
    reelectionThreshold: number;
    reelectionRound?: number;
    approvalFloorShift: number;
    incumbencyDrag: number;
    approvalVolatility: number;
  };
  externalBalance: {
    tradeSensitivity: number;
    competitivenessWeight: number;
    approvalWeight: number;
    importPassThrough: number;
  };
  policyTradeoffs: {
    monetaryTransmission: number;
    reserveTransmission: number;
    fiscalTransmission: number;
    taxSensitivity: number;
    transferEffectiveness: number;
    supplyResponse: number;
    reformEquityCost: number;
    inflationSensitivity: number;
  };
};

export type UnlockRequirement = {
  completedRuns?: number;
  badges?: string[];
};

export type Scenario = {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  country: string;
  politicalSystem: PoliticalSystem;
  startingYear: number;
  mode: EconomyMode;
  heroTag: string;
  offerTier: OfferTier;
  starterUnlocked?: boolean;
  unlockRequirement?: UnlockRequirement;
  mechanics: ScenarioMechanics;
  goals: ScenarioGoal[];
  startingStats: {
    growth: number;
    unemployment: number;
    inflation: number;
    budget: number;
    netExports: number;
    debt: number;
  };
};

export type LeaderBenchmark = {
  country: string;
  name: string;
  officeLabel: string;
  score: number;
};

export type DifficultyPreset = {
  id: DifficultyId;
  label: string;
  summary: string;
  approvalFloor: number;
  startingApproval: number;
  growthMultiplier: number;
  inflationMultiplier: number;
  debtSensitivity: number;
  competitivenessMultiplier: number;
  scoreMultiplier: number;
};

export type Challenge = {
  id: string;
  label: string;
  summary: string;
  kind: "daily" | "weekly";
  scenarioId: string;
  difficultyId: DifficultyId;
  objective: string;
};

export type HistoryEntry = {
  year: number;
  growth: number;
  unemployment: number;
  inflation: number;
  budgetBalance: number;
  debtRatio?: number;
  netExports: number;
  sovereignYield?: number;
  currencyIndex?: number;
  equityMarket?: number;
  bankingStress?: number;
  householdDebt?: number;
  defaultRisk?: number;
  approval: number;
  score: number;
  note: string;
  citizenImpact: string;
  briefing?: RoundBriefing;
  electionNight?: ElectionNight | null;
};

export type PolicyEffectDirection = "increase" | "decrease" | "no_change";

export type PolicyPrediction = {
  aggregateDemand: PolicyEffectDirection;
  aggregateSupply: PolicyEffectDirection;
  unemployment: PolicyEffectDirection;
  inflation: PolicyEffectDirection;
  explanation: string;
};

export type TeacherFeedbackMark = "correct" | "partial" | "incorrect";

export type TeacherDecisionFeedback = {
  id: string;
  createdAt: string;
  updatedAt: string;
  decisionId: string;
  teacherProfileId: string;
  mark: TeacherFeedbackMark;
  comment: string;
};

export type ClassroomPolicyDecision = {
  id: string;
  createdAt: string;
  updatedAt: string;
  attemptId: string;
  runId: string;
  round: number;
  year: number;
  policies: Policies;
  beforeState: MacroState;
  afterState: MacroState;
  prediction: PolicyPrediction;
  policySummary: string;
  citizenSummary: string;
  scoreAfter: number;
  feedback?: TeacherDecisionFeedback | null;
};

export type ClassroomRunAttempt = {
  id: string;
  createdAt: string;
  updatedAt: string;
  runId: string;
  classId: string;
  groupId: string;
  studentProfileId: string;
  studentDisplayName?: string;
  groupName?: string;
  scenarioId: string;
  scenarioTitle: string;
  difficultyId: DifficultyId;
  status: "active" | "completed" | "abandoned";
  finalScore?: number | null;
  rankTitle?: string | null;
  victory?: boolean | null;
  summary?: string | null;
  roundsCompleted?: number | null;
  completedAt?: string | null;
  decisions?: ClassroomPolicyDecision[];
};

export type Badge =
  | "First Mandate"
  | "Inflation Tamer"
  | "Jobs Machine"
  | "Balanced Ledger"
  | "External Hawk"
  | "Legendary Approval"
  | "Market Confidence"
  | "Crisis Manager"
  | "Theory Learner"
  | "Inflation Defender"
  | "Market Stabilizer"
  | "Debt Manager"
  | "Banking Crisis Survivor"
  | "Investor Confidence Builder"
  | "Financial Literacy Beginner"
  | "Portfolio Strategist"
  | "Crisis President"
  | "Top 10% President";

export type BestRun = {
  runId: string;
  scenarioId: string;
  scenarioTitle: string;
  score: number;
  rankTitle: string;
  completedAt: string;
  difficultyId: DifficultyId;
};

export type PlayerProfile = {
  version: 1;
  createdAt: string;
  displayName: string;
  premium: boolean;
  unlockedScenarioIds: string[];
  completedRuns: number;
  streakCount: number;
  completedChallengeIds: string[];
  badges: Badge[];
  bestRuns: BestRun[];
  xp: number;
  level: number;
};

export type RunState = {
  version: 2;
  runId: string;
  scenarioId: string;
  challengeId?: string;
  scenarioTitle: string;
  difficultyId: DifficultyId;
  policyComplexity: PolicyComplexity;
  learningMode: LearningMode;
  learningLevelId?: LearningLevelId;
  offerTier: OfferTier;
  startedAt: string;
  updatedAt: string;
  inaugurationAcknowledged?: boolean;
  maxRounds: number;
  approvalFloor: number;
  reelectionRound: number;
  reelectionThreshold: number;
  reelected?: boolean | null;
  complete: boolean;
  victory: boolean;
  score: number;
  rankTitle: string;
  policies: Policies;
  current: MacroState;
  history: HistoryEntry[];
  milestoneNotes: string[];
  goalsAchieved: string[];
  summary?: string;
};

export type LeadCapture = {
  id: string;
  createdAt: string;
  type: "teacher" | "student";
  name: string;
  email: string;
  organization?: string;
  note?: string;
};

export type UserRole = "teacher" | "student";
export type AgeBand = "under_13" | "13_to_local_digital_consent_age" | "above_local_digital_consent_age";
export type JoinTokenStatus = "active" | "revoked" | "expired";
export type MembershipStatus = "active" | "pending" | "blocked";
export type AcceptedBy = "student" | "teacher" | "parent" | "school";
export type AcceptanceContext = "consumer" | "school_signup" | "teacher_dashboard" | "join_flow";

export type UserProfile = {
  id: string;
  clerkUserId: string;
  createdAt: string;
  updatedAt: string;
  displayName: string;
  role: UserRole;
  schoolName?: string | null;
  countryCode: string;
  jurisdiction: string;
  ageBand?: AgeBand | null;
  schoolManaged: boolean;
  onboardingCompleted: boolean;
};

export type Classroom = {
  id: string;
  createdAt: string;
  updatedAt: string;
  teacherProfileId: string;
  name: string;
  schoolName?: string | null;
  countryCode: string;
  jurisdiction: string;
  ageBandDefault: AgeBand;
  status: "active" | "archived";
};

export type ClassroomGroup = {
  id: string;
  createdAt: string;
  classId: string;
  name: string;
  sortOrder: number;
};

export type ClassroomMembership = {
  id: string;
  createdAt: string;
  updatedAt: string;
  classId: string;
  groupId: string;
  profileId: string;
  role: UserRole;
  status: MembershipStatus;
  joinedViaTokenId?: string | null;
};

export type JoinToken = {
  id: string;
  createdAt: string;
  updatedAt: string;
  classId: string;
  groupId: string;
  code: string;
  token: string;
  status: JoinTokenStatus;
  expiresAt: string;
  createdByProfileId: string;
};

export type LegalAcceptance = {
  id: string;
  createdAt: string;
  profileId: string;
  policyKey: string;
  policyVersion: string;
  jurisdiction: string;
  acceptedBy: AcceptedBy;
  acceptanceContext: AcceptanceContext;
  classId?: string | null;
  groupId?: string | null;
};
