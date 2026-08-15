import { apiRequest } from "@/lib/apiClient";
import { jobs as staticJobs, type Job } from "@/lib/finder-data";

// In-memory cache / state when running with mock fallback
let inMemoryJobs: Job[] = [...staticJobs];

interface BackendJobPayload {
  id?: string;
  _id?: string;
  title?: string;
  company?: string;
  company_name?: string;
  location?: string;
  type?: Job["type"];
  stipend?: string;
  salary?: string;
  compensation?: string;
  posted?: string;
  created_at?: string;
  applicants?: number;
  applications?: unknown[];
  skills?: string[] | string;
  status?: Job["status"];
  [key: string]: unknown;
}

/**
 * Maps backend job entity to frontend Job type
 */
function mapBackendJob(raw: BackendJobPayload): Job {
  return {
    id: raw.id || raw._id || `j-${Date.now()}`,
    title: raw.title || "Untitled Role",
    company: raw.company || raw.company_name || "Finder",
    location: raw.location || "Remote",
    type: raw.type || "Internship",
    stipend: raw.stipend || raw.salary || raw.compensation || "₹25,000 / mo",
    posted: raw.posted || raw.created_at ? "Recently" : "2 days ago",
    applicants:
      typeof raw.applicants === "number"
        ? raw.applicants
        : Array.isArray(raw.applications)
          ? raw.applications.length
          : 0,
    skills: Array.isArray(raw.skills)
      ? raw.skills
      : typeof raw.skills === "string"
        ? raw.skills.split(",").map((s: string) => s.trim())
        : ["React", "TypeScript"],
    status: raw.status || "Open",
  };
}

/**
 * Fetch all jobs & internships
 */
export async function getJobs(): Promise<Job[]> {
  try {
    const res = await apiRequest("/api/jobs");
    if (res.ok) {
      const data = (await res.json()) as BackendJobPayload[];
      if (Array.isArray(data) && data.length > 0) {
        return data.map(mapBackendJob);
      }
    }
  } catch {
    // API endpoint unavailable or network error -> use static fallback
    // TODO: Verify backend GET /api/jobs endpoint when backend service is running
    console.debug("Jobs API unavailable, using static fallback");
  }

  return [...inMemoryJobs];
}

/**
 * Create a new job or internship posting
 */
export async function createJob(jobData: Partial<Job> & { description?: string }): Promise<Job> {
  const newJob: Job = {
    id: `j-${Date.now()}`,
    title: jobData.title || "New Role",
    company: jobData.company || "My Company",
    location: jobData.location || "Remote",
    type: jobData.type || "Internship",
    stipend: jobData.stipend || "₹20,000 / mo",
    posted: "Just now",
    applicants: 0,
    skills: jobData.skills || ["React"],
    status: (jobData.status as Job["status"]) || "Open",
  };

  try {
    const res = await apiRequest("/api/jobs", {
      method: "POST",
      body: JSON.stringify(jobData),
    });

    if (res.ok) {
      const data = (await res.json()) as BackendJobPayload;
      const mapped = mapBackendJob(data);
      inMemoryJobs.unshift(mapped);
      return mapped;
    }
  } catch {
    // TODO: Connect POST /api/jobs when backend service is available
    console.debug("Create Job API unavailable, saving to local state");
  }

  inMemoryJobs.unshift(newJob);
  return newJob;
}

/**
 * Update an existing job or internship
 */
export async function updateJob(
  id: string,
  updates: Partial<Job> & { description?: string },
): Promise<Job | null> {
  try {
    const res = await apiRequest(`/api/jobs/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });

    if (res.ok) {
      const data = (await res.json()) as BackendJobPayload;
      const mapped = mapBackendJob(data);
      inMemoryJobs = inMemoryJobs.map((j) => (j.id === id ? mapped : j));
      return mapped;
    }
  } catch {
    // TODO: Connect PUT /api/jobs/:id when backend service is available
    console.debug("Update Job API unavailable, updating local state");
  }

  const existingIndex = inMemoryJobs.findIndex((j) => j.id === id);
  if (existingIndex !== -1) {
    inMemoryJobs[existingIndex] = { ...inMemoryJobs[existingIndex], ...updates };
    return inMemoryJobs[existingIndex];
  }

  return null;
}

/**
 * Delete a job posting
 */
export async function deleteJob(id: string): Promise<boolean> {
  try {
    const res = await apiRequest(`/api/jobs/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      inMemoryJobs = inMemoryJobs.filter((j) => j.id !== id);
      return true;
    }
  } catch {
    // TODO: Connect DELETE /api/jobs/:id when backend service is available
    console.debug("Delete Job API unavailable, removing from local state");
  }

  inMemoryJobs = inMemoryJobs.filter((j) => j.id !== id);
  return true;
}
