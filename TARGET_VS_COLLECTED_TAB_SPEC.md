# Somali Region Target vs Collected Tab

This specification defines the new dashboard tab requested for Somali Region overall targets compared with Kobo collected data and achievements.

## New tab label

`Target vs Collected`

## Purpose

Show Somali Region overall targets, collected Kobo actuals, achievement percentage, remaining gap, and Woreda/City allocation.

## Main sections

1. KPI cards

- Selected target year
- Overall beneficiary target
- Collected beneficiaries
- Beneficiary achievement percentage
- Remaining beneficiary gap

2. Overall target vs collected table

Columns:

- Sub-component
- Indicator
- Unit
- Target
- Collected actual
- Achievement percentage
- Remaining gap
- Actual source

3. Charts

- Overall target achievement by indicator
- Woreda/City beneficiary achievement

4. Woreda/City allocation table

Columns:

- Woreda/City
- Zone
- Planning share
- Beneficiary target
- Collected beneficiaries
- Achievement percentage
- CIF target
- SIF target
- SLM hectare target
- Energy household target
- Livelihood beneficiary target
- Irrigation hectare target
- Note

## Target source

`data/plan-targets-summary.json`

## Target values

Year 5 Somali Region targets:

- Total beneficiaries: 803,250
- Host beneficiaries: 586,539
- Refugee beneficiaries: 216,711
- Physical SLM: 5,600 ha
- Biological SLM: 2,400 ha
- CIF completed: 126
- SIF completed: 12
- Alternative energy demonstration households: 2,734
- Alternative energy self-adopting households: 5,460
- Operational CBOs: 402
- Traditional livelihood beneficiaries: 29,576
- Non-traditional livelihood beneficiaries: 12,043
- Irrigation beneficiaries: 5,296
- Farmers adopting technologies: 7,500
- Irrigation area: 1,324 ha
- Female members in community institutions: 40%
- Women in leadership roles: 30%

## Woreda/City allocation rule

Use intervention-area share until an approved Woreda/City target sheet is available.

Base intervention areas:

| Woreda/City | Zone | Total areas |
|---|---:|---:|
| Awbare Woreda | Fafan | 19 |
| Kebribeyah Woreda | Fafan | 20 |
| Kebribeyah City Administration | Fafan | 9 |
| Dollo Bay Woreda | Liban | 7 |
| Dollo Ado Woreda | Liban | 12 |
| Bokolmayo Woreda | Liban | 7 |
| Danot Woreda | Dollo | 0 |
| Bokh Woreda | Dollo | 0 |

## Actual data matching rules

- Beneficiaries: sum Kobo beneficiary fields.
- Host beneficiaries: use host beneficiary field. If missing, use total beneficiary proxy.
- Refugee beneficiaries: use refugee beneficiary field.
- CIF: count completed CIF or Community Investment Fund records.
- SIF: count completed SIF or Strategic Investment Fund records.
- Energy: match sub-component 2.2, energy, solar, or alternative energy records.
- SLM: match sub-component 2.1, natural resource, watershed, land, or landscape records.
- Livelihood: match sub-component 3.1 and 3.2 records.
- Irrigation: match sub-component 3.3 or irrigation records.
- Hectare values: use hectare field once mapped. Until then, show record count proxy and mark source clearly.
- Percentage indicators: show as not collected unless Kobo contains matching percentage fields.

## Export

Add CSV export button for the Target vs Collected table.

Recommended filename:

`somali-region-target-vs-collected.csv`

## Implementation status

This file documents the exact tab logic and layout. The next code commit should wire this into `index.html` as a dashboard tab.