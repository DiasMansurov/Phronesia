type Payload = Record<string, unknown>;

function getBaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    url,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    }
  };
}

export function supabaseConfigured() {
  return Boolean(getBaseConfig());
}

export async function insertRow(table: string, payload: Payload) {
  const config = getBaseConfig();
  if (!config) {
    return { ok: false, reason: "missing_env" as const };
  }

  const response = await fetch(`${config.url}/rest/v1/${table}`, {
    method: "POST",
    headers: config.headers,
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase insert failed for ${table}: ${response.status} ${text}`);
  }

  return { ok: true as const };
}

export async function upsertRow(table: string, payload: Payload, onConflict?: string) {
  const config = getBaseConfig();
  if (!config) {
    return { ok: false, reason: "missing_env" as const };
  }

  const query = onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : "";
  const response = await fetch(`${config.url}/rest/v1/${table}${query}`, {
    method: "POST",
    headers: {
      ...config.headers,
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase upsert failed for ${table}: ${response.status} ${text}`);
  }

  return (await response.json()) as Payload[];
}

export async function selectRows(table: string, query: Record<string, string>) {
  const config = getBaseConfig();
  if (!config) {
    return { ok: false, reason: "missing_env" as const };
  }

  const params = new URLSearchParams(query);
  const response = await fetch(`${config.url}/rest/v1/${table}?${params.toString()}`, {
    method: "GET",
    headers: {
      apikey: config.headers.apikey,
      Authorization: config.headers.Authorization,
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase select failed for ${table}: ${response.status} ${text}`);
  }

  return (await response.json()) as Payload[];
}

export async function updateRows(table: string, query: Record<string, string>, payload: Payload) {
  const config = getBaseConfig();
  if (!config) {
    return { ok: false, reason: "missing_env" as const };
  }

  const params = new URLSearchParams(query);
  const response = await fetch(`${config.url}/rest/v1/${table}?${params.toString()}`, {
    method: "PATCH",
    headers: {
      ...config.headers,
      Prefer: "return=representation"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase update failed for ${table}: ${response.status} ${text}`);
  }

  return (await response.json()) as Payload[];
}
