import type { Element } from './elements';

/**
 * Tipos de suelo. Cada mazmorra elige los suyos (`terrain` en dungeons.ts) según su ambiente:
 * hierba en bosques, agua y corrientes en cuevas, barro y niebla en la ciénaga, brasas y ceniza en la Hondonada,
 * hielo en el desfiladero, telarañas donde hay arañas, suelo sagrado en el santuario.
 */
export type TerrainId = 'hierba' | 'agua' | 'brasas' | 'sagrado' | 'barro' | 'hielo' | 'telarana' | 'niebla' | 'ceniza' | 'corriente' | 'raices';

export interface TerrainDef {
  id: TerrainId;
  name: string;
  /** Lo que se explica al jugador al pisarlo por primera vez en el piso. */
  desc: string;
  /** Color para el minimapa. */
  color: string;
  /** Elemento al que no le afecta (y a veces sale ganando). */
  native?: Element;
  /** Monstruos concretos a los que no les afecta. */
  nativeIds?: string[];
  /** Cómo se reparte en una sala: mancha, casillas sueltas o franja (con dirección, para las corrientes). */
  shape: 'blob' | 'scatter' | 'strip';
  /** Los aliados lo rodean si hay otro camino. */
  avoid?: boolean;
}

export const TERRAIN_IDS: TerrainId[] = ['hierba', 'agua', 'brasas', 'sagrado', 'barro', 'hielo', 'telarana', 'niebla', 'ceniza', 'corriente', 'raices'];

export const TERRAIN: Record<TerrainId, TerrainDef> = {
  hierba: { id: 'hierba', name: 'Hierba alta', color: '#3f7a32', shape: 'blob', desc: 'Hierba alta: quien está dentro solo es visto desde una casilla de distancia. Sirve para esconderse... y para emboscadas.' },
  agua: { id: 'agua', name: 'Agua', color: '#2f5f9a', native: 'agua', shape: 'blob', desc: 'Agua: quien está dentro recibe un 30% más de daño. A los seres de agua no les afecta y pegan más fuerte desde ella.' },
  brasas: { id: 'brasas', name: 'Brasas', color: '#b8452f', native: 'fuego', shape: 'blob', avoid: true, desc: 'Brasas: quema un poco cada turno a quien se quede encima (salvo a los seres de fuego). El grupo las rodea si puede.' },
  sagrado: { id: 'sagrado', name: 'Suelo sagrado', color: '#c9a24a', native: 'luz', shape: 'blob', desc: 'Suelo sagrado: cura un poco cada turno a quien lo pisa, pero quema a los seres de sombra.' },
  barro: { id: 'barro', name: 'Barro', color: '#6a4a2a', native: 'tierra', shape: 'blob', desc: 'Barro: cuesta un turno extra salir de cada casilla, y los rápidos pierden su ventaja. A los seres de tierra no les afecta.' },
  hielo: { id: 'hielo', name: 'Hielo', color: '#a8d8f0', native: 'viento', shape: 'blob', avoid: true, desc: 'Hielo: al pisarlo resbalas en línea recta hasta salir del hielo o chocar con algo. Los seres voladores (viento) no resbalan.' },
  telarana: { id: 'telarana', name: 'Telaraña', color: '#d8d8e0', nativeIds: ['arana', 'matriarca'], native: 'fuego', shape: 'scatter', avoid: true, desc: 'Telaraña: quien la pisa queda atrapado un turno y la rompe. A las arañas y a los seres de fuego no les afecta.' },
  niebla: { id: 'niebla', name: 'Niebla', color: '#8a8a9a', shape: 'blob', desc: 'Niebla: dentro solo se ve a una casilla, y a quien está dentro solo se le ve desde dos casillas.' },
  ceniza: { id: 'ceniza', name: 'Ceniza', color: '#4a4448', native: 'fuego', shape: 'blob', desc: 'Ceniza: ahoga la energía. Quien está encima no puede usar habilidades (salvo los seres de fuego).' },
  corriente: { id: 'corriente', name: 'Corriente', color: '#3f9ac8', native: 'agua', shape: 'strip', desc: 'Corriente: cada dos turnos empuja una casilla en su dirección. Se cruza bien de lado; contracorriente se avanza despacio. A los seres de agua no les afecta.' },
  raices: { id: 'raices', name: 'Raíces', color: '#5a6a2a', shape: 'scatter', desc: 'Raíces: se pasa por encima, pero frenan las flechas, los proyectiles y los ataques en línea.' },
};

/** Código en el mapa (0 = sin terreno). */
export const terrainCode = (id: TerrainId) => TERRAIN_IDS.indexOf(id) + 1;
export const terrainOfCode = (c: number): TerrainId | null => (c ? TERRAIN_IDS[c - 1] : null);
