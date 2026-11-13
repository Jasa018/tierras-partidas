import Phaser from 'phaser';
import { sfx } from '../audio/audio';
import { ITEMS } from '../data/items';
import { LOCK_BY_ID } from '../data/traps';
import type { StatusId } from '../data/skills';
import { poseFor } from '../gfx/facing';
import { buildSprites } from '../gfx/sprites';
import { TILE, drawDungeonMap, drawStairs, skyCanvas } from '../gfx/tiles';
import type { DungeonRun } from './run';
import { isBig, type Actor, type GameEvent } from './types';

type LogFn = (text: string, color?: string) => void;

/** Centro en píxeles de un actor en (x, y): los grandes, en medio de todas sus casillas. */
const center = (a: Actor, x = a.x, y = a.y) => ({ x: (x + (a.w ?? 1) / 2) * TILE, y: (y + (a.h ?? 1) / 2) * TILE });

/** Dibuja una DungeonRun y anima sus eventos. No contiene reglas de juego. */
export class DungeonScene extends Phaser.Scene {
  run!: DungeonRun;
  onLog: LogFn = () => {};
  private mapImg?: Phaser.GameObjects.Image;
  private fogImg?: Phaser.GameObjects.Image;
  private fogTex?: Phaser.Textures.CanvasTexture;
  private actorSprites = new Map<number, Phaser.GameObjects.Image>();
  private itemSprites: Phaser.GameObjects.Image[] = [];
  private markSprites: Phaser.GameObjects.GameObject[] = [];
  /** Actores que están parpadeando por un golpe (el brillo de estado no los toca mientras). */
  private flashing = new Set<number>();
  /** Estrellas sobre la cabeza de los aturdidos. */
  private stars = new Map<number, Phaser.GameObjects.Image>();
  private stairsOpenDrawn = true;
  private floorSeed = 0;
  /** Flecha roja en el borde de la casilla del líder: hacia dónde mira. */
  private arrow?: Phaser.GameObjects.Image;
  /** Casilla de enfrente marcada mientras se mantiene Mayús (apuntar sin moverse). */
  private aimRect?: Phaser.GameObjects.Rectangle;
  private aiming = false;
  /** Mazmorras del cielo: el fondo de nubes (lejano y cercano), que se mueve solo y con la cámara. */
  private skyFar?: Phaser.GameObjects.TileSprite;
  private skyNear?: Phaser.GameObjects.TileSprite;

  constructor() {
    super('dungeon');
  }

  create(): void {
    for (const [key, canvas] of buildSprites()) if (!this.textures.exists(key)) this.textures.addCanvas(key, canvas);
    this.cameras.main.setBackgroundColor('#050307');
    this.scale.on('resize', () => this.fitCamera());
    if (!this.textures.exists('facing_arrow')) this.textures.addCanvas('facing_arrow', arrowCanvas());
    if (!this.textures.exists('sky_far')) this.textures.addCanvas('sky_far', skyCanvas(true));
    if (!this.textures.exists('sky_near')) this.textures.addCanvas('sky_near', skyCanvas(false));
    this.game.events.emit('dungeon-ready', this);
  }

  /** Lleva la cámara hasta un actor (para las escenas de los jefes); `lookBack` la devuelve al líder. */
  lookAt(a: Actor): Promise<void> {
    const cam = this.cameras.main;
    cam.stopFollow();
    const p = center(a);
    return new Promise((resolve) => cam.pan(p.x, p.y, 800, 'Sine.easeInOut', true, (_c: unknown, t: number) => t >= 1 && resolve()));
  }

  lookBack(): Promise<void> {
    const cam = this.cameras.main;
    const s = this.actorSprites.get(this.run.leader.id);
    if (!s) return Promise.resolve();
    return new Promise((resolve) =>
      cam.pan(s.x, s.y, 600, 'Sine.easeInOut', true, (_c: unknown, t: number) => {
        if (t < 1) return;
        cam.startFollow(s, true, 0.25, 0.25);
        resolve();
      }),
    );
  }

  setAiming(on: boolean): void {
    this.aiming = on;
  }

