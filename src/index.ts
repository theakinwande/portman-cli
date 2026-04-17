#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { checkCommand } from "./commands/check";
import { killCommand } from "./commands/kill";
import { listCommand } from "./commands/list";
import { reserveCommand } from "./commands/reserve";
import { freeCommand } from "./commands/free";

const program = new Command();

program
  .name("portman")
  .description("Manage local port conflicts across projects")
  .version("0.1.0");

program
  .command("check <port>")
  .description("Show the process using a port")
  .action((port: string) => {
    try {
      checkCommand(port);
    } catch (err) {
      fail(err);
    }
  });

program
  .command("kill <port>")
  .description("Kill the process on a port")
  .option("-y, --yes", "skip confirmation prompt")
  .action(async (port: string, opts: { yes?: boolean }) => {
    try {
      await killCommand(port, opts);
    } catch (err) {
      fail(err);
    }
  });

program
  .command("list")
  .description("List all listening ports")
  .action(() => {
    try {
      listCommand();
    } catch (err) {
      fail(err);
    }
  });

program
  .command("reserve <port> <name>")
  .description("Reserve a port for a project")
  .action((port: string, name: string) => {
    try {
      reserveCommand(port, name);
    } catch (err) {
      fail(err);
    }
  });

program
  .command("free <name>")
  .description("Kill all ports reserved to a project name")
  .option("-y, --yes", "skip confirmation prompt")
  .action(async (name: string, opts: { yes?: boolean }) => {
    try {
      await freeCommand(name, opts);
    } catch (err) {
      fail(err);
    }
  });

function fail(err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(chalk.red(`Error: ${msg}`));
  process.exitCode = 1;
}

program.parseAsync(process.argv);
