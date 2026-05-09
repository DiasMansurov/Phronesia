export type OlympiadSession = {
  slug: string;
  title: string;
  accessCode: string;
  participantLogin: string;
  teamName: string;
  scenarioId: string;
  createdAt: string;
};

export type OlympiadRunContext = OlympiadSession & {
  runId: string;
};

const SESSION_KEY = "phronesia.olympiad.session";
const RUN_PREFIX = "phronesia.olympiad.run.";

function browser() {
  return typeof window !== "undefined";
}

function parse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function saveOlympiadSession(session: OlympiadSession) {
  if (!browser()) return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadOlympiadSession() {
  if (!browser()) return null;
  return parse<OlympiadSession>(window.localStorage.getItem(SESSION_KEY));
}

export function clearOlympiadSession() {
  if (!browser()) return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function saveOlympiadRunContext(context: OlympiadRunContext) {
  if (!browser()) return;
  window.localStorage.setItem(`${RUN_PREFIX}${context.runId}`, JSON.stringify(context));
}

export function loadOlympiadRunContext(runId: string) {
  if (!browser()) return null;
  return parse<OlympiadRunContext>(window.localStorage.getItem(`${RUN_PREFIX}${runId}`));
}
