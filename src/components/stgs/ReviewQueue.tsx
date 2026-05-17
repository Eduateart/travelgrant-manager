import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getApplications, upsertApplication, useStore } from "@/lib/stgs/store";
import type { Application, Status } from "@/lib/stgs/types";
import { StatusBadge, fmtMKD } from "./shared";

interface Props {
  title: string;
  description: string;
  filterStatus: Status;
  onApprove: (app: Application) => Application;
  onReject: (app: Application, reason: string) => Application;
  decisionLabel: string;
}

export function ReviewQueue({ title, description, filterStatus, onApprove, onReject, decisionLabel }: Props) {
  const apps = useStore(() => getApplications().filter((a) => a.status === filterStatus));
  const [selected, setSelected] = useState<Application | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");

  function commit() {
    if (!selected || !action) return;
    if (action === "reject" && !reason.trim()) {
      toast.error("Provide a reason for rejection");
      return;
    }
    const updated = action === "approve" ? onApprove(selected) : onReject(selected, reason);
    upsertApplication(updated);
    toast.success(`Application ${action === "approve" ? "approved" : "rejected"}`);
    setSelected(null); setAction(null); setReason("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {apps.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No applications awaiting your review.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Conference</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">{decisionLabel}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">
                      <Link to="/app/$id" params={{ id: a.id }} className="text-primary hover:underline">{a.id}</Link>
                    </TableCell>
                    <TableCell>{a.applicantName}</TableCell>
                    <TableCell>{a.destination}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{a.conferenceName}</TableCell>
                    <TableCell>{fmtMKD(a.estimatedBudget)}</TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" onClick={() => { setSelected(a); setAction("approve"); }}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelected(a); setAction("reject"); }}>Reject</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && (setSelected(null), setAction(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Approve" : "Reject"} {selected?.id}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Applicant:</span> {selected.applicantName}</div>
              <div><span className="text-muted-foreground">Destination:</span> {selected.destination}</div>
              <div><span className="text-muted-foreground">Conference:</span> {selected.conferenceName}</div>
              <div><span className="text-muted-foreground">Budget:</span> {fmtMKD(selected.estimatedBudget)}</div>
              <div className="space-y-1">
                <label className="font-medium">Reason {action === "reject" && "*"}</label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelected(null); setAction(null); }}>Cancel</Button>
            <Button onClick={commit}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
