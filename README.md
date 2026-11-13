# Tierras Partidas

Roguelike por turnos en cuadrícula (estilo *Mystery Dungeon*) con exploración del mundo por menús (estilo *SMT IV*), fantasía oscura y un gremio humano que crece con la historia.

## Cómo jugar

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev      # abre http://localhost:5173
```

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm run build` | Comprueba tipos y genera `dist/` (se puede abrir en cualquier hosting estático) |
| `npm run check` | Solo comprueba tipos |
| `npm run sim` | Simula 20 incursiones por mazmorra con un piloto automático: sirve para detectar errores y revisar el balance |
| `npm run locks-test` | Comprueba en 60 semillas que todos los pisos con candados tienen solución |
| `npm run tactics-test` | Comprueba que un aliado separado del grupo se defiende con cada táctica |
| `npm run follow-test` | Mide si los aliados siguen bien al protagonista |

### Controles en mazmorra

| Tecla | Acción |
|---|---|
| Flechas / WASD | Moverse |
| Q E Z C (o teclado numérico) | Diagonales |
| Mayús + dirección | Girar sin moverse. Mientras mantienes Mayús se marca en rojo la casilla de enfrente; la flecha roja junto al protagonista indica siempre hacia dónde mira |
| Espacio | Atacar al frente (chocar con un enemigo también ataca) |
| 1 2 3 4 | Habilidades (K abre la lista) |
| I | Bolsa · T: equipo · R o `.`: esperar · Esc: menú |
| M / N | Activar o desactivar la música / los efectos (por separado; también en Opciones) |

En los menús: flechas para moverse, Enter/Espacio/Z para aceptar, Esc/X para volver. También funciona el ratón.

## Qué incluye

**Mundo (estilo SMT IV).** No se camina libremente: en cada localidad eliges opciones (tablón, hablar con la gente, tienda, almacén, posada, gremio, afinidad de Aren, mapa). La descripción de la opción seleccionada aparece siempre en la barra fija de abajo. En el mapa eliges destino: mazmorras fijas cercanas o rutas hacia otras localidades. **Las rutas son mazmorras**: la primera vez hay que atravesarlas y después quedan *seguras* (se puede viajar directamente o volver a explorarlas).

**Mazmorras.** Puntos fijos por dificultad (★), pisos generados al azar en cada entrada. Turnos estilo *Mystery Dungeon*: cada acción tuya es un turno y todos se mueven. Hay niebla de guerra, minimapa, objetos en el suelo, escaleras, reaparición de enemigos y jefe en el núcleo (las escaleras se abren al vencerlo). El piso del jefe no es una mazmorra: es **una sola sala grande** con unas columnas para cubrirse, y el grupo empieza en el lado opuesto al jefe.

**Mazmorras por tramos.** Una incursión puede tener varios tramos seguidos, cada uno con su nombre, aspecto, monstruos, terrenos y número de pisos (`next` en `data/dungeons.ts`): al acabar los pisos de un tramo se pasa al siguiente sin salir. Así una ruta puede cambiar de paisaje (Paso del Cuervo, montaña → Marjal del Cuervo, lago pantanoso) y una mazmorra puede ir ganando profundidad (Bosque de Espinas → Bosque Profundo; Hondonada de la Frontera → Entrañas → Núcleo). La preparación muestra el recorrido completo y la etiqueta del piso dice el tramo (*Tramo 2/3 · Piso 1 de 2*). Las misiones de un tramo cuentan para la mazmorra entera, y al completarla todos sus tramos quedan superados.

**Formas de piso** (`layouts`, o según la dificultad con `layoutsFor`): *pocas salas* (mapa pequeño, las primeras mazmorras), *salas y pasillos* (la clásica), *laberinto* (mapa grande con muchas salas pequeñas y caminos que se cruzan) y *salas gigantes* (pocas salas enormes muy conectadas). Las mazmorras de ★ solo tienen pisos pequeños; los laberintos y las salas gigantes salen a partir de ★★★ o donde se indique. En las salas gigantes los monstruos, objetos y trampas se cuentan por superficie.

**Condiciones de los pisos** (`goals`, textos en `GOALS`). En algunos pisos las escaleras están cerradas hasta cumplir algo:
- **Palanca** (pisarla), **llave de la escalera** (recogerla), **braseros** (encender los 3 pisándolos), **cacería** (derrotar a cierto número de monstruos) o **alfa** (vencer a un monstruo más grande, dorado y con mucha más vida).
- **Escolta:** una persona perdida sigue al grupo; hay que llevarla junto a las escaleras. Los monstruos también van a por ella. Si muere, las escaleras se abren igual, pero una **maldición** sella las habilidades del grupo ese piso y los dos siguientes (sale en el HUD).
- **Faros:** junto a las escaleras hay una antorcha; con ella se encienden los 3-4 faros del piso, que salen en el mapa desde el principio (y las escaleras también).
- **Fragmentos:** de 2 a 6 pedazos del sello repartidos por el piso.
- **Orden de colores:** sobre las escaleras aparece un orden de colores (también en el HUD, una vez visto); hay que activar las palancas de esos colores en ese orden. Si te equivocas, todas vuelven a su sitio.
- **Cajas:** en la sala de las escaleras hay cajas y placas; cada caja se empuja de frente (nunca en diagonal) hasta su placa. Un aliado detrás de la caja se aparta. El **botón de reinicio** devuelve las cajas a su sitio, apartando a quien esté encima.
- **Vigías:** gólems inmóviles que giran cada 3 turnos; su zona de visión sale en rojo. Si ven al líder, el grupo vuelve al inicio del piso (y los monstruos pueden encerrarte). Las escaleras están abiertas.

El HUD muestra el objetivo y su progreso, y el minimapa marca lo que hace falta. En esos pisos no hay hoyos ni hielo que pueda dejar algo fuera de alcance. *Babel · Condiciones y formas* tiene una condición en todos los pisos.

**Monstruo dorado** (`GOLDEN_CHANCE`). A veces un monstruo dorado brilla en el piso y sale siempre en el mapa. Huye del grupo; si se le acorrala y cae, suelta mucho oro, un objeto bueno y materiales.

