import { apiRequest, getUser } from "@/lib/apiClient";

// ============================================================================
// Type Definitions
// ============================================================================

export interface CompanyProfile {
  id?: string;
  name: string;
  logoUrl: string;
  website: string;
  industry: string;
  size: string;
  address: string;
  city: string;
  country: string;
  about: string;
  socialLinks?: Record<string, string>;
  isVerified?: boolean;
  isActive?: boolean;
  userCount?: number;
}

export interface UserProfile {
  uid?: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  designation?: string;
  company: string; // Company name (for display/backward compatibility)
  companyId?: string; // Company ID (for association)
  location: string;
  bio: string;
  avatarUrl: string;
  companyProfile: CompanyProfile;
  skills: string[];
  notifications: {
    applicantAlerts: boolean;
    sessionEnrollments: boolean;
    weeklyDigest: boolean;
  };
  postsCount: number;
  sessionsCount: number;
  applicantsCount: number;
  isActive?: boolean;
  emailVerified?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  role?: string;
  designation?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  companyId?: string;
  notifications?: {
    applicantAlerts: boolean;
    sessionEnrollments: boolean;
    weeklyDigest: boolean;
  };
}

export interface UpdateCompanyProfileRequest {
  name?: string;
  logoUrl?: string;
  website?: string;
  industry?: string;
  size?: string;
  address?: string;
  city?: string;
  country?: string;
  about?: string;
  socialLinks?: Record<string, string>;
}

export interface UpdateCombinedProfileRequest {
  userProfile?: UpdateUserProfileRequest;
  companyProfile?: UpdateCompanyProfileRequest;
}

// ============================================================================
// Default Values
// ============================================================================

export const emptyCompanyProfile: CompanyProfile = {
  name: "",
  logoUrl: "",
  website: "",
  industry: "",
  size: "",
  address: "",
  city: "",
  country: "",
  about: "",
};