  /** Cada fotograma: la flecha y la marca de apuntado siguen al sprite del líder (también durante las animaciones). */
  update(): void {
    // Cielo: las nubes van a la deriva y, al moverse la cámara, las lejanas se desplazan menos (profundidad).
    if (this.skyFar && this.skyNear) {
      const cam = this.cameras.main;
      const t = this.time.now;
      this.skyFar.setTilePosition(t * 0.003 - cam.scrollX * 0.75, -cam.scrollY * 0.75);
      this.skyNear.setTilePosition(t * 0.009 - cam.scrollX * 0.45, -cam.scrollY * 0.45);
    }
    if (!this.run || !this.arrow || !this.aimRect) return;
    const L = this.run.leader;
    const s = this.actorSprites.get(L.id);
    const alive = !!s && L.alive && !this.run.result;
    this.arrow.setVisible(alive);
    this.aimRect.setVisible(alive && this.aiming);
    if (!alive || !s) return;
    const dx = L.fx;
    const dy = L.fy;
    const len = Math.hypot(dx, dy) || 1;
    this.arrow.setPosition(s.x + (dx / len) * 11, s.y + (dy / len) * 11);
    this.arrow.setRotation(Math.atan2(dy, dx));
    this.statusGlow();
    this.aimRect.setPosition(s.x + dx * TILE, s.y + dy * TILE);
  }

  attach(run: DungeonRun, onLog: LogFn): void {
    this.run = run;
    this.onLog = onLog;
    this.rebuildFloor();
  }

  private fitCamera() {
    const cam = this.cameras.main;
    cam.setZoom(Math.max(2, Math.floor(this.scale.height / (TILE * 12))));
  }

  rebuildFloor(): void {
    const run = this.run;
    const m = run.map;
    for (const s of this.actorSprites.values()) s.destroy();
    this.actorSprites.clear();
    this.mapImg?.destroy();
    this.fogImg?.destroy();
    if (this.textures.exists('dmap')) this.textures.remove('dmap');
    if (this.textures.exists('dfog')) this.textures.remove('dfog');

    this.floorSeed = run.rng.int(1, 1e9);
    const mapTex = this.textures.createCanvas('dmap', m.w * TILE, m.h * TILE)!;
    drawDungeonMap(mapTex.getContext(), m, run.def.theme, this.floorSeed);
    drawStairs(mapTex.getContext(), run.stairs.x, run.stairs.y, run.stairsOpen);
    this.stairsOpenDrawn = run.stairsOpen;
    mapTex.refresh();
    this.mapImg = this.add.image(0, 0, 'dmap').setOrigin(0).setDepth(0);
    this.skyFar?.destroy();
    this.skyNear?.destroy();
    this.skyFar = this.skyNear = undefined;
    if (run.def.theme.sky) {
      const [bx, by, bw, bh] = [-TILE * 8, -TILE * 6, m.w * TILE + TILE * 16, m.h * TILE + TILE * 12];
      this.skyFar = this.add.tileSprite(bx, by, bw, bh, 'sky_far').setOrigin(0).setDepth(-3);
      this.skyNear = this.add.tileSprite(bx, by, bw, bh, 'sky_near').setOrigin(0).setDepth(-2).setAlpha(0.85);
    }
    this.cameras.main.setBackgroundColor(run.def.theme.sky ? '#8cc4f2' : '#050307');

    this.arrow?.destroy();
    this.aimRect?.destroy();
    this.arrow = this.add.image(0, 0, 'facing_arrow').setDepth(60);
    this.tweens.add({ targets: this.arrow, alpha: 0.55, duration: 600, yoyo: true, repeat: -1 });
    this.aimRect = this.add.rectangle(0, 0, TILE - 2, TILE - 2).setStrokeStyle(1, 0xff3a3a, 0.95).setFillStyle(0xff3a3a, 0.18).setDepth(45);

    this.fogTex = this.textures.createCanvas('dfog', m.w, m.h)!;
    this.fogImg = this.add.image(0, 0, 'dfog').setOrigin(0).setScale(TILE).setDepth(50);

    const cam = this.cameras.main;
    cam.setBounds(-TILE * 8, -TILE * 6, m.w * TILE + TILE * 16, m.h * TILE + TILE * 12);
    cam.roundPixels = true;
    this.fitCamera();
    this.syncAll();
    const leader = this.actorSprites.get(run.leader.id);
    if (leader) {
      cam.startFollow(leader, true, 0.25, 0.25);
      cam.centerOn(leader.x, leader.y);
    }
  }

