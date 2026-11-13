/**
 * Arte 8-bit generado por código: plantillas de 16x16 con letras como píxeles y paletas intercambiables.
 * '.' = transparente. Para reemplazar por arte real, basta con cargar PNG con las mismas claves.
 */
import { CLASSES } from '../data/characters';
import { POSES, humanPose, isBackPose, monsterPose } from './facing';
import { LOCK_COLORS, TRAPS } from '../data/traps';

type Palette = Record<string, string>;
type Overlay = [number, number, string][];

const OUTLINE = '#140f18';

const BODY = [
  '................',
  '.....KKKKKK.....',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
  '...KHSSSSSSHK...',
  '...KSSESSESSK...',
  '....KSSSSSSK....',
  '.....KKSSKK.....',
  '....KCCCCCCK....',
  '...KCKCDDCKCK...',
  '...KSKCCCCKSK...',
  '....KKCCCCKK....',
  '....KDDDDDDK....',
  '....KDDKKDDK....',
  '....KBBKKBBK....',
  '....KKK..KKK....',
];

const HOOD = [
  '................',
  '.....KKKKKK.....',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
  '...KHHSSSSHHK...',
  '...KHSESSESHK...',
  '...KHSSSSSSHK...',
  '...KHKKSSKKHK...',
  '...KHCCCCCCHK...',
  '...KCKCDDCKCK...',
  '...KSKCCCCKSK...',
  '....KCCCCCCK....',
  '....KCCCCCCK....',
  '...KCCCCCCCCK...',
  '...KDDDDDDDDK...',
  '...KKKKKKKKKK...',
];

const LONG_HAIR = [
  '................',
  '.....KKKKKK.....',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
  '...KHSSSSSSHK...',
  '...KHSESSESHK...',
  '...KHSSSSSSHK...',
  '...KHHKSSKHHK...',
  '...KHCCCCCCHK...',
  '...KCKCDDCKCK...',
  '...KSKCCCCKSK...',
  '....KCCCCCCK....',
  '....KCCCCCCK....',
  '...KCCCCCCCCK...',
  '...KDDDDDDDDK...',
  '...KKKKKKKKKK...',
];

const CHILD = [
  '................',
  '................',
  '................',
  '................',
  '.....KKKKKK.....',
  '....KHHHHHHK....',
  '....KHSSSSHK....',
  '....KSESSESK....',
  '.....KSSSSK.....',
  '....KKCCCCKK....',
  '...KSKCDDCKSK...',
  '.....KCCCCK.....',
  '.....KDDDDK.....',
  '.....KDKKDK.....',
  '.....KBKKBK.....',
  '.....KK..KK.....',
];

/** Cabezas propias de los miembros del gremio: el resto del cuerpo es el de BODY (o CHILD). */
const withHead = (base: string[], head: string[]): string[] => [...head, ...base.slice(head.length)];

/** Aren: pelo de punta y la bufanda roja (R) que nunca se quita. */
const AREN = withHead(BODY, [
  '....K..KK..K....',
  '...KHKKHHKKHK...',
  '..KHHHHHHHHHHK..',
  '..KHHHHHHHHHHK..',
  '...KHSSSSSSHK...',
  '...KSSESSESSK...',
  '....KSSSSSSK....',
  '.....KKSSKK.....',
  '....KRRRRRRK....',
]);

/** Bram: pelo rubio peinado hacia arriba en forma de pirámide y camiseta roja sin mangas. */
const BRAM = withHead(BODY, [
  '.......KK.......',
  '......KHHK......',
  '.....KHHHHK.....',
  '....KHHHHHHK....',
  '...KHSSSSSSHK...',
  '...KSSESSESSK...',
  '....KSSSSSSK....',
  '.....KKSSKK.....',
  '....KCCCCCCK....',
  '...KSKCDDCKSK...',
]);

/** Garrick: canoso, barba y un parche (P) en el ojo izquierdo. */
const GARRICK = withHead(BODY, [
  '................',
  '.....KKKKKK.....',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
  '...KHPSSSSSHK...',
  '...KSPPSSESSK...',
  '...KHHSSSSHHK...',
  '....KHHHHHHK....',
]);

/** Garrick en su forma verdadera (acto 6): los mismos rasgos, con cuernos (Z). */
const GARRICK_DEMON = withHead(BODY, [
  '...KZ......ZK...',
  '...KZKKKKKKZK...',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
  '...KHPSSSSSHK...',
  '...KSPPSSESSK...',
  '...KHHSSSSHHK...',
  '....KHHHHHHK....',
]);

/** Kaela: cinta en la frente (R) y coleta. */
const KAELA = withHead(BODY, [
  '................',
  '.....KKKKKK.....',
  '....KHHHHHHK....',
  '...KRRRRRRRRK...',
  '..KKHSSSSSSHK...',
  '.KHKSSESSESSK...',
  '.KHKKSSSSSSK....',
  '..KK.KKSSKK.....',
]);

/**
 * Esqueletos del grupo: calavera (S, E ojos que brillan) y huesos en lugar de ropa (C, D articulaciones).
 * Sin pelo: H es también hueso, para que de espaldas se vea el cráneo.
 */
const SKELETON = [
  '................',
  '.....KKKKKK.....',
  '....KSSSSSSK....',
  '...KSSSSSSSSK...',
  '...KSEESSEESK...',
  '...KSSSKKSSSK...',
  '....KSKSKSKK....',
  '.....KKKKKK.....',
  '...K.KCCCCK.K...',
  '..KCKKCDDCKKCK..',
  '..KCK.KCCK.KCK..',
  '...K.KCDDCK.K...',
  '.....KCCCCK.....',
  '.....KCKKCK.....',
  '....KCCK.KCCK...',
  '....KKKK.KKKK...',
];

/** Odric: esqueleto de huesos azules (agua) con sus gafas redondas (O). */
const ODRIC = withHead(SKELETON, [
  '................',
  '.....KKKKKK.....',
  '....KSSSSSSK....',
  '...KSSSSSSSSK...',
  '...KOEOSSOEOK...',
]);

/** Seren: esqueleto de huesos color tierra. */
const SEREN = SKELETON;

/** Vael: un demonio; capucha oscura con cuernos (Z) y una grieta violeta (J) que le cruza la mejilla. */
const VAEL = withHead(HOOD, [
  '....KZ....ZK....',
  '....KZKKKKZK....',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
  '...KHHSSSSHHK...',
  '...KHSESSESHK...',
  '...KHSSSJSSHK...',
]);

/** Hale: el comandante, con un mostacho canoso. */
const HALE = withHead(BODY, [
  '................',
  '.....KKKKKK.....',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
  '...KHSSSSSSHK...',
  '...KSSESSESSK...',
  '....KHHHHHHK....',
]);

/** Pip: un crío despeinado con un pañuelo de ladrón (M) tapándole la boca. */
const PIP = withHead(CHILD, [
  '................',
  '................',
  '.......K..K.....',
  '....KKKHKKHK....',
  '...KHHHHHHHHK...',
  '....KHHHHHHK....',
  '....KHSSSSHK....',
  '....KSESSESK....',
  '.....KMMMMK.....',
]);

/** Adulto con pañuelo de ladrón (M) en la boca: los bandidos. */
const PIP_ADULT = withHead(BODY, [
  '................',
  '.....KKKKKK.....',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
  '...KHSSSSSSHK...',
  '...KSSESSESSK...',
  '....KMMMMMMK....',
]);

const vline = (x: number, y0: number, y1: number, c: string): Overlay => Array.from({ length: y1 - y0 + 1 }, (_, i) => [x, y0 + i, c]);

const WEAPONS: Record<string, Overlay> = {
  sword: [...vline(13, 2, 9, 'W'), [12, 10, 'G'], [13, 10, 'G'], [14, 10, 'G'], [13, 11, 'N']],
  hammer: [...vline(13, 5, 12, 'N'), [12, 2, 'W'], [13, 2, 'W'], [14, 2, 'W'], [12, 3, 'W'], [13, 3, 'W'], [14, 3, 'W'], [12, 4, 'W'], [13, 4, 'W'], [14, 4, 'W'], [15, 3, 'K']],
  staff: [...vline(13, 2, 14, 'N'), [13, 1, 'J'], [12, 2, 'J'], [14, 2, 'J'], [13, 0, 'K']],
  bow: [[13, 3, 'N'], [14, 4, 'N'], [14, 5, 'N'], [15, 6, 'N'], [15, 7, 'N'], [15, 8, 'N'], [14, 9, 'N'], [14, 10, 'N'], [13, 11, 'N'], ...vline(13, 4, 10, 'w')],
  dagger: [...vline(13, 7, 9, 'W'), [12, 10, 'G'], [13, 10, 'G'], [14, 10, 'G']],
  spear: [...vline(13, 2, 14, 'N'), [13, 0, 'W'], [13, 1, 'W'], [12, 2, 'W'], [14, 2, 'W']],
  axe: [...vline(13, 4, 12, 'N'), [14, 3, 'W'], [15, 3, 'W'], [14, 4, 'W'], [15, 4, 'W'], [14, 5, 'W'], [15, 5, 'W'], [12, 4, 'W']],
  stick: vline(12, 7, 10, 'N'),
  shield: [[1, 8, 'K'], [2, 8, 'K'], [3, 8, 'K'], [4, 8, 'K'], [1, 9, 'Y'], [2, 9, 'Y'], [3, 9, 'G'], [4, 9, 'Y'], [1, 10, 'Y'], [2, 10, 'G'], [3, 10, 'G'], [4, 10, 'Y'], [1, 11, 'Y'], [2, 11, 'Y'], [3, 11, 'G'], [4, 11, 'Y'], [2, 12, 'K'], [3, 12, 'K']],
};

