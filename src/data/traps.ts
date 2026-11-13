/** Trampas (invisibles hasta que alguien del grupo las pisa) y colores de candados/llaves. */

export type TrapId = 'pinchos' | 'veneno' | 'aturdidora' | 'teletransporte' | 'hambre' | 'alarma' | 'hoyo' | 'sello' | 'explosion' | 'debilidad';

export interface TrapDef {
  id: TrapId;
  name: string;
  desc: string;
  /** Color del símbolo que queda marcado en el suelo. */
  color: string;
}

export const TRAPS: Record<TrapId, TrapDef> = {
  pinchos: { id: 'pinchos', name: 'Trampa de pinchos', desc: 'Daña a quien la pisa.', color: '#c8c8d0' },
  veneno: { id: 'veneno', name: 'Trampa venenosa', desc: 'Envenena a quien la pisa.', color: '#7ad84a' },
  aturdidora: { id: 'aturdidora', name: 'Trampa aturdidora', desc: 'Aturde 2 turnos.', color: '#e8d040' },
  teletransporte: { id: 'teletransporte', name: 'Runa de teletransporte', desc: 'Envía a quien la pisa a otro lugar del piso.', color: '#b070ff' },
  hambre: { id: 'hambre', name: 'Trampa de hambre', desc: 'Pudre parte de las provisiones.', color: '#e8903a' },
  alarma: { id: 'alarma', name: 'Trampa de alarma', desc: 'Atrae a varios monstruos.', color: '#ff4a4a' },
  hoyo: { id: 'hoyo', name: 'Hoyo', desc: 'El líder cae al piso siguiente.', color: '#5a4a6a' },
  sello: { id: 'sello', name: 'Sello de energía', desc: 'Drena energía.', color: '#4aa8ff' },
  explosion: { id: 'explosion', name: 'Runa explosiva', desc: 'Estalla y daña a todo el grupo cercano.', color: '#ff6a2a' },
  debilidad: { id: 'debilidad', name: 'Trampa de debilidad', desc: 'Baja la defensa.', color: '#e070b0' },
};

export const ALL_TRAPS = Object.keys(TRAPS) as TrapId[];

export interface LockColor {
  id: string;
  name: string;
  color: string;
}

/** Como mucho 5 candados por piso, uno de cada color. */
export const LOCK_COLORS: LockColor[] = [
  { id: 'roja', name: 'roja', color: '#d83a3a' },
  { id: 'azul', name: 'azul', color: '#3a7ad8' },
  { id: 'verde', name: 'verde', color: '#3ac85a' },
  { id: 'amarilla', name: 'amarilla', color: '#e8c840' },
  { id: 'morada', name: 'morada', color: '#a05ad8' },
];

export const LOCK_BY_ID: Record<string, LockColor> = Object.fromEntries(LOCK_COLORS.map((c) => [c.id, c]));
