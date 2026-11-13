import { musicOn, playMusic, sfxOn, toggleMusic, toggleSfx } from '../audio/audio';
import { cycleMapMode, mapMode, MAP_MODE_NAMES } from './prefs';
import { CLASSES, MEMBERS } from '../data/characters';
import { RUSH_MIX_FROM, BOSS_EVERY, RUSH_CAMP_EVERY, DUNGEONS, GOALS, INTEL, LAYOUT_NAMES, REAPER_SECONDS, dungeonChain, layoutsFor, type IntelId } from '../data/dungeons';
import { ELEMENTS, elementMultiplier, weaknessesOf } from '../data/elements';
import { ITEMS } from '../data/items';
import { MONSTERS } from '../data/monsters';
import { QUESTS, type QuestDef } from '../data/quests';
import { SKILLS } from '../data/skills';
import { SCENES } from '../data/story';
import type { DungeonRun, RunResult } from '../dungeon/run';
import { campfire, pendingPairs } from './affinity';
import { featureItem, introduce, isNew, unlocked } from './features';
import { awayMembers, newsScreen, nextStep, projectsAt, rebuildNote, rebuildScreen, townPrice, townShop } from './town';
import { LOCATIONS, REGIONS, isTaken, type RouteDef } from '../data/world';
import { acceptQuest, completeQuest, objectiveTarget, questsAt, unacceptedFor } from '../core/quests';
import { PARTY_MAX, RANKS, addToBag, addToStorage, bagCapacity, bagList, bagUsed, hasFlags, removeFromBag, saveGame, type GameState } from '../core/state';
import { joinedMembers, memberStats } from '../core/stats';
import { CONTROLS } from '../dungeon/controller';
import { alertBox, confirm, dialogue, h, img, menu, modalMenu, modalRoot, toast, type MenuItem } from './dom';
import { forgeScreen, guildHub } from './guild';
import { worldMap } from './worldmap';
import { elChip, memberDetail, screen, stars } from './layout';

// ---------------------------------------------------------------- título

export async function titleScreen(hasSave: boolean): Promise<'new' | 'continue' | 'test'> {
  playMusic('title');
  for (;;) {
    const s = screen('Tierras Partidas', 'Ocho actos · del Bastión Gris al trono del Cielo', 'title', 11, 'Hace 300 años la tierra se partió. Baja a las Hondonadas, reabre las rutas entre las ciudades humanas y descubre quién abrió las grietas.');
    // Todo el gremio en la portada, con su nombre.
    s.right.append(h('div', 'title-art', ...Object.keys(MEMBERS).map((id) => h('div', 'title-member', img(id === 'aren' ? 'p_aren_errante' : `p_${id}`, 5), h('span', '', MEMBERS[id].name)))));
    const items: MenuItem[] = [];
    if (hasSave) items.push({ label: 'Continuar' });
    items.push({ label: 'Nueva partida' }, { label: 'Partida de pruebas', desc: 'Todo desbloqueado: el gremio entero a nivel 150 en Leyenda, el mejor equipo y todo lo que existe completado. Para probar lo último.' }, { label: 'Controles' });
    const r = await menu(s.left, items, { cancel: false });
    const choice = items[r].label;
    if (choice === 'Continuar') return 'continue';
    if (choice === 'Nueva partida') {
      if (!hasSave || (await confirm('Ya hay una partida guardada. ¿Empezar de cero y sobrescribirla?'))) return 'new';
    }
    if (choice === 'Partida de pruebas' && (!hasSave || (await confirm('La partida de pruebas sobrescribe la partida guardada. ¿Seguir?')))) return 'test';
    if (choice === 'Controles') await alertBox('Controles', CONTROLS);
  }
}

// ---------------------------------------------------------------- ciudad

/** travel.map: el viaje se hizo desde el mapa, y al llegar se sigue en el mapa (sin pasar por la pantalla de la ciudad). */
export type TownAction = { kind: 'dungeon'; dungeon: string; route?: RouteDef; map?: boolean } | { kind: 'travel'; to: string; map?: boolean } | { kind: 'title' } | { kind: 'trial'; member: string } | { kind: 'tutorial' };

/** Funciones del gremio (para marcar «¡Nuevo!» en la entrada del gremio). */
const GUILD_FEATURES = ['tacticas', 'mejoras', 'entrenamiento_campo', 'fogata', 'diario', 'cocina', 'sala_entrenamiento', 'tasador', 'forja', 'biblioteca', 'expediciones', 'prestigio'];

function infoPanel(state: GameState, el: HTMLElement) {
  const active = QUESTS.filter((q) => state.quests[q.id] && state.quests[q.id].status !== 'done');
  el.replaceChildren(
    h('div', 'info-gold', `Oro: ${state.gold}`),
    h('div', 'info-sub', `Bolsa ${bagUsed(state)}/${bagCapacity(state)}`),
    h('div', 'info-h', 'Equipo de incursión'),
    h('div', 'info-party', ...state.party.map((id) => {
      const st = memberStats(state, id);
      return h('div', 'mini-member', img(st.sprite, 2), h('span', '', `${st.name} Nv${st.level}`), elChip(st.element));
    })),
    h('div', 'info-h', 'Misiones'),
    ...active.map((q) => questLine(state, q)),
  );
  const step = nextStep(state);
  if (step) el.append(h('div', 'news-next', h('b', '', 'Lo siguiente: '), step));
  if (!active.length) el.append(h('div', 'muted', 'Sin misiones activas.'));
}

function questLine(state: GameState, q: QuestDef): HTMLElement {
  const qs = state.quests[q.id];
  const prog = objectiveTarget(q) > 1 ? ` ${qs.progress}/${objectiveTarget(q)}` : '';
  const tag = qs.status === 'ready' ? ' ¡Lista!' : prog;
  return h('div', `quest-line ${q.type}`, h('span', 'q-type', q.type === 'main' ? '★' : '•'), ` ${q.name}`, h('span', 'q-tag', tag));
}

