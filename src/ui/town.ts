import { MEMBERS } from '../data/characters';
import { DUNGEONS, dungeonChain } from '../data/dungeons';
import { ITEMS } from '../data/items';
import { QUESTS } from '../data/quests';
import { RETURN_TALK, SCENES, type Line } from '../data/story';
import { EXPEDITION_MAX, NEWS, PROJECTS, expeditionLength, type ProjectLevel } from '../data/town';
import { DUNGEON_SPOTS, LOCATIONS, ROUTES } from '../data/world';
import { hasFlag, hasFlags, type GameState } from '../core/state';
import { gainXp, joinedMembers, memberStats } from '../core/stats';
import { alertBox, confirm, dialogue, h, img, menu, toast, type MenuItem } from './dom';
import { screen } from './layout';

// ---------------------------------------------------------------- reconstrucción

/** Mejoras ya construidas de todos los proyectos (para aplicar sus efectos). */
function builtLevels(state: GameState): { where: string; level: ProjectLevel }[] {
  return PROJECTS.flatMap((p) => p.levels.slice(0, state.rebuild[p.id] ?? 0).map((level) => ({ where: p.where, level })));
}

/** Lo que vende la tienda de una localidad, con lo que añaden las reconstrucciones. */
export function townShop(state: GameState, loc: string): string[] {
  const extra = builtLevels(state).filter((b) => b.where === loc).flatMap((b) => b.level.shop ?? []);
  return [...new Set([...LOCATIONS[loc].shop, ...extra])];
}

/** Precio con el descuento de las reconstrucciones de esa localidad (tienda y herrería). */
export function townPrice(state: GameState, loc: string, base: number): number {
  const d = builtLevels(state).filter((b) => b.where === loc).reduce((a, b) => a + (b.level.discount ?? 0), 0);
  return Math.max(1, Math.round(base * (1 - d / 100)));
}

/** Oro de las mejoras de equipo, con el descuento de la forja de Vado. */
export function forgeGold(state: GameState, base: number): number {
  const d = builtLevels(state).reduce((a, b) => a + (b.level.forge ?? 0), 0);
  return Math.max(1, Math.round(base * (1 - d / 100)));
}

/** Al volver de una incursión: oro extra y regalos de los vecinos. Devuelve las líneas del resumen. */
export function rebuildRewards(state: GameState, goldFound: number, cleared: boolean): string[] {
  const out: string[] = [];
  const pct = builtLevels(state).reduce((a, b) => a + (b.level.goldBonus ?? 0), 0);
  const extra = Math.round((goldFound * pct) / 100);
  if (extra > 0) {
    state.gold += extra;
    out.push(`La fama de Vado os da ${extra} de oro más.`);
  }
  if (cleared)
    for (const b of builtLevels(state))
      for (const [id, q] of Object.entries(b.level.gift ?? {})) {
        state.storage[id] = (state.storage[id] ?? 0) + q;
        out.push(`Los vecinos de Vado os guardan ${ITEMS[id].name} x${q} en el almacén.`);
      }
  return out;
}

/** Proyectos que se pueden apoyar en esta localidad. */
export const projectsAt = (state: GameState, loc: string) => PROJECTS.filter((p) => p.where === loc && hasFlags(state, p.requires));

/** Ciudad → Reconstrucción: donar oro para levantar el pueblo. */
export async function rebuildScreen(state: GameState): Promise<void> {
  const loc = LOCATIONS[state.location];
  let start = 0;
  for (;;) {
    const s = screen('Reconstrucción', `${loc.name} · Oro: ${state.gold}`, loc.banner, 61, 'Cada moneda que donáis se convierte en muros, casas y tiendas. Y la gente lo recuerda.');
    const list = projectsAt(state, loc.id);
    const items: MenuItem[] = list.map((p) => {
      const lv = state.rebuild[p.id] ?? 0;
      const next = p.levels[lv];
      return { label: p.name, right: next ? `${next.cost} oro` : 'Completo', desc: next ? `Siguiente: ${next.name}. ${next.desc}` : 'Reconstrucción completada.', disabled: !next || state.gold < next.cost };
    });
    const show = (i: number) => {
      const p = list[i];
      if (!p) return;
      const lv = state.rebuild[p.id] ?? 0;
      s.right.replaceChildren(
        h('div', 'info-h', p.name),
        h('p', 'muted', p.desc),
        ...p.levels.map((l, k) => h('div', k < lv ? 'ok' : 'muted', `${k < lv ? '✓' : '·'} ${l.name} (${l.cost} oro): ${l.desc}`)),
      );
    };
    if (!list.length) s.right.append(h('p', 'muted', 'Aquí no hay nada que reconstruir todavía.'));
    const r = await menu(s.left, [...items, { label: 'Volver' }], { start, onFocus: show });
    if (r < 0 || r >= list.length) return;
    start = r;
    const p = list[r];
    const next = p.levels[state.rebuild[p.id] ?? 0];
    if (!(await confirm(`¿Donar ${next.cost} de oro para «${next.name}»?\n\n${next.desc}`, 'Donar', 'Ahora no'))) continue;
    state.gold -= next.cost;
    state.rebuild[p.id] = (state.rebuild[p.id] ?? 0) + 1;
    await alertBox(p.name, [`¡${next.name}!`, next.desc]);
  }
}

