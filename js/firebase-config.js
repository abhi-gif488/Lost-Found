//  Central Firebase initialization & exports


import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics }           from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
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

//hehe don't be oversmart -If i get you I'll ****!

const firebaseConfig = {
  apiKey: "AIzaSyAXkO4OxdHf1RtM8mLJnYNKevpPTxuKnLc",
  authDomain: "lostfound-e4e04.firebaseapp.com",
  projectId: "lostfound-e4e04",
  storageBucket: "lostfound-e4e04.firebasestorage.app",
  messagingSenderId: "1082022183109",
  appId: "1:1082022183109:web:80f6393d186abaeafab0ac",
  measurementId: "G-GLRBNNQSRJ"  // optional
};

const app      = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db       = getFirestore(app);
const auth     = getAuth(app);
const storage  = getStorage(app);
const gProvider = new GoogleAuthProvider();

try { getAnalytics(app); } catch (_) { /* analytics optional */ }


export {
  app, auth, db, storage, gProvider,
  /* auth helpers */
  signInWithPopup, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile,
  /* firestore helpers */
  collection, addDoc, getDocs, query, orderBy, where, serverTimestamp,
  /* storage helpers */
  storageRef, uploadBytes, getDownloadURL
};
