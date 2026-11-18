import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { Command } from "commander";
import prompts from "prompts";
import pc from "picocolors";
import { readConfigAsync, getConfigPath } from "./utils/config";
import { logger } from "./utils/logger";
import {
  detectPackageManager,
  installDependencies,
  type PackageManager,
} from "./utils/pm";
import { generateStarterFiles, writeStarterProject } from "./template";

const program = new Command();

program
  .name("code-ui")
  .description("Code UI — WeChat MiniProgram Component Library CLI")
  .version("0.0.1");

interface CreateCommandOptions {
  yes?: boolean;
  appid?: string;
  primary?: string;
  icons?: string;
  prefix?: string;
  pm?: PackageManager;
  skipInstall?: boolean;
}

program
  .command("create [project-name]")
  .description(
    "Create a new WeChat MiniProgram starter project with weapp-vite, Tailwind CSS v4, and Code UI",
  )
  .option("-y, --yes", "Use default options without interactive prompts")
  .option("--appid <appid>", "WeChat MiniProgram AppID", "touristappid")
  .option("--primary <color>", "Primary semantic color palette", "red")
  .option("--icons <collection>", "Default Iconify collection", "lucide")
  .option("--prefix <prefix>", "Component tag prefix", "c")
  .option("--pm <manager>", "Package manager (pnpm | npm | yarn)")
  .option("--skip-install", "Skip automatic dependency installation")
  .action(
    async (
      projectNameArg: string | undefined,
      cmdOpts: CreateCommandOptions,
    ) => {
      console.log(
        pc.bold(
          pc.cyan(
            "\n✨ Code UI — WeChat MiniProgram Starter (weapp-vite + Tailwind v4)\n",
          ),
        ),
      );

      let projectName = projectNameArg || "my-code-ui-app";
      let appId = cmdOpts.appid || "touristappid";
      let primaryColor = cmdOpts.primary || "red";
      let iconCollection = cmdOpts.icons || "lucide";
      let prefix = cmdOpts.prefix || "c";
      let pm: PackageManager = cmdOpts.pm || "pnpm";
      let runInstall = !cmdOpts.skipInstall;

      if (!cmdOpts.yes) {
        const response = await prompts(
          [
            {
              type: projectNameArg ? null : "text",
              name: "projectName",
              message: "Project folder name:",
              initial: projectName,
              validate: (val: string) =>
                val.trim().length > 0 ? true : "Project name cannot be empty",
            },
            {
              type: "text",
              name: "appId",
              message: "WeChat MiniProgram AppID:",
              initial: appId,
            },
            {
              type: "select",
              name: "primaryColor",
              message: "Primary brand color palette:",
              choices: [
                { title: "Red (Code.id Crimson)", value: "red" },
                { title: "Emerald", value: "emerald" },
                { title: "Blue", value: "blue" },
                { title: "Indigo", value: "indigo" },
                { title: "Stone", value: "stone" },
                { title: "Violet", value: "violet" },
              ],
              initial: 0,
            },
            {
              type: "select",
              name: "iconCollection",
              message: "Default Iconify icon collection:",
              choices: [
                { title: "Lucide (i-lucide-*)", value: "lucide" },
                { title: "Tabler (i-tabler-*)", value: "tabler" },
                { title: "Heroicons (i-heroicons-*)", value: "heroicons" },
                { title: "Material Design Icons (i-mdi-*)", value: "mdi" },
              ],
              initial: 0,
            },
            {
              type: "text",
              name: "prefix",
              message: "Component tag prefix (e.g. 'c' for <c-button>):",
              initial: prefix,
            },
            {
              type: cmdOpts.pm ? null : "select",
              name: "pm",
              message: "Package manager:",
              choices: [
                { title: "pnpm (Recommended)", value: "pnpm" },
                { title: "npm", value: "npm" },
                { title: "yarn", value: "yarn" },
              ],
              initial: 0,
            },
            {
              type: cmdOpts.skipInstall ? null : "confirm",
              name: "runInstall",
              message: "Install dependencies now?",
              initial: true,
            },
          ],
          {
            onCancel: () => {
              logger.warn("Project creation cancelled.");
              process.exit(0);
            },
          },
        );

        if (response.projectName) projectName = String(response.projectName).trim();
        if (response.appId) appId = String(response.appId).trim();
        if (response.primaryColor) primaryColor = String(response.primaryColor);
        if (response.iconCollection) {
          iconCollection = String(response.iconCollection);
        }
        if (response.prefix) prefix = String(response.prefix).trim();
        if (response.pm) pm = response.pm as PackageManager;
        if ( typeof response.runInstall === "boolean") {
          runInstall = response.runInstall;
        }
      }

      const targetDir = path.resolve(process.cwd(), projectName);
      if (
        fs.existsSync(targetDir) &&
        fs.readdirSync(targetDir).length > 0 &&
        !cmdOpts.yes
      ) {
        const { overwrite } = await prompts({
          type: "confirm",
          name: "overwrite",
          message: `Directory "${projectName}" is not empty. Continue and overwrite matching files?`,
          initial: false,
        });
        if (!overwrite) {
          logger.warn("Aborted.");
          process.exit(0);
        }
      }

      writeStarterProject(targetDir, {
        projectName: path.basename(targetDir),
        appId,
        primaryColor,
        iconCollection,
        prefix,
      });

      logger.success(`Scaffolded Code UI project in ${pc.green(targetDir)}`);

      if (runInstall) {
        logger.info(`Installing dependencies with ${pc.cyan(pm)}...`);
        const installCmd =
          pm === "yarn" ? "yarn" : `${pm} install`;
        try {
          execSync(installCmd, { cwd: targetDir, stdio: "inherit" });
          logger.success("Dependencies installed.");
        } catch {
          logger.warn(
            `Automatic install failed. You can install manually inside ${pc.cyan(projectName)} via "${installCmd}".`,
          );
        }
      }

      const relDir = path.relative(process.cwd(), targetDir) || ".";
      console.log(`\n${pc.bold("Next steps:")}`);
      if (relDir !== ".") {
        console.log(`  ${pc.cyan(`cd ${relDir}`)}`);
      }
      if (!runInstall) {
        console.log(`  ${pc.cyan(`${pm} install`)}`);
      }
      console.log(`  ${pc.cyan(`${pm === "npm" ? "npm run" : pm} dev`)}`);
      console.log(
        `  Open WeChat DevTools and import ${pc.green(path.join(relDir, "dist"))} (or project root).\n`,
      );
    },
  );

