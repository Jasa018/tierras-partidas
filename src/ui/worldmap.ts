import { sfx } from '../audio/audio';
import { DUNGEONS, dungeonChain, type DungeonDef } from '../data/dungeons';
import { QUESTS } from '../data/quests';
import { DUNGEON_SPOTS, LOCATIONS, REGIONS, ROUTES, TOWER_ID, type LocationDef, type RouteDef } from '../data/world';
import { Rng } from '../core/rng';
import { hasFlag, hasFlags, type GameState } from '../core/state';
import { poseFor } from '../gfx/facing';
import { sprite } from '../gfx/sprites';
import { h, isBack, isOk, pushKeys, root, toast } from './dom';
import { fadeNextScreen, stars } from './layout';
import type { TownAction } from './screens';

/**
 * Mapa del mundo: Aren camina por los caminos de la región. Los puntos (pueblos, mazmorras, rutas, salidas a otras
 * regiones y el portal a Babel) forman un grafo; con las flechas se va al vecino que hay en esa dirección y con
 * Enter se entra. Lo que aún no se ha descubierto sale como «¿?» y no se puede pisar.
 */

/** Ancho del mapa: se ajusta a la forma de la ventana (el alto es fijo) para ocupar toda la pantalla. */
let W = 640;
const H = 480;
const SPEED = 230; // píxeles del mapa por segundo

type NodeKind = 'town' | 'spot' | 'route' | 'exit' | 'portal' | 'streets';
type IconId = 'castle' | 'house' | 'tent' | 'tower' | 'cave' | 'tree' | 'mountain' | 'fort' | 'ruins' | 'wave' | 'skull' | 'volcano' | 'cloud' | 'dune' | 'portal';

interface MapNode {
  id: string;
  kind: NodeKind;
  x: number;
  y: number;
  known: boolean;
  label: string;
  icon: IconId;
  loc?: LocationDef;
  dungeon?: DungeonDef;
  route?: RouteDef;
  /** Salida: la región y el nodo al que lleva. */
  toRegion?: string;
}

interface RegionGraph {
  region: string;
  nodes: Map<string, MapNode>;
  /** Caminos dibujados (a, b, estilo). */
  edges: { a: string; b: string; style: 'road' | 'unsafe' | 'path' | 'unknown' | 'magic' }[];
  bg: HTMLCanvasElement;
}

/** Regiones que son tierra firme y se tocan entre sí (el Archipiélago son islas y el Cielo, nubes). */
const CONTINENTAL = new Set(['frontera', 'rutas', 'arena', 'cumbres', 'maldita', 'inframundo']);
/** Mazmorras que están en el agua o en el aire: no llevan tierra debajo. */
const noLand = (n: MapNode) => n.icon === 'wave' || n.icon === 'cloud';
/** Mazmorras de mar (no de lago): en el continente se abre una bahía hasta el océano. */
const atSea = (n: MapNode) => !!n.dungeon && /costa|arrecife|naufragio|cayo|acantilados/.test(n.dungeon.id);
/** Distancia mínima entre puntos (para que no se monten uno encima de otro). */
const MIN_GAP = 48;

// ---------------------------------------------------------------- iconos

/** Icono de una mazmorra según su temática (por el nombre). */
function dungeonIcon(d: DungeonDef): IconId {
  const id = d.id;
  const t: [RegExp, IconId][] = [
    [/torre|babel/, 'tower'],
    [/bastion|fortin|ciudadela|trono|albar|calles|tomad/, 'fort'],
    [/escalinata|puerta_alba|alba|salones/, 'cloud'],
    [/crater|rios_fuego|circulo|descenso|azufre/, 'volcano'],
    [/osario|yermo|ceniza|huesos|hueso/, 'skull'],
    [/ruinas|templo|santuario|catacumbas|cripta|cuervo/, 'ruins'],
    [/lago|cienaga|marjal|arrecife|costa|naufragio|cayo|acantilados|niebla/, 'wave'],
    [/dunas|canon|pozos/, 'dune'],
    [/paso|cumbre|glaciar|escarcha|morgath|ixa/, 'mountain'],
    [/bosque|robledal|campos|llanura|sendero|plumas|guarida/, 'tree'],
  ];
  return t.find(([re]) => re.test(id))?.[1] ?? 'cave';
}
const townIcon = (l: LocationDef): IconId => (l.kind === 'capital' ? 'castle' : l.kind === 'torre' ? 'tower' : l.kind === 'refugio' ? 'tent' : 'house');

