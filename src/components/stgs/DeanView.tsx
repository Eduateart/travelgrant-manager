import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  budgetSummary,
  getApplications,
  getSettings,
  getUser,
  saveSettings,
  transitionApplication,
  useStore,
} from "@/lib/stgs/store";
import { ReviewQueue } from "./ReviewQueue";
import { fmtMKD } from "./shared";
import { useState } from "react";
import { toast } from "sonner";

export function DeanView() {
  const summary = useStore(() => budgetSummary());
  const settings = useStore(() => getSettings());
  const apps = useStore(() => getApplications());
  const [budget, setBudget] = useState(String(settings.annualBudget));

  const blocked = summary.remaining <= 0;

  function saveBudget() {
    saveSettings({ ...settings, annualBudget: Number(budget) || 0 });
    toast.success("Annual budget updated");
  }

  const pct = Math.min(100, (summary.approved / summary.annual) * 100 || 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dean's Office</h2>
        <p className="text-sm text-muted-foreground">
          Review council-approved applications and monitor the annual budget.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Annual Budget" value={fmtMKD(summary.annual)} />
        <StatCard label="Approved" value={fmtMKD(summary.approved)} />
        <StatCard label="Disbursed" value={fmtMKD(summary.disbursed)} />
        <StatCard
          label="Remaining"
          value={fmtMKD(summary.remaining)}
          accent={blocked ? "text-red-600" : "text-emerald-600"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Budget utilization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={pct} />
          <p className="text-xs text-muted-foreground">
            {pct.toFixed(1)}% of annual budget committed.
            {blocked && " New approvals are blocked — balance exhausted."}
          </p>
          <div className="flex items-end gap-2 pt-2">
            <div className="space-y-1">
              <Label>Annual budget (MKD)</Label>
              <Input value={budget} onChange={(e) => setBudget(e.target.value)} className="w-48" />
            </div>
            <Button variant="outline" onClick={saveBudget}>Update</Button>
          </div>
        </CardContent>
      </Card>

      <ReviewQueue
        title="Pending Dean Approval"
        description="Applications approved by the Scientific Council awaiting your final decision."
        filterStatus="pending_dean"
        decisionLabel="Decision"
        onApprove={(a) => {
          const user = getUser();
          if (blocked) {
            toast.error("Budget exhausted — cannot approve");
            return a;
          }
          return transitionApplication(
            a,
            "approved",
            { name: user?.name ?? "Dean", role: "dean" },
            {
              action: "Dean approved",
              mutate: (x) => ({
                ...x,
                deanDecision: { approved: true, reason: "Approved", at: new Date().toISOString() },
              }),
              notify: {
                message: `Your application ${a.id} was approved by the Dean's Office`,
                forUser: a.applicantName,
              },
            }
          );
        }}
        onReject={(a, reason) => {
          const user = getUser();
          return transitionApplication(
            a,
            "rejected",
            { name: user?.name ?? "Dean", role: "dean" },
            {
              action: "Dean rejected",
              note: reason,
              mutate: (x) => ({
                ...x,
                deanDecision: { approved: false, reason, at: new Date().toISOString() },
              }),
              notify: {
                message: `Your application ${a.id} was rejected by the Dean's Office`,
                forUser: a.applicantName,
              },
            }
          );
        }}
      />

      <RecentDecisions apps={apps} />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-semibold ${accent ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function RecentDecisions({ apps }: { apps: ReturnType<typeof getApplications> }) {
  const decided = apps.filter((a) => a.deanDecision).slice(-5).reverse();
  if (decided.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Dean decisions</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        {decided.map((a) => (
          <div key={a.id} className="flex items-center justify-between border-b last:border-0 py-1">
            <div>
              <span className="font-mono text-xs">{a.id}</span> · {a.applicantName} → {a.destination}
            </div>
            <span className={a.deanDecision?.approved ? "text-emerald-600" : "text-red-600"}>
              {a.deanDecision?.approved ? "Approved" : "Rejected"}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
