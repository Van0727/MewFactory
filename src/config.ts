export const GRID_SIZE = 10;
export const BOARD_PADDING = 20;
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 36;
export const TILE_THICKNESS = 10;
/** Square grid cell — source PNG is 1:1; drawn with iso perspective at runtime. */
export const SPRITE_CELL_SIZE = TILE_WIDTH;
export const SPRITE_CELL_WIDTH = SPRITE_CELL_SIZE;
export const SPRITE_CELL_HEIGHT = SPRITE_CELL_SIZE;
/** Export art at 4× for smoother downscaling; opaque RGB PNG, all pixels filled. */
export const SPRITE_SOURCE_SCALE = 4;
export const SPRITE_SOURCE_SIZE = SPRITE_CELL_SIZE * SPRITE_SOURCE_SCALE;
export const SPRITE_SOURCE_WIDTH = SPRITE_SOURCE_SIZE;
export const SPRITE_SOURCE_HEIGHT = SPRITE_SOURCE_SIZE;
export const UI_ICON_SOURCE_SIZE = 32 * 2;
/** Overdraw for buildings / entities (CSS px). */
export const TILE_BLEED_PX = 1.25;
/** Outward overlap for ground tiles so neighbors cover each other's edges (CSS px). */
export const TILE_GROUND_BLEED_PX = 1.5;
/** Neutral fill drawn under every tile so any sub-pixel gap shows this, not the background. */
export const COLOR_GROUND_BASE = '#e8e8e8';
/** 远处行宽相对近处的比例，越小纵深感越强 */
export const PERSPECTIVE_MIN_SCALE = 0.7;
export const PLAYER_SPEED = 4;
/** 玩家精灵在 PNG 内的锚点（底部中心，与 genPlaceholders drawPlayer 一致） */
export const PLAYER_SPRITE_ANCHOR_X = 0.5;
export const PLAYER_SPRITE_ANCHOR_Y = 0.81;
/** 相对格子宽度的绘制缩放，胶囊不占满整格 */
export const PLAYER_SPRITE_TILE_SCALE = 0.72;
/** 小猫 role 相对玩家基准尺寸的放大倍数 */
export const ROLE_SPRITE_SIZE_MULTIPLIER = 1.25;
export const CAT_ROLE_SPRITE_TILE_SCALE =
  PLAYER_SPRITE_TILE_SCALE * ROLE_SPRITE_SIZE_MULTIPLIER;
export const COLOR_LIGHT = '#f5f5f5';
export const COLOR_DARK = '#d8d8d8';
export const COLOR_LIGHT_FRONT = '#c4c4c4';
export const COLOR_DARK_FRONT = '#a8a8a8';
export const COLOR_PLAYER = '#4a90d9';
export const COLOR_BACKGROUND = '#d4b8f0';

export const COLOR_BUILDING_CAT_NEST = '#d4a574';
export const COLOR_BUILDING_CONVEYOR = '#6b8cae';
export const COLOR_BUILDING_PACKING_BOX = '#8b7355';
export const COLOR_BUILDING_MUTATION_GATE = '#9b59b6';
export const COLOR_BUILDING_PREVIEW = 'rgba(255, 255, 255, 0.45)';
export const COLOR_TILE_PLACE_VALID = 'rgba(72, 180, 72, 0.5)';
export const COLOR_TILE_PLACE_INVALID = 'rgba(230, 130, 50, 0.5)';
/** 新手引导高亮：绿色 RGB，透明度由 Renderer 闪烁动画控制 */
export const COLOR_TILE_TUTORIAL_RGB = '72, 180, 72';

/** 商店 UI（购买面板、地图名牌）整体缩放 */
export const SHOP_UI_SCALE = 1.5;

export const PACK_BOX_PULSE_DURATION = 0.25;
/** 猫窝相对地面抬升高度（CSS px），侧面用贴图主色填充 */
export const BUILDING_GROUND_LIFT_PX = 20;
/** 包装箱抬升高度（为猫窝的一半） */
export const PACKING_BOX_GROUND_LIFT_PX = BUILDING_GROUND_LIFT_PX / 2;
/** 手持建筑相对格内尺寸的绘制缩放 */
export const HELD_BUILDING_DRAW_SCALE = 0.75;
export const CAT_ARRIVE_EPSILON = 0.04;
/** 小猫经过变异门时的缩放脉冲时长（秒） */
export const CAT_MUTATION_PULSE_DURATION = 0.35;
/** 小猫经过变异门时的缩放峰值 */
export const CAT_MUTATION_PULSE_PEAK_SCALE = 1.2;
/** 精舞门基础翻转速度（弧度/秒），层数越高再 ×(1 + 0.5×stacks) */
export const CAT_DANCE_BASE_SPIN_SPEED = Math.PI * 2;

