import { DUNGEONS, dungeonChain } from './dungeons';
import { DUNGEON_SPOTS, LOCATIONS, ROUTES } from './world';

export type Objective =
  | { kind: 'clear'; dungeon: string }
  | { kind: 'visit'; location: string }
  | { kind: 'kill'; monster: string; count: number; dungeon?: string }
  | { kind: 'rescue'; dungeon: string; floor: number; npc: string }
  | { kind: 'collect'; dungeon: string; item: string; count: number };

export interface Rewards {
  gold?: number;
  items?: Record<string, number>;
  /** Piezas de equipo (van al inventario de equipo del gremio). */
  gear?: Record<string, number>;
  flags?: string[];
  join?: string;
  /** Un miembro deja el gremio (la traición de Garrick): se va con su equipo puesto. */
  leave?: string;
  /** El grupo aparece en esta localidad (caídas, huidas, viajes forzados por la historia). */
  moveTo?: string;
  unlockClass?: string;
  scene?: string;
}

export interface QuestDef {
  id: string;
  name: string;
  type: 'main' | 'side';
  /** Localidad donde se acepta y entrega (solo secundarias). */
  giver?: string;
  desc: string;
  requires: string[];
  objective: Objective;
  rewards: Rewards;
  startScene?: string;
  /** Misión personal: solo avanza (y sus objetos o personas solo aparecen) con este compañero en el equipo. */
  member?: string;
}

export const QUESTS: QuestDef[] = [
  // ---------- Principales (Acto 1) ----------
  { id: 'mq1', name: 'La prueba de la Expedición', type: 'main', requires: [],
    desc: 'El comandante Hale exige que demuestres tu valía: llega al fondo de la Cueva Goteante.',
    objective: { kind: 'clear', dungeon: 'cueva_goteante' },
    rewards: { gold: 100, flags: ['mq1'], scene: 'mq1_fin' } },
  { id: 'mq2', name: 'Silencio en Rocaverde', type: 'main', requires: ['mq1'],
    desc: 'Rocaverde no responde. Cruza el Sendero Lodoso y averigua qué ocurre.',
    objective: { kind: 'visit', location: 'rocaverde' },
    rewards: { flags: ['mq2'], join: 'garrick', scene: 'mq2_fin' } },
  { id: 'mq3', name: 'El santuario en ruinas', type: 'main', requires: ['mq2'],
    desc: 'La sanadora del santuario quedó atrapada cuando se hundió. Baja a las Ruinas del Santuario.',
    objective: { kind: 'clear', dungeon: 'ruinas_santuario' },
    rewards: { gold: 200, flags: ['mq3'], join: 'lysa', scene: 'mq3_fin' } },
  { id: 'mq4', name: 'La Hondonada de la Frontera', type: 'main', requires: ['mq3'],
    desc: 'La grieta que arrasó tu aldea sigue abierta. Baja hasta su núcleo y séllalo.',
    objective: { kind: 'clear', dungeon: 'hondonada_frontera' },
    rewards: { gold: 300, flags: ['mq4', 'acto1'], unlockClass: 'brasa', items: { pocion_mayor: 2 }, gear: { pluma_hondonada: 1 }, scene: 'mq4_fin' } },
  // ---------- Principales (Acto 2) ----------
  { id: 'mq5', name: 'Las Rutas Perdidas', type: 'main', requires: ['mq4'],
    desc: 'Hale quiere reabrir la ruta del este. Cruza el Paso del Cuervo hasta Villa Niebla.',
    objective: { kind: 'visit', location: 'villa_niebla' },
    rewards: { flags: ['mq5'], scene: 'mq5_fin' } },
  { id: 'mq6', name: 'La cazadora de la niebla', type: 'main', requires: ['mq5'],
    desc: 'Una cazadora quiere la recompensa de la Ciénaga para ella sola. Llega antes al fondo.',
    objective: { kind: 'clear', dungeon: 'cienaga_niebla' },
    rewards: { gold: 400, flags: ['mq6'], join: 'kaela', unlockClass: 'vendaval', scene: 'mq6_fin' } },
  { id: 'mq7', name: 'Plumas y ceniza', type: 'main', requires: ['mq6'], startScene: 'mq7_inicio',
    desc: 'Al norte de Villa Niebla caen plumas y ceniza del cielo. Algo pelea sobre una grieta nueva. Llega al fondo del Cráter de Ceniza.',
    objective: { kind: 'clear', dungeon: 'llanura_plumas' },
    rewards: { gold: 500, flags: ['mq7'], items: { pocion_mayor: 2 }, scene: 'mq7_fin' } },

  // ---------- Secundarias ----------
  { id: 'sq_slimes', name: 'Plaga viscosa', type: 'side', giver: 'bastion_gris', requires: [],
    desc: 'Los limos taponan los desagües. Elimina 6 limos en cualquier mazmorra.',
    objective: { kind: 'kill', monster: 'slime', count: 6 },
    rewards: { gold: 120, items: { pocion: 2 } } },
  { id: 'sq_musgo', name: 'Agua contaminada', type: 'side', giver: 'bastion_gris', requires: ['mq1'],
    desc: 'Una alquimista necesita 3 muestras de musgo pálido de la Cueva Goteante.',
    objective: { kind: 'collect', dungeon: 'cueva_goteante', item: 'musgo_palido', count: 3 },
    rewards: { gold: 150, items: { elixir: 1 } } },
  { id: 'sq_lenador', name: 'El leñador perdido', type: 'side', giver: 'rocaverde', requires: [],
    desc: 'Tomás entró al Bosque de Espinas y no volvió. Búscalo en el Bosque Profundo, el tramo más hondo, nada más llegar (piso 1).',
    objective: { kind: 'rescue', dungeon: 'bosque_profundo', floor: 1, npc: 'Tomás el leñador' },
    rewards: { gold: 200, items: { carne_seca: 2 } } },
  { id: 'sq_lobos', name: 'Lobos en el linde', type: 'side', giver: 'rocaverde', requires: [],
    desc: 'Elimina 5 lobos hambrientos antes de que ataquen la empalizada.',
    objective: { kind: 'kill', monster: 'lobo', count: 5 },
    rewards: { gold: 180, items: { pocion_mayor: 1 } } },
  { id: 'sq_huesos', name: 'Huesos inquietos', type: 'side', giver: 'rocaverde', requires: ['mq3'],
    desc: 'Los muertos del santuario no descansan. Destruye 8 esqueletos.',
    objective: { kind: 'kill', monster: 'esqueleto', count: 8 },
    rewards: { gold: 250, items: { orbe_retorno: 1 } } },
  { id: 'sq_sectarios', name: 'La Hermandad del Hueso', type: 'side', giver: 'villa_niebla', requires: ['mq5'],
    desc: 'Desaparece gente en Villa Niebla. Una secta humana que adora a los esqueletos se esconde en unas catacumbas del pantano. Llega al fondo y detén a su sumo sacerdote.',
    objective: { kind: 'clear', dungeon: 'templo_sectario' },
    rewards: { gold: 350, items: { pocion_mayor: 2 }, scene: 'sectarios_fin' } },
  { id: 'sq_varo', name: 'El explorador Varo', type: 'side', giver: 'villa_niebla', requires: ['mq5'],
    desc: 'Un explorador de la Expedición desapareció en la Ciénaga. Búscalo en el Corazón de la Niebla, el segundo tramo (piso 1).',
    objective: { kind: 'rescue', dungeon: 'corazon_niebla', floor: 1, npc: 'Varo el explorador' },
    rewards: { gold: 300, items: { semilla_vida: 1 } } },
];

