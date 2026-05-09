import type {
  DifficultyPreset,
  LeaderBenchmark,
  MandatePresentation,
  ScenarioMechanics,
  Scenario
} from "@/lib/game/types";

const BENCHMARK_SCORE_SLOTS = [
  104.0,
  96.9,
  94.6,
  91.6,
  89.7,
  77.6,
  76.3,
  76.1,
  75.0,
  65.8,
  63.7,
  53.5
] as const;

const COUNTRY_LEADER_ROSTERS = {
  "United States": {
    officeLabel: "President",
    leaders: ["Truman", "Eisenhower", "Kennedy", "Johnson", "Nixon", "Ford", "Carter", "Reagan", "G.H.W. Bush", "Clinton", "G.W. Bush", "Obama"]
  },
  "United Kingdom": {
    officeLabel: "Prime Minister",
    leaders: ["Harold Wilson", "James Callaghan", "Margaret Thatcher", "John Major", "Tony Blair", "Gordon Brown", "David Cameron"]
  },
  France: {
    officeLabel: "President",
    leaders: ["Charles de Gaulle", "Georges Pompidou", "Valery Giscard d'Estaing", "Francois Mitterrand", "Jacques Chirac", "Nicolas Sarkozy", "Francois Hollande", "Emmanuel Macron"]
  },
  Egypt: {
    officeLabel: "President",
    leaders: ["Gamal Abdel Nasser", "Anwar Sadat", "Hosni Mubarak", "Mohamed Morsi", "Abdel Fattah el-Sisi"]
  },
  "Sri Lanka": {
    officeLabel: "President",
    leaders: ["J.R. Jayewardene", "Ranasinghe Premadasa", "Chandrika Kumaratunga", "Mahinda Rajapaksa", "Maithripala Sirisena", "Gotabaya Rajapaksa", "Ranil Wickremesinghe"]
  },
  Kenya: {
    officeLabel: "President",
    leaders: ["Jomo Kenyatta", "Daniel arap Moi", "Mwai Kibaki", "Uhuru Kenyatta", "William Ruto"]
  },
  Singapore: {
    officeLabel: "Prime Minister",
    leaders: ["Lee Kuan Yew", "Goh Chok Tong", "Lee Hsien Loong", "Lawrence Wong"]
  },
  Canada: {
    officeLabel: "Prime Minister",
    leaders: ["Pierre Trudeau", "Brian Mulroney", "Jean Chretien", "Stephen Harper", "Justin Trudeau"]
  },
  Germany: {
    officeLabel: "Chancellor",
    leaders: ["Konrad Adenauer", "Willy Brandt", "Helmut Schmidt", "Helmut Kohl", "Gerhard Schroder", "Angela Merkel", "Olaf Scholz"]
  },
  Italy: {
    officeLabel: "Prime Minister",
    leaders: ["Alcide De Gasperi", "Bettino Craxi", "Romano Prodi", "Silvio Berlusconi", "Mario Monti", "Mario Draghi", "Giorgia Meloni"]
  },
  Spain: {
    officeLabel: "Prime Minister",
    leaders: ["Felipe Gonzalez", "Jose Maria Aznar", "Jose Luis Rodriguez Zapatero", "Mariano Rajoy", "Pedro Sanchez"]
  },
  Greece: {
    officeLabel: "Prime Minister",
    leaders: ["Andreas Papandreou", "Costas Simitis", "Kostas Karamanlis", "George Papandreou", "Antonis Samaras", "Alexis Tsipras", "Kyriakos Mitsotakis"]
  },
  Netherlands: {
    officeLabel: "Prime Minister",
    leaders: ["Ruud Lubbers", "Wim Kok", "Jan Peter Balkenende", "Mark Rutte", "Dick Schoof"]
  },
  Sweden: {
    officeLabel: "Prime Minister",
    leaders: ["Tage Erlander", "Olof Palme", "Goran Persson", "Fredrik Reinfeldt", "Stefan Lofven", "Magdalena Andersson", "Ulf Kristersson"]
  },
  Poland: {
    officeLabel: "Prime Minister",
    leaders: ["Tadeusz Mazowiecki", "Jerzy Buzek", "Donald Tusk", "Mateusz Morawiecki"]
  },
  Turkey: {
    officeLabel: "President",
    leaders: ["Turgut Ozal", "Suleyman Demirel", "Abdullah Gul", "Recep Tayyip Erdogan"]
  },
  Brazil: {
    officeLabel: "President",
    leaders: ["Fernando Henrique Cardoso", "Luiz Inacio Lula da Silva", "Dilma Rousseff", "Michel Temer", "Jair Bolsonaro"]
  },
  Mexico: {
    officeLabel: "President",
    leaders: ["Ernesto Zedillo", "Vicente Fox", "Felipe Calderon", "Enrique Pena Nieto", "Andres Manuel Lopez Obrador", "Claudia Sheinbaum"]
  },
  Argentina: {
    officeLabel: "President",
    leaders: ["Carlos Menem", "Nestor Kirchner", "Cristina Fernandez de Kirchner", "Mauricio Macri", "Alberto Fernandez", "Javier Milei"]
  },
  India: {
    officeLabel: "Prime Minister",
    leaders: ["Jawaharlal Nehru", "Indira Gandhi", "Atal Bihari Vajpayee", "Manmohan Singh", "Narendra Modi"]
  },
  Indonesia: {
    officeLabel: "President",
    leaders: ["Suharto", "B.J. Habibie", "Abdurrahman Wahid", "Megawati Sukarnoputri", "Susilo Bambang Yudhoyono", "Joko Widodo", "Prabowo Subianto"]
  },
  Japan: {
    officeLabel: "Prime Minister",
    leaders: ["Shigeru Yoshida", "Eisaku Sato", "Yasuhiro Nakasone", "Junichiro Koizumi", "Shinzo Abe", "Yoshihide Suga", "Fumio Kishida"]
  },
  "South Korea": {
    officeLabel: "President",
    leaders: ["Park Chung-hee", "Kim Dae-jung", "Roh Moo-hyun", "Lee Myung-bak", "Park Geun-hye", "Moon Jae-in", "Yoon Suk Yeol"]
  },
  Australia: {
    officeLabel: "Prime Minister",
    leaders: ["Bob Hawke", "Paul Keating", "John Howard", "Kevin Rudd", "Julia Gillard", "Malcolm Turnbull", "Scott Morrison", "Anthony Albanese"]
  },
  "New Zealand": {
    officeLabel: "Prime Minister",
    leaders: ["David Lange", "Jim Bolger", "Helen Clark", "John Key", "Jacinda Ardern", "Chris Hipkins", "Christopher Luxon"]
  },
  China: {
    officeLabel: "Paramount Leader",
    leaders: ["Mao Zedong", "Deng Xiaoping", "Jiang Zemin", "Hu Jintao", "Xi Jinping"]
  },
  "Saudi Arabia": {
    officeLabel: "King",
    leaders: ["Faisal", "Khalid", "Fahd", "Abdullah", "Salman"]
  },
  "South Africa": {
    officeLabel: "President",
    leaders: ["Nelson Mandela", "Thabo Mbeki", "Kgalema Motlanthe", "Jacob Zuma", "Cyril Ramaphosa"]
  },
  Nigeria: {
    officeLabel: "President",
    leaders: ["Olusegun Obasanjo", "Umaru Musa Yar'Adua", "Goodluck Jonathan", "Muhammadu Buhari", "Bola Tinubu"]
  },
  Ghana: {
    officeLabel: "President",
    leaders: ["Jerry Rawlings", "John Kufuor", "John Atta Mills", "John Mahama", "Nana Akufo-Addo"]
  },
  Vietnam: {
    officeLabel: "Prime Minister",
    leaders: ["Vo Van Kiet", "Phan Van Khai", "Nguyen Tan Dung", "Nguyen Xuan Phuc", "Pham Minh Chinh"]
  },
  Thailand: {
    officeLabel: "Prime Minister",
    leaders: ["Chuan Leekpai", "Thaksin Shinawatra", "Abhisit Vejjajiva", "Yingluck Shinawatra", "Prayut Chan-o-cha", "Srettha Thavisin", "Paetongtarn Shinawatra"]
  },
  Philippines: {
    officeLabel: "President",
    leaders: ["Ferdinand Marcos", "Corazon Aquino", "Fidel Ramos", "Gloria Macapagal Arroyo", "Benigno Aquino III", "Rodrigo Duterte", "Ferdinand Marcos Jr."]
  },
  Kazakhstan: {
    officeLabel: "President",
    leaders: ["Nursultan Nazarbayev", "Kassym-Jomart Tokayev"]
  }
} as const;

export const PRESIDENTIAL_BENCHMARKS = [
  { name: "Truman", avgGrowth: 4.86, avgUnemployment: 4.26, avgInflation: 3.6, approval: 45.4 },
  { name: "Eisenhower", avgGrowth: 3.02, avgUnemployment: 4.89, avgInflation: 1.36, approval: 65.0 },
  { name: "Kennedy", avgGrowth: 4.37, avgUnemployment: 5.97, avgInflation: 1.17, approval: 70.1 },
  { name: "Johnson", avgGrowth: 5.3, avgUnemployment: 4.17, avgInflation: 2.58, approval: 55.1 },
  { name: "Nixon", avgGrowth: 2.83, avgUnemployment: 5.09, avgInflation: 6.02, approval: 49.0 },
  { name: "Ford", avgGrowth: 1.57, avgUnemployment: 7.27, avgInflation: 8.64, approval: 47.2 },
  { name: "Carter", avgGrowth: 3.25, avgUnemployment: 6.54, avgInflation: 9.71, approval: 45.5 },
  { name: "Reagan", avgGrowth: 3.49, avgUnemployment: 7.54, avgInflation: 4.65, approval: 52.8 },
  { name: "G.H.W. Bush", avgGrowth: 2.25, avgUnemployment: 6.3, avgInflation: 4.37, approval: 60.9 },
  { name: "Clinton", avgGrowth: 3.88, avgUnemployment: 5.2, avgInflation: 2.59, approval: 55.1 },
  { name: "G.W. Bush", avgGrowth: 2.21, avgUnemployment: 5.27, avgInflation: 2.83, approval: 49.4 },
  { name: "Obama", avgGrowth: 1.66, avgUnemployment: 7.45, avgInflation: 1.37, approval: 47.9 }
] as const;

export function getBenchmarksForCountry(country: string): LeaderBenchmark[] {
  const roster = COUNTRY_LEADER_ROSTERS[country as keyof typeof COUNTRY_LEADER_ROSTERS] ?? COUNTRY_LEADER_ROSTERS["United States"];
  return roster.leaders.map((name, index) => ({
    country,
    name,
    officeLabel: roster.officeLabel,
    score: BENCHMARK_SCORE_SLOTS[Math.min(index, BENCHMARK_SCORE_SLOTS.length - 1)]
  }));
}

export function getAllBenchmarks(): LeaderBenchmark[] {
  return Object.keys(COUNTRY_LEADER_ROSTERS).flatMap((country) => getBenchmarksForCountry(country));
}

export const DIFFICULTIES: DifficultyPreset[] = [
  {
    id: "foundation",
    label: "Foundation",
    summary: "A gentler learning curve with a bit more political room.",
    approvalFloor: 35,
    startingApproval: 57,
    growthMultiplier: 1.03,
    inflationMultiplier: 0.95,
    debtSensitivity: 0.9,
    competitivenessMultiplier: 1.0,
    scoreMultiplier: 1.0
  },
  {
    id: "summit",
    label: "Summit",
    summary: "Balanced pressure and the recommended strategic mode.",
    approvalFloor: 35,
    startingApproval: 54,
    growthMultiplier: 1.0,
    inflationMultiplier: 1.0,
    debtSensitivity: 1.0,
    competitivenessMultiplier: 1.0,
    scoreMultiplier: 1.15
  },
  {
    id: "gauntlet",
    label: "Gauntlet",
    summary: "Approval is fragile, debt bites harder, and policy mistakes linger.",
    approvalFloor: 35,
    startingApproval: 51,
    growthMultiplier: 0.96,
    inflationMultiplier: 1.08,
    debtSensitivity: 1.15,
    competitivenessMultiplier: 1.08,
    scoreMultiplier: 1.35
  }
];

type MandateOverrides = Omit<Partial<MandatePresentation>, "electionNight"> & {
  electionNight?: Omit<Partial<MandatePresentation["electionNight"]>, "seedVotes" | "calls"> & {
    seedVotes?: Partial<MandatePresentation["electionNight"]["seedVotes"]>;
    calls?: Partial<MandatePresentation["electionNight"]["calls"]>;
  };
};

function createMandatePresentation(base: MandatePresentation, overrides: MandateOverrides): MandatePresentation {
  const electionNight = overrides.electionNight;

  return {
    ...base,
    ...overrides,
    electionNight: {
      ...base.electionNight,
      ...electionNight,
      seedVotes: {
        ...base.electionNight.seedVotes,
        ...electionNight?.seedVotes
      },
      calls: {
        ...base.electionNight.calls,
        ...electionNight?.calls
      }
    }
  };
}

function call(label: string, value: number, winner: "player" | "opposition", secondsFromStart: number, analysis: string) {
  return { label, value, winner, secondsFromStart, analysis };
}

const US_MANDATE: MandatePresentation = {
  electionModel: "us-electoral-college",
  officeTitle: "President",
  governmentLabel: "White House",
  checkpointLabel: "Reelection",
  checkpointVerb: "win reelection",
  checkpointAudience: "voters",
  progressMarkerLabel: "Reelection",
  securedLabel: "Second term secured.",
  lostLabel: "Reelection lost.",
  unresolvedLabel: "Reelection unresolved.",
  postCheckpointSummary: "Second term is underway. Protect approval and finish the term with a strong record.",
  failureConsequence: "you are not re-elected and your run ends there.",
  electionNight: {
    headlineWon: "Election Night: The Map Turns Back Toward the Incumbent",
    headlineLost: "Election Night: The Presidency Slips Away",
    intro:
      "Networks open the night with approval at {approval}%. Every state call is being treated as a verdict on whether voters still trust your economic stewardship.",
    totalSeconds: 10,
    targetVotes: 270,
    targetLabel: "Target",
    voteUnitLabel: "electoral votes",
    voteUnitShortLabel: "EV",
    playerLabel: "You",
    oppositionLabel: "Opposition",
    playerCallLabel: "Called for you",
    oppositionCallLabel: "Called for the opposition",
    callGroupLabel: "State Calls",
    liveCountLabel: "Live count",
    finalCountLabel: "Final map",
    pendingCallCopy: "Polls still too close to call.",
    interimDeskCopy: "Each called state shifts the live total until the map settles.",
    settledWinCopy: "The final calls are in. The next four years begin immediately.",
    settledLossCopy: "The map is settled. Your time in office ends tonight.",
    seedVotes: {
      won: { player: 172, opposition: 171 },
      lost: { player: 185, opposition: 158 }
    },
    calls: {
      won: [
        { label: "California", value: 54, winner: "player", secondsFromStart: 1, analysis: "Big urban turnout gives you an early cushion." },
        { label: "Texas", value: 40, winner: "opposition", secondsFromStart: 2, analysis: "Conservatives hold firm and hand the opposition a quick bloc." },
        { label: "Michigan", value: 15, winner: "player", secondsFromStart: 3, analysis: "A jobs rebound in the industrial belt keeps this one in your column." },
        { label: "Florida", value: 30, winner: "opposition", secondsFromStart: 4, analysis: "Retirees and suburban voters punish the administration on prices." },
        { label: "Pennsylvania", value: 19, winner: "player", secondsFromStart: 5, analysis: "Union households break late in your favor." },
        { label: "Arizona", value: 11, winner: "opposition", secondsFromStart: 6, analysis: "The opposition frames the race as a referendum on competence and edges ahead." },
        { label: "Wisconsin", value: 10, winner: "player", secondsFromStart: 7, analysis: "A narrow margin here puts reelection within reach." },
        { label: "Georgia", value: 16, winner: "player", secondsFromStart: 8, analysis: "Late metro returns lock in the second term." }
      ],
      lost: [
        { label: "California", value: 54, winner: "player", secondsFromStart: 1, analysis: "Your coalition posts a predictable opening win." },
        { label: "Texas", value: 40, winner: "opposition", secondsFromStart: 2, analysis: "The opposition banks a major early state and keeps momentum." },
        { label: "Michigan", value: 15, winner: "opposition", secondsFromStart: 3, analysis: "Voters punish the administration for weak job confidence." },
        { label: "Florida", value: 30, winner: "opposition", secondsFromStart: 4, analysis: "Inflation anxiety dominates interviews at polling places." },
        { label: "Pennsylvania", value: 19, winner: "player", secondsFromStart: 5, analysis: "The count tightens, but not enough to reset the map." },
        { label: "Arizona", value: 11, winner: "opposition", secondsFromStart: 6, analysis: "Swing voters break against the White House late." },
        { label: "Wisconsin", value: 10, winner: "opposition", secondsFromStart: 7, analysis: "This call sharply narrows your remaining path." },
        { label: "Georgia", value: 16, winner: "opposition", secondsFromStart: 8, analysis: "The final battleground closes the door on a comeback." }
      ]
    },
    winCopy: "Congratulations, you've been re-elected. The second term begins now.",
    lossCopy: "The opposition has won the vote. Your administration is out of time."
  }
};

const UK_MANDATE: MandatePresentation = {
  electionModel: "parliamentary-majority",
  officeTitle: "Prime Minister",
  governmentLabel: "Downing Street",
  checkpointLabel: "General election",
  checkpointVerb: "retain a governing majority",
  checkpointAudience: "voters and constituency blocs",
  progressMarkerLabel: "Election",
  securedLabel: "Government retained.",
  lostLabel: "Government defeated.",
  unresolvedLabel: "Majority unresolved.",
  postCheckpointSummary: "A renewed government is underway. Protect approval and keep the cabinet's majority credible.",
  failureConsequence: "your government loses its majority and your run ends there.",
  electionNight: {
    headlineWon: "Election Night: The Government Holds Its Majority",
    headlineLost: "Election Night: The Majority Slips Away",
    intro:
      "Broadcasters open the count with approval at {approval}%. Every constituency bloc is being read as a verdict on whether the government deserves another mandate.",
    totalSeconds: 10,
    targetVotes: 326,
    targetLabel: "Majority line",
    voteUnitLabel: "seats",
    voteUnitShortLabel: "seats",
    playerLabel: "Your government",
    oppositionLabel: "Opposition",
    playerCallLabel: "Held by your government",
    oppositionCallLabel: "Won by the opposition",
    callGroupLabel: "Seat Declarations",
    liveCountLabel: "Live seat count",
    finalCountLabel: "Final majority",
    pendingCallCopy: "Returning officers have not declared this bloc yet.",
    interimDeskCopy: "Each declaration changes the path to a working majority.",
    settledWinCopy: "The majority is secure. The cabinet returns with a fresh mandate.",
    settledLossCopy: "The opposition has the numbers. Your government cannot continue.",
    seedVotes: {
      won: { player: 244, opposition: 235 },
      lost: { player: 238, opposition: 246 }
    },
    calls: {
      won: [
        { label: "London marginals", value: 24, winner: "player", secondsFromStart: 1, analysis: "Public-service voters give the government early breathing room." },
        { label: "Midlands towns", value: 31, winner: "opposition", secondsFromStart: 2, analysis: "Living-cost pressure keeps the opposition competitive." },
        { label: "Scottish urban seats", value: 18, winner: "player", secondsFromStart: 3, analysis: "Stability arguments land better than expected." },
        { label: "Northern industrial seats", value: 27, winner: "player", secondsFromStart: 5, analysis: "A jobs recovery protects several fragile constituencies." },
        { label: "Southern suburbs", value: 25, winner: "opposition", secondsFromStart: 6, analysis: "Mortgage and tax anxiety trims the government's lead." },
        { label: "Welsh valleys", value: 13, winner: "player", secondsFromStart: 8, analysis: "Late declarations put the majority beyond reach." }
      ],
      lost: [
        { label: "London marginals", value: 24, winner: "player", secondsFromStart: 1, analysis: "The government starts with a few expected holds." },
        { label: "Midlands towns", value: 31, winner: "opposition", secondsFromStart: 2, analysis: "Household pressure turns into a visible anti-government swing." },
        { label: "Scottish urban seats", value: 18, winner: "opposition", secondsFromStart: 3, analysis: "Voters punish the cabinet for weak confidence." },
        { label: "Northern industrial seats", value: 27, winner: "opposition", secondsFromStart: 5, analysis: "Employment anxiety moves several seats out of reach." },
        { label: "Southern suburbs", value: 25, winner: "opposition", secondsFromStart: 6, analysis: "Fiscal credibility becomes the closing argument against you." },
        { label: "Welsh valleys", value: 13, winner: "player", secondsFromStart: 8, analysis: "A late hold narrows the loss but cannot save the majority." }
      ]
    },
    winCopy: "The government has held a workable majority. The new mandate begins now.",
    lossCopy: "The opposition can command the chamber. Your government is out of time."
  }
};

const FRANCE_MANDATE: MandatePresentation = {
  electionModel: "presidential-runoff",
  officeTitle: "President",
  governmentLabel: "Elysee Palace",
  checkpointLabel: "Presidential runoff",
  checkpointVerb: "renew the presidential mandate",
  checkpointAudience: "voters",
  progressMarkerLabel: "Runoff",
  securedLabel: "Mandate renewed.",
  lostLabel: "Mandate lost.",
  unresolvedLabel: "Runoff unresolved.",
  postCheckpointSummary: "A renewed presidential mandate is underway. Protect approval and keep reform legitimacy intact.",
  failureConsequence: "the runoff turns against you and your run ends there.",
  electionNight: {
    headlineWon: "Runoff Night: The Incumbent Coalition Reassembles",
    headlineLost: "Runoff Night: The Presidency Changes Hands",
    intro:
      "National broadcasters open the runoff with approval at {approval}%. Each bloc shows whether voters still trust the president's economic stewardship.",
    totalSeconds: 10,
    targetVotes: 50,
    targetLabel: "Runoff majority",
    voteUnitLabel: "vote share points",
    voteUnitShortLabel: "pts",
    playerLabel: "Incumbent bloc",
    oppositionLabel: "Opposition bloc",
    playerCallLabel: "Breaks for the incumbent bloc",
    oppositionCallLabel: "Breaks for the opposition bloc",
    callGroupLabel: "Runoff Blocs",
    liveCountLabel: "Live projection",
    finalCountLabel: "Final projection",
    pendingCallCopy: "This bloc is still being modeled.",
    interimDeskCopy: "Each bloc shifts the projected national runoff share.",
    settledWinCopy: "The runoff majority holds. The presidency continues.",
    settledLossCopy: "The national projection is settled. The opposition has won the presidency.",
    seedVotes: {
      won: { player: 38, opposition: 37 },
      lost: { player: 37, opposition: 39 }
    },
    calls: {
      won: [
        { label: "Paris and inner suburbs", value: 5, winner: "player", secondsFromStart: 1, analysis: "Urban voters reward stability and European credibility." },
        { label: "Industrial northeast", value: 4, winner: "opposition", secondsFromStart: 2, analysis: "Cost-of-living frustration keeps the race close." },
        { label: "Western cities", value: 4, winner: "player", secondsFromStart: 4, analysis: "Growth and jobs messaging lifts the incumbent bloc." },
        { label: "Mediterranean coast", value: 5, winner: "opposition", secondsFromStart: 5, analysis: "Inflation anger gives the challenger a late path." },
        { label: "Public-sector households", value: 4, winner: "player", secondsFromStart: 7, analysis: "Protection of services steadies the incumbent coalition." }
      ],
      lost: [
        { label: "Paris and inner suburbs", value: 5, winner: "player", secondsFromStart: 1, analysis: "The incumbent starts with expected metropolitan strength." },
        { label: "Industrial northeast", value: 4, winner: "opposition", secondsFromStart: 2, analysis: "Weak job confidence turns into a sharp protest vote." },
        { label: "Western cities", value: 4, winner: "player", secondsFromStart: 4, analysis: "A modest urban hold keeps the race alive." },
        { label: "Mediterranean coast", value: 5, winner: "opposition", secondsFromStart: 5, analysis: "Living-cost pressure widens the challenger path." },
        { label: "Public-sector households", value: 4, winner: "opposition", secondsFromStart: 7, analysis: "Reform fatigue closes the door on another term." }
      ]
    },
    winCopy: "The runoff has renewed your mandate. The next phase begins now.",
    lossCopy: "The runoff has moved against you. The presidency passes to the opposition."
  }
};

