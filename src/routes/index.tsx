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
import { useAuth } from "@/lib/authContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Finder Overview — Hiring & Live Sessions Dashboard" },
      {
        name: "description",
        content:
          "Track open roles, live skill sessions and incoming applicants across your Finder workspace.",
      },
      { property: "og:title", content: "Finder Overview — Hiring Dashboard" },
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
  const [statsData, setStatsData] = useState<DashboardStats>({
    activePosts: 8,
    liveSessions: 3,
    applicants: 426,
    hireRate: "18%",
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
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const stats = [
    {
      label: "Active posts",
      value: String(statsData.activePosts),
      delta: "+2 this week",
      icon: Briefcase,
    },
    {
      label: "Live sessions",
      value: String(statsData.liveSessions),
      delta: "1 running now",
      icon: Radio,
    },
    { label: "Applicants", value: String(statsData.applicants), delta: "+38 today", icon: Users },
    { label: "Hire rate", value: statsData.hireRate, delta: "+3.2% vs last mo", icon: TrendingUp },
  ];

  const displayName = user?.name?.split(" ")[0] || "Aditya";

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Workspace"
        title={`Good evening, ${displayName}`}
        description="Here's what's moving across your internships, jobs and live skill sessions today."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/sessions">Schedule session</Link>
            </Button>
            <Button asChild>
              <Link to="/jobs">Post a role</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="panel p-5">
            <div className="flex items-center justify-between">
              <p className="text-eyebrow">{s.label}</p>
              <s.icon className="size-4 text-primary" />
            </div>
            <p className="mt-3 font-display text-3xl font-semibold">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.delta}</p>
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
              <span className="text-xs text-muted-foreground">{liveNow.enrolled} joined</span>
            </div>
            <h2 className="mt-1.5 text-lg font-semibold">{liveNow.title}</h2>
            <p className="text-sm text-muted-foreground">
              Hosted by {liveNow.host} · {liveNow.meetLink}
            </p>
          </div>
          <Button>Join Meet</Button>
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
          <ul className="divide-y divide-border">
            {recentApplicants.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-3">
                <Avatar className="size-9 border border-border">
                  <AvatarFallback className="bg-secondary text-xs">{a.initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.target}</p>
                </div>
                <Badge variant="secondary" className={stageTone[a.stage]}>
                  {a.stage}
                </Badge>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Top performing posts</h2>
            <Link to="/jobs" className="text-sm text-primary hover:underline">
              Manage
            </Link>
          </div>
          <div className="space-y-5">
            {topPosts.map((j) => (
              <div key={j.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-sm font-medium">{j.title}</p>
                  <span className="text-xs text-muted-foreground">{j.applicants}</span>
                </div>
                <Progress value={Math.min(100, j.applicants)} className="mt-2 h-1.5" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
