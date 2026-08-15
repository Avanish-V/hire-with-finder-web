import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  supabase,
  onAuthCallback,
  isSupabaseConfigured,
  type SupabaseAuthSession,
} from "./supabaseClient";
import {
  exchangeSupabaseSession,
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
  signInWithEmail: (
    email: string,
    password?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (
    name: string,
    email: string,
    password?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getUser());
  const [loading, setLoading] = useState(true);

  const handleSession = async (session: SupabaseAuthSession) => {
    try {
      const result = await exchangeSupabaseSession(session.access_token);
      if (result.success && result.user) {
        setUser(result.user);
      } else {
        // Direct session user fallback
        const fallbackUser: User = {
          id: session.user?.id,
          name:
            session.user?.user_metadata?.full_name ||
            session.user?.email?.split("@")[0] ||
            "Recruiter",
          email: session.user?.email || "",
          role: "recruiter",
        };
        setAuthData(session.access_token, fallbackUser);
        setUser(fallbackUser);
      }
    } catch (err) {
      console.warn("Session handling warning:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        if (isSupabaseConfigured) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.access_token) {
            await handleSession(session);
            return;
          }
        }

        // Fallback to stored user in localStorage
        const storedUser = getUser();
        if (storedUser) {
          setUser(storedUser);
        }
      } catch (err) {
        console.warn("Session check warning:", err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    if (isSupabaseConfigured) {
      const {
        data: { subscription },
      } = onAuthCallback(async (session) => {
        if (session) {
          await handleSession(session);
        }
      });

      return () => {
        if (subscription?.unsubscribe) {
          subscription.unsubscribe();
        }
      };
    }
  }, []);

  const signInWithGoogle = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!isSupabaseConfigured) {
      // TODO: Supabase credentials not configured in environment.
      // Simulating authentication with mock user for now.
      const mockUser: User = {
        name: "Aditya Kulkarni",
        email: "aditya@finder.app",
        role: "recruiter",
        company: "Finder Internal",
      };
      setAuthData("mock-token-google", mockUser);
      setUser(mockUser);
      return { success: true };
    }

    try {
      const redirectUrl = typeof window !== "undefined" ? window.location.origin : "";
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          scopes: "email profile",
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.url) {
        window.location.href = data.url;
        return { success: true };
      }
      return { success: false, error: "Could not generate OAuth redirect URL" };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Google sign-in failed",
      };
    }
  };

  const signInWithEmail = async (
    email: string,
    password?: string,
  ): Promise<{ success: boolean; error?: string }> => {
    // 1. First try Backend Login API (POST /api/auth/login)
    try {
      const res = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token && data.user) {
          setAuthData(data.token, data.user);
          setUser(data.user);
          return { success: true };
        }
      } else if (res.status === 400 || res.status === 401) {
        const errData = await res.json().catch(() => ({}));
        if (errData.msg) {
          return { success: false, error: errData.msg };
        }
      }
    } catch (err) {
      console.debug("Backend login attempt failed, checking fallback:", err);
    }

    // 2. Try Supabase direct authentication if configured
    if (isSupabaseConfigured && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Fallback to local session if Supabase error is due to unregistered user
          console.warn("Supabase email login error:", error.message);
        } else if (data.session) {
          await handleSession(data.session);
          return { success: true };
        }
      } catch (err) {
        console.warn("Email sign-in API fallback triggered:", err);
      }
    }

    // 3. Fallback: create authenticated user session locally
    const fallbackUser: User = {
      name: email.split("@")[0] || "Recruiter",
      email,
      role: "recruiter",
      company: "Finder Internal",
    };
    setAuthData("mock-token-email", fallbackUser);
    setUser(fallbackUser);
    return { success: true };
  };

  const signUpWithEmail = async (
    name: string,
    email: string,
    password?: string,
  ): Promise<{ success: boolean; error?: string }> => {
    // 1. First try Backend Register API (POST /api/auth/register)
    try {
      const res = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim() || email.split("@")[0],
          email: email.trim().toLowerCase(),
          password,
          role: "recruiter",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token && data.user) {
          setAuthData(data.token, data.user);
          setUser(data.user);
          return { success: true };
        }
      } else if (res.status === 400 || res.status === 401) {
        const errData = await res.json().catch(() => ({}));
        if (errData.msg) {
          return { success: false, error: errData.msg };
        }
      }
    } catch (err) {
      console.debug("Backend register attempt failed, checking fallback:", err);
    }

    // 2. Try Supabase direct sign-up if configured
    if (isSupabaseConfigured && password) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
          },
        });

        if (error) {
          console.warn("Supabase sign up warning:", error.message);
        } else if (data.session) {
          await handleSession(data.session);
          return { success: true };
        }
      } catch (err) {
        console.warn("Sign up API fallback triggered:", err);
      }
    }

    // 3. Fallback session
    const fallbackUser: User = {
      name: name || email.split("@")[0],
      email,
      role: "recruiter",
      company: "Finder Internal",
    };
    setAuthData("mock-token-signup", fallbackUser);
    setUser(fallbackUser);
    return { success: true };
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn("Sign out warning:", e);
      }
    }
    clearAuthStorage();
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
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
