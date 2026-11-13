/**
 * Sonido chiptune sintetizado con WebAudio: efectos y pistas en bucle.
 * Sin archivos externos; se puede sustituir por OGG/MP3 libres más adelante.
 */
import type { SfxName } from '../dungeon/types';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;

const SETTINGS_KEY = 'tierras-partidas-audio';
const MUSIC_VOL = 0.45;
const SFX_VOL = 1;
const settings = loadSettings();

function loadSettings(): { music: boolean; sfx: boolean } {
  try {
    return { music: true, sfx: true, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') };
  } catch {
    return { music: true, sfx: true };
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // sin almacenamiento: el ajuste dura hasta cerrar la pestaña
  }
}

function ac(): AudioContext | null {
  if (!ctx) {
    try {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = settings.music ? MUSIC_VOL : 0;
      musicGain.connect(master);
      sfxGain = ctx.createGain();
      sfxGain.gain.value = settings.sfx ? SFX_VOL : 0;
      sfxGain.connect(master);
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Llamar en el primer gesto del usuario (los navegadores bloquean el audio antes). */
export function unlockAudio(): void {
  ac();
}

export const musicOn = () => settings.music;
export const sfxOn = () => settings.sfx;

/** Activa o desactiva la música. Devuelve el nuevo estado. */
export function toggleMusic(): boolean {
  settings.music = !settings.music;
  if (musicGain) musicGain.gain.value = settings.music ? MUSIC_VOL : 0;
  saveSettings();
  return settings.music;
}

/** Activa o desactiva los efectos de sonido. Devuelve el nuevo estado. */
export function toggleSfx(): boolean {
  settings.sfx = !settings.sfx;
  if (sfxGain) sfxGain.gain.value = settings.sfx ? SFX_VOL : 0;
  saveSettings();
  return settings.sfx;
}

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

function tone(freq: number, dur: number, type: OscillatorType, vol: number, when = 0, slideTo?: number, dest?: AudioNode) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(dest ?? sfxGain ?? master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur: number, vol: number, when = 0, dest?: AudioNode) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + when;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(g).connect(dest ?? sfxGain ?? master);
  src.start(t);
}

export function sfx(name: SfxName | 'menu' | 'confirm' | 'cancel'): void {
  switch (name) {
    case 'menu': return tone(880, 0.04, 'square', 0.08);
    case 'confirm': tone(660, 0.05, 'square', 0.1); return tone(990, 0.08, 'square', 0.1, 0.05);
    case 'cancel': return tone(440, 0.08, 'square', 0.08, 0, 220);
    case 'hit': noise(0.08, 0.25); return tone(180, 0.08, 'square', 0.15, 0, 80);
    case 'crit': noise(0.15, 0.35); return tone(300, 0.15, 'sawtooth', 0.18, 0, 60);
    case 'hurt': noise(0.1, 0.25); return tone(140, 0.12, 'sawtooth', 0.18, 0, 60);
    case 'miss': return tone(600, 0.08, 'triangle', 0.08, 0, 300);
    case 'magic': tone(500, 0.2, 'triangle', 0.15, 0, 1200); return tone(750, 0.2, 'sine', 0.1, 0.05, 1500);
    case 'heal': [0, 4, 7, 12].forEach((n, i) => tone(midi(72 + n), 0.12, 'triangle', 0.12, i * 0.06)); return;
    case 'buff': [0, 5, 10].forEach((n, i) => tone(midi(67 + n), 0.1, 'square', 0.08, i * 0.05)); return;
    case 'death': return tone(220, 0.4, 'square', 0.15, 0, 40);
    case 'levelup': [0, 4, 7, 12, 16].forEach((n, i) => tone(midi(72 + n), 0.12, 'square', 0.1, i * 0.08)); return;
    case 'pickup': tone(midi(84), 0.05, 'square', 0.08); return tone(midi(91), 0.08, 'square', 0.08, 0.05);
    case 'stairs': [0, -3, -7, -12].forEach((n, i) => tone(midi(64 + n), 0.12, 'triangle', 0.12, i * 0.08)); return;
    case 'throw': return noise(0.12, 0.12);
    case 'boss': [0, 3, 7, 10, 15].forEach((n, i) => tone(midi(52 + n), 0.3, 'sawtooth', 0.1, i * 0.12)); return;
  }
}

// ---------------------------------------------------------------- música

export type Track = 'title' | 'town' | 'dungeon' | 'hondonada' | 'boss' | 'victory' | 'defeat' | null;

interface TrackDef {
  bpm: number;
  /** Suena una sola vez (fanfarrias) en lugar de en bucle. */
  once?: boolean;
  bass: (number | null)[];
  lead: (number | null)[];
  leadType: OscillatorType;
}

// Notas MIDI por semicorchea; null = silencio. Modo menor, ambiente oscuro.
const TRACKS: Record<Exclude<Track, null>, TrackDef> = {
  title: {
    bpm: 70, leadType: 'triangle',
    bass: [45, null, null, null, 45, null, null, null, 41, null, null, null, 43, null, null, null],
    lead: [69, null, 72, null, 76, null, 74, 72, 71, null, 69, null, 67, null, null, null],
  },
  town: {
    bpm: 84, leadType: 'triangle',
    bass: [50, null, 57, null, 50, null, 57, null, 46, null, 53, null, 48, null, 55, null],
    lead: [74, null, 77, null, 76, 74, 72, null, 70, null, 72, null, 74, null, null, null],
  },
  dungeon: {
    bpm: 96, leadType: 'square',
    bass: [40, null, 40, null, 40, null, 43, null, 40, null, 40, null, 38, null, 39, null],
    lead: [null, null, 64, null, null, null, 67, 66, null, null, 64, null, null, null, 59, null],
  },
  hondonada: {
    bpm: 88, leadType: 'sawtooth',
    bass: [38, null, 38, 39, 38, null, 38, null, 36, null, 36, 37, 36, null, 41, null],
    lead: [null, null, 62, null, 63, null, null, null, 60, null, 62, null, null, 58, null, null],
  },
  // Fanfarria de victoria (mayor, una vez) y lamento al caer.
  victory: {
    bpm: 150, leadType: 'square', once: true,
    bass: [48, null, null, null, 48, null, 55, null, 53, null, null, null, 55, null, null, null, 48, null, 52, null, 55, null, 60, null, 48, null, null, null, null, null, null, null],
    lead: [72, 72, 72, null, 72, null, 74, 76, 77, null, 76, null, 74, null, 76, null, 79, null, null, null, 76, null, 79, null, 84, null, null, null, null, null, null, null],
  },
  defeat: {
    bpm: 70, leadType: 'triangle', once: true,
    bass: [45, null, null, null, 44, null, null, null, 43, null, null, null, 42, null, null, null],
    lead: [69, null, 68, null, 67, null, 66, null, 65, null, null, null, 64, null, null, null],
  },
  boss: {
    bpm: 140, leadType: 'square',
    bass: [40, 40, 52, 40, 40, 52, 40, 43, 38, 38, 50, 38, 39, 39, 51, 39],
    lead: [64, null, 67, null, 70, null, 67, null, 62, null, 65, null, 69, null, 68, null],
  },
};

let current: Track = null;
let timer: number | null = null;
let step = 0;
let nextTime = 0;

export function playMusic(track: Track): void {
  if (track === current) return;
  current = track;
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  const c = ac();
  if (!track || !c || !musicGain) return;
  const def = TRACKS[track];
  const stepDur = 60 / def.bpm / 4;
  step = 0;
  nextTime = c.currentTime + 0.05;
  timer = window.setInterval(() => {
    while (nextTime < c.currentTime + 0.2) {
      const n = def.lead.length;
      if (def.once && step >= n) {
        clearInterval(timer!);
        timer = null;
        return;
      }
      const i = step % n;
      const when = nextTime - c.currentTime;
      const b = def.bass[i];
      const l = def.lead[i];
      if (b !== null) tone(midi(b), stepDur * 1.8, 'triangle', 0.16, when, undefined, musicGain!);
      if (l !== null) tone(midi(l), stepDur * 1.6, def.leadType, def.leadType === 'triangle' ? 0.1 : 0.04, when, undefined, musicGain!);
      if (track === 'boss' && i % 4 === 0) noise(0.05, 0.05, when, musicGain!);
      step++;
      nextTime += stepDur;
    }
  }, 50);
}
