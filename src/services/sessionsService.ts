import { apiRequest } from "@/lib/apiClient";
import {
  sessions as staticSessions,
  defaultModules,
  type LiveSession,
  type SessionModule,
  type SessionSubModule,
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
  externalUserId?: string | null;
  oauth_provider_id?: string | null;
}

/**
 * Safely maps backend module and submodule payload to frontend SessionModule array
 */
export function mapBackendModules(rawModules?: any[]): SessionModule[] {
  if (!Array.isArray(rawModules) || rawModules.length === 0) return [];
  return rawModules.map((m: any, idx: number) => {
    const subMods: SessionSubModule[] = Array.isArray(m.subModules) && m.subModules.length > 0
      ? m.subModules.map((sm: any, sIdx: number) => ({
          id: sm.id ? String(sm.id) : undefined,
          title: sm.title || `Topic ${sIdx + 1}`,
          description: sm.description || "",
          order: sm.order ?? sIdx,
        }))
      : [];

    const topicList: string[] = Array.isArray(m.topics) && m.topics.length > 0
      ? m.topics
      : subMods.map((sm) => sm.title);

    const headingName = m.heading || m.title || `Heading ${idx + 1}`;

    return {
      id: m.id ? String(m.id) : undefined,
      heading: headingName,
      title: headingName,
      topics: topicList,
      description: m.description || m.detail || "",
      detail: m.description || m.detail || "",
      order: m.order ?? idx,
      subModules: subMods,
    };
  });
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
      // Keep default
    }
  }

  // Price formatting
  const displayPrice = "Free";

  // Determine tags
  let tags: string[] = [];
  if (Array.isArray(raw.tags)) {
    tags = raw.tags;
  } else if (typeof raw.category === "string" && raw.category.trim()) {
    tags = raw.category.split(",").map((t) => t.trim()).filter(Boolean);
  }

  // Meet link fallback
  const meetLink =
    raw.live_url?.trim() ||
    raw.liveUrl?.trim() ||
    raw.meetLink?.trim() ||
    raw.meet_link?.trim() ||
    "https://meet.google.com/fdr-live";

  // Determine modules
  const rawModules = mapBackendModules(raw.modules);

  // Determine status
  const validStatus: LiveSession["status"] =
    (raw.status as LiveSession["status"]) || (raw.active === false ? "Completed" : "Scheduled");

  const dateStr = (typeof raw.date === "string" && raw.date.trim()) 
    ? raw.date 
    : (typeof raw.schedule_date === "string" && raw.schedule_date.trim())
    ? raw.schedule_date 
    : displayDate;
  
  const timeStr = (typeof raw.time === "string" && raw.time.trim()) 
    ? raw.time 
    : (typeof raw.schedule_time === "string" && raw.schedule_time.trim())
    ? raw.schedule_time 
    : "7:00 PM IST";

  return {
    id: raw.id || raw._id || `s-${Date.now()}`,
    title: raw.title?.trim() || "Live Skill Session",
    host: raw.instructor?.trim() || raw.host?.trim() || "Finder Careers",
    date: dateStr,
    time: timeStr,
    duration: raw.duration?.trim() || "90 min",
    seats: typeof raw.seats === "number" ? raw.seats : 100,
    enrolled:
      typeof raw.enrolled === "number"
        ? raw.enrolled
        : Array.isArray(raw.enrollments)
          ? raw.enrollments.length
          : 0,
    price: displayPrice,
    level: raw.level || "Beginner",
    status: validStatus,
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
 * By default, fetches only the authenticated recruiter's courses (recruiterOnly=true)
 * Falls back gracefully to static mock sessions if backend is offline or returns empty.
 */
export async function getSessions(): Promise<LiveSession[]> {
  try {
    console.log("Fetching courses from /api/courses");
    const res = await apiRequest("/api/courses?recruiterOnly=true");
    console.log("Courses API response:", res.status, res.ok);
    
    if (res.ok) {
      const data = (await res.json()) as BackendCoursePayload[];
      console.log("Courses API data:", data);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log("Mapping courses, count:", data.length);
        const mappedList = data.map(mapBackendSession);
        console.log("Mapped sessions:", mappedList);
        
        const backendIds = new Set(mappedList.map((m) => m.id));
        const customLocal = inMemorySessions.filter(
          (s) => !backendIds.has(s.id) && !staticSessions.some((st) => st.id === s.id),
        );
        inMemorySessions = [...mappedList, ...customLocal];
        console.log("Returning sessions, total count:", inMemorySessions.length);
        return inMemorySessions;
      } else if (Array.isArray(data) && data.length === 0) {
        console.log("Backend returned empty array");
        return [];
      } else {
        console.warn("Backend returned non-array data:", data);
      }
    } else {
      console.warn("Courses API returned non-OK status:", res.status);
    }
  } catch (error) {
    console.error("GET /api/courses error:", error);
    console.debug("Using hybrid static fallback");
  }

  console.log("Returning in-memory sessions, count:", inMemorySessions.length);
  return [...inMemorySessions];
}

/**
 * Fetch comprehensive session details including modules and enrolled students
 */