const HUMAN_BASE: Palette = { K: OUTLINE, S: '#e8b48a', E: '#2a1e2e', B: '#3a2a22', W: '#cfd3dc', G: '#d9a940', N: '#7a4e2c', J: '#ffe680', Y: '#6b7f9a', w: '#e8e0d0' };

interface Humanoid {
  body: string[];
  hair: string;
  cloth: string;
  clothDark: string;
  weapons: string[];
  extra?: Palette;
}

const HUMANS: Record<string, Humanoid> = {
  p_bram: { body: BRAM, hair: '#f4d848', cloth: '#c8343a', clothDark: '#3a3034', weapons: ['hammer'] },
  p_lysa: { body: HOOD, hair: '#e8e0d0', cloth: '#d8d0c0', clothDark: '#a89c88', weapons: ['staff'], extra: { J: '#ffe680' } },
  p_garrick: { body: GARRICK, extra: { P: '#1a1418' }, hair: '#9a9a9a', cloth: '#5a5f68', clothDark: '#3a3e45', weapons: ['sword', 'shield'] },
  p_kaela: { body: KAELA, extra: { R: '#c8343a' }, hair: '#2a2a2a', cloth: '#3f6a3a', clothDark: '#284526', weapons: ['bow'] },
  p_odric: { body: ODRIC, hair: '#8ab8e8', cloth: '#8ab8e8', clothDark: '#3a6aa8', weapons: ['staff'], extra: { S: '#8ab8e8', J: '#7fc8ff', O: '#d9a940', E: '#40e0ff' } },
  p_pip: { body: PIP, extra: { M: '#7a7a8a' }, hair: '#9a5a2a', cloth: '#4a3a50', clothDark: '#2e2433', weapons: ['dagger'] },
  p_seren: { body: SEREN, hair: '#c8a070', cloth: '#c8a070', clothDark: '#7a5a32', weapons: ['sword', 'shield'], extra: { S: '#c8a070', E: '#ffb040' } },
  p_vael: { body: VAEL, hair: '#151018', cloth: '#2a1f30', clothDark: '#170f1c', weapons: ['staff'], extra: { Z: '#d8d0c8', J: '#c070ff', E: '#c070ff', S: '#3a2a40' } },
  p_hale: { body: HALE, hair: '#c8c8c8', cloth: '#6a6f7a', clothDark: '#41454d', weapons: ['sword'] },
  p_elder: { body: HOOD, hair: '#6a5a48', cloth: '#5a4a3a', clothDark: '#3a2f25', weapons: ['staff'], extra: { J: '#9a8a70', S: '#d8a880' } },
  p_guard: { body: BODY, hair: '#4a4038', cloth: '#5a6270', clothDark: '#3a404a', weapons: ['spear'] },
  p_woman: { body: LONG_HAIR, hair: '#7a4a2a', cloth: '#6a4a5a', clothDark: '#45303b', weapons: [] },
  p_woman2: { body: LONG_HAIR, hair: '#2a2a30', cloth: '#3f5a5a', clothDark: '#283b3b', weapons: [] },
  p_child: { body: CHILD, hair: '#c08040', cloth: '#5a7a4a', clothDark: '#3a5230', weapons: ['stick'] },
  p_girl: { body: CHILD, hair: '#e0c060', cloth: '#a04a5a', clothDark: '#6a2f3b', weapons: [] },
  p_merchant: { body: BODY, hair: '#3a2a20', cloth: '#8a6a2a', clothDark: '#5a4418', weapons: [] },
  p_old: { body: BODY, hair: '#d8d8d8', cloth: '#4a4a5a', clothDark: '#30303b', weapons: ['staff'], extra: { J: '#8a7a6a' } },
  p_lumberjack: { body: BODY, hair: '#6a3a1a', cloth: '#8a3a2a', clothDark: '#5a241a', weapons: ['axe'] },
  p_hunter: { body: BODY, hair: '#8a8a80', cloth: '#5a5a3a', clothDark: '#3a3a24', weapons: ['bow'] },
  p_fisher: { body: BODY, hair: '#4a3a2a', cloth: '#3a5a7a', clothDark: '#243a50', weapons: ['spear'] },
  p_npc: { body: BODY, hair: '#5a4030', cloth: '#7a6a4a', clothDark: '#544830', weapons: [] },
  m_drowned: { body: BODY, hair: '#1e2a2a', cloth: '#2f4f4f', clothDark: '#1d3333', weapons: [], extra: { S: '#7a9a88', E: '#e8e070' } },
  b_garrick: { body: GARRICK_DEMON, hair: '#5a5a62', cloth: '#3a2a2a', clothDark: '#1a1010', weapons: ['sword', 'shield'], extra: { P: '#1a1418', E: '#ff2020', S: '#8a6a6a', Z: '#e8e0d0' } },
  // Humanos enemigos: la Hermandad del Hueso (capucha negra con huesos), sus clérigos, los bandidos (pañuelo) y su sumo sacerdote.
  m_cultist: { body: HOOD, hair: '#2a2628', cloth: '#3a3436', clothDark: '#d8d0b8', weapons: ['dagger'], extra: { S: '#1a1418', E: '#ff5040' } },
  m_inquisitor: { body: HOOD, hair: '#4a1a2a', cloth: '#5a2236', clothDark: '#d8d0b8', weapons: ['staff'], extra: { J: '#d8d0b8', S: '#1a1418', E: '#ff5040' } },
  m_bandit: { body: PIP_ADULT, hair: '#4a3020', cloth: '#5a4a3a', clothDark: '#3a2e24', weapons: ['dagger'], extra: { M: '#2a2a30' } },
  b_priest: { body: HOOD, hair: '#d8d0b8', cloth: '#1a1418', clothDark: '#d8d0b8', weapons: ['staff'], extra: { J: '#ff5040', S: '#e0dccf', E: '#ff3030' } },
};

for (const c of Object.values(CLASSES)) {
  HUMANS[`p_aren_${c.id}`] = { body: AREN, hair: '#8a5a3a', cloth: c.color, clothDark: shade(c.color, -0.35), weapons: ['sword'], extra: { R: '#c8343a' } };
}