const NATIONAL_MANDATE: MandatePresentation = {
  electionModel: "national-mandate",
  officeTitle: "President",
  governmentLabel: "Government",
  checkpointLabel: "National mandate vote",
  checkpointVerb: "renew the national mandate",
  checkpointAudience: "voters and regional blocs",
  progressMarkerLabel: "Mandate vote",
  securedLabel: "Mandate renewed.",
  lostLabel: "Mandate lost.",
  unresolvedLabel: "Mandate unresolved.",
  postCheckpointSummary: "A renewed mandate is underway. Protect approval and keep basic economic confidence from fraying.",
  failureConsequence: "the national mandate breaks against you and your run ends there.",
  electionNight: {
    headlineWon: "Mandate Night: The Coalition Holds Together",
    headlineLost: "Mandate Night: Public Patience Runs Out",
    intro:
      "The national count opens with approval at {approval}%. Each region is being treated as a signal of whether households still accept the government's economic course.",
    totalSeconds: 10,
    targetVotes: 50,
    targetLabel: "Mandate threshold",
    voteUnitLabel: "support points",
    voteUnitShortLabel: "pts",
    playerLabel: "Government bloc",
    oppositionLabel: "Opposition bloc",
    playerCallLabel: "Moves to the government bloc",
    oppositionCallLabel: "Moves to the opposition bloc",
    callGroupLabel: "Regional Blocs",
    liveCountLabel: "Live support count",
    finalCountLabel: "Final mandate count",
    pendingCallCopy: "Regional returns are still being reconciled.",
    interimDeskCopy: "Each region changes whether the mandate can hold.",
    settledWinCopy: "The mandate has held. Your government continues.",
    settledLossCopy: "The mandate has failed. The opposition has the political initiative.",
    seedVotes: {
      won: { player: 35, opposition: 34 },
      lost: { player: 34, opposition: 36 }
    },
    calls: {
      won: [
        { label: "Capital region", value: 5, winner: "player", secondsFromStart: 1, analysis: "Urban households credit the government for averting the worst-case scenario." },
        { label: "Industrial belt", value: 4, winner: "opposition", secondsFromStart: 2, analysis: "Job insecurity keeps the opposition close." },
        { label: "Agricultural provinces", value: 4, winner: "player", secondsFromStart: 4, analysis: "Targeted relief prevents a deeper rural backlash." },
        { label: "Coastal traders", value: 3, winner: "opposition", secondsFromStart: 6, analysis: "External pressure keeps import-sensitive firms skeptical." },
        { label: "Lower-income districts", value: 6, winner: "player", secondsFromStart: 8, analysis: "Household support locks in just enough trust to continue." }
      ],
      lost: [
        { label: "Capital region", value: 5, winner: "player", secondsFromStart: 1, analysis: "The government opens with a narrow urban hold." },
        { label: "Industrial belt", value: 4, winner: "opposition", secondsFromStart: 2, analysis: "Weak job confidence gives the opposition momentum." },
        { label: "Agricultural provinces", value: 4, winner: "opposition", secondsFromStart: 4, analysis: "Food and fuel strain overwhelms the government's case." },
        { label: "Coastal traders", value: 3, winner: "opposition", secondsFromStart: 6, analysis: "External weakness becomes a referendum on competence." },
        { label: "Lower-income districts", value: 6, winner: "opposition", secondsFromStart: 8, analysis: "Living-cost pain ends the mandate path." }
      ]
    },
    winCopy: "The national mandate has held. Your administration continues.",
    lossCopy: "The national mandate has broken. Your administration is out of time."
  }
};

const SINGAPORE_MANDATE: MandatePresentation = {
  ...UK_MANDATE,
  officeTitle: "Prime Minister",
  governmentLabel: "Cabinet",
  checkpointLabel: "Parliamentary mandate",
  checkpointVerb: "retain the governing mandate",
  checkpointAudience: "voters and constituency groups",
  progressMarkerLabel: "Mandate",
  securedLabel: "Mandate retained.",
  lostLabel: "Mandate rejected.",
  unresolvedLabel: "Mandate unresolved.",
  postCheckpointSummary: "A renewed parliamentary mandate is underway. Protect approval and keep competence expectations high.",
  failureConsequence: "the parliamentary mandate breaks against you and your run ends there.",
  electionNight: {
    ...UK_MANDATE.electionNight,
    headlineWon: "Mandate Night: Competence Wins Another Term",
    headlineLost: "Mandate Night: The Performance Standard Bites",
    intro:
      "The count opens with approval at {approval}%. Every constituency group is measuring whether the government still meets Singapore's high bar for competence.",
    targetVotes: 47,
    targetLabel: "Working mandate",
    voteUnitLabel: "seats",
    voteUnitShortLabel: "seats",
    playerLabel: "Governing party",
    oppositionLabel: "Opposition parties",
    playerCallLabel: "Held by the governing party",
    oppositionCallLabel: "Taken by opposition parties",
    callGroupLabel: "Constituency Groups",
    liveCountLabel: "Live seat count",
    finalCountLabel: "Final seat count",
    seedVotes: {
      won: { player: 35, opposition: 30 },
      lost: { player: 32, opposition: 34 }
    },
    calls: {
      won: [
        { label: "Central business districts", value: 5, winner: "player", secondsFromStart: 1, analysis: "Export and finance confidence steadies the governing party." },
        { label: "Heartland estates", value: 6, winner: "player", secondsFromStart: 3, analysis: "Household stability matters more than protest." },
        { label: "Young professional wards", value: 4, winner: "opposition", secondsFromStart: 5, analysis: "Cost and opportunity concerns still cut into the margin." },
        { label: "Industrial corridors", value: 5, winner: "player", secondsFromStart: 7, analysis: "Competitiveness gains keep the mandate intact." }
      ],
      lost: [
        { label: "Central business districts", value: 5, winner: "player", secondsFromStart: 1, analysis: "The governing party starts with expected business support." },
        { label: "Heartland estates", value: 6, winner: "opposition", secondsFromStart: 3, analysis: "Living-cost pressure becomes the decisive issue." },
        { label: "Young professional wards", value: 4, winner: "opposition", secondsFromStart: 5, analysis: "Growth no longer feels broad enough to protect the government." },
        { label: "Industrial corridors", value: 5, winner: "opposition", secondsFromStart: 7, analysis: "Trade weakness turns competence into vulnerability." }
      ]
    },
    winCopy: "The parliamentary mandate has held. The cabinet returns to work.",
    lossCopy: "The performance standard was not met. Your cabinet is out of time."
  }
};

const PARLIAMENTARY_MANDATE: MandatePresentation = {
  ...UK_MANDATE,
  governmentLabel: "Cabinet",
  checkpointLabel: "Parliamentary election",
  checkpointVerb: "retain a governing mandate",
  checkpointAudience: "voters and constituency blocs",
  progressMarkerLabel: "Election",
  securedLabel: "Government retained.",
  lostLabel: "Government defeated.",
  unresolvedLabel: "Majority unresolved.",
  postCheckpointSummary: "A renewed government is underway. Protect approval and keep the coalition credible.",
  failureConsequence: "your government loses its mandate and your run ends there.",
  electionNight: {
    ...UK_MANDATE.electionNight,
    headlineWon: "Election Night: The Government Holds",
    headlineLost: "Election Night: The Coalition Breaks",
    intro:
      "Broadcasters open the count with approval at {approval}%. Each bloc is being read as a verdict on whether the government deserves another mandate.",
    playerLabel: "Government bloc",
    oppositionLabel: "Opposition bloc",
    playerCallLabel: "Held by the government",
    oppositionCallLabel: "Won by the opposition",
    callGroupLabel: "Seat Blocs",
    seedVotes: {
      won: { player: 236, opposition: 231 },
      lost: { player: 232, opposition: 239 }
    },
    calls: {
      won: [
        { label: "Capital districts", value: 22, winner: "player", secondsFromStart: 1, analysis: "Urban voters credit the government for avoiding a deeper downturn." },
        { label: "Industrial regions", value: 28, winner: "opposition", secondsFromStart: 2, analysis: "Job anxiety keeps the opposition competitive." },
        { label: "Suburban seats", value: 24, winner: "player", secondsFromStart: 4, analysis: "Mortgage and wage concerns ease just enough to protect the cabinet." },
        { label: "Regional towns", value: 27, winner: "opposition", secondsFromStart: 6, analysis: "Living-cost pressure trims the government's path." },
        { label: "Service-sector corridors", value: 20, winner: "player", secondsFromStart: 8, analysis: "A late confidence swing keeps the government above the line." }
      ],
      lost: [
        { label: "Capital districts", value: 22, winner: "player", secondsFromStart: 1, analysis: "The government opens with expected metropolitan support." },
        { label: "Industrial regions", value: 28, winner: "opposition", secondsFromStart: 2, analysis: "Weak job confidence produces an early opposition surge." },
        { label: "Suburban seats", value: 24, winner: "opposition", secondsFromStart: 4, analysis: "Household budgets turn the middle of the map against the cabinet." },
        { label: "Regional towns", value: 27, winner: "opposition", secondsFromStart: 6, analysis: "Inflation fatigue hardens into an anti-government vote." },
        { label: "Service-sector corridors", value: 20, winner: "player", secondsFromStart: 8, analysis: "Late holds narrow the loss but cannot rescue the mandate." }
      ]
    },
    winCopy: "The government has held a working mandate. The new term begins now.",
    lossCopy: "The opposition has the political initiative. Your government is out of time."
  }
};

const TECHNOCRATIC_MANDATE: MandatePresentation = {
  ...NATIONAL_MANDATE,
  officeTitle: "Executive",
  governmentLabel: "Executive council",
  checkpointLabel: "Legitimacy review",
  checkpointVerb: "keep the governing compact intact",
  checkpointAudience: "households, firms, and regional officials",
  progressMarkerLabel: "Review",
  securedLabel: "Compact intact.",
  lostLabel: "Compact broken.",
  unresolvedLabel: "Compact unresolved.",
  postCheckpointSummary: "The governing compact has held. Protect confidence and keep development promises credible.",
  failureConsequence: "the governing compact breaks and your run ends there.",
  electionNight: {
    ...NATIONAL_MANDATE.electionNight,
    headlineWon: "Legitimacy Review: The Compact Holds",
    headlineLost: "Legitimacy Review: Confidence Breaks",
    intro:
      "The review opens with approval at {approval}%. Each bloc measures whether households and firms still accept the government's economic bargain.",
    targetLabel: "Legitimacy threshold",
    playerLabel: "Governing compact",
    oppositionLabel: "Pressure bloc",
    playerCallLabel: "Stays with the compact",
    oppositionCallLabel: "Moves to the pressure bloc",
    callGroupLabel: "Confidence Blocs",
    settledWinCopy: "The compact holds. The executive continues with renewed room to govern.",
    settledLossCopy: "Confidence has broken. The executive loses room to govern.",
    winCopy: "The governing compact has held. The executive continues.",
    lossCopy: "The governing compact has broken. Your administration is out of time."
  }
};

