/* ============================================================
   js/auth.js
   Authentication helpers, toast notifications, navbar updates
   ============================================================ */

import {
  auth, gProvider, db, collection, getDocs, query, orderBy,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "./firebase-config.js";

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */

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
  }, 3800);
}

/* ============================================================
   FIREBASE AUTH FUNCTIONS
   ============================================================ */

export const signInWithGoogle = () => signInWithPopup(auth, gProvider);

export const registerWithEmail = async (email, password, name) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  return cred;
};

export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

/** Send Firebase password reset email */
export const resetPassword = (email) =>
  sendPasswordResetEmail(auth, email);

export const logout = async () => {
  await signOut(auth);
  showToast("Signed out successfully", "info");
  window.location.href = "index.html";
};

export const getCurrentUser = () => auth.currentUser;

export const observeAuthState = (callback) =>
  onAuthStateChanged(auth, callback);

/* ============================================================
   NAVBAR UPDATE — Visibility-based (no CLS)
   Uses .show class instead of display:none/block so reserved
   space is never lost and buttons don't shift layout.
   ============================================================ */
function updateNavbar(user) {
  /* Retry up to 20 times while navbar.html is still loading */
  let attempts = 0;
  const tryUpdate = () => {
    const avatar    = document.getElementById("nav-avatar");
    const username  = document.getElementById("nav-username");
    const loginBtn  = document.getElementById("nav-login");
    const logoutBtn = document.getElementById("nav-logout");

    /* Navbar not loaded yet — retry */
    if (!loginBtn && attempts < 20) {
      attempts++;
      setTimeout(tryUpdate, 80);
      return;
    }

    if (user) {
      /* Show user info */
      if (avatar) {
        const photoURL = user.photoURL ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=6366f1&color=fff&size=68`;
        avatar.src = photoURL;
        avatar.classList.add("show");
      }
      if (username) {
        username.textContent = user.displayName || user.email.split("@")[0];
        username.classList.add("show");
      }
      if (loginBtn)  loginBtn.classList.remove("show");
      if (logoutBtn) logoutBtn.classList.add("show");
    } else {
      /* Show login button */
      if (avatar)    { avatar.src = ""; avatar.classList.remove("show"); }
      if (username)  { username.textContent = ""; username.classList.remove("show"); }
      if (loginBtn)  loginBtn.classList.add("show");
      if (logoutBtn) logoutBtn.classList.remove("show");
    }
  };
  tryUpdate();
}

/* ============================================================
   INIT AUTH OBSERVER
   Call once per page. Handles navbar + optional page callback.
   ============================================================ */
export function initAuthObserver(pageCallback) {
  /* Wire up logout button (retry while navbar loads) */
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

/* ============================================================
   COMMON PAGE INIT (theme)
   initCommon no longer handles theme — theme.js / navbar.js do.
   Kept for backward compatibility.
   ============================================================ */
export function initCommon() {
  /* Theme is already applied by navbar.js inline script.
     This function is kept as a no-op stub to avoid breaking
     pages that import and call it. */
}

/* ============================================================
   GLOBAL LOADING OVERLAY
   ============================================================ */
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
