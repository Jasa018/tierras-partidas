/** Mide si los aliados siguen al protagonista: distancia máxima y turnos atascados lejos. */
import { joinMember } from '../src/core/stats';
import { newGame } from '../src/core/state';
import { DungeonRun } from '../src/dungeon/run';
import { cheb } from '../src/dungeon/types';

const hist: Record<number, number> = {};
let far = 0, stuck = 0, samples = 0, worst = 0;
for (let seed = 1; seed <= 30; seed++) {
  const s = newGame();
  for (const id of ['garrick', 'lysa']) joinMember(s, id);
  s.party = ['aren', 'bram', 'garrick', 'lysa'];
  const run = new DungeonRun(s, 'cueva_goteante', seed);
  run.actors = run.actors.filter((a) => a.side === 'party'); // sin enemigos: solo movimiento
  const lastPos = new Map<number, { x: number; y: number; still: number }>();
  for (let t = 0; t < 150 && !run.result; t++) {
    const L = run.leader;
    if (run.steppedOnStairs) { run.descend(); run.actors = run.actors.filter((a) => a.side === 'party'); continue; }
    const st = run.pathStep(L, run.stairs.x, run.stairs.y, 'all');
    if (!st) break;
    run.leaderMove(st.dx, st.dy);
    run.drainEvents();
    for (const a of run.party) {
      if (a === L) continue;
      const d = cheb(a, L);
      samples++;
      worst = Math.max(worst, d);
      if (d > 3) far++;
      hist[d] = (hist[d] ?? 0) + 1;
      const p = lastPos.get(a.id);
      const still = p && p.x === a.x && p.y === a.y ? p.still + 1 : 0;
      if (still >= 2 && d > 2) stuck++;
      lastPos.set(a.id, { x: a.x, y: a.y, still });
    }
  }
}
console.log(`muestras ${samples} · lejos(>3) ${(100 * far / samples).toFixed(1)}% · atascado lejos ${(100 * stuck / samples).toFixed(1)}% · distancia peor ${worst}`);
console.log(hist);
