import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { setUser } from "@/lib/stgs/store";
import { ROLE_LABELS, type Role } from "@/lib/stgs/types";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "STGS — Scientific Travel Grant System" },
      { name: "description", content: "FINKI Scientific Travel Grant System — role-based grant management." },
    ],
  }),
  component: LoginPage,
});

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  applicant: "Submit and track travel grant applications",
  council: "Review pending applications",
  dean: "Final approval and budget oversight",
  finance: "Cash advances and reconciliation",
  hr: "View approved and archived records",
};

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("applicant");
  const [name, setName] = useState("");

  function login() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Please enter your name");
      return;
    }
    setUser({ role, name: trimmed });
    navigate({ to: "/app" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Toaster richColors position="top-right" />
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-4 px-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            FINKI · Team 19
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Scientific Travel Grant System
          </h1>
          <p className="text-muted-foreground">
            A unified workflow for scientific travel grants — from application
            to reconciliation. Select your institutional role to continue.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-muted-foreground">
            <div>• Multi-level approvals</div>
            <div>• Budget enforcement</div>
            <div>• 48-hour reporting</div>
            <div>• Automated reconciliation</div>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Demo login — pick a role to enter the system.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dr. Ana Petrovska" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="grid gap-2">
                {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex items-start justify-between rounded-md border p-3 text-left transition ${
                      role === r
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <div>
                      <div className="font-medium text-sm">{ROLE_LABELS[r]}</div>
                      <div className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[r]}</div>
                    </div>
                    <div className={`h-4 w-4 rounded-full border-2 mt-1 ${role === r ? "border-primary bg-primary" : "border-muted-foreground/40"}`} />
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={login}>Enter STGS</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
