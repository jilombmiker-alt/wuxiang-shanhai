// prototype-2d-pixel/src/config.js
var CONFIG = {
  CANVAS_WIDTH: 1200,
  // viewport width (camera projection size)
  CANVAS_HEIGHT: 800,
  // viewport height
  // A chapter room is bounded but equals a 3x3 set of viewports. The camera
  // follows the hero and clamps at the outer wall.
  ARENA_WIDTH: 3600,
  ARENA_HEIGHT: 2400,
  PLAYER_SPEED: 240,
  // px / second (was 4 px/frame => 240 @ 60fps)
  PLAYER_SIZE: 20,
  MAX_ENEMIES: 300,
  SPAWN_RADIUS: 900,
  DESPAWN_RADIUS: 1200,
  EXP_ORB_LIFETIME: 30,
  // seconds
  INVINCIBILITY_TIME: 0.5,
  // seconds
  PICKUP_DISTANCE: 24,
  MAGNET_BASE: 120,
  MAX_WEAPONS: 6,
  MAX_PASSIVES: 6,
  MAX_RELICS: 3,
  WEAPON_MAX_LEVEL: 5,
  WEAPON_EVOLVE_LEVEL: 5,
  PASSIVE_MAX_STACK: 5,
  TARGET_FPS: 60,
  GRID_SIZE: 50,
  // background grid overlay step
  SPATIAL_CELL_SIZE: 64,
  // spatial-hash cell size for broad-phase collision
  DT_CLAMP: 0.05,
  // max dt per frame (s); guards against tab-resume explosions
  WAVE_DURATION: 30,
  // seconds per wave announcement
  HIGHSCORE_SLOTS: 10,
  // --- v2.4: speedrun + launch tuning ---------------------------------
  SPEEDRUN_SEED: 1398231630,
  // 'SPRN' — deterministic per run
  SPEEDRUN_SPLITS: [60, 180, 300, 450, 600, 720],
  // secs: 1,3,5,7.5,10,12 min
  SPEEDRUN_MAX_SLOTS: 10,
  LEADERBOARD_PAGE_SIZE: 20,
  // how many rows the scroll UI renders at a time
  EARLY_EVOLVE_THRESHOLD: 420,
  // seconds — used by Early Evolve achievement
  NOVA_SLOW_DEFAULT: 0.5,
  // fallback slow % when def omits slowPct
  BOMBER_DEFAULT_RADIUS: 120,
  // used if data.js omits blastRadius
  // --- v2.5: polish + reflection -------------------------------------
  SEEN_BUILDS_CAP: 1e3,
  // hard upper bound on unique builds tracked in totals
  VERSION: "1.15.5-shared-world"
};
var GameState = Object.freeze({
  MENU: "menu",
  PLAYING: "playing",
  PAUSED: "paused",
  LEVEL_UP: "levelup",
  BUILD_CHOICE: "build-choice",
  INTERACTION: "interaction",
  MILESTONE: "milestone",
  MAP: "map",
  GAMEOVER: "gameover",
  SETTINGS: "settings"
});
var Difficulty = Object.freeze({
  EASY: { id: "easy", label: "Easy", hpMult: 0.75, dmgMult: 0.75, spawnMult: 0.8 },
  NORMAL: { id: "normal", label: "Normal", hpMult: 1, dmgMult: 1, spawnMult: 1 },
  HARD: { id: "hard", label: "Hard", hpMult: 1.3, dmgMult: 1.25, spawnMult: 1.25 },
  NIGHTMARE: { id: "nightmare", label: "Nightmare", hpMult: 1.75, dmgMult: 1.5, spawnMult: 1.6 }
});

// prototype-2d-pixel/src/enemy-atlas.js
var RITUAL_SPRITES = Object.freeze({
  reaper: [0, 0],
  necromancer: [1, 0],
  ice_queen: [2, 0],
  void_lord: [3, 0],
  chrono_lich: [0, 1],
  bramble_seer: [1, 1],
  thread_chanter: [2, 1],
  frost_eye: [3, 1]
});
if (false) {
  const image = new (void 0)();
  image.onload = () => {
    const canvas = (void 0).createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    clearExteriorMatte(pixels.data, canvas.width, canvas.height);
    ctx.putImageData(pixels, 0, 0);
    ritualAtlas = canvas;
    for (const callback of readyCallbacks) callback();
    if (cleanedAtlas) readyCallbacks.clear();
  };
  image.src = "./assets/enemies/ritual-enemy-atlas-v1.png";
}
if (false) {
  const image = new (void 0)();
  image.onload = () => {
    const clean = (void 0).createElement("canvas");
    clean.width = image.naturalWidth;
    clean.height = image.naturalHeight;
    const ctx = clean.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, clean.width, clean.height);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const r = pixels.data[i];
      const g = pixels.data[i + 1];
      const b = pixels.data[i + 2];
      if (r >= 224 && Math.max(r, g, b) - Math.min(r, g, b) <= 8) {
        pixels.data[i + 3] = 0;
      }
    }
    ctx.putImageData(pixels, 0, 0);
    cleanedAtlas = clean;
    for (const callback of readyCallbacks) callback(cleanedAtlas);
    if (ritualAtlas) readyCallbacks.clear();
  };
  image.src = "./assets/enemies/theme-enemy-atlas-v1.png";
}

// prototype-2d-pixel/src/hero-animation.js
var HERO_ACTION_DURATION = 0.48;
var HERO_AUTO_ACTION_INTERVAL = 1.5;
var reducedMotionQuery = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
function heroPrefersReducedMotion() {
  return reducedMotionQuery?.matches || false;
}
var atlas = null;
var frames = null;
var actionAtlas = null;
var actionFrames = null;
function startHeroAction(player, facing = 1, reducedMotion = false) {
  if (reducedMotion || heroPrefersReducedMotion() || player.heroAction && player.heroAction.source !== "weapon")
    return false;
  player.heroAction = { elapsed: 0, frame: 0, facing: facing < 0 ? -1 : 1, source: "skill" };
  player.autoActionQuiet = HERO_AUTO_ACTION_INTERVAL;
  return true;
}
function startHeroWeaponAction(player, weaponId, facing = 1, reducedMotion = false) {
  if (player.dead || reducedMotion || heroPrefersReducedMotion() || player.heroAction || (player.autoActionQuiet || 0) > 0)
    return false;
  player.heroAction = {
    elapsed: 0,
    frame: 0,
    facing: facing < 0 ? -1 : 1,
    source: "weapon",
    weaponId
  };
  player.autoActionQuiet = HERO_AUTO_ACTION_INTERVAL;
  return true;
}
function updateHeroAnimation(player, dt, reducedMotion = false) {
  if (Number.isFinite(dt) && dt > 0)
    player.autoActionQuiet = Math.max(0, (player.autoActionQuiet || 0) - Math.min(dt, 0.05));
  if (reducedMotion) player.heroAction = null;
  else if (player.heroAction && Number.isFinite(dt) && dt > 0) {
    const action = player.heroAction;
    action.elapsed += Math.min(dt, 0.05);
    action.frame = Math.min(3, Math.floor(action.elapsed / (HERO_ACTION_DURATION / 4)));
    if (action.elapsed >= HERO_ACTION_DURATION) player.heroAction = null;
  }
  const dx = player.x - (player.prevX ?? player.x), dy = player.y - (player.prevY ?? player.y);
  const distance = Math.hypot(dx, dy);
  if (Math.abs(dx) > 0.05) player.walkFacing = dx < 0 ? -1 : 1;
  player.walkFacing || (player.walkFacing = 1);
  if (reducedMotion || !Number.isFinite(distance) || distance < 0.01 || !(dt > 0)) {
    player.walkPhase = 0;
    player.walkFrame = 1;
    return;
  }
  player.walkPhase = ((player.walkPhase || 0) + Math.min(distance / 36, Math.min(dt, 0.05) * 7)) % 4;
  player.walkFrame = Math.floor(player.walkPhase);
}
function heroFramePlacement(frame, x, y) {
  const width = frame.width * frame.scale, height = frame.height * frame.scale;
  return {
    x: Math.round(x - (frame.anchorX ?? frame.width / 2) * frame.scale),
    y: Math.round(y + 28 - height),
    width,
    height
  };
}
function drawAnimatedHero(ctx, player) {
  if (!atlas || !frames) return false;
  const row = Math.max(0, Math.min(3, player.heroSpriteIndex || 0));
  const action = player.heroAction && actionAtlas && actionFrames ? player.heroAction : null;
  const frame = action ? actionFrames[row][action.frame] : frames[row][player.walkFrame ?? 1], box = heroFramePlacement(frame, 0, 0);
  ctx.save();
  ctx.translate(Math.round(player.x), Math.round(player.y));
  ctx.scale(action?.facing || player.walkFacing || 1, 1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    action ? actionAtlas : atlas,
    frame.x,
    frame.y,
    frame.width,
    frame.height,
    box.x,
    box.y,
    box.width,
    box.height
  );
  ctx.restore();
  return true;
}
if (false) {
  const image = new (void 0)();
  image.onload = () => {
    try {
      const canvas = (void 0).createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      clearExteriorMatte(pixels.data, canvas.width, canvas.height);
      frames = locateHeroFrames(pixels.data, canvas.width, canvas.height);
      ctx.putImageData(pixels, 0, 0);
      atlas = canvas;
    } catch (error) {
      loadError = error.message;
    }
  };
  image.onerror = () => {
    loadError = "Walk atlas unavailable; original sprites remain active";
  };
  image.src = HERO_WALK_ASSET;
  const actionImage = new (void 0)();
  actionImage.onload = () => {
    try {
      const canvas = (void 0).createElement("canvas");
      canvas.width = actionImage.naturalWidth;
      canvas.height = actionImage.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(actionImage, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      clearExteriorMatte(pixels.data, canvas.width, canvas.height);
      actionFrames = locateHeroFrames(pixels.data, canvas.width, canvas.height, true);
      ctx.putImageData(pixels, 0, 0);
      actionAtlas = canvas;
    } catch (error) {
      actionError = error.message;
    }
  };
  actionImage.onerror = () => {
    actionError = "Action atlas unavailable; walking sprites remain active";
  };
  actionImage.src = HERO_ACTION_ASSET;
}

// prototype-2d-pixel/src/fusion-mechanics.js
function hasFusion(weapon, id) {
  return weapon?.fusion?.id === id || !!weapon?.fusion?.ids?.includes(id);
}
function conductHit(origin, damage, game) {
  const targets = [...game.spatial?.queryRect?.(origin.x, origin.y, 140) || game.enemies].filter(
    (enemy) => enemy !== origin && enemy.hp > 0 && Math.hypot(enemy.x - origin.x, enemy.y - origin.y) <= 140
  ).sort(
    (a, b) => Math.hypot(a.x - origin.x, a.y - origin.y) - Math.hypot(b.x - origin.x, b.y - origin.y)
  ).slice(0, 2);
  for (const enemy of targets) {
    enemy.takeDamage(damage * 0.3);
    game.reactions?.applyHit?.(enemy, "thunder", damage * 0.3);
  }
  if (targets.length)
    game.combatVisuals?.lightning?.(
      [origin, ...targets].map((enemy) => ({ x: enemy.x, y: enemy.y })),
      { fused: true }
    );
  return targets.length;
}
function mergeFusion(previous, recipe, output) {
  const ids = Array.from(
    /* @__PURE__ */ new Set([...previous?.ids || (previous?.id ? [previous.id] : []), recipe.id])
  );
  const names = Array.from(
    /* @__PURE__ */ new Set([...previous?.names || (previous?.name ? [previous.name] : []), recipe.name])
  );
  return {
    id: recipe.id,
    ids,
    names,
    name: names.join(" / "),
    damageMult: Math.max(previous?.damageMult || 1, 1.6, output.damageMult || 1),
    cooldownMult: Math.min(previous?.cooldownMult || 1, 0.78, output.cooldownMult || 1),
    rangeMult: Math.max(previous?.rangeMult || 1, 1.3, output.rangeMult || 1),
    projectileBonus: Math.max(
      previous?.projectileBonus || 0,
      (output.projectileBonus || 0) + 1
    ),
    visualTier: "mythic"
  };
}
var FusionFields = class {
  constructor() {
    this.fields = [];
    this.serial = 0;
  }
  add(x, y, radius, damage, element, duration = 2) {
    if (![x, y, radius, damage, duration].every(Number.isFinite)) return;
    this.fields.push({
      id: ++this.serial,
      x,
      y,
      radius,
      damage,
      element,
      remaining: duration,
      tick: 0.5
    });
    if (this.fields.length > 8) this.fields.shift();
  }
  update(dt, game, weaponId) {
    for (const field of this.fields) {
      const activeDt = Math.min(Math.max(dt, 0), field.remaining);
      field.remaining -= activeDt;
      field.tick -= activeDt;
      while (field.tick <= 1e-8) {
        field.tick += 0.5;
        const enemies = game.spatial?.queryRect?.(field.x, field.y, field.radius + 80) || game.enemies;
        for (const enemy of enemies) {
          if (enemy.hp <= 0 || Math.hypot(enemy.x - field.x, enemy.y - field.y) > field.radius + (enemy.hitRadius ?? enemy.size ?? 12))
            continue;
          enemy.takeDamage(field.damage);
          if (field.element === "frost") {
            enemy.slowPct = Math.max(
              enemy.slowTimer > 0 ? enemy.slowPct || 0 : 0,
              enemy.boss ? 0.15 : 0.5
            );
            enemy.slowTimer = Math.max(enemy.slowTimer || 0, 0.65);
          }
          game.reactions?.applyHit?.(enemy, field.element, field.damage);
        }
      }
      if (field.remaining > 0)
        game.combatVisuals?.field?.(field.x, field.y, field.radius, field.element, {
          fused: true,
          sustained: true,
          key: `fusion:${weaponId}:${field.id}`,
          duration: Math.min(0.15, field.remaining)
        });
    }
    this.fields = this.fields.filter((field) => field.remaining > 0);
  }
  snapshot() {
    return this.fields.map((field) => ({ ...field }));
  }
  restore(fields) {
    this.fields = (Array.isArray(fields) ? fields : []).filter(
      (field) => field && ["x", "y", "radius", "damage", "remaining", "tick"].every(
        (key) => Number.isFinite(field[key])
      ) && field.remaining > 0 && field.remaining <= 3 && field.radius > 0 && field.radius <= 500 && field.damage >= 0 && field.tick >= 0 && field.tick <= 0.5 && ["blade", "thunder", "fire", "frost"].includes(field.element)
    ).slice(-8).map((field) => ({ ...field, id: ++this.serial }));
  }
};

// prototype-2d-pixel/src/data.js
var WEAPONS = {
  WHIP: {
    id: "whip",
    name: "\u9752\u950B\u5251\u6C14",
    icon: "\u2694\uFE0F",
    description: "\u81EA\u52A8\u671D\u8FD1\u5904\u90AA\u7269\u5B9A\u5411\uFF0C\u5411\u4E24\u4FA7\u65A9\u51FA\u5251\u6C14\uFF1B\u6F14\u5316\u540E\u5F62\u6210\u73AF\u8EAB\u4E00\u5468\u7684\u8840\u6708\u5251\u7F61\u3002",
    baseDamage: 20,
    baseCooldown: 1.5,
    baseRange: 90,
    projectileCount: 1,
    piercing: false,
    type: "melee",
    element: "blade",
    evolveLevel: 5,
    evolveName: "\u8840\u6708\u5468\u5929"
  },
  MAGIC_WAND: {
    id: "magic_wand",
    name: "\u8FFD\u9B42\u7B26",
    icon: "\u{1F52E}",
    description: "\u81EA\u52A8\u8FFD\u7D22\u6700\u8FD1\u90AA\u7269\uFF1B\u6F14\u5316\u540E\u4E09\u7B26\u9F50\u53D1\u3002",
    baseDamage: 15,
    baseCooldown: 1.2,
    baseRange: 320,
    projectileCount: 1,
    piercing: false,
    type: "projectile",
    element: "seal",
    speed: 420,
    homing: true,
    evolveLevel: 5,
    evolveName: "\u4E09\u6E05\u7D22\u547D\u7B26"
  },
  KNIFE: {
    id: "knife",
    name: "\u65A9\u5996\u98DE\u5251",
    icon: "\u{1F5E1}\uFE0F",
    description: "\u5411\u524D\u6295\u5C04\u8D2F\u7A7F\u98DE\u5251\uFF1B\u6F14\u5316\u540E\u5316\u4E3A\u4E94\u5251\u6247\u9762\u3002",
    baseDamage: 12,
    baseCooldown: 0.4,
    baseRange: 420,
    projectileCount: 1,
    piercing: true,
    type: "projectile",
    speed: 620,
    evolveLevel: 5,
    evolveName: "\u4E94\u72F1\u5251\u9635",
    // iter-14 evolution micro-tweak: the fan also gets a flat +10% crit
    // chance on top of the player's current critChance roll. Picked up
    // by Weapon._rollCrit when the weapon `isEvolved()`.
    evolveBonusCrit: 0.1
  },
  ORBIT: {
    id: "orbit",
    name: "\u62A4\u8EAB\u5251\u8F6E",
    icon: "\u{1F4AB}",
    description: "\u788E\u5251\u73AF\u8EAB\u65CB\u8F6C\uFF1B\u6F14\u5316\u540E\u5F62\u6210\u5185\u5916\u53CC\u8F6E\u3002",
    baseDamage: 16,
    baseCooldown: 0.4,
    // used as "tick" for damage re-hit window
    baseRange: 120,
    // orbit radius
    projectileCount: 2,
    piercing: true,
    type: "orbit",
    evolveLevel: 5,
    evolveName: "\u53CC\u4EEA\u5251\u73AF",
    // iter-14: evolved Twin Halo also boosts shard damage by +10%.
    evolveDamageMult: 1.1
  },
  LIGHTNING: {
    id: "lightning",
    name: "\u4E5D\u9704\u96F7\u7BC6",
    icon: "\u26A1",
    description: "\u8F70\u51FB\u968F\u673A\u90AA\u7269\uFF0C\u4E09\u7EA7\u540E\u8FDE\u9501\uFF1B\u6F14\u5316\u540E\u5F15\u53D1\u96F7\u66B4\u3002",
    baseDamage: 35,
    baseCooldown: 3,
    baseRange: 420,
    piercing: true,
    type: "instant",
    element: "thunder",
    chain: true,
    chainCount: 3,
    evolveLevel: 5,
    evolveName: "\u4E07\u96F7\u671D\u5B97",
    // iter-14: evolved Thunder Call rolls a +15% crit on the strikes.
    evolveBonusCrit: 0.15
  },
  MINE: {
    id: "mine",
    name: "\u9547\u90AA\u7206\u7B26",
    icon: "\u{1F4A3}",
    description: "\u7559\u4E0B\u5EF6\u65F6\u7206\u88C2\u7B26\uFF1B\u6F14\u5316\u540E\u8FDE\u7EED\u5E03\u4E0B\u53CC\u7B26\u3002",
    baseDamage: 45,
    baseCooldown: 2.2,
    baseRange: 100,
    // explosion radius
    projectileCount: 1,
    piercing: true,
    type: "mine",
    element: "fire",
    fuse: 1.2,
    evolveLevel: 5,
    evolveName: "\u8FDE\u73AF\u9547\u715E\u9635"
  },
  GARLIC: {
    id: "garlic",
    name: "\u9955\u992E\u715E\u73AF",
    icon: "\u{1F9C4}",
    description: "\u98DF\u715E\u7AE5\u5B50\u7684\u62A4\u4F53\u541E\u566C\u9886\u57DF\uFF1B\u6301\u7EED\u5543\u566C\u8FD1\u8EAB\u90AA\u7269\uFF0C\u5E76\u9002\u914D\u751F\u547D\u3001\u62A4\u7532\u6D41\u6D3E\u3002",
    baseDamage: 5,
    baseCooldown: 0.2,
    baseRange: 110,
    piercing: true,
    type: "aura",
    element: "ward",
    continuous: true
  },
  // --- v2.4 additions ---------------------------------------------------
  FROST_NOVA: {
    id: "frost_nova",
    name: "\u592A\u9634\u5BD2\u6F6E",
    icon: "\u2744\uFE0F",
    description: "\u91CA\u653E\u6269\u5F20\u5BD2\u73AF\u5E76\u51CF\u901F\uFF1B\u6F14\u5316\u540E\u89E6\u53D1\u53CC\u91CD\u5BD2\u6F6E\u3002",
    baseDamage: 28,
    baseCooldown: 3.2,
    baseRange: 200,
    // blast radius
    projectileCount: 1,
    piercing: true,
    type: "nova",
    element: "frost",
    slowPct: 0.5,
    slowDuration: 1.2,
    evolveLevel: 5,
    evolveName: "\u5E7F\u5BD2\u91CD\u52AB"
  },
  SOUL_DRAIN: {
    id: "soul_drain",
    name: "\u566C\u9B42\u8840\u7EBF",
    icon: "\u{1FA78}",
    description: "\u8FDE\u63A5\u6700\u8FD1\u90AA\u7269\u5E76\u6C72\u53D6\u751F\u547D\uFF1B\u6F14\u5316\u540E\u540C\u65F6\u7F20\u4F4F\u4E24\u4E2A\u76EE\u6807\u3002",
    baseDamage: 8,
    baseCooldown: 0.25,
    // tick rate
    baseRange: 260,
    projectileCount: 1,
    piercing: true,
    type: "drain",
    element: "blood",
    lifestealPct: 0.25,
    evolveLevel: 5,
    evolveName: "\u53CC\u751F\u566C\u9B42\u7D22"
  },
  BOOMERANG: {
    id: "boomerang",
    name: "\u56DE\u98CE\u5203",
    icon: "\u{1FA83}",
    description: "\u98DE\u51FA\u540E\u6298\u8FD4\uFF1B\u6F14\u5316\u540E\u5F62\u6210\u53CC\u5F27\u56DE\u65CB\u3002",
    baseDamage: 18,
    baseCooldown: 1.1,
    baseRange: 340,
    projectileCount: 1,
    piercing: true,
    type: "projectile",
    speed: 380,
    boomerang: true,
    evolveLevel: 5,
    evolveName: "\u9634\u9633\u56DE\u98CE\u65A9",
    // iter-14: Twin Arc fires 5% faster than its base cooldown formula.
    evolveCooldownMult: 0.95
  },
  // --- iter-20: Konami Code unlock --------------------------------------
  // Hidden weapon awarded on the first time the player enters the Konami
  // Code on the main menu. Behaves like a fast piercing projectile (a nod
  // to retro shoot-'em-ups). Not part of the regular drop pool — only
  // available as a starter once UNLOCKS.konami_code is earned.
  RETRO_BLASTER: {
    id: "retro_blaster",
    name: "\u661F\u8680\u53E4\u70AE",
    icon: "\u{1F47E}",
    description: "\u9690\u85CF\u661F\u5916\u9057\u7269\uFF0C\u5411\u524D\u8D2F\u7A7F\u8FDE\u5C04\uFF1B\u6F14\u5316\u540E\u4E09\u675F\u9F50\u53D1\u3002",
    baseDamage: 14,
    baseCooldown: 0.5,
    baseRange: 480,
    projectileCount: 2,
    piercing: true,
    type: "projectile",
    speed: 700,
    evolveLevel: 5,
    evolveName: "\u4E09\u57A3\u661F\u7206"
  }
};
var PASSIVES = {
  MAX_HP: {
    id: "max_hp",
    name: "\u70BC\u4F53",
    icon: "\u2764\uFE0F",
    description: "\u6700\u5927\u751F\u547D +20%",
    effect: { maxHpMult: 0.2 }
  },
  RECOVERY: {
    id: "recovery",
    name: "\u5410\u7EB3",
    icon: "\u{1F49A}",
    description: "\u6BCF\u79D2\u6062\u590D +0.5",
    effect: { hpRegen: 0.5 }
  },
  ARMOR: {
    id: "armor",
    name: "\u91D1\u949F",
    icon: "\u{1F6E1}\uFE0F",
    description: "\u53D7\u5230\u7684\u4F24\u5BB3 -1",
    effect: { armor: 1 }
  },
  MOVESPEED: {
    id: "movespeed",
    name: "\u8E0F\u7F61",
    icon: "\u{1F45F}",
    description: "\u79FB\u52A8\u901F\u5EA6 +10%",
    effect: { speedMult: 0.1 }
  },
  MIGHT: {
    id: "might",
    name: "\u7834\u715E",
    icon: "\u{1F4AA}",
    description: "\u4F24\u5BB3 +10%",
    effect: { damageMult: 0.1 }
  },
  AREA: {
    id: "area",
    name: "\u6CD5\u57DF",
    icon: "\u{1F4CF}",
    description: "\u6B66\u5668\u8303\u56F4 +10%",
    effect: { areaMult: 0.1 }
  },
  COOLDOWN: {
    id: "cooldown",
    name: "\u6025\u5F8B",
    icon: "\u23F1\uFE0F",
    description: "\u653B\u51FB\u901F\u5EA6 +8%",
    effect: { cooldownMult: -0.08 }
  },
  MAGNET: {
    id: "magnet",
    name: "\u6444\u7269",
    icon: "\u{1F9F2}",
    description: "\u62FE\u53D6\u8303\u56F4 +25%",
    effect: { magnetMult: 0.25 }
  },
  GROWTH: {
    id: "growth",
    name: "\u609F\u9053",
    icon: "\u{1F4C8}",
    description: "\u7ECF\u9A8C\u83B7\u53D6 +10%",
    effect: { expMult: 0.1 }
  },
  LUCK: {
    id: "luck",
    name: "\u547D\u6570",
    icon: "\u{1F340}",
    description: "\u66B4\u51FB\u7387 +5%",
    effect: { critChance: 0.05 }
  },
  // --- iter-14 passives -------------------------------------------------
  // The three new passives all hook into existing player stats so the level-
  // up roller pool grows without any new code path. `dodgeChance` is summed
  // (capped at 0.6 in entities.js) and consulted before damage is applied;
  // `magnetMult` is reused for Pickup Magnet+ which stacks multiplicatively
  // on the existing MAGNET passive; `damageReduction` is summed and clamped
  // to a soft 0.6 cap on the consumer side so the player can't go fully
  // immortal even with five stacks.
  DODGE: {
    id: "dodge",
    name: "\u7F29\u5730",
    icon: "\u{1F4A8}",
    description: "\u95EA\u907F\u7387 +5%",
    effect: { dodgeChance: 0.05 }
  },
  MAGNET_PLUS: {
    id: "magnet_plus",
    name: "\u5927\u6444\u7269\u672F",
    icon: "\u{1F9F2}",
    description: "\u62FE\u53D6\u8303\u56F4 +35%",
    effect: { magnetMult: 0.35 }
  },
  DAMAGE_REDUCTION: {
    id: "damage_reduction",
    name: "\u7384\u6B66\u969C",
    icon: "\u{1F6E1}\uFE0F",
    description: "\u53D7\u5230\u7684\u4F24\u5BB3 -8%",
    effect: { damageReduction: 0.08 }
  },
  INK_BODY: {
    id: "ink_body",
    name: "\u58A8\u9AA8\u8EAB",
    icon: "\u58A8",
    description: "\u6700\u5927\u751F\u547D +12%\uFF0C\u6700\u7EC8\u51CF\u4F24 +3%",
    effect: { maxHpMult: 0.12, damageReduction: 0.03 }
  },
  STAR_STEP: {
    id: "star_step",
    name: "\u661F\u6B65\u6B8B\u5377",
    icon: "\u661F",
    description: "\u79FB\u52A8\u901F\u5EA6 +8%\uFF0C\u95EA\u907F\u7387 +2%",
    effect: { speedMult: 0.08, dodgeChance: 0.02 }
  },
  RITUAL_FOCUS: {
    id: "ritual_focus",
    name: "\u658B\u91AE\u5B9A\u795E",
    icon: "\u91AE",
    description: "\u653B\u51FB\u901F\u5EA6 +5%\uFF0C\u6B66\u5668\u8303\u56F4 +5%",
    effect: { cooldownMult: -0.05, areaMult: 0.05 }
  },
  HUNGRY_SOUL: {
    id: "hungry_soul",
    name: "\u9965\u9B42\u5410\u7EB3",
    icon: "\u9B42",
    description: "\u6BCF\u79D2\u6062\u590D +0.25\uFF0C\u62FE\u53D6\u8303\u56F4 +15%",
    effect: { hpRegen: 0.25, magnetMult: 0.15 }
  }
};
var ENEMIES = {
  BRAMBLE_SEER: {
    id: "bramble_seer",
    name: "\u7F20\u6839\u5C71\u795D",
    archetype: "controller",
    hp: 48,
    speed: 55,
    damage: 14,
    exp: 28,
    color: "#96be85",
    size: 18,
    control: { label: "\u7F20\u6839", color: "#96be85", radius: 90, slow: 0.25, interval: 6.5 }
  },
  THREAD_CHANTER: {
    id: "thread_chanter",
    name: "\u7275\u4E1D\u620F\u795D",
    archetype: "controller",
    hp: 44,
    speed: 65,
    damage: 16,
    exp: 30,
    color: "#d3877e",
    size: 18,
    control: { label: "\u7275\u4E1D", color: "#d3877e", radius: 105, slow: 0.3, interval: 7 }
  },
  FROST_EYE: {
    id: "frost_eye",
    name: "\u51DD\u971C\u661F\u77B3",
    archetype: "controller",
    hp: 54,
    speed: 50,
    damage: 15,
    exp: 30,
    color: "#82d6ef",
    size: 18,
    control: { label: "\u51DD\u971C", color: "#82d6ef", radius: 100, slow: 0.35, interval: 7 }
  },
  BAT: {
    id: "bat",
    name: "\u540A\u6B7B\u9B3C\u86FE",
    archetype: "chaser",
    hp: 15,
    speed: 110,
    damage: 10,
    exp: 10,
    color: "#8844ff",
    size: 12
  },
  ZOMBIE: {
    id: "zombie",
    name: "\u884C\u5C38\u9999\u5BA2",
    archetype: "chaser",
    hp: 30,
    speed: 70,
    damage: 15,
    exp: 15,
    color: "#44aa44",
    size: 18
  },
  SKELETON: {
    id: "skeleton",
    name: "\u767D\u9AA8\u4F36\u4EBA",
    archetype: "chaser",
    hp: 25,
    speed: 95,
    damage: 12,
    exp: 12,
    color: "#dddddd",
    size: 14
  },
  WOLF: {
    id: "wolf",
    name: "\u98DF\u6708\u72C8",
    archetype: "dasher",
    dasher: true,
    dashSpeed: 320,
    dashInterval: 3.5,
    dashDuration: 0.6,
    hp: 40,
    speed: 150,
    damage: 20,
    exp: 20,
    color: "#aa6644",
    size: 16
  },
  GOLEM: {
    id: "golem",
    name: "\u9999\u7070\u50A9\u50CF",
    archetype: "shielded",
    shielded: true,
    shieldHp: 60,
    damageReduction: 0.5,
    hp: 120,
    speed: 45,
    damage: 30,
    exp: 50,
    color: "#888888",
    size: 28
  },
  GHOST: {
    id: "ghost",
    name: "\u65E0\u9762\u6E38\u9B42",
    archetype: "chaser",
    hp: 20,
    speed: 130,
    damage: 18,
    exp: 18,
    color: "#88ccff",
    size: 15,
    ghost: true
  },
  // --- New archetypes --------------------------------------------------
  MAGE: {
    id: "mage",
    name: "\u89C2\u661F\u90AA\u6559\u5F92",
    archetype: "ranged",
    ranged: true,
    firingRange: 360,
    keepDistance: 260,
    projectileSpeed: 220,
    projectileDamage: 14,
    fireCooldown: 2.4,
    shotWindup: 0.65,
    hp: 28,
    speed: 70,
    damage: 8,
    exp: 22,
    color: "#cc44cc",
    size: 14
  },
  SLIME: {
    id: "slime",
    name: "\u8089\u829D",
    archetype: "splitter",
    splitter: true,
    splitCount: 2,
    hp: 55,
    speed: 65,
    damage: 14,
    exp: 24,
    color: "#33cc88",
    size: 20
  },
  SLIMELING: {
    id: "slimeling",
    name: "\u5E7C\u8089\u829D",
    archetype: "chaser",
    hp: 18,
    speed: 105,
    damage: 8,
    exp: 6,
    color: "#66ddaa",
    size: 10
  },
  // --- v2.4 additions: bomber (self-destructs) + illusionist (clone) ---
  BOMBER: {
    id: "bomber",
    name: "\u7206\u809A\u7AE5\u5B50",
    archetype: "bomber",
    bomber: true,
    fuseRange: 80,
    // begins countdown when within this distance
    fuseTime: 1.4,
    // seconds before detonation
    blastRadius: 120,
    blastDamage: 40,
    hp: 35,
    speed: 120,
    damage: 10,
    exp: 28,
    color: "#ff6644",
    size: 14
  },
  ILLUSIONIST: {
    id: "illusionist",
    name: "\u955C\u4E2D\u9053\u58EB",
    archetype: "illusionist",
    illusionist: true,
    cloneCooldown: 5.5,
    cloneCount: 2,
    hp: 42,
    speed: 95,
    damage: 12,
    exp: 30,
    color: "#cc88ff",
    size: 15
  }
};
ENEMIES.SLIME.splitInto = "slimeling";
var BOSSES = {
  REAPER: {
    id: "reaper",
    name: "\u7EB8\u5AC1\u8863\u65E0\u5E38",
    hp: 2500,
    speed: 80,
    damage: 40,
    exp: 500,
    color: "#220033",
    size: 48,
    boss: true,
    ability: "summon",
    spawnAt: 300
    // 5 minutes
  },
  VOID_LORD: {
    id: "void_lord",
    name: "\u65E0\u76F8\u661F\u541B",
    hp: 6e3,
    speed: 60,
    damage: 60,
    exp: 1200,
    color: "#550077",
    size: 64,
    boss: true,
    ability: "charge",
    spawnAt: 600
    // 10 minutes
  },
  // --- v2.4 mid/late bosses --------------------------------------------
  NECROMANCER: {
    id: "necromancer",
    name: "\u620F\u795E\u5C38\u738B",
    hp: 4200,
    speed: 70,
    damage: 50,
    exp: 850,
    color: "#3a1a4a",
    size: 54,
    boss: true,
    ability: "summon",
    spawnAt: 450
    // 7:30
  },
  CHRONO_LICH: {
    id: "chrono_lich",
    name: "\u592A\u5C81\u65F6\u8839",
    hp: 1e4,
    speed: 55,
    damage: 75,
    exp: 2e3,
    color: "#0b2a4a",
    size: 72,
    boss: true,
    ability: "charge",
    spawnAt: 720
    // 12:00
  },
  // --- iter-14 tundra final boss ---------------------------------------
  // IceQueen is a frost-palette variant of the 10-minute boss. The tundra
  // stage swaps her in for VoidLord via `bossOverrides`; on other stages she
  // never auto-spawns. Listed here so the boss list, daily-mode replays and
  // achievement registry can reference her by id without a special case.
  ICE_QUEEN: {
    id: "ice_queen",
    name: "\u6708\u8680\u9F99\u5973",
    hp: 6200,
    speed: 55,
    damage: 60,
    exp: 1300,
    color: "#88ccff",
    size: 66,
    boss: true,
    ability: "charge",
    // Listed at 660 to keep the BOSSES timeline strictly ascending
    // (Reaper 300 < Necro 450 < VoidLord 600 < IceQueen 660 < ChronoLich
    // 720). Tundra's `bossOverrides` swaps her into VoidLord's 600 slot
    // at runtime; this raw value is never read on tundra (the override
    // path uses the source boss's spawnAt + offset).
    spawnAt: 660,
    iceQueen: true
    // visual flag, read by entities renderer for frost halo
  }
};
var WAVES = [
  { from: 0, to: 30, pool: ["bat", "zombie"], spawnMult: 1, label: "\u90AA\u6F6E\u521D\u8D77" },
  { from: 30, to: 60, pool: ["bat", "zombie", "skeleton"], spawnMult: 1.1, label: "\u7EB8\u706F\u5F15\u9B42" },
  {
    from: 60,
    to: 90,
    pool: ["zombie", "skeleton", "mage"],
    spawnMult: 1.15,
    label: "\u90AA\u6559\u89C2\u661F"
  },
  {
    from: 90,
    to: 120,
    pool: ["skeleton", "wolf", "ghost", "mage"],
    spawnMult: 1.2,
    label: "\u98DF\u6708\u6210\u7FA4"
  },
  {
    from: 120,
    to: 180,
    pool: ["wolf", "ghost", "slime", "mage", "bomber"],
    spawnMult: 1.3,
    label: "\u8089\u829D\u589E\u6B96"
  },
  {
    from: 180,
    to: 240,
    pool: ["wolf", "golem", "ghost", "slime", "bomber"],
    spawnMult: 1.4,
    label: "\u50A9\u50CF\u5F00\u9053"
  },
  {
    from: 240,
    to: 300,
    pool: ["golem", "ghost", "slime", "mage", "illusionist"],
    spawnMult: 1.5,
    label: "\u767E\u9B3C\u538B\u5883"
  },
  {
    from: 300,
    to: 420,
    pool: ["wolf", "golem", "ghost", "slime", "mage", "bomber", "illusionist"],
    spawnMult: 1.6,
    label: "\u65E0\u5E38\u8FC7\u5883"
  },
  {
    from: 420,
    to: 600,
    pool: ["golem", "slime", "mage", "ghost", "wolf", "illusionist"],
    spawnMult: 1.75,
    label: "\u5929\u95E8\u6E10\u88C2"
  },
  {
    from: 600,
    to: Infinity,
    pool: ["golem", "slime", "mage", "ghost", "wolf", "skeleton", "bomber", "illusionist"],
    spawnMult: 2,
    label: "\u7FA4\u661F\u5F52\u4F4D"
  }
];

// prototype-2d-pixel/src/enemy-skins.js
var ENEMY_THEME_SKINS = Object.freeze({
  forest: Object.freeze([
    Object.freeze({
      id: "forest_0",
      name: "\u7EB8\u9A6C\u6E38\u9B42",
      atlasColumn: 0,
      atlasRow: 0,
      projectileStyle: "paper",
      projectileColor: "#e8d8aa"
    }),
    Object.freeze({
      id: "forest_1",
      name: "\u6CFC\u58A8\u5C71\u72FC",
      atlasColumn: 1,
      atlasRow: 0,
      projectileStyle: "ink",
      projectileColor: "#536f5d"
    }),
    Object.freeze({
      id: "forest_2",
      name: "\u575F\u773C\u6BD2\u87FE",
      atlasColumn: 2,
      atlasRow: 0,
      projectileStyle: "ember",
      projectileColor: "#b7cf63"
    }),
    Object.freeze({
      id: "forest_3",
      name: "\u7AF9\u5203\u50A9\u5996",
      atlasColumn: 3,
      atlasRow: 0,
      projectileStyle: "blade",
      projectileColor: "#9fcf9d"
    })
  ]),
  crypt: Object.freeze([
    Object.freeze({
      id: "crypt_0",
      name: "\u60AC\u4E1D\u68FA\u5076",
      atlasColumn: 0,
      atlasRow: 1,
      projectileStyle: "skull",
      projectileColor: "#a34d45"
    }),
    Object.freeze({
      id: "crypt_1",
      name: "\u65E0\u706F\u5F15\u9B42\u9B3C",
      atlasColumn: 1,
      atlasRow: 1,
      projectileStyle: "lantern",
      projectileColor: "#f1a13b"
    }),
    Object.freeze({
      id: "crypt_2",
      name: "\u767D\u9AA8\u796D\u5E08",
      atlasColumn: 2,
      atlasRow: 1,
      projectileStyle: "skull",
      projectileColor: "#c8b39b"
    }),
    Object.freeze({
      id: "crypt_3",
      name: "\u65E0\u9762\u620F\u715E",
      atlasColumn: 3,
      atlasRow: 1,
      projectileStyle: "mask",
      projectileColor: "#d94e62"
    })
  ]),
  tundra: Object.freeze([
    Object.freeze({
      id: "tundra_0",
      name: "\u51BB\u5C38\u661F\u58F3",
      atlasColumn: 0,
      atlasRow: 2,
      projectileStyle: "ice",
      projectileColor: "#8ce6ff"
    }),
    Object.freeze({
      id: "tundra_1",
      name: "\u6676\u810A\u730E\u72AC",
      atlasColumn: 1,
      atlasRow: 2,
      projectileStyle: "ice",
      projectileColor: "#61cbea"
    }),
    Object.freeze({
      id: "tundra_2",
      name: "\u7AA5\u661F\u90AA\u773C",
      atlasColumn: 2,
      atlasRow: 2,
      projectileStyle: "star",
      projectileColor: "#d36bff"
    }),
    Object.freeze({
      id: "tundra_3",
      name: "\u5F57\u7532\u5DE8\u7075",
      atlasColumn: 3,
      atlasRow: 2,
      projectileStyle: "comet",
      projectileColor: "#cf59dc"
    })
  ])
});
function enemyArchetypeSlot(enemy = {}) {
  if (enemy.control) return 2;
  const identitySlots = {
    bat: 0,
    ghost: 0,
    slime: 0,
    slimeling: 0,
    wolf: 1,
    zombie: 2,
    mage: 2,
    illusionist: 2,
    skeleton: 3,
    golem: 3,
    bomber: 3
  };
  if (identitySlots[enemy.id] !== void 0) return identitySlots[enemy.id];
  if (enemy.shielded || enemy.bomber || enemy.id === "golem") return 3;
  if (enemy.ranged || enemy.illusionist || enemy.id === "mage") return 2;
  if (enemy.dasher || enemy.id === "wolf") return 1;
  return 0;
}
function enemySkinFor(stageId, enemy) {
  const set = ENEMY_THEME_SKINS[stageId] || ENEMY_THEME_SKINS.forest;
  return set[enemyArchetypeSlot(enemy)];
}

// prototype-2d-pixel/src/plain-state.js
function clonePlainState(value) {
  if (Array.isArray(value)) return value.map(clonePlainState);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, clonePlainState(item)])
    );
  return value;
}

// prototype-2d-pixel/src/damage-history.js
var KINDS = Object.freeze({
  contact: "\u8FD1\u8EAB\u78B0\u649E",
  projectile: "\u8FDC\u7A0B\u5F39\u9053",
  field: "\u5730\u9762\u5371\u9669",
  blast: "\u8FD1\u8EAB\u81EA\u7206",
  environment: "\u73AF\u5883\u4FB5\u8680",
  event: "\u4E8B\u4EF6\u4EE3\u4EF7",
  unknown: "\u672A\u660E\u6765\u6E90"
});
var TIPS = Object.freeze({
  contact: "\u4FDD\u6301\u9000\u8DEF\uFF0C\u907F\u514D\u88AB\u602A\u7FA4\u5305\u56F4\u3002",
  projectile: "\u770B\u5230\u84C4\u5C04\u65B9\u5411\u540E\u4FA7\u79FB\uFF1B\u5B9E\u4F53\u5EFA\u7B51\u53EF\u6321\u4F4F\u654C\u5F39\u3002",
  field: "\u9884\u8B66\u671F\u95F4\u79BB\u5F00\u6807\u8BB0\u533A\u57DF\uFF0C\u751F\u6548\u540E\u4E0D\u8981\u505C\u7559\u3002",
  blast: "\u5F15\u7206\u84C4\u52BF\u65F6\u62C9\u5F00\u8DDD\u79BB\uFF0C\u4E0D\u8981\u8D34\u8EAB\u505C\u7559\u3002",
  environment: "\u5BFB\u627E\u6062\u590D\u5EFA\u7B51\u7684\u907F\u661F\u706F\uFF1B\u4FB5\u8680\u6700\u4F4E\u4FDD\u7559\u4E00\u547D\u3002",
  event: "\u8FD9\u662F\u4E3B\u52A8\u4EA4\u6362\u7684\u4EE3\u4EF7\uFF0C\u4E0D\u662F\u602A\u7269\u653B\u51FB\u3002",
  unknown: "\u6765\u6E90\u672A\u8BB0\u5F55\uFF0C\u4E0D\u80FD\u636E\u6B64\u5224\u65AD\u5177\u4F53\u653B\u51FB\u3002"
});
var amount = (n) => Number.isFinite(n) && n >= 0 ? Math.min(n, 1e12) : 0;
var plain = (value) => typeof value === "string" ? value.replace(/[<>&"'\x00-\x1f]/g, "").slice(0, 48) : "";
function enemyDamageSource(enemy, kind = "contact") {
  return {
    kind,
    label: enemy?.boss ? enemy.type?.name || enemy.id : enemy?.skin?.name || enemy?.type?.name || "\u90AA\u7269"
  };
}
function restoreDamageHistory(saved, time = 0) {
  const valid = saved?.version === 1 && Array.isArray(saved.recent);
  const history = {
    version: 1,
    since: valid ? Math.min(amount(saved.since), amount(time)) : amount(time),
    totals: {},
    recent: []
  };
  for (const kind of Object.keys(KINDS))
    history.totals[kind] = valid ? amount(saved.totals?.[kind]) : 0;
  if (valid)
    history.recent = saved.recent.slice(-12).filter(
      (e) => e && Number.isFinite(e.time) && e.time >= 0 && e.time <= time && Number.isFinite(e.loss) && e.loss > 0
    ).map((e) => ({
      time: e.time,
      kind: Object.hasOwn(KINDS, e.kind) ? e.kind : "unknown",
      label: plain(e.label) || "\u672A\u660E\u6765\u6E90",
      loss: amount(e.loss),
      fatal: e.fatal === true,
      revived: e.revived === true
    }));
  return history;
}
function recordHealthLoss(game, source, loss, result = {}) {
  if (!game || !Number.isFinite(loss) || loss <= 0) return;
  const h = game.damageHistory || (game.damageHistory = restoreDamageHistory(null, 0));
  const kind = Object.hasOwn(KINDS, source?.kind) ? source.kind : "unknown";
  h.totals[kind] = amount((h.totals[kind] || 0) + loss);
  h.recent.push({
    time: amount(game.gameTime),
    kind,
    label: plain(source?.label) || KINDS[kind],
    loss: amount(loss),
    fatal: result.fatal === true,
    revived: result.revived === true
  });
  if (h.recent.length > 12) h.recent.shift();
}
function damageRecap(game, detailed = false) {
  const h = restoreDamageHistory(game.damageHistory, game.gameTime || 0);
  const last = h.recent[h.recent.length - 1];
  if (!last) return h.since > 0 ? "\u65E7\u547D\u5951\u4ECE\u672C\u6B21\u7EED\u73A9\u5F00\u59CB\u8BB0\u5F55\uFF1B\u5C1A\u65E0\u5931\u8840\u3002" : "\u5C1A\u65E0\u5B9E\u9645\u5931\u8840\u8BB0\u5F55\u3002";
  const title = `${last.fatal ? "\u81F4\u547D\u4E00\u51FB" : "\u6700\u540E\u5931\u8840"}\uFF1A${last.label} \xB7 ${KINDS[last.kind]}${last.revived ? "\uFF08\u501F\u547D\u590D\u8D77\uFF09" : ""}`;
  const dominant = Object.keys(KINDS).reduce(
    (a, b) => h.totals[b] > h.totals[a] ? b : a,
    last.kind
  );
  if (!detailed) return `${title}
\u8BB0\u5F55\u671F\u95F4\u4E3B\u8981\u5931\u8840\uFF1A${KINDS[dominant]}
${TIPS[dominant]}`;
  const clock = (n) => `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
  const total = Object.entries(h.totals).filter(([, v]) => v > 0).map(([k, v]) => `${KINDS[k]} ${v.toFixed(1)}`).join(" / ");
  return `\u8BB0\u5F55\u8D77\u70B9 ${clock(h.since)}\uFF1B\u7D2F\u8BA1\u5B9E\u9645\u5931\u8840\uFF08\u4E0D\u6263\u9664\u540E\u7EED\u6CBB\u7597\uFF09
${total}
\u6700\u8FD1\u5931\u8840\uFF1A
${h.recent.slice(-3).map(
    (e) => `${clock(e.time)} ${e.label}\uFF1A-${e.loss.toFixed(1)}${e.fatal ? " \xB7 \u81F4\u547D" : e.revived ? " \xB7 \u590D\u8D77" : ""}`
  ).join("\n")}
\u95EA\u907F\u4E0E\u65E0\u654C\u6321\u4F24\u4E0D\u8BA1\uFF1B\u590D\u8D77\u6309\u590D\u6D3B\u524D\u6263\u8840\u8BA1\u7B97\u3002`;
}
function damageHistoryCard(game) {
  return {
    category: "\u6218\u6597\u590D\u76D8",
    name: "\u4F24\u52BF\u8BB0\u5F55",
    level: "\u6700\u8FD1\u5931\u8840\u4E0E\u5E94\u5BF9",
    artKind: "hero",
    artId: game.player?.heroId || "sword",
    lore: "\u547D\u5951\u8BB0\u4E0B\u6BCF\u6B21\u771F\u6B63\u5931\u53BB\u7684\u547D\u6570\uFF1B\u65E7\u547D\u5951\u6CA1\u6709\u7684\u5386\u53F2\u4E0D\u4F1A\u51ED\u7A7A\u8865\u9F50\u3002",
    effect: damageRecap(game),
    attackMode: "\u53EA\u8BB0\u5F55\u5B9E\u9645\u6263\u8840\uFF0C\u4E0D\u6539\u53D8\u6218\u6597\uFF1B\u6309\u4F4F Shift \u6216\u70B9\u51FB\u8BE6\u503C\u67E5\u770B\u5206\u7C7B\u7D2F\u8BA1\u4E0E\u6700\u8FD1\u4E09\u6B21\u3002",
    numbers: damageRecap(game, true)
  };
}

// prototype-2d-pixel/src/hostile-attacks.js
function bossCombatSnapshot(boss) {
  if (!boss || boss.hp <= 0) return null;
  return {
    id: boss.id,
    x: boss.x,
    y: boss.y,
    hp: boss.hp,
    maxHp: boss.maxHp,
    damage: boss.damage,
    abilityTimer: boss.abilityTimer,
    cast: boss.cast ? clonePlainState(boss.cast) : null
  };
}
function restoreBossCombat(boss, saved) {
  if (!boss || !saved || saved.id && saved.id !== boss.id) return false;
  for (const key of ["x", "y", "maxHp", "damage", "abilityTimer"]) {
    if (Number.isFinite(saved[key])) boss[key] = saved[key];
  }
  boss.maxHp = Math.max(1, boss.maxHp);
  boss.hp = Math.max(1, Math.min(boss.maxHp, Number(saved.hp) || boss.maxHp));
  boss.cast = saved.cast ? clonePlainState(saved.cast) : null;
  return true;
}
var HostileFieldSystem = class {
  constructor() {
    this.fields = [];
  }
  reset() {
    this.fields = [];
  }
  add(spec) {
    if (this.fields.length >= 24) return false;
    this.fields.push({ warning: 1.1, duration: 2.8, age: 0, tick: 0, ...spec });
    return true;
  }
  update(dt, game) {
    for (const field of this.fields) {
      field.age += dt;
      if (field.age < field.warning || field.age >= field.warning + field.duration) continue;
      field.tick -= dt;
      if (field.tick > 0) continue;
      field.tick = 0.6;
      const player = game.player;
      if (!Number.isFinite(player.x) || !Number.isFinite(player.y)) continue;
      if (Math.hypot(player.x - field.x, player.y - field.y) > field.radius + player.size || player.invincible)
        continue;
      const hp = player.hp;
      player.takeDamage(
        field.damage,
        game,
        field.source || { kind: "field", label: field.label }
      );
      if (player.hp < hp) player.applyHindrance?.(field.slow || 0, 1.2, field.label);
    }
    this.fields = this.fields.filter((f) => f.age < f.warning + f.duration);
  }
  snapshot() {
    return this.fields.map((f) => ({ ...f }));
  }
  restore(fields) {
    this.fields = Array.isArray(fields) ? fields.filter(
      (f) => [f.x, f.y, f.radius, f.age, f.warning, f.duration, f.damage].every(
        Number.isFinite
      ) && f.radius > 0 && f.duration > 0
    ).slice(0, 24).map((f) => ({ ...f })) : [];
  }
  render(ctx, { labels = true } = {}) {
    for (const field of this.fields) {
      const warning = field.age < field.warning;
      ctx.save();
      ctx.fillStyle = `${field.color}28`;
      ctx.strokeStyle = field.color;
      ctx.lineWidth = warning ? 2 : 4;
      ctx.beginPath();
      ctx.arc(field.x, field.y, field.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (warning) {
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(
          field.x,
          field.y,
          field.radius,
          -Math.PI / 2,
          -Math.PI / 2 + Math.PI * 2 * field.age / field.warning
        );
        ctx.stroke();
      }
      if (!labels) {
        ctx.restore();
        continue;
      }
      ctx.fillStyle = "#171719";
      ctx.fillRect(field.x - 58, field.y + field.radius + 6, 116, 22);
      ctx.fillStyle = "#f5e7c9";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        `${field.label} \xB7 ${warning ? "\u5C06\u81F3" : "\u5371\u9669"}`,
        field.x,
        field.y + field.radius + 21
      );
      ctx.restore();
    }
  }
};
function beginEnemyCast(enemy, game) {
  if (enemy.cast || enemy.hp <= 0) return false;
  const player = game.player;
  const phase = enemy.boss && enemy.hp / enemy.maxHp <= 0.5 ? 2 : 1;
  const cast = {
    age: 0,
    warning: 1.1,
    recovery: 0.65,
    phase,
    x: enemy.x,
    y: enemy.y,
    targetX: player.x,
    targetY: player.y,
    fired: false
  };
  const controller = enemy.type.control;
  if (controller || enemy.id === "ice_queen") {
    cast.kind = "field";
    cast.label = controller?.label || "\u6708\u8680\u5BD2\u9635";
    cast.color = controller?.color || "#82d6ef";
    const offsets = controller ? [0] : phase === 2 ? [-170, 0, 170] : [-135, 135];
    for (const offset of offsets)
      game.hostileFields?.add({
        x: player.x + offset,
        y: player.y,
        radius: controller?.radius || 105,
        warning: cast.warning,
        duration: controller ? 2.8 : 3.5,
        damage: enemy.damage * (controller ? 0.6 : 0.35),
        slow: controller?.slow || 0.35,
        label: cast.label,
        color: cast.color,
        source: { ...enemyDamageSource(enemy, "field"), label: cast.label }
      });
  } else if (enemy.id === "reaper") {
    cast.kind = "summon";
    cast.label = "\u7EB8\u9A6C\u8FCE\u4EB2";
    cast.color = "#c7ad76";
  } else if (enemy.id === "necromancer") {
    cast.kind = "fan";
    cast.label = "\u767D\u9AA8\u6563\u620F";
    cast.color = "#df867a";
  } else {
    cast.kind = "charge";
    cast.label = enemy.id === "chrono_lich" ? "\u592A\u5C81\u51B2\u65F6" : "\u88C2\u7A7A\u51B2\u649E";
    cast.color = "#d48cb7";
    const dx = player.x - enemy.x, dy = player.y - enemy.y, distance = Math.hypot(dx, dy) || 1;
    const length = Math.min(440, Math.max(160, distance + 70));
    cast.endX = enemy.x + dx / distance * length;
    cast.endY = enemy.y + dy / distance * length;
    if (game.runMode === "chapter") {
      cast.endX = Math.max(enemy.size, Math.min(game.arenaWidth - enemy.size, cast.endX));
      cast.endY = Math.max(enemy.size, Math.min(game.arenaHeight - enemy.size, cast.endY));
    }
    cast.travel = 0.75;
    cast.radius = enemy.size;
  }
  enemy.cast = cast;
  return true;
}
function updateEnemyCast(enemy, dt, game) {
  const cast = enemy.cast;
  if (!cast) return false;
  cast.age += dt;
  if (cast.age >= cast.warning && !cast.fired) {
    cast.fired = true;
    if (cast.kind === "summon") game.spawnBossMinions?.(enemy, cast.phase === 2 ? 4 : 3);
    if (cast.kind === "fan") game.fireBossFan?.(enemy, cast);
  }
  if (cast.kind === "charge" && cast.age >= cast.warning) {
    const t = Math.min(1, (cast.age - cast.warning) / cast.travel);
    enemy.x = cast.x + (cast.endX - cast.x) * t;
    enemy.y = cast.y + (cast.endY - cast.y) * t;
  }
  if (cast.age >= cast.warning + (cast.travel || 0) + cast.recovery) enemy.cast = null;
  return true;
}
function renderEnemyCast(ctx, enemy) {
  const aim = enemy.hp > 0 && enemy.rangedAim;
  if (aim) {
    ctx.save();
    ctx.translate(aim.x, aim.y);
    ctx.rotate(aim.angle);
    ctx.strokeStyle = "#171719";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(enemy.size + 8, 0);
    ctx.lineTo(aim.length, 0);
    ctx.moveTo(aim.length - 12, -7);
    ctx.lineTo(aim.length, 0);
    ctx.lineTo(aim.length - 12, 7);
    ctx.stroke();
    ctx.strokeStyle = "#efcb8c";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, enemy.size + 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      enemy.size + 7,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, 1 - aim.remaining / aim.duration))
    );
    ctx.stroke();
    ctx.restore();
  }
  const cast = enemy.cast;
  if (!cast) return;
  ctx.save();
  ctx.strokeStyle = cast.color;
  ctx.fillStyle = `${cast.color}28`;
  if (cast.kind === "charge" && cast.age <= cast.warning + cast.travel) {
    ctx.lineCap = "round";
    ctx.lineWidth = cast.radius * 2;
    ctx.strokeStyle = `${cast.color}38`;
    ctx.beginPath();
    ctx.moveTo(cast.x, cast.y);
    ctx.lineTo(cast.endX, cast.endY);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = cast.color;
    ctx.beginPath();
    ctx.arc(cast.endX, cast.endY, cast.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "#171719";
  ctx.fillRect(enemy.x - 60, enemy.y - enemy.size - 37, 120, 23);
  ctx.fillStyle = "#f5e7c9";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    `${cast.label}${cast.age < cast.warning ? " \xB7 \u84C4\u52BF" : ""}`,
    enemy.x,
    enemy.y - enemy.size - 21
  );
  ctx.restore();
}

// prototype-2d-pixel/src/entities.js
var HERO_COMBAT_ATLAS = false ? new (void 0)() : null;
var HERO_COMBAT_SPRITES = HERO_COMBAT_ATLAS;
if (HERO_COMBAT_ATLAS) {
  HERO_COMBAT_ATLAS.onload = () => {
    const canvas = (void 0).createElement("canvas");
    canvas.width = HERO_COMBAT_ATLAS.naturalWidth;
    canvas.height = HERO_COMBAT_ATLAS.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(HERO_COMBAT_ATLAS, 0, 0);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data } = image;
    const width = canvas.width;
    const height = canvas.height;
    const seen = new Uint8Array(width * height);
    const queue = new Int32Array(width * height);
    let head = 0;
    let tail = 0;
    const isBackdrop = (index) => {
      const p = index * 4;
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      return r >= 226 && Math.abs(r - g) <= 7 && Math.abs(g - b) <= 7;
    };
    const push = (index) => {
      if (seen[index] || !isBackdrop(index)) return;
      seen[index] = 1;
      queue[tail++] = index;
    };
    for (let x = 0; x < width; x++) {
      push(x);
      push((height - 1) * width + x);
    }
    for (let y = 0; y < height; y++) {
      push(y * width);
      push(y * width + width - 1);
    }
    while (head < tail) {
      const index = queue[head++];
      data[index * 4 + 3] = 0;
      const x = index % width;
      if (x > 0) push(index - 1);
      if (x < width - 1) push(index + 1);
      if (index >= width) push(index - width);
      if (index < width * (height - 1)) push(index + width);
    }
    ctx.putImageData(image, 0, 0);
    HERO_COMBAT_SPRITES = canvas;
  };
  HERO_COMBAT_ATLAS.src = "./assets/heroes/launch-combat-sprites-v1.png";
}
var Player = class {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = CONFIG.PLAYER_SIZE;
    this.baseMaxHp = 100;
    this.maxHp = this.baseMaxHp;
    this.hp = this.baseMaxHp;
    this.level = 1;
    this.exp = 0;
    this.expToNext = 50;
    this.weapons = [];
    this.passives = /* @__PURE__ */ Object.create(null);
    this.runModifiers = {
      damageMult: 1,
      areaMult: 1,
      cooldownMult: 1,
      speedMult: 1,
      expMult: 1,
      magnetMult: 1,
      incomingDamageMult: 1,
      maxHpMult: 1,
      armor: 0,
      critChance: 0,
      reviveCharges: 0,
      projectileBonus: 0,
      maxHpDamageRatio: 0,
      missingHpDamageRatio: 0,
      armorReflectRatio: 0,
      speedDamageRatio: 0,
      healingMult: 1
    };
    this.invincible = false;
    this.invincibleTimer = 0;
    this.dead = false;
    this.unhitTimer = 0;
    this.hindranceRemaining = 0;
    this.hindrancePower = 0;
    this.hindranceLabel = "";
    this.walkPhase = 0;
    this.walkFrame = 1;
    this.walkFacing = 1;
  }
  update(dt, game) {
    this.prevX = this.x;
    this.prevY = this.y;
    const v = game.input.getMoveVector();
    const stageSpeedMult = game.stageMods?.playerSpeedMult ?? 1;
    const hindered = (this.hindranceRemaining || 0) > 0;
    this.hindranceRemaining = Math.max(0, (this.hindranceRemaining || 0) - dt);
    const speed = CONFIG.PLAYER_SPEED * this.getSpeedMult() * stageSpeedMult * (hindered ? 1 - (this.hindrancePower || 0) : 1);
    this.x += v.x * speed * dt;
    this.y += v.y * speed * dt;
    if (game.runMode !== "endless") {
      const r = this.size;
      const W = game.arenaWidth || CONFIG.ARENA_WIDTH || CONFIG.CANVAS_WIDTH;
      const H = game.arenaHeight || CONFIG.ARENA_HEIGHT || CONFIG.CANVAS_HEIGHT;
      if (this.x < r) this.x = r;
      else if (this.x > W - r) this.x = W - r;
      if (this.y < r) this.y = r;
      else if (this.y > H - r) this.y = H - r;
    }
    for (const w of this.weapons) w.update(dt, this, game);
    if (this.invincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) this.invincible = false;
    }
    const regen = this._passiveSum("hpRegen");
    if (regen) this.heal(regen * dt);
    this.unhitTimer += dt;
    if (game.run) {
      if (this.unhitTimer > (game.run.longestUnhit || 0)) {
        game.run.longestUnhit = this.unhitTimer;
      }
    }
  }
  applyHindrance(power, duration, label = "\u51CF\u901F") {
    this.hindrancePower = Math.min(0.4, Math.max(0, Number(power) || 0));
    this.hindranceRemaining = Math.min(2, Math.max(0, Number(duration) || 0));
    this.hindranceLabel = label;
  }
  addPassive(def) {
    var _a, _b;
    (_a = this.passives)[_b = def.id] ?? (_a[_b] = { def, count: 0 });
    if (this.passives[def.id].count >= CONFIG.PASSIVE_MAX_STACK) return;
    this.passives[def.id].count++;
    this.recalculateStats();
  }
  _passiveSum(key) {
    let total = 0;
    for (const id in this.passives) {
      const p = this.passives[id];
      if (p.def.effect[key] !== void 0) total += p.def.effect[key] * p.count;
    }
    return total;
  }
  _passiveMult(key) {
    let mult = 1;
    for (const id in this.passives) {
      const p = this.passives[id];
      if (p.def.effect[key] !== void 0) mult *= Math.pow(1 + p.def.effect[key], p.count);
    }
    return mult;
  }
  recalculateStats() {
    const prevMaxHp = this.maxHp;
    this.maxHp = this.baseMaxHp * this._passiveMult("maxHpMult") * (this.runModifiers?.maxHpMult ?? 1);
    this.hp += this.maxHp - prevMaxHp;
    this.hp = Math.min(this.hp, this.maxHp);
  }
  getDamageMult() {
    const base = this._passiveMult("damageMult") * (this.runModifiers?.damageMult ?? 1);
    return base * this.getHealthDamageMult() * this.getWoundedDamageMult() * this.getSpeedDamageMult();
  }
  getHealthDamageMult() {
    const maxHpGrowth = Math.max(0, this.maxHp / this.baseMaxHp - 1);
    return 1 + maxHpGrowth * (this.runModifiers?.maxHpDamageRatio || 0);
  }
  getWoundedDamageMult() {
    const missingHp = 1 - Math.max(0, this.hp) / Math.max(1, this.maxHp);
    return 1 + missingHp * (this.runModifiers?.missingHpDamageRatio || 0);
  }
  getSpeedDamageMult() {
    const speedGrowth = Math.max(0, this.getSpeedMult() - 1);
    return 1 + speedGrowth * (this.runModifiers?.speedDamageRatio || 0);
  }
  getReflectDamage(taken = 0) {
    const ratio = this.runModifiers?.armorReflectRatio || 0;
    return ratio > 0 ? Math.max(1, (this.getArmor() + taken * 0.25) * ratio) : 0;
  }
  getAreaMult() {
    return this._passiveMult("areaMult") * (this.runModifiers?.areaMult ?? 1);
  }
  getCooldownMult() {
    let mult = 1;
    for (const id in this.passives) {
      const p = this.passives[id];
      const v = p.def.effect.cooldownMult;
      if (v !== void 0) mult *= Math.pow(1 + v, p.count);
    }
    return Math.max(0.2, mult * (this.runModifiers?.cooldownMult ?? 1));
  }
  getSpeedMult() {
    return this._passiveMult("speedMult") * (this.runModifiers?.speedMult ?? 1);
  }
  getExpMult() {
    return this._passiveMult("expMult") * (this.runModifiers?.expMult ?? 1);
  }
  getMagnetRange() {
    let mult = 1;
    for (const id in this.passives) {
      const p = this.passives[id];
      const v = p.def.effect.magnetMult;
      if (v !== void 0) mult *= Math.pow(1 + v, p.count);
    }
    return CONFIG.MAGNET_BASE * mult * (this.runModifiers?.magnetMult ?? 1);
  }
  getArmor() {
    return this._passiveSum("armor") + (this.runModifiers?.armor ?? 0);
  }
  getCritChance() {
    return this._passiveSum("critChance") + (this.runModifiers?.critChance ?? 0);
  }
  /**
   * iter-14: dodge chance from the new Evasion passive. Soft-capped at 60%
   * so a player who stacks five copies still gets hit sometimes — full
   * immortality would break the late-game balance entirely.
   */
  getDodgeChance() {
    return Math.min(0.6, this._passiveSum("dodgeChance"));
  }
  /**
   * iter-14: percentage damage reduction (Bulwark). Multiplies *after*
   * armor subtraction, soft-capped at 60% for the same reason as dodge.
   */
  getDamageReduction() {
    return Math.min(0.6, this._passiveSum("damageReduction"));
  }
  gainExp(amount2) {
    this.exp += amount2 * this.getExpMult();
    const levelUps = [];
    while (this.exp >= this.expToNext) {
      this.exp -= this.expToNext;
      this.level++;
      this.expToNext = Math.floor(this.expToNext * 1.2);
      this.heal(20);
      levelUps.push(this.level);
    }
    return levelUps;
  }
  takeDamage(damage, game, source = null) {
    if (this.invincible || this.dead) return;
    const dodge = this.getDodgeChance();
    if (dodge > 0 && Math.random() < dodge) {
      game?.createFloatingText?.("Miss!", this.x, this.y - 30, "#88ffcc");
      return;
    }
    const afterArmor = Math.max(1, damage - this.getArmor());
    const taken = Math.max(
      1,
      afterArmor * (1 - this.getDamageReduction()) * (this.runModifiers?.incomingDamageMult ?? 1)
    );
    const hpBefore = this.hp;
    this.hp -= taken;
    this.invincible = true;
    this.invincibleTimer = CONFIG.INVINCIBILITY_TIME;
    this.unhitTimer = 0;
    if (game?.run) game.run.tookAnyDamage = true;
    game?.onPlayerHurt?.(taken);
    const reflectRatio = this.runModifiers?.armorReflectRatio || 0;
    if (reflectRatio > 0 && game?.enemies?.length) {
      const reflected = this.getReflectDamage(taken);
      for (const enemy of game.enemies) {
        if (enemy.hp > 0 && Math.hypot(enemy.x - this.x, enemy.y - this.y) <= 150) {
          enemy.takeDamage(reflected);
          game.createFloatingText?.(
            `\u53CD ${Math.round(reflected)}`,
            enemy.x,
            enemy.y - 20,
            "#d8b66c"
          );
        }
      }
    }
    if (this.hp <= 0) {
      if ((this.runModifiers?.reviveCharges || 0) > 0) {
        this.runModifiers.reviveCharges--;
        this.hp = Math.max(1, this.maxHp * 0.4);
        this.invincible = true;
        this.invincibleTimer = 2;
        game?.createFloatingText?.("\u501F\u547D\u590D\u8D77", this.x, this.y - 42, "#ffdf8a");
      } else {
        this.hp = 0;
        this.dead = true;
      }
    }
    recordHealthLoss(game, source, Math.min(Math.max(0, hpBefore), taken), {
      fatal: this.dead,
      revived: hpBefore - taken <= 0 && !this.dead
    });
  }
  heal(amount2) {
    this.hp = Math.min(this.hp + amount2 * (this.runModifiers?.healingMult ?? 1), this.maxHp);
  }
  render(ctx) {
    ctx.save();
    ctx.globalAlpha = this.invincible ? 0.82 : 1;
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    ctx.fillStyle = "rgba(14, 20, 22, 0.28)";
    ctx.fillRect(x - 28, y + 24, 56, 10);
    if (drawAnimatedHero(ctx, this)) {
    } else if (HERO_COMBAT_SPRITES && HERO_COMBAT_ATLAS?.complete && HERO_COMBAT_ATLAS.naturalWidth) {
      const sourceW = HERO_COMBAT_SPRITES.width / 2;
      const sourceH = HERO_COMBAT_SPRITES.height / 2;
      const index = Math.max(0, Math.min(3, this.heroSpriteIndex || 0));
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        HERO_COMBAT_SPRITES,
        index % 2 * sourceW,
        Math.floor(index / 2) * sourceH,
        sourceW,
        sourceH,
        x - 42,
        y - 50,
        84,
        84
      );
    } else {
      ctx.fillStyle = "#335b70";
      ctx.fillRect(x - 16, y - 20, 32, 40);
      ctx.fillStyle = "#ecd79d";
      ctx.font = "700 14px monospace";
      ctx.textAlign = "center";
      ctx.fillText(this.heroGlyph || "\u547D", x, y + 5);
    }
    if (this.hindranceRemaining > 0) {
      ctx.fillStyle = "#171719";
      ctx.fillRect(x - 45, y + 37, 90, 21);
      ctx.fillStyle = "#eadac6";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${this.hindranceLabel} \xB7 \u51CF\u901F`, x, y + 52);
    }
    const garlic = this.weapons.find((w) => w.id === "garlic");
    if (garlic) {
      const range = garlic.getRange(this);
      ctx.fillStyle = "rgba(120, 205, 138, 0.08)";
      ctx.strokeStyle = "rgba(160,255,160,0.34)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, range, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    if (this.invincible) {
      ctx.strokeStyle = "rgba(210, 244, 255, 0.82)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 34, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
};
function registerWeaponClass(_cls) {
}
function enemyHitRadius(enemy) {
  return Math.max(1, Number(enemy?.hitRadius ?? enemy?.size) || 12);
}
var Enemy = class _Enemy {
  constructor(x, y, type, hpMult, dmgMult) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = type.size;
    this.visualDiameter = type.boss ? type.size * 2 : Math.max(42, Math.round(type.size * 2.6));
    this.hitRadius = type.boss ? type.size : this.visualDiameter / 2;
    this.maxHp = type.hp * hpMult;
    this.hp = this.maxHp;
    this.speed = type.speed;
    this.damage = type.damage * dmgMult;
    this.expValue = type.exp;
    this.color = type.color;
    this.id = type.id;
    this.boss = !!type.boss;
    this.flashTimer = 0;
    this.ability = type.ability;
    this.abilityTimer = 3;
    this.archetype = type.archetype || "chaser";
    this.ranged = !!type.ranged;
    this.splitter = !!type.splitter;
    this.dasher = !!type.dasher;
    this.shielded = !!type.shielded;
    this.bomber = !!type.bomber;
    this.illusionist = !!type.illusionist;
    this.fireTimer = type.fireCooldown ? type.fireCooldown * (0.5 + Math.random() * 0.5) : 0;
    this.rangedAim = null;
    this.dashTimer = type.dashInterval ? type.dashInterval * (0.3 + Math.random() * 0.7) : 0;
    this.dashActive = 0;
    this.dashAngle = 0;
    this.shieldHp = type.shieldHp ? type.shieldHp * hpMult : 0;
    this.fuseTimer = 0;
    this.fuseArmed = false;
    this.cloneTimer = type.cloneCooldown ? type.cloneCooldown * (0.6 + Math.random() * 0.8) : 0;
    this.slowTimer = 0;
    this.slowPct = 0;
    this.isClone = false;
  }
  update(dt, game) {
    if (this.hp <= 0) return;
    this.skin || (this.skin = enemySkinFor(game.stageId, this.type));
    this.prevX = this.x;
    this.prevY = this.y;
    if (this.rangedAim) {
      const aim = this.rangedAim;
      if (Math.hypot(this.x - aim.x, this.y - aim.y) > 0.01) {
        this.rangedAim = null;
        this.fireTimer = Math.max(this.fireTimer, 0.35);
        return;
      }
      aim.remaining -= dt;
      this.fireTimer -= dt;
      if (this.slowTimer > 0) this.slowTimer -= dt;
      if (this.flashTimer > 0) this.flashTimer -= dt;
      if (aim.remaining <= 0) {
        game.enemyProjectiles || (game.enemyProjectiles = []);
        game.enemyProjectiles.push(
          new EnemyProjectile(
            aim.x,
            aim.y,
            aim.angle,
            this.type.projectileSpeed || 220,
            this.type.projectileDamage * (game.enemyDmgMult || 1),
            this.skin,
            enemyDamageSource(this, "projectile")
          )
        );
        this.rangedAim = null;
        game.audio?.shoot?.();
      }
      return;
    }
    if (updateEnemyCast(this, dt, game)) return;
    const dx = game.player.x - this.x;
    const dy = game.player.y - this.y;
    const d = Math.hypot(dx, dy);
    let vx = 0, vy = 0;
    const tx = d > 0.01 ? dx / d : 0;
    const ty = d > 0.01 ? dy / d : 0;
    if (this.type.control) {
      this.abilityTimer -= dt;
      if (this.abilityTimer <= 0 && d < 480) {
        this.abilityTimer = this.type.control.interval || 6;
        beginEnemyCast(this, game);
        return;
      }
    }
    if (this.slowTimer > 0) this.slowTimer -= dt;
    const slowMult = this.slowTimer > 0 ? 1 - (this.slowPct || 0) : 1;
    if (this.bomber) {
      const fuseRange = this.type.fuseRange || 80;
      if (d < fuseRange) {
        this.fuseArmed = true;
      }
      if (this.fuseArmed) {
        this.fuseTimer += dt;
        if (this.fuseTimer >= (this.type.fuseTime || 1.4)) {
          const br = this.type.blastRadius || 120;
          const bd = (this.type.blastDamage || 40) * (game.enemyDmgMult || 1);
          const pd = Math.hypot(game.player.x - this.x, game.player.y - this.y);
          if (pd < br && !game.player.invincible) {
            game.player.takeDamage(bd, game, enemyDamageSource(this, "blast"));
            game.createFloatingText(
              Math.round(bd),
              game.player.x,
              game.player.y - 28,
              "#ff4433"
            );
          }
          game.createParticles(this.x, this.y, "#ff8833", 24);
          game.shake?.(0.25);
          game.audio?.explosion?.();
          this.hp = 0;
          return;
        }
      }
      vx = tx * this.speed * slowMult;
      vy = ty * this.speed * slowMult;
      this.x += vx * dt;
      this.y += vy * dt;
      if (this.flashTimer > 0) this.flashTimer -= dt;
      return;
    }
    if (this.illusionist && !this.isClone) {
      this.cloneTimer -= dt;
      if (this.cloneTimer <= 0 && game.enemies.length < CONFIG.MAX_ENEMIES) {
        this.cloneTimer = this.type.cloneCooldown || 5.5;
        const n = this.type.cloneCount || 2;
        for (let i = 0; i < n && game.enemies.length < CONFIG.MAX_ENEMIES; i++) {
          const a = i / n * Math.PI * 2 + Math.random() * 0.4;
          const clone = new _Enemy(
            this.x + Math.cos(a) * 24,
            this.y + Math.sin(a) * 24,
            this.type,
            this.maxHp / Math.max(1, this.type.hp),
            (game.enemyDmgMult || 1) * 0.6
          );
          clone.isClone = true;
          clone.hp = Math.max(8, this.type.hp * 0.4);
          clone.maxHp = clone.hp;
          clone.color = "#e0b0ff";
          game.enemies.push(clone);
        }
        game.createParticles(this.x, this.y, "#cc88ff", 12);
      }
    }
    if (this.ranged && this.type.keepDistance) {
      const keep = this.type.keepDistance;
      const dir = d > keep + 30 ? 1 : d < keep - 30 ? -1 : 0;
      vx = tx * this.speed * dir * slowMult;
      vy = ty * this.speed * dir * slowMult;
      this.fireTimer -= dt;
      if (this.fireTimer <= 0 && d < this.type.firingRange) {
        const duration = this.type.shotWindup || 0.65;
        this.rangedAim = {
          x: this.x,
          y: this.y,
          angle: Math.atan2(dy, dx),
          length: Math.min(this.type.firingRange, d + 48),
          duration,
          remaining: duration
        };
        this.fireTimer = this.type.fireCooldown || 2;
        return;
      }
    } else if (this.dasher) {
      this.dashTimer -= dt;
      if (this.dashActive > 0) {
        this.dashActive -= dt;
        vx = Math.cos(this.dashAngle) * (this.type.dashSpeed || 300) * slowMult;
        vy = Math.sin(this.dashAngle) * (this.type.dashSpeed || 300) * slowMult;
      } else if (this.dashTimer <= 0) {
        this.dashAngle = Math.atan2(dy, dx);
        this.dashActive = this.type.dashDuration || 0.5;
        this.dashTimer = this.type.dashInterval || 3.5;
      } else {
        vx = tx * this.speed * slowMult;
        vy = ty * this.speed * slowMult;
      }
    } else {
      vx = tx * this.speed * slowMult;
      vy = ty * this.speed * slowMult;
    }
    this.x += vx * dt;
    this.y += vy * dt;
    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.boss) {
      this.abilityTimer -= dt;
      if (this.abilityTimer <= 0) {
        this.abilityTimer = this.type.abilityInterval || (this.ability === "summon" ? 6 : 4.5);
        game.onBossAbility?.(this);
      }
    }
  }
  takeDamage(damage) {
    let dmg = damage;
    if (this.shielded && this.shieldHp > 0) {
      const reduction = this.type.damageReduction ?? 0.5;
      dmg = damage * (1 - reduction);
      this.shieldHp -= damage * reduction;
      if (this.shieldHp <= 0) {
        this.shieldHp = 0;
        this.shielded = false;
      }
    }
    this.hp -= dmg;
    this.flashTimer = 0.08;
  }
  render(ctx) {
    ctx.save();
    if (this.slowTimer > 0) {
      ctx.fillStyle = "#88ccff";
    } else if (this.bomber && this.fuseArmed) {
      ctx.fillStyle = "#d95c48";
    } else {
      ctx.fillStyle = this.color;
    }
    const px = Math.max(4, Math.round(this.size / 5));
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    ctx.fillRect(x - px * 4, y - px * 4, px * 8, px * 8);
    ctx.fillRect(x - px * 5, y - px * 2, px * 10, px * 4);
    ctx.fillStyle = "rgba(255,255,255,0.24)";
    ctx.fillRect(x - px * 2, y - px * 2, px, px);
    ctx.fillRect(x + px, y - px * 2, px, px);
    ctx.fillStyle = "#171015";
    ctx.fillRect(x - px, y + px, px * 2, px);
    if (this.flashTimer > 0) {
      ctx.strokeStyle = "rgba(255, 226, 170, 0.82)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.hitRadius + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (this.bomber && this.fuseArmed) {
      const fuseRatio = Math.max(0, Math.min(1, this.fuseTimer / (this.type.fuseTime || 1)));
      ctx.strokeStyle = "#ff9a72";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(
        this.x,
        this.y,
        this.hitRadius + 7,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * fuseRatio
      );
      ctx.stroke();
    }
    if (this.shielded && this.shieldHp > 0) {
      ctx.strokeStyle = "rgba(160,200,255,0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    const pct = Math.max(0, this.hp / this.maxHp);
    const w = this.boss ? 80 : 30;
    ctx.fillStyle = "#222";
    ctx.fillRect(this.x - w / 2, this.y - this.size - 10, w, 4);
    ctx.fillStyle = pct > 0.5 ? "#44ff44" : pct > 0.25 ? "#ffaa33" : "#ff4444";
    ctx.fillRect(this.x - w / 2, this.y - this.size - 10, w * pct, 4);
    if (this.boss) {
      if (this.type?.iceQueen) {
        ctx.strokeStyle = "rgba(170,220,255,0.85)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "rgba(220,240,255,0.45)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 10, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeStyle = "#ff33aa";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
};
var EnemyProjectile = class {
  constructor(x, y, angle, speed, damage, skin = null, source = null) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.damage = damage;
    this.life = 3;
    this.skin = skin;
    this.source = source || { kind: "projectile", label: skin?.name || "\u654C\u65B9\u98DE\u5F39" };
    this.size = ["skull", "comet", "mask"].includes(skin?.projectileStyle) ? 10 : 6;
    this.shouldRemove = false;
  }
  update(dt, game) {
    const oldX = this.x, oldY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    const wall = game.worldMap?.projectileHit?.(oldX, oldY, this.x, this.y, this.size);
    if (wall) {
      this.x = wall.x;
      this.y = wall.y;
      this.shouldRemove = true;
      return;
    }
    if (this.life <= 0) {
      this.shouldRemove = true;
      return;
    }
    const p = game.player;
    const d = Math.hypot(this.x - p.x, this.y - p.y);
    if (d < p.size + this.size) {
      if (!p.invincible) {
        p.takeDamage(
          this.damage,
          game,
          this.source || { kind: "projectile", label: "\u654C\u65B9\u98DE\u5F39" }
        );
        game.createFloatingText(Math.round(this.damage), p.x, p.y - 30, "#ff6644");
      }
      this.shouldRemove = true;
    }
  }
  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.atan2(this.vy, this.vx));
    const style = this.skin?.projectileStyle || "orb";
    const color = this.skin?.projectileColor || "#ff44aa";
    ctx.fillStyle = color;
    if (style === "paper") {
      ctx.fillRect(-10, -5, 20, 10);
      ctx.fillStyle = "#9e2e39";
      ctx.fillRect(-3, -3, 2, 6);
      ctx.fillRect(2, -2, 5, 2);
    } else if (style === "blade" || style === "ice") {
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-7, -5);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-7, 5);
      ctx.closePath();
      ctx.fill();
    } else if (style === "star" || style === "comet") {
      ctx.fillRect(-this.size * 2, -2, this.size * 2, 4);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.62)";
      ctx.fillRect(-2, -2, 4, 4);
    }
    ctx.restore();
  }
};
var Projectile = class _Projectile {
  constructor(x, y, angle, def, damage, level, player) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.angle = angle;
    this.def = def;
    this.damage = damage;
    this.level = level;
    this.size = 8;
    this.speed = def.speed || 300;
    this.piercing = !!def.piercing;
    this.homing = !!def.homing;
    this.arc = !!def.arc;
    this.boomerang = !!def.boomerang;
    this.explode = !!def.explode;
    this.explodeRadius = def.explodeRadius || 60;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.life = 4;
    this.hitEnemies = /* @__PURE__ */ new Set();
    this.shouldRemove = false;
    this.travelDist = 0;
    this.maxDist = (def.baseRange || 300) * (player ? player.getAreaMult() : 1);
    this.id = def.id;
    this.retargetsRemaining = 0;
    this.fusionFieldOwner = null;
    this.splitOnHit = false;
    this.conductive = false;
    this.returnStrike = false;
    this.returning = false;
  }
  onFusionHit(enemy, game) {
    if (this.conductive) conductHit(enemy, this.damage, game);
    if (this.splitOnHit) {
      this.splitOnHit = false;
      for (const side of [-1, 1]) {
        if (game.projectiles.length >= 240) break;
        const shard = new _Projectile(
          this.x,
          this.y,
          this.angle + side * Math.PI / 2,
          this.def,
          this.damage * 0.45,
          this.level,
          game.player
        );
        shard.maxDist = 180;
        shard.life = 1;
        shard.hitEnemies.add(enemy);
        game.projectiles.push(shard);
      }
    }
    if (this.fusionFieldOwner)
      this.fusionFieldOwner.fusionFields.add(
        enemy.x,
        enemy.y,
        55,
        this.damage * 0.2,
        "thunder"
      );
    if (this.retargetsRemaining <= 0) return false;
    const candidates = game.spatial?.queryRect?.(this.x, this.y, 240) || game.enemies;
    let target = null, nearest = 240;
    for (const other of candidates) {
      if (other === enemy || other.hp <= 0 || this.hitEnemies.has(other)) continue;
      const distance = Math.hypot(other.x - this.x, other.y - this.y);
      if (distance < nearest) {
        nearest = distance;
        target = other;
      }
    }
    if (!target) return false;
    this.retargetsRemaining--;
    this.damage *= 0.75;
    this.angle = Math.atan2(target.y - this.y, target.x - this.x);
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.maxDist = Math.max(this.maxDist, this.travelDist + 240);
    return true;
  }
  update(dt, game) {
    if (this.homing && this.hitEnemies.size === 0) {
      const target = game.spatial.findNearestEnemy(this.x, this.y, 9999);
      if (target) {
        const ta = Math.atan2(target.y - this.y, target.x - this.x);
        let diff = ta - this.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.angle += diff * Math.min(1, 6 * dt);
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
      }
    }
    if (this.arc) {
      this.vy += 420 * dt;
    }
    if (this.boomerang) {
      const d = Math.hypot(this.x - this.startX, this.y - this.startY);
      if (!this.returning && d > this.maxDist * 0.5) {
        this.returning = true;
        if (this.returnStrike) {
          this.hitEnemies.clear();
          this.damage *= 1.25;
        }
      }
      if (this.returning) {
        const ra = Math.atan2(game.player.y - this.y, game.player.x - this.x);
        this.angle = ra;
        this.vx = Math.cos(ra) * this.speed;
        this.vy = Math.sin(ra) * this.speed;
      }
    }
    const oldX = this.x, oldY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const blockedByBuildings = this.id === "knife";
    const wall = blockedByBuildings && game.worldMap?.projectileHit?.(oldX, oldY, this.x, this.y, this.size);
    if (wall) {
      this.x = wall.x;
      this.y = wall.y;
      this._onEnd(game);
      this.shouldRemove = true;
      return;
    }
    this.travelDist += Math.hypot(this.vx, this.vy) * dt;
    this.life -= dt;
    if (this.travelDist > this.maxDist || this.life <= 0) {
      this._onEnd(game);
      this.shouldRemove = true;
    }
    if (this.boomerang) {
      const dp = Math.hypot(this.x - game.player.x, this.y - game.player.y);
      if (dp < 24 && this.travelDist > 60) {
        this._onEnd(game);
        this.shouldRemove = true;
      }
    }
  }
  _onEnd(game) {
    if (this.explode) {
      game.audio.explosion();
      const cands = game?.spatial ? game.spatial.queryRect(this.x, this.y, this.explodeRadius) : game.enemies;
      for (const enemy of cands) {
        const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
        if (d < this.explodeRadius + enemyHitRadius(enemy))
          enemy.takeDamage(this.damage * 0.6);
      }
      game.createParticles(this.x, this.y, "#ff8800", 20);
      game.shake(0.15);
    }
  }
  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    switch (this.id) {
      case "knife":
        ctx.fillStyle = "#dfe8e9";
        ctx.fillRect(-13, -2, 22, 4);
        ctx.fillStyle = "#7f9da2";
        ctx.fillRect(7, -5, 4, 10);
        ctx.fillStyle = "#9c6f3d";
        ctx.fillRect(11, -2, 7, 4);
        ctx.fillStyle = "#f7f0cf";
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(-10, -5);
        ctx.lineTo(-10, 5);
        ctx.closePath();
        ctx.fill();
        break;
      case "magic_wand":
        ctx.fillStyle = "#e8d7a6";
        ctx.fillRect(-13, -7, 26, 14);
        ctx.fillStyle = "#a33245";
        ctx.fillRect(-8, -4, 3, 8);
        ctx.fillRect(-2, -5, 3, 10);
        ctx.fillRect(4, -3, 6, 2);
        ctx.strokeStyle = "#d36ba1";
        ctx.lineWidth = 2;
        ctx.strokeRect(-13, -7, 26, 14);
        break;
      case "boomerang":
        ctx.strokeStyle = "#c8ded7";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(-5, 0, 12, -1.15, 1.15);
        ctx.stroke();
        ctx.strokeStyle = "#5c8b83";
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
      case "retro_blaster":
        ctx.fillStyle = "#7ee7db";
        ctx.fillRect(-16, -3, 30, 6);
        ctx.fillStyle = "#f4d26d";
        ctx.fillRect(-18, -1, 8, 2);
        break;
      case "axe":
        ctx.fillStyle = "#b0b5b8";
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#555";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case "cross":
        ctx.fillStyle = "#fff3a0";
        ctx.fillRect(-10, -3, 20, 6);
        ctx.fillRect(-3, -10, 6, 20);
        break;
      case "fire_wand":
        ctx.fillStyle = "#ff6600";
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffcc00";
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      default:
        ctx.fillStyle = "#e8dcc0";
        ctx.fillRect(-7, -3, 14, 6);
    }
    ctx.restore();
  }
};
var OrbitShard = class {
  constructor(weapon, index, total, radius, damage) {
    this.weapon = weapon;
    this.index = index;
    this.total = total;
    this.radius = radius;
    this.damage = damage;
    this.angle = index / total * Math.PI * 2;
    this.hitTimers = /* @__PURE__ */ new Map();
    this.x = 0;
    this.y = 0;
  }
  update(dt, player, game) {
    this.angle += dt * 2.4 * (this.direction || 1);
    this.x = player.x + Math.cos(this.angle) * this.radius;
    this.y = player.y + Math.sin(this.angle) * this.radius;
    if (this.guarding && this.weapon.guardCooldown <= 0) {
      for (const shot of game.enemyProjectiles || []) {
        if (shot.shouldRemove || Math.hypot(shot.x - this.x, shot.y - this.y) > 10 + shot.size)
          continue;
        shot.shouldRemove = true;
        this.weapon.guardCooldown = 0.35;
        break;
      }
    }
    for (const [enemy, t] of this.hitTimers) {
      const nt = t - dt;
      if (nt <= 0) this.hitTimers.delete(enemy);
      else this.hitTimers.set(enemy, nt);
    }
    const SHARD_HIT = 10;
    const queryR = SHARD_HIT + 80;
    for (const e of game.spatial.queryRect(this.x, this.y, queryR)) {
      if (e.hp <= 0 || this.hitTimers.has(e)) continue;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d < enemyHitRadius(e) + SHARD_HIT) {
        e.takeDamage(this.damage);
        this.hitTimers.set(e, 0.5);
        game.createFloatingText(Math.round(this.damage), e.x, e.y - 18, "#ffffcc");
      }
    }
  }
  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle + Math.PI / 2);
    ctx.fillStyle = this.direction === -1 ? "#b4dced" : "#fff1a8";
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(-3, -5);
    ctx.lineTo(-2, 4);
    ctx.lineTo(2, 4);
    ctx.lineTo(3, -5);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-6, 3, 12, 2);
    ctx.fillRect(-1, 5, 2, 4);
    ctx.restore();
  }
};
var Mine = class _Mine {
  constructor(x, y, radius, damage, fuse, element = null) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.damage = damage;
    this.fuse = fuse;
    this.element = element;
    this.maxFuse = fuse;
    this.relay = false;
    this.relayTriggered = false;
    this.shouldRemove = false;
  }
  update(dt, game) {
    if (this.shouldRemove) return;
    this.fuse -= dt;
    if (this.fuse <= 0) {
      this.shouldRemove = true;
      if (this.relay)
        for (const other of game.mines || []) {
          if (other === this || other.shouldRemove || !other.relay || other.relayTriggered || other.fuse <= 0.45)
            continue;
          if (Math.hypot(other.x - this.x, other.y - this.y) > this.radius + other.radius)
            continue;
          other.fuse = 0.45;
          other.relayTriggered = true;
          other.damage *= 1.25;
        }
      const cands = game?.spatial ? game.spatial.queryRect(this.x, this.y, this.radius) : game.enemies;
      for (const enemy of cands) {
        const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
        if (d < this.radius + enemyHitRadius(enemy)) {
          enemy.takeDamage(this.damage);
          game?.reactions?.applyHit?.(enemy, this.element, this.damage);
          game.createFloatingText(
            Math.round(this.damage),
            enemy.x,
            enemy.y - 20,
            "#ff9944"
          );
        }
      }
      game.createParticles(this.x, this.y, "#ff8833", 20);
      if (this.element === "fire") {
        const x = this.x;
        const y = this.y;
        const radius = this.radius * 0.82;
        const tickDamage = this.damage * 0.28;
        const owner = game.player?.weapons?.find((weapon) => weapon.id === "mine");
        if (owner?.fusionFields)
          owner.fusionFields.add(x, y, radius, tickDamage, "fire", 1.5);
        else {
          game.combatVisuals?.firePatch?.(x, y, radius, 1.45);
          for (const delay of [0.35, 0.7, 1.05]) {
            game.effects?.schedule?.(delay, () => {
              const targets = game.spatial?.queryRect?.(x, y, radius) || game.enemies;
              for (const enemy of targets) {
                if (Math.hypot(enemy.x - x, enemy.y - y) > radius + enemyHitRadius(enemy))
                  continue;
                enemy.takeDamage(tickDamage);
                game.reactions?.applyHit?.(enemy, "fire", tickDamage);
              }
            });
          }
        }
      }
      game.shake(0.25);
      game.audio?.explosion?.();
      this.shouldRemove = true;
    }
  }
  snapshot() {
    return {
      x: this.x,
      y: this.y,
      radius: this.radius,
      damage: this.damage,
      fuse: this.fuse,
      maxFuse: this.maxFuse,
      element: this.element,
      relay: this.relay,
      relayTriggered: this.relayTriggered
    };
  }
  static restore(value) {
    if (!value || !["x", "y", "radius", "damage", "fuse", "maxFuse"].every(
      (key) => Number.isFinite(value[key])
    ) || value.radius <= 0 || value.radius > 1e3 || value.damage < 0 || value.fuse <= 0 || value.fuse > 10 || value.maxFuse <= 0 || value.maxFuse > 10)
      return null;
    const mine = new _Mine(
      value.x,
      value.y,
      value.radius,
      value.damage,
      value.fuse,
      value.element === "fire" ? "fire" : null
    );
    mine.maxFuse = value.maxFuse;
    mine.relay = value.relay === true;
    mine.relayTriggered = value.relayTriggered === true;
    return mine;
  }
  render(ctx) {
    const armed = this.fuse < this.maxFuse * 0.5;
    const fuseRatio = Math.max(0, Math.min(1, this.fuse / this.maxFuse));
    ctx.save();
    ctx.fillStyle = armed ? "rgba(255,80,80,0.38)" : "rgba(180,74,74,0.25)";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = armed ? "#ffad86" : "#c47769";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      this.x,
      this.y,
      this.radius + 3,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * fuseRatio
    );
    ctx.stroke();
    ctx.fillStyle = armed ? "#ff4444" : "#aa4444";
    ctx.beginPath();
    ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
};
var ExpOrb = class {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.size = 4 + Math.log(value + 1) * 1.5;
    this.shouldRemove = false;
    this.magnetSpeed = 0;
    this.life = CONFIG.EXP_ORB_LIFETIME;
  }
  update(dt, game) {
    this.life -= dt;
    if (this.life <= 0) {
      this.shouldRemove = true;
      return;
    }
    const p = game.player;
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    const d = Math.hypot(dx, dy);
    const mag = p.getMagnetRange();
    if (d < CONFIG.PICKUP_DISTANCE) {
      p.gainExp(this.value);
      game.createFloatingText(`+${this.value}XP`, p.x, p.y - 40, "#66bbff");
      game.audio.pickup();
      if (game.run) game.run.orbsCollected = (game.run.orbsCollected || 0) + 1;
      this.shouldRemove = true;
      return;
    }
    if (d < mag) {
      this.magnetSpeed = Math.min(this.magnetSpeed + 600 * dt, 560);
      this.x += dx / d * this.magnetSpeed * dt;
      this.y += dy / d * this.magnetSpeed * dt;
    }
  }
  render(ctx) {
    const a = this.life < 2 ? Math.max(0, this.life / 2) : 1;
    ctx.save();
    ctx.globalAlpha = a;
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2.2);
    g.addColorStop(0, "rgba(100,180,255,0.55)");
    g.addColorStop(1, "rgba(100,180,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7ab8ff";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
};
function findEnemyDef(id) {
  for (const def of Object.values(ENEMIES)) {
    if (def.id === id) return def;
  }
  return null;
}

// prototype-2d-pixel/src/weapons.js
var Weapon = class {
  constructor(def) {
    this.def = def;
    this.id = def.id;
    this.name = def.name;
    this.icon = def.icon;
    this.level = 1;
    this.cooldown = 0;
    this._shards = null;
    this.fusion = null;
    this.fusionFields = new FusionFields();
    this.guardCooldown = 0;
    this.presentationHold = 0;
  }
  levelUp() {
    this.level++;
  }
  isEvolved() {
    return !!this.def.evolveLevel && this.level >= this.def.evolveLevel;
  }
  update(dt, player, game) {
    this.presentationHold = Math.max(0, this.presentationHold - dt);
    this.fusionFields.update(dt, game, this.id);
    this.guardCooldown = Math.max(0, this.guardCooldown - dt);
    if (this.def.type === "orbit") {
      const activating = !this._shards;
      this._ensureShards(player);
      if (activating) this._showCast(player, game);
      for (const s of this._shards) s.update(dt, player, game);
      return;
    }
    this.cooldown -= dt;
    if (this.cooldown <= 0) {
      const fired = this.fire(player, game);
      this.cooldown = fired === false ? 0 : this.getCooldown(player);
    }
  }
  getDamage(player) {
    let base = this.def.baseDamage * (1 + (this.level - 1) * 0.2) * player.getDamageMult();
    if (this.isEvolved() && this.def.evolveDamageMult) {
      base *= this.def.evolveDamageMult;
    }
    base *= this.fusion?.damageMult ?? 1;
    if (hasFusion(this, "black_tortoise_breath")) base += (player.getArmor?.() || 0) * 0.25;
    if (hasFusion(this, "taotie_ward_body"))
      base += player.maxHp * 8e-3 + (player.getArmor?.() || 0) * 0.3;
    return base;
  }
  _rollCrit(player, game, baseDamage, x, y, color) {
    let chance = player.getCritChance();
    if (this.isEvolved() && this.def.evolveBonusCrit) {
      chance += this.def.evolveBonusCrit;
    }
    if (chance > 0 && Math.random() < chance) {
      const dmg = baseDamage * 2;
      game.createFloatingText(Math.round(dmg), x, y, "#ffee44", { crit: true });
      return dmg;
    }
    game.createFloatingText(Math.round(baseDamage), x, y, color);
    return baseDamage;
  }
  getCooldown(player) {
    let cd = this.def.baseCooldown * Math.pow(0.92, this.level - 1) * player.getCooldownMult();
    if (this.isEvolved() && this.def.evolveCooldownMult) {
      cd *= this.def.evolveCooldownMult;
    }
    cd *= this.fusion?.cooldownMult ?? 1;
    return cd;
  }
  getRange(player) {
    return this.def.baseRange * (1 + (this.level - 1) * 0.1) * player.getAreaMult() * (this.fusion?.rangeMult ?? 1);
  }
  getOrbitShardCount(player) {
    let n = this.def.projectileCount + Math.floor((this.level - 1) / 2) + (player.runModifiers?.projectileBonus || 0);
    if (this.isEvolved()) n = n * 2;
    const extra = Math.floor((player.passives?.cooldown?.count || 0) / 2);
    return Math.min(12, n + extra + (this.fusion?.projectileBonus || 0));
  }
  _ensureShards(player) {
    const count = this.getOrbitShardCount(player);
    const radius = this.getRange(player);
    const dual = hasFusion(this, "twin_guard_halo");
    const dmg = this.getDamage(player);
    if (!this._shards || this._shards.length !== count) {
      this._shards = [];
      for (let i = 0; i < count; i++) {
        this._shards.push(new OrbitShard(this, i, count, radius, dmg));
      }
    } else {
      for (const s of this._shards) {
        s.radius = radius;
        s.damage = dmg;
        s.total = count;
      }
    }
    for (const shard of this._shards) {
      shard.direction = dual && shard.index % 2 ? -1 : 1;
      shard.radius = dual && shard.index % 2 ? radius * 0.58 : radius;
      shard.guarding = dual;
    }
  }
  renderExtras(ctx) {
    if (this.def.type === "orbit" && this._shards) {
      for (const s of this._shards) s.render(ctx);
    }
  }
  fire(player, game) {
    switch (this.def.type) {
      case "melee":
        return this._fireMelee(player, game);
      case "projectile":
        return this._fireProjectile(player, game);
      case "instant":
        return this._fireInstant(player, game);
      case "aura":
        return this._fireAura(player, game);
      case "mine":
        return this._fireMine(player, game);
      case "nova":
        return this._fireNova(player, game);
      case "drain":
        return this._fireDrain(player, game);
    }
  }
  _showCast(player, game, angle, sustained = false) {
    const alreadyChanneling = sustained && this.presentationHold > 0;
    if (sustained) this.presentationHold = Math.max(0.75, this.getCooldown(player) * 1.8);
    if (alreadyChanneling) return;
    const facing = Number.isFinite(angle) ? Math.cos(angle) : player.walkFacing || 1;
    startHeroWeaponAction(player, this.id, facing, game.save?.settings?.reducedMotion || false);
  }
  _damageEnemy(enemy, damage, game) {
    enemy.takeDamage(damage);
    game?.reactions?.applyHit?.(enemy, this.def.element, damage);
    if (this.id === "lightning" && hasFusion(this, "three_pure_thunder"))
      conductHit(enemy, damage, game);
  }
  _fireMelee(player, game) {
    const range = this.getRange(player);
    const baseDmg = this.getDamage(player);
    const hit = /* @__PURE__ */ new Set();
    let drained = 0;
    const evolved = this.isEvolved();
    const candidates = game?.spatial ? game.spatial.queryRect(player.x, player.y, Math.max(range, 40) + 128) : game.enemies;
    let angle = 0;
    if (!evolved) {
      let nearest = Infinity;
      for (const enemy of candidates) {
        const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (enemy.hp > 0 && distance <= range + enemyHitRadius(enemy) && distance < nearest) {
          nearest = distance;
          angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
        }
      }
      if (nearest === Infinity && !this.fusion) return false;
    }
    const cos = Math.cos(angle), sin = Math.sin(angle);
    for (const enemy of candidates) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const hitRadius = enemyHitRadius(enemy);
      if (evolved) {
        if (Math.hypot(dx, dy) > range + hitRadius) continue;
      } else {
        const along = dx * cos + dy * sin;
        const across = -dx * sin + dy * cos;
        if (Math.hypot(
          Math.max(0, Math.abs(along) - range),
          Math.max(0, Math.abs(across) - 40)
        ) > hitRadius)
          continue;
      }
      if (enemy.hp <= 0 || hit.has(enemy)) continue;
      hit.add(enemy);
      const dmg = this._rollCrit(player, game, baseDmg, enemy.x, enemy.y - 20, "#ffaa00");
      const before = enemy.hp;
      this._damageEnemy(enemy, dmg, game);
      drained += Math.min(before, Math.max(0, before - enemy.hp));
    }
    if (hasFusion(this, "blood_moon_cycle") && drained > 0)
      player.heal?.(Math.min(player.maxHp * 0.02, drained * 0.08));
    if (evolved) {
      game.createParticles(player.x, player.y, "#ff6644", 12);
    } else {
      game.createParticles(
        player.x - cos * range / 2,
        player.y - sin * range / 2,
        "#ffaa00",
        5
      );
      game.createParticles(
        player.x + cos * range / 2,
        player.y + sin * range / 2,
        "#ffaa00",
        5
      );
    }
    game.combatVisuals?.swordSweep?.(player.x, player.y, range, {
      fused: !!this.fusion,
      fullCircle: evolved,
      angle
    });
    if (hasFusion(this, "causal_sword_domain")) {
      for (const direction of [-1, 1])
        this.fusionFields.add(
          player.x + direction * cos * range * 0.5,
          player.y + direction * sin * range * 0.5,
          44,
          baseDmg * 0.25,
          "blade"
        );
    }
    game.audio.shoot();
    this._showCast(player, game, angle);
  }
  _fireProjectile(player, game) {
    let count = this.def.projectileCount + Math.floor((this.level - 1) / 2) + (this.fusion?.projectileBonus ?? 0) + (player.runModifiers?.projectileBonus || 0);
    if (this.isEvolved() && this.id === "knife") count = Math.max(count, 5);
    if (this.isEvolved() && this.id === "magic_wand") count += 2;
    const spreadDeg = count > 1 ? this.isEvolved() ? 24 : 14 : 0;
    const target = game.spatial.findNearestEnemy(player.x, player.y, this.getRange(player));
    if (!target) return;
    const base = Math.atan2(target.y - player.y, target.x - player.x);
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * spreadDeg * Math.PI / 180;
      const projectile = new Projectile(
        player.x,
        player.y,
        base + offset,
        this.def,
        this.getDamage(player),
        this.level,
        player
      );
      projectile.maxDist = this.getRange(player);
      if (hasFusion(this, "paper_underworld_edict")) projectile.retargetsRemaining = 2;
      if (hasFusion(this, "three_wall_starfall")) projectile.fusionFieldOwner = this;
      projectile.splitOnHit = hasFusion(this, "five_prisons_array");
      if (hasFusion(this, "star_shard_bloom")) projectile.splitOnHit = true;
      projectile.conductive = hasFusion(this, "three_pure_thunder");
      projectile.returnStrike = hasFusion(this, "yin_yang_wind_cut");
      game.projectiles.push(projectile);
    }
    game.audio.shoot();
    this._showCast(player, game, base);
  }
  _fireInstant(player, game) {
    const range = this.getRange(player);
    const baseDmg = this.getDamage(player);
    const candIter = game?.spatial ? game.spatial.queryRect(player.x, player.y, range) : game.enemies;
    const targets = [];
    for (const e of candIter) {
      if (Math.hypot(e.x - player.x, e.y - player.y) < range + enemyHitRadius(e))
        targets.push(e);
    }
    if (!targets.length) return;
    const evolved = this.isEvolved();
    const strikes = evolved ? Math.min(3, targets.length) : 1;
    const picked = /* @__PURE__ */ new Set();
    const visualPoints = [{ x: player.x, y: player.y }];
    for (let i = 0; i < strikes; i++) {
      let target = null;
      while (picked.size < targets.length) {
        const cand = targets[Math.floor(Math.random() * targets.length)];
        if (!picked.has(cand)) {
          target = cand;
          picked.add(cand);
          break;
        }
      }
      if (!target) break;
      const dmg = this._rollCrit(player, game, baseDmg, target.x, target.y - 20, "#ffff66");
      this._damageEnemy(target, dmg, game);
      game.createParticles(target.x, target.y, "#ffff66", 14);
      visualPoints.push({ x: target.x, y: target.y });
      if (this.def.chain && this.level >= 3) {
        let current = target;
        const chained = /* @__PURE__ */ new Set([current]);
        const chainCount = evolved ? this.def.chainCount + 2 : this.def.chainCount;
        for (let c = 0; c < chainCount; c++) {
          let nearest = null, minD = Infinity;
          const hopCands = game?.spatial ? game.spatial.queryRect(current.x, current.y, 180) : game.enemies;
          for (const e of hopCands) {
            if (chained.has(e)) continue;
            const d = Math.hypot(e.x - current.x, e.y - current.y);
            if (d < 180 && d < minD) {
              minD = d;
              nearest = e;
            }
          }
          if (!nearest) break;
          this._damageEnemy(nearest, dmg * 0.7, game);
          game.createParticles(nearest.x, nearest.y, "#ffff66", 8);
          visualPoints.push({ x: nearest.x, y: nearest.y });
          chained.add(nearest);
          current = nearest;
        }
      }
    }
    game.combatVisuals?.lightning?.(visualPoints, { fused: !!this.fusion });
    game.audio.shoot();
    const first = visualPoints[1];
    if (first) this._showCast(player, game, Math.atan2(first.y - player.y, first.x - player.x));
  }
  _fireAura(player, game) {
    const range = this.getRange(player);
    const devour = hasFusion(this, "taotie_ward_body");
    const dmg = this.getDamage(player);
    let consumed = false;
    const candidates = game?.spatial ? game.spatial.queryRect(player.x, player.y, range) : game.enemies;
    for (const enemy of candidates) {
      const d = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (enemy.hp > 0 && d < range + enemyHitRadius(enemy)) {
        this._damageEnemy(enemy, dmg, game);
        if (enemy.hp <= 0) consumed = true;
        if (hasFusion(this, "black_tortoise_breath") && enemy.hp > 0) {
          enemy.slowPct = Math.max(
            enemy.slowTimer > 0 ? enemy.slowPct || 0 : 0,
            enemy.boss ? 0.12 : 0.4
          );
          enemy.slowTimer = Math.max(enemy.slowTimer || 0, 0.65);
        }
      }
    }
    if (devour && consumed) player.heal?.(player.maxHp * 0.01);
    game.combatVisuals?.field?.(player.x, player.y, range, this.def.element || "steam", {
      fused: !!this.fusion,
      sustained: true,
      key: `weapon-field:${this.id}`,
      duration: Math.max(0.52, this.getCooldown(player) * 1.2)
    });
    this._showCast(player, game, void 0, true);
    if (Math.random() < 0.4) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * range;
      game.createParticles(
        player.x + Math.cos(a) * r,
        player.y + Math.sin(a) * r,
        "#88ff88",
        1
      );
    }
  }
  _fireMine(player, game) {
    const radius = this.getRange(player);
    const dmg = this.getDamage(player);
    const fuse = this.def.fuse || 1.2;
    game.mines = game.mines || [];
    const previousCount = game.mines.length;
    const place = (x, y, r) => {
      if (game.mines.length >= 24) return;
      const mine = new Mine(x, y, r, dmg, fuse, this.def.element);
      mine.relay = hasFusion(this, "endless_talisman_chain");
      game.mines.push(mine);
    };
    place(player.x, player.y, radius);
    if (this.isEvolved()) {
      const a = Math.random() * Math.PI * 2;
      place(player.x + Math.cos(a) * 60, player.y + Math.sin(a) * 60, radius * 0.8);
    }
    game.audio?.shoot?.();
    if (game.mines.length > previousCount) this._showCast(player, game);
  }
  /**
   * Frost Nova: radial burst centred on the hero that damages every foe
   * within `range` and applies a timed slow. Evolved variant fires a
   * second delayed ring at 60% strength for a staggered AOE.
   */
  _fireNova(player, game) {
    const range = this.getRange(player);
    const baseDmg = this.getDamage(player);
    const slowPct = this.def.slowPct ?? 0.5;
    const slowDur = this.def.slowDuration ?? 1.2;
    const candidates = game?.spatial ? game.spatial.queryRect(player.x, player.y, range) : game.enemies;
    for (const enemy of candidates) {
      const d = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (d < range + enemyHitRadius(enemy)) {
        const dmg = this._rollCrit(player, game, baseDmg, enemy.x, enemy.y - 20, "#88ddff");
        this._damageEnemy(enemy, dmg, game);
        if (!enemy.slowTimer || enemy.slowTimer < slowDur) {
          enemy.slowTimer = slowDur;
          enemy.slowPct = slowPct;
        }
      }
    }
    game.combatVisuals?.frost?.(player.x, player.y, range, { fused: !!this.fusion });
    if (hasFusion(this, "double_moon_cold_tide"))
      for (const side of [-1, 1]) {
        this.fusionFields.add(
          player.x + side * range * 0.45,
          player.y,
          range * 0.5,
          baseDmg * 0.2,
          "frost"
        );
      }
    game.createParticles(player.x, player.y, "#aaeeff", 24);
    if (this.isEvolved()) {
      const r = range;
      const d2 = baseDmg * 0.6;
      game.effects?.schedule?.(0.4, () => {
        if (!game.player || game.player.dead) return;
        const cands = game?.spatial ? game.spatial.queryRect(player.x, player.y, r) : game.enemies;
        for (const e of cands) {
          const d = Math.hypot(e.x - player.x, e.y - player.y);
          if (d < r + enemyHitRadius(e)) this._damageEnemy(e, d2, game);
        }
        game.combatVisuals?.frost?.(player.x, player.y, r, {
          fused: !!this.fusion,
          second: true
        });
        game.createParticles(player.x, player.y, "#88ccff", 16);
      });
    }
    game.audio?.shoot?.();
    this._showCast(player, game);
  }
  /**
   * Soul Drain: short-range tether to the nearest foe. Ticks damage each
   * fire, and heals the hero for `lifestealPct × damageDealt`. Evolved
   * variant drains two foes simultaneously.
   */
  _fireDrain(player, game) {
    const range = this.getRange(player);
    const baseDmg = this.getDamage(player);
    const steal = this.def.lifestealPct ?? 0.25;
    const targetCount = (this.isEvolved() ? 2 : 1) + (hasFusion(this, "returning_soul_chain") ? 1 : 0);
    const targets = [];
    const nearby = game.enemies.filter(
      (e) => e.hp > 0 && Math.hypot(e.x - player.x, e.y - player.y) < range + enemyHitRadius(e)
    ).sort(
      (a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y)
    );
    for (let i = 0; i < targetCount && i < nearby.length; i++) targets.push(nearby[i]);
    if (!targets.length) return;
    let totalDmg = 0;
    for (const e of targets) {
      const dmg = this._rollCrit(player, game, baseDmg, e.x, e.y - 16, "#ff66aa");
      const before = e.hp;
      this._damageEnemy(e, dmg, game);
      totalDmg += Math.min(before, Math.max(0, before - e.hp));
      game.createParticles((player.x + e.x) / 2, (player.y + e.y) / 2, "#ff88cc", 2);
      game.combatVisuals?.tether?.(player.x, player.y, e.x, e.y, {
        fused: !!this.fusion
      });
    }
    game.combatVisuals?.field?.(player.x, player.y, range, "blood", {
      fused: !!this.fusion,
      sustained: true,
      key: `weapon-field:${this.id}`,
      duration: Math.max(0.52, this.getCooldown(player) * 1.2)
    });
    if (player.heal) player.heal(totalDmg * steal);
    this._showCast(
      player,
      game,
      Math.atan2(targets[0].y - player.y, targets[0].x - player.x),
      true
    );
  }
};

// prototype-2d-pixel/src/heroes.js
var HEROES = Object.freeze({
  sword: Object.freeze({
    id: "sword",
    name: "\u65AD\u56E0\u5251\u80CE",
    epithet: "\u628A\u56E0\u679C\u65A9\u6210\u4E24\u622A\u7684\u4EBA",
    role: "\u5251\u6C14\u7206\u53D1 / \u66B4\u51FB",
    glyph: "\u5203",
    spriteIndex: 0,
    portraitPosition: "0% 0%",
    skillIcon: "slash",
    startingWeapon: "whip",
    skillName: "\u8E0F\u7F61\u65A9",
    ultimateName: "\u4E07\u5251\u5F52\u589F",
    talentName: "\u5148\u65AD\u540E\u95EE",
    talentDescription: "\u89D2\u8272\u5929\u8D4B\u9875\u4E09\u9009\u4E00\uFF1B\u9ED8\u8BA4\u6240\u6709\u4F24\u5BB3 +12%\u3002",
    signatureFusion: "causal_sword_domain",
    talents: Object.freeze([
      Object.freeze({
        id: "first_cut",
        name: "\u5148\u65AD\u540E\u95EE",
        description: "\u6240\u6709\u4F24\u5BB3 +12%\uFF0C\u521D\u59CB\u5251\u6C14\u548C\u540E\u7EED\u516C\u5171\u6B66\u5668\u5747\u53D7\u76CA\u3002",
        effects: { damageMult: 1.12 }
      }),
      Object.freeze({
        id: "clear_sword_heart",
        name: "\u5251\u5FC3\u901A\u660E",
        description: "\u66B4\u51FB\u7387 +12%\uFF0C\u81EA\u52A8\u6B66\u5668\u51B7\u5374 -5%\u3002",
        effects: { critChance: 0.12, cooldownMult: 0.95 }
      }),
      Object.freeze({
        id: "blood_edge",
        name: "\u8840\u5203\u517B\u950B",
        description: "\u6700\u5927\u751F\u547D -10%\uFF0C\u6BCF\u635F\u5931\u751F\u547D\u90FD\u4F1A\u63D0\u9AD8\u4F24\u5BB3\u3002",
        effects: { maxHpMult: 0.9, missingHpDamageRatio: 0.65 }
      })
    ])
  }),
  paper: Object.freeze({
    id: "paper",
    name: "\u7EB8\u7075\u6E21\u5BA2",
    epithet: "\u66FF\u6B7B\u4EBA\u8D70\u5B8C\u6700\u540E\u4E00\u7A0B",
    role: "\u7B26\u7B93\u8FFD\u8E2A / \u9AD8\u9891\u65BD\u672F",
    glyph: "\u7B26",
    spriteIndex: 1,
    portraitPosition: "100% 0%",
    skillIcon: "seal",
    startingWeapon: "magic_wand",
    skillName: "\u6555\u7EB8\u8FFD\u9B42",
    ultimateName: "\u5343\u7B26\u6E21\u5384",
    talentName: "\u501F\u7EB8\u8FD8\u9B42",
    talentDescription: "\u89D2\u8272\u5929\u8D4B\u9875\u4E09\u9009\u4E00\uFF1B\u9ED8\u8BA4\u81EA\u52A8\u6B66\u5668\u51B7\u5374 -9%\u3002",
    signatureFusion: "paper_underworld_edict",
    talents: Object.freeze([
      Object.freeze({
        id: "borrowed_paper_soul",
        name: "\u501F\u7EB8\u8FD8\u9B42",
        description: "\u7B26\u7B93\u4E0E\u6240\u6709\u81EA\u52A8\u6B66\u5668\u51B7\u5374 -9%\u3002",
        effects: { cooldownMult: 0.91 }
      }),
      Object.freeze({
        id: "ten_thousand_talismans",
        name: "\u4E07\u7B26\u5F52\u5B97",
        description: "\u6295\u5C04\u7C7B\u6B66\u5668\u989D\u5916 +1 \u5F39\u9053\uFF0C\u4F46\u4F24\u5BB3 -8%\u3002",
        effects: { projectileBonus: 1, damageMult: 0.92 }
      }),
      Object.freeze({
        id: "paper_substitute",
        name: "\u7EB8\u66FF\u771F\u5F62",
        description: "\u6700\u5927\u751F\u547D -12%\uFF0C\u672C\u5C40\u83B7\u5F97\u4E00\u6B21\u6FD2\u6B7B\u590D\u8D77\u3002",
        effects: { maxHpMult: 0.88, reviveCharges: 1 }
      })
    ])
  }),
  devourer: Object.freeze({
    id: "devourer",
    name: "\u98DF\u715E\u7AE5\u5B50",
    epithet: "\u7B11\u7740\u541E\u4E0B\u4E0D\u8BE5\u5B58\u5728\u7684\u4E1C\u897F",
    role: "\u751F\u547D\u8F6C\u4F24 / \u62A4\u7532\u53CD\u566C",
    glyph: "\u715E",
    spriteIndex: 2,
    portraitPosition: "0% 100%",
    skillIcon: "maw",
    startingWeapon: "garlic",
    skillName: "\u541E\u715E\u56DE\u751F",
    ultimateName: "\u767E\u9B3C\u5165\u8179",
    talentName: "\u767E\u715E\u517B\u8EAB",
    talentDescription: "\u89D2\u8272\u5929\u8D4B\u9875\u4E09\u9009\u4E00\uFF1B\u9ED8\u8BA4\u751F\u547D\u8F6C\u5316\u4E3A\u4F24\u5BB3\u3002",
    signatureFusion: "taotie_ward_body",
    talents: Object.freeze([
      Object.freeze({
        id: "hundred_banes_body",
        name: "\u767E\u715E\u517B\u8EAB",
        description: "\u6700\u5927\u751F\u547D +18%\uFF1B\u989D\u5916\u751F\u547D\u4F1A\u6309\u6BD4\u4F8B\u8F6C\u5316\u4E3A\u4F24\u5BB3\u3002",
        effects: { maxHpMult: 1.18, maxHpDamageRatio: 0.7 }
      }),
      Object.freeze({
        id: "devouring_armor",
        name: "\u7384\u7532\u566C\u654C",
        description: "\u62A4\u7532 +3\uFF1B\u53D7\u51FB\u65F6\u6309\u62A4\u7532\u53CD\u566C\u9644\u8FD1\u654C\u4EBA\u3002",
        effects: { armor: 3, armorReflectRatio: 0.55 }
      }),
      Object.freeze({
        id: "hungry_breath",
        name: "\u9965\u9B42\u5410\u7EB3",
        description: "\u53D7\u5230\u4F24\u5BB3 +8%\uFF0C\u4F46\u751F\u547D\u6062\u590D\u4E0E\u5438\u53D6\u6548\u679C\u63D0\u9AD8\u3002",
        effects: { incomingDamageMult: 1.08, healingMult: 1.45 }
      })
    ])
  }),
  star: Object.freeze({
    id: "star",
    name: "\u661F\u69CE\u9057\u6C11",
    epithet: "\u4ECE\u5929\u5916\u5760\u56DE\u4EBA\u95F4\u7684\u5F02\u4E61\u5BA2",
    role: "\u661F\u68B0\u8D2F\u7A7F / \u9AD8\u901F\u6E38\u8D70",
    glyph: "\u661F",
    spriteIndex: 3,
    portraitPosition: "100% 100%",
    skillIcon: "comet",
    startingWeapon: "retro_blaster",
    skillName: "\u661F\u6B65\u6298\u8DC3",
    ultimateName: "\u4E09\u57A3\u5760\u843D",
    talentName: "\u9006\u884C\u661F\u6B65",
    talentDescription: "\u89D2\u8272\u5929\u8D4B\u9875\u4E09\u9009\u4E00\uFF1B\u9ED8\u8BA4\u79FB\u52A8\u901F\u5EA6 +12%\u3002",
    signatureFusion: "three_wall_starfall",
    talents: Object.freeze([
      Object.freeze({
        id: "retrograde_step",
        name: "\u9006\u884C\u661F\u6B65",
        description: "\u79FB\u52A8\u901F\u5EA6 +12%\uFF0C\u661F\u68B0\u4FDD\u6301\u5B89\u5168\u5C04\u8DDD\u3002",
        effects: { speedMult: 1.12 }
      }),
      Object.freeze({
        id: "orbit_overload",
        name: "\u661F\u8F68\u8FC7\u8F7D",
        description: "\u989D\u5916\u79FB\u901F\u4F1A\u8F6C\u5316\u4E3A\u4F24\u5BB3\uFF0C\u4F46\u53D7\u5230\u4F24\u5BB3 +8%\u3002",
        effects: { speedMult: 1.08, speedDamageRatio: 0.8, incomingDamageMult: 1.08 }
      }),
      Object.freeze({
        id: "stellar_domain",
        name: "\u661F\u8680\u6CD5\u57DF",
        description: "\u6B66\u5668\u8303\u56F4 +18%\uFF0C\u51B7\u5374 -6%\u3002",
        effects: { areaMult: 1.18, cooldownMult: 0.94 }
      })
    ])
  })
});
var DEFAULT_HERO_ID = "sword";
function getHero(id) {
  return HEROES[id] || HEROES[DEFAULT_HERO_ID];
}
function getHeroTalent(hero, talentId) {
  const source = hero || HEROES[DEFAULT_HERO_ID];
  return source.talents.find((talent) => talent.id === talentId) || source.talents[0];
}
function applyHeroTalent(player, hero, talentId) {
  if (!player || !hero) return;
  const talent = getHeroTalent(hero, talentId);
  player.heroId = hero.id;
  player.heroGlyph = hero.glyph;
  player.heroSpriteIndex = hero.spriteIndex;
  player.heroTalentId = talent.id;
  for (const [key, value] of Object.entries(talent.effects || {})) {
    if (["armor", "critChance", "reviveCharges", "projectileBonus"].includes(key)) {
      player.runModifiers[key] = (player.runModifiers[key] || 0) + value;
    } else {
      player.runModifiers[key] = value;
    }
  }
  player.recalculateStats?.();
  player.hp = player.maxHp;
  return talent;
}

// prototype-2d-pixel/src/spatial-hash.js
var SpatialHash = class {
  /**
   * @param {number} cell - cell edge length in world units (px). 64 is a
   *     good default for this game: matches the biggest non-boss enemy
   *     bounding box so most queries hit a single cell.
   */
  constructor(cell = 64) {
    this.cell = cell;
    this.map = /* @__PURE__ */ new Map();
    this._size = 0;
    this._occupiedBuckets = [];
    this._sortedBuckets = null;
  }
  /** Empty the index and invalidate the lazily sorted occupied-cell view. */
  clear() {
    this.map.clear();
    this._size = 0;
    this._occupiedBuckets.length = 0;
    this._sortedBuckets = null;
  }
  get size() {
    return this._size;
  }
  _key(x, y) {
    return `${Math.floor(x / this.cell)},${Math.floor(y / this.cell)}`;
  }
  /**
   * Insert a single item. The caller owns the item reference; the hash just
   * indexes it for fast neighbour lookup. Items are NOT de-duplicated.
   */
  insert(item) {
    const k = this._key(item.x, item.y);
    let bucket = this.map.get(k);
    if (!bucket) {
      bucket = [];
      this.map.set(k, bucket);
      this._occupiedBuckets.push({
        gx: Math.floor(item.x / this.cell),
        gy: Math.floor(item.y / this.cell),
        items: bucket
      });
      this._sortedBuckets = null;
    }
    bucket.push(item);
    this._size++;
  }
  /** Bulk-insert after a `clear()`. */
  insertAll(items) {
    this.clear();
    for (const it of items) this.insert(it);
  }
  /** @deprecated alias kept for backwards compatibility with v2.x callers. */
  insertEnemies(enemies) {
    this.insertAll(enemies);
  }
  /**
   * Iterate every item whose cell overlaps the square `(x±r, y±r)`. Results
   * may include items further than `r` from the query centre — callers must
   * do the exact distance check. The generator yields each item at most
   * once (cells don't overlap by construction).
   *
   * iter-16 perf: returns a plain array instead of a generator. V8 inlines
   * tight `for (const e of arr)` loops aggressively, and avoiding the
   * generator suspend/resume bookkeeping is measurably faster on hot
   * weapon-fire paths (Lightning's chain hops alone can call this dozens
   * of times per fire). Callers that destructure to `[...sh.queryRect()]`
   * still work because Array is iterable.
   */
  queryRect(x, y, r) {
    if (!this._size || !Number.isFinite(x) || !Number.isFinite(y) || Number.isNaN(r) || r < 0)
      return [];
    const c = this.cell;
    const x0 = Math.floor((x - r) / c);
    const x1 = Math.floor((x + r) / c);
    const y0 = Math.floor((y - r) / c);
    const y1 = Math.floor((y + r) / c);
    const out = [];
    const cellCount = (x1 - x0 + 1) * (y1 - y0 + 1);
    if (cellCount > this.map.size * 4) {
      this._sortedBuckets || (this._sortedBuckets = [...this._occupiedBuckets].sort(
        (a, b) => a.gx - b.gx || a.gy - b.gy
      ));
      for (const bucket of this._sortedBuckets) {
        if (bucket.gx < x0 || bucket.gx > x1 || bucket.gy < y0 || bucket.gy > y1) continue;
        for (const item of bucket.items) out.push(item);
      }
      return out;
    }
    for (let gx = x0; gx <= x1; gx++) {
      for (let gy = y0; gy <= y1; gy++) {
        const b = this.map.get(`${gx},${gy}`);
        if (b) {
          for (let i = 0; i < b.length; i++) out.push(b[i]);
        }
      }
    }
    return out;
  }
  /**
   * Return the single closest item within `maxRange` (Euclidean distance),
   * or `null` if no bucket is populated within the search square.
   */
  findNearest(x, y, maxRange, predicate = null) {
    let best = null;
    let bestD = maxRange;
    for (const e of this.queryRect(x, y, maxRange)) {
      if (predicate && !predicate(e)) continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }
  /** Alias used throughout `weapons.js`/`entities.js`. */
  findNearestEnemy(x, y, maxRange) {
    return this.findNearest(x, y, maxRange, isLivingTarget);
  }
  /** Count cells currently holding at least one item (for diagnostics). */
  occupiedCellCount() {
    return this.map.size;
  }
};
function isLivingTarget(item) {
  return !(item.hp <= 0);
}

// prototype-2d-pixel/src/build-system.js
var RELICS = Object.freeze({
  bone_mirror: {
    id: "bone_mirror",
    name: "\u6B8B\u7F3A\u7167\u9AA8\u955C",
    icon: "\u{1FA9E}",
    description: "\u4F24\u5BB3 +12%\uFF1B\u53EF\u53C2\u4E0E\u9AD8\u9636\u878D\u5408\u3002",
    effects: { damageMult: 1.12 }
  },
  coin_sword_tassel: {
    id: "coin_sword_tassel",
    name: "\u94DC\u94B1\u5251\u7A57",
    icon: "\u{1FA99}",
    description: "\u66B4\u51FB\u7387 +10%\u3002",
    effects: { critChance: 0.1 }
  },
  paper_heart: {
    id: "paper_heart",
    name: "\u7EB8\u624E\u5FC3\u810F",
    icon: "\u{1FAC0}",
    description: "\u672C\u5C40\u83B7\u5F97\u4E00\u6B21\u6FD2\u6B7B\u590D\u8D77\u3002",
    effects: { reviveCharges: 1 }
  },
  blind_beads: {
    id: "blind_beads",
    name: "\u95ED\u773C\u4F5B\u73E0",
    icon: "\u{1F4FF}",
    description: "\u6B66\u5668\u51B7\u5374 -10%\u3002",
    effects: { cooldownMult: 0.9 }
  },
  blank_talisman: {
    id: "blank_talisman",
    name: "\u65E0\u5B57\u9053\u7252",
    icon: "\u{1F4DC}",
    description: "\u7ECF\u9A8C\u83B7\u53D6 +12%\u3002",
    effects: { expMult: 1.12 }
  },
  outer_cord: {
    id: "outer_cord",
    name: "\u661F\u5916\u8110\u5E26",
    icon: "\u{1FAB1}",
    description: "\u6B66\u5668\u8303\u56F4 +18%\u3002",
    effects: { areaMult: 1.18 }
  },
  nuo_mask_fragment: {
    id: "nuo_mask_fragment",
    name: "\u50A9\u9762\u788E\u7247",
    icon: "\u{1F47A}",
    description: "\u62A4\u7532 +2\u3002",
    effects: { armor: 2 }
  },
  black_water_gourd: {
    id: "black_water_gourd",
    name: "\u9ED1\u6C34\u846B\u82A6",
    icon: "\u{1F3FA}",
    description: "\u62FE\u53D6\u8303\u56F4 +55%\u3002",
    effects: { magnetMult: 1.55 }
  },
  sealed_eye: {
    id: "sealed_eye",
    name: "\u5C01\u661F\u90AA\u773C",
    icon: "\u773C",
    description: "\u4F24\u5BB3 +10%\uFF0C\u6B66\u5668\u8303\u56F4 +12%\u3002",
    effects: { damageMult: 1.1, areaMult: 1.12 }
  },
  taotie_tooth: {
    id: "taotie_tooth",
    name: "\u9955\u992E\u4E73\u9F7F",
    icon: "\u9F7F",
    description: "\u6700\u5927\u751F\u547D +15%\uFF0C\u62A4\u7532 +1\u3002",
    effects: { maxHpMult: 1.15, armor: 1 }
  },
  broken_compass: {
    id: "broken_compass",
    name: "\u5931\u65B9\u7F57\u76D8",
    icon: "\u76D8",
    description: "\u79FB\u52A8\u901F\u5EA6 +10%\uFF0C\u62FE\u53D6\u8303\u56F4 +25%\u3002",
    effects: { speedMult: 1.1, magnetMult: 1.25 }
  },
  cold_moon_scale: {
    id: "cold_moon_scale",
    name: "\u51B7\u6708\u9006\u9CDE",
    icon: "\u9CDE",
    description: "\u6B66\u5668\u51B7\u5374 -8%\uFF0C\u62A4\u7532 +1\u3002",
    effects: { cooldownMult: 0.92, armor: 1 }
  }
});
var CURSES = Object.freeze({
  inverted_sutra: {
    id: "inverted_sutra",
    name: "\u5012\u60AC\u7ECF",
    icon: "\u{1F643}",
    description: "\u4F24\u5BB3 +28%\uFF0C\u6700\u5927\u751F\u547D -20%\u3002",
    effects: { damageMult: 1.28, maxHpMult: 0.8 }
  },
  hundred_eyes: {
    id: "hundred_eyes",
    name: "\u767E\u76EE\u6CE8\u89C6",
    icon: "\u{1F441}\uFE0F",
    description: "\u66B4\u51FB\u7387 +16%\uFF0C\u53D7\u5230\u4F24\u5BB3 +22%\u3002",
    effects: { critChance: 0.16, incomingDamageMult: 1.22 }
  },
  faceless_incense: {
    id: "faceless_incense",
    name: "\u65E0\u9762\u9999\u706B",
    icon: "\u{1F56F}\uFE0F",
    description: "\u6B66\u5668\u51B7\u5374 -16%\uFF0C\u62FE\u53D6\u8303\u56F4 -30%\u3002",
    effects: { cooldownMult: 0.84, magnetMult: 0.7 }
  },
  blood_moon_fetus: {
    id: "blood_moon_fetus",
    name: "\u8840\u6708\u80CE\u52A8",
    icon: "\u{1F318}",
    description: "\u6B66\u5668\u8303\u56F4 +32%\uFF0C\u79FB\u52A8\u901F\u5EA6 -15%\u3002",
    effects: { areaMult: 1.32, speedMult: 0.85 }
  }
});
var FUSION_RECIPES = Object.freeze([
  {
    id: "causal_sword_domain",
    heroId: "sword",
    name: "\u65AD\u56E0\u5251\u754C",
    description: "\u65AD\u56E0\u5251\u80CE\u4E13\u5C5E\uFF1A\u6325\u5251\u540E\u5728\u5DE6\u53F3\u5404\u7559\u4E0B\u4E00\u4E2A\u56FA\u5B9A\u5251\u75D5\u5708\uFF0C\u6301\u7EED 2 \u79D2\uFF0C\u6BCF 0.5 \u79D2\u9020\u6210\u8BE5\u6B21\u5251\u51FB 25% \u7684\u4F24\u5BB3\uFF1B\u654C\u4EBA\u8D70\u51FA\u8303\u56F4\u5373\u53EF\u8131\u79BB\u3002",
    requirements: [
      { kind: "weapon", id: "whip", level: 3 },
      { kind: "passive", id: "might", count: 2 }
    ],
    outputs: [{ weaponId: "whip", damageMult: 1.6, rangeMult: 1.5, projectileBonus: 1 }]
  },
  {
    id: "paper_underworld_edict",
    heroId: "paper",
    name: "\u5E7D\u90FD\u4E07\u7B26\u6555",
    description: "\u7EB8\u7075\u6E21\u5BA2\u4E13\u5C5E\uFF1A\u6BCF\u5F20\u8FFD\u9B42\u7B26\u547D\u4E2D\u540E\u53EF\u5728 240 \u8303\u56F4\u5185\u7EE7\u7EED\u8F6C\u7D22\u4E24\u540D\u5C1A\u672A\u547D\u4E2D\u7684\u654C\u4EBA\uFF1B\u6BCF\u6B21\u8F6C\u7D22\u4FDD\u7559 75% \u4F24\u5BB3\uFF0C\u65E0\u76EE\u6807\u5219\u6D88\u6563\u3002",
    requirements: [
      { kind: "weapon", id: "magic_wand", level: 3 },
      { kind: "passive", id: "cooldown", count: 2 }
    ],
    outputs: [
      { weaponId: "magic_wand", damageMult: 1.55, cooldownMult: 0.72, projectileBonus: 2 }
    ]
  },
  {
    id: "taotie_ward_body",
    heroId: "devourer",
    name: "\u9955\u992E\u62A4\u8EAB\u754C",
    description: "\u98DF\u715E\u7AE5\u5B50\u4E13\u5C5E\uFF1A\u6BCF\u6B21\u715E\u73AF\u989D\u5916\u9020\u6210\u6700\u5927\u751F\u547D \xD70.8%\uFF0B\u62A4\u7532 \xD70.3 \u7684\u4F24\u5BB3\uFF1B\u51FB\u6740\u8FD1\u654C\u56DE\u590D\u6700\u5927\u751F\u547D\u7684 1%\uFF0C\u6BCF\u6B21\u715E\u73AF\u6700\u591A\u56DE\u590D\u4E00\u6B21\u3002",
    requirements: [
      { kind: "weapon", id: "garlic", level: 3 },
      { kind: "passive", id: "max_hp", count: 2 }
    ],
    outputs: [{ weaponId: "garlic", damageMult: 1.7, rangeMult: 1.45 }]
  },
  {
    id: "blood_moon_cycle",
    name: "\u8840\u6708\u5468\u5929\xB7\u771F",
    description: "\u5251\u6C14\u547D\u4E2D\u540E\u56DE\u590D\u5B9E\u9645\u6263\u8840\u7684 8%\uFF0C\u6BCF\u6B21\u6325\u5251\u6700\u591A\u56DE\u590D\u6700\u5927\u751F\u547D\u7684 2%\uFF1B\u4E0D\u4ECE\u5C38\u4F53\u548C\u8FC7\u91CF\u4F24\u5BB3\u4E2D\u5438\u8840\uFF0C\u6CBB\u7597\u52A0\u6210\u53E6\u8BA1\u3002",
    requirements: [
      { kind: "weapon", id: "whip", level: 5 },
      { kind: "passive", id: "area", count: 2 }
    ],
    outputs: [{ weaponId: "whip", damageMult: 1.35, rangeMult: 1.4 }]
  },
  {
    id: "three_pure_thunder",
    name: "\u4E09\u6E05\u4E07\u96F7\u7B93",
    description: "\u8FFD\u9B42\u7B26\u4E0E\u5929\u96F7\u7684\u6BCF\u6B21\u76F4\u63A5\u547D\u4E2D\u5411 140 \u8303\u56F4\u5185\u6700\u8FD1\u4E24\u540D\u6D3B\u654C\u5BFC\u7535\uFF0C\u5404\u9020\u6210\u8BE5\u6B21\u57FA\u7840\u4F24\u5BB3\u7684 30%\uFF1B\u5BFC\u7535\u4E0D\u4F1A\u518D\u6B21\u9012\u5F52\u5BFC\u7535\u3002",
    requirements: [
      { kind: "weapon", id: "magic_wand", level: 5 },
      { kind: "weapon", id: "lightning", level: 5 },
      { kind: "relic", id: "bone_mirror" }
    ],
    outputs: [
      {
        weaponId: "magic_wand",
        damageMult: 1.25,
        cooldownMult: 0.78,
        projectileBonus: 2
      },
      { weaponId: "lightning", damageMult: 1.35, rangeMult: 1.2 }
    ]
  },
  {
    id: "five_prisons_array",
    name: "\u4E94\u72F1\u65AD\u4E1A\u9635",
    description: "\u65A9\u5996\u98DE\u5251 \xD7 \u7834\u715E\uFF1A\u6BCF\u628A\u4E3B\u98DE\u5251\u9996\u6B21\u547D\u4E2D\u65F6\u5411\u5DE6\u53F3\u5206\u51FA\u4E24\u628A\u77ED\u7A0B\u98DE\u5251\uFF0C\u5404\u6709\u4E3B\u5251 45% \u4F24\u5BB3\u3001180 \u5C04\u7A0B\uFF1B\u5206\u5251\u4E0D\u518D\u5206\u88C2\u3002",
    requirements: [
      { kind: "weapon", id: "knife", level: 5 },
      { kind: "passive", id: "might", count: 2 }
    ],
    outputs: [{ weaponId: "knife", damageMult: 1.32, rangeMult: 1.2, projectileBonus: 1 }]
  },
  {
    id: "twin_guard_halo",
    name: "\u4E24\u4EEA\u5B88\u85CF\u8F6E",
    description: "\u62A4\u8EAB\u5251\u8F6E \xD7 \u91D1\u949F\uFF1A\u5F62\u6210\u5916\u5708\u4E0E 58% \u534A\u5F84\u7684\u53CD\u8F6C\u5185\u5708\uFF1B\u98DE\u5251\u63A5\u89E6\u654C\u65B9\u5F39\u4E38\u53EF\u5C06\u5176\u62E6\u622A\uFF0C\u5168\u5251\u8F6E\u5171\u4EAB 0.35 \u79D2\u62E6\u622A\u95F4\u9694\uFF0C\u4E0D\u963B\u6321\u63A5\u89E6\u4F24\u5BB3\u6216\u5730\u9762\u6CD5\u672F\u3002",
    requirements: [
      { kind: "weapon", id: "orbit", level: 5 },
      { kind: "passive", id: "armor", count: 2 }
    ],
    outputs: [{ weaponId: "orbit", damageMult: 1.25, rangeMult: 1.3, projectileBonus: 2 }]
  },
  {
    id: "endless_talisman_chain",
    name: "\u65E0\u5C3D\u9547\u715E\u8FDE\u73AF",
    description: "\u9547\u90AA\u7206\u7B26 \xD7 \u6CD5\u57DF\uFF1A\u7206\u70B8\u8303\u56F4\u78B0\u5230\u9644\u8FD1\u878D\u5408\u7206\u7B26\u65F6\uFF0C\u5C06\u5176\u5F15\u7EBF\u7F29\u77ED\u81F3 0.45 \u79D2\u5E76\u589E\u52A0 25% \u4F24\u5BB3\uFF1B\u6BCF\u679A\u7B26\u53EA\u5F3A\u5316\u4E00\u6B21\uFF0C\u4E0D\u989D\u5916\u751F\u6210\u7206\u7B26\u3002\u7206\u540E\u7559\u4E0B 1.5 \u79D2\u71C3\u70E7\u533A\u3002",
    requirements: [
      { kind: "weapon", id: "mine", level: 5 },
      { kind: "passive", id: "area", count: 2 }
    ],
    outputs: [{ weaponId: "mine", damageMult: 1.3, rangeMult: 1.45, cooldownMult: 0.82 }]
  },
  {
    id: "black_tortoise_breath",
    name: "\u7384\u6B66\u541E\u715E\u606F",
    description: "\u715E\u73AF\u6BCF\u6B21\u4F24\u5BB3\u989D\u5916\u52A0\u62A4\u7532 \xD70.25\uFF0C\u5E76\u538B\u5236\u5708\u5185\u6D3B\u654C\uFF1A\u666E\u901A\u654C\u4EBA\u51CF\u901F 40%\uFF0CBoss \u51CF\u901F 12%\uFF0C\u79BB\u5F00\u540E 0.65 \u79D2\u89E3\u9664\u3002\u53EF\u4E0E\u98DF\u715E\u4E13\u5C5E\u878D\u5408\u5E76\u5B58\u3002",
    requirements: [
      { kind: "weapon", id: "garlic", level: 5 },
      { kind: "passive", id: "max_hp", count: 2 }
    ],
    outputs: [{ weaponId: "garlic", damageMult: 1.38, rangeMult: 1.35 }]
  },
  {
    id: "double_moon_cold_tide",
    name: "\u53CC\u6708\u5E7F\u5BD2\u52AB",
    description: "\u5BD2\u6F6E\u540E\u7559\u4E0B\u5DE6\u53F3\u4E24\u7247\u56FA\u5B9A\u5BD2\u57DF\uFF0C\u6301\u7EED 2 \u79D2\uFF1B\u6BCF 0.5 \u79D2\u9020\u6210\u5BD2\u6F6E\u57FA\u7840\u4F24\u5BB3\u7684 20%\uFF0C\u5E76\u51CF\u901F\u666E\u901A\u654C\u4EBA 50%\u3001Boss 15%\uFF0C\u51CF\u901F\u6301\u7EED 0.65 \u79D2\u3002",
    requirements: [
      { kind: "weapon", id: "frost_nova", level: 5 },
      { kind: "passive", id: "cooldown", count: 2 }
    ],
    outputs: [{ weaponId: "frost_nova", damageMult: 1.28, rangeMult: 1.3, cooldownMult: 0.78 }]
  },
  {
    id: "returning_soul_chain",
    name: "\u8FD8\u9B42\u53CC\u751F\u7D22",
    description: "\u566C\u9B42\u8840\u7EBF \xD7 \u5410\u7EB3\uFF1A\u5438\u8840\u4F24\u5BB3\u63D0\u5347\u5E76\u989D\u5916\u8FDE\u63A5\u4E00\u4E2A\u76EE\u6807\u3002",
    requirements: [
      { kind: "weapon", id: "soul_drain", level: 5 },
      { kind: "passive", id: "recovery", count: 2 }
    ],
    outputs: [{ weaponId: "soul_drain", damageMult: 1.32, rangeMult: 1.22, projectileBonus: 1 }]
  },
  {
    id: "yin_yang_wind_cut",
    name: "\u9634\u9633\u8E0F\u98CE\u65A9",
    description: "\u56DE\u98CE\u5203\u6298\u8FD4\u65F6\u5207\u6362\u4E3A\u8FD4\u7A0B\u65A9\uFF0C\u4F24\u5BB3\u589E\u52A0 25%\uFF0C\u53EF\u518D\u6B21\u547D\u4E2D\u53BB\u7A0B\u6253\u8FC7\u7684\u654C\u4EBA\uFF0C\u6BCF\u6BB5\u6BCF\u654C\u4E00\u6B21\uFF1B\u8FD4\u7A0B\u6301\u7EED\u671D\u4EBA\u7269\u98DE\u884C\uFF0C\u4E0D\u53CD\u590D\u6389\u5934\u3002",
    requirements: [
      { kind: "weapon", id: "boomerang", level: 5 },
      { kind: "passive", id: "movespeed", count: 2 }
    ],
    outputs: [{ weaponId: "boomerang", damageMult: 1.24, rangeMult: 1.3, projectileBonus: 1 }]
  },
  {
    id: "star_shard_bloom",
    name: "\u788E\u661F\u5206\u5149\u8BC0",
    description: "\u6240\u6709\u89D2\u8272\u53EF\u7528\uFF1A\u661F\u5F39\u9996\u6B21\u547D\u4E2D\u540E\u6A2A\u5411\u88C2\u4E3A\u4E24\u679A\u77ED\u7A0B\u661F\u7247\uFF0C\u5404\u9020\u6210 45% \u4F24\u5BB3\uFF0C\u98DE\u884C 180\uFF1B\u661F\u7247\u4E0D\u518D\u5206\u88C2\u3002\u4E0E\u661F\u6E0A\u9057\u6C11\u7684\u843D\u661F\u533A\u53EF\u4EE5\u53E0\u5408\u3002",
    requirements: [
      { kind: "weapon", id: "retro_blaster", level: 5 },
      { kind: "passive", id: "area", count: 2 }
    ],
    outputs: [{ weaponId: "retro_blaster", damageMult: 1.6, projectileBonus: 1 }]
  },
  {
    id: "three_wall_starfall",
    heroId: "star",
    name: "\u4E09\u57A3\u661F\u843D\u70AE",
    description: "\u661F\u6E0A\u9057\u6C11\u4E13\u5C5E\uFF1A\u661F\u5F39\u547D\u4E2D\u540E\u7559\u4E0B\u534A\u5F84 55 \u7684\u843D\u661F\u533A\uFF0C\u6301\u7EED 2 \u79D2\uFF0C\u6BCF 0.5 \u79D2\u9020\u6210\u661F\u5F39\u57FA\u7840\u4F24\u5BB3 20% \u7684\u96F7\u4F24\uFF1B\u540C\u4E00\u6B66\u5668\u6700\u591A\u4FDD\u7559\u516B\u5904\u3002",
    requirements: [
      { kind: "weapon", id: "retro_blaster", level: 5 },
      { kind: "passive", id: "growth", count: 2 }
    ],
    outputs: [
      { weaponId: "retro_blaster", damageMult: 1.24, cooldownMult: 0.76, projectileBonus: 1 }
    ]
  }
]);
var BASE_MODIFIERS = Object.freeze({
  damageMult: 1,
  areaMult: 1,
  cooldownMult: 1,
  speedMult: 1,
  expMult: 1,
  magnetMult: 1,
  incomingDamageMult: 1,
  maxHpMult: 1,
  armor: 0,
  critChance: 0,
  reviveCharges: 0,
  projectileBonus: 0,
  maxHpDamageRatio: 0,
  missingHpDamageRatio: 0,
  armorReflectRatio: 0,
  speedDamageRatio: 0,
  healingMult: 1
});
function freshRunModifiers() {
  return { ...BASE_MODIFIERS };
}
var RunBuildSystem = class {
  constructor(game) {
    this.game = game;
    this.reset(null);
  }
  reset(player) {
    this.relics = /* @__PURE__ */ new Set();
    this.curses = /* @__PURE__ */ new Set();
    this.fusions = /* @__PURE__ */ new Set();
    this.nextCurseAt = 180;
    if (player) {
      player.runModifiers = freshRunModifiers();
      player.recalculateStats?.();
    }
    this._syncUi();
  }
  update(gameTime, rng = Math.random) {
    if (!this.game?.player || gameTime < this.nextCurseAt) return null;
    this.nextCurseAt += 180;
    return this.getCurseChoices(3, rng);
  }
  grantRelic(id) {
    const def = RELICS[id];
    if (!def || this.relics.has(id) || this.relics.size >= CONFIG.MAX_RELICS || !this.game?.player)
      return null;
    this.relics.add(id);
    this.game?._recordDiscovery?.("relics", id);
    this._applyEffects(def.effects);
    this.checkFusions();
    this.game?._announce?.(`\u83B7\u5F97\u9057\u7269\uFF1A${def.name}`);
    this._syncUi();
    return def;
  }
  grantCurse(id) {
    const def = CURSES[id];
    if (!def || this.curses.has(id) || !this.game?.player) return null;
    this.curses.add(id);
    this.game?._recordDiscovery?.("curses", id);
    this._applyEffects(def.effects);
    this.game?._announce?.(`\u8BC5\u5492\u964D\u4E34\uFF1A${def.name}`);
    this._syncUi();
    return def;
  }
  grantRandomRelic(rng = Math.random) {
    return this._grantRandomFrom(RELICS, this.relics, (id) => this.grantRelic(id), rng);
  }
  grantRandomCurse(rng = Math.random) {
    return this._grantRandomFrom(CURSES, this.curses, (id) => this.grantCurse(id), rng);
  }
  getRelicChoices(count = 3, rng = Math.random) {
    if (this.relics.size >= CONFIG.MAX_RELICS) return [];
    return this._getChoices(RELICS, this.relics, count, rng);
  }
  getCurseChoices(count = 3, rng = Math.random) {
    return this._getChoices(CURSES, this.curses, count, rng);
  }
  checkFusions() {
    const player = this.game?.player;
    if (!player) return [];
    const unlocked = [];
    for (const recipe of FUSION_RECIPES) {
      if (this.fusions.has(recipe.id) || recipe.heroId && recipe.heroId !== player.heroId || !recipe.requirements.every((r) => this._meets(r))) {
        continue;
      }
      for (const output of recipe.outputs) {
        const weapon = player.weapons.find((w) => w.id === output.weaponId);
        if (!weapon) continue;
        weapon.fusion = mergeFusion(weapon.fusion, recipe, output);
      }
      this.fusions.add(recipe.id);
      this.game?._recordDiscovery?.("fusions", recipe.id);
      unlocked.push(recipe);
      this.game?._announce?.(`\u878D\u5408\u5B8C\u6210\uFF1A${recipe.name}`);
      if (player) {
        this.game?.combatVisuals?.fusionBurst?.(player.x, player.y, 190);
        this.game?.shake?.(0.45);
      }
    }
    if (unlocked.length) this._syncUi();
    return unlocked;
  }
  snapshot() {
    return {
      relics: Array.from(this.relics).map((id) => RELICS[id]),
      curses: Array.from(this.curses).map((id) => CURSES[id]),
      fusions: Array.from(this.fusions).map((id) => FUSION_RECIPES.find((r) => r.id === id))
    };
  }
  _meets(req) {
    const player = this.game.player;
    if (req.kind === "relic") return this.relics.has(req.id);
    if (req.kind === "weapon") {
      const weapon = player.weapons.find((w) => w.id === req.id);
      return !!weapon && weapon.level >= (req.level || 1);
    }
    if (req.kind === "passive") {
      return (player.passives?.[req.id]?.count || 0) >= (req.count || 1);
    }
    return false;
  }
  _applyEffects(effects) {
    const player = this.game.player;
    player.runModifiers || (player.runModifiers = freshRunModifiers());
    for (const [key, value] of Object.entries(effects || {})) {
      if (key === "armor" || key === "critChance" || key === "reviveCharges") {
        player.runModifiers[key] = (player.runModifiers[key] || 0) + value;
      } else {
        player.runModifiers[key] = (player.runModifiers[key] ?? 1) * value;
      }
    }
    player.recalculateStats?.();
  }
  _grantRandomFrom(catalogue2, owned, grant, rng) {
    const available = Object.keys(catalogue2).filter((id) => !owned.has(id));
    if (!available.length) return null;
    const roll = Math.min(0.999999, Math.max(0, Number(rng?.()) || 0));
    return grant(available[Math.floor(roll * available.length)]);
  }
  _getChoices(catalogue2, owned, count, rng) {
    const available = Object.keys(catalogue2).filter((id) => !owned.has(id));
    const picks = [];
    const limit = Math.max(0, Math.min(available.length, Math.floor(Number(count) || 0)));
    while (picks.length < limit) {
      const roll = Math.min(0.999999, Math.max(0, Number(rng?.()) || 0));
      const [id] = available.splice(Math.floor(roll * available.length), 1);
      picks.push(catalogue2[id]);
    }
    return picks;
  }
  _syncUi() {
    this.game?.ui?.updateBuildStatus?.(this.snapshot());
  }
};

// prototype-2d-pixel/src/talent-details.js
var TALENT_COPY = Object.freeze({
  first_cut: "\u76F4\u63A5\u5F3A\u5316\u6240\u6709\u4F24\u5BB3\uFF0C\u521D\u59CB\u5251\u6C14\u548C\u540E\u7EED\u516C\u5171\u6B66\u5668\u5747\u53D7\u76CA\u3002",
  clear_sword_heart: "\u63D0\u9AD8\u66B4\u51FB\u673A\u4F1A\uFF0C\u8BA9\u81EA\u52A8\u6B66\u5668\u66F4\u5FEB\u51FA\u624B\u3002",
  blood_edge: "\u727A\u7272\u90E8\u5206\u6700\u5927\u751F\u547D\uFF1B\u751F\u547D\u8D8A\u4F4E\uFF0C\u4F24\u5BB3\u8D8A\u9AD8\uFF0C\u6062\u590D\u751F\u547D\u540E\u589E\u4F24\u4E5F\u4F1A\u56DE\u843D\u3002",
  borrowed_paper_soul: "\u7F29\u77ED\u6240\u6709\u81EA\u52A8\u6B66\u5668\u7684\u51FA\u624B\u95F4\u9694\uFF0C\u4E0D\u7F29\u77ED\u4E3B\u52A8\u6280\u80FD\u51B7\u5374\u3002",
  ten_thousand_talismans: "\u589E\u52A0\u6295\u5C04\u7269\u548C\u73AF\u7ED5\u788E\u5203\u6570\u91CF\uFF0C\u4F46\u964D\u4F4E\u6BCF\u6B21\u4F24\u5BB3\uFF1B\u4E0D\u589E\u52A0\u8FD1\u6218\u6325\u51FB\u6B21\u6570\u3002",
  paper_substitute: "\u51CF\u5C11\u6700\u5927\u751F\u547D\uFF0C\u6362\u53D6\u4E00\u6B21\u6FD2\u6B7B\u590D\u8D77\u3002\u6D88\u8017\u540E\u4FDD\u5B58\u6216\u6362\u623F\u4E0D\u4F1A\u8865\u56DE\u3002",
  hundred_banes_body: "\u63D0\u9AD8\u6700\u5927\u751F\u547D\uFF0C\u5E76\u5C06\u8D85\u51FA\u57FA\u7840\u751F\u547D\u7684\u90E8\u5206\u8F6C\u4E3A\u4F24\u5BB3\uFF1B\u7EE7\u7EED\u5806\u751F\u547D\u53EF\u4EE5\u5F3A\u5316\u8FD9\u6761\u8DEF\u7EBF\u3002",
  devouring_armor: "\u63D0\u9AD8\u62A4\u7532\uFF1B\u5B9E\u9645\u53D7\u51FB\u540E\u53CD\u566C\u9644\u8FD1\u6D3B\u654C\uFF0C\u62A4\u7532\u8D8A\u9AD8\u53CD\u4F24\u8D8A\u5F3A\u3002\u95EA\u907F\u4E0E\u65E0\u654C\u671F\u95F4\u4E0D\u89E6\u53D1\u3002",
  hungry_breath: "\u63D0\u9AD8\u6062\u590D\u4E0E\u5438\u53D6\u6548\u679C\uFF0C\u4F46\u627F\u53D7\u66F4\u591A\u4F24\u5BB3\u3002\u6EE1\u8840\u4E0D\u4F1A\u5B58\u50A8\u989D\u5916\u6CBB\u7597\u3002",
  retrograde_step: "\u63D0\u9AD8\u79FB\u52A8\u901F\u5EA6\uFF0C\u4FBF\u4E8E\u62C9\u5F00\u8DDD\u79BB\u548C\u62FE\u53D6\u8D44\u6E90\uFF1B\u81EA\u8EAB\u4E0D\u63D0\u4F9B\u79FB\u901F\u8F6C\u4F24\u3002",
  orbit_overload: "\u5C06\u989D\u5916\u79FB\u52A8\u901F\u5EA6\u8F6C\u4E3A\u4F24\u5BB3\uFF0C\u4F46\u627F\u53D7\u66F4\u591A\u4F24\u5BB3\uFF1B\u7EE7\u7EED\u5806\u8EAB\u6CD5\u53EF\u4EE5\u5F3A\u5316\u8FD9\u6761\u8DEF\u7EBF\u3002",
  stellar_domain: "\u6269\u5927\u81EA\u52A8\u6B66\u5668\u8303\u56F4\u5E76\u7F29\u77ED\u51FA\u624B\u95F4\u9694\uFF1B\u4E3B\u52A8\u6280\u80FD\u4ECD\u4F7F\u7528\u5404\u81EA\u56FA\u5B9A\u8303\u56F4\u4E0E\u51B7\u5374\u3002"
});
function selectedTalentCard(player) {
  const hero = getHero(player.heroId);
  const talent = getHeroTalent(hero, player.heroTalentId);
  return {
    category: "\u521D\u59CB\u5929\u8D4B",
    artId: hero.id,
    artKind: "hero",
    glyph: hero.glyph,
    name: `${hero.name} \xB7 ${talent.name}`,
    level: "\u672C\u5C40\u5DF2\u9009",
    lore: hero.epithet,
    effect: TALENT_COPY[talent.id],
    attackMode: "\u672C\u5C40\u6301\u7EED\u751F\u6548\uFF1B\u8BE5\u89D2\u8272\u7684\u6240\u6709\u521D\u59CB\u5929\u8D4B\u5747\u53EF\u89E6\u53D1\u4E13\u5C5E\u878D\u5408\uFF0C\u516C\u5171\u6B66\u5668\u4E0E\u529F\u6CD5\u4E0D\u53D7\u9650\u5236\u3002",
    numbers: talent.description
  };
}
function conversionCards(player) {
  const m = player.runModifiers || {}, lines = [], details = [];
  if (m.maxHpDamageRatio) {
    lines.push("\u989D\u5916\u6700\u5927\u751F\u547D\u6B63\u5728\u8F6C\u5316\u4E3A\u4F24\u5BB3\u3002");
    details.push(
      `\u751F\u547D\u8F6C\u4F24 \xD7${player.getHealthDamageMult().toFixed(3)}\uFF1A\u6BCF\u589E\u52A0 100% \u57FA\u7840\u751F\u547D\uFF0C\u589E\u4F24 ${(m.maxHpDamageRatio * 100).toFixed(0)}%`
    );
  }
  if (m.missingHpDamageRatio) {
    lines.push("\u635F\u5931\u751F\u547D\u6B63\u5728\u8F6C\u5316\u4E3A\u4F24\u5BB3\uFF1B\u56DE\u8840\u4F1A\u964D\u4F4E\u8FD9\u4E00\u9879\u3002");
    details.push(
      `\u5931\u8840\u8F6C\u4F24 \xD7${player.getWoundedDamageMult().toFixed(3)}\uFF1A\u5F53\u524D\u635F\u5931 ${((1 - player.hp / player.maxHp) * 100).toFixed(1)}% \u751F\u547D`
    );
  }
  if (m.speedDamageRatio) {
    lines.push("\u989D\u5916\u8EAB\u6CD5\u6B63\u5728\u8F6C\u5316\u4E3A\u4F24\u5BB3\u3002");
    details.push(
      `\u8EAB\u6CD5\u8F6C\u4F24 \xD7${player.getSpeedDamageMult().toFixed(3)}\uFF1A\u4F7F\u7528\u6784\u7B51\u79FB\u901F\u500D\u7387\uFF0C\u4E0D\u8BA1\u5730\u56FE\u53CA\u77ED\u6682\u51CF\u901F`
    );
  }
  if (m.armorReflectRatio) {
    lines.push("\u62A4\u7532\u548C\u5B9E\u9645\u627F\u53D7\u7684\u4F24\u5BB3\u4F1A\u53CD\u566C\u9644\u8FD1\u654C\u4EBA\u3002");
    details.push(
      `\u53CD\u4F24 = max(1, (\u62A4\u7532 ${player.getArmor()} + \u672C\u6B21\u627F\u4F24 \xD70.25) \xD7${m.armorReflectRatio.toFixed(2)})\uFF1B\u8303\u56F4 150\uFF0C\u4EC5\u53D7\u51FB\u89E6\u53D1`
    );
  }
  if (!lines.length) return [];
  return [
    {
      category: "\u6784\u7B51\u8F6C\u5316",
      artId: player.heroId,
      artKind: "hero",
      glyph: "\u5316",
      name: "\u672C\u5C40\u5C5E\u6027\u8054\u52A8",
      level: "\u968F\u5F53\u524D\u72B6\u6001\u8BA1\u7B97",
      lore: "\u547D\u3001\u8EAB\u3001\u4F24\u90FD\u80FD\u5165\u9053\uFF0C\u4F46\u4EE3\u4EF7\u4ECE\u4E0D\u6D88\u5931\u3002",
      effect: lines.join(""),
      attackMode: "\u4F24\u5BB3\u8F6C\u5316\u6309\u5404\u9879\u500D\u7387\u76F8\u4E58\uFF1B\u53CD\u4F24\u5355\u72EC\u8BA1\u7B97\uFF0C\u4E0D\u4F1A\u4E3B\u52A8\u8FFD\u51FB\u6216\u8FDE\u9501\u53CD\u5F39\u3002",
      numbers: `${details.join("\uFF1B")}\u3002\u5F53\u524D\u603B\u4F24\u5BB3\u500D\u7387 \xD7${player.getDamageMult().toFixed(3)}\uFF08\u542B\u529F\u6CD5\u548C\u9057\u7269\uFF0C\u4E0D\u542B\u6B66\u5668\u81EA\u8EAB\u7B49\u7EA7/\u878D\u5408\u500D\u7387\uFF09\u3002`
    }
  ];
}

// prototype-2d-pixel/src/reactions.js
var REACTIONS = Object.freeze([
  {
    id: "cold_fire_shatter",
    name: "\u5BD2\u7130\u5D29\u88C2",
    icon: "\u{1F4A5}",
    artId: "frost_nova",
    description: "\u5BD2\u6C14\u5C01\u4F4F\u7684\u88C2\u75D5\u88AB\u706B\u7130\u64AC\u5F00\uFF0C\u5BF9\u540C\u4E00\u90AA\u7269\u8FFD\u52A0\u4E00\u6B21\u5D29\u88C2\u4F24\u5BB3\u3002",
    pair: ["frost", "fire"],
    effect: { bonusDamageMult: 0.65 }
  },
  {
    id: "blood_thunder_chain",
    name: "\u8840\u96F7\u8D70\u8109",
    icon: "\u{1FA78}",
    artId: "lightning",
    description: "\u8840\u6C14\u6210\u4E3A\u96F7\u7684\u5F15\u7EBF\uFF0C\u628A\u4F24\u5BB3\u4F20\u7ED9\u5468\u56F4\u5176\u4ED6\u90AA\u7269\uFF1B\u4F20\u5BFC\u4E0D\u4F1A\u518D\u6B21\u9012\u5F52\u3002",
    pair: ["blood", "thunder"],
    effect: { chainDamageMult: 0.45, chainRadius: 160, chainTargets: 3 }
  },
  {
    id: "seal_ward_bind",
    name: "\u9547\u8EAB\u5C01\u7A8D",
    icon: "\u{1F512}",
    artId: "seal",
    description: "\u7B26\u5370\u4E0E\u62A4\u8EAB\u6C14\u76F8\u5408\uFF0C\u5C01\u4F4F\u540C\u4E00\u90AA\u7269\u7684\u884C\u52A8\uFF1B\u8FD9\u662F\u51CF\u901F\uFF0C\u4E0D\u662F\u5B8C\u5168\u5B9A\u8EAB\u3002",
    pair: ["seal", "ward"],
    effect: { slowPct: 0.72, slowDuration: 1.8 }
  },
  {
    id: "blood_blade_return",
    name: "\u8840\u5203\u56DE\u751F",
    icon: "\u{1F5E1}\uFE0F",
    artId: "whip",
    description: "\u5251\u5203\u5FAA\u7740\u8840\u6C14\u8FFD\u52A0\u4F24\u5BB3\uFF0C\u5E76\u628A\u4E00\u90E8\u5206\u751F\u673A\u5E26\u56DE\u884C\u8005\u8EAB\u4E0A\u3002",
    pair: ["blood", "blade"],
    effect: { bonusDamageMult: 0.3, healMult: 0.18 }
  }
]);
var ELEMENT_NAMES = Object.freeze({
  frost: "\u5BD2",
  fire: "\u706B",
  blood: "\u8840",
  thunder: "\u96F7",
  seal: "\u7B26",
  ward: "\u62A4",
  blade: "\u5203"
});
function reactionCondition(reaction) {
  return `${reaction.pair.map((element) => ELEMENT_NAMES[element]).join(" \uFF0B ")}\uFF1A\u5148\u540E\u547D\u4E2D\u540C\u4E00\u4E2A\u4ECD\u5B58\u6D3B\u7684\u654C\u4EBA\uFF0C\u987A\u5E8F\u4E0D\u9650\uFF1B\u53CD\u5E94\u6D88\u8017\u4E24\u79CD\u5370\u8BB0\u3002`;
}
function reactionNumbers(reaction) {
  const effect = reaction.effect;
  const parts = ["\u4E24\u6B21\u5143\u7D20\u547D\u4E2D\u95F4\u9694\u9700\u5C0F\u4E8E 4 \u79D2\uFF1B\u4EE5\u89E6\u53D1\u53CD\u5E94\u90A3\u6B21\u653B\u51FB\u7684\u57FA\u7840\u4F24\u5BB3\u8BA1\u7B97"];
  if (effect.bonusDamageMult) parts.push(`\u8FFD\u52A0\u4F24\u5BB3 ${Math.round(effect.bonusDamageMult * 100)}%`);
  if (effect.chainDamageMult)
    parts.push(
      `\u5411 ${effect.chainRadius} \u50CF\u7D20\u5185\u6700\u591A ${effect.chainTargets} \u540D\u5176\u4ED6\u654C\u4EBA\u4F20\u5BFC ${Math.round(effect.chainDamageMult * 100)}% \u4F24\u5BB3`
    );
  if (effect.slowDuration)
    parts.push(`\u51CF\u901F ${Math.round(effect.slowPct * 100)}%\uFF0C\u6301\u7EED ${effect.slowDuration} \u79D2`);
  if (effect.healMult)
    parts.push(
      `\u6062\u590D ${Math.round(effect.healMult * 100)}% \u57FA\u7840\u4F24\u5BB3\u5BF9\u5E94\u751F\u547D\uFF0C\u518D\u53D7\u6CBB\u7597\u500D\u7387\u5F71\u54CD\uFF0C\u4E0D\u8D85\u8FC7\u751F\u547D\u4E0A\u9650`
    );
  return parts.join("\uFF1B");
}
var ReactionSystem = class {
  constructor(game) {
    this.game = game;
    this.tagLifetime = 4;
  }
  applyHit(enemy, element, baseDamage) {
    if (!enemy || enemy.hp <= 0 || !element) return null;
    const now = this.game?.gameTime || 0;
    enemy.reactionTags || (enemy.reactionTags = /* @__PURE__ */ new Map());
    for (const [tag, expiresAt] of enemy.reactionTags) {
      if (expiresAt <= now) enemy.reactionTags.delete(tag);
    }
    const reaction = REACTIONS.find(
      (r) => r.pair.includes(element) && r.pair.some((tag) => tag !== element && enemy.reactionTags.has(tag))
    );
    if (!reaction) {
      enemy.reactionTags.set(element, now + this.tagLifetime);
      return null;
    }
    for (const tag of reaction.pair) enemy.reactionTags.delete(tag);
    this._resolve(reaction, enemy, baseDamage);
    this.game?._recordDiscovery?.("reactions", reaction.id);
    return reaction;
  }
  _resolve(reaction, enemy, baseDamage) {
    const effect = reaction.effect;
    const bonus = Math.max(0, baseDamage * (effect.bonusDamageMult || 0));
    if (bonus) enemy.takeDamage(bonus);
    if (effect.slowDuration) {
      enemy.slowPct = Math.max(enemy.slowPct || 0, effect.slowPct || 0);
      enemy.slowTimer = Math.max(enemy.slowTimer || 0, effect.slowDuration);
    }
    if (effect.chainDamageMult) {
      const radius = effect.chainRadius || 140;
      const candidates = this.game?.spatial?.queryRect ? this.game.spatial.queryRect(enemy.x, enemy.y, radius) : this.game?.enemies || [];
      let hits = 0;
      for (const other of candidates) {
        if (other === enemy || other.hp <= 0) continue;
        if (Math.hypot(other.x - enemy.x, other.y - enemy.y) > radius) continue;
        other.takeDamage(baseDamage * effect.chainDamageMult);
        if (++hits >= (effect.chainTargets || 3)) break;
      }
    }
    if (effect.healMult) this.game?.player?.heal?.(baseDamage * effect.healMult);
    this.game?.createFloatingText?.(reaction.name, enemy.x, enemy.y - 34, "#d9a7ff");
    this.game?.effects?.pulses?.emit?.(enemy.x, enemy.y, "205,145,255");
  }
};

// prototype-2d-pixel/src/environment.js
var LANTERN_SECONDS = 120;
var EnvironmentState = class {
  constructor(snapshot) {
    this.restore(snapshot);
  }
  restore(snapshot) {
    const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
    this.warmthRemaining = Math.min(
      LANTERN_SECONDS,
      Math.max(0, finite(snapshot?.warmthRemaining))
    );
    this.coldTickAccum = Math.min(10, Math.max(0, finite(snapshot?.coldTickAccum)));
  }
  snapshot() {
    return { warmthRemaining: this.warmthRemaining, coldTickAccum: this.coldTickAccum };
  }
  lightLantern() {
    this.warmthRemaining = LANTERN_SECONDS;
    this.coldTickAccum = 0;
  }
  update(dt, interval) {
    if (!Number.isFinite(dt) || dt <= 0 || !Number.isFinite(interval) || interval <= 0)
      return { ticks: 0, expired: false };
    const before = this.warmthRemaining;
    const protectedTime = Math.min(dt, before);
    this.warmthRemaining = Math.max(0, before - dt);
    this.coldTickAccum += dt - protectedTime;
    const ticks = Math.floor((this.coldTickAccum + 1e-9) / interval);
    this.coldTickAccum = Math.max(0, this.coldTickAccum - ticks * interval);
    return { ticks, expired: before > 0 && this.warmthRemaining === 0 };
  }
};
function environmentCard(game) {
  const mods = game.stageMods;
  if (!mods?.coldTickInterval) return [];
  const remaining = game.environment?.warmthRemaining || 0;
  return [
    {
      category: "\u73AF\u5883\u72B6\u6001",
      artId: "ward_lantern",
      artKind: "relic",
      glyph: "\u706F",
      name: remaining > 0 ? "\u907F\u661F\u706F\u62A4\u6301" : "\u661F\u8680\u4FB5\u4F53",
      level: remaining > 0 ? `\u5269\u4F59 ${Math.ceil(remaining)} \u79D2` : "\u5F53\u524D\u5730\u56FE\u751F\u6548",
      lore: "\u70FD\u71E7\u5B88\u706F\u4EBA\u8BF4\uFF0C\u661F\u661F\u770B\u4E0D\u89C1\u706F\u4E0B\u7684\u4EBA\u3002\u706F\u706D\u4EE5\u540E\uFF0C\u4ED6\u4E0D\u518D\u56DE\u7B54\u95EE\u9898\u3002",
      effect: remaining > 0 ? "\u6682\u65F6\u963B\u6B62\u73AF\u5883\u4FB5\u8680\uFF1B\u4E0D\u4F1A\u62B5\u6321\u602A\u7269\u653B\u51FB\u3001\u6295\u5C04\u7269\u6216\u5730\u9762\u5371\u9669\u3002" : "\u661F\u8680\u4F1A\u7F13\u6162\u6D88\u8017\u751F\u547D\uFF0C\u4F46\u4E0D\u4F1A\u76F4\u63A5\u81F4\u6B7B\u3002\u6062\u590D\u5EFA\u7B51\u4E2D\u53EF\u9009\u62E9\u70B9\u706F\uFF0C\u6362\u53D6\u9650\u65F6\u62A4\u6301\u3002",
      attackMode: "\u8BA1\u65F6\u53EA\u5728\u6218\u6597\u8FD0\u884C\u65F6\u63A8\u8FDB\uFF1B\u6682\u505C\u3001\u4EA4\u4E92\u548C\u79BB\u7EBF\u4E0D\u6263\u65F6\u3002\u70B9\u706F\u4E0E\u559D\u6C34\u3001\u70BC\u4F53\u5171\u4EAB\u5EFA\u7B51\u7684\u4E00\u6B21\u673A\u4F1A\u3002",
      numbers: `\u4FB5\u8680\uFF1A\u6BCF ${mods.coldTickInterval} \u79D2 ${mods.coldTickDamage} \u751F\u547D\uFF0C\u6700\u4F4E\u4FDD\u7559 1\uFF1B\u70B9\u706F\u6062\u590D 20% \u6700\u5927\u751F\u547D\uFF0C\u4FDD\u62A4 ${LANTERN_SECONDS} \u79D2\u3002`
    }
  ];
}

// prototype-2d-pixel/src/economy.js
function calculateShopPrice(basePrice, { purchases = 0, gameTime = 0, owned = 0 } = {}) {
  const base = Math.max(1, Number(basePrice) || 1);
  const purchasePressure = Math.max(0, purchases) * 0.24;
  const timePressure = Math.floor(Math.max(0, gameTime) / 120) * 0.1;
  const levelPressure = Math.max(0, owned) * 0.12;
  return Math.max(1, Math.ceil(base * (1 + purchasePressure + timePressure + levelPressure)));
}
var SHOP_PURCHASE_LIMIT = 3;
function combatCoinLimit(gameTime = 0) {
  const seconds = Number.isFinite(gameTime) ? Math.max(0, gameTime) : 0;
  return 12 + Math.floor(seconds / 12);
}
function restoreCombatCoins(earned, gameTime, kills) {
  const legacy = Math.min(Math.floor(Math.max(0, kills || 0) / 3), combatCoinLimit(gameTime));
  return Number.isFinite(earned) ? Math.min(combatCoinLimit(gameTime), Math.max(0, Math.floor(earned))) : legacy;
}
function killCoinReward({ boss, kills, gameTime, earned = 0, endless = false }) {
  if (boss) return 18;
  if (kills % 3 !== 0) return 0;
  return !endless || earned < combatCoinLimit(gameTime) ? 1 : 0;
}

// prototype-2d-pixel/src/codex.js
function reactionCards(game) {
  const elements = new Set((game.player?.weapons || []).map((weapon) => weapon.def.element));
  return REACTIONS.filter(
    (reaction) => reaction.pair.every((element) => elements.has(element))
  ).map((reaction) => ({
    category: "\u5143\u7D20\u53CD\u5E94",
    artId: reaction.artId,
    artKind: "fusion",
    glyph: reaction.name.slice(0, 1),
    name: reaction.name,
    level: game.save?.collection?.reactions?.includes(reaction.id) ? "\u66FE\u89E6\u53D1 \xB7 \u672C\u6784\u7B51\u53EF\u7528" : "\u672C\u6784\u7B51\u53EF\u89E6\u53D1",
    lore: "\u4E0D\u540C\u672F\u5F0F\u5728\u90AA\u7269\u8EAB\u4E0A\u7559\u4E0B\u77ED\u6682\u5370\u8BB0\uFF0C\u76F8\u9047\u540E\u624D\u4F1A\u53D1\u751F\u53CD\u5E94\u3002",
    effect: reaction.description,
    attackMode: reactionCondition(reaction),
    numbers: reactionNumbers(reaction)
  }));
}
var WEAPON_LORE = Object.freeze({
  whip: [
    "\u5251\u80CE\u5148\u65A9\u8FD1\u8EAB\u56E0\u679C\uFF0C\u518D\u95EE\u6765\u7269\u59D3\u540D\u3002",
    "\u81EA\u52A8\u671D\u8FD1\u654C\u5B9A\u5411\uFF0C\u53CC\u5411\u5251\u6C14\u8986\u76D6\u53EF\u89C1\u957F\u6761\uFF1B\u5706\u6EE1\u540E\u6539\u4E3A\u73AF\u8EAB\u5468\u5929\u3002"
  ],
  magic_wand: [
    "\u7EB8\u7B26\u8BB0\u5F97\u6B7B\u4EBA\u6700\u540E\u770B\u89C1\u7684\u65B9\u5411\u3002",
    "\u81EA\u52A8\u8FFD\u8E2A\u6700\u8FD1\u76EE\u6807\uFF1B\u7075\u7B26\u53EF\u7A7F\u8FC7\u5EFA\u7B51\uFF0C\u4EE5\u591A\u7B26\u9F50\u53D1\u538B\u5236\u3002"
  ],
  knife: ["\u98DE\u5251\u4E0D\u8BA4\u5C71\u95E8\uFF0C\u53EA\u8BA4\u6301\u5251\u8005\u7684\u6740\u5FF5\u3002", "\u671D\u76EE\u6807\u65B9\u5411\u6295\u5C04\uFF0C\u53EF\u7A7F\u900F\u654C\u7FA4\uFF0C\u4F46\u4F1A\u88AB\u5EFA\u7B51\u5899\u4F53\u6321\u4E0B\u3002"],
  orbit: ["\u788E\u5203\u7ED5\u8EAB\uFF0C\u66FF\u4E3B\u4EBA\u5B88\u4F4F\u4E00\u53E3\u6D3B\u6C14\u3002", "\u73AF\u7ED5\u63A5\u89E6\u4F24\u5BB3\uFF0C\u6301\u7EED\u5C01\u9501\u8FD1\u8EAB\u533A\u57DF\u3002"],
  lightning: ["\u96F7\u7BC6\u501F\u4E5D\u9704\u4E4B\u540D\uFF0C\u843D\u4E0B\u7684\u5374\u672A\u5FC5\u662F\u5929\u96F7\u3002", "\u77AC\u65F6\u70B9\u6740\u5E76\u5728\u654C\u7FA4\u4E4B\u95F4\u8FDE\u9501\u3002"],
  mine: ["\u9547\u90AA\u7B26\u57CB\u5165\u571F\u4E2D\uFF0C\u7B49\u6076\u5FF5\u8E29\u4E0A\u6731\u7802\u3002", "\u5E03\u7F6E\u5EF6\u8FDF\u7206\u7B26\uFF0C\u8303\u56F4\u4F24\u5BB3\u53EF\u8D8A\u8FC7\u969C\u788D\u3002"],
  garlic: ["\u7384\u9EC4\u6C14\u4E0D\u95EE\u654C\u6211\uFF0C\u53EA\u62D2\u7EDD\u4E00\u5207\u8FD1\u8EAB\u4E4B\u7269\u3002", "\u6301\u7EED\u62A4\u4F53\u9886\u57DF\uFF0C\u5BF9\u5468\u56F4\u654C\u4EBA\u9AD8\u9891\u707C\u4F24\u3002"],
  frost_nova: ["\u5E7F\u5BD2\u65E7\u6708\u5760\u8FDB\u5C71\u6D77\uFF0C\u7559\u4E0B\u4E00\u5708\u4E0D\u5316\u7684\u971C\u3002", "\u4EE5\u81EA\u8EAB\u4E3A\u4E2D\u5FC3\u6269\u6563\u5BD2\u6F6E\u5E76\u51CF\u901F\u3002"],
  soul_drain: ["\u8840\u7EBF\u7275\u4F4F\u7684\u4E0D\u662F\u8089\u8EAB\uFF0C\u800C\u662F\u5C06\u6563\u672A\u6563\u7684\u9B42\u3002", "\u8FDE\u63A5\u6700\u8FD1\u76EE\u6807\u6301\u7EED\u6C72\u53D6\u751F\u547D\u3002"],
  boomerang: ["\u56DE\u98CE\u5203\u53BB\u65F6\u95EE\u7F6A\uFF0C\u5F52\u65F6\u7D22\u547D\u3002", "\u5F27\u7EBF\u98DE\u51FA\u5E76\u6298\u8FD4\uFF0C\u53EF\u7A7F\u8FC7\u5EFA\u7B51\u548C\u654C\u7FA4\u3002"],
  retro_blaster: ["\u661F\u5916\u6B8B\u9AB8\u4ECD\u5728\u91CD\u590D\u4E00\u573A\u65E0\u4EBA\u8BB0\u5F97\u7684\u6218\u4E89\u3002", "\u9AD8\u901F\u76F4\u7EBF\u8FDE\u5C04\uFF0C\u8D2F\u7A7F\u5E76\u5F62\u6210\u5F39\u5E55\u3002"]
});
var PASSIVE_COPY = Object.freeze({
  max_hp: ["\u53E4\u4FEE\u4EE5\u9AA8\u4F5C\u7089\uFF0C\u5148\u628A\u6D3B\u547D\u70BC\u6210\u5BB9\u5668\u3002", "\u63D0\u9AD8\u6700\u5927\u547D\u6570\uFF0C\u9002\u5408\u627F\u4F24\u4E0E\u590D\u8D77\u6D41\u3002"],
  recovery: ["\u4E00\u547C\u4E00\u5438\uFF0C\u501F\u5C71\u6D77\u6B8B\u6C14\u7F1D\u8865\u8089\u8EAB\u3002", "\u6301\u7EED\u6062\u590D\u547D\u6570\uFF0C\u589E\u5F3A\u957F\u7EBF\u5BB9\u9519\u3002"],
  armor: ["\u949F\u58F0\u4E0D\u54CD\uFF0C\u62A4\u4F53\u4E4B\u529B\u4ECD\u5728\u76AE\u9AA8\u95F4\u56DE\u8361\u3002", "\u524A\u51CF\u6BCF\u6B21\u53D7\u5230\u7684\u4F24\u5BB3\u3002"],
  movespeed: ["\u811A\u8E0F\u865A\u7F61\uFF0C\u4ECE\u5C1A\u672A\u53D1\u751F\u7684\u90A3\u4E00\u6B65\u79BB\u5F00\u3002", "\u63D0\u9AD8\u79FB\u52A8\u901F\u5EA6\u4E0E\u8D70\u4F4D\u4F59\u91CF\u3002"],
  might: ["\u6740\u610F\u51DD\u6210\u4E00\u7EBF\uFF0C\u6240\u6709\u672F\u6CD5\u90FD\u53D8\u5F97\u66F4\u6C89\u3002", "\u63D0\u9AD8\u5168\u90E8\u4F24\u5BB3\u3002"],
  area: ["\u6CD5\u57DF\u5C55\u5F00\uFF0C\u8FD1\u5904\u4E0E\u8FDC\u5904\u6682\u65F6\u5931\u53BB\u533A\u522B\u3002", "\u6269\u5927\u6B66\u5668\u4E0E\u6280\u80FD\u8986\u76D6\u8303\u56F4\u3002"],
  cooldown: ["\u6025\u5F8B\u50AC\u52A8\u5668\u9B42\uFF0C\u8BA9\u505C\u6B47\u53D8\u5F97\u66F4\u77ED\u3002", "\u7F29\u77ED\u81EA\u52A8\u6B66\u5668\u7684\u653B\u51FB\u95F4\u9694\u3002"],
  magnet: ["\u6563\u843D\u4E4B\u7269\u542C\u89C1\u65E0\u5F62\u53EC\u5524\uFF0C\u5411\u6301\u6709\u8005\u9760\u62E2\u3002", "\u6269\u5927\u7ECF\u9A8C\u4E0E\u6389\u843D\u7269\u7684\u62FE\u53D6\u8303\u56F4\u3002"],
  growth: ["\u6BCF\u4E00\u6B21\u9547\u715E\u90FD\u88AB\u5199\u8FDB\u540C\u4E00\u5377\u65E0\u5B57\u7ECF\u3002", "\u63D0\u9AD8\u7ECF\u9A8C\u83B7\u53D6\uFF0C\u4EE4\u6784\u7B51\u66F4\u5FEB\u6210\u5F62\u3002"],
  luck: ["\u547D\u6570\u7A0D\u7A0D\u504F\u5411\u6301\u6709\u8005\uFF0C\u4F46\u4ECE\u4E0D\u89E3\u91CA\u539F\u56E0\u3002", "\u63D0\u9AD8\u66B4\u51FB\u53D1\u751F\u7684\u673A\u4F1A\u3002"],
  dodge: ["\u8EAB\u5F71\u7F29\u5165\u5BF8\u5730\u4E4B\u5916\uFF0C\u8BA9\u653B\u51FB\u843D\u5728\u65E7\u4F4D\u7F6E\u3002", "\u83B7\u5F97\u95EA\u907F\u673A\u4F1A\uFF0C\u964D\u4F4E\u88AB\u8FDE\u7EED\u547D\u4E2D\u7684\u98CE\u9669\u3002"],
  magnet_plus: ["\u6444\u7269\u672F\u541E\u4E0B\u5468\u906D\u7075\u673A\uFF0C\u8FDE\u8FDC\u5904\u6B8B\u9B42\u4E5F\u4E0D\u653E\u8FC7\u3002", "\u5927\u5E45\u6269\u5927\u62FE\u53D6\u8303\u56F4\u3002"],
  damage_reduction: ["\u7384\u6B66\u4E4B\u5F71\u8986\u5728\u4F24\u53E3\u4E4B\u524D\uFF0C\u5148\u66FF\u4F60\u627F\u4E0B\u4E00\u5C42\u6076\u610F\u3002", "\u6309\u6BD4\u4F8B\u964D\u4F4E\u6700\u7EC8\u53D7\u5230\u7684\u4F24\u5BB3\u3002"],
  ink_body: ["\u4EE5\u58A8\u5165\u9AA8\uFF0C\u76AE\u8089\u6210\u4E3A\u4E00\u9875\u4E0D\u80AF\u88AB\u6495\u6BC1\u7684\u7ECF\u3002", "\u540C\u65F6\u63D0\u9AD8\u751F\u547D\u4E0A\u9650\u4E0E\u6700\u7EC8\u51CF\u4F24\u3002"],
  star_step: ["\u811A\u5370\u843D\u5728\u661F\u56FE\u7A7A\u767D\u5904\uFF0C\u654C\u4EBA\u7684\u6740\u62DB\u8FFD\u4E0D\u4E0A\u65E7\u5750\u6807\u3002", "\u63D0\u9AD8\u79FB\u52A8\u901F\u5EA6\u5E76\u83B7\u5F97\u5C11\u91CF\u95EA\u907F\u3002"],
  ritual_focus: ["\u658B\u91AE\u6536\u675F\u6742\u5FF5\uFF0C\u8BA9\u672F\u5F0F\u5728\u66F4\u5927\u7684\u6CD5\u57DF\u4E2D\u66F4\u5FEB\u8F6E\u8F6C\u3002", "\u540C\u65F6\u7F29\u77ED\u653B\u51FB\u95F4\u9694\u5E76\u6269\u5927\u8303\u56F4\u3002"],
  hungry_soul: ["\u9965\u9B42\u66FF\u4F60\u541E\u4E0B\u6B8B\u6C14\uFF0C\u518D\u4ECE\u5589\u95F4\u5410\u56DE\u751F\u673A\u3002", "\u6301\u7EED\u6062\u590D\u751F\u547D\u5E76\u6269\u5927\u62FE\u53D6\u8303\u56F4\u3002"]
});
function fmtSeconds(value) {
  return `${Number(value || 0).toFixed(2)} \u79D2`;
}
function weaponCards(game) {
  return (game.player?.weapons || []).map((weapon) => {
    const copy = WEAPON_LORE[weapon.id] || [
      "\u6765\u5386\u88AB\u90AA\u6F6E\u62B9\u53BB\uFF0C\u53EA\u7559\u4E0B\u4ECD\u53EF\u4F7F\u7528\u7684\u672F\u5F0F\u3002",
      "\u81EA\u52A8\u7D22\u654C\u5E76\u6309\u5176\u672F\u5F0F\u53D1\u52A8\u3002"
    ];
    return {
      category: "\u81EA\u52A8\u6B66\u5668",
      artId: weapon.id,
      artKind: "weapon",
      glyph: weapon.name.slice(0, 1),
      name: weapon.name,
      level: `Lv.${weapon.level}${weapon.fusion ? " \xB7 \u5DF2\u878D\u5408" : ""}`,
      lore: copy[0],
      effect: weapon.def.description,
      attackMode: copy[1],
      numbers: `\u4F24\u5BB3 ${weapon.getDamage(game.player).toFixed(1)} \xB7 \u95F4\u9694 ${fmtSeconds(weapon.getCooldown(game.player))} \xB7 \u8303\u56F4 ${Math.round(weapon.getRange(game.player))}${weapon.def.piercing ? " \xB7 \u53EF\u8D2F\u7A7F" : " \xB7 \u4E0D\u8D2F\u7A7F"}`
    };
  });
}
function passiveCards(game) {
  return Object.values(game.player?.passives || {}).map((entry) => {
    const copy = PASSIVE_COPY[entry.def.id] || [
      "\u65E0\u540D\u529F\u6CD5\u5728\u6218\u6597\u4E2D\u81EA\u884C\u8865\u5168\u3002",
      "\u5F3A\u5316\u672C\u5C40\u57FA\u7840\u80FD\u529B\u3002"
    ];
    return {
      category: "\u529F\u6CD5",
      artId: entry.def.id,
      artKind: "passive",
      glyph: entry.def.name.slice(0, 1),
      name: entry.def.name,
      level: `\u53E0\u5C42 ${entry.count}/${CONFIG.PASSIVE_MAX_STACK}`,
      lore: copy[0],
      effect: copy[1],
      attackMode: "\u88AB\u52A8\u751F\u6548\uFF1B\u6240\u6709\u82F1\u96C4\u5171\u4EAB\u6389\u843D\u6C60\u3002",
      numbers: entry.def.description
    };
  });
}
function fusionDetailNumbers(recipe, player) {
  return (recipe.outputs || []).map((output) => {
    const weapon = player?.weapons?.find((item) => item.id === output.weaponId);
    const name = weapon?.name || Object.values(WEAPONS).find((item) => item.id === output.weaponId)?.name || "\u672A\u77E5\u6B66\u5668";
    if (!hasFusion(weapon, recipe.id)) return `${name}\uFF1A\u5F53\u524D\u672A\u751F\u6548\uFF0C\u65E0\u6709\u6548\u878D\u5408\u6570\u503C\u3002`;
    const fusion = weapon.fusion;
    const values = `\u4F24\u5BB3\xD7${fusion.damageMult ?? 1} \xB7 \u8303\u56F4\xD7${fusion.rangeMult ?? 1}`;
    const timing = weapon.def.type === "orbit" ? "\u73AF\u7ED5\u5E38\u9A7B\uFF0C\u4E0D\u6309\u653B\u51FB\u95F4\u9694\u53D1\u5C04" : `\u653B\u51FB\u95F4\u9694\xD7${fusion.cooldownMult ?? 1}`;
    const count = weapon.def.type === "projectile" ? `\u878D\u5408\u5F39\u9053\u52A0\u6210 +${fusion.projectileBonus ?? 0}\uFF08\u975E\u603B\u5F39\u6570\uFF09` : weapon.def.type === "orbit" ? `\u878D\u5408\u788E\u5203\u52A0\u6210 +${fusion.projectileBonus ?? 0}\uFF08\u603B\u6570\u4ECD\u53D7\u4E0A\u9650\u7EA6\u675F\uFF09` : "\u6B64\u653B\u51FB\u65B9\u5F0F\u4E0D\u4F7F\u7528\u989D\u5916\u5F39\u9053";
    return `${name} \xB7 \u5F53\u524D\u5408\u5E76\u6548\u679C
${values} \xB7 ${timing}
${count}
\u540C\u6B66\u5668\u5404\u878D\u5408\u9875\u5171\u7528\u6B64\u503C\uFF0C\u4E0D\u91CD\u590D\u76F8\u4E58\u3002`;
  }).join("\n\n");
}
function buildCards(game) {
  const snapshot = game.buildSystem?.snapshot?.() || { relics: [], curses: [], fusions: [] };
  const relics = snapshot.relics.map((def) => ({
    category: "\u9057\u7269",
    artId: def.id,
    artKind: "relic",
    glyph: def.name.slice(0, 1),
    name: def.name,
    level: "\u5C40\u5185\u9057\u73CD",
    lore: "\u4ECE\u5931\u540D\u53E4\u7960\u4E0E\u9996\u9886\u9057\u9AB8\u4E2D\u7559\u4E0B\u7684\u5668\u7269\uFF0C\u6765\u5386\u6BD4\u4F5C\u7528\u66F4\u5371\u9669\u3002",
    effect: "\u6539\u53D8\u672C\u5C40\u5C5E\u6027\u6216\u63D0\u4F9B\u4E00\u6B21\u5173\u952E\u89C4\u5219\u80FD\u529B\u3002",
    attackMode: "\u88AB\u52A8\u5E38\u9A7B\uFF0C\u4E0D\u5360\u81EA\u52A8\u6B66\u5668\u4F4D\u3002",
    numbers: def.description
  }));
  const curses = snapshot.curses.map((def) => ({
    category: "\u5929\u8D4B / \u5F02\u53D8",
    artId: def.id,
    artKind: "curse",
    glyph: def.name.slice(0, 1),
    name: def.name,
    level: "\u6709\u4EE3\u4EF7\u7684\u547D\u5951",
    lore: "\u90AA\u6F6E\u7ED9\u51FA\u7684\u7B54\u6848\u4ECE\u4E0D\u514D\u8D39\uFF0C\u63A5\u53D7\u8005\u4F1A\u540C\u65F6\u5931\u53BB\u53E6\u4E00\u79CD\u53EF\u80FD\u3002",
    effect: "\u5F3A\u5316\u4E00\u4E2A\u6D41\u6D3E\uFF0C\u540C\u65F6\u9644\u5E26\u660E\u786E\u4EE3\u4EF7\u3002",
    attackMode: "\u88AB\u52A8\u5E38\u9A7B\uFF0C\u5F71\u54CD\u6574\u5957\u6784\u7B51\u3002",
    numbers: def.description
  }));
  const fusions = snapshot.fusions.map((def) => ({
    category: "\u88C5\u5907 / \u878D\u5408",
    artId: def.id,
    artKind: "fusion",
    glyph: def.name.slice(0, 1),
    name: def.name,
    level: "\u9AD8\u9636\u6784\u7B51",
    lore: "\u6B66\u5668\u3001\u529F\u6CD5\u4E0E\u9057\u7269\u5728\u5706\u6EE1\u5904\u5F7C\u6B64\u8BA4\u51FA\uFF0C\u6210\u4E3A\u65B0\u7684\u672F\u5F0F\u3002",
    effect: def.description || "\u6539\u53D8\u5173\u8054\u6B66\u5668\u7684\u4F24\u5BB3\u3001\u8303\u56F4\u6216\u5F39\u9053\u5F62\u6001\u3002",
    attackMode: "\u7EE7\u627F\u539F\u6B66\u5668\u653B\u51FB\u65B9\u5F0F\uFF0C\u5E76\u8FFD\u52A0\u878D\u5408\u7279\u6027\u3002",
    numbers: fusionDetailNumbers(def, game.player)
  }));
  return [...relics, ...curses, ...fusions];
}
function activeCards(game) {
  const skill = game.heroSkills?.getSnapshot?.() || {};
  const copy = {
    sword: [
      [
        "\u8E0F\u7F61\u501F\u4F4D\uFF0C\u5251\u5149\u6CBF\u5C1A\u672A\u7AD9\u7A33\u7684\u56E0\u679C\u5212\u8FC7\u3002",
        "\u5411\u79FB\u52A8\u6216\u7D22\u654C\u65B9\u5411\u7A81\u8FDB\u5E76\u4F24\u5BB3\u8DEF\u5F84\u654C\u4EBA\u3002",
        "\u8DEF\u5F84\u65A9\u51FB\u53EF\u7A7F\u8FC7\u666E\u901A\u969C\u788D\u3002"
      ],
      [
        "\u5251\u610F\u4E09\u5EA6\u56DE\u54CD\uFF0C\u628A\u89C6\u91CE\u4E4B\u5185\u6682\u501F\u4F5C\u5F52\u589F\u3002",
        "\u8FDE\u7EED\u53D1\u52A8\u4E09\u6B21\u6269\u5F20\u5251\u57DF\u3002",
        "\u8303\u56F4\u4F24\u5BB3\u65E0\u89C6\u4EA4\u4E92\u969C\u788D\u3002"
      ]
    ],
    paper: [
      [
        "\u7EB8\u7B26\u8BB0\u4E0B\u6D3B\u7269\u6700\u540E\u4E00\u6B21\u547C\u5438\u3002",
        "\u9501\u5B9A\u9644\u8FD1\u6700\u591A\u516D\u4E2A\u76EE\u6807\u5E76\u540C\u6B65\u8FFD\u9B42\u3002",
        "\u8FFD\u8E2A\u8FDE\u7EBF\u53EF\u4EE5\u8D8A\u8FC7\u969C\u788D\u3002"
      ],
      [
        "\u5343\u7EB8\u6210\u6CB3\uFF0C\u66FF\u4EA1\u8005\u6E21\u8FC7\u540C\u4E00\u573A\u52AB\u3002",
        "\u5927\u8303\u56F4\u6807\u8BB0\u5E76\u4F24\u5BB3\u6700\u591A\u5341\u516B\u4E2A\u654C\u4EBA\u3002",
        "\u5168\u5C4F\u8FFD\u8E2A\u672F\u5F0F\uFF0C\u4E0D\u53D7\u5730\u5F62\u963B\u6321\u3002"
      ]
    ],
    devourer: [
      [
        "\u7AE5\u5B50\u541E\u715E\uFF0C\u4EE5\u6076\u517B\u547D\u3002",
        "\u4F24\u5BB3\u8FD1\u8EAB\u90AA\u7269\uFF0C\u5E76\u6309\u547D\u4E2D\u6570\u91CF\u6062\u590D\u751F\u547D\u3002",
        "\u8FD1\u8EAB\u5706\u5F62\u9886\u57DF\uFF0C\u672F\u5F0F\u53EF\u8D8A\u8FC7\u5EFA\u7B51\uFF1B\u89D2\u8272\u672C\u8EAB\u4ECD\u53D7\u963B\u6321\u3002"
      ],
      [
        "\u767E\u9B3C\u9F50\u5165\u8179\uFF0C\u7B11\u58F0\u6682\u65F6\u76D6\u8FC7\u6B7B\u4EA1\u3002",
        "\u541E\u566C\u5927\u8303\u56F4\u654C\u4EBA\u3001\u56DE\u590D\u751F\u547D\u5E76\u77ED\u6682\u65E0\u654C\u3002",
        "\u5927\u8303\u56F4\u541E\u566C\u7A7F\u8FC7\u666E\u901A\u969C\u788D\u3002"
      ]
    ],
    star: [
      [
        "\u661F\u8DEF\u6298\u53E0\uFF0C\u51FA\u53D1\u4E0E\u62B5\u8FBE\u6210\u4E3A\u540C\u4E00\u6B65\u3002",
        "\u5411\u79FB\u52A8\u65B9\u5411\u6298\u8DC3\uFF0C\u5E76\u5728\u843D\u70B9\u7206\u53D1\u661F\u5203\u3002",
        "\u4F4D\u79FB\u53EF\u4EE5\u8D8A\u8FC7\u666E\u901A\u969C\u788D\u3002"
      ],
      [
        "\u4E09\u57A3\u5012\u60AC\uFF0C\u7FA4\u661F\u4F9D\u6B21\u5760\u5411\u6700\u8FD1\u7684\u654C\u4EBA\u3002",
        "\u5BF9\u5341\u4E8C\u4E2A\u6700\u8FD1\u76EE\u6807\u964D\u4E0B\u9AD8\u4F24\u661F\u96F7\u3002",
        "\u9501\u5B9A\u653B\u51FB\u4E0D\u53D7\u5730\u5F62\u963B\u6321\u3002"
      ]
    ]
  }[skill.heroId] || [[], []];
  return [
    {
      category: "\u4E3B\u52A8\u6280\u80FD",
      artId: skill.skillIcon || "slash",
      artKind: "skill",
      glyph: "\u65A9",
      name: skill.skillName || "\u8E0F\u7F61\u65A9",
      level: `E \xB7 ${{ sword: "\u4F4D\u79FB\u65A9", paper: "\u7B26\u7B93\u8FFD\u9B42", devourer: "\u541E\u715E\u56DE\u751F", star: "\u661F\u6B65\u6298\u8DC3" }[skill.heroId] || "\u4E3B\u52A8\u6280\u80FD"}`,
      lore: copy[0][0],
      effect: copy[0][1],
      attackMode: `\u4E3B\u52A8\u91CA\u653E\uFF1B${copy[0][2]}`,
      numbers: `\u89D2\u8272\u4E13\u5C5E\u4E3B\u52A8 \xB7 \u51B7\u5374 ${fmtSeconds(skill.skillCooldownMax)}`
    },
    {
      category: "\u4E3B\u52A8\u6280\u80FD",
      artId: `${skill.skillIcon || "slash"}_ultimate`,
      artKind: "fusion",
      glyph: "\u589F",
      name: skill.ultimateName || "\u4E07\u5251\u5F52\u589F",
      level: "Q \xB7 \u5145\u80FD\u7EC8\u5F0F",
      lore: copy[1][0],
      effect: copy[1][1],
      attackMode: `\u4E3B\u52A8\u91CA\u653E\uFF1B${copy[1][2]}`,
      numbers: `\u89D2\u8272\u4E13\u5C5E\u7EC8\u5F0F \xB7 \u80FD\u91CF ${Math.round(skill.ultimateEnergy || 0)}/${skill.ultimateEnergyMax || 100}`
    }
  ];
}
function buildPauseCodex(game) {
  const player = game.player;
  if (!player) return { attributes: [], cards: [] };
  const attributes = [
    {
      name: "\u547D\u6570",
      summary: "\u5F53\u524D\u751F\u5B58\u72B6\u6001",
      numbers: `${Math.ceil(player.hp)} / ${Math.ceil(player.maxHp)}`
    },
    {
      name: "\u4F24\u52BF\u8F93\u51FA",
      summary: "\u5F71\u54CD\u5168\u90E8\u6B66\u5668",
      numbers: `${player.getDamageMult().toFixed(2)}\xD7`
    },
    {
      name: "\u672F\u5F0F\u95F4\u9694",
      summary: "\u8D8A\u4F4E\u8D8A\u5FEB",
      numbers: `${player.getCooldownMult().toFixed(2)}\xD7`
    },
    { name: "\u6CD5\u57DF", summary: "\u5F71\u54CD\u8303\u56F4", numbers: `${player.getAreaMult().toFixed(2)}\xD7` },
    { name: "\u8EAB\u6CD5", summary: "\u5F71\u54CD\u79FB\u52A8", numbers: `${player.getSpeedMult().toFixed(2)}\xD7` },
    {
      name: "\u590D\u8D77",
      summary: "\u672C\u5C40\u5269\u4F59\u673A\u4F1A",
      numbers: `${player.runModifiers?.reviveCharges || 0} \u6B21`
    },
    {
      name: "\u8C03\u606F",
      summary: "\u6CBB\u7597 / \u5347\u7EA7\u6062\u590D / \u5438\u53D6",
      numbers: `${(player.runModifiers?.healingMult ?? 1).toFixed(2)}\xD7`
    },
    {
      name: "\u62A4\u6301",
      summary: "\u62A4\u7532 / \u95EA\u907F / \u51CF\u4F24",
      numbers: `${player.getArmor().toFixed(0)} / ${(player.getDodgeChance() * 100).toFixed(0)}% / ${(player.getDamageReduction() * 100).toFixed(0)}%`
    },
    {
      name: "\u547D\u5951\u6B8B\u5377",
      summary: `\u547D\u5951${game.activeCovenantSlot || 1} \xB7 \u5DF2\u8BFB\u65E5\u5FD7`,
      numbers: `${game.run?.logsRead || 0} \u5377 \xB7 \u6BCF 15 \u79D2\u81EA\u52A8\u7EED\u5199`
    }
  ];
  return {
    attributes,
    cards: [
      selectedTalentCard(player),
      damageHistoryCard(game),
      ...game.runMode === "endless" ? [
        {
          category: "\u5C40\u5185\u7ECF\u6D4E",
          artId: "coin_sword_tassel",
          artKind: "relic",
          glyph: "\u94B1",
          name: "\u5927\u8352\u94DC\u94B1",
          level: "\u666E\u901A\u602A\u4EA7\u51FA\u89C4\u5219",
          lore: "\u9B3C\u5E02\u8BA4\u94DC\u94B1\uFF0C\u5374\u4E0D\u4F1A\u4E3A\u65E0\u5C3D\u7684\u5C0F\u9B3C\u65E0\u9650\u94F8\u94B1\u3002",
          effect: "\u666E\u901A\u602A\u6389\u94B1\u53D7\u7D2F\u8BA1\u989D\u5EA6\u7EA6\u675F\uFF1BBoss\u3001\u5B9D\u7BB1\u3001\u4E8B\u4EF6\u548C\u5347\u7EA7\u8865\u7ED9\u53E6\u8BA1\u3002\u82B1\u94B1\u4E0D\u4F1A\u6062\u590D\u6389\u843D\u989D\u5EA6\u3002",
          attackMode: "\u989D\u5EA6\u53EA\u968F\u5C40\u5185\u65F6\u95F4\u589E\u957F\uFF1B\u6682\u505C\u4E0E\u79BB\u7EBF\u4E0D\u589E\u957F\uFF0C\u6062\u590D\u547D\u5951\u4E0D\u4F1A\u91CD\u9886\u5F00\u5C40\u989D\u5EA6\u3002",
          numbers: `\u666E\u901A\u602A\u5DF2\u4EA7 ${game.combatCoinsEarned || 0} / \u5F53\u524D\u7D2F\u8BA1\u989D\u5EA6 ${combatCoinLimit(game.gameTime)}\u3002\u5F00\u5C40\u989D\u5EA6 12\uFF0C\u6BCF 12 \u79D2\u589E\u52A0 1\uFF1B\u6BCF\u4E09\u6740\u4E00\u6B21\u6389\u94B1\u5224\u5B9A\uFF0C\u65F6\u95F4 Boss \u6BCF\u53EA 18\u3002`
        }
      ] : [],
      ...conversionCards(player),
      ...environmentCard(game),
      ...activeCards(game),
      ...weaponCards(game),
      ...passiveCards(game),
      ...buildCards(game),
      ...reactionCards(game)
    ]
  };
}

// prototype-2d-pixel/src/hero-skills.js
function pointSegmentDistance(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;
  if (lenSq <= 1e-4) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lenSq));
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}
var QingfengSkillController = class {
  constructor(game) {
    this.game = game;
    this.skillCooldownMax = 8;
    this.ultimateEnergyMax = 100;
    this.heroId = "sword";
    this.reset();
  }
  setHero(heroId) {
    this.heroId = getHero(heroId).id;
    const cooldowns = { sword: 8, paper: 7, devourer: 10, star: 6.5 };
    this.skillCooldownMax = cooldowns[this.heroId] || 8;
    this._syncUi();
  }
  reset() {
    this.skillCooldown = 0;
    this.ultimateEnergy = 0;
    this._syncUi();
  }
  update(dt) {
    if (this.skillCooldown > 0) this.skillCooldown = Math.max(0, this.skillCooldown - dt);
    this._syncUi();
  }
  gainEnergy(amount2) {
    if (!Number.isFinite(amount2) || amount2 <= 0) return this.ultimateEnergy;
    this.ultimateEnergy = Math.min(this.ultimateEnergyMax, this.ultimateEnergy + amount2);
    this._syncUi();
    return this.ultimateEnergy;
  }
  getSnapshot() {
    const hero = getHero(this.heroId);
    return {
      heroId: hero.id,
      heroName: hero.name,
      skillIcon: hero.skillIcon,
      skillName: hero.skillName,
      ultimateName: hero.ultimateName,
      skillCooldown: this.skillCooldown,
      skillCooldownMax: this.skillCooldownMax,
      ultimateEnergy: this.ultimateEnergy,
      ultimateEnergyMax: this.ultimateEnergyMax,
      skillReady: this.skillCooldown <= 0,
      ultimateReady: this.ultimateEnergy >= this.ultimateEnergyMax
    };
  }
  useSkill() {
    const facing = this._resolveDirection().x;
    const success = this._performSkill();
    if (success) this._showAction(facing);
    return success;
  }
  useUltimate() {
    const facing = this._resolveDirection().x;
    const success = this._performUltimate();
    if (success) this._showAction(facing);
    return success;
  }
  _showAction(facing) {
    startHeroAction(this.game.player, facing, this.game.save?.settings?.reducedMotion || false);
  }
  _performSkill() {
    const { game } = this;
    const player = game?.player;
    if (!player || player.dead || game.state !== GameState.PLAYING || this.skillCooldown > 0) {
      return false;
    }
    if (this.heroId === "paper") return this._usePaperSkill();
    if (this.heroId === "devourer") return this._useDevourerSkill();
    if (this.heroId === "star") return this._useStarSkill();
    const dir = this._resolveDirection();
    const startX = player.x;
    const startY = player.y;
    const dashDistance = 220;
    const arenaW = CONFIG.ARENA_WIDTH ?? CONFIG.CANVAS_WIDTH;
    const arenaH = CONFIG.ARENA_HEIGHT ?? CONFIG.CANVAS_HEIGHT;
    const rawEndX = startX + dir.x * dashDistance;
    const rawEndY = startY + dir.y * dashDistance;
    const endX = game.runMode === "endless" ? rawEndX : Math.max(player.size, Math.min(arenaW - player.size, rawEndX));
    const endY = game.runMode === "endless" ? rawEndY : Math.max(player.size, Math.min(arenaH - player.size, rawEndY));
    const centreX = (startX + endX) / 2;
    const centreY = (startY + endY) / 2;
    const searchRadius = Math.hypot(endX - startX, endY - startY) / 2 + 64;
    const candidates = game.spatial?.queryRect ? game.spatial.queryRect(centreX, centreY, searchRadius) : game.enemies || [];
    const damage = 80 * player.getDamageMult();
    let hits = 0;
    for (const enemy of candidates) {
      if (!enemy || enemy.hp <= 0) continue;
      if (pointSegmentDistance(enemy.x, enemy.y, startX, startY, endX, endY) > 58 + enemyHitRadius(enemy)) {
        continue;
      }
      enemy.takeDamage(damage);
      game.effects?.hit?.(enemy.x, enemy.y, "125,230,255");
      hits++;
    }
    player.x = endX;
    player.y = endY;
    player.invincible = true;
    player.invincibleTimer = Math.max(player.invincibleTimer || 0, 0.35);
    this.skillCooldown = this.skillCooldownMax;
    game.createParticles?.(startX, startY, "#78e6ff", 12);
    game.createParticles?.(endX, endY, "#d7fbff", 18);
    game.combatVisuals?.slashCorridor?.(startX, startY, endX, endY, 58, { fused: false });
    game.shake?.(0.18);
    game._announce?.(`\u8E0F\u7F61\u65A9\uFF0C\u547D\u4E2D ${hits} \u4E2A\u654C\u4EBA`);
    this._syncUi();
    return true;
  }
  _performUltimate() {
    const { game } = this;
    const player = game?.player;
    if (!player || player.dead || game.state !== GameState.PLAYING || this.ultimateEnergy < this.ultimateEnergyMax) {
      return false;
    }
    if (this.heroId === "paper") return this._usePaperUltimate();
    if (this.heroId === "devourer") return this._useDevourerUltimate();
    if (this.heroId === "star") return this._useStarUltimate();
    this.ultimateEnergy = 0;
    this._ultimatePulse(0);
    game.effects?.schedule?.(0.3, () => this._ultimatePulse(1));
    game.effects?.schedule?.(0.6, () => this._ultimatePulse(2));
    game._announce?.("\u4E07\u5251\u5F52\u589F");
    this._syncUi();
    return true;
  }
  _usePaperSkill() {
    const { game } = this;
    const player = game.player;
    const targets = (game.spatial?.queryRect?.(player.x, player.y, 520) || game.enemies || []).filter((enemy) => enemy && enemy.hp > 0).sort(
      (a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y)
    ).slice(0, 6);
    for (const enemy of targets) {
      enemy.takeDamage(54 * player.getDamageMult());
      game.combatVisuals?.tether?.(player.x, player.y, enemy.x, enemy.y, { fused: true });
    }
    game.combatVisuals?.talismans?.(
      player.x,
      player.y,
      targets.map((enemy) => ({ x: enemy.x, y: enemy.y })),
      { fused: true }
    );
    this.skillCooldown = this.skillCooldownMax;
    game.createParticles?.(player.x, player.y, "#f1e2b6", 14);
    game._announce?.(`\u6555\u7EB8\u8FFD\u9B42\uFF0C\u9501\u5B9A ${targets.length} \u4E2A\u90AA\u7269`);
    this._syncUi();
    return true;
  }
  _useDevourerSkill() {
    const { game } = this;
    const player = game.player;
    const radius = 190;
    const targets = game.spatial?.queryRect?.(player.x, player.y, radius) || game.enemies || [];
    let hits = 0;
    for (const enemy of targets) {
      if (!enemy || enemy.hp <= 0 || Math.hypot(enemy.x - player.x, enemy.y - player.y) > radius + enemyHitRadius(enemy))
        continue;
      enemy.takeDamage(64 * player.getDamageMult());
      hits++;
    }
    player.heal?.(Math.min(22, hits * 3));
    game.combatVisuals?.field?.(player.x, player.y, radius, "blood", { fused: true });
    this.skillCooldown = this.skillCooldownMax;
    game._announce?.(`\u541E\u715E\u56DE\u751F\uFF0C\u541E\u4E0B ${hits} \u9053\u715E\u6C14`);
    this._syncUi();
    return true;
  }
  _useStarSkill() {
    const { game } = this;
    const player = game.player;
    const dir = this._resolveDirection();
    const startX = player.x;
    const startY = player.y;
    const distance = 260;
    player.x += dir.x * distance;
    player.y += dir.y * distance;
    if (game.runMode !== "endless") {
      player.x = Math.max(player.size, Math.min(CONFIG.ARENA_WIDTH - player.size, player.x));
      player.y = Math.max(player.size, Math.min(CONFIG.ARENA_HEIGHT - player.size, player.y));
    }
    for (const enemy of game.spatial?.queryRect?.(player.x, player.y, 130) || []) {
      if (Math.hypot(enemy.x - player.x, enemy.y - player.y) <= 130 + enemyHitRadius(enemy)) {
        enemy.takeDamage(72 * player.getDamageMult());
      }
    }
    game.combatVisuals?.wave?.(startX, startY, Math.atan2(dir.y, dir.x), distance, {
      fused: true,
      count: 3
    });
    player.invincible = true;
    player.invincibleTimer = Math.max(player.invincibleTimer || 0, 0.28);
    this.skillCooldown = this.skillCooldownMax;
    game._announce?.("\u661F\u6B65\u6298\u8DC3");
    this._syncUi();
    return true;
  }
  _usePaperUltimate() {
    const { game } = this;
    const player = game.player;
    this.ultimateEnergy = 0;
    const targets = (game.enemies || []).filter((enemy) => enemy.hp > 0).slice(0, 18);
    for (const enemy of targets) {
      enemy.takeDamage(118 * player.getDamageMult());
      game.combatVisuals?.tether?.(player.x, player.y, enemy.x, enemy.y, { fused: true });
    }
    game.combatVisuals?.field?.(player.x, player.y, 520, "ward", { fused: true });
    game._announce?.("\u5343\u7B26\u6E21\u5384");
    this._syncUi();
    return true;
  }
  _useDevourerUltimate() {
    const { game } = this;
    const player = game.player;
    this.ultimateEnergy = 0;
    const radius = 520;
    let hits = 0;
    for (const enemy of game.spatial?.queryRect?.(player.x, player.y, radius) || game.enemies) {
      if (!enemy || enemy.hp <= 0 || Math.hypot(enemy.x - player.x, enemy.y - player.y) > radius + enemyHitRadius(enemy))
        continue;
      enemy.takeDamage(132 * player.getDamageMult());
      hits++;
    }
    player.heal?.(Math.min(player.maxHp * 0.35, hits * 4));
    player.invincible = true;
    player.invincibleTimer = Math.max(player.invincibleTimer || 0, 1.2);
    game.combatVisuals?.field?.(player.x, player.y, radius, "blood", { fused: true });
    game._announce?.("\u767E\u9B3C\u5165\u8179");
    this._syncUi();
    return true;
  }
  _useStarUltimate() {
    const { game } = this;
    const player = game.player;
    this.ultimateEnergy = 0;
    const targets = (game.enemies || []).filter((enemy) => enemy.hp > 0).sort(
      (a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y)
    ).slice(0, 12);
    for (const enemy of targets) enemy.takeDamage(150 * player.getDamageMult());
    game.combatVisuals?.lightning?.([
      { x: player.x, y: player.y },
      ...targets.map((enemy) => ({ x: enemy.x, y: enemy.y }))
    ]);
    game._announce?.("\u4E09\u57A3\u5760\u843D");
    this._syncUi();
    return true;
  }
  _ultimatePulse(index) {
    const { game } = this;
    const player = game?.player;
    if (!player || player.dead) return;
    const radius = 420 + index * 70;
    const candidates = game.spatial?.queryRect ? game.spatial.queryRect(player.x, player.y, radius) : game.enemies || [];
    const damage = 95 * player.getDamageMult();
    for (const enemy of candidates) {
      if (!enemy || enemy.hp <= 0) continue;
      if (Math.hypot(enemy.x - player.x, enemy.y - player.y) > radius + enemyHitRadius(enemy))
        continue;
      enemy.takeDamage(damage);
      game.effects?.hit?.(enemy.x, enemy.y, "205,145,255");
    }
    game.effects?.pulses?.emit?.(player.x, player.y, "190,120,255");
    game.createParticles?.(player.x, player.y, "#c98cff", 24 + index * 6);
    game.shake?.(0.28 + index * 0.08);
  }
  _resolveDirection() {
    const v = this.game?._lastMoveVec || { x: 0, y: 0 };
    const mag = Math.hypot(v.x, v.y);
    if (mag > 0.1) return { x: v.x / mag, y: v.y / mag };
    const player = this.game?.player;
    const nearest = player ? this.game?.spatial?.findNearestEnemy?.(player.x, player.y, 900) : null;
    if (nearest) {
      const dx = nearest.x - player.x;
      const dy = nearest.y - player.y;
      const d = Math.hypot(dx, dy) || 1;
      return { x: dx / d, y: dy / d };
    }
    return { x: 1, y: 0 };
  }
  _syncUi() {
    this.game?.ui?.updateHeroAbilities?.(this.getSnapshot());
  }
};

// prototype-2d-pixel/src/field-contours.js
function exposedCircleArcs(circle, others) {
  const tau = Math.PI * 2, covered = [];
  for (const other of others) {
    if (other === circle) continue;
    const dx = other.x - circle.x, dy = other.y - circle.y;
    const d = Math.hypot(dx, dy), r = circle.radius, R = other.radius;
    if (d < 1e-7 && Math.abs(r - R) < 1e-7) {
      if (others.indexOf(other) < others.indexOf(circle)) return [];
      continue;
    }
    if (d + r <= R) return [];
    if (d >= r + R || d + R <= r) continue;
    const a = (Math.atan2(dy, dx) + tau) % tau;
    const spread = Math.acos(Math.max(-1, Math.min(1, (r * r + d * d - R * R) / (2 * r * d))));
    const lo = a - spread, hi = a + spread;
    if (lo < 0) covered.push([0, hi], [lo + tau, tau]);
    else if (hi > tau) covered.push([lo, tau], [0, hi - tau]);
    else covered.push([lo, hi]);
  }
  covered.sort((a, b) => a[0] - b[0]);
  const visible = [];
  let end = 0;
  for (const [lo, hi] of covered) {
    if (lo > end) visible.push([end, lo]);
    end = Math.max(end, hi);
  }
  if (end < tau) visible.push([end, tau]);
  return visible;
}
function fieldContours(items) {
  const groups = /* @__PURE__ */ new Map(), result = /* @__PURE__ */ new Map();
  for (const item of items) {
    if (!["field", "fire"].includes(item.type)) continue;
    const key = `${item.type === "fire" ? "fire" : item.element}:${!!item.fused}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  for (const group of groups.values())
    for (const item of group) result.set(item.key || item, exposedCircleArcs(item, group));
  return result;
}

// prototype-2d-pixel/src/combat-visuals.js
var isGroundVisual = (item) => ["fire", "field", "frost"].includes(item.type) || item.type === "sword" && item.fullCircle;
function fieldFillOpacity(count = 1, base = 0.2) {
  return Math.min(base, 0.2 / Math.max(1, count));
}
var CombatVisualLayer = class {
  constructor() {
    this.items = [];
    this.max = 80;
  }
  reset() {
    this.items = [];
  }
  wave(x, y, angle, range, { fused = false, count = 2 } = {}) {
    this._push({ type: "wave", x, y, angle, range, fused, count, life: 0.34, maxLife: 0.34 });
  }
  swordSweep(x, y, range, { fused = false, fullCircle = false, angle = 0 } = {}) {
    this._push({
      type: "sword",
      x,
      y,
      range,
      fused,
      fullCircle,
      angle,
      life: 0.42,
      maxLife: 0.42
    });
  }
  slashCorridor(x1, y1, x2, y2, width = 58, { fused = false } = {}) {
    this._push({
      type: "slash-corridor",
      x1,
      y1,
      x2,
      y2,
      width,
      fused,
      life: 0.48,
      maxLife: 0.48
    });
  }
  talismans(x, y, targets, { fire = false, fused = false } = {}) {
    if (!targets?.length) return;
    this._push({ type: "talismans", x, y, targets, fire, fused, life: 0.58, maxLife: 0.58 });
  }
  firePatch(x, y, radius, duration = 1.6, { fused = false } = {}) {
    this._push({
      type: "fire",
      x,
      y,
      radius,
      fused,
      stable: true,
      life: duration,
      maxLife: duration
    });
  }
  field(x, y, radius, element = "steam", { fused = false, sustained = false, key = null, duration = 0.52 } = {}) {
    const stableKey = sustained ? key || `field:${element}` : null;
    if (stableKey) {
      const existing = this.items.find(
        (item2) => item2.type === "field" && item2.key === stableKey
      );
      if (existing) {
        existing.x = x;
        existing.y = y;
        existing.radius = radius;
        existing.element = element;
        existing.fused = fused;
        existing.life = duration;
        existing.maxLife = duration;
        return existing;
      }
    }
    const item = {
      type: "field",
      x,
      y,
      radius,
      element,
      fused,
      stable: sustained,
      key: stableKey,
      life: sustained ? duration : 0.42,
      maxLife: sustained ? duration : 0.42
    };
    this._push(item);
    return item;
  }
  frost(x, y, radius, { fused = false, second = false } = {}) {
    this._push({ type: "frost", x, y, radius, fused, second, life: 0.62, maxLife: 0.62 });
  }
  tether(x1, y1, x2, y2, { fused = false } = {}) {
    this._push({ type: "tether", x1, y1, x2, y2, fused, life: 0.24, maxLife: 0.24 });
  }
  lightning(points, { fused = false } = {}) {
    if (!Array.isArray(points) || points.length < 2) return;
    this._push({ type: "lightning", points, fused, life: 0.22, maxLife: 0.22 });
  }
  fusionBurst(x, y, radius = 140) {
    this._push({ type: "fusion", x, y, radius, life: 0.8, maxLife: 0.8 });
  }
  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      this.items[i].life -= dt;
      if (this.items[i].life <= 0) this.items.splice(i, 1);
    }
  }
  render(ctx, pass = "all") {
    this.groundCount = this.items.filter(isGroundVisual).length;
    if (pass !== "foreground") this.contours = fieldContours(this.items);
    for (const item of this.items) {
      const ground = isGroundVisual(item);
      if (pass === "ground" && !ground || pass === "foreground" && ground) continue;
      const t = 1 - item.life / item.maxLife;
      const alpha = item.stable ? Math.min(1, Math.max(0, item.life / 0.16)) : Math.max(0, 1 - t);
      ctx.save();
      ctx.globalAlpha = alpha;
      if (item.type === "wave") this._drawWave(ctx, item, t);
      else if (item.type === "sword") this._drawSword(ctx, item, t);
      else if (item.type === "slash-corridor") this._drawSlashCorridor(ctx, item, t);
      else if (item.type === "talismans") this._drawTalismans(ctx, item, t);
      else if (item.type === "fire") this._drawFire(ctx, item, t);
      else if (item.type === "field") this._drawField(ctx, item, t);
      else if (item.type === "frost") this._drawFrost(ctx, item, t);
      else if (item.type === "tether") this._drawTether(ctx, item, t);
      else if (item.type === "lightning") this._drawLightning(ctx, item, t);
      else if (item.type === "fusion") this._drawFusion(ctx, item, t);
      ctx.restore();
    }
  }
  _push(item) {
    if (this.items.length >= this.max) this.items.shift();
    this.items.push(item);
  }
  _strokeFieldBoundary(ctx, item, radius) {
    const arcs = this.contours?.get(item.key || item) || [[0, Math.PI * 2]];
    ctx.beginPath();
    for (const [start, end] of arcs) {
      ctx.moveTo(item.x + Math.cos(start) * radius, item.y + Math.sin(start) * radius);
      ctx.arc(item.x, item.y, radius, start, end);
    }
    ctx.stroke();
  }
  _drawWave(ctx, item, t) {
    ctx.translate(item.x, item.y);
    ctx.rotate(item.angle);
    const reach = item.range * (0.55 + t * 0.45);
    ctx.strokeStyle = item.fused ? "#ff6aa9" : "#f1d994";
    ctx.lineWidth = item.fused ? 9 : 5;
    ctx.shadowColor = item.fused ? "#b52e78" : "#d7bd70";
    ctx.shadowBlur = item.fused ? 18 : 8;
    for (let i = 0; i < item.count; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      ctx.beginPath();
      ctx.arc(side * reach * 0.16, 0, reach * (0.64 + i * 0.08), -0.56, 0.56);
      ctx.stroke();
    }
  }
  _drawSword(ctx, item, t) {
    ctx.translate(item.x, item.y);
    if (!item.fullCircle) {
      ctx.rotate(item.angle || 0);
      ctx.fillStyle = item.fused ? "rgba(235,82,160,0.14)" : "rgba(238,216,148,0.14)";
      ctx.fillRect(-item.range, -40, item.range * 2, 80);
      ctx.strokeStyle = item.fused ? "#d779a5" : "#cbb784";
      ctx.lineWidth = 2;
      ctx.strokeRect(-item.range, -40, item.range * 2, 80);
      for (const direction of [-1, 1]) {
        ctx.save();
        ctx.scale(direction, direction);
        const tip = item.range * (0.85 + 0.15 * t);
        ctx.fillStyle = "#efe9c9";
        ctx.fillRect(10, -3, Math.max(1, tip - 18), 6);
        ctx.beginPath();
        ctx.moveTo(tip, 0);
        ctx.lineTo(tip - 12, -7);
        ctx.lineTo(tip - 12, 7);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#9a7c48";
        ctx.fillRect(6, -10, 4, 20);
        ctx.strokeStyle = item.fused ? "#d779a5" : "#e3d298";
        ctx.beginPath();
        ctx.moveTo(14, -30);
        ctx.quadraticCurveTo(tip * 0.75, -18, tip, 0);
        ctx.quadraticCurveTo(tip * 0.75, 18, 14, 30);
        ctx.stroke();
        ctx.restore();
      }
      return;
    }
    const sweep = t * Math.PI * 0.9 - Math.PI * 0.45;
    ctx.rotate(sweep);
    const opacity = item.fullCircle ? fieldFillOpacity(this.groundCount, 0.18) : 0.18;
    ctx.fillStyle = item.fused ? `rgba(235,82,160,${opacity})` : `rgba(238,216,148,${opacity})`;
    ctx.beginPath();
    if (item.fullCircle) ctx.arc(0, 0, item.range, 0, Math.PI * 2);
    else ctx.arc(0, 0, item.range, -0.48, 0.48);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = item.fused ? "#ff6aa9" : "#f5df9a";
    ctx.lineWidth = item.fused ? 8 : 5;
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      item.range * (0.9 + t * 0.1),
      item.fullCircle ? 0 : -0.48,
      item.fullCircle ? Math.PI * 2 : 0.48
    );
    ctx.stroke();
    ctx.fillStyle = "#f8f1d2";
    ctx.fillRect(8, -3, item.range * 0.72, 6);
    ctx.fillStyle = "#8d6b3e";
    ctx.fillRect(0, -6, 12, 12);
    ctx.beginPath();
    ctx.moveTo(item.range * 0.86, 0);
    ctx.lineTo(item.range * 0.72, -8);
    ctx.lineTo(item.range * 0.72, 8);
    ctx.closePath();
    ctx.fillStyle = "#fff8dc";
    ctx.fill();
  }
  _drawSlashCorridor(ctx, item, t) {
    const dx = item.x2 - item.x1;
    const dy = item.y2 - item.y1;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    ctx.translate(item.x1, item.y1);
    ctx.rotate(angle);
    ctx.fillStyle = item.fused ? "rgba(225,76,154,0.2)" : "rgba(121,229,255,0.18)";
    ctx.fillRect(0, -item.width, length, item.width * 2);
    ctx.strokeStyle = item.fused ? "#ff78ba" : "#bdefff";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -item.width);
    ctx.quadraticCurveTo(length * 0.55, -item.width * (1.3 - t), length, 0);
    ctx.quadraticCurveTo(length * 0.55, item.width * (1.3 - t), 0, item.width);
    ctx.stroke();
    ctx.fillStyle = "#effcff";
    ctx.fillRect(length * t - 24, -4, 46, 8);
    ctx.beginPath();
    ctx.moveTo(length * t + 32, 0);
    ctx.lineTo(length * t + 18, -9);
    ctx.lineTo(length * t + 18, 9);
    ctx.closePath();
    ctx.fill();
  }
  _drawTalismans(ctx, item, t) {
    for (const target of item.targets) {
      const x = item.x + (target.x - item.x) * Math.min(1, t * 1.5);
      const y = item.y + (target.y - item.y) * Math.min(1, t * 1.5);
      const angle = Math.atan2(target.y - item.y, target.x - item.x);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = "#ecdca8";
      ctx.fillRect(-13, -6, 26, 12);
      ctx.fillStyle = item.fire ? "#df4f2b" : "#9d2f43";
      ctx.fillRect(-6, -4, 3, 8);
      ctx.fillRect(0, -3, 8, 2);
      ctx.restore();
      if (t > 0.55) {
        ctx.strokeStyle = item.fire ? "#ff6b28" : "#d26d9c";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(target.x, target.y, 12 + t * 18, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  _drawFire(ctx, item, _t) {
    ctx.fillStyle = `rgba(151,28,20,${fieldFillOpacity(this.groundCount, 0.16)})`;
    ctx.strokeStyle = item.fused ? "#ffdc5d" : "#ff5a31";
    ctx.lineWidth = item.fused ? 3 : 2;
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
    ctx.fill();
    this._strokeFieldBoundary(ctx, item, item.radius);
    ctx.globalAlpha *= Math.min(1, 3 / Math.max(1, this.groundCount));
    for (let i = 0; i < 12; i += 1) {
      const a = i * 2.399;
      const r = item.radius * (0.18 + i % 4 * 0.2);
      const x = item.x + Math.cos(a) * r;
      const y = item.y + Math.sin(a) * r;
      ctx.fillStyle = i % 2 ? "#ff9a38" : "#e9412c";
      ctx.beginPath();
      ctx.moveTo(x, y - 16 - i % 3 * 5);
      ctx.lineTo(x - 8, y + 7);
      ctx.lineTo(x + 8, y + 7);
      ctx.closePath();
      ctx.fill();
    }
  }
  _drawField(ctx, item, t) {
    if (item.element === "frost") {
      this._drawFrost(ctx, { ...item, fused: false }, 1);
      return;
    }
    if (item.element === "fire") {
      this._drawFire(ctx, item, t);
      return;
    }
    const opacity = fieldFillOpacity(this.groundCount, 0.14);
    const palette = item.element === "ward" ? [`rgba(170,224,178,${opacity})`, "#8fd8a4"] : item.element === "blood" ? [`rgba(148,24,45,${opacity})`, "#d94961"] : [`rgba(224,232,218,${opacity})`, "#d6ded0"];
    const radius = item.stable ? item.radius : item.radius * (0.97 + t * 0.03);
    ctx.fillStyle = palette[0];
    ctx.strokeStyle = item.fused ? "#e6d467" : palette[1];
    ctx.lineWidth = item.fused ? 3 : 2;
    ctx.beginPath();
    ctx.arc(item.x, item.y, radius, 0, Math.PI * 2);
    ctx.fill();
    this._strokeFieldBoundary(ctx, item, radius);
    ctx.globalAlpha *= Math.min(1, 3 / Math.max(1, this.groundCount));
    if (item.element === "blade" || item.element === "thunder") {
      ctx.save();
      ctx.translate(item.x, item.y);
      const scale = Math.min(1, radius / 44);
      ctx.scale(scale, scale);
      ctx.strokeStyle = item.element === "blade" ? "#dcebe2" : "#bcd7ff";
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 3;
      if (item.element === "blade") {
        for (const angle of [-0.55, 0.55]) {
          ctx.save();
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.moveTo(0, -26);
          ctx.lineTo(-4, -16);
          ctx.lineTo(-2, 14);
          ctx.lineTo(2, 14);
          ctx.lineTo(4, -16);
          ctx.closePath();
          ctx.fill();
          ctx.fillRect(-9, 12, 18, 3);
          ctx.fillRect(-2, 15, 4, 10);
          ctx.restore();
        }
      } else {
        ctx.beginPath();
        for (let i = 0; i <= 8; i++) {
          const angle = i * Math.PI / 4;
          const r = i % 2 ? 8 : 25;
          if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
          else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(7, -17);
        ctx.lineTo(-4, 0);
        ctx.lineTo(5, 0);
        ctx.lineTo(-7, 17);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }
    for (let i = 0; i < 10; i += 1) {
      const a = i * 2.399;
      const r = radius * (i % 4 / 4);
      ctx.fillStyle = item.element === "blood" ? i % 2 ? "#ff9b9b" : "#8f183b" : i % 2 ? "#e8efe6" : "#91b9a1";
      ctx.fillRect(item.x + Math.cos(a) * r - 3, item.y + Math.sin(a) * r - 3, 6, 6);
    }
  }
  _drawFrost(ctx, item, t) {
    const radius = item.radius * (0.35 + t * 0.65);
    ctx.strokeStyle = item.fused ? "#d8b7ff" : "#a9e7ff";
    ctx.lineWidth = item.fused ? 3 : item.second ? 2 : 3;
    this._strokeFieldBoundary(ctx, item, radius);
    ctx.globalAlpha *= Math.min(1, 3 / Math.max(1, this.groundCount));
    for (let i = 0; i < 16; i += 1) {
      const a = i / 16 * Math.PI * 2;
      const x = item.x + Math.cos(a) * radius;
      const y = item.y + Math.sin(a) * radius;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.fillStyle = item.fused ? "#eadcff" : "#d7f5ff";
      ctx.fillRect(-2, -8, 4, 16);
      ctx.fillRect(-7, -2, 14, 4);
      ctx.restore();
    }
  }
  _drawTether(ctx, item, t) {
    ctx.strokeStyle = item.fused ? "#ff7fb7" : "#c84d83";
    ctx.lineWidth = item.fused ? 7 : 4;
    ctx.beginPath();
    ctx.moveTo(item.x1, item.y1);
    const mx = (item.x1 + item.x2) / 2;
    const my = (item.y1 + item.y2) / 2 - Math.sin(t * Math.PI) * 18;
    ctx.quadraticCurveTo(mx, my, item.x2, item.y2);
    ctx.stroke();
    ctx.fillStyle = "#ffd4e5";
    ctx.fillRect(item.x2 - 5, item.y2 - 5, 10, 10);
  }
  _drawLightning(ctx, item) {
    ctx.strokeStyle = item.fused ? "#f4c7ff" : "#fff176";
    ctx.lineWidth = item.fused ? 6 : 3;
    ctx.shadowColor = item.fused ? "#c56bf0" : "#e5cf4b";
    ctx.shadowBlur = item.fused ? 18 : 10;
    ctx.beginPath();
    ctx.moveTo(item.points[0].x, item.points[0].y);
    for (let i = 1; i < item.points.length; i += 1) {
      const from = item.points[i - 1];
      const to = item.points[i];
      const mx = (from.x + to.x) / 2 + (i % 2 ? 12 : -12);
      const my = (from.y + to.y) / 2 + (i % 2 ? -8 : 8);
      ctx.lineTo(mx, my);
      ctx.lineTo(to.x, to.y);
    }
    ctx.stroke();
  }
  _drawFusion(ctx, item, t) {
    const radius = item.radius * (0.25 + t * 0.75);
    ctx.strokeStyle = "#e7b5ff";
    ctx.lineWidth = 8;
    ctx.shadowColor = "#c23baf";
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(item.x, item.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(t * 1.5);
    ctx.strokeStyle = "#f0d170";
    ctx.lineWidth = 3;
    ctx.strokeRect(item.x - radius * 0.55, item.y - radius * 0.55, radius * 1.1, radius * 1.1);
  }
};

// prototype-2d-pixel/src/enemy-animation.js
var ENEMY_WALK_ASSETS = Object.freeze({
  forest: "./assets/enemies/forest-walk-v1.png",
  crypt: "./assets/enemies/crypt-walk-v1.png",
  tundra: "./assets/enemies/tundra-walk-v1.png"
});
function updateEnemyAnimation(enemy, dt, reducedMotion = false) {
  const dx = enemy.x - (enemy.prevX ?? enemy.x);
  const distance = Math.hypot(dx, enemy.y - (enemy.prevY ?? enemy.y));
  if (Math.abs(dx) > 0.05) enemy.walkFacing = dx < 0 ? -1 : 1;
  enemy.walkFacing || (enemy.walkFacing = -1);
  if (reducedMotion || enemy.hp <= 0 || enemy.cast || !Number.isFinite(distance) || distance < 0.01 || !(dt > 0)) {
    enemy.walkFrame = 1;
    return;
  }
  enemy.walkPhase ?? (enemy.walkPhase = Math.abs(enemy.x * 13 + enemy.y * 7) % 97 / 97 * 4);
  enemy.walkPhase = (enemy.walkPhase + Math.min(distance / 24, Math.min(dt, 0.05) * 6)) % 4;
  enemy.walkFrame = Math.floor(enemy.walkPhase);
}
if (false)
  for (const [id, url] of Object.entries(ENEMY_WALK_ASSETS)) {
    const state = { image: null, frames: null, error: null };
    atlases.set(id, state);
    const image = new (void 0)();
    image.onload = () => {
      try {
        const canvas = (void 0).createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(image, 0, 0);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        clearExteriorMatte(pixels.data, canvas.width, canvas.height);
        state.frames = locateHeroFrames(pixels.data, canvas.width, canvas.height);
        ctx.putImageData(pixels, 0, 0);
        state.image = canvas;
      } catch (error) {
        state.error = error.message;
      }
    };
    image.onerror = () => {
      state.error = "Enemy walk atlas unavailable; original sprites remain active";
    };
    image.src = url;
  }

// prototype-2d-pixel/src/combat-steps.js
function updateEnemies(dt, hpMult, dmgMult) {
  const currentEnemies = this.enemies;
  for (let i = currentEnemies.length - 1; i >= 0; i--) {
    const e = currentEnemies[i];
    e.update(dt, this);
    this.worldMap.resolveEntity(e);
    this.interactions?.resolveEntity(e);
    updateEnemyAnimation(
      e,
      dt,
      this.save?.settings?.reducedMotion || heroPrefersReducedMotion()
    );
    const dx = e.x - this.player.x;
    const dy = e.y - this.player.y;
    const d = Math.hypot(dx, dy);
    if (e.hp > 0 && d < enemyHitRadius(e) + this.player.size && !this.player.invincible) {
      this.player.takeDamage(e.damage, this, enemyDamageSource(e));
      this.createFloatingText(
        Math.round(e.damage),
        this.player.x,
        this.player.y - 30,
        "#ff3333"
      );
    }
    if (e.hp <= 0) {
      currentEnemies.splice(i, 1);
      this._onEnemyKilled(e, hpMult, dmgMult);
      if (this.enemies !== currentEnemies) return;
      continue;
    }
    if (d > CONFIG.DESPAWN_RADIUS && !e.boss) {
      this.enemies.splice(i, 1);
    }
  }
}
function updateProjectiles(dt) {
  for (let i = this.projectiles.length - 1; i >= 0; i--) {
    const p = this.projectiles[i];
    p.update(dt, this);
    if (p.shouldRemove) {
      this.projectiles.splice(i, 1);
      continue;
    }
    const range = p.size + 80;
    for (const enemy of this.spatial.queryRect(p.x, p.y, range)) {
      if (enemy.hp <= 0 || p.hitEnemies.has(enemy)) continue;
      const d = Math.hypot(p.x - enemy.x, p.y - enemy.y);
      if (d < enemyHitRadius(enemy) + p.size) {
        let dmg = p.damage;
        const chance = this.player.getCritChance();
        const crit = chance > 0 && Math.random() < chance;
        if (crit) dmg *= 2;
        enemy.takeDamage(dmg);
        this.reactions.applyHit(enemy, p.def?.element, dmg);
        p.hitEnemies.add(enemy);
        const retargeted = p.onFusionHit?.(enemy, this);
        if (enemy.hp > 0) {
          this.createFloatingText(
            Math.round(dmg),
            enemy.x,
            enemy.y - 20,
            crit ? "#ffee44" : "#fff",
            { crit }
          );
        }
        if (crit && this.save.settings.criticalFlash !== false && !this.save.settings.reducedMotion) {
          this.effects.criticalHit(enemy.x, enemy.y);
        } else {
          this.effects.hit(enemy.x, enemy.y);
        }
        if (retargeted) break;
        if (!p.piercing) {
          p._onEnd(this);
          p.shouldRemove = true;
          break;
        }
      }
    }
  }
}
function updateEnemyProjectiles(dt) {
  for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
    const ep = this.enemyProjectiles[i];
    if (ep.shouldRemove) {
      this.enemyProjectiles.splice(i, 1);
      continue;
    }
    ep.update(dt, this);
    if (ep.shouldRemove) this.enemyProjectiles.splice(i, 1);
  }
}
function updateMines(dt) {
  for (let i = this.mines.length - 1; i >= 0; i--) {
    const m = this.mines[i];
    m.update(dt, this);
    if (m.shouldRemove) this.mines.splice(i, 1);
  }
}
function updateExpOrbs(dt) {
  const before = this.run?.orbsCollected || 0;
  for (let i = this.expOrbs.length - 1; i >= 0; i--) {
    const o = this.expOrbs[i];
    o.update(dt, this);
    if (o.shouldRemove) this.expOrbs.splice(i, 1);
  }
  if (this.tutorial?.active) {
    const after = this.run?.orbsCollected || 0;
    for (let k = 0; k < after - before; k++) {
      this.tutorial.notifyOrbPickup();
    }
    if (after !== before) this._renderTutorialBanner();
  }
}

// prototype-2d-pixel/src/level-rewards.js
var LEVEL_REWARDS = Object.freeze({
  recover: Object.freeze({
    id: "recover",
    name: "\u8C03\u606F\u517B\u5143",
    description: "\u6062\u590D\u6700\u5927\u751F\u547D\u7684 20%\uFF0C\u53D7\u6CBB\u7597\u6548\u679C\u52A0\u6210\uFF1B\u4E0D\u8D85\u8FC7\u751F\u547D\u4E0A\u9650\u3002"
  }),
  coins: Object.freeze({
    id: "coins",
    name: "\u7EB3\u4F59\u6210\u91D1",
    description: "\u83B7\u5F97 12 \u679A\u5C40\u5185\u94DC\u94B1\u3002\u672C\u6B21\u4E0D\u589E\u52A0\u5C5E\u6027\uFF0C\u4E5F\u4E0D\u53D1\u653E\u5C40\u5916\u8D27\u5E01\u3002"
  })
});
function liveUpgradePool(player) {
  const pool = [];
  for (const def of Object.values(WEAPONS)) {
    const owned = player.weapons.find((w) => w.id === def.id);
    if (owned ? owned.level < CONFIG.WEAPON_MAX_LEVEL : player.weapons.length < CONFIG.MAX_WEAPONS)
      pool.push({ type: "weapon", data: def });
  }
  for (const def of Object.values(PASSIVES)) {
    const owned = player.passives[def.id];
    if (owned ? owned.count < CONFIG.PASSIVE_MAX_STACK : Object.keys(player.passives).length < CONFIG.MAX_PASSIVES)
      pool.push({ type: "passive", data: def });
  }
  return pool;
}
function levelChoices(player, random = Math.random) {
  const pool = liveUpgradePool(player), picks = [];
  while (picks.length < 3 && pool.length) {
    picks.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  }
  if (picks.length < 3 && player.hp < player.maxHp)
    picks.push({ type: "reward", data: LEVEL_REWARDS.recover });
  if (picks.length < 3) picks.push({ type: "reward", data: LEVEL_REWARDS.coins });
  return picks;
}
function applyLevelReward(game, id) {
  if (id === "recover") {
    const before = game.player.hp;
    game.player.heal(game.player.maxHp * 0.2);
    return { healed: game.player.hp - before, coins: 0 };
  }
  if (id === "coins") {
    game.runCoins += 12;
    return { healed: 0, coins: 12 };
  }
  return null;
}

// prototype-2d-pixel/src/endless-run.js
var ENDLESS_MILESTONES = Object.freeze([1200, 1800, 2700]);
var ENDLESS_CYCLE_INTERVAL = 900;
var ENDLESS_AFFIXES = Object.freeze([
  {
    id: "iron",
    name: "\u7384\u7532",
    description: "\u751F\u547D\u589E\u52A0 25%",
    hp: 1.25,
    damage: 1,
    speed: 1,
    interval: 1
  },
  {
    id: "frenzy",
    name: "\u75BE\u715E",
    description: "\u79FB\u52A8\u589E\u52A0 18%\uFF0C\u6280\u80FD\u95F4\u9694\u7F29\u77ED 20%",
    hp: 1,
    damage: 1,
    speed: 1.18,
    interval: 0.8
  },
  {
    id: "blood",
    name: "\u8840\u795F",
    description: "\u4F24\u5BB3\u589E\u52A0 20%",
    hp: 1,
    damage: 1.2,
    speed: 1,
    interval: 1
  }
]);
function endlessBossAt(index) {
  return ENDLESS_MILESTONES[index] ?? 3600 + Math.max(0, index - 3) * ENDLESS_CYCLE_INTERVAL;
}
function endlessBossDefinition(stageId, index) {
  const stages = {
    forest: [BOSSES.REAPER, BOSSES.VOID_LORD, BOSSES.CHRONO_LICH],
    crypt: [BOSSES.NECROMANCER, BOSSES.REAPER, BOSSES.CHRONO_LICH],
    tundra: [BOSSES.REAPER, BOSSES.ICE_QUEEN, BOSSES.CHRONO_LICH]
  };
  const roster = stages[stageId] || stages.forest;
  const base = roster[index % roster.length];
  const cycle = Math.max(0, index - 2);
  const affix = cycle ? ENDLESS_AFFIXES[(cycle - 1) % ENDLESS_AFFIXES.length] : null;
  const growth = Math.min(4, 1 + cycle * 0.12);
  return {
    ...base,
    name: `${base.name}${affix ? ` \xB7 ${affix.name}` : ""}`,
    spawnAt: endlessBossAt(index),
    endlessIndex: index,
    endlessKey: `endless:${index}`,
    affix,
    hp: Math.round(base.hp * growth * (affix?.hp || 1)),
    damage: base.damage * Math.min(2, 1 + cycle * 0.04) * (affix?.damage || 1),
    speed: base.speed * (affix?.speed || 1),
    abilityInterval: (base.ability === "summon" ? 6 : 4.5) * (affix?.interval || 1)
  };
}
function endlessDifficultyScales(gameTime = 0) {
  const seconds = Math.max(0, Number(gameTime) || 0);
  return { hp: Math.min(30, 1 + seconds / 600), damage: Math.min(8, 1 + seconds / 900) };
}
var EndlessRun = class {
  constructor(snapshot = null) {
    this.restore(snapshot);
  }
  restore(snapshot) {
    this.nextIndex = Math.max(0, Math.floor(Number(snapshot?.nextIndex) || 0));
    this.activeIndex = snapshot?.activeIndex === this.nextIndex ? this.nextIndex : null;
    this.pendingDecision = !!snapshot?.pendingDecision && this.nextIndex >= 3;
    this.lastCheckpoint = Math.max(0, Number(snapshot?.lastCheckpoint) || 0);
    this.warnedIndex = null;
    this.savedBoss = snapshot?.boss || null;
  }
  nextDefinition(stageId) {
    return endlessBossDefinition(stageId, this.nextIndex);
  }
  defeat(definition) {
    if (definition?.endlessIndex !== this.activeIndex || this.activeIndex == null) return false;
    const index = this.activeIndex;
    this.activeIndex = null;
    this.savedBoss = null;
    this.nextIndex = index + 1;
    if (index >= 2) {
      this.pendingDecision = true;
      this.lastCheckpoint = endlessBossAt(index);
    }
    return true;
  }
  continueRun() {
    this.pendingDecision = false;
  }
  snapshot(enemies = []) {
    const boss = enemies.find(
      (enemy) => enemy.type?.endlessIndex === this.activeIndex && enemy.hp > 0
    );
    return {
      nextIndex: this.nextIndex,
      activeIndex: this.activeIndex,
      pendingDecision: this.pendingDecision,
      lastCheckpoint: this.lastCheckpoint,
      boss: boss ? {
        x: boss.x,
        y: boss.y,
        hp: boss.hp,
        maxHp: boss.maxHp,
        damage: boss.damage,
        abilityTimer: boss.abilityTimer,
        cast: boss.cast ? clonePlainState(boss.cast) : null
      } : this.savedBoss
    };
  }
};

// prototype-2d-pixel/src/collision.js
function resolveCircleObstacle(entity, obstacle) {
  if (!entity || !obstacle) return false;
  const radius = (entity.size || 14) + (obstacle.radius || 0);
  const dx = entity.x - obstacle.x;
  const dy = entity.y - obstacle.y;
  const distance = Math.hypot(dx, dy);
  if (distance >= radius) return false;
  const oldX = Number.isFinite(entity.prevX) ? entity.prevX : entity.x;
  const oldY = Number.isFinite(entity.prevY) ? entity.prevY : entity.y;
  const clears = (x, y) => Math.hypot(x - obstacle.x, y - obstacle.y) >= radius;
  if (clears(entity.x, oldY)) {
    entity.y = oldY;
  } else if (clears(oldX, entity.y)) {
    entity.x = oldX;
  } else if (clears(oldX, oldY)) {
    entity.x = oldX;
    entity.y = oldY;
  } else {
    const safeDistance = distance || 1;
    const safeDx = distance ? dx : 1;
    const safeDy = distance ? dy : 0;
    entity.x = obstacle.x + safeDx / safeDistance * radius;
    entity.y = obstacle.y + safeDy / safeDistance * radius;
  }
  return true;
}
function resolveRectObstacle(entity, box) {
  if (!entity || !box) return false;
  const r = entity.size || 14;
  const clear = (x, y) => Math.hypot(
    x - Math.max(box.left, Math.min(box.right, x)),
    y - Math.max(box.top, Math.min(box.bottom, y))
  ) >= r;
  if (clear(entity.x, entity.y)) return false;
  const oldX = Number.isFinite(entity.prevX) ? entity.prevX : entity.x;
  const oldY = Number.isFinite(entity.prevY) ? entity.prevY : entity.y;
  if (clear(entity.x, oldY)) entity.y = oldY;
  else if (clear(oldX, entity.y)) entity.x = oldX;
  else if (clear(oldX, oldY)) {
    entity.x = oldX;
    entity.y = oldY;
  } else {
    const edges = [
      { x: box.left - r, y: entity.y },
      { x: box.right + r, y: entity.y },
      { x: entity.x, y: box.top - r },
      { x: entity.x, y: box.bottom + r }
    ].sort(
      (a, b) => Math.hypot(a.x - entity.x, a.y - entity.y) - Math.hypot(b.x - entity.x, b.y - entity.y)
    );
    entity.x = edges[0].x;
    entity.y = edges[0].y;
  }
  return true;
}
function segmentRectHit(ax, ay, bx, by, box, radius = 0) {
  let enter = 0, leave = 1;
  for (const [a, delta, min, max] of [
    [ax, bx - ax, box.left - radius, box.right + radius],
    [ay, by - ay, box.top - radius, box.bottom + radius]
  ]) {
    if (Math.abs(delta) < 1e-9) {
      if (a < min || a > max) return null;
    } else {
      const t0 = (min - a) / delta, t1 = (max - a) / delta;
      enter = Math.max(enter, Math.min(t0, t1));
      leave = Math.min(leave, Math.max(t0, t1));
      if (enter > leave) return null;
    }
  }
  return { t: enter, x: ax + (bx - ax) * enter, y: ay + (by - ay) * enter };
}

// prototype-2d-pixel/src/effects.js
var ScreenFlash = class {
  constructor() {
    this.color = "rgba(255,255,255,0)";
    this.alpha = 0;
    this.decay = 3;
  }
  flash(color = "255,255,255", intensity = 0.4, decay = 3) {
    this.color = color;
    this.alpha = Math.max(this.alpha, intensity);
    this.decay = decay;
  }
  update(dt) {
    if (this.alpha > 0) {
      this.alpha -= this.decay * dt;
      if (this.alpha < 0) this.alpha = 0;
    }
  }
  render(ctx, w, h) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = `rgb(${this.color})`;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
};
var RingPulse = class {
  constructor() {
    this.pulses = [];
  }
  emit(x, y, color = "255,210,77") {
    this.pulses.push({ x, y, color, r: 10, life: 1 });
  }
  update(dt) {
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.r += 220 * dt;
      p.life -= 1.5 * dt;
      if (p.life <= 0) this.pulses.splice(i, 1);
    }
  }
  render(ctx) {
    for (const p of this.pulses) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.strokeStyle = `rgb(${p.color})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
};
var HitBursts = class {
  constructor() {
    this.bursts = [];
    this.max = 40;
  }
  emit(x, y, color = "255,255,255") {
    if (this.bursts.length >= this.max) this.bursts.shift();
    this.bursts.push({ x, y, color, r: 2, life: 0.25 });
  }
  update(dt) {
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.r += 160 * dt;
      b.life -= 5 * dt;
      if (b.life <= 0) this.bursts.splice(i, 1);
    }
  }
  render(ctx) {
    for (const b of this.bursts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, b.life);
      ctx.strokeStyle = `rgb(${b.color})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
};
var EmojiRain = class {
  constructor() {
    this.drops = [];
    this.max = 60;
    this.glyphs = ["\u{1F389}", "\u{1F38A}", "\u2728", "\u2B50", "\u{1F3C6}", "\u{1F973}"];
  }
  /** Spit a fresh batch of `count` emoji from the top of the screen. */
  burst(width, height, count = 24) {
    const w = Number.isFinite(width) && width > 0 ? width : 1200;
    const h = Number.isFinite(height) && height > 0 ? height : 800;
    for (let i = 0; i < count; i++) {
      if (this.drops.length >= this.max) break;
      this.drops.push({
        x: Math.random() * w,
        y: -20 - Math.random() * h * 0.5,
        vx: (Math.random() - 0.5) * 60,
        vy: 80 + Math.random() * 120,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 2,
        size: 22 + Math.random() * 14,
        glyph: this.glyphs[Math.floor(Math.random() * this.glyphs.length)],
        life: 5 + Math.random() * 3
      });
    }
  }
  update(dt, height) {
    const h = Number.isFinite(height) && height > 0 ? height : 800;
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += 80 * dt;
      d.rot += d.vrot * dt;
      d.life -= dt;
      if (d.life <= 0 || d.y > h + 40) this.drops.splice(i, 1);
    }
  }
  render(ctx) {
    if (!this.drops.length || !ctx) return;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const d of this.drops) {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);
      ctx.font = `${d.size}px serif`;
      ctx.fillText(d.glyph, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }
  clear() {
    this.drops.length = 0;
  }
  isActive() {
    return this.drops.length > 0;
  }
};
var EffectLayer = class {
  constructor() {
    this.flash = new ScreenFlash();
    this.pulses = new RingPulse();
    this.hits = new HitBursts();
    this.emojiRain = new EmojiRain();
    this.delays = [];
  }
  /**
   * iter-20: trigger the harmless emoji rain. Caller passes the canvas
   * dimensions so the spread covers the visible area. No-op cap is
   * enforced inside `EmojiRain.burst`.
   */
  celebrate(width, height) {
    this.emojiRain.burst(width, height);
  }
  levelUp(x, y) {
    this.pulses.emit(x, y, "255,220,80");
  }
  hit(x, y, color = "255,255,255") {
    this.hits.emit(x, y, color);
  }
  bossSpawn() {
  }
  achievement() {
  }
  /**
   * iter-15 polish: short red flash on a critical hit. Kept very brief
   * (high decay) so the player still sees the action under it. Drives
   * the optional `criticalFlash` setting in main.js.
   */
  criticalHit(x, y) {
    if (Number.isFinite(x) && Number.isFinite(y)) this.hits.emit(x, y, "255,96,96");
  }
  /**
   * Schedule a callback to fire after `seconds` of simulation time. The queue
   * is drained inside `update(dt)`, so it implicitly pauses with the game.
   * Returns a token whose `.cancelled = true` stops the callback.
   */
  schedule(seconds, fn) {
    const entry = { t: seconds, fn, cancelled: false };
    this.delays.push(entry);
    return entry;
  }
  update(dt, viewport) {
    this.flash.update(dt);
    this.pulses.update(dt);
    this.hits.update(dt);
    this.emojiRain.update(dt, viewport && viewport.h);
    if (this.delays.length) {
      for (let i = this.delays.length - 1; i >= 0; i--) {
        const d = this.delays[i];
        d.t -= dt;
        if (d.t <= 0) {
          this.delays.splice(i, 1);
          if (!d.cancelled) {
            try {
              d.fn();
            } catch (err) {
              console.warn("[effects] scheduled fn threw", err);
            }
          }
        }
      }
    }
  }
  render(ctx, w, h) {
    this.pulses.render(ctx);
    this.hits.render(ctx);
    this.flash.render(ctx, w, h);
    this.emojiRain.render(ctx);
  }
};

// prototype-2d-pixel/src/stages.js
var STAGES = Object.freeze({
  FOREST: Object.freeze({
    id: "forest",
    name: "\u96FE\u9690\u9752\u51A5\u5C71",
    icon: "\u{1F332}",
    description: "\u7EB8\u4EBA\u9A7F\u9053\u4E0E\u9ED1\u6C34\u7AF9\u6D77\u4EA4\u9519\uFF0C\u654C\u7FA4\u5747\u8861\uFF0C\u9002\u5408\u4F5C\u4E3A\u9996\u8F6E\u6218\u6597\u6807\u5C3A\u3002",
    background: { fill: "#1a1a2e", gridAlpha: 0.04 },
    musicStyle: "forest",
    poolOverrides: {},
    extraEnemies: [],
    bossOffsets: {}
  }),
  CRYPT: Object.freeze({
    id: "crypt",
    name: "\u4E5D\u5E7D\u620F\u795E\u57CE",
    icon: "\u{1FAA6}",
    description: "\u90AA\u6559\u8FDC\u7A0B\u5355\u4F4D\u66F4\u591A\uFF0C\u7EB8\u5AC1\u8863\u65E0\u5E38\u4F1A\u63D0\u524D\u767B\u573A\u3002",
    background: { fill: "#0c0816", gridAlpha: 0.025 },
    musicStyle: "crypt",
    // Bias spawns: more mages and illusionists, fewer melee chasers.
    poolOverrides: {
      mage: 1.8,
      illusionist: 1.6,
      ghost: 1.4,
      skeleton: 1.2,
      bat: 0.6,
      zombie: 0.5,
      wolf: 0.7
    },
    // Add mage to every wave so the ranged-heavy promise holds in the
    // first 90 seconds where vanilla pools have no caster.
    extraEnemies: ["mage"],
    bossOffsets: {
      // Reaper arrives 60s earlier (5:00 -> 4:00).
      reaper: -60,
      // Necromancer also pulled in slightly so the 4:00→7:30 gap is healthier.
      necromancer: -30
    }
  }),
  // ----------------------------------------------------------------------
  // iter-14 — Tundra
  //
  // The third map. Bosses keep the same schedule as forest, but the entire
  // map applies three soft pressure modifiers:
  //   - playerSpeedMult 0.9   (ice underfoot, -10% movement)
  //   - enemyHpMult     1.2   (thicker furred enemies, +20% HP)
  //   - cold tick       1 HP / 10 s (slow attrition)
  // The cold tick is implemented in main.js (`_applyColdTick`) and reads
  // its config from `getStageModifiers(id)` so the modifier surface stays
  // declarative. Recovery buildings offer a one-use ward lantern as an
  // alternative to their healing/tempering choices (120 seconds of shelter).
  //
  // Visual: cold blue palette (#2a3a4f) with a slightly more visible grid
  // so the snow lines read on the canvas. The 10-minute boss is replaced
  // with IceQueen (see data.js BOSSES.ICE_QUEEN) via `bossOverrides`.
  // ----------------------------------------------------------------------
  TUNDRA: Object.freeze({
    id: "tundra",
    name: "\u661F\u9668\u5929\u95E8\u5173",
    icon: "\u2744\uFE0F",
    description: "\u661F\u8680\u4FB5\u4F53\uFF1A\u79FB\u901F -10%\uFF0C\u654C\u4EBA\u751F\u547D +20%\uFF1B\u6062\u590D\u5EFA\u7B51\u53EF\u70B9\u907F\u661F\u706F\uFF0C\u6682\u7F13\u5468\u671F\u4FB5\u8680\u3002",
    background: { fill: "#2a3a4f", gridAlpha: 0.05 },
    musicStyle: "forest",
    poolOverrides: {
      // Wolves and golems thrive in snow, mages and bats less so.
      wolf: 1.5,
      golem: 1.4,
      zombie: 1.1,
      skeleton: 1.1,
      bat: 0.5,
      mage: 0.7
    },
    extraEnemies: [],
    // Bosses keep their forest-default timings — the difficulty comes
    // from the always-on modifiers, not from rushing the schedule.
    bossOffsets: {},
    // 10-minute boss reskin: replace VoidLord with IceQueen on tundra.
    bossOverrides: { void_lord: "ice_queen" },
    modifiers: Object.freeze({
      playerSpeedMult: 0.9,
      enemyHpMult: 1.2,
      coldTickInterval: 10,
      // seconds
      coldTickDamage: 1,
      // HP per tick
      warmthSourceEnabled: true
    })
  })
});
function getStage(id) {
  if (!id) return STAGES.FOREST;
  for (const s of Object.values(STAGES)) {
    if (s.id === id) return s;
  }
  return STAGES.FOREST;
}
var DEFAULT_MODIFIERS = Object.freeze({
  playerSpeedMult: 1,
  enemyHpMult: 1,
  coldTickInterval: 0,
  coldTickDamage: 0,
  warmthSourceEnabled: false
});
function getStageModifiers(id) {
  const stage = getStage(id);
  return { ...DEFAULT_MODIFIERS, ...stage.modifiers || {} };
}
function getWavesFor(id) {
  const stage = getStage(id);
  const extra = stage.extraEnemies || [];
  return WAVES.map((w) => {
    const pool = extra.length ? Array.from(new Set(w.pool.concat(extra))) : w.pool.slice();
    return { ...w, pool };
  });
}
function getBossesFor(id) {
  const stage = getStage(id);
  const offsets = stage.bossOffsets || {};
  const overrides = stage.bossOverrides || {};
  const replacementTargets = new Set(Object.values(overrides));
  const bossesById = {};
  for (const b of Object.values(BOSSES)) bossesById[b.id] = b;
  const overrideOnlyIds = /* @__PURE__ */ new Set(["ice_queen"]);
  const out = [];
  for (const b of Object.values(BOSSES)) {
    if (overrideOnlyIds.has(b.id) && !replacementTargets.has(b.id)) {
      continue;
    }
    if (replacementTargets.has(b.id) && !overrides[b.id]) {
      continue;
    }
    let def = b;
    if (overrides[b.id]) {
      const replacement = bossesById[overrides[b.id]];
      if (replacement) def = replacement;
    }
    const off = offsets[b.id] || 0;
    const spawnAt = Math.max(30, b.spawnAt + off);
    out.push({ ...def, spawnAt, sourceId: b.id });
  }
  return out;
}
function pickWeighted(pool, stageId, rnd = Math.random) {
  if (!pool.length) return null;
  const stage = getStage(stageId);
  const weights = stage.poolOverrides || {};
  let total = 0;
  const cum = pool.map((id) => {
    const w = weights[id] ?? 1;
    total += Math.max(0, w);
    return total;
  });
  if (total <= 0) return pool[Math.floor(rnd() * pool.length)];
  const r = rnd() * total;
  for (let i = 0; i < pool.length; i++) {
    if (r < cum[i]) return pool[i];
  }
  return pool[pool.length - 1];
}

// prototype-2d-pixel/src/difficulty.js
function progressiveDifficultyScales(gameTime = 0, roomBonus = 0) {
  const seconds = Math.max(0, Number(gameTime) || 0);
  const room = Math.max(0, Math.min(0.5, Number(roomBonus) || 0));
  return {
    hp: (1 + seconds / 600) * (1 + room),
    damage: (1 + seconds / 900) * (1 + room * 0.7)
  };
}

// prototype-2d-pixel/src/encounter-steps.js
function _computeDifficultyMults() {
  const diff = Difficulty[(this.save.settings.difficulty || "normal").toUpperCase()] || Difficulty.NORMAL;
  const routeThreat = this.runMode === "chapter" ? this.chapterRoute.current().threatBonus || 0 : 0;
  const scales = this._usesEndlessTimeline() ? endlessDifficultyScales(this.gameTime) : progressiveDifficultyScales(this.gameTime, routeThreat);
  const stageHpMult = this.stageMods?.enemyHpMult ?? 1;
  return {
    diff,
    hpMult: diff.hpMult * scales.hp * stageHpMult,
    dmgMult: diff.dmgMult * scales.damage
  };
}
function _selectWave() {
  const t = this.gameTime;
  const list = this.stageWaves && this.stageWaves.length ? this.stageWaves : WAVES;
  let match = list[list.length - 1];
  for (const w of list) {
    if (t >= w.from && t < w.to) {
      match = w;
      break;
    }
  }
  if (this._lastAnnouncedWave !== match.label) {
    this._lastAnnouncedWave = match.label;
  }
  return match;
}
function _spawnLogic(dt, hpMult, dmgMult, diffSpawnMult) {
  const wave = this.currentWave;
  if (this.runMode === "chapter") {
    const room = this.chapterRoute.current();
    if (this.chapterRoute.roomReady || room.killTarget <= 0 || room.type === "boss") return;
    const roomCap = Math.min(48, Math.max(12, room.killTarget - this.chapterRoute.roomKills));
    const interval2 = Math.max(0.34, 0.9 - (room.threatBonus || 0) * 0.75) / diffSpawnMult;
    this._spawnAccumulator += dt;
    while (this._spawnAccumulator >= interval2 && this.enemies.length < roomCap) {
      this._spawnAccumulator -= interval2;
      this._spawnOne(room.pool?.length ? room.pool : wave.pool, hpMult, dmgMult);
    }
    return;
  }
  const waveMult = wave.spawnMult || 1;
  const maxEnemies = Math.min(CONFIG.MAX_ENEMIES, 20 + Math.floor(this.gameTime / 10));
  const interval = Math.max(0.2, 1.2 - this.gameTime / 200) / (diffSpawnMult * waveMult);
  this._spawnAccumulator += dt;
  while (this._spawnAccumulator >= interval && this.enemies.length < maxEnemies) {
    this._spawnAccumulator -= interval;
    this._spawnOne(wave.pool, hpMult, dmgMult);
  }
  if (this._usesEndlessTimeline()) {
    this._tickEndlessBoss(hpMult, dmgMult);
    return;
  }
  const bossList = this.stageBosses && this.stageBosses.length ? this.stageBosses : Object.values(BOSSES);
  for (const boss of bossList) {
    const warnAt = boss.spawnAt - 5;
    if (this.gameTime >= warnAt && !this._bossWarnedAt.has(boss.id)) {
      this._bossWarnedAt.add(boss.id);
      this.audio.bossWarn();
    }
    if (this.gameTime >= boss.spawnAt && !this._bossesSpawned.has(boss.id)) {
      this._bossesSpawned.add(boss.id);
      this._spawnBoss(boss, hpMult, dmgMult);
    }
  }
}
function _spawnOne(pool, hpMult, dmgMult) {
  const rng = (this.speedrunMode || this.dailyMode) && this.speedrunRng ? this.speedrunRng : null;
  const frnd = rng ? () => rng.nextFloat() : Math.random;
  const pick = pickWeighted(pool, this.stageId, frnd) || pool[Math.floor(frnd() * pool.length)];
  const type = findEnemyDef(pick) || ENEMIES.BAT;
  if (type.control && this.enemies.filter((enemy2) => enemy2.type.control).length >= 3) return;
  const angle = frnd() * Math.PI * 2;
  const dist = CONFIG.SPAWN_RADIUS + frnd() * 120;
  let x = this.player.x + Math.cos(angle) * dist;
  let y = this.player.y + Math.sin(angle) * dist;
  if (this.runMode === "chapter") {
    const inset = Math.max(42, type.size + 4);
    const left = Math.max(inset, this.camera.worldX + inset);
    const right = Math.min(
      this.arenaWidth - inset,
      this.camera.worldX + (this.canvas?.width || CONFIG.CANVAS_WIDTH) - inset
    );
    const top = Math.max(inset, this.camera.worldY + inset);
    const bottom = Math.min(
      this.arenaHeight - inset,
      this.camera.worldY + (this.canvas?.height || CONFIG.CANVAS_HEIGHT) - inset
    );
    const gap = Math.max(260, this.player.size + type.size + type.speed * 1.25);
    const candidate = (edge, t) => edge < 2 ? { x: edge === 0 ? left : right, y: top + (bottom - top) * t } : { x: left + (right - left) * t, y: edge === 2 ? top : bottom };
    const clear = (point2) => {
      if (Math.hypot(point2.x - this.player.x, point2.y - this.player.y) < gap) return false;
      const probe = { ...point2, prevX: point2.x, prevY: point2.y, size: type.size };
      this.worldMap?.resolveEntity(probe);
      this.interactions?.resolveEntity(probe);
      return probe.x === point2.x && probe.y === point2.y;
    };
    let point = null;
    for (let attempt = 0; attempt < 12 && !point; attempt++) {
      const next = candidate(Math.floor(frnd() * 4), 0.05 + frnd() * 0.9);
      if (clear(next)) point = next;
    }
    for (let edge = 0; edge < 4 && !point; edge++) {
      for (let step = 1; step < 8 && !point; step++) {
        const next = candidate(edge, step / 8);
        if (clear(next)) point = next;
      }
    }
    if (!point) return;
    ({ x, y } = point);
  }
  const enemy = new Enemy(x, y, type, hpMult, dmgMult);
  enemy.skin = enemySkinFor(this.stageId, type);
  this._recordDiscovery("monsters", enemy.skin.id);
  if (type.control) this._recordDiscovery("monsters", type.id);
  this.enemies.push(enemy);
}
function _spawnBoss(bossDef, hpMult, dmgMult) {
  const angle = Math.random() * Math.PI * 2;
  const d = CONFIG.SPAWN_RADIUS * 0.8;
  const x = this.runMode === "chapter" ? this.player.x : this.player.x + Math.cos(angle) * d;
  const y = this.runMode === "chapter" ? Math.max(96, this.player.y - 300) : this.player.y + Math.sin(angle) * d;
  const endlessBossMult = this.runMode === "endless" ? 1.35 : 1;
  const enemy = new Enemy(x, y, bossDef, hpMult * endlessBossMult, dmgMult * endlessBossMult);
  this._recordDiscovery("monsters", bossDef.id);
  this.enemies.push(enemy);
  this.ui.showBossBanner();
  this.audio.bossSpawn();
  this.effects.bossSpawn();
  this.shake(1.2);
  this.haptics?.bossSpawn();
  this._announce(`Boss incoming: ${bossDef.name || bossDef.id}`);
  return enemy;
}
function _tickEndlessBoss(hpMult, dmgMult) {
  const director = this.endlessRun;
  if (director.pendingDecision) return;
  const def = director.nextDefinition(this.stageId);
  if (this.enemies.some((enemy2) => enemy2.type?.endlessKey === def.endlessKey)) return;
  if (this.gameTime >= def.spawnAt - 10 && director.warnedIndex !== director.nextIndex) {
    director.warnedIndex = director.nextIndex;
    this.audio.bossWarn();
    this._announce(`\u65F6\u95F4\u9996\u9886\u5C06\u81F3\uFF1A${def.name}\u3002\u5C0F\u5730\u56FE\u5C06\u6807\u51FA\u9996\u9886\u65B9\u4F4D\u3002`);
  }
  if (this.gameTime < def.spawnAt && director.activeIndex == null) return;
  director.activeIndex = director.nextIndex;
  const enemy = this._spawnBoss(def, hpMult, dmgMult);
  const saved = director.savedBoss;
  if (saved) {
    restoreBossCombat(enemy, saved);
    director.savedBoss = null;
  }
  this.saveCurrentCovenant({ announce: false });
}
function onBossAbility(boss) {
  beginEnemyCast(boss, this);
}
function spawnBossMinions(boss, count) {
  const { hpMult, dmgMult } = this._computeDifficultyMults();
  const def = findEnemyDef(boss.id === "reaper" ? "bat" : "skeleton");
  for (let i = 0; i < count && this.enemies.length < CONFIG.MAX_ENEMIES; i++) {
    const angle = i / count * Math.PI * 2;
    this.enemies.push(
      new Enemy(
        boss.x + Math.cos(angle) * 100,
        boss.y + Math.sin(angle) * 100,
        def,
        hpMult,
        dmgMult
      )
    );
  }
}
function fireBossFan(boss, cast) {
  const angle = Math.atan2(cast.targetY - cast.y, cast.targetX - cast.x);
  const count = cast.phase === 2 ? 7 : 5;
  for (let i = 0; i < count && this.enemyProjectiles.length < 240; i++) {
    this.enemyProjectiles.push(
      new EnemyProjectile(
        boss.x,
        boss.y,
        angle + (i - (count - 1) / 2) * 0.24,
        160,
        boss.damage * 0.45,
        { projectileStyle: "skull", projectileColor: "#df867a" },
        enemyDamageSource(boss, "projectile")
      )
    );
  }
}

// prototype-2d-pixel/src/chapter-content.js
var CHAPTER_CONTENT = Object.freeze({
  forest: {
    title: "\u96FE\u9690\u9752\u51A5\u5C71",
    bossId: "reaper",
    names: [
      "\u7EB8\u9A6C\u6E21\u53E3",
      "\u542C\u96E8\u836F\u5F84",
      "\u6CFC\u58A8\u7AF9\u6D77",
      "\u50A9\u5203\u5C71\u9698",
      "\u85CF\u950B\u652F\u8C37",
      "\u767E\u9B3C\u5C71\u9053",
      "\u6C89\u94B1\u77F3\u7A9F",
      "\u7EB8\u5AC1\u8863\u53E4\u7960"
    ],
    pools: {
      "1-1": ["bat", "zombie"],
      "1-2B": ["bat", "skeleton", "wolf"],
      "1-3": ["wolf", "mage", "golem", "bramble_seer"],
      "1-4B": ["skeleton", "wolf", "slime", "bomber", "bramble_seer"],
      "1-4C": ["zombie", "slime", "bomber"]
    },
    specialNames: {
      shrine: "\u542C\u96E8\u836F\u4EAD",
      shop: "\u7AF9\u6D77\u884C\u5546",
      reward: "\u85CF\u950B\u77F3\u7A9F",
      event: "\u7EB8\u4EBA\u8336\u5C40"
    }
  },
  crypt: {
    title: "\u4E5D\u5E7D\u620F\u795E\u57CE",
    bossId: "necromancer",
    names: [
      "\u843D\u5E55\u57CE\u95E8",
      "\u65E0\u706F\u504F\u8857",
      "\u60AC\u68FA\u957F\u8857",
      "\u767D\u9AA8\u796D\u573A",
      "\u65E7\u620F\u540E\u53F0",
      "\u65E0\u9762\u620F\u5ECA",
      "\u51A5\u94B1\u5E93\u623F",
      "\u620F\u795E\u4E3B\u53F0"
    ],
    edges: [
      ["1-1", "1-2B"],
      ["1-2B", "1-3"],
      ["1-3", "1-4C"],
      ["1-3", "1-2A"],
      ["1-3", "1-4B"],
      ["1-2A", "1-4A"],
      ["1-4A", "1-4B"],
      ["1-4B", "1-5"],
      ["1-4C", "1-5"]
    ],
    pools: {
      "1-1": ["skeleton", "zombie"],
      "1-2B": ["skeleton", "ghost", "mage"],
      "1-3": ["skeleton", "mage", "golem", "thread_chanter"],
      "1-4B": ["ghost", "mage", "illusionist", "bomber", "thread_chanter"],
      "1-4C": ["skeleton", "wolf", "bomber"]
    },
    specialNames: {
      shrine: "\u8FD8\u9B42\u9999\u5802",
      shop: "\u65E0\u706F\u9B3C\u5E02",
      reward: "\u5C01\u68FA\u5B9D\u5E93",
      event: "\u66FF\u8EAB\u70B9\u620F\u53F0"
    }
  },
  tundra: {
    title: "\u661F\u9668\u5929\u95E8\u5173",
    bossId: "ice_queen",
    names: [
      "\u51BB\u661F\u524D\u54E8",
      "\u5931\u6E29\u5C94\u9053",
      "\u6676\u810A\u96EA\u5F84",
      "\u5F57\u7532\u89C2\u661F\u53F0",
      "\u6708\u955C\u4FA7\u6BBF",
      "\u9668\u94C1\u5929\u9636",
      "\u5760\u661F\u77FF\u7A9F",
      "\u6708\u8680\u9F99\u7960"
    ],
    edges: [
      ["1-1", "1-2A"],
      ["1-1", "1-2B"],
      ["1-2A", "1-4A"],
      ["1-2B", "1-3"],
      ["1-4A", "1-4B"],
      ["1-4B", "1-3"],
      ["1-4B", "1-5"],
      ["1-3", "1-4C"],
      ["1-4C", "1-5"]
    ],
    pools: {
      "1-1": ["zombie", "skeleton"],
      "1-2B": ["zombie", "wolf", "skeleton"],
      "1-3": ["wolf", "golem", "mage", "frost_eye"],
      "1-4B": ["wolf", "golem", "mage", "bomber", "frost_eye"],
      "1-4C": ["zombie", "golem", "bomber"]
    },
    specialNames: {
      shrine: "\u5931\u6E29\u70FD\u71E7",
      shop: "\u9668\u94C1\u884C\u6808",
      reward: "\u6708\u955C\u79D8\u5E93",
      event: "\u89C2\u661F\u8005\u6B8B\u8425"
    }
  }
});
function chapterContentFor(stageId) {
  return CHAPTER_CONTENT[stageId] || CHAPTER_CONTENT.forest;
}
function buildChapterNodes(baseNodes, stageId, layoutVersion = 1) {
  const content = chapterContentFor(stageId);
  const nodes = Object.fromEntries(
    Object.values(baseNodes).map((node, index) => [
      node.id,
      {
        ...node,
        name: content.names[index],
        bossId: node.type === "boss" ? content.bossId : node.bossId,
        pool: content.pools[node.id] ? [...content.pools[node.id]] : [],
        links: content.edges && layoutVersion >= 1 ? {} : { ...node.links }
      }
    ])
  );
  if (content.edges && layoutVersion >= 1) {
    for (const [from, to] of content.edges) {
      const a = nodes[from], b = nodes[to];
      const dx = b.gridX - a.gridX, dy = b.gridY - a.gridY;
      if (Math.abs(dx) + Math.abs(dy) !== 1)
        throw new Error(`Non-adjacent chapter edge: ${from}/${to}`);
      const direction = dx === 1 ? "right" : dx === -1 ? "left" : dy === 1 ? "down" : "up";
      const opposite = { right: "left", left: "right", up: "down", down: "up" };
      a.links[direction] = to;
      b.links[opposite[direction]] = from;
    }
  }
  return nodes;
}

// prototype-2d-pixel/src/chapter-route.js
var CHAPTER_NODES = Object.freeze({
  "1-1": Object.freeze({
    id: "1-1",
    name: "\u7EB8\u9A6C\u6E21\u53E3",
    type: "combat",
    label: "\u6218\u6597\u623F",
    killTarget: 60,
    threatBonus: 0,
    gridX: 0,
    gridY: 2,
    links: Object.freeze({ up: "1-2A", right: "1-2B" })
  }),
  "1-2A": Object.freeze({
    id: "1-2A",
    name: "\u672A\u5B9A\u5F02\u5BA4",
    type: "special",
    label: "\u968F\u673A\u623F",
    killTarget: 0,
    threatBonus: 0.04,
    specialSlot: "early",
    gridX: 0,
    gridY: 1,
    links: Object.freeze({ down: "1-1", up: "1-4A", right: "1-3" })
  }),
  "1-2B": Object.freeze({
    id: "1-2B",
    name: "\u9B3C\u5E02\u5916\u8857",
    type: "combat",
    label: "\u6218\u6597\u623F",
    killTarget: 80,
    threatBonus: 0.06,
    gridX: 1,
    gridY: 2,
    links: Object.freeze({ left: "1-1", up: "1-3" })
  }),
  "1-3": Object.freeze({
    id: "1-3",
    name: "\u65AD\u5251\u9057\u5E9C",
    type: "elite",
    label: "\u7CBE\u82F1\u623F",
    killTarget: 100,
    threatBonus: 0.12,
    gridX: 1,
    gridY: 1,
    links: Object.freeze({ left: "1-2A", down: "1-2B", up: "1-4B", right: "1-4C" })
  }),
  "1-4A": Object.freeze({
    id: "1-4A",
    name: "\u672A\u5B9A\u5F02\u5BA4",
    type: "special",
    label: "\u968F\u673A\u623F",
    killTarget: 0,
    threatBonus: 0.16,
    specialSlot: "late",
    gridX: 0,
    gridY: 0,
    links: Object.freeze({ down: "1-2A", right: "1-4B" })
  }),
  "1-4B": Object.freeze({
    id: "1-4B",
    name: "\u50A9\u5F71\u56DE\u5ECA",
    type: "combat",
    label: "\u6218\u6597\u623F",
    killTarget: 110,
    threatBonus: 0.18,
    gridX: 1,
    gridY: 0,
    links: Object.freeze({ left: "1-4A", down: "1-3", right: "1-5" })
  }),
  "1-4C": Object.freeze({
    id: "1-4C",
    name: "\u94DC\u94B1\u5996\u7A9F",
    type: "gold",
    label: "\u91D1\u5E01\u623F",
    killTarget: 90,
    threatBonus: 0.2,
    gridX: 2,
    gridY: 1,
    links: Object.freeze({ left: "1-3", up: "1-5" })
  }),
  "1-5": Object.freeze({
    id: "1-5",
    name: "\u5929\u95E8\u846C\u661F\u53F0",
    type: "boss",
    label: "Boss \u623F",
    killTarget: 1,
    threatBonus: 0.28,
    bossId: "reaper",
    gridX: 2,
    gridY: 0,
    links: Object.freeze({ left: "1-4B", down: "1-4C" })
  })
});
var SPECIAL_ROOM_VARIANTS = Object.freeze([
  Object.freeze({
    key: "shrine",
    type: "shrine",
    label: "\u6062\u590D\u623F",
    name: "\u9752\u5C71\u836F\u4EAD"
  }),
  Object.freeze({
    key: "shop",
    type: "shop",
    label: "\u5546\u5E97\u623F",
    name: "\u65E0\u706F\u9B3C\u5E02"
  }),
  Object.freeze({
    key: "reward",
    type: "reward",
    label: "\u5956\u52B1\u623F",
    name: "\u85CF\u950B\u77F3\u7A9F"
  }),
  Object.freeze({
    key: "event",
    type: "event",
    label: "\u5947\u9047\u623F",
    name: "\u7EB8\u4EBA\u8336\u5C40"
  })
]);
var DIRECTION_LABELS = Object.freeze({ up: "\u5317", right: "\u4E1C", down: "\u5357", left: "\u897F" });
var OPPOSITE_DIRECTION = Object.freeze({ up: "down", right: "left", down: "up", left: "right" });
var ChapterRouteSystem = class {
  constructor(random = Math.random) {
    this.random = typeof random === "function" ? random : Math.random;
    this.reset();
  }
  reset(snapshot = null, stageId = snapshot?.stageId || "forest") {
    this.stageId = stageId;
    this.layoutVersion = snapshot ? snapshot.layoutVersion || 0 : 1;
    this.nodes = buildChapterNodes(CHAPTER_NODES, stageId, this.layoutVersion);
    this.roomStates = clonePlainState(snapshot?.roomStates || {});
    this.currentId = snapshot?.currentId && CHAPTER_NODES[snapshot.currentId] ? snapshot.currentId : "1-1";
    this.cleared = new Set(snapshot?.cleared || []);
    this.visited = new Set(snapshot?.visited || [this.currentId]);
    this.progress = { ...snapshot?.progress || {} };
    this.specialRooms = snapshot?.specialRooms ? { ...snapshot.specialRooms } : {
      "1-2A": this._pickSpecialVariant(),
      "1-4A": this._pickSpecialVariant()
    };
    this.entryDirection = snapshot?.entryDirection || null;
    const saved = this.progress[this.currentId];
    this.roomKills = Math.max(0, Number(saved?.kills ?? snapshot?.roomKills) || 0);
    this.roomReady = !!(saved?.ready ?? snapshot?.roomReady ?? this.cleared.has(this.currentId));
    this._storeCurrent();
  }
  current() {
    return this.roomFor(this.currentId);
  }
  roomFor(id) {
    const node = this.nodes[id];
    if (!node?.specialSlot) return node;
    const key = this.specialRooms?.[id];
    const variant = SPECIAL_ROOM_VARIANTS.find((entry) => entry.key === key);
    return variant ? {
      ...node,
      ...variant,
      name: chapterContentFor(this.stageId).specialNames[variant.key],
      id: node.id,
      links: node.links
    } : node;
  }
  saveRoomState(state) {
    this.roomStates[this.currentId] = clonePlainState(state);
  }
  currentRoomState() {
    const state = this.roomStates[this.currentId];
    return state ? clonePlainState(state) : null;
  }
  _pickSpecialVariant() {
    const roll = Math.max(0, Math.min(0.999999, Number(this.random()) || 0));
    return SPECIAL_ROOM_VARIANTS[Math.floor(roll * SPECIAL_ROOM_VARIANTS.length)].key;
  }
  _storeCurrent() {
    this.progress[this.currentId] = { kills: this.roomKills, ready: this.roomReady };
  }
  registerKill(enemy) {
    const node = this.current();
    if (this.roomReady) return false;
    if (node.type === "boss" && !enemy?.boss) return false;
    this.roomKills += 1;
    if (this.roomKills < node.killTarget) {
      this._storeCurrent();
      return false;
    }
    this.roomKills = node.killTarget;
    this.roomReady = true;
    this.cleared.add(node.id);
    this._storeCurrent();
    return true;
  }
  markSpecialReady() {
    const node = this.current();
    if (node.killTarget > 0) return false;
    this.roomReady = true;
    this.cleared.add(node.id);
    this._storeCurrent();
    return true;
  }
  choices() {
    const node = this.current();
    return Object.entries(node.links).filter(([, id]) => this.roomReady || this.cleared.has(id)).map(([direction, id]) => ({ ...this.roomFor(id), direction }));
  }
  advance(targetId) {
    const choice = this.choices().find((entry) => entry.id === targetId);
    if (!choice) return false;
    this._storeCurrent();
    this.currentId = targetId;
    this.entryDirection = OPPOSITE_DIRECTION[choice.direction] || null;
    this.visited.add(targetId);
    const saved = this.progress[targetId];
    this.roomKills = Math.max(0, Number(saved?.kills) || 0);
    this.roomReady = !!(saved?.ready || this.cleared.has(targetId));
    this._storeCurrent();
    return true;
  }
  snapshot() {
    this._storeCurrent();
    return {
      stageId: this.stageId,
      layoutVersion: this.layoutVersion,
      roomStates: clonePlainState(this.roomStates),
      currentId: this.currentId,
      cleared: Array.from(this.cleared),
      visited: Array.from(this.visited),
      progress: { ...this.progress },
      specialRooms: { ...this.specialRooms },
      entryDirection: this.entryDirection,
      roomKills: this.roomKills,
      roomReady: this.roomReady
    };
  }
  mapModel() {
    const grid = Array.from({ length: 3 }, () => Array(3).fill(null));
    for (const baseNode of Object.values(this.nodes)) {
      const node = this.roomFor(baseNode.id);
      grid[node.gridY][node.gridX] = {
        ...node,
        state: node.id === this.currentId ? "current" : this.cleared.has(node.id) ? "cleared" : this.visited.has(node.id) ? "visited" : "locked"
      };
    }
    return { currentId: this.currentId, grid };
  }
};

// prototype-2d-pixel/src/ritual-animation.js
var RITUAL_ACTION_ASSETS = Object.freeze({
  boss: "./assets/enemies/boss-action-v1.png",
  ritual: "./assets/enemies/ritual-action-v1.png"
});
var RITUAL_ACTION_ROWS = Object.freeze({
  reaper: ["boss", 0],
  necromancer: ["boss", 1],
  ice_queen: ["boss", 2],
  void_lord: ["boss", 3],
  chrono_lich: ["ritual", 0],
  bramble_seer: ["ritual", 1],
  thread_chanter: ["ritual", 2],
  frost_eye: ["ritual", 3]
});
function ritualActionFrame(enemy, reducedMotion = false) {
  const cast = enemy.cast;
  if (reducedMotion || enemy.hp <= 0 || !cast || !Number.isFinite(cast.age)) return 0;
  if (cast.age < cast.warning) return 1;
  const release = cast.kind === "charge" ? cast.travel || 0 : Math.min(0.24, (cast.recovery || 0) / 2);
  return cast.age < cast.warning + release ? 2 : 3;
}
if (false)
  for (const [id, url] of Object.entries(RITUAL_ACTION_ASSETS)) {
    const state = { image: null, frames: null, error: null };
    atlases.set(id, state);
    const image = new (void 0)();
    image.onload = () => {
      try {
        const canvas = (void 0).createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(image, 0, 0);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        clearExteriorMatte(pixels.data, canvas.width, canvas.height);
        state.frames = locateHeroFrames(pixels.data, canvas.width, canvas.height);
        ctx.putImageData(pixels, 0, 0);
        state.image = canvas;
      } catch (error) {
        state.error = error.message;
      }
    };
    image.onerror = () => {
      state.error = "Ritual action atlas unavailable; original art remains active";
    };
    image.src = url;
  }

// prototype-2d-pixel/src/ground-loot.js
function snapshotGroundLoot(orbs = [], gameTime = 0) {
  return {
    savedAt: gameTime,
    orbs: orbs.filter((o) => !o.shouldRemove && o.life > 0).map((o) => ({
      x: o.x,
      y: o.y,
      value: o.value,
      life: o.life,
      magnetSpeed: o.magnetSpeed
    }))
  };
}
function restoreGroundLoot(snapshot, gameTime = 0) {
  if (!snapshot || !Array.isArray(snapshot.orbs)) return [];
  const elapsed = Number.isFinite(snapshot.savedAt) ? Math.max(0, gameTime - snapshot.savedAt) : 0;
  return snapshot.orbs.flatMap((o) => {
    if (!o || ![o.x, o.y, o.value, o.life].every(Number.isFinite) || o.value <= 0) return [];
    const life = Math.min(CONFIG.EXP_ORB_LIFETIME, o.life) - elapsed;
    if (life <= 0) return [];
    const orb = new ExpOrb(o.x, o.y, o.value);
    orb.life = life;
    orb.magnetSpeed = Math.min(560, Math.max(0, Number(o.magnetSpeed) || 0));
    return [orb];
  });
}

// prototype-2d-pixel/src/scene-offers.js
function sceneOffers(scene, candidates) {
  if (Array.isArray(scene.offers)) return scene.offers;
  const key = `${scene.id}|${scene.kind}|${scene.x}|${scene.y}|${scene.spawnedAt}`;
  let seed = 2166136261;
  for (const char of key) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
  const random = () => {
    seed = Math.imul(seed, 1664525) + 1013904223 >>> 0;
    return seed / 4294967296;
  };
  const pool = Array.from(new Map(candidates.map((c) => [`${c.kind}:${c.id}`, c])).values());
  const picked = [];
  for (const kind of ["weapon", "passive", "relic"]) {
    const group = pool.filter((c) => c.kind === kind);
    if (group.length) {
      const chosen = group[Math.floor(random() * group.length)];
      picked.push(chosen);
      pool.splice(pool.indexOf(chosen), 1);
    }
  }
  while (picked.length < 3 && pool.length)
    picked.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  if (!picked.length)
    picked.push({ kind: "supply", id: scene.kind === "shop" ? "recover" : "coins" });
  scene.offers = picked.map(({ kind, id }) => ({ kind, id, purchased: false }));
  return scene.offers;
}
function consumeSceneOffer(scene, choiceId) {
  const offer = scene.offers?.find((o) => `${o.kind}:${o.id}` === choiceId && !o.purchased);
  if (!offer) return false;
  offer.purchased = true;
  return true;
}

// prototype-2d-pixel/src/building-art.js
var BUILDING_COLUMNS = Object.freeze({
  shop: 0,
  pavilion: 0,
  relic: 1,
  ruin: 1,
  shrine: 1,
  event: 2,
  heal: 2,
  gate: 3
});
var ROWS = Object.freeze({ forest: 0, crypt: 1, tundra: 2 });
var NAMES = Object.freeze({
  forest: { shop: "\u7AF9\u6D77\u884C\u5546", relic: "\u85CF\u950B\u9057\u5E9C", heal: "\u542C\u96E8\u836F\u4EAD", event: "\u7EB8\u4EBA\u8336\u5C40" },
  crypt: { shop: "\u65E0\u706F\u9B3C\u5E02", relic: "\u5C01\u68FA\u5B9D\u5E93", heal: "\u8FD8\u9B42\u9999\u5802", event: "\u66FF\u8EAB\u8336\u53F0" },
  tundra: { shop: "\u9668\u94C1\u884C\u5546", relic: "\u5760\u661F\u89C2\u6D4B\u53F0", heal: "\u6708\u955C\u51B0\u6CC9", event: "\u5931\u6E29\u8336\u68DA" }
});
function buildingName(stageId, kind) {
  return (NAMES[stageId] || NAMES.forest)[kind];
}
var BANDS = [0, 0.355, 0.645, 1];
var atlas2 = null;
var sprites = /* @__PURE__ */ new Map();
if (false) {
  const image = new (void 0)();
  image.onload = () => {
    const canvas = (void 0).createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    clearExteriorMatte(pixels.data, canvas.width, canvas.height);
    ctx.putImageData(pixels, 0, 0);
    atlas2 = canvas;
  };
  image.src = "./assets/buildings/theme-buildings-atlas-v1.png";
}
function buildingCell(stageId, kind) {
  const column = BUILDING_COLUMNS[kind];
  return column === void 0 ? null : { column, row: ROWS[stageId] ?? 0 };
}
function isRetainedBuilding(object) {
  return !!(object?.used && object.closedBuilding && buildingCell("forest", object.kind));
}
function closedBuildingLabel(object) {
  if (!isRetainedBuilding(object)) return null;
  return {
    shop: "\u6B47\u4E1A \xB7 \u8D27\u54C1\u5DF2\u552E\u7F44",
    relic: "\u5DF2\u63A2\u7D22 \xB7 \u9547\u7269\u5DF2\u53D6\u8D70",
    heal: "\u5DF2\u7948\u996E \xB7 \u673A\u7F18\u5DF2\u7528",
    event: "\u8336\u5C40\u5DF2\u6563"
  }[object.kind] || "\u5DF2\u63A2\u7D22";
}
function fitBuildingSprite(width, height, size = 96) {
  if (!(width > 0 && height > 0 && Number.isFinite(width) && Number.isFinite(height)))
    return null;
  const scale = size / Math.max(width, height);
  return {
    x: (size - width * scale) / 2,
    y: size - height * scale,
    width: width * scale,
    height: height * scale
  };
}
function buildingBounds(object) {
  if (!buildingCell("forest", object?.kind)) return null;
  const radius = Number(object.radius) || 62;
  const halfWidth = Math.round(radius * 1.25);
  const halfHeight = Math.round(radius * 1.2);
  return {
    left: object.x - halfWidth,
    right: object.x + halfWidth,
    top: object.y - halfHeight,
    bottom: object.y + halfHeight
  };
}
function spriteFor(stageId, kind) {
  const cell = buildingCell(stageId, kind);
  if (!atlas2 || !cell) return null;
  const key = `${cell.row}:${cell.column}`;
  if (sprites.has(key)) return sprites.get(key);
  const cw = atlas2.width / 4;
  const y0 = Math.round(atlas2.height * BANDS[cell.row]);
  const y1 = Math.round(atlas2.height * BANDS[cell.row + 1]);
  const source = atlas2.getContext("2d").getImageData(Math.round(cell.column * cw), y0, Math.floor(cw), y1 - y0);
  let left = source.width, top = source.height, right = 0, bottom = 0;
  for (let y = 0; y < source.height; y++)
    for (let x = 0; x < source.width; x++) {
      if (source.data[(y * source.width + x) * 4 + 3] > 32) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  const canvas = (void 0).createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const fit = fitBuildingSprite(right - left + 1, bottom - top + 1);
  if (!fit) return null;
  ctx.drawImage(
    atlas2,
    Math.round(cell.column * cw) + left,
    y0 + top,
    right - left + 1,
    bottom - top + 1,
    fit.x,
    fit.y,
    fit.width,
    fit.height
  );
  sprites.set(key, canvas);
  return canvas;
}
function drawBuilding(ctx, object, stageId = "forest", nearby = false, decorative = false) {
  const sprite = spriteFor(stageId, object.kind);
  if (!sprite) return false;
  const box = buildingBounds(object), width = box.right - box.left, height = box.bottom - box.top;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "rgba(10,12,13,0.25)";
  ctx.fillRect(Math.round(box.left + 4), Math.round(box.bottom - 8), width, 12);
  const closed = closedBuildingLabel(object);
  if (closed) ctx.globalAlpha *= 0.68;
  const side = Math.min(width, height);
  ctx.drawImage(
    sprite,
    Math.round(object.x - side / 2),
    Math.round(box.bottom - side),
    side,
    side
  );
  if (closed) ctx.globalAlpha /= 0.68;
  if (nearby) {
    ctx.strokeStyle = "#eed493";
    ctx.lineWidth = 2;
    ctx.strokeRect(box.left - 3, box.top - 3, width + 6, height + 6);
  }
  if (!decorative || nearby) {
    const text = decorative ? "\u5C01\u5B58\u9057\u8FF9 \xB7 \u4E0D\u53EF\u8FDB\u5165" : closed ? `${object.name} \xB7 ${closed}` : object.name;
    ctx.font = "700 12px sans-serif";
    const labelWidth = Math.max(width, ctx.measureText(text).width + 16);
    ctx.fillStyle = "rgba(8,10,11,0.92)";
    ctx.fillRect(object.x - labelWidth / 2, box.top - 28, labelWidth, 22);
    ctx.fillStyle = "#f0ddb0";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, object.x, box.top - 17);
  }
  ctx.restore();
  return true;
}

// prototype-2d-pixel/src/world-map.js
var CHAPTER_REGIONS = Object.freeze([
  Object.freeze({
    id: "ferry",
    name: "\u7EB8\u7075\u6E21\u53E3",
    subtitle: "\u6D3B\u4EBA\u6B62\u6B65\uFF0C\u7EB8\u9A6C\u5148\u884C",
    guardian: "\u7EB8\u5AC1\u8863\u65E0\u5E38",
    unlockBoss: "reaper",
    bossAt: 300
  }),
  Object.freeze({
    id: "green-ruins",
    name: "\u9752\u5C71\u9057\u5E9C",
    subtitle: "\u5C71\u8179\u85CF\u7740\u524D\u671D\u9053\u85CF\u4E0E\u65AD\u5251",
    guardian: "\u65E0\u76F8\u661F\u541B",
    unlockBoss: "void_lord",
    bossAt: 600
  }),
  Object.freeze({
    id: "star-gate",
    name: "\u5929\u95E8\u846C\u661F\u53F0",
    subtitle: "\u7FA4\u661F\u5728\u95E8\u540E\u5012\u7740\u5347\u8D77",
    guardian: "\u592A\u5C81\u65F6\u8839",
    unlockBoss: "chrono_lich",
    bossAt: 720,
    final: true
  })
]);
var ARCHITECTURE_THEMES = Object.freeze({
  forest: Object.freeze({
    ground: "#9aa193",
    ink: "#162923",
    roof: "#24483c",
    wall: "#c6bfa9",
    accent: "#8b3f32",
    water: "#54756d",
    mapText: "#162923",
    names: Object.freeze([
      ["gate", "\u9752\u7BC6\u5C71\u95E8", "\u5B88\u4F4F\u901A\u5F80\u4E0B\u4E00\u754C\u7684\u5C71\u9053"],
      ["pavilion", "\u542C\u96E8\u836F\u4EAD", "\u53EF\u80FD\u9057\u7559\u529F\u6CD5\u6B8B\u9875\u4E0E\u7597\u4F24\u9053\u5177"],
      ["shrine", "\u65E0\u9762\u5C71\u7960", "\u4F9B\u684C\u540E\u85CF\u6709\u9057\u7269\u6216\u5E26\u4EE3\u4EF7\u547D\u5951"],
      ["ruin", "\u65AD\u5251\u9057\u5E9C", "\u53EF\u641C\u5BFB\u53E4\u88C5\u5907\u3001\u65E5\u5FD7\u4E0E\u878D\u5408\u7EBF\u7D22"]
    ])
  }),
  crypt: Object.freeze({
    ground: "#211a20",
    ink: "#09080b",
    roof: "#4b1f2d",
    wall: "#76666c",
    accent: "#b55245",
    water: "#3d2434",
    mapText: "#e8d8c4",
    names: Object.freeze([
      ["gate", "\u50A9\u620F\u57CE\u697C", "\u620F\u795E\u767B\u573A\u65F6\u57CE\u95E8\u624D\u4F1A\u5F20\u53E3"],
      ["pavilion", "\u65E0\u706F\u9B3C\u5E02\u68DA", "\u53EA\u6536\u672C\u5C40\u94DC\u94B1\u7684\u4E34\u65F6\u5546\u94FA"],
      ["shrine", "\u767E\u773C\u90AA\u7960", "\u53EF\u80FD\u57CB\u7740\u8BC5\u5492\u4E0E\u9AD8\u9636\u9057\u7269"],
      ["ruin", "\u7EB8\u68FA\u6863\u6848\u5E93", "\u8BB0\u5F55\u5931\u8E2A\u547D\u5951\u4E0E\u65E7\u65E5\u8DEF\u7EBF"]
    ])
  }),
  tundra: Object.freeze({
    ground: "#7b9299",
    ink: "#162631",
    roof: "#31546a",
    wall: "#bac9c8",
    accent: "#78506f",
    water: "#426878",
    mapText: "#162631",
    names: Object.freeze([
      ["gate", "\u661F\u9668\u5929\u5173", "\u51B0\u5C01\u95E8\u6D1E\u901A\u5411\u4E0B\u4E00\u5904\u65F6\u95F4\u88C2\u9699"],
      ["pavilion", "\u5931\u6E29\u70FD\u71E7", "\u53EF\u83B7\u5F97\u77ED\u6682\u5E87\u62A4\u6216\u5BD2\u7CFB\u529F\u6CD5"],
      ["shrine", "\u6708\u955C\u9F99\u7960", "\u9057\u7559\u9F99\u5973\u9057\u7269\u4E0E\u51BB\u7ED3\u547D\u5951"],
      ["ruin", "\u5760\u661F\u89C2\u6D4B\u53F0", "\u6563\u843D\u661F\u5916\u88C5\u5907\u4E0E\u89C2\u6D4B\u65E5\u5FD7"]
    ])
  })
});
var MAP_MARKER_STYLES = Object.freeze({
  player: Object.freeze({ label: "\u4F60", color: "#f6e7aa" }),
  boss: Object.freeze({ label: "\u65F6", color: "#e65d52" }),
  bossChest: Object.freeze({ label: "\u5323", color: "#e2b957" }),
  shop: Object.freeze({ label: "\u5E02", color: "#b66682" }),
  relic: Object.freeze({ label: "\u9057", color: "#79b999" }),
  log: Object.freeze({ label: "\u5FD7", color: "#a5b9c9" }),
  loot: Object.freeze({ label: "\u7269", color: "#d29762" }),
  event: Object.freeze({ label: "\u5F02", color: "#9b75bb" }),
  portal: Object.freeze({ label: "\u95E8", color: "#69c6c0" })
});
function estimateTravelSeconds(distance, speed = CONFIG.PLAYER_SPEED, combatFactor = 0.72) {
  const safeSpeed = Math.max(1, Number(speed) || CONFIG.PLAYER_SPEED);
  const factor = Math.max(0.25, Math.min(1, Number(combatFactor) || 0.72));
  return Math.max(0, Number(distance) || 0) / (safeSpeed * factor);
}
function endlessEventDistance(random = Math.random, speed = CONFIG.PLAYER_SPEED) {
  const roll = Math.max(0, Math.min(1, Number(random?.()) || 0));
  const targetTravelSeconds = 30 + roll * 45;
  return Math.round(Math.max(1, speed) * 0.72 * targetTravelSeconds);
}
function eventLifetimeForDistance(distance, speed = CONFIG.PLAYER_SPEED, baseLifetime = 360) {
  return Math.ceil(Math.max(baseLifetime, estimateTravelSeconds(distance, speed) + 240));
}
function projectMarker(marker, player, radius, worldRadius) {
  const dx = (marker.x || 0) - (player?.x || 0);
  const dy = (marker.y || 0) - (player?.y || 0);
  const distance = Math.hypot(dx, dy);
  const scale = radius / Math.max(1, worldRadius);
  const clamped = Math.min(radius - 8, distance * scale);
  const angle = Math.atan2(dy, dx);
  return {
    ...marker,
    mapX: Math.cos(angle) * clamped,
    mapY: Math.sin(angle) * clamped,
    distance,
    offMap: distance > worldRadius
  };
}
function hash2(x, y, salt = 0) {
  let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + salt * 69069;
  n = Math.imul(n ^ n >>> 13, 1274126177);
  return ((n ^ n >>> 16) >>> 0) / 4294967296;
}
function themeFor(stageId) {
  return ARCHITECTURE_THEMES[stageId] || ARCHITECTURE_THEMES.forest;
}
function structureRadius(kind) {
  return kind === "gate" ? 82 : kind === "ruin" ? 72 : 62;
}
var WorldMapSystem = class {
  constructor(game) {
    this.game = game;
    this.mode = "chapter";
    this.stageId = "forest";
    this.regionIndex = 0;
    this.portal = null;
    this.generatedCells = /* @__PURE__ */ new Map();
    this.visibleStructures = [];
    this.chapterStructures = [];
  }
  reset({ mode = "chapter", stageId = "forest", player } = {}) {
    this.mode = mode === "endless" ? "endless" : "chapter";
    this.stageId = stageId;
    this.regionIndex = 0;
    this.portal = null;
    this.generatedCells.clear();
    this.visibleStructures = [];
    this.chapterStructures = this._makeChapterStructures(0);
    this.update(player);
  }
  snapshot() {
    return {
      mode: this.mode,
      stageId: this.stageId,
      regionIndex: this.regionIndex,
      portal: this.portal ? { ...this.portal } : null
    };
  }
  restore(snapshot, player) {
    if (!snapshot) return;
    this.mode = snapshot.mode === "endless" ? "endless" : "chapter";
    this.stageId = snapshot.stageId || this.stageId;
    this.regionIndex = Math.max(
      0,
      Math.min(CHAPTER_REGIONS.length - 1, Number(snapshot.regionIndex) || 0)
    );
    this.portal = snapshot.portal ? { ...snapshot.portal } : null;
    this.chapterStructures = this._makeChapterStructures(this.regionIndex);
    this.update(player);
  }
  currentRegion() {
    return CHAPTER_REGIONS[this.regionIndex] || CHAPTER_REGIONS[0];
  }
  update(player) {
    if (!player) return;
    this.visibleStructures = this.mode === "endless" ? this._collectEndlessStructures(player) : [...this.chapterStructures];
    this._resolvePlayerBuildings(player);
  }
  resolveEntity(entity) {
    if (!entity) return;
    for (const structure of this.visibleStructures) {
      resolveRectObstacle(entity, buildingBounds(structure));
    }
  }
  projectileHit(ax, ay, bx, by, radius = 0) {
    let nearest = null;
    for (const object of [
      ...this.visibleStructures,
      ...this.game?.interactions?.objects || []
    ]) {
      if (object.used && !isRetainedBuilding(object) || object.solid === false) continue;
      const box = buildingBounds(object);
      if (!box) continue;
      const hit = segmentRectHit(ax, ay, bx, by, box, radius);
      if (hit && (!nearest || hit.t < nearest.t)) nearest = hit;
    }
    return nearest;
  }
  onBossDefeated(boss, player, gameTime = 0) {
    if (this.mode === "endless") return { victory: false, portal: null };
    const region = this.currentRegion();
    if (!boss || boss.id !== region.unlockBoss && boss.type?.sourceId !== region.unlockBoss)
      return { victory: false, portal: null };
    if (region.final) return { victory: true, portal: null };
    if (this.portal) return { victory: false, portal: this.portal };
    const x = Math.min(CONFIG.ARENA_WIDTH - 130, Math.max(130, (player?.x || 1200) + 520));
    const y = Math.min(CONFIG.ARENA_HEIGHT - 130, Math.max(130, player?.y || 800));
    this.portal = {
      id: `chapter_portal_${this.regionIndex}`,
      sourceId: "chapter_portal",
      kind: "portal",
      name: `\u901A\u5F80${CHAPTER_REGIONS[this.regionIndex + 1].name}`,
      glyph: "\u95E8",
      x,
      y,
      radius: 54,
      solid: true,
      oneShot: true,
      persistent: true,
      directorManaged: false,
      used: false,
      spawnedAt: gameTime,
      expiresAt: Infinity,
      description: "\u5B88\u5173\u8005\u5DF2\u706D\u3002\u9760\u8FD1\u540E\u786E\u8BA4\uFF0C\u7A7F\u8FC7\u5C71\u95E8\u8FDB\u5165\u4E0B\u4E00\u7247\u72EC\u7ACB\u533A\u57DF\u3002"
    };
    return { victory: false, portal: this.portal };
  }
  advanceRegion(player) {
    if (this.mode !== "chapter" || !this.portal || this.regionIndex >= CHAPTER_REGIONS.length - 1)
      return false;
    this.regionIndex += 1;
    this.portal = null;
    this.chapterStructures = this._makeChapterStructures(this.regionIndex);
    if (player) {
      player.x = CONFIG.CANVAS_WIDTH / 2;
      player.y = CONFIG.CANVAS_HEIGHT / 2;
    }
    this.update(player);
    return true;
  }
  getMarkers(game = this.game) {
    const markers = [];
    if (game?.player) {
      markers.push({ id: "player", kind: "player", x: game.player.x, y: game.player.y });
    }
    for (const object of game?.interactions?.objects || []) {
      if (object.used) continue;
      const kind = object.bossChest ? "bossChest" : object.kind === "shop" ? "shop" : object.kind === "relic" ? "relic" : object.kind === "log" ? "log" : object.kind === "portal" ? "portal" : object.kind === "event" ? "event" : "loot";
      markers.push({
        id: object.id,
        kind,
        name: object.name,
        x: object.x,
        y: object.y,
        expiresAt: object.expiresAt
      });
    }
    for (const boss of game?.enemies || []) {
      if (!boss.boss || boss.hp <= 0) continue;
      markers.push({
        id: `boss_${boss.id}`,
        kind: "boss",
        name: boss.type?.name,
        x: boss.x,
        y: boss.y
      });
    }
    return markers;
  }
  mapModel(game = this.game) {
    const current = this.currentRegion();
    return {
      mode: this.mode,
      stageId: this.stageId,
      regionIndex: this.regionIndex,
      current,
      regions: CHAPTER_REGIONS.map((region, index) => ({
        ...region,
        state: index < this.regionIndex ? "cleared" : index === this.regionIndex ? "current" : "locked"
      })),
      markers: this.getMarkers(game),
      structures: [...this.visibleStructures],
      route: game?.chapterRoute?.mapModel?.() || null
    };
  }
  drawMiniMap(canvas, game = this.game) {
    if (!canvas || !game?.player) return;
    const ctx = canvas.getContext?.("2d");
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    const radius = Math.min(width, height) / 2 - 8;
    const cx = width / 2;
    const cy = height / 2;
    const worldRadius = this.mode === "endless" ? 9e3 : Math.max(CONFIG.ARENA_WIDTH, CONFIG.ARENA_HEIGHT) * 0.58;
    const theme = themeFor(this.stageId);
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = theme.ground;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = `${theme.ink}55`;
    ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 24, cy - radius);
      ctx.lineTo(cx + i * 24, cy + radius);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy + i * 24);
      ctx.lineTo(cx + radius, cy + i * 24);
      ctx.stroke();
    }
    for (const marker of this.getMarkers(game)) {
      const p = projectMarker(marker, game.player, radius, worldRadius);
      const style = MAP_MARKER_STYLES[marker.kind] || MAP_MARKER_STYLES.loot;
      ctx.fillStyle = style.color;
      ctx.beginPath();
      ctx.arc(cx + p.mapX, cy + p.mapY, marker.kind === "player" ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
      if (p.offMap && marker.kind !== "player") {
        ctx.strokeStyle = "#f7e6a7";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    ctx.restore();
    ctx.strokeStyle = "#d3b879";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  drawFullMap(canvas, game = this.game, view = {}) {
    if (!canvas || !game?.player) return;
    const ctx = canvas.getContext?.("2d");
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    const theme = themeFor(this.stageId);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = theme.ground;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = `${theme.ink}44`;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    const baseWorldRadius = this.mode === "endless" ? 12e3 : Math.max(CONFIG.ARENA_WIDTH, CONFIG.ARENA_HEIGHT) * 0.7;
    const zoom = Math.max(0.65, Math.min(3, Number(view.zoom) || 1));
    const worldRadius = baseWorldRadius / zoom;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.44;
    const focus = {
      x: game.player.x + (Number(view.panX) || 0),
      y: game.player.y + (Number(view.panY) || 0)
    };
    for (const marker of this.getMarkers(game)) {
      const p = projectMarker(marker, focus, radius, worldRadius);
      const style = MAP_MARKER_STYLES[marker.kind] || MAP_MARKER_STYLES.loot;
      const x = cx + p.mapX;
      const y = cy + p.mapY;
      ctx.fillStyle = style.color;
      ctx.fillRect(x - 8, y - 8, 16, 16);
      ctx.fillStyle = "#0e1112";
      ctx.font = "700 10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(style.label, x, y + 1);
      if (marker.name && marker.kind !== "player") {
        ctx.fillStyle = theme.mapText;
        ctx.font = "11px sans-serif";
        ctx.fillText(marker.name, x, y - 15);
      }
    }
    ctx.fillStyle = theme.mapText;
    ctx.font = "700 13px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(
      this.mode === "endless" ? `\u5730\u56FE\u968F\u4EBA\u7269\u79FB\u52A8 \xB7 ${Math.round(zoom * 100)}% \xB7 \u62D6\u52A8\u67E5\u770B\u8FDC\u65B9` : `\u5F53\u524D\u533A\u57DF\uFF1A${game.chapterRoute?.current?.().name || this.currentRegion().name}`,
      16,
      24
    );
  }
  render(ctx) {
    for (const structure of this.visibleStructures) this._drawStructure(ctx, structure);
  }
  _makeChapterStructures(regionIndex) {
    const node = this.game?.chapterRoute?.current?.();
    if (node?.type !== "boss") return [];
    const kindByRoom = {
      shop: "pavilion",
      shrine: "shrine",
      reward: "ruin",
      event: "ruin",
      gold: "pavilion",
      boss: "gate"
    };
    const kind = kindByRoom[node?.type];
    if (!kind) return [];
    const structure = this._structureFromSeed(
      CONFIG.ARENA_WIDTH / 2,
      300,
      regionIndex * 17 + Math.round((node?.threatBonus || 0) * 100)
    );
    structure.kind = kind;
    structure.radius = structureRadius(kind);
    structure.name = node?.name || structure.name;
    structure.rewardHint = node?.label || structure.rewardHint;
    return [structure];
  }
  configureChapterRoom(node, player) {
    if (this.mode !== "chapter") return;
    this.chapterStructures = this._makeChapterStructures(
      Math.round((node?.threatBonus || 0) * 100)
    );
    this.visibleStructures = [...this.chapterStructures];
    this.portal = null;
    this.update(player);
  }
  _collectEndlessStructures(player) {
    const cellSize = 1800;
    const cellX = Math.floor(player.x / cellSize);
    const cellY = Math.floor(player.y / cellSize);
    const result = [];
    for (let yy = cellY - 1; yy <= cellY + 1; yy += 1) {
      for (let xx = cellX - 1; xx <= cellX + 1; xx += 1) {
        const key = `${xx}:${yy}:${this.stageId}`;
        if (!this.generatedCells.has(key)) {
          const list = [];
          for (let i = 0; i < 1; i += 1) {
            const x = xx * cellSize + 260 + hash2(xx, yy, i * 5 + 1) * (cellSize - 520);
            const y = yy * cellSize + 260 + hash2(xx, yy, i * 5 + 2) * (cellSize - 520);
            const structure = this._structureFromSeed(x, y, xx * 31 + yy * 17 + i);
            structure.kind = "gate";
            list.push(structure);
          }
          this.generatedCells.set(key, list);
        }
        result.push(...this.generatedCells.get(key));
      }
    }
    return result;
  }
  _structureFromSeed(x, y, seed) {
    const theme = themeFor(this.stageId);
    const index = Math.abs(Math.floor(seed)) % theme.names.length;
    const [kind, name, rewardHint] = theme.names[index];
    return {
      id: `building_${Math.round(x)}_${Math.round(y)}`,
      kind,
      name,
      rewardHint,
      x,
      y,
      radius: structureRadius(kind)
    };
  }
  _resolvePlayerBuildings(player) {
    this.resolveEntity(player);
  }
  _drawStructure(ctx, structure) {
    const player = this.game?.player;
    const near = player && Math.hypot(player.x - structure.x, player.y - structure.y) < 230;
    if (drawBuilding(ctx, structure, this.stageId, near, true)) return;
    const theme = themeFor(this.stageId);
    const x = Math.round(structure.x);
    const y = Math.round(structure.y);
    const r = structure.radius;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(-r + 8, r - 4, r * 2, 18);
    if (structure.kind === "gate") {
      ctx.fillStyle = theme.wall;
      ctx.fillRect(-r, -18, 24, 70);
      ctx.fillRect(r - 24, -18, 24, 70);
      ctx.fillStyle = theme.roof;
      ctx.fillRect(-r - 12, -44, r * 2 + 24, 26);
      ctx.fillRect(-r + 4, -58, r * 2 - 8, 14);
      ctx.fillStyle = theme.accent;
      ctx.fillRect(-12, -40, 24, 22);
    } else if (structure.kind === "pavilion") {
      ctx.fillStyle = theme.wall;
      ctx.fillRect(-r + 12, -10, r * 2 - 24, 58);
      ctx.fillStyle = theme.roof;
      ctx.fillRect(-r, -40, r * 2, 22);
      ctx.fillRect(-r + 12, -54, r * 2 - 24, 14);
      ctx.fillStyle = theme.accent;
      ctx.fillRect(-6, 8, 12, 40);
    } else if (structure.kind === "shrine") {
      ctx.fillStyle = theme.wall;
      ctx.fillRect(-r + 10, -22, r * 2 - 20, 68);
      ctx.fillStyle = theme.roof;
      ctx.fillRect(-r, -46, r * 2, 24);
      ctx.fillStyle = theme.accent;
      ctx.fillRect(-18, -8, 36, 34);
      ctx.fillStyle = "#171518";
      ctx.fillRect(-7, 0, 14, 18);
    } else {
      ctx.fillStyle = theme.wall;
      ctx.fillRect(-r, -12, 34, 58);
      ctx.fillRect(-8, -36, 30, 82);
      ctx.fillRect(38, 2, 24, 44);
      ctx.fillStyle = theme.ink;
      ctx.fillRect(-r - 8, 44, r * 2 + 16, 8);
      ctx.fillStyle = theme.accent;
      ctx.fillRect(-1, -28, 8, 18);
    }
    ctx.fillStyle = "rgba(8,10,11,0.84)";
    ctx.fillRect(-r, r + 17, r * 2, 20);
    ctx.fillStyle = "#ead8a8";
    ctx.font = "700 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(structure.name, 0, r + 27);
    ctx.restore();
  }
};

// prototype-2d-pixel/src/interactions.js
var INTERACTION_DISTANCE = 92;
var EVENT_RULES = Object.freeze({
  chapter: Object.freeze({ firstMin: 35, firstMax: 75, gapMin: 120, gapMax: 190, maxScenes: 5 }),
  endless: Object.freeze({
    firstMin: 35,
    firstMax: 75,
    gapMin: 130,
    gapMax: 210,
    maxScenes: Infinity
  })
});
var WORLD_INTERACTIONS = Object.freeze([
  Object.freeze({
    id: "ghost_market",
    kind: "shop",
    name: "\u65E0\u706F\u9B3C\u5E02",
    glyph: "\u5E02",
    radius: 62,
    solid: true,
    oneShot: false,
    lifetime: 480,
    description: "\u4F7F\u7528\u672C\u5C40\u94DC\u94B1\u4EA4\u6613\uFF0C\u6BCF\u5EA7\u6700\u591A\u6210\u4EA4\u4E09\u6B21\uFF1B\u6BCF\u4EF6\u9650\u8D2D\u4E00\u6B21\u3002\u8D27\u54C1\u56FA\u5B9A\uFF0C\u5173\u95ED\u6216\u8BFB\u6863\u4E0D\u4F1A\u6362\u8D27\u3002"
  }),
  Object.freeze({
    id: "relic_ruin",
    kind: "relic",
    name: "\u9752\u5C71\u9057\u5E9C",
    glyph: "\u9057",
    radius: 68,
    solid: true,
    oneShot: true,
    lifetime: 540,
    description: "\u5C71\u8179\u6B8B\u5B58\u7684\u524D\u671D\u9053\u5E9C\u3002\u8FDB\u5165\u540E\u53EF\u4ECE\u5F53\u524D\u63D0\u4F9B\u7684\u9057\u7269\u4E2D\u62E9\u4E00\u3002"
  }),
  Object.freeze({
    id: "lost_log",
    kind: "log",
    name: "\u7EB8\u68FA\u884C\u65E5\u5FD7",
    glyph: "\u5FD7",
    radius: 24,
    solid: false,
    oneShot: true,
    lifetime: Infinity,
    description: "\u6563\u843D\u5728\u9053\u8DEF\u4E0E\u6B8B\u57A3\u65C1\u7684\u884C\u65C5\u8BB0\u5F55\u3002\u53EA\u8865\u5168\u4E16\u754C\u7EBF\u7D22\uFF0C\u4E0D\u5360\u636E\u7279\u6B8A\u623F\u95F4\u3002"
  }),
  Object.freeze({
    id: "scattered_cache",
    kind: "loot",
    name: "\u5931\u4E3B\u884C\u56CA",
    glyph: "\u7269",
    radius: 34,
    solid: true,
    oneShot: true,
    lifetime: 420,
    description: "\u524D\u4EBA\u9057\u843D\u7684\u9053\u5177\u4E0E\u88C5\u5907\u7BB1\uFF0C\u4E0D\u4E0E Boss \u6218\u5229\u54C1\u5171\u7528\u6389\u843D\u89C4\u5219\u3002"
  }),
  Object.freeze({
    id: "paper_tea",
    kind: "event",
    name: "\u7EB8\u4EBA\u8336\u644A",
    glyph: "\u5F02",
    radius: 52,
    solid: true,
    oneShot: true,
    lifetime: 480,
    description: "\u7EB8\u4EBA\u66FF\u4F60\u659F\u4E0B\u4E00\u76CF\u65E7\u8336\u3002\u4E24\u79CD\u9009\u62E9\u90FD\u6709\u4EE3\u4EF7\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u786E\u8BA4\u3002"
  })
]);
var DIRECTOR_INTERACTIONS = WORLD_INTERACTIONS.filter((item) => item.id !== "lost_log");
function eventDelay(mode = "chapter", random = Math.random, first = false) {
  const rules = EVENT_RULES[mode] || EVENT_RULES.chapter;
  const min = first ? rules.firstMin : rules.gapMin;
  const max = first ? rules.firstMax : rules.gapMax;
  return min + (max - min) * Math.max(0, Math.min(1, Number(random()) || 0));
}
function directionLabel(dx, dy) {
  const index = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
  return ["\u4E1C", "\u4E1C\u5357", "\u5357", "\u897F\u5357", "\u897F", "\u897F\u5317", "\u5317", "\u4E1C\u5317"][(index + 8) % 8];
}
var InteractionSystem = class {
  constructor(game) {
    this.game = game;
    this.objects = [];
    this.nearby = null;
    this.mode = "chapter";
    this.random = Math.random;
    this.spawned = 0;
    this.nextSpawnAt = Infinity;
    this.qa = false;
    this.lastSourceId = null;
  }
  reset(player, { mode = "chapter", random = Math.random, qa = false } = {}) {
    this.nearby = null;
    this.objects = [];
    this.mode = mode === "endless" ? "endless" : "chapter";
    this.random = typeof random === "function" ? random : Math.random;
    this.spawned = 0;
    this.qa = !!qa;
    this.lastSourceId = null;
    this.nextSpawnAt = qa ? 2 : eventDelay(this.mode, this.random, true);
    this.game?.ui?.hideInteractionPrompt?.();
    this.game?.ui?.updateWorldEventTracker?.(null);
  }
  update(player, gameTime = this.game?.gameTime || 0) {
    if (!player) return null;
    this.objects = this.objects.filter((obj) => {
      if (!obj.used) return true;
      return isRetainedBuilding(obj) && (obj.persistent || !Number.isFinite(obj.expiresAt) || obj.expiresAt > gameTime);
    });
    const expired = this.objects.find(
      (obj) => !obj.used && Number.isFinite(obj.expiresAt) && obj.expiresAt <= gameTime
    );
    if (expired) this.complete(expired.id, gameTime, "\u6D88\u6563");
    if (!this.activeObject() && this._canSpawn(gameTime)) this._spawn(player, gameTime);
    this._resolvePlayerObstacles(player);
    let nearest = null;
    let best = Infinity;
    for (const obj of this.objects) {
      if (obj.used) continue;
      const d = Math.hypot(player.x - obj.x, player.y - obj.y);
      if (d <= INTERACTION_DISTANCE + obj.radius && d < best) {
        nearest = obj;
        best = d;
      }
    }
    if (nearest?.id !== this.nearby?.id) {
      this.nearby = nearest;
      if (nearest) this.game?.ui?.showInteractionPrompt?.(nearest);
      else this.game?.ui?.hideInteractionPrompt?.();
    }
    this.game?.ui?.updateWorldEventTracker?.(this.getTracker(player, gameTime));
    return nearest;
  }
  _canSpawn(gameTime) {
    const limit = (EVENT_RULES[this.mode] || EVENT_RULES.chapter).maxScenes;
    return this.spawned < limit && gameTime >= this.nextSpawnAt;
  }
  _spawn(player, gameTime, forcedSourceId = null) {
    const roll = Math.min(0.999999, Math.max(0, Number(this.random()) || 0));
    let def = forcedSourceId ? WORLD_INTERACTIONS.find((item) => item.id === forcedSourceId) : DIRECTOR_INTERACTIONS[Math.floor(roll * DIRECTOR_INTERACTIONS.length)];
    def || (def = DIRECTOR_INTERACTIONS[0]);
    if (!forcedSourceId && def.id === this.lastSourceId) {
      def = DIRECTOR_INTERACTIONS[(DIRECTOR_INTERACTIONS.indexOf(def) + 1) % DIRECTOR_INTERACTIONS.length];
    }
    this.lastSourceId = def.id;
    const angle = this.random() * Math.PI * 2;
    const distance = this.qa ? 420 : this.mode === "endless" ? endlessEventDistance(this.random, CONFIG.PLAYER_SPEED) : 520 + this.random() * 520;
    let x = player.x + Math.cos(angle) * distance;
    let y = player.y + Math.sin(angle) * distance;
    if (this.mode === "chapter") {
      x = Math.max(70, Math.min((CONFIG.ARENA_WIDTH || 2400) - 70, x));
      y = Math.max(70, Math.min((CONFIG.ARENA_HEIGHT || 1600) - 70, y));
    }
    const obj = {
      ...def,
      name: buildingName(this.game?.stageId, def.kind) || def.name,
      id: `${def.id}_${this.spawned + 1}`,
      sourceId: def.id,
      x,
      y,
      used: false,
      purchaseCount: 0,
      directorManaged: true,
      persistent: false,
      travelSeconds: Math.ceil(distance / Math.max(1, CONFIG.PLAYER_SPEED * 0.72)),
      spawnedAt: gameTime,
      expiresAt: gameTime + (this.qa ? 90 : eventLifetimeForDistance(distance, CONFIG.PLAYER_SPEED, def.lifetime))
    };
    this.objects.push(obj);
    this.spawned += 1;
    this.nextSpawnAt = Infinity;
    this.game?._announce?.(
      `\u5173\u952E\u5730\u70B9\u51FA\u73B0\uFF1A${obj.name}\u3002\u5C0F\u5730\u56FE\u5DF2\u6807\u51FA\u4F4D\u7F6E\uFF0C\u9884\u8BA1 ${obj.travelSeconds} \u79D2\u5185\u53EF\u5230\u8FBE\u3002`
    );
    return obj;
  }
  activeObject() {
    return this.objects.find((obj) => !obj.used && obj.directorManaged !== false) || null;
  }
  getTracker(player, gameTime = this.game?.gameTime || 0) {
    const obj = this.activeObject();
    if (!obj || !player) return null;
    const dx = obj.x - player.x;
    const dy = obj.y - player.y;
    return {
      name: obj.name,
      glyph: obj.glyph,
      direction: directionLabel(dx, dy),
      distance: Math.max(0, Math.round(Math.hypot(dx, dy) / 10)),
      remaining: Math.max(0, Math.ceil(obj.expiresAt - gameTime))
    };
  }
  useNearby() {
    if (!this.nearby) return false;
    return !!this.game?.openWorldInteraction?.(this.nearby);
  }
  complete(id, gameTime = this.game?.gameTime || 0, reason = "\u5B8C\u6210") {
    const obj = this.objects.find((item) => item.id === id);
    if (!obj || obj.used) return false;
    obj.used = true;
    obj.closedBuilding = reason !== "\u6D88\u6563" && !!buildingBounds(obj);
    if (this.nearby?.id === id) {
      this.nearby = null;
      this.game?.ui?.hideInteractionPrompt?.();
    }
    const rules = EVENT_RULES[this.mode] || EVENT_RULES.chapter;
    if (obj.directorManaged !== false) {
      this.nextSpawnAt = this.spawned >= rules.maxScenes ? Infinity : gameTime + (this.qa ? 4 : eventDelay(this.mode, this.random, false));
    }
    this.game?.ui?.updateWorldEventTracker?.(null);
    if (reason === "\u6D88\u6563") this.game?._announce?.(`${obj.name}\u672A\u88AB\u89E6\u53CA\uFF0C\u5DF2\u4ECE\u5C71\u6D77\u95F4\u6D88\u6563\u3002`);
    return true;
  }
  markUsed(id) {
    return this.complete(id);
  }
  spawnBossChest(x, y, bossName = "\u65F6\u95F4 Boss", gameTime = this.game?.gameTime || 0) {
    const chest = {
      id: `boss_chest_${Math.round(gameTime * 1e3)}_${this.objects.length}`,
      sourceId: "boss_chest",
      kind: "chest",
      name: `${bossName} \xB7 \u9547\u7269\u5B9D\u5323`,
      glyph: "\u5323",
      radius: 42,
      solid: true,
      oneShot: true,
      bossChest: true,
      directorManaged: false,
      persistent: true,
      used: false,
      purchaseCount: 0,
      spawnedAt: gameTime,
      expiresAt: Infinity,
      description: "\u65F6\u95F4 Boss \u9057\u7559\u7684\u5B9D\u5323\u3002\u53EF\u83B7\u5F97\u6B66\u5668/\u529F\u6CD5\u5347\u7EA7\u3001\u5929\u8D4B\u5F3A\u5316\u6216\u9057\u7269\u4E09\u9009\u4E00\u3002",
      x,
      y
    };
    this.objects.push(chest);
    this.game?._announce?.(`${bossName}\u6389\u843D\u9547\u7269\u5B9D\u5323\uFF1B\u5B9D\u5323\u4E0D\u4F1A\u968F\u65F6\u95F4\u6D88\u5931\u3002`);
    return chest;
  }
  spawnFixture(sourceId, x, y, overrides = {}) {
    const def = WORLD_INTERACTIONS.find((item) => item.id === sourceId) || WORLD_INTERACTIONS[0];
    const fixture = {
      ...def,
      name: buildingName(this.game?.stageId, overrides.kind || def.kind) || def.name,
      ...overrides,
      id: overrides.id || `fixture_${sourceId}_${this.objects.length}`,
      sourceId,
      x,
      y,
      directorManaged: false,
      persistent: true,
      used: false,
      purchaseCount: 0,
      spawnedAt: this.game?.gameTime || 0,
      expiresAt: Infinity
    };
    this.objects.push(fixture);
    return fixture;
  }
  spawnAmbientLog(player, roomId = "room") {
    if (!player) return null;
    const angle = this.random() * Math.PI * 2;
    const distance = 320 + this.random() * 520;
    const x = Math.max(
      90,
      Math.min((CONFIG.ARENA_WIDTH || 3600) - 90, player.x + Math.cos(angle) * distance)
    );
    const y = Math.max(
      90,
      Math.min((CONFIG.ARENA_HEIGHT || 2400) - 90, player.y + Math.sin(angle) * distance)
    );
    return this.spawnFixture("lost_log", x, y, {
      id: `ambient_log_${roomId}_${this.objects.length}`,
      name: "\u6563\u843D\u7684\u547D\u5951\u6B8B\u9875",
      solid: false,
      persistent: false,
      description: "\u4E00\u9875\u88AB\u98CE\u5439\u5230\u6B64\u5904\u7684\u65E7\u8BB0\u5F55\u3002\u9605\u8BFB\u53EA\u8865\u5168\u56FE\u9274\u4E0E\u4E16\u754C\u7EBF\u7D22\u3002"
    });
  }
  spawnPortal(portal) {
    if (!portal || this.objects.some((obj) => obj.id === portal.id && !obj.used)) return null;
    const copy = { ...portal };
    this.objects.push(copy);
    return copy;
  }
  enterChapterRegion(player, gameTime = this.game?.gameTime || 0) {
    for (const object of this.objects) {
      object.used = true;
      object.closedBuilding = false;
    }
    this.nearby = null;
    this.game?.ui?.hideInteractionPrompt?.();
    this.nextSpawnAt = gameTime + eventDelay("chapter", this.random, false);
    this.game?.ui?.updateWorldEventTracker?.(null);
    this.update(player, gameTime);
  }
  snapshot() {
    return {
      mode: this.mode,
      spawned: this.spawned,
      nextSpawnAt: this.nextSpawnAt,
      lastSourceId: this.lastSourceId,
      objects: this.objects.filter((obj) => !obj.used || isRetainedBuilding(obj)).map((obj) => ({
        ...obj,
        ...obj.offers ? { offers: obj.offers.map((offer) => ({ ...offer })) } : {},
        expiresAt: Number.isFinite(obj.expiresAt) ? obj.expiresAt : null
      }))
    };
  }
  restore(snapshot, player) {
    if (!snapshot) return false;
    this.mode = snapshot.mode === "endless" ? "endless" : "chapter";
    this.spawned = Math.max(0, Number(snapshot.spawned) || 0);
    this.nextSpawnAt = snapshot.nextSpawnAt === null || snapshot.nextSpawnAt === Infinity ? Infinity : Number.isFinite(snapshot.nextSpawnAt) ? snapshot.nextSpawnAt : eventDelay(this.mode, this.random, false);
    this.lastSourceId = snapshot.lastSourceId || null;
    this.objects = Array.isArray(snapshot.objects) ? snapshot.objects.map((obj) => ({
      ...obj,
      ...Array.isArray(obj.offers) ? {
        offers: obj.offers.slice(0, 3).filter(
          (offer) => offer && ["weapon", "passive", "relic", "supply"].includes(
            offer.kind
          ) && typeof offer.id === "string"
        ).map((offer) => ({
          kind: offer.kind,
          id: offer.id,
          purchased: !!offer.purchased
        }))
      } : { offers: void 0 },
      used: !!obj.used,
      closedBuilding: !!obj.closedBuilding && !!obj.used && !!buildingBounds(obj),
      expiresAt: obj.expiresAt == null && obj.persistent ? Infinity : obj.expiresAt
    })) : [];
    this.nearby = null;
    this.update(player, this.game?.gameTime || 0);
    return true;
  }
  _resolvePlayerObstacles(player) {
    this.resolveEntity(player);
  }
  resolveEntity(player) {
    for (const obj of this.objects) {
      if (!obj.solid || obj.used && !isRetainedBuilding(obj)) continue;
      const box = buildingBounds(obj);
      if (box) resolveRectObstacle(player, box);
      else resolveCircleObstacle(player, obj);
    }
  }
  render(ctx) {
    for (const obj of this.objects) {
      if (obj.used && !isRetainedBuilding(obj)) continue;
      if (drawBuilding(ctx, obj, this.game?.stageId, this.nearby?.id === obj.id)) continue;
      const s = Math.round(obj.radius);
      ctx.save();
      ctx.translate(Math.round(obj.x), Math.round(obj.y));
      this._renderObject(ctx, obj, s);
      if (this.nearby?.id === obj.id) {
        ctx.strokeStyle = "#f1d58b";
        ctx.lineWidth = 3;
        ctx.strokeRect(-s - 5, -s - 5, s * 2 + 10, s * 2 + 10);
      }
      ctx.restore();
    }
  }
  _renderObject(ctx, obj, s) {
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fillRect(-s - 8, s - 6, (s + 8) * 2, 16);
    if (obj.kind === "shop") {
      ctx.fillStyle = "#4a2231";
      ctx.fillRect(-s, -22, s * 2, s + 28);
      ctx.fillStyle = "#8e3f55";
      ctx.fillRect(-s - 12, -42, s * 2 + 24, 20);
      ctx.fillStyle = "#d2a859";
      for (let x = -s + 8; x < s; x += 20) ctx.fillRect(x, -36, 10, 10);
    } else if (obj.kind === "relic") {
      ctx.fillStyle = "#5d665d";
      ctx.fillRect(-s, -20, 34, s + 24);
      ctx.fillRect(-8, -56, 38, s + 60);
      ctx.fillRect(s - 26, 4, 24, s);
      ctx.fillStyle = "#74a78d";
      ctx.fillRect(-2, -48, 10, 24);
    } else if (obj.kind === "event") {
      ctx.fillStyle = "#3f2b49";
      ctx.fillRect(-s, -18, s * 2, s + 24);
      ctx.fillStyle = "#75518a";
      ctx.fillRect(-s - 10, -38, s * 2 + 20, 20);
      ctx.fillStyle = "#d7c4a1";
      ctx.fillRect(-24, 8, 48, 14);
    } else if (obj.kind === "portal") {
      ctx.fillStyle = "#263f45";
      ctx.fillRect(-s, -s, 18, s * 2);
      ctx.fillRect(s - 18, -s, 18, s * 2);
      ctx.fillRect(-s, -s, s * 2, 20);
      ctx.strokeStyle = "#63c8c0";
      ctx.lineWidth = 5;
      ctx.strokeRect(-s + 22, -s + 24, s * 2 - 44, s * 2 - 28);
    } else if (obj.bossChest || obj.kind === "chest") {
      ctx.fillStyle = "#503421";
      ctx.fillRect(-s, -18, s * 2, s + 22);
      ctx.fillStyle = "#c49a45";
      ctx.fillRect(-s, -30, s * 2, 16);
      ctx.fillRect(-6, -12, 12, s + 16);
    } else {
      ctx.fillStyle = "#4f4841";
      ctx.fillRect(-s, -s / 2, s * 2, s);
      ctx.fillStyle = "#b89458";
      ctx.fillRect(-s + 6, -s / 2 + 6, s * 2 - 12, 8);
    }
    ctx.fillStyle = "#151318";
    ctx.fillRect(-18, -4, 36, 30);
    ctx.fillStyle = "#ead59a";
    ctx.font = "700 18px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(obj.glyph, 0, 12);
    ctx.font = "700 11px sans-serif";
    const closed = closedBuildingLabel(obj), text = closed ? `${obj.name} \xB7 ${closed}` : obj.name;
    const labelWidth = Math.max(s * 2, ctx.measureText(text).width + 12);
    const y = buildingBounds(obj) ? -s * 1.2 - 27 : s + 12;
    ctx.fillStyle = "rgba(8,8,10,0.88)";
    ctx.fillRect(-labelWidth / 2, y, labelWidth, 20);
    ctx.fillStyle = "#e5d19e";
    ctx.fillText(text, 0, y + 10);
  }
};

// prototype-2d-pixel/src/collection.js
var EVENT_CATALOGUE = Object.freeze([
  ...WORLD_INTERACTIONS.map((def) => ({
    id: def.id,
    name: def.name,
    description: def.description,
    artId: { shop: "retro_blaster", relic: "star", log: "paper", loot: "orbit", event: "seal" }[def.kind],
    condition: {
      shop: "\u4F7F\u7528\u672C\u5C40\u94DC\u94B1\u5B8C\u6210\u4E00\u7B14\u4EA4\u6613\u540E\u8BB0\u5F55\uFF1B\u4EF7\u683C\u968F\u65F6\u95F4\u3001\u8D2D\u4E70\u6B21\u6570\u4E0E\u5DF2\u6709\u7B49\u7EA7\u589E\u957F\uFF0C\u6BCF\u5EA7\u6700\u591A\u6210\u4EA4\u4E09\u6B21\u3002",
      relic: "\u4ECE\u5F53\u524D\u63D0\u4F9B\u7684\u9057\u7269\u4E2D\u786E\u8BA4\u9886\u53D6\u540E\u8BB0\u5F55\uFF1B\u9057\u7269\u4F4D\u6EE1\u65F6\u53EF\u6539\u53D6\u94DC\u94B1\u3002",
      log: "\u786E\u8BA4\u8BFB\u5B8C\u540E\u8BB0\u5F55\uFF1B\u53EA\u8865\u5168\u4E16\u754C\u7EBF\u7D22\uFF0C\u4E0D\u589E\u52A0\u6218\u529B\uFF0C\u4E5F\u4E0D\u5360\u88C5\u5907\u4F4D\u3002",
      loot: "\u786E\u8BA4\u9886\u53D6\u4E00\u4EF6\u9053\u5177\u6216\u5347\u7EA7\u540E\u8BB0\u5F55\uFF1B\u5956\u52B1\u53EA\u53EF\u9886\u53D6\u4E00\u6B21\u3002",
      event: "\u786E\u8BA4\u559D\u8336\u6216\u5356\u540D\u540E\u8BB0\u5F55\uFF1B\u9009\u62E9\u6539\u53D8\u672C\u5C40\u6536\u76CA\uFF0C\u4E5F\u6709\u751F\u547D\u6216\u627F\u4F24\u4EE3\u4EF7\u3002"
    }[def.kind]
  })),
  {
    id: "boss_chest",
    name: "\u9547\u7269\u5B9D\u5323",
    artId: "orbit",
    description: "\u9996\u9886\u9057\u9AB8\u4E0E\u5DF2\u6E05\u7406\u7684\u623F\u95F4\u7559\u4E0B\u7684\u9547\u7269\uFF0C\u65E7\u4E3B\u8FD8\u6B20\u7740\u5C71\u6D77\u4E00\u4EFD\u62A5\u916C\u3002",
    condition: "\u786E\u8BA4\u9886\u53D6\u5956\u52B1\u540E\u8BB0\u5F55\uFF1B\u5B9D\u5323\u4E0D\u968F\u65F6\u95F4\u6D88\u5931\uFF0C\u6BCF\u4E2A\u53EA\u53EF\u9886\u53D6\u4E00\u6B21\u3002"
  },
  {
    id: "shrine",
    name: "\u9752\u5C71\u5723\u6C34",
    artId: "garlic",
    description: "\u4F9B\u5728\u6062\u590D\u623F\u4E2D\u7684\u65E7\u6CC9\uFF0C\u53EF\u996E\u4E0B\u7597\u4F24\uFF0C\u4E5F\u53EF\u501F\u5B83\u6DEC\u70BC\u8089\u8EAB\u3002",
    condition: "\u786E\u8BA4\u996E\u6C34\u6216\u6DEC\u4F53\u540E\u8BB0\u5F55\uFF1B\u6BCF\u5EA7\u6062\u590D\u623F\u53EA\u80FD\u9009\u4E00\u6B21\uFF0C\u672C\u5C40\u6709\u6548\u3002"
  }
]);
function eventDiscoveryId(interaction) {
  if (interaction?.kind === "heal") return "shrine";
  if (interaction?.kind === "portal" || interaction?.kind === "map") return null;
  return EVENT_CATALOGUE.some((entry) => entry.id === interaction?.sourceId) ? interaction.sourceId : null;
}
var COLLECTION_KINDS = Object.freeze([
  "heroes",
  "monsters",
  "weapons",
  "passives",
  "relics",
  "curses",
  "fusions",
  "reactions",
  "events"
]);
function emptyCollection() {
  return Object.fromEntries(COLLECTION_KINDS.map((kind) => [kind, []]));
}
function ensureCollection(save) {
  save.collection || (save.collection = emptyCollection());
  for (const kind of COLLECTION_KINDS) {
    if (!Array.isArray(save.collection[kind])) save.collection[kind] = [];
  }
  return save.collection;
}
function recordDiscovery(save, kind, id) {
  if (!save || !COLLECTION_KINDS.includes(kind) || !id) return false;
  const collection = ensureCollection(save);
  if (collection[kind].includes(id)) return false;
  collection[kind].push(id);
  return true;
}
function catalogue() {
  const mechanismDescriptions = ["\u8FFD\u9010\u56F4\u730E", "\u9AD8\u901F\u51B2\u649E", "\u8FDC\u7A0B\u5F02\u672F", "\u91CD\u7532\u538B\u8FEB"];
  const monsters = Object.values(ENEMY_THEME_SKINS).flatMap(
    (set) => set.map((skin, index) => ({
      ...skin,
      description: `${mechanismDescriptions[index]}\u578B\u90AA\u7269\uFF1B\u5728\u5BF9\u5E94\u4E3B\u9898\u5730\u56FE\u62E5\u6709\u72EC\u7ACB\u7ACB\u7ED8\u3001\u914D\u8272\u548C\u5F39\u9053\u3002`
    }))
  );
  const controlStages = { bramble_seer: "forest", thread_chanter: "crypt", frost_eye: "tundra" };
  for (const boss of Object.values(BOSSES)) {
    monsters.push({
      id: boss.id,
      name: boss.name,
      atlasColumn: 3,
      atlasRow: 1,
      description: "\u9547\u5B88\u90AA\u7269\uFF1B\u72EC\u7ACB\u50CF\u7D20\u7ACB\u7ED8\u3002\u62DB\u5F0F\u5148\u663E\u793A\u56FA\u5B9A\u843D\u70B9\u6216\u51B2\u649E\u8DEF\u5F84\uFF0C\u518D\u53D1\u52A8\u653B\u51FB\u3002\u8BE6\u7EC6\u673A\u5236\u4EE5\u5B9E\u6218\u9884\u8B66\u4E3A\u51C6\u3002"
    });
  }
  for (const enemy of Object.values(ENEMIES).filter((entry) => entry.control)) {
    monsters.push({
      ...ENEMY_THEME_SKINS[controlStages[enemy.id]][2],
      id: enemy.id,
      name: enemy.name,
      description: `\u63A7\u5236\u578B\u90AA\u7269\uFF1A\u9501\u5B9A\u843D\u70B9\u540E\u9884\u8B66 1.1 \u79D2\uFF0C\u7559\u4E0B 2.8 \u79D2${enemy.control.label}\u8303\u56F4\uFF1B\u8303\u56F4\u5185\u6BCF 0.6 \u79D2\u5C1D\u8BD5\u9020\u6210\u4F24\u5BB3\uFF0C\u547D\u4E2D\u9644\u5E26 ${Math.round(enemy.control.slow * 100)}% \u77ED\u6682\u51CF\u901F\u3002\u9884\u8B66\u4E0D\u8FFD\u8E2A\u79FB\u52A8\uFF0C\u79BB\u5F00\u5706\u5708\u5373\u53EF\u8EB2\u907F\u3002\u72EC\u7ACB\u50CF\u7D20\u7ACB\u7ED8\u3002`
    });
  }
  return {
    heroes: Object.values(HEROES),
    monsters,
    weapons: Object.values(WEAPONS),
    passives: Object.values(PASSIVES),
    relics: Object.values(RELICS),
    curses: Object.values(CURSES),
    fusions: FUSION_RECIPES,
    reactions: REACTIONS.map((reaction) => ({
      ...reaction,
      condition: reactionCondition(reaction),
      numbers: reactionNumbers(reaction),
      sources: reaction.pair.map(
        (element) => Object.values(WEAPONS).filter((weapon) => weapon.element === element).map((weapon) => weapon.name).join("\uFF0F")
      ).join(" \uFF0B ")
    })),
    events: EVENT_CATALOGUE
  };
}
function itemName(kind, id) {
  return catalogue()[`${kind}s`]?.find((item) => item.id === id)?.name || id;
}
function requirementText(requirement) {
  const name = itemName(requirement.kind, requirement.id);
  if (requirement.kind === "weapon") return `${name} Lv.${requirement.level || 1}`;
  if (requirement.kind === "passive") return `${name} \xD7${requirement.count || 1}`;
  return name;
}
function collectionView(save) {
  const discovered = ensureCollection(save || {});
  const defs = catalogue();
  return COLLECTION_KINDS.map((kind) => ({
    kind,
    entries: defs[kind].map((def) => ({
      ...def,
      obtained: discovered[kind].includes(def.id),
      recipe: kind === "fusions" ? `${def.requirements.map(requirementText).join(" \uFF0B ")} \u2192 ${def.name}` : FUSION_RECIPES.filter(
        (recipe) => recipe.requirements.some(
          (requirement) => `${requirement.kind}s` === kind && requirement.id === def.id
        )
      ).map((recipe) => recipe.name).join("\uFF0F")
    }))
  }));
}
function collectionProgress(save) {
  const groups = collectionView(save);
  const total = groups.reduce((sum, group) => sum + group.entries.length, 0);
  const obtained = groups.reduce(
    (sum, group) => sum + group.entries.filter((entry) => entry.obtained).length,
    0
  );
  return { obtained, total };
}

// prototype-2d-pixel/src/room-intel.js
var enemiesById = new Map(Object.values(ENEMIES).map((enemy) => [enemy.id, enemy]));
var mechanics = [
  ["ranged", "\u8FDC\u7A0B\u5F39\u9053"],
  ["dasher", "\u51B2\u523A\u8FD1\u8EAB"],
  ["shielded", "\u62A4\u76FE\u51CF\u4F24"],
  ["control", "\u51CF\u901F\u9886\u57DF"],
  ["bomber", "\u8FD1\u8EAB\u81EA\u7206"],
  ["splitter", "\u6B7B\u4EA1\u5206\u88C2"],
  ["illusionist", "\u53EC\u5524\u5206\u8EAB"]
];
function roomBriefing(node, cleared = false) {
  if (!node) return { description: "\u9053\u8DEF\u672A\u5F00\u653E", meta: "\u8BF7\u5148\u5B8C\u6210\u5F53\u524D\u623F\u95F4\u76EE\u6807" };
  if (cleared && node.killTarget > 0) {
    return { description: "\u5DF2\u6E05\u623F \xB7 \u53EF\u539F\u8DEF\u8FD4\u56DE", meta: "\u5DF2\u9886\u5956\u52B1\u4E0D\u91CD\u53D1 \xB7 \u8FC7\u95E8\u4E0D\u8DF3\u65F6\u95F4" };
  }
  if (node.type === "boss") {
    return { description: "\u6700\u7EC8\u9996\u9886\u6218 \xB7 \u7559\u610F\u5730\u9762\u9884\u8B66", meta: "\u51FB\u8D25\u9996\u9886\u540E\u7ED3\u7B97\u672C\u5C40" };
  }
  if (!node.killTarget) {
    const service = {
      shop: "\u5C40\u5185\u94DC\u94B1\u4EA4\u6613",
      shrine: "\u6062\u590D\u751F\u547D\u7684\u673A\u7F18",
      reward: "\u4E00\u6B21\u6027\u63A2\u7D22\u5956\u52B1",
      event: "\u673A\u7F18\u9009\u62E9\u4E0E\u53D6\u820D"
    }[node.type] || "\u63A2\u7D22\u623F\u5185\u673A\u7F18";
    return {
      description: `${node.label || "\u7279\u6B8A\u623F"} \xB7 ${service}`,
      meta: `${cleared ? "\u5DF2\u63A2\u7D22\uFF0C\u67E5\u770B\u5269\u4F59\u673A\u7F18" : "\u65E0\u9700\u6E05\u602A\uFF0C\u53EF\u7EE7\u7EED\u63A2\u7D22"} \xB7 \u8FC7\u95E8\u4E0D\u8DF3\u65F6\u95F4`
    };
  }
  const pool = (node.pool || []).map((id) => enemiesById.get(id));
  const tags = mechanics.filter(([flag]) => pool.some((enemy) => enemy?.[flag])).map(([, label]) => label);
  if (!pool.length || pool.some((enemy) => !enemy)) tags.push("\u90E8\u5206\u60C5\u62A5\u672A\u660E");
  if (!tags.length) tags.push("\u8FD1\u8EAB\u8FFD\u51FB");
  return {
    description: `${node.label || "\u6218\u6597\u623F"} \xB7 ${tags.join(" / ")}`,
    meta: `\u6E05\u9664 ${node.killTarget} \u53EA\u540E\u5F00\u95E8 \xB7 \u8FC7\u95E8\u4E0D\u8DF3\u65F6\u95F4`
  };
}

// prototype-2d-pixel/src/world-flow.js
function _setupChapterRoom() {
  this.hostileFields.reset();
  for (const weapon of this.player?.weapons || []) weapon.fusionFields?.restore([]);
  const node = this.chapterRoute.current();
  const savedRoom = this.chapterRoute.currentRoomState();
  this.expOrbs = restoreGroundLoot(savedRoom?.groundLoot, this.gameTime);
  const entryPositions = {
    up: { x: this.arenaWidth / 2, y: 170 },
    right: { x: this.arenaWidth - 170, y: this.arenaHeight / 2 },
    down: { x: this.arenaWidth / 2, y: this.arenaHeight - 170 },
    left: { x: 170, y: this.arenaHeight / 2 }
  };
  const entry = entryPositions[this.chapterRoute.entryDirection] || {
    x: this.arenaWidth / 2,
    y: this.arenaHeight / 2
  };
  this.player.x = entry.x;
  this.player.y = entry.y;
  this.enemies = [];
  this.projectiles = [];
  this.enemyProjectiles = [];
  this.mines = [];
  this.interactions.objects = [];
  this.interactions.nearby = null;
  this.interactions.nextSpawnAt = Infinity;
  this.worldMap.configureChapterRoom(node, this.player);
  const fixtureByType = {
    shop: ["ghost_market", "shop"],
    shrine: ["paper_tea", "heal"],
    reward: ["relic_ruin", "relic"],
    event: ["paper_tea", "event"],
    gold: ["scattered_cache", "loot"]
  };
  const fixture = fixtureByType[node.type];
  if (fixture && !savedRoom) {
    this.interactions.spawnFixture(fixture[0], this.arenaWidth / 2, this.arenaHeight / 2, {
      id: `room_fixture_${node.id}`,
      kind: fixture[1],
      name: node.name,
      description: `${node.label}\u7684\u552F\u4E00\u4E3B\u4F53\u5EFA\u7B51\uFF1B\u53EF\u78B0\u649E\u3001\u53EF\u4EA4\u4E92\uFF0C\u4E0D\u518D\u6446\u653E\u65E0\u7528\u9014\u88C5\u9970\u3002`
    });
  }
  if (node.type === "boss" && !this.chapterRoute.roomReady) {
    const chapterBossId = node.bossId;
    const boss = this.stageBosses.find(
      (entry2) => entry2.id === chapterBossId || entry2.sourceId === chapterBossId
    ) || Object.values(BOSSES).find((entry2) => entry2.id === chapterBossId) || Object.values(BOSSES)[0];
    const { hpMult, dmgMult } = this._computeDifficultyMults();
    const enemy = this._spawnBoss(boss, hpMult, dmgMult);
    restoreBossCombat(enemy, savedRoom?.boss);
  } else if (node.killTarget === 0 && !this.chapterRoute.roomReady) {
    this.chapterRoute.markSpecialReady();
  }
  if (!savedRoom && node.type !== "boss" && Math.random() < 0.45) {
    this.interactions.spawnAmbientLog(this.player, node.id);
  }
  if (savedRoom) {
    this.interactions.restore(savedRoom.interactions, this.player);
    this.hostileFields.restore(savedRoom.hostileFields);
    this.interactions.objects = this.interactions.objects.filter(
      (item) => item.kind !== "portal"
    );
    this.interactions.nextSpawnAt = Infinity;
  }
  this._spawnChapterExits();
  this._lastAnnouncedWave = null;
  this._spawnAccumulator = 0;
  this._announce(
    `${node.id} ${node.name} \xB7 ${node.label}${node.killTarget ? ` \xB7 \u6E05\u9664 ${node.killTarget} \u53EA\u90AA\u7269` : " \xB7 \u63A2\u7D22\u540E\u9009\u62E9\u51FA\u53E3"}`
  );
}
function _handleChapterRoomClear(enemy) {
  this.hostileFields.reset();
  const node = this.chapterRoute.current();
  this.enemies = this.enemies.filter((item) => item === enemy || item.boss);
  if (node.type === "boss") {
    this.chapterCompleted = true;
    this._pendingChapterVictory = true;
    this._announce(`${node.id} \u6700\u7EC8\u5B88\u5173\u8005\u5DF2\u706D\uFF0C\u7AE0\u8282\u5B8C\u6210\u3002`);
    return;
  }
  this.interactions.spawnBossChest(
    Math.min(this.arenaWidth - 120, this.player.x + 100),
    Math.max(120, this.player.y - 80),
    `${node.id} \u623F\u95F4\u7ED3\u7B97`,
    this.gameTime
  );
  const exits = this._spawnChapterExits();
  this._announce(`${node.id} \u5DF2\u6E05\u9664\uFF1A\u5956\u52B1\u5B9D\u5323\u4E0E ${exits.length} \u5EA7\u65B9\u5411\u95E8\u5DF2\u51FA\u73B0\u3002`);
}
function _spawnChapterExits() {
  const choices = this.chapterRoute.choices();
  const positions = {
    up: { x: this.arenaWidth / 2, y: 90, label: "\u5317\u95E8" },
    right: { x: this.arenaWidth - 90, y: this.arenaHeight / 2, label: "\u4E1C\u95E8" },
    down: { x: this.arenaWidth / 2, y: this.arenaHeight - 90, label: "\u5357\u95E8" },
    left: { x: 90, y: this.arenaHeight / 2, label: "\u897F\u95E8" }
  };
  const spawned = [];
  for (const choice of choices) {
    const position = positions[choice.direction];
    if (!position) continue;
    const id = `chapter_exit_${this.chapterRoute.currentId}_${choice.id}`;
    if (this.interactions.objects.some((object) => object.id === id && !object.used)) continue;
    spawned.push(
      this.interactions.spawnFixture("paper_tea", position.x, position.y, {
        id,
        kind: "portal",
        glyph: "\u95E8",
        radius: 48,
        name: `${position.label} \xB7 ${choice.id} ${choice.name}`,
        oneShot: true,
        routeTargets: [choice.id],
        direction: choice.direction,
        description: `${position.label}\u901A\u5F80${choice.label}\uFF1B\u5DF2\u6E05\u7406\u623F\u95F4\u53EF\u968F\u65F6\u539F\u8DEF\u8FD4\u56DE\u3002`
      })
    );
  }
  return spawned;
}
function _applyColdTick(dt) {
  const mods = this.stageMods;
  if (!mods || !mods.coldTickInterval) return;
  if (!this.player || this.player.dead) return;
  const result = this.environment.update(dt, mods.coldTickInterval);
  if (result.expired) {
    this.createFloatingText("\u907F\u661F\u706F\u7184\u706D", this.player.x, this.player.y - 36, "#cbbd91");
    this._announce("\u907F\u661F\u706F\u62A4\u6301\u7ED3\u675F\uFF0C\u73AF\u5883\u4FB5\u8680\u6062\u590D\u3002");
  }
  for (let i = 0; i < result.ticks; i++) {
    const dmg = mods.coldTickDamage || 1;
    const next = Math.max(1, this.player.hp - dmg);
    if (next < this.player.hp) {
      recordHealthLoss(
        this,
        { kind: "environment", label: "\u661F\u8680\u4FB5\u4F53" },
        this.player.hp - next
      );
      this.player.hp = next;
      this.createFloatingText(`-${dmg}\u2744`, this.player.x, this.player.y - 36, "#88ccff");
    }
  }
}
function _worldInteractionOptions(interaction) {
  if (interaction.kind === "portal") {
    if (interaction.routeTargets?.length) {
      return interaction.routeTargets.map((targetId, index) => {
        const node = this.chapterRoute.choices().find((item) => item.id === targetId);
        return {
          id: `route:${targetId}`,
          kindLabel: `\u51FA\u53E3 ${index + 1} / ${interaction.routeTargets.length}`,
          glyph: node?.type === "shop" ? "\u5E02" : node?.type === "boss" ? "\u9996" : node?.type === "reward" ? "\u5323" : "\u95E8",
          name: `${node?.id || targetId} \xB7 ${node?.name || "\u672A\u77E5\u9053\u8DEF"}`,
          ...roomBriefing(node, this.chapterRoute.cleared.has(targetId)),
          disabled: !node
        };
      });
    }
    const next = this.worldMap.mapModel(this).regions[this.worldMap.regionIndex + 1];
    return [
      {
        id: "portal:advance",
        kindLabel: "\u7AE0\u8282\u901A\u9053",
        glyph: "\u95E8",
        name: next ? `\u8FDB\u5165${next.name}` : "\u5C71\u95E8\u5DF2\u5C3D",
        description: next ? `\u79BB\u5F00\u5F53\u524D\u533A\u57DF\uFF0C\u8FDB\u5165\u300C${next.subtitle}\u300D\u3002\u6784\u7B51\u3001\u751F\u547D\u4E0E\u5C40\u5185\u94DC\u94B1\u4FDD\u7559\u3002` : "\u5DF2\u7ECF\u62B5\u8FBE\u7AE0\u8282\u7EC8\u70B9\u3002",
        meta: "\u786E\u8BA4\u540E\u6E05\u7406\u666E\u901A\u602A\u6F6E\u5E76\u5728\u4E0B\u4E00\u7247\u72EC\u7ACB\u533A\u57DF\u91CD\u7EC4\uFF1B\u65F6\u95F4 Boss \u4ECD\u6309\u5168\u5C40\u65F6\u95F4\u51FA\u73B0\u3002",
        disabled: !next
      }
    ];
  }
  if (interaction.kind === "log") {
    return [
      {
        id: "log:read",
        kindLabel: "\u547D\u5951\u6B8B\u5377",
        glyph: "\u5FD7",
        name: "\u8BFB\u5B8C\u7EB8\u68FA\u884C\u65E5\u5FD7",
        description: "\u8BB0\u5F55\u4E00\u540D\u65E7\u8BD5\u70BC\u8005\u5982\u4F55\u4ECE\u9752\u5C71\u9057\u5E9C\u5E26\u8D70\u661F\u5916\u9057\u7269\uFF0C\u53C8\u600E\u6837\u5931\u53BB\u4E86\u81EA\u5DF1\u7684\u540D\u5B57\u3002",
        meta: "\u8865\u5168\u4E00\u6761\u547D\u5951\u8BB0\u5F55\uFF1B\u4E0D\u5360\u88C5\u5907\u3001\u9057\u7269\u6216\u6B63\u5F0F\u623F\u95F4\u3002",
        disabled: false
      }
    ];
  }
  if (interaction.kind === "relic") {
    if (this.buildSystem.relics.size >= CONFIG.MAX_RELICS) {
      return [
        {
          id: "relic-full:coins",
          kindLabel: "\u9057\u7269\u4F4D\u5DF2\u6EE1",
          glyph: "\u94B1",
          name: "\u6536\u53D6\u6563\u843D\u94DC\u94B1",
          description: "\u5DF2\u6709 3 \u4EF6\u9057\u7269\uFF0C\u672C\u6B21\u6539\u4E3A\u9886\u53D6 12 \u679A\u5C40\u5185\u94DC\u94B1\u3002",
          meta: "\u4E0D\u66FF\u6362\u5DF2\u6709\u9057\u7269\uFF1B\u53EA\u53EF\u9886\u53D6\u4E00\u6B21\u3002",
          disabled: false
        }
      ];
    }
    return this._sceneItemOptions(interaction, ["relic"]);
  }
  if (interaction.kind === "heal") {
    const options = [
      {
        id: "heal:drink",
        kindLabel: "\u6062\u590D\u623F \xB7 \u5723\u6C34",
        glyph: "\u6CC9",
        name: "\u996E\u4E0B\u9752\u5C71\u5723\u6C34",
        description: "\u6062\u590D 55% \u6700\u5927\u751F\u547D\uFF1B\u6BCF\u5EA7\u6062\u590D\u623F\u53EA\u80FD\u4F7F\u7528\u4E00\u6B21\u3002",
        meta: `\u5F53\u524D\u751F\u547D ${Math.ceil(this.player.hp)} / ${Math.ceil(this.player.maxHp)}`,
        disabled: this.player.hp >= this.player.maxHp
      },
      {
        id: "heal:temper",
        kindLabel: "\u6062\u590D\u623F \xB7 \u70BC\u4F53",
        glyph: "\u4F53",
        name: "\u4EE5\u5723\u6C34\u6DEC\u4F53",
        description: "\u672C\u5C40\u6700\u5927\u751F\u547D\u63D0\u9AD8 8%\uFF0C\u5E76\u6309\u65B0\u4E0A\u9650\u6062\u590D 20% \u751F\u547D\u3002",
        meta: "\u672C\u5C40\u6709\u6548\uFF1B\u4F1A\u53C2\u4E0E\u751F\u547D\u8F6C\u4F24\u6D41\u6D3E\u3002",
        disabled: false
      }
    ];
    if (this.stageMods?.warmthSourceEnabled)
      options.push({
        id: "heal:lantern",
        kindLabel: "\u6062\u590D\u623F \xB7 \u907F\u661F\u706F",
        artId: "ward_lantern",
        artKind: "relic",
        name: "\u70B9\u71C3\u907F\u661F\u706F",
        description: `\u6062\u590D 20% \u6700\u5927\u751F\u547D\uFF0C\u5E76\u5728 ${LANTERN_SECONDS} \u79D2\u5185\u514D\u53D7\u73AF\u5883\u4FB5\u8680\u3002`,
        meta: "\u4E0D\u9632\u602A\u7269\u653B\u51FB\uFF1B\u4E0E\u559D\u6C34/\u70BC\u4F53\u5171\u7528\u4E00\u6B21\u673A\u4F1A\uFF0C\u91CD\u590D\u70B9\u706F\u53EA\u5237\u65B0\u65F6\u957F\u3002",
        disabled: false
      });
    return options;
  }
  if (interaction.kind === "map") {
    const bosses = (this.stageBosses || []).slice(0, 3).map((entry) => {
      return `${Math.floor(entry.spawnAt / 60)}:${String(entry.spawnAt % 60).padStart(2, "0")} ${entry.name || entry.id}`;
    });
    return [
      {
        id: "map_route",
        kindLabel: "\u5F53\u524D\u8DEF\u7EBF",
        glyph: "\u56FE",
        name: this.currentWave?.label || "\u7EB8\u7075\u6E21",
        description: `\u533A\u57DF\u8FDE\u7EED\u5EF6\u4F38\uFF1B\u5173\u952E Boss \u8282\u70B9\uFF1A${bosses.join(" \xB7 ") || "\u672A\u63A2\u660E"}\u3002`,
        meta: "\u754C\u7891\u53EA\u5C55\u793A\u60C5\u62A5\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u4F20\u9001\u6216\u6D88\u8017\u8D44\u6E90\u3002",
        disabled: true
      },
      {
        id: "map_rules",
        kindLabel: "\u7A7F\u900F\u89C4\u5219",
        glyph: "\u969C",
        name: "\u5B9E\u4F53\u969C\u788D",
        description: "\u4EBA\u7269\u4E0D\u80FD\u7A7F\u8FC7\u5B9D\u5323\u3001\u9B3C\u5E02\u4E0E\u754C\u7891\uFF1B\u6295\u5C04\u7269\u4E0E\u8303\u56F4\u6280\u80FD\u53EF\u7A7F\u900F\u8FD9\u4E9B\u4EA4\u4E92\u7269\u3002",
        meta: "\u9760\u8FD1\u63D0\u793A \u2192 F/\u70B9\u51FB \u2192 \u660E\u786E\u786E\u8BA4\u3002",
        disabled: true
      }
    ];
  }
  if (interaction.kind === "shop") {
    if ((interaction.purchaseCount || 0) >= SHOP_PURCHASE_LIMIT) {
      return [
        {
          id: "sold_out",
          kindLabel: "\u9B3C\u5E02\u89C4\u77E9",
          glyph: "\u5C01",
          name: "\u4ECA\u591C\u5DF2\u552E\u7F44",
          description: "\u6BCF\u5EA7\u9B3C\u5E02\u6700\u591A\u6210\u4EA4\u4E09\u6B21\uFF0C\u9632\u6B62\u540C\u4E00\u4E8B\u4EF6\u65E0\u9650\u8F6C\u5316\u8D44\u6E90\u3002",
          meta: "\u79BB\u5F00\u540E\u7B49\u5F85\u4E0B\u4E00\u6B21\u5F02\u5146\u3002",
          disabled: true
        }
      ];
    }
    return this._sceneItemOptions(interaction, ["weapon", "passive", "relic"], true);
  }
  if (interaction.kind === "event") {
    return [
      {
        id: "event_choice:drink",
        kindLabel: "\u7EB8\u4EBA\u8336\u644A \xB7 \u547D\u5951",
        glyph: "\u996E",
        name: "\u996E\u4E0B\u82E6\u8336",
        description: "\u4EE5\u547D\u6570\u6362\u53D6\u66F4\u5FEB\u7684\u609F\u9053\u901F\u5EA6\u3002",
        meta: "\u7ACB\u5373\u635F\u5931\u547D\u6570\uFF1B\u672C\u5C40\u7ECF\u9A8C\u83B7\u53D6\u63D0\u9AD8\u3002",
        disabled: false
      },
      {
        id: "event_choice:sell",
        kindLabel: "\u7EB8\u4EBA\u8336\u644A \xB7 \u547D\u5951",
        glyph: "\u540D",
        name: "\u5356\u51FA\u5047\u540D",
        description: "\u6362\u5F97\u4E00\u888B\u94DC\u94B1\uFF0C\u4F46\u5F80\u540E\u7684\u4F24\u52BF\u4F1A\u66F4\u91CD\u3002",
        meta: "\u7ACB\u5373\u83B7\u5F97\u94DC\u94B1\uFF1B\u672C\u5C40\u53D7\u5230\u7684\u4F24\u5BB3\u63D0\u9AD8\u3002",
        disabled: false
      }
    ];
  }
  return this._sceneItemOptions(interaction, ["weapon", "passive", "relic"]);
}
function _sceneItemOptions(interaction, kinds, shop = false) {
  const catalogues = { weapon: WEAPONS, passive: PASSIVES, relic: RELICS };
  const candidates = kinds.flatMap(
    (kind) => Object.values(catalogues[kind]).filter((def) => !this._itemOption(kind, def.id, null).disabled).map((def) => ({ kind, id: def.id }))
  );
  const offers = sceneOffers(interaction, candidates);
  const options = offers.map((offer) => {
    const option = offer.kind === "supply" ? this._supplyOption(offer.id, shop) : this._itemOption(
      offer.kind,
      offer.id,
      shop ? offer.kind === "relic" ? 14 : 8 : null
    );
    if (offer.purchased) return { ...option, disabled: true, meta: "\u672C\u4EF6\u5DF2\u552E\u51FA \xB7 \u4E0D\u8865\u8D27" };
    return option;
  });
  if (!shop && options.every((o) => o.disabled)) return [this._supplyOption("coins", false)];
  return options;
}
function _supplyOption(id, shop) {
  const recovery = id === "recover";
  const price = shop ? calculateShopPrice(12, { purchases: this.shopPurchases, gameTime: this.gameTime }) : null;
  return {
    id: `supply:${id}`,
    kindLabel: "\u6784\u7B51\u5DF2\u6EE1 \xB7 \u8865\u7ED9",
    artId: recovery ? "recovery" : "coin_sword_tassel",
    artKind: recovery ? "passive" : "relic",
    name: recovery ? "\u8C03\u606F\u836F\u5305" : "\u7EB3\u4F59\u6210\u91D1",
    description: recovery ? "\u6062\u590D\u6700\u5927\u751F\u547D\u7684 20%\uFF0C\u53D7\u6CBB\u7597\u500D\u7387\u5F71\u54CD\u3002" : "\u65E0\u6CD5\u518D\u9886\u53D6\u672C\u7BB1\u7269\u54C1\uFF0C\u6539\u4E3A 12 \u679A\u5C40\u5185\u94DC\u94B1\u3002",
    meta: recovery ? "\u53EA\u6062\u590D\u751F\u547D\uFF0C\u4E0D\u589E\u52A0\u6C38\u4E45\u5C5E\u6027\uFF1B\u672C\u5EA7\u9650\u8D2D\u4E00\u6B21\u3002" : "\u53EA\u9886\u53D6\u4E00\u6B21\uFF0C\u4E0D\u53D1\u653E\u5C40\u5916\u8D27\u5E01\u3002",
    price,
    disabled: recovery && this.player.hp >= this.player.maxHp || price != null && this.runCoins < price
  };
}
function _itemOption(kind, id, basePrice) {
  const catalogues = {
    weapon: Object.fromEntries(Object.values(WEAPONS).map((def2) => [def2.id, def2])),
    passive: Object.fromEntries(Object.values(PASSIVES).map((def2) => [def2.id, def2])),
    relic: RELICS
  };
  const def = catalogues[kind]?.[id];
  const label = kind === "weapon" ? "\u81EA\u52A8\u6B66\u5668" : kind === "passive" ? "\u529F\u6CD5" : "\u9057\u7269";
  const owned = kind === "weapon" ? this.player.weapons.find((weapon) => weapon.id === id)?.level || 0 : kind === "passive" ? this.player.passives[id]?.count || 0 : this.buildSystem.relics.has(id) ? 1 : 0;
  const recipe = FUSION_RECIPES.find(
    (entry) => (!entry.heroId || entry.heroId === this.player.heroId) && entry.requirements.some(
      (requirement) => requirement.kind === kind && requirement.id === id
    )
  );
  const slotFull = kind === "weapon" && !owned && this.player.weapons.length >= CONFIG.MAX_WEAPONS || kind === "passive" && !owned && Object.keys(this.player.passives).length >= CONFIG.MAX_PASSIVES || kind === "relic" && !owned && this.buildSystem.relics.size >= CONFIG.MAX_RELICS;
  const maxed = kind === "weapon" ? owned >= CONFIG.WEAPON_MAX_LEVEL : kind === "passive" ? owned >= CONFIG.PASSIVE_MAX_STACK : !!owned;
  const price = basePrice == null ? null : calculateShopPrice(basePrice, {
    purchases: this.shopPurchases,
    gameTime: this.gameTime,
    owned
  });
  return {
    id: `${kind}:${id}`,
    artId: id,
    artKind: kind,
    kindLabel: label,
    glyph: def?.name?.slice(0, 1) || "\u7269",
    name: def?.name || id,
    description: def?.description || "",
    meta: `${slotFull ? "\u643A\u5E26\u4F4D\u5DF2\u6EE1" : maxed ? "\u5DF2\u6EE1\u7EA7\u6216\u5DF2\u62E5\u6709" : owned ? `\u5F53\u524D ${kind === "weapon" ? `Lv.${owned}` : `x${owned}`}` : "\u5C1A\u672A\u6301\u6709"}${recipe ? ` \xB7 \u53EF\u878D\u5408\u300C${recipe.name}\u300D` : ""}${price != null && this.runCoins < price ? " \xB7 \u94DC\u94B1\u4E0D\u8DB3" : ""}`,
    price,
    disabled: !def || slotFull || maxed || price != null && this.runCoins < price
  };
}
function _resolveWorldInteraction(choiceId) {
  const interaction = this.activeInteraction;
  if (!interaction || interaction.used || !choiceId) return;
  const option = (this._interactionOptions || this._worldInteractionOptions(interaction)).find(
    (item) => item.id === choiceId
  );
  if (!option || option.disabled) return;
  const discoveryId = eventDiscoveryId(interaction);
  if (discoveryId) this._recordDiscovery("events", discoveryId);
  if (choiceId === "relic-full:coins") {
    this.runCoins += 12;
    this.interactions.complete(interaction.id, this.gameTime);
    this.ui.updateHud(this);
    this._announce("\u9057\u7269\u4F4D\u5DF2\u6EE1\uFF0C\u6539\u4E3A\u83B7\u5F97 12 \u679A\u94DC\u94B1\u3002");
    this.closeWorldInteraction();
    return;
  }
  if (interaction.kind === "portal" && choiceId.startsWith("route:")) {
    const targetId = choiceId.slice("route:".length);
    this.chapterRoute.saveRoomState({
      groundLoot: snapshotGroundLoot(this.expOrbs, this.gameTime),
      interactions: this.interactions.snapshot(),
      hostileFields: this.hostileFields.snapshot(),
      boss: bossCombatSnapshot(this.enemies.find((enemy) => enemy.boss && enemy.hp > 0))
    });
    if (!this.chapterRoute.advance(targetId)) return;
    interaction.used = true;
    this._setupChapterRoom();
    this._updateCamera();
    this.closeWorldInteraction();
    return;
  }
  if (interaction.kind === "portal" && choiceId === "portal:advance") {
    const advanced = this.worldMap.advanceRegion(this.player);
    if (!advanced) return;
    interaction.used = true;
    this.interactions.enterChapterRegion(this.player, this.gameTime);
    this.enemies = this.enemies.filter((enemy) => enemy.boss);
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.mines = [];
    this._updateCamera();
    this._announce(`\u5DF2\u8FDB\u5165${this.worldMap.currentRegion().name}\u3002`);
    this.closeWorldInteraction();
    return;
  }
  if (interaction.kind === "log" && choiceId === "log:read") {
    this.run.logsRead = (this.run.logsRead || 0) + 1;
    this._announce("\u547D\u5951\u7EED\u5199\uFF1A\u7EB8\u68FA\u884C\u65E5\u5FD7\u5DF2\u6536\u5165\u5C71\u6D77\u884C\u7B93\u3002");
    this.interactions.complete(interaction.id, this.gameTime);
    this.ui.updateHud(this);
    this.closeWorldInteraction();
    return;
  }
  if (interaction.kind === "heal") {
    if (choiceId === "heal:drink") this.player.heal(this.player.maxHp * 0.55);
    if (choiceId === "heal:lantern") {
      this.player.heal(this.player.maxHp * 0.2);
      this.environment.lightLantern();
      this.createFloatingText("\u907F\u661F\u706F \xB7 120\u79D2", this.player.x, this.player.y - 36, "#ddc98f");
      this._announce("\u907F\u661F\u706F\u5DF2\u70B9\u71C3\uFF1A\u4E24\u5206\u949F\u5185\u514D\u53D7\u73AF\u5883\u4FB5\u8680\uFF0C\u602A\u7269\u653B\u51FB\u4ECD\u6709\u4F24\u5BB3\u3002");
    }
    if (choiceId === "heal:temper") {
      this.player.runModifiers.maxHpMult *= 1.08;
      this.player.recalculateStats();
      this.player.heal(this.player.maxHp * 0.2);
    }
    this.interactions.complete(interaction.id, this.gameTime);
    this.ui.updateHud(this, { force: true });
    this.closeWorldInteraction();
    return;
  }
  if (interaction.kind === "event") {
    const eventChoice = choiceId.split(":")[1];
    if (eventChoice === "drink") {
      recordHealthLoss(
        this,
        { kind: "event", label: "\u82E6\u8336\u6362\u609F\u9053" },
        Math.min(12, Math.max(0, this.player.hp - 1))
      );
      this.player.hp = Math.max(1, this.player.hp - 12);
      this.player.runModifiers.expMult *= 1.24;
      this._announce("\u996E\u4E0B\u82E6\u8336\uFF1A\u609F\u9053\u52A0\u5FEB\uFF0C\u547D\u6570\u53D7\u635F\u3002");
    } else if (eventChoice === "sell") {
      this.runCoins += 14;
      this.player.runModifiers.incomingDamageMult *= 1.12;
      this._announce("\u5356\u51FA\u5047\u540D\uFF1A\u83B7\u5F97 14 \u94DC\u94B1\uFF0C\u90AA\u7269\u7684\u4F24\u5BB3\u66F4\u6DF1\u3002");
    }
    this.interactions.complete(interaction.id, this.gameTime);
    this.ui.updateHud(this);
    this.closeWorldInteraction();
    return;
  }
  const [kind, id] = choiceId.split(":");
  if (option.price != null) {
    this.runCoins -= option.price;
    this.shopPurchases += 1;
    interaction.purchaseCount = (interaction.purchaseCount || 0) + 1;
  }
  consumeSceneOffer(interaction, choiceId);
  if (kind === "supply") {
    if (id === "recover") this.player.heal(this.player.maxHp * 0.2);
    else if (id === "coins") this.runCoins += 12;
  } else this._grantWorldItem(kind, id);
  this._announce(`\u83B7\u5F97${option.kindLabel}\uFF1A${option.name}`);
  this.ui.updateHud(this);
  if (interaction.oneShot) {
    this.interactions.markUsed(interaction.id);
    this.closeWorldInteraction();
    return;
  }
  if (interaction.kind === "shop" && interaction.purchaseCount >= SHOP_PURCHASE_LIMIT) {
    this.interactions.complete(interaction.id, this.gameTime);
    this.closeWorldInteraction();
    return;
  }
  this._renderWorldInteraction();
}
function _grantWorldItem(kind, id) {
  if (kind === "weapon") {
    const def = Object.values(WEAPONS).find((weapon) => weapon.id === id);
    const existing = this.player.weapons.find((weapon) => weapon.id === id);
    if (existing) existing.levelUp();
    else if (def) this.player.weapons.push(new Weapon(def));
    if (def) this._recordDiscovery("weapons", id);
  } else if (kind === "passive") {
    const def = Object.values(PASSIVES).find((passive) => passive.id === id);
    if (def) this.player.addPassive(def);
    if (def) this._recordDiscovery("passives", id);
  } else if (kind === "relic") {
    this.buildSystem.grantRelic(id);
  }
  this.buildSystem.checkFusions();
}

// prototype-2d-pixel/src/platform-storage.js
var configured;
var accessed = false;
function requireStorage(storage) {
  if (!storage || !["getItem", "setItem", "removeItem"].every((key) => typeof storage[key] === "function"))
    throw new TypeError("Storage must implement getItem, setItem and removeItem");
  return storage;
}
function getPersistentStorage() {
  accessed = true;
  if (configured !== void 0) return configured;
  try {
    const storage = globalThis.window?.localStorage || globalThis.localStorage;
    return storage ? requireStorage(storage) : null;
  } catch {
    return null;
  }
}

// prototype-2d-pixel/src/save-journal.js
var health = /* @__PURE__ */ new Map();
var listeners = /* @__PURE__ */ new Set();
function setSaveHealth(kind, code) {
  const prior = health.get(kind);
  const recovered = code === "recovered" || prior?.recovered || false;
  if (prior?.code === code && prior.recovered === recovered) return;
  health.set(kind, { code, recovered });
  for (const listener of listeners) listener();
}
function getSaveHealth(kind) {
  return kind ? health.get(kind) || { code: "unknown", recovered: false } : Object.fromEntries(health);
}
function parseRecord(raw, validate) {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw, (key, entry) => {
      if (["__proto__", "constructor", "prototype"].includes(key))
        throw new Error("Unsafe key");
      return entry;
    });
    return validate(value) ? value : null;
  } catch {
    return null;
  }
}
function readJournal(storage, key, validate) {
  if (!storage) return { value: null, code: "memory" };
  try {
    const raw = storage.getItem(key);
    const value = parseRecord(raw, validate);
    if (value !== null) return { value, code: "ok" };
    const backup = parseRecord(storage.getItem(`${key}:backup`), validate);
    if (backup !== null) return { value: backup, code: "recovered" };
    return { value: null, code: raw ? "corrupt" : "ok" };
  } catch {
    return { value: null, code: "unavailable" };
  }
}
function writeJournal(storage, key, value, validate) {
  let raw;
  try {
    raw = JSON.stringify(value);
  } catch {
    return { ok: false, code: "invalid" };
  }
  if (parseRecord(raw, validate) === null) return { ok: false, code: "invalid" };
  if (!storage) return { ok: false, code: "memory", raw };
  try {
    const previous = storage.getItem(key);
    if (previous && previous !== raw) {
      if (parseRecord(previous, validate) !== null)
        storage.setItem(`${key}:backup`, previous);
      else storage.setItem(`${key}:damaged`, previous);
    }
    storage.setItem(key, raw);
    return { ok: true, code: "ok", raw };
  } catch {
    return { ok: false, code: "write-failed", raw };
  }
}
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// prototype-2d-pixel/src/covenants.js
var COVENANT_STORAGE_KEY = "wuxiang_shanhai_pixel_covenants_v1";
var COVENANT_SLOT_COUNT = 3;
var memorySlots = [null, null, null];
var pendingSlots = /* @__PURE__ */ new WeakMap();
function validCovenants(value) {
  return Array.isArray(value) && value.length <= COVENANT_SLOT_COUNT && value.every((slot) => {
    if (slot === null) return true;
    if (!isRecord(slot)) return false;
    if (Object.hasOwn(slot, "cocosDifficulty") && !["easy", "normal", "hard", "nightmare"].includes(slot.cocosDifficulty))
      return false;
    if (slot.cocosBuildChoice != null && (!isRecord(slot.cocosBuildChoice) || !["curse", "relic"].includes(slot.cocosBuildChoice.kind) || !Array.isArray(slot.cocosBuildChoice.ids) || slot.cocosBuildChoice.ids.length > 3 || slot.cocosBuildChoice.ids.some((id) => typeof id !== "string")))
      return false;
    if (slot.cocosMetaTalents != null && (!Array.isArray(slot.cocosMetaTalents) || slot.cocosMetaTalents.length > 3 || slot.cocosMetaTalents.some((id) => typeof id !== "string")))
      return false;
    if (slot.cocosDiscoveries != null && (!isRecord(slot.cocosDiscoveries) || Object.values(slot.cocosDiscoveries).some(
      (ids) => !Array.isArray(ids) || ids.some((id) => typeof id !== "string")
    )))
      return false;
    if (slot.cocosRunSerial != null && (!Number.isSafeInteger(slot.cocosRunSerial) || slot.cocosRunSerial < 1))
      return false;
    if (slot.cocosCompletion != null) {
      const completion = slot.cocosCompletion;
      if (!isRecord(completion) || !isRecord(completion.run) || typeof completion.dateKey !== "string")
        return false;
      if (["kills", "gameTime", "bossKills"].some(
        (key) => !Number.isFinite(completion.run[key]) || completion.run[key] < 0
      ))
        return false;
    }
    if (slot.player !== void 0 && !isRecord(slot.player)) return false;
    if (slot.player?.weapons !== void 0 && !Array.isArray(slot.player.weapons))
      return false;
    if (slot.player?.passives !== void 0 && !isRecord(slot.player.passives))
      return false;
    if (slot.player?.weapons?.some(
      (weapon) => !isRecord(weapon) || typeof weapon.id !== "string"
    ))
      return false;
    for (const key of [
      "build",
      "chapterRoute",
      "interactions",
      "worldMap",
      "run",
      "heroSkills",
      "groundLoot",
      "environment"
    ]) {
      if (slot[key] != null && !isRecord(slot[key])) return false;
    }
    for (const list of [
      slot.bossesSpawned,
      slot.build?.relics,
      slot.build?.curses,
      slot.build?.fusions,
      slot.chapterRoute?.visited,
      slot.chapterRoute?.cleared
    ]) {
      if (list != null && (!Array.isArray(list) || list.some((id) => typeof id !== "string")))
        return false;
    }
    if (slot.groundLoot?.orbs != null && (!Array.isArray(slot.groundLoot.orbs) || slot.groundLoot.orbs.some((orb) => !isRecord(orb))))
      return false;
    if (slot.interactions?.objects != null && (!Array.isArray(slot.interactions.objects) || slot.interactions.objects.some(
      (object) => !isRecord(object) || !Number.isFinite(object.x) || !Number.isFinite(object.y)
    )))
      return false;
    for (const key of ["x", "y", "hp", "maxHp", "level", "exp", "expToNext"]) {
      if (slot.player?.[key] !== void 0 && !Number.isFinite(slot.player[key]))
        return false;
    }
    return slot.gameTime === void 0 || Number.isFinite(slot.gameTime) && slot.gameTime >= 0;
  });
}
function storageOrNull(storage) {
  if (storage) return storage;
  return getPersistentStorage();
}
function normaliseSlots(value) {
  const slots = Array.isArray(value) ? value.slice(0, COVENANT_SLOT_COUNT) : [];
  while (slots.length < COVENANT_SLOT_COUNT) slots.push(null);
  return slots.map((slot) => slot && typeof slot === "object" ? slot : null);
}
function loadCovenants(storage) {
  const target = storageOrNull(storage);
  if (!target) {
    setSaveHealth("covenants", "memory");
    return normaliseSlots(memorySlots);
  }
  if (pendingSlots.has(target)) return normaliseSlots(pendingSlots.get(target));
  const result = readJournal(target, COVENANT_STORAGE_KEY, validCovenants);
  setSaveHealth("covenants", result.code);
  memorySlots = normaliseSlots(result.value);
  return normaliseSlots(memorySlots);
}
function writeCovenants(slots, storage) {
  const candidate = normaliseSlots(slots);
  const target = storageOrNull(storage);
  const result = writeJournal(target, COVENANT_STORAGE_KEY, candidate, validCovenants);
  if (result.raw) memorySlots = JSON.parse(result.raw);
  setSaveHealth("covenants", result.code);
  if (target) {
    if (result.ok) pendingSlots.delete(target);
    else if (result.raw) pendingSlots.set(target, memorySlots);
  }
  return normaliseSlots(memorySlots);
}
function getCovenant(slot, storage) {
  const index = Math.max(1, Math.min(COVENANT_SLOT_COUNT, Number(slot) || 1)) - 1;
  return loadCovenants(storage)[index];
}
function saveCovenant(slot, snapshot, storage) {
  const index = Math.max(1, Math.min(COVENANT_SLOT_COUNT, Number(slot) || 1)) - 1;
  const slots = loadCovenants(storage);
  slots[index] = snapshot ? { ...snapshot, slot: index + 1, savedAt: Date.now() } : null;
  writeCovenants(slots, storage);
  return slots[index];
}
function deleteCovenant(slot, storage) {
  return saveCovenant(slot, null, storage);
}
function covenantSummary(snapshot) {
  if (!snapshot) return { empty: true, title: "\u7A7A\u767D\u547D\u5951", detail: "\u9009\u62E9\u540E\u5F00\u59CB\u65B0\u7684\u8BD5\u70BC" };
  const seconds = Math.max(0, Math.floor(snapshot.gameTime || 0));
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return {
    empty: false,
    title: snapshot.heroName || snapshot.selectedHeroId || "\u672A\u540D\u884C\u8005",
    detail: `${snapshot.runMode === "endless" ? "\u65E0\u5C3D\u5927\u8352" : `\u7AE0\u8282 ${snapshot.chapterRoute?.currentId || "1-1"}`} \xB7 ${mm}:${ss} \xB7 Lv.${snapshot.player?.level || 1}`
  };
}
function buildCovenantSnapshot(game) {
  if (!game?.player) return null;
  const player = game.player;
  return {
    version: 1,
    selectedHeroId: game.selectedHeroId,
    selectedHeroTalentId: game.selectedHeroTalentId,
    heroName: game.selectedHero?.name || game.selectedHeroId,
    runMode: game.runMode,
    stageId: game.stageId,
    gameTime: game.gameTime,
    damageHistory: restoreDamageHistory(game.damageHistory, game.gameTime),
    kills: game.kills,
    runCoins: game.runCoins,
    combatCoinsEarned: game.combatCoinsEarned || 0,
    shopPurchases: game.shopPurchases,
    bossesSpawned: Array.from(game._bossesSpawned || []),
    endlessRun: game.endlessRun?.snapshot?.(game.enemies) || null,
    hostileFields: game.hostileFields?.snapshot?.() || [],
    chapterBoss: game.runMode === "chapter" ? bossCombatSnapshot(game.enemies?.find((enemy) => enemy.boss && enemy.hp > 0)) : null,
    mines: (game.mines || []).filter((mine) => !mine.shouldRemove).slice(-24).map((mine) => mine.snapshot()),
    player: {
      hindrance: {
        power: player.hindrancePower || 0,
        remaining: player.hindranceRemaining || 0,
        label: player.hindranceLabel || ""
      },
      x: player.x,
      y: player.y,
      hp: player.hp,
      maxHp: player.maxHp,
      level: player.level,
      exp: player.exp,
      expToNext: player.expToNext,
      weapons: player.weapons.map((weapon) => ({
        id: weapon.id,
        level: weapon.level,
        cooldown: weapon.cooldown,
        guardCooldown: weapon.guardCooldown || 0,
        fusion: weapon.fusion ? JSON.parse(JSON.stringify(weapon.fusion)) : null,
        fusionFields: weapon.fusionFields?.snapshot?.() || []
      })),
      passives: Object.fromEntries(
        Object.entries(player.passives || {}).map(([id, value]) => [id, value.count || 0])
      ),
      runModifiers: { ...player.runModifiers || {} }
    },
    build: {
      relics: Array.from(game.buildSystem?.relics || []),
      curses: Array.from(game.buildSystem?.curses || []),
      fusions: Array.from(game.buildSystem?.fusions || []),
      nextCurseAt: game.buildSystem?.nextCurseAt || 180
    },
    heroSkills: game.heroSkills?.getSnapshot?.() || null,
    interactions: game.interactions?.snapshot?.() || null,
    worldMap: game.worldMap?.snapshot?.() || null,
    chapterRoute: game.chapterRoute?.snapshot?.() || null,
    groundLoot: snapshotGroundLoot(game.expOrbs, game.gameTime),
    environment: game.environment?.snapshot?.() || null,
    run: {
      logsRead: game.run?.logsRead || 0,
      bossesDefeated: { ...game.run?.bossesDefeated || {} }
    }
  };
}

// prototype-2d-pixel/src/covenant-restore.js
function restoreCovenantState(snapshot) {
  this.mines = (Array.isArray(snapshot.mines) ? snapshot.mines : []).slice(-24).map(Mine.restore).filter(Boolean);
  const p = snapshot.player || {};
  this.gameTime = Math.max(0, Number(snapshot.gameTime) || 0);
  this.damageHistory = restoreDamageHistory(snapshot.damageHistory, this.gameTime);
  this.kills = Math.max(0, Number(snapshot.kills) || 0);
  this.runCoins = Math.max(0, Number(snapshot.runCoins) || 0);
  this.combatCoinsEarned = restoreCombatCoins(
    snapshot.combatCoinsEarned,
    this.gameTime,
    this.kills
  );
  this.shopPurchases = Math.max(0, Number(snapshot.shopPurchases) || 0);
  this._bossesSpawned = new Set(snapshot.bossesSpawned || []);
  this.player.x = Number.isFinite(p.x) ? p.x : this.player.x;
  this.player.y = Number.isFinite(p.y) ? p.y : this.player.y;
  this.player.level = Math.max(1, Number(p.level) || 1);
  this.player.exp = Math.max(0, Number(p.exp) || 0);
  this.player.expToNext = Math.max(1, Number(p.expToNext) || 50);
  this.player.weapons = (p.weapons || []).map((saved) => {
    const def = Object.values(WEAPONS).find((weapon2) => weapon2.id === saved.id);
    if (!def) return null;
    const weapon = new Weapon(def);
    weapon.level = Math.max(1, Number(saved.level) || 1);
    weapon.cooldown = Math.max(0, Number(saved.cooldown) || 0);
    weapon.fusion = saved.fusion ? { ...saved.fusion } : null;
    weapon.fusionFields.restore(saved.fusionFields);
    weapon.guardCooldown = Math.min(0.35, Math.max(0, Number(saved.guardCooldown) || 0));
    return weapon;
  }).filter(Boolean);
  this.player.passives = /* @__PURE__ */ Object.create(null);
  for (const [id, count] of Object.entries(p.passives || {})) {
    const def = Object.values(PASSIVES).find((passive) => passive.id === id);
    if (def) this.player.passives[id] = { def, count: Math.max(0, Number(count) || 0) };
  }
  this.player.runModifiers = { ...this.player.runModifiers, ...p.runModifiers || {} };
  this.player.recalculateStats();
  if (Number.isFinite(p.maxHp)) this.player.maxHp = Math.max(1, p.maxHp);
  this.player.hp = Math.max(1, Math.min(this.player.maxHp, Number(p.hp) || this.player.maxHp));
  const build = snapshot.build || {};
  this.buildSystem.relics = new Set(build.relics || []);
  this.buildSystem.curses = new Set(build.curses || []);
  this.buildSystem.fusions = new Set(build.fusions || []);
  for (const recipe of FUSION_RECIPES) {
    if (!this.buildSystem.fusions.has(recipe.id) || recipe.heroId && recipe.heroId !== this.player.heroId)
      continue;
    for (const output of recipe.outputs) {
      const weapon = this.player.weapons.find((w) => w.id === output.weaponId);
      if (weapon) weapon.fusion = mergeFusion(weapon.fusion, recipe, output);
    }
  }
  this.buildSystem.nextCurseAt = Math.max(this.gameTime + 1, Number(build.nextCurseAt) || 180);
  this.buildSystem._syncUi();
  this._recordDiscovery("heroes", this.player.heroId || this.selectedHeroId);
  for (const weapon of this.player.weapons) this._recordDiscovery("weapons", weapon.id);
  for (const id of Object.keys(this.player.passives)) this._recordDiscovery("passives", id);
  for (const id of this.buildSystem.relics) this._recordDiscovery("relics", id);
  for (const id of this.buildSystem.curses) this._recordDiscovery("curses", id);
  for (const id of this.buildSystem.fusions) this._recordDiscovery("fusions", id);
  if (snapshot.heroSkills) {
    this.heroSkills.skillCooldown = Math.max(0, Number(snapshot.heroSkills.skillCooldown) || 0);
    this.heroSkills.ultimateEnergy = Math.max(
      0,
      Number(snapshot.heroSkills.ultimateEnergy) || 0
    );
    this.heroSkills._syncUi();
  }
  this.run.logsRead = Math.max(0, Number(snapshot.run?.logsRead) || 0);
  this.run.bossesDefeated = { ...snapshot.run?.bossesDefeated || {} };
  this.worldMap.restore(snapshot.worldMap, this.player);
  this.interactions.restore(snapshot.interactions, this.player);
  this.hostileFields.restore(snapshot.hostileFields);
  this.expOrbs = restoreGroundLoot(snapshot.groundLoot, this.gameTime);
  this.environment.restore(snapshot.environment);
  if (this.runMode === "chapter")
    restoreBossCombat(
      this.enemies.find((enemy) => enemy.boss),
      snapshot.chapterBoss
    );
  if (snapshot.player?.hindrance) {
    const effect = snapshot.player.hindrance;
    this.player.applyHindrance(effect.power, effect.remaining, effect.label);
  }
  if (this.runMode === "chapter") this.interactions.nextSpawnAt = Infinity;
  this._updateCamera();
  this.ui.updateHud(this);
  this._announce(`\u547D\u5951${this.activeCovenantSlot}\u7EED\u5199\uFF1A${Math.floor(this.gameTime / 60)} \u5206\u949F\u3002`);
}

// prototype-2d-pixel/src/meta-progression.js
var META_LEVEL_CAP = 30;
var META_TALENT_SLOT_CAP = 3;
var META_CURRENCY_NAME = "\u547D\u7802";
var META_TALENTS = Object.freeze({
  tempered_body: Object.freeze({
    id: "tempered_body",
    branch: "\u751F\u5B58",
    name: "\u767E\u70BC\u6B8B\u8EAF",
    unlockLevel: 2,
    cost: 6,
    description: "\u6700\u5927\u751F\u547D +8%\u3002\u7A33\u5B9A\u4F46\u4E0D\u63D0\u9AD8\u7206\u53D1\u3002",
    effects: Object.freeze({ maxHpMult: 1.08 })
  }),
  spirit_purse: Object.freeze({
    id: "spirit_purse",
    branch: "\u7ECF\u8425",
    name: "\u8896\u91CC\u9B3C\u5E02",
    unlockLevel: 3,
    cost: 8,
    description: "\u6BCF\u5C40\u643A\u5E26 6 \u679A\u94DC\u94B1\u5165\u573A\uFF0C\u66F4\u65E9\u5F62\u6210\u5546\u5E97\u9009\u62E9\u3002",
    effects: Object.freeze({ startCoins: 6 })
  }),
  paper_rebirth: Object.freeze({
    id: "paper_rebirth",
    branch: "\u751F\u5B58",
    name: "\u7EB8\u4EBA\u66FF\u547D",
    unlockLevel: 4,
    cost: 12,
    description: "\u6BCF\u5C40\u83B7\u5F97 1 \u6B21\u6FD2\u6B7B\u590D\u8D77\uFF1B\u4E0D\u4E0E\u547D\u7802\u6536\u76CA\u6302\u94A9\u3002",
    effects: Object.freeze({ reviveCharges: 1 })
  }),
  warding_bone: Object.freeze({
    id: "warding_bone",
    branch: "\u7384\u7532",
    name: "\u9547\u9AA8\u7384\u7532",
    unlockLevel: 5,
    cost: 12,
    description: "\u62A4\u7532 +2\uFF0C\u4F46\u81EA\u52A8\u6B66\u5668\u4F24\u5BB3 -5%\u3002",
    effects: Object.freeze({ armor: 2, damageMult: 0.95 })
  }),
  blood_contract: Object.freeze({
    id: "blood_contract",
    branch: "\u8840\u70BC",
    name: "\u8840\u5951\u517B\u5668",
    unlockLevel: 6,
    cost: 14,
    description: "\u6700\u5927\u751F\u547D +12%\uFF0C\u4F46\u6CBB\u7597\u4E0E\u5438\u8840\u6548\u679C -25%\u3002",
    effects: Object.freeze({ maxHpMult: 1.12, healingMult: 0.75 })
  }),
  echo_weapon: Object.freeze({
    id: "echo_weapon",
    branch: "\u6784\u7B51",
    name: "\u524D\u5C18\u5175\u5F71",
    unlockLevel: 8,
    cost: 18,
    description: "\u5F00\u5C40\u989D\u5916\u643A\u5E26 1 \u4EF6\u7B26\u5408\u89D2\u8272\u5B9A\u4F4D\u7684\u516C\u5171\u6B66\u5668\uFF0C\u4F46\u6700\u5927\u751F\u547D -8%\u3002",
    effects: Object.freeze({ extraStartingWeapon: 1, maxHpMult: 0.92 })
  }),
  mirror_thorns: Object.freeze({
    id: "mirror_thorns",
    branch: "\u7384\u7532",
    name: "\u7167\u9AA8\u53CD\u715E",
    unlockLevel: 10,
    cost: 18,
    description: "\u62A4\u7532\u53EF\u8F6C\u5316\u4E3A\u53CD\u4F24\uFF0C\u4EE3\u4EF7\u662F\u81EA\u52A8\u6B66\u5668\u51B7\u5374 +6%\u3002",
    effects: Object.freeze({ armorReflectRatio: 0.35, cooldownMult: 1.06 })
  }),
  swift_star: Object.freeze({
    id: "swift_star",
    branch: "\u661F\u884C",
    name: "\u8E0F\u661F\u9006\u884C",
    unlockLevel: 12,
    cost: 20,
    description: "\u79FB\u52A8\u901F\u5EA6 +12%\uFF0C\u989D\u5916\u79FB\u901F\u53EF\u8F6C\u4F24\uFF0C\u4F46\u53D7\u5230\u4F24\u5BB3 +8%\u3002",
    effects: Object.freeze({
      speedMult: 1.12,
      speedDamageRatio: 0.55,
      incomingDamageMult: 1.08
    })
  }),
  void_focus: Object.freeze({
    id: "void_focus",
    branch: "\u90AA\u6CD5",
    name: "\u65E0\u76F8\u51DD\u795E",
    unlockLevel: 15,
    cost: 24,
    description: "\u81EA\u52A8\u6B66\u5668\u4F24\u5BB3 +18%\uFF0C\u4F46\u6700\u5927\u751F\u547D -12%\u3002",
    effects: Object.freeze({ damageMult: 1.18, maxHpMult: 0.88 })
  })
});
function freshMetaProgression() {
  return {
    level: 1,
    xp: 0,
    currency: 0,
    lifetimeCurrency: 0,
    purchasedTalents: [],
    equippedTalents: [],
    dailyMapRuns: { date: "", counts: {} }
  };
}
function normalizeMetaProgression(input) {
  const base = freshMetaProgression();
  const source = input && typeof input === "object" ? input : {};
  base.level = Math.max(1, Math.min(META_LEVEL_CAP, Math.floor(Number(source.level) || 1)));
  base.xp = Math.max(0, Math.floor(Number(source.xp) || 0));
  base.currency = Math.max(0, Math.floor(Number(source.currency) || 0));
  base.lifetimeCurrency = Math.max(0, Math.floor(Number(source.lifetimeCurrency) || 0));
  base.purchasedTalents = Array.from(
    new Set(Array.isArray(source.purchasedTalents) ? source.purchasedTalents : [])
  ).filter((id) => META_TALENTS[id]);
  base.equippedTalents = Array.from(
    new Set(Array.isArray(source.equippedTalents) ? source.equippedTalents : [])
  ).filter((id) => base.purchasedTalents.includes(id)).slice(0, META_TALENT_SLOT_CAP);
  const daily = source.dailyMapRuns || {};
  base.dailyMapRuns = {
    date: typeof daily.date === "string" ? daily.date : "",
    counts: daily.counts && typeof daily.counts === "object" ? { ...daily.counts } : {}
  };
  return base;
}
function metaXpForNext(level) {
  if (level >= META_LEVEL_CAP) return 0;
  return 80 + Math.max(0, level - 1) * 40;
}
function addMetaXp(meta, amount2) {
  const state = meta;
  const startLevel = state.level;
  state.xp += Math.max(0, Math.floor(Number(amount2) || 0));
  while (state.level < META_LEVEL_CAP) {
    const needed = metaXpForNext(state.level);
    if (state.xp < needed) break;
    state.xp -= needed;
    state.level += 1;
  }
  if (state.level >= META_LEVEL_CAP) state.xp = 0;
  return state.level - startLevel;
}
function localDateKey(date = /* @__PURE__ */ new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function performanceScore(run) {
  const kills = Math.max(0, Number(run?.kills) || 0);
  const seconds = Math.max(0, Number(run?.gameTime) || 0);
  const bosses = Math.max(0, Number(run?.bossKills) || 0);
  if (run?.runMode === "endless") {
    const combat = Math.min(80, Math.sqrt(kills) * 2);
    const endurance = Math.min(90, seconds / 30) * Math.min(1, kills / 80);
    return Math.floor(combat + endurance + bosses * 100 + (run.victory ? 100 : 0));
  }
  return Math.floor(kills + seconds / 6 + bosses * 80 + (run?.victory ? 180 : 0));
}
function grantRunProgress(metaInput, run, { dateKey = localDateKey() } = {}) {
  const meta = metaInput;
  const score = performanceScore(run);
  const qualified = score >= 80;
  const stageId = String(run?.stageId || "unknown");
  if (meta.dailyMapRuns.date !== dateKey) {
    meta.dailyMapRuns = { date: dateKey, counts: {} };
  }
  const priorRuns = Math.max(0, Number(meta.dailyMapRuns.counts[stageId]) || 0);
  const repeatMultipliers = [1, 0.65, 0.35, 0.15, 0];
  const repeatMultiplier = repeatMultipliers[Math.min(priorRuns, repeatMultipliers.length - 1)];
  const uncappedCurrency = qualified ? Math.floor((score - 50) / 15) : 0;
  const baseCurrency = Math.max(0, Math.min(30, uncappedCurrency));
  const currency = Math.floor(baseCurrency * repeatMultiplier);
  const xp = run?.runMode === "endless" ? Math.min(140, Math.floor(score / 4)) : Math.min(
    140,
    Math.floor(
      Math.max(0, Number(run?.kills) || 0) / 4 + Math.max(0, Number(run?.gameTime) || 0) / 20 + Math.max(0, Number(run?.bossKills) || 0) * 20 + (run?.victory ? 40 : 0)
    )
  );
  const levelsGained = addMetaXp(meta, xp);
  if (qualified) meta.dailyMapRuns.counts[stageId] = priorRuns + 1;
  meta.currency += currency;
  meta.lifetimeCurrency += currency;
  return {
    score,
    mode: run?.runMode || "chapter",
    qualified,
    threshold: 80,
    currency,
    baseCurrency,
    repeatMultiplier,
    repeatIndex: priorRuns + 1,
    xp,
    levelsGained,
    level: meta.level
  };
}
function purchaseMetaTalent(meta, id) {
  const talent = META_TALENTS[id];
  if (!talent) return { ok: false, reason: "missing" };
  if (meta.purchasedTalents.includes(id)) return { ok: false, reason: "owned" };
  if (meta.level < talent.unlockLevel) return { ok: false, reason: "locked" };
  if (meta.currency < talent.cost) return { ok: false, reason: "currency" };
  meta.currency -= talent.cost;
  meta.purchasedTalents.push(id);
  return { ok: true, talent };
}
function toggleMetaTalent(meta, id) {
  if (!meta.purchasedTalents.includes(id)) return { ok: false, reason: "unowned" };
  const index = meta.equippedTalents.indexOf(id);
  if (index >= 0) {
    meta.equippedTalents.splice(index, 1);
    return { ok: true, equipped: false, talent: META_TALENTS[id] };
  }
  if (meta.equippedTalents.length >= META_TALENT_SLOT_CAP) {
    return { ok: false, reason: "slots" };
  }
  meta.equippedTalents.push(id);
  return { ok: true, equipped: true, talent: META_TALENTS[id] };
}
function applyMetaTalents(player, meta) {
  const bonuses = { startCoins: 0, extraStartingWeapon: 0 };
  if (!player?.runModifiers) return bonuses;
  const additive = /* @__PURE__ */ new Set([
    "armor",
    "critChance",
    "reviveCharges",
    "projectileBonus",
    "armorReflectRatio",
    "speedDamageRatio"
  ]);
  for (const id of meta?.equippedTalents || []) {
    const talent = META_TALENTS[id];
    if (!talent || !meta.purchasedTalents?.includes(id)) continue;
    for (const [key, value] of Object.entries(talent.effects || {})) {
      if (key === "startCoins" || key === "extraStartingWeapon") {
        bonuses[key] += value;
      } else if (additive.has(key)) {
        player.runModifiers[key] = (player.runModifiers[key] || 0) + value;
      } else {
        player.runModifiers[key] = (player.runModifiers[key] ?? 1) * value;
      }
    }
  }
  player.recalculateStats?.();
  player.hp = player.maxHp;
  return bonuses;
}

// prototype-2d-pixel/src/keymap.js
var KEYMAP_ACTIONS = Object.freeze([
  "up",
  "down",
  "left",
  "right",
  "skill",
  "ultimate",
  "pause",
  "help",
  "mute"
]);
var DEFAULT_KEYMAP = Object.freeze({
  up: Object.freeze(["w", "arrowup"]),
  down: Object.freeze(["s", "arrowdown"]),
  left: Object.freeze(["a", "arrowleft"]),
  right: Object.freeze(["d", "arrowright"]),
  skill: Object.freeze(["e"]),
  ultimate: Object.freeze(["q"]),
  pause: Object.freeze(["escape", "p"]),
  help: Object.freeze(["h", "?"]),
  mute: Object.freeze(["m"])
});

// prototype-2d-pixel/src/input.js
var JOYSTICK_DEADZONE = 0.15;
var GAMEPAD_AXIS_DEADZONE = 0.18;
var GAMEPAD_BUTTON = Object.freeze({
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  BACK: 8,
  START: 9
});
function applyGamepadDeadzone(v, dz = GAMEPAD_AXIS_DEADZONE) {
  if (!Number.isFinite(v)) return 0;
  const a = Math.abs(v);
  if (a < dz) return 0;
  const sign = v < 0 ? -1 : 1;
  return sign * ((a - dz) / (1 - dz));
}
function sampleJoystick(dx, dy, maxR = 60) {
  if (![dx, dy, maxR].every(Number.isFinite) || maxR <= 0)
    return { x: 0, y: 0, knobX: 0, knobY: 0 };
  const d = Math.hypot(dx, dy);
  const clamp = Math.min(d, maxR);
  const dirx = d === 0 ? 0 : dx / d;
  const diry = d === 0 ? 0 : dy / d;
  const mag = clamp / maxR;
  const scaled = mag < JOYSTICK_DEADZONE ? 0 : Math.pow((mag - JOYSTICK_DEADZONE) / (1 - JOYSTICK_DEADZONE), 1.3);
  return { x: dirx * scaled, y: diry * scaled, knobX: dirx * clamp, knobY: diry * clamp };
}

// prototype-2d-pixel/src/terrain-art.js
var TERRAIN_TILE_SIZE = 256;
var COLUMNS = Object.freeze({ forest: 0, crypt: 1, tundra: 2 });
function terrainRoads(view, mode = "chapter") {
  const step = mode === "endless" ? 1600 : 1200, breadth = 72, roads = [];
  for (let y = Math.floor((view.y - breadth) / step) * step; y <= view.y + view.height; y += step)
    roads.push({ x: view.x - 2, y, width: view.width + 4, height: breadth });
  for (let x = Math.floor((view.x - breadth) / step) * step; x <= view.x + view.width; x += step)
    roads.push({ x, y: view.y - 2, width: breadth, height: view.height + 4 });
  return roads;
}
function terrainCourtyard(object) {
  if (!object || object.used && !isRetainedBuilding(object)) return null;
  const box = buildingBounds(object);
  if (!box) return null;
  return {
    x: Math.floor(box.left - 32),
    y: Math.floor(box.top - 24),
    width: Math.ceil(box.right - box.left + 64),
    height: Math.ceil(box.bottom - box.top + 64)
  };
}
if (false) {
  const image = new (void 0)();
  image.onload = () => {
    try {
      for (const stageId of Object.keys(COLUMNS))
        for (const paved of [false, true]) {
          const source = terrainSourceRect(
            image.naturalWidth,
            image.naturalHeight,
            stageId,
            paved
          );
          const small = (void 0).createElement("canvas");
          small.width = small.height = 128;
          const sc = small.getContext("2d");
          sc.imageSmoothingEnabled = true;
          sc.imageSmoothingQuality = "high";
          sc.drawImage(
            image,
            source.x,
            source.y,
            source.width,
            source.height,
            0,
            0,
            128,
            128
          );
          sc.fillStyle = stageId === "forest" ? "rgba(25,35,29,0.28)" : stageId === "crypt" ? "rgba(28,22,29,0.2)" : "rgba(30,43,54,0.34)";
          sc.fillRect(0, 0, 128, 128);
          const tile = (void 0).createElement("canvas");
          tile.width = tile.height = TERRAIN_TILE_SIZE * 2;
          const tc = tile.getContext("2d");
          tc.imageSmoothingEnabled = false;
          for (let row = 0; row < 2; row++)
            for (let col = 0; col < 2; col++) {
              tc.save();
              tc.translate(col ? tile.width : 0, row ? tile.height : 0);
              tc.scale(col ? -1 : 1, row ? -1 : 1);
              tc.drawImage(small, 0, 0, TERRAIN_TILE_SIZE, TERRAIN_TILE_SIZE);
              tc.restore();
            }
          const cell = terrainCell(stageId, paved);
          tiles.set(`${cell.column}:${cell.row}`, tile);
        }
      ready = true;
    } catch (e) {
      error = e.message;
    }
  };
  image.onerror = () => {
    error = "Terrain atlas unavailable; original floor retained";
  };
  image.src = TERRAIN_ASSET;
}
export {
  BOSSES,
  COLLECTION_KINDS,
  CONFIG,
  COVENANT_SLOT_COUNT,
  COVENANT_STORAGE_KEY,
  CURSES,
  ChapterRouteSystem,
  CombatVisualLayer,
  Difficulty,
  ENEMIES,
  EVENT_CATALOGUE,
  EffectLayer,
  EndlessRun,
  Enemy,
  EnemyProjectile,
  EnvironmentState,
  ExpOrb,
  FUSION_RECIPES,
  GameState,
  HEROES,
  HostileFieldSystem,
  InteractionSystem,
  META_CURRENCY_NAME,
  META_LEVEL_CAP,
  META_TALENTS,
  META_TALENT_SLOT_CAP,
  PASSIVES,
  Player,
  Projectile,
  QingfengSkillController,
  RELICS,
  ReactionSystem,
  RunBuildSystem,
  STAGES,
  SpatialHash,
  TERRAIN_TILE_SIZE,
  WEAPONS,
  Weapon,
  WorldMapSystem,
  _applyColdTick,
  _computeDifficultyMults,
  _grantWorldItem,
  _handleChapterRoomClear,
  _itemOption,
  _resolveWorldInteraction,
  _sceneItemOptions,
  _selectWave,
  _setupChapterRoom,
  _spawnBoss,
  _spawnChapterExits,
  _spawnLogic,
  _spawnOne,
  _supplyOption,
  _tickEndlessBoss,
  _worldInteractionOptions,
  addMetaXp,
  applyGamepadDeadzone,
  applyHeroTalent,
  applyLevelReward,
  applyMetaTalents,
  bossCombatSnapshot,
  buildCovenantSnapshot,
  buildPauseCodex,
  buildingBounds,
  closedBuildingLabel,
  collectionProgress,
  collectionView,
  covenantSummary,
  damageHistoryCard,
  damageRecap,
  deleteCovenant,
  emptyCollection,
  endlessDifficultyScales,
  enemyArchetypeSlot,
  enemyDamageSource,
  enemyHitRadius,
  ensureCollection,
  eventDiscoveryId,
  fireBossFan,
  freshMetaProgression,
  getBossesFor,
  getCovenant,
  getHero,
  getSaveHealth,
  getStageModifiers,
  getWavesFor,
  grantRunProgress,
  heroPrefersReducedMotion,
  isRecord,
  isRetainedBuilding,
  killCoinReward,
  levelChoices,
  loadCovenants,
  localDateKey,
  metaXpForNext,
  normalizeMetaProgression,
  onBossAbility,
  performanceScore,
  purchaseMetaTalent,
  readJournal,
  recordDiscovery,
  recordHealthLoss,
  registerWeaponClass,
  renderEnemyCast,
  resolveRectObstacle,
  restoreBossCombat,
  restoreCovenantState,
  restoreDamageHistory,
  ritualActionFrame,
  sampleJoystick,
  saveCovenant,
  segmentRectHit,
  spawnBossMinions,
  terrainCourtyard,
  terrainRoads,
  toggleMetaTalent,
  updateEnemies,
  updateEnemyProjectiles,
  updateExpOrbs,
  updateHeroAnimation,
  updateMines,
  updateProjectiles,
  validCovenants,
  writeCovenants,
  writeJournal
};
