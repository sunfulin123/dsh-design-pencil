import { inflateSync } from 'node:zlib'

// CanvasKit and Figma PNG exports use 8-bit RGB/RGBA. Fail explicitly for
// other encodings; never interpret an undecodable image as a match.
export function decodePng(bytes) {
  if (!Buffer.from(bytes.subarray(0, 8)).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) throw new Error('Invalid PNG signature')
  let width, height, channels
  const chunks = []
  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length = bytes.readUInt32BE(offset)
    if (offset + 12 + length > bytes.length) throw new Error('Truncated PNG chunk')
    const type = bytes.toString('ascii', offset + 4, offset + 8)
    const data = bytes.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      channels = data[9] === 6 ? 4 : data[9] === 2 ? 3 : 0
      if (data[8] !== 8 || !channels || data[12] !== 0) throw new Error('Only non-interlaced 8-bit RGB/RGBA PNG is supported')
      if (!width || !height || width * height > 16_777_216) throw new Error('PNG exceeds pixel limit')
    } else if (type === 'IDAT') chunks.push(data)
    offset += length + 12
  }
  if (!channels) throw new Error('Missing PNG header')
  const stride = width * channels
  const raw = inflateSync(Buffer.concat(chunks), { maxOutputLength: (stride + 1) * height })
  if (raw.length !== (stride + 1) * height) throw new Error('Invalid PNG data size')
  const pixels = Buffer.alloc(width * height * 4)
  let previous = Buffer.alloc(stride)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    if (filter > 4) throw new Error('Invalid PNG filter')
    const row = Buffer.alloc(stride)
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? row[i - channels] : 0
      const b = previous[i]
      const c = i >= channels ? previous[i - channels] : 0
      const p = a + b - c
      const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
      const predictor = [0, a, b, Math.floor((a + b) / 2), pa <= pb && pa <= pc ? a : pb <= pc ? b : c][filter]
      row[i] = (raw[y * (stride + 1) + 1 + i] + predictor) & 255
    }
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      row.copy(pixels, index, x * channels, x * channels + 3)
      pixels[index + 3] = channels === 4 ? row[x * channels + 3] : 255
    }
    previous = row
  }
  return { width, height, pixels }
}

export function diffPng(source, imported, tolerance = 8) {
  const a = decodePng(source), b = decodePng(imported)
  if (a.width !== b.width || a.height !== b.height) {
    return { comparable: false, reason: 'image-size-mismatch', source: [a.width, a.height], imported: [b.width, b.height] }
  }
  let different = 0
  const regions = new Map()
  for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
    const i = (y * a.width + x) * 4
    // Compare composited-on-white RGB, so invisible transparent RGB does
    // not become a false mismatch.
    const channel = (image, j) => 255 + (image.pixels[i + j] - 255) * image.pixels[i + 3] / 255
    if (![0, 1, 2].some(j => Math.abs(channel(a, j) - channel(b, j)) > tolerance)) continue
    different++
    const key = `${Math.floor(x / 32)},${Math.floor(y / 32)}`
    regions.set(key, (regions.get(key) || 0) + 1)
  }
  return {
    comparable: true, width: a.width, height: a.height, differentPixels: different,
    ratio: different / (a.width * a.height), tolerance,
    regions: [...regions].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([key, count]) => {
      const [x, y] = key.split(',').map(Number)
      return { x: x * 32, y: y * 32, width: Math.min(32, a.width - x * 32), height: Math.min(32, a.height - y * 32), differentPixels: count }
    }),
  }
}
