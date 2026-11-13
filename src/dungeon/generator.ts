import type { Rng } from '../core/rng';
import type { LayoutId } from '../data/dungeons';

export const WALL = 0;
export const FLOOR = 1;
/** roomAt de las salas secretas: SECRET_BASE + índice en `secrets`. */
export const SECRET_BASE = 1000;

/** Muros especiales: grieta (se rompe con un ataque) o muralla reforzada (solo con bombas). */
export type SpecialWall = 'crack' | 'hard';

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DungeonMap {
  w: number;
  h: number;
  tiles: Uint8Array;
  /** Índice de sala por casilla, -1 en pasillos y muros (SECRET_BASE + i en las salas secretas). */
  roomAt: Int16Array;
  rooms: Room[];
  /** Salas secretas: fuera de `rooms` (nunca tienen escaleras, monstruos ni el punto de inicio). */
  secrets: Room[];
  /** Muros especiales por casilla (siguen siendo WALL hasta romperlos). */
  special: Map<number, SpecialWall>;
  /** Tipo de suelo por casilla (0 = normal; ver data/terrain.ts). */
  terrain: Uint8Array;
  /** Dirección de las corrientes por casilla (índice en FLOW_DIRS, -1 = ninguna). */
  flow: Int8Array;
}

/** Direcciones de las corrientes: este, oeste, sur, norte. */
export const FLOW_DIRS = [
  { dx: 1, dy: 0 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 0, dy: -1 },
];

export interface MapExtras {
  /** Por cada código de terreno, probabilidad de que una sala lo tenga y cómo se reparte. */
  terrain?: { code: number; rooms: number; shape: 'blob' | 'scatter' | 'strip' }[];
  cracks?: number;
  /** Probabilidad de una sala secreta. */
  secrets?: number;
}

/**
 * Tamaño del mapa y de la rejilla de cada forma de piso:
 * pocas salas (primeras mazmorras), la clásica, laberinto (muchas salas pequeñas y caminos que se cruzan)
 * y salas gigantes (pocas, enormes y muy conectadas).
 */
const LAYOUTS: Record<LayoutId, { w: number; h: number; cols: number; rows: number; room: number; loops: number; minRooms: number; big?: boolean }> = {
  pequeno: { w: 40, h: 30, cols: 3, rows: 2, room: 0.8, loops: 0.15, minRooms: 4 },
  clasico: { w: 52, h: 38, cols: 4, rows: 3, room: 0.72, loops: 0.18, minRooms: 4 },
  laberinto: { w: 64, h: 46, cols: 7, rows: 5, room: 0.5, loops: 0.45, minRooms: 10 },
  salones: { w: 58, h: 42, cols: 2, rows: 2, room: 1, loops: 0.6, minRooms: 4, big: true },
};

/**
 * Estilo Mystery Dungeon: rejilla de celdas, cada celda tiene una sala o un cruce,
 * unidas por un árbol aleatorio de pasillos en L (más algunos extra para formar ciclos).
 * En los núcleos (`bossFloor`) el piso es una única sala grande con unas columnas.
 */
