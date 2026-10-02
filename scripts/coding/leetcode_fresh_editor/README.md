# LeetCode Fresh Editor

Opens every LeetCode problem on the default template instead of code you wrote before. That way an old solution, or even its length, can't bias a re-attempt.

## Install (Edge, Chrome, Brave)

1. Open `edge://extensions` and turn on **Developer mode**. In Edge it's in the left sidebar.
2. Click **Load unpacked** and choose this folder. From Windows, the WSL path is:
   `\\wsl.localhost\Ubuntu-24.04\home\bosire\projects\personal\scripts\scripts\coding\leetcode_fresh_editor`

To update, `git pull`, then click the reload icon on the extension's card.

**Violentmonkey instead:** open the [raw script](https://raw.githubusercontent.com/BosTheCoder/scripts/main/scripts/coding/leetcode_fresh_editor/leetcode_fresh_editor.user.js) to install it (it auto-updates). It's untested in Violentmonkey. If old code still shows, use the extension. Don't run both.

## How it works

LeetCode fills the editor from two places (checked 2026-10-02):

1. **Cloud:** the `syncedCode(questionId, lang)` GraphQL query (sent via XHR) arrives about 1s after load and replaces the template.
2. **Local:** IndexedDB `LeetCode-problems` → store `problem_code`, key `{questionId}_{userId}_{lang}`.

The script runs before the page loads. It sends the cloud query for question 0 (the server returns `null`) and points the IndexedDB read at a key that doesn't exist. Nothing is deleted. Old code stays in the cloud and in Submissions until you type, and then LeetCode's autosave overwrites it.

**Mid-solve reloads are safe.** After your first keypress or paste in a problem's editor, that tab stops hiding saved code for that problem (marker kept in `sessionStorage`). A new tab starts fresh.

## Verified (Playwright, signed-in Chromium, 2026-10-02)

| Case | Without | With script |
| --- | --- | --- |
| New tab, cloud holds a 422-char solution | 422 chars shown | template |
| In-app navigation to a solved problem (cloud 623 chars) | — | template |
| Local IndexedDB draft seeded | draft shown | template |
| Typed, then reloaded the same tab | — | typed code kept |
| Opening a problem with the script | — | cloud copy untouched |
| Unpacked MV3 extension in Chromium 154 | — | XHR and IndexedDB patched in page |

## Known gaps

- If you've typed in a problem in this tab, switching language loads that language's saved code too. The marker is per problem, not per language.
- The Submissions tab and the "Solved" badge still show past attempts.
- If LeetCode renames `syncedCode` or the `problem_code` store, the script stops working silently. To check, open a solved problem: if old code shows, it's broken.
