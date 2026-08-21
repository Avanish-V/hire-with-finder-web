import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Calendar,
  Clock,
  Users,
  Video,
  Copy,
  Maximize2,
  X,
  ImagePlus,
  Trash2,
  Link2,
  PlayCircle,
  Pencil,
  Search,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
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
  type Applicant,
} from "@/lib/finder-data";
import { apiRequest } from "@/lib/apiClient";
import { uploadToS3 } from "@/services/mediaService";
import {
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  getSessionDetails,
  enrollInSession,
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
}: {
  s: LiveSession;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pct = Math.min(100, Math.round((s.enrolled / (s.seats || 100)) * 100));
  return (
    <article className="panel overflow-hidden transition-all duration-200 hover:border-primary/30">
      <div className="relative">
        <ThumbBanner s={s} />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <Badge variant="secondary" className={statusTone[s.status] || "bg-secondary"}>
            {s.status === "Live now" && (
              <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-live" />
            )}
            {s.status}
          </Badge>
          <Badge
            variant="secondary"
            className={s.price === "Free" ? "bg-success/15 text-success" : ""}
          >
            {s.price === "Free" ? "Free" : `Paid · ${s.price}`}
          </Badge>
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

        <button
          type="button"
          onClick={() => toast.success("Meet link copied", { description: s.meetLink })}
          className="mt-4 flex w-full items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40"
        >
          <Video className="size-3.5 shrink-0 text-primary" />
          <span className="truncate">{s.meetLink}</span>
          <Copy className="ml-auto size-3.5" />
        </button>

        <div className="mt-4 flex gap-2">
          <Button
            className="flex-1"
            variant={s.status === "Live now" ? "default" : "outline"}
            onClick={onOpen}
          >
            {s.status === "Live now" ? "Join Meet" : "Open session"}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Edit session" onClick={onEdit}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Delete session" onClick={onDelete}>
            <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Open full screen" onClick={onOpen}>
            <Maximize2 className="size-4" />
          </Button>
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
}: {
  s: LiveSession;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [details, setDetails] = useState<{
    modules: SessionModule[];
    students: Applicant[];
  }>({
    modules: s.modules ?? defaultModules,
    students: peopleFor(s.title, "Session"),
  });
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getSessionDetails(s.id, s.title).then((data) => {
      if (isMounted) {
        setDetails(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [s.id, s.title]);

  const handleEnroll = async () => {
    setEnrolling(true);
    const result = await enrollInSession(s.id);
    setEnrolling(false);
    if (result.success) {
      setEnrolled(true);
      toast.success("Enrolled successfully!", {
        description: `You are now enrolled in "${s.title}".`,
      });
    } else {
      toast.error(result.message);
    }
  };

  const modules = details.modules;
  const students = details.students;
  const pct = Math.min(100, Math.round((s.enrolled / (s.seats || 100)) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:px-8">
        <Badge variant="secondary" className={statusTone[s.status] || "bg-secondary"}>
          {s.status === "Live now" && (
            <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-live" />
          )}
          {s.status}
        </Badge>
        <p className="truncate font-medium">{s.title}</p>
        <div className="ml-auto flex items-center gap-2">
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

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:px-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="panel overflow-hidden">
            <div className="relative">
              <ThumbBanner s={s} className="h-64 md:h-80" />
              <div className="absolute inset-0 grid place-items-center bg-background/30">
                <Button
                  size="lg"
                  onClick={() => toast.success("Opening Meet", { description: s.meetLink })}
                >
                  <PlayCircle className="size-5" />
                  {s.status === "Live now" ? "Join live now" : "Open Meet room"}
                </Button>
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
            <h2 className="text-lg font-semibold">Modules</h2>
            <ol className="mt-4 space-y-3">
              {modules.map((m, i) => (
                <li key={`${m.title}-${i}`} className="flex gap-3 rounded-lg border border-border p-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-secondary text-xs font-semibold">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{m.title}</p>
                    {m.detail && <p className="text-xs text-muted-foreground">{m.detail}</p>}
                  </div>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {m.duration}
                  </span>
                </li>
              ))}
            </ol>
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
            <p className="text-eyebrow">Pricing</p>
            <p className="mt-1 font-display text-2xl font-semibold text-primary">
              {s.price === "Free" ? "Free" : s.price}
            </p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Calendar className="size-4" /> {s.date}
              </p>
              <p className="flex items-center gap-2">
                <Clock className="size-4" /> {s.time}
              </p>
              <p className="flex items-center gap-2">
                <Users className="size-4" /> {s.enrolled}/{s.seats} enrolled
              </p>
            </div>
            <Progress value={pct} className="mt-4 h-1.5" />
          </div>

          <div className="panel p-5">
            <p className="text-eyebrow">Live session URL</p>
            <button
              type="button"
              onClick={() => toast.success("Join link copied", { description: s.meetLink })}
              className="mt-3 flex w-full items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-left text-xs text-muted-foreground hover:border-primary/40"
            >
              <Link2 className="size-3.5 shrink-0 text-primary" />
              <span className="truncate">{s.meetLink}</span>
              <Copy className="ml-auto size-3.5" />
            </button>
            <Button
              className="mt-3 w-full"
              disabled={enrolling || enrolled}
              onClick={handleEnroll}
            >
              {enrolled ? <><Check className="size-4 mr-1" /> Enrolled</> : enrolling ? "Enrolling…" : "Enroll in session"}
            </Button>
            <Button
              variant="outline"
              className="mt-2 w-full"
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
  const [paid, setPaid] = useState(session ? session.price !== "Free" : true);
  const [thumb, setThumb] = useState<string | null>(session?.thumbnail ?? null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [level, setLevel] = useState<LiveSession["level"]>(session?.level ?? "Beginner");
  const [modules, setModules] = useState<SessionModule[]>(
    session?.modules ?? (editing ? defaultModules : [{ title: "", duration: "" }]),
  );
  const fileRef = useRef<HTMLInputElement>(null);

  // Convert 24-hour time (HH:mm) to 12-hour format with AM/PM
  const formatTimeTo12Hour = (time24: string): string => {
    if (!time24) return "7:00 PM IST";
    
    const [hours24, minutes] = time24.split(':').map(Number);
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12; // Convert 0 to 12 for midnight
    
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period} IST`;
  };

  // Convert 12-hour time with AM/PM (e.g., "2:06 PM IST") to 24-hour format (HH:mm)
  const formatTimeTo24Hour = (time12: string): string => {
    if (!time12) return "";
    
    // Remove IST and trim
    const cleanTime = time12.replace(/IST/gi, '').trim();
    
    // Parse time like "2:06 PM" or "2:06 AM"
    const match = cleanTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return "";
    
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    
    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  const handleSubmit = () => {
    const title = (document.getElementById("s-title") as HTMLInputElement)?.value;
    const date = (document.getElementById("s-date") as HTMLInputElement)?.value;
    const time24 = (document.getElementById("s-time") as HTMLInputElement)?.value;
    const time = formatTimeTo12Hour(time24); // Convert to 12-hour format with AM/PM
    const duration = (document.getElementById("s-duration") as HTMLInputElement)?.value;
    const seats = parseInt(
      (document.getElementById("s-seats") as HTMLInputElement)?.value || "100",
      10,
    );
    const priceVal = (document.getElementById("s-price") as HTMLInputElement)?.value;
    const meetLink = (document.getElementById("s-url") as HTMLInputElement)?.value;
    const summary = (document.getElementById("s-desc") as HTMLTextAreaElement)?.value;

    onSubmit({
      title: title || "System Design for Interviews",
      date: date || "Aug 25, 2026",
      time: time || "7:00 PM IST",
      duration: duration || "90 min",
      seats: seats || 100,
      price: paid ? priceVal || "₹499" : "Free",
      level,
      meetLink: meetLink || "https://meet.google.com/fdr-live",
      summary,
      thumbnail: thumb || undefined,
      modules: modules.filter((m) => m.title.trim().length > 0),
    });

    onClose();
    toast.success(editing ? "Session updated" : "Session scheduled", {
      description: editing
        ? "Enrollees will see the updated details."
        : "Modules saved and join link shared with enrollees.",
    });
  };

  return (
    <FullScreenComposer
      title={editing ? `Edit · ${session!.title}` : "Create a live skill session"}
      description={
        editing
          ? "Update the cover, modules, pricing or join link."
          : "Add a thumbnail, modules, pricing and the live join link."
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

      <FormSection title="Schedule & seats" hint="When it runs live and how many can join.">
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
          <div className="grid gap-2">
            <Label htmlFor="s-seats">Seats</Label>
            <Input id="s-seats" type="number" placeholder="100" defaultValue={session?.seats} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-price">Price</Label>
            <Input
              id="s-price"
              key={paid ? "paid" : "free"}
              placeholder="₹499"
              disabled={!paid}
              defaultValue={
                paid ? (session && session.price !== "Free" ? session.price : "") : "Free"
              }
            />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">{paid ? "Paid session" : "Free session"}</p>
            <p className="text-xs text-muted-foreground">
              {paid ? "Enrollees pay before getting the join link" : "Anyone can enroll at no cost"}
            </p>
          </div>
          <Switch checked={paid} onCheckedChange={setPaid} aria-label="Paid session" />
        </div>
      </FormSection>

      <FormSection title="Modules" hint="Break the session into segments, like a course.">
        <div className="space-y-2">
          {modules.map((m, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder={`Module ${i + 1} title`}
                value={m.title}
                onChange={(e) =>
                  setModules((prev) =>
                    prev.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)),
                  )
                }
              />
              <Input
                className="w-28 shrink-0"
                placeholder="20 min"
                value={m.duration}
                onChange={(e) =>
                  setModules((prev) =>
                    prev.map((x, j) => (j === i ? { ...x, duration: e.target.value } : x)),
                  )
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove module ${i + 1}`}
                disabled={modules.length === 1}
                onClick={() => setModules((prev) => prev.filter((_, j) => j !== i))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setModules((m) => [...m, { title: "", duration: "" }])}
          >
            <Plus className="size-3.5" /> Add module
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
    const targetSession = sessionsList.find((s) => s.id === id);
    const confirmed = window.confirm(
      `Are you sure you want to remove "${targetSession?.title || "this session"}"?`,
    );
    if (!confirmed) return;

    await deleteSession(id);
    setSessionsList((prev) => prev.filter((s) => s.id !== id));
    if (openId === id) setOpenId(null);
    if (editId === id) setEditId(null);
    toast.success("Session removed", {
      description: "The live skill session has been deleted.",
    });
  };

  // Filter sessions based on search query and level filter
  const filteredSessions = sessionsList.filter((s) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesLevel = selectedLevel === "All" || s.level === selectedLevel;

    return matchesSearch && matchesLevel;
  });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Skills"
        title="Live skill sessions"
        description="Publish sessions like courses — they run live online on Google Meet, with seats and enrollments tracked here."
        action={
          <Button onClick={() => setComposing(true)}>
            <Plus className="size-4" /> New live session
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sessions, topics or hosts…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["All", "Beginner", "Intermediate", "Advanced"].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelectedLevel(lvl)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedLevel === lvl
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Sessions */}
      {filteredSessions.length === 0 ? (
        <div className="panel p-12 text-center">
          <p className="font-semibold">No live sessions found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery || selectedLevel !== "All"
              ? "Try adjusting your search terms or filters."
              : "Create your first live skill session to get started."}
          </p>
          <Button className="mt-4" onClick={() => setComposing(true)}>
            <Plus className="size-4" /> Schedule session
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSessions.map((s) => (
            <SessionCard
              key={s.id}
              s={s}
              onOpen={() => setOpenId(s.id)}
              onEdit={() => setEditId(s.id)}
              onDelete={() => handleDelete(s.id)}
            />
          ))}
        </div>
      )}

      {composing && (
        <NewSessionScreen onClose={() => setComposing(false)} onSubmit={handleCreate} />
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
          onEdit={() => setEditId(active.id)}
          onDelete={() => handleDelete(active.id)}
        />
      )}
    </div>
  );
}