/** 出售金币飞出动画：弹出阶段时长（秒） */
export const GOLD_SELL_POP_DURATION = 0.45;
/** 出售金币飞出动画：飞向顶部 UI 时长（秒） */
export const GOLD_SELL_FLY_DURATION = 0.55;
/** 出售金币飞出：每只小猫对应金币粒子数 */
export const GOLD_SELL_COIN_PER_CAT = 4;
/** 出售金币飞出：最少 / 最多粒子数 */
export const GOLD_SELL_COIN_MIN = 8;
export const GOLD_SELL_COIN_MAX = 96;

export function getGoldSellCoinCount(catCount: number): number {
  if (catCount <= 0) {
    return 0;
  }
  return Math.min(
    GOLD_SELL_COIN_MAX,
    Math.max(GOLD_SELL_COIN_MIN, catCount * GOLD_SELL_COIN_PER_CAT),
  );
}

/** 建筑购买价：Lv1 基准与每级倍率（指数曲线） */
export const BUILDING_PRICE_BASE = 100;
export const BUILDING_PRICE_RATIO = 3;
/** 小猫基础售价：Lv1 基准与每级倍率（指数曲线） */
export const CAT_SELL_PRICE_BASE = 10;
export const CAT_SELL_PRICE_RATIO = 3;

export function tierExponentialPrice(base: number, ratio: number, level: number): number {
  const tier = Math.max(1, Math.floor(level));
  return Math.round(base * Math.pow(ratio, tier - 1));
}

/** 大于此值时使用 M/B/T 紧凑显示 */
export const COMPACT_NUMBER_THRESHOLD = 1_000_000;

const COMPACT_SUFFIXES = [
  { divisor: 1e12, suffix: 'T' },
  { divisor: 1e9, suffix: 'B' },
  { divisor: 1e6, suffix: 'M' },
] as const;

/** 大于 100 万时以 M/B/T 后缀显示，有效数字固定 3 位（如 978M、9.78M、1.50M） */
export function formatCompactNumber(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs <= COMPACT_NUMBER_THRESHOLD) {
    return sign + String(Math.round(value));
  }

  for (const { divisor, suffix } of COMPACT_SUFFIXES) {
    if (abs >= divisor) {
      const scaled = abs / divisor;
      const text = formatThreeDigitMantissa(scaled);
      return sign + text + suffix;
    }
  }

  return sign + String(Math.round(value));
}

/** 将 1~999.9… 的尾数格式化为 3 位有效数字，避免 toPrecision 产生指数形式 */
function formatThreeDigitMantissa(scaled: number): string {
  const exp = Math.floor(Math.log10(scaled));
  const factor = Math.pow(10, 2 - exp);
  const mantissa = Math.round(scaled * factor) / factor;

  if (exp >= 2) {
    return String(Math.round(mantissa));
  }
  if (exp === 1) {
    return mantissa.toFixed(1);
  }
  return mantissa.toFixed(2);
}

/** 重生：初始金币产出倍率 */
export const REBIRTH_INITIAL_GOLD_MULTIPLIER = 1;
/** 每次重生增加的金币产出倍率 */
export const REBIRTH_GOLD_MULTIPLIER_STEP = 0.5;
/** 重生第 1 次基础价格；实际为 base × ratio^已重生次数 */
export const REBIRTH_BASE_COST = 100;
export const REBIRTH_COST_RATIO = 3;
/** 重生成功提示显示时长（秒） */
export const REBIRTH_TOAST_DURATION = 1;

/** 自动出售：每轮间隔（秒） */
export const AUTO_SELL_INTERVAL = 10;

/** 引导结束后首单延迟（秒） */
export const ORDER_TUTORIAL_DELAY_SECONDS = 5;
/** 订单完成后下一单延迟（秒） */
export const ORDER_NEXT_DELAY_SECONDS = 10;
export const ORDER_INITIAL_QTY = 10;
/** 重生后订单数量 = 重生次数 × 此值 */
export const ORDER_QTY_PER_REBIRTH_LEVEL = 10;
export const ORDER_BASE_PASSES = 3;
export const ORDER_PASSES_PER_REBIRTH = 2;
export const ORDER_RUBY_PER_CAT = 2;
export const ORDER_RUBY_PER_REBIRTH = 1;

export const COLOR_CAT = '#ffffff';
export const COLOR_CAT_MUTATED = '#e74c3c';
