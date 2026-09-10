import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Briefcase, Radio, Users, TrendingUp, ArrowRight, Video } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { stageTone, type Applicant, type LiveSession } from "@/lib/finder-data";
import { getDashboardData, type DashboardStats } from "@/services/dashboardService";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/authContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Collabbit Overview — Hiring & Live Sessions Dashboard" },
      {
        name: "description",
        content:
          "Track open roles, live skill sessions and incoming applicants across your Collabbit workspace.",
      },
      { property: "og:title", content: "Collabbit Overview — Hiring Dashboard" },
      {
        property: "og:description",
        content: "Roles, live sessions and applicant pipeline at a glance.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<DashboardStats>({
    activePosts: 0,
    liveSessions: 0,
    applicants: 0,
    hireRate: "0%",
  });
  const [liveNow, setLiveNow] = useState<LiveSession | null>(null);
  const [recentApplicants, setRecentApplicants] = useState<Applicant[]>([]);
  const [topPosts, setTopPosts] = useState<{ id: string; title: string; applicants: number }[]>([]);

  useEffect(() => {
    let isMounted = true;
    getDashboardData().then((data) => {
      if (isMounted) {
        setStatsData(data.stats);
        setLiveNow(data.liveNowSession);
        setRecentApplicants(data.recentApplicants);
        setTopPosts(data.topPerformingJobs);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const stats = [
    { label: "Active posts", value: String(statsData.activePosts), icon: Briefcase },
    { label: "Live sessions", value: String(statsData.liveSessions), icon: Radio },
    { label: "Applicants", value: String(statsData.applicants), icon: Users },
    { label: "Hire rate", value: statsData.hireRate, icon: TrendingUp },
  ];

  const displayName = user?.name ? user.name.split(" ")[0] : "Recruiter";

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Workspace"
        title={`Good evening, ${displayName}`}
        description="Here's what's moving across your internships, jobs and live skill sessions today."
        
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="panel p-5">
            <div className="flex items-center justify-between">
              <p className="text-eyebrow">{s.label}</p>
              <s.icon className="size-4 text-primary" />
            </div>
            {loading ? (
              <Skeleton className="mt-3 h-9 w-16" />
            ) : (
              <p className="mt-3 font-display text-3xl font-semibold">{s.value}</p>
            )}
          </div>
        ))}
      </div>

      {liveNow && (
        <div className="panel mt-6 flex flex-wrap items-center gap-5 border-primary/40 p-6">
          <span className="grid size-12 place-items-center rounded-xl bg-primary/15 text-primary">
            <Video className="size-5" />
          </span>
          <div className="min-w-[16rem] flex-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-live/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-live">
                <span className="size-1.5 animate-pulse rounded-full bg-live" /> Live now
              </span>
              {liveNow.isJoinLinkEnabled === false && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                  Link Disabled for Candidates
                </span>
              )}
              <span className="text-xs text-muted-foreground">{liveNow.enrolled} joined</span>
            </div>
            <h2 className="mt-1.5 text-lg font-semibold">{liveNow.title}</h2>
            <p className="text-sm text-muted-foreground">
              Hosted by {liveNow.host} · {liveNow.meetLink}
            </p>
          </div>
          <Link to="/sessions">
            <Button>Open Sessions</Button>
          </Link>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent applicants</h2>
            <Link
              to="/applicants"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : recentApplicants.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No applicants yet.</p>
          ) : (
          <ul className="divide-y divide-border">
            {(recentApplicants || []).map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-3">
                <Avatar className="size-9 border border-border">
                  <AvatarFallback className="bg-secondary text-xs">{a.initials || "AP"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.target}</p>
                </div>
                <Badge variant="secondary" className={stageTone[a.stage] || "bg-muted text-muted-foreground"}>
                  {a.stage || "New"}
                </Badge>
              </li>
            ))}
          </ul>
          )}
        </section>

        <section className="panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Top performing posts</h2>
            <Link to="/jobs" className="text-sm text-primary hover:underline">
              Manage
            </Link>
          </div>
          {loading ? (
            <div className="space-y-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-1.5 w-full" />
                </div>
              ))}
            </div>
          ) : topPosts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No posts yet.</p>
          ) : (
          <div className="space-y-5">
            {(topPosts || []).map((j) => (
              <div key={j.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-sm font-medium">{j.title}</p>
                  <span className="text-xs text-muted-foreground">{j.applicants}</span>
                </div>
                <Progress value={Math.min(100, j.applicants)} className="mt-2 h-1.5" />
              </div>
            ))}
          </div>
          )}
        </section>
      </div>
    </div>
  );
}
