import { MEMBERS, PRESTIGE_CAP, PRESTIGE_LEVELS, PRESTIGE_MAX, PRESTIGE_NAMES, PRESTIGE_SKILLS, PRESTIGE_STAT, PRESTIGE_XP } from '../data/characters';
import { DUNGEONS } from '../data/dungeons';
import { ELEMENTS, elementMultiplier, weaknessesOf, type Element } from '../data/elements';
import { EQUIPMENT, SLOT_NAMES, nextUpgrade, type EquipDef, type Slot } from '../data/equipment';
import { FORGE_RECIPES, RECIPES, UPGRADES } from '../data/guild';
import { APPRAISE_COST, ITEMS, UNKNOWN_TABLE } from '../data/items';
import { bondsScreen, pendingPairs } from './affinity';
import { featureItem, introduce } from './features';
import { expeditionsScreen, forgeGold, journalScreen, townPrice } from './town';
import { MONSTERS } from '../data/monsters';
import { SKILLS } from '../data/skills';
import { LOCATIONS } from '../data/world';
import { SKILL_SLOTS, addToBag, addToStorage, upgradeLevel, type GameState } from '../core/state';
import { canEquip, canPrestige, equip, equippedSkills, gearCompare, joinedMembers, learnedSkills, memberStats, prestigeOf, setSkills } from '../core/stats';
import { sfx } from '../audio/audio';
import { alertBox, confirm, h, img, menu, modalMenu, toast, type MenuItem } from './dom';
import { celebrateSidebar, elChip, gearSummary, gearWho, markSidebar, memberDetail, refreshSidebar, screen } from './layout';
import { partyScreen } from './screens';
import { tacticsMenu } from './tactics';

const SLOTS: Slot[] = ['weapon', 'armor', 'accessory'];

/** Menú central del gremio: formación, equipo, habilidades y las salas del cuartel. */
/** Devuelve el miembro que va a la prueba de prestigio, 'tutorial' para el campo de entrenamiento, o null al salir. */
export async function guildHub(state: GameState): Promise<string | null> {
  let start = 0;
  for (;;) {
    const s = screen('Gremio de la Expedición', 'Miembros, equipo y cuartel', 'capital', 21, 'El cuartel viaja con la Expedición: sus salas están disponibles en cualquier localidad.');
    s.right.append(
      h('div', 'info-h', 'Cuartel'),
      ...Object.values(UPGRADES).map((u) => {
        const lv = upgradeLevel(state, u.id);
        return h('div', 'bond', `${u.name}: `, lv ? h('b', 'ok', `nivel ${lv}/${u.levels.length}`) : h('span', 'muted', 'sin construir'));
      }),
      h('div', 'info-h', 'Despensa'),
      h('div', '', Object.entries(state.pantry).map(([id, q]) => `${ITEMS[id].name} x${q}`).join(' · ') || h('span', 'muted', 'Vacía')),
      h('div', 'info-h', 'Materiales'),
      h('div', '', Object.entries(state.materials).map(([id, q]) => `${ITEMS[id].name} x${q}`).join(' · ') || h('span', 'muted', 'Ninguno')),
    );
    const need = (id: string) => (upgradeLevel(state, id) ? '' : 'Sin construir');
    // Las salas aparecen según avanza la historia (data/features.ts).
    const options: [string, MenuItem][] = [
      ['equipo', { label: 'Equipo de incursión', desc: 'Elige quién entra en la próxima mazmorra (máximo 4) y consulta sus fichas.' }],
      ['equipamiento', { label: 'Equipamiento', desc: 'Arma, armadura y accesorio de cada miembro. Mejoran estadísticas y protegen de elementos.' }],
      ['tacticas', { label: 'Tácticas', desc: 'Cómo se comporta cada aliado en la mazmorra: seguir y luchar, solo atacar, usar todo, apoyo, ir por separado o esperar.' }],
      ['entrenamiento_campo', { label: 'Campo de entrenamiento', desc: 'Mazmorra fija que enseña todas las mecánicas. Se puede repetir; no se gana ni se pierde nada.' }],
      ['mejoras', { label: 'Mejoras del cuartel', desc: 'Invierte oro en construir y mejorar las salas del cuartel.' }],
      ['fogata', { label: 'Afinidad del grupo', right: pendingPairs(state).length ? '¡Fogata!' : '', desc: 'Cómo va la afinidad de cada pareja, qué ventajas tiene y cuáles le faltan.' }],
      ['diario', { label: 'Diario del gremio', desc: 'Historia vivida (con sus escenas), misiones, récords y puntajes.' }],
      ['sala_entrenamiento', { label: 'Sala de entrenamiento', right: need('entrenamiento'), desc: 'Cada miembro lleva 4 habilidades. Aquí recuperas las que olvidó para aprender otras.' }],
      ['cocina', { label: 'Cocina', right: need('cocina'), desc: 'Cocina platos y pociones con los ingredientes de la despensa. Son mucho mejores que lo que se compra.' }],
      ['forja', { label: 'Forja', right: need('forja'), desc: 'Refina materiales (lingotes, cuero curtido, seda tejida) para las mejoras +2 de la herrería, y fabrica bombas.' }],
      ['biblioteca', { label: 'Biblioteca', right: need('biblioteca'), desc: 'El monstruario: ficha de cada monstruo que habéis derrotado.' }],
      ['tasador', { label: 'Tasador', desc: `Identifica los objetos sin identificar (${APPRAISE_COST} de oro cada uno).` }],
      ['expediciones', { label: 'Expediciones', right: state.expeditions.length ? `${state.expeditions.length} fuera` : '', desc: 'Manda a los de la reserva a por materiales e ingredientes a mazmorras ya superadas.' }],
      ['prestigio', { label: 'Prestigio', right: joinedMembers(state).some((id) => canPrestige(state, id)) ? '¡Disponible!' : '', desc: `Al nivel ${PRESTIGE_CAP}, un miembro puede ponerse a prueba solo y volver más fuerte, con una habilidad nueva y otro traje.` }],
    ];
    const shown = options.map(([id, it]) => [id, featureItem(state, id, it)] as const).filter((p): p is readonly [string, MenuItem] => !!p[1]);
    const items: MenuItem[] = [...shown.map(([, it]) => it), { label: 'Volver' }];
    const r = await menu(s.left, items, { start });
    start = r;
    const id = shown[r]?.[0];
    if (!id) return null;
    await introduce(state, id);
    if (id === 'equipo') await partyScreen(state, null);
    else if (id === 'equipamiento') await gearScreen(state);
    else if (id === 'tacticas') await tacticsMenu(state, joinedMembers(state).filter((m) => m !== 'aren'));
    else if (id === 'entrenamiento_campo') return 'tutorial';
    else if (id === 'sala_entrenamiento') await trainingScreen(state);
    else if (id === 'cocina') await kitchenScreen(state);
    else if (id === 'forja') await forgeCraftScreen(state);
    else if (id === 'biblioteca') await libraryScreen(state);
    else if (id === 'mejoras') await upgradesScreen(state);
    else if (id === 'fogata') await bondsScreen(state);
    else if (id === 'tasador') await appraiserScreen(state);
    else if (id === 'expediciones') await expeditionsScreen(state);
    else if (id === 'diario') await journalScreen(state);
    else if (id === 'prestigio') {
      const who = await prestigeScreen(state);
      if (who) return who;
    }
  }
}

