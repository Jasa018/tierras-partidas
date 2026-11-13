/**
 * Recorre la historia entera sin interfaz, con las mismas reglas que el juego (rutas, requisitos, ciudades tomadas),
 * y comprueba que se puede terminar y que no falta ninguna escena, mazmorra, monstruo u objeto.
 * Uso: npm run story-test
 */
import { MEMBERS } from '../src/data/characters';
import { DUNGEONS, dungeonChain } from '../src/data/dungeons';
import { EQUIPMENT } from '../src/data/equipment';
import { ITEMS } from '../src/data/items';
import { MONSTERS } from '../src/data/monsters';
import { FINAL_QUEST, QUESTS } from '../src/data/quests';
import { EPILOGUES, SCENES, SPEAKERS } from '../src/data/story';
import { DUNGEON_SPOTS, LOCATIONS, ROUTES, isTaken } from '../src/data/world';
import { completeQuest, onDungeonClear, onVisit, readyMainQuests, refreshMainQuests } from '../src/core/quests';
import { addFlag, hasFlags, newGame, type GameState } from '../src/core/state';

// Node (el proyecto no instala @types/node).
declare const process: { argv: string[]; exit(code: number): never };

const errors: string[] = [];
const err = (m: string) => errors.push(m);

// ---------------------------------------------------------------- referencias
for (const d of Object.values(DUNGEONS)) {
  if (d.next && !DUNGEONS[d.next]) err(`${d.id}: tramo siguiente ${d.next} no existe`);
  for (const m of d.monsters) if (!MONSTERS[m.id]) err(`${d.id}: monstruo ${m.id} no existe`);
  if (d.boss && !MONSTERS[d.boss.monster]) err(`${d.id}: jefe ${d.boss.monster} no existe`);
  for (const m of d.bossEscort ?? []) if (!MONSTERS[m]) err(`${d.id}: escolta ${m} no existe`);
  for (const i of [...d.items.map((x) => x.id).filter((x) => x !== 'gold'), ...d.ingredients, ...(d.materials ?? [])]) if (!ITEMS[i]) err(`${d.id}: objeto ${i} no existe`);
}
for (const l of Object.values(LOCATIONS)) {
  for (const i of l.shop) if (!ITEMS[i]) err(`${l.id}: tienda vende ${i}, que no existe`);
  for (const e of l.forge) if (!EQUIPMENT[e]) err(`${l.id}: herrería vende ${e}, que no existe`);
  if (l.taken && !DUNGEONS[l.taken.dungeon]) err(`${l.id}: mazmorra de ciudad tomada ${l.taken.dungeon} no existe`);
}
for (const s of DUNGEON_SPOTS) if (!DUNGEONS[s.dungeon] || !LOCATIONS[s.from]) err(`punto ${s.dungeon} en ${s.from}: no existe`);
for (const r of ROUTES) if (!DUNGEONS[r.dungeon] || !LOCATIONS[r.a] || !LOCATIONS[r.b]) err(`ruta ${r.id}: referencia rota`);
for (const q of QUESTS) {
  const o = q.objective;
  if ('dungeon' in o && o.dungeon && !DUNGEONS[o.dungeon]) err(`${q.id}: mazmorra ${o.dungeon} no existe`);
  if (o.kind === 'visit' && !LOCATIONS[o.location]) err(`${q.id}: localidad ${o.location} no existe`);
  if (o.kind === 'kill' && !Object.values(MONSTERS).some((m) => m.id === o.monster)) err(`${q.id}: monstruo ${o.monster} no existe`);
  if (q.giver && !LOCATIONS[q.giver]) err(`${q.id}: la da ${q.giver}, que no existe`);
  for (const k of [q.rewards.scene, q.startScene]) if (k && !SCENES[k]) err(`${q.id}: escena ${k} no existe`);
  for (const id of [q.rewards.join, q.rewards.leave]) if (id && !MEMBERS[id]) err(`${q.id}: miembro ${id} no existe`);
  for (const i of Object.keys(q.rewards.items ?? {})) if (!ITEMS[i]) err(`${q.id}: objeto ${i} no existe`);
  for (const g of Object.keys(q.rewards.gear ?? {})) if (!EQUIPMENT[g]) err(`${q.id}: equipo ${g} no existe`);
}
for (const [k, lines] of Object.entries(SCENES)) for (const l of lines) if (!SPEAKERS[l.who] && !l.name) err(`escena ${k}: no hay quien hable como «${l.who}»`);
for (const id of Object.keys(MEMBERS)) if (id !== 'aren' && id !== 'garrick' && !EPILOGUES[id]) err(`falta el epílogo de ${id}`);
for (const k of ['final_lysa', 'final_aren', 'final_reinicio', 'creditos']) if (!SCENES[k]) err(`falta la escena ${k}`);

