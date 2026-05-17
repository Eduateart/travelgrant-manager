import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApplications, useStore } from "@/lib/stgs/store";
import { StatusBadge, fmtMKD, fmtDate } from "./shared";

export function HRView() {
  const all = useStore(() => getApplications());
  const approved = all.filter((a) =>
    ["approved", "cash_advance_issued", "pending_report", "reconciliation", "closed"].includes(a.status)
  );
  const archived = all.filter((a) => a.status === "closed");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Human Resources</h2>
        <p className="text-sm text-muted-foreground">
          View all approved travel grants and archived records.
        </p>
      </div>

      <Tabs defaultValue="approved">
        <TabsList>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="archive">Archive ({archived.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="approved">
          <AppTable rows={approved} />
        </TabsContent>
        <TabsContent value="archive">
          <AppTable rows={archived} archive />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AppTable({ rows, archive = false }: { rows: ReturnType<typeof getApplications>; archive?: boolean }) {
  return (
    <Card>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No records.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Conference</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>{archive ? "Balance" : "Advance"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">
                    <Link to="/app/$id" params={{ id: a.id }} className="text-primary hover:underline">{a.id}</Link>
                  </TableCell>
                  <TableCell>{a.applicantName}</TableCell>
                  <TableCell>{a.destination}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{a.conferenceName}</TableCell>
                  <TableCell className="text-xs">{fmtDate(a.submittedAt)}</TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                  <TableCell>
                    {archive
                      ? a.reconciliation ? fmtMKD(a.reconciliation.balance) : "—"
                      : a.cashAdvance ? fmtMKD(a.cashAdvance.total) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
