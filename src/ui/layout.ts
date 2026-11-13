import { CLASSES, MEMBERS, PRESTIGE_NAMES, RACE_NAMES } from '../data/characters';
import { ELEMENTS, weaknessesOf, type Element } from '../data/elements';
import { EQUIPMENT, SLOT_NAMES, WEAPON_NAMES, type EquipDef, type Slot } from '../data/equipment';
import { SKILLS, STATUSES } from '../data/skills';
import type { GameState } from '../core/state';
import { canPrestige, equippedSkills, joinedMembers, learnedSkills, memberStats, prestigeOf, xpToNext } from '../core/stats';
import { drawBanner } from '../gfx/banners';
import { h, img, root } from './dom';

export interface Screen {
  left: HTMLElement;
  right: HTMLElement;
  /** Texto fijo de la pantalla, encima del menú (no cambia al moverse por el menú). */
  note: HTMLElement;
  /** Subtítulo del estandarte (p. ej. para actualizar el oro tras comprar). */
  subtitle: HTMLElement;
  /** Barra fija inferior donde los menús escriben la descripción de la opción seleccionada. */
  desc: HTMLElement;
}

let sidebarState: GameState | null = null;

/** Partida cuya formación se muestra en la columna lateral (null = no mostrarla, como en el título). */
export function setSidebarState(state: GameState | null): void {
  sidebarState = state;
}

/** La próxima pantalla aparece fundiéndose desde negro (al entrar en un pueblo desde el mapa). */
let fadeNext = false;
export function fadeNextScreen(): void {
  fadeNext = true;
}

/** Dónde se dibujan las pantallas: toda la página o, sobre el mapa, una ventana (la preparación de una mazmorra). */
let host: HTMLElement | null = null;

/** Abre una ventana sobre lo que haya (el mapa): las pantallas se dibujan dentro hasta cerrarla. */
export function openWindow(): { close: () => void } {
  const body = h('div', 'map-window');
  const backdrop = h('div', 'map-window-backdrop', body);
  root().append(backdrop);
  host = body;
  return {
    close: () => {
      backdrop.remove();
      if (host === body) host = null;
    },
  };
}

export function screen(title: string, subtitle: string, banner: Parameters<typeof drawBanner>[1], seed = 3, note = ''): Screen {
  const canvas = h('canvas', 'banner');
  drawBanner(canvas, banner, seed);
  const noteEl = h('div', 'screen-note', note);
  const desc = h('div', 'footer');
  desc.id = 'footer';
  const left = h('div', 'panel left');
  const right = h('div', 'panel right');
  const sub = h('div', 'subtitle', subtitle);
  const side = sidebarState ? partySidebar(sidebarState) : null;
  (host ?? root()).replaceChildren(
    h('div', `screen ${side ? 'with-side' : ''}${host ? ' in-window' : ''}${fadeNext && !host ? ' fade-in' : ''}`,
      h('div', 'banner-wrap', canvas, h('div', 'banner-text', h('h1', '', title), sub)),
      h('div', 'screen-body', h('div', 'col', noteEl, left), right, side),
    ),
    desc,
  );
  if (!host) fadeNext = false;
  return { left, right, note: noteEl, desc, subtitle: sub };
}

/** Columna con los miembros que van en el equipo de incursión y, si los hay, los de reserva. */
function partySidebar(state: GameState): HTMLElement {
  const card = (id: string, bench = false) => {
    const st = memberStats(state, id);
    const gear = (['weapon', 'armor', 'accessory'] as Slot[]).map((slot) => {
      const g = state.members[id].gear[slot];
      return g ? img(EQUIPMENT[g].sprite, 1, 'gear-icon') : h('span', 'gear-empty');
    });
    const el = bench
      ? h('div', 'side-card bench',
          h('div', 'side-pic', img(st.sprite, 2, 'side-img'), h('span', 'cmp-arrow')),
          h('div', 'side-body', h('span', 'side-name', st.name), h('span', 'side-sub', `Nv${st.level} `, elChip(st.element))),
        )
      : h('div', 'side-card',
          h('div', 'side-pic', img(st.sprite, 3, 'side-img'), h('span', 'cmp-arrow')),
          h('div', 'side-body',
            h('div', 'side-name', st.name),
            h('div', 'side-sub', `Nv${st.level} `, elChip(st.element)),
            h('div', 'side-sub', `Vida ${st.hp} · Energía ${st.sp}`),
            h('div', 'side-gear', ...gear),
          ),
        );
    el.dataset.member = id;
    return el;
  };
  const bench = joinedMembers(state).filter((id) => !state.party.includes(id));
  return h('div', 'party-side',
    h('div', 'info-h', `Equipo ${state.party.length}/4`),
    ...state.party.map((id) => card(id)),
    bench.length ? h('div', 'info-h side-bench-h', `Reserva ${bench.length}`) : '',
    ...bench.map((id) => card(id, true)),
  );
}

/** Vuelve a dibujar la columna lateral (tras cambiar el equipo de alguien). */
export function refreshSidebar(): void {
  const old = document.querySelector('.party-side');
  if (old && sidebarState) old.replaceWith(partySidebar(sidebarState));
}

/**
 * Marca en la columna lateral a quién mejora (flecha verde) o empeora (flecha roja) una pieza.
 * Los que no pueden usarla no llevan marca. `null` lo borra todo.
 */
export function markSidebar(marks: Record<string, 'up' | 'down' | 'same' | null> | null): void {
  for (const c of document.querySelectorAll<HTMLElement>('.party-side .side-card')) {
    const m = marks?.[c.dataset.member ?? ''] ?? null;
    c.classList.remove('cmp-up', 'cmp-down', 'cmp-same');
    if (m) c.classList.add(`cmp-${m}`);
    const arrow = c.querySelector('.cmp-arrow')!;
    arrow.textContent = m === 'up' ? '▲' : m === 'down' ? '▼' : m === 'same' ? '=' : '';
  }
}

