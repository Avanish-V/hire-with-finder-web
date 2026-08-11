import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Users, Plus, MoreHorizontal, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { jobs, type Job } from "@/lib/finder-data";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Jobs & Internships — Finder" },
      {
        name: "description",
        content:
          "Post internships and jobs, track applicant volume and manage every opening from one board.",
      },
      { property: "og:title", content: "Jobs & Internships — Finder" },
      {
        property: "og:description",
        content: "Create and manage internship and job postings in Finder.",
      },
    ],
  }),
  component: JobsPage,
});

const statusTone: Record<Job["status"], string> = {
  Open: "bg-success/15 text-success",
  Closed: "bg-muted text-muted-foreground",
  Draft: "bg-warning/15 text-warning",
};

function JobCard({ job }: { job: Job }) {
  return (
    <article className="panel p-5 transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={statusTone[job.status]}>
              {job.status}
            </Badge>
            <span className="text-xs text-muted-foreground">{job.posted}</span>
          </div>
          <h3 className="mt-2 text-lg font-semibold">{job.title}</h3>
          <p className="text-sm text-muted-foreground">{job.company}</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Post options">
          <MoreHorizontal className="size-4" />
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3.5" /> {job.location}
        </span>
        <span className="flex items-center gap-1.5">
          <IndianRupee className="size-3.5" /> {job.stipend}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5" /> {job.applicants} applicants
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {job.skills.map((s) => (
          <span key={s} className="rounded-full bg-secondary px-2.5 py-1 text-xs">
            {s}
          </span>
        ))}
      </div>

      <div className="mt-5 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          View applicants
        </Button>
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      </div>
    </article>
  );
}

function PostJobDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Post a role
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Post an internship or job</DialogTitle>
          <DialogDescription>
            Published roles appear on the Finder board immediately.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
            toast.success("Role posted", { description: "Your listing is now live on Finder." });
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="job-title">Role title</Label>
            <Input id="job-title" placeholder="Frontend Engineering Intern" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="job-company">Company</Label>
              <Input id="job-company" placeholder="Northwind Labs" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job-type">Type</Label>
              <Select defaultValue="Internship">
                <SelectTrigger id="job-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Internship">Internship</SelectItem>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job-location">Location</Label>
              <Input id="job-location" placeholder="Remote · India" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job-pay">Stipend / salary</Label>
              <Input id="job-pay" placeholder="₹25,000 / mo" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="job-skills">Required skills</Label>
            <Input id="job-skills" placeholder="React, TypeScript, Tailwind" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="job-desc">Description</Label>
            <Textarea id="job-desc" rows={4} placeholder="What the role involves…" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Publish role</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function JobsPage() {
  const groups = {
    all: jobs,
    internship: jobs.filter((j) => j.type === "Internship"),
    open: jobs.filter((j) => j.status === "Open"),
    draft: jobs.filter((j) => j.status === "Draft"),
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Recruitment"
        title="Jobs & internships"
        description="Every opening you've published, with live applicant counts and quick edits."
        action={<PostJobDialog />}
      />

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({groups.all.length})</TabsTrigger>
          <TabsTrigger value="internship">Internships ({groups.internship.length})</TabsTrigger>
          <TabsTrigger value="open">Open ({groups.open.length})</TabsTrigger>
          <TabsTrigger value="draft">Drafts ({groups.draft.length})</TabsTrigger>
        </TabsList>
        {(Object.keys(groups) as (keyof typeof groups)[]).map((key) => (
          <TabsContent key={key} value={key} className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {groups[key].map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
