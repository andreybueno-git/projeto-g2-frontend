import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filtrarTarefas, normalizarTexto } from '../src/lib/utils/filtrarTarefas.ts';

const base = { projetoId: '1', descricao: '', responsavel: 'Ana', prazo: '2026-10-30' };
const tarefas = [
  { ...base, id: '1', titulo: 'Implementar layout responsivo', status: 'a-fazer', prioridade: 'alta' },
  { ...base, id: '2', titulo: 'Revisar funções em Python', status: 'em-andamento', prioridade: 'media' },
  { ...base, id: '3', titulo: 'Corrigir relatório de redes', status: 'em-revisao', prioridade: 'media' },
  { ...base, id: '4', titulo: 'Resolver lista de lógica', status: 'concluida', prioridade: 'baixa' },
];
const sem = { busca: '', status: 'todos', prioridade: 'todas' };
const ids = (lista) => lista.map((tarefa) => tarefa.id);

test('sem busca nem filtros, todas as tarefas aparecem na ordem original', () => {
  assert.deepEqual(ids(filtrarTarefas(tarefas, sem)), ['1', '2', '3', '4']);
});

test('a busca ignora maiúsculas, acentos e espaços nas pontas', () => {
  assert.deepEqual(ids(filtrarTarefas(tarefas, { ...sem, busca: '  RELATORIO ' })), ['3']);
  assert.deepEqual(ids(filtrarTarefas(tarefas, { ...sem, busca: 'funcoes' })), ['2']);
  assert.deepEqual(ids(filtrarTarefas(tarefas, { ...sem, busca: 'LÓGICA' })), ['4']);
});

test('a busca procura em qualquer parte do título', () => {
  assert.deepEqual(ids(filtrarTarefas(tarefas, { ...sem, busca: 'ementar' })), ['1']);
  assert.deepEqual(ids(filtrarTarefas(tarefas, { ...sem, busca: 'ython' })), ['2']);
});

test('filtra por status', () => {
  assert.deepEqual(ids(filtrarTarefas(tarefas, { ...sem, status: 'em-revisao' })), ['3']);
});

test('filtra por prioridade', () => {
  assert.deepEqual(ids(filtrarTarefas(tarefas, { ...sem, prioridade: 'media' })), ['2', '3']);
});

test('busca, status e prioridade se combinam: a tarefa precisa passar por todos', () => {
  const criterios = { busca: 're', status: 'em-revisao', prioridade: 'media' };
  assert.deepEqual(ids(filtrarTarefas(tarefas, criterios)), ['3']);
  assert.deepEqual(ids(filtrarTarefas(tarefas, { ...criterios, prioridade: 'alta' })), []);
});

test('sem resultados devolve lista vazia e não altera a original', () => {
  const copia = structuredClone(tarefas);
  assert.deepEqual(filtrarTarefas(tarefas, { ...sem, busca: 'inexistente' }), []);
  assert.deepEqual(tarefas, copia);
  assert.notEqual(filtrarTarefas(tarefas, sem), tarefas);
});

test('normalizarTexto remove acentos e espaços e usa minúsculas', () => {
  assert.equal(normalizarTexto('  Ação Rápida '), 'acao rapida');
});
