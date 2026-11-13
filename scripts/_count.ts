import { DUNGEONS, dungeonChain } from '../src/data/dungeons';
import { QUESTS } from '../src/data/quests';
import { DUNGEON_SPOTS, LOCATIONS, ROUTES } from '../src/data/world';
for (const l of Object.values(LOCATIONS)) if (l.kind !== 'torre') console.log('pueblo', l.id.padEnd(16), DUNGEON_SPOTS.filter((s) => s.from === l.id).map((s) => s.dungeon).join(','));
const entries = new Set([...DUNGEON_SPOTS.map((s) => s.dungeon), ...ROUTES.map((r) => r.dungeon), ...Object.values(LOCATIONS).flatMap((l) => (l.taken ? [l.taken.dungeon] : []))]);
for (const e of entries) {
  if (DUNGEONS[e].practice) continue;
  const chain = dungeonChain(e).map((d) => d.id);
  const n = QUESTS.filter((q) => q.type === 'side' && 'dungeon' in q.objective && q.objective.dungeon && chain.includes(q.objective.dungeon)).length;
  console.log('mazmorra', e.padEnd(20), n);
}
