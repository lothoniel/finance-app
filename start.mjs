import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const dir = path.dirname(fileURLToPath(import.meta.url))
process.chdir(dir)

const vite = spawn(
  process.execPath,
  [path.join(dir, 'node_modules/.bin/vite'), '--port', '5173'],
  { stdio: 'inherit', cwd: dir }
)

vite.on('exit', (code) => process.exit(code ?? 0))