const MONSTER_TEMPLATES: Record<string, string[]> = {
  slime: [
    '................', '................', '................', '................', '................',
    '.......KK.......', '.....KKAAKK.....', '....KALLAAAK....', '...KALLAAAAAK...', '...KAAEAAEAAK...',
    '..KAAAEAAEAAAK..', '..KAAAAAAAAAAK..', '..KBAAAAAAAABK..', '..KBBBAAAABBBK..', '...KKKKKKKKKK...', '................',
  ],
  bat: [
    '................', '................', '................', '................', '.K............K.',
    '.KK....KK....KK.', '.KAK..KAAK..KAK.', '.KAAKKAAAAKKAAK.', 'KAAAAAAEAEAAAAAK', 'KABAAAAAAAAAABAK',
    'KB.KBAAAAAABK.BK', 'K...K.KAAK.K...K', '.......KK.......', '................', '................', '................',
  ],
  skeleton: [
    '................', '.....KKKKKK.....', '....KWWWWWWK....', '...KWWWWWWWWK...', '...KWEEWWEEWK...',
    '...KWWWKKWWWK...', '....KWKWKWKK....', '.....KKKKKK.....', '...K.KWWWWK.K...', '..KWKKWKKWKKWK..',
    '..KWK.KWWK.KWK..', '...K.KWKKWK.K...', '.....KWWWWK.....', '.....KWKKWK.....', '....KWWK.KWWK...', '....KKK...KKK...',
  ],
  wolf: [
    '................', '................', '................', '..KK............', '..KAK...........',
    '.KAAAKKKKKKKK...', 'KAEAAAAAAAAAAK..', 'KAAAAAAAAAAAAAK.', '.KKBAAAAAAAAAAK.', '...KBAAAAAAAABAK',
    '....KBBKKKBBK.KK', '....KAK...KAK...', '....KAK...KAK...', '....KKK...KKK...', '................', '................',
  ],
  shroom: [
    '................', '................', '.....KKKKKK.....', '...KKAALAAAKK...', '..KAALLAAAALAK..',
    '.KAAAAAAALLAAAK.', '.KALLAAAAAAAAAK.', '.KKKKKKKKKKKKKK.', '....KSSSSSSK....', '....KSESSESK....',
    '....KSSSSSSK....', '....KSSSSSSK....', '...KSSSSSSSSK...', '...KKKKKKKKKK...', '................', '................',
  ],
  wisp: [
    '................', '.......K........', '......KBK.......', '.....KBBK.K.....', '....KBBABKBK....',
    '....KBAAABBK....', '...KBAALLABBK...', '...KBALLLLABK...', '...KBALELEABK...', '...KBAALLAABK...',
    '....KBAAAABK....', '.....KBBBBK.....', '......KKKK......', '................', '................', '................',
  ],
  spider: [
    '................', '................', '................', '.K...K....K...K.', '..K..K.KK.K..K..',
    '...K.KKAAKK.K...', 'KK..KAAAAAAK..KK', '..KKAEAEEAEAKK..', '....KAAAAAAK....', 'KKKKAAAAAAAAKKKK',
    '...KAAABBAAAK...', '..K.KAAAAAAK.K..', '.K...KKAAKK...K.', 'K.....K..K.....K', '................', '................',
  ],
  ghost: [
    '................', '.....KKKKKK.....', '....KAAAAAAK....', '...KAAAAAAAAK...', '...KAEEAAEEAK...',
    '...KAEEAAEEAK...', '..KAAAAAAAAAAK..', '..KAAAAKKAAAAK..', '..KAAAAAAAAAAK..', '.KAAAAAAAAAAAAK.',
    '.KBAAAAAAAAAABK.', '.KBBAAAAAAAABBK.', '.KBBBAABBAABBBK.', '.KBK.KBKKBK.KBK.', '.KK...KK..KK.KK.', '................',
  ],
  reaper: [
    '......wwwwwwwN..', '....KKKKK..wwN..', '...KAAAAAK...N..', '..KAAWWWAAK..N..', '..KAWEWEWAK..N..',
    '..KAWWKWWAK..N..', '..KAAWWWAAK..N..', '..KBAAAAABKK.N..', '.KBAAAAAAAAAKN..', '.KBAAAAAAABKKN..',
    '.KBAAAAAAABK.N..', '.KBBAAAAABBK.N..', 'KBBAAAAAAABBKN..', 'KBBBAABAABBBKN..', 'KBK.KBKKBK.KBN..', 'KK...KK..KK.KK..',
  ],
  scorpion: [
    '................', '................', '.K............K.', 'KAK..........KAK', 'KAAK........KAAK', '.KAAK..KK..KAAK.',
    '..KKAKKAAKKAKK..', '....KAEAAEAK....', '..KKAAAAAAAAKK..', '.KAKAABBBBAAKAK.', 'KA.KAABBBBAAK.AK', '...KAAAAAAAAK...',
    '..K.KKAAAAKK.K..', '.K....KAAK....K.', '.......KK.......', '................',
  ],
  serpent: [
    '................', '.....KKKK.......', '....KAAAAK......', '...KAEAAEAK.....', '...KAAWWAAK.....', '....KAAAAK......',
    '.....KAAK...KK..', '....KAAK...KAAK.', '...KAAK...KAAK..', '...KAAK..KAAK...', '....KAAKKAAK....', '.....KAAAAK.....',
    '......KBBK......', '.......KK.......', '................', '................',
  ],
  eye: [
    '................', '.....KKKKKK.....', '...KKLLLLLLKK...', '..KLLAAAAAALLK..', '.KLAABBBBBBAALK.', '.KLABBKKKKBBALK.',
    'KLAABKEEEEKBAALK', 'KLAABKEWWEKBAALK', 'KLAABKEEEEKBAALK', '.KLABBKKKKBBALK.', '.KLAABBBBBBAALK.', '..KLLAAAAAALLK..',
    '...KKLLLLLLKK...', '.....KKKKKK.....', '................', '................',
  ],
  // Un feto dormido dentro de su saco de luz, atado por el cordón a lo que hay detrás del trono.
  fetus: [
    '.....LLLLLJ.....', '...LLFFFFFJLL...', '..LFFKKKKFFJFL..', '.LFFKAAAAKFJFFL.',
    '.LFKAAAAAAKFJFL.', 'LFFKAWAAAAKFJFFL', 'LFFKAEEAAAKFJFFL', 'LFFKAAAAAAKKJFFL',
    'LFFFKAAAABAAJKFL', 'LFFFFKABAAAAAKFL', 'LFFFKBAAKAAAAKFL', '.LFFKAAKKAAAKFL.',
    '.LFFFKKAAAAKFFL.', '..LFFFFKKKKFFL..', '...LLFFFFFFLL...', '.....LLLLLL.....',
  ],
  imp: [
    '................', '................', '....K......K....', '...KAK....KAK...', '...KAAKKKKAAK...',
    '....KAAAAAAK....', '....KAEAAEAK....', '....KAAWWAAK....', '.....KAAAAK.....', '...KKKBAABKKK...',
    '..KBK.KAAK.KBK..', '.....KAAAAK.....', '.....KAKKAK..K..', '....KAAK.KAAKAK.', '....KKK...KKKK..', '................',
  ],
  demon: [
    '..K..........K..', '..KAK.KKKK.KAK..', '...KAKAAAAKAK...', '....KAEAAEAK....', '.KK.KAAWWAAK.KK.',
    'KBBKKKAAAAKKKBBK', 'KBBBKAAAAAAKBBBK', 'KBBKAAAAAAAAKBBK', '.KK.KAABBAAK.KK.', '....KAAAAAAK....',
    '....KAAKKAAK....', '...KAAK..KAAK...', '...KBBK..KBBK...', '...KKKK..KKKK...', '................', '................',
  ],
  cherub: [
    '....JJJJJJJJ....', '.....KKKKKK.....', '....KHHHHHHK....', '....KHSSSSHK....', '....KSESSESK....',
    '.KK..KSSSSK..KK.', 'KWWK.KKAAKK.KWWK', 'KWWWKAAAAAAKWWWK', '.KWWKAAAAAAKWWK.', '..KK.KAAAAK.KK..',
    '.....KAAAAK.....', '......KSSK......', '......KKKK......', '................', '................', '................',
  ],
  angel: [
    '.....JJJJJJ.....', '......KKKK......', '.....KHHHHK.....', '.....KSESEK.....', 'KK...KSSSSK...KK',
    'KWK.KKAAAAKK.KWK', 'KWWKAAAAAAAAKWWK', 'KWWWKAALLAAKWWWK', '.KWWKAAAAAAKWWK.', '..KWKAAAAAAKWK..',
    '...KKAAAAAAKK...', '....KAAAAAAK....', '....KAAKKAAK....', '....KBBK.KBBK...', '....KKKK.KKKK...', '................',
  ],
  golem: [
    '................', '....KKKKKKKK....', '...KAAAAAAAAK...', '...KAEEAAEEAK...', '...KAAAAAAAAK...',
    '..KKBBBBBBBBKK..', '.KAAKAAAAAAKAAK.', '.KAAKAAJJAAKAAK.', '.KAAKAAAAAAKAAK.', '.KBBKBBBBBBKBBK.',
    '..KK.KAAAAK.KK..', '.....KAKKAK.....', '....KAAK.KAAK...', '....KBBK.KBBK...', '....KKKK.KKKK...', '................',
  ],
  mimic: [
    '................', '................', '...KKKKKKKKKK...', '..KBAAAAAAAABK..', '..KBAEAAAAEABK..',
    '..KBAAAAAAAABK..', '..KKWKWKWKWKKK..', '..KRRRRRRRRRRK..', '..KWKWKWKWKWKK..', '..KBAAAGGAAABK..',
    '..KBAAAKKAAABK..', '..KBAAAAAAAABK..', '..KBBBBBBBBBBK..', '...KKKKKKKKKK...', '................', '................',
  ],
  gargoyle: [
    '................', '..K..........K..', '..KK.KKKKKK.KK..', '..KAKAAAAAAKAK..', 'KKKAAEAAAAEAAKKK',
    'KAAKAAAKKAAAKAAK', 'KAAAKAAAAAAKAAAK', '.KAAAKAAAAKAAAK.', '..KKAAAAAAAAKK..', '...KAABAABAAK...',
    '...KAAAAAAAAK...', '...KBAAKKAABK...', '...KAAK..KAAK...', '..KAAAK..KAAAK..', '..KKKKK..KKKKK..', '................',
  ],
};