const COUNTRY_MANDATES = {
  "United States": US_MANDATE,
  "United Kingdom": UK_MANDATE,
  France: FRANCE_MANDATE,
  Singapore: SINGAPORE_MANDATE,
  Canada: createMandatePresentation(UK_MANDATE, {
    electionModel: "parliamentary-majority",
    governmentLabel: "Ottawa cabinet",
    checkpointLabel: "Federal election",
    checkpointVerb: "hold a federal governing mandate",
    checkpointAudience: "voters across provinces and urban ridings",
    postCheckpointSummary: "A renewed federal government is underway. Protect approval while keeping provincial and household pressure aligned.",
    failureConsequence: "your government loses the confidence of the federal map and your run ends there.",
    electionNight: {
      headlineWon: "Federal Election: The Governing Map Holds",
      headlineLost: "Federal Election: Ottawa Loses The Map",
      intro: "Broadcasters open the count with approval at {approval}%. Province-by-province declarations show whether voters will give Ottawa another mandate.",
      targetVotes: 172,
      targetLabel: "Majority line",
      playerLabel: "Government seats",
      oppositionLabel: "Opposition seats",
      callGroupLabel: "Province And Riding Blocs",
      seedVotes: { won: { player: 126, opposition: 121 }, lost: { player: 119, opposition: 128 } },
      calls: {
        won: [
          call("Ontario suburban ridings", 18, "player", 1, "Mortgage relief and jobs messaging protect the largest battleground."),
          call("Quebec francophone seats", 12, "opposition", 2, "Affordability anger keeps the opposition within reach."),
          call("British Columbia urban coast", 10, "player", 4, "Housing and climate investment promises hold just enough support."),
          call("Prairie resource seats", 14, "opposition", 6, "Energy and tax frustration gives the opposition a firm bloc."),
          call("Atlantic Canada", 8, "player", 8, "Transfers and public services push the government over the line.")
        ],
        lost: [
          call("Ontario suburban ridings", 18, "opposition", 1, "Household debt pressure turns the decisive suburbs away from Ottawa."),
          call("Quebec francophone seats", 12, "player", 2, "A partial hold keeps the race alive but not comfortable."),
          call("British Columbia urban coast", 10, "opposition", 4, "Rent and wage anxiety eats into the governing coalition."),
          call("Prairie resource seats", 14, "opposition", 6, "Resource-region frustration widens the opposition path."),
          call("Atlantic Canada", 8, "player", 8, "Late holds narrow the loss but cannot restore a majority.")
        ]
      }
    }
  }),
  Germany: createMandatePresentation(PARLIAMENTARY_MANDATE, {
    electionModel: "mixed-member-coalition",
    officeTitle: "Chancellor",
    governmentLabel: "Federal cabinet",
    checkpointLabel: "Bundestag coalition test",
    checkpointVerb: "assemble a Bundestag majority",
    checkpointAudience: "constituency voters, party-list voters, and coalition partners",
    progressMarkerLabel: "Coalition test",
    securedLabel: "Coalition majority secured.",
    lostLabel: "Coalition majority lost.",
    unresolvedLabel: "Coalition arithmetic unresolved.",
    postCheckpointSummary: "A renewed coalition is underway. Protect approval while keeping industry and party partners aligned.",
    failureConsequence: "the Bundestag coalition arithmetic breaks against you and your run ends there.",
    electionNight: {
      headlineWon: "Bundestag Night: Coalition Arithmetic Holds",
      headlineLost: "Bundestag Night: The Coalition Loses Its Numbers",
      intro: "The Bundestag projection opens with approval at {approval}%. Constituency seats and party lists now test whether your coalition can still command a majority.",
      targetVotes: 316,
      targetLabel: "Coalition majority",
      playerLabel: "Governing coalition",
      oppositionLabel: "Opposition parties",
      playerCallLabel: "Adds to the coalition path",
      oppositionCallLabel: "Moves away from the coalition",
      callGroupLabel: "Constituency And List Blocs",
      liveCountLabel: "Live seat projection",
      finalCountLabel: "Final coalition projection",
      seedVotes: { won: { player: 241, opposition: 236 }, lost: { player: 233, opposition: 246 } },
      calls: {
        won: [
          call("North Rhine-Westphalia constituency seats", 24, "player", 1, "Industrial stabilization protects the coalition's largest prize."),
          call("Bavarian party-list swing", 22, "opposition", 2, "Cost concerns keep conservative challengers competitive."),
          call("Eastern manufacturing districts", 18, "opposition", 4, "Energy anxiety cuts into the government's list vote."),
          call("Green urban list vote", 20, "player", 6, "Investment and climate credibility rebuild a coalition lane."),
          call("Northern export seats", 17, "player", 8, "Competitiveness gains carry the coalition above the majority line.")
        ],
        lost: [
          call("North Rhine-Westphalia constituency seats", 24, "opposition", 1, "Factories do not feel the recovery quickly enough."),
          call("Bavarian party-list swing", 22, "opposition", 2, "Fiscal anxiety consolidates the opposition vote."),
          call("Eastern manufacturing districts", 18, "opposition", 4, "Energy and job pressure become a sharp protest vote."),
          call("Green urban list vote", 20, "player", 6, "Urban holds help but cannot repair the coalition map."),
          call("Northern export seats", 17, "player", 8, "Late export-region gains narrow the loss but leave the coalition short.")
        ]
      }
    }
  }),
  Italy: createMandatePresentation(PARLIAMENTARY_MANDATE, {
    electionModel: "proportional-coalition",
    officeTitle: "Prime Minister",
    governmentLabel: "Council of Ministers",
    checkpointLabel: "Coalition confidence election",
    checkpointVerb: "hold a governing coalition",
    checkpointAudience: "party blocs, regions, and coalition partners",
    progressMarkerLabel: "Coalition",
    securedLabel: "Coalition retained.",
    lostLabel: "Coalition collapsed.",
    unresolvedLabel: "Coalition unresolved.",
    postCheckpointSummary: "A renewed coalition is underway. Protect approval while keeping debt credibility and partners intact.",
    failureConsequence: "your coalition can no longer command a mandate and your run ends there.",
    electionNight: {
      headlineWon: "Coalition Night: Rome Finds The Numbers",
      headlineLost: "Coalition Night: The Government Fractures",
      targetVotes: 201,
      targetLabel: "Lower-house majority",
      playerLabel: "Government alliance",
      oppositionLabel: "Opposition alliance",
      callGroupLabel: "Regional Party Blocs",
      seedVotes: { won: { player: 148, opposition: 145 }, lost: { player: 142, opposition: 151 } },
      calls: {
        won: [
          call("Lombardy and Veneto lists", 17, "opposition", 1, "Tax and debt anxiety keeps the opposition strong in the north."),
          call("Rome and Lazio seats", 12, "player", 2, "Public investment messaging steadies the governing alliance."),
          call("Southern transfer-sensitive districts", 15, "player", 4, "Household support prevents a deeper southern backlash."),
          call("Emilia-Romagna industrial belt", 11, "player", 6, "Productivity gains protect the reform wing."),
          call("Island seats", 8, "opposition", 8, "Cost pressure trims the margin but not the mandate.")
        ],
        lost: [
          call("Lombardy and Veneto lists", 17, "opposition", 1, "Debt credibility becomes the northern closing argument."),
          call("Rome and Lazio seats", 12, "opposition", 2, "Public-sector patience runs out in the capital region."),
          call("Southern transfer-sensitive districts", 15, "player", 4, "Relief spending keeps some support alive."),
          call("Emilia-Romagna industrial belt", 11, "opposition", 6, "Weak productivity progress fractures the governing alliance."),
          call("Island seats", 8, "player", 8, "Late holds are not enough to rebuild a coalition.")
        ]
      }
    }
  }),
  Spain: createMandatePresentation(PARLIAMENTARY_MANDATE, {
    electionModel: "proportional-coalition",
    officeTitle: "Prime Minister",
    governmentLabel: "Moncloa government",
    checkpointLabel: "Congress coalition vote",
    checkpointVerb: "retain a Congress majority",
    checkpointAudience: "regional blocs and coalition partners",
    progressMarkerLabel: "Congress vote",
    electionNight: {
      headlineWon: "Election Night: Moncloa Keeps A Majority Path",
      headlineLost: "Election Night: The Majority Path Closes",
      targetVotes: 176,
      targetLabel: "Congress majority",
      playerLabel: "Government bloc",
      oppositionLabel: "Opposition bloc",
      callGroupLabel: "Autonomous Community Blocs",
      seedVotes: { won: { player: 130, opposition: 126 }, lost: { player: 124, opposition: 132 } },
      calls: {
        won: [
          call("Madrid metropolitan seats", 13, "opposition", 1, "Rent and tax pressure keep the opposition alive."),
          call("Catalonia party blocs", 12, "player", 2, "Employment gains reopen a coalition path."),
          call("Andalusia service seats", 15, "player", 4, "Tourism jobs protect the government in a key region."),
          call("Valencia and Murcia coast", 9, "opposition", 6, "Housing costs cut into the governing vote."),
          call("Basque and Galician partners", 10, "player", 8, "Regional partners deliver the final majority path.")
        ],
        lost: [
          call("Madrid metropolitan seats", 13, "opposition", 1, "Middle-class cost pressure moves decisively against Moncloa."),
          call("Catalonia party blocs", 12, "opposition", 2, "Regional partners doubt the government's economic credibility."),
          call("Andalusia service seats", 15, "player", 4, "Tourism jobs create a partial hold."),
          call("Valencia and Murcia coast", 9, "opposition", 6, "Rent and food prices widen the opposition lead."),
          call("Basque and Galician partners", 10, "player", 8, "Late partner support narrows the loss but leaves no majority.")
        ]
      }
    }
  }),
  Greece: createMandatePresentation(PARLIAMENTARY_MANDATE, {
    electionModel: "proportional-coalition",
    officeTitle: "Prime Minister",
    governmentLabel: "Athens government",
    checkpointLabel: "Parliamentary confidence test",
    checkpointVerb: "keep a parliamentary mandate",
    checkpointAudience: "voters, creditors, and coalition partners",
    progressMarkerLabel: "Confidence test",
    securedLabel: "Mandate survives.",
    lostLabel: "Mandate collapses.",
    unresolvedLabel: "Mandate unresolved.",
    postCheckpointSummary: "The government has survived the confidence test. Protect social patience while restoring credibility.",
    failureConsequence: "the parliamentary mandate collapses and your run ends there.",
    electionNight: {
      headlineWon: "Confidence Night: Athens Holds The Mandate",
      headlineLost: "Confidence Night: The Austerity Coalition Breaks",
      targetVotes: 151,
      targetLabel: "Parliamentary majority",
      playerLabel: "Government bloc",
      oppositionLabel: "Opposition bloc",
      callGroupLabel: "Regional And Party Blocs",
      seedVotes: { won: { player: 112, opposition: 108 }, lost: { player: 106, opposition: 116 } },
      calls: {
        won: [
          call("Athens metropolitan seats", 10, "opposition", 1, "Austerity fatigue keeps the capital volatile."),
          call("Thessaloniki and northern districts", 9, "player", 2, "Export and tourism hopes keep enough support alive."),
          call("Public-sector households", 8, "opposition", 4, "Wage restraint produces a sharp protest vote."),
          call("Island tourism regions", 7, "player", 6, "Competitiveness gains help the government recover ground."),
          call("Centrist coalition partners", 6, "player", 8, "Credibility arguments deliver the final majority path.")
        ],
        lost: [
          call("Athens metropolitan seats", 10, "opposition", 1, "Cuts and job losses turn the capital firmly against the cabinet."),
          call("Thessaloniki and northern districts", 9, "opposition", 2, "Unemployment pressure overwhelms the recovery message."),
          call("Public-sector households", 8, "opposition", 4, "Austerity fatigue hardens into a mandate crisis."),
          call("Island tourism regions", 7, "player", 6, "Tourism support narrows the gap but cannot reset the count."),
          call("Centrist coalition partners", 6, "player", 8, "Late partner support falls short of a workable majority.")
        ]
      }
    }
  }),
  Netherlands: createMandatePresentation(PARLIAMENTARY_MANDATE, {
    electionModel: "proportional-coalition",
    officeTitle: "Prime Minister",
    governmentLabel: "Coalition cabinet",
    checkpointLabel: "Coalition formation test",
    checkpointVerb: "form a viable coalition",
    checkpointAudience: "party-list voters and coalition negotiators",
    progressMarkerLabel: "Formation",
    electionNight: {
      headlineWon: "Election Night: The Coalition Puzzle Fits",
      headlineLost: "Election Night: The Coalition Puzzle Breaks",
      targetVotes: 76,
      targetLabel: "Tweede Kamer majority",
      playerLabel: "Governing parties",
      oppositionLabel: "Alternative blocs",
      callGroupLabel: "Party-List Blocs",
      seedVotes: { won: { player: 55, opposition: 53 }, lost: { player: 50, opposition: 58 } },
      calls: {
        won: [
          call("Randstad urban list vote", 7, "player", 1, "Housing promises hold enough metropolitan support."),
          call("Port and logistics regions", 6, "player", 2, "Trade competitiveness strengthens the coalition case."),
          call("Agricultural provinces", 5, "opposition", 4, "Rural frustration keeps an alternative bloc alive."),
          call("Suburban commuter parties", 5, "player", 6, "Mortgage and wage relief nudges the center back."),
          call("Small party balance", 4, "opposition", 8, "Fragmentation trims the margin but cannot block formation.")
        ],
        lost: [
          call("Randstad urban list vote", 7, "opposition", 1, "Housing pressure overwhelms the cabinet's pitch."),
          call("Port and logistics regions", 6, "player", 2, "Trade hubs provide a partial hold."),
          call("Agricultural provinces", 5, "opposition", 4, "Rural anger strengthens the alternative coalition."),
          call("Suburban commuter parties", 5, "opposition", 6, "Household budgets move centrist voters away."),
          call("Small party balance", 4, "player", 8, "Late small-party support cannot assemble a majority.")
        ]
      }
    }
  }),
  Sweden: createMandatePresentation(PARLIAMENTARY_MANDATE, {
    electionModel: "proportional-coalition",
    officeTitle: "Prime Minister",
    governmentLabel: "Riksdag government",
    checkpointLabel: "Riksdag mandate",
    checkpointVerb: "hold a Riksdag majority",
    checkpointAudience: "party-list voters and bloc partners",
    electionNight: {
      headlineWon: "Riksdag Night: The Governing Bloc Holds",
      headlineLost: "Riksdag Night: The Bloc Loses Its Majority",
      targetVotes: 175,
      targetLabel: "Riksdag majority",
      playerLabel: "Governing bloc",
      oppositionLabel: "Opposition bloc",
      callGroupLabel: "County Party Blocs",
      seedVotes: { won: { player: 130, opposition: 128 }, lost: { player: 126, opposition: 134 } },
      calls: {
        won: [
          call("Stockholm county", 13, "player", 1, "Currency stability and household relief protect the capital bloc."),
          call("Skane commuter seats", 11, "opposition", 2, "Mortgage pressure keeps the race tight."),
          call("Gothenburg industrial vote", 10, "player", 4, "Export jobs help the governing bloc recover ground."),
          call("Northern resource counties", 8, "player", 6, "Investment promises carry the mandate north."),
          call("Small-party threshold votes", 6, "opposition", 8, "Fragmentation trims the margin but not the majority.")
        ],
        lost: [
          call("Stockholm county", 13, "opposition", 1, "Household debt pressure turns the capital against the government."),
          call("Skane commuter seats", 11, "opposition", 2, "Mortgage and price anxiety accelerate the swing."),
          call("Gothenburg industrial vote", 10, "player", 4, "Export jobs keep one route alive."),
          call("Northern resource counties", 8, "player", 6, "Investment promises prevent a wipeout."),
          call("Small-party threshold votes", 6, "opposition", 8, "Threshold math breaks the governing majority.")
        ]
      }
    }
  }),
  Poland: createMandatePresentation(PARLIAMENTARY_MANDATE, {
    electionModel: "proportional-coalition",
    officeTitle: "Prime Minister",
    governmentLabel: "Sejm government",
    checkpointLabel: "Sejm majority election",
    checkpointVerb: "retain a Sejm majority",
    checkpointAudience: "party-list voters and regional districts",
    electionNight: {
      headlineWon: "Sejm Night: The Governing Majority Survives",
      headlineLost: "Sejm Night: The Majority Turns Over",
      targetVotes: 231,
      targetLabel: "Sejm majority",
      playerLabel: "Government lists",
      oppositionLabel: "Opposition lists",
      callGroupLabel: "Voivodeship Blocs",
      seedVotes: { won: { player: 172, opposition: 168 }, lost: { player: 166, opposition: 176 } },
      calls: {
        won: [
          call("Warsaw metropolitan lists", 16, "player", 1, "Inflation relief and investment credibility hold the capital."),
          call("Silesian industrial districts", 14, "player", 2, "Manufacturing confidence protects a key bloc."),
          call("Eastern rural districts", 13, "opposition", 4, "Food and fuel pressure keeps the opposition close."),
          call("Western export regions", 12, "player", 6, "Competitiveness gains support the governing lists."),
          call("Small-party threshold balance", 8, "opposition", 8, "Threshold math tightens the result but leaves a majority.")
        ],
        lost: [
          call("Warsaw metropolitan lists", 16, "opposition", 1, "Urban voters punish persistent inflation."),
          call("Silesian industrial districts", 14, "player", 2, "A partial factory rebound keeps the race alive."),
          call("Eastern rural districts", 13, "opposition", 4, "Food-price pressure consolidates the opposition."),
          call("Western export regions", 12, "opposition", 6, "Trade weakness undercuts the government's growth claim."),
          call("Small-party threshold balance", 8, "player", 8, "Late threshold gains are not enough to save the Sejm majority.")
        ]
      }
    }
  }),
  Turkey: createMandatePresentation(FRANCE_MANDATE, {
    electionModel: "presidential-runoff",
    governmentLabel: "Presidential palace",
    checkpointLabel: "Presidential runoff",
    checkpointVerb: "win the presidential runoff",
    checkpointAudience: "voters across provinces and the diaspora",
    electionNight: {
      headlineWon: "Runoff Night: The Presidency Holds",
      headlineLost: "Runoff Night: The Presidency Slips",
      targetVotes: 50,
      playerLabel: "Incumbent alliance",
      oppositionLabel: "Challenger alliance",
      callGroupLabel: "Province And Diaspora Blocs",
      seedVotes: { won: { player: 38, opposition: 37 }, lost: { player: 36, opposition: 39 } },
      calls: {
        won: [
          call("Istanbul late returns", 5, "opposition", 1, "Urban inflation anger keeps the challenger alive."),
          call("Ankara and central Anatolia", 5, "player", 2, "Stability messaging holds the presidential heartland."),
          call("Aegean coastal provinces", 4, "opposition", 4, "Cost pressure and reform fatigue boost the challenger."),
          call("Black Sea provinces", 4, "player", 6, "Targeted support keeps the incumbent alliance ahead."),
          call("Diaspora ballots", 3, "player", 8, "Late overseas returns seal a narrow runoff path.")
        ],
        lost: [
          call("Istanbul late returns", 5, "opposition", 1, "Urban inflation anger becomes decisive."),
          call("Ankara and central Anatolia", 5, "player", 2, "The incumbent holds part of the core vote."),
          call("Aegean coastal provinces", 4, "opposition", 4, "Coastal cities widen the challenger path."),
          call("Black Sea provinces", 4, "opposition", 6, "Household strain cracks a usually reliable bloc."),
          call("Diaspora ballots", 3, "player", 8, "Late overseas support narrows the loss but cannot reverse it.")
        ]
      }
    }
  }),
  Brazil: createMandatePresentation(FRANCE_MANDATE, {
    electionModel: "presidential-runoff",
    governmentLabel: "Planalto Palace",
    checkpointLabel: "Presidential runoff",
    checkpointVerb: "win the presidential runoff",
    checkpointAudience: "voters across states and regions",
    electionNight: {
      headlineWon: "Runoff Night: The Planalto Coalition Holds",
      headlineLost: "Runoff Night: Planalto Changes Hands",
      playerLabel: "Incumbent coalition",
      oppositionLabel: "Challenger coalition",
      callGroupLabel: "State And Region Blocs",
      calls: {
        won: [
          call("Sao Paulo metro vote", 5, "opposition", 1, "Fiscal credibility concerns keep the challenger close."),
          call("Northeast social-policy bloc", 6, "player", 2, "Transfers and poverty relief rebuild the incumbent path."),
          call("Minas Gerais bellwether", 4, "player", 4, "Jobs gains tilt the decisive bellwether state."),
          call("Amazon and North states", 3, "player", 6, "Infrastructure promises hold enough regional support."),
          call("South agribusiness states", 4, "opposition", 8, "Tax and inflation worries tighten but do not flip the runoff.")
        ],
        lost: [
          call("Sao Paulo metro vote", 5, "opposition", 1, "Markets and households unite around credibility worries."),
          call("Northeast social-policy bloc", 6, "player", 2, "Transfers prevent a collapse but cannot offset other regions."),
          call("Minas Gerais bellwether", 4, "opposition", 4, "The bellwether turns on debt and prices."),
          call("Amazon and North states", 3, "player", 6, "Regional investment holds some ground."),
          call("South agribusiness states", 4, "opposition", 8, "A southern swing closes the incumbent path.")
        ]
      }
    }
  }),
  Mexico: createMandatePresentation(NATIONAL_MANDATE, {
    electionModel: "presidential-plurality",
    officeTitle: "President",
    governmentLabel: "National Palace",
    checkpointLabel: "Presidential plurality vote",
    checkpointVerb: "hold the national plurality",
    checkpointAudience: "voters across states and metropolitan regions",
    progressMarkerLabel: "Plurality vote",
    electionNight: {
      headlineWon: "Election Night: The Plurality Holds",
      headlineLost: "Election Night: The Plurality Slips Away",
      targetVotes: 38,
      targetLabel: "Plurality benchmark",
      voteUnitLabel: "vote share points",
      voteUnitShortLabel: "pts",
      playerLabel: "Government candidate",
      oppositionLabel: "Opposition field",
      playerCallLabel: "Adds to the government plurality",
      oppositionCallLabel: "Breaks toward the opposition field",
      callGroupLabel: "State Vote Blocs",
      seedVotes: { won: { player: 29, opposition: 28 }, lost: { player: 27, opposition: 30 } },
      calls: {
        won: [
          call("Mexico City metro", 4, "player", 1, "Transport and wage gains hold the capital bloc."),
          call("Northern manufacturing states", 4, "player", 2, "Nearshoring optimism strengthens the governing path."),
          call("Bajio industrial corridor", 3, "player", 4, "Investment credibility carries the corridor."),
          call("Southern transfer states", 3, "player", 6, "Social support protects the plurality."),
          call("Border security vote", 3, "opposition", 8, "Security and price concerns tighten the final margin.")
        ],
        lost: [
          call("Mexico City metro", 4, "player", 1, "The capital gives the government an early hold."),
          call("Northern manufacturing states", 4, "opposition", 2, "Security and energy costs weaken nearshoring confidence."),
          call("Bajio industrial corridor", 3, "opposition", 4, "Investment doubts move the corridor against you."),
          call("Southern transfer states", 3, "player", 6, "Transfers keep a partial floor under support."),
          call("Border security vote", 3, "opposition", 8, "A late border swing ends the plurality path.")
        ]
      }
    }
  }),
  Argentina: createMandatePresentation(FRANCE_MANDATE, {
    electionModel: "presidential-runoff",
    governmentLabel: "Casa Rosada",
    checkpointLabel: "Runoff legitimacy vote",
    checkpointVerb: "win the stabilization runoff",
    checkpointAudience: "voters across provinces and urban belts",
    electionNight: {
      headlineWon: "Runoff Night: The Stabilization Mandate Survives",
      headlineLost: "Runoff Night: The Shock Mandate Breaks",
      playerLabel: "Stabilization bloc",
      oppositionLabel: "Anti-shock bloc",
      callGroupLabel: "Province And Urban Blocs",
      calls: {
        won: [
          call("Buenos Aires province", 5, "opposition", 1, "Austerity pain keeps the largest province hostile."),
          call("City of Buenos Aires", 4, "player", 2, "Credibility gains protect the capital."),
          call("Cordoba and Santa Fe", 5, "player", 4, "Export and business confidence rebuild the path."),
          call("Northern provinces", 4, "player", 6, "Targeted relief keeps the adjustment socially viable."),
          call("Patagonia energy provinces", 3, "opposition", 8, "Energy-cost anger trims the final margin.")
        ],
        lost: [
          call("Buenos Aires province", 5, "opposition", 1, "Household pain overwhelms the stabilization argument."),
          call("City of Buenos Aires", 4, "player", 2, "The capital gives credibility policy a partial hold."),
          call("Cordoba and Santa Fe", 5, "opposition", 4, "Business confidence is not enough to offset recession fears."),
          call("Northern provinces", 4, "opposition", 6, "Social pain turns relief into a protest vote."),
          call("Patagonia energy provinces", 3, "player", 8, "Late resource-region support cannot save the runoff.")
        ]
      }
    }
  }),
  India: createMandatePresentation(UK_MANDATE, {
    electionModel: "parliamentary-majority",
    officeTitle: "Prime Minister",
    governmentLabel: "Union cabinet",
    checkpointLabel: "Lok Sabha election",
    checkpointVerb: "retain a Lok Sabha majority",
    checkpointAudience: "voters across states, cities, and rural constituencies",
    progressMarkerLabel: "Lok Sabha",
    electionNight: {
      headlineWon: "Lok Sabha Night: The Majority Holds",
      headlineLost: "Lok Sabha Night: The Majority Breaks",
      targetVotes: 272,
      targetLabel: "Lok Sabha majority",
      playerLabel: "Governing alliance",
      oppositionLabel: "Opposition alliance",
      callGroupLabel: "State Seat Blocs",
      seedVotes: { won: { player: 205, opposition: 198 }, lost: { player: 198, opposition: 208 } },
      calls: {
        won: [
          call("Uttar Pradesh seats", 20, "player", 1, "Food-price relief and jobs messaging hold the largest state."),
          call("Maharashtra urban belt", 14, "opposition", 2, "Cost pressure keeps the opposition competitive."),
          call("Southern technology states", 16, "player", 4, "Training and infrastructure gains protect high-growth regions."),
          call("Eastern rural constituencies", 13, "player", 6, "Transfers and public works widen the majority path."),
          call("National capital region", 8, "opposition", 8, "Urban frustration narrows but cannot overturn the majority.")
        ],
        lost: [
          call("Uttar Pradesh seats", 20, "opposition", 1, "Food inflation turns the largest state against the government."),
          call("Maharashtra urban belt", 14, "opposition", 2, "Urban cost pressure accelerates the swing."),
          call("Southern technology states", 16, "player", 4, "Growth regions provide a partial hold."),
          call("Eastern rural constituencies", 13, "player", 6, "Transfers keep some rural trust intact."),
          call("National capital region", 8, "opposition", 8, "A late urban swing closes the majority route.")
        ]
      }
    }
  }),
  Indonesia: createMandatePresentation(NATIONAL_MANDATE, {
    electionModel: "presidential-plurality",
    officeTitle: "President",
    governmentLabel: "Presidential cabinet",
    checkpointLabel: "Direct presidential mandate",
    checkpointVerb: "hold the direct presidential mandate",
    checkpointAudience: "voters across islands and provinces",
    electionNight: {
      headlineWon: "Mandate Night: The Island Map Holds",
      headlineLost: "Mandate Night: The Island Map Turns",
      playerLabel: "Presidential ticket",
      oppositionLabel: "Challenger tickets",
      callGroupLabel: "Island And Province Blocs",
      calls: {
        won: [
          call("Java urban vote", 5, "player", 1, "Food-price stability protects the decisive island bloc."),
          call("Sumatra commodity provinces", 4, "opposition", 2, "Fuel costs keep the challengers close."),
          call("Kalimantan development corridor", 4, "player", 4, "Infrastructure promises strengthen the mandate."),
          call("Sulawesi industrial belt", 3, "player", 6, "Nickel and manufacturing optimism add support."),
          call("Eastern islands", 3, "opposition", 8, "Regional inequality narrows the final mandate count.")
        ],
        lost: [
          call("Java urban vote", 5, "opposition", 1, "Food and housing pressure turns the decisive bloc."),
          call("Sumatra commodity provinces", 4, "opposition", 2, "Fuel costs become a direct referendum."),
          call("Kalimantan development corridor", 4, "player", 4, "Infrastructure still gives the government a partial hold."),
          call("Sulawesi industrial belt", 3, "player", 6, "Industrial optimism narrows the gap."),
          call("Eastern islands", 3, "opposition", 8, "Regional frustration ends the presidential path.")
        ]
      }
    }
  }),
  Japan: createMandatePresentation(PARLIAMENTARY_MANDATE, {
    electionModel: "mixed-member-coalition",
    officeTitle: "Prime Minister",
    governmentLabel: "Cabinet",
    checkpointLabel: "Diet election",
    checkpointVerb: "hold a Diet majority",
    checkpointAudience: "single-member districts, proportional blocs, and coalition partners",
    progressMarkerLabel: "Diet election",
    electionNight: {
      headlineWon: "Diet Night: The Cabinet Keeps Its Majority",
      headlineLost: "Diet Night: The Cabinet Loses Its Majority",
      targetVotes: 233,
      targetLabel: "House majority",
      playerLabel: "Governing coalition",
      oppositionLabel: "Opposition parties",
      callGroupLabel: "District And PR Blocs",
      seedVotes: { won: { player: 174, opposition: 168 }, lost: { player: 166, opposition: 178 } },
      calls: {
        won: [
          call("Tokyo proportional bloc", 15, "opposition", 1, "Living costs cut into the cabinet's urban vote."),
          call("Kansai single-member seats", 14, "player", 2, "Wage gains keep the governing coalition competitive."),
          call("Chubu manufacturing districts", 13, "player", 4, "Export and supply policy protect industrial seats."),
          call("Rural prefectures", 12, "player", 6, "Public works and stability messaging hold the countryside."),
          call("Kyushu and Okinawa bloc", 9, "opposition", 8, "Household prices trim the majority but do not erase it.")
        ],
        lost: [
          call("Tokyo proportional bloc", 15, "opposition", 1, "Urban prices become the night's early story."),
          call("Kansai single-member seats", 14, "opposition", 2, "Weak consumption turns key districts away."),
          call("Chubu manufacturing districts", 13, "player", 4, "Factories provide a partial hold."),
          call("Rural prefectures", 12, "player", 6, "Stability messaging saves some seats."),
          call("Kyushu and Okinawa bloc", 9, "opposition", 8, "Late proportional losses end the majority.")
        ]
      }
    }
  }),
  "South Korea": createMandatePresentation(NATIONAL_MANDATE, {
    electionModel: "presidential-plurality",
    officeTitle: "President",
    governmentLabel: "Blue House administration",
    checkpointLabel: "Presidential plurality test",
    checkpointVerb: "hold a national plurality",
    checkpointAudience: "metropolitan, provincial, and youth voters",
    electionNight: {
      headlineWon: "Election Night: The Plurality Holds In Seoul",
      headlineLost: "Election Night: The Plurality Slips In Seoul",
      targetVotes: 42,
      targetLabel: "Plurality benchmark",
      voteUnitLabel: "vote share points",
      voteUnitShortLabel: "pts",
      playerLabel: "Government candidate",
      oppositionLabel: "Opposition field",
      callGroupLabel: "Metro And Province Blocs",
      seedVotes: { won: { player: 31, opposition: 30 }, lost: { player: 29, opposition: 32 } },
      calls: {
        won: [
          call("Seoul metro vote", 4, "opposition", 1, "Housing and debt pressure keep the race close."),
          call("Gyeonggi commuter belt", 4, "player", 2, "Jobs and debt relief restore a narrow path."),
          call("Southeast industrial coast", 3, "player", 4, "Export momentum helps the government candidate."),
          call("Southwest urban vote", 3, "opposition", 6, "Regional polarization tightens the count."),
          call("Youth and first-time voters", 3, "player", 8, "Training and wage gains seal the plurality.")
        ],
        lost: [
          call("Seoul metro vote", 4, "opposition", 1, "Housing costs make the capital hostile."),
          call("Gyeonggi commuter belt", 4, "opposition", 2, "Debt pressure turns the commuter belt."),
          call("Southeast industrial coast", 3, "player", 4, "Export jobs keep a partial hold."),
          call("Southwest urban vote", 3, "opposition", 6, "Regional opposition strengthens the challenger field."),
          call("Youth and first-time voters", 3, "player", 8, "Late youth gains narrow but cannot rescue the plurality.")
        ]
      }
    }
  }),
  Australia: createMandatePresentation(UK_MANDATE, {
    electionModel: "parliamentary-majority",
    officeTitle: "Prime Minister",
    governmentLabel: "Federal cabinet",
    checkpointLabel: "House election",
    checkpointVerb: "hold a House majority",
    checkpointAudience: "voters across states and marginal seats",
    electionNight: {
      headlineWon: "Election Night: Canberra Holds The House",
      headlineLost: "Election Night: Canberra Loses The House",
      targetVotes: 76,
      targetLabel: "House majority",
      playerLabel: "Government seats",
      oppositionLabel: "Opposition seats",
      callGroupLabel: "State And Marginal Seat Blocs",
      seedVotes: { won: { player: 57, opposition: 55 }, lost: { player: 53, opposition: 59 } },
      calls: {
        won: [
          call("Sydney mortgage belt", 6, "opposition", 1, "Rate pain keeps the opposition in the hunt."),
          call("Melbourne inner suburbs", 5, "player", 2, "Living-cost relief protects key marginals."),
          call("Queensland regional seats", 5, "opposition", 4, "Energy and tax worries tighten the map."),
          call("Western Australia resource seats", 4, "player", 6, "Commodity strength supports the government."),
          call("South Australian marginals", 4, "player", 8, "Late household confidence gives Canberra the House.")
        ],
        lost: [
          call("Sydney mortgage belt", 6, "opposition", 1, "Mortgage stress becomes decisive."),
          call("Melbourne inner suburbs", 5, "opposition", 2, "Rent and wage frustration move inner suburbs away."),
          call("Queensland regional seats", 5, "opposition", 4, "Regional prices widen the opposition lead."),
          call("Western Australia resource seats", 4, "player", 6, "Resource strength gives the government a partial hold."),
          call("South Australian marginals", 4, "player", 8, "Late holds are not enough to save the House.")
        ]
      }
    }
  }),
  "New Zealand": createMandatePresentation(PARLIAMENTARY_MANDATE, {
    electionModel: "mixed-member-coalition",
    officeTitle: "Prime Minister",
    governmentLabel: "Beehive cabinet",
    checkpointLabel: "MMP coalition vote",
    checkpointVerb: "assemble an MMP majority",
    checkpointAudience: "electorate voters, party-list voters, and coalition partners",
    electionNight: {
      headlineWon: "MMP Night: The Coalition Numbers Hold",
      headlineLost: "MMP Night: The Coalition Numbers Break",
      targetVotes: 61,
      targetLabel: "Parliament majority",
      playerLabel: "Government parties",
      oppositionLabel: "Opposition parties",
      callGroupLabel: "Electorate And Party-List Blocs",
      seedVotes: { won: { player: 45, opposition: 43 }, lost: { player: 42, opposition: 47 } },
      calls: {
        won: [
          call("Auckland electorates", 5, "opposition", 1, "Housing costs keep the opposition competitive."),
          call("Wellington list vote", 4, "player", 2, "Public-service confidence steadies the coalition."),
          call("Canterbury electorates", 4, "player", 4, "Business confidence keeps the government path open."),
          call("Provincial dairy regions", 4, "opposition", 6, "Export uncertainty trims the margin."),
          call("Minor-party threshold vote", 3, "player", 8, "Threshold math gives the coalition a majority.")
        ],
        lost: [
          call("Auckland electorates", 5, "opposition", 1, "Housing and rates pressure move the largest city away."),
          call("Wellington list vote", 4, "player", 2, "The coalition holds some public-sector support."),
          call("Canterbury electorates", 4, "opposition", 4, "Weak growth turns business voters against the cabinet."),
          call("Provincial dairy regions", 4, "opposition", 6, "Export uncertainty widens the opposition path."),
          call("Minor-party threshold vote", 3, "player", 8, "A late threshold gain cannot rebuild the majority.")
        ]
      }
    }
  }),
  China: createMandatePresentation(TECHNOCRATIC_MANDATE, {
    electionModel: "single-party-performance-compact",
    officeTitle: "Executive",
    governmentLabel: "State Council",
    checkpointLabel: "Performance compact review",
    checkpointVerb: "keep the performance compact intact",
    checkpointAudience: "households, firms, provincial officials, and party cadres",
    electionNight: {
      headlineWon: "Performance Review: The Development Compact Holds",
      headlineLost: "Performance Review: The Development Compact Frays",
      playerLabel: "Development compact",
      oppositionLabel: "Stress indicators",
      playerCallLabel: "Stays within the compact",
      oppositionCallLabel: "Adds to stress indicators",
      callGroupLabel: "Household And Provincial Confidence Blocs",
      calls: {
        won: [
          call("Coastal export provinces", 5, "player", 1, "Factory confidence stabilizes around competitiveness gains."),
          call("Property-exposed cities", 5, "opposition", 2, "Housing weakness remains the largest stress point."),
          call("Interior consumption provinces", 4, "player", 4, "Household support keeps consumption from sliding further."),
          call("Local-government finance desks", 4, "opposition", 6, "Debt strain limits the compact's margin."),
          call("Technology and manufacturing parks", 5, "player", 8, "Productivity investment secures the review.")
        ],
        lost: [
          call("Coastal export provinces", 5, "opposition", 1, "External demand weakness becomes a confidence shock."),
          call("Property-exposed cities", 5, "opposition", 2, "Housing stress dominates household expectations."),
          call("Interior consumption provinces", 4, "player", 4, "Transfers provide a partial floor."),
          call("Local-government finance desks", 4, "opposition", 6, "Debt pressure overwhelms the credibility case."),
          call("Technology and manufacturing parks", 5, "player", 8, "Late productivity confidence cannot hold the compact.")
        ]
      }
    }
  }),
  "Saudi Arabia": createMandatePresentation(TECHNOCRATIC_MANDATE, {
    electionModel: "royal-executive-compact",
    officeTitle: "Executive",
    governmentLabel: "Royal cabinet",
    checkpointLabel: "Vision compact review",
    checkpointVerb: "keep the royal development compact intact",
    checkpointAudience: "households, business leaders, regional officials, and investors",
    progressMarkerLabel: "Vision review",
    electionNight: {
      headlineWon: "Vision Review: Diversification Keeps Its Mandate",
      headlineLost: "Vision Review: Diversification Loses Confidence",
      playerLabel: "Vision compact",
      oppositionLabel: "Confidence stress",
      playerCallLabel: "Supports the compact",
      oppositionCallLabel: "Adds to confidence stress",
      callGroupLabel: "Development And Regional Blocs",
      calls: {
        won: [
          call("Riyadh investment corridor", 5, "player", 1, "Non-oil investment strengthens confidence."),
          call("Eastern Province energy desks", 4, "player", 2, "Oil revenue keeps fiscal room credible."),
          call("Youth employment indicators", 4, "opposition", 4, "Jobs pressure remains the main stress point."),
          call("Red Sea development projects", 4, "player", 6, "Tourism and infrastructure promises hold."),
          call("Household price confidence", 3, "player", 8, "Stable prices seal the compact review.")
        ],
        lost: [
          call("Riyadh investment corridor", 5, "opposition", 1, "Investment doubts weaken the diversification story."),
          call("Eastern Province energy desks", 4, "player", 2, "Oil revenue provides a partial cushion."),
          call("Youth employment indicators", 4, "opposition", 4, "Job pressure becomes politically central."),
          call("Red Sea development projects", 4, "opposition", 6, "Project delays cut into credibility."),
          call("Household price confidence", 3, "player", 8, "Stable prices are not enough to hold the compact.")
        ]
      }
    }
  }),
  "South Africa": createMandatePresentation(PARLIAMENTARY_MANDATE, {
    electionModel: "proportional-coalition",
    officeTitle: "President",
    governmentLabel: "Union Buildings government",
    checkpointLabel: "National Assembly coalition vote",
    checkpointVerb: "retain an Assembly governing bloc",
    checkpointAudience: "party-list voters, provinces, and coalition partners",
    electionNight: {
      headlineWon: "Assembly Night: The Governing Bloc Holds",
      headlineLost: "Assembly Night: The Governing Bloc Breaks",
      targetVotes: 201,
      targetLabel: "Assembly majority",
      playerLabel: "Governing bloc",
      oppositionLabel: "Opposition blocs",
      callGroupLabel: "Province Party-List Blocs",
      seedVotes: { won: { player: 148, opposition: 146 }, lost: { player: 139, opposition: 155 } },
      calls: {
        won: [
          call("Gauteng urban vote", 17, "opposition", 1, "Jobs and power frustration keep the opposition strong."),
          call("KwaZulu-Natal bloc", 13, "opposition", 2, "Regional competition tightens the governing path."),
          call("Western Cape list vote", 11, "opposition", 4, "Fiscal credibility concerns hold opposition ground."),
          call("Eastern Cape public-service vote", 14, "player", 6, "Transfers and services preserve a governing bloc."),
          call("Mining belt provinces", 12, "player", 8, "Infrastructure progress gives the coalition enough numbers.")
        ],
        lost: [
          call("Gauteng urban vote", 17, "opposition", 1, "Unemployment and power constraints dominate the largest province."),
          call("KwaZulu-Natal bloc", 13, "opposition", 2, "Regional frustration fragments the governing coalition."),
          call("Western Cape list vote", 11, "opposition", 4, "Credibility concerns widen the gap."),
          call("Eastern Cape public-service vote", 14, "player", 6, "Service promises save some support."),
          call("Mining belt provinces", 12, "player", 8, "Late industrial holds cannot repair the Assembly majority.")
        ]
      }
    }
  }),
  Nigeria: createMandatePresentation(NATIONAL_MANDATE, {
    electionModel: "federal-presidential-spread",
    officeTitle: "President",
    governmentLabel: "Federal executive",
    checkpointLabel: "Federal spread mandate",
    checkpointVerb: "hold the national vote and regional spread",
    checkpointAudience: "voters across geopolitical zones and state blocs",
    progressMarkerLabel: "Federal spread",
    electionNight: {
      headlineWon: "Federal Mandate Night: The Spread Holds",
      headlineLost: "Federal Mandate Night: The Spread Fails",
      targetVotes: 25,
      targetLabel: "Spread benchmark",
      voteUnitLabel: "state-spread points",
      voteUnitShortLabel: "spread",
      playerLabel: "Federal ticket",
      oppositionLabel: "Challenger tickets",
      playerCallLabel: "Adds to national spread",
      oppositionCallLabel: "Breaks away from national spread",
      callGroupLabel: "Geopolitical Zone Blocs",
      seedVotes: { won: { player: 18, opposition: 17 }, lost: { player: 16, opposition: 19 } },
      calls: {
        won: [
          call("Lagos and southwest", 3, "player", 1, "Urban inflation relief keeps the federal ticket viable."),
          call("Northwest turnout bloc", 4, "opposition", 2, "Fuel and food prices keep the challenger close."),
          call("North-central swing states", 3, "player", 4, "Targeted transfers protect the spread requirement."),
          call("Niger Delta states", 3, "player", 6, "Oil revenue and investment promises hold."),
          call("Southeast commercial cities", 2, "opposition", 8, "FX pressure trims but does not break the spread.")
        ],
        lost: [
          call("Lagos and southwest", 3, "opposition", 1, "Urban prices turn the commercial core away."),
          call("Northwest turnout bloc", 4, "opposition", 2, "Fuel and food pressure dominates turnout."),
          call("North-central swing states", 3, "player", 4, "Transfers keep a partial route open."),
          call("Niger Delta states", 3, "player", 6, "Investment promises save some states."),
          call("Southeast commercial cities", 2, "opposition", 8, "FX strain breaks the national spread.")
        ]
      }
    }
  }),
  Ghana: createMandatePresentation(FRANCE_MANDATE, {
    electionModel: "presidential-runoff",
    governmentLabel: "Flagstaff House",
    checkpointLabel: "Presidential majority vote",
    checkpointVerb: "win the presidential majority",
    checkpointAudience: "voters across regions and urban markets",
    electionNight: {
      headlineWon: "Election Night: The Majority Holds",
      headlineLost: "Election Night: The Majority Turns",
      playerLabel: "Incumbent ticket",
      oppositionLabel: "Challenger ticket",
      callGroupLabel: "Regional Vote Blocs",
      calls: {
        won: [
          call("Greater Accra markets", 4, "opposition", 1, "Price pressure keeps the challenger competitive."),
          call("Ashanti regional vote", 4, "opposition", 2, "Debt frustration hardens opposition support."),
          call("Northern regions", 4, "player", 4, "Transfers and public works rebuild the incumbent path."),
          call("Western resource belt", 3, "player", 6, "Export revenue strengthens the credibility case."),
          call("Central swing constituencies", 3, "player", 8, "Late stabilization confidence secures the majority.")
        ],
        lost: [
          call("Greater Accra markets", 4, "opposition", 1, "Inflation fatigue dominates the capital markets."),
          call("Ashanti regional vote", 4, "opposition", 2, "Debt repair fails to restore trust quickly enough."),
          call("Northern regions", 4, "player", 4, "Transfers prevent a full collapse."),
          call("Western resource belt", 3, "opposition", 6, "Credibility doubts reach resource communities."),
          call("Central swing constituencies", 3, "player", 8, "Late holds cannot reverse the majority.")
        ]
      }
    }
  }),
  Vietnam: createMandatePresentation(TECHNOCRATIC_MANDATE, {
    electionModel: "single-party-performance-compact",
    officeTitle: "Executive",
    governmentLabel: "Government cabinet",
    checkpointLabel: "Development compact review",
    checkpointVerb: "keep the development compact intact",
    checkpointAudience: "households, exporters, provincial officials, and party cadres",
    electionNight: {
      headlineWon: "Development Review: The Export Compact Holds",
      headlineLost: "Development Review: The Export Compact Strains",
      playerLabel: "Development compact",
      oppositionLabel: "Stress indicators",
      playerCallLabel: "Stays within the compact",
      oppositionCallLabel: "Adds to stress indicators",
      callGroupLabel: "Factory And Provincial Confidence Blocs",
      calls: {
        won: [
          call("Ho Chi Minh City factories", 5, "player", 1, "Export orders and wage gains steady confidence."),
          call("Hanoi services bloc", 4, "player", 2, "Stable prices support urban households."),
          call("Northern manufacturing corridor", 5, "player", 4, "Training investment strengthens the compact."),
          call("Mekong household prices", 3, "opposition", 6, "Food costs remain a visible stress point."),
          call("Central coast provinces", 3, "player", 8, "Infrastructure progress seals the review.")
        ],
        lost: [
          call("Ho Chi Minh City factories", 5, "opposition", 1, "Export weakness becomes a confidence shock."),
          call("Hanoi services bloc", 4, "player", 2, "Urban stability provides a partial hold."),
          call("Northern manufacturing corridor", 5, "opposition", 4, "Supply bottlenecks disappoint factory regions."),
          call("Mekong household prices", 3, "opposition", 6, "Food costs intensify stress indicators."),
          call("Central coast provinces", 3, "player", 8, "Late infrastructure confidence cannot hold the compact.")
        ]
      }
    }
  }),
  Thailand: createMandatePresentation(PARLIAMENTARY_MANDATE, {
    electionModel: "mixed-member-coalition",
    officeTitle: "Prime Minister",
    governmentLabel: "Cabinet",
    checkpointLabel: "House coalition election",
    checkpointVerb: "hold a House coalition",
    checkpointAudience: "constituency voters, party-list voters, and coalition brokers",
    electionNight: {
      headlineWon: "House Night: The Coalition Holds Together",
      headlineLost: "House Night: The Coalition Splinters",
      targetVotes: 251,
      targetLabel: "House majority",
      playerLabel: "Government coalition",
      oppositionLabel: "Opposition parties",
      callGroupLabel: "Constituency And Party-List Blocs",
      seedVotes: { won: { player: 188, opposition: 183 }, lost: { player: 181, opposition: 191 } },
      calls: {
        won: [
          call("Bangkok party-list vote", 17, "opposition", 1, "Household debt keeps urban voters skeptical."),
          call("Central plains constituencies", 15, "player", 2, "Tourism and service jobs protect the coalition."),
          call("Northeast rural seats", 14, "player", 4, "Transfers and farm support hold a key bloc."),
          call("Southern tourism provinces", 12, "player", 6, "Tourism recovery strengthens the government path."),
          call("Military-aligned party balance", 10, "opposition", 8, "Fragmentation tightens but cannot break the coalition.")
        ],
        lost: [
          call("Bangkok party-list vote", 17, "opposition", 1, "Urban debt and prices turn sharply against the cabinet."),
          call("Central plains constituencies", 15, "opposition", 2, "Service gains are not enough to offset household strain."),
          call("Northeast rural seats", 14, "player", 4, "Transfers keep a partial rural hold."),
          call("Southern tourism provinces", 12, "player", 6, "Tourism recovery narrows the gap."),
          call("Military-aligned party balance", 10, "opposition", 8, "Coalition arithmetic breaks at the finish.")
        ]
      }
    }
  }),
  Philippines: createMandatePresentation(NATIONAL_MANDATE, {
    electionModel: "presidential-plurality",
    officeTitle: "President",
    governmentLabel: "Malacanang administration",
    checkpointLabel: "Presidential plurality vote",
    checkpointVerb: "hold the presidential plurality",
    checkpointAudience: "island groups, metro voters, and provincial machines",
    electionNight: {
      headlineWon: "Election Night: The Plurality Holds Across The Islands",
      headlineLost: "Election Night: The Plurality Fractures",
      targetVotes: 39,
      targetLabel: "Plurality benchmark",
      voteUnitLabel: "vote share points",
      voteUnitShortLabel: "pts",
      playerLabel: "Government ticket",
      oppositionLabel: "Opposition field",
      callGroupLabel: "Island And Metro Blocs",
      seedVotes: { won: { player: 29, opposition: 28 }, lost: { player: 27, opposition: 31 } },
      calls: {
        won: [
          call("Metro Manila vote", 4, "opposition", 1, "Food and rent pressure keep the field close."),
          call("Luzon provincial machines", 4, "player", 2, "Infrastructure promises hold provincial support."),
          call("Visayas cities", 3, "player", 4, "Domestic demand and jobs strengthen the ticket."),
          call("Mindanao bloc", 3, "player", 6, "Targeted investment protects the plurality."),
          call("Overseas worker families", 2, "opposition", 8, "Remittance and price worries tighten the margin.")
        ],
        lost: [
          call("Metro Manila vote", 4, "opposition", 1, "Food inflation dominates the capital."),
          call("Luzon provincial machines", 4, "opposition", 2, "Infrastructure delays turn provincial brokers away."),
          call("Visayas cities", 3, "player", 4, "Jobs gains save a partial hold."),
          call("Mindanao bloc", 3, "player", 6, "Targeted investment narrows the loss."),
          call("Overseas worker families", 2, "opposition", 8, "Household remittance stress ends the plurality.")
        ]
      }
    }
  }),
  Kazakhstan: createMandatePresentation(NATIONAL_MANDATE, {
    electionModel: "managed-presidential-mandate",
    officeTitle: "President",
    governmentLabel: "Presidential administration",
    checkpointLabel: "Managed mandate review",
    checkpointVerb: "keep the presidential mandate credible",
    checkpointAudience: "regions, households, firms, and administrative blocs",
    electionNight: {
      headlineWon: "Mandate Review: The Presidential Compact Holds",
      headlineLost: "Mandate Review: The Presidential Compact Weakens",
      targetVotes: 50,
      targetLabel: "Credibility threshold",
      playerLabel: "Presidential mandate",
      oppositionLabel: "Stress signals",
      playerCallLabel: "Supports the mandate",
      oppositionCallLabel: "Adds to stress signals",
      callGroupLabel: "Regional Confidence Blocs",
      calls: {
        won: [
          call("Almaty household confidence", 5, "opposition", 1, "Urban prices remain the main stress point."),
          call("Astana administrative bloc", 4, "player", 2, "Policy credibility steadies the center."),
          call("Western oil regions", 4, "player", 4, "Resource revenue supports the compact."),
          call("Industrial north", 3, "player", 6, "Diversification investment holds confidence."),
          call("Southern household districts", 3, "opposition", 8, "Living-cost pressure trims the mandate.")
        ],
        lost: [
          call("Almaty household confidence", 5, "opposition", 1, "Urban inflation stress dominates the review."),
          call("Astana administrative bloc", 4, "player", 2, "The center holds partially."),
          call("Western oil regions", 4, "opposition", 4, "Resource confidence weakens under price pressure."),
          call("Industrial north", 3, "player", 6, "Investment promises keep some support."),
          call("Southern household districts", 3, "opposition", 8, "Household strain breaks the compact.")
        ]
      }
    }
  }),
  Egypt: createMandatePresentation(NATIONAL_MANDATE, {
    electionModel: "managed-presidential-mandate",
    governmentLabel: "Presidential administration",
    checkpointLabel: "Managed mandate vote",
    checkpointVerb: "keep the presidential mandate credible",
    checkpointAudience: "households, regional officials, and turnout blocs",
    electionNight: {
      headlineWon: "Mandate Vote: Stability Holds",
      headlineLost: "Mandate Vote: Stability Loses Credibility",
      playerLabel: "Presidential mandate",
      oppositionLabel: "Stress signals",
      playerCallLabel: "Supports the mandate",
      oppositionCallLabel: "Adds to stress signals",
      callGroupLabel: "Turnout And Regional Blocs",
      calls: {
        won: [
          call("Greater Cairo households", 5, "opposition", 1, "Food prices remain the largest stress point."),
          call("Alexandria and Delta cities", 4, "player", 2, "Subsidy support steadies urban confidence."),
          call("Upper Egypt districts", 4, "player", 4, "Transfers protect the mandate outside the coast."),
          call("Suez and canal economy", 3, "player", 6, "External earnings support credibility."),
          call("Tourism corridor", 3, "opposition", 8, "Weak confidence trims the mandate but does not break it.")
        ],
        lost: [
          call("Greater Cairo households", 5, "opposition", 1, "Food-price anger overwhelms the stability case."),
          call("Alexandria and Delta cities", 4, "opposition", 2, "Imported inflation dominates the coast."),
          call("Upper Egypt districts", 4, "player", 4, "Transfers prevent a complete collapse."),
          call("Suez and canal economy", 3, "player", 6, "External earnings provide a partial hold."),
          call("Tourism corridor", 3, "opposition", 8, "Confidence stress breaks the mandate review.")
        ]
      }
    }
  }),
  "Sri Lanka": createMandatePresentation(NATIONAL_MANDATE, {
    electionModel: "managed-presidential-mandate",
    governmentLabel: "Crisis cabinet",
    checkpointLabel: "Crisis legitimacy vote",
    checkpointVerb: "keep the crisis mandate alive",
    checkpointAudience: "districts, households, creditors, and protest-sensitive blocs",
    electionNight: {
      headlineWon: "Crisis Vote: The Stabilization Mandate Holds",
      headlineLost: "Crisis Vote: Public Patience Runs Out",
      playerLabel: "Stabilization mandate",
      oppositionLabel: "Anti-crisis bloc",
      callGroupLabel: "District And Confidence Blocs",
      calls: {
        won: [
          call("Colombo urban districts", 5, "opposition", 1, "Shortage memories keep the opposition alive."),
          call("Western Province households", 4, "player", 2, "Inflation relief rebuilds a narrow mandate."),
          call("Tea and export districts", 4, "player", 4, "External earnings stabilize the crisis story."),
          call("Rural fuel-sensitive districts", 3, "opposition", 6, "Fuel pressure keeps public patience thin."),
          call("Creditor confidence signal", 3, "player", 8, "Debt repair gives the mandate enough room to continue.")
        ],
        lost: [
          call("Colombo urban districts", 5, "opposition", 1, "Public frustration dominates the capital."),
          call("Western Province households", 4, "opposition", 2, "Household prices break the stabilization case."),
          call("Tea and export districts", 4, "player", 4, "External earnings provide a partial hold."),
          call("Rural fuel-sensitive districts", 3, "opposition", 6, "Fuel pressure turns districts against the government."),
          call("Creditor confidence signal", 3, "player", 8, "Debt repair arrives too late to save legitimacy.")
        ]
      }
    }
  }),
  Kenya: createMandatePresentation(FRANCE_MANDATE, {
    electionModel: "presidential-runoff",
    governmentLabel: "State House",
    checkpointLabel: "Presidential majority test",
    checkpointVerb: "win the presidential mandate",
    checkpointAudience: "counties, regional coalitions, and urban voters",
    electionNight: {
      headlineWon: "Mandate Night: State House Holds The Counties",
      headlineLost: "Mandate Night: State House Loses The Counties",
      playerLabel: "Incumbent coalition",
      oppositionLabel: "Challenger coalition",
      callGroupLabel: "County And Regional Blocs",
      calls: {
        won: [
          call("Nairobi metro vote", 4, "opposition", 1, "Food and rent pressure make the capital difficult."),
          call("Central Kenya counties", 4, "player", 2, "Business confidence steadies the incumbent path."),
          call("Rift Valley bloc", 4, "player", 4, "Farm and fuel relief holds a key region."),
          call("Coastal counties", 3, "opposition", 6, "Living-cost anger tightens the count."),
          call("Western swing counties", 3, "player", 8, "Late jobs messaging secures the mandate.")
        ],
        lost: [
          call("Nairobi metro vote", 4, "opposition", 1, "Food inflation dominates the capital."),
          call("Central Kenya counties", 4, "player", 2, "Business confidence gives a partial hold."),
          call("Rift Valley bloc", 4, "opposition", 4, "Fuel and farm pressure turn a core region."),
          call("Coastal counties", 3, "opposition", 6, "Living-cost anger widens the challenger lead."),
          call("Western swing counties", 3, "player", 8, "Late holds are not enough to save the mandate.")
        ]
      }
    }
  })
} satisfies Record<string, MandatePresentation>;

