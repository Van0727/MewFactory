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
export const COLOR_GROUND_BASE = '#cccccc';
/** 远处行宽相对近处的比例，越小纵深感越强 */
export const PERSPECTIVE_MIN_SCALE = 0.7;
export const PLAYER_SPEED = 4;
/** 玩家精灵在 PNG 内的锚点（底部中心，与 genPlaceholders drawPlayer 一致） */
export const PLAYER_SPRITE_ANCHOR_X = 0.5;
export const PLAYER_SPRITE_ANCHOR_Y = 0.81;
/** 相对格子宽度的绘制缩放，胶囊不占满整格 */
export const PLAYER_SPRITE_TILE_SCALE = 0.72;
export const COLOR_LIGHT = '#e8e8e8';
export const COLOR_DARK = '#b0b0b0';
export const COLOR_LIGHT_FRONT = '#9a9a9a';
export const COLOR_DARK_FRONT = '#707070';
export const COLOR_PLAYER = '#4a90d9';
export const COLOR_BACKGROUND = '#1a1a2e';

export const COLOR_BUILDING_CAT_NEST = '#d4a574';
export const COLOR_BUILDING_CONVEYOR = '#6b8cae';
export const COLOR_BUILDING_PACKING_BOX = '#8b7355';
export const COLOR_BUILDING_MUTATION_GATE = '#9b59b6';
export const COLOR_BUILDING_PREVIEW = 'rgba(255, 255, 255, 0.45)';
export const COLOR_TILE_PLACE_VALID = 'rgba(72, 180, 72, 0.5)';
export const COLOR_TILE_PLACE_INVALID = 'rgba(230, 130, 50, 0.5)';

export const CAT_NEST_SPAWN_INTERVAL = 5;
export const CONVEYOR_SPEED = 1;
export const PACKING_BOX_CAPACITY = 10;
export const PACK_BOX_PULSE_DURATION = 0.25;
export const CAT_ARRIVE_EPSILON = 0.04;
export const CAT_BASE_QUALITY = 1;
export const CAT_BASE_PRICE = 10;
/** 变异门默认价格倍率 */
export const MUTATION_GATE_DEFAULT_MULTIPLIER = 1.5;
/** 小猫经过变异门时的缩放脉冲时长（秒） */
export const CAT_MUTATION_PULSE_DURATION = 0.35;
/** 小猫经过变异门时的缩放峰值 */
export const CAT_MUTATION_PULSE_PEAK_SCALE = 1.2;

export const COLOR_CAT = '#ffffff';
export const COLOR_CAT_MUTATED = '#e74c3c';
