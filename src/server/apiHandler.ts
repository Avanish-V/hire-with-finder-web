import { jobs, sessions, applicants } from "../lib/finder-data";

// Single source of truth: VITE_API_URL (same var used by the client-side apiClient.ts).
// Hardcoded fallback ensures the SSR proxy never accidentally hits localhost in production.
const BACKEND_URL =
  process.env.VITE_API_URL ||
  "https://bmo6sd3nhbgp4akoqmgoamd3ja0cmyyn.lambda-url.ap-south-1.on.aws/";

let serverJobs = [...jobs];
let serverSessions = [...sessions];
let serverApplicants = [...applicants];
let serverEmailCampaigns: any[] = [
  {
    id: "c1-example-welcome",
    title: "Welcome Batch 2026 Onboarding",
    subject: "Welcome to Collabbit Careers, {{name}}!",
    htmlContent: "<h2>Hello {{name}},</h2><p>Welcome to our careers platform. Explore all internships and jobs.</p>",
    fromName: "Collabbit Talent Team",
    fromEmail: "careers@collabbit.com",
    replyTo: "support@collabbit.com",
    status: "COMPLETED",
    totalRecipients: 150,
    sentCount: 150,
    deliveredCount: 147,
    failedCount: 1,
    bouncedCount: 2,
    complainedCount: 0,
    deliveryRate: 98.0,
    bounceRate: 1.3,
    createdBy: "admin",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    startedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    attachments: [],
  },
];
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

  // Live Sessions Endpoints (Admin & User)
  if ((path === "/api/admin/live-sessions" || path === "/api/live-sessions" || path === "/api/courses") && method === "GET") {
    return json(serverSessions);
  }

  if (path.startsWith("/api/admin/live-sessions/") && path.endsWith("/enrolled-users") && method === "GET") {
    const id = path.replace("/api/admin/live-sessions/", "").replace("/enrolled-users", "");
    const session = serverSessions.find((s) => s.id === id);
    const applicants = session ? serverApplicants.filter((a) => a.kind === "Session" && a.target === session.title) : [];
    const formatted = applicants.map((a) => ({
      id: a.id,
      userId: a.externalUserId || a.id,
      name: a.name,
      email: a.email,
      avatarUrl: a.avatarUrl,
      role: a.role,
      enrolledAt: new Date().toISOString(),
    }));
    return json(formatted);
  }

  if (path.startsWith("/api/admin/live-sessions/") && method === "GET") {
    const id = path.replace("/api/admin/live-sessions/", "");
    const session = serverSessions.find((s) => s.id === id);
    if (session) return json(session);
    return json({ error: "Session not found" }, 404);
  }

  if ((path === "/api/admin/live-sessions" || path === "/api/courses") && method === "POST") {
    try {
      const body = await request.json();
      const hostName = typeof body.instructor === "string" ? body.instructor : (body.instructor?.name || body.host || "Finder Careers");
      const instructorObj = (body.instructor && typeof body.instructor === "object") ? body.instructor : {
        id: body.instructorId || "instr-1",
        name: hostName,
        bio: "Principal System Architect & Tech Lead with 10+ years experience in distributed cloud systems.",
        imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      };
      const newSession = {
        id: `s${Date.now()}`,
        title: body.title || "New Session",
        host: hostName,
        instructorId: body.instructorId || instructorObj.id || "default-instructor",
        instructor: instructorObj,
        date: body.scheduledDate || body.date || "Nov 1, 2026",
        time: body.startTime || body.time || "7:00 PM IST",
        endTime: body.endTime || "8:30 PM IST",
        duration: body.duration || "90 min",
        seats: body.seats || 100,
        enrolled: 0,
        enrolledCount: 0,
        price: "Free",
        level: body.level || "Beginner",
        status: "Scheduled",
        meetLink: body.liveUrl || body.meetLink || "https://meet.google.com/live",
        isJoinLinkEnabled: body.isJoinLinkEnabled ?? true,
        tags: body.category ? [body.category] : body.tags || ["Live Session"],
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

  if ((path.startsWith("/api/admin/live-sessions/") || path.startsWith("/api/courses/")) && (method === "PUT" || method === "PATCH")) {
    const id = path.replace("/api/admin/live-sessions/", "").replace("/api/courses/", "").replace("/join-link", "");
    try {
      const body = await request.json();
      const idx = serverSessions.findIndex((s) => s.id === id);
      if (idx !== -1) {
        serverSessions[idx] = {
          ...serverSessions[idx],
          ...(body.title && { title: body.title }),
          ...((body.instructorId || body.instructor) && { host: body.instructorId || body.instructor }),
          ...(body.description && { summary: body.description }),
          ...(body.duration && { duration: body.duration }),
          ...(body.liveUrl && { meetLink: body.liveUrl }),
          ...(body.isJoinLinkEnabled !== undefined && { isJoinLinkEnabled: body.isJoinLinkEnabled }),
          ...(body.thumbnail && { thumbnail: body.thumbnail }),
          ...(body.seats && { seats: body.seats }),
          ...(body.scheduledDate && { date: body.scheduledDate }),
          ...(body.startTime && { time: body.startTime }),
          ...(body.endTime && { endTime: body.endTime }),
        };
        return json(serverSessions[idx]);
      }
      return json({ error: "Session not found" }, 404);
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
  }

  if ((path.startsWith("/api/admin/live-sessions/") || path.startsWith("/api/courses/")) && method === "DELETE") {
    const id = path.replace("/api/admin/live-sessions/", "").replace("/api/courses/", "");
    serverSessions = serverSessions.filter((s) => s.id !== id);
    return new Response(null, { status: 204 });
  }

  if (path.startsWith("/api/live-sessions/") && path.endsWith("/enroll") && method === "POST") {
    const id = path.replace("/api/live-sessions/", "").replace("/enroll", "");
    const session = serverSessions.find((s) => s.id === id);
    if (!session) return json({ message: "Session not found" }, 404);
    session.enrolled = (session.enrolled || 0) + 1;
    return json({ ...session, enrolled: true });
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

  // Bulk Email Campaigns Endpoints
  if (path === "/api/admin/email-campaigns" && method === "GET") {
    return json({
      content: serverEmailCampaigns,
      totalElements: serverEmailCampaigns.length,
      totalPages: 1,
      size: 20,
      number: 0,
    });
  }

  if (path === "/api/admin/email-campaigns" && method === "POST") {
    try {
      const body = await request.json();
      const newCampaign = {
        id: `c${Date.now()}`,
        title: body.title || "New Campaign",
        subject: body.subject || "",
        htmlContent: body.htmlContent || "",
        fromName: body.fromName || "Finder Team",
        fromEmail: body.fromEmail || "noreply@collabbit.com",
        replyTo: body.replyTo || null,
        status: "DRAFT",
        totalRecipients: 0,
        sentCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        bouncedCount: 0,
        complainedCount: 0,
        deliveryRate: 0,
        bounceRate: 0,
        createdBy: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        attachments: [],
      };
      serverEmailCampaigns.unshift(newCampaign);
      return json(newCampaign, 201);
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
  }

  if (path.startsWith("/api/admin/email-campaigns/") && method === "GET" && !path.includes("/recipients")) {
    const id = path.replace("/api/admin/email-campaigns/", "");
    const camp = serverEmailCampaigns.find((c) => c.id === id);
    if (camp) return json(camp);
    return json({ error: "Campaign not found" }, 404);
  }

  if (path.startsWith("/api/admin/email-campaigns/") && method === "DELETE") {
    const id = path.replace("/api/admin/email-campaigns/", "");
    serverEmailCampaigns = serverEmailCampaigns.filter((c) => c.id !== id);
    return new Response(null, { status: 204 });
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
