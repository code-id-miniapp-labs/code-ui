import { listRegistryItems } from "../registry";
import { logger } from "../utils/logger";

export function listCommand() {
  const items = listRegistryItems();
  console.log("\n📦 Available Code-UI MiniProgram Components:\n");
  for (const item of items) {
    console.log(`  • ${logger.highlight(item.name.padEnd(12))} - ${item.description}`);
    console.log(`    dependencies: ${item.dependencies.join(", ")}\n`);
  }
}
