/** Runtime-setting helpers kept separate from transport and action logic. */

import type { IAgentRuntime } from "@elizaos/core";
import { AipgClient } from "./client.js";

export const AIPG_API_KEY_SETTING = "AIPG_API_KEY";

export function setting(runtime: IAgentRuntime, name: string): string | undefined {
  const value = runtime.getSetting(name);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function apiKey(runtime: IAgentRuntime): string | undefined {
  return setting(runtime, AIPG_API_KEY_SETTING) ?? process.env.AIPG_API_KEY?.trim() ?? undefined;
}

export function clientFor(runtime: IAgentRuntime): AipgClient {
  const key = apiKey(runtime);
  if (!key) {
    throw new Error(
      "AIPG_API_KEY is required. Create a scoped key in the AI Power Grid developer console.",
    );
  }
  return new AipgClient({ apiKey: key, fetch: runtime.fetch ?? undefined });
}
