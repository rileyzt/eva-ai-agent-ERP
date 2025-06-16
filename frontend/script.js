const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const messages = document.getElementById("messages");
const micBtn = document.getElementById("mic-btn");
const langSelect = document.getElementById("language-select");

function getBrowserName() {
  const userAgent = navigator.userAgent;
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg") && !userAgent.includes("Brave")) return "Chrome";
  if (userAgent.includes("Edg")) return "Edge";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Brave")) return "Brave";
  return "Unknown";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userInput = input.value.trim();
  if (!userInput) return;

  appendMessage("You", userInput, "user-message");
  input.value = "";

  const browser = getBrowserName();
  const language = langSelect.value;

  try {
    const res = await fetch("http://localhost:3000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: userInput, language, browser }),
    });

    const data = await res.json();
    const responseText = data.response;
    const isTruncated = responseText.endsWith("... (truncated)");

    if (isTruncated) {
      const fullRes = await fetch("http://localhost:3000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userInput, language, browser }),
      });
      const fullData = await fullRes.json();
      appendMessage("EVA", responseText, "eva-message", true, fullData.response, userInput);
    } else {
      appendMessage("EVA", responseText, "eva-message", false, responseText, userInput);
    }
  } catch (error) {
    appendMessage("EVA", "Something went wrong. Please try again.", "eva-message");
    console.error(error);
  }
});

function appendMessage(sender, text, className, isTruncated = false, fullText = "", originalQuery = "") {
  const msg = document.createElement("div");
  msg.classList.add("message", className);

  const textContent = document.createElement("p");
  textContent.textContent = text;
  msg.appendChild(textContent);

  const clipboardIcon = document.createElement("span");
  clipboardIcon.innerHTML = "📋";
  clipboardIcon.title = "Copy reply";
  clipboardIcon.className = "copy-icon";
  clipboardIcon.onclick = () => {
    navigator.clipboard.writeText(isTruncated ? fullText : text)
      .then(() => showToast("✅ Copied to clipboard"))
      .catch(() => showToast("❌ Copy failed"));
  };
  msg.appendChild(clipboardIcon);

  const speakIcon = document.createElement("span");
  speakIcon.innerHTML = "🔊";
  speakIcon.title = "Speak this reply";
  speakIcon.className = "copy-icon";
  speakIcon.onclick = () => {
    const utterance = new SpeechSynthesisUtterance(isTruncated ? fullText : text);
    speechSynthesis.speak(utterance);
  };
  msg.appendChild(speakIcon);

  if (isTruncated) {
    const btn = document.createElement("button");
    btn.textContent = "🔓 Show full reply";
    btn.className = "show-more-btn";
    btn.onclick = () => {
      textContent.classList.add("fade-out");
      setTimeout(() => {
        textContent.textContent = fullText;
        textContent.classList.remove("fade-out");
        textContent.classList.add("fade-in");
      }, 150);
      btn.remove();
    };
    msg.appendChild(btn);
  }

  if (sender === "EVA") {
    const regenBtn = document.createElement("button");
    regenBtn.textContent = "🔄 Regenerate";
    regenBtn.className = "show-more-btn";
    regenBtn.onclick = async () => {
      try {
        const browser = getBrowserName();
        const language = langSelect.value;
        const res = await fetch("http://localhost:3000/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: originalQuery, language, browser }),
        });
        const data = await res.json();
        msg.remove();
        appendMessage("EVA", data.response, "eva-message", false, data.response, originalQuery);
      } catch (error) {
        showToast("❌ Failed to regenerate");
      }
    };
    msg.appendChild(regenBtn);
  }

  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("fade-in");
    setTimeout(() => {
      toast.classList.remove("fade-in");
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 300);
    }, 1500);
  }, 10);
}

const browserName = getBrowserName();

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.lang = langSelect.value;
  recognition.continuous = false;
  recognition.interimResults = false;

  langSelect.addEventListener("change", () => {
    recognition.lang = langSelect.value;
  });

  micBtn.addEventListener("click", () => {
    recognition.start();
    micBtn.classList.add("listening");
    micBtn.title = "Listening...";
  });

  recognition.onresult = (event) => {
    const speechToText = event.results[0][0].transcript;
    input.value = speechToText;
    micBtn.classList.remove("listening");
    micBtn.title = "🎙️ Click to speak";
    form.requestSubmit();
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    micBtn.classList.remove("listening");
    micBtn.title = "Mic error: Try again";
  };

  recognition.onend = () => {
    micBtn.classList.remove("listening");
    micBtn.title = "🎙️ Click to speak";
  };
} else {
  micBtn.disabled = true;
  micBtn.title = `🎙️ Voice input not supported in ${browserName}. Try Chrome or Edge instead.`;
  micBtn.style.opacity = 0.6;
  console.warn(`[MIC UNSUPPORTED] Browser: ${browserName} (${navigator.userAgent})`);
}

// 🎯 EVA Agent Trigger
const agentForm = document.getElementById("agentForm");
const agentResult = document.getElementById("agentResult");

agentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const vendor = document.getElementById("vendor").value.trim();
  const product = document.getElementById("product").value.trim();
  const amount = parseFloat(document.getElementById("amount").value.trim());

  if (!vendor || !product || isNaN(amount)) {
    agentResult.innerText = "❌ Please fill in all fields correctly.";
    return;
  }

  agentResult.innerText = "⏳ Running EVA Agent...";

  try {
    const res = await fetch("/trigger-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendor, product, amount }),
    });

    const data = await res.json();
    if (data.success) {
      const message = data.result.message || JSON.stringify(data.result);
      agentResult.innerText = `✅ Agent Responded:\n${message}`;
    } else {
      agentResult.innerText = `❌ Error: ${data.error}`;
    }
  } catch (err) {
    agentResult.innerText = `❌ Failed to contact backend: ${err.message}`;
  }
});

// ✅ Inventory Check with Suggestions
const productInput = document.getElementById("productInput");
const checkInventoryBtn = document.getElementById("checkInventoryBtn");
const inventoryResult = document.getElementById("inventoryResult");
const suggestionsList = document.getElementById("suggestionsList");

const products = [
  "Monitor", "Mouse", "Keyboard", "Laptop", "Printer",
  "USB Cable", "Desk Chair", "Webcam", "Speakers", "Router"
];

productInput.addEventListener("input", () => {
  const query = productInput.value.toLowerCase();
  suggestionsList.innerHTML = "";

  if (!query) return;

  const matches = products.filter(p => p.toLowerCase().startsWith(query));
  matches.forEach(match => {
    const item = document.createElement("li");
    item.textContent = match;
    item.className = "list-group-item";
    item.onclick = () => {
      productInput.value = match;
      suggestionsList.innerHTML = "";
    };
    suggestionsList.appendChild(item);
  });
});

checkInventoryBtn.addEventListener("click", async () => {
  const product = productInput.value.trim();
  if (!product) {
    inventoryResult.innerText = "❌ Please select a product.";
    return;
  }

  inventoryResult.innerText = "⏳ Checking inventory...";

  try {
    const res = await fetch("/trigger-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_inventory_status", product }),
    });

    const data = await res.json();
    if (data.success) {
      const message = data.result.message || JSON.stringify(data.result);
      inventoryResult.innerText = `✅ Inventory Status:\n${message}`;
    } else {
      inventoryResult.innerText = `❌ Error: ${data.error}`;
    }
  } catch (err) {
    inventoryResult.innerText = "❌ Error checking inventory.";
    console.error("Inventory Check Error:", err);
  }
});
