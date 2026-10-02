// ==UserScript==
// @name        LeetCode Fresh Editor
// @namespace   BosTheCoder
// @version     1.0
// @description Open every LeetCode problem on the default template, not your old synced code.
// @match       https://leetcode.com/*
// @run-at      document-start
// @grant       none
// @downloadURL https://raw.githubusercontent.com/BosTheCoder/scripts/main/scripts/coding/leetcode_fresh_editor/leetcode_fresh_editor.user.js
// @updateURL   https://raw.githubusercontent.com/BosTheCoder/scripts/main/scripts/coding/leetcode_fresh_editor/leetcode_fresh_editor.user.js
// ==/UserScript==

// LeetCode shows the template, then a `syncedCode` GraphQL call (XHR today) swaps in
// whatever you last wrote. Point that call at question 0 so it comes back null and the
// template stays. Once you type in a problem, that tab keeps your work across reloads.
(() => {
  const KEY = 'lc-fresh-started:';
  const slug = () => (location.pathname.match(/^\/problems\/([^/]+)/) || [])[1];
  const started = () => !!sessionStorage.getItem(KEY + slug());

  const rewrite = body => {
    if (typeof body !== 'string' || !body.includes('syncedCode(') || started()) return body;
    try {
      const b = JSON.parse(body);
      b.variables = Object.assign({}, b.variables, { questionId: 0 });
      return JSON.stringify(b);
    } catch (e) {
      return body;
    }
  };

  const send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (body) {
    return send.call(this, rewrite(body));
  };
  // LeetCode also keeps a local draft in IndexedDB (LeetCode-problems/problem_code).
  // Read a key that doesn't exist instead; nothing is deleted.
  const get = IDBObjectStore.prototype.get;
  IDBObjectStore.prototype.get = function (key) {
    return get.call(this, this.name === 'problem_code' && !started() ? 'lc-fresh-hidden' : key);
  };
  const fetch = window.fetch;
  window.fetch = function (input, init) {
    if (init && init.body) init = Object.assign({}, init, { body: rewrite(init.body) });
    return fetch.call(this, input, init);
  };

  const markStarted = e => {
    if (slug() && e.target.closest && e.target.closest('.monaco-editor')) {
      sessionStorage.setItem(KEY + slug(), '1');
    }
  };
  document.addEventListener('keydown', markStarted, true);
  document.addEventListener('paste', markStarted, true);
})();
