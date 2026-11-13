export interface Line {
  who: string;
  text: string;
  /** Sustituyen al nombre y retrato de SPEAKERS (para los habitantes de cada pueblo). */
  name?: string;
  sprite?: string;
}

/** Quién habla: nombre visible y sprite del retrato. */
export const SPEAKERS: Record<string, { name: string; sprite: string }> = {
  narrador: { name: '', sprite: '' },
  aren: { name: 'Aren', sprite: 'p_aren_errante' },
  bram: { name: 'Bram', sprite: 'p_bram' },
  lysa: { name: 'Lysa', sprite: 'p_lysa' },
  garrick: { name: 'Garrick', sprite: 'p_garrick' },
  kaela: { name: 'Kaela', sprite: 'p_kaela' },
  odric: { name: 'Odric', sprite: 'p_odric' },
  pip: { name: 'Pip', sprite: 'p_pip' },
  seren: { name: 'Seren', sprite: 'p_seren' },
  vael: { name: 'Vael', sprite: 'p_vael' },
  hale: { name: 'Comandante Hale', sprite: 'p_hale' },
  anciana: { name: 'Anciana Merra', sprite: 'p_elder' },
  posadero: { name: 'Posadero', sprite: 'p_npc' },
  serafiel: { name: 'Serafiel, del Coro del Alba', sprite: 'm_angel' },
  ceniza: { name: 'Voz de la ceniza', sprite: 'm_demon' },
  garrick_d: { name: 'Garrick', sprite: 'b_garrick' },
  asim: { name: 'General Asim', sprite: 'p_guard' },
  ilse: { name: 'Comandante Ilse', sprite: 'p_guard' },
  tomasa: { name: 'Abuela Tomasa', sprite: 'p_elder' },
  morgath: { name: 'Morgath', sprite: 'b_morgath' },
  ixa: { name: 'Ixa', sprite: 'b_ixa' },
  asmodar: { name: 'Asmodar, Rey Demonio', sprite: 'b_demon_king' },
  velaris: { name: 'Velaris', sprite: 'b_angel_espada' },
  oriel: { name: 'Oriel', sprite: 'b_angel_escudo' },
  tharion: { name: 'Tharion', sprite: 'b_angel_balanza' },
  serafiel_c: { name: 'Serafiel', sprite: 'b_angel_voz' },
  dios: { name: 'Dios', sprite: 'b_god' },
  voz: { name: '???', sprite: '' },
  kra: { name: 'Desertora Kra', sprite: 'm_imp' },
};

