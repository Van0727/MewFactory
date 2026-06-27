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

/** 商店 UI（购买面板、地图名牌）整体缩放 */
export const SHOP_UI_SCALE = 1.5;

export const PACK_BOX_PULSE_DURATION = 0.25;
/** 猫窝/包装箱相对地面抬升高度（CSS px），侧面用贴图主色填充 */
export const BUILDING_GROUND_LIFT_PX = 20;
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

/** 重生：初始金币产出倍率 */
export const REBIRTH_INITIAL_GOLD_MULTIPLIER = 1;
/** 每次重生增加的金币产出倍率 */
export const REBIRTH_GOLD_MULTIPLIER_STEP = 0.5;
/** 重生基础价格（实际价格 × 已重生次数+1） */
export const REBIRTH_BASE_COST = 100;
/** 重生成功提示显示时长（秒） */
export const REBIRTH_TOAST_DURATION = 1;

export const COLOR_CAT = '#ffffff';
export const COLOR_CAT_MUTATED = '#e74c3c';
