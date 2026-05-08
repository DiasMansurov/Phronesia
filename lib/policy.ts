import type { AcceptanceContext, AcceptedBy, AgeBand } from "@/lib/game/types";

export const POLICY_VERSIONS = {
  privacy: "2026-04-09",
  terms: "2026-04-09",
  cookies: "2026-04-09",
  schoolPrivacy: "2026-04-09",
  childrenPrivacy: "2026-04-09",
  dpa: "2026-04-09"
} as const;

export type PolicyKey = keyof typeof POLICY_VERSIONS;

export const ESSENTIAL_POLICY_KEYS: PolicyKey[] = ["privacy", "terms", "schoolPrivacy", "childrenPrivacy"];

export type JurisdictionOption = {
  code: string;
  label: string;
  consentAge: number;
};

export const JURISDICTIONS: JurisdictionOption[] = [
  { code: "US", label: "United States", consentAge: 13 },
  { code: "UK", label: "United Kingdom", consentAge: 13 },
  { code: "EU", label: "European Union / EEA", consentAge: 16 },
  { code: "OTHER", label: "Other", consentAge: 16 }
];

export function getJurisdictionOption(code: string) {
  return JURISDICTIONS.find((item) => item.code === code) ?? JURISDICTIONS[JURISDICTIONS.length - 1];
}

export function consentRequirement(ageBand: AgeBand, jurisdiction: string) {
  if (ageBand === "under_13") {
    return {
      canSelfServe: false,
      acceptedBy: "school" as AcceptedBy,
      summary: "Students under 13 must join only through a school-authorized classroom flow."
    };
  }

  if (ageBand === "13_to_local_digital_consent_age" && jurisdiction !== "US" && jurisdiction !== "UK") {
    return {
      canSelfServe: false,
      acceptedBy: "school" as AcceptedBy,
      summary: "This age band needs school authorization or verified parental consent in this jurisdiction."
    };
  }

  return {
    canSelfServe: true,
    acceptedBy: "student" as AcceptedBy,
    summary: "The student can accept the classroom notices directly in this join flow."
  };
}

export function schoolPolicyAcceptanceContext(): AcceptanceContext {
  return "school_signup";
}

export const COOKIE_CONSENT_KEY = "pm.v1.cookie-consent";

export function cookiesRequireConsent(regionCode: string) {
  return regionCode === "UK" || regionCode === "EU";
}

export function inferRegionFromLocale(input: string | undefined) {
  if (!input) return "OTHER";

  const normalized = input.toUpperCase();
  if (normalized.includes("-US") || normalized === "US") return "US";
  if (normalized.includes("-GB") || normalized === "GB" || normalized === "UK") return "UK";

  const euMarkers = [
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
    "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
    "IS", "LI", "NO"
  ];

  if (euMarkers.some((marker) => normalized.endsWith(`-${marker}`) || normalized === marker)) {
    return "EU";
  }

  return "OTHER";
}
