import "dotenv/config";
import type { SpeechInstruction } from "./types.ts";

export interface Config {
  port: number;
  timezone: string;
  patientPhoneNumber: string;
  morningReminderTime: string;
  eveningReminderTime: string;
  publicBaseUrl: string;
  adminPassword: string;
  dbPath: string;
  twilio: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
  tts: {
    voice: SpeechInstruction["voice"];
    language: SpeechInstruction["language"];
  };
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Only call this from the process entry point (src/index.ts). Keeping it out of
// pure/unit-tested modules (narration, twiml, scheduler) means those can be
// tested without setting up every env var.
export function loadConfig(): Config {
  return {
    port: Number(process.env.PORT ?? 3000),
    timezone: process.env.TIMEZONE ?? "Asia/Karachi",
    patientPhoneNumber: required("PATIENT_PHONE_NUMBER"),
    morningReminderTime: process.env.MORNING_REMINDER_TIME ?? "08:00",
    eveningReminderTime: process.env.EVENING_REMINDER_TIME ?? "20:00",
    publicBaseUrl: required("PUBLIC_BASE_URL"),
    adminPassword: required("ADMIN_PASSWORD"),
    dbPath: process.env.DB_PATH ?? "./data/medi-call.db",
    twilio: {
      accountSid: required("TWILIO_ACCOUNT_SID"),
      authToken: required("TWILIO_AUTH_TOKEN"),
      fromNumber: required("TWILIO_FROM_NUMBER"),
    },
    tts: {
      voice: (process.env.TTS_VOICE ?? "Polly.Kajal-Neural") as SpeechInstruction["voice"],
      language: (process.env.TTS_LANGUAGE ?? "hi-IN") as SpeechInstruction["language"],
    },
  };
}
