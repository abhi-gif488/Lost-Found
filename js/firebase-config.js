/* ============================================================
   js/firebase-config.js
   Initialises Firebase using credentials from firebase-env.js
   ──────────────────────────────────────────────────────────
   ⚠️  Do NOT paste your API keys here.
       Put them in js/firebase-env.js (which is in .gitignore).
   ============================================================ */

import firebaseConfig from "./firebase-env.js";

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics }           from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

/* Initialise once — guard against HMR / double-load */
const app       = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db        = getFirestore(app);
const auth      = getAuth(app);
const storage   = getStorage(app);
const gProvider = new GoogleAuthProvider();

try { getAnalytics(app); } catch (_) { /* analytics optional */ }

export {
  app, auth, db, storage, gProvider,
  /* auth helpers */
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updateProfile,
  /* firestore helpers */
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  /* storage helpers */
  storageRef,
  uploadBytes,
  getDownloadURL
};