export const SCENES: Record<string, Line[]> = {
  sectarios_fin: [
    { who: 'narrador', text: 'El Sumo Sacerdote cae sobre el altar de huesos. Detrás, en jaulas, hay gente de Villa Niebla, viva.' },
    { who: 'kaela', text: 'Humanos rezando a los esqueletos y entregándoles a su propia gente. ¿Qué les prometen a cambio?' },
    { who: 'aren', text: 'Lo que sea, no vale esto.' },
    { who: 'garrick', text: 'Les prometen no morir cuando llegue la Legión. Eso es todo. El miedo compra cualquier cosa.' },
    { who: 'narrador', text: 'Mientras liberáis a los presos, Garrick se guarda un amuleto de ceniza del altar. Nadie le ve hacerlo.' },
  ],
  mq7_inicio: [
    { who: 'narrador', text: 'Desde que la niebla se levantó, al norte de Villa Niebla caen del cielo plumas blancas... y ceniza.' },
    { who: 'kaela', text: 'Los pescadores sacan las dos cosas en las redes. Plumas que queman y ceniza que brilla. Algo pelea ahí arriba.' },
    { who: 'garrick', text: 'En mis tiempos, la Expedición tenía una palabra para eso: problemas.' },
    { who: 'aren', text: 'Lo noto en el pecho. Hay una grieta nueva... y no la ha abierto la tierra.' },
    { who: 'lysa', text: 'Si son lo que temo, que la luz nos guarde. Aunque no sé si la luz está de nuestro lado.' },
  ],
  mq7_fin: [
    { who: 'narrador', text: 'Varkhul, heraldo de la ceniza, cae de rodillas en el fondo del cráter. Una luz blanca baja del cielo.' },
    { who: 'serafiel', text: 'Bien hecho, humanos. El Coro os vigila y os protege. Seguid luchando contra la Ceniza: nosotros nos ocupamos de esta grieta.' },
    { who: 'ceniza', text: 'El Coro miente. Pregúntale qué hizo con los primeros que tocaron la Fractura, chico. Pregúntale por qué brillas.' },
    { who: 'serafiel', text: 'No escuchéis a la Ceniza. Tú llevas una marca, Aren: la de alguien elegido. Seguid hacia la gran grieta.' },
    { who: 'lysa', text: 'Un ángel... de verdad. ¿Por qué me duele tanto la espalda al verlo?' },
    { who: 'garrick', text: 'Los ángeles nunca bajan por nada. Andaos con cuidado. Todos.' },
    { who: 'narrador', text: 'El Coro del Alba parece estar de vuestro lado. Por ahora.' },
    { who: 'aren', text: 'La gran grieta... Si es la que abre las demás, hay que encontrarla. En Aguaclara, la capital del lago, sabrán dónde está.' },
  ],
  intro: [
    { who: 'narrador', text: 'Hace trescientos años, la tierra se partió. Lo llamaron la Fractura.' },
    { who: 'narrador', text: 'De las grietas, las Hondonadas, salieron monstruos, esqueletos y demonios. Los humanos perdieron el continente.' },
    { who: 'narrador', text: 'Hoy sobreviven tras murallas, en ciudades que ya no se hablan entre sí.' },
    { who: 'narrador', text: 'Hace siete noches, una Hondonada se abrió bajo Vado, una aldea de la Frontera. Por la mañana no quedaba nada.' },
    { who: 'narrador', text: 'Solo dos llegaron con vida a las puertas del Bastión Gris.' },
    { who: 'bram', text: 'Aren... lo hemos conseguido. Esas son las murallas del Bastión.' },
    { who: 'aren', text: 'La grieta seguía moviéndose, Bram. La sentí cambiar bajo nuestros pies. Como si respirara.' },
    { who: 'bram', text: 'Pues que respire sin nosotros. Venimos a unirnos a la Expedición, ¿recuerdas? Para que esto no le pase a nadie más.' },
    { who: 'hale', text: '¿Dos críos de la Frontera quieren entrar en la Expedición? He enterrado a muchos que pensaban lo mismo.' },
    { who: 'hale', text: 'Bajo la ciudad se abrió una cueva hace un mes. Llegad al fondo y volved. Si volvéis, hablaremos.' },
  ],
  mq1_fin: [
    { who: 'hale', text: 'Volvisteis. Y con el equipo entero. Eso ya es más de lo que hacen la mitad de mis reclutas.' },
    { who: 'hale', text: 'Tomad esta insignia. Desde hoy sois de la Expedición. No la perdáis: es lo único que os abre las puertas de otras ciudades.' },
    { who: 'hale', text: 'Hace semanas que no sabemos nada de Rocaverde. El Sendero Lodoso es el único camino. Id y averiguad qué pasa.' },
    { who: 'hale', text: 'Y antes de iros: el gremio tiene un campo de entrenamiento. Pasad por él. No quiero enterrar a nadie por no saber romper una pared.' },
    { who: 'bram', text: '¡Nuestra primera misión de verdad!' },
  ],
  mq2_fin: [
    { who: 'anciana', text: '¿La Expedición? ¿Aquí? Creí que nos habían olvidado.' },
    { who: 'anciana', text: 'Los lobos nos tienen cercados, y el santuario de la colina se hundió en la tierra. La sanadora Lysa seguía dentro.' },
    { who: 'posadero', text: 'Y tú, Garrick, ¿piensas pagarme algún día lo que me debes o vas a seguir bebiendo gratis?' },
    { who: 'garrick', text: 'Calma, calma. Estos chicos llevan insignia. Si los guío hasta el santuario y salen vivos, la Expedición pagará mi deuda. ¿Verdad, chicos?' },
    { who: 'bram', text: '¿Quién es este tipo?' },
    { who: 'garrick', text: 'Alguien que llevó esa misma insignia hace diez años. Y que sabe cómo no morir ahí abajo. Contad conmigo.' },
  ],
  mq3_fin: [
    { who: 'narrador', text: 'En el fondo de las ruinas, entre capullos de seda, algo se mueve.' },
    { who: 'lysa', text: '...¿Hay alguien? ¿Sois reales?' },
    { who: 'aren', text: 'Somos de la Expedición. Te vamos a sacar de aquí.' },
    { who: 'lysa', text: 'Llevo días rezando a un santuario que ya no existe. Supongo que alguien me escuchó.' },
    { who: 'lysa', text: 'Dejadme ir con vosotros. Si las Hondonadas se tragan los santuarios, mi lugar ya no está en un altar.' },
    { who: 'garrick', text: 'Las arañas no te han tocado. Ni una picadura en días. ¿Cómo lo haces?' },
    { who: 'lysa', text: '...No lo sé. Nunca me han tocado. Ni ellas ni nada de lo que sale de las grietas.' },
    { who: 'garrick', text: 'Una sanadora. Por fin alguien sensato en este grupo.' },
  ],
  mq4_fin: [
    { who: 'narrador', text: 'El Guardián Hueco se desmorona. En el fondo de la Hondonada, un núcleo de piedra roja late como un corazón.' },
    { who: 'aren', text: 'Lo siento... me está llamando.' },
    { who: 'narrador', text: 'Aren toca el núcleo. La grieta entera se estremece y, por un instante, el fuego del núcleo corre por sus venas.' },
    { who: 'lysa', text: '¡Aren! Tus manos... están ardiendo, pero no te quemas.' },
    { who: 'garrick', text: 'He visto sellar Hondonadas antes. Nunca he visto que una reaccione así a una persona.' },
    { who: 'narrador', text: 'El núcleo se apaga. La Hondonada de la Frontera queda sellada.' },
    { who: 'narrador', text: 'Aren ha despertado la clase BRASA. Puedes elegirla en la preparación antes de cada mazmorra.' },
    { who: 'hale', text: '(Al volver) Habéis hecho lo que la Expedición no logró en una década. El este lleva años en silencio. Cruzad el Paso del Cuervo.' },
  ],
  mq5_fin: [
    { who: 'narrador', text: 'ACTO 2 · LAS RUTAS PERDIDAS' },
    { who: 'narrador', text: 'Villa Niebla lleva años aislada. Sus habitantes miran la insignia de la Expedición como si fuera un fantasma.' },
    { who: 'kaela', text: 'Vaya. La Expedición existe de verdad. Llegáis tarde: el encargo de la Ciénaga es mío.' },
    { who: 'bram', text: 'Nadie entra solo ahí. ¿Estás loca?' },
    { who: 'kaela', text: 'Estoy sola, que es distinto. Si llegáis al fondo antes que yo, la recompensa es vuestra. Si no, no me estorbéis.' },
  ],
  mq6_fin: [
    { who: 'narrador', text: 'La Bestia de la Niebla cae. La niebla, por primera vez en años, empieza a levantarse.' },
    { who: 'kaela', text: 'La tenía... la tenía a tiro. Y vosotros llegasteis primero.' },
    { who: 'aren', text: 'Sin tus flechas desde el otro lado, no lo habríamos conseguido.' },
    { who: 'kaela', text: '...Está bien. Iré con vosotros. Pero me quedo con una parte de cada recompensa.' },
    { who: 'narrador', text: 'El viento que barre la niebla atraviesa a Aren y despierta en él otra afinidad: VENDAVAL.' },
    { who: 'narrador', text: 'Pero cuando la niebla se levanta, al norte del pueblo se ve algo que nadie esperaba: luces en el cielo... y humo.' },
  ],
};

// Las charlas de fogata (afinidad entre compañeros) están en data/affinity.ts.

/** Comentarios dentro de la mazmorra según quién va en el grupo. */
export const BANTER: { members: string[]; lines: Line[] }[] = [
  { members: ['bram'], lines: [{ who: 'bram', text: '¡Que vengan! Mi martillo tiene hambre.' }] },
  { members: ['bram', 'garrick'], lines: [{ who: 'garrick', text: 'Bram, si vuelves a cargar sin mirar, te dejo atrás.' }, { who: 'bram', text: 'Eso dijiste la última vez.' }] },
  { members: ['lysa'], lines: [{ who: 'lysa', text: 'No os alejéis de mí. Mis curas no llegan lejos.' }] },
  { members: ['garrick'], lines: [{ who: 'garrick', text: 'Huele a algo viejo aquí abajo. Mantened los ojos abiertos.' }] },
  { members: ['lysa', 'bram'], lines: [{ who: 'bram', text: 'Lysa, ¿puedes curar el hambre?' }, { who: 'lysa', text: 'No. Pero puedo curar tu estupidez. A veces.' }] },
  { members: ['kaela', 'garrick'], lines: [{ who: 'kaela', text: 'Viejo, haces más ruido que un trasgo con armadura.' }, { who: 'garrick', text: 'Y tú disparas a todo lo que se mueve. Incluido yo.' }] },
  { members: ['kaela'], lines: [{ who: 'kaela', text: 'Dejadme espacio. Yo me encargo desde lejos.' }] },
  { members: [], lines: [{ who: 'aren', text: 'La mazmorra se está moviendo... Lo siento en el pecho.' }] },
];

