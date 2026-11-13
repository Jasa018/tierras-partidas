/**
 * Simulador sin interfaz: juega mazmorras con un "piloto automático" sencillo para detectar errores
 * y tener una idea del balance. Uso: npm run sim
 */
import { DUNGEONS } from '../src/data/dungeons';
import { MEMBERS } from '../src/data/characters';
import { EQUIPMENT } from '../src/data/equipment';
import { joinMember } from '../src/core/stats';
import { newGame, type GameState } from '../src/core/state';
import { DungeonRun } from '../src/dungeon/run';
import { DIRS8, cheb, dirTo } from '../src/dungeon/types';

// Node (el proyecto no instala @types/node).
declare const process: { argv: string[]; exit(code: number): never };

let stuckTurns = 0;

function autoplay(run: DungeonRun, maxTurns = 4000): string {
  let guard = 0;
  while (!run.result && guard++ < maxTurns) {
    const L = run.leader;
    // Las mazmorras sin fin se prueban hasta pasar el primer guardián.
    if (run.steppedOnStairs) { if (run.def.infinite && run.floor >= 10) run.exitTower(); else { if (run.campAhead) run.campRest(); run.descend(); } continue; }
    if (run.pendingChoice) { run.resolveChoice(run.autoChoice()); continue; }
    // Condiciones que piden ir a sitios concretos (escolta, faros, colores, cajas, vigías): las resuelve el piloto completo.
    if (run.goal && ['escolta', 'faros', 'colores', 'cajas', 'vigias'].includes(run.goal.kind) && (!run.goal.done || run.goal.kind === 'vigias')) {
      if (run.autoAction()) run.leaderWait();
      run.drainEvents();
      continue;
    }
    const heal = ['pocion_suprema', 'pocion_mayor', 'pocion'].find((i) => run.state.bag[i]);
    if (L.hp / L.maxHp < 0.35 && heal) { run.useItem(heal, L.id); continue; }
    const food = ['racion', 'pan'].find((i) => run.state.bag[i]);
    if (run.belly < 15 && food) { run.useItem(food); continue; }
    // El feto del trono no se puede herir mientras vivan sus capitanes: a por ellos.
    const foes = run.enemies.filter((e) => !run.warded(e));
    const adj = foes.find((e) => cheb(e, L) === 1);
    if (adj) {
      ({ dx: L.fx, dy: L.fy } = dirTo(L, adj));
      if (L.skills[0] && L.sp >= 3 && Math.random() < 0.4) run.leaderSkill(0); else run.leaderAttack();
      continue;
    }
    // ir a las escaleras (si están abiertas), o a cumplir la condición del piso, o hacia el jefe
    const g = run.goal && !run.goal.done ? run.goal : null;
    const forGoal = g && (g.spots.find((s) => !s.on) ?? run.items.find((i) => i.id === 'llave_escalera') ?? run.enemies.find((e) => e.elite) ?? run.enemies.find((e) => !e.reaper));
    const boss = run.boss && run.warded(run.boss) ? foes.find((e) => e.guard) : run.boss;
    const goal = run.stairsOpen ? run.stairs : (forGoal || boss || run.stairs);
    let step = run.pathStep(L, goal.x, goal.y, 'all');
    // Escaleras tras un candado: ir a por una llave alcanzable, o a una puerta que podamos abrir.
    for (const k of run.items.filter((i) => i.id.startsWith('llave_'))) if (!step) step = run.pathStep(L, k.x, k.y, 'all');
    for (const [idx, color] of run.doors) if (!step && run.keys.includes(color)) step = run.pathStep(L, idx % run.map.w, Math.floor(idx / run.map.w), 'all');
    // Escaleras tapiadas: ir junto a una grieta y romperla.
    if (!step) {
      const W = run.map.w;
      for (const [i, kind] of run.map.special) {
        if (step || kind !== 'crack') continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = (i % W) + dx;
          const ny = Math.floor(i / W) + dy;
          if (!run.passable(nx, ny)) continue;
          if (L.x === nx && L.y === ny) {
            L.fx = -dx;
            L.fy = -dy;
            run.leaderAttack();
            step = { dx: 0, dy: 0, len: 0 };
            break;
          }
          step = run.pathStep(L, nx, ny, 'all');
          if (step) break;
        }
      }
      if (step && !step.dx && !step.dy) {
        run.drainEvents();
        continue;
      }
    }
    if (!step) stuckTurns++;
    const d = step ?? DIRS8[Math.floor(Math.random() * 8)];
    if (!run.leaderMove(d.dx, d.dy)) run.leaderWait();
    run.drainEvents();
  }
  return run.result ?? 'timeout';
}

function makeState(level: number, party: string[], prestige = 0, gear: string[] = []): GameState {
  const s = newGame();
  for (const id of party) if (!s.members[id]) joinMember(s, id);
  for (const id of party) {
    s.members[id].level = level;
    s.members[id].prestige = prestige;
    // El equipo del acto: el arma de su tipo, una armadura y un accesorio.
    const pick = (slot: string) => gear.find((g) => EQUIPMENT[g].slot === slot && (slot !== 'weapon' || EQUIPMENT[g].kind === MEMBERS[id].weapon));
    if (gear.length) s.members[id].gear = { weapon: pick('weapon') ?? s.members[id].gear.weapon, armor: pick('armor'), accessory: pick('accessory') };
  }
  s.party = party;
  s.bag = gear.length ? { racion: 3, pocion_suprema: 3, pocion_mayor: 3 } : { pan: 4, pocion: 4 };
  return s;
}

