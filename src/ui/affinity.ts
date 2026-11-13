import { AFFINITY_LEVELS, AFFINITY_NAMES, BOND_PERKS, bondPerks, bondScene, effectText, levelFromPoints, pairOf } from '../data/affinity';
import { MEMBERS, PRESTIGE_MAX } from '../data/characters';
import { pairKey, type GameState } from '../core/state';
import { joinedMembers, memberStats } from '../core/stats';
import { alertBox, confirm, dialogue, h, img, menu } from './dom';
import { screen } from './layout';

/** Parejas de miembros del gremio (o solo de `ids`), en el orden del gremio. */
export function pairs(state: GameState, ids = joinedMembers(state)): [string, string][] {
  const out: [string, string][] = [];
  const order = Object.keys(MEMBERS).filter((id) => ids.includes(id));
  for (let i = 0; i < order.length; i++) for (let j = i + 1; j < order.length; j++) out.push([order[i], order[j]]);
  return out;
}

export const bondLevel = (state: GameState, a: string, b: string) => state.bondLevel[pairKey(a, b)] ?? 0;
export const bondPoints = (state: GameState, a: string, b: string) => state.affinity[pairKey(a, b)] ?? 0;
/** ¿Esta pareja alcanzó un nivel y aún no lo ha activado en la fogata? */
export const bondPending = (state: GameState, a: string, b: string) => levelFromPoints(bondPoints(state, a, b)) > bondLevel(state, a, b);

/** Parejas con fogata pendiente (entre `ids`, por defecto todo el gremio). */
export function pendingPairs(state: GameState, ids?: string[]): [string, string][] {
  return pairs(state, ids).filter(([a, b]) => bondPending(state, a, b));
}

const hearts = (n: number) => '♥'.repeat(n) + '♡'.repeat(AFFINITY_LEVELS.length - n);

/** Afiche de una pareja: retratos, nivel, progreso y ventajas conseguidas y por conseguir. */
function bondPoster(state: GameState, a: string, b: string): HTMLElement {
  const level = bondLevel(state, a, b);
  const pts = bondPoints(state, a, b);
  const next = AFFINITY_LEVELS[level];
  const pending = bondPending(state, a, b);
  const pct = next === undefined ? 100 : Math.min(100, Math.round((pts / next) * 100));
  const bar = h('div', 'bond-bar', h('div', 'bond-fill'));
  (bar.firstChild as HTMLElement).style.width = `${pct}%`;
  const gained = bondPerks(a, b, level);
  return h('div', 'bond-poster',
    h('div', 'bond-pics', img(memberStats(state, a).sprite, 6), h('div', 'bond-heart', hearts(level)), img(memberStats(state, b).sprite, 6)),
    h('div', 'bond-title', `${MEMBERS[a].name} y ${MEMBERS[b].name}`),
    h('div', 'bond-level', level ? AFFINITY_NAMES[level - 1] : 'Sin afinidad todavía'),
    a === 'aren' || b === 'aren'
      ? h('div', 'muted', state.partner && [a, b].includes(state.partner) ? '♥ Son pareja. Pulsa para dejar de serlo.' : partnerBlock(state, a === 'aren' ? b : a) ?? 'Afinidad máxima: pulsa para elegir pareja.')
      : '',
    bar,
    h('div', 'muted', next === undefined ? 'Afinidad máxima.' : pending ? '¡Fogata pendiente! Id a la posada para activar el nivel. Hasta entonces no sube más.' : `${pts}/${next} · sube con cada piso que recorren juntos.`),
    h('div', 'info-h', 'Ventajas cuando van juntos'),
    ...[1, 2, 3, 4].map((l) =>
      h('div', `bond-row ${l <= level ? 'ok' : 'locked'}`,
        h('b', '', `${hearts(l).slice(0, l)} ${AFFINITY_NAMES[l - 1]}`),
        ...pairOf(a, b).map((m) => {
          const p = BOND_PERKS[m][l - 1];
          return h('div', 'bond-perk', l <= level ? '✓ ' : '· ', h('span', '', `${p.name} (${MEMBERS[m].name}): `), effectText(p.effect));
        }),
      ),
    ),
    gained.length ? '' : h('p', 'muted', 'Las ventajas se suman: cada nivel añade las de los dos.'),
  );
}