// ---------------------------------------------------------------- equipamiento

async function pickMember(state: GameState, s: ReturnType<typeof screen>, title: string, start: number): Promise<number> {
  const roster = joinedMembers(state);
  const items: MenuItem[] = [...roster.map((id) => ({ label: MEMBERS[id].name, right: `Nv${state.members[id].level}`, icon: memberStats(state, id).sprite })), { label: 'Volver' }];
  return menu(s.left, items, { title, start, onFocus: (i) => i < roster.length && s.right.replaceChildren(memberDetail(state, roster[i])) });
}

/** Diferencia de estadísticas si el miembro se pusiera `equipId` en `slot`. */
function gearDiff(state: GameState, id: string, slot: Slot, equipId: string | null): HTMLElement {
  const before = memberStats(state, id);
  const m = state.members[id];
  const saved = m.gear[slot];
  if (equipId) m.gear[slot] = equipId;
  else delete m.gear[slot];
  const after = memberStats(state, id);
  if (saved) m.gear[slot] = saved;
  else delete m.gear[slot];
  const names: Record<string, string> = { hp: 'Vida', sp: 'Energía', atk: 'Ataque', def: 'Defensa', mag: 'Magia', res: 'Resist.' };
  return h('div', 'md-stats',
    ...(['hp', 'sp', 'atk', 'def', 'mag', 'res'] as const).map((k) => {
      const d = after[k] - before[k];
      return h('div', 'stat', h('span', '', names[k]), h('b', d > 0 ? 'up' : d < 0 ? 'down' : '', `${after[k]}${d ? ` (${d > 0 ? '+' : ''}${d})` : ''}`));
    }),
  );
}