  /** Tras romper un muro: se vuelve a pintar el mapa (mismo aspecto, el muro ya es suelo). */
  private redrawMap() {
    const tex = this.textures.get('dmap') as Phaser.Textures.CanvasTexture;
    const ctx = tex.getContext();
    drawDungeonMap(ctx, this.run.map, this.run.def.theme, this.floorSeed);
    drawStairs(ctx, this.run.stairs.x, this.run.stairs.y, this.run.stairsOpen);
    tex.refresh();
  }

  private spriteFor(a: Actor): Phaser.GameObjects.Image {
    let s = this.actorSprites.get(a.id);
    if (!s) {
      const p = center(a);
      s = this.add.image(p.x, p.y, a.sprite).setDepth(a.side === 'party' ? 20 : 10);
      // Los jefes grandes llenan sus casillas (2×2 → el doble; 5×5 → cinco veces).
      if (isBig(a)) s.setScale(((a.w ?? 1) + (a.h ?? 1)) / 2);
      else if (a.boss) s.setScale(1.6).setOrigin(0.5, 0.65);
      // El alfa: algo más grande (su tono dorado, como el del dorado y el eco, se pone en update()).
      else if (a.elite) s.setScale(1.25).setOrigin(0.5, 0.6);
      // El dorado brilla.
      if (a.golden) this.tweens.add({ targets: s, alpha: { from: 1, to: 0.55 }, duration: 380, yoyo: true, repeat: -1 });
      this.actorSprites.set(a.id, s);
    }
    return s;
  }

  /** Pose según hacia dónde mira (5 poses + espejo = 8 direcciones). */
  private applyFacing(s: Phaser.GameObjects.Image, a: Actor) {
    const { pose, flip } = poseFor(a.fx, a.fy);
    const key = `${a.sprite}@${pose}`;
    s.setTexture(this.textures.exists(key) ? key : a.sprite);
    s.setFlipX(flip);
  }

  syncAll(): void {
    const run = this.run;
    if (this.stairsOpenDrawn !== run.stairsOpen) {
      const tex = this.textures.get('dmap') as Phaser.Textures.CanvasTexture;
      drawStairs(tex.getContext(), run.stairs.x, run.stairs.y, run.stairsOpen);
      tex.refresh();
      this.stairsOpenDrawn = run.stairsOpen;
    }
    const alive = new Set<number>();
    for (const a of run.actors) {
      if (!a.alive) continue;
      alive.add(a.id);
      const s = this.spriteFor(a);
      this.applyFacing(s, a);
      const p = center(a);
      s.setPosition(p.x, p.y);
      s.setVisible(run.actorVisible(a));
      s.setAlpha(1);
    }
    for (const [id, s] of this.actorSprites) {
      if (!alive.has(id)) {
        s.destroy();
        this.actorSprites.delete(id);
      }
    }
    // Puertas con candado y trampas ya descubiertas.
    for (const s of this.markSprites) s.destroy();
    const W = run.map.w;
    this.markSprites = [
      ...[...run.doors].filter(([i]) => run.explored[i]).map(([i, color]) => this.add.image((i % W) * TILE + TILE / 2, Math.floor(i / W) * TILE + TILE / 2, `door_${color}`).setDepth(4)),
      ...[...run.traps].filter(([, t]) => t.revealed).map(([i, t]) => this.add.image((i % W) * TILE + TILE / 2, Math.floor(i / W) * TILE + TILE / 2, `trap_${t.id}`).setDepth(3)),
      ...this.goalSprites(),
    ];
    for (const s of this.itemSprites) s.destroy();
    this.itemSprites = run.items
      .filter((i) => run.explored[i.y * run.map.w + i.x])
      .map((i) => this.add.image(i.x * TILE + TILE / 2, i.y * TILE + TILE / 2, i.id === 'gold' ? 'i_gold' : itemSprite(i.id)).setDepth(5));
    this.drawFog();
  }

