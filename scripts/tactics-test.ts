/**
 * Un aliado lejos del líder, con un enemigo al lado que el líder no ve: debe defenderse
 * (y no darle la espalda para volver con el grupo). Se prueba con cada táctica. Uso: npm run tactics-test
 */
import { TACTICS, type TacticId } from '../src/data/tactics';
import { joinMember } from '../src/core/stats';
import { newGame } from '../src/core/state';
import { DungeonRun } from '../src/dungeon/run';
import { DIRS8, cheb } from '../src/dungeon/types';

for (const tactic of Object.keys(TACTICS) as TacticId[]) {
  let defended = 0;
  let fled = 0;
  const N = 30;
  for (let seed = 1; seed <= N; seed++) {
    const s = newGame();
    joinMember(s, 'garrick');
    s.party = ['aren', 'garrick'];
    s.tactics.garrick = tactic;
    const run = new DungeonRun(s, 'cueva_goteante', seed);
    const L = run.leader;
    const ally = run.party.find((a) => a.memberId === 'garrick')!;
    run.actors = run.actors.filter((a) => a.side === 'party');
    // Llevar al aliado a una sala lejana y ponerle un limo al lado.
    const far = run.map.rooms.map((r) => ({ x: r.x + 1, y: r.y + 1 })).sort((a, b) => cheb(b, L) - cheb(a, L))[0];
    ally.x = far.x;
    ally.y = far.y;
    const spot = DIRS8.map((d) => ({ x: far.x + d.dx, y: far.y + d.dy })).find((p) => run.passable(p.x, p.y) && !run.actorAt(p.x, p.y))!;
    (run as any).spawnEnemy(false);
    const enemy = run.enemies[0];
    enemy.x = spot.x;
    enemy.y = spot.y;
    const hp0 = enemy.hp;
    run.updateFov();
    run.leaderWait();
    const ev = run.drainEvents();
    const allyActed = ev.some((e) => (e.t === 'bump' && e.id === ally.id) || (e.t === 'log' && e.text.startsWith(`${ally.name} usa`)));
    if (enemy.hp < hp0 || !enemy.alive || allyActed) defended++;
    if (enemy.alive && cheb(ally, enemy) > 1) fled++;
  }
  console.log(`${TACTICS[tactic].name.padEnd(18)} actúa contra el enemigo en ${defended}/${N} · le da la espalda en ${fled}/${N}`);
}