**Tienda en la mazmorra** (`SHOP_CHANCE`). Un tendero monta su puesto en una sala con objetos a la venta en el suelo. Lo que coges va a la bolsa y se paga chocando con el tendero; si no te llega el oro, devuelves lo que no puedes pagar. Si sales de la sala sin pagar, el tendero se enfada y aparece con dos guardias (y el botín es tuyo, si sobrevives).

**Eventos de sala** (`EVENT_CHANCE`): un **altar de sangre** (todos pierden un 20% de vida a cambio de un objeto raro), un **viajero herido** (si le das una poción o comida, te da oro y te marca las escaleras), un **cofre** (tesoro... o un mímico) y una **fuente** (cura al grupo o lo envenena). Al chocar con ellos sale una ventana para elegir.

**Objetos malos y sin identificar.** La *carne podrida*, la *seta dudosa* y el *veneno embotellado* se lanzan: el monstruo al que alcanzan se los come y queda envenenado o dormido. El *frasco turbio* y el *pergamino sellado* están sin identificar: se pueden probar a ciegas (pueden ser una poción mayor, un orbe... o veneno, o un pergamino maldito que atrae monstruos) o llevarse al **tasador** del gremio (40 de oro cada uno). Odric los identifica solo al recogerlos (`UNKNOWN_TABLE` en `items.ts`).

**Talentos de exploración** (`talent` en `characters.ts`, se ven en la ficha). Funcionan mientras el miembro va en el grupo: Aren siente las escaleras a 8 casillas; Bram derriba murallas reforzadas a martillazos (3 golpes) si es el líder o va a su lado; Lysa cura un 15% al llegar a cada piso; Garrick hace que el hambre baje un 20% más despacio; Kaela ve en el mapa a los monstruos a 6 casillas aunque haya paredes; Odric identifica objetos; Pip descubre las trampas que hay junto a él o al líder y sabe si un cofre es un mímico; Seren consigue un 15% de descuento en el campamento y en las tiendas; y con Vael la Parca tarda 45 segundos más.

**Puntaje final.** Al terminar una incursión (completada, huida o caída) sale una pantalla con lo conseguido y sus puntos: pisos, monstruos, oro, objetos, condiciones cumplidas, escoltas salvadas, dorados, eventos, rapidez... y lo que resta (compañeros caídos, escoltas perdidas, veces que te vieron los gólems). El rango (S, A, B, C o D) depende de los puntos por piso (`DungeonRun.score`).

**Dentro de la mazmorra.** Al entrar y al cambiar de piso aparece una cortina con el nombre de la mazmorra y el piso. **Cambio de líder (tecla L o Esc → Cambiar de líder).** Cualquier miembro en pie puede pasar a mandar sin gastar turno: es quien manejas, va delante y se intercambia de sitio con los demás. Sirve para poner delante a alguien sano y apartar a Aren cuando va mal (como aliado malherido, Aren se retira de los enemigos si tiene hueco). Si cae el líder, Aren vuelve a mandar; si cae Aren, la incursión termina igual, mande quien mande. El líder lleva una ★ en su ficha.

**Caídos y Lágrima del alba.** Los compañeros caídos siguen en el grupo al bajar de piso (con su ficha en gris) y vuelven al descansar en un campamento. La **Lágrima del alba** revive a un caído junto al líder con la mitad de su vida, aunque cayera en otro piso. Es muy rara: no se vende y solo aparece de vez en cuando en el suelo de las mazmorras difíciles. La Semilla de vida sigue siendo la que revive sola en el momento de caer.

**Piloto automático (tecla P o Esc → Piloto automático).** El líder juega solo con lo que el grupo sabe: no conoce la salida, explora hacia lo que aún no ha visto, recoge lo que encuentra, abre candados si tiene la llave, rompe grietas cuando no queda otro camino y baja al encontrar las escaleras (al salir de la mazmorra sí pregunta y el campamento se muestra igual). En combate elige cada turno el ataque que más daño hace (habilidades según elemento y número de enemigos alcanzados, golpe normal u objetos para lanzar, salvo las bombas), se cura o cura al grupo cuando hace falta, come cuando hay hambre y, si queda poco para la Parca, va directo a las escaleras. Planifica teniendo en cuenta el hielo y rodea trampas y terrenos dañinos. Si el líder va mal y no quedan pociones, pasa el mando a alguien sano y se lo devuelve a Aren cuando se recupera; también revive a los caídos con la Lágrima del alba si no hay peligro. Prevé los resbalones del hielo, los empujones de las corrientes y el turno extra del barro. Cualquier tecla lo detiene, y también se para solo si a Aren le queda poca vida sin pociones ni nadie sano que mande, o si se atasca. Está en `DungeonRun.autoAction` y `npm run auto-test` lo pone a prueba en todas las mazmorras.

El mapa se puede ver en la esquina, a pantalla completa y semitransparente (el suelo apenas se insinúa y los puntos del grupo, los enemigos y las escaleras se ven por encima del juego) u ocultarlo: tecla V, el menú de la mazmorra (Esc) u Opciones en la ciudad. La preferencia se guarda en el navegador, aparte de la partida (`ui/prefs.ts`). Bajo el minimapa hay un panel con las misiones activas (resaltadas las que se pueden cumplir en esa mazmorra) y, al cumplir una, sale un aviso grande de «¡Misión completada!».

**Trampas.** Son invisibles hasta que alguien del grupo las pisa; después queda su marca en el suelo y en el minimapa, y el grupo las rodea si puede. Hay 10 tipos: pinchos, veneno, aturdidora, teletransporte, hambre, alarma (atrae monstruos), hoyo (el líder cae al piso siguiente), sello de energía, runa explosiva y debilidad. Cada mazmorra tiene su mezcla y su densidad (`traps` en `data/dungeons.ts`). Nunca hay trampas en las entradas de las salas ni hoyos antes de un núcleo.

**Candados y llaves.** En algunos pisos hay salas cerradas con candado (hasta 5 colores). Su llave está siempre en otra sala accesible, a menudo dentro de la sala que se abre justo antes, formando una cadena; la sala de las escaleras suele ser la última. Las llaves solo sirven en su piso. Se configura con `locks` en cada mazmorra.

**Tácticas de los aliados** (en el menú de la mazmorra o en *Gremio → Tácticas*): seguir y luchar, solo atacar (no gasta energía), usar todo, apoyo (cura antes y se queda cerca), ir por separado (explora y caza por su cuenta) y esperar aquí. Con cualquier táctica, un aliado con un enemigo al lado se defiende primero y luego vuelve con el líder.