// ---------------------------------------------------------------- Actos 2 (final) a 8
const main = (id: string, name: string, requires: string[], desc: string, objective: Objective, rewards: Rewards, startScene?: string): QuestDef =>
  ({ id, name, type: 'main', requires, desc, objective, rewards: { ...rewards, flags: [id, ...(rewards.flags ?? [])], scene: rewards.scene ?? `${id}_fin` }, startScene });
const side = (id: string, name: string, giver: string, requires: string[], desc: string, objective: Objective, rewards: Rewards): QuestDef =>
  ({ id, name, type: 'side', giver, requires, desc, objective, rewards });

/** Misión principal cuyo final abre la elección del final del juego. */
export const FINAL_QUEST = 'mq42';

QUESTS.push(
  // ---------- Acto 2 (final): Aguaclara ----------
  main('mq8', 'La ciudad del lago', ['mq7'], 'Serafiel habló de la gran grieta. En Aguaclara, la capital del lago, sabrán dónde está. Cruza el Lago de los Juncos.',
    { kind: 'visit', location: 'aguaclara' }, { gold: 300, flags: ['acto2'] }),
  // ---------- Acto 3: el Mar de Arena ----------
  main('mq9', 'Arena y huesos', ['mq8'], 'La gran grieta está en las Cumbres Blancas, al otro lado del desierto. Cruza las Dunas Errantes hasta el oasis de Palmarroja.',
    { kind: 'visit', location: 'palmarroja' }, {}, 'acto3'),
  main('mq10', 'Agua envenenada', ['mq9'], 'Alguien ha envenenado los pozos de Palmarroja. Baja a los Pozos Envenenados y acaba con lo que vive en el fondo.',
    { kind: 'clear', dungeon: 'pozos_envenenados' }, { gold: 500, items: { antidoto: 4, pocion_mayor: 2 } }),
  main('mq11', 'La ciudad sitiada', ['mq10'], 'Solmarena, la capital del desierto, lleva un año sitiada por los esqueletos. Cruza el Cañón de Sal.',
    { kind: 'visit', location: 'solmarena' }, { join: 'odric' }),
  main('mq12', 'El ejército de huesos', ['mq11'], 'La capitana Seren manda el asedio desde el Fortín de Hueso, al norte de Solmarena. Derrótala.',
    { kind: 'clear', dungeon: 'fortin_hueso' }, { gold: 700, unlockClass: 'roca', flags: ['acto3'], items: { pocion_suprema: 2 } }),
  // ---------- Acto 4: las Cumbres Blancas ----------
  main('mq13', 'Hacia las nieves', ['mq12'], 'Al norte de Solmarena, el Paso Helado sube a las Cumbres Blancas. Llega a Pico Escarcha.',
    { kind: 'visit', location: 'pico_escarcha' }, {}, 'acto4'),
  main('mq14', 'La fortaleza helada', ['mq13'], 'Fuerte Albar es la última muralla antes de la gran grieta. Cruza el Glaciar Azul.',
    { kind: 'visit', location: 'fuerte_albar' }, { gold: 400 }),
  main('mq15', 'El capitán de la Escarcha', ['mq14'], 'Morgath, capitán demonio, guarda la grieta desde su bastión de hielo negro, al este de Fuerte Albar.',
    { kind: 'clear', dungeon: 'bastion_morgath' }, { gold: 800 }),
  main('mq16', 'La capitana del Glaciar', ['mq15'], 'Ixa, la otra capitana, caza desde la cumbre del glaciar, al oeste de Fuerte Albar.',
    { kind: 'clear', dungeon: 'cumbre_ixa' }, { gold: 800, items: { pocion_suprema: 2 } }),
  main('mq17', 'La gran grieta', ['mq16'], 'Los dos capitanes han caído. Baja hasta el núcleo de la Gran Grieta y ciérrala de una vez.',
    { kind: 'clear', dungeon: 'gran_grieta' }, { gold: 1000, unlockClass: 'marea', leave: 'garrick', moveTo: 'madriguera', flags: ['traicion', 'acto4'] }),
  // ---------- Acto 5: la Tierra Maldita y el regreso ----------
  main('mq18', 'Ceniza y un niño', ['mq17'], 'Habéis caído en la tierra de los esqueletos. Pip, el niño que os rescató, quiere salvar a sus amigos de los cazadores de la Legión, en el Yermo de Ceniza.',
    { kind: 'clear', dungeon: 'yermo_ceniza' }, { gold: 600, join: 'pip' }, 'acto5'),
  main('mq19', 'La ciudad de hueso', ['mq18'], 'La única salida de la Tierra Maldita está en Osario, la ciudad de los esqueletos. Cruza sus puertas.',
    { kind: 'visit', location: 'osario' }, {}),
  main('mq20', 'Escapar de Osario', ['mq19'], 'Sube por la Escalera de Huesos hasta las Cumbres Blancas, de vuelta al mundo de los vivos.',
    { kind: 'clear', dungeon: 'escalera_huesos' }, { gold: 800 }),
  main('mq21', 'Fuerte Albar ha caído', ['mq20'], 'La Legión ocupa Fuerte Albar. Libéralo.', { kind: 'clear', dungeon: 'albar_tomada' }, { gold: 700 }),
  main('mq22', 'Pico Escarcha ha caído', ['mq21'], 'La Legión ha bajado hasta Pico Escarcha. Libéralo.', { kind: 'clear', dungeon: 'pico_tomada' }, { gold: 700 }),
  main('mq23', 'Solmarena ha caído', ['mq22'], 'Solmarena arde. Alguien sigue luchando en la muralla norte. Libera la ciudad.', { kind: 'clear', dungeon: 'solmarena_tomada' }, { gold: 800, join: 'seren' }),
  main('mq24', 'Palmarroja ha caído', ['mq23'], 'La Legión bebe del oasis. Libera Palmarroja.', { kind: 'clear', dungeon: 'palmarroja_tomada' }, { gold: 800 }),
  main('mq25', 'Aguaclara ha caído', ['mq24'], 'La capital del lago, en llamas. Ningún ángel bajó a defenderla. Libérala.', { kind: 'clear', dungeon: 'aguaclara_tomada' }, { gold: 900 }),
  main('mq26', 'Villa Niebla ha caído', ['mq25'], 'Los pilotes arden. Libera Villa Niebla.', { kind: 'clear', dungeon: 'niebla_tomada' }, { gold: 900 }),
  main('mq27', 'Rocaverde ha caído', ['mq26'], 'La empalizada está en el suelo. Libera Rocaverde.', { kind: 'clear', dungeon: 'rocaverde_tomada' }, { gold: 900 }),
  main('mq28', 'El Bastión Gris ha caído', ['mq27'], 'La sede de la Expedición está en manos de la Legión. Libera el Bastión Gris.',
    { kind: 'clear', dungeon: 'bastion_tomado' }, { gold: 1200, unlockClass: 'lumen', flags: ['acto5'], items: { semilla_vida: 1 } }),
  // ---------- Acto 6: el Archipiélago Coral ----------
  main('mq29', 'Rumbo al mar', ['mq28'], 'Garrick huyó en un barco negro desde Puerto Coral. Sigue la Costa Rota hasta el puerto.',
    { kind: 'visit', location: 'puerto_coral' }, {}, 'acto6'),
  main('mq30', 'Las islas', ['mq29'], 'El barco negro paró en Isla Gaviota. Cruza el Arrecife Rojo.', { kind: 'visit', location: 'isla_gaviota' }, { gold: 500 }),
  main('mq31', 'El faro del fin', ['mq30'], 'Más allá del Cayo Hueco está el Faro del Fin, el último del mundo.', { kind: 'visit', location: 'faro_fin' }, { gold: 500 }),
  main('mq32', 'Bastión Negro', ['mq31'], 'Desde el faro se ve el fuerte de Garrick, el Bastión Negro. Entra y enfréntate a él.',
    { kind: 'clear', dungeon: 'bastion_negro' }, { gold: 1500, join: 'vael', unlockClass: 'umbra', flags: ['garrick_demonio', 'acto6'], items: { pocion_suprema: 3 } }),
  // ---------- Acto 7: el Inframundo ----------
  main('mq33', 'El descenso', ['mq32'], 'Bajo el Bastión Negro se abrió un pozo sin fondo. Vael dice que lleva al Inframundo. Baja hasta Brasa Quieta.',
    { kind: 'visit', location: 'brasa_quieta' }, {}, 'acto7'),
  main('mq34', 'El perro de tres cabezas', ['mq33'], 'El Cancerbero guarda el Círculo de Ceniza, uno de los dos pasos hacia Dis.', { kind: 'clear', dungeon: 'circulo_ceniza' }, { gold: 1200 }),
  main('mq35', 'La reina de los ríos', ['mq33'], 'La Reina de los Ríos de Fuego guarda el otro paso hacia Dis.', { kind: 'clear', dungeon: 'rios_fuego' }, { gold: 1200 }),
  main('mq36', 'La ciudadela de Dis', ['mq34', 'mq35'], 'Los dos pasos están abiertos. Entra en la Ciudadela de Dis y enfréntate al Rey Demonio.',
    { kind: 'clear', dungeon: 'ciudadela_dis' }, { gold: 2000, moveTo: 'bastion_gris', flags: ['lysa_angel', 'acto7'], items: { pocion_suprema: 3, semilla_vida: 1 } }),
  // ---------- Acto 8: el Cielo ----------
  main('mq37', 'La puerta del Cielo', ['mq36'], 'Con la invitación de Lysa, sube por la Escalinata del Cielo hasta el Jardín de las Plumas Caídas.',
    { kind: 'visit', location: 'jardin_plumas' }, {}, 'lysa_revela'),
  main('mq38', 'La Espada del Coro', ['mq37'], 'Velaris, la Espada del Coro, guarda su torre. Las cuatro torres sellan el trono.', { kind: 'clear', dungeon: 'torre_espada' }, { gold: 1500 }),
  main('mq39', 'El Escudo del Coro', ['mq37'], 'Oriel, el Escudo del Coro, guarda su torre.', { kind: 'clear', dungeon: 'torre_escudo' }, { gold: 1500 }),
  main('mq40', 'La Balanza del Coro', ['mq37'], 'Tharion, la Balanza del Coro, guarda su torre.', { kind: 'clear', dungeon: 'torre_balanza' }, { gold: 1500 }),
  main('mq41', 'La Voz del Coro', ['mq37'], 'Serafiel, la Voz del Coro, el ángel que os habló en el cráter, guarda la última torre.', { kind: 'clear', dungeon: 'torre_voz' }, { gold: 1500 }),
  main('mq42', 'El trono del Alba', ['mq38', 'mq39', 'mq40', 'mq41'], 'Las cuatro torres han caído y el trono está abierto. Atraviesa Alba Eterna y llega hasta Él.',
    { kind: 'clear', dungeon: 'trono_alba' }, { gold: 5000, flags: ['final'], scene: 'trono_fin' }),

  // ---------- Secundarias de los pueblos nuevos ----------
  side('sq_juncal', 'Ojos verdes', 'juncal', [], 'Los lobos del Robledal tienen los ojos verdes y ya no temen a nadie. Elimina 6 lobos en el Robledal.',
    { kind: 'kill', monster: 'lobo', count: 6, dungeon: 'robledal' }, { gold: 500, items: { carne_seca: 3 } }),
  side('sq_caravana', 'La caravana perdida', 'palmarroja', ['mq9'], 'Una caravana se perdió en las Dunas Hondas. Busca a su guía en el segundo tramo, piso 2.',
    { kind: 'rescue', dungeon: 'dunas_hondas', floor: 2, npc: 'Hadi el caravanero' }, { gold: 700, items: { racion: 3 } }),
  side('sq_escorpiones', 'Plaga de aguijones', 'cantera_seca', [], 'Los escorpiones han invadido la cantera. Elimina 8.',
    { kind: 'kill', monster: 'escorpion', count: 8 }, { gold: 700, items: { antidoto: 4 } }),
  side('sq_arqueros', 'Flechas en la muralla', 'solmarena', ['mq11'], 'Los arqueros esqueleto no dejan dormir a la ciudad. Elimina 10.',
    { kind: 'kill', monster: 'esqueleto_arquero', count: 10 }, { gold: 800, items: { pocion_suprema: 1 } }),
  side('sq_gargolas', 'Piedra que vuela', 'pico_escarcha', ['mq13'], 'Las gárgolas rompen las cadenas de las casas. Elimina 6.',
    { kind: 'kill', monster: 'gargola', count: 6 }, { gold: 800, gear: { amuleto_hielo: 1 } }),
  side('sq_centinelas', 'Centinelas de Albar', 'fuerte_albar', ['mq14'], 'Los demonios atacan a los centinelas cada noche. Elimina 8 demonios cornudos.',
    { kind: 'kill', monster: 'demonio', count: 8 }, { gold: 900, items: { pocion_suprema: 2 } }),
  side('sq_lobo_blanco', 'El cachorro blanco', 'refugio_lobo', [], 'Un cazador del refugio fue tras un cachorro herido al Bosque Blanco. Búscalo en el piso 3.',
    { kind: 'rescue', dungeon: 'bosque_blanco', floor: 3, npc: 'Iker el cazador' }, { gold: 900, gear: { pelliza_lobo: 1 } }),
  side('sq_madriguera', 'Los que nos venden', 'madriguera', ['mq18'], 'Hay humanos que venden a los suyos a la Legión. Elimina 8 sectarios.',
    { kind: 'kill', monster: 'sectario', count: 8 }, { gold: 900, items: { pocion_mayor: 3 } }),
  side('sq_osario', 'Almas sin descanso', 'osario', ['mq19'], 'Los espectros no dejan en paz a los esqueletos de Osario. Elimina 8.',
    { kind: 'kill', monster: 'espectro', count: 8 }, { gold: 1000, gear: { anillo_osario: 1 } }),
  side('sq_serpientes', 'Redes rotas', 'puerto_coral', ['mq29'], 'Las serpientes marinas rompen las redes del puerto. Elimina 10.',
    { kind: 'kill', monster: 'serpiente', count: 10 }, { gold: 1200, items: { pocion_suprema: 2 } }),
  side('sq_gaviota', 'La niña del acantilado', 'isla_gaviota', ['mq30'], 'Una niña bajó a buscar huevos al Cayo Hueco y no ha vuelto. Búscala en el piso 2.',
    { kind: 'rescue', dungeon: 'cayo_hueco', floor: 2, npc: 'Lía la de las gaviotas' }, { gold: 1200, gear: { perla_abismo: 1 } }),
  side('sq_faro', 'Diablillos en el faro', 'faro_fin', ['mq31'], 'Los diablillos apagan la luz del faro cada noche. Elimina 10.',
    { kind: 'kill', monster: 'diablillo', count: 10 }, { gold: 1200, items: { elixir_mayor: 2 } }),
  side('sq_desertores', 'Fuegos sin dueño', 'brasa_quieta', ['mq33'], 'Los fuegos fatuos queman el campamento. Elimina 8.',
    { kind: 'kill', monster: 'fuego_fatuo', count: 8 }, { gold: 1500, gear: { anillo_rey: 1 } }),
  side('sq_querubines', 'Plumas robadas', 'jardin_plumas', ['mq37'], 'Los querubines del Coro arrancan las flores del Jardín. Elimina 10.',
    { kind: 'kill', monster: 'querubin', count: 10 }, { gold: 2000, gear: { pluma_caida: 1 } }),
);

