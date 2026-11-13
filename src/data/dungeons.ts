import type { TerrainId } from './terrain';
import type { TrapId } from './traps';
import type { Element } from './elements';

/** Forma de los pisos: pocas salas, la clásica, laberinto (muchas salas pequeñas y caminos) o salas gigantes. */
export type LayoutId = 'pequeno' | 'clasico' | 'laberinto' | 'salones';
export const LAYOUT_NAMES: Record<LayoutId, string> = { pequeno: 'Pocas salas', clasico: 'Salas y pasillos', laberinto: 'Laberinto', salones: 'Salas gigantes' };

/** Condiciones para abrir las escaleras de un piso (aparte del jefe de los núcleos). */
export type GoalKind = 'palanca' | 'llave' | 'caza' | 'braseros' | 'alfa' | 'escolta' | 'faros' | 'fragmentos' | 'colores' | 'cajas' | 'vigias';
export const GOALS: Record<GoalKind, { name: string; desc: string }> = {
  escolta: { name: 'Escolta', desc: 'Alguien perdido os sigue: llevadle hasta las escaleras. Si muere, una maldición sella vuestras habilidades este piso y los dos siguientes.' },
  faros: { name: 'Faros', desc: 'Junto a las escaleras hay una antorcha. Cógela y enciende los faros del piso (salen en el mapa) para abrirlas.' },
  fragmentos: { name: 'Fragmentos', desc: 'El sello de las escaleras está roto en pedazos repartidos por el piso. Recógelos todos.' },
  colores: { name: 'Orden de colores', desc: 'En la pared de las escaleras hay un orden de colores. Busca las palancas de esos colores y actívalas en ese orden.' },
  cajas: { name: 'Cajas', desc: 'En la sala de las escaleras hay cajas y placas. Empuja cada caja sobre una placa. Si una se atasca, pisa el botón de reinicio.' },
  vigias: { name: 'Vigías', desc: 'Gólems vigía custodian el piso. Si te ven (la zona roja), os devuelven al principio del piso. Las escaleras están abiertas.' },
  palanca: { name: 'Palanca', desc: 'Las escaleras están cerradas. En alguna sala hay una palanca que las abre: pásale por encima.' },
  llave: { name: 'Llave de la escalera', desc: 'Las escaleras tienen cerrojo. Su llave está tirada en algún rincón del piso.' },
  caza: { name: 'Cacería', desc: 'Un sello de sangre cierra las escaleras: se rompe al derrotar a suficientes monstruos en este piso.' },
  braseros: { name: 'Braseros', desc: 'Hay 3 braseros apagados en el piso. Enciéndelos todos (pásales por encima) para abrir las escaleras.' },
  alfa: { name: 'Alfa', desc: 'Un monstruo alfa, más fuerte que los demás, guarda el sello de las escaleras. Derrótalo.' },
};

/** Probabilidad por piso de una tienda dentro de la mazmorra, de un evento en una sala y de un monstruo dorado. */
export const SHOP_CHANCE = 0.12;
export const EVENT_CHANCE = 0.35;
export const GOLDEN_CHANCE = 0.1;

/** Lo que el informante puede contar de una mazmorra, y cuánto cobra (por estrella de dificultad). */
export type IntelId = 'monstruos' | 'jefe' | 'escaleras' | 'trampas' | 'llaves' | 'secretos' | 'objetivos' | 'misiones';
export const INTEL: Record<IntelId, { name: string; desc: string; price: number }> = {
  monstruos: { name: 'Monstruos y debilidades', desc: 'Qué monstruos hay y qué elementos les hacen más daño.', price: 8 },
  jefe: { name: 'El jefe', desc: 'Quién espera al final de cada tramo y cuál es su punto débil.', price: 10 },
  escaleras: { name: 'Las escaleras', desc: 'Las escaleras de cada piso salen marcadas en el mapa desde el principio.', price: 25 },
  trampas: { name: 'Las trampas', desc: 'Todas las trampas de cada piso se ven desde el principio (y el grupo las rodea).', price: 20 },
  llaves: { name: 'Llaves y candados', desc: 'Las llaves de las puertas con candado salen marcadas en el mapa.', price: 12 },
  secretos: { name: 'Muros y salas secretas', desc: 'Las paredes agrietadas y las murallas de las salas secretas salen marcadas en el mapa.', price: 12 },
  objetivos: { name: 'Objetivos de los pisos', desc: 'Palancas, braseros, faros, fragmentos, llaves de escalera, gólems y monstruos alfa salen marcados en el mapa, y el orden de colores se sabe desde el principio.', price: 15 },
  misiones: { name: 'Lo que buscas', desc: 'Las personas perdidas y los objetos de tus misiones salen marcados en el mapa.', price: 8 },
};

export interface DungeonTheme {
  floor: string;
  floorAlt: string;
  wall: string;
  wallFace: string;
  wallTop: string;
  /** Cielo: no hay muros sino el vacío; el suelo son baldosas de vidrio flotantes y debajo pasan las nubes. */
  sky?: boolean;
}

export interface DungeonDef {
  id: string;
  name: string;
  desc: string;
  difficulty: number;
  floors: number;
  levels: [number, number];
  theme: DungeonTheme;
  music: 'dungeon' | 'hondonada';
  monsters: { id: string; weight: number; minFloor?: number }[];
  items: { id: string; weight: number }[];
  boss?: { monster: string; level: number };
  /** Ingredientes que aparecen en el suelo (además de los que sueltan los monstruos). */
  ingredients: string[];
  /** Materiales que aparecen en el suelo (repetir un id lo hace más frecuente). */
  materials?: string[];
  /** Tipos de suelo y probabilidad de que cada sala tenga una mancha de ese suelo. */
  terrain?: { id: TerrainId; rooms: number }[];
  /** Paredes agrietadas por piso: atajos que se rompen con un ataque normal. */
  cracks?: number;
  /** Probabilidad por piso de una sala secreta tras una muralla reforzada (solo se rompe con bombas). Nunca tiene escaleras. */
  secrets?: number;
  /** Probabilidad por piso de que la sala de las escaleras esté cerrada con paredes agrietadas. */
  sealedStairs?: number;
  /** Trampas posibles y cuántas por sala (0.5 = una cada dos salas). */
  traps?: { ids: TrapId[]; density: number };
  /** Probabilidad por piso de que haya salas cerradas con candado, y cuántos candados como mucho (máx. 5). */
  locks?: { chance: number; max: number };
  /**
   * Siguiente tramo de la misma incursión (otra mazmorra con su propio aspecto, monstruos y pisos).
   * Al acabar los pisos de este tramo se pasa al siguiente sin salir; si este tramo tiene jefe, antes hay campamento.
   */
  next?: string;
  /** Formas de piso posibles y su peso. Sin esto, según la dificultad (las primeras mazmorras son pequeñas). */
  layouts?: { id: LayoutId; weight: number }[];
  /** Probabilidad por piso de que las escaleras pidan una condición, y cuáles pueden salir. */
  goals?: { chance: number; kinds: GoalKind[] };
  /** Pisos sin fin: cada 10 pisos hay un guardián al azar (con campamento justo después). */
  infinite?: boolean;
  /** Desfile de jefes (con `infinite`): cada piso es la sala de un jefe del juego al azar; cada RUSH_CAMP_EVERY, campamento. */
  bossRush?: boolean;
  /** Modo prueba: no da experiencia ni objetos; al salir se restaura la partida (solo se guarda el récord). */
  practice?: boolean;
  /** 'party': el nivel de los monstruos se ajusta al nivel medio del grupo y al rango elegido. */
  scaling?: 'party';
  /** 'all': pueden salir todos los monstruos del juego. */
  monsterPool?: 'all';
  /** Cada piso es de un elemento: solo salen monstruos de ese elemento. */
  elementFloors?: boolean;
  /** Prueba en solitario (prestigio): la mitad de monstruos y algo más débiles. */
  solo?: boolean;
  /** Elementos de la región: la mayoría de monstruos sale teñida de uno de ellos. */
  elements?: Element[];
  /** Nombre propio del jefe (si no, el del monstruo). */
  bossName?: string;
  /** Monstruos que acompañan al jefe en su sala. */
  bossEscort?: string[];
  /** Fuerza de la escolta respecto a ella misma como jefe (vida y daño): juntos son mucho más que por separado. */
  bossEscortPower?: { hp: number; dmg: number };
  /** Escena (SCENES) que se ve la primera vez que el jefe aparece a la vista, antes de luchar. */
  bossScene?: string;
  /** Pisos fijos dibujados a mano (el Campo de entrenamiento): sin azar, sin Parca y sin monstruos nuevos. */
  fixed?: boolean;
}

/** Nivel más bajo al que sale un monstruo en las mazmorras de la historia (99 si no sale en ninguna). */
const firstSeen = new Map<string, number>();
export function firstSeenLevel(monster: string): number {
  if (!firstSeen.size)
    for (const d of Object.values(DUNGEONS)) if (!d.practice && !d.scaling) for (const m of d.monsters) firstSeen.set(m.id, Math.min(firstSeen.get(m.id) ?? 99, d.levels[0]));
  return firstSeen.get(monster) ?? 99;
}

/** Nivel al que la historia pone a un jefe (99 si no es jefe de ninguna mazmorra). */
export function bossStoryLevel(monster: string): number {
  let lv = 99;
  for (const d of Object.values(DUNGEONS)) if (d.boss?.monster === monster && !d.scaling) lv = Math.min(lv, d.boss.level);
  return lv;
}

/** Mazmorras sin fin: un guardián cada tantos pisos (9 pisos normales y el décimo con jefe). */
export const BOSS_EVERY = 10;
/** Desfile de jefes: cada cuántos jefes hay campamento. */
export const RUSH_CAMP_EVERY = 3;
/** Desfile de jefes: a partir de cada uno de estos pisos sale un jefe más a la vez (piso 6: dos; piso 12: tres). */
export const RUSH_MIX_FROM = [6, 12];
/** Los jefes que acompañan al principal en el desfile van algo debilitados (vida y daño). */
export const RUSH_MIX_POWER = { hp: 0.6, dmg: 0.7 };
/** Segundos por piso antes de que llegue la Parca (en todas las mazmorras). */
export const REAPER_SECONDS = 180;
/** La Parca tiene tantos niveles más que los monstruos más fuertes de la mazmorra. */
export const REAPER_LEVEL_BONUS = 10;
/** Mazmorras sin fin: niveles que suben los monstruos con cada tramo de BOSS_EVERY pisos. */
export const TIER_LEVELS = 4;
/** Lo que vende el mercader del campamento, y cuánto más caro que en la ciudad. */
export const CAMP_SHOP = ['pan', 'carne_seca', 'racion', 'pocion', 'pocion_mayor', 'elixir', 'antidoto', 'piedra', 'frasco_fuego'];
export const CAMP_MARKUP = 1.25;

