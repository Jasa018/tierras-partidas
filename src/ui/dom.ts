import { sfx } from '../audio/audio';
import { SPEAKERS, type Line } from '../data/story';
import { spriteUrl } from '../gfx/sprites';

// ---------------------------------------------------------------- teclado: pila de manejadores

type KeyHandler = (e: KeyboardEvent) => void;
const handlers: KeyHandler[] = [];

window.addEventListener('keydown', (e) => {
  const h = handlers[handlers.length - 1];
  if (h) h(e);
});

/** Solo el manejador de arriba de la pila recibe teclas. Devuelve la función para quitarlo. */
export function pushKeys(h: KeyHandler): () => void {
  handlers.push(h);
  return () => {
    const i = handlers.lastIndexOf(h);
    if (i >= 0) handlers.splice(i, 1);
  };
}

const isUp = (e: KeyboardEvent) => e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W';
const isDown = (e: KeyboardEvent) => e.key === 'ArrowDown' || e.key === 's' || e.key === 'S';
export const isOk = (e: KeyboardEvent) => e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z';
export const isBack = (e: KeyboardEvent) => e.key === 'Escape' || e.key === 'Backspace' || e.key === 'x' || e.key === 'X';

// ---------------------------------------------------------------- helpers DOM

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, ...children: (Node | string | null | undefined | false)[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  for (const c of children) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}

export function img(key: string, scale = 3, cls = 'sprite'): HTMLImageElement {
  const i = document.createElement('img');
  i.src = spriteUrl(key, scale);
  i.className = cls;
  i.alt = '';
  return i;
}

export function bar(value: number, max: number, cls: string): HTMLElement {
  const outer = h('div', `bar ${cls}`);
  const inner = h('div', 'bar-fill');
  inner.style.width = `${Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))}%`;
  outer.append(inner);
  return outer;
}

export const root = () => document.getElementById('ui')!;
export const modalRoot = () => document.getElementById('modal')!;

// ---------------------------------------------------------------- menú

export interface MenuItem {
  label: string;
  right?: string;
  desc?: string;
  disabled?: boolean;
  icon?: string;
  cls?: string;
}

export interface MenuOpts {
  title?: string;
  cancel?: boolean;
  start?: number;
  onFocus?: (i: number) => void;
  descEl?: HTMLElement;
  /** Pestañas: ← resuelve con TAB_PREV y → con TAB_NEXT. */
  tabs?: boolean;
}

export const TAB_PREV = -2;
export const TAB_NEXT = -3;

/** Lista navegable con teclado y ratón. Resuelve con el índice elegido o -1 si se cancela. */
export function menu(container: HTMLElement, items: MenuItem[], opts: MenuOpts = {}): Promise<number> {
  return new Promise((resolve) => {
    const box = h('div', 'menu');
    if (opts.title) box.append(h('div', 'menu-title', opts.title));
    const list = h('ul', 'menu-list');
    box.append(list);
    // Fuera de las ventanas modales, la descripción va a la barra fija inferior para que el menú no se mueva.
    const footer = container.closest('.overlay') ? null : document.getElementById('footer');
    const desc = opts.descEl ?? footer ?? h('div', 'menu-desc');
    if (desc.parentElement === null) box.append(desc);
    let sel = Math.min(Math.max(0, opts.start ?? 0), items.length - 1);
    const lis = items.map((it, i) => {
      const li = h('li', `menu-item ${it.disabled ? 'disabled' : ''} ${it.cls ?? ''}`);
      if (it.icon) li.append(img(it.icon, 2, 'menu-icon'));
      li.append(h('span', 'menu-label', it.label));
      if (it.right) li.append(h('span', 'menu-right', it.right));
      li.addEventListener('mouseenter', () => focus(i));
      li.addEventListener('click', () => choose(i));
      list.append(li);
      return li;
    });
    const focus = (i: number, sound = false) => {
      sel = i;
      lis.forEach((li, j) => li.classList.toggle('sel', j === i));
      desc.textContent = items[i]?.desc ?? '';
      lis[i]?.scrollIntoView({ block: 'nearest' });
      if (sound) sfx('menu');
      opts.onFocus?.(i);
    };
    const done = (v: number) => {
      pop();
      box.remove();
      resolve(v);
    };
    const choose = (i: number) => {
      if (items[i].disabled) {
        sfx('cancel');
        return;
      }
      sfx('confirm');
      done(i);
    };
    const pop = pushKeys((e) => {
      if (isUp(e)) {
        e.preventDefault();
        focus((sel - 1 + items.length) % items.length, true);
      } else if (isDown(e)) {
        e.preventDefault();
        focus((sel + 1) % items.length, true);
      } else if (isOk(e) && !e.repeat) {
        e.preventDefault();
        choose(sel);
      } else if (opts.tabs && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'a' || e.key === 'd')) {
        e.preventDefault();
        sfx('menu');
        done(e.key === 'ArrowLeft' || e.key === 'a' ? TAB_PREV : TAB_NEXT);
      } else if (isBack(e) && opts.cancel !== false && !e.repeat) {
        e.preventDefault();
        sfx('cancel');
        done(-1);
      }
    });
    container.append(box);
    if (items.length) focus(sel);
  });
}

