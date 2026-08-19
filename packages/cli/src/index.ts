import { Command } from "commander";
import { initCommand } from "./commands/init";
import { addCommand } from "./commands/add";
import { listCommand } from "./commands/list";

const program = new Command();

program
  .name("code-ui")
  .description("CLI tool to add native WeChat MiniProgram components to your project (shadcn-style)")
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
  .description("Add native MiniProgram components to your project")
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
  .command("list")
  .description("List all available components in the registry")
  .action(() => {
    listCommand();
  });

program.parse(process.argv);
