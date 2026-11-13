import { CLASSES, MEMBERS } from '../data/characters';
import { dungeonChain } from '../data/dungeons';
import { EQUIPMENT } from '../data/equipment';
import { ITEMS } from '../data/items';
import { QUESTS, QUEST_BY_ID, type QuestDef } from '../data/quests';
import { PARTY_MAX, addFlag, giveItem, hasFlag, hasFlags, type GameState } from './state';
import { joinMember } from './stats';

export function questsAt(state: GameState, location: string): QuestDef[] {
  return QUESTS.filter((q) => q.type === 'side' && q.giver === location && hasFlags(state, q.requires) && state.quests[q.id]?.status !== 'done' && (!q.member || state.members[q.member]?.joined));
}

/** ¿Puede avanzar ahora? (las personales, solo con su compañero en el equipo). */
export function questMemberHere(state: GameState, q: QuestDef): boolean {
  return !q.member || state.party.includes(q.member);
}

export function activeQuests(state: GameState): QuestDef[] {
  return QUESTS.filter((q) => state.quests[q.id] && state.quests[q.id].status !== 'done');
}

export function acceptQuest(state: GameState, id: string): void {
  state.quests[id] = { status: 'active', progress: 0 };
}

/** Activa las misiones principales cuyos requisitos ya se cumplen. Devuelve las nuevas. */
export function refreshMainQuests(state: GameState): QuestDef[] {
  const fresh: QuestDef[] = [];
  for (const q of QUESTS) {
    if (q.type === 'main' && !state.quests[q.id] && hasFlags(state, q.requires)) {
      acceptQuest(state, q.id);
      fresh.push(q);
    }
  }
  return fresh;
}

export function objectiveTarget(q: QuestDef): number {
  const o = q.objective;
  return o.kind === 'kill' || o.kind === 'collect' ? o.count : 1;
}

function bump(state: GameState, q: QuestDef, amount = 1): void {
  const qs = state.quests[q.id];
  if (!qs || qs.status !== 'active' || !questMemberHere(state, q)) return;
  qs.progress = Math.min(objectiveTarget(q), qs.progress + amount);
  if (qs.progress >= objectiveTarget(q)) qs.status = 'ready';
}

function active(state: GameState): QuestDef[] {
  return QUESTS.filter((q) => state.quests[q.id]?.status === 'active');
}

export function onKill(state: GameState, dungeon: string, monster: string): QuestDef[] {
  const done: QuestDef[] = [];
  for (const q of active(state)) {
    const o = q.objective;
    if (o.kind === 'kill' && o.monster === monster && (!o.dungeon || o.dungeon === dungeon)) {
      bump(state, q);
      if (state.quests[q.id].status === 'ready') done.push(q);
    }
  }
  return done;
}

export function onDungeonClear(state: GameState, dungeon: string): void {
  for (const q of active(state)) if (q.objective.kind === 'clear' && q.objective.dungeon === dungeon) bump(state, q);
}

export function onVisit(state: GameState, location: string): void {
  for (const q of active(state)) if (q.objective.kind === 'visit' && q.objective.location === location) bump(state, q);
}

export function onQuestEvent(state: GameState, questId: string): void {
  bump(state, QUEST_BY_ID[questId]);
}

export interface RewardResult {
  quest: QuestDef;
  lines: string[];
}

export function completeQuest(state: GameState, id: string): RewardResult {
  const q = QUEST_BY_ID[id];
  const r = q.rewards;
  const lines: string[] = [];
  state.quests[id].status = 'done';
  addFlag(state, `done:${id}`);
  if (r.gold) {
    state.gold += r.gold;
    lines.push(`+${r.gold} de oro`);
  }
  for (const [item, qty] of Object.entries(r.items ?? {})) {
    giveItem(state, item, qty);
    lines.push(`+${qty} ${ITEMS[item].name}`);
  }
  for (const [g, qty] of Object.entries(r.gear ?? {})) {
    state.gear[g] = (state.gear[g] ?? 0) + qty;
    lines.push(`Equipo: ${EQUIPMENT[g].name}`);
  }
  for (const f of r.flags ?? []) addFlag(state, f);
  if (r.join && !state.members[r.join]?.joined) {
    joinMember(state, r.join);
    if (state.party.length < PARTY_MAX) state.party.push(r.join);
    lines.push(`¡${MEMBERS[r.join].name} se une al gremio!`);
  }
  if (r.leave && state.members[r.leave]?.joined) {
    state.members[r.leave].joined = false;
    state.party = state.party.filter((id) => id !== r.leave);
    state.expeditions = state.expeditions.map((e) => ({ ...e, members: e.members.filter((m) => m !== r.leave) })).filter((e) => e.members.length);
    if (state.partner === r.leave) delete state.partner;
    // Sus misiones personales se pierden con él.
    for (const pq of QUESTS) if (pq.member === r.leave && state.quests[pq.id] && state.quests[pq.id].status !== 'done') delete state.quests[pq.id];
    lines.push(`${MEMBERS[r.leave].name} ya no forma parte del gremio.`);
  }
  if (r.moveTo) {
    state.location = r.moveTo;
    addFlag(state, `visit:${r.moveTo}`);
  }
  if (r.unlockClass && !state.unlockedClasses.includes(r.unlockClass)) {
    state.unlockedClasses.push(r.unlockClass);
    lines.push(`Nueva clase para Aren: ${CLASSES[r.unlockClass].name}`);
  }
  return { quest: q, lines };
}

export function readyMainQuests(state: GameState): QuestDef[] {
  return QUESTS.filter((q) => q.type === 'main' && state.quests[q.id]?.status === 'ready');
}

/** ¿Se puede avanzar esta misión dentro de esa mazmorra (en cualquiera de sus tramos)? */
export function questFitsDungeon(q: QuestDef, dungeon: string): boolean {
  const o = q.objective;
  if (o.kind === 'visit') return false;
  const chain = dungeonChain(dungeon);
  if (o.kind === 'kill' && !o.dungeon) return chain.some((d) => d.monsters.some((m) => m.id === o.monster));
  return chain.some((d) => d.id === o.dungeon);
}

/** Secundarias disponibles (en localidades ya visitadas) que no se han aceptado y sirven para esa mazmorra. */
export function unacceptedFor(state: GameState, dungeon: string): QuestDef[] {
  return QUESTS.filter(
    (q) => q.type === 'side' && !state.quests[q.id] && hasFlags(state, q.requires) && !!q.giver && hasFlag(state, `visit:${q.giver}`) && questFitsDungeon(q, dungeon) && (!q.member || state.members[q.member]?.joined),
  );
}
