import type { Element } from './elements';

export type StatusId = 'veneno' | 'quemado' | 'atk_up' | 'def_up' | 'def_down' | 'prisa' | 'provocar' | 'aturdido';

export const STATUSES: Record<StatusId, { name: string; color: string; short: string }> = {
  veneno: { name: 'Veneno', color: '#9be36b', short: 'VEN' },
  quemado: { name: 'Quemadura', color: '#ff6a3d', short: 'QUE' },
  atk_up: { name: 'Ataque +', color: '#ff8a5c', short: 'ATQ+' },
  def_up: { name: 'Defensa +', color: '#7fb2ff', short: 'DEF+' },
  def_down: { name: 'Defensa -', color: '#d07a7a', short: 'DEF-' },
  prisa: { name: 'Prisa', color: '#ffe27a', short: 'PRI' },
  provocar: { name: 'Provocación', color: '#ff5a5a', short: 'PROV' },
  aturdido: { name: 'Aturdido', color: '#d0d0d0', short: 'ATU' },
};

export type SkillKind = 'phys' | 'mag' | 'heal' | 'buff' | 'debuff';
/**
 * front: casilla de enfrente · line: proyectil en la dirección (range) · around: las 8 casillas vecinas
 * area: enemigos a distancia <= range · self: uno mismo · party: aliados a distancia <= range · ally: aliado más herido
 */
export type SkillTarget = 'front' | 'line' | 'around' | 'area' | 'self' | 'party' | 'ally';

export interface SkillDef {
  id: string;
  name: string;
  desc: string;
  cost: number;
  element: Element;
  kind: SkillKind;
  target: SkillTarget;
  power: number;
  range?: number;
  status?: { id: StatusId; turns: number; chance: number };
  drain?: number;
  crit?: number;
  /** Curación que además elimina el veneno. */
  cure?: boolean;
}

