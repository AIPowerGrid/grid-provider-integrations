import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const API_BASE = "https://api.aipowergrid.io/v1";
export const HARD_SPEND_CAP_MICRO = 30_000;

export const LIVE_WORKLOADS = Object.freeze([
  {
    id: "dify-text",
    model: "Smollm-135m",
    modality: "text",
    prompt_tokens: 2_048,
    max_tokens: 8,
  },
  {
    id: "ai-sdk-text",
    model: "Smollm-135m",
    modality: "text",
    prompt_tokens: 2_048,
    max_tokens: 8,
  },
  {
    id: "eliza-text",
    model: "gpt-oss-120b",
    modality: "text",
    prompt_tokens: 4_096,
    max_tokens: 256,
  },
  {
    id: "langchain-invoke",
    model: "gpt-oss-120b",
    modality: "text",
    prompt_tokens: 4_096,
    max_tokens: 256,
  },
  {
    id: "langchain-stream",
    model: "gpt-oss-120b",
    modality: "text",
    prompt_tokens: 4_096,
    max_tokens: 256,
  },
  {
    id: "langchain-tool",
    model: "gpt-oss-120b",
    modality: "text",
    prompt_tokens: 4_096,
    max_tokens: 256,
  },
]);

const COMMANDS = Object.freeze([
  {
    label: "Dify",
    command: "uv",
    args: ["run", "pytest", "-q", "tests/test_live_e2e.py"],
    cwd: "dify-aipg",
  },
  {
    label: "AI SDK",
    command: "npm",
    args: ["run", "test:e2e:live"],
    cwd: "ai-sdk-aipg",
  },
  {
    label: "ElizaOS",
    command: "bun",
    args: ["run", "test:e2e:live"],
    cwd: "elizaos-aipg",
  },
  {
    label: "LangChain",
    command: "uv",
    args: ["run", "pytest", "-q", "tests/test_live_e2e.py"],
    cwd: "langchain-aipg",
  },
]);

function boundedCapMicro(raw = "0.03") {
  const usd = Number(raw);
  if (!Number.isFinite(usd) || usd <= 0)
    throw new Error("AIPG_E2E_MAX_SPEND_USD must be positive");
  const micro = Math.floor(usd * 1_000_000);
  if (micro > HARD_SPEND_CAP_MICRO)
    throw new Error("live release gate cannot exceed its $0.03 hard cap");
  return micro;
}

async function apiJson(apiKey, path, init = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(init.body === undefined
        ? {}
        : { "Content-Type": "application/json" }),
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok)
    throw new Error(`Grid preflight returned HTTP ${response.status}`);
  return response.json();
}

export function validateQuoteResults(results, capMicro) {
  let quotedMicro = 0;
  for (const { id, payload } of results) {
    const estimate = payload?.estimate;
    if (!estimate?.priced) throw new Error(`${id} is not priced`);
    if (payload?.charging_enabled !== true)
      throw new Error(`${id} is outside the charging rollout`);
    if (estimate.balance_sufficient !== true)
      throw new Error(`${id} does not have sufficient credit`);
    if (!Number.isSafeInteger(estimate.cost_micro) || estimate.cost_micro < 0) {
      throw new Error(`${id} returned an invalid quote`);
    }
    quotedMicro += estimate.cost_micro;
  }
  if (quotedMicro <= 0)
    throw new Error("live release gate quoted no billable work");
  if (quotedMicro > capMicro)
    throw new Error("quoted release gate exceeds the approved spend cap");
  return quotedMicro;
}

export function quoteRequest(workload) {
  const { id: _id, ...request } = workload;
  return request;
}

function runCommand(spec, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(spec.command, spec.args, {
      cwd: new URL(`../${spec.cwd}/`, import.meta.url),
      env,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(
            `${spec.label} live E2E failed (${signal ?? `exit ${code}`})`,
          ),
        );
    });
  });
}

export async function runLiveReleaseGate() {
  if (process.env.AIPG_LIVE_E2E !== "1") {
    throw new Error(
      "set AIPG_LIVE_E2E=1 to authorize the production release gate",
    );
  }
  const apiKey = process.env.AIPG_API_KEY?.trim();
  if (!apiKey)
    throw new Error("AIPG_API_KEY must contain a disposable scoped key");
  const capMicro = boundedCapMicro(process.env.AIPG_E2E_MAX_SPEND_USD);
  const before = await apiJson(apiKey, "/account/credits");
  if (!Number.isSafeInteger(before?.total_spendable_micro)) {
    throw new Error("Grid returned an invalid credit summary");
  }

  const quotes = [];
  for (const workload of LIVE_WORKLOADS) {
    const payload = await apiJson(apiKey, "/account/credits/quote", {
      method: "POST",
      body: JSON.stringify(quoteRequest(workload)),
    });
    quotes.push({ id: workload.id, payload });
  }
  const quotedMicro = validateQuoteResults(quotes, capMicro);
  console.log(
    `Preflight passed: ${LIVE_WORKLOADS.length} bounded workloads fit the hard $0.03 cap.`,
  );

  const childEnv = {
    ...process.env,
    AIPG_LIVE_E2E: "1",
    AIPG_API_KEY: apiKey,
    AIPG_E2E_SMALL_MODEL: "Smollm-135m",
    AIPG_E2E_ELIZA_MODEL: "gpt-oss-120b",
    AIPG_E2E_TOOL_MODEL: "gpt-oss-120b",
    UV_CACHE_DIR:
      process.env.UV_CACHE_DIR ||
      join(tmpdir(), "aipg-provider-integrations-uv"),
  };
  for (const command of COMMANDS) {
    await runCommand(command, childEnv);
    console.log(`${command.label}: passed`);
  }

  const after = await apiJson(apiKey, "/account/credits");
  if (!Number.isSafeInteger(after?.total_spendable_micro)) {
    throw new Error("Grid returned an invalid post-run credit summary");
  }
  const spentMicro = before.total_spendable_micro - after.total_spendable_micro;
  if (spentMicro <= 0)
    throw new Error("live E2E completed without observable credit consumption");
  if (spentMicro > quotedMicro || spentMicro > capMicro) {
    throw new Error("live E2E credit consumption exceeded its preflight bound");
  }
  console.log(
    "Billing proof passed: spend moved and remained inside the preflight bound.",
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runLiveReleaseGate().catch((error) => {
    console.error(
      error instanceof Error ? error.message : "live release gate failed",
    );
    process.exitCode = 1;
  });
}
