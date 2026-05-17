import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  appendHistory,
  getApplications,
  newId,
  pushNotification,
  transitionApplication,
  upsertApplication,
  useStore,
  type CurrentUser,
} from "@/lib/stgs/store";
import type { Application } from "@/lib/stgs/types";
import { StatusBadge, fmtMKD, fmtDate } from "./shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export function ApplicantView({ user }: { user: CurrentUser }) {
  const apps = useStore(() => getApplications().filter((a) => a.applicantName === user.name));
  const [open, setOpen] = useState(false);
  const [reportFor, setReportFor] = useState<Application | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">My Applications</h2>
          <p className="text-sm text-muted-foreground">
            Submit and track your scientific travel grant applications.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>+ New Application</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {apps.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No applications yet. Submit your first travel grant application.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Conference</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.id}</TableCell>
                    <TableCell>{a.destination}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{a.conferenceName}</TableCell>
                    <TableCell className="text-xs">
                      {a.startDate.slice(0, 10)} → {a.endDate.slice(0, 10)}
                    </TableCell>
                    <TableCell>{fmtMKD(a.estimatedBudget)}</TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                    <TableCell className="text-right">
                      {a.status === "pending_report" && (
                        <Button size="sm" variant="outline" onClick={() => setReportFor(a)}>
                          Submit Report
                        </Button>
                      )}
                      {a.status === "closed" && a.reconciliation && (
                        <span className="text-xs text-muted-foreground">
                          Balance: {fmtMKD(a.reconciliation.balance)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NewApplicationDialog open={open} onOpenChange={setOpen} user={user} />
      {reportFor && (
        <PostTravelReportDialog
          app={reportFor}
          onClose={() => setReportFor(null)}
        />
      )}
    </div>
  );
}

function NewApplicationDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: CurrentUser;
}) {
  const [destination, setDestination] = useState("");
  const [conferenceName, setConferenceName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [mealsCovered, setMealsCovered] = useState(false);
  const [mealsAmount, setMealsAmount] = useState("");
  const [accomCovered, setAccomCovered] = useState(false);
  const [accomAmount, setAccomAmount] = useState("");
  const [fileName, setFileName] = useState<string | undefined>();

  function reset() {
    setDestination(""); setConferenceName(""); setStartDate(""); setEndDate("");
    setBudget(""); setMealsCovered(false); setMealsAmount("");
    setAccomCovered(false); setAccomAmount(""); setFileName(undefined);
  }

  function submit() {
    if (!destination || !conferenceName || !startDate || !endDate || !budget) {
      toast.error("Please fill all required fields");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      toast.error("End date must be after start date");
      return;
    }
    const app: Application = appendHistory(
      {
        id: newId(),
        applicantName: user.name,
        destination,
        conferenceName,
        startDate,
        endDate,
        estimatedBudget: Number(budget),
        mealsCoveredByConference: mealsCovered,
        mealsCoveredAmount: Number(mealsAmount) || 0,
        accommodationCoveredByConference: accomCovered,
        accommodationCoveredAmount: Number(accomAmount) || 0,
        documentName: fileName,
        submittedAt: new Date().toISOString(),
        status: "pending_council",
      },
      {
        at: new Date().toISOString(),
        actorName: user.name,
        actorRole: "applicant",
        action: "Application submitted",
        toStatus: "pending_council",
      }
    );
    upsertApplication(app);
    pushNotification({
      message: `New application ${app.id} submitted by ${user.name}`,
      applicationId: app.id,
      forRole: "council",
    });
    pushNotification({
      message: `Your application ${app.id} was submitted and is awaiting Council review`,
      applicationId: app.id,
      forUser: user.name,
    });
    toast.success("Application submitted and locked");
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Travel Grant Application</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Destination *</Label>
              <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Vienna, Austria" />
            </div>
            <div className="space-y-1">
              <Label>Conference Name *</Label>
              <Input value={conferenceName} onChange={(e) => setConferenceName(e.target.value)} placeholder="ICSE 2026" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Travel Start *</Label>
              <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Travel End *</Label>
              <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Estimated Budget (MKD) *</Label>
            <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="25000" />
          </div>

          <div className="rounded-md border p-3 space-y-3">
            <p className="text-sm font-medium">Coverage declarations</p>
            <div className="flex items-center gap-2">
              <Checkbox id="m" checked={mealsCovered} onCheckedChange={(v) => setMealsCovered(!!v)} />
              <Label htmlFor="m" className="font-normal">Conference covers meals</Label>
            </div>
            {mealsCovered && (
              <Input
                type="number" placeholder="Meals value (MKD)"
                value={mealsAmount} onChange={(e) => setMealsAmount(e.target.value)}
              />
            )}
            <div className="flex items-center gap-2">
              <Checkbox id="a" checked={accomCovered} onCheckedChange={(v) => setAccomCovered(!!v)} />
              <Label htmlFor="a" className="font-normal">Conference covers accommodation</Label>
            </div>
            {accomCovered && (
              <Input
                type="number" placeholder="Accommodation value (MKD)"
                value={accomAmount} onChange={(e) => setAccomAmount(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-1">
            <Label>Supporting document</Label>
            <Input type="file" onChange={(e) => setFileName(e.target.files?.[0]?.name)} />
            {fileName && <p className="text-xs text-muted-foreground">{fileName}</p>}
          </div>
          <p className="text-xs text-muted-foreground">
            Once submitted, the application is locked. It cannot be edited or resubmitted.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Submit Application</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function useCountdown(deadlineISO: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const ms = new Date(deadlineISO).getTime() - now;
  const expired = ms <= 0;
  const h = Math.floor(Math.abs(ms) / 3600000);
  const m = Math.floor((Math.abs(ms) % 3600000) / 60000);
  const s = Math.floor((Math.abs(ms) % 60000) / 1000);
  return { expired, label: `${h}h ${m}m ${s}s` };
}

function PostTravelReportDialog({ app, onClose }: { app: Application; onClose: () => void }) {
  const deadline = app.travelReport?.reportDeadline
    ?? new Date(new Date(app.endDate).getTime() + 48 * 3600 * 1000).toISOString();
  const { expired, label } = useCountdown(deadline);
  const [actual, setActual] = useState("");
  const [notes, setNotes] = useState("");
  const [fileName, setFileName] = useState<string | undefined>();

  function submit() {
    if (expired) {
      toast.error("48-hour window expired. Submission locked.");
      return;
    }
    if (!actual) {
      toast.error("Enter actual expenses");
      return;
    }
    const updated: Application = {
      ...app,
      status: "reconciliation",
      travelReport: {
        submittedAt: new Date().toISOString(),
        actualExpenses: Number(actual),
        notes,
        fileName,
        reportDeadline: deadline,
        late: false,
      },
    };
    upsertApplication(updated);
    toast.success("Travel report submitted. Sent to Finance for reconciliation.");
    onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Post-Travel Report — {app.id}</DialogTitle>
          <CardDescription>{app.destination} · {app.conferenceName}</CardDescription>
        </DialogHeader>
        <div className={`rounded-md p-3 text-sm font-medium ${expired ? "bg-red-100 text-red-900" : "bg-amber-50 text-amber-900 border border-amber-200"}`}>
          {expired ? "Deadline expired" : "Time remaining"}: <span className="font-mono">{label}</span>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Actual expenses (MKD)</Label>
            <Input type="number" value={actual} onChange={(e) => setActual(e.target.value)} disabled={expired} />
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} disabled={expired} />
          </div>
          <div className="space-y-1">
            <Label>Original travel documents</Label>
            <Input type="file" disabled={expired} onChange={(e) => setFileName(e.target.files?.[0]?.name)} />
            {fileName && <p className="text-xs text-muted-foreground">{fileName}</p>}
          </div>
          <p className="text-xs text-muted-foreground">
            Submitted: {fmtDate(app.endDate)} · Deadline: {fmtDate(deadline)}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={submit} disabled={expired}>Submit Report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