/** `profile`: dibujado de perfil (mirando a la izquierda); sus poses solo se giran. */
const MONSTERS: Record<string, { tpl: string; pal: Palette; overlay?: Overlay; profile?: boolean }> = {
  m_slime: { tpl: 'slime', pal: { A: '#3f8fd8', B: '#2a5f9a', L: '#9fd4ff', E: OUTLINE } },
  m_bat: { tpl: 'bat', pal: { A: '#5a4a6a', B: '#3a2f45', E: '#ff5050' } },
  m_skeleton: { tpl: 'skeleton', pal: { W: '#e0dccf', E: '#ff4040' } },
  m_skel_archer: { tpl: 'skeleton', pal: { W: '#cfc8b0', E: '#ffb040', N: '#7a4e2c', w: '#e8e0d0' }, overlay: WEAPONS.bow },
  m_wolf: { tpl: 'wolf', pal: { A: '#6a6058', B: '#433c36', E: '#ffd040' }, profile: true },
  m_shroom: { tpl: 'shroom', pal: { A: '#9a3a5a', L: '#e8c0d0', S: '#d8d0b8', E: OUTLINE } },
  m_wisp: { tpl: 'wisp', pal: { A: '#ff8a3d', B: '#b8452f', L: '#ffe680', E: OUTLINE } },
  m_spider: { tpl: 'spider', pal: { A: '#4a3a2a', B: '#2a2018', E: '#ff4040' } },
  m_ghost: { tpl: 'ghost', pal: { A: '#b8c0d8', B: '#7a84a0', E: '#1a1020' } },
  m_gargoyle: { tpl: 'gargoyle', pal: { A: '#7a7a82', B: '#4f4f56', E: '#ff5040' } },
  b_spider: { tpl: 'spider', pal: { A: '#5a2a6a', B: '#2a1030', E: '#ff3060' } },
  b_guardian: { tpl: 'gargoyle', pal: { A: '#3a2030', B: '#200e18', E: '#ff2020' } },
  m_scorpion: { tpl: 'scorpion', pal: { A: '#c89a4a', B: '#7a5a2a', E: '#ff3030' } },
  b_scorpion: { tpl: 'scorpion', pal: { A: '#d8b040', B: '#7a3a1a', E: '#ff2060' } },
  m_serpent: { tpl: 'serpent', pal: { A: '#3a8a9a', B: '#1a4a5a', E: '#ffe040', W: '#f0e8d8' } },
  m_archangel: { tpl: 'angel', pal: { A: '#e8d070', B: '#a88a3a', H: '#fff0b0', S: '#f0c8a0', E: '#3a7ad8', W: '#ffffff', J: '#ffe680', L: '#ffffff' } },
  b_eye: { tpl: 'eye', pal: { A: '#4a1a5a', B: '#2a0a3a', L: '#c070ff', E: '#ff3060', W: '#ffffff' } },
  b_god: { tpl: 'fetus', pal: { A: '#f0c0b0', B: '#c88878', F: '#fff4d0', L: '#ffe680', J: '#c83a4a', E: '#6a3a30', W: '#ffffff' } },
  b_morgath: { tpl: 'demon', pal: { A: '#3a6a9a', B: '#1a2a4a', E: '#e0f8ff', W: '#ffffff' } },
  b_ixa: { tpl: 'imp', pal: { A: '#8ad0e8', B: '#3a7a9a', E: '#ffffff', W: '#f0e8d8' } },
  b_bone_king: { tpl: 'skeleton', pal: { W: '#e8d080', E: '#ff3030' } },
  b_captain: { tpl: 'demon', pal: { A: '#6a6a78', B: '#2a2a34', E: '#ff5030', W: '#ffb040' } },
  b_hound: { tpl: 'wolf', pal: { A: '#a82a1a', B: '#5a1008', E: '#ffe040' }, profile: true },
  b_fire_queen: { tpl: 'demon', pal: { A: '#e86a2a', B: '#8a2a0a', E: '#ffffff', W: '#ffe680' } },
  b_demon_king: { tpl: 'demon', pal: { A: '#1a1018', B: '#d9a940', E: '#ff2020', W: '#ffe680' } },
  b_angel_espada: { tpl: 'angel', pal: { A: '#b8e8c8', B: '#4a9a6a', H: '#e8f8f0', S: '#f0c8a0', E: '#1a5a3a', W: '#ffffff', J: '#ffe680', L: '#ffffff' } },
  b_angel_escudo: { tpl: 'angel', pal: { A: '#d8c090', B: '#8a6a3a', H: '#f0e0b0', S: '#e8b88a', E: '#5a3a1a', W: '#ffffff', J: '#ffe680', L: '#ffe680' } },
  b_angel_balanza: { tpl: 'angel', pal: { A: '#a8c8f0', B: '#3a5a9a', H: '#e0ecff', S: '#f0c8a0', E: '#1a2a6a', W: '#ffffff', J: '#ffe680', L: '#ffffff' } },
  b_angel_voz: { tpl: 'angel', pal: { A: '#fff0c0', B: '#d9a940', H: '#ffffff', S: '#f0c8a0', E: '#d9a940', W: '#ffffff', J: '#ffffff', L: '#ffe680' } },
  m_imp: { tpl: 'imp', pal: { A: '#c8343a', B: '#7a1a22', E: '#ffe040', W: '#f0e8d8' } },
  m_demon: { tpl: 'demon', pal: { A: '#5a2a4a', B: '#2a1020', E: '#ff3030', W: '#f0e8d8' } },
  m_cherub: { tpl: 'cherub', pal: { A: '#e8e0c8', H: '#f0d060', S: '#f0c8a0', E: '#3a7ad8', W: '#ffffff', J: '#ffe680' } },
  m_angel: { tpl: 'angel', pal: { A: '#d8d8e8', B: '#9a9ab0', H: '#f0e0a0', S: '#f0c8a0', E: '#3a7ad8', W: '#ffffff', J: '#ffe680', L: '#ffe680' } },
  b_varkhul: { tpl: 'demon', pal: { A: '#8a1a1a', B: '#2a0a0a', E: '#ffe040', W: '#ffb040' } },
  m_golem: { tpl: 'golem', pal: { A: '#8a8478', B: '#5a554c', E: '#ff3030', J: '#ff6040' } },
  m_mimic: { tpl: 'mimic', pal: { A: '#8a5a30', B: '#5a3a1a', E: '#ff4040', G: '#d9a940', W: '#f0e8d8', R: '#c83a4a' } },
  m_reaper: { tpl: 'reaper', pal: { A: '#2a2430', B: '#16121a', W: '#e8e0d0', E: '#ff2020', N: '#6a4a2a', w: '#c8d0d8' } },
  b_mist: { tpl: 'ghost', pal: { A: '#6a9aa8', B: '#3a6070', E: '#e8ffff' } },
};