async function gearScreen(state: GameState) {
  let who = 0;
  for (;;) {
    const s = screen('Equipamiento', 'Arma · Armadura · Accesorio', 'capital', 31, 'Elige un miembro.');
    const roster = joinedMembers(state);
    who = await pickMember(state, s, 'Miembros', who);
    if (who < 0 || who >= roster.length) return;
    const id = roster[who];
    let slotIdx = 0;
    for (;;) {
      s.note.textContent = `${MEMBERS[id].name}: elige un hueco.`;
      s.right.replaceChildren(memberDetail(state, id));
      const slotItems: MenuItem[] = SLOTS.map((slot) => {
        const g = state.members[id].gear[slot];
        return { label: `${SLOT_NAMES[slot]}: ${g ? EQUIPMENT[g].name : '—'}`, icon: g ? EQUIPMENT[g].sprite : undefined, desc: g ? gearSummary(EQUIPMENT[g]) : 'Nada equipado.' };
      });
      slotIdx = await menu(s.left, [...slotItems, { label: 'Volver' }], { title: MEMBERS[id].name, start: slotIdx });
      if (slotIdx < 0 || slotIdx >= SLOTS.length) break;
      const slot = SLOTS[slotIdx];
      const options = Object.entries(state.gear).filter(([g, q]) => q > 0 && EQUIPMENT[g].slot === slot && canEquip(id, EQUIPMENT[g])).map(([g]) => g);
      const current = state.members[id].gear[slot];
      const items: MenuItem[] = options.map((g) => ({ label: EQUIPMENT[g].name, right: `x${state.gear[g]}`, icon: EQUIPMENT[g].sprite, desc: `${EQUIPMENT[g].desc} ${gearSummary(EQUIPMENT[g])}` }));
      if (current) items.push({ label: 'Quitar', desc: `Guarda ${EQUIPMENT[current].name} en el inventario.` });
      items.push({ label: 'Volver' });
      if (!options.length) s.note.textContent = `No tienes ${SLOT_NAMES[slot].toLowerCase()}s que ${MEMBERS[id].name} pueda usar. Cómpralas en la herrería.`;
      const r = await menu(s.left, items, {
        title: SLOT_NAMES[slot],
        onFocus: (i) => {
          const pick = i < options.length ? options[i] : current && i === options.length ? null : undefined;
          if (pick === undefined) return;
          s.right.replaceChildren(h('div', 'info-h', pick ? EQUIPMENT[pick].name : 'Sin equipo'), pick ? h('p', 'muted', gearWho(EQUIPMENT[pick])) : '', gearDiff(state, id, slot, pick));
        },
      });
      if (r >= 0 && r < options.length) {
        equip(state, id, slot, options[r]);
        toast(`${MEMBERS[id].name} se equipa ${EQUIPMENT[options[r]].name}.`);
      } else if (current && r === options.length) equip(state, id, slot, null);
    }
  }
}

// ---------------------------------------------------------------- sala de entrenamiento

async function trainingScreen(state: GameState) {
  const built = upgradeLevel(state, 'entrenamiento') > 0;
  let who = 0;
  for (;;) {
    const s = screen('Sala de entrenamiento', 'Cada miembro lleva 4 habilidades', 'capital', 37,
      built ? 'Elige un miembro y cambia sus habilidades por otras que ya conoce.' : 'Sin construir: puedes ver las habilidades, pero para recuperar las olvidadas hay que construir la sala en Mejoras del cuartel.');
    const roster = joinedMembers(state);
    who = await pickMember(state, s, 'Miembros', who);
    if (who < 0 || who >= roster.length) return;
    if (!built) continue;
    const id = roster[who];
    let slot = 0;
    for (;;) {
      const eq = equippedSkills(state, id);
      s.note.textContent = `${MEMBERS[id].name}: elige el hueco que quieres cambiar.`;
      s.right.replaceChildren(memberDetail(state, id));
      const slots: MenuItem[] = Array.from({ length: SKILL_SLOTS }, (_, i) => {
        const sk = eq[i] ? SKILLS[eq[i]] : null;
        return { label: `${i + 1}. ${sk ? sk.name : '(libre)'}`, right: sk ? `${sk.cost}E` : '', desc: sk?.desc ?? 'Hueco libre.' };
      });
      slot = await menu(s.left, [...slots, { label: 'Volver' }], { title: MEMBERS[id].name, start: slot });
      if (slot < 0 || slot >= SKILL_SLOTS) break;
      const spare = learnedSkills(state, id).filter((sid) => !eq.includes(sid));
      if (!spare.length) {
        toast('No conoce más habilidades que las que ya lleva.');
        continue;
      }
      const r = await menu(s.left, [...spare.map((sid) => ({ label: SKILLS[sid].name, right: `${SKILLS[sid].cost}E · ${ELEMENTS[SKILLS[sid].element].name}`, desc: SKILLS[sid].desc })), { label: 'Volver' }], { title: 'Poner en su lugar' });
      if (r < 0 || r >= spare.length) continue;
      const next = [...eq];
      next[slot] = spare[r];
      setSkills(state, id, next.filter(Boolean));
      toast(`${MEMBERS[id].name} llevará ${SKILLS[spare[r]].name}.`);
    }
  }
}

// ---------------------------------------------------------------- cocina

async function kitchenScreen(state: GameState) {
  const level = upgradeLevel(state, 'cocina');
  let start = 0;
  for (;;) {
    const s = screen('Cocina', 'Platos con los ingredientes de las mazmorras', 'pueblo', 41,
      level ? 'Elige una receta. El plato va a la bolsa (o al almacén si está llena).' : 'Sin construir: constrúyela en Mejoras del cuartel. Los ingredientes que traigáis se guardan igualmente en la despensa.');
    const pantry = h('div', '', h('div', 'info-h', 'Despensa'), ...(Object.entries(state.pantry).length ? Object.entries(state.pantry).map(([id, q]) => h('div', 'mini-member', img(ITEMS[id].sprite, 2), `${ITEMS[id].name} x${q}`)) : [h('div', 'muted', 'Vacía. Los ingredientes se recogen en las mazmorras.')]));
    s.right.append(pantry);
    const items: MenuItem[] = RECIPES.map((r) => {
      const dish = ITEMS[r.result];
      const can = Object.entries(r.ingredients).every(([id, n]) => (state.pantry[id] ?? 0) >= n);
      const needs = Object.entries(r.ingredients).map(([id, n]) => `${ITEMS[id].name} ${state.pantry[id] ?? 0}/${n}`).join(', ');
      const locked = r.level > level;
      return { label: dish.name, icon: dish.sprite, right: locked ? `Cocina nv${r.level}` : can ? 'Se puede' : '', desc: `${dish.desc} Necesita: ${needs}.`, disabled: locked || !can };
    });
    const r = await menu(s.left, [...items, { label: 'Volver' }], { start });
    if (r < 0 || r >= RECIPES.length) return;
    start = r;
    const rec = RECIPES[r];
    for (const [id, n] of Object.entries(rec.ingredients)) {
      state.pantry[id] -= n;
      if (state.pantry[id] <= 0) delete state.pantry[id];
    }
    if (!addToBag(state, rec.result, 1)) addToStorage(state, rec.result, 1);
    toast(`Cocináis ${ITEMS[rec.result].name}.`);
  }
}

