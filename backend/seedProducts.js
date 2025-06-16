// seedProducts.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./productModel.js";

dotenv.config();

const products = [
  { name: "Mouse", stock: 30 },
  { name: "Keyboard", stock: 20 },
  { name: "USB Cable", stock: 50 },
  { name: "Monitor", stock: 10 },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI); // ✅ exact match

    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log("✅ Products Seeded");
    process.exit();
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

seed();
