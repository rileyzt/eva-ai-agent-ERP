import mongoose from "mongoose";

const fallbackSchema = new mongoose.Schema({
  query: String,
  browser: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Fallback = mongoose.model("Fallback", fallbackSchema);
export default Fallback;