const KEY_TPL = ['................', '................', '................', '.....KKKK.......', '....KAAAAK......', '...KAKKKKAK.....', '...KAK..KAKKKKKK', '...KAK..KAAAAAAK', '...KAKKKKAKKAKAK', '....KAAAAK.KAKAK', '.....KKKK...K.K.'];
const DOOR_TPL = ['KKKKKKKKKKKKKKKK', 'KBBBBBBBBBBBBBBK', 'KBAKBAKBAKBAKBAK', 'KBAKBAKBAKBAKBAK', 'KBAKBAKBAKBAKBAK', 'KBAKBAKKKKBAKBAK', 'KBAKBAKLLLKKKBAK', 'KBAKBAKLKLKAKBAK', 'KBAKBAKLLLKAKBAK', 'KBAKBAKLKLKAKBAK', 'KBAKBAKLLLKAKBAK', 'KBAKBAKKKKBAKBAK', 'KBAKBAKBAKBAKBAK', 'KBAKBAKBAKBAKBAK', 'KBBBBBBBBBBBBBBK', 'KKKKKKKKKKKKKKKK'];
/** Palanca de la condición del piso (bajada = activada) y brasero (apagado o encendido). */
const LEVER_TPL = ['................', '................', '................', '................', '..........KK....', '.........KJJK...', '........KNK.....', '.......KNK......', '......KNK.......', '.....KNK........', '...KKKKKKKKKK...', '..KBAAAAAAAABK..', '..KBAAAAAAAABK..', '..KBBBBBBBBBBK..', '...KKKKKKKKKK...'];
const LEVER_ON_TPL = ['................', '................', '................', '................', '................', '................', '................', '................', '.KK.............', 'KJJKKKKKK.......', '.KK.KNNNNNNK....', '...KKKKKKKKKK...', '..KBAAAAAAAABK..', '..KBAAAAAAAABK..', '..KBBBBBBBBBBK..', '...KKKKKKKKKK...'];
const BRAZIER_TPL = ['................', '................', '................', '................', '................', '................', '...KKKKKKKKKK...', '...KLLLLLLLLK...', '..KAAAAAAAAAAK..', '..KBAAAAAAAABK..', '...KBBBBBBBBK...', '.....KAAAAK.....', '......KAAK......', '.....KAAAAK.....', '....KBBBBBBK....', '....KKKKKKKK....'];
const FLAME = ['................', '.......F........', '......FF..F.....', '.....FYF.FF.....', '....FFYYFYF.....', '....FYYWYYFF....', '...FFYWWWYYF....'];
const CHEST_TPL = ['................', '................', '................', '................', '...KKKKKKKKKK...', '..KBBBBBBBBBBK..', '..KBAAAAAAAABK..', '..KBAAAAAAAABK..', '..KKKKKGGKKKKK..', '..KBAAAGGAAABK..', '..KBAAAKKAAABK..', '..KBAAAAAAAABK..', '..KBAAAAAAAABK..', '..KBBBBBBBBBBK..', '...KKKKKKKKKK...'];
const ALTAR_TPL = ['................', '................', '................', '.....KKKKKK.....', '....KRRRRRRK....', '...KAAAAAAAAK...', '...KLLLLLLLLK...', '....KAAAAAAK....', '.....KAAAAK.....', '.....KARRAK.....', '.....KAAAAK.....', '....KAAAAAAK....', '...KBBBBBBBBK...', '...KKKKKKKKKK...'];
const FOUNTAIN_TPL = ['................', '.......KK.......', '......KLLK......', '.......LL.......', '......KAAK......', '......KAAK......', '...KKKKKKKKKK...', '..KAWWWWWWWWAK..', '..KAWLWWWLWWAK..', '..KBAAAAAAAABK..', '...KBBBBBBBBK...', '....KAAAAAAK....', '....KBBBBBBK....', '....KKKKKKKK....'];
const CRATE_TPL = ['................', '.KKKKKKKKKKKKKK.', '.KBAAAAAAAAAABK.', '.KABAAAAAAAABAK.', '.KAABAAAAAABAAK.', '.KAAABAAAABAAAK.', '.KAAAABAABAAAAK.', '.KAAAAABBAAAAAK.', '.KAAAAABBAAAAAK.', '.KAAAABAABAAAAK.', '.KAAABAAAABAAAK.', '.KAABAAAAAABAAK.', '.KABAAAAAAAABAK.', '.KBAAAAAAAAAABK.', '.KKKKKKKKKKKKKK.'];
const PLATE_TPL = ['................', '................', '................', '................', '................', '................', '................', '................', '................', '................', '..KKKKKKKKKKKK..', '..KLLLLLLLLLLK..', '..KAAAAAAAAAAK..', '..KBBBBBBBBBBK..', '..KKKKKKKKKKKK..'];
const BUTTON_TPL = ['................', '................', '................', '................', '................', '................', '................', '................', '.....KKKKKK.....', '....KRRRRRRK....', '....KRLRRRRK....', '...KKKKKKKKKK...', '...KBBBBBBBBK...', '...KKKKKKKKKK...'];
const TORCH_TPL = ['.......F........', '......FYF.......', '......FYWF......', '.......YF.......', '......KNNK......', '......KNNK......', '.......NN.......', '.......NN.......', '.......NN.......', '.......NN.......', '.......NN.......', '......KKKK......'];
const SIGN_TPL = ['................', '................', '...KKKKKKKKKK...', '...KAAAAAAAAK...', '...KALLLLLLAK...', '...KAAAAAAAAK...', '...KALLLLAAAK...', '...KAAAAAAAAK...', '...KKKKKKKKKK...', '.......KK.......', '.......KN.......', '.......KN.......', '.......KN.......', '......KKKK......'];
const TRAP_TPL = ['................', '................', '................', '....KKKKKKKK....', '...KBBBBBBBBK...', '..KBAAAAAAAABK..', '..KBAKAAAAKABK..', '..KBAAKAAKAABK..', '..KBAAAKKAAABK..', '..KBAAKAAKAABK..', '..KBAKAAAAKABK..', '..KBAAAAAAAABK..', '...KBBBBBBBBK...', '....KKKKKKKK....'];

const ITEM_TEMPLATES: Record<string, string[]> = {
  sword: ['................', '.............KK.', '............KWK.', '...........KWK..', '..........KWK...', '.........KWK....', '........KWK.....', '..KK...KWK......', '..KGK.KWK.......', '...KGKWK........', '....KGK.........', '...KNKGK........', '..KNK.KGK.......', '.KNK...KK.......', '.KK.............'],
  hammer: ['................', '.....KKKKKK.....', '....KWWWWWWK....', '....KWWLWWWK....', '....KWWWWWWK....', '.....KKNNKK.....', '......KNNK......', '......KNNK......', '......KNNK......', '......KNNK......', '......KNNK......', '......KNNK......', '......KKKK......'],
  staff: ['.......KK.......', '......KJJK......', '.....KJLJJK.....', '......KJJK......', '.......KNK......', '.......KNK......', '.......KNK......', '.......KNK......', '.......KNK......', '.......KNK......', '.......KNK......', '.......KNK......', '.......KNK......', '.......KKK......'],
  bow: ['................', '......KKK.......', '.....KNNwK......', '....KNK.wK......', '....KNK..wK.....', '...KNK...wK.....', '...KNK....wK....', '...KNK....wK....', '...KNK...wK.....', '....KNK..wK.....', '....KNK.wK......', '.....KNNwK......', '......KKK.......'],
  dagger: ['................', '................', '................', '..........KK....', '.........KWK....', '........KWK.....', '.......KWK......', '...KK.KWK.......', '...KGKWK........', '....KGK.........', '...KNKGK........', '..KNK.KK........', '..KK............'],
  spear: ['..............K.', '.............KWK', '............KWK.', '...........KNK..', '..........KNK...', '.........KNK....', '........KNK.....', '.......KNK......', '......KNK.......', '.....KNK........', '....KNK.........', '...KNK..........', '..KNK...........', '..KK............'],
  armor: ['................', '...KKK....KKK...', '..KAAAKKKKAAAK..', '..KAAAALLAAAAK..', '..KKAAALLAAAKK..', '....KAAAAAAK....', '....KAABBAAK....', '....KAAAAAAK....', '....KAABBAAK....', '....KAAAAAAK....', '....KBBBBBBK....', '....KKKKKKKK....'],
  robe: ['................', '.....KKKKKK.....', '....KAAAAAAK....', '...KAAKAAKAAK...', '...KAAAKKAAAK...', '...KKAAAAAAKK...', '....KAAAAAAK....', '....KAALLAAK....', '...KAAAAAAAAK...', '...KAAAAAAAAK...', '..KAAAAAAAAAAK..', '..KBBBBBBBBBBK..', '..KKKKKKKKKKKK..'],
  ring: ['................', '................', '................', '.......KK.......', '......KJJK......', '.....KKJJKK.....', '....KAAKKAAK....', '...KAK....KAK...', '...KAK....KAK...', '...KAK....KAK...', '....KAAKKAAK....', '.....KAAAAK.....', '......KKKK......'],
  amulet: ['................', '...KK......KK...', '....KK....KK....', '.....KK..KK.....', '......KKKK......', '......KAAK......', '.....KAJJAK.....', '....KAJLJJAK....', '....KAJJJJAK....', '.....KAJJAK.....', '......KAAK......', '.......KK.......'],
  mushroom: ['................', '................', '................', '.....KKKKKK.....', '....KAALAAAK....', '...KALLAAAALK...', '...KKKKKKKKKK...', '......KSSK......', '......KSSK......', '.....KSSSSK.....', '.....KKKKKK.....'],
  gel: ['................', '................', '................', '................', '.......KK.......', '......KAAK......', '.....KALAAK.....', '....KALAAAAK....', '....KAAAAAAK....', '....KBAAAABK....', '.....KKKKKK.....'],
  egg: ['................', '................', '................', '.......KK.......', '......KAAK......', '.....KALAAK.....', '.....KLAAAK.....', '....KAAAAAAK....', '....KAAAABAK....', '....KBAAABBK....', '.....KBBBBK.....', '......KKKK......'],
  fish: ['................', '................', '................', '................', '.......KKKK.....', '.K...KKAAAAKK...', '.KK.KAAAAAEAAK..', '.KAKAALAAAAAAK..', '.KAAAAAAAAAAK...', '.KAKBAAAAAABK...', '.KK.KBBBBBBK....', '.K...KKKKKK.....'],
  bowl: ['................', '................', '................', '.....L..L..L....', '....L..L..L.....', '................', '..KKKKKKKKKKKK..', '..KAAAAAAAAAAK..', '..KBAAAAAAAABK..', '...KBBBBBBBBK...', '....KBBBBBBK....', '.....KKKKKK.....'],
  potion: ['................', '................', '................', '......KKKK......', '......KNNK......', '.......KK.......', '......KLAK......', '.....KLAAAK.....', '....KLAAAAAK....', '....KAAAAAAK....', '....KAAAAAAK....', '.....KAAAAK.....', '......KKKK......'],
  bread: ['................', '................', '................', '................', '.....KKKKKK.....', '...KKAALAALKK...', '..KAALAAAALAAK..', '..KAAAAAAAAAAK..', '..KBAAAAAAAABK..', '...KBBBBBBBBK...', '....KKKKKKKK....'],
  meat: ['......KK........', '.....KWWK.......', '.....KWWK.......', '......KWKKKK....', '.......KAAAAKK..', '......KAALAAAAK.', '.....KAALAAAAAK.', '.....KAAAAAAAAK.', '.....KBAAAAAABK.', '......KBBAABBK..', '.......KKKKKK...'],
  stone: ['................', '................', '................', '................', '................', '......KKKK......', '....KKAAALKK....', '...KAAAAALLAK...', '...KAAAAAAAAK...', '...KBAAAAAABK...', '....KKBBBBKK....', '......KKKK......'],
  orb: ['................', '................', '................', '.....KKKKKK.....', '....KAALLAAK....', '...KAALLAAAAK...', '...KAAAAAAAAK...', '...KAAAAAAAAK...', '...KBAAAAAABK...', '....KBBAABBK....', '.....KKKKKK.....', '.....KNNNNK.....', '....KNNNNNNK....', '....KKKKKKKK....'],
  gold: ['................', '................', '................', '................', '................', '.......KKKK.....', '......KAALAK....', '....KKKAAAAK....', '...KAALKKKK.KK..', '...KAAAAK..KALK.', '....KKKK..KAAAAK', '..........KKKKK.'],
  leaf: ['................', '................', '.........KK.....', '........KAAK....', '.......KALAK....', '..KK..KALAK.....', '.KAAK.KAAK......', '.KALAKKAK.......', '..KAAAKAK.......', '...KKKANK.......', '......KNK.......', '......KNK.......', '.......K........'],
  bomb: ['................', '..........K.....', '.........KLK....', '........KK.K....', '.....KKKKK......', '....KAAAAAK.....', '...KAALAAAAK....', '...KALAAAAAK....', '...KAAAAAAAK....', '...KAAAAAABK....', '....KAAAABK.....', '.....KKKKK......'],
  ingot: ['................', '................', '................', '................', '.....KKKKKKK....', '....KLLLLLLAK...', '...KAAAAAAAABK..', '..KAAAAAAAABBK..', '..KBBBBBBBBBK...', '..KKKKKKKKKK....'],
  ore: ['................', '................', '................', '................', '.....KKKKK......', '...KKAALAAKK....', '..KAAJAAAAJAK...', '..KALAAAJAAAK...', '..KAAAJAAAALK...', '...KBAAAAJABK...', '....KKBBBBKK....', '......KKKK......'],
  crystal: ['................', '.......KK.......', '......KLAK......', '.....KLAAAK.....', '....KLAAAABK....', '....KLAAAABK....', '....KAAAAABK....', '....KAAAABBK....', '.....KAABBK.....', '......KABK......', '.......KK.......'],
  bone: ['................', '................', '................', '..KK........KK..', '.KWWK......KWWK.', '.KWWWKKKKKKWWWK.', '..KWWWWWWWWWWK..', '.KWWWKKKKKKWWWK.', '.KWWK......KWWK.', '..KK........KK..'],
  scroll: ['................', '................', '................', '....KKKKKKKK....', '...KBAAAAAABK...', '...KKAAAAAAKK...', '....KALLLLAK....', '....KAAAAAAK....', '....KALLLAAK....', '....KAAAAAAK....', '...KBAAAAAABK...', '...KKKKKKKKKK...'],
};

