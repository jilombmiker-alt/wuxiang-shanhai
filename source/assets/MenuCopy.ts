import { HEROES, WEAPONS, Difficulty, STAGES } from "./shared-core.js";

export const difficultyIds = ["easy", "normal", "hard", "nightmare"];
// Presentation only: never round a positive cooldown down to an apparently
// usable zero. Readiness still comes from the ability, not this label.
export function skillCooldownText(remaining: number, ready: boolean) {
  if (!Number.isFinite(remaining)) return "冷却中";
  if (remaining > 0)
    return `${(Math.ceil(remaining * 10) / 10).toFixed(1)} 秒`;
  return ready ? "就绪" : "冷却中";
}
// Presentation only: a living fraction must not look dead, and current/max
// values use the same rounding. Never assign these rounded values to combat.
export function healthText(hp: number, maxHp: number) {
  const display = (value: number) => {
    if (!Number.isFinite(value)) return "—";
    if (value <= 0) return "0";
    // Discard only roundoff-sized tails near an integer (e.g. 100 * 1.12).
    // Cap the tolerance so large values still retain genuine fractions.
    const integer = Math.round(value);
    const tolerance = Math.min(1e-9, Number.EPSILON * Math.max(1, value) * 4);
    const stable = Math.abs(value - integer) <= tolerance ? integer : value;
    return String(Math.max(1, Math.ceil(stable)));
  };
  return `${display(hp)} / ${display(maxHp)}`;
}
/** One owned item per line; detailed lore and numbers remain in the codex. */
export function pauseLoadout(player: any, relicNames: string[] = []) {
  const weapons = player.weapons.map((w: any) => `${w.name} Lv.${w.level}`);
  const passives = Object.values(player.passives).map((v: any) => `${v.def.name} ×${v.count}`);
  const section = (name: string, items: string[], cap: number) =>
    `${name} ${items.length} / ${cap}\n${items.length ? items.join("\n") : "尚未获得"}`;
  return [section("武器", weapons, 6), section("功法", passives, 6), section("遗物", relicNames, 3)].join("\n\n");
}
export function difficultyLabel(id: string) {
  return (
    { easy: "轻松", normal: "普通", hard: "困难", nightmare: "梦魇" }[id] ||
    "普通"
  );
}
export function journeyInfo(
  mode = "chapter",
  stage = "forest",
  difficulty = "normal",
) {
  const d = Difficulty[difficulty.toUpperCase()] || Difficulty.NORMAL;
  const map = Object.values(STAGES).find((s: any) => s.id === stage) as any;
  const environment =
    {
      forest: "纸人驿道与黑水竹海，敌群分布均衡，适合熟悉构筑。",
      crypt: "邪教城中远程敌人更常见，注意弹道并利用建筑遮挡。",
      tundra:
        "星蚀环境：移速降低 10%，敌人生命增加 20%。周期侵蚀可借恢复建筑的避星灯暂缓。",
    }[stage] || "";
  return {
    title: "地图与难度",
    text: `${map?.name || "雾隐青冥山"} · ${mode === "chapter" ? "章节道途" : "无尽大荒"}\n${environment}\n\n${mode === "chapter" ? "完成房间目标后开放出口，沿分支前往守关 Boss。换房不跳战斗时间，难度随时间和路线逐步增长。" : "地图无限延伸，强度随时间增长。20、30、45 分钟迎来时间 Boss，结算后可继续挑战。"}\n\n${difficultyLabel(d.id)}：敌人生命 ×${d.hpMult}，伤害 ×${d.dmgMult}，刷怪频率 ×${d.spawnMult}；地图修正另行叠加。难度不额外增加结算奖励。\n\n难度随命契保存，仅新局可选；旧版命契默认普通。`,
  };
}

export function heroKit(id: string) {
  const hero = HEROES[id] || HEROES.sword;
  const weapon = Object.values(WEAPONS).find(
    (w: any) => w.id === hero.startingWeapon,
  ) as any;
  return [
    { icon: `weapon-${weapon.id}`, text: `初始武器 · ${weapon.name}` },
    { icon: `skill-${hero.skillIcon}`, text: `主动 · ${hero.skillName}` },
    {
      icon: `fusion-${hero.skillIcon}_ultimate`,
      text: `终极 · ${hero.ultimateName}`,
    },
  ];
}

export function guidePages(
  keys: Record<string, string>,
  mode = "chapter",
  stage = "forest",
  difficulty = "normal",
) {
  return [
    {
      title: "移动与出手",
      text: `自动武器会自行攻击。先移动避开怪群，拾取经验，升级时选择新的武器或功法。\n\n键盘：方向键或 ${keys.up}${keys.left}${keys.down}${keys.right} 移动；${keys.skill} 主动，${keys.ultimate} 终极。主动看冷却，终极需要积满能量。\n\n触屏：左侧摇杆轻推慢走，右侧技能可用另一指释放。手柄：左摇杆移动，西键主动、北键终极。`,
    },
    {
      title: "找路与交互",
      text: `靠近商店、宝箱或通道，出现名称后按 ${keys.interact} 或点击交互按钮；不会走近就自动购买。手柄用南键。\n\n选奖励和购物时战斗暂停。关掉交互后回到战斗；铜钱用于本局商店，商品有限购且会涨价。\n\n${keys.map} 打开路线图，Esc 返回。章节房完成目标才开放出口，已清房可以返回；无尽大荒追踪关键地点的方位、距离和剩余时间。`,
    },
    {
      title: "构筑与命契",
      text: "最多 6 武器、6 功法、3 遗物；主动和终极属于英雄。公共武器和功法人人可选，专属天赋与融合体现角色差异。\n\nEsc 暂停 → 行囊：查看背景、功效和攻击方式。按住 Shift 或点详值看具体数值；命府图鉴可以查融合条件。\n\n暂停 → 保存并退出，再选同一命契继续。三档局内进度独立，命府成长与图鉴共享。重新开始会覆盖该档，请先确认；命契管理可导出本地备份。",
    },
    journeyInfo(mode, stage, difficulty),
  ];
}
