/**
 * js/theme.js — Theme Management
 * =========================================
 * This script is loaded as a regular (non-module) script
 * BEFORE body content to eliminate the light/dark flash.
 *
 * It also provides the theme toggle and persists preference.
 */

(function () {
  'use strict';

  /* --------------------------------------------------------
     STEP 1: Apply saved theme IMMEDIATELY (before paint)
     Called inline in <head> via the inline bootstrap snippet.
     -------------------------------------------------------- */
  function applyThemeInstant() {
    try {
      const saved = localStorage.getItem('theme') || 'dark';
      document.documentElement.setAttribute('data-theme', saved);
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  /* --------------------------------------------------------
     STEP 2: After DOM ready — wire up toggle button
     -------------------------------------------------------- */
  function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    function updateToggleAria(theme) {
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      btn.setAttribute('aria-label', theme === 'dark'
        ? 'Switch to light mode'
        : 'Switch to dark mode');
    }

    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    updateToggleAria(current);

    btn.addEventListener('click', function () {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const next   = isDark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      updateToggleAria(next);
    });
  }

  /* --------------------------------------------------------
     STEP 3: After page load — enable smooth transitions
     (prevents the transition firing on initial load)
     -------------------------------------------------------- */
  function enableTransitions() {
    // Small delay to ensure first render is done
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.body.classList.add('theme-ready');
      });
    });
  }

  /* --------------------------------------------------------
     EXPORTS on window for HTML pages to call
     -------------------------------------------------------- */
  window.ThemeManager = {
    applyInstant:   applyThemeInstant,
    initToggle:     initThemeToggle,
    enable:         enableTransitions
  };

  // Auto-apply instantly if called as a script tag in <head>
  applyThemeInstant();

  // Wire up after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initThemeToggle();
      enableTransitions();
    });
  } else {
    initThemeToggle();
    enableTransitions();
  }

}());
