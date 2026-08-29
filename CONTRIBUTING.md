# Contributing

Contributions should use a framework's current official extension surface and
the documented AI Power Grid `/v1` API. Do not add Horde compatibility, embed
credentials, invent model support, or imply endorsement by an upstream
project.

Every integration change should cover:

- scoped server-side credential setup
- live model discovery where the framework permits it
- normal errors, including insufficient-credit behavior
- text streaming or an explicit explanation when the host cannot relay it
- accurate modality boundaries
- community-worker privacy disclosure
- deterministic mock or contract tests

Run `npm run verify` from the repository root before opening a pull request.
Credentialed production checks spend credits and must be explicitly enabled;
never place their key in a test fixture, command argument, log, or report.
