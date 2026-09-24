# DRDIP-II Somali Region Monitoring Dashboard

[![CI](https://github.com/mamefarah/drdip-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/mamefarah/drdip-dashboard/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An open-source KoboToolbox monitoring dashboard for DRDIP-II field records in Ethiopia's Somali Region. It combines live field submissions, target-versus-collected monitoring, geographic views, beneficiary summaries, data-quality checks, photo evidence, and exportable management tables.

The current implementation is configured for DRDIP-II Somali Region. The architecture is intentionally documented so other development, humanitarian, research, and public-sector teams can fork and adapt the same secure Kobo-to-dashboard pattern.

## Why this project exists

KoboToolbox is widely used for field data collection, but programme teams often still need a lightweight way to turn submissions into management views without exposing API credentials in browser code or requiring a proprietary BI stack.

This repository demonstrates a practical pattern:

- a static browser dashboard for low-complexity deployment;
- serverless proxy functions that keep the Kobo API token server-side;
- Kobo host allowlists, HTTPS-only requests, timeouts, and pagination limits;
- target-versus-collected monitoring;
- geographic, beneficiary, status, GPS, photo, and data-quality views;
- automated tests for the proxy and frontend security assumptions.

## Current deployment scope

The reference configuration is Somali Region only.

- Geographic hierarchy: Region -> Woreda/City -> Kebele -> Sub-kebele.
- Region is locked to Somali Region.
- Management views compare field records and beneficiary reporting across Woreda/City.
- A planning target baseline is stored in data/plan-targets-summary.json.
- Where an approved subregional target split is unavailable, any planning allocation shown by the dashboard should be treated as an analytical planning aid, not an approved target.

The repository contains no production Kobo token and should not contain raw beneficiary or personally identifiable field data.

## Features

- Live KoboToolbox record retrieval through a server-side proxy.
- Cascading geographic and implementation filters.
- Executive KPIs and Woreda/City analytics.
- Target-versus-collected indicator tracking.
- Host/refugee beneficiary summaries where the underlying form supplies those fields.
- GPS coverage and map views.
- Photo-evidence review.
- Data-quality scoring and missing-field checks.
- Duplicate-record review support.
- Generated issue/action views.
- CSV exports for selected tables.
- Automated Node.js tests.

## Architecture

~~~text
Browser
  |
  +-- index.html + assets/
  |
  +-- /api/kobo-proxy
  |     +-- validates Kobo server
  |     +-- adds server-side API token
  |     +-- follows bounded pagination
  |     +-- returns JSON with no-store caching
  |
  +-- /api/kobo-media
        +-- validates Kobo media URL
        +-- adds server-side API token
        +-- restricts returned media types
~~~

The dashboard is designed for Vercel serverless functions, but the same API handlers can be adapted to other Node.js serverless platforms.

## Security model

The frontend must never receive KOBO_API_TOKEN.

Current proxy controls include:

- Kobo credentials read only from server environment variables.
- HTTPS-only Kobo server validation.
- Explicit allowlists for Kobo hosts.
- Origin-aware CORS using ALLOWED_ORIGINS.
- GET/OPTIONS-only proxy endpoints.
- 30-second upstream request timeout.
- Maximum pagination bound.
- no-store caching for proxied data and media.
- Media URL validation and image/video content-type checks.

See SECURITY.md and docs/DATA_PRIVACY.md before deploying with sensitive field data.

## Quick start

Requirements:

- Node.js 20
- A KoboToolbox account and asset UID
- Vercel CLI for local serverless development, or an equivalent Node.js serverless environment

Run the tests:

~~~bash
npm test
~~~

For local serverless development:

~~~bash
vercel dev --listen 3000
~~~

Then open http://localhost:3000.

## Environment variables

Configure these in the deployment environment, not in source control:

~~~text
KOBO_API_TOKEN=your_kobo_account_token
KOBO_SERVER=https://kf.kobotoolbox.org
KOBO_ASSET_UID=your_asset_uid
ALLOWED_ORIGINS=http://localhost:3000,https://your-dashboard.example
~~~

Never commit real Kobo credentials, exported raw submissions, or beneficiary PII.

## Reusing the dashboard for another Kobo project

This repository is a forkable reference implementation, not a zero-configuration generic product. To adapt it:

1. Fork the repository.
2. Configure the four environment variables above.
3. Replace the target baseline in data/plan-targets-summary.json.
4. Adapt Kobo field mappings in the dashboard JavaScript under assets/.
5. Replace DRDIP-II/Somali Region labels and programme-specific logic in index.html and assets/.
6. Keep the server-side token, Kobo-host validation, and test coverage intact.
7. Run npm test before deployment.

A more detailed adaptation checklist is in docs/REUSE_GUIDE.md.

## Testing and quality

GitHub Actions runs npm test on pull requests and pushes to main.

The test suite covers:

- server-side Kobo token use;
- Kobo host rejection;
- media-host rejection;
- frontend checks preventing token exposure;
- the intended Somali Region dashboard scope.

Contributions that change the proxy, data interpretation, security assumptions, or geographic logic should include corresponding test updates.

## Contributing and maintenance

Issues and pull requests are welcome. See:

- CONTRIBUTING.md for the development and review workflow;
- MAINTAINERS.md for maintenance responsibilities;
- SECURITY.md for vulnerability reporting;
- ROADMAP.md for planned work;
- CHANGELOG.md for release-facing changes.

Primary maintainer: [@mamefarah](https://github.com/mamefarah).

## Releases

The project follows semantic versioning for public releases. Release candidates should have:

1. a green CI run;
2. an updated CHANGELOG.md;
3. reviewed security/privacy implications;
4. deployment notes where configuration changes are required.

The current package version is 1.0.0. A tagged GitHub release should be created only from a reviewed main-branch commit.

## Public benefit and roadmap

The project aims to make field-monitoring infrastructure easier to inspect, reuse, and improve for teams that rely on KoboToolbox and need lightweight dashboards, particularly in low-bandwidth development and humanitarian settings.

See ROADMAP.md for the six-month maintenance plan.

## License

MIT. See LICENSE.
