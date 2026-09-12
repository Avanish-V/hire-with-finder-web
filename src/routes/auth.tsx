import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BriefcaseBusiness, Check, Loader2, Radio, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/authContext";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to Finder" },
      {
        name: "description",
        content: "Sign in to Finder to manage jobs, internships, applicants, and live skill sessions in one focused workspace.",
      },
      { property: "og:title", content: "Sign in to Finder" },
      {
        property: "og:description",
        content: "Move promising people from application to opportunity with Finder.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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

function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, signInWithGoogle } = useAuth();
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
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-pattern opacity-35" />
      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-12 px-6 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-12 xl:gap-24">
        <section className="flex flex-col justify-center py-6 lg:py-12">
          <Link to="/" className="inline-flex w-fit items-center gap-3" aria-label="Finder home">
            <span className="grid size-11 place-items-center rounded-lg bg-primary font-display text-xl font-bold text-primary-foreground shadow-glow">
              F
            </span>
            <span className="font-display text-2xl font-bold text-foreground">Finder<span className="text-primary">.</span></span>
          </Link>

          <div className="mt-14 max-w-2xl lg:mt-20">
            <p className="text-eyebrow text-primary">Built for modern recruitment</p>
            <h1 className="mt-5 text-4xl font-bold leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
              Find the people who move your company forward.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Publish internships and jobs, manage every applicant, and host live skill sessions from one focused workspace.
            </p>
          </div>

          <div className="mt-10 grid max-w-xl gap-3 sm:grid-cols-3">
            {[
              { icon: BriefcaseBusiness, label: "Post opportunities" },
              { icon: UsersRound, label: "Manage applicants" },
              { icon: Radio, label: "Host live sessions" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 border-l-2 border-primary pl-3 text-sm font-medium text-foreground">
                <Icon className="size-4 shrink-0 text-primary" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="grid size-7 place-items-center rounded-full bg-success text-success-foreground">
              <Check className="size-4" />
            </span>
            One clear pipeline, from first application to final decision.
          </div>
        </section>

        <section className="flex justify-center lg:justify-end">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-panel sm:p-10">
            <div className="mb-8 flex items-center gap-2 lg:hidden">
              <span className="grid size-9 place-items-center rounded-lg bg-primary font-display font-bold text-primary-foreground">F</span>
              <span className="font-display text-xl font-bold">Finder<span className="text-primary">.</span></span>
            </div>
            <p className="text-eyebrow text-primary">Recruiter access</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-foreground">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Continue to your hiring and learning workspace.</p>

          <Button
            size="lg"
            disabled={loading}
            onClick={handleGoogleAuth}
            className="mt-8 h-12 w-full justify-center gap-3 bg-primary text-primary-foreground shadow-glow transition-all hover:bg-primary/90"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <GoogleMark className="size-5" />
            )}
            <span className="text-sm font-medium">Continue with Google</span>
          </Button>

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Secure access</span>
            <div className="h-px flex-1 bg-border" />
          </div>
            <p className="mt-8 text-center text-xs leading-5 text-muted-foreground">
              By continuing, you agree to Finder&apos;s Terms of Service and Privacy Policy.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
