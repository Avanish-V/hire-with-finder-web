import { apiRequest } from "@/lib/apiClient";
import {
  sessions as staticSessions,
  defaultModules,
  type LiveSession,
  type SessionModule,
  type Applicant,
} from "@/lib/finder-data";
import { peopleFor } from "@/components/PeopleList";

let inMemorySessions: LiveSession[] = [...staticSessions];

export interface BackendCoursePayload {
  id?: string;
  _id?: string;
  title?: string;
  instructor?: string;
  host?: string;
  description?: string;
  summary?: string;
  duration?: string;
  price?: string | number;
  thumbnail?: string;
  cover_image?: string;
  live_url?: string;
  liveUrl?: string;
  meetLink?: string;
  meet_link?: string;
  category?: string;
  level?: LiveSession["level"];
  active?: boolean;
  posted_by?: string;
  created_at?: string;
  seats?: number;
  max_seats?: number;
  enrolled?: number;
  enrollments?: unknown[];
  tags?: string[];
  modules?: SessionModule[];
  postedByInfo?: {
    name?: string;
    email?: string;
    companyName?: string;
    companyLogo?: string;
  } | null;
  [key: string]: unknown;
}

export interface BackendStudentPayload {
  id?: string;
  user_id?: string;
  name?: string;
  email?: string;
  enrolled_at?: string;
  status?: string;
  progress?: number;
  completed_lessons?: number;
  total_lessons?: number;
  last_active?: string;
}

/**
 * Safely maps a backend course/session payload to a frontend LiveSession model.
 * Employs field-level fallbacks for any missing/null fields.
 */
