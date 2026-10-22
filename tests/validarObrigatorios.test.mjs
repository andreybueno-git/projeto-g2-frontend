import { test } from 'node:test';
import assert from 'node:assert/strict';
import { textoObrigatorioValido } from '../src/lib/utils/validarObrigatorios.ts';

test('campos obrigatórios recusam vazio e diferentes espaços', () => {
  for (const valor of ['', ' ', '   ', '\t', '\n', '\r\n', '\u00a0', ' \t\n ']) {
    assert.equal(textoObrigatorioValido(valor), false, JSON.stringify(valor));
  }
});

test('texto real é aceito sem modificar o conteúdo digitado', () => {
  for (const valor of ['Estudar Svelte', ' Andrey ', 'ação', '0', 'Linha 1\nLinha 2']) {
    const antes = valor;
    assert.equal(textoObrigatorioValido(valor), true);
    assert.equal(valor, antes);
  }
});
