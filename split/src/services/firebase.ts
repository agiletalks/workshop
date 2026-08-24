import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

// Read Firebase configurations from env variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBRVKNOnj3DB4QY9IgCBzC4JcG09XNKVhQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "marshmallow-agile-3b4b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "marshmallow-agile-3b4b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "marshmallow-agile-3b4b.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "85151952712",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:85151952712:web:9399da5bfad4f88b0ecd7d"
};

// Check if all necessary configuration keys are provided
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.authDomain
);

let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    dbInstance = getFirestore(app);
    console.log("Firebase initialized successfully in split project.");
  } catch (error) {
    console.error("Failed to initialize Firebase in split project:", error);
  }
} else {
  console.log("Firebase credentials not found for split project. Running in Local Mock Mode.");
}

export const db = dbInstance;
