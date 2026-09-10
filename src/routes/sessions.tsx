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
    modules: SessionModule[];
    students: Applicant[];
  }>({
    modules: s.modules && s.modules.length > 0 ? s.modules : defaultModules,
    students: peopleFor(s.title, "Session"),
  });

  useEffect(() => {
    let isMounted = true;
    getSessionDetails(s.id, s.title, s.modules ?? defaultModules).then((data) => {
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
        : [];
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
                {modules.length} {modules.length === 1 ? "Heading" : "Headings"}
              </Badge>
            </div>

            {modules.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No headings or topics added yet for this session.</p>
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
  const [thumb, setThumb] = useState<string | null>(session?.thumbnail ?? null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [level, setLevel] = useState<LiveSession["level"]>(session?.level ?? "Beginner");
  const [isJoinLinkEnabled, setIsJoinLinkEnabled] = useState<boolean>(session?.isJoinLinkEnabled !== false);
  
  // Format initial modules to have heading & topics array
  const [modules, setModules] = useState<
    Array<{
      heading: string;
      description?: string;
      topics: string[];
    }>
  >(() => {
    if (session?.modules && session.modules.length > 0) {
      return session.modules.map((m) => ({
        heading: m.heading || m.title || "",
        description: m.description || m.detail || "",
        topics:
          m.topics && m.topics.length > 0
            ? m.topics
            : m.subModules?.map((sm) => sm.title) || [""],
      }));
    }
    return [
      {
        heading: "",
        description: "",
        topics: [""],
      },
    ];
  });

  const fileRef = useRef<HTMLInputElement>(null);

  // Convert 24-hour time (HH:mm) to 12-hour format with AM/PM
  const formatTimeTo12Hour = (time24: string): string => {
    if (!time24) return "7:00 PM IST";
    
    const [hours24, minutes] = time24.split(':').map(Number);
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period} IST`;
  };

  // Convert 12-hour time with AM/PM (e.g., "2:06 PM IST") to 24-hour format (HH:mm)
  const formatTimeTo24Hour = (time12: string): string => {
    if (!time12) return "";
    
    const cleanTime = time12.replace(/IST/gi, '').trim();
    const match = cleanTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return "";
    
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  // Heading handlers
  const handleAddHeading = () => {
    setModules((prev) => [
      ...prev,
      {
        heading: "",
        description: "",
        topics: [""],
      },
    ]);
  };

  const handleRemoveHeading = (headingIndex: number) => {
    setModules((prev) => prev.filter((_, idx) => idx !== headingIndex));
  };

  const handleUpdateHeading = (
    headingIndex: number,
    field: "heading" | "description",
    value: string
  ) => {
    setModules((prev) =>
      prev.map((mod, idx) => (idx === headingIndex ? { ...mod, [field]: value } : mod))
    );
  };

  // Topics handlers
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

  const handleSubmit = () => {
    const title = (document.getElementById("s-title") as HTMLInputElement)?.value;
    const date = (document.getElementById("s-date") as HTMLInputElement)?.value;
    const time24 = (document.getElementById("s-time") as HTMLInputElement)?.value;
    const time = formatTimeTo12Hour(time24);
    const duration = (document.getElementById("s-duration") as HTMLInputElement)?.value;
    const seats = parseInt(
      (document.getElementById("s-seats") as HTMLInputElement)?.value || "100",
      10,
    );
    const meetLink = (document.getElementById("s-url") as HTMLInputElement)?.value;
    const summary = (document.getElementById("s-desc") as HTMLTextAreaElement)?.value;

    const cleanedModules = modules
      .filter((m) => m.heading.trim().length > 0)
      .map((m, idx) => {
        const cleanedTopics = m.topics.map((t) => t.trim()).filter((t) => t.length > 0);
        return {
          heading: m.heading.trim(),
          title: m.heading.trim(),
          description: m.description?.trim() || "",
          order: idx,
          topics: cleanedTopics,
          subModules: cleanedTopics.map((topic, tIdx) => ({
            title: topic,
            description: "",
            order: tIdx,
          })),
        };
      });

    onSubmit({
      title: title || "System Design for Interviews",
      date: date || "Aug 25, 2026",
      time: time || "7:00 PM IST",
      duration: duration || "90 min",
      seats: seats || 100,
      price: "Free",
      level,
      meetLink: meetLink || "https://meet.google.com/fdr-live",
      isJoinLinkEnabled,
      summary,
      thumbnail: thumb || undefined,
      modules: cleanedModules,
    });

    onClose();
    toast.success(editing ? "Session updated" : "Session scheduled", {
      description: editing
        ? "Enrollees will see the updated headings and covered topics."
        : "Headings, topics and Meet join link saved.",
    });
  };

  return (
    <FullScreenComposer
      title={editing ? `Edit · ${session!.title}` : "Create a live skill session"}
      description={
        editing
          ? "Update the cover, headings, topics covered or join link."
          : "Add a thumbnail, structured headings with covered topics, and the live join link."
      }
      submitLabel={uploadingImage ? "Uploading..." : (editing ? "Save changes" : "Schedule session")}
      onClose={onClose}
      onSubmit={uploadingImage ? () => {} : handleSubmit}
      onDelete={onDelete}
      deleteLabel="Delete session"
    >
      <FormSection title="Cover & title" hint="How the session appears on the Finder board.">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label>Thumbnail (16:9)</Label>
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
            className="group relative grid h-48 w-full place-items-center overflow-hidden rounded-lg border border-dashed border-border bg-secondary/40 text-muted-foreground transition-all hover:border-primary/50"
          >
            {thumb ? (
              <>
                <img
                  src={thumb}
                  alt="Session thumbnail preview"
                  className={`size-full object-cover transition-opacity ${uploadingImage ? "opacity-40" : "group-hover:opacity-90"}`}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="flex items-center gap-1.5 rounded-md bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
                    <ImagePlus className="size-3.5" /> Change cover image
                  </span>
                </div>
              </>
            ) : (
              <span className="flex flex-col items-center gap-1.5 text-xs">
                {uploadingImage ? (
                  <Loader2 className="size-6 animate-spin text-primary" />
                ) : (
                  <ImagePlus className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
                <span className="font-medium text-foreground">
                  {uploadingImage ? "Uploading to S3..." : "Upload cover image"}
                </span>
                <span className="text-[11px] text-muted-foreground">PNG, JPG or WebP (max 10MB)</span>
              </span>
            )}

            {uploadingImage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-xs">
                <Loader2 className="size-6 animate-spin text-primary" />
                <span className="text-xs font-medium text-foreground">Uploading thumbnail to S3...</span>
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;

              setUploadingImage(true);
              const previewUrl = URL.createObjectURL(f);
              setThumb(previewUrl);

              try {
                const s3Url = await uploadToS3(f, "live-skills/thumbnails");
                setThumb(s3Url);
                toast.success("Thumbnail uploaded to S3", {
                  description: "Your live session cover image is ready.",
                });
              } catch (error) {
                console.error("S3 upload error:", error);
                toast.error("Failed to upload thumbnail to S3", {
                  description: "Please check your network or try again.",
                });
                setThumb(session?.thumbnail ?? null);
              } finally {
                setUploadingImage(false);
                URL.revokeObjectURL(previewUrl);
              }
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="s-title">Session title</Label>
          <Input
            id="s-title"
            placeholder="System Design for Interviews"
            defaultValue={session?.title}
            required
          />
        </div>
      </FormSection>

      <FormSection title="Schedule & capacity" hint="When it runs live and how many students can join.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="s-date">Date</Label>
            <Input id="s-date" type="date" defaultValue={session?.date} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-time">Start time</Label>
            <Input id="s-time" type="time" defaultValue={session?.time ? formatTimeTo24Hour(session.time) : ""} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-duration">Duration</Label>
            <Input id="s-duration" placeholder="90 min" defaultValue={session?.duration} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-level">Level</Label>
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
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="s-seats">Total Seats Capacity</Label>
            <Input id="s-seats" type="number" placeholder="100" defaultValue={session?.seats || 100} />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Curriculum: Headings & Covered Topics"
        hint="Define each main heading and the specific topics that will be covered in that heading."
      >
        <div className="space-y-5">
          {modules.map((m, hIdx) => (
            <div
              key={hIdx}
              className="rounded-xl border border-border bg-card/60 p-4 transition-all duration-200 hover:border-primary/40 space-y-4 shadow-2xs"
            >
              {/* Heading Title & Controls */}
              <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                    {hIdx + 1}
                  </span>
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Heading {hIdx + 1}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove heading ${hIdx + 1}`}
                  disabled={modules.length === 1}
                  onClick={() => handleRemoveHeading(hIdx)}
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5 mr-1" /> Remove Heading
                </Button>
              </div>

              {/* Heading Name Input */}
              <div className="grid gap-2">
                <Label className="text-xs font-medium text-muted-foreground">Heading Name</Label>
                <Input
                  placeholder="e.g. System Architecture & Scalability"
                  value={m.heading}
                  onChange={(e) => handleUpdateHeading(hIdx, "heading", e.target.value)}
                  className="font-medium text-sm"
                />
                <Input
                  placeholder="Heading overview or summary (optional)"
                  value={m.description || ""}
                  onChange={(e) => handleUpdateHeading(hIdx, "description", e.target.value)}
                  className="text-xs text-muted-foreground bg-background/50"
                />
              </div>

              {/* Covered Topics in this Heading */}
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
                  Tip: Press <kbd className="px-1 py-0.5 text-[10px] bg-secondary rounded border border-border">Enter</kbd> to quickly add another topic.
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddHeading}
            className="gap-1.5"
          >
            <Plus className="size-4" /> Add another heading
          </Button>
        </div>
      </FormSection>

      <FormSection title="Live link & details" hint="Where learners join and what they get.">
        <div className="grid gap-2">
          <Label htmlFor="s-url">Live session URL</Label>
          <Input
            id="s-url"
            placeholder="https://meet.google.com/abc-defg-hij"
            defaultValue={session?.meetLink}
          />
          <p className="text-xs text-muted-foreground">
            Paste your Meet/Zoom link, or leave blank to auto-generate a Meet link.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3.5">
          <div className="space-y-0.5">
            <Label htmlFor="s-link-enable" className="text-sm font-medium cursor-pointer">
              Enable live session join link
            </Label>
            <p className="text-xs text-muted-foreground">
              When enabled, enrolled learners can see and click the join link in Finder. You can disable this until you are ready to start.
            </p>
          </div>
          <Switch
            id="s-link-enable"
            checked={isJoinLinkEnabled}
            onCheckedChange={setIsJoinLinkEnabled}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="s-desc">What learners will get</Label>
          <Textarea
            id="s-desc"
            rows={6}
            placeholder="Curriculum, outcomes, prerequisites…"
            defaultValue={session?.summary}
          />
        </div>
      </FormSection>

      {editing && onDelete && (
        <FormSection title="Danger Zone" hint="Permanently remove this session/course from Finder.">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <div>
              <p className="text-sm font-semibold text-destructive">Delete this session</p>
              <p className="text-xs text-muted-foreground">
                Once deleted, enrolled students will no longer be able to access the join link or curriculum.
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
              <span>Delete session</span>
            </Button>
          </div>
        </FormSection>
      )}
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
