import type { WeaponKind } from './equipment';
import type { Element } from './elements';

export interface Stats {
  hp: number;
  sp: number;
  atk: number;
  def: number;
  mag: number;
  res: number;
}

export interface MemberDef {
  id: string;
  name: string;
  title: string;
  role: string;
  element: Element;
  /** Tipo de arma que puede equipar. */
  weapon: WeaponKind;
  base: Stats;
  growth: Stats;
  skills: { id: string; level: number }[];
  bio: string;
  /** Aspecto y carácter: cómo se le reconoce y cómo es. */
  look: string;
  /** Raza: humano, ángel, demonio o esqueleto. */
  race: Race;
  /** Raza que se cree que tiene hasta que la historia revela la verdadera (con el flag `flag`). */
  hiddenRace?: { shown: Race; flag: string };
  /** Talento de exploración: funciona mientras vaya en el grupo (ver DungeonRun.has). */
  talent: { name: string; desc: string };
}

/** Dos razas superiores (ángeles y demonios) y dos inferiores creadas por ellas (humanos por los ángeles, esqueletos por los demonios). */
export type Race = 'humano' | 'angel' | 'demonio' | 'esqueleto';
export const RACE_NAMES: Record<Race, string> = { humano: 'Humano', angel: 'Ángel', demonio: 'Demonio', esqueleto: 'Esqueleto' };

