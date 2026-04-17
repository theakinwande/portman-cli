import chalk from "chalk";
import Table from "cli-table3";
import { listListeningPorts } from "../utils/ports";
import { loadReservations } from "../utils/reservations";

export function listCommand(): void {
  const ports = listListeningPorts();
  if (ports.length === 0) {
    console.log(chalk.yellow("No listening ports found."));
    return;
  }
  const reservations = new Map(loadReservations().map((r) => [r.port, r.name]));
  const table = new Table({
    head: [chalk.bold("Port"), chalk.bold("PID"), chalk.bold("Process"), chalk.bold("Reserved")],
    style: { head: [], border: [] },
  });
  for (const p of ports) {
    const reserved = reservations.get(p.port);
    table.push([
      String(p.port),
      String(p.pid),
      p.name,
      reserved ? chalk.cyan(reserved) : chalk.gray("-"),
    ]);
  }
  console.log(table.toString());
}
