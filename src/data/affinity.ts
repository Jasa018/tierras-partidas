import { MEMBERS } from './characters';
import type { Line } from './story';

/**
 * Afinidad entre parejas del gremio. Sube con los pisos que recorren juntos; al llegar a cada nivel hay que
 * verlo en la fogata de la posada para activarlo (mientras tanto no sube más). Cada nivel da a la pareja las
 * ventajas de los dos miembros en ese nivel, así que cada pareja combina ventajas distintas.
 */
export const AFFINITY_LEVELS = [4, 10, 18, 28];
export const AFFINITY_NAMES = ['Confianza', 'Camaradería', 'Lealtad', 'Vínculo'];

export type BondEffect =
  | { kind: 'stat'; stat: 'atk' | 'def' | 'mag' | 'res' | 'hp'; pct: number }
  /** Al golpear uno a un enemigo, el otro (si está pegado a él) remata. */
  | { kind: 'followup'; chance: number }
  /** Si uno recibe un golpe y el otro está al lado, el otro lo encaja (con menos daño). */
  | { kind: 'cover'; chance: number }
  /** Cada 10 turnos, los dos recuperan este % de vida. */
  | { kind: 'regen'; pct: number }
  /** Cada 10 turnos, los dos recuperan esta energía. */
  | { kind: 'sp'; amount: number }
  | { kind: 'crit'; pct: number }
  /** Hambre más lenta para todo el grupo. */
  | { kind: 'belly'; pct: number }
  | { kind: 'xp'; pct: number };

export interface BondPerk {
  name: string;
  desc: string;
  effect: BondEffect;
}

const stat = (s: 'atk' | 'def' | 'mag' | 'res' | 'hp', pct: number): BondEffect => ({ kind: 'stat', stat: s, pct });
const STAT_NAMES = { atk: 'ataque', def: 'defensa', mag: 'magia', res: 'resistencia', hp: 'vida máxima' };

/** Texto de lo que hace una ventaja (para la ficha de afinidad). */
export function effectText(e: BondEffect): string {
  switch (e.kind) {
    case 'stat': return `+${e.pct}% de ${STAT_NAMES[e.stat]} para los dos`;
    case 'followup': return `${Math.round(e.chance * 100)}% de rematar juntos al mismo enemigo`;
    case 'cover': return `${Math.round(e.chance * 100)}% de encajar el golpe que iba al otro`;
    case 'regen': return `recuperan un ${e.pct}% de vida cada 10 turnos`;
    case 'sp': return `recuperan ${e.amount} de energía cada 10 turnos`;
    case 'crit': return `+${e.pct}% de críticos para los dos`;
    case 'belly': return `el hambre del grupo baja un ${e.pct}% más despacio`;
    case 'xp': return `+${e.pct}% de experiencia para los dos`;
  }
}

