import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';

// Configuration with hardcoded fallback to ensure 100% reliability on Vercel and all devices
const firebaseConfig = {
  projectId: firebaseConfigJson.projectId || "dotted-bit-9xctm",
  appId: firebaseConfigJson.appId || "1:410330996618:web:334e7d3d0f16e96667b273",
  apiKey: firebaseConfigJson.apiKey || "AIzaSyD1-kTZxQjuktaIIP04uGSnbkc6XK0TAVc",
  authDomain: firebaseConfigJson.authDomain || "dotted-bit-9xctm.firebaseapp.com",
  firestoreDatabaseId: firebaseConfigJson.firestoreDatabaseId || "ai-studio-cinestreamverpel-f7e3b956-b355-43b4-919c-2031a62a6675",
  storageBucket: firebaseConfigJson.storageBucket || "dotted-bit-9xctm.firebasestorage.app",
  messagingSenderId: firebaseConfigJson.messagingSenderId || "410330996618",
};

// Initialize or reuse Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Cloud Firestore connecting strictly to the provisioned database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

