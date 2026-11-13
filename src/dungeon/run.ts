import { BOSS_EVERY, RUSH_CAMP_EVERY, RUSH_MIX_FROM, RUSH_MIX_POWER, CAMP_MARKUP, CAMP_SHOP, DUNGEONS, bossStoryLevel, firstSeenLevel, EVENT_CHANCE, GOALS, GOLDEN_CHANCE, REAPER_LEVEL_BONUS, REAPER_SECONDS, SHOP_CHANCE, TIER_LEVELS, dungeonChain, layoutsFor, type DungeonDef, type GoalKind, type IntelId } from '../data/dungeons';
import { bondPerks } from '../data/affinity';
import { ELEMENTS, elementMultiplier, type Element } from '../data/elements';
import { ITEMS, UNKNOWN_TABLE } from '../data/items';
import { MONSTERS, monsterStat, type MonsterDef } from '../data/monsters';
import { questMemberHere } from '../core/quests';
import { TERRAIN, terrainCode, terrainOfCode, type TerrainId } from '../data/terrain';
import { LOCK_BY_ID, LOCK_COLORS, TRAPS, type TrapId } from '../data/traps';
import { QUEST_BY_ID } from '../data/quests';
import { SKILLS, STATUSES, type SkillDef, type StatusId } from '../data/skills';
import { BANTER, SPEAKERS } from '../data/story';
import { onKill, onQuestEvent } from '../core/quests';
import { Rng } from '../core/rng';
import { RANKS, addToBag, bagCapacity, bagCount, bagUsed, materialBagCapacity, pairKey, pouchCapacity, removeFromBag, tacticOf, type GameState } from '../core/state';
import { gainXp, memberStats, setSkills } from '../core/stats';
import { FLOOR, FLOW_DIRS, SECRET_BASE, generateMap, isFloor, sealRoom, type DungeonMap } from './generator';
import { setupLocks } from './locks';
import { TUTORIAL_FLOORS } from '../data/tutorial';
import { DIRS8, cheb, covers, dirTo, isBig, mid, type Actor, type Box, type FloorGoal, type FloorItem, type GameEvent, type PendingChoice, type RoomEventKind, type SfxName } from './types';

/** Direcciones de los gólems vigía, en el orden en que giran: este, sur, oeste, norte. */
const WATCH_DIRS = [{ dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 0, dy: -1 }];
/** Cada cuántos turnos gira un gólem. */
const WATCH_TURN = 3;

/** Cifras de la incursión para la pantalla final de puntaje. */
export interface RunStats {
  floors: number;
  kills: number;
  goals: number;
  escorts: number;
  escortsLost: number;
  golden: number;
  events: number;
  stolen: number;
  caught: number;
  fallen: number;
  reaper: number;
  items: number;
}

export type RunResult = 'clear' | 'death' | 'escape' | null;

const BELLY_MAX = 100;
/** Probabilidad de que un monstruo salga de otro elemento (otro color). */
const VARIANT_CHANCE = 0.25;
const ALL_ELEMENTS = Object.keys(ELEMENTS) as Element[];
const OFFENSIVE = new Set(['phys', 'mag', 'debuff']);

/**
 * Toda la lógica de una incursión en mazmorra, sin nada de render.
 * Cada acción del líder avanza el mundo un turno y deja eventos en `events` para que la escena los anime.
 */
/**
 * El feto del trono: turnos desde que cae el primer capitán hasta que empieza a revivirlos (y cada cuánto revive
 * otro después), turnos que queda vulnerable al caer los cuatro, cada cuánto invoca y cuántas invocaciones a la vez.
 */
const WARD = { revive: 20, reviveEvery: 8, open: 14, summon: 14, summonMax: 2 };
/** Lo que el feto nunca invoca: los arcángeles (y lo que no es una criatura de verdad). */
const NO_SUMMON = new Set(['velaris', 'oriel', 'tharion', 'serafiel', 'arcangel', 'eco', 'tendero', 'guardia_tienda', 'parca']);

export class DungeonRun {
  /** Tramo actual de la incursión (cambia al pasar al siguiente tramo, ver DungeonDef.next). */
  def: DungeonDef;
  /** Todos los tramos de la incursión, desde la mazmorra de entrada. */
  readonly chain: DungeonDef[];
  readonly rng: Rng;
  floor = 0;
  map!: DungeonMap;
  actors: Actor[] = [];
  items: FloorItem[] = [];
  stairs = { x: 0, y: 0 };
  stairsOpen = true;
  belly = BELLY_MAX;
  turn = 0;
  result: RunResult = null;
  visible!: Uint8Array;
  explored!: Uint8Array;
  events: GameEvent[] = [];
  steppedOnStairs = false;
  xpEarned = 0;
  goldFound = 0;
  /** Bolsa de ingredientes: aparte de la bolsa normal; al terminar se vacía en la despensa del cuartel. */
  pouch: Record<string, number> = {};
  /** Materiales recogidos (sin límite); al salir van al almacén del gremio. Si el grupo cae, se pierden. */
  materials: Record<string, number> = {};
  /** Lo que se le compró al informante (marcas en el mapa desde el principio de cada piso). */
  intel = new Set<IntelId>();
  /** Condición del piso para abrir las escaleras (null si no hay). */
  goal: FloorGoal | null = null;
  /** Escolta muerta: pisos que quedan con las habilidades selladas (incluido el actual). */
  curse = 0;
  /** Pregunta de un evento de sala que espera respuesta. */
  pendingChoice: PendingChoice | null = null;
  stats: RunStats = { floors: 0, kills: 0, goals: 0, escorts: 0, escortsLost: 0, golden: 0, events: 0, stolen: 0, caught: 0, fallen: 0, reaper: 0, items: 0 };
  /** Tienda del piso: sala, deuda con el tendero y lo que aún no se ha pagado. */
  private shopRoom = -1;
  private debt = 0;
  private unpaid: { id: string; price: number }[] = [];
  /** Casilla de inicio del piso (adonde devuelven los gólems). */
  private floorStart = { x: 0, y: 0 };
  /** Golpes de Bram en cada muralla. */
  private hardHits = new Map<number, number>();
  /** Casillas reservadas para las cajas (no se ponen ahí objetos ni trampas). */
  private reserved = new Set<number>();
  private boxSet = new Set<number>();
  /** Afinidad: bonificaciones por miembro (en %) y parejas que combinan o se cubren. */
  private bonus: Record<string, { atk: number; def: number; mag: number; res: number; hp: number; crit: number; belly: number; xp: number; regen: number; sp: number }> = {};
  private bondPairs: { a: string; b: string; followup: number; cover: number }[] = [];
  private comboing = false;
  /** Trampas del piso por casilla; `revealed` cuando alguien del grupo la pisó. */
  traps = new Map<number, { id: TrapId; revealed: boolean }>();
  /** Puertas con candado por casilla → color. */
  doors = new Map<number, string>();
  /** Colores de las llaves que lleva el grupo (solo sirven en este piso). */
  keys: string[] = [];
  /** Miembro que hace de líder ahora mismo. */
  private leaderMember = 'aren';
  /** Elemento del piso en las mazmorras de pisos elementales. */
  floorElement?: Element;
  /** La Parca ya ha llegado a este piso. */
  reaperOut = false;
  /** Terrenos ya explicados en este piso (el aviso sale la primera vez que el líder los pisa). */
  private terrainSeen = new Set<TerrainId>();
  /** Casillas de terreno peligroso (brasas, hielo, telarañas): el grupo las rodea si puede. */
  private hazardTiles: number[] = [];
  private pendingFall = false;
  private partyLevel = 1;
  private rankOffset = 0;
  private nextId = 1;
  private leaderBonusUsed = false;
  private spawnTimer = 0;
  private prevBuf!: Int32Array;
  private queueBuf!: Int32Array;
  private hungerWarned = 0;

  constructor(public state: GameState, dungeonId: string, seed = Date.now(), opts: { intel?: IntelId[]; rank?: number } = {}) {
    this.def = DUNGEONS[dungeonId];
    this.chain = dungeonChain(dungeonId);
    this.rng = new Rng(seed);
    this.intel = new Set(opts.intel ?? []);
    this.rankOffset = RANKS[opts.rank ?? 1].offset;
    this.computeBonds();
    for (const id of state.party) {
      const a = this.makeMember(id);
      a.maxHp = a.hp = Math.round(a.maxHp * (1 + (this.bonus[id]?.hp ?? 0) / 100));
      this.actors.push(a);
    }
    this.partyLevel = this.actors.reduce((a, b) => a + b.level, 0) / this.actors.length;
    this.startFloor(1);
  }

  // ---------------------------------------------------------------- helpers

  /** Quien maneja el jugador. Puede ser otro miembro (cambio de líder), pero si Aren cae se acaba la incursión. */
  get leader(): Actor {
    return this.actors.find((a) => a.memberId === this.leaderMember && a.alive) ?? this.protag;
  }
  /** El protagonista. */
  get protag(): Actor {
    // En la prueba de prestigio se va solo: el protagonista de esa incursión es quien la hace.
    return this.actors.find((a) => a.memberId === 'aren') ?? this.actors.find((a) => a.side === 'party' && !a.escort)!;
  }
  /** Miembros del gremio en pie (la escolta va aparte: ver `escort`). */
  get party(): Actor[] {
    return this.actors.filter((a) => a.side === 'party' && a.alive && !a.escort);
  }
  get enemies(): Actor[] {
    return this.actors.filter((a) => a.side === 'enemy' && a.alive);
  }
  get boss(): Actor | undefined {
    return this.actors.find((a) => a.boss && a.alive);
  }
  get reaper(): Actor | undefined {
    return this.actors.find((a) => a.reaper && a.alive);
  }
  /** Mazmorras sin fin: tramo de BOSS_EVERY pisos (1 = pisos 1-10). Cada tramo los monstruos son más fuertes. */
  get tier(): number {
    return this.def.infinite ? Math.floor((this.floor - 1) / BOSS_EVERY) + 1 : 1;
  }
  /** Último piso de toda la incursión (del último tramo). */
  get isLastFloor(): boolean {
    return !this.def.infinite && this.floor >= this.def.floors && !this.def.next;
  }
  /** Número de tramo (1 = mazmorra de entrada). */
  get stage(): number {
    return this.chain.indexOf(this.def) + 1;
  }
  /** Núcleo con jefe: el último piso, o cada BOSS_EVERY pisos en las mazmorras sin fin. */
  get isBossFloor(): boolean {
    return this.bossFloorAt(this.floor);
  }
  bossFloorAt(n: number): boolean {
    if (this.def.bossRush) return true;
    return this.def.infinite ? n % BOSS_EVERY === 0 : n >= this.def.floors && !!this.def.boss;
  }
  /**
   * Al bajar desde este piso se pasa por un campamento: solo después de vencer a un jefe
   * (el guardián de cada BOSS_EVERY pisos, o el jefe de un tramo que no es el último). Tras él hay que seguir bajando.
   */
  get campAhead(): boolean {
    if (this.def.bossRush) return this.floor % RUSH_CAMP_EVERY === 0;
    return this.isBossFloor && !this.isLastFloor;
  }
  floorLabel(): string {
    const stage = this.chain.length > 1 ? `Tramo ${this.stage}/${this.chain.length} · ` : '';
    if (this.def.bossRush) return `Jefe ${this.floor}`;
    if (this.isBossFloor) return this.def.infinite ? `Piso ${this.floor} · Guardián` : `${stage}Núcleo`;
    return this.def.infinite ? `Piso ${this.floor} · Tramo ${this.tier}` : `${stage}Piso ${this.floor} de ${this.def.floors}`;
  }
  /** Texto corto de la condición del piso para el HUD. */
  goalLabel(): string | null {
    const g = this.goal;
    if (!g) return null;
    if (g.kind === 'vigias') return 'Que no te vean los gólems vigía (zona roja)';
    if (g.done) return g.failed ? '✗ La escolta ha muerto: escaleras abiertas' : `✓ ${GOALS[g.kind].name}: escaleras abiertas`;
    if (g.kind === 'palanca') return 'Busca la palanca que abre las escaleras';
    if (g.kind === 'llave') return 'Busca la llave de la escalera';
    if (g.kind === 'braseros') return `Enciende los braseros ${g.have}/${g.need}`;
    if (g.kind === 'caza') return `Derrota monstruos ${g.have}/${g.need}`;
    if (g.kind === 'escolta') return 'Lleva a la persona perdida hasta las escaleras';
    if (g.kind === 'faros') return g.torch?.taken ? `Enciende los faros ${g.have}/${g.need}` : 'Coge la antorcha de las escaleras';
    if (g.kind === 'fragmentos') return `Recoge los fragmentos del sello ${g.have}/${g.need}`;
    if (g.kind === 'cajas') return `Empuja las cajas a las placas ${g.have}/${g.need}`;
    if (g.kind === 'colores') {
      if (!this.orderKnown()) return 'Busca el orden de colores junto a las escaleras';
      return `Palancas en orden: ${g.order!.map((c, i) => `${i < g.have ? '✓' : ''}${LOCK_BY_ID[c].name}`).join(' → ')}`;
    }
    return 'Derrota al monstruo alfa';
  }
  /** ¿Hay en (x, y) una palanca o un brasero de la condición del piso? */
  goalSpotAt(x: number, y: number) {
    const g = this.goal;
    if (!g) return undefined;
    if (g.torch && g.torch.x === x && g.torch.y === y) return { x, y, on: g.torch.taken };
    if (g.reset && g.reset.x === x && g.reset.y === y) return { x, y, on: false };
    return g.spots.find((s) => s.x === x && s.y === y);
  }
  /** Orden de colores: ¿ya se sabe (se vio la pared de las escaleras o lo contó el informante)? */
  orderKnown(): boolean {
    return !!this.goal?.order && (this.explored[this.stairs.y * this.map.w + this.stairs.x] === 1 || this.intel.has('objetivos'));
  }
  curseLabel(): string | null {
    return this.curse > 0 ? `Maldición: sin habilidades ${this.curse === 1 ? 'este piso' : `este piso y ${this.curse - 1} más`}` : null;
  }

