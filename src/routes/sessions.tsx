import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Calendar,
  Clock,
  Users,
  Video,
  Copy,
  MoreHorizontal,
  X,
  ImagePlus,
  Trash2,
  Link2,
  Link2Off,
  PlayCircle,
  Pencil,
  Search,
  Loader2,
  Layers,
  Sparkles,
  CheckCircle2,
  BookOpen,
  AlertCircle,
  Tag,
  GraduationCap,
  Eye,
  Check,
  HelpCircle,
  Info,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { FullScreenComposer, FormSection } from "@/components/FullScreenComposer";
import { PeopleList, peopleFor } from "@/components/PeopleList";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  defaultModules,
  type LiveSession,
  type SessionModule,
  type SessionSubModule,
  type Applicant,
} from "@/lib/finder-data";
import { uploadToS3 } from "@/services/mediaService";
import {
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  getSessionDetails,
  toggleSessionJoinLink,
} from "@/services/sessionsService";

export const Route = createFileRoute("/sessions")({
  head: () => ({
    meta: [
      { title: "Live Skill Sessions — Finder" },
      {
        name: "description",
        content:
          "Publish live online skill sessions hosted on Google Meet and track enrollments in real time.",
      },
      { property: "og:title", content: "Live Skill Sessions — Finder" },
      {
        property: "og:description",
        content: "Schedule live Meet sessions like courses and manage enrollments.",
      },
    ],
  }),
  component: SessionsPage,
});

const statusTone: Record<LiveSession["status"], string> = {
  "Live now": "bg-live/15 text-live",
  Scheduled: "bg-primary/15 text-primary",
  Completed: "bg-muted text-muted-foreground",
};

function ThumbBanner({ s, className }: { s: LiveSession; className?: string }) {
  if (s.thumbnail) {
    return (
      <img
        src={s.thumbnail}
        alt={`${s.title} session thumbnail`}
        className={`w-full object-cover ${className ?? "h-36"}`}
      />
    );
  }
  return (
    <div
      className={`grid w-full place-items-center bg-gradient-to-br from-primary/20 via-secondary to-chart-4/20 ${className ?? "h-36"}`}
    >
      <span className="font-display text-2xl font-semibold text-muted-foreground">
        {s.title.slice(0, 1)}
      </span>
    </div>
  );
}

