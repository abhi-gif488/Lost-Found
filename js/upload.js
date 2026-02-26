/* ============================================================
   js/upload.js
   Item submission, image upload, form validation, downloads
   ============================================================ */

import {
  auth, db, storage,
  collection, addDoc, serverTimestamp,
  storageRef, uploadBytes, getDownloadURL
} from "./firebase-config.js";
import { showToast, showLoading } from "./auth.js";

/* ============================================================
   SUBMIT ITEM TO FIRESTORE + STORAGE
   ============================================================ */
export async function submitItem(formData, imageFile) {
  const user = auth.currentUser;
  if (!user) {
    showToast("Please sign in to post items", "error");
    return null;
  }

  try {
    showLoading(true);

    let imageData = null;

    // ---- Image upload ----
    if (imageFile) {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowed.includes(imageFile.type)) {
        showToast("Only JPG, PNG, WEBP or GIF images are allowed", "error");
        showLoading(false);
        return null;
      }
      if (imageFile.size > 5 * 1024 * 1024) {
        showToast("Image must be under 5 MB", "error");
        showLoading(false);
        return null;
      }

      const path = `items/${user.uid}/${Date.now()}_${imageFile.name}`;
      const ref  = storageRef(storage, path);
     const url = await uploadImageToCloudinary(imageFile);

      imageData = {
        url,
        name: imageFile.name,
        size: imageFile.size,
        type: imageFile.type
      };
    }

    // ---- Firestore write ----
    const docRef = await addDoc(collection(db, "items"), {
      userId:      user.uid,
      userEmail:   user.email,
      userName:    user.displayName || user.email.split("@")[0],
      userPhoto:   user.photoURL || "",
      type:        formData.type,
      title:       formData.title,
      category:    formData.category,
      description: formData.description,
      location:    formData.location,
      contact:     formData.contact || "",
      date:        formData.date || new Date().toISOString().split("T")[0],
      image:       imageData,         // { url, name, size, type } or null
      createdAt:   serverTimestamp(),
      status:      "active"
    });

    showToast("Item posted successfully! 🎉", "success");
    showLoading(false);
    return docRef.id;

  } catch (error) {
    console.error("submitItem error:", error);
    showToast(error.message || "Failed to post item", "error");
    showLoading(false);
    return null;
  }
}

/* ============================================================
   IMAGE PREVIEW
   ============================================================ */
export function setupImagePreview(inputId, previewId) {
  const input   = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!input || !preview) return;

  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5 MB", "error");
      input.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      preview.src           = ev.target.result;
      preview.style.display = "block";
      const area = preview.closest(".upload-area");
      if (area) area.classList.add("has-image");
    };
    reader.readAsDataURL(file);
  });
}

/* ============================================================
   DRAG-AND-DROP SUPPORT
   ============================================================ */
export function setupDragDrop(areaId, inputId) {
  const area  = document.getElementById(areaId);
  const input = document.getElementById(inputId);
  if (!area || !input) return;

  ["dragenter", "dragover"].forEach(ev =>
    area.addEventListener(ev, (e) => { e.preventDefault(); area.classList.add("dragging"); })
  );
  ["dragleave", "drop"].forEach(ev =>
    area.addEventListener(ev, () => area.classList.remove("dragging"))
  );
  area.addEventListener("drop", (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length) {
      input.files = files;
      input.dispatchEvent(new Event("change"));
    }
  });
}

/* ============================================================
   FORM VALIDATION
   ============================================================ */
export function validateItemForm(formData) {
  const errors = [];
  if (!formData.title || formData.title.trim().length < 3)
    errors.push("Title must be at least 3 characters");
  if (!formData.category)
    errors.push("Please select a category");
  if (!formData.description || formData.description.trim().length < 10)
    errors.push("Description must be at least 10 characters");
  if (!formData.location || formData.location.trim().length < 2)
    errors.push("Location is required");
  if (!formData.date)
    errors.push("Date is required");
  return errors;
}

/* ============================================================
   DOWNLOAD ITEM AS TEXT FILE
   ============================================================ */
export function downloadItemText(item) {
  const content = `COMMUNITY LOST & FOUND PORTAL
==============================
Type        : ${item.type.toUpperCase()}
Title       : ${item.title}
Category    : ${item.category}
Description : ${item.description}
Location    : ${item.location}
Date        : ${item.date}
Contact     : ${item.contact || item.userEmail}
Posted by   : ${item.userName}
==============================
Retrieved from Community Lost & Found Portal`.trim();

  const blob = new Blob([content], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${item.type}_${item.title.replace(/\s+/g, "_")}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("Details downloaded!", "success");
}

/* ============================================================
   DOWNLOAD ITEM IMAGE
   ============================================================ */
export function downloadItemImage(imageURL, title) {
  if (!imageURL) {
    showToast("No image available to download", "error");
    return;
  }
  const a    = document.createElement("a");
  a.href     = imageURL;
  a.download = `${title.replace(/\s+/g, "_")}.jpg`;
  a.target   = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast("Image downloading…", "success");
}
/* ============================================================
   CLOUDINARY IMAGE UPLOAD
   ============================================================ */
export async function uploadImageToCloudinary(file) {

  if (!file) {
    showToast("No image selected", "error");
    return null;
  }

  try {
    showLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "lostfound"); // replace this
    formData.append("cloud_name", "di8plx6l2");       // optional

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/di8plx6l2/image/upload",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Upload failed");
    }

    showToast("Image uploaded successfully! 🎉", "success");
    showLoading(false);

    return data.secure_url;   // return Cloudinary image URL

  } catch (error) {
    console.error("Cloudinary upload error:", error);
    showToast("Image upload failed", "error");
    showLoading(false);
    return null;
  }
}
