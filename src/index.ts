import { loadConfig } from "./config.ts";
import { openDatabase } from "./db.ts";
import { createSqliteCallLogRepository } from "./repositories/callLogRepository.ts";
import { createSqliteMedicationRepository } from "./repositories/medicationRepository.ts";
import { createCronScheduler } from "./scheduler.ts";
import { createServer } from "./server.ts";
import { createTwilioTelephonyProvider } from "./telephony/telephonyProvider.ts";
import { createPollyInlineTextToSpeechProvider } from "./tts/textToSpeechProvider.ts";
import type { ReminderSlot } from "./types.ts";

const config = loadConfig();

const db = openDatabase(config.dbPath);
const medicationRepository = createSqliteMedicationRepository(db);
const callLogRepository = createSqliteCallLogRepository(db);
const textToSpeechProvider = createPollyInlineTextToSpeechProvider(
  config.tts.voice,
  config.tts.language,
);
const telephonyProvider = createTwilioTelephonyProvider({
  accountSid: config.twilio.accountSid,
  authToken: config.twilio.authToken,
  fromNumber: config.twilio.fromNumber,
  toNumber: config.patientPhoneNumber,
  publicBaseUrl: config.publicBaseUrl,
});

async function runReminder(slot: ReminderSlot): Promise<void> {
  try {
    await telephonyProvider.placeReminderCall(slot);
    // Final success/failure is recorded by the /twiml/status webhook once the
    // call actually completes; this only guards against the call never being
    // placed at all (e.g. Twilio API/network error).
  } catch (err) {
    callLogRepository.record({
      slot,
      status: "failed",
      twilioCallSid: null,
      error: (err as Error).message,
    });
  }
}

const scheduler = createCronScheduler({
  timezone: config.timezone,
  morningTime: config.morningReminderTime,
  eveningTime: config.eveningReminderTime,
  onFire: (slot) => {
    void runReminder(slot);
  },
});
scheduler.start();

const app = createServer({
  medicationRepository,
  callLogRepository,
  textToSpeechProvider,
  adminPassword: config.adminPassword,
  twilioAuthToken: config.twilio.authToken,
  publicBaseUrl: config.publicBaseUrl,
});

app.listen(config.port, () => {
  console.log(`medi-call listening on port ${config.port} (timezone ${config.timezone})`);
});
