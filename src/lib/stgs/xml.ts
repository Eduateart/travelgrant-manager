import type { Application } from "./types";

function esc(s: string | number | undefined | null): string {
  if (s === undefined || s === null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildPaymentConfirmationXml(app: Application): string {
  const r = app.reconciliation;
  const ca = app.cashAdvance;
  const tr = app.travelReport;
  const balance = r?.balance ?? 0;
  const direction =
    balance > 0
      ? "REFUND_TO_FACULTY"
      : balance < 0
        ? "OWED_TO_APPLICANT"
        : "BALANCED";

  return `<?xml version="1.0" encoding="UTF-8"?>
<PaymentConfirmation xmlns="https://finki.ukim.mk/stgs/payment/v1">
  <ConfirmationId>${esc(r?.paymentConfirmationId)}</ConfirmationId>
  <IssuedAt>${esc(r?.confirmedAt)}</IssuedAt>
  <Application>
    <Id>${esc(app.id)}</Id>
    <Applicant>${esc(app.applicantName)}</Applicant>
    <Destination>${esc(app.destination)}</Destination>
    <Conference>${esc(app.conferenceName)}</Conference>
    <TravelStart>${esc(app.startDate)}</TravelStart>
    <TravelEnd>${esc(app.endDate)}</TravelEnd>
  </Application>
  <CashAdvance currency="MKD">
    <IssuedAt>${esc(ca?.issuedAt)}</IssuedAt>
    <Days>${esc(ca?.days)}</Days>
    <DailyRate>${esc(ca?.dailyRate)}</DailyRate>
    <PerDiemMultiplier>${esc(ca?.perDiemMultiplier)}</PerDiemMultiplier>
    <PerDiemTotal>${esc(ca?.perDiemTotal)}</PerDiemTotal>
    <MealsDeduction>${esc(ca?.mealsDeduction)}</MealsDeduction>
    <AccommodationDeduction>${esc(ca?.accommodationDeduction)}</AccommodationDeduction>
    <ConferenceFee>${esc(ca?.conferenceFee)}</ConferenceFee>
    <Total>${esc(ca?.total ?? 0)}</Total>
  </CashAdvance>
  <TravelReport>
    <SubmittedAt>${esc(tr?.submittedAt)}</SubmittedAt>
    <ActualExpenses currency="MKD">${esc(tr?.actualExpenses ?? 0)}</ActualExpenses>
    <Notes>${esc(tr?.notes)}</Notes>
  </TravelReport>
  <Reconciliation currency="MKD">
    <CashAdvance>${esc(r?.cashAdvance ?? 0)}</CashAdvance>
    <ActualExpenses>${esc(r?.actualExpenses ?? 0)}</ActualExpenses>
    <Balance>${esc(balance)}</Balance>
    <Direction>${direction}</Direction>
  </Reconciliation>
</PaymentConfirmation>
`;
}

export function downloadPaymentXml(app: Application) {
  const xml = buildPaymentConfirmationXml(app);
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payment-confirmation-${app.id}.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
