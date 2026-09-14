import * as Shared from "./shared-core.js";
const C: any = Shared;
export { C as CombatCore };

/** Native-compatible host of the shared rules. No DOM; persistence supplied by native stores. */
export class CombatSession {
  [key: string]: any;
  player: any;
  enemies: any[] = [];
  projectiles: any[] = [];
  enemyProjectiles: any[] = [];
  mines: any[] = [];
  expOrbs: any[] = [];
  texts: any[] = [];
  state = C.GameState.PLAYING;
  runMode = "endless";
  stageId = "forest";
  stageMods = {};
  gameTime = 0;
  damageHistory = C.restoreDamageHistory(null, 0);
  kills = 0;
  runCoins = 0;
  combatCoinsEarned = 0;
  enemyDmgMult = 1;
  run: any = { orbsCollected: 0 };
  save = {
    settings: {
      difficulty: "normal",
      reducedMotion: false,
      criticalFlash: false,
      damageNumbers: true,
      highContrast: false,
    },
  };
  spatial = new C.SpatialHash(C.CONFIG.SPATIAL_CELL_SIZE);
  combatVisuals = new C.CombatVisualLayer();
  reactions: any;
  buildSystem: any;
  heroSkills: any;
  hostileFields: any;
  ui = { showBossBanner() {}, updateHud() {} };
  audio = {
    shoot() {},
    explosion() {},
    pickup() {},
    hit() {},
    bossSpawn() {},
    bossWarn() {},
  };
  effects = new C.EffectLayer(); // Reuse simulation-time delayed attacks; burst visuals are not drawn.
  _lastMoveVec = { x: 1, y: 0 };
  direction = { x: 0, y: 0 };
  input = { getMoveVector: () => this.direction };
  choices: any[] = [];
  pendingLevelUps = 0;
  buildChoice: any = null;
  _spawnAccumulator = 0;
  arenaWidth = C.CONFIG.ARENA_WIDTH;
  arenaHeight = C.CONFIG.ARENA_HEIGHT;
  canvas = { width: 1200, height: 800 }; // Logical viewport, not an HTML canvas.
  camera = { worldX: 0, worldY: 0 };
  worldMap: any;
  interactions: any;
  chapterRoute: any;
  endlessRun = new C.EndlessRun();
  environment = new C.EnvironmentState();
  shopPurchases = 0;
  activeInteraction: any = null;
  _interactionOptions: any[] = [];
  message = "";
  outcome: string | null = null;
  discoveries: Record<string, Set<string>> = {};

