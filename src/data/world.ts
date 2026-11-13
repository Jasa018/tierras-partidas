export type BannerKind = 'capital' | 'pueblo' | 'pantano' | 'torre' | 'desierto' | 'nieve' | 'mar' | 'hueso' | 'infierno' | 'cielo';

export interface RegionDef {
  id: string;
  name: string;
  act: number;
}

/**
 * Habitante con quien hablar. Se usa el último diálogo de `talks` cuyos requisitos se cumplan,
 * así lo que dice cambia según avanza la historia. `done:<misión>` se activa al entregar una misión.
 */
export interface NpcDef {
  name: string;
  sprite: string;
  requires?: string[];
  talks: { requires?: string[]; lines: string[] }[];
}

export interface LocationDef {
  id: string;
  name: string;
  region: string;
  /** 'torre': la Torre de Babel, fuera de la historia y unida por portal a todas las localidades. 'refugio': en tierra hostil. */
  kind: 'capital' | 'pueblo' | 'torre' | 'refugio';
  x: number;
  y: number;
  desc: string;
  banner: BannerKind;
  shop: string[];
  /** Equipo que vende la herrería. */
  forge: string[];
  npcs: NpcDef[];
  /** Ciudad tomada (acto 5): con el flag `flag`, es una mazmorra hasta que se supera `dungeon`. */
  taken?: { dungeon: string; flag: string };
}

/** ¿Está tomada esta localidad ahora mismo? */
export const isTaken = (loc: LocationDef, flags: string[], cleared: Record<string, number>) => !!loc.taken && flags.includes(loc.taken.flag) && !cleared[loc.taken.dungeon];

/** Punto fijo de mazmorra en el mapa, accesible desde una localidad. */
export interface DungeonSpot {
  dungeon: string;
  from: string;
  x: number;
  y: number;
  requires?: string[];
}

/** Camino entre localidades: siempre es una mazmorra. Una vez superada queda "segura". */
export interface RouteDef {
  id: string;
  a: string;
  b: string;
  dungeon: string;
  requires?: string[];
}

export const REGIONS: Record<string, RegionDef> = {
  frontera: { id: 'frontera', name: 'La Frontera', act: 1 },
  rutas: { id: 'rutas', name: 'Las Rutas Perdidas', act: 2 },
  arena: { id: 'arena', name: 'El Mar de Arena', act: 3 },
  cumbres: { id: 'cumbres', name: 'Las Cumbres Blancas', act: 4 },
  maldita: { id: 'maldita', name: 'La Tierra Maldita', act: 5 },
  coral: { id: 'coral', name: 'El Archipiélago Coral', act: 6 },
  inframundo: { id: 'inframundo', name: 'El Inframundo', act: 7 },
  cielo: { id: 'cielo', name: 'El Cielo', act: 8 },
  babel: { id: 'babel', name: 'La Torre de Babel', act: 0 },
};

