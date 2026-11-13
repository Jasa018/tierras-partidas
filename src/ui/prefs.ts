/** Preferencias de pantalla del jugador (se guardan en el navegador, aparte de la partida). */
const PREFS_KEY = 'tierras-partidas-prefs';

/** Dónde se dibuja el mapa en la mazmorra: en la esquina, a pantalla completa semitransparente, o ninguno. */
export type MapMode = 'corner' | 'full' | 'off';
export const MAP_MODES: MapMode[] = ['corner', 'full', 'off'];
export const MAP_MODE_NAMES: Record<MapMode, string> = { corner: 'En la esquina', full: 'Pantalla completa', off: 'Oculto' };

const prefs: { map: MapMode } = load();

function load(): { map: MapMode } {
  try {
    const p = { map: 'corner' as MapMode, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') };
    if (!MAP_MODES.includes(p.map)) p.map = 'corner';
    return p;
  } catch {
    return { map: 'corner' };
  }
}

function save() {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Sin almacenamiento (ventana privada...): la preferencia dura hasta cerrar.
  }
}

export const mapMode = () => prefs.map;

/** Pasa al siguiente modo de mapa y lo devuelve. */
export function cycleMapMode(): MapMode {
  prefs.map = MAP_MODES[(MAP_MODES.indexOf(prefs.map) + 1) % MAP_MODES.length];
  save();
  return prefs.map;
}
