import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Briefcase, Radio, Search, Bell, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/authContext";

const nav = [
  { to: "/jobs", label: "Internships & Jobs", short: "Jobs", icon: Briefcase },
  { to: "/sessions", label: "Live Sessions", short: "Sessions", icon: Radio },
] as const;


export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("finder:sidebar-collapsed");
    if (stored === "1") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem("finder:sidebar-collapsed", prev ? "0" : "1");
      return !prev;
    });
  };

  useEffect(() => {
    if (!loading && !isAuthenticated && !pathname.startsWith("/auth")) {
      void navigate({ to: "/auth" });
    }
  }, [isAuthenticated, loading, pathname, navigate]);

  useEffect(() => {
    if (!loading && isAuthenticated && pathname.startsWith("/auth")) {
      void navigate({ to: "/" });
    }
  }, [isAuthenticated, loading, pathname, navigate]);

  if (pathname.startsWith("/auth")) return <>{children}</>;

  const initials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "RC"
    : "RC";

  return (
    <TooltipProvider delayDuration={120}>
    <div className="min-h-screen lg:flex">
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:sticky lg:top-0 lg:flex lg:h-screen",
          collapsed ? "w-[4.5rem]" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border/70",
            collapsed ? "justify-center px-2" : "gap-2.5 px-4",
          )}
        >
          <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Finder home">
           
            {!collapsed && (
              <span className="truncate font-display text-lg font-semibold tracking-tight">
                Collabbit<span className="text-primary">Pro</span>
              </span>
            )}
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 p-3">
          {!collapsed && <p className="text-eyebrow px-2 pb-1.5">Workspace</p>}
          {nav.map((item) => {
            const active = pathname.startsWith(item.to);
            const link = (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group relative flex items-center rounded-xl text-sm font-medium transition-all",
                  collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-panel"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                )}
              >
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-opacity",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-sidebar-accent/50 text-muted-foreground group-hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );

            return collapsed ? (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              link
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border/70 p-3">
          <Button
            variant="ghost"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "w-full text-muted-foreground hover:text-foreground",
              collapsed ? "justify-center px-0" : "justify-start gap-2",
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <>
                <PanelLeftClose className="size-4" />
                <span className="text-sm">Collapse</span>
              </>
            )}
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
          <div className="relative hidden max-w-md flex-1 sm:block">
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
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={async () => {
                await signOut();
                void navigate({ to: "/auth" });
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="size-4" />
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/profile" aria-label="Profile">
                  <Avatar className="size-9 border-2 border-border/60 ring-2 ring-transparent transition-all hover:ring-primary/40 hover:border-primary/60">
                    {user?.avatarUrl && (
                      <AvatarImage
                        src={user.avatarUrl}
                        alt={user?.name ?? "User"}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end" className="max-w-[200px]">
                <p className="font-medium truncate">{user?.name ?? "Profile"}</p>
                {user?.email && (
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        <main className="relative flex-1 px-4 py-6 md:px-8 md:py-10">{children}</main>

        <nav className="sticky bottom-0 z-20 flex border-t border-border bg-background/95 backdrop-blur lg:hidden">
          {nav.map((item) => {
            const active = pathname.startsWith(item.to);
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
                {item.short}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
    </TooltipProvider>
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
