import type { Stats } from './characters';
import type { Element } from './elements';
import type { StatusId } from './skills';

export type Slot = 'weapon' | 'armor' | 'accessory';
export type WeaponKind = 'espada' | 'martillo' | 'baston' | 'arco' | 'daga' | 'lanza';

export const SLOT_NAMES: Record<Slot, string> = { weapon: 'Arma', armor: 'Armadura', accessory: 'Accesorio' };
export const WEAPON_NAMES: Record<WeaponKind, string> = { espada: 'Espada', martillo: 'Martillo', baston: 'Bastón', arco: 'Arco', daga: 'Daga', lanza: 'Lanza' };

export interface EquipDef {
  id: string;
  name: string;
  slot: Slot;
  /** Solo armas: qué miembros pueden usarla (según su tipo de arma). */
  kind?: WeaponKind;
  desc: string;
  price: number;
  sprite: string;
  bonus: Partial<Stats>;
  /** Reduce el daño recibido de ese elemento (0.3 = -30%). */
  resist?: Partial<Record<Element, number>>;
  /** Aumenta el daño de las habilidades de ese elemento (0.2 = +20%). */
  boost?: Partial<Record<Element, number>>;
  immune?: StatusId[];
  /** Piezas mejoradas: id de la pieza original y nivel de mejora (+1, +2). */
  base?: string;
  plus?: number;
}