/** Las 9 plazas del gremio. El protagonista cambia de elemento y habilidades según su clase. */
export const MEMBERS: Record<string, MemberDef> = {
  aren: {
    id: 'aren', name: 'Aren', title: 'El protagonista', role: 'Equilibrado', element: 'neutral', weapon: 'espada', race: 'humano',
    base: { hp: 40, sp: 20, atk: 8, def: 6, mag: 6, res: 5 },
    growth: { hp: 7, sp: 1.5, atk: 1.6, def: 1.2, mag: 1.3, res: 1.1 },
    skills: [],
    bio: 'Superviviente de una aldea fronteriza. Siente cómo se reorganizan las Hondonadas.',
    look: 'Pelo de punta que no hay peine que dome y una bufanda roja que era de su madre. Habla poco, pero nunca deja a nadie atrás.',
    talent: { name: 'Pulso de la Hondonada', desc: 'Siente las escaleras: si están a 8 casillas o menos, aparecen en el mapa.' },
  },
  bram: {
    id: 'bram', name: 'Bram', title: 'Amigo de infancia', role: 'Daño cuerpo a cuerpo', element: 'fuego', weapon: 'martillo', race: 'humano',
    base: { hp: 42, sp: 16, atk: 10, def: 5, mag: 3, res: 4 },
    growth: { hp: 7.5, sp: 1.2, atk: 2.0, def: 1.1, mag: 0.6, res: 0.9 },
    skills: [{ id: 'martillazo', level: 1 }, { id: 'furia', level: 3 }, { id: 'onda_forja', level: 6 }, { id: 'rompehuesos', level: 9 }, { id: 'martillo_ascuas', level: 12 }],
    bio: 'Aprendiz de herrero, impulsivo y leal. Siempre quiso unirse a la Expedición.',
    look: 'Rubio, siempre con su gorro de lana de la forja. Ríe fuerte, come más fuerte y golpea antes de pensar.',
    talent: { name: 'Mazo de forja', desc: 'Si Bram es el líder o va a su lado, las murallas reforzadas caen a martillazos (3 golpes), sin bombas.' },
  },
  lysa: {
    id: 'lysa', name: 'Lysa', title: 'Sanadora del santuario', role: 'Curación', element: 'luz', weapon: 'baston', race: 'angel', hiddenRace: { shown: 'humano', flag: 'lysa_angel' },
    base: { hp: 32, sp: 28, atk: 5, def: 4, mag: 9, res: 8 },
    growth: { hp: 5.5, sp: 2.2, atk: 0.9, def: 0.9, mag: 1.9, res: 1.6 },
    skills: [{ id: 'sanar', level: 1 }, { id: 'luz_sagrada', level: 1 }, { id: 'purificar', level: 4 }, { id: 'bendicion', level: 7 }, { id: 'escudo_sagrado', level: 11 }],
    bio: 'La última sanadora de un santuario devorado por una Hondonada.',
    look: 'Capucha blanca y un colgante de luz. Dulce y paciente como una santa... hasta que alguien hace daño a un niño.',
    talent: { name: 'Aura serena', desc: 'Al llegar a cada piso, el grupo recupera un 15% de vida y se le cura el veneno.' },
  },
  garrick: {
    id: 'garrick', name: 'Garrick', title: 'Veterano desertor', role: 'Defensa / tanque', element: 'tierra', weapon: 'espada', race: 'demonio', hiddenRace: { shown: 'humano', flag: 'garrick_demonio' },
    base: { hp: 55, sp: 16, atk: 8, def: 9, mag: 3, res: 7 },
    growth: { hp: 9, sp: 1.2, atk: 1.4, def: 1.9, mag: 0.5, res: 1.4 },
    skills: [{ id: 'provocar', level: 1 }, { id: 'golpe_escudo', level: 1 }, { id: 'golpe_sismico', level: 4 }, { id: 'muro_piedra', level: 7 }, { id: 'baluarte', level: 10 }],
    bio: 'Abandonó la Expedición hace años, tras ver en una Hondonada algo que no eran demonios. Debe más de lo que admite.',
    look: 'Canoso, barba de semanas y un parche en el ojo izquierdo del que no habla. Gruñón, protector y con un humor muy seco.',
    talent: { name: 'Racionar', desc: 'Veterano de campaña: el hambre del grupo baja un 20% más despacio.' },
  },
  kaela: {
    id: 'kaela', name: 'Kaela', title: 'Cazadora solitaria', role: 'Ataque a distancia', element: 'viento', weapon: 'arco', race: 'humano',
    base: { hp: 36, sp: 20, atk: 9, def: 4, mag: 5, res: 5 },
    growth: { hp: 6, sp: 1.5, atk: 1.8, def: 0.9, mag: 1.0, res: 1.0 },
    skills: [{ id: 'flecha', level: 1 }, { id: 'disparo_veneno', level: 1 }, { id: 'lluvia_flechas', level: 10 }, { id: 'disparo_certero', level: 13 }, { id: 'prisa', level: 16 }],
    bio: 'Caza recompensas en tierra perdida. No le gusta compartir encargos.',
    look: 'Coleta negra y una cinta roja en la frente. Desconfiada, sarcástica y competitiva: cuenta cada presa.',
    talent: { name: 'Ojo de cazadora', desc: 'Los monstruos a 6 casillas o menos de Kaela salen en el mapa, aunque haya paredes.' },
  },
  odric: {
    id: 'odric', name: 'Odric', title: 'Erudito esqueleto', role: 'Magia / debilidades', element: 'agua', weapon: 'baston', race: 'esqueleto',
    base: { hp: 30, sp: 30, atk: 4, def: 4, mag: 11, res: 8 },
    growth: { hp: 5, sp: 2.4, atk: 0.7, def: 0.8, mag: 2.2, res: 1.6 },
    skills: [{ id: 'lanza_hielo', level: 1 }, { id: 'debilitar', level: 1 }, { id: 'marea_alta', level: 12 }, { id: 'escarcha', level: 15 }],
    bio: 'Un esqueleto erudito que se une en el desierto para entender esta guerra. Estudia los patrones de las grietas y cree que alguien las diseñó.',
    look: 'Un esqueleto de huesos azules como el agua, con unas gafas redondas que no necesita. Distraído, curioso y pedante; toma notas incluso en mitad de un combate.',
    talent: { name: 'Erudito', desc: 'Identifica los objetos sin identificar en cuanto los recoge el grupo.' },
  },
  pip: {
    id: 'pip', name: 'Pip', title: 'Niño ladrón', role: 'Velocidad / trampas', element: 'neutral', weapon: 'daga', race: 'humano',
    base: { hp: 34, sp: 18, atk: 8, def: 4, mag: 5, res: 5 },
    growth: { hp: 6, sp: 1.4, atk: 1.7, def: 0.9, mag: 1.0, res: 1.0 },
    skills: [{ id: 'punalada', level: 1 }, { id: 'prisa', level: 1 }, { id: 'bomba_humo', level: 14 }, { id: 'tajo_veloz', level: 17 }],
    bio: 'Sobrevive robando en una ciudad sitiada.',
    look: 'Despeinado, bajito y con un pañuelo de ladrón tapándole la boca. Descarado, rápido y más listo de lo que aparenta. En Leyenda ya es un adulto.',
    talent: { name: 'Dedos ligeros', desc: 'Descubre las trampas que haya junto a él o junto al líder, y sabe si un cofre es un mímico.' },
  },
  seren: {
    // Ocupa el hueco de Garrick tras su traición: mismas estadísticas y habilidades (la afinidad empieza de cero).
    id: 'seren', name: 'Seren', title: 'Capitana de los esqueletos', role: 'Defensa / tanque', element: 'tierra', weapon: 'espada', race: 'esqueleto',
    base: { hp: 55, sp: 16, atk: 8, def: 9, mag: 3, res: 7 },
    growth: { hp: 9, sp: 1.2, atk: 1.4, def: 1.9, mag: 0.5, res: 1.4 },
    skills: [{ id: 'provocar', level: 1 }, { id: 'golpe_escudo', level: 1 }, { id: 'golpe_sismico', level: 4 }, { id: 'muro_piedra', level: 7 }, { id: 'baluarte', level: 10 }],
    bio: 'Capitana del ejército de los esqueletos. Os enfrentasteis a ella en el desierto; se une cuando descubre que Garrick también traicionó a su pueblo.',
    look: 'Una esqueleto de huesos color tierra, con escudo y espada. Seria, recta y orgullosa de su gente; da órdenes hasta cuando pide algo.',
    talent: { name: 'Autoridad', desc: '15% de descuento en el mercader del campamento y en las tiendas de las mazmorras.' },
  },
  vael: {
    id: 'vael', name: 'Vael', title: 'Demonio desertor', role: 'Híbrido raro', element: 'sombra', weapon: 'baston', race: 'demonio',
    base: { hp: 40, sp: 26, atk: 9, def: 6, mag: 10, res: 7 },
    growth: { hp: 7, sp: 2, atk: 1.6, def: 1.1, mag: 1.9, res: 1.3 },
    skills: [{ id: 'drenar', level: 1 }, { id: 'grieta', level: 1 }, { id: 'velo', level: 18 }, { id: 'eclipse', level: 22 }],
    bio: 'Un demonio que abandonó la Legión de la Ceniza. Sabe la verdad sobre la Fractura y sobre el Coro del Alba.',
    look: 'Cuernos que asoman de una capucha negra, ojos violeta y una grieta que le brilla en la mejilla. Tranquilo, enigmático y casi siempre un paso por delante.',
    talent: { name: 'Paso entre sombras', desc: 'La Parca tarda 45 segundos más en llegar a cada piso.' },
  },
};

