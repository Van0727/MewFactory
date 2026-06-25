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
  ihdr[9] = 2;

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

function encodePngRgba(width, height, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 4);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = rowStart + 1 + x * 4;
      raw[dst] = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
      raw[dst + 3] = pixels[src + 3];
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

function attachDrawMethods(canvas, stride) {
  const { w, h, pixels } = canvas;
  canvas.set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * stride;
    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
    if (stride === 4) {
      pixels[i + 3] = a;
    }
  };
  canvas.fillRect = (x, y, rw, rh, r, g, b, a = 255) => {
    for (let py = y; py < y + rh; py++) {
      for (let px = x; px < x + rw; px++) {
        canvas.set(px, py, r, g, b, a);
      }
    }
  };
  canvas.fillCircle = (cx, cy, radius, r, g, b, a = 255) => {
    const r2 = radius * radius;
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) {
          canvas.set(x, y, r, g, b, a);
        }
      }
    }
  };
  canvas.fillEllipse = (cx, cy, rx, ry, r, g, b, a = 255) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) {
          canvas.set(x, y, r, g, b, a);
        }
      }
    }
  };
  canvas.drawArrowLeft = (cx, cy, length, r, g, b, a = 255) => {
    const x0 = cx + length * 0.35;
    const x1 = cx - length * 0.45;
    for (let t = 0; t <= 1; t += 0.02) {
      const x = x0 + (x1 - x0) * t;
      const y = cy;
      canvas.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5, r, g, b, a);
    }
    const tipX = x1;
    const tipY = cy;
    const hs = length * 0.24;
    for (let dy = -hs; dy <= hs; dy++) {
      const rowW = Math.round(hs - Math.abs(dy) * 0.85);
      for (let dx = 0; dx <= rowW; dx++) {
        canvas.set(Math.round(tipX - dx), Math.round(tipY + dy), r, g, b, a);
      }
    }
  };
  canvas.drawArrowUp = (cx, cy, length, r, g, b, a = 255) => {
    const y0 = cy + length * 0.35;
    const y1 = cy - length * 0.45;
    for (let t = 0; t <= 1; t += 0.02) {
      const y = y0 + (y1 - y0) * t;
      canvas.fillRect(Math.round(cx) - 2, Math.round(y) - 2, 5, 5, r, g, b, a);
    }
    const tipX = cx;
    const tipY = y1;
    const hs = length * 0.24;
    for (let dx = -hs; dx <= hs; dx++) {
      const rowH = Math.round(hs - Math.abs(dx) * 0.85);
      for (let dy = 0; dy <= rowH; dy++) {
        canvas.set(Math.round(tipX + dx), Math.round(tipY - dy), r, g, b, a);
      }
    }
  };
}

function createCanvas(w, h, bgR, bgG, bgB) {
  const pixels = Buffer.alloc(w * h * 3);
  const detailScale = Math.max(1, Math.round(w / 64));
  for (let i = 0; i < w * h; i++) {
    pixels[i * 3] = bgR;
    pixels[i * 3 + 1] = bgG;
    pixels[i * 3 + 2] = bgB;
  }
  const canvas = { w, h, pixels, detailScale };
  attachDrawMethods(canvas, 3);
  canvas.strokeCircle = (cx, cy, radius, r, g, b, thickness = 2 * detailScale) => {
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
            canvas.set(x, y, r, g, b);
          }
        }
      }
    }
  };
  canvas.drawLabel = (text, cx, cy, r, g, b) => {
    const s = detailScale;
    const glyphW = 5 * s;
    const glyphH = 7 * s;
    const gap = s;
    const totalW = text.length * (glyphW + gap) - gap;
    let ox = cx - totalW / 2;
    for (const ch of text) {
      drawGlyph(canvas, ch, Math.round(ox), Math.round(cy - glyphH / 2), r, g, b, s);
      ox += glyphW + gap;
    }
  };
  canvas.strokeEllipse = (cx, cy, rx, ry, r, g, b, t) => {
    for (let i = 0; i < t; i++) {
      const irx = rx - i * 0.4;
      const iry = ry - i * 0.4;
      for (let y = Math.floor(cy - iry - 1); y <= Math.ceil(cy + iry + 1); y++) {
        for (let x = Math.floor(cx - irx - 1); x <= Math.ceil(cx + irx + 1); x++) {
          const dx = (x - cx) / irx;
          const dy = (y - cy) / iry;
          const d = dx * dx + dy * dy;
          if (d <= 1.05 && d >= 0.85) {
            canvas.set(x, y, r, g, b);
          }
        }
      }
    }
  };
  canvas.toPng = () => encodePng(w, h, pixels);
  return canvas;
}