export const LOCATIONS: Record<string, LocationDef> = {
  bastion_gris: {
    id: 'bastion_gris', name: 'Bastión Gris', region: 'frontera', kind: 'capital', x: 22, y: 62, banner: 'capital',
    desc: 'La ciudad amurallada de la Frontera. Sede de la Expedición en esta región. Sus muros han resistido 300 años.',
    shop: ['pan', 'carne_seca', 'pocion', 'elixir', 'antidoto', 'piedra', 'orbe_retorno', 'mapa_vidente'],
    forge: ['espada_hierro', 'espada_acero', 'martillo_forja', 'martillo_pesado', 'baston_roble', 'arco_corto', 'daga_filo', 'lanza_guardia', 'jubon_cuero', 'tunica_sanador', 'cota_malla', 'anillo_vigor', 'talisman_antiveneno', 'amuleto_luz'],
    npcs: [
      { name: 'Instructora Iria', sprite: 'p_woman2', talks: [
        { lines: ['¿Nuevos? Tres consejos: lleva comida, bebe pociones antes de que sea tarde y pisa la casilla dorada para bajar.', 'Y no te entretengas: a los tres minutos en un piso llega la Parca. Nadie quiere conocerla.'] },
        { requires: ['mq1'], lines: ['Ahora que tenéis insignia, el gremio os abre el campo de entrenamiento. Pasad por él: enseña a romper grietas, abrir candados y más.', 'Y mirad las Noticias de cada pueblo: siempre dicen qué toca hacer.'] },
        { requires: ['mq2'], lines: ['Antes de cada mazmorra podéis pagar a un informante: os marca las escaleras, las trampas o lo que queráis saber.', 'Los que bajan juntos acaban entendiéndose. Cuando os sintáis más unidos, pasad por la fogata de la posada.'] },
        { requires: ['mq3'], lines: ['El gremio ya os deja invertir en el cuartel: una cocina, una forja, una biblioteca... Mirad Mejoras del cuartel.'] },
        { requires: ['mq4'], lines: ['Aren, ahora que el fuego te responde, elige tu afinidad antes de cada mazmorra según a qué te enfrentes.', 'Si encontráis frascos turbios o pergaminos sellados, no los probéis a lo loco: el tasador del gremio os dice qué son.'] },
        { requires: ['mq5'], lines: ['Cuando alguien llegue al nivel 20, que hable con el gremio: hay una prueba de prestigio que solo se hace en solitario.', 'Y si queréis practicar sin perder nada, desde el mapa hay un portal a la Torre de Babel.'] },
        { requires: ['mq6'], lines: ['Ya sois cinco: los que se quedan en el gremio pueden ir de expedición a por materiales mientras bajáis.'] },
      ] },
      { name: 'Guardia de la muralla', sprite: 'p_guard', talks: [
        { lines: ['Alto. ¿Recluta? Hale no deja salir a nadie de la ciudad sin haber vuelto antes de la Cueva Goteante.', 'La entrada está bajo los muros del sur. Lleva comida: allí abajo el tiempo se alarga.'] },
        { requires: ['mq1'], lines: ['Esa insignia es nueva. Enhorabuena, recluta.', 'El camino a Rocaverde está abierto para vosotros. Para nosotros, sigue siendo un río de lodo y colmillos.'] },
        { requires: ['mq4'], lines: ['Los centinelas dicen que el resplandor rojo del este se ha apagado.', 'Hace diez años que no veía a la gente de la muralla sonreír.'] },
      ] },
      { name: 'Mujer preocupada', sprite: 'p_woman', talks: [
        { lines: ['Mi marido es carretero. Salió hacia Rocaverde hace tres semanas.', 'Dicen que el camino se ha llenado de bestias... Si vais hacia allí, preguntad por él. Se llama Dalen.'] },
        { requires: ['mq2'], lines: ['¿Rocaverde sigue en pie? ¿Y Dalen estaba allí? ¡Gracias, gracias!', 'Os guardaré pan para cuando volváis. Es lo único que tengo.'] },
      ] },
      { name: 'Niño juguetón', sprite: 'p_child', talks: [
        { lines: ['¡Mira mi espada! Es de palo, pero mata limos. Bueno, mataría.', '¡Cuando sea mayor seré de la Expedición, como vosotros!'] },
        { requires: ['mq1'], lines: ['¿Es verdad que en la cueva hay limos que se te pegan a la cara? ¡Qué asco! ¡Qué genial!'] },
        { requires: ['mq4'], lines: ['¡Sois los que sellaron la Hondonada! Mi madre dice que ya no tengo que dormir con la vela encendida.'] },
      ] },
      { name: 'Mercader de paso', sprite: 'p_merchant', talks: [
        { lines: ['Las rutas cerradas son una ruina para el negocio. Solo me queda vender a los de la Expedición.', 'Un consejo gratis: nunca bajes sin comida. Un grupo hambriento se muere antes que un grupo herido.'] },
        { requires: ['mq1'], lines: ['Cuantos más vais juntos, antes se vacía la mochila de provisiones. Ir de cuatro tiene su precio.'] },
      ] },
      { name: 'Anciano del muro', sprite: 'p_old', talks: [
        { lines: ['Mi abuelo decía que antes de la Fractura se podía ir de un mar a otro sin ver una muralla.', 'Trescientos años... y seguimos sin saber qué abrió la tierra.'] },
        { requires: ['mq4'], lines: ['Dicen que la Hondonada reaccionó a ti, muchacho. Las grietas no reaccionan a nadie... a menos que alguien las hiciera.'] },
      ] },
    ],
  },
  rocaverde: {
    id: 'rocaverde', name: 'Aldea Rocaverde', region: 'frontera', kind: 'pueblo', x: 55, y: 40, banner: 'pueblo',
    desc: 'Un pueblo de leñadores en el borde del bosque. Las empalizadas están marcadas por garras.',
    shop: ['pan', 'carne_seca', 'pocion', 'antidoto', 'piedra'],
    forge: ['arco_corto', 'arco_compuesto', 'baston_roble', 'jubon_cuero', 'manto_sombras', 'coraza_ignea', 'piedra_tierra', 'broche_viento', 'talisman_antiveneno'],
    npcs: [
      { name: 'Anciana Merra', sprite: 'p_elder', talks: [
        { lines: ['Rocaverde ha sobrevivido a tres inviernos de lobos. No sé si sobrevivirá a un cuarto.'] },
        { requires: ['mq2'], lines: ['El santuario se hundió en una sola noche. Lysa cuidaba de todos nosotros. Traedla de vuelta.'] },
        { requires: ['mq3'], lines: ['Lysa está viva... Gracias. Ahora queda lo peor: la grieta del este, la que arrasó vuestra aldea.'] },
        { requires: ['mq4'], lines: ['Por primera vez en años, los niños juegan fuera de la empalizada.'] },
      ] },
      { name: 'Leñador', sprite: 'p_lumberjack', talks: [
        { lines: ['Los lobos ya no le tienen miedo al fuego. Algo los está empujando fuera del bosque.', 'Mi compañero Tomás entró al Bosque de Espinas a por leña. Hace días que no vuelve.'] },
        { requires: ['done:sq_lenador'], lines: ['¡Tomás volvió! Cojea, pero vuelve a quejarse de todo, así que está bien.', 'Te debo una, recluta. Si necesitas leña para la fogata, ya sabes.'] },
      ] },
      { name: 'Niña con muñeca', sprite: 'p_girl', talks: [
        { lines: ['Mi muñeca se llama Lysa, como la sanadora. Ella me curó la fiebre.', '¿Vais a ir al santuario? Ahí abajo hay arañas. Lo sé porque lo dice todo el mundo.'] },
        { requires: ['mq3'], lines: ['¡La Lysa de verdad ha vuelto! Le he enseñado mi muñeca y se ha reído.'] },
      ] },
      { name: 'Cazador viejo', sprite: 'p_hunter', talks: [
        { lines: ['Los lobos hambrientos se mueven más rápido que tú. Si te alcanzan dos a la vez, retrocede a un pasillo.', 'En un pasillo solo te puede atacar uno de frente.'] },
        { requires: ['mq3'], lines: ['En el resplandor rojo del este hay huesos que andan. El fuego no les hace nada. La luz, dicen, sí.'] },
        { requires: ['mq4'], lines: ['Si ves un bicho dorado, persíguelo hasta una esquina: huye, pero suelta un buen botín.', 'Y si un monstruo tiene un color raro, es de otro elemento. Fíjate antes de elegir con qué atacar.'] },
      ] },
      { name: 'Leñadora Adela', sprite: 'p_woman', talks: [
        { lines: ['En el bosque, a veces las escaleras no se abren solas: hay que bajar una palanca, encender braseros o cazar a unos cuantos lobos.', 'Arriba os sale lo que falta. No es tan difícil.'] },
        { requires: ['mq3'], lines: ['He visto cofres en las mazmorras. Ojo: algunos muerden. Si lleváis a alguien con buen ojo para las trampas, mejor.'] },
      ] },
    ],
  },
  villa_niebla: {
    id: 'villa_niebla', name: 'Villa Niebla', region: 'rutas', kind: 'pueblo', x: 84, y: 24, banner: 'pantano',
    desc: 'Un pueblo sobre pilotes, aislado durante años. Ni la niebla ni el miedo se van nunca.',
    shop: ['pan', 'carne_seca', 'racion', 'pocion', 'pocion_mayor', 'elixir', 'antidoto', 'frasco_fuego', 'semilla_vida'],
    forge: ['hoja_brasa', 'baston_luz', 'arco_compuesto', 'armadura_placas', 'colgante_agua', 'anillo_marea', 'anillo_firmeza', 'manto_sombras'],
    npcs: [
      { name: 'Barquera Nela', sprite: 'p_woman2', talks: [
        { lines: ['El agua corre por algunas salas y te arrastra cada dos turnos. Camina a favor de la corriente, no en contra.', 'Y si te encuentras a alguien perdido ahí abajo, llévalo hasta las escaleras. Si muere por el camino, dicen que trae mala suerte.'] },
        { requires: ['mq6'], lines: ['Más al norte hay gólems de piedra que vigilan. Mira hacia dónde miran (lo rojo) y pasa cuando giren.', 'Hay tenderos ahí abajo, ¿sabes? Pagadles antes de salir de su sala. Sus guardias no perdonan.'] },
      ] },
      { name: 'Pescador', sprite: 'p_fisher', talks: [
        { lines: ['Hace años que no veíamos a alguien de la Expedición. Pensábamos que el mundo se había acabado más allá del paso.', 'La niebla de la ciénaga no es natural. Respira. Por la noche la oigo respirar.'] },
        { requires: ['mq6'], lines: ['La niebla se está levantando... Esta mañana he visto el sol por primera vez desde que era niño.'] },
      ] },
      { name: 'Mujer de los pilotes', sprite: 'p_woman2', talks: [
        { lines: ['Varo, el explorador, prometió volver con un mapa de la ciénaga. Eso fue hace un mes.', 'Si lo encontráis... decidle que su hija aún le espera en el embarcadero.'] },
        { requires: ['done:sq_varo'], lines: ['Varo ha vuelto. Flaco como un junco, pero vivo. No sé cómo pagaros.'] },
      ] },
      { name: 'Niño del embarcadero', sprite: 'p_child', talks: [
        { lines: ['La cazadora me dio una flecha de regalo. Dice que es mejor que la Expedición. ¿Es verdad?', 'Ella entra sola en la ciénaga. ¡Sola! Está loca, ¿no?'] },
        { requires: ['mq6'], lines: ['¡La cazadora va con vosotros ahora! Le he preguntado si me enseña a disparar. Ha dicho que no. Pero ha sonreído.'] },
      ] },
    ],
  },
};

