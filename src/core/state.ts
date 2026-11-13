import type { IntelId } from '../data/dungeons';
import { FEATURES } from '../data/features';
import type { Slot } from '../data/equipment';
import { DEFAULT_TACTIC, type TacticId } from '../data/tactics';
import { BAG_SIZES, MATERIAL_BAG_SIZES, POUCH_SIZES } from '../data/guild';
import { ITEMS } from '../data/items';

export interface MemberState {
  level: number;
  xp: number;
  joined: boolean;
  /** Equipo puesto: id de EQUIPMENT por hueco. */
  gear: Partial<Record<Slot, string>>;
  /** Prestigio (0 a 3): ver PRESTIGE_* en data/characters.ts. */
  prestige?: number;
  /** Las 4 habilidades que lleva. Clave 'base' (o la afinidad, en el caso de Aren). */
  skills: Record<string, string[]>;
}

export interface QuestState {
  status: 'active' | 'ready' | 'done';
  progress: number;
}

export interface GameState {
  version: 1;
  location: string;
  gold: number;
  bag: Record<string, number>;
  storage: Record<string, number>;
  members: Record<string, MemberState>;
  party: string[];
  protagClass: string;
  unlockedClasses: string[];
  flags: string[];
  quests: Record<string, QuestState>;
  cleared: Record<string, number>;
  /** Puntos de afinidad de cada pareja (pairKey) y nivel ya activado en la fogata. */
  affinity: Record<string, number>;
  bondLevel: Record<string, number>;
  seenTalks: string[];
  /** Equipo guardado (no puesto), por id. */
  gear: Record<string, number>;
  /** Nivel de cada mejora del cuartel (0 = sin construir). */
  upgrades: Record<string, number>;
  /** Ingredientes en la despensa del cuartel. */
  pantry: Record<string, number>;
  /** Materiales del gremio (para mejorar equipo en la herrería). */
  materials: Record<string, number>;
  /** Monstruos derrotados, por id. */
  bestiary: Record<string, number>;
  /** Lo que se le compró al informante para una mazmorra (dura hasta completarla o salir de ella). */
  intel?: { dungeon: string; bought: IntelId[] };
  /** Estrategia de cada aliado en la mazmorra. */
  tactics: Record<string, TacticId>;
  /** Piso más alto alcanzado en cada mazmorra (sirve para las de Babel). */
  records: Record<string, number>;
  /** Rango elegido para las mazmorras que se ajustan al nivel del grupo (índice de RANKS). */
  babelRank: number;
  /** Nivel de cada proyecto de reconstrucción (PROJECTS en data/town.ts). */
  rebuild: Record<string, number>;
  /** Miembros de la reserva fuera de expedición: a qué mazmorra y cuántas incursiones faltan para que vuelvan. */
  expeditions: { members: string[]; dungeon: string; left: number }[];
  /** Funciones nuevas (data/features.ts) que ya se han abierto al menos una vez. */
  seenFeatures: string[];
  /** Pareja de Aren (se elige con afinidad máxima; cambia el epílogo de los tres finales). */
  partner?: string;
  /** Mejor puntaje de cada mazmorra (pantalla final). */
  bestScores: Record<string, { total: number; rank: string }>;
  /** Localidad a la que devuelve el portal de la Torre de Babel. */
  portalFrom?: string;
}

/** Rangos de las mazmorras de Babel: desplazamiento del nivel de los monstruos respecto al nivel medio del grupo. */
export const RANKS = [
  { name: 'Fácil', offset: -3 },
  { name: 'Normal', offset: 0 },
  { name: 'Difícil', offset: 3 },
  { name: 'Pesadilla', offset: 6 },
];

export const tacticOf = (s: GameState, id: string): TacticId => s.tactics[id] ?? DEFAULT_TACTIC[id] ?? 'equilibrado';

export const PARTY_MAX = 4;
export const SKILL_SLOTS = 4;

export const upgradeLevel = (s: GameState, id: string) => s.upgrades[id] ?? 0;
export const bagCapacity = (s: GameState) => BAG_SIZES[upgradeLevel(s, 'bolsa')];
export const pouchCapacity = (s: GameState) => POUCH_SIZES[upgradeLevel(s, 'bolsa')];
export const materialBagCapacity = (s: GameState) => MATERIAL_BAG_SIZES[upgradeLevel(s, 'bolsa')];

export function newMember(level = 1): MemberState {
  return { level, xp: 0, joined: true, gear: {}, skills: {} };
}
const SAVE_KEY = 'tierras-partidas-save';