/** Lo que aporta cada miembro a sus parejas en cada nivel (1 a 4). */
export const BOND_PERKS: Record<string, BondPerk[]> = {
  aren: [
    { name: 'Espalda con espalda', desc: 'Aren no deja a nadie atrás.', effect: stat('def', 6) },
    { name: 'Te cubro', desc: 'Aren se pone en medio.', effect: { kind: 'cover', chance: 0.25 } },
    { name: 'Aprender juntos', desc: 'Lo que vive uno, lo aprende el otro.', effect: { kind: 'xp', pct: 15 } },
    { name: 'Al unísono', desc: 'Se mueven como uno solo.', effect: { kind: 'followup', chance: 0.4 } },
  ],
  bram: [
    { name: 'Choque de puños', desc: 'Bram contagia las ganas de pelea.', effect: stat('atk', 8) },
    { name: '¡Detrás de ti!', desc: 'Bram remata todo lo que se mueve.', effect: { kind: 'followup', chance: 0.3 } },
    { name: 'Golpe de fragua', desc: 'Golpes que caen justo donde duele.', effect: { kind: 'crit', pct: 8 } },
    { name: 'Hermanos de forja', desc: 'Templados el uno con el otro.', effect: stat('hp', 12) },
  ],
  lysa: [
    { name: 'Manos cálidas', desc: 'Lysa cura sin darse cuenta.', effect: { kind: 'regen', pct: 2 } },
    { name: 'Velo de luz', desc: 'La fe de Lysa aparta la magia.', effect: stat('res', 8) },
    { name: 'Plegaria compartida', desc: 'Rezan juntos y el ánimo vuelve.', effect: { kind: 'sp', amount: 1 } },
    { name: 'Escudo de fe', desc: 'Lysa se interpone sin dudar.', effect: { kind: 'cover', chance: 0.35 } },
  ],
  garrick: [
    { name: 'Guardia del veterano', desc: 'Garrick enseña a no bajar la guardia.', effect: stat('def', 8) },
    { name: 'Yo encajo el golpe', desc: 'Para eso tiene el escudo.', effect: { kind: 'cover', chance: 0.35 } },
    { name: 'Raciones de campaña', desc: 'Trucos de la vieja Expedición.', effect: { kind: 'belly', pct: 10 } },
    { name: 'Viejo muro', desc: 'Nada los tumba.', effect: stat('hp', 15) },
  ],
  kaela: [
    { name: 'Punto débil', desc: 'Kaela señala dónde apuntar.', effect: { kind: 'crit', pct: 6 } },
    { name: 'Instinto de caza', desc: 'Atacan antes de que el otro reaccione.', effect: stat('atk', 6) },
    { name: 'Remate', desc: 'Ninguna presa se escapa.', effect: { kind: 'followup', chance: 0.35 } },
    { name: 'Ojo de halcón', desc: 'Cada flecha encuentra su hueco.', effect: { kind: 'crit', pct: 12 } },
  ],
  odric: [
    { name: 'Teoría compartida', desc: 'Odric explica cómo canalizar mejor.', effect: stat('mag', 8) },
    { name: 'Concentración', desc: 'Respirar, contar, volver a empezar.', effect: { kind: 'sp', amount: 1 } },
    { name: 'Tutoría', desc: 'Todo combate es una lección.', effect: { kind: 'xp', pct: 20 } },
    { name: 'Ecuación perfecta', desc: 'Dos mentes, un mismo hechizo.', effect: stat('mag', 15) },
  ],
  pip: [
    { name: 'Por la espalda', desc: 'Pip aparece donde nadie mira.', effect: { kind: 'followup', chance: 0.25 } },
    { name: 'Golpe bajo', desc: 'Sin honor, pero funciona.', effect: { kind: 'crit', pct: 8 } },
    { name: 'Lo que sobra', desc: 'Pip siempre encuentra algo que comer.', effect: { kind: 'belly', pct: 10 } },
    { name: 'Sombras gemelas', desc: 'Atacan a la vez, siempre.', effect: { kind: 'followup', chance: 0.45 } },
  ],
  seren: [
    { name: 'Formación', desc: 'Seren coloca a cada uno en su sitio.', effect: stat('def', 6) },
    { name: 'Orden de carga', desc: 'A su voz, todos golpean más fuerte.', effect: stat('atk', 8) },
    { name: 'Guardia de honor', desc: 'Una capitana protege a los suyos.', effect: { kind: 'cover', chance: 0.3 } },
    { name: 'Moral alta', desc: 'Con Seren nadie se rinde.', effect: { kind: 'regen', pct: 3 } },
  ],
  vael: [
    { name: 'Susurros', desc: 'Vael enseña palabras que no deberían existir.', effect: stat('mag', 6) },
    { name: 'Pacto oscuro', desc: 'La sombra devuelve lo que se gasta.', effect: { kind: 'sp', amount: 2 } },
    { name: 'Grieta en la guardia', desc: 'Vael ve las grietas de cualquiera.', effect: { kind: 'crit', pct: 10 } },
    { name: 'Saber prohibido', desc: 'Lo que Vael sabe, ahora lo saben dos.', effect: { kind: 'xp', pct: 25 } },
  ],
};

/**
 * Charlas de fogata: por nivel, lo que cuenta cada uno [confidencia, respuesta]. En la escena, uno se sincera,
 * el otro responde, y luego al revés; así cada pareja tiene su propia conversación.
 */
