import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDnmJi-PqqZMNWGwrrERRxc-QXaiFltg6U",
  authDomain: "zenciadashboard.firebaseapp.com",
  projectId: "zenciadashboard",
  storageBucket: "zenciadashboard.appspot.com",
  messagingSenderId: "809632075756",
  appId: "1:809632075756:web:b6398f07d30c6333cefac9",
  measurementId: "G-1VP1RH6P78",
};

// Initialize Firebase - only initialize if not already initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence with a finite cache size
try {
  enableIndexedDbPersistence(db, {
    cacheSizeBytes: 100 * 1024 * 1024, // 100 MB
  }).catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn("Persistence failed: Multiple tabs open");
    } else if (err.code === "unimplemented") {
      console.warn("Persistence not supported, falling back to memory cache");
      db.settings({ cache: { type: "memory" } });
    } else {
      console.error("Error enabling persistence:", err);
    }
  });
} catch (error) {
  console.warn("Could not enable persistence:", error);
}

// Detect multiple tabs to prevent persistence conflicts
const channel = new BroadcastChannel("firebase_persistence");
channel.onmessage = (event) => {
  if (event.data === "persistence_enabled") {
    console.warn("Persistence already enabled in another tab");
  }
};
channel.postMessage("persistence_enabled");

console.log("Firebase initialized from firebaseConfig.js");

// Export the initialized instances
export { app, auth, db, storage, firebaseConfig };