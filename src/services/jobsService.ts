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
  createdAt?: string;
  applicants?: number;
  applications?: unknown[];
  skills?: string[] | string;
  status?: Job["status"];
  description?: string;
  recruiterUid?: string;
  [key: string]: unknown;
}

/**
 * Maps backend job entity to frontend Job type
 */
function mapBackendJob(raw: BackendJobPayload): Job {
  // Parse skills - backend may return empty array, string, or undefined
  let skillsArray: string[] = [];
  if (Array.isArray(raw.skills) && raw.skills.length > 0) {
    skillsArray = raw.skills;
  } else if (typeof raw.skills === "string" && raw.skills.trim()) {
    skillsArray = raw.skills.split(",").map((s: string) => s.trim()).filter(s => s);
  }
  // If no skills provided, leave empty array instead of default

  return {
    id: raw.id || raw._id || `j-${Date.now()}`,
    title: raw.title || "Untitled Role",
    company: raw.company || raw.company_name || "Finder",
    location: raw.location || "Remote",
    type: raw.type || "Internship",
    stipend: raw.stipend || raw.salary || raw.compensation || "Not specified",
    posted: raw.posted || (raw.created_at || raw.createdAt ? "Recently" : "2 days ago"),
    applicants:
      typeof raw.applicants === "number"
        ? raw.applicants
        : Array.isArray(raw.applications)
          ? raw.applications.length
          : 0,
    skills: skillsArray,
    status: raw.status || "Open",
    description: raw.description || "",
  };
}

/**
 * Fetch all jobs & internships
 * By default, fetches only the authenticated recruiter's jobs (recruiterOnly=true)
 */
export async function getJobs(): Promise<Job[]> {
  try {
    const res = await apiRequest("/api/jobs?recruiterOnly=true");
    console.log("Jobs API response status:", res.status, res.ok);
    
    if (res.ok) {
      const data = (await res.json()) as BackendJobPayload[];
      console.log("Jobs API data:", data);
      
      if (Array.isArray(data)) {
        // Return backend data even if empty - don't fallback to static data
        if (data.length === 0) {
          console.log("No jobs found from backend, returning empty array");
          return [];
        }
        const mapped = data.map(mapBackendJob);
        console.log("Mapped jobs:", mapped);
        return mapped;
      } else {
        console.warn("Backend returned non-array data:", data);
      }
    } else {
      console.warn("Jobs API returned non-OK status:", res.status);
    }
  } catch (error) {
    // API endpoint unavailable or network error -> use static fallback
    console.error("Jobs API error:", error);
    console.debug("Jobs API unavailable, using static fallback");
  }

  return [...inMemoryJobs];
}

/**
 * Create a new job or internship posting
 */
export async function createJob(jobData: Partial<Job> & { description?: string }): Promise<Job> {
  console.log("createJob called with data:", jobData);
  
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
    console.log("Sending POST request to /api/jobs");
    const res = await apiRequest("/api/jobs", {
      method: "POST",
      body: JSON.stringify(jobData),
    });

    console.log("POST /api/jobs response:", res.status, res.ok);

    if (res.ok) {
      const data = (await res.json()) as BackendJobPayload;
      console.log("Created job response:", data);
      const mapped = mapBackendJob(data);
      inMemoryJobs.unshift(mapped);
      return mapped;
    } else {
      // Log the error response
      const errorText = await res.text();
      console.error("Failed to create job:", res.status, errorText);
      throw new Error(`Failed to create job: ${res.status} ${errorText}`);
    }
  } catch (error) {
    console.error("Create Job API error:", error);
    // Re-throw to let the UI handle it
    throw error;
  }
}

/**
 * Update an existing job or internship
 */
export async function updateJob(
  id: string,
  updates: Partial<Job> & { description?: string },
): Promise<Job | null> {
  console.log("updateJob called for id:", id, "with updates:", updates);
  
  try {
    const res = await apiRequest(`/api/jobs/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });

    console.log("PUT /api/jobs response:", res.status, res.ok);

    if (res.ok) {
      const data = (await res.json()) as BackendJobPayload;
      console.log("Updated job response:", data);
      const mapped = mapBackendJob(data);
      inMemoryJobs = inMemoryJobs.map((j) => (j.id === id ? mapped : j));
      return mapped;
    } else {
      const errorText = await res.text();
      console.error("Failed to update job:", res.status, errorText);
      throw new Error(`Failed to update job: ${res.status} ${errorText}`);
    }
  } catch (error) {
    console.error("Update Job API error:", error);
    throw error;
  }
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