const VOICE: Record<string, [string, string][]> = {
  aren: [
    ['Desde lo de la aldea duermo poco. Pero contigo de guardia, duermo mejor.', 'Me alegra oírlo. De verdad.'],
    ['A veces noto la Hondonada moverse antes de que pase nada. Si un día te digo que corras, corre.', 'Lo tendré presente. No vas a cargar con eso tú solo.'],
    ['No sé qué soy, ni por qué las grietas me responden. Pero sé por quién bajo.', 'Sea lo que sea, estamos juntos en esto.'],
    ['Si al final de todo esto queda algo en pie, quiero que sea esto: el grupo.', 'Entonces nos aseguraremos de que quede.'],
  ],
  bram: [
    ['¿Sabes qué echo de menos? El ruido del yunque. Aquí abajo solo hay silencio y bichos.', '¡Ja! Pues aquí me tienes. Para lo que haga falta.'],
    ['Me lancé de cabeza otra vez, ¿verdad? Gracias por cubrirme. No se lo digas a nadie.', 'Oye, eso ha sonado bonito. Casi lloro. Casi.'],
    ['Cuando acabemos, te forjaré algo. De verdad. Con tu nombre grabado y todo.', 'Pues brindemos por eso. Con agua, que no hay otra cosa.'],
    ['Mi padre decía que el mejor acero es el que se templa con otro. Creo que hablaba de esto.', 'Lo que venga, juntos. Como en la forja: dos martillos, un golpe.'],
  ],
  lysa: [
    ['Rezo cada noche por los que no salieron. Últimamente también rezo por ti.', 'Gracias por contármelo. No es poca cosa.'],
    ['Antes creía que curar era mi deber. Ahora sé que es lo único que me mantiene en pie.', 'Entonces deja que yo también cuide de ti.'],
    ['Si algún día me pierdo ahí abajo, no vuelvas a por mí... No. Mentira. Vuelve.', 'Siempre. Para eso estamos los unos para los otros.'],
    ['Tenía un santuario. Lo perdí. Pero creo que he encontrado otro, y camina a mi lado.', 'Que la luz nos guarde a los dos. A todos.'],
  ],
  garrick: [
    ['No suelo hablar de la Expedición. Perdí a una escuadra entera. No pienso perder otra.', 'Hm. No eres tan tonto como pareces. Es un cumplido.'],
    ['El parche no es de una pelea heroica. Fue un error mío. Alguien pagó por él.', 'Un consejo de viejo: no cargues con todo tú solo.'],
    ['Llevo años huyendo de esa insignia. Contigo cerca, no me pesa tanto.', 'Bah. Me estoy haciendo blando. Ni una palabra a nadie.'],
    ['Si me pasa algo, que alguien pague mi deuda en Rocaverde. Y que brinden. Poco.', 'A mi lado no vas a caer. Ese es mi trabajo.'],
  ],
  kaela: [
    ['Cazo sola porque así nadie me falla. Contigo... no me ha ido tan mal.', 'No te emociones. Pero sí, vale. Tienes razón.'],
    ['Llevo la cuenta de cada presa. Hoy, por primera vez, he contado también las tuyas.', 'Te debo una. Y yo pago mis deudas.'],
    ['Mi padre me enseñó a disparar y a no confiar en nadie. Solo aprendí la mitad, por lo visto.', 'Te cubro la espalda. Desde lejos, como debe ser.'],
    ['Si alguien te hace daño, no tendrá dónde esconderse. Te lo prometo.', 'Somos un equipo. Raro, pero equipo.'],
  ],
  odric: [
    ['¿Sabías que las Hondonadas siguen un patrón? Lo he medido tres veces. Perdona, me emociono.', 'Fascinante. Déjame anotarlo. Literalmente, un momento.'],
    ['En la capital nadie me escuchaba. Aquí al menos alguien finge que lo hace.', 'Tu punto de vista es más valioso de lo que crees.'],
    ['Si alguien diseñó las Hondonadas, alguien puede deshacerlas. Y quiero estar ahí cuando pase.', 'Entonces esto es un experimento compartido. Me gusta.'],
    ['He escrito tu nombre en mi diario. No como sujeto de estudio. Como amigo.', 'Hay cosas que no salen en ningún libro. Esta es una.'],
  ],
  pip: [
    ['Te robé una moneda el primer día. Te la devuelvo. Bueno, la mitad.', '¿Eso es todo? Pensaba que ibas a soltar algo raro.'],
    ['En la ciudad sitiada nadie me guardaba comida. Aquí siempre me sobra un trozo. Es raro.', 'Vale, vale... Gracias. Pero no te pongas pesado.'],
    ['Si me pasa algo, quédate con mis ganzúas. Son lo único bueno que tengo.', 'Tú tampoco estás mal, ¿eh? Para ser mayor.'],
    ['Nunca había tenido familia. Creo que esto se le parece.', 'Lo que digas. Pero no lo cuentes, que tengo una reputación.'],
  ],
  seren: [
    ['Mi ciudad está rodeada de grietas. Cada día fuera es un día que no la defiendo.', 'Entendido. Lo tendré en cuenta en la formación.'],
    ['Me cuesta pedir ayuda. Me enseñaron que una capitana no la necesita.', 'Bien dicho. Una tropa así vale por diez.'],
    ['Si caigo, que mi guardia sepa que no fue en vano. Díselo tú.', 'Tienes mi palabra de capitana. Y no la doy a cualquiera.'],
    ['Jamás pensé que confiaría así en alguien de fuera de mis murallas.', 'Hoy mis murallas son este grupo. Y las defenderé.'],
  ],
  vael: [
    ['Sé cosas que preferirías no saber. Por eso callo. No es desconfianza.', 'Interesante. No eres lo que esperaba.'],
    ['La grieta de mi cara late cuando nos acercamos a una Hondonada. Contigo cerca, late más despacio.', 'Lo recordaré. Recuerdo todo, aunque no lo parezca.'],
    ['Algún día te contaré la verdad sobre la Fractura. Espero que sigas a mi lado después.', 'Quizá el futuro no esté escrito. Contigo, casi lo creo.'],
    ['He visto muchos finales. Este no lo había visto venir: alguien que se queda.', 'Entonces me quedo yo también.'],
  ],
};

