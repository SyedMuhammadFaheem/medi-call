# Security policy

## Supported versions

Only the latest commit on `main` is supported while the project is pre-1.0.

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Use GitHub's private reporting:
[Report a vulnerability](https://github.com/SyedMuhammadFaheem/medi-call/security/advisories/new).

Include what you found, steps to reproduce, and the impact. You should get an initial response within a few
days. This is a volunteer-maintained project, so fixes are best-effort.

## Scope and deployment notes

medi-call handles a phone number, Twilio credentials, and a medication schedule (health-related data). When
deploying:

- Keep `.env` and the SQLite database file private and out of version control.
- Serve the admin UI and API over HTTPS only; they use a single shared password (HTTP Basic Auth) with no rate
  limiting.
- Use a long random `ADMIN_PASSWORD`, and rotate the Twilio auth token if it may have leaked.
- Twilio webhooks (`/twiml/*`) are rejected unless correctly signed; make sure `PUBLIC_BASE_URL` matches the URL
  Twilio actually calls, including when behind a reverse proxy.

medi-call is a reminder tool and not a medical device; see the README for safety limitations.
