import {
  type Applicant,
  type CandidateProfile,
  type CandidateSkill,
  profileFor,
} from "@/lib/finder-data";
import { apiRequest } from "@/lib/apiClient";

export interface BackendApplicationPayload {
  id?: string;
  _id?: string;
  // ApplicationResponseDto fields from backend
  applicantName?: string;
  applicantEmail?: string;
  opportunityId?: string;
  // Legacy / generic fields
  name?: string;
  candidate_name?: string;
  guest_name?: string;
  role?: string;
  qualification?: string;
  target?: string;
  job_title?: string;
  course_title?: string;
  jobs?: { title?: string; type?: string };
  users?: { name?: string; email?: string; oauth_provider_id?: string; user_id?: string };
  sessions?: { title?: string };
  kind?: Applicant["kind"];
  course_id?: string;
  session_id?: string;
  applied?: string;
  applied_at?: string;
  appliedAt?: string;
  created_at?: string;
  match?: number;
  stage?: Applicant["stage"];
  status?: Applicant["stage"] | string;
  email?: string;
  guest_email?: string;
  guest_resume_url?: string;
  applicant_id?: string;
  user_id?: string;
  userId?: string;
  externalUserId?: string;
  [key: string]: unknown;
}

let inMemoryApplicants: Applicant[] = [];

/**
 * Maps backend application entity to frontend Applicant type
 */
export function mapBackendApplication(
  raw: BackendApplicationPayload,
  fallbackTarget?: string,
): Applicant {
  const applicantName =
    raw.applicantName ||
    raw.users?.name ||
    raw.guest_name ||
    raw.name ||
    raw.candidate_name ||
    "Applicant";

  const applicantEmail =
    raw.applicantEmail ||
    raw.users?.email ||
    raw.guest_email ||
    raw.email ||
    "applicant@example.com";

  const initials = applicantName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AP";

  const stage = (raw.stage || raw.status || "New") as Applicant["stage"];

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
    applied: (raw.appliedAt || raw.applied_at)
      ? new Date((raw.appliedAt || raw.applied_at) as string).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : raw.applied || "Recently",
    match: typeof raw.match === "number" ? raw.match : 88,
    stage,
    email: applicantEmail,
    externalUserId:
      raw.externalUserId ||
      raw.user_id ||
      raw.userId ||
      raw.users?.oauth_provider_id ||
      raw.users?.user_id ||
      raw.applicant_id ||
      raw.id ||
      null,
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

  return inMemoryApplicants;
}

/**
 * Filter applicants by job target
 */
export async function getApplicantsForJob(jobTitle: string): Promise<Applicant[]> {
  const all = await getApplicants();
  return all.filter((a) => a.target === jobTitle && a.kind === "Job");
}

/**
 * Fetch applicants for a specific job post
 */
export async function getJobApplicants(jobId: string, jobTitle: string): Promise<Applicant[]> {
  try {
    // Backend endpoint: GET /api/jobs/{id}/applications
    const res = await apiRequest(`/api/jobs/${jobId}/applications`);
    if (res.ok) {
      const data = (await res.json()) as BackendApplicationPayload[];
      if (Array.isArray(data) && data.length > 0) {
        return data.map((d) => mapBackendApplication(d, jobTitle));
      }
    }
  } catch (error) {
    console.debug(`Applicants API for job ${jobId} unavailable:`, error);
  }
  return getApplicantsForJob(jobTitle);
}

/**
 * Filter enrollees by session target
 */
export async function getEnrolleesForSession(sessionTitle: string): Promise<Applicant[]> {
  const all = await getApplicants();
  return all.filter((a) => a.target === sessionTitle && a.kind === "Session");
}

/**
 * Filter applicants by target title and kind
 */
export async function getPeopleForTarget(
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
    console.debug("Update application status API unavailable, updating locally");
  }

  inMemoryApplicants = inMemoryApplicants.map((a) => (a.id === id ? { ...a, stage } : a));
  return true;
}

/**
 * Maps raw Finder UserProfileResponse to CandidateProfile shape
 */
