# Data Privacy and Sensitive-Data Handling

This repository contains application code and sanitized planning configuration. It should not contain raw Kobo submissions, beneficiary lists, credentials, or other sensitive programme data.

## Data flow

In the intended deployment:

1. the browser requests data from the serverless proxy;
2. the proxy reads KOBO_API_TOKEN from the server environment;
3. the proxy requests the configured Kobo asset;
4. the proxy returns field records to the dashboard;
5. the browser renders charts, tables, maps, and media.

Because field records can contain personal or sensitive information, deployers must review the Kobo schema before exposing the dashboard.

## Repository rules

Do not commit:

- KOBO_API_TOKEN or other credentials;
- raw Kobo exports from production;
- beneficiary names, phone numbers, IDs, exact household locations, or other PII unless there is a documented lawful and operational reason and the repository is appropriately restricted;
- private media downloaded from Kobo;
- screenshots containing unredacted sensitive records.

## Deployment controls

At minimum:

- keep KOBO_API_TOKEN server-side;
- restrict ALLOWED_ORIGINS to intended dashboard origins;
- use HTTPS;
- minimize which fields are rendered;
- avoid public deployment if the source form contains sensitive information that should not be public;
- apply the access controls required by the data owner and applicable policy/law;
- rotate credentials if exposure is suspected.

## Data minimization

A reusable dashboard should request, transform, and display only what is necessary for the monitoring purpose. Where possible, prefer aggregated indicators over personally identifying records.

## Photos and GPS

Photos and exact coordinates can identify people or locations even when names are absent. Treat them as potentially sensitive and confirm that their display is authorized for the intended audience.

## Incident response

If sensitive data or a credential is committed or publicly exposed:

1. remove public access where possible;
2. rotate affected credentials immediately;
3. preserve enough audit information to understand scope;
4. remove sensitive material from current content and, when necessary, repository history;
5. review deployment logs and access;
6. document corrective actions without republishing the sensitive content.