const ITEMS: Record<string, { tpl: string; pal: Palette }> = {
  // Equipo
  e_sword: { tpl: 'sword', pal: { W: '#d8dce4', G: '#d9a940', N: '#7a4e2c' } },
  e_sword_fire: { tpl: 'sword', pal: { W: '#ff8a3d', G: '#ffe680', N: '#5a2a1a' } },
  e_hammer: { tpl: 'hammer', pal: { W: '#a8acb4', L: '#e8ecf4', N: '#7a4e2c' } },
  e_staff: { tpl: 'staff', pal: { J: '#7fc8ff', L: '#e8f8ff', N: '#7a4e2c' } },
  e_staff_light: { tpl: 'staff', pal: { J: '#ffe680', L: '#ffffff', N: '#c8b890' } },
  e_bow: { tpl: 'bow', pal: { N: '#8a5a30', w: '#e8e0d0' } },
  e_dagger: { tpl: 'dagger', pal: { W: '#b8a8c8', G: '#5a3f8a', N: '#3a2a3a' } },
  e_spear: { tpl: 'spear', pal: { W: '#d8dce4', N: '#8a6a3a' } },
  e_armor_leather: { tpl: 'armor', pal: { A: '#8a5a32', B: '#5a3a20', L: '#b07a48' } },
  e_armor_mail: { tpl: 'armor', pal: { A: '#8a8e98', B: '#5a5e68', L: '#c8ccd4' } },
  e_armor_plate: { tpl: 'armor', pal: { A: '#b8bcc8', B: '#7a7e8a', L: '#ffffff' } },
  e_robe: { tpl: 'robe', pal: { A: '#d8d0c0', B: '#a89c88', L: '#ffe680' } },
  e_robe_dark: { tpl: 'robe', pal: { A: '#3a3040', B: '#241c2a', L: '#8a7a9a' } },
  e_ring: { tpl: 'ring', pal: { A: '#d9a940', J: '#ff5a5a' } },
  e_ring_blue: { tpl: 'ring', pal: { A: '#c8ccd4', J: '#4aa8ff' } },
  e_amulet: { tpl: 'amulet', pal: { A: '#d9a940', J: '#ffe680', L: '#ffffff' } },
  e_amulet_green: { tpl: 'amulet', pal: { A: '#8a6a3a', J: '#5ac85a', L: '#c8ffc8' } },
  e_amulet_blue: { tpl: 'amulet', pal: { A: '#a8acb4', J: '#4aa8ff', L: '#c8ecff' } },
  e_amulet_brown: { tpl: 'amulet', pal: { A: '#5a4a3a', J: '#c49a52', L: '#ecd8a8' } },
  e_amulet_red: { tpl: 'amulet', pal: { A: '#3a2030', J: '#d83a4a', L: '#ff9aa8' } },
  // Ingredientes y platos
  i_mushroom: { tpl: 'mushroom', pal: { A: '#c8602a', L: '#f0d8b0', S: '#e0d8c0' } },
  i_gel: { tpl: 'gel', pal: { A: '#3f8fd8', B: '#2a5f9a', L: '#9fd4ff' } },
  i_egg: { tpl: 'egg', pal: { A: '#d8d0b8', B: '#9a9080', L: '#ffffff' } },
  i_fish: { tpl: 'fish', pal: { A: '#6a8a8a', B: '#3f5a5a', L: '#b8d8d0', E: '#140f18' } },
  i_root: { tpl: 'leaf', pal: { A: '#8a6a3a', L: '#c8a870', N: '#5a3a20' } },
  i_salt: { tpl: 'stone', pal: { A: '#e0dcd8', B: '#a8a4a0', L: '#ffffff' } },
  i_bowl: { tpl: 'bowl', pal: { A: '#b8683a', B: '#7a4e2c', L: '#d8d0c8' } },
  i_bowl_green: { tpl: 'bowl', pal: { A: '#6a9a4a', B: '#7a4e2c', L: '#d8d0c8' } },
  i_potion: { tpl: 'potion', pal: { A: '#d83a3a', L: '#ff9c9c', N: '#9a6a3a' } },
  i_potion_big: { tpl: 'potion', pal: { A: '#d83a9a', L: '#ffb0e0', N: '#9a6a3a' } },
  i_elixir: { tpl: 'potion', pal: { A: '#3a7ad8', L: '#a0c8ff', N: '#9a6a3a' } },
  i_flask: { tpl: 'potion', pal: { A: '#ff8a20', L: '#ffe080', N: '#5a3a2a' } },
  i_bread: { tpl: 'bread', pal: { A: '#c8893a', B: '#8a5a24', L: '#ecc078' } },
  i_ration: { tpl: 'bread', pal: { A: '#b8a060', B: '#7a6a3a', L: '#e8d8a0' } },
  i_meat: { tpl: 'meat', pal: { A: '#b8483a', B: '#7a2a22', L: '#e88070', W: '#e8e0d0' } },
  i_stone: { tpl: 'stone', pal: { A: '#8a8a92', B: '#5a5a62', L: '#c8c8d0' } },
  i_orb: { tpl: 'orb', pal: { A: '#8a5ad8', B: '#5a3a9a', L: '#d8c0ff', N: '#7a4e2c' } },
  i_gold: { tpl: 'gold', pal: { A: '#e8b840', L: '#fff0a0' } },
  i_herb: { tpl: 'leaf', pal: { A: '#4aa84a', L: '#a0e8a0', N: '#5a7a3a' } },
  i_seed: { tpl: 'leaf', pal: { A: '#e8d040', L: '#fff8b0', N: '#7a5a2a' } },
  i_moss: { tpl: 'leaf', pal: { A: '#a8c8b8', L: '#e8fff0', N: '#5a6a60' } },
  // Materiales
  i_bomb: { tpl: 'bomb', pal: { A: '#3a3a44', B: '#22222a', L: '#ffb040' } },
  i_ingot: { tpl: 'ingot', pal: { A: '#9aa0aa', B: '#6a707a', L: '#e8ecf4' } },
  i_leather: { tpl: 'scroll', pal: { A: '#7a4a24', B: '#4a2a14', L: '#d0a070' } },
  i_cloth: { tpl: 'scroll', pal: { A: '#d8d8f0', B: '#9a9ab8', L: '#7a6aa8' } },
  i_rotten: { tpl: 'meat', pal: { A: '#6a8a3a', B: '#3a5a2a', L: '#9ab060', W: '#c8c8a0' } },
  i_shroom_bad: { tpl: 'mushroom', pal: { A: '#7a3a9a', L: '#c8a0e0', S: '#d8d0c0' } },
  i_venom: { tpl: 'potion', pal: { A: '#4a8a2a', L: '#a8e070', N: '#3a2a2a' } },
  i_murky: { tpl: 'potion', pal: { A: '#6a6050', L: '#a89880', N: '#5a4a3a' } },
  i_sealed: { tpl: 'scroll', pal: { A: '#e0d0a8', B: '#a8946a', L: '#c8343a' } },
  i_scroll_bad: { tpl: 'scroll', pal: { A: '#5a3a5a', B: '#3a2040', L: '#c070ff' } },
  i_fragment: { tpl: 'crystal', pal: { A: '#ffd27a', B: '#a87a2a', L: '#fff0c0' } },
  i_tear: { tpl: 'potion', pal: { A: '#f0e6b0', L: '#ffffff', N: '#c9a24a' } },
  i_potion_green: { tpl: 'potion', pal: { A: '#3ab85a', L: '#a8f0b8', N: '#9a6a3a' } },
  i_tonic: { tpl: 'potion', pal: { A: '#8a5a2a', L: '#e0b070', N: '#5a3a2a' } },
  i_ore: { tpl: 'ore', pal: { A: '#6a6a72', B: '#44444c', L: '#9a9aa4', J: '#d08a4a' } },
  i_hide: { tpl: 'scroll', pal: { A: '#9a6a3a', B: '#6a4422', L: '#c8945a' } },
  i_bone: { tpl: 'bone', pal: { W: '#e8e0cc' } },
  i_silk: { tpl: 'gel', pal: { A: '#e8e8f0', B: '#a8a8b8', L: '#ffffff' } },
  i_essence: { tpl: 'gel', pal: { A: '#6a3a9a', B: '#3a1a5a', L: '#c890ff' } },
  i_crystal: { tpl: 'crystal', pal: { A: '#d8304a', B: '#8a1a2a', L: '#ffb0c0' } },
  i_scroll: { tpl: 'scroll', pal: { A: '#e0d0a8', B: '#a8946a', L: '#7a6a4a' } },
};