**Guardado.** Se guarda **siempre antes de entrar** a una mazmorra. Si el líder cae, se vuelve a ese guardado y la incursión empieza de 0. También se guarda al salir con éxito, al viajar y en la posada.

**Hambre.** Las provisiones del grupo bajan cada turno, más rápido cuanto más grande es el grupo. A 0, todos pierden vida cada turno. Hay que llevar comida.

**Gremio.** 9 miembros fijos (no se recluta): el protagonista, Bram, Lysa, Garrick, Kaela, Odric, Pip, Seren y Vael. Todos salen en la portada. Cada uno se reconoce a simple vista y tiene su carácter (`look` en `data/characters.ts`, se ve en su ficha): Aren con el pelo de punta y una bufanda roja, Bram con el pelo rubio peinado hacia arriba en pirámide y camiseta roja sin mangas, Garrick canoso con barba y parche, Kaela con coleta y cinta roja, Odric con capucha y gafas, Pip bajito con pañuelo de ladrón, Seren con yelmo y penacho, y Vael con una grieta violeta en la mejilla. Entran **máximo 4** por incursión. Cada uno tiene rol, elemento, habilidades propias que aprende al subir de nivel y debilidades. Los que se quedan en reserva ganan el 30% de la experiencia.

**Habitantes.** En *Hablar con la gente* hay una lista de personajes de cada pueblo (guardia, mujer preocupada, niño juguetón, leñador…), cada uno con retrato y diálogo propio que cambia según la historia y las misiones entregadas (`npcs` en `data/world.ts`).

**Clases del protagonista (afinidad).** Errante (neutro) al inicio; la historia desbloquea una por acto: Brasa (fuego, acto 1, al sellar la Hondonada), Vendaval (viento, acto 2, en la Ciénaga), Roca (tierra, acto 3, al vencer a Seren), Marea (agua, acto 4, al caer al lago de la Gran Grieta), Lumen (luz, acto 5, al liberar el Bastión) y Umbra (oscuridad, acto 6, en el Bastión Negro). Se elige en su propio menú de la ciudad (*Afinidad de Aren*, con la ficha de cada una) o en la preparación antes de entrar.

**Elementos.** Agua > Fuego > Viento > Tierra > Agua; Luz y Sombra se dañan mutuamente. ×1.5 eficaz, ×0.6 poco eficaz, ×0.75 mismo elemento, +15% si la habilidad es del elemento propio.

**Misiones.** Las principales las da la Expedición y avanzan solas al cumplirse (con escenas). Las secundarias se aceptan y entregan en el tablón de cada pueblo: exterminio, rescate (encontrar a alguien en un piso concreto), recolección y llegar al fondo. Antes de entrar a una mazmorra, si hay secundarias disponibles que se podrían cumplir en ella y no las has aceptado, aparece un aviso (con la opción de aceptarlas en el momento si son de esa localidad).

**Equipo.** Cada miembro tiene arma, armadura y accesorio. Las armas son por tipo (espada, martillo, bastón, arco, daga, lanza) y solo las usa quien maneja ese tipo. El equipo sube estadísticas, resiste elementos (por ejemplo −30% de daño de Sombra), potencia el daño de un elemento o da inmunidad a estados (veneno, aturdido). Se compra en la **Herrería** de cada localidad y se pone en *Gremio → Equipamiento*, que muestra cómo cambian las estadísticas antes de equiparlo.

**Habilidades: 4 por miembro.** Cada uno lleva 4 habilidades. Si aprende otra con los 4 huecos llenos, una ventana pregunta cuál olvidar (o no aprender la nueva). Las olvidadas se recuperan en la *sala de entrenamiento*.

**Cuartel del gremio** (*Gremio → Mejoras del cuartel*, se paga con oro):
- **Cocina:** cocina platos con ingredientes. Los platos dan provisiones y efectos a todo el grupo (curar, energía, ataque o defensa, quitar veneno).
- **Sala de entrenamiento:** permite cambiar las 4 habilidades de cada miembro; mejorada, la reserva gana el 60% de la experiencia.
- **Biblioteca:** monstruario con la ficha de cada monstruo derrotado (elemento, debilidades, resistencias, estadísticas, botín y dónde aparece).
- **Bolsa de expedición:** más huecos en la bolsa y en la bolsa de ingredientes.

**Ingredientes.** En las mazmorras se recogen del suelo y los sueltan los monstruos. Van a una **bolsa de ingredientes aparte**, con su propio límite, que al completar la mazmorra (o salir con un orbe) se vacía en la **despensa** del cuartel. Si el grupo cae, se pierden.

**Informantes.** En la preparación de una mazmorra, el informante tiene una lista de datos y se paga solo lo que se quiere saber (precio por estrella de dificultad, `INTEL` en `data/dungeons.ts`). Solo ofrece lo que tiene sentido en esa mazmorra: monstruos y debilidades, el jefe de cada tramo, las escaleras (marcadas en el mapa), las trampas (visibles desde el principio), llaves y candados, muros agrietados y salas secretas, los objetivos de los pisos (palancas, braseros, llaves de escalera y alfa) y lo que buscas para tus misiones. Lo comprado se puede volver a escuchar gratis y dura hasta completar o abandonar esa mazmorra.

**Efectos de combate** (evento `fx`, partículas en `burst` de `scene.ts`, texturas `FX` en `sprites.ts`). Cada habilidad muestra el efecto de su elemento en las casillas que alcanza: llamas que suben (fuego), gotas que caen y salpican (agua), ráfagas que giran (viento), rocas que caen (tierra), destellos (luz), humo violeta (sombra) y un tajo blanco (neutro y golpes normales). Curar saca cruces rojas, mejorar flechas naranjas hacia arriba y empeorar flechas violetas hacia abajo. Los objetos lanzados y las pociones también tienen su efecto.

**Estados visibles.** Quien sufre un estado brilla de su color: verde con veneno, rojo con quemadura, violeta con defensa baja, naranja con ataque subido, azul con defensa subida, amarillo con prisa. Los aturdidos llevan estrellas girando sobre la cabeza. Hay un estado nuevo, la **quemadura** (4% de vida por turno durante 3 turnos), que a veces deja la magia de fuego; el antídoto y las curas que quitan el veneno también la quitan.

