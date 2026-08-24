import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/authContext";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to Finder" },
      {
        name: "description",
        content: "Sign in to Finder with your Google account to manage hiring and live skill sessions.",
      },
      { property: "og:title", content: "Sign in to Finder" },
      {
        property: "og:description",
        content: "Recruitment and live skill sessions, simplified.",
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
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background px-6 py-12">
      {/* Pattern + glow backdrop */}
      <div
        className="pointer-events-none fixed inset-0 bg-pattern opacity-60"
        style={{
          maskImage: "radial-gradient(ellipse at center, transparent 20%, black 55%, black 75%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, transparent 20%, black 55%, black 75%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none fixed left-1/2 top-0 -translate-x-1/2 opacity-40 blur-3xl"
        style={{
          width: "48rem",
          height: "28rem",
          background: "radial-gradient(circle, var(--color-primary) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 w-full max-w-[420px] text-center">
        {/* Logo mark */}
        <Link to="/" className="mb-10 inline-flex flex-col items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary shadow-sm">
            <span className="size-5 rounded-full border-[3px] border-primary-foreground" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-primary">Finder</h1>
            <p className="mt-1 text-sm text-muted-foreground">Recruitment and live skill sessions.</p>
          </div>
        </Link>

        {/* Login card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-panel sm:p-10">
          <h2 className="font-display text-xl font-semibold text-foreground">Welcome back</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to continue to your workspace.</p>

          <Button
            size="lg"
            disabled={loading}
            onClick={handleGoogleAuth}
            className="mt-8 h-12 w-full justify-center gap-3 border border-border bg-background text-foreground shadow-sm transition-all hover:bg-secondary hover:text-secondary-foreground"
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
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <Shield className="size-3" />
              Protected
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-foreground">
            Terms of Service
          </Link>
          <span className="size-1 rounded-full bg-muted-foreground/40" />
          <Link to="/" className="transition-colors hover:text-foreground">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