const LIST: SkillDef[] = [
  // --- Prestigio: una nueva por cada prestigio (ver PRESTIGE_SKILLS en characters.ts) ---
  { id: 'corte_cruzado', name: 'Corte cruzado', desc: 'Dos cortes en cruz al frente. Suele ser crítico.', cost: 5, element: 'neutral', kind: 'phys', target: 'front', power: 34, crit: 0.2 },
  { id: 'voluntad', name: 'Voluntad de la Hondonada', desc: 'La grieta responde: sube mucho tu ataque.', cost: 6, element: 'neutral', kind: 'buff', target: 'self', power: 0, status: { id: 'atk_up', turns: 10, chance: 1 } },
  { id: 'quiebre_grieta', name: 'Quiebre de la grieta', desc: 'Abres una grieta bajo tus pies que golpea a todos los adyacentes.', cost: 10, element: 'neutral', kind: 'mag', target: 'around', power: 44 },
  { id: 'yunque', name: 'Golpe de yunque', desc: 'Martillazo brutal que suele aturdir.', cost: 5, element: 'fuego', kind: 'phys', target: 'front', power: 36, status: { id: 'aturdido', turns: 1, chance: 0.5 } },
  { id: 'forja_viva', name: 'Forja viva', desc: 'Bram arde por dentro: sube su ataque.', cost: 6, element: 'fuego', kind: 'buff', target: 'self', power: 0, status: { id: 'atk_up', turns: 10, chance: 1 } },
  { id: 'cataclismo', name: 'Cataclismo de ascuas', desc: 'Estampa el martillo y estalla fuego a su alrededor.', cost: 11, element: 'fuego', kind: 'mag', target: 'around', power: 46 },
  { id: 'luz_serena', name: 'Luz serena', desc: 'Cura al grupo cercano y quita el veneno.', cost: 9, element: 'luz', kind: 'heal', target: 'party', power: 30, range: 6, cure: true },
  { id: 'lanza_alba', name: 'Lanza del alba', desc: 'Rayo de luz en línea recta.', cost: 6, element: 'luz', kind: 'mag', target: 'line', power: 32, range: 6 },
  { id: 'milagro', name: 'Milagro', desc: 'Una curación enorme para todo el grupo, y sin veneno.', cost: 14, element: 'luz', kind: 'heal', target: 'party', power: 60, range: 8, cure: true },
  { id: 'muralla_viviente', name: 'Muralla viviente', desc: 'Garrick se planta: sube mucho su defensa.', cost: 4, element: 'tierra', kind: 'buff', target: 'self', power: 0, status: { id: 'def_up', turns: 12, chance: 1 } },
  { id: 'tajo_veterano', name: 'Tajo de veterano', desc: 'Un golpe de los de antes, justo donde duele.', cost: 5, element: 'tierra', kind: 'phys', target: 'front', power: 34, crit: 0.25 },
  { id: 'terremoto', name: 'Terremoto', desc: 'Sacude el suelo: golpea a los enemigos cercanos.', cost: 11, element: 'tierra', kind: 'phys', target: 'area', power: 34, range: 2 },
  { id: 'flecha_doble', name: 'Flecha doble', desc: 'Dos flechas seguidas, muy lejos.', cost: 4, element: 'viento', kind: 'phys', target: 'line', power: 28, range: 7 },
  { id: 'viento_cortante', name: 'Viento cortante', desc: 'Ráfaga que corta a los enemigos cercanos.', cost: 8, element: 'viento', kind: 'phys', target: 'area', power: 24, range: 3 },
  { id: 'tormenta_flechas', name: 'Tormenta de flechas', desc: 'Llueven flechas sobre todo lo que se mueve cerca.', cost: 12, element: 'viento', kind: 'phys', target: 'area', power: 36, range: 4 },
  { id: 'prision_hielo', name: 'Prisión de hielo', desc: 'Hielo en línea recta que suele dejar congelado (aturdido).', cost: 6, element: 'agua', kind: 'mag', target: 'line', power: 26, range: 6, status: { id: 'aturdido', turns: 2, chance: 0.6 } },
  { id: 'torrente', name: 'Torrente', desc: 'Agua a presión contra los enemigos cercanos.', cost: 9, element: 'agua', kind: 'mag', target: 'area', power: 28, range: 3 },
  { id: 'abismo', name: 'Abismo', desc: 'Un remolino oscuro que hunde la defensa de quien alcanza.', cost: 14, element: 'agua', kind: 'mag', target: 'area', power: 44, range: 3, status: { id: 'def_down', turns: 8, chance: 1 } },
  { id: 'emboscada', name: 'Emboscada', desc: 'Puñalada por sorpresa: casi siempre crítica.', cost: 4, element: 'neutral', kind: 'phys', target: 'front', power: 30, crit: 0.35 },
  { id: 'veneno_sombra', name: 'Daga envenenada', desc: 'Corte con veneno que dura mucho.', cost: 5, element: 'neutral', kind: 'phys', target: 'front', power: 18, status: { id: 'veneno', turns: 10, chance: 1 } },
  { id: 'mil_cortes', name: 'Mil cortes', desc: 'Pip desaparece y corta a todos los adyacentes.', cost: 10, element: 'neutral', kind: 'phys', target: 'around', power: 36 },
  { id: 'escudo_muro', name: 'Muro de escudos', desc: 'Sube la defensa de todo el grupo cercano.', cost: 7, element: 'luz', kind: 'buff', target: 'party', power: 0, range: 5, status: { id: 'def_up', turns: 8, chance: 1 } },
  { id: 'lanza_juicio', name: 'Lanza del juicio', desc: 'Estocada de luz que alcanza 3 casillas.', cost: 5, element: 'luz', kind: 'phys', target: 'line', power: 32, range: 3 },
  { id: 'estandarte', name: 'Estandarte', desc: 'Seren alza su estandarte: todo el grupo ataca con más fuerza.', cost: 10, element: 'luz', kind: 'buff', target: 'party', power: 0, range: 6, status: { id: 'atk_up', turns: 12, chance: 1 } },
  { id: 'grieta_menor', name: 'Grieta menor', desc: 'Una grieta en línea que roba vida.', cost: 6, element: 'sombra', kind: 'mag', target: 'line', power: 28, range: 6, drain: 0.3 },
  { id: 'velo_profundo', name: 'Velo profundo', desc: 'Las sombras envuelven a Vael: sube mucho su defensa.', cost: 5, element: 'sombra', kind: 'buff', target: 'self', power: 0, status: { id: 'def_up', turns: 12, chance: 1 } },
  { id: 'fractura', name: 'La Fractura', desc: 'Vael abre la tierra como hace 300 años. Golpea y roba vida a los enemigos cercanos.', cost: 14, element: 'sombra', kind: 'mag', target: 'area', power: 46, range: 3, drain: 0.3 },
  // --- Protagonista: Errante (neutro) ---
  { id: 'tajo', name: 'Tajo firme', desc: 'Golpe potente al frente.', cost: 3, element: 'neutral', kind: 'phys', target: 'front', power: 22 },
  { id: 'golpe_aturdidor', name: 'Golpe aturdidor', desc: 'Golpe que puede aturdir 1 turno.', cost: 4, element: 'neutral', kind: 'phys', target: 'front', power: 14, status: { id: 'aturdido', turns: 1, chance: 0.6 } },
  { id: 'segundo_aliento', name: 'Segundo aliento', desc: 'Recupera vida propia.', cost: 5, element: 'neutral', kind: 'heal', target: 'self', power: 25 },
  // --- Protagonista: Brasa (fuego) ---
  { id: 'tajo_igneo', name: 'Tajo ígneo', desc: 'Corte envuelto en fuego.', cost: 3, element: 'fuego', kind: 'phys', target: 'front', power: 26 },
  { id: 'llamarada', name: 'Llamarada', desc: 'Lanza fuego en línea recta.', cost: 5, element: 'fuego', kind: 'mag', target: 'line', power: 22, range: 5 },
  { id: 'circulo_brasas', name: 'Círculo de brasas', desc: 'Quema a todos los enemigos adyacentes.', cost: 7, element: 'fuego', kind: 'mag', target: 'around', power: 20 },
  // --- Protagonista: Marea (agua) ---
  { id: 'corte_marea', name: 'Corte de marea', desc: 'Corte de agua al frente.', cost: 3, element: 'agua', kind: 'phys', target: 'front', power: 24 },
  { id: 'ola', name: 'Ola', desc: 'Golpea a los enemigos cercanos.', cost: 7, element: 'agua', kind: 'mag', target: 'area', power: 18, range: 2 },
  { id: 'brisa_curativa', name: 'Brisa curativa', desc: 'Cura un poco a todo el grupo.', cost: 7, element: 'agua', kind: 'heal', target: 'party', power: 15, range: 6 },
  // --- Protagonista: Vendaval (viento) ---
  { id: 'corte_viento', name: 'Corte de viento', desc: 'Cuchilla de aire a distancia.', cost: 3, element: 'viento', kind: 'phys', target: 'line', power: 20, range: 3 },
  { id: 'torbellino', name: 'Torbellino', desc: 'Golpea a todos los adyacentes.', cost: 6, element: 'viento', kind: 'phys', target: 'around', power: 20 },
  { id: 'prisa', name: 'Prisa', desc: 'Actúa dos veces por turno durante un tiempo.', cost: 6, element: 'viento', kind: 'buff', target: 'self', power: 0, status: { id: 'prisa', turns: 6, chance: 1 } },
  // --- Protagonista: Roca (tierra) ---
  { id: 'golpe_roca', name: 'Golpe de roca', desc: 'Golpe demoledor al frente.', cost: 3, element: 'tierra', kind: 'phys', target: 'front', power: 30 },
  { id: 'piel_piedra', name: 'Piel de piedra', desc: 'Sube tu defensa.', cost: 4, element: 'tierra', kind: 'buff', target: 'self', power: 0, status: { id: 'def_up', turns: 8, chance: 1 } },
  { id: 'temblor', name: 'Temblor', desc: 'Sacude a todos los adyacentes.', cost: 6, element: 'tierra', kind: 'phys', target: 'around', power: 22 },
  // --- Protagonista: Lumen (luz) ---
  { id: 'destello', name: 'Destello', desc: 'Rayo de luz en línea.', cost: 4, element: 'luz', kind: 'mag', target: 'line', power: 22, range: 5 },
  { id: 'juicio', name: 'Juicio', desc: 'Luz sobre los enemigos cercanos.', cost: 8, element: 'luz', kind: 'mag', target: 'area', power: 18, range: 3 },
  // --- Protagonista: Umbra (sombra) ---
  { id: 'zarpa_umbria', name: 'Zarpa umbría', desc: 'Garra de sombra al frente.', cost: 3, element: 'sombra', kind: 'phys', target: 'front', power: 26 },
  { id: 'drenar', name: 'Drenar', desc: 'Roba vida al enemigo de enfrente.', cost: 4, element: 'sombra', kind: 'mag', target: 'front', power: 22, drain: 0.5 },
  { id: 'velo', name: 'Velo', desc: 'Baja la defensa de los enemigos cercanos.', cost: 5, element: 'sombra', kind: 'debuff', target: 'area', power: 0, range: 3, status: { id: 'def_down', turns: 8, chance: 0.75 } },

  // --- Bram ---
  { id: 'martillazo', name: 'Martillazo', desc: 'Golpe de martillo ardiente.', cost: 3, element: 'fuego', kind: 'phys', target: 'front', power: 28 },
  { id: 'furia', name: 'Furia', desc: 'Sube su ataque.', cost: 4, element: 'neutral', kind: 'buff', target: 'self', power: 0, status: { id: 'atk_up', turns: 8, chance: 1 } },
  { id: 'onda_forja', name: 'Onda de forja', desc: 'Onda de calor a los adyacentes.', cost: 6, element: 'fuego', kind: 'phys', target: 'around', power: 18 },
  // --- Lysa ---
  { id: 'sanar', name: 'Sanar', desc: 'Cura al aliado más herido.', cost: 4, element: 'luz', kind: 'heal', target: 'ally', power: 35, range: 6 },
  { id: 'luz_sagrada', name: 'Luz sagrada', desc: 'Rayo sagrado en línea.', cost: 4, element: 'luz', kind: 'mag', target: 'line', power: 22, range: 5 },
  { id: 'bendicion', name: 'Bendición', desc: 'Cura a todo el grupo cercano.', cost: 8, element: 'luz', kind: 'heal', target: 'party', power: 20, range: 6 },
  // --- Garrick ---
  { id: 'provocar', name: 'Provocar', desc: 'Atrae a los enemigos hacia él.', cost: 3, element: 'neutral', kind: 'buff', target: 'self', power: 0, status: { id: 'provocar', turns: 8, chance: 1 } },
  { id: 'muro_piedra', name: 'Muro de piedra', desc: 'Sube la defensa del grupo.', cost: 6, element: 'tierra', kind: 'buff', target: 'party', power: 0, range: 5, status: { id: 'def_up', turns: 8, chance: 1 } },
  { id: 'golpe_escudo', name: 'Golpe de escudo', desc: 'Golpe que puede aturdir.', cost: 4, element: 'tierra', kind: 'phys', target: 'front', power: 20, status: { id: 'aturdido', turns: 1, chance: 0.45 } },
  // --- Kaela ---
  { id: 'flecha', name: 'Flecha', desc: 'Disparo a larga distancia.', cost: 2, element: 'viento', kind: 'phys', target: 'line', power: 22, range: 7 },
  { id: 'disparo_veneno', name: 'Disparo venenoso', desc: 'Flecha que envenena.', cost: 4, element: 'viento', kind: 'phys', target: 'line', power: 14, range: 7, status: { id: 'veneno', turns: 8, chance: 0.75 } },
  { id: 'lluvia_flechas', name: 'Lluvia de flechas', desc: 'Golpea a los enemigos cercanos.', cost: 8, element: 'viento', kind: 'phys', target: 'area', power: 16, range: 3 },
  // --- Odric ---
  { id: 'lanza_hielo', name: 'Lanza de hielo', desc: 'Proyectil helado en línea.', cost: 4, element: 'agua', kind: 'mag', target: 'line', power: 26, range: 6 },
  { id: 'marea_alta', name: 'Marea alta', desc: 'Agua sobre los enemigos cercanos.', cost: 8, element: 'agua', kind: 'mag', target: 'area', power: 20, range: 2 },
  { id: 'debilitar', name: 'Debilitar', desc: 'Baja la defensa del objetivo.', cost: 3, element: 'neutral', kind: 'debuff', target: 'line', power: 0, range: 6, status: { id: 'def_down', turns: 8, chance: 0.9 } },
  // --- Pip ---
  { id: 'punalada', name: 'Puñalada', desc: 'Golpe rápido con mucho crítico.', cost: 3, element: 'neutral', kind: 'phys', target: 'front', power: 24, crit: 0.35 },
  { id: 'bomba_humo', name: 'Bomba de humo', desc: 'Aturde a los enemigos cercanos.', cost: 6, element: 'neutral', kind: 'debuff', target: 'area', power: 0, range: 2, status: { id: 'aturdido', turns: 2, chance: 0.6 } },
  // --- Seren ---
  { id: 'grito_guerra', name: 'Grito de guerra', desc: 'Sube el ataque del grupo.', cost: 6, element: 'neutral', kind: 'buff', target: 'party', power: 0, range: 5, status: { id: 'atk_up', turns: 8, chance: 1 } },
  { id: 'lanza_luz', name: 'Lanza de luz', desc: 'Estocada que alcanza 2 casillas.', cost: 3, element: 'luz', kind: 'phys', target: 'line', power: 24, range: 2 },
  { id: 'escudo_guardia', name: 'Escudo de la guardia', desc: 'Sube la defensa del grupo.', cost: 6, element: 'luz', kind: 'buff', target: 'party', power: 0, range: 5, status: { id: 'def_up', turns: 6, chance: 1 } },
  // --- Vael ---
  { id: 'grieta', name: 'Grieta', desc: 'Abre la tierra bajo los enemigos.', cost: 8, element: 'sombra', kind: 'mag', target: 'area', power: 24, range: 3 },

  // --- Habilidades extra (se aprenden más tarde; obligan a elegir 4) ---
  { id: 'embestida', name: 'Embestida', desc: 'Golpe que alcanza 2 casillas en línea.', cost: 4, element: 'neutral', kind: 'phys', target: 'line', power: 20, range: 2 },
  { id: 'grito_valor', name: 'Grito de valor', desc: 'Sube tu ataque.', cost: 4, element: 'neutral', kind: 'buff', target: 'self', power: 0, status: { id: 'atk_up', turns: 8, chance: 1 } },
  { id: 'escudo_ascuas', name: 'Escudo de ascuas', desc: 'Sube tu defensa.', cost: 4, element: 'fuego', kind: 'buff', target: 'self', power: 0, status: { id: 'def_up', turns: 8, chance: 1 } },
  { id: 'infierno', name: 'Infierno', desc: 'Fuego sobre todos los enemigos cercanos.', cost: 10, element: 'fuego', kind: 'mag', target: 'area', power: 24, range: 3 },
  { id: 'remolino', name: 'Remolino', desc: 'Agua giratoria contra los adyacentes.', cost: 6, element: 'agua', kind: 'mag', target: 'around', power: 22 },
  { id: 'diluvio', name: 'Diluvio', desc: 'Agua sobre todos los enemigos cercanos.', cost: 10, element: 'agua', kind: 'mag', target: 'area', power: 24, range: 3 },
  { id: 'rompehuesos', name: 'Rompehuesos', desc: 'Golpe brutal que puede bajar la defensa.', cost: 5, element: 'neutral', kind: 'phys', target: 'front', power: 32, status: { id: 'def_down', turns: 6, chance: 0.4 } },
  { id: 'martillo_ascuas', name: 'Martillo de ascuas', desc: 'Lanza ascuas hasta 3 casillas.', cost: 5, element: 'fuego', kind: 'mag', target: 'line', power: 24, range: 3 },
  { id: 'purificar', name: 'Purificar', desc: 'Cura un poco y elimina el veneno del grupo.', cost: 5, element: 'luz', kind: 'heal', target: 'party', power: 10, range: 6, cure: true },
  { id: 'escudo_sagrado', name: 'Escudo sagrado', desc: 'Sube la defensa del grupo.', cost: 6, element: 'luz', kind: 'buff', target: 'party', power: 0, range: 5, status: { id: 'def_up', turns: 8, chance: 1 } },
  { id: 'golpe_sismico', name: 'Golpe sísmico', desc: 'Sacude a todos los adyacentes.', cost: 6, element: 'tierra', kind: 'phys', target: 'around', power: 20 },
  { id: 'baluarte', name: 'Baluarte', desc: 'Sube mucho su defensa.', cost: 4, element: 'tierra', kind: 'buff', target: 'self', power: 0, status: { id: 'def_up', turns: 12, chance: 1 } },
  { id: 'disparo_certero', name: 'Disparo certero', desc: 'Flecha con mucho crítico.', cost: 4, element: 'viento', kind: 'phys', target: 'line', power: 26, range: 7, crit: 0.4 },
  { id: 'escarcha', name: 'Escarcha', desc: 'Hielo que puede aturdir.', cost: 5, element: 'agua', kind: 'mag', target: 'line', power: 20, range: 6, status: { id: 'aturdido', turns: 1, chance: 0.35 } },
  { id: 'tajo_veloz', name: 'Tajo veloz', desc: 'Corta a todos los adyacentes.', cost: 5, element: 'neutral', kind: 'phys', target: 'around', power: 16 },
  { id: 'carga', name: 'Carga', desc: 'Embestida de lanza hasta 3 casillas.', cost: 5, element: 'luz', kind: 'phys', target: 'line', power: 26, range: 3 },
  { id: 'eclipse', name: 'Eclipse', desc: 'Oscuridad sobre todos los enemigos cercanos.', cost: 12, element: 'sombra', kind: 'mag', target: 'area', power: 30, range: 4 },

  // --- Monstruos ---
  { id: 'salpicar', name: 'Salpicar', desc: '', cost: 0, element: 'agua', kind: 'mag', target: 'front', power: 14 },
  { id: 'mordisco', name: 'Mordisco', desc: '', cost: 0, element: 'neutral', kind: 'phys', target: 'front', power: 14 },
  { id: 'flecha_hueso', name: 'Flecha de hueso', desc: '', cost: 0, element: 'sombra', kind: 'phys', target: 'line', power: 13, range: 6 },
  { id: 'esporas', name: 'Esporas', desc: '', cost: 0, element: 'tierra', kind: 'mag', target: 'around', power: 7, status: { id: 'veneno', turns: 6, chance: 0.6 } },
  { id: 'llama_fatua', name: 'Llama fatua', desc: '', cost: 0, element: 'fuego', kind: 'mag', target: 'line', power: 15, range: 5 },
  { id: 'mordida_venenosa', name: 'Mordida venenosa', desc: '', cost: 0, element: 'tierra', kind: 'phys', target: 'front', power: 11, status: { id: 'veneno', turns: 6, chance: 0.5 } },
  { id: 'toque_helado', name: 'Toque helado', desc: '', cost: 0, element: 'sombra', kind: 'mag', target: 'front', power: 18 },
  { id: 'lamento', name: 'Lamento', desc: '', cost: 0, element: 'sombra', kind: 'mag', target: 'area', power: 11, range: 3 },
  { id: 'golpe_piedra', name: 'Golpe de piedra', desc: '', cost: 0, element: 'tierra', kind: 'phys', target: 'front', power: 22 },
  { id: 'abrazo_ahogado', name: 'Abrazo del ahogado', desc: '', cost: 0, element: 'agua', kind: 'phys', target: 'front', power: 18 },
  { id: 'desgarro', name: 'Desgarro', desc: '', cost: 0, element: 'neutral', kind: 'phys', target: 'front', power: 18 },
  { id: 'telarana', name: 'Telaraña', desc: '', cost: 0, element: 'tierra', kind: 'debuff', target: 'area', power: 0, range: 3, status: { id: 'aturdido', turns: 1, chance: 0.35 } },
  { id: 'golpe_hueco', name: 'Golpe hueco', desc: '', cost: 0, element: 'sombra', kind: 'phys', target: 'around', power: 24 },
  { id: 'ola_sombra', name: 'Ola de sombra', desc: '', cost: 0, element: 'sombra', kind: 'mag', target: 'area', power: 18, range: 4 },
  { id: 'aliento_niebla', name: 'Aliento de niebla', desc: '', cost: 0, element: 'agua', kind: 'mag', target: 'area', power: 18, range: 4 },
  { id: 'zarpazo_niebla', name: 'Zarpazo', desc: '', cost: 0, element: 'agua', kind: 'phys', target: 'around', power: 22 },
];

export const SKILLS: Record<string, SkillDef> = Object.fromEntries(LIST.map((s) => [s.id, s]));
