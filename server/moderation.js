// Mistral moderation (server-side only — the API key never reaches the client).
// Docs: POST https://api.mistral.ai/v1/moderations
const API_URL = process.env.MISTRAL_API_URL || "https://api.mistral.ai/v1/moderations";
const DEFAULT_MODEL = process.env.MISTRAL_MODERATION_MODEL || "mistral-moderation-2603";
const FALLBACK_MODEL = "mistral-moderation-latest";
const ENABLED = process.env.MODERATION_ENABLED !== "false";
const FAIL_CLOSED = process.env.MODERATION_FAIL_CLOSED === "true";
const TIMEOUT_MS = Number(process.env.MODERATION_TIMEOUT_MS || 8000);
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE = 500;

const cache = new Map(); // text -> { ts, verdict }
let warnedNoKey = false;

export function moderationEnabled() {
  return ENABLED && Boolean(process.env.MISTRAL_API_KEY);
}

export function moderationInfo() {
  return { enabled: moderationEnabled(), model: DEFAULT_MODEL, failClosed: FAIL_CLOSED };
}

function cacheSet(text, verdict) {
  if (cache.size >= MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(text, { ts: Date.now(), verdict });
}

function parseVerdict(data, model) {
  const result = data?.results?.[0];
  const categories = result?.categories || {};
  const scores = result?.category_scores || {};
  const flagged = Object.entries(categories)
    .filter(([, v]) => v === true)
    .map(([k]) => k);
  return { allowed: flagged.length === 0, flagged, scores, model: data?.model || model };
}

/**
 * Check a message before it is broadcast.
 * Fail-open by default (allow) so a Mistral outage doesn't take the forum down.
 * Set MODERATION_FAIL_CLOSED=true to reject on API errors instead.
 */
export async function moderateText(text) {
  if (!ENABLED) return { allowed: true, flagged: [], scores: {}, skipped: "disabled" };

  const key = process.env.MISTRAL_API_KEY;
  if (!key) {
    if (!warnedNoKey) {
      console.warn("[moderation] MISTRAL_API_KEY not set — messages are not moderated.");
      warnedNoKey = true;
    }
    return { allowed: true, flagged: [], scores: {}, skipped: "no-key" };
  }

  const input = String(text || "").trim();
  if (!input) return { allowed: true, flagged: [], scores: {} };

  const cached = cache.get(input);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.verdict;

  let lastError = null;
  for (const model of [...new Set([DEFAULT_MODEL, FALLBACK_MODEL])]) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ model, input }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        lastError = new Error(`Mistral ${res.status}: ${body.slice(0, 300)}`);
        // Unknown/retired model → try the stable alias.
        if ([400, 404, 422].includes(res.status)) continue;
        break;
      }

      const verdict = parseVerdict(await res.json(), model);
      cacheSet(input, verdict);
      return verdict;
    } catch (err) {
      lastError = err;
    }
  }

  console.error("[moderation] API unavailable:", lastError?.message || lastError);
  if (FAIL_CLOSED) {
    return { allowed: false, flagged: ["moderation_unavailable"], scores: {}, error: true };
  }
  return { allowed: true, flagged: [], scores: {}, skipped: "api-error", error: true };
}