/** openMap: abrir directamente el mapa ('travel': ya se estaba en él; 'zoom': se llega de fuera y se aleja desde el punto). */
export async function townScreen(state: GameState, openMap: false | 'travel' | 'zoom' = false): Promise<TownAction> {
  const loc = LOCATIONS[state.location];
  playMusic('town');
  let start = 0;
  // Recién llegados por el mapa: se sigue en el mapa (salvo en una ciudad tomada, que no deja salir a él).
  if (openMap && !isTaken(loc, state.flags, state.cleared)) {
    const a = await worldMap(state, openMap === 'zoom');
    if (a) return a;
  }
  for (;;) {
    // Ciudad tomada: no hay tienda ni posada hasta liberarla.
    if (isTaken(loc, state.flags, state.cleared)) {
      const d = DUNGEONS[loc.taken!.dungeon];
      const s = screen(`${loc.name} · tomada`, `${REGIONS[loc.region].name} · Ciudad caída`, 'dungeon', loc.x * 7 + loc.y, `${loc.name} ha caído. Demonios y esqueletos ocupan sus calles. No hay tienda, ni posada, ni tablón hasta liberarla.`);
      infoPanel(state, s.right);
      const r = await menu(s.left, [
        { label: `⚔ Liberar ${loc.name}`, right: stars(d.difficulty), desc: `${d.desc} (${d.floors} pisos, jefe al final)`, cls: 'go' },
        { label: 'Equipo y preparación', desc: 'El gremio sigue contigo: equipo, equipamiento y tácticas.' },
        { label: 'Opciones', desc: 'Guardar, controles, sonido y volver al título.' },
      ], { cancel: false });
      if (r === 0) return { kind: 'dungeon', dungeon: d.id };
      if (r === 1) {
        const who = await guildHub(state);
        if (who === 'tutorial') return { kind: 'tutorial' };
        if (who) return { kind: 'trial', member: who };
      } else if (await optionsMenu(state, s.left)) return { kind: 'title' };
      continue;
    }
    const kindName = loc.kind === 'capital' ? 'Capital' : loc.kind === 'torre' ? 'Fuera de la historia · mazmorras de prueba' : loc.kind === 'refugio' ? 'Refugio' : 'Pueblo';
    const s = screen(loc.name, `${REGIONS[loc.region].name} · ${kindName}`, loc.banner, loc.x * 7 + loc.y, loc.desc + rebuildNote(state, loc.id));
    infoPanel(state, s.right);
    const readyHere = questsAt(state, loc.id).filter((q) => state.quests[q.id]?.status === 'ready').length;
    // Lo que se ve depende de la historia (data/features.ts): al principio, lo justo.
    const guildNew = GUILD_FEATURES.some((id) => isNew(state, id));
    const options: [string, MenuItem][] = [
      ['tablon', { label: 'Tablón de misiones', right: readyHere ? `${readyHere} lista(s)` : '', desc: 'Encargos de esta localidad. Acepta, consulta o entrega misiones.' }],
      ['noticias', { label: 'Noticias', desc: 'Lo que se cuenta por aquí, y qué conviene hacer ahora.' }],
      ['gente', { label: 'Hablar con la gente', desc: 'Habla con los habitantes: cada uno tiene su historia, y muchos dan consejos para las mazmorras.' }],
      ['tienda', { label: 'Tienda', desc: 'Compra provisiones y objetos. Vende lo que no necesites.' }],
      ['herreria', { label: 'Herrería', desc: 'Compra y vende armas, armaduras y accesorios.' }],
      ['almacen', { label: 'Almacén', desc: 'Guarda objetos que no quieras llevar en la bolsa.' }],
      ['posada', { label: 'Posada', right: isNew(state, 'fogata') ? '¡Nuevo!' : unlocked(state, 'fogata') && pendingPairs(state).length ? '¡Fogata!' : '', desc: unlocked(state, 'fogata') ? 'Guarda la partida y comparte la fogata con el gremio.' : 'Guarda la partida.' }],
      ['reconstruccion', { label: 'Reconstrucción', desc: 'Dona oro para reconstruir: tiendas nuevas, descuentos y más.' }],
      ['gremio', { label: 'Gremio', right: guildNew ? '¡Nuevo!' : '', desc: 'Equipo de incursión, equipamiento y las salas del cuartel.' }],
      ['afinidad_aren', { label: `Afinidad de Aren: ${CLASSES[state.protagClass].name}`, desc: 'Elige el elemento de Aren: cambia sus habilidades, sus estadísticas y sus debilidades.' }],
      ['mapa', { label: 'Salir al mapa', desc: 'Viaja a otras localidades o entra en las mazmorras cercanas.' }],
    ];
    const shown = options.filter(([id]) => id !== 'reconstruccion' || projectsAt(state, loc.id).length).map(([id, it]) => [id, id === 'posada' || id === 'gremio' ? (unlocked(state, id) ? it : null) : featureItem(state, id, it)] as const).filter((p): p is readonly [string, MenuItem] => !!p[1]);
    const items: MenuItem[] = [...shown.map(([, it]) => it), { label: 'Opciones', desc: 'Guardar, controles, sonido y volver al título.' }];
    const r = await menu(s.left, items, { start, cancel: false });
    start = r;
    const label = items[r].label;
    const fid = shown[r]?.[0];
    if (fid) await introduce(state, fid);
    if (label === 'Tablón de misiones') await boardScreen(state);
    else if (label === 'Noticias') await newsScreen(state);
    else if (label === 'Hablar con la gente') await peopleScreen(state);
    else if (label === 'Tienda') await shopScreen(state);
    else if (label === 'Herrería') await forgeScreen(state);
    else if (label === 'Almacén') await storageScreen(state);
    else if (label === 'Posada') await innScreen(state);
    else if (label === 'Reconstrucción') await rebuildScreen(state);
    else if (label === 'Gremio') {
      const who = await guildHub(state);
      if (who === 'tutorial') return { kind: 'tutorial' };
      if (who) return { kind: 'trial', member: who };
    }
    else if (label.startsWith('Afinidad de Aren')) await affinityScreen(state);
    else if (label === 'Salir al mapa') {
      const a = await worldMap(state, true);
      if (a) return a;
    } else if (label === 'Opciones' && (await optionsMenu(state, s.left))) return { kind: 'title' };
  }
}

