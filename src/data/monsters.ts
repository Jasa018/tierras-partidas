import type { Element } from './elements';

export type Faction = 'demonio' | 'angel';
export const FACTION_NAMES: Record<Faction, string> = { demonio: 'Legión de la Ceniza', angel: 'Coro del Alba' };

export type AiKind = 'melee' | 'ranged' | 'erratic' | 'caster' | 'lurker';

export interface MonsterDef {
  id: string;
  name: string;
  element: Element;
  sprite: string;
  base: { hp: number; atk: number; def: number; mag: number; res: number };
  xp: number;
  ai: AiKind;
  skills: { id: string; chance: number }[];
  fast?: boolean;
  boss?: boolean;
  /** La Parca: aparece cuando se agota el tiempo del piso, atraviesa paredes y siempre sabe dónde estáis. */
  reaper?: boolean;
  /** Bando: demonios y ángeles se atacan entre ellos (y a vosotros). */
  faction?: Faction;
  /** No sale al azar (tenderos, guardias, mímicos): solo cuando algo lo provoca. */
  special?: boolean;
  /** Ingredientes que puede soltar al morir. */
  drops?: { id: string; chance: number }[];
  /** Casillas que ocupa (ancho, alto). Ver BOSS_SIZE. */
  size?: [number, number];
  /** No se mueve de su sitio. */
  still?: boolean;
  /** Inmune mientras viva su escolta (el feto del trono y los cuatro capitanes). */
  ward?: boolean;
}

const M = (m: MonsterDef) => m;

