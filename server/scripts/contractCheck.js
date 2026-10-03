import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import app from '../src/app.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 1. Read API_CONTRACT.md
let contractPath = path.resolve(__dirname, '../../docx/API_CONTRACT.md')
if (!fs.existsSync(contractPath)) {
  contractPath = path.resolve(__dirname, '../../API_CONTRACT.md')
}
if (!fs.existsSync(contractPath)) {
  console.error('❌ Could not locate API_CONTRACT.md')
  process.exit(1)
}

const contractText = fs.readFileSync(contractPath, 'utf8')
const lines = contractText.split('\n')

const contractRoutes = []
for (const line of lines) {
  const match = line.match(/^\|\s*(GET|POST|PATCH|DELETE|PUT)\s*\|\s*`([^`]+)`/)
  if (match) {
    const method = match[1].toUpperCase()
    let rawPath = match[2].trim()
    // Handle comma-separated multiple paths on same row like /auth/forgot-password, /auth/reset-password
    const pathVariants = rawPath.split(',').map((p) => p.trim())
    for (const p of pathVariants) {
      // Split any " · " or similar
      const subPaths = p.split('·').map((s) => s.trim())
      for (const sp of subPaths) {
        if (sp) {
          contractRoutes.push({ method, path: sp })
        }
      }
    }
  }
}

// 2. Extract routes from Express app
const expressRoutes = []

function extractRoutes(layer, basePath = '') {
  if (layer.route) {
    const route = layer.route
    const path = basePath + (route.path === '/' && basePath ? '' : route.path)
    for (const m of Object.keys(route.methods)) {
      if (route.methods[m]) {
        expressRoutes.push({ method: m.toUpperCase(), path })
      }
    }
  } else if (layer.name === 'router' && layer.handle?.stack) {
    let clean = ''
    const src = layer.regexp.source
    if (src.includes('api\\/v1')) clean = '/api/v1'
    else if (src.includes('api')) clean = '/api'
    else {
      const match = src.match(/\\\/?([a-zA-Z0-9_\-]+)/)
      if (match) clean = '/' + match[1]
    }
    for (const subLayer of layer.handle.stack) {
      extractRoutes(subLayer, basePath + clean)
    }
  }
}

for (const layer of app._router.stack) {
  extractRoutes(layer, '')
}

// Helper to normalize path variables e.g. /users/:id -> /users/:param
const normalizePath = (p) => {
  return p
    .replace(/\/+/g, '/')
    .replace(/\/$/, '')
    .replace(/:[a-zA-Z0-9_]+/g, ':param')
}

console.log('========================================================================')
console.log('             CHAMPIONS CLUB - API CONTRACT AUDIT                     ')
console.log('========================================================================\n')

let matches = 0
let missing = 0

const results = []

for (const cr of contractRoutes) {
  const normContract = normalizePath(cr.path)
  // Check if expressRoutes contains a match with /api or /api/v1 prefix, or without prefix
  const found = expressRoutes.find((er) => {
    if (er.method !== cr.method) return false
    const normExpress = normalizePath(er.path)
    return (
      normExpress === normContract ||
      normExpress === normalizePath(`/api${normContract}`) ||
      normExpress === normalizePath(`/api/v1${normContract}`)
    )
  })

  if (found) {
    matches++
    results.push({ Method: cr.method, Path: cr.path, Status: 'PASS', Registered: found.path })
  } else {
    missing++
    results.push({ Method: cr.method, Path: cr.path, Status: 'MISSING', Registered: '-' })
  }
}

console.table(results)

console.log('\n------------------------------------------------------------------------')
console.log(`Total Contract Endpoints: ${contractRoutes.length}`)
console.log(`Matching Express Endpoints: ${matches}`)
console.log(`Missing Endpoints: ${missing}`)
console.log('------------------------------------------------------------------------\n')

if (missing === 0) {
  console.log('🎉 100% CONTRACT COMPLIANCE: All endpoints defined in API_CONTRACT.md are implemented!')
  process.exit(0)
} else {
  console.warn(`⚠️ Warning: ${missing} endpoints from API_CONTRACT.md were not found in Express routes.`)
  process.exit(1)
}
