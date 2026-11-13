import { playMusic, sfx, toggleMusic, toggleSfx } from '../audio/audio';
import { cycleMapMode, mapMode, MAP_MODE_NAMES } from '../ui/prefs';
import { CLASSES, MEMBERS } from '../data/characters';
import { CAMP_SHOP, DUNGEONS } from '../data/dungeons';
import { ELEMENTS, weaknessesOf } from '../data/elements';
import { EQUIPMENT, SLOT_NAMES, WEAPON_NAMES, type Slot } from '../data/equipment';
import { ITEMS } from '../data/items';
import { QUESTS } from '../data/quests';
import { TERRAIN, terrainOfCode } from '../data/terrain';
import { SKILLS, STATUSES, type StatusId } from '../data/skills';
import { TACTICS } from '../data/tactics';
import { LOCK_BY_ID, TRAPS } from '../data/traps';
import { objectiveTarget, questFitsDungeon } from '../core/quests';
import { bagCapacity, bagList, bagUsed, materialBagCapacity, pouchCapacity, tacticOf } from '../core/state';
import { memberStats, xpToNext } from '../core/stats';
import { TAB_NEXT, TAB_PREV, alertBox, bar, confirm, dialogue, h, img, isBack, isOk, modalMenu, modalRoot, pushKeys, toast, type MenuItem } from '../ui/dom';
import { SCENES } from '../data/story';
import { elChip, gearSummary } from '../ui/layout';
import { tacticsMenu } from '../ui/tactics';
import type { DungeonRun, RunResult } from './run';
import type { DungeonScene } from './scene';
import type { Actor, GameEvent } from './types';

const DIR_KEYS: Record<string, [number, number]> = {
  ArrowUp: [0, -1], w: [0, -1], Numpad8: [0, -1],
  ArrowDown: [0, 1], s: [0, 1], Numpad2: [0, 1],
  ArrowLeft: [-1, 0], a: [-1, 0], Numpad4: [-1, 0],
  ArrowRight: [1, 0], d: [1, 0], Numpad6: [1, 0],
  q: [-1, -1], Numpad7: [-1, -1],
  e: [1, -1], Numpad9: [1, -1],
  z: [-1, 1], Numpad1: [-1, 1],
  c: [1, 1], Numpad3: [1, 1],
};

export const CONTROLS = [
  'Mover: flechas / WASD · Diagonales: Q E Z C (o teclado numérico)',
  'Girar sin moverse: mantén Mayús (marca la casilla de enfrente) + dirección. La flecha roja indica hacia dónde miras.',
  'Atacar al frente: Espacio · Chocar con un enemigo también ataca',
  'Habilidades: 1 2 3 4 (o K para la lista)',
  'Bolsa: I · Equipo: T · Esperar turno: R o . · Menú: Esc',
  'Mapa: V (en la esquina, a pantalla completa semitransparente u oculto)',
  'Cambiar de líder: L (otro miembro pasa a mandar; si Aren cae, la incursión termina igual)',
  'Piloto automático: P. Explora, recoge, combate y baja solo; cualquier tecla lo detiene.',
  'Escaleras: pisa la casilla dorada',
  'Música: M · Efectos de sonido: N (cada uno por separado)',
];

