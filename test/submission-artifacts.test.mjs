import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const readJson = async (path) => JSON.parse(await read(path));

test("ElizaOS registry draft follows the package release contract", async () => {
  const [entry, packageJson, workflow] = await Promise.all([
    readJson("elizaos-aipg/upstream-registry-entry.json"),
    readJson("elizaos-aipg/package.json"),
    read(".github/workflows/publish-packages.yml"),
  ]);

  assert.equal(entry.package, packageJson.name);
  assert.equal(entry.version, packageJson.version);
  assert.equal(
    entry.repository,
    "github:AIPowerGrid/grid-provider-integrations",
  );
  assert.equal(entry.directory, "elizaos-aipg");
  assert.equal(entry.kind, "plugin");
  assert.ok(packageJson.keywords.includes("elizaos"));
  assert.match(workflow, /plugin-aipg-v\$\(node -p/);
});

test("AI SDK submission draft targets the package and provenance workflow", async () => {
  const [packageJson, page, pullRequest, workflow] = await Promise.all([
    readJson("ai-sdk-aipg/package.json"),
    read("ai-sdk-aipg/upstream-provider.mdx"),
    read("ai-sdk-aipg/UPSTREAM_PR.md"),
    read(".github/workflows/publish-packages.yml"),
  ]);

  assert.equal(packageJson.name, "@aipowergrid/ai-sdk-provider");
  assert.match(page, new RegExp(packageJson.name.replace("/", "\\/")));
  assert.match(pullRequest, /55-aipg\.mdx/);
  assert.match(workflow, /ai-sdk-provider-v\$\(node -p/);
});

test("LangChain cookbook preserves the compatibility and trust boundaries", async () => {
  const page = await read("langchain-aipg/upstream-cookbook.mdx");

  assert.match(page, /https:\/\/api\.aipowergrid\.io\/v1/);
  assert.match(page, /use_responses_api=False/);
  assert.match(page, /remote community-operated workers/);
  assert.match(page, /inference\.submit/);
  assert.match(page, /account\.read/);
  assert.match(page, /model\.stream/);
  assert.match(page, /bind_tools/);
});

test("n8n Creator Portal draft stays aligned with the package and workflow", async () => {
  const [packageJson, submission, workflow] = await Promise.all([
    readJson("n8n-nodes-aipg/package.json"),
    read("n8n-nodes-aipg/CREATOR_PORTAL_SUBMISSION.md"),
    read(".github/workflows/publish-n8n.yml"),
  ]);

  assert.equal(packageJson.dependencies, undefined);
  assert.match(
    submission,
    new RegExp(`${packageJson.name}-v${packageJson.version}`),
  );
  assert.match(submission, /GitHub Actions with\s+provenance/);
  assert.match(workflow, /n8n-nodes-aipg-v\$\(node -p/);
});

test("Open WebUI draft requires upstream consent before a provider page", async () => {
  const pullRequest = await read("open-webui-aipg/UPSTREAM_PR.md");

  assert.match(pullRequest, /maintainer confirms/);
  assert.match(pullRequest, /anti-promotion contribution standard/);
  assert.match(pullRequest, /Do not open a\s+drive-by documentation PR/);
});
