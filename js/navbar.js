/**
 * js/navbar.js — Load & initialize the shared navbar
 *
 * Fetches navbar.html, injects it, sets the active link,
 * wires up mobile menu, and wires theme toggle.
 * Auth state is managed separately in auth.js via updateNavbar().
 */

(function () {
  'use strict';

  /* Apply theme IMMEDIATELY to avoid flash — before any HTML renders */
  try {
    var saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  /* Determine the current page filename for active link highlighting */
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  if (currentPage === '') currentPage = 'index.html';

  /* Fetch and inject the navbar */
  fetch('navbar.html')
    .then(function (r) { return r.text(); })
    .then(function (html) {
      var container = document.getElementById('navbar');
      if (!container) return;
      container.innerHTML = html;
      container.style.minHeight = ''; /* remove placeholder height after load */

      /* ---- Set active link ---- */
      var links = container.querySelectorAll('.nav-links a');
      links.forEach(function (a) {
        var href = a.getAttribute('href') || '';
        if (href === currentPage || href.replace('.html','') === currentPage.replace('.html','')) {
          a.classList.add('active');
          a.setAttribute('aria-current', 'page');
        }
      });

      /* ---- Mobile hamburger toggle ---- */
      var toggle   = container.querySelector('#nav-toggle');
      var navLinks = container.querySelector('#nav-links');
      if (toggle && navLinks) {
        toggle.addEventListener('click', function () {
          var isOpen = toggle.classList.toggle('open');
          navLinks.classList.toggle('open', isOpen);
          toggle.setAttribute('aria-expanded', String(isOpen));
        });
        navLinks.querySelectorAll('a').forEach(function (a) {
          a.addEventListener('click', function () {
            toggle.classList.remove('open');
            navLinks.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
          });
        });
        /* Close on outside click */
        document.addEventListener('click', function (e) {
          if (!container.contains(e.target)) {
            toggle.classList.remove('open');
            navLinks.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
          }
        });
      }

      /* ---- Theme toggle ---- */
      var themeBtn = container.querySelector('#theme-toggle');
      if (themeBtn) {
        var theme = document.documentElement.getAttribute('data-theme') || 'dark';
        themeBtn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
        themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');

        themeBtn.addEventListener('click', function () {
          var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
          var next   = isDark ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', next);
          try { localStorage.setItem('theme', next); } catch (e) {}
          themeBtn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
          themeBtn.setAttribute('aria-label', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        });
      }

      /* ---- Enable smooth theme transitions after first render ---- */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          document.body.classList.add('theme-ready');
        });
      });

    })
    .catch(function (err) {
      console.warn('[navbar] Failed to load navbar.html:', err.message);
    });

}());
