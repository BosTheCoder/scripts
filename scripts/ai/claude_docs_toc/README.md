# Claude Docs floating table of contents

A tiny Chrome extension that adds a collapsible **Contents** panel to Claude Docs (`claude.ai/code/artifact/...`). It lists the doc's H1–H3 headings. Click one to jump to it. The panel highlights the section you're reading and updates as the doc changes. It opens by default on wide screens.

## Install (Chrome, Edge, Brave)

1. Open `edge://extensions` (or `chrome://extensions`) and turn on **Developer mode**. In Edge it's in the left sidebar.
2. Click **Load unpacked** and choose this folder. From Windows, the WSL path is:
   `\\wsl.localhost\Ubuntu-24.04\home\bosire\projects\personal\scripts\scripts\ai\claude_docs_toc`
3. Reload any open Claude Doc.

To update, `git pull`, then click the reload icon on the extension's card.

## Why an extension and not a Violentmonkey script

A Claude Doc is nested two iframes deep:

```
claude.ai
└─ iframe  <doc-id>.frame.claudeusercontent.com   (the viewer)
   └─ iframe  about:srcdoc, sandbox="allow-scripts"   (the editor: .ProseMirror, h1–h3)
```

The headings only exist in the inner editor frame. It has an opaque origin and an `about:srcdoc` URL, and Violentmonkey deliberately doesn't inject into those frames. Its source says "we don't inject there". The viewer frame can't reach into the editor either, because of the sandbox. An extension content script with `match_origin_as_fallback` is the one thing that runs inside it.

## Check after editing

```
npm i --no-save playwright-core && node check.mjs
```

This loads the extension in a real Chromium against a replica of the two-frame setup, with the editor's CSP. It then checks the heading list, the jump position and the highlight. It needs a Playwright Chromium in `~/.cache/ms-playwright`.
