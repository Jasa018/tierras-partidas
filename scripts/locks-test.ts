/**
 * Comprueba que los pisos con candados siempre tienen solución:
 * un piloto sin enemigos recorre el Laberinto de candados recogiendo llaves y abriendo puertas.
 * Uso: npm run locks-test
 */
import { joinMember } from '../src/core/stats';
import { newGame } from '../src/core/state';
import { DungeonRun } from '../src/dungeon/run';

const SEEDS = 60;
let solved = 0;
const stuck: string[] = [];

for (let seed = 1; seed <= SEEDS; seed++) {
  const s = newGame();
  for (const id of ['garrick', 'lysa']) joinMember(s, id);
  s.party = ['aren', 'bram', 'garrick', 'lysa'];
  for (const id of s.party) s.members[id].level = 30;
  const run = new DungeonRun(s, 'babel_llaves', seed);
  const onlyParty = () => (run.actors = run.actors.filter((a) => a.side === 'party'));
  onlyParty();
  let noPath = 0;
  for (let t = 0; t < 4000 && !run.result && noPath < 20; t++) {
    run.belly = 100;
    onlyParty();
    const L = run.leader;
    if (run.steppedOnStairs) {
      // La mazmorra es infinita: basta con resolver los primeros 6 pisos (antes del guardián).
      if (run.floor >= 6) run.exitTower();
      else run.descend();
      continue;
    }
    let step = run.pathStep(L, run.stairs.x, run.stairs.y, 'all');
    for (const k of run.items.filter((i) => i.id.startsWith('llave_'))) if (!step) step = run.pathStep(L, k.x, k.y, 'all');
    for (const [idx, color] of run.doors) if (!step && run.keys.includes(color)) step = run.pathStep(L, idx % run.map.w, Math.floor(idx / run.map.w), 'all');
    if (!step) {
      noPath++;
      run.leaderWait();
    } else {
      noPath = 0;
      run.leaderMove(step.dx, step.dy);
    }
    run.drainEvents();
  }
  if (run.result === 'clear') solved++;
  else stuck.push(`semilla ${seed} (piso ${run.floor}, puertas ${[...new Set(run.doors.values())].join('/') || '-'}, llaves en mano ${run.keys.join('/') || '-'})`);
}

console.log(`Laberinto de candados: ${solved}/${SEEDS} resueltos`);
for (const s of stuck) console.log('  sin solución:', s);