// ---------------------------------------------------------------- recorrido
const s: GameState = newGame();
const log: string[] = [];
const taken = (id: string) => isTaken(LOCATIONS[id], s.flags, s.cleared);

function arrive(loc: string) {
  s.location = loc;
  addFlag(s, `visit:${loc}`);
  onVisit(s, loc);
}
function clear(dungeon: string) {
  for (const d of dungeonChain(dungeon)) s.cleared[d.id] = (s.cleared[d.id] ?? 0) + 1;
  onDungeonClear(s, dungeon);
  const d = DUNGEONS[dungeon];
  const last = dungeonChain(dungeon).at(-1)!;
  log.push(`  ${d.name.padEnd(28)} Nv ${d.levels.join('-').padEnd(6)}${last.boss ? ` jefe ${MONSTERS[last.boss.monster].name} Nv${last.boss.level}` : ''}`);
}
function advance() {
  for (;;) {
    const ready = readyMainQuests(s);
    for (const q of ready) {
      completeQuest(s, q.id);
      log.push(`✓ ${q.id} ${q.name}${s.location ? ` (en ${LOCATIONS[s.location].name})` : ''}`);
    }
    const fresh = refreshMainQuests(s);
    if (!ready.length && !fresh.length) return;
  }
}
/** Camino por rutas abiertas desde donde se está hasta `to`, sin pasar por ciudades tomadas. */
function path(to: string): { route: (typeof ROUTES)[number]; next: string }[] | null {
  const prev = new Map<string, { route: (typeof ROUTES)[number]; from: string } | null>([[s.location, null]]);
  const queue = [s.location];
  while (queue.length) {
    const at = queue.shift()!;
    if (at === to) break;
    if (taken(at)) continue;
    for (const r of ROUTES) {
      if (!hasFlags(s, r.requires) || (r.a !== at && r.b !== at)) continue;
      const nx = r.a === at ? r.b : r.a;
      if (prev.has(nx)) continue;
      prev.set(nx, { route: r, from: at });
      queue.push(nx);
    }
  }
  if (!prev.has(to)) return null;
  const out: { route: (typeof ROUTES)[number]; next: string }[] = [];
  for (let at = to; prev.get(at); at = prev.get(at)!.from) out.unshift({ route: prev.get(at)!.route, next: at });
  return out;
}
function travel(to: string): boolean {
  const p = path(to);
  if (!p) return false;
  for (const step of p) {
    if (!s.cleared[step.route.dungeon]) clear(step.route.dungeon);
    arrive(step.next);
    advance();
  }
  return true;
}
/** Dónde se entra a una mazmorra: su punto en el mapa, su ruta o su ciudad tomada. */
function entrances(dungeon: string): string[] {
  return [
    ...DUNGEON_SPOTS.filter((sp) => sp.dungeon === dungeon && hasFlags(s, sp.requires)).map((sp) => sp.from),
    ...ROUTES.filter((r) => r.dungeon === dungeon && hasFlags(s, r.requires)).flatMap((r) => [r.a, r.b]),
    ...Object.values(LOCATIONS).filter((l) => l.taken?.dungeon === dungeon && taken(l.id)).map((l) => l.id),
  ];
}

