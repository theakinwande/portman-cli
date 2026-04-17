import chalk from "chalk";
import {
  findProcessOnPort,
  killProcessByPid,
  KillError,
} from "../utils/ports";
import { getReservationsByName } from "../utils/reservations";
import { confirm } from "../utils/prompt";

interface FreeOptions {
  yes?: boolean;
}

export async function freeCommand(name: string, opts: FreeOptions): Promise<void> {
  const reservations = getReservationsByName(name);
  if (reservations.length === 0) {
    console.log(chalk.yellow(`No ports reserved for "${name}".`));
    return;
  }

  const targets = reservations
    .map((r) => ({ reservation: r, proc: findProcessOnPort(r.port) }))
    .filter((t) => t.proc !== null);

  if (targets.length === 0) {
    console.log(chalk.gray(`No active processes on ports reserved for "${name}".`));
    return;
  }

  console.log(chalk.bold(`Processes to kill for "${name}":`));
  for (const t of targets) {
    console.log(`  port ${t.reservation.port} → ${t.proc!.name} (PID ${t.proc!.pid})`);
  }

  if (!opts.yes) {
    const ok = await confirm(`Kill ${targets.length} process(es)?`);
    if (!ok) {
      console.log(chalk.gray("Aborted."));
      return;
    }
  }

  let killed = 0;
  let failed = 0;
  for (const t of targets) {
    try {
      killProcessByPid(t.proc!.pid);
      console.log(chalk.green(`  ✓ killed PID ${t.proc!.pid} on port ${t.reservation.port}`));
      killed++;
    } catch (err) {
      failed++;
      const msg = err instanceof KillError ? err.message : String(err);
      console.error(chalk.red(`  ✗ ${msg}`));
    }
  }
  console.log(chalk.bold(`\n${killed} killed, ${failed} failed.`));
  if (failed > 0) process.exitCode = 1;
}
