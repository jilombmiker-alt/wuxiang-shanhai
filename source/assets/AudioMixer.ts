export const defaultAudio = () => ({
  muted: false,
  master: 60,
  sfx: 80,
  music: 40,
});
export function validAudio(v: any) {
  return (
    v &&
    typeof v.muted === "boolean" &&
    ["master", "sfx", "music"].every(
      (k) => Number.isInteger(v[k]) && v[k] >= 0 && v[k] <= 100,
    )
  );
}
const cooldowns = {
  hit: 0.1,
  shoot: 0.1,
  explosion: 0.15,
  pickup: 0.12,
  damage: 0.3,
  bossSpawn: 1,
  bossWarn: 0.4,
  levelUp: 0.3,
  death: 1,
  achievement: 0.4,
};
const priority = (id: string) =>
  ["death", "bossWarn", "bossSpawn", "damage", "levelUp"].includes(id) ? 2 : 1;
/** No platform APIs here: policy is tested against a recording playback port. */
export class AudioMixer {
  config = defaultAudio();
  ready = false;
  active = false;
  unlocked = false;
  hidden = false;
  time = 0;
  musicPlaying = false;
  last: any = {};
  voices: any[] = Array.from({ length: 6 }, () => ({ until: 0, id: "" }));
  constructor(
    public port: any,
    public durations: any,
  ) {}
  configure(config: any) {
    this.config = validAudio(config) ? { ...config } : defaultAudio();
    this.sync();
  }
  gesture() {
    this.unlocked = true;
    this.hidden = false;
    this.sync();
  }
  mode(active: boolean) {
    if (this.active === active) return;
    this.active = active;
    if (!active) this.stopEffects();
    this.sync();
  }
  tick(dt: number) {
    if (Number.isFinite(dt) && dt > 0) this.time += Math.min(dt, 0.25);
  }
  hide() {
    this.hidden = true;
    this.active = false;
    this.stopEffects();
    this.sync();
  }
  gain(channel: string) {
    return this.config.muted
      ? 0
      : (this.config.master * this.config[channel]) / 10000;
  }
  sync() {
    const play =
      this.ready &&
      this.unlocked &&
      !this.hidden &&
      this.active &&
      this.gain("music") > 0;
    this.port.musicVolume(this.gain("music"));
    if (play !== this.musicPlaying) {
      this.musicPlaying = play;
      play ? this.port.musicPlay() : this.port.musicPause();
    }
    for (let i = 0; i < 6; i++) this.port.volume(i, this.gain("sfx"));
    if (!this.gain("sfx")) this.stopEffects();
  }
  stopEffects() {
    for (let i = 0; i < 6; i++) {
      this.port.stop(i);
      this.voices[i] = { until: 0, id: "" };
    }
  }
  play(id: string, preview = false) {
    if (
      !this.ready ||
      !this.unlocked ||
      this.hidden ||
      (!this.active && !preview) ||
      !this.gain("sfx") ||
      !this.durations[id]
    )
      return false;
    if (this.time - (this.last[id] ?? -Infinity) < (cooldowns[id] ?? 0.15))
      return false;
    let slot = this.voices.findIndex((v) => v.until <= this.time);
    if (slot < 0 && priority(id) > 1)
      slot = this.voices.findIndex((v) => priority(v.id) < priority(id));
    if (slot < 0) return false;
    this.port.stop(slot);
    this.port.play(slot, id, this.gain("sfx"));
    this.voices[slot] = { until: this.time + this.durations[id], id };
    this.last[id] = this.time;
    return true;
  }
  destroy() {
    this.hide();
    this.port.musicStop();
  }
}
