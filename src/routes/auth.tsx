import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Briefcase, Radio, Users, ShieldCheck, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/authContext";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to Finder — Hiring & Live Skill Sessions" },
      {
        name: "description",
        content:
          "Sign in to Finder with your Google account to post internships and jobs, run live skill sessions and manage applicants.",
      },
      { property: "og:title", content: "Sign in to Finder" },
      {
        property: "og:description",
        content: "One account for your roles, live sessions and applicant pipeline.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AuthPage,
});

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.93l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.28a12 12 0 0 0 0 10.74l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.18 15.23 0 12 0A12 12 0 0 0 1.28 6.63l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75Z"
      />
    </svg>
  );
}

const highlights = [
  {
    icon: Briefcase,
    title: "Post roles in minutes",
    copy: "Internships and jobs with instant publishing.",
  },
  {
    icon: Radio,
    title: "Go live on Google Meet",
    copy: "Host live skill courses & workshops for students.",
  },
  {
    icon: Users,
    title: "Unified Pipeline",
    copy: "Applicants and course enrollees in one dashboard.",
  },
];

function AuthPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      void navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        toast.success("Welcome back! Redirecting...");
        void navigate({ to: "/" });
      } else {
        toast.error(res.error || "Google sign-in could not be completed.");
        setLoading(false);
      }
    } catch (err: any) {
      toast.error(err?.message || "An error occurred during sign-in.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Brand / value panel */}
      <aside className="relative hidden overflow-hidden border-r border-border bg-sidebar px-12 py-14 lg:flex lg:flex-col">
        <div
          className="pointer-events-none absolute -left-24 -top-24 size-[28rem] rounded-full opacity-70 blur-3xl"
          style={{
            background: "radial-gradient(circle, var(--color-primary) 0%, transparent 62%)",
            opacity: 0.18,
          }}
        />
        <Link to="/" className="relative flex items-center gap-2">
          <span className="grid size-10 place-items-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">
            F
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">Finder</span>
        </Link>

        <div className="relative mt-auto max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            <span>Firebase Auth Protection</span>
          </div>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight">
            Recruit talent and run live skill courses.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Finder brings jobs, internships, and live skill courses together in a single workspace.
          </p>

          <div className="mt-10 space-y-4">
            {highlights.map((h) => (
              <div key={h.title} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-secondary">
                  <h.icon className="size-4 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-medium">{h.title}</p>
                  <p className="text-sm text-muted-foreground">{h.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-auto flex items-center gap-3 pt-12">
          <div className="flex -space-x-2">
            {["AK", "MR", "JS", "PL"].map((i) => (
              <span
                key={i}
                className="grid size-8 place-items-center rounded-full border border-border bg-secondary text-[10px] font-semibold"
              >
                {i}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Trusted by recruiters & instructors</p>
        </div>
      </aside>

      {/* Auth panel */}
      <main className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md text-center sm:text-left">
          <Link to="/" className="mb-10 flex items-center gap-2 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-primary font-display font-bold text-primary-foreground">
              F
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">Finder</span>
          </Link>

          <p className="text-eyebrow">Recruiter & Instructor Portal</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
            Sign in to HireWithFinder
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use your Google account to access your hiring dashboard and skill sessions.
          </p>

          <div className="mt-8 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
            <Button
              size="lg"
              disabled={loading}
              onClick={handleGoogleAuth}
              className="h-13 w-full justify-center gap-3 text-base font-medium shadow-sm transition-all hover:scale-[1.01]"
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <GoogleMark className="size-5" />
              )}
              Continue with Google Account
            </Button>

            <div className="mt-6 space-y-2 text-left text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Instant sign-in via Firebase OAuth (No passwords needed)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Seamless sync with your PostgreSQL recruiter profile</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground sm:justify-start">
            <ShieldCheck className="size-4 text-primary" />
            Protected by enterprise-grade Firebase authentication
          </div>
        </div>
      </main>
    </div>
  );
}
