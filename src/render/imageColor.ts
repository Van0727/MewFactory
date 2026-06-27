const dominantColorCache = new Map<string, string>();

/** 取图片不透明像素中出现最多的颜色（4bit 量化），结果按 src 缓存 */
export function getImageDominantColor(img: HTMLImageElement): string {
  const cacheKey = img.src;
  const cached = dominantColorCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  if (width <= 0 || height <= 0) {
    return '#888888';
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return '#888888';
  }

  ctx.drawImage(img, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);
  const buckets = new Map<number, number>();

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) {
      continue;
    }
    const r = data[i] >> 4;
    const g = data[i + 1] >> 4;
    const b = data[i + 2] >> 4;
    const bucket = (r << 8) | (g << 4) | b;
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }

  let bestBucket = -1;
  let bestCount = 0;
  for (const [bucket, count] of buckets) {
    if (count > bestCount) {
      bestCount = count;
      bestBucket = bucket;
    }
  }

  if (bestBucket < 0) {
    return '#888888';
  }

  const r = ((bestBucket >> 8) & 0xf) * 17;
  const g = ((bestBucket >> 4) & 0xf) * 17;
  const b = (bestBucket & 0xf) * 17;
  const color = `rgb(${r}, ${g}, ${b})`;
  dominantColorCache.set(cacheKey, color);
  return color;
}
