import twilio from "twilio";
import type { ReminderSlot } from "../types.ts";

export interface TelephonyProvider {
  placeReminderCall(slot: ReminderSlot): Promise<{ callSid: string }>;
}

export interface TwilioTelephonyConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  toNumber: string;
  publicBaseUrl: string;
}

export function createTwilioTelephonyProvider(config: TwilioTelephonyConfig): TelephonyProvider {
  const client = twilio(config.accountSid, config.authToken);

  return {
    async placeReminderCall(slot) {
      const call = await client.calls.create({
        to: config.toNumber,
        from: config.fromNumber,
        url: `${config.publicBaseUrl}/twiml/${slot}`,
        statusCallback: `${config.publicBaseUrl}/twiml/status/${slot}`,
        statusCallbackEvent: ["completed"],
      });
      return { callSid: call.sid };
    },
  };
}
