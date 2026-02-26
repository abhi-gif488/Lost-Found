/* ============================================================
   js/render.js
   Fetch, render and filter item cards.

   ROOT-CAUSE FIX:
   Using  where('type','==',x) + orderBy('createdAt','desc')
   requires a Firestore composite index.  Without that index
   Firestore throws → catch falls back to mock data →
   lost.html / found.html show demo items instead of real posts.

   Solution: always fetch ALL items with a single orderBy query
   (no composite index needed), then filter on the client side.
   ============================================================ */

import {
  db, collection, getDocs, query, orderBy
} from "./firebase-config.js";
import { downloadItemText, downloadItemImage } from "./upload.js";

// INTERNAL CACHE  (one network call per page load)

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

/** Invalidate cache (call after posting a new item) */
export function clearItemCache() { _cache = null; }


   //PUBLIC FETCH  (type = 'lost' | 'found' | null = all)
   
export async function fetchItems(type = null) {
  const all = await getAllItems();
  return type ? all.filter(i => i.type === type) : all;
}


   //MOCK DATA (shown when Firebase not yet configured)
   
function getMockItems() {
  return [
    {
      id: "m1", type: "lost",  title: "Blue Backpack",        category: "Bags",
      description: "Navy blue Jansport backpack with laptop sleeve and a small red car keychain.",
      location: "Central Park, NYC",     date: "2025-01-15",
      image: null, userEmail: "alex@example.com", userName: "Alex Johnson", contact: "alex@example.com"
    },
    {
      id: "m2", type: "lost",  title: "iPhone 15 Pro",        category: "Electronics",
      description: "Space gray iPhone 15 Pro with cracked screen protector and a clear case.",
      location: "Downtown Library",      date: "2025-01-18",
      image: null, userEmail: "sarah@example.com", userName: "Sarah M.", contact: "sarah@example.com"
    },
    {
      id: "m3", type: "lost",  title: "Golden Retriever",     category: "Pets",
      description: "Female golden retriever, 3 years old, wearing a red collar with name tags.",
      location: "Riverside Park",        date: "2025-01-20",
      image: null, userEmail: "mike@example.com",  userName: "Mike Chen",  contact: "mike@example.com"
    },
    {
      id: "m4", type: "found", title: "Silver Keys",          category: "Keys",
      description: "A set of silver keys with a Toyota fob and one apartment key, near the bus stop.",
      location: "Oak Street Bus Stop",   date: "2025-01-16",
      image: null, userEmail: "emma@example.com",  userName: "Emma Davis", contact: "emma@example.com"
    },
    {
      id: "m5", type: "found", title: "Black Leather Wallet", category: "Wallets",
      description: "Black leather wallet with cards (no cash). Found near the city square fountain.",
      location: "City Square Fountain",  date: "2025-01-19",
      image: null, userEmail: "james@example.com", userName: "James Wilson", contact: "james@example.com"
    },
    {
      id: "m6", type: "found", title: "Prescription Glasses", category: "Accessories",
      description: "Brown tortoiseshell prescription glasses inside a black hard case.",
      location: "Coffee House Café",     date: "2025-01-21",
      image: null, userEmail: "priya@example.com", userName: "Priya Patel", contact: "priya@example.com"
    }
  ];
}


   //HELPERS
   
const CATEGORY_ICONS = {
  Electronics: "📱", Bags: "🎒", Keys: "🔑", Wallets: "👛",
  Pets: "🐾", Jewelry: "💍", Clothing: "👕", Accessories: "👓",
  Documents: "📄", Sports: "⚽", Other: "📦"
};

/**
 * Resolve image URL — handles every format the data may be stored in:
 *   item.imageURL        = "https://..."   (old flat-string field)
 *   item.image           = "https://..."   (string stored directly)
 *   item.image.url       = "https://..."   (current object format)
 */
function resolveImageURL(item) {
  if (!item) return null;
  // Legacy flat field
  if (item.imageURL && typeof item.imageURL === "string") return item.imageURL;
  if (!item.image) return null;
  if (typeof item.image === "string") return item.image;
  if (typeof item.image === "object" && item.image.url) return item.image.url;
  return null;
}


//   ITEM CARD HTML

export function createItemCard(item) {
  const icon      = CATEGORY_ICONS[item.category] || "📦";
  const typeColor = item.type === "lost" ? "var(--lost-color)" : "var(--found-color)";
  const typeLabel = item.type === "lost" ? "LOST" : "FOUND";
  const imageURL  = resolveImageURL(item);
  const imgSrc    = imageURL ||
    `https://placehold.co/400x240/1e293b/94a3b8?text=${encodeURIComponent(icon + " " + (item.title || "Item"))}`;

  const userAvatar = item.userPhoto ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(item.userName || "U")}&background=6366f1&color=fff&size=32`;

  return `
    <div class="item-card"
         data-id="${item.id}"
         data-type="${item.type}"
         data-category="${(item.category || "").toLowerCase()}"
         data-title="${(item.title || "").toLowerCase()}"
         data-desc="${(item.description || "").toLowerCase()}">
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
              onclick="window._lf.contact('${item.userEmail}','${item.title.replace(/'/g,"\\'")}')">
              Contact
            </button>
            <button class="btn-download-icon" title="Download details"
              onclick="window._lf.download('${item.id}')">⬇</button>
          </div>
        </div>
      </div>
    </div>`;
}


  // SETUP GLOBAL ITEM ACTIONS
  
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

  window._lf.downloadImage = (id) => {
    const item = itemMap[id];
    if (item) downloadItemImage(resolveImageURL(item), item.title);
  };
}


 //  RENDER FULL ITEMS GRID
 
export async function renderItemsGrid(containerId, type = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = skeletons(6);

  const items = await fetchItems(type);
  window._allItems = items;              // expose for stats

  const map = {};
  items.forEach(i => (map[i.id] = i));
  setupActions(map);

  if (items.length === 0) {
    container.innerHTML = emptyState(type);
    return;
  }

  container.innerHTML = items.map(createItemCard).join("");
}

//  RENDER RECENT PREVIEW (home page)
 
export async function renderRecentPreview(lostId, foundId, limit = 3) {
  const all   = await fetchItems();
  window._allItems = all;                // expose for stats

  const lost  = all.filter(i => i.type === "lost").slice(0, limit);
  const found = all.filter(i => i.type === "found").slice(0, limit);

  const map = {};
  all.forEach(i => (map[i.id] = i));
  setupActions(map);

  const lostContainer  = document.getElementById(lostId);
  const foundContainer = document.getElementById(foundId);

  if (lostContainer) {
    lostContainer.innerHTML = lost.length
      ? lost.map(createItemCard).join("")
      : '<p class="no-preview" style="color:var(--text-muted);text-align:center;padding:2rem">No lost items posted yet</p>';
  }
  if (foundContainer) {
    foundContainer.innerHTML = found.length
      ? found.map(createItemCard).join("")
      : '<p class="no-preview" style="color:var(--text-muted);text-align:center;padding:2rem">No found items posted yet</p>';
  }
}

// SEARCH & FILTER
  
export function setupSearchAndFilter(containerId, searchId, categoryId, typeId) {
  const searchEl   = document.getElementById(searchId);
  const categoryEl = document.getElementById(categoryId);
  const typeEl     = document.getElementById(typeId);

  const apply = () => {
    const sv  = searchEl?.value.toLowerCase()  || "";
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

    // No-results message
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

 //  HELPERS
 
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
