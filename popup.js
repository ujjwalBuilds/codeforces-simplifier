document.getElementById("extractBtn").addEventListener("click", async () => {
  const spinner = document.getElementById("spinner");
  const outputDiv = document.getElementById("output");
  const copyBtn = document.getElementById("copyBtn");

  spinner.style.display = "block";
  outputDiv.innerHTML = "";
  copyBtn.style.display = "none";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: extractCleanProblemStatement,
    },
    async (results) => {
      const problemText = results[0].result;

      try {
        const simplified = await sendToGemini(problemText);
        spinner.style.display = "none";
        outputDiv.innerHTML = formatGeminiOutput(simplified);
        copyBtn.style.display = "inline-block";

        copyBtn.onclick = () => {
          navigator.clipboard.writeText(simplified);
          copyBtn.innerText = "Copied!";
          setTimeout(() => (copyBtn.innerText = "Copy to Clipboard"), 2000);
        };
      } catch (err) {
        spinner.style.display = "none";
        outputDiv.innerText = "Error: " + err.message;
      }
    }
  );
});

function extractCleanProblemStatement() {
  const container = document.querySelector(".problem-statement");
  if (!container) return "Problem not found.";
  const clone = container.cloneNode(true);
  clone
    .querySelectorAll("sup, sub, .tex-font-style, .MathJax, .mjx-chtml")
    .forEach((el) => el.remove());

  return clone.innerText
    .replace(/[†‡*]/g, "")
    .replace(/\n{2,}/g, "\n")
    .replace(/[^\x00-\x7F]+/g, "")
    .replace(/ +/g, " ")
    .trim();
}

async function sendToGemini(problemText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  const prompt = `
You are a helpful assistant for competitive programmers.

Given the following Codeforces problem statement:
---
${problemText}
---

1. 🔹 Give a 2-3 line summary in simple English.
2. 🔸 Translate the full statement into Hinglish (mix of Hindi + English).
`;

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "Gemini didn't respond."
  );
}

function formatGeminiOutput(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") // bold markdown
    .replace(/\n/g, "<br>") // line breaks
    .replace(/ {2}/g, "&nbsp;&nbsp;"); // preserve spacing
}
