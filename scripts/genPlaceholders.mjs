import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'assets');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    }
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2; // RGB, no alpha

  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 3);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 3;
      const dst = rowStart + 1 + x * 3;
      raw[dst] = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
    }
  }

  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function createCanvas(w, h, bgR, bgG, bgB) {
  const pixels = Buffer.alloc(w * h * 3);
  const detailScale = Math.max(1, Math.round(w / 64));
  for (let i = 0; i < w * h; i++) {
    pixels[i * 3] = bgR;
    pixels[i * 3 + 1] = bgG;
    pixels[i * 3 + 2] = bgB;
  }
  return {
    w,
    h,
    pixels,
    detailScale,
    set(x, y, r, g, b) {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const i = (y * w + x) * 3;
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
    },
    fillRect(x, y, rw, rh, r, g, b) {
      for (let py = y; py < y + rh; py++) {
        for (let px = x; px < x + rw; px++) {
          this.set(px, py, r, g, b);
        }
      }
    },
    fillCircle(cx, cy, radius, r, g, b) {
      const r2 = radius * radius;
      for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
        for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
          const dx = x - cx;
          const dy = y - cy;
          if (dx * dx + dy * dy <= r2) {
            this.set(x, y, r, g, b);
          }
        }
      }
    },
    strokeCircle(cx, cy, radius, r, g, b, thickness = 2 * detailScale) {
      for (let t = 0; t < thickness; t++) {
        const rad = radius - t * 0.5;
        const r2o = (rad + 0.5) ** 2;
        const r2i = (rad - 0.5) ** 2;
        for (let y = Math.floor(cy - rad - 1); y <= Math.ceil(cy + rad + 1); y++) {
          for (let x = Math.floor(cx - rad - 1); x <= Math.ceil(cx + rad + 1); x++) {
            const dx = x - cx;
            const dy = y - cy;
            const d2 = dx * dx + dy * dy;
            if (d2 <= r2o && d2 >= r2i) {
              this.set(x, y, r, g, b);
            }
          }
        }
      }
    },
    drawArrowLeft(cx, cy, length, r, g, b) {
      const x0 = cx + length * 0.35;
      const x1 = cx - length * 0.45;
      for (let t = 0; t <= 1; t += 0.02) {
        const x = x0 + (x1 - x0) * t;
        const y = cy;
        this.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3, r, g, b);
      }
      const tipX = x1;
      const tipY = cy;
      const hs = length * 0.22;
      for (let dy = -hs; dy <= hs; dy++) {
        const rowW = Math.round(hs - Math.abs(dy) * 0.8);
        for (let dx = 0; dx <= rowW; dx++) {
          this.set(Math.round(tipX - dx), Math.round(tipY + dy), r, g, b);
        }
      }
    },
    drawLabel(text, cx, cy, r, g, b) {
      const s = detailScale;
      const glyphW = 5 * s;
      const glyphH = 7 * s;
      const gap = s;
      const totalW = text.length * (glyphW + gap) - gap;
      let ox = cx - totalW / 2;
      for (const ch of text) {
        drawGlyph(this, ch, Math.round(ox), Math.round(cy - glyphH / 2), r, g, b, s);
        ox += glyphW + gap;
      }
    },
    strokePoly(pts, r, g, b) {
      for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[(i + 1) % pts.length];
        const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
        for (let s = 0; s <= steps; s++) {
          const t = steps === 0 ? 0 : s / steps;
          this.set(Math.round(x1 + (x2 - x1) * t), Math.round(y1 + (y2 - y1) * t), r, g, b);
        }
      }
    },
    fillEllipse(cx, cy, rx, ry, r, g, b) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const dx = (x - cx) / rx;
          const dy = (y - cy) / ry;
          if (dx * dx + dy * dy <= 1) {
            this.set(x, y, r, g, b);
          }
        }
      }
    },
    strokeEllipse(cx, cy, rx, ry, r, g, b, t) {
      for (let i = 0; i < t; i++) {
        const irx = rx - i * 0.4;
        const iry = ry - i * 0.4;
        for (let y = Math.floor(cy - iry - 1); y <= Math.ceil(cy + iry + 1); y++) {
          for (let x = Math.floor(cx - irx - 1); x <= Math.ceil(cx + irx + 1); x++) {
            const dx = (x - cx) / irx;
            const dy = (y - cy) / iry;
            const d = dx * dx + dy * dy;
            if (d <= 1.05 && d >= 0.85) {
              this.set(x, y, r, g, b);
            }
          }
        }
      }
    },
    toPng() {
      return encodePng(w, h, pixels);
    },
  };
}

