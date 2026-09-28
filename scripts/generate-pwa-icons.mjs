import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'

const outputDirectory = new URL('../public/icons/', import.meta.url)
mkdirSync(outputDirectory, { recursive: true })

const colors = {
  night: [27, 31, 59, 255],
  panel: [41, 47, 85, 255],
  cyan: [61, 224, 255, 255],
  pink: [255, 93, 162, 255],
  yellow: [255, 228, 94, 255],
}

function crc32(buffer) {
  let crc = 0xffffffff

  for (const value of buffer) {
    crc ^= value
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }

  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type)
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])))
  return Buffer.concat([length, typeBuffer, data, checksum])
}

function createIcon(size) {
  const pixels = Buffer.alloc(size * size * 4)

  function fillRectangle(x, y, width, height, color) {
    const startX = Math.max(0, Math.round(x))
    const startY = Math.max(0, Math.round(y))
    const endX = Math.min(size, Math.round(x + width))
    const endY = Math.min(size, Math.round(y + height))

    for (let row = startY; row < endY; row += 1) {
      for (let column = startX; column < endX; column += 1) {
        const offset = (row * size + column) * 4
        pixels.set(color, offset)
      }
    }
  }

  fillRectangle(0, 0, size, size, colors.night)
  const margin = size * 0.14
  const border = Math.max(4, Math.round(size * 0.025))
  fillRectangle(
    margin,
    margin,
    size - margin * 2,
    size - margin * 2,
    colors.cyan,
  )
  fillRectangle(
    margin + border,
    margin + border,
    size - (margin + border) * 2,
    size - (margin + border) * 2,
    colors.panel,
  )

  const keyGap = size * 0.035
  const keyWidth = size * 0.13
  const keyHeight = size * 0.13
  const keyboardLeft = size * 0.205
  const keyboardTop = size * 0.23
  const rows = [4, 4, 3]

  rows.forEach((keyCount, rowIndex) => {
    const rowOffset = rowIndex === 2 ? (keyWidth + keyGap) / 2 : 0
    for (let keyIndex = 0; keyIndex < keyCount; keyIndex += 1) {
      const color =
        (keyIndex + rowIndex) % 3 === 0
          ? colors.yellow
          : (keyIndex + rowIndex) % 3 === 1
            ? colors.pink
            : colors.cyan
      fillRectangle(
        keyboardLeft + rowOffset + keyIndex * (keyWidth + keyGap),
        keyboardTop + rowIndex * (keyHeight + keyGap),
        keyWidth,
        keyHeight,
        color,
      )
    }
  })

  fillRectangle(size * 0.3, size * 0.73, size * 0.4, keyHeight, colors.yellow)

  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let row = 0; row < size; row += 1) {
    const targetOffset = row * (size * 4 + 1)
    raw[targetOffset] = 0
    pixels.copy(raw, targetOffset + 1, row * size * 4, (row + 1) * size * 4)
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8
  header[9] = 6

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

for (const [filename, size] of [
  ['apple-touch-icon.png', 180],
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
]) {
  writeFileSync(new URL(filename, outputDirectory), createIcon(size))
}