function SessionCard({
  s,
  onOpen,
  onEdit,
  onDelete,
  onToggleJoinLink,
}: {
  s: LiveSession;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleJoinLink?: () => void;
}) {
  const pct = Math.min(100, Math.round((s.enrolled / (s.seats || 100)) * 100));
  const totalHeadings = s.modules?.length || 0;
  const totalTopics =
    s.modules?.reduce((acc, m) => acc + (m.topics?.length || m.subModules?.length || 0), 0) || 0;
  const isJoinEnabled = s.isJoinLinkEnabled !== false;

  return (
    <article className="panel overflow-hidden transition-all duration-200 hover:border-primary/30">
      <div className="relative">
        <ThumbBanner s={s} />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="secondary" className={statusTone[s.status] || "bg-secondary"}>
              {s.status === "Live now" && (
                <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-live" />
              )}
              {s.status}
            </Badge>
            {!isJoinEnabled && (
              <Badge variant="outline" className="border-amber-500/50 bg-background/90 text-amber-500 backdrop-blur-xs text-[11px] gap-1 px-2 font-medium">
                <Link2Off className="size-3" /> Link Disabled
              </Badge>
            )}
          </div>
          {totalHeadings > 0 && (
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-xs font-normal text-xs">
              <Layers className="size-3 mr-1" />
              {totalHeadings} {totalHeadings === 1 ? "Heading" : "Headings"}
              {totalTopics > 0 ? ` · ${totalTopics} Topics` : ""}
            </Badge>
          )}
        </div>
      </div>

      <div className="p-5">
        <h3 className="line-clamp-1 text-lg font-semibold">{s.title}</h3>
        <p className="text-sm text-muted-foreground">
          {s.host} · {s.level}
        </p>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5" /> {s.date}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" /> {s.time} · {s.duration}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" /> {s.enrolled}/{s.seats}
          </span>
        </div>

        <div className="mt-4">
          <Progress value={pct} className="h-1.5" />
          <p className="mt-1.5 text-xs text-muted-foreground">{pct}% of seats filled</p>
        </div>

        {isJoinEnabled ? (
          <button
            type="button"
            onClick={() => toast.success("Meet link copied", { description: s.meetLink })}
            className="mt-4 flex w-full items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40"
          >
            <Video className="size-3.5 shrink-0 text-primary" />
            <span className="truncate">{s.meetLink}</span>
            <Copy className="ml-auto size-3.5" />
          </button>
        ) : (
          <div className="mt-4 flex w-full items-center justify-between gap-2 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2 text-left text-xs text-amber-600 dark:text-amber-400">
            <div className="flex items-center gap-2 truncate">
              <Link2Off className="size-3.5 shrink-0 text-amber-500" />
              <span className="truncate">Join link disabled for candidates</span>
            </div>
            {onToggleJoinLink && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleJoinLink();
                }}
                className="shrink-0 font-medium text-primary hover:underline"
              >
                Enable
              </button>
            )}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button
            className="flex-1"
            variant={s.status === "Live now" ? "default" : "outline"}
            onClick={onOpen}
          >
            {s.status === "Live now" ? "Join Meet" : "Open session"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Session actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onToggleJoinLink && (
                <DropdownMenuItem onSelect={onToggleJoinLink} className="gap-2">
                  {isJoinEnabled ? (
                    <>
                      <Link2Off className="size-3.5 text-amber-500" /> Disable join link
                    </>
                  ) : (
                    <>
                      <Link2 className="size-3.5 text-emerald-500" /> Enable join link
                    </>
                  )}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={onEdit} className="gap-2">
                <Pencil className="size-3.5" /> Edit session
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={onDelete}
                className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="size-3.5" /> Delete session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  );
}

function FullScreenSession({
  s,
  onClose,
  onEdit,
  onDelete,
  onToggleJoinLink,
}: {
  s: LiveSession;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleJoinLink?: () => void;
}) {
  const [details, setDetails] = useState<{
    modules: SessionModule[] | null;
    students: Applicant[];
  }>({
    modules: s.modules ?? null,
    students: peopleFor(s.title, "Session"),
  });

  useEffect(() => {
    let isMounted = true;
    getSessionDetails(s.id, s.title, s.modules ?? null).then((data) => {
      if (isMounted) {
        setDetails(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [s.id, s.title, s.modules]);

  const modules =
    details.modules && details.modules.length > 0
      ? details.modules
      : s.modules && s.modules.length > 0
        ? s.modules
        : null;
  const students = details.students;
  const pct = Math.min(100, Math.round((s.enrolled / (s.seats || 100)) * 100));

  return (
    <div className="absolute inset-0 z-40 min-h-[calc(100dvh-61px)] overflow-y-auto bg-background animate-in fade-in duration-200">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:px-8">
        <Badge variant="secondary" className={statusTone[s.status] || "bg-secondary"}>
          {s.status === "Live now" && (
            <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-live" />
          )}
          {s.status}
        </Badge>
        <p className="truncate font-medium">{s.title}</p>
        <div className="ml-auto flex items-center gap-2">
          {onToggleJoinLink && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleJoinLink}
              className={
                s.isJoinLinkEnabled === false
                  ? "border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                  : "border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10"
              }
            >
              {s.isJoinLinkEnabled === false ? (
                <>
                  <Link2Off className="size-4 mr-1.5" /> Enable join link
                </>
              ) : (
                <>
                  <Link2 className="size-4 mr-1.5" /> Join link active
                </>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="size-4" /> Edit session
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="size-4" /> Delete
          </Button>
          <Button variant="ghost" size="icon" aria-label="Exit full screen" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="panel overflow-hidden">
            <div className="relative">
              <ThumbBanner s={s} className="h-64 md:h-80" />
              <div className="absolute inset-0 grid place-items-center bg-background/30">
                <div className="flex flex-col items-center gap-2">
                  <Button
                    size="lg"
                    onClick={() => toast.success("Opening Meet", { description: s.meetLink })}
                  >
                    <PlayCircle className="size-5" />
                    {s.status === "Live now" ? "Join live now" : "Open Meet room"}
                  </Button>
                  {s.isJoinLinkEnabled === false && (
                    <Badge variant="outline" className="border-amber-500/50 bg-background/90 text-amber-500 backdrop-blur-xs text-xs gap-1">
                      <Link2Off className="size-3" /> Link hidden from candidates
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="p-5">
              <h1 className="text-2xl font-semibold md:text-3xl">{s.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Hosted by {s.host} · {s.level} · {s.duration}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {s.summary ??
                  "A live, hands-on online session run on Google Meet. Join with the link below at the scheduled time."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {s.tags.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <section className="panel mt-6 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Curriculum & Topics Covered</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Structured session headings and covered topics
                </p>
              </div>
              <Badge variant="outline">
                {modules && modules.length > 0 ? `${modules.length} ${modules.length === 1 ? "Heading" : "Headings"}` : "None"}
              </Badge>
            </div>

            {!modules || modules.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No headings or topics added yet for this course (Optional).</p>
            ) : (
              <div className="mt-4 space-y-4">
                {modules.map((m, i) => {
                  const headingName = m.heading || m.title || `Heading ${i + 1}`;
                  const topicsList =
                    m.topics && m.topics.length > 0
                      ? m.topics
                      : m.subModules?.map((sm) => sm.title) || [];

                  return (
                    <div
                      key={`${headingName}-${i}`}
                      className="rounded-xl border border-border bg-card/60 p-4 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-foreground">{headingName}</h3>
                          {(m.description || m.detail) && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {m.description || m.detail}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Topics covered under this heading */}
                      {topicsList.length > 0 ? (
                        <div className="mt-3.5 pl-10 space-y-2 border-t border-border/50 pt-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                            <BookOpen className="size-3" /> Topics covered in this heading:
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {topicsList.map((topic, tIdx) => (
                              <div
                                key={tIdx}
                                className="flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2 text-xs border border-border/40"
                              >
                                <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                                <span className="font-medium text-foreground">{topic}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 pl-10 text-xs italic text-muted-foreground">
                          General discussion for this heading.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="panel mt-6 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Enrolled students</h2>
                <p className="text-sm text-muted-foreground">
                  {s.enrolled} enrolled · {Math.max(0, s.seats - s.enrolled)} seats left
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success("Enrollee list exported (CSV)")}
              >
                Export
              </Button>
            </div>
            <PeopleList
              people={students}
              emptyLabel="No enrollments yet for this session."
            />
          </section>
        </div>

        <aside className="space-y-4">
          <div className="panel p-5">
            <p className="text-eyebrow">Session details</p>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2.5">
                <Calendar className="size-4 text-primary" /> 
                <span><strong className="text-foreground">Date:</strong> {s.date}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Clock className="size-4 text-primary" /> 
                <span><strong className="text-foreground">Time:</strong> {s.time}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Users className="size-4 text-primary" /> 
                <span><strong className="text-foreground">Capacity:</strong> {s.enrolled}/{s.seats} enrolled</span>
              </p>
            </div>
            <Progress value={pct} className="mt-4 h-1.5" />
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <p className="text-eyebrow">Live session URL</p>
              <Badge
                variant="outline"
                className={
                  s.isJoinLinkEnabled === false
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-500 text-[11px] gap-1"
                    : "border-emerald-500/50 bg-emerald-500/10 text-emerald-500 text-[11px] gap-1"
                }
              >
                {s.isJoinLinkEnabled === false ? (
                  <>
                    <Link2Off className="size-3" /> Disabled
                  </>
                ) : (
                  <>
                    <Link2 className="size-3" /> Active
                  </>
                )}
              </Badge>
            </div>
            <button
              type="button"
              onClick={() => toast.success("Join link copied", { description: s.meetLink })}
              className="mt-3 flex w-full items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-left text-xs text-muted-foreground hover:border-primary/40"
            >
              <Link2 className="size-3.5 shrink-0 text-primary" />
              <span className="truncate">{s.meetLink}</span>
              <Copy className="ml-auto size-3.5" />
            </button>

            {onToggleJoinLink && (
              <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="candidate-link-switch" className="text-xs font-medium cursor-pointer">
                    Candidate Access
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    {s.isJoinLinkEnabled === false
                      ? "Join link is disabled for learners"
                      : "Learners can see & join via Meet"}
                  </p>
                </div>
                <Switch
                  id="candidate-link-switch"
                  checked={s.isJoinLinkEnabled !== false}
                  onCheckedChange={onToggleJoinLink}
                />
              </div>
            )}

            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() => toast.success("Enrollees notified of session updates")}
            >
              Notify enrollees
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Helper presets & constants for clean session/course creation
const DURATION_INTEGER_PRESETS = [30, 45, 60, 90, 120];
const SEAT_PRESETS = [25, 50, 100, 250, 500];

function parseDateToInputFormat(dateStr?: string): string {
  if (!dateStr) return "";
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return "";
}

function formatDateForDisplay(dateInput: string): string {
  if (!dateInput) return "TBD";
  try {
    const parts = dateInput.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return dateInput;
  } catch {
    return dateInput;
  }
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidHttpUrl(str: string): boolean {
  try {
    const url = new URL(str.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function detectMeetingPlatform(url: string) {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes("meet.google.com")) {
    return { name: "Google Meet", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" };
  }
  if (lower.includes("zoom.us")) {
    return { name: "Zoom Meeting", color: "bg-blue-500/10 text-blue-600 border-blue-500/30" };
  }
  if (lower.includes("teams.microsoft.com")) {
    return { name: "Microsoft Teams", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30" };
  }
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return { name: "YouTube Live", color: "bg-rose-500/10 text-rose-600 border-rose-500/30" };
  }
  if (isValidHttpUrl(url)) {
    return { name: "Custom Video Link", color: "bg-primary/10 text-primary border-primary/30" };
  }
  return null;
}

function NewSessionScreen({
  session,
  onClose,
  onSubmit,
  onDelete,
}: {
  session?: LiveSession;
  onClose: () => void;
  onSubmit: (data: Partial<LiveSession>) => void;
  onDelete?: () => void;
}) {
  const editing = Boolean(session);
  const fileRef = useRef<HTMLInputElement>(null);

  // Time conversion helpers
  const formatTimeTo12Hour = (time24: string): string => {
    if (!time24) return "7:00 PM IST";
    const [hours24, minutes] = time24.split(":").map(Number);
    if (isNaN(hours24) || isNaN(minutes)) return time24;
    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period} IST`;
  };

  const formatTimeTo24Hour = (time12: string): string => {
    if (!time12) return "";
    if (/^\d{2}:\d{2}$/.test(time12)) return time12;
    const cleanTime = time12.replace(/IST/gi, "").trim();
    const match = cleanTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return "";
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  };

  // Form State
  const [title, setTitle] = useState(session?.title ?? "");
  const [thumb, setThumb] = useState<string | null>(session?.thumbnail ?? null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [date, setDate] = useState(() => parseDateToInputFormat(session?.date) || getTodayString());
  const [time, setTime] = useState(() => (session?.time ? formatTimeTo24Hour(session.time) : "19:00"));
  
  // Duration as integer minutes only
  const [durationMinutes, setDurationMinutes] = useState<string>(() => {
    if (session?.duration) {
      const match = session.duration.match(/\d+/);
      return match ? match[0] : "60";
    }
    return "60";
  });

  const [level, setLevel] = useState<LiveSession["level"]>(session?.level ?? "Beginner");
  const [seats, setSeats] = useState<string>(session?.seats ? String(session.seats) : "100");
  const [meetLink, setMeetLink] = useState(session?.meetLink ?? "");
  const [isJoinLinkEnabled, setIsJoinLinkEnabled] = useState<boolean>(session?.isJoinLinkEnabled !== false);
  const [summary, setSummary] = useState(session?.summary ?? "");

  // Format initial modules: ONLY heading and topics (Optional - may be null or empty)
  const [modules, setModules] = useState<
    Array<{
      heading: string;
      topics: string[];
    }>
  >(() => {
    if (session?.modules && Array.isArray(session.modules) && session.modules.length > 0) {
      return session.modules.map((m) => ({
        heading: m.heading || m.title || "",
        topics:
          m.topics && m.topics.length > 0
            ? m.topics
            : m.subModules?.map((sm) => sm.title) || [""],
      }));
    }
    return [];
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Field validation logic
  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};

    if (!title.trim()) {
      errs.title = "Course title is required.";
    } else if (title.trim().length < 4) {
      errs.title = "Title must be at least 4 characters long.";
    } else if (title.trim().length > 120) {
      errs.title = "Title must not exceed 120 characters.";
    }

    if (!date) {
      errs.date = "Please select a date for the session.";
    } else if (date < getTodayString()) {
      errs.date = "Session date cannot be in the past.";
    }

    if (!time) {
      errs.time = "Please set a start time.";
    }

    const durationNum = parseInt(durationMinutes, 10);
    if (!durationMinutes || isNaN(durationNum) || durationNum < 1) {
      errs.duration = "Duration must be an integer (e.g. 60 for 60 minutes).";
    }

    const seatsNum = parseInt(seats, 10);
    if (!seats || isNaN(seatsNum) || seatsNum < 1) {
      errs.seats = "Capacity must be at least 1 seat.";
    } else if (seatsNum > 10000) {
      errs.seats = "Maximum capacity is 10,000 seats.";
    }

    if (!meetLink.trim()) {
      errs.meetLink = "Live session URL (Google Meet, Zoom, etc.) is required.";
    } else if (!isValidHttpUrl(meetLink.trim())) {
      errs.meetLink = "Enter a valid URL starting with https:// or http://";
    }

    // Curriculum validation (Optional - may be null or empty)
    if (modules.length > 0) {
      const hasEmptyHeading = modules.some((m) => !m.heading.trim());
      if (hasEmptyHeading) {
        errs.modules = "All curriculum headings must have a title, or remove empty headings.";
      } else {
        const hasEmptyTopics = modules.some(
          (m) => m.topics.filter((t) => t.trim().length > 0).length === 0
        );
        if (hasEmptyTopics) {
          errs.modules = "Every heading must cover at least 1 topic, or remove unused headings.";
        }
      }
    }

    return errs;
  };

  // Real-time re-validation whenever critical fields change if touched
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      const currentErrs = validate();
      setErrors(currentErrs);
    }
  }, [title, date, time, durationMinutes, seats, meetLink, modules]);

  // Heading & Topic handlers
  const handleAddHeading = () => {
    setModules((prev) => [
      ...prev,
      {
        heading: "",
        topics: [""],
      },
    ]);
  };

  const handleRemoveHeading = (headingIndex: number) => {
    setModules((prev) => prev.filter((_, idx) => idx !== headingIndex));
  };

  const handleUpdateHeading = (headingIndex: number, value: string) => {
    setModules((prev) =>
      prev.map((mod, idx) => (idx === headingIndex ? { ...mod, heading: value } : mod))
    );
  };

  const handleAddTopic = (headingIndex: number) => {
    setModules((prev) =>
      prev.map((mod, idx) => {
        if (idx !== headingIndex) return mod;
        return {
          ...mod,
          topics: [...mod.topics, ""],
        };
      })
    );
  };

  const handleRemoveTopic = (headingIndex: number, topicIndex: number) => {
    setModules((prev) =>
      prev.map((mod, idx) => {
        if (idx !== headingIndex) return mod;
        return {
          ...mod,
          topics: mod.topics.filter((_, tIdx) => tIdx !== topicIndex),
        };
      })
    );
  };

  const handleUpdateTopic = (headingIndex: number, topicIndex: number, value: string) => {
    setModules((prev) =>
      prev.map((mod, idx) => {
        if (idx !== headingIndex) return mod;
        return {
          ...mod,
          topics: mod.topics.map((top, tIdx) => (tIdx === topicIndex ? value : top)),
        };
      })
    );
  };

  // Final submit handler with strict validation
  const handleSubmit = () => {
    const errs = validate();
    setErrors(errs);
    setTouched({
      title: true,
      date: true,
      time: true,
      duration: true,
      seats: true,
      meetLink: true,
      modules: true,
    });

    if (Object.keys(errs).length > 0) {
      toast.error("Please resolve highlighted validation errors before publishing.", {
        description: Object.values(errs)[0],
      });

      // Scroll to the first erroneous element
      const firstKey = Object.keys(errs)[0];
      const elementIdMap: Record<string, string> = {
        title: "s-title",
        date: "s-date",
        time: "s-time",
        duration: "s-duration",
        seats: "s-seats",
        meetLink: "s-url",
        modules: "s-curriculum-section",
      };
      const targetId = elementIdMap[firstKey];
      if (targetId) {
        const el = document.getElementById(targetId);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus();
      }
      return;
    }

    const cleanedModules = modules
      .filter((m) => m.heading.trim().length > 0)
      .map((m, idx) => {
        const cleanedTopics = m.topics.map((t) => t.trim()).filter((t) => t.length > 0);
        return {
          heading: m.heading.trim(),
          title: m.heading.trim(),
          description: "",
          order: idx,
          topics: cleanedTopics,
          subModules: cleanedTopics.map((topic, tIdx) => ({
            title: topic,
            description: "",
            order: tIdx,
          })),
        };
      });

    const formattedTime = formatTimeTo12Hour(time);
    const formattedDate = formatDateForDisplay(date);
    const formattedDuration = `${parseInt(durationMinutes, 10)} min`;

    onSubmit({
      title: title.trim(),
      host: session?.host || "Finder Careers",
      date: formattedDate,
      time: formattedTime,
      duration: formattedDuration,
      seats: parseInt(seats, 10),
      price: session?.price || "Free",
      level,
      meetLink: meetLink.trim(),
      isJoinLinkEnabled,
      summary: summary.trim(),
      tags: session?.tags && session.tags.length > 0 ? session.tags : ["Live Session"],
      thumbnail: thumb || undefined,
      modules: cleanedModules.length > 0 ? cleanedModules : null,
    });

    onClose();
    toast.success(editing ? "Skill course updated" : "Skill course published", {
      description: editing
        ? "Enrollees will see updated schedule, live link, and syllabus details."
        : "Schedule and Meet link are live on Finder.",
    });
  };

  const detectedPlatform = detectMeetingPlatform(meetLink);
  const totalTopicsCount = modules.reduce(
    (acc, m) => acc + m.topics.filter((t) => t.trim().length > 0).length,
    0
  );

  return (
    <FullScreenComposer
      title={editing ? `Edit Course · ${session!.title}` : "Create a Live Skill Course"}
      description={
        editing
          ? "Update the schedule, live join link, or optional curriculum."
          : "Add schedule, live video link, and optional curriculum."
      }
      submitLabel={uploadingImage ? "Uploading Cover..." : editing ? "Save changes" : "Publish skill course"}
      onClose={onClose}
      onSubmit={uploadingImage ? () => {} : handleSubmit}
      onDelete={onDelete}
      deleteLabel="Delete course"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Configuration */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Section 1: Course Title & Level */}
          <FormSection
            title="Course Information"
            hint="Set the primary title and target learner experience level."
          >
            <div className="space-y-4">
              {/* Course Title */}
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="s-title" className="text-sm font-medium flex items-center gap-1.5">
                    Course Title <span className="text-destructive">*</span>
                  </Label>
                  <span className={`text-[11px] ${title.length > 120 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                    {title.length}/120
                  </span>
                </div>
                <Input
                  id="s-title"
                  placeholder="e.g. System Design for Senior Software Engineers"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
                  }}
                  onBlur={() => markTouched("title")}
                  className={`transition-all ${
                    touched.title && errors.title
                      ? "border-destructive focus-visible:ring-destructive"
                      : "focus-visible:ring-primary"
                  }`}
                />
                {touched.title && errors.title && (
                  <p className="text-xs font-medium text-destructive flex items-center gap-1 mt-0.5 animate-in fade-in">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{errors.title}</span>
                  </p>
                )}
              </div>

              {/* Difficulty Level */}
              <div className="grid gap-1.5 max-w-sm">
                <Label htmlFor="s-level" className="text-sm font-medium">Difficulty Level</Label>
                <Select defaultValue={level} onValueChange={(v) => setLevel(v as LiveSession["level"])}>
                  <SelectTrigger id="s-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </FormSection>

          {/* Section 2: Cover Thumbnail */}
          <FormSection title="Cover Thumbnail" hint="Banner image displayed on the Finder discovery board.">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Cover Banner (16:9 recommended)</Label>
                {thumb && !uploadingImage && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setThumb(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="flex items-center gap-1 text-xs text-destructive hover:underline"
                  >
                    <Trash2 className="size-3" /> Remove cover
                  </button>
                )}
              </div>
              <button
                type="button"
                disabled={uploadingImage}
                onClick={() => fileRef.current?.click()}
                className="group relative grid h-44 w-full place-items-center overflow-hidden rounded-xl border border-dashed border-border bg-secondary/30 text-muted-foreground transition-all hover:border-primary/50 hover:bg-secondary/50"
              >
                {thumb ? (
                  <>
                    <img
                      src={thumb}
                      alt="Session thumbnail preview"
                      className={`size-full object-cover transition-opacity ${uploadingImage ? "opacity-30" : "group-hover:opacity-90"}`}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex items-center gap-1.5 rounded-md bg-background/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
                        <ImagePlus className="size-3.5 text-primary" /> Change cover image
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 p-6 text-center">
                    {uploadingImage ? (
                      <Loader2 className="size-8 animate-spin text-primary" />
                    ) : (
                      <div className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                        <ImagePlus className="size-5" />
                      </div>
                    )}
                    <span className="font-semibold text-foreground text-sm">
                      {uploadingImage ? "Uploading image to S3..." : "Click to upload thumbnail"}
                    </span>
                    <span className="text-xs text-muted-foreground max-w-xs">
                      PNG, JPG, or WebP up to 10MB.
                    </span>
                  </div>
                )}

                {uploadingImage && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-xs">
                    <Loader2 className="size-7 animate-spin text-primary" />
                    <span className="text-xs font-medium text-foreground">Processing thumbnail upload…</span>
                  </div>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;

                  if (f.size > 10 * 1024 * 1024) {
                    toast.error("File exceeds 10MB limit. Please choose a smaller image.");
                    return;
                  }

                  setUploadingImage(true);
                  const previewUrl = URL.createObjectURL(f);
                  setThumb(previewUrl);

                  try {
                    const s3Url = await uploadToS3(f, "live-skills/thumbnails");
                    setThumb(s3Url);
                    toast.success("Cover image uploaded", {
                      description: "Your session thumbnail is ready and hosted.",
                    });
                  } catch (error) {
                    console.error("S3 upload error:", error);
                    toast.error("Failed to upload thumbnail to S3", {
                      description: "Retained local preview; please check network connection.",
                    });
                  } finally {
                    setUploadingImage(false);
                    URL.revokeObjectURL(previewUrl);
                  }
                }}
              />
            </div>
          </FormSection>

          {/* Section 3: Schedule, Duration & Capacity */}
          <FormSection
            title="Schedule & Capacity"
            hint="Set when the live session runs, duration in minutes, and total student capacity."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Date */}
              <div className="grid gap-1.5">
                <Label htmlFor="s-date" className="text-sm font-medium flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-primary" />
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="s-date"
                  type="date"
                  min={getTodayString()}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (errors.date) setErrors((prev) => ({ ...prev, date: "" }));
                  }}
                  onBlur={() => markTouched("date")}
                  className={touched.date && errors.date ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {touched.date && errors.date ? (
                  <p className="text-xs font-medium text-destructive flex items-center gap-1 mt-0.5 animate-in fade-in">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{errors.date}</span>
                  </p>
                ) : date ? (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    {formatDateForDisplay(date)}
                  </p>
                ) : null}
              </div>

              {/* Start Time */}
              <div className="grid gap-1.5">
                <Label htmlFor="s-time" className="text-sm font-medium flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" />
                  Start Time (IST) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="s-time"
                  type="time"
                  value={time}
                  onChange={(e) => {
                    setTime(e.target.value);
                    if (errors.time) setErrors((prev) => ({ ...prev, time: "" }));
                  }}
                  onBlur={() => markTouched("time")}
                  className={touched.time && errors.time ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {touched.time && errors.time ? (
                  <p className="text-xs font-medium text-destructive flex items-center gap-1 mt-0.5 animate-in fade-in">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{errors.time}</span>
                  </p>
                ) : time ? (
                  <p className="text-[11px] text-muted-foreground">
                    Formatted: <strong className="text-foreground">{formatTimeTo12Hour(time)}</strong>
                  </p>
                ) : null}
              </div>

              {/* Duration: ONLY Integer Minutes */}
              <div className="grid gap-1.5">
                <Label htmlFor="s-duration" className="text-sm font-medium flex items-center gap-1.5">
                  Duration (minutes) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="s-duration"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 60"
                  value={durationMinutes}
                  onChange={(e) => {
                    // Filter to only integer digits
                    const val = e.target.value.replace(/\D/g, "");
                    setDurationMinutes(val);
                    if (errors.duration) setErrors((prev) => ({ ...prev, duration: "" }));
                  }}
                  onBlur={() => markTouched("duration")}
                  className={touched.duration && errors.duration ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {DURATION_INTEGER_PRESETS.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setDurationMinutes(String(mins));
                        if (errors.duration) setErrors((prev) => ({ ...prev, duration: "" }));
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        durationMinutes === String(mins)
                          ? "bg-primary text-primary-foreground border-primary font-medium"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary border-border"
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
                {touched.duration && errors.duration && (
                  <p className="text-xs font-medium text-destructive flex items-center gap-1 mt-0.5 animate-in fade-in">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{errors.duration}</span>
                  </p>
                )}
              </div>

              {/* Total Seats with presets */}
              <div className="grid gap-1.5">
                <Label htmlFor="s-seats" className="text-sm font-medium flex items-center gap-1.5">
                  <Users className="size-3.5 text-primary" />
                  Total Seats Capacity <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="s-seats"
                  type="number"
                  min="1"
                  max="10000"
                  step="1"
                  placeholder="100"
                  value={seats}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setSeats(val);
                    if (errors.seats) setErrors((prev) => ({ ...prev, seats: "" }));
                  }}
                  onBlur={() => markTouched("seats")}
                  className={touched.seats && errors.seats ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {SEAT_PRESETS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSeats(String(s));
                        if (errors.seats) setErrors((prev) => ({ ...prev, seats: "" }));
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        seats === String(s)
                          ? "bg-primary text-primary-foreground border-primary font-medium"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary border-border"
                      }`}
                    >
                      {s} seats
                    </button>
                  ))}
                </div>
                {touched.seats && errors.seats && (
                  <p className="text-xs font-medium text-destructive flex items-center gap-1 mt-0.5 animate-in fade-in">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{errors.seats}</span>
                  </p>
                )}
              </div>
            </div>
          </FormSection>

          {/* Section 4: Live Join Link & Candidate Access */}
          <FormSection
            title="Live Session URL & Access"
            hint="Video conference URL and candidate access toggle."
          >
            <div className="space-y-4">
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="s-url" className="text-sm font-medium flex items-center gap-1.5">
                    <Video className="size-3.5 text-primary" />
                    Live Join URL <span className="text-destructive">*</span>
                  </Label>
                  {detectedPlatform && (
                    <Badge variant="outline" className={`text-[11px] gap-1 px-2 font-medium ${detectedPlatform.color}`}>
                      <Check className="size-3" /> {detectedPlatform.name}
                    </Badge>
                  )}
                </div>
                <Input
                  id="s-url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={meetLink}
                  onChange={(e) => {
                    setMeetLink(e.target.value);
                    if (errors.meetLink) setErrors((prev) => ({ ...prev, meetLink: "" }));
                  }}
                  onBlur={() => markTouched("meetLink")}
                  className={touched.meetLink && errors.meetLink ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {touched.meetLink && errors.meetLink && (
                  <p className="text-xs font-medium text-destructive flex items-center gap-1 mt-0.5 animate-in fade-in">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{errors.meetLink}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Paste your Google Meet, Zoom, or Microsoft Teams meeting URL.
                </p>
              </div>

              {/* Candidate Access Switch Panel */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-4 transition-colors">
                <div className="space-y-1">
                  <Label htmlFor="s-link-enable" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                    {isJoinLinkEnabled ? (
                      <Link2 className="size-4 text-emerald-500" />
                    ) : (
                      <Link2Off className="size-4 text-amber-500" />
                    )}
                    <span>Enable Live Join Link for Enrollees</span>
                  </Label>
                  <p className="text-xs text-muted-foreground max-w-md">
                    {isJoinLinkEnabled
                      ? "Active: Candidates who enroll can view the link and join the Meet."
                      : "Hidden: The join link is hidden from candidates until you turn this on."}
                  </p>
                </div>
                <Switch
                  id="s-link-enable"
                  checked={isJoinLinkEnabled}
                  onCheckedChange={setIsJoinLinkEnabled}
                />
              </div>
            </div>
          </FormSection>

          {/* Section 5: Curriculum - Headings & Topics (Optional) */}
          <FormSection
            title="Course Curriculum (Optional)"
            hint="Optional: Add headings and covered topics under each heading, or leave blank."
          >
            <div className="space-y-4" id="s-curriculum-section">
              {touched.modules && errors.modules && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{errors.modules}</span>
                </div>
              )}

              {modules.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-center">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                    <BookOpen className="size-5" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    No curriculum added yet (Optional)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 mb-3 max-w-sm mx-auto">
                    You can publish without a curriculum, or add structured headings and topics below.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddHeading}
                    className="gap-1.5 border-dashed border-primary/40 text-primary hover:bg-primary/5"
                  >
                    <Plus className="size-4" /> Add curriculum heading
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {modules.map((m, hIdx) => (
                    <div
                      key={hIdx}
                      className="rounded-xl border border-border bg-card/60 p-4 transition-all duration-200 hover:border-primary/40 space-y-4 shadow-2xs"
                    >
                      {/* Heading Header Bar */}
                      <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="grid size-6 place-items-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                            {hIdx + 1}
                          </span>
                          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                            Heading {hIdx + 1}
                          </span>
                          {m.heading.trim() && (
                            <Badge variant="secondary" className="text-[10px] font-normal py-0">
                              {m.topics.filter((t) => t.trim()).length} topics
                            </Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`Remove heading ${hIdx + 1}`}
                          onClick={() => handleRemoveHeading(hIdx)}
                          className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5 mr-1" /> Remove
                        </Button>
                      </div>

                      {/* Heading Name Input ONLY */}
                      <div className="grid gap-1.5">
                        <Label className="text-xs font-medium text-foreground">
                          Heading Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          placeholder="e.g. System Architecture & Scalability"
                          value={m.heading}
                          onChange={(e) => handleUpdateHeading(hIdx, e.target.value)}
                          className={`font-medium text-sm ${
                            touched.modules && !m.heading.trim() ? "border-destructive focus-visible:ring-destructive" : ""
                          }`}
                        />
                      </div>

                      {/* Topics inside this heading */}
                      <div className="pl-3 border-l-2 border-primary/40 space-y-2.5 pt-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Sparkles className="size-3.5 text-primary" />
                            Topics covered in this heading:
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddTopic(hIdx)}
                            className="h-6 text-[11px] text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <Plus className="size-3 mr-1" /> Add topic
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {m.topics.map((topic, tIdx) => (
                            <div key={tIdx} className="flex items-center gap-2">
                              <span className="size-1.5 rounded-full bg-primary shrink-0" />
                              <Input
                                placeholder={`Topic ${tIdx + 1} (e.g. Load Balancers & Caching)`}
                                value={topic}
                                onChange={(e) => handleUpdateTopic(hIdx, tIdx, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddTopic(hIdx);
                                  }
                                }}
                                className="h-8 text-xs font-medium bg-background/90"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={m.topics.length === 1 && tIdx === 0 && !topic}
                                onClick={() => handleRemoveTopic(hIdx, tIdx)}
                                className="size-8 text-muted-foreground hover:text-destructive shrink-0"
                              >
                                <X className="size-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>

                        <p className="text-[11px] text-muted-foreground/80 italic">
                          Tip: Press <kbd className="px-1 py-0.5 text-[10px] bg-secondary rounded border border-border">Enter</kbd> to add another topic.
                        </p>
                      </div>
                    </div>
                  ))}

                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddHeading}
                      className="gap-1.5 border-dashed border-primary/40 text-primary hover:bg-primary/5"
                    >
                      <Plus className="size-4" /> Add another heading
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </FormSection>

          {/* Section 6: Course Description */}
          <FormSection
            title="Course Description"
            hint="Provide context, syllabus overview, or prerequisites for students."
          >
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="s-desc" className="text-sm font-medium">What learners will get</Label>
                <span className="text-[11px] text-muted-foreground">{summary.length} characters</span>
              </div>
              <Textarea
                id="s-desc"
                rows={4}
                placeholder="Key takeaways, syllabus overview, prerequisites, or session outcomes…"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>
          </FormSection>

          {/* Section 7: Danger Zone (when editing) */}
          {editing && onDelete && (
            <FormSection title="Danger Zone" hint="Permanently remove this session and all its syllabus records.">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <div>
                  <p className="text-sm font-semibold text-destructive">Delete this skill course</p>
                  <p className="text-xs text-muted-foreground">
                    Enrolled candidates will no longer be able to view details or join the Meet session.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  type="button"
                  size="sm"
                  onClick={onDelete}
                  className="gap-1.5"
                >
                  <Trash2 className="size-3.5" />
                  <span>Delete course</span>
                </Button>
              </div>
            </FormSection>
          )}
        </div>

        {/* Right Column: Sticky Live Course Card Preview */}
        <aside className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-20 space-y-4">
          <div className="panel p-5 space-y-4 border-primary/20 shadow-lg">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="size-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Live Course Card Preview
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-secondary/50 font-normal">
                Student View
              </Badge>
            </div>

            {/* Live Card Replica */}
            <article className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all">
              {/* Card Cover */}
              <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-primary/25 via-secondary to-chart-4/20">
                {thumb ? (
                  <img
                    src={thumb}
                    alt="Cover preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="grid size-full place-items-center text-center p-4">
                    <span className="font-display text-4xl font-bold text-muted-foreground/50">
                      {title ? title.slice(0, 1).toUpperCase() : "S"}
                    </span>
                  </div>
                )}

                {/* Status Badges Overlay */}
                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
                  <Badge variant="secondary" className="bg-primary/15 text-primary text-[11px] font-medium backdrop-blur-xs">
                    Scheduled
                  </Badge>
                  {isJoinLinkEnabled ? (
                    <Badge variant="outline" className="border-emerald-500/50 bg-background/90 text-emerald-600 text-[10px] gap-1 px-1.5">
                      <Link2 className="size-2.5" /> Meet Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-500/50 bg-background/90 text-amber-500 text-[10px] gap-1 px-1.5">
                      <Link2Off className="size-2.5" /> Link Hidden
                    </Badge>
                  )}
                </div>

                {modules.filter((m) => m.heading.trim()).length > 0 && (
                  <div className="absolute bottom-2 right-2 rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-xs">
                    {modules.filter((m) => m.heading.trim()).length} Headings · {totalTopicsCount} Topics
                  </div>
                )}
              </div>

              {/* Card Details */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[11px]">
                    {level}
                  </Badge>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Free
                  </span>
                </div>

                <h4 className="font-semibold text-sm line-clamp-2 leading-snug text-foreground">
                  {title.trim() || "Your Course Title Will Appear Here"}
                </h4>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-primary shrink-0" />
                    <span>{formatDateForDisplay(date)} · {formatTimeTo12Hour(time)}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="size-3.5 text-primary shrink-0" />
                    <span>{durationMinutes ? `${durationMinutes} min` : "60 min"}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="size-3.5 text-primary shrink-0" />
                    <span>0 / {seats || 100} seats enrolled</span>
                  </p>
                </div>

                {/* Progress Bar */}
                <Progress value={0} className="h-1.5" />
              </div>
            </article>

            {/* Quick Validation Checklist Box */}
            <div className="rounded-lg bg-secondary/40 p-3.5 space-y-2 border border-border/60">
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" />
                Publication Checklist
              </p>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center gap-1.5">
                  {title.trim().length >= 4 ? (
                    <CheckCircle2 className="size-3 text-emerald-500" />
                  ) : (
                    <AlertCircle className="size-3 text-muted-foreground" />
                  )}
                  <span className={title.trim().length >= 4 ? "text-foreground" : "text-muted-foreground"}>
                    Valid course title
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {date && time ? (
                    <CheckCircle2 className="size-3 text-emerald-500" />
                  ) : (
                    <AlertCircle className="size-3 text-muted-foreground" />
                  )}
                  <span className={date && time ? "text-foreground" : "text-muted-foreground"}>
                    Schedule date & start time
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isValidHttpUrl(meetLink) ? (
                    <CheckCircle2 className="size-3 text-emerald-500" />
                  ) : (
                    <AlertCircle className="size-3 text-muted-foreground" />
                  )}
                  <span className={isValidHttpUrl(meetLink) ? "text-foreground" : "text-muted-foreground"}>
                    Live Google Meet / Zoom link
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2
                    className={`size-3 ${
                      modules.some((m) => m.heading.trim().length > 0)
                        ? "text-emerald-500"
                        : "text-muted-foreground/60"
                    }`}
                  />
                  <span
                    className={
                      modules.some((m) => m.heading.trim().length > 0)
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    Curriculum ({modules.some((m) => m.heading.trim().length > 0) ? `${modules.filter((m) => m.heading.trim()).length} headings` : "Optional"})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </FullScreenComposer>
  );
}

function SessionsPage() {
  const [sessionsList, setSessionsList] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [composing, setComposing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getSessions()
      .then((data) => {
        if (isMounted) {
          setSessionsList(data);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const active = sessionsList.find((s) => s.id === openId) ?? null;
  const editing = sessionsList.find((s) => s.id === editId) ?? null;

  const handleCreate = async (data: Partial<LiveSession>) => {
    const created = await createSession(data);
    setSessionsList((prev) => [created, ...prev.filter((s) => s.id !== created.id)]);
  };

  const handleUpdate = async (data: Partial<LiveSession>) => {
    if (!editId) return;
    const updated = await updateSession(editId, data);
    if (updated) {
      setSessionsList((prev) => prev.map((s) => (s.id === editId ? updated : s)));
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteSession(id);
    if (success) {
      setSessionsList((prev) => prev.filter((s) => s.id !== id));
      if (openId === id) setOpenId(null);
      if (editId === id) setEditId(null);
    }
  };

  const handleToggleJoinLink = async (id: string) => {
    const session = sessionsList.find((s) => s.id === id);
    if (!session) return;
    const newStatus = session.isJoinLinkEnabled === false ? true : false;

    // Optimistic UI update
    setSessionsList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isJoinLinkEnabled: newStatus } : s)),
    );

    const updated = await toggleSessionJoinLink(id, newStatus);
    if (updated) {
      setSessionsList((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updated, isJoinLinkEnabled: newStatus } : s)),
      );
    }
    toast.success(newStatus ? "Live join link enabled" : "Live join link disabled", {
      description: newStatus
        ? "Enrolled candidates can now view and access the Google Meet join link."
        : "The join link is now hidden from candidates until you re-enable it.",
    });
  };

  const filteredSessions = sessionsList.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesLevel = selectedLevel === "All" || s.level === selectedLevel;

    return matchesSearch && matchesLevel;
  });

  return (
    <>
      <PageHeader
        eyebrow="Live Sessions"
        title="Live Skill Sessions"
        description="Schedule live Meet sessions, build structured headings & covered topics, and track student enrollments."
        action={
          <Button onClick={() => setComposing(true)} className="gap-2 shadow-xs">
            <Plus className="size-4" />
            <span>Schedule session</span>
          </Button>
        }
      />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions by title, host or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Filter by level:</span>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Levels</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-primary mb-3" />
            <p className="text-sm">Loading your live sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="panel text-center py-16 px-4">
            <Layers className="size-12 mx-auto text-muted-foreground mb-4 opacity-40" />
            <h3 className="text-lg font-semibold">No live sessions found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              {searchQuery || selectedLevel !== "All"
                ? "Try adjusting your search query or filters to find what you are looking for."
                : "Schedule your first live skill session with structured headings, covered topics, and Meet integration."}
            </p>
            {!searchQuery && selectedLevel === "All" && (
              <Button onClick={() => setComposing(true)} className="mt-6 gap-2">
                <Plus className="size-4" />
                <span>Schedule a session</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredSessions.map((session) => (
              <SessionCard
                key={session.id}
                s={session}
                onOpen={() => setOpenId(session.id)}
                onEdit={() => setEditId(session.id)}
                onDelete={() => handleDelete(session.id)}
                onToggleJoinLink={() => handleToggleJoinLink(session.id)}
              />
            ))}
          </div>
        )}
      </div>

      {composing && (
        <NewSessionScreen
          onClose={() => setComposing(false)}
          onSubmit={handleCreate}
        />
      )}

      {editing && (
        <NewSessionScreen
          session={editing}
          onClose={() => setEditId(null)}
          onSubmit={handleUpdate}
          onDelete={() => handleDelete(editing.id)}
        />
      )}

      {active && (
        <FullScreenSession
          s={active}
          onClose={() => setOpenId(null)}
          onEdit={() => {
            const id = active.id;
            setOpenId(null);
            setEditId(id);
          }}
          onDelete={() => handleDelete(active.id)}
          onToggleJoinLink={() => handleToggleJoinLink(active.id)}
        />
      )}
    </>
  );
}
