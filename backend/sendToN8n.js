import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// ✅ Your correct webhook URL
const N8N_WEBHOOK_URL = "http://localhost:5678/webhook/eva-agent";

export default async function sendToN8n(data) {
  try {
    console.log("🚀 Sending to n8n:", data);
    const response = await axios.post(N8N_WEBHOOK_URL, data, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error sending data to n8n:", error.message);
    throw error;
  }
}
