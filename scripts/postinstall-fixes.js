/**
 * Postinstall fixes for known upstream issues.
 *
 * Currently:
 * - Some dependencies (observed via Turbopack) call `cookie.parseCookie(...)`,
 *   but the `cookie` package exports `parse(...)`. We add `exports.parseCookie = parse;`
 *   to the installed `cookie` package as a compatibility alias.
 *
 * This is intentionally dependency-free and safe to run multiple times.
 */
/* eslint-disable no-console */

const fs = require("node:fs")
const path = require("node:path")

function patchCookiePackageIndex(indexJsPath) {
  let contents
  try {
    contents = fs.readFileSync(indexJsPath, "utf8")
  } catch {
    return { patched: false, reason: "read_failed" }
  }

  if (contents.includes("exports.parseCookie")) {
    return { patched: false, reason: "already_patched" }
  }

  const needle = "exports.parse = parse;"
  const insert =
    `${needle}\n` +
    `// Compatibility alias: some dependencies expect \`parseCookie\`.\n` +
    `// \`cookie\` exposes \`parse\`, which is equivalent.\n` +
    `exports.parseCookie = parse;`

  if (!contents.includes(needle)) {
    return { patched: false, reason: "unexpected_format" }
  }

  const next = contents.replace(needle, insert)
  try {
    fs.writeFileSync(indexJsPath, next, "utf8")
  } catch {
    return { patched: false, reason: "write_failed" }
  }

  return { patched: true }
}

function listCookieIndexJsCandidates(projectRoot) {
  const candidates = []
  const pnpmDir = path.join(projectRoot, "node_modules", ".pnpm")
  if (!fs.existsSync(pnpmDir)) return candidates

  let entries = []
  try {
    entries = fs.readdirSync(pnpmDir, { withFileTypes: true })
  } catch {
    return candidates
  }

  for (const ent of entries) {
    if (!ent.isDirectory()) continue
    // pnpm folder names look like: cookie@0.7.0
    if (!ent.name.startsWith("cookie@")) continue
    const p = path.join(pnpmDir, ent.name, "node_modules", "cookie", "index.js")
    if (fs.existsSync(p)) candidates.push(p)
  }

  return candidates
}

function main() {
  const projectRoot = process.cwd()

  const candidates = listCookieIndexJsCandidates(projectRoot)
  if (candidates.length === 0) {
    // Not an error; cookie might not be installed in some environments.
    return
  }

  let patchedCount = 0
  let skippedCount = 0

  for (const p of candidates) {
    const result = patchCookiePackageIndex(p)
    if (result.patched) patchedCount++
    else skippedCount++
  }

  if (patchedCount > 0) {
    console.log(`[postinstall] Patched cookie parseCookie alias in ${patchedCount} location(s).`)
  } else {
    // keep quiet on no-op; avoids noisy installs
    void skippedCount
  }
}

main()

