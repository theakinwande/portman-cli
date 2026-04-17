import { execSync } from "child_process";
import os from "os";

export interface PortProcess {
  port: number;
  pid: number;
  name: string;
  status: string;
}

const isWindows = os.platform() === "win32";

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
}

function getProcessName(pid: number): string {
  if (isWindows) {
    const out = run(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`);
    const first = out.split(/\r?\n/).find((l) => l.trim().length > 0);
    if (!first) return "unknown";
    const cols = first.split(",").map((c) => c.replace(/(^"|"$)/g, ""));
    return cols[0] || "unknown";
  }
  const out = run(`ps -p ${pid} -o comm=`).trim();
  return out || "unknown";
}

function parseWindowsNetstat(output: string): PortProcess[] {
  const results: PortProcess[] = [];
  const seen = new Set<string>();
  for (const line of output.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || !/LISTENING/i.test(trimmed)) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 5) continue;
    const proto = parts[0];
    if (!/^TCP/i.test(proto)) continue;
    const local = parts[1];
    const status = parts[3];
    const pidStr = parts[4];
    const pid = parseInt(pidStr, 10);
    if (!pid || Number.isNaN(pid)) continue;
    const portMatch = local.match(/:(\d+)$/);
    if (!portMatch) continue;
    const port = parseInt(portMatch[1], 10);
    const key = `${port}:${pid}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({ port, pid, name: getProcessName(pid), status });
  }
  return results;
}

function parseUnixLsof(output: string): PortProcess[] {
  const results: PortProcess[] = [];
  const seen = new Set<string>();
  const lines = output.split(/\r?\n/).slice(1);
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.trim().split(/\s+/);
    if (cols.length < 9) continue;
    const name = cols[0];
    const pid = parseInt(cols[1], 10);
    const addr = cols[8];
    if (!pid || Number.isNaN(pid)) continue;
    const portMatch = addr.match(/:(\d+)$/);
    if (!portMatch) continue;
    const port = parseInt(portMatch[1], 10);
    const key = `${port}:${pid}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({ port, pid, name, status: "LISTEN" });
  }
  return results;
}

export function findProcessOnPort(port: number): PortProcess | null {
  if (isWindows) {
    const out = run(`netstat -ano -p TCP`);
    const matches = parseWindowsNetstat(out).filter((p) => p.port === port);
    return matches[0] ?? null;
  }
  const out = run(`lsof -nP -iTCP:${port} -sTCP:LISTEN`);
  const matches = parseUnixLsof(out);
  return matches[0] ?? null;
}

export function listListeningPorts(): PortProcess[] {
  if (isWindows) {
    const out = run(`netstat -ano -p TCP`);
    return parseWindowsNetstat(out).sort((a, b) => a.port - b.port);
  }
  const out = run(`lsof -nP -iTCP -sTCP:LISTEN`);
  return parseUnixLsof(out).sort((a, b) => a.port - b.port);
}

export class KillError extends Error {
  constructor(message: string, public code: "NOT_FOUND" | "PERMISSION" | "UNKNOWN") {
    super(message);
  }
}

export function killProcessByPid(pid: number): void {
  const cmd = isWindows ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`;
  try {
    execSync(cmd, { stdio: ["ignore", "ignore", "pipe"] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (/not found|no such process|cannot find/i.test(message)) {
      throw new KillError(`Process ${pid} not found`, "NOT_FOUND");
    }
    if (/access is denied|operation not permitted|permission/i.test(message)) {
      throw new KillError(`Permission denied killing PID ${pid}`, "PERMISSION");
    }
    throw new KillError(`Failed to kill PID ${pid}: ${message}`, "UNKNOWN");
  }
}

export function parsePort(input: string): number {
  const n = parseInt(input, 10);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    throw new Error(`Invalid port: ${input} (must be 1-65535)`);
  }
  return n;
}
