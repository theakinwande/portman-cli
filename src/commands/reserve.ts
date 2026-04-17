import chalk from "chalk";
import { addReservation } from "../utils/reservations";
import { parsePort } from "../utils/ports";

export function reserveCommand(portInput: string, name: string): void {
  const port = parsePort(portInput);
  if (!name.trim()) {
    throw new Error("Reservation name cannot be empty");
  }
  const res = addReservation(port, name.trim());
  console.log(chalk.green(`Reserved port ${res.port} for "${res.name}".`));
}
