import type { DungeonTheme } from '../data/dungeons';
import { Rng } from '../core/rng';
import { FLOOR, type DungeonMap } from '../dungeon/generator';
import { terrainOfCode, type TerrainId } from '../data/terrain';
import { shade } from './sprites';

export const TILE = 16;

/** Dibuja el mapa completo de un piso (suelo, muros con cara frontal, terrenos y muros especiales) en un canvas. */
export function drawDungeonMap(ctx: CanvasRenderingContext2D, map: DungeonMap, theme: DungeonTheme, seed: number): void {
  if (theme.sky) return drawSkyMap(ctx, map, theme, seed);
  // Un generador por casilla: así, al romper un muro y redibujar, el resto del mapa queda igual.
  let rng = new Rng(seed);
  const floorAt = (x: number, y: number) => x >= 0 && y >= 0 && x < map.w && y < map.h && map.tiles[y * map.w + x] === FLOOR;
  ctx.fillStyle = theme.wall;
  ctx.fillRect(0, 0, map.w * TILE, map.h * TILE);
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      const px = x * TILE;
      const py = y * TILE;
      rng = new Rng((seed + (y * map.w + x) * 7919) >>> 0);
      if (floorAt(x, y)) {
        ctx.fillStyle = (x + y) % 2 ? theme.floor : theme.floorAlt;
        ctx.fillRect(px, py, TILE, TILE);
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = rng.chance(0.5) ? shade(theme.floor, 0.12) : shade(theme.floor, -0.25);
          ctx.fillRect(px + rng.int(0, 15), py + rng.int(0, 15), 1, 1);
        }
        if (rng.chance(0.06)) {
          ctx.fillStyle = shade(theme.floor, -0.3);
          ctx.fillRect(px + rng.int(2, 10), py + rng.int(2, 12), rng.int(2, 4), 1);
        }
      } else if (floorAt(x, y + 1)) {
        // Cara frontal del muro (da sensación de profundidad).
        ctx.fillStyle = theme.wallFace;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = theme.wallTop;
        ctx.fillRect(px, py, TILE, 3);
        ctx.fillStyle = shade(theme.wallFace, -0.3);
        for (let by = 6; by < TILE; by += 5) ctx.fillRect(px, py + by, TILE, 1);
        for (let by = 3; by < TILE; by += 5) ctx.fillRect(px + ((by / 5) % 2 ? 4 : 11), py + by, 1, 5);
      } else {
        const nearFloor = [-1, 0, 1].some((dy) => [-1, 0, 1].some((dx) => floorAt(x + dx, y + dy)));
        if (nearFloor) {
          for (let i = 0; i < 6; i++) {
            ctx.fillStyle = shade(theme.wall, rng.chance(0.5) ? 0.08 : -0.3);
            ctx.fillRect(px + rng.int(0, 14), py + rng.int(0, 14), 2, 2);
          }
          ctx.fillStyle = theme.wallTop;
          if (floorAt(x - 1, y)) ctx.fillRect(px, py, 1, TILE);
          if (floorAt(x + 1, y)) ctx.fillRect(px + TILE - 1, py, 1, TILE);
          if (floorAt(x, y - 1)) ctx.fillRect(px, py, TILE, 1);
        }
      }
      const i = y * map.w + x;
      const ter = terrainOfCode(map.terrain[i]);
      if (ter && floorAt(x, y)) drawTerrain(ctx, ter, px, py, rng, map.flow[i]);
      const sp = map.special.get(i);
      if (sp === 'crack') drawCrack(ctx, px, py);
      else if (sp === 'hard') drawHardWall(ctx, px, py);
    }
  }
}

