import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { getUser, setUser, useStore } from "@/lib/stgs/store";
import { ROLE_LABELS, type Role } from "@/lib/stgs/types";
import { ApplicantView } from "@/components/stgs/ApplicantView";
import { ReviewQueue } from "@/components/stgs/ReviewQueue";
import { DeanView } from "@/components/stgs/DeanView";
import { FinanceView } from "@/components/stgs/FinanceView";
import { HRView } from "@/components/stgs/HRView";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "STGS — Dashboard" }] }),
  component: AppPage,
});

function AppPage() {
  const navigate = useNavigate();
  const user = useStore(() => getUser());

  useEffect(() => {
    if (!user) navigate({ to: "/" });
  }, [user, navigate]);

  if (!user) return null;

  function logout() {
    setUser(null);
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster richColors position="top-right" />
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold text-sm">
              S
            </div>
            <div>
              <div className="font-semibold text-sm leading-tight">STGS</div>
              <div className="text-xs text-muted-foreground leading-tight">Scientific Travel Grant System</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-muted-foreground">{ROLE_LABELS[user.role as Role]}</div>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>Sign out</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <RoleView role={user.role as Role} user={user} />
      </main>
    </div>
  );
}

function RoleView({ role, user }: { role: Role; user: { role: Role; name: string } }) {
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
          onApprove={(a) => ({
            ...a,
            status: "pending_dean",
            councilDecision: { approved: true, reason: "Approved", at: new Date().toISOString() },
          })}
          onReject={(a, reason) => ({
            ...a,
            status: "rejected",
            councilDecision: { approved: false, reason, at: new Date().toISOString() },
          })}
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
