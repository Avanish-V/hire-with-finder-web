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
  const [user, setUser] = useState<User | null>(() => getUser());
  const [loading, setLoading] = useState(true);

  // Helper to sync recruiter profile with backend and update local user state
  const syncProfileWithBackend = async (idToken: string, baseUser: User): Promise<User> => {
    try {
      const profileRes = await apiRequest("/api/v1/recruiter/profile");
      if (profileRes.ok) {
        const profile = await profileRes.json();
        const syncedUser: User = {
          id: baseUser.id,
          name: profile.name || baseUser.name,
          email: baseUser.email,
          avatarUrl: profile.avatarUrl || baseUser.avatarUrl,
          role: baseUser.role || "recruiter",
          company: profile.company || "Finder Partner",
          designation: profile.designation || "Technical Recruiter",
          location: profile.location || "Bengaluru, India",
        };
        setAuthData(idToken, syncedUser);
        setUser(syncedUser);
        return syncedUser;
      } else {
        console.warn(`Backend profile sync returned HTTP ${profileRes.status}`);
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
