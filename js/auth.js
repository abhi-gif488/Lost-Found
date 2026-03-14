/* js/auth.js
   Authentication helpers, toast notifications, navbar updates
  */

import {
  auth, gProvider, db, collection, getDocs, query, orderBy,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "./firebase-config.js";

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 */
export function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const toast  = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon" aria-hidden="true">${icons[type] || icons.info}</span>
                     <span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("show"));
  });

  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 4200);
}

/* 
   GMAIL VALIDATION
  */

/**
 * Returns true only if the email is a valid @gmail.com address.
 * @param {string} email
 * @returns {boolean}
 */
export function isGmailAddress(email) {
  return /^[a-zA-Z0-9._%+\-]+@gmail\.com$/i.test((email || "").trim());
}

/* 
   FIREBASE AUTH FUNCTIONS
  */

export const signInWithGoogle = () => signInWithPopup(auth, gProvider);

/**
 * Register a new user.
 * Enforces @gmail.com, creates account, updates profile,
 * sends verification email, then signs the user OUT so they
 * cannot access the app until they confirm their address.
 */
export const registerWithEmail = async (email, password, name) => {
  /* ── Gmail-only guard ── */
  if (!isGmailAddress(email)) {
    const err = new Error("Only Gmail addresses are allowed.");
    err.code  = "auth/gmail-only";
    throw err;
  }

  const cred = await createUserWithEmailAndPassword(auth, email, password);

  /* Set display name */
  await updateProfile(cred.user, { displayName: name });

  /* Send verification email (works once real Firebase creds are set) */
  try {
    await sendEmailVerification(cred.user);
  } catch (verErr) {
    console.warn("[auth] sendEmailVerification failed:", verErr.message);
  }

  /* Sign the user out immediately — they must verify email first */
  await signOut(auth);

  return cred;
};

/**
 * Sign in with email + password.
 * Rejects unverified accounts so they cannot access the app.
 */
export const loginWithEmail = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);

  if (!cred.user.emailVerified) {
    /* Re-send verification email and kick them out */
    try { await sendEmailVerification(cred.user); } catch (_) {}
    await signOut(auth);
    const err = new Error("Please verify your email before signing in. We've resent the verification link.");
    err.code  = "auth/email-not-verified";
    throw err;
  }

  return cred;
};

/** Send Firebase password reset email */
export const resetPassword = (email) =>
  sendPasswordResetEmail(auth, email);

export const logout = async () => {
  await signOut(auth);
  showToast("Signed out successfully", "info");
  window.location.href = "index.html";
};

export const getCurrentUser  = () => auth.currentUser;
export const observeAuthState = (callback) => onAuthStateChanged(auth, callback);

/* 
   NAVBAR UPDATE
   Shows user avatar (photo or generated initial) + display name.
   */
function updateNavbar(user) {
  let attempts = 0;

  const tryUpdate = () => {
    const avatar    = document.getElementById("nav-avatar");
    const username  = document.getElementById("nav-username");
    const loginBtn  = document.getElementById("nav-login");
    const logoutBtn = document.getElementById("nav-logout");

    /* Navbar not loaded yet — retry */
    if (!loginBtn && attempts < 25) {
      attempts++;
      setTimeout(tryUpdate, 80);
      return;
    }

    if (user) {
      /* ── Build avatar URL ── */
      const displayName = user.displayName || user.email.split("@")[0];
      const firstLetter = encodeURIComponent((displayName.trim()[0] || "U").toUpperCase());

      const photoURL = user.photoURL
        ? user.photoURL
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&size=68&bold=true&length=1`;

      if (avatar) {
        avatar.src = photoURL;
        avatar.alt = `${displayName}'s avatar`;
        avatar.classList.add("show");
      }
      if (username) {
        username.textContent = displayName;
        username.classList.add("show");
      }
      if (loginBtn)  loginBtn.classList.remove("show");
      if (logoutBtn) logoutBtn.classList.add("show");
    } else {
      /* Logged out */
      if (avatar)    { avatar.src = ""; avatar.alt = ""; avatar.classList.remove("show"); }
      if (username)  { username.textContent = ""; username.classList.remove("show"); }
      if (loginBtn)  loginBtn.classList.add("show");
      if (logoutBtn) logoutBtn.classList.remove("show");
    }
  };

  tryUpdate();
}

/* 
   INIT AUTH OBSERVER
   Call once per page. Handles navbar + optional page callback.
   */
export function initAuthObserver(pageCallback) {
  /* Wire logout button (retry while navbar loads) */
  const wireLogout = () => {
    const btn = document.getElementById("nav-logout");
    if (btn) {
      btn.addEventListener("click", logout);
    } else {
      setTimeout(wireLogout, 100);
    }
  };
  wireLogout();

  onAuthStateChanged(auth, (user) => {
    updateNavbar(user);
    if (typeof pageCallback === "function") pageCallback(user);
  });
}

/* 
   KEPT FOR BACKWARD COMPATIBILITY
   */
export function initCommon() { /* no-op */ }

/* 
   GLOBAL LOADING OVERLAY
*/
export function showLoading(show) {
  let loader = document.getElementById("global-loader");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "global-loader";
    loader.innerHTML = '<div class="loader-spinner"></div>';
    document.body.appendChild(loader);
  }
  loader.style.display = show ? "flex" : "none";
}
