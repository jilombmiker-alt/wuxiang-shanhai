import { CombatSession, CombatCore as C } from "./CombatSession";
import { PROFILE_KEY, validProfile } from "./ProfileStore";
import { SETTINGS_KEY, validSettings } from "./SettingsStore";

export const VAULT_KEY = "cocos:complete-vault-v1";
export const BACKUP_LIMIT = 2 * 1024 * 1024;
function byteLength(text: string) {
  let n = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 128) n++;
    else if (c < 2048) n += 2;
    else if (
      c >= 0xd800 &&
      c <= 0xdbff &&
      text.charCodeAt(i + 1) >= 0xdc00 &&
      text.charCodeAt(i + 1) <= 0xdfff
    ) {
      n += 4;
      i++;
    } else n += 3;
  }
  return n;
}
const logicalKeys = [C.COVENANT_STORAGE_KEY, PROFILE_KEY, SETTINGS_KEY];
const allowedKeys = logicalKeys.flatMap((k) =>
  ["", ":backup", ":damaged"].map((s) => "cocos:" + k + s),
);
const clone = (v: any) => JSON.parse(JSON.stringify(v));
const validRecords = (v: any) =>
  C.isRecord(v) &&
  v.version === 1 &&
  C.isRecord(v.records) &&
  Object.entries(v.records).every(
    ([k, x]) => allowedKeys.includes(k) && typeof x === "string",
  );
const validBank = (v: any) =>
  validRecords(v) && (v.beforeImport == null || validRecords(v.beforeImport));