/** Charlas cortas al volver de una incursión: lo que dice cada miembro ({d} = la mazmorra). */
export const RETURN_TALK: Record<string, { clear: string[]; escape: string[] }> = {
  aren: {
    clear: ['{d} ya no se mueve como antes. Lo noto.', 'Volvemos todos. Eso es lo que cuenta.', 'Cada grieta que cruzamos me dice algo más. Todavía no entiendo qué.'],
    escape: ['Salimos a tiempo. La próxima vez llegaremos al fondo.', 'No pasa nada por retirarse. Pasa por no volver.'],
  },
  bram: {
    clear: ['¡Ja! ¿Habéis visto ese último golpe? Que alguien lo apunte.', 'Tengo tanta hambre que me comería un limo. Bueno, casi.', 'Cuando volvamos a Vado, pienso forjar un martillo con lo que hemos sacado de {d}.'],
    escape: ['¡Yo podía seguir! ...Vale, quizá no.', 'La próxima vez traemos más comida. Y más martillo.'],
  },
  lysa: {
    clear: ['Dejadme ver esas heridas antes de ir a la posada. Todas.', 'He rezado por los que no salieron de {d}. Ahora descansan un poco mejor.'],
    escape: ['Lo importante es que estamos vivos. Lo demás se cura.', 'No os culpéis. Retirarse también es valiente.'],
  },
  garrick: {
    clear: ['No ha estado mal. Para ser novatos.', 'En mis tiempos, {d} nos habría costado el doble. Y la mitad de la escuadra.', 'Una cerveza. Solo pido una cerveza.'],
    escape: ['Un buen soldado sabe cuándo irse. Hoy lo hemos sabido.', 'Mejor huir que acabar como los de mi escuadra.'],
  },
  kaela: {
    clear: ['He contado mis presas. Ganaba yo, por si alguien preguntaba.', 'No ha sido una mala cacería. Repetiría.'],
    escape: ['Una presa que se escapa vuelve más gorda. Volveremos.', 'Tsk. La próxima vez no fallo.'],
  },
  odric: {
    clear: ['Fascinante. La distribución de las salas de {d} confirma mi teoría. Os la explico en la cena.', 'He tomado veintitrés notas. No, no podéis leerlas.'],
    escape: ['Retirada táctica. Lo anoto como datos valiosos.', 'Hemos aprendido mucho. Sobre todo a correr.'],
  },
  pip: {
    clear: ['Me he quedado con una moneda de más. Es broma. ¿O no?', '¿Ya está? Pensaba que iba a ser más difícil.'],
    escape: ['¡Corred, corred! ...Ah, que ya estamos fuera.', 'Yo no he tenido miedo. Era estrategia.'],
  },
  seren: {
    clear: ['Buena formación, todos. Así se defiende una ciudad.', 'Informaré a la guardia de lo que hay en {d}.'],
    escape: ['Retirada ordenada. Nadie se ha quedado atrás.', 'Volveremos mejor preparados. Es una orden.'],
  },
  vael: {
    clear: ['{d} os recordará. Las Hondonadas no olvidan.', 'Interesante. Más de lo que esperaba.'],
    escape: ['A veces la sombra aconseja esperar.', 'No era el momento. Lo será.'],
  },
};

/** Lo que dice cada uno al superar su prueba de prestigio. */
export const PRESTIGE_LINES: Record<string, string> = {
  aren: 'Mi eco sabía lo mismo que yo. Pero yo tengo algo que él no: a todos vosotros.',
  bram: '¡Le he ganado a... mí mismo! Eso cuenta doble, ¿no?',
  lysa: 'Vi todas mis dudas mirándome. Las he perdonado. Ahora puedo curar más hondo.',
  garrick: 'Ese eco tenía mi cara de hace diez años. Le he dado la paliza que me merecía entonces.',
  kaela: 'Por fin una presa a mi altura. Y ni siquiera ha durado tanto.',
  odric: 'Fascinante: el eco cometía mis mismos errores. Ya los he corregido. Lo anoto.',
  pip: '¿Sabéis lo raro que es robarte a ti mismo? Muy raro. Pero lo he hecho.',
  seren: 'Una capitana que no se vence a sí misma no puede mandar a nadie. Ahora sí.',
  vael: 'Ya conocía a esa sombra. Hoy por fin la he mirado a los ojos.',
};

// ---------------------------------------------------------------- Actos 2 (final) a 8

const N = (text: string): Line => ({ who: 'narrador', text });

