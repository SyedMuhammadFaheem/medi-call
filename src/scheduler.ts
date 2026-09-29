import cron from "node-cron";
import type { ReminderSlot } from "./types.ts";

export interface Scheduler {
  start(): void;
  stop(): void;
}

export interface SchedulerConfig {
  timezone: string;
  morningTime: string; // "HH:mm"
  eveningTime: string; // "HH:mm"
  onFire: (slot: ReminderSlot) => void;
}

export function timeToCronExpression(hhmm: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!match) {
    throw new Error(`Invalid time "${hhmm}", expected HH:mm`);
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error(`Invalid time "${hhmm}", hour/minute out of range`);
  }
  return `${minute} ${hour} * * *`;
}

export function createCronScheduler(config: SchedulerConfig): Scheduler {
  const tasks = [
    cron.createTask(timeToCronExpression(config.morningTime), () => config.onFire("morning"), {
      timezone: config.timezone,
    }),
    cron.createTask(timeToCronExpression(config.eveningTime), () => config.onFire("evening"), {
      timezone: config.timezone,
    }),
  ];

  return {
    start() {
      for (const task of tasks) task.start();
    },
    stop() {
      for (const task of tasks) task.stop();
    },
  };
}
