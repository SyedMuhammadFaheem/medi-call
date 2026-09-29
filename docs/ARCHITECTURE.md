# Architecture

medi-call is one Node.js process: an Express server plus an in-process scheduler, backed by a single SQLite file.

```
node-cron (2 daily jobs, IANA timezone)
   │
   ▼
runReminder(slot) ──► TelephonyProvider.placeReminderCall(slot)
   │ (if the call can't be placed)         │
   ▼                                       ▼
callLogRepository.record(failed)     Twilio places the call, then requests TwiML from
                                     POST /twiml/:slot                (this server)
                                           │
                                           ▼
                             MedicationRepository.listForSlot(slot)
                                           │
                                           ▼
                          narration.ts: buildNarration(slot, meds)
                                           │
                                           ▼
                      TextToSpeechProvider.toSpeechInstruction(text)
                                           │
                                           ▼
                        twiml.ts: buildTwiml() → <Say voice language>text</Say>
                                           │
                                           ▼
                               Twilio speaks it on the call
                                           │
                                           ▼
                     POST /twiml/status/:slot (Twilio status callback)
                                           │
                                           ▼
                          callLogRepository.record(completed | failed)
```

The admin UI (`public/admin/`, vanilla HTML/JS) talks to a small REST API (`/api/medications`, `/api/call-log`)
protected by HTTP Basic Auth.

## Design choices

- **Node ≥ 22.18 runs TypeScript directly** (type stripping) — no build step. Relative imports therefore use
  explicit `.ts` extensions, and only erasable TypeScript syntax is allowed (`erasableSyntaxOnly`).
- **Express** for ~10 routes; **better-sqlite3** with hand-written SQL for two small tables; **node-cron** for its
  native IANA timezone support (handles DST/offsets); the official **twilio** SDK for placing calls and verifying
  webhook signatures; **node:test** for tests. No frontend framework.
- **Narration is deterministic.** `narration.ts` concatenates stored fields into a fixed template. No LLM, no
  pre-rendered audio; Twilio synthesises speech inline from `<Say>`.
- **Medicines are read at call time**, not schedule time, so late edits are respected.
- **Schedule times and timezone are startup configuration** (`src/config.ts`), because they are set once for a
  single person, unlike the medicine list.

## Swappable pieces

Each external dependency sits behind a small interface so it can be replaced without touching the rest:

| Interface | File | Notes |
|---|---|---|
| `MedicationRepository`, `CallLogRepository` | `src/repositories/` | SQLite today |
| `TelephonyProvider` | `src/telephony/telephonyProvider.ts` | Twilio today; another provider needs a TwiML-like callback model or route changes |
| `TextToSpeechProvider` | `src/tts/textToSpeechProvider.ts` | Returns `{voice, language, text}` for inline `<Say>`. A pre-rendering provider (e.g. Urdu script via a cloud TTS) would extend `buildTwiml()` to emit `<Play>` |
| `Scheduler` | `src/scheduler.ts` | `start()` / `stop()` and a single `onFire(slot)` callback |

## Testing approach

`npm test` runs `node --test` over `tests/*.test.ts` against in-memory SQLite. Real Twilio calls and real speech
synthesis are not exercised in tests — they cost money and add little over the interface contracts. Verify them
manually with a Twilio trial number.