/** Iconos de 12x12 (K contorno, A color, B sombra, R tejado, D puerta, G verde, W blanco, F fuego, P morado). */
const ICONS: Record<IconId, string[]> = {
  castle: ['.K.K....K.K.', '.KAK.KK.KAK.', '.KAKKAAKKAK.', '.KAAAAAAAAK.', '.KAAAAAAAAK.', 'KKKAAKKAAKKK', 'KAAAAKKAAAAK', 'KAAAAAAAAAAK', 'KAABAKKABAAK', 'KAAAKDDKAAAK', 'KAAAKDDKAAAK', 'KKKKKKKKKKKK'],
  house: ['............', '.....KK.....', '....KRRK....', '...KRRRRK...', '..KRRRRRRK..', '.KRRRRRRRRK.', 'KKKKKKKKKKKK', '.KAAAAAAAAK.', '.KAKWKAAAAK.', '.KAKKKAKDKK.', '.KAAAAAKDKK.', '.KKKKKKKKKK.'],
  tent: ['............', '.....KK.....', '....KAAK....', '....KAAK....', '...KAABAK...', '...KAABAK...', '..KAAABAAK..', '..KAAKDKAK..', '.KAAAKDKAAK.', '.KAAKDDDKAK.', 'KAAAKDDDKAAK', 'KKKKKKKKKKKK'],
  tower: ['....KKKK....', '...KPPPPK...', '....KAAK....', '....KAAK....', '...KAAAAK...', '...KAWAAK...', '...KAAAAK...', '...KAAWAK...', '..KAAAAAAK..', '..KAAKKAAK..', '..KAAKDKAK..', '.KKKKKKKKKK.'],
  cave: ['............', '............', '....KKKK....', '...KAAAAK...', '..KAABBAAK..', '.KAABKKBAAK.', '.KABKKKKBAK.', 'KAABKKKKBAAK', 'KAABKKKKBAAK', 'KAAAKKKKAAAK', 'KAAAAAAAAAAK', 'KKKKKKKKKKKK'],
  tree: ['.....KK.....', '....KGGK....', '...KGGGGK...', '..KGGBGGGK..', '..KGGGGBGK..', '.KGGBGGGGGK.', '.KGGGGGBGGK.', '..KKKGGKKK..', '....KDDK....', '....KDDK....', '...KKDDKK...', '..KKKKKKKK..'],
  mountain: ['............', '.....KK.....', '....KWWK....', '...KWWAAK...', '...KWAAAK...', '..KAAAABAK..', '..KAABAAAK..', '.KAAAAABAAK.', '.KABAAAAABK.', 'KAAAABAAAAAK', 'KAABAAAABAAK', 'KKKKKKKKKKKK'],
  fort: ['K.K.K..K.K.K', 'KKKKK..KKKKK', 'KAAAK..KAAAK', 'KAAAKKKKAAAK', 'KAAAAAAAAAAK', 'KAKAAAAAAKAK', 'KAAAAAAAAAAK', 'KAAAAKKAAAAK', 'KAAAKDDKAAAK', 'KAAAKDDKAAAK', 'KAAAKDDKAAAK', 'KKKKKKKKKKKK'],
  ruins: ['............', '.KKKKKKKKKK.', '.KAAAAAAAAK.', '.KKKKKKKKKK.', '..KAK..KAK..', '..KAK..KAK..', '..KAK..KBK..', '..KAK...K...', '..KBK.......', '..KAK..KK...', '.KKKKKKKKKK.', 'KKKKKKKKKKKK'],
  wave: ['............', '............', '...KKK......', '..KWAAK..KK.', '.KAAAAAKKWAK', 'KAAKKAAAAAAK', 'KAK..KAAAAK.', '.K..KKAAKK..', '...KWAAK.KK.', '..KAAAAAKWAK', '.KAAKKAAAAAK', '.KKK..KKKKK.'],
  skull: ['............', '...KKKKKK...', '..KWWWWWWK..', '.KWWWWWWWWK.', '.KWKKWWKKWK.', '.KWKKWWKKWK.', '.KWWWKKWWWK.', '..KWWWWWWK..', '...KWKWKWK..', '...KKKKKKK..', '............', '............'],
  volcano: ['....F..F....', '...F.FF.F...', '....KFFK....', '....KFFK....', '...KAFFAK...', '...KAAFAK...', '..KAAAAAAK..', '..KABAAABK..', '.KAAAAAAAAK.', '.KABAAAABAK.', 'KAAAAABAAAAK', 'KKKKKKKKKKKK'],
  cloud: ['............', '............', '....KKK.....', '...KWWWK.KK.', '..KWWWWWKWWK', '.KWWWWWWWWWK', 'KWWWWWWWWWWK', 'KWWBWWWWBWWK', '.KKKKKKKKKK.', '....KAK.....', '...KAAK.....', '..KKKKK.....'],
  dune: ['............', '............', '............', '......KKK...', '....KKAAAK..', '...KAAAAAAK.', '..KAABAAAAAK', '.KAAAAAKKKKK', 'KAAAAKKAAAK.', 'KABAKAAAAAAK', 'KAAAAAABAAAK', 'KKKKKKKKKKKK'],
  portal: ['....KKKK....', '..KKPPPPKK..', '.KPPWWWWPPK.', '.KPWKKKKWPK.', 'KPWK.PP.KWPK', 'KPWKP..PKWPK', 'KPWKP..PKWPK', 'KPWK.PP.KWPK', '.KPWKKKKWPK.', '.KPPWWWWPPK.', '..KKPPPPKK..', '....KKKK....'],
};
const ICON_PAL: Record<IconId, Record<string, string>> = {
  castle: { A: '#c9b48a', B: '#8a7656', D: '#3a2a1a' },
  house: { A: '#d8c49a', R: '#a84a3a', W: '#ffe680', D: '#5a3a1a' },
  tent: { A: '#c8a070', B: '#8a6a40', D: '#2a1a10' },
  tower: { A: '#8a7ab0', P: '#c070ff', W: '#ffe680', D: '#2a1a3a' },
  cave: { A: '#8a7a6a', B: '#5a4e44' },
  tree: { G: '#4a8a3a', B: '#2e6a2a', D: '#6a4a2a' },
  mountain: { A: '#8a8a9a', B: '#5a5a6a', W: '#f0f0ff' },
  fort: { A: '#8a8a94', D: '#2a2026' },
  ruins: { A: '#c8bca0', B: '#8a806a' },
  wave: { A: '#4a8ac8', W: '#d8f0ff' },
  skull: { W: '#e8e0d0' },
  volcano: { A: '#6a4a3a', B: '#4a2a22', F: '#ff7a2a' },
  cloud: { W: '#ffffff', B: '#d8d0e8', A: '#e8c870' },
  dune: { A: '#d8b070', B: '#a8844a' },
  portal: { P: '#a070e0', W: '#e8d8ff' },
};
const iconCache = new Map<string, HTMLCanvasElement>();
function iconCanvas(id: IconId, grey = false): HTMLCanvasElement {
  const key = `${id}${grey ? '#g' : ''}`;
  const hit = iconCache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = 12;
  c.height = 12;
  const ctx = c.getContext('2d')!;
  const pal: Record<string, string> = { K: '#0a080c', ...ICON_PAL[id] };
  ICONS[id].forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      ctx.fillStyle = grey && ch !== 'K' ? '#5a5466' : pal[ch] ?? '#ff00ff';
      ctx.fillRect(x, y, 1, 1);
    }),
  );
  iconCache.set(key, c);
  return c;
}

// ---------------------------------------------------------------- fondo: un mapamundi sencillo por región

const PALETTES: Record<string, { sea: string; land: string; dark: string; coast: string; decor: 'tree' | 'dune' | 'peak' | 'bone' | 'palm' | 'lava' | 'cloud' | 'star' }> = {
  frontera: { sea: '#1d3a4a', land: '#5f7f3e', dark: '#4a6630', coast: '#c8b878', decor: 'tree' },
  rutas: { sea: '#183842', land: '#3f6e4c', dark: '#2e563a', coast: '#9ab890', decor: 'tree' },
  arena: { sea: '#28485a', land: '#c9a462', dark: '#a8864c', coast: '#e8d098', decor: 'dune' },
  cumbres: { sea: '#243650', land: '#c6d2de', dark: '#9aaabc', coast: '#e8f0f8', decor: 'peak' },
  maldita: { sea: '#161412', land: '#5c564a', dark: '#48433a', coast: '#8a8070', decor: 'bone' },
  coral: { sea: '#1a4a7a', land: '#5f9a4e', dark: '#4a7e3c', coast: '#e8d498', decor: 'palm' },
  inframundo: { sea: '#3a0c06', land: '#4a2a22', dark: '#3a1e18', coast: '#e8501a', decor: 'lava' },
  cielo: { sea: '#8eaad2', land: '#f2eee2', dark: '#dcd4c0', coast: '#ffffff', decor: 'cloud' },
  babel: { sea: '#140c22', land: '#4a3a6a', dark: '#3a2c56', coast: '#a070e0', decor: 'star' },
};

type Blob = [number, number, number];

