import { MEMBERS } from '../data/characters';
import { TACTICS, type TacticId } from '../data/tactics';
import { tacticOf, type GameState } from '../core/state';
import { memberSprite } from '../core/stats';
import { modalMenu } from './dom';

/** Elegir la estrategia de cada aliado (se usa dentro de la mazmorra y desde el gremio). */
export async function tacticsMenu(state: GameState, ids: string[]): Promise<void> {
  let start = 0;
  const all = Object.keys(TACTICS) as TacticId[];
  for (;;) {
    const items = ids.map((id) => ({ label: MEMBERS[id].name, right: TACTICS[tacticOf(state, id)].name, icon: memberSprite(state, id), desc: TACTICS[tacticOf(state, id)].desc }));
    const r = await modalMenu('Tácticas del grupo', [...items, { label: 'Volver' }], { start });
    if (r < 0 || r >= ids.length) return;
    start = r;
    const id = ids[r];
    const current = tacticOf(state, id);
    const t = await modalMenu(`Táctica de ${MEMBERS[id].name}`, all.map((tid) => ({ label: TACTICS[tid].name, desc: TACTICS[tid].desc, cls: tid === current ? 'current' : '' })), { start: all.indexOf(current) });
    if (t >= 0) state.tactics[id] = all[t];
  }
}
