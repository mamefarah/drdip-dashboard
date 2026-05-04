# DRDIP-II Somali Region Monitoring Dashboard

Live KoboToolbox monitoring dashboard for DRDIP-II field records in Somali Region only.

The dashboard is a static single-page application deployed with Vercel serverless functions. Production data comes from KoboToolbox through the Vercel proxy. Excel exports are optional schema references only and are not required in production.

## Scope

- Somali Region is the default and locked region.
- National and multi-region views were removed.
- Geographic hierarchy is Region, Woreda/City, Kebele, Sub-kebele.
- Region-level charts were replaced with Woreda/City analytics.
- The comparison tab is now Woreda/City Comparison.

## Architecture

```text
Browser
  -> index.html
  -> /api/kobo-proxy
       -> KoboToolbox data API
  -> /api/kobo-media?url=...
       -> KoboToolbox media URLs
```

## Environment Variables

Set these in Vercel project settings:

```text
KOBO_API_TOKEN=your_kobo_account_token
KOBO_SERVER=https://kf.kobotoolbox.org
KOBO_ASSET_UID=aFPhq8BHNDSd2SBKUAbP4y
ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-domain.vercel.app
```

Do not commit real Kobo credentials, Excel exports, or raw Kobo data.

## Dashboard Features

- Somali Region-only default view.
- Locked Somali Region filter.
- Cascading Woreda/City, Kebele, and Sub-kebele filters.
- Executive KPIs for records, Woreda/City count, kebele count, beneficiaries, and completion.
- Woreda/City charts for records, beneficiaries, completion, GPS coverage, and photo coverage.
- Woreda/City component matrix and ranking table.
- Somali Region map, subprojects table, photos, data quality, analytics, and exports.

## Local Development

Use Vercel dev so the serverless functions run locally:

```bash
npm test
vercel dev --listen 3000
```

Open:

```text
http://localhost:3000
```