/** Lo que cuenta la descripción de la ciudad sobre sus obras. */
export function rebuildNote(state: GameState, loc: string): string {
  const done = PROJECTS.filter((p) => p.where === loc && (state.rebuild[p.id] ?? 0) > 0).map((p) => p.levels[(state.rebuild[p.id] ?? 1) - 1].name.toLowerCase());
  return done.length ? ` Obras terminadas: ${done.join(', ')}.` : '';
}

// ---------------------------------------------------------------- noticias

/** Siguiente paso de la historia, según la misión principal activa. */
export function nextStep(state: GameState): string | null {
  const q = QUESTS.find((x) => x.type === 'main' && state.quests[x.id]?.status === 'active');
  if (!q) return null;
  const o = q.objective;
  if (o.kind === 'visit') {
    // La ruta que sale de donde ya se ha estado (si no, cualquiera que llegue).
    const touches = ROUTES.filter((r) => (r.a === o.location || r.b === o.location) && hasFlags(state, r.requires));
    const route = touches.find((r) => hasFlag(state, `visit:${r.a === o.location ? r.b : r.a}`)) ?? touches[0];
    return `${q.name}: viaja a ${LOCATIONS[o.location].name}${route ? ` atravesando ${DUNGEONS[route.dungeon].name}` : ''}.`;
  }
  if (o.kind === 'clear') {
    const city = Object.values(LOCATIONS).find((l) => l.taken?.dungeon === o.dungeon);
    if (city) return `${q.name}: viaja a ${city.name} y libérala (la ciudad entera es una mazmorra).`;
    const spot = DUNGEON_SPOTS.find((d) => d.dungeon === o.dungeon);
    const route = ROUTES.find((r) => r.dungeon === o.dungeon);
    if (!spot && route) return `${q.name}: atraviesa ${DUNGEONS[o.dungeon].name}, el camino de ${LOCATIONS[route.a].name} a ${LOCATIONS[route.b].name}.`;
    return `${q.name}: llega al fondo de ${DUNGEONS[o.dungeon].name}${spot ? ` (se entra desde ${LOCATIONS[spot.from].name})` : ''}.`;
  }
  return `${q.name}: ${q.desc}`;
}

/** Ciudad → Noticias: qué se cuenta por aquí y qué conviene hacer ahora. */
export async function newsScreen(state: GameState): Promise<void> {
  const loc = LOCATIONS[state.location];
  const news = NEWS.filter((n) => (!n.where || n.where === loc.id) && hasFlags(state, n.requires) && !(n.until ?? []).some((f) => state.flags.includes(f)));
  const s = screen('Noticias', loc.name, loc.banner, 67, 'Lo que se cuenta en las plazas, las tabernas y los tablones.');
  const step = nextStep(state);
  const pending = projectsAt(state, loc.id).filter((p) => (state.rebuild[p.id] ?? 0) < p.levels.length);
  s.right.append(
    step ? h('div', 'news-next', h('b', '', 'Lo siguiente: '), step) : '',
    ...news.map((n) => h('div', 'news', h('div', 'news-title', n.title), h('p', '', n.text))),
    pending.length ? h('div', 'news', h('div', 'news-title', 'Se buscan donaciones'), h('p', '', pending.map((p) => p.name).join(', ') + '. Pregunta en Reconstrucción.')) : '',
  );
  await menu(s.left, [{ label: 'Volver' }]);
}

// ---------------------------------------------------------------- expediciones de la reserva

/** Miembros que están fuera, de expedición. */
export const awayMembers = (state: GameState) => state.expeditions.flatMap((e) => e.members);

