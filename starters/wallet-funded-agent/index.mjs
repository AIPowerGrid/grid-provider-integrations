#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import {
  GridStarterClient,
  assertAffordable,
  conservativeTokenEstimate,
  maxCostUsd,
  printJson,
  requireText,
  sha256,
  textContent,
} from "../lib/grid-client.mjs";

const HELP = `Usage: AGENT_TASK='...' node starters/wallet-funded-agent/index.mjs

Environment:
  AIPG_API_KEY          scoped Grid key (required)
  AGENT_TASK            bounded task (required)
  AGENT_STEPS           1-3, default: 2
  AIPG_MIN_BALANCE_USD  minimum balance before starting, default: 0.05
  AIPG_MAX_COST_USD     cumulative run ceiling, default: 0.02
  AIPG_TEXT_MODEL       default: auto`;

export async function runWalletFundedAgent({ environment = process.env, client } = {}) {
  if (environment.WALLET_PRIVATE_KEY || environment.PRIVATE_KEY) {
    throw new Error("Remove wallet private keys; this agent needs only AIPG_API_KEY");
  }
  const task = requireText(environment.AGENT_TASK, "AGENT_TASK", 3_000);
  const steps = Number(environment.AGENT_STEPS ?? 2);
  if (!Number.isInteger(steps) || steps < 1 || steps > 3) {
    throw new Error("AGENT_STEPS must be an integer from 1 to 3");
  }
  const minimumBalance = Number(environment.AIPG_MIN_BALANCE_USD ?? "0.05");
  if (!Number.isFinite(minimumBalance) || minimumBalance < 0 || minimumBalance > 100) {
    throw new Error("AIPG_MIN_BALANCE_USD must be from 0 to 100");
  }
  const budget = maxCostUsd(environment);
  const model = environment.AIPG_TEXT_MODEL || "auto";
  const api = client ?? new GridStarterClient();
  const credits = await api.credits();
  const spendable = Number(credits.total_spendable_usd ?? 0);
  if (!Number.isFinite(spendable) || spendable < minimumBalance) {
    throw new Error(
      `Spendable balance must be at least $${minimumBalance.toFixed(2)}. Fund the account at https://console.aipowergrid.io/dashboard/funding`,
    );
  }

  const transcript = [];
  let reservedBudget = 0;
  for (let step = 1; step <= steps; step += 1) {
    const context = transcript.length ? `\nPrevious work:\n${transcript.at(-1)}` : "";
    const prompt = [
      `Task: ${task}`,
      `This is planning step ${step} of at most ${steps}.${context}`,
      step === steps
        ? "Return the final answer. Begin with FINAL:."
        : "Improve the plan. If the task is already complete begin with FINAL:, otherwise begin with NEXT:.",
    ].join("\n");
    const quote = await api.quote({
      model,
      modality: "text",
      prompt_tokens: conservativeTokenEstimate(
        "You are a bounded autonomous planning agent. Do not make network calls, sign transactions, or claim an external action succeeded. Produce concise work a caller can inspect.",
        prompt,
      ),
      max_tokens: 512,
      n: 1,
    });
    const affordable = assertAffordable({ quote, credits: quote, maximumUsd: budget });
    if (reservedBudget + affordable.costUsd > budget) {
      throw new Error(`The next step would exceed the $${budget.toFixed(2)} cumulative run limit`);
    }
    reservedBudget += affordable.costUsd;
    const response = await api.text({
      model,
      system: "You are a bounded autonomous planning agent. Do not make network calls, sign transactions, or claim an external action succeeded. Produce concise work a caller can inspect.",
      prompt,
      maxTokens: 512,
      temperature: 0.3,
    });
    const output = textContent(response);
    transcript.push(output);
    if (/^FINAL:/i.test(output)) break;
  }

  return {
    taskHash: sha256(task),
    stepsCompleted: transcript.length,
    maximumQuotedCostUsd: reservedBudget,
    result: transcript.at(-1),
    funding: {
      source: "Grid universal service credits",
      walletPrivateKeyUsed: false,
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    process.stdout.write(`${HELP}\n`);
  } else {
    runWalletFundedAgent()
      .then((result) => printJson(result))
      .catch((error) => {
        process.stderr.write(`${error.message}\n`);
        process.exitCode = 1;
      });
  }
}
