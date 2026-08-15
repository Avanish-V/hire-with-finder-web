import { apiRequest } from "@/lib/apiClient";
import {
  applicants as staticApplicants,
  profileFor,
  type Applicant,
  type CandidateProfile,
} from "@/lib/finder-data";

let inMemoryApplicants: Applicant[] = [...staticApplicants];

interface BackendApplicationPayload {
  id?: string;
  _id?: string;
  name?: string;
  candidate_name?: string;
  guest_name?: string;
  role?: string;
  qualification?: string;
  target?: string;
  job_title?: string;
  course_title?: string;
  jobs?: { title?: string; type?: string };
  users?: { name?: string; email?: string };
  sessions?: { title?: string };
  kind?: Applicant["kind"];
  course_id?: string;
  session_id?: string;
  applied?: string;
  applied_at?: string;
  created_at?: string;
  match?: number;
  stage?: Applicant["stage"];
  status?: Applicant["stage"] | string;
  email?: string;
  guest_email?: string;
  guest_resume_url?: string;
  [key: string]: unknown;
}

/**
 * Maps backend application entity to frontend Applicant type
 */
export function mapBackendApplication(
  raw: BackendApplicationPayload,
  fallbackTarget?: string,
): Applicant {
  const applicantName =
    raw.users?.name ||
    raw.guest_name ||
    raw.name ||
    raw.candidate_name ||
    "Applicant";

  const applicantEmail =
    raw.users?.email ||
    raw.guest_email ||
    raw.email ||
    "applicant@mail.com";

  const initials = applicantName
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AP";

  // Normalize backend status ('Pending' -> 'New', 'Shortlisted', 'Interview', 'Hired', 'Rejected')
  let stage: Applicant["stage"] = "New";
  const rawStatus = (raw.status || raw.stage || "New").toString().toLowerCase();
  if (rawStatus === "shortlisted") stage = "Shortlisted";
  else if (rawStatus === "interview") stage = "Interview";
  else if (rawStatus === "hired") stage = "Hired";
  else if (rawStatus === "rejected") stage = "Rejected";
  else stage = "New";

  const targetTitle =
    raw.jobs?.title ||
    raw.target ||
    raw.job_title ||
    raw.course_title ||
    raw.sessions?.title ||
    fallbackTarget ||
    "Role";

  return {
    id: raw.id || raw._id || `a-${Date.now()}`,
    name: applicantName,
    initials,
    role: raw.role || raw.qualification || (raw.guest_resume_url ? "Candidate" : "Applicant"),
    target: targetTitle,
    kind: raw.kind || (raw.course_id || raw.session_id ? "Session" : "Job"),
    applied: raw.applied_at
      ? new Date(raw.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : raw.applied || "Recently",
    match: typeof raw.match === "number" ? raw.match : 88,
    stage,
    email: applicantEmail,
  };
}

/**
 * Fetch all applicants and enrollees
 */
export async function getApplicants(): Promise<Applicant[]> {
  try {
    const res = await apiRequest("/api/applications");
    if (res.ok) {
      const data = (await res.json()) as BackendApplicationPayload[];
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((d) => mapBackendApplication(d));
        inMemoryApplicants = mapped;
        return inMemoryApplicants;
      }
    }
  } catch (error) {
    console.debug("Applications API unavailable, using static fallback:", error);
  }

  return [...inMemoryApplicants];
}

/**
 * Fetch applicants for a specific job from GET /api/jobs/:id/applicants
 */
export async function getJobApplicants(
  jobId: string,
  jobTitle: string,
): Promise<Applicant[]> {
  try {
    const res = await apiRequest(`/api/jobs/${jobId}/applicants`);
    if (res.ok) {
      const data = (await res.json()) as BackendApplicationPayload[];
      if (Array.isArray(data)) {
        if (data.length > 0) {
          return data.map((d) => mapBackendApplication(d, jobTitle));
        }
        // If the backend has 0 applicants for this job, return empty list
        return [];
      }
    }
  } catch (error) {
    console.debug(`GET /api/jobs/${jobId}/applicants error, falling back:`, error);
  }

  // Fallback to static mock applicants matching the job title
  const staticMatches = inMemoryApplicants.filter(
    (a) => a.target.toLowerCase() === jobTitle.toLowerCase() && a.kind === "Job",
  );
  return staticMatches;
}

/**
 * Fetch applicants for a specific target (job title or session title)
 */
export async function getApplicantsForTarget(
  target: string,
  kind: "Job" | "Session",
): Promise<Applicant[]> {
  const all = await getApplicants();
  return all.filter((a) => a.target === target && a.kind === kind);
}

/**
 * Update candidate stage in hiring pipeline
 */
export async function updateApplicantStage(
  id: string,
  stage: Applicant["stage"],
): Promise<boolean> {
  try {
    const res = await apiRequest(`/api/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: stage }),
    });

    if (res.ok) {
      inMemoryApplicants = inMemoryApplicants.map((a) => (a.id === id ? { ...a, stage } : a));
      return true;
    }
  } catch {
    // TODO: Connect PATCH /api/applications/:id/status when backend service is available
    console.debug("Update application status API unavailable, updating locally");
  }

  inMemoryApplicants = inMemoryApplicants.map((a) => (a.id === id ? { ...a, stage } : a));
  return true;
}

/**
 * Get full candidate profile
 */
export async function getCandidateProfile(applicant: Applicant): Promise<CandidateProfile> {
  try {
    const res = await apiRequest(`/api/applications/${applicant.id}/profile`);
    if (res.ok) {
      const data = (await res.json()) as CandidateProfile;
      if (data && data.summary) {
        return data;
      }
    }
  } catch {
    // Fallback to static rich profile generator
    console.debug("Candidate profile API unavailable, using rich mock profile");
  }

  return profileFor(applicant);
}