  /**
   * Cada fotograma: los que sufren un estado brillan de su color (veneno verde, quemadura roja...) y los aturdidos
   * llevan estrellas girando sobre la cabeza. El alfa, el dorado y el eco tienen además su tono propio.
   */
  private statusGlow() {
    const t = this.time.now;
    const pulse = (Math.sin(t / 170) + 1) / 2;
    const order: [StatusId, number][] = [['quemado', 0xff5a2a], ['veneno', 0x7be35b], ['def_down', 0xa07cff], ['atk_up', 0xff8a5c], ['def_up', 0x7fb2ff], ['prisa', 0xffe27a], ['provocar', 0xff4a4a]];
    const W = Phaser.Display.Color;
    for (const a of this.run.actors) {
      const s = this.actorSprites.get(a.id);
      const star = this.stars.get(a.id);
      if (!s || !a.alive) {
        star?.destroy();
        this.stars.delete(a.id);
        continue;
      }
      if (!this.flashing.has(a.id)) {
        const base = a.echo ? 0x6a4a9a : a.golden ? 0xffe060 : a.elite ? 0xffd27a : 0xffffff;
        const st = order.find(([k]) => a.statuses[k]);
        if (st) {
          const c = W.Interpolate.ColorWithColor(W.ValueToColor(base), W.ValueToColor(st[1]), 100, 30 + pulse * 55);
          s.setTint(W.GetColor(c.r, c.g, c.b));
        } else if (base !== 0xffffff) s.setTint(base);
        else s.clearTint();
      }
      if (a.statuses.aturdido && s.visible) {
        let img = star;
        if (!img) {
          img = this.add.image(s.x, s.y, 'fx_star').setDepth(48);
          this.stars.set(a.id, img);
        }
        const ang = t / 220;
        img.setPosition(s.x + Math.cos(ang) * 5, s.y - 11 + Math.sin(ang) * 1.5).setRotation(ang).setVisible(true);
      } else if (star) {
        star.destroy();
        this.stars.delete(a.id);
      }
    }
  }

  /** Partículas de un efecto en una casilla. */
  private burst(kind: string, tx: number, ty: number) {
    const cx = tx * TILE + TILE / 2;
    const cy = ty * TILE + TILE / 2;
    const rnd = (a: number) => (Math.random() * 2 - 1) * a;
    const part = (key: string, x: number, y: number, cfg: Omit<Phaser.Types.Tweens.TweenBuilderConfig, 'targets'>, delay = 0) => {
      const img = this.add.image(x, y, key).setDepth(56);
      this.tweens.add({ targets: img, delay, ...cfg, onComplete: () => img.destroy() });
    };
    switch (kind) {
      case 'fuego':
        for (let k = 0; k < 4; k++) part('fx_fuego', cx + rnd(5), cy + 4 + rnd(2), { y: cy - 8 + rnd(3), scale: { from: 1.2, to: 0.5 }, alpha: { from: 1, to: 0 }, duration: 380 }, k * 40);
        break;
      case 'agua':
        for (let k = 0; k < 3; k++) {
          const x = cx + rnd(5);
          part('fx_agua', x, cy - 12, { y: cy + 3, alpha: { from: 1, to: 0.2 }, duration: 260, ease: 'Quad.easeIn' }, k * 50);
        }
        for (const s of [-1, 1]) part('fx_agua', cx, cy + 3, { x: cx + s * 7, y: cy - 2, scale: { from: 0.6, to: 0.2 }, alpha: { from: 1, to: 0 }, duration: 240 }, 220);
        break;
      case 'viento':
        for (let k = 0; k < 2; k++) part('fx_viento', cx, cy, { angle: 360 + k * 90, scale: { from: 0.6, to: 1.6 }, alpha: { from: 1, to: 0 }, duration: 380 }, k * 60);
        break;
      case 'tierra':
        for (let k = 0; k < 3; k++) part('fx_tierra', cx + rnd(5), cy - 14, { y: cy + 2 + rnd(2), alpha: { from: 1, to: 0.3 }, duration: 320, ease: 'Bounce.easeOut' }, k * 50);
        break;
      case 'luz':
        for (let k = 0; k < 5; k++) {
          const ang = (k / 5) * Math.PI * 2;
          part('fx_luz', cx, cy, { x: cx + Math.cos(ang) * 9, y: cy + Math.sin(ang) * 9, alpha: { from: 1, to: 0 }, angle: 90, duration: 360 });
        }
        break;
      case 'sombra':
        for (let k = 0; k < 3; k++) part('fx_sombra', cx + rnd(5), cy + 4, { y: cy - 9, x: `+=${rnd(4)}`, alpha: { from: 0.95, to: 0 }, scale: { from: 1, to: 1.5 }, duration: 460 }, k * 70);
        break;
      case 'heal':
        for (let k = 0; k < 3; k++) part('fx_heal', cx + (k - 1) * 5, cy + 5, { y: cy - 10, alpha: { from: 1, to: 0 }, duration: 620 }, k * 90);
        break;
      case 'buff':
        for (let k = 0; k < 2; k++) part('fx_buff', cx + (k ? 4 : -4), cy + 4, { y: cy - 9, alpha: { from: 1, to: 0 }, duration: 480 }, k * 80);
        break;
      case 'debuff':
        for (let k = 0; k < 2; k++) part('fx_debuff', cx + (k ? 4 : -4), cy - 8, { y: cy + 5, alpha: { from: 1, to: 0 }, duration: 480 }, k * 80);
        break;
      default:
        part('fx_neutral', cx, cy, { scale: { from: 0.3, to: 1.4 }, alpha: { from: 1, to: 0 }, duration: 220 });
    }
  }

