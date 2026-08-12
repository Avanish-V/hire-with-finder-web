import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
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
import { sessions, defaultModules, type LiveSession, type SessionModule } from "@/lib/finder-data";

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

function SessionCard({ s, onOpen }: { s: LiveSession; onOpen: () => void }) {
  const pct = Math.round((s.enrolled / s.seats) * 100);
  return (
    <article className="panel overflow-hidden">
      <div className="relative">
        <ThumbBanner s={s} />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <Badge variant="secondary" className={statusTone[s.status]}>
            {s.status === "Live now" && (
              <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-live" />
            )}
            {s.status}
          </Badge>
          <Badge variant="secondary" className={s.price === "Free" ? "bg-success/15 text-success" : ""}>
            {s.price === "Free" ? "Free" : `Paid · ${s.price}`}
          </Badge>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold">{s.title}</h3>
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
          <Button className="flex-1" variant={s.status === "Live now" ? "default" : "outline"} onClick={onOpen}>
            {s.status === "Live now" ? "Join Meet" : "Open session"}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Open full screen" onClick={onOpen}>
            <Maximize2 className="size-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}

function FullScreenSession({ s, onClose }: { s: LiveSession; onClose: () => void }) {
  const modules = s.modules ?? defaultModules;
  const pct = Math.round((s.enrolled / s.seats) * 100);
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:px-8">
        <Badge variant="secondary" className={statusTone[s.status]}>
          {s.status === "Live now" && (
            <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-live" />
          )}
          {s.status}
        </Badge>
        <p className="truncate font-medium">{s.title}</p>
        <Button variant="ghost" size="icon" className="ml-auto" aria-label="Exit full screen" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:px-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="panel overflow-hidden">
            <div className="relative">
              <ThumbBanner s={s} className="h-64 md:h-80" />
              <div className="absolute inset-0 grid place-items-center bg-background/30">
                <Button size="lg" onClick={() => toast.success("Opening Meet", { description: s.meetLink })}>
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
                <li key={m.title} className="flex gap-3 rounded-lg border border-border p-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-secondary text-xs font-semibold">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{m.title}</p>
                    {m.detail && <p className="text-xs text-muted-foreground">{m.detail}</p>}
                  </div>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">{m.duration}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="panel mt-6 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Enrolled students</h2>
                <p className="text-sm text-muted-foreground">
                  {s.enrolled} enrolled · {s.seats - s.enrolled} seats left
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
              people={peopleFor(s.title, "Session")}
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
            <Button className="mt-3 w-full">Notify enrollees</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function NewSessionScreen({ onClose }: { onClose: () => void }) {
  const [paid, setPaid] = useState(true);
  const [thumb, setThumb] = useState<string | null>(null);
  const [modules, setModules] = useState<SessionModule[]>([{ title: "", duration: "" }]);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <FullScreenComposer
      title="Create a live skill session"
      description="Add a thumbnail, modules, pricing and the live join link."
      submitLabel="Schedule session"
      onClose={onClose}
      onSubmit={() => {
        onClose();
        toast.success("Session scheduled", {
          description: "Modules saved and join link shared with enrollees.",
        });
      }}
    >
      <FormSection title="Cover & title" hint="How the session appears on the Finder board.">
        <div className="grid gap-2">
          <Label>Thumbnail</Label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative grid h-48 w-full place-items-center overflow-hidden rounded-lg border border-dashed border-border bg-secondary/40 text-muted-foreground transition-colors hover:border-primary/50"
          >
            {thumb ? (
              <img src={thumb} alt="Session thumbnail preview" className="size-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-xs">
                <ImagePlus className="size-5" />
                Upload cover image (16:9)
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setThumb(URL.createObjectURL(f));
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="s-title">Session title</Label>
          <Input id="s-title" placeholder="System Design for Interviews" required />
        </div>
      </FormSection>

      <FormSection title="Schedule & seats" hint="When it runs live and how many can join.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="s-date">Date</Label>
            <Input id="s-date" type="date" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-time">Start time</Label>
            <Input id="s-time" type="time" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-duration">Duration</Label>
            <Input id="s-duration" placeholder="90 min" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-level">Level</Label>
            <Select defaultValue="Beginner">
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
            <Input id="s-seats" type="number" placeholder="100" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-price">Price</Label>
            <Input
              id="s-price"
              key={paid ? "paid" : "free"}
              placeholder="₹499"
              disabled={!paid}
              defaultValue={paid ? "" : "Free"}
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
          <Input id="s-url" type="url" placeholder="https://meet.google.com/abc-defg-hij" />
          <p className="text-xs text-muted-foreground">
            Paste your Meet/Zoom link, or leave blank to auto-generate a Meet link.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="s-desc">What learners will get</Label>
          <Textarea id="s-desc" rows={6} placeholder="Curriculum, outcomes, prerequisites…" />
        </div>
      </FormSection>
    </FullScreenComposer>
  );
}

function SessionsPage() {
  const [composing, setComposing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const active = sessions.find((s) => s.id === openId) ?? null;

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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sessions.map((s) => (
          <SessionCard key={s.id} s={s} onOpen={() => setOpenId(s.id)} />
        ))}
      </div>
      {composing && <NewSessionScreen onClose={() => setComposing(false)} />}
      {active && <FullScreenSession s={active} onClose={() => setOpenId(null)} />}
    </div>
  );
}

