import { Command } from "commander";
import { initCommand } from "./commands/init";
import { addCommand } from "./commands/add";
import { listCommand } from "./commands/list";
import { syncCommand } from "./commands/sync";

const program = new Command();

program
  .name("code-ui")
  .description("CLI tool to add native WeChat MiniProgram components to your project")
  .version("0.0.1");

program
  .command("init")
  .description("Initialize code-ui configuration and components directory")
  .option("-y, --yes", "Skip prompts and use defaults", false)
  .action(async (opts) => {
    await initCommand({ yes: opts.yes });
  });

program
  .command("add")
  .description("Add native MiniProgram components to your project (shadcn-style)")
  .argument("[components...]", "Names of the components to add")
  .option("-y, --yes", "Skip overwrite confirmations", false)
  .option("-o, --overwrite", "Overwrite existing component files", false)
  .option("--no-deps", "Do not automatically install dependencies", false)
  .action(async (components, opts) => {
    await addCommand(components, {
      yes: opts.yes,
      overwrite: opts.overwrite,
      noDeps: !opts.deps,
    });
  });

program
  .command("sync")
  .description("Sync prebuilt @code-ui/components into miniprogram_npm based on code-ui.json")
  .argument("[components...]", "Specific components to sync (overrides code-ui.json)")
  .action(async (components) => {
    await syncCommand({
      components: components.length > 0 ? components : undefined,
    });
  });

program
  .command("list")
  .description("List all available components in the registry")
  .action(() => {
    listCommand();
  });

program.parse(process.argv);
