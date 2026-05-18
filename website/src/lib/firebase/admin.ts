import "server-only";
import {
  getApps,
  initializeApp,
  cert,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

let cachedApp: App | null = null;

function loudFail(message: string): never {
  // Loud server-side error so misconfiguration is obvious in dev and in deploy logs.
  console.error(`[firebase/admin] ${message}`);
  throw new Error(`[firebase/admin] ${message}`);
}

function readPrivateKey(): string {
  const raw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!raw) {
    loudFail(
      "FIREBASE_ADMIN_PRIVATE_KEY not set. Paste the service-account private_key " +
        'value (including BEGIN/END lines) into .env.local. Escaped "\\n" newlines are fine.'
    );
  }
  // Most deployment hosts (Vercel, Render, etc.) require pasting the private key
  // as a single-line string with escaped \n sequences. Convert back to real newlines.
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

function initAdminApp(): App {
  if (cachedApp) return cachedApp;
  const existing = getApps();
  if (existing.length > 0) {
    cachedApp = existing[0]!;
    return cachedApp;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!projectId) loudFail("FIREBASE_ADMIN_PROJECT_ID not set in .env.local");
  if (!clientEmail) loudFail("FIREBASE_ADMIN_CLIENT_EMAIL not set in .env.local");
  const privateKey = readPrivateKey();

  const serviceAccount: ServiceAccount = {
    projectId,
    clientEmail,
    privateKey,
  };

  cachedApp = initializeApp({
    credential: cert(serviceAccount),
    projectId,
    storageBucket,
  });
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
