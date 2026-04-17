import chalk from "chalk";
import { findProcessOnPort, parsePort } from "../utils/ports";

export function checkCommand(portInput: string): void {
  const port = parsePort(portInput);
  const proc = findProcessOnPort(port);
  if (!proc) {
    console.log(chalk.yellow(`Port ${port} is not in use.`));
    return;
  }
  console.log(chalk.green(`Port ${port} is in use:`));
  console.log(`  ${chalk.bold("Process:")} ${proc.name}`);
  console.log(`  ${chalk.bold("PID:")}     ${proc.pid}`);
  console.log(`  ${chalk.bold("Status:")}  ${proc.status}`);
}