  /** Cosas de la condición del piso: palancas, braseros, faros, antorcha, cajas, placas, botón, zona de los gólems y el orden de colores. */
  private goalSprites(): Phaser.GameObjects.GameObject[] {
    const run = this.run;
    const g = run.goal;
    const W = run.map.w;
    const out: Phaser.GameObjects.GameObject[] = [];
    const at = (x: number, y: number) => ({ px: x * TILE + TILE / 2, py: y * TILE + TILE / 2 });
    const seen = (x: number, y: number) => run.explored[y * W + x] === 1;
    // Zona que vigilan los gólems (los que ya se han visto).
    for (const w of run.watchers) {
      if (!w.watcher!.seen) continue;
      for (const i of run.watchTiles(w)) out.push(this.add.rectangle((i % W) * TILE + TILE / 2, Math.floor(i / W) * TILE + TILE / 2, TILE, TILE, 0xff2020, 0.22).setDepth(2));
    }
    // Carteles del campo de entrenamiento (los leídos, más apagados).
    for (const [i, sg] of run.signs) {
      if (!run.explored[i]) continue;
      const { px, py } = at(i % W, Math.floor(i / W));
      out.push(this.add.image(px, py, 'goal_cartel').setDepth(4).setAlpha(sg.read ? 0.55 : 1));
    }
    if (!g) return out;
    const key = { palanca: 'goal_palanca', braseros: 'goal_brasero', faros: 'goal_faro', colores: 'goal_palanca', cajas: 'goal_placa' } as Record<string, string>;
    for (const s of g.spots) {
      if (!key[g.kind] || (!seen(s.x, s.y) && g.kind !== 'faros')) continue;
      const { px, py } = at(s.x, s.y);
      const img = this.add.image(px, py, `${key[g.kind]}${s.on ? '_on' : ''}`).setDepth(4);
      if (s.color) img.setTint(Phaser.Display.Color.HexStringToColor(LOCK_BY_ID[s.color].color).color);
      out.push(img);
    }
    if (g.torch && !g.torch.taken) {
      const { px, py } = at(g.torch.x, g.torch.y);
      out.push(this.add.image(px, py, 'goal_antorcha').setDepth(6));
    }
    if (g.reset && seen(g.reset.x, g.reset.y)) {
      const { px, py } = at(g.reset.x, g.reset.y);
      out.push(this.add.image(px, py, 'goal_reset').setDepth(4));
    }
    for (const b of g.boxes ?? []) {
      if (!seen(b.x, b.y)) continue;
      const { px, py } = at(b.x, b.y);
      out.push(this.add.image(px, py, 'goal_caja').setDepth(15));
    }
    // Orden de colores: franjas sobre las escaleras, de izquierda a derecha.
    if (g.order && run.orderKnown()) {
      const { px, py } = at(run.stairs.x, run.stairs.y);
      const n = g.order.length;
      g.order.forEach((c, i) => {
        const r = this.add.rectangle(px - (n * 4) / 2 + i * 4 + 2, py - TILE / 2 - 3, 3, 4, Phaser.Display.Color.HexStringToColor(LOCK_BY_ID[c].color).color).setDepth(7);
        r.setStrokeStyle(1, 0x140f18);
        out.push(r);
      });
    }
    return out;
  }

