const API_KEY = "AIzaSyBxdqBXqOxLYWbDacq3IXjV9cD7hdm80Ek"; // Replace with your real key

document.getElementById("extractBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: extractCleanProblemStatement,
    },
    async (results) => {
      const problemText = results[0].result;
      document.getElementById("output").innerText =
        "Simplifying with Gemini...";

      try {
        const simplified = await sendToGemini(problemText);
        document.getElementById("output").innerHTML = formatGeminiOutput(simplified);

      } catch (err) {
        document.getElementById("output").innerText = "Error: " + err.message;
      }
    }
  );
});


function formatGeminiOutput(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") // Convert **bold** to <b>bold</b>
    .replace(/\n/g, "<br>") // New lines -> <br>
    .replace(/ {2}/g, "&nbsp;&nbsp;"); // Preserve spaces
}

function extractCleanProblemStatement() {
  const container = document.querySelector(".problem-statement");
  if (!container) return "Problem not found.";
  const clone = container.cloneNode(true);
  clone
    .querySelectorAll("sup, sub, .tex-font-style, .MathJax, .mjx-chtml")
    .forEach((el) => el.remove());

  const cleanText = clone.innerText
    .replace(/[†‡*]/g, "")
    .replace(/\n{2,}/g, "\n")
    .replace(/[^\x00-\x7F]+/g, "")
    .replace(/ +/g, " ")
    .trim();

  return cleanText;
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

  console.log("Gemini API response:", data);

  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "Gemini didn't respond."
  );
}
