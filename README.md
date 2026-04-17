## @ikole/portman

[![npm version](https://img.shields.io/npm/v/@ikole/portman.svg)](https://www.npmjs.com/package/@ikole/portman)
[![license](https://img.shields.io/npm/l/@ikole/portman.svg)](./LICENSE)
[![platforms](https://img.shields.io/badge/platform-windows%20%7C%20macos%20%7C%20linux-blue.svg)](#platform-support)

A developer CLI for managing local port conflicts across projects.

### Why this exists

If you juggle multiple services on your machine — a Rails API on 3000, a Next.js app on 3001, a Postgres container on 5432, a stray Vite dev server that refuses to die — you know the dance: `lsof`, copy a PID, `kill -9`, try again, remember which port belonged to which project. `portman` collapses that dance into a few commands, works the same on Windows, macOS, and Linux, and lets you tag ports to projects so you can free an entire project's worth of ports in one shot.

### Installation

```bash
npm install -g @ikole/portman
```

Requires Node.js 18 or newer.

### Commands

#### `portman check <port>`

Show what's using a port.

```bash
$ portman check 3000
Port 3000 is in use:
  Process: node
  PID:     48213
  Status:  LISTEN
```

If nothing's listening:

```bash
$ portman check 9999
Port 9999 is not in use.
```

#### `portman kill <port>`

Kill the process on a port. Confirms before killing; pass `-y` to skip the prompt.

```bash
$ portman kill 3000
Port 3000 is held by node (PID 48213).
Kill PID 48213? (y/N) y
Killed node (PID 48213) on port 3000.
```

```bash
$ portman kill 3000 -y
Port 3000 is held by node (PID 48213).
Killed node (PID 48213) on port 3000.
```

#### `portman list`

Show every listening port with its process and any reservation tag.

```bash
$ portman list
┌──────┬───────┬──────────────┬─────────────┐
│ Port │ PID   │ Process      │ Reserved    │
├──────┼───────┼──────────────┼─────────────┤
│ 3000 │ 48213 │ node         │ acme-api    │
├──────┼───────┼──────────────┼─────────────┤
│ 3001 │ 48891 │ node         │ acme-web    │
├──────┼───────┼──────────────┼─────────────┤
│ 5432 │ 1423  │ postgres     │ acme-api    │
├──────┼───────┼──────────────┼─────────────┤
│ 6379 │ 1501  │ redis-server │ -           │
├──────┼───────┼──────────────┼─────────────┤
│ 8080 │ 22104 │ java         │ -           │
└──────┴───────┴──────────────┴─────────────┘
```

#### `portman reserve <port> <name>`

Tag a port as belonging to a named project. Reservations live in `~/.portman/reservations.json` and persist across sessions.

```bash
$ portman reserve 3000 acme-api
Reserved port 3000 for "acme-api".

$ portman reserve 5432 acme-api
Reserved port 5432 for "acme-api".

$ portman reserve 3001 acme-web
Reserved port 3001 for "acme-web".
```

Reservations are purely metadata — they don't claim the port, just label it so `list` and `free` know which ports belong to which project.

#### `portman free <name>`

Kill every running process on the ports reserved to a project. Confirms before killing; `-y` skips the prompt.

```bash
$ portman free acme-api
Processes to kill for "acme-api":
  port 3000 → node (PID 48213)
  port 5432 → postgres (PID 1423)
Kill 2 process(es)? (y/N) y
  ✓ killed PID 48213 on port 3000
  ✓ killed PID 1423 on port 5432

2 killed, 0 failed.
```

If nothing's running on the reserved ports:

```bash
$ portman free acme-web
No active processes on ports reserved for "acme-web".
```

### Platform Support

| Command   | Windows | macOS | Linux | Backend                |
| --------- | :-----: | :---: | :---: | ---------------------- |
| `check`   |    ✓    |   ✓   |   ✓   | `netstat` / `lsof`     |
| `kill`    |    ✓    |   ✓   |   ✓   | `taskkill` / `kill -9` |
| `list`    |    ✓    |   ✓   |   ✓   | `netstat` / `lsof`     |
| `reserve` |    ✓    |   ✓   |   ✓   | local JSON file        |
| `free`    |    ✓    |   ✓   |   ✓   | `taskkill` / `kill -9` |

On Windows, `portman` shells out to `netstat -ano` and `taskkill /F /PID`. On macOS and Linux it uses `lsof -nP -iTCP -sTCP:LISTEN` and `kill -9`. Killing a process owned by another user may require an elevated shell (Administrator on Windows, `sudo` on Unix) — `portman` surfaces a permission-denied error in that case instead of failing silently.

### Contributing

Issues and pull requests are welcome. To develop locally:

```bash
git clone https://github.com/theakinwande/portman-cli
cd portman-cli
npm install
npm run build
node dist/index.js list
```

Please keep changes focused, include a clear description of the problem being solved, and add realistic before/after output to the PR description for any user-visible change.

### License

MIT © @ikole/portman contributors
