import type { Application, CashAdvance } from "./types";

export function hoursBetween(startISO: string, endISO: string): number {
  const ms = new Date(endISO).getTime() - new Date(startISO).getTime();
  return Math.max(0, ms / (1000 * 60 * 60));
}

export function daysBetween(startISO: string, endISO: string): number {
  const h = hoursBetween(startISO, endISO);
  return Math.max(1, Math.ceil(h / 24));
}

export function perDiemMultiplier(hours: number): number {
  if (hours < 8) return 0;
  if (hours <= 12) return 0.5;
  return 1;
}

export function calculateCashAdvance(
  app: Application,
  dailyRate: number,
  conferenceFee = 0
): CashAdvance {
  const hours = hoursBetween(app.startDate, app.endDate);
  const days = daysBetween(app.startDate, app.endDate);
  const mult = perDiemMultiplier(hours);
  const perDiemBase = days * dailyRate * mult;

  const mealsDeduction = app.mealsCoveredByConference
    ? app.mealsCoveredAmount || perDiemBase * 0.5
    : 0;
  const accommodationDeduction = app.accommodationCoveredByConference
    ? app.accommodationCoveredAmount
    : 0;

  const perDiemTotal = Math.max(0, perDiemBase - mealsDeduction);
  const total = Math.max(0, perDiemTotal + conferenceFee - accommodationDeduction);

  return {
    hours,
    dailyRate,
    days,
    perDiemMultiplier: mult,
    perDiemTotal,
    mealsCovered: app.mealsCoveredByConference,
    mealsDeduction,
    accommodationCovered: app.accommodationCoveredByConference,
    accommodationDeduction,
    conferenceFee,
    total,
    issuedAt: new Date().toISOString(),
  };
}
