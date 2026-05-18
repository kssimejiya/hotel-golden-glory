/**
 * Firebase Web SDK — browser/client init.
 * Server code MUST NOT import this. Use ./admin.ts on the server.
 *
 * Singleton: re-using the same FirebaseApp instance avoids the "already
 * exists" error on hot-reload during dev.
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const RAW_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

type ConfigKey = keyof typeof RAW_CONFIG;
type ValidatedConfig = { [K in ConfigKey]: string };

const ENV_NAME: Record<ConfigKey, string> = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
};

function validateConfig(): ValidatedConfig {
  const missing = (Object.keys(RAW_CONFIG) as ConfigKey[]).filter(
    (k) => !RAW_CONFIG[k]
  );
  if (missing.length > 0) {
    const list = missing.map((k) => ENV_NAME[k]).join(", ");
    // Loud failure — surface in browser console too so misconfiguration is obvious.
    console.error(`[firebase/client] Missing required env vars: ${list}`);
    throw new Error(
      `[firebase/client] Missing required env vars: ${list}. ` +
        `Copy .env.local.example to .env.local and fill in the Firebase web config.`
    );
  }
  return RAW_CONFIG as ValidatedConfig;
}

function getClientApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();
  return initializeApp(validateConfig());
}

export function clientAuth(): Auth {
  return getAuth(getClientApp());
}

export function clientDb(): Firestore {
  return getFirestore(getClientApp());
}

export function clientStorage(): FirebaseStorage {
  return getStorage(getClientApp());
}
