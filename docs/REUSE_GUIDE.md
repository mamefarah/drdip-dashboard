# Reusing the Dashboard for Another Kobo Project

The repository is a reference implementation for a secure KoboToolbox-to-dashboard workflow. It is currently configured for DRDIP-II Somali Region, so reuse requires adapting programme-specific field mappings and labels.

## 1. Fork and configure

Set these environment variables in the serverless deployment:

~~~text
KOBO_API_TOKEN=your_kobo_account_token
KOBO_SERVER=https://kf.kobotoolbox.org
KOBO_ASSET_UID=your_asset_uid
ALLOWED_ORIGINS=https://your-dashboard.example
~~~

Keep KOBO_API_TOKEN server-side. Do not place it in index.html, browser JavaScript, screenshots, issues, or documentation.

## 2. Preserve the proxy security model

api/kobo-proxy.js and api/kobo-media.js currently enforce important boundaries:

- HTTPS Kobo URLs;
- approved Kobo hosts;
- server-side Authorization headers;
- request timeouts;
- bounded pagination;
- no-store caching;
- origin-aware CORS;
- media-type restrictions.

If your deployment requires another Kobo host, change the allowlist deliberately and add tests for the new host.

## 3. Adapt the programme schema

The current implementation contains DRDIP-II-specific assumptions in:

- index.html;
- assets/dashboard-safe.js;
- assets/dashboard-features.js;
- assets/dashboard-polish.js;
- data/plan-targets-summary.json.

When adapting the project, identify your Kobo field names for:

- geography;
- activity or subproject name;
- implementation status;
- beneficiary counts;
- GPS;
- media attachments;
- programme component/category fields.

Update mappings and add regression tests for the adapted schema.

## 4. Replace target data

Replace data/plan-targets-summary.json with a sanitized baseline that matches your programme indicators.

Clearly distinguish:

- officially approved targets;
- calculated planning allocations;
- live collected values;
- derived indicators.

Do not present an analytical allocation as an approved target.

## 5. Remove deployment-specific labels

Search for DRDIP-II, Somali Region, Woreda/City, and other deployment-specific terms. Replace them with terminology appropriate to your programme.

## 6. Validate privacy

Before deployment:

- determine whether Kobo submissions contain PII or sensitive data;
- minimize fields displayed in the browser;
- restrict deployment access when public exposure is inappropriate;
- set ALLOWED_ORIGINS narrowly;
- avoid storing raw exports in the repository;
- verify media exposure is appropriate.

See DATA_PRIVACY.md.

## 7. Test

Run:

~~~bash
npm test
~~~

Add tests whenever you change proxy rules, field mappings, geographic scope, or frontend security assumptions.

## 8. Deploy and verify

After deployment, verify:

- the dashboard loads only from intended origins;
- no API token appears in browser source or network payloads;
- Kobo requests succeed through the proxy;
- filters match the expected geography and schema;
- derived indicators reconcile to known sample records;
- missing-data and GPS checks behave as expected.
