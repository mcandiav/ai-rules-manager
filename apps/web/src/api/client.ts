const BASE_URL = import.meta.env.PROD
  ? "/api"
  : "/api";

async function buildError(res: Response, fallback: string): Promise<Error> {
  try {
    const body = await res.json();
    if (body?.error) return new Error(body.error);
  } catch {
    // Ignore parse errors and use the fallback below.
  }
  return new Error(fallback);
}

export async function apiGet(path: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw await buildError(res, `API GET ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPost(path: string, body: any): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw await buildError(res, `API POST ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function apiDelete(path: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, { method: "DELETE" });
  if (!res.ok) {
    throw await buildError(res, `API DELETE ${path} failed: ${res.status}`);
  }
  return res.json();
}