/** Tras cada incursión que vuelve: las expediciones avanzan y las que terminan traen su botín. */
export function advanceExpeditions(state: GameState): string[] {
  const out: string[] = [];
  for (const e of state.expeditions) e.left--;
  for (const e of state.expeditions.filter((x) => x.left <= 0)) {
    const chain = dungeonChain(e.dungeon);
    const diff = Math.max(...chain.map((d) => d.difficulty));
    const gold = Math.round((25 + Math.random() * 20) * diff * e.members.length);
    state.gold += gold;
    const got: string[] = [];
    const mats = chain.flatMap((d) => d.materials ?? []);
    const ings = chain.flatMap((d) => d.ingredients);
    for (let k = 0; k < e.members.length * 2 && mats.length; k++) {
      const id = mats[Math.floor(Math.random() * mats.length)];
      state.materials[id] = (state.materials[id] ?? 0) + 1;
      got.push(ITEMS[id].name);
    }
    for (let k = 0; k < e.members.length && ings.length; k++) {
      const id = ings[Math.floor(Math.random() * ings.length)];
      state.pantry[id] = (state.pantry[id] ?? 0) + 1;
      got.push(ITEMS[id].name);
    }
    const names = e.members.map((m) => MEMBERS[m].name).join(', ');
    out.push(`${names} vuelven de ${DUNGEONS[e.dungeon].name} con ${gold} de oro y: ${summarize(got)}.`);
    for (const m of e.members) {
      const r = gainXp(state, m, 30 * diff * diff);
      if (r.levels) out.push(`${MEMBERS[m].name} sube al nivel ${state.members[m].level} en la expedición.`);
    }
  }
  state.expeditions = state.expeditions.filter((x) => x.left > 0);
  return out;
}

const summarize = (names: string[]) => {
  const c: Record<string, number> = {};
  for (const n of names) c[n] = (c[n] ?? 0) + 1;
  return Object.entries(c).map(([n, q]) => `${n} x${q}`).join(', ') || 'nada';
};

/** Gremio → Expediciones: mandar a los de la reserva a por materiales a mazmorras ya superadas. */
export async function expeditionsScreen(state: GameState): Promise<void> {
  for (;;) {
    const s = screen('Expediciones de la reserva', 'Materiales, ingredientes y experiencia', 'capital', 71, 'Los que no van en el equipo de incursión pueden ir a por materiales a mazmorras ya superadas. Vuelven al cabo de una o dos incursiones.');
    s.right.append(
      h('div', 'info-h', 'Fuera ahora'),
      ...(state.expeditions.length
        ? state.expeditions.map((e) => h('div', 'bond', `${e.members.map((m) => MEMBERS[m].name).join(', ')} → ${DUNGEONS[e.dungeon].name} · vuelven en ${e.left} incursión(es)`))
        : [h('p', 'muted', 'Nadie está de expedición.')]),
    );
    const free = joinedMembers(state).filter((id) => id !== 'aren' && !state.party.includes(id) && !awayMembers(state).includes(id));
    const places = Object.keys(state.cleared).filter((id) => DUNGEONS[id] && !DUNGEONS[id].practice && (DUNGEON_SPOTS.some((d) => d.dungeon === id) || ROUTES.some((r) => r.dungeon === id)));
    const r = await menu(s.left, [
      { label: 'Enviar una expedición', disabled: !free.length || !places.length, desc: !free.length ? 'No hay nadie libre en la reserva (los del equipo de incursión no pueden ir).' : !places.length ? 'Primero hay que superar alguna mazmorra.' : 'Elige destino y quién va.' },
      { label: 'Volver' },
    ]);
    if (r !== 0) return;
    const p = await menu(s.left, [...places.map((id) => ({ label: DUNGEONS[id].name, right: `${expeditionLength(Math.max(...dungeonChain(id).map((d) => d.difficulty)))} incursión(es)`, desc: DUNGEONS[id].desc })), { label: 'Volver' }], { title: 'Destino' });
    if (p < 0 || p >= places.length) continue;
    const chosen: string[] = [];
    for (;;) {
      const items: MenuItem[] = free.map((id) => {
        const st = memberStats(state, id);
        return { label: `${chosen.includes(id) ? '◆' : '◇'} ${st.name}`, right: `Nv${st.level}`, icon: st.sprite, disabled: !chosen.includes(id) && chosen.length >= EXPEDITION_MAX };
      });
      const c = await menu(s.left, [...items, { label: chosen.length ? `Partir (${chosen.length})` : 'Elige al menos uno', disabled: !chosen.length, cls: 'go' }, { label: 'Cancelar' }], { title: `Quién va (máx. ${EXPEDITION_MAX})` });
      if (c < 0 || c === free.length + 1) break;
      if (c === free.length) {
        const dungeon = places[p];
        state.expeditions.push({ members: [...chosen], dungeon, left: expeditionLength(Math.max(...dungeonChain(dungeon).map((d) => d.difficulty))) });
        toast(`${chosen.map((m) => MEMBERS[m].name).join(', ')} parten hacia ${DUNGEONS[dungeon].name}.`);
        break;
      }
      const id = free[c];
      if (chosen.includes(id)) chosen.splice(chosen.indexOf(id), 1);
      else chosen.push(id);
    }
  }
}

