import { FEATURES } from '../data/features';
import type { GameState } from '../core/state';
import { alertBox, type MenuItem } from './dom';

/** ¿Está desbloqueada esta función? */
export const unlocked = (state: GameState, id: string) => {
  const f = FEATURES[id];
  if (f?.upgrade && !state.upgrades[f.upgrade]) return false;
  return !f?.flag || state.flags.includes(f.flag);
};

/** Desbloqueada y todavía sin abrir. */
export const isNew = (state: GameState, id: string) => unlocked(state, id) && !!FEATURES[id]?.flag && !state.seenFeatures.includes(id);

/** Opción de menú de una función: null si está bloqueada; con «¡Nuevo!» si aún no se ha abierto. */
export function featureItem(state: GameState, id: string, item: MenuItem): MenuItem | null {
  if (!unlocked(state, id)) return null;
  return isNew(state, id) ? { ...item, right: item.right ? `¡Nuevo! · ${item.right}` : '¡Nuevo!' } : item;
}

/** La primera vez que se abre una función nueva, explica para qué sirve. */
export async function introduce(state: GameState, id: string): Promise<void> {
  if (!isNew(state, id)) return;
  state.seenFeatures.push(id);
  await alertBox(`Nuevo: ${FEATURES[id].name}`, FEATURES[id].desc);
}
