import { useEffect, useState } from "react";
import type { Application, HistoryEntry, Notification, Role, Settings, Status } from "./types";

const APPS_KEY = "stgs.applications";
const SETTINGS_KEY = "stgs.settings";
const USER_KEY = "stgs.user";
const NOTIFS_KEY = "stgs.notifications";

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