/**
 * Fondo de la región como un mapamundi: mar, tierra (continente o islas), lagos donde hay mazmorras de agua y adornos.
 * Devuelve también la máscara de tierra (para saber por dónde se camina).
 */
function drawBackground(region: string, land: Blob[], lakes: Blob[]): { bg: HTMLCanvasElement; mask: Uint8Array } {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const m = document.createElement('canvas');
  m.width = W;
  m.height = H;
  const mctx = m.getContext('2d')!;
  const pal = PALETTES[region] ?? PALETTES.frontera;
  const rng = new Rng([...region].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7));
  ctx.fillStyle = pal.sea;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let i = 0; i < 90; i++) ctx.fillRect(rng.int(0, W), rng.int(0, H), rng.int(4, 12), 1);
  const shape = (cx: CanvasRenderingContext2D, blobs: Blob[], grow: number, color: string) => {
    cx.fillStyle = color;
    for (const [x, y, r] of blobs) {
      cx.beginPath();
      // Borde irregular: un polígono con radios al azar (pixelado después).
      const n = 16;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2;
        const rr = r + grow + ((Math.round(x) * 7 + Math.round(y) * 13 + i * 29) % 11) - 5;
        const px = x + Math.cos(a) * rr;
        const py = y + Math.sin(a) * rr * 0.85;
        if (i) cx.lineTo(px, py);
        else cx.moveTo(px, py);
      }
      cx.fill();
    }
  };
  shape(ctx, land, 6, pal.coast);
  shape(ctx, land, 0, pal.land);
  shape(mctx, land, 0, '#fff');
  // Manchas de color.
  ctx.fillStyle = pal.dark;
  for (let i = 0; i < 40 && land.length; i++) {
    const [x, y, r] = land[rng.int(0, land.length - 1)];
    ctx.beginPath();
    ctx.ellipse(x + rng.int(-r / 2, r / 2), y + rng.int(-r / 2, r / 2), rng.int(8, 20), rng.int(5, 12), 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Lagos y bahías donde hay mazmorras de agua.
  shape(ctx, lakes, 5, pal.coast);
  shape(ctx, lakes, 0, pal.sea);
  mctx.globalCompositeOperation = 'destination-out';
  shape(mctx, lakes, 0, '#fff');
  mctx.globalCompositeOperation = 'source-over';
  const md = mctx.getImageData(0, 0, W, H).data;
  const mask = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) mask[i] = md[i * 4 + 3] > 128 ? 1 : 0;
  // Adornos de la región sobre la tierra (lejos de los puntos).
  for (let i = 0; i < 160; i++) {
    const x = rng.int(6, W - 6);
    const y = rng.int(10, H - 6);
    if (!mask[y * W + x] || !mask[(y - 8) * W + x] || land.some(([bx, by, r]) => r < 24 && Math.hypot(bx - x, by - y) < 26)) continue;
    decor(ctx, pal.decor, x, y);
  }
  // Pixelado: se reduce y se amplía sin suavizar, como el resto del juego.
  const small = document.createElement('canvas');
  small.width = W / 2;
  small.height = H / 2;
  const sctx = small.getContext('2d')!;
  sctx.imageSmoothingEnabled = false;
  sctx.drawImage(c, 0, 0, W / 2, H / 2);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(small, 0, 0, W, H);
  // Nombre de la región, en una cartela.
  const name = REGIONS[region].name.toUpperCase();
  ctx.font = '18px VT323, monospace';
  ctx.textAlign = 'left';
  const tw = ctx.measureText(name).width;
  ctx.fillStyle = 'rgba(10,8,12,0.75)';
  ctx.fillRect(10, 8, tw + 20, 24);
  ctx.strokeStyle = '#c9a24a';
  ctx.strokeRect(10.5, 8.5, tw + 19, 23);
  ctx.fillStyle = '#e8dcc8';
  ctx.fillText(name, 20, 26);
  return { bg: c, mask };
}

function decor(ctx: CanvasRenderingContext2D, kind: string, x: number, y: number) {
  const px = (dx: number, dy: number, w: number, hh: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(x + dx, y + dy, w, hh);
  };
  if (kind === 'tree') {
    px(-3, -6, 6, 6, '#2e5a24');
    px(-2, -8, 4, 2, '#3a6e2c');
    px(-1, 0, 2, 3, '#5a3a1a');
  } else if (kind === 'dune') {
    px(-6, 0, 12, 2, '#b08a4e');
    px(-3, -2, 6, 2, '#b08a4e');
  } else if (kind === 'peak') {
    for (let i = 0; i < 6; i++) px(-i, -6 + i, i * 2 + 1, 1, i < 2 ? '#ffffff' : '#8a96a8');
  } else if (kind === 'bone') {
    px(-4, 0, 8, 1, '#c8bca0');
    px(-5, -1, 2, 3, '#c8bca0');
    px(3, -1, 2, 3, '#c8bca0');
  } else if (kind === 'palm') {
    px(0, -6, 1, 7, '#6a4a2a');
    px(-4, -7, 9, 1, '#2e7a3a');
    px(-3, -8, 7, 1, '#3a8a44');
  } else if (kind === 'lava') {
    px(-5, 0, 4, 1, '#ff6a1a');
    px(-1, -1, 3, 1, '#ff6a1a');
    px(2, 0, 4, 1, '#e8501a');
  } else if (kind === 'cloud') {
    px(-6, -2, 12, 3, '#ffffff');
    px(-3, -4, 6, 2, '#ffffff');
  } else {
    px(0, 0, 1, 1, '#e8d8ff');
  }
}

// ---------------------------------------------------------------- grafo de la región

const visited = (state: GameState, id: string) => id === state.location || hasFlag(state, `visit:${id}`);

