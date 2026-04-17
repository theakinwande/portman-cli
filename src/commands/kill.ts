import chalk from "chalk";
import { findProcessOnPort, killProcessByPid, parsePort, KillError } from "../utils/ports";
import { confirm } from "../utils/prompt";

interface KillOptions {
  yes?: boolean;
}

export async function killCommand(portInput: string, opts: KillOptions): Promise<void> {
  const port = parsePort(portInput);
  const proc = findProcessOnPort(port);
  if (!proc) {
    console.log(chalk.yellow(`Port ${port} is not in use — nothing to kill.`));
    return;
  }
  console.log(
    `Port ${chalk.cyan(port)} is held by ${chalk.bold(proc.name)} (PID ${proc.pid}).`
  );
  if (!opts.yes) {
    const ok = await confirm(`Kill PID ${proc.pid}?`);
    if (!ok) {
      console.log(chalk.gray("Aborted."));
      return;
    }
  }
  try {
    killProcessByPid(proc.pid);
    console.log(chalk.green(`Killed ${proc.name} (PID ${proc.pid}) on port ${port}.`));
  } catch (err) {
    if (err instanceof KillError) {
      console.error(chalk.red(err.message));
      process.exitCode = err.code === "PERMISSION" ? 77 : 1;
      return;
    }
    throw err;
  }
}
