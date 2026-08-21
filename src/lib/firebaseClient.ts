import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isBrowser = typeof window !== "undefined";
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export type GoogleSignInResult = {
  success: boolean;
  idToken?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    role: string;
  };
  error?: string;
};

/**
 * Initiates Google Sign-In via popup modal.
 */
export async function signInWithGooglePopup(): Promise<GoogleSignInResult> {
  if (!isBrowser) {
    return { success: false, error: "Not running in browser" };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    const idToken = await firebaseUser.getIdToken(true);

    return {
      success: true,
      idToken,
      user: {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Recruiter",
        email: firebaseUser.email || "",
        avatarUrl: firebaseUser.photoURL || undefined,
        role: "recruiter",
      },
    };
  } catch (error: any) {
    const errorCode: string = error?.code || "";
    const errorMsg: string = error?.message || String(error);
    if (
      errorCode === "auth/popup-closed-by-user" ||
      errorCode === "auth/cancelled-popup-request" ||
      errorCode === "auth/user-cancelled"
    ) {
      return { success: false, error: "Sign-in was cancelled." };
    }
    console.error("Firebase signInWithPopup error:", errorCode, errorMsg);
    return { success: false, error: `${errorCode}: ${errorMsg}` };
  }
}

/**
 * Initiates Google Sign-In via full-page redirect.
 */
export async function signInWithGoogleRedirect(): Promise<void> {
  if (!isBrowser) return;
  await signInWithRedirect(auth, googleProvider);
}

/**
 * Resolves the pending redirect result after Google returns the user.
 * Returns null if there is no pending redirect or if called on the server.
 */
export async function resolveGoogleRedirectResult(): Promise<GoogleSignInResult | null> {
  if (!isBrowser) return null;

  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;

    const firebaseUser = result.user;
    const idToken = await firebaseUser.getIdToken(true);

    return {
      success: true,
      idToken,
      user: {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Recruiter",
        email: firebaseUser.email || "",
        avatarUrl: firebaseUser.photoURL || undefined,
        role: "recruiter",
      },
    };
  } catch (error: any) {
    const errorCode: string = error?.code || "";
    const errorMsg: string = error?.message || String(error);
    if (
      errorCode === "auth/redirect-cancelled-by-user" ||
      errorCode === "auth/user-cancelled"
    ) {
      return null;
    }
    console.error("Firebase getRedirectResult error:", errorCode, errorMsg);
    return { success: false, error: `${errorCode}: ${errorMsg}` };
  }
}

export async function signOutFirebase() {
  if (!isBrowser) return;
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    console.warn("Firebase sign out error:", e);
  }
}