**Monstruos de colores** (variantes por elemento). Cualquier monstruo puede salir de otro elemento, con su color: un limo rojo es de fuego, un esqueleto azul es de agua, un lobo verde es de viento, uno gris es neutro... Cambian sus debilidades y sus habilidades pasan a ser de su elemento, y el nombre lo dice (*Esqueleto de agua*, *Limo gris*). Salen en un 25% de los monstruos (menos en las primeras mazmorras: un tercio en las de ★, dos tercios en las de ★★); en los *Pisos elementales* de Babel todos se tiñen del elemento del piso. Los sprites se generan solos tiñendo la paleta de cada monstruo (`recolor` en `sprites.ts`).

**Razas** (`race` en `characters.ts`, se ve en la ficha). Dos razas superiores, **ángeles** y **demonios**, y dos inferiores creadas por ellas: los **humanos** (de los ángeles) y los **esqueletos** (de los demonios). Cada miembro representa un elemento: Aren (todos, empieza neutro), Bram fuego, Lysa luz, Kaela viento, Odric agua, Pip neutro, Seren tierra y Vael oscuridad; Garrick es de tierra pero es el traidor. **Lysa es un ángel sin alas** y **Garrick un demonio infiltrado**: sus fichas dicen «Humano» hasta que la historia lo revele (flags `lysa_angel` y `garrick_demonio`). **Odric y Seren son esqueletos** (cuerpo de esqueleto, huesos del color de su elemento: azul y tierra), y **Vael es un demonio** (cuernos). Seren ocupa el hueco de Garrick tras su traición: mismas estadísticas y habilidades, pero su afinidad empieza de cero. La trama completa (8 actos, cuántas mazmorras tiene cada uno, y el jefe final, Dios) está en la propuesta de historia.

**Pareja de Aren.** Con afinidad máxima (*Vínculo*) entre Aren y un compañero, en *Gremio → Afinidad del grupo* se le puede elegir como **pareja** (una a la vez, se puede cambiar; `state.partner`). Sale en su ficha y en la lista de parejas, y cambiará el epílogo de los tres finales (ver la propuesta de historia). Pip solo puede serlo de adulto: en *Leyenda* (prestigio 3) su sprite crece.

**Humanos corruptos.** La **Hermandad del Hueso**, una secta humana que adora a los esqueletos: sectarios, clérigos y su Sumo Sacerdote, más bandidos que no sirven a nadie. Tienen su mazmorra, las **Catacumbas del Hueso**, en el pantano de Villa Niebla (misión secundaria *La Hermandad del Hueso*). Van con el bando de los demonios y los esqueletos, así que los ángeles los atacan.

**Demonios y ángeles** (`faction` en `monsters.ts`, lore en la propuesta de historia). Dos bandos llegados por la Fractura: la **Legión de la Ceniza** (diablillos de fuego, demonios cornudos de sombra, y Varkhul, heraldo de la ceniza) y el **Coro del Alba** (querubines que lanzan luz y ángeles guardianes). Se odian: **en la mazmorra se atacan entre ellos** además de a vosotros, así que conviene dejar que se debiliten. Aparecen en la nueva misión principal *Plumas y ceniza* (tras la Ciénaga): la **Llanura de las Plumas** (más ángeles) y el **Cráter de Ceniza** (más demonios, con Varkhul al final), al norte de Villa Niebla. También salen en Babel.

**Prestigio** (*Gremio → Prestigio*, `PRESTIGE_*` en `data/characters.ts`). El nivel máximo es 20 (la experiencia deja de acumularse). Al llegar, el miembro puede bajar **solo** a la *Senda del Prestigio*: 4 pisos con la mitad de monstruos y, al final, en la sala del jefe, su **eco**, una sombra con su aspecto y su elemento. Se guarda antes; si cae, se pierde lo de esa incursión y ya está. Si vuelve, pasa de *Novato* a *Veterano*, *Élite* y *Leyenda* (3 veces):
- vuelve al **nivel 1**, pero con +10% a todas las estadísticas por prestigio, como si empezara 3 niveles más arriba, y +20% de experiencia;
- no olvida ninguna habilidad aprendida (ni pierde el equipo) y aprende una **habilidad exclusiva** por prestigio (`PRESTIGE_SKILLS`: la del tercero es su ataque definitivo);
- **cambia de traje**: plata con hombreras (Veterano), azul real y oro (Élite), negro y oro con capa carmesí (Leyenda). Los sprites se generan solos a partir del sprite base (`prestigeBody` en `gfx/sprites.ts`), también para cada clase de Aren;
- en *Leyenda* ya no hay tope de nivel, pero pasado el 20 cada nivel cuesta un 8% más de experiencia que el anterior (además de la curva normal), así que subir es cada vez más lento.

La pantalla de Prestigio muestra los 4 trajes de cada miembro y sus 3 habilidades. Al volver, el personaje dice unas palabras (`PRESTIGE_LINES` en `story.ts`).

**Desbloqueos por la historia** (`data/features.ts`). Al empezar solo están el tablón, la gente, la tienda, la posada, el gremio (equipo y equipamiento) y el mapa. Cada misión principal desbloquea 2 o 3 funciones, sale en la ventana de misión completada («Nuevo: ...»), lleva «¡Nuevo!» en el menú y, la primera vez que se abre, una ventana explica para qué sirve. Orden: misión 1 (campo de entrenamiento, herrería, noticias), 2 (tácticas, informante, fogata), 3 (almacén, mejoras del cuartel, diario), 4 (afinidad de Aren, tasador, reconstrucción), 5 (Torre de Babel, prestigio) y 6 (expediciones). Las salas del cuartel (cocina, forja, biblioteca, sala de entrenamiento) aparecen cuando se construyen.

**Campo de entrenamiento** (*Gremio*, tras la primera misión; `data/tutorial.ts`). Mazmorra **fija**, sin azar, de 4 pisos (lo básico; terrenos y trampas; llaves, condiciones y secretos; compañeros y combate) con **carteles** que explican cada mecánica al pisarlos, justo delante de lo que enseñan. No hay Parca ni salen monstruos nuevos. Se puede repetir, y no se gana ni se pierde nada. Los planos se dibujan como texto (leyenda en `DungeonRun.buildFixedFloor`).