const COMMON_ITEMS = [
  { id: 'pan', weight: 10 },
  { id: 'pocion', weight: 9 },
  { id: 'piedra', weight: 8 },
  { id: 'antidoto', weight: 5 },
  { id: 'elixir', weight: 3 },
  { id: 'carne_seca', weight: 3 },
  { id: 'gold', weight: 14 },
  { id: 'carne_podrida', weight: 2 },
  { id: 'seta_dudosa', weight: 2 },
  { id: 'frasco_turbio', weight: 3 },
  { id: 'pergamino_sellado', weight: 2 },
];

export const DUNGEONS: Record<string, DungeonDef> = {
  cueva_goteante: {
    id: 'cueva_goteante', name: 'Cueva Goteante', desc: 'Una cueva húmeda bajo el Bastión. El agua gotea de una grieta pequeña.',
    difficulty: 1, floors: 3, levels: [1, 3], music: 'dungeon',
    theme: { floor: '#2a2f3a', floorAlt: '#323847', wall: '#10131a', wallFace: '#1d2330', wallTop: '#3b4658' },
    monsters: [{ id: 'slime', weight: 10 }, { id: 'murcielago', weight: 6 }, { id: 'ahogado', weight: 3, minFloor: 2 }],
    ingredients: ['hierba_silvestre', 'sal_roca'],
    materials: ['mineral_hierro', 'mineral_hierro', 'hueso_viejo'],
    terrain: [{ id: 'agua', rooms: 0.4 }, { id: 'corriente', rooms: 0.25 }], cracks: 2, sealedStairs: 0.15,
    traps: { ids: ['pinchos', 'veneno'], density: 0.25 },
    items: COMMON_ITEMS,
  },
  sendero_lodoso: {
    id: 'sendero_lodoso', name: 'Sendero Lodoso', desc: 'El viejo camino a Rocaverde, ahora pantanoso y lleno de bestias.',
    difficulty: 1, floors: 3, levels: [2, 4], music: 'dungeon',
    theme: { floor: '#3a3024', floorAlt: '#433828', wall: '#17120d', wallFace: '#2a2017', wallTop: '#55432f' },
    monsters: [{ id: 'slime', weight: 8 }, { id: 'murcielago', weight: 6 }, { id: 'lobo', weight: 4 }],
    ingredients: ['hierba_silvestre', 'raiz_amarga'],
    materials: ['cuero_bestia', 'mineral_hierro'],
    terrain: [{ id: 'hierba', rooms: 0.35 }, { id: 'barro', rooms: 0.45 }, { id: 'raices', rooms: 0.2 }, { id: 'agua', rooms: 0.15 }], cracks: 1,
    traps: { ids: ['pinchos', 'hambre', 'aturdidora'], density: 0.35 },
    items: COMMON_ITEMS,
  },
  bosque_espinas: {
    id: 'bosque_espinas', name: 'Bosque de Espinas', desc: 'Un bosque retorcido donde se pierden los leñadores.',
    difficulty: 2, floors: 2, levels: [3, 4], music: 'dungeon', next: 'bosque_profundo',
    theme: { floor: '#24301f', floorAlt: '#2b3a25', wall: '#0c140a', wallFace: '#182414', wallTop: '#3f5530' },
    monsters: [{ id: 'lobo', weight: 8 }, { id: 'hongo', weight: 6 }, { id: 'murcielago', weight: 4 }],
    ingredients: ['hierba_silvestre', 'raiz_amarga', 'seta'],
    materials: ['cuero_bestia', 'seda_arana', 'mineral_hierro'],
    terrain: [{ id: 'hierba', rooms: 0.6 }, { id: 'telarana', rooms: 0.15 }, { id: 'raices', rooms: 0.35 }], cracks: 1, secrets: 0.3,
    traps: { ids: ['veneno', 'aturdidora', 'pinchos'], density: 0.4 },
    goals: { chance: 0.25, kinds: ['palanca', 'caza', 'fragmentos'] },
    items: COMMON_ITEMS,
  },
  bosque_profundo: {
    id: 'bosque_profundo', name: 'Bosque Profundo', desc: 'Más adentro, las copas tapan el cielo y los caminos se enredan como un laberinto.',
    difficulty: 2, floors: 2, levels: [5, 6], music: 'dungeon',
    theme: { floor: '#1d2a1c', floorAlt: '#233222', wall: '#081008', wallFace: '#131f12', wallTop: '#2f4a2a' },
    monsters: [{ id: 'lobo', weight: 7 }, { id: 'hongo', weight: 5 }, { id: 'arana', weight: 5 }, { id: 'murcielago', weight: 3 }],
    ingredients: ['hierba_silvestre', 'seta', 'huevo_arana'],
    materials: ['cuero_bestia', 'seda_arana', 'seda_arana'],
    terrain: [{ id: 'hierba', rooms: 0.6 }, { id: 'telarana', rooms: 0.3 }, { id: 'raices', rooms: 0.4 }], cracks: 2, secrets: 0.3,
    traps: { ids: ['veneno', 'aturdidora', 'teletransporte', 'pinchos'], density: 0.45 },
    layouts: [{ id: 'laberinto', weight: 2 }, { id: 'clasico', weight: 1 }],
    goals: { chance: 0.35, kinds: ['palanca', 'caza', 'alfa', 'fragmentos', 'escolta'] },
    items: COMMON_ITEMS,
  },
  ruinas_santuario: {
    id: 'ruinas_santuario', name: 'Ruinas del Santuario', desc: 'Un santuario tragado por una Hondonada. Algo teje en su fondo.',
    difficulty: 3, floors: 3, levels: [5, 7], music: 'dungeon', next: 'cripta_santuario',
    theme: { floor: '#3a3438', floorAlt: '#433c41', wall: '#19151a', wallFace: '#2a2329', wallTop: '#5a4d55' },
    monsters: [{ id: 'arana', weight: 8 }, { id: 'esqueleto', weight: 7 }, { id: 'espectro', weight: 4, minFloor: 2 }, { id: 'hongo', weight: 3 }],
    ingredients: ['hierba_silvestre', 'sal_roca', 'raiz_amarga'],
    materials: ['hueso_viejo', 'seda_arana', 'mineral_hierro', 'esencia_sombra'],
    terrain: [{ id: 'sagrado', rooms: 0.3 }, { id: 'telarana', rooms: 0.2 }, { id: 'niebla', rooms: 0.2 }], cracks: 3, secrets: 0.5, sealedStairs: 0.25,
    traps: { ids: ['teletransporte', 'alarma', 'sello', 'pinchos'], density: 0.5 },
    locks: { chance: 0.35, max: 2 },
    goals: { chance: 0.3, kinds: ['palanca', 'braseros', 'colores', 'cajas'] },
    items: [...COMMON_ITEMS, { id: 'frasco_fuego', weight: 2 }, { id: 'mapa_vidente', weight: 2 }],
  },
  cripta_santuario: {
    id: 'cripta_santuario', name: 'Cripta del Santuario', desc: 'Bajo las ruinas, salas enormes llenas de telarañas. Algo teje en su fondo.',
    difficulty: 3, floors: 2, levels: [7, 8], music: 'hondonada',
    theme: { floor: '#332a36', floorAlt: '#3b3140', wall: '#140f17', wallFace: '#241b28', wallTop: '#4f3f5a' },
    monsters: [{ id: 'arana', weight: 9 }, { id: 'esqueleto', weight: 5 }, { id: 'espectro', weight: 5 }],
    ingredients: ['huevo_arana', 'sal_roca'],
    materials: ['seda_arana', 'seda_arana', 'hueso_viejo', 'esencia_sombra'],
    terrain: [{ id: 'telarana', rooms: 0.45 }, { id: 'sagrado', rooms: 0.2 }, { id: 'niebla', rooms: 0.25 }], cracks: 2, secrets: 0.4,
    traps: { ids: ['teletransporte', 'sello', 'veneno', 'pinchos'], density: 0.5 },
    layouts: [{ id: 'salones', weight: 2 }, { id: 'clasico', weight: 1 }],
    goals: { chance: 0.4, kinds: ['braseros', 'alfa', 'faros'] },
    items: [...COMMON_ITEMS, { id: 'frasco_fuego', weight: 2 }],
    boss: { monster: 'matriarca', level: 9 },
  },
  hondonada_frontera: {
    id: 'hondonada_frontera', name: 'Hondonada de la Frontera', desc: 'La grieta que arrasó tu aldea. Su núcleo late en el fondo.',
    difficulty: 4, floors: 2, levels: [7, 8], music: 'hondonada', next: 'entranas_hondonada',
    theme: { floor: '#2a1a24', floorAlt: '#33202c', wall: '#100810', wallFace: '#22121c', wallTop: '#5a2a3a' },
    monsters: [{ id: 'esqueleto', weight: 7 }, { id: 'esqueleto_arquero', weight: 5 }, { id: 'espectro', weight: 4 }, { id: 'fuego_fatuo', weight: 3, minFloor: 2 }],
    ingredients: ['sal_roca', 'raiz_amarga'],
    materials: ['mineral_hierro', 'mineral_hierro', 'esencia_sombra', 'hueso_viejo'],
    terrain: [{ id: 'ceniza', rooms: 0.3 }, { id: 'brasas', rooms: 0.2 }], cracks: 2, secrets: 0.4,
    traps: { ids: ['explosion', 'hoyo', 'alarma', 'debilidad', 'teletransporte'], density: 0.5 },
    locks: { chance: 0.3, max: 2 },
    goals: { chance: 0.3, kinds: ['llave', 'caza', 'escolta'] },
    items: [...COMMON_ITEMS, { id: 'pocion_mayor', weight: 2 }, { id: 'frasco_fuego', weight: 2 }, { id: 'mapa_vidente', weight: 2 }],
  },
  entranas_hondonada: {
    id: 'entranas_hondonada', name: 'Entrañas de la Hondonada', desc: 'Túneles que laten como venas. El calor sube a cada paso.',
    difficulty: 4, floors: 2, levels: [9, 10], music: 'hondonada', next: 'nucleo_hondonada',
    theme: { floor: '#301a1e', floorAlt: '#3a2024', wall: '#12080a', wallFace: '#26100f', wallTop: '#6a2a2a' },
    monsters: [{ id: 'esqueleto', weight: 5 }, { id: 'esqueleto_arquero', weight: 5 }, { id: 'fuego_fatuo', weight: 6 }, { id: 'espectro', weight: 3 }, { id: 'gargola', weight: 2, minFloor: 2 }],
    ingredients: ['sal_roca'],
    materials: ['mineral_hierro', 'esencia_sombra', 'hueso_viejo', 'cristal_hondonada'],
    terrain: [{ id: 'brasas', rooms: 0.45 }, { id: 'ceniza', rooms: 0.3 }], cracks: 3, secrets: 0.5, sealedStairs: 0.2,
    traps: { ids: ['explosion', 'hoyo', 'alarma', 'debilidad', 'teletransporte'], density: 0.55 },
    locks: { chance: 0.3, max: 3 },
    layouts: [{ id: 'laberinto', weight: 2 }, { id: 'clasico', weight: 2 }],
    goals: { chance: 0.4, kinds: ['llave', 'caza', 'alfa', 'vigias', 'colores'] },
    items: [...COMMON_ITEMS, { id: 'lagrima_alba', weight: 1 }, { id: 'pocion_mayor', weight: 2 }, { id: 'frasco_fuego', weight: 2 }],
  },
  nucleo_hondonada: {
    id: 'nucleo_hondonada', name: 'Núcleo de la Hondonada', desc: 'Cavernas enormes alrededor del núcleo. Su latido hace temblar el suelo.',
    difficulty: 4, floors: 2, levels: [10, 11], music: 'hondonada',
    theme: { floor: '#2e1622', floorAlt: '#381a29', wall: '#10060c', wallFace: '#220e18', wallTop: '#7a2a40' },
    monsters: [{ id: 'esqueleto_arquero', weight: 5 }, { id: 'fuego_fatuo', weight: 5 }, { id: 'gargola', weight: 4 }, { id: 'espectro', weight: 4 }],
    ingredients: ['sal_roca', 'raiz_amarga'],
    materials: ['esencia_sombra', 'cristal_hondonada', 'cristal_hondonada'],
    terrain: [{ id: 'brasas', rooms: 0.4 }, { id: 'ceniza', rooms: 0.35 }], cracks: 2, secrets: 0.5,
    traps: { ids: ['explosion', 'alarma', 'debilidad', 'teletransporte'], density: 0.5 },
    layouts: [{ id: 'salones', weight: 2 }, { id: 'clasico', weight: 1 }],
    goals: { chance: 0.35, kinds: ['alfa', 'braseros', 'faros', 'cajas'] },
    items: [...COMMON_ITEMS, { id: 'lagrima_alba', weight: 1 }, { id: 'pocion_mayor', weight: 3 }, { id: 'frasco_fuego', weight: 2 }],
    boss: { monster: 'guardian', level: 12 },
  },
  paso_cuervo: {
    id: 'paso_cuervo', name: 'Paso del Cuervo', desc: 'Un desfiladero que nadie cruza desde hace años.',
    difficulty: 5, floors: 3, levels: [10, 12], music: 'dungeon', next: 'marjal_cuervo',
    theme: { floor: '#2c2c34', floorAlt: '#34343d', wall: '#101014', wallFace: '#1e1e25', wallTop: '#45454f' },
    monsters: [{ id: 'lobo', weight: 7 }, { id: 'gargola', weight: 5 }, { id: 'esqueleto_arquero', weight: 4 }, { id: 'murcielago', weight: 4 }],
    ingredients: ['sal_roca', 'hierba_silvestre'],
    materials: ['mineral_hierro', 'cuero_bestia', 'hueso_viejo'],
    terrain: [{ id: 'hielo', rooms: 0.45 }, { id: 'niebla', rooms: 0.15 }, { id: 'hierba', rooms: 0.15 }], cracks: 3, secrets: 0.6, sealedStairs: 0.25,
    traps: { ids: ['hoyo', 'pinchos', 'aturdidora', 'alarma'], density: 0.5 },
    layouts: [{ id: 'clasico', weight: 2 }, { id: 'salones', weight: 1 }],
    goals: { chance: 0.3, kinds: ['palanca', 'alfa', 'vigias', 'fragmentos'] },
    items: [...COMMON_ITEMS, { id: 'lagrima_alba', weight: 1 }, { id: 'pocion_mayor', weight: 2 }],
  },
  marjal_cuervo: {
    id: 'marjal_cuervo', name: 'Marjal del Cuervo', desc: 'Al bajar del paso, el deshielo forma un lago pantanoso que llega hasta Villa Niebla.',
    difficulty: 5, floors: 2, levels: [12, 13], music: 'dungeon',
    theme: { floor: '#23302f', floorAlt: '#2a3837', wall: '#0c1414', wallFace: '#172221', wallTop: '#3a5250' },
    monsters: [{ id: 'ahogado', weight: 7 }, { id: 'lobo', weight: 4 }, { id: 'slime', weight: 4 }, { id: 'murcielago', weight: 3 }],
    ingredients: ['pescado_cienaga', 'hierba_silvestre', 'raiz_amarga'],
    materials: ['hueso_viejo', 'cuero_bestia', 'esencia_sombra'],
    terrain: [{ id: 'agua', rooms: 0.6 }, { id: 'barro', rooms: 0.35 }, { id: 'corriente', rooms: 0.25 }, { id: 'hierba', rooms: 0.2 }], cracks: 2, secrets: 0.4,
    traps: { ids: ['veneno', 'hambre', 'pinchos', 'teletransporte'], density: 0.45 },
    layouts: [{ id: 'laberinto', weight: 1 }, { id: 'clasico', weight: 2 }],
    goals: { chance: 0.35, kinds: ['caza', 'braseros', 'llave', 'escolta', 'cajas'] },
    items: [...COMMON_ITEMS, { id: 'lagrima_alba', weight: 1 }, { id: 'pocion_mayor', weight: 2 }],
  },
  cienaga_niebla: {
    id: 'cienaga_niebla', name: 'Ciénaga de la Niebla', desc: 'Una ciénaga donde la niebla nunca se levanta. Algo enorme respira en ella.',
    difficulty: 6, floors: 3, levels: [12, 13], music: 'hondonada', next: 'corazon_niebla',
    theme: { floor: '#1f2e2c', floorAlt: '#253634', wall: '#0b1413', wallFace: '#16221f', wallTop: '#2f4a45' },
    monsters: [{ id: 'ahogado', weight: 8 }, { id: 'slime', weight: 4 }, { id: 'hongo', weight: 5 }, { id: 'espectro', weight: 4 }, { id: 'fuego_fatuo', weight: 3 }],
    ingredients: ['raiz_amarga', 'hierba_silvestre', 'seta'],
    materials: ['hueso_viejo', 'esencia_sombra', 'seda_arana', 'cristal_hondonada'],
    terrain: [{ id: 'agua', rooms: 0.6 }, { id: 'niebla', rooms: 0.4 }, { id: 'barro', rooms: 0.35 }, { id: 'hierba', rooms: 0.25 }, { id: 'corriente', rooms: 0.2 }], secrets: 0.3,
    traps: { ids: ['veneno', 'hambre', 'teletransporte', 'sello'], density: 0.55 },
    locks: { chance: 0.25, max: 2 },
    goals: { chance: 0.35, kinds: ['braseros', 'caza', 'llave', 'faros', 'fragmentos'] },
    items: [...COMMON_ITEMS, { id: 'lagrima_alba', weight: 1 }, { id: 'pocion_mayor', weight: 3 }, { id: 'frasco_fuego', weight: 2 }],
  },
  corazon_niebla: {
    id: 'corazon_niebla', name: 'Corazón de la Niebla', desc: 'Donde nace la niebla. Pasillos de juncos que se cruzan una y otra vez, y algo enorme que respira.',
    difficulty: 6, floors: 3, levels: [14, 15], music: 'hondonada',
    theme: { floor: '#1b2a2e', floorAlt: '#203236', wall: '#091214', wallFace: '#131f22', wallTop: '#2a4650' },
    monsters: [{ id: 'ahogado', weight: 7 }, { id: 'espectro', weight: 5 }, { id: 'fuego_fatuo', weight: 4 }, { id: 'hongo', weight: 4 }],
    ingredients: ['pescado_cienaga', 'seta'],
    materials: ['esencia_sombra', 'cristal_hondonada', 'hueso_viejo'],
    terrain: [{ id: 'niebla', rooms: 0.5 }, { id: 'agua', rooms: 0.5 }, { id: 'barro', rooms: 0.3 }, { id: 'corriente', rooms: 0.2 }], secrets: 0.3, cracks: 1,
    traps: { ids: ['veneno', 'hambre', 'teletransporte', 'sello'], density: 0.5 },
    layouts: [{ id: 'laberinto', weight: 2 }, { id: 'clasico', weight: 1 }, { id: 'salones', weight: 1 }],
    goals: { chance: 0.4, kinds: ['braseros', 'alfa', 'palanca', 'vigias', 'colores'] },
    items: [...COMMON_ITEMS, { id: 'lagrima_alba', weight: 1 }, { id: 'pocion_mayor', weight: 3 }, { id: 'frasco_fuego', weight: 2 }],
    boss: { monster: 'bestia_niebla', level: 16 },
  },
  // ---------- Humanos corruptos ----------
  templo_sectario: {
    id: 'templo_sectario', name: 'Catacumbas del Hueso', desc: 'Bajo el pantano, la Hermandad del Hueso reza a los esqueletos... y les entrega a los que rapta.',
    difficulty: 5, floors: 4, levels: [11, 13], music: 'hondonada',
    theme: { floor: '#2a2a26', floorAlt: '#32322c', wall: '#100f0c', wallFace: '#1e1d18', wallTop: '#8a8470' },
    monsters: [{ id: 'sectario', weight: 8 }, { id: 'inquisidor', weight: 5 }, { id: 'bandido', weight: 3 }, { id: 'esqueleto', weight: 3, minFloor: 2 }],
    ingredients: ['hierba_silvestre', 'sal_roca'],
    materials: ['mineral_hierro', 'hueso_viejo', 'cristal_hondonada'],
    terrain: [{ id: 'sagrado', rooms: 0.35 }, { id: 'niebla', rooms: 0.15 }], cracks: 2, secrets: 0.5,
    traps: { ids: ['alarma', 'sello', 'pinchos', 'aturdidora'], density: 0.5 },
    locks: { chance: 0.35, max: 2 },
    goals: { chance: 0.35, kinds: ['escolta', 'colores', 'vigias'] },
    items: [...COMMON_ITEMS, { id: 'pocion_mayor', weight: 2 }, { id: 'frasco_fuego', weight: 2 }],
    boss: { monster: 'sumo_sacerdote', level: 10 },
  },
  // ---------- Acto 2: demonios y ángeles ----------
  llanura_plumas: {
    id: 'llanura_plumas', name: 'Llanura de las Plumas', desc: 'Al norte de Villa Niebla, una llanura cubierta de plumas blancas y ceniza. Ángeles y demonios se despedazan sobre una grieta nueva.',
    difficulty: 6, floors: 3, levels: [14, 15], music: 'hondonada', next: 'crater_ceniza',
    theme: { floor: '#3a3a42', floorAlt: '#44444d', wall: '#16161c', wallFace: '#26262e', wallTop: '#8a8aa0' },
    monsters: [{ id: 'querubin', weight: 6 }, { id: 'angel_guardian', weight: 5 }, { id: 'diablillo', weight: 4 }, { id: 'demonio', weight: 2 }],
    ingredients: ['hierba_silvestre', 'sal_roca'],
    materials: ['mineral_hierro', 'esencia_sombra', 'cristal_hondonada'],
    terrain: [{ id: 'sagrado', rooms: 0.4 }, { id: 'hierba', rooms: 0.3 }, { id: 'niebla', rooms: 0.15 }], cracks: 2, secrets: 0.4,
    traps: { ids: ['pinchos', 'aturdidora', 'sello', 'alarma'], density: 0.45 },
    layouts: [{ id: 'salones', weight: 2 }, { id: 'clasico', weight: 1 }],
    goals: { chance: 0.35, kinds: ['faros', 'escolta', 'alfa', 'colores'] },
    items: [...COMMON_ITEMS, { id: 'lagrima_alba', weight: 1 }, { id: 'pocion_mayor', weight: 3 }],
  },
  crater_ceniza: {
    id: 'crater_ceniza', name: 'Cráter de Ceniza', desc: 'Donde cayó el primer demonio. La tierra arde y la ceniza no deja de caer. Algo grande manda aquí.',
    difficulty: 6, floors: 3, levels: [15, 17], music: 'hondonada',
    theme: { floor: '#2e1a18', floorAlt: '#382020', wall: '#120808', wallFace: '#221010', wallTop: '#7a2a1a' },
    monsters: [{ id: 'diablillo', weight: 6 }, { id: 'demonio', weight: 5 }, { id: 'querubin', weight: 2 }, { id: 'angel_guardian', weight: 3 }],
    ingredients: ['sal_roca'],
    materials: ['esencia_sombra', 'esencia_sombra', 'cristal_hondonada', 'mineral_hierro'],
    terrain: [{ id: 'brasas', rooms: 0.45 }, { id: 'ceniza', rooms: 0.35 }], cracks: 2, secrets: 0.4, sealedStairs: 0.2,
    traps: { ids: ['explosion', 'debilidad', 'hoyo', 'alarma'], density: 0.5 },
    layouts: [{ id: 'laberinto', weight: 1 }, { id: 'clasico', weight: 2 }],
    goals: { chance: 0.35, kinds: ['vigias', 'caza', 'braseros', 'fragmentos'] },
    items: [...COMMON_ITEMS, { id: 'lagrima_alba', weight: 1 }, { id: 'pocion_mayor', weight: 3 }, { id: 'frasco_fuego', weight: 2 }],
    boss: { monster: 'varkhul', level: 18 },
  },
  // ---------- Torre de Babel: mazmorras de prueba, sin historia ----------
  babel_infinita: {
    id: 'babel_infinita', name: 'Babel · Pisos sin fin', desc: 'Una escalera que no termina. De todo: trampas, candados y cualquier monstruo.',
    difficulty: 3, floors: 999, levels: [1, 1], music: 'hondonada', infinite: true, practice: true, scaling: 'party', monsterPool: 'all',
    theme: { floor: '#2e2a22', floorAlt: '#363126', wall: '#120f0a', wallFace: '#231d15', wallTop: '#7a6a42' },
    monsters: [], ingredients: ['seta', 'carne_lobo', 'gel_limo', 'huevo_arana', 'pescado_cienaga', 'hierba_silvestre', 'raiz_amarga', 'sal_roca'],
    traps: { ids: ['pinchos', 'veneno', 'aturdidora', 'teletransporte', 'hambre', 'alarma', 'hoyo', 'sello', 'explosion', 'debilidad'], density: 0.45 },
    locks: { chance: 0.3, max: 3 },
    terrain: [{ id: 'hierba', rooms: 0.2 }, { id: 'agua', rooms: 0.2 }, { id: 'brasas', rooms: 0.15 }, { id: 'sagrado', rooms: 0.1 }, { id: 'barro', rooms: 0.1 }, { id: 'hielo', rooms: 0.1 }, { id: 'niebla', rooms: 0.1 }, { id: 'telarana', rooms: 0.1 }], cracks: 2, secrets: 0.4, sealedStairs: 0.15,
    materials: ['mineral_hierro', 'cuero_bestia', 'hueso_viejo', 'seda_arana', 'esencia_sombra'],
    items: [...COMMON_ITEMS, { id: 'lagrima_alba', weight: 1 }, { id: 'pocion_mayor', weight: 3 }, { id: 'frasco_fuego', weight: 2 }, { id: 'mapa_vidente', weight: 2 }, { id: 'racion', weight: 2 }, { id: 'bomba', weight: 2 }],
  },
  babel_trampas: {
    id: 'babel_trampas', name: 'Babel · Galería de trampas', desc: 'Pisos sembrados de trampas de todo tipo. Para probar cuáles hacen gracia y cuáles no.',
    difficulty: 3, floors: 999, levels: [1, 1], music: 'dungeon', infinite: true, practice: true, scaling: 'party', monsterPool: 'all',
    theme: { floor: '#2a2230', floorAlt: '#31283a', wall: '#100c14', wallFace: '#1f1828', wallTop: '#5a3a6a' },
    monsters: [], ingredients: ['seta', 'carne_lobo', 'gel_limo', 'huevo_arana', 'pescado_cienaga', 'hierba_silvestre', 'raiz_amarga', 'sal_roca'],
    traps: { ids: ['pinchos', 'veneno', 'aturdidora', 'teletransporte', 'hambre', 'alarma', 'hoyo', 'sello', 'explosion', 'debilidad'], density: 1.4 },
    items: [...COMMON_ITEMS, { id: 'lagrima_alba', weight: 1 }, { id: 'pocion_mayor', weight: 2 }],
  },
  babel_llaves: {
    id: 'babel_llaves', name: 'Babel · Laberinto de candados', desc: 'Cada piso tiene salas cerradas con candados de colores. La llave de una puerta está detrás de otra.',
    difficulty: 3, floors: 999, levels: [1, 1], music: 'dungeon', infinite: true, practice: true, scaling: 'party', monsterPool: 'all',
    theme: { floor: '#22282e', floorAlt: '#283038', wall: '#0c1014', wallFace: '#182028', wallTop: '#3a5a6a' },
    monsters: [], ingredients: ['seta', 'carne_lobo', 'gel_limo', 'huevo_arana', 'pescado_cienaga', 'hierba_silvestre', 'raiz_amarga', 'sal_roca'],
    locks: { chance: 1, max: 5 },
    traps: { ids: ['pinchos', 'teletransporte'], density: 0.2 },
    items: COMMON_ITEMS,
  },
  babel_elementos: {
    id: 'babel_elementos', name: 'Babel · Pisos elementales', desc: 'Cada piso pertenece a un elemento: todos sus monstruos son de él. Prepara al equipo y la afinidad de Aren.',
    difficulty: 3, floors: 999, levels: [1, 1], music: 'hondonada', infinite: true, practice: true, scaling: 'party', monsterPool: 'all', elementFloors: true,
    theme: { floor: '#2c2226', floorAlt: '#34282d', wall: '#120c0e', wallFace: '#22181c', wallTop: '#6a3a4a' },
    monsters: [], ingredients: ['seta', 'carne_lobo', 'gel_limo', 'huevo_arana', 'pescado_cienaga', 'hierba_silvestre', 'raiz_amarga', 'sal_roca'],
    traps: { ids: ['pinchos', 'veneno', 'debilidad'], density: 0.3 },
    items: [...COMMON_ITEMS, { id: 'lagrima_alba', weight: 1 }, { id: 'pocion_mayor', weight: 2 }],
  },
  // ---------- Campo de entrenamiento: pisos fijos con carteles (data/tutorial.ts) ----------
  tutorial: {
    id: 'tutorial', name: 'Campo de entrenamiento', desc: 'Una mazmorra fija, sin azar, que enseña las mecánicas del juego paso a paso. No se gana ni se pierde nada.',
    difficulty: 1, floors: 4, levels: [1, 2], music: 'dungeon', practice: true, fixed: true,
    theme: { floor: '#2e3238', floorAlt: '#363b42', wall: '#12141a', wallFace: '#20242c', wallTop: '#5a6a7a' },
    monsters: [{ id: 'slime', weight: 1 }], ingredients: [], items: COMMON_ITEMS,
  },
  // ---------- Prueba de prestigio: se entra solo desde el gremio ----------
  prueba_prestigio: {
    id: 'prueba_prestigio', name: 'Senda del Prestigio', desc: 'Una grieta que el gremio custodia. Solo se baja de uno en uno, y al fondo espera tu propio eco.',
    difficulty: 4, floors: 4, levels: [1, 1], music: 'hondonada', scaling: 'party', monsterPool: 'all', solo: true,
    theme: { floor: '#2a2436', floorAlt: '#322a40', wall: '#100c16', wallFace: '#1e1828', wallTop: '#6a5a9a' },
    monsters: [], ingredients: ['seta', 'sal_roca'],
    terrain: [{ id: 'sagrado', rooms: 0.25 }, { id: 'niebla', rooms: 0.15 }],
    traps: { ids: ['pinchos', 'veneno'], density: 0.25 },
    layouts: [{ id: 'pequeno', weight: 2 }, { id: 'clasico', weight: 1 }],
    items: [...COMMON_ITEMS, { id: 'pocion_mayor', weight: 3 }],
    boss: { monster: 'eco', level: 1 },
  },
  babel_condiciones: {
    id: 'babel_condiciones', name: 'Babel · Condiciones y formas', desc: 'Todos los pisos piden algo para abrir las escaleras (palanca, llave, cacería, braseros, alfa, escolta, faros, fragmentos, orden de colores, cajas) o tienen gólems vigía, y cambian de forma: pocas salas, laberintos o salas gigantes.',
    difficulty: 3, floors: 999, levels: [1, 1], music: 'dungeon', infinite: true, practice: true, scaling: 'party', monsterPool: 'all',
    theme: { floor: '#2c2a22', floorAlt: '#343128', wall: '#12100a', wallFace: '#221e16', wallTop: '#6a5a3a' },
    monsters: [], ingredients: ['seta', 'carne_lobo', 'gel_limo', 'huevo_arana', 'pescado_cienaga', 'hierba_silvestre', 'raiz_amarga', 'sal_roca'],
    traps: { ids: ['pinchos', 'veneno', 'aturdidora', 'teletransporte'], density: 0.3 },
    terrain: [{ id: 'hierba', rooms: 0.2 }, { id: 'agua', rooms: 0.15 }, { id: 'niebla', rooms: 0.1 }],
    layouts: [{ id: 'pequeno', weight: 1 }, { id: 'clasico', weight: 1 }, { id: 'laberinto', weight: 1 }, { id: 'salones', weight: 1 }],
    goals: { chance: 1, kinds: ['palanca', 'llave', 'caza', 'braseros', 'alfa', 'escolta', 'faros', 'fragmentos', 'colores', 'cajas', 'vigias'] },
    items: [...COMMON_ITEMS, { id: 'pocion_mayor', weight: 2 }],
  },
  babel_travesia: {
    id: 'babel_travesia', name: 'Babel · Travesía', desc: 'Una incursión en tres tramos, como las rutas largas: bosque, montaña (con jefe) y volcán (con jefe). Tras cada jefe hay un campamento.',
    difficulty: 3, floors: 2, levels: [1, 1], music: 'dungeon', practice: true, scaling: 'party', monsterPool: 'all', next: 'babel_travesia_2',
    theme: { floor: '#24301f', floorAlt: '#2b3a25', wall: '#0c140a', wallFace: '#182414', wallTop: '#3f5530' },
    monsters: [], ingredients: ['seta', 'hierba_silvestre', 'raiz_amarga'],
    terrain: [{ id: 'hierba', rooms: 0.5 }, { id: 'raices', rooms: 0.3 }],
    traps: { ids: ['pinchos', 'veneno'], density: 0.3 },
    layouts: [{ id: 'pequeno', weight: 1 }, { id: 'clasico', weight: 1 }],
    goals: { chance: 0.5, kinds: ['palanca', 'caza', 'fragmentos', 'escolta'] },
    items: COMMON_ITEMS,
  },
  babel_travesia_2: {
    id: 'babel_travesia_2', name: 'Babel · Travesía: montaña', desc: 'Segundo tramo de la travesía.',
    difficulty: 3, floors: 2, levels: [1, 1], music: 'dungeon', practice: true, scaling: 'party', monsterPool: 'all', next: 'babel_travesia_3',
    theme: { floor: '#2c2c34', floorAlt: '#34343d', wall: '#101014', wallFace: '#1e1e25', wallTop: '#45454f' },
    monsters: [], ingredients: ['sal_roca', 'hierba_silvestre'],
    terrain: [{ id: 'hielo', rooms: 0.3 }, { id: 'niebla', rooms: 0.15 }],
    traps: { ids: ['pinchos', 'aturdidora'], density: 0.35 },
    layouts: [{ id: 'laberinto', weight: 1 }, { id: 'clasico', weight: 1 }],
    goals: { chance: 0.5, kinds: ['llave', 'alfa', 'vigias', 'cajas'] },
    items: [...COMMON_ITEMS, { id: 'pocion_mayor', weight: 2 }],
    boss: { monster: 'matriarca', level: 1 },
  },
  babel_travesia_3: {
    id: 'babel_travesia_3', name: 'Babel · Travesía: volcán', desc: 'Último tramo de la travesía.',
    difficulty: 3, floors: 2, levels: [1, 1], music: 'hondonada', practice: true, scaling: 'party', monsterPool: 'all',
    theme: { floor: '#301a1e', floorAlt: '#3a2024', wall: '#12080a', wallFace: '#26100f', wallTop: '#6a2a2a' },
    monsters: [], ingredients: ['sal_roca'],
    terrain: [{ id: 'brasas', rooms: 0.4 }, { id: 'ceniza', rooms: 0.25 }],
    traps: { ids: ['explosion', 'pinchos', 'debilidad'], density: 0.4 },
    layouts: [{ id: 'salones', weight: 1 }, { id: 'clasico', weight: 1 }],
    goals: { chance: 0.5, kinds: ['braseros', 'caza', 'faros', 'colores'] },
    items: [...COMMON_ITEMS, { id: 'pocion_mayor', weight: 2 }],
    boss: { monster: 'guardian', level: 1 },
  },
  babel_terrenos: {
    id: 'babel_terrenos', name: 'Babel · Terrenos y muros', desc: 'Todos los tipos de suelo (hierba, agua, brasas, suelo sagrado, barro, hielo, telarañas, niebla, ceniza, corrientes y raíces), paredes agrietadas, escaleras tapiadas y salas secretas tras murallas. Trae bombas.',
    difficulty: 3, floors: 999, levels: [1, 1], music: 'dungeon', infinite: true, practice: true, scaling: 'party', monsterPool: 'all',
    theme: { floor: '#2a2c24', floorAlt: '#31342a', wall: '#10120c', wallFace: '#1e2218', wallTop: '#4a5a3a' },
    monsters: [], ingredients: ['seta', 'carne_lobo', 'gel_limo', 'huevo_arana', 'pescado_cienaga', 'hierba_silvestre', 'raiz_amarga', 'sal_roca'],
    materials: ['mineral_hierro', 'cuero_bestia', 'hueso_viejo', 'seda_arana', 'esencia_sombra'],
    terrain: [
      { id: 'hierba', rooms: 0.3 }, { id: 'agua', rooms: 0.3 }, { id: 'brasas', rooms: 0.2 }, { id: 'sagrado', rooms: 0.2 }, { id: 'barro', rooms: 0.25 }, { id: 'hielo', rooms: 0.3 },
      { id: 'telarana', rooms: 0.25 }, { id: 'niebla', rooms: 0.2 }, { id: 'ceniza', rooms: 0.2 }, { id: 'corriente', rooms: 0.25 }, { id: 'raices', rooms: 0.25 },
    ],
    cracks: 4, secrets: 1, sealedStairs: 0.35,
    traps: { ids: ['pinchos', 'veneno', 'teletransporte'], density: 0.2 },
    items: [...COMMON_ITEMS, { id: 'lagrima_alba', weight: 1 }, { id: 'pocion_mayor', weight: 2 }, { id: 'bomba', weight: 4 }],
  },
};