  constructor(
    heroId = "sword",
    talentId?: string,
    options: {
      mode?: string;
      difficulty?: string;
      stage?: string;
      snapshot?: any;
      store?: any;
      slot?: number;
      profile?: any;
      serial?: number;
    } = {},
  ) {
    const difficulty = options.snapshot
      ? options.snapshot.cocosDifficulty
      : options.difficulty;
    this.save.settings.difficulty = Object.values(C.Difficulty).some(
      (d: any) => d.id === difficulty,
    )
      ? difficulty
      : "normal";
    this.runMode = options.mode === "chapter" ? "chapter" : "endless";
    this.stageId = Object.values(C.STAGES).some(
      (stage: any) => stage.id === options.stage,
    )
      ? options.stage
      : "forest";
    this.stageMods = C.getStageModifiers(this.stageId);
    this.stageWaves = C.getWavesFor(this.stageId);
    this.stageBosses = C.getBossesFor(this.stageId);
    this.currentWave = this.stageWaves[0];
    for (const name of [
      "_selectWave",
      "_computeDifficultyMults",
      "_spawnLogic",
      "_spawnOne",
      "_spawnBoss",
      "_tickEndlessBoss",
      "onBossAbility",
      "spawnBossMinions",
      "fireBossFan",
      "_setupChapterRoom",
      "_handleChapterRoomClear",
      "_spawnChapterExits",
      "_applyColdTick",
      "_worldInteractionOptions",
      "_sceneItemOptions",
      "_supplyOption",
      "_itemOption",
      "_resolveWorldInteraction",
      "_grantWorldItem",
    ])
      this[name] = C[name].bind(this);
    C.registerWeaponClass(C.Weapon);
    this.player = new C.Player(0, 0);
    this.buildSystem = new C.RunBuildSystem(this);
    this.buildSystem.reset(this.player);
    const hero = C.getHero(heroId);
    C.applyHeroTalent(this.player, hero, talentId);
    this.selectedHeroId = hero.id;
    this.selectedHero = hero;
    this.selectedHeroTalentId = this.player.heroTalentId;
    this.store = options.store;
    this.profile = options.profile;
    this.serial = options.serial || options.snapshot?.cocosRunSerial;
    this.runMetaTalents = options.snapshot
      ? options.snapshot.cocosMetaTalents || []
      : Array.from(this.profile?.data.meta.equippedTalents || []);
    this.activeCovenantSlot = options.slot || 1;
    const bonuses = C.applyMetaTalents(
      this.player,
      options.snapshot ? null : this.profile?.data.meta,
    );
    this.player.weapons.push(
      new C.Weapon(
        Object.values(C.WEAPONS).find((w: any) => w.id === hero.startingWeapon),
      ),
    );
    if (bonuses.extraStartingWeapon) {
      const extraId = {
        sword: "knife",
        paper: "lightning",
        devourer: "soul_drain",
        star: "boomerang",
      }[hero.id];
      const def = Object.values(C.WEAPONS).find((w: any) => w.id === extraId);
      if (def) this.player.weapons.push(new C.Weapon(def));
    }
    this.runCoins = bonuses.startCoins;
    this._recordDiscovery("heroes", hero.id);
    for (const w of this.player.weapons) this._recordDiscovery("weapons", w.id);
    for (const [kind, ids] of Object.entries(
      options.snapshot?.cocosDiscoveries || {},
    ))
      for (const id of ids as string[]) this._recordDiscovery(kind, id);
    const gainExp = this.player.gainExp.bind(this.player);
    this.player.gainExp = (amount: number) => {
      const levels = gainExp(amount);
      this.pendingLevelUps += levels.length;
      return levels;
    };
    this.reactions = new C.ReactionSystem(this);
    this.hostileFields = new C.HostileFieldSystem(this);
    this.heroSkills = new C.QingfengSkillController(this);
    this.heroSkills.setHero(hero.id);
    this.chapterRoute = new C.ChapterRouteSystem();
    this.chapterRoute.reset(options.snapshot?.chapterRoute, this.stageId);
    this.endlessRun.restore(options.snapshot?.endlessRun);
    this.worldMap = new C.WorldMapSystem(this);
    this.interactions = new C.InteractionSystem(this);
    this.worldMap.reset({
      mode: this.runMode,
      stageId: this.stageId,
      player: this.player,
    });
    this.interactions.reset(this.player, { mode: this.runMode });
    if (this.runMode === "chapter") this._setupChapterRoom();
    if (options.snapshot) C.restoreCovenantState.call(this, options.snapshot);
    this.lastSavedTime = this.gameTime;
    if (this.endlessRun.pendingDecision) this.state = C.GameState.MILESTONE;
    if (options.snapshot?.cocosBuildChoice) {
      const saved = options.snapshot.cocosBuildChoice,
        defs = saved.kind === "relic" ? C.RELICS : C.CURSES;
      const owned =
        saved.kind === "relic"
          ? this.buildSystem.relics
          : this.buildSystem.curses;
      const choices = saved.ids
        .map((id: string) => defs[id])
        .filter((d: any) => d && !owned.has(d.id));
      if (choices.length) {
        this.buildChoice = { kind: saved.kind, choices };
        this.state = C.GameState.BUILD_CHOICE;
      }
    }
    if (options.snapshot?.cocosCompletion) {
      this.completion = options.snapshot.cocosCompletion;
      this.outcome = this.completion.outcome;
      this.player.hp = options.snapshot.player.hp;
      this.state = C.GameState.GAMEOVER;
    }
    this._updateCamera();
  }