function buildRegion(state: GameState, region: string): RegionGraph {
  const nodes = new Map<string, MapNode>();
  const edges: RegionGraph['edges'] = [];
  const link = (a: string, b: string, style: RegionGraph['edges'][number]['style']) => edges.push({ a, b, style });
  const locs = Object.values(LOCATIONS).filter((l) => l.region === region);
  const spots = DUNGEON_SPOTS.filter((s) => LOCATIONS[s.from]?.region === region);
  // Encajar la región en el recuadro.
  const raw = [...locs, ...spots];
  const xs = raw.map((p) => p.x);
  const ys = raw.map((p) => p.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  // Margen de sobra en los bordes: ahí van las flechas de salida y sus nombres.
  const scale = Math.min((W - 220) / Math.max(maxX - minX, 20), (H - 200) / Math.max(maxY - minY, 20));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const P = (x: number, y: number) => ({ x: Math.round(W / 2 + (x - cx) * scale), y: Math.round(H / 2 + 10 + (y - cy) * scale) });

  for (const l of locs) {
    const p = P(l.x, l.y);
    nodes.set(`town:${l.id}`, { id: `town:${l.id}`, kind: 'town', ...p, known: visited(state, l.id), label: l.name, icon: townIcon(l), loc: l });
  }
  for (const s of spots) {
    const p = P(s.x, s.y);
    const d = DUNGEONS[s.dungeon];
    const id = `spot:${s.dungeon}`;
    nodes.set(id, { id, kind: 'spot', ...p, known: visited(state, s.from) && hasFlags(state, s.requires), label: d.name, icon: dungeonIcon(d), dungeon: d, loc: LOCATIONS[s.from] });
    link(`town:${s.from}`, id, 'path');
  }
  // Calles de una ciudad ya liberada (se pueden volver a recorrer).
  for (const l of locs) {
    if (!l.taken || !state.cleared[l.taken.dungeon]) continue;
    const t = nodes.get(`town:${l.id}`)!;
    const id = `streets:${l.id}`;
    nodes.set(id, { id, kind: 'streets', x: t.x + 30, y: t.y + 26, known: true, label: `Calles de ${l.name}`, icon: 'fort', dungeon: DUNGEONS[l.taken.dungeon], loc: l });
    link(t.id, id, 'path');
  }
  // Tierra: debajo de los pueblos y de las mazmorras que no son de agua; en el continente, también a lo largo de los
  // caminos y hasta el borde por donde se va a otra región de tierra firme.
  const continental = CONTINENTAL.has(region);
  const land: Blob[] = [];
  const lakes: Blob[] = [];
  const rng = new Rng(region.length * 977);
  const along = (a: { x: number; y: number }, b: { x: number; y: number }, r: number, to = 1) => {
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    for (let t = 0; t <= to; t += Math.min(0.5, 22 / Math.max(1, len))) land.push([a.x + (b.x - a.x) * t + rng.int(-12, 12), a.y + (b.y - a.y) * t + rng.int(-10, 10), r + rng.int(-6, 8)]);
  };
  /** Tierra a lo largo de un camino (se pone cuando los puntos ya están en su sitio). */
  const landLinks: [string, string, number, number][] = [];
  // Rutas: un punto a mitad de camino (la mazmorra) y, si van a otra región, una flecha en el borde.
  for (const r of ROUTES) {
    const A = LOCATIONS[r.a];
    const B = LOCATIONS[r.b];
    const inA = A.region === region;
    const inB = B.region === region;
    if (!inA && !inB) continue;
    const known = hasFlags(state, r.requires) && (visited(state, r.a) || visited(state, r.b));
    const safe = !!state.cleared[r.dungeon];
    const style = !known ? 'unknown' : safe ? 'road' : 'unsafe';
    const d = DUNGEONS[r.dungeon];
    const rid = `route:${r.id}`;
    if (inA && inB) {
      const a = nodes.get(`town:${r.a}`)!;
      const b = nodes.get(`town:${r.b}`)!;
      nodes.set(rid, { id: rid, kind: 'route', x: Math.round((a.x + b.x) / 2), y: Math.round((a.y + b.y) / 2), known, label: d.name, icon: dungeonIcon(d), dungeon: d, route: r });
      link(a.id, rid, style);
      link(rid, b.id, style);
      if (continental && !noLand(nodes.get(rid)!)) landLinks.push([a.id, b.id, 46, 1]);
      continue;
    }
    const here = inA ? A : B;
    const there = inA ? B : A;
    const from = nodes.get(`town:${here.id}`)!;
    const dx = there.x - here.x;
    const dy = there.y - here.y;
    const m = 26;
    const t = Math.min(dx > 0 ? (W - m - from.x) / dx : dx < 0 ? (m - from.x) / dx : Infinity, dy > 0 ? (H - m - from.y) / dy : dy < 0 ? (m - from.y) / dy : Infinity);
    const ex = Math.round(from.x + dx * t);
    const ey = Math.round(from.y + dy * t);
    const eid = `exit:${r.id}`;
    const otherKnown = Object.values(LOCATIONS).some((l) => l.region === there.region && visited(state, l.id));
    const routeNode: MapNode = { id: rid, kind: 'route', x: Math.round((from.x + ex) / 2), y: Math.round((from.y + ey) / 2), known, label: d.name, icon: dungeonIcon(d), dungeon: d, route: r };
    nodes.set(rid, routeNode);
    nodes.set(eid, { id: eid, kind: 'exit', x: ex, y: ey, known: known && otherKnown, label: otherKnown ? `${REGIONS[there.region].name}` : '¿?', icon: 'portal', route: r, toRegion: there.region, loc: there });
    link(from.id, rid, style);
    link(rid, eid, style);
    // La tierra sigue hasta el borde si al otro lado también hay tierra firme.
    if (continental && CONTINENTAL.has(there.region) && !noLand(routeNode)) landLinks.push([from.id, eid, 54, 1.25]);
  }
  // Portal a Babel (o de vuelta): en una esquina, con un camino mágico desde el pueblo donde se está.
  const pid = 'portal';
  const portal: MapNode = { id: pid, kind: 'portal', x: W - 44, y: H - 44, known: true, label: region === 'babel' ? 'Portal de regreso' : 'Torre de Babel', icon: 'portal' };
  nodes.set(pid, portal);
  const near = nodes.get(`town:${state.location}`) ?? [...nodes.values()].filter((n) => n.kind === 'town' && n.known).sort((a, b) => Math.hypot(a.x - portal.x, a.y - portal.y) - Math.hypot(b.x - portal.x, b.y - portal.y))[0];
  if (near) link(near.id, pid, 'magic');

  // Que ningún punto quede encima de otro: las mazmorras se apartan (los pueblos, las salidas y el portal no se mueven).
  const all = [...nodes.values()];
  const movable = (n: MapNode) => n.kind === 'spot' || n.kind === 'route' || n.kind === 'streets';
  for (let it = 0; it < 80; it++) {
    let moved = false;
    for (let i = 0; i < all.length; i++)
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i];
        const b = all[j];
        if (!movable(a) && !movable(b)) continue;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        if (d >= MIN_GAP) continue;
        if (d < 0.01) [dx, dy, d] = [1, 0.5, 1.1];
        const push = (MIN_GAP - d) / (movable(a) && movable(b) ? 2 : 1);
        const ux = dx / d;
        const uy = dy / d;
        if (movable(a)) [a.x, a.y] = [a.x - ux * push, a.y - uy * push];
        if (movable(b)) [b.x, b.y] = [b.x + ux * push, b.y + uy * push];
        moved = true;
      }
    for (const n of all) if (movable(n)) [n.x, n.y] = [Math.round(Math.max(40, Math.min(W - 40, n.x))), Math.round(Math.max(56, Math.min(H - 40, n.y)))];
    if (!moved) break;
  }

  // Tierra, lagos y bahías, ya con los puntos en su sitio.
  for (const [a, b, r, to] of landLinks) along(nodes.get(a)!, nodes.get(b)!, r, to);
  for (const n of nodes.values()) {
    if (n.kind === 'exit') continue;
    if (n.kind === 'portal') land.push([n.x, n.y, 22]);
    else if (!noLand(n)) land.push([n.x, n.y, continental ? rng.int(58, 76) : n.kind === 'town' ? 40 : 32]);
    else if (continental && atSea(n)) {
      // Mazmorra de mar: una bahía desde ella hasta el océano (hacia su salida, o hacia el borde más cercano).
      const exit = n.route ? nodes.get(`exit:${n.route.id}`) : undefined;
      const edge = exit ?? [{ x: n.x, y: -40 }, { x: n.x, y: H + 40 }, { x: -40, y: n.y }, { x: W + 40, y: n.y }].sort((p, q) => Math.hypot(p.x - n.x, p.y - n.y) - Math.hypot(q.x - n.x, q.y - n.y))[0];
      const len = Math.hypot(edge.x - n.x, edge.y - n.y);
      for (let t = 0; t <= 1.3; t += Math.min(0.25, 18 / Math.max(1, len))) lakes.push([n.x + (edge.x - n.x) * t, n.y + (edge.y - n.y) * t, 30]);
    } else if (continental && n.icon === 'wave') lakes.push([n.x, n.y, 26]);
  }
  // En el continente, los pueblos y sus mazmorras (caminos punteados) también comparten tierra.
  if (continental) for (const e of edges) if (e.style === 'path') along(nodes.get(e.a)!, nodes.get(e.b)!, 44);

  const { bg } = drawBackground(region, land, lakes);
  return { region, nodes, edges, bg };
}

