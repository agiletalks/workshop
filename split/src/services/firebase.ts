import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBRVKNOnj3DB4QY9IgCBzC4JcG09XNKVhQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "marshmallow-agile-3b4b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "marshmallow-agile-3b4b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "marshmallow-agile-3b4b.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "85151952712",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:85151952712:web:9399da5bfad4f88b0ecd7d"
};

let dbInstance: Firestore | null = null;

try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  dbInstance = getFirestore(app);
} catch (error) {
  console.error('[SPLIT] Failed to initialize Firebase:', error);
}

export const db = dbInstance;
