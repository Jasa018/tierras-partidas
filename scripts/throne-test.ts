/**
 * La batalla final con el piloto automático: el feto (5×5) es inmune mientras viva algún capitán, los revive si se
 * tarda, queda vulnerable al caer los cuatro e invoca criaturas. Comprueba que el ciclo funciona y que se puede ganar.
 * Uso: npm run throne-test
 */
import { MEMBERS } from '../src/data/characters';
import { EQUIPMENT } from '../src/data/equipment';
import { joinMember } from '../src/core/stats';
import { newGame, type GameState } from '../src/core/state';
import { DungeonRun } from '../src/dungeon/run';
import { cheb } from '../src/dungeon/types';

declare const process: { argv: string[]; exit(code: number): never };

const G5 = ['hoja_ocaso', 'martillo_dis', 'baston_serafin', 'arco_pluma', 'daga_ceniza', 'lanza_dis', 'armadura_dis', 'anillo_rey'];

function makeState(): GameState {
  const s = newGame();
  const party = ['aren', 'lysa', 'seren', 'vael'];
  for (const id of party) if (!s.members[id]) joinMember(s, id);
  for (const id of party) {
    const m = s.members[id];
    m.level = 20;
    m.prestige = 3;
    const pick = (slot: string) => G5.find((g) => EQUIPMENT[g].slot === slot && (slot !== 'weapon' || EQUIPMENT[g].kind === MEMBERS[id].weapon));
    m.gear = { weapon: pick('weapon') ?? m.gear.weapon, armor: pick('armor'), accessory: pick('accessory') };
  }
  s.party = party;
  s.bag = { racion: 3, pocion_suprema: 3, pocion_mayor: 3 };
  return s;
}

const N = Number(process.argv[2] ?? 10);
const results: Record<string, number> = {};
let problems = 0;
const seen = { inmune: 0, ventana: 0, revive: 0, invoca: 0 };
for (let i = 0; i < N; i++) {
  const run = new DungeonRun(makeState(), 'trono_dios', 7000 + i);
  run.startFloor(2);
  const boss = run.boss!;
  const guards = run.actors.filter((a) => a.guard);
  if (boss.w !== 5 || boss.h !== 5) (problems++, console.log('El feto no ocupa 5×5'));
  if (guards.length !== 4) (problems++, console.log(`Capitanes: ${guards.length}`));
  // Nadie encima de nadie.
  const alive = run.actors.filter((a) => a.alive);
  for (const a of alive) for (const b of alive) if (a !== b && cheb(a, b) === 0) (problems++, console.log(`Solapados: ${a.name} y ${b.name}`));
  for (let t = 0; t < 4000 && !run.result && boss.alive; t++) {
    if (run.steppedOnStairs) break;
    const why = run.autoAction();
    for (const e of run.drainEvents()) {
      if (e.t !== 'log') continue;
      if (e.text.includes('no recibe daño')) seen.inmune++;
      if (e.text.includes('Han caído los cuatro')) seen.ventana++;
      if (e.text.includes('vuelve a levantarse')) seen.revive++;
      if (e.text.includes('del vacío sale')) seen.invoca++;
    }
    if (why) {
      console.log(`semilla ${7000 + i}: se detuvo (${why})`);
      problems++;
      break;
    }
  }
  const key = !boss.alive ? 'victoria' : run.result ?? 'sin terminar';
  results[key] = (results[key] ?? 0) + 1;
  console.log(`semilla ${7000 + i}: ${key} en ${run.turn} turnos · feto ${boss.hp}/${boss.maxHp} · capitanes vivos ${guards.filter((g) => g.alive).length}`);
}
console.log(JSON.stringify(results), JSON.stringify(seen));

// Desfile de jefes: cuántos jefes salen por piso, Dios siempre con sus cuatro capitanes y nadie encima de nadie.
let withGod = 0;
for (let i = 0; i < 40; i++) {
  const run = new DungeonRun(makeState(), 'babel_jefes', 9000 + i);
  for (const floor of [1, 6, 12, 15]) {
    run.startFloor(floor);
    const bosses = run.actors.filter((a) => a.alive && a.boss);
    const want = floor >= 12 ? 3 : floor >= 6 ? 2 : 1;
    if (bosses.length !== want) (problems++, console.log(`Desfile piso ${floor}: ${bosses.length} jefes (esperados ${want})`));
    const god = bosses.find((b) => b.ward);
    if (god) {
      withGod++;
      const guards = run.actors.filter((a) => a.alive && a.guard).length;
      if (guards !== 4) (problems++, console.log(`Desfile piso ${floor}: Dios con ${guards} capitanes`));
      if (!run.warded(god)) (problems++, console.log('Desfile: Dios no es inmune con sus capitanes'));
    }
    const alive = run.actors.filter((a) => a.alive);
    for (const a of alive) for (const b of alive) if (a !== b && cheb(a, b) === 0) (problems++, console.log(`Desfile piso ${floor}: solapados ${a.name} y ${b.name}`));
  }
}
console.log(`Desfile: 160 pisos revisados, Dios salió ${withGod} veces (siempre con sus capitanes).`);
if (problems) process.exit(1);