export const MONSTERS: Record<string, MonsterDef> = {
  slime: M({ id: 'slime', name: 'Limo', element: 'agua', sprite: 'm_slime', base: { hp: 16, atk: 6, def: 3, mag: 5, res: 3 }, xp: 5, ai: 'melee', skills: [{ id: 'salpicar', chance: 0.25 }], drops: [{ id: 'gel_limo', chance: 0.35 }] }),
  murcielago: M({ id: 'murcielago', name: 'Murciélago', element: 'viento', sprite: 'm_bat', base: { hp: 12, atk: 6, def: 2, mag: 3, res: 3 }, xp: 5, ai: 'erratic', skills: [{ id: 'mordisco', chance: 0.2 }], drops: [{ id: 'cuero_bestia', chance: 0.15 }] }),
  hongo: M({ id: 'hongo', name: 'Hongo pútrido', element: 'tierra', sprite: 'm_shroom', base: { hp: 20, atk: 5, def: 4, mag: 6, res: 5 }, xp: 6, ai: 'lurker', skills: [{ id: 'esporas', chance: 0.4 }], drops: [{ id: 'seta', chance: 0.4 }] }),
  lobo: M({ id: 'lobo', name: 'Lobo hambriento', element: 'tierra', sprite: 'm_wolf', base: { hp: 20, atk: 8, def: 3, mag: 3, res: 3 }, xp: 8, ai: 'melee', fast: true, skills: [{ id: 'desgarro', chance: 0.2 }], drops: [{ id: 'carne_lobo', chance: 0.35 }, { id: 'cuero_bestia', chance: 0.3 }] }),
  ahogado: M({ id: 'ahogado', name: 'Ahogado', element: 'agua', sprite: 'm_drowned', base: { hp: 26, atk: 8, def: 5, mag: 4, res: 4 }, xp: 8, ai: 'melee', skills: [{ id: 'abrazo_ahogado', chance: 0.25 }], drops: [{ id: 'pescado_cienaga', chance: 0.3 }, { id: 'hueso_viejo', chance: 0.15 }] }),
  arana: M({ id: 'arana', name: 'Araña de cripta', element: 'tierra', sprite: 'm_spider', base: { hp: 20, atk: 8, def: 4, mag: 4, res: 4 }, xp: 8, ai: 'melee', skills: [{ id: 'mordida_venenosa', chance: 0.3 }], drops: [{ id: 'huevo_arana', chance: 0.3 }, { id: 'seda_arana', chance: 0.3 }] }),
  esqueleto: M({ id: 'esqueleto', name: 'Esqueleto', element: 'sombra', sprite: 'm_skeleton', faction: 'demonio', base: { hp: 24, atk: 9, def: 6, mag: 3, res: 4 }, xp: 9, ai: 'melee', skills: [], drops: [{ id: 'hueso_viejo', chance: 0.3 }, { id: 'sal_roca', chance: 0.12 }] }),
  esqueleto_arquero: M({ id: 'esqueleto_arquero', name: 'Esqueleto arquero', element: 'sombra', sprite: 'm_skel_archer', faction: 'demonio', base: { hp: 18, atk: 8, def: 4, mag: 3, res: 4 }, xp: 10, ai: 'ranged', skills: [{ id: 'flecha_hueso', chance: 0.7 }], drops: [{ id: 'hueso_viejo', chance: 0.3 }] }),
  espectro: M({ id: 'espectro', name: 'Espectro', element: 'sombra', sprite: 'm_ghost', base: { hp: 20, atk: 5, def: 3, mag: 10, res: 8 }, xp: 11, ai: 'caster', skills: [{ id: 'toque_helado', chance: 0.5 }, { id: 'lamento', chance: 0.2 }], drops: [{ id: 'esencia_sombra', chance: 0.25 }] }),
  fuego_fatuo: M({ id: 'fuego_fatuo', name: 'Fuego fatuo', element: 'fuego', sprite: 'm_wisp', base: { hp: 16, atk: 4, def: 3, mag: 10, res: 7 }, xp: 10, ai: 'caster', skills: [{ id: 'llama_fatua', chance: 0.6 }], drops: [{ id: 'esencia_sombra', chance: 0.2 }] }),
  gargola: M({ id: 'gargola', name: 'Gárgola', element: 'tierra', sprite: 'm_gargoyle', base: { hp: 34, atk: 11, def: 10, mag: 4, res: 6 }, xp: 14, ai: 'melee', skills: [{ id: 'golpe_piedra', chance: 0.3 }], drops: [{ id: 'mineral_hierro', chance: 0.35 }, { id: 'sal_roca', chance: 0.3 }] }),
  // --- Legión de la Ceniza (demonios) y Coro del Alba (ángeles): se pelean entre ellos ---
  diablillo: M({ id: 'diablillo', name: 'Diablillo', element: 'fuego', sprite: 'm_imp', faction: 'demonio', base: { hp: 16, atk: 7, def: 3, mag: 6, res: 3 }, xp: 14, ai: 'erratic', fast: true, skills: [{ id: 'llama_fatua', chance: 0.25 }], drops: [{ id: 'esencia_sombra', chance: 0.25 }] }),
  demonio: M({ id: 'demonio', name: 'Demonio cornudo', element: 'sombra', sprite: 'm_demon', faction: 'demonio', base: { hp: 30, atk: 10, def: 6, mag: 7, res: 5 }, xp: 22, ai: 'melee', skills: [{ id: 'ola_sombra', chance: 0.12 }], drops: [{ id: 'esencia_sombra', chance: 0.35 }, { id: 'cristal_hondonada', chance: 0.05 }] }),
  querubin: M({ id: 'querubin', name: 'Querubín', element: 'luz', sprite: 'm_cherub', faction: 'angel', base: { hp: 20, atk: 5, def: 4, mag: 9, res: 7 }, xp: 16, ai: 'caster', skills: [{ id: 'luz_sagrada', chance: 0.4 }], drops: [{ id: 'hierba_silvestre', chance: 0.2 }] }),
  angel_guardian: M({ id: 'angel_guardian', name: 'Ángel guardián', element: 'luz', sprite: 'm_angel', faction: 'angel', base: { hp: 30, atk: 10, def: 7, mag: 6, res: 7 }, xp: 24, ai: 'melee', skills: [{ id: 'lanza_luz', chance: 0.3 }], drops: [{ id: 'mineral_hierro', chance: 0.3 }, { id: 'cristal_hondonada', chance: 0.05 }] }),
  // --- Humanos corruptos: la Hermandad del Hueso sirve a los esqueletos (y a la Legión); los bandidos no sirven a nadie ---
  sectario: M({ id: 'sectario', name: 'Sectario del Hueso', element: 'sombra', sprite: 'm_cultist', faction: 'demonio', base: { hp: 24, atk: 9, def: 5, mag: 7, res: 6 }, xp: 12, ai: 'melee', skills: [{ id: 'drenar', chance: 0.15 }], drops: [{ id: 'pan', chance: 0.15 }] }),
  inquisidor: M({ id: 'inquisidor', name: 'Clérigo del Hueso', element: 'sombra', sprite: 'm_inquisitor', faction: 'demonio', base: { hp: 22, atk: 6, def: 4, mag: 10, res: 8 }, xp: 15, ai: 'caster', skills: [{ id: 'drenar', chance: 0.4 }, { id: 'ola_sombra', chance: 0.15 }] }),
  bandido: M({ id: 'bandido', name: 'Bandido', element: 'neutral', sprite: 'm_bandit', base: { hp: 22, atk: 9, def: 4, mag: 3, res: 3 }, xp: 11, ai: 'melee', fast: true, skills: [{ id: 'punalada', chance: 0.25 }], drops: [{ id: 'carne_seca', chance: 0.15 }] }),
  // --- Jefes ---
  sumo_sacerdote: M({ id: 'sumo_sacerdote', name: 'Sumo Sacerdote del Hueso', element: 'sombra', sprite: 'b_priest', boss: true, faction: 'demonio', base: { hp: 140, atk: 11, def: 8, mag: 13, res: 10 }, xp: 80, ai: 'caster', skills: [{ id: 'ola_sombra', chance: 0.3 }, { id: 'drenar', chance: 0.25 }] }),
  varkhul: M({ id: 'varkhul', name: 'Varkhul, heraldo de la ceniza', element: 'fuego', sprite: 'b_varkhul', boss: true, faction: 'demonio', base: { hp: 220, atk: 15, def: 10, mag: 14, res: 10 }, xp: 140, ai: 'melee', skills: [{ id: 'ola_sombra', chance: 0.25 }, { id: 'llamarada', chance: 0.25 }] }),
  matriarca: M({ id: 'matriarca', name: 'Matriarca de la cripta', element: 'tierra', sprite: 'b_spider', boss: true, base: { hp: 120, atk: 11, def: 7, mag: 8, res: 6 }, xp: 60, ai: 'melee', skills: [{ id: 'telarana', chance: 0.2 }, { id: 'mordida_venenosa', chance: 0.35 }] }),
  guardian: M({ id: 'guardian', name: 'Guardián Hueco', element: 'sombra', sprite: 'b_guardian', boss: true, base: { hp: 170, atk: 13, def: 9, mag: 12, res: 9 }, xp: 100, ai: 'melee', skills: [{ id: 'golpe_hueco', chance: 0.3 }, { id: 'ola_sombra', chance: 0.2 }] }),
  // --- Especiales: no salen al azar ---
  tendero: M({ id: 'tendero', name: 'Tendero furioso', element: 'neutral', sprite: 'p_merchant', special: true, base: { hp: 60, atk: 16, def: 10, mag: 6, res: 8 }, xp: 30, ai: 'melee', fast: true, skills: [] }),
  guardia_tienda: M({ id: 'guardia_tienda', name: 'Guardia del tendero', element: 'neutral', sprite: 'p_guard', special: true, base: { hp: 40, atk: 13, def: 8, mag: 4, res: 6 }, xp: 20, ai: 'melee', skills: [] }),
  eco: M({ id: 'eco', name: 'Eco', element: 'sombra', sprite: 'm_ghost', special: true, boss: true, base: { hp: 70, atk: 10, def: 5, mag: 9, res: 5 }, xp: 80, ai: 'melee', skills: [{ id: 'drenar', chance: 0.2 }] }),
  mimico: M({ id: 'mimico', name: 'Mímico', element: 'sombra', sprite: 'm_mimic', special: true, base: { hp: 34, atk: 13, def: 7, mag: 4, res: 5 }, xp: 25, ai: 'melee', skills: [{ id: 'mordisco', chance: 0.3 }] }),
  // --- La Parca (no es un jefe normal: no sale en Babel ni abre escaleras) ---
  parca: M({ id: 'parca', name: 'La Parca', element: 'sombra', sprite: 'm_reaper', reaper: true, base: { hp: 260, atk: 24, def: 15, mag: 22, res: 15 }, xp: 400, ai: 'melee', skills: [{ id: 'golpe_hueco', chance: 0.25 }, { id: 'ola_sombra', chance: 0.15 }] }),
  bestia_niebla: M({ id: 'bestia_niebla', name: 'Bestia de la Niebla', element: 'agua', sprite: 'b_mist', boss: true, base: { hp: 200, atk: 14, def: 10, mag: 12, res: 10 }, xp: 140, ai: 'melee', skills: [{ id: 'zarpazo_niebla', chance: 0.3 }, { id: 'aliento_niebla', chance: 0.2 }] }),
};

