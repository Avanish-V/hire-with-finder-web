import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Calendar, Clock, Users, Video, Copy } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sessions, type LiveSession } from "@/lib/finder-data";

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

function SessionCard({ s }: { s: LiveSession }) {
  const pct = Math.round((s.enrolled / s.seats) * 100);
  return (
    <article className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-5 py-3">
        <Badge variant="secondary" className={statusTone[s.status]}>
          {s.status === "Live now" && (
            <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-live" />
          )}
          {s.status}
        </Badge>
        <span className="font-display text-sm font-semibold text-primary">{s.price}</span>
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
          <Button className="flex-1" variant={s.status === "Live now" ? "default" : "outline"}>
            {s.status === "Live now" ? "Join Meet" : "Manage session"}
          </Button>
          <Button variant="ghost" size="sm">
            Enrollees
          </Button>
        </div>
      </div>
    </article>
  );
}

function NewSessionDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> New live session
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a live skill session</DialogTitle>
          <DialogDescription>
            Set it up like a course — Finder generates a Google Meet link for the scheduled time.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
            toast.success("Session scheduled", {
              description: "Meet link generated and shared with enrollees.",
            });
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="s-title">Session title</Label>
            <Input id="s-title" placeholder="System Design for Interviews" required />
          </div>
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
              <Input id="s-price" placeholder="₹499 or Free" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-desc">What learners will get</Label>
            <Textarea id="s-desc" rows={4} placeholder="Curriculum, outcomes, prerequisites…" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Auto-generate Meet link</p>
              <p className="text-xs text-muted-foreground">Sent to enrollees 15 min before start</p>
            </div>
            <Switch defaultChecked />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Schedule session</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SessionsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Skills"
        title="Live skill sessions"
        description="Publish sessions like courses — they run live online on Google Meet, with seats and enrollments tracked here."
        action={<NewSessionDialog />}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sessions.map((s) => (
          <SessionCard key={s.id} s={s} />
        ))}
      </div>
    </div>
  );
}
