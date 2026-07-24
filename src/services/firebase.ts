import { FirebaseApp, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";
import { Functions, getFunctions } from "firebase/functions";

const env = import.meta.env;

/**
 * Firebase web config identifies the project and is meant to ship publicly
 * in the browser bundle — access is enforced by the Firestore/Storage
 * security rules and Auth, not by keeping these values secret. Baking them
 * in as defaults lets any deploy (Vercel, Firebase Hosting, anywhere)
 * connect without host-level env-var configuration. Set the matching
 * VITE_FIREBASE_* env var to point a build at a different project.
 */
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBt5f9KROi-duz7xq9fotE88Ui5eL9tlmo",
  authDomain: "homevault-ee378.firebaseapp.com",
  projectId: "homevault-ee378",
  storageBucket: "homevault-ee378.firebasestorage.app",
  appId: "1:698284406994:web:578b07fbb9425f8e43150b",
};

function envOr(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

const firebaseConfig = {
  apiKey: envOr(env.VITE_FIREBASE_API_KEY, DEFAULT_FIREBASE_CONFIG.apiKey),
  authDomain: envOr(
    env.VITE_FIREBASE_AUTH_DOMAIN,
    DEFAULT_FIREBASE_CONFIG.authDomain,
  ),
  projectId: envOr(
    env.VITE_FIREBASE_PROJECT_ID,
    DEFAULT_FIREBASE_CONFIG.projectId,
  ),
  storageBucket: envOr(
    env.VITE_FIREBASE_STORAGE_BUCKET,
    DEFAULT_FIREBASE_CONFIG.storageBucket,
  ),
  appId: envOr(env.VITE_FIREBASE_APP_ID, DEFAULT_FIREBASE_CONFIG.appId),
};

/** Retained for diagnostics; empty now that config is baked in. */
export const missingFirebaseVars: string[] = [];

/**
 * The app connects to Firebase by default. Set VITE_DEMO_MODE=true to run
 * against the local sample dataset instead (useful for demos and testing
 * without touching live data).
 */
export const isDemoMode = env.VITE_DEMO_MODE === "true";

let app: FirebaseApp | null = null;
if (!isDemoMode) {
  app = initializeApp(firebaseConfig);
}

export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;
export const storage: FirebaseStorage | null = app ? getStorage(app) : null;
export const functions: Functions | null = app ? getFunctions(app) : null;