/** Localidad fuera de la historia: se llega por portal desde cualquier sitio. */
export const TOWER_ID = 'torre_babel';

LOCATIONS[TOWER_ID] = {
  id: TOWER_ID, name: 'Torre de Babel', region: 'babel', kind: 'torre', x: 8, y: 16, banner: 'torre',
  desc: 'Una torre que nadie construyó, más antigua que la Fractura. Sus pisos cambian cada vez que alguien sube. El gremio la usa para entrenar y para probar lo que aún no entiende.',
  shop: ['pan', 'carne_seca', 'racion', 'pocion', 'pocion_mayor', 'elixir', 'antidoto', 'piedra', 'frasco_fuego', 'orbe_retorno', 'semilla_vida', 'mapa_vidente'],
  forge: ['espada_acero', 'hoja_brasa', 'martillo_pesado', 'baston_luz', 'arco_compuesto', 'daga_filo', 'lanza_guardia', 'cota_malla', 'manto_sombras', 'coraza_ignea', 'armadura_placas', 'amuleto_luz', 'colgante_agua', 'piedra_tierra', 'broche_viento', 'anillo_firmeza', 'anillo_marea', 'talisman_antiveneno'],
  npcs: [
    { name: 'Guardiana de la Torre', sprite: 'p_elder', talks: [
      { lines: ['Bienvenidos a Babel. Aquí no hay misiones ni historia: solo pisos.', 'En la preparación podéis elegir el rango: los monstruos se ajustan a vuestro nivel medio, más o menos según el rango.', 'Todas las mazmorras de aquí son sin fin. Cada 10 pisos algo grande os espera; si lo vencéis, encontraréis un campamento justo después.', 'Y recordad: es solo práctica. Lo que ganéis o gastéis ahí dentro no sale de la torre.'] },
    ] },
    { name: 'Escriba de la Torre', sprite: 'p_old', talks: [
      { lines: ['Anoto lo alto que llega cada grupo. Consulta tu récord en la preparación de cada mazmorra.', 'En el Desfile de jefes no hay pisos: cada sala es un jefe de cualquier rincón del mundo. Dicen que hasta Él aparece a veces.', 'Las salas con candado siempre tienen solución: la llave nunca está encerrada tras su propia puerta.'] },
    ] },
  ],
};

export const DUNGEON_SPOTS: DungeonSpot[] = [
  { dungeon: 'cueva_goteante', from: 'bastion_gris', x: 12, y: 80 },
  { dungeon: 'bosque_espinas', from: 'rocaverde', x: 44, y: 22 },
  { dungeon: 'ruinas_santuario', from: 'rocaverde', x: 70, y: 56, requires: ['mq2'] },
  { dungeon: 'hondonada_frontera', from: 'rocaverde', x: 64, y: 76, requires: ['mq3'] },
  { dungeon: 'cienaga_niebla', from: 'villa_niebla', x: 92, y: 46, requires: ['mq5'] },
  { dungeon: 'llanura_plumas', from: 'villa_niebla', x: 74, y: 8, requires: ['mq6'] },
  { dungeon: 'templo_sectario', from: 'villa_niebla', x: 96, y: 14, requires: ['mq5'] },
  { dungeon: 'babel_infinita', from: TOWER_ID, x: 6, y: 2 },
  { dungeon: 'babel_trampas', from: TOWER_ID, x: 20, y: 10 },
  { dungeon: 'babel_llaves', from: TOWER_ID, x: 20, y: 23 },
  { dungeon: 'babel_elementos', from: TOWER_ID, x: 6, y: 31 },
  { dungeon: 'babel_terrenos', from: TOWER_ID, x: 22, y: 36 },
  { dungeon: 'babel_condiciones', from: TOWER_ID, x: 34, y: 17 },
  { dungeon: 'babel_travesia', from: TOWER_ID, x: 34, y: 4 },
];

export const ROUTES: RouteDef[] = [
  { id: 'r_sendero', a: 'bastion_gris', b: 'rocaverde', dungeon: 'sendero_lodoso', requires: ['mq1'] },
  { id: 'r_cuervo', a: 'rocaverde', b: 'villa_niebla', dungeon: 'paso_cuervo', requires: ['mq4'] },
];

// ---------------------------------------------------------------- Actos 2 (resto) a 8

const T1 = ['pan', 'carne_seca', 'racion', 'pocion', 'pocion_mayor', 'elixir', 'antidoto', 'piedra', 'frasco_fuego', 'orbe_retorno'];
const T2 = [...T1, 'semilla_vida', 'mapa_vidente', 'pocion_suprema'];
const T3 = [...T2, 'elixir_mayor'];
const F3 = ['cimitarra_sol', 'maza_cantera', 'baston_oasis', 'arco_duna', 'aguijon', 'lanza_albar', 'coraza_arena', 'pelliza_lobo', 'tunica_escarcha', 'anillo_sol', 'amuleto_hielo'];
const F4 = ['espada_hueso', 'martillo_osario', 'baston_coral', 'arco_coral', 'daga_marea', 'tridente', 'coraza_coral', 'manto_marea', 'anillo_osario', 'perla_abismo'];
const F5 = ['hoja_ocaso', 'martillo_dis', 'baston_serafin', 'arco_pluma', 'daga_ceniza', 'lanza_dis', 'armadura_dis', 'tunica_coro', 'anillo_rey', 'pluma_caida'];

/** Ciudades que caen en el acto 5 (flag `traicion`): cada una es una mazmorra hasta liberarla. */
const fall = (dungeon: string) => ({ dungeon, flag: 'traicion' });
LOCATIONS.villa_niebla.taken = fall('niebla_tomada');
LOCATIONS.rocaverde.taken = fall('rocaverde_tomada');
LOCATIONS.bastion_gris.taken = fall('bastion_tomado');
LOCATIONS.villa_niebla.forge.push(...F3.slice(0, 6));

