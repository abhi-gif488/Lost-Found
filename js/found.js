/* ============================================================
   js/found.js
   Found Items page — render, search, post modal
   ============================================================ */

import { initCommon, initAuthObserver, showToast } from "./auth.js";
import { submitItem, validateItemForm, setupImagePreview, setupDragDrop } from "./upload.js";
import { renderItemsGrid, setupSearchAndFilter } from "./render.js";

/* ---- Common ---- */
initCommon();

/* ---- Auth observer ---- */
initAuthObserver((user) => {
  const postWrap  = document.getElementById("post-btn-wrap");
  const loginHint = document.getElementById("post-login-hint");
  if (postWrap)  postWrap.style.display  = user ? "block" : "none";
  if (loginHint) loginHint.style.display = user ? "none"  : "block";
});

/* ---- Modal ---- */
const modal    = document.getElementById("post-modal");
const openBtn  = document.getElementById("open-post-modal");
const closeBtn = document.getElementById("close-post-modal");

openBtn?.addEventListener("click",  () => modal?.classList.add("open"));
closeBtn?.addEventListener("click", () => { modal?.classList.remove("open"); resetForm(); });
modal?.addEventListener("click", (e) => {
  if (e.target === modal) { modal.classList.remove("open"); resetForm(); }
});

/* ---- Image preview + drag-drop ---- */
setupImagePreview("item-image", "img-preview");
setupDragDrop("upload-area-modal", "item-image");

/* ---- Default date ---- */
const dateInput = document.getElementById("item-date");
if (dateInput) dateInput.value = new Date().toISOString().split("T")[0];

/* ---- Form submit ---- */
document.getElementById("item-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = {
    type:        "found",
    title:       document.getElementById("item-title")?.value.trim(),
    category:    document.getElementById("item-category")?.value,
    description: document.getElementById("item-description")?.value.trim(),
    location:    document.getElementById("item-location")?.value.trim(),
    contact:     document.getElementById("item-contact")?.value.trim(),
    date:        document.getElementById("item-date")?.value,
  };

  ["title-error", "desc-error"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });

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
  const btn = document.getElementById("submit-btn");
  if (btn) { btn.disabled = true; btn.textContent = "Posting…"; }

  const id = await submitItem(formData, imageFile);

  if (btn) { btn.disabled = false; btn.textContent = "📤 Post Found Item"; }

  if (id) {
    modal?.classList.remove("open");
    resetForm();
    await renderItemsGrid("items-grid", "found");
    setupSearchAndFilter("items-grid", "search-input", "filter-category", null);
  }
});

/* ---- Reset form ---- */
function resetForm() {
  document.getElementById("item-form")?.reset();
  const preview = document.getElementById("img-preview");
  if (preview) preview.style.display = "none";
  document.querySelector(".upload-area")?.classList.remove("has-image");
  if (dateInput) dateInput.value = new Date().toISOString().split("T")[0];
  ["title-error", "desc-error"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
}

/* ---- Initial render ---- */
(async () => {
  await renderItemsGrid("items-grid", "found");
  setupSearchAndFilter("items-grid", "search-input", "filter-category", null);
})();