const LIST: EquipDef[] = [
  // ---------- Armas ----------
  { id: 'espada_hierro', name: 'Espada de hierro', slot: 'weapon', kind: 'espada', desc: 'Una hoja sencilla y fiable.', price: 60, sprite: 'e_sword', bonus: { atk: 3 } },
  { id: 'espada_acero', name: 'Espada de acero', slot: 'weapon', kind: 'espada', desc: 'Acero templado del Bastión.', price: 180, sprite: 'e_sword', bonus: { atk: 7 } },
  { id: 'hoja_brasa', name: 'Hoja de brasa', slot: 'weapon', kind: 'espada', desc: 'Forjada con ascuas de la Hondonada. Potencia el fuego.', price: 280, sprite: 'e_sword_fire', bonus: { atk: 6 }, boost: { fuego: 0.2 } },
  { id: 'martillo_forja', name: 'Martillo de forja', slot: 'weapon', kind: 'martillo', desc: 'El martillo de un aprendiz. Pesa más de lo que parece.', price: 90, sprite: 'e_hammer', bonus: { atk: 5 } },
  { id: 'martillo_pesado', name: 'Martillo de guerra', slot: 'weapon', kind: 'martillo', desc: 'Golpes enormes, a costa de la defensa.', price: 240, sprite: 'e_hammer', bonus: { atk: 11, def: -2 } },
  { id: 'baston_roble', name: 'Bastón de roble', slot: 'weapon', kind: 'baston', desc: 'Canaliza bien la magia.', price: 60, sprite: 'e_staff', bonus: { mag: 3, sp: 3 } },
  { id: 'baston_luz', name: 'Bastón del alba', slot: 'weapon', kind: 'baston', desc: 'Tallado en un santuario. Potencia la luz.', price: 230, sprite: 'e_staff_light', bonus: { mag: 6, res: 2 }, boost: { luz: 0.15 } },
  { id: 'arco_corto', name: 'Arco corto', slot: 'weapon', kind: 'arco', desc: 'Ligero y preciso.', price: 80, sprite: 'e_bow', bonus: { atk: 4 } },
  { id: 'arco_compuesto', name: 'Arco compuesto', slot: 'weapon', kind: 'arco', desc: 'Más tensión, más alcance. Potencia el viento.', price: 240, sprite: 'e_bow', bonus: { atk: 8 }, boost: { viento: 0.1 } },
  { id: 'daga_filo', name: 'Daga de filo negro', slot: 'weapon', kind: 'daga', desc: 'Rápida y traicionera.', price: 70, sprite: 'e_dagger', bonus: { atk: 4 } },
  { id: 'lanza_guardia', name: 'Lanza de la guardia', slot: 'weapon', kind: 'lanza', desc: 'Arma reglamentaria de las ciudades libres.', price: 100, sprite: 'e_spear', bonus: { atk: 5, def: 1 } },
  // ---------- Armaduras ----------
  { id: 'jubon_cuero', name: 'Jubón de cuero', slot: 'armor', desc: 'Protección básica.', price: 50, sprite: 'e_armor_leather', bonus: { def: 3 } },
  { id: 'tunica_sanador', name: 'Túnica de sanador', slot: 'armor', desc: 'Tela bendecida. Más energía y resistencia mágica.', price: 80, sprite: 'e_robe', bonus: { res: 4, sp: 5 } },
  { id: 'cota_malla', name: 'Cota de malla', slot: 'armor', desc: 'Anillas de hierro entrelazadas.', price: 200, sprite: 'e_armor_mail', bonus: { def: 7, hp: 10 } },
  { id: 'manto_sombras', name: 'Manto de ceniza', slot: 'armor', desc: 'Tejido con ceniza de una Hondonada sellada. Resiste la sombra.', price: 190, sprite: 'e_robe_dark', bonus: { def: 3, res: 3 }, resist: { sombra: 0.3 } },
  { id: 'coraza_ignea', name: 'Coraza ignífuga', slot: 'armor', desc: 'Placas tratadas con sal de roca. Resiste el fuego.', price: 190, sprite: 'e_armor_mail', bonus: { def: 5 }, resist: { fuego: 0.3 } },
  { id: 'armadura_placas', name: 'Armadura de placas', slot: 'armor', desc: 'La mejor protección que se puede comprar.', price: 420, sprite: 'e_armor_plate', bonus: { def: 12, hp: 20 } },
  // ---------- Accesorios ----------
  { id: 'anillo_vigor', name: 'Anillo de vigor', slot: 'accessory', desc: 'Más vida máxima.', price: 120, sprite: 'e_ring', bonus: { hp: 15 } },
  { id: 'talisman_antiveneno', name: 'Talismán de hierbas', slot: 'accessory', desc: 'Inmune al veneno.', price: 100, sprite: 'e_amulet_green', bonus: {}, immune: ['veneno'] },
  { id: 'amuleto_luz', name: 'Amuleto del alba', slot: 'accessory', desc: 'Resiste la sombra.', price: 150, sprite: 'e_amulet', bonus: { res: 1 }, resist: { sombra: 0.25 } },
  { id: 'colgante_agua', name: 'Colgante de río', slot: 'accessory', desc: 'Resiste el agua.', price: 140, sprite: 'e_amulet_blue', bonus: {}, resist: { agua: 0.3 } },
  { id: 'piedra_tierra', name: 'Piedra de cantera', slot: 'accessory', desc: 'Resiste la tierra.', price: 140, sprite: 'e_amulet_brown', bonus: {}, resist: { tierra: 0.3 } },
  { id: 'broche_viento', name: 'Broche de pluma', slot: 'accessory', desc: 'Resiste el viento.', price: 140, sprite: 'e_amulet_green', bonus: {}, resist: { viento: 0.3 } },
  { id: 'anillo_firmeza', name: 'Anillo de firmeza', slot: 'accessory', desc: 'No te pueden aturdir.', price: 160, sprite: 'e_ring', bonus: { def: 1 }, immune: ['aturdido'] },
  { id: 'anillo_marea', name: 'Anillo de marea', slot: 'accessory', desc: 'Potencia el agua.', price: 200, sprite: 'e_ring_blue', bonus: { mag: 2 }, boost: { agua: 0.2 } },
  // ---------- Actos 3-4: desierto y nieves ----------
  { id: 'cimitarra_sol', name: 'Cimitarra de Solmarena', slot: 'weapon', kind: 'espada', desc: 'Curva y ligera, forjada para la arena.', price: 620, sprite: 'e_sword', bonus: { atk: 11 } },
  { id: 'maza_cantera', name: 'Maza de cantera', slot: 'weapon', kind: 'martillo', desc: 'Un bloque de piedra con mango. No hay escudo que la pare.', price: 680, sprite: 'e_hammer', bonus: { atk: 15, def: -2 } },
  { id: 'baston_oasis', name: 'Bastón del oasis', slot: 'weapon', kind: 'baston', desc: 'Madera de palma que nunca se seca.', price: 600, sprite: 'e_staff_light', bonus: { mag: 10, sp: 5 } },
  { id: 'arco_duna', name: 'Arco de las dunas', slot: 'weapon', kind: 'arco', desc: 'Cuerno y tendón. Dispara lejos y fuerte.', price: 640, sprite: 'e_bow', bonus: { atk: 12 } },
  { id: 'aguijon', name: 'Aguijón', slot: 'weapon', kind: 'daga', desc: 'La púa de una reina de las arenas, con mango.', price: 580, sprite: 'e_dagger', bonus: { atk: 9, mag: 2 } },
  { id: 'lanza_albar', name: 'Lanza de Albar', slot: 'weapon', kind: 'lanza', desc: 'La de los centinelas de las cumbres.', price: 640, sprite: 'e_spear', bonus: { atk: 10, def: 2 } },
  { id: 'coraza_arena', name: 'Coraza de arena', slot: 'armor', desc: 'Placas claras que no queman al sol.', price: 700, sprite: 'e_armor_plate', bonus: { def: 15, hp: 30 } },
  { id: 'pelliza_lobo', name: 'Pelliza de lobo blanco', slot: 'armor', desc: 'Abriga y protege. Resiste el viento.', price: 620, sprite: 'e_armor_leather', bonus: { def: 10, res: 5 }, resist: { viento: 0.2 } },
  { id: 'tunica_escarcha', name: 'Túnica de escarcha', slot: 'armor', desc: 'Tejida en Fuerte Albar. Resiste el agua.', price: 620, sprite: 'e_robe', bonus: { res: 9, sp: 8 }, resist: { agua: 0.2 } },
  { id: 'anillo_sol', name: 'Anillo del sol', slot: 'accessory', desc: 'Calienta el pulso. Ataque y magia.', price: 520, sprite: 'e_ring', bonus: { atk: 3, mag: 3 } },
  { id: 'amuleto_hielo', name: 'Amuleto de hielo negro', slot: 'accessory', desc: 'Frío al tacto. Resiste mucho el agua.', price: 480, sprite: 'e_amulet_blue', bonus: { res: 2 }, resist: { agua: 0.35 } },
  // ---------- Actos 5-6: tierra maldita y mar ----------
  { id: 'espada_hueso', name: 'Espada de hueso negro', slot: 'weapon', kind: 'espada', desc: 'De la armería de Osario. Más dura que el acero.', price: 1300, sprite: 'e_sword', bonus: { atk: 16 } },
  { id: 'martillo_osario', name: 'Martillo de Osario', slot: 'weapon', kind: 'martillo', desc: 'Lo usaban para levantar las murallas de hueso.', price: 1400, sprite: 'e_hammer', bonus: { atk: 21, def: -3 } },
  { id: 'baston_coral', name: 'Bastón de coral', slot: 'weapon', kind: 'baston', desc: 'Coral rojo del arrecife. Canta cuando hay magia cerca.', price: 1300, sprite: 'e_staff', bonus: { mag: 15, sp: 8 } },
  { id: 'arco_coral', name: 'Arco de coral', slot: 'weapon', kind: 'arco', desc: 'Flexible como una ola.', price: 1350, sprite: 'e_bow', bonus: { atk: 17 }, boost: { viento: 0.1 } },
  { id: 'daga_marea', name: 'Daga de marea', slot: 'weapon', kind: 'daga', desc: 'Siempre húmeda. Corta como el agua.', price: 1250, sprite: 'e_dagger', bonus: { atk: 13, mag: 3 } },
  { id: 'tridente', name: 'Tridente del puerto', slot: 'weapon', kind: 'lanza', desc: 'Tres puntas, tres veces más miedo.', price: 1350, sprite: 'e_spear', bonus: { atk: 15, def: 3 } },
  { id: 'coraza_coral', name: 'Coraza de coral', slot: 'armor', desc: 'Pesada y casi irrompible.', price: 1500, sprite: 'e_armor_plate', bonus: { def: 20, hp: 45 } },
  { id: 'manto_marea', name: 'Manto de marea', slot: 'armor', desc: 'Algas tejidas por las brujas de Isla Gaviota.', price: 1300, sprite: 'e_robe', bonus: { res: 13, sp: 10, def: 4 } },
  { id: 'anillo_osario', name: 'Anillo de Osario', slot: 'accessory', desc: 'Un anillo de hueso que guarda el calor de la vida.', price: 1100, sprite: 'e_ring', bonus: { hp: 40, def: 2 } },
  { id: 'perla_abismo', name: 'Perla del abismo', slot: 'accessory', desc: 'Negra y tibia. Potencia el agua y la magia.', price: 1200, sprite: 'e_amulet_blue', bonus: { mag: 5 }, boost: { agua: 0.15 } },
  // ---------- Actos 7-8: Inframundo y Cielo ----------
  { id: 'hoja_ocaso', name: 'Hoja del ocaso', slot: 'weapon', kind: 'espada', desc: 'Forjada por demonios desertores en Brasa Quieta.', price: 2600, sprite: 'e_sword_fire', bonus: { atk: 22 }, boost: { fuego: 0.1 } },
  { id: 'martillo_dis', name: 'Martillo de Dis', slot: 'weapon', kind: 'martillo', desc: 'Pesa lo que pesa una culpa.', price: 2800, sprite: 'e_hammer', bonus: { atk: 28, def: -3 } },
  { id: 'baston_serafin', name: 'Bastón del serafín', slot: 'weapon', kind: 'baston', desc: 'Una pluma de ángel petrificada. Potencia la luz.', price: 2600, sprite: 'e_staff_light', bonus: { mag: 21, sp: 12 }, boost: { luz: 0.15 } },
  { id: 'arco_pluma', name: 'Arco de plumas caídas', slot: 'weapon', kind: 'arco', desc: 'Tensado con el cabello de un ángel sin alas.', price: 2700, sprite: 'e_bow', bonus: { atk: 23 }, boost: { viento: 0.15 } },
  { id: 'daga_ceniza', name: 'Daga de ceniza', slot: 'weapon', kind: 'daga', desc: 'Nunca se enfría.', price: 2500, sprite: 'e_dagger', bonus: { atk: 18, mag: 4 } },
  { id: 'lanza_dis', name: 'Lanza de la Legión', slot: 'weapon', kind: 'lanza', desc: 'La de los capitanes de Dis. Potencia la sombra.', price: 2700, sprite: 'e_spear', bonus: { atk: 21, def: 4 }, boost: { sombra: 0.1 } },
  { id: 'armadura_dis', name: 'Armadura de Dis', slot: 'armor', desc: 'Placas negras de los capitanes. Resiste el fuego.', price: 3000, sprite: 'e_armor_plate', bonus: { def: 27, hp: 60 }, resist: { fuego: 0.2 } },
  { id: 'tunica_coro', name: 'Túnica del Coro', slot: 'armor', desc: 'Blanca, sin una mancha. Resiste la luz.', price: 2800, sprite: 'e_robe', bonus: { res: 18, sp: 14, def: 6 }, resist: { luz: 0.2 } },
  { id: 'anillo_rey', name: 'Anillo del Rey Demonio', slot: 'accessory', desc: 'Asmodar lo llevaba en el pulgar.', price: 2400, sprite: 'e_ring', bonus: { atk: 5, mag: 5, hp: 20 } },
  { id: 'pluma_caida', name: 'Pluma caída', slot: 'accessory', desc: 'De las alas que le cortaron a alguien. Resiste la luz.', price: 2200, sprite: 'e_amulet', bonus: { res: 3 }, resist: { luz: 0.3 } },
  // ---------- Recuerdos: recompensa de la misión personal de cada compañero ----------
  { id: 'recuerdo_bram', name: 'Brasa de la forja de Vado', slot: 'accessory', desc: 'Del fuego que encendió el padre de Bram. Ataque y fuego.', price: 0, sprite: 'e_amulet_red', bonus: { atk: 5, hp: 20 }, boost: { fuego: 0.15 } },
  { id: 'recuerdo_lysa', name: 'Rosario del santuario', slot: 'accessory', desc: 'El que Lysa rezaba antes de recordar. Resistencia y luz.', price: 0, sprite: 'e_amulet', bonus: { res: 5, sp: 6 }, boost: { luz: 0.15 } },
  { id: 'recuerdo_kaela', name: 'Colmillo blanco', slot: 'accessory', desc: 'El trofeo que su maestro nunca cazó. Ataque y viento.', price: 0, sprite: 'e_amulet_green', bonus: { atk: 5 }, boost: { viento: 0.15 } },
  { id: 'recuerdo_odric', name: 'Lente del archivero', slot: 'accessory', desc: 'Para leer lo que nadie lee. Magia y agua.', price: 0, sprite: 'e_amulet_blue', bonus: { mag: 6 }, boost: { agua: 0.15 } },
  { id: 'recuerdo_pip', name: 'Moneda de la suerte', slot: 'accessory', desc: 'La primera que Pip robó. Nunca la ha gastado.', price: 0, sprite: 'e_ring', bonus: { atk: 3, def: 3, hp: 25 } },
  { id: 'recuerdo_seren', name: 'Estandarte de la capitana', slot: 'accessory', desc: 'El de su ejército, recuperado. Defensa y tierra.', price: 0, sprite: 'e_amulet_brown', bonus: { def: 6, hp: 30 }, resist: { tierra: 0.2 } },
  { id: 'recuerdo_vael', name: 'Cadena rota', slot: 'accessory', desc: 'Un eslabón de luz partido en dos. Magia, sombra y resistencia a la luz.', price: 0, sprite: 'e_amulet_red', bonus: { mag: 5 }, boost: { sombra: 0.15 }, resist: { luz: 0.2 } },
  { id: 'pluma_hondonada', name: 'Pluma del Guardián', slot: 'accessory', desc: 'Arrancada al Guardián Hueco. Ataque, magia y resistencia a la sombra.', price: 0, sprite: 'e_amulet_red', bonus: { atk: 3, mag: 3 }, resist: { sombra: 0.2 } },
];