arrive(s.location);
advance();
let guard = 0;
while (!s.flags.includes(`done:${FINAL_QUEST}`) && guard++ < 200) {
  const q = QUESTS.find((x) => x.type === 'main' && s.quests[x.id]?.status === 'active');
  if (!q) {
    err(`historia atascada: no hay misión principal activa (en ${s.location})`);
    break;
  }
  const o = q.objective;
  if (o.kind === 'visit') {
    if (!travel(o.location)) {
      err(`${q.id}: no se puede llegar a ${o.location} desde ${s.location}`);
      break;
    }
  } else if (o.kind === 'clear') {
    const ent = entrances(o.dungeon);
    const route = ROUTES.find((r) => r.dungeon === o.dungeon && (r.a === s.location || r.b === s.location));
    const where = ent.includes(s.location) ? s.location : ent.find((l) => travel(l) && s.location === l);
    if (!where) {
      err(`${q.id}: no se puede entrar en ${o.dungeon} (entradas: ${ent.join(', ') || 'ninguna'}; en ${s.location})`);
      break;
    }
    // Las mazmorras de las ciudades tomadas no dejan salir al mapa: se tienen que hacer desde dentro.
    if (taken(s.location) && LOCATIONS[s.location].taken!.dungeon !== o.dungeon) {
      err(`${q.id}: atascado en ${s.location}, tomada`);
      break;
    }
    clear(o.dungeon);
    const r = route ?? ROUTES.find((x) => x.dungeon === o.dungeon && (x.a === s.location || x.b === s.location));
    if (r) arrive(r.a === s.location ? r.b : r.a);
    advance();
  } else {
    err(`${q.id}: objetivo ${o.kind} no previsto en el recorrido`);
    break;
  }
}
if (!s.flags.includes(`done:${FINAL_QUEST}`)) err('no se llega al final de la historia');

// Miembros al final: Garrick fuera, el resto dentro.
const joined = Object.keys(MEMBERS).filter((id) => s.members[id]?.joined);
if (s.members.garrick?.joined) err('Garrick sigue en el gremio al final');
for (const id of ['bram', 'lysa', 'kaela', 'odric', 'pip', 'seren', 'vael']) if (!joined.includes(id)) err(`${id} no se ha unido al final`);
if (s.unlockedClasses.length < 7) err(`Aren solo tiene ${s.unlockedClasses.length} clases al final`);

// ---------------------------------------------------------------- secundarias: ¿se pueden hacer?
// Al final de la historia, todas las localidades tienen que ser alcanzables por rutas abiertas.
const reach = new Set(['bastion_gris']);
for (let changed = true; changed; ) {
  changed = false;
  for (const r of ROUTES) {
    if (!hasFlags(s, r.requires)) continue;
    for (const [a, b] of [[r.a, r.b], [r.b, r.a]]) if (reach.has(a) && !reach.has(b)) (reach.add(b), (changed = true));
  }
}
for (const l of Object.values(LOCATIONS)) if (l.kind !== 'torre' && !reach.has(l.id)) err(`${l.id}: no se llega por ninguna ruta`);
// Mazmorras con entrada: un punto en el mapa, una ruta, una ciudad tomada o ser un tramo de alguna de ellas.
const entered = new Set<string>();
for (const id of [...DUNGEON_SPOTS.map((d) => d.dungeon), ...ROUTES.map((r) => r.dungeon), ...Object.values(LOCATIONS).flatMap((l) => (l.taken ? [l.taken.dungeon] : []))])
  for (const d of dungeonChain(id)) entered.add(d.id);
