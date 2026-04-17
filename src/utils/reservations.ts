import fs from "fs";
import os from "os";
import path from "path";

export interface Reservation {
  port: number;
  name: string;
  createdAt: string;
}

const CONFIG_DIR = path.join(os.homedir(), ".portman");
const FILE = path.join(CONFIG_DIR, "reservations.json");

function ensureDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadReservations(): Reservation[] {
  if (!fs.existsSync(FILE)) return [];
  try {
    const raw = fs.readFileSync(FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is Reservation =>
        typeof r === "object" &&
        r !== null &&
        typeof r.port === "number" &&
        typeof r.name === "string"
    );
  } catch {
    return [];
  }
}

export function saveReservations(items: Reservation[]): void {
  ensureDir();
  fs.writeFileSync(FILE, JSON.stringify(items, null, 2), "utf8");
}

export function addReservation(port: number, name: string): Reservation {
  const items = loadReservations();
  const existing = items.find((r) => r.port === port);
  const reservation: Reservation = {
    port,
    name,
    createdAt: new Date().toISOString(),
  };
  if (existing) {
    existing.name = name;
    existing.createdAt = reservation.createdAt;
    saveReservations(items);
    return existing;
  }
  items.push(reservation);
  saveReservations(items);
  return reservation;
}

export function getReservationsByName(name: string): Reservation[] {
  return loadReservations().filter((r) => r.name === name);
}

export function getReservationsFilePath(): string {
  return FILE;
}
