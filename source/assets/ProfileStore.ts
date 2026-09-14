import { CombatCore as C } from "./CombatSession";

const KEY = "wuxiang_cocos_profile_v1";
const clone = (value: any) => JSON.parse(JSON.stringify(value));
const fresh = () => ({
  version: 1,
  meta: C.freshMetaProgression(),
  collection: C.emptyCollection(),
  nextSerial: 1,
  settled: [
    { serial: 0, reward: null },
    { serial: 0, reward: null },
    { serial: 0, reward: null },
  ],
});
const valid = (value: any) =>
  C.isRecord(value) &&
  value.version === 1 &&
  C.isRecord(value.meta) &&
  ["level", "xp", "currency", "lifetimeCurrency"].every(
    (key) => Number.isFinite(value.meta[key]) && value.meta[key] >= 0,
  ) &&
  ["purchasedTalents", "equippedTalents"].every(
    (key) =>
      Array.isArray(value.meta[key]) &&
      value.meta[key].every((id: any) => typeof id === "string"),
  ) &&
  C.isRecord(value.collection) &&
  C.COLLECTION_KINDS.every(
    (kind: string) =>
      Array.isArray(value.collection[kind]) &&
      value.collection[kind].every((id: any) => typeof id === "string"),
  ) &&
  Number.isSafeInteger(value.nextSerial) &&
  value.nextSerial >= 1 &&
  Array.isArray(value.settled) &&
  value.settled.length === 3 &&
  value.settled.every(
    (v: any) =>
      C.isRecord(v) &&
      Number.isSafeInteger(v.serial) &&
      v.serial >= 0 &&
      v.serial < value.nextSerial,
  );
export { KEY as PROFILE_KEY, valid as validProfile };

/** Shared growth rules, separate native profile. Commit state only after durable write. */
export class ProfileStore {
  data: any = fresh();
  code = "unknown";
  recovered = false;
  storage: any;
  constructor(storage: any) {
    this.storage = storage;
    this.reload();
  }
  reload() {
    const result = C.readJournal(this.storage, KEY, valid);
    this.code = result.code;
    this.recovered ||= result.code === "recovered";
    if (result.value) {
      this.data = result.value;
      this.data.meta = C.normalizeMetaProgression(this.data.meta);
      C.ensureCollection(this.data);
    } else if (result.code === "ok") this.data = fresh();
    return ["ok", "recovered"].includes(this.code);
  }
  private commit(candidate: any) {
    if (["corrupt", "unavailable", "memory"].includes(this.code)) return false;
    const result = C.writeJournal(this.storage, KEY, candidate, valid);
    this.code = result.code;
    if (result.ok) this.data = candidate;
    return result.ok;
  }
  allocate() {
    if (!["ok", "recovered", "write-failed"].includes(this.code)) return null;
    const next = clone(this.data),
      serial = next.nextSerial++;
    return this.commit(next) ? serial : null;
  }
  ensureSerial(serial: number) {
    if (!["ok", "recovered", "write-failed"].includes(this.code)) return false;
    if (serial < this.data.nextSerial) return true;
    const next = clone(this.data);
    next.nextSerial = serial + 1;
    return this.commit(next);
  }
  isSettled(slot: number, serial: number) {
    return (
      Number.isSafeInteger(serial) &&
      serial > 0 &&
      serial <= this.data.settled[slot - 1]?.serial
    );
  }
  private merge(target: any, discoveries: any) {
    for (const kind of C.COLLECTION_KINDS)
      for (const id of Array.from(discoveries?.[kind] || []))
        C.recordDiscovery(target, kind, id);
  }
  discover(discoveries: any) {
    const next = clone(this.data);
    this.merge(next, discoveries);
    if (
      JSON.stringify(next.collection) ===
        JSON.stringify(this.data.collection) &&
      ["ok", "recovered"].includes(this.code)
    )
      return true;
    return this.commit(next);
  }
  settle(slot: number, serial: number, completion: any, discoveries: any) {
    if (this.isSettled(slot, serial))
      return {
        ok: true,
        reward: this.data.settled[slot - 1].reward,
        repeated: true,
      };
    if (
      !Number.isSafeInteger(serial) ||
      serial < 1 ||
      serial >= this.data.nextSerial ||
      slot < 1 ||
      slot > 3
    )
      return { ok: false };
    const next = clone(this.data);
    this.merge(next, discoveries);
    const reward = C.grantRunProgress(next.meta, completion.run, {
      dateKey: completion.dateKey,
    });
    next.settled[slot - 1] = { serial, reward };
    return { ok: this.commit(next), reward, repeated: false };
  }
  talent(id: string) {
    const next = clone(this.data);
    const result = next.meta.purchasedTalents.includes(id)
      ? C.toggleMetaTalent(next.meta, id)
      : C.purchaseMetaTalent(next.meta, id);
    if (!result.ok) return result;
    if (!this.commit(next)) return { ok: false, reason: "storage" };
    return result;
  }
}