/** Devuelve true si se elige volver al título. */
async function optionsMenu(state: GameState, host: HTMLElement): Promise<boolean> {
  let start = 0;
  for (;;) {
    const items: MenuItem[] = [
      { label: 'Guardar partida' },
      { label: 'Música', right: musicOn() ? 'Activada' : 'Desactivada', desc: 'En mazmorra también con la tecla M.' },
      { label: 'Efectos de sonido', right: sfxOn() ? 'Activados' : 'Desactivados', desc: 'En mazmorra también con la tecla N.' },
      { label: 'Mapa de la mazmorra', right: MAP_MODE_NAMES[mapMode()], desc: 'En la esquina, a pantalla completa semitransparente (se ve el juego a través) u oculto. En mazmorra también con la tecla V.' },
      { label: 'Controles' },
      { label: 'Volver al título' },
      { label: 'Volver' },
    ];
    const o = await menu(host, items, { title: 'Opciones', start });
    start = o;
    if (o === 0) {
      saveGame(state);
      toast('Partida guardada.');
    } else if (o === 1) toggleMusic();
    else if (o === 2) toggleSfx();
    else if (o === 3) cycleMapMode();
    else if (o === 4) await alertBox('Controles', CONTROLS);
    else if (o === 5) {
      if (await confirm('¿Volver al título? Se perderá lo no guardado.')) return true;
    } else return false;
  }
}

async function peopleScreen(state: GameState) {
  const loc = LOCATIONS[state.location];
  let start = 0;
  for (;;) {
    const s = screen('Hablar con la gente', loc.name, loc.banner, loc.x * 7 + loc.y, 'Elige con quién hablar.');
    const npcs = loc.npcs.filter((n) => hasFlags(state, n.requires));
    const portrait = h('div', 'npc-portrait');
    s.right.append(portrait);
    const items: MenuItem[] = [...npcs.map((n) => ({ label: n.name, icon: n.sprite })), { label: 'Volver' }];
    const r = await menu(s.left, items, {
      start,
      onFocus: (i) => portrait.replaceChildren(...(npcs[i] ? [img(npcs[i].sprite, 8), h('div', 'npc-name', npcs[i].name)] : [])),
    });
    if (r < 0 || r === npcs.length) return;
    start = r;
    const n = npcs[r];
    const talk = [...n.talks].reverse().find((t) => hasFlags(state, t.requires)) ?? n.talks[0];
    await dialogue(talk.lines.map((text) => ({ who: 'npc', name: n.name, sprite: n.sprite, text })));
  }
}

/** Elegir la afinidad (clase/elemento) del protagonista, con la ficha de cada una. */
async function affinityScreen(state: GameState) {
  const s = screen('Afinidad de Aren', 'El elemento con el que Aren entra en cada mazmorra', 'capital', 29, 'Las afinidades se despiertan con la historia. También puedes cambiarla en la preparación antes de cada mazmorra.');
  await classMenu(state, s.left, (id) => s.right.replaceChildren(classDetail(state, id)));
}

function classDetail(state: GameState, id: string): HTMLElement {
  const c = CLASSES[id];
  const unlocked = state.unlockedClasses.includes(id);
  const names: Record<string, string> = { hp: 'Vida', atk: 'Ataque', def: 'Defensa', mag: 'Magia', res: 'Resist.' };
  const mods = Object.entries(c.mult).map(([k, v]) => `${names[k] ?? k} ${v! > 1 ? '+' : ''}${Math.round((v! - 1) * 100)}%`);
  return h('div', 'member-detail',
    h('div', 'md-head', img(`p_aren_${id}`, 5), h('div', '', h('h2', '', c.name), h('div', '', elChip(c.element)), h('div', 'muted', unlocked ? (id === state.protagClass ? 'Afinidad actual' : 'Disponible') : 'Bloqueada'))),
    h('p', '', unlocked ? c.desc : 'Se despierta más adelante en la historia.'),
    unlocked ? h('div', '', h('div', 'info-h', 'Estadísticas'), h('div', '', mods.join(' · ') || 'Sin cambios')) : '',
    unlocked ? h('div', 'info-h', 'Habilidades') : '',
    ...(unlocked ? c.skills.map((sk) => h('div', 'skill-line', h('b', '', SKILLS[sk.id].name), ` ${SKILLS[sk.id].cost}E · `, elChip(SKILLS[sk.id].element), ` — ${SKILLS[sk.id].desc}`)) : []),
    h('div', 'info-h', 'Débil contra'),
    h('div', '', ...weaknessesOf(c.element).map(elChip), weaknessesOf(c.element).length ? '' : 'Nada en especial'),
  );
}

// ---------------------------------------------------------------- tablón

