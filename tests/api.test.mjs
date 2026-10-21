import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  criarTarefa, atualizarTarefa, criarProjeto, atualizarProjeto,
  listarTarefas, buscarTarefa, listarProjetos, buscarProjeto,
  buscarProjetoComTarefas, ErroApi,
} from '../src/lib/servicos/api.ts';

const tarefa = {
  projetoId: 'p-1', titulo: 'Estudar Svelte', descricao: 'Rotas e formulários',
  status: 'a-fazer', prioridade: 'media', responsavel: 'Andrey', prazo: '2026-10-31',
};
const projeto = {
  nome: 'Projeto de estudo', descricao: 'Estudo da API',
  disciplina: 'Frontend', criadoEm: '2026-10-21',
};
const id = 'id com/espaço';
const idCodificado = encodeURIComponent(id);
const escritas = [
  { nome: 'criarTarefa', executar: () => criarTarefa(tarefa), caminho: '/tarefas', metodo: 'POST', dados: tarefa, retorno: { ...tarefa, id: 't-1' } },
  { nome: 'atualizarTarefa', executar: () => atualizarTarefa(id, { status: 'concluida' }), caminho: `/tarefas/${idCodificado}`, metodo: 'PATCH', dados: { status: 'concluida' }, retorno: { ...tarefa, id, status: 'concluida' } },
  { nome: 'criarProjeto', executar: () => criarProjeto(projeto), caminho: '/projetos', metodo: 'POST', dados: projeto, retorno: { ...projeto, id: 'p-1' } },
  { nome: 'atualizarProjeto', executar: () => atualizarProjeto(id, { nome: 'Novo nome' }), caminho: `/projetos/${idCodificado}`, metodo: 'PATCH', dados: { nome: 'Novo nome' }, retorno: { ...projeto, id, nome: 'Novo nome' } },
];

for (const caso of escritas) {
  test(`${caso.nome}: método, endereço, JSON sem id e registro retornado`, async (t) => {
    t.mock.method(globalThis, 'fetch', async (url, opcoes) => {
      assert.equal(url, `http://localhost:3000${caso.caminho}`);
      assert.equal(opcoes.method, caso.metodo);
      assert.equal(opcoes.headers['Content-Type'], 'application/json');
      assert.deepEqual(JSON.parse(opcoes.body), caso.dados);
      assert.equal('id' in JSON.parse(opcoes.body), false);
      return new Response(JSON.stringify(caso.retorno), { status: caso.metodo === 'POST' ? 201 : 200 });
    });
    assert.deepEqual(await caso.executar(), caso.retorno);
  });

  test(`${caso.nome}: erro HTTP conserva o status em ErroApi`, async (t) => {
    t.mock.method(globalThis, 'fetch', async () => new Response('Indisponível', { status: 503 }));
    await assert.rejects(caso.executar(), (erro) => erro instanceof ErroApi && erro.status === 503);
  });
}

const leituras = [
  { nome: 'listarTarefas', executar: () => listarTarefas(), caminho: '/tarefas', retorno: [] },
  { nome: 'buscarTarefa', executar: () => buscarTarefa(id), caminho: `/tarefas/${idCodificado}`, retorno: { ...tarefa, id } },
  { nome: 'listarProjetos', executar: () => listarProjetos(), caminho: '/projetos', retorno: [] },
  { nome: 'buscarProjeto', executar: () => buscarProjeto(id), caminho: `/projetos/${idCodificado}`, retorno: { ...projeto, id } },
  { nome: 'buscarProjetoComTarefas', executar: () => buscarProjetoComTarefas(id), caminho: `/projetos/${idCodificado}?_embed=tarefas`, retorno: { ...projeto, id, tarefas: [] } },
];
for (const caso of leituras) {
  test(`${caso.nome}: leitura existente continua como GET`, async (t) => {
    t.mock.method(globalThis, 'fetch', async (url, opcoes) => {
      assert.equal(url, `http://localhost:3000${caso.caminho}`);
      assert.equal(opcoes, undefined);
      return new Response(JSON.stringify(caso.retorno));
    });
    assert.deepEqual(await caso.executar(), caso.retorno);
  });
}

test('falha de conexão continua sendo rejeitada para a tela tratar', async (t) => {
  const erro = new TypeError('Failed to fetch');
  t.mock.method(globalThis, 'fetch', async () => { throw erro; });
  await assert.rejects(criarProjeto(projeto), (recebido) => recebido === erro);
});
