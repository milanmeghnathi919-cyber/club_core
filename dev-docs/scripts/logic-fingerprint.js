import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const clientSrcDir = path.join(rootDir, 'client', 'src')

function getFiles(dir) {
  let results = []
  const list = fs.readdirSync(dir)
  for (const file of list) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath))
    } else {
      results.push(fullPath)
    }
  }
  return results
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex')
}

function stripPresentation(content) {
  // Strip className="..." and className={...}
  let stripped = content
    .replace(/className\s*=\s*"[^"]*"/g, '')
    .replace(/className\s*=\s*'[^']*'/g, '')
    .replace(/className\s*=\s*\{[^}]*\}/g, '')
    .replace(/style\s*=\s*\{[^}]*\}/g, '')
    .replace(/style\s*=\s*"[^"]*"/g, '')
    // remove whitespace
    .replace(/\s+/g, '')
  return stripped
}

const allClientFiles = getFiles(clientSrcDir)
const report = []

for (const filePath of allClientFiles) {
  const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/')
  const content = fs.readFileSync(filePath, 'utf8')
  const ext = path.extname(filePath)

  if (ext === '.jsx' || ext === '.tsx') {
    const stripped = stripPresentation(content)
    const hash = sha256(stripped)
    report.push({ type: 'JSX_STRIPPED', path: relativePath, hash })
  } else if (
    relativePath.startsWith('client/src/feature/') ||
    relativePath.startsWith('client/src/service/') ||
    relativePath.startsWith('client/src/utils/format.js') ||
    relativePath.startsWith('client/src/utils/staffRoles.js') ||
    relativePath.startsWith('client/src/utils/validation.js') ||
    relativePath.startsWith('client/src/store') ||
    relativePath.startsWith('client/src/config')
  ) {
    const hash = sha256(content)
    report.push({ type: 'LOGIC_RAW', path: relativePath, hash })
  }
}

report.sort((a, b) => a.path.localeCompare(b.path))

console.log('--- LOGIC FINGERPRINT BASELINE ---')
console.log(`Generated: ${new Date().toISOString()}`)
console.log(`Total Tracked Files: ${report.length}\n`)

for (const item of report) {
  console.log(`${item.type.padEnd(14)} ${item.hash.slice(0, 16)}  ${item.path}`)
}