const US_MECHANICS: ScenarioMechanics = {
  summary: "Balanced mandate pressure with moderate trade exposure and broad policy effectiveness.",
  notes: [
    "Reelection pressure is steady rather than extreme.",
    "External balance matters, but it rarely dominates the whole term.",
    "Fiscal, monetary, and supply-side tools all transmit at fairly balanced strength."
  ],
  mandate: COUNTRY_MANDATES["United States"],
  politicalPressure: {
    reelectionThreshold: 40,
    approvalFloorShift: 0,
    incumbencyDrag: 0.3,
    approvalVolatility: 1
  },
  externalBalance: {
    tradeSensitivity: 1,
    competitivenessWeight: 1,
    approvalWeight: 1,
    importPassThrough: 1
  },
  policyTradeoffs: {
    monetaryTransmission: 1,
    reserveTransmission: 1,
    fiscalTransmission: 1,
    taxSensitivity: 1,
    transferEffectiveness: 1,
    supplyResponse: 1,
    reformEquityCost: 1,
    inflationSensitivity: 1
  }
};

const US_IRAN_WAR_MECHANICS: ScenarioMechanics = {
  summary: "A hypothetical 2026 conflict shock pushes energy prices, defense spending, and public risk tolerance into the center of the mandate.",
  notes: [
    "Oil and shipping disruption pass into inflation faster than in a normal U.S. run.",
    "Defense and emergency spending support demand but worsen debt and credibility if left unchecked.",
    "Approval is volatile because voters punish both economic pain and perceived weakness."
  ],
  mandate: COUNTRY_MANDATES["United States"],
  politicalPressure: {
    reelectionThreshold: 47,
    approvalFloorShift: 4,
    incumbencyDrag: 0.55,
    approvalVolatility: 1.25
  },
  externalBalance: {
    tradeSensitivity: 1.28,
    competitivenessWeight: 1.08,
    approvalWeight: 1.2,
    importPassThrough: 1.38
  },
  policyTradeoffs: {
    monetaryTransmission: 1.08,
    reserveTransmission: 0.95,
    fiscalTransmission: 1.08,
    taxSensitivity: 1.12,
    transferEffectiveness: 1.08,
    supplyResponse: 0.82,
    reformEquityCost: 1.18,
    inflationSensitivity: 1.32
  }
};

const UK_MECHANICS: ScenarioMechanics = {
  summary: "Parliamentary politics are less forgiving, and sterling confidence makes the external balance bite faster.",
  notes: [
    "A shaky governing coalition raises reelection pressure and political drag.",
    "External weakness feeds through more quickly into competitiveness and confidence.",
    "Tax changes and demand support have sharper short-run political consequences."
  ],
  mandate: COUNTRY_MANDATES["United Kingdom"],
  politicalPressure: {
    reelectionThreshold: 46,
    approvalFloorShift: 2,
    incumbencyDrag: 0.45,
    approvalVolatility: 1.08
  },
  externalBalance: {
    tradeSensitivity: 1.18,
    competitivenessWeight: 1.12,
    approvalWeight: 0.9,
    importPassThrough: 1.1
  },
  policyTradeoffs: {
    monetaryTransmission: 1.05,
    reserveTransmission: 0.95,
    fiscalTransmission: 0.92,
    taxSensitivity: 1.08,
    transferEffectiveness: 1,
    supplyResponse: 0.95,
    reformEquityCost: 1.1,
    inflationSensitivity: 1.12
  }
};

