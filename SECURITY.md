# Security Policy

## Supported code

Security fixes are applied to the main branch and, when tagged releases are published, to the latest supported release where practical. Older commits and forks are not guaranteed to receive fixes.

## Reporting a vulnerability

Do not disclose an exploitable vulnerability, API token, private Kobo asset detail, or beneficiary data in a public issue.

Preferred reporting path:

1. Use GitHub private vulnerability reporting from the repository Security tab when that feature is available.
2. If private reporting is unavailable, open a minimal public issue stating that you need a private security contact. Do not include exploit details or secrets.

The maintainer will assess scope, reproduce the issue where possible, coordinate a fix, and publish appropriate release/security notes after remediation.

## Security boundaries

The dashboard assumes:

- KOBO_API_TOKEN is stored only in the serverless deployment environment.
- The browser never receives the Kobo API token.
- Kobo upstream traffic uses HTTPS.
- Kobo server and media hosts are validated against explicit allowlists.
- ALLOWED_ORIGINS contains only trusted dashboard origins.
- Proxied responses use no-store caching.
- Raw beneficiary or personally identifiable data is not committed to the repository.

Current automated tests verify key proxy and frontend assumptions. Security-sensitive changes should extend those tests.

## If a secret is exposed

1. Revoke or rotate the exposed credential immediately.
2. Remove it from deployment configuration and source history where applicable.
3. Review access logs and Kobo account activity.
4. Replace the credential in the deployment environment.
5. Document the incident without republishing the secret.
