// productModel.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  stock: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true
});

const Product = mongoose.model("Product", productSchema);

export default Product;