  _usesEndlessTimeline() {
    return this.runMode === "endless";
  }
  _announce(text: string) {
    this.message = text;
  }
  _recordDiscovery(kind: string, id: string) {
    (this.discoveries[kind] ||= new Set()).add(id);
  }
  covenantSnapshot() {
    return {
      ...C.buildCovenantSnapshot(this),
      cocosDifficulty: this.save.settings.difficulty,
      cocosRunSerial: this.serial,
      cocosDiscoveries: Object.fromEntries(
        Object.entries(this.discoveries).map(([kind, ids]) => [
          kind,
          Array.from(ids),
        ]),
      ),
      cocosCompletion: this.completion || null,
      cocosBuildChoice: this.buildChoice
        ? {
            kind: this.buildChoice.kind,
            ids: this.buildChoice.choices.map((d: any) => d.id),
          }
        : null,
      cocosMetaTalents: this.runMetaTalents,
    };
  }
  saveCurrentCovenant() {
    if (
      !this.store ||
      this.player.dead ||
      this.state === C.GameState.GAMEOVER ||
      this.pendingLevelUps
    )
      return false;
    let saved = this.store.write(
      this.activeCovenantSlot,
      this.covenantSnapshot(),
    );
    if (saved && this.profile) saved = this.profile.discover(this.discoveries);
    this.lastSavedTime = this.gameTime;
    this.saveMessage = saved
      ? "命契" + this.activeCovenantSlot + "已保存到本地"
      : "保存失败，进度仍在内存；请重试，暂勿刷新或关闭";
    this.saveFailed = !saved;
    return saved;
  }
  finishCovenant() {
    if (!this.store) return true;
    if (this.profile) {
      this.completion ||= {
        outcome: this.outcome,
        dateKey: C.localDateKey(),
        run: {
          kills: this.kills,
          gameTime: this.gameTime,
          bossKills:
            this.runMode === "endless"
              ? this.endlessRun.nextIndex
              : Object.keys(this.run.bossesDefeated || {}).length,
          stageId: this.stageId,
          runMode: this.runMode,
          victory: !!this.outcome,
        },
      };
      if (
        !this.profile.isSettled(this.activeCovenantSlot, this.serial) &&
        !this.store.write(this.activeCovenantSlot, this.covenantSnapshot())
      ) {
        this.saveFailed = true;
        this.saveMessage = "结算待存档失败，请重试，暂勿关闭。";
        return false;
      }
      const result = this.profile.settle(
        this.activeCovenantSlot,
        this.serial,
        this.completion,
        this.discoveries,
      );
      if (!result.ok) {
        this.saveFailed = true;
        this.saveMessage = "命府入账失败，已保留待结算命契。返回菜单可重试。";
        return false;
      }
      this.metaReward = result.reward;
    }
    const saved = this.store.write(this.activeCovenantSlot, null);
    this.saveFailed = !saved;
    this.saveMessage = saved
      ? "本局已结束；这份命契可重新开始。"
      : "结束记录保存失败，请点击返回菜单重试，暂勿刷新或关闭。";
    return saved;
  }
  _updateCamera() {
    const x = this.player.x - this.canvas.width / 2,
      y = this.player.y - this.canvas.height / 2;
    this.camera.worldX =
      this.runMode === "endless"
        ? x
        : Math.max(0, Math.min(this.arenaWidth - this.canvas.width, x));
    this.camera.worldY =
      this.runMode === "endless"
        ? y
        : Math.max(0, Math.min(this.arenaHeight - this.canvas.height, y));
  }
  interact() {
    return this.openWorldInteraction(this.interactions.nearby);
  }
  openWorldInteraction(object: any) {
    if (this.state !== C.GameState.PLAYING || !object || object.used)
      return false;
    this.activeInteraction = object;
    this.state = C.GameState.INTERACTION;
    this.setMove(0, 0);
    this._renderWorldInteraction();
    return true;
  }
  _renderWorldInteraction() {
    this._interactionOptions = this._worldInteractionOptions(
      this.activeInteraction,
    );
  }
  closeWorldInteraction() {
    this.activeInteraction = null;
    this._interactionOptions = [];
    this.state = C.GameState.PLAYING;
    this.interactions.update(this.player);
  }
  resolveInteraction(index: number) {
    if (this.state !== C.GameState.INTERACTION || !Number.isInteger(index))
      return false;
    const option = this._interactionOptions[index];
    if (!option || option.disabled) return false;
    this._resolveWorldInteraction(option.id);
    return true;
  }
  checkpoint(action: string) {
    if (this.state !== C.GameState.MILESTONE) return false;
    if (action === "continue") {
      this.endlessRun.continueRun();
      this.player.invincible = true;
      this.player.invincibleTimer = Math.max(
        2,
        this.player.invincibleTimer || 0,
      );
      this.state = C.GameState.PLAYING;
    } else if (action === "settle") {
      this.outcome = "endless-complete";
      this.state = C.GameState.GAMEOVER;
      this.finishCovenant();
    } else return false;
    return true;
  }

