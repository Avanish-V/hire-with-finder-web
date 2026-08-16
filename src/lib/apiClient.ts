import { supabase } from "./supabaseClient";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://127.0.0.1:8787" : "https://recrutment-backend-avanish.onrender.com");

export interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  company?: string;
  [key: string]: unknown;
}

/**
 * Get the auth token from localStorage
 */
export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

/**
 * Get the current user from localStorage
 */
export const getUser = (): User | null => {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
};

/**
 * Store user and token
 */
export const setAuthData = (token: string, user: User) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  }
};

/**
 * Clear all auth-related storage
 */
export const clearAuthStorage = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("sb-auth-token");
    sessionStorage.clear();
  }
};

/**
 * Build request URL pointing directly to backend
 */
function buildUrl(endpoint: string): string {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const base = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  return `${base}${cleanEndpoint}`;
}

/**
 * Make an authenticated API request directly to backend
 */
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> => {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["x-auth-token"] = token;
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = buildUrl(endpoint);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If 401 Unauthorized, clear auth storage and redirect to /auth
    if (response.status === 401 && typeof window !== "undefined") {
      const isAuthRoute =
        endpoint.includes("/auth/login") ||
        endpoint.includes("/auth/register") ||
        endpoint.includes("/auth/supabase-session");

      if (!isAuthRoute && !window.location.pathname.startsWith("/auth")) {
        clearAuthStorage();
        window.location.href = "/auth";
      }
    }

    return response;
  } catch (networkError) {
    // Return synthetic response so service layer gracefully uses static fallback
    return new Response(
      JSON.stringify({
        msg: "Backend service unreachable, using fallback",
        error: String(networkError),
      }),
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

/**
 * Exchange Supabase session for backend JWT token
 */
export const exchangeSupabaseSession = async (accessToken: string) => {
  try {
    const response = await apiRequest("/api/auth/supabase-session", {
      method: "POST",
      body: JSON.stringify({
        access_token: accessToken,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.token) {
        setAuthData(data.token, data.user || {});
        return { success: true, user: data.user, token: data.token };
      }
    }

    // Fallback: If backend is not running or doesn't have supabase-session route,
    // generate a local session object from Supabase user data
    const {
      data: { user },
    } = await supabase.auth.getUser(accessToken);
    if (user) {
      const localUser: User = {
        id: user.id,
        name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "User",
        email: user.email || "",
        role: "recruiter",
      };
      setAuthData(accessToken, localUser);
      return { success: true, user: localUser, token: accessToken };
    }

    return { success: false, msg: "Authentication failed" };
  } catch {
    // If backend is unreachable, fallback to Supabase session directly
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser(accessToken);
      if (user) {
        const localUser: User = {
          id: user.id,
          name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "User",
          email: user.email || "",
          role: "recruiter",
        };
        setAuthData(accessToken, localUser);
        return { success: true, user: localUser, token: accessToken };
      }
    } catch (e) {
      console.warn("Fallback auth check failed:", e);
    }
    return { success: false, msg: "Backend service unavailable" };
  }
};