// Lo que cuenta la gente de las primeras ciudades cuando vuelve el grupo (acto 5 en adelante).
LOCATIONS.bastion_gris.npcs[0].talks.push(
  { requires: ['mq28'], lines: ['Lo que habéis hecho... Hale no lo dirá, pero nadie aquí esperaba volver a ver el sol desde la muralla.', 'Si salís al mar, buscad Puerto Coral. Dicen que ahí atracó un barco negro con un hombre de armadura gris.'] },
  { requires: ['mq36'], lines: ['Las plumas cayeron como nieve. Luego vino la luz. Y luego... ya no quedaba casi nadie en la plaza.', 'Si vais arriba, no volváis sin respuestas.'] },
);
LOCATIONS.bastion_gris.npcs[1].talks.push(
  { requires: ['mq17'], lines: ['¿Garrick? ¿Traidor? Bebía conmigo cada noche en la muralla. No me lo creo... no quiero creérmelo.'] },
  { requires: ['mq28'], lines: ['He vuelto a mi puesto. Los muros han caído y se han vuelto a levantar. Como nosotros.'] },
);
LOCATIONS.villa_niebla.npcs[0].talks.push(
  { requires: ['mq7'], lines: ['Al otro lado del lago está Aguaclara, la capital. El camino de juncos está lleno de bichos, pero es el único.'] },
  { requires: ['mq26'], lines: ['Me escondí bajo el embarcadero tres días. Os oí luchar arriba. No sabía si erais vosotros o ellos.'] },
);
LOCATIONS.rocaverde.npcs[0].talks.push(
  { requires: ['mq27'], lines: ['Otra vez nos salváis. Empiezo a pensar que Rocaverde os trae suerte. O vosotros a ella.'] },
);

