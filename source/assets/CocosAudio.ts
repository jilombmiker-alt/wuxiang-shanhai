import { Node, AudioSource, AudioClip, resources, JsonAsset } from "cc";
import { AudioMixer } from "./AudioMixer";
/** Owned sources, not playOneShot: pause/mute/hide must be able to stop every sound. */
export class CocosAudio {
  mixer: AudioMixer;
  music: AudioSource;
  voices: AudioSource[] = [];
  clips: Record<string, AudioClip> = {};
  status = "loading";
  private root: Node;
  private disposed = false;
  constructor(parent: Node) {
    this.root = new Node("Audio playback");
    parent.addChild(this.root);
    const source = (name: string) => {
      const n = new Node(name);
      this.root.addChild(n);
      const s = n.addComponent(AudioSource);
      s.playOnAwake = false;
      return s;
    };
    this.music = source("Music");
    this.music.loop = true;
    this.voices = Array.from({ length: 6 }, (_, i) => source("SFX " + i));
    this.mixer = new AudioMixer(
      {
        musicVolume: (v) => (this.music.volume = v),
        musicPlay: () => this.music.play(),
        musicPause: () => this.music.pause(),
        musicStop: () => this.music.stop(),
        volume: (i, v) => (this.voices[i].volume = v),
        stop: (i) => this.voices[i].stop(),
        play: (i, id, v) => {
          const s = this.voices[i];
          s.clip = this.clips[id];
          s.volume = v;
          s.play();
        },
      },
      {},
    );
  }
  private loadResource(path: string, type: any): Promise<any> {
    return new Promise((resolve, reject) =>
      resources.load(path, type, (e, a) => (e ? reject(e) : resolve(a))),
    );
  }
  async load() {
    try {
      const manifest = await this.loadResource("audio/manifest", JsonAsset);
      const loaded = await Promise.all(
        manifest.json.files.map(async (f) => [
          f,
          await this.loadResource("audio/" + f.id, AudioClip),
        ]),
      );
      if (this.disposed) return;
      for (const [f, clip] of loaded) {
        this.clips[f.id] = clip;
        this.mixer.durations[f.id] = f.duration;
      }
      this.music.clip = this.clips.music;
      this.mixer.ready = true;
      this.status = "ready";
      this.mixer.sync();
    } catch {
      this.status = "unavailable";
      this.mixer.ready = false;
      this.mixer.hide();
    }
  }
  snapshot() {
    return {
      status: this.status,
      clips: Object.keys(this.clips).length,
      active: this.mixer.active,
      unlocked: this.mixer.unlocked,
      hidden: this.mixer.hidden,
      musicPlaying: this.music.playing,
      musicTime: this.music.currentTime,
      musicVolume: this.music.volume,
      sfxVolume: this.voices[0].volume,
      playing: this.voices.filter((s) => s.playing).length,
    };
  }
  destroy() {
    this.disposed = true;
    this.mixer.destroy();
    this.root.destroy();
  }
}
