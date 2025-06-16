import dotenv from "dotenv";
dotenv.config();

import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { DynamicTool } from "langchain/tools";

import sendToN8n from "./sendToN8n.js";
import getInventoryStatus from "./getInventoryStatus.js"; // ✅ Real MongoDB-backed function

// === 1. Groq Model Setup ===
const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.1-8b-instant",
  temperature: 0.3,
});

// === 2. Chat Prompt Logic ===
export async function getAnswerFromLangChain(userQuery) {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are EVA, an intelligent ERP Virtual Assistant.
        Your job is to provide concise, helpful answers about ERP systems (SAP, Oracle, etc.), processes, and best practices.

        Respond in:
        - 🔹 3–5 bullet points, or 
        - 🔹 A short paragraph (max 4 lines)

        Use markdown formatting (**bold**, *italic*, etc.) only if it helps clarity.
        Avoid overly long explanations unless specifically requested (e.g., "give me full details").

        Example:
        User: What is ERP?
        EVA:
        ERP (Enterprise Resource Planning) is software that helps organizations:
        - Manage finance, HR, inventory, and operations
        - Centralize data across departments
        - Improve decision-making with real-time analytics

        Be concise, sharp, and professional.`
    ],
    ["user", "{input}"]
  ]);

  const chain = prompt.pipe(model);
  const response = await chain.invoke({ input: userQuery });
  return response.content;
}

// === 3. Define Tools ===
const tools = [
  new DynamicTool({
    name: "create_purchase_order",
    description: "Sends purchase order data to n8n for processing",
    func: async (input) => {
      try {
        const parsed = JSON.parse(input);
        const result = await sendToN8n(parsed);
        return result.message || "✅ N8N webhook triggered successfully.";
      } catch (err) {
        return "❌ Invalid input JSON: " + err.message;
      }
    }
  }),
  new DynamicTool({
    name: "get_inventory_status",
    description: "Returns available inventory count for a product",
    func: async (input) => {
      try {
        const parsed = JSON.parse(input);
        const result = await getInventoryStatus(parsed);
        return result; // ✅ FIXED: Return string directly (no `.message`)
      } catch (err) {
        return "❌ Invalid input JSON: " + err.message;
      }
    }
  }),
];

// === 4. EVA Agent Logic ===
export async function runEVAAgentWithTools(toolInput) {
  console.log("📤 Input to EVA Agent:", toolInput);

  const { action, ...data } = toolInput;

  const selectedTool = tools.find((tool) => tool.name === action);
  if (!selectedTool) {
    return `❌ Tool "${action}" not found.`;
  }

  const result = await selectedTool.func(JSON.stringify(data));
  console.log("📥 Result from EVA Tool:", result);
  return result;
}