// ---------------------------------------------------------------- pantalla

/** Qué hay en un punto (para el panel de la izquierda). */
function nodeInfo(state: GameState, n: MapNode): HTMLElement {
  if (!n.known) return h('div', 'wm-info', h('div', 'wm-title', '¿?'), h('p', 'muted', 'Aún no has descubierto este lugar. La historia (o un camino nuevo) te traerá hasta aquí.'));
  const questsHere = (ids: string[]) => QUESTS.filter((q) => state.quests[q.id]?.status === 'active' && 'dungeon' in q.objective && !!q.objective.dungeon && ids.includes(q.objective.dungeon));
  const dungeonLines = (d: DungeonDef) => {
    const chain = dungeonChain(d.id);
    const floors = chain.reduce((a, t) => a + t.floors, 0);
    const boss = chain.find((t) => t.boss);
    const qs = questsHere(chain.map((t) => t.id));
    return [
      h('div', 'wm-sub', `${stars(d.difficulty)}${state.cleared[d.id] ? '  ✓ superada' : ''}`),
      h('p', '', d.desc),
      h('div', 'muted', d.infinite ? 'Pisos sin fin.' : `${chain.length > 1 ? `${chain.length} tramos · ` : ''}${floors} pisos${boss ? ' · jefe al final' : ''}.`),
      qs.length ? h('div', 'wm-quests', `Misiones aquí: ${qs.map((q) => q.name).join(', ')}`) : '',
    ];
  };
  if (n.kind === 'town') {
    const l = n.loc!;
    const here = l.id === state.location;
    const kind = l.kind === 'capital' ? 'Capital' : l.kind === 'torre' ? 'Fuera de la historia' : l.kind === 'refugio' ? 'Refugio' : 'Pueblo';
    return h('div', 'wm-info', h('div', 'wm-title', l.name), h('div', 'wm-sub', `${kind} · ${REGIONS[l.region].name}`), h('p', '', l.desc),
      h('div', 'wm-hint', here ? 'Enter: entrar en el pueblo.' : 'Camina hasta aquí para viajar.'));
  }
  if (n.kind === 'spot' || n.kind === 'streets')
    return h('div', 'wm-info', h('div', 'wm-title', n.label), ...dungeonLines(n.dungeon!), h('div', 'wm-hint', 'Enter: preparar la incursión.'));
  if (n.kind === 'route') {
    const r = n.route!;
    const safe = !!state.cleared[r.dungeon];
    return h('div', 'wm-info', h('div', 'wm-title', n.label), h('div', 'wm-sub', `Camino entre ${LOCATIONS[r.a].name} y ${LOCATIONS[r.b].name}`), ...dungeonLines(n.dungeon!),
      h('div', 'wm-hint', safe ? 'Ruta segura: sigue caminando para cruzarla, o Enter para volver a explorarla.' : 'Ruta sin asegurar: Enter para atravesarla. Al llegar al fondo, llegáis al otro lado.'));
  }
  if (n.kind === 'exit')
    return h('div', 'wm-info', h('div', 'wm-title', `→ ${n.label}`), h('div', 'wm-sub', `Hacia ${n.loc!.name}`), h('p', '', 'El camino sale de esta región. Pisa la flecha para pasar al otro lado.'));
  const back = LOCATIONS[state.portalFrom ?? 'bastion_gris'];
  return h('div', 'wm-info', h('div', 'wm-title', n.label), h('p', '', state.location === TOWER_ID ? `Vuelve por el portal a ${back.name}.` : 'Un portal que lleva a la Torre de Babel: mazmorras de prueba, sin historia. Nada de lo que pase ahí se conserva.'), h('div', 'wm-hint', 'Enter: cruzar el portal.'));
}

/** Mapa del mundo. Devuelve lo que se elige, o null para volver al pueblo. */
/** Dónde estaba Aren al entrar en una mazmorra desde el mapa (al volver, aparece ahí). */
let resume: { location: string; region: string; node: string } | null = null;
/** El mapa y el punto elegido, para la animación de acercamiento al entrar en una mazmorra. */
let zoomFrom: { canvas: HTMLCanvasElement; x: number; y: number } | null = null;
/** Radio en el que Aren «está» en un punto. */
const NEAR = 16;

/**
 * Mapa del mundo, a pantalla completa: es lo que hay fuera de los pueblos. Aren camina libremente (por tierra, por los
 * caminos y los puentes). Devuelve lo elegido, o null al entrar en el pueblo. `intro`: se aleja desde el punto al abrirse.
 */