const FRANCE_MECHANICS: ScenarioMechanics = {
  summary: "Social protection softens some shocks, but reform and austerity extract a steeper political price.",
  notes: [
    "Semi-presidential politics create meaningful reelection pressure without pure U.S.-style stability.",
    "Transfers cushion inequality better than in the base model.",
    "Market reform helps long-run performance, but the approval cost arrives sooner."
  ],
  mandate: COUNTRY_MANDATES.France,
  politicalPressure: {
    reelectionThreshold: 43,
    approvalFloorShift: 1,
    incumbencyDrag: 0.36,
    approvalVolatility: 1.02
  },
  externalBalance: {
    tradeSensitivity: 1.1,
    competitivenessWeight: 1.05,
    approvalWeight: 0.85,
    importPassThrough: 1.05
  },
  policyTradeoffs: {
    monetaryTransmission: 0.95,
    reserveTransmission: 0.9,
    fiscalTransmission: 1.05,
    taxSensitivity: 1,
    transferEffectiveness: 1.08,
    supplyResponse: 0.9,
    reformEquityCost: 1.2,
    inflationSensitivity: 1
  }
};

const GREECE_MECHANICS: ScenarioMechanics = {
  summary: "A sovereign-debt crisis makes fiscal credibility urgent, but austerity quickly damages jobs, demand, and public patience.",
  notes: [
    "Debt and deficits are punished faster than in most parliamentary scenarios.",
    "Spending cuts and tax rises can restore credibility, but they carry unusually high unemployment and approval costs.",
    "Competitiveness matters because internal devaluation is one of the few routes to recovery inside the euro area."
  ],
  mandate: COUNTRY_MANDATES.Greece,
  politicalPressure: {
    reelectionThreshold: 42,
    approvalFloorShift: 4,
    incumbencyDrag: 0.62,
    approvalVolatility: 1.28
  },
  externalBalance: {
    tradeSensitivity: 1.28,
    competitivenessWeight: 1.24,
    approvalWeight: 1.15,
    importPassThrough: 1.18
  },
  policyTradeoffs: {
    monetaryTransmission: 0.65,
    reserveTransmission: 0.7,
    fiscalTransmission: 0.78,
    taxSensitivity: 1.28,
    transferEffectiveness: 1.18,
    supplyResponse: 0.82,
    reformEquityCost: 1.42,
    inflationSensitivity: 0.95
  }
};

const EGYPT_MECHANICS: ScenarioMechanics = {
  summary: "Imported inflation and subsidy pressure dominate, while structural reform is economically useful but socially costly.",
  notes: [
    "External weakness spills into domestic prices quickly.",
    "Transfers matter more because lower-income households absorb shocks first.",
    "Monetary tightening works, but with less clean transmission than in advanced economies."
  ],
  mandate: COUNTRY_MANDATES.Egypt,
  politicalPressure: {
    reelectionThreshold: 37,
    approvalFloorShift: -2,
    incumbencyDrag: 0.22,
    approvalVolatility: 0.95
  },
  externalBalance: {
    tradeSensitivity: 1.25,
    competitivenessWeight: 0.95,
    approvalWeight: 0.75,
    importPassThrough: 1.35
  },
  policyTradeoffs: {
    monetaryTransmission: 0.85,
    reserveTransmission: 0.8,
    fiscalTransmission: 1,
    taxSensitivity: 1.1,
    transferEffectiveness: 1.2,
    supplyResponse: 0.75,
    reformEquityCost: 1.25,
    inflationSensitivity: 1.3
  }
};

const SRI_LANKA_MECHANICS: ScenarioMechanics = {
  summary: "A fragile external position makes every macro choice harsher, with confidence and approval swinging much faster.",
  notes: [
    "External deficits and import dependence feed directly into inflation pressure.",
    "Approval is volatile because crisis conditions amplify every policy mistake.",
    "Supply-side progress is slower, while redistribution becomes politically essential."
  ],
  mandate: COUNTRY_MANDATES["Sri Lanka"],
  politicalPressure: {
    reelectionThreshold: 42,
    approvalFloorShift: 3,
    incumbencyDrag: 0.5,
    approvalVolatility: 1.2
  },
  externalBalance: {
    tradeSensitivity: 1.4,
    competitivenessWeight: 0.9,
    approvalWeight: 1.25,
    importPassThrough: 1.5
  },
  policyTradeoffs: {
    monetaryTransmission: 0.8,
    reserveTransmission: 0.7,
    fiscalTransmission: 0.85,
    taxSensitivity: 0.95,
    transferEffectiveness: 1.15,
    supplyResponse: 0.7,
    reformEquityCost: 1.35,
    inflationSensitivity: 1.4
  }
};

const KENYA_MECHANICS: ScenarioMechanics = {
  summary: "Food and fuel exposure keep imported inflation important, while growth policy still matters strongly for approval.",
  notes: [
    "External price shocks pass into household budgets faster than in the base model.",
    "Growth and jobs remain politically valuable, so demand support can pay off.",
    "Reforms help, but their equity cost shows up clearly in the political mood."
  ],
  mandate: COUNTRY_MANDATES.Kenya,
  politicalPressure: {
    reelectionThreshold: 41,
    approvalFloorShift: 0,
    incumbencyDrag: 0.34,
    approvalVolatility: 1.05
  },
  externalBalance: {
    tradeSensitivity: 1.2,
    competitivenessWeight: 1.05,
    approvalWeight: 1.05,
    importPassThrough: 1.22
  },
  policyTradeoffs: {
    monetaryTransmission: 0.9,
    reserveTransmission: 0.85,
    fiscalTransmission: 1.02,
    taxSensitivity: 1,
    transferEffectiveness: 1.05,
    supplyResponse: 0.95,
    reformEquityCost: 1.1,
    inflationSensitivity: 1.15
  }
};

const SINGAPORE_MECHANICS: ScenarioMechanics = {
  summary: "This small open economy lives and dies by competitiveness, while voters expect consistently high performance.",
  notes: [
    "External demand and competitiveness drive much larger swings in the trade position.",
    "Reelection pressure is demanding because the political standard for competence is high.",
    "Supply-side policy works especially well, while blunt fiscal expansion is less decisive."
  ],
  mandate: COUNTRY_MANDATES.Singapore,
  politicalPressure: {
    reelectionThreshold: 52,
    approvalFloorShift: 4,
    incumbencyDrag: 0.35,
    approvalVolatility: 1.05
  },
  externalBalance: {
    tradeSensitivity: 1.45,
    competitivenessWeight: 1.35,
    approvalWeight: 0.75,
    importPassThrough: 0.85
  },
  policyTradeoffs: {
    monetaryTransmission: 1.15,
    reserveTransmission: 1.05,
    fiscalTransmission: 0.85,
    taxSensitivity: 0.9,
    transferEffectiveness: 0.8,
    supplyResponse: 1.2,
    reformEquityCost: 0.8,
    inflationSensitivity: 0.9
  }
};

function createModernMechanics(input: {
  summary: string;
  notes: string[];
  mandate?: MandatePresentation;
  politicalPressure?: Partial<ScenarioMechanics["politicalPressure"]>;
  externalBalance?: Partial<ScenarioMechanics["externalBalance"]>;
  policyTradeoffs?: Partial<ScenarioMechanics["policyTradeoffs"]>;
}): ScenarioMechanics {
  return {
    summary: input.summary,
    notes: input.notes,
    mandate: input.mandate ?? NATIONAL_MANDATE,
    politicalPressure: {
      reelectionThreshold: 44,
      approvalFloorShift: 1,
      incumbencyDrag: 0.36,
      approvalVolatility: 1.05,
      ...input.politicalPressure
    },
    externalBalance: {
      tradeSensitivity: 1.12,
      competitivenessWeight: 1.05,
      approvalWeight: 0.95,
      importPassThrough: 1.08,
      ...input.externalBalance
    },
    policyTradeoffs: {
      monetaryTransmission: 1,
      reserveTransmission: 0.92,
      fiscalTransmission: 1,
      taxSensitivity: 1,
      transferEffectiveness: 1,
      supplyResponse: 0.98,
      reformEquityCost: 1.08,
      inflationSensitivity: 1.08,
      ...input.policyTradeoffs
    }
  };
}