/** Escenas escritas a mano para algunas parejas y niveles (clave `a|b:nivel`, con la pareja en orden de pairKey). */
const SCENES: Record<string, Line[]> = {
  'aren|bram:1': [
    { who: 'bram', text: 'A veces sueño con la forja de mi padre. Seguía encendida cuando huimos.' },
    { who: 'aren', text: 'Cuando sellemos esa Hondonada, volveremos. Y la encenderemos otra vez.' },
    { who: 'bram', text: 'Trato hecho. Pero el primer martillo lo hago yo.' },
  ],
  'bram|garrick:1': [
    { who: 'garrick', text: 'Chico, cargas como un toro. Un día vas a cargar contra algo que no se mueve.' },
    { who: 'bram', text: '¿Y tú por qué dejaste la Expedición, si eres tan listo?' },
    { who: 'garrick', text: '...Porque una vez cargué yo. Y no volvieron todos. Cúbrete el flanco izquierdo, ¿quieres?' },
  ],
  'garrick|lysa:1': [
    { who: 'lysa', text: 'Tienes cicatrices viejas mal curadas. Déjame verlas.' },
    { who: 'garrick', text: 'No hace falta. Ya no duelen.' },
    { who: 'lysa', text: 'Las que no duelen son las peores. Siéntate.' },
  ],
  'aren|lysa:1': [
    { who: 'lysa', text: 'Cuando entramos en una Hondonada, te quedas quieto un momento. ¿Qué sientes?' },
    { who: 'aren', text: 'Como si la mazmorra decidiera su forma al vernos llegar. Como si algo la estuviera dibujando.' },
    { who: 'lysa', text: 'Entonces no son heridas de la tierra. Son algo que alguien hizo.' },
  ],
};

const ORDER = Object.keys(MEMBERS);
/** Pareja en orden fijo (el del gremio). */
export const pairOf = (a: string, b: string): [string, string] => (ORDER.indexOf(a) <= ORDER.indexOf(b) ? [a, b] : [b, a]);

/** Escena de fogata de una pareja al alcanzar `level` (1 a 4). */
export function bondScene(x: string, y: string, level: number): Line[] {
  const [a, b] = pairOf(x, y);
  const end: Line = { who: 'narrador', text: `Algo ha cambiado entre ${MEMBERS[a].name} y ${MEMBERS[b].name}. Afinidad: ${AFFINITY_NAMES[level - 1]}.` };
  const written = SCENES[`${[a, b].sort().join('|')}:${level}`];
  if (written) return [...written, end];
  // Niveles impares se sincera primero el primero de la pareja; pares, el segundo.
  const [p, q] = level % 2 ? [a, b] : [b, a];
  const i = level - 1;
  return [
    { who: p, text: VOICE[p][i][0] },
    { who: q, text: VOICE[q][i][1] },
    { who: q, text: VOICE[q][i][0] },
    { who: p, text: VOICE[p][i][1] },
    end,
  ];
}

/** Ventajas de una pareja con `level` niveles activos: las de los dos miembros en cada nivel. */
export function bondPerks(x: string, y: string, level: number): { level: number; member: string; perk: BondPerk }[] {
  const out: { level: number; member: string; perk: BondPerk }[] = [];
  for (let l = 1; l <= level; l++) for (const m of pairOf(x, y)) out.push({ level: l, member: m, perk: BOND_PERKS[m][l - 1] });
  return out;
}

/** Nivel que dan unos puntos (sin contar si está activado). */
export const levelFromPoints = (points: number) => AFFINITY_LEVELS.filter((t) => points >= t).length;
