import pc from "picocolors";

export const logger = {
  info(...args: any[]) {
    console.log(pc.cyan("ℹ"), ...args);
  },
  success(...args: any[]) {
    console.log(pc.green("✔"), ...args);
  },
  warn(...args: any[]) {
    console.log(pc.yellow("⚠"), ...args);
  },
  error(...args: any[]) {
    console.log(pc.red("✖"), ...args);
  },
  highlight(text: string) {
    return pc.bold(pc.cyan(text));
  },
};
