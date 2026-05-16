import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { LogOut } from "lucide-react";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && !user) navigate({ to: "/" });
  }, [mounted, user, navigate]);

  if (!mounted || !user) return null;

  function logout() {
    setUser(null);
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-white">
      <Toaster richColors position="top-right" />
      <header className="border-b border-primary/20 bg-primary text-primary-foreground shadow-sm">
        <div className="mx-auto max-w-[1400px] flex items-center justify-between px-8 py-3">
          {/* FINKI brand */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-md bg-white text-primary grid place-items-center font-extrabold text-lg shadow-sm">
              F
            </div>
            <div className="leading-tight">
              <div className="font-extrabold text-lg tracking-wide">FINKI</div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-white/80">STGS</div>
            </div>
          </div>

          {/* System name */}
          <div className="hidden md:block text-center">
            <div className="text-sm font-semibold tracking-wide">Scientific Travel Grant System</div>
            <div className="text-[11px] text-white/70">Faculty Administration Portal</div>
          </div>

          {/* User + logout */}
          <div className="flex items-center gap-4">
            <div className="text-right leading-tight">
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-[11px] text-white/75">{ROLE_LABELS[user.role as Role]}</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-white/15 grid place-items-center text-sm font-semibold">
              {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <Button variant="secondary" size="sm" onClick={logout} className="gap-1.5">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-8 py-8">
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
