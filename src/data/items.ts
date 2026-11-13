import type { Element } from './elements';
import type { StatusId } from './skills';
import { LOCK_COLORS } from './traps';

export type ItemKind = 'food' | 'heal' | 'sp' | 'cure' | 'throw' | 'escape' | 'revive' | 'raise' | 'map' | 'quest' | 'ingredient' | 'dish' | 'key' | 'stairkey' | 'material' | 'unknown' | 'fragment' | 'curse';

export interface ItemDef {
  id: string;
  name: string;
  desc: string;
  kind: ItemKind;
  price: number;
  sprite: string;
  value?: number;
  element?: Element;
  radius?: number;
  /** Platos: efectos sobre todo el grupo además de las provisiones (`value`). */
  partyHeal?: number;
  partySp?: number;
  partyStatus?: { id: StatusId; turns: number };
  cure?: boolean;
  /** Bombas: rompen grietas y murallas en su radio. */
  breaks?: boolean;
  /** Cebos: el monstruo al que alcanzan se los come (en vez de recibir daño) y le hacen efecto. */
  bait?: { status?: StatusId; turns?: number; stun?: number };
}

/** Objetos sin identificar: lo que pueden ser en realidad (se sabe al probarlos o en el tasador del gremio). */
export const UNKNOWN_TABLE: Record<string, { id: string; weight: number }[]> = {
  frasco_turbio: [{ id: 'pocion', weight: 3 }, { id: 'pocion_mayor', weight: 3 }, { id: 'elixir', weight: 3 }, { id: 'antidoto', weight: 2 }, { id: 'semilla_vida', weight: 1 }, { id: 'frasco_veneno', weight: 3 }],
  pergamino_sellado: [{ id: 'mapa_vidente', weight: 3 }, { id: 'orbe_retorno', weight: 2 }, { id: 'bomba', weight: 2 }, { id: 'lagrima_alba', weight: 1 }, { id: 'pergamino_maldito', weight: 3 }],
};
/** Lo que cobra el tasador del gremio por identificar cada objeto. */
export const APPRAISE_COST = 40;

