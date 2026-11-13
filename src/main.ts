import Phaser from 'phaser';
import './style.css';
import { playMusic, unlockAudio } from './audio/audio';
import { MEMBERS, PRESTIGE_NAMES, PRESTIGE_SKILLS } from './data/characters';
import { PRESTIGE_LINES } from './data/story';
import { DUNGEONS, dungeonChain } from './data/dungeons';
import { featuresUnlockedBy } from './data/features';
import { BENCH_XP } from './data/guild';
import { ITEMS } from './data/items';
import { SKILLS } from './data/skills';
import { EPILOGUES, SCENES } from './data/story';
import { FINAL_QUEST } from './data/quests';
import { LOCATIONS, type RouteDef } from './data/world';
import { completeQuest, onDungeonClear, onVisit, readyMainQuests, refreshMainQuests } from './core/quests';
import { SKILL_SLOTS, addFlag, loadGame, newGame, pairKey, saveGame, upgradeLevel, type GameState } from './core/state';
import { equippedSkills, gainXp, joinedMembers, setSkills } from './core/stats';
import { runDungeon } from './dungeon/controller';
import { testSave } from './core/testsave';
import { AFFINITY_LEVELS, AFFINITY_NAMES, levelFromPoints } from './data/affinity';
import { DungeonRun } from './dungeon/run';
import { DungeonScene } from './dungeon/scene';
import { buildSprites } from './gfx/sprites';
import { alertBox, dialogue, modalMenu, toast } from './ui/dom';
import { openWindow, setSidebarState } from './ui/layout';
import { zoomIntoMap } from './ui/worldmap';
import { partyScreen, scoreScreen, titleScreen, townScreen } from './ui/screens';
import { advanceExpeditions, rebuildRewards, returnScene } from './ui/town';

let state: GameState;

function setState(s: GameState) {
  state = s;
  setSidebarState(s);
}
let scene: DungeonScene;
let game: Phaser.Game;

function showGame(v: boolean) {
  // visibility (no display:none) para que el canvas de Phaser conserve su tamaño.
  document.getElementById('game-wrap')!.classList.toggle('offscreen', !v);
  document.getElementById('ui')!.classList.toggle('hidden', v);
  if (v) game.scale.refresh();
}

/** Completa principales listas, reproduce sus escenas y activa las siguientes. */
async function advanceStory() {
  for (;;) {
    const ready = readyMainQuests(state);
    for (const q of ready) {
      const partner = state.partner;
      const res = completeQuest(state, q.id);
      if (q.rewards.scene) await dialogue(SCENES[q.rewards.scene]);
      // Quien se va era la pareja de Aren (la traición de Garrick): escena propia.
      if (q.rewards.leave && partner === q.rewards.leave && SCENES[`${partner}_pareja`]) await dialogue(SCENES[`${partner}_pareja`]);
      if (q.id === FINAL_QUEST) await finale();
      // Lo que se desbloquea con esta misión (sale como «¡Nuevo!» en los menús).
      const fresh = (q.rewards.flags ?? []).flatMap((f) => featuresUnlockedBy(f)).map(([, f]) => `Nuevo: ${f.name}.`);
      await alertBox(`Misión principal completada: ${q.name}`, [...(res.lines.length ? res.lines : ['La historia avanza.']), ...fresh]);
    }
    const fresh = refreshMainQuests(state);
    for (const q of fresh) {
      if (q.startScene) await dialogue(SCENES[q.startScene]);
      await alertBox('Nueva misión principal', [q.name, q.desc]);
    }
    if (!ready.length && !fresh.length) return;
  }
}