/** Todos los tramos de una incursión, empezando por la mazmorra de entrada. */
export function dungeonChain(id: string): DungeonDef[] {
  const out: DungeonDef[] = [];
  for (let d: DungeonDef | undefined = DUNGEONS[id]; d && !out.includes(d); d = d.next ? DUNGEONS[d.next] : undefined) out.push(d);
  return out;
}

/** Formas de piso según la dificultad: las primeras mazmorras tienen pocas salas; más adelante salen laberintos y salas gigantes. */
export function layoutsFor(d: DungeonDef): { id: LayoutId; weight: number }[] {
  if (d.layouts) return d.layouts;
  if (d.difficulty <= 1) return [{ id: 'pequeno', weight: 1 }];
  if (d.difficulty === 2) return [{ id: 'pequeno', weight: 1 }, { id: 'clasico', weight: 2 }];
  if (d.difficulty === 3) return [{ id: 'clasico', weight: 3 }, { id: 'laberinto', weight: 1 }, { id: 'salones', weight: 1 }];
  return [{ id: 'clasico', weight: 2 }, { id: 'laberinto', weight: 2 }, { id: 'salones', weight: 1 }];
}

// ---------------------------------------------------------------- Actos 2 (resto) a 8

/** Lo que comparten las mazmorras de una región: aspecto, monstruos, suelos, trampas y condiciones. */
interface RegionKit {
  theme: DungeonTheme;
  music: DungeonDef['music'];
  monsters: DungeonDef['monsters'];
  ingredients: string[];
  materials: string[];
  terrain: NonNullable<DungeonDef['terrain']>;
  traps: NonNullable<DungeonDef['traps']>;
  goals: GoalKind[];
  elements?: Element[];
  items: DungeonDef['items'];
}

