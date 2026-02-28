/* ============================================================
   js/render.js
   Fetch, render and filter item cards.
   Includes owner-only edit & delete functionality.
   ============================================================ */

import {
  db, auth, collection, getDocs, getDoc, doc,
  deleteDoc, updateDoc, query, orderBy
} from "./firebase-config.js";
import { showToast, showLoading } from "./auth.js";
import { downloadItemText } from "./upload.js";

/* ============================================================
   CACHE (one network call per page load)
   ============================================================ */
let _cache = null;

async function getAllItems() {
  if (_cache) return _cache;
  try {
    const q    = query(collection(db, "items"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    _cache = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`[render] Loaded ${_cache.length} items from Firestore`);
    return _cache;
  } catch (err) {
    console.warn("[render] Firestore fetch failed — using demo data.\n", err.message);
    _cache = getMockItems();
    return _cache;
  }
}

export function clearItemCache() { _cache = null; }

/* ============================================================
   PUBLIC FETCH
   ============================================================ */
export async function fetchItems(type = null) {
  const all = await getAllItems();
  return type ? all.filter(i => i.type === type) : all;
}

/* ============================================================
   MOCK DATA (shown when Firebase not configured)
   ============================================================ */
function getMockItems() {
  return [
    { id:"m1", type:"lost",  title:"Blue Backpack",       category:"Bags",        description:"Navy blue Jansport backpack with laptop sleeve and a small red car keychain.", location:"Central Park, NYC",    date:"2025-01-15", image:null, userEmail:"alex@example.com",  userName:"Alex Johnson", contact:"alex@example.com",  userId:"mock1" },
    { id:"m2", type:"lost",  title:"iPhone 15 Pro",       category:"Electronics", description:"Space gray iPhone 15 Pro with cracked screen protector and a clear case.",    location:"Downtown Library",     date:"2025-01-18", image:null, userEmail:"sarah@example.com", userName:"Sarah M.",    contact:"sarah@example.com", userId:"mock2" },
    { id:"m3", type:"lost",  title:"Golden Retriever",    category:"Pets",        description:"Female golden retriever, 3 years old, wearing a red collar with name tags.",  location:"Riverside Park",       date:"2025-01-20", image:null, userEmail:"mike@example.com",  userName:"Mike Chen",   contact:"mike@example.com",  userId:"mock3" },
    { id:"m4", type:"found", title:"Silver Keys",         category:"Keys",        description:"A set of silver keys with a Toyota fob and one apartment key.",               location:"Oak Street Bus Stop",  date:"2025-01-16", image:null, userEmail:"emma@example.com",  userName:"Emma Davis",  contact:"emma@example.com",  userId:"mock4" },
    { id:"m5", type:"found", title:"Black Leather Wallet",category:"Wallets",     description:"Black leather wallet with cards (no cash). Found near the city square.",      location:"City Square Fountain", date:"2025-01-19", image:null, userEmail:"james@example.com", userName:"James Wilson",contact:"james@example.com", userId:"mock5" },
    { id:"m6", type:"found", title:"Prescription Glasses",category:"Accessories", description:"Brown tortoiseshell prescription glasses inside a black hard case.",          location:"Coffee House Café",    date:"2025-01-21", image:null, userEmail:"priya@example.com", userName:"Priya Patel", contact:"priya@example.com", userId:"mock6" }
  ];
}

/* ============================================================
   HELPERS
   ============================================================ */
const CATEGORY_ICONS = {
  Electronics:"📱", Bags:"🎒", Keys:"🔑", Wallets:"👛",
  Pets:"🐾", Jewelry:"💍", Clothing:"👕", Accessories:"👓",
  Documents:"📄", Sports:"⚽", Other:"📦"
};

function resolveImageURL(item) {
  if (!item) return null;
  if (item.imageURL && typeof item.imageURL === "string") return item.imageURL;
  if (!item.image) return null;
  if (typeof item.image === "string") return item.image;
  if (typeof item.image === "object" && item.image.url) return item.image.url;
  return null;
}

/* ============================================================
   ITEM CARD HTML
   Adds edit/delete buttons only when currentUser.uid === item.userId
   ============================================================ */
export function createItemCard(item, currentUserId = null) {
  const icon      = CATEGORY_ICONS[item.category] || "📦";
  const typeColor = item.type === "lost" ? "var(--lost-color)" : "var(--found-color)";
  const typeLabel = item.type === "lost" ? "LOST" : "FOUND";
  const imageURL  = resolveImageURL(item);
  const imgSrc    = imageURL ||
    `https://placehold.co/400x240/1e293b/94a3b8?text=${encodeURIComponent(icon + " " + (item.title || "Item"))}`;

  const userAvatar = item.userPhoto ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(item.userName || "U")}&background=6366f1&color=fff&size=32`;

  /* Owner check — only show edit/delete to the uploader */
  const isOwner = currentUserId && item.userId && (currentUserId === item.userId);
  const ownerActions = isOwner ? `
    <button class="btn-edit"   title="Edit item"   onclick="window._lf.editItem('${item.id}')">✏️</button>
    <button class="btn-delete" title="Delete item" onclick="window._lf.deleteItem('${item.id}')">🗑️</button>
  ` : "";

  const safeTitle = (item.title || "").replace(/'/g, "\\'").replace(/"/g, "&quot;");

  return `
    <div class="item-card"
         data-id="${item.id}"
         data-type="${item.type}"
         data-category="${(item.category || "").toLowerCase()}"
         data-title="${(item.title || "").toLowerCase()}"
         data-desc="${(item.description || "").toLowerCase()}"
         data-user-id="${item.userId || ""}">
      <div class="card-image-wrap">
        <img src="${imgSrc}" alt="${item.title}" class="card-image" loading="lazy"
             onerror="this.src='https://placehold.co/400x240/1e293b/94a3b8?text=No+Image'">
        <span class="type-badge" style="background:${typeColor}">${typeLabel}</span>
        <span class="cat-badge">${icon} ${item.category || "Other"}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${item.title}</h3>
        <p class="card-desc">${item.description}</p>
        <div class="card-meta">
          <span class="meta-item">📍 ${item.location}</span>
          <span class="meta-item">📅 ${item.date}</span>
        </div>
        <div class="card-footer">
          <div class="card-user">
            <img src="${userAvatar}" alt="${item.userName}" class="user-micro-avatar"
                 onerror="this.src='https://ui-avatars.com/api/?name=U&background=6366f1&color=fff&size=32'">
            <span>${item.userName || "Anonymous"}</span>
          </div>
          <div class="card-actions">
            <button class="btn-contact"
              onclick="window._lf.contact('${item.userEmail}','${safeTitle}')">
              Contact
            </button>
            <button class="btn-icon" title="Download details"
              onclick="window._lf.download('${item.id}')">⬇</button>
            ${ownerActions}
          </div>
        </div>
      </div>
    </div>`;
}

/* ============================================================
   SETUP GLOBAL ITEM ACTIONS
   ============================================================ */
function setupActions(itemMap) {
  window._lf = window._lf || {};

  window._lf.contact = (email, title) => {
    const subject = encodeURIComponent(`Re: ${title} — Lost & Found Portal`);
    window.open(`mailto:${email}?subject=${subject}`, "_self");
  };

  window._lf.download = (id) => {
    const item = itemMap[id];
    if (item) downloadItemText(item);
  };

  /* ----- DELETE ITEM ----- */
  window._lf.deleteItem = (id) => {
    const user = auth.currentUser;
    const item = itemMap[id];
    if (!item) return;

    /* Security check: only owner can delete */
    if (!user || user.uid !== item.userId) {
      showToast("You can only delete your own items.", "error");
      return;
    }

    /* Show confirmation dialog */
    showConfirmDialog(
      "Delete Item",
      `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
      async () => {
        try {
          showLoading(true);
          await deleteDoc(doc(db, "items", id));

          /* Remove card from DOM immediately */
          const card = document.querySelector(`[data-id="${id}"]`);
          if (card) {
            card.style.transition = "opacity 0.3s, transform 0.3s";
            card.style.opacity = "0";
            card.style.transform = "scale(0.9)";
            setTimeout(() => card.remove(), 300);
          }

          /* Invalidate cache */
          clearItemCache();
          showToast("Item deleted successfully.", "success");
          showLoading(false);
        } catch (err) {
          console.error("deleteItem error:", err);
          showToast("Failed to delete item: " + err.message, "error");
          showLoading(false);
        }
      }
    );
  };

  /* ----- EDIT ITEM ----- */
  window._lf.editItem = (id) => {
    const user = auth.currentUser;
    const item = itemMap[id];
    if (!item) return;

    /* Security check: only owner can edit */
    if (!user || user.uid !== item.userId) {
      showToast("You can only edit your own items.", "error");
      return;
    }

    showEditModal(item, async (updatedData) => {
      try {
        showLoading(true);
        await updateDoc(doc(db, "items", id), {
          title:       updatedData.title,
          category:    updatedData.category,
          description: updatedData.description,
          location:    updatedData.location,
          contact:     updatedData.contact || "",
          date:        updatedData.date,
        });

        /* Update in-memory cache */
        if (_cache) {
          const idx = _cache.findIndex(i => i.id === id);
          if (idx > -1) _cache[idx] = { ..._cache[idx], ...updatedData };
        }

        showToast("Item updated successfully! ✅", "success");
        showLoading(false);

        /* Re-render the single card in place */
        const card = document.querySelector(`[data-id="${id}"]`);
        if (card && _cache) {
          const updatedItem = _cache.find(i => i.id === id);
          if (updatedItem) {
            const temp = document.createElement("div");
            temp.innerHTML = createItemCard(updatedItem, user.uid);
            const newCard = temp.firstElementChild;
            card.replaceWith(newCard);
          }
        }
      } catch (err) {
        console.error("editItem error:", err);
        showToast("Failed to update item: " + err.message, "error");
        showLoading(false);
      }
    });
  };
}