export function mapBackendSession(raw: BackendCoursePayload): LiveSession {
  // Format creation / schedule date
  let displayDate = "Aug 25, 2026";
  if (raw.created_at) {
    try {
      displayDate = new Date(raw.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      displayDate = "Aug 25, 2026";
    }
  }

  // Format price
  let displayPrice = "Free";
  if (raw.price !== undefined && raw.price !== null && raw.price !== "" && raw.price !== 0 && raw.price !== "0") {
    if (typeof raw.price === "number") {
      displayPrice = `₹${raw.price.toLocaleString("en-IN")}`;
    } else {
      const priceStr = String(raw.price).trim();
      displayPrice = priceStr.startsWith("₹") || priceStr.startsWith("$") ? priceStr : `₹${priceStr}`;
    }
  }

  // Format tags
  let tags: string[] = ["Live", "Workshop"];
  if (Array.isArray(raw.tags) && raw.tags.length > 0) {
    tags = raw.tags;
  } else if (raw.category && typeof raw.category === "string" && raw.category.trim().length > 0) {
    tags = raw.category.split(",").map((t) => t.trim()).filter(Boolean);
  }

  // Determine host / instructor
  const host =
    raw.instructor?.trim() ||
    raw.host?.trim() ||
    raw.postedByInfo?.companyName?.trim() ||
    raw.postedByInfo?.name?.trim() ||
    "Finder Careers";

  // Determine meet link
  const meetLink =
    raw.live_url?.trim() ||
    raw.liveUrl?.trim() ||
    raw.meetLink?.trim() ||
    raw.meet_link?.trim() ||
    "https://meet.google.com/fdr-live";

  // Determine modules
  const rawModules = Array.isArray(raw.modules) && raw.modules.length > 0
    ? raw.modules.map((m: any, idx: number) => ({
        title: m.title || `Module ${idx + 1}`,
        duration: m.duration || "20 min",
        detail: m.description || m.detail || "Curriculum walkthrough.",
      }))
    : defaultModules;

  // Determine status
  const status: LiveSession["status"] =
    raw.status || (raw.active === false ? "Completed" : "Scheduled");

  return {
    id: raw.id || raw._id || `s-${Date.now()}`,
    title: raw.title?.trim() || "Live Skill Session",
    host,
    date: raw.date || raw.schedule_date || displayDate,
    time: raw.time || raw.schedule_time || "7:00 PM IST",
    duration: raw.duration?.trim() || "90 min",
    seats: raw.seats || raw.max_seats || 100,
    enrolled:
      raw.enrolled !== undefined
        ? Number(raw.enrolled)
        : Array.isArray(raw.enrollments)
          ? raw.enrollments.length
          : 0,
    price: displayPrice,
    level: raw.level || "Beginner",
    status,
    meetLink,
    tags: tags.length > 0 ? tags : ["Live", "Workshop"],
    thumbnail: raw.thumbnail?.trim() || raw.cover_image?.trim() || undefined,
    summary:
      raw.description?.trim() ||
      raw.summary?.trim() ||
      "A live, hands-on online session run on Google Meet. Join with the link below at the scheduled time.",
    modules: rawModules,
  };
}

/**
 * Fetch all live skill sessions from backend API /api/courses
 * Falls back gracefully to static mock sessions if backend is offline or returns empty.
 */
export async function getSessions(): Promise<LiveSession[]> {
  try {
    const res = await apiRequest("/api/courses");
    if (res.ok) {
      const data = (await res.json()) as BackendCoursePayload[];
      if (Array.isArray(data) && data.length > 0) {
        const mappedList = data.map(mapBackendSession);
        // Merge with in-memory sessions ensuring no duplicates by ID
        const backendIds = new Set(mappedList.map((m) => m.id));
        const customLocal = inMemorySessions.filter(
          (s) => !backendIds.has(s.id) && !staticSessions.some((st) => st.id === s.id),
        );
        inMemorySessions = [...mappedList, ...customLocal];
        return inMemorySessions;
      }
    }
  } catch (error) {
    console.debug("GET /api/courses unavailable, using hybrid static fallback:", error);
  }

  return [...inMemorySessions];
}

/**
 * Fetch comprehensive session details including modules and enrolled students
 */
export async function getSessionDetails(
  id: string,
  sessionTitle: string,
): Promise<{ modules: SessionModule[]; students: Applicant[] }> {
  let modules = defaultModules;
  let students: Applicant[] = peopleFor(sessionTitle, "Session");

  // Fetch full content (modules + lessons)
  try {
    const contentRes = await apiRequest(`/api/courses/${id}/content`);
    if (contentRes.ok) {
      const contentData = (await contentRes.json()) as BackendCoursePayload;
      if (Array.isArray(contentData.modules) && contentData.modules.length > 0) {
        modules = contentData.modules.map((m: any, idx: number) => ({
          title: m.title || `Module ${idx + 1}`,
          duration: m.duration || "20 min",
          detail: m.description || m.detail || "Curriculum walkthrough.",
        }));
      }
    }
  } catch {
    console.debug(`Content API for course ${id} unavailable, using static modules.`);
  }

  // Fetch enrolled students
  try {
    const studentsRes = await apiRequest(`/api/courses/${id}/students`);
    if (studentsRes.ok) {
      const studentsData = (await studentsRes.json()) as BackendStudentPayload[];
      if (Array.isArray(studentsData) && studentsData.length > 0) {
        students = studentsData.map((s, idx) => {
          const name = s.name || `Student ${idx + 1}`;
          const initials = name
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "ST";

          return {
            id: s.id || s.user_id || `std-${idx}`,
            name,
            initials,
            role: "Enrolled Student",
            target: sessionTitle,
            kind: "Session",
            applied: s.enrolled_at
              ? new Date(s.enrolled_at).toLocaleDateString()
              : "Recently",
            match: s.progress || 100,
            stage: (s.status as Applicant["stage"]) || "Shortlisted",
            email: s.email || "student@example.com",
          };
        });
      }
    }
  } catch {
    console.debug(`Students API for course ${id} unavailable, using static students.`);
  }

  return { modules, students };
}

/**
 * Create a new live skill session via POST /api/courses
 */
export async function createSession(sessionData: Partial<LiveSession>): Promise<LiveSession> {
  const priceNum =
    typeof sessionData.price === "number"
      ? sessionData.price
      : sessionData.price === "Free"
        ? 0
        : parseInt(String(sessionData.price || "0").replace(/[^0-9]/g, ""), 10) || 0;

  const backendBody = {
    title: (sessionData.title || "Live Skill Session").trim(),
    instructor: (sessionData.host || "Finder Careers").trim(),
    description: (
      sessionData.summary ||
      "A live, hands-on online session run on Google Meet. Join with the link below at the scheduled time."
    ).trim(),
    duration: (sessionData.duration || "90 min").trim(),
    price: priceNum,
    thumbnail: sessionData.thumbnail || "",
    liveUrl: sessionData.meetLink || "https://meet.google.com/fdr-live",
    category: sessionData.tags?.join(", ") || "Live Workshop",
    level: sessionData.level || "Beginner",
    active: true,
  };

  const newLocalSession: LiveSession = {
    id: `s-${Date.now()}`,
    title: backendBody.title,
    host: backendBody.instructor,
    date: sessionData.date || "Aug 25, 2026",
    time: sessionData.time || "7:00 PM IST",
    duration: backendBody.duration,
    seats: sessionData.seats || 100,
    enrolled: 0,
    price: sessionData.price || "Free",
    level: sessionData.level || "Beginner",
    status: "Scheduled",
    meetLink: backendBody.liveUrl,
    tags: sessionData.tags || ["Live"],
    thumbnail: sessionData.thumbnail,
    summary: backendBody.description,
    modules: sessionData.modules || defaultModules,
  };

  try {
    const res = await apiRequest("/api/courses", {
      method: "POST",
      body: JSON.stringify(backendBody),
    });

    if (res.ok) {
      const data = (await res.json()) as BackendCoursePayload;
      const mapped = mapBackendSession(data);
      // Preserve client side fields that backend might not store
      const combined: LiveSession = {
        ...newLocalSession,
        ...mapped,
        date: sessionData.date || mapped.date,
        time: sessionData.time || mapped.time,
        seats: sessionData.seats || mapped.seats,
        modules: sessionData.modules || mapped.modules,
      };

      // Add modules to the course on backend if provided
      if (data.id && Array.isArray(sessionData.modules)) {
        for (let i = 0; i < sessionData.modules.length; i++) {
          const mod = sessionData.modules[i];
          try {
            await apiRequest(`/api/courses/${data.id}/modules`, {
              method: "POST",
              body: JSON.stringify({
                title: mod.title,
                description: mod.detail || "",
                order: i,
              }),
            });
          } catch {
            // Non-critical module sync failure
          }
        }
      }

      inMemorySessions.unshift(combined);
      return combined;
    }
  } catch (error) {
    console.debug("POST /api/courses unavailable, saving session in local store:", error);
  }

  inMemorySessions.unshift(newLocalSession);
  return newLocalSession;
}

/**
 * Update an existing session via PUT /api/courses/:id
 */
export async function updateSession(
  id: string,
  updates: Partial<LiveSession>,
): Promise<LiveSession | null> {
  const priceNum =
    updates.price !== undefined
      ? typeof updates.price === "number"
        ? updates.price
        : updates.price === "Free"
          ? 0
          : parseInt(String(updates.price).replace(/[^0-9]/g, ""), 10) || 0
      : undefined;

  const backendUpdates: Record<string, unknown> = {};
  if (updates.title) backendUpdates.title = updates.title.trim();
  if (updates.host) backendUpdates.instructor = updates.host.trim();
  if (updates.summary) backendUpdates.description = updates.summary.trim();
  if (updates.duration) backendUpdates.duration = updates.duration.trim();
  if (priceNum !== undefined) backendUpdates.price = priceNum;
  if (updates.thumbnail !== undefined) backendUpdates.thumbnail = updates.thumbnail;
  if (updates.meetLink !== undefined) backendUpdates.liveUrl = updates.meetLink;
  if (updates.level) backendUpdates.level = updates.level;
  if (updates.tags) backendUpdates.category = updates.tags.join(", ");

  try {
    const res = await apiRequest(`/api/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify(backendUpdates),
    });

    if (res.ok) {
      const data = (await res.json()) as BackendCoursePayload;
      const mapped = mapBackendSession(data);
      inMemorySessions = inMemorySessions.map((s) =>
        s.id === id ? { ...s, ...mapped, ...updates } : s,
      );
      return inMemorySessions.find((s) => s.id === id) ?? mapped;
    }
  } catch (error) {
    console.debug(`PUT /api/courses/${id} unavailable, updating in local store:`, error);
  }

  const existingIndex = inMemorySessions.findIndex((s) => s.id === id);
  if (existingIndex !== -1) {
    inMemorySessions[existingIndex] = {
      ...inMemorySessions[existingIndex],
      ...updates,
    };
    return inMemorySessions[existingIndex];
  }

  return null;
}

/**
 * Delete a session via DELETE /api/courses/:id
 */
export async function deleteSession(id: string): Promise<boolean> {
  try {
    const res = await apiRequest(`/api/courses/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      inMemorySessions = inMemorySessions.filter((s) => s.id !== id);
      return true;
    }
  } catch (error) {
    console.debug(`DELETE /api/courses/${id} unavailable, removing from local store:`, error);
  }

  inMemorySessions = inMemorySessions.filter((s) => s.id !== id);
  return true;
}

/**
 * Enroll the authenticated user in a course/session
 * POST /api/courses/:id/enroll
 * Returns { success, message }
 */
export async function enrollInSession(
  sessionId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await apiRequest(`/api/courses/${sessionId}/enroll`, {
      method: "POST",
    });

    if (res.status === 201 || res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: true, message: data.msg || "Enrolled successfully" };
    }

    if (res.status === 400) {
      const data = await res.json().catch(() => ({}));
      return { success: false, message: data.msg || "Already enrolled" };
    }

    return { success: false, message: "Enrollment failed. Please try again." };
  } catch (error) {
    console.debug(`POST /api/courses/${sessionId}/enroll error:`, error);
    return { success: false, message: "Could not reach server. Please check your connection." };
  }
}