Object.assign(SCENES, {
  // ---------- Acto 2: Aguaclara ----------
  mq8_fin: [
    N('Aguaclara se levanta sobre el lago: torres blancas, puentes de piedra y campanas que suenan solas cuando pasa el viento.'),
    { who: 'kaela', text: 'Mirad las estatuas. Todo ángeles. Aquí rezan más que respiran.' },
    { who: 'lysa', text: 'Es bonito... y a la vez me da frío. No sé por qué.' },
    { who: 'garrick', text: 'Los sacerdotes dicen que la gran grieta está en las Cumbres Blancas. Para llegar hay que cruzar el desierto entero.' },
    { who: 'aren', text: 'Entonces cruzaremos el desierto. Si esa grieta abre todas las demás, cerrarla es cerrarlas todas.' },
    { who: 'bram', text: 'Arena. Genial. Con lo bien que se me da no sudar.' },
    N('Fin del ACTO 2.'),
  ],
  // ---------- Acto 3: el Mar de Arena ----------
  acto3: [
    N('ACTO 3 · EL MAR DE ARENA'),
    N('Al sur del lago, la hierba se acaba de golpe. Después, solo arena, sol y huesos blanqueados.'),
    N('En el desierto hay guerra: el ejército de los esqueletos lleva un año avanzando contra las ciudades humanas.'),
    { who: 'garrick', text: 'Lo que veáis en las dunas, no lo toquéis. Las caravanas desaparecen por mucho menos.' },
  ],
  mq9_fin: [
    N('Palmarroja: un círculo de palmeras rojas alrededor de un oasis. Pero nadie bebe. La gente está tumbada a la sombra, enferma.'),
    { who: 'lysa', text: 'Es veneno. Viene del agua... de muy hondo.' },
    { who: 'aren', text: 'Alguien lo ha echado a propósito. Bajaremos a los pozos.' },
  ],
  mq10_fin: [
    N('La Reina de las Arenas cae en el fondo del pozo. Junto a su nido hay tinajas rotas con un sello: una garra de ceniza.'),
    { who: 'kaela', text: 'Ese sello... es el de la Legión. Los demonios.' },
    { who: 'garrick', text: 'Los esqueletos atacan el desierto, pero el veneno lo traen los demonios. Interesante.' },
    { who: 'bram', text: 'Si los demonios mandan a los esqueletos, ¿quién manda a los demonios?' },
    N('Nadie responde. El agua del oasis empieza a aclararse.'),
  ],
  mq11_fin: [
    N('Solmarena, la ciudad dorada. Sus murallas resisten, pero tienen marcas de mil flechas.'),
    { who: 'asim', text: 'La Expedición. Pensaba que ya no existía. Llegáis en buen momento: no nos queda casi nada.' },
    N('En el archivo de la ciudad, encerrado entre libros, hay un esqueleto de huesos azules. Lee. Y toma notas.'),
    { who: 'odric', text: 'Ah. Visitas. Humanos, uno de ellos... muy interesante. Perdonad, me llamo Odric.' },
    { who: 'odric', text: 'Me rendí hace un mes. No entiendo por qué mi pueblo lucha esta guerra, y los libros humanos tampoco lo explican.' },
    { who: 'aren', text: 'Ven con nosotros. Quizá lo descubramos juntos.' },
    { who: 'odric', text: '¿Un esqueleto en un gremio humano? Es la idea más absurda que he oído... Acepto. Lo anotaré todo.' },
    { who: 'garrick', text: 'Genial. Ahora también llevamos al enemigo en casa. (Se ríe solo.)' },
  ],
  mq12_fin: [
    N('Seren, la capitana de los esqueletos, hinca la rodilla en lo alto de su fortín.'),
    { who: 'seren', text: 'Sabéis luchar. No esperaba eso de los humanos.' },
    { who: 'odric', text: 'Seren. ¿Por qué? Nuestro pueblo no quería esta guerra.' },
    { who: 'seren', text: 'Odric. El ratón del archivo. Nadie quiere esta guerra. La Legión la ordena, y la Legión tiene a nuestras familias en Osario.' },
    { who: 'seren', text: 'Hoy me retiro. Pero no confundáis una retirada con una derrota.' },
    N('Seren desaparece entre la arena. El asedio de Solmarena se rompe.'),
    N('La tierra tiembla bajo los pies de Aren, y él la entiende. Ha despertado otra afinidad: ROCA.'),
    { who: 'asim', text: 'Las Cumbres Blancas están al norte, pasando el Paso Helado. Si buscáis la gran grieta, allí la encontraréis.' },
    N('Fin del ACTO 3.'),
  ],
  // ---------- Acto 4: las Cumbres Blancas ----------
  acto4: [
    N('ACTO 4 · LAS CUMBRES BLANCAS'),
    N('Al norte del desierto, el calor se acaba en una sola noche. Empieza la nieve, y no se acaba nunca.'),
    { who: 'garrick', text: 'Ahí arriba está la gran grieta. Lo noto en los huesos. (Mira de reojo el amuleto de ceniza que lleva colgado.)' },
  ],
  mq13_fin: [
    N('Pico Escarcha cuelga de la montaña. Las casas están atadas con cadenas para que el viento no se las lleve.'),
    { who: 'bram', text: 'Hace tanto frío que se me han congelado las ideas. Bueno, la idea.' },
    { who: 'odric', text: 'La gran grieta está más arriba, tras Fuerte Albar. La temperatura baja un grado cada cien pasos. Lo he medido.' },
  ],
  mq14_fin: [
    N('Fuerte Albar: una fortaleza de piedra blanca medio enterrada en la nieve.'),
    { who: 'ilse', text: 'Dos capitanes demonios guardan la grieta: Morgath en su bastión de hielo negro, e Ixa en la cumbre del glaciar.' },
    { who: 'ilse', text: 'Llevamos diez años sin poder acercarnos. Si vosotros podéis, os abriré el paso.' },
    { who: 'garrick', text: 'Dos capitanes. Y luego la grieta. Bien. Cuanto antes, mejor.' },
  ],
  mq15_fin: [
    N('Morgath, el capitán de la Escarcha, cae sobre el hielo negro. Se ríe mientras se deshace en ceniza.'),
    { who: 'morgath', text: 'Matadme. Da igual. Hay alguien que lleva siglos esperando a que alguien como tú llegue al fondo, chico.' },
    { who: 'aren', text: '¿Quién?' },
    { who: 'morgath', text: 'Pregúntale a tu amigo el de la armadura gris. Él huele como nosotros.' },
    { who: 'garrick', text: 'Los demonios mienten al morir. Es lo único que saben hacer.' },
  ],
  mq16_fin: [
    N('Ixa, la capitana del Glaciar, se arrastra hasta el borde de la cumbre.'),
    { who: 'ixa', text: 'Somos perros con correa, humanos. Pero la correa no la sujeta el Rey Demonio. Mirad hacia arriba.' },
    { who: 'lysa', text: '¿Hacia arriba? ¿Al cielo?' },
    N('Ixa no responde. El viento se la lleva.'),
    { who: 'ilse', text: 'Los dos capitanes, caídos. La Gran Grieta está abierta para vosotros.' },
  ],
  mq17_fin: [
    N('En el fondo de la Gran Grieta hay un lago helado. Bajo el hielo, una luz que no es de este mundo.'),
    { who: 'aren', text: 'Voy a cerrarla. Como la Hondonada.' },
    N('Aren toca el núcleo. La luz le atraviesa... y no pasa nada. La grieta no se cierra. Ni siquiera tiembla.'),
    { who: 'odric', text: 'No es una herida. Es... una puerta. Las Hondonadas no eran grietas en la tierra: son grietas en todo.' },
    { who: 'garrick', text: 'Lo sabía. Lo sabía desde que te vi en el Bastión, chico. Tú eras la llave.' },
    N('Garrick arranca un pedazo del núcleo con las manos desnudas. Brilla entre sus dedos.'),
    { who: 'bram', text: '¿Garrick? ¿Qué haces?' },
    { who: 'garrick', text: 'Mi trabajo. Lo siento, de verdad. Me pagan mucho mejor que la Expedición.' },
    N('Garrick golpea el hielo con su escudo. El lago se abre bajo vuestros pies. Caéis al agua helada.'),
    N('En el fondo, ahogándose, Aren siente el agua entrar en él... y responderle. Ha despertado otra afinidad: MAREA.'),
    N('La corriente os arrastra por debajo de la montaña, muy lejos. Luego, oscuridad.'),
    N('Garrick ya no forma parte del gremio. Se ha ido con su equipo puesto.'),
    N('Fin del ACTO 4.'),
  ],
  /** Si Garrick era la pareja de Aren. */
  garrick_pareja: [
    { who: 'aren', text: 'Garrick... ¿todo era mentira? ¿Lo de la fogata también?' },
    N('Antes de desaparecer, Garrick se queda mirando a Aren un segundo de más.'),
    { who: 'garrick', text: 'No todo, chico. Por eso me duele.' },
    N('Ya no tienes pareja.'),
  ],
  // ---------- Acto 5: la Tierra Maldita ----------
  acto5: [
    N('ACTO 5 · LA TIERRA MALDITA'),
    N('Aren despierta en una cueva bajo las raíces de un árbol muerto. Huele a humo. Hay un niño mirándole muy de cerca.'),
    { who: 'pip', text: '¡Está vivo! ¡Abuela, el de la bufanda está vivo! Os saqué del río uno a uno. Pesáis un montón.' },
    { who: 'tomasa', text: 'Estáis en la Madriguera, en plena tierra de los esqueletos. Pip os encontró en el río subterráneo.' },
    { who: 'pip', text: 'Me llamo Pip. Y necesito ayuda: los cazadores de la Legión se han llevado a mis amigos al Yermo de Ceniza.' },
    { who: 'aren', text: 'Nos has salvado la vida. Vamos a por ellos.' },
  ],
  mq18_fin: [
    N('El Cazador de la Legión cae. En las jaulas del Yermo hay tres niños más, flacos pero vivos.'),
    { who: 'pip', text: '¡Lo sabía! ¡Sabía que erais buenos! Bueno, al principio pensé en robaros las botas.' },
    { who: 'pip', text: 'Me voy con vosotros. Conozco todos los atajos de esta tierra. Y sé abrir cualquier cerradura.' },
    { who: 'lysa', text: 'Eres un niño, Pip.' },
    { who: 'pip', text: 'Soy un niño que os ha sacado de un río. Eso cuenta.' },
  ],
  mq19_fin: [
    N('Osario: torres de hueso, calles de ceniza y un silencio enorme. Los esqueletos os miran pasar... y no atacan.'),
    { who: 'odric', text: 'Mi ciudad. Nunca pensé que la vería así. No hay soldados. No hay capitanes.' },
    N('Un escriba de hueso os cuenta lo que pasó: la Legión vino, se llevó a todos los soldados y dejó la ciudad a su suerte.'),
    N('Los guiaba un demonio con cara de humano y armadura gris. Los esqueletos le abrieron las puertas: era un aliado de Seren.'),
    { who: 'bram', text: 'Garrick. También os traicionó a vosotros.' },
    { who: 'odric', text: 'Entonces Seren... Seren estará buscándole. Igual que nosotros.' },
  ],
  mq20_fin: [
    N('La Escalera de Huesos termina en las Cumbres Blancas. Al salir, veis Fuerte Albar... y humo negro sobre sus murallas.'),
    N('Un centinela herido se arrastra hacia vosotros por la nieve.'),
    { who: 'narrador', text: '«La Legión... subió por la escalera. Tenían un mapa: todas las ciudades por las que pasasteis. Han caído todas. Una tras otra.»' },
    { who: 'aren', text: 'Garrick les dio el camino. Nuestro camino.' },
    { who: 'kaela', text: 'Pues lo recorremos al revés. Ciudad por ciudad, hasta el Bastión.' },
    N('Las ciudades tomadas son mazmorras: no hay tienda, posada ni tablón hasta liberarlas. Hay que hacerlo en orden, de vuelta a casa.'),
  ],
  mq21_fin: [
    N('El Capitán Hrok cae en el patio de Fuerte Albar. Los supervivientes salen de los sótanos.'),
    { who: 'ilse', text: 'Pensé que no volvería a ver la luz del día. Id. Pico Escarcha está justo debajo, y también ha caído.' },
  ],
  mq22_fin: [
    N('Las cadenas de Pico Escarcha vuelven a sonar con el viento. Es el mejor sonido del mundo.'),
    { who: 'pip', text: 'Les he devuelto a los mineros todo lo que los demonios les robaron. Bueno, casi todo.' },
  ],
  mq23_fin: [
    N('En la muralla norte de Solmarena, entre cadáveres de demonios, alguien sigue en pie: una esqueleto de huesos color tierra.'),
    { who: 'seren', text: 'Vosotros. Otra vez.' },
    { who: 'asim', text: 'Lleva tres días defendiendo la muralla sola. Nos ha salvado a todos.' },
    { who: 'seren', text: 'Garrick me prometió liberar Osario si le dejaba entrar. Le dejé entrar. Se llevó a mi ejército a la Legión.' },
    { who: 'seren', text: 'Ya no tengo ejército. Pero tengo un escudo y una deuda. Si vais a por él, voy con vosotros.' },
    { who: 'odric', text: 'Seren en el gremio. La biblioteca de Osario no se lo creería.' },
    N('Seren ocupa el hueco de Garrick: sus mismas armas y técnicas. Pero vuestra afinidad con ella empieza de cero.'),
  ],
  mq24_fin: [
    N('El agua del oasis vuelve a correr. Alguien planta una palmera nueva junto a las quemadas.'),
  ],
  mq25_fin: [
    N('Aguaclara está libre. Los puentes, rotos; las estatuas de ángeles, intactas.'),
    { who: 'lysa', text: 'Las estatuas no tienen ni un rasguño. La ciudad ardía y nadie bajó del cielo.' },
    { who: 'seren', text: 'Vuestros ángeles miran desde arriba y no hacen nada. Los nuestros, al menos, daban la cara.' },
  ],
  mq26_fin: [
    N('La niebla roja se disipa sobre Villa Niebla. La barquera Nela os espera en el embarcadero.'),
    { who: 'kaela', text: 'Mi pantano. Nadie quema mi pantano.' },
  ],
  mq27_fin: [
    N('Rocaverde vuelve a ser Rocaverde. La anciana Merra os abraza a todos, incluido a Odric. Y a Seren.'),
    { who: 'seren', text: '...Nunca me había abrazado un humano.' },
  ],
  mq28_fin: [
    N('El General Kordath cae en la plaza del Bastión Gris. Las campanas vuelven a sonar.'),
    { who: 'hale', text: '(Herido, apoyado en la muralla) Aren. Bram. Sabía que volveríais. No sabía que traeríais a medio mundo con vosotros.' },
    { who: 'hale', text: 'Garrick pasó por aquí antes que la Legión. Robó un barco en la costa y puso rumbo a Puerto Coral.' },
    N('Con las campanas, una luz cálida nace en el pecho de Aren. Ha despertado otra afinidad: LUMEN.'),
    N('Fin del ACTO 5.'),
  ],
  // ---------- Acto 6: el Archipiélago Coral ----------
  acto6: [
    N('ACTO 6 · EL ARCHIPIÉLAGO CORAL'),
    N('Al oeste del Bastión, la tierra se rompe en acantilados y el mar se llena de islas.'),
    { who: 'seren', text: 'El rastro de Garrick sigue hacia el mar. Esta vez no se nos escapa.' },
  ],
  mq29_fin: [
    N('Puerto Coral: casas de colores, muelles de coral rojo y más contrabandistas que peces.'),
    { who: 'kaela', text: 'Un barco negro con un hombre de armadura gris. Todo el puerto lo vio. Zarpó hacia Isla Gaviota.' },
  ],
  mq30_fin: [
    N('Isla Gaviota: acantilados blancos y miles de gaviotas. Una bruja os cuenta que el capitán del barco negro no comía ni dormía.'),
    { who: 'lysa', text: '...ni su sombra se movía con él. Garrick nunca fue humano, ¿verdad?' },
  ],
  mq31_fin: [
    N('Desde lo alto del Faro del Fin se ve una isla de roca negra con un fuerte. El mar hierve a su alrededor.'),
    { who: 'aren', text: 'Está ahí. Lo noto.' },
    { who: 'bram', text: 'Bien. Tengo muchas cosas que decirle. Casi todas con el martillo.' },
  ],
  mq32_fin: [
    N('En el salón del Bastión Negro, Garrick ya no lleva su piel de humano: cuernos, ojos rojos y la misma voz cansada de siempre.'),
    N('Junto a él, un demonio de cuernos curvos se aparta de la pelea. Se llama Vael.'),
    { who: 'garrick_d', text: 'Bien hecho, chico. Siempre supe que llegarías lejos.' },
    { who: 'aren', text: '¿Para quién trabajas, Garrick? ¿Para el Rey Demonio?' },
    { who: 'garrick_d', text: '¿Asmodar? Ja. Asmodar es otro perro, como yo. Los que de verdad mandan son los que...' },
    N('Una columna de luz blanca atraviesa el techo. Garrick ni siquiera grita. Cuando la luz se va, no queda nada de él. Ni ceniza.'),
    { who: 'serafiel', text: '(Desde lo alto) El traidor ha sido juzgado. El Coro os protege, humanos. Seguid luchando.' },
    { who: 'vael', text: 'Le han borrado. Para que no hablara. Llevo cien años sirviendo a la Legión y nunca había visto algo así.' },
    { who: 'vael', text: 'Quiero saber quién mueve los hilos. Vuestro camino y el mío son el mismo. Bajo el fuerte hay un pozo: lleva al Inframundo.' },
    N('La oscuridad que deja la luz al irse entra en Aren. Ha despertado la última afinidad: UMBRA.'),
    N('Fin del ACTO 6.'),
  ],
  // ---------- Acto 7: el Inframundo ----------
  acto7: [
    N('ACTO 7 · EL INFRAMUNDO'),
    N('El pozo bajo el Bastión Negro no tiene fondo. O sí: un mundo entero de roca roja, ríos de lava y un cielo de ceniza.'),
    { who: 'vael', text: 'Bienvenidos a casa. A mi casa. No toquéis nada que brille.' },
  ],
  mq33_fin: [
    N('Brasa Quieta: tiendas de piel junto a un río de lava. Los demonios que viven aquí no llevan armas.'),
    { who: 'kra', text: 'Vael. Te creíamos muerto. Y traes humanos... y un ángel. No me mires así, niña: hueles a pluma.' },
    { who: 'lysa', text: '¿Yo?' },
    { who: 'vael', text: 'Kra deserta desde hace siglos. Si alguien sabe cómo llegar a Dis, es ella.' },
    { who: 'kra', text: 'Dos pasos: el Círculo de Ceniza y los Ríos de Fuego. Cada uno tiene su guardián. Los dos tienen que caer.' },
  ],
  mq34_fin: [
    N('El Cancerbero cae. Las tres cabezas miran al techo de ceniza al mismo tiempo, como si alguien las llamara desde arriba.'),
  ],
  mq35_fin: [
    N('La Reina de los Ríos se apaga. Por primera vez en siglos, la lava deja de moverse.'),
    { who: 'vael', text: 'La ciudadela está abierta. Asmodar os espera. Nunca ha perdido.' },
  ],
  mq36_fin: [
    N('Asmodar, el Rey Demonio, cae de su trono. Sobre él, del techo, cuelgan cadenas de luz que se pierden hacia arriba.'),
    { who: 'asmodar', text: '¿Creíais que yo mandaba? Mirad las cadenas. Cada demonio lleva una. Las hicieron ellos.' },
    { who: 'vael', text: 'El Coro. Los ángeles nos mueven. Desde siempre.' },
    { who: 'asmodar', text: 'Las grietas, la guerra, los esqueletos... todo es para ellos. Abren las grietas para beber de lo que sale. Nosotros solo somos la excusa.' },
    { who: 'asmodar', text: 'Y ahora que me habéis vencido, ya no me necesitan. Corred a casa, humanos. Ellos ya han bajado.' },
    N('Las cadenas se rompen. Asmodar sonríe, por fin libre, y se deshace en ceniza.'),
    N('Volvéis a la superficie por el pozo. Al llegar al Bastión Gris, la plaza está cubierta de plumas blancas... y de cuerpos.'),
    { who: 'hale', text: '(Malherido) Bajaron del cielo. Cantaban. Dijeron que limpiaban el mundo de los que sabían demasiado.' },
    N('De la sangre de la plaza nace una escalera de luz que sube hasta las nubes. Arriba está el Cielo.'),
    { who: 'odric', text: 'Ningún mortal puede subir esa escalera. Está escrito en todos los libros: hace falta la invitación de un ángel.' },
    N('Fin del ACTO 7.'),
  ],
  // ---------- Acto 8: el Cielo ----------
  lysa_revela: [
    N('Al pie de la escalera de luz, Lysa se queda muy quieta.'),
    { who: 'lysa', text: 'Siempre me dolía la espalda al ver a los ángeles. Ahora sé por qué.' },
    N('Lysa se aparta el pelo. En su espalda hay dos cicatrices largas, como las de unas alas arrancadas.'),
    { who: 'lysa', text: 'Soy un ángel. O lo fui. Me cortaron las alas por negarme a una orden del Coro: abrir una grieta sobre una ciudad dormida.' },
    { who: 'lysa', text: 'Me borraron la memoria y me dejaron en un santuario de la Frontera. Al ver la escalera lo he recordado todo.' },
    { who: 'bram', text: 'Lysa... Me da igual lo que seas. Sigues siendo la que me cura la estupidez.' },
    { who: 'lysa', text: 'Sin alas no puedo volar. Pero aún puedo invitar. Venid conmigo. Todos.' },
    N('ACTO 8 · EL CIELO'),
  ],
  mq37_fin: [
    N('El Jardín de las Plumas Caídas: flores blancas, fuentes quietas y ángeles sin alas que os miran llegar sin miedo.'),
    { who: 'lysa', text: 'Aquí nací. Aquí nos traen a los que dicen que no.' },
    N('Más allá del jardín brilla Alba Eterna, la ciudad del Coro. La rodean cuatro torres: Espada, Escudo, Balanza y Voz. Mientras sigan en pie, el trono está sellado.'),
  ],
  mq38_fin: [
    N('Velaris, la Espada del Coro, cae de rodillas.'),
    { who: 'velaris', text: 'Cuando lo veáis, entenderéis. Las grietas tenían que seguir abiertas. Lo que sale de ellas nos hace eternos.' },
  ],
  mq39_fin: [
    N('Oriel, el Escudo del Coro, deja caer su escudo.'),
    { who: 'oriel', text: 'Lo que sale de las grietas no es de este mundo. Es de fuera. De antes. Si escapa del todo... todo se acaba.' },
    { who: 'odric', text: '¿Y aun así las abríais?' },
    { who: 'oriel', text: 'Un poco cada vez. Solo un poco. Siempre creímos que podíamos parar.' },
  ],
  mq40_fin: [
    N('Tharion, la Balanza del Coro, mira sus manos vacías.'),
    { who: 'tharion', text: 'Hicimos a los humanos para tener fieles. Ellos hicieron a los esqueletos para tener soldados. Todo para pesar más en la balanza.' },
    { who: 'seren', text: 'Y nosotros nos matábamos por vuestra balanza.' },
  ],
  mq41_fin: [
    N('Serafiel, la Voz del Coro, el ángel que os habló en el cráter, ya no canta.'),
    { who: 'serafiel_c', text: 'Él no es bueno ni malo, Aren. Él no es nada. Una máquina que mantiene el mundo en marcha. Nosotros solo le robábamos un poco.' },
    { who: 'serafiel_c', text: 'Y tú, con tu marca... eres lo único que la Fractura creó por sí misma. Por eso brillas.' },
  ],
  // Al entrar en la sala del trono, antes de la batalla final.
  trono_antes: [
    N('La sala del trono no tiene techo. Sobre el trono flota una esfera de luz, y dentro, encogido, duerme un feto.'),
    N('Un cordón rojo sale de su vientre y se pierde detrás del trono, en algo con demasiados ángulos.'),
    { who: 'pip', text: '¿Eso... es Dios? ¡Si no ha nacido!' },
    { who: 'serafiel_c', text: 'Nunca nació. Nunca nacerá. Así es como dura para siempre.' },
    { who: 'tharion', text: 'No piensa, no juzga, no ama. Solo mantiene el mundo en marcha. Nosotros le hablábamos y nos respondíamos solos.' },
    { who: 'velaris', text: 'Durante eras le pusimos palabras en la boca. Mandamientos, castigos, promesas. Todo era nuestro.' },
    { who: 'odric', text: 'Y si él muere, ¿qué pasa con el mundo?' },
    { who: 'oriel', text: 'Nadie lo sabe. Por eso seguimos aquí, aunque nos hayáis vencido. No sabemos ser otra cosa.' },
    { who: 'oriel', text: 'Mientras uno solo de nosotros siga en pie, nada puede tocarlo. Y si tardáis, nos devolverá a la vida.' },
    { who: 'tharion', text: 'Y no está solo. Puede llamar a cualquier criatura que haya pisado este mundo.' },
    { who: 'odric', text: 'Entonces, a los cuatro y rápido. Cuando caigan, todo contra él antes de que vuelva a levantarlos.' },
    { who: 'lysa', text: 'Apartaos, hermanos. Esta vez no os voy a obedecer.' },
    { who: 'serafiel_c', text: 'Lo sabemos. Pero el Coro no se aparta. Levantad las armas... y que el niño decida.' },
    N('El feto abre los ojos. No tiene pupilas: solo luz. La sala entera empieza a cantar.'),
    { who: 'aren', text: '¡Todos juntos! ¡Es la última!' },
  ],
  trono_fin: [
    N('El cordón se rompe. La esfera se apaga y el feto se deshace en luz, sin un grito, como una vela.'),
    N('En el silencio, el mundo empieza a deshacerse. Las nubes se vuelven líneas. Los colores se separan.'),
    N('Detrás del trono vacío hay algo con demasiados ángulos. Una geometría que no cabe en los ojos.'),
    { who: 'voz', text: '...una pieza... rota... alguien... ocupe... su lugar...' },
    { who: 'odric', text: 'Lo que hizo a Dios. Lo que hizo este universo. Y quizá muchos otros.' },
    { who: 'lysa', text: 'Si nadie ocupa el trono, el universo se deshace. Alguien tiene que sostenerlo.' },
    { who: 'aren', text: '...' },
  ],
  // ---------- Los tres finales ----------
  final_lysa: [
    { who: 'aren', text: 'Lysa. Tú conoces el Cielo por dentro. Dijiste que no cuando todos decían que sí.' },
    { who: 'lysa', text: 'Sostener el mundo... es la cura más grande que existe. Lo haré.' },
    N('Lysa sube al trono. Al sentarse, dos alas de luz se abren en su espalda, más grandes que las que le arrancaron.'),
    N('Las grietas se cierran, todas a la vez, en todo el mundo. Los demás vuelven a casa.'),
  ],
  final_aren: [
    { who: 'aren', text: 'Lo haré yo. La marca de la Fractura... siempre fue para esto.' },
    { who: 'bram', text: '¡Aren, no!' },
    N('Aren sube al trono. La marca de su pecho se enciende y se extiende hasta cubrirlo entero. Ya no es solo Aren.'),
    N('Las grietas se cierran. El mundo sigue. Aren lo cuida desde fuera, sin poder volver.'),
  ],
  final_reinicio: [
    { who: 'aren', text: 'No quiero perder a nadie. Ni a mí.' },
    N('Nadie sube al trono. La geometría detrás de él se cierra sobre sí misma... y el universo vuelve a empezar.'),
    N('Antes de la Fractura. Antes de las grietas. Antes de todo.'),
  ],
  creditos: [
    N('TIERRAS PARTIDAS'),
    N('Gracias por jugar.'),
    N('Puedes seguir jugando: las mazmorras, la Torre de Babel y las pruebas de prestigio siguen ahí.'),
  ],
} satisfies Record<string, Line[]>);

