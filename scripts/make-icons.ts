/**
 * Generates simple solid-color placeholder PNG icons for the PWA so the manifest
 * is complete. Replace later with a real icon. Run: bun run scripts/make-icons.ts
 */
import { deflateSync } from 'node:zlib';
import { mkdir } from 'node:fs/promises';

const COLOR: [number, number, number] = [0x0a, 0x84, 0xff]; // iOS blue

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const len = data.length;
  const out = new Uint8Array(12 + len);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, len);
  out.set(typeBytes, 4);
  out.set(data, 8);
  const crc = crc32(out.subarray(4, 8 + len));
  dv.setUint32(8 + len, crc);
  return out;
}

function makePng(size: number, [r, g, b]: [number, number, number]): Uint8Array {
  const sig = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, size);
  dv.setUint32(4, size);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  // 10..12 default 0 (compression, filter, interlace)

  // Raw image: each row = filter byte (0) + size*3 RGB bytes.
  const row = new Uint8Array(1 + size * 3);
  for (let x = 0; x < size; x++) {
    row[1 + x * 3] = r;
    row[1 + x * 3 + 1] = g;
    row[1 + x * 3 + 2] = b;
  }
  const raw = new Uint8Array((1 + size * 3) * size);
  for (let y = 0; y < size; y++) raw.set(row, y * (1 + size * 3));

  const idat = deflateSync(raw);

  const parts = [
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', new Uint8Array(idat)),
    chunk('IEND', new Uint8Array(0)),
  ];
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

async function main() {
  await mkdir('public/icons', { recursive: true });
  const targets: [string, number][] = [
    ['192.png', 192],
    ['512.png', 512],
    ['maskable-512.png', 512],
    ['apple-touch-icon-180.png', 180],
  ];
  for (const [name, size] of targets) {
    await Bun.write(`public/icons/${name}`, makePng(size, COLOR));
    console.log(`wrote public/icons/${name} (${size}x${size})`);
  }
}

main();
