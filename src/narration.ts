import type { Medication, ReminderSlot } from "./types.ts";

const SLOT_LABEL: Record<ReminderSlot, string> = {
  morning: "subah",
  evening: "shaam",
};

const OPENING = "Assalam-o-Alaikum. Yeh aap ki dawai ki yaad dahani hai.";
const DISCLAIMER =
  "Yeh sirf yaad dahani hai, tibbi mashwara nahi. Dawai bilkul waisay hi lein jaisay doctor ne bataya hai.";
const NONE_SCHEDULED = (label: string) =>
  `Is waqt ${label} ke liye koi dawai darj nahi hai.`;

function describeMedication(med: Medication): string {
  const parts = [med.name, med.dosage, med.quantity].filter((part) => part.trim().length > 0);
  let sentence = parts.join(", ");
  if (med.instructions.trim().length > 0) {
    sentence += `. ${med.instructions.trim()}`;
  }
  return sentence.endsWith(".") ? sentence : `${sentence}.`;
}

export function buildNarration(slot: ReminderSlot, medications: Medication[]): string {
  const label = SLOT_LABEL[slot];
  const lines = [OPENING];

  if (medications.length === 0) {
    lines.push(NONE_SCHEDULED(label));
  } else {
    lines.push(`${label.charAt(0).toUpperCase()}${label.slice(1)} ki dawai:`);
    for (const med of medications) {
      lines.push(describeMedication(med));
    }
  }

  lines.push(DISCLAIMER);
  return lines.join(" ");
}
