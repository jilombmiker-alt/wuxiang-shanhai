import { CombatCore as C } from "./CombatSession";

/** Same journal/schema, separate namespace: never imports or overwrites browser saves. */
export class CovenantStore {
  readonly storage: any;
  constructor(storage: any) {
    this.storage = {
      getItem: (key: string) => storage.getItem("cocos:" + key),
      setItem: (key: string, value: string) =>
        storage.setItem("cocos:" + key, value),
      removeItem: (key: string) => storage.removeItem("cocos:" + key),
    };
  }
  slots() {
    return C.loadCovenants(this.storage);
  }
  health() {
    return C.getSaveHealth("covenants");
  }
  write(slot: number, snapshot: any) {
    if (!Number.isInteger(slot) || slot < 1 || slot > 3) return false;
    C.saveCovenant(slot, snapshot, this.storage);
    return this.health().code === "ok";
  }
}