// ---------------------------------------------------------------- utilidades de color

export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1, 7), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function paint(rows: string[], pal: Palette, overlay: Overlay = []): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const ctx = c.getContext('2d')!;
  const grid = Array.from({ length: 16 }, (_, y) => (rows[y] ?? '').padEnd(16, '.').slice(0, 16).split(''));
  for (const [x, y, ch] of overlay) if (grid[y]) grid[y][x] = ch;
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const ch = grid[y][x];
      if (ch === '.') continue;
      const col = ch === 'K' ? OUTLINE : pal[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1, 1);
    }
  return c;
}

/**
 * Traje de prestigio sobre la plantilla de un miembro: hombreras (1), además cinturón (2) y además capa (3).
 * X = hombreras, Q = cinturón, V = capa.
 */
function prestigeBody(rows: string[], p: number): string[] {
  const g = Array.from({ length: 16 }, (_, y) => (rows[y] ?? '').padEnd(16, '.').slice(0, 16).split(''));
  const clothes = g.findIndex((r) => r.includes('C'));
  if (clothes < 0) return rows;
  const row = g[clothes];
  row[row.indexOf('C')] = 'X';
  row[row.lastIndexOf('C')] = 'X';
  // Hombreras más grandes: también la casilla de fuera de cada hombro.
  const l0 = row.indexOf('X');
  const r0 = row.lastIndexOf('X');
  if (l0 > 0 && row[l0 - 1] === 'K') row[l0 - 1] = 'X';
  if (r0 < 15 && row[r0 + 1] === 'K') row[r0 + 1] = 'X';
  // Emblema en el pecho.
  const chest = g[clothes + 1];
  if (chest) for (const x of [7, 8]) if (chest[x] === 'C' || chest[x] === 'D') chest[x] = 'Q';
  if (p >= 2) {
    let last = -1;
    g.forEach((r, y) => r.includes('C') && (last = y));
    if (last > clothes) g[last] = g[last].map((c) => (c === 'C' ? 'Q' : c));
  }
  if (p >= 3)
    for (let y = clothes; y < 16; y++) {
      const r = g[y];
      const l = r.findIndex((c) => c !== '.');
      if (l > 0 && r[l - 1] === '.') r[l - 1] = 'V';
      const rr = r.length - 1 - [...r].reverse().findIndex((c) => c !== '.');
      if (y >= 12 && rr < 15 && r[rr + 1] === '.') r[rr + 1] = 'V';
    }
  return g.map((r) => r.join(''));
}

/** Mezcla de dos colores (t = 0 → a, 1 → b). */
function mix(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

/** Colores de cada prestigio: plata y tela más clara (Veterano), azul real y oro (Élite), negro, oro y capa carmesí (Leyenda). */
function prestigePalette(h: Humanoid, p: number): Palette {
  if (p === 1) return { C: mix(h.cloth, '#e8e8f0', 0.3), X: '#d8dce4', Q: '#d8dce4' };
  if (p === 2) return { C: mix(h.cloth, '#2a3a8a', 0.5), D: mix(h.clothDark, '#141a3a', 0.5), X: '#d9a940', Q: '#ffe680' };
  return { C: mix(h.cloth, '#1a1018', 0.65), D: '#120c14', X: '#ffe680', Q: '#ff5a5a', V: '#9a1f3a' };
}

// Trajes de prestigio de los miembros del gremio (y de Aren en cada clase).
for (const key of Object.keys(HUMANS)) {
  const member = ['p_bram', 'p_lysa', 'p_garrick', 'p_kaela', 'p_odric', 'p_pip', 'p_seren', 'p_vael'].includes(key) || key.startsWith('p_aren_');
  if (!member) continue;
  const h = HUMANS[key];
  // Pip crece: en Leyenda ya es adulto (y puede ser pareja de Aren).
  for (const p of [1, 2, 3]) HUMANS[`${key}_p${p}`] = { ...h, body: prestigeBody(key === 'p_pip' && p === 3 ? PIP_ADULT : h.body, p), extra: { ...h.extra, ...prestigePalette(h, p) } };
}

/** Partículas de los efectos (llamas, gotas, ráfagas, rocas, destellos, sombras, tajos, cruces, flechas, estrellas). */
const FX: Record<string, { rows: string[]; pal: Palette }> = {
  fx_fuego: { rows: ['..F..', '..FF.', '.FYF.', 'FYYF.', 'FYWYF', 'FYWYF', '.FFF.'], pal: { F: '#e8452f', Y: '#ff9a2a', W: '#ffe680' } },
  fx_agua: { rows: ['..A..', '.AAA.', 'AALAA', 'AALAA', 'AAAAA', '.AAA.'], pal: { A: '#3a8ae8', L: '#c8ecff' } },
  fx_viento: { rows: ['..GGG..', '.G...G.', 'G..GG.G', 'G.G....', '.G.....'], pal: { G: '#a8f0c8' } },
  fx_tierra: { rows: ['.BBB.', 'BALAB', 'BAAAB', '.BBB.'], pal: { A: '#a87a3a', B: '#5a3a1a', L: '#d8b070' } },
  fx_luz: { rows: ['..L..', '..Y..', 'LYWYL', '..Y..', '..L..'], pal: { L: '#fff0a0', Y: '#ffe680', W: '#ffffff' } },
  fx_sombra: { rows: ['..P..', '.PQP.', 'PQQQP', '.PQP.', '..P..', '.P...'], pal: { P: '#7a4ac8', Q: '#2a1040' } },
  fx_neutral: { rows: ['......W', '.....WW', '....WW.', '...WW..', '..WW...', '.WW....', 'W......'], pal: { W: '#f0f0f8' } },
  fx_heal: { rows: ['.KKK.', 'KKRKK', 'KRRRK', 'KKRKK', '.KKK.'], pal: { R: '#ff3a4a' } },
  fx_buff: { rows: ['..U..', '.UUU.', 'UUUUU', '..U..', '..U..'], pal: { U: '#ffb040' } },
  fx_debuff: { rows: ['..U..', '..U..', 'UUUUU', '.UUU.', '..U..'], pal: { U: '#a07cff' } },
  fx_star: { rows: ['..Y..', '.YYY.', 'YYWYY', '.YYY.', '.Y.Y.'], pal: { Y: '#ffe040', W: '#fffbe0' } },
};

function paintSmall(rows: string[], pal: Palette): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(...rows.map((r) => r.length));
  c.height = rows.length;
  const ctx = c.getContext('2d')!;
  rows.forEach((r, y) =>
    [...r].forEach((ch, x) => {
      const col = ch === 'K' ? OUTLINE : pal[ch];
      if (ch === '.' || !col) return;
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1, 1);
    }),
  );
  return c;
}