const LATE_ITEMS = [...COMMON_ITEMS, { id: 'pocion_mayor', weight: 4 }, { id: 'pocion_suprema', weight: 2 }, { id: 'elixir_mayor', weight: 1 }, { id: 'lagrima_alba', weight: 1 }, { id: 'frasco_fuego', weight: 2 }, { id: 'bomba', weight: 1 }];

const KITS: Record<string, RegionKit> = {
  lago: {
    theme: { floor: '#1e2e36', floorAlt: '#24363f', wall: '#0a1418', wallFace: '#14222a', wallTop: '#3a6a7a' }, music: 'dungeon',
    monsters: [{ id: 'ahogado', weight: 6 }, { id: 'slime', weight: 4 }, { id: 'lobo', weight: 4 }, { id: 'arana', weight: 3 }, { id: 'serpiente', weight: 2, minFloor: 2 }],
    ingredients: ['pescado_cienaga', 'hierba_silvestre', 'raiz_amarga'], materials: ['seda_arana', 'cuero_bestia', 'hueso_viejo'],
    terrain: [{ id: 'agua', rooms: 0.5 }, { id: 'hierba', rooms: 0.35 }, { id: 'corriente', rooms: 0.2 }, { id: 'raices', rooms: 0.2 }],
    traps: { ids: ['veneno', 'hambre', 'teletransporte', 'aturdidora'], density: 0.5 }, goals: ['braseros', 'caza', 'escolta', 'faros'],
    elements: ['agua', 'viento'], items: LATE_ITEMS,
  },
  arena: {
    theme: { floor: '#4a3a24', floorAlt: '#54422a', wall: '#1e140a', wallFace: '#2e2212', wallTop: '#b08a50' }, music: 'dungeon',
    monsters: [{ id: 'escorpion', weight: 7 }, { id: 'esqueleto', weight: 5 }, { id: 'esqueleto_arquero', weight: 4 }, { id: 'murcielago', weight: 3 }, { id: 'sectario', weight: 2, minFloor: 2 }],
    ingredients: ['sal_roca', 'raiz_amarga'], materials: ['hueso_viejo', 'hueso_viejo', 'mineral_hierro', 'cuero_bestia'],
    terrain: [{ id: 'ceniza', rooms: 0.35 }, { id: 'brasas', rooms: 0.25 }, { id: 'barro', rooms: 0.15 }],
    traps: { ids: ['pinchos', 'veneno', 'hoyo', 'hambre'], density: 0.5 }, goals: ['fragmentos', 'llave', 'cajas', 'alfa', 'caza'],
    elements: ['tierra', 'fuego'], items: LATE_ITEMS,
  },
  cumbres: {
    theme: { floor: '#3a4656', floorAlt: '#425062', wall: '#141a24', wallFace: '#222c3a', wallTop: '#c8d8e8' }, music: 'dungeon',
    monsters: [{ id: 'lobo', weight: 6 }, { id: 'gargola', weight: 4 }, { id: 'demonio', weight: 4 }, { id: 'diablillo', weight: 4 }, { id: 'espectro', weight: 3 }],
    ingredients: ['carne_lobo', 'raiz_amarga', 'sal_roca'], materials: ['cuero_bestia', 'mineral_hierro', 'esencia_sombra'],
    terrain: [{ id: 'hielo', rooms: 0.5 }, { id: 'niebla', rooms: 0.3 }, { id: 'agua', rooms: 0.15 }],
    traps: { ids: ['aturdidora', 'hoyo', 'debilidad', 'alarma'], density: 0.5 }, goals: ['vigias', 'braseros', 'faros', 'colores', 'alfa'],
    elements: ['agua', 'viento'], items: LATE_ITEMS,
  },
  maldita: {
    theme: { floor: '#2a2822', floorAlt: '#322f28', wall: '#0e0d0a', wallFace: '#1c1a14', wallTop: '#8a806a' }, music: 'hondonada',
    monsters: [{ id: 'esqueleto', weight: 6 }, { id: 'esqueleto_arquero', weight: 4 }, { id: 'espectro', weight: 4 }, { id: 'fuego_fatuo', weight: 3 }, { id: 'sectario', weight: 3 }, { id: 'demonio', weight: 2, minFloor: 2 }],
    ingredients: ['raiz_amarga', 'seta'], materials: ['hueso_viejo', 'hueso_viejo', 'esencia_sombra', 'cristal_hondonada'],
    terrain: [{ id: 'ceniza', rooms: 0.4 }, { id: 'niebla', rooms: 0.3 }, { id: 'telarana', rooms: 0.2 }],
    traps: { ids: ['sello', 'debilidad', 'veneno', 'alarma', 'explosion'], density: 0.55 }, goals: ['escolta', 'fragmentos', 'caza', 'colores', 'vigias'],
    elements: ['sombra', 'tierra'], items: LATE_ITEMS,
  },
  legion: {
    theme: { floor: '#2e2224', floorAlt: '#382a2c', wall: '#100a0a', wallFace: '#201416', wallTop: '#7a3a2a' }, music: 'hondonada',
    monsters: [{ id: 'demonio', weight: 5 }, { id: 'diablillo', weight: 5 }, { id: 'esqueleto', weight: 4 }, { id: 'esqueleto_arquero', weight: 4 }, { id: 'gargola', weight: 3 }, { id: 'sectario', weight: 2 }],
    ingredients: ['sal_roca', 'hierba_silvestre'], materials: ['esencia_sombra', 'hueso_viejo', 'mineral_hierro', 'cristal_hondonada'],
    terrain: [{ id: 'brasas', rooms: 0.35 }, { id: 'ceniza', rooms: 0.3 }],
    traps: { ids: ['explosion', 'alarma', 'pinchos', 'sello'], density: 0.5 }, goals: ['escolta', 'caza', 'alfa', 'braseros'],
    items: LATE_ITEMS,
  },
  coral: {
    theme: { floor: '#1a2e3e', floorAlt: '#20364a', wall: '#08121a', wallFace: '#102030', wallTop: '#d86a5a' }, music: 'dungeon',
    monsters: [{ id: 'serpiente', weight: 7 }, { id: 'ahogado', weight: 5 }, { id: 'slime', weight: 3 }, { id: 'demonio', weight: 3, minFloor: 2 }, { id: 'murcielago', weight: 2 }],
    ingredients: ['pescado_cienaga', 'sal_roca', 'gel_limo'], materials: ['seda_arana', 'esencia_sombra', 'mineral_hierro', 'cristal_hondonada'],
    terrain: [{ id: 'agua', rooms: 0.55 }, { id: 'corriente', rooms: 0.35 }, { id: 'barro', rooms: 0.15 }],
    traps: { ids: ['teletransporte', 'hambre', 'aturdidora', 'hoyo'], density: 0.5 }, goals: ['faros', 'cajas', 'llave', 'escolta', 'fragmentos'],
    elements: ['agua', 'viento'], items: LATE_ITEMS,
  },
  inframundo: {
    theme: { floor: '#3a1410', floorAlt: '#441a14', wall: '#140404', wallFace: '#280a08', wallTop: '#e8501a' }, music: 'hondonada',
    monsters: [{ id: 'demonio', weight: 7 }, { id: 'diablillo', weight: 6 }, { id: 'fuego_fatuo', weight: 4 }, { id: 'esqueleto', weight: 3 }, { id: 'espectro', weight: 3 }],
    ingredients: ['sal_roca'], materials: ['esencia_sombra', 'esencia_sombra', 'cristal_hondonada', 'mineral_hierro'],
    terrain: [{ id: 'brasas', rooms: 0.55 }, { id: 'ceniza', rooms: 0.4 }],
    traps: { ids: ['explosion', 'debilidad', 'sello', 'hoyo', 'alarma'], density: 0.55 }, goals: ['braseros', 'vigias', 'caza', 'alfa', 'colores'],
    elements: ['fuego', 'sombra'], items: LATE_ITEMS,
  },
  cielo: {
    theme: { floor: '#c8c0a8', floorAlt: '#d4ccb4', wall: '#5a5448', wallFace: '#8a8270', wallTop: '#fff0c0', sky: true }, music: 'hondonada',
    monsters: [{ id: 'angel_guardian', weight: 6 }, { id: 'querubin', weight: 5 }, { id: 'arcangel', weight: 4 }, { id: 'inquisidor', weight: 2 }],
    ingredients: ['hierba_silvestre', 'raiz_amarga'], materials: ['cristal_hondonada', 'mineral_hierro', 'seda_arana'],
    terrain: [{ id: 'sagrado', rooms: 0.5 }, { id: 'niebla', rooms: 0.3 }, { id: 'hierba', rooms: 0.2 }],
    traps: { ids: ['sello', 'aturdidora', 'teletransporte', 'debilidad'], density: 0.5 }, goals: ['colores', 'faros', 'vigias', 'cajas', 'fragmentos'],
    elements: ['luz', 'viento'], items: LATE_ITEMS,
  },
};

