/** Pure Node.js PNG decoder, encoder, and cropper for RGBA buffers. */

import { crc32 as nodeCrc32, deflateSync, inflateSync } from 'node:zlib';

export const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_PNG_DIMENSION = 4096;
const MAX_PNG_PIXELS = 16 * 1024 * 1024;

function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

function unfilterSubOrAverage(row, out, average) {
  const { scanline, prevScanline, bpp } = row;
  for (let i = 0; i < scanline.length; i += 1) {
    const left = i >= bpp ? out[i - bpp] : 0;
    const delta = average ? ((left + prevScanline[i]) >>> 1) : left;
    out[i] = (scanline[i] + delta) & 0xff;
  }
}

function unfilterPaeth(row, out) {
  const { scanline, prevScanline, bpp } = row;
  for (let i = 0; i < scanline.length; i += 1) {
    const left = i >= bpp ? out[i - bpp] : 0;
    const up = prevScanline[i];
    const upLeft = i >= bpp ? prevScanline[i - bpp] : 0;
    out[i] = (scanline[i] + paethPredictor(left, up, upLeft)) & 0xff;
  }
}

function unfilterScanline(filterType, row, out) {
  const { scanline, prevScanline } = row;
  if (filterType === 0) {
    out.set(scanline);
  } else if (filterType === 1 || filterType === 3) {
    unfilterSubOrAverage(row, out, filterType === 3);
  } else if (filterType === 2) {
    for (let i = 0; i < scanline.length; i += 1) out[i] = (scanline[i] + prevScanline[i]) & 0xff;
  } else if (filterType === 4) {
    unfilterPaeth(row, out);
  } else {
    throw new Error(`Unsupported PNG scanline filter: ${filterType}`);
  }
}

function parseIhdrChunk(bytes, dataStart, length) {
  if (length !== 13) throw new Error('Invalid PNG IHDR chunk length');
  const compression = bytes[dataStart + 10];
  const filter = bytes[dataStart + 11];
  if (compression !== 0 || filter !== 0) {
    throw new Error('Unsupported PNG compression or filter method');
  }
  return {
    width: bytes.readUInt32BE(dataStart),
    height: bytes.readUInt32BE(dataStart + 4),
    bitDepth: bytes[dataStart + 8],
    colorType: bytes[dataStart + 9],
    interlace: bytes[dataStart + 12],
  };
}

function validateParsedPngHeader(ihdr, idatCount) {
  if (
    ihdr === undefined
    || ihdr.width <= 0
    || ihdr.height <= 0
    || ihdr.width > MAX_PNG_DIMENSION
    || ihdr.height > MAX_PNG_DIMENSION
  ) {
    throw new Error('Invalid PNG dimensions');
  }
  if (ihdr.width * ihdr.height > MAX_PNG_PIXELS) throw new Error('PNG exceeds pixel limit');
  if (ihdr.bitDepth !== 8 || ihdr.interlace !== 0 || (ihdr.colorType !== 2 && ihdr.colorType !== 6)) {
    throw new Error(
      `Unsupported PNG format: bitDepth=${ihdr.bitDepth}, colorType=${ihdr.colorType}, interlace=${ihdr.interlace}`,
    );
  }
  if (idatCount === 0) throw new Error('PNG contains no IDAT chunks');
  return ihdr;
}

function parsePngChunks(bytes) {
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  if (buf.length < 33 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('Input is not a valid PNG buffer');
  }
  let offset = 8;
  let ihdr;
  const idatChunks = [];
  while (offset + 8 <= buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > buf.length) throw new Error('Truncated PNG chunk');
    if (type === 'IHDR') ihdr = parseIhdrChunk(buf, dataStart, length);
    else if (type === 'IDAT') idatChunks.push(buf.subarray(dataStart, dataEnd));
    else if (type === 'IEND') break;
    offset = dataEnd + 4;
  }
  const valid = validateParsedPngHeader(ihdr, idatChunks.length);
  return { width: valid.width, height: valid.height, colorType: valid.colorType, idatChunks };
}

