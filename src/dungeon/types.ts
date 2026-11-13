import type { GoalKind } from '../data/dungeons';
import type { Element } from '../data/elements';
import type { AiKind, Faction } from '../data/monsters';
import type { StatusId } from '../data/skills';

export interface Actor {
  id: number;
  side: 'party' | 'enemy' | 'npc';
  name: string;
  sprite: string;
  x: number;
  y: number;
  fx: number;
  fy: number;
  element: Element;
  level: number;
  hp: number;
  maxHp: number;
  sp: number;
  maxSp: number;
  atk: number;
  def: number;
  mag: number;
  res: number;
  statuses: Partial<Record<StatusId, number>>;
  skills: string[];
  alive: boolean;
  memberId?: string;
  monsterId?: string;
  ai?: AiKind;
  monsterSkills?: { id: string; chance: number }[];
  xp?: number;
  boss?: boolean;
  /** Monstruo alfa de la condición del piso. */
  elite?: boolean;
  /** Bando (demonios o ángeles): se atacan entre ellos. */
  faction?: Faction;
  /** Monstruo de otro elemento que el suyo (otro color). */
  variant?: boolean;
  /** Eco de la prueba de prestigio (se dibuja como una sombra del personaje). */
  echo?: boolean;
  /** Monstruo dorado: huye, brilla en el mapa y suelta un buen botín. */
  golden?: boolean;
  /** Persona a escoltar hasta las escaleras (va con el grupo, pero no es del gremio). */
  escort?: boolean;
  /** Gólem vigía: no se mueve, gira cada 3 turnos y si ve al líder os devuelve al inicio del piso. */
  watcher?: { dir0: number; seen?: boolean };
  /** Tendero de una tienda dentro de la mazmorra. */
  shop?: boolean;
  /** Evento de sala (altar, viajero, cofre, fuente). */
  event?: RoomEventKind;
  reaper?: boolean;
  fast?: boolean;
  /** Ya pagó el turno extra para salir del barro de su casilla. */
  mudFree?: boolean;
  alert: number;
  lastSeen?: { x: number; y: number };
  wander?: { x: number; y: number };
  hpAcc: number;
  rescueQuest?: string;
  /** Del equipo: reducción de daño y aumento de daño por elemento, estados a los que es inmune. */
  resist?: Partial<Record<Element, number>>;
  boost?: Partial<Record<Element, number>>;
  immune?: StatusId[];
  /** Jefes grandes: casillas que ocupan (ancho × alto). x, y es la esquina de arriba a la izquierda. */
  w?: number;
  h?: number;
  /** No se mueve de su sitio (el feto del trono). */
  still?: boolean;
  /** Inmune mientras viva alguno de sus guardianes (`guard`); ver DungeonRun.warded. */
  ward?: boolean;
  /** Guardián de un jefe con `ward` (los cuatro capitanes del Coro en el trono). */
  guard?: boolean;
  /** Criatura invocada por un jefe: se deshace cuando él cae. */
  summoned?: boolean;
}

/** Condición del piso para abrir las escaleras (ver GOALS en data/dungeons.ts). */
export interface FloorGoal {
  kind: GoalKind;
  /** Cuántas cosas hacen falta (braseros, monstruos...) y cuántas llevan. */
  need: number;
  have: number;
  done: boolean;
  /** Palancas, braseros, faros o placas: casillas que hay que pisar (o cubrir con una caja). `color` en el orden de colores. */
  spots: { x: number; y: number; on: boolean; color?: string }[];
  /** Orden de colores: en qué orden hay que activar las palancas. */
  order?: string[];
  /** Faros: la antorcha que hay junto a las escaleras. */
  torch?: { x: number; y: number; taken: boolean };
  /** Cajas: posición, posición inicial, hacia dónde se empuja y su placa. */
  boxes?: { x: number; y: number; x0: number; y0: number; dx: number; dy: number; px: number; py: number }[];
  /** Cajas: botón que las devuelve a su sitio. */
  reset?: { x: number; y: number };
  /** Escolta: murió por el camino. */
  failed?: boolean;
}

export interface FloorItem {
  x: number;
  y: number;
  id: string;
  qty: number;
  /** En una tienda de la mazmorra: lo que cuesta (se paga al tendero). */
  price?: number;
}

export type FxKind = Element | 'heal' | 'buff' | 'debuff';

export type RoomEventKind = 'altar' | 'viajero' | 'cofre' | 'fuente';