function drawTerrain(ctx: CanvasRenderingContext2D, t: TerrainId, px: number, py: number, rng: Rng, flow: number) {
  if (t === 'hierba') {
    ctx.fillStyle = '#26401f';
    ctx.fillRect(px, py, TILE, TILE);
    for (let i = 0; i < 9; i++) {
      const bx = px + rng.int(0, 14);
      const by = py + rng.int(3, 13);
      ctx.fillStyle = rng.chance(0.5) ? '#4f8a3a' : '#3a6a2c';
      ctx.fillRect(bx, by, 1, 3);
      ctx.fillRect(bx + 1, by - 1, 1, 2);
    }
  } else if (t === 'agua') {
    ctx.fillStyle = '#1f4270';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#4f7fb8';
    for (let i = 0; i < 3; i++) ctx.fillRect(px + rng.int(1, 9), py + 3 + i * 5, 4, 1);
    ctx.fillStyle = '#16345a';
    ctx.fillRect(px, py + TILE - 1, TILE, 1);
  } else if (t === 'brasas') {
    ctx.fillStyle = '#2a1410';
    ctx.fillRect(px, py, TILE, TILE);
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = rng.pick(['#ff8a3d', '#d83a1a', '#ffd060', '#7a2a1a']);
      ctx.fillRect(px + rng.int(0, 14), py + rng.int(0, 14), 2, 2);
    }
  } else if (t === 'barro') {
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(px, py, TILE, TILE);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = rng.chance(0.5) ? '#5a4024' : '#2a1e12';
      ctx.fillRect(px + rng.int(0, 11), py + rng.int(0, 13), rng.int(3, 5), 2);
    }
    ctx.fillStyle = 'rgba(160,130,90,0.5)';
    ctx.fillRect(px + rng.int(2, 10), py + rng.int(2, 12), 2, 1);
  } else if (t === 'hielo') {
    ctx.fillStyle = '#8ab8d8';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#c8e8f8';
    ctx.fillRect(px + 2, py + 3, 6, 1);
    ctx.fillRect(px + 9, py + 10, 4, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + rng.int(1, 13), py + rng.int(1, 13), 1, 1);
    ctx.fillStyle = '#6a98b8';
    ctx.fillRect(px, py + TILE - 1, TILE, 1);
  } else if (t === 'telarana') {
    ctx.fillStyle = 'rgba(230,230,240,0.75)';
    for (let k = 0; k < 16; k += 1) {
      ctx.fillRect(px + k, py + k, 1, 1);
      ctx.fillRect(px + 15 - k, py + k, 1, 1);
    }
    ctx.fillRect(px + 7, py, 1, TILE);
    ctx.fillRect(px, py + 7, TILE, 1);
    ctx.fillStyle = 'rgba(230,230,240,0.45)';
    ctx.strokeStyle = 'rgba(230,230,240,0.5)';
    ctx.strokeRect(px + 4.5, py + 4.5, 7, 7);
  } else if (t === 'niebla') {
    ctx.fillStyle = 'rgba(170,170,190,0.45)';
    ctx.fillRect(px, py, TILE, TILE);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = 'rgba(220,220,235,0.35)';
      ctx.fillRect(px + rng.int(0, 8), py + rng.int(0, 14), rng.int(5, 8), 2);
    }
  } else if (t === 'ceniza') {
    ctx.fillStyle = '#3a3538';
    ctx.fillRect(px, py, TILE, TILE);
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = rng.pick(['#5a5458', '#2a2528', '#7a7276']);
      ctx.fillRect(px + rng.int(0, 15), py + rng.int(0, 15), 1, 1);
    }
  } else if (t === 'corriente') {
    ctx.fillStyle = '#245a8a';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#8ac8f0';
    // Flecha en el sentido de la corriente (este, oeste, sur, norte).
    const [ax, ay] = [[1, 0], [-1, 0], [0, 1], [0, -1]][flow] ?? [1, 0];
    for (let k = -3; k <= 3; k++) ctx.fillRect(px + 7 + ax * k, py + 7 + ay * k, 2, 2);
    for (let k = 1; k <= 3; k++) {
      ctx.fillRect(px + 7 + ax * (3 - k) + ay * k, py + 7 + ay * (3 - k) + ax * k, 2, 2);
      ctx.fillRect(px + 7 + ax * (3 - k) - ay * k, py + 7 + ay * (3 - k) - ax * k, 2, 2);
    }
  } else if (t === 'raices') {
    ctx.fillStyle = '#4a3a1a';
    ctx.fillRect(px + 1, py + 9, 14, 2);
    ctx.fillRect(px + 4, py + 4, 2, 9);
    ctx.fillRect(px + 10, py + 2, 2, 12);
    ctx.fillStyle = '#6a7a2a';
    ctx.fillRect(px + 3, py + 3, 4, 2);
    ctx.fillRect(px + 9, py + 1, 4, 2);
    ctx.fillStyle = '#2a200e';
    ctx.fillRect(px + 1, py + 11, 14, 1);
  } else if (t === 'sagrado') {
    ctx.fillStyle = 'rgba(201,162,74,0.22)';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#c9a24a';
    ctx.fillRect(px + 7, py + 3, 2, 10);
    ctx.fillRect(px + 4, py + 6, 8, 2);
    ctx.fillStyle = 'rgba(255,230,128,0.5)';
    ctx.fillRect(px, py, TILE, 1);
    ctx.fillRect(px, py, 1, TILE);
  }
}

