// routes/productRoutes.js
import express from "express";
import Product from "../productModel.js";

const router = express.Router();

// GET /products/search?query=mo
router.get("/search", async (req, res) => {
  try {
    const query = req.query.query?.toLowerCase();
    if (!query) return res.status(400).json({ error: "Missing search query" });

    const products = await Product.find({
      name: { $regex: new RegExp(query, "i") },
    }).select("name -_id");

    const productNames = products.map((p) => p.name);
    res.json({ suggestions: productNames });
  } catch (err) {
    console.error("❌ Error in /products/search:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
