const { writeFileSync, mkdirSync } = require('fs');
const { deflateSync } = require('zlib');
const { join } = require('path');

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBytes = Buffer.from(type);
  const crcData = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData));
  return Buffer.concat([len, typeBytes, data, crc]);
}

function createPng(size, bgColor, dotColor, dotRadius) {
  const rawData = Buffer.alloc((size * 4 + 1) * size);
  const cx = size / 2;
  const cy = size / 2;

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    rawData[rowStart] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const px = rowStart + 1 + x * 4;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= dotRadius) {
        rawData[px] = dotColor[0];
        rawData[px + 1] = dotColor[1];
        rawData[px + 2] = dotColor[2];
        rawData[px + 3] = 255;
      } else {
        rawData[px] = bgColor[0];
        rawData[px + 1] = bgColor[1];
        rawData[px + 2] = bgColor[2];
        rawData[px + 3] = 255;
      }
    }
  }

  const compressed = deflateSync(rawData);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = join(__dirname, '../public/icons');
mkdirSync(outDir, { recursive: true });

const bg = [12, 10, 18];
const pink = [236, 72, 153];

for (const size of [16, 48, 128]) {
  const png = createPng(size, bg, pink, size * 0.35);
  writeFileSync(join(outDir, `icon-${size}.png`), png);
  console.log(`Generated icon-${size}.png (${png.length} bytes)`);
}
