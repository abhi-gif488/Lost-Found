//  Submit user feedback to Firestore
 

import {
  auth, db, collection, addDoc, serverTimestamp
} from "./firebase-config.js";
import { showToast } from "./auth.js";

/**
 * Submit a feedback document.
 * @param {{ message: string, rating: number }} data
 * @returns {Promise<string|null>} document ID or null on failure
 */
export async function submitFeedback(data) {
  const user = auth.currentUser;
  if (!user) {
    showToast("Please sign in to leave feedback", "error");
    return null;
  }

  if (!data.message || data.message.trim().length < 5) {
    showToast("Please write a bit more in your feedback", "error");
    return null;
  }

  try {
    const docRef = await addDoc(collection(db, "feedback"), {
      userId:    user.uid,
      userEmail: user.email,
      userName:  user.displayName || user.email.split("@")[0],
      userPhoto: user.photoURL || "",
      message:   data.message.trim(),
      rating:    data.rating || 5,
      createdAt: serverTimestamp()
    });

    showToast("Feedback submitted — thank you! 🙏", "success");
    return docRef.id;
  } catch (err) {
    console.error("submitFeedback:", err);
    showToast("Error submitting feedback: " + err.message, "error");
    return null;
  }
}
