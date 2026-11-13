/** Mejoras del cuartel del gremio y recetas de cocina. */

export interface UpgradeDef {
  id: string;
  name: string;
  levels: { cost: number; desc: string }[];
}

export const UPGRADES: Record<string, UpgradeDef> = {
  cocina: { id: 'cocina', name: 'Cocina', levels: [
    { cost: 250, desc: 'Permite cocinar platos con los ingredientes que traéis de las mazmorras.' },
    { cost: 700, desc: 'Recetas avanzadas: pescado ahumado y banquete de la expedición.' },
  ] },
  entrenamiento: { id: 'entrenamiento', name: 'Sala de entrenamiento', levels: [
    { cost: 250, desc: 'Permite recuperar habilidades olvidadas y elegir las 4 que lleva cada miembro.' },
    { cost: 700, desc: 'Los miembros en reserva ganan el 60% de la experiencia (antes 30%).' },
  ] },
  biblioteca: { id: 'biblioteca', name: 'Biblioteca', levels: [
    { cost: 200, desc: 'Monstruario: ficha completa de cada monstruo derrotado (elemento, debilidades, estadísticas y botín).' },
  ] },
  bolsa: { id: 'bolsa', name: 'Bolsa de expedición', levels: [
    { cost: 300, desc: 'La bolsa pasa de 24 a 32 huecos, la de ingredientes de 10 a 14 y la de materiales de 12 a 18.' },
    { cost: 900, desc: 'La bolsa pasa a 40 huecos, la de ingredientes a 18 y la de materiales a 24.' },
  ] },
  forja: { id: 'forja', name: 'Forja', levels: [
    { cost: 300, desc: 'Refina materiales (lingotes, cuero curtido, seda tejida) y fabrica bombas.' },
  ] },
};

export interface ForgeRecipeDef {
  id: string;
  result: string;
  qty: number;
  materials: Record<string, number>;
}

/** Recetas de la Forja del gremio: solo usan materiales. */
export const FORGE_RECIPES: ForgeRecipeDef[] = [
  { id: 'f_bomba', result: 'bomba', qty: 2, materials: { mineral_hierro: 2, hueso_viejo: 1 } },
  { id: 'f_lingote', result: 'lingote_hierro', qty: 1, materials: { mineral_hierro: 3 } },
  { id: 'f_cuero', result: 'cuero_curtido', qty: 1, materials: { cuero_bestia: 3 } },
  { id: 'f_seda', result: 'seda_tejida', qty: 1, materials: { seda_arana: 3 } },
];

export interface RecipeDef {
  id: string;
  result: string;
  ingredients: Record<string, number>;
  /** Nivel de cocina necesario. */
  level: number;
}

export const RECIPES: RecipeDef[] = [
  { id: 'r_guiso', result: 'guiso_setas', ingredients: { seta: 2, hierba_silvestre: 1 }, level: 1 },
  { id: 'r_asado', result: 'asado_lobo', ingredients: { carne_lobo: 2, sal_roca: 1 }, level: 1 },
  { id: 'r_gelatina', result: 'gelatina_limo', ingredients: { gel_limo: 2, hierba_silvestre: 1 }, level: 1 },
  { id: 'r_sopa', result: 'sopa_raiz', ingredients: { raiz_amarga: 1, hierba_silvestre: 1 }, level: 1 },
  { id: 'r_tortilla', result: 'tortilla_arana', ingredients: { huevo_arana: 2, sal_roca: 1 }, level: 1 },
  { id: 'r_pocion', result: 'pocion_hierbas', ingredients: { hierba_silvestre: 2, gel_limo: 1 }, level: 1 },
  { id: 'r_tonico', result: 'tonico_raiz', ingredients: { raiz_amarga: 2, seta: 1 }, level: 1 },
  { id: 'r_pescado', result: 'pescado_ahumado', ingredients: { pescado_cienaga: 2, sal_roca: 1 }, level: 2 },
  { id: 'r_banquete', result: 'banquete', ingredients: { carne_lobo: 1, seta: 1, pescado_cienaga: 1, raiz_amarga: 1, sal_roca: 1 }, level: 2 },
];

/** Experiencia que ganan los miembros en reserva según la sala de entrenamiento. */
export const BENCH_XP = [0.3, 0.3, 0.6];
export const BAG_SIZES = [24, 32, 40];
export const POUCH_SIZES = [10, 14, 18];
export const MATERIAL_BAG_SIZES = [12, 18, 24];
