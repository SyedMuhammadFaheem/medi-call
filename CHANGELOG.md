# Changelog

All notable changes are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- HTTP-layer tests (admin auth, input validation, Twilio signature verification, call-log recording).
- README, architecture notes, contributing guide, security policy, code of conduct, issue/PR templates, and CI.

### Changed
- Upgraded `better-sqlite3` to 13 (Node ≥ 22) and `node-cron` to 4, clearing `npm audit` findings.
- `engines.node` is now `>=22.18.0`, where TypeScript type stripping is enabled by default.

### Fixed
- Admin page rendered medicine text with `innerHTML` (stored XSS); it now uses `textContent`.
- Twilio webhook validation now receives the auth token explicitly instead of silently relying on the
  `TWILIO_AUTH_TOKEN` environment variable.
- `/twiml/:slot` and `/twiml/status/:slot` now return 404 for unknown slots instead of narrating "undefined".
- The database directory is created on first run, so a fresh clone starts without a manual `mkdir data`.
- Basic Auth passwords containing `:` are handled correctly.
- Updating a non-existent medicine returns 404 instead of a false success.

## [0.1.0]

Initial private prototype: scheduled Twilio calls, deterministic Roman Urdu narration, SQLite schedule, admin UI, call log.
