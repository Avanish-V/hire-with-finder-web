import { jobs, sessions, applicants } from "../lib/finder-data";

// Single source of truth: VITE_API_URL (same var used by the client-side apiClient.ts).
// Hardcoded fallback ensures the SSR proxy never accidentally hits localhost in production.
const BACKEND_URL =
  process.env.VITE_API_URL ||
  "https://bmo6sd3nhbgp4akoqmgoamd3ja0cmyyn.lambda-url.ap-south-1.on.aws/";

let serverJobs = [...jobs];
let serverSessions = [...sessions];
let serverApplicants = [...applicants];
let serverProfile = {
  name: "",
  email: "",
  phone: "",
  role: "recruiter",
  company: "",
  location: "",
  bio: "",
  skills: [],
  notifications: {
    applicantAlerts: true,
    sessionEnrollments: true,
    weeklyDigest: false,
  },
  postsCount: 0,
  sessionsCount: 0,
  applicantsCount: 0,
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

/**
 * Handles incoming /api/* requests.
 * Attempts to forward to real backend (local or prod) first.
 * If backend is offline or returns error, serves seamless mock responses with status 200 OK.
 */
export async function handleApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) {
    return null;
  }

  if (request.method === "OPTIONS") {
    return json({ ok: true });
  }

  // 1. Try to proxy to backend if available
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout for prod Lambda cold-starts

    const backendUrl = `${BACKEND_URL}${url.pathname}${url.search}`;
    const proxyHeaders = new Headers(request.headers);
    proxyHeaders.set("host", new URL(BACKEND_URL).host);

    const backendRes = await fetch(backendUrl, {
      method: request.method,
      headers: proxyHeaders,
      body:
        request.method !== "GET" && request.method !== "HEAD"
          ? await request.clone().arrayBuffer()
          : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (backendRes.status !== 404 && backendRes.status !== 502 && backendRes.status !== 503) {
      return backendRes;
    }
  } catch {
    // Backend offline -> serve mock API endpoints
  }

  // 2. Mock API endpoints fallback (returns 200 OK)
  const path = url.pathname;
  const method = request.method;

  // Dashboard Stats
  if (path === "/api/dashboard/stats" && method === "GET") {
    return json({
      activeJobs: serverJobs.filter((j) => j.type !== "Internship" && j.status === "Open").length,
      activeInternships: serverJobs.filter((j) => j.type === "Internship" && j.status === "Open")
        .length,
      totalApplications: serverApplicants.length,
      liveSessions: serverSessions.filter((s) => s.status !== "Completed").length,
      hireRate: "0%",
    });
  }

  // Dashboard Applications
  if (path === "/api/dashboard/applications" && method === "GET") {
    return json(serverApplicants.slice(0, 5));
  }

  // Jobs Endpoints
  if (path === "/api/jobs" && method === "GET") {
    return json(serverJobs);
  }

  if (path === "/api/jobs" && method === "POST") {
    try {
      const body = await request.json();
      const newJob = {
        id: `j${Date.now()}`,
        title: body.title || "New Role",
        company: body.company || "Company",
        location: body.location || "Remote",
        type: body.type || "Internship",
        stipend: body.stipend || "₹25,000 / mo",
        posted: "Just now",
        applicants: 0,
        skills: body.skills || ["React"],
        status: body.status || "Open",
      };
      serverJobs.unshift(newJob as any);
      return json(newJob, 201);
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
  }

  if (path.startsWith("/api/jobs/") && path.endsWith("/applicants") && method === "GET") {
    const id = path.replace("/api/jobs/", "").replace("/applicants", "");
    const job = serverJobs.find((j) => j.id === id);
    const applicants = job
      ? serverApplicants.filter((a) => a.target === job.title)
      : [];
    return json(applicants);
  }

  if (path.startsWith("/api/jobs/") && method === "PUT") {
    const id = path.replace("/api/jobs/", "");
    try {
      const body = await request.json();
      const idx = serverJobs.findIndex((j) => j.id === id);
      if (idx !== -1) {
        serverJobs[idx] = { ...serverJobs[idx], ...body };
        return json(serverJobs[idx]);
      }
      return json({ error: "Not found" }, 404);
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
  }

  if (path.startsWith("/api/jobs/") && method === "DELETE") {
    const id = path.replace("/api/jobs/", "");
    serverJobs = serverJobs.filter((j) => j.id !== id);
    return json({ msg: "Job removed" });
  }

  // Courses / Sessions Endpoints
  if (path === "/api/courses" && method === "GET") {
    return json(serverSessions);
  }

  if (path.startsWith("/api/courses/") && path.endsWith("/content") && method === "GET") {
    const id = path.replace("/api/courses/", "").replace("/content", "");
    const session = serverSessions.find((s) => s.id === id);
    if (session) {
      return json({
        ...session,
        instructor: session.host,
        description: session.summary,
        modules: session.modules ?? null,
      });
    }
    return json({ error: "Course not found" }, 404);
  }

  if (path.startsWith("/api/courses/") && path.endsWith("/students") && method === "GET") {
    const id = path.replace("/api/courses/", "").replace("/students", "");
    const session = serverSessions.find((s) => s.id === id);
    const students = session ? serverApplicants.filter((a) => a.target === session.title) : [];
    return json(students);
  }

  if (path === "/api/courses" && method === "POST") {
    try {
      const body = await request.json();
      const newSession = {
        id: `s${Date.now()}`,
        title: body.title || "New Session",
        host: body.instructor || body.host || "Finder Careers",
        date: body.date || "Aug 25, 2026",
        time: body.time || "7:00 PM IST",
        duration: body.duration || "60 min",
        seats: body.seats || 100,
        enrolled: 0,
        price: body.price === 0 || body.price === "0" ? "Free" : typeof body.price === "number" ? `₹${body.price}` : body.price || "Free",
        level: body.level || "Beginner",
        status: "Scheduled",
        meetLink: body.liveUrl || body.meetLink || "meet.google.com/fdr-live",
        isJoinLinkEnabled: body.isJoinLinkEnabled ?? body.joinLinkEnabled ?? true,
        tags: body.category ? [body.category] : body.tags || ["Live"],
        thumbnail: body.thumbnail,
        summary: body.description || body.summary,
        modules: body.modules ?? null,
      };
      serverSessions.unshift(newSession as any);
      return json(newSession, 201);
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
  }

  if (path.startsWith("/api/courses/") && (method === "PUT" || method === "PATCH")) {
    const id = path.replace("/api/courses/", "").replace("/join-link", "");
    try {
      const body = await request.json();
      const idx = serverSessions.findIndex((s) => s.id === id);
      if (idx !== -1) {
        serverSessions[idx] = {
          ...serverSessions[idx],
          ...(body.title && { title: body.title }),
          ...(body.instructor && { host: body.instructor }),
          ...(body.description && { summary: body.description }),
          ...(body.duration && { duration: body.duration }),
          ...(body.liveUrl && { meetLink: body.liveUrl }),
          ...(body.isJoinLinkEnabled !== undefined && { isJoinLinkEnabled: body.isJoinLinkEnabled }),
          ...(body.enabled !== undefined && { isJoinLinkEnabled: body.enabled }),
          ...(body.thumbnail && { thumbnail: body.thumbnail }),
          ...(body.level && { level: body.level }),
          ...(body.price !== undefined && {
            price: body.price === 0 ? "Free" : `₹${body.price}`,
          }),
          ...(body.modules !== undefined && { modules: body.modules }),
        };
        return json(serverSessions[idx]);
      }
      return json({ error: "Course not found" }, 404);
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
  }

  if (path.startsWith("/api/courses/") && method === "DELETE") {
    const id = path.replace("/api/courses/", "");
    serverSessions = serverSessions.filter((s) => s.id !== id);
    return json({ msg: "Course removed" });
  }

  // Applications Endpoints
  if (path === "/api/applications" && method === "GET") {
    return json(serverApplicants);
  }

  if (path.startsWith("/api/applications/") && path.endsWith("/status") && method === "PATCH") {
    const id = path.replace("/api/applications/", "").replace("/status", "");
    try {
      const body = await request.json();
      const idx = serverApplicants.findIndex((a) => a.id === id);
      if (idx !== -1) {
        serverApplicants[idx] = { ...serverApplicants[idx], stage: body.status || body.stage };
        return json(serverApplicants[idx]);
      }
      return json({ error: "Not found" }, 404);
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
  }

  // Profile Endpoints (legacy combined)
  if (path === "/api/profile" && method === "GET") {
    return json(serverProfile);
  }

  if (path === "/api/profile" && method === "PUT") {
    try {
      const body = await request.json();
      serverProfile = { ...serverProfile, ...body };
      return json(serverProfile);
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
  }

  // User Profile Endpoints (separate)
  if ((path === "/api/user/profile" || path === "/api/v1/user/profile") && method === "GET") {
    return json(serverProfile);
  }

  if ((path === "/api/user/profile" || path === "/api/v1/user/profile") && method === "PUT") {
    try {
      const body = await request.json();
      serverProfile = { ...serverProfile, ...body };
      return json(serverProfile);
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
  }

  // Company Profile Endpoints (separate) - return 404 if no company exists (don't auto-create)
  if ((path === "/api/company/profile" || path === "/api/v1/company/profile") && method === "GET") {
    // Return 404 so the frontend treats company as not-yet-set-up
    return json({ message: "Company profile not found" }, 404);
  }

  if ((path === "/api/company/profile" || path === "/api/v1/company/profile") && (method === "PUT" || method === "POST")) {
    try {
      const body = await request.json();
      const companyData = {
        id: `company-mock-${Date.now()}`,
        name: body.name || "",
        logoUrl: body.logoUrl || "",
        website: body.website || "",
        industry: body.industry || "",
        size: body.size || "",
        address: body.address || "",
        city: body.city || "",
        country: body.country || "India",
        about: body.about || "",
        isVerified: false,
        isActive: true,
      };
      return json(companyData);
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
  }

  // Auth Supabase session exchange
  if (path === "/api/auth/supabase-session" && method === "POST") {
    return json({
      token: "",
      user: {
        id: "",
        name: "",
        email: "",
        role: "recruiter",
        company: "",
      },
    });
  }

  return json({ message: "OK" });
}