/** Nivel máximo de mejora en la herrería. */
export const MAX_PLUS = 2;

/** Materiales para cada nivel de mejora, por tipo de pieza (índice 0 = para llegar a +1). */
export const UPGRADE_MATS: Record<Slot, Record<string, number>[]> = {
  // +1 con materiales en bruto; +2 con materiales refinados en la Forja del gremio.
  weapon: [{ mineral_hierro: 3, hueso_viejo: 1 }, { lingote_hierro: 2, esencia_sombra: 1, cristal_hondonada: 1 }],
  armor: [{ cuero_bestia: 2, mineral_hierro: 2 }, { cuero_curtido: 2, lingote_hierro: 1, cristal_hondonada: 1 }],
  accessory: [{ seda_arana: 2, hueso_viejo: 1 }, { seda_tejida: 2, esencia_sombra: 1, cristal_hondonada: 1 }],
};

/** Versión mejorada: cada estadística positiva sube ~30% por nivel (mín. 1); resistencias y potenciadores +5%. */
function plusDef(b: EquipDef, plus: number): EquipDef {
  const bonus: Partial<Stats> = { ...b.bonus };
  const pos = (Object.entries(b.bonus) as [keyof Stats, number][]).filter(([, v]) => v > 0);
  for (const [k, v] of pos) bonus[k] = v + plus * Math.max(1, Math.round(v * 0.3));
  const grow = <T extends string>(o?: Partial<Record<T, number>>) => o && (Object.fromEntries(Object.entries(o).map(([e, v]) => [e, Math.round(((v as number) + 0.05 * plus) * 100) / 100])) as Partial<Record<T, number>>);
  // Piezas sin estadísticas que mejorar (p. ej. el talismán): ganan vida.
  if (!pos.length && !b.resist && !b.boost) bonus.hp = (bonus.hp ?? 0) + 5 * plus;
  return { ...b, id: `${b.id}+${plus}`, name: `${b.name} +${plus}`, bonus, resist: grow(b.resist), boost: grow(b.boost), price: Math.round(b.price * (1 + 0.5 * plus)), base: b.id, plus };
}

export const EQUIPMENT: Record<string, EquipDef> = Object.fromEntries(LIST.flatMap((e) => [e, ...Array.from({ length: MAX_PLUS }, (_, i) => plusDef(e, i + 1))]).map((e) => [e.id, e]));

/** Siguiente mejora de una pieza y lo que cuesta, o null si ya está al máximo. */
export function nextUpgrade(e: EquipDef): { to: EquipDef; gold: number; mats: Record<string, number> } | null {
  const plus = e.plus ?? 0;
  if (plus >= MAX_PLUS) return null;
  const base = EQUIPMENT[e.base ?? e.id];
  const gold = Math.max(30 * (plus + 1), Math.ceil((base.price * 0.5 * (plus + 1)) / 10) * 10);
  return { to: EQUIPMENT[`${base.id}+${plus + 1}`], gold, mats: UPGRADE_MATS[e.slot][plus] };
}
