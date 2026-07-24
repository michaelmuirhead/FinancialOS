import { FirebaseApp, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";
import { Functions, getFunctions } from "firebase/functions";

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
};

/**
 * These three env vars are what flip the app out of demo mode. They must be
 * present in the build environment (Vite inlines VITE_* at build time), so a
 * missing one usually means the host's env vars weren't set before building.
 */
const REQUIRED_ENV_VARS: Record<string, string | undefined> = {
  VITE_FIREBASE_API_KEY: firebaseConfig.apiKey,
  VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  VITE_FIREBASE_APP_ID: firebaseConfig.appId,
};

/** Names of the required env vars absent from this build, for diagnostics. */
export const missingFirebaseVars = Object.entries(REQUIRED_ENV_VARS)
  .filter(([, value]) => !value)
  .map(([name]) => name);

/**
 * When Firebase env vars are not configured the app runs in demo mode
 * against a local sample dataset, so the interface is fully explorable
 * before the backend is provisioned.
 */
export const isDemoMode = missingFirebaseVars.length > 0;

let app: FirebaseApp | null = null;
if (!isDemoMode) {
  app = initializeApp(firebaseConfig);
}

export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;
export const storage: FirebaseStorage | null = app ? getStorage(app) : null;
export const functions: Functions | null = app ? getFunctions(app) : null;
