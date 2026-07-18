const BASE_URL = import.meta.env.PROD
  ? "/api"
  : "http://localhost:8000";

export async function apiGet(path: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API GET ${path} failed: ${res.status}`);
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
    throw new Error(`API POST ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function apiDelete(path: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(`API DELETE ${path} failed: ${res.status}`);
  }
  return res.json();
}
