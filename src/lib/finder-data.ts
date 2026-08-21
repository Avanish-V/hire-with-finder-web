export const JOB_TYPES = {
  INTERNSHIP: "Internship",
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
} as const;

export const JOB_STATUSES = {
  OPEN: "Open",
  CLOSED: "Closed",
  DRAFT: "Draft",
} as const;

export type JobType = typeof JOB_TYPES[keyof typeof JOB_TYPES];
export type JobStatus = typeof JOB_STATUSES[keyof typeof JOB_STATUSES];

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: JobType;
  stipend: string;
  posted: string;
  applicants: number;
  skills: string[];
  status: JobStatus;
  description?: string;
};

export const jobs: Job[] = []; // TODO: Handle cases where jobs are not available from API

export type LiveSession = {
  id: string;
  title: string;
  host: string;
  date: string;
  time: string;
  duration: string;
  seats: number;
  enrolled: number;
  price: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  status: "Live now" | "Scheduled" | "Completed";
  meetLink: string;
  tags: string[];
  thumbnail?: string;
  summary?: string;
  modules?: SessionModule[];
};

export type SessionModule = {
  title: string;
  duration: string;
  detail?: string;
};

export const defaultModules: SessionModule[] = []; // TODO: Handle cases where default modules are not available from API

export const sessions: LiveSession[] = []; // TODO: Handle cases where sessions are not available from API

export type Applicant = {
  id: string;
  name: string;
  initials: string;
  role: string;
  target: string;
  kind: "Job" | "Session";
  applied: string;
  match: number;
  stage: "New" | "Shortlisted" | "Interview" | "Hired" | "Rejected";
  email: string;
  externalUserId?: string | null;
  avatarUrl?: string | null;
};

export const applicants: Applicant[] = []; // TODO: Handle cases where applicants are not available from API

export const stageTone: Record<Applicant["stage"], string> = {
  New: "bg-muted text-muted-foreground",
  Shortlisted: "bg-warning/15 text-warning",
  Interview: "bg-chart-4/15 text-chart-4",
  Hired: "bg-success/15 text-success",
  Rejected: "bg-destructive/15 text-destructive",
};

export type CandidateEducation = {
  college: string;
  course: string;
  specialization: string;
  courseStart: string;
  courseEnd: string;
  cgpa: string;
};

export type CandidateSkill = { name: string; level: "Beginner" | "Intermediate" | "Advanced" };

export type CandidateProfile = {
  tagline: string;
  summary: string;
  phone: string;
  gender: "Male" | "Female" | "Other" | "Unspecified";
  location: string;
  verified: boolean;
  githubUsername?: string;
  avatarUrl?: string;
  auraPoints: number;
  auraLevel?: string;
  education: CandidateEducation;
  skills: CandidateSkill[];
  experience: { role: string; org: string; period: string }[];
};

const profiles: Record<string, CandidateProfile> = {}; // TODO: Handle cases where candidate profiles are not available from API

export function profileFor(a: Applicant): CandidateProfile {
  return (
    profiles[a.id] ?? {
      tagline: a.role,
      summary: `${a.name} applied to ${a.target}. Profile synced from their Finder account.`,
      phone: "+91 90000 00000",
      gender: "Unspecified",
      location: "India",
      verified: a.match >= 80,
      githubUsername: a.name.toLowerCase().replace(/\s+/g, ""),
      auraPoints: a.match * 12,
      education: {
        college: "Not provided",
        course: "Not provided",
        specialization: "—",
        courseStart: "—",
        courseEnd: "—",
        cgpa: "—",
      },
      skills: [
        { name: "Communication", level: "Intermediate" },
        { name: "Problem solving", level: "Intermediate" },
      ],
      experience: [],
    }
  );
}
