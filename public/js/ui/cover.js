// Сгенерированные обложки игр (§6.1): цвет из cover.color (атрибутом fill), иконка и название.
import { svg } from './dom.js';

/** Иконки в системе координат 24×24: список контуров для каждого значения COVER_ICONS. */
const ICONS = {
  hex: ['M12 2l8.66 5v10L12 22l-8.66-5V7z'],
  tile: ['M3 3h8v8H3z', 'M13 3h8v8h-8z', 'M3 13h8v8H3z', 'M13 13h8v8h-8z'],
  train: [
    'M7 3h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM7 6v5h10V6zM8 13.5a1.5 1.5 0 1 0 0 .01zM16 13.5a1.5 1.5 0 1 0 0 .01z',
    'M7 19h2.5l-1.5 3H5.5zM14.5 19H17l1.5 3H16z',
  ],
  cards: ['M3.5 7.2l7.7-2.1 3.6 13.5-7.7 2.1z', 'M12 3h8v14h-8z'],
  bird: ['M2 11c2.5-.5 4.5-3 8.5-3 2.6 0 4 1.3 5 2.6L21 9.5l-3 3.2C18 17 14.5 20 9.5 20 6.5 20 4.4 18.8 3.5 17c3 0 5-1 6-3-3.4 0-6-1.2-7.5-3z'],
  gem: ['M7 3h10l4.5 6L12 21.5 2.5 9z'],
  planet: ['M12 6a6 6 0 1 0 .01 0z', 'M1.5 15.5c-.6-1.6 4-4.3 10.2-6s11-1.6 10.6 0c-.3 1-2.4 2.3-5.5 3.6l-.3-1.6c1.4-.6 2.6-1.2 3-1.6-1.2-.4-4.2 0-7.5.9S4.5 13.6 3.5 14.6c1 .3 3.7.1 6.6-.5l.8 1.6c-4.8 1.1-8.9 1-9.4-.2z'],
  virus: [
    'M12 6.5a5.5 5.5 0 1 0 .01 0z',
    'M11 1.5h2v4h-2zM11 18.5h2v4h-2zM1.5 11h4v2h-4zM18.5 11h4v2h-4z',
    'M5 3.6l1.4-1.4 2.8 2.8-1.4 1.4zM15.8 19l1.4-1.4 2.8 2.8-1.4 1.4zM3.6 19l2.8-2.8 1.4 1.4L5 20.4zM16.2 5l2.8-2.8 1.4 1.4-2.8 2.8z',
  ],
  dice: ['M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM8 6.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3zM12 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3zM16 14.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3z'],
  meeple: ['M12 2a3 3 0 0 1 3 3c0 1-.4 1.8-1 2.4 3.4.4 7.5 1.6 7.5 4 0 1.1-1.3 1.6-3.3 1.6L21 21h-6.5L12 17l-2.5 4H3l2.8-8C3.8 13 2.5 12.5 2.5 11.4c0-2.4 4.1-3.6 7.5-4-.6-.6-1-1.4-1-2.4a3 3 0 0 1 3-3z'],
  castle: ['M3 21V8h3V4.5h2.5V8h2V4.5h3V8h2V4.5H18V8h3v13h-6.5v-4.5a2.5 2.5 0 0 0-5 0V21z'],
  leaf: ['M20.5 3C10 3 4 7.5 4 15c0 1.8.4 3.4 1.1 4.6L3.5 22h2.2l1-1.4C8.2 21.5 10 22 12 22c7.5 0 9.5-8 8.5-19zM7.5 18.5c1.5-4 4.5-7.5 9-10-3.5 3-6 6.5-7.5 10.5z'],
};

const VIEW_W = 400;
const VIEW_H = 300;
const LINE_CHARS = 20;
const MAX_LINES = 2;

/** Разбивает название на строки для обложки (не больше двух, с многоточием). */
function wrapTitle(title) {
  const lines = [];
  let current = '';
  for (const word of title.split(/\s+/)) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= LINE_CHARS || current === '') current = next;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length > MAX_LINES) {
    lines.length = MAX_LINES;
    lines[MAX_LINES - 1] = `${lines[MAX_LINES - 1].slice(0, LINE_CHARS - 1)}…`;
  }
  return lines.map((line) => (line.length > LINE_CHARS + 4 ? `${line.slice(0, LINE_CHARS + 3)}…` : line));
}

function renderIcon(name, x, y, size) {
  const paths = ICONS[name] ?? ICONS.dice;
  return svg(
    'g',
    { transform: `translate(${x} ${y}) scale(${size / 24})`, fill: '#FFFFFF', 'fill-opacity': '0.92', 'fill-rule': 'evenodd' },
    paths.map((d) => svg('path', { d })),
  );
}

/**
 * Обложка игры.
 * @param {{ title: string, cover: { color: string, icon: string } }} game
 * @param {{ size?: 'card' | 'mini' }} [options] — mini: только цвет и иконка, без названия
 * @returns {SVGElement}
 */
export function renderCover(game, { size = 'card' } = {}) {
  const isMini = size === 'mini';
  const children = [svg('rect', { width: VIEW_W, height: VIEW_H, fill: game.cover.color })];

  if (isMini) {
    children.push(renderIcon(game.cover.icon, 110, 60, 180));
  } else {
    const lines = wrapTitle(game.title);
    const bandHeight = 40 + lines.length * 34;
    children.push(
      renderIcon(game.cover.icon, 150, 36, 100),
      svg('rect', { y: VIEW_H - bandHeight, width: VIEW_W, height: bandHeight, fill: '#000000', 'fill-opacity': '0.38' }),
      svg(
        'text',
        { class: 'cover__title', x: VIEW_W / 2, y: VIEW_H - bandHeight + 46, 'text-anchor': 'middle', fill: '#FFFFFF' },
        lines.map((line, i) => svg('tspan', { x: VIEW_W / 2, dy: i === 0 ? 0 : 34 }, line)),
      ),
    );
  }

  return svg(
    'svg',
    {
      class: ['cover', isMini && 'cover--mini'].filter(Boolean).join(' '),
      viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
      role: 'img',
      'aria-label': `Обложка: ${game.title}`,
      focusable: 'false',
    },
    children,
  );
}
