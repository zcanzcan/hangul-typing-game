import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'

const host = '127.0.0.1'
const port = Number(process.env.PWA_PREVIEW_PORT ?? 4175)
const basePath = process.env.VITE_BASE_PATH ?? '/'
const distributionDirectory = resolve('dist')
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
}

function sendFile(response, filePath) {
  response.writeHead(200, {
    'Cache-Control': 'no-cache',
    'Content-Type':
      contentTypes[extname(filePath)] ?? 'application/octet-stream',
  })
  createReadStream(filePath).pipe(response)
}

const server = createServer((request, response) => {
  const pathname = new URL(request.url ?? '/', `http://${host}`).pathname

  if (!pathname.startsWith(basePath)) {
    response.writeHead(302, { Location: basePath })
    response.end()
    return
  }

  const relativePath = decodeURIComponent(pathname.slice(basePath.length))
  const requestedPath = resolve(distributionDirectory, relativePath)
  const isInsideDistribution =
    requestedPath === distributionDirectory ||
    requestedPath.startsWith(`${distributionDirectory}${sep}`)

  if (
    isInsideDistribution &&
    existsSync(requestedPath) &&
    statSync(requestedPath).isFile()
  ) {
    sendFile(response, requestedPath)
    return
  }

  sendFile(response, resolve(distributionDirectory, 'index.html'))
})

server.listen(port, host, () => {
  process.stdout.write(`PWA preview: http://${host}:${port}${basePath}\n`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)))
}