export function generateMap(rng: Rng, opts: { layout?: LayoutId; bossFloor?: boolean } & MapExtras = {}): DungeonMap {
  if (opts.bossFloor) return bossArena(rng, opts);
  const lay = LAYOUTS[opts.layout ?? 'clasico'];
  const { w, h, cols, rows } = lay;
  const tiles = new Uint8Array(w * h);
  const roomAt = new Int16Array(w * h).fill(-1);
  const rooms: Room[] = [];
  const cellW = Math.floor((w - 2) / cols);
  const cellH = Math.floor((h - 2) / rows);
  const nodes: { x: number; y: number; room: number }[] = [];

  let roomCount = 0;
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const ox = 1 + cx * cellW;
      const oy = 1 + cy * cellH;
      const idx = cy * cols + cx;
      const remaining = cols * rows - idx;
      const makeRoom = rng.chance(lay.room) || roomCount + remaining <= lay.minRooms;
      if (makeRoom) {
        // Salas gigantes: casi toda la celda.
        const rw = lay.big ? rng.int(cellW - 9, cellW - 4) : rng.int(4, Math.max(4, cellW - 4));
        const rh = lay.big ? rng.int(cellH - 8, cellH - 4) : rng.int(4, Math.max(4, cellH - 4));
        const rx = ox + rng.int(1, Math.max(1, cellW - rw - 1));
        const ry = oy + rng.int(1, Math.max(1, cellH - rh - 1));
        const id = rooms.length;
        rooms.push({ x: rx, y: ry, w: rw, h: rh });
        for (let y = ry; y < ry + rh; y++)
          for (let x = rx; x < rx + rw; x++) {
            tiles[y * w + x] = FLOOR;
            roomAt[y * w + x] = id;
          }
        nodes.push({ x: rng.int(rx, rx + rw - 1), y: rng.int(ry, ry + rh - 1), room: id });
        roomCount++;
      } else {
        const x = ox + rng.int(2, cellW - 3);
        const y = oy + rng.int(2, cellH - 3);
        tiles[y * w + x] = FLOOR;
        nodes.push({ x, y, room: -1 });
      }
    }
  }

  const carve = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    let { x, y } = a;
    const horizontalFirst = rng.chance(0.5);
    const stepX = () => {
      while (x !== b.x) {
        x += Math.sign(b.x - x);
        tiles[y * w + x] = FLOOR;
      }
    };
    const stepY = () => {
      while (y !== b.y) {
        y += Math.sign(b.y - y);
        tiles[y * w + x] = FLOOR;
      }
    };
    if (horizontalFirst) {
      stepX();
      stepY();
    } else {
      stepY();
      stepX();
    }
  };

  // Árbol de expansión aleatorio sobre la rejilla de celdas.
  const visited = new Set<number>([0]);
  const edges: [number, number][] = [];
  const stack = [0];
  const neighbors = (i: number) => {
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    const out: number[] = [];
    if (cx > 0) out.push(i - 1);
    if (cx < cols - 1) out.push(i + 1);
    if (cy > 0) out.push(i - cols);
    if (cy < rows - 1) out.push(i + cols);
    return out;
  };
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const next = rng.shuffle(neighbors(cur)).find((n) => !visited.has(n));
    if (next === undefined) {
      stack.pop();
      continue;
    }
    visited.add(next);
    edges.push([cur, next]);
    stack.push(next);
  }
  for (let i = 0; i < cols * rows; i++)
    for (const n of neighbors(i)) if (n > i && rng.chance(lay.loops)) edges.push([i, n]);
  for (const [a, b] of edges) carve(nodes[a], nodes[b]);
  // Salas gigantes: a veces un segundo pasillo entre las mismas salas (más caminos para rodear).
  if (lay.big) for (const [a, b] of edges) if (rng.chance(0.5)) carve({ x: rng.int(rooms[nodes[a].room].x, rooms[nodes[a].room].x + rooms[nodes[a].room].w - 1), y: rng.int(rooms[nodes[a].room].y, rooms[nodes[a].room].y + rooms[nodes[a].room].h - 1) }, nodes[b]);

  const map: DungeonMap = { w, h, tiles, roomAt, rooms, secrets: [], special: new Map(), terrain: new Uint8Array(w * h), flow: new Int8Array(w * h).fill(-1) };
  if (opts.secrets && rng.chance(opts.secrets)) addSecretRoom(map, rng);
  if (opts.cracks) addCracks(map, rng, opts.cracks);
  if (opts.terrain) addTerrain(map, rng, opts.terrain);
  return map;
}

/** Núcleo: una sola sala grande (sin pasillos) con columnas sueltas para cubrirse y rodear al jefe. */
function bossArena(rng: Rng, opts: MapExtras): DungeonMap {
  const w = 36;
  const h = 28;
  const tiles = new Uint8Array(w * h);
  const roomAt = new Int16Array(w * h).fill(-1);
  const r: Room = { x: 3, y: 3, w: w - 6, h: h - 6 };
  for (let y = r.y; y < r.y + r.h; y++)
    for (let x = r.x; x < r.x + r.w; x++) {
      tiles[y * w + x] = FLOOR;
      roomAt[y * w + x] = 0;
    }
  // Columnas simétricas a un tercio y dos tercios de la sala (nunca pegadas a la pared: siempre se puede rodear).
  const cols = rng.chance(0.5) ? [1 / 4, 3 / 4] : [1 / 3, 2 / 3];
  for (const fx of cols)
    for (const fy of [1 / 3, 2 / 3]) {
      const px = r.x + Math.round((r.w - 1) * fx);
      const py = r.y + Math.round((r.h - 1) * fy);
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        tiles[(py + dy) * w + px + dx] = WALL;
        roomAt[(py + dy) * w + px + dx] = -1;
      }
    }
  const map: DungeonMap = { w, h, tiles, roomAt, rooms: [r], secrets: [], special: new Map(), terrain: new Uint8Array(w * h), flow: new Int8Array(w * h).fill(-1) };
  if (opts.terrain) addTerrain(map, rng, opts.terrain.map((t) => ({ ...t, rooms: t.rooms * 0.6 })));
  return map;
}