// ---------------------------------------------------------------- Misiones personales (solo con ese compañero en el equipo)
const personal = (member: string, name: string, giver: string, requires: string[], desc: string, objective: Objective, rewards: Rewards): QuestDef =>
  ({ ...side(`sq_${member}`, name, giver, requires, desc, objective, { ...rewards, gear: { [`recuerdo_${member}`]: 1, ...rewards.gear }, scene: `personal_${member}` }), member });

QUESTS.push(
  personal('bram', 'La forja de mi padre', 'vado', ['mq4'], 'Personal de Bram (tiene que ir en el equipo). El martillo de su padre quedó bajo las cenizas de la forja. Búscalo en las Cenizas de Vado.',
    { kind: 'collect', dungeon: 'cenizas_vado', item: 'martillo_padre', count: 1 }, { gold: 300 }),
  personal('lysa', 'La hermana del santuario', 'rocaverde', ['mq3'], 'Personal de Lysa (tiene que ir en el equipo). Una hermana del santuario sigue perdida en la Cripta, el segundo tramo de las Ruinas (piso 2).',
    { kind: 'rescue', dungeon: 'cripta_santuario', floor: 2, npc: 'Hermana Ilda' }, { gold: 300 }),
  { ...side('sq_garrick', 'Deudas viejas', 'bastion_gris', ['mq2'], 'Personal de Garrick (tiene que ir en el equipo). Unos bandidos de su antigua escuadra le buscan para cobrarle. Derrota a 5 bandidos.',
    { kind: 'kill', monster: 'bandido', count: 5 }, { gold: 400, items: { pocion_mayor: 2 }, scene: 'personal_garrick' }), member: 'garrick' },
  personal('kaela', 'La presa del maestro', 'refugio_lobo', ['mq14'], 'Personal de Kaela (tiene que ir en el equipo). Su maestro murió cazando al gran lobo blanco del Bosque Blanco. Caza 8 lobos allí.',
    { kind: 'kill', monster: 'lobo', count: 8, dungeon: 'bosque_blanco' }, { gold: 900 }),
  personal('odric', 'El primer archivo', 'solmarena', ['mq12'], 'Personal de Odric (tiene que ir en el equipo). Las páginas del primer archivo de Osario se perdieron en el Cañón de Sal. Recupera 3.',
    { kind: 'collect', dungeon: 'canon_sal', item: 'pagina_archivo', count: 3 }, { gold: 900 }),
  personal('pip', 'El último amigo', 'madriguera', ['mq18'], 'Personal de Pip (tiene que ir en el equipo). Nilo, el mejor amigo de Pip, sigue preso en las Puertas de Osario (piso 3).',
    { kind: 'rescue', dungeon: 'puertas_osario', floor: 3, npc: 'Nilo' }, { gold: 1000 }),
  personal('seren', 'Los soldados de la capitana', 'cenizalta', ['mq23'], 'Personal de Seren (tiene que ir en el equipo). La Legión encadenó a sus soldados en las Cenizas Altas. Llega al fondo y libéralos.',
    { kind: 'clear', dungeon: 'cenizas_altas' }, { gold: 1200 }),
  personal('vael', 'Lo que ataba a los demonios', 'brasa_quieta', ['mq33'], 'Personal de Vael (tiene que ir en el equipo). Vael quiere entender las cadenas de luz. Recoge 3 esquirlas en el Círculo de Ceniza.',
    { kind: 'collect', dungeon: 'circulo_ceniza', item: 'esquirla_cadena', count: 3 }, { gold: 1500 }),
);

