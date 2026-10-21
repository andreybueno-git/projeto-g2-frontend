import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { Low, Memory } from 'lowdb';
import { createApp } from 'json-server/lib/app.js';
import {
  criarTarefa, atualizarTarefa, buscarTarefa,
  criarProjeto, atualizarProjeto, buscarProjeto, ErroApi,
} from '../src/lib/servicos/api.ts';

test('escritas da API funcionam por HTTP com o json-server instalado', { timeout: 15_000 }, async (t) => {
  // O banco existe somente na memória; nenhum db.json é lido ou alterado.
  const banco = new Low(new Memory(), { projetos: [], tarefas: [] });
  const app = createApp(banco);
  const servidor = createServer(app.handler.bind(app));

  t.after(async () => {
    if (!servidor.listening) return;
    await new Promise((resolve, reject) => {
      servidor.close((erro) => erro ? reject(erro) : resolve());
      servidor.closeAllConnections();
    });
  });

  // A porta 0 escolhe uma porta livre sem ocupar os servidores de desenvolvimento.
  servidor.listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  const endereco = servidor.address();
  assert.ok(endereco && typeof endereco === 'object');

  // Mantém o fetch HTTP real e muda apenas o destino local usado pelo módulo.
  const fetchHttp = globalThis.fetch.bind(globalThis);
  t.mock.method(globalThis, 'fetch', (entrada, opcoes) => {
    const destino = new URL(entrada);
    assert.equal(destino.origin, 'http://localhost:3000');
    destino.host = `127.0.0.1:${endereco.port}`;
    return fetchHttp(destino, opcoes);
  });

  let projetoCriado;

  await t.test('criar e atualizar projeto devolvem o registro completo e preservam campos', async () => {
    const dados = {
      nome: 'Projeto de integração', descricao: 'Banco somente em memória',
      disciplina: 'Desenvolvimento Frontend', criadoEm: '2026-10-21',
    };
    projetoCriado = await criarProjeto(dados);
    assert.equal(typeof projetoCriado.id, 'string');
    assert.ok(projetoCriado.id.length > 0);
    assert.deepEqual(projetoCriado, { ...dados, id: projetoCriado.id });

    const esperado = { ...projetoCriado, nome: 'Projeto atualizado' };
    assert.deepEqual(await atualizarProjeto(projetoCriado.id, { nome: esperado.nome }), esperado);
    assert.deepEqual(await buscarProjeto(projetoCriado.id), esperado);
    assert.equal(banco.data.projetos.length, 1);
  });

  await t.test('criar e atualizar tarefa preservam projeto, id e campos não enviados no PATCH', async () => {
    const dados = {
      projetoId: projetoCriado.id, titulo: 'Estudar integração HTTP',
      descricao: 'Conferir criação, atualização e persistência em memória',
      status: 'a-fazer', prioridade: 'media', responsavel: 'Andrey', prazo: '2026-10-31',
    };
    const criada = await criarTarefa(dados);
    assert.equal(typeof criada.id, 'string');
    assert.ok(criada.id.length > 0);
    assert.deepEqual(criada, { ...dados, id: criada.id });

    const esperado = { ...criada, status: 'concluida', prioridade: 'alta' };
    assert.deepEqual(await atualizarTarefa(criada.id, {
      status: esperado.status, prioridade: esperado.prioridade,
    }), esperado);
    assert.deepEqual(await buscarTarefa(criada.id), esperado);
    assert.equal(banco.data.tarefas.length, 1);
  });

  await t.test('atualizar identificadores inexistentes propaga 404 sem criar registros', async () => {
    const antes = structuredClone(banco.data);
    const eh404 = (erro) => erro instanceof ErroApi && erro.status === 404;
    await assert.rejects(atualizarTarefa('tarefa-inexistente', { titulo: 'Não criar' }), eh404);
    await assert.rejects(atualizarProjeto('projeto-inexistente', { nome: 'Não criar' }), eh404);
    assert.deepEqual(banco.data, antes);
  });
});
