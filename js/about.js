/* js/about.js
   About page — auth observer + FAQ accordion
   */

import { initCommon, initAuthObserver } from "./auth.js";

initCommon();
initAuthObserver();   /* handles navbar auth state */

/* 
   FAQ ACCORDION
   Clicking a question toggles its answer panel open/closed.
   Only one item is open at a time (accordion behaviour).
   */
  
(function initFAQ() {
  const list = document.getElementById("faq-list");
  if (!list) return;

  const items = list.querySelectorAll(".faq-item");

  items.forEach((item) => {
    const btn    = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    if (!btn || !answer) return;

    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");

      /* Close every other item first */
      items.forEach((other) => {
        if (other !== item) {
          other.classList.remove("open");
          const otherBtn = other.querySelector(".faq-question");
          if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
        }
      });

      /* Toggle this one */
      item.classList.toggle("open", !isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));
    });

    /* Keyboard: allow Enter / Space to toggle */
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        btn.click();
      }
    });
  });
}());
