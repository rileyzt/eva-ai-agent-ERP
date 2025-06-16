import { runEVAAgentWithTools } from "./langchain-config.js";

runEVAAgentWithTools({
  action: "get_inventory_status",
  product: "Mouse"
}).then(console.log).catch(console.error);
