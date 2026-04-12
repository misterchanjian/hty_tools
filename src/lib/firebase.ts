// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration (now using environment variables for security)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Only initialize Firebase when a valid API key is present.
// This allows the app to build/deploy without Firebase env vars.
const hasFirebaseConfig = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

const app = hasFirebaseConfig
  ? (!getApps().length ? initializeApp(firebaseConfig) : getApp())
  : null;

const auth = app ? getAuth(app) : null;
const storage = app ? getStorage(app) : null;
const db = app
  ? (typeof window === "undefined"
      ? getFirestore(app)
      : (() => {
          try {
            return initializeFirestore(app, {
              localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager(),
              }),
            });
          } catch {
            return getFirestore(app);
          }
        })())
  : null;

export { app, auth, db, storage };