const chainOf = (id: string) => [...entered].filter((e) => dungeonChain(e).some((d) => d.id === id)).flatMap((e) => dungeonChain(e));
let sides = 0;
for (const q of QUESTS.filter((x) => x.type === 'side')) {
  sides++;
  const o = q.objective;
  if (q.member && !MEMBERS[q.member]) err(`${q.id}: compañero ${q.member} no existe`);
  for (const f of q.requires) if (!s.flags.includes(f)) err(`${q.id}: el requisito ${f} nunca se cumple`);
  if ('dungeon' in o && o.dungeon && !entered.has(o.dungeon)) err(`${q.id}: no hay forma de entrar en ${o.dungeon}`);
  if (o.kind === 'kill') {
    const where = o.dungeon ? chainOf(o.dungeon).filter((d) => d.id === o.dungeon) : Object.values(DUNGEONS).filter((d) => !d.practice && entered.has(d.id));
    if (!where.some((d) => d.monsters.some((m) => m.id === o.monster))) err(`${q.id}: ${o.monster} no sale en ${o.dungeon ?? 'ninguna mazmorra'}`);
  }
  if (o.kind === 'collect' && ITEMS[o.item]?.kind !== 'quest') err(`${q.id}: ${o.item} no es un objeto de misión`);
  if (o.kind === 'rescue' && o.floor > DUNGEONS[o.dungeon].floors) err(`${q.id}: ${o.dungeon} no tiene piso ${o.floor}`);
}
// Las personales solo avanzan con su compañero en el equipo.
s.quests.sq_seren = { status: 'active', progress: 0 };
s.party = ['aren', 'bram'];
onDungeonClear(s, 'cenizas_altas');
if (s.quests.sq_seren.status !== 'active') err('sq_seren avanza sin Seren en el equipo');
s.party = ['aren', 'seren'];
onDungeonClear(s, 'cenizas_altas');
if (s.quests.sq_seren.status !== 'ready') err('sq_seren no avanza con Seren en el equipo');
const perTown = new Map<string, number>();
for (const q of QUESTS) if (q.giver) perTown.set(q.giver, (perTown.get(q.giver) ?? 0) + 1);
for (const l of Object.values(LOCATIONS)) if (l.kind !== 'torre' && !perTown.get(l.id)) err(`${l.id}: no tiene misiones secundarias`);
// Cada pueblo, de 1 a 5 mazmorras propias; cada mazmorra (con sus tramos), de 2 a 5 secundarias.
for (const l of Object.values(LOCATIONS)) {
  if (l.kind === 'torre') continue;
  const n = DUNGEON_SPOTS.filter((sp) => sp.from === l.id).length;
  if (n < 1 || n > 5) err(`${l.id}: tiene ${n} mazmorras propias (deben ser de 1 a 5)`);
}
const entries = new Set([...DUNGEON_SPOTS.map((d) => d.dungeon), ...ROUTES.map((r) => r.dungeon), ...Object.values(LOCATIONS).flatMap((l) => (l.taken ? [l.taken.dungeon] : []))]);
let minQ = 99;
let maxQ = 0;
for (const id of entries) {
  if (DUNGEONS[id].practice) continue;
  const ids = dungeonChain(id).map((d) => d.id);
  const n = QUESTS.filter((q) => q.type === 'side' && 'dungeon' in q.objective && !!q.objective.dungeon && ids.includes(q.objective.dungeon)).length;
  minQ = Math.min(minQ, n);
  maxQ = Math.max(maxQ, n);
  if (n < 2 || n > 5) err(`${id}: tiene ${n} secundarias (deben ser de 2 a 5)`);
}
console.log(`Secundarias por mazmorra: de ${minQ} a ${maxQ}`);

console.log(log.join('\n'));
console.log(`\nSecundarias: ${sides} · por pueblo: ${[...perTown].map(([l, n]) => `${l} ${n}`).join(', ')}`);
console.log(`\nGremio al final: ${joined.join(', ')} · clases de Aren: ${s.unlockedClasses.join(', ')}`);
if (errors.length) {
  console.log(`\n${errors.length} errores:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log('\nHistoria completa: se puede jugar de principio a fin.');
