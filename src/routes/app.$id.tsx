import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApplicationById, useStore } from "@/lib/stgs/store";
import { StatusBadge, fmtDate, fmtMKD } from "@/components/stgs/shared";
import { ROLE_LABELS, type HistoryEntry } from "@/lib/stgs/types";
import { downloadPaymentXml } from "@/lib/stgs/xml";

export const Route = createFileRoute("/app/$id")({
  component: ApplicationDetailPage,
});

function ApplicationDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const app = useStore(() => getApplicationById(id));

  if (!app) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/app" })} className="gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            Application <span className="font-mono">{id}</span> not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const history = (app.history ?? []).slice().reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/app" })} className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Application <span className="font-mono text-lg text-muted-foreground">{app.id}</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              {app.applicantName} · {app.destination} · {app.conferenceName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={app.status} />
          {app.status === "closed" && app.reconciliation && (
            <Button size="sm" variant="secondary" onClick={() => downloadPaymentXml(app)} className="gap-1.5">
              <Printer className="h-3.5 w-3.5" /> Export Payment XML
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Application details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
            <Field k="Applicant" v={app.applicantName} />
            <Field k="Destination" v={app.destination} />
            <Field k="Conference" v={app.conferenceName} />
            <Field k="Submitted" v={fmtDate(app.submittedAt)} />
            <Field k="Travel start" v={fmtDate(app.startDate)} />
            <Field k="Travel end" v={fmtDate(app.endDate)} />
            <Field k="Estimated budget" v={fmtMKD(app.estimatedBudget)} />
            <Field k="Supporting document" v={app.documentName ?? "—"} />
            <Field
              k="Meals covered"
              v={app.mealsCoveredByConference ? `Yes (${fmtMKD(app.mealsCoveredAmount)})` : "No"}
            />
            <Field
              k="Accommodation covered"
              v={app.accommodationCoveredByConference ? `Yes (${fmtMKD(app.accommodationCoveredAmount)})` : "No"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financial summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {app.cashAdvance ? (
              <>
                <Field k="Days" v={String(app.cashAdvance.days)} />
                <Field k="Per-diem rate" v={`${(app.cashAdvance.perDiemMultiplier * 100).toFixed(0)}% × ${fmtMKD(app.cashAdvance.dailyRate)}`} />
                <Field k="Per-diem total" v={fmtMKD(app.cashAdvance.perDiemTotal)} />
                <Field k="Conference fee" v={fmtMKD(app.cashAdvance.conferenceFee)} />
                <Field k="Cash advance" v={fmtMKD(app.cashAdvance.total)} />
              </>
            ) : (
              <p className="text-muted-foreground">No cash advance issued yet.</p>
            )}
            {app.travelReport && (
              <>
                <div className="border-t pt-2" />
                <Field k="Actual expenses" v={fmtMKD(app.travelReport.actualExpenses)} />
              </>
            )}
            {app.reconciliation && (
              <>
                <Field k="Balance" v={fmtMKD(app.reconciliation.balance)} />
                <Field k="Payment confirmation" v={app.reconciliation.paymentConfirmationId} />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workflow history</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history recorded.</p>
          ) : (
            <ol className="relative border-l border-border ml-3 space-y-5">
              {history.map((h, i) => (
                <HistoryRow key={i} entry={h} />
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        <Link to="/app" className="underline">Back to dashboard</Link>
      </p>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const roleLabel = entry.actorRole === "system" ? "System" : ROLE_LABELS[entry.actorRole];
  return (
    <li className="ml-4">
      <span className="absolute -left-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{entry.action}</p>
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">{fmtDate(entry.at)}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">
        {entry.actorName} · {roleLabel}
        {entry.fromStatus && entry.toStatus && (
          <> · {entry.fromStatus} → {entry.toStatus}</>
        )}
      </p>
      {entry.note && (
        <p className="text-xs mt-1 rounded bg-muted px-2 py-1">{entry.note}</p>
      )}
    </li>
  );
}