/** Decode an 8-bit non-interlaced RGB (colorType 2) or RGBA (colorType 6) PNG into raw RGBA bytes. */
export function decodePngRgba(bytes) {
  const { width, height, colorType, idatChunks } = parsePngChunks(bytes);
  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  const expectedInflatedLength = (stride + 1) * height;
  const inflated = inflateSync(Buffer.concat(idatChunks), {
    maxOutputLength: expectedInflatedLength + 1024,
  });
  if (inflated.length < expectedInflatedLength) {
    throw new Error('Decompressed PNG data is shorter than expected');
  }
  const rgba = new Uint8Array(width * height * 4);
  let prevScanline = new Uint8Array(stride);
  let currScanline = new Uint8Array(stride);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (stride + 1);
    const filterType = inflated[rowOffset];
    const rawRow = inflated.subarray(rowOffset + 1, rowOffset + 1 + stride);
    unfilterScanline(filterType, { scanline: rawRow, prevScanline, bpp }, currScanline);
    const dstRowOffset = y * width * 4;
    if (bpp === 4) {
      rgba.set(currScanline, dstRowOffset);
    } else {
      for (let x = 0; x < width; x += 1) {
        const srcIdx = x * 3;
        const dstIdx = dstRowOffset + x * 4;
        rgba[dstIdx] = currScanline[srcIdx];
        rgba[dstIdx + 1] = currScanline[srcIdx + 1];
        rgba[dstIdx + 2] = currScanline[srcIdx + 2];
        rgba[dstIdx + 3] = 255;
      }
    }
    const swap = prevScanline;
    prevScanline = currScanline;
    currScanline = swap;
  }
  return { width, height, rgba };
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(nodeCrc32(crcInput) >>> 0, 0);
  return Buffer.concat([len, crcInput, crc]);
}

/** Encode raw RGBA pixels into a valid 8-bit RGBA PNG buffer. */
export function encodePngRgba(width, height, rgba) {
  const w = Math.max(1, Math.min(MAX_PNG_DIMENSION, Math.round(width)));
  const h = Math.max(1, Math.min(MAX_PNG_DIMENSION, Math.round(height)));
  if (rgba.length < w * h * 4) {
    throw new Error(`RGBA buffer too small for ${w}x${h} image`);
  }
  const stride = w * 4 + 1;
  const raw = Buffer.alloc(stride * h);
  const srcBuf = Buffer.from(rgba.buffer, rgba.byteOffset, rgba.byteLength);
  for (let y = 0; y < h; y += 1) {
    const rowStart = y * stride;
    raw[rowStart] = 0;
    const srcStart = y * w * 4;
    srcBuf.copy(raw, rowStart + 1, srcStart, srcStart + w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const idat = deflateSync(raw, { level: 3 });
  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Crop a sub-rectangle from a decoded RGBA image, clamping to valid image bounds. */
export function cropRgbaImage(image, crop) {
  const x0 = Math.max(0, Math.min(image.width - 1, Math.floor(crop.x)));
  const y0 = Math.max(0, Math.min(image.height - 1, Math.floor(crop.y)));
  const x1 = Math.max(x0 + 1, Math.min(image.width, Math.ceil(crop.x + crop.width)));
  const y1 = Math.max(y0 + 1, Math.min(image.height, Math.ceil(crop.y + crop.height)));
  const outW = x1 - x0;
  const outH = y1 - y0;
  const out = new Uint8Array(outW * outH * 4);
  for (let row = 0; row < outH; row += 1) {
    const srcStart = ((y0 + row) * image.width + x0) * 4;
    const srcEnd = srcStart + outW * 4;
    out.set(image.rgba.subarray(srcStart, srcEnd), row * outW * 4);
  }
  return { width: outW, height: outH, rgba: out };
}
