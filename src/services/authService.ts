import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { demoCategories } from "@/data/demoData";

export function subscribeToAuth(
  callback: (user: User | null) => void,
): () => void {
  if (!auth) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle(): Promise<void> {
  if (!auth) throw new Error("Firebase is not configured");
  await signInWithPopup(auth, new GoogleAuthProvider());
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<void> {
  if (!auth) throw new Error("Firebase is not configured");
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<void> {
  if (!auth) throw new Error("Firebase is not configured");
  await createUserWithEmailAndPassword(auth, email, password);
}

export async function signOutUser(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

let cachedHouseholdId: string | null = null;

export function clearHouseholdCache(): void {
  cachedHouseholdId = null;
}

/**
 * Resolves the signed-in user's household, creating one on first sign-in:
 * the household doc (with ownerUid for the security-rule bootstrap), the
 * member doc, the user→household pointer, and the default category set.
 */
export async function currentHouseholdId(): Promise<string> {
  if (cachedHouseholdId) return cachedHouseholdId;
  if (!auth?.currentUser || !db) {
    throw new Error("Not signed in");
  }
  const uid = auth.currentUser.uid;

  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  const existing = userSnap.exists()
    ? (userSnap.data().householdId as string | undefined)
    : undefined;
  if (existing) {
    cachedHouseholdId = existing;
    return existing;
  }

  const householdRef = doc(collection(db, "households"));
  const batch = writeBatch(db);
  batch.set(householdRef, {
    name: "Our Household",
    currency: "USD",
    timezone: "America/Chicago",
    ownerUid: uid,
    createdAt: new Date().toISOString(),
  });
  batch.set(doc(db, "households", householdRef.id, "members", uid), {
    role: "owner",
    email: auth.currentUser.email ?? null,
  });
  batch.set(userRef, { householdId: householdRef.id });
  for (const category of demoCategories) {
    batch.set(
      doc(db, "households", householdRef.id, "categories", category.id),
      {
        name: category.name,
        kind: category.kind,
        ...(category.monthlyTarget != null
          ? { monthlyTarget: category.monthlyTarget }
          : {}),
      },
    );
  }
  await batch.commit();
  cachedHouseholdId = householdRef.id;
  return householdRef.id;
}