/** Dureza global de los monstruos: el ajuste principal de dificultad. */
export const MONSTER_POWER = { hp: 1.2, atk: 1.12, boss: 1.15 };

export function monsterStat(base: number, level: number, boss = false, stat?: string): number {
  const mult = (stat === 'hp' ? MONSTER_POWER.hp : stat === 'atk' || stat === 'mag' ? MONSTER_POWER.atk : 1) * (boss ? MONSTER_POWER.boss : 1);
  return Math.round(base * mult * (1 + (boss ? 0.08 : 0.15) * (level - 1)));
}

// ---------------------------------------------------------------- Actos 3 a 8

Object.assign(MONSTERS, {
  // --- Monstruos de región
  escorpion: M({ id: 'escorpion', name: 'Escorpión de arena', element: 'tierra', sprite: 'm_scorpion', base: { hp: 26, atk: 10, def: 7, mag: 3, res: 4 }, xp: 16, ai: 'melee', skills: [{ id: 'mordida_venenosa', chance: 0.3 }], drops: [{ id: 'sal_roca', chance: 0.2 }] }),
  serpiente: M({ id: 'serpiente', name: 'Serpiente marina', element: 'agua', sprite: 'm_serpent', base: { hp: 28, atk: 10, def: 5, mag: 8, res: 6 }, xp: 18, ai: 'melee', skills: [{ id: 'abrazo_ahogado', chance: 0.25 }], drops: [{ id: 'pescado_cienaga', chance: 0.35 }] }),
  arcangel: M({ id: 'arcangel', name: 'Arcángel', element: 'luz', sprite: 'm_archangel', faction: 'angel', special: true, base: { hp: 38, atk: 12, def: 10, mag: 11, res: 10 }, xp: 28, ai: 'melee', skills: [{ id: 'lanza_luz', chance: 0.3 }, { id: 'luz_sagrada', chance: 0.2 }], drops: [{ id: 'cristal_hondonada', chance: 0.08 }] }),
  // Los jefes de la historia (y el arcángel) son especiales: no salen al azar en la Torre de Babel.
  // --- Jefes del acto 3
  reina_arenas: M({ id: 'reina_arenas', name: 'Reina de las arenas', element: 'tierra', sprite: 'b_scorpion', boss: true, special: true, base: { hp: 180, atk: 14, def: 11, mag: 8, res: 8 }, xp: 160, ai: 'melee', skills: [{ id: 'mordida_venenosa', chance: 0.35 }, { id: 'golpe_piedra', chance: 0.2 }] }),
  seren_capitana: M({ id: 'seren_capitana', name: 'Seren, capitana de los esqueletos', element: 'tierra', sprite: 'p_seren', boss: true, special: true, faction: 'demonio', base: { hp: 220, atk: 15, def: 13, mag: 6, res: 10 }, xp: 200, ai: 'melee', skills: [{ id: 'golpe_escudo', chance: 0.3 }, { id: 'golpe_sismico', chance: 0.2 }] }),
  // --- Acto 4
  morgath: M({ id: 'morgath', name: 'Morgath, capitán de la Escarcha', element: 'agua', sprite: 'b_morgath', boss: true, special: true, faction: 'demonio', base: { hp: 240, atk: 17, def: 12, mag: 14, res: 10 }, xp: 240, ai: 'melee', skills: [{ id: 'escarcha', chance: 0.3 }, { id: 'ola_sombra', chance: 0.2 }] }),
  ixa: M({ id: 'ixa', name: 'Ixa, capitana del Glaciar', element: 'viento', sprite: 'b_ixa', boss: true, special: true, faction: 'demonio', fast: true, base: { hp: 200, atk: 18, def: 9, mag: 12, res: 9 }, xp: 240, ai: 'melee', skills: [{ id: 'corte_viento', chance: 0.4 }, { id: 'torbellino', chance: 0.2 }] }),
  corazon_grieta: M({ id: 'corazon_grieta', name: 'Corazón de la Grieta', element: 'sombra', sprite: 'b_eye', boss: true, special: true, base: { hp: 290, atk: 16, def: 12, mag: 17, res: 13 }, xp: 320, ai: 'caster', skills: [{ id: 'ola_sombra', chance: 0.3 }, { id: 'grieta', chance: 0.25 }] }),
  // --- Acto 5
  rey_hueso: M({ id: 'rey_hueso', name: 'Rey Hueso de Osario', element: 'sombra', sprite: 'b_bone_king', boss: true, special: true, faction: 'demonio', base: { hp: 300, atk: 19, def: 14, mag: 10, res: 11 }, xp: 320, ai: 'melee', skills: [{ id: 'golpe_hueco', chance: 0.3 }] }),
  capitan_legion: M({ id: 'capitan_legion', name: 'Capitán de la Legión', element: 'fuego', sprite: 'b_captain', boss: true, special: true, faction: 'demonio', base: { hp: 260, atk: 18, def: 13, mag: 15, res: 11 }, xp: 300, ai: 'melee', skills: [{ id: 'llamarada', chance: 0.25 }, { id: 'ola_sombra', chance: 0.2 }] }),
  // --- Acto 6
  garrick_demonio: M({ id: 'garrick_demonio', name: 'Garrick, el demonio', element: 'tierra', sprite: 'b_garrick', boss: true, special: true, faction: 'demonio', base: { hp: 380, atk: 22, def: 18, mag: 12, res: 14 }, xp: 420, ai: 'melee', skills: [{ id: 'golpe_sismico', chance: 0.3 }, { id: 'terremoto', chance: 0.2 }] }),
  // --- Acto 7
  cancerbero: M({ id: 'cancerbero', name: 'Cancerbero', element: 'fuego', sprite: 'b_hound', boss: true, special: true, faction: 'demonio', fast: true, base: { hp: 360, atk: 24, def: 14, mag: 10, res: 10 }, xp: 460, ai: 'melee', skills: [{ id: 'desgarro', chance: 0.3 }, { id: 'llamarada', chance: 0.2 }] }),
  reina_rios: M({ id: 'reina_rios', name: 'Reina de los Ríos de Fuego', element: 'fuego', sprite: 'b_fire_queen', boss: true, special: true, faction: 'demonio', base: { hp: 380, atk: 20, def: 14, mag: 24, res: 14 }, xp: 480, ai: 'caster', skills: [{ id: 'cataclismo', chance: 0.25 }, { id: 'llamarada', chance: 0.3 }] }),
  rey_demonio: M({ id: 'rey_demonio', name: 'Asmodar, Rey Demonio', element: 'sombra', sprite: 'b_demon_king', boss: true, special: true, faction: 'demonio', base: { hp: 430, atk: 25, def: 17, mag: 23, res: 16 }, xp: 600, ai: 'melee', skills: [{ id: 'cataclismo', chance: 0.2 }, { id: 'ola_sombra', chance: 0.25 }, { id: 'eclipse', chance: 0.15 }] }),
  // --- Acto 8: los cuatro capitanes del Coro y Dios
  velaris: M({ id: 'velaris', name: 'Velaris, la Espada del Coro', element: 'viento', sprite: 'b_angel_espada', boss: true, special: true, faction: 'angel', fast: true, base: { hp: 420, atk: 28, def: 16, mag: 16, res: 15 }, xp: 640, ai: 'melee', skills: [{ id: 'corte_viento', chance: 0.35 }, { id: 'tormenta_flechas', chance: 0.15 }] }),
  oriel: M({ id: 'oriel', name: 'Oriel, el Escudo del Coro', element: 'tierra', sprite: 'b_angel_escudo', boss: true, special: true, faction: 'angel', base: { hp: 450, atk: 22, def: 21, mag: 14, res: 18 }, xp: 640, ai: 'melee', skills: [{ id: 'terremoto', chance: 0.25 }, { id: 'muralla_viviente', chance: 0.15 }] }),
  tharion: M({ id: 'tharion', name: 'Tharion, la Balanza del Coro', element: 'agua', sprite: 'b_angel_balanza', boss: true, special: true, faction: 'angel', base: { hp: 460, atk: 20, def: 18, mag: 28, res: 20 }, xp: 640, ai: 'caster', skills: [{ id: 'abismo', chance: 0.25 }, { id: 'torrente', chance: 0.25 }] }),
  serafiel: M({ id: 'serafiel', name: 'Serafiel, la Voz del Coro', element: 'luz', sprite: 'b_angel_voz', boss: true, special: true, faction: 'angel', base: { hp: 480, atk: 22, def: 18, mag: 30, res: 22 }, xp: 700, ai: 'caster', skills: [{ id: 'juicio', chance: 0.3 }, { id: 'lanza_alba', chance: 0.25 }] }),
  dios: M({ id: 'dios', name: 'Dios', element: 'neutral', sprite: 'b_god', boss: true, special: true, base: { hp: 320, atk: 28, def: 20, mag: 30, res: 20 }, xp: 2000, ai: 'caster', skills: [{ id: 'juicio', chance: 0.25 }, { id: 'eclipse', chance: 0.15 }, { id: 'lanza_alba', chance: 0.2 }, { id: 'quiebre_grieta', chance: 0.15 }] }),
} satisfies Record<string, MonsterDef>);

/** Casillas que ocupan los jefes (ancho × alto) según la forma de su sprite: alargados de lado, altos o cuadrados. */
const BOSS_SIZE: Record<string, [number, number]> = {
  sumo_sacerdote: [2, 2], varkhul: [2, 3], matriarca: [3, 2], guardian: [2, 2], bestia_niebla: [2, 2],
  reina_arenas: [3, 2], seren_capitana: [2, 2], morgath: [2, 3], ixa: [2, 2], corazon_grieta: [3, 3],
  rey_hueso: [2, 3], capitan_legion: [2, 3], garrick_demonio: [2, 3], cancerbero: [3, 2], reina_rios: [2, 3],
  rey_demonio: [3, 3], velaris: [2, 3], oriel: [2, 3], tharion: [2, 3], serafiel: [2, 3],
  // El jefe final: un feto inmenso que flota sobre el trono.
  dios: [5, 5],
};
for (const [id, size] of Object.entries(BOSS_SIZE)) MONSTERS[id].size = size;
Object.assign(MONSTERS.dios, { still: true, ward: true });
