/** Estrategias de los aliados dentro de la mazmorra. */

export type TacticId = 'equilibrado' | 'atacar' | 'habilidades' | 'apoyo' | 'separado' | 'esperar';

export const TACTICS: Record<TacticId, { name: string; desc: string }> = {
  equilibrado: { name: 'Seguir y luchar', desc: 'Sigue al líder y pelea con lo que tenga cerca. Usa habilidades a veces.' },
  atacar: { name: 'Solo atacar', desc: 'Solo ataques básicos: no gasta energía ni cura.' },
  habilidades: { name: 'Usar todo', desc: 'Usa sus habilidades de ataque siempre que pueda.' },
  apoyo: { name: 'Apoyo', desc: 'Prioriza curar (por debajo del 70%) y mejorar al grupo. Se queda cerca del líder.' },
  separado: { name: 'Ir por separado', desc: 'Explora por su cuenta y caza a los monstruos que encuentre.' },
  esperar: { name: 'Esperar aquí', desc: 'No se mueve. Solo ataca a lo que tenga al lado.' },
};

/** Estrategia por defecto de cada miembro si el jugador no eligió otra. */
export const DEFAULT_TACTIC: Record<string, TacticId> = { lysa: 'apoyo', kaela: 'habilidades', odric: 'habilidades', seren: 'apoyo' };