  private drawFog() {
    const run = this.run;
    const tex = this.fogTex!;
    const ctx = tex.getContext();
    const { w, h } = run.map;
    const data = ctx.createImageData(w, h);
    // En el cielo, lo que no se ve lo tapan nubes blancas en vez de oscuridad.
    const sky = !!run.def.theme.sky;
    const [r, g, b] = sky ? [232, 242, 255] : [5, 3, 8];
    for (let i = 0; i < w * h; i++) {
      const a = run.visible[i] ? 0 : run.explored[i] ? (sky ? 120 : 150) : sky ? 215 : 255;
      data.data[i * 4 + 3] = a;
      data.data[i * 4] = r;
      data.data[i * 4 + 1] = g;
      data.data[i * 4 + 2] = b;
    }
    ctx.putImageData(data, 0, 0);
    tex.refresh();
  }

  private tween(cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((resolve) => this.tweens.add({ ...cfg, onComplete: () => resolve() }));
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  private floatText(x: number, y: number, text: string, color: string) {
    const t = this.add
      .text(x, y - 6, text, { fontFamily: 'VT323, monospace', fontSize: '12px', color, stroke: '#000', strokeThickness: 3 })
      .setOrigin(0.5)
      .setDepth(100)
      .setResolution(4);
    this.tweens.add({ targets: t, y: y - 18, alpha: 0, duration: 700, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  }

  private shown(id: number): Phaser.GameObjects.Image | undefined {
    const s = this.actorSprites.get(id);
    return s && s.visible ? s : undefined;
  }

  /** Reproduce los eventos en orden. Los movimientos seguidos se animan a la vez. */
  async play(events: GameEvent[]): Promise<void> {
    const run = this.run;
    let i = 0;
    while (i < events.length) {
      const e = events[i];
      if (e.t === 'move') {
        const batch: Promise<void>[] = [];
        while (i < events.length && events[i].t === 'move') {
          const m = events[i] as Extract<GameEvent, { t: 'move' }>;
          const a = run.actors.find((x) => x.id === m.id);
          const s = a && this.spriteFor(a);
          if (s && a) {
            const visibleNow = run.actorVisible(a);
            this.applyFacing(s, a);
            const p = center(a, m.x, m.y);
            if (visibleNow && s.visible) batch.push(this.tween({ targets: s, x: p.x, y: p.y, duration: 90 }));
            else s.setPosition(p.x, p.y);
          }
          i++;
        }
        await Promise.all(batch);
        continue;
      }
      i++;
      switch (e.t) {
        case 'floor':
          this.rebuildFloor();
          break;
        case 'warp': {
          const a = run.actors.find((x) => x.id === e.id);
          const s = a && this.actorSprites.get(a.id);
          if (s && a) s.setPosition(center(a, e.x, e.y).x, center(a, e.x, e.y).y);
          break;
        }
        case 'trap': {
          const r = this.add.rectangle(e.x * TILE + 8, e.y * TILE + 8, TILE, TILE, Phaser.Display.Color.HexStringToColor(e.color).color, 0.7).setDepth(55);
          this.tweens.add({ targets: r, alpha: 0, scale: 1.8, duration: 350, onComplete: () => r.destroy() });
          this.syncAll();
          await this.wait(120);
          break;
        }
        case 'door':
          this.syncAll();
          break;
        case 'wall':
          this.redrawMap();
          this.syncAll();
          break;
        case 'revive':
          this.syncAll();
          break;
        case 'leader': {
          this.syncAll();
          const s = this.actorSprites.get(e.id);
          if (s) this.cameras.main.startFollow(s, true, 0.25, 0.25);
          break;
        }
        case 'log':
          this.onLog(e.text, e.color);
          break;
        case 'sfx':
          sfx(e.name);
          break;
        case 'bump': {
          const s = this.shown(e.id);
          if (!s) break;
          const who = run.actors.find((x) => x.id === e.id);
          if (who) this.applyFacing(s, who);
          await this.tween({ targets: s, x: s.x + e.dx * 5, y: s.y + e.dy * 5, duration: 60, yoyo: true });
          break;
        }
        case 'damage': {
          const s = this.shown(e.id);
          if (!s) break;
          const color = e.mult > 1 ? '#ffe680' : e.crit ? '#ff8a3d' : '#ffffff';
          this.floatText(s.x, s.y, String(e.amount), color);
          this.flashing.add(e.id);
          s.setTintFill(0xff4040);
          await this.wait(70);
          s.clearTint();
          this.flashing.delete(e.id);
          break;
        }
        case 'heal': {
          const s = this.shown(e.id);
          if (s) this.floatText(s.x, s.y, `+${e.amount}`, '#8fe39a');
          break;
        }
        case 'miss': {
          const s = this.shown(e.id);
          if (s) this.floatText(s.x, s.y, 'Fallo', '#bbbbbb');
          break;
        }
        case 'float': {
          const s = this.shown(e.id);
          if (s) this.floatText(s.x, s.y - 4, e.text, e.color);
          break;
        }
        case 'death': {
          const s = this.shown(e.id);
          if (s) await this.tween({ targets: s, alpha: 0, scale: s.scale * 0.6, duration: 160 });
          break;
        }
        case 'projectile': {
          const p = this.add.rectangle(e.x0 * TILE + 8, e.y0 * TILE + 8, 4, 4, Phaser.Display.Color.HexStringToColor(e.color).color).setDepth(60);
          const dist = Math.max(Math.abs(e.x1 - e.x0), Math.abs(e.y1 - e.y0));
          await this.tween({ targets: p, x: e.x1 * TILE + 8, y: e.y1 * TILE + 8, duration: 30 + dist * 25 });
          p.destroy();
          break;
        }
        case 'fx': {
          const seen = e.tiles.filter((t) => this.run.isVisible(t.x, t.y));
          for (const t of seen) this.burst(e.kind, t.x, t.y);
          // Solo se espera si se ve algo (el tajo del golpe normal, muy poco).
          if (seen.length) await this.wait(e.kind === 'neutral' ? 50 : e.kind === 'heal' ? 260 : 220);
          break;
        }
        case 'flash': {
          const r = this.add.rectangle(e.x * TILE + 8, e.y * TILE + 8, TILE, TILE, Phaser.Display.Color.HexStringToColor(e.color).color, 0.6).setDepth(55);
          this.tweens.add({ targets: r, alpha: 0, duration: 250, onComplete: () => r.destroy() });
          break;
        }
      }
    }
    this.syncAll();
  }
}

/** Triángulo rojo con borde oscuro que apunta a la derecha (se rota según la dirección). */
function arrowCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 7;
  c.height = 11;
  const ctx = c.getContext('2d')!;
  const rows = ['KK.....', 'KRK....', 'KRRK...', 'KRRRK..', 'KRRRRK.', 'KRRRRRK', 'KRRRRK.', 'KRRRK..', 'KRRK...', 'KRK....', 'KK.....'];
  rows.forEach((r, y) =>
    [...r].forEach((ch, x) => {
      if (ch === '.') return;
      ctx.fillStyle = ch === 'K' ? '#140f18' : '#ff3a3a';
      ctx.fillRect(x, y, 1, 1);
    }),
  );
  return c;
}

function itemSprite(id: string): string {
  return ITEMS[id]?.sprite ?? 'i_stone';
}
