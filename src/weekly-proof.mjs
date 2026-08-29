const DEFAULT_BASE_URL = "https://api.aipowergrid.io";
const DEFAULT_TIMEOUT_MS = 15_000;

function assertion(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizedBaseUrl(value) {
  const url = new URL(value || DEFAULT_BASE_URL);
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    throw new Error("Proof snapshots must use HTTPS unless they are loopback-local.");
  }
  url.pathname = url.pathname.replace(/\/$/, "");
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function finiteNonNegative(value, name) {
  assertion(typeof value === "number" && Number.isFinite(value) && value >= 0, `${name} must be non-negative`);
  return value;
}

function integerNonNegative(value, name) {
  assertion(Number.isInteger(value) && value >= 0, `${name} must be a non-negative integer`);
  return value;
}

function jobTotal(bucket, name) {
  assertion(bucket && typeof bucket === "object" && !Array.isArray(bucket), `${name} must be an object`);
  return Object.entries(bucket).reduce(
    (total, [modality, value]) => total + integerNonNegative(value?.jobs, `${name}.${modality}.jobs`),
    0,
  );
}

function formatInteger(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatAipg(value) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(value);
}

function percentage(value) {
  finiteNonNegative(value, "validators.agreement_rate");
  assertion(value <= 1, "validators.agreement_rate must not exceed 1");
  return `${(value * 100).toFixed(1)}%`;
}

function calculation(bucket) {
  return Object.entries(bucket)
    .map(([modality, value]) => `${formatInteger(value.jobs)} ${modality}`)
    .join(" + ");
}

async function requestJson(baseUrl, endpoint, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: { Accept: "application/json" },
      redirect: "error",
      signal: controller.signal,
    });
    assertion(response.status === 200, `${endpoint} returned HTTP ${response.status}`);
    assertion(
      (response.headers.get("content-type") || "").includes("application/json"),
      `${endpoint} did not return JSON`,
    );
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export function renderWeeklyProof({ network, totals, payouts }) {
  assertion(network?.schema === "aipg.network.status.v1", "unsupported network status schema");
  const generatedAt = new Date(network.generated_at);
  assertion(!Number.isNaN(generatedAt.valueOf()), "network.generated_at is invalid");
  assertion(network.capacity && network.validators && network.charging, "network status is incomplete");
  assertion(totals?.day && totals?.total, "job totals are incomplete");
  assertion(payouts?.totals, "payout totals are incomplete");

  const dayJobs = jobTotal(totals.day, "totals.day");
  const allJobs = jobTotal(totals.total, "totals.total");
  const workersOnline = integerNonNegative(network.capacity.workers_online, "capacity.workers_online");
  const modelsOnline = integerNonNegative(network.capacity.models_online, "capacity.models_online");
  const redundancyTarget = integerNonNegative(
    network.capacity.redundancy_target,
    "capacity.redundancy_target",
  );
  const belowTarget = network.capacity.models_below_target;
  assertion(Array.isArray(belowTarget), "capacity.models_below_target must be an array");
  assertion(belowTarget.length <= modelsOnline, "models below target exceeds models online");

  const validators = network.validators;
  const participating = integerNonNegative(validators.participating, "validators.participating");
  const completed = integerNonNegative(validators.assignments_completed, "validators.assignments_completed");
  const verifiedIndependent = integerNonNegative(
    validators.verified_independent,
    "validators.verified_independent",
  );
  assertion(verifiedIndependent <= participating, "verified validators exceeds participating validators");
  assertion(validators.economic_effect === "none", "weekly copy must be reviewed before validators gain economic effect");

  const payoutTotals = payouts.totals;
  const aipgPaid = finiteNonNegative(payoutTotals.aipg_paid, "payouts.totals.aipg_paid");
  const payoutCount = integerNonNegative(payoutTotals.payouts, "payouts.totals.payouts");
  const workersPaid = integerNonNegative(payoutTotals.workers_paid, "payouts.totals.workers_paid");
  const chargingMode = String(network.charging.mode || "unknown");
  const chargingGlobal = network.charging.global === true;
  const incidentHistoryAvailable = network.incident_history_available === true;
  const snapshotDate = generatedAt.toISOString().slice(0, 10);
  const snapshotTime = generatedAt.toISOString();

  return `# AI Power Grid Weekly Proof Post - ${snapshotDate}

Snapshot captured at \`${snapshotTime}\` from the public Grid API.

## Thread copy

### Post 1

AI Power Grid proof snapshot, ${generatedAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })}:

${formatInteger(allJobs)} recorded jobs all time, including ${formatInteger(dayJobs)} in the current
24-hour statistics window. ${formatInteger(workersOnline)} workers are online across
${formatInteger(modelsOnline)} model routes for text, image, video, and audio.

Live status: https://api.aipowergrid.io/v1/status/network

### Post 2

Worker payouts: ${formatAipg(aipgPaid)} AIPG across ${formatInteger(payoutCount)} on-chain Base
payouts to ${formatInteger(workersPaid)} payout addresses.

Verify the transactions: https://console.aipowergrid.io/transparency

### Post 3

Validator preview: ${formatInteger(participating)} validators participated in the status window,
with ${formatInteger(completed)} assignments completed and ${percentage(validators.agreement_rate)} agreement.

Honest limits: validators have no economic authority, ${formatInteger(verifiedIndependent)} validator operators are
independently verified, and ${formatInteger(belowTarget.length)} of ${formatInteger(modelsOnline)} live model
routes remain below the ${formatInteger(redundancyTarget)}-worker redundancy target.

### Post 4

Distribution: native integration source and reproducible release evidence are public.
LiteLLM provider and documentation, elizaOS registry, and LangChain documentation
PRs are submitted; Dify, AI SDK, n8n, and Open WebUI remain tracked separately.

https://github.com/AIPowerGrid/grid-provider-integrations

### Post 5

Metrics we will not fake: charging mode is \`${chargingMode}\` and global charging is
\`${chargingGlobal}\`, so the public API does not prove a paid-request count. It also
does not identify independent worker ownership, external builders, or historical uptime.
Incident history is currently reported as \`${incidentHistoryAvailable}\`.

## Evidence

- Current health: https://api.aipowergrid.io/health
- Network status and validator aggregates:
  https://api.aipowergrid.io/v1/status/network
- Day, month, and all-time job counts:
  https://api.aipowergrid.io/v1/stats/totals
- Public payout ledger: https://api.aipowergrid.io/v1/payouts/public
- Payout explorer: https://console.aipowergrid.io/transparency
- Provider campaign source:
  https://github.com/AIPowerGrid/grid-provider-integrations
- LiteLLM provider PR: https://github.com/BerriAI/litellm/pull/38725
- elizaOS registry PR: https://github.com/elizaOS/eliza/pull/29964
- LangChain documentation PR: https://github.com/langchain-ai/docs/pull/5770
- Open WebUI scope discussion:
  https://github.com/open-webui/docs/discussions/1364

## Calculation record

- All-time jobs: \`${calculation(totals.total)} = ${formatInteger(allJobs)}\`.
- Current day-window jobs: \`${calculation(totals.day)} = ${formatInteger(dayJobs)}\`.
- Agreement display: \`${validators.agreement_rate}\`, rounded to \`${percentage(validators.agreement_rate)}\`.
- Charging mode: \`${chargingMode}\`; global charging: \`${chargingGlobal}\`.
- Public incident-history availability: \`${incidentHistoryAvailable}\`.

This is a point-in-time operational and ledger snapshot. It is not an uptime
promise, a paid-demand claim, proof of operator independence, or evidence of
upstream adoption.
`;
}

export async function generateWeeklyProof(options = {}) {
  const baseUrl = normalizedBaseUrl(options.baseUrl || DEFAULT_BASE_URL);
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const [network, totals, payouts] = await Promise.all([
    requestJson(baseUrl, "/v1/status/network", timeoutMs),
    requestJson(baseUrl, "/v1/stats/totals", timeoutMs),
    requestJson(baseUrl, "/v1/payouts/public", timeoutMs),
  ]);
  return renderWeeklyProof({ network, totals, payouts });
}