const LOCS: LocationDef[] = [
  // ---------- Acto 2: Las Rutas Perdidas ----------
  {
    id: 'aguaclara', name: 'Aguaclara', region: 'rutas', kind: 'capital', x: 104, y: 40, banner: 'capital', taken: fall('aguaclara_tomada'),
    desc: 'La capital del lago, construida sobre puentes y torres de piedra blanca. Aquí se reza al Coro del Alba más que en ningún otro sitio.',
    shop: T1, forge: ['hoja_brasa', 'baston_luz', 'arco_compuesto', 'armadura_placas', 'anillo_marea', 'colgante_agua', ...F3.slice(0, 3)],
    npcs: [
      { name: 'Sacerdotisa del lago', sprite: 'p_woman2', talks: [
        { lines: ['Bienvenidos a Aguaclara. El Coro nos protege: aquí las grietas no se atreven.', 'Hace poco un ángel bajó a la plaza y bendijo a los niños. Fue precioso.'] },
        { requires: ['mq8'], lines: ['El Coro dice que la gran grieta está al norte, en las Cumbres Blancas. Para llegar hay que cruzar el Mar de Arena.', 'Las Dunas Errantes empiezan al sur del lago. Llevad mucha comida: allí no hay nada.'] },
        { requires: ['mq25'], lines: ['Recé y recé mientras los demonios quemaban los puentes. Ningún ángel bajó.', 'Ya no sé a quién rezo.'] },
      ] },
      { name: 'Pescador de los puentes', sprite: 'p_fisher', talks: [
        { lines: ['En el desierto las salas están llenas de arena y escorpiones. Si un escorpión te envenena, cúrate antes de seguir: el veneno no perdona.', 'Y comprad antídotos. Muchos.'] },
        { requires: ['mq12'], lines: ['Dicen que un esqueleto anda con vosotros. ¿Uno que habla? ¿Y que lee? Ya lo he visto todo.'] },
      ] },
    ],
  },
  {
    id: 'juncal', name: 'Juncal', region: 'rutas', kind: 'pueblo', x: 118, y: 22, banner: 'pantano',
    desc: 'Un pueblo de cesteros escondido entre juncos altísimos, al final del Robledal.',
    shop: T1, forge: ['arco_compuesto', 'manto_sombras', 'broche_viento', 'anillo_firmeza'],
    npcs: [
      { name: 'Cestera Olma', sprite: 'p_elder', talks: [
        { lines: ['Aquí no llega nadie. Si habéis cruzado el Robledal, sois de fiar... o estáis locos.', 'En los bosques viejos las raíces atrapan los pies. Si os enredáis, no gastéis turnos peleando: id a por otra casilla.'] },
      ] },
      { name: 'Niño cestero', sprite: 'p_child', talks: [
        { lines: ['¿Habéis visto a los lobos del Robledal? ¡Tienen los ojos verdes! Yo los he visto. Desde muy lejos.'] },
      ] },
    ],
  },
  // ---------- Acto 3: El Mar de Arena ----------
  {
    id: 'palmarroja', name: 'Palmarroja', region: 'arena', kind: 'pueblo', x: 112, y: 76, banner: 'desierto', taken: fall('palmarroja_tomada'),
    desc: 'Un oasis de palmeras rojas en medio del desierto. Todas las caravanas paran aquí... si llegan.',
    shop: T2, forge: F3,
    npcs: [
      { name: 'Aguadora Zahra', sprite: 'p_woman', talks: [
        { lines: ['¡No bebáis de los pozos! Alguien los ha envenenado. La gente cae enferma cada día.', 'Los pozos viejos están al este. Bajan muy hondo, hasta donde vive algo grande con pinzas.'] },
        { requires: ['mq10'], lines: ['El agua vuelve a ser dulce. Mis hijos han bebido sin miedo por primera vez en un mes.', 'La ciudad grande, Solmarena, está más allá del Cañón de Sal. La tiene rodeada un ejército de esqueletos.'] },
        { requires: ['mq24'], lines: ['Los demonios quemaron las palmeras. Volverán a crecer. Aquí todo vuelve a crecer.'] },
      ] },
      { name: 'Caravanero viejo', sprite: 'p_merchant', talks: [
        { lines: ['En el desierto, la arena tapa las escaleras. Si no las encontráis, buscad paredes agrietadas: suelen esconder atajos.', 'Y no os quedéis quietos. El sol también es un enemigo.'] },
        { requires: ['mq12'], lines: ['La capitana de los esqueletos se ha retirado al norte. Primera vez en años que las caravanas se mueven sin escolta.'] },
      ] },
    ],
  },
  {
    id: 'solmarena', name: 'Solmarena', region: 'arena', kind: 'capital', x: 132, y: 92, banner: 'desierto', taken: fall('solmarena_tomada'),
    desc: 'La ciudad amurallada del desierto, de piedra dorada. Lleva un año sitiada por el ejército de los esqueletos.',
    shop: T2, forge: F3,
    npcs: [
      { name: 'General Asim', sprite: 'p_guard', talks: [
        { lines: ['Un año de asedio. Sus arqueros no duermen, sus soldados no comen. Nosotros sí.', 'La capitana Seren manda desde un fortín de hueso al norte. Si cae ella, cae el asedio.'] },
        { requires: ['mq12'], lines: ['Seren se ha retirado. No ha muerto: los esqueletos no mueren tan fácil. Pero se ha ido.', 'Al norte, pasado el Paso Helado, empiezan las Cumbres Blancas. Allí está la gran grieta.'] },
        { requires: ['mq23'], lines: ['Y ahora la capitana de los esqueletos lucha a vuestro lado. El mundo se ha vuelto del revés.', 'Me da igual. Ha defendido mi ciudad. Eso basta.'] },
      ] },
      { name: 'Erudita del archivo', sprite: 'p_woman2', talks: [
        { lines: ['Hay un esqueleto encerrado en nuestro archivo. Se rindió solo y pidió libros. ¡Libros!', 'Se llama Odric. Dice que no entiende por qué los suyos luchan. Yo tampoco.'] },
        { requires: ['mq11'], lines: ['Los esqueletos débiles al agua y a la luz; los demonios, a la luz. Odric lo ha escrito todo. Lo copio para la biblioteca del gremio.'] },
        { requires: ['mq23'], lines: ['Cuando cayó la ciudad, salvé lo que pude del archivo. Odric me ha dado las gracias tres veces. Los esqueletos no lloran, pero casi.'] },
      ] },
    ],
  },
  {
    id: 'cantera_seca', name: 'Cantera Seca', region: 'arena', kind: 'pueblo', x: 152, y: 104, banner: 'desierto',
    desc: 'Un pueblo minero excavado en la roca. La mina se hundió y algo vive ahora en sus túneles.',
    shop: T2, forge: ['maza_cantera', 'coraza_arena', 'piedra_tierra', 'anillo_sol', 'armadura_placas'],
    npcs: [
      { name: 'Capataz Ruy', sprite: 'p_lumberjack', talks: [
        { lines: ['La mina se tragó a medio turno de noche. Los demás no quieren volver a bajar.', 'Si bajáis, llevad bombas: hay túneles tapiados con roca reforzada que solo se abren a golpe de pólvora.'] },
      ] },
      { name: 'Minera Tula', sprite: 'p_girl', talks: [
        { lines: ['Cuando el hielo cubre el suelo resbalas hasta chocar con algo. En la mina pasa igual con la arena suelta... bueno, más o menos.', 'Lo que sí es verdad: en las cumbres, mirad bien antes de pisar el hielo.'] },
      ] },
    ],
  },
  // ---------- Acto 4: Las Cumbres Blancas ----------
  {
    id: 'pico_escarcha', name: 'Pico Escarcha', region: 'cumbres', kind: 'pueblo', x: 150, y: 58, banner: 'nieve', taken: fall('pico_tomada'),
    desc: 'Un pueblo minero colgado de la montaña. El viento sopla tan fuerte que las casas están atadas con cadenas.',
    shop: T2, forge: F3,
    npcs: [
      { name: 'Minero Bruno', sprite: 'p_lumberjack', talks: [
        { lines: ['El hielo es traicionero: si lo pisas, resbalas hasta chocar con algo. Planea el camino antes de pisar.', 'Los demonios bajan del glaciar cada noche. Dicen que tienen capitanes. Dicen que la grieta grande los alimenta.'] },
        { requires: ['mq17'], lines: ['¿La grieta no se cierra? Entonces... ¿para qué hemos sufrido todo esto?'] },
        { requires: ['mq22'], lines: ['Las cadenas aguantaron. Las casas aguantaron. Y nosotros, gracias a vosotros.'] },
      ] },
      { name: 'Niña de las cadenas', sprite: 'p_girl', talks: [
        { lines: ['Mi padre dice que el señor de armadura gris (¿Garrick?) le preguntó mucho por la grieta. Mucho, mucho.'] },
        { requires: ['mq17'], lines: ['Lo sabía. Tenía la mirada rara. Como los lobos cuando huelen sangre.'] },
      ] },
    ],
  },
  {
    id: 'fuerte_albar', name: 'Fuerte Albar', region: 'cumbres', kind: 'capital', x: 172, y: 36, banner: 'nieve', taken: fall('albar_tomada'),
    desc: 'La fortaleza helada de las cumbres, la última muralla antes de la gran grieta. Sus centinelas no han visto el verano en diez años.',
    shop: T2, forge: [...F3, 'espada_hueso', 'coraza_coral'],
    npcs: [
      { name: 'Comandante Ilse', sprite: 'p_guard', talks: [
        { lines: ['Dos capitanes demonios guardan la grieta: Morgath en su bastión, al este, e Ixa en la cumbre del glaciar.', 'Mientras vivan, nadie llega al fondo. Vencedlos a los dos y os abriré el paso.'] },
        { requires: ['mq16'], lines: ['Los dos capitanes caídos. La gran grieta está abierta para vosotros. Que el Coro... no. Que la suerte os acompañe.', 'Un consejo de vieja: el núcleo es otra cosa. Si alguno ya ha tocado techo (nivel 20), que haga antes la prueba de prestigio del gremio.'] },
        { requires: ['mq21'], lines: ['Vi cómo la Legión subía por la escalera de huesos. Cientos. Miles. No pudimos con ellos.', 'Vosotros sí. Fuerte Albar os pertenece.'] },
      ] },
      { name: 'Herrera del fuerte', sprite: 'p_woman', talks: [
        { lines: ['En el frío, las armas se rompen. Pasad por la herrería y traed materiales: con una forja en el cuartel podéis mejorar el equipo a +2.'] },
        { requires: ['mq17'], lines: ['Tu amigo el de la armadura gris se llevó algo del núcleo, ¿verdad? Yo lo vi pasar corriendo. Brillaba entre sus manos.'] },
      ] },
    ],
  },
  {
    id: 'refugio_lobo', name: 'Refugio del Lobo Blanco', region: 'cumbres', kind: 'pueblo', x: 192, y: 20, banner: 'nieve',
    desc: 'Una cabaña de cazadores en lo alto del Bosque Blanco. Los lobos blancos la rodean, pero no atacan.',
    shop: T2, forge: ['pelliza_lobo', 'arco_duna', 'lanza_albar', 'amuleto_hielo'],
    npcs: [
      { name: 'Cazadora Nieve', sprite: 'p_hunter', talks: [
        { lines: ['Los lobos blancos no son enemigos. Son los que huyen de la grieta. Como nosotros.', 'Kaela, ¿verdad? He oído hablar de ti. Dicen que nunca fallas.'] },
      ] },
      { name: 'Trampero Gael', sprite: 'p_old', talks: [
        { lines: ['Las tormentas de nieve en las mazmorras os tapan la vista: la niebla blanca. Si no veis, id pegados a la pared.'] },
      ] },
    ],
  },
  // ---------- Acto 5: La Tierra Maldita ----------
  {
    id: 'madriguera', name: 'La Madriguera', region: 'maldita', kind: 'pueblo', x: 216, y: -10, banner: 'hueso',
    desc: 'Un escondite humano bajo las raíces de un árbol muerto, en plena tierra de los esqueletos. Huele a humo y a pan duro.',
    shop: ['pan', 'carne_seca', 'pocion', 'pocion_mayor', 'antidoto', 'piedra', 'elixir'], forge: ['espada_hueso', 'jubon_cuero', 'cota_malla'],
    npcs: [
      { name: 'Abuela Tomasa', sprite: 'p_elder', talks: [
        { lines: ['Caísteis del cielo como piedras. Pip os arrastró hasta aquí uno a uno. Ese crío vale más que todos nosotros juntos.', 'Aquí abajo los esqueletos no nos buscan. Ahí fuera, en el Yermo de Ceniza, sí.'] },
        { requires: ['mq18'], lines: ['Osario está al oeste, tras sus puertas. Es la ciudad de los esqueletos. Si queréis volver a casa, la única escalera que sube a las cumbres sale de allí.'] },
      ] },
      { name: 'Hombre del túnel', sprite: 'p_npc', talks: [
        { lines: ['Los esqueletos de esta tierra son distintos: más fuertes, y teñidos de sombra o de tierra. Fijaos en el color antes de elegir afinidad.'] },
        { requires: ['mq18'], lines: ['Pip os seguirá a donde vayáis. Cuidadlo. O mejor: dejad que él os cuide.'] },
      ] },
    ],
  },
  {
    id: 'osario', name: 'Osario', region: 'maldita', kind: 'capital', x: 194, y: -22, banner: 'hueso',
    desc: 'La ciudad de los esqueletos: torres de hueso, calles de ceniza y un silencio que pesa. Hoy, un caos: la Legión los ha abandonado.',
    shop: T2, forge: [...F4.slice(0, 6), 'coraza_coral', 'anillo_osario'],
    npcs: [
      { name: 'Escriba de hueso', sprite: 'm_skeleton', talks: [
        { lines: ['Un humano. Y otro. Y un esqueleto de agua con ellos... Odric, ¿eres tú? El archivo te echa de menos.', 'La Legión se ha llevado a los capitanes y ha dejado la ciudad a su suerte. Dicen que un demonio con cara de humano lo ordenó.'] },
        { requires: ['mq20'], lines: ['La capitana Seren no volvió del sur. Dicen que la traicionaron, como a vosotros.'] },
      ] },
      { name: 'Soldado sin capitán', sprite: 'm_skeleton', talks: [
        { lines: ['Nos dijeron que luchábamos por nuestra tierra. Era mentira. Luchábamos para que los demonios tuvieran la suya.', 'Si salís por la Escalera de Huesos, llegaréis a Fuerte Albar. O a lo que quede de él.'] },
      ] },
    ],
  },
  // ---------- Acto 6: El Archipiélago Coral ----------
  {
    id: 'puerto_coral', name: 'Puerto Coral', region: 'coral', kind: 'capital', x: 8, y: 96, banner: 'mar',
    desc: 'El puerto más grande del mundo libre, de casas pintadas y muelles de coral rojo. Huele a sal, a pescado y a contrabando.',
    shop: T3, forge: F4,
    npcs: [
      { name: 'Capitana Mara', sprite: 'p_woman2', talks: [
        { lines: ['¿Un barco negro con un hombre de armadura gris? Lo vi. Zarpó hacia Isla Gaviota hace una luna.', 'El arrecife está lleno de serpientes. Las salas con corrientes os arrastran: aprovechadlas en vez de luchar contra ellas.'] },
        { requires: ['mq32'], lines: ['¿Un demonio? ¿Y los ángeles lo...? Dejad de contarme cosas, que luego no duermo.'] },
      ] },
      { name: 'Contrabandista', sprite: 'p_merchant', talks: [
        { lines: ['Vendo de todo. Lo que no vendo es información... gratis. Bueno, esta sí: las serpientes marinas son de agua. Aren, ya sabes qué hacer.'] },
      ] },
    ],
  },
  {
    id: 'isla_gaviota', name: 'Isla Gaviota', region: 'coral', kind: 'pueblo', x: -12, y: 112, banner: 'mar',
    desc: 'Una isla de acantilados blancos y miles de gaviotas. Sus brujas tejen mantos con algas.',
    shop: T3, forge: ['manto_marea', 'perla_abismo', 'baston_coral', 'daga_marea'],
    npcs: [
      { name: 'Bruja de las algas', sprite: 'p_elder', talks: [
        { lines: ['El barco negro paró aquí para cargar agua. Su capitán no comía ni bebía. Y su sombra... se movía sola.', 'Al oeste, pasando el Cayo Hueco, está el Faro del Fin. Más allá ya no hay mapas.'] },
      ] },
      { name: 'Niño de las gaviotas', sprite: 'p_child', talks: [
        { lines: ['¡Pip! ¿Me enseñas a robar huevos de gaviota? ¡Pero sin que se enfaden!'] },
      ] },
    ],
  },
  {
    id: 'faro_fin', name: 'Faro del Fin', region: 'coral', kind: 'pueblo', x: -32, y: 128, banner: 'mar',
    desc: 'El último faro del mundo. Desde lo alto se ve una isla negra con un fuerte, y el mar que la rodea hierve.',
    shop: T3, forge: [...F4, 'hoja_ocaso'],
    npcs: [
      { name: 'Farero Odo', sprite: 'p_old', talks: [
        { lines: ['Ese fuerte es el Bastión Negro. Apareció una noche, de la nada. Desde entonces el mar hierve a su alrededor.', 'Bajo el faro hay una cueva que lleva al fuerte. Si vais, que sea con todo.'] },
        { requires: ['mq32'], lines: ['La luz que bajó del cielo... la vi desde aquí arriba. No era luz de faro. Era luz de juicio.', 'Bajo el fuerte se abrió un pozo que no tiene fondo. Huele a azufre.'] },
      ] },
      { name: 'Marinera', sprite: 'p_woman', talks: [
        { lines: ['Llevad pociones fuertes. Allí dentro los monstruos ya no son bichos de cueva: son soldados de la Legión.'] },
      ] },
    ],
  },
  // ---------- Acto 7: El Inframundo ----------
  {
    id: 'brasa_quieta', name: 'Brasa Quieta', region: 'inframundo', kind: 'refugio', x: -50, y: 156, banner: 'infierno',
    desc: 'Un campamento de demonios desertores al borde de un río de lava. No quieren luchar más. Comercian con lo que tienen.',
    shop: T3, forge: F5,
    npcs: [
      { name: 'Desertora Kra', sprite: 'm_imp', talks: [
        { lines: ['Vael. Creíamos que estabas muerta. Y traes humanos. Y un esqueleto. Y... ¿eso es un ángel?', 'Para llegar a Dis hay que cruzar el Círculo de Ceniza y los Ríos de Fuego. Cada uno tiene su guardián.'] },
        { requires: ['mq35'], lines: ['La Ciudadela de Dis está abierta. Asmodar os espera en su trono. Nunca ha perdido. Nunca.'] },
      ] },
      { name: 'Herrero de lava', sprite: 'm_demon', talks: [
        { lines: ['Forjo para quien paga. Hasta para humanos. El oro no tiene bando.', 'En los Ríos de Fuego hay brasas por todas partes: queman a quien las pisa. Id con algo que resista el fuego.'] },
      ] },
    ],
  },
  // ---------- Acto 8: El Cielo ----------
  {
    id: 'jardin_plumas', name: 'Jardín de las Plumas Caídas', region: 'cielo', kind: 'refugio', x: 30, y: -40, banner: 'cielo',
    desc: 'Un jardín blanco en las afueras de Alba Eterna, donde viven los ángeles a los que el Coro cortó las alas. Lysa nació aquí.',
    shop: T3, forge: F5,
    npcs: [
      { name: 'Ángel sin alas', sprite: 'p_woman2', talks: [
        { lines: ['Lysa... has vuelto. Y traes mortales. Nadie ha traído mortales jamás.', 'Las cuatro torres de los capitanes rodean el trono: Espada, Escudo, Balanza y Voz. Mientras vivan, el trono está sellado.'] },
        { requires: ['done:mq38', 'done:mq39', 'done:mq40', 'done:mq41'], lines: ['Las cuatro torres han caído. El trono os espera. Y Él también.'] },
      ] },
      { name: 'Jardinero del Jardín', sprite: 'p_old', talks: [
        { lines: ['Los ángeles son de luz: la sombra les hace daño. Aren, si la oscuridad te responde, úsala aquí.', 'Y llevad semillas de vida. Arriba no hay segundas oportunidades.'] },
      ] },
    ],
  },
];
for (const l of LOCS) LOCATIONS[l.id] = l;