async function boardScreen(state: GameState) {
  const loc = LOCATIONS[state.location];
  let start = 0;
  for (;;) {
    const s = screen('Tablón de misiones', loc.name, loc.banner, 5);
    const main = QUESTS.find((q) => q.type === 'main' && state.quests[q.id]?.status === 'active');
    s.right.append(h('div', 'info-h', 'Misión principal'), main ? h('div', 'quest-detail', h('b', '', main.name), h('p', '', main.desc)) : h('div', 'muted', 'Ninguna por ahora.'));
    const qs = questsAt(state, loc.id);
    if (!qs.length) {
      s.note.textContent = 'No hay encargos disponibles aquí ahora mismo.';
      await menu(s.left, [{ label: 'Volver' }]);
      return;
    }
    const items: MenuItem[] = qs.map((q) => {
      const st = state.quests[q.id];
      const right = !st ? 'Disponible' : st.status === 'ready' ? '¡Entregar!' : `En curso ${objectiveTarget(q) > 1 ? `${st.progress}/${objectiveTarget(q)}` : ''}`;
      return { label: q.name, right, desc: q.desc, cls: st?.status === 'ready' ? 'ready' : '' };
    });
    items.push({ label: 'Volver' });
    const r = await menu(s.left, items, { start });
    if (r < 0 || r === qs.length) return;
    start = r;
    const q = qs[r];
    const st = state.quests[q.id];
    if (!st) {
      if (await confirm(`${q.name}\n\n${q.desc}\n\n¿Aceptar el encargo?`, 'Aceptar', 'Ahora no')) {
        acceptQuest(state, q.id);
        toast(`Misión aceptada: ${q.name}`);
      }
    } else if (st.status === 'ready') {
      const res = completeQuest(state, q.id);
      if (q.rewards.scene) await dialogue(SCENES[q.rewards.scene]);
      await alertBox(`Misión completada: ${q.name}`, res.lines.length ? res.lines : ['¡Buen trabajo!']);
    } else if (await confirm(`${q.name}\n\n${q.desc}`, 'Seguir con ella', 'Abandonar')) {
      // nada
    } else {
      delete state.quests[q.id];
      toast('Misión abandonada.');
    }
  }
}

// ---------------------------------------------------------------- tienda y almacén

async function shopScreen(state: GameState) {
  const loc = LOCATIONS[state.location];
  let mode = 0;
  for (;;) {
    const s = screen('Tienda', `${loc.name} · Oro: ${state.gold}`, loc.banner, 9);
    s.right.append(h('div', 'info-gold', `Oro: ${state.gold}`), h('div', 'info-sub', `Bolsa ${bagUsed(state)}/${bagCapacity(state)}`), h('p', 'muted', 'Lo que no quepa en la bolsa se envía al almacén.'));
    mode = await menu(s.left, [{ label: 'Comprar' }, { label: 'Vender' }, { label: 'Volver' }], { start: mode });
    if (mode < 0 || mode === 2) return;
    let start = 0;
    for (;;) {
      s.subtitle.textContent = `${loc.name} · Oro: ${state.gold}`;
      s.right.replaceChildren(h('div', 'info-gold', `Oro: ${state.gold}`), h('div', 'info-sub', `Bolsa ${bagUsed(state)}/${bagCapacity(state)}`));
      if (mode === 0) {
        const shop = townShop(state, loc.id);
        const price = (id: string) => townPrice(state, loc.id, ITEMS[id].price);
        const items = shop.map((id) => ({ label: ITEMS[id].name, right: `${price(id)} oro · tienes ${state.bag[id] ?? 0}`, desc: ITEMS[id].desc, icon: ITEMS[id].sprite, disabled: state.gold < price(id) }));
        const r = await menu(s.left, [...items, { label: 'Volver' }], { start, title: 'Comprar' });
        if (r < 0 || r === items.length) break;
        start = r;
        const id = shop[r];
        state.gold -= price(id);
        if (!addToBag(state, id, 1)) {
          addToStorage(state, id, 1);
          toast(`${ITEMS[id].name} enviado al almacén (bolsa llena).`);
        } else toast(`Compras ${ITEMS[id].name}.`);
      } else {
        const list = bagList(state);
        const items = list.map((it) => ({ label: ITEMS[it.id].name, right: `x${it.qty} · ${Math.floor(ITEMS[it.id].price / 2)} oro`, desc: ITEMS[it.id].desc, icon: ITEMS[it.id].sprite }));
        const r = await menu(s.left, [...items, { label: 'Volver' }], { start, title: 'Vender' });
        if (r < 0 || r === items.length) break;
        start = r;
        const id = list[r].id;
        state.gold += Math.floor(ITEMS[id].price / 2);
        removeFromBag(state, id, 1);
      }
    }
  }
}

async function storageScreen(state: GameState) {
  const loc = LOCATIONS[state.location];
  let mode = 0;
  for (;;) {
    const s = screen('Almacén del gremio', loc.name, loc.banner, 13, 'El almacén es compartido entre todas las ciudades del gremio.');
    mode = await menu(s.left, [{ label: 'Retirar' }, { label: 'Depositar' }, { label: 'Volver' }], { start: mode });
    if (mode < 0 || mode === 2) return;
    let start = 0;
    for (;;) {
      s.right.replaceChildren(h('div', 'info-sub', `Bolsa ${bagUsed(state)}/${bagCapacity(state)}`));
      const src = mode === 0 ? state.storage : state.bag;
      const list = Object.entries(src).filter(([, q]) => q > 0);
      const items = list.map(([id, q]) => ({ label: ITEMS[id].name, right: `x${q}`, desc: ITEMS[id].desc, icon: ITEMS[id].sprite }));
      const r = await menu(s.left, [...items, { label: 'Volver' }], { start, title: mode === 0 ? 'Retirar' : 'Depositar' });
      if (r < 0 || r === items.length) break;
      start = r;
      const id = list[r][0];
      if (mode === 0) {
        if (!addToBag(state, id, 1)) {
          toast('La bolsa está llena.');
          continue;
        }
        state.storage[id]--;
        if (!state.storage[id]) delete state.storage[id];
      } else {
        removeFromBag(state, id, 1);
        addToStorage(state, id, 1);
      }
    }
  }
}

// ---------------------------------------------------------------- posada

