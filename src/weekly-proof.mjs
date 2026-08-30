import { Buffer } from "node:buffer";

const DEFAULT_BASE_URL = "https://api.aipowergrid.io";
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_NPM_REGISTRY_URL = "https://registry.npmjs.org";
const DEFAULT_GITHUB_API_URL = "https://api.github.com";
const RELEASED_PACKAGES = [
  {
    label: "Vercel AI SDK",
    name: "@aipowergrid/ai-sdk-provider",
    version: "0.1.0",
    repository: "AIPowerGrid/grid-provider-integrations",
    tag: "ai-sdk-provider-v0.1.0",
    workflow: ".github/workflows/publish-packages.yml",
  },
  {
    label: "ElizaOS",
    name: "@aipowergrid/plugin-aipg",
    version: "0.1.0",
    repository: "AIPowerGrid/grid-provider-integrations",
    tag: "plugin-aipg-v0.1.0",
    workflow: ".github/workflows/publish-packages.yml",
  },
  {
    label: "n8n",
    name: "@aipowergrid/n8n-nodes-aipg",
    version: "0.1.3",
    repository: "AIPowerGrid/n8n-nodes-aipg",
    tag: "n8n-nodes-aipg-v0.1.3",
    workflow: ".github/workflows/publish.yml",
  },
  {
    label: "MCP/CLI",
    name: "@aipowergrid/mcp",
    version: "0.2.0",
    repository: "AIPowerGrid/grid-skill",
    tag: "mcp-v0.2.0",
    workflow: ".github/workflows/publish.yml",
  },
];

const UPSTREAM_PULL_REQUESTS = [
  { label: "LiteLLM", repository: "BerriAI/litellm", number: 38725 },
  {
    label: "Dify marketplace",
    repository: "langgenius/dify-plugins",
    number: 2986,
  },
  { label: "Vercel AI SDK", repository: "vercel/ai", number: 20003 },
  { label: "ElizaOS registry", repository: "elizaOS/eliza", number: 29964 },
  { label: "LangChain docs", repository: "langchain-ai/docs", number: 5770 },
];

