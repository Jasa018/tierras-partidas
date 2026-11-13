import { CLASSES, MEMBERS, PRESTIGE_CAP, PRESTIGE_LEVELS, PRESTIGE_MAX, PRESTIGE_SKILLS, PRESTIGE_STAT, PRESTIGE_XP, type Stats } from '../data/characters';
import type { Element } from '../data/elements';
import { EQUIPMENT, type EquipDef, type Slot, type WeaponKind } from '../data/equipment';
import type { StatusId } from '../data/skills';
import { SKILL_SLOTS, newMember, type GameState } from './state';

export interface MemberStats extends Stats {
  id: string;
  name: string;
  level: number;
  element: Element;
  skills: string[];
  sprite: string;
  resist: Partial<Record<Element, number>>;
  boost: Partial<Record<Element, number>>;
  immune: StatusId[];
}

/** Sin tope real: en Leyenda (prestigio 3) se puede seguir subiendo, cada vez más caro. */
export const MAX_LEVEL = 999;
const STAT_KEYS: (keyof Stats)[] = ['hp', 'sp', 'atk', 'def', 'mag', 'res'];
const DEFAULT_WEAPON: Record<WeaponKind, string> = {
  espada: 'espada_hierro', martillo: 'martillo_forja', baston: 'baston_roble', arco: 'arco_corto', daga: 'daga_filo', lanza: 'lanza_guardia',
};

/** Experiencia para el siguiente nivel. Pasado el 20, cada nivel cuesta además un 8% más que el anterior. */
export function xpToNext(level: number): number {
  return Math.round((12 * Math.pow(level, 1.6) + 8) * Math.pow(1.08, Math.max(0, level - 20)));
}

export const prestigeOf = (state: GameState, id: string) => state.members[id]?.prestige ?? 0;
/** Nivel máximo: 20 hasta el prestigio 3; después, el máximo del juego. */
export const levelCap = (state: GameState, id: string) => (prestigeOf(state, id) >= PRESTIGE_MAX ? MAX_LEVEL : PRESTIGE_CAP);
/** ¿Puede ir a la prueba de prestigio? */
export const canPrestige = (state: GameState, id: string) => prestigeOf(state, id) < PRESTIGE_MAX && (state.members[id]?.level ?? 0) >= PRESTIGE_CAP;

/** Sprite según la clase (Aren) y el traje de su prestigio. */
export function memberSprite(state: GameState, id: string): string {
  const p = prestigeOf(state, id);
  return `${id === 'aren' ? `p_aren_${state.protagClass}` : `p_${id}`}${p ? `_p${p}` : ''}`;
}

// ---------------------------------------------------------------- habilidades

/** Las habilidades se guardan por afinidad en el caso de Aren, y como 'base' en el resto. */
const skillKey = (state: GameState, id: string) => (id === 'aren' ? state.protagClass : 'base');

/** Todas las habilidades que su nivel le permite conocer (en orden de aprendizaje). */
export function learnedSkills(state: GameState, id: string): string[] {
  const list = id === 'aren' ? CLASSES[state.protagClass].skills : MEMBERS[id].skills;
  const p = prestigeOf(state, id);
  // Tras un prestigio no se olvida nada de lo aprendido hasta el nivel 20.
  const level = Math.max(state.members[id]?.level ?? 1, p ? PRESTIGE_CAP : 0);
  return [...list.filter((s) => s.level <= level).map((s) => s.id), ...(PRESTIGE_SKILLS[id] ?? []).slice(0, p)];
}

/** Las (como mucho) 4 habilidades que lleva a la mazmorra. */
export function equippedSkills(state: GameState, id: string): string[] {
  const learned = learnedSkills(state, id);
  const stored = state.members[id]?.skills?.[skillKey(state, id)];
  if (!stored) return learned.slice(0, SKILL_SLOTS);
  return stored.filter((s) => learned.includes(s)).slice(0, SKILL_SLOTS);
}

export function setSkills(state: GameState, id: string, skills: string[]): void {
  state.members[id].skills[skillKey(state, id)] = skills.slice(0, SKILL_SLOTS);
}

// ---------------------------------------------------------------- equipo

export function canEquip(id: string, e: EquipDef): boolean {
  return e.slot !== 'weapon' || e.kind === MEMBERS[id].weapon;
}

export function equippedGear(state: GameState, id: string): EquipDef[] {
  return Object.values(state.members[id]?.gear ?? {}).filter((g): g is string => !!g && !!EQUIPMENT[g]).map((g) => EQUIPMENT[g]);
}

/** Valor aproximado del equipo puesto: estadísticas, más lo que valen resistencias, potenciadores e inmunidades. */
function gearValue(state: GameState, id: string): number {
  const st = memberStats(state, id);
  const sum = (o: Partial<Record<string, number>>) => Object.values(o).reduce((a: number, v) => a + (v ?? 0), 0);
  return st.atk + st.def + st.mag + st.res + st.hp / 5 + st.sp / 3 + sum(st.resist) * 20 + sum(st.boost) * 20 + st.immune.length * 3;
}

