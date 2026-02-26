/* ============================================================
   js/login.js
   Login / Register page logic
   ============================================================ */

import { initCommon, showToast, observeAuthState } from "./auth.js";
import { signInWithGoogle, registerWithEmail, loginWithEmail } from "./auth.js";

/* ---- Common (theme only — no hamburger on login) ---- */
initCommon();

/* ---- Redirect if already logged in ---- */
observeAuthState((user) => {
  if (user) window.location.href = "index.html";
});

/* ============================================================
   TAB SWITCHING
   ============================================================ */
const tabLogin    = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const loginForm   = document.getElementById("login-form");
const registerForm= document.getElementById("register-form");

tabLogin?.addEventListener("click", () => {
  tabLogin.classList.add("active");
  tabRegister?.classList.remove("active");
  loginForm.style.display    = "block";
  registerForm.style.display = "none";
  clearErrors();
});

tabRegister?.addEventListener("click", () => {
  tabRegister.classList.add("active");
  tabLogin?.classList.remove("active");
  registerForm.style.display = "block";
  loginForm.style.display    = "none";
  clearErrors();
});

/* ============================================================
   PASSWORD VISIBILITY TOGGLES
   ============================================================ */
function togglePw(inputId, btnId) {
  const btn   = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  if (!btn || !input) return;
  btn.addEventListener("click", () => {
    const show = input.type === "password";
    input.type  = show ? "text" : "password";
    btn.textContent = show ? "🙈" : "👁";
  });
}
togglePw("login-password",  "login-toggle-pw");
togglePw("reg-password",    "reg-toggle-pw");
togglePw("reg-confirm",     "reg-toggle-confirm");

/* ============================================================
   PASSWORD STRENGTH INDICATOR
   ============================================================ */
document.getElementById("reg-password")?.addEventListener("input", (e) => {
  const pw  = e.target.value;
  const bar = document.getElementById("password-strength");
  if (!bar) return;

  let strength = 0;
  if (pw.length >= 8)          strength++;
  if (/[A-Z]/.test(pw))        strength++;
  if (/[0-9]/.test(pw))        strength++;
  if (/[^A-Za-z0-9]/.test(pw)) strength++;

  const labels  = ["", "Weak", "Fair", "Good", "Strong"];
  const colors  = ["", "#ef4444", "#f59e0b", "#06b6d4", "#22c55e"];
  bar.textContent  = pw.length ? `Strength: ${labels[strength]}` : "";
  bar.style.color  = colors[strength] || "";
});

/* ============================================================
   GOOGLE SIGN IN
   ============================================================ */
document.getElementById("google-signin")?.addEventListener("click", async () => {
  const btn = document.getElementById("google-signin");
  btn.disabled    = true;
  btn.textContent = "Signing in…";

  try {
    await signInWithGoogle();
    showToast("Signed in with Google! 🎉", "success");
    // redirect happens via auth observer
  } catch (err) {
    showToast(friendlyError(err.code), "error");
    btn.disabled    = false;
    btn.innerHTML   = '<img src="https://www.google.com/favicon.ico" alt="Google" style="width:18px;height:18px;"> Continue with Google';
  }
});

/* ============================================================
   EMAIL LOGIN
   ============================================================ */
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const email    = document.getElementById("login-email")?.value.trim();
  const password = document.getElementById("login-password")?.value;

  if (!email)    { setError("login-email-error",   "Email is required");    return; }
  if (!password) { setError("login-pw-error",       "Password is required"); return; }

  const btn = loginForm.querySelector("button[type=submit]");
  btn.disabled    = true;
  btn.textContent = "Signing in…";

  try {
    await loginWithEmail(email, password);
    showToast("Welcome back! 👋", "success");
  } catch (err) {
    setError("login-pw-error", friendlyError(err.code));
    btn.disabled    = false;
    btn.textContent = "Sign In →";
  }
});

/* ============================================================
   REGISTER
   ============================================================ */
registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const name     = document.getElementById("reg-name")?.value.trim();
  const email    = document.getElementById("reg-email")?.value.trim();
  const password = document.getElementById("reg-password")?.value;
  const confirm  = document.getElementById("reg-confirm")?.value;
  const terms    = document.getElementById("reg-terms")?.checked;

  let hasError = false;
  if (!name)              { setError("reg-name-error",    "Full name is required");         hasError = true; }
  if (!email)             { setError("reg-email-error",   "Email is required");             hasError = true; }
  if (password.length < 8){ setError("reg-pw-error",      "Password must be 8+ characters");hasError = true; }
  if (password !== confirm){ setError("reg-confirm-error","Passwords do not match");        hasError = true; }
  if (!terms)             { setError("reg-terms-error",   "Please accept the terms");       hasError = true; }
  if (hasError) return;

  const btn = registerForm.querySelector("button[type=submit]");
  btn.disabled    = true;
  btn.textContent = "Creating account…";

  try {
    await registerWithEmail(email, password, name);
    showToast("Account created! Welcome! 🎉", "success");
  } catch (err) {
    setError("reg-email-error", friendlyError(err.code));
    btn.disabled    = false;
    btn.textContent = "Create Account ✨";
  }
});

/* ============================================================
   HELPERS
   ============================================================ */
function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearErrors() {
  document.querySelectorAll(".form-error").forEach(el => el.textContent = "");
}

function friendlyError(code) {
  const map = {
    "auth/user-not-found":         "No account found with this email.",
    "auth/wrong-password":         "Incorrect password. Please try again.",
    "auth/invalid-credential":     "Invalid email or password.",
    "auth/email-already-in-use":   "This email is already registered.",
    "auth/weak-password":          "Password must be at least 6 characters.",
    "auth/invalid-email":          "Please enter a valid email address.",
    "auth/popup-closed-by-user":   "Sign-in popup was closed.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/too-many-requests":      "Too many attempts. Please try again later.",
  };
  return map[code] || "Something went wrong. Please try again.";
}