export interface ClassDef {
  id: string;
  name: string;
  element: Element;
  desc: string;
  mult: Partial<Stats>;
  skills: { id: string; level: number }[];
  color: string;
}

/** Prestigio: nivel máximo antes del prestigio 3 (después, sin tope práctico), y su nombre. */
export const PRESTIGE_CAP = 20;
export const PRESTIGE_MAX = 3;
export const PRESTIGE_NAMES = ['Novato', 'Veterano', 'Élite', 'Leyenda'];
/** Habilidad nueva que da cada prestigio (1, 2 y 3). Se conoce desde el nivel 1. */
export const PRESTIGE_SKILLS: Record<string, string[]> = {
  aren: ['corte_cruzado', 'voluntad', 'quiebre_grieta'],
  bram: ['yunque', 'forja_viva', 'cataclismo'],
  lysa: ['luz_serena', 'lanza_alba', 'milagro'],
  garrick: ['muralla_viviente', 'tajo_veterano', 'terremoto'],
  kaela: ['flecha_doble', 'viento_cortante', 'tormenta_flechas'],
  odric: ['prision_hielo', 'torrente', 'abismo'],
  pip: ['emboscada', 'veneno_sombra', 'mil_cortes'],
  seren: ['muralla_viviente', 'tajo_veterano', 'terremoto'],
  vael: ['grieta_menor', 'velo_profundo', 'fractura'],
};
/** Por cada prestigio: estadísticas ×(1 + 10%), como si empezara 3 niveles más arriba, y +20% de experiencia. */
export const PRESTIGE_STAT = 0.1;
export const PRESTIGE_LEVELS = 3;
export const PRESTIGE_XP = 0.2;