// ---------------------------------------------------------------- forja

async function forgeCraftScreen(state: GameState) {
  const built = upgradeLevel(state, 'forja') > 0;
  let start = 0;
  for (;;) {
    const s = screen('Forja', 'Refinar materiales y fabricar', 'capital', 47,
      built ? 'Elige qué forjar. Los refinados sirven para las mejoras +2 de la herrería; las bombas van a la bolsa.' : 'Sin construir: constrúyela en Mejoras del cuartel. Los materiales que traigáis se guardan igualmente.');
    const stock = Object.entries(state.materials).filter(([, q]) => q > 0);
    s.right.append(
      h('div', 'info-h', 'Materiales del gremio'),
      stock.length ? h('div', 'mat-list', ...stock.map(([id, q]) => h('div', 'mat', img(ITEMS[id].sprite, 2), h('span', '', ITEMS[id].name), h('b', '', `x${q}`)))) : h('div', 'muted', 'Ninguno. Se recogen en las mazmorras y los sueltan los monstruos.'),
    );
    const items: MenuItem[] = FORGE_RECIPES.map((rec) => {
      const out = ITEMS[rec.result];
      const can = Object.entries(rec.materials).every(([id, n]) => (state.materials[id] ?? 0) >= n);
      const needs = Object.entries(rec.materials).map(([id, n]) => `${ITEMS[id].name} ${state.materials[id] ?? 0}/${n}`).join(', ');
      return { label: `${out.name}${rec.qty > 1 ? ` x${rec.qty}` : ''}`, icon: out.sprite, right: !built ? 'Sin forja' : can ? 'Se puede' : '', desc: `${out.desc} Necesita: ${needs}.`, disabled: !built || !can };
    });
    const r = await menu(s.left, [...items, { label: 'Volver' }], { start });
    if (r < 0 || r >= FORGE_RECIPES.length) return;
    start = r;
    const rec = FORGE_RECIPES[r];
    for (const [id, n] of Object.entries(rec.materials)) {
      state.materials[id] -= n;
      if (state.materials[id] <= 0) delete state.materials[id];
    }
    const out = ITEMS[rec.result];
    if (out.kind === 'material') state.materials[rec.result] = (state.materials[rec.result] ?? 0) + rec.qty;
    else for (let i = 0; i < rec.qty; i++) if (!addToBag(state, rec.result, 1)) addToStorage(state, rec.result, 1);
    sfx('confirm');
    toast(`Forjáis ${out.name}${rec.qty > 1 ? ` x${rec.qty}` : ''}.`);
  }
}

// ---------------------------------------------------------------- biblioteca

function monsterDetail(state: GameState, id: string): HTMLElement {
  const m = MONSTERS[id];
  const weak = weaknessesOf(m.element);
  const strong = (Object.keys(ELEMENTS) as Element[]).filter((e) => e !== 'neutral' && elementMultiplier(e, m.element) < 1);
  const where = Object.values(DUNGEONS).filter((d) => d.monsters.some((x) => x.id === id) || d.boss?.monster === id).map((d) => d.name);
  const names: Record<string, string> = { hp: 'Vida', atk: 'Ataque', def: 'Defensa', mag: 'Magia', res: 'Resist.' };
  return h('div', 'member-detail',
    h('div', 'md-head', img(m.sprite, 6), h('div', '', h('h2', '', m.name), h('div', '', elChip(m.element), m.boss ? h('span', 'warn', ' · Jefe') : ''), h('div', 'muted', `Derrotados: ${state.bestiary[id] ?? 0}`))),
    h('div', 'info-h', 'Débil contra'),
    h('div', '', ...(weak.length ? weak.map(elChip) : ['Nada en especial'])),
    h('div', 'info-h', 'Resiste'),
    h('div', '', ...(strong.length ? strong.map(elChip) : ['Nada en especial'])),
    h('div', 'info-h', 'Estadísticas base (nivel 1)'),
    h('div', 'md-stats', ...Object.entries(m.base).map(([k, v]) => h('div', 'stat', h('span', '', names[k]), h('b', '', String(v))))),
    h('div', 'info-h', 'Habilidades'),
    h('div', '', m.skills.map((s) => SKILLS[s.id].name).join(', ') || 'Solo ataques básicos'),
    m.fast ? h('div', 'warn', 'Rápido: a veces actúa dos veces por turno.') : '',
    h('div', 'info-h', 'Botín'),
    h('div', '', m.drops?.map((d) => `${ITEMS[d.id].name} (${Math.round(d.chance * 100)}%)`).join(', ') || 'Nada especial'),
    h('div', 'info-h', 'Dónde aparece'),
    h('div', '', where.join(', ') || '—'),
  );
}

