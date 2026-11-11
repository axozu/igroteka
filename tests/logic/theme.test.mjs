import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, THEME_LABELS, isTheme, nextTheme } from '../../public/js/logic/theme.js';

test('варианты темы и подписи', () => {
  assert.deepEqual(THEMES, ['system', 'light', 'dark']);
  assert.deepEqual(THEME_LABELS, {
    system: 'Тема: как в системе',
    light: 'Тема: светлая',
    dark: 'Тема: тёмная',
  });
});

test('isTheme: только известные значения', () => {
  for (const t of THEMES) assert.equal(isTheme(t), true);
  for (const bad of ['auto', '', null, undefined, 1, {}, ['dark'], '__proto__', 'constructor']) assert.equal(isTheme(bad), false, String(bad));
});

test('nextTheme: system → light → dark → system', () => {
  assert.equal(nextTheme('system'), 'light');
  assert.equal(nextTheme('light'), 'dark');
  assert.equal(nextTheme('dark'), 'system');
  assert.equal(nextTheme('evil'), 'light', 'неизвестное значение — как system');
});
