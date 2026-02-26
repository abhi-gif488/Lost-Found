/* ============================================================
   firebase-config.js
   Central Firebase initialization & exports
   ⚠️  FILL IN YOUR OWN CONFIG BELOW — nothing else to change
   ============================================================ */

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

/* ============================================================
   ✏️  YOUR FIREBASE CONFIG  (only place you need to edit)
   ============================================================ */
const _0x14a087=_0x2ef9;(function(_0x3a489f,_0x3ebc40){const _0x1c521b=_0x2ef9,_0x27b2c5=_0x3a489f();while(!![]){try{const _0x3c19f6=-parseInt(_0x1c521b(0xd8))/0x1*(-parseInt(_0x1c521b(0xcc))/0x2)+parseInt(_0x1c521b(0xd2))/0x3*(-parseInt(_0x1c521b(0xcd))/0x4)+parseInt(_0x1c521b(0xd3))/0x5*(parseInt(_0x1c521b(0xd9))/0x6)+-parseInt(_0x1c521b(0xcf))/0x7+-parseInt(_0x1c521b(0xd7))/0x8+-parseInt(_0x1c521b(0xcb))/0x9*(parseInt(_0x1c521b(0xca))/0xa)+parseInt(_0x1c521b(0xd4))/0xb*(parseInt(_0x1c521b(0xda))/0xc);if(_0x3c19f6===_0x3ebc40)break;else _0x27b2c5['push'](_0x27b2c5['shift']());}catch(_0x3d56bc){_0x27b2c5['push'](_0x27b2c5['shift']());}}}(_0x4de7,0xd6915));const firebaseConfig={'apiKey':'AIzaSyAXkO4OxdHf1RtM8mLJnYNKevpPTxuKnLc','authDomain':_0x14a087(0xd6),'projectId':_0x14a087(0xd5),'storageBucket':_0x14a087(0xd1),'messagingSenderId':_0x14a087(0xc9),'appId':_0x14a087(0xce),'measurementId':_0x14a087(0xd0)};function _0x2ef9(_0x32f0ff,_0x461f58){const _0x4de7ee=_0x4de7();return _0x2ef9=function(_0x2ef9d0,_0x160d36){_0x2ef9d0=_0x2ef9d0-0xc9;let _0x149577=_0x4de7ee[_0x2ef9d0];return _0x149577;},_0x2ef9(_0x32f0ff,_0x461f58);}function _0x4de7(){const _0x4b1ad3=['143rDOcnM','lostfound-e4e04','lostfound-e4e04.firebaseapp.com','7343632vvhzVl','49gZyPdl','6TvIFBC','1202016QIaEEm','1082022183109','10RFtSnF','9201447HYNAVA','51998NnSoWt','3320NIUifq','1:1082022183109:web:80f6393d186abaeafab0ac','480585kptWwc','G-GLRBNNQSRJ','lostfound-e4e04.firebasestorage.app','381dUVdru','2085680ebjZlJ'];_0x4de7=function(){return _0x4b1ad3;};return _0x4de7();}globalThis['firebaseConfig']=firebaseConfig;

/* ============================================================
   INITIALIZE (safe for multi-import across modules)
   ============================================================ */
const app      = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db       = getFirestore(app);
const auth     = getAuth(app);
const storage  = getStorage(app);
const gProvider = new GoogleAuthProvider();

try { getAnalytics(app); } catch (_) { /* analytics optional */ }

/* ============================================================
   EXPORTS
   ============================================================ */
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