/** Animación de celebración en los miembros a los que mejora lo que se acaba de comprar. */
export function celebrateSidebar(ids: string[]): void {
  for (const c of document.querySelectorAll<HTMLElement>('.party-side .side-card')) {
    if (!ids.includes(c.dataset.member ?? '')) continue;
    c.classList.remove('celebrate');
    void c.offsetWidth; // reinicia la animación
    c.classList.add('celebrate');
    setTimeout(() => c.classList.remove('celebrate'), 950);
  }
}

export const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(Math.max(0, 6 - n));

export function elChip(e: Element): HTMLElement {
  const s = h('span', 'el-chip', ELEMENTS[e].name);
  s.style.color = ELEMENTS[e].color;
  return s;
}

const STAT_NAMES: Record<string, string> = { hp: 'Vida', sp: 'Energía', atk: 'Ataque', def: 'Defensa', mag: 'Magia', res: 'Resist.' };

/** Texto corto con lo que da una pieza de equipo. */
export function gearSummary(e: EquipDef): string {
  const parts = Object.entries(e.bonus).map(([k, v]) => `${STAT_NAMES[k]} ${v! > 0 ? '+' : ''}${v}`);
  for (const [el, v] of Object.entries(e.resist ?? {})) parts.push(`Resiste ${ELEMENTS[el as Element].name} ${Math.round(v! * 100)}%`);
  for (const [el, v] of Object.entries(e.boost ?? {})) parts.push(`${ELEMENTS[el as Element].name} +${Math.round(v! * 100)}% daño`);
  for (const st of e.immune ?? []) parts.push(`Inmune a ${STATUSES[st].name.toLowerCase()}`);
  return parts.join(' · ') || 'Sin efectos';
}

export function gearWho(e: EquipDef): string {
  if (e.slot !== 'weapon') return 'Cualquiera';
  const who = Object.values(MEMBERS).filter((m) => m.weapon === e.kind).map((m) => m.name);
  return `${WEAPON_NAMES[e.kind!]}: ${who.join(', ')}`;
}

/** Ficha completa de un miembro: estadísticas, equipo, habilidades y debilidades. */
export function memberDetail(state: GameState, id: string): HTMLElement {
  const st = memberStats(state, id);
  const def = MEMBERS[id];
  const m = state.members[id];
  const equipped = equippedSkills(state, id);
  const learned = learnedSkills(state, id);
  const all = id === 'aren' ? CLASSES[state.protagClass].skills : def.skills;
  const resists = Object.entries(st.resist).map(([e, v]) => `${ELEMENTS[e as Element].name} ${Math.round(v! * 100)}%`);
  return h('div', 'member-detail',
    h('div', 'md-head', img(st.sprite, 5), h('div', '', h('h2', '', st.name), h('div', 'muted', def.title), h('div', '', def.role, ' · ', elChip(st.element), ` · ${WEAPON_NAMES[def.weapon]}`))),
    h('div', 'md-level', `Nivel ${st.level}${prestigeOf(state, id) ? ` · ${'✦'.repeat(prestigeOf(state, id))} ${PRESTIGE_NAMES[prestigeOf(state, id)]}` : ''} · ${canPrestige(state, id) ? '¡Nivel máximo! Prueba de prestigio en el gremio' : `Exp ${m.xp}/${xpToNext(m.level)}`}`),
    h('div', 'md-stats', ...(['hp', 'sp', 'atk', 'def', 'mag', 'res'] as const).map((k) => h('div', 'stat', h('span', '', STAT_NAMES[k]), h('b', '', String(st[k]))))),
    h('div', 'info-h', 'Equipo'),
    ...(['weapon', 'armor', 'accessory'] as Slot[]).map((slot) => {
      const g = m.gear[slot] ? EQUIPMENT[m.gear[slot]!] : null;
      return h('div', 'gear-line', h('span', 'muted', `${SLOT_NAMES[slot]}: `), g ? h('b', '', g.name) : h('span', 'muted', '—'), g ? h('span', 'muted', ` (${gearSummary(g)})`) : '');
    }),
    resists.length ? h('div', 'muted', `Resistencias: ${resists.join(' · ')}`) : '',
    h('div', 'info-h', `Habilidades (${equipped.length}/4 en uso)`),
    ...all.map((s) => {
      const sk = SKILLS[s.id];
      const known = learned.includes(s.id);
      const using = equipped.includes(s.id);
      const tag = !known ? `se aprende al nivel ${s.level}` : using ? '' : '(olvidada)';
      return h('div', `skill-line ${!known ? 'locked' : using ? '' : 'forgotten'}`, h('b', '', `${using ? '◆ ' : ''}${sk.name}`), ` ${sk.cost}E · `, elChip(sk.element), ` — ${tag || sk.desc}`);
    }),
    h('div', 'info-h', 'Débil contra'),
    h('div', '', ...weaknessesOf(st.element).map(elChip), weaknessesOf(st.element).length ? '' : 'Nada en especial'),
    h('p', 'muted bio', def.bio),
    h('p', 'bio race', h('b', '', 'Raza: '), RACE_NAMES[def.hiddenRace && !state.flags.includes(def.hiddenRace.flag) ? def.hiddenRace.shown : def.race]),
    state.partner === id ? h('p', 'bio partner', '♥ Pareja de Aren') : '',
    h('p', 'bio look', def.look),
    h('p', 'bio talent', h('b', '', `Talento: ${def.talent.name}. `), def.talent.desc),
  );
}