// ---------------------------------------------------------------- Más secundarias en cada pueblo
const kill = (monster: string, count: number, dungeon?: string): Objective => ({ kind: 'kill', monster, count, dungeon });
const collect = (dungeon: string, item: string, count: number): Objective => ({ kind: 'collect', dungeon, item, count });
const rescue = (dungeon: string, floor: number, npc: string): Objective => ({ kind: 'rescue', dungeon, floor, npc });
const clear = (dungeon: string): Objective => ({ kind: 'clear', dungeon });

QUESTS.push(
  // Acto 1
  side('sq_alas', 'Alas en la muralla', 'bastion_gris', [], 'Los murciélagos anidan en las torres del Bastión. Elimina 8.', kill('murcielago', 8), { gold: 140, items: { pan: 3 } }),
  side('sq_paso', 'Reconocer el paso', 'bastion_gris', ['mq4'], 'Hale quiere un informe del Paso del Cuervo. Atraviésalo (puedes volver a explorarlo desde el mapa).', clear('paso_cuervo'), { gold: 400, items: { orbe_retorno: 1 } }),
  side('sq_aranas', 'Telarañas en el pozo', 'rocaverde', ['mq2'], 'Las arañas del santuario suben hasta el pozo del pueblo. Elimina 6.', kill('arana', 6), { gold: 260, items: { antidoto: 3 } }),
  side('sq_trigo', 'Espigas negras', 'molinogris', [], 'Junto a una grieta pequeña crece trigo negro que enferma a quien lo come. Recoge 3 espigas en los Campos del Molino para quemarlas.', collect('campos_molino', 'trigo_negro', 3), { gold: 150, items: { pan: 4 } }),
  side('sq_bandidos', 'Ladrones de harina', 'molinogris', [], 'Los bandidos roban la harina del molino. Derrota a 6.', kill('bandido', 6), { gold: 200, gear: { anillo_vigor: 1 } }),
  side('sq_molinera', 'La hija del molinero', 'molinogris', ['mq1'], 'La hija del molinero salió a buscar a su perro a los Campos del Molino. Búscala en el piso 2.', rescue('campos_molino', 2, 'Clara la molinera'), { gold: 220, items: { pocion: 3 } }),
  side('sq_vado_recuerdos', 'Lo que quedó', 'vado', ['mq4'], 'Los vecinos quieren recuperar algo de lo que perdieron. Busca 4 recuerdos entre las Cenizas de Vado.', collect('cenizas_vado', 'recuerdo_vado', 4), { gold: 400, items: { racion: 2 } }),
  side('sq_vado_lobos', 'Lobos entre las ruinas', 'vado', ['mq4'], 'Los lobos se han quedado con las casas vacías. Elimina 6 en las Cenizas de Vado.', kill('lobo', 6, 'cenizas_vado'), { gold: 350, items: { carne_seca: 3 } }),
  // Acto 2
  side('sq_ahogados', 'Los que no flotan', 'villa_niebla', ['mq5'], 'Los ahogados se agarran a los pilotes por la noche. Elimina 8.', kill('ahogado', 8), { gold: 380, items: { pocion_mayor: 1 } }),
  side('sq_flores', 'Flores del lago', 'villa_niebla', ['mq7'], 'La barquera quiere flores de pantano para la tumba de su marido. Recoge 3 en el Lago de los Juncos.', collect('lago_juncos', 'flor_pantano', 3), { gold: 420, items: { semilla_vida: 1 } }),
  side('sq_puentes', 'Serpientes bajo los puentes', 'aguaclara', ['mq8'], 'Las serpientes marinas suben por los canales de Aguaclara. Elimina 6.', kill('serpiente', 6), { gold: 500, items: { pocion_mayor: 2 } }),
  side('sq_novicia', 'La novicia perdida', 'aguaclara', ['mq8'], 'Una novicia del templo fue a rezar a las islas de juncos y no volvió. Búscala en el Lago de los Juncos (piso 3).', rescue('lago_juncos', 3, 'Novicia Alba'), { gold: 520, items: { elixir: 2 } }),
  side('sq_fanaticos', 'Fanáticos del Coro', 'aguaclara', ['mq8'], 'Unos inquisidores queman a los que dudan del Coro. Derrota a 5 (rezan en las catacumbas del pantano... y más arriba).', kill('inquisidor', 5), { gold: 600, gear: { amuleto_luz: 1 } }),
  side('sq_juncos', 'Juncos dorados', 'juncal', [], 'Las cesteras necesitan juncos dorados del Robledal. Recoge 4.', collect('robledal', 'junco_dorado', 4), { gold: 450, items: { racion: 2 } }),
  side('sq_hongos', 'Esporas en la cosecha', 'juncal', [], 'Los hongos pútridos del Robledal sueltan esporas sobre Juncal. Elimina 8.', kill('hongo', 8), { gold: 400, items: { antidoto: 4 } }),
  // Acto 3
  side('sq_oasis', 'Flores del oasis', 'palmarroja', ['mq9'], 'Los enfermos del veneno necesitan flores del oasis. Recoge 3 en las Dunas Hondas.', collect('dunas_hondas', 'flor_oasis', 3), { gold: 600, items: { antidoto: 4 } }),
  side('sq_huesos_dunas', 'Huesos en las dunas', 'palmarroja', ['mq9'], 'Patrullas de esqueletos asaltan las caravanas. Destruye 10 esqueletos.', kill('esqueleto', 10), { gold: 650, items: { pocion_mayor: 2 } }),
  side('sq_muralla', 'Los que abren las puertas', 'solmarena', ['mq11'], 'Hay sectarios dentro de Solmarena que ayudan al enemigo. Derrota a 8.', kill('sectario', 8), { gold: 750, gear: { anillo_sol: 1 } }),
  side('sq_canon', 'Despejar el cañón', 'solmarena', ['mq12'], 'El general Asim quiere el Cañón de Sal limpio para las caravanas. Atraviésalo de nuevo.', clear('canon_sal'), { gold: 700, items: { pocion_suprema: 1 } }),
  side('sq_vetas', 'Vetas de oro', 'cantera_seca', [], 'La mina vivía del oro. Trae 4 vetas de la Mina Enterrada.', collect('mina_enterrada', 'veta_oro', 4), { gold: 1000 }),
  side('sq_aranas_mina', 'Seda en los túneles', 'cantera_seca', [], 'Las arañas tejen en los túneles hundidos. Elimina 8.', kill('arana', 8, 'mina_enterrada'), { gold: 700, items: { pocion_mayor: 2 } }),
  side('sq_tablillas', 'Escritura de antes', 'dunavieja', [], 'Nur quiere tablillas de las Ruinas de Dunavieja. Trae 4.', collect('ruinas_dunavieja', 'tablilla_antigua', 4), { gold: 900, gear: { aguijon: 1 } }),
  side('sq_escorpiones_ruinas', 'Aguijones en las ruinas', 'dunavieja', [], 'Los escorpiones han hecho nido en las Ruinas de Dunavieja. Elimina 8.', kill('escorpion', 8, 'ruinas_dunavieja'), { gold: 800, items: { antidoto: 4 } }),
  side('sq_nur', 'La buscadora atrapada', 'dunavieja', [], 'Un ayudante de Nur bajó a las ruinas y se hundió el suelo. Búscalo en el piso 3.', rescue('ruinas_dunavieja', 3, 'Yusuf el ayudante'), { gold: 850, items: { pocion_suprema: 1 } }),
  // Acto 4
  side('sq_cadenas', 'Cadenas nuevas', 'pico_escarcha', ['mq13'], 'Las cadenas del pueblo se rompen. Trae 3 eslabones helados del Paso Alto.', collect('paso_alto', 'eslabon_hielo', 3), { gold: 850, items: { racion: 2 } }),
  side('sq_diablillos_pico', 'Diablillos en las chimeneas', 'pico_escarcha', ['mq13'], 'Los diablillos se cuelan por las chimeneas. Elimina 10.', kill('diablillo', 10), { gold: 900, items: { pocion_suprema: 1 } }),
  side('sq_centinela', 'El centinela perdido', 'fuerte_albar', ['mq14'], 'Un centinela se perdió en una tormenta sobre el Glaciar Azul. Búscalo en el piso 3.', rescue('glaciar_azul', 3, 'Centinela Bern'), { gold: 900, gear: { lanza_albar: 1 } }),
  side('sq_espectros_albar', 'Fantasmas en la muralla', 'fuerte_albar', ['mq14'], 'Los espectros de los caídos rondan las almenas. Elimina 6.', kill('espectro', 6), { gold: 850, items: { elixir: 2 } }),
  side('sq_pieles', 'Pieles para el invierno', 'refugio_lobo', [], 'El refugio necesita pieles blancas para pasar el invierno. Trae 3 del Bosque Blanco.', collect('bosque_blanco', 'piel_blanca', 3), { gold: 900, items: { racion: 3 } }),
  side('sq_hielo_negro', 'Hielo que no se derrite', 'hielonegro', [], 'Los pescadores quieren saber qué enfría el lago. Trae 3 cristales de hielo negro.', collect('lago_hielonegro', 'cristal_negro', 3), { gold: 1000, gear: { amuleto_hielo: 1 } }),
  side('sq_hielonegro_madre', 'La pescadora del lago', 'hielonegro', [], 'La madre de una niña del pueblo se perdió en el Lago de Hielonegro. Búscala en el piso 3.', rescue('lago_hielonegro', 3, 'Pescadora Ane'), { gold: 1000, items: { pocion_suprema: 2 } }),
  side('sq_pesca_rara', 'Lo que no es un pez', 'hielonegro', [], 'Por los agujeros del hielo salen ahogados en vez de peces. Elimina 6 en el Lago de Hielonegro.', kill('ahogado', 6, 'lago_hielonegro'), { gold: 950, items: { pocion_suprema: 1 } }),
  // Acto 5
  side('sq_leales_legion', 'Leales a la Legión', 'osario', ['mq19'], 'Algunos esqueletos siguen obedeciendo a la Legión y asaltan el camino de Osario. Destruye 8 en las Puertas de Osario.', kill('esqueleto', 8, 'puertas_osario'), { gold: 1000, items: { pocion_suprema: 2 } }),
  side('sq_raices', 'Pan de ceniza', 'madriguera', ['mq18'], 'La Madriguera pasa hambre. Trae 4 raíces de ceniza del Yermo.', collect('yermo_ceniza', 'raiz_ceniza', 4), { gold: 900, items: { racion: 3 } }),
  side('sq_huesos_tallados', 'La biblioteca de hueso', 'osario', ['mq19'], 'El escriba quiere reconstruir la biblioteca de Osario. Trae 3 huesos tallados de las Puertas de Osario.', collect('puertas_osario', 'hueso_tallado', 3), { gold: 1100, items: { elixir_mayor: 1 } }),
  side('sq_fatuos', 'Luces en los campos', 'cenizalta', [], 'Los fuegos fatuos queman las raíces de Cenizalta. Elimina 8.', kill('fuego_fatuo', 8), { gold: 1100, items: { pocion_suprema: 2 } }),
  side('sq_arqueros_ceniza', 'Arqueros sin capitán', 'cenizalta', [], 'Arqueros esqueleto que ya no obedecen a nadie disparan a los campesinos. Destruye 8 en las Cenizas Altas.', kill('esqueleto_arquero', 8, 'cenizas_altas'), { gold: 1200, gear: { espada_hueso: 1 } }),
  // Acto 6
  side('sq_perlas', 'Perlas negras', 'puerto_coral', ['mq29'], 'Un contrabandista paga muy bien las perlas negras del Arrecife Rojo. Trae 3.', collect('arrecife', 'perla_negra', 3), { gold: 1500 }),
  side('sq_contramaestre', 'El contramaestre', 'puerto_coral', ['mq29'], 'El contramaestre de la capitana Mara quedó atrapado en los Acantilados del Coral. Búscalo en el piso 2.', rescue('acantilados', 2, 'Contramaestre Rui'), { gold: 1300, gear: { tridente: 1 } }),
  side('sq_algas', 'Algas de luz', 'isla_gaviota', ['mq30'], 'Las brujas necesitan algas de luz del Cayo Hueco para tejer mantos. Trae 4.', collect('cayo_hueco', 'alga_luz', 4), { gold: 1300, gear: { manto_marea: 1 } }),
  side('sq_limos_cisterna', 'Limos en la cisterna', 'isla_gaviota', ['mq30'], 'La cisterna de la isla está llena de limos. Elimina 8.', kill('slime', 8), { gold: 1000, items: { pocion_suprema: 1 } }),
  side('sq_naufrago', 'El náufrago', 'faro_fin', ['mq31'], 'El farero vio a un náufrago entrar en las cuevas del Cayo Hueco. Búscalo en el piso 3.', rescue('cayo_hueco', 3, 'Teo el náufrago'), { gold: 1300, items: { semilla_vida: 1 } }),
  side('sq_cuernos', 'Cuernos en la costa', 'faro_fin', ['mq31'], 'Los demonios de la Legión desembarcan cerca del faro. Elimina 10.', kill('demonio', 10), { gold: 1400, items: { pocion_suprema: 2 } }),
  // Acto 7
  side('sq_brasas', 'Brasas eternas', 'brasa_quieta', ['mq33'], 'El campamento se enfría. Trae 3 brasas eternas de los Ríos de Fuego.', collect('rios_fuego', 'brasa_eterna', 3), { gold: 1800, gear: { armadura_dis: 1 } }),
  side('sq_leales', 'Los leales de Asmodar', 'brasa_quieta', ['mq33'], 'Los demonios leales al rey cazan desertores. Elimina 12 demonios.', kill('demonio', 12), { gold: 1800, items: { elixir_mayor: 2 } }),
  // Acto 8
  side('sq_plumas', 'Plumas del camino', 'jardin_plumas', ['mq37'], 'Los ángeles sin alas guardan las plumas caídas. Recoge 4 en la Puerta del Alba (segundo tramo de la Escalinata).', collect('puerta_alba', 'pluma_blanca', 4), { gold: 2000, items: { lagrima_alba: 1 } }),
  side('sq_guardianes', 'Guardianes del Coro', 'jardin_plumas', ['mq37'], 'Los guardianes del Coro vigilan el Jardín. Derrota a 10 ángeles guardianes.', kill('angel_guardian', 10), { gold: 2000, items: { pocion_suprema: 3 } }),
  side('sq_arcangeles', 'Alas de juicio', 'jardin_plumas', ['mq37'], 'Los arcángeles cazan a los ángeles que se negaron. Derrota a 6.', kill('arcangel', 6), { gold: 2500, gear: { tunica_coro: 1 } }),
);

