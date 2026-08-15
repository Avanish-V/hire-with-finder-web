import { apiRequest, getUser } from "@/lib/apiClient";

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  company: string;
  location: string;
  bio: string;
  skills: string[];
  notifications: {
    applicantAlerts: boolean;
    sessionEnrollments: boolean;
    weeklyDigest: boolean;
  };
  postsCount: number;
  sessionsCount: number;
  applicantsCount: number;
}

let inMemoryProfile: UserProfile = {
  name: "Aditya Kulkarni",
  email: "aditya@finder.app",
  phone: "+91 98200 11223",
  role: "recruiter",
  company: "Finder Internal",
  location: "Bengaluru, India",
  bio: "Hiring for engineering and design across internships and full-time roles. I also run weekly live sessions on interview prep.",
  skills: ["Hiring", "React", "Node.js", "Interviewing"],
  notifications: {
    applicantAlerts: true,
    sessionEnrollments: true,
    weeklyDigest: false,
  },
  postsCount: 8,
  sessionsCount: 12,
  applicantsCount: 426,
};

/**
 * Fetch recruiter profile
 */
export async function getProfile(): Promise<UserProfile> {
  const currentUser = getUser();

  try {
    const res = await apiRequest("/api/profile");
    if (res.ok) {
      const data = await res.json();
      inMemoryProfile = {
        ...inMemoryProfile,
        ...data,
        name: data.name || currentUser?.name || inMemoryProfile.name,
        email: data.email || currentUser?.email || inMemoryProfile.email,
      };
      return inMemoryProfile;
    }
  } catch (error) {
    // TODO: Connect GET /api/profile when backend service is available
    console.debug("Profile API unavailable, using local profile state");
  }

  if (currentUser) {
    inMemoryProfile.name = currentUser.name || inMemoryProfile.name;
    inMemoryProfile.email = currentUser.email || inMemoryProfile.email;
  }

  return { ...inMemoryProfile };
}

/**
 * Update recruiter profile
 */
export async function updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  try {
    const res = await apiRequest("/api/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    });

    if (res.ok) {
      const data = await res.json();
      inMemoryProfile = { ...inMemoryProfile, ...data, ...updates };
      return inMemoryProfile;
    }
  } catch (error) {
    // TODO: Connect PUT /api/profile when backend service is available
    console.debug("Update profile API unavailable, updating local state");
  }

  inMemoryProfile = { ...inMemoryProfile, ...updates };
  return { ...inMemoryProfile };
}
