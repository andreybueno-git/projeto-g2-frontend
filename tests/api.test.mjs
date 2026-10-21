import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarTarefa, listarProjetos, ErroApi } from '../src/lib/servicos/api.ts';

test('criarTarefa envia JSON sem id e devolve o registro criado', async (t) => {
  const dados = { projetoId: 'p-1', titulo: 'Estudar Svelte', descricao: 'Rotas e formulários', status: 'a-fazer', prioridade: 'media', responsavel: 'Andrey', prazo: '2026-10-31' };
  t.mock.method(globalThis, 'fetch', async (url, opcoes) => {
    assert.equal(url, 'http://localhost:3000/tarefas');
    assert.equal(opcoes.method, 'POST');
    assert.equal(opcoes.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(opcoes.body), dados);
    assert.equal('id' in JSON.parse(opcoes.body), false);
    return new Response(JSON.stringify({ ...dados, id: 'nova-id' }), { status: 201 });
  });
  assert.deepEqual(await criarTarefa(dados), { ...dados, id: 'nova-id' });
});

test('leituras existentes continuam como GET', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, opcoes) => {
    assert.equal(url, 'http://localhost:3000/projetos');
    assert.equal(opcoes, undefined);
    return new Response('[]');
  });
  assert.deepEqual(await listarProjetos(), []);
});

test('falha no POST mantém o status HTTP em ErroApi', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('Indisponível', { status: 503 }));
  await assert.rejects(criarTarefa({}), (erro) => erro instanceof ErroApi && erro.status === 503);
});
