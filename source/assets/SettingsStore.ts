import { CombatCore as C } from "./CombatSession";
import { defaultAudio, validAudio } from "./AudioMixer";
import { COACH_IDS } from "./CombatCoach";

export const ACTIONS = [
  "up",
  "down",
  "left",
  "right",
  "skill",
  "ultimate",
  "interact",
  "map",
];
export const ACTION_NAMES = [
  "向上",
  "向下",
  "向左",
  "向右",
  "主动技能",
  "终极技能",
  "附近交互",
  "路线地图",
];
export const SETTING_KEYS = [
  "reducedMotion",
  "damageNumbers",
  "highContrast",
  "showFPS",
  "contextHints",
];
export const SETTINGS_KEY = "wuxiang_cocos_settings_v1";
export const defaultSettings = () => ({
  version: 1,
  reducedMotion: false,
  damageNumbers: true,
  highContrast: false,
  showFPS: false,
  contextHints: true,
  hintHistory: [] as string[],
  audio: defaultAudio(),
  bindings: {
    up: 87,
    down: 83,
    left: 65,
    right: 68,
    skill: 69,
    ultimate: 81,
    interact: 70,
    map: 77,
  },
});
export function validSettings(v: any) {
  return (
    C.isRecord(v) &&
    v.version === 1 &&
    (v.audio === undefined || validAudio(v.audio)) &&
    SETTING_KEYS.slice(0, 4).every((k) => typeof v[k] === "boolean") &&
    (v.contextHints === undefined || typeof v.contextHints === "boolean") &&
    (v.hintHistory === undefined ||
      (Array.isArray(v.hintHistory) &&
        v.hintHistory.length <= COACH_IDS.length &&
        new Set(v.hintHistory).size === v.hintHistory.length &&
        v.hintHistory.every((id: string) => COACH_IDS.includes(id)))) &&
    C.isRecord(v.bindings) &&
    ACTIONS.every(
      (a) =>
        Number.isInteger(v.bindings[a]) &&
        v.bindings[a] >= 65 &&
        v.bindings[a] <= 90,
    ) &&
    new Set(ACTIONS.map((a) => v.bindings[a])).size === ACTIONS.length
  );
}
/** Native key codes, unlike the browser keymap's DOM strings. Same durable journal. */
export class SettingsStore {
  data: any = defaultSettings();
  code = "unknown";
  constructor(public storage: any) {
    this.reload();
  }
  reload() {
    const r = C.readJournal(this.storage, SETTINGS_KEY, validSettings);
    this.code = r.code;
    if (r.value)
      this.data = {
        ...defaultSettings(),
        ...r.value,
        audio: r.value.audio || defaultAudio(),
      };
    else if (r.code === "ok") this.data = defaultSettings();
    return ["ok", "recovered"].includes(this.code);
  }
  commit(candidate: any) {
    if (
      !validSettings(candidate) ||
      ["corrupt", "unavailable", "memory"].includes(this.code)
    )
      return false;
    const r = C.writeJournal(
      this.storage,
      SETTINGS_KEY,
      candidate,
      validSettings,
    );
    this.code = r.code;
    if (r.ok) this.data = JSON.parse(JSON.stringify(candidate));
    return r.ok;
  }
  toggle(key: string) {
    if (!SETTING_KEYS.includes(key)) return false;
    return this.commit({ ...this.data, [key]: !this.data[key] });
  }
  rememberHints(ids: string[]) {
    return this.commit({ ...this.data, hintHistory: ids });
  }
  sound(key: string, delta = 20) {
    if (!["muted", "master", "sfx", "music"].includes(key)) return false;
    const audio = { ...(this.data.audio || defaultAudio()) };
    if (key === "muted") audio.muted = !audio.muted;
    else audio[key] = Math.max(0, Math.min(100, audio[key] + delta));
    return this.commit({ ...this.data, audio });
  }
  bind(action: string, code: number) {
    if (
      !ACTIONS.includes(action) ||
      !Number.isInteger(code) ||
      code < 65 ||
      code > 90
    )
      return "unsupported";
    if (ACTIONS.some((a) => a !== action && this.data.bindings[a] === code))
      return "conflict";
    return this.commit({
      ...this.data,
      bindings: { ...this.data.bindings, [action]: code },
    })
      ? "ok"
      : "write-failed";
  }
  reset() {
    return this.commit(defaultSettings());
  }
}