DUNGEON_SPOTS.push(
  { dungeon: 'pozos_envenenados', from: 'palmarroja', x: 124, y: 66, requires: ['mq9'] },
  { dungeon: 'fortin_hueso', from: 'solmarena', x: 142, y: 78, requires: ['mq11'] },
  { dungeon: 'bastion_morgath', from: 'fuerte_albar', x: 186, y: 44, requires: ['mq14'] },
  { dungeon: 'cumbre_ixa', from: 'fuerte_albar', x: 162, y: 22, requires: ['mq14'] },
  { dungeon: 'gran_grieta', from: 'fuerte_albar', x: 180, y: 10, requires: ['mq16'] },
  { dungeon: 'yermo_ceniza', from: 'madriguera', x: 226, y: -26, requires: ['mq17'] },
  { dungeon: 'bastion_negro', from: 'faro_fin', x: -44, y: 116, requires: ['mq31'] },
  { dungeon: 'circulo_ceniza', from: 'brasa_quieta', x: -62, y: 170, requires: ['mq33'] },
  { dungeon: 'rios_fuego', from: 'brasa_quieta', x: -36, y: 172, requires: ['mq33'] },
  { dungeon: 'ciudadela_dis', from: 'brasa_quieta', x: -50, y: 186, requires: ['done:mq34', 'done:mq35'] },
  { dungeon: 'torre_espada', from: 'jardin_plumas', x: 14, y: -52, requires: ['mq37'] },
  { dungeon: 'torre_escudo', from: 'jardin_plumas', x: 46, y: -52, requires: ['mq37'] },
  { dungeon: 'torre_balanza', from: 'jardin_plumas', x: 14, y: -28, requires: ['mq37'] },
  { dungeon: 'torre_voz', from: 'jardin_plumas', x: 46, y: -28, requires: ['mq37'] },
  { dungeon: 'trono_alba', from: 'jardin_plumas', x: 30, y: -62, requires: ['done:mq38', 'done:mq39', 'done:mq40', 'done:mq41'] },
);

