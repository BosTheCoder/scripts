Sure! Here's a concise and clear `README.md` for your **NeetCode Blind Practice Mode** userscript:

---

# NeetCode Blind Practice Mode Userscript

This userscript modifies the [NeetCode.io](https://neetcode.io) problem list to support **blind practice** mode by hiding problem categories and difficulty levels, and shuffling all visible questions into a single list.

## ✨ Features

* ✅ **Merges** all category tables into a single list.
* 🔀 **Shuffles** problems to remove bias and mimic interview scenarios.
* 🧼 **Hides** category titles (e.g. "Arrays", "Graphs") and the **Difficulty** column.
* ♻️ Supports **Single Page App (SPA)** navigation — works as you browse different NeetCode pages.
* 🧠 Optimized to avoid infinite loops or browser slowdowns.

## 💻 Installation

1. Install a userscript manager:

   * [Tampermonkey (recommended)](https://tampermonkey.net/)
   * [Violentmonkey](https://violentmonkey.github.io/)

2. Create a new userscript and paste in the contents of [`neetcode-blind-mode.user.js`](./neetcode-blind-mode.user.js).

3. Save the script and visit [https://neetcode.io/](https://neetcode.io/). The problem list will automatically update after the page loads.

## 🔁 How it Works

* The script waits for NeetCode’s tables to be fully rendered.
* Then it:

  * Removes category headers.
  * Merges all problems into one table.
  * Randomizes the order.
  * Hides the difficulty column for every problem.
* The script reruns only when the URL changes inside the site — safe for NeetCode’s dynamic navigation.

## ⚠️ Notes

* This script is built for the structure of NeetCode as of **2025**. If the site changes, the script may require updates.
* If the script fails or the page goes blank, remove older versions to avoid conflicts and make sure only **one version** of the script is active.

## 🛠 Development

To make changes or debug:

* Open the NeetCode site.
* Use `console.log()` within the script and inspect the DOM to ensure selectors are still valid.
* Reload the page or trigger navigation within the site to see script behavior.

## 📄 License

MIT License — free to use, modify, and share.

---

Would you like me to also generate a standalone `.user.js` file and folder structure suitable for GitHub?
