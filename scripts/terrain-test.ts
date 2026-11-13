/**
 * Comprueba que con hielo (resbalar), barro, corrientes, telarañas y escaleras tapiadas con grietas
 * siempre se puede llegar a las escaleras. Un piloto sin enemigos planifica con la misma regla de resbalar,
 * se mueve con los controles reales y rompe las grietas que encuentre. Uso: npm run terrain-test
 */
import { DUNGEONS } from '../src/data/dungeons';
import { terrainOfCode } from '../src/data/terrain';
import { joinMember } from '../src/core/stats';
import { newGame } from '../src/core/state';
import { FLOOR, isFloor } from '../src/dungeon/generator';
import { DungeonRun } from '../src/dungeon/run';
import { DIRS8 } from '../src/dungeon/types';

const SEEDS = 40;
const DUNGEON_IDS = ['paso_cuervo', 'ruinas_santuario', 'cueva_goteante', 'cienaga_niebla', 'babel_terrenos'];

/** Primer paso de un camino a las escaleras con resbalones (o null si no hay). */
function plan(run: DungeonRun): { dx: number; dy: number } | null {
  const m = run.map;
  const W = m.w;
  const L = run.leader;
  // Como haría un jugador: no volver a pisar trampas ya descubiertas.
  const trap = (x: number, y: number) => !!run.traps.get(y * W + x)?.revealed;
  const open = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < m.h && !trap(x, y) && (m.tiles[y * W + x] === FLOOR || m.special.get(y * W + x) === 'crack');
  const floor = (x: number, y: number) => isFloor(m, x, y);
  const ice = (x: number, y: number) => terrainOfCode(m.terrain[y * W + x]) === 'hielo';
  const corners = (x: number, y: number, dx: number, dy: number) => !dx || !dy || (floor(x + dx, y) && floor(x, y + dy));
  const goal = run.stairs.y * W + run.stairs.x;
  const first = new Int16Array(W * m.h).fill(-1);
  const start = L.y * W + L.x;
  const q = [start];
  first[start] = 99;
  for (let qi = 0; qi < q.length; qi++) {
    const cur = q[qi];
    if (cur === goal) return DIRS8[first[cur]];
    const cx = cur % W;
    const cy = Math.floor(cur / W);
    for (let k = 0; k < 8; k++) {
      const d = DIRS8[k];
      let x = cx + d.dx;
      let y = cy + d.dy;
      if (!open(x, y) || !corners(cx, cy, d.dx, d.dy)) continue;
      // Una grieta se rompe y se pasa, sin resbalar más allá.
      if (floor(x, y)) while (ice(x, y) && floor(x + d.dx, y + d.dy) && corners(x, y, d.dx, d.dy)) {
        x += d.dx;
        y += d.dy;
      }
      const i = y * W + x;
      if (first[i] < 0) {
        first[i] = cur === start ? k : first[cur];
        q.push(i);
      }
    }
  }
  return null;
}

let floors = 0;
let reached = 0;
let sealed = 0;
let iceFloors = 0;
const fails: string[] = [];

for (const id of DUNGEON_IDS) {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const s = newGame();
    for (const p of ['garrick']) joinMember(s, p);
    s.party = ['aren', 'garrick'];
    const run = new DungeonRun(s, id, seed * 31 + 7);
    const floorsHere = Math.min(3, DUNGEONS[id].floors);
    for (let f = 0; f < floorsHere && !run.result; f++) {
      // Los pisos con candados ya los cubre locks-test, y los que tienen condición, auto-test (este piloto no las cumple).
      if (run.doors.size || (run.goal && !run.goal.done)) {
        if (run.isBossFloor || run.result) break;
        run.descend();
        continue;
      }
      floors++;
      run.actors = run.actors.filter((a) => a === run.leader);
      run.belly = 100;
      const m = run.map;
      if ([...m.terrain].some((c) => terrainOfCode(c) === 'hielo')) iceFloors++;
      // ¿Tapiada? Sin contar las grietas como paso, no se llegaría.
      const cracks = [...m.special].filter(([, k]) => k === 'crack').map(([i]) => i);
      for (const i of cracks) m.special.delete(i);
      if (!run.stairsReachable(run.leader)) sealed++;
      for (const i of cracks) m.special.set(i, 'crack');

      let ok = false;
      let why = 'tiempo agotado';
      const reachable0 = run.stairsReachable(run.leader);
      const hist: string[] = [];
      for (let t = 0; t < 1500 && !run.result; t++) {
        run.actors = run.actors.filter((a) => a === run.leader);
        run.leader.maxHp = 99999;
        run.leader.hp = 99999;
        run.leader.statuses = {};
        if (run.leader.x === run.stairs.x && run.leader.y === run.stairs.y && run.stairsOpen) {
          ok = true;
          break;
        }
        // Un hoyo le ha llevado a un piso con condición: también cuenta como avanzar (esos los prueba auto-test).
        if (run.goal && !run.goal.done) {
          ok = true;
          break;
        }
        const step = plan(run);
        if (!step) {
          why = `sin camino desde (${run.leader.x},${run.leader.y})`;
          break;
        }
        const L = run.leader;
        // Un hoyo puede haber cambiado de piso: usar siempre el mapa actual.
        const m = run.map;
        hist.push(`${L.x},${L.y}${terrainOfCode(m.terrain[L.y * m.w + L.x])?.[0] ?? ''}>${step.dx},${step.dy}`);
        if (hist.length > 10) hist.shift();
        const tx = L.x + step.dx;
        const ty = L.y + step.dy;
        if (m.special.get(ty * m.w + tx) === 'crack') {
          L.fx = step.dx;
          L.fy = step.dy;
          run.leaderAttack();
        } else if (!run.leaderMove(step.dx, step.dy)) run.leaderWait();
        run.drainEvents();
        run.steppedOnStairs = false;
      }
      if (ok) reached++;
      else fails.push(`${id} semilla ${seed} piso ${run.floor}: ${why} (alcanzable al empezar: ${reachable0}) escaleras ${run.stairs.x},${run.stairs.y} · ${hist.join(' ')}`);
      if (run.isBossFloor || run.result) break;
      run.descend();
    }
  }
}

console.log(`Pisos: ${floors} · llegados a las escaleras: ${reached}/${floors} · con hielo: ${iceFloors} · escaleras tapiadas con grietas: ${sealed}`);
if (fails.length) throw new Error(`No se llegó a las escaleras:\n${fails.slice(0, 15).join('\n')}`);
console.log('Sin errores.');