  setMove(x: number, y: number, analog = false) {
    const length = Math.hypot(x, y);
    const divisor = analog ? Math.max(1, length) : length;
    this.direction =
      length && Number.isFinite(length)
        ? { x: x / divisor, y: y / divisor }
        : { x: 0, y: 0 };
    if (length && Number.isFinite(length))
      this._lastMoveVec = { x: x / length, y: y / length };
  }
  pause() {
    if (this.state === C.GameState.PLAYING) this.state = C.GameState.PAUSED;
    this.setMove(0, 0);
  }
  resume() {
    if (this.state === C.GameState.PAUSED) this.state = C.GameState.PLAYING;
  }
  cast(ultimate = false) {
    if (this.state !== C.GameState.PLAYING) return false;
    const used = ultimate
      ? this.heroSkills.useUltimate()
      : this.heroSkills.useSkill();
    if (used) ultimate ? this.audio.explosion() : this.audio.shoot();
    return used;
  }
  update(dt: number) {
    if (this.state !== C.GameState.PLAYING || !Number.isFinite(dt) || dt <= 0)
      return;
    dt = Math.min(dt, C.CONFIG.DT_CLAMP);
    this.gameTime += dt;
    this.effects.update(dt);
    const { hpMult, dmgMult, diff } = this._computeDifficultyMults();
    this.enemyDmgMult = dmgMult;
    this.currentWave = this._selectWave();
    this.player.update(dt, this);
    this.worldMap.update(this.player);
    this.interactions.update(this.player, this.gameTime);
    this.heroSkills.update(dt);
    C.updateHeroAnimation(
      this.player,
      dt,
      this.save.settings.reducedMotion || C.heroPrefersReducedMotion(),
    );
    this.spatial.insertAll(this.enemies);
    C.updateEnemies.call(this, dt, hpMult, dmgMult);
    if (this._pendingChapterVictory) {
      this.outcome = "chapter-complete";
      this.state = C.GameState.GAMEOVER;
      this.finishCovenant();
      return;
    }
    if (this.endlessRun.pendingDecision) {
      this.hostileFields.reset();
      this.state = C.GameState.MILESTONE;
      return;
    }
    C.updateProjectiles.call(this, dt);
    C.updateEnemyProjectiles.call(this, dt);
    C.updateMines.call(this, dt);
    C.updateExpOrbs.call(this, dt);
    this.hostileFields.update(dt, this);
    this.combatVisuals.update(dt);
    this._applyColdTick(dt);
    this._updateCamera();
    this._spawnLogic(dt, hpMult, dmgMult, diff.spawnMult);
    this.texts = this.texts.filter((t) => (t.life -= dt) > 0);
    if (this.player.dead) {
      this.state = C.GameState.GAMEOVER;
      this.setMove(0, 0);
      this.finishCovenant();
    } else if (this.pendingLevelUps) this.offerLevel();
    if (this.state === C.GameState.PLAYING) this.offerBuildChoice();
    if (
      this.store &&
      this.state === C.GameState.PLAYING &&
      this.gameTime - this.lastSavedTime >= 15
    ) {
      if (!this.saveCurrentCovenant()) this.pause();
    }
  }
  private offerLevel() {
    this.choices = C.levelChoices(this.player);
    this.state = C.GameState.LEVEL_UP;
    this.setMove(0, 0);
  }
  offerBuildChoice() {
    if (this.state !== C.GameState.PLAYING || this.buildChoice) return false;
    const choices = this.buildSystem.update(this.gameTime);
    if (!choices?.length) return false;
    this.buildChoice = { kind: "curse", choices };
    this.state = C.GameState.BUILD_CHOICE;
    this.setMove(0, 0);
    if (this.store) this.saveCurrentCovenant();
    return true;
  }
  chooseBuild(index: number) {
    if (this.state !== C.GameState.BUILD_CHOICE || !Number.isInteger(index))
      return false;
    const selected = this.buildChoice?.choices[index];
    if (!selected) return false;
    const granted =
      this.buildChoice.kind === "relic"
        ? this.buildSystem.grantRelic(selected.id)
        : this.buildSystem.grantCurse(selected.id);
    if (!granted) return false;
    this.buildChoice = null;
    this.buildSystem.checkFusions();
    this.state = C.GameState.PLAYING;
    if (this.store && !this.saveCurrentCovenant()) this.pause();
    return true;
  }
  choose(index: number) {
    if (
      this.state !== C.GameState.LEVEL_UP ||
      !Number.isInteger(index) ||
      !this.choices[index]
    )
      return false;
    const choice = this.choices[index];
    // Clear this offer before applying it so the same card cannot be claimed twice.
    this.choices = [];
    this.state = C.GameState.PLAYING;
    if (choice.type === "weapon") {
      const owned = this.player.weapons.find(
        (w: any) => w.id === choice.data.id,
      );
      if (owned) owned.levelUp();
      else this.player.weapons.push(new C.Weapon(choice.data));
      this._recordDiscovery("weapons", choice.data.id);
    } else if (choice.type === "passive") {
      this.player.addPassive(choice.data);
      this._recordDiscovery("passives", choice.data.id);
    } else C.applyLevelReward(this, choice.data.id);
    this.pendingLevelUps--;
    this.buildSystem.checkFusions();
    if (this.pendingLevelUps > 0) this.offerLevel();
    else this.offerBuildChoice();
    return true;
  }
  _onEnemyKilled(enemy: any, hpMult: number, dmgMult: number) {
    this.audio.hit();
    this.kills++;
    if (enemy.boss) {
      this.run.bossesDefeated ||= {};
      this.run.bossesDefeated[enemy.id] = true;
    }
    const coins = C.killCoinReward({
      boss: enemy.boss,
      kills: this.kills,
      gameTime: this.gameTime,
      earned: this.combatCoinsEarned,
      endless: this.runMode === "endless",
    });
    this.runCoins += coins;
    if (!enemy.boss) this.combatCoinsEarned += coins;
    this.heroSkills.gainEnergy(enemy.boss ? 25 : 2);
    this.expOrbs.push(new C.ExpOrb(enemy.x, enemy.y, enemy.expValue));
    if (this.runMode === "chapter") {
      if (this.chapterRoute.registerKill(enemy))
        this._handleChapterRoomClear(enemy);
    } else if (enemy.boss) {
      this.endlessRun.defeat(enemy.type);
      this.interactions.spawnBossChest(
        enemy.x,
        enemy.y,
        enemy.type.name || enemy.id,
        this.gameTime,
      );
    }
    if (enemy.splitter) {
      const type: any = Object.values(C.ENEMIES).find(
        (e: any) => e.id === enemy.type.splitInto,
      );
      if (type)
        for (let i = 0; i < (enemy.type.splitCount || 2); i++) {
          const angle = (i * Math.PI * 2) / (enemy.type.splitCount || 2);
          this.enemies.push(
            new C.Enemy(
              enemy.x + Math.cos(angle) * 14,
              enemy.y + Math.sin(angle) * 14,
              type,
              hpMult,
              dmgMult,
            ),
          );
        }
    }
  }
  createFloatingText(text: any, x: number, y: number, color: string) {
    if (this.texts.length < 24)
      this.texts.push({ text: String(text), x, y, color, life: 0.7 });
  }
  createParticles() {} // Particle bursts and screen flashes intentionally absent.
  shake() {}
  snapshot() {
    return {
      hero: this.player.heroId,
      mode: this.runMode,
      stage: this.stageId,
      outcome: this.outcome,
      room:
        this.runMode === "chapter"
          ? {
              ...this.chapterRoute.current(),
              kills: this.chapterRoute.roomKills,
              ready: this.chapterRoute.roomReady,
              exits: this.chapterRoute.choices().map((n: any) => n.id),
            }
          : null,
      boss: C.bossCombatSnapshot(this.enemies.find((e: any) => e.boss)),
      nextBoss:
        this.runMode === "endless"
          ? this.endlessRun.nextDefinition(this.stageId).spawnAt
          : null,
      interaction: this.activeInteraction
        ? {
            id: this.activeInteraction.id,
            kind: this.activeInteraction.kind,
            options: this._interactionOptions.map((o) => ({
              id: o.id,
              name: o.name,
              price: o.price,
              disabled: o.disabled,
            })),
          }
        : null,
      talent: this.player.heroTalentId,
      state: this.state,
      x: this.player.x,
      y: this.player.y,
      time: this.gameTime,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      kills: this.kills,
      coins: this.runCoins,
      exp: this.player.exp,
      level: this.player.level,
      weapons: this.player.weapons.map((w: any) => ({
        id: w.id,
        name: w.name,
        level: w.level,
      })),
      passives: Object.keys(this.player.passives),
      curses: Array.from(this.buildSystem.curses),
      buildChoice: this.buildChoice
        ? {
            kind: this.buildChoice.kind,
            ids: this.buildChoice.choices.map((d: any) => d.id),
          }
        : null,
      enemies: this.enemies.length,
      projectiles: this.projectiles.length,
      fields: this.combatVisuals.items.map((v: any) => ({
        type: v.type,
        key: v.key,
        radius: v.radius,
        stable: v.stable,
      })),
      choices: this.choices.map((c) => ({
        type: c.type,
        id: c.data.id,
        name: c.data.name,
      })),
      ability: this.heroSkills.getSnapshot(),
    };
  }
}
