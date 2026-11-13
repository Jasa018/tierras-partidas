/**
 * Comprueba grietas, murallas y salas secretas en Babel · Terrenos y muros:
 * las escaleras y el inicio nunca están en una sala secreta, la sala secreta solo se abre con una bomba
 * y, una vez abierta, se puede llegar a pie a su tesoro. Uso: npm run walls-test
 */
import { joinMember } from '../src/core/stats';
import { newGame } from '../src/core/state';
import { SECRET_BASE } from '../src/dungeon/generator';
import { DungeonRun } from '../src/dungeon/run';

const SEEDS = 60;
let floors = 0;
let secrets = 0;
let opened = 0;
let cracks = 0;
let crackBroken = 0;
const terrains = new Set<number>();
const errors: string[] = [];

for (let seed = 1; seed <= SEEDS; seed++) {
  const s = newGame();
  for (const id of ['garrick', 'lysa']) joinMember(s, id);
  s.party = ['aren', 'bram', 'garrick', 'lysa'];
  s.bag = { bomba: 3 };
  const run = new DungeonRun(s, 'babel_terrenos', seed);
  run.actors = run.actors.filter((a) => a.side === 'party');
  const m = run.map;
  const W = m.w;
  floors++;
  for (const c of m.terrain) if (c) terrains.add(c);
  if (m.roomAt[run.stairs.y * W + run.stairs.x] >= SECRET_BASE) errors.push(`semilla ${seed}: escaleras en sala secreta`);
  if (m.roomAt[run.leader.y * W + run.leader.x] >= SECRET_BASE) errors.push(`semilla ${seed}: inicio en sala secreta`);

  // Grieta: ponerse delante y golpearla.
  for (const [i, kind] of [...m.special]) {
    if (kind !== 'crack') continue;
    cracks++;
    const x = i % W;
    const y = Math.floor(i / W);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (!run.passable(x + dx, y + dy)) continue;
      run.leader.x = x + dx;
      run.leader.y = y + dy;
      run.leader.fx = -dx;
      run.leader.fy = -dy;
      run.leaderAttack();
      if (m.tiles[i]) crackBroken++;
      break;
    }
  }

  // Muralla: un golpe no basta; una bomba sí. Luego el tesoro tiene que ser alcanzable.
  for (const [i, kind] of [...m.special]) {
    if (kind !== 'hard') continue;
    secrets++;
    const x = i % W;
    const y = Math.floor(i / W);
    const side = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => run.passable(x + dx, y + dy) && m.roomAt[(y + dy) * W + x + dx] < SECRET_BASE);
    if (!side) {
      errors.push(`semilla ${seed}: muralla sin lado accesible`);
      continue;
    }
    const [dx, dy] = side;
    run.leader.x = x + dx;
    run.leader.y = y + dy;
    run.leader.fx = -dx;
    run.leader.fy = -dy;
    run.leaderAttack();
    if (m.tiles[i]) errors.push(`semilla ${seed}: la muralla se rompió con un golpe`);
    run.useItem('bomba');
    if (!m.tiles[i]) {
      errors.push(`semilla ${seed}: la bomba no rompió la muralla`);
      continue;
    }
    const treasure = run.items.find((it) => m.roomAt[it.y * W + it.x] >= SECRET_BASE);
    if (!treasure) errors.push(`semilla ${seed}: sala secreta sin tesoro`);
    else if (!run.pathStep(run.leader, treasure.x, treasure.y, 'all')) errors.push(`semilla ${seed}: tesoro inalcanzable tras abrir`);
    else opened++;
  }
  run.drainEvents();
}

const pct = (a: number, b: number) => `${a}/${b}`;
console.log(`Pisos: ${floors} · salas secretas: ${secrets} (abiertas y alcanzables ${pct(opened, secrets)}) · grietas: ${cracks} (rotas de un golpe ${pct(crackBroken, cracks)}) · tipos de terreno vistos: ${terrains.size}/4`);
if (errors.length) throw new Error(errors.slice(0, 20).join('\n'));
console.log('Sin errores.');