  drainEvents(): GameEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }

  private log(text: string, color?: string) {
    this.events.push({ t: 'log', text, color });
  }
  private sfx(name: SfxName) {
    this.events.push({ t: 'sfx', name });
  }

  actorAt(x: number, y: number): Actor | undefined {
    return this.actors.find((a) => a.alive && covers(a, x, y));
  }

  private isFoe(a: Actor, b: Actor): boolean {
    // Demonios y ángeles también se atacan entre ellos.
    if (a.side === 'enemy' && b.side === 'enemy') return !!a.faction && !!b.faction && a.faction !== b.faction;
    return (a.side === 'party' && b.side === 'enemy') || (a.side === 'enemy' && b.side === 'party');
  }

  /** Suelo y sin puerta cerrada. */
  passable(x: number, y: number): boolean {
    const i = y * this.map.w + x;
    return isFloor(this.map, x, y) && !this.doors.has(i) && !this.boxSet.has(i);
  }

  private diagBlocked(x: number, y: number, dx: number, dy: number): boolean {
    return dx !== 0 && dy !== 0 && (!this.passable(x + dx, y) || !this.passable(x, y + dy));
  }

  private canEnter(a: Actor, dx: number, dy: number): boolean {
    if (isBig(a)) return this.fits(a.x + dx, a.y + dy, a.w ?? 1, a.h ?? 1, a);
    const nx = a.x + dx;
    const ny = a.y + dy;
    return this.passable(nx, ny) && !this.diagBlocked(a.x, a.y, dx, dy) && !this.actorAt(nx, ny);
  }

  /** Dos actores adyacentes que pueden golpearse (no a través de esquinas). */
  private canReach(a: Actor, b: Actor): boolean {
    // Con actores grandes: de lado siempre; si solo se tocan por una esquina, que no la tape una pared.
    if (isBig(a) || isBig(b)) {
      if (cheb(a, b) !== 1) return false;
      const d = dirTo(a, b);
      const o = this.origin(a, d.dx, d.dy);
      return !d.dx || !d.dy || !this.diagBlocked(o.x, o.y, d.dx, d.dy);
    }
    return cheb(a, b) === 1 && !this.diagBlocked(a.x, a.y, b.x - a.x, b.y - a.y);
  }

  isVisible(x: number, y: number): boolean {
    return this.visible[y * this.map.w + x] === 1;
  }

  terrainAt(x: number, y: number): TerrainId | null {
    return terrainOfCode(this.map.terrain[y * this.map.w + x]);
  }

  /** ¿Le afecta este terreno? (los nativos de su elemento, o ciertos monstruos, no lo notan) */
  private affects(a: Actor, t: TerrainId): boolean {
    const d = TERRAIN[t];
    return a.element !== d.native && !(a.monsterId && d.nativeIds?.includes(a.monsterId));
  }

  /** Distancia desde la que se ve a quien está en esa casilla (hierba: 1, niebla: 2). */
  private seenFrom(x: number, y: number): number {
    const t = this.terrainAt(x, y);
    return t === 'hierba' ? 1 : t === 'niebla' ? 2 : 99;
  }

  /** Escondido en hierba alta o niebla para quien mira desde `from`. */
  private hiddenIn(t: Actor, from: { x: number; y: number }): boolean {
    return cheb(t, from) > this.seenFrom(t.x, t.y);
  }

  /** Para dibujar: un enemigo en hierba o niebla solo se ve si alguien del grupo está cerca. */
  actorVisible(a: Actor): boolean {
    if (a.side === 'party') return true;
    if (a.reaper) return this.isVisible(a.x, a.y);
    const r = this.seenFrom(a.x, a.y);
    let seen = this.isVisible(a.x, a.y);
    for (let y = a.y; !seen && y < a.y + (a.h ?? 1); y++) for (let x = a.x; !seen && x < a.x + (a.w ?? 1); x++) seen = this.isVisible(x, y);
    return seen && (r >= 99 || this.party.some((p) => cheb(p, a) <= r));
  }

  /** En la ceniza no se pueden usar habilidades. */
  private skillsSealed(a: Actor): boolean {
    if (a.side === 'party' && this.curse > 0) return true;
    return this.terrainAt(a.x, a.y) === 'ceniza' && this.affects(a, 'ceniza');
  }

  /** Barro: salir de la casilla cuesta un turno extra. Devuelve true si este turno se va en eso. */
  private stuckInMud(a: Actor): boolean {
    if (this.terrainAt(a.x, a.y) === 'barro' && this.affects(a, 'barro') && !a.mudFree) {
      a.mudFree = true;
      return true;
    }
    a.mudFree = false;
    return false;
  }

  /** Tras dar un paso: el hielo hace resbalar y las telarañas atrapan. */
  private afterStep(a: Actor, dx: number, dy: number) {
    let slid = 0;
    while (this.terrainAt(a.x, a.y) === 'hielo' && this.affects(a, 'hielo') && this.canEnter(a, dx, dy) && slid < 60) {
      a.x += dx;
      a.y += dy;
      slid++;
      this.events.push({ t: 'move', id: a.id, x: a.x, y: a.y });
    }
    if (slid && a === this.leader) this.log('¡Resbaláis por el hielo!', '#a8d8f0');
    const i = a.y * this.map.w + a.x;
    if (this.terrainAt(a.x, a.y) === 'telarana' && this.affects(a, 'telarana')) {
      this.map.terrain[i] = 0;
      this.hazardTiles = this.hazardTiles.filter((j) => j !== i);
      this.events.push({ t: 'wall', x: a.x, y: a.y });
      this.addStatus(a, 'aturdido', 1);
      if (a.side === 'party') this.log(`${a.name} queda atrapado en una telaraña.`, '#d8d8e0');
    }
  }

  materialsUsed(): number {
    return Object.values(this.materials).reduce((a, b) => a + b, 0);
  }

  private face(a: Actor, t: Box) {
    const { dx, dy } = dirTo(a, t);
    if (dx || dy) {
      a.fx = dx;
      a.fy = dy;
    }
  }

  // ---------------------------------------------------------------- creación

  /** Ventajas de afinidad de las parejas que van juntas (solo los niveles ya activados en la fogata). */
  private computeBonds() {
    const p = this.state.party;
    const zero = () => ({ atk: 0, def: 0, mag: 0, res: 0, hp: 0, crit: 0, belly: 0, xp: 0, regen: 0, sp: 0 });
    for (const id of p) this.bonus[id] = zero();
    for (let i = 0; i < p.length; i++)
      for (let j = i + 1; j < p.length; j++) {
        const level = this.state.bondLevel?.[pairKey(p[i], p[j])] ?? 0;
        if (!level) continue;
        const pair = { a: p[i], b: p[j], followup: 0, cover: 0 };
        for (const { perk } of bondPerks(p[i], p[j], level)) {
          const e = perk.effect;
          for (const m of [p[i], p[j]]) {
            const b = this.bonus[m];
            if (e.kind === 'stat') b[e.stat] += e.pct;
            else if (e.kind === 'crit') b.crit += e.pct;
            else if (e.kind === 'xp') b.xp += e.pct;
            else if (e.kind === 'regen') b.regen += e.pct;
            else if (e.kind === 'sp') b.sp += e.amount;
            else if (e.kind === 'belly') b.belly += e.pct;
          }
          if (e.kind === 'followup') pair.followup = Math.min(0.8, pair.followup + e.chance);
          if (e.kind === 'cover') pair.cover = Math.min(0.8, pair.cover + e.chance);
        }
        if (pair.followup || pair.cover) this.bondPairs.push(pair);
      }
  }

  /** Puntaje de la incursión: cada cosa suma (o resta); el rango depende de los puntos por piso. */
  score(): { rows: { label: string; value: string; points: number }[]; total: number; rank: string } {
    const s = this.stats;
    const all = [
      { label: 'Pisos recorridos', value: `${s.floors}`, points: s.floors * 100, always: true },
      { label: 'Monstruos derrotados', value: `${s.kills}`, points: s.kills * 10, always: true },
      { label: 'Oro encontrado', value: `${this.goldFound}`, points: Math.round(this.goldFound / 5), always: true },
      { label: 'Objetos recogidos', value: `${s.items}`, points: s.items * 5, always: true },
      { label: 'Condiciones de piso cumplidas', value: `${s.goals}`, points: s.goals * 80 },
      { label: 'Escoltas a salvo', value: `${s.escorts}`, points: s.escorts * 150 },
      { label: 'Monstruos dorados', value: `${s.golden}`, points: s.golden * 200 },
      { label: 'Eventos de sala', value: `${s.events}`, points: s.events * 40 },
      { label: 'La Parca vencida', value: `${s.reaper}`, points: s.reaper * 300 },
      { label: 'Botín robado al tendero', value: `${s.stolen}`, points: s.stolen * 50 },
      { label: 'Rapidez', value: `${this.turn} turnos`, points: Math.max(0, Math.round((s.floors * 260 - this.turn) / 2)), always: true },
      { label: 'Compañeros caídos', value: `${s.fallen}`, points: -s.fallen * 100 },
      { label: 'Escoltas perdidas', value: `${s.escortsLost}`, points: -s.escortsLost * 100 },
      { label: 'Vistos por los gólems', value: `${s.caught}`, points: -s.caught * 30 },
    ];
    const rows = all.filter((r) => r.always || r.points).map(({ label, value, points }) => ({ label, value, points }));
    const total = Math.max(0, rows.reduce((a, r) => a + r.points, 0));
    const per = total / Math.max(1, s.floors);
    const rank = per >= 330 ? 'S' : per >= 250 ? 'A' : per >= 170 ? 'B' : per >= 100 ? 'C' : 'D';
    return { rows, total, rank };
  }

  /** Kaela siente a los monstruos que tiene a 6 casillas o menos (para el mapa). */
  sensed(a: Actor): boolean {
    if (a.side !== 'enemy') return false;
    const k = this.party.find((p) => p.memberId === 'kaela');
    return !!k && cheb(k, a) <= 6;
  }

  /** ¿Va este miembro en el grupo (y en pie)? Para los talentos de exploración. */
  has(memberId: string): boolean {
    return this.party.some((a) => a.memberId === memberId);
  }

  /** Segundos de cada piso hasta la Parca (Vael los alarga). */
  reaperSeconds(): number {
    return REAPER_SECONDS + (this.has('vael') ? 45 : 0);
  }

  private makeMember(id: string): Actor {
    const s = memberStats(this.state, id);
    return {
      id: this.nextId++, side: 'party', name: s.name, sprite: s.sprite, x: 0, y: 0, fx: 0, fy: 1,
      element: s.element, level: s.level, hp: s.hp, maxHp: s.hp, sp: s.sp, maxSp: s.sp,
      atk: s.atk, def: s.def, mag: s.mag, res: s.res, statuses: {}, skills: s.skills, alive: true,
      memberId: id, alert: 0, hpAcc: 0, resist: s.resist, boost: s.boost, immune: s.immune,
    };
  }

  private refreshMember(a: Actor) {
    const s = memberStats(this.state, a.memberId!);
    const maxHp = Math.round(s.hp * (1 + (this.bonus[a.memberId!]?.hp ?? 0) / 100));
    a.hp += maxHp - a.maxHp;
    a.sp += s.sp - a.maxSp;
    Object.assign(a, { level: s.level, maxHp, maxSp: s.sp, atk: s.atk, def: s.def, mag: s.mag, res: s.res, skills: s.skills });
  }

  /** Resultado de la ventana "¿qué habilidad olvidar?": `forget` null = no aprender la nueva. */
  chooseSkill(actorId: number, learn: string, forget: string | null): void {
    const a = this.actors.find((x) => x.id === actorId);
    if (!a?.memberId || !forget) return;
    setSkills(this.state, a.memberId, a.skills.map((s) => (s === forget ? learn : s)));
    this.refreshMember(a);
    this.log(`${a.name} olvida ${SKILLS[forget].name} y aprende ${SKILLS[learn].name}.`, '#ffe680');
  }

  pouchUsed(): number {
    return Object.values(this.pouch).reduce((a, b) => a + b, 0);
  }

  private makeMonster(monsterId: string, level: number, x: number, y: number): Actor {
    const m = MONSTERS[monsterId];
    const st = (k: keyof typeof m.base) => monsterStat(m.base[k], level, m.boss, k);
    const faction = m.faction;
    const hp = st('hp');
    return {
      id: this.nextId++, side: 'enemy', name: m.name, sprite: m.sprite, x, y, fx: -1, fy: 0,
      element: m.element, level, hp, maxHp: hp, sp: 0, maxSp: 0, atk: st('atk'), def: st('def'), mag: st('mag'), res: st('res'),
      statuses: {}, skills: [], alive: true, monsterId, ai: m.ai, monsterSkills: m.skills,
      xp: Math.round(m.xp * (1 + 0.5 * (level - 1))), boss: m.boss, reaper: m.reaper, fast: m.fast, alert: 0, hpAcc: 0, faction,
      w: m.size?.[0], h: m.size?.[1], still: m.still, ward: m.ward,
    };
  }

  private monsterLevel(): number {
    if (this.def.scaling === 'party') {
      // Sin fin: un salto de dificultad por cada tramo de 10 pisos, y un poco más dentro del tramo.
      // Desfile de jefes: un nivel más cada dos jefes.
      const extra = this.def.bossRush
        ? Math.floor((this.floor - 1) / 2) - 2
        : this.def.infinite ? (this.tier - 1) * TIER_LEVELS + Math.floor(((this.floor - 1) % BOSS_EVERY) / 4) : Math.floor((this.floor - 1) / 2);
      return Math.max(1, Math.round(this.partyLevel + this.rankOffset + extra + this.rng.int(-1, 0) - (this.def.solo ? 2 : 0)));
    }
    const [lo, hi] = this.def.levels;
    const t = this.def.floors > 1 ? (this.floor - 1) / (this.def.floors - 1) : 0;
    return Math.max(1, Math.round(lo + (hi - lo) * t + this.rng.int(-1, 0)));
  }

  private randomRoomTile(opts: { awayFrom?: { x: number; y: number }; minDist?: number; hidden?: boolean; room?: number } = {}): { x: number; y: number } | null {
    for (let tries = 0; tries < 200; tries++) {
      const ri = opts.room ?? this.rng.int(0, this.map.rooms.length - 1);
      const r = this.map.rooms[ri];
      const x = this.rng.int(r.x, r.x + r.w - 1);
      const y = this.rng.int(r.y, r.y + r.h - 1);
      if (!this.passable(x, y) || this.actorAt(x, y) || this.goalSpotAt(x, y) || this.reserved.has(y * this.map.w + x)) continue;
      if (this.items.some((i) => i.x === x && i.y === y)) continue;
      if (x === this.stairs.x && y === this.stairs.y) continue;
      if (opts.awayFrom && cheb(opts.awayFrom, { x, y }) < (opts.minDist ?? 0)) continue;
      if (opts.hidden && this.visible && this.isVisible(x, y)) continue;
      return { x, y };
    }
    return null;
  }

  /** Crea un jefe donde quepa (los grandes buscan hueco; el que no se mueve, en el centro de la sala). No lo añade. */
  private placeBoss(id: string, level: number, near: { x: number; y: number }): Actor {
    const m = MONSTERS[id];
    const at = m.still ? mid(this.map.rooms[0]) : near;
    const pos = (m.size && this.spotFor(at.x, at.y, m.size[0], m.size[1])) || this.freeNear(at.x, at.y) || this.randomRoomTile({ room: 0 }) || at;
    return this.makeMonster(id, level, pos.x, pos.y);
  }

  /** Debilita a un monstruo (escoltas y acompañantes): vida y daño. */
  private weaken(e: Actor, pw: { hp: number; dmg: number }) {
    e.maxHp = e.hp = Math.round(e.maxHp * pw.hp);
    e.atk = Math.round(e.atk * pw.dmg);
    e.mag = Math.round(e.mag * pw.dmg);
  }

  /** Desfile: los jefes que acompañan al principal en este piso (distintos, sin Dios ni los que ya vienen de escolta). */
  private rushCompanions(main: string, escort: string[]): string[] {
    const n = RUSH_MIX_FROM.filter((f) => this.floor >= f).length;
    const pool = Object.values(MONSTERS).filter((m) => m.boss && !m.reaper && !m.ward && m.id !== 'eco' && m.id !== main && !escort.includes(m.id));
    return this.rng.shuffle(pool).slice(0, n).map((m) => m.id);
  }

  /** Guardián de las mazmorras sin fin: un jefe de los que la historia pone cerca de este nivel (si no hay, cualquiera). */
  private guardianBoss(): string {
    const all = Object.values(MONSTERS).filter((m) => m.boss && !m.special);
    const near = all.filter((m) => bossStoryLevel(m.id) <= this.monsterLevel() + 6);
    return this.rng.pick(near.length ? near : all).id;
  }

  /** Desfile de jefes: cualquier jefe del juego (también los de la historia), sin repetir el anterior. */
  private rushLast?: string;
  /** Jefe con escolta protectora (el feto): sus guardianes, cuenta para revivirlos, ventana vulnerable y próxima invocación. */
  private wardGuards: Actor[] = [];
  private wardRevive = -1;
  private wardOpen = 0;
  private wardSummon = WARD.summon;
  private rushBoss(): string {
    const all = Object.values(MONSTERS).filter((m) => m.boss && !m.reaper && m.id !== 'eco' && m.id !== this.rushLast);
    this.rushLast = this.rng.pick(all).id;
    return this.rushLast;
  }

  private monsterPool(): { id: string; weight: number; minFloor?: number }[] {
    // Todos los monstruos... de los que a ese nivel ya se habrían visto en la historia (si no, a nivel bajo salen
    // arcángeles y serpientes con estadísticas pensadas para el final).
    if (this.def.monsterPool === 'all') {
      const all = Object.values(MONSTERS).filter((m) => !m.boss && !m.reaper && !m.special);
      const fit = all.filter((m) => firstSeenLevel(m.id) <= this.partyLevel + this.rankOffset + 4);
      return (fit.length >= 4 ? fit : all).map((m) => ({ id: m.id, weight: 1 }));
    }
    return this.def.monsters;
  }

  private spawnEnemy(hidden: boolean): void {
    const pool = this.monsterPool().filter((m) => (m.minFloor ?? 1) <= this.floor);
    if (!pool.length) return;
    const pick = this.rng.weighted(pool);
    const pos = this.randomRoomTile({ awayFrom: this.leader, minDist: hidden ? 8 : 6, hidden });
    if (!pos) return;
    const e = this.makeMonster(pick.id, this.monsterLevel(), pos.x, pos.y);
    // Variantes de color: el mismo monstruo de otro elemento (en los pisos elementales, siempre del elemento del piso).
    // En las primeras mazmorras salen menos (un tercio en las de ★, dos tercios en las de ★★).
    const chance = VARIANT_CHANCE * Math.min(1, this.def.difficulty / 3);
    const regional = this.def.elements?.length && this.rng.chance(0.6) ? this.rng.pick(this.def.elements) : null;
    const el = this.floorElement ?? regional ?? (this.rng.chance(chance) ? this.rng.pick(ALL_ELEMENTS.filter((x) => x !== e.element)) : null);
    if (el && el !== e.element) this.setVariant(e, el);
    this.actors.push(e);
  }

  /** Cambia el elemento de un monstruo: color, nombre, debilidades y el elemento de sus habilidades. */
  private setVariant(e: Actor, el: Element) {
    e.element = el;
    e.variant = true;
    e.sprite = `${MONSTERS[e.monsterId!].sprite}~${el}`;
    e.name = el === 'neutral' ? `${e.name} gris` : `${e.name} de ${ELEMENTS[el].name.toLowerCase()}`;
  }

  startFloor(n: number): void {
    if (this.def.fixed) return this.buildFixedFloor(n);
    this.floor = n;
    this.autoVisits.clear();
    this.autoTarget = undefined;
    this.autoBad.clear();
    this.autoTrail = [];
    this.state.records[this.def.id] = Math.max(this.state.records[this.def.id] ?? 0, n);
    this.stats.floors++;
    if (this.curse > 0) this.curse--;
    this.pendingChoice = null;
    this.shopRoom = -1;
    this.debt = 0;
    this.unpaid = [];
    this.hardHits.clear();
    this.reserved.clear();
    this.boxSet.clear();
    const bossFloor = this.isBossFloor;
    // Se decide antes de generar: en los pisos con candados no hay grietas (serían atajos que se saltan las puertas).
    const lockRoll = !!this.def.locks && !bossFloor && this.rng.chance(this.def.locks.chance);
    const goalKind: GoalKind | null = this.def.goals && !bossFloor && this.rng.chance(this.def.goals.chance) ? this.rng.pick(this.def.goals.kinds) : null;
    // Palancas, braseros y llaves hay que pisarlos, y al jefe alcanzarlo: sin hielo, que podría dejarlos fuera de alcance.
    const noIce = lockRoll || bossFloor || (!!goalKind && goalKind !== 'caza' && goalKind !== 'alfa');
    const layout = this.rng.weighted(layoutsFor(this.def)).id;
    this.layout = bossFloor ? 'arena' : layout;
    this.map = generateMap(this.rng, {
      bossFloor,
      layout,
      // Sin hielo en pisos con candados: no se podría garantizar llegar a cada llave.
      terrain: this.def.terrain?.filter((t) => !(noIce && t.id === 'hielo')).map((t) => ({ code: terrainCode(t.id), rooms: t.rooms, shape: TERRAIN[t.id].shape })),
      cracks: lockRoll || bossFloor ? 0 : this.def.cracks,
      secrets: bossFloor ? 0 : this.def.secrets,
    });
    this.goal = null;
    this.terrainSeen = new Set();
    const size = this.map.w * this.map.h;
    this.visible = new Uint8Array(size);
    this.explored = new Uint8Array(size);
    this.prevBuf = new Int32Array(size);
    this.queueBuf = new Int32Array(size);
    // Los caídos siguen en el grupo (sin colocar) para poder revivirlos más adelante. La escolta no.
    this.actors = this.actors.filter((a) => a.side === 'party' && !a.escort);
    this.items = [];
    this.traps = new Map();
    this.doors = new Map();
    this.keys = [];
    this.pendingFall = false;
    this.reaperOut = false;
    this.spawnTimer = 0;
    this.wardGuards = [];
    this.wardRevive = -1;
    this.wardOpen = 0;
    this.wardSummon = WARD.summon;
    this.floorElement = undefined;
    if (this.def.elementFloors) this.floorElement = this.rng.pick([...new Set(this.monsterPool().map((m) => MONSTERS[m.id].element))]);

    const rooms = this.map.rooms;
    let stairsRoom = this.rng.int(0, rooms.length - 1);
    if (bossFloor) stairsRoom = rooms.reduce((best, r, i) => (r.w * r.h > rooms[best].w * rooms[best].h ? i : best), 0);
    const sr = rooms[stairsRoom];
    do this.stairs = { x: this.rng.int(sr.x + 1, sr.x + sr.w - 2), y: this.rng.int(sr.y + 1, sr.y + sr.h - 2) };
    while (!isFloor(this.map, this.stairs.x, this.stairs.y));
    this.stairsOpen = !bossFloor && (!goalKind || goalKind === 'vigias');
    this.map.terrain[this.stairs.y * this.map.w + this.stairs.x] = 0;

    // Grupo: el líder en una sala distinta de las escaleras, el resto alrededor. En el núcleo (una sola sala), lejos del jefe.
    let startRoom = this.rng.int(0, rooms.length - 1);
    if (rooms.length > 1) while (startRoom === stairsRoom) startRoom = this.rng.int(0, rooms.length - 1);
    const start = (rooms.length === 1 && this.randomRoomTile({ room: 0, awayFrom: this.stairs, minDist: 14 })) || this.randomRoomTile({ room: startRoom })!;
    this.map.terrain[start.y * this.map.w + start.x] = 0;

    // A veces la sala de las escaleras está cerrada con paredes agrietadas: hay que abrirse paso a golpes.
    // No si la condición del piso está en esa sala (el orden de colores, las cajas, la antorcha) o hay que llevar a alguien.
    const goalInStairsRoom = goalKind === 'colores' || goalKind === 'cajas' || goalKind === 'faros' || goalKind === 'escolta';
    if (!lockRoll && !bossFloor && !goalInStairsRoom && this.def.sealedStairs && rooms.length > 1 && this.rng.chance(this.def.sealedStairs)) sealRoom(this.map, stairsRoom);
    // Con hielo, resbalar podría impedir llegar a las escaleras: se quita hielo hasta que se pueda.
    this.fixIce(start);
    this.hazardTiles = [];
    for (let i = 0; i < this.map.terrain.length; i++) {
      const t = terrainOfCode(this.map.terrain[i]);
      if (t && TERRAIN[t].avoid) this.hazardTiles.push(i);
    }

    // Candados: salas cerradas cuya llave está en otra sala accesible.
    if (lockRoll && this.def.locks && rooms.length >= 3) {
      const lay = setupLocks(this.map, this.rng, { startRoom, stairsRoom, start, max: this.def.locks.max });
      if (lay) {
        this.doors = lay.doors;
        for (const k of lay.keys) this.items.push({ x: k.x, y: k.y, id: `llave_${k.color}`, qty: 1 });
      }
    }

    this.floorStart = { ...start };
    if (goalKind) this.setupGoal(goalKind, start, stairsRoom);

    const L = this.leader;
    L.x = start.x;
    L.y = start.y;
    for (const a of this.party) {
      if (a === L) continue;
      const spot = this.freeNear(L.x, L.y);
      if (spot) {
        a.x = spot.x;
        a.y = spot.y;
      }
    }
    this.updateFov();
    // Lysa: al llegar a cada piso, el grupo se recupera un poco.
    if (this.has('lysa') && n > 1) {
      for (const a of this.party) {
        a.hp = Math.min(a.maxHp, a.hp + Math.round(a.maxHp * 0.15));
        delete a.statuses.veneno;
      }
      this.log('El aura serena de Lysa reconforta al grupo.', '#fff2b0');
    }
    const goalNow = this.goal as FloorGoal | null;
    if (goalNow?.kind === 'escolta') this.spawnEscort();
    if (goalNow?.kind === 'vigias') this.spawnWatchers(startRoom, stairsRoom);

    if (bossFloor) {
      const bossId = this.def.bossRush ? this.rushBoss() : this.def.infinite ? this.guardianBoss() : this.def.boss!.monster;
      const level = this.def.scaling === 'party' ? this.monsterLevel() + 2 : this.def.boss!.level;
      const boss = this.placeBoss(bossId, level, this.stairs);
      // Prueba de prestigio: el jefe es un eco oscuro de quien baja, con su aspecto y su elemento.
      if (bossId === 'eco') {
        const me = this.protag;
        boss.name = `Eco de ${me.name}`;
        boss.sprite = me.sprite;
        boss.element = me.element;
        boss.echo = true;
      }
      if (this.def.bossName) boss.name = this.def.bossName;
      this.actors.push(boss);
      // Escolta del jefe: la de la mazmorra o, si el jefe tiene protección (el feto), sus cuatro capitanes, como en el trono.
      const throne = DUNGEONS.trono_dios;
      const escort = this.def.bossEscort ?? (boss.ward ? throne.bossEscort! : []);
      const power = this.def.bossEscortPower ?? (boss.ward ? throne.bossEscortPower : undefined) ?? { hp: 1, dmg: 1 };
      for (const id of escort) {
        const [ew, eh] = MONSTERS[id].size ?? [1, 1];
        const c = mid(boss);
        const spot = this.spotFor(c.x, c.y, ew, eh) ?? this.randomRoomTile({ room: 0 });
        if (spot) {
          // Los jefes apenas crecen con el nivel: la escolta se debilita aparte (vida y daño).
          const e = this.makeMonster(id, level - 2, spot.x, spot.y);
          this.weaken(e, power);
          e.elite = true;
          // La escolta no es «el jefe»: no abre las escaleras al caer. Si el jefe tiene protección, son sus guardianes.
          e.boss = false;
          if (boss.ward) {
            e.guard = true;
            this.wardGuards.push(e);
          }
          this.actors.push(e);
        }
      }
      // Desfile de jefes: cuanto más arriba, más jefes a la vez (los acompañantes, algo más débiles).
      if (this.def.bossRush) {
        const extra = this.rushCompanions(bossId, escort);
        for (const id of extra) {
          const at = this.randomRoomTile({ room: 0, awayFrom: this.leader, minDist: 8 }) ?? this.stairs;
          const b = this.placeBoss(id, level - 2, at);
          this.weaken(b, RUSH_MIX_POWER);
          this.actors.push(b);
        }
        if (extra.length) {
          this.log(`¡${extra.length + 1} jefes a la vez!`, '#ff5050');
          this.sfx('boss');
        }
      }
      for (let i = 0; i < (this.def.solo ? 1 : this.def.bossEscort || this.def.bossRush ? 0 : 2); i++) this.spawnEnemy(false);
    } else {
      let count = Math.min(10 + this.tier, Math.max(4, this.roomUnits() + Math.floor(n / 2) + this.tier - 1));
      if (this.def.solo) count = Math.ceil(count / 2);
      for (let i = 0; i < count; i++) this.spawnEnemy(false);
      if (goalKind === 'alfa') this.spawnElite();
      if (this.rng.chance(GOLDEN_CHANCE)) this.spawnGolden();
      // Cacería: algo más de la mitad de los monstruos del piso (siguen llegando más, así que siempre se puede).
      if (goalKind === 'caza') this.goal!.need = Math.max(4, Math.round(count * 0.6));
    }

    const goldScale = this.def.difficulty + (this.def.infinite ? Math.floor(n / 5) : 0);
    const itemCount = this.rng.int(3, 5) + Math.floor(this.roomUnits() / 3);
    for (let i = 0; i < itemCount; i++) {
      const pos = this.randomRoomTile();
      if (!pos) continue;
      const it = this.rng.weighted(this.def.items);
      const qty = it.id === 'gold' ? this.rng.int(8, 20) * goldScale : 1;
      this.items.push({ ...pos, id: it.id, qty });
    }

    for (let i = this.rng.int(1, 3); i > 0 && this.def.ingredients.length; i--) {
      const pos = this.randomRoomTile();
      if (pos) this.items.push({ ...pos, id: this.rng.pick(this.def.ingredients), qty: 1 });
    }
    // Salas secretas: tesoro (oro, materiales y algo bueno), nunca escaleras ni monstruos.
    for (const sr of this.map.secrets) {
      const tiles: { x: number; y: number }[] = [];
      for (let y = sr.y; y < sr.y + sr.h; y++) for (let x = sr.x; x < sr.x + sr.w; x++) tiles.push({ x, y });
      const spots = this.rng.shuffle(tiles);
      this.items.push({ ...spots[0], id: 'gold', qty: this.rng.int(30, 60) * goldScale });
      this.items.push({ ...spots[1], id: this.rng.pick(['pocion_mayor', 'elixir', 'semilla_vida', 'bomba', 'orbe_retorno']), qty: 1 });
      for (let k = 0; k < 2 && this.def.materials?.length; k++) this.items.push({ ...spots[2 + k], id: this.rng.pick(this.def.materials), qty: 1 });
    }
    for (let i = this.rng.int(0, 2); i > 0 && this.def.materials?.length; i--) {
      const pos = this.randomRoomTile();
      if (pos) this.items.push({ ...pos, id: this.rng.pick(this.def.materials), qty: 1 });
    }

    // Trampas invisibles. No hay hoyos en el último piso, antes de un núcleo ni con condición (serían un atajo).
    if (this.def.traps) {
      const nextDef = n >= this.def.floors && this.def.next ? DUNGEONS[this.def.next] : null;
      const nextIsBoss = this.bossFloorAt(n + 1) || (!!nextDef?.boss && nextDef.floors === 1);
      const ids = this.def.traps.ids.filter((t) => t !== 'hoyo' || (!this.isLastFloor && !bossFloor && !nextIsBoss && !goalKind));
      const count = Math.round(this.def.traps.density * this.roomUnits());
      for (let i = 0; i < count && ids.length; i++) {
        const pos = this.randomRoomTile({ awayFrom: L, minDist: 3 });
        if (!pos) continue;
        const idx = pos.y * this.map.w + pos.x;
        // Nunca en la entrada de una sala: no se podría rodear (y una runa de teletransporte ahí la haría inaccesible).
        if (!this.atEntrance(pos.x, pos.y) && !this.traps.has(idx)) this.traps.set(idx, { id: this.rng.pick(ids), revealed: false });
      }
    }

    // Tiendas y eventos en salas que no son la de inicio ni la de las escaleras.
    if (!bossFloor && rooms.length >= 3) {
      if (this.rng.chance(SHOP_CHANCE)) this.setupShop(startRoom, stairsRoom);
      if (this.rng.chance(EVENT_CHANCE)) this.spawnRoomEvent(startRoom, stairsRoom);
    }
    // En modo prueba no hay misiones que avanzar.
    if (!this.def.practice) this.placeQuestContent();
    // Informante: trampas a la vista desde el principio (el resto son marcas en el mapa).
    if (this.intel.has('trampas')) for (const t of this.traps.values()) t.revealed = true;
    if (this.intel.size) this.log('Las notas del informante marcan en tu mapa lo que le compraste.', '#9fd7ff');
    this.events.push({ t: 'floor' });
    this.sfx('stairs');
    this.log(`${this.def.name} · ${this.floorLabel()}`, '#c9a24a');
    if (this.floorElement) this.log(`Este piso está impregnado de ${ELEMENTS[this.floorElement].name.toLowerCase()}: todos sus monstruos son de ese elemento.`, ELEMENTS[this.floorElement].color);
    if (this.doors.size) this.log('Hay puertas cerradas con candado en este piso. Sus llaves están en otras salas.', '#e8c840');
    if (this.map.secrets.length) this.log('Se oye un eco hueco tras alguna pared... Puede que haya una sala secreta.', '#c8a8e8');
    if (this.shopRoom >= 0) this.log('Huele a incienso y a monedas: hay un tendero en este piso.', '#e8c87a');
    if (this.enemies.some((e) => e.golden)) this.log('Algo dorado brilla en este piso... y huye de vosotros.', '#ffe060');
    const curse = this.curseLabel();
    if (curse) this.log(`${curse}.`, '#c070ff');
    if (bossFloor) this.log('Una presencia enorme llena la sala. Las escaleras están selladas.', '#ff7070');
    // (setupGoal la ha podido crear: TypeScript no lo ve tras el `this.goal = null` de arriba.)
    const goal = this.goal as FloorGoal | null;
    if (goal && (!goal.done || goal.kind === 'vigias')) this.log(GOALS[goal.kind].desc.replace('suficientes monstruos', `${goal.need} monstruos`), '#ffd27a');
    this.banter();
  }

  /** Casilla de sala pegada a un pasillo (la boca de la sala). */
  private atEntrance(x: number, y: number): boolean {
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isFloor(this.map, x + dx, y + dy) && this.map.roomAt[(y + dy) * this.map.w + x + dx] < 0);
  }

  /** Carteles del piso fijo: casilla → texto (se leen una vez al pisarlos). */
  signs = new Map<number, { title: string; lines: string[]; read: boolean }>();

  /**
   * Piso dibujado a mano (Campo de entrenamiento, data/tutorial.ts). Leyenda: # muro · @ inicio · > escaleras ·
   * s limo · l lobo · p pan · o poción · x poción mayor · b bomba · g oro · k llave roja · D puerta roja ·
   * ^ trampa a la vista · v trampa oculta · % grieta · H muralla · L palanca · " hierba · ~ agua · , barro ·
   * * hielo · } corriente al este · f niebla · 1-9 cartel.
   */
  private buildFixedFloor(n: number) {
    const f = TUTORIAL_FLOORS[n - 1];
    this.floor = n;
    this.stats.floors++;
    this.autoVisits.clear();
    this.autoTarget = undefined;
    this.autoBad.clear();
    this.autoTrail = [];
    this.pendingChoice = null;
    this.shopRoom = -1;
    this.reserved.clear();
    this.boxSet.clear();
    const w = f.rows[0].length;
    const h = f.rows.length;
    const tiles = new Uint8Array(w * h);
    const roomAt = new Int16Array(w * h).fill(-1);
    const toRoom = ([x, y, rw, rh]: number[]) => ({ x, y, w: rw, h: rh });
    const rooms = f.rooms.map(toRoom);
    const secrets = f.secrets.map(toRoom);
    rooms.forEach((r, i) => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) roomAt[y * w + x] = i; });
    secrets.forEach((r, i) => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) roomAt[y * w + x] = SECRET_BASE + i; });
    this.map = { w, h, tiles, roomAt, rooms, secrets, special: new Map(), terrain: new Uint8Array(w * h), flow: new Int8Array(w * h).fill(-1) };
    const size = w * h;
    this.visible = new Uint8Array(size);
    this.explored = new Uint8Array(size);
    this.prevBuf = new Int32Array(size);
    this.queueBuf = new Int32Array(size);
    this.actors = this.actors.filter((a) => a.side === 'party' && !a.escort);
    this.items = [];
    this.traps = new Map();
    this.doors = new Map();
    this.keys = [];
    this.goal = null;
    this.signs = new Map();
    this.pendingFall = false;
    this.reaperOut = false;
    this.terrainSeen = new Set();
    this.layout = 'fijo';
    const terrain: Record<string, TerrainId> = { '"': 'hierba', '~': 'agua', ',': 'barro', '*': 'hielo', '}': 'corriente', f: 'niebla' };
    const items: Record<string, string> = { p: 'pan', o: 'pocion', x: 'pocion_mayor', b: 'bomba', g: 'gold', k: 'llave_roja' };
    const lv = Math.max(1, Math.round(this.partyLevel) - 1);
    let start = { x: 1, y: 1 };
    const later: (() => void)[] = [];
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const c = f.rows[y][x];
        const i = y * w + x;
        if (c === '#') continue;
        if (c === '%' || c === 'H') {
          this.map.special.set(i, c === '%' ? 'crack' : 'hard');
          continue;
        }
        tiles[i] = FLOOR;
        if (terrain[c]) {
          this.map.terrain[i] = terrainCode(terrain[c]);
          if (c === '}') this.map.flow[i] = 0;
        }
        if (c === '@') start = { x, y };
        else if (c === '>') this.stairs = { x, y };
        else if (items[c]) this.items.push({ x, y, id: items[c], qty: c === 'g' ? 60 : 1 });
        else if (c === 'D') this.doors.set(i, 'roja');
        else if (c === '^' || c === 'v') this.traps.set(i, { id: c === '^' ? 'pinchos' : 'veneno', revealed: c === '^' });
        else if (c === 'L') this.goal = { kind: 'palanca', need: 1, have: 0, done: false, spots: [{ x, y, on: false }] };
        else if (c === 's' || c === 'l') later.push(() => this.actors.push(this.makeMonster(c === 's' ? 'slime' : 'lobo', lv, x, y)));
        else if (f.signs[c]) this.signs.set(i, { ...f.signs[c], read: false });
      }
    this.stairsOpen = !this.goal;
    this.hazardTiles = [];
    for (let i = 0; i < this.map.terrain.length; i++) {
      const t = terrainOfCode(this.map.terrain[i]);
      if (t && TERRAIN[t].avoid) this.hazardTiles.push(i);
    }
    this.floorStart = { ...start };
    const L = this.leader;
    L.x = start.x;
    L.y = start.y;
    for (const a of this.party) {
      if (a === L) continue;
      const spot = this.freeNear(L.x, L.y);
      if (spot) [a.x, a.y] = [spot.x, spot.y];
    }
    for (const fn of later) fn();
    this.updateFov();
    this.events.push({ t: 'floor' });
    this.sfx('stairs');
    this.log(`${this.def.name} · ${f.name} (${n}/${this.def.floors})`, '#c9a24a');
    this.log('Pisa los carteles (las casillas con un poste) para aprender cada mecánica.', '#9fd7ff');
    // El primer cartel de cada piso se lee al llegar (en el primero, cómo moverse).
    const first = [...this.signs.values()].find((sg) => sg.title === f.signs['1']?.title);
    if (first) {
      first.read = true;
      this.events.push({ t: 'tip', title: first.title, lines: first.lines });
    }
  }

  /** El líder pisa un cartel del campo de entrenamiento: sale su explicación (una vez). */
  private checkSign() {
    const L = this.leader;
    const s = this.signs.get(L.y * this.map.w + L.x);
    if (!s || s.read) return;
    s.read = true;
    this.events.push({ t: 'tip', title: s.title, lines: s.lines });
  }

  /** Forma del piso actual ('arena' en los núcleos). */
  layout: string = 'clasico';

  /** Tamaño del piso en "salas normales": las salas gigantes cuentan por varias (para monstruos, objetos y trampas). */
  private roomUnits(): number {
    const area = this.map.rooms.reduce((a, r) => a + r.w * r.h, 0);
    return Math.max(this.map.rooms.length, Math.round(area / 45));
  }

  /** Coloca lo que pide la condición del piso: palanca, braseros o llave, en salas a las que se llega desde el inicio. */
  private setupGoal(kind: GoalKind, start: { x: number; y: number }, stairsRoom: number) {
    this.goal = { kind, need: 1, have: 0, done: false, spots: [] };
    if (kind === 'cajas' && !this.setupBoxes(stairsRoom)) kind = this.goal.kind = 'palanca';
    const place = (minDist: number) => {
      for (let d = minDist; d >= 2; d -= 3) {
        const p = this.reachableTile(start, d);
        // Nunca en la boca de una sala: se pisaría sin querer al pasar. Las palancas de colores, tampoco en un paso
        // obligado: pisar la de otro color reinicia el orden, y habría que pisarla para llegar a las demás.
        if (p && kind === 'colores' && this.isChokepoint(start, p)) continue;
        if (p && !this.goalSpotAt(p.x, p.y) && !this.atEntrance(p.x, p.y) && !this.items.some((i) => i.x === p.x && i.y === p.y)) {
          const i = p.y * this.map.w + p.x;
          this.map.terrain[i] = 0;
          this.map.flow[i] = -1;
          this.hazardTiles = this.hazardTiles.filter((h) => h !== i);
          return p;
        }
      }
      return null;
    };
    if (kind === 'palanca' || kind === 'braseros') {
      const n = kind === 'palanca' ? 1 : 3;
      for (let i = 0; i < n; i++) {
        const p = place(12);
        if (p) this.goal.spots.push({ ...p, on: false });
      }
      this.goal.need = this.goal.spots.length;
    } else if (kind === 'llave') {
      const p = place(14);
      if (p) this.items.push({ ...p, id: 'llave_escalera', qty: 1 });
    } else if (kind === 'faros') {
      // La antorcha, pegada a las escaleras; los faros, repartidos.
      const t = DIRS8.map((d) => ({ x: this.stairs.x + d.dx, y: this.stairs.y + d.dy })).find((p) => this.passable(p.x, p.y) && this.map.roomAt[p.y * this.map.w + p.x] >= 0);
      if (t) {
        this.goal.torch = { ...t, taken: false };
        for (let i = this.rng.int(3, 4); i > 0; i--) {
          const p = place(12);
          if (p) this.goal.spots.push({ ...p, on: false });
        }
      }
      this.goal.need = this.goal.spots.length;
    } else if (kind === 'fragmentos') {
      for (let i = this.rng.int(2, 6); i > 0; i--) {
        const p = place(10);
        if (p) this.items.push({ ...p, id: 'fragmento_sello', qty: 1 });
      }
      this.goal.need = this.items.filter((i) => i.id === 'fragmento_sello').length;
    } else if (kind === 'colores') {
      const colors = this.rng.shuffle(LOCK_COLORS.map((c) => c.id)).slice(0, this.rng.int(3, 4));
      for (const c of colors) {
        const p = place(10);
        if (p) this.goal.spots.push({ ...p, on: false, color: c });
      }
      this.goal.order = this.rng.shuffle(this.goal.spots.map((s) => s.color!));
      this.goal.need = this.goal.spots.length;
    } else if (kind === 'escolta' || kind === 'vigias') {
      this.goal.need = 0;
      if (kind === 'vigias') this.goal.done = true;
    }
    // Si no hubo sitio (piso diminuto), no hay condición.
    if ((kind === 'palanca' || kind === 'braseros' || kind === 'faros' || kind === 'colores' || kind === 'fragmentos') && !this.goal.need) this.goalDone();
    if (kind === 'llave' && !this.items.some((i) => i.id === 'llave_escalera')) this.goalDone();
  }

  /**
   * Cajas: en la sala de las escaleras, cada caja tiene su placa en línea recta (a 2 o 3 casillas) y sitio
   * detrás para empujarla. Las líneas no se cruzan ni tocan las escaleras. Devuelve false si no caben.
   */
  private setupBoxes(ri: number): boolean {
    const r = this.map.rooms[ri];
    const g = this.goal!;
    if (r.w < 6 || r.h < 6) return false;
    const W = this.map.w;
    const inRoom = (x: number, y: number) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h && this.passable(x, y);
    const boxes: NonNullable<FloorGoal['boxes']> = [];
    const want = this.rng.int(1, r.w * r.h >= 60 ? 3 : 2);
    for (let tries = 0; tries < 120 && boxes.length < want; tries++) {
      const d = this.rng.pick(WATCH_DIRS);
      const k = this.rng.int(2, 3);
      const px = this.rng.int(r.x + 1, r.x + r.w - 2);
      const py = this.rng.int(r.y + 1, r.y + r.h - 2);
      // De la casilla del que empuja (detrás de la caja) hasta la placa.
      const line: number[] = [];
      let ok = true;
      for (let j = k + 1; j >= 0 && ok; j--) {
        const x = px - d.dx * j;
        const y = py - d.dy * j;
        if (!inRoom(x, y) || this.reserved.has(y * W + x) || cheb({ x, y }, this.stairs) <= 1) ok = false;
        line.push(y * W + x);
      }
      if (!ok) continue;
      for (const i of line) {
        this.reserved.add(i);
        this.map.terrain[i] = 0;
        this.map.flow[i] = -1;
      }
      const bx = px - d.dx * k;
      const by = py - d.dy * k;
      boxes.push({ x: bx, y: by, x0: bx, y0: by, dx: d.dx, dy: d.dy, px, py });
      this.boxSet.add(by * W + bx);
      g.spots.push({ x: px, y: py, on: false });
    }
    if (!boxes.length) return false;
    g.boxes = boxes;
    g.need = boxes.length;
    // Botón de reinicio, en la misma sala, fuera de las líneas.
    for (let tries = 0; tries < 60 && !g.reset; tries++) {
      const x = this.rng.int(r.x, r.x + r.w - 1);
      const y = this.rng.int(r.y, r.y + r.h - 1);
      if (inRoom(x, y) && !this.reserved.has(y * W + x) && !(x === this.stairs.x && y === this.stairs.y)) {
        g.reset = { x, y };
        this.reserved.add(y * W + x);
        this.map.terrain[y * W + x] = 0;
      }
    }
    this.hazardTiles = this.hazardTiles.filter((i) => !this.reserved.has(i));
    return true;
  }

  /** Empuja la caja de (x, y) un paso en (dx, dy). Devuelve si se movió. */
  private pushBox(x: number, y: number, dx: number, dy: number): boolean {
    const g = this.goal;
    const b = g?.boxes?.find((q) => q.x === x && q.y === y);
    if (!g || !b) return false;
    const nx = x + dx;
    const ny = y + dy;
    const W = this.map.w;
    const other = this.actorAt(nx, ny);
    if (!this.passable(nx, ny) || (other && other.side !== 'party')) {
      this.log('La caja no se mueve: hay algo detrás.', '#c8b8a0');
      return false;
    }
    // Un aliado detrás de la caja se aparta.
    if (other) {
      this.boxSet.add(ny * W + nx);
      const spot = this.freeNear(nx, ny);
      this.boxSet.delete(ny * W + nx);
      if (!spot) return false;
      other.x = spot.x;
      other.y = spot.y;
      this.events.push({ t: 'move', id: other.id, x: other.x, y: other.y });
    }
    this.boxSet.delete(y * W + x);
    b.x = nx;
    b.y = ny;
    this.boxSet.add(ny * W + nx);
    this.events.push({ t: 'wall', x: nx, y: ny });
    this.checkPlates();
    return true;
  }

  /** Cajas sobre placas: cuando todas lo están, se abren las escaleras. */
  private checkPlates() {
    const g = this.goal;
    if (!g?.boxes) return;
    for (const s of g.spots) s.on = g.boxes.some((b) => b.x === s.x && b.y === s.y);
    const before = g.have;
    g.have = g.spots.filter((s) => s.on).length;
    if (g.have > before && !g.done) {
      this.log(`La placa cede con un clic (${g.have}/${g.need}).`, '#ffd27a');
      this.sfx('pickup');
    }
    if (g.have >= g.need) this.goalDone();
  }

  /** Botón de reinicio: las cajas vuelven a su sitio (quien esté encima se aparta). */
  private resetBoxes() {
    const g = this.goal;
    if (!g?.boxes || g.done) return;
    const W = this.map.w;
    for (const b of g.boxes) this.boxSet.delete(b.y * W + b.x);
    for (const b of g.boxes) {
      b.x = b.x0;
      b.y = b.y0;
      this.boxSet.add(b.y * W + b.x);
    }
    for (const b of g.boxes) {
      const a = this.actorAt(b.x, b.y);
      if (!a) continue;
      const spot = this.freeNear(b.x, b.y);
      if (spot) {
        a.x = spot.x;
        a.y = spot.y;
        this.events.push({ t: 'move', id: a.id, x: a.x, y: a.y });
      }
    }
    this.checkPlates();
    this.events.push({ t: 'wall', x: g.reset!.x, y: g.reset!.y });
    this.log('Pulsas el botón: las cajas vuelven a su sitio.', '#c8b8a0');
    this.sfx('magic');
  }

  /** Escolta: una persona perdida junto al grupo que le sigue hasta las escaleras. */
  private spawnEscort() {
    const L = this.leader;
    const spot = this.freeNear(L.x, L.y);
    if (!spot) return this.goalDone();
    const who = this.rng.pick([{ name: 'Viajera perdida', sprite: 'p_woman' }, { name: 'Minero herido', sprite: 'p_npc' }, { name: 'Peregrino anciano', sprite: 'p_old' }, { name: 'Niño extraviado', sprite: 'p_child' }]);
    const lv = Math.round(this.partyLevel);
    const hp = Math.round(this.party.reduce((s, a) => s + a.maxHp, 0) / this.party.length * 0.6);
    this.actors.push({
      id: this.nextId++, side: 'party', name: who.name, sprite: who.sprite, ...spot, fx: 0, fy: 1, element: 'neutral', level: lv,
      hp, maxHp: hp, sp: 0, maxSp: 0, atk: 1, def: Math.round(lv * 0.8), mag: 1, res: Math.round(lv * 0.8), statuses: {}, skills: [], alive: true, alert: 0, hpAcc: 0, escort: true,
    });
    this.log(`${who.name}: «¡Por favor, sacadme de aquí! Os sigo hasta las escaleras.»`, '#9fd7ff');
  }

  get escort(): Actor | undefined {
    return this.actors.find((a) => a.escort && a.alive);
  }

  /** Gólems vigía en el centro de algunas salas (nunca en la de inicio ni en la de las escaleras). */
  private spawnWatchers(startRoom: number, stairsRoom: number) {
    const rooms = this.rng.shuffle(this.map.rooms.map((_, i) => i).filter((i) => i !== startRoom && i !== stairsRoom));
    for (const ri of rooms.slice(0, this.rng.int(2, Math.min(4, Math.max(2, rooms.length - 1))))) {
      const r = this.map.rooms[ri];
      const x = r.x + (r.w >> 1);
      const y = r.y + (r.h >> 1);
      if (!this.passable(x, y) || this.actorAt(x, y) || this.reserved.has(y * this.map.w + x) || this.atEntrance(x, y)) continue;
      this.actors.push({
        id: this.nextId++, side: 'npc', name: 'Gólem vigía', sprite: 'm_golem', x, y, fx: 1, fy: 0, element: 'tierra', level: 1,
        hp: 1, maxHp: 1, sp: 0, maxSp: 0, atk: 0, def: 0, mag: 0, res: 0, statuses: {}, skills: [], alive: true, alert: 0, hpAcc: 0,
        watcher: { dir0: this.rng.int(0, 3) },
      });
    }
  }

  get watchers(): Actor[] {
    return this.actors.filter((a) => a.watcher && a.alive);
  }

  /** Casillas que ve un gólem en el turno `turn`: 4 casillas al frente y, desde la segunda, también a los lados. */
  watchTiles(g: Actor, turn = this.turn): number[] {
    const d = WATCH_DIRS[(g.watcher!.dir0 + Math.floor(turn / WATCH_TURN)) % 4];
    const W = this.map.w;
    const out: number[] = [];
    for (let k = 1; k <= 4; k++) {
      const x = g.x + d.dx * k;
      const y = g.y + d.dy * k;
      if (!isFloor(this.map, x, y)) break;
      out.push(y * W + x);
      if (k >= 2)
        for (const s of [-1, 1]) {
          const sx = x + d.dy * s;
          const sy = y + d.dx * s;
          if (isFloor(this.map, sx, sy)) out.push(sy * W + sx);
        }
    }
    return out;
  }

  /** Si un gólem ve al líder, el grupo vuelve al inicio del piso. */
  private checkWatchers() {
    const L = this.leader;
    const i = L.y * this.map.w + L.x;
    const g = this.watchers.find((w) => this.watchTiles(w).includes(i));
    if (!g) return;
    this.stats.caught++;
    this.events.push({ t: 'flash', x: L.x, y: L.y, color: '#ff3030' });
    this.log('¡El gólem vigía te ha visto! Una fuerza os arrastra al inicio del piso.', '#ff7070');
    this.sfx('hurt');
    L.x = this.floorStart.x;
    L.y = this.floorStart.y;
    if (this.actorAt(L.x, L.y) !== L) {
      const o = this.actorAt(L.x, L.y);
      if (o && o !== L) {
        const s = this.freeNear(L.x, L.y);
        if (s) [o.x, o.y] = [s.x, s.y];
      }
    }
    this.events.push({ t: 'warp', id: L.id, x: L.x, y: L.y });
    for (const a of [...this.party, ...(this.escort ? [this.escort] : [])]) {
      if (a === L) continue;
      const s = this.freeNear(L.x, L.y);
      if (s) {
        a.x = s.x;
        a.y = s.y;
        this.events.push({ t: 'warp', id: a.id, x: a.x, y: a.y });
      }
    }
    this.autoVisits.clear();
    this.autoTarget = undefined;
    this.updateFov();
  }

  /** Monstruo dorado: huye del grupo; si cae, suelta oro y algo bueno. */
  private spawnGolden() {
    const pool = this.monsterPool().filter((m) => (m.minFloor ?? 1) <= this.floor && (!this.floorElement || MONSTERS[m.id].element === this.floorElement));
    const pos = this.randomRoomTile({ awayFrom: this.leader, minDist: 10 });
    if (!pool.length || !pos) return;
    const e = this.makeMonster(this.rng.weighted(pool).id, this.monsterLevel() + 1, pos.x, pos.y);
    e.name = `${e.name} dorado`;
    e.golden = true;
    e.maxHp = e.hp = Math.round(e.maxHp * 1.6);
    e.def = Math.round(e.def * 1.3);
    e.xp = (e.xp ?? 0) * 4;
    this.actors.push(e);
  }

  /** Tienda: un tendero en una sala, con objetos a la venta en el suelo. */
  private setupShop(startRoom: number, stairsRoom: number) {
    const cands = this.map.rooms.map((r, i) => ({ r, i })).filter(({ r, i }) => i !== startRoom && i !== stairsRoom && r.w * r.h >= 20);
    if (!cands.length) return;
    const { r, i } = this.rng.pick(cands);
    const x = r.x + (r.w >> 1);
    const y = r.y + (r.h >> 1);
    if (!this.passable(x, y) || this.actorAt(x, y) || this.atEntrance(x, y)) return;
    this.shopRoom = i;
    this.actors.push({
      id: this.nextId++, side: 'npc', name: 'Tendero errante', sprite: 'p_merchant', x, y, fx: 0, fy: 1, element: 'neutral', level: 1,
      hp: 1, maxHp: 1, sp: 0, maxSp: 0, atk: 0, def: 0, mag: 0, res: 0, statuses: {}, skills: [], alive: true, alert: 0, hpAcc: 0, shop: true,
    });
    const stock = [...CAMP_SHOP, 'pocion_mayor', 'elixir', 'semilla_vida', 'bomba', 'orbe_retorno', 'frasco_turbio', 'pergamino_sellado'];
    for (let k = this.rng.int(4, 6); k > 0; k--) {
      const pos = this.randomRoomTile({ room: i });
      if (!pos || cheb(pos, { x, y }) < 1) continue;
      const id = this.rng.pick(stock);
      this.items.push({ ...pos, id, qty: 1, price: this.shopPrice(id) });
    }
  }

  /** Precio en la tienda de la mazmorra (Seren regatea). */
  shopPrice(id: string): number {
    return Math.ceil((ITEMS[id].price * 1.2 * (this.has('seren') ? 0.85 : 1)) / 5) * 5;
  }

  /** Hablar con el tendero: paga lo que llevas; si no te llega, devuelves lo que no puedes pagar. */
  private talkShop(npc: Actor) {
    if (!this.debt) {
      this.log('Tendero: «Mira lo que quieras. Lo que cojas, me lo pagas aquí antes de salir.»', '#e8c87a');
      return;
    }
    if (this.state.gold >= this.debt) {
      this.state.gold -= this.debt;
      this.log(`Pagas ${this.debt} de oro. Tendero: «Un placer hacer negocios.»`, '#e8c87a');
      this.sfx('pickup');
    } else {
      for (const u of this.unpaid) {
        removeFromBag(this.state, u.id);
        const spot = this.freeNear(npc.x, npc.y);
        if (spot) this.items.push({ ...spot, id: u.id, qty: 1, price: u.price });
      }
      this.log('Tendero: «No te llega el oro. Devuélveme lo que no puedes pagar.»', '#e8c87a');
    }
    this.debt = 0;
    this.unpaid = [];
  }

  /** Salir de la tienda sin pagar: el tendero se enfada y llama a sus guardias. */
  private checkTheft() {
    if (!this.debt || this.shopRoom < 0) return;
    const L = this.leader;
    if (this.map.roomAt[L.y * this.map.w + L.x] === this.shopRoom) return;
    const npc = this.actors.find((a) => a.shop && a.alive);
    this.debt = 0;
    this.unpaid = [];
    this.stats.stolen++;
    this.log('Tendero: «¡AL LADRÓN!» Sus guardias aparecen de la nada.', '#ff5050');
    this.sfx('boss');
    const lv = this.monsterLevel() + 6;
    if (npc) {
      npc.alive = false;
      this.events.push({ t: 'death', id: npc.id });
      this.actors.push({ ...this.makeMonster('tendero', lv, npc.x, npc.y), alert: 20, lastSeen: { x: L.x, y: L.y } });
    }
    for (let k = 0; k < 2; k++) {
      const pos = this.freeNear(L.x, L.y) ?? this.randomRoomTile({ awayFrom: L, minDist: 3 });
      if (pos) this.actors.push({ ...this.makeMonster('guardia_tienda', lv - 2, pos.x, pos.y), alert: 20, lastSeen: { x: L.x, y: L.y } });
    }
  }

  /** Evento en una sala: altar, viajero herido, cofre o fuente. */
  private spawnRoomEvent(startRoom: number, stairsRoom: number) {
    const rooms = this.map.rooms.map((_, i) => i).filter((i) => i !== startRoom && i !== stairsRoom && i !== this.shopRoom);
    if (!rooms.length) return;
    // Nunca en la boca de una sala: no se aparta y taparía el paso.
    const room = this.rng.pick(rooms);
    let pos: { x: number; y: number } | null = null;
    for (let k = 0; k < 20 && (!pos || this.atEntrance(pos.x, pos.y)); k++) pos = this.randomRoomTile({ room });
    if (!pos || this.atEntrance(pos.x, pos.y)) return;
    const kind = this.rng.pick<RoomEventKind>(['altar', 'viajero', 'cofre', 'cofre', 'fuente']);
    const look: Record<RoomEventKind, { name: string; sprite: string }> = {
      altar: { name: 'Altar de sangre', sprite: 'ev_altar' },
      viajero: { name: 'Viajero herido', sprite: 'p_old' },
      cofre: { name: 'Cofre', sprite: 'ev_cofre' },
      fuente: { name: 'Fuente extraña', sprite: 'ev_fuente' },
    };
    this.actors.push({
      id: this.nextId++, side: 'npc', name: look[kind].name, sprite: look[kind].sprite, ...pos, fx: 0, fy: 1, element: 'neutral', level: 1,
      hp: 1, maxHp: 1, sp: 0, maxSp: 0, atk: 0, def: 0, mag: 0, res: 0, statuses: {}, skills: [], alive: true, alert: 0, hpAcc: 0, event: kind,
    });
  }

  /** Al chocar con un evento de sala: deja una pregunta pendiente para la interfaz. */
  private openEvent(a: Actor) {
    const pots = bagCount(this.state, 'pocion') + bagCount(this.state, 'pocion_mayor');
    const food = bagCount(this.state, 'pan') + bagCount(this.state, 'carne_seca') + bagCount(this.state, 'racion');
    const opts: Record<RoomEventKind, { text: string; options: string[] }> = {
      altar: { text: 'Un altar de piedra manchado de rojo. Una voz susurra: «Sangre por un regalo».', options: ['Ofrecer sangre (todos pierden un 20% de vida)', 'Marcharse'] },
      viajero: { text: '«Agua... algo...» Un viajero herido está tirado contra la pared.', options: [pots ? 'Darle una poción' : 'Darle una poción (no tienes)', food ? 'Darle comida' : 'Darle comida (no tienes)', 'Seguir tu camino'] },
      cofre: { text: this.has('pip') ? `Pip lo mira de cerca: «${this.mimicHere(a) ? 'Ni se te ocurra. Respira.' : 'Está limpio. Ábrelo.'}»` : 'Un cofre viejo y cerrado. ¿Será un tesoro... o algo con dientes?', options: ['Abrirlo', 'Dejarlo'] },
      fuente: { text: this.has('lysa') ? 'Una fuente de agua oscura. Lysa reza sobre ella y el agua se aclara.' : 'Una fuente de agua oscura que burbujea sola.', options: ['Beber', 'Marcharse'] },
    };
    const o = opts[a.event!];
    this.pendingChoice = { actorId: a.id, title: a.name, text: o.text, options: o.options };
    this.events.push({ t: 'choice' });
  }

  /** Si el cofre es un mímico se decide al crearlo (con la semilla del piso) para que Pip pueda saberlo. */
  private mimicHere(a: Actor): boolean {
    return (a.id * 2654435761 + this.floor * 97) % 100 < 35;
  }

  /** Respuesta del jugador (o del piloto) a un evento de sala. */
  resolveChoice(option: number): void {
    const c = this.pendingChoice;
    if (!c) return;
    this.pendingChoice = null;
    const a = this.actors.find((x) => x.id === c.actorId);
    if (!a?.alive || !a.event) return;
    const done = () => {
      a.alive = false;
      this.events.push({ t: 'death', id: a.id });
      this.stats.events++;
    };
    const reward = (ids: string[]) => {
      const id = this.rng.pick(ids);
      if (addToBag(this.state, id, 1)) this.log(`Consigues ${ITEMS[id].name}.`, '#ffe680');
      else this.items.push({ x: a.x, y: a.y, id, qty: 1 });
    };
    const L = this.leader;
    switch (a.event) {
      case 'altar':
        if (option !== 0) return;
        for (const p of this.party) this.applyDamage(p, Math.max(1, Math.round(p.maxHp * 0.2)));
        if (this.result) return;
        this.log('El altar bebe la sangre ofrecida y deja algo a cambio.', '#ff7070');
        reward(['semilla_vida', 'elixir', 'pocion_mayor', 'pocion_mayor', 'lagrima_alba', 'bomba']);
        done();
        break;
      case 'viajero': {
        const pot = ['pocion', 'pocion_mayor'].find((id) => bagCount(this.state, id) > 0);
        const meal = ['pan', 'carne_seca', 'racion'].find((id) => bagCount(this.state, id) > 0);
        if (option === 0 && pot) removeFromBag(this.state, pot);
        else if (option === 1 && meal) removeFromBag(this.state, meal);
        else return;
        const gold = 30 * this.def.difficulty;
        this.state.gold += gold;
        this.goldFound += gold;
        this.explored[this.stairs.y * this.map.w + this.stairs.x] = 1;
        this.log(`Viajero: «Gracias... Tomad, es todo lo que tengo. Y las escaleras están por allí.» (+${gold} de oro, escaleras en el mapa)`, '#9fd7ff');
        done();
        break;
      }
      case 'cofre':
        if (option !== 0) return;
        done();
        if (this.mimicHere(a)) {
          this.log('¡El cofre abre una boca llena de dientes! Es un mímico.', '#ff5050');
          this.actors.push({ ...this.makeMonster('mimico', this.monsterLevel() + 2, a.x, a.y), alert: 10, lastSeen: { x: L.x, y: L.y } });
          this.sfx('boss');
        } else {
          const gold = this.rng.int(20, 40) * this.def.difficulty;
          this.state.gold += gold;
          this.goldFound += gold;
          this.log(`Dentro hay ${gold} de oro.`, '#e8c87a');
          reward(['pocion_mayor', 'elixir', 'bomba', 'frasco_turbio', 'pergamino_sellado', 'orbe_retorno']);
          this.sfx('pickup');
        }
        break;
      case 'fuente':
        if (option !== 0) return;
        done();
        if (this.has('lysa') || this.rng.chance(0.65)) {
          for (const p of this.party) {
            this.heal(p, Math.round(p.maxHp * 0.4));
            p.sp = Math.min(p.maxSp, p.sp + 5);
            delete p.statuses.veneno;
          }
          this.log('El agua sabe a hierro, pero os sentís mucho mejor.', '#8fe39a');
        } else {
          for (const p of this.party) this.addStatus(p, 'veneno', 6);
          this.log('¡El agua estaba envenenada!', '#9be36b');
        }
        break;
    }
    this.afterLeader();
  }

  /** Lo que elige el piloto automático ante un evento. */
  autoChoice(): number {
    const c = this.pendingChoice;
    const a = c && this.actors.find((x) => x.id === c.actorId);
    if (!a) return 0;
    const pots = bagCount(this.state, 'pocion') + bagCount(this.state, 'pocion_mayor');
    if (a.event === 'altar') return this.party.every((p) => p.hp / p.maxHp > 0.7) ? 0 : 1;
    if (a.event === 'viajero') return pots >= 3 ? 0 : 2;
    if (a.event === 'cofre') return this.has('pip') && this.mimicHere(a) ? 1 : 0;
    return this.party.some((p) => p.hp / p.maxHp < 0.6) ? 0 : 1;
  }

  /** Monstruo alfa: más nivel y mucha más vida; al caer abre las escaleras. */
  private spawnElite() {
    let pool = this.monsterPool().filter((m) => (m.minFloor ?? 1) <= this.floor);
    if (this.floorElement) pool = pool.filter((m) => MONSTERS[m.id].element === this.floorElement);
    const pos = this.randomRoomTile({ awayFrom: this.leader, minDist: 10 }) ?? this.randomRoomTile({});
    if (!pool.length || !pos) return this.goalDone();
    const e = this.makeMonster(this.rng.weighted(pool).id, this.monsterLevel() + 3, pos.x, pos.y);
    e.name = `${e.name} alfa`;
    e.elite = true;
    e.maxHp = e.hp = Math.round(e.maxHp * 2.5);
    e.atk = Math.round(e.atk * 1.15);
    e.xp = (e.xp ?? 0) * 3;
    this.actors.push(e);
  }

  /** Abre las escaleras; si el líder ya está encima, cuenta como pisarlas. */
  private openStairs() {
    this.stairsOpen = true;
    const L = this.leader;
    if (L.x === this.stairs.x && L.y === this.stairs.y) this.steppedOnStairs = true;
  }

  /** Se cumplió la condición del piso: se abren las escaleras. */
  private goalDone() {
    const g = this.goal;
    if (!g || g.done) return;
    g.done = true;
    if (!g.failed) this.stats.goals++;
    this.openStairs();
    this.events.push({ t: 'flash', x: this.stairs.x, y: this.stairs.y, color: '#ffd27a' });
    this.sfx('levelup');
    this.log('¡Se oye un chasquido lejano: las escaleras se han abierto!', '#ffd27a');
  }

  /** El líder pisa una palanca o un brasero apagado. */
  private checkGoalSpot() {
    const L = this.leader;
    const g = this.goal;
    if (!g || g.done) return;
    if (g.reset && g.reset.x === L.x && g.reset.y === L.y) return this.resetBoxes();
    if (g.kind === 'cajas') return;
    if (g.torch && g.torch.x === L.x && g.torch.y === L.y) {
      if (!g.torch.taken) {
        g.torch.taken = true;
        this.log('Coges la antorcha. Ahora, a encender los faros.', '#ffb040');
        this.sfx('pickup');
        this.events.push({ t: 'wall', x: L.x, y: L.y });
      }
      return;
    }
    const s = g.spots.find((q) => q.x === L.x && q.y === L.y);
    if (!s || s.on) return;
    if (g.kind === 'faros' && !g.torch?.taken) {
      this.log('El faro está frío. Necesitas la antorcha que hay junto a las escaleras.', '#c8b8a0');
      return;
    }
    if (g.kind === 'colores' && s.color !== g.order![g.have]) {
      if (!g.have) {
        this.log(`La palanca ${LOCK_BY_ID[s.color!].name} no se mueve: no es la primera del orden.`, '#c8b8a0');
        return;
      }
      for (const q of g.spots) q.on = false;
      g.have = 0;
      this.log(`Bajas la palanca ${LOCK_BY_ID[s.color!].name}... ¡Orden incorrecto! Todas vuelven a su sitio.`, '#ff9c8a');
      this.sfx('miss');
      this.events.push({ t: 'wall', x: L.x, y: L.y });
      return;
    }
    s.on = true;
    g.have++;
    this.events.push({ t: 'flash', x: s.x, y: s.y, color: '#ffb040' });
    if (g.kind === 'palanca') this.log('Bajas la palanca. Algo se mueve en las paredes...', '#ffd27a');
    else if (g.kind === 'colores') this.log(`Palanca ${LOCK_BY_ID[s.color!].name} (${g.have}/${g.need}).`, LOCK_BY_ID[s.color!].color);
    else if (g.kind === 'faros') this.log(`El faro se enciende (${g.have}/${g.need}).`, '#ffb040');
    else this.log(`El brasero prende (${g.have}/${g.need}).`, '#ffb040');
    this.events.push({ t: 'wall', x: L.x, y: L.y });
    this.sfx('magic');
    if (g.have >= g.need) this.goalDone();
  }

  private freeNear(x: number, y: number): { x: number; y: number } | null {
    for (let r = 1; r < 4; r++)
      for (const d of DIRS8) {
        const nx = x + d.dx * r;
        const ny = y + d.dy * r;
        if (this.passable(nx, ny) && !this.actorAt(nx, ny)) return { x: nx, y: ny };
      }
    return null;
  }

  /** ¿Cabe algo de w×h con la esquina en (x, y)? Suelo libre (`self` no estorba). */
  private fits(x: number, y: number, w: number, h: number, self?: Actor): boolean {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) {
        if (!this.passable(xx, yy)) return false;
        const o = this.actorAt(xx, yy);
        if (o && o !== self) return false;
      }
    return true;
  }

  /** Sitio libre para algo de w×h lo más cerca posible de (x, y), sin tapar las escaleras. */
  private spotFor(x: number, y: number, w: number, h: number): { x: number; y: number } | null {
    for (let r = 0; r < 20; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const ax = x + dx - (w >> 1);
          const ay = y + dy - (h >> 1);
          if (this.fits(ax, ay, w, h) && !covers({ x: ax, y: ay, w, h }, this.stairs.x, this.stairs.y)) return { x: ax, y: ay };
        }
    return null;
  }

  /** Desde qué casilla sale un ataque en línea o de frente (en los grandes, la del borde que mira hacia allí). */
  private origin(a: Actor, dx: number, dy: number): { x: number; y: number } {
    const w = a.w ?? 1;
    const h = a.h ?? 1;
    return { x: dx > 0 ? a.x + w - 1 : dx < 0 ? a.x : a.x + (w >> 1), y: dy > 0 ? a.y + h - 1 : dy < 0 ? a.y : a.y + (h >> 1) };
  }

  // ---------------------------------------------------------------- el feto del trono

  /** El feto es inmune mientras quede en pie alguno de sus guardianes. */
  warded(a: Actor): boolean {
    return !!a.ward && this.wardGuards.some((g) => g.alive);
  }

  /** Para el HUD: en qué fase está el jefe protegido. */
  wardNote(): string | null {
    const b = this.boss;
    if (!b?.ward) return null;
    if (this.wardOpen > 0) return `¡Vulnerable! ${this.wardOpen} turnos`;
    if (!this.warded(b)) return null;
    return this.wardRevive > 0 ? `Inmune · revive a un capitán en ${this.wardRevive}` : 'Inmune · lo protegen los capitanes';
  }

  /** Cae un guardián: empieza la cuenta para revivirlos; si ya no queda ninguno, el jefe queda al descubierto. */
  private guardDown() {
    if (this.wardGuards.some((g) => g.alive)) {
      if (this.wardRevive < 0) {
        this.wardRevive = WARD.revive;
        this.log(`Si no caen los cuatro en ${WARD.revive} turnos, el feto empezará a devolverlos a la vida.`, '#fff2b0');
      }
      return;
    }
    this.wardRevive = -1;
    this.wardOpen = WARD.open;
    this.sfx('boss');
    this.log(`¡Han caído los cuatro! La luz que protege al feto se apaga: ${WARD.open} turnos para herirlo.`, '#ffe680');
  }

  /** Cada turno: revivir capitanes (uno a uno si se tarda, los cuatro al cerrarse la ventana) e invocar criaturas. */
  private wardTick() {
    const b = this.boss;
    if (!b?.ward) return;
    const down = this.wardGuards.filter((g) => !g.alive);
    if (this.wardOpen > 0) {
      if (--this.wardOpen === 0) {
        for (const g of down) this.reviveGuard(g, b, 0.5);
        this.log('El feto canta sin voz y los cuatro capitanes se levantan otra vez.', '#ff9c8a');
      }
    } else if (this.wardRevive > 0 && --this.wardRevive === 0) {
      if (down.length) this.reviveGuard(this.rng.pick(down), b, 0.35);
      this.wardRevive = down.length > 1 ? WARD.reviveEvery : -1;
    }
    if (--this.wardSummon <= 0) {
      this.wardSummon = WARD.summon;
      this.summonFrom(b);
    }
  }

  private reviveGuard(g: Actor, b: Actor, hp: number) {
    const c = mid(b);
    const spot = this.spotFor(c.x, c.y, g.w ?? 1, g.h ?? 1);
    if (!spot) return;
    // Cada vez que vuelve, lo hace algo más débil: la pelea siempre avanza.
    g.maxHp = Math.round(g.maxHp * 0.85);
    Object.assign(g, { x: spot.x, y: spot.y, alive: true, hp: Math.round(g.maxHp * hp), statuses: {}, xp: 0, alert: 10 });
    this.events.push({ t: 'revive', id: g.id });
    this.events.push({ t: 'fx', kind: 'heal', tiles: [mid(g)] });
    this.log(`${g.name} vuelve a levantarse, algo más débil.`, '#ff9c8a');
  }

  /** El feto llama a cualquier criatura del mundo, menos a los arcángeles; a veces, hasta a un jefe (más débil). */
  private summonFrom(b: Actor) {
    if (this.actors.filter((a) => a.alive && a.summoned).length >= WARD.summonMax) return;
    const all = Object.values(MONSTERS).filter((m: MonsterDef) => !m.ward && !NO_SUMMON.has(m.id));
    const bosses = all.filter((m) => m.boss);
    const pick = this.rng.chance(0.2) && bosses.length ? this.rng.pick(bosses) : this.rng.pick(all.filter((m) => !m.boss));
    const [w, h] = pick.size ?? [1, 1];
    const c = mid(b);
    const spot = this.spotFor(c.x + this.rng.int(-8, 8), c.y + this.rng.int(-6, 6), w, h);
    if (!spot) return;
    const e = this.makeMonster(pick.id, b.level - (pick.boss ? 6 : 3), spot.x, spot.y);
    if (pick.boss) {
      e.maxHp = e.hp = Math.round(e.maxHp * 0.35);
      e.atk = Math.round(e.atk * 0.5);
      e.mag = Math.round(e.mag * 0.5);
      e.boss = false;
      e.elite = true;
    }
    // Sirve al feto: sin bando (no se pelea con los capitanes) y da poca experiencia.
    Object.assign(e, { summoned: true, faction: undefined, alert: 10, xp: Math.round((e.xp ?? 0) * 0.3) });
    this.actors.push(e);
    this.events.push({ t: 'revive', id: e.id });
    this.events.push({ t: 'fx', kind: 'luz', tiles: [mid(e)] });
    this.sfx('boss');
    this.log(`El feto abre la boca sin sonido... y del vacío sale ${e.name}.`, '#fff2b0');
  }

  private placeQuestContent() {
    for (const [qid, qs] of Object.entries(this.state.quests)) {
      if (qs.status !== 'active' || !questMemberHere(this.state, QUEST_BY_ID[qid])) continue;
      const o = QUEST_BY_ID[qid].objective;
      if (o.kind === 'rescue' && o.dungeon === this.def.id && o.floor === this.floor) {
        const pos = this.randomRoomTile({ awayFrom: this.leader, minDist: 10 });
        if (pos) {
          this.actors.push({
            id: this.nextId++, side: 'npc', name: o.npc, sprite: 'p_npc', ...pos, fx: 0, fy: 1, element: 'neutral', level: 1,
            hp: 1, maxHp: 1, sp: 0, maxSp: 0, atk: 0, def: 0, mag: 0, res: 0, statuses: {}, skills: [], alive: true, alert: 0, hpAcc: 0, rescueQuest: qid,
          });
          this.log('Sientes a alguien atrapado en este piso.', '#9fd7ff');
        }
      }
      if (o.kind === 'collect' && o.dungeon === this.def.id && qs.progress < o.count) {
        for (let i = 0; i < this.rng.int(1, 2); i++) {
          const pos = this.randomRoomTile();
          if (pos) this.items.push({ ...pos, id: o.item, qty: 1 });
        }
      }
    }
  }

  private banter() {
    if (!this.rng.chance(0.45)) return;
    const ids = this.party.map((a) => a.memberId!);
    const options = BANTER.filter((b) => b.members.every((m) => ids.includes(m)));
    if (!options.length) return;
    for (const l of this.rng.pick(options).lines) this.log(`${SPEAKERS[l.who].name}: «${l.text}»`, '#b9a6d8');
  }

  // ---------------------------------------------------------------- visión

  updateFov(): void {
    const m = this.map;
    const L = this.leader;
    this.visible.fill(0);
    const room = m.roomAt[L.y * m.w + L.x];
    const mark = (x: number, y: number) => {
      if (x >= 0 && y >= 0 && x < m.w && y < m.h) this.visible[y * m.w + x] = 1;
    };
    // En la niebla no se ve la sala entera, solo lo que está al lado.
    const fog = this.terrainAt(L.x, L.y) === 'niebla';
    if (room >= 0 && !fog) {
      const r = room >= SECRET_BASE ? m.secrets[room - SECRET_BASE] : m.rooms[room];
      for (let y = r.y - 1; y <= r.y + r.h; y++) for (let x = r.x - 1; x <= r.x + r.w; x++) mark(x, y);
    }
    const rad = fog ? 1 : 2;
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) mark(L.x + dx, L.y + dy);
    for (let i = 0; i < this.visible.length; i++) if (this.visible[i]) this.explored[i] = 1;
    for (const w of this.watchers) if (this.visible[w.y * m.w + w.x]) w.watcher!.seen = true;
    // Aren siente las escaleras cuando están cerca.
    const si = this.stairs.y * m.w + this.stairs.x;
    if (!this.explored[si] && cheb(L, this.stairs) <= 8 && this.has('aren')) {
      this.explored[si] = 1;
      this.log('Aren se detiene: «Las escaleras... están cerca. Por allí.»', '#9fd7ff');
    }
  }

  revealMap(): void {
    for (let i = 0; i < this.explored.length; i++) if (this.map.tiles[i]) this.explored[i] = 1;
  }

  private sees(e: Actor, t: Actor): boolean {
    const d = cheb(e, t);
    if (d > 8 || this.hiddenIn(t, e)) return false;
    // Desde la niebla solo se ve lo que está al lado.
    if (this.terrainAt(e.x, e.y) === 'niebla' && d > 1) return false;
    const m = this.map;
    const re = m.roomAt[e.y * m.w + e.x];
    const rt = m.roomAt[t.y * m.w + t.x];
    return d <= 2 || (re >= 0 && re === rt);
  }

  // ---------------------------------------------------------------- combate

  private eff(a: Actor, stat: 'atk' | 'def' | 'mag' | 'res'): number {
    let v = a[stat];
    if ((stat === 'atk' || stat === 'mag') && a.statuses.atk_up) v *= 1.4;
    if ((stat === 'def' || stat === 'res') && a.statuses.def_up) v *= 1.4;
    if ((stat === 'def' || stat === 'res') && a.statuses.def_down) v *= 0.6;
    if (a.memberId && this.bonus[a.memberId]) v *= 1 + this.bonus[a.memberId][stat] / 100;
    return v;
  }

  private damageRoll(att: Actor, def: Actor, power: number, kind: 'phys' | 'mag', element: Element, critBonus = 0) {
    const a = this.eff(att, kind === 'phys' ? 'atk' : 'mag');
    const d = this.eff(def, kind === 'phys' ? 'def' : 'res');
    const mult = elementMultiplier(element, def.element);
    let dmg = ((a * power) / 10) * (100 / (100 + 4 * d)) * mult;
    if (element !== 'neutral' && element === att.element) dmg *= 1.15;
    dmg *= (1 + (att.boost?.[element] ?? 0)) * (1 - (def.resist?.[element] ?? 0));
    // Agua: quien está dentro es vulnerable; los seres de agua pegan más fuerte desde ella.
    if (this.terrainAt(def.x, def.y) === 'agua' && def.element !== 'agua') dmg *= 1.3;
    if (this.terrainAt(att.x, att.y) === 'agua' && att.element === 'agua') dmg *= 1.2;
    const crit = this.rng.chance(0.06 + critBonus + (att.memberId ? (this.bonus[att.memberId]?.crit ?? 0) / 100 : 0));
    if (crit) dmg *= 1.5;
    dmg *= 0.9 + this.rng.next() * 0.2;
    return { amount: Math.max(1, Math.round(dmg)), crit, mult };
  }

  private hit(att: Actor, t: Actor, power: number, kind: 'phys' | 'mag', element: Element, critBonus = 0): number {
    // Afinidad: la pareja que está al lado puede encajar el golpe.
    if (att.side === 'enemy' && t.memberId) {
      const cover = this.bondPairs.find((p) => (p.a === t.memberId || p.b === t.memberId) && p.cover && this.rng.chance(p.cover));
      const mate = cover && this.party.find((m) => m.memberId === (cover.a === t.memberId ? cover.b : cover.a) && cheb(m, t) <= 1 && m.hp > m.maxHp * 0.25);
      if (mate) {
        this.log(`¡${mate.name} se pone delante de ${t.name}!`, '#ffd27a');
        this.events.push({ t: 'float', id: mate.id, text: 'CUBRE', color: '#ffd27a' });
        t = mate;
        power *= 0.7;
      }
    }
    if (this.warded(t)) {
      this.events.push({ t: 'float', id: t.id, text: 'Inmune', color: '#fff2b0' });
      this.sfx('miss');
      this.log(`${t.name} no recibe daño: mientras quede un capitán en pie, nada lo toca.`, '#fff2b0');
      return 0;
    }
    const r = this.damageRoll(att, t, power, kind, element, critBonus);
    let note = '';
    if (r.mult > 1) note = ' ¡Muy eficaz!';
    else if (r.mult < 1) note = ' Poco eficaz...';
    if (r.crit) note += ' ¡Crítico!';
    this.log(`${t.name} recibe ${r.amount} de daño.${note}`, t.side === 'party' ? '#ff9c8a' : undefined);
    this.sfx(r.crit ? 'crit' : t.side === 'party' ? 'hurt' : 'hit');
    this.events.push({ t: 'damage', id: t.id, amount: r.amount, crit: r.crit, mult: r.mult });
    this.applyDamage(t, r.amount, att);
    return r.amount;
  }

  private applyDamage(t: Actor, amount: number, src?: Actor) {
    if (this.warded(t)) return;
    t.hp -= amount;
    if (t.hp <= 0) this.kill(t, src);
  }

  private heal(t: Actor, amount: number) {
    const before = t.hp;
    t.hp = Math.min(t.maxHp, t.hp + amount);
    const n = t.hp - before;
    this.events.push({ t: 'heal', id: t.id, amount: n });
    this.log(`${t.name} recupera ${n} de vida.`, '#8fe39a');
  }

  private addStatus(t: Actor, id: StatusId, turns: number) {
    if (t.immune?.includes(id)) {
      this.events.push({ t: 'float', id: t.id, text: 'Inmune', color: '#bbbbbb' });
      this.log(`${t.name} es inmune a ${STATUSES[id].name.toLowerCase()}.`);
      return;
    }
    t.statuses[id] = Math.max(t.statuses[id] ?? 0, turns);
    const st = STATUSES[id];
    this.events.push({ t: 'float', id: t.id, text: st.short, color: st.color });
    this.log(`${t.name}: ${st.name}.`, st.color);
  }

  private basicAttack(a: Actor, t: Actor) {
    this.face(a, t);
    this.events.push({ t: 'bump', id: a.id, dx: a.fx, dy: a.fy });
    if (this.rng.chance(0.08)) {
      this.events.push({ t: 'miss', id: t.id });
      this.sfx('miss');
      this.log(`${a.name} ataca, pero falla.`);
      return;
    }
    this.log(`${a.name} ataca.`);
    this.events.push({ t: 'fx', kind: 'neutral', tiles: [mid(t)] });
    this.hit(a, t, 10, 'phys', 'neutral');
    // Afinidad: la pareja que está pegada al mismo enemigo remata.
    if (a.memberId && t.alive && !this.comboing) {
      for (const p of this.bondPairs) {
        if ((p.a !== a.memberId && p.b !== a.memberId) || !p.followup || !this.rng.chance(p.followup)) continue;
        const mate = this.party.find((m) => m.memberId === (p.a === a.memberId ? p.b : p.a) && this.canReach(m, t));
        if (!mate) continue;
        this.comboing = true;
        this.log(`¡Combo de ${a.name} y ${mate.name}!`, '#ffd27a');
        this.face(mate, t);
        this.events.push({ t: 'bump', id: mate.id, dx: mate.fx, dy: mate.fy });
        this.hit(mate, t, 8, 'phys', 'neutral');
        this.comboing = false;
        break;
      }
    }
  }

  private kill(t: Actor, src?: Actor) {
    if (t.side === 'party' && bagCount(this.state, 'semilla_vida') > 0) {
      removeFromBag(this.state, 'semilla_vida');
      t.hp = Math.round(t.maxHp * 0.5);
      this.log(`¡La Semilla de vida revive a ${t.name}!`, '#8fe39a');
      this.events.push({ t: 'heal', id: t.id, amount: t.hp });
      this.sfx('heal');
      return;
    }
    t.alive = false;
    t.hp = 0;
    this.events.push({ t: 'death', id: t.id });
    this.sfx('death');
    if (t.escort) {
      // La escolta muere: las escaleras se abren, pero cae una maldición sobre el grupo.
      this.stats.escortsLost++;
      this.curse = 3;
      this.log(`${t.name} ha muerto... Una maldición sella vuestras habilidades este piso y los dos siguientes.`, '#c070ff');
      this.actors = this.actors.filter((a) => a !== t);
      if (this.goal && !this.goal.done) {
        this.goal.failed = true;
        this.goalDone();
      }
      return;
    }
    if (t.side === 'party') {
      this.stats.fallen++;
      if (t === this.protag) {
        this.log(`${t.name} ha caído...`, '#ff5050');
        this.result = 'death';
      } else {
        this.log(`${t.name} ha caído. Volverá al gremio al salir.`, '#ff7070');
        if (t.memberId === this.leaderMember) {
          this.leaderMember = 'aren';
          this.log(`${this.protag.name} vuelve a tomar el mando.`, '#9fd7ff');
          this.events.push({ t: 'leader', id: this.protag.id });
          this.updateFov();
        }
      }
      return;
    }
    this.log(`${t.name} es derrotado.`, '#d8c89a');
    this.state.bestiary[t.monsterId!] = (this.state.bestiary[t.monsterId!] ?? 0) + 1;
    this.stats.kills++;
    if (t.guard) this.guardDown();
    if (t.golden) {
      this.stats.golden++;
      const gold = this.rng.int(60, 100) * this.def.difficulty;
      this.log(`¡${t.name} estalla en monedas! Suelta un buen botín.`, '#ffe060');
      this.sfx('levelup');
      const drops = [{ id: 'gold', qty: gold }, { id: this.rng.pick(['semilla_vida', 'elixir', 'pocion_mayor', 'lagrima_alba', 'bomba']), qty: 1 }];
      if (this.def.materials?.length) drops.push({ id: this.rng.pick(this.def.materials), qty: 2 });
      for (const d of drops) {
        const spot = d === drops[0] ? { x: t.x, y: t.y } : this.freeNear(t.x, t.y);
        if (spot && !this.items.some((i) => i.x === spot.x && i.y === spot.y)) this.items.push({ ...spot, ...d });
      }
    }
    const g = this.goal;
    if (g && !g.done && !t.reaper) {
      if (g.kind === 'caza') {
        g.have++;
        if (g.have >= g.need) this.goalDone();
        else if (g.need - g.have <= 2) this.log(`El sello de sangre se debilita (${g.have}/${g.need}).`, '#ffd27a');
      } else if (g.kind === 'alfa' && t.elite) this.goalDone();
    }
    if ((src?.side === 'party' || t.statuses.veneno || t.statuses.quemado) && !this.def.practice) {
      for (const p of this.party) this.giveXp(p, t.xp ?? 0);
      this.xpEarned += t.xp ?? 0;
    }
    for (const q of this.def.practice ? [] : onKill(this.state, this.def.id, t.monsterId!)) {
      this.log(`Misión cumplida: ${q.name}. Entrégala en el tablón.`, '#c9a24a');
      this.events.push({ t: 'quest', name: q.name });
    }
    if (t.reaper) {
      this.stats.reaper++;
      this.log('La Parca se deshace en ceniza. Por ahora, el piso es vuestro.', '#c9a24a');
      this.sfx('boss');
      this.items.push({ x: t.x, y: t.y, id: 'cristal_hondonada', qty: 3 });
    } else if (t.boss) {
      // Al caer el feto, sus capitanes y sus invocaciones se deshacen con él.
      if (t.ward) {
        for (const o of this.actors) {
          if (!o.alive || !(o.guard || o.summoned)) continue;
          o.alive = false;
          o.hp = 0;
          this.events.push({ t: 'death', id: o.id });
        }
        this.log('Sin el feto, los capitanes y todo lo que invocó se deshacen en luz.', '#fff2b0');
      }
      this.items.push({ x: t.x, y: t.y, id: 'cristal_hondonada', qty: 1 });
      this.sfx('boss');
      // Con varios jefes a la vez (desfile), las escaleras se abren al caer el último.
      if (this.actors.some((a) => a.alive && a.boss)) this.log(`${t.name} cae, pero aún quedan jefes en pie.`, '#ffd27a');
      else {
        this.openStairs();
        this.log('El núcleo queda expuesto. Se abren unas escaleras de salida.', '#c9a24a');
      }
    } else if (!this.items.some((i) => i.x === t.x && i.y === t.y)) {
      const ing = MONSTERS[t.monsterId!].drops?.find((d) => this.rng.chance(d.chance));
      if (ing) this.items.push({ x: t.x, y: t.y, id: ing.id, qty: 1 });
      else if (this.rng.chance(0.1)) this.items.push({ x: t.x, y: t.y, id: this.rng.weighted(this.def.items.filter((i) => i.id !== 'gold')).id, qty: 1 });
    }
  }

  private giveXp(a: Actor, amount: number) {
    const r = gainXp(this.state, a.memberId!, Math.round(amount * (1 + (this.bonus[a.memberId!]?.xp ?? 0) / 100)));
    if (!r.levels) return;
    this.refreshMember(a);
    this.sfx('levelup');
    this.events.push({ t: 'float', id: a.id, text: 'NIVEL+', color: '#ffe680' });
    this.log(`¡${a.name} sube al nivel ${a.level}!`, '#ffe680');
    for (const s of r.learned) {
      this.log(`${a.name} aprende ${SKILLS[s].name}.`, '#ffe680');
      this.events.push({ t: 'learn', id: a.id, skill: s, auto: true });
    }
    for (const s of r.pending) this.events.push({ t: 'learn', id: a.id, skill: s });
  }

  // ---------------------------------------------------------------- habilidades

  private traceLine(user: Actor, dx: number, dy: number, range: number) {
    let { x, y } = this.origin(user, dx, dy);
    for (let i = 0; i < range; i++) {
      if (!this.passable(x + dx, y + dy) || this.diagBlocked(x, y, dx, dy)) break;
      x += dx;
      y += dy;
      const a = this.actorAt(x, y);
      if (a && this.isFoe(user, a)) return { hit: a, end: { x, y } };
      // Las raíces frenan flechas y proyectiles.
      if (this.terrainAt(x, y) === 'raices') break;
    }
    return { hit: undefined, end: { x, y } };
  }

  private skillTargets(user: Actor, sk: SkillDef, dx: number, dy: number): { targets: Actor[]; end?: { x: number; y: number } } {
    const allies = this.actors.filter((a) => a.alive && a.side === user.side);
    const foes = this.actors.filter((a) => a.alive && this.isFoe(user, a));
    switch (sk.target) {
      case 'front': {
        const o = this.origin(user, dx, dy);
        const t = this.actorAt(o.x + dx, o.y + dy);
        return { targets: t && this.isFoe(user, t) && this.canReach(user, t) ? [t] : [] };
      }
      case 'line': {
        const r = this.traceLine(user, dx, dy, sk.range ?? 5);
        return { targets: r.hit ? [r.hit] : [], end: r.end };
      }
      case 'around':
        return { targets: foes.filter((f) => this.canReach(user, f)) };
      case 'area':
        return {
          targets: foes.filter((f) => cheb(user, f) <= (sk.range ?? 2) && (user.side !== 'party' || this.actorVisible(f))),
        };
      case 'self':
        return { targets: [user] };
      case 'party':
        return { targets: allies.filter((a) => cheb(user, a) <= (sk.range ?? 5)) };
      case 'ally': {
        const near = allies.filter((a) => cheb(user, a) <= (sk.range ?? 5));
        near.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
        return { targets: near.slice(0, 1) };
      }
    }
  }

  private performSkill(user: Actor, sk: SkillDef, dx: number, dy: number) {
    user.sp -= sk.cost;
    if (dx || dy) {
      user.fx = dx;
      user.fy = dy;
    }
    this.log(`${user.name} usa ${sk.name}.`, user.side === 'party' ? '#d8d0ff' : '#ffb0a0');
    // Un monstruo de otro color usa sus habilidades con su elemento.
    if (user.variant && sk.element !== 'neutral' && (sk.kind === 'phys' || sk.kind === 'mag')) sk = { ...sk, element: user.element };
    const { targets, end } = this.skillTargets(user, sk, dx, dy);
    const color = ELEMENTS[sk.element].color;
    if (sk.target === 'front' || sk.target === 'around') this.events.push({ t: 'bump', id: user.id, dx: user.fx, dy: user.fy });
    const o = this.origin(user, user.fx, user.fy);
    if (sk.target === 'line' && end) this.events.push({ t: 'projectile', x0: o.x, y0: o.y, x1: end.x, y1: end.y, color });
    if (sk.target === 'area' || sk.target === 'around') for (const t of targets) this.events.push({ t: 'flash', ...mid(t), color });
    this.sfx(sk.kind === 'heal' ? 'heal' : sk.kind === 'buff' ? 'buff' : sk.kind === 'mag' ? 'magic' : 'hit');
    // Efecto visual: el del elemento al atacar, cruces al curar, flechas al mejorar o empeorar.
    const fxKind = sk.kind === 'heal' ? 'heal' : sk.kind === 'buff' ? 'buff' : sk.kind === 'debuff' ? 'debuff' : sk.element;
    const fxTiles = targets.length ? targets.map((t) => mid(t)) : end ? [end] : [];
    if (fxTiles.length) this.events.push({ t: 'fx', kind: fxKind, tiles: fxTiles });
    if (!targets.length && OFFENSIVE.has(sk.kind)) {
      this.log('...pero no alcanza a nadie.');
      return;
    }
    for (const t of targets) {
      if (!t.alive) continue;
      if (sk.kind === 'phys' || sk.kind === 'mag') {
        const dealt = this.hit(user, t, sk.power, sk.kind, sk.element, sk.crit ?? 0);
        if (sk.drain && user.alive) this.heal(user, Math.round(dealt * sk.drain));
        if (sk.status && t.alive && this.rng.chance(sk.status.chance)) this.addStatus(t, sk.status.id, sk.status.turns);
        // La magia de fuego a veces deja quemaduras (la del grupo, la de los jefes y la de los monstruos de fuego de verdad).
        else if (sk.element === 'fuego' && sk.kind === 'mag' && t.alive && !user.variant && this.rng.chance(user.side === 'party' || user.boss ? 0.25 : 0.12)) this.addStatus(t, 'quemado', 3);
      } else if (sk.kind === 'heal') {
        this.heal(t, Math.round((sk.power / 100) * t.maxHp + user.mag * 0.8));
        if (sk.cure) {
          delete t.statuses.veneno;
          delete t.statuses.quemado;
        }
      } else if (sk.status && this.rng.chance(sk.status.chance)) {
        this.addStatus(t, sk.status.id, sk.status.turns);
      } else if (sk.kind === 'debuff') {
        this.log(`${t.name} resiste.`);
      }
    }
  }

  // ---------------------------------------------------------------- acciones del líder

  /** Devuelve true si la acción consumió turno. */
  leaderMove(dx: number, dy: number): boolean {
    if (this.result) return false;
    const L = this.leader;
    L.fx = dx;
    L.fy = dy;
    if (this.leaderStunned()) return true;
    const nx = L.x + dx;
    const ny = L.y + dy;
    // Las puertas se abren chocando con ellas (también en diagonal si la esquina no es pared).
    const wallCorner = dx !== 0 && dy !== 0 && (!isFloor(this.map, L.x + dx, L.y) || !isFloor(this.map, L.x, L.y + dy));
    if (isFloor(this.map, nx, ny) && this.doors.has(ny * this.map.w + nx) && !wallCorner) return this.tryDoor(nx, ny);
    // Cajas: solo se empujan de frente (no en diagonal).
    if (this.boxSet.has(ny * this.map.w + nx)) {
      if (dx && dy) {
        this.log('Las cajas solo se empujan de frente.', '#c8b8a0');
        return false;
      }
      if (!this.pushBox(nx, ny, dx, dy)) return false;
    }
    if (!this.passable(nx, ny) || this.diagBlocked(L.x, L.y, dx, dy)) {
      const sp = this.map.special.get(ny * this.map.w + nx);
      if (sp === 'crack') this.log('La pared está agrietada. Golpéala (Espacio) para abrir paso.', '#c8b8a0');
      else if (sp === 'hard') this.log('Una muralla reforzada. Con un golpe no basta: haría falta una bomba.', '#ffb060');
      return false;
    }
    const other = this.actorAt(nx, ny);
    if (other?.side === 'enemy') {
      this.basicAttack(L, other);
    } else if (other?.side === 'npc') {
      if (other.watcher) {
        this.log('El gólem no se inmuta. Mejor que no te vea.', '#c8b8a0');
        return false;
      }
      if (other.event) {
        this.openEvent(other);
        return true;
      }
      if (other.shop) this.talkShop(other);
      else this.rescue(other);
    } else {
      if (this.stuckInMud(L)) {
        this.log('Te cuesta sacar los pies del barro...', '#a08060');
        this.afterLeader();
        return true;
      }
      if (other) {
        other.x = L.x;
        other.y = L.y;
        this.events.push({ t: 'move', id: other.id, x: other.x, y: other.y });
      }
      L.x = nx;
      L.y = ny;
      this.events.push({ t: 'move', id: L.id, x: nx, y: ny });
      this.afterStep(L, dx, dy);
      this.pickup();
      this.checkTrap(L);
      this.checkGoalSpot();
      this.checkTheft();
      this.checkSign();
      const ter = this.terrainAt(L.x, L.y);
      if (ter && !this.terrainSeen.has(ter)) {
        this.terrainSeen.add(ter);
        this.log(TERRAIN[ter].desc, TERRAIN[ter].color);
      }
      this.steppedOnStairs = this.stairsOpen && L.x === this.stairs.x && L.y === this.stairs.y;
    }
    this.afterLeader();
    return true;
  }

  leaderAttack(): boolean {
    if (this.result) return false;
    const L = this.leader;
    if (this.leaderStunned()) return true;
    const t = this.actorAt(L.x + L.fx, L.y + L.fy);
    const front = (L.y + L.fy) * this.map.w + L.x + L.fx;
    const wall = this.map.special.get(front);
    if (t && this.isFoe(L, t) && this.canReach(L, t)) this.basicAttack(L, t);
    else if (wall === 'crack' && !this.diagBlocked(L.x, L.y, L.fx, L.fy)) {
      this.events.push({ t: 'bump', id: L.id, dx: L.fx, dy: L.fy });
      this.breakWall(front);
    } else if (wall === 'hard' && !this.diagBlocked(L.x, L.y, L.fx, L.fy) && (L.memberId === 'bram' || this.party.some((a) => a.memberId === 'bram' && cheb(a, L) <= 1))) {
      // Bram: la muralla cae a martillazos.
      this.events.push({ t: 'bump', id: L.id, dx: L.fx, dy: L.fy });
      const n = (this.hardHits.get(front) ?? 0) + 1;
      this.hardHits.set(front, n);
      this.sfx('hit');
      if (n >= 3) this.breakWall(front);
      else this.log(`Bram aporrea la muralla con su martillo (${n}/3).`, '#ffb060');
    } else {
      this.events.push({ t: 'bump', id: L.id, dx: L.fx, dy: L.fy });
      this.sfx('miss');
      if (wall === 'hard') this.log('La muralla ni se inmuta. Haría falta una bomba (o el martillo de Bram).', '#ffb060');
    }
    this.afterLeader();
    return true;
  }

  /**
   * ¿Se puede llegar a pie desde `from` a las escaleras, resbalando en el hielo?
   * Las grietas cuentan como paso (se rompen de un golpe) y se ignoran monstruos y aliados.
   */
  stairsReachable(from: { x: number; y: number }): boolean {
    const m = this.map;
    const W = m.w;
    const open = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < m.h && (m.tiles[y * W + x] === FLOOR || m.special.get(y * W + x) === 'crack');
    const floor = (x: number, y: number) => isFloor(m, x, y);
    const ice = (x: number, y: number) => terrainOfCode(m.terrain[y * W + x]) === 'hielo';
    const corners = (x: number, y: number, dx: number, dy: number) => !dx || !dy || (floor(x + dx, y) && floor(x, y + dy));
    const goal = this.stairs.y * W + this.stairs.x;
    const seen = new Uint8Array(W * m.h);
    const q = [from.y * W + from.x];
    seen[q[0]] = 1;
    for (let qi = 0; qi < q.length; qi++) {
      const cur = q[qi];
      if (cur === goal) return true;
      const cx = cur % W;
      const cy = Math.floor(cur / W);
      for (const d of DIRS8) {
        let x = cx + d.dx;
        let y = cy + d.dy;
        if (!open(x, y) || !corners(cx, cy, d.dx, d.dy)) continue;
        while (ice(x, y) && floor(x + d.dx, y + d.dy) && corners(x, y, d.dx, d.dy)) {
          x += d.dx;
          y += d.dy;
        }
        const i = y * W + x;
        if (!seen[i]) {
          seen[i] = 1;
          q.push(i);
        }
      }
    }
    return false;
  }

  /** Quita el hielo de salas al azar hasta que las escaleras sean alcanzables. */
  private fixIce(start: { x: number; y: number }) {
    const m = this.map;
    const code = terrainCode('hielo');
    for (let guard = 0; guard < 30 && !this.stairsReachable(start); guard++) {
      const withIce = m.rooms.map((_, ri) => ri).filter((ri) => m.terrain.some((c, i) => c === code && m.roomAt[i] === ri));
      if (!withIce.length) return;
      const ri = this.rng.pick(withIce);
      for (let i = 0; i < m.terrain.length; i++) if (m.terrain[i] === code && m.roomAt[i] === ri) m.terrain[i] = 0;
    }
  }

  /** Rompe una grieta o una muralla: pasa a ser suelo. */
  private breakWall(i: number) {
    const kind = this.map.special.get(i);
    if (!kind) return;
    this.map.special.delete(i);
    this.map.tiles[i] = FLOOR;
    const x = i % this.map.w;
    const y = Math.floor(i / this.map.w);
    this.events.push({ t: 'wall', x, y });
    this.events.push({ t: 'flash', x, y, color: kind === 'hard' ? '#ffb060' : '#c8b8a0' });
    this.sfx('crit');
    if (kind === 'hard') this.log('¡La muralla se derrumba! Detrás hay una sala secreta.', '#ffe680');
    else this.log('La pared agrietada se viene abajo. ¡Un atajo!', '#c8b8a0');
    this.updateFov();
  }

  leaderSkill(index: number): boolean {
    if (this.result) return false;
    const L = this.leader;
    const sid = L.skills[index];
    if (!sid) return false;
    if (this.skillsSealed(L)) {
      this.log('La ceniza ahoga tu energía: aquí no puedes usar habilidades.', '#9a9aa8');
      return false;
    }
    const sk = SKILLS[sid];
    if (L.sp < sk.cost) {
      this.log('No tienes energía suficiente.', '#ff9c8a');
      return false;
    }
    if (this.leaderStunned()) return true;
    this.performSkill(L, sk, L.fx, L.fy);
    this.afterLeader();
    return true;
  }

  /**
   * Cambia de líder a otro miembro vivo. No gasta turno: el nuevo líder actúa ya.
   * Sirve, por ejemplo, para poner delante a alguien sano y apartar a Aren si va mal.
   */
  switchLeader(actorId: number): boolean {
    const a = this.party.find((p) => p.id === actorId);
    if (!a || a === this.leader || this.result) return false;
    this.leaderMember = a.memberId!;
    this.steppedOnStairs = false;
    this.log(`${a.name} pasa a liderar el grupo.`, '#9fd7ff');
    this.events.push({ t: 'leader', id: a.id });
    this.updateFov();
    return true;
  }

  leaderWait(): boolean {
    if (this.result) return false;
    this.afterLeader();
    return true;
  }

  descend(): void {
    this.steppedOnStairs = false;
    if (this.isLastFloor) {
      this.result = 'clear';
      return;
    }
    // Fin del tramo: se pasa al siguiente sin salir de la incursión.
    if (!this.def.infinite && this.floor >= this.def.floors && this.def.next) {
      const prev = this.def.name;
      this.def = DUNGEONS[this.def.next];
      this.log(`Dejáis atrás ${prev}. Empieza ${this.def.name}.`, '#c9a24a');
      this.startFloor(1);
      return;
    }
    this.startFloor(this.floor + 1);
  }

  /** Abandonar una mazmorra de prueba desde el campamento. */
  exitTower(): void {
    this.steppedOnStairs = false;
    this.result = 'clear';
  }

  // ---------------------------------------------------------------- campamento

  /** Descanso del campamento: vida y energía al máximo, sin estados, y los caídos vuelven con media vida. */
  campRest(): string[] {
    const out: string[] = [];
    for (const a of this.actors) {
      if (a.side !== 'party') continue;
      if (!a.alive) {
        a.alive = true;
        a.hp = Math.ceil(a.maxHp / 2);
        out.push(`${a.name} se recupera y vuelve al grupo.`);
      } else a.hp = a.maxHp;
      a.sp = a.maxSp;
      a.statuses = {};
    }
    out.unshift('El grupo descansa junto al fuego. Vida y energía al máximo.');
    return out;
  }

  campPrice(itemId: string): number {
    return Math.ceil((ITEMS[itemId].price * CAMP_MARKUP * (this.has('seren') ? 0.85 : 1)) / 5) * 5;
  }

  /** Comprar al mercader del campamento. Devuelve el motivo si no se puede. */
  campBuy(itemId: string): string | null {
    const price = this.campPrice(itemId);
    if (this.state.gold < price) return 'No tienes oro suficiente.';
    if (!addToBag(this.state, itemId, 1)) return 'La bolsa está llena.';
    this.state.gold -= price;
    return null;
  }

  private tryDoor(x: number, y: number): boolean {
    const color = this.doors.get(y * this.map.w + x)!;
    const c = LOCK_BY_ID[color];
    const k = this.keys.indexOf(color);
    if (k < 0) {
      this.log(`Puerta cerrada con candado ${c.name}. Busca la llave ${c.name} en este piso.`, c.color);
      return false;
    }
    this.keys.splice(k, 1);
    for (const [i, col] of [...this.doors]) if (col === color) this.doors.delete(i);
    this.events.push({ t: 'door' });
    this.sfx('pickup');
    this.log(`Abres las puertas con candado ${c.name}.`, c.color);
    this.afterLeader();
    return true;
  }

  /** Casilla de sala al azar, alcanzable a pie desde `from` con las puertas actuales y a distancia >= minDist. */
  /** ¿Quitar esta casilla deja sin camino a alguna otra (es un paso obligado)? */
  private isChokepoint(from: { x: number; y: number }, p: { x: number; y: number }): boolean {
    const count = (blocked: number) => {
      const W = this.map.w;
      const seen = new Uint8Array(W * this.map.h);
      const q = [from.y * W + from.x];
      seen[q[0]] = 1;
      if (blocked >= 0) seen[blocked] = 1;
      let n = 0;
      while (q.length) {
        const cur = q.pop()!;
        n++;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = (cur % W) + dx;
          const ny = ((cur / W) | 0) + dy;
          const ni = ny * W + nx;
          if (this.passable(nx, ny) && !seen[ni]) {
            seen[ni] = 1;
            q.push(ni);
          }
        }
      }
      return n;
    };
    return count(p.y * this.map.w + p.x) < count(-1) - 1;
  }

  private reachableTile(from: { x: number; y: number }, minDist: number): { x: number; y: number } | null {
    const m = this.map;
    const W = m.w;
    const seen = new Uint8Array(W * m.h);
    const q = [from.y * W + from.x];
    seen[q[0]] = 1;
    const out: number[] = [];
    while (q.length) {
      const cur = q.pop()!;
      const cx = cur % W;
      const cy = (cur / W) | 0;
      const onStairs = cx === this.stairs.x && cy === this.stairs.y;
      if (m.roomAt[cur] >= 0 && !onStairs && cheb(from, { x: cx, y: cy }) >= minDist && !this.actorAt(cx, cy)) out.push(cur);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx;
        const ny = cy + dy;
        const ni = ny * W + nx;
        if (this.passable(nx, ny) && !seen[ni]) {
          seen[ni] = 1;
          q.push(ni);
        }
      }
    }
    if (!out.length) return null;
    const t = this.rng.pick(out);
    return { x: t % W, y: (t / W) | 0 };
  }

  // ---------------------------------------------------------------- trampas

  private checkTrap(a: Actor) {
    if (a.side !== 'party' || !a.alive) return;
    const trap = this.traps.get(a.y * this.map.w + a.x);
    if (!trap) return;
    const def = TRAPS[trap.id];
    trap.revealed = true;
    this.events.push({ t: 'trap', x: a.x, y: a.y, color: def.color });
    if (trap.id === 'hoyo' && a !== this.leader) {
      this.log(`${a.name} esquiva un hoyo.`);
      return;
    }
    this.log(`¡${a.name} activa: ${def.name}!`, def.color);
    this.sfx('hurt');
    switch (trap.id) {
      case 'pinchos': {
        const n = Math.max(5, Math.round(a.maxHp * 0.12));
        this.events.push({ t: 'damage', id: a.id, amount: n, crit: false, mult: 1 });
        this.applyDamage(a, n);
        break;
      }
      case 'veneno':
        this.addStatus(a, 'veneno', 8);
        break;
      case 'aturdidora':
        this.addStatus(a, 'aturdido', 2);
        break;
      case 'debilidad':
        this.addStatus(a, 'def_down', 10);
        break;
      case 'sello':
        a.sp = Math.max(0, a.sp - 8);
        this.events.push({ t: 'float', id: a.id, text: '-8E', color: '#4aa8ff' });
        break;
      case 'hambre':
        this.belly = Math.max(0, this.belly - 15);
        this.log('Parte de las provisiones se pudre.', '#e8903a');
        break;
      case 'teletransporte': {
        // Solo a sitios a los que se puede llegar andando desde aquí: con candados, el grupo podría quedar encerrado.
        const pos = this.reachableTile(a, 8);
        if (pos) {
          this.events.push({ t: 'flash', x: a.x, y: a.y, color: def.color });
          a.x = pos.x;
          a.y = pos.y;
          this.events.push({ t: 'warp', id: a.id, x: a.x, y: a.y });
          this.log(`${a.name} desaparece y aparece en otra parte del piso.`, def.color);
          if (a === this.leader) this.updateFov();
        }
        break;
      }
      case 'alarma': {
        for (let i = 0; i < 3; i++) {
          const spot = this.freeNear(a.x + this.rng.int(-3, 3), a.y + this.rng.int(-3, 3));
          if (!spot) continue;
          const pool = this.monsterPool();
          const m = this.makeMonster(this.rng.weighted(pool).id, this.monsterLevel(), spot.x, spot.y);
          m.alert = 10;
          m.lastSeen = { x: a.x, y: a.y };
          this.actors.push(m);
        }
        this.log('¡Un chirrido atraviesa el piso! Llegan monstruos.', '#ff4a4a');
        break;
      }
      case 'explosion':
        for (const p of this.party.filter((p) => cheb(p, a) <= 1)) {
          const n = Math.max(6, Math.round(p.maxHp * 0.15));
          this.events.push({ t: 'flash', x: p.x, y: p.y, color: def.color });
          this.events.push({ t: 'damage', id: p.id, amount: n, crit: false, mult: 1 });
          this.applyDamage(p, n);
        }
        break;
      case 'hoyo':
        this.pendingFall = true;
        break;
    }
  }

  useItem(itemId: string, targetId?: number): boolean {
    const it = ITEMS[itemId];
    if (!it || bagCount(this.state, itemId) <= 0 || this.result) return false;
    const target = this.actors.find((a) => a.id === targetId) ?? this.leader;
    switch (it.kind) {
      case 'food':
        this.belly = Math.min(BELLY_MAX, this.belly + (it.value ?? 0));
        this.hungerWarned = 0;
        this.log(`El grupo come ${it.name}. Provisiones: ${Math.floor(this.belly)}.`, '#e8c87a');
        this.sfx('heal');
        break;
      case 'dish':
        this.belly = Math.min(BELLY_MAX, this.belly + (it.value ?? 0));
        this.hungerWarned = 0;
        this.log(`El grupo comparte ${it.name}. Provisiones: ${Math.floor(this.belly)}.`, '#e8c87a');
        for (const p of this.party) {
          if (it.partyHeal) this.heal(p, Math.round(p.maxHp * it.partyHeal));
          if (it.partySp) p.sp = Math.min(p.maxSp, p.sp + it.partySp);
          if (it.cure) delete p.statuses.veneno;
          if (it.partyStatus) this.addStatus(p, it.partyStatus.id, it.partyStatus.turns);
        }
        this.sfx('heal');
        break;
      case 'heal':
        this.heal(target, it.value ?? 0);
        this.events.push({ t: 'fx', kind: 'heal', tiles: [{ x: target.x, y: target.y }] });
        this.sfx('heal');
        break;
      case 'sp':
        target.sp = Math.min(target.maxSp, target.sp + (it.value ?? 0));
        this.log(`${target.name} recupera energía.`, '#8fc3ff');
        this.sfx('heal');
        break;
      case 'cure':
        delete target.statuses.veneno;
        delete target.statuses.quemado;
        this.events.push({ t: 'fx', kind: 'heal', tiles: [{ x: target.x, y: target.y }] });
        this.log(`${target.name} ya no está envenenado ni quemado.`, '#8fe39a');
        this.sfx('heal');
        break;
      case 'raise': {
        const fallen = this.actors.find((a) => a.id === targetId && a.side === 'party' && !a.alive);
        const spot = fallen && this.freeNear(this.leader.x, this.leader.y);
        if (!fallen || !spot) {
          this.log(fallen ? 'No hay sitio libre junto al líder.' : 'Nadie del grupo ha caído.');
          return false;
        }
        fallen.alive = true;
        fallen.hp = Math.ceil(fallen.maxHp / 2);
        fallen.statuses = {};
        fallen.x = spot.x;
        fallen.y = spot.y;
        this.events.push({ t: 'revive', id: fallen.id });
        this.events.push({ t: 'flash', x: spot.x, y: spot.y, color: '#fff2b0' });
        this.log(`${it.name}: ¡${fallen.name} vuelve a levantarse!`, '#fff2b0');
        this.sfx('levelup');
        break;
      }
      case 'map':
        this.revealMap();
        this.log('El mapa del piso se revela ante tus ojos.', '#9fd7ff');
        this.sfx('magic');
        break;
      case 'escape':
        this.log('El orbe brilla y os arrastra a la superficie.', '#9fd7ff');
        this.result = 'escape';
        removeFromBag(this.state, itemId);
        return true;
      case 'throw':
        this.throwItem(it.id);
        break;
      case 'unknown':
        return this.useUnknown(itemId, targetId);
      case 'curse':
        this.log('Lees el pergamino... Las letras arden y algo responde desde la oscuridad.', '#c070ff');
        for (let k = 0; k < 3; k++) {
          const pos = this.freeNear(this.leader.x, this.leader.y);
          const pool = this.monsterPool().filter((m) => (m.minFloor ?? 1) <= this.floor);
          if (pos && pool.length) this.actors.push({ ...this.makeMonster(this.rng.weighted(pool).id, this.monsterLevel(), pos.x, pos.y), alert: 10 });
        }
        this.sfx('boss');
        break;
      default:
        this.log('Ese objeto no se puede usar así.');
        return false;
    }
    removeFromBag(this.state, itemId);
    this.afterLeader();
    return true;
  }

  /** Probar algo sin identificar: se descubre qué era y hace su efecto (bueno o malo). */
  private useUnknown(itemId: string, targetId?: number): boolean {
    const real = this.rng.weighted(UNKNOWN_TABLE[itemId]).id;
    const def = ITEMS[real];
    removeFromBag(this.state, itemId);
    this.log(`${ITEMS[itemId].name}... ¡era ${def.name}!`, '#7fc8ff');
    const L = this.leader;
    if (def.kind === 'throw') {
      // Veneno o bomba en las manos.
      if (def.bait) this.addStatus(L, 'veneno', 8);
      else this.applyDamage(L, Math.max(5, Math.round(L.maxHp * 0.2)));
      this.sfx('hurt');
      this.afterLeader();
      return true;
    }
    addToBag(this.state, real, 1);
    if (def.kind === 'raise' && !this.actors.some((a) => a.side === 'party' && !a.alive)) {
      this.log('Por suerte no se gasta: la guardas para cuando haga falta.', '#fff2b0');
      this.afterLeader();
      return true;
    }
    return this.useItem(real, targetId);
  }

  private throwItem(itemId: string) {
    const it = ITEMS[itemId];
    const L = this.leader;
    const r = this.traceLine(L, L.fx, L.fy, 8);
    this.log(`${L.name} lanza ${it.name}.`);
    this.sfx('throw');
    this.events.push({ t: 'projectile', x0: L.x, y0: L.y, x1: r.end.x, y1: r.end.y, color: it.element ? ELEMENTS[it.element].color : '#bbbbbb' });
    if (it.radius) {
      const tiles: { x: number; y: number }[] = [];
      for (let dy = -it.radius; dy <= it.radius; dy++) for (let dx = -it.radius; dx <= it.radius; dx++) if (isFloor(this.map, r.end.x + dx, r.end.y + dy)) tiles.push({ x: r.end.x + dx, y: r.end.y + dy });
      this.events.push({ t: 'fx', kind: it.element ?? 'fuego', tiles });
      for (const f of this.enemies.filter((e) => cheb(e, r.end) <= it.radius!)) {
        this.events.push({ t: 'flash', x: f.x, y: f.y, color: ELEMENTS[it.element ?? 'neutral'].color });
        this.hit(L, f, it.value ?? 20, 'mag', it.element ?? 'neutral');
      }
    } else if (r.hit && it.bait) {
      // Cebo: se lo come en vez de recibir daño.
      this.log(`${r.hit.name} se come ${it.name.toLowerCase()}.`, '#c8e08a');
      if (it.bait.status) this.addStatus(r.hit, it.bait.status, it.bait.turns ?? 5);
      if (it.bait.stun) this.addStatus(r.hit, 'aturdido', it.bait.stun);
    } else if (r.hit) {
      const amount = (it.value ?? 10) + L.level;
      this.events.push({ t: 'damage', id: r.hit.id, amount, crit: false, mult: 1 });
      this.log(`${r.hit.name} recibe ${amount} de daño.`);
      this.sfx('hit');
      this.applyDamage(r.hit, amount, L);
    } else {
      this.log('...no alcanza a nadie.');
    }
    if (it.breaks) {
      const W = this.map.w;
      for (const i of [...this.map.special.keys()]) if (cheb({ x: i % W, y: Math.floor(i / W) }, r.end) <= (it.radius ?? 1)) this.breakWall(i);
    }
  }

  private leaderStunned(): boolean {
    const L = this.leader;
    if (!L.statuses.aturdido) return false;
    L.statuses.aturdido--;
    if (!L.statuses.aturdido) delete L.statuses.aturdido;
    this.log(`${L.name} está aturdido y no puede moverse.`, '#d0d0d0');
    this.afterLeader();
    return true;
  }

  private pickup() {
    const L = this.leader;
    // Si hay varias cosas en la casilla (el cristal de un jefe que cae sobre otro objeto), primero lo que cabe.
    let idx = this.items.findIndex((i) => i.x === L.x && i.y === L.y && this.wouldPickUp(i));
    if (idx < 0) idx = this.items.findIndex((i) => i.x === L.x && i.y === L.y);
    if (idx < 0) return;
    const it = this.items[idx];
    // Odric identifica lo que no se conoce en cuanto lo coge el grupo.
    if (ITEMS[it.id]?.kind === 'unknown' && this.has('odric') && !it.price) {
      const real = this.rng.weighted(UNKNOWN_TABLE[it.id]).id;
      this.log(`Odric lo examina: ${ITEMS[it.id].name} es ${ITEMS[real].name}.`, '#7fc8ff');
      it.id = real;
    }
    if (it.price) {
      // Tienda: se lleva a la bolsa, pero hay que pagarlo antes de salir de la sala.
      if (!addToBag(this.state, it.id, 1)) {
        this.log(`La bolsa está llena. ${ITEMS[it.id].name} se queda en la tienda.`, '#ff9c8a');
        return;
      }
      this.debt += it.price;
      this.unpaid.push({ id: it.id, price: it.price });
      this.log(`Coges ${ITEMS[it.id].name} (${it.price} de oro). Debes ${this.debt}: paga al tendero (choca con él) antes de salir.`, '#e8c87a');
      this.sfx('pickup');
      this.items.splice(idx, 1);
      return;
    }
    this.stats.items++;
    if (it.id === 'gold') {
      this.state.gold += it.qty;
      this.goldFound += it.qty;
      this.log(`Recoges ${it.qty} de oro.`, '#e8c87a');
    } else if (ITEMS[it.id].kind === 'fragment') {
      const g = this.goal;
      if (g && !g.done) {
        g.have++;
        this.log(`Recoges un fragmento del sello (${g.have}/${g.need}).`, '#ffd27a');
        if (g.have >= g.need) this.goalDone();
      }
    } else if (ITEMS[it.id].kind === 'stairkey') {
      this.log('Recoges la llave de la escalera. El cerrojo cede.', '#ffd27a');
      this.goalDone();
    } else if (ITEMS[it.id].kind === 'key') {
      this.keys.push(it.id.replace('llave_', ''));
      this.log(`Recoges la ${ITEMS[it.id].name.toLowerCase()}.`, LOCK_BY_ID[it.id.replace('llave_', '')].color);
    } else if (ITEMS[it.id].kind === 'material') {
      const space = materialBagCapacity(this.state) - this.materialsUsed();
      if (space <= 0) {
        this.log(`La bolsa de materiales está llena. ${ITEMS[it.id].name} se queda en el suelo.`, '#ff9c8a');
        return;
      }
      const take = Math.min(space, it.qty);
      this.materials[it.id] = (this.materials[it.id] ?? 0) + take;
      this.log(`Guardas ${ITEMS[it.id].name}${take > 1 ? ` x${take}` : ''} en la bolsa de materiales.`, '#c8b8a0');
      if (take < it.qty) {
        it.qty -= take;
        this.log('No cabe todo: el resto se queda en el suelo.', '#ff9c8a');
        this.sfx('pickup');
        return;
      }
    } else if (ITEMS[it.id].kind === 'ingredient') {
      if (this.pouchUsed() >= pouchCapacity(this.state)) {
        this.log(`La bolsa de ingredientes está llena. ${ITEMS[it.id].name} se queda en el suelo.`, '#ff9c8a');
        return;
      }
      this.pouch[it.id] = (this.pouch[it.id] ?? 0) + 1;
      this.log(`Guardas ${ITEMS[it.id].name} en la bolsa de ingredientes.`, '#b8e08a');
    } else if (ITEMS[it.id].kind === 'quest') {
      const qid = Object.keys(this.state.quests).find((q) => {
        const o = QUEST_BY_ID[q].objective;
        return this.state.quests[q].status === 'active' && o.kind === 'collect' && o.item === it.id && o.dungeon === this.def.id;
      });
      if (qid) {
        onQuestEvent(this.state, qid);
        const qs = this.state.quests[qid];
        this.log(`Recoges ${ITEMS[it.id].name} (${qs.progress}).`, '#c9a24a');
        if (qs.status === 'ready') {
          this.log(`Misión cumplida: ${QUEST_BY_ID[qid].name}. Entrégala en el tablón.`, '#c9a24a');
          this.events.push({ t: 'quest', name: QUEST_BY_ID[qid].name });
        }
      }
    } else if (addToBag(this.state, it.id, 1)) {
      this.log(`Recoges ${ITEMS[it.id].name}.`, '#e8c87a');
    } else {
      this.log(`La bolsa está llena. ${ITEMS[it.id].name} se queda en el suelo.`, '#ff9c8a');
      return;
    }
    this.sfx('pickup');
    this.items.splice(idx, 1);
  }

  private rescue(npc: Actor) {
    npc.alive = false;
    this.events.push({ t: 'death', id: npc.id });
    this.log(`¡Has encontrado a ${npc.name}! Le das un mapa de salida y vuelve a la superficie.`, '#9fd7ff');
    this.sfx('levelup');
    if (npc.rescueQuest) {
      onQuestEvent(this.state, npc.rescueQuest);
      this.log(`Misión cumplida: ${QUEST_BY_ID[npc.rescueQuest].name}. Entrégala en el tablón.`, '#c9a24a');
      this.events.push({ t: 'quest', name: QUEST_BY_ID[npc.rescueQuest].name });
    }
  }

  // ---------------------------------------------------------------- turno del mundo

  private afterLeader() {
    const L = this.leader;
    if (this.result) return;
    if (L.statuses.prisa && !this.leaderBonusUsed) {
      this.leaderBonusUsed = true;
      this.updateFov();
    } else {
      this.leaderBonusUsed = false;
      this.worldTurn();
    }
    if (this.pendingFall && !this.result) {
      this.pendingFall = false;
      this.log('¡El suelo cede y caéis al piso siguiente!', '#ff9c8a');
      this.descend();
    }
  }

  private actionsFor(a: Actor): number {
    let n = 1;
    if (a.statuses.prisa) n++;
    if (a.fast && this.turn % 2 === 0 && !(this.terrainAt(a.x, a.y) === 'barro' && this.affects(a, 'barro'))) n++;
    return Math.min(2, n);
  }

  private worldTurn() {
    // Del más cercano al más lejano: así el de delante deja hueco y los demás le siguen en fila.
    const L = this.leader;
    const allies = this.party.filter((a) => a !== L).sort((a, b) => cheb(a, L) - cheb(b, L));
    for (const a of allies) {
      for (let i = this.actionsFor(a); i > 0 && a.alive && !this.result; i--) this.allyAct(a);
    }
    const esc = this.escort;
    if (esc && !this.stunned(esc) && (cheb(esc, L) > 1 || !this.canReach(esc, L))) this.follow(esc, L);
    for (const e of this.enemies) {
      for (let i = this.actionsFor(e); i > 0 && e.alive && !this.result; i--) this.enemyAct(e);
    }
    if (!this.result) this.endOfTurn();
    this.updateFov();
  }

  /** Brasas: queman (salvo a los de fuego). Suelo sagrado: cura, pero quema a los de sombra. */
  private terrainTick(a: Actor) {
    if (!a.alive) return;
    const t = this.terrainAt(a.x, a.y);
    const hurt = (pct: number, why: string) => {
      const n = Math.max(1, Math.round(a.maxHp * pct));
      this.events.push({ t: 'damage', id: a.id, amount: n, crit: false, mult: 1 });
      if (a.side === 'party') this.log(`${a.name} ${why} (${n}).`, '#ff9c8a');
      this.applyDamage(a, n);
    };
    // Corriente: empuja cada dos turnos (así siempre se puede avanzar contracorriente, aunque despacio).
    if (t === 'corriente' && this.affects(a, 'corriente')) {
      if (this.turn % 2) return;
      const d = FLOW_DIRS[this.map.flow[a.y * this.map.w + a.x]];
      if (d && this.canEnter(a, d.dx, d.dy)) {
        a.x += d.dx;
        a.y += d.dy;
        this.events.push({ t: 'move', id: a.id, x: a.x, y: a.y });
        if (a === this.leader) {
          this.steppedOnStairs = this.stairsOpen && a.x === this.stairs.x && a.y === this.stairs.y;
          // Lo que haya donde le deja la corriente también se recoge (y se activa).
          this.pickup();
          this.checkGoalSpot();
        }
      }
      return;
    }
    if (t === 'brasas' && a.element !== 'fuego') hurt(0.06, 'se quema con las brasas');
    else if (t === 'sagrado') {
      if (a.element === 'sombra') hurt(0.05, 'se quema con el suelo sagrado');
      else if (a.hp < a.maxHp) this.heal(a, Math.max(1, Math.round(a.maxHp * 0.04)));
    }
  }

  private stunned(a: Actor): boolean {
    if (!a.statuses.aturdido) return false;
    a.statuses.aturdido--;
    if (!a.statuses.aturdido) delete a.statuses.aturdido;
    return true;
  }

  private endOfTurn() {
    this.turn++;
    this.wardTick();
    for (const a of this.actors) {
      if (!a.alive || a.side === 'npc') continue;
      if (a.statuses.veneno) {
        const n = Math.max(1, Math.round(a.maxHp * 0.05));
        this.events.push({ t: 'damage', id: a.id, amount: n, crit: false, mult: 1 });
        this.applyDamage(a, n);
        if (this.result) return;
      }
      if (a.statuses.quemado && a.alive) {
        const n = Math.max(1, Math.round(a.maxHp * 0.04));
        this.events.push({ t: 'damage', id: a.id, amount: n, crit: false, mult: 1 });
        this.applyDamage(a, n);
        if (this.result) return;
      }
      for (const k of Object.keys(a.statuses) as StatusId[]) {
        if (k === 'aturdido') continue;
        const left = (a.statuses[k] ?? 0) - 1;
        if (left <= 0) delete a.statuses[k];
        else a.statuses[k] = left;
      }
      this.terrainTick(a);
      if (this.result) return;
    }

    const members = this.party;
    // Escolta: al llegar junto a las escaleras, se va.
    const esc = this.escort;
    if (esc && this.goal && !this.goal.done && cheb(esc, this.stairs) <= 1) {
      esc.alive = false;
      this.events.push({ t: 'death', id: esc.id });
      this.stats.escorts++;
      const gold = 40 * this.def.difficulty;
      this.state.gold += gold;
      this.goldFound += gold;
      this.log(`${esc.name}: «¡Gracias! No lo olvidaré.» Sube por las escaleras y os deja ${gold} de oro.`, '#9fd7ff');
      this.actors = this.actors.filter((a) => a !== esc);
      this.goalDone();
    }
    if (this.watchers.length) this.checkWatchers();
    // Pip descubre las trampas que tiene al lado y las que tiene al lado el líder.
    const pip = members.find((a) => a.memberId === 'pip');
    if (pip) {
      for (const who of [pip, this.leader])
        for (const d of DIRS8) {
          const t = this.traps.get((who.y + d.dy) * this.map.w + who.x + d.dx);
          if (t && !t.revealed) {
            t.revealed = true;
            this.log(`Pip: «¡Quieto! Ahí hay una trampa.»`, '#c8a8e8');
            this.events.push({ t: 'wall', x: who.x + d.dx, y: who.y + d.dy });
          }
        }
    }
    // Afinidad: vida y energía cada 10 turnos.
    if (this.turn % 10 === 0)
      for (const a of members) {
        const b = a.memberId ? this.bonus[a.memberId] : undefined;
        if (b?.regen) a.hp = Math.min(a.maxHp, a.hp + Math.max(1, Math.round(a.maxHp * b.regen / 100)));
        if (b?.sp) a.sp = Math.min(a.maxSp, a.sp + b.sp);
      }
    // Hambre: Garrick raciona, y algunas afinidades también.
    const saving = Math.min(40, (this.has('garrick') ? 20 : 0) + members.reduce((s, a) => Math.max(s, a.memberId ? this.bonus[a.memberId]?.belly ?? 0 : 0), 0));
    this.belly = Math.max(0, this.belly - (0.06 + 0.025 * members.length) * (1 - saving / 100));
    if (this.belly <= 0) {
      if (this.turn % 10 === 0 || this.hungerWarned < 3) {
        this.log('¡El grupo se muere de hambre! Perdéis vida cada turno.', '#ff5050');
        this.hungerWarned = 3;
      }
      for (const a of members) {
        a.hp -= 1;
        if (a.hp <= 0) this.kill(a);
        if (this.result) return;
      }
    } else {
      if (this.belly <= 25 && this.hungerWarned < 1) {
        this.hungerWarned = 1;
        this.log('El grupo tiene hambre. Quedan pocas provisiones.', '#e8c87a');
      } else if (this.belly <= 10 && this.hungerWarned < 2) {
        this.hungerWarned = 2;
        this.log('¡Provisiones casi agotadas! Comed algo pronto.', '#ff9c8a');
      }
      for (const a of members) {
        a.hpAcc += a.maxHp / 90;
        if (a.hpAcc >= 1) {
          const n = Math.floor(a.hpAcc);
          a.hpAcc -= n;
          a.hp = Math.min(a.maxHp, a.hp + n);
        }
        if (this.turn % 7 === 0) a.sp = Math.min(a.maxSp, a.sp + 1);
      }
    }

    this.spawnTimer++;
    const cap = Math.min(12, this.map.rooms.length + 3);
    if (this.spawnTimer >= 36 && this.enemies.length < cap && !this.def.fixed) {
      this.spawnTimer = 0;
      this.spawnEnemy(true);
    }
  }

  // ---------------------------------------------------------------- piloto automático

  /** Casillas que el piloto ha pisado en este piso (para notar si se atasca). */
  private autoVisits = new Map<number, number>();
  /** Último paso del piloto (para no cambiar de idea si el barro le retiene). */
  private autoPrev?: { at: number; dx: number; dy: number };
  /** Evita cambiar de líder dos veces en la misma acción. */
  private autoSwitched = false;
  /** Casilla que el piloto va a explorar. */
  private autoTarget?: number;
  /** Eventos de sala que el piloto ya probó (o a los que no llega). */
  private autoSeen = new Set<number>();
  /** Últimas casillas y objetivos del piloto (para notar vaivenes). */
  private autoTrail: { at: number; target?: number }[] = [];
  /** Turnos seguidos que el piloto lleva esperando a que un gólem mire a otro lado. */
  private autoWaits = 0;
  private autoEventSteps = new Map<number, number>();
  /** Casillas que el piloto evita pisar si puede (palancas de otro color, el botón de reinicio...). */
  private autoAvoid = new Set<number>();
  /** Destinos que el piloto dejó de poder alcanzar (se olvidan cada 40 turnos y al cambiar de piso). */
  private autoBad = new Set<number>();
  private autoBadTurn = 0;
  /** Sala a la que va de ronda buscando al guardián. */
  private autoPatrol?: number;

  /** Daño medio que haría `att` a `def`, sin azar (para comparar ataques). */
  private expectedDamage(att: Actor, def: Actor, power: number, kind: 'phys' | 'mag', element: Element, critBonus = 0): number {
    const a = this.eff(att, kind === 'phys' ? 'atk' : 'mag');
    const d = this.eff(def, kind === 'phys' ? 'def' : 'res');
    let dmg = ((a * power) / 10) * (100 / (100 + 4 * d)) * elementMultiplier(element, def.element);
    if (element !== 'neutral' && element === att.element) dmg *= 1.15;
    dmg *= (1 + (att.boost?.[element] ?? 0)) * (1 - (def.resist?.[element] ?? 0));
    if (this.terrainAt(def.x, def.y) === 'agua' && def.element !== 'agua') dmg *= 1.3;
    if (this.terrainAt(att.x, att.y) === 'agua' && att.element === 'agua') dmg *= 1.2;
    return Math.max(1, dmg * (1 + 0.5 * (0.06 + critBonus)));
  }

  /** Valor de dañar a varios: el daño que no se pasa de su vida, y un extra por cada uno que caería. */
  private attackScore(att: Actor, targets: Actor[], power: number, kind: 'phys' | 'mag', element: Element, critBonus = 0): number {
    let score = 0;
    for (const t of targets) {
      const d = this.expectedDamage(att, t, power, kind, element, critBonus);
      score += Math.min(d, t.hp) + (d >= t.hp ? t.maxHp * 0.3 + 5 : 0);
    }
    return score;
  }

  /** ¿Se recogería este objeto al pisarlo? */
  private wouldPickUp(it: FloorItem): boolean {
    const kind = it.id === 'gold' ? 'gold' : ITEMS[it.id]?.kind;
    if (it.price) return false;
    if (kind === 'gold' || kind === 'key' || kind === 'quest' || kind === 'stairkey' || kind === 'fragment') return true;
    if (kind === 'material') return this.materialsUsed() < materialBagCapacity(this.state);
    if (kind === 'ingredient') return this.pouchUsed() < pouchCapacity(this.state);
    return bagUsed(this.state) < bagCapacity(this.state);
  }

  /**
   * Búsqueda en anchura por lo que el líder ya conoce (casillas exploradas). Devuelve el primer paso hacia la
   * casilla más cercana que cumpla `goal`. Rodea trampas descubiertas y terrenos dañinos si hay otro camino;
   * ni los aliados (se intercambian) ni los enemigos (si se cruzan, se les ataca) cuentan como obstáculo.
   */
  private autoPath(goal: (i: number) => boolean, enterGoal = true): { dx: number; dy: number; to: number } | null {
    const L = this.leader;
    // Se mantiene el destino elegido mientras siga valiendo (si no, puede ir y venir entre dos casi igual de cerca).
    const kept = this.autoTarget;
    if (kept !== undefined && goal(kept)) {
      for (const careful of [true, false]) {
        const r = this.autoBfs(L, (i) => i === kept, careful, enterGoal);
        if (r) return r;
      }
      // Desde aquí ya no se llega (hielo, barro...): se descarta un rato, o iría y vendría entre dos destinos.
      this.autoBad.add(kept);
    }
    if (this.turn - this.autoBadTurn > 40) {
      this.autoBad.clear();
      this.autoBadTurn = this.turn;
    }
    const ok = (i: number) => goal(i) && !this.autoBad.has(i);
    // Si solo quedan destinos descartados, se vuelve a probar con todos.
    for (const g of this.autoBad.size ? [ok, goal] : [goal])
      for (const careful of [true, false]) {
        const r = this.autoBfs(L, g, careful, enterGoal);
        if (r) {
          this.autoTarget = r.to;
          return r;
        }
      }
    return null;
  }

  private autoBfs(L: Actor, goal: (i: number) => boolean, careful: boolean, enterGoal: boolean): { dx: number; dy: number; to: number } | null {
    const m = this.map;
    const W = m.w;
    const N = W * m.h;
    const start = L.y * W + L.x;
    // Estado = casilla y momento módulo P: las corrientes empujan en turnos alternos (P = 2) y, si hay gólems
    // vigía a la vista, estos giran cada WATCH_TURN turnos (P = 12, y se puede esperar quieto a que miren a otro lado).
    // first: primer paso (índice en DIRS8, 8 = esperar) con el que se llega a cada estado; -1 = sin visitar.
    // Si ya lleva una vuelta entera de los gólems esperando, se arriesga a pasar.
    const watch = careful && this.autoWaits < WATCH_TURN * 4 ? this.watchers.filter((w) => w.watcher!.seen) : [];
    const P = watch.length ? WATCH_TURN * 4 : 2;
    const watched: Set<number>[] = [];
    if (watch.length) for (let k = 0; k < P; k++) watched.push(new Set(watch.flatMap((w) => this.watchTiles(w, this.turn + k))));
    const first = new Int8Array(N * P).fill(-1);
    const block = new Uint8Array(N);
    // Tenderos, eventos y gólems no se apartan ni se pisan (las personas a rescatar sí: se va a por ellas).
    const solid = new Uint8Array(N);
    for (const a of this.actors) if (a.alive && a.side === 'npc' && !a.rescueQuest) solid[a.y * W + a.x] = 1;
    // Los que no se mueven (el feto del trono) tampoco: hay que rodearlos (salvo si son el destino).
    for (const a of this.actors)
      if (a.alive && a.still) for (let y = a.y; y < a.y + (a.h ?? 1); y++) for (let x = a.x; x < a.x + (a.w ?? 1); x++) if (!goal(y * W + x)) solid[y * W + x] = 1;
    // Una runa de teletransporte ya vista nunca lleva adonde se quiere ir: ni sin cuidado se pisa.
    for (const [i, t] of this.traps) if (t.revealed && t.id === 'teletransporte') solid[i] = 1;
    // Sabiendo el orden de colores, pisar una palanca de otro color nunca ayuda: tampoco se pisa sin cuidado.
    const g = this.goal;
    if (g?.kind === 'colores' && !g.done && this.orderKnown()) for (const sp of g.spots) if (sp.color !== g.order![g.have] && !goal(sp.y * W + sp.x)) solid[sp.y * W + sp.x] = 1;
    if (careful) {
      for (const i of this.autoAvoid) block[i] = 1;
      for (const [i, t] of this.traps) if (t.revealed) block[i] = 1;
      for (const i of this.hazardTiles) if (this.affects(L, terrainOfCode(m.terrain[i])!)) block[i] = 1;
      // Casillas por las que ya ha pasado demasiadas veces: probar otro camino (rompe los bucles).
      for (const [i, n] of this.autoVisits) if (n >= 7 && i !== start) block[i] = 1;
    }
    const slides = this.affects(L, 'hielo');
    const currents = this.affects(L, 'corriente');
    const q: number[] = [start * P];
    const depth: number[] = [0];
    first[start * P] = 99;
    for (let head = 0; head < q.length; head++) {
      const st = q[head];
      const cur = Math.floor(st / P);
      // Salir del barro cuesta un turno más (como en stuckInMud), y eso cambia cuándo empuja la corriente.
      const inMud = this.terrainAt(cur % W, (cur / W) | 0) === 'barro' && this.affects(L, 'barro') && !(cur === start && L.mudFree);
      const k = depth[head] + (inMud ? 2 : 1);
      if (cur !== start && goal(cur)) {
        const d = first[st] === 8 ? { dx: 0, dy: 0 } : DIRS8[first[st]];
        return { dx: d.dx, dy: d.dy, to: cur };
      }
      // Con gólems: esperar quieto un turno (si ahí no le van a ver).
      if (watch.length && !inMud) {
        const kw = depth[head] + 1;
        const ws = cur * P + (kw % P);
        if (first[ws] === -1 && !watched[kw % P].has(cur)) {
          first[ws] = cur === start && head === 0 ? 8 : first[st];
          q.push(ws);
          depth.push(kw);
        }
      }
      const cx = cur % W;
      const cy = (cur / W) | 0;
      for (let dir = 0; dir < 8; dir++) {
        const d = DIRS8[dir];
        let nx = cx + d.dx;
        let ny = cy + d.dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= m.h || this.diagBlocked(cx, cy, d.dx, d.dy)) continue;
        let ni = ny * W + nx;
        if (!this.explored[ni] || solid[ni]) continue;
        // Puertas con candado y grietas: solo como destino (se abren chocando o golpeando).
        const isGoal = enterGoal && goal(ni);
        if (!this.passable(nx, ny) && !isGoal) continue;
        if (block[ni] && !isGoal) continue;
        if (this.passable(nx, ny)) {
          // En el hielo se resbala en línea recta (como en afterStep) hasta salir o chocar con algo.
          if (slides) {
            for (let n = 0; n < 60 && this.terrainAt(nx, ny) === 'hielo'; n++) {
              const ax = nx + d.dx;
              const ay = ny + d.dy;
              if (!this.passable(ax, ay) || this.diagBlocked(nx, ny, d.dx, d.dy) || !this.explored[ay * W + ax]) break;
              nx = ax;
              ny = ay;
            }
          }
          // Al acabar el turno k, la corriente empuja si toca (como en terrainTick).
          // En los primeros pasos, si hay alguien donde empujaría (un aliado que le sigue), no empuja.
          if (currents && this.terrainAt(nx, ny) === 'corriente' && (this.turn + k) % 2 === 0) {
            const f = FLOW_DIRS[m.flow[ny * W + nx]];
            const blocker = f && k <= 2 ? this.actorAt(nx + f.dx, ny + f.dy) : undefined;
            if (f && this.passable(nx + f.dx, ny + f.dy) && !(blocker && blocker !== L)) {
              nx += f.dx;
              ny += f.dy;
            }
          }
          ni = ny * W + nx;
          if (block[ni] && !goal(ni)) continue;
        }
        if (watch.length && watched[k % P].has(ni)) continue;
        const ns = ni * P + (k % P);
        if (first[ns] !== -1) continue;
        first[ns] = cur === start && head === 0 ? dir : first[st];
        q.push(ns);
        depth.push(k);
      }
    }
    return null;
  }

  /**
   * Una acción del piloto automático del líder. Solo usa lo que el grupo sabe: lo explorado y los enemigos a la vista.
   * Por orden: curarse si va mal, comer si hay hambre, atacar con lo que más daño haga, recoger lo que vea,
   * bajar si ya conoce las escaleras (y no queda nada a la vista), explorar lo desconocido y, si no queda nada,
   * romper grietas. Devuelve null si actuó, o el motivo por el que se detiene.
   * `hurry`: queda poco para la Parca; se va directo a las escaleras si las conoce.
   */
  autoAction(hurry = false): string | null {
    if (this.result) return 'fin';
    if (this.pendingChoice) {
      this.resolveChoice(this.autoChoice());
      return null;
    }
    const L = this.leader;
    const W = this.map.w;
    this.autoAvoid = this.autoAvoidTiles();
    const bag = (kind: string) => Object.keys(this.state.bag).filter((id) => this.state.bag[id] > 0 && ITEMS[id]?.kind === kind);
    // Los que se ven, y los que están peleando pegados a un aliado (aunque estén en la niebla o la hierba).
    const foes = this.enemies.filter((e) => this.actorVisible(e) || this.party.some((p) => p !== L && this.canReach(p, e))).sort((a, b) => cheb(L, a) - cheb(L, b));
    const sealed = this.skillsSealed(L);
    const usable = sealed ? [] : L.skills.map((s, i) => ({ sk: SKILLS[s], i })).filter((s) => L.sp >= s.sk.cost);
    const danger = foes.some((f) => cheb(L, f) <= 3);

    // 1) Vida: habilidad de curación si alguien va mal, si no, la poción que no desperdicie mucho.
    for (const { sk, i } of usable.filter((s) => s.sk.kind === 'heal')) {
      const hurt = this.party.filter((p) => cheb(L, p) <= (sk.range ?? 5) && p.hp / p.maxHp < 0.45);
      if ((sk.target === 'self' && L.hp / L.maxHp < 0.45) || (sk.target === 'ally' && hurt.length) || (sk.target === 'party' && hurt.length && (hurt.length >= 2 || hurt.includes(L)))) {
        this.leaderSkill(i);
        return null;
      }
    }
    const low = this.party.filter((p) => p.hp / p.maxHp < (danger ? 0.4 : 0.3)).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (low) {
      const pots = bag('heal').sort((a, b) => ITEMS[a].value! - ITEMS[b].value!);
      const pot = pots.find((id) => ITEMS[id].value! >= (low.maxHp - low.hp) * 0.6) ?? pots[pots.length - 1];
      if (pot) {
        this.useItem(pot, low.id);
        return null;
      }
      if (low === L && L.hp / L.maxHp < 0.2 && bag('escape').length) {
        this.useItem(bag('escape')[0]);
        return null;
      }
    }
    // Sin pociones y con el líder malherido: que mande alguien sano (y vuelva a mandar Aren cuando se recupere).
    if (!this.autoSwitched && L.hp / L.maxHp < 0.3 && !bag('heal').length) {
      const best = this.party.filter((p) => p !== L && p.hp / p.maxHp >= 0.6).sort((p, q) => q.hp / q.maxHp - p.hp / p.maxHp)[0];
      if (best) {
        this.switchLeader(best.id);
        this.autoSwitched = true;
        try {
          return this.autoAction(hurry);
        } finally {
          this.autoSwitched = false;
        }
      }
    }
    if (L !== this.protag && !foes.length && this.protag.alive && this.protag.hp / this.protag.maxHp >= 0.6 && !this.autoSwitched) {
      this.switchLeader(this.protag.id);
      this.autoSwitched = true;
      try {
        return this.autoAction(hurry);
      } finally {
        this.autoSwitched = false;
      }
    }
    if (L.statuses.veneno && L.hp / L.maxHp < 0.6 && bag('cure').length) {
      this.useItem(bag('cure')[0], L.id);
      return null;
    }

    // Un compañero caído y una Lágrima del alba: revivirlo cuando no hay peligro cerca.
    const fallen = this.actors.find((a) => a.side === 'party' && !a.alive);
    if (fallen && !danger && bag('raise').length && this.useItem(bag('raise')[0], fallen.id)) return null;

    // 2) Hambre: la comida que mejor encaje con lo que falta.
    if (this.belly < 20 && !danger) {
      const food = [...bag('food'), ...bag('dish')].sort((a, b) => ITEMS[a].value! - ITEMS[b].value!);
      const pick = [...food].reverse().find((id) => ITEMS[id].value! <= BELLY_MAX - this.belly) ?? food[0];
      if (pick) {
        this.useItem(pick);
        return null;
      }
    }

    // 3) Combate: el ataque que más daño haga ahora mismo (habilidades, golpe o lanzar algo).
    const reaper = this.reaper;
    // La Parca solo si está encima; el dorado huye, así que solo si está casi al alcance (perseguirlo trae a la Parca).
    // El feto protegido no: primero sus capitanes.
    const fight = foes.filter((f) => (!f.reaper || cheb(L, f) <= 1) && (!f.golden || cheb(L, f) <= 2) && !this.warded(f));
    if (fight.length) {
      let best: { score: number; run: () => void } | null = null;
      const consider = (score: number, run: () => void) => {
        if (score > 0 && (!best || score > best.score)) best = { score, run };
      };
      const adj = fight.filter((f) => this.canReach(L, f));
      for (const f of adj) consider(this.attackScore(L, [f], 10, 'phys', 'neutral') * 0.92, () => this.leaderMove(dirTo(L, f).dx, dirTo(L, f).dy));
      for (const { sk, i } of usable) {
        if (sk.kind !== 'phys' && sk.kind !== 'mag') continue;
        const use = (dx: number, dy: number) => () => {
          L.fx = dx;
          L.fy = dy;
          this.leaderSkill(i);
        };
        // La energía cuenta un poco: si hay poco que ganar frente al golpe normal, se guarda.
        const cost = sk.cost * 0.6;
        if (sk.target === 'front') for (const f of adj) consider(this.attackScore(L, [f], sk.power, sk.kind, sk.element, sk.crit) - cost, use(dirTo(L, f).dx, dirTo(L, f).dy));
        else if (sk.target === 'line') {
          for (const d of DIRS8) {
            const r = this.traceLine(L, d.dx, d.dy, sk.range ?? 5);
            if (r.hit && fight.includes(r.hit)) consider(this.attackScore(L, [r.hit], sk.power, sk.kind, sk.element, sk.crit) - cost, use(d.dx, d.dy));
          }
        } else if (sk.target === 'around' || sk.target === 'area') {
          const { targets } = this.skillTargets(L, sk, L.fx, L.fy);
          const hits = targets.filter((t) => fight.includes(t));
          if (hits.length) consider(this.attackScore(L, hits, sk.power, sk.kind, sk.element, sk.crit) - cost, use(L.fx, L.fy));
        }
      }
      // Mejoras propias al empezar una pelea con un enemigo cerca.
      const near = fight[0];
      for (const { sk, i } of usable) {
        if (sk.kind !== 'buff' || sk.target !== 'self' || !sk.status || L.statuses[sk.status.id] || cheb(L, near) > 3) continue;
        const worth = near.hp > this.expectedDamage(L, near, 10, 'phys', 'neutral') * 2.5;
        if (worth) consider(this.attackScore(L, [near], 10, 'phys', 'neutral') * 1.3, () => this.leaderSkill(i));
      }
      // Objetos para lanzar (no las bombas, que hacen falta para las murallas), si no hay nada mejor a mano.
      if (!adj.length) {
        for (const id of bag('throw').filter((x) => !ITEMS[x].breaks)) {
          for (const d of DIRS8) {
            const r = this.traceLine(L, d.dx, d.dy, 8);
            if (!r.hit || !fight.includes(r.hit)) continue;
            const it = ITEMS[id];
            const hits = it.radius ? fight.filter((f) => cheb(f, r.end) <= it.radius!) : [r.hit];
            const score = it.radius ? this.attackScore(L, hits, it.value ?? 20, 'mag', it.element ?? 'neutral') : Math.min((it.value ?? 10) + L.level, r.hit.hp);
            consider(score * 0.7, () => {
              L.fx = d.dx;
              L.fy = d.dy;
              this.useItem(id);
            });
          }
        }
      }
      const chosen = best as { score: number; run: () => void } | null;
      if (chosen) {
        chosen.run();
        return null;
      }
      // Nada a tiro: acercarse al más cercano.
      const t = fight[0];
      const step = this.autoPath((i) => covers(t, i % W, (i / W) | 0));
      if (step) {
        this.autoStep(step);
        return null;
      }
    }

    // 4) Con la Parca suelta o con prisa, directo a las escaleras si se conocen.
    const stairsI = this.stairs.y * W + this.stairs.x;
    const stairsKnown = this.stairsOpen && (this.explored[stairsI] || this.intel.has('escaleras'));
    const toStairs = () => {
      const step = this.autoPath((i) => i === stairsI);
      if (!step) return false;
      this.autoStep(step);
      return true;
    };
    if (stairsKnown && (reaper || hurry) && toStairs()) return null;

    // 5) Objetos a la vista (los que se recogerían).
    const want = new Set(this.items.filter((it) => this.explored[it.y * W + it.x] && this.wouldPickUp(it)).map((it) => it.y * W + it.x));
    if (want.size) {
      const step = this.autoPath((i) => want.has(i));
      if (step) {
        this.autoStep(step);
        return null;
      }
    }

    // 5b) Eventos de sala a la vista: acercarse y probar suerte una vez (ver autoChoice).
    const ev = this.actors.find((a) => a.alive && a.event && this.explored[a.y * W + a.x] && !this.autoSeen.has(a.id));
    if (ev && !danger) {
      if (this.canReach(L, ev)) {
        this.autoSeen.add(ev.id);
        this.leaderMove(Math.sign(ev.x - L.x), Math.sign(ev.y - L.y));
        return null;
      }
      // Si no llega en unos cuantos pasos (hielo, corrientes...), lo deja estar.
      const tries = (this.autoEventSteps.get(ev.id) ?? 0) + 1;
      this.autoEventSteps.set(ev.id, tries);
      const step = tries <= 30 ? this.autoPath((i) => cheb({ x: i % W, y: (i / W) | 0 }, ev) === 1 && this.passable(i % W, (i / W) | 0)) : null;
      if (step) {
        this.autoStep(step);
        return null;
      }
      this.autoSeen.add(ev.id);
    }

    // 6) Puertas con candado de las que ya tiene la llave.
    if (this.keys.length) {
      const step = this.autoPath((i) => this.keys.includes(this.doors.get(i) ?? ''));
      if (step) {
        this.autoStep(step);
        return null;
      }
    }

    // 6b) Condición del piso: palancas y braseros apagados que ya se conocen.
    const g = this.goal;
    if (g && !g.done && g.spots.length && (g.kind === 'palanca' || g.kind === 'braseros')) {
      const spots = new Set(g.spots.filter((s) => !s.on && (this.explored[s.y * W + s.x] || this.intel.has('objetivos'))).map((s) => s.y * W + s.x));
      const step = spots.size ? this.autoPath((i) => spots.has(i)) : null;
      if (step) {
        this.autoStep(step);
        return null;
      }
    }
    const goalStep = this.autoGoalStep();
    if (goalStep === 'done') return null;
    // Alfa ya conocido (por el informante) aunque no se vea: ir a por él.
    const elite = this.enemies.find((e) => e.elite);
    if (g && !g.done && elite && this.intel.has('objetivos')) {
      const step = this.autoPath((i) => i === elite.y * W + elite.x);
      if (step) {
        this.autoStep(step);
        return null;
      }
    }

    // 7) Escaleras conocidas: bajar.
    if (stairsKnown && toStairs()) return null;

    // 8) Explorar: la casilla conocida más cercana junto a lo que aún no se ha visto.
    const m = this.map;
    const frontier = (i: number) => {
      if (!m.tiles[i] || this.map.special.has(i)) return false;
      const x = i % W;
      const y = (i / W) | 0;
      for (const d of DIRS8) {
        const nx = x + d.dx;
        const ny = y + d.dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < m.h && !this.explored[ny * W + nx]) return true;
      }
      return false;
    };
    const explore = this.autoPath(frontier, false);
    if (explore) {
      this.autoStep(explore);
      return null;
    }

    // 9) Sin nada más que ver (o con las escaleras tapiadas): romper una grieta conocida.
    const cracks = [...m.special].filter(([, k]) => k === 'crack').map(([i]) => i);
    if (cracks.length) {
      const facing = cracks.find((c) => c === (L.y + L.fy) * W + L.x + L.fx && !this.diagBlocked(L.x, L.y, L.fx, L.fy));
      if (facing !== undefined) {
        this.leaderAttack();
        return null;
      }
      const next = cracks.find((c) => cheb(L, { x: c % W, y: (c / W) | 0 }) === 1 && !this.diagBlocked(L.x, L.y, Math.sign((c % W) - L.x), Math.sign(((c / W) | 0) - L.y)));
      if (next !== undefined) {
        L.fx = (next % W) - L.x;
        L.fy = ((next / W) | 0) - L.y;
        this.leaderAttack();
        return null;
      }
      const set = new Set(cracks.filter((c) => this.explored[c]));
      const step = this.autoPath((i) => set.has(i));
      if (step) {
        this.autoStep(step);
        return null;
      }
    }
    if (this.reaper && foes.includes(this.reaper)) {
      this.leaderWait();
      return null;
    }
    // Escaleras cerradas (guardián, cacería o alfa) y todo explorado: recorrer las salas conocidas hasta dar con monstruos.
    if (!this.stairsOpen && (this.boss || (g && !g.done))) {
      // Cualquier casilla de sala conocida algo alejada (el guardián puede esconderse en la niebla o la hierba).
      const spots: number[] = [];
      for (let i = 0; i < m.roomAt.length; i++) if (m.roomAt[i] >= 0 && this.explored[i] && this.passable(i % W, (i / W) | 0) && cheb(L, { x: i % W, y: (i / W) | 0 }) >= 3) spots.push(i);
      // Si no se llega a la casilla elegida (hielo, barro...), se prueba con otras.
      for (let tries = 0; tries < 12 && spots.length; tries++) {
        if (this.autoPatrol === undefined || this.autoPatrol === L.y * W + L.x) this.autoPatrol = this.rng.pick(spots);
        const goal = this.autoPatrol;
        const step = this.autoPath((i) => i === goal);
        if (step) {
          // La ronda no cuenta como dar vueltas.
          if (!this.leaderMove(step.dx, step.dy)) this.leaderWait();
          return null;
        }
        this.autoPatrol = undefined;
      }
    }
    if (this.stairsOpen) return 'No queda nada por explorar y no encuentro las escaleras.';
    return this.boss ? 'Las escaleras siguen cerradas: hay que vencer al guardián.' : 'Las escaleras siguen cerradas: falta cumplir la condición del piso.';
  }

  /** Casillas que conviene no pisar por accidente con la condición del piso actual. */
  private autoAvoidTiles(): Set<number> {
    const g = this.goal;
    const W = this.map.w;
    const out = new Set<number>();
    if (!g || g.done) return out;
    if (g.reset) out.add(g.reset.y * W + g.reset.x);
    if (g.kind === 'colores') {
      const next = this.orderKnown() ? g.order![g.have] : null;
      for (const s of g.spots) if (s.color !== next) out.add(s.y * W + s.x);
    }
    return out;
  }

  /** Condiciones que piden ir a un sitio concreto (escolta, faros, colores, cajas). 'done' si actuó. */
  private autoGoalStep(): 'done' | null {
    const g = this.goal;
    if (!g || g.done) return null;
    const L = this.leader;
    const W = this.map.w;
    const known = (x: number, y: number) => this.explored[y * W + x] === 1 || this.intel.has('objetivos');
    const go = (target: Set<number>) => {
      const step = target.size ? this.autoPath((i) => target.has(i)) : null;
      if (!step) return null;
      this.autoStep(step);
      return 'done' as const;
    };
    const si = this.stairs.y * W + this.stairs.x;
    if (g.kind === 'escolta' && this.escort && (this.explored[si] || this.intel.has('escaleras'))) {
      // Esperar en las escaleras a que llegue.
      if (L.x === this.stairs.x && L.y === this.stairs.y) {
        this.leaderWait();
        return 'done';
      }
      return go(new Set([si]));
    }
    if (g.kind === 'faros' && g.torch) {
      if (!g.torch.taken) return go(new Set([g.torch.y * W + g.torch.x]));
      return go(new Set(g.spots.filter((s) => !s.on).map((s) => s.y * W + s.x)));
    }
    if (g.kind === 'colores' && this.orderKnown()) {
      const next = g.spots.find((s) => s.color === g.order![g.have]);
      if (next && known(next.x, next.y)) return go(new Set([next.y * W + next.x]));
      return null;
    }
    if (g.kind === 'cajas' && g.boxes) {
      // Una caja fuera de su línea (o pasada de su placa): botón de reinicio.
      const lost = g.boxes.some((b) => (b.x - b.px) * b.dy !== (b.y - b.py) * b.dx || (b.px - b.x) * b.dx + (b.py - b.y) * b.dy < 0);
      if (lost && g.reset && known(g.reset.x, g.reset.y)) {
        this.autoAvoid.delete(g.reset.y * W + g.reset.x);
        return go(new Set([g.reset.y * W + g.reset.x]));
      }
      const b = g.boxes.find((q) => q.x !== q.px || q.y !== q.py);
      if (!b || !known(b.x, b.y)) return null;
      const bx = b.x - b.dx;
      const by = b.y - b.dy;
      if (L.x === bx && L.y === by) {
        this.autoStep({ dx: b.dx, dy: b.dy });
        return 'done';
      }
      if (this.passable(bx, by)) return go(new Set([by * W + bx]));
      // No se puede llegar detrás de la caja: reiniciar.
      if (g.reset && known(g.reset.x, g.reset.y) && (b.x !== b.x0 || b.y !== b.y0)) {
        this.autoAvoid.delete(g.reset.y * W + g.reset.x);
        return go(new Set([g.reset.y * W + g.reset.x]));
      }
    }
    return null;
  }

  /** Da un paso del piloto y se detiene si lleva demasiadas vueltas por las mismas casillas. */
  private autoStep(step: { dx: number; dy: number }) {
    const L = this.leader;
    if (!step.dx && !step.dy) {
      this.autoWaits++;
      this.leaderWait();
      return;
    }
    this.autoWaits = 0;
    // Vaivén entre dos casillas (dos objetivos que se turnan): se descartan esos objetivos un rato.
    this.autoTrail.push({ at: L.y * this.map.w + L.x, target: this.autoTarget });
    if (this.autoTrail.length > 8) this.autoTrail.shift();
    if (this.autoTrail.length === 8 && new Set(this.autoTrail.map((p) => p.at)).size <= 2) {
      for (const p of this.autoTrail) if (p.target !== undefined) this.autoBad.add(p.target);
      this.autoBadTurn = this.turn;
      this.autoTarget = undefined;
      this.autoTrail = [];
    }
    const i = L.y * this.map.w + L.x;
    // Si el barro le retuvo, se repite el mismo paso (recalcular con otro turno puede llevar a otra ruta y no salir nunca).
    const prev = this.autoPrev;
    if (prev && prev.at === i && this.terrainAt(L.x, L.y) === 'barro' && this.passable(L.x + prev.dx, L.y + prev.dy)) step = prev;
    this.autoPrev = { at: i, dx: step.dx, dy: step.dy };
    const visits = (this.autoVisits.get(i) ?? 0) + 1;
    this.autoVisits.set(i, visits);
    // Vueltas largas por las mismas casillas (aliados que se cruzan en un pasillo, rodeos por las brasas...):
    // también se descarta el destino un rato.
    if (visits % 6 === 0 && this.autoTarget !== undefined) {
      this.autoBad.add(this.autoTarget);
      this.autoBadTurn = this.turn;
      this.autoTarget = undefined;
    }
    if (!this.leaderMove(step.dx, step.dy)) this.leaderWait();
  }

  /** ¿Se ha quedado dando vueltas? (alguna casilla pisada muchas veces en este piso). */
  autoStuck(): boolean {
    for (const n of this.autoVisits.values()) if (n > 20) return true;
    return false;
  }

  // ---------------------------------------------------------------- IA

  /** Primer paso del camino más corto. `ignore`: qué actores no cuentan como obstáculo. */
  pathStep(a: Actor, tx: number, ty: number, ignore: 'none' | 'party' | 'all' = 'none'): { dx: number; dy: number; len: number } | null {
    // El grupo rodea las trampas ya descubiertas si hay otro camino.
    if (a.side === 'party' && (this.hazardTiles.length || [...this.traps.values()].some((t) => t.revealed))) {
      const safe = this.findPath(a, tx, ty, ignore, true);
      if (safe) return safe;
    }
    return this.findPath(a, tx, ty, ignore, false);
  }

  private findPath(a: Actor, tx: number, ty: number, ignore: 'none' | 'party' | 'all', avoidTraps: boolean): { dx: number; dy: number; len: number } | null {
    if (isBig(a)) return this.bigPath(a, tx, ty);
    const m = this.map;
    const W = m.w;
    const start = a.y * W + a.x;
    const goal = ty * W + tx;
    if (start === goal) return null;
    // Si el destino es un actor grande, vale llegar a cualquiera de sus casillas.
    const tgt = this.actorAt(tx, ty);
    const isGoal = tgt && isBig(tgt) ? (i: number) => covers(tgt, i % W, (i / W) | 0) : (i: number) => i === goal;
    const prev = this.prevBuf.fill(-1);
    const occ = new Uint8Array(W * m.h);
    if (ignore !== 'all')
      for (const o of this.actors)
        if (o.alive && !(ignore === 'party' && o.side === 'party')) for (let y = o.y; y < o.y + (o.h ?? 1); y++) for (let x = o.x; x < o.x + (o.w ?? 1); x++) occ[y * W + x] = 1;
    if (avoidTraps) {
      for (const [i, t] of this.traps) if (t.revealed && i !== goal) occ[i] = 1;
      for (const i of this.hazardTiles) if (i !== goal && i !== start && this.affects(a, terrainOfCode(this.map.terrain[i])!)) occ[i] = 1;
    }
    const q = this.queueBuf;
    let head = 0;
    let tail = 0;
    q[tail++] = start;
    prev[start] = start;
    let end = -1;
    while (head < tail) {
      const cur = q[head++];
      if (isGoal(cur)) {
        end = cur;
        break;
      }
      const cx = cur % W;
      const cy = (cur / W) | 0;
      for (const d of DIRS8) {
        const nx = cx + d.dx;
        const ny = cy + d.dy;
        // Las puertas cerradas bloquean, salvo si son el destino (para ir a abrirlas).
        if ((!this.passable(nx, ny) && !(isGoal(ny * W + nx) && isFloor(m, nx, ny))) || this.diagBlocked(cx, cy, d.dx, d.dy)) continue;
        const ni = ny * W + nx;
        if (prev[ni] !== -1 || (occ[ni] && !isGoal(ni))) continue;
        prev[ni] = cur;
        q[tail++] = ni;
      }
    }
    if (end < 0) return null;
    let cur = end;
    let len = 1;
    while (prev[cur] !== start) {
      cur = prev[cur];
      len++;
    }
    return { dx: (cur % W) - a.x, dy: ((cur / W) | 0) - a.y, len };
  }

  /** Camino de un actor grande: dónde puede ir poniendo su esquina hasta quedar pegado al objetivo (o encima del punto). */
  private bigPath(a: Actor, tx: number, ty: number): { dx: number; dy: number; len: number } | null {
    const W = this.map.w;
    const w = a.w ?? 1;
    const h = a.h ?? 1;
    const tgt = this.actorAt(tx, ty);
    const target: Box = tgt && tgt !== a ? tgt : { x: tx, y: ty };
    const reach = tgt && tgt !== a ? 1 : 0;
    const done = (x: number, y: number) => cheb({ x, y, w, h }, target) <= reach;
    if (done(a.x, a.y)) return null;
    const start = a.y * W + a.x;
    const prev = this.prevBuf.fill(-1);
    const q = this.queueBuf;
    let head = 0;
    let tail = 0;
    q[tail++] = start;
    prev[start] = start;
    while (head < tail) {
      const cur = q[head++];
      const cx = cur % W;
      const cy = (cur / W) | 0;
      if (cur !== start && done(cx, cy)) {
        let c = cur;
        let len = 1;
        while (prev[c] !== start) {
          c = prev[c];
          len++;
        }
        return { dx: (c % W) - a.x, dy: ((c / W) | 0) - a.y, len };
      }
      for (const d of DIRS8) {
        const nx = cx + d.dx;
        const ny = cy + d.dy;
        if (nx < 0 || ny < 0 || nx >= W) continue;
        const ni = ny * W + nx;
        if (prev[ni] !== -1 || !this.fits(nx, ny, w, h, a)) continue;
        prev[ni] = cur;
        q[tail++] = ni;
      }
    }
    return null;
  }

  private stepToward(a: Actor, tx: number, ty: number): boolean {
    const p = this.pathStep(a, tx, ty);
    if (p && this.canEnter(a, p.dx, p.dy)) return this.moveBy(a, p.dx, p.dy);
    // Sin camino libre: paso codicioso que reduzca la distancia.
    const opts = DIRS8.filter((d) => this.canEnter(a, d.dx, d.dy)).sort(
      (d1, d2) => cheb({ x: a.x + d1.dx, y: a.y + d1.dy, w: a.w, h: a.h }, { x: tx, y: ty }) - cheb({ x: a.x + d2.dx, y: a.y + d2.dy, w: a.w, h: a.h }, { x: tx, y: ty }),
    );
    const best = opts[0];
    if (best && cheb({ x: a.x + best.dx, y: a.y + best.dy, w: a.w, h: a.h }, { x: tx, y: ty }) < cheb(a, { x: tx, y: ty })) return this.moveBy(a, best.dx, best.dy);
    return false;
  }

  private moveBy(a: Actor, dx: number, dy: number): boolean {
    a.fx = dx;
    a.fy = dy;
    if (this.stuckInMud(a)) return true;
    a.x += dx;
    a.y += dy;
    this.events.push({ t: 'move', id: a.id, x: a.x, y: a.y });
    this.afterStep(a, dx, dy);
    if (a.side === 'party') this.checkTrap(a);
    return true;
  }

  private randomStep(a: Actor) {
    const opts = DIRS8.filter((d) => this.canEnter(a, d.dx, d.dy));
    if (opts.length) {
      const d = this.rng.pick(opts);
      this.moveBy(a, d.dx, d.dy);
    }
  }

  /** Intenta usar una habilidad contra `foes`. Devuelve true si actuó. */
  private tryOffensiveSkill(a: Actor, sk: SkillDef, foes: Actor[]): boolean {
    if (this.skillsSealed(a)) return false;
    const adj = foes.find((f) => this.canReach(a, f));
    switch (sk.target) {
      case 'front':
        if (!adj) return false;
        this.performSkill(a, sk, dirTo(a, adj).dx, dirTo(a, adj).dy);
        return true;
      case 'around':
        if (foes.filter((f) => this.canReach(a, f)).length < (a.side === 'party' ? 2 : 1)) return false;
        this.performSkill(a, sk, a.fx, a.fy);
        return true;
      case 'area':
        if (!foes.some((f) => cheb(a, f) <= (sk.range ?? 2))) return false;
        this.performSkill(a, sk, a.fx, a.fy);
        return true;
      case 'line':
        for (const d of DIRS8) {
          const r = this.traceLine(a, d.dx, d.dy, sk.range ?? 5);
          if (r.hit && foes.includes(r.hit)) {
            this.performSkill(a, sk, d.dx, d.dy);
            return true;
          }
        }
        return false;
      default:
        return false;
    }
  }

  private allyAct(a: Actor) {
    if (this.stunned(a)) return;
    const L = this.leader;
    const tactic = tacticOf(this.state, a.memberId!);
    const usable = this.skillsSealed(a) ? [] : a.skills.map((s) => SKILLS[s]).filter((s) => a.sp >= s.cost);

    // 1) Curar. "Apoyo" cura antes (por debajo del 70%); "Solo atacar" nunca.
    if (tactic !== 'atacar') {
      const threshold = tactic === 'apoyo' ? 0.7 : 0.5;
      for (const sk of usable.filter((s) => s.kind === 'heal')) {
        const hurt = this.party.filter((p) => cheb(a, p) <= (sk.range ?? 5) && p.hp / p.maxHp < threshold);
        if ((sk.target === 'ally' && hurt.length) || (sk.target === 'party' && hurt.length >= 2) || (sk.target === 'self' && a.hp / a.maxHp < threshold - 0.1)) {
          this.performSkill(a, sk, a.fx, a.fy);
          return;
        }
      }
    }

    // Enemigos que percibe: los que ve el líder y también los que ve él mismo, aunque esté lejos del grupo.
    const foes = this.enemies.filter((e) => cheb(a, e) <= 7 && !this.warded(e) && (this.isVisible(e.x, e.y) || this.sees(a, e))).sort((e1, e2) => cheb(a, e1) - cheb(a, e2));
    const adj = foes.find((f) => this.canReach(a, f));
    // Aren sin el mando y malherido: se retira detrás del grupo si hay hueco (si cae, se acaba la incursión).
    if (a === this.protag && adj && a.hp / a.maxHp < 0.35) {
      const away = DIRS8.filter((d) => this.canEnter(a, d.dx, d.dy))
        .map((d) => ({ d, near: foes.filter((f) => cheb(f, { x: a.x + d.dx, y: a.y + d.dy }) <= 1).length }))
        .sort((p, q) => p.near - q.near)[0];
      if (away && away.near === 0) {
        this.moveBy(a, away.d.dx, away.d.dy);
        return;
      }
    }
    if (foes.length) {
      // 2) Mejoras
      const buffChance = tactic === 'apoyo' ? 0.7 : tactic === 'atacar' || tactic === 'esperar' ? 0 : 0.35;
      for (const sk of usable.filter((s) => s.kind === 'buff')) {
        if (sk.status && !a.statuses[sk.status.id] && cheb(a, foes[0]) <= 4 && this.rng.chance(buffChance)) {
          this.performSkill(a, sk, a.fx, a.fy);
          return;
        }
      }
      // 3) Habilidades de ataque
      if (tactic !== 'atacar') {
        for (const sk of this.rng.shuffle(usable.filter((s) => OFFENSIVE.has(s.kind)))) {
          const ranged = sk.target === 'line' || sk.target === 'area';
          const chance = tactic === 'habilidades' ? 1 : tactic === 'apoyo' ? 0.25 : ranged ? 0.6 : 0.4;
          if (this.rng.chance(chance) && this.tryOffensiveSkill(a, sk, foes)) return;
        }
      }
      // 4) Primero se defiende de lo que tiene al lado; luego ya volverá con el líder.
      if (adj) {
        this.basicAttack(a, adj);
        return;
      }
      if (tactic === 'esperar') return;
      // 5) Va a por el enemigo si lo tiene cerca, o si el grupo está junto.
      const target = foes[0];
      const engage = tactic === 'separado' ? 7 : tactic === 'apoyo' ? 2 : 3;
      if ((cheb(a, target) <= engage || (tactic !== 'apoyo' && cheb(a, L) <= 3)) && this.stepToward(a, target.x, target.y)) return;
    }
    if (tactic === 'esperar') return;
    // 6) Por separado: explora por su cuenta.
    if (tactic === 'separado') {
      if (!a.wander || (a.wander.x === a.x && a.wander.y === a.y)) {
        const r = this.rng.pick(this.map.rooms);
        a.wander = { x: r.x + (r.w >> 1), y: r.y + (r.h >> 1) };
      }
      if (!this.stepToward(a, a.wander.x, a.wander.y)) a.wander = undefined;
      return;
    }
    // 7) Seguir al líder
    // En diagonal tras una esquina (pegado pero sin paso) también hay que moverse, o se queda una casilla atrás.
    if (cheb(a, L) > 1 || !this.canReach(a, L)) this.follow(a, L);
  }

  /**
   * Los aliados no se cuentan como obstáculo al buscar camino. Si el de delante tapa el paso,
   * se espera detrás en vez de dar media vuelta; solo se rodea si el desvío es casi igual de corto.
   */
  private follow(a: Actor, L: Actor) {
    const direct = this.pathStep(a, L.x, L.y, 'party');
    if (!direct) {
      this.stepToward(a, L.x, L.y);
      return;
    }
    const blocker = this.actorAt(a.x + direct.dx, a.y + direct.dy);
    if (!blocker) {
      this.moveBy(a, direct.dx, direct.dy);
      return;
    }
    const detour = this.pathStep(a, L.x, L.y);
    if (detour && detour.len <= direct.len + 1) {
      this.moveBy(a, detour.dx, detour.dy);
      return;
    }
    // Un aliado aturdido no debe atascar la fila: se intercambian posiciones.
    if (blocker.side === 'party' && blocker !== L && blocker.statuses.aturdido) {
      blocker.x = a.x;
      blocker.y = a.y;
      this.events.push({ t: 'move', id: blocker.id, x: blocker.x, y: blocker.y });
      this.moveBy(a, direct.dx, direct.dy);
    }
  }

  /** El dorado huye de quien tenga cerca; si le acorralan, muerde. */
  private goldenAct(e: Actor) {
    const near = this.party.filter((p) => cheb(p, e) <= 5 && this.sees(e, p));
    if (!near.length) {
      if (this.rng.chance(0.5)) this.randomStep(e);
      return;
    }
    const score = (x: number, y: number) => Math.min(...near.map((p) => cheb(p, { x, y })));
    const best = DIRS8.filter((d) => this.canEnter(e, d.dx, d.dy)).sort((a, b) => score(e.x + b.dx, e.y + b.dy) - score(e.x + a.dx, e.y + a.dy))[0];
    if (best && score(e.x + best.dx, e.y + best.dy) >= score(e.x, e.y)) this.moveBy(e, best.dx, best.dy);
    else {
      const adj = near.find((p) => this.canReach(e, p));
      if (adj) this.basicAttack(e, adj);
    }
  }

  private pickTarget(e: Actor): Actor | undefined {
    const rivals = e.faction ? this.enemies.filter((o) => o.faction && o.faction !== e.faction) : [];
    const seen = [...this.party, ...(this.escort ? [this.escort] : []), ...rivals].filter((p) => this.sees(e, p));
    if (!seen.length) return undefined;
    const taunt = seen.find((p) => p.statuses.provocar);
    if (taunt) return taunt;
    return seen.sort((p1, p2) => cheb(e, p1) - cheb(e, p2))[0];
  }

  /** Se acabó el tiempo del piso: llega la Parca, lejos del grupo, y va directa a por él. */
  summonReaper(): void {
    if (this.reaperOut || this.result) return;
    this.reaperOut = true;
    const pos = this.randomRoomTile({ awayFrom: this.leader, minDist: 10 }) ?? this.randomRoomTile({ awayFrom: this.leader, minDist: 5 });
    if (!pos) return;
    const top = this.def.scaling === 'party' ? this.monsterLevel() : this.def.levels[1];
    this.actors.push(this.makeMonster('parca', top + REAPER_LEVEL_BONUS, pos.x, pos.y));
    this.sfx('boss');
    this.log('Un frío de tumba recorre el piso... ¡La Parca ha llegado! Bajad cuanto antes.', '#ff5050');
  }

  /** La Parca no necesita ver: atraviesa paredes y va hacia el miembro más cercano. */
  private reaperAct(e: Actor) {
    const target = this.party.slice().sort((a, b) => cheb(a, e) - cheb(b, e))[0];
    if (!target) return;
    e.fx = Math.sign(target.x - e.x);
    e.fy = Math.sign(target.y - e.y);
    if (cheb(e, target) === 1) {
      for (const ms of this.skillsSealed(e) ? [] : e.monsterSkills ?? []) if (this.rng.chance(ms.chance) && this.tryOffensiveSkill(e, SKILLS[ms.id], [target, ...this.party.filter((p) => p !== target)])) return;
      this.basicAttack(e, target);
      return;
    }
    const inside = (x: number, y: number) => x > 0 && y > 0 && x < this.map.w - 1 && y < this.map.h - 1;
    for (const [dx, dy] of [[e.fx, e.fy], [e.fx, 0], [0, e.fy]]) {
      if (!dx && !dy) continue;
      const nx = e.x + dx;
      const ny = e.y + dy;
      if (!inside(nx, ny) || this.actorAt(nx, ny)) continue;
      e.x = nx;
      e.y = ny;
      this.events.push({ t: 'move', id: e.id, x: nx, y: ny });
      return;
    }
  }

  private enemyAct(e: Actor) {
    if (this.stunned(e)) return;
    if (e.reaper) return this.reaperAct(e);
    if (e.golden) return this.goldenAct(e);
    const target = this.pickTarget(e);
    if (target) {
      e.alert = 10;
      e.lastSeen = { x: target.x, y: target.y };
      for (const ms of this.skillsSealed(e) ? [] : e.monsterSkills ?? []) {
        if (!this.rng.chance(ms.chance)) continue;
        const sk = SKILLS[ms.id];
        if (sk.kind === 'buff') {
          if (sk.status && !e.statuses[sk.status.id]) {
            this.performSkill(e, sk, e.fx, e.fy);
            return;
          }
          continue;
        }
        if (this.tryOffensiveSkill(e, sk, [target, ...this.party.filter((p) => p !== target)])) return;
      }
      if (this.canReach(e, target)) {
        this.basicAttack(e, target);
        return;
      }
      if (e.still) return;
      if (e.ai === 'lurker' && this.rng.chance(0.5)) return;
      if (e.ai === 'erratic' && this.rng.chance(0.4)) {
        this.randomStep(e);
        return;
      }
      if (e.ai === 'ranged' && cheb(e, target) <= 3 && this.rng.chance(0.5)) return;
      this.stepToward(e, target.x, target.y);
      return;
    }
    if (e.still) return;
    if (e.alert > 0 && e.lastSeen) {
      e.alert--;
      if (!this.stepToward(e, e.lastSeen.x, e.lastSeen.y)) e.alert = 0;
      return;
    }
    if (e.boss || e.ai === 'lurker') return;
    if (e.ai === 'erratic' && this.rng.chance(0.5)) {
      this.randomStep(e);
      return;
    }
    if (!e.wander || (e.wander.x === e.x && e.wander.y === e.y) || this.rng.chance(0.03)) {
      const r = this.rng.pick(this.map.rooms);
      e.wander = { x: r.x + (r.w >> 1), y: r.y + (r.h >> 1) };
    }
    if (!this.stepToward(e, e.wander.x, e.wander.y)) e.wander = undefined;
  }
}