/** Terreno dentro de cada sala elegida: mancha irregular, casillas sueltas o una franja de corriente. */
function addTerrain(m: DungeonMap, rng: Rng, list: NonNullable<MapExtras['terrain']>) {
  for (const [ri, r] of m.rooms.entries()) {
    for (const t of list) {
      if (!rng.chance(t.rooms)) continue;
      if (t.shape === 'scatter') {
        for (let k = rng.int(3, Math.max(3, Math.floor((r.w * r.h) / 6))); k > 0; k--) m.terrain[rng.int(r.y, r.y + r.h - 1) * m.w + rng.int(r.x, r.x + r.w - 1)] = t.code;
        continue;
      }
      if (t.shape === 'strip') {
        // Franja de 2 de ancho que cruza la sala; la corriente va a lo largo de ella.
        const horizontal = rng.chance(0.5);
        const dir = horizontal ? rng.int(0, 1) : rng.int(2, 3);
        const at = horizontal ? rng.int(r.y, Math.max(r.y, r.y + r.h - 2)) : rng.int(r.x, Math.max(r.x, r.x + r.w - 2));
        for (let a = 0; a < 2; a++)
          for (let b = 0; b < (horizontal ? r.w : r.h); b++) {
            const x = horizontal ? r.x + b : at + a;
            const y = horizontal ? at + a : r.y + b;
            if (m.roomAt[y * m.w + x] !== ri) continue;
            m.terrain[y * m.w + x] = t.code;
            m.flow[y * m.w + x] = dir;
          }
        continue;
      }
      const size = rng.int(Math.ceil(r.w * r.h * 0.25), Math.ceil(r.w * r.h * 0.6));
      let x = rng.int(r.x, r.x + r.w - 1);
      let y = rng.int(r.y, r.y + r.h - 1);
      for (let i = 0; i < size * 3; i++) {
        if (m.roomAt[y * m.w + x] === ri) m.terrain[y * m.w + x] = t.code;
        const d = rng.int(0, 3);
        const nx = x + (d === 0 ? 1 : d === 1 ? -1 : 0);
        const ny = y + (d === 2 ? 1 : d === 3 ? -1 : 0);
        if (m.roomAt[ny * m.w + nx] === ri) {
          x = nx;
          y = ny;
        }
      }
    }
  }
}

/** Una sala pequeña pegada a otra, separada por una sola muralla reforzada. */
function addSecretRoom(m: DungeonMap, rng: Rng) {
  const { w, h, tiles } = m;
  for (let tries = 0; tries < 80; tries++) {
    const r = rng.pick(m.rooms);
    const sw = rng.int(3, 4);
    const sh = rng.int(3, 4);
    const side = rng.int(0, 3);
    let door: { x: number; y: number };
    let sx: number;
    let sy: number;
    if (side === 0) {
      door = { x: r.x + r.w, y: rng.int(r.y, r.y + r.h - 1) };
      sx = door.x + 1;
      sy = door.y - rng.int(0, sh - 1);
    } else if (side === 1) {
      door = { x: r.x - 1, y: rng.int(r.y, r.y + r.h - 1) };
      sx = door.x - sw;
      sy = door.y - rng.int(0, sh - 1);
    } else if (side === 2) {
      door = { x: rng.int(r.x, r.x + r.w - 1), y: r.y + r.h };
      sx = door.x - rng.int(0, sw - 1);
      sy = door.y + 1;
    } else {
      door = { x: rng.int(r.x, r.x + r.w - 1), y: r.y - 1 };
      sx = door.x - rng.int(0, sw - 1);
      sy = door.y - sh;
    }
    if (sx < 2 || sy < 2 || sx + sw > w - 2 || sy + sh > h - 2) continue;
    if (tiles[door.y * w + door.x] !== WALL) continue;
    // La sala y su borde tienen que ser muro macizo (si no, se colaría por otro lado).
    let ok = true;
    for (let y = sy - 1; y <= sy + sh && ok; y++) for (let x = sx - 1; x <= sx + sw && ok; x++) if (tiles[y * w + x] !== WALL) ok = false;
    // Y la muralla solo puede tocar la sala original y la secreta.
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const i = (door.y + dy) * w + door.x + dx;
      if (tiles[i] === FLOOR && m.roomAt[i] < 0) ok = false;
    }
    if (!ok) continue;
    const id = SECRET_BASE + m.secrets.length;
    m.secrets.push({ x: sx, y: sy, w: sw, h: sh });
    for (let y = sy; y < sy + sh; y++)
      for (let x = sx; x < sx + sw; x++) {
        tiles[y * w + x] = FLOOR;
        m.roomAt[y * w + x] = id;
      }
    m.special.set(door.y * w + door.x, 'hard');
    return;
  }
}

