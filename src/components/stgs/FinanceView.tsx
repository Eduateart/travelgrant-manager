import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import {
  getApplications,
  getSettings,
  getUser,
  saveSettings,
  transitionApplication,
  useStore,
} from "@/lib/stgs/store";
import type { Application } from "@/lib/stgs/types";
import { calculateCashAdvance, hoursBetween, perDiemMultiplier } from "@/lib/stgs/perdiem";
import { StatusBadge, fmtMKD } from "./shared";
import { downloadPaymentXml } from "@/lib/stgs/xml";

export function FinanceView() {
  const settings = useStore(() => getSettings());
  const approved = useStore(() => getApplications().filter((a) => a.status === "approved"));
  const reconc = useStore(() => getApplications().filter((a) => a.status === "reconciliation"));
  const [rate, setRate] = useState(String(settings.dailyRate));
  const [advanceFor, setAdvanceFor] = useState<Application | null>(null);
  const [reconcileFor, setReconcileFor] = useState<Application | null>(null);

  function saveRate() {
    saveSettings({ ...settings, dailyRate: Number(rate) || 0 });
    toast.success("Daily rate updated");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Finance Service</h2>
        <p className="text-sm text-muted-foreground">
          Issue cash advances and reconcile post-travel reports.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per-diem configuration</CardTitle>
        </CardHeader>
        <CardContent className="flex items-end gap-3">
          <div className="space-y-1">
            <Label>Daily rate (MKD)</Label>
            <Input value={rate} onChange={(e) => setRate(e.target.value)} className="w-48" />
          </div>
          <Button variant="outline" onClick={saveRate}>Save</Button>
          <p className="ml-auto text-xs text-muted-foreground max-w-md">
            Rules: &lt;8h = no per-diem · 8–12h = 50% · &gt;12h = full daily rate.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="advance">
        <TabsList>
          <TabsTrigger value="advance">Cash Advances ({approved.length})</TabsTrigger>
          <TabsTrigger value="reconcile">Reconciliation ({reconc.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="advance">
          <Card>
            <CardContent className="p-0">
              {approved.length === 0 ? (
                <Empty msg="No approved applications awaiting cash advance." />
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>ID</TableHead><TableHead>Applicant</TableHead>
                    <TableHead>Destination</TableHead><TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {approved.map((a) => {
                      const h = hoursBetween(a.startDate, a.endDate);
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="font-mono text-xs">
                            <Link to="/app/$id" params={{ id: a.id }} className="text-primary hover:underline">{a.id}</Link>
                          </TableCell>
                          <TableCell>{a.applicantName}</TableCell>
                          <TableCell>{a.destination}</TableCell>
                          <TableCell>{h.toFixed(1)}h ({(perDiemMultiplier(h) * 100).toFixed(0)}%)</TableCell>
                          <TableCell><StatusBadge status={a.status} /></TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" onClick={() => setAdvanceFor(a)}>Calculate Advance</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reconcile">
          <Card>
            <CardContent className="p-0">
              {reconc.length === 0 ? (
                <Empty msg="No reports awaiting reconciliation." />
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>ID</TableHead><TableHead>Applicant</TableHead>
                    <TableHead>Advance</TableHead><TableHead>Actual</TableHead>
                    <TableHead>Delta</TableHead><TableHead className="text-right">Action</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {reconc.map((a) => {
                      const adv = a.cashAdvance?.total ?? 0;
                      const act = a.travelReport?.actualExpenses ?? 0;
                      const delta = adv - act;
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="font-mono text-xs">
                            <Link to="/app/$id" params={{ id: a.id }} className="text-primary hover:underline">{a.id}</Link>
                          </TableCell>
                          <TableCell>{a.applicantName}</TableCell>
                          <TableCell>{fmtMKD(adv)}</TableCell>
                          <TableCell>{fmtMKD(act)}</TableCell>
                          <TableCell className={delta >= 0 ? "text-emerald-600" : "text-red-600"}>
                            {fmtMKD(delta)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" onClick={() => setReconcileFor(a)}>Reconcile</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {advanceFor && (
        <CashAdvanceDialog app={advanceFor} dailyRate={settings.dailyRate} onClose={() => setAdvanceFor(null)} />
      )}
      {reconcileFor && (
        <ReconcileDialog app={reconcileFor} onClose={() => setReconcileFor(null)} />
      )}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="p-10 text-center text-sm text-muted-foreground">{msg}</div>;
}

function CashAdvanceDialog({
  app, dailyRate, onClose,
}: { app: Application; dailyRate: number; onClose: () => void }) {
  const [fee, setFee] = useState("0");
  const preview = calculateCashAdvance(app, dailyRate, Number(fee) || 0);

  function issue() {
    const user = getUser();
    transitionApplication(
      app,
      "pending_report",
      { name: user?.name ?? "Finance", role: "finance" },
      {
        action: `Cash advance issued (${fmtMKD(preview.total)})`,
        mutate: (x) => ({ ...x, cashAdvance: preview }),
        notify: {
          message: `Cash advance of ${fmtMKD(preview.total)} issued for ${app.id}`,
          forUser: app.applicantName,
        },
      }
    );
    toast.success(`Cash advance of ${fmtMKD(preview.total)} issued`);
    onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Cash advance — {app.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <Row k="Travel duration" v={`${preview.hours.toFixed(1)} h / ${preview.days} day(s)`} />
          <Row k="Per-diem rate" v={`${(preview.perDiemMultiplier * 100).toFixed(0)}% of ${fmtMKD(dailyRate)}/day`} />
          <Row k="Base per-diem" v={fmtMKD(preview.days * dailyRate * preview.perDiemMultiplier)} />
          {preview.mealsCovered && <Row k="− Meals covered" v={`− ${fmtMKD(preview.mealsDeduction)}`} />}
          {preview.accommodationCovered && <Row k="− Accommodation covered" v={`− ${fmtMKD(preview.accommodationDeduction)}`} />}
          <div className="space-y-1 pt-2">
            <Label>Conference fee (MKD)</Label>
            <Input value={fee} onChange={(e) => setFee(e.target.value)} type="number" />
          </div>
          <div className="border-t pt-2 mt-2 flex items-center justify-between font-semibold">
            <span>Total advance</span>
            <span>{fmtMKD(preview.total)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={issue}>Issue Advance</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReconcileDialog({ app, onClose }: { app: Application; onClose: () => void }) {
  const adv = app.cashAdvance?.total ?? 0;
  const act = app.travelReport?.actualExpenses ?? 0;
  const delta = adv - act;

  function confirm(): Application {
    const id = "PAY-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const user = getUser();
    const closed = transitionApplication(
      app,
      "closed",
      { name: user?.name ?? "Finance", role: "finance" },
      {
        action: `Reconciled — ${id}`,
        mutate: (x) => ({
          ...x,
          reconciliation: {
            cashAdvance: adv,
            actualExpenses: act,
            balance: delta,
            confirmedAt: new Date().toISOString(),
            paymentConfirmationId: id,
          },
        }),
        notify: {
          message: `Application ${app.id} reconciled — payment confirmation ${id}`,
          forUser: app.applicantName,
        },
      }
    );
    toast.success(`Reconciled · Payment confirmation ${id}`);
    return closed;
  }

  function confirmAndClose() {
    confirm();
    onClose();
  }

  function confirmAndExport() {
    const updated = confirm();
    downloadPaymentXml(updated);
    onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reconciliation — {app.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <Row k="Cash advance" v={fmtMKD(adv)} />
          <Row k="Actual expenses" v={fmtMKD(act)} />
          <div className="border-t pt-2 mt-2 flex items-center justify-between font-semibold">
            <span>{delta >= 0 ? "Applicant returns to faculty" : "Faculty owes applicant"}</span>
            <span className={delta >= 0 ? "text-emerald-600" : "text-red-600"}>{fmtMKD(Math.abs(delta))}</span>
          </div>
          {app.travelReport?.notes && (
            <p className="text-xs text-muted-foreground pt-2">Notes: {app.travelReport.notes}</p>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="secondary" onClick={confirmAndExport} className="gap-1.5">
            <Printer className="h-3.5 w-3.5" /> Confirm &amp; Export XML
          </Button>
          <Button onClick={confirmAndClose}>Generate Payment Confirmation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span>{v}</span>
    </div>
  );
}
