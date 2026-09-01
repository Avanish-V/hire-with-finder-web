import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MapPin, Users, Plus, MoreHorizontal, IndianRupee, X, Trash2, Edit, AlertCircle, Calendar, Clock } from "lucide-react";
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
import { type Job, JOB_TYPES, JOB_STATUSES } from "@/lib/finder-data";
import { getJobs, createJob, updateJob, deleteJob } from "@/services/jobsService";
import { getJobApplicants } from "@/services/applicantsService";
import { useAuth } from "@/lib/authContext";
import { getAuthToken } from "@/lib/apiClient";

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
        content: "Openings and candidate pipeline in one board.",
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
  onDelete,
}: {
  job: Job;
  onViewApplicants: () => void;
  onEdit: () => void;
  onDelete: () => void;
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
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit role"
            title="Edit role"
            onClick={onEdit}
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <Edit className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete role"
            title="Delete role"
            onClick={onDelete}
            className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
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
        {job.durationMonths && (
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" /> {job.durationMonths} month{job.durationMonths !== 1 ? 's' : ''}
          </span>
        )}
        {job.deadline && (
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5" /> Deadline: {new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
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
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          Delete
        </Button>
      </div>
    </article>
  );
}

function JobApplicantsScreen({ job, onClose }: { job: Job; onClose: () => void }) {
  const [people, setPeople] = useState(() => peopleFor(job.title, "Job"));
  const [loading, setLoading] = useState(true);
  const stages = ["New", "Shortlisted", "Interview", "Hired", "Rejected"] as const;

  useEffect(() => {
    let isMounted = true;
    getJobApplicants(job.id, job.title)
      .then((data) => {
        if (isMounted) {
          setPeople(data);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [job.id, job.title]);

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success("Export started (CSV)")}
            >
              Export
            </Button>
          </div>
          <PeopleList people={people} emptyLabel="No applications for this role yet." />
        </section>
      </div>
    </div>
  );
}

function PostJobScreen({
  job,
  onClose,
  onSubmit,
  onDelete,
}: {
  job?: Job;
  onClose: () => void;
  onSubmit: (data: Partial<Job>) => void;
  onDelete?: () => void;
}) {
  const editing = Boolean(job);
  const [selectedType, setSelectedType] = useState<Job["type"]>(job?.type ?? "Internship");
  const [posterType, setPosterType] = useState<"USER_PROFILE" | "COMPANY_PROFILE">("USER_PROFILE");
  const [hasCompanyProfile, setHasCompanyProfile] = useState<boolean | null>(null);
  const [checkingCompany, setCheckingCompany] = useState(false);

  // Check if user has a company profile when component mounts
  useEffect(() => {
    const checkCompanyProfile = async () => {
      setCheckingCompany(true);
      try {
        const token = getAuthToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081'}/api/company/profile`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        });

        setHasCompanyProfile(response.ok);
      } catch (error) {
        console.error("Error checking company profile:", error);
        setHasCompanyProfile(false);
      } finally {
        setCheckingCompany(false);
      }
    };

    checkCompanyProfile();
  }, []);

  const handleSubmit = async () => {
    const title = (document.getElementById("job-title") as HTMLInputElement)?.value;
    const location = (document.getElementById("job-location") as HTMLInputElement)?.value;
    const stipend = (document.getElementById("job-pay") as HTMLInputElement)?.value;
    const skillsRaw = (document.getElementById("job-skills") as HTMLInputElement)?.value;
    const desc = (document.getElementById("job-desc") as HTMLTextAreaElement)?.value;
    const deadline = (document.getElementById("job-deadline") as HTMLInputElement)?.value;
    const durationMonths = (document.getElementById("job-duration") as HTMLInputElement)?.value;

    const skills = skillsRaw ? skillsRaw.split(",").map((s) => s.trim()) : ["React"];

    // Validate company profile exists if posting as company
    if (posterType === "COMPANY_PROFILE" && hasCompanyProfile === false) {
      toast.error("Company profile required", {
        description: "Please create a company profile before posting jobs on behalf of a company, or select 'Your Profile' instead.",
      });
      return;
    }

    onSubmit({
      title: title || "Frontend Engineering Intern",
      type: selectedType,
      location: location || "Remote · India",
      stipend: stipend || "₹25,000 / mo",
      skills,
      status: "Open",
      description: desc,
      posterType, // Add posterType to the submission
      deadline: deadline || undefined,
      durationMonths: durationMonths ? parseInt(durationMonths, 10) : undefined,
    } as any);

    onClose();
    toast.success(editing ? "Role updated" : "Role posted", {
      description: editing
        ? "Your changes are live on the listing."
        : "Your listing is now live on Finder.",
    });
  };

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
      onSubmit={handleSubmit}
      onDelete={onDelete}
      deleteLabel="Delete role"
    >
      <FormSection title="Post as" hint="Choose how you want to appear on this job listing.">
        <div className="grid gap-3">
          <div
            onClick={() => setPosterType("USER_PROFILE")}
            className={`flex items-start gap-3 cursor-pointer rounded-lg border-2 p-4 transition-colors ${
              posterType === "USER_PROFILE"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="mt-0.5">
              <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                posterType === "USER_PROFILE" ? "border-primary" : "border-muted-foreground"
              }`}>
                {posterType === "USER_PROFILE" && (
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <p className="font-medium">Your Profile</p>
              <p className="text-sm text-muted-foreground">
                Post as your personal recruiter profile. Candidates will see your name.
              </p>
            </div>
          </div>

          <div
            onClick={() => setPosterType("COMPANY_PROFILE")}
            className={`flex items-start gap-3 cursor-pointer rounded-lg border-2 p-4 transition-colors ${
              posterType === "COMPANY_PROFILE"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="mt-0.5">
              <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                posterType === "COMPANY_PROFILE" ? "border-primary" : "border-muted-foreground"
              }`}>
                {posterType === "COMPANY_PROFILE" && (
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <p className="font-medium">Company Profile</p>
              <p className="text-sm text-muted-foreground">
                Post on behalf of your company. Candidates will see your company name and logo.
              </p>
              {!checkingCompany && hasCompanyProfile === false && (
                <div className="mt-2 flex items-start gap-2 rounded-md bg-warning/10 border border-warning/30 p-2">
                  <AlertCircle className="size-4 text-warning shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs">
                    <p className="font-medium text-warning">No company profile found</p>
                    <p className="text-muted-foreground mt-0.5">
                      You need to create a company profile first. Go to Profile &gt; Company.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Role basics" hint="What you're hiring for and where.">
        <div className="grid gap-2">
          <Label htmlFor="job-title">Role title</Label>
          <Input
            id="job-title"
            placeholder="Frontend Engineering Intern"
            defaultValue={job?.title}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="job-type">Type</Label>
            <Select
              defaultValue={selectedType}
              onValueChange={(v) => setSelectedType(v as Job["type"])}
            >
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
          <div className="grid gap-2">
            <Label htmlFor="job-duration">Duration (months)</Label>
            <Input 
              id="job-duration" 
              type="number" 
              placeholder="e.g., 3, 6, 12" 
              defaultValue={job?.durationMonths}
              min="1"
            />
            <p className="text-xs text-muted-foreground">
              How long this role will last (optional)
            </p>
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="job-deadline">Application deadline</Label>
            <Input 
              id="job-deadline" 
              type="date" 
              defaultValue={job?.deadline}
            />
            <p className="text-xs text-muted-foreground">
              Last date to accept applications (optional)
            </p>
          </div>
        </div>
      </FormSection>

      <FormSection title="Requirements" hint="Skills and the detail candidates need.">
        <div className="grid gap-2">
          <Label htmlFor="job-skills">Required skills</Label>
          <Input
            id="job-skills"
            placeholder="React, TypeScript, Tailwind"
            defaultValue={job?.skills.join(", ")}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="job-desc">Description</Label>
          <Textarea 
            id="job-desc" 
            rows={8} 
            placeholder="What the role involves…" 
            defaultValue={job?.description || ""}
          />
        </div>
      </FormSection>

      {editing && onDelete && (
        <FormSection title="Danger Zone" hint="Permanently remove this opening from Finder.">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <div>
              <p className="text-sm font-semibold text-destructive">Delete this role</p>
              <p className="text-xs text-muted-foreground">
                Once deleted, candidates will no longer be able to view or apply to this role.
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
              <span>Delete opening</span>
            </Button>
          </div>
        </FormSection>
      )}
    </FullScreenComposer>
  );
}

function JobsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [jobsList, setJobsList] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [applicantsJobId, setApplicantsJobId] = useState<string | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    console.log("Auth status - isAuthenticated:", isAuthenticated, "user:", user, "token:", token ? "present" : "missing");
  }, [isAuthenticated, user]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getJobs()
      .then((data) => {
        if (isMounted) {
          setJobsList(data);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const editingJob = jobsList.find((j) => j.id === editingJobId) ?? null;
  const activeJob = jobsList.find((j) => j.id === applicantsJobId) ?? null;

  const handleCreate = async (data: Partial<Job>) => {
    if (!isAuthenticated) {
      toast.error("You must be signed in to create jobs");
      navigate({ to: "/auth" });
      return;
    }
    
    try {
      const created = await createJob(data);
      setJobsList((prev) => [created, ...prev]);
      toast.success("Job posted successfully!");
    } catch (error: any) {
      console.error("Failed to create job:", error);
      const errorMessage = error?.message || "Failed to create job. Please check console for details.";
      
      if (errorMessage.includes("401") || errorMessage.includes("403")) {
        toast.error("Authentication required. Please sign in again.");
        navigate({ to: "/auth" });
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleUpdate = async (data: Partial<Job>) => {
    if (!editingJobId) return;
    try {
      const updated = await updateJob(editingJobId, data);
      if (updated) {
        setJobsList((prev) => prev.map((j) => (j.id === editingJobId ? updated : j)));
        toast.success("Job updated successfully!");
      }
    } catch (error: any) {
      console.error("Failed to update job:", error);
      toast.error(error?.message || "Failed to update job. Please check console for details.");
    }
  };

  const handleDelete = async (jobId: string, jobTitle: string) => {
    const ok = window.confirm(`Are you sure you want to delete "${jobTitle}"?`);
    if (!ok) return;

    try {
      const success = await deleteJob(jobId);
      if (success) {
        setJobsList((prev) => prev.filter((j) => j.id !== jobId));
        if (editingJobId === jobId) setEditingJobId(null);
        if (applicantsJobId === jobId) setApplicantsJobId(null);
        toast.success(`"${jobTitle}" has been deleted.`);
      } else {
        toast.error("Failed to delete opening.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete opening.");
    }
  };

  const groups = {
    all: jobsList,
    full_time: jobsList.filter((j) => j.type === JOB_TYPES.FULL_TIME),
    internship: jobsList.filter((j) => j.type === JOB_TYPES.INTERNSHIP),
    open: jobsList.filter((j) => j.status === JOB_STATUSES.OPEN),
    draft: jobsList.filter((j) => j.status === JOB_STATUSES.DRAFT),
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

      {!isAuthenticated && (
        <div className="mb-6 rounded-lg border border-warning/40 bg-warning/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-warning shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-warning">Authentication Required</p>
              <p className="text-sm text-muted-foreground mt-1">
                You need to sign in to create, edit, or delete jobs. You can view public job listings without signing in.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => navigate({ to: "/auth" })}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4 text-sm text-muted-foreground">Loading jobs...</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({groups.all.length})</TabsTrigger>
            <TabsTrigger value="full_time">Full-time ({groups.full_time.length})</TabsTrigger>
            <TabsTrigger value="internship">Internships ({groups.internship.length})</TabsTrigger>
            <TabsTrigger value="open">Open ({groups.open.length})</TabsTrigger>
            <TabsTrigger value="draft">Drafts ({groups.draft.length})</TabsTrigger>
          </TabsList>
          {(Object.keys(groups) as (keyof typeof groups)[]).map((key) => (
            <TabsContent key={key} value={key} className="mt-6">
              {groups[key].length === 0 ? (
                <div className="panel p-8 text-center">
                  <p className="text-muted-foreground">No jobs found in this category.</p>
                  <Button onClick={() => setComposing(true)} variant="outline" className="mt-4">
                    <Plus className="size-4" /> Post your first role
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {groups[key].map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onViewApplicants={() => setApplicantsJobId(job.id)}
                      onEdit={() => setEditingJobId(job.id)}
                      onDelete={() => handleDelete(job.id, job.title)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {composing && <PostJobScreen onClose={() => setComposing(false)} onSubmit={handleCreate} />}
      {editingJob && (
        <PostJobScreen
          job={editingJob}
          onClose={() => setEditingJobId(null)}
          onSubmit={handleUpdate}
          onDelete={() => handleDelete(editingJob.id, editingJob.title)}
        />
      )}
      {activeJob && (
        <JobApplicantsScreen job={activeJob} onClose={() => setApplicantsJobId(null)} />
      )}
    </div>
  );
}
