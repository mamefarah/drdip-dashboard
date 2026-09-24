# Contributing

Contributions that improve reliability, reuse, accessibility, security, field usability, or documentation are welcome.

## Before opening a pull request

1. Search existing issues and pull requests.
2. For a substantial change, open an issue describing the problem and intended programme or reuse case.
3. Branch from main.
4. Keep credentials, raw Kobo submissions, and personally identifiable field data out of commits.
5. Run:

~~~bash
npm test
~~~

## Pull request expectations

A pull request should:

- explain the problem and the proposed change;
- stay focused enough to review safely;
- describe any Kobo schema or environment-variable impact;
- include or update tests when behavior changes;
- update documentation when configuration, interpretation, or security assumptions change;
- avoid committing generated exports or private programme data.

## Review criteria

Maintainer review considers:

- correctness of data interpretation;
- Kobo credential and proxy security;
- regression risk;
- backward compatibility for existing deployments;
- accessibility and low-bandwidth impact where relevant;
- test coverage and documentation.

## Issue triage

Bug reports should include reproducible steps, expected behavior, actual behavior, browser/runtime details, and a sanitized example if data shape matters.

Do not put API tokens, private Kobo URLs containing secrets, beneficiary PII, or sensitive vulnerability details into a public issue. Follow SECURITY.md for security reports.

## Maintainer decisions

The primary maintainer is responsible for issue triage, pull-request review, release decisions, security response, and repository direction. See MAINTAINERS.md.
