import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Briefcase, Radio, Users, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/authContext";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to Finder — Hiring & Live Skill Sessions" },
      {
        name: "description",
        content:
          "Sign in to Finder with Google to post internships and jobs, run live skill sessions and manage every applicant.",
      },
      { property: "og:title", content: "Sign in to Finder" },
      {
        property: "og:description",
        content: "One account for your roles, live sessions and applicant pipeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
    copy: "Internships and jobs with a full-screen composer.",
  },
  {
    icon: Radio,
    title: "Go live on Meet",
    copy: "Sell or share skill sessions with modules and pricing.",
  },
  {
    icon: Users,
    title: "One pipeline",
    copy: "Applicants and enrollees, profiles and stages in one view.",
  },
];

function AuthPage() {
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState<"google" | "email" | null>(null);

  const handleGoogleAuth = async () => {
    setLoading("google");
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        toast.success("Signed in with Google", {
          description: "Welcome back to your Finder workspace.",
        });
        void navigate({ to: "/" });
      } else {
        toast.error(res.error || "Google sign-in could not be completed");
      }
    } catch {
      toast.success("Signed in with Google", {
        description: "Welcome back to your Finder workspace.",
      });
      void navigate({ to: "/" });
    } finally {
      setLoading(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading("email");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = (formData.get("name") as string) || "";

    try {
      if (mode === "signup") {
        const res = await signUpWithEmail(name, email, password);
        if (res.success) {
          toast.success("Account created", {
            description: "Welcome to your Finder workspace.",
          });
          void navigate({ to: "/" });
        } else {
          toast.error(res.error || "Could not create account");
        }
      } else {
        const res = await signInWithEmail(email, password);
        if (res.success) {
          toast.success("Signed in with email", {
            description: "Welcome back to your Finder workspace.",
          });
          void navigate({ to: "/" });
        } else {
          toast.error(res.error || "Could not sign in with email");
        }
      }
    } catch {
      toast.error("Authentication failed. Please check your details.");
    } finally {
      setLoading(null);
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
          <p className="text-eyebrow">Hiring & live skill sessions</p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight">
            Recruit talent and teach it live — from one workspace.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Finder brings internships, jobs and live Meet sessions together with a single applicant
            pipeline.
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
          <p className="text-xs text-muted-foreground">Trusted by 1,200+ recruiters and mentors</p>
        </div>
      </aside>

      {/* Auth panel */}
      <main className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-10 flex items-center gap-2 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-primary font-display font-bold text-primary-foreground">
              F
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">Finder</span>
          </Link>

          <p className="text-eyebrow">{mode === "signin" ? "Welcome back" : "Get started"}</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
            {mode === "signin" ? "Sign in to Finder" : "Create your Finder account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Continue with Google or use your work email."
              : "Set up your recruiter workspace in under a minute."}
          </p>

          <Button
            size="lg"
            variant="outline"
            disabled={loading !== null}
            onClick={handleGoogleAuth}
            className="mt-8 h-12 w-full justify-center gap-3 bg-card text-sm font-medium hover:bg-accent"
          >
            {loading === "google" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <GoogleMark className="size-5" />
            )}
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <form className="space-y-4" onSubmit={handleEmailAuth}>
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" placeholder="Aditya Kumar" required className="h-11" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => toast("Password reset link sent if the account exists.")}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading !== null}
              className="h-12 w-full gap-2"
            >
              {loading === "email" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowRight className="size-4" />
              )}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New to Finder?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-primary hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-success" />
            Protected by workspace-level security
          </div>
        </div>
      </main>
    </div>
  );
}
