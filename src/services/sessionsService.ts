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

export interface BackendInstructorSummary {
  id?: string;
  name: string;
  bio?: string | null;
  imageUrl?: string | null;
}

export interface BackendLiveSessionPayload {
  id?: string;
  _id?: string;
  title?: string;
  description?: string;
  summary?: string;
  instructorId?: string;
  instructor?: string | BackendInstructorSummary | null;
  host?: string;
  thumbnail?: string;
  cover_image?: string;
  liveUrl?: string;
  live_url?: string;
  meetLink?: string;
  category?: string;
  seats?: number;
  enrolledCount?: number;
  enrolled?: number;
  scheduledDate?: string;
  date?: string;
  startTime?: string;
  time?: string;
  endTime?: string;
  duration?: string;
  isJoinLinkEnabled?: boolean;
  join_link_enabled?: boolean;
  active?: boolean;
  level?: LiveSession["level"];
  status?: string;
  sessionStatus?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  tags?: string[];
  modules?: SessionModule[] | null;
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
 * Safely maps a backend LiveSession payload to a frontend LiveSession model.
 * Employs field-level fallbacks for any missing/null fields.
 */
export function mapBackendSession(raw: BackendLiveSessionPayload): LiveSession {
  // Format creation / schedule date
  let displayDate = "Nov 1, 2026";
  const dateSource = raw.scheduledDate || raw.date || raw.createdAt || raw.created_at;
  if (dateSource) {
    try {
      displayDate = new Date(dateSource).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      displayDate = dateSource;
    }
  }

  // Determine tags from category
  let tags: string[] = [];
  if (Array.isArray(raw.tags) && raw.tags.length > 0) {
    tags = raw.tags;
  } else if (typeof raw.category === "string" && raw.category.trim()) {
    tags = raw.category.split(",").map((t) => t.trim()).filter(Boolean);
  }

  // Meet link fallback
  const meetLink =
    raw.liveUrl?.trim() ||
    raw.live_url?.trim() ||
    raw.meetLink?.trim() ||
    "https://meet.google.com/fdr-live";

  // Determine status
  const validStatus: LiveSession["status"] =
    raw.active === false || raw.status === "COMPLETED" || raw.status === "Completed"
      ? "Completed"
      : raw.status === "LIVE" || raw.status === "Live now"
      ? "Live now"
      : "Scheduled";

  const dateStr = raw.scheduledDate || raw.date || displayDate;
  const timeStr = raw.startTime || raw.time || "7:00 PM IST";
  const endTimeStr = raw.endTime;
  const durationStr = raw.duration || (raw.startTime && raw.endTime ? `${raw.startTime} – ${raw.endTime}` : "90 min");

  const enrolledNum =
    typeof raw.enrolledCount === "number"
      ? raw.enrolledCount
      : typeof raw.enrolled === "number"
      ? raw.enrolled
      : 0;

  // Extract host name and instructor object
  let instructorObj: LiveSession["instructor"] = null;
  let hostName = "Finder Careers";

  if (typeof raw.instructor === "string" && raw.instructor.trim()) {
    hostName = raw.instructor.trim();
  } else if (raw.instructor && typeof raw.instructor === "object") {
    hostName = raw.instructor.name || raw.host?.trim() || "Finder Careers";
    instructorObj = {
      id: raw.instructor.id ? String(raw.instructor.id) : raw.instructorId,
      name: hostName,
      bio: raw.instructor.bio ?? null,
      imageUrl: raw.instructor.imageUrl ?? null,
    };
  } else if (raw.host?.trim()) {
    hostName = raw.host.trim();
  }

  return {
    id: String(raw.id || raw._id || `s-${Date.now()}`),
    title: raw.title?.trim() || "Live Skill Session",
    host: hostName,
    instructorId: raw.instructorId,
    instructor: instructorObj,
    date: dateStr,
    time: timeStr,
    endTime: endTimeStr,
    duration: durationStr,
    seats: typeof raw.seats === "number" ? raw.seats : 100,
    enrolled: enrolledNum,
    price: "Free",
    level: raw.level || "Beginner",
    status: validStatus,
    meetLink,
    isJoinLinkEnabled:
      typeof raw.isJoinLinkEnabled === "boolean"
        ? raw.isJoinLinkEnabled
        : typeof raw.join_link_enabled === "boolean"
        ? raw.join_link_enabled
        : true,
    tags: tags.length > 0 ? tags : ["Live Session"],
    thumbnail: raw.thumbnail?.trim() || raw.cover_image?.trim() || undefined,
    summary:
      raw.description?.trim() ||
      raw.summary?.trim() ||
      "A live, hands-on online session run on Google Meet. Join with the link below at the scheduled time.",
    modules: raw.modules ? mapBackendModules(raw.modules) : null,
  };
}

/**
 * Fetch all live sessions from the backend API.
 * Uses /api/admin/live-sessions for recruiters/admins, falling back to /api/live-sessions.
 */
export async function getSessions(): Promise<LiveSession[]> {
  try {
    // 1. Try Admin API first
    let res = await apiRequest("/api/admin/live-sessions");
    
    // 2. If 403 (e.g. non-admin role) or 404, fallback to User Live Sessions API
    if (res.status === 403 || res.status === 404) {
      res = await apiRequest("/api/live-sessions");
    }

    if (res.ok) {
      const data = (await res.json()) as BackendLiveSessionPayload[];
      if (Array.isArray(data) && data.length > 0) {
        const mappedList = data.map(mapBackendSession);
        const backendIds = new Set(mappedList.map((m) => m.id));
        const customLocal = inMemorySessions.filter(
          (s) => !backendIds.has(s.id) && !staticSessions.some((st) => st.id === s.id),
        );
        inMemorySessions = [...mappedList, ...customLocal];
        return inMemorySessions;
      } else if (Array.isArray(data) && data.length === 0) {
        return [];
      }
    }
  } catch (error) {
    console.debug("Live Sessions API unavailable, using in-memory store:", error);
  }

  return [...inMemorySessions];
}

/**
 * Fetch enrolled users for a specific live session (Admin API)
 */
export async function getSessionEnrolledUsers(id: string): Promise<Applicant[]> {
  try {
    const res = await apiRequest(`/api/admin/live-sessions/${id}/enrolled-users`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((item: any, idx: number) => {
          const fullName = item.name || `User ${item.userId?.slice(0, 6) || idx + 1}`;
          const initials =
            fullName
              .split(" ")
              .filter(Boolean)
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "ST";

          let appliedDate = "Enrolled";
          if (item.enrolledAt) {
            try {
              appliedDate = new Date(item.enrolledAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
            } catch {
              appliedDate = item.enrolledAt;
            }
          }

          return {
            id: String(item.id || item.userId || `enrolled-${idx}`),
            name: fullName,
            initials,
            role: item.role || "Candidate",
            target: "Session",
            kind: "Session" as const,
            applied: appliedDate,
            match: 100,
            stage: "New" as const,
            email: item.email || "",
            externalUserId: item.userId,
            avatarUrl: item.avatarUrl || null,
          };
        });
      }
    }
  } catch (err) {
    console.debug(`Failed to fetch enrolled users for session ${id}:`, err);
  }
  return [];
}

/**
 * Fetch details and enrolled students for a specific live session
 */
export async function getSessionDetails(
  id: string,
  sessionTitle: string,
  initialModules: SessionModule[] | null = null,
): Promise<{ modules: SessionModule[] | null; students: Applicant[] }> {
  let modules: SessionModule[] | null = initialModules && initialModules.length > 0 ? initialModules : null;
  let students: Applicant[] = peopleFor(sessionTitle, "Session");

  try {
    const [detailRes, realEnrolledUsers] = await Promise.all([
      apiRequest(`/api/admin/live-sessions/${id}`).catch(() => null),
      getSessionEnrolledUsers(id).catch(() => []),
    ]);

    if (detailRes && detailRes.ok) {
      const data = (await detailRes.json()) as BackendLiveSessionPayload;
      if (Array.isArray(data.modules) && data.modules.length > 0) {
        modules = mapBackendModules(data.modules);
      }
    }

    if (Array.isArray(realEnrolledUsers) && realEnrolledUsers.length > 0) {
      students = realEnrolledUsers;
    }
  } catch {
    console.debug(`Live session detail for ${id} unavailable.`);
  }

  return { modules, students };
}

/**
 * Create a new live skill session via POST /api/admin/live-sessions
 */
export async function createSession(sessionData: Partial<LiveSession>): Promise<LiveSession> {
  const backendBody = {
    title: (sessionData.title || "Live Skill Session").trim(),
    description: (
      sessionData.summary ||
      "A live, hands-on online session run on Google Meet. Join with the link below at the scheduled time."
    ).trim(),
    instructorId: sessionData.instructorId || sessionData.host || "Finder Careers",
    thumbnail: sessionData.thumbnail || null,
    liveUrl: sessionData.meetLink || "https://meet.google.com/live",
    category: sessionData.tags?.join(", ") || "Live Session",
    seats: typeof sessionData.seats === "number" ? sessionData.seats : 100,
    scheduledDate: sessionData.date || null,
    startTime: sessionData.time || null,
    endTime: sessionData.endTime || null,
    isJoinLinkEnabled: sessionData.isJoinLinkEnabled ?? true,
  };

  const newLocalSession: LiveSession = {
    id: `s-${Date.now()}`,
    title: backendBody.title,
    host: sessionData.host || (sessionData.instructor?.name) || "Finder Careers",
    instructorId: backendBody.instructorId,
    instructor: sessionData.instructor || null,
    date: sessionData.date || "Nov 1, 2026",
    time: sessionData.time || "7:00 PM IST",
    endTime: sessionData.endTime,
    duration: sessionData.duration || "90 min",
    seats: backendBody.seats,
    enrolled: 0,
    price: "Free",
    level: sessionData.level || "Beginner",
    status: "Scheduled",
    meetLink: backendBody.liveUrl,
    isJoinLinkEnabled: backendBody.isJoinLinkEnabled,
    tags: sessionData.tags || ["Live Session"],
    thumbnail: sessionData.thumbnail || undefined,
    summary: backendBody.description,
    modules: null,
  };

  try {
    const res = await apiRequest("/api/admin/live-sessions", {
      method: "POST",
      body: JSON.stringify(backendBody),
    });

    if (res.ok) {
      const data = (await res.json()) as BackendLiveSessionPayload;
      const mapped = mapBackendSession(data);
      const combined: LiveSession = {
        ...newLocalSession,
        ...mapped,
        instructor: mapped.instructor || sessionData.instructor || newLocalSession.instructor,
        host: sessionData.host || mapped.host,
        date: sessionData.date || mapped.date,
        time: sessionData.time || mapped.time,
        endTime: sessionData.endTime || mapped.endTime,
        seats: sessionData.seats || mapped.seats,
        isJoinLinkEnabled: sessionData.isJoinLinkEnabled ?? mapped.isJoinLinkEnabled ?? true,
      };

      inMemorySessions.unshift(combined);
      return combined;
    }
  } catch (error) {
    console.debug("POST /api/admin/live-sessions error, storing locally:", error);
  }

  inMemorySessions.unshift(newLocalSession);
  return newLocalSession;
}

/**
 * Update an existing live session via PUT /api/admin/live-sessions/:id
 */
export async function updateSession(
  id: string,
  updates: Partial<LiveSession>,
): Promise<LiveSession | null> {
  const existing = inMemorySessions.find((s) => s.id === id);

  const backendUpdates = {
    title: (updates.title || existing?.title || "Live Skill Session").trim(),
    description: (updates.summary || existing?.summary || "").trim(),
    instructorId: updates.instructorId || existing?.instructorId || updates.host || existing?.host || "Finder Careers",
    thumbnail: updates.thumbnail !== undefined ? updates.thumbnail : existing?.thumbnail || null,
    liveUrl: updates.meetLink || existing?.meetLink || "https://meet.google.com/live",
    category: updates.tags?.join(", ") || existing?.tags?.join(", ") || "Live Session",
    seats: typeof updates.seats === "number" ? updates.seats : (existing?.seats ?? 100),
    scheduledDate: updates.date !== undefined ? updates.date : existing?.date || null,
    startTime: updates.time !== undefined ? updates.time : existing?.time || null,
    endTime: updates.endTime !== undefined ? updates.endTime : existing?.endTime || null,
    isJoinLinkEnabled: updates.isJoinLinkEnabled !== undefined ? updates.isJoinLinkEnabled : (existing?.isJoinLinkEnabled ?? true),
    active: updates.status !== "Completed",
  };

  try {
    const res = await apiRequest(`/api/admin/live-sessions/${id}`, {
      method: "PUT",
      body: JSON.stringify(backendUpdates),
    });

    if (res.ok) {
      const data = (await res.json()) as BackendLiveSessionPayload;
      const mapped = mapBackendSession(data);
      inMemorySessions = inMemorySessions.map((s) =>
        s.id === id ? { ...s, ...mapped, ...updates } : s,
      );
      return inMemorySessions.find((s) => s.id === id) ?? mapped;
    }
  } catch (error) {
    console.debug(`PUT /api/admin/live-sessions/${id} error, updating locally:`, error);
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
 * Toggle enable/disable status of the live session join link
 */
export async function toggleSessionJoinLink(
  id: string,
  enabled: boolean,
): Promise<LiveSession | null> {
  return updateSession(id, { isJoinLinkEnabled: enabled });
}

/**
 * Delete a session via DELETE /api/admin/live-sessions/:id
 */
export async function deleteSession(id: string): Promise<boolean> {
  try {
    const res = await apiRequest(`/api/admin/live-sessions/${id}`, {
      method: "DELETE",
    });

    if (res.ok || res.status === 204) {
      inMemorySessions = inMemorySessions.filter((s) => s.id !== id);
      return true;
    }
  } catch (error) {
    console.debug(`DELETE /api/admin/live-sessions/${id} error:`, error);
  }

  inMemorySessions = inMemorySessions.filter((s) => s.id !== id);
  return true;
}

/**
 * Enroll the authenticated user in a live session via POST /api/live-sessions/:id/enroll
 */
export async function enrollInSession(
  sessionId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await apiRequest(`/api/live-sessions/${sessionId}/enroll`, {
      method: "POST",
    });

    if (res.ok || res.status === 200 || res.status === 201) {
      return { success: true, message: "Enrolled in live session successfully!" };
    }

    if (res.status === 409) {
      return { success: false, message: "You are already enrolled in this live session." };
    }

    if (res.status === 400) {
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.message || "Enrollment is closed or session is full." };
    }

    if (res.status === 404) {
      return { success: false, message: "Live session not found." };
    }

    return { success: false, message: "Enrollment failed. Please try again." };
  } catch (error) {
    console.debug(`POST /api/live-sessions/${sessionId}/enroll error:`, error);
    return { success: false, message: "Could not reach server. Please check your connection." };
  }
}