const GLYPHS = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  G: ['01111', '10000', '10000', '10011', '10001', '10001', '01111'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10001', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
};

function drawGlyph(canvas, ch, x, y, r, g, b, scale = 1) {
  const rows = GLYPHS[ch.toUpperCase()];
  if (!rows) return;
  for (let row = 0; row < rows.length; row++) {
    for (let col = 0; col < rows[row].length; col++) {
      if (rows[row][col] === '1') {
        canvas.fillRect(x + col * scale, y + row * scale, scale, scale, r, g, b);
      }
    }
  }
}

function drawTile(size, topR, topG, topB) {
  return createCanvas(size, size, topR, topG, topB);
}

function drawBuilding(w, h, fill, label, withArrow = false) {
  const [r, g, b] = fill;
  const c = createCanvas(w, h, r, g, b);
  const cx = w / 2;
  const cy = h / 2;
  c.fillCircle(cx, cy, Math.min(w, h) * 0.32, Math.min(255, r + 30), Math.min(255, g + 30), Math.min(255, b + 30));
  c.strokeCircle(cx, cy, Math.min(w, h) * 0.32, 30, 30, 30, 2);
  if (withArrow) {
    c.drawArrowLeft(cx, cy, w * 0.35, 255, 255, 255);
  }
  c.drawLabel(label, cx, cy + h * 0.28, 255, 255, 255);
  return c;
}

function drawRectBuilding(w, h, fill, label) {
  const [r, g, b] = fill;
  const c = createCanvas(w, h, r, g, b);
  const cx = w / 2;
  const cy = h / 2;
  const rw = w * 0.55;
  const rh = h * 0.45;
  c.fillRect(cx - rw / 2, cy - rh / 2, rw, rh, Math.min(255, r + 25), Math.min(255, g + 25), Math.min(255, b + 25));
  c.fillRect(cx - rw / 2, cy - rh / 2, rw, 2, 30, 30, 30);
  c.fillRect(cx - rw / 2, cy + rh / 2 - 2, rw, 2, 30, 30, 30);
  c.drawLabel(label, cx, cy + rh * 0.35, 255, 255, 255);
  return c;
}

function drawCat(w, h, fill) {
  const [r, g, b] = fill;
  const c = createCanvas(w, h, r, g, b);
  const cx = w / 2;
  const cy = h / 2;
  const rad = Math.min(w, h) * 0.35;
  const starR = Math.min(255, r * 0.75);
  const starG = Math.min(255, g * 0.75);
  const starB = Math.min(255, b * 0.75);
  for (let i = 0; i < 5; i++) {
    const a1 = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const a2 = -Math.PI / 2 + ((i * 2 + 1) * Math.PI) / 5;
    const x1 = cx + rad * Math.cos(a1);
    const y1 = cy + rad * Math.sin(a1);
    const x2 = cx + rad * 0.45 * Math.cos(a2);
    const y2 = cy + rad * 0.45 * Math.sin(a2);
    fillTri(c, cx, cy, x1, y1, x2, y2, starR, starG, starB);
  }
  c.strokeCircle(cx, cy, rad, 30, 30, 30, 1);
  return c;
}