async function libraryScreen(state: GameState) {
  const ids = Object.keys(MONSTERS);
  const found = ids.filter((id) => state.bestiary[id]);
  const s = screen('Biblioteca', `Monstruario · ${found.length}/${ids.length} registrados`, 'capital', 43,
    upgradeLevel(state, 'biblioteca') ? 'Cada monstruo que derrotáis se registra aquí con su ficha.' : 'Sin construir: constrúyela en Mejoras del cuartel. Los monstruos derrotados se van registrando igualmente.');
  if (!upgradeLevel(state, 'biblioteca')) {
    await menu(s.left, [{ label: 'Volver' }]);
    return;
  }
  const items: MenuItem[] = ids.map((id) => (state.bestiary[id] ? { label: MONSTERS[id].name, icon: MONSTERS[id].sprite, right: ELEMENTS[MONSTERS[id].element].name } : { label: '???', right: 'Sin registrar' }));
  await menu(s.left, [...items, { label: 'Volver' }], {
    onFocus: (i) => s.right.replaceChildren(i < ids.length ? (state.bestiary[ids[i]] ? monsterDetail(state, ids[i]) : h('p', 'muted', 'Derrota a este monstruo para registrarlo.')) : ''),
  });
}

// ---------------------------------------------------------------- mejoras

/** Gremio → Prestigio: quién puede ponerse a prueba, y lo que gana con cada prestigio. Devuelve quién va. */
async function prestigeScreen(state: GameState): Promise<string | null> {
  let start = 0;
  for (;;) {
    const s = screen('Prestigio', `Nivel máximo ${PRESTIGE_CAP} hasta el prestigio ${PRESTIGE_MAX}`, 'capital', 79,
      `Al llegar al nivel ${PRESTIGE_CAP}, un miembro puede bajar solo a la Senda del Prestigio (4 pisos y su propio eco al final). Si vuelve, empieza de nuevo en el nivel 1, pero más fuerte.`);
    const roster = joinedMembers(state);
    const items: MenuItem[] = roster.map((id) => {
      const p = prestigeOf(state, id);
      const st = memberStats(state, id);
      return { label: `${st.name} ${'✦'.repeat(p)}`, right: p >= PRESTIGE_MAX ? 'Leyenda' : canPrestige(state, id) ? '¡Prueba disponible!' : `Nv${st.level}/${PRESTIGE_CAP}`, icon: st.sprite };
    });
    const show = (i: number) => {
      const id = roster[i];
      if (!id) return;
      const p = prestigeOf(state, id);
      const pics = [0, 1, 2, 3].map((k) => {
        const key = `${id === 'aren' ? `p_aren_${state.protagClass}` : `p_${id}`}${k ? `_p${k}` : ''}`;
        return h('div', `prestige-pic ${k <= p ? 'ok' : 'locked'}`, img(key, 4), h('span', '', PRESTIGE_NAMES[k]));
      });
      s.right.replaceChildren(
        h('div', 'bond-title', `${MEMBERS[id].name} · ${PRESTIGE_NAMES[p]}`),
        h('div', 'prestige-row', ...pics),
        h('div', 'info-h', 'Cada prestigio da'),
        h('p', '', `+${Math.round(PRESTIGE_STAT * 100)}% a todas las estadísticas, como si empezara ${PRESTIGE_LEVELS} niveles más arriba, +${Math.round(PRESTIGE_XP * 100)}% de experiencia, un traje nuevo y una habilidad exclusiva. No olvida nada de lo aprendido ni pierde el equipo.`),
        h('div', 'info-h', 'Habilidades de prestigio'),
        ...(PRESTIGE_SKILLS[id] ?? []).map((sk, k) => h('div', k < p ? 'ok' : 'muted', `${k < p ? '✓' : '·'} ${PRESTIGE_NAMES[k + 1]}: ${SKILLS[sk].name} — ${SKILLS[sk].desc}`)),
        p >= PRESTIGE_MAX ? h('p', 'ok', `Leyenda: ya no tiene tope de nivel ${PRESTIGE_CAP}.`) : h('p', 'muted', canPrestige(state, id) ? 'Listo para la prueba.' : `Necesita el nivel ${PRESTIGE_CAP} (ahora ${state.members[id].level}).`),
      );
    };
    const r = await menu(s.left, [...items, { label: 'Volver' }], { start, onFocus: show });
    if (r < 0 || r >= roster.length) return null;
    start = r;
    const id = roster[r];
    if (!canPrestige(state, id)) continue;
    const ok = await confirm(`¿Mandar a ${MEMBERS[id].name} solo a la Senda del Prestigio?\n\nSe guarda la partida antes. Si cae, no pasa nada más que perder lo de esa incursión. Si vuelve, pasa a ${PRESTIGE_NAMES[prestigeOf(state, id) + 1]}: nivel 1, más fuerte, con ${SKILLS[PRESTIGE_SKILLS[id][prestigeOf(state, id)]].name} y traje nuevo.`, 'A la prueba', 'Todavía no');
    if (ok) return id;
  }
}