/** Pregunta pendiente al jugador (eventos de sala). La interfaz la muestra y llama a DungeonRun.resolveChoice. */
export interface PendingChoice {
  actorId: number;
  title: string;
  text: string;
  options: string[];
}

export type SfxName = 'hit' | 'crit' | 'miss' | 'hurt' | 'magic' | 'heal' | 'death' | 'levelup' | 'pickup' | 'stairs' | 'buff' | 'throw' | 'boss';

export type GameEvent =
  /** Se rompió un muro: hay que redibujar el mapa. */
  | { t: 'wall'; x: number; y: number }
  | { t: 'move'; id: number; x: number; y: number }
  | { t: 'bump'; id: number; dx: number; dy: number }
  | { t: 'damage'; id: number; amount: number; crit: boolean; mult: number }
  | { t: 'heal'; id: number; amount: number }
  | { t: 'miss'; id: number }
  | { t: 'death'; id: number }
  | { t: 'projectile'; x0: number; y0: number; x1: number; y1: number; color: string }
  | { t: 'flash'; x: number; y: number; color: string }
  | { t: 'float'; id: number; text: string; color: string }
  | { t: 'log'; text: string; color?: string }
  | { t: 'sfx'; name: SfxName }
  | { t: 'floor' }
  /** Un miembro aprendió una habilidad pero ya lleva 4: hay que elegir cuál olvidar. */
  /** `auto`: la aprendió sin más (tenía hueco); si no, hay que elegir cuál olvidar. */
  | { t: 'learn'; id: number; skill: string; auto?: boolean }
  /** Una misión acaba de cumplirse (para la notificación). */
  | { t: 'quest'; name: string }
  | { t: 'trap'; x: number; y: number; color: string }
  | { t: 'door' }
  /** Movimiento instantáneo (teletransporte). */
  | { t: 'warp'; id: number; x: number; y: number }
  /** Cambió el líder: la cámara pasa a seguirle. */
  | { t: 'leader'; id: number }
  /** Un caído vuelve al grupo (hay que volver a crear su sprite). */
  | { t: 'revive'; id: number }
  /** Efecto visual de una habilidad u objeto en unas casillas (fuego, agua..., curación, mejora, empeora). */
  | { t: 'fx'; kind: FxKind; tiles: { x: number; y: number }[] }
  /** Cartel del campo de entrenamiento: la interfaz lo muestra en una ventana. */
  | { t: 'tip'; title: string; lines: string[] }
  /** Un evento de sala espera respuesta (ver DungeonRun.pendingChoice). */
  | { t: 'choice' };

export const DIRS8 = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 1, dy: 1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: -1, dy: -1 },
];

/** Algo que ocupa una o varias casillas (los actores grandes llevan w y h). */
export type Box = { x: number; y: number; w?: number; h?: number };
/** Hueco entre dos tramos [a0, a0+aw) y [b0, b0+bw) en un eje (0 si se tocan o se solapan). */
const gap = (a0: number, aw: number, b0: number, bw: number) => Math.max(0, b0 - (a0 + aw - 1), a0 - (b0 + bw - 1));
/** Distancia en casillas (8 direcciones) entre dos cosas, contando todas las casillas de los actores grandes. */
export const cheb = (a: Box, b: Box) => Math.max(gap(a.x, a.w ?? 1, b.x, b.w ?? 1), gap(a.y, a.h ?? 1, b.y, b.h ?? 1));
/** ¿Ocupa esta casilla? */
export const covers = (a: Box, x: number, y: number) => x >= a.x && y >= a.y && x < a.x + (a.w ?? 1) && y < a.y + (a.h ?? 1);
/** Ocupa más de una casilla. */
export const isBig = (a: Box) => (a.w ?? 1) > 1 || (a.h ?? 1) > 1;
/** Hacia dónde queda b visto desde a (de borde a borde; sirve para actores grandes). */
export const dirTo = (a: Box, b: Box) => {
  const side = (a0: number, aw: number, b0: number, bw: number) => (b0 > a0 + aw - 1 ? 1 : b0 + bw - 1 < a0 ? -1 : 0);
  return { dx: side(a.x, a.w ?? 1, b.x, b.w ?? 1), dy: side(a.y, a.h ?? 1, b.y, b.h ?? 1) };
};
/** Casilla central (para efectos y animaciones). */
export const mid = (a: Box) => ({ x: a.x + ((a.w ?? 1) >> 1), y: a.y + ((a.h ?? 1) >> 1) });
