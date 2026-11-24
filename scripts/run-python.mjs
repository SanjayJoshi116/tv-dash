// Run a Python script with whichever interpreter this machine has:
//   node scripts/run-python.mjs <script.py> [args...]
// Windows usually has `python` / `py` (and a Store stub named `python3` that doesn't run anything);
// macOS / Linux usually only have `python3`. Python is run isolated (-I), as the scripts expect.
import { spawnSync } from 'node:child_process'

const candidates = process.platform === 'win32' ? ['python', 'py', 'python3'] : ['python3', 'python']
const works = cmd => spawnSync(cmd, ['--version'], { stdio: 'ignore' }).status === 0
const python = candidates.find(works)

if (!python) {
  console.error(`No Python interpreter found (tried: ${candidates.join(', ')}). Install Python 3 with Tk.`)
  process.exit(1)
}

const result = spawnSync(python, ['-I', ...process.argv.slice(2)], { stdio: 'inherit' })
process.exit(result.status ?? 1)
