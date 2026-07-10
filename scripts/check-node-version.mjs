const major = Number.parseInt(process.versions.node.split('.')[0] ?? '', 10)

if (!Number.isInteger(major) || major < 20 || major >= 27) {
  console.error(
    `Unsupported Node.js ${process.version}. Use Node.js 20, 22, 24, or 26 for this Next.js project.`,
  )
  process.exit(1)
}