/* ============================================================
   CONFIRMATION DIALOG
   ============================================================ */
function showConfirmDialog(title, message, onConfirm) {
  /* Remove any existing dialog */
  document.querySelector(".confirm-dialog")?.remove();

  const dialog = document.createElement("div");
  dialog.className = "confirm-dialog";
  dialog.innerHTML = `
    <div class="confirm-box">
      <h3>⚠️ ${title}</h3>
      <p>${message}</p>
      <div class="confirm-actions">
        <button class="btn-confirm-cancel">Cancel</button>
        <button class="btn-confirm-delete">Delete</button>
      </div>
    </div>`;
  document.body.appendChild(dialog);

  requestAnimationFrame(() => dialog.classList.add("open"));

  dialog.querySelector(".btn-confirm-cancel").addEventListener("click", () => {
    dialog.classList.remove("open");
    setTimeout(() => dialog.remove(), 300);
  });
  dialog.querySelector(".btn-confirm-delete").addEventListener("click", () => {
    dialog.classList.remove("open");
    setTimeout(() => dialog.remove(), 300);
    onConfirm();
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      dialog.classList.remove("open");
      setTimeout(() => dialog.remove(), 300);
    }
  });
}

/* ============================================================
   EDIT MODAL
   ============================================================ */
function showEditModal(item, onSave) {
  document.querySelector(".edit-modal-overlay")?.remove();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay edit-modal-overlay open";
  overlay.innerHTML = `
    <div class="modal" style="max-width:540px;">
      <div class="modal-header">
        <h2 class="modal-title">✏️ Edit Item</h2>
        <button class="modal-close" id="edit-modal-close" aria-label="Close">✕</button>
      </div>
      <form id="edit-item-form" novalidate>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Item Name *</label>
            <input type="text" id="edit-title" class="form-input" value="${item.title || ""}" required maxlength="80">
            <div class="form-error" id="edit-title-error"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select id="edit-category" class="form-select" required>
              <option value="">Select category</option>
              ${["Electronics","Bags","Keys","Wallets","Pets","Jewelry","Clothing","Accessories","Documents","Sports","Other"]
                .map(c => `<option ${c === item.category ? "selected" : ""}>${c}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description *</label>
          <textarea id="edit-description" class="form-textarea" required maxlength="1000">${item.description || ""}</textarea>
          <div class="form-error" id="edit-desc-error"></div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Location *</label>
            <input type="text" id="edit-location" class="form-input" value="${item.location || ""}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Date *</label>
            <input type="date" id="edit-date" class="form-input" value="${item.date || ""}" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Contact Info (optional)</label>
          <input type="text" id="edit-contact" class="form-input" value="${item.contact || ""}">
        </div>
        <button type="submit" class="btn-submit">💾 Save Changes</button>
      </form>
    </div>`;
  document.body.appendChild(overlay);

  overlay.querySelector("#edit-modal-close").addEventListener("click", () => {
    overlay.remove();
  });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  overlay.querySelector("#edit-item-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const title       = overlay.querySelector("#edit-title").value.trim();
    const category    = overlay.querySelector("#edit-category").value;
    const description = overlay.querySelector("#edit-description").value.trim();
    const location    = overlay.querySelector("#edit-location").value.trim();
    const date        = overlay.querySelector("#edit-date").value;
    const contact     = overlay.querySelector("#edit-contact").value.trim();

    let hasError = false;
    if (!title || title.length < 3) {
      overlay.querySelector("#edit-title-error").textContent = "Title must be at least 3 characters";
      hasError = true;
    }
    if (!description || description.length < 10) {
      overlay.querySelector("#edit-desc-error").textContent = "Description must be at least 10 characters";
      hasError = true;
    }
    if (hasError) return;

    overlay.remove();
    onSave({ title, category, description, location, date, contact });
  });
}

/* ============================================================
   RENDER FULL ITEMS GRID
   ============================================================ */
export async function renderItemsGrid(containerId, type = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = skeletons(6);

  const items = await fetchItems(type);
  window._allItems = items;

  const map = {};
  items.forEach(i => (map[i.id] = i));
  setupActions(map);

  const currentUserId = auth.currentUser?.uid || null;

  if (items.length === 0) {
    container.innerHTML = emptyState(type);
    return;
  }

  container.innerHTML = items.map(item => createItemCard(item, currentUserId)).join("");
}

/* ============================================================
   RENDER RECENT PREVIEW (home page)
   ============================================================ */
export async function renderRecentPreview(lostId, foundId, limit = 3) {
  const all   = await fetchItems();
  window._allItems = all;

  const lost  = all.filter(i => i.type === "lost").slice(0, limit);
  const found = all.filter(i => i.type === "found").slice(0, limit);

  const map = {};
  all.forEach(i => (map[i.id] = i));
  setupActions(map);

  const currentUserId = auth.currentUser?.uid || null;

  const lostContainer  = document.getElementById(lostId);
  const foundContainer = document.getElementById(foundId);

  if (lostContainer) {
    lostContainer.innerHTML = lost.length
      ? lost.map(item => createItemCard(item, currentUserId)).join("")
      : '<p style="color:var(--text-muted);text-align:center;padding:2rem">No lost items posted yet</p>';
  }
  if (foundContainer) {
    foundContainer.innerHTML = found.length
      ? found.map(item => createItemCard(item, currentUserId)).join("")
      : '<p style="color:var(--text-muted);text-align:center;padding:2rem">No found items posted yet</p>';
  }
}

/* ============================================================
   SEARCH & FILTER
   ============================================================ */
export function setupSearchAndFilter(containerId, searchId, categoryId, typeId) {
  const searchEl   = document.getElementById(searchId);
  const categoryEl = document.getElementById(categoryId);
  const typeEl     = document.getElementById(typeId);

  const apply = () => {
    const sv  = searchEl?.value.toLowerCase()   || "";
    const cv  = categoryEl?.value.toLowerCase() || "";
    const tv  = typeEl?.value || "";

    const cards   = document.querySelectorAll(`#${containerId} .item-card`);
    let   visible = 0;

    cards.forEach(card => {
      const title    = card.dataset.title    || "";
      const desc     = card.dataset.desc     || "";
      const category = card.dataset.category || "";
      const type     = card.dataset.type     || "";

      const ok = (!sv || title.includes(sv) || desc.includes(sv))
              && (!cv || category === cv)
              && (!tv || type === tv);

      card.style.display = ok ? "" : "none";
      if (ok) visible++;
    });

    const existing = document.querySelector(`#${containerId} .no-results`);
    if (visible === 0 && !existing) {
      const el = document.createElement("div");
      el.className = "empty-state no-results";
      el.style.gridColumn = "1 / -1";
      el.innerHTML = `<span class="empty-icon">🔍</span>
                      <h3>No results found</h3>
                      <p>Try adjusting your search or filters</p>`;
      document.getElementById(containerId)?.appendChild(el);
    } else if (visible > 0 && existing) {
      existing.remove();
    }
  };

  searchEl?.addEventListener("input",  apply);
  categoryEl?.addEventListener("change", apply);
  typeEl?.addEventListener("change", apply);
}

/* ============================================================
   HELPERS
   ============================================================ */
function skeletons(n) {
  return `<div class="loading-grid">${Array.from({ length: n }, () =>
    '<div class="skeleton-card"></div>').join("")}</div>`;
}

function emptyState(type) {
  return `<div class="empty-state" style="grid-column:1/-1">
    <span class="empty-icon">🔍</span>
    <h3>No items found</h3>
    <p>Be the first to post a ${type || "lost or found"} item!</p>
  </div>`;
}
