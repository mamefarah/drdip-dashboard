# DRDIP-II National Field Monitoring Dashboard

Live KoboToolbox monitoring dashboard for DRDIP-II field records across all regions.

The dashboard is a static single-page application deployed with Vercel serverless functions. Production data comes from KoboToolbox through the Vercel proxy. Excel exports are optional schema references only and are not required in production.

## Architecture

```text
Browser
  -> index.html
  -> /api/kobo-proxy
       -> KoboToolbox data API
  -> /api/kobo-media?url=...
       -> KoboToolbox media URLs
```

- `index.html` renders the national dashboard, filters, charts, map, table, photos, quality views, exports, and record drawer.
- `api/kobo-proxy.js` reads server-side environment variables and fetches live Kobo records with pagination.
- `api/kobo-media.js` loads protected Kobo images and videos through the same server-side credential.
- `vercel.json` disables API caching. CORS is handled inside the serverless functions using `ALLOWED_ORIGINS`.

## Environment Variables

Set these in Vercel project settings:

```text
KOBO_API_TOKEN=your_kobo_account_token
KOBO_SERVER=https://kf.kobotoolbox.org
KOBO_ASSET_UID=aFPhq8BHNDSd2SBKUAbP4y
ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-domain.vercel.app
```

Do not commit real Kobo credentials, Excel exports, or raw Kobo data.

## Live Data Flow

1. The browser calls `/api/kobo-proxy`.
2. The browser may send optional `server` and `asset` query parameters for testing overrides only.
3. The browser never sends Kobo credentials.
4. The proxy reads `KOBO_API_TOKEN`, `KOBO_SERVER`, and `KOBO_ASSET_UID` from environment variables.
5. The proxy calls `${KOBO_SERVER}/api/v2/assets/${KOBO_ASSET_UID}/data/`.
6. The proxy follows every Kobo `next` page until pagination ends, then returns:

```json
{
  "count": 0,
  "results": [],
  "next": null,
  "fetchedAt": "2026-05-02T00:00:00.000Z",
  "source": "kobotoolbox-live"
}
```

## KoboToolbox Setup

Use the Kobo asset UID for the production form:

```text
aFPhq8BHNDSd2SBKUAbP4y
```

The deployed dashboard expects the account represented by `KOBO_API_TOKEN` to have access to that asset and its media attachments.

Allowed Kobo server domains:

- `kf.kobotoolbox.org`
- `eu.kobotoolbox.org`
- `kobotoolbox.org`

## Field Mapping

The Excel export can be used as a schema and label reference only. The live app normalizes Kobo records using these labels and fallback aliases:

- `region`, `woreda`, `kebele`, `Sub-kebele`
- `Project Component`, `Project sub-component`
- `Sub project or Investment Type`
- `Local name of the sub-project`
- `Sub-project description`, `Sub-project category`
- `Type of sub-project works`
- implementation status and functionality status fields
- GPS latitude, longitude, altitude, and precision fields
- `Photo One_URL`, `Photo Two_URL`, `Photo Three (optional)_URL`
- optional video URL field
- Kobo metadata fields such as `_id`, `_uuid`, `_submission_time`, `_validation_status`, `_status`, `_submitted_by`, `version`, and `_index`

## Region Normalization

Display regions are normalized for national reporting:

- Afar Region
- Amhara Region
- Benishangul-Gumuz Region
- Gambella Region
- Oromia Region
- Somali Region
- Tigray Region
- Other

The Kobo value `Somale Region` is displayed as `Somali Region`; the original value remains available as `regionRaw`.

## Dashboard Features

- National all-regions default view.
- Cascading filters for region, woreda, kebele, sub-kebele, component, sub-component, subproject type, category, work type, status, functionality, host/refugee, GPS, photos, validation, date range, and search.
- Executive overview KPIs and latest submissions.
- Regional comparison charts, matrices, coverage rates, and ranking table.
- Clustered Leaflet GPS map with status-colored markers and record drill-down.
- Advanced subprojects table with search, sort, pagination, column chooser, row drawer, CSV export, and JSON export.
- Photo grid using Kobo media URLs through `/api/kobo-media`.
- Data quality KPIs and region-level quality table.
- Analytics charts for timeline, component, sub-component, type, status, host/refugee, gender, region-component matrix, and woreda ranking.
- Raw data tab with normalized and raw Kobo JSON exports.

## Security Checklist

- Kobo credentials stay in Vercel environment variables.
- No Kobo credential is stored in browser storage.
- No Kobo credential is sent from the browser.
- No Kobo credential appears in URLs.
- No Kobo credential is logged or returned.
- `/api/kobo-proxy` uses server-side `Authorization: Token ...` only inside the function.
- `/api/kobo-media` accepts only HTTPS KoboToolbox media URLs.
- CORS uses `ALLOWED_ORIGINS`; wildcard CORS is not used by the serverless functions.
- Excel exports and raw Kobo data are not committed.

## Vercel Deployment

```bash
npm test
vercel --prod
```

After deployment, set the production domain in `ALLOWED_ORIGINS`.

## Local Development

Use Vercel dev so the serverless functions run locally:

```bash
vercel dev --listen 3000
```

Open:

```text
http://localhost:3000
```

For local live-data testing, provide the same environment variables through Vercel development settings or a local environment file that is not committed.

## Troubleshooting

- `401 Missing KOBO_API_TOKEN environment variable`: set `KOBO_API_TOKEN` in Vercel.
- `400 Missing KOBO_SERVER or KOBO_ASSET_UID`: set both environment variables or use temporary frontend overrides.
- `403 Kobo server domain is not allowed`: use one of the allowed KoboToolbox domains.
- `502 KoboToolbox returned status ...`: verify asset access and Kobo availability.
- `504 KoboToolbox request timed out`: retry or check KoboToolbox performance.
- Blank photos or videos: confirm the media URL is HTTPS and belongs to KoboToolbox.

## Pull Request

Suggested title:

```text
Upgrade dashboard to live national KoboToolbox monitoring platform
```

Suggested summary:

- Live KoboToolbox connection through Vercel proxy
- Server-side credential handling
- National all-regions data model
- Schema normalization from Kobo export labels
- New cascading filters
- Regional comparison views
- Interactive drill-down and record detail drawer
- Data quality dashboard
- Export improvements
- Performance improvements
