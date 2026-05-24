import "server-only";
import {
  getApps,
  initializeApp,
  applicationDefault,
  cert,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

let cachedApp: App | null = null;

function loudFail(message: string): never {
  console.error(`[firebase/admin] ${message}`);
  throw new Error(`[firebase/admin] ${message}`);
}

function initAdminApp(): App {
  if (cachedApp) return cachedApp;
  const existing = getApps();
  if (existing.length > 0) {
    cachedApp = existing[0]!;
    return cachedApp;
  }

  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (privateKey) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    if (!projectId) loudFail("FIREBASE_ADMIN_PROJECT_ID not set");
    if (!clientEmail) loudFail("FIREBASE_ADMIN_CLIENT_EMAIL not set");

    const key = privateKey.includes("\\n")
      ? privateKey.replace(/\\n/g, "\n")
      : privateKey;

    const serviceAccount: ServiceAccount = { projectId, clientEmail, privateKey: key };
    cachedApp = initializeApp({
      credential: cert(serviceAccount),
      projectId,
      storageBucket,
    });
  } else {
    // Firebase App Hosting provides Application Default Credentials automatically
    cachedApp = initializeApp({
      credential: applicationDefault(),
      storageBucket,
    });
  }

  return cachedApp;
}

export function adminAuth(): Auth {
  return getAuth(initAdminApp());
}

export function adminDb(): Firestore {
  return getFirestore(initAdminApp());
}

export function adminStorage(): Storage {
  return getStorage(initAdminApp());
}

export function adminBucket() {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucket) {
    loudFail("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET not set in .env.local");
  }
  return adminStorage().bucket(bucket);
}
