export type Role =
  | "applicant"
  | "council"
  | "dean"
  | "finance"
  | "hr";

export const ROLE_LABELS: Record<Role, string> = {
  applicant: "Applicant",
  council: "Scientific Council",
  dean: "Dean's Office",
  finance: "Finance Service",
  hr: "HR",
};

export type Status =
  | "pending_council"
  | "pending_dean"
  | "approved"
  | "cash_advance_issued"
  | "pending_report"
  | "reconciliation"
  | "closed"
  | "rejected";

export const STATUS_LABELS: Record<Status, string> = {
  pending_council: "Pending Council Review",
  pending_dean: "Pending Dean Approval",
  approved: "Approved",
  cash_advance_issued: "Cash Advance Issued",
  pending_report: "Pending Travel Report",
  reconciliation: "Reconciliation",
  closed: "Closed",
  rejected: "Rejected",
};

export interface CashAdvance {
  hours: number;
  dailyRate: number;
  days: number;
  perDiemMultiplier: number; // 0, 0.5, 1
  perDiemTotal: number;
  mealsCovered: boolean;
  mealsDeduction: number;
  accommodationCovered: boolean;
  accommodationDeduction: number;
  conferenceFee: number;
  total: number;
  issuedAt: string;
}

export interface TravelReport {
  submittedAt: string;
  actualExpenses: number;
  notes: string;
  fileName?: string;
  reportDeadline: string; // ISO, 48h after return
  late: boolean;
}

export interface Reconciliation {
  cashAdvance: number;
  actualExpenses: number;
  balance: number; // positive = refund to faculty, negative = owe applicant
  confirmedAt: string;
  paymentConfirmationId: string;
}

export interface HistoryEntry {
  at: string;
  actorName: string;
  actorRole: Role | "system";
  action: string;
  fromStatus?: Status;
  toStatus?: Status;
  note?: string;
}

export interface Notification {
  id: string;
  at: string;
  message: string;
  applicationId?: string;
  forUser?: string; // applicant name
  forRole?: Role;
  read: boolean;
}

export interface Application {
  id: string;
  applicantName: string;
  destination: string;
  conferenceName: string;
  startDate: string;
  endDate: string;
  estimatedBudget: number;
  mealsCoveredByConference: boolean;
  accommodationCoveredByConference: boolean;
  mealsCoveredAmount: number;
  accommodationCoveredAmount: number;
  documentName?: string;
  submittedAt: string;
  status: Status;
  councilDecision?: { approved: boolean; reason: string; at: string };
  deanDecision?: { approved: boolean; reason: string; at: string };
  cashAdvance?: CashAdvance;
  travelReport?: TravelReport;
  reconciliation?: Reconciliation;
}

export interface Settings {
  annualBudget: number;
  dailyRate: number;
}