function fillTri(c, x0, y0, x1, y1, x2, y2, r, g, b) {
  const minX = Math.floor(Math.min(x0, x1, x2));
  const maxX = Math.ceil(Math.max(x0, x1, x2));
  const minY = Math.floor(Math.min(y0, y1, y2));
  const maxY = Math.ceil(Math.max(y0, y1, y2));
  const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const w0 = (x1 - x0) * (y - y0) - (y1 - y0) * (x - x0);
      const w1 = (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1);
      const w2 = (x0 - x2) * (y - y2) - (y0 - y2) * (x - x2);
      if (
        (area > 0 && w0 >= 0 && w1 >= 0 && w2 >= 0) ||
        (area < 0 && w0 <= 0 && w1 <= 0 && w2 <= 0)
      ) {
        c.set(x, y, r, g, b);
      }
    }
  }
}

function drawPlayer(w, h) {
  const c = createCanvas(w, h, 74, 144, 217);
  const cx = w / 2;
  const cy = h * 0.55;
  c.fillEllipse(cx, cy + h * 0.18, w * 0.32, h * 0.08, 42, 90, 138);
  c.fillEllipse(cx, cy - h * 0.05, w * 0.28, h * 0.35, 100, 170, 235);
  c.strokeEllipse(cx, cy - h * 0.05, w * 0.28, h * 0.35, 42, 90, 138, 2);
  return c;
}

function drawPickup(w, h) {
  const c = createCanvas(w, h, 255, 220, 180);
  const cx = w / 2;
  const cy = h / 2;
  c.fillCircle(cx - 4, cy + 2, 6, 255, 235, 210);
  c.fillRect(cx - 10, cy + 6, 20, 8, 255, 235, 210);
  c.fillRect(cx - 12, cy + 12, 24, 6, 200, 170, 140);
  c.drawLabel('GET', cx, cy - 8, 80, 50, 30);
  return c;
}

function drawUiIcon(w, h, fill, label) {
  const [r, g, b] = fill;
  const c = createCanvas(w, h, r, g, b);
  c.fillRect(0, 0, w, 3, Math.min(255, r + 40), Math.min(255, g + 40), Math.min(255, b + 40));
  c.drawLabel(label, w / 2, h / 2 + 4, 255, 255, 255);
  return c;
}

const SOURCE_SCALE = 4;
const CELL_SIZE = 64 * SOURCE_SCALE;
const UI_SIZE = 32 * SOURCE_SCALE;

const assets = [
  ['tiles/tile_light.png', drawTile(CELL_SIZE, 232, 232, 232)],
  ['tiles/tile_dark.png', drawTile(CELL_SIZE, 176, 176, 176)],
  ['buildings/cat_nest.png', drawBuilding(CELL_SIZE, CELL_SIZE, [212, 165, 116], 'NEST', true)],
  ['buildings/conveyor.png', drawBuilding(CELL_SIZE, CELL_SIZE, [107, 140, 174], 'BELT', true)],
  ['buildings/packing_box.png', drawRectBuilding(CELL_SIZE, CELL_SIZE, [139, 115, 85], 'BOX')],
  ['buildings/mutation_gate.png', drawBuilding(CELL_SIZE, CELL_SIZE, [155, 89, 182], 'GATE', true)],
  ['cats/cat_normal.png', drawCat(CELL_SIZE, CELL_SIZE, [255, 255, 255])],
  ['cats/cat_mutated.png', drawCat(CELL_SIZE, CELL_SIZE, [231, 76, 60])],
  ['player/player.png', drawPlayer(CELL_SIZE, CELL_SIZE)],
  ['ui/pickup.png', drawPickup(UI_SIZE, UI_SIZE)],
  ['ui/cat_nest.png', drawUiIcon(UI_SIZE, UI_SIZE, [212, 165, 116], 'NEST')],
  ['ui/conveyor.png', drawUiIcon(UI_SIZE, UI_SIZE, [107, 140, 174], 'BELT')],
  ['ui/packing_box.png', drawUiIcon(UI_SIZE, UI_SIZE, [139, 115, 85], 'BOX')],
  ['ui/mutation_gate.png', drawUiIcon(UI_SIZE, UI_SIZE, [155, 89, 182], 'GATE')],
];

async function main() {
  for (const [rel, canvas] of assets) {
    const outPath = join(OUT, rel);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, canvas.toPng());
    console.log('wrote', rel);
  }
  console.log('Done — placeholder assets in public/assets/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