async function innScreen(state: GameState) {
  const loc = LOCATIONS[state.location];
  for (;;) {
    const s = screen('Posada', loc.name, loc.banner, 17, 'Un fuego, una cama y un techo. Lo más parecido a un hogar en tierra perdida.');
    if (!unlocked(state, 'fogata')) {
      const r = await menu(s.left, [{ label: 'Descansar y guardar' }, { label: 'Volver' }], {});
      if (r !== 0) return;
      saveGame(state);
      toast('Descansáis. Partida guardada.');
      continue;
    }
    const pending = pendingPairs(state);
    s.right.append(
      h('div', 'info-h', 'Fogata'),
      pending.length
        ? h('div', '', ...pending.map(([x, y]) => h('div', 'bond', h('b', 'ok', '¡Charla pendiente! '), `${MEMBERS[x].name} y ${MEMBERS[y].name}`)))
        : h('p', 'muted', 'No hay charlas pendientes. La afinidad sube con los pisos que recorréis juntos (Gremio → Afinidad del grupo).'),
    );
    const r = await menu(s.left, [{ label: 'Descansar y guardar' }, { label: 'Fogata', right: pending.length ? `¡${pending.length} pendiente(s)!` : '', desc: 'Charlas entre compañeros que activan su siguiente nivel de afinidad.' }, { label: 'Volver' }], {});
    if (r < 0 || r === 2) return;
    if (r === 0) {
      saveGame(state);
      toast('Descansáis. Partida guardada.');
    } else {
      await introduce(state, 'fogata');
      await campfire(state, s.left);
    }
  }
}

// ---------------------------------------------------------------- gremio / preparación

async function classMenu(state: GameState, host: HTMLElement, onFocus?: (id: string) => void) {
  const items = Object.values(CLASSES).map((c) => ({
    label: c.name,
    right: state.unlockedClasses.includes(c.id) ? ELEMENTS[c.element].name : 'Bloqueada',
    desc: state.unlockedClasses.includes(c.id) ? `${c.desc} Habilidades: ${c.skills.map((s) => SKILLS[s.id].name).join(', ')}.` : 'Se despierta más adelante en la historia.',
    disabled: !state.unlockedClasses.includes(c.id),
    cls: c.id === state.protagClass ? 'current' : '',
  }));
  const ids = Object.keys(CLASSES);
  const r = await menu(host, items, { title: 'Afinidad de Aren', start: ids.indexOf(state.protagClass), onFocus: (i) => onFocus?.(ids[i]) });
  if (r >= 0) {
    state.protagClass = ids[r];
    toast(`Afinidad de Aren: ${CLASSES[ids[r]].name}`);
  }
}

