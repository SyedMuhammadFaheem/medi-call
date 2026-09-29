import express from "express";
import type { Express } from "express";
import twilio from "twilio";
import { createBasicAuthMiddleware } from "./admin/basicAuth.ts";
import { buildNarration } from "./narration.ts";
import { buildTwiml } from "./telephony/twiml.ts";
import type { CallLogRepository } from "./repositories/callLogRepository.ts";
import type { MedicationRepository } from "./repositories/medicationRepository.ts";
import type { TextToSpeechProvider } from "./tts/textToSpeechProvider.ts";
import type { MedicationSlot, NewMedication, ReminderSlot } from "./types.ts";

const VALID_SLOTS: MedicationSlot[] = ["morning", "evening", "both"];

function isReminderSlot(value: string): value is ReminderSlot {
  return value === "morning" || value === "evening";
}

function parseMedicationInput(body: unknown): NewMedication {
  const b = body as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const dosage = typeof b.dosage === "string" ? b.dosage.trim() : "";
  const quantity = typeof b.quantity === "string" ? b.quantity.trim() : "";
  const instructions = typeof b.instructions === "string" ? b.instructions.trim() : "";
  const slot = b.slot as MedicationSlot;
  const active = Boolean(b.active);

  if (!name) throw new Error("name is required");
  if (!dosage) throw new Error("dosage is required");
  if (!VALID_SLOTS.includes(slot)) throw new Error(`slot must be one of ${VALID_SLOTS.join(", ")}`);

  return { name, dosage, quantity, instructions, slot, active };
}

export interface ServerDeps {
  medicationRepository: MedicationRepository;
  callLogRepository: CallLogRepository;
  textToSpeechProvider: TextToSpeechProvider;
  adminPassword: string;
  twilioAuthToken: string;
  publicBaseUrl: string;
}

export function createServer(deps: ServerDeps): Express {
  const app = express();
  app.set("trust proxy", true); // needed so Twilio's signature check sees the real https URL behind a reverse proxy
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  // Twilio calls this when the reminder call connects. Validated via Twilio's
  // request signature so only genuine Twilio requests can trigger narration.
  const validateTwilioRequest = twilio.webhook(deps.twilioAuthToken);

  app.post("/twiml/:slot", validateTwilioRequest, (req, res) => {
    const slot = req.params.slot;
    if (!isReminderSlot(slot)) {
      res.sendStatus(404);
      return;
    }
    const medications = deps.medicationRepository.listForSlot(slot);
    const narration = buildNarration(slot, medications);
    const instruction = deps.textToSpeechProvider.toSpeechInstruction(narration);
    res.type("text/xml").send(buildTwiml(instruction));
  });

  app.post("/twiml/status/:slot", validateTwilioRequest, (req, res) => {
    const slot = req.params.slot;
    if (!isReminderSlot(slot)) {
      res.sendStatus(404);
      return;
    }
    const callStatus = req.body.CallStatus as string | undefined;
    deps.callLogRepository.record({
      slot,
      status: callStatus === "completed" ? "completed" : "failed",
      twilioCallSid: (req.body.CallSid as string | undefined) ?? null,
      error: callStatus && callStatus !== "completed" ? callStatus : null,
    });
    res.sendStatus(204);
  });

  const adminAuth = createBasicAuthMiddleware(deps.adminPassword);
  app.use("/admin", adminAuth, express.static("public/admin"));

  app.get("/api/medications", adminAuth, (_req, res) => {
    res.json(deps.medicationRepository.listAll());
  });

  app.post("/api/medications", adminAuth, (req, res) => {
    try {
      const med = parseMedicationInput(req.body);
      res.status(201).json(deps.medicationRepository.create(med));
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.put("/api/medications/:id", adminAuth, (req, res) => {
    try {
      const med = parseMedicationInput(req.body);
      const updated = deps.medicationRepository.update(Number(req.params.id), med);
      if (!updated) {
        res.status(404).json({ error: "medication not found" });
        return;
      }
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/medications/:id", adminAuth, (req, res) => {
    deps.medicationRepository.remove(Number(req.params.id));
    res.sendStatus(204);
  });

  app.get("/api/call-log", adminAuth, (_req, res) => {
    res.json(deps.callLogRepository.recent(50));
  });

  return app;
}