function createAlphaCanvas(w, h) {
  const pixels = Buffer.alloc(w * h * 4, 0);
  const detailScale = Math.max(1, Math.round(w / 64));
  const canvas = { w, h, pixels, detailScale };
  attachDrawMethods(canvas, 4);
  canvas.toPng = () => encodePngRgba(w, h, pixels);
  return canvas;
}


const GLYPHS = {
  $: ['01110', '10001', '10000', '01110', '00001', '10001', '01110'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
};

function drawGlyph(canvas, ch, x, y, r, g, b, scale = 1) {
  const rows = GLYPHS[ch];
  if (!rows) return;
  for (let row = 0; row < rows.length; row++) {
    for (let col = 0; col < rows[row].length; col++) {
      if (rows[row][col] === '1') {
        canvas.fillRect(x + col * scale, y + row * scale, scale, scale, r, g, b);
      }
    }
  }
}

function shade([r, g, b], amount) {
  return [
    Math.max(0, Math.min(255, Math.round(r + amount))),
    Math.max(0, Math.min(255, Math.round(g + amount))),
    Math.max(0, Math.min(255, Math.round(b + amount))),
  ];
}

function fillRoundRect(c, x, y, w, h, radius, r, g, b) {
  const rad = Math.min(radius, w / 2, h / 2);
  for (let py = Math.floor(y); py < y + h; py++) {
    for (let px = Math.floor(x); px < x + w; px++) {
      let inside = true;
      if (px < x + rad && py < y + rad) {
        inside = (px - (x + rad)) ** 2 + (py - (y + rad)) ** 2 <= rad ** 2;
      } else if (px >= x + w - rad && py < y + rad) {
        inside = (px - (x + w - rad)) ** 2 + (py - (y + rad)) ** 2 <= rad ** 2;
      } else if (px < x + rad && py >= y + h - rad) {
        inside = (px - (x + rad)) ** 2 + (py - (y + h - rad)) ** 2 <= rad ** 2;
      } else if (px >= x + w - rad && py >= y + h - rad) {
        inside = (px - (x + w - rad)) ** 2 + (py - (y + h - rad)) ** 2 <= rad ** 2;
      }
      if (inside) {
        c.set(px, py, r, g, b);
      }
    }
  }
}

function drawPawPrint(c, cx, cy, size, r, g, b) {
  const padR = size * 0.22;
  c.fillCircle(cx, cy + size * 0.12, padR, r, g, b);
  const toeR = size * 0.11;
  const spread = size * 0.28;
  c.fillCircle(cx - spread, cy - size * 0.08, toeR, r, g, b);
  c.fillCircle(cx, cy - size * 0.22, toeR, r, g, b);
  c.fillCircle(cx + spread, cy - size * 0.08, toeR, r, g, b);
}

function drawSoftTile(size, topRgb, withPaw = false) {
  const c = createCanvas(size, size, ...topRgb);
  if (withPaw) {
    const cx = size / 2;
    const cy = size / 2;
    drawPawPrint(c, cx, cy + size * 0.02, size * 0.34, ...shade(topRgb, -42));
  }
  return c;
}

function drawFullCellConveyor(w, h, rgb) {
  const c = createCanvas(w, h, ...rgb);
  const cx = w / 2;
  const cy = h / 2;
  const len = Math.min(w, h) * 0.3;
  c.drawArrowLeft(cx, cy, len, 255, 255, 255);
  return c;
}

function drawThickPiece(w, h, topRgb, drawIcon) {
  const c = createCanvas(w, h, 0, 0, 0);
  const cx = w / 2;
  const pieceW = w * 0.72;
  const pieceH = h * 0.52;
  const topY = h * 0.2;
  const radius = pieceW * 0.14;
  const side = shade(topRgb, -48);

  c.fillEllipse(cx, topY + pieceH + h * 0.12, pieceW * 0.38, h * 0.06, 90, 55, 130);
  fillRoundRect(c, cx - pieceW / 2 + 5, topY + 9, pieceW, pieceH, radius * 0.85, ...side);
  fillRoundRect(c, cx - pieceW / 2, topY, pieceW, pieceH, radius, ...topRgb);
  fillRoundRect(
    c,
    cx - pieceW / 2 + pieceW * 0.07,
    topY + 5,
    pieceW * 0.86,
    pieceH * 0.24,
    radius * 0.45,
    ...shade(topRgb, 38),
  );
  drawIcon(c, cx, topY + pieceH * 0.52, Math.min(w, h));
  return c;
}

function drawMiniCatFace(c, cx, cy, s, furRgb, eyeRgb = [95, 75, 115]) {
  c.fillCircle(cx, cy, s, ...furRgb);
  c.fillCircle(cx - s * 0.55, cy - s * 0.55, s * 0.38, ...shade(furRgb, 12));
  c.fillCircle(cx + s * 0.55, cy - s * 0.55, s * 0.38, ...shade(furRgb, 12));
  c.fillCircle(cx - s * 0.3, cy + s * 0.02, s * 0.11, ...eyeRgb);
  c.fillCircle(cx + s * 0.3, cy + s * 0.02, s * 0.11, ...eyeRgb);
  c.fillCircle(cx, cy + s * 0.28, s * 0.09, 255, 165, 145);
}

function drawNestBowl(c, cx, cy, s, rimRgb, innerRgb) {
  c.fillEllipse(cx, cy + s * 0.42, s * 1.25, s * 0.48, ...rimRgb);
  c.fillEllipse(cx, cy + s * 0.32, s * 1.05, s * 0.36, ...innerRgb);
}

/** Lv.1 土豆猫 — 圆滚滚土豆形猫身 + 浅色斑点 */
function drawCatNestPotato(c, cx, cy, size) {
  const s = size * 0.36;
  drawNestBowl(c, cx, cy, s, [235, 195, 130], [255, 228, 185]);
  c.fillEllipse(cx, cy + s * 0.02, s * 0.92, s * 0.78, 215, 168, 88);
  c.fillCircle(cx - s * 0.32, cy - s * 0.02, s * 0.1, 195, 148, 72);
  c.fillCircle(cx + s * 0.18, cy + s * 0.18, s * 0.08, 188, 142, 68);
  c.fillCircle(cx - s * 0.08, cy + s * 0.22, s * 0.07, 200, 152, 78);
  drawMiniCatFace(c, cx, cy - s * 0.22, s * 0.34, [255, 238, 210], [100, 80, 60]);
}

/** Lv.2 腊肠猫 — 横向长条身形 + 短腿 */
function drawCatNestSausage(c, cx, cy, size) {
  const s = size * 0.36;
  drawNestBowl(c, cx, cy, s, [195, 220, 175], [225, 245, 210]);
  c.fillEllipse(cx + s * 0.08, cy + s * 0.08, s * 1.15, s * 0.38, 198, 118, 72);
  c.fillEllipse(cx - s * 0.62, cy + s * 0.02, s * 0.36, s * 0.34, 210, 130, 82);
  drawMiniCatFace(c, cx - s * 0.62, cy - s * 0.12, s * 0.3, [215, 135, 88], [90, 65, 50]);
  const legW = s * 0.14;
  const legH = s * 0.22;
  for (const lx of [cx - s * 0.35, cx + s * 0.15, cx + s * 0.45, cx + s * 0.75]) {
    fillRoundRect(c, lx - legW / 2, cy + s * 0.28, legW, legH, legW * 0.35, 175, 105, 65);
  }
}

/** Lv.3 肌肉猫 — 粗壮大臂 + 宽肩 */
function drawCatNestMuscle(c, cx, cy, size) {
  const s = size * 0.36;
  drawNestBowl(c, cx, cy, s, [170, 195, 235], [205, 225, 255]);
  c.fillEllipse(cx, cy + s * 0.05, s * 0.72, s * 0.62, 140, 185, 235);
  c.fillCircle(cx - s * 0.72, cy + s * 0.08, s * 0.28, 120, 165, 220);
  c.fillCircle(cx + s * 0.72, cy + s * 0.08, s * 0.28, 120, 165, 220);
  c.fillCircle(cx - s * 0.72, cy - s * 0.12, s * 0.2, 135, 178, 230);
  c.fillCircle(cx + s * 0.72, cy - s * 0.12, s * 0.2, 135, 178, 230);
  drawMiniCatFace(c, cx, cy - s * 0.28, s * 0.32, [160, 200, 245], [70, 95, 140]);
  c.fillRect(Math.round(cx - s * 0.55), Math.round(cy + s * 0.38), Math.round(s * 1.1), Math.round(s * 0.08), 110, 150, 200);
}

/** Lv.4 长腿猫 — 小圆身 + 四根细长腿 */
function drawCatNestLongLeg(c, cx, cy, size) {
  const s = size * 0.36;
  drawNestBowl(c, cx, cy, s, [200, 175, 225], [230, 210, 248]);
  const legW = s * 0.1;
  const legH = s * 0.55;
  const legY = cy + s * 0.02;
  for (const lx of [cx - s * 0.38, cx - s * 0.12, cx + s * 0.12, cx + s * 0.38]) {
    fillRoundRect(c, lx - legW / 2, legY, legW, legH, legW * 0.4, 175, 145, 210);
    c.fillCircle(lx, legY + legH, legW * 0.55, 190, 160, 225);
  }
  drawMiniCatFace(c, cx, cy - s * 0.38, s * 0.3, [210, 185, 240], [85, 65, 115]);
}

/** Lv.5 无头猫 — 只有圆身与项圈，无头部 */
function drawCatNestHeadless(c, cx, cy, size) {
  const s = size * 0.36;
  drawNestBowl(c, cx, cy, s, [235, 195, 145], [255, 225, 185]);
  c.fillCircle(cx, cy + s * 0.05, s * 0.62, 255, 195, 120);
  c.fillEllipse(cx, cy - s * 0.38, s * 0.72, s * 0.18, 255, 120, 90);
  c.fillEllipse(cx, cy - s * 0.42, s * 0.55, s * 0.1, 255, 200, 160);
  c.fillCircle(cx - s * 0.22, cy + s * 0.02, s * 0.09, 240, 175, 100);
  c.fillCircle(cx + s * 0.22, cy + s * 0.02, s * 0.09, 240, 175, 100);
  c.fillCircle(cx, cy + s * 0.18, s * 0.07, 255, 170, 150);
  c.fillCircle(cx - s * 0.38, cy + s * 0.35, s * 0.12, 245, 185, 110);
  c.fillCircle(cx + s * 0.38, cy + s * 0.35, s * 0.12, 245, 185, 110);
}

const CAT_NEST_BG = [
  [255, 238, 205],
  [218, 242, 218],
  [205, 228, 255],
  [232, 215, 248],
  [255, 228, 195],
];

const CAT_NEST_DRAWERS = [
  drawCatNestPotato,
  drawCatNestSausage,
  drawCatNestMuscle,
  drawCatNestLongLeg,
  drawCatNestHeadless,
];

function drawFullCellCatNest(w, h, level) {
  const bg = CAT_NEST_BG[level - 1] ?? CAT_NEST_BG[0];
  const c = createCanvas(w, h, ...bg);
  const drawer = CAT_NEST_DRAWERS[level - 1] ?? CAT_NEST_DRAWERS[0];
  drawer(c, w / 2, h / 2, Math.min(w, h));
  return c;
}

const MUTATION_GATE_COLORS = [
  [255, 85, 45],
  [55, 235, 95],
  [45, 145, 255],
  [215, 65, 255],
];

/** 单根竖条占满 PNG 高度；方向与传送带一致，旋转后与传送带垂直 */
function drawMutationGateBar(c, w, h, rgb) {
  const barW = w * 0.34;
  fillRoundRect(c, (w - barW) / 2, 0, barW, h, barW * 0.45, ...rgb);
}

function drawMutationGateOverlay(w, h, level) {
  const c = createAlphaCanvas(w, h);
  const rgb = MUTATION_GATE_COLORS[level - 1] ?? MUTATION_GATE_COLORS[0];
  drawMutationGateBar(c, w, h, rgb);
  return c;
}

/** Lv.1 纸箱 — 牛皮纸箱 + 胶带 */
function drawBoxCardboard(c, cx, cy, size) {
  const s = size * 0.36;
  fillRoundRect(c, cx - s, cy - s * 0.55, s * 2, s * 1.35, s * 0.12, 195, 155, 110);
  c.fillRect(Math.round(cx - s * 0.08), Math.round(cy - s * 0.55), Math.round(s * 0.16), Math.round(s * 1.35), 230, 200, 150);
  c.fillRect(Math.round(cx - s), Math.round(cy - s * 0.08), Math.round(s * 2), Math.round(s * 0.14), 230, 200, 150);
  c.fillRect(Math.round(cx - s * 0.82), Math.round(cy - s * 0.52), Math.round(s * 1.64), Math.round(s * 0.06), 175, 135, 95);
}

/** Lv.2 顺丰包装箱 — 橙白快递箱 */
function drawBoxSF(c, cx, cy, size) {
  const s = size * 0.36;
  fillRoundRect(c, cx - s, cy - s * 0.55, s * 2, s * 1.35, s * 0.1, 235, 125, 55);
  fillRoundRect(c, cx - s * 0.82, cy - s * 0.42, s * 1.64, s * 0.38, s * 0.06, 255, 248, 240);
  fillRoundRect(c, cx - s * 0.65, cy - s * 0.35, s * 1.3, s * 0.14, s * 0.04, 180, 85, 40);
  fillRoundRect(c, cx - s * 0.22, cy - s * 0.28, s * 0.18, s * 0.22, s * 0.04, 255, 255, 255);
  fillRoundRect(c, cx + s * 0.02, cy - s * 0.28, s * 0.18, s * 0.22, s * 0.04, 255, 255, 255);
}

/** Lv.3 浴缸 — 白色浴缸 + 蓝色池水 */
function drawBoxBathtub(c, cx, cy, size) {
  const s = size * 0.36;
  c.fillEllipse(cx, cy + s * 0.38, s * 1.12, s * 0.32, 195, 210, 225);
  fillRoundRect(c, cx - s * 1.05, cy - s * 0.12, s * 2.1, s * 0.62, s * 0.32, 248, 252, 255);
  c.fillEllipse(cx, cy + s * 0.08, s * 0.82, s * 0.34, 120, 190, 245);
  fillRoundRect(c, cx - s * 0.52, cy - s * 0.52, s * 0.22, s * 0.32, s * 0.07, 210, 220, 230);
  c.fillCircle(cx - s * 0.41, cy - s * 0.48, s * 0.07, 175, 190, 205);
}

/** Lv.4 圣诞袜 — 红袜 + 白绒袜口 */
function drawBoxStocking(c, cx, cy, size) {
  const s = size * 0.36;
  fillRoundRect(c, cx - s * 0.55, cy - s * 0.62, s * 1.1, s * 0.32, s * 0.14, 255, 250, 245);
  c.fillCircle(cx - s * 0.52, cy - s * 0.46, s * 0.11, 255, 250, 245);
  c.fillCircle(cx + s * 0.52, cy - s * 0.46, s * 0.11, 255, 250, 245);
  fillRoundRect(c, cx - s * 0.48, cy - s * 0.32, s * 0.92, s * 0.82, s * 0.18, 220, 70, 80);
  fillRoundRect(c, cx - s * 0.12, cy + s * 0.22, s * 0.92, s * 0.32, s * 0.14, 210, 60, 70);
  c.fillRect(Math.round(cx - s * 0.45), Math.round(cy - s * 0.08), Math.round(s * 0.9), Math.round(s * 0.1), 80, 170, 100);
  c.fillCircle(cx + s * 0.12, cy + s * 0.02, s * 0.08, 255, 220, 95);
}

/** Lv.5 异次元口袋 — 紫色魔法袋 + 漩涡 */
function drawBoxPocket(c, cx, cy, size) {
  const s = size * 0.36;
  c.fillEllipse(cx, cy + s * 0.42, s * 1.08, s * 0.26, 175, 135, 225);
  fillRoundRect(c, cx - s * 0.82, cy - s * 0.32, s * 1.64, s * 0.98, s * 0.22, 160, 105, 215);
  c.fillEllipse(cx, cy + s * 0.06, s * 0.52, s * 0.42, 255, 155, 85);
  c.fillEllipse(cx, cy + s * 0.06, s * 0.32, s * 0.26, 255, 215, 125);
  c.fillEllipse(cx, cy + s * 0.06, s * 0.16, s * 0.12, 255, 255, 205);
  c.fillEllipse(cx, cy - s * 0.36, s * 0.72, s * 0.11, 195, 155, 235);
  for (const [sx, sy] of [
    [-0.48, -0.15],
    [0.5, -0.1],
    [0.28, 0.32],
  ]) {
    c.fillCircle(cx + s * sx, cy + s * sy, s * 0.06, 255, 245, 175);
  }
}

const BOX_BG = [
  [245, 235, 220],
  [255, 240, 228],
  [218, 235, 255],
  [255, 232, 235],
  [238, 225, 255],
];

const BOX_DRAWERS = [
  drawBoxCardboard,
  drawBoxSF,
  drawBoxBathtub,
  drawBoxStocking,
  drawBoxPocket,
];

function drawFullCellPackingBox(w, h, level) {
  const bg = BOX_BG[level - 1] ?? BOX_BG[0];
  const c = createCanvas(w, h, ...bg);
  const drawer = BOX_DRAWERS[level - 1] ?? BOX_DRAWERS[0];
  drawer(c, w / 2, h / 2, Math.min(w, h));
  return c;
}

function drawCoinIcon(c, cx, cy, size) {
  const r = size * 0.18;
  c.fillCircle(cx, cy, r, 255, 220, 80);
  c.strokeCircle(cx, cy, r, 200, 150, 40, 2);
  c.drawLabel('$', cx, cy + 1, 140, 90, 20);
}

function drawRoundCat(w, h, bodyRgb, earRgb = null) {
  const c = createCanvas(w, h, 0, 0, 0);
  const cx = w / 2;
  const cy = h / 2 + h * 0.04;
  const rad = Math.min(w, h) * 0.28;
  const [er, eg, eb] = earRgb ?? shade(bodyRgb, -20);
  c.fillCircle(cx - rad * 0.55, cy - rad * 0.75, rad * 0.35, er, eg, eb);
  c.fillCircle(cx + rad * 0.55, cy - rad * 0.75, rad * 0.35, er, eg, eb);
  c.fillCircle(cx, cy, rad, ...bodyRgb);
  c.strokeCircle(cx, cy, rad, ...shade(bodyRgb, -40), 2);
  c.fillCircle(cx - rad * 0.35, cy - rad * 0.1, rad * 0.12, 50, 40, 45);
  c.fillCircle(cx + rad * 0.35, cy - rad * 0.1, rad * 0.12, 50, 40, 45);
  c.fillCircle(cx, cy + rad * 0.25, rad * 0.1, 255, 150, 130);
  return c;
}

function drawSellShop(w, h) {
  return drawThickPiece(w, h, [255, 208, 70], drawCoinIcon);
}

function drawGoldChick(w, h) {
  const c = createCanvas(w, h, 0, 0, 0);
  const cx = w / 2;
  const cy = h / 2;
  c.fillCircle(cx, cy + 1, w * 0.34, 255, 220, 120);
  c.fillCircle(cx - w * 0.12, cy - h * 0.06, w * 0.07, 70, 50, 40);
  c.fillCircle(cx + w * 0.12, cy - h * 0.06, w * 0.07, 70, 50, 40);
  c.fillCircle(cx, cy + h * 0.08, w * 0.05, 255, 140, 100);
  c.fillCircle(cx - w * 0.2, cy - h * 0.18, w * 0.08, 255, 220, 120);
  c.fillCircle(cx + w * 0.2, cy - h * 0.18, w * 0.08, 255, 220, 120);
  return c;
}

function drawPlayer(w, h) {
  const c = createCanvas(w, h, 0, 0, 0);
  const cx = w / 2;
  const cy = h * 0.52;
  c.fillEllipse(cx, cy + h * 0.2, w * 0.28, h * 0.07, 90, 60, 140);
  fillRoundRect(c, cx - w * 0.18, cy - h * 0.02, w * 0.36, h * 0.34, w * 0.12, 100, 180, 255);
  c.fillCircle(cx, cy - h * 0.12, w * 0.2, 255, 220, 100);
  c.fillCircle(cx - w * 0.07, cy - h * 0.14, w * 0.035, 60, 45, 40);
  c.fillCircle(cx + w * 0.07, cy - h * 0.14, w * 0.035, 60, 45, 40);
  return c;
}

function drawPickup(w, h) {
  const c = createCanvas(w, h, 200, 160, 230);
  fillRoundRect(c, w * 0.12, h * 0.12, w * 0.76, h * 0.76, w * 0.15, 180, 130, 220);
  drawPawPrint(c, w / 2, h / 2 + 2, w * 0.35, 255, 240, 255);
  return c;
}

function drawSceneBackground(w, h) {
  const c = createCanvas(w, h, 205, 165, 235);
  const clouds = [
    [0.1, 0.12], [0.28, 0.08], [0.55, 0.1], [0.78, 0.14], [0.92, 0.09],
  ];
  for (const [fx, fy] of clouds) {
    const cx = w * fx;
    const cy = h * fy;
    c.fillCircle(cx, cy, 34, 255, 255, 255);
    c.fillCircle(cx + 24, cy + 8, 26, 255, 255, 255);
    c.fillCircle(cx - 20, cy + 10, 22, 255, 255, 255);
  }
  const stars = [
    [0.15, 0.25], [0.42, 0.18], [0.68, 0.22], [0.85, 0.3], [0.25, 0.35], [0.55, 0.32],
  ];
  for (const [sx, sy] of stars) {
    c.fillCircle(w * sx, h * sy, 3, 255, 250, 200);
  }
  fillRoundRect(c, w * 0.03, h * 0.05, w * 0.15, h * 0.13, 14, 165, 115, 210);
  c.fillCircle(w * 0.105, h * 0.1, 16, 255, 200, 110);
  fillRoundRect(c, w * 0.8, h * 0.04, w * 0.16, h * 0.12, 12, 155, 105, 200);
  drawPawPrint(c, w * 0.88, h * 0.09, 24, 255, 210, 140);
  drawPawPrint(c, w * 0.08, h * 0.82, 34, 185, 145, 220);
  drawPawPrint(c, w * 0.9, h * 0.78, 30, 185, 145, 220);
  return c;
}

const SOURCE_SCALE = 4;
const CELL_SIZE = 64 * SOURCE_SCALE;
const UI_SIZE = 32 * SOURCE_SCALE;

const TILE_LIGHT = [248, 248, 248];
const TILE_DARK = [210, 210, 210];

function tintRgb(base, level, maxLevel, step = 16) {
  const t = maxLevel <= 1 ? 0 : (level - 1) / (maxLevel - 1);
  return base.map((v) => Math.min(255, Math.round(v + t * step)));
}

function conveyorColor(level) {
  if (level >= 4) return tintRgb([255, 160, 80], level, 5, 8);
  return tintRgb([110, 190, 255], level, 5);
}

const assets = [
  ['background/scene.png', drawSceneBackground(640, 480)],
  ['tiles/tile_light.png', drawSoftTile(CELL_SIZE, TILE_LIGHT, false)],
  ['tiles/tile_dark.png', drawSoftTile(CELL_SIZE, TILE_DARK, true)],
  ['buildings/sell_shop.png', drawSellShop(CELL_SIZE, CELL_SIZE)],
  ['cats/cat_normal.png', drawRoundCat(CELL_SIZE, CELL_SIZE, [255, 255, 255])],
  ['cats/cat_mutated.png', drawRoundCat(CELL_SIZE, CELL_SIZE, [255, 140, 130], [230, 90, 90])],
  ['player/player.png', drawPlayer(CELL_SIZE, CELL_SIZE)],
  ['ui/pickup.png', drawPickup(UI_SIZE, UI_SIZE)],
  ['ui/gold_chick.png', drawGoldChick(UI_SIZE, UI_SIZE)],
];

for (let lv = 1; lv <= 5; lv++) {
  assets.push([
    `buildings/cat_${lv}.png`,
    drawFullCellCatNest(CELL_SIZE, CELL_SIZE, lv),
  ]);
  assets.push([
    `buildings/conveyor_${lv}.png`,
    drawFullCellConveyor(CELL_SIZE, CELL_SIZE, conveyorColor(lv)),
  ]);
  assets.push([
    `buildings/box_${lv}.png`,
    drawFullCellPackingBox(CELL_SIZE, CELL_SIZE, lv),
  ]);
}

for (let lv = 1; lv <= 4; lv++) {
  assets.push([
    `buildings/door_${lv}.png`,
    drawMutationGateOverlay(CELL_SIZE, CELL_SIZE, lv),
  ]);
}

const TILE_ASSET_PATHS = new Set(['tiles/tile_light.png', 'tiles/tile_dark.png']);

async function main() {
  const tilesOnly = process.argv.includes('--tiles-only');
  const toWrite = tilesOnly
    ? assets.filter(([rel]) => TILE_ASSET_PATHS.has(rel))
    : assets;

  for (const [rel, canvas] of toWrite) {
    const outPath = join(OUT, rel);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, canvas.toPng());
    console.log('wrote', rel);
  }
  console.log(
    tilesOnly
      ? 'Done — ground tiles only in public/assets/tiles/'
      : 'Done — kawaii placeholder assets in public/assets/',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
