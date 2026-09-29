<p align="center"><img src="docs/logo.svg" width="96" alt="medi-call logo"></p>

<h1 align="center">medi-call</h1>

<p align="center">
  Twice-daily automated phone calls that read a medication schedule aloud — for someone who doesn't use a smartphone.
</p>

<p align="center">
  <a href="https://github.com/SyedMuhammadFaheem/medi-call/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/SyedMuhammadFaheem/medi-call/actions/workflows/ci.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
</p>

> **This is a reminder and narration tool, not a medical device.** It does not diagnose, advise, or
> adjust treatment, and it must not be relied on in an emergency. Read [Safety and limitations](#safety-and-limitations)
> before deploying it for a real person.

## The problem

Some people — often elderly relatives — need to take medicines at set times but don't use a smartphone,
apps, SMS, or the internet. What they *do* reliably do is answer a phone call.

## What medi-call does

Twice a day, at times you choose, it calls a normal phone number and reads out **only the medicines
scheduled for that slot**, exactly as a caregiver typed them. Then it hangs up. That's the whole product.

- **A phone call, nothing else.** No app, account, or internet needed on the receiving end.
- **Deterministic narration.** No LLM anywhere in the call path. The same records always produce the same
  spoken text, built from a fixed template plus the stored `name`, `dosage`, `quantity` and `instructions`
  fields — never rewritten, summarised, or "improved".
- **Small admin page** (`/admin`, password-protected) for a caregiver to edit the schedule and see recent call
  outcomes.
- **Fresh data at call time.** The medicine list is read when the call connects, so a last-minute edit is what
  gets spoken.
- **Fixed disclaimer** on every call: this is a reminder, not medical advice; take medicine as the doctor
  instructed. If nothing is scheduled for the slot, it says so rather than staying silent.
- **Small and swappable.** ~15 source files; telephony, speech, storage and scheduling sit behind narrow
  interfaces ([architecture](docs/ARCHITECTURE.md)).

Deliberately **out of scope**: multiple patients, accounts, chatbots or LLM narration, SMS/WhatsApp/push,
analytics, retries and escalation, and anything that infers or suggests doses.

## How it works

```
node-cron (2 jobs/day, IANA timezone)
   └─► Twilio places the call ─► requests TwiML from this server (POST /twiml/:slot, signature-verified)
                                     └─► medicines for that slot (SQLite) ─► narration text ─► <Say> (Amazon Polly voice)
Twilio status callback (POST /twiml/status/:slot) ─► call log (completed / failed)
```

Speech is synthesised by Twilio at call time using its `<Say>` verb, so there is no audio pipeline to host.

## Quick start

Requirements: **Node.js ≥ 22.18** (runs TypeScript directly — no build step) and a
[Twilio](https://www.twilio.com/) account with a voice-capable number. Twilio trial accounts can only call
numbers you have verified in the console.

```bash
git clone https://github.com/SyedMuhammadFaheem/medi-call.git
cd medi-call
npm ci
cp .env.example .env      # fill in Twilio credentials, the phone number, and an admin password
ngrok http 3000           # or any public HTTPS URL; put it in PUBLIC_BASE_URL
npm run dev
```

Open `http://localhost:3000/admin` (user `admin`, password = `ADMIN_PASSWORD`), add the medicines, then set
`MORNING_REMINDER_TIME` a few minutes ahead to receive a first test call. **Listen to it and check that the
voice pronounces your text acceptably before relying on it.**

Run the server from the repository root — the admin page is served from `./public/admin`.

## Configuration

All configuration is via environment variables (`.env` is loaded automatically). See [.env.example](.env.example).

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PATIENT_PHONE_NUMBER` | yes | — | Number to call (E.164, e.g. `+15555550100`) |
| `PUBLIC_BASE_URL` | yes | — | Public HTTPS URL Twilio uses to reach this server |
| `ADMIN_PASSWORD` | yes | — | Password for `/admin` and `/api/*` (Basic Auth, user `admin`) |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` | yes | — | Twilio credentials and caller ID |
| `PORT` | no | `3000` | HTTP port |
| `TIMEZONE` | no | `Asia/Karachi` | IANA timezone for the reminder times |
| `MORNING_REMINDER_TIME` / `EVENING_REMINDER_TIME` | no | `08:00` / `20:00` | 24-hour `HH:mm` |
| `DB_PATH` | no | `./data/medi-call.db` | SQLite file (its directory is created if missing) |
| `TTS_VOICE` / `TTS_LANGUAGE` | no | `Polly.Kajal-Neural` / `hi-IN` | Twilio `<Say>` voice and language |

Schedule times and timezone are read once at startup — restart after changing them. Medicines live in the
database and are edited from the admin page.

**Language.** The spoken template in [`src/narration.ts`](src/narration.ts) is Roman Urdu, and the default
voice (Polly Kajal, `hi-IN`) is chosen to read it. To use another language, change the three strings at the top
of that file and set `TTS_VOICE` / `TTS_LANGUAGE` to a matching Twilio voice.

## Deployment

The scheduler is an in-process cron job, so the process **must stay running**. Platforms that sleep on
inactivity (e.g. free-tier Render) will silently miss calls. Reasonable options:

1. A small always-on VPS with a real domain and a reverse proxy that terminates HTTPS (e.g. Caddy).
2. An always-on home machine (spare PC, Raspberry Pi) with a stable HTTPS tunnel.

Set `PUBLIC_BASE_URL` to the real HTTPS URL, keep `.env` on the host only, and run `npm start` under a process
supervisor (systemd, pm2, …) so it restarts after a crash or reboot. Serve `/admin` over HTTPS only — Basic Auth
sends the password with every request.

## Development

```bash
npm ci
npm run typecheck   # tsc --noEmit
npm test            # node:test — 20 tests, no network, no real calls
```

Tests cover narration exactness and XML escaping, cron/timezone conversion, SQLite CRUD, and the HTTP layer
(admin auth, input validation, Twilio signature checks, call-log recording). Real call placement and real speech
synthesis are intentionally not tested — verify those manually with a Twilio trial number.

## Safety and limitations

- **Not a medical device or advice.** Text is read verbatim from what the administrator typed. A typo in the
  schedule is spoken as a typo. Have someone check the schedule against the prescription.
- **No confirmation and no escalation.** It does not know whether the person answered attentively or took the
  medicine. There is **no retry** on no-answer and **no alert to a caregiver** — a missed call only shows up in
  the call log.
- **Single point of failure.** If the server, Twilio, the phone network, or your internet is down, no call is
  made. Consider a backup reminder for critical medicines.
- **Not for emergencies.** It cannot call emergency services or detect an emergency.
- **Speech quality varies.** Neural TTS may mispronounce drug names or romanised text. Test with the real text.
- **Caller ID.** Depending on your region, Twilio may only offer an international number. Tell the person in
  advance that the reminder will come from an unfamiliar number.

## Privacy, security and consent

- **Consent first.** Only call someone who knows about and agrees to the calls, and check local rules on
  automated or synthesised-voice calls.
- **What is stored.** Locally in SQLite: the medication schedule you enter (health-related — treat the database
  file as sensitive) and a call log (slot, time, outcome, Twilio call ID, error). The phone number is only in
  your environment, never in the database. **Twilio** separately records call metadata under its own policy.
- **Data minimisation.** Enter only what the reminder needs to say. Don't add diagnoses, names of doctors, or
  other unnecessary personal details.
- **Authentication.** The admin UI and API use a single shared password (HTTP Basic Auth) and have no rate
  limiting — use a long random password, HTTPS, and ideally restrict network access.
- **Webhook integrity.** `/twiml/*` requests are rejected unless they carry a valid Twilio signature.
- **Secrets.** `.env` is git-ignored. Never commit Twilio credentials. See [SECURITY.md](SECURITY.md) to report
  a vulnerability.

## Roadmap

Ideas that fit the scope (none are promised): a Dockerfile, an optional retry on no-answer, a "call now" button
in the admin page, and localisable narration templates. Anything that widens scope (multi-user, LLM narration,
dose inference) is intentionally not planned.

## Contributing

Issues and pull requests are welcome — please read [CONTRIBUTING.md](CONTRIBUTING.md) first, especially the
scope rules. This project follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
