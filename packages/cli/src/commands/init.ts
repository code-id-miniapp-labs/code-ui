import prompts from "prompts";
import path from "node:path";
import fs from "node:fs";
import { logger } from "../utils/logger";
import { DEFAULT_CONFIG, writeConfig, getConfigPath } from "../utils/config";

export async function initCommand(options: { yes?: boolean; cwd?: string } = {}) {
  const cwd = options.cwd || process.cwd();
  const existingConfig = getConfigPath(cwd);

  if (existingConfig && !options.yes) {
    const { overwrite } = await prompts({
      type: "confirm",
      name: "overwrite",
      message: "code-ui.json already exists. Do you want to overwrite it?",
      initial: false,
    });
    if (!overwrite) {
      logger.info("Aborted.");
      return;
    }
  }

  let componentDir = DEFAULT_CONFIG.componentDir;
  let style = DEFAULT_CONFIG.style;
  let typescript = DEFAULT_CONFIG.typescript;

  if (!options.yes) {
    const response = await prompts([
      {
        type: "text",
        name: "componentDir",
        message: "Where would you like to install components?",
        initial: DEFAULT_CONFIG.componentDir,
      },
      {
        type: "select",
        name: "style",
        message: "Which styling format do you prefer?",
        choices: [
          { title: "WXSS (Standard WeChat CSS)", value: "wxss" },
          { title: "SCSS (Sass Preprocessor)", value: "scss" },
        ],
        initial: 0,
      },
      {
        type: "confirm",
        name: "typescript",
        message: "Are you using TypeScript?",
        initial: true,
      },
    ]);

    componentDir = response.componentDir || componentDir;
    style = response.style || style;
    typescript = response.typescript ?? typescript;
  }

  const config = {
    style,
    componentDir,
    typescript,
    prefix: "cui-",
  };

  const configPath = writeConfig(config, cwd);
  const targetDir = path.resolve(cwd, componentDir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  logger.success(`Initialized code-ui configuration at ${logger.highlight(path.relative(cwd, configPath))}`);
  logger.info(`Components will be installed to ${logger.highlight(componentDir)}`);
}
