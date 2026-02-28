/* ============================================================
   js/login.js
   Login / Register / Forgot Password page logic
   ============================================================ */

import { showToast, observeAuthState } from "./auth.js";
import { signInWithGoogle, registerWithEmail, loginWithEmail, resetPassword } from "./auth.js";

/* ---- Redirect if already signed in ---- */
observeAuthState((user) => {
  if (user) window.location.href = "index.html";
});

/* ============================================================
   VIEWS: login, register, forgotPassword
   ============================================================ */
const views = {
  loginPanel:    document.getElementById("login-form"),
  registerPanel: document.getElementById("register-form"),
  forgotPanel:   document.getElementById("forgot-panel"),
  tabsRow:       document.getElementById("auth-tabs-row"),
  googleBtn:     document.getElementById("google-signin"),
  divider:       document.getElementById("auth-divider"),
};

function showView(view) {
  /* hide all panels */
  ["loginPanel","registerPanel","forgotPanel"].forEach(k => {
    if (views[k]) views[k].style.display = "none";
  });
  clearErrors();
  if (views[view]) views[view].style.display = "block";

  /* Toggle tabs/google visibility */
  const isForgot = view === "forgotPanel";
  if (views.tabsRow)  views.tabsRow.style.display  = isForgot ? "none" : "";
  if (views.googleBtn) views.googleBtn.style.display = isForgot ? "none" : "";
  if (views.divider)  views.divider.style.display   = isForgot ? "none" : "";
}

/* ============================================================
   TABS
   ============================================================ */
document.getElementById("tab-login")?.addEventListener("click", () => {
  document.getElementById("tab-login")?.classList.add("active");
  document.getElementById("tab-register")?.classList.remove("active");
  showView("loginPanel");
});

document.getElementById("tab-register")?.addEventListener("click", () => {
  document.getElementById("tab-register")?.classList.add("active");
  document.getElementById("tab-login")?.classList.remove("active");
  showView("registerPanel");
});

/* ============================================================
   FORGOT PASSWORD PANEL
   ============================================================ */
document.getElementById("forgot-pw-btn")?.addEventListener("click", () => {
  showView("forgotPanel");
});

document.getElementById("forgot-back-btn")?.addEventListener("click", () => {
  document.getElementById("tab-login")?.classList.add("active");
  document.getElementById("tab-register")?.classList.remove("active");
  showView("loginPanel");
});

document.getElementById("forgot-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const email = document.getElementById("forgot-email")?.value.trim();
  if (!email) { setError("forgot-email-error", "Please enter your email address"); return; }

  const btn = document.getElementById("forgot-submit-btn");
  if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }

  try {
    await resetPassword(email);
    // Show success message in the panel
    const successEl = document.getElementById("forgot-success");
    if (successEl) {
      successEl.textContent = `✓ Reset link sent to ${email}. Check your inbox (and spam folder).`;
      successEl.style.display = "block";
    }
    showToast("Password reset email sent! Check your inbox.", "success");
    if (btn) { btn.disabled = false; btn.textContent = "Send Reset Link"; }
  } catch (err) {
    setError("forgot-email-error", friendlyError(err.code));
    if (btn) { btn.disabled = false; btn.textContent = "Send Reset Link"; }
  }
});

/* ============================================================
   PASSWORD VISIBILITY TOGGLES
   ============================================================ */
function setupPwToggle(inputId, btnId) {
  const btn   = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  if (!btn || !input) return;
  btn.addEventListener("click", () => {
    const show = input.type === "password";
    input.type     = show ? "text" : "password";
    btn.innerHTML  = show ? "🙈" : "👁";
    btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });
}
setupPwToggle("login-password",  "login-toggle-pw");
setupPwToggle("reg-password",    "reg-toggle-pw");
setupPwToggle("reg-confirm",     "reg-toggle-confirm");

/* ============================================================
   PASSWORD STRENGTH
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

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#ef4444", "#f59e0b", "#06b6d4", "#22c55e"];
  bar.textContent = pw.length ? `Strength: ${labels[strength]}` : "";
  bar.style.color = colors[strength] || "";
});

/* ============================================================
   GOOGLE SIGN IN
   ============================================================ */
document.getElementById("google-signin")?.addEventListener("click", async () => {
  const btn = document.getElementById("google-signin");
  btn.disabled = true;
  btn.innerHTML = '<span style="opacity:0.6">Connecting…</span>';

  try {
    await signInWithGoogle();
    showToast("Signed in with Google! 🎉", "success");
  } catch (err) {
    showToast(friendlyError(err.code), "error");
    btn.disabled = false;
    btn.innerHTML = '<img src="https://www.google.com/favicon.ico" alt="" width="18" height="18" style="border-radius:2px;"> Continue with Google';
  }
});

/* ============================================================
   EMAIL LOGIN
   ============================================================ */
document.getElementById("login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const email    = document.getElementById("login-email")?.value.trim();
  const password = document.getElementById("login-password")?.value;

  if (!email)    { setError("login-email-error", "Email is required");    return; }
  if (!password) { setError("login-pw-error",    "Password is required"); return; }

  const btn = e.target.querySelector("button[type=submit]");
  if (btn) { btn.disabled = true; btn.textContent = "Signing in…"; }

  try {
    await loginWithEmail(email, password);
    showToast("Welcome back! 👋", "success");
  } catch (err) {
    setError("login-pw-error", friendlyError(err.code));
    if (btn) { btn.disabled = false; btn.textContent = "Sign In →"; }
  }
});

/* ============================================================
   REGISTER
   ============================================================ */
document.getElementById("register-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const name    = document.getElementById("reg-name")?.value.trim();
  const email   = document.getElementById("reg-email")?.value.trim();
  const password= document.getElementById("reg-password")?.value;
  const confirm = document.getElementById("reg-confirm")?.value;
  const terms   = document.getElementById("reg-terms")?.checked;

  let hasError = false;
  if (!name)               { setError("reg-name-error",    "Full name is required");          hasError = true; }
  if (!email)              { setError("reg-email-error",   "Email is required");              hasError = true; }
  if (password.length < 8) { setError("reg-pw-error",      "Password must be 8+ characters"); hasError = true; }
  if (password !== confirm){ setError("reg-confirm-error", "Passwords do not match");         hasError = true; }
  if (!terms)              { setError("reg-terms-error",   "Please accept the terms");        hasError = true; }
  if (hasError) return;

  const btn = e.target.querySelector("button[type=submit]");
  if (btn) { btn.disabled = true; btn.textContent = "Creating account…"; }

  try {
    await registerWithEmail(email, password, name);
    showToast("Account created! Welcome! 🎉", "success");
  } catch (err) {
    setError("reg-email-error", friendlyError(err.code));
    if (btn) { btn.disabled = false; btn.textContent = "Create Account ✨"; }
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
  const s = document.getElementById("forgot-success");
  if (s) s.style.display = "none";
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