const LIST: ItemDef[] = [
  { id: 'pan', name: 'Pan duro', desc: 'Recupera 25 de provisiones.', kind: 'food', price: 20, sprite: 'i_bread', value: 25 },
  { id: 'carne_seca', name: 'Carne seca', desc: 'Recupera 45 de provisiones.', kind: 'food', price: 45, sprite: 'i_meat', value: 45 },
  { id: 'racion', name: 'Ración de viaje', desc: 'Recupera 70 de provisiones.', kind: 'food', price: 80, sprite: 'i_ration', value: 70 },
  { id: 'pocion', name: 'Poción', desc: 'Recupera 25 de vida a un miembro.', kind: 'heal', price: 30, sprite: 'i_potion', value: 25 },
  { id: 'pocion_mayor', name: 'Poción mayor', desc: 'Recupera 75 de vida a un miembro.', kind: 'heal', price: 90, sprite: 'i_potion_big', value: 75 },
  { id: 'pocion_suprema', name: 'Poción suprema', desc: 'Recupera 160 de vida a un miembro.', kind: 'heal', price: 220, sprite: 'i_potion_big', value: 160 },
  { id: 'elixir_mayor', name: 'Elixir mayor', desc: 'Recupera 30 de energía a un miembro.', kind: 'sp', price: 160, sprite: 'i_elixir', value: 30 },
  { id: 'elixir', name: 'Elixir', desc: 'Recupera 12 de energía a un miembro.', kind: 'sp', price: 60, sprite: 'i_elixir', value: 12 },
  { id: 'antidoto', name: 'Hierba antídoto', desc: 'Cura el veneno de un miembro.', kind: 'cure', price: 15, sprite: 'i_herb', value: 0 },
  { id: 'piedra', name: 'Piedra afilada', desc: 'Se lanza en línea recta. Daño fijo.', kind: 'throw', price: 8, sprite: 'i_stone', value: 14 },
  { id: 'frasco_fuego', name: 'Frasco ígneo', desc: 'Al lanzarlo estalla en fuego a su alrededor.', kind: 'throw', price: 70, sprite: 'i_flask', value: 30, element: 'fuego', radius: 1 },
  { id: 'bomba', name: 'Bomba', desc: 'Se lanza hacia donde miras y estalla: daña a los enemigos cercanos y rompe grietas y murallas reforzadas.', kind: 'throw', price: 60, sprite: 'i_bomb', value: 35, radius: 1, breaks: true },
  // Preparados en el cuartel: mucho mejores que lo que se compra.
  { id: 'pocion_hierbas', name: 'Poción de hierbas', desc: 'Preparada en la cocina. Recupera 70 de vida a un miembro.', kind: 'heal', price: 70, sprite: 'i_potion_green', value: 70 },
  { id: 'tonico_raiz', name: 'Tónico de raíz', desc: 'Preparado en la cocina. Recupera 25 de energía a un miembro.', kind: 'sp', price: 80, sprite: 'i_tonic', value: 25 },
  { id: 'orbe_retorno', name: 'Orbe de retorno', desc: 'Sale de la mazmorra conservando lo obtenido.', kind: 'escape', price: 150, sprite: 'i_orb', value: 0 },
  // Muy rara: no se vende; solo aparece de vez en cuando en el suelo de las mazmorras difíciles.
  { id: 'lagrima_alba', name: 'Lágrima del alba', desc: 'Devuelve a un compañero caído junto al líder con la mitad de su vida, aunque cayera en otro piso. Muy rara: no se vende en ninguna tienda.', kind: 'raise', price: 400, sprite: 'i_tear', value: 0 },
  { id: 'semilla_vida', name: 'Semilla de vida', desc: 'Revive automáticamente a quien caiga.', kind: 'revive', price: 250, sprite: 'i_seed', value: 0 },
  { id: 'mapa_vidente', name: 'Mapa del vidente', desc: 'Revela el mapa del piso actual.', kind: 'map', price: 60, sprite: 'i_scroll', value: 0 },
  // Ingredientes: van a la bolsa de ingredientes y, al completar la mazmorra, a la despensa del cuartel.
  { id: 'seta', name: 'Seta del bosque', desc: 'Ingrediente. La sueltan los hongos pútridos.', kind: 'ingredient', price: 6, sprite: 'i_mushroom' },
  { id: 'carne_lobo', name: 'Carne de lobo', desc: 'Ingrediente. Dura, pero alimenta.', kind: 'ingredient', price: 8, sprite: 'i_meat' },
  { id: 'gel_limo', name: 'Gel de limo', desc: 'Ingrediente. Sorprendentemente nutritivo.', kind: 'ingredient', price: 5, sprite: 'i_gel' },
  { id: 'huevo_arana', name: 'Huevo de araña', desc: 'Ingrediente. Mejor no pensar mucho en ello.', kind: 'ingredient', price: 8, sprite: 'i_egg' },
  { id: 'pescado_cienaga', name: 'Pez de ciénaga', desc: 'Ingrediente. Lo llevan encima los ahogados.', kind: 'ingredient', price: 9, sprite: 'i_fish' },
  { id: 'hierba_silvestre', name: 'Hierba silvestre', desc: 'Ingrediente. Crece entre las grietas.', kind: 'ingredient', price: 4, sprite: 'i_herb' },
  { id: 'raiz_amarga', name: 'Raíz amarga', desc: 'Ingrediente. Purifica la sangre.', kind: 'ingredient', price: 6, sprite: 'i_root' },
  { id: 'sal_roca', name: 'Sal de roca', desc: 'Ingrediente. Conserva cualquier cosa.', kind: 'ingredient', price: 5, sprite: 'i_salt' },
  // Materiales: no ocupan bolsa; al salir de la mazmorra van al almacén de materiales del gremio. Sirven para mejorar equipo.
  { id: 'mineral_hierro', name: 'Mineral de hierro', desc: 'Material. Roca con vetas de hierro. Lo sueltan las gárgolas.', kind: 'material', price: 10, sprite: 'i_ore' },
  { id: 'cuero_bestia', name: 'Cuero de bestia', desc: 'Material. Piel curtida de lobos y murciélagos.', kind: 'material', price: 12, sprite: 'i_hide' },
  { id: 'hueso_viejo', name: 'Hueso viejo', desc: 'Material. Duro como la piedra. Lo dejan los esqueletos.', kind: 'material', price: 8, sprite: 'i_bone' },
  { id: 'seda_arana', name: 'Seda de araña', desc: 'Material. Fina y resistente. La dejan las arañas.', kind: 'material', price: 14, sprite: 'i_silk' },
  { id: 'esencia_sombra', name: 'Esencia sombría', desc: 'Material. Lo que queda de un espectro o un fuego fatuo.', kind: 'material', price: 25, sprite: 'i_essence' },
  // Materiales refinados en la Forja del gremio.
  { id: 'lingote_hierro', name: 'Lingote de hierro', desc: 'Material refinado en la Forja (3 minerales de hierro).', kind: 'material', price: 40, sprite: 'i_ingot' },
  { id: 'cuero_curtido', name: 'Cuero curtido', desc: 'Material refinado en la Forja (3 cueros de bestia).', kind: 'material', price: 45, sprite: 'i_leather' },
  { id: 'seda_tejida', name: 'Seda tejida', desc: 'Material refinado en la Forja (3 sedas de araña).', kind: 'material', price: 50, sprite: 'i_cloth' },
  { id: 'cristal_hondonada', name: 'Cristal de Hondonada', desc: 'Material raro. Late con un brillo rojo. Lo sueltan los jefes.', kind: 'material', price: 60, sprite: 'i_crystal' },
  // Platos de la cocina del cuartel.
  { id: 'guiso_setas', name: 'Guiso de setas', desc: '+70 provisiones y cura un 30% de vida a todo el grupo.', kind: 'dish', price: 60, sprite: 'i_bowl', value: 70, partyHeal: 0.3 },
  { id: 'asado_lobo', name: 'Asado de lobo', desc: '+100 provisiones y sube el ataque del grupo durante 15 turnos.', kind: 'dish', price: 80, sprite: 'i_meat', value: 100, partyStatus: { id: 'atk_up', turns: 15 } },
  { id: 'gelatina_limo', name: 'Gelatina de limo', desc: '+40 provisiones y +10 de energía a todo el grupo.', kind: 'dish', price: 50, sprite: 'i_gel', value: 40, partySp: 10 },
  { id: 'sopa_raiz', name: 'Sopa de raíz', desc: '+40 provisiones, cura el veneno y un 15% de vida al grupo.', kind: 'dish', price: 40, sprite: 'i_bowl_green', value: 40, partyHeal: 0.15, cure: true },
  { id: 'tortilla_arana', name: 'Tortilla de araña', desc: '+60 provisiones y sube la defensa del grupo durante 15 turnos.', kind: 'dish', price: 60, sprite: 'i_egg', value: 60, partyStatus: { id: 'def_up', turns: 15 } },
  { id: 'pescado_ahumado', name: 'Pescado ahumado', desc: 'Llena las provisiones y cura un 20% de vida al grupo.', kind: 'dish', price: 90, sprite: 'i_fish', value: 100, partyHeal: 0.2 },
  { id: 'banquete', name: 'Banquete de la expedición', desc: 'Llena las provisiones, cura la mitad de la vida y +15 de energía al grupo.', kind: 'dish', price: 200, sprite: 'i_bowl', value: 100, partyHeal: 0.5, partySp: 15 },
  // Objetos de misión: no ocupan bolsa, solo suman progreso.
  { id: 'musgo_palido', name: 'Musgo pálido', desc: 'Musgo que solo crece donde gotea la Hondonada.', kind: 'quest', price: 0, sprite: 'i_moss' },
  // Objetos de las secundarias generadas (uno por región; solo cuentan en la mazmorra de su misión).
  { id: 'carta_perdida', name: 'Carta perdida', desc: 'Una carta que nunca llegó a su destino. El sello sigue intacto.', kind: 'quest', price: 0, sprite: 'i_scroll' },
  { id: 'farol_pantano', name: 'Farol del pantano', desc: 'Un farol de barquero, apagado. Alguien lo echará de menos.', kind: 'quest', price: 0, sprite: 'i_flask' },
  { id: 'cantimplora', name: 'Cantimplora de caravana', desc: 'Lleva grabado el nombre de su dueño. Vacía.', kind: 'quest', price: 0, sprite: 'i_flask' },
  { id: 'insignia_centinela', name: 'Insignia de centinela', desc: 'La insignia de un centinela de las cumbres. Fría como el hielo.', kind: 'quest', price: 0, sprite: 'i_ore' },
  { id: 'colgante_familia', name: 'Colgante de familia', desc: 'Un colgante con un retrato borrado. Alguien lo busca.', kind: 'quest', price: 0, sprite: 'i_fragment' },
  { id: 'cofre_naufragio', name: 'Cofrecillo del naufragio', desc: 'Un cofrecillo empapado, cerrado con llave.', kind: 'quest', price: 0, sprite: 'i_sealed' },
  { id: 'piedra_azufre', name: 'Piedra de azufre', desc: 'Amarilla y caliente. Los herreros de Brasa Quieta la usan para templar.', kind: 'quest', price: 0, sprite: 'i_ore' },
  { id: 'pluma_dorada', name: 'Pluma dorada', desc: 'Una pluma de un ángel del Coro. Brilla sola.', kind: 'quest', price: 0, sprite: 'i_silk' },
  { id: 'estandarte_legion', name: 'Estandarte de la Legión', desc: 'Un estandarte de la Legión de la Ceniza. Quemarlos devuelve el ánimo a las ciudades liberadas.', kind: 'quest', price: 0, sprite: 'i_cloth' },
  { id: 'flor_pantano', name: 'Flor de pantano', desc: 'Una flor blanca que solo abre sobre el agua quieta.', kind: 'quest', price: 0, sprite: 'i_herb' },
  { id: 'junco_dorado', name: 'Junco dorado', desc: 'Un junco que brilla como el latón. Las cesteras lo pagan bien.', kind: 'quest', price: 0, sprite: 'i_herb' },
  { id: 'flor_oasis', name: 'Flor del oasis', desc: 'Roja como las palmeras. Cura la fiebre del desierto.', kind: 'quest', price: 0, sprite: 'i_herb' },
  { id: 'veta_oro', name: 'Veta de oro', desc: 'Roca con hilos de oro. La mina vivía de esto.', kind: 'quest', price: 0, sprite: 'i_ore' },
  { id: 'eslabon_hielo', name: 'Eslabón helado', desc: 'Un eslabón de las cadenas que sujetan las casas de Pico Escarcha.', kind: 'quest', price: 0, sprite: 'i_ore' },
  { id: 'piel_blanca', name: 'Piel blanca', desc: 'Piel de lobo blanco, de uno que murió de viejo.', kind: 'quest', price: 0, sprite: 'i_hide' },
  { id: 'raiz_ceniza', name: 'Raíz de ceniza', desc: 'Lo único comestible que crece en la Tierra Maldita.', kind: 'quest', price: 0, sprite: 'i_root' },
  { id: 'hueso_tallado', name: 'Hueso tallado', desc: 'Un hueso con letras grabadas: la escritura de los esqueletos.', kind: 'quest', price: 0, sprite: 'i_bone' },
  { id: 'perla_negra', name: 'Perla negra', desc: 'Una perla del arrecife. Los contrabandistas matan por ellas.', kind: 'quest', price: 0, sprite: 'i_gel' },
  { id: 'alga_luz', name: 'Alga de luz', desc: 'Brilla en la oscuridad. Las brujas de Isla Gaviota la tejen.', kind: 'quest', price: 0, sprite: 'i_moss' },
  { id: 'brasa_eterna', name: 'Brasa eterna', desc: 'Una brasa que no se apaga nunca. Calienta Brasa Quieta.', kind: 'quest', price: 0, sprite: 'i_crystal' },
  { id: 'pluma_blanca', name: 'Pluma blanca', desc: 'Una pluma de ángel caída en el camino. Tibia.', kind: 'quest', price: 0, sprite: 'i_silk' },
  { id: 'recuerdo_vado', name: 'Recuerdo de Vado', desc: 'Algo que fue de alguien: un juguete, un cazo, una carta quemada.', kind: 'quest', price: 0, sprite: 'i_fragment' },
  { id: 'trigo_negro', name: 'Espiga negra', desc: 'Trigo que creció junto a una grieta. Hay que quemarlo.', kind: 'quest', price: 0, sprite: 'i_herb' },
  { id: 'tablilla_antigua', name: 'Tablilla antigua', desc: 'Escritura de antes de la Fractura. Nadie sabe leerla... casi nadie.', kind: 'quest', price: 0, sprite: 'i_scroll' },
  { id: 'cristal_negro', name: 'Cristal de hielo negro', desc: 'Hielo que no se derrite ni al fuego.', kind: 'quest', price: 0, sprite: 'i_crystal' },
  { id: 'martillo_padre', name: 'Martillo del padre de Bram', desc: 'Un martillo de forja chamuscado. En el mango pone «Para Bram».', kind: 'quest', price: 0, sprite: 'i_ingot' },
  { id: 'pagina_archivo', name: 'Página del archivo', desc: 'Una página del primer archivo de Osario, arrancada y perdida en la guerra.', kind: 'quest', price: 0, sprite: 'i_scroll' },
  { id: 'esquirla_cadena', name: 'Esquirla de cadena de luz', desc: 'Un trozo de las cadenas con que el Coro ataba a los demonios.', kind: 'quest', price: 0, sprite: 'i_essence' },
];

