/**
 * Shared firebase-admin bootstrap for tsx scripts.
 * Uses the same FIREBASE_ADMIN_* env vars as src/lib/firebase/admin.ts so
 * scripts and the Next.js runtime stay in sync.
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getStorage, type Storage } from "firebase-admin/storage";

config({ path: resolve(process.cwd(), ".env.local") });

function readPrivateKey(): string {
  const raw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!raw) {
    throw new Error(
      "FIREBASE_ADMIN_PRIVATE_KEY missing in .env.local — see .env.local.example"
    );
  }
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

let cached: App | null = null;
function init(): App {
  if (cached) return cached;
  if (getApps().length > 0) {
    cached = getApps()[0]!;
    return cached;
  }
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!projectId || !clientEmail) {
    throw new Error(
      "Missing FIREBASE_ADMIN_PROJECT_ID or FIREBASE_ADMIN_CLIENT_EMAIL in .env.local"
    );
  }
  cached = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey: readPrivateKey() }),
    projectId,
    storageBucket,
  });
  return cached;
}

export const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID ?? "";
export const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "";

export function db(): Firestore {
  return getFirestore(init());
}

export function auth(): Auth {
  return getAuth(init());
}

export function storage(): Storage {
  return getStorage(init());
}