const MODERN_COUNTRY_SCENARIOS: Scenario[] = [
  {
    id: "canada-2025-housing-squeeze",
    title: "Housing Squeeze",
    subtitle: "Canada, 2025",
    summary: "High housing costs and stretched households force you to balance rate relief, investment, and fiscal restraint.",
    country: "Canada",
    politicalSystem: "Federal Parliamentary Democracy",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A resource-rich open economy where housing affordability and household debt make monetary choices politically sensitive.",
      notes: [
        "Rate changes transmit strongly through mortgage pressure.",
        "Public investment can help supply constraints, but deficits are watched closely.",
        "Commodity exports soften some external pressure without removing trade risk."
      ],
      mandate: COUNTRY_MANDATES.Canada,
      politicalPressure: { reelectionThreshold: 45, incumbencyDrag: 0.42 },
      externalBalance: { tradeSensitivity: 1.05, importPassThrough: 1.02 },
      policyTradeoffs: { monetaryTransmission: 1.12, fiscalTransmission: 0.96, supplyResponse: 1.02 }
    }),
    goals: [
      { label: "Bring inflation below 2.8%", metric: "inflation", comparator: "lte", value: 2.8 },
      { label: "Keep unemployment below 7.0%", metric: "unemployment", comparator: "lte", value: 7.0 }
    ],
    startingStats: { growth: 1.7, unemployment: 6.9, inflation: 2.1, budget: -1.8, netExports: -0.9, debt: 113.5 }
  },
  {
    id: "germany-2025-industrial-retool",
    title: "Industrial Retool",
    subtitle: "Germany, 2025",
    summary: "Factories need energy security, investment, and export competitiveness while voters resist another squeeze.",
    country: "Germany",
    politicalSystem: "Federal Parliamentary Democracy",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Export-heavy industry rewards competitiveness and supply investment, while coalition politics punishes visible fiscal slippage.",
      notes: [
        "External demand matters more because manufacturing anchors the cycle.",
        "Capital spending has a strong long-run payoff if credibility holds.",
        "Tax and spending choices face a sharper coalition credibility test."
      ],
      mandate: COUNTRY_MANDATES.Germany,
      politicalPressure: { reelectionThreshold: 46, approvalVolatility: 1.08 },
      externalBalance: { tradeSensitivity: 1.32, competitivenessWeight: 1.22, importPassThrough: 1.02 },
      policyTradeoffs: { fiscalTransmission: 0.9, supplyResponse: 1.12, reformEquityCost: 1.12 }
    }),
    goals: [
      { label: "Restore growth above 1.8%", metric: "growth", comparator: "gte", value: 1.8 },
      { label: "Keep debt below 70%", metric: "debtRatio", comparator: "lte", value: 70 }
    ],
    startingStats: { growth: 0.2, unemployment: 3.8, inflation: 2.3, budget: -2.7, netExports: 4.4, debt: 62.9 }
  },
  {
    id: "italy-2025-debt-balancing",
    title: "Debt Balancing Act",
    subtitle: "Italy, 2025",
    summary: "Weak productivity, high debt, and coalition pressure make every stimulus promise expensive.",
    country: "Italy",
    politicalSystem: "Parliamentary Republic",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "High debt makes fiscal expansion risky, but underinvestment makes austerity politically and economically costly.",
      notes: [
        "Debt credibility bites faster than in lower-debt economies.",
        "Reforms can improve potential growth but carry a visible equity cost.",
        "Transfers cushion households but narrow fiscal room quickly."
      ],
      mandate: COUNTRY_MANDATES.Italy,
      politicalPressure: { reelectionThreshold: 44, incumbencyDrag: 0.48, approvalVolatility: 1.12 },
      externalBalance: { tradeSensitivity: 1.16, competitivenessWeight: 1.12 },
      policyTradeoffs: { fiscalTransmission: 0.92, taxSensitivity: 1.1, transferEffectiveness: 1.08, reformEquityCost: 1.25 }
    }),
    goals: [
      { label: "Keep debt below 145%", metric: "debtRatio", comparator: "lte", value: 145 },
      { label: "Lift growth above 1.5%", metric: "growth", comparator: "gte", value: 1.5 }
    ],
    startingStats: { growth: 0.5, unemployment: 6.1, inflation: 1.6, budget: -3.1, netExports: 1.2, debt: 137.1 }
  },
  {
    id: "spain-2025-jobs-and-housing",
    title: "Jobs And Housing",
    subtitle: "Spain, 2025",
    summary: "A service-led recovery is alive, but youth joblessness and rent pressure keep approval fragile.",
    country: "Spain",
    politicalSystem: "Parliamentary Monarchy",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Tourism and services support growth, while labor-market slack and housing costs keep the mandate politically exposed.",
      notes: [
        "Demand support helps jobs more than in older industrial economies.",
        "Inflation pressure is visible because housing and services dominate voter experience.",
        "Labor-market reform improves growth but can create short-run approval costs."
      ],
      mandate: COUNTRY_MANDATES.Spain,
      politicalPressure: { reelectionThreshold: 45, approvalVolatility: 1.08 },
      externalBalance: { tradeSensitivity: 1.08, approvalWeight: 1.05, importPassThrough: 1.08 },
      policyTradeoffs: { fiscalTransmission: 1.08, transferEffectiveness: 1.06, supplyResponse: 1.03, reformEquityCost: 1.18 }
    }),
    goals: [
      { label: "Cut unemployment below 10.0%", metric: "unemployment", comparator: "lte", value: 10.0 },
      { label: "Keep approval above 48", metric: "approval", comparator: "gte", value: 48 }
    ],
    startingStats: { growth: 2.8, unemployment: 10.5, inflation: 2.7, budget: -2.5, netExports: 2.9, debt: 100.4 }
  },
  {
    id: "netherlands-2025-trade-bottleneck",
    title: "Trade Bottleneck",
    subtitle: "Netherlands, 2025",
    summary: "A dense trade hub faces capacity limits, housing pressure, and coalition bargaining over public investment.",
    country: "Netherlands",
    politicalSystem: "Parliamentary Monarchy",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "An ultra-open trade economy rewards competitiveness, but capacity and housing constraints blunt simple demand stimulus.",
      notes: [
        "External balance reacts strongly to competitiveness changes.",
        "Supply investment pays off faster than broad current spending.",
        "Coalition politics keeps approval sensitive to tax and housing trade-offs."
      ],
      mandate: COUNTRY_MANDATES.Netherlands,
      politicalPressure: { reelectionThreshold: 47, incumbencyDrag: 0.4 },
      externalBalance: { tradeSensitivity: 1.42, competitivenessWeight: 1.32, importPassThrough: 0.95 },
      policyTradeoffs: { fiscalTransmission: 0.88, supplyResponse: 1.18, reformEquityCost: 1.05 }
    }),
    goals: [
      { label: "Keep inflation below 2.7%", metric: "inflation", comparator: "lte", value: 2.7 },
      { label: "Protect net exports above 5.0%", metric: "netExports", comparator: "gte", value: 5.0 }
    ],
    startingStats: { growth: 1.9, unemployment: 3.9, inflation: 3.0, budget: -1.8, netExports: 8.8, debt: 43.3 }
  },
  {
    id: "sweden-2025-krona-squeeze",
    title: "Krona Squeeze",
    subtitle: "Sweden, 2025",
    summary: "Currency weakness and household debt collide with a strong welfare model and cautious voters.",
    country: "Sweden",
    politicalSystem: "Parliamentary Monarchy",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Household debt strengthens monetary transmission, while the welfare state makes transfers effective but fiscally visible.",
      notes: [
        "Rate moves hit households quickly through debt service.",
        "Transfers protect approval when labor-market stress rises.",
        "Imported inflation matters because currency confidence is part of the story."
      ],
      mandate: COUNTRY_MANDATES.Sweden,
      politicalPressure: { reelectionThreshold: 46, approvalFloorShift: 2 },
      externalBalance: { tradeSensitivity: 1.22, importPassThrough: 1.18 },
      policyTradeoffs: { monetaryTransmission: 1.18, transferEffectiveness: 1.12, taxSensitivity: 1.06, inflationSensitivity: 1.15 }
    }),
    goals: [
      { label: "Bring inflation below 2.5%", metric: "inflation", comparator: "lte", value: 2.5 },
      { label: "Keep unemployment below 8.5%", metric: "unemployment", comparator: "lte", value: 8.5 }
    ],
    startingStats: { growth: 1.5, unemployment: 8.9, inflation: 2.6, budget: -1.4, netExports: 6.1, debt: 34.9 }
  },
  {
    id: "poland-2025-investment-catchup",
    title: "Investment Catch-Up",
    subtitle: "Poland, 2025",
    summary: "Strong catch-up growth needs infrastructure, skills, and inflation discipline as political expectations rise.",
    country: "Poland",
    politicalSystem: "Parliamentary Republic",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Catch-up growth gives supply policy strong returns, but households still punish inflation and tax shocks quickly.",
      notes: [
        "Capital and education spending lift potential growth meaningfully.",
        "Inflation has a sharper approval cost because recent price shocks are salient.",
        "Trade competitiveness matters as manufacturing integration deepens."
      ],
      mandate: COUNTRY_MANDATES.Poland,
      politicalPressure: { reelectionThreshold: 45, approvalVolatility: 1.08 },
      externalBalance: { tradeSensitivity: 1.2, competitivenessWeight: 1.16, importPassThrough: 1.15 },
      policyTradeoffs: { supplyResponse: 1.18, inflationSensitivity: 1.18, taxSensitivity: 1.08 }
    }),
    goals: [
      { label: "Keep growth above 3.0%", metric: "growth", comparator: "gte", value: 3.0 },
      { label: "Bring inflation below 4.0%", metric: "inflation", comparator: "lte", value: 4.0 }
    ],
    startingStats: { growth: 3.6, unemployment: 3.1, inflation: 3.6, budget: -7.0, netExports: -0.7, debt: 58.8 }
  },
  {
    id: "turkey-2025-inflation-anchor",
    title: "Inflation Anchor",
    subtitle: "Turkey, 2025",
    summary: "A credibility reset begins under extreme inflation, external pressure, and thin household patience.",
    country: "Turkey",
    politicalSystem: "Presidential Republic",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Inflation credibility dominates: monetary tightening works only if policy consistency survives the political backlash.",
      notes: [
        "Imported inflation passes through quickly when currency confidence weakens.",
        "Monetary policy is powerful but politically painful.",
        "Transfers can protect households, but they risk re-igniting credibility doubts."
      ],
      mandate: COUNTRY_MANDATES.Turkey,
      politicalPressure: { reelectionThreshold: 43, approvalFloorShift: 3, incumbencyDrag: 0.52, approvalVolatility: 1.25 },
      externalBalance: { tradeSensitivity: 1.35, competitivenessWeight: 1.05, approvalWeight: 1.22, importPassThrough: 1.55 },
      policyTradeoffs: { monetaryTransmission: 1.15, reserveTransmission: 0.85, transferEffectiveness: 1.12, inflationSensitivity: 1.55, reformEquityCost: 1.28 }
    }),
    goals: [
      { label: "Bring inflation below 28.0%", metric: "inflation", comparator: "lte", value: 28.0 },
      { label: "Keep approval above 40", metric: "approval", comparator: "gte", value: 40 }
    ],
    startingStats: { growth: 3.6, unemployment: 8.3, inflation: 34.9, budget: -2.8, netExports: -1.9, debt: 23.5 }
  },
  {
    id: "brazil-2025-fiscal-anchor",
    title: "Fiscal Anchor",
    subtitle: "Brazil, 2025",
    summary: "Growth hopes, social spending, and market credibility all compete for the same fiscal space.",
    country: "Brazil",
    politicalSystem: "Federal Republic",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Social transfers are politically powerful, but inflation and debt credibility punish undisciplined expansion.",
      notes: [
        "Transfers move poverty and approval more than in the base model.",
        "Debt and inflation expectations react quickly to fiscal slippage.",
        "Commodity exports provide a buffer but not a full escape from credibility pressure."
      ],
      mandate: COUNTRY_MANDATES.Brazil,
      politicalPressure: { reelectionThreshold: 45, approvalVolatility: 1.12 },
      externalBalance: { tradeSensitivity: 1.16, importPassThrough: 1.12 },
      policyTradeoffs: { transferEffectiveness: 1.22, taxSensitivity: 1.08, inflationSensitivity: 1.18, reformEquityCost: 1.18 }
    }),
    goals: [
      { label: "Keep debt below 85%", metric: "debtRatio", comparator: "lte", value: 85 },
      { label: "Bring inflation below 4.0%", metric: "inflation", comparator: "lte", value: 4.0 }
    ],
    startingStats: { growth: 2.3, unemployment: 6.0, inflation: 5.0, budget: -8.1, netExports: -3.0, debt: 93.3 }
  },
  {
    id: "mexico-2025-nearshoring-test",
    title: "Nearshoring Test",
    subtitle: "Mexico, 2025",
    summary: "A manufacturing opportunity is open, but security costs, public investment, and inflation risk crowd the agenda.",
    country: "Mexico",
    politicalSystem: "Federal Republic",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Nearshoring makes supply investment unusually valuable, while household prices and fiscal credibility still constrain policy.",
      notes: [
        "Capital spending lifts competitiveness and external balance strongly.",
        "Inflation pass-through is moderate but politically salient.",
        "Current spending helps approval less than targeted investment."
      ],
      mandate: COUNTRY_MANDATES.Mexico,
      politicalPressure: { reelectionThreshold: 44, approvalVolatility: 1.05 },
      externalBalance: { tradeSensitivity: 1.3, competitivenessWeight: 1.24, importPassThrough: 1.08 },
      policyTradeoffs: { fiscalTransmission: 0.95, supplyResponse: 1.2, transferEffectiveness: 1.06 }
    }),
    goals: [
      { label: "Raise growth above 2.5%", metric: "growth", comparator: "gte", value: 2.5 },
      { label: "Keep net exports above -2.0%", metric: "netExports", comparator: "gte", value: -2.0 }
    ],
    startingStats: { growth: 0.6, unemployment: 2.6, inflation: 3.8, budget: -4.9, netExports: -0.4, debt: 61.8 }
  },
  {
    id: "argentina-2025-stabilization-shock",
    title: "Stabilization Shock",
    subtitle: "Argentina, 2025",
    summary: "A brutal stabilization attempt must rebuild credibility before social pain overwhelms the mandate.",
    country: "Argentina",
    politicalSystem: "Presidential Republic",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Extreme inflation and social strain make credibility valuable, but austerity and reform costs land immediately.",
      notes: [
        "Inflation is the central threat and responds strongly to credibility gains.",
        "Transfers are essential for approval but quickly test fiscal space.",
        "Reforms improve potential growth while creating a sharp equity backlash."
      ],
      mandate: COUNTRY_MANDATES.Argentina,
      politicalPressure: { reelectionThreshold: 41, approvalFloorShift: 4, incumbencyDrag: 0.58, approvalVolatility: 1.35 },
      externalBalance: { tradeSensitivity: 1.32, approvalWeight: 1.25, importPassThrough: 1.65 },
      policyTradeoffs: { monetaryTransmission: 1.18, fiscalTransmission: 0.82, transferEffectiveness: 1.28, inflationSensitivity: 1.7, reformEquityCost: 1.45 }
    }),
    goals: [
      { label: "Bring inflation below 35.0%", metric: "inflation", comparator: "lte", value: 35.0 },
      { label: "Lift approval above 35", metric: "approval", comparator: "gte", value: 35 }
    ],
    startingStats: { growth: 4.4, unemployment: 7.4, inflation: 41.9, budget: -0.4, netExports: -1.1, debt: 80.3 }
  },
  {
    id: "india-2025-growth-inclusion",
    title: "Growth And Inclusion",
    subtitle: "India, 2025",
    summary: "Rapid growth gives you room to move, but jobs, food prices, and infrastructure gaps decide public patience.",
    country: "India",
    politicalSystem: "Federal Parliamentary Democracy",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Fast catch-up growth rewards infrastructure and training, while food-price inflation and inequality remain politically decisive.",
      notes: [
        "Supply-side policy produces strong growth dividends.",
        "Transfers reduce poverty and protect approval when food prices rise.",
        "Inflation pressure is sensitive because household budgets are food-heavy."
      ],
      mandate: COUNTRY_MANDATES.India,
      politicalPressure: { reelectionThreshold: 46, approvalVolatility: 1.08 },
      externalBalance: { tradeSensitivity: 1.14, importPassThrough: 1.18 },
      policyTradeoffs: { fiscalTransmission: 1.08, transferEffectiveness: 1.18, supplyResponse: 1.22, inflationSensitivity: 1.16 }
    }),
    goals: [
      { label: "Keep growth above 6.0%", metric: "growth", comparator: "gte", value: 6.0 },
      { label: "Bring inflation below 4.5%", metric: "inflation", comparator: "lte", value: 4.5 }
    ],
    startingStats: { growth: 7.6, unemployment: 4.9, inflation: 2.1, budget: -7.4, netExports: -0.9, debt: 84.1 }
  },
  {
    id: "indonesia-2025-commodity-transition",
    title: "Commodity Transition",
    subtitle: "Indonesia, 2025",
    summary: "Nickel, infrastructure, and household prices test whether a resource boom can become broader development.",
    country: "Indonesia",
    politicalSystem: "Presidential Republic",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Commodity strength supports external balance, but infrastructure and skills decide whether growth broadens.",
      notes: [
        "Capital spending and training have strong development payoffs.",
        "Imported fuel and food prices still matter for approval.",
        "Broad fiscal expansion is less effective than targeted investment."
      ],
      mandate: COUNTRY_MANDATES.Indonesia,
      politicalPressure: { reelectionThreshold: 43, approvalVolatility: 1 },
      externalBalance: { tradeSensitivity: 1.2, competitivenessWeight: 1.1, importPassThrough: 1.16 },
      policyTradeoffs: { fiscalTransmission: 0.94, transferEffectiveness: 1.08, supplyResponse: 1.18, inflationSensitivity: 1.12 }
    }),
    goals: [
      { label: "Keep growth above 5.0%", metric: "growth", comparator: "gte", value: 5.0 },
      { label: "Keep inflation below 3.5%", metric: "inflation", comparator: "lte", value: 3.5 }
    ],
    startingStats: { growth: 5.1, unemployment: 4.9, inflation: 1.9, budget: -2.9, netExports: -0.1, debt: 41.0 }
  },
  {
    id: "japan-2025-wage-price-turn",
    title: "Wage-Price Turn",
    subtitle: "Japan, 2025",
    summary: "After years of low inflation, wages, debt, and currency pressure make normalization unusually delicate.",
    country: "Japan",
    politicalSystem: "Parliamentary Monarchy",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Very high debt and weak trend growth make fiscal choices narrow, while monetary normalization affects confidence fast.",
      notes: [
        "Debt sensitivity is high even when domestic financing is deep.",
        "Monetary tightening can restore currency confidence but risks a fragile recovery.",
        "Supply policy matters because potential growth is low."
      ],
      mandate: COUNTRY_MANDATES.Japan,
      politicalPressure: { reelectionThreshold: 43, incumbencyDrag: 0.38 },
      externalBalance: { tradeSensitivity: 1.18, competitivenessWeight: 1.12, importPassThrough: 1.2 },
      policyTradeoffs: { monetaryTransmission: 0.92, fiscalTransmission: 0.82, supplyResponse: 1.1, inflationSensitivity: 1.16 }
    }),
    goals: [
      { label: "Keep debt below 260%", metric: "debtRatio", comparator: "lte", value: 260 },
      { label: "Keep growth above 1.0%", metric: "growth", comparator: "gte", value: 1.0 }
    ],
    startingStats: { growth: 1.2, unemployment: 2.5, inflation: 3.2, budget: -1.1, netExports: 4.8, debt: 206.5 }
  },
  {
    id: "south-korea-2025-export-cycle",
    title: "Export Cycle",
    subtitle: "South Korea, 2025",
    summary: "Semiconductors are rebounding, but household debt and weak consumption leave the mandate exposed.",
    country: "South Korea",
    politicalSystem: "Presidential Republic",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A high-tech export economy gains from competitiveness, while household leverage makes rate policy politically sharp.",
      notes: [
        "Export competitiveness drives growth and external balance strongly.",
        "Monetary policy hits indebted households quickly.",
        "Training and capital spending support high-value supply capacity."
      ],
      mandate: COUNTRY_MANDATES["South Korea"],
      politicalPressure: { reelectionThreshold: 45, approvalVolatility: 1.08 },
      externalBalance: { tradeSensitivity: 1.38, competitivenessWeight: 1.28, importPassThrough: 1.02 },
      policyTradeoffs: { monetaryTransmission: 1.12, supplyResponse: 1.15, reformEquityCost: 1.1 }
    }),
    goals: [
      { label: "Keep growth above 2.2%", metric: "growth", comparator: "gte", value: 2.2 },
      { label: "Protect net exports above 3.0%", metric: "netExports", comparator: "gte", value: 3.0 }
    ],
    startingStats: { growth: 1.0, unemployment: 2.8, inflation: 2.1, budget: -1.4, netExports: 6.6, debt: 52.3 }
  },
  {
    id: "australia-2025-cost-of-living",
    title: "Cost Of Living",
    subtitle: "Australia, 2025",
    summary: "Mineral exports help, but mortgage pressure and household prices decide whether the government survives.",
    country: "Australia",
    politicalSystem: "Federal Parliamentary Democracy",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Commodity income cushions the external side, while mortgages make rate decisions central to approval.",
      notes: [
        "Monetary policy has a sharp household channel.",
        "Commodity exports reduce external fragility but do not solve living costs.",
        "Public investment improves supply but can worsen short-run inflation if overused."
      ],
      mandate: COUNTRY_MANDATES.Australia,
      politicalPressure: { reelectionThreshold: 46, approvalVolatility: 1.06 },
      externalBalance: { tradeSensitivity: 1.1, importPassThrough: 1.06 },
      policyTradeoffs: { monetaryTransmission: 1.15, fiscalTransmission: 0.98, supplyResponse: 1.08, inflationSensitivity: 1.12 }
    }),
    goals: [
      { label: "Bring inflation below 3.0%", metric: "inflation", comparator: "lte", value: 3.0 },
      { label: "Keep approval above 48", metric: "approval", comparator: "gte", value: 48 }
    ],
    startingStats: { growth: 2.0, unemployment: 4.2, inflation: 2.9, budget: -2.8, netExports: -2.6, debt: 51.0 }
  },
  {
    id: "new-zealand-2025-rate-hangover",
    title: "Rate Hangover",
    subtitle: "New Zealand, 2025",
    summary: "A small open economy is nursing weak growth, high rates, and fragile household confidence.",
    country: "New Zealand",
    politicalSystem: "Parliamentary Monarchy",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Small-economy exposure and household debt make external shocks and rate settings politically powerful.",
      notes: [
        "Imported inflation and exchange-rate pressure pass through quickly.",
        "Rate relief can revive demand but risks credibility.",
        "Transfers protect households, though fiscal room is watched closely."
      ],
      mandate: COUNTRY_MANDATES["New Zealand"],
      politicalPressure: { reelectionThreshold: 45, approvalVolatility: 1.1 },
      externalBalance: { tradeSensitivity: 1.25, approvalWeight: 1.08, importPassThrough: 1.24 },
      policyTradeoffs: { monetaryTransmission: 1.18, transferEffectiveness: 1.08, inflationSensitivity: 1.18 }
    }),
    goals: [
      { label: "Return growth above 1.5%", metric: "growth", comparator: "gte", value: 1.5 },
      { label: "Bring inflation below 3.0%", metric: "inflation", comparator: "lte", value: 3.0 }
    ],
    startingStats: { growth: 0.2, unemployment: 5.3, inflation: 2.8, budget: -3.9, netExports: -3.7, debt: 54.7 }
  },
  {
    id: "china-2025-property-rebalancing",
    title: "Property Rebalancing",
    subtitle: "China, 2025",
    summary: "Property weakness, export pressure, and local-government debt force a pivot toward consumption and productivity.",
    country: "China",
    politicalSystem: "Single-Party State",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Investment-led growth is losing force, so supply reform and household support must replace property stimulus without losing confidence.",
      notes: [
        "Capital spending is less decisive because overinvestment is part of the problem.",
        "Transfers and confidence support consumption more than broad credit easing.",
        "External demand and competitiveness remain major growth anchors."
      ],
      mandate: COUNTRY_MANDATES.China,
      politicalPressure: { reelectionThreshold: 48, approvalFloorShift: 3, incumbencyDrag: 0.34, approvalVolatility: 1.1 },
      externalBalance: { tradeSensitivity: 1.36, competitivenessWeight: 1.22, importPassThrough: 0.92 },
      policyTradeoffs: { monetaryTransmission: 0.86, fiscalTransmission: 0.9, transferEffectiveness: 1.15, supplyResponse: 1.12, reformEquityCost: 1.15 }
    }),
    goals: [
      { label: "Keep growth above 4.5%", metric: "growth", comparator: "gte", value: 4.5 },
      { label: "Lift approval above 50", metric: "approval", comparator: "gte", value: 50 }
    ],
    startingStats: { growth: 5.0, unemployment: 5.1, inflation: 0.0, budget: -7.9, netExports: 3.7, debt: 99.2 }
  },
  {
    id: "saudi-arabia-2025-oil-diversification",
    title: "Oil Diversification",
    subtitle: "Saudi Arabia, 2025",
    summary: "Oil revenue funds transformation, but non-oil jobs, price stability, and fiscal discipline must line up.",
    country: "Saudi Arabia",
    politicalSystem: "Absolute Monarchy",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Oil buffers the budget and external account, while diversification requires disciplined investment and job creation.",
      notes: [
        "Capital spending has a strong effect when it raises non-oil capacity.",
        "External balance is cushioned by oil but still exposed to global demand.",
        "Transfers can stabilize households, but reform credibility depends on productive investment."
      ],
      mandate: COUNTRY_MANDATES["Saudi Arabia"],
      politicalPressure: { reelectionThreshold: 46, approvalFloorShift: 2, incumbencyDrag: 0.28 },
      externalBalance: { tradeSensitivity: 1.18, competitivenessWeight: 1.1, importPassThrough: 0.82 },
      policyTradeoffs: { fiscalTransmission: 1.08, transferEffectiveness: 1.05, supplyResponse: 1.2, reformEquityCost: 1.0, inflationSensitivity: 0.92 }
    }),
    goals: [
      { label: "Keep growth above 3.0%", metric: "growth", comparator: "gte", value: 3.0 },
      { label: "Keep debt below 35%", metric: "debtRatio", comparator: "lte", value: 35 }
    ],
    startingStats: { growth: 4.5, unemployment: 3.0, inflation: 2.0, budget: -5.8, netExports: -3.0, debt: 31.7 }
  },
  {
    id: "south-africa-2025-power-and-jobs",
    title: "Power And Jobs",
    subtitle: "South Africa, 2025",
    summary: "Power constraints, unemployment, and debt pressure make growth policy urgent and politically risky.",
    country: "South Africa",
    politicalSystem: "Parliamentary Republic",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Supply bottlenecks make infrastructure policy crucial, while unemployment keeps approval extremely sensitive to jobs.",
      notes: [
        "Capital spending strongly improves potential growth if credibility survives.",
        "Transfers are politically important because inequality is high.",
        "Debt pressure limits how much demand support can be sustained."
      ],
      mandate: COUNTRY_MANDATES["South Africa"],
      politicalPressure: { reelectionThreshold: 42, approvalFloorShift: 2, incumbencyDrag: 0.5, approvalVolatility: 1.2 },
      externalBalance: { tradeSensitivity: 1.24, approvalWeight: 1.1, importPassThrough: 1.18 },
      policyTradeoffs: { fiscalTransmission: 0.9, transferEffectiveness: 1.25, supplyResponse: 1.22, reformEquityCost: 1.3 }
    }),
    goals: [
      { label: "Cut unemployment below 28.0%", metric: "unemployment", comparator: "lte", value: 28.0 },
      { label: "Lift growth above 2.0%", metric: "growth", comparator: "gte", value: 2.0 }
    ],
    startingStats: { growth: 1.1, unemployment: 32.4, inflation: 3.2, budget: -5.8, netExports: -0.5, debt: 78.6 }
  },
  {
    id: "nigeria-2025-fx-and-fuel",
    title: "FX And Fuel",
    subtitle: "Nigeria, 2025",
    summary: "Fuel-price reform and currency pressure are hitting households while the government tries to rebuild confidence.",
    country: "Nigeria",
    politicalSystem: "Federal Republic",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Exchange-rate pass-through dominates inflation, while targeted transfers are essential to keep reform socially viable.",
      notes: [
        "Imported inflation reacts sharply to external weakness.",
        "Transfers protect approval more than broad spending.",
        "Supply investment matters, but bottlenecks slow the payoff."
      ],
      mandate: COUNTRY_MANDATES.Nigeria,
      politicalPressure: { reelectionThreshold: 39, approvalFloorShift: 2, incumbencyDrag: 0.45, approvalVolatility: 1.25 },
      externalBalance: { tradeSensitivity: 1.35, approvalWeight: 1.25, importPassThrough: 1.65 },
      policyTradeoffs: { monetaryTransmission: 0.82, fiscalTransmission: 0.86, transferEffectiveness: 1.3, supplyResponse: 0.82, inflationSensitivity: 1.55, reformEquityCost: 1.4 }
    }),
    goals: [
      { label: "Bring inflation below 20.0%", metric: "inflation", comparator: "lte", value: 20.0 },
      { label: "Lift approval above 36", metric: "approval", comparator: "gte", value: 36 }
    ],
    startingStats: { growth: 4.0, unemployment: 3.1, inflation: 23.0, budget: -1.8, netExports: 5.1, debt: 35.5 }
  },
  {
    id: "ghana-2025-debt-repair",
    title: "Debt Repair",
    subtitle: "Ghana, 2025",
    summary: "Debt restructuring has bought time, but inflation, credibility, and household strain still define the mandate.",
    country: "Ghana",
    politicalSystem: "Presidential Republic",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Stabilization depends on credibility, with transfers and supply policy needed to make adjustment politically durable.",
      notes: [
        "Inflation remains highly sensitive to imported costs and expectations.",
        "Fiscal slippage quickly erodes debt repair.",
        "Transfers protect approval, but only if paired with credibility."
      ],
      mandate: COUNTRY_MANDATES.Ghana,
      politicalPressure: { reelectionThreshold: 40, approvalFloorShift: 2, incumbencyDrag: 0.5, approvalVolatility: 1.22 },
      externalBalance: { tradeSensitivity: 1.32, approvalWeight: 1.18, importPassThrough: 1.48 },
      policyTradeoffs: { monetaryTransmission: 0.9, fiscalTransmission: 0.88, transferEffectiveness: 1.22, inflationSensitivity: 1.42, reformEquityCost: 1.28 }
    }),
    goals: [
      { label: "Bring inflation below 12.0%", metric: "inflation", comparator: "lte", value: 12.0 },
      { label: "Keep debt below 90%", metric: "debtRatio", comparator: "lte", value: 90 }
    ],
    startingStats: { growth: 6.0, unemployment: 3.0, inflation: 14.2, budget: -1.3, netExports: 7.9, debt: 48.8 }
  },
  {
    id: "vietnam-2025-export-upgrade",
    title: "Export Upgrade",
    subtitle: "Vietnam, 2025",
    summary: "Manufacturing momentum is strong, but the next leap needs skills, infrastructure, and stable prices.",
    country: "Vietnam",
    politicalSystem: "Single-Party State",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Export-led growth makes competitiveness and supply capacity central, while inflation control protects the development bargain.",
      notes: [
        "Capital spending and training have especially strong growth effects.",
        "External demand has a large impact on output and confidence.",
        "Inflation pass-through is moderate but politically important."
      ],
      mandate: COUNTRY_MANDATES.Vietnam,
      politicalPressure: { reelectionThreshold: 46, approvalVolatility: 1.02 },
      externalBalance: { tradeSensitivity: 1.45, competitivenessWeight: 1.35, importPassThrough: 1.08 },
      policyTradeoffs: { fiscalTransmission: 0.95, supplyResponse: 1.25, reformEquityCost: 1.02, inflationSensitivity: 1.08 }
    }),
    goals: [
      { label: "Keep growth above 6.0%", metric: "growth", comparator: "gte", value: 6.0 },
      { label: "Protect net exports above 2.0%", metric: "netExports", comparator: "gte", value: 2.0 }
    ],
    startingStats: { growth: 8.0, unemployment: 2.2, inflation: 3.3, budget: -2.2, netExports: 6.7, debt: 30.3 }
  },
  {
    id: "thailand-2025-tourism-reset",
    title: "Tourism Reset",
    subtitle: "Thailand, 2025",
    summary: "Tourism has returned, but household debt, weak investment, and political fragmentation limit easy wins.",
    country: "Thailand",
    politicalSystem: "Parliamentary Monarchy",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Services and tourism boost demand, while household debt and political fragmentation make policy errors costly.",
      notes: [
        "Demand support helps service jobs but can lift prices quickly.",
        "Capital and training policy are needed to escape weak investment.",
        "Approval is more volatile because coalition legitimacy is fragile."
      ],
      mandate: COUNTRY_MANDATES.Thailand,
      politicalPressure: { reelectionThreshold: 43, incumbencyDrag: 0.48, approvalVolatility: 1.16 },
      externalBalance: { tradeSensitivity: 1.18, approvalWeight: 1.08, importPassThrough: 1.1 },
      policyTradeoffs: { fiscalTransmission: 1.08, monetaryTransmission: 1.08, supplyResponse: 1.08, reformEquityCost: 1.2 }
    }),
    goals: [
      { label: "Lift growth above 3.0%", metric: "growth", comparator: "gte", value: 3.0 },
      { label: "Keep approval above 45", metric: "approval", comparator: "gte", value: 45 }
    ],
    startingStats: { growth: 2.4, unemployment: 1.0, inflation: -0.1, budget: -1.9, netExports: 3.1, debt: 64.7 }
  },
  {
    id: "philippines-2025-inflation-growth",
    title: "Inflation And Growth",
    subtitle: "Philippines, 2025",
    summary: "Fast domestic demand is useful, but food prices and infrastructure gaps keep the mandate under pressure.",
    country: "Philippines",
    politicalSystem: "Presidential Republic",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Domestic demand supports growth, while food inflation and infrastructure needs make supply policy important.",
      notes: [
        "Current spending supports short-run demand but risks inflation.",
        "Capital and education policy improve potential growth meaningfully.",
        "Food-price pressure makes inflation politically costly."
      ],
      mandate: COUNTRY_MANDATES.Philippines,
      politicalPressure: { reelectionThreshold: 43, approvalVolatility: 1.08 },
      externalBalance: { tradeSensitivity: 1.18, importPassThrough: 1.22 },
      policyTradeoffs: { fiscalTransmission: 1.08, transferEffectiveness: 1.12, supplyResponse: 1.16, inflationSensitivity: 1.18 }
    }),
    goals: [
      { label: "Keep growth above 5.5%", metric: "growth", comparator: "gte", value: 5.5 },
      { label: "Bring inflation below 3.5%", metric: "inflation", comparator: "lte", value: 3.5 }
    ],
    startingStats: { growth: 4.4, unemployment: 4.2, inflation: 1.7, budget: -4.0, netExports: -3.3, debt: 59.4 }
  },
  {
    id: "kazakhstan-2025-diversification-drive",
    title: "Diversification Drive",
    subtitle: "Kazakhstan, 2025",
    summary: "Oil income gives room to invest, but inflation, exchange-rate pressure, and diversification decide the long game.",
    country: "Kazakhstan",
    politicalSystem: "Presidential Republic",
    startingYear: 2025,
    mode: "open",
    heroTag: "Modern Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Resource income buffers the budget, while diversification and inflation control decide whether growth feels durable.",
      notes: [
        "Capital spending can raise non-oil potential growth if inflation stays anchored.",
        "Exchange-rate pass-through makes imported inflation politically visible.",
        "Transfers help households but can slow credibility gains if overused."
      ],
      mandate: COUNTRY_MANDATES.Kazakhstan,
      politicalPressure: { reelectionThreshold: 42, approvalFloorShift: 1, incumbencyDrag: 0.34, approvalVolatility: 1.05 },
      externalBalance: { tradeSensitivity: 1.16, competitivenessWeight: 1.08, importPassThrough: 1.28 },
      policyTradeoffs: { fiscalTransmission: 1.02, transferEffectiveness: 1.1, supplyResponse: 1.14, inflationSensitivity: 1.24 }
    }),
    goals: [
      { label: "Bring inflation below 6.0%", metric: "inflation", comparator: "lte", value: 6.0 },
      { label: "Keep growth above 4.0%", metric: "growth", comparator: "gte", value: 4.0 }
    ],
    startingStats: { growth: 6.5, unemployment: 4.6, inflation: 11.4, budget: -3.1, netExports: -3.9, debt: 24.6 }
  }
];