interface ActOpts {
  difficulty: number;
  floors: number;
  levels: [number, number];
  next?: string;
  boss?: { monster: string; level: number };
  bossName?: string;
  bossEscort?: string[];
  bossEscortPower?: DungeonDef['bossEscortPower'];
  bossScene?: string;
  layouts?: DungeonDef['layouts'];
  /** Suma monstruos al kit de la región. */
  extra?: DungeonDef['monsters'];
  /** Terrenos propios (si no, los de la región). */
  terrain?: DungeonDef['terrain'];
  theme?: Partial<DungeonTheme>;
  elements?: Element[];
  goals?: number;
}

function actD(id: string, name: string, desc: string, kit: string, o: ActOpts): DungeonDef {
  const k = KITS[kit];
  return {
    id, name, desc, difficulty: o.difficulty, floors: o.floors, levels: o.levels, music: k.music, next: o.next,
    theme: { ...k.theme, ...o.theme },
    monsters: [...k.monsters, ...(o.extra ?? [])],
    ingredients: k.ingredients, materials: k.materials, terrain: o.terrain ?? k.terrain, traps: k.traps,
    cracks: 2, secrets: 0.4, sealedStairs: 0.15, locks: { chance: 0.3, max: 2 },
    goals: { chance: o.goals ?? 0.4, kinds: k.goals },
    layouts: o.layouts, elements: o.elements ?? k.elements, items: k.items,
    boss: o.boss, bossName: o.bossName, bossEscort: o.bossEscort, bossEscortPower: o.bossEscortPower, bossScene: o.bossScene,
  };
}

