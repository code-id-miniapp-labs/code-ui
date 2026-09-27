import { Command } from "commander";
import { readConfigAsync, getConfigPath } from "./utils/config";
import pc from "picocolors";

const program = new Command();

program
  .name("code-ui")
  .description("Code-UI: Prebuilt WeChat MiniProgram Component Library CLI")
  .version("0.0.1");

program
  .command("info")
  .description("Show current code-ui configuration and environment status")
  .action(async () => {
    const configPath = getConfigPath();
    console.log(pc.bold(pc.cyan("\nCode-UI Component Library\n")));
    if (configPath) {
      console.log(`Config file: ${pc.green(configPath)}`);
      const config = await readConfigAsync();
      if (config) {
        console.log(`Prefix:      ${pc.yellow(config.prefix || "cui")}`);
        console.log(
          `Components:  ${pc.yellow(
            Object.keys(config.components || {}).join(", ") || "none configured",
          )}`,
        );
      }
    } else {
      console.log(pc.yellow("No cui.config.ts found in current directory."));
      console.log(
        `Create a ${pc.cyan("cui.config.ts")} to customize global component styling.`,
      );
    }
    console.log("");
  });

program.parse(process.argv);
