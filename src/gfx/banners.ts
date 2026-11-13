import type { BannerKind } from '../data/world';
import { Rng } from '../core/rng';

const W = 240;
const H = 80;

/** Ilustración pixelada de la localidad (cielo, luna, siluetas). Se dibuja a baja resolución y se escala. */
export function drawBanner(canvas: HTMLCanvasElement, kind: BannerKind | 'title' | 'dungeon', seed = 7): void {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const rng = new Rng(seed);
  const skies: Record<string, [string, string]> = {
    capital: ['#1a1024', '#4a2030'],
    pueblo: ['#10141e', '#3a2a30'],
    pantano: ['#0e1a1a', '#2a3a38'],
    title: ['#0a0610', '#4a1424'],
    torre: ['#0c0818', '#3a2050'],
    desierto: ['#2a1a20', '#a8603a'],
    nieve: ['#1a2230', '#7a8aa0'],
    mar: ['#0a1828', '#2a5a7a'],
    hueso: ['#100e0c', '#3a3428'],
    infierno: ['#1a0404', '#8a2008'],
    cielo: ['#a8b8d8', '#f0e8d0'],
    dungeon: ['#08060a', '#2a1020'],
  };
  const [top, bottom] = skies[kind];
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = rng.chance(0.3) ? '#e8d8c0' : '#8a7a90';
    ctx.fillRect(rng.int(0, W), rng.int(0, H / 2), 1, 1);
  }
  // Luna
  const mx = rng.int(30, W - 30);
  ctx.fillStyle = kind === 'title' || kind === 'dungeon' ? '#d84a4a' : '#e8dcc0';
  ctx.beginPath();
  ctx.arc(mx, 18, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.arc(mx + 4, 15, 8, 0, Math.PI * 2);
  ctx.fill();

  // Montañas lejanas
  ridge(ctx, rng, 46, 18, '#1a1420');
  ridge(ctx, rng, 58, 10, '#120e16');

  ctx.fillStyle = '#0a080c';
  if (kind === 'capital') {
    ctx.fillRect(0, 56, W, 24);
    for (let x = 0; x < W; x += 6) ctx.fillRect(x, 53, 3, 3);
    for (const tx of [30, 90, 150, 205]) {
      ctx.fillRect(tx, 36, 16, 24);
      for (let x = tx; x < tx + 16; x += 4) ctx.fillRect(x, 33, 2, 3);
      ctx.fillStyle = '#e8a040';
      ctx.fillRect(tx + 6, 42, 3, 4);
      ctx.fillStyle = '#0a080c';
    }
    ctx.fillRect(110, 24, 20, 36);
    ctx.beginPath();
    ctx.moveTo(108, 24);
    ctx.lineTo(120, 10);
    ctx.lineTo(132, 24);
    ctx.fill();
  } else if (kind === 'pueblo') {
    ctx.fillRect(0, 64, W, 16);
    for (let x = 0; x < W; x += 4) ctx.fillRect(x, 58 + (x % 8 ? 2 : 0), 2, 8);
    for (const hx of [20, 70, 130, 180]) {
      ctx.fillRect(hx, 50, 22, 14);
      ctx.beginPath();
      ctx.moveTo(hx - 3, 50);
      ctx.lineTo(hx + 11, 40);
      ctx.lineTo(hx + 25, 50);
      ctx.fill();
      ctx.fillStyle = '#e8a040';
      ctx.fillRect(hx + 8, 54, 3, 3);
      ctx.fillStyle = '#0a080c';
    }
    for (let i = 0; i < 8; i++) tree(ctx, rng.int(0, W), 64);
  } else if (kind === 'torre') {
    // Una torre altísima que se pierde en las nubes.
    ctx.fillRect(0, 66, W, 14);
    const tx = W / 2 - 14;
    for (let y = 2; y < 70; y += 1) {
      const w = 12 + Math.floor(y / 10) * 3 + (y % 10 < 2 ? 4 : 0);
      ctx.fillRect(W / 2 - w / 2, y, w, 1);
    }
    ctx.fillStyle = '#e8c870';
    for (let y = 10; y < 64; y += 9) ctx.fillRect(tx + 12 + ((y / 9) % 2 ? -5 : 5), y, 2, 3);
    ctx.fillStyle = 'rgba(200,170,255,0.18)';
    for (let i = 0; i < 4; i++) ctx.fillRect(W / 2 - 60 + i * 14, 8 + i * 3, 120 - i * 28, 2);
    ctx.fillStyle = '#0a080c';
  } else if (kind === 'desierto') {
    // Dunas y palmeras.
    ctx.fillStyle = '#5a3a20';
    for (let x = 0; x < W; x++) ctx.fillRect(x, 60 + Math.round(Math.sin(x / 22) * 4), 1, 20);
    ctx.fillStyle = '#0a080c';
    for (const px of [40, 160, 200]) {
      ctx.fillRect(px, 40, 2, 22);
      for (let i = -8; i <= 8; i++) ctx.fillRect(px + i, 40 - Math.round(Math.abs(i) < 4 ? 2 : (8 - Math.abs(i)) / 2), 1, 2);
    }
    ctx.fillRect(90, 46, 44, 16);
    for (let x = 90; x < 134; x += 5) ctx.fillRect(x, 43, 3, 3);
    ctx.beginPath();
    ctx.arc(112, 46, 9, Math.PI, 0);
    ctx.fill();
  } else if (kind === 'nieve') {
    ctx.fillStyle = '#c8d8e8';
    ctx.fillRect(0, 64, W, 16);
    ctx.fillStyle = '#0a080c';
    for (const hx of [30, 100, 170]) {
      ctx.fillRect(hx, 50, 26, 14);
      ctx.beginPath();
      ctx.moveTo(hx - 4, 50);
      ctx.lineTo(hx + 13, 36);
      ctx.lineTo(hx + 30, 50);
      ctx.fill();
      ctx.fillStyle = '#e8a040';
      ctx.fillRect(hx + 10, 54, 3, 3);
      ctx.fillStyle = '#0a080c';
    }
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 50; i++) ctx.fillRect(rng.int(0, W), rng.int(0, H), 1, 1);
  } else if (kind === 'mar') {
    ctx.fillStyle = '#123048';
    ctx.fillRect(0, 60, W, 20);
    ctx.fillStyle = 'rgba(160,210,240,0.25)';
    for (let i = 0; i < 12; i++) ctx.fillRect(rng.int(0, W), rng.int(62, 78), rng.int(6, 16), 1);
    ctx.fillStyle = '#0a080c';
    ctx.fillRect(150, 26, 8, 36);
    ctx.fillStyle = '#ffe680';
    ctx.fillRect(149, 22, 10, 5);
    ctx.fillStyle = '#0a080c';
    ctx.fillRect(40, 54, 50, 6);
    ctx.fillRect(62, 34, 2, 20);
    ctx.beginPath();
    ctx.moveTo(64, 34);
    ctx.lineTo(80, 50);
    ctx.lineTo(64, 50);
    ctx.fill();
  } else if (kind === 'hueso') {
    ctx.fillStyle = '#1a1612';
    ctx.fillRect(0, 62, W, 18);
    ctx.fillStyle = '#c8bca0';
    for (const tx of [50, 110, 180]) {
      for (let y = 30; y < 62; y += 4) ctx.fillRect(tx, y, 6, 2);
      ctx.fillRect(tx - 2, 28, 10, 3);
    }
    ctx.fillStyle = '#0a080c';
    for (let i = 0; i < 6; i++) tree(ctx, rng.int(0, W), 64);
  } else if (kind === 'infierno') {
    ctx.fillStyle = '#e8501a';
    for (let x = 0; x < W; x++) ctx.fillRect(x, 66 + Math.round(Math.sin(x / 9) * 2), 1, 14);
    ctx.fillStyle = '#0a080c';
    for (const sx of [20, 60, 140, 200]) {
      ctx.beginPath();
      ctx.moveTo(sx, 66);
      ctx.lineTo(sx + 8, 30 + (sx % 3) * 6);
      ctx.lineTo(sx + 16, 66);
      ctx.fill();
    }
    ctx.fillStyle = '#ffb040';
    for (let i = 0; i < 20; i++) ctx.fillRect(rng.int(0, W), rng.int(20, 64), 1, 1);
  } else if (kind === 'cielo') {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) {
      const cx = rng.int(0, W);
      ctx.fillRect(cx, 60 + rng.int(0, 10), 50, 6);
      ctx.fillRect(cx + 8, 56 + rng.int(0, 10), 30, 6);
    }
    ctx.fillStyle = '#d9c890';
    for (const tx of [60, 120, 180]) {
      ctx.fillRect(tx, 20, 10, 44);
      ctx.fillRect(tx - 3, 18, 16, 3);
    }
  } else if (kind === 'pantano') {
    ctx.fillStyle = '#16262a';
    ctx.fillRect(0, 62, W, 18);
    ctx.fillStyle = '#0a080c';
    for (const hx of [40, 110, 175]) {
      ctx.fillRect(hx, 46, 24, 12);
      ctx.fillRect(hx + 2, 58, 2, 10);
      ctx.fillRect(hx + 20, 58, 2, 10);
      ctx.beginPath();
      ctx.moveTo(hx - 2, 46);
      ctx.lineTo(hx + 12, 38);
      ctx.lineTo(hx + 26, 46);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(160,190,190,0.12)';
    for (let i = 0; i < 6; i++) ctx.fillRect(0, 50 + i * 4, W, 2);
  } else {
    ctx.fillRect(0, 62, W, 18);
    for (let i = 0; i < 14; i++) tree(ctx, rng.int(0, W), 64);
    ctx.fillStyle = '#5a0e1a';
    ctx.fillRect(W / 2 - 30, 66, 60, 2);
    ctx.fillRect(W / 2 - 16, 68, 32, 2);
  }
}

function ridge(ctx: CanvasRenderingContext2D, rng: Rng, base: number, amp: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, H);
  let y = base;
  for (let x = 0; x <= W; x += 8) {
    y = Math.max(base - amp, Math.min(base + 4, y + rng.int(-6, 6)));
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H);
  ctx.fill();
}

function tree(ctx: CanvasRenderingContext2D, x: number, base: number) {
  ctx.fillRect(x, base - 14, 2, 14);
  ctx.beginPath();
  ctx.moveTo(x - 6, base - 6);
  ctx.lineTo(x + 1, base - 22);
  ctx.lineTo(x + 8, base - 6);
  ctx.fill();
}
