import { useEffect, useState } from "react";
import type { Application, HistoryEntry, Notification, Role, Settings, Status } from "./types";

const APPS_KEY = "stgs.applications";
const SETTINGS_KEY = "stgs.settings";
const USER_KEY = "stgs.user";
const NOTIFS_KEY = "stgs.notifications";
const EMAILS_KEY = "stgs.emails";

const DEFAULT_SETTINGS: Settings = {
  annualBudget: 100000,
  dailyRate: 1500,
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("stgs:change", { detail: key }));
}

export function getApplications(): Application[] {
  return read<Application[]>(APPS_KEY, []);
}
export function saveApplications(apps: Application[]) {
  write(APPS_KEY, apps);
}
export function upsertApplication(app: Application) {
  const all = getApplications();
  const idx = all.findIndex((a) => a.id === app.id);
  if (idx >= 0) all[idx] = app;
  else all.push(app);
  saveApplications(all);
}

export function getSettings(): Settings {
  return read<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);
}
export function saveSettings(s: Settings) {
  write(SETTINGS_KEY, s);
}

export interface CurrentUser {
  role: Role;
  name: string;
}
export function getUser(): CurrentUser | null {
  return read<CurrentUser | null>(USER_KEY, null);
}
export function setUser(u: CurrentUser | null) {
  write(USER_KEY, u);
}

export function useStore<T>(getter: () => T): T {
  const [value, setValue] = useState<T>(getter);
  useEffect(() => {
    const handler = () => setValue(getter());
    window.addEventListener("stgs:change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("stgs:change", handler);
      window.removeEventListener("storage", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}

export function newId() {
  return "APP-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function getApplicationById(id: string): Application | undefined {
  return getApplications().find((a) => a.id === id);
}

// ----- History + Notifications -----

export function appendHistory(app: Application, entry: HistoryEntry): Application {
  return { ...app, history: [...(app.history ?? []), entry] };
}

export function getNotifications(): Notification[] {
  return read<Notification[]>(NOTIFS_KEY, []);
}
function saveNotifications(n: Notification[]) {
  write(NOTIFS_KEY, n);
}
export function pushNotification(n: Omit<Notification, "id" | "at" | "read"> & { at?: string }) {
  const all = getNotifications();
  all.unshift({
    id: "N-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    at: n.at ?? new Date().toISOString(),
    read: false,
    message: n.message,
    applicationId: n.applicationId,
    forUser: n.forUser,
    forRole: n.forRole,
  });
  saveNotifications(all.slice(0, 200));
}
export function notificationsFor(user: CurrentUser): Notification[] {
  return getNotifications().filter(
    (n) =>
      (!n.forUser && !n.forRole) ||
      (n.forUser && n.forUser === user.name) ||
      (n.forRole && n.forRole === user.role)
  );
}
export function markAllNotificationsRead(user: CurrentUser) {
  const all = getNotifications();
  for (const n of all) {
    if (
      (!n.forUser && !n.forRole) ||
      (n.forUser && n.forUser === user.name) ||
      (n.forRole && n.forRole === user.role)
    ) {
      n.read = true;
    }
  }
  saveNotifications(all);
}
export function clearAllNotifications() {
  saveNotifications([]);
}

/**
 * Move an application to a new status, append history entry,
 * and emit relevant notifications. Returns the updated application
 * (already persisted).
 */
export function transitionApplication(
  app: Application,
  toStatus: Status,
  actor: { name: string; role: Role | "system" },
  options: { action?: string; note?: string; mutate?: (a: Application) => Application; notify?: { message: string; forUser?: string; forRole?: Role } } = {}
): Application {
  const from = app.status;
  let next: Application = { ...app, status: toStatus };
  if (options.mutate) next = options.mutate(next);
  next = appendHistory(next, {
    at: new Date().toISOString(),
    actorName: actor.name,
    actorRole: actor.role,
    action: options.action ?? `${from} → ${toStatus}`,
    fromStatus: from,
    toStatus,
    note: options.note,
  });
  upsertApplication(next);
  if (options.notify) {
    pushNotification({
      message: options.notify.message,
      applicationId: next.id,
      forUser: options.notify.forUser,
      forRole: options.notify.forRole,
    });
    logEmail({
      applicationId: next.id,
      recipientName: options.notify.forUser ?? (options.notify.forRole ? `${options.notify.forRole} group` : "all-staff"),
      recipientEmail: emailFor(options.notify.forUser, options.notify.forRole),
      subject: emailSubjectFor(next.id, options.action ?? options.notify.message),
      body: options.notify.message,
      triggeredBy: `${actor.name} (${actor.role})`,
    });
  }
  return next;
}

// ----- Email log (simulated) -----

export interface EmailLogEntry {
  id: string;
  at: string;
  applicationId?: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  triggeredBy: string;
}

const FINKI_DOMAIN = "finki.ukim.mk";
const ROLE_MAILBOXES: Record<string, string> = {
  applicant: "applicant",
  council: "council",
  dean: "dean.office",
  finance: "finance",
  hr: "hr",
};

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .join(".");
}

function emailFor(userName?: string, role?: Role): string {
  if (userName) return `${slugifyName(userName) || "user"}@${FINKI_DOMAIN}`;
  if (role) return `${ROLE_MAILBOXES[role] ?? role}@${FINKI_DOMAIN}`;
  return `noreply@${FINKI_DOMAIN}`;
}

function emailSubjectFor(appId: string, action: string): string {
  const clean = action.replace(/\s*→\s*/g, " → ").trim();
  return `[STGS] ${appId} — ${clean}`;
}

export function getEmailLog(): EmailLogEntry[] {
  return read<EmailLogEntry[]>(EMAILS_KEY, []);
}
export function logEmail(e: Omit<EmailLogEntry, "id" | "at"> & { at?: string }) {
  const all = getEmailLog();
  all.unshift({
    id: "EM-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    at: e.at ?? new Date().toISOString(),
    applicationId: e.applicationId,
    recipientName: e.recipientName,
    recipientEmail: e.recipientEmail,
    subject: e.subject,
    body: e.body,
    triggeredBy: e.triggeredBy,
  });
  write(EMAILS_KEY, all.slice(0, 500));
}
export function clearEmailLog() {
  write(EMAILS_KEY, []);
}

// Budget helpers
export function budgetSummary() {
  const apps = getApplications();
  const settings = getSettings();
  const approved = apps
    .filter((a) =>
      ["approved", "cash_advance_issued", "pending_report", "reconciliation", "closed"].includes(
        a.status
      )
    )
    .reduce((sum, a) => sum + (a.cashAdvance?.total ?? a.estimatedBudget), 0);
  const disbursed = apps
    .filter((a) => a.cashAdvance)
    .reduce((sum, a) => sum + (a.cashAdvance?.total ?? 0), 0);
  return {
    annual: settings.annualBudget,
    approved,
    disbursed,
    remaining: settings.annualBudget - approved,
  };
}