ROUTES.push(
  { id: 'r_lago', a: 'villa_niebla', b: 'aguaclara', dungeon: 'lago_juncos', requires: ['mq7'] },
  { id: 'r_robledal', a: 'aguaclara', b: 'juncal', dungeon: 'robledal', requires: ['mq8'] },
  { id: 'r_dunas', a: 'aguaclara', b: 'palmarroja', dungeon: 'dunas_errantes', requires: ['mq8'] },
  { id: 'r_canon', a: 'palmarroja', b: 'solmarena', dungeon: 'canon_sal', requires: ['mq10'] },
  { id: 'r_mina', a: 'solmarena', b: 'cantera_seca', dungeon: 'mina_enterrada', requires: ['mq11'] },
  { id: 'r_paso', a: 'solmarena', b: 'pico_escarcha', dungeon: 'paso_helado', requires: ['mq12'] },
  { id: 'r_glaciar', a: 'pico_escarcha', b: 'fuerte_albar', dungeon: 'glaciar_azul', requires: ['mq13'] },
  { id: 'r_bosque_blanco', a: 'fuerte_albar', b: 'refugio_lobo', dungeon: 'bosque_blanco', requires: ['mq14'] },
  { id: 'r_osario', a: 'madriguera', b: 'osario', dungeon: 'puertas_osario', requires: ['mq18'] },
  { id: 'r_escalera', a: 'osario', b: 'fuerte_albar', dungeon: 'escalera_huesos', requires: ['mq19'] },
  { id: 'r_costa', a: 'bastion_gris', b: 'puerto_coral', dungeon: 'costa_rota', requires: ['mq28'] },
  { id: 'r_arrecife', a: 'puerto_coral', b: 'isla_gaviota', dungeon: 'arrecife', requires: ['mq29'] },
  { id: 'r_cayo', a: 'isla_gaviota', b: 'faro_fin', dungeon: 'cayo_hueco', requires: ['mq30'] },
  { id: 'r_descenso', a: 'faro_fin', b: 'brasa_quieta', dungeon: 'descenso', requires: ['mq32'] },
  { id: 'r_escalinata', a: 'bastion_gris', b: 'jardin_plumas', dungeon: 'escalinata_cielo', requires: ['mq36'] },
);

// ---------------------------------------------------------------- Pueblos de más (secundarios)

