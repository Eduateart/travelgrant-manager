import { createFileRoute } from "@tanstack/react-router";
import { getUser, useStore } from "@/lib/stgs/store";
import type { Role } from "@/lib/stgs/types";
import { ApplicantView } from "@/components/stgs/ApplicantView";
import { ReviewQueue } from "@/components/stgs/ReviewQueue";
import { DeanView } from "@/components/stgs/DeanView";
import { FinanceView } from "@/components/stgs/FinanceView";
import { HRView } from "@/components/stgs/HRView";
import { transitionApplication } from "@/lib/stgs/store";

export const Route = createFileRoute("/app/")({
  component: DashboardPage,
});

function DashboardPage() {
  const user = useStore(() => getUser());
  if (!user) return null;
  const role = user.role as Role;

  switch (role) {
    case "applicant":
      return <ApplicantView user={user} />;
    case "council":
      return (
        <ReviewQueue
          title="Scientific Council Review"
          description="Review pending travel grant applications."
          filterStatus="pending_council"
          decisionLabel="Decision"
          onApprove={(a) =>
            transitionApplication(
              a,
              "pending_dean",
              { name: user.name, role: "council" },
              {
                action: "Council approved",
                mutate: (x) => ({
                  ...x,
                  councilDecision: { approved: true, reason: "Approved", at: new Date().toISOString() },
                }),
                notify: {
                  message: `Your application ${a.id} was approved by the Scientific Council`,
                  forUser: a.applicantName,
                },
              }
            )
          }
          onReject={(a, reason) =>
            transitionApplication(
              a,
              "rejected",
              { name: user.name, role: "council" },
              {
                action: "Council rejected",
                note: reason,
                mutate: (x) => ({
                  ...x,
                  councilDecision: { approved: false, reason, at: new Date().toISOString() },
                }),
                notify: {
                  message: `Your application ${a.id} was rejected by the Scientific Council`,
                  forUser: a.applicantName,
                },
              }
            )
          }
        />
      );
    case "dean":
      return <DeanView />;
    case "finance":
      return <FinanceView />;
    case "hr":
      return <HRView />;
  }
}