/** Tasador: identifica lo que no se conoce (de la bolsa y del almacén). */
async function appraiserScreen(state: GameState) {
  let start = 0;
  for (;;) {
    const s = screen('Tasador', `Oro: ${state.gold}`, 'capital', 49, 'Un viejo de lupa enorme. «Dime qué has traído y te diré qué es. Por un precio.»');
    const list: { id: string; where: 'bag' | 'storage' }[] = [];
    for (const id of Object.keys(UNKNOWN_TABLE)) {
      if ((state.bag[id] ?? 0) > 0) list.push({ id, where: 'bag' });
      if ((state.storage[id] ?? 0) > 0) list.push({ id, where: 'storage' });
    }
    const items: MenuItem[] = list.map((e) => ({ label: ITEMS[e.id].name, right: `x${(e.where === 'bag' ? state.bag : state.storage)[e.id]} · ${e.where === 'bag' ? 'bolsa' : 'almacén'}`, icon: ITEMS[e.id].sprite, desc: ITEMS[e.id].desc, disabled: state.gold < APPRAISE_COST }));
    s.right.append(h('p', 'muted', list.length ? `Cada identificación cuesta ${APPRAISE_COST} de oro.` : 'No llevas nada sin identificar. Aparecen en las mazmorras: frascos turbios y pergaminos sellados.'));
    const r = await menu(s.left, [...items, { label: 'Volver' }], { start });
    if (r < 0 || r >= list.length) return;
    start = r;
    const e = list[r];
    const src = e.where === 'bag' ? state.bag : state.storage;
    state.gold -= APPRAISE_COST;
    src[e.id]--;
    if (!src[e.id]) delete src[e.id];
    const roll = UNKNOWN_TABLE[e.id];
    let x = Math.random() * roll.reduce((a, q) => a + q.weight, 0);
    const real = roll.find((q) => (x -= q.weight) < 0)?.id ?? roll[0].id;
    src[real] = (src[real] ?? 0) + 1;
    const bad = ITEMS[real].bait || ITEMS[real].kind === 'curse';
    await alertBox('Tasador', [`«${ITEMS[e.id].name}... Ajá. Es ${ITEMS[real].name}.»`, ITEMS[real].desc, bad ? '«No te lo bebas. Pero lanzado contra un monstruo, hace maravillas.»' : '«Buena pieza. Cuídala.»']);
  }
}

async function upgradesScreen(state: GameState) {
  let start = 0;
  for (;;) {
    const s = screen('Mejoras del cuartel', `Oro: ${state.gold}`, 'capital', 47, 'Construye y mejora las salas del cuartel.');
    const ups = Object.values(UPGRADES);
    const items: MenuItem[] = ups.map((u) => {
      const lv = upgradeLevel(state, u.id);
      const next = u.levels[lv];
      return { label: u.name, right: next ? `${next.cost} oro` : 'Completa', desc: next ? `Nivel ${lv + 1}: ${next.desc}` : 'Mejora al máximo.', disabled: !next || state.gold < next.cost };
    });
    s.right.append(...ups.map((u) => h('div', 'upgrade', h('b', '', `${u.name} (${upgradeLevel(state, u.id)}/${u.levels.length})`), ...u.levels.map((l, i) => h('div', i < upgradeLevel(state, u.id) ? 'ok' : 'muted', `${i < upgradeLevel(state, u.id) ? '✓' : '·'} ${l.desc}`)))));
    const r = await menu(s.left, [...items, { label: 'Volver' }], { start });
    if (r < 0 || r >= ups.length) return;
    start = r;
    const u = ups[r];
    const next = u.levels[upgradeLevel(state, u.id)];
    if (await confirm(`¿Invertir ${next.cost} de oro en ${u.name}?\n\n${next.desc}`, 'Construir', 'Ahora no')) {
      state.gold -= next.cost;
      state.upgrades[u.id] = upgradeLevel(state, u.id) + 1;
      await alertBox(u.name, [`¡${u.name} mejorada al nivel ${state.upgrades[u.id]}!`, next.desc]);
    }
  }
}

// ---------------------------------------------------------------- herrería

