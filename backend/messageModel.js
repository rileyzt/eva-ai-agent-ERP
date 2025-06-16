// backend/messageModel.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  user: { type: String, required: true },
  eva: { type: String, required: true },
  language: { type: String, default: "en-US" },
  browser: { type: String, default: "Unknown" }, // ✅ new
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);
export default Message;
