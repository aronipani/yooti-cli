# Changelog

## [1.1.0] — 2026-03-30

### Added
- plan:review command — interactive architect review of all tasks
- story:approve command — Gate G1 PM sign-off with --all flag
- Terraform constitution — rules for writing .tf files
- Terraform scaffold — infra/ folder structure on yooti init
- Terraform wizard option — deploy=terraform in init wizard
- Self-audit sections — added to all 7 constitution files
- yooti doctor command — prerequisite checker
- PROMPTS.md — generated prompt guide per pipeline stage
- docker constitution — Docker/docker-compose rules
- config constitution — .env, pyproject.toml, vitest rules
- React scaffold — tailwind.config.js, postcss.config.js,
  tsconfig.json, index.html, index.css, main.tsx, App.tsx
  now generated on yooti init for React projects

### Fixed
- plan:amend and plan:review annotation writing — regex was
  looking for HTML comment that agent-generated plans don't use
- qa:review coverage thresholds — now reads from yooti.config.json
  instead of hardcoding 80/90
- sprint:report coverage thresholds — same fix as qa:review
- Gate G3/G5 log:event — now creates gate files in .agent/gates/
  not just audit log entries
- generator.js React scaffold — missing entry files now created

### Changed
- CLAUDE.md template — Phase 2, Phase 3, Phase 5 sections
  reordered and deduplicated, no duplicate Phase 5
- Constitution enforcement — explicit checklist added to CLAUDE.md
- Scaffold rule added to absolute rules in CLAUDE.md

## [1.0.0] — 2026-03-01

- Initial release