**Consejos de la gente.** Algunos habitantes dan consejos de juego según la misión en la que vas: la instructora Iria en el Bastión (lo que se acaba de desbloquear), el cazador viejo y la leñadora Adela en Rocaverde, y la barquera Nela en Villa Niebla.

**Partida de pruebas** (en el título). Todo lo que existe hoy completado y desbloqueado: el gremio entero a nivel 150 en Leyenda, con el mejor equipo +2 y sus habilidades de prestigio, el cuartel y los pueblos al máximo, afinidad máxima entre todos y 99 999 de oro (`core/testsave.ts`).

**Noticias** (en cada localidad, `NEWS` en `data/town.ts`). Lo que se cuenta según la historia y las misiones, más **Lo siguiente**: qué pide la misión principal activa y por dónde se va (también sale en el panel de la ciudad).

**Reconstrucción** (`PROJECTS` en `data/town.ts`). Con donaciones de oro se levantan el Bastión, la empalizada de Rocaverde, los pilotes de Villa Niebla y **Vado, la aldea de Aren y Bram** (tras sellar la Hondonada). Cada proyecto tiene 3 obras con efectos: objetos nuevos en la tienda, descuento en la tienda y la herrería del pueblo, regalos de los vecinos al volver, la forja del padre de Bram (mejorar equipo cuesta un 20% menos) y oro extra al volver de cada incursión. La descripción del pueblo cuenta las obras terminadas.

**Expediciones de la reserva** (*Gremio → Expediciones*). Hasta 3 miembros que no van en el equipo de incursión se mandan a una mazmorra ya superada. Vuelven tras 1 o 2 incursiones (según la dificultad) con oro, materiales, ingredientes y experiencia. Mientras están fuera no pueden entrar en el equipo.

**Diario del gremio** (*Gremio → Diario*): las misiones principales cumplidas (con sus escenas para volver a verlas), todas las misiones, y los récords: veces superada cada mazmorra, piso más hondo y **mejor puntaje** con su rango.

**Comparar en la preparación.** Junto a cada miembro sale ▲ si su elemento tiene ventaja contra alguno de los monstruos (o el jefe) de la mazmorra y ▼ si es débil ante alguno; la descripción dice cuáles.

**Al volver.** Tras completar o huir de una incursión, dos del grupo comentan cómo ha ido, cada uno con su carácter (`RETURN_TALK` en `data/story.ts`).

**Formación siempre visible.** En todas las pantallas fuera de la mazmorra hay una columna lateral con el equipo de incursión: nivel, elemento, vida, energía y equipo puesto.

**Afinidad entre compañeros** (`data/affinity.ts`). Cada pareja que va junta suma los pisos que recorre (la mitad si se escapa con un orbe). Hay 4 niveles: *Confianza*, *Camaradería*, *Lealtad* y *Vínculo* (`AFFINITY_LEVELS`). Al llegar a un nivel, hay que verlo en la **fogata de la posada**: una charla entre los dos que lo activa. Mientras está pendiente, la afinidad de esa pareja no sube, y al preparar una mazmorra un aviso lo recuerda. Cada miembro aporta una ventaja distinta en cada nivel (`BOND_PERKS`): más ataque, defensa o vida, combos (el otro remata al mismo enemigo), cubrir al compañero, curarse o recuperar energía cada 10 turnos, más críticos, menos hambre, más experiencia... Así cada pareja combina ventajas diferentes. Las charlas salen de lo que cuenta cada uno según su carácter, y algunas parejas tienen escenas escritas a mano. En *Gremio → Afinidad del grupo* está el afiche de cada pareja: retratos, nivel, progreso y qué ventajas tiene y cuáles le faltan. Dentro de la mazmorra hay comentarios según quién vaya en el grupo.

**Torre de Babel.** Una región aparte, sin historia, para probar mecánicas. Se llega desde el mapa de cualquier localidad por un portal (y se vuelve por él). Tiene tienda, herrería y sus mazmorras: *Pisos sin fin*, *Galería de trampas*, *Laberinto de candados*, *Pisos elementales* (cada piso de un solo elemento), *Terrenos y muros*, *Condiciones y formas* (todos los pisos con condición y de todas las formas) y *Travesía* (la única que no es infinita: tres tramos, bosque, montaña con jefe y volcán con jefe, para probar los tramos y el campamento tras el jefe) y *Desfile de jefes* (`bossRush`: cada piso es la sala de un jefe del juego al azar, también los de la historia y Dios, sin repetir el anterior; un campamento cada `RUSH_CAMP_EVERY` jefes y un nivel más cada dos). Dios llega siempre con sus cuatro arcángeles y la mecánica del trono. Cuanto más se sube, más jefes a la vez (`RUSH_MIX_FROM`: dos desde el piso 6, tres desde el 12; los acompañantes van algo debilitados con `RUSH_MIX_POWER`), y las escaleras se abren al caer el último. Las demás son infinitas: cada 10 pisos hay un guardián al azar (`BOSS_EVERY`) y se guarda el récord. Son **modo prueba** (`practice`): no dan experiencia ni misiones, y al salir (o caer) la partida vuelve a como estaba al entrar; solo se conservan el récord y las tácticas. En todas salen monstruos de todo el juego (solo los que la historia ya ha enseñado cerca de ese nivel, y lo mismo con los guardianes), ajustados al nivel medio del grupo según el **rango** elegido en la preparación (Fácil −3, Normal, Difícil +3, Pesadilla +6). Para probar algo nuevo, basta con añadir una mazmorra con `scaling: 'party'` y ponerla en `DUNGEON_SPOTS` con `from: TOWER_ID`.

**La historia completa.** Ocho actos jugables de principio a fin, con 42 misiones principales, 205 secundarias y unas 90 mazmorras. Cada pueblo tiene de 1 a 5 mazmorras propias y cada mazmorra de 2 a 5 secundarias (`npm run story-test` lo comprueba); las que faltan las completa `fillDungeonQuests()` en `quests.ts` con encargos de cazar, recoger (un objeto por región) y rescatar, que da el pueblo desde el que se entra:

| Acto | Región | Localidades | Lo principal |
| --- | --- | --- | --- |
| 1 | La Frontera | Bastión Gris, Aldea Rocaverde | La Cueva, el santuario (Lysa), la Hondonada |
| 2 | Las Rutas Perdidas | Villa Niebla, Aguaclara, Juncal | La Ciénaga (Kaela), la Hermandad del Hueso, la Llanura de las Plumas |
| 3 | El Mar de Arena | Palmarroja, Solmarena, Cantera Seca | Los pozos envenenados, Solmarena sitiada (Odric), el Fortín de Hueso (Seren) |
| 4 | Las Cumbres Blancas | Pico Escarcha, Fuerte Albar, Refugio del Lobo Blanco | Morgath, Ixa y la Gran Grieta: no se cierra y Garrick traiciona |
| 5 | La Tierra Maldita | La Madriguera, Osario | La huida (Pip) y el regreso liberando 8 ciudades tomadas (Seren se une) |
| 6 | El Archipiélago Coral | Puerto Coral, Isla Gaviota, Faro del Fin | El Bastión Negro: Garrick es un demonio, los ángeles lo desintegran (Vael) |
| 7 | El Inframundo | Brasa Quieta (refugio) | Cancerbero, la Reina de los Ríos y Asmodar; los ángeles controlan a los demonios |
| 8 | El Cielo | Jardín de las Plumas Caídas (refugio) | Lysa revela que es un ángel; las cuatro torres del Coro; el trono, Dios y los tres finales |

Cada región tiene su kit de mazmorras (`actD` y `KITS` en `dungeons.ts`): aspecto, monstruos, suelos, trampas, condiciones de escalera y los elementos con que se tiñen sus monstruos (`elements`). Las tiendas y herrerías venden equipo nuevo cada dos actos. `npm run story-test` recorre la historia entera sin interfaz y comprueba que se puede terminar y que no falta nada.

**Pueblos secundarios.** Además de los de la historia: Molinogris y Vado (la aldea de Aren y Bram, que se levanta con la reconstrucción) en la Frontera, Dunavieja en el desierto, Hielonegro en las nieves y Cenizalta, una aldea de esqueletos campesinos, en la Tierra Maldita. Cada uno tiene su ruta-mazmorra, tienda, herrería, gente y misiones.

**Misiones personales.** Cada compañero tiene la suya (`member` en `QuestDef`, `personal()` en `quests.ts`): solo avanza con él en el equipo, y sus objetos o personas solo aparecen entonces. Al terminarla hay una escena (`personal_<id>`) y un recuerdo, un accesorio propio. La de Garrick se pierde con su traición.

**Ciudades tomadas (acto 5).** Con la traición de Garrick (flag `traicion`), las ciudades del camino de vuelta caen (`taken` en `world.ts`): mientras no se libera, la ciudad es una mazmorra, sin tienda, posada ni tablón, y no se puede salir de ella al mapa, así que se liberan en orden. Al liberarla vuelve a ser ciudad y su mazmorra se puede repetir.

**Jefes con nombre y escolta.** `bossName` da nombre propio al jefe (los capitanes de la Legión de cada ciudad) y `bossEscort` le pone compañía en su sala: en el trono, Dios está con los cuatro capitanes del Coro, debilitados con `bossEscortPower`. La escolta no es «el jefe»: vencerla no abre las escaleras. `bossScene` es una escena que se ve la primera vez que el jefe aparece a la vista (la cámara va hasta él y luego vuelve): en el trono, la conversación con los capitanes y Dios antes de la batalla final.

**Jefes grandes.** Los jefes ocupan varias casillas según la forma de su sprite (`BOSS_SIZE` en `monsters.ts`): 2×2 los pequeños, 3×2 los alargados (escorpión, araña, Cancerbero), 2×3 los altos (demonios, ángeles, Rey Hueso) y 3×3 los enormes (Corazón de la Grieta, Asmodar). Dios ocupa 5×5. `x, y` es la esquina de arriba a la izquierda; `cheb`, `covers`, `dirTo` y `mid` (en `dungeon/types.ts`) cuentan todas sus casillas para distancias, golpes y efectos, y los grandes buscan camino por donde quepan enteros (`bigPath`).

**La batalla final** (`ward`, `still` y `guard`; `WARD` en `run.ts`). Dios es un feto que no se mueve y es **inmune** mientras quede en pie alguno de los cuatro capitanes. Al caer el primero empieza una cuenta: si no caen los cuatro a tiempo, los va reviviendo uno a uno. Al caer los cuatro queda **vulnerable** unos turnos y después los revive a todos. Además, cada pocos turnos **invoca** cualquier criatura del mundo (a veces un jefe, más débil), menos a los arcángeles. El HUD dice junto a su vida si es inmune o vulnerable y cuánto le queda. Prueba: `npm run throne-test`.

**El Cielo** (`sky` en el tema de la mazmorra). Las mazmorras del Cielo funcionan igual, pero no hay muros: en su lugar está el vacío y el suelo son baldosas de vidrio flotantes, con dos capas de nubes debajo que se mueven solas y con la cámara (`drawSkyMap` y `skyCanvas` en `gfx/tiles.ts`). Lo que no se ha visto lo tapan nubes en vez de oscuridad.

**El final.** Al vencer a Dios, Aren elige entre tres respuestas (Lysa ocupa el trono, Aren lo ocupa, o el universo se reinicia). Después hay un epílogo según la pareja de Aren y el final (`EPILOGUES` en `story.ts`), los créditos y el juego sigue. Si Garrick era la pareja, su traición tiene escena propia.

**Sprites con dirección.** Personajes y monstruos tienen 5 poses (frente, espaldas, perfil y las dos diagonales); las de la izquierda son las mismas en espejo, así que cubren las 8 direcciones. Las poses se generan a partir del sprite de frente (`src/gfx/facing.ts`): basta con dibujar la plantilla de frente de un personaje o monstruo nuevo.

