# Roadmap and Public Benefit

## Purpose

DRDIP Dashboard supports transparent, inspectable field-monitoring workflows built on KoboToolbox. The reference deployment serves DRDIP-II Somali Region, while the repository is structured as a reusable implementation pattern for development, humanitarian, research, and public-sector monitoring teams.

## Intended users

- programme coordinators;
- monitoring, evaluation, accountability, and learning staff;
- field teams using KoboToolbox;
- technical teams building lightweight monitoring dashboards;
- development partners and reviewers who need inspectable data-quality and results views.

## Current maintenance baseline

- [x] MIT open-source license
- [x] Public contribution guidance
- [x] Automated Node.js test suite
- [x] Continuous integration workflow
- [x] Security reporting policy
- [x] Maintainer responsibilities documented
- [x] Data privacy and secret-handling guidance
- [x] Reuse/adaptation guide
- [x] Changelog and semantic-versioning policy

## Next 6 months

- [ ] Expand automated tests for chart rendering and data loaders.
- [ ] Improve offline-friendly and low-bandwidth behavior.
- [ ] Improve accessibility, keyboard navigation, and mobile responsiveness.
- [ ] Extract more programme-specific field mappings into configuration.
- [ ] Add sample/synthetic data for a fully public demo deployment.
- [ ] Add deployment verification checks for environment configuration.
- [ ] Publish reviewed, tagged GitHub releases with release notes.
- [ ] Add contributor-facing examples for adapting the dashboard to another Kobo schema.

## Public-benefit objective

The project should remain useful beyond one deployment. New architecture and documentation work should reduce the effort required for another team to safely adapt the secure Kobo proxy, data-quality checks, geographic monitoring, and target-versus-collected patterns without copying production credentials or private field data.