/**
 * Cielo: en vez de muros, el vacío (transparente: debajo la escena pinta las nubes). El suelo son baldosas de vidrio
 * separadas por una rendija, con un canto debajo cuando dan al vacío, como si flotaran. Las grietas y murallas son
 * bloques sueltos (de cristal agrietado o de piedra) flotando en el aire.
 */
function drawSkyMap(ctx: CanvasRenderingContext2D, map: DungeonMap, theme: DungeonTheme, seed: number) {
  const floorAt = (x: number, y: number) => x >= 0 && y >= 0 && x < map.w && y < map.h && map.tiles[y * map.w + x] === FLOOR;
  ctx.clearRect(0, 0, map.w * TILE, map.h * TILE);
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      const px = x * TILE;
      const py = y * TILE;
      const rng = new Rng((seed + (y * map.w + x) * 7919) >>> 0);
      const i = y * map.w + x;
      if (floorAt(x, y)) {
        // Canto de la baldosa: el grosor del vidrio, visible por debajo cuando ahí no hay suelo.
        if (!floorAt(x, y + 1)) {
          ctx.fillStyle = 'rgba(120, 165, 220, 0.75)';
          ctx.fillRect(px + 1, py + TILE, TILE - 2, 3);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.fillRect(px + 1, py + TILE, TILE - 2, 1);
        }
        // El vidrio, teñido con el color del suelo de la mazmorra (en damero, un poco más o menos opaco).
        ctx.globalAlpha = (x + y) % 2 ? 0.42 : 0.52;
        ctx.fillStyle = (x + y) % 2 ? theme.floor : theme.floorAlt;
        ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(px + 1, py + 1, TILE - 2, 1);
        ctx.fillRect(px + 1, py + 1, 1, TILE - 2);
        ctx.fillStyle = 'rgba(90, 130, 190, 0.7)';
        ctx.fillRect(px + 1, py + TILE - 2, TILE - 2, 1);
        ctx.fillRect(px + TILE - 2, py + 1, 1, TILE - 2);
        // Reflejo en diagonal (no en todas, para que no parezca un patrón).
        if (rng.chance(0.55)) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          const o = rng.int(3, 7);
          for (let k = 0; k < 4; k++) ctx.fillRect(px + o + k, py + 10 - k, 1, 1);
        }
        ctx.fillStyle = theme.wallTop;
        ctx.fillRect(px + 1, py + 1, 1, 1);
        const ter = terrainOfCode(map.terrain[i]);
        if (ter) {
          ctx.globalAlpha = 0.75;
          drawTerrain(ctx, ter, px, py, rng, map.flow[i]);
          ctx.globalAlpha = 1;
        }
      }
      const sp = map.special.get(i);
      if (sp === 'crack') {
        ctx.fillStyle = 'rgba(214, 232, 255, 0.92)';
        ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
        ctx.fillStyle = theme.wallTop;
        ctx.fillRect(px + 1, py + 1, TILE - 2, 1);
        drawCrack(ctx, px, py);
      } else if (sp === 'hard') drawHardWall(ctx, px, py);
    }
  }
}