/** Gestión del equipo. Con `dungeon` funciona como pantalla de preparación y devuelve si se entra. */
export async function partyScreen(state: GameState, dungeon: string | null, route?: RouteDef): Promise<boolean> {
  let start = 0;
  for (;;) {
    const d = dungeon ? DUNGEONS[dungeon] : null;
    const chain = dungeon ? dungeonChain(dungeon) : [];
    const totalFloors = chain.reduce((a, t) => a + t.floors, 0);
    const s = screen(d ? `Preparación · ${d.name}` : 'Gremio de la Expedición', d ? `${stars(d.difficulty)} · ${d.infinite ? 'pisos sin fin' : chain.length > 1 ? `${chain.length} tramos · ${totalFloors} pisos` : `${d.floors} pisos`}` : 'Miembros y equipo de incursión', d ? 'dungeon' : 'capital', 21);
    const roster = joinedMembers(state);
    if (d) {
      const pool = d.monsterPool === 'all' ? Object.values(MONSTERS).filter((m) => !m.boss && !m.reaper && !m.special) : chain.flatMap((t) => t.monsters.map((m) => MONSTERS[m.id]));
      const els = [...new Set(pool.map((m) => m.element))];
      const quests = QUESTS.filter((q) => state.quests[q.id]?.status === 'active' && 'dungeon' in q.objective && chain.some((t) => 'dungeon' in q.objective && t.id === q.objective.dungeon));
      s.right.append(h('div', '',
        h('p', '', d.desc),
        d.scaling === 'party'
          ? h('div', 'muted', `Los monstruos se ajustan al nivel medio del grupo (${Math.round(avgLevel(state))}) ${RANKS[state.babelRank].offset >= 0 ? '+' : ''}${RANKS[state.babelRank].offset} por el rango${d.infinite ? ', y suben con los pisos' : ''}. Partida guardada al entrar.`)
          : h('div', 'muted', `Nivel recomendado: ${d.levels[0] + 1}+ · Partida guardada al entrar.`),
        d.bossRush
          ? h('div', 'warn', `Récord: ${state.records[d.id] ?? 0} jefes. Cada piso es la sala de un jefe del juego al azar (se pueden repetir) y cada ${RUSH_CAMP_EVERY} jefes hay un campamento. Los jefes se hacen más fuertes según avanzáis y, desde el piso ${RUSH_MIX_FROM[0]}, salen dos a la vez (tres desde el ${RUSH_MIX_FROM[1]}). Dios llega con sus cuatro arcángeles, como en el trono.`)
          : d.infinite ? h('div', 'warn', `Récord: piso ${state.records[d.id] ?? 0}. Cada ${BOSS_EVERY} pisos hay un guardián (y tras vencerlo, un campamento) y, al pasarlo, los monstruos se hacen más fuertes.`) : '',
        chain.length > 1 ? h('div', 'info-h', 'Recorrido') : null,
        chain.length > 1 ? h('div', 'stage-list', ...chain.map((t, i) => h('div', 'stage', `${i + 1}. ${t.name} · ${t.floors} pisos${t.boss ? ' · jefe al final' : ''}`))) : null,
        chain.some((t) => t.boss) && !d.infinite ? h('div', 'muted', 'Tras vencer a un jefe hay un campamento para descansar y comprar antes del siguiente tramo.') : '',
        h('div', 'muted', `Pisos: ${[...new Set(chain.flatMap((t) => layoutsFor(t).map((l) => LAYOUT_NAMES[l.id])))].join(', ').toLowerCase()}.`),
        chain.some((t) => t.goals) ? h('div', 'muted', `En algunos pisos las escaleras piden algo antes de abrirse: ${[...new Set(chain.flatMap((t) => t.goals?.kinds ?? []))].map((k) => GOALS[k].name.toLowerCase()).join(', ')}.`) : '',
        h('div', 'muted', `Cada piso tiene ${REAPER_SECONDS / 60} minutos: si no bajáis a tiempo, llega la Parca.`),
        d.practice ? h('div', 'warn', 'Modo prueba: no se gana experiencia ni objetos. Al salir todo vuelve a como estaba (solo se guarda el récord).') : '',
        d.traps ? h('div', 'muted', `Trampas: ${d.traps.density >= 1 ? 'muchísimas' : d.traps.density >= 0.45 ? 'bastantes' : 'algunas'}.`) : '',
        d.locks ? h('div', 'muted', `Candados: ${d.locks.chance >= 1 ? 'en todos los pisos' : 'en algunos pisos'} (hasta ${d.locks.max}).`) : '',
        h('div', 'info-h', 'Elementos de los monstruos'),
        h('div', 'muted', 'En la lista: ▲ tiene ventaja contra alguno de estos elementos, ▼ es débil ante alguno.'),
        h('div', '', ...els.map(elChip), d.elementFloors ? h('span', 'muted', ' (cada piso, uno solo)') : ''),
        ...chain.filter((t) => t.boss && !t.practice).map((t) => h('div', 'warn', `Jefe${chain.length > 1 ? ` de ${t.name}` : ' en el núcleo'}: ${MONSTERS[t.boss!.monster].name} (${ELEMENTS[MONSTERS[t.boss!.monster].element].name})`)),
        quests.length ? h('div', 'info-h', 'Misiones aquí') : null,
        ...quests.map((q) => questLine(state, q)),
        h('div', 'info-h', 'Provisiones'),
        h('div', '', `Comida en la bolsa: ${bagList(state).filter((i) => ITEMS[i.id].kind === 'food').reduce((a, i) => a + i.qty, 0)} · Pociones: ${(state.bag.pocion ?? 0) + (state.bag.pocion_mayor ?? 0)}`),
        h('div', 'muted', 'El hambre baja más rápido cuanto más grande es el grupo.'),
      ));
    }
    const detail = h('div', '');
    if (!d) s.right.append(detail);
    s.note.textContent = `Equipo: ${state.party.length}/${PARTY_MAX}. Aren siempre va. Elige con cuidado los elementos.`;
    // En la preparación: contra qué elementos de la mazmorra tiene ventaja cada uno (▲) y ante cuáles es débil (▼).
    const dEls = d ? [...new Set((d.monsterPool === 'all' ? [] : chain.flatMap((t) => [...t.monsters.map((m) => m.id), ...(t.boss ? [t.boss.monster] : [])])).map((m) => MONSTERS[m].element))] : [];
    const away = awayMembers(state);
    const items: MenuItem[] = roster.map((id) => {
      const st = memberStats(state, id);
      const inParty = state.party.includes(id);
      const good = dEls.filter((e) => elementMultiplier(st.element, e) > 1);
      const bad = dEls.filter((e) => elementMultiplier(e, st.element) > 1);
      const tag = `${good.length ? ' ▲' : ''}${bad.length ? ' ▼' : ''}`;
      const vs = d && (good.length || bad.length) ? ` ${good.length ? `Ventaja contra ${good.map((e) => ELEMENTS[e].name.toLowerCase()).join(' y ')}.` : ''}${bad.length ? ` Débil ante ${bad.map((e) => ELEMENTS[e].name.toLowerCase()).join(' y ')}.` : ''}` : '';
      const where = away.includes(id) ? 'De expedición: no puede ir.' : inParty ? 'En el equipo.' : 'En reserva (gana 30% de la experiencia).';
      return { label: `${inParty ? '◆' : '◇'} ${st.name}`, right: `${away.includes(id) ? 'fuera · ' : ''}Nv${st.level} ${ELEMENTS[st.element].name}${tag}`, icon: st.sprite, desc: `${MEMBERS[id].role}. ${where}${vs}` };
    });
    const classOk = !!d && unlocked(state, 'afinidad_aren');
    const intelOk = !!d && unlocked(state, 'informante') && !d.practice;
    if (classOk) items.push({ label: `Afinidad de Aren: ${CLASSES[state.protagClass].name}`, desc: 'Cambia el elemento y las habilidades de Aren para esta mazmorra.' });
    if (intelOk && d) {
      const offers = intelOffers(state, d.id);
      const bought = offers.filter((o) => intelBought(state, d.id, o)).length;
      items.push({ label: 'Informante', right: bought ? `${bought}/${offers.length} comprado` : `${offers.length} datos a la venta`,
        desc: 'Vende lo que sabe de la mazmorra dato a dato: monstruos, jefes, escaleras, trampas, llaves... Pagas solo lo que quieras saber.' });
    }
    if (d?.scaling === 'party') items.push({ label: `Rango: ${RANKS[state.babelRank].name}`, desc: 'Fácil (−3 niveles), Normal, Difícil (+3) o Pesadilla (+6) respecto al nivel medio del grupo. Pulsa para cambiar.' });
    if (d) items.push({ label: route ? `Entrar · rumbo a ${LOCATIONS[route.a === state.location ? route.b : route.a].name}` : 'Entrar en la mazmorra', cls: 'go' });
    items.push({ label: 'Volver' });
    const r = await menu(s.left, items, {
      start,
      onFocus: (i) => {
        if (!d && i < roster.length) detail.replaceChildren(memberDetail(state, roster[i]));
      },
    });
    if (r < 0 || items[r].label === 'Volver') return false;
    start = r;
    if (r < roster.length) {
      const id = roster[r];
      if (d) {
        const choice = await menu(s.left, [{ label: state.party.includes(id) ? 'Quitar del equipo' : 'Añadir al equipo' }, { label: 'Ver ficha' }, { label: 'Volver' }], { title: MEMBERS[id].name });
        if (choice === 1) {
          s.right.replaceChildren(memberDetail(state, id));
          await menu(s.left, [{ label: 'Volver' }]);
          continue;
        }
        if (choice !== 0) continue;
      }
      if (id === 'aren') toast('Aren siempre va en la incursión.');
      else if (state.party.includes(id)) state.party = state.party.filter((p) => p !== id);
      else if (away.includes(id)) toast(`${MEMBERS[id].name} está de expedición.`);
      else if (state.party.length >= PARTY_MAX) toast(`Máximo ${PARTY_MAX} miembros por incursión.`);
      else state.party.push(id);
    } else if (d && items[r].label.startsWith('Afinidad de Aren')) {
      await introduce(state, 'afinidad_aren');
      await classMenu(state, s.left, (id) => s.right.replaceChildren(classDetail(state, id)));
    } else if (d && items[r].label === 'Informante') {
      await introduce(state, 'informante');
      await hireInformant(state, d.id);
    } else if (d && items[r].label.startsWith('Rango')) {
      state.babelRank = (state.babelRank + 1) % RANKS.length;
    } else if (d && (await checkPendingBonds(state)) && (await checkUnaccepted(state, d.id))) {
      return true;
    }
  }
}