let inMemoryProfile: UserProfile = {
  avatarUrl: "",
  companyProfile: { ...emptyCompanyProfile },
  name: "",
  email: "",
  phone: "",
  role: "",
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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse backend response to UserProfile format
 */
function parseProfileResponse(data: any): UserProfile {
  return {
    uid: data.uid,
    name: data.name || data.fullName || "",
    email: data.email || "",
    phone: data.phone || data.phoneNumber || "",
    avatarUrl: data.avatarUrl || "",
    role: data.role || "recruiter",
    designation: data.designation || "",
    company: data.company?.name || data.companyProfile?.name || "Independent",
    companyId: data.companyId || data.company?.id,
    location: data.location || "",
    bio: data.bio || "",
    skills: data.skills || [],
    notifications: data.notifications || {
      applicantAlerts: true,
      sessionEnrollments: true,
      weeklyDigest: false,
    },
    companyProfile: data.companyProfile ? parseCompanyProfile(data.companyProfile) : emptyCompanyProfile,
    postsCount: data.postsCount || 0,
    sessionsCount: data.sessionsCount || 0,
    applicantsCount: data.applicantsCount || 0,
    isActive: data.isActive,
    emailVerified: data.emailVerified,
    lastLoginAt: data.lastLoginAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Parse company profile from backend response
 */
function parseCompanyProfile(data: any): CompanyProfile {
  return {
    id: data.id,
    name: data.name || "",
    logoUrl: data.logoUrl || "",
    website: data.website || "",
    industry: data.industry || "",
    size: data.size || "",
    address: data.address || "",
    city: data.city || "",
    country: data.country || "India",
    about: data.about || "",
    socialLinks: data.socialLinks,
    isVerified: data.isVerified,
    isActive: data.isActive,
    userCount: data.userCount,
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get company profile by owner UID (using new separate endpoint)
 * This fetches the company profile for the logged-in user
 */
export async function getCompanyProfileByOwner(): Promise<CompanyProfile | null> {
  try {
    const res = await apiRequest("/api/company/profile");
    if (res.ok) {
      const data = await res.json();
      return parseCompanyProfile(data);
    } else if (res.status === 404) {
      // Company profile doesn't exist yet, return empty
      return { ...emptyCompanyProfile };
    }
  } catch (error) {
    console.error("Failed to fetch company profile:", error);
  }
  return { ...emptyCompanyProfile };
}

/**
 * Get user profile (using new separate endpoint)
 */
export async function getUserProfileData(): Promise<Partial<UserProfile> | null> {
  try {
    const res = await apiRequest("/api/user/profile");
    if (res.ok) {
      const data = await res.json();
      return {
        uid: data.uid,
        name: data.name || data.fullName || "",
        email: data.email || "",
        phone: data.phone || data.phoneNumber || "",
        avatarUrl: data.avatarUrl || "",
        role: data.role || "recruiter",
        designation: data.designation || "",
        location: data.location || "",
        bio: data.bio || "",
        skills: data.skills || [],
        notifications: data.notifications || {
          applicantAlerts: true,
          sessionEnrollments: true,
          weeklyDigest: false,
        },
        postsCount: data.postsCount || 0,
        sessionsCount: data.sessionsCount || 0,
        applicantsCount: data.applicantsCount || 0,
      };
    }
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
  }
  return null;
}

/**
 * Get combined profile (user + company) - fetches from separate endpoints
 */
export async function getProfile(): Promise<UserProfile> {
  const currentUser = getUser();

  try {
    // Fetch user and company profiles separately
    const [userProfile, companyProfile] = await Promise.all([
      getUserProfileData(),
      getCompanyProfileByOwner()
    ]);

    if (userProfile) {
      const profile: UserProfile = {
        ...inMemoryProfile,
        ...userProfile,
        companyProfile: companyProfile || emptyCompanyProfile,
        company: companyProfile?.name || "Independent",
      };
      
      // Update in-memory cache
      inMemoryProfile = profile;
      
      return profile;
    }
  } catch (error) {
    console.error("Failed to fetch profile:", error);
  }

  // Fallback to current user info if available
  if (currentUser) {
    inMemoryProfile.name = currentUser.name || inMemoryProfile.name;
    inMemoryProfile.email = currentUser.email || inMemoryProfile.email;
    inMemoryProfile.avatarUrl = currentUser.avatarUrl || inMemoryProfile.avatarUrl;
  }

  return { ...inMemoryProfile };
}

/**
 * Update combined profile (user + company)
 * Uses the combined endpoint for backward compatibility
 */
export async function updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  try {
    // Prepare the update request
    const updateRequest: UpdateCombinedProfileRequest = {};

    // User profile updates
    if (updates.name || updates.email || updates.phone || updates.avatarUrl || 
        updates.role || updates.designation || updates.location || updates.bio || 
        updates.skills || updates.notifications) {
      updateRequest.userProfile = {
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        avatarUrl: updates.avatarUrl,
        role: updates.role,
        designation: updates.designation,
        location: updates.location,
        bio: updates.bio,
        skills: updates.skills,
        companyId: updates.companyId,
        notifications: updates.notifications,
      };
    }

    // Company profile updates
    if (updates.companyProfile) {
      updateRequest.companyProfile = {
        name: updates.companyProfile.name,
        logoUrl: updates.companyProfile.logoUrl,
        website: updates.companyProfile.website,
        industry: updates.companyProfile.industry,
        size: updates.companyProfile.size,
        address: updates.companyProfile.address,
        city: updates.companyProfile.city,
        country: updates.companyProfile.country,
        about: updates.companyProfile.about,
        socialLinks: updates.companyProfile.socialLinks,
      };
    }

    const res = await apiRequest("/api/profile", {
      method: "PUT",
      body: JSON.stringify(updateRequest),
    });

    if (res.ok) {
      const data = await res.json();
      const profile = parseProfileResponse(data);
      
      // Update in-memory cache
      inMemoryProfile = profile;
      
      return profile;
    }
  } catch (error) {
    console.error("Failed to update profile:", error);
  }

  // Fallback: update in-memory cache
  inMemoryProfile = { ...inMemoryProfile, ...updates };
  if (updates.companyProfile) {
    inMemoryProfile.companyProfile = { ...inMemoryProfile.companyProfile, ...updates.companyProfile };
  }
  
  return { ...inMemoryProfile };
}

/**
 * Get user profile by UID (new endpoint)
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const res = await apiRequest(`/api/v1/user/${uid}`);
    if (res.ok) {
      const data = await res.json();
      return parseProfileResponse(data);
    }
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
  }
  return null;
}

/**
 * Get company profile by ID (new endpoint)
 */
export async function getCompanyProfile(companyId: string): Promise<CompanyProfile | null> {
  try {
    const res = await apiRequest(`/api/v1/company/${companyId}`);
    if (res.ok) {
      const data = await res.json();
      return parseCompanyProfile(data);
    }
  } catch (error) {
    console.error("Failed to fetch company profile:", error);
  }
  return null;
}

/**
 * Update user profile only (primary endpoint)
 */
export async function updateUserProfile(updates: UpdateUserProfileRequest): Promise<UserProfile | null> {
  try {
    const res = await apiRequest("/api/user/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      const profile = parseProfileResponse(data);
      
      // Update in-memory cache
      inMemoryProfile = profile;
      
      return profile;
    } else {
      const errorText = await res.text();
      console.error(`Failed to update user profile (${res.status}):`, errorText);
    }
  } catch (error) {
    console.error("Failed to update user profile:", error);
  }
  return null;
}

/**
 * Update company profile only (new endpoint)
 */
export async function updateCompanyProfile(
  companyId: string,
  updates: UpdateCompanyProfileRequest
): Promise<CompanyProfile | null> {
  try {
    const res = await apiRequest(`/api/v1/company/${companyId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      return parseCompanyProfile(data);
    }
  } catch (error) {
    console.error("Failed to update company profile:", error);
  }
  return null;
}

/**
 * Create new company profile
 */
export async function createCompanyProfile(company: Omit<CompanyProfile, "id">): Promise<CompanyProfile | null> {
  try {
    const res = await apiRequest("/api/v1/company", {
      method: "POST",
      body: JSON.stringify(company),
    });
    if (res.ok) {
      const data = await res.json();
      return parseCompanyProfile(data);
    }
  } catch (error) {
    console.error("Failed to create company profile:", error);
  }
  return null;
}

/**
 * Search companies by name
 */
export async function searchCompanies(query: string): Promise<CompanyProfile[]> {
  try {
    const res = await apiRequest(`/api/v1/company/search?query=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      return data.map(parseCompanyProfile);
    }
  } catch (error) {
    console.error("Failed to search companies:", error);
  }
  return [];
}

/**
 * Associate user with a company
 */
export async function associateWithCompany(companyId: string | null): Promise<boolean> {
  try {
    const currentUser = getUser();
    if (!currentUser?.uid) return false;

    const res = await apiRequest("/api/v1/user/profile/company", {
      method: "PUT",
      body: JSON.stringify({
        userUid: currentUser.uid,
        companyId: companyId,
      }),
    });
    return res.ok;
  } catch (error) {
    console.error("Failed to associate with company:", error);
  }
  return false;
}