/** Tras comprar una pieza: quién se la pone y qué hacer con la que llevaba. */
async function equipAfterBuy(state: GameState, e: EquipDef) {
  const who = joinedMembers(state).filter((id) => canEquip(id, e));
  if (!who.length) return toast(`Compras ${e.name}. Va al inventario del gremio.`);
  const items: MenuItem[] = who.map((id) => {
    const c = gearCompare(state, id, e);
    const cur = state.members[id].gear[e.slot];
    return {
      label: MEMBERS[id].name,
      icon: memberStats(state, id).sprite,
      right: c === 'up' ? '▲ mejora' : c === 'down' ? '▼ peor' : '= igual',
      cls: c === 'up' ? 'mi-up' : c === 'down' ? 'mi-down' : 'mi-same',
      desc: `${state.party.includes(id) ? 'En el equipo' : 'En reserva'}. Ahora lleva: ${cur ? `${EQUIPMENT[cur].name} (${gearSummary(EQUIPMENT[cur])})` : 'nada'}.`,
    };
  });
  items.push({ label: 'Nadie: guardarlo en el inventario', desc: 'Podrás ponérselo a alguien más tarde en Gremio → Equipamiento.' });
  const info = h('div', 'modal-text', h('p', '', `${e.name}: ${gearSummary(e)}.`), h('p', 'muted', '¿Quién se lo equipa?'));
  const r = await modalMenu(`Compras ${e.name}`, items, { info });
  if (r < 0 || r >= who.length) return toast(`${e.name} guardado en el inventario del gremio.`);
  const id = who[r];
  const prev = state.members[id].gear[e.slot];
  equip(state, id, e.slot, e.id);
  if (prev) {
    const p = EQUIPMENT[prev];
    const value = Math.floor(p.price / 2);
    const q = await modalMenu(`${MEMBERS[id].name} se quita ${p.name}`, [
      { label: `Venderlo (${value} oro)` },
      { label: 'Guardarlo en el inventario', desc: 'Se queda en el inventario del gremio para otro miembro o para más adelante.' },
    ], { info: h('p', 'modal-text', `¿Qué hacemos con ${p.name} (${gearSummary(p)})?`), cancel: false });
    if (q === 0) {
      state.gear[prev]--;
      if (!state.gear[prev]) delete state.gear[prev];
      state.gold += value;
      toast(`${MEMBERS[id].name} se equipa ${e.name}. Vendes ${p.name} por ${value} oro.`);
    } else toast(`${MEMBERS[id].name} se equipa ${e.name}. ${p.name} va al inventario.`);
  } else toast(`${MEMBERS[id].name} se equipa ${e.name}.`);
  refreshSidebar();
  if (gearCompareBefore(state, id, e, prev)) celebrateSidebar([id]);
}

/** ¿La pieza nueva es mejor que la que llevaba? (para la animación, tras equiparla). */
function gearCompareBefore(state: GameState, id: string, e: EquipDef, prev: string | undefined): boolean {
  const gear = state.members[id].gear;
  if (prev) gear[e.slot] = prev;
  else delete gear[e.slot];
  const up = gearCompare(state, id, e) === 'up';
  gear[e.slot] = e.id;
  return up;
}

const matLine = (state: GameState, mats: Record<string, number>) =>
  h('div', 'mat-list', ...Object.entries(mats).map(([mid, n]) => {
    const have = state.materials[mid] ?? 0;
    return h('div', `mat ${have >= n ? 'ok' : 'lack'}`, img(ITEMS[mid].sprite, 2), h('span', '', ITEMS[mid].name), h('b', '', `${have}/${n}`));
  }));

/** Mejorar piezas a +1 / +2 con materiales y oro. Sirven las del inventario y las que lleva puestas cualquiera. */
async function upgradeScreen(state: GameState, s: ReturnType<typeof screen>) {
  let start = 0;
  for (;;) {
    type Entry = { id: string; owner?: string; slot?: Slot };
    const entries: Entry[] = [];
    for (const mid of joinedMembers(state)) for (const slot of SLOTS) {
      const g = state.members[mid].gear[slot];
      if (g) entries.push({ id: g, owner: mid, slot });
    }
    for (const [g, q] of Object.entries(state.gear)) if (q > 0) entries.push({ id: g });
    const can = (en: Entry) => {
      const up = nextUpgrade(EQUIPMENT[en.id]);
      return !!up && state.gold >= forgeGold(state, up.gold) && Object.entries(up.mats).every(([mid, n]) => (state.materials[mid] ?? 0) >= n);
    };
    const items: MenuItem[] = entries.map((en) => {
      const e = EQUIPMENT[en.id];
      const up = nextUpgrade(e);
      return {
        label: e.name,
        icon: e.sprite,
        right: en.owner ? `lo lleva ${MEMBERS[en.owner].name}` : `inventario x${state.gear[en.id]}`,
        desc: up ? `${up.to.name}: ${gearSummary(up.to)} · ${forgeGold(state, up.gold)} oro` : 'Ya está mejorada al máximo.',
        disabled: !can(en),
      };
    });
    const stock = Object.entries(state.materials).filter(([, q]) => q > 0);
    const showStock = () =>
      s.right.replaceChildren(
        h('div', 'info-gold', `Oro: ${state.gold}`),
        h('div', 'info-h', 'Materiales del gremio'),
        stock.length ? h('div', 'mat-list', ...stock.map(([mid, q]) => h('div', 'mat', img(ITEMS[mid].sprite, 2), h('span', '', ITEMS[mid].name), h('b', '', `x${q}`)))) : h('p', 'muted', 'Ninguno. Se encuentran en el suelo de las mazmorras y los sueltan los monstruos (los jefes, cristales).'),
      );
    const onFocus = (i: number) => {
      const en = entries[i];
      if (!en) return showStock();
      const e = EQUIPMENT[en.id];
      const up = nextUpgrade(e);
      s.right.replaceChildren(
        h('div', 'info-gold', `Oro: ${state.gold}`),
        h('div', 'upg-head', img(e.sprite, 4), h('div', '', h('div', 'upg-from', e.name), up ? h('div', 'upg-to', `→ ${up.to.name}`) : h('div', 'muted', 'Mejora máxima'))),
        h('p', '', h('span', 'muted', 'Ahora: '), gearSummary(e)),
        up ? h('p', '', h('span', 'muted', 'Después: '), h('span', 'up', gearSummary(up.to))) : '',
        up ? h('div', 'info-h', 'Hace falta') : '',
        up ? matLine(state, up.mats) : '',
        up ? h('div', `mat ${state.gold >= forgeGold(state, up.gold) ? 'ok' : 'lack'}`, h('span', '', 'Oro'), h('b', '', `${forgeGold(state, up.gold)}`)) : '',
      );
    };
    const r = await menu(s.left, [...items, { label: 'Volver' }], { title: 'Mejorar equipo', start, onFocus });
    if (r < 0 || r >= entries.length) return;
    start = r;
    const en = entries[r];
    const up = nextUpgrade(EQUIPMENT[en.id])!;
    state.gold -= forgeGold(state, up.gold);
    for (const [mid, n] of Object.entries(up.mats)) {
      state.materials[mid] -= n;
      if (!state.materials[mid]) delete state.materials[mid];
    }
    if (en.owner) state.members[en.owner].gear[en.slot!] = up.to.id;
    else {
      state.gear[en.id]--;
      if (!state.gear[en.id]) delete state.gear[en.id];
      state.gear[up.to.id] = (state.gear[up.to.id] ?? 0) + 1;
    }
    sfx('levelup');
    s.subtitle.textContent = `${LOCATIONS[state.location].name} · Oro: ${state.gold}`;
    toast(`¡${EQUIPMENT[en.id].name} pasa a ser ${up.to.name}!`);
    if (en.owner) {
      refreshSidebar();
      celebrateSidebar([en.owner]);
    }
  }
}