/** Gremio → Afinidad del grupo: todas las parejas, con su afiche. */
export async function bondsScreen(state: GameState): Promise<void> {
  let start = 0;
  for (;;) {
    const s = screen('Afinidad del grupo', 'Parejas, niveles y ventajas', 'capital', 27, 'Ir juntos a las mazmorras sube la afinidad. Cada nivel se activa con una charla en la fogata de la posada.');
    const list = pairs(state).sort(([a, b], [c, d]) => bondLevel(state, c, d) - bondLevel(state, a, b) || bondPoints(state, c, d) - bondPoints(state, a, b));
    if (!list.length) {
      s.right.append(h('p', 'muted', 'Todavía no hay parejas en el gremio.'));
      await menu(s.left, [{ label: 'Volver' }]);
      return;
    }
    const items = list.map(([a, b]) => ({
      label: `${MEMBERS[a].name} ♥ ${MEMBERS[b].name}`,
      right: (a === 'aren' && state.partner === b) || (b === 'aren' && state.partner === a) ? '♥ Pareja' : bondPending(state, a, b) ? '¡Fogata!' : `${hearts(bondLevel(state, a, b))}`,
      desc: `${bondPoints(state, a, b)} puntos de afinidad.`,
    }));
    const show = (i: number) => {
      const p = list[i];
      if (p) s.right.replaceChildren(bondPoster(state, p[0], p[1]));
    };
    const r = await menu(s.left, [...items, { label: 'Volver' }], { start, onFocus: show });
    if (r < 0 || r >= list.length) return;
    start = r;
    // Con afinidad máxima con Aren, esa persona puede ser su pareja.
    const [a, b] = list[r];
    if (a !== 'aren' && b !== 'aren') continue;
    const other = a === 'aren' ? b : a;
    const why = partnerBlock(state, other);
    if (state.partner === other) {
      if (await confirm(`${MEMBERS[other].name} es la pareja de Aren. ¿Dejar de serlo?`, 'Dejar de ser pareja', 'Seguir juntos')) delete state.partner;
    } else if (why) await alertBox('Pareja', [why]);
    else if (await confirm(`¿Elegir a ${MEMBERS[other].name} como pareja de Aren?${state.partner ? `\n\n(Dejará de serlo ${MEMBERS[state.partner].name}.)` : ''}\n\nCambia lo que pasa con los dos en los tres finales.`, 'Elegir', 'Ahora no')) {
      state.partner = other;
      await alertBox('Pareja', [`${MEMBERS[other].name} y Aren son pareja.`, 'Puedes cambiarlo cuando quieras desde aquí.']);
    }
  }
}

/** Por qué no puede ser pareja de Aren (null si puede): hace falta afinidad máxima, y Pip tiene que ser adulto (Leyenda). */
export function partnerBlock(state: GameState, id: string): string | null {
  if (bondLevel(state, 'aren', id) < AFFINITY_LEVELS.length) return `Para que ${MEMBERS[id].name} sea pareja de Aren hace falta la afinidad máxima (${AFFINITY_NAMES[AFFINITY_LEVELS.length - 1]}) entre los dos.`;
  if (id === 'pip' && (state.members.pip?.prestige ?? 0) < PRESTIGE_MAX) return 'Pip todavía es un niño. Cuando llegue a Leyenda (prestigio 3) será adulto y podrá ser pareja de Aren.';
  return null;
}

/** Posada → Fogata: las charlas pendientes. Verlas activa el nivel de afinidad. */
export async function campfire(state: GameState, host: HTMLElement): Promise<void> {
  for (;;) {
    const ready = pendingPairs(state);
    if (!ready.length) {
      await alertBox('Fogata', ['Nadie tiene mucho que contar esta noche.', 'La afinidad sube con los pisos que recorréis juntos; al llegar a cada nivel, aquí os espera una charla.']);
      return;
    }
    const items = ready.map(([a, b]) => ({ label: `${MEMBERS[a].name} y ${MEMBERS[b].name}`, right: AFFINITY_NAMES[bondLevel(state, a, b)] }));
    const t = await menu(host, [...items, { label: 'Volver' }], { title: 'Fogata' });
    if (t < 0 || t >= ready.length) return;
    const [a, b] = ready[t];
    const level = bondLevel(state, a, b) + 1;
    await dialogue(bondScene(a, b, level));
    state.bondLevel[pairKey(a, b)] = level;
    const gained = bondPerks(a, b, level).filter((p) => p.level === level);
    await alertBox(`Afinidad: ${AFFINITY_NAMES[level - 1]}`, [
      `${MEMBERS[a].name} y ${MEMBERS[b].name} se entienden mejor. Cuando vayan juntos:`,
      ...gained.map((g) => `• ${g.perk.name} (${MEMBERS[g.member].name}): ${effectText(g.perk.effect)}.`),
      level < AFFINITY_LEVELS.length ? 'Su afinidad vuelve a subir en las próximas incursiones.' : 'Han llegado a la afinidad máxima.',
    ]);
  }
}