function mapFinderProfile(data: Record<string, unknown>, applicant: Applicant): CandidateProfile {
  const baseProfile = (data.baseProfile || {}) as Record<string, unknown>;
  const edu = (data.education || null) as Record<string, unknown> | null;
  const contact = (data.contact || {}) as Record<string, unknown>;
  const aura = (data.aura || {}) as Record<string, unknown>;

  // Deduplicate skills by name
  const seenSkills = new Set<string>();
  const rawSkills = Array.isArray(data.skills) ? data.skills : [];
  const skills: CandidateSkill[] = rawSkills
    .filter((s: any) => {
      const skillName = typeof s === "string" ? s : s?.name;
      if (!skillName || seenSkills.has(skillName.toLowerCase())) return false;
      seenSkills.add(skillName.toLowerCase());
      return true;
    })
    .map((s: any) => {
      const name = typeof s === "string" ? s : s?.name || "Skill";
      const category = typeof s === "object" ? s?.category : undefined;
      const level = (s?.level as CandidateSkill["level"]) || "Intermediate";
      return { name, level, category };
    });

  const genderRaw = String(baseProfile.gender || "").toUpperCase();
  const gender: CandidateProfile["gender"] =
    genderRaw === "MALE" ? "Male" : genderRaw === "FEMALE" ? "Female" : genderRaw === "OTHER" ? "Other" : "Unspecified";

  const resolvedName = String(baseProfile.name || applicant.name || "Candidate").trim();
  const resolvedEmail = String(contact.email || applicant.email || "").trim();

  return {
    uid: String(data.uid || applicant.externalUserId || applicant.id || "").trim(),
    name: resolvedName,
    email: resolvedEmail,
    tagline: String(baseProfile.tagline || applicant.role || "Finder Member").trim(),
    summary: String(baseProfile.summary || data.summary || `${resolvedName} is enrolled in ${applicant.target}.`).trim(),
    phone: String(contact.phoneNumber || "").trim(),
    gender,
    location: "India",
    verified: true,
    githubUsername: data.githubUsername ? String(data.githubUsername).trim() : undefined,
    avatarUrl: baseProfile.image ? String(baseProfile.image) : undefined,
    auraPoints: typeof aura.auraPoints === "number" ? aura.auraPoints : (applicant.match ? applicant.match * 12 : 100),
    auraLevel: aura.level ? String(aura.level) : undefined,
    education: edu ? {
      college: String(edu.college || "Not provided"),
      course: String(edu.course || "Not provided"),
      specialization: String(edu.specialization || "—"),
      courseStart: String(edu.start || "—"),
      courseEnd: String(edu.end || "—"),
      cgpa: String(edu.cgpa || "—"),
    } : null,
    skills: skills.length > 0 ? skills : [],
    experience: [],
  };
}

const PROFILE_BASE_URL = "http://localhost:8080/api/v1/users/view";

/**
 * Fetch raw Finder user profile directly from /api/v1/users/view/:userId endpoint.
 * This is a public endpoint — no auth token required.
 */
export async function fetchFinderUserProfile(userId: string): Promise<Record<string, unknown> | null> {
  if (!userId) return null;
  try {
    const res = await fetch(`${PROFILE_BASE_URL}/${encodeURIComponent(userId)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      if (data && (data.baseProfile || data.uid)) return data;
    }
  } catch (e) {
    console.debug("Direct Finder user profile fetch failed:", e);
  }
  return null;
}

/**
 * Get full candidate profile — fetches from http://localhost:8080/api/v1/users/view/{uid}
 * No auth token required.
 */
export async function getCandidateProfile(applicant: Applicant): Promise<CandidateProfile> {
  const uid = applicant.externalUserId || applicant.id;
  if (uid && !uid.startsWith("std-") && !uid.startsWith("a-")) {
    const directData = await fetchFinderUserProfile(uid);
    if (directData) {
      return mapFinderProfile(directData, applicant);
    }
  }

  // Fallback to static profile
  return profileFor(applicant);
}