// Llaves de candado: solo sirven en el piso donde aparecen.
// Malos para uno mismo, buenos para lanzar: el monstruo que alcanzan se los come.
LIST.push(
  { id: 'carne_podrida', name: 'Carne podrida', desc: 'Huele fatal. Lánzala: el monstruo al que alcance se la come, se envenena y se queda 2 turnos sin hacer nada.', kind: 'throw', price: 6, sprite: 'i_rotten', bait: { status: 'veneno', turns: 6, stun: 2 } },
  { id: 'seta_dudosa', name: 'Seta dudosa', desc: 'Mejor no comerla. Lánzala: el monstruo que se la coma se queda dormido 4 turnos.', kind: 'throw', price: 6, sprite: 'i_shroom_bad', bait: { stun: 4 } },
  { id: 'frasco_veneno', name: 'Veneno embotellado', desc: 'Lánzalo: el monstruo al que alcance se lo traga y queda muy envenenado.', kind: 'throw', price: 25, sprite: 'i_venom', bait: { status: 'veneno', turns: 12 } },
  { id: 'pergamino_maldito', name: 'Pergamino maldito', desc: 'Al leerlo atrae monstruos a tu alrededor. Útil para entrenar... o para morir.', kind: 'curse', price: 10, sprite: 'i_scroll_bad' },
  { id: 'frasco_turbio', name: 'Frasco turbio', desc: 'Sin identificar. Puede ser una buena poción... o veneno. Pruébalo a tu riesgo o llévalo al tasador del gremio.', kind: 'unknown', price: 30, sprite: 'i_murky' },
  { id: 'pergamino_sellado', name: 'Pergamino sellado', desc: 'Sin identificar. Puede ser un mapa, un orbe... o una maldición. Léelo a tu riesgo o llévalo al tasador del gremio.', kind: 'unknown', price: 30, sprite: 'i_sealed' },
  { id: 'fragmento_sello', name: 'Fragmento de sello', desc: 'Un pedazo del sello de las escaleras de este piso.', kind: 'fragment', price: 0, sprite: 'i_fragment' },
);
// Condición «llave» de un piso: al recogerla se abren sus escaleras (no va a la bolsa).
LIST.push({ id: 'llave_escalera', name: 'Llave de la escalera', desc: 'Abre el cerrojo de las escaleras de este piso.', kind: 'stairkey', price: 0, sprite: 'i_key_stairs' });
for (const c of LOCK_COLORS) LIST.push({ id: `llave_${c.id}`, name: `Llave ${c.name}`, desc: `Abre las puertas con candado ${c.name} de este piso.`, kind: 'key', price: 0, sprite: `i_key_${c.id}` });

export const ITEMS: Record<string, ItemDef> = Object.fromEntries(LIST.map((i) => [i.id, i]));
