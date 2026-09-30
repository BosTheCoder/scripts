# Claude Docs floating table of contents

Violentmonkey userscript that adds a collapsible **Contents** panel to Claude Docs (`claude.ai/code/artifact/...`). It lists the doc's H1–H3 headings. Click one to jump to it. The panel highlights the section you're reading and updates as the doc changes.

## Install

With Violentmonkey installed, open the raw file and click **Confirm installation**:

https://raw.githubusercontent.com/BosTheCoder/scripts/main/scripts/ai/claude_docs_toc/claude_docs_toc.user.js

Because the script has `@updateURL`, Violentmonkey picks up new versions pushed to `main`. Bump `@version` when you change it.

## How it works

A Claude Doc isn't rendered on claude.ai itself. It loads in an iframe on `<doc-id>.frame.claudeusercontent.com`, so the script matches `*.claudeusercontent.com`. It only activates on pages with a `.ProseMirror` editor containing at least two headings, so other artifacts are left alone.

## Check after editing

Run `python3 -m http.server` in this folder and open `demo.html`. The comment at the top of that file says what you should see.
