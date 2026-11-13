/**
 * Juega mazmorras enteras con el piloto automático del líder (DungeonRun.autoAction), el mismo que se activa
 * con la tecla P. Comprueba que no se atasca y da una idea de cómo de bien juega. Uso: npm run auto-test
 */
import { DUNGEONS } from '../src/data/dungeons';
import { MEMBERS } from '../src/data/characters';
import { EQUIPMENT } from '../src/data/equipment';
import { joinMember } from '../src/core/stats';
import { newGame, type GameState } from '../src/core/state';
import { DungeonRun } from '../src/dungeon/run';

// Node (el proyecto no instala @types/node).
declare const process: { argv: string[] };

function makeState(level: number, party: string[], prestige = 0, gear: string[] = []): GameState {
  const s = newGame();
  for (const id of party) if (!s.members[id]) joinMember(s, id);
  for (const id of party) {
    s.members[id].level = level;
    s.members[id].prestige = prestige;
    const pick = (slot: string) => gear.find((g) => EQUIPMENT[g].slot === slot && (slot !== 'weapon' || EQUIPMENT[g].kind === MEMBERS[id].weapon));
    if (gear.length) s.members[id].gear = { weapon: pick('weapon') ?? s.members[id].gear.weapon, armor: pick('armor'), accessory: pick('accessory') };
  }
  s.party = party;
  s.bag = gear.length ? { racion: 3, pocion_suprema: 3, pocion_mayor: 3 } : { pan: 4, pocion: 4 };
  return s;
}

// Equipo que se puede comprar en cada tramo de la historia (actos 3 a 8).
const G3 = ['cimitarra_sol', 'maza_cantera', 'baston_oasis', 'arco_duna', 'aguijon', 'lanza_albar', 'coraza_arena', 'anillo_sol'];
const G4 = ['espada_hueso', 'martillo_osario', 'baston_coral', 'arco_coral', 'daga_marea', 'tridente', 'coraza_coral', 'anillo_osario'];
const G5 = ['hoja_ocaso', 'martillo_dis', 'baston_serafin', 'arco_pluma', 'daga_ceniza', 'lanza_dis', 'armadura_dis', 'anillo_rey'];
const A3 = ['aren', 'bram', 'lysa', 'garrick'];
const A5 = ['aren', 'bram', 'lysa', 'seren'];
const A6 = ['aren', 'lysa', 'seren', 'vael'];

const plan: [string, number, string[], number?, string[]?][] = [
  ['cueva_goteante', 2, ['aren', 'bram']],
  ['sendero_lodoso', 3, ['aren', 'bram']],
  ['bosque_espinas', 5, ['aren', 'bram', 'garrick']],
  ['ruinas_santuario', 7, ['aren', 'bram', 'garrick']],
  ['templo_sectario', 13, ['aren', 'bram', 'garrick', 'lysa']],
  ['hondonada_frontera', 10, ['aren', 'bram', 'garrick', 'lysa']],
  ['paso_cuervo', 12, ['aren', 'bram', 'garrick', 'lysa']],
  ['cienaga_niebla', 14, ['aren', 'bram', 'lysa', 'garrick']],
  ['babel_llaves', 8, ['aren', 'bram', 'lysa', 'garrick']],
  ['babel_condiciones', 8, ['aren', 'bram', 'lysa', 'garrick']],
  ['babel_travesia', 8, ['aren', 'bram', 'lysa', 'garrick']],
  ['babel_terrenos', 8, ['aren', 'bram', 'lysa', 'garrick']],
  ['babel_jefes', 20, ['aren', 'bram', 'lysa', 'kaela'], 1, G4],
  ['campos_molino', 4, ['aren', 'bram']],
  ['cenizas_vado', 12, ['aren', 'bram', 'garrick', 'lysa']],
  ['sotano_molino', 4, ['aren', 'bram']],
  ['grieta_vado', 14, ['aren', 'bram', 'garrick', 'lysa']],
  ['templo_enterrado', 20, A3, 0, G3],
  ['catacumbas_osario', 20, A5, 1, G4],
  ['gran_naufragio', 20, A5, 1, G4],
  ['llanura_plumas', 16, ['aren', 'bram', 'lysa', 'garrick']],
  ['prueba_prestigio', 20, ['bram']],
  ['prueba_prestigio', 20, ['lysa']],
  ['prueba_prestigio', 20, ['aren']],
  // ---------- Actos 3 a 8 (un kit de región cada una)
  ['lago_juncos', 16, ['aren', 'bram', 'lysa', 'kaela'], 0, G3],
  ['dunas_errantes', 17, A3, 0, G3],
  ['mina_enterrada', 19, A3, 0, G3],
  ['glaciar_azul', 20, A3, 0, G3],
  ['gran_grieta', 20, A3, 1, G3],
  ['puertas_osario', 20, ['aren', 'bram', 'lysa', 'kaela'], 1, G4],
  ['albar_tomada', 20, A5, 1, G4],
  ['cayo_hueco', 20, A5, 1, G4],
  ['descenso', 20, A6, 2, G5],
  ['rios_fuego', 20, A6, 2, G5],
  ['torre_escudo', 20, A6, 2, G5],
  ['trono_alba', 20, A6, 3, G5],
];

const N = 15;
const stops: string[] = [];
const only = process.argv[2];
for (const [id, lv, party, prestige, gear] of plan) {
  if (only && !id.includes(only) && !(only === 'late' && gear)) continue;
  const results: Record<string, number> = {};
  let turns = 0;
  for (let i = 0; i < N; i++) {
    const run = new DungeonRun(makeState(lv, party, prestige, gear), id, 2000 + i);
    let why: string | null = null;
    for (let t = 0; t < 6000 && !run.result; t++) {
      if (run.steppedOnStairs) {
        // Las mazmorras sin fin se prueban hasta el primer guardián.
        if (run.def.infinite && run.floor >= 10) run.exitTower();
        else {
          if (run.campAhead) run.campRest();
          run.descend();
        }
        continue;
      }
      why = run.autoAction();
      run.drainEvents();
      if (why) break;
      if (run.autoStuck()) {
        why = 'dando vueltas';
        break;
      }
    }
    const r = run.result ?? 'parado';
    const key = r === 'death' ? (run.belly <= 0 ? 'hambre' : `muerte_${run.chain.length > 1 ? `t${run.stage}` : ''}p${run.floor}`) : r;
    results[key] = (results[key] ?? 0) + 1;
    turns += run.turn;
    if (!run.result) stops.push(`${id} semilla ${2000 + i} ${run.def.id} piso ${run.floor}: ${why ?? 'tiempo agotado'}`);
  }
  console.log(`${DUNGEONS[id].name.padEnd(30)} lv${lv}${prestige ? ` P${prestige}` : ''} ${JSON.stringify(results)} turnos medios ${Math.round(turns / N)}`);
}
if (stops.length) {
  console.log(`\nSe detuvo ${stops.length} veces:\n${stops.slice(0, 20).join('\n')}`);
  throw new Error('El piloto automático se detuvo sin terminar.');
}
console.log('Sin errores.');
