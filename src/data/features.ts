/**
 * Funciones de la ciudad y del gremio que se van desbloqueando con la historia (una o dos por misión principal),
 * para no soltarlo todo de golpe. Sin `flag`, están desde el principio. La primera vez que se abre una función
 * nueva sale `desc` explicando para qué sirve, y en el menú lleva «¡Nuevo!» hasta entonces.
 */
export interface FeatureDef {
  name: string;
  /** Flag con el que se desbloquea (las misiones principales dan 'mq1', 'mq2'...). */
  flag?: string;
  /** Sala del cuartel: además, solo aparece una vez construida en Mejoras del cuartel. */
  upgrade?: string;
  desc: string[];
}

export const FEATURES: Record<string, FeatureDef> = {
  // --- Desde el principio: lo justo para la primera mazmorra
  tablon: { name: 'Tablón de misiones', desc: ['Aquí aceptas y entregas los encargos de cada pueblo.', 'Las misiones principales avanzan solas; las secundarias se aceptan y se entregan aquí.'] },
  gente: { name: 'Hablar con la gente', desc: ['Los habitantes cuentan qué pasa... y muchos dan consejos útiles para las mazmorras.'] },
  tienda: { name: 'Tienda', desc: ['Compra comida y pociones antes de bajar. Sin comida, el grupo pierde vida en la mazmorra.'] },
  posada: { name: 'Posada', desc: ['Guarda la partida. (La partida también se guarda sola antes de entrar en cada mazmorra.)'] },
  gremio: { name: 'Gremio', desc: ['Tu cuartel: equipo de incursión, equipamiento y, más adelante, muchas más salas.'] },
  equipo: { name: 'Equipo de incursión', desc: ['Elige quién entra en la mazmorra: hasta 4 miembros. Aren siempre va.'] },
  equipamiento: { name: 'Equipamiento', desc: ['Arma, armadura y accesorio de cada miembro.'] },
  mapa: { name: 'Salir al mapa', desc: ['Viaja a otros pueblos o entra en las mazmorras cercanas. Los caminos entre pueblos también son mazmorras.'] },
  // --- Ritmo: 2 o 3 funciones nuevas por misión principal (mq1 campo, herrería y noticias; mq2 tácticas, informante y fogata;
  //     mq3 almacén, mejoras del cuartel y diario; mq4 afinidad de Aren, tasador y reconstrucción; mq5 Babel y prestigio;
  //     mq6 expediciones). Las salas del cuartel (cocina, forja...) salen cuando se construyen.
  // --- Misión 1 (la prueba de la Expedición)
  entrenamiento_campo: { name: 'Campo de entrenamiento', flag: 'mq1', desc: ['Una mazmorra fija, sin azar, que enseña todas las mecánicas paso a paso: terrenos, trampas, llaves, grietas, compañeros...', 'Puedes repetirla cuando quieras. No se gana ni se pierde nada.'] },
  herreria: { name: 'Herrería', flag: 'mq1', desc: ['Compra y vende armas, armaduras y accesorios. Al comprar, la columna de la derecha marca a quién le mejora la pieza.'] },
  almacen: { name: 'Almacén', flag: 'mq3', desc: ['Guarda lo que no quieras llevar en la bolsa. Es el mismo en todos los pueblos.'] },
  noticias: { name: 'Noticias', flag: 'mq1', desc: ['Lo que se cuenta en el pueblo y, sobre todo, «Lo siguiente»: qué pide la misión principal y por dónde se va.'] },
  tacticas: { name: 'Tácticas', flag: 'mq2', desc: ['Cómo se comporta cada aliado en la mazmorra: seguir y luchar, solo atacar, apoyo, ir por separado...'] },
  mejoras: { name: 'Mejoras del cuartel', flag: 'mq3', desc: ['Invierte oro en salas nuevas: cocina, biblioteca, sala de entrenamiento, una bolsa más grande...'] },
  babel: { name: 'Torre de Babel', flag: 'mq5', desc: ['Un portal en el mapa lleva a la Torre de Babel: mazmorras de práctica, sin historia. Nada de lo que pase ahí se conserva.'] },
  informante: { name: 'Informante', flag: 'mq2', desc: ['En la preparación de cada mazmorra, el informante vende datos: escaleras, trampas, llaves, el jefe... Pagas solo lo que quieras saber.'] },
  // --- Misión 2 (llegada a Rocaverde, se une Garrick)
  fogata: { name: 'Fogata y afinidad', flag: 'mq2', desc: ['Los compañeros que bajan juntos ganan afinidad. Al subir de nivel, hay que verlo en la fogata de la posada.', 'Cada nivel da ventajas a la pareja cuando va junta. En Gremio → Afinidad del grupo ves cómo va cada pareja.'] },
  diario: { name: 'Diario del gremio', flag: 'mq3', desc: ['La historia vivida (con sus escenas para volver a verlas), las misiones y los récords de cada mazmorra.'] },
  cocina: { name: 'Cocina', flag: 'mq3', upgrade: 'cocina', desc: ['Con los ingredientes de las mazmorras se cocinan platos mucho mejores que lo que se compra. Hay que construirla en Mejoras del cuartel.'] },
  sala_entrenamiento: { name: 'Sala de entrenamiento', flag: 'mq3', upgrade: 'entrenamiento', desc: ['Cada miembro lleva 4 habilidades. Aquí cambias cuáles, y recuperas las olvidadas. Se construye en Mejoras del cuartel.'] },
  // --- Misión 3 (rescate de Lysa)
  tasador: { name: 'Tasador', flag: 'mq4', desc: ['En las mazmorras aparecen frascos turbios y pergaminos sellados. Puedes probarlos a ciegas... o traerlos aquí para saber qué son.'] },
  forja: { name: 'Forja del gremio', flag: 'mq3', upgrade: 'forja', desc: ['Refina materiales (lingotes, cuero, seda) para mejorar el equipo a +2, y fabrica bombas. Se construye en Mejoras del cuartel.'] },
  biblioteca: { name: 'Biblioteca', flag: 'mq3', upgrade: 'biblioteca', desc: ['El monstruario: elemento, debilidades y botín de cada monstruo derrotado. Se construye en Mejoras del cuartel.'] },
  reconstruccion: { name: 'Reconstrucción', flag: 'mq4', desc: ['Dona oro para reconstruir los pueblos: tiendas nuevas, descuentos y regalos de los vecinos.'] },
  // --- Misión 4 (la Hondonada: Aren despierta el fuego)
  afinidad_aren: { name: 'Afinidad de Aren', flag: 'mq4', desc: ['Aren ha despertado un elemento. Antes de cada mazmorra puedes elegir con cuál entra: cambia sus habilidades, sus estadísticas y sus debilidades.'] },
  expediciones: { name: 'Expediciones de la reserva', flag: 'mq6', desc: ['Los que no van en el equipo pueden ir a por materiales a mazmorras ya superadas. Vuelven tras una o dos incursiones.'] },
  // --- Misión 5 (las Rutas Perdidas)
  prestigio: { name: 'Prestigio', flag: 'mq5', desc: ['El nivel máximo es 20. Al llegar, un miembro puede ponerse a prueba solo y volver más fuerte, con una habilidad nueva y otro traje.'] },
};

/** Desbloqueos que trae cada flag (para avisar al completar una misión principal; las salas se avisan al construirlas). */
export const featuresUnlockedBy = (flag: string) => Object.entries(FEATURES).filter(([, f]) => f.flag === flag && !f.upgrade);
