import assert from "node:assert/strict";
import test from "node:test";

import { verifyRevokedKey } from "../scripts/verify-revoked-key.mjs";

test("revocation proof uses only the fixed authenticated account endpoint", async () => {
  let request;
  const fetchImpl = async (url, init) => {
    request = { url, init };
    return { status: 401 };
  };

  assert.equal(
    await verifyRevokedKey({ apiKey: "grid_disposable", fetchImpl }),
    true,
  );
  assert.equal(
    request.url,
    "https://api.aipowergrid.io/v1/account/credits",
  );
  assert.equal(request.init.redirect, "error");
  assert.equal(request.init.headers.Authorization, "Bearer grid_disposable");
});

test("revocation proof fails closed on every status except 401", async () => {
  for (const status of [200, 400, 403, 404, 429, 500]) {
    await assert.rejects(
      verifyRevokedKey({
        apiKey: "grid_disposable",
        fetchImpl: async () => ({ status }),
      }),
      new RegExp(`HTTP ${status}`),
    );
  }
});

test("revocation proof requires an explicitly supplied key", async () => {
  await assert.rejects(
    verifyRevokedKey({ apiKey: "", fetchImpl: async () => ({ status: 401 }) }),
    /revoked disposable key/,
  );
});
