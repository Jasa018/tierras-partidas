import type { Rng } from '../core/rng';
import { LOCK_COLORS } from '../data/traps';
import { FLOOR, type DungeonMap } from './generator';

export interface LockLayout {
  /** Índice de casilla → color del candado (las puertas de una misma sala comparten color). */
  doors: Map<number, string>;
  keys: { x: number; y: number; color: string }[];
  lockedRooms: number[];
}

/** Casillas de pasillo pegadas al borde de la sala: son sus entradas. */
function entrances(m: DungeonMap, room: number): number[] {
  const r = m.rooms[room];
  const out: number[] = [];
  const add = (x: number, y: number) => {
    if (x >= 0 && y >= 0 && x < m.w && y < m.h && m.tiles[y * m.w + x] === FLOOR && m.roomAt[y * m.w + x] !== room) out.push(y * m.w + x);
  };
  for (let x = r.x; x < r.x + r.w; x++) {
    add(x, r.y - 1);
    add(x, r.y + r.h);
  }
  for (let y = r.y; y < r.y + r.h; y++) {
    add(r.x - 1, y);
    add(r.x + r.w, y);
  }
  return out;
}

/**
 * Cierra entre 1 y `max` salas con candados de colores, siempre resoluble:
 * se simula abrirlas en orden y cada llave se coloca en una zona ya alcanzable
 * (a menudo dentro de la sala abierta justo antes, para formar una cadena).
 * La sala de salida del grupo nunca se cierra; la de las escaleras suele ser la última.
 */
export function setupLocks(m: DungeonMap, rng: Rng, opts: { startRoom: number; stairsRoom: number; start: { x: number; y: number }; max: number }): LockLayout | null {
  const candidates = m.rooms.map((_, i) => i).filter((i) => i !== opts.startRoom);
  if (!candidates.length) return null;
  const count = rng.int(1, Math.min(opts.max, 5, candidates.length));
  const others = rng.shuffle(candidates.filter((i) => i !== opts.stairsRoom));
  const locked: number[] = [];
  const stairsLast = opts.stairsRoom !== opts.startRoom && rng.chance(0.65);
  while (locked.length < count - (stairsLast ? 1 : 0) && others.length) locked.push(others.pop()!);
  if (stairsLast) locked.push(opts.stairsRoom);
  if (!locked.length) return null;

  const roomDoors = new Map<number, number[]>();
  const doorRoom = new Map<number, number>();
  for (const room of locked) {
    const ds = entrances(m, room).filter((t) => !doorRoom.has(t));
    roomDoors.set(room, ds);
    for (const t of ds) doorRoom.set(t, room);
  }

  const closed = new Set(locked);
  const W = m.w;
  const reachable = (): Uint8Array => {
    const seen = new Uint8Array(m.w * m.h);
    const startIdx = opts.start.y * W + opts.start.x;
    const q = [startIdx];
    seen[startIdx] = 1;
    while (q.length) {
      const cur = q.pop()!;
      const cx = cur % W;
      const cy = (cur / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
        const ni = ny * W + nx;
        if (seen[ni] || m.tiles[ni] !== FLOOR) continue;
        if (doorRoom.has(ni) && closed.has(doorRoom.get(ni)!)) continue;
        if (closed.has(m.roomAt[ni])) continue;
        seen[ni] = 1;
        q.push(ni);
      }
    }
    return seen;
  };
  const touches = (seen: Uint8Array, t: number) =>
    // Solo en cruz: tocar una puerta en diagonal a través de una esquina de pared no sirve para abrirla.
    [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const x = (t % W) + dx;
      const y = ((t / W) | 0) + dy;
      return x >= 0 && y >= 0 && x < m.w && y < m.h && seen[y * W + x] === 1;
    });

  // Orden de apertura: en cada paso, una sala cerrada cuya puerta ya se pueda alcanzar
  // (y su llave se coloca en la zona alcanzable). Las escaleras, si están cerradas, lo más tarde posible.
  const order: number[] = [];
  const keys: LockLayout['keys'] = [];
  const colors = rng.shuffle([...LOCK_COLORS]);
  const used = new Set<number>([opts.start.y * W + opts.start.x]);
  while (closed.size) {
    const seen = reachable();
    const ready = [...closed].filter((room) => roomDoors.get(room)!.some((t) => touches(seen, t)));
    if (!ready.length) break;
    const nonStairs = ready.filter((r) => r !== opts.stairsRoom);
    const room = rng.pick(nonStairs.length ? nonStairs : ready);
    const reach: number[] = [];
    for (let t = 0; t < seen.length; t++) if (seen[t] && !used.has(t) && !doorRoom.has(t)) reach.push(t);
    const inRooms = reach.filter((t) => m.roomAt[t] >= 0);
    const prev = order.length ? reach.filter((t) => m.roomAt[t] === order[order.length - 1]) : [];
    const pool = prev.length && rng.chance(0.7) ? prev : inRooms.length ? inRooms : reach;
    if (!pool.length) break;
    const t = rng.pick(pool);
    used.add(t);
    keys.push({ x: t % W, y: (t / W) | 0, color: colors[order.length].id });
    order.push(room);
    closed.delete(room);
  }
  if (!order.length) return null;

  // Las salas que no se pudieron encadenar se quedan sin candado.
  const doors = new Map<number, string>();
  order.forEach((room, i) => {
    for (const t of roomDoors.get(room)!) doors.set(t, colors[i].id);
  });
  return { doors, keys, lockedRooms: order };
}
