# MewFactory 美术资源规格

## 风格参考

- **整体**：Q 版 3D 玩具 / 软胶 / 粘土质感，粉紫 pastel 配色，圆角无硬边
- **光照**：柔光、浅阴影，避免过暗或过饱和
- **猫窝**：整格纯色底，按名称设计造型，无阴影、无黑色；Lv.1 土豆猫 / Lv.2 腊肠猫 / Lv.3 肌肉猫 / Lv.4 长腿猫 / Lv.5 无头猫
- **传送带**：整格纯色底板 + 白色方向箭头（默认朝左），无阴影、无黑边；高等级可用橙/彩虹色
- **变异门**：透明底 PNG，单根竖条占满整图高度（橙/绿/蓝/紫）；放置时方向与传送带相同，竖条与传送带垂直
- **包装箱**：整格纯色底，按名称设计造型，无阴影、无黑色；Lv.1 纸箱 / Lv.2 顺丰包装箱 / Lv.3 浴缸 / Lv.4 圣诞袜 / Lv.5 异次元口袋
- **流动小猫**：圆滚滚白猫；变异版偏红
- **玩家**：黄头蓝身圆角胶囊，脚底中心对齐格子
- **出售门**：金色拱门 +「出售」牌匾（或由程序叠字）

## 技术规格

| 类别 | 尺寸 | 格式 | 朝向 |
|------|------|------|------|
| 棋盘建筑 / 玩家 / 小猫 / 地块 | 256×256 | PNG，RGB 不透明 | 建筑默认**朝左**；猫窝/传送带/门可旋转 |
| UI 小图标 | 64×64 | PNG，透明底可选 | — |
| 背景 | 1920×1080 或无缝平铺 | PNG/JPG | — |

### 锚点与边距

- **玩家**：脚底中心在 `(50%, 81%)`，占格宽约 72%
- **建筑**：居中，留 5~10% 边距，避免旋转裁切
- **地块**：铺满 256×256，避免等距变换后出现缝隙

### 代码中的朝向

建筑 PNG 默认朝向**左**（`Direction.Left = 0°`）。猫窝、传送带、变异门会随游戏内方向旋转；包装箱不旋转。

## 文件清单

命名必须与 [src/data/buildings.ts](../src/data/buildings.ts) 中 `spriteId` **完全一致**。

```
public/assets/
  background/scene.png                 # 棋盘外装饰场景（云朵、猫窝飞船、宝箱等）
  background/sky.png                 # 可选，页面背景
  ui/gold_chick.png                  # 金币条图标
  ui/pickup.png                      # 快捷栏拾取槽
  tiles/tile_light.png
  tiles/tile_dark.png
  buildings/cat_1.png ... cat_5.png
  buildings/conveyor_1.png ... conveyor_5.png
  buildings/box_1.png ... box_5.png
  buildings/door_1.png ... door_4.png
  buildings/sell_shop.png
  cats/cat_normal.png
  cats/cat_mutated.png
  player/player.png
```

### spriteId 对照

| spriteId | 建筑 |
|----------|------|
| cat_1 ~ cat_5 | 猫窝 Lv.1~5 |
| conveyor_1 ~ conveyor_5 | 传送带 Lv.1~5 |
| box_1 ~ box_5 | 包装箱 Lv.1~5 |
| door_1 ~ door_4 | 变异门 Lv.1~4 |

## 3D 导出建议

1. Blender/C4D 正交或轻微俯视渲染
2. 相机让建筑**朝向画面左侧**
3. 导出 256×256 PNG，sRGB
4. 交付后放入 `public/assets/`，刷新游戏即可（无需改代码）

## 注意事项

- **不要**在已有正式素材后运行 `npm run gen:assets`（会覆盖占位图）
- 新增等级：在 `buildings.ts` 增加配置 + 放入对应 PNG
- 快捷栏与商店 UI 复用棋盘 PNG（CSS 缩放），无需单独 UI 建筑图
