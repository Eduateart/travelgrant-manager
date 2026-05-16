import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type Status } from "@/lib/stgs/types";

const variants: Record<Status, string> = {
  pending_council: "bg-amber-100 text-amber-900 border-amber-200",
  pending_dean: "bg-amber-100 text-amber-900 border-amber-200",
  approved: "bg-emerald-100 text-emerald-900 border-emerald-200",
  cash_advance_issued: "bg-blue-100 text-blue-900 border-blue-200",
  pending_report: "bg-purple-100 text-purple-900 border-purple-200",
  reconciliation: "bg-indigo-100 text-indigo-900 border-indigo-200",
  closed: "bg-slate-200 text-slate-800 border-slate-300",
  rejected: "bg-red-100 text-red-900 border-red-200",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant="outline" className={variants[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function fmtMKD(n: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(n)) + " MKD";
}

export function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
