/**
 * Minimal fetch wrapper for backend_api.
 *
 * Env:
 * - REACT_APP_BACKEND_URL (optional): Base URL for backend API, e.g. https://host:3001
 *   If not set, defaults to same-origin with port 3001.
 */

const DEFAULT_BASE =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : "http://localhost:3001";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || DEFAULT_BASE).replace(/\/$/, "");

/**
 * PUBLIC_INTERFACE
 * Returns the resolved backend base URL used by the app.
 */
export function getApiBaseUrl() {
  return API_BASE;
}

async function readBodySafe(res) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  try {
    return await res.text();
  } catch {
    return null;
  }
}

function normalizeError(payload, status) {
  if (!payload) return { message: `Request failed (${status})` };
  if (typeof payload === "string") return { message: payload };
  if (payload.error) return { message: payload.error, details: payload };
  if (payload.message) return { message: payload.message, details: payload };
  return { message: `Request failed (${status})`, details: payload };
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await readBodySafe(res);
    const err = new Error(normalizeError(body, res.status).message);
    err.status = res.status;
    err.payload = body;
    throw err;
  }

  // No content
  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

/**
 * PUBLIC_INTERFACE
 * Fetch list of claims.
 * @param {{ q?: string, status?: string, minFraudScore?: number }} params
 */
export async function fetchClaims(params = {}) {
  const usp = new URLSearchParams();
  if (params.q) usp.set("q", params.q);
  if (params.status) usp.set("status", params.status);
  if (typeof params.minFraudScore === "number") usp.set("minFraudScore", String(params.minFraudScore));
  const qs = usp.toString() ? `?${usp.toString()}` : "";
  return request(`/claims${qs}`);
}

/**
 * PUBLIC_INTERFACE
 * Fetch claim by id.
 * @param {string} id
 */
export async function fetchClaimById(id) {
  return request(`/claims/${encodeURIComponent(id)}`);
}

/**
 * PUBLIC_INTERFACE
 * Fetch high risk queue.
 */
export async function fetchHighRiskQueue() {
  return request(`/high-risk-queue`);
}

/**
 * PUBLIC_INTERFACE
 * Upload claims CSV via backend endpoint.
 * Uses multipart/form-data with field name "file" (common convention).
 * @param {File} file
 */
export async function uploadClaimsCsv(file) {
  const fd = new FormData();
  fd.append("file", file);
  return request(`/upload-claims`, {
    method: "POST",
    body: fd,
    headers: {
      // Let browser set boundary.
      Accept: "application/json",
    },
  });
}

/**
 * PUBLIC_INTERFACE
 * Score fraud for an individual claim payload.
 * This endpoint name is provided by the work item; backend may accept either claimId or full claim.
 * @param {object} payload
 */
export async function scoreFraud(payload) {
  return request(`/score-fraud`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * PUBLIC_INTERFACE
 * Get fraud signal definitions / rule catalog.
 */
export async function fetchFraudSignals() {
  return request(`/fraud-signals`);
}

/**
 * PUBLIC_INTERFACE
 * Update investigation/outcome for a claim.
 * @param {{ id: string, outcome: string, notes?: string }} payload
 */
export async function updateOutcome(payload) {
  return request(`/update-outcome`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
