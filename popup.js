document.getElementById("extractBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      function: () => {
        const div = document.querySelector(".problem-statement");
        return div ? div.innerText : "Problem not found.";
      },
    },
    (results) => {
      const output = results[0].result;
      document.getElementById("output").innerText = output;
    }
  );
});
