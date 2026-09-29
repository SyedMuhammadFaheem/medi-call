export type ReminderSlot = "morning" | "evening";
export type MedicationSlot = ReminderSlot | "both";

export interface Medication {
  id: number;
  name: string;
  dosage: string;
  quantity: string;
  instructions: string;
  slot: MedicationSlot;
  active: boolean;
}

export interface NewMedication {
  name: string;
  dosage: string;
  quantity: string;
  instructions: string;
  slot: MedicationSlot;
  active: boolean;
}

// voice/language are provider-specific identifiers (e.g. Twilio <Say>'s
// "Polly.Kajal-Neural" / "hi-IN"); kept as plain strings so this type doesn't
// couple to one telephony provider's SDK types.
export interface SpeechInstruction {
  voice: string;
  language: string;
  text: string;
}

export type CallStatus = "completed" | "failed";

export interface CallLogEntry {
  id: number;
  slot: ReminderSlot;
  calledAt: string;
  status: CallStatus;
  twilioCallSid: string | null;
  error: string | null;
}