/** Datos que el informante puede vender de esta mazmorra (solo los que tienen sentido en ella). */
function intelOffers(state: GameState, dungeon: string): IntelId[] {
  const chain = dungeonChain(dungeon);
  const any = (f: (d: (typeof chain)[number]) => unknown) => chain.some((d) => !!f(d));
  const quests = QUESTS.some((q) => state.quests[q.id]?.status === 'active' && (q.objective.kind === 'rescue' || q.objective.kind === 'collect') && chain.some((d) => 'dungeon' in q.objective && d.id === q.objective.dungeon));
  const out: IntelId[] = ['monstruos'];
  if (any((d) => d.boss && !d.practice)) out.push('jefe');
  out.push('escaleras');
  if (any((d) => d.traps)) out.push('trampas');
  if (any((d) => d.locks)) out.push('llaves');
  if (any((d) => d.cracks || d.secrets || d.sealedStairs)) out.push('secretos');
  if (any((d) => d.goals)) out.push('objetivos');
  if (quests) out.push('misiones');
  return out;
}
const intelBought = (state: GameState, dungeon: string, id: IntelId) => state.intel?.dungeon === dungeon && state.intel.bought.includes(id);
const intelCost = (dungeon: string, id: IntelId) => INTEL[id].price * DUNGEONS[dungeon].difficulty;
const avgLevel = (state: GameState) => state.party.reduce((a, id) => a + state.members[id].level, 0) / state.party.length;

/** El informante vende lo que sabe de la mazmorra dato a dato; los que marcan el mapa duran hasta salir de ella. */
async function hireInformant(state: GameState, dungeon: string) {
  const chain = dungeonChain(dungeon);
  const say = (text: string) => ({ who: 'npc', name: 'Informante', sprite: 'p_merchant', text });
  let start = 0;
  for (;;) {
    const offers = intelOffers(state, dungeon);
    const items: MenuItem[] = offers.map((id) => {
      const got = intelBought(state, dungeon, id);
      return { label: `${got ? '✓ ' : ''}${INTEL[id].name}`, right: got ? 'comprado' : `${intelCost(dungeon, id)} oro`, desc: INTEL[id].desc, disabled: !got && state.gold < intelCost(dungeon, id) };
    });
    items.push({ label: 'Volver' });
    const info = h('div', 'modal-text', h('p', '', `«${DUNGEONS[dungeon].name}... Algo sé. Tú pagas por lo que quieras saber.»`), h('p', 'muted', `Oro: ${state.gold}`));
    const r = await modalMenu('Informante', items, { info, start });
    if (r < 0 || r >= offers.length) return;
    start = r;
    const id = offers[r];
    if (!intelBought(state, dungeon, id)) {
      const cost = intelCost(dungeon, id);
      if (state.gold < cost) continue;
      state.gold -= cost;
      if (state.intel?.dungeon !== dungeon) state.intel = { dungeon, bought: [] };
      state.intel.bought.push(id);
    }
    await dialogue(intelLines(state, dungeon, id, chain).map(say));
  }
}

