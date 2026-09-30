// Content script for the Claude Docs TOC extension (see manifest.json).
//
// claude.ai -> iframe <doc-id>.frame.claudeusercontent.com (the viewer)
//           -> iframe about:srcdoc, sandbox="allow-scripts" (the editor)
// The editor is a Tiptap (ProseMirror) document with real <h1>-<h3>, and it
// scrolls its own window. Its opaque origin and about:srcdoc URL are why this
// can't be a userscript: Violentmonkey skips such frames, while an extension
// reaches them with match_origin_as_fallback. Frames with no .ProseMirror
// (the viewer, every other artifact) are left alone.
(() => {
  const ID = 'cd-toc';
  const LEVELS = 'h1, h2, h3';
  const OFFSET = 72; // px of sticky toolbar to clear when jumping

  let nav, head, list;
  let headings = [];
  let sig = '';

  const level = (h) => +h.tagName[1];

  // Skip widgets inside the heading (live cursors' name labels, chips' chrome).
  const text = (h) => {
    const c = h.cloneNode(true);
    c.querySelectorAll('[contenteditable="false"]').forEach((e) => e.remove());
    return c.textContent.trim();
  };

  // The doc is the editor with the most headings (a comment box is also a ProseMirror).
  const editor = () =>
    [...document.querySelectorAll('.ProseMirror')].sort(
      (a, b) => b.querySelectorAll(LEVELS).length - a.querySelectorAll(LEVELS).length,
    )[0];

  const css = `
    #${ID}{position:fixed;top:${OFFSET}px;right:16px;z-index:40;width:240px;max-height:calc(100vh - ${OFFSET + 24}px);
      overflow:auto;box-sizing:border-box;font:13px/1.4 system-ui,sans-serif;border-radius:8px;
      border:1px solid color-mix(in srgb,currentColor 18%,transparent);box-shadow:0 4px 16px rgb(0 0 0/.15)}
    #${ID}.closed{width:auto}
    #${ID}.closed ol{display:none}
    #${ID} button{all:unset;box-sizing:border-box;cursor:pointer;border-radius:4px}
    #${ID} button:focus-visible{outline:2px solid currentColor}
    #${ID} > button{display:block;padding:8px 12px;font-weight:600}
    #${ID} ol{list-style:none;margin:0;padding:0 6px 8px}
    #${ID} li button{display:block;width:100%;padding:3px 6px;opacity:.65}
    #${ID} li button:hover{opacity:1;background:color-mix(in srgb,currentColor 10%,transparent)}
    #${ID} li button.on{opacity:1;font-weight:600}
    .ProseMirror :is(${LEVELS}){scroll-margin-top:${OFFSET}px}
  `;

  const toggle = (open = nav.classList.contains('closed')) => {
    nav.classList.toggle('closed', !open);
    head.textContent = `${open ? '▾' : '▸'} Contents`;
    head.setAttribute('aria-expanded', open);
  };

  const mount = () => {
    if (!document.getElementById(`${ID}-css`)) {
      document.head.append(Object.assign(document.createElement('style'), { id: `${ID}-css`, textContent: css }));
    }
    nav = Object.assign(document.createElement('nav'), { id: ID });
    nav.setAttribute('aria-label', 'Table of contents');
    head = nav.appendChild(document.createElement('button'));
    head.onclick = () => {
      chosen = true;
      toggle();
    };
    list = nav.appendChild(document.createElement('ol'));
    document.body.append(nav);
    autoOpen();
  };

  // Open on wide screens. The editor frame can still be 0px wide when this
  // first runs, so re-decide on resize until the user picks for themselves.
  let chosen = false;
  const autoOpen = () => nav && !chosen && toggle(innerWidth >= 1100);
  addEventListener('resize', () => {
    autoOpen();
    spy();
  });

  // Match the doc's own colours so it follows the viewer's light/dark theme.
  const paint = (ed) => {
    let el = ed;
    while (el && getComputedStyle(el).backgroundColor === 'rgba(0, 0, 0, 0)') el = el.parentElement;
    nav.style.background = el ? getComputedStyle(el).backgroundColor : 'Canvas';
    nav.style.color = getComputedStyle(ed).color;
  };

  const spy = () => {
    if (!list) return;
    // Headings near the end can't scroll up to the top; at the bottom, the last visible one wins.
    const bottom = scrollY > 0 && innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
    let cur = 0;
    headings.forEach((h, i) => {
      const top = h.getBoundingClientRect().top;
      if (top <= OFFSET + 8 || (bottom && top < innerHeight)) cur = i;
    });
    list.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === cur));
  };

  const render = () => {
    const ed = editor();
    const hs = ed ? [...ed.querySelectorAll(LEVELS)].filter(text) : [];
    const next = hs.map((h) => h.tagName + text(h)).join('\n');
    // ProseMirror can swap heading nodes without changing their text, so compare identity too.
    const same = next === sig && hs.length === headings.length && hs.every((h, i) => h === headings[i]);
    if (same && (hs.length < 2 || nav?.isConnected)) return;
    sig = next;
    headings = hs;
    if (hs.length < 2) return nav?.remove();
    if (!nav?.isConnected) mount();
    paint(ed);
    const top = Math.min(...hs.map(level));
    list.replaceChildren(
      ...hs.map((h) => {
        const li = document.createElement('li');
        const b = li.appendChild(document.createElement('button'));
        b.textContent = text(h);
        b.style.paddingLeft = `${6 + (level(h) - top) * 14}px`;
        b.onclick = () => {
          h.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (innerWidth < 1100) toggle(false);
        };
        return li;
      }),
    );
    spy();
  };

  let raf;
  addEventListener(
    'scroll',
    () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(spy);
    },
    true, // the doc may scroll an inner element, and scroll doesn't bubble
  );

  // The doc loads, syncs live edits and switches tabs after page load.
  let timer;
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(render, 250);
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
  render();
})();