/** Ejecuta una incursión completa y resuelve con su resultado. */
export function runDungeon(scene: DungeonScene, run: DungeonRun, showGame: (v: boolean) => void): Promise<Exclude<RunResult, null>> {
  return new Promise((resolve) => {
    const hud = document.getElementById('hud')!;
    hud.replaceChildren();
    const top = h('div', 'hud-top');
    const partyEl = h('div', 'hud-party');
    const logEl = h('div', 'hud-log');
    const skillsEl = h('div', 'hud-skills');
    const mini = h('canvas', 'minimap');
    const help = h('div', 'hud-help', 'Esc: menú · I: bolsa · T: equipo · L: líder · 1-4: habilidades · R: esperar · V: mapa · P: automático · M: música · N: efectos');
    const side = h('div', 'hud-side');
    const questsEl = h('div', 'hud-quests');
    const timerEl = h('div', 'hud-timer');
    side.append(timerEl, mini, questsEl);
    // Cortina de transición al entrar y al cambiar de piso.
    const curtain = h('div', 'curtain on');
    // Llaves del piso: debajo del resumen superior, no dentro.
    const keysEl = h('div', 'hud-keys');
    const topWrap = h('div', 'hud-top-wrap', top, keysEl);
    // Mapa a pantalla completa: por debajo de los paneles del HUD, deja ver el juego a través.
    const bigMap = h('canvas', 'minimap-full');
    const autoEl = h('div', 'hud-auto', '▶ Piloto automático · cualquier tecla para tomar el control');
    autoEl.style.display = 'none';
    hud.append(bigMap, topWrap, partyEl, side, logEl, skillsEl, help, autoEl, curtain);
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const curtainText = () => curtain.replaceChildren(h('div', 'curtain-title', run.def.name), h('div', 'curtain-floor', run.floorLabel()));
    const showCurtain = async () => {
      curtainText();
      curtain.classList.add('on');
      await wait(450);
    };
    const hideCurtain = async () => {
      await wait(750);
      curtain.classList.remove('on');
      await wait(300);
    };
    const music = () => playMusic(run.isBossFloor ? 'boss' : run.def.music);
    curtainText();
    const logLines: HTMLElement[] = [];

    const log = (text: string, color?: string) => {
      const p = h('div', 'log-line', text);
      if (color) p.style.color = color;
      logEl.append(p);
      logLines.push(p);
      while (logLines.length > 6) logLines.shift()!.remove();
    };

    showGame(true);
    scene.attach(run, log);
    // Depuración en desarrollo: desde la consola, __run.startFloor(n) salta de piso, __run.revealMap() revela el mapa.
    if (import.meta.env.DEV) (window as unknown as { __run: DungeonRun }).__run = run;
    music();
    const firstEvents = run.drainEvents();
    for (const e of firstEvents) if (e.t === 'log') log(e.text, e.color);

    let busy = true;
    // Carteles del primer piso (campo de entrenamiento): al quitarse la cortina.
    void wait(1300).then(hideCurtain).then(async () => {
      for (const e of firstEvents) if (e.t === 'tip') await alertBox(e.title, e.lines);
      busy = false;
    });
    let finished = false;
    let bossTalked = false;

    const statusChips = (a: Actor) =>
      (Object.keys(a.statuses) as StatusId[]).map((k) => {
        const c = h('span', 'chip', STATUSES[k].short);
        c.style.color = STATUSES[k].color;
        return c;
      });

    const questPanel = () => {
      const qs = QUESTS.filter((q) => run.state.quests[q.id] && run.state.quests[q.id].status !== 'done');
      questsEl.classList.toggle('hidden', !qs.length);
      questsEl.replaceChildren(
        h('div', 'hq-title', 'Misiones'),
        ...qs.map((q) => {
          const st = run.state.quests[q.id];
          const prog = st.status === 'ready' ? '✓' : objectiveTarget(q) > 1 ? `${st.progress}/${objectiveTarget(q)}` : '';
          const here = run.chain.some((d) => questFitsDungeon(q, d.id));
          return h('div', `hq ${here ? 'here' : ''} ${st.status === 'ready' ? 'done' : ''}`, h('span', 'hq-name', `${q.type === 'main' ? '★' : '•'} ${q.name}`), h('span', 'hq-prog', prog));
        }),
      );
    };

    /** Aviso grande y breve cuando se cumple una misión. */
    const questBanner = (name: string) => {
      const b = h('div', 'quest-banner', h('div', 'qb-title', '¡Misión completada!'), h('div', 'qb-name', name), h('div', 'qb-sub', 'Entrégala en el tablón de su localidad.'));
      hud.append(b);
      sfx('levelup');
      setTimeout(() => b.classList.add('out'), 2600);
      setTimeout(() => b.remove(), 3200);
    };

    const updateHud = () => {
      const keyChips = run.keys.map((k) => {
        const c = h('span', 'key-chip', '⚿');
        c.style.color = LOCK_BY_ID[k].color;
        return c;
      });
      top.replaceChildren(
        h('div', 'hud-title', `${run.def.name} · ${run.floorLabel()}`),
        h('div', 'hud-belly', h('span', '', run.belly <= 0 ? '¡Os morís de hambre!' : `Provisiones ${Math.ceil(run.belly)}`), bar(run.belly, 100, run.belly < 25 ? 'belly low' : 'belly')),
        run.goalLabel() ? h('div', `hud-goal ${run.goal?.done && run.goal.kind !== 'vigias' ? 'done' : ''}`, `◆ ${run.goalLabel()}`) : '',
        run.curseLabel() ? h('div', 'hud-curse', `☠ ${run.curseLabel()}`) : '',
        h('div', 'hud-gold', `Oro ${run.state.gold} · Bolsa ${bagUsed(run.state)}/${bagCapacity(run.state)} · Ingred. ${run.pouchUsed()}/${pouchCapacity(run.state)} · Mater. ${run.materialsUsed()}/${materialBagCapacity(run.state)}`),
      );
      // Aviso de hambre: el resumen parpadea en rojo (más rápido si ya se está muriendo de hambre).
      top.classList.toggle('starving', run.belly > 0 && run.belly <= 15);
      top.classList.toggle('starved', run.belly <= 0);
      keysEl.replaceChildren(...(keyChips.length ? [h('span', 'muted', 'Llaves '), ...keyChips] : []));
      keysEl.classList.toggle('hidden', !keyChips.length);
      const boss = run.boss;
      // El feto del trono: si es inmune o vulnerable (y cuánto le queda), junto a su nombre.
      const note = run.wardNote();
      if (boss && run.actorVisible(boss)) top.append(h('div', 'hud-boss', h('span', '', boss.name), ...(note ? [h('span', `hud-ward ${run.warded(boss) ? '' : 'open'}`, note)] : []), bar(boss.hp, boss.maxHp, 'hp boss')));
      const reaper = run.reaper;
      if (reaper && run.isVisible(reaper.x, reaper.y)) top.append(h('div', 'hud-boss', h('span', '', `${reaper.name} Nv${reaper.level}`), bar(reaper.hp, reaper.maxHp, 'hp boss')));
      drawTimer();
      partyEl.replaceChildren(
        ...run.actors
          .filter((a) => a.side === 'party')
          .map((a) =>
            h('div', `pcard ${a.alive ? '' : 'down'}`,
              img(a.sprite, 2, 'pcard-img'),
              h('div', 'pcard-body',
                h('div', 'pcard-name', a === run.leader ? h('span', 'lead', '★ ') : '', `${a.name} `, h('span', 'lv', `Nv${a.level}`), ...statusChips(a)),
                bar(a.hp, a.maxHp, 'hp'),
                h('div', 'pcard-nums', `${Math.max(0, a.hp)}/${a.maxHp}`),
                bar(a.sp, a.maxSp, 'sp'),
              ),
            ),
          ),
      );
      const L = run.leader;
      skillsEl.replaceChildren(
        ...L.skills.map((sid, i) => {
          const sk = SKILLS[sid];
          const el = h('div', `skill ${L.sp < sk.cost ? 'nosp' : ''}`, h('b', '', `${i + 1}`), ` ${sk.name} `, h('span', 'cost', `${sk.cost}E`));
          el.style.borderColor = ELEMENTS[sk.element].color;
          return el;
        }),
      );
      drawMinimap();
      questPanel();
    };

    const drawMinimap = () => {
      const mode = mapMode();
      mini.style.display = mode === 'corner' ? '' : 'none';
      bigMap.style.display = mode === 'full' ? '' : 'none';
      if (mode === 'off') return;
      const m = run.map;
      const full = mode === 'full';
      const target = full ? bigMap : mini;
      // A pantalla completa, casillas tan grandes como quepan.
      const s = full ? Math.max(3, Math.floor(Math.min((window.innerWidth * 0.94) / m.w, (window.innerHeight * 0.86) / m.h))) : 3;
      /**
       * Marca centrada en la casilla (x, y). En la esquina sobresale `grow` píxeles para que se vea;
       * a pantalla completa ocupa `k` veces la casilla y nunca se sale de ella.
       */
      const box = (x: number, y: number, k: number, grow: number, round = false) => {
        if (!full) return ctx.fillRect(x * s - grow, y * s - grow, s + 2 * grow, s + 2 * grow);
        const d = s * k;
        if (round) {
          ctx.beginPath();
          ctx.arc(x * s + s / 2, y * s + s / 2, d / 2, 0, Math.PI * 2);
          ctx.fill();
        } else ctx.fillRect(x * s + (s - d) / 2, y * s + (s - d) / 2, d, d);
      };
      target.width = m.w * s;
      target.height = m.h * s;
      const ctx = target.getContext('2d')!;
      ctx.clearRect(0, 0, target.width, target.height);
      // A pantalla completa el suelo apenas se insinúa para no tapar el juego; los puntos sí se ven bien.
      ctx.globalAlpha = full ? 0.28 : 1;
      for (let y = 0; y < m.h; y++)
        for (let x = 0; x < m.w; x++) {
          const i = y * m.w + x;
          if (!run.explored[i] || !m.tiles[i]) continue;
          const ter = terrainOfCode(m.terrain[i]);
          ctx.fillStyle = ter ? TERRAIN[ter].color : run.visible[i] ? 'rgba(200,190,220,0.55)' : 'rgba(150,140,170,0.35)';
          ctx.fillRect(x * s, y * s, s, s);
        }
      for (const [i, kind] of m.special) {
        if (!run.explored[i] && !run.intel.has('secretos')) continue;
        ctx.fillStyle = kind === 'hard' ? '#ffb060' : '#a08868';
        ctx.fillRect((i % m.w) * s, Math.floor(i / m.w) * s, s, s);
      }
      ctx.globalAlpha = full ? 0.85 : 1;
      if (run.intel.has('escaleras') || run.goal?.kind === 'faros' || run.explored[run.stairs.y * m.w + run.stairs.x]) {
        ctx.fillStyle = run.stairsOpen ? '#e8c040' : '#7a6a7a';
        box(run.stairs.x, run.stairs.y, 1, 1);
      }
      for (const [i, color] of run.doors) {
        if (!run.explored[i]) continue;
        ctx.fillStyle = LOCK_BY_ID[color].color;
        ctx.fillRect((i % m.w) * s, Math.floor(i / m.w) * s, s, s);
      }
      for (const [i, t] of run.traps) {
        if (!t.revealed) continue;
        ctx.fillStyle = TRAPS[t.id].color;
        box(i % m.w, Math.floor(i / m.w), 0.4, -1);
      }
      // Condición del piso: palancas, braseros y faros (naranja apagados, verde hechos), palancas de color, cajas y antorcha.
      const g = run.goal;
      const told = (x: number, y: number) => run.explored[y * m.w + x] || run.intel.has('objetivos');
      for (const w of run.watchers) {
        if (!w.watcher!.seen && !run.intel.has('objetivos')) continue;
        ctx.fillStyle = 'rgba(255,40,40,0.45)';
        for (const i of run.watchTiles(w)) ctx.fillRect((i % m.w) * s, Math.floor(i / m.w) * s, s, s);
        ctx.fillStyle = '#c070ff';
        box(w.x, w.y, 0.9, 1);
      }
      for (const sp of g?.spots ?? []) {
        if (!told(sp.x, sp.y) && g!.kind !== 'faros') continue;
        ctx.fillStyle = sp.color ? LOCK_BY_ID[sp.color].color : sp.on ? '#5ac85a' : g!.kind === 'cajas' ? '#9a94a0' : '#ffb040';
        box(sp.x, sp.y, 0.8, 1);
      }
      if (g?.torch && !g.torch.taken) {
        ctx.fillStyle = '#ff9a2a';
        box(g.torch.x, g.torch.y, 0.8, 1);
      }
      for (const b of g?.boxes ?? []) {
        if (!run.explored[b.y * m.w + b.x]) continue;
        ctx.fillStyle = '#a8783a';
        box(b.x, b.y, 0.9, 1);
      }
      for (const it of run.items) {
        const kind = ITEMS[it.id]?.kind;
        const marked = kind === 'quest' || kind === 'key' || kind === 'stairkey';
        const told = (kind === 'quest' && run.intel.has('misiones')) || (kind === 'key' && run.intel.has('llaves')) || (kind === 'stairkey' && run.intel.has('objetivos'));
        if (!run.explored[it.y * m.w + it.x] && !told) continue;
        ctx.fillStyle = kind === 'key' ? LOCK_BY_ID[it.id.replace('llave_', '')].color : kind === 'quest' ? '#ffe680' : kind === 'stairkey' ? '#ffd27a' : '#7fc8ff';
        box(it.x, it.y, marked ? 0.75 : 0.5, marked ? 1 : 0);
      }
      for (const a of run.actors) {
        if (!a.alive) continue;
        if (a.watcher) continue;
        const told = (a.side === 'npc' && a.rescueQuest && run.intel.has('misiones')) || (a.elite && run.intel.has('objetivos')) || a.golden || run.sensed(a);
        if (a.side !== 'party' && !run.actorVisible(a) && !told && !a.reaper) continue;
        ctx.fillStyle = a.reaper ? '#ff00ff' : a.escort ? '#9fd7ff' : a.side === 'party' ? (a === run.leader ? '#ffffff' : '#8fe39a') : a.side === 'npc' ? (a.shop ? '#e8c87a' : a.event ? '#c8a8e8' : '#7fc8ff') : a.golden ? '#fff060' : a.elite ? '#ffd27a' : '#ff5050';
        box(a.x, a.y, a.reaper || a.elite || a.golden ? 1 : 0.75, a.reaper ? 3 : a.elite || a.golden ? 2 : 1, true);
      }
    };

    // Mantener Mayús marca la casilla de enfrente (para girar sin moverse y apuntar).
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') scene.setAiming(false);
    };
    const onBlur = () => scene.setAiming(false);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('resize', drawMinimap);

    // ---- Contador del piso: al llegar a 0 aparece la Parca. Se pausa con menús abiertos y durante la cortina.
    let timeLeft = run.reaperSeconds();
    let lastTick = performance.now();
    const drawTimer = () => {
      if (run.def.fixed) {
        timerEl.className = 'hud-timer';
        timerEl.textContent = 'Entrenamiento: sin Parca';
        return;
      }
      if (run.reaperOut) {
        timerEl.className = 'hud-timer reaper';
        timerEl.textContent = run.reaper ? '☠ ¡La Parca os persigue! Bajad ya' : '☠ La Parca ha caído';
        return;
      }
      const t = Math.ceil(timeLeft);
      timerEl.className = `hud-timer ${t <= 30 ? 'low' : ''}`;
      timerEl.textContent = `⌛ ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')} hasta la Parca`;
    };
    const timer = setInterval(() => {
      const now = performance.now();
      const dt = (now - lastTick) / 1000;
      lastTick = now;
      const paused = finished || document.hidden || curtain.classList.contains('on') || modalRoot().childElementCount > 0;
      if (paused || run.reaperOut || run.def.fixed) return;
      const before = Math.ceil(timeLeft);
      timeLeft = Math.max(0, timeLeft - dt);
      if (before > 30 && Math.ceil(timeLeft) <= 30) log('Se nota un frío extraño. Algo viene a por vosotros: buscad las escaleras.', '#ff9c8a');
      if (timeLeft <= 0 && !busy) {
        busy = true;
        run.summonReaper();
        void playEvents().then(() => (busy = false));
      }
      drawTimer();
    }, 200);

    const finish = () => {
      if (finished) return;
      finished = true;
      clearInterval(timer);
      popKeys();
      scene.setAiming(false);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', drawMinimap);
      setTimeout(() => {
        hud.replaceChildren();
        showGame(false);
        resolve(run.result!);
      }, run.result === 'death' ? 900 : 300);
    };

    /** Tarjeta de habilidad nueva con el retrato de quien la aprende. */
    const learnCard = (a: Actor, skill: string, text: string) => {
      const sk = SKILLS[skill];
      const card = h('div', 'learn-card',
        h('div', 'lc-portrait', img(a.sprite, 6)),
        h('div', 'lc-body',
          h('div', 'lc-who', `${a.name} · Nv${a.level}`),
          h('div', 'lc-text', text),
          h('div', 'lc-skill', h('b', '', sk.name), ' ', elChip(sk.element), h('span', 'cost', ` ${sk.cost}E`)),
          h('div', 'lc-desc', sk.desc),
        ),
      );
      card.style.borderColor = ELEMENTS[sk.element].color;
      return card;
    };

    /** Habilidad nueva con los 4 huecos llenos: el jugador elige cuál olvidar (o no aprenderla). */
    const learnPrompts = async (events: GameEvent[]) => {
      for (const e of events) {
        if (e.t !== 'learn') continue;
        const a = run.actors.find((x) => x.id === e.id);
        if (!a) continue;
        const nsk = SKILLS[e.skill];
        if (e.auto) {
          await modalMenu('¡Nueva habilidad!', [{ label: 'Continuar' }], { info: learnCard(a, e.skill, `${a.name} ha aprendido ${nsk.name}.`), cancel: true });
          continue;
        }
        const info = h('div', '',
          learnCard(a, e.skill, `${a.name} quiere aprender ${nsk.name}.`),
          h('p', 'muted modal-text', 'Ya lleva 4 habilidades. ¿Cuál olvida? Las olvidadas se pueden recuperar en la sala de entrenamiento del cuartel.'),
        );
        const items: MenuItem[] = a.skills.map((sid) => ({ label: `Olvidar ${SKILLS[sid].name}`, right: `${SKILLS[sid].cost}E`, desc: SKILLS[sid].desc }));
        items.push({ label: `No aprender ${nsk.name}` });
        const r = await modalMenu('Nueva habilidad', items, { info, cancel: false });
        run.chooseSkill(a.id, e.skill, r < a.skills.length ? a.skills[r] : null);
      }
      for (const e of run.drainEvents()) if (e.t === 'log') log(e.text, e.color);
    };

    /** Anima los eventos; si hay cambio de piso, lo hace tras la cortina con el nombre del piso. */
    const playEvents = async () => {
      const events = run.drainEvents();
      const newFloor = events.some((e) => e.t === 'floor');
      if (newFloor) {
        timeLeft = run.reaperSeconds();
        await showCurtain();
      }
      await scene.play(events);
      if (newFloor) {
        music();
        updateHud();
        await hideCurtain();
      }
      await learnPrompts(events);
      for (const e of events) if (e.t === 'quest') questBanner(e.name);
      // Escena del jefe (la sala del trono): la primera vez que se le ve, antes de luchar.
      const boss = run.boss;
      if (run.def.bossScene && !bossTalked && boss && run.actorVisible(boss)) {
        bossTalked = true;
        await scene.lookAt(boss);
        await dialogue(SCENES[run.def.bossScene]);
        await scene.lookBack();
      }
      // Carteles del campo de entrenamiento (en automático solo van al registro).
      for (const e of events) if (e.t === 'tip') {
        if (auto) log(`${e.title}: ${e.lines.join(' ')}`, '#9fd7ff');
        else await alertBox(e.title, e.lines);
      }
      updateHud();
      // Evento de sala: el jugador elige (en automático lo resuelve el piloto en su siguiente acción).
      const c = run.pendingChoice;
      if (c && !auto) {
        const r = await modalMenu(c.title, c.options.map((label) => ({ label })), { info: h('div', 'modal-text', h('p', '', c.text)), cancel: false });
        run.resolveChoice(r);
        await playEvents();
      }
    };

    /** Campamento entre pisos: descansar, comprar al mercader y seguir bajando (no se puede volver atrás). */
    const camp = async () => {
      const next = run.floor + 1;
      // Lo que viene después: más pisos del mismo tramo (sin fin) o el siguiente tramo de la incursión.
      const nextStage = !run.def.infinite && run.def.next ? DUNGEONS[run.def.next] : null;
      const ahead = nextStage ? `rumbo a ${nextStage.name}` : `piso ${next}`;
      curtain.replaceChildren(h('div', 'curtain-title', 'Campamento'), h('div', 'curtain-floor', `Tras ${run.def.infinite ? 'el guardián' : 'el núcleo'} · ${ahead}`));
      curtain.classList.add('on', 'camp');
      await wait(450);
      playMusic('town');
      let rested = false;
      let start = 0;
      for (;;) {
        const info = h('div', 'modal-text',
          h('p', '', 'La presencia se ha disipado. En un recodo seguro arde una hoguera, y un mercader errante ha montado su puesto.'),
          ...run.party.map((a) => h('p', 'muted', `${a.name}: ${a.hp}/${a.maxHp} vida · ${a.sp}/${a.maxSp} energía`)),
          ...run.actors.filter((a) => a.side === 'party' && !a.alive).map((a) => h('p', 'warn', `${a.name}: caído`)),
          h('p', '', `Oro: ${run.state.gold} · Provisiones: ${Math.round(run.belly)}`),
        );
        const items: MenuItem[] = [
          { label: rested ? 'Descansar (ya habéis descansado)' : 'Descansar junto al fuego', disabled: rested, desc: 'Vida y energía al máximo, se curan los estados y los caídos vuelven con media vida. Las provisiones no se recuperan.' },
          { label: 'Mercader errante', desc: 'Comida, pociones y objetos para lanzar, algo más caros que en la ciudad.' },
          { label: 'Tácticas del grupo', desc: 'Cambia cómo se comporta cada aliado.' },
          { label: nextStage ? `Seguir → ${nextStage.name}` : `Seguir bajando → piso ${next}`, desc: 'Tras el campamento no hay vuelta atrás.' },
        ];
        if (run.def.practice) items.push({ label: 'Abandonar la prueba', desc: 'Volver a la torre. En el modo prueba nada se conserva salvo el récord de pisos.' });
        const r = await modalMenu('Campamento', items, { info, start, cancel: false });
        start = r;
        if (r === 0) {
          for (const l of run.campRest()) log(l, '#8fe39a');
          sfx('heal');
          rested = true;
          updateHud();
        } else if (r === 1) await merchant();
        else if (r === 2) await tacticsMenu(run.state, run.state.party.filter((id) => id !== run.leader.memberId));
        else if (r === 3) break;
        else if (r === 4) {
          if (await confirm('¿Abandonar la prueba y volver a la torre?', 'Abandonar', 'Seguir')) {
            run.exitTower();
            break;
          }
        }
      }
      curtain.classList.remove('camp');
    };

    const merchant = async () => {
      let start = 0;
      for (;;) {
        const items: MenuItem[] = CAMP_SHOP.map((id) => ({ label: ITEMS[id].name, right: `${run.campPrice(id)} oro · x${run.state.bag[id] ?? 0}`, desc: ITEMS[id].desc, icon: ITEMS[id].sprite, disabled: run.state.gold < run.campPrice(id) }));
        items.push({ label: 'Volver' });
        const r = await modalMenu(`Mercader · Oro: ${run.state.gold} · Bolsa ${bagUsed(run.state)}/${bagCapacity(run.state)}`, items, { start });
        if (r < 0 || r === CAMP_SHOP.length) return;
        start = r;
        const err = run.campBuy(CAMP_SHOP[r]);
        if (err) toast(err);
        else {
          sfx('pickup');
          toast(`Compras ${ITEMS[CAMP_SHOP[r]].name}.`);
        }
      }
    };

    const stairsPrompt = async () => {
      run.steppedOnStairs = false;
      const last = run.isLastFloor;
      const campNext = run.campAhead;
      const stageEnd = !last && !run.def.infinite && run.floor >= run.def.floors && run.def.next;
      const question = last ? '¿Salir de la mazmorra? Completarás la incursión.' : campNext ? '¿Seguir? Antes hay un campamento para descansar.' : stageEnd ? `¿Seguir hacia ${DUNGEONS[run.def.next!].name}?` : '¿Bajar al siguiente piso?';
      // En automático se baja sin preguntar, salvo al salir de la mazmorra (y el campamento sale igual).
      if (!(auto && !last) && !(await confirm(question, last ? 'Salir' : 'Bajar', 'Quedarse'))) {
        if (auto) setAuto(false, 'Piloto automático detenido en las escaleras.');
        return;
      }
      if (campNext) {
        await camp();
        if (run.result) return;
      }
      run.descend();
      if (run.result) return;
      await playEvents();
    };

    // ---- Piloto automático: el líder actúa solo con lo que sabe (ver DungeonRun.autoAction).
    let auto = false;
    const setAuto = (on: boolean, why?: string) => {
      auto = on;
      autoEl.style.display = on ? '' : 'none';
      if (why) log(why, '#9fd7ff');
      if (on) autoLoop();
    };
    const autoLoop = () => {
      if (!auto || finished) return;
      const blocked = busy || modalRoot().childElementCount > 0 || curtain.classList.contains('on');
      if (blocked) {
        setTimeout(autoLoop, 120);
        return;
      }
      let why: string | null = null;
      void act(() => {
        why = run.autoAction(!run.reaperOut && timeLeft <= 45);
        return true;
      }).then(() => {
        const L = run.protag;
        const potions = Object.keys(run.state.bag).some((id) => run.state.bag[id] > 0 && ITEMS[id]?.kind === 'heal');
        if (why) setAuto(false, `Piloto automático detenido: ${why}`);
        else if (run.autoStuck()) setAuto(false, 'Piloto automático detenido: se está dando vueltas sin avanzar.');
        else if (L.hp / L.maxHp < 0.25 && !potions && run.leader === L) setAuto(false, 'Piloto automático detenido: a Aren le queda poca vida, no hay pociones ni nadie sano que tome el mando. Tú decides.');
        else setTimeout(autoLoop, 110);
      });
    };

    const act = async (fn: () => boolean) => {
      if (busy || finished) return;
      busy = true;
      fn();
      await playEvents();
      if (run.result) return finish();
      if (run.steppedOnStairs) {
        await stairsPrompt();
        if (run.result) return finish();
      }
      busy = false;
    };

    const openMenu = async (fn: () => Promise<void>) => {
      if (busy || finished) return;
      busy = true;
      await fn();
      busy = false;
    };

    const chooseMember = async (title: string): Promise<Actor | null> => {
      const members = run.party;
      const r = await modalMenu(title, members.map((a) => ({ label: a.name, right: `${a.hp}/${a.maxHp} · ${a.sp}E`, icon: a.sprite })));
      return r < 0 ? null : members[r];
    };

    /** Bolsa con pestañas: consumibles (los únicos que se usan aquí), ingredientes, materiales y objetos clave. */
    const BAG_TABS = ['Consumibles', 'Ingredientes', 'Materiales', 'Objetos clave'];
    let bagTab = 0;
    const bagMenu = async (startTab?: number) => {
      if (startTab !== undefined) bagTab = startTab;
      let r = -1;
      let list = bagList(run.state);
      for (;;) {
        list = bagList(run.state);
        const entry = (id: string, q: number) => ({ label: ITEMS[id].name, right: `x${q}`, desc: ITEMS[id].desc, icon: ITEMS[id].sprite });
        let items: MenuItem[];
        let count: string;
        if (bagTab === 0) {
          items = list.map((it) => entry(it.id, it.qty));
          count = `${bagUsed(run.state)}/${bagCapacity(run.state)}`;
        } else if (bagTab === 1) {
          items = Object.entries(run.pouch).map(([id, q]) => ({ ...entry(id, q), desc: `${ITEMS[id].desc} Al salir va a la despensa del cuartel.` }));
          count = `${run.pouchUsed()}/${pouchCapacity(run.state)}`;
        } else if (bagTab === 2) {
          items = Object.entries(run.materials).map(([id, q]) => ({ ...entry(id, q), desc: `${ITEMS[id].desc} Al salir va al almacén de materiales.` }));
          count = `${run.materialsUsed()}/${materialBagCapacity(run.state)}`;
        } else {
          // Objetos clave: lo que piden las misiones activas de recoger algo.
          items = QUESTS.filter((q) => q.objective.kind === 'collect' && run.state.quests[q.id] && run.state.quests[q.id].status !== 'done').map((q) => {
            const o = q.objective as { item: string };
            const st = run.state.quests[q.id];
            return { label: ITEMS[o.item].name, icon: ITEMS[o.item].sprite, right: `${st.progress}/${objectiveTarget(q)}`, desc: `${ITEMS[o.item].desc} Para la misión «${q.name}».` };
          });
          count = `${items.length}`;
        }
        const empty = !items.length;
        if (empty) items = [{ label: bagTab === 3 ? 'Ninguno' : 'Vacía', disabled: true }];
        const tabBar = h('div', 'bag-tabs', ...BAG_TABS.map((t, i) => h('span', `bag-tab ${i === bagTab ? 'on' : ''}`, t)), h('div', 'bag-hint', '← → cambiar de pestaña'));
        r = await modalMenu(`Bolsa · ${BAG_TABS[bagTab]} (${count})`, items, { info: tabBar, tabs: true });
        if (r === TAB_PREV || r === TAB_NEXT) {
          bagTab = (bagTab + (r === TAB_NEXT ? 1 : BAG_TABS.length - 1)) % BAG_TABS.length;
          continue;
        }
        if (r < 0) return;
        if (bagTab === 0 && !empty) break;
      }
      const def = ITEMS[list[r].id];
      if (def.kind === 'raise') {
        const fallen = run.actors.filter((a) => a.side === 'party' && !a.alive);
        if (!fallen.length) {
          toast('Nadie del grupo ha caído.');
          return;
        }
        const i = await modalMenu(`Usar ${def.name} en...`, fallen.map((a) => ({ label: a.name, right: 'Caído', icon: a.sprite })));
        if (i < 0) return;
        busy = false;
        await act(() => run.useItem(def.id, fallen[i].id));
        return;
      }
      if (def.kind === 'revive') {
        toast('Se activa sola cuando alguien cae.');
        return;
      }
      if (def.kind === 'heal' || def.kind === 'sp' || def.kind === 'cure') {
        const target = await chooseMember(`Usar ${def.name} en...`);
        if (!target) return;
        busy = false;
        await act(() => run.useItem(def.id, target.id));
        return;
      }
      if (def.kind === 'throw' && !(await confirm(`Lanzar ${def.name} hacia donde miras.`, 'Lanzar', 'Cancelar'))) return;
      busy = false;
      await act(() => run.useItem(def.id));
    };

    const skillMenu = async () => {
      const L = run.leader;
      const r = await modalMenu(
        `Habilidades · Energía ${L.sp}/${L.maxSp}`,
        L.skills.map((sid) => {
          const sk = SKILLS[sid];
          return { label: sk.name, right: `${sk.cost}E · ${ELEMENTS[sk.element].name}`, desc: sk.desc, disabled: L.sp < sk.cost };
        }),
      );
      if (r < 0) return;
      busy = false;
      await act(() => run.leaderSkill(r));
    };

    /** Ficha de un miembro tipo afiche: retrato grande, barras, estadísticas, equipo y habilidades. */
    const poster = (a: Actor, i: number, n: number) => {
      const id = a.memberId!;
      const def = MEMBERS[id];
      const st = memberStats(run.state, id);
      const m = run.state.members[id];
      const el = ELEMENTS[a.element];
      const sts = (Object.keys(a.statuses) as StatusId[]).map((k) => {
        const c = h('span', 'chip', STATUSES[k].name);
        c.style.color = STATUSES[k].color;
        return c;
      });
      const resists = Object.entries(st.resist).map(([e, v]) => `${ELEMENTS[e as keyof typeof ELEMENTS].name} ${Math.round(v! * 100)}%`);
      const weak = weaknessesOf(a.element);
      const portrait = h('div', 'pp-portrait', img(a.sprite, 9));
      portrait.style.borderColor = el.color;
      portrait.style.background = `radial-gradient(circle at 50% 60%, ${el.color}55 0%, #0b0910 70%)`;
      const statBox = (label: string, v: number) => h('div', 'pp-stat', h('span', '', label), h('b', '', String(v)));
      const card = h('div', `poster ${a.alive ? '' : 'down'}`,
        h('div', 'pp-nav', h('span', '', '◄'), h('span', '', `${i + 1} / ${n}`), h('span', '', '►')),
        h('div', 'pp-top',
          portrait,
          h('div', 'pp-id',
            h('div', 'pp-name', a.name),
            h('div', 'pp-title', def.title),
            h('div', 'pp-role', id === 'aren' ? `Clase: ${CLASSES[run.state.protagClass].name}` : def.role, ' · ', WEAPON_NAMES[def.weapon]),
            h('div', 'pp-el', elChip(a.element), weak.length ? h('span', 'muted', ' débil contra ') : '', ...weak.map(elChip)),
            h('div', 'pp-bars',
              h('div', 'pp-bar', h('span', 'pp-bl', 'Vida'), bar(Math.max(0, a.hp), a.maxHp, 'hp'), h('span', 'pp-bn', `${Math.max(0, a.hp)}/${a.maxHp}`)),
              h('div', 'pp-bar', h('span', 'pp-bl', 'Energía'), bar(a.sp, a.maxSp, 'sp'), h('span', 'pp-bn', `${a.sp}/${a.maxSp}`)),
              h('div', 'pp-bar', h('span', 'pp-bl', `Nv ${a.level}`), bar(m.xp, xpToNext(m.level), 'xp'), h('span', 'pp-bn', `${m.xp}/${xpToNext(m.level)} exp`)),
            ),
            h('div', 'pp-status', a.alive ? (sts.length ? h('span', '', 'Estado: ', ...sts) : h('span', 'muted', 'Estado: normal')) : h('span', 'warn', 'CAÍDO'), id !== 'aren' ? h('span', 'muted', ` · Táctica: ${TACTICS[tacticOf(run.state, id)].name}`) : ''),
          ),
        ),
        h('div', 'pp-section', 'Estadísticas'),
        h('div', 'pp-stats', statBox('Ataque', a.atk), statBox('Defensa', a.def), statBox('Magia', a.mag), statBox('Resist.', a.res)),
        resists.length ? h('div', 'muted pp-res', `Resistencias: ${resists.join(' · ')}`) : '',
        h('div', 'pp-section', 'Equipo'),
        h('div', 'pp-gear', ...(['weapon', 'armor', 'accessory'] as Slot[]).map((slot) => {
          const g = m.gear[slot] ? EQUIPMENT[m.gear[slot]!] : null;
          return h('div', `pp-slot ${g ? '' : 'empty'}`, g ? img(g.sprite, 3) : h('div', 'pp-noicon', '—'), h('div', '', h('div', 'pp-slotname', SLOT_NAMES[slot]), h('div', 'pp-gname', g ? g.name : 'Nada'), g ? h('div', 'pp-gsum', gearSummary(g)) : ''));
        })),
        h('div', 'pp-section', `Habilidades (${a.skills.length}/4)`),
        h('div', 'pp-skills', ...a.skills.map((sid) => {
          const sk = SKILLS[sid];
          const c = h('div', 'pp-skill', h('div', 'pp-sk-head', h('b', '', sk.name), h('span', 'cost', `${sk.cost}E`)), elChip(sk.element), h('div', 'pp-sk-desc', sk.desc));
          c.style.borderLeftColor = ELEMENTS[sk.element].color;
          return c;
        })),
        h('div', 'pp-hint', '← → cambiar de miembro · Esc cerrar'),
      );
      card.style.borderColor = el.color;
      return card;
    };

    const teamInfo = () =>
      new Promise<void>((done) => {
        const members = run.actors.filter((a) => a.side === 'party');
        let i = 0;
        const overlay = h('div', 'overlay');
        const draw = () => overlay.replaceChildren(poster(members[i], i, members.length));
        draw();
        modalRoot().append(overlay);
        sfx('menu');
        const pop = pushKeys((e) => {
          if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === 'ArrowDown') i = (i + 1) % members.length;
          else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'ArrowUp') i = (i + members.length - 1) % members.length;
          else if (isBack(e) || isOk(e) || e.key === 't' || e.key === 'T') {
            pop();
            overlay.remove();
            sfx('cancel');
            return done();
          } else return;
          e.preventDefault();
          sfx('menu');
          draw();
        });
        overlay.addEventListener('click', () => {
          i = (i + 1) % members.length;
          draw();
        });
      });

    /** Cambiar de líder (no gasta turno). */
    const leaderMenu = async () => {
      const others = run.party.filter((a) => a !== run.leader);
      if (!others.length) {
        toast('No hay nadie más en pie para tomar el mando.');
        return;
      }
      const info = h('p', 'muted modal-text', 'El nuevo líder es quien manejas: va delante, abre camino y se intercambia de sitio con los demás. No gasta turno. Si Aren cae, la incursión termina igual, mande quien mande.');
      const i = await modalMenu('Cambiar de líder', others.map((a) => ({ label: a.name, right: `${a.hp}/${a.maxHp} · ${a.sp}E`, icon: a.sprite })), { info });
      if (i < 0) return;
      run.switchLeader(others[i].id);
      await playEvents();
    };

    const mainMenu = async (start = 0) => {
      const items: MenuItem[] = [{ label: 'Habilidades' }, { label: 'Bolsa' }, { label: 'Ingredientes y materiales' }, { label: 'Equipo' }, { label: 'Tácticas' }, { label: 'Esperar un turno' }, { label: 'Cambiar de líder', right: run.leader.name, desc: 'Otro miembro pasa a mandar, por ejemplo para apartar a Aren si va mal. No gasta turno. También con la tecla L.' }, { label: 'Piloto automático', desc: 'El líder explora, recoge, combate y baja solo con lo que sabe. Cualquier tecla lo detiene. También con la tecla P.' }, { label: 'Mapa', right: MAP_MODE_NAMES[mapMode()], desc: 'Cambia dónde se ve el mapa. También con la tecla V.' }, { label: 'Controles' }];
      const r = await modalMenu('Menú', items, { start });
      if (r === 0) await skillMenu();
      else if (r === 1) await bagMenu(0);
      else if (r === 2) await bagMenu(1);
      else if (r === 3) await teamInfo();
      else if (r === 4) await tacticsMenu(run.state, run.state.party.filter((id) => id !== run.leader.memberId));
      else if (r === 5) {
        busy = false;
        await act(() => run.leaderWait());
      } else if (r === 6) await leaderMenu();
      else if (r === 7) {
        // Arranca al cerrar el menú (el bucle espera a que no haya nada abierto).
        setAuto(true, 'Piloto automático: el grupo explora y combate solo.');
      } else if (r === 8) {
        cycleMapMode();
        drawMinimap();
        await mainMenu(8);
      } else if (r === 9) await alertBox('Controles', CONTROLS);
    };

    const popKeys = pushKeys((e) => {
      if (e.key === 'Shift') scene.setAiming(true);
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      // Cualquier tecla detiene el piloto automático y devuelve el control.
      if (auto) {
        e.preventDefault();
        setAuto(false, 'Tomas el control.');
        return;
      }
      if (busy || finished) return;
      if (key === 'p') {
        setAuto(true, 'Piloto automático: el grupo explora y combate solo.');
        return;
      }
      const dir = DIR_KEYS[e.code.startsWith('Numpad') ? e.code : key];
      if (dir) {
        e.preventDefault();
        if (e.shiftKey) {
          run.leader.fx = dir[0];
          run.leader.fy = dir[1];
          scene.syncAll();
          return;
        }
        void act(() => run.leaderMove(dir[0], dir[1]));
        return;
      }
      if (key === ' ' || key === 'f') {
        e.preventDefault();
        void act(() => run.leaderAttack());
      } else if (['1', '2', '3', '4'].includes(key)) void act(() => run.leaderSkill(Number(key) - 1));
      else if (key === 'r' || key === '.' || e.code === 'Numpad5') void act(() => run.leaderWait());
      else if (key === 'i' || key === 'Tab') {
        e.preventDefault();
        void openMenu(() => bagMenu());
      } else if (key === 't') void openMenu(teamInfo);
      else if (key === 'k') void openMenu(skillMenu);
      else if (key === 'l') void openMenu(leaderMenu);
      else if (key === 'm') toast(toggleMusic() ? 'Música activada' : 'Música desactivada');
      else if (key === 'n') toast(toggleSfx() ? 'Efectos activados' : 'Efectos desactivados');
      else if (key === 'v') {
        toast(`Mapa: ${MAP_MODE_NAMES[cycleMapMode()].toLowerCase()}`);
        drawMinimap();
      }
      else if (key === 'Escape') void openMenu(() => mainMenu());
    });

    updateHud();
  });
}