const ACT_DUNGEONS: DungeonDef[] = [
  // ---------- Acto 2: hacia Aguaclara ----------
  actD('lago_juncos', 'Lago de los Juncos', 'El camino de Villa Niebla a Aguaclara: islas de juncos unidas por pasarelas podridas.', 'lago', { difficulty: 6, floors: 4, levels: [15, 16] }),
  actD('robledal', 'El Robledal', 'Un bosque de robles centenarios donde las raíces se mueven. Lleva a Juncal.', 'lago', { difficulty: 6, floors: 4, levels: [15, 17], extra: [{ id: 'hongo', weight: 4 }], layouts: [{ id: 'laberinto', weight: 2 }, { id: 'clasico', weight: 1 }] }),
  // ---------- Acto 3: el Mar de Arena ----------
  actD('dunas_errantes', 'Dunas Errantes', 'Dunas que cambian de sitio cada noche. Al sur del lago empieza el desierto.', 'arena', { difficulty: 7, floors: 3, levels: [15, 16], next: 'dunas_hondas', layouts: [{ id: 'salones', weight: 2 }, { id: 'clasico', weight: 1 }] }),
  actD('dunas_hondas', 'Dunas Hondas', 'Donde la arena se traga las caravanas. Al fondo, las palmeras rojas de Palmarroja.', 'arena', { difficulty: 7, floors: 3, levels: [16, 17] }),
  actD('pozos_envenenados', 'Pozos Envenenados', 'Los pozos viejos del oasis. Alguien ha envenenado el agua desde abajo.', 'arena', { difficulty: 7, floors: 4, levels: [16, 17], boss: { monster: 'reina_arenas', level: 18 }, theme: { wallTop: '#6a9a4a' }, extra: [{ id: 'slime', weight: 3 }] }),
  actD('canon_sal', 'Cañón de Sal', 'Un cañón blanco de sal. Los esqueletos de Seren vigilan desde lo alto.', 'arena', { difficulty: 7, floors: 4, levels: [17, 18], theme: { floor: '#5a5450', floorAlt: '#64605a', wallTop: '#e8e0d8' } }),
  actD('mina_enterrada', 'Mina Enterrada', 'La mina hundida de Cantera Seca. Algo vive ahora en sus túneles.', 'arena', { difficulty: 7, floors: 4, levels: [17, 19], extra: [{ id: 'gargola', weight: 4 }, { id: 'arana', weight: 3 }], layouts: [{ id: 'laberinto', weight: 2 }, { id: 'pequeno', weight: 1 }] }),
  actD('fortin_hueso', 'Fortín de Hueso', 'El cuartel general del ejército de los esqueletos, levantado con los huesos de sus caídos. Seren manda desde lo alto.', 'arena', { difficulty: 7, floors: 4, levels: [18, 19], boss: { monster: 'seren_capitana', level: 20 }, extra: [{ id: 'esqueleto', weight: 4 }], theme: { wallTop: '#d8ccb0' } }),
  // ---------- Acto 4: las Cumbres Blancas ----------
  actD('paso_helado', 'Paso Helado', 'El paso entre el desierto y las nieves. El calor se acaba de golpe.', 'cumbres', { difficulty: 8, floors: 3, levels: [18, 19], next: 'paso_alto' }),
  actD('paso_alto', 'Paso Alto', 'El tramo más alto del paso, sobre las nubes. Abajo, Pico Escarcha.', 'cumbres', { difficulty: 8, floors: 3, levels: [19, 20] }),
  actD('glaciar_azul', 'Glaciar Azul', 'Un río de hielo entre Pico Escarcha y Fuerte Albar. Cruje bajo los pies.', 'cumbres', { difficulty: 8, floors: 4, levels: [19, 20], layouts: [{ id: 'salones', weight: 2 }, { id: 'clasico', weight: 1 }] }),
  actD('bosque_blanco', 'Bosque Blanco', 'Pinos cubiertos de nieve hasta la copa. Los lobos blancos vigilan el camino al refugio.', 'cumbres', { difficulty: 8, floors: 4, levels: [19, 21], extra: [{ id: 'lobo', weight: 4 }] }),
  actD('bastion_morgath', 'Bastión de Morgath', 'La fortaleza del capitán de la Escarcha, tallada en hielo negro.', 'cumbres', { difficulty: 8, floors: 4, levels: [20, 21], boss: { monster: 'morgath', level: 22 }, theme: { wallTop: '#4a6a9a' } }),
  actD('cumbre_ixa', 'Cumbre de Ixa', 'La cima del glaciar, donde el viento corta. Ixa caza desde las alturas.', 'cumbres', { difficulty: 8, floors: 4, levels: [20, 21], boss: { monster: 'ixa', level: 22 }, extra: [{ id: 'murcielago', weight: 3 }] }),
  actD('gran_grieta', 'La Gran Grieta', 'La grieta de la que nacen todas las demás. El hielo brilla en rojo desde dentro.', 'cumbres', { difficulty: 9, floors: 3, levels: [21, 22], next: 'grieta_honda', extra: [{ id: 'fuego_fatuo', weight: 3 }] }),
  actD('grieta_honda', 'Grieta Honda', 'Más abajo, el hielo se vuelve cristal y la luz roja late como un corazón.', 'cumbres', { difficulty: 9, floors: 3, levels: [22, 22], next: 'nucleo_grieta', theme: { floor: '#3a2a3a', floorAlt: '#443244', wallTop: '#c04a6a' }, elements: ['sombra', 'agua'] }),
  actD('nucleo_grieta', 'Núcleo de la Gran Grieta', 'Un lago helado sobre una herida en el mundo. Algo mira desde el otro lado.', 'cumbres', { difficulty: 9, floors: 2, levels: [22, 22], boss: { monster: 'corazon_grieta', level: 24 }, theme: { floor: '#2a1a2e', floorAlt: '#341f38', wallTop: '#c070ff' }, elements: ['sombra'] }),
  // ---------- Acto 5: la Tierra Maldita ----------
  actD('yermo_ceniza', 'Yermo de Ceniza', 'Una llanura gris donde patrullan los cazadores de la Legión. Hay alguien escondido entre las rocas.', 'maldita', { difficulty: 8, floors: 4, levels: [20, 21], boss: { monster: 'capitan_legion', level: 22 }, bossName: 'Cazador de la Legión' }),
  actD('puertas_osario', 'Puertas de Osario', 'El camino de huesos que lleva a la ciudad de los esqueletos.', 'maldita', { difficulty: 8, floors: 4, levels: [21, 22] }),
  actD('escalera_huesos', 'Escalera de Huesos', 'Una escalera infinita de vértebras que sube de Osario a las cumbres. La Legión la vigila.', 'maldita', { difficulty: 8, floors: 4, levels: [21, 22], boss: { monster: 'rey_hueso', level: 23 }, bossName: 'Coloso de la Escalera', layouts: [{ id: 'pequeno', weight: 1 }, { id: 'clasico', weight: 2 }] }),
  // Ciudades tomadas (se liberan de vuelta, en orden)
  actD('albar_tomada', 'Fuerte Albar tomado', 'La Legión ha subido por la escalera de huesos y ocupa la fortaleza.', 'legion', { difficulty: 8, floors: 3, levels: [21, 22], boss: { monster: 'capitan_legion', level: 23 }, bossName: 'Capitán Hrok de la Legión', elements: ['agua', 'viento'], theme: { wallTop: '#c8d8e8' } }),
  actD('pico_tomada', 'Pico Escarcha tomado', 'Las cadenas del pueblo cuelgan rotas. Hay demonios en cada casa.', 'legion', { difficulty: 8, floors: 3, levels: [21, 22], boss: { monster: 'capitan_legion', level: 23 }, bossName: 'Capitana Vexa de la Legión', elements: ['agua', 'viento'], theme: { wallTop: '#a8b8c8' } }),
  actD('solmarena_tomada', 'Solmarena tomada', 'La ciudad dorada arde. Alguien sigue luchando en la muralla norte.', 'legion', { difficulty: 8, floors: 4, levels: [22, 23], boss: { monster: 'capitan_legion', level: 24 }, bossName: 'Capitán Dromm de la Legión', elements: ['tierra', 'fuego'], theme: { wallTop: '#d8b060' } }),
  actD('palmarroja_tomada', 'Palmarroja tomada', 'Las palmeras rojas son antorchas. La Legión bebe del oasis.', 'legion', { difficulty: 8, floors: 3, levels: [22, 23], boss: { monster: 'capitan_legion', level: 24 }, bossName: 'Capitana Sisk de la Legión', elements: ['tierra', 'fuego'], theme: { wallTop: '#b05a3a' } }),
  actD('aguaclara_tomada', 'Aguaclara tomada', 'Los puentes de la capital del lago, rotos. Ningún ángel bajó a defenderla.', 'legion', { difficulty: 8, floors: 4, levels: [22, 24], boss: { monster: 'capitan_legion', level: 25 }, bossName: 'Capitán Murn de la Legión', elements: ['agua', 'luz'], theme: { wallTop: '#3a6a7a' } }),
  actD('niebla_tomada', 'Villa Niebla tomada', 'Los pilotes arden sobre el agua. La niebla ha vuelto, y es roja.', 'legion', { difficulty: 8, floors: 3, levels: [23, 24], boss: { monster: 'capitan_legion', level: 25 }, bossName: 'Capitán Gorr de la Legión', elements: ['agua', 'sombra'], theme: { wallTop: '#2f4a45' } }),
  actD('rocaverde_tomada', 'Rocaverde tomada', 'La empalizada, derribada. Los lobos huyen de los demonios.', 'legion', { difficulty: 8, floors: 3, levels: [23, 24], boss: { monster: 'capitan_legion', level: 25 }, bossName: 'Capitana Ashra de la Legión', elements: ['viento', 'tierra'], theme: { wallTop: '#4a6a3a' } }),
  actD('bastion_tomado', 'Bastión Gris tomado', 'Las murallas que resistieron 300 años han caído. La Legión ocupa la sede de la Expedición.', 'legion', { difficulty: 9, floors: 4, levels: [23, 24], boss: { monster: 'capitan_legion', level: 26 }, bossName: 'General Kordath de la Legión', elements: ['sombra', 'fuego'], theme: { wallTop: '#7a7a8a' } }),
  // ---------- Acto 6: el Archipiélago Coral ----------
  actD('costa_rota', 'Costa Rota', 'Acantilados y cuevas marinas del Bastión hasta Puerto Coral.', 'coral', { difficulty: 9, floors: 3, levels: [22, 23], next: 'acantilados' }),
  actD('acantilados', 'Acantilados del Coral', 'Cuevas que la marea llena y vacía. Al otro lado, el puerto.', 'coral', { difficulty: 9, floors: 3, levels: [23, 24] }),
  actD('arrecife', 'Arrecife Rojo', 'Un laberinto de coral bajo el agua, lleno de serpientes. Lleva a Isla Gaviota.', 'coral', { difficulty: 9, floors: 4, levels: [23, 24], layouts: [{ id: 'laberinto', weight: 2 }, { id: 'clasico', weight: 1 }] }),
  actD('cayo_hueco', 'Cayo Hueco', 'Una isla vacía por dentro, llena de túneles. Huele a azufre.', 'coral', { difficulty: 9, floors: 4, levels: [24, 25], extra: [{ id: 'esqueleto', weight: 3 }, { id: 'diablillo', weight: 3 }] }),
  actD('bastion_negro', 'Bastión Negro', 'El fuerte de Garrick, en una isla de roca negra. El mar hierve a su alrededor.', 'legion', { difficulty: 9, floors: 3, levels: [24, 25], next: 'salas_negras', elements: ['tierra', 'sombra'], theme: { floor: '#1e1e24', floorAlt: '#26262e', wallTop: '#4a4a5a' } }),
  actD('salas_negras', 'Salas del Bastión Negro', 'Salas de guardia, celdas y una armería de la Legión.', 'legion', { difficulty: 9, floors: 3, levels: [25, 26], next: 'trono_garrick', elements: ['tierra', 'sombra'], theme: { floor: '#1e1e24', floorAlt: '#26262e', wallTop: '#4a4a5a' } }),
  actD('trono_garrick', 'Salón de Garrick', 'Garrick espera aquí, sin armadura humana. Vael está a su lado.', 'legion', { difficulty: 9, floors: 2, levels: [26, 26], boss: { monster: 'garrick_demonio', level: 28 }, elements: ['tierra'], theme: { floor: '#24181a', floorAlt: '#2c1e20', wallTop: '#8a2a2a' } }),
  // ---------- Acto 7: el Inframundo ----------
  actD('descenso', 'El Descenso', 'El pozo sin fondo bajo el Bastión Negro. Huele a azufre y se oyen gritos.', 'inframundo', { difficulty: 9, floors: 3, levels: [24, 25], next: 'pozo_azufre' }),
  actD('pozo_azufre', 'Pozo de Azufre', 'El fondo del pozo: una caverna de roca amarilla. Al otro lado, un campamento.', 'inframundo', { difficulty: 9, floors: 3, levels: [25, 26] }),
  actD('circulo_ceniza', 'Círculo de Ceniza', 'El primer círculo del Inframundo. Un perro de tres cabezas guarda el paso.', 'inframundo', { difficulty: 9, floors: 4, levels: [25, 27], boss: { monster: 'cancerbero', level: 28 } }),
  actD('rios_fuego', 'Ríos de Fuego', 'Ríos de lava que cruzan la llanura. Su reina los manda con la voz.', 'inframundo', { difficulty: 9, floors: 4, levels: [25, 27], boss: { monster: 'reina_rios', level: 28 }, layouts: [{ id: 'salones', weight: 2 }, { id: 'clasico', weight: 1 }] }),
  actD('ciudadela_dis', 'Ciudadela de Dis', 'La capital de los demonios. Murallas de hierro al rojo y calles de ceniza.', 'inframundo', { difficulty: 10, floors: 3, levels: [26, 27], next: 'calles_dis', extra: [{ id: 'gargola', weight: 3 }] }),
  actD('calles_dis', 'Calles de Dis', 'Las calles se cierran solas detrás de vosotros. Toda la ciudad os mira.', 'inframundo', { difficulty: 10, floors: 3, levels: [27, 28], next: 'trono_dis', layouts: [{ id: 'laberinto', weight: 2 }, { id: 'clasico', weight: 1 }] }),
  actD('trono_dis', 'Trono de Dis', 'El salón del Rey Demonio. En el techo, cadenas de luz que bajan del cielo.', 'inframundo', { difficulty: 10, floors: 2, levels: [28, 29], boss: { monster: 'rey_demonio', level: 31 }, theme: { wallTop: '#d9a940' } }),
  // ---------- Acto 8: el Cielo ----------
  actD('escalinata_cielo', 'Escalinata del Cielo', 'Una escalera de luz que nace de la sangre de la plaza del Bastión y sube entre las nubes.', 'cielo', { difficulty: 10, floors: 3, levels: [27, 28], next: 'puerta_alba' }),
  actD('puerta_alba', 'Puerta del Alba', 'Las puertas de Alba Eterna. Ningún mortal ha pasado de aquí sin invitación.', 'cielo', { difficulty: 10, floors: 3, levels: [28, 29] }),
  actD('torre_espada', 'Torre de la Espada', 'La torre de Velaris: viento que corta como el acero.', 'cielo', { difficulty: 10, floors: 4, levels: [28, 30], boss: { monster: 'velaris', level: 31 }, elements: ['viento'], theme: { wallTop: '#b8e8c8' } }),
  actD('torre_escudo', 'Torre del Escudo', 'La torre de Oriel: muros que se mueven y suelos que tiemblan.', 'cielo', { difficulty: 10, floors: 4, levels: [28, 30], boss: { monster: 'oriel', level: 31 }, elements: ['tierra'], theme: { wallTop: '#d8c090' }, extra: [{ id: 'gargola', weight: 3 }] }),
  actD('torre_balanza', 'Torre de la Balanza', 'La torre de Tharion: agua que sube y baja como una balanza.', 'cielo', { difficulty: 10, floors: 4, levels: [28, 30], boss: { monster: 'tharion', level: 31 }, elements: ['agua'], theme: { wallTop: '#a8c8f0' } }),
  actD('torre_voz', 'Torre de la Voz', 'La torre de Serafiel: un canto que no se calla nunca.', 'cielo', { difficulty: 10, floors: 4, levels: [28, 30], boss: { monster: 'serafiel', level: 31 }, elements: ['luz'], theme: { wallTop: '#fff0c0' } }),
  actD('trono_alba', 'Alba Eterna', 'La ciudad del Coro, vacía. Las calles brillan tanto que no hay sombras.', 'cielo', { difficulty: 10, floors: 3, levels: [29, 30], next: 'salones_alba' }),
  actD('salones_alba', 'Salones del Coro', 'Salones de mármol donde los ángeles cantaban. Ahora solo quedan guardianes.', 'cielo', { difficulty: 10, floors: 3, levels: [30, 31], next: 'trono_dios', layouts: [{ id: 'salones', weight: 2 }, { id: 'clasico', weight: 1 }] }),
  actD('trono_dios', 'El Trono', 'Detrás del trono, algo con demasiados ángulos. En el trono, Él. A sus pies, los cuatro capitanes, heridos, le guardan.', 'cielo', { difficulty: 10, floors: 2, levels: [31, 32], boss: { monster: 'dios', level: 34 }, bossEscort: ['velaris', 'oriel', 'tharion', 'serafiel'], bossEscortPower: { hp: 0.22, dmg: 0.36 }, bossScene: 'trono_antes', terrain: [], elements: ['luz'], theme: { floor: '#e8e0c8', floorAlt: '#f0e8d4', wall: '#8a8270', wallFace: '#b8b098', wallTop: '#ffffff' } }),
];
for (const d of ACT_DUNGEONS) DUNGEONS[d.id] = d;

