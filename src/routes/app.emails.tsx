import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Mail, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { clearEmailLog, getEmailLog, getUser, useStore } from "@/lib/stgs/store";
import { fmtDate } from "@/components/stgs/shared";
import { toast } from "sonner";

export const Route = createFileRoute("/app/emails")({
  component: EmailLogPage,
});

function EmailLogPage() {
  const navigate = useNavigate();
  const user = useStore(() => getUser());
  const log = useStore(() => getEmailLog());

  useEffect(() => {
    if (user && user.role !== "dean" && user.role !== "hr") {
      navigate({ to: "/app" });
    }
  }, [user, navigate]);

  if (!user || (user.role !== "dean" && user.role !== "hr")) return null;

  function clear() {
    if (!confirm("Clear the entire email audit log?")) return;
    clearEmailLog();
    toast.success("Email log cleared");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/app" })} className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> Email Notifications Log
            </h2>
            <p className="text-sm text-muted-foreground">
              Audit trail of all transactional emails dispatched by the STGS workflow.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={clear} className="gap-1.5">
          <Trash2 className="h-3.5 w-3.5" /> Clear log
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total emails sent" value={log.length} />
        <Stat label="Unique recipients" value={new Set(log.map((e) => e.recipientEmail)).size} />
        <Stat label="Last dispatch" value={log[0] ? fmtDate(log[0].at) : "—"} />
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base font-mono tracking-tight text-muted-foreground">
            mail.finki.ukim.mk · outbound · {log.length} message(s)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {log.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No emails have been dispatched yet. Workflow events (approvals, advances,
              reconciliations) will appear here automatically.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[170px]">Timestamp</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="w-[130px]">Application</TableHead>
                  <TableHead className="w-[170px]">Triggered by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {log.map((e) => (
                  <TableRow key={e.id} className="align-top">
                    <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {fmtDate(e.at)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{e.recipientName}</div>
                      <div className="text-xs font-mono text-muted-foreground">{e.recipientEmail}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{e.subject}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{e.body}</div>
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {e.applicationId ? (
                        <Link to="/app/$id" params={{ id: e.applicationId }} className="text-primary hover:underline">
                          {e.applicationId}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.triggeredBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground">
        This log is a simulated audit trail. In production it reflects messages delivered via the
        faculty SMTP relay (mail.finki.ukim.mk).
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