export function checksum(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
function known(list: any, defs: any, max: number) {
  return (
    Array.isArray(list) &&
    list.length <= max &&
    new Set(list).size === list.length &&
    list.every((id) => Object.values(defs).some((d: any) => d.id === id))
  );
}
export function validatePayload(p: any) {
  if (
    !C.isRecord(p) ||
    !C.validCovenants(p.slots) ||
    p.slots.length !== 3 ||
    !validProfile(p.profile) ||
    !validSettings(p.settings)
  )
    return false;
  const meta = p.profile.meta;
  if (
    meta.level < 1 ||
    meta.level > C.META_LEVEL_CAP ||
    meta.equippedTalents.length > 3 ||
    !known(
      meta.purchasedTalents,
      C.META_TALENTS,
      Object.keys(C.META_TALENTS).length,
    ) ||
    !meta.equippedTalents.every((id) => meta.purchasedTalents.includes(id))
  )
    return false;
  const serials = new Set();
  try {
    for (const s of p.slots) {
      if (!s) continue;
      const hero = C.HEROES[s.selectedHeroId];
      if (
        !hero ||
        !hero.talents.some((t) => t.id === s.selectedHeroTalentId) ||
        !["chapter", "endless"].includes(s.runMode) ||
        !Object.values(C.STAGES).some((d: any) => d.id === s.stageId) ||
        !C.isRecord(s.player) ||
        !C.isRecord(s.build)
      )
        return false;
      if (s.cocosRunSerial != null) {
        if (
          s.cocosRunSerial >= p.profile.nextSerial ||
          serials.has(s.cocosRunSerial)
        )
          return false;
        serials.add(s.cocosRunSerial);
      }
      if (
        !Array.isArray(s.player.weapons) ||
        s.player.weapons.length > C.CONFIG.MAX_WEAPONS ||
        new Set(s.player.weapons.map((w) => w.id)).size !==
          s.player.weapons.length ||
        s.player.weapons.some(
          (w) =>
            !Object.values(C.WEAPONS).some((d: any) => d.id === w.id) ||
            !Number.isInteger(w.level) ||
            w.level < 1 ||
            w.level > C.CONFIG.WEAPON_MAX_LEVEL,
        )
      )
        return false;
      if (
        !C.isRecord(s.player.passives) ||
        Object.keys(s.player.passives).length > C.CONFIG.MAX_PASSIVES ||
        Object.entries(s.player.passives).some(
          ([id, n]: any) =>
            !Object.values(C.PASSIVES).some((d: any) => d.id === id) ||
            !Number.isInteger(n) ||
            n < 1 ||
            n > C.CONFIG.PASSIVE_MAX_STACK,
        )
      )
        return false;
      if (
        !known(s.build.relics, C.RELICS, C.CONFIG.MAX_RELICS) ||
        !known(s.build.curses, C.CURSES, 4) ||
        !known(s.build.fusions, C.FUSION_RECIPES, C.FUSION_RECIPES.length)
      )
        return false;
      if (
        s.cocosBuildChoice &&
        !known(
          s.cocosBuildChoice.ids,
          s.cocosBuildChoice.kind === "curse" ? C.CURSES : C.RELICS,
          3,
        )
      )
        return false;
      if (s.cocosMetaTalents && !known(s.cocosMetaTalents, C.META_TALENTS, 3))
        return false;
      const r = new CombatSession(s.selectedHeroId, s.selectedHeroTalentId, {
        snapshot: s,
        mode: s.runMode,
        stage: s.stageId,
      });
      if (
        ![
          r.player.x,
          r.player.y,
          r.player.hp,
          r.player.maxHp,
          r.player.getDamageMult(),
          r.player.getSpeedMult(),
          r.player.getCooldownMult(),
        ].every(Number.isFinite)
      )
        return false;
    }
  } catch {
    return false;
  }
  return true;
}
export function encodeBackup(payload: any) {
  if (!validatePayload(payload))
    throw Error("当前资料未通过备份校验，请先处理存档错误。");
  const file = {
    format: "wuxiang-cocos-backup",
    version: 1,
    createdAt: new Date().toISOString(),
    payload: clone(payload),
    checksum: checksum(JSON.stringify(payload)),
  };
  const text = JSON.stringify(file);
  if (byteLength(text) > BACKUP_LIMIT)
    throw Error("备份超过 2 MiB 限额，未导出。");
  return text;
}
export function decodeBackup(text: string) {
  if (typeof text !== "string" || byteLength(text) > BACKUP_LIMIT)
    throw Error("文件超过 2 MiB 限额。");
  let f: any;
  try {
    f = JSON.parse(text, (k, v) => {
      if (
        ["__proto__", "prototype", "constructor"].includes(k) ||
        (typeof v === "number" && !Number.isFinite(v))
      )
        throw Error("unsafe");
      return v;
    });
  } catch {
    throw Error("不是有效的备份 JSON，原进度未改变。");
  }
  if (
    f?.format !== "wuxiang-cocos-backup" ||
    f.version !== 1 ||
    typeof f.createdAt !== "string" ||
    f.createdAt.length > 40 ||
    !Number.isFinite(Date.parse(f.createdAt))
  )
    throw Error("不是受支持的 Cocos 备份版本；浏览器旧原型备份不能混用。");
  if (
    f.checksum !== checksum(JSON.stringify(f.payload)) ||
    !validatePayload(f.payload)
  )
    throw Error("备份校验失败，可能损坏或含不支持的内容；未导入。");
  return f;
}
/** Import switches one complete bank atomically; legacy keys remain untouched. */
export class BackupVault {
  private bank: any = null;
  private expectedRaw: string | null = null;
  code = "ok";
  constructor(public raw: any) {
    this.reload();
  }
  reload() {
    const r = C.readJournal(this.raw, VAULT_KEY, validBank);
    this.bank = r.value;
    this.code = r.code;
    try {
      this.expectedRaw = this.raw.getItem(VAULT_KEY);
      if (!r.value && this.raw.getItem(VAULT_KEY + ":backup"))
        this.code = "corrupt";
    } catch {
      this.code = "unavailable";
    }
    return ["ok", "recovered"].includes(this.code);
  }
  private ensure() {
    if (!["ok", "recovered", "write-failed"].includes(this.code))
      throw Error("完整资料不可读，请恢复有效备份。");
    if (this.raw.getItem(VAULT_KEY) !== this.expectedRaw)
      throw Error(
        "另一窗口修改了资料，已停止写入。请确认另一窗口保存后重新打开本页。",
      );
  }
  getItem(key: string) {
    this.ensure();
    return this.bank ? (this.bank.records[key] ?? null) : this.raw.getItem(key);
  }
  setItem(key: string, value: string) {
    this.ensure();
    if (!this.bank) {
      this.raw.setItem(key, value);
      return;
    }
    const b = clone(this.bank);
    b.records[key] = value;
    this.commit(b);
  }
  removeItem(key: string) {
    this.ensure();
    if (!this.bank) {
      this.raw.removeItem(key);
      return;
    }
    const b = clone(this.bank);
    delete b.records[key];
    this.commit(b);
  }
  private commit(bank: any) {
    const r = C.writeJournal(this.raw, VAULT_KEY, bank, validBank);
    this.code = r.code;
    if (!r.ok) throw Error("整套资料写入失败，旧进度保留。");
    this.bank = bank;
    this.expectedRaw = r.raw;
  }
  private currentBank() {
    // Keep one checkpoint, not an ever-growing recursive history.
    if (this.bank) return { version: 1, records: clone(this.bank.records) };
    const records = {};
    for (const k of allowedKeys) {
      const v = this.raw.getItem(k);
      if (v !== null) records[k] = v;
    }
    return { version: 1, records };
  }
  replace(payload: any) {
    if (!validatePayload(payload)) return false;
    try {
      if (this.code === "corrupt") {
        if (this.raw.getItem(VAULT_KEY) !== this.expectedRaw) return false;
      } else this.ensure();
      const prior = this.code === "corrupt" ? null : this.currentBank();
      const records = {};
      for (const [i, value] of [
        payload.slots,
        payload.profile,
        payload.settings,
      ].entries())
        records["cocos:" + logicalKeys[i]] = JSON.stringify(value);
      // Progress and its rollback point become visible in the same primary write.
      this.commit({ version: 1, records, beforeImport: prior });
      return true;
    } catch {
      return false;
    }
  }
  canUndo() {
    const prior = this.bank?.beforeImport;
    if (!prior) return false;
    const storage = { getItem: (key: string) => prior.records[key] ?? null };
    return [C.validCovenants, validProfile, validSettings].every((valid, i) =>
      ["ok", "recovered"].includes(
        C.readJournal(storage, "cocos:" + logicalKeys[i], valid).code,
      ),
    );
  }
  undo() {
    try {
      this.ensure();
      if (!this.canUndo()) return false;
      const old = this.bank?.beforeImport;
      if (!old) return false;
      this.commit({ ...clone(old), beforeImport: clone(old) });
      return true;
    } catch {
      return false;
    }
  }
}