/** Colores base de cada elemento para las variantes de los monstruos (neutro = gris). */
const VARIANT_COLORS: Record<string, string> = { neutral: '#8a8a8a', fuego: '#e8452f', agua: '#3a7ad8', tierra: '#a8783a', viento: '#4ac87a', luz: '#f0d040', sombra: '#7a3ac8' };

function toHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1, 7), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function fromHsl(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return `#${[f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Paleta de un monstruo teñida del color de un elemento (conserva claros y oscuros; los ojos no cambian). */
function recolor(pal: Palette, element: string): Palette {
  const [h, s] = toHsl(VARIANT_COLORS[element]);
  const out: Palette = {};
  for (const [k, v] of Object.entries(pal)) {
    if (k === 'E' || k === 'K' || !v.startsWith('#')) {
      out[k] = v;
      continue;
    }
    const l = toHsl(v)[2];
    out[k] = fromHsl(h, element === 'neutral' ? 0.04 : Math.max(0.45, s * 0.9), Math.min(0.72, Math.max(0.16, l)));
  }
  return out;
}

/** Elementos de las variantes de color (ver DungeonRun.spawnEnemy). */
export const VARIANT_ELEMENTS = Object.keys(VARIANT_COLORS);

const cache = new Map<string, HTMLCanvasElement>();

export function buildSprites(): Map<string, HTMLCanvasElement> {
  if (cache.size) return cache;
  const mirror = (o: Overlay): Overlay => o.map(([x, y, c]) => [15 - x, y, c]);
  // Clave base = de frente (retratos e interfaz); `clave@pose` = cada dirección en la mazmorra.
  for (const [key, h] of Object.entries(HUMANS)) {
    const pal = { ...HUMAN_BASE, H: h.hair, C: h.cloth, D: h.clothDark, ...h.extra };
    const weapons = h.weapons.flatMap((w) => WEAPONS[w]);
    cache.set(key, paint(h.body, pal, weapons));
    // De espaldas el arma de la mano derecha queda al otro lado.
    for (const p of POSES) cache.set(`${key}@${p}`, paint(humanPose(h.body, p), pal, isBackPose(p) ? mirror(weapons) : weapons));
  }
  for (const [key, m] of Object.entries(MONSTERS)) {
    const tpl = MONSTER_TEMPLATES[m.tpl];
    // Original y una variante de color por elemento (`clave~elemento`).
    for (const el of ['', ...VARIANT_ELEMENTS]) {
      const base = { W: '#e0dccf', ...m.pal };
      const pal = el ? recolor(base, el) : base;
      const k = el ? `${key}~${el}` : key;
      cache.set(k, paint(tpl, pal, m.overlay));
      for (const p of POSES) cache.set(`${k}@${p}`, paint(monsterPose(tpl, p, m.profile), pal, m.overlay && (isBackPose(p) || m.profile) ? mirror(m.overlay) : m.overlay));
    }
  }
  // Monstruos con cuerpo humano (los ahogados) también tienen variantes.
  for (const key of ['m_drowned', 'm_cultist', 'm_inquisitor', 'm_bandit']) {
    const h = HUMANS[key];
    const base = { ...HUMAN_BASE, H: h.hair, C: h.cloth, D: h.clothDark, ...h.extra };
    for (const el of VARIANT_ELEMENTS) {
      const pal = recolor(base, el);
      cache.set(`${key}~${el}`, paint(h.body, pal));
      for (const p of POSES) cache.set(`${key}~${el}@${p}`, paint(humanPose(h.body, p), pal));
    }
  }
  for (const [key, it] of Object.entries(ITEMS)) cache.set(key, paint(ITEM_TEMPLATES[it.tpl], it.pal));
  for (const c of LOCK_COLORS) {
    cache.set(`i_key_${c.id}`, paint(KEY_TPL, { A: c.color }));
    cache.set(`door_${c.id}`, paint(DOOR_TPL, { A: c.color, B: shade(c.color, -0.55), L: '#e8d8a0' }));
  }
  for (const [key, f] of Object.entries(FX)) cache.set(key, paintSmall(f.rows, f.pal));
  cache.set('i_key_stairs', paint(KEY_TPL, { A: '#ffd27a' }));
  cache.set('goal_cartel', paint(SIGN_TPL, { A: '#c8a468', L: '#5a3a1a', N: '#8a5a30' }));
  cache.set('ev_cofre', paint(CHEST_TPL, { A: '#8a5a30', B: '#5a3a1a', G: '#d9a940' }));
  cache.set('ev_altar', paint(ALTAR_TPL, { A: '#6a6470', B: '#3a3440', L: '#8a8490', R: '#a82030' }));
  cache.set('ev_fuente', paint(FOUNTAIN_TPL, { A: '#7a7a8a', B: '#4a4a5a', W: '#2a4a5a', L: '#7fc8ff' }));
  cache.set('goal_caja', paint(CRATE_TPL, { A: '#a8783a', B: '#6a4a22' }));
  cache.set('goal_placa', paint(PLATE_TPL, { A: '#6a6470', B: '#3a3440', L: '#9a94a0' }));
  cache.set('goal_placa_on', paint(PLATE_TPL, { A: '#6a6470', B: '#3a3440', L: '#5ac85a' }));
  cache.set('goal_reset', paint(BUTTON_TPL, { R: '#3a7ad8', L: '#a0c8ff', B: '#3a3440' }));
  cache.set('goal_antorcha', paint(TORCH_TPL, { F: '#d8452f', Y: '#ff9a2a', W: '#ffe680', N: '#8a5a30' }));
  const stone = { A: '#8a8a9a', B: '#55556a', L: '#3a3a4a' };
  cache.set('goal_faro', paint(BRAZIER_TPL, stone));
  cache.set('goal_faro_on', paint([...FLAME, ...BRAZIER_TPL.slice(7)], { ...stone, L: '#a0e0ff', F: '#3a7ad8', Y: '#7fc8ff', W: '#ffffff' }));
  cache.set('goal_palanca', paint(LEVER_TPL, { A: '#6a6470', B: '#3a3440', N: '#8a6a3a', J: '#d83a3a' }));
  cache.set('goal_palanca_on', paint(LEVER_ON_TPL, { A: '#6a6470', B: '#3a3440', N: '#8a6a3a', J: '#5ac85a' }));
  const brazier = { A: '#7a6a5a', B: '#4a3e34', L: '#5a4a4a' };
  cache.set('goal_brasero', paint(BRAZIER_TPL, brazier));
  cache.set('goal_brasero_on', paint([...FLAME, ...BRAZIER_TPL.slice(7)], { ...brazier, L: '#ffb040', F: '#d8452f', Y: '#ff9a2a', W: '#ffe680' }));
  for (const t of Object.values(TRAPS)) cache.set(`trap_${t.id}`, paint(TRAP_TPL, { A: shade(t.color, -0.35), B: '#2a2430', K: '#0a080c' }));
  return cache;
}

export function sprite(key: string): HTMLCanvasElement | undefined {
  return buildSprites().get(key);
}

const urlCache = new Map<string, string>();
/** Data URL de un sprite escalado (para retratos en la interfaz HTML). */
export function spriteUrl(key: string, scale = 4): string {
  const ck = `${key}@${scale}`;
  const hit = urlCache.get(ck);
  if (hit) return hit;
  const src = sprite(key);
  if (!src) return '';
  const c = document.createElement('canvas');
  c.width = 16 * scale;
  c.height = 16 * scale;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, c.width, c.height);
  const url = c.toDataURL();
  urlCache.set(ck, url);
  return url;
}