// ---------------------------------------------------------------- Pueblos de más y Babel · Desfile de jefes

KITS.frontera = {
  theme: { floor: '#2e2a20', floorAlt: '#363126', wall: '#12100a', wallFace: '#221d14', wallTop: '#6a7a3a' }, music: 'dungeon',
  monsters: [{ id: 'lobo', weight: 5 }, { id: 'bandido', weight: 4 }, { id: 'slime', weight: 3 }, { id: 'murcielago', weight: 3 }, { id: 'hongo', weight: 2 }, { id: 'esqueleto', weight: 2, minFloor: 2 }],
  ingredients: ['carne_lobo', 'hierba_silvestre', 'seta', 'gel_limo'], materials: ['cuero_bestia', 'mineral_hierro', 'hueso_viejo'],
  terrain: [{ id: 'hierba', rooms: 0.4 }, { id: 'barro', rooms: 0.25 }, { id: 'agua', rooms: 0.15 }],
  traps: { ids: ['pinchos', 'veneno', 'hambre', 'aturdidora'], density: 0.35 }, goals: ['palanca', 'braseros', 'llave', 'caza'],
  items: COMMON_ITEMS,
};

for (const d of [
  actD('campos_molino', 'Campos del Molino', 'Trigales abandonados al oeste del Bastión. Los bandidos se esconden entre las espigas.', 'frontera', { difficulty: 2, floors: 3, levels: [3, 5], goals: 0.25 }),
  actD('cenizas_vado', 'Cenizas de Vado', 'Lo que la grieta dejó de la aldea de Aren y Bram. Aún huele a humo.', 'frontera', { difficulty: 4, floors: 3, levels: [11, 13], extra: [{ id: 'espectro', weight: 3 }], theme: { floor: '#2a2422', floorAlt: '#322a28', wallTop: '#5a4a40' } }),
  actD('ruinas_dunavieja', 'Ruinas de Dunavieja', 'Una ciudad de antes de la Fractura, medio enterrada en la arena.', 'arena', { difficulty: 7, floors: 4, levels: [17, 19], layouts: [{ id: 'laberinto', weight: 1 }, { id: 'salones', weight: 1 }] }),
  actD('lago_hielonegro', 'Lago de Hielonegro', 'Un lago helado de hielo negro, tan liso que refleja el cielo.', 'cumbres', { difficulty: 8, floors: 4, levels: [20, 21], extra: [{ id: 'ahogado', weight: 3 }] }),
  actD('cenizas_altas', 'Cenizas Altas', 'Colinas de ceniza donde la Legión encadenó a los soldados de Seren.', 'maldita', { difficulty: 8, floors: 4, levels: [22, 23], extra: [{ id: 'esqueleto', weight: 4 }] }),
]) DUNGEONS[d.id] = d;
// Los Campos del Molino se abren tras la primera misión: monstruos de principio de juego y pocos bandidos.
DUNGEONS.campos_molino.monsters = [{ id: 'slime', weight: 5 }, { id: 'murcielago', weight: 4 }, { id: 'lobo', weight: 3 }, { id: 'bandido', weight: 2, minFloor: 2 }];
DUNGEONS.campos_molino.levels = [2, 4];

