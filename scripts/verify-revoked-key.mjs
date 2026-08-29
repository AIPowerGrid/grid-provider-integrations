import process from "node:process";
import { pathToFileURL } from "node:url";

const REVOCATION_PROBE_URL =
  "https://api.aipowergrid.io/v1/account/credits";

export async function verifyRevokedKey({
  apiKey = process.env.AIPG_API_KEY?.trim(),
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!apiKey) {
    throw new Error("AIPG_API_KEY must contain the revoked disposable key");
  }

  const response = await fetchImpl(REVOCATION_PROBE_URL, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  if (response.status !== 401) {
    throw new Error(
      `revoked key remained usable or returned an ambiguous HTTP ${response.status}`,
    );
  }
  return true;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  verifyRevokedKey()
    .then(() => console.log("Revocation proof passed: the disposable key returns HTTP 401."))
    .catch((error) => {
      console.error(
        error instanceof Error ? error.message : "revocation proof failed",
      );
      process.exitCode = 1;
    });
}