const FINANCE_CURRICULUM_SCENARIOS: Scenario[] = [
  {
    id: "finance-basics-inflation-savings",
    title: "Inflation and Your Savings",
    subtitle: "Beginner finance case",
    summary: "Prices are rising faster than savings accounts can keep up. Help households protect purchasing power.",
    country: "Kazakhstan",
    politicalSystem: "Presidential Republic",
    startingYear: 2026,
    mode: "open",
    heroTag: "Financial Basics",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A gentle first scenario about inflation, savings, real returns, and household confidence.",
      notes: [
        "High inflation reduces the real value of savings.",
        "Higher interest rates can support savings but make loans more expensive.",
        "Financial education helps households understand real returns."
      ],
      mandate: COUNTRY_MANDATES.Kazakhstan,
      politicalPressure: { reelectionThreshold: 40, approvalVolatility: 0.9, incumbencyDrag: 0.22 },
      externalBalance: { importPassThrough: 1.25, tradeSensitivity: 1.1 },
      policyTradeoffs: { monetaryTransmission: 1.08, transferEffectiveness: 1.05, inflationSensitivity: 1.25 }
    }),
    goals: [
      { label: "Bring inflation below 6.5%", metric: "inflation", comparator: "lte", value: 6.5 },
      { label: "Keep approval above 45", metric: "approval", comparator: "gte", value: 45 }
    ],
    startingStats: { growth: 2.0, unemployment: 5.1, inflation: 10.8, budget: -2.8, netExports: -1.4, debt: 31 }
  },
  {
    id: "finance-basics-first-loan",
    title: "First Loan Decision",
    subtitle: "Beginner finance case",
    summary: "Families want cheaper loans, but the central bank is worried that easy credit could raise inflation.",
    country: "Canada",
    politicalSystem: "Federal Parliamentary Democracy",
    startingYear: 2026,
    mode: "open",
    heroTag: "Financial Basics",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A simple borrowing-cost scenario focused on loans, rates, and affordability.",
      notes: [
        "Lower rates make borrowing cheaper but can increase demand.",
        "Strict credit rules reduce default risk but slow consumption.",
        "Households feel rate changes through loans and mortgages."
      ],
      mandate: COUNTRY_MANDATES.Canada,
      politicalPressure: { reelectionThreshold: 41, approvalVolatility: 0.95 },
      policyTradeoffs: { monetaryTransmission: 1.16, reserveTransmission: 1.05, fiscalTransmission: 0.92 }
    }),
    goals: [
      { label: "Keep unemployment below 6.8%", metric: "unemployment", comparator: "lte", value: 6.8 },
      { label: "Keep inflation below 4.8%", metric: "inflation", comparator: "lte", value: 4.8 }
    ],
    startingStats: { growth: 1.1, unemployment: 6.4, inflation: 4.6, budget: -2.4, netExports: -1.0, debt: 108 }
  },
  {
    id: "finance-basics-budget-balance",
    title: "Budget Balance",
    subtitle: "Beginner finance case",
    summary: "A mild slowdown forces a choice between spending, saving fiscal space, and avoiding too much debt.",
    country: "United Kingdom",
    politicalSystem: "Parliamentary Democracy",
    startingYear: 2026,
    mode: "open",
    heroTag: "Financial Basics",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A basic trade-off case about spending, savings, budget deficits, and debt.",
      notes: [
        "More spending can support demand but increases borrowing.",
        "Cutting too quickly can weaken jobs and confidence.",
        "Balanced policy protects future flexibility."
      ],
      mandate: UK_MANDATE,
      politicalPressure: { reelectionThreshold: 41, incumbencyDrag: 0.28 },
      policyTradeoffs: { fiscalTransmission: 1.05, taxSensitivity: 1.02, inflationSensitivity: 1.0 }
    }),
    goals: [
      { label: "Keep debt below 105%", metric: "debtRatio", comparator: "lte", value: 105 },
      { label: "Restore growth above 1.4%", metric: "growth", comparator: "gte", value: 1.4 }
    ],
    startingStats: { growth: 0.5, unemployment: 5.3, inflation: 3.4, budget: -5.8, netExports: -2.4, debt: 101 }
  },
  {
    id: "finance-basics-emergency-fund",
    title: "Emergency Fund",
    subtitle: "Beginner finance case",
    summary: "A temporary shock hits household income. Build resilience without overheating prices.",
    country: "Australia",
    politicalSystem: "Federal Parliamentary Democracy",
    startingYear: 2026,
    mode: "open",
    heroTag: "Financial Basics",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A household-resilience scenario about saving before uncertainty turns into crisis.",
      notes: [
        "Transfers can protect vulnerable households in the short run.",
        "Financial education improves long-term savings behavior.",
        "Too much demand support can keep inflation elevated."
      ],
      mandate: COUNTRY_MANDATES.Australia,
      politicalPressure: { reelectionThreshold: 42, approvalVolatility: 0.95 },
      policyTradeoffs: { transferEffectiveness: 1.18, fiscalTransmission: 0.96, inflationSensitivity: 1.08 }
    }),
    goals: [
      { label: "Keep unemployment below 6.2%", metric: "unemployment", comparator: "lte", value: 6.2 },
      { label: "Keep inflation below 4.2%", metric: "inflation", comparator: "lte", value: 4.2 }
    ],
    startingStats: { growth: 0.8, unemployment: 5.9, inflation: 4.0, budget: -3.6, netExports: 0.2, debt: 52 }
  },
  {
    id: "finance-basics-simple-investment",
    title: "Simple Investment Choice",
    subtitle: "Beginner market case",
    summary: "Students compare cash, bonds, and stocks while inflation and interest rates change the real outcome.",
    country: "United States",
    politicalSystem: "Presidential Republic",
    startingYear: 2026,
    mode: "open",
    heroTag: "Financial Basics",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A first market scenario about risk, return, inflation, and diversification.",
      notes: [
        "Stocks respond to growth and confidence.",
        "Bonds react to yields and debt credibility.",
        "Cash feels safe but loses purchasing power during inflation."
      ],
      mandate: US_MANDATE,
      politicalPressure: { reelectionThreshold: 41, approvalVolatility: 0.96 },
      policyTradeoffs: { monetaryTransmission: 1.08, reserveTransmission: 1.0, inflationSensitivity: 1.04 }
    }),
    goals: [
      { label: "Keep inflation below 4.5%", metric: "inflation", comparator: "lte", value: 4.5 },
      { label: "Restore growth above 1.8%", metric: "growth", comparator: "gte", value: 1.8 }
    ],
    startingStats: { growth: 1.0, unemployment: 5.0, inflation: 4.4, budget: -4.2, netExports: -2.0, debt: 96 }
  },
  {
    id: "finance-market-stock-reaction",
    title: "Stock Market Reaction",
    subtitle: "Markets and money",
    summary: "Investors are nervous about profits and rates. Every policy signal moves the market.",
    country: "United States",
    politicalSystem: "Presidential Republic",
    startingYear: 2026,
    mode: "open",
    heroTag: "Markets and Money",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A market-confidence scenario where rates, expected profits, and credibility shape equity prices.",
      notes: [
        "Higher rates can lower stocks by raising the cost of capital.",
        "Confidence policy supports markets only if inflation and debt look credible.",
        "Short-term stimulus can lift stocks but raise future risk."
      ],
      mandate: US_MANDATE,
      politicalPressure: { reelectionThreshold: 43, approvalVolatility: 1.08 },
      policyTradeoffs: { monetaryTransmission: 1.1, fiscalTransmission: 0.96, supplyResponse: 0.96 }
    }),
    goals: [
      { label: "Restore growth above 1.8%", metric: "growth", comparator: "gte", value: 1.8 },
      { label: "Keep approval above 45", metric: "approval", comparator: "gte", value: 45 }
    ],
    startingStats: { growth: 0.2, unemployment: 5.8, inflation: 3.7, budget: -5.4, netExports: -2.5, debt: 101 }
  },
  {
    id: "finance-market-bond-yield-pressure",
    title: "Bond Yield Pressure",
    subtitle: "Markets and money",
    summary: "Investors are demanding higher returns to buy government bonds. Borrowing is getting expensive.",
    country: "Italy",
    politicalSystem: "Parliamentary Republic",
    startingYear: 2026,
    mode: "open",
    heroTag: "Markets and Money",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A bond-market case about debt sustainability, yields, and investor trust.",
      notes: [
        "Bond issuance funds spending but raises debt.",
        "Credibility and transparency can lower risk premiums.",
        "Austerity lowers deficits but can slow growth if too abrupt."
      ],
      mandate: COUNTRY_MANDATES.Italy,
      politicalPressure: { reelectionThreshold: 43, incumbencyDrag: 0.48, approvalVolatility: 1.08 },
      policyTradeoffs: { fiscalTransmission: 0.9, taxSensitivity: 1.12, inflationSensitivity: 1.02 }
    }),
    goals: [
      { label: "Keep debt below 150%", metric: "debtRatio", comparator: "lte", value: 150 },
      { label: "Restore growth above 0.8%", metric: "growth", comparator: "gte", value: 0.8 }
    ],
    startingStats: { growth: -0.3, unemployment: 8.1, inflation: 3.9, budget: -6.8, netExports: 0.7, debt: 144 }
  },
  {
    id: "finance-market-currency-depreciation",
    title: "Currency Depreciation",
    subtitle: "Markets and money",
    summary: "A weaker currency is raising import prices. Households feel it through food, fuel, and savings.",
    country: "Turkey",
    politicalSystem: "Presidential Republic",
    startingYear: 2026,
    mode: "open",
    heroTag: "Markets and Money",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "An exchange-rate case connecting currency weakness, inflation, rates, and confidence.",
      notes: [
        "A weaker currency raises import prices.",
        "Higher rates can support the currency but slow lending.",
        "Predictable policy matters when investors can leave."
      ],
      mandate: COUNTRY_MANDATES.Turkey,
      politicalPressure: { reelectionThreshold: 42, approvalVolatility: 1.16 },
      externalBalance: { tradeSensitivity: 1.35, importPassThrough: 1.55, approvalWeight: 1.15 },
      policyTradeoffs: { monetaryTransmission: 1.16, inflationSensitivity: 1.42 }
    }),
    goals: [
      { label: "Bring inflation below 18.0%", metric: "inflation", comparator: "lte", value: 18.0 },
      { label: "Keep approval above 40", metric: "approval", comparator: "gte", value: 40 }
    ],
    startingStats: { growth: 1.0, unemployment: 9.7, inflation: 21.5, budget: -4.4, netExports: -4.1, debt: 58 }
  },
  {
    id: "finance-market-consumer-credit-boom",
    title: "Consumer Credit Boom",
    subtitle: "Markets and money",
    summary: "Easy credit lifted spending, but household debt and default risk are now rising.",
    country: "Canada",
    politicalSystem: "Federal Parliamentary Democracy",
    startingYear: 2026,
    mode: "open",
    heroTag: "Markets and Money",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A credit-cycle scenario about consumption today versus defaults tomorrow.",
      notes: [
        "Easy credit raises demand in the short run.",
        "High household debt makes the financial system fragile.",
        "Credit rules and financial education reduce default risk."
      ],
      mandate: COUNTRY_MANDATES.Canada,
      politicalPressure: { reelectionThreshold: 44, approvalVolatility: 1.08 },
      policyTradeoffs: { monetaryTransmission: 1.18, reserveTransmission: 1.1, transferEffectiveness: 1.02 }
    }),
    goals: [
      { label: "Keep unemployment below 7.5%", metric: "unemployment", comparator: "lte", value: 7.5 },
      { label: "Keep debt below 122%", metric: "debtRatio", comparator: "lte", value: 122 }
    ],
    startingStats: { growth: 2.8, unemployment: 5.8, inflation: 4.8, budget: -4.0, netExports: -1.4, debt: 114 }
  },
  {
    id: "finance-market-banking-regulation",
    title: "Banking Regulation",
    subtitle: "Markets and money",
    summary: "Banks want to lend more aggressively, but supervisors warn that risky loans are building up.",
    country: "United Kingdom",
    politicalSystem: "Parliamentary Democracy",
    startingYear: 2026,
    mode: "open",
    heroTag: "Markets and Money",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A bank-regulation scenario where safety and credit growth push against each other.",
      notes: [
        "Stronger regulation reduces risky lending.",
        "Too much restriction can slow business investment.",
        "Deposit insurance works best with credible supervision."
      ],
      mandate: UK_MANDATE,
      politicalPressure: { reelectionThreshold: 43, approvalVolatility: 1.02 },
      policyTradeoffs: { reserveTransmission: 1.16, fiscalTransmission: 0.95, inflationSensitivity: 1.02 }
    }),
    goals: [
      { label: "Keep inflation below 4.0%", metric: "inflation", comparator: "lte", value: 4.0 },
      { label: "Restore growth above 1.4%", metric: "growth", comparator: "gte", value: 1.4 }
    ],
    startingStats: { growth: 1.2, unemployment: 5.2, inflation: 3.6, budget: -4.3, netExports: -2.2, debt: 98 }
  },
  {
    id: "finance-policy-rate-markets",
    title: "Interest Rates and Markets",
    subtitle: "Policy and finance",
    summary: "Inflation is sticky, loans are expensive, and investors are watching the rate decision.",
    country: "United States",
    politicalSystem: "Presidential Republic",
    startingYear: 2026,
    mode: "open",
    heroTag: "Policy and Finance",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A policy bridge showing how rates affect inflation, loans, stocks, currency, and jobs.",
      notes: [
        "Higher rates can lower inflation but hurt loans and stocks.",
        "Lower rates support demand but can weaken credibility.",
        "The strongest answer depends on which pressure is most urgent."
      ],
      mandate: US_MANDATE,
      politicalPressure: { reelectionThreshold: 44, approvalVolatility: 1.06 },
      policyTradeoffs: { monetaryTransmission: 1.22, reserveTransmission: 1.08, inflationSensitivity: 1.16 }
    }),
    goals: [
      { label: "Bring inflation below 4.2%", metric: "inflation", comparator: "lte", value: 4.2 },
      { label: "Keep unemployment below 6.5%", metric: "unemployment", comparator: "lte", value: 6.5 }
    ],
    startingStats: { growth: 1.1, unemployment: 5.9, inflation: 5.8, budget: -5.0, netExports: -2.1, debt: 98 }
  },
  {
    id: "finance-policy-public-debt",
    title: "Government Debt and Confidence",
    subtitle: "Policy and finance",
    summary: "The government can borrow to support growth, but investors are starting to doubt the fiscal path.",
    country: "France",
    politicalSystem: "Semi-Presidential Republic",
    startingYear: 2026,
    mode: "open",
    heroTag: "Policy and Finance",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A public-finance case about debt, credit ratings, yields, and sustainable investment.",
      notes: [
        "Borrowing can fund investment or crisis support.",
        "High debt raises yields if investors lose confidence.",
        "Growth investment works best with a credible budget plan."
      ],
      mandate: COUNTRY_MANDATES.France,
      politicalPressure: { reelectionThreshold: 44, incumbencyDrag: 0.46, approvalVolatility: 1.12 },
      policyTradeoffs: { fiscalTransmission: 0.94, taxSensitivity: 1.08, supplyResponse: 1.08 }
    }),
    goals: [
      { label: "Keep debt below 118%", metric: "debtRatio", comparator: "lte", value: 118 },
      { label: "Restore growth above 1.2%", metric: "growth", comparator: "gte", value: 1.2 }
    ],
    startingStats: { growth: 0.4, unemployment: 7.6, inflation: 3.2, budget: -6.1, netExports: -1.1, debt: 113 }
  },
  {
    id: "finance-crisis-banking-panic",
    title: "Banking Panic",
    subtitle: "Advanced crisis case",
    summary: "Depositors are pulling money from banks. You need to stop panic without rewarding reckless behavior.",
    country: "United States",
    politicalSystem: "Presidential Republic",
    startingYear: 2026,
    mode: "open",
    heroTag: "Crisis Management",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A bank-run case about deposit insurance, liquidity, regulation, and moral hazard.",
      notes: [
        "Deposit insurance can reduce bank-run risk.",
        "Liquidity support can stop panic but raises public responsibility.",
        "Weak regulation makes future crises more likely."
      ],
      mandate: US_MANDATE,
      politicalPressure: { reelectionThreshold: 42, approvalVolatility: 1.25, incumbencyDrag: 0.55 },
      policyTradeoffs: { monetaryTransmission: 1.16, reserveTransmission: 1.24, fiscalTransmission: 1.05, inflationSensitivity: 0.92 }
    }),
    goals: [
      { label: "Keep unemployment below 8.0%", metric: "unemployment", comparator: "lte", value: 8.0 },
      { label: "Keep debt below 105%", metric: "debtRatio", comparator: "lte", value: 105 }
    ],
    startingStats: { growth: -2.2, unemployment: 7.2, inflation: 2.4, budget: -8.0, netExports: -2.0, debt: 92 }
  },
  {
    id: "finance-crisis-debt-confidence",
    title: "Debt Crisis",
    subtitle: "Advanced crisis case",
    summary: "Credit-rating pressure is rising. Investors demand higher yields and public services are under strain.",
    country: "Italy",
    politicalSystem: "Parliamentary Republic",
    startingYear: 2026,
    mode: "open",
    heroTag: "Crisis Management",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A sovereign-debt crisis where credibility, growth, and household pain must be balanced.",
      notes: [
        "Spending cuts reduce deficits but can deepen recession.",
        "Investor transparency can lower risk premiums.",
        "Issuing bonds without credibility worsens yield pressure."
      ],
      mandate: COUNTRY_MANDATES.Italy,
      politicalPressure: { reelectionThreshold: 42, approvalVolatility: 1.24, incumbencyDrag: 0.58 },
      policyTradeoffs: { fiscalTransmission: 0.84, taxSensitivity: 1.18, supplyResponse: 1.0, inflationSensitivity: 1.06 }
    }),
    goals: [
      { label: "Keep debt below 158%", metric: "debtRatio", comparator: "lte", value: 158 },
      { label: "Keep approval above 38", metric: "approval", comparator: "gte", value: 38 }
    ],
    startingStats: { growth: -1.0, unemployment: 9.1, inflation: 5.0, budget: -8.5, netExports: 0.4, debt: 151 }
  },
  {
    id: "finance-crisis-stock-market-crash",
    title: "Stock Market Crash",
    subtitle: "Advanced crisis case",
    summary: "Equity prices are collapsing, banks are cautious, and firms are delaying investment.",
    country: "United States",
    politicalSystem: "Presidential Republic",
    startingYear: 2026,
    mode: "open",
    heroTag: "Crisis Management",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A confidence crisis where markets, banks, rates, and jobs react together.",
      notes: [
        "Markets react to expected profits and uncertainty.",
        "Rate cuts help liquidity but can weaken inflation credibility.",
        "Bank support matters if falling asset prices damage credit."
      ],
      mandate: US_MANDATE,
      politicalPressure: { reelectionThreshold: 43, approvalVolatility: 1.18, incumbencyDrag: 0.5 },
      policyTradeoffs: { monetaryTransmission: 1.14, reserveTransmission: 1.08, fiscalTransmission: 1.0, supplyResponse: 0.92 }
    }),
    goals: [
      { label: "Restore growth above 1.0%", metric: "growth", comparator: "gte", value: 1.0 },
      { label: "Keep unemployment below 7.8%", metric: "unemployment", comparator: "lte", value: 7.8 }
    ],
    startingStats: { growth: -1.7, unemployment: 6.9, inflation: 2.8, budget: -6.2, netExports: -2.3, debt: 101 }
  },
  {
    id: "finance-crisis-currency-defense",
    title: "Currency Crisis",
    subtitle: "Advanced crisis case",
    summary: "The currency is falling fast. Imports are expensive, inflation is rising, and investors are leaving.",
    country: "Turkey",
    politicalSystem: "Presidential Republic",
    startingYear: 2026,
    mode: "open",
    heroTag: "Crisis Management",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A currency-defense case about rates, capital flight, inflation, and public pain.",
      notes: [
        "Higher rates can support the currency but slow the economy.",
        "Excessive money creation can deepen currency pressure.",
        "Confidence returns only if policy looks consistent."
      ],
      mandate: COUNTRY_MANDATES.Turkey,
      politicalPressure: { reelectionThreshold: 40, approvalVolatility: 1.3, incumbencyDrag: 0.52 },
      externalBalance: { tradeSensitivity: 1.5, importPassThrough: 1.85, approvalWeight: 1.3 },
      policyTradeoffs: { monetaryTransmission: 1.26, fiscalTransmission: 0.88, inflationSensitivity: 1.62 }
    }),
    goals: [
      { label: "Bring inflation below 25.0%", metric: "inflation", comparator: "lte", value: 25.0 },
      { label: "Keep approval above 36", metric: "approval", comparator: "gte", value: 36 }
    ],
    startingStats: { growth: -0.2, unemployment: 10.6, inflation: 31.0, budget: -5.8, netExports: -5.2, debt: 66 }
  },
  {
    id: "finance-crisis-inflation-control",
    title: "Inflation Crisis",
    subtitle: "Advanced crisis case",
    summary: "Inflation expectations are rising. Households are angry, but a hard slowdown could raise unemployment.",
    country: "Kazakhstan",
    politicalSystem: "Presidential Republic",
    startingYear: 2026,
    mode: "open",
    heroTag: "Crisis Management",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "An inflation-fighting case where savings protection, currency stability, and jobs collide.",
      notes: [
        "Higher rates reduce demand pressure but hurt loans.",
        "Financial education helps households understand real returns.",
        "Currency stability limits imported inflation."
      ],
      mandate: COUNTRY_MANDATES.Kazakhstan,
      politicalPressure: { reelectionThreshold: 41, approvalVolatility: 1.16 },
      externalBalance: { importPassThrough: 1.45, tradeSensitivity: 1.2 },
      policyTradeoffs: { monetaryTransmission: 1.18, transferEffectiveness: 1.08, inflationSensitivity: 1.45 }
    }),
    goals: [
      { label: "Bring inflation below 9.0%", metric: "inflation", comparator: "lte", value: 9.0 },
      { label: "Keep unemployment below 7.0%", metric: "unemployment", comparator: "lte", value: 7.0 }
    ],
    startingStats: { growth: 1.4, unemployment: 5.6, inflation: 16.5, budget: -4.2, netExports: -2.6, debt: 38 }
  },
  {
    id: "finance-expert-global-financial-crisis",
    title: "Global Financial Crisis",
    subtitle: "Expert simulation",
    summary: "Bank failures, market panic, unemployment, and public debt are all rising at the same time.",
    country: "United States",
    politicalSystem: "Presidential Republic",
    startingYear: 2008,
    mode: "open",
    heroTag: "Expert Simulation",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A full-system crisis with bank rescues, credit freezes, debt pressure, and household distress.",
      notes: [
        "Liquidity support can prevent collapse but raises public debt.",
        "Deposit insurance and regulation calm panic when trust is low.",
        "Stimulus supports jobs but must not destroy fiscal credibility."
      ],
      mandate: US_MANDATE,
      politicalPressure: { reelectionThreshold: 42, approvalVolatility: 1.32, incumbencyDrag: 0.62 },
      policyTradeoffs: { monetaryTransmission: 1.18, reserveTransmission: 1.26, fiscalTransmission: 1.08, inflationSensitivity: 0.88 }
    }),
    goals: [
      { label: "Keep unemployment below 9.0%", metric: "unemployment", comparator: "lte", value: 9.0 },
      { label: "Keep debt below 105%", metric: "debtRatio", comparator: "lte", value: 105 }
    ],
    startingStats: { growth: -3.1, unemployment: 8.1, inflation: 0.8, budget: -10.5, netExports: -3.0, debt: 76 }
  },
  {
    id: "finance-expert-stagflation",
    title: "Stagflation",
    subtitle: "Expert simulation",
    summary: "Inflation and unemployment are high together. Stimulus risks prices; austerity risks jobs.",
    country: "United Kingdom",
    politicalSystem: "Parliamentary Democracy",
    startingYear: 1975,
    mode: "open",
    heroTag: "Expert Simulation",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A supply-shock case where demand tools alone cannot solve both inflation and unemployment.",
      notes: [
        "Rate hikes fight inflation but hurt growth.",
        "Supply-side investment improves capacity slowly.",
        "Transfers protect households but can add demand pressure."
      ],
      mandate: UK_MANDATE,
      politicalPressure: { reelectionThreshold: 39, approvalVolatility: 1.28, incumbencyDrag: 0.55 },
      externalBalance: { importPassThrough: 1.5, tradeSensitivity: 1.24 },
      policyTradeoffs: { monetaryTransmission: 1.08, fiscalTransmission: 0.9, supplyResponse: 0.82, inflationSensitivity: 1.62 }
    }),
    goals: [
      { label: "Bring inflation below 12.0%", metric: "inflation", comparator: "lte", value: 12.0 },
      { label: "Keep unemployment below 9.5%", metric: "unemployment", comparator: "lte", value: 9.5 }
    ],
    startingStats: { growth: -1.2, unemployment: 8.4, inflation: 18.4, budget: -6.7, netExports: -2.9, debt: 66 }
  },
  {
    id: "finance-expert-emerging-market-crisis",
    title: "Emerging Market Crisis",
    subtitle: "Expert simulation",
    summary: "Currency collapse, capital flight, foreign debt, and inflation are hitting at once.",
    country: "Argentina",
    politicalSystem: "Presidential Republic",
    startingYear: 2026,
    mode: "open",
    heroTag: "Expert Simulation",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "An external-confidence crisis where currency, debt, inflation, and public approval collide.",
      notes: [
        "Capital flight weakens the currency and raises inflation.",
        "Credible fiscal repair can lower yields but creates pain.",
        "Money creation is especially dangerous when trust is weak."
      ],
      mandate: COUNTRY_MANDATES.Argentina,
      politicalPressure: { reelectionThreshold: 37, approvalVolatility: 1.38, incumbencyDrag: 0.62 },
      externalBalance: { tradeSensitivity: 1.55, importPassThrough: 1.9, approvalWeight: 1.35 },
      policyTradeoffs: { monetaryTransmission: 1.24, fiscalTransmission: 0.84, taxSensitivity: 1.2, inflationSensitivity: 1.85 }
    }),
    goals: [
      { label: "Bring inflation below 35.0%", metric: "inflation", comparator: "lte", value: 35.0 },
      { label: "Keep approval above 34", metric: "approval", comparator: "gte", value: 34 }
    ],
    startingStats: { growth: -2.6, unemployment: 10.8, inflation: 52, budget: -7.5, netExports: -4.7, debt: 91 }
  },
  {
    id: "finance-expert-housing-bubble",
    title: "Housing Bubble",
    subtitle: "Expert simulation",
    summary: "Housing prices look unstoppable, but leverage is rising and banks are exposed.",
    country: "Canada",
    politicalSystem: "Federal Parliamentary Democracy",
    startingYear: 2026,
    mode: "open",
    heroTag: "Expert Simulation",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A bubble-management case about leverage, credit rules, rates, and banking stability.",
      notes: [
        "Tighter credit can cool a bubble before it bursts.",
        "Ignoring leverage keeps approval high until defaults rise.",
        "Higher rates cool speculation but hit mortgages."
      ],
      mandate: COUNTRY_MANDATES.Canada,
      politicalPressure: { reelectionThreshold: 44, approvalVolatility: 1.18, incumbencyDrag: 0.48 },
      policyTradeoffs: { monetaryTransmission: 1.24, reserveTransmission: 1.2, fiscalTransmission: 0.92, inflationSensitivity: 1.18 }
    }),
    goals: [
      { label: "Keep inflation below 4.8%", metric: "inflation", comparator: "lte", value: 4.8 },
      { label: "Keep unemployment below 7.0%", metric: "unemployment", comparator: "lte", value: 7.0 }
    ],
    startingStats: { growth: 3.7, unemployment: 5.1, inflation: 5.2, budget: -4.5, netExports: -1.8, debt: 121 }
  },
  {
    id: "finance-expert-investor-confidence-collapse",
    title: "Investor Confidence Collapse",
    subtitle: "Expert simulation",
    summary: "Investors are selling assets, bond yields are rising, and the currency is weakening.",
    country: "Brazil",
    politicalSystem: "Presidential Republic",
    startingYear: 2026,
    mode: "open",
    heroTag: "Expert Simulation",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A confidence-collapse case where fiscal credibility, currency, stocks, and approval all matter.",
      notes: [
        "Investor transparency helps only when policy choices support it.",
        "Weak confidence raises yields and weakens currency.",
        "Public anger rises if stabilization ignores households."
      ],
      mandate: COUNTRY_MANDATES.Brazil,
      politicalPressure: { reelectionThreshold: 39, approvalVolatility: 1.34, incumbencyDrag: 0.58 },
      externalBalance: { tradeSensitivity: 1.32, importPassThrough: 1.45 },
      policyTradeoffs: { monetaryTransmission: 1.18, fiscalTransmission: 0.9, taxSensitivity: 1.12, inflationSensitivity: 1.35 }
    }),
    goals: [
      { label: "Keep inflation below 9.0%", metric: "inflation", comparator: "lte", value: 9.0 },
      { label: "Keep debt below 96%", metric: "debtRatio", comparator: "lte", value: 96 }
    ],
    startingStats: { growth: -0.9, unemployment: 9.4, inflation: 11.2, budget: -7.3, netExports: -2.2, debt: 88 }
  }
];