DUNGEONS.babel_jefes = {
  id: 'babel_jefes', name: 'Babel · Desfile de jefes', desc: 'Una sala por piso y, en cada una, un jefe de cualquier rincón del mundo, de la Matriarca a Dios (con sus cuatro arcángeles). Cuanto más subís, más jefes a la vez. ¿Hasta cuántos llegáis?',
  difficulty: 8, floors: 999, levels: [1, 1], music: 'hondonada', infinite: true, bossRush: true, practice: true, scaling: 'party',
  theme: { floor: '#2a2030', floorAlt: '#32263a', wall: '#100a14', wallFace: '#1e1424', wallTop: '#a070e0' },
  monsters: [], ingredients: [], terrain: [{ id: 'sagrado', rooms: 0.2 }, { id: 'brasas', rooms: 0.15 }, { id: 'agua', rooms: 0.15 }],
  items: [...COMMON_ITEMS, { id: 'pocion_mayor', weight: 4 }, { id: 'pocion_suprema', weight: 2 }, { id: 'elixir', weight: 3 }],
};

// ---------------------------------------------------------------- Una mazmorra propia en cada pueblo
for (const d of [
  actD('sotano_molino', 'Sótano del Molino Viejo', 'Bajo el molino abandonado de Molinogris hay túneles de contrabandistas... y algo que roe los sacos.', 'frontera', { difficulty: 2, floors: 3, levels: [3, 5], goals: 0.25 }),
  actD('grieta_vado', 'La Grieta de Vado', 'La grieta que arrasó Vado. Ya no crece, pero algo sigue latiendo en el fondo.', 'frontera', { difficulty: 4, floors: 4, levels: [12, 14], boss: { monster: 'guardian', level: 15 }, bossName: 'Eco de la grieta de Vado', extra: [{ id: 'espectro', weight: 4 }, { id: 'fuego_fatuo', weight: 2 }], theme: { wallTop: '#7a2a2a' } }),
  actD('criptas_lago', 'Criptas del Lago', 'Bajo los templos de Aguaclara, las tumbas de los primeros sacerdotes del Coro. Inundadas.', 'lago', { difficulty: 6, floors: 4, levels: [15, 17], boss: { monster: 'bestia_niebla', level: 18 }, bossName: 'Guardiana de las criptas', extra: [{ id: 'espectro', weight: 3 }, { id: 'inquisidor', weight: 2 }] }),
  actD('nido_juncal', 'Nido de las Arañas', 'Bajo los juncos de Juncal, un nido de arañas del tamaño de un carro.', 'lago', { difficulty: 6, floors: 3, levels: [15, 17], boss: { monster: 'matriarca', level: 18 }, extra: [{ id: 'arana', weight: 6 }] }),
  actD('templo_enterrado', 'Templo Enterrado', 'Un templo de antes de la Fractura bajo las ruinas de Dunavieja. Alguien sigue rezando dentro.', 'arena', { difficulty: 7, floors: 4, levels: [18, 20], boss: { monster: 'sumo_sacerdote', level: 21 }, bossName: 'Sacerdote de la arena', layouts: [{ id: 'laberinto', weight: 2 }, { id: 'clasico', weight: 1 }] }),
  actD('veta_profunda', 'La Veta Profunda', 'El túnel más hondo de Cantera Seca, donde la roca brilla. Los mineros lo cerraron por algo.', 'arena', { difficulty: 7, floors: 4, levels: [18, 20], boss: { monster: 'guardian', level: 21 }, bossName: 'Coloso de la veta', extra: [{ id: 'gargola', weight: 5 }] }),
  actD('cuevas_escarcha', 'Cuevas de Escarcha', 'Las minas abandonadas de Pico Escarcha, convertidas en un laberinto de hielo.', 'cumbres', { difficulty: 8, floors: 4, levels: [19, 21], layouts: [{ id: 'laberinto', weight: 2 }, { id: 'pequeno', weight: 1 }] }),
  actD('guarida_lobo', 'Guarida del Lobo Gris', 'Una cueva en lo alto del bosque donde los lobos blancos no se atreven a entrar.', 'cumbres', { difficulty: 8, floors: 4, levels: [20, 22], boss: { monster: 'bestia_niebla', level: 23 }, bossName: 'El Lobo Gris', extra: [{ id: 'lobo', weight: 6 }] }),
  actD('fondo_hielonegro', 'Bajo el Hielo Negro', 'Por un agujero en el lago se baja a una caverna de hielo negro. Lo que enfría el lago está ahí abajo.', 'cumbres', { difficulty: 8, floors: 4, levels: [21, 22], boss: { monster: 'morgath', level: 23 }, bossName: 'Corazón del hielo negro', theme: { floor: '#1e2430', floorAlt: '#262c3a', wallTop: '#3a4a6a' } }),
  actD('catacumbas_osario', 'Catacumbas de Osario', 'Bajo la ciudad de hueso, las tumbas de los primeros esqueletos. Su rey nunca se fue.', 'maldita', { difficulty: 8, floors: 4, levels: [22, 24], boss: { monster: 'rey_hueso', level: 25 }, extra: [{ id: 'esqueleto', weight: 4 }] }),
  actD('campos_ceniza', 'Campos de Ceniza', 'Los campos de raíces de Cenizalta, donde la ceniza cae como nieve y los espectros vagan.', 'maldita', { difficulty: 8, floors: 3, levels: [22, 23] }),
  actD('gran_naufragio', 'El Gran Naufragio', 'Un barco de guerra hundido frente a Puerto Coral, lleno de agua, coral y monstruos.', 'coral', { difficulty: 9, floors: 4, levels: [23, 25], boss: { monster: 'bestia_niebla', level: 26 }, bossName: 'El Kraken del naufragio' }),
  actD('cuevas_brujas', 'Cuevas de las Brujas', 'Las grutas de Isla Gaviota donde las brujas tejían... hasta que algo subió del fondo.', 'coral', { difficulty: 9, floors: 4, levels: [24, 25], extra: [{ id: 'espectro', weight: 3 }] }),
]) DUNGEONS[d.id] = d;
DUNGEONS.sotano_molino.monsters = [{ id: 'slime', weight: 5 }, { id: 'murcielago', weight: 5 }, { id: 'hongo', weight: 2, minFloor: 2 }, { id: 'bandido', weight: 2, minFloor: 2 }];
