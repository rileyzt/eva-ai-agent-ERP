import Product from "./productModel.js";

const getInventoryStatus = async (input) => {
  console.log("🛠 getInventoryStatus INPUT:", input); // DEBUG

  const product = input?.product;
  if (!product) {
    console.log("❌ No product name provided.");
    return "❌ Product name not provided.";
  }

  const found = await Product.findOne({ name: product });
  console.log("🔎 Product found in DB:", found); // DEBUG

  if (!found) return `❌ Product "${product}" not found in inventory.`;

  return `📦 Inventory status for "${product}": ${found.stock} items available.`;
};

export default getInventoryStatus;