// ---------------------------------------------------------------- diario

/** Gremio → Diario: historia vivida (con sus escenas), misiones, récords y obras. */
export async function journalScreen(state: GameState): Promise<void> {
  let start = 0;
  for (;;) {
    const s = screen('Diario del gremio', 'Lo que habéis vivido', 'capital', 73, 'Odric insiste en que alguien lo lleve al día.');
    const r = await menu(s.left, [
      { label: 'Historia', desc: 'Las misiones principales cumplidas. Puedes volver a ver sus escenas.' },
      { label: 'Misiones', desc: 'Todas las misiones, activas y cumplidas.' },
      { label: 'Récords', desc: 'Mazmorras superadas, mejores puntajes y pisos más hondos.' },
      { label: 'Volver' },
    ], { start });
    start = r;
    if (r === 0) {
      const done = QUESTS.filter((q) => q.type === 'main' && state.quests[q.id]?.status === 'done');
      const items = done.map((q) => ({ label: q.name, desc: q.desc, right: q.rewards.scene ? 'Ver escena' : '' }));
      s.right.replaceChildren(...(done.length ? done.map((q) => h('div', 'news', h('div', 'news-title', `★ ${q.name}`), h('p', '', q.desc))) : [h('p', 'muted', 'Todavía no hay nada escrito.')]));
      const k = await menu(s.left, [...items, { label: 'Volver' }], { title: 'Historia' });
      const q = done[k];
      if (q?.rewards.scene) await dialogue(SCENES[q.rewards.scene]);
    } else if (r === 1) {
      const all = QUESTS.filter((q) => state.quests[q.id]);
      s.right.replaceChildren(
        ...all.map((q) => {
          const st = state.quests[q.id].status;
          return h('div', `news ${st === 'done' ? 'done' : ''}`, h('div', 'news-title', `${q.type === 'main' ? '★' : '•'} ${q.name} · ${st === 'done' ? 'cumplida' : st === 'ready' ? '¡lista para entregar!' : 'en curso'}`), h('p', '', q.desc));
        }),
        all.length ? '' : h('p', 'muted', 'Sin misiones todavía.'),
      );
      await menu(s.left, [{ label: 'Volver' }], { title: 'Misiones' });
    } else if (r === 2) {
      const ids = [...new Set([...Object.keys(state.cleared), ...Object.keys(state.bestScores), ...Object.keys(state.records)])].filter((id) => DUNGEONS[id] && (DUNGEON_SPOTS.some((d) => d.dungeon === id) || ROUTES.some((x) => x.dungeon === id)));
      s.right.replaceChildren(
        h('div', 'info-h', 'Mazmorras'),
        ...ids.map((id) => {
          const b = state.bestScores[id];
          return h('div', 'score-row', h('span', '', DUNGEONS[id].name), h('span', 'muted', `${state.cleared[id] ?? 0} veces · récord piso ${state.records[id] ?? 0}`), h('b', '', b ? `${b.rank} · ${b.total}` : '—'));
        }),
        ids.length ? '' : h('p', 'muted', 'Todavía no habéis entrado en ninguna mazmorra.'),
        h('div', 'info-h', 'Monstruos derrotados'),
        h('p', '', `${Object.values(state.bestiary).reduce((a, b) => a + b, 0)} en total, de ${Object.keys(state.bestiary).length} especies.`),
        h('div', 'info-h', 'Reconstrucción'),
        ...PROJECTS.filter((p) => state.rebuild[p.id]).map((p) => h('div', 'bond', `${p.name}: ${state.rebuild[p.id]}/${p.levels.length}`)),
        PROJECTS.some((p) => state.rebuild[p.id]) ? '' : h('p', 'muted', 'Sin obras todavía.'),
      );
      await menu(s.left, [{ label: 'Volver' }], { title: 'Récords' });
    } else return;
  }
}

// ---------------------------------------------------------------- escenas al volver

/** Charla corta al volver: dos del grupo comentan cómo ha ido (por su carácter). */
export function returnScene(party: string[], cleared: boolean, dungeonName: string): Line[] {
  const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];
  const who = [...party].sort(() => Math.random() - 0.5).slice(0, 2);
  return who.map((id) => ({ who: id, text: pick(RETURN_TALK[id]?.[cleared ? 'clear' : 'escape'] ?? ['...']).replace('{d}', dungeonName) }));
}

/** Retrato pequeño (para listas). */
export const portrait = (state: GameState, id: string) => img(memberStats(state, id).sprite, 2);
