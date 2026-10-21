import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hojeLocal } from '../src/lib/utils/projetos.ts';

test('hojeLocal usa a data do computador, não a de UTC', (t) => {
  // 23h30 do dia 21 no horário local: em UTC-3 já seria dia 22 em UTC.
  t.mock.timers.enable({ apis: ['Date'], now: new Date(2026, 9, 21, 23, 30) });
  assert.equal(hojeLocal(), '2026-10-21');
});

test('hojeLocal completa mês e dia com zero à esquerda', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date(2026, 0, 5, 8, 0) });
  assert.equal(hojeLocal(), '2026-01-05');
});