/** Lo que cuenta el informante de cada dato (se puede volver a escuchar sin pagar otra vez). */
function intelLines(state: GameState, dungeon: string, id: IntelId, chain: ReturnType<typeof dungeonChain>): string[] {
  const elName = (e: Parameters<typeof weaknessesOf>[0]) => ELEMENTS[e].name.toLowerCase();
  switch (id) {
    case 'monstruos': {
      const els = [...new Set(chain.flatMap((d) => d.monsters.map((m) => MONSTERS[m.id].element)))];
      if (!els.length) return ['Ahí dentro sale de todo. No sabría decirte qué te vas a encontrar.'];
      const weakTo = [...new Set(els.flatMap((e) => weaknessesOf(e)))].map(elName);
      const names = [...new Set(chain.flatMap((d) => d.monsters.map((m) => MONSTERS[m.id].name.toLowerCase())))];
      const out = [`Allí abajo hay ${names.join(', ')}. Sobre todo de ${els.map(elName).join(' y ')}.`];
      if (weakTo.length) out.push(`Si fuera tú, llevaría ${weakTo.join(' o ')}. Les hace mucho más daño.`);
      return out;
    }
    case 'jefe':
      return chain.filter((d) => d.boss).map((d) => {
        const b = MONSTERS[d.boss!.monster];
        return `Al final de ${d.name} espera ${b.name}. Es de ${elName(b.element)}: no le gusta nada ${weaknessesOf(b.element).map(elName).join(' ni ')}.`;
      });
    case 'escaleras':
      return ['Te marco en el mapa dónde quedan las escaleras de cada piso. Llegar hasta ellas ya es cosa tuya.'];
    case 'trampas':
      return ['Sé dónde pisaron los que no volvieron. Verás todas las trampas de cada piso desde que llegues.'];
    case 'llaves':
      return ['Las puertas con candado tienen su llave en otra sala del mismo piso. Te las dejo marcadas.'];
    case 'secretos':
      return ['Las paredes agrietadas se rompen de un golpe; las murallas reforzadas, solo con bombas, y detrás suele haber tesoro. Te marco dónde están.'];
    case 'objetivos':
      return ['Hay pisos cuyas escaleras no se abren solas: palancas, braseros, llaves de escalera o un monstruo alfa que guarda el sello.', 'Te marco dónde están las palancas, los braseros, las llaves y el alfa.'];
    case 'misiones': {
      const out: string[] = [];
      for (const [qid, qs] of Object.entries(state.quests)) {
        if (qs.status !== 'active') continue;
        const o = QUESTS.find((q) => q.id === qid)!.objective;
        if (o.kind === 'rescue' && chain.some((d) => d.id === o.dungeon)) out.push(`${o.npc} está en ${DUNGEONS[o.dungeon].name}, piso ${o.floor}. Te lo dejo marcado.`);
        if (o.kind === 'collect' && chain.some((d) => d.id === o.dungeon)) out.push(`Lo de ${ITEMS[o.item].name.toLowerCase()}: brilla en los rincones. También lo verás marcado.`);
      }
      return out.length ? out : ['Ahora mismo no buscas nada ahí dentro.'];
    }
  }
}

/** Avisa si alguna pareja del grupo tiene una fogata pendiente (su afinidad no subirá en esta incursión). Devuelve si se entra. */
async function checkPendingBonds(state: GameState): Promise<boolean> {
  const pend = pendingPairs(state, state.party);
  if (!pend.length) return true;
  const info = h('div', 'modal-text',
    h('p', '', 'Hay charlas de fogata pendientes en el grupo:'),
    ...pend.map(([a, b]) => h('p', '', `• ${MEMBERS[a].name} y ${MEMBERS[b].name}`)),
    h('p', 'muted', 'Hasta que las veáis en la posada, la afinidad de esas parejas no subirá en esta incursión.'),
  );
  const r = await modalMenu('Fogata pendiente', [{ label: 'Entrar igualmente' }, { label: 'Volver' }], { info });
  return r === 0;
}

/** Pantalla final de la incursión: lo que se hizo, cuántos puntos vale y el rango. */
/** Al terminar una incursión: pantalla negra con la puntuación y lo conseguido (`lines`). */
export async function scoreScreen(run: DungeonRun, result: RunResult, lines: string[] = []): Promise<void> {
  const sc = run.score();
  const title = result === 'clear' ? 'Incursión completada' : result === 'escape' ? 'Habéis escapado' : 'El grupo ha caído';
  const info = h('div', 'score',
    h('div', 'score-head', h('div', '', h('div', 'score-dungeon', run.chain[0].name), h('div', 'muted', run.chain.length > 1 ? `Hasta ${run.def.name} · ${run.floorLabel()}` : run.floorLabel())), h('div', `score-rank r-${sc.rank}`, sc.rank)),
    h('div', 'score-rows', ...sc.rows.map((r) => h('div', 'score-row', h('span', '', r.label), h('span', 'muted', r.value), h('b', r.points < 0 ? 'neg' : '', `${r.points > 0 ? '+' : ''}${r.points}`)))),
    h('div', 'score-total', h('span', '', 'Total'), h('b', '', `${sc.total}`)),
    result === 'death' ? h('p', 'warn', 'Al caer, todo lo conseguido en la incursión se pierde. Pero el puntaje queda.') : '',
  );
  // Fanfarria al completar; al caer, un lamento.
  playMusic(result === 'clear' ? 'victory' : result === 'death' ? 'defeat' : null);
  const loot = h('div', 'score-loot', ...lines.map((l) => h('p', '', l)));
  const list = h('div', 'score-menu');
  const page = h('div', 'score-screen', h('div', 'score-box', h('div', 'score-title', title), h('div', 'score-cols', info, lines.length ? loot : ''), list));
  modalRoot().append(page);
  await menu(list, [{ label: 'Continuar' }], { cancel: false });
  page.remove();
}

/** Avisa de secundarias sin aceptar que se podrían cumplir en esta mazmorra. Devuelve si se entra. */
async function checkUnaccepted(state: GameState, dungeon: string): Promise<boolean> {
  const pending = unacceptedFor(state, dungeon);
  if (!pending.length) return true;
  const here = pending.filter((q) => q.giver === state.location);
  const info = h('div', 'modal-text',
    h('p', '', `Hay misiones que podrías cumplir en ${DUNGEONS[dungeon].name} y no has aceptado:`),
    ...pending.map((q) => h('p', '', `• ${q.name} — tablón de ${LOCATIONS[q.giver!].name}`)),
    here.length < pending.length ? h('p', 'muted', 'Las de otras localidades solo se pueden aceptar allí.') : '',
  );
  const items: MenuItem[] = [];
  if (here.length) items.push({ label: here.length === pending.length ? 'Aceptarlas y entrar' : 'Aceptar las de aquí y entrar' });
  items.push({ label: 'Entrar sin aceptarlas' }, { label: 'Volver' });
  const r = await modalMenu('Misiones sin aceptar', items, { info });
  const choice = items[r]?.label ?? 'Volver';
  if (choice === 'Volver') return false;
  if (choice !== 'Entrar sin aceptarlas') {
    for (const q of here) acceptQuest(state, q.id);
    toast(`${here.length} misión(es) aceptada(s).`);
  }
  return true;
}

// ---------------------------------------------------------------- mapa

// El mapa del mundo está en ui/worldmap.ts.
