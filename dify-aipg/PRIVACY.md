# Privacy Notice

Last updated: August 28, 2026

## Data sent to AI Power Grid

This plugin sends the configured API key and the Dify model request to the
fixed AI Power Grid API at `https://api.aipowergrid.io`. A model request can
include prompts, conversation history, system instructions, tool definitions,
tool results, generation parameters, and an optional user identifier supplied
by the calling Dify application.

The Grid coordinator routes inference to a worker capable of serving the
selected model. Workers may be operated by independent community participants.
Accordingly, this service must not be treated as private or confidential
inference unless the selected service tier explicitly states otherwise.

## Storage and operational data

The plugin does not create its own database or independently persist request
content. Dify controls its own application and conversation storage. AI Power
Grid processes request content to provide inference and may retain bounded
operational, accounting, abuse-prevention, and cryptographic commitment data
needed to run and verify the service. Worker operators receive the request data
required to perform the assigned inference job.

## Credentials

Dify stores the API key as a secret provider credential and sends it only to
the fixed Grid API. The plugin does not print the key or include upstream
response bodies in credential-validation errors. Users should issue a distinct
key with only `account.read` and `inference.submit` scopes and revoke it when it
is no longer needed.

## Third parties

This plugin does not fetch user-selected URLs, execute code, or send data to an
advertising or analytics service. Network processing involves Dify, AI Power
Grid infrastructure, and the community worker selected for the request.

## Contact

Questions and security reports can be submitted through
[aipowergrid.io](https://aipowergrid.io/) and the security process in the
public AIPG repositories.