const MORE: LocationDef[] = [
  {
    id: 'molinogris', name: 'Molinogris', region: 'frontera', kind: 'pueblo', x: 6, y: 46, banner: 'pueblo',
    desc: 'Un pueblo de molineros al oeste del Bastión. Los molinos siguen girando, aunque ya casi nadie trae trigo.',
    shop: ['pan', 'carne_seca', 'pocion', 'antidoto', 'piedra'], forge: ['espada_hierro', 'martillo_forja', 'jubon_cuero', 'anillo_vigor'],
    npcs: [
      { name: 'Molinera Rosa', sprite: 'p_woman', talks: [
        { lines: ['Los bandidos se esconden en los trigales. Roban la harina y luego nos la venden más cara.', 'Si os encontráis una palanca en una mazmorra, pisadla: muchas escaleras solo se abren así.'] },
        { requires: ['mq4'], lines: ['Dicen que alguien está levantando Vado otra vez. Si necesitan harina, aquí tienen.'] },
      ] },
      { name: 'Niño del molino', sprite: 'p_child', talks: [
        { lines: ['¡Cuando gira el molino grande, el suelo tiembla! Como en las grietas, pero sin monstruos.'] },
      ] },
    ],
  },
  {
    id: 'vado', name: 'Vado', region: 'frontera', kind: 'pueblo', x: 86, y: 42, banner: 'pueblo',
    desc: 'La aldea de Aren y Bram. La grieta la arrasó en una noche; poco a poco, los vecinos vuelven a levantarla.',
    shop: ['pan', 'carne_seca', 'racion', 'pocion', 'pocion_mayor', 'antidoto'], forge: ['espada_acero', 'martillo_pesado', 'cota_malla', 'coraza_ignea'],
    npcs: [
      { name: 'Tía Berta', sprite: 'p_elder', talks: [
        { lines: ['¡Aren! ¡Bram! Os creíamos muertos. Mirad lo que queda... Bueno. Mirad lo que vamos a hacer con lo que queda.', 'La reconstrucción se paga en Rocaverde. Cada moneda cuenta.'] },
        { requires: ['mq17'], lines: ['Pase lo que pase ahí fuera, aquí siempre tendréis un plato caliente.'] },
      ] },
      { name: 'Herrero aprendiz', sprite: 'p_lumberjack', talks: [
        { lines: ['Yo era aprendiz del padre de Bram. Su martillo se quedó bajo las cenizas de la forja. Nunca lo encontré.'] },
        { requires: ['done:sq_bram'], lines: ['La forja vuelve a sonar. El viejo estaría orgulloso. De los dos.'] },
      ] },
    ],
  },
  {
    id: 'dunavieja', name: 'Dunavieja', region: 'arena', kind: 'pueblo', x: 94, y: 96, banner: 'desierto',
    desc: 'Un campamento de buscadores de ruinas junto a una ciudad que la arena se tragó hace trescientos años.',
    shop: T2, forge: ['aguijon', 'arco_duna', 'coraza_arena', 'anillo_sol', 'piedra_tierra'],
    npcs: [
      { name: 'Buscadora Nur', sprite: 'p_woman2', talks: [
        { lines: ['Dunavieja era una ciudad enorme antes de la Fractura. Lo que hay ahí abajo cambia todo lo que nos contaron.', 'Hay tablillas con una escritura que nadie entiende. Si tuviera a alguien que supiera leer cosas antiguas...'] },
        { requires: ['mq11'], lines: ['¿Vuestro esqueleto lee escritura antigua? ¿De verdad? ¡Traedme tablillas!'] },
      ] },
      { name: 'Camellero', sprite: 'p_merchant', talks: [
        { lines: ['En las ruinas los suelos se hunden. Si veis una casilla rara, no la piséis: puede ser un hoyo que te tira al piso de abajo.'] },
      ] },
    ],
  },
  {
    id: 'hielonegro', name: 'Hielonegro', region: 'cumbres', kind: 'pueblo', x: 132, y: 38, banner: 'nieve',
    desc: 'Un pueblo de pescadores que hacen agujeros en un lago de hielo negro. Lo que pescan no siempre es un pez.',
    shop: T2, forge: ['tunica_escarcha', 'amuleto_hielo', 'lanza_albar', 'pelliza_lobo'],
    npcs: [
      { name: 'Pescadora vieja', sprite: 'p_fisher', talks: [
        { lines: ['El hielo negro no se derrite nunca. Dicen que es la grieta, que lo enfría desde abajo.', 'En el hielo resbalas hasta chocar con algo. Usa las paredes y las rocas para frenar.'] },
        { requires: ['mq17'], lines: ['La noche que cayó la grieta, el lago crujió entero. Pensé que se abría el mundo.'] },
      ] },
      { name: 'Niña del lago', sprite: 'p_girl', talks: [
        { lines: ['Mi madre bajó al lago y no ha vuelto. Dice la gente que el hielo se la tragó. Yo no me lo creo.'] },
        { requires: ['done:sq_hielonegro_madre'], lines: ['¡Mamá ha vuelto! Tiene los pies congelados y está de muy mal humor. ¡Es ella!'] },
      ] },
    ],
  },
  {
    id: 'cenizalta', name: 'Cenizalta', region: 'maldita', kind: 'pueblo', x: 176, y: -42, banner: 'hueso',
    desc: 'Una aldea de esqueletos campesinos en lo alto de las colinas de ceniza. No luchan: cultivan raíces y esperan.',
    shop: ['pan', 'carne_seca', 'racion', 'pocion', 'pocion_mayor', 'pocion_suprema', 'antidoto', 'elixir'], forge: [...F4.slice(0, 6), 'anillo_osario'],
    npcs: [
      { name: 'Campesino de hueso', sprite: 'm_skeleton', talks: [
        { lines: ['Humanos. No os comemos: no tenemos estómago. Ja. Es un chiste de esqueletos.', 'La Legión se llevó a los soldados de la capitana a las Cenizas Altas. Encadenados.'] },
        { requires: ['done:sq_seren'], lines: ['Los soldados han vuelto. Sin armas, sin cadenas. Ahora siembran con nosotros.'] },
      ] },
      { name: 'Anciana de hueso', sprite: 'm_skeleton', talks: [
        { lines: ['Los esqueletos no dormimos, pero soñamos. Llevo trescientos años soñando con un sol que no quema.'] },
      ] },
    ],
  },
];
for (const l of MORE) LOCATIONS[l.id] = l;

ROUTES.push(
  { id: 'r_molino', a: 'bastion_gris', b: 'molinogris', dungeon: 'campos_molino', requires: ['mq1'] },
  { id: 'r_vado', a: 'rocaverde', b: 'vado', dungeon: 'cenizas_vado', requires: ['mq4'] },
  { id: 'r_dunavieja', a: 'palmarroja', b: 'dunavieja', dungeon: 'ruinas_dunavieja', requires: ['mq10'] },
  { id: 'r_hielonegro', a: 'pico_escarcha', b: 'hielonegro', dungeon: 'lago_hielonegro', requires: ['mq14'] },
  { id: 'r_cenizalta', a: 'osario', b: 'cenizalta', dungeon: 'cenizas_altas', requires: ['mq19'] },
);
DUNGEON_SPOTS.push({ dungeon: 'babel_jefes', from: TOWER_ID, x: 46, y: 26 });

// Una mazmorra propia en cada pueblo que no tenía ninguna.
DUNGEON_SPOTS.push(
  { dungeon: 'sotano_molino', from: 'molinogris', x: 0, y: 36 },
  { dungeon: 'grieta_vado', from: 'vado', x: 96, y: 52, requires: ['mq4'] },
  { dungeon: 'criptas_lago', from: 'aguaclara', x: 112, y: 50, requires: ['mq8'] },
  { dungeon: 'nido_juncal', from: 'juncal', x: 126, y: 14 },
  { dungeon: 'templo_enterrado', from: 'dunavieja', x: 86, y: 104 },
  { dungeon: 'veta_profunda', from: 'cantera_seca', x: 162, y: 112 },
  { dungeon: 'cuevas_escarcha', from: 'pico_escarcha', x: 142, y: 66, requires: ['mq13'] },
  { dungeon: 'guarida_lobo', from: 'refugio_lobo', x: 200, y: 10 },
  { dungeon: 'fondo_hielonegro', from: 'hielonegro', x: 124, y: 30 },
  { dungeon: 'catacumbas_osario', from: 'osario', x: 186, y: -32, requires: ['mq19'] },
  { dungeon: 'campos_ceniza', from: 'cenizalta', x: 168, y: -50 },
  { dungeon: 'gran_naufragio', from: 'puerto_coral', x: 0, y: 86, requires: ['mq29'] },
  { dungeon: 'cuevas_brujas', from: 'isla_gaviota', x: -24, y: 100, requires: ['mq30'] },
);

// Las bombas se venden en todas las tiendas.
for (const l of Object.values(LOCATIONS)) if (l.shop && !l.shop.includes('bomba')) l.shop.push('bomba');