/**
 * Atajos ocultos: un hueco de 1 a 3 casillas de muro entre dos zonas que a pie están lejos.
 * Se excava como pasadizo y la boca (la casilla pegada al lado de partida) queda como grieta.
 */
function addCracks(m: DungeonMap, rng: Rng, count: number) {
  const { w, h, tiles } = m;
  const open = (i: number) => tiles[i] === FLOOR && m.roomAt[i] < SECRET_BASE;
  const solid = (i: number) => tiles[i] === WALL && !m.special.has(i);
  const cands: { from: number; to: number; gap: number[] }[] = [];
  for (let y = 2; y < h - 2; y++)
    for (let x = 2; x < w - 2; x++) {
      const from = y * w + x;
      if (!open(from)) continue;
      for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const gap: number[] = [];
        for (let k = 1; k <= 4; k++) {
          const nx = x + dx * k;
          const ny = y + dy * k;
          if (nx < 1 || ny < 1 || nx >= w - 1 || ny >= h - 1) break;
          const i = ny * w + nx;
          if (open(i)) {
            if (gap.length) cands.push({ from, to: i, gap });
            break;
          }
          // El pasadizo no puede rozar otro suelo por los lados (sería un atajo sin grieta).
          const side1 = (ny + dx) * w + nx + dy;
          const side2 = (ny - dx) * w + nx - dy;
          if (!solid(i) || tiles[side1] !== WALL || tiles[side2] !== WALL || gap.length >= 3) break;
          gap.push(i);
        }
      }
    }
  const dist = (a: number, b: number) => {
    const seen = new Int16Array(w * h).fill(-1);
    const q = [a];
    seen[a] = 0;
    for (let qi = 0; qi < q.length; qi++) {
      const c = q[qi];
      if (c === b) return seen[c];
      for (const n of [c + 1, c - 1, c + w, c - w]) if (seen[n] < 0 && open(n)) {
        seen[n] = seen[c] + 1;
        q.push(n);
      }
    }
    return 999;
  };
  const far = (i: number, j: number) => Math.abs((i % w) - (j % w)) + Math.abs(Math.floor(i / w) - Math.floor(j / w));
  const used: number[] = [];
  for (const c of rng.shuffle(cands)) {
    if (used.length >= count) break;
    if (used.some((j) => far(j, c.gap[0]) < 8)) continue;
    if (dist(c.from, c.to) < 16) continue;
    for (const i of c.gap.slice(1)) tiles[i] = FLOOR;
    m.special.set(c.gap[0], 'crack');
    used.push(c.gap[0]);
  }
}

/**
 * Sella una sala con paredes agrietadas: cada boca de pasillo pegada a ella pasa a ser grieta.
 * Se puede seguir llegando (las grietas se rompen de un golpe), pero hay que abrirse paso.
 */
export function sealRoom(m: DungeonMap, ri: number): number {
  const r = m.rooms[ri];
  let n = 0;
  for (let y = r.y - 1; y <= r.y + r.h; y++)
    for (let x = r.x - 1; x <= r.x + r.w; x++) {
      const i = y * m.w + x;
      if (m.tiles[i] !== FLOOR || m.roomAt[i] >= 0) continue;
      const touches = [i + 1, i - 1, i + m.w, i - m.w].some((j) => m.roomAt[j] === ri);
      if (!touches) continue;
      m.tiles[i] = WALL;
      m.special.set(i, 'crack');
      m.terrain[i] = 0;
      n++;
    }
  return n;
}

export const isFloor = (m: DungeonMap, x: number, y: number) => x >= 0 && y >= 0 && x < m.w && y < m.h && m.tiles[y * m.w + x] === FLOOR;