export type EndingId = 'lysa' | 'aren' | 'reinicio';

/** Epílogo según la pareja de Aren y el final elegido ('' = sin pareja). */
export const EPILOGUES: Record<string, Record<EndingId, string>> = {
  bram: {
    lysa: 'Aren y Bram reconstruyen Vado juntos y encienden la forja del padre de Bram. El primer martillo que sale de ella es para Aren.',
    aren: 'Bram forja una estatua de Aren en la plaza de Vado y le habla cada noche. A veces, el viento le contesta.',
    reinicio: 'Dos críos juegan en Vado. Bram le regala un martillo de madera a un desconocido que le resulta familiar.',
  },
  lysa: {
    lysa: 'El final más agridulce: Aren envejece en el Jardín de las Plumas Caídas, y cada mañana florece algo nuevo solo para él.',
    aren: 'Lysa vuelve al Jardín y espera a que Aren la llame. A veces lo hace.',
    reinicio: 'Una sanadora y un chico de aldea se cruzan en un santuario que nunca se hundió.',
  },
  kaela: {
    lysa: 'Aren y Kaela recorren el mundo cazando lo que queda de las grietas. Ella sigue ganando todas las apuestas.',
    aren: 'Kaela vuelve a cazar sola, pero siempre deja una flecha clavada mirando al cielo.',
    reinicio: 'Kaela le gana a Aren una recompensa en su primer encuentro. Y en el segundo.',
  },
  odric: {
    lysa: 'Aren y Odric abren una biblioteca en Osario para que nadie olvide lo que pasó. Odric escribe la historia y Aren la corrige.',
    aren: 'Odric dedica su vida a estudiar «el nuevo diseño» del mundo. Cada página empieza con el nombre de Aren.',
    reinicio: 'Un esqueleto erudito llama a la puerta de Aren: «Tengo la extraña sensación de que le conozco».',
  },
  pip: {
    lysa: 'Aren y Pip abren una posada en el camino. Pip roba los postres, y Aren le deja.',
    aren: 'Pip enseña a los niños de Vado a «robarle una moneda a Dios». Aren siempre se deja.',
    reinicio: 'Pip, de niño, le roba la bolsa a Aren... y se la devuelve sin saber por qué.',
  },
  seren: {
    lysa: 'Aren y Seren hacen de Osario una ciudad libre para esqueletos y humanos.',
    aren: 'Seren monta guardia ante el trono vacío durante siglos. Nunca se aparta.',
    reinicio: 'Una capitana de huesos y un chico humano firman la primera paz entre sus pueblos.',
  },
  vael: {
    lysa: 'Aren y Vael viven entre los mundos y vigilan que ninguna grieta vuelva a abrirse.',
    aren: 'Vael es el único que puede visitar a Aren al otro lado. Lo hace cada luna.',
    reinicio: 'Vael, sin cuernos ni recuerdos, sonríe a Aren en un camino: «Llegas tarde».',
  },
  '': {
    lysa: 'El grupo celebra en la posada del Bastión y cada uno sigue su camino. Siempre vuelven por la fogata.',
    aren: 'El gremio pasa a llevar el nombre de Aren. Sus compañeros lo mantienen vivo.',
    reinicio: 'Todos se encuentran en Vado el día que nunca llegó la grieta.',
  },
};

