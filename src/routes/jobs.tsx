import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Users, Plus, MoreHorizontal, IndianRupee, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { FullScreenComposer, FormSection } from "@/components/FullScreenComposer";
import { PeopleList, peopleFor } from "@/components/PeopleList";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

function JobCard({
  job,
  onViewApplicants,
  onEdit,
}: {
  job: Job;
  onViewApplicants: () => void;
  onEdit: () => void;
}) {
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
        <Button variant="ghost" size="icon" aria-label="Post options" onClick={onEdit}>
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
        <Button variant="outline" size="sm" className="flex-1" onClick={onViewApplicants}>
          View applicants
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Edit
        </Button>
      </div>
    </article>
  );
}

function JobApplicantsScreen({ job, onClose }: { job: Job; onClose: () => void }) {
  const people = peopleFor(job.title, "Job");
  const stages = ["New", "Shortlisted", "Interview", "Hired", "Rejected"] as const;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 md:px-8">
          <Button variant="ghost" size="icon" aria-label="Close applicants" onClick={onClose}>
            <X className="size-4" />
          </Button>
          <div className="min-w-0">
            <p className="truncate font-medium">Applicants · {job.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {job.company} · {job.location}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {stages.map((s) => (
            <div key={s} className="panel p-4">
              <p className="text-eyebrow">{s}</p>
              <p className="mt-2 font-display text-2xl font-semibold">
                {people.filter((p) => p.stage === s).length}
              </p>
            </div>
          ))}
        </div>

        <section className="panel mt-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {people.length} candidate{people.length === 1 ? "" : "s"}
            </h2>
            <Button variant="outline" size="sm" onClick={() => toast.success("Export started (CSV)")}>
              Export
            </Button>
          </div>
          <PeopleList people={people} emptyLabel="No applications for this role yet." />
        </section>
      </div>
    </div>
  );
}

function PostJobScreen({ job, onClose }: { job?: Job; onClose: () => void }) {
  const editing = Boolean(job);
  return (
    <FullScreenComposer
      title={editing ? `Edit · ${job!.title}` : "Post an internship or job"}
      description={
        editing
          ? "Changes go live on the Finder board as soon as you save."
          : "Published roles appear on the Finder board immediately."
      }
      submitLabel={editing ? "Save changes" : "Publish role"}
      onClose={onClose}
      onSubmit={() => {
        onClose();
        toast.success(editing ? "Role updated" : "Role posted", {
          description: editing
            ? "Your changes are live on the listing."
            : "Your listing is now live on Finder.",
        });
      }}
    >
      <FormSection title="Role basics" hint="What you're hiring for and where.">
        <div className="grid gap-2">
          <Label htmlFor="job-title">Role title</Label>
          <Input id="job-title" placeholder="Frontend Engineering Intern" defaultValue={job?.title} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="job-company">Company</Label>
            <Input id="job-company" placeholder="Northwind Labs" defaultValue={job?.company} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="job-type">Type</Label>
            <Select defaultValue={job?.type ?? "Internship"}>
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
            <Input id="job-location" placeholder="Remote · India" defaultValue={job?.location} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="job-pay">Stipend / salary</Label>
            <Input id="job-pay" placeholder="₹25,000 / mo" defaultValue={job?.stipend} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Requirements" hint="Skills and the detail candidates need.">
        <div className="grid gap-2">
          <Label htmlFor="job-skills">Required skills</Label>
          <Input id="job-skills" placeholder="React, TypeScript, Tailwind" defaultValue={job?.skills.join(", ")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="job-desc">Description</Label>
          <Textarea id="job-desc" rows={8} placeholder="What the role involves…" />
        </div>
      </FormSection>
    </FullScreenComposer>
  );
}

function JobsPage() {
  const [composing, setComposing] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const editingJob = jobs.find((j) => j.id === editingJobId) ?? null;
  const [applicantsJobId, setApplicantsJobId] = useState<string | null>(null);
  const activeJob = jobs.find((j) => j.id === applicantsJobId) ?? null;

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
        action={
          <Button onClick={() => setComposing(true)}>
            <Plus className="size-4" /> Post a role
          </Button>
        }
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
                <JobCard
                  key={job.id}
                  job={job}
                  onViewApplicants={() => setApplicantsJobId(job.id)}
                  onEdit={() => setEditingJobId(job.id)}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {composing && <PostJobScreen onClose={() => setComposing(false)} />}
      {editingJob && (
        <PostJobScreen job={editingJob} onClose={() => setEditingJobId(null)} />
      )}
      {activeJob && (
        <JobApplicantsScreen job={activeJob} onClose={() => setApplicantsJobId(null)} />
      )}
    </div>
  );
}
