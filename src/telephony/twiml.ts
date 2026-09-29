import twilio from "twilio";
import type VoiceResponseType from "twilio/lib/twiml/VoiceResponse.js";
import type { SpeechInstruction } from "../types.ts";

const { VoiceResponse } = twilio.twiml;

export function buildTwiml(instruction: SpeechInstruction): string {
  const response = new VoiceResponse();
  // SpeechInstruction keeps voice/language as plain strings (provider-agnostic);
  // Twilio's SDK types them as a huge generated union, so we cast at this one
  // boundary rather than coupling our own types to Twilio's.
  const attributes: VoiceResponseType.SayAttributes = {
    voice: instruction.voice as VoiceResponseType.SayAttributes["voice"],
    language: instruction.language as VoiceResponseType.SayAttributes["language"],
  };
  response.say(attributes, instruction.text);
  return response.toString();
}