**Mapa del mundo** (`ui/worldmap.ts`). Es lo que hay fuera de los pueblos y ocupa toda la pantalla: «Salir al mapa» es salir del pueblo, y para volver a entrar hay que ponerse encima y pulsar Enter. Al pararse en un punto sale sola una ventana con su descripción. Al elegir una mazmorra, la preparación se abre en una ventana sobre el mapa (`openWindow()` en `layout.ts`: las pantallas se dibujan dentro hasta cerrarla); al entrar, el mapa se acerca al punto y se funde en negro con su nombre (`zoomIntoMap`), y empieza la cortina del piso. Al terminar, una pantalla negra con la puntuación, el oro, la experiencia y los objetos conseguidos (`scoreScreen`) devuelve al mapa, en la misma mazmorra. Aren camina libremente por todo el mapa con las flechas o WASD (8 direcciones); con clic va a un punto siguiendo los caminos. Las mazmorras se apartan solas para no quedar una encima de otra, y las de mar quedan en una bahía abierta al océano. Las regiones de tierra firme forman un continente que llega hasta el borde por donde conecta con la vecina; las mazmorras de agua quedan en lagos o en el mar, y las de aire (el camino al Cielo) no llevan tierra. Al salir del pueblo el mapa se aleja desde él, y al entrar se acerca. Cada región es un mapamundi sencillo con su color y sus adornos, y sus puntos son pueblos, mazmorras, rutas (a mitad de camino entre dos pueblos), flechas de salida a otras regiones y el portal a Babel. Cada punto lleva un icono según su temática (castillo, casa, tienda, torre, cueva, bosque, montaña, fortaleza, ruinas, agua, calavera, volcán, nubes, dunas). Al pararse en uno, a la izquierda sale su descripción y Enter entra. Lo que aún no se ha descubierto sale como «¿?» y no se puede pisar. Una ruta sin asegurar no se cruza (hay que atravesar su mazmorra); una segura se cruza caminando, y al llegar a otro pueblo se viaja sin salir del mapa. Al pisar una flecha de salida, el mapa se desliza a la otra región. El portal a Babel se puede usar siempre.

**Mapa por región.** El mapa muestra solo la región en la que estás (una por acto, más la Torre de Babel), ajustado al recuadro. Los caminos hacia otra región salen como una flecha hacia el borde con el nombre del destino, y el portal a Babel aparece en una esquina.

