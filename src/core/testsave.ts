import { AFFINITY_LEVELS } from '../data/affinity';
import { CLASSES, MEMBERS, PRESTIGE_MAX } from '../data/characters';
import { DUNGEONS, dungeonChain } from '../data/dungeons';
import { EQUIPMENT } from '../data/equipment';
import { FEATURES } from '../data/features';
import { UPGRADES } from '../data/guild';
import { FINAL_QUEST, QUESTS, QUEST_BY_ID } from '../data/quests';
import { PROJECTS } from '../data/town';
import { LOCATIONS } from '../data/world';
import { newGame, pairKey, type GameState } from './state';
import { joinMember, learnedSkills, setSkills } from './stats';

/**
 * Partida de pruebas: toda la historia hecha salvo la última misión (el trono del Alba), todo el gremio a nivel 150
 * en Leyenda (prestigio 3), con el mejor equipo, el cuartel y los pueblos al máximo y afinidad máxima entre todos.
 * Empieza en el Jardín de las Plumas Caídas, a un paso de la mazmorra final.
 */
export function testSave(): GameState {
  const s = newGame();
  for (const id of Object.keys(MEMBERS)) if (!s.members[id]?.joined) joinMember(s, id);
  // Garrick traicionó al gremio en el acto 4: no está.
  s.members.garrick.joined = false;
  for (const m of Object.values(s.members)) {
    m.level = 150;
    m.xp = 0;
    m.prestige = PRESTIGE_MAX;
  }
  // El mejor equipo de cada hueco (las armas, del tipo de cada uno), incluidas las versiones mejoradas.
  for (const id of Object.keys(MEMBERS)) {
    const best = (slot: string, ok: (e: (typeof EQUIPMENT)[string]) => boolean) =>
      Object.values(EQUIPMENT).filter((e) => e.slot === slot && ok(e)).sort((a, b) => b.price - a.price)[0]?.id;
    s.members[id].gear = {
      weapon: best('weapon', (e) => e.kind === MEMBERS[id].weapon),
      armor: best('armor', () => true),
      accessory: best('accessory', () => true),
    };
  }
  // Habilidades: las tres de prestigio y la más fuerte de las normales (Aren, en cada afinidad).
  for (const id of Object.keys(MEMBERS)) {
    if (id !== 'aren') setSkills(s, id, learnedSkills(s, id).slice(-4));
    else {
      for (const c of Object.keys(CLASSES)) {
        s.protagClass = c;
        setSkills(s, id, learnedSkills(s, id).slice(-4));
      }
      s.protagClass = 'errante';
    }
  }
  s.party = ['aren', 'bram', 'lysa', 'kaela'];
  const done = QUESTS.filter((q) => q.id !== FINAL_QUEST);
  s.flags = [
    ...done.filter((q) => q.type === 'main').flatMap((q) => [...(q.rewards.flags ?? []), `done:${q.id}`]),
    ...done.filter((q) => q.type === 'side').map((q) => `done:${q.id}`),
    ...Object.keys(LOCATIONS).map((l) => `visit:${l}`),
  ];
  for (const q of done) s.quests[q.id] = { status: 'done', progress: 1 };
  s.quests[FINAL_QUEST] = { status: 'active', progress: 0 };
  s.unlockedClasses = Object.keys(CLASSES);
  // La mazmorra final (con sus tramos) queda por hacer.
  const fq = QUEST_BY_ID[FINAL_QUEST].objective;
  const finalChain = fq.kind === 'clear' ? dungeonChain(fq.dungeon).map((d) => d.id) : [];
  for (const d of Object.values(DUNGEONS)) if (!d.practice && !finalChain.includes(d.id)) s.cleared[d.id] = 1;
  s.gold = 99999;
  s.bag = { racion: 5, pocion_suprema: 6, elixir_mayor: 4, lagrima_alba: 2, bomba: 4, orbe_retorno: 1, semilla_vida: 2 };
  s.materials = { mineral_hierro: 30, cuero_bestia: 30, seda_arana: 30, hueso_viejo: 30, esencia_sombra: 30, cristal_hondonada: 20 };
  for (const u of Object.values(UPGRADES)) s.upgrades[u.id] = u.levels.length;
  for (const p of PROJECTS) s.rebuild[p.id] = p.levels.length;
  const ids = Object.keys(MEMBERS);
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++) {
      const k = pairKey(ids[i], ids[j]);
      s.affinity[k] = AFFINITY_LEVELS[AFFINITY_LEVELS.length - 1];
      s.bondLevel[k] = AFFINITY_LEVELS.length;
    }
  s.seenFeatures = Object.keys(FEATURES);
  s.location = 'jardin_plumas';
  return s;
}
