/**
 * Poses por dirección a partir de un sprite de frente.
 * 5 poses cubren las 8 direcciones; las que miran a la izquierda son las de la derecha en espejo.
 *   d: abajo (frente) · u: arriba (espaldas) · s: lado · dd: diagonal abajo · ud: diagonal arriba
 */
export type Pose = 'd' | 'u' | 's' | 'dd' | 'ud';
export const POSES: Pose[] = ['d', 'u', 's', 'dd', 'ud'];

export function poseFor(fx: number, fy: number): { pose: Pose; flip: boolean } {
  const pose: Pose = fy > 0 ? (fx ? 'dd' : 'd') : fy < 0 ? (fx ? 'ud' : 'u') : 's';
  return { pose, flip: fx < 0 };
}

export const isBackPose = (p: Pose) => p === 'u' || p === 'ud';

const grid = (rows: string[]) => Array.from({ length: 16 }, (_, y) => (rows[y] ?? '').padEnd(16, '.').slice(0, 16).split(''));
/** Rasgos de la cara: de espaldas se tapan con el pelo (parche P, gafas O, pañuelo M). */
const FACE = new Set(['S', 'E', 'P', 'O', 'M']);

export function mirrorRows(rows: string[]): string[] {
  return grid(rows).map((r) => r.reverse().join(''));
}

/**
 * Humanoides: solo cambia la cabeza (las filas antes de la ropa).
 * De espaldas el pelo/capucha tapa la cara; de lado media cara es pelo y queda un ojo; en diagonal la cara se desplaza.
 */
export function humanPose(rows: string[], pose: Pose): string[] {
  if (pose === 'd') return rows;
  const g = grid(rows);
  const clothes = g.findIndex((r) => r.includes('C'));
  const headEnd = clothes < 0 ? 7 : clothes;
  for (let y = 0; y < headEnd; y++) {
    const r = g[y];
    const neck = y === headEnd - 1;
    // De frente/lado/diagonal solo cambian las filas con pelo u ojos; de espaldas, toda la cabeza menos el cuello.
    if (isBackPose(pose) && neck && r.includes('H')) {
      // Capucha: de espaldas cubre también el cuello (y sus bordes oscuros).
      const a = r.indexOf('H');
      const b = r.lastIndexOf('H');
      for (let i = a; i <= b; i++) r[i] = 'H';
      continue;
    }
    if (isBackPose(pose) ? neck : !r.includes('H') && !r.includes('E')) continue;
    const idx = r.map((c, i) => (FACE.has(c) ? i : -1)).filter((i) => i >= 0);
    if (!idx.length) continue;
    if (isBackPose(pose)) {
      for (const i of idx) r[i] = 'H';
      if (pose === 'ud') r[idx[idx.length - 1]] = 'S'; // asoma un poco de mejilla hacia donde gira
    } else if (pose === 's') {
      const hadEye = idx.some((i) => r[i] === 'E');
      const half = Math.ceil(idx.length / 2);
      idx.forEach((i, k) => (r[i] = k < half ? 'H' : 'S'));
      if (hadEye && idx.length >= 2) r[idx[idx.length - 2]] = 'E';
    } else {
      const vals = idx.map((i) => r[i]);
      r[idx[0]] = 'H';
      for (let k = 1; k < idx.length; k++) r[idx[k]] = vals[k - 1];
    }
  }
  return g.map((r) => r.join(''));
}

/**
 * Monstruos: los ojos ('E') indican hacia dónde miran. De espaldas desaparecen;
 * de lado queda el ojo del lado al que mira, desplazado; en diagonal se desplazan un poco.
 * Los que ya están dibujados de perfil (`profile`) solo se giran.
 */
export function monsterPose(rows: string[], pose: Pose, profile = false): string[] {
  if (profile) return mirrorRows(rows);
  if (pose === 'd') return rows;
  const g = grid(rows);
  const body = (c: string | undefined) => !!c && c !== 'K' && c !== '.' && c !== 'E';
  if (isBackPose(pose)) {
    // De espaldas tampoco se ven boca ni dientes: rasgos oscuros entre los ojos y dos filas por debajo.
    const eyeRows = g.map((r, y) => (r.includes('E') ? y : -1)).filter((y) => y >= 0);
    if (eyeRows.length)
      for (let y = eyeRows[0]; y <= Math.min(15, eyeRows[eyeRows.length - 1] + 2); y++) {
        const r = g[y];
        for (let x = 1; x < 15; x++) {
          if (r[x] !== 'K') continue;
          let l = x - 1;
          while (l > 0 && r[l] === 'K') l--;
          let rr = x + 1;
          while (rr < 15 && r[rr] === 'K') rr++;
          if (body(r[l]) && body(r[rr]) && rr - l <= 4) r[x] = r[l];
        }
      }
  }
  for (const r of g) {
    const eyes = r.map((c, i) => (c === 'E' ? i : -1)).filter((i) => i >= 0);
    if (!eyes.length) continue;
    // Tapa los ojos con el color del cuerpo más cercano.
    const fills = eyes.map((i) => {
      for (let d = 1; d < 16; d++) for (const j of [i - d, i + d]) if (body(r[j])) return r[j];
      return 'A';
    });
    eyes.forEach((i, k) => (r[i] = fills[k]));
    if (isBackPose(pose)) continue;
    const last = eyes[eyes.length - 1];
    const keep = pose === 's' ? eyes.filter((i) => i >= last - 1) : eyes;
    const shift = pose === 's' ? 2 : 1;
    for (const i of keep) {
      const j = i + shift;
      if (body(r[j])) r[j] = 'E';
      else r[i] = 'E';
    }
  }
  return g.map((r) => r.join(''));
}
