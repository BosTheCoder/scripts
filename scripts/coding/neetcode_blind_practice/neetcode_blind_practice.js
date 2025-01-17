// ==UserScript==
// @name         NeetCode blind-practice mode (stable)
// @namespace    https://neetcode.io
// @version      1.2
// @description  Hide category headers & difficulty; combine + shuffle tables. SPA-safe, no infinite loops.
// @match        https://neetcode.io/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(() => {
    /* ───────── constants ───────── */
    const FLAG   = 'nc-blindified';   // set on <body> after we finish
    const DELAY  = 60;                // debounce, ms
    let   timer  = null;              // scheduleBlindify() handle
    let   tablesCachePath = '';       // remember which URL we processed

    /* ───────── utilities ───────── */

    const shuffle = (a) => {           // Fisher-Yates
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
    };

    const hideDifficulty = (table) => {
      const ths = Array.from(table.querySelectorAll('thead th'));
      const idx = ths.findIndex(th =>
        th.textContent.trim().startsWith('Difficulty')
      );
      if (idx === -1) return;
      ths[idx].style.display = 'none';
      table.querySelectorAll('tbody tr').forEach(tr => {
        if (tr.children[idx]) tr.children[idx].style.display = 'none';
      });
    };

    /* ───────── main work ───────── */

    const blindify = () => {
      if (document.body.classList.contains(FLAG)) return;           // already done
      const tables = Array.from(document.querySelectorAll('app-table table'));
      if (tables.length === 0) return;                              // not ready

      /* 1️⃣ hide the “Graphs / Linked List …” headers */
      document.querySelectorAll('app-table .my-table-container > p')
              .forEach(p => (p.style.display = 'none'));

      /* 2️⃣ merge & shuffle rows */
      const masterBody = tables[0].querySelector('tbody');
      const rows = tables.flatMap(t => Array.from(t.querySelector('tbody').rows));
      shuffle(rows);
      rows.forEach(r => masterBody.appendChild(r));
      tables.slice(1).forEach(t => t.closest('app-table').remove());

      /* 3️⃣ hide Difficulty column */
      hideDifficulty(tables[0]);

      /* done */
      document.body.classList.add(FLAG);
      tablesCachePath = location.pathname;
    };

    /* ───────── scheduling ───────── */

    const scheduleBlindify = () => {
      clearTimeout(timer);
      timer = setTimeout(blindify, DELAY);
    };

    /* ───────── react to SPA nav ───────── */

    /* run once right away (after Angular’s first paint) */
    scheduleBlindify();

    /* observe big DOM mutations just until we blindify successfully */
    const observer = new MutationObserver(scheduleBlindify);
    observer.observe(document.body, {childList: true, subtree: true});

    /* watch for path changes (pushState / popstate) and reset the flag */
    const resetAndRun = () => {
      if (location.pathname === tablesCachePath) return;
      document.body.classList.remove(FLAG);
      scheduleBlindify();
    };

    /* hijack pushState / replaceState */
    ['pushState', 'replaceState'].forEach(fn => {
      const orig = history[fn];
      history[fn] = function () {
        const result = orig.apply(this, arguments);
        resetAndRun();
        return result;
      };
    });

    window.addEventListener('popstate', resetAndRun);
  })();