// ---------------------------------------------------------------- Escenas de las misiones personales
Object.assign(SCENES, {
  personal_bram: [
    N('Entre las cenizas de la forja, Bram aparta una viga quemada. Debajo, intacto, el martillo de su padre.'),
    { who: 'bram', text: '«Para Bram». Lo grabó cuando yo tenía seis años. Decía que algún día me lo daría... cuando dejara de dar martillazos a lo loco.' },
    { who: 'aren', text: 'Pues sigues dándolos.' },
    { who: 'bram', text: 'Ya. Pero ahora sé a quién se los doy. (Se le escapa una risa, y luego otra cosa que no es risa.)' },
    N('Bram enciende la forja de su padre con el martillo. Deja una brasa encendida en un colgante: es para él.'),
  ],
  personal_lysa: [
    N('La hermana Ilda, flaca y cubierta de polvo, reconoce a Lysa al instante.'),
    { who: 'narrador', text: '«Niña... Llegaste al santuario una noche de tormenta, sin memoria. Tenías dos heridas en la espalda que nunca cerraron del todo.»' },
    { who: 'lysa', text: '¿Heridas? ¿De qué?' },
    { who: 'narrador', text: '«Nunca quise preguntarlo. Toma: tu rosario. Rezabas con él cada noche, aunque decías que no sabías a quién.»' },
    { who: 'lysa', text: '...Yo tampoco lo sé. Pero lo guardo.' },
  ],
  personal_garrick: [
    N('El último bandido cae. Antes de morir escupe: «Tu escuadra no murió en la grieta, Garrick. Tú la vendiste».'),
    { who: 'bram', text: '¿De qué habla?' },
    { who: 'garrick', text: 'De nada. Mentiras de ladrones. Vámonos.' },
    N('Garrick no vuelve a hablar en todo el camino.'),
  ],
  personal_kaela: [
    N('En el corazón del Bosque Blanco, entre los lobos caídos, Kaela encuentra un colmillo enorme clavado en un tronco: el del gran lobo blanco.'),
    { who: 'kaela', text: 'Mi maestro lo hirió y el lobo lo mató. Llevo diez años queriendo terminar su cacería.' },
    { who: 'kaela', text: 'Y resulta que el lobo murió de viejo. Nadie lo cazó. (Se ríe, y suena casi aliviada.)' },
    { who: 'kaela', text: 'Me quedo el colmillo. Y dejo de cazar fantasmas. Ahora cazo con vosotros.' },
  ],
  personal_odric: [
    N('Odric junta las tres páginas sobre una roca. Son lo más antiguo que ha escrito un esqueleto.'),
    { who: 'odric', text: '«Despertamos sin saber quiénes éramos. Los de las alas de ceniza nos dieron armas y un nombre: Legión.»' },
    { who: 'odric', text: 'Nunca elegimos esta guerra. Nos la pusieron en las manos el primer día. Esto... esto lo cambia todo.' },
    { who: 'aren', text: '¿Qué vas a hacer con ellas?' },
    { who: 'odric', text: 'Lo que hace un archivero: que nadie pueda decir que no lo sabía.' },
  ],
  personal_pip: [
    N('En una jaula de las Puertas de Osario, un niño flaco levanta la cabeza.'),
    { who: 'pip', text: '¡Nilo! Te dije que volvería. Te lo dije.' },
    { who: 'narrador', text: '«Dijiste que volverías con una espada de oro.»' },
    { who: 'pip', text: 'He vuelto con algo mejor: con amigos que tienen espadas. Toma, mi moneda de la suerte. No, espera. Es mía. Bueno... tómala. No. Vale, me la quedo.' },
  ],
  personal_seren: [
    N('En lo alto de las Cenizas Altas, cientos de esqueletos encadenados levantan la vista hacia su capitana.'),
    { who: 'seren', text: 'Soldados. Os vendí sin saberlo. No volverá a pasar.' },
    N('Seren rompe la primera cadena con su escudo. Los demás la siguen.'),
    { who: 'seren', text: 'Ya no sois un ejército. Sois libres. Id a Cenizalta: allí se cultiva, no se mata.' },
    N('Un viejo soldado le devuelve el estandarte del ejército. Seren lo guarda sin decir nada.'),
  ],
  personal_vael: [
    N('Vael sostiene las tres esquirlas de luz. Al juntarlas, forman un eslabón: una cadena que se pierde hacia arriba.'),
    { who: 'vael', text: 'Cada demonio lleva una. Yo también la llevaba. Nunca la vi.' },
    N('Vael aprieta el eslabón hasta que se parte en dos.'),
    { who: 'vael', text: 'Ahora sí la veo. Y ahora sé dónde termina.' },
  ],
} satisfies Record<string, Line[]>);