/** El final: Aren elige quién ocupa el trono; después, el epílogo según su pareja y los créditos. */
async function finale() {
  const c = await modalMenu('¿Quién ocupa el lugar de Dios?', [
    { label: '«Que ocupe su lugar Lysa»', desc: 'Lysa sube al trono y sostiene el universo. Los demás vuelven a casa.' },
    { label: '«Lo haré yo»', desc: 'Aren ocupa el lugar de Dios. El mundo sigue, pero Aren no puede volver.' },
    { label: '«No quiero perder a nadie. Ni a mí»', desc: 'Nadie sube al trono: el universo vuelve a empezar, antes de la Fractura.' },
  ], { cancel: false });
  const id = (['lysa', 'aren', 'reinicio'] as const)[Math.max(0, c)];
  await dialogue(SCENES[`final_${id}`]);
  const partner = state.partner && EPILOGUES[state.partner] ? state.partner : '';
  await dialogue([{ who: 'narrador', text: EPILOGUES[partner][id] }]);
  addFlag(state, `final_${id}`);
  await dialogue(SCENES.creditos);
}

async function arrive(location: string) {
  state.location = location;
  addFlag(state, `visit:${location}`);
  onVisit(state, location);
  await advanceStory();
}

/** `fromMap`: se eligió en el mapa (la preparación sale en una ventana sobre él y se entra con un acercamiento). */
async function enterDungeon(dungeonId: string, route?: RouteDef, solo?: string, fromMap = false) {
  const def = DUNGEONS[dungeonId];
  // El campo de entrenamiento y la prueba de prestigio no pasan por la preparación.
  if (!solo && dungeonId !== 'tutorial') {
    const win = fromMap ? openWindow() : null;
    const ok = await partyScreen(state, dungeonId, route);
    win?.close();
    if (!ok) return;
  }
  saveGame(state);
  // Prueba de prestigio: se va solo (la partida se guarda antes con el equipo de siempre).
  const party = state.party;
  if (solo) state.party = [solo];
  const bagBefore = { ...state.bag };
  const run = new DungeonRun(state, dungeonId, Date.now(), { intel: state.intel?.dungeon === dungeonId ? state.intel.bought : [], rank: state.babelRank });
  if (fromMap) await zoomIntoMap();
  const result = await runDungeon(scene, run, showGame);
  state.party = party;
  const score = run.score();
  // El mejor puntaje se guarda pase lo que pase (también al caer o en modo prueba).
  const keepBest = () => {
    const b = state.bestScores[dungeonId];
    if (!b || score.total > b.total) state.bestScores[dungeonId] = { total: score.total, rank: score.rank };
  };

  // Modo prueba: se restaura la partida tal como estaba al entrar; solo se conservan el récord y las tácticas.
  if (def.practice) {
    const { records, tactics } = state;
    setState(loadGame() ?? state);
    for (const [id, f] of Object.entries(records)) state.records[id] = Math.max(state.records[id] ?? 0, f);
    state.tactics = tactics;
    keepBest();
    saveGame(state);
    if (dungeonId === 'tutorial') {
      await alertBox(result === 'clear' ? 'Entrenamiento completado' : 'Fin del entrenamiento', [
        result === 'clear' ? '¡Ya conoces las mecánicas básicas! Las mazmorras de verdad son distintas cada vez.' : 'Puedes volver a intentarlo cuando quieras.',
        'Puedes repetir el campo desde el gremio. En el entrenamiento no se gana ni se pierde nada.',
      ]);
      return;
    }
    await scoreScreen(run, result, [
      `Habéis llegado al ${def.bossRush ? `jefe ${run.floor}` : `piso ${run.floor}`} de ${def.name}. Récord: ${state.records[dungeonId] ?? run.floor}.`,
      'Modo prueba: no se gana experiencia y nada de lo encontrado o gastado se conserva.',
    ]);
    return;
  }

  if (result === 'death') {
    await scoreScreen(run, result, [
      `La oscuridad de ${def.name} os engulle...`,
      'Despiertas antes de la entrada. Todo lo ocurrido en la incursión se ha perdido.',
    ]);
    // El récord de piso se conserva aunque se pierda la incursión.
    const records = state.records;
    setState(loadGame() ?? state);
    for (const [id, f] of Object.entries(records)) state.records[id] = Math.max(state.records[id] ?? 0, f);
    keepBest();
    saveGame(state);
    return;
  }

  keepBest();
  const lines: string[] = [];
  // Los que se quedaron en reserva también aprenden algo (más con la sala de entrenamiento mejorada).
  const bench = joinedMembers(state).filter((id) => !state.party.includes(id));
  for (const id of bench) {
    const r = gainXp(state, id, Math.round(run.xpEarned * BENCH_XP[upgradeLevel(state, 'entrenamiento')]));
    if (r.levels) lines.push(`${MEMBERS[id].name} (en reserva) sube al nivel ${state.members[id].level}.`);
    for (const sk of r.pending) lines.push(`${MEMBERS[id].name} puede aprender ${SKILLS[sk].name}: elígela en la sala de entrenamiento.`);
  }
  lines.unshift(`Oro encontrado: ${run.goldFound} · Experiencia: ${run.xpEarned}`);
  // La bolsa de ingredientes se vacía en la despensa del cuartel.
  const pouch = Object.entries(run.pouch);
  for (const [id, q] of pouch) state.pantry[id] = (state.pantry[id] ?? 0) + q;
  if (pouch.length) lines.push(`A la despensa: ${pouch.map(([id, q]) => `${ITEMS[id].name} x${q}`).join(', ')}.`);
  const mats = Object.entries(run.materials);
  for (const [id, q] of mats) state.materials[id] = (state.materials[id] ?? 0) + q;
  if (mats.length) lines.push(`Al almacén de materiales: ${mats.map(([id, q]) => `${ITEMS[id].name} x${q}`).join(', ')}.`);
  // Objetos que el grupo trae en la bolsa y no tenía al entrar.
  const gained = Object.entries(state.bag).filter(([id, q]) => q > (bagBefore[id] ?? 0) && ITEMS[id]);
  if (gained.length) lines.push(`Objetos: ${gained.map(([id, q]) => `${ITEMS[id].name} x${q - (bagBefore[id] ?? 0)}`).join(', ')}.`);
  delete state.intel;

  // Reconstrucción (oro extra, regalos de Vado) y expediciones de la reserva que vuelven.
  lines.push(...rebuildRewards(state, run.goldFound, result === 'clear'), ...advanceExpeditions(state));
  // Afinidad: cada pareja suma los pisos recorridos juntos (la mitad si se escapa), salvo si tiene una fogata pendiente.
  if (!solo) lines.push(...gainAffinity(result === 'clear' ? run.stats.floors : Math.floor(run.stats.floors / 2)));
  if (solo && result === 'clear') lines.push(...(await ascend(solo)));
  if (result === 'clear') {
    // Todos los tramos de la incursión cuentan como superados.
    for (const d of dungeonChain(dungeonId)) state.cleared[d.id] = (state.cleared[d.id] ?? 0) + 1;
    onDungeonClear(state, dungeonId);
    await scoreScreen(run, result, lines);
    // La charla de vuelta solo si no viene justo después una escena de la historia (no saturar).
    const storyNext = readyMainQuests(state).length > 0 || !!route;
    if (!solo && !storyNext) await dialogue(returnScene(state.party, true, def.name));
    if (route) {
      const to = route.a === state.location ? route.b : route.a;
      toast(`Ruta asegurada. Llegáis a ${LOCATIONS[to].name}.`);
      await arrive(to);
    } else await advanceStory();
  } else {
    await scoreScreen(run, result, ['Volvéis a la superficie con lo que llevabais.', ...lines]);
    if (!solo) await dialogue(returnScene(state.party, false, def.name));
  }
  saveGame(state);
}

