#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import {
  GridStarterClient,
  conservativeTokenEstimate,
  maxCostUsd,
  preflight,
  printJson,
  requireText,
  sha256,
  textContent,
} from "../lib/grid-client.mjs";

const HELP = `Usage: node starters/onchain-game-npc/index.mjs "PLAYER ACTION"

Environment:
  AIPG_API_KEY       scoped Grid key (required)
  AIPG_TEXT_MODEL    default: auto
  AIPG_MAX_COST_USD  hard request ceiling, default: 0.02
  NPC_NAME           default: Mara the bridge keeper
  NPC_WORLD          short world context
  NPC_MAX_TOKENS     64-800, default: 320`;

export async function runNpc({ action, environment = process.env, client } = {}) {
  const playerAction = requireText(action, "player action", 2_000);
  const npcName = requireText(environment.NPC_NAME ?? "Mara the bridge keeper", "NPC_NAME", 120);
  const world = requireText(
    environment.NPC_WORLD ?? "A low-magic frontier whose player-owned settlements persist on Base.",
    "NPC_WORLD",
    1_000,
  );
  const model = environment.AIPG_TEXT_MODEL || "auto";
  const maxTokens = Number(environment.NPC_MAX_TOKENS ?? 320);
  if (!Number.isInteger(maxTokens) || maxTokens < 64 || maxTokens > 800) {
    throw new Error("NPC_MAX_TOKENS must be an integer from 64 to 800");
  }
  const api = client ?? new GridStarterClient();
  const system = [
    `You are ${npcName}, an NPC in this world: ${world}`,
    "Stay in character. Respect the supplied facts. Never invent an on-chain transaction or claim it succeeded.",
    "Reply in at most 120 words with dialogue followed by one short ACTION: line for the game server.",
  ].join("\n");
  const promptTokens = conservativeTokenEstimate(system, `Player action: ${playerAction}`);
  const price = await preflight(api, {
    model,
    modality: "text",
    prompt_tokens: promptTokens,
    max_tokens: maxTokens,
    n: 1,
  }, maxCostUsd(environment));
  const response = await api.text({
    model,
    system,
    prompt: `Player action: ${playerAction}`,
    maxTokens,
    temperature: 0.65,
  });
  const dialogue = textContent(response);
  const receipt = {
    kind: "aipg.application-receipt.v1",
    model: response.model ?? model,
    createdAt: new Date().toISOString(),
    inputHash: sha256(playerAction),
    outputHash: sha256(dialogue),
    gridProvenance: response.grid ?? null,
    onchainAnchorVerified: false,
  };
  return {
    npc: npcName,
    dialogue,
    quotedCostUsd: price.costUsd,
    chargingEnabled: price.chargingEnabled,
    receipt,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    process.stdout.write(`${HELP}\n`);
  } else {
    runNpc({ action: process.argv.slice(2).join(" ") })
      .then((result) => printJson(result))
      .catch((error) => {
        process.stderr.write(`${error.message}\n`);
        process.exitCode = 1;
      });
  }
}