export function worldMap(state: GameState, intro = false): Promise<TownAction | null> {
  const loc = LOCATIONS[state.location];
  W = Math.max(560, Math.min(1000, Math.round((H * innerWidth) / Math.max(1, innerHeight))));
  const canvas = h('canvas', 'world-map');
  canvas.width = W;
  canvas.height = H;
  const top = h('div', 'wm-top');
  const pop = h('div', 'wm-pop hidden');
  const help = h('div', 'wm-help', 'Flechas o WASD: caminar · Enter: entrar · Clic: ir a un sitio · Para volver al pueblo, ponte encima y pulsa Enter');
  root().replaceChildren(h('div', 'wm-full', canvas, top, pop, help));
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  let g = buildRegion(state, loc.region);
  const setTop = () => top.replaceChildren(h('b', '', REGIONS[g.region].name), h('span', 'muted', ` · Estás en ${loc.name} · Oro: ${state.gold}`));
  let start = g.nodes.get(`town:${state.location}`)!;
  // Al volver de una mazmorra, Aren aparece en ella (si sigue en el mismo sitio).
  if (resume && resume.location === state.location && resume.region === g.region && g.nodes.get(resume.node)?.known) start = g.nodes.get(resume.node)!;
  resume = null;
  setTop();
  const walker = { x: start.x, y: start.y, fx: 0, fy: 1 };
  /** Punto en el que está Aren (o null si está en medio del camino). */
  let at: MapNode | null = start;
  /** Último punto que ha disparado algo al pisarlo (no se repite hasta salir de él). */
  let triggered: MapNode | null = start;
  /** Puntos por los que pasar al hacer clic (siguiendo los caminos). */
  let targets: { x: number; y: number }[] = [];
  const held = new Set<string>();
  let moving = false;
  let busy = intro; // durante las animaciones no se camina
  let slide: { old: HTMLCanvasElement; next: HTMLCanvasElement; dx: number; dy: number; t: number; then: () => void } | null = null;
  let done = false;
  let resolveFn: (a: TownAction | null) => void = () => undefined;
  const result = new Promise<TownAction | null>((r) => (resolveFn = r));

  /** Ventana junto al punto donde está Aren. */
  const showInfo = () => {
    if (!at) return hideInfo();
    pop.replaceChildren(nodeInfo(state, at));
    pop.classList.remove('hidden');
    const r = canvas.getBoundingClientRect();
    const sx = r.left + (at.x / W) * r.width;
    const sy = r.top + (at.y / H) * r.height;
    const pw = pop.offsetWidth;
    const ph = pop.offsetHeight;
    const left = sx + 40 + pw < innerWidth - 8 ? sx + 40 : sx - 40 - pw;
    pop.style.left = `${Math.max(8, left)}px`;
    pop.style.top = `${Math.max(48, Math.min(innerHeight - ph - 40, sy - ph / 2))}px`;
  };
  const hideInfo = () => pop.classList.add('hidden');

  const cleanup = () => {
    popKeys();
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
  };
  const finish = (a: TownAction | null) => {
    if (done) return;
    done = true;
    cleanup();
    if (a?.kind === 'dungeon' && at) {
      resume = { location: state.location, region: g.region, node: at.id };
      zoomFrom = { canvas, x: at.x, y: at.y };
    }
    hideInfo();
    resolveFn(a);
  };

  // Se camina por todo el mapa (tierra, mar y caminos): solo frena el borde.
  const walkable = (x: number, y: number) => x >= 8 && y >= 8 && x < W - 8 && y < H - 8;

  const changeRegion = (exit: MapNode) => {
    const old = document.createElement('canvas');
    old.width = W;
    old.height = H;
    old.getContext('2d')!.drawImage(canvas, 0, 0);
    const dx = exit.x < 40 ? -1 : exit.x > W - 40 ? 1 : 0;
    const dy = dx ? 0 : exit.y < H / 2 ? -1 : 1;
    const next = buildRegion(state, exit.toRegion!);
    const arrive = next.nodes.get(exit.id)!;
    // Aparece un poco hacia dentro, por el mismo camino.
    const inward = next.nodes.get(`route:${exit.route!.id}`) ?? arrive;
    const len = Math.max(1, Math.hypot(inward.x - arrive.x, inward.y - arrive.y));
    const pos = { x: arrive.x + ((inward.x - arrive.x) / len) * 34, y: arrive.y + ((inward.y - arrive.y) / len) * 34 };
    const preview = document.createElement('canvas');
    preview.width = W;
    preview.height = H;
    const pctx = preview.getContext('2d')!;
    drawScene(pctx, state, next, performance.now());
    drawWalker(pctx, state, { ...pos, fx: -dx, fy: -dy }, false, 0);
    hideInfo();
    held.clear();
    targets = [];
    busy = true;
    slide = {
      old, next: preview, dx, dy, t: 0,
      then: () => {
        g = next;
        walker.x = pos.x;
        walker.y = pos.y;
        at = null;
        triggered = arrive;
        busy = false;
        setTop();
      },
    };
    sfx('stairs');
  };

  /** Entrar en el pueblo: el mapa se acerca a él y se funde en negro. */
  const enterTown = async () => {
    busy = true;
    hideInfo();
    zoomFrom = { canvas, x: at!.x, y: at!.y };
    await zoomIntoMap();
    fadeNextScreen();
    finish(null);
  };

  /** Al llegar a un punto caminando: viajar si es otro pueblo, cambiar de región si es una salida, el portal. */
  const onReach = (n: MapNode) => {
    if (!n.known) return;
    if (n.kind === 'town' && n.loc!.id !== state.location) finish({ kind: 'travel', to: n.loc!.id, map: true });
    else if (n.kind === 'exit') {
      if (state.cleared[n.route!.dungeon]) changeRegion(n);
      else toast('Para salir de la región hay que asegurar antes la ruta.');
    } else if (n.kind === 'portal') act();
  };

  const act = () => {
    if (busy || slide || !at) return;
    const n = at;
    if (!n.known) return toast('¿? Aún no has descubierto este lugar.');
    if (n.kind === 'town') {
      if (n.loc!.id === state.location) void enterTown();
    } else if (n.kind === 'spot' || n.kind === 'streets') finish({ kind: 'dungeon', dungeon: n.dungeon!.id, map: true });
    else if (n.kind === 'route') finish({ kind: 'dungeon', dungeon: n.route!.dungeon, route: n.route, map: true });
    else if (n.kind === 'exit') onReach(n);
    else if (n.kind === 'portal') {
      if (state.location === TOWER_ID) finish({ kind: 'travel', to: state.portalFrom ?? 'bastion_gris', map: true });
      else {
        state.portalFrom = state.location;
        finish({ kind: 'travel', to: TOWER_ID, map: true });
      }
    }
  };

  const DIRS: Record<string, [number, number]> = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] };
  const dirKey = (k: string) => (DIRS[k] ? k : DIRS[k.toLowerCase()] ? k.toLowerCase() : null);
  const popKeys = pushKeys((e) => {
    if (done) return;
    const k = dirKey(e.key);
    if (k) {
      e.preventDefault();
      held.add(k);
      targets = [];
    } else if (isOk(e)) {
      e.preventDefault();
      act();
    } else if (isBack(e)) {
      e.preventDefault();
      toast(`El mapa es lo que hay fuera de los pueblos: para entrar en ${loc.name}, ponte encima y pulsa Enter.`);
    }
  });
  const onKeyUp = (e: KeyboardEvent) => {
    const k = dirKey(e.key);
    if (k) held.delete(k);
  };
  const onBlur = () => held.clear();
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  /** Camino por los caminos dibujados hasta un punto (desde el punto más cercano a Aren). */
  const pathTo = (dest: MapNode): { x: number; y: number }[] => {
    const adj = new Map<string, string[]>();
    for (const e of g.edges) {
      (adj.get(e.a) ?? adj.set(e.a, []).get(e.a)!).push(e.b);
      (adj.get(e.b) ?? adj.set(e.b, []).get(e.b)!).push(e.a);
    }
    const startNode = [...g.nodes.values()].sort((p, q) => Math.hypot(p.x - walker.x, p.y - walker.y) - Math.hypot(q.x - walker.x, q.y - walker.y))[0];
    const prev = new Map<string, string | null>([[startNode.id, null]]);
    const queue = [startNode.id];
    while (queue.length) {
      const cur = queue.shift()!;
      if (cur === dest.id) break;
      for (const nx of adj.get(cur) ?? []) if (!prev.has(nx)) (prev.set(nx, cur), queue.push(nx));
    }
    if (!prev.has(dest.id)) return [{ x: dest.x, y: dest.y }];
    const out: { x: number; y: number }[] = [];
    for (let id: string | null = dest.id; id; id = prev.get(id) ?? null) out.unshift({ x: g.nodes.get(id)!.x, y: g.nodes.get(id)!.y });
    return out;
  };

  canvas.addEventListener('click', (ev) => {
    if (done || busy) return;
    const r = canvas.getBoundingClientRect();
    const x = ((ev.clientX - r.left) / r.width) * W;
    const y = ((ev.clientY - r.top) / r.height) * H;
    const n = [...g.nodes.values()].find((q) => Math.hypot(q.x - x, q.y - y) < 18);
    if (n && n === at) return act();
    targets = n ? pathTo(n) : [{ x, y }];
  });

  const draw = (time: number) => {
    drawScene(ctx, state, g, time);
    drawWalker(ctx, state, walker, moving, time);
  };

  let last = performance.now();
  const frame = (time: number) => {
    if (done || !canvas.isConnected) return;
    const dt = Math.min(0.05, (time - last) / 1000);
    last = time;
    if (slide) {
      slide.t = Math.min(1, slide.t + dt * 2.2);
      const e = slide.t < 0.5 ? 2 * slide.t * slide.t : 1 - Math.pow(-2 * slide.t + 2, 2) / 2;
      if (slide.t >= 1) {
        const then = slide.then;
        slide = null;
        then();
      } else {
        // La región vieja sale por un lado y la nueva entra por el otro.
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(slide.old, -slide.dx * W * e, -slide.dy * H * e);
        ctx.drawImage(slide.next, slide.dx * W * (1 - e), slide.dy * H * (1 - e));
        requestAnimationFrame(frame);
        return;
      }
    }
    // Caminar: con las teclas (8 direcciones) o hacia donde se hizo clic. Si choca, se desliza por el borde.
    let vx = 0;
    let vy = 0;
    if (!busy) {
      for (const k of held) {
        vx += DIRS[k][0];
        vy += DIRS[k][1];
      }
      const target = targets[0];
      if (!vx && !vy && target) {
        const dx = target.x - walker.x;
        const dy = target.y - walker.y;
        const d = Math.hypot(dx, dy);
        if (d < 3) targets.shift();
        else {
          vx = dx / d;
          vy = dy / d;
        }
      }
    }
    moving = false;
    if (vx || vy) {
      const len = Math.hypot(vx, vy);
      const step = SPEED * dt;
      const mx = (vx / len) * step;
      const my = (vy / len) * step;
      const ox = walker.x;
      const oy = walker.y;
      if (walkable(walker.x + mx, walker.y + my)) {
        walker.x += mx;
        walker.y += my;
      } else if (mx && walkable(walker.x + mx, walker.y)) walker.x += mx;
      else if (my && walkable(walker.x, walker.y + my)) walker.y += my;
      moving = walker.x !== ox || walker.y !== oy;
      if (!moving) targets = [];
      walker.fx = vx / len;
      walker.fy = vy / len;
    }
    // ¿En qué punto está?
    let near: MapNode | null = null;
    let best = NEAR;
    for (const n of g.nodes.values()) {
      const d = Math.hypot(n.x - walker.x, n.y - walker.y);
      if (d < best) {
        best = d;
        near = n;
      }
    }
    if (near !== at) {
      at = near;
      if (at) showInfo();
      else hideInfo();
    }
    if (near !== triggered) {
      triggered = near;
      if (near && !busy) onReach(near);
      if (done) return;
    }
    draw(time);
    requestAnimationFrame(frame);
  };
  if (intro) {
    void zoomOutOfMap(canvas, () => draw(performance.now()), walker).then(() => {
      busy = false;
      showInfo();
      requestAnimationFrame(frame);
    });
  } else {
    requestAnimationFrame(frame);
    requestAnimationFrame(showInfo);
  }
  return result;
}

