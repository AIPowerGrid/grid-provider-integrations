import { randomUUID } from "node:crypto";
import {
  AgentRuntime,
  type Character,
  type IAgentRuntime,
  type IDatabaseAdapter,
  type Plugin,
  type RuntimeSettings,
  type UUID,
} from "@elizaos/core";

function id(): UUID {
  return randomUUID() as UUID;
}

export async function createRuntime(options: {
  fetch?: typeof globalThis.fetch;
  plugins: Plugin[];
  settings?: RuntimeSettings;
}): Promise<IAgentRuntime> {
  const agentId = id();
  const character: Character = {
    id: agentId,
    name: "AIPG integration test",
    bio: ["Exercises a provider through the real ElizaOS runtime."],
    system: "Return concise test responses.",
    templates: {},
    plugins: [],
    knowledge: [],
    secrets: {},
    settings: {},
    messageExamples: [],
    postExamples: [],
    topics: ["provider testing"],
    adjectives: ["concise"],
    style: { all: [], chat: [], post: [] },
  };
  const runtime = new AgentRuntime({
    agentId,
    character,
    adapter: { log: async () => {} } as unknown as IDatabaseAdapter,
    fetch: options.fetch,
    settings: options.settings,
  });
  for (const plugin of options.plugins) await runtime.registerPlugin(plugin);
  return runtime;
}