// ---------------------------------------------------------------- Secundarias de relleno: cada mazmorra, al menos 2
// Para cada mazmorra con menos de las que le tocan (2, o 3 si tiene jefe), se añaden encargos de cazar, recoger y
// rescatar. Los da la localidad desde la que se entra y piden lo mismo que la mazmorra (y su misión principal, si la tiene).
const PLURAL: Record<string, string> = {
  slime: 'limos', murcielago: 'murciélagos', hongo: 'hongos pútridos', lobo: 'lobos', ahogado: 'ahogados', arana: 'arañas', esqueleto: 'esqueletos',
  esqueleto_arquero: 'arqueros esqueleto', espectro: 'espectros', fuego_fatuo: 'fuegos fatuos', gargola: 'gárgolas', diablillo: 'diablillos',
  demonio: 'demonios cornudos', querubin: 'querubines', angel_guardian: 'ángeles guardianes', sectario: 'sectarios', inquisidor: 'inquisidores',
  bandido: 'bandidos', escorpion: 'escorpiones', serpiente: 'serpientes marinas', arcangel: 'arcángeles',
};
/** Por región: objeto que se recoge, título y texto ({d} la mazmorra, {n} cuántos), y nombres de gente perdida. */
const REGION_ERRANDS: Record<string, { item: string; title: string; text: string; people: string[] }> = {
  frontera: { item: 'carta_perdida', title: 'Cartas que no llegaron', text: 'Los carteros que cruzaban {d} nunca llegaron. Recupera {n} cartas perdidas allí.', people: ['Tobías el cartero', 'Nadia la pastora', 'Íñigo el carretero'] },
  rutas: { item: 'farol_pantano', title: 'Faroles apagados', text: 'Los barqueros perdieron sus faroles en {d}. Trae {n}: sin luz no salen al agua.', people: ['Lucio el barquero', 'Marta la pescadora', 'Fray Anselmo'] },
  arena: { item: 'cantimplora', title: 'Caravanas perdidas', text: 'Una caravana desapareció en {d}. Trae {n} cantimploras con nombre para avisar a las familias.', people: ['Samir el guía', 'Leila la aguadora', 'Omar el mercader'] },
  cumbres: { item: 'insignia_centinela', title: 'Centinelas caídos', text: 'Una patrulla de centinelas no volvió de {d}. Recupera {n} insignias para sus familias.', people: ['Centinela Aitor', 'Cazadora Irati', 'Minero Koldo'] },
  maldita: { item: 'colgante_familia', title: 'Recuerdos de familia', text: 'Los humanos de la Madriguera perdieron lo poco que tenían en {d}. Recupera {n} colgantes.', people: ['Nora la de los túneles', 'Bastian el huido', 'Escriba de hueso Ulm'] },
  coral: { item: 'cofre_naufragio', title: 'Restos del naufragio', text: 'Los pescadores juran que en {d} hay cofrecillos de un barco hundido. Trae {n}.', people: ['Grumete Pepe', 'Buzo Hernán', 'Pescadora Iria'] },
  inframundo: { item: 'piedra_azufre', title: 'Azufre para la forja', text: 'El herrero de lava necesita piedras de azufre de {d}. Trae {n}.', people: ['Desertor Grak', 'Diablilla Sil', 'Desertor Murr'] },
  cielo: { item: 'pluma_dorada', title: 'Plumas del Coro', text: 'Los ángeles sin alas quieren plumas doradas de {d}, para recordar lo que les quitaron. Trae {n}.', people: ['Ángel sin alas Erel', 'Ángel sin alas Mir', 'Ángel sin alas Taniel'] },
};
const TAKEN_ERRAND = { item: 'estandarte_legion', title: 'Quemar los estandartes', text: 'La ciudad es libre, pero en sus calles quedan estandartes de la Legión. Vuelve a recorrerlas (desde el mapa) y trae {n} para quemarlos en la plaza.' };
/** «la Cueva Goteante», «los Ríos de Fuego», «el Paso Helado»... (sin artículo si es una ciudad o ya lo lleva). */
function withArticle(name: string): string {
  const first = name.split(' ')[0];
  if (/^(El|La|Los|Las|Bajo)$/.test(first)) return first === 'Bajo' ? name : first.toLowerCase() + name.slice(first.length);
  if (/ tomad[ao]$/.test(name)) return `las calles de ${name.replace(/ tomad[ao]$/, '')}`;
  if (/^(Alba|Babel)/.test(first)) return name;
  const fem = /a$|^(Torre|Llanura|Ciudadela|Cumbre|Senda|Grieta|Hondonada|Ciénaga|Escalinata|Puerta|Veta|Guarida)$/.test(first);
  if (first.endsWith('s')) return `${/as$/.test(first) ? 'las' : 'los'} ${name}`;
  return `${fem ? 'la' : 'el'} ${name}`;
}
const article = (name: string, prep: 'de' | 'en' | 'a') => {
  const w = withArticle(name);
  if (w.startsWith('el ') && prep !== 'en') return `${prep === 'de' ? 'del' : 'al'} ${w.slice(3)}`;
  return `${prep} ${w}`;
};
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function fillDungeonQuests() {
  const entries: { dungeon: string; giver: string; requires: string[]; taken: boolean }[] = [
    ...DUNGEON_SPOTS.map((s) => ({ dungeon: s.dungeon, giver: s.from, requires: s.requires ?? [], taken: false })),
    ...ROUTES.map((r) => ({ dungeon: r.dungeon, giver: r.a, requires: r.requires ?? [], taken: false })),
    ...Object.values(LOCATIONS).flatMap((l) => (l.taken ? [{ dungeon: l.taken.dungeon, giver: l.id, requires: [] as string[], taken: true }] : [])),
  ];
  for (const e of entries) {
    const def = DUNGEONS[e.dungeon];
    if (def.practice || LOCATIONS[e.giver].kind === 'torre') continue;
    const chain = dungeonChain(e.dungeon);
    const ids = chain.map((d) => d.id);
    const mine = QUESTS.filter((q) => q.type === 'side' && 'dungeon' in q.objective && !!q.objective.dungeon && ids.includes(q.objective.dungeon));
    const want = chain.some((d) => d.boss) ? 3 : 2;
    if (mine.length >= want) continue;
    // Después de la misión principal que pasa por aquí, si la hay (para no adelantarse a la historia).
    const story = QUESTS.find((q) => q.type === 'main' && 'dungeon' in q.objective && q.objective.dungeon === e.dungeon);
    const requires = [...e.requires, ...(story ? [`done:${story.id}`] : [])];
    const lv = Math.max(...chain.map((d) => d.levels[1]));
    const reward = (k: number): Rewards => ({
      gold: Math.round((60 + lv * lv * 2.2) * (1 + k * 0.15) / 10) * 10,
      items: lv < 10 ? { pocion: 2 } : lv < 18 ? { pocion_mayor: 2 } : lv < 26 ? { pocion_suprema: 1 } : { pocion_suprema: 2, elixir_mayor: 1 },
    });
    const region = LOCATIONS[e.giver].region;
    const errand = REGION_ERRANDS[region] ?? REGION_ERRANDS.frontera;
    const town = (LOCATIONS[e.giver].kind === 'refugio' ? 'el ' : '') + LOCATIONS[e.giver].name;
    const dn = def.name;
    const used = new Set(mine.map((q) => q.objective.kind === 'kill' ? q.objective.monster : ''));
    const monsters = [...new Map(chain.flatMap((d) => d.monsters).map((m) => [m.id, m])).values()]
      .filter((m) => PLURAL[m.id] && !used.has(m.id))
      .sort((a, b) => b.weight - a.weight);
    const makers: (() => QuestDef | null)[] = [
      () => {
        const m = monsters.shift();
        if (!m) return null;
        const n = 5 + Math.min(5, Math.floor(lv / 5));
        const p = PLURAL[m.id];
        const texts = [
          `${cap(p)} ${article(dn, 'de')} amenazan ${town}. Elimina ${n} allí.`,
          `En ${town} pagan por cada uno: elimina ${n} ${p} ${article(dn, 'en')}.`,
          `Nadie se atreve a acercarse ${article(dn, 'a')} por culpa de los ${p}. Elimina ${n}.`,
        ];
        const titles = ['Batida', 'Plaga', 'Caza', 'Limpieza'];
        return side(`sq_${e.dungeon}_caza`, `${titles[(dn.length + n) % titles.length]} ${article(dn, 'en')}`, e.giver, requires,
          texts[dn.length % texts.length], { kind: 'kill', monster: m.id, count: n, dungeon: chain[0].id === e.dungeon && chain.length === 1 ? e.dungeon : chain.find((d) => d.monsters.some((x) => x.id === m.id))!.id }, reward(0));
      },
      () => {
        const n = 3 + (lv % 2);
        const er = e.taken ? TAKEN_ERRAND : errand;
        return side(`sq_${e.dungeon}_recoger`, `${er.title} (${dn})`, e.giver, requires,
          er.text.replace('{d}', withArticle(dn)).replace('{n}', String(n)), { kind: 'collect', dungeon: e.dungeon, item: er.item, count: n }, reward(1));
      },
      () => {
        const who = errand.people[dn.length % errand.people.length];
        const floor = Math.min(2, def.floors);
        return side(`sq_${e.dungeon}_rescate`, `Rescate ${article(dn, 'en')}`, e.giver, requires,
          `${who} entró ${article(dn, 'en')} y no ha vuelto; su rastro se pierde en el piso ${floor}${chain.length > 1 ? ' del primer tramo' : ''}. Ve en su busca.`, { kind: 'rescue', dungeon: e.dungeon, floor, npc: who }, reward(2));
      },
    ];
    // Primero lo que aún no tiene (si ya hay una de recoger, no otra).
    const has = new Set(mine.map((q) => q.objective.kind));
    const order = makers.filter((_, i) => !has.has((['kill', 'collect', 'rescue'] as const)[i]));
    for (let i = 0, made = mine.length; made < want && i < order.length; i++) {
      const q = order[i]();
      if (q && !QUESTS.some((x) => x.id === q.id)) {
        QUESTS.push(q);
        made++;
      }
    }
  }
}
fillDungeonQuests();

export const QUEST_BY_ID: Record<string, QuestDef> = Object.fromEntries(QUESTS.map((q) => [q.id, q]));