/** Fondo, caminos y puntos de una región. */
function drawScene(ctx: CanvasRenderingContext2D, state: GameState, g: RegionGraph, time: number) {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(g.bg, 0, 0);
  for (const e of g.edges) {
    const a = g.nodes.get(e.a)!;
    const b = g.nodes.get(e.b)!;
    ctx.lineWidth = e.style === 'path' ? 2 : 3;
    ctx.strokeStyle = e.style === 'road' ? '#e8c870' : e.style === 'unsafe' ? '#c84a3a' : e.style === 'path' ? 'rgba(20,14,10,0.7)' : e.style === 'magic' ? 'rgba(170,120,240,0.8)' : 'rgba(200,190,210,0.35)';
    ctx.setLineDash(e.style === 'road' ? [] : e.style === 'unsafe' ? [7, 5] : e.style === 'magic' ? [3, 3] : [2, 5]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.font = '15px VT323, monospace';
  ctx.textAlign = 'center';
  const spots = labelSpots(ctx, g);
  for (const n of g.nodes.values()) {
    if (n.kind === 'exit') {
      drawArrow(ctx, n, time);
      continue;
    }
    const size = n.kind === 'town' ? 30 : 24;
    if (n.known) ctx.drawImage(iconCanvas(n.icon), n.x - size / 2, n.y - size / 2 - 4, size, size);
    else {
      ctx.fillStyle = 'rgba(10,8,12,0.75)';
      ctx.beginPath();
      ctx.arc(n.x, n.y - 4, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b8a8c8';
      ctx.fillText('¿?', n.x, n.y + 1);
    }
    if (n.known && n.dungeon && state.cleared[n.dungeon.id]) label(ctx, '✓', n.x + size / 2, n.y - size / 2, '#4cff6a');
    const at = spots.get(n.id);
    if (n.known && at) label(ctx, n.label, at.x, at.y, n.kind === 'town' ? '#ffe9b0' : '#e8dcc8');
  }
}

/** Dónde va el nombre de cada punto: debajo, encima o a un lado, sin pisar otros nombres ni iconos. */
function labelSpots(ctx: CanvasRenderingContext2D, g: RegionGraph): Map<string, { x: number; y: number }> {
  const cached = (g as RegionGraph & { labels?: Map<string, { x: number; y: number }> }).labels;
  if (cached) return cached;
  const taken: { x0: number; y0: number; x1: number; y1: number }[] = [];
  for (const n of g.nodes.values()) taken.push({ x0: n.x - 13, y0: n.y - 19, x1: n.x + 13, y1: n.y + 9 });
  // Los nombres de las flechas de salida van siempre en su sitio: los demás se apartan.
  for (const n of g.nodes.values()) {
    if (n.kind !== 'exit') continue;
    const p = exitLabelAt(n);
    const w = ctx.measureText(n.known ? `→ ${n.label}` : '¿?').width + 4;
    taken.push({ x0: p.x - w / 2, y0: p.y - 11, x1: p.x + w / 2, y1: p.y + 3 });
  }
  const out = new Map<string, { x: number; y: number }>();
  const order = [...g.nodes.values()].filter((n) => n.known && n.kind !== 'exit').sort((a, b) => (a.kind === 'town' ? -1 : 0) - (b.kind === 'town' ? -1 : 0));
  for (const n of order) {
    const w = ctx.measureText(n.label).width + 4;
    const size = n.kind === 'town' ? 30 : 24;
    const tries = [
      { x: n.x, y: n.y + size / 2 + 8 },
      { x: n.x, y: n.y - size / 2 - 8 },
      { x: n.x + size / 2 + w / 2 + 2, y: n.y },
      { x: n.x - size / 2 - w / 2 - 2, y: n.y },
      { x: n.x, y: n.y + size / 2 + 20 },
    ];
    const rect = (p: { x: number; y: number }) => ({ x0: p.x - w / 2, y0: p.y - 11, x1: p.x + w / 2, y1: p.y + 3 });
    const free = (r: { x0: number; y0: number; x1: number; y1: number }) => !taken.some((t) => r.x0 < t.x1 && r.x1 > t.x0 && r.y0 < t.y1 && r.y1 > t.y0);
    const p = tries.find((q) => free(rect(q))) ?? tries[0];
    p.x = Math.max(w / 2 + 2, Math.min(W - w / 2 - 2, p.x));
    out.set(n.id, p);
    taken.push(rect(p));
  }
  (g as RegionGraph & { labels?: Map<string, { x: number; y: number }> }).labels = out;
  return out;
}

/** Aren, caminando (con su aura en el suelo). */
function drawWalker(ctx: CanvasRenderingContext2D, state: GameState, w: { x: number; y: number; fx: number; fy: number }, moving: boolean, time: number) {
  const pulse = 14 + Math.sin(time / 220) * 2;
  ctx.strokeStyle = '#ffe680';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(w.x, w.y + 8, pulse, pulse / 2.4, 0, 0, Math.PI * 2);
  ctx.stroke();
  const { pose, flip } = poseFor(Math.sign(Math.round(w.fx * 2)), Math.sign(Math.round(w.fy * 2)));
  const key = `p_aren_${state.protagClass}`;
  const spr = sprite(`${key}@${pose}`) ?? sprite(key);
  if (!spr) return;
  const bob = moving ? (Math.floor(time / 110) % 2 ? -2 : 0) : 0;
  ctx.save();
  ctx.translate(w.x, w.y - 14 + bob);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(spr, -16, -16, 32, 32);
  ctx.restore();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.fillStyle = 'rgba(10,8,12,0.8)';
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.fillText(text, x + dx, y + dy);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawArrow(ctx: CanvasRenderingContext2D, n: MapNode, time: number) {
  const dx = n.x < 40 ? -1 : n.x > W - 40 ? 1 : 0;
  const dy = dx ? 0 : n.y < H / 2 ? -1 : 1;
  const bob = Math.sin(time / 200) * 2;
  ctx.save();
  ctx.translate(n.x + dx * bob, n.y + dy * bob);
  ctx.rotate(Math.atan2(dy, dx));
  ctx.fillStyle = n.known ? '#ffe680' : '#6a6070';
  ctx.strokeStyle = '#0a080c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-6, -10);
  ctx.lineTo(-6, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  const p = exitLabelAt(n);
  label(ctx, n.known ? `→ ${n.label}` : '¿?', p.x, p.y, '#ffe9b0');
}

function exitLabelAt(n: MapNode): { x: number; y: number } {
  const dx = n.x < 40 ? -1 : n.x > W - 40 ? 1 : 0;
  const dy = dx ? 0 : n.y < H / 2 ? -1 : 1;
  return { x: Math.max(60, Math.min(W - 60, n.x - dx * 46)), y: Math.max(16, Math.min(H - 8, n.y - dy * 22 + (dx ? -14 : 0))) };
}

/** Acercamiento al punto elegido (al entrar en una mazmorra o en un pueblo), que se funde en negro. */
export function zoomIntoMap(): Promise<void> {
  const z = zoomFrom;
  zoomFrom = null;
  if (!z || !z.canvas.isConnected) return Promise.resolve();
  const snap = document.createElement('canvas');
  snap.width = z.canvas.width;
  snap.height = z.canvas.height;
  snap.getContext('2d')!.drawImage(z.canvas, 0, 0);
  sfx('stairs');
  return zoomAnim(z.canvas, snap, z, true);
}

/** Al salir al mapa: se aleja desde el punto donde está Aren, desde negro. */
function zoomOutOfMap(canvas: HTMLCanvasElement, draw: () => void, at: { x: number; y: number }): Promise<void> {
  draw();
  const snap = document.createElement('canvas');
  snap.width = canvas.width;
  snap.height = canvas.height;
  snap.getContext('2d')!.drawImage(canvas, 0, 0);
  return zoomAnim(canvas, snap, at, false);
}

function zoomAnim(canvas: HTMLCanvasElement, snap: HTMLCanvasElement, at: { x: number; y: number }, into: boolean): Promise<void> {
  const ctx = canvas.getContext('2d')!;
  return new Promise((resolve) => {
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / 750);
      const p = into ? t : 1 - t;
      const e = p * p * (3 - 2 * p);
      const k = 1 + 4 * e;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, snap.width, snap.height);
      ctx.save();
      ctx.translate(at.x + (snap.width / 2 - at.x) * e, at.y + (snap.height / 2 - at.y) * e);
      ctx.scale(k, k);
      ctx.translate(-at.x, -at.y);
      ctx.drawImage(snap, 0, 0);
      ctx.restore();
      ctx.fillStyle = `rgba(0,0,0,${Math.min(1, e * 1.15)})`;
      ctx.fillRect(0, 0, snap.width, snap.height);
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}
