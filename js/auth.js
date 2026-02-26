/* ============================================================
   js/auth.js
   Authentication helpers + Toast notifications + Nav setup
   ============================================================ */

import {
  auth, gProvider, db, collection, getDocs, query, orderBy,
  signInWithPopup, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile
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
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span>
                     <span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("show"));
  });

  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove());
  }, 3800);
}

/* ============================================================
   FIREBASE AUTH FUNCTIONS
   ============================================================ */

/** Sign in with Google popup */
export const signInWithGoogle = () => signInWithPopup(auth, gProvider);

/** Register new user with email + password + display name */
export const registerWithEmail = async (email, password, name) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  return cred;
};

/** Sign in existing user with email + password */
export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

/** Sign out */
export const logout = async () => {
  await signOut(auth);
  showToast("Signed out successfully", "info");
  window.location.href = "index.html";
};

/** Get current user (may be null) */
export const getCurrentUser = () => auth.currentUser;

/** Observe auth state changes */
export const observeAuthState = (callback) =>
  onAuthStateChanged(auth, callback);

/* ============================================================
   NAVBAR AUTH MANAGEMENT
   Updates the navbar on every page based on auth state.
   ============================================================ */
function updateNavbar(user) {
  const avatar    = document.getElementById("nav-avatar");
  const username  = document.getElementById("nav-username");
  const loginBtn  = document.getElementById("nav-login");
  const logoutBtn = document.getElementById("nav-logout");

  if (user) {
    if (avatar) {
      const photoURL = user.photoURL ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=6366f1&color=fff&size=68`;
      avatar.src   = photoURL;
      avatar.style.display = "block";
    }
    if (username) {
      username.textContent = user.displayName || user.email.split("@")[0];
      username.style.display = "block";
    }
    if (loginBtn)  loginBtn.style.display  = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-flex";
  } else {
    if (avatar)    { avatar.src = ""; avatar.style.display = "none"; }
    if (username)  { username.textContent = ""; username.style.display = "none"; }
    if (loginBtn)  loginBtn.style.display  = "inline-flex";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
}

/* ============================================================
   INIT AUTH OBSERVER
   Call once per page. Handles navbar + optional page callback.
   ============================================================ */

/**
 * @param {function(firebase.User|null): void} [pageCallback]
 */
export function initAuthObserver(pageCallback) {
  // Wire up logout button if present
  const logoutBtn = document.getElementById("nav-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  // Observe auth state
  onAuthStateChanged(auth, (user) => {
    updateNavbar(user);
    if (typeof pageCallback === "function") pageCallback(user);
  });
}

/* ============================================================
   COMMON PAGE INIT  (theme + mobile nav)
   Call this on every page for shared behaviour.
   ============================================================ */
export function initCommon() {
  // Theme toggle
  const saved = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);

  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }

  // Mobile hamburger menu
  const toggle   = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");
  if (toggle && navLinks) {
    toggle.addEventListener("click", () => {
      toggle.classList.toggle("open");
      navLinks.classList.toggle("open");
    });
    // Close on link click
    navLinks.querySelectorAll("a").forEach(a =>
      a.addEventListener("click", () => {
        toggle.classList.remove("open");
        navLinks.classList.remove("open");
      })
    );
  }
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
