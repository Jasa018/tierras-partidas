export type Element = 'neutral' | 'fuego' | 'agua' | 'tierra' | 'viento' | 'luz' | 'sombra';

export const ELEMENTS: Record<Element, { name: string; color: string }> = {
  neutral: { name: 'Neutro', color: '#b8b0a8' },
  fuego: { name: 'Fuego', color: '#ff6a3d' },
  agua: { name: 'Agua', color: '#4aa8ff' },
  tierra: { name: 'Tierra', color: '#c49a52' },
  viento: { name: 'Viento', color: '#7be0a5' },
  luz: { name: 'Luz', color: '#ffe680' },
  sombra: { name: 'Sombra', color: '#a07cff' },
};

// Ciclo: Agua > Fuego > Viento > Tierra > Agua. Luz y Sombra se dañan mutuamente.
const STRONG: Partial<Record<Element, Element[]>> = {
  agua: ['fuego'],
  fuego: ['viento'],
  viento: ['tierra'],
  tierra: ['agua'],
  luz: ['sombra'],
  sombra: ['luz'],
};

export function elementMultiplier(atk: Element, def: Element): number {
  if (atk === 'neutral' || def === 'neutral') return 1;
  if (STRONG[atk]?.includes(def)) return 1.5;
  if (STRONG[def]?.includes(atk)) return 0.6;
  if (atk === def) return 0.75;
  return 1;
}

export function weaknessesOf(def: Element): Element[] {
  return (Object.keys(STRONG) as Element[]).filter((a) => elementMultiplier(a, def) > 1);
}
