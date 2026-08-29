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
  assert.match(workflow, /registry-url: https:\/\/registry\.npmjs\.org/);
});

test("AI SDK submission draft targets the package and live modality contract", async () => {
  const [packageJson, page, readme, pullRequest, workflow] = await Promise.all([
    readJson("ai-sdk-aipg/package.json"),
    read("ai-sdk-aipg/upstream-provider.mdx"),
    read("ai-sdk-aipg/README.md"),
    read("ai-sdk-aipg/UPSTREAM_PR.md"),
    read(".github/workflows/publish-packages.yml"),
  ]);

  assert.equal(packageJson.name, "@aipowergrid/ai-sdk-provider");
  assert.match(page, new RegExp(packageJson.name.replace("/", "\\/")));
  assert.match(page, /videoModel\('LTX Director 2\.0'\)/);
  assert.match(readme, /videoModel\("LTX Director 2\.0"\)/);
  assert.match(page, /`LTX-2\.3` require one inline start frame/);
  assert.match(readme, /`LTX-2\.3` require one inline start-frame file/);
  assert.match(pullRequest, /55-aipg\.mdx/);
  assert.match(workflow, /ai-sdk-provider-v\$\(node -p/);
  assert.match(workflow, /cancel-in-progress: false/);
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
  assert.match(workflow, /registry-url: https:\/\/registry\.npmjs\.org/);
  assert.match(workflow, /cancel-in-progress: false/);
});

test("Open WebUI draft requires upstream consent before a provider page", async () => {
  const [pullRequest, query] = await Promise.all([
    read("open-webui-aipg/UPSTREAM_PR.md"),
    read("open-webui-aipg/MAINTAINER_QUERY.md"),
  ]);

  assert.match(pullRequest, /maintainer confirms/);
  assert.match(pullRequest, /anti-promotion contribution standard/);
  assert.match(pullRequest, /Do not open a\s+drive-by documentation PR/);
  assert.match(query, /standard OpenAI connection/);
  assert.match(query, /remote\s+community-operated workers/);
  assert.match(query, /should it remain in our\s+own documentation/);
  assert.match(query, /open-webui\/docs\/discussions\/1364/);
  assert.doesNotMatch(query, /partner(ship)?|endorse(ment)?/i);
});

test("Dify package workflow is provenance-only and supply-chain pinned", async () => {
  const [workflow, manifest, submission] = await Promise.all([
    read(".github/workflows/package-dify.yml"),
    read("dify-aipg/manifest.yaml"),
    read("dify-aipg/MARKETPLACE_SUBMISSION.md"),
  ]);

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /DIFY_CLI_VERSION: "0\.6\.10"/);
  assert.match(
    workflow,
    /DIFY_CLI_SHA256: "0cef74bcae375a4337c2ff7d42e4787717981a795e1c23cf56bb27ec07ec8304"/,
  );
  assert.match(
    workflow,
    /YQ_SHA256: "638c4b251c49201fc94b598834b715f8f1c6e9b1854d2820772d2c79f0289002"/,
  );
  assert.match(
    workflow,
    /MARKETPLACE_TOOLKIT_COMMIT: "57a21d1304b1108df3e6b90a15a4f5dd9f0915f9"/,
  );
  assert.match(workflow, /validate-difypkg\.py/);
  assert.match(workflow, /Blocking failures: 0/);
  assert.match(workflow, /actions\/upload-artifact@ea165f8d/);
  assert.match(manifest, /version: 0\.1\.0/);
  assert.match(submission, /credentialed Dify Community Edition and Dify Cloud/i);
  assert.doesNotMatch(workflow, /id-token: write|secrets\.|npm publish|marketplace.*upload/i);
});

test("GitHub workflows pin every third-party action by commit", async () => {
  const paths = [
    ".github/workflows/ci.yml",
    ".github/workflows/package-dify.yml",
    ".github/workflows/publish-n8n.yml",
    ".github/workflows/publish-packages.yml",
  ];

  for (const path of paths) {
    const workflow = await read(path);
    const actionReferences = [...workflow.matchAll(/uses:\s*([^\s#]+)/g)].map((match) => match[1]);
    assert.ok(actionReferences.length > 0, `${path} contains no action references`);
    for (const reference of actionReferences) {
      assert.match(reference, /@[0-9a-f]{40}$/, `${path} has an unpinned action: ${reference}`);
    }
  }
});