/** Menú dentro de una ventana modal centrada. */
export async function modalMenu(title: string, items: MenuItem[], opts: MenuOpts & { info?: HTMLElement } = {}): Promise<number> {
  const overlay = h('div', 'overlay');
  const panel = h('div', 'panel modal-panel');
  // Con texto informativo, el título va arriba del todo y no entre el texto y las opciones.
  if (opts.info) {
    if (title) panel.append(h('div', 'menu-title', title));
    panel.append(opts.info);
  }
  overlay.append(panel);
  modalRoot().append(overlay);
  const r = await menu(panel, items, { ...opts, title: opts.info ? undefined : title });
  overlay.remove();
  return r;
}

export async function confirm(text: string, yes = 'Sí', no = 'No'): Promise<boolean> {
  const info = h('p', 'modal-text', text);
  return (await modalMenu('', [{ label: yes }, { label: no }], { info })) === 0;
}

export async function alertBox(title: string, lines: string[]): Promise<void> {
  const info = h('div', 'modal-text', ...lines.map((l) => h('p', '', l)));
  await modalMenu(title, [{ label: 'Continuar' }], { info, cancel: true });
}

// ---------------------------------------------------------------- diálogo

export function dialogue(lines: Line[]): Promise<void> {
  return new Promise((resolve) => {
    if (!lines.length) return resolve();
    const overlay = h('div', 'overlay dialogue-overlay');
    const box = h('div', 'dialogue');
    const portrait = h('div', 'dialogue-portrait');
    const name = h('div', 'dialogue-name');
    const text = h('div', 'dialogue-text');
    const hint = h('div', 'dialogue-hint', '▼');
    box.append(portrait, h('div', 'dialogue-body', name, text), hint);
    overlay.append(box);
    modalRoot().append(overlay);
    let i = 0;
    let typing: number | null = null;
    let full = '';
    const show = () => {
      const l = lines[i];
      const base = SPEAKERS[l.who] ?? { name: l.who, sprite: '' };
      const sp = { name: l.name ?? base.name, sprite: l.sprite ?? base.sprite };
      portrait.replaceChildren(...(sp.sprite ? [img(sp.sprite, 5, 'portrait')] : []));
      portrait.style.display = sp.sprite ? '' : 'none';
      name.textContent = sp.name;
      box.classList.toggle('narration', !sp.name);
      full = l.text;
      let n = 0;
      text.textContent = '';
      if (typing) clearInterval(typing);
      typing = window.setInterval(() => {
        n += 2;
        text.textContent = full.slice(0, n);
        if (n >= full.length && typing) {
          clearInterval(typing);
          typing = null;
        }
      }, 16);
    };
    const advance = () => {
      if (typing) {
        clearInterval(typing);
        typing = null;
        text.textContent = full;
        return;
      }
      sfx('menu');
      i++;
      if (i >= lines.length) {
        pop();
        overlay.remove();
        resolve();
      } else show();
    };
    const pop = pushKeys((e) => {
      if ((isOk(e) || isBack(e)) && !e.repeat) {
        e.preventDefault();
        advance();
      }
    });
    overlay.addEventListener('click', advance);
    show();
  });
}

// ---------------------------------------------------------------- aviso breve

export function toast(text: string): void {
  const t = h('div', 'toast', text);
  modalRoot().append(t);
  setTimeout(() => t.classList.add('out'), 2200);
  setTimeout(() => t.remove(), 2700);
}
