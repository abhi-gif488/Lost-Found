
import { showToast, observeAuthState, isGmailAddress } from "./auth.js";
import { signInWithGoogle, registerWithEmail, loginWithEmail, resetPassword } from "./auth.js";

/* 
   REDIRECT ALREADY-SIGNED-IN USERS
   Uses a flag to prevent redirect loops; only redirects once.
 */
let redirectHandled = false;

observeAuthState((user) => {
  if (user && user.emailVerified && !redirectHandled) {
    redirectHandled = true;
    /* Small delay so any toast has time to appear */
    setTimeout(() => { window.location.href = "index.html"; }, 600);
  }
});

/* 
   VIEWS
   */
const views = {
  loginPanel:    document.getElementById("login-form"),
  registerPanel: document.getElementById("register-form"),
  forgotPanel:   document.getElementById("forgot-panel"),
  tabsRow:       document.getElementById("auth-tabs-row"),
  googleBtn:     document.getElementById("google-signin"),
  divider:       document.getElementById("auth-divider"),
};

/* Banner shown after registration asking user to verify email */
const verifyBanner = (() => {
  const el = document.createElement("div");
  el.id = "verify-email-banner";
  el.className = "verify-banner";
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  el.style.display = "none";
  el.innerHTML = `
    <span class="verify-icon">📧</span>
    <div class="verify-text">
      <strong>Check your Gmail inbox!</strong>
      <p id="verify-banner-msg">We've sent a verification link to your email address.
      Click it to activate your account, then sign in here.</p>
    </div>`;
  /* Insert before the auth card's first child */
  const card = document.querySelector(".auth-card");
  if (card) card.insertBefore(el, card.firstChild);
  return el;
})();

function showVerifyBanner(email) {
  const msg = document.getElementById("verify-banner-msg");
  if (msg) msg.textContent = `We sent a verification link to ${email}. Click it, then sign in here.`;
  verifyBanner.style.display = "flex";
  verifyBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideVerifyBanner() {
  verifyBanner.style.display = "none";
}

function showView(view) {
  ["loginPanel", "registerPanel", "forgotPanel"].forEach(k => {
    if (views[k]) views[k].style.display = "none";
  });
  clearErrors();
  hideVerifyBanner();
  if (views[view]) views[view].style.display = "block";

  const isForgot = view === "forgotPanel";
  if (views.tabsRow)  views.tabsRow.style.display  = isForgot ? "none" : "";
  if (views.googleBtn) views.googleBtn.style.display = isForgot ? "none" : "";
  if (views.divider)  views.divider.style.display   = isForgot ? "none" : "";
}

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

/* 
   FORGOT PASSWORD
   */
document.getElementById("forgot-pw-btn")?.addEventListener("click", () => showView("forgotPanel"));

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

/* 
   PASSWORD VISIBILITY TOGGLES
   */
function setupPwToggle(inputId, btnId) {
  const btn   = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  if (!btn || !input) return;
  btn.addEventListener("click", () => {
    const show = input.type === "password";
    input.type    = show ? "text" : "password";
    btn.innerHTML = show ? "🙈" : "👁";
    btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });
}
setupPwToggle("login-password",  "login-toggle-pw");
setupPwToggle("reg-password",    "reg-toggle-pw");
setupPwToggle("reg-confirm",     "reg-toggle-confirm");

/* 
   PASSWORD STRENGTH
 */
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

/* 
   GMAIL HINT — live feedback on register email field
 */
document.getElementById("reg-email")?.addEventListener("blur", (e) => {
  const email = e.target.value.trim();
  if (email && !isGmailAddress(email)) {
    setError("reg-email-error", "Only Gmail addresses (@gmail.com) are allowed.");
  } else {
    setError("reg-email-error", "");
  }
});

/* 
   GOOGLE SIGN IN
  */
document.getElementById("google-signin")?.addEventListener("click", async () => {
  const btn = document.getElementById("google-signin");
  btn.disabled = true;
  btn.innerHTML = '<span style="opacity:0.6">Connecting…</span>';

  try {
    await signInWithGoogle();
    showToast("Signed in with Google! 🎉", "success");
    /* Auth observer will handle redirect */
  } catch (err) {
    showToast(friendlyError(err.code), "error");
    btn.disabled = false;
    btn.innerHTML = '<img src="https://www.google.com/favicon.ico" alt="" width="18" height="18" style="border-radius:2px;"> Continue with Google';
  }
});

/* 
   EMAIL LOGIN
 */
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
    /* Auth observer handles redirect for verified users */
  } catch (err) {
    if (err.code === "auth/email-not-verified") {
      /* Show the verify-email banner instead of a plain error */
      showVerifyBanner(email);
      showToast("Please verify your email first. Check your inbox!", "info");
    } else {
      setError("login-pw-error", friendlyError(err.code));
    }
    if (btn) { btn.disabled = false; btn.textContent = "Sign In →"; }
  }
});

/* 
   REGISTER
 */
document.getElementById("register-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const name    = document.getElementById("reg-name")?.value.trim();
  const email   = document.getElementById("reg-email")?.value.trim();
  const password= document.getElementById("reg-password")?.value;
  const confirm = document.getElementById("reg-confirm")?.value;
  const terms   = document.getElementById("reg-terms")?.checked;

  let hasError = false;
  if (!name)                    { setError("reg-name-error",    "Full name is required");                              hasError = true; }
  if (!email)                   { setError("reg-email-error",   "Email is required");                                 hasError = true; }
  else if (!isGmailAddress(email)){ setError("reg-email-error", "Only Gmail addresses (@gmail.com) are allowed."); hasError = true; }
  if (password.length < 8)      { setError("reg-pw-error",      "Password must be 8+ characters");                   hasError = true; }
  if (password !== confirm)     { setError("reg-confirm-error", "Passwords do not match");                            hasError = true; }
  if (!terms)                   { setError("reg-terms-error",   "Please accept the terms");                           hasError = true; }
  if (hasError) return;

  const btn = e.target.querySelector("button[type=submit]");
  if (btn) { btn.disabled = true; btn.textContent = "Creating account…"; }

  try {
    await registerWithEmail(email, password, name);

    /* Show the verify-email banner and switch to login tab */
    showVerifyBanner(email);
    document.getElementById("tab-login")?.classList.add("active");
    document.getElementById("tab-register")?.classList.remove("active");
    if (views.loginPanel)    views.loginPanel.style.display    = "block";
    if (views.registerPanel) views.registerPanel.style.display = "none";

    showToast("Account created! 🎉 Check your Gmail to verify.", "success");
    if (btn) { btn.disabled = false; btn.textContent = "Create Account ✨"; }
  } catch (err) {
    setError("reg-email-error", friendlyError(err.code));
    if (btn) { btn.disabled = false; btn.textContent = "Create Account ✨"; }
  }
});

/*
   HELPERS
  */
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
    "auth/gmail-only":             "Only Gmail addresses (@gmail.com) are allowed.",
    "auth/email-not-verified":     "Please verify your email before signing in.",
  };
  return map[code] || "Something went wrong. Please try again.";
}
