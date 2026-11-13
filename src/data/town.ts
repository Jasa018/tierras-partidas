/**
 * Vida fuera de la mazmorra: noticias del tablón, proyectos de reconstrucción (donaciones) y
 * expediciones de la reserva.
 */

/** Noticia del tablón: sale mientras se cumplan `requires` y no se cumpla ninguno de `until`. `where`: solo en esa localidad. */
export interface NewsDef {
  title: string;
  text: string;
  requires?: string[];
  until?: string[];
  where?: string;
}

export const NEWS: NewsDef[] = [
  { title: 'Reclutas a la cueva', text: 'La Expedición pone a prueba a los nuevos en la Cueva Goteante, bajo los muros del sur. Muchos vuelven empapados. Algunos no vuelven.', until: ['mq1'] },
  { title: 'Rocaverde, sin noticias', text: 'Hace semanas que no llega ningún carro de Rocaverde. El Sendero Lodoso está tomado por las bestias.', requires: ['mq1'], until: ['mq2'] },
  { title: 'El santuario hundido', text: 'Los leñadores de Rocaverde juran que el santuario de la colina se hundió en una sola noche. Dentro quedaba la sanadora.', requires: ['mq2'], until: ['mq3'] },
  { title: 'Resplandor rojo al este', text: 'Los centinelas ven un brillo rojo sobre la grieta que arrasó Vado. Dicen que late como un corazón.', requires: ['mq3'], until: ['mq4'] },
  { title: '¡La Hondonada, sellada!', text: 'Un grupo de la Expedición ha sellado la Hondonada de la Frontera. Es la primera vez en diez años.', requires: ['mq4'], until: ['mq6'] },
  { title: 'El Paso del Cuervo', text: 'Más allá de Rocaverde, el desfiladero del Cuervo baja hasta un lago helado. Al otro lado, dicen, hay un pueblo que nadie visita.', requires: ['mq4'], until: ['mq5'] },
  { title: 'La niebla respira', text: 'En Villa Niebla cuentan que la ciénaga respira por las noches, y que una cazadora entra sola en ella.', requires: ['mq5'], until: ['mq6'] },
  { title: 'La niebla se levanta', text: 'Por primera vez en años se ve el sol sobre Villa Niebla. Los pescadores vuelven a salir al agua.', requires: ['mq6'] },
  { title: 'Desapariciones en el pantano', text: 'Cada semana falta alguien en los pilotes. Dicen que una secta humana, la Hermandad del Hueso, reza a los esqueletos en unas catacumbas del pantano.', where: 'villa_niebla', requires: ['mq5'], until: ['done:sq_sectarios'] },
  { title: 'Dos razas, dos señores', text: 'Los viejos cuentan que los humanos fueron hechos por los ángeles, y los esqueletos por los demonios. Que por eso unos rezan al Alba y otros sirven a la Ceniza.' },
  { title: 'Plumas y ceniza', text: 'Al norte de Villa Niebla llueven plumas blancas y ceniza caliente. Los ancianos hablan de ángeles y demonios, como en los cuentos de antes de la Fractura.', requires: ['mq6'], until: ['mq7'] },
  { title: 'Dos bandos en el cielo', text: 'Dicen que la Legión de la Ceniza y el Coro del Alba se pelean por las grietas. Si te cruzas con los dos, déjalos que se maten entre ellos.', requires: ['mq7'] },
  { title: 'Se busca leñador', text: 'Tomás entró al Bosque de Espinas y no ha vuelto. Su compañero ofrece una recompensa en el tablón de Rocaverde.', where: 'rocaverde', until: ['done:sq_lenador'] },
  { title: 'Lobos en el linde', text: 'Los lobos rondan la empalizada cada noche. El cazador viejo aconseja pelear en los pasillos.', where: 'rocaverde', until: ['done:sq_lobos'] },
  { title: 'Precio del pan', text: 'Con las rutas cerradas, el pan sube cada semana. El mercader de paso recomienda no bajar nunca sin comida.', where: 'bastion_gris' },
  { title: 'Un explorador perdido', text: 'Varo salió a cartografiar la ciénaga hace un mes. Su hija le espera en el embarcadero.', where: 'villa_niebla', until: ['done:sq_varo'] },
  { title: 'Vado puede renacer', text: 'Con la Hondonada sellada, algunos supervivientes hablan de volver a levantar Vado. Haría falta oro. Mucho.', requires: ['mq4'], where: 'rocaverde' },
  { title: 'Monstruos dorados', text: 'Cazadores de fortuna hablan de bestias doradas que huyen en las mazmorras. Quien las acorrala vuelve rico.' },
  { title: 'Tenderos subterráneos', text: 'Hay mercaderes tan locos como para montar su puesto ahí abajo. Pagadles: dicen que sus guardias salen de la nada.' },
  // ---------- Actos 2 (final) a 8
  { title: 'La capital del lago', text: 'Al otro lado del Lago de los Juncos está Aguaclara, la capital de las Rutas. Sus sacerdotes hablan con los ángeles.', requires: ['mq7'], until: ['mq8'] },
  { title: 'Guerra en el desierto', text: 'Las caravanas del Mar de Arena hablan de un ejército de esqueletos que avanza contra Solmarena.', requires: ['mq8'], until: ['mq12'] },
  { title: 'Pozos envenenados', text: 'En el oasis de Palmarroja la gente enferma al beber. Algo vive en el fondo de los pozos viejos.', requires: ['mq9'], until: ['mq10'], where: 'palmarroja' },
  { title: 'Un esqueleto que lee', text: 'En el archivo de Solmarena hay un esqueleto prisionero. No pide armas: pide libros.', requires: ['mq10'], until: ['mq11'] },
  { title: 'El asedio se rompe', text: 'La capitana Seren se ha retirado. Las caravanas vuelven a moverse por el desierto.', requires: ['mq12'], until: ['mq17'] },
  { title: 'Capitanes en la nieve', text: 'Desde Fuerte Albar avisan: dos capitanes demonios, Morgath e Ixa, guardan la gran grieta.', requires: ['mq13'], until: ['mq16'] },
  { title: 'Nadie baja sin prueba', text: 'Los veteranos de Albar dicen que a la Gran Grieta no se baja sin haberse puesto a prueba. Quien llega al nivel 20 hace la prueba de prestigio en el gremio y vuelve más fuerte.', requires: ['mq14'], until: ['mq17'], where: 'fuerte_albar' },
  { title: 'La grieta no se cierra', text: 'Nadie sabe qué pasó en el fondo de la Gran Grieta. Solo que el grupo de la Expedición no ha vuelto.', requires: ['mq17'], until: ['mq20'] },
  { title: 'Las ciudades caen', text: 'Fuerte Albar, Pico Escarcha, Solmarena... La Legión avanza por el camino de la Expedición, ciudad tras ciudad.', requires: ['mq20'], until: ['mq28'] },
  { title: 'Un barco negro', text: 'Los pescadores vieron un barco negro salir de la costa del Bastión rumbo a Puerto Coral.', requires: ['mq28'], until: ['mq29'] },
  { title: 'El fuerte de la isla negra', text: 'Desde el Faro del Fin se ve un fuerte que no estaba ahí hace un año. El mar hierve a su alrededor.', requires: ['mq30'], until: ['mq32'] },
  { title: 'Luz de juicio', text: 'Los fareros juran que una columna de luz bajó del cielo sobre la isla negra. Al irse, el fuerte estaba vacío.', requires: ['mq32'], until: ['mq36'] },
  { title: 'Plumas en la plaza', text: 'Los ángeles bajaron al Bastión Gris cantando. Cuando se fueron, apenas quedaba nadie vivo en la plaza.', requires: ['mq36'] },
  { title: 'Las cuatro torres', text: 'Alba Eterna está rodeada por las torres de la Espada, el Escudo, la Balanza y la Voz. Mientras sigan en pie, el trono está sellado.', requires: ['mq37'], until: ['mq42'], where: 'jardin_plumas' },
  { title: 'El mundo sigue', text: 'Las grietas se han cerrado. Nadie sabe muy bien qué pasó allá arriba. Los que lo saben no lo cuentan.', requires: ['final'] },
  { title: 'Ojo con los gólems', text: 'En algunas grietas hay gólems de piedra que vigilan. Si te ven, te devuelven al principio. Mira por dónde miran.' },
];

