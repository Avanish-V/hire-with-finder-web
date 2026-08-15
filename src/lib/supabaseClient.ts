/**
 * Clean Supabase client abstraction using native fetch and standard Auth API
 * Works both with and without the optional @supabase/supabase-js package
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, string>;
  [key: string]: unknown;
}

export interface SupabaseAuthSession {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  user: SupabaseUser;
}

class SupabaseAuth {
  private storageKey = "sb-auth-token";

  async getSession(): Promise<{
    data: { session: SupabaseAuthSession | null };
    error: Error | null;
  }> {
    if (typeof window === "undefined") {
      return { data: { session: null }, error: null };
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { data: { session: parsed }, error: null };
      }
    } catch {
      // Ignore parse error
    }

    return { data: { session: null }, error: null };
  }

  async getUser(
    accessToken?: string,
  ): Promise<{ data: { user: SupabaseUser | null }; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return {
        data: { user: null },
        error: new Error("Supabase not configured"),
      };
    }

    const token = accessToken || (await this.getSession()).data.session?.access_token;
    if (!token) {
      return { data: { user: null }, error: new Error("No access token") };
    }

    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const user = (await res.json()) as SupabaseUser;
        return { data: { user }, error: null };
      }
    } catch (err: unknown) {
      return {
        data: { user: null },
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }

    return { data: { user: null }, error: new Error("Failed to fetch user") };
  }

  async signInWithOAuth({
    provider,
    options,
  }: {
    provider: string;
    options?: {
      redirectTo?: string;
      queryParams?: Record<string, string>;
      scopes?: string;
    };
  }): Promise<{ data: { url: string | null }; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return {
        data: { url: null },
        error: new Error("Supabase URL or Anon Key is missing"),
      };
    }

    const params = new URLSearchParams({
      provider,
      redirect_to:
        options?.redirectTo || (typeof window !== "undefined" ? window.location.origin : ""),
      ...(options?.scopes ? { scopes: options.scopes } : {}),
      ...(options?.queryParams || {}),
    });

    const url = `${supabaseUrl}/auth/v1/authorize?${params.toString()}`;
    return { data: { url }, error: null };
  }

  async signInWithPassword({ email, password }: { email: string; password?: string }): Promise<{
    data: { session: SupabaseAuthSession | null; user: SupabaseUser | null };
    error: Error | null;
  }> {
    if (!isSupabaseConfigured) {
      return {
        data: { session: null, user: null },
        error: new Error("Supabase not configured"),
      };
    }

    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const json = (await res.json()) as Record<string, unknown>;
      if (res.ok && json.access_token) {
        const session: SupabaseAuthSession = {
          access_token: String(json.access_token),
          refresh_token: json.refresh_token ? String(json.refresh_token) : undefined,
          expires_in: Number(json.expires_in) || 3600,
          user: json.user as SupabaseUser,
        };
        if (typeof window !== "undefined") {
          localStorage.setItem(this.storageKey, JSON.stringify(session));
        }
        return { data: { session, user: session.user }, error: null };
      }
      return {
        data: { session: null, user: null },
        error: new Error(
          String(json.error_description || json.msg || json.message || "Sign in failed"),
        ),
      };
    } catch (err: unknown) {
      return {
        data: { session: null, user: null },
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  }

  async signUp({
    email,
    password,
    options,
  }: {
    email: string;
    password?: string;
    options?: { data?: Record<string, string> };
  }): Promise<{
    data: { session: SupabaseAuthSession | null; user: SupabaseUser | null };
    error: Error | null;
  }> {
    if (!isSupabaseConfigured) {
      return {
        data: { session: null, user: null },
        error: new Error("Supabase not configured"),
      };
    }

    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          data: options?.data || {},
        }),
      });

      const json = (await res.json()) as Record<string, unknown>;
      if (res.ok) {
        const session: SupabaseAuthSession | null = json.access_token
          ? {
              access_token: String(json.access_token),
              refresh_token: json.refresh_token ? String(json.refresh_token) : undefined,
              expires_in: Number(json.expires_in) || 3600,
              user: json.user as SupabaseUser,
            }
          : null;
        if (session && typeof window !== "undefined") {
          localStorage.setItem(this.storageKey, JSON.stringify(session));
        }
        return {
          data: { session, user: (json.user as SupabaseUser) || null },
          error: null,
        };
      }
      return {
        data: { session: null, user: null },
        error: new Error(
          String(json.error_description || json.msg || json.message || "Sign up failed"),
        ),
      };
    } catch (err: unknown) {
      return {
        data: { session: null, user: null },
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.storageKey);
    }
    return { error: null };
  }

  onAuthStateChange(callback: (event: string, session: SupabaseAuthSession | null) => void) {
    if (typeof window !== "undefined") {
      const handleStorage = (e: StorageEvent) => {
        if (e.key === this.storageKey) {
          try {
            const session = e.newValue ? JSON.parse(e.newValue) : null;
            callback(session ? "SIGNED_IN" : "SIGNED_OUT", session);
          } catch {
            callback("SIGNED_OUT", null);
          }
        }
      };

      window.addEventListener("storage", handleStorage);
      return {
        data: {
          subscription: {
            unsubscribe: () => window.removeEventListener("storage", handleStorage),
          },
        },
      };
    }

    return {
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    };
  }
}

export const supabase = {
  auth: new SupabaseAuth(),
};

export const onAuthCallback = (callback: (session: SupabaseAuthSession | null) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session?.access_token) {
      callback(session);
    }
  });
};
