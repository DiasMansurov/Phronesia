export const DEFAULT_RESULTS_ADMIN_EMAIL = "dias280608@mail.ru";

export function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

export function isDefaultResultsAdminEmail(email: string | null | undefined) {
  return normalizeEmail(email) === DEFAULT_RESULTS_ADMIN_EMAIL;
}