export async function getSessionDetails(
  id: string,
  sessionTitle: string,
  initialModules: SessionModule[] = [],
): Promise<{ modules: SessionModule[]; students: Applicant[] }> {
  let modules: SessionModule[] = initialModules && initialModules.length > 0 ? initialModules : [];
  let students: Applicant[] = peopleFor(sessionTitle, "Session");

  try {
    const contentRes = await apiRequest(`/api/courses/${id}/content`);
    if (contentRes.ok) {
      const contentData = (await contentRes.json()) as BackendCoursePayload;
      if (Array.isArray(contentData.modules) && contentData.modules.length > 0) {
        modules = mapBackendModules(contentData.modules);
      }
    }
  } catch {
    console.debug(`Content API for course ${id} unavailable, using existing modules.`);
  }

  // Fallback: If modules still empty, query course detail endpoint
  if (modules.length === 0) {
    try {
      const courseRes = await apiRequest(`/api/courses/${id}`);
      if (courseRes.ok) {
        const courseData = (await courseRes.json()) as BackendCoursePayload;
        if (Array.isArray(courseData.modules) && courseData.modules.length > 0) {
          modules = mapBackendModules(courseData.modules);
        }
      }
    } catch {
      // ignore
    }
  }

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
            externalUserId: s.user_id || (s as Record<string, unknown>).userId || (s as Record<string, unknown>).externalUserId || s.oauth_provider_id || s.id || null,
          };
        });
      }
    }
  } catch {
    console.debug(`Students API for course ${id} unavailable, using empty students list.`);
  }

  return { modules, students };
}

/**
 * Create a new live skill session via POST /api/courses
 */
export async function createSession(sessionData: Partial<LiveSession>): Promise<LiveSession> {
  const formattedModules = Array.isArray(sessionData.modules)
    ? sessionData.modules.map((m, idx) => {
        const headingTitle = (m.heading || m.title || `Heading ${idx + 1}`).trim();
        const subMods = Array.isArray(m.subModules) && m.subModules.length > 0
          ? m.subModules.map((sm, sIdx) => ({
              title: sm.title.trim(),
              description: (sm.description || "").trim(),
              order: sm.order ?? sIdx,
            }))
          : Array.isArray(m.topics)
          ? m.topics.filter(Boolean).map((t, tIdx) => ({
              title: String(t).trim(),
              description: "",
              order: tIdx,
            }))
          : [];

        return {
          heading: headingTitle,
          title: headingTitle,
          topics: Array.isArray(m.topics) ? m.topics : subMods.map((sm) => sm.title),
          description: (m.description || m.detail || "").trim(),
          order: m.order ?? idx,
          subModules: subMods,
        };
      })
    : [];

  const backendBody = {
    title: (sessionData.title || "Live Skill Session").trim(),
    instructor: (sessionData.host || "Finder Careers").trim(),
    description: (
      sessionData.summary ||
      "A live, hands-on online session run on Google Meet. Join with the link below at the scheduled time."
    ).trim(),
    duration: (sessionData.duration || "90 min").trim(),
    thumbnail: sessionData.thumbnail || "",
    liveUrl: sessionData.meetLink || "https://meet.google.com/fdr-live",
    category: sessionData.tags?.join(", ") || "Live Workshop",
    level: sessionData.level || "Beginner",
    active: true,
    seats: sessionData.seats || 100,
    date: sessionData.date || "",
    time: sessionData.time || "",
    modules: formattedModules,
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
    price: "Free",
    level: sessionData.level || "Beginner",
    status: "Scheduled",
    meetLink: backendBody.liveUrl,
    tags: sessionData.tags || ["Live"],
    thumbnail: sessionData.thumbnail || undefined,
    summary: backendBody.description,
    modules: sessionData.modules || [],
  };

  try {
    const res = await apiRequest("/api/courses", {
      method: "POST",
      body: JSON.stringify(backendBody),
    });

    if (res.ok) {
      const data = (await res.json()) as BackendCoursePayload;
      const mapped = mapBackendSession(data);
      const combined: LiveSession = {
        ...newLocalSession,
        ...mapped,
        date: sessionData.date || mapped.date,
        time: sessionData.time || mapped.time,
        seats: sessionData.seats || mapped.seats,
        modules: sessionData.modules || mapped.modules,
      };

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
  const formattedModules = Array.isArray(updates.modules)
    ? updates.modules.map((m, idx) => {
        const headingTitle = (m.heading || m.title || `Heading ${idx + 1}`).trim();
        const subMods = Array.isArray(m.subModules) && m.subModules.length > 0
          ? m.subModules.map((sm, sIdx) => ({
              title: sm.title.trim(),
              description: (sm.description || "").trim(),
              order: sm.order ?? sIdx,
            }))
          : Array.isArray(m.topics)
          ? m.topics.filter(Boolean).map((t, tIdx) => ({
              title: String(t).trim(),
              description: "",
              order: tIdx,
            }))
          : [];

        return {
          heading: headingTitle,
          title: headingTitle,
          topics: Array.isArray(m.topics) ? m.topics : subMods.map((sm) => sm.title),
          description: (m.description || m.detail || "").trim(),
          order: m.order ?? idx,
          subModules: subMods,
        };
      })
    : undefined;

  const backendUpdates: Record<string, unknown> = {};
  if (updates.title) backendUpdates.title = updates.title.trim();
  if (updates.host) backendUpdates.instructor = updates.host.trim();
  if (updates.summary) backendUpdates.description = updates.summary.trim();
  if (updates.duration) backendUpdates.duration = updates.duration.trim();
  if (updates.thumbnail !== undefined) backendUpdates.thumbnail = updates.thumbnail;
  if (updates.meetLink !== undefined) backendUpdates.liveUrl = updates.meetLink;
  if (updates.level) backendUpdates.level = updates.level;
  if (updates.tags) backendUpdates.category = updates.tags.join(", ");
  if (updates.seats !== undefined) backendUpdates.seats = updates.seats;
  if (updates.date !== undefined) backendUpdates.date = updates.date;
  if (updates.time !== undefined) backendUpdates.time = updates.time;
  if (formattedModules !== undefined) backendUpdates.modules = formattedModules;

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
    const current = inMemorySessions[existingIndex]!;
    inMemorySessions[existingIndex] = {
      ...current,
      ...updates,
    };
    return inMemorySessions[existingIndex]!;
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
