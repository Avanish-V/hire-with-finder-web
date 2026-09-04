import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  signInWithGooglePopup,
  signInWithGoogleRedirect,
  resolveGoogleRedirectResult,
  signOutFirebase,
} from "./firebaseClient";
import {
  clearAuthStorage,
  getUser,
  setAuthData,
  apiRequest,
  type User,
} from "./apiClient";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Start with no user on the server and during hydration; the stored
  // session is restored in the initialize() effect below. Reading
  // localStorage in a useState initializer causes an SSR hydration mismatch.
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to save/sync recruiter profile with backend database
  const syncProfileWithBackend = async (idToken: string, baseUser: User): Promise<User> => {
    try {
      // First, try to save the user profile to the database
      const saveRes = await apiRequest("/api/v1/recruiter/profile", {
        method: "POST",
        body: JSON.stringify({
          name: baseUser.name || baseUser.email?.split("@")[0] || "Recruiter",
          email: baseUser.email || "",
          phone: null,
          avatarUrl: baseUser.avatarUrl || null,
          designation: "Technical Recruiter",
          location: "India",
          bio: null,
          company: null,
          role: "recruiter"
        })
      });

      if (saveRes.ok) {
        const savedProfile = await saveRes.json();
        const syncedUser: User = {
          id: savedProfile.uid || baseUser.id,
          uid: savedProfile.uid || baseUser.id,
          name: savedProfile.name || savedProfile.fullName || baseUser.name,
          email: savedProfile.email || baseUser.email,
          avatarUrl: savedProfile.avatarUrl || baseUser.avatarUrl,
          role: savedProfile.role || "recruiter",
          company: savedProfile.company || savedProfile.designation || "Finder Partner",
          designation: savedProfile.designation || "Technical Recruiter",
          location: savedProfile.location || "India",
        };
        setAuthData(idToken, syncedUser);
        setUser(syncedUser);
        return syncedUser;
      } else {
        console.warn(`Backend profile save returned HTTP ${saveRes.status}`);
        // Fallback: try to fetch existing profile
        const profileRes = await apiRequest("/api/v1/recruiter/profile");
        if (profileRes.ok) {
          const profile = await profileRes.json();
          const syncedUser: User = {
            id: profile.uid || baseUser.id,
            uid: profile.uid || baseUser.id,
            name: profile.name || profile.fullName || baseUser.name,
            email: profile.email || baseUser.email,
            avatarUrl: profile.avatarUrl || baseUser.avatarUrl,
            role: profile.role || "recruiter",
            company: profile.company || profile.designation || "Finder Partner",
            designation: profile.designation || "Technical Recruiter",
            location: profile.location || "India",
          };
          setAuthData(idToken, syncedUser);
          setUser(syncedUser);
          return syncedUser;
        }
      }
    } catch (e) {
      console.error("Backend profile sync error:", e);
    }
    return baseUser;
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        // 1. Check if returning from Google redirect sign-in
        const redirectResult = await resolveGoogleRedirectResult();
        if (redirectResult && redirectResult.success && redirectResult.user && redirectResult.idToken) {
          setAuthData(redirectResult.idToken, redirectResult.user);
          setUser(redirectResult.user);
          await syncProfileWithBackend(redirectResult.idToken, redirectResult.user);
          setLoading(false);
          return;
        }

        // 2. Check stored session
        const storedUser = getUser();
        const storedToken = localStorage.getItem("token");
        if (storedUser && storedToken) {
          setUser(storedUser);
          try {
            await syncProfileWithBackend(storedToken, storedUser);
          } catch (e) {
            console.debug("Backend profile sync check skipped:", e);
          }
        }
      } catch (err) {
        console.warn("Auth initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  /**
   * Initiates Google Sign-In via popup (with fallback to redirect if popup is blocked).
   * Persists token and immediately syncs / saves the recruiter in backend DB.
   */
  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await signInWithGooglePopup();
      if (result.success && result.user && result.idToken) {
        setAuthData(result.idToken, result.user);
        setUser(result.user);
        await syncProfileWithBackend(result.idToken, result.user);
        return { success: true };
      }

      if (result.error) {
        return { success: false, error: result.error };
      }

      // If popup triggered a redirect fallback
      return { success: true };
    } catch (err: any) {
      const errorMsg = err?.code ? `${err.code}: ${err.message}` : (err?.message || String(err));
      console.error("signInWithGoogle error:", errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const signOut = async () => {
    await signOutFirebase();
    clearAuthStorage();
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