const FINANCE_LAB_SCENARIOS: Scenario[] = [
  {
    id: "finance-2008-banking-crisis",
    title: "Banking Crisis",
    subtitle: "United States, 2008",
    summary: "Banks issued too many risky loans. Trust is collapsing, defaults are rising, and credit is freezing.",
    country: "United States",
    politicalSystem: "Presidential Republic",
    startingYear: 2008,
    mode: "open",
    heroTag: "Finance Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A banking panic where regulation, liquidity support, deposit protection, and public debt all collide.",
      notes: [
        "Bank regulation and deposit insurance directly reduce crisis risk.",
        "Loose credit can revive demand briefly but worsens defaults.",
        "Public rescue policies protect banks but add fiscal and political costs."
      ],
      mandate: US_MANDATE,
      politicalPressure: { reelectionThreshold: 42, approvalVolatility: 1.2, incumbencyDrag: 0.5 },
      externalBalance: { tradeSensitivity: 1.05, importPassThrough: 1.0 },
      policyTradeoffs: { monetaryTransmission: 1.15, reserveTransmission: 1.2, fiscalTransmission: 1.05, inflationSensitivity: 0.9 }
    }),
    goals: [
      { label: "Reduce unemployment below 8.0%", metric: "unemployment", comparator: "lte", value: 8.0 },
      { label: "Keep debt below 90%", metric: "debtRatio", comparator: "lte", value: 90 }
    ],
    startingStats: { growth: -2.5, unemployment: 7.3, inflation: 0.1, budget: -9.8, netExports: -2.8, debt: 73 }
  },
  {
    id: "finance-2026-stock-market-crash",
    title: "Stock Market Crash",
    subtitle: "Advanced finance case",
    summary: "Equity prices have fallen sharply. Investors are panicking, consumer confidence is sliding, and firms delay investment.",
    country: "United States",
    politicalSystem: "Presidential Republic",
    startingYear: 2026,
    mode: "open",
    heroTag: "Finance Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Expectations, interest rates, policy credibility, and financial stability drive the market reaction.",
      notes: [
        "Investor confidence policy has a large effect on stocks and currency.",
        "Rate cuts can support markets but may weaken inflation credibility.",
        "Bank support matters if falling asset prices threaten credit."
      ],
      mandate: US_MANDATE,
      politicalPressure: { reelectionThreshold: 43, approvalVolatility: 1.12 },
      policyTradeoffs: { monetaryTransmission: 1.1, fiscalTransmission: 0.95, supplyResponse: 0.9 }
    }),
    goals: [
      { label: "Restore growth above 1.5%", metric: "growth", comparator: "gte", value: 1.5 },
      { label: "Keep approval above 45", metric: "approval", comparator: "gte", value: 45 }
    ],
    startingStats: { growth: -1.2, unemployment: 6.4, inflation: 2.9, budget: -5.2, netExports: -1.8, debt: 92 }
  },
  {
    id: "finance-2026-debt-crisis",
    title: "Debt Crisis",
    subtitle: "Sovereign bond stress",
    summary: "Government debt is high. Investors demand higher yields and the credit rating is under pressure.",
    country: "Italy",
    politicalSystem: "Parliamentary Republic",
    startingYear: 2026,
    mode: "open",
    heroTag: "Finance Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Debt sustainability is the core challenge: borrowing buys time but yields rise if credibility is weak.",
      notes: [
        "Bond issuance is useful only when paired with a credible path.",
        "Investor confidence can reduce yields faster than blunt austerity alone.",
        "Growth investment helps if it does not break debt credibility."
      ],
      mandate: COUNTRY_MANDATES.Italy,
      politicalPressure: { reelectionThreshold: 43, incumbencyDrag: 0.52, approvalVolatility: 1.16 },
      externalBalance: { tradeSensitivity: 1.12, competitivenessWeight: 1.08 },
      policyTradeoffs: { fiscalTransmission: 0.88, taxSensitivity: 1.12, supplyResponse: 1.02, inflationSensitivity: 1.04 }
    }),
    goals: [
      { label: "Keep debt below 155%", metric: "debtRatio", comparator: "lte", value: 155 },
      { label: "Restore growth above 1.0%", metric: "growth", comparator: "gte", value: 1.0 }
    ],
    startingStats: { growth: -0.6, unemployment: 8.4, inflation: 4.2, budget: -7.2, netExports: 0.6, debt: 148 }
  },
  {
    id: "finance-2026-currency-crisis",
    title: "Currency Crisis",
    subtitle: "Exchange-rate panic",
    summary: "The national currency is falling, imports are more expensive, inflation is rising, and investors are leaving.",
    country: "Turkey",
    politicalSystem: "Presidential Republic",
    startingYear: 2026,
    mode: "open",
    heroTag: "Finance Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Exchange rates connect inflation, interest rates, trade balances, and investor confidence.",
      notes: [
        "Higher rates can defend the currency but hurt loans and jobs.",
        "Excessive bond purchases weaken currency confidence.",
        "Predictable policy and controlled debt are crucial."
      ],
      mandate: COUNTRY_MANDATES.Turkey,
      politicalPressure: { reelectionThreshold: 41, approvalVolatility: 1.24, incumbencyDrag: 0.5 },
      externalBalance: { tradeSensitivity: 1.42, importPassThrough: 1.7, approvalWeight: 1.25 },
      policyTradeoffs: { monetaryTransmission: 1.22, fiscalTransmission: 0.9, inflationSensitivity: 1.55 }
    }),
    goals: [
      { label: "Bring inflation below 22.0%", metric: "inflation", comparator: "lte", value: 22.0 },
      { label: "Keep approval above 38", metric: "approval", comparator: "gte", value: 38 }
    ],
    startingStats: { growth: 0.8, unemployment: 10.2, inflation: 27.5, budget: -5.0, netExports: -4.5, debt: 62 }
  },
  {
    id: "finance-2026-household-debt-crisis",
    title: "Household Debt Crisis",
    subtitle: "Credit defaults rising",
    summary: "Households borrowed too much during easy-credit years. Defaults are rising and banks are under pressure.",
    country: "Canada",
    politicalSystem: "Federal Parliamentary Democracy",
    startingYear: 2026,
    mode: "open",
    heroTag: "Finance Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "Household balance sheets connect credit policy, banking stress, consumption, and unemployment.",
      notes: [
        "Strict consumer credit rules lower default risk but reduce consumption.",
        "Financial education improves long-run resilience.",
        "Deposit insurance helps bank trust but does not fix excessive household debt alone."
      ],
      mandate: COUNTRY_MANDATES.Canada,
      politicalPressure: { reelectionThreshold: 44, approvalVolatility: 1.12 },
      policyTradeoffs: { monetaryTransmission: 1.18, reserveTransmission: 1.12, fiscalTransmission: 0.95 }
    }),
    goals: [
      { label: "Keep unemployment below 8.5%", metric: "unemployment", comparator: "lte", value: 8.5 },
      { label: "Keep debt below 125%", metric: "debtRatio", comparator: "lte", value: 125 }
    ],
    startingStats: { growth: -0.8, unemployment: 7.1, inflation: 3.8, budget: -4.8, netExports: -1.2, debt: 116 }
  },
  {
    id: "finance-2026-inflation-savings",
    title: "Inflation And Savings",
    subtitle: "Purchasing power at risk",
    summary: "Inflation is high and households see their savings lose value. Confidence depends on restoring purchasing power.",
    country: "Kazakhstan",
    politicalSystem: "Presidential Republic",
    startingYear: 2026,
    mode: "open",
    heroTag: "Finance Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "This case teaches how inflation reduces savings, how rates protect purchasing power, and why currency stability matters.",
      notes: [
        "High inflation damages household savings immediately.",
        "Financial education helps households understand real returns.",
        "Currency stability reduces imported inflation pressure."
      ],
      mandate: COUNTRY_MANDATES.Kazakhstan,
      politicalPressure: { reelectionThreshold: 42, approvalVolatility: 1.1 },
      externalBalance: { tradeSensitivity: 1.18, importPassThrough: 1.35 },
      policyTradeoffs: { monetaryTransmission: 1.12, transferEffectiveness: 1.1, inflationSensitivity: 1.35 }
    }),
    goals: [
      { label: "Bring inflation below 7.0%", metric: "inflation", comparator: "lte", value: 7.0 },
      { label: "Keep approval above 42", metric: "approval", comparator: "gte", value: 42 }
    ],
    startingStats: { growth: 2.2, unemployment: 5.0, inflation: 13.2, budget: -3.6, netExports: -2.0, debt: 32 }
  },
  {
    id: "finance-2026-investment-bubble",
    title: "Investment Boom And Bubble",
    subtitle: "Asset prices look unstoppable",
    summary: "Stock and housing prices are rising too fast. Easy credit fuels optimism, but a bubble may be forming.",
    country: "United Kingdom",
    politicalSystem: "Parliamentary Democracy",
    startingYear: 2026,
    mode: "open",
    heroTag: "Finance Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: createModernMechanics({
      summary: "A bubble can make growth and approval look good until credit risk, leverage, and expectations reverse.",
      notes: [
        "Tighter credit rules reduce bubble risk but slow consumption.",
        "Bank regulation is safer than pretending rising asset prices are permanent.",
        "Rate hikes can cool speculation but hurt mortgages and stocks."
      ],
      mandate: UK_MANDATE,
      politicalPressure: { reelectionThreshold: 45, approvalVolatility: 1.12 },
      policyTradeoffs: { monetaryTransmission: 1.16, reserveTransmission: 1.1, fiscalTransmission: 0.96, inflationSensitivity: 1.12 }
    }),
    goals: [
      { label: "Keep inflation below 4.0%", metric: "inflation", comparator: "lte", value: 4.0 },
      { label: "Keep approval above 46", metric: "approval", comparator: "gte", value: 46 }
    ],
    startingStats: { growth: 3.9, unemployment: 4.4, inflation: 4.7, budget: -4.6, netExports: -3.1, debt: 101 }
  }
];

export const SCENARIOS: Scenario[] = [
  ...FINANCE_CURRICULUM_SCENARIOS,
  {
    id: "us-1958-rebuild",
    title: "Postwar Rebuild",
    subtitle: "United States, 1958",
    summary: "A recession has bitten into jobs and confidence. Restore demand without overheating the recovery.",
    country: "United States",
    politicalSystem: "Presidential Republic",
    startingYear: 1958,
    mode: "closed",
    heroTag: "Starter Run",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: US_MECHANICS,
    goals: [
      { label: "Finish above 55 approval", metric: "approval", comparator: "gte", value: 55 },
      { label: "Keep inflation below 4.5%", metric: "inflation", comparator: "lte", value: 4.5 }
    ],
    startingStats: { growth: -0.7, unemployment: 6.84, inflation: 2.73, budget: -0.58, netExports: 0.11, debt: 45 }
  },
  ...FINANCE_LAB_SCENARIOS,
  {
    id: "us-1983-recovery",
    title: "Harsh Recovery",
    subtitle: "United States, 1983",
    summary: "Inflation has been broken, but unemployment is stubbornly high and the fiscal stance is strained.",
    country: "United States",
    politicalSystem: "Presidential Republic",
    startingYear: 1983,
    mode: "open",
    heroTag: "Recovery Run",
    offerTier: "free",
    unlockRequirement: { completedRuns: 1 },
    mechanics: US_MECHANICS,
    goals: [
      { label: "Cut unemployment below 6.5%", metric: "unemployment", comparator: "lte", value: 6.5 },
      { label: "Keep approval above 52", metric: "approval", comparator: "gte", value: 52 }
    ],
    startingStats: { growth: 4.6, unemployment: 9.6, inflation: 3.16, budget: -5.72, netExports: -1.42, debt: 38 }
  },
  {
    id: "us-1974-stagflation",
    title: "Stagflation Furnace",
    subtitle: "United States, 1974",
    summary: "Weak growth and violent inflation force you into brutal trade-offs with almost no easy wins.",
    country: "United States",
    politicalSystem: "Presidential Republic",
    startingYear: 1974,
    mode: "open",
    heroTag: "Crisis Run",
    offerTier: "free",
    unlockRequirement: { completedRuns: 1 },
    mechanics: US_MECHANICS,
    goals: [
      { label: "Bring inflation below 6.0%", metric: "inflation", comparator: "lte", value: 6.0 },
      { label: "Hold unemployment below 7.5%", metric: "unemployment", comparator: "lte", value: 7.5 }
    ],
    startingStats: { growth: -0.5, unemployment: 5.64, inflation: 11.01, budget: -0.4, netExports: -0.05, debt: 33 }
  },
  {
    id: "us-1980-volcker-edge",
    title: "Inflation Crisis",
    subtitle: "United States, 1980",
    summary: "Expectations are unanchored and political patience is thin. Crush inflation without losing the public.",
    country: "United States",
    politicalSystem: "Presidential Republic",
    startingYear: 1980,
    mode: "open",
    heroTag: "High Pressure",
    offerTier: "free",
    unlockRequirement: { completedRuns: 2 },
    mechanics: US_MECHANICS,
    goals: [
      { label: "Reach inflation below 5.0%", metric: "inflation", comparator: "lte", value: 5.0 },
      { label: "Finish with approval above 50", metric: "approval", comparator: "gte", value: 50 }
    ],
    startingStats: { growth: -0.3, unemployment: 7.17, inflation: 13.5, budget: -2.58, netExports: -0.46, debt: 31 }
  },
  {
    id: "us-1999-golden-run",
    title: "Golden Expansion",
    subtitle: "United States, 1999",
    summary: "A prosperous, high-expectation term. You need discipline to preserve the boom without complacency.",
    country: "United States",
    politicalSystem: "Presidential Republic",
    startingYear: 1999,
    mode: "open",
    heroTag: "Boom Years",
    offerTier: "free",
    unlockRequirement: { completedRuns: 2, badges: ["First Mandate"] },
    mechanics: US_MECHANICS,
    goals: [
      { label: "Average growth above 3.5%", metric: "growth", comparator: "gte", value: 3.5 },
      { label: "Keep debt below 65%", metric: "debtRatio", comparator: "lte", value: 65 }
    ],
    startingStats: { growth: 4.8, unemployment: 4.22, inflation: 2.19, budget: 1.3, netExports: -2.69, debt: 57 }
  },
  {
    id: "us-2009-crisis",
    title: "Financial Crisis",
    subtitle: "United States, 2009",
    summary: "Confidence is shattered, unemployment is elevated, and every policy move changes the shape of the recovery.",
    country: "United States",
    politicalSystem: "Presidential Republic",
    startingYear: 2009,
    mode: "open",
    heroTag: "Crash Response",
    offerTier: "free",
    unlockRequirement: { completedRuns: 3 },
    mechanics: US_MECHANICS,
    goals: [
      { label: "Reduce unemployment below 6.0%", metric: "unemployment", comparator: "lte", value: 6.0 },
      { label: "Return growth above 2.5%", metric: "growth", comparator: "gte", value: 2.5 }
    ],
    startingStats: { growth: -2.6, unemployment: 9.28, inflation: -0.32, budget: -9.76, netExports: -2.9, debt: 83 }
  },
  {
    id: "us-2026-iran-war-shock",
    title: "Iran War Shock",
    subtitle: "United States, 2026",
    summary: "A fictional U.S.-Iran conflict sends oil prices, shipping risk, defense costs, and public anxiety higher at the same time.",
    country: "United States",
    politicalSystem: "Presidential Republic",
    startingYear: 2026,
    mode: "open",
    heroTag: "Hypothetical Crisis",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: US_IRAN_WAR_MECHANICS,
    goals: [
      { label: "Bring inflation below 4.5%", metric: "inflation", comparator: "lte", value: 4.5 },
      { label: "Keep approval above 45", metric: "approval", comparator: "gte", value: 45 },
      { label: "Keep debt below 130%", metric: "debtRatio", comparator: "lte", value: 130 }
    ],
    startingStats: { growth: 1.1, unemployment: 4.4, inflation: 5.9, budget: -7.2, netExports: -4.0, debt: 123 }
  },
  {
    id: "uk-1976-imf-crunch",
    title: "IMF Winter",
    subtitle: "United Kingdom, 1976",
    summary: "Sterling is under pressure, inflation is high, and credibility is thin. Stabilize Britain without crushing jobs.",
    country: "United Kingdom",
    politicalSystem: "Parliamentary Democracy",
    startingYear: 1976,
    mode: "open",
    heroTag: "Global Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: UK_MECHANICS,
    goals: [
      { label: "Bring inflation below 10.0%", metric: "inflation", comparator: "lte", value: 10.0 },
      { label: "Keep unemployment below 6.5%", metric: "unemployment", comparator: "lte", value: 6.5 }
    ],
    startingStats: { growth: 2.6, unemployment: 5.6, inflation: 16.5, budget: -6.2, netExports: -1.8, debt: 56 }
  },
  {
    id: "france-1983-rigueur",
    title: "Franc Under Fire",
    subtitle: "France, 1983",
    summary: "The expansion has run into external pressure. Defend stability, competitiveness, and public patience at the same time.",
    country: "France",
    politicalSystem: "Semi-Presidential Republic",
    startingYear: 1983,
    mode: "open",
    heroTag: "Global Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: FRANCE_MECHANICS,
    goals: [
      { label: "Reduce inflation below 7.0%", metric: "inflation", comparator: "lte", value: 7.0 },
      { label: "Finish above 50 approval", metric: "approval", comparator: "gte", value: 50 }
    ],
    startingStats: { growth: 0.8, unemployment: 7.4, inflation: 9.6, budget: -2.9, netExports: -1.2, debt: 25 }
  },
  {
    id: "greece-2010-austerity",
    title: "Austerity Memorandum",
    subtitle: "Greece, 2010",
    summary: "A debt crisis has closed market access. Restore credibility under creditor pressure without breaking jobs, demand, and legitimacy.",
    country: "Greece",
    politicalSystem: "Parliamentary Republic",
    startingYear: 2010,
    mode: "open",
    heroTag: "Global Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: GREECE_MECHANICS,
    goals: [
      { label: "Keep debt below 165%", metric: "debtRatio", comparator: "lte", value: 165 },
      { label: "Lift approval above 38", metric: "approval", comparator: "gte", value: 38 },
      { label: "Improve net exports above -3.0%", metric: "netExports", comparator: "gte", value: -3.0 }
    ],
    startingStats: { growth: -5.5, unemployment: 12.7, inflation: 4.7, budget: -11.2, netExports: -5.4, debt: 146.2 }
  },
  {
    id: "egypt-2016-float",
    title: "Currency Float",
    subtitle: "Egypt, 2016",
    summary: "A hard reform year begins with inflation risk, subsidy pressure, and a fragile social contract.",
    country: "Egypt",
    politicalSystem: "Presidential Republic",
    startingYear: 2016,
    mode: "open",
    heroTag: "Global Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: EGYPT_MECHANICS,
    goals: [
      { label: "Restore growth above 4.5%", metric: "growth", comparator: "gte", value: 4.5 },
      { label: "Keep approval above 45", metric: "approval", comparator: "gte", value: 45 }
    ],
    startingStats: { growth: 4.3, unemployment: 12.5, inflation: 13.8, budget: -12.1, netExports: -6.0, debt: 96 }
  },
  {
    id: "sri-lanka-2022-default",
    title: "Default Spiral",
    subtitle: "Sri Lanka, 2022",
    summary: "Shortages, inflation, and external crisis have collided. Restore basic stability before the public gives up entirely.",
    country: "Sri Lanka",
    politicalSystem: "Presidential Republic",
    startingYear: 2022,
    mode: "open",
    heroTag: "Global Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: SRI_LANKA_MECHANICS,
    goals: [
      { label: "Bring inflation below 25.0%", metric: "inflation", comparator: "lte", value: 25.0 },
      { label: "Lift approval above 38", metric: "approval", comparator: "gte", value: 38 }
    ],
    startingStats: { growth: -7.8, unemployment: 5.2, inflation: 46.4, budget: -10.4, netExports: -3.5, debt: 119 }
  },
  {
    id: "kenya-2011-price-shock",
    title: "Price Shock Republic",
    subtitle: "Kenya, 2011",
    summary: "Food and fuel pressure are testing household resilience. Cool inflation without choking off growth and jobs.",
    country: "Kenya",
    politicalSystem: "Presidential Republic",
    startingYear: 2011,
    mode: "open",
    heroTag: "Global Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: KENYA_MECHANICS,
    goals: [
      { label: "Bring inflation below 9.0%", metric: "inflation", comparator: "lte", value: 9.0 },
      { label: "Keep growth above 4.5%", metric: "growth", comparator: "gte", value: 4.5 }
    ],
    startingStats: { growth: 4.4, unemployment: 6.9, inflation: 14.0, budget: -5.4, netExports: -8.1, debt: 46 }
  },
  {
    id: "singapore-2001-trade-slump",
    title: "Trade Slump",
    subtitle: "Singapore, 2001",
    summary: "An external shock is hammering exports and confidence. Recover competitiveness while protecting jobs in a small open economy.",
    country: "Singapore",
    politicalSystem: "Parliamentary Democracy",
    startingYear: 2001,
    mode: "open",
    heroTag: "Global Case",
    offerTier: "free",
    starterUnlocked: true,
    mechanics: SINGAPORE_MECHANICS,
    goals: [
      { label: "Restore growth above 3.0%", metric: "growth", comparator: "gte", value: 3.0 },
      { label: "Keep unemployment below 5.0%", metric: "unemployment", comparator: "lte", value: 5.0 }
    ],
    startingStats: { growth: -1.1, unemployment: 4.2, inflation: 1.0, budget: 2.2, netExports: 18.0, debt: 87 }
  },
  ...MODERN_COUNTRY_SCENARIOS
];

export function getDifficulty(id: DifficultyPreset["id"]) {
  return DIFFICULTIES.find((item) => item.id === id) ?? DIFFICULTIES[1];
}

export function getScenario(id: string) {
  return SCENARIOS.find((item) => item.id === id) ?? SCENARIOS[0];
}