/** Clases del protagonista. Se desbloquean con la historia y se eligen antes de entrar a una mazmorra. */
export const CLASSES: Record<string, ClassDef> = {
  errante: { id: 'errante', name: 'Errante', element: 'neutral', desc: 'Sin afinidad. Equilibrado y fiable.', mult: {}, color: '#5a6b7a',
    skills: [{ id: 'tajo', level: 1 }, { id: 'golpe_aturdidor', level: 2 }, { id: 'segundo_aliento', level: 4 }, { id: 'embestida', level: 6 }, { id: 'grito_valor', level: 9 }] },
  brasa: { id: 'brasa', name: 'Brasa', element: 'fuego', desc: 'Fuego despertado en la Hondonada. Más ataque y magia.', mult: { atk: 1.1, mag: 1.15, def: 0.92 }, color: '#b8452f',
    skills: [{ id: 'tajo_igneo', level: 1 }, { id: 'llamarada', level: 1 }, { id: 'circulo_brasas', level: 1 }, { id: 'escudo_ascuas', level: 1 }, { id: 'infierno', level: 15 }] },
  marea: { id: 'marea', name: 'Marea', element: 'agua', desc: 'Agua que fluye. Resistente y con curación.', mult: { res: 1.15, hp: 1.05, atk: 0.95 }, color: '#2f6fb8',
    skills: [{ id: 'corte_marea', level: 1 }, { id: 'ola', level: 1 }, { id: 'brisa_curativa', level: 1 }, { id: 'remolino', level: 1 }, { id: 'diluvio', level: 18 }] },
  vendaval: { id: 'vendaval', name: 'Vendaval', element: 'viento', desc: 'Rápido y preciso.', mult: { atk: 1.05, def: 0.9 }, color: '#3f9a6a',
    skills: [{ id: 'corte_viento', level: 1 }, { id: 'torbellino', level: 1 }, { id: 'prisa', level: 1 }] },
  roca: { id: 'roca', name: 'Roca', element: 'tierra', desc: 'Inamovible.', mult: { def: 1.25, hp: 1.1, mag: 0.85 }, color: '#8a6a3f',
    skills: [{ id: 'golpe_roca', level: 1 }, { id: 'piel_piedra', level: 1 }, { id: 'temblor', level: 1 }] },
  lumen: { id: 'lumen', name: 'Lumen', element: 'luz', desc: 'Luz que cura y castiga.', mult: { mag: 1.15, res: 1.1, atk: 0.9 }, color: '#d8c070',
    skills: [{ id: 'destello', level: 1 }, { id: 'sanar', level: 1 }, { id: 'juicio', level: 1 }] },
  umbra: { id: 'umbra', name: 'Umbra', element: 'sombra', desc: 'El mismo poder que crea a los monstruos.', mult: { atk: 1.1, mag: 1.1, res: 0.9 }, color: '#5a3f8a',
    skills: [{ id: 'zarpa_umbria', level: 1 }, { id: 'drenar', level: 1 }, { id: 'velo', level: 1 }] },
};