interface InitCommandOptions {
  yes?: boolean;
  primary?: string;
  icons?: string;
  prefix?: string;
  install?: boolean;
}

program
  .command("init")
  .description(
    "Initialize Code UI configuration (cui.config.ts, weapp-vite.config.ts, and src/app.css) in an existing weapp-vite project",
  )
  .option("-y, --yes", "Skip prompts and use defaults")
  .option("--primary <color>", "Primary semantic color palette", "red")
  .option("--icons <collection>", "Default Iconify collection", "lucide")
  .option("--prefix <prefix>", "Component tag prefix", "c")
  .option("--install", "Install @code-ui packages automatically")
  .action(async (cmdOpts: InitCommandOptions) => {
    const cwd = process.cwd();
    const projectName = path.basename(cwd);
    const files = generateStarterFiles({
      projectName,
      appId: "touristappid",
      primaryColor: cmdOpts.primary || "red",
      iconCollection: cmdOpts.icons || "lucide",
      prefix: cmdOpts.prefix || "c",
    });

    const cuiConfigPath = path.resolve(cwd, "cui.config.ts");
    if (!fs.existsSync(cuiConfigPath)) {
      fs.writeFileSync(cuiConfigPath, files["cui.config.ts"] ?? "", "utf-8");
      logger.success(`Created ${pc.green("cui.config.ts")}`);
    } else {
      logger.info(`${pc.cyan("cui.config.ts")} already exists, skipping.`);
    }

    const weappViteConfigPath = path.resolve(cwd, "weapp-vite.config.ts");
    const viteConfigPath = path.resolve(cwd, "vite.config.ts");
    if (!fs.existsSync(weappViteConfigPath) && !fs.existsSync(viteConfigPath)) {
      fs.writeFileSync(
        weappViteConfigPath,
        files["weapp-vite.config.ts"] ?? "",
        "utf-8",
      );
      logger.success(`Created ${pc.green("weapp-vite.config.ts")}`);
    } else {
      logger.info(
        `Vite config already exists. Ensure ${pc.cyan("codeUI({ autoImport: true, treeShake: mode === 'production' })")} is registered in plugins.`,
      );
    }

    const appCssPath = path.resolve(cwd, "src/app.css");
    if (!fs.existsSync(appCssPath)) {
      fs.mkdirSync(path.dirname(appCssPath), { recursive: true });
      fs.writeFileSync(appCssPath, files["src/app.css"] ?? "", "utf-8");
      logger.success(`Created ${pc.green("src/app.css")}`);
    } else {
      const currentCss = fs.readFileSync(appCssPath, "utf-8");
      if (!currentCss.includes("@code-ui/components")) {
        const updatedCss = `@import "tailwindcss";\n@import "@code-ui/components";\n\n${currentCss.replace(/@import\s+["']tailwindcss["'];?\s*/g, "")}`;
        fs.writeFileSync(appCssPath, updatedCss, "utf-8");
        logger.success(
          `Added ${pc.green('@import "@code-ui/components";')} to ${pc.green("src/app.css")}`,
        );
      }
    }

    if (cmdOpts.install) {
      const iconCol = cmdOpts.icons || "lucide";
      installDependencies(["@code-ui/components", "@code-ui/plugin-vite"], {
        cwd,
      });
      if (iconCol !== "lucide") {
        installDependencies([`@iconify-json/${iconCol}`], { cwd, dev: true });
      }
      logger.success("Installed Code UI dependencies.");
    } else {
      const pm = detectPackageManager(cwd);
      const addCmd = pm === "npm" ? "npm i" : `${pm} add`;
      const iconCol = cmdOpts.icons || "lucide";
      console.log(`\n${pc.bold("Install required packages:")}`);
      console.log(
        `  ${pc.cyan(`${addCmd} @code-ui/components @code-ui/plugin-vite`)}`,
      );
      if (iconCol !== "lucide") {
        console.log(
          `  ${pc.cyan(`${addCmd} -D @iconify-json/${iconCol}`)}\n`,
        );
      } else {
        console.log("");
      }
    }
  });

program
  .command("info")
  .description("Show current Code UI configuration and environment status")
  .action(async () => {
    const configPath = getConfigPath();
    console.log(pc.bold(pc.cyan("\nCode UI Component Library\n")));
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
        `Run ${pc.cyan("npx @code-ui/cli init")} or create a ${pc.cyan("cui.config.ts")} to customize global component styling.`,
      );
    }
    console.log("");
  });

program.parse(process.argv);
