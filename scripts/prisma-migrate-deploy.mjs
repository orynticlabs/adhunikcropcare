import { spawnSync } from "node:child_process"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const prismaCli = require.resolve("prisma/build/index.js")
const baseline = "20260719000100_baseline_storefront_and_orycms"

function prisma(args) {
  const result = spawnSync(process.execPath, [prismaCli, ...args], {
    encoding: "utf8",
    env: process.env,
  })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  return result
}

let deployment = prisma(["migrate", "deploy"])

if (deployment.status !== 0 && `${deployment.stdout}\n${deployment.stderr}`.includes("P3005")) {
  console.log(`Existing database detected. Recording ${baseline} as the non-destructive baseline.`)
  const resolution = prisma(["migrate", "resolve", "--applied", baseline])
  if (resolution.status !== 0) process.exit(resolution.status ?? 1)
  deployment = prisma(["migrate", "deploy"])
}

process.exit(deployment.status ?? 1)