**Arte y sonido.** Todo es 8-bit generado por código: sprites en plantillas de texto (`src/gfx/sprites.ts`) y música y efectos chiptune sintetizados con WebAudio (`src/audio/audio.ts`). No hay archivos externos. Para usar arte libre (por ejemplo [Kenney](https://kenney.nl/assets), licencia CC0), basta con cargar PNG con las mismas claves de sprite.

## Estructura

```
src/
  data/       ← CONTENIDO: aquí se añade casi todo sin tocar la lógica
    characters.ts  miembros del gremio (con su tipo de arma) y afinidades del protagonista
    equipment.ts   armas, armaduras y accesorios
    guild.ts       mejoras del cuartel y recetas
    traps.ts       trampas y colores de candado
    tactics.ts     tácticas de los aliados
    monsters.ts    monstruos y jefes
    skills.ts      habilidades y estados alterados
    items.ts       objetos
    dungeons.ts    mazmorras (pisos, niveles, monstruos, objetos, jefe, colores)
    world.ts       regiones, localidades, puntos de mazmorra y rutas
    quests.ts      misiones principales y secundarias
    story.ts       escenas, conversaciones de fogata y comentarios en mazmorra
    elements.ts    tabla de elementos
  core/       estado de partida, guardado, estadísticas, experiencia y misiones
  dungeon/
    generator.ts   generador de pisos (salas + pasillos)
    locks.ts       candados y llaves con solución garantizada
    run.ts         TODA la lógica por turnos (sin gráficos; la usa también el simulador)
    scene.ts       render y animaciones en Phaser
    controller.ts  teclado, HUD, minimapa y menús dentro de la mazmorra
  gfx/        sprites (y sus poses por dirección en facing.ts), tiles e ilustraciones generados por código
  audio/      efectos y música chiptune
  ui/
    dom.ts         menús, diálogos, teclado
    layout.ts      esqueleto de pantalla, columna lateral del equipo, fichas
    screens.ts     título, ciudad, tablón, tienda, posada, mapa, preparación e informante
    guild.ts       gremio: equipamiento, entrenamiento, cocina, biblioteca, mejoras, herrería
  main.ts     flujo general: título → ciudad → mazmorra → resultado → historia
scripts/sim.ts  simulador sin interfaz (y los demás *-test.ts: piloto, candados, terrenos, historia...)
```

## Cómo añadir contenido

- **Un monstruo nuevo:** añádelo en `data/monsters.ts` (si quieres sprite propio, añade plantilla y paleta en `gfx/sprites.ts`) y ponlo en la lista `monsters` de una mazmorra.
- **Una mazmorra nueva:** en `data/dungeons.ts`, y colócala en el mapa en `data/world.ts` (`DUNGEON_SPOTS`) o como ruta (`ROUTES`). Con `requires: ['flag']` aparece solo cuando la historia lo permite.
- **Una misión:** en `data/quests.ts`. Las recompensas pueden dar oro, objetos, flags, un miembro (`join`) o quitarlo (`leave`), una clase (`unlockClass`), una escena (`scene`) y llevar al grupo a otra localidad (`moveTo`). Las principales nuevas se escriben con `main()`, que pone sola el flag con su id y la escena `<id>_fin`.
- **Un acto nuevo:** región + localidades en `world.ts`, misiones principales encadenadas por flags en `quests.ts` y escenas en `story.ts`.

Después de tocar balance, ejecuta `npm run sim` para ver cómo cambian las tasas de éxito. El ajuste general de dificultad está en `MONSTER_POWER` (`data/monsters.ts`).

## Depuración

En `npm run dev`, dentro de una mazmorra, la consola del navegador tiene `__run` (la incursión actual): `__run.startFloor(5)` salta de piso, `__run.revealMap()` revela el mapa, `__run.state` es la partida. El guardado está en `localStorage` con la clave `tierras-partidas-save`.

## Pendiente / ideas siguientes

- Salas de monstruos.
- Las capitales hostiles (Dis, Alba Eterna) como mapas propios.
- Sustituir el arte y el sonido generados por *assets* libres o propios.

**Campamento.** Solo después de vencer a un jefe: tras el guardián de cada 10 pisos de Babel y tras el jefe de un tramo que no es el último (en el último tramo, vencer al jefe completa la incursión). Al pisar las escaleras abiertas por el jefe se pasa por un campamento: descansar (vida y energía al máximo, sin estados, los caídos vuelven con media vida; las provisiones no), un mercader errante (`CAMP_SHOP`, un 25 % más caro) y tácticas. Después hay que seguir bajando; solo en el modo prueba se puede abandonar desde ahí. Lógica en `DungeonRun.campAhead / campRest / campBuy`, interfaz en `camp()` de `controller.ts`.

**La Parca.** En todas las mazmorras cada piso tiene 3 minutos reales (`REAPER_SECONDS`); el contador está arriba a la derecha del HUD y se pausa con menús abiertos y durante la cortina. Al llegar a 0 aparece la Parca (`parca` en `monsters.ts`): REAPER_LEVEL_BONUS (10) niveles por encima de los monstruos más fuertes de la mazmorra, atraviesa paredes y va siempre a por el miembro más cercano. Se puede vencer, pero hace falta un grupo muy por encima de su nivel (`npm run reaper-test`). No sigue al grupo al piso siguiente.

**Dificultad por tramos (sin fin).** Cada tramo de 10 pisos los monstruos suben TIER_LEVELS (4) niveles de golpe, y hay algún monstruo más por piso. La etiqueta del piso muestra el tramo.

**Ficha del equipo (T en la mazmorra).** Ficha tipo afiche por miembro: retrato grande, barras de vida, energía y experiencia, estadísticas, equipo con iconos y habilidades en tarjetas; ← → para cambiar de miembro. Al aprender una habilidad sale una tarjeta con el retrato de quien la aprende.


**Comparar en la herrería.** Al moverse por la lista de compra, la columna lateral (equipo y, si hay, reserva) marca a cada miembro: ▲ verde y el sprite salta si la pieza le mejora respecto a lo que lleva en ese hueco, ▼ roja si no, = si da igual, y nada si no la puede usar. Al comprar, los que mejoran hacen una animación. La valoración está en `gearCompare` (`core/stats.ts`).

**Materiales y mejoras.** Los materiales (`kind: 'material'` en `items.ts`) salen en el suelo (`materials` de cada mazmorra) y los sueltan los monstruos (`drops`); los jefes dejan un Cristal de Hondonada y la Parca tres. No ocupan bolsa; al salir van a `state.materials` (se pierden si el grupo cae). En la herrería, *Mejorar* sube una pieza (del inventario o puesta) a +1 o +2 (`MAX_PLUS`) con materiales y oro (`UPGRADE_MATS`, `nextUpgrade` en `equipment.ts`). Las versiones mejoradas se generan solas en `EQUIPMENT` con id `pieza+N`. Al comprar, se elige quién se lo pone y si se vende o se guarda lo que llevaba.

**Bolsa con pestañas (I en la mazmorra).** Consumibles (los únicos que se usan ahí), Ingredientes (bolsa de ingredientes → despensa), Materiales (bolsa de materiales aparte, `MATERIAL_BAG_SIZES`, → almacén de materiales) y Objetos clave (lo que piden las misiones de recoger). ← → cambia de pestaña (`tabs` en `menu()`). Las llaves del piso van en una fila propia bajo el resumen superior, y el resumen parpadea en rojo cuando quedan 15 provisiones o menos (más rápido a 0).

**Comida y curación.** Lo que se compra o se encuentra cura y alimenta menos (pan 25, poción 25, poción mayor 75, elixir 12); lo bueno se prepara en el cuartel: platos y pociones de la cocina (poción de hierbas 70, tónico de raíz 25 de energía).

**Forja del gremio.** Mejora del cuartel (`forja`). Recetas en `FORGE_RECIPES`: bombas, lingote de hierro, cuero curtido y seda tejida. Los refinados se piden para el +2 de la herrería.

**Muros.** Grietas (`special: 'crack'`): atajos entre dos zonas lejanas a pie; se rompen con un ataque normal (Espacio) mirando a la grieta. Murallas reforzadas (`'hard'`): cierran una sala secreta pequeña (`map.secrets`, roomAt ≥ `SECRET_BASE`) con oro, materiales y algo bueno; nunca escaleras ni monstruos. Solo las rompen las bombas (`breaks` en el objeto). En los pisos con candados no hay grietas. Por mazmorra: `cracks` y `secrets`. Prueba: `npm run walls-test`.

**Terrenos** (`data/terrain.ts`, `terrain` por mazmorra según su ambiente):
- *Hierba alta*: quien está dentro solo es visto desde una casilla (sirve para esconderse; los enemigos dentro tampoco se ven).
- *Agua*: +30% de daño recibido; los seres de agua no lo sufren y pegan un 20% más desde ella.
- *Brasas*: quema un 6% de vida por turno (salvo fuego); el grupo las rodea si puede.
- *Suelo sagrado*: cura un 4% por turno, pero quema un 5% a los de sombra.
- *Barro*: salir de cada casilla cuesta un turno extra y los rápidos pierden su ventaja (no afecta a los de tierra).
- *Hielo*: resbalas en línea recta hasta salir del hielo o chocar (no afecta a los de viento). Tras generar el piso, `fixIce` comprueba con `stairsReachable` (que simula los resbalones) que se puede llegar a las escaleras y, si no, quita hielo de salas al azar hasta que se pueda. Sin hielo en pisos con candados.
- *Telarañas*: atrapan un turno y se rompen (no afectan a arañas ni a los de fuego).
- *Niebla*: dentro solo se ve a una casilla; a quien está dentro solo se le ve desde dos.
- *Ceniza*: no se pueden usar habilidades encima (salvo los de fuego).
- *Corrientes*: franjas con dirección (`map.flow`) que empujan una casilla cada dos turnos (así siempre se avanza contracorriente).
- *Raíces*: se pasa por encima, pero frenan flechas, proyectiles y ataques en línea.
Brasas, hielo y telarañas tienen `avoid`: los aliados los rodean si pueden. Cada suelo tiene su forma de reparto (`shape`: mancha, casillas sueltas o franja).

**Escaleras tapiadas.** Con probabilidad `sealedStairs`, cada boca de pasillo de la sala de las escaleras pasa a ser grieta (`sealRoom`): hay que abrirse paso a golpes. Nunca en pisos con candados ni de jefe. Prueba: `npm run terrain-test` (un piloto recorre ~500 pisos con hielo, barro, corrientes y escaleras tapiadas y siempre llega).

Babel · Terrenos y muros reúne todo esto.