// Equipo que se puede comprar en cada tramo de la historia (para los actos 3 a 8).
const G3 = ['cimitarra_sol', 'maza_cantera', 'baston_oasis', 'arco_duna', 'aguijon', 'lanza_albar', 'coraza_arena', 'anillo_sol'];
const G4 = ['espada_hueso', 'martillo_osario', 'baston_coral', 'arco_coral', 'daga_marea', 'tridente', 'coraza_coral', 'anillo_osario'];
const G5 = ['hoja_ocaso', 'martillo_dis', 'baston_serafin', 'arco_pluma', 'daga_ceniza', 'lanza_dis', 'armadura_dis', 'anillo_rey'];
const A3 = ['aren', 'bram', 'lysa', 'garrick'];
const A5 = ['aren', 'bram', 'lysa', 'seren'];
const A6 = ['aren', 'lysa', 'seren', 'vael'];

const plan: [string, number, string[], number?, string[]?][] = [
  ['cueva_goteante', 2, ['aren', 'bram']],
  ['sendero_lodoso', 3, ['aren', 'bram']],
  ['bosque_espinas', 5, ['aren', 'bram', 'garrick']],
  ['ruinas_santuario', 7, ['aren', 'bram', 'garrick']],
  ['templo_sectario', 13, ['aren', 'bram', 'garrick', 'lysa']],
  ['hondonada_frontera', 10, ['aren', 'bram', 'garrick', 'lysa']],
  ['paso_cuervo', 12, ['aren', 'bram', 'garrick', 'lysa']],
  ['cienaga_niebla', 14, ['aren', 'bram', 'lysa', 'garrick']],
  ['llanura_plumas', 16, ['aren', 'bram', 'lysa', 'garrick']],
  ['babel_llaves', 8, ['aren', 'bram', 'lysa', 'garrick']],
  ['babel_condiciones', 8, ['aren', 'bram', 'lysa', 'garrick']],
  ['babel_travesia', 8, ['aren', 'bram', 'lysa', 'garrick']],
  ['babel_trampas', 8, ['aren', 'bram', 'lysa', 'garrick']],
  ['babel_elementos', 8, ['aren', 'bram', 'lysa', 'garrick']],
  ['babel_infinita', 8, ['aren', 'bram', 'lysa', 'garrick']],
  // ---------- Actos 3 a 8: nivel, prestigio y equipo que tendría un jugador normal en ese punto
  ['lago_juncos', 16, ['aren', 'bram', 'lysa', 'kaela'], 0, G3],
  ['dunas_errantes', 17, A3, 0, G3],
  ['pozos_envenenados', 18, A3, 0, G3],
  ['fortin_hueso', 19, A3, 0, G3],
  ['paso_helado', 20, A3, 0, G3],
  ['bastion_morgath', 20, A3, 0, G3],
  ['gran_grieta', 20, A3, 0, G3],
  ['yermo_ceniza', 18, ['aren', 'bram', 'lysa', 'kaela'], 1, G3],
  ['escalera_huesos', 20, ['aren', 'bram', 'lysa', 'kaela'], 1, G4],
  ['solmarena_tomada', 20, A5, 1, G4],
  ['bastion_tomado', 20, A5, 1, G4],
  ['arrecife', 20, A5, 1, G4],
  ['bastion_negro', 20, A6, 2, G4],
  ['circulo_ceniza', 20, A6, 2, G5],
  ['ciudadela_dis', 20, A6, 2, G5],
  ['torre_voz', 20, A6, 2, G5],
  ['trono_alba', 20, A6, 3, G5],
];

const only = process.argv[2];
for (const [id, lv, party, prestige, gear] of plan) {
  if (only && !id.includes(only) && !(only === 'late' && gear)) continue;
  const results: Record<string, number> = {};
  let turns = 0;
  const mats: Record<string, number> = {};
  const N = 20;
  for (let i = 0; i < N; i++) {
    const run = new DungeonRun(makeState(lv, party, prestige, gear), id, 1000 + i);
    const r = autoplay(run);
    const key = r === 'death' ? (run.belly <= 0 ? 'hambre' : `muerte_${run.chain.length > 1 ? `t${run.stage}` : ''}p${run.floor}`) : r;
    results[key] = (results[key] ?? 0) + 1;
    turns += run.turn;
    if (r === 'clear') for (const [m, q] of Object.entries(run.materials)) mats[m] = (mats[m] ?? 0) + q;
  }
  console.log(`${DUNGEONS[id].name.padEnd(30)} lv${lv}${prestige ? ` P${prestige}` : ''} ${JSON.stringify(results)} turnos medios ${Math.round(turns / N)} · sin camino ${stuckTurns}`);
  const wins = results.clear ?? 0;
  if (wins) console.log(`  materiales por incursión completada: ${Object.entries(mats).map(([m, q]) => `${m} ${(q / wins).toFixed(1)}`).join(', ') || '-'}`);
  stuckTurns = 0;
}
