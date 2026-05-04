# DRDIP-II Somali Region Monitoring Dashboard

Live KoboToolbox monitoring dashboard for DRDIP-II field records in Somali Region only.

The dashboard is a static single-page application deployed with Vercel serverless functions. Production data comes from KoboToolbox through the Vercel proxy. Excel exports are optional schema references only and are not required in production.

## Scope

- Somali Region is the default and locked region.
- National and multi-region views are removed.
- Geographic hierarchy is Region, Woreda/City, Kebele, and Sub-kebele.
- Region-level charts are replaced with Woreda/City analytics.
- The comparison tab is Woreda/City Comparison.
- The Plan Targets baseline stores Somali Region PDO and Intermediate targets.

## Plan Targets Added

The target baseline comes from `DRDIP-II Project Somali Region PDO and Intermediate targets.xlsx`.

Key Year 5 Somali Region targets:

| Indicator | Target |
|---|---:|
| Beneficiaries with access to social and economic services and infrastructure | 803,250 |
| Host beneficiaries | 586,539 |
| Refugee beneficiaries | 216,711 |
| Sustainable landscape management, physical | 5,600 ha |
| Sustainable landscape management, biological | 2,400 ha |
| CIF subprojects completed and fully operational | 126 |
| SIF subprojects completed and fully operational | 12 |
| Alternative energy demonstration households | 2,734 |
| Households adopting alternative energy with own resources | 5,460 |
| CBOs operational one year after support | 402 |
| Traditional livelihood beneficiaries | 29,576 |
| Non-traditional livelihood beneficiaries | 12,043 |
| Irrigation beneficiaries | 5,296 |
| Farmers adopting improved agricultural technologies | 7,500 |
| New or improved irrigation or drainage area | 1,324 ha |
| Female members in community institutions | 40% |
| Women in leadership roles in community institutions | 30% |

## Woreda/City Target Allocation

The uploaded target workbook gives Somali Region-level targets. Where approved Woreda/City target splits are not available, the dashboard uses intervention area share as a planning allocation.

| Woreda/City | Zone | Existing areas | New areas | Total areas |
|---|---:|---:|---:|---:|
| Awbare Woreda | Fafan | 9 | 10 | 19 |
| Kebribeyah Woreda | Fafan | 4 | 16 | 20 |
| Kebribeyah City Administration | Fafan | 1 | 8 | 9 |
| Dollo Bay Woreda | Liban | 0 | 7 | 7 |
| Dollo Ado Woreda | Liban | 7 | 5 | 12 |
| Bokolmayo Woreda | Liban | 6 | 1 | 7 |

Danot Woreda and Bokh Woreda are included as additional financing locations, but their approved target split is not embedded until the official AWP&B target sheet is provided.

## Architecture

```text
Browser
  -> index.html
  -> /api/kobo-proxy
       -> KoboToolbox data API
  -> /api/kobo-media?url=...
       -> KoboToolbox media URLs
```

## Data Files

- `data/plan-targets-summary.json` stores the Somali Region target baseline and Woreda/City intervention area base.

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
- Plan target baseline for PDO and Intermediate results.

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
