import type { SpeechInstruction } from "../types.ts";

export interface TextToSpeechProvider {
  toSpeechInstruction(text: string): SpeechInstruction;
}

/**
 * Delegates actual synthesis to the telephony provider's inline TTS (Twilio <Say>
 * with an Amazon Polly voice) instead of pre-rendering audio files. Kajal (hi-IN)
 * is a bilingual neural voice built to read romanized Hindi/Urdu text, which is
 * why it's the default for Roman Urdu narration. Swap voice/language here if the
 * provider changes.
 */
export function createPollyInlineTextToSpeechProvider(
  voice: SpeechInstruction["voice"],
  language: SpeechInstruction["language"],
): TextToSpeechProvider {
  return {
    toSpeechInstruction(text) {
      return { voice, language, text };
    },
  };
}