/** Nubes en mosaico (se repiten sin costura): `far` es el cielo de fondo con nubecillas, si no, nubes grandes sobre transparente. */
export function skyCanvas(far: boolean): HTMLCanvasElement {
  const w = far ? 160 : 224;
  const h = far ? 96 : 128;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const rng = new Rng(far ? 11 : 23);
  if (far) {
    ctx.fillStyle = '#8cc4f2';
    ctx.fillRect(0, 0, w, h);
  }
  // Cada nube son varios círculos juntos; se pinta píxel a píxel para que se vea a cuadros (8 bits).
  const puffs: [number, number, number][] = [];
  for (let n = 0; n < (far ? 7 : 5); n++) {
    const cx = rng.int(0, w - 1);
    const cy = rng.int(0, h - 1);
    const size = far ? rng.int(4, 8) : rng.int(9, 15);
    for (let k = 0; k < 5; k++) puffs.push([cx + rng.int(-size * 1.6, size * 1.6), cy + rng.int(-size / 2, size / 3), size * (0.6 + rng.next() * 0.5)]);
  }
  const inside = (x: number, y: number) => puffs.some(([px, py, r]) => {
    // Con la vuelta: así la nube que se sale por un lado entra por el otro.
    const dx = Math.min(Math.abs(x - px), w - Math.abs(x - px));
    const dy = Math.min(Math.abs(y - py), h - Math.abs(y - py));
    return dx * dx + dy * dy <= r * r;
  });
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!inside(x, y)) continue;
      // Sombra en la parte de abajo de cada nube.
      const shadow = !inside(x, (y + 2) % h);
      ctx.fillStyle = far ? (shadow ? '#a8d2f4' : '#c4e2fa') : shadow ? '#d4e8fa' : '#ffffff';
      ctx.fillRect(x, y, 1, 1);
    }
  return c;
}

/** Grieta: líneas claras quebradas sobre el muro. */
function drawCrack(ctx: CanvasRenderingContext2D, px: number, py: number) {
  ctx.fillStyle = '#0a0608';
  const pts = [[7, 1], [8, 3], [6, 5], [8, 7], [9, 9], [7, 11], [8, 13], [9, 15]];
  for (const [x, y] of pts) ctx.fillRect(px + x, py + y, 2, 2);
  ctx.fillRect(px + 9, py + 7, 3, 1);
  ctx.fillRect(px + 4, py + 11, 3, 1);
  ctx.fillStyle = 'rgba(232,220,200,0.55)';
  for (const [x, y] of pts) ctx.fillRect(px + x + 2, py + y, 1, 1);
}

/** Muralla reforzada: piedra clara con bandas de hierro y remaches. */
function drawHardWall(ctx: CanvasRenderingContext2D, px: number, py: number) {
  ctx.fillStyle = '#5a5248';
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = '#3a342e';
  ctx.fillRect(px, py + 5, TILE, 1);
  ctx.fillRect(px, py + 10, TILE, 1);
  ctx.fillRect(px + 5, py, 1, 5);
  ctx.fillRect(px + 11, py + 5, 1, 5);
  ctx.fillRect(px + 4, py + 10, 1, 6);
  ctx.fillStyle = '#8a5a2a';
  ctx.fillRect(px, py + 1, TILE, 2);
  ctx.fillRect(px, py + 13, TILE, 2);
  ctx.fillStyle = '#ffb060';
  for (const x of [2, 7, 12]) {
    ctx.fillRect(px + x, py + 1, 1, 1);
    ctx.fillRect(px + x, py + 13, 1, 1);
  }
}

export function drawStairs(ctx: CanvasRenderingContext2D, x: number, y: number, open: boolean): void {
  const px = x * TILE;
  const py = y * TILE;
  ctx.fillStyle = '#0a070c';
  ctx.fillRect(px + 1, py + 1, 14, 14);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = open ? shade('#c9a24a', -i * 0.18) : shade('#6a5a6a', -i * 0.18);
    ctx.fillRect(px + 2 + i, py + 2 + i * 3, 12 - i * 2, 2);
  }
}
