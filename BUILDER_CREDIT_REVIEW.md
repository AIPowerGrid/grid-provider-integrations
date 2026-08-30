# Builder Credit Pilot Review

This is the maintainer runbook for the manually reviewed `$5-$20` builder
credit pilot. Public applications are tracked by the `builder-credits` label;
account linkage and grant administration remain private.

## Triage queue

List open applications without depending on title text:

```bash
gh issue list \
  --repo AIPowerGrid/grid-provider-integrations \
  --label builder-credits \
  --state open
```

Do not treat an unlabeled issue, direct message, or API-key request as an
application. Never ask an applicant to place a Grid account ID, credential,
wallet address, private log, or customer data in a public issue.

## Review contract

Approve only when all of these are true:

1. The issue links a public project or states a concrete new public artifact.
2. The deliverable exercises a documented Grid capability and another builder
   will be able to inspect or run it.
3. The requested `$5`, `$10`, or `$20` tier is proportionate to the bounded
   request plan.
4. The applicant acknowledges that community workers may inspect plaintext
   prompts and outputs.
5. The project does not depend on guaranteed uptime, confidential inference,
   token-price promotion, manufactured traffic, or an anonymous faucet.
6. The campaign budget, 60-day expiry, one-grant-per-account rule, and
   promotional-credit spend rail are active and verified before issuance.

An accepted application is still not a grant until the private account handoff
and administrative grant transaction succeed. When the spend rail is dark,
applications may be reviewed but must remain explicitly **awaiting funding**.

## Selection and private handoff

1. Comment publicly with the selected tier, deliverable, and 60-day deadline.
   Do not ask for an account identifier in the comment.
2. Send the approved applicant a private handoff directing them to authenticate
   to the Grid console and provide the one canonical account through the
   private maintainer channel.
3. Use only the audited Core promotional-credit administration path. Keep the
   campaign ID, grant ID, account ID, and operator evidence out of the public
   issue.
4. Confirm privately that `GET /v1/account/credits` shows the promotional
   balance and expiry on the selected account.
5. Comment publicly that the grant is active, naming only the tier and expiry
   date. Never publish a balance response or account identifier.

## Completion

Before closing an application as shipped:

1. Open the public artifact and follow its setup instructions.
2. Verify it uses a fixed documented Grid API origin, keeps credentials out of
   client bundles and source, bounds generation, and quotes paid work before
   dispatch when applicable.
3. Verify the project does not overclaim privacy, validator authority, n8n or
   upstream endorsement, or on-chain settlement.
4. Link the shipped artifact in the issue and close it with a concise factual
   result.

Expired, abandoned, or declined applications should be closed with the reason,
without exposing private account or usage information. Promotional credit is
service value only; never describe it as cash, reimbursement, tokens, or a
withdrawable award.
