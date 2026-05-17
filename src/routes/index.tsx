import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setUser } from "@/lib/stgs/store";
import { ROLE_LABELS, type Role } from "@/lib/stgs/types";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { GraduationCap, ShieldCheck, Wallet, Users, FileText, ChevronRight, Send, ClipboardCheck, Stamp, Banknote, Plane, Scale, Archive } from "lucide-react";

const WORKFLOW_STEPS: { icon: React.ComponentType<{ className?: string }>; label: string; sub: string }[] = [
  { icon: Send, label: "Application", sub: "Applicant submits" },
  { icon: ClipboardCheck, label: "Council Review", sub: "Scientific Council" },
  { icon: Stamp, label: "Dean Approval", sub: "Dean's Office" },
  { icon: Banknote, label: "Cash Advance", sub: "Finance issues" },
  { icon: Plane, label: "Travel", sub: "Trip & report (48h)" },
  { icon: Scale, label: "Reconciliation", sub: "Finance balances" },
  { icon: Archive, label: "Closed", sub: "HR archives" },
];

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

const ROLE_ICONS: Record<Role, React.ComponentType<{ className?: string }>> = {
  applicant: FileText,
  council: Users,
  dean: ShieldCheck,
  finance: Wallet,
  hr: GraduationCap,
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
    <div className="min-h-screen bg-white flex flex-col">
      <Toaster richColors position="top-right" />

      {/* Top brand bar */}
      <header className="bg-primary text-primary-foreground border-b">
        <div className="mx-auto max-w-[1400px] flex items-center justify-between px-8 py-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-md bg-white text-primary grid place-items-center font-extrabold text-lg shadow-sm">
              F
            </div>
            <div className="leading-tight">
              <div className="font-extrabold text-lg tracking-wide">FINKI</div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-white/80">STGS</div>
            </div>
          </div>
          <div className="text-xs text-white/80 hidden sm:block">
            Faculty of Computer Science and Engineering · Ss. Cyril and Methodius University
          </div>
        </div>
      </header>

      {/* Main centered card */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gradient-to-br from-white via-blue-50/40 to-blue-100/30">
        <div className="w-full max-w-[1100px] bg-white rounded-xl border shadow-xl overflow-hidden grid lg:grid-cols-[1.05fr_1fr]">
          {/* Left info panel */}
          <div className="bg-primary text-primary-foreground p-10 lg:p-12 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-wider">
                Team 19 · 2026
              </div>
              <h1 className="mt-6 text-3xl xl:text-4xl font-bold tracking-tight leading-tight">
                Scientific Travel<br />Grant System
              </h1>
              <p className="mt-4 text-sm text-white/85 max-w-md">
                A unified institutional workflow for scientific travel grants —
                from application through council and dean approval, finance
                disbursement, and post-travel reconciliation.
              </p>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] text-white/90">
              <div>• Multi-level approvals</div>
              <div>• Budget enforcement</div>
              <div>• 48-hour reporting</div>
              <div>• Automated reconciliation</div>
              <div>• Per-diem calculation</div>
              <div>• Full audit history</div>
            </div>
          </div>

          {/* Right form panel */}
          <div className="p-10 lg:p-12">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Sign in to STGS</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Select your institutional role to continue.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="fullname" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Full name
                </Label>
                <Input
                  id="fullname"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Ana Petrovska"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Role
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(ROLE_LABELS) as Role[]).map((r) => {
                    const Icon = ROLE_ICONS[r];
                    const active = role === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`flex items-start gap-3 rounded-md border p-3 text-left transition ${
                          active
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:bg-accent hover:border-primary/30"
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-md grid place-items-center shrink-0 ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-foreground">{ROLE_LABELS[r]}</div>
                          <div className="text-[11px] text-muted-foreground leading-snug">{ROLE_DESCRIPTIONS[r]}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button className="w-full h-10" onClick={login}>Enter STGS</Button>
              <p className="text-[11px] text-center text-muted-foreground">
                Demo environment · Data persists in your browser only
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-3 text-[11px] text-muted-foreground flex justify-between">
          <div>© 2026 FINKI · Faculty of Computer Science and Engineering</div>
          <div>STGS v1.0 · Internal Use</div>
        </div>
      </footer>
    </div>
  );
}
