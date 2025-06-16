import mongoose from "mongoose";
import Product from "./productModel.js";
import dotenv from "dotenv";

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI); // ✅ exact match


const products = await Product.find({});
console.log("📦 Products in DB:", products);

mongoose.disconnect();
