/**
 * Balance de la Parca: el grupo pelea contra ella (sin otros monstruos) a distintos niveles.
 * Debe ser casi imposible al nivel de la mazmorra y vencible con un grupo muy por encima.
 * Uso: npm run reaper-test
 */
import { DUNGEONS } from '../src/data/dungeons';
import { joinMember } from '../src/core/stats';
import { newGame } from '../src/core/state';
import { DungeonRun } from '../src/dungeon/run';
import { cheb } from '../src/dungeon/types';

const PARTY = ['aren', 'bram', 'garrick', 'lysa'];
const N = 20;

for (const [dungeon, levels] of [['bosque_espinas', [6, 12, 18]], ['hondonada_frontera', [11, 18, 25]]] as const) {
  for (const lv of levels) {
    let wins = 0;
    let turns = 0;
    for (let seed = 1; seed <= N; seed++) {
      const s = newGame();
      for (const id of PARTY) if (!s.members[id]) joinMember(s, id);
      for (const id of PARTY) s.members[id].level = lv;
      s.party = [...PARTY];
      s.bag = { pocion: 4 };
      const run = new DungeonRun(s, dungeon, seed);
      run.actors = run.actors.filter((a) => a.side === 'party');
      run.summonReaper();
      const R = run.reaper!;
      for (let t = 0; t < 600 && !run.result && R.alive; t++) {
        const L = run.leader;
        if (L.hp / L.maxHp < 0.3 && run.state.bag.pocion) run.useItem('pocion', L.id);
        else if (cheb(L, R) === 1) {
          L.fx = Math.sign(R.x - L.x);
          L.fy = Math.sign(R.y - L.y);
          if (L.skills[0] && L.sp >= 3) run.leaderSkill(0);
          else run.leaderAttack();
        } else run.leaderWait();
        run.drainEvents();
        turns++;
      }
      if (!R.alive) wins++;
    }
    console.log(`${DUNGEONS[dungeon].name.padEnd(26)} grupo nv${String(lv).padEnd(3)} gana ${wins}/${N} · turnos medios ${Math.round(turns / N)}`);
  }
}