/** Prestigio superado: nivel 1, más fuerte, habilidad nueva y traje nuevo. */
async function ascend(id: string): Promise<string[]> {
  const m = state.members[id];
  m.prestige = (m.prestige ?? 0) + 1;
  m.level = 1;
  m.xp = 0;
  const sk = PRESTIGE_SKILLS[id][m.prestige - 1];
  // La habilidad nueva entra en el primer hueco libre (o sustituye a la última).
  const eq = equippedSkills(state, id);
  setSkills(state, id, eq.length < SKILL_SLOTS ? [...eq, sk] : [...eq.slice(0, SKILL_SLOTS - 1), sk]);
  await dialogue([
    { who: 'narrador', text: `El eco de ${MEMBERS[id].name} se deshace en luz. Algo ha cambiado para siempre.` },
    { who: id, text: PRESTIGE_LINES[id] ?? 'Ya no soy quien bajó.' },
  ]);
  return [`¡${MEMBERS[id].name} alcanza el prestigio ${PRESTIGE_NAMES[m.prestige]}! Vuelve al nivel 1, más fuerte, con traje nuevo y una habilidad: ${SKILLS[sk].name}.`];
}

/** Suma afinidad a las parejas del grupo. Al llegar a un nivel se queda esperando la fogata de la posada. */
function gainAffinity(points: number): string[] {
  const out: string[] = [];
  const p = state.party;
  for (let i = 0; i < p.length; i++)
    for (let j = i + 1; j < p.length; j++) {
      const k = pairKey(p[i], p[j]);
      const level = state.bondLevel[k] ?? 0;
      const next = AFFINITY_LEVELS[level];
      const names = `${MEMBERS[p[i]].name} y ${MEMBERS[p[j]].name}`;
      if (next === undefined || points <= 0) continue;
      const before = state.affinity[k] ?? 0;
      if (before >= next) {
        out.push(`${names}: fogata pendiente, su afinidad no sube hasta que la veáis en la posada.`);
        continue;
      }
      state.affinity[k] = Math.min(next, before + points);
      if (levelFromPoints(state.affinity[k]) > level) out.push(`¡${names} alcanzan ${AFFINITY_NAMES[level]}! Id a la fogata de la posada para activarla.`);
      else out.push(`Afinidad de ${names}: ${state.affinity[k]}/${next}.`);
    }
  return out;
}