function assertion(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizedBaseUrl(value) {
  const url = new URL(value || DEFAULT_BASE_URL);
  if (
    url.protocol !== "https:" &&
    !["localhost", "127.0.0.1", "::1"].includes(url.hostname)
  ) {
    throw new Error(
      "Proof snapshots must use HTTPS unless they are loopback-local.",
    );
  }
  url.pathname = url.pathname.replace(/\/$/, "");
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function finiteNonNegative(value, name) {
  assertion(
    typeof value === "number" && Number.isFinite(value) && value >= 0,
    `${name} must be non-negative`,
  );
  return value;
}

function integerNonNegative(value, name) {
  assertion(
    Number.isInteger(value) && value >= 0,
    `${name} must be a non-negative integer`,
  );
  return value;
}

function jobTotal(bucket, name) {
  assertion(
    bucket && typeof bucket === "object" && !Array.isArray(bucket),
    `${name} must be an object`,
  );
  return Object.entries(bucket).reduce(
    (total, [modality, value]) =>
      total + integerNonNegative(value?.jobs, `${name}.${modality}.jobs`),
    0,
  );
}

function formatInteger(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    value,
  );
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

function boundedPost(copy, index) {
  const post = copy.trim();
  assertion(
    [...post].length <= 280,
    `weekly proof post ${index} exceeds 280 characters`,
  );
  return post;
}

function calculation(bucket) {
  return Object.entries(bucket)
    .map(([modality, value]) => `${formatInteger(value.jobs)} ${modality}`)
    .join(" + ");
}

async function requestJson(baseUrl, endpoint, timeoutMs, extraHeaders = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: { Accept: "application/json", ...extraHeaders },
      redirect: "error",
      signal: controller.signal,
    });
    assertion(
      response.status === 200,
      `${endpoint} returned HTTP ${response.status}`,
    );
    assertion(
      (response.headers.get("content-type") || "").includes("application/json"),
      `${endpoint} did not return JSON`,
    );
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function decodeProvenancePayload(attestations, expected) {
  const attestation = attestations?.attestations?.find(
    (item) => item?.predicateType === "https://slsa.dev/provenance/v1",
  );
  assertion(attestation, `npm SLSA attestation is missing for ${expected.name}`);
  const envelope = attestation.bundle?.dsseEnvelope;
  assertion(
    envelope?.payloadType === "application/vnd.in-toto+json" &&
      typeof envelope?.payload === "string" &&
      Array.isArray(envelope?.signatures) &&
      envelope.signatures.some((item) => typeof item?.sig === "string" && item.sig),
    `npm SLSA envelope is invalid for ${expected.name}`,
  );
  assertion(
    Array.isArray(attestation.bundle?.verificationMaterial?.tlogEntries) &&
      attestation.bundle.verificationMaterial.tlogEntries.length > 0,
    `npm transparency-log evidence is missing for ${expected.name}`,
  );
  try {
    return JSON.parse(Buffer.from(envelope.payload, "base64").toString("utf8"));
  } catch {
    throw new Error(`npm SLSA payload is invalid for ${expected.name}`);
  }
}

function verifiedPackageEvidence(document, attestations, expected) {
  assertion(
    document?.name === expected.name,
    `npm package name mismatch for ${expected.name}`,
  );
  assertion(
    document?.version === expected.version,
    `npm package version mismatch for ${expected.name}`,
  );
  assertion(
    typeof document?.dist?.integrity === "string" &&
      document.dist.integrity.startsWith("sha512-"),
    `npm integrity is missing for ${expected.name}`,
  );
  assertion(
    document?.dist?.attestations?.provenance?.predicateType ===
      "https://slsa.dev/provenance/v1",
    `npm provenance is missing for ${expected.name}`,
  );
  assertion(
    String(document?.repository?.url || "").includes(expected.repository),
    `npm repository mismatch for ${expected.name}`,
  );
  const provenance = decodeProvenancePayload(attestations, expected);
  const integrityDigest = Buffer.from(
    document.dist.integrity.slice("sha512-".length),
    "base64",
  ).toString("hex");
  const expectedSubject = `pkg:npm/${expected.name.replace("@", "%40")}@${expected.version}`;
  assertion(
    provenance?.subject?.some(
      (item) =>
        item?.name === expectedSubject && item?.digest?.sha512 === integrityDigest,
    ),
    `npm provenance subject or digest mismatch for ${expected.name}`,
  );
  assertion(
    provenance?.predicateType === "https://slsa.dev/provenance/v1",
    `npm provenance predicate mismatch for ${expected.name}`,
  );
  const build = provenance?.predicate?.buildDefinition;
  const workflow = build?.externalParameters?.workflow;
  assertion(
    build?.buildType ===
      "https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1" &&
      workflow?.repository === `https://github.com/${expected.repository}` &&
      workflow?.ref === `refs/tags/${expected.tag}` &&
      workflow?.path === expected.workflow &&
      build?.internalParameters?.github?.event_name === "push",
    `npm provenance workflow mismatch for ${expected.name}`,
  );
  assertion(
    build?.resolvedDependencies?.some(
      (item) =>
        item?.uri ===
          `git+https://github.com/${expected.repository}@refs/tags/${expected.tag}` &&
        /^[0-9a-f]{40}$/.test(item?.digest?.gitCommit || ""),
    ),
    `npm provenance source revision mismatch for ${expected.name}`,
  );
  assertion(
    provenance?.predicate?.runDetails?.builder?.id ===
      "https://github.com/actions/runner/github-hosted",
    `npm provenance builder mismatch for ${expected.name}`,
  );
  return {
    ...expected,
    npmUrl: `https://www.npmjs.com/package/${expected.name}`,
    provenance: true,
  };
}

function verifiedPullRequestEvidence(document, expected) {
  assertion(
    document?.number === expected.number,
    `pull request number mismatch for ${expected.label}`,
  );
  assertion(
    document?.base?.repo?.full_name === expected.repository,
    `pull request repository mismatch for ${expected.label}`,
  );
  assertion(
    document?.state === "open" || document?.state === "closed",
    `pull request state is invalid for ${expected.label}`,
  );
  assertion(
    document?.html_url ===
      `https://github.com/${expected.repository}/pull/${expected.number}`,
    `pull request URL mismatch for ${expected.label}`,
  );
  return {
    ...expected,
    url: document.html_url,
    state: document.state,
    mergedAt: document.merged_at || null,
  };
}

function pullRequestState(item) {
  if (item.mergedAt) return "merged";
  return item.state === "open" ? "open" : "closed without merge";
}

function validateDistributionEvidence(distribution) {
  assertion(
    distribution && typeof distribution === "object",
    "distribution evidence is missing",
  );
  assertion(
    Array.isArray(distribution.packages) &&
      distribution.packages.length === RELEASED_PACKAGES.length,
    "published package evidence is incomplete",
  );
  assertion(
    Array.isArray(distribution.pullRequests) &&
      distribution.pullRequests.length === UPSTREAM_PULL_REQUESTS.length,
    "upstream pull request evidence is incomplete",
  );
  for (const expected of RELEASED_PACKAGES) {
    const item = distribution.packages.find(
      (candidate) => candidate.name === expected.name,
    );
    assertion(
      item?.version === expected.version,
      `published package evidence drifted for ${expected.name}`,
    );
    assertion(
      item?.provenance === true,
      `published package lacks provenance for ${expected.name}`,
    );
  }
  for (const expected of UPSTREAM_PULL_REQUESTS) {
    const item = distribution.pullRequests.find(
      (candidate) =>
        candidate.repository === expected.repository &&
        candidate.number === expected.number,
    );
    assertion(
      item,
      `upstream pull request evidence is missing for ${expected.label}`,
    );
    assertion(
      item.state === "open" || item.state === "closed",
      `upstream pull request state is invalid for ${expected.label}`,
    );
  }
}

export function renderWeeklyProof({ network, totals, payouts, distribution }) {
  assertion(
    network?.schema === "aipg.network.status.v1",
    "unsupported network status schema",
  );
  const generatedAt = new Date(network.generated_at);
  assertion(
    !Number.isNaN(generatedAt.valueOf()),
    "network.generated_at is invalid",
  );
  assertion(
    network.capacity && network.validators && network.charging,
    "network status is incomplete",
  );
  assertion(totals?.day && totals?.total, "job totals are incomplete");
  assertion(payouts?.totals, "payout totals are incomplete");
  validateDistributionEvidence(distribution);

  const dayJobs = jobTotal(totals.day, "totals.day");
  const allJobs = jobTotal(totals.total, "totals.total");
  const workersOnline = integerNonNegative(
    network.capacity.workers_online,
    "capacity.workers_online",
  );
  const modelsOnline = integerNonNegative(
    network.capacity.models_online,
    "capacity.models_online",
  );
  const redundancyTarget = integerNonNegative(
    network.capacity.redundancy_target,
    "capacity.redundancy_target",
  );
  const belowTarget = network.capacity.models_below_target;
  assertion(
    Array.isArray(belowTarget),
    "capacity.models_below_target must be an array",
  );
  assertion(
    belowTarget.length <= modelsOnline,
    "models below target exceeds models online",
  );

  const validators = network.validators;
  const participating = integerNonNegative(
    validators.participating,
    "validators.participating",
  );
  const completed = integerNonNegative(
    validators.assignments_completed,
    "validators.assignments_completed",
  );
  const verifiedIndependent = integerNonNegative(
    validators.verified_independent,
    "validators.verified_independent",
  );
  assertion(
    verifiedIndependent <= participating,
    "verified validators exceeds participating validators",
  );
  assertion(
    validators.economic_effect === "none",
    "weekly copy must be reviewed before validators gain economic effect",
  );

  const payoutTotals = payouts.totals;
  const aipgPaid = finiteNonNegative(
    payoutTotals.aipg_paid,
    "payouts.totals.aipg_paid",
  );
  const payoutCount = integerNonNegative(
    payoutTotals.payouts,
    "payouts.totals.payouts",
  );
  const workersPaid = integerNonNegative(
    payoutTotals.workers_paid,
    "payouts.totals.workers_paid",
  );
  const chargingMode = String(network.charging.mode || "unknown");
  const chargingGlobal = network.charging.global === true;
  const incidentHistoryAvailable = network.incident_history_available === true;
  const snapshotDate = generatedAt.toISOString().slice(0, 10);
  const snapshotTime = generatedAt.toISOString();
  const packageLabels = distribution.packages
    .map((item) => item.label)
    .join(", ");
  const pullRequestSummary = distribution.pullRequests
    .map((item) => `${item.label} ${pullRequestState(item)}`)
    .join("; ");
  const packageEvidence = distribution.packages
    .map(
      (item) =>
        `- npm ${item.name}@${item.version} with provenance: ${item.npmUrl}`,
    )
    .join("\n");
  const pullRequestEvidence = distribution.pullRequests
    .map(
      (item) => `- ${item.label} PR (${pullRequestState(item)}): ${item.url}`,
    )
    .join("\n");
  const displayDate = generatedAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const post1 = boundedPost(
    `AIPG proof snapshot, ${displayDate}:

${formatInteger(allJobs)} jobs recorded all time; ${formatInteger(dayJobs)} in the current 24h window. ${formatInteger(workersOnline)} workers are online across ${formatInteger(modelsOnline)} text, image, video, and audio routes.

Live status: https://api.aipowergrid.io/v1/status/network`,
    1,
  );
  const post2 = boundedPost(
    `Worker payouts: ${formatAipg(aipgPaid)} AIPG across ${formatInteger(payoutCount)} on-chain Base payouts to ${formatInteger(workersPaid)} payout addresses.

Verify the transactions: https://console.aipowergrid.io/transparency`,
    2,
  );
  const post3 = boundedPost(
    `Validator preview: ${formatInteger(participating)} participants, ${formatInteger(completed)} assignments, ${percentage(validators.agreement_rate)} agreement.

Limits: no economic authority; ${formatInteger(verifiedIndependent)} independently verified operators; ${formatInteger(belowTarget.length)}/${formatInteger(modelsOnline)} live routes below the ${formatInteger(redundancyTarget)}-worker redundancy target.

Run a worker or validator: https://aipowergrid.io/run`,
    3,
  );
  const post4 = boundedPost(
    `Distribution shipped: ${packageLabels} packages are public on npm with provenance.

Upstream reviews: ${pullRequestSummary}.

https://aipowergrid.io/docs/integrations`,
    4,
  );
  const post5 = boundedPost(
    `Metrics we will not fake: charging mode=${chargingMode}; global=${chargingGlobal}. The public API does not prove paid-request count, independent worker ownership, external builders, or historical uptime. Incident history available=${incidentHistoryAvailable}.`,
    5,
  );

  return `# AI Power Grid Weekly Proof Post - ${snapshotDate}

Snapshot captured at \`${snapshotTime}\` from the public Grid API.

## Thread copy

### Post 1

${post1}

### Post 2

${post2}

### Post 3

${post3}

### Post 4

${post4}

### Post 5

${post5}

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
${packageEvidence}
${pullRequestEvidence}
- Open WebUI scope discussion:
  https://github.com/open-webui/docs/discussions/1364

## Calculation record

- All-time jobs: \`${calculation(totals.total)} = ${formatInteger(allJobs)}\`.
- Current day-window jobs: \`${calculation(totals.day)} = ${formatInteger(dayJobs)}\`.
- Agreement display: \`${validators.agreement_rate}\`, rounded to \`${percentage(validators.agreement_rate)}\`.
- Charging mode: \`${chargingMode}\`; global charging: \`${chargingGlobal}\`.
- Public incident-history availability: \`${incidentHistoryAvailable}\`.
- Published package evidence: \`${distribution.packages
    .map((item) => `${item.name}@${item.version}`)
    .join(", ")}\`.
- Upstream pull-request states: \`${pullRequestSummary}\`.

This is a point-in-time operational and ledger snapshot. It is not an uptime
promise, a paid-demand claim, proof of operator independence, or evidence of
upstream adoption.
`;
}

export async function generateWeeklyProof(options = {}) {
  const baseUrl = normalizedBaseUrl(options.baseUrl || DEFAULT_BASE_URL);
  const npmRegistryUrl = normalizedBaseUrl(
    options.npmRegistryUrl || DEFAULT_NPM_REGISTRY_URL,
  );
  const githubApiUrl = normalizedBaseUrl(
    options.githubApiUrl || DEFAULT_GITHUB_API_URL,
  );
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const [
    network,
    totals,
    payouts,
    packageDocuments,
    packageAttestations,
    pullRequestDocuments,
  ] =
    await Promise.all([
      requestJson(baseUrl, "/v1/status/network", timeoutMs),
      requestJson(baseUrl, "/v1/stats/totals", timeoutMs),
      requestJson(baseUrl, "/v1/payouts/public", timeoutMs),
      Promise.all(
        RELEASED_PACKAGES.map((item) =>
          requestJson(
            npmRegistryUrl,
            `/${encodeURIComponent(item.name)}/${item.version}`,
            timeoutMs,
          ),
        ),
      ),
      Promise.all(
        RELEASED_PACKAGES.map((item) =>
          requestJson(
            npmRegistryUrl,
            `/-/npm/v1/attestations/${encodeURIComponent(item.name)}@${item.version}`,
            timeoutMs,
          ),
        ),
      ),
      Promise.all(
        UPSTREAM_PULL_REQUESTS.map((item) =>
          requestJson(
            githubApiUrl,
            `/repos/${item.repository}/pulls/${item.number}`,
            timeoutMs,
            {
              "User-Agent": "aipg-weekly-proof",
              "X-GitHub-Api-Version": "2022-11-28",
            },
          ),
        ),
      ),
    ]);
  const distribution = {
    packages: packageDocuments.map((document, index) =>
      verifiedPackageEvidence(
        document,
        packageAttestations[index],
        RELEASED_PACKAGES[index],
      ),
    ),
    pullRequests: pullRequestDocuments.map((document, index) =>
      verifiedPullRequestEvidence(document, UPSTREAM_PULL_REQUESTS[index]),
    ),
  };
  return renderWeeklyProof({ network, totals, payouts, distribution });
}
