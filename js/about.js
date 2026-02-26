/* ============================================================
   js/about.js
   About page — auth, common setup only
   ============================================================ */

import { initCommon, initAuthObserver } from "./auth.js";

initCommon();
initAuthObserver();   // just handles navbar — no page-specific callback needed
