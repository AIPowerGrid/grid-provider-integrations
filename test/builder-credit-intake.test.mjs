// SPDX-FileCopyrightText: 2026 AI Power Grid
// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const TEMPLATE = new URL(
  "../.github/ISSUE_TEMPLATE/builder-credits.yml",
  import.meta.url,
);

test("builder-credit intake stays bounded and collects no account secrets", async () => {
  const form = await readFile(TEMPLATE, "utf8");

  for (const contract of [
    "$5 - prototype or compatibility proof",
    "$10 - public integration or reusable example",
    "$20 - working public demo with documented setup",
    "expire 60 days after issuance",
    "one grant per account and campaign",
    "project_url",
    "required: true",
  ]) {
    assert.match(form, new RegExp(contract.replaceAll("$", "\\$"), "i"));
  }

  assert.doesNotMatch(
    form,
    /^\s+id:\s*(?:account|account_id|api_key|token|private_key|seed_phrase|wallet)\s*$/im,
  );
  assert.match(form, /Do not include API keys[\s\S]*Grid account ID/i);
  assert.match(form, /submitting this issue does not guarantee a grant/i);
});

