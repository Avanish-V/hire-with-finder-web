import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Briefcase,
  Radio,
  Users,
  UserRound,
  Search,
  Bell,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/jobs", label: "Jobs & Internships", icon: Briefcase },
  { to: "/sessions", label: "Live Skill Sessions", icon: Radio },
  { to: "/applicants", label: "Applicants", icon: Users },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Auth is a standalone full-page experience without app chrome.
  if (pathname.startsWith("/auth")) return <>{children}</>;

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <Link to="/" className="mb-8 flex items-center gap-2 px-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">
            F
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">Finder</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className={cn("size-4", active && "text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="panel mt-6 p-4">
          <p className="text-eyebrow">Hiring plan</p>
          <p className="mt-2 text-sm text-muted-foreground">
            8 of 10 active posts used this month.
          </p>
          <Button size="sm" className="mt-3 w-full">
            Upgrade workspace
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur md:px-8">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-primary font-display font-bold text-primary-foreground">
              F
            </span>
          </Link>
          <div className="relative hidden max-w-sm flex-1 sm:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search roles, sessions, candidates"
              className="pl-9"
              aria-label="Search"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="size-4" />
            </Button>
            <Avatar className="size-9 border border-border">
              <AvatarFallback className="bg-secondary text-xs font-semibold">AK</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-10">{children}</main>

        <nav className="sticky bottom-0 z-20 flex border-t border-border bg-background/95 backdrop-blur lg:hidden">
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label.split(" ")[0]}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="text-eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold md:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