/** Mejora de un proyecto de reconstrucción. */
export interface ProjectLevel {
  cost: number;
  name: string;
  desc: string;
  /** Objetos nuevos en la tienda de la localidad del proyecto. */
  shop?: string[];
  /** Descuento (%) en la tienda y la herrería de esa localidad. */
  discount?: number;
  /** Descuento (%) en el oro de las mejoras de equipo, en cualquier herrería. */
  forge?: number;
  /** Oro extra (%) al volver de cada incursión. */
  goldBonus?: number;
  /** Lo que os regalan los vecinos al volver de cada incursión completada. */
  gift?: Record<string, number>;
}

export interface ProjectDef {
  id: string;
  name: string;
  /** Dónde se dona. */
  where: string;
  requires?: string[];
  desc: string;
  levels: ProjectLevel[];
}

export const PROJECTS: ProjectDef[] = [
  {
    id: 'bastion', name: 'Muralla del Bastión', where: 'bastion_gris', desc: 'Trescientos años de muralla. Con oro, se puede hacer algo más que resistir.',
    levels: [
      { cost: 250, name: 'Reparar las almenas', desc: 'Vuelve el comercio con las granjas: la tienda vende raciones de viaje.', shop: ['racion'] },
      { cost: 600, name: 'Mercado del patio', desc: 'Llegan mercaderes de paso: 10% de descuento en la tienda y la herrería del Bastión.', discount: 10 },
      { cost: 1400, name: 'Taller de la Expedición', desc: 'Los artesanos de la Expedición venden bombas y pociones mayores en el Bastión.', shop: ['bomba', 'pocion_mayor'] },
    ],
  },
  {
    id: 'rocaverde', name: 'Empalizada de Rocaverde', where: 'rocaverde', requires: ['mq2'], desc: 'Las garras han marcado cada tronco. Una empalizada nueva devolvería la calma.',
    levels: [
      { cost: 250, name: 'Empalizada nueva', desc: 'Los leñadores se sienten seguros: la tienda vende raciones y frascos de fuego.', shop: ['racion', 'frasco_fuego'] },
      { cost: 600, name: 'Aserradero', desc: 'Madera de sobra para todo: 10% de descuento en la tienda y la herrería de Rocaverde.', discount: 10 },
      { cost: 1200, name: 'Huerto de la anciana Merra', desc: 'Merra cultiva hierbas raras: la tienda vende elixires y semillas de vida.', shop: ['elixir', 'semilla_vida'] },
    ],
  },
  {
    id: 'vado', name: 'Vado, la aldea de Aren y Bram', where: 'rocaverde', requires: ['mq4'], desc: 'Lo que quedó de vuestra aldea, al este de Rocaverde. Con oro y tiempo, puede volver a levantarse.',
    levels: [
      { cost: 400, name: 'Limpiar las cenizas', desc: 'Los primeros vecinos vuelven a Vado y os guardan comida: 2 panes al volver de cada incursión completada.', gift: { pan: 2 } },
      { cost: 900, name: 'La forja del padre de Bram', desc: 'Bram vuelve a encender la forja de su padre: mejorar equipo cuesta un 20% menos de oro en cualquier herrería.', forge: 20 },
      { cost: 1800, name: 'Vado renace', desc: 'La aldea vuelve a tener niños, humo en las chimeneas y una fiesta. Toda la Frontera se entera: +15% de oro al volver de cada incursión.', goldBonus: 15 },
    ],
  },
  {
    id: 'niebla', name: 'Pilotes de Villa Niebla', where: 'villa_niebla', requires: ['mq5'], desc: 'Un pueblo sobre pilotes podridos. Si se hunde uno más, se hunde el pueblo.',
    levels: [
      { cost: 400, name: 'Pilotes nuevos', desc: 'El embarcadero vuelve a aguantar: la tienda vende bombas.', shop: ['bomba'] },
      { cost: 900, name: 'Faros del pantano', desc: 'Las barcas vuelven con pescado y mercancía: 10% de descuento en la tienda y la herrería de Villa Niebla.', discount: 10 },
      { cost: 1600, name: 'Casa del alquimista', desc: 'Un alquimista se instala en el pueblo: la tienda vende mapas del vidente y orbes de retorno.', shop: ['mapa_vidente', 'orbe_retorno'] },
    ],
  },
];

/** Expediciones de la reserva: cuántas incursiones tardan en volver según la dificultad de la mazmorra. */
export const expeditionLength = (difficulty: number) => (difficulty >= 3 ? 2 : 1);
/** Máximo de miembros por expedición. */
export const EXPEDITION_MAX = 3;