async function worldLoop() {
  await arrive(state.location);
  saveGame(state);
  let onMap: false | 'travel' | 'zoom' = false;
  for (;;) {
    const a = await townScreen(state, onMap);
    onMap = false;
    // Lo elegido en el mapa vuelve al mapa (el pueblo es «dentro», el mapa es «fuera»).
    if (a.kind === 'title') return;
    if (a.kind === 'tutorial') {
      await enterDungeon('tutorial');
      continue;
    }
    if (a.kind === 'trial') {
      await enterDungeon('prueba_prestigio', undefined, a.member);
      continue;
    }
    if (a.kind === 'travel') {
      await arrive(a.to);
      saveGame(state);
      onMap = a.map ? 'travel' : false;
    } else {
      await enterDungeon(a.dungeon, a.route, undefined, !!a.map);
      onMap = a.map ? 'zoom' : false;
    }
  }
}

async function main() {
  await document.fonts.load('16px VT323').catch(() => undefined);
  buildSprites();
  window.addEventListener('pointerdown', unlockAudio, { once: false });
  window.addEventListener('keydown', unlockAudio, { once: false });

  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    pixelArt: true,
    backgroundColor: '#050307',
    scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
    scene: [DungeonScene],
  });
  scene = await new Promise<DungeonScene>((resolve) => game.events.once('dungeon-ready', resolve));
  showGame(false);
  // Depuración en desarrollo: desde la consola, __enter('trono_dios') entra directamente en una mazmorra.
  if (import.meta.env.DEV) (window as unknown as { __enter: (id: string) => Promise<void> }).__enter = (id) => enterDungeon(id);

  for (;;) {
    const saved = loadGame();
    setSidebarState(null);
    const choice = await titleScreen(!!saved);
    if (choice === 'continue' && saved) setState(saved);
    else if (choice === 'test') {
      setState(testSave());
      saveGame(state);
    }
    else {
      setState(newGame());
      playMusic('town');
      await dialogue(SCENES.intro);
    }
    await worldLoop();
  }
}

void main();
