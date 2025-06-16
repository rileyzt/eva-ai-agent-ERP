import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { getAnswerFromLangChain, runEVAAgentWithTools } from "./langchain-config.js";
import connectDB from "./db.js";
import Message from "./messageModel.js";
import Fallback from "./fallbackModel.js";
import Product from "./productModel.js";
import productRoutes from "./routes/productRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

// 📦 Connect to MongoDB
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔌 Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// ✅ EVA Chat Endpoint
app.post("/ask", async (req, res) => {
  const { query, language = "en-US", browser = "unknown" } = req.body;

  let response = await getAnswerFromLangChain(query);

  const maxChars = 600;
  if (response.length > maxChars) {
    response = response.substring(0, maxChars) + '... (truncated)';
  }

  await Message.create({ user: query, eva: response, language });

  const fallbackPhrases = [
    "i don't know", "i’m not sure", "i am not sure",
    "i am sorry", "unable to find", "no information"
  ];
  const isFallback = fallbackPhrases.some(phrase =>
    response.toLowerCase().includes(phrase)
  );

  if (isFallback) {
    await Fallback.create({ query, browser });
  }

  res.json({ response });
});

// ✅ EVA Agent Action Trigger
app.post("/trigger-agent", async (req, res) => {
  console.log("✅ /trigger-agent HIT"); // <-- Debug log added here

  let { vendor, product, amount, action } = req.body;

  console.log("📦 Received data in /trigger-agent:", req.body);

  if (!action) {
    if (vendor && product && amount !== "") {
      action = "create_purchase_order";
    } else if (product && (!vendor || vendor === "") && (amount === "" || amount === undefined)) {
      action = "get_inventory_status";
    } else {
      return res.status(400).json({
        success: false,
        error: "Missing action or incomplete data"
      });
    }
  }


  try {
    const toolInput = {
      action,
      vendor,
      product,
      amount
    };

    console.log("📤 Input to EVA Agent:", toolInput);

    const result = await runEVAAgentWithTools(toolInput);
    console.log("✅ EVA Agent Result:", result);

    res.json({ success: true, result: { message: result } });
  } catch (err) {
    console.error("❌ Agent Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Admin: Get Messages
app.get("/admin/messages", async (req, res) => {
  const messages = await Message.find().sort({ timestamp: -1 }).limit(10);
  res.json(messages);
});

// ✅ Admin: Get Fallbacks
app.get("/admin/fallbacks", async (req, res) => {
  const fallbacks = await Fallback.find().sort({ timestamp: -1 }).limit(10);
  res.json(fallbacks);
});

// ✅ Live product search (autocomplete)
app.get("/api/products/search", async (req, res) => {
  try {
    const query = req.query.q || "";
    const regex = new RegExp(query, "i");
    const products = await Product.find({ name: regex }).limit(5);
    const names = products.map(p => p.name);
    res.json(names);
  } catch (err) {
    console.error("❌ Product search error:", err.message);
    res.status(500).json({ error: "Server error while searching products" });
  }
});

// ✅ Root route
app.get("/", (req, res) => {
  res.send("🎉 EVA Backend API is Live");
});
app.use("/products", productRoutes);

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ EVA backend running on http://localhost:${PORT}`);
});

