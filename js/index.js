/* ============================================================
   js/index.js
   Home page — auth gate, forms, stats, feedback
   ============================================================ */

import { initCommon, initAuthObserver, showToast } from "./auth.js";
import { submitItem, validateItemForm, setupImagePreview, setupDragDrop } from "./upload.js";
import { submitFeedback } from "./feedback.js";
import { renderRecentPreview } from "./render.js";

/* ---- Init common (theme + nav) ---- */
initCommon();

/* ---- Auth observer ---- */
initAuthObserver((user) => {
  const reportGate = document.getElementById("report-auth-gate");
  const reportForm = document.getElementById("report-form-wrap");
  const fbGate     = document.getElementById("feedback-auth-gate");
  const fbForm     = document.getElementById("feedback-form-wrap");

  if (user) {
    reportGate?.style && (reportGate.style.display = "none");
    reportForm?.style && (reportForm.style.display = "block");
    fbGate?.style     && (fbGate.style.display     = "none");
    fbForm?.style     && (fbForm.style.display     = "block");
  } else {
    reportGate?.style && (reportGate.style.display = "block");
    reportForm?.style && (reportForm.style.display = "none");
    fbGate?.style     && (fbGate.style.display     = "block");
    fbForm?.style     && (fbForm.style.display     = "none");
  }
});

/* ---- Image preview + drag-drop ---- */
setupImagePreview("item-image", "img-preview");
setupDragDrop("upload-area", "item-image");

/* ---- Item type selector ---- */
let selectedType = "lost";
document.querySelectorAll(".type-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".type-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedType = btn.dataset.value;
    document.getElementById("item-type").value = selectedType;
  });
});

/* ---- Default date ---- */
const dateInput = document.getElementById("item-date");
if (dateInput) dateInput.value = new Date().toISOString().split("T")[0];

/* ---- Hero CTA buttons pre-select type ---- */
document.getElementById("hero-lost-btn")?.addEventListener("click", () => {
  document.querySelector('[data-value="lost"]')?.click();
});
document.getElementById("hero-found-btn")?.addEventListener("click", () => {
  document.querySelector('[data-value="found"]')?.click();
});

/* ---- Item form submit ---- */
document.getElementById("item-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = {
    type:        selectedType,
    title:       document.getElementById("item-title")?.value.trim(),
    category:    document.getElementById("item-category")?.value,
    description: document.getElementById("item-description")?.value.trim(),
    location:    document.getElementById("item-location")?.value.trim(),
    contact:     document.getElementById("item-contact")?.value.trim(),
    date:        document.getElementById("item-date")?.value,
  };

  // Clear previous errors
  document.getElementById("title-error") && (document.getElementById("title-error").textContent = "");
  document.getElementById("desc-error")  && (document.getElementById("desc-error").textContent  = "");

  const errors = validateItemForm(formData);
  if (errors.length) {
    errors.forEach(err => {
      if (err.toLowerCase().includes("title"))       document.getElementById("title-error").textContent = err;
      else if (err.toLowerCase().includes("descr"))  document.getElementById("desc-error").textContent  = err;
      else showToast(err, "error");
    });
    return;
  }

  const imageFile = document.getElementById("item-image")?.files[0];
  const submitBtn = document.getElementById("submit-btn");
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Posting…"; }

  const id = await submitItem(formData, imageFile);

  if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "✅ Post Item"; }

  if (id) {
    document.getElementById("item-form").reset();
    const preview = document.getElementById("img-preview");
    if (preview) preview.style.display = "none";
    document.querySelector(".upload-area")?.classList.remove("has-image");
    if (dateInput) dateInput.value = new Date().toISOString().split("T")[0];
    // Refresh preview
    await renderRecentPreview("recent-lost-grid", "recent-found-grid");
    updateStats();
  }
});

/* ---- Feedback star rating ---- */
let selectedRating = 5;
const starBtns = document.querySelectorAll(".rating-stars button");
starBtns.forEach(btn => btn.classList.add("active")); // default all active

starBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    selectedRating = parseInt(btn.dataset.val);
    document.getElementById("rating-val").value = selectedRating;
    starBtns.forEach((b, i) => b.classList.toggle("active", i < selectedRating));
  });
});

/* ---- Feedback form submit ---- */
document.getElementById("feedback-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("feedback-msg")?.value.trim();
  if (!msg) { showToast("Please enter your feedback", "error"); return; }

  const btn = e.target.querySelector("button[type=submit]");
  if (btn) { btn.disabled = true; btn.textContent = "Submitting…"; }

  const id = await submitFeedback({ message: msg, rating: selectedRating });

  if (btn) { btn.disabled = false; btn.textContent = "Submit Feedback"; }
  if (id)  document.getElementById("feedback-form").reset();
});

/* ---- Stats counter animation ---- */
function animateNumber(elId, target) {
  const el = document.getElementById(elId);
  if (!el || target === 0) { if (el) el.textContent = 0; return; }
  let current = 0;
  const step  = Math.ceil(target / 40);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 35);
}

function updateStats() {
  const items = window._allItems || [];
  const lost  = items.filter(i => i.type === "lost").length;
  const found = items.filter(i => i.type === "found").length;
  animateNumber("stat-total", items.length);
  animateNumber("stat-lost",  lost);
  animateNumber("stat-found", found);
}

/* ---- Initial render ---- */
(async () => {
  await renderRecentPreview("recent-lost-grid", "recent-found-grid");
  updateStats();
})();