export function newGame(): GameState {
  return {
    version: 1,
    location: 'bastion_gris',
    gold: 150,
    bag: { pan: 3, pocion: 2, piedra: 3 },
    storage: {},
    members: {
      aren: { ...newMember(), gear: { weapon: 'espada_hierro' } },
      bram: { ...newMember(), gear: { weapon: 'martillo_forja' } },
    },
    party: ['aren', 'bram'],
    protagClass: 'errante',
    unlockedClasses: ['errante'],
    flags: [],
    quests: {},
    cleared: {},
    affinity: {},
    bondLevel: {},
    seenTalks: [],
    gear: { jubon_cuero: 2 },
    upgrades: {},
    pantry: {},
    materials: {},
    bestiary: {},
    tactics: {},
    records: {},
    babelRank: 1,
    rebuild: {},
    seenFeatures: [],
    expeditions: [],
    bestScores: {},
  };
}

/** Rellena los campos que no existían en partidas guardadas con versiones anteriores. */
function migrate(s: GameState): GameState {
  s.gear ??= {};
  s.upgrades ??= {};
  s.pantry ??= {};
  s.materials ??= {};
  s.bestiary ??= {};
  s.tactics ??= {};
  s.records ??= {};
  s.babelRank ??= 1;
  s.rebuild ??= {};
  // Partidas antiguas: lo ya desbloqueado no sale como «nuevo».
  s.seenFeatures ??= Object.entries(FEATURES).filter(([, f]) => !f.flag || s.flags.includes(f.flag)).map(([id]) => id);
  s.expeditions ??= [];
  s.bestScores ??= {};
  // Afinidad antigua: las charlas vistas cuentan como el primer nivel activado.
  if (!s.bondLevel) {
    s.bondLevel = {};
    const old: Record<string, string> = { t_aren_bram: 'aren|bram', t_bram_garrick: 'bram|garrick', t_lysa_garrick: 'garrick|lysa', t_aren_lysa: 'aren|lysa' };
    for (const t of s.seenTalks) if (old[t]) {
      s.bondLevel[old[t]] = 1;
      s.affinity[old[t]] = Math.max(s.affinity[old[t]] ?? 0, 4);
    }
  }
  // Partidas antiguas: el informante lo contaba todo de una vez.
  if (typeof s.intel === 'string') s.intel = { dungeon: s.intel, bought: ['monstruos', 'jefe', 'escaleras', 'misiones'] };
  for (const m of Object.values(s.members)) {
    m.gear ??= {};
    m.skills ??= {};
  }
  return s;
}

export function saveGame(s: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    // Sin almacenamiento disponible (modo privado): la partida sigue en memoria.
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    return s.version === 1 ? migrate(s) : null;
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  return loadGame() !== null;
}

export const hasFlag = (s: GameState, f: string) => s.flags.includes(f);
export const hasFlags = (s: GameState, fs: string[] = []) => fs.every((f) => s.flags.includes(f));
export function addFlag(s: GameState, f: string): void {
  if (!s.flags.includes(f)) s.flags.push(f);
}

export function bagUsed(s: GameState): number {
  return Object.values(s.bag).reduce((a, b) => a + b, 0);
}

export function addToBag(s: GameState, id: string, qty = 1): number {
  const room = bagCapacity(s) - bagUsed(s);
  const n = Math.max(0, Math.min(room, qty));
  if (n > 0) s.bag[id] = (s.bag[id] ?? 0) + n;
  return n;
}

export function removeFromBag(s: GameState, id: string, qty = 1): void {
  const left = (s.bag[id] ?? 0) - qty;
  if (left > 0) s.bag[id] = left;
  else delete s.bag[id];
}

export function addToStorage(s: GameState, id: string, qty = 1): void {
  s.storage[id] = (s.storage[id] ?? 0) + qty;
}

/** Recompensas que no caben en la bolsa van al almacén. */
export function giveItem(s: GameState, id: string, qty: number): void {
  const n = addToBag(s, id, qty);
  if (n < qty) addToStorage(s, id, qty - n);
}

export function bagList(s: GameState): { id: string; qty: number }[] {
  return Object.entries(s.bag)
    .filter(([id]) => ITEMS[id])
    .map(([id, qty]) => ({ id, qty }));
}

export const pairKey = (a: string, b: string) => [a, b].sort().join('|');

export const bagCount = (s: GameState, id: string) => s.bag[id] ?? 0;
