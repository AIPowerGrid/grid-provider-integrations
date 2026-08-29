# Security Policy

## Report a vulnerability

Do not open a public issue for a vulnerability or exposed credential. Email
`admin@aipowergrid.io` with the affected package, version or commit, impact,
and a minimal reproduction. Do not include real API keys, private prompts,
account balances, or generated user content.

We will acknowledge a complete report as quickly as practical and coordinate
disclosure after a fix is available. This repository contains client-side
integrations; vulnerabilities in Grid Core, workers, or smart contracts should
still be reported through the same private channel.

## Scope

Security-sensitive areas include credential handling, request routing,
server-side request forgery, secret logging, scope enforcement, billing error
handling, unsafe retries, and claims that could cause users to send sensitive
data to community-operated workers without understanding the trust model.