export async function forgeScreen(state: GameState) {
  const loc = LOCATIONS[state.location];
  let mode = 0;
  for (;;) {
    const s = screen('Herrería', `${loc.name} · Oro: ${state.gold}`, loc.banner, 53, 'Armas, armaduras y accesorios. Las armas solo las usa quien maneja ese tipo.');
    mode = await menu(s.left, [
      { label: 'Comprar', desc: 'Al comprar, eliges quién se lo pone y qué hacer con lo que llevaba.' },
      { label: 'Mejorar', desc: 'Sube una pieza a +1 o +2 con materiales y oro. Los materiales se encuentran en las mazmorras.' },
      { label: 'Vender', desc: 'Solo el equipo que no lleva nadie puesto.' },
      { label: 'Volver' },
    ], { start: mode });
    if (mode < 0 || mode === 3) return;
    if (mode === 1) {
      await upgradeScreen(state, s);
      continue;
    }
    const buying = mode === 0;
    let start = 0;
    for (;;) {
      // Cuenta también las versiones mejoradas de la misma pieza.
      const family = (g: string) => (id: string) => id === g || EQUIPMENT[id]?.base === g;
      const owned = (g: string) => Object.entries(state.gear).filter(([id]) => family(g)(id)).reduce((a, [, q]) => a + q, 0) + Object.values(state.members).reduce((a, m) => a + Object.values(m.gear).filter((id) => id && family(g)(id)).length, 0);
      const list = buying ? loc.forge : Object.keys(state.gear).filter((g) => state.gear[g] > 0);
      const items: MenuItem[] = list.map((g) => {
        const e = EQUIPMENT[g];
        const price = buying ? townPrice(state, loc.id, e.price) : Math.floor(e.price / 2);
        return { label: e.name, icon: e.sprite, right: `${price} oro · ${buying ? `tienes ${owned(g)}` : `x${state.gear[g]}`}`, desc: `${SLOT_NAMES[e.slot]} · ${gearSummary(e)} · ${gearWho(e)}`, disabled: buying && state.gold < price };
      });
      s.subtitle.textContent = `${loc.name} · Oro: ${state.gold}`;
      s.right.replaceChildren(
        h('div', 'info-gold', `Oro: ${state.gold}`),
        h('p', 'muted', buying ? 'Al comprar, eliges quién se lo equipa.' : 'Solo se puede vender el equipo que no lleva nadie puesto.'),
        buying ? h('p', 'muted', 'En la columna del equipo: ▲ verde si la pieza mejora a ese miembro respecto a lo que lleva, ▼ roja si no. Sin marca, no la puede usar.') : '',
      );
      // Comparación con lo que lleva cada miembro (equipo y reserva), al moverse por la lista de compra.
      const compareAll = (g: string) => Object.fromEntries(joinedMembers(state).map((id) => [id, gearCompare(state, id, EQUIPMENT[g])]));
      const onFocus = (i: number) => markSidebar(buying && i < list.length ? compareAll(list[i]) : null);
      const r = await menu(s.left, [...items, { label: 'Volver' }], { title: buying ? 'Comprar' : 'Vender', start, onFocus });
      markSidebar(null);
      if (r < 0 || r >= list.length) break;
      start = r;
      const e = EQUIPMENT[list[r]];
      if (buying) {
        state.gold -= townPrice(state, loc.id, e.price);
        state.gear[e.id] = (state.gear[e.id] ?? 0) + 1;
        await equipAfterBuy(state, e);
      } else {
        state.gold += Math.floor(e.price / 2);
        state.gear[e.id]--;
        if (!state.gear[e.id]) delete state.gear[e.id];
        toast(`Vendes ${e.name}.`);
      }
    }
  }
}