/**
 * ¿Mejora a este miembro ponerse la pieza en lugar de lo que lleva en ese hueco?
 * null si no la puede usar (arma de otro tipo).
 */
export function gearCompare(state: GameState, id: string, e: EquipDef): 'up' | 'down' | 'same' | null {
  if (!canEquip(id, e)) return null;
  const gear = state.members[id].gear;
  const prev = gear[e.slot];
  const before = gearValue(state, id);
  gear[e.slot] = e.id;
  const after = gearValue(state, id);
  if (prev) gear[e.slot] = prev;
  else delete gear[e.slot];
  const d = after - before;
  return Math.abs(d) < 0.01 ? 'same' : d > 0 ? 'up' : 'down';
}

/** Pone una pieza (o quita la del hueco si `equipId` es null). La pieza anterior vuelve al inventario. */
export function equip(state: GameState, id: string, slot: Slot, equipId: string | null): void {
  const m = state.members[id];
  const prev = m.gear[slot];
  if (prev) state.gear[prev] = (state.gear[prev] ?? 0) + 1;
  if (equipId) {
    state.gear[equipId]--;
    if (!state.gear[equipId]) delete state.gear[equipId];
    m.gear[slot] = equipId;
  } else delete m.gear[slot];
}

// ---------------------------------------------------------------- estadísticas

export function memberStats(state: GameState, id: string): MemberStats {
  const def = MEMBERS[id];
  const level = state.members[id]?.level ?? 1;
  const mult: Partial<Stats> = id === 'aren' ? CLASSES[state.protagClass].mult : {};
  const gear = equippedGear(state, id);
  const p = prestigeOf(state, id);
  const stat = (k: keyof Stats) => {
    const base = (def.base[k] + def.growth[k] * (level - 1 + p * PRESTIGE_LEVELS)) * (mult[k] ?? 1) * (1 + p * PRESTIGE_STAT);
    return Math.max(1, Math.round(base + gear.reduce((a, g) => a + (g.bonus[k] ?? 0), 0)));
  };
  const resist: Partial<Record<Element, number>> = {};
  const boost: Partial<Record<Element, number>> = {};
  const immune = new Set<StatusId>();
  for (const g of gear) {
    for (const [e, v] of Object.entries(g.resist ?? {}) as [Element, number][]) resist[e] = Math.min(0.75, (resist[e] ?? 0) + v);
    for (const [e, v] of Object.entries(g.boost ?? {}) as [Element, number][]) boost[e] = (boost[e] ?? 0) + v;
    for (const st of g.immune ?? []) immune.add(st);
  }
  const out = Object.fromEntries(STAT_KEYS.map((k) => [k, stat(k)])) as unknown as Stats;
  return {
    ...out,
    id,
    name: def.name,
    level,
    element: id === 'aren' ? CLASSES[state.protagClass].element : def.element,
    skills: equippedSkills(state, id),
    sprite: memberSprite(state, id),
    resist,
    boost,
    immune: [...immune],
  };
}

export interface XpResult {
  levels: number;
  /** Habilidades nuevas que entraron directamente (había hueco). */
  learned: string[];
  /** Habilidades nuevas sin hueco: hay que elegir cuál sustituir. */
  pending: string[];
}

/** Suma experiencia. Las habilidades nuevas se colocan si hay hueco; si no, quedan pendientes de elegir. */
export function gainXp(state: GameState, id: string, amount: number): XpResult {
  const m = state.members[id];
  const before = learnedSkills(state, id);
  let levels = 0;
  const cap = levelCap(state, id);
  m.xp += Math.round(amount * (1 + prestigeOf(state, id) * PRESTIGE_XP));
  while (m.level < cap && m.xp >= xpToNext(m.level)) {
    m.xp -= xpToNext(m.level);
    m.level++;
    levels++;
  }
  // En el tope, la experiencia no se acumula (espera al prestigio).
  if (m.level >= cap) m.xp = Math.min(m.xp, xpToNext(m.level));
  const fresh = levels ? learnedSkills(state, id).filter((s) => !before.includes(s)) : [];
  const learned: string[] = [];
  const pending: string[] = [];
  for (const s of fresh) {
    const eq = equippedSkills(state, id).filter((x) => x !== s);
    if (eq.length < SKILL_SLOTS) {
      setSkills(state, id, [...eq, s]);
      learned.push(s);
    } else {
      setSkills(state, id, eq);
      pending.push(s);
    }
  }
  return { levels, learned, pending };
}

export function joinMember(state: GameState, id: string): void {
  const lead = state.members.aren.level;
  state.members[id] = { ...newMember(Math.max(1, lead - 1)), gear: { weapon: DEFAULT_WEAPON[MEMBERS[id].weapon] } };
}

export function joinedMembers(state: GameState): string[] {
  return Object.keys(MEMBERS).filter((id) => state.members[id]?.joined);
}
