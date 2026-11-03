// Execute após npm run build, com Playwright disponível (ou PLAYWRIGHT_MODULE).
// A API é inteiramente interceptada: nenhum teste altera o db.json da equipe.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origem = 'http://127.0.0.1:4175';
const evidencias = process.env.EVIDENCE_DIR;
const vite = spawn(process.execPath, [
  'node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1',
  '--port', '4175', '--strictPort',
], { windowsHide: true, stdio: 'ignore' });
const encerrado = once(vite, 'exit');

const projetos = [
  { id: '1', nome: 'Projeto de interface', descricao: 'Dados fictícios para teste.', disciplina: 'Frontend', criadoEm: '2026-10-20' },
  { id: '2', nome: 'Projeto de pesquisa', descricao: 'Segundo projeto fictício.', disciplina: 'Pesquisa', criadoEm: '2026-10-21' },
];
const base = { descricao: 'Dado fictício', responsavel: 'Pessoa de teste', prazo: '2026-11-03', prioridade: 'alta' };
const iniciais = [
  { ...base, id: '1', projetoId: '1', titulo: 'Revisar a interface e os estados das tarefas', status: 'a-fazer' },
  { ...base, id: '2', projetoId: '1', titulo: 'Preparar apresentação', status: 'em-revisao' },
  { ...base, id: '3', projetoId: '2', titulo: 'Organizar referências', status: 'concluida' },
];
let tarefas = structuredClone(iniciais);
let navegador;

function portao() {
  let liberar;
  const promessa = new Promise((resolve) => { liberar = resolve; });
  return { promessa, liberar };
}

try {
  let pronto = false;
  for (let tentativa = 0; tentativa < 60; tentativa++) {
    assert.equal(vite.exitCode, null, 'O preview encerrou antes de iniciar');
    try { pronto = (await fetch(origem)).ok; } catch {}
    if (pronto) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(pronto, 'O preview não iniciou');
  if (evidencias) await mkdir(evidencias, { recursive: true });
  navegador = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
  });
  const pagina = await navegador.newPage({ viewport: { width: 1440, height: 1000 } });
  pagina.setDefaultTimeout(5000);
  const erros = [];
  pagina.on('pageerror', (erro) => erros.push(erro.message));
  const deletes = [];
  const falhasLeitura = new Map();
  const atrasosLeitura = new Map();
  let falhaExclusao = null;
  let atrasoExclusao = null;
  let exclusaoRecebida = null;
  let statusExclusao = 204;

  await pagina.route('http://localhost:3000/**', async (rota) => {
    const pedido = rota.request();
    const url = new URL(pedido.url());
    const caminho = url.pathname;
    if (pedido.method() === 'DELETE') {
      deletes.push({ caminho, corpo: pedido.postData() });
      exclusaoRecebida?.liberar();
      if (atrasoExclusao) await atrasoExclusao.promessa;
      if (falhaExclusao === 'rede') return rota.abort('failed');
      if (falhaExclusao) return rota.fulfill({ status: falhaExclusao, body: '{}' });
      const id = decodeURIComponent(caminho.split('/').at(-1));
      const tarefa = tarefas.find((item) => item.id === id);
      assert.ok(tarefa, `DELETE inesperado: ${caminho}`);
      tarefas = tarefas.filter((item) => item.id !== id);
      return statusExclusao === 204
        ? rota.fulfill({ status: 204 })
        : rota.fulfill({ status: statusExclusao, json: tarefa });
    }
    assert.equal(pedido.method(), 'GET', `Requisição inesperada: ${pedido.method()} ${caminho}`);
    const falha = falhasLeitura.get(caminho);
    const atraso = atrasosLeitura.get(caminho);
    // Captura a resposta antes da espera para simular uma resposta realmente antiga.
    let dados;
    if (caminho === '/tarefas') dados = structuredClone(tarefas);
    else if (caminho === '/projetos') dados = structuredClone(projetos);
    else if (caminho.startsWith('/tarefas/')) dados = structuredClone(tarefas.find((item) => item.id === caminho.split('/').at(-1)));
    else if (caminho.startsWith('/projetos/')) {
      const projeto = projetos.find((item) => item.id === caminho.split('/').at(-1));
      if (projeto) dados = { ...projeto, ...(url.searchParams.has('_embed') ? { tarefas: structuredClone(tarefas.filter((item) => item.projetoId === projeto.id)) } : {}) };
    } else throw new Error(`GET inesperado: ${caminho}`);
    if (atraso) { atraso.recebido.liberar(); await atraso.responder.promessa; }
    if (falha === 'rede') return rota.abort('failed');
    if (falha) return rota.fulfill({ status: falha, body: '{}' });
    return dados ? rota.fulfill({ json: dados }) : rota.fulfill({ status: 404, body: '{}' });
  });

  const cartao = (id) => pagina.locator('.cartao').filter({ has: pagina.locator(`[id="status-tarefa-${id}"]`) });
  const dialogo = () => pagina.getByRole('dialog', { name: 'Excluir tarefa?', exact: true });
  const confirmar = () => dialogo().getByRole('button', { name: 'Excluir tarefa', exact: true });
  async function capturar(nome) {
    if (evidencias) await pagina.screenshot({ path: resolve(evidencias, nome), fullPage: nome !== '04-confirmacao-mobile.png' });
  }
  async function conferirCartoes(ids) {
    await pagina.waitForFunction((esperados) => {
      const atuais = [...document.querySelectorAll('.cartao select')].map((item) => item.id.replace('status-tarefa-', '')).sort();
      return JSON.stringify(atuais) === JSON.stringify(esperados);
    }, [...ids].sort());
  }
  async function abrirExclusao(id) {
    await cartao(id).getByRole('button', { name: /Excluir tarefa/ }).click();
    await dialogo().waitFor();
    assert.match(await dialogo().textContent(), new RegExp(iniciais.find((item) => item.id === id).titulo));
  }
  async function excluir(id) {
    await abrirExclusao(id);
    await confirmar().click();
    await cartao(id).waitFor({ state: 'detached' });
    await dialogo().waitFor({ state: 'hidden' });
  }

  // Cancelar e Escape não enviam DELETE; o foco retorna ao botão acionador.
  await pagina.goto(origem);
  await conferirCartoes(['1', '2', '3']);
  await abrirExclusao('1');
  assert.equal(await dialogo().getByRole('button', { name: 'Cancelar', exact: true }).evaluate((item) => item === document.activeElement), true);
  await capturar('01-confirmacao-desktop.png');
  await dialogo().getByRole('button', { name: 'Cancelar', exact: true }).click();
  await dialogo().waitFor({ state: 'hidden' });
  assert.equal(deletes.length, 0);
  await pagina.waitForFunction(() => document.activeElement?.closest('.cartao')?.querySelector('[id="status-tarefa-1"]') && document.activeElement.matches('button.excluir'));
  assert.equal(await cartao('1').getByRole('button', { name: /Excluir tarefa/ }).evaluate((item) => item === document.activeElement), true);
  await abrirExclusao('1');
  await pagina.keyboard.press('Escape');
  await dialogo().waitFor({ state: 'hidden' });
  assert.equal(deletes.length, 0);
  await conferirCartoes(['1', '2', '3']);

  // A falha HTTP ou de conexão mantém o item e permite nova tentativa.
  for (const falha of [500, 'rede']) {
    falhaExclusao = falha;
    await abrirExclusao('1');
    const antes = deletes.length;
    await confirmar().click();
    await pagina.getByRole('alert').filter({ hasText: /Não foi possível excluir/ }).waitFor();
    await conferirCartoes(['1', '2', '3']);
    assert.equal(tarefas.length, 3);
    assert.equal(deletes.length, antes + 1);
    if (await dialogo().isVisible()) await dialogo().getByRole('button', { name: 'Cancelar', exact: true }).click();
  }
  falhaExclusao = null;

  // Dois cliques no mesmo turno de JavaScript ainda disparam uma única exclusão.
  atrasoExclusao = portao();
  exclusaoRecebida = portao();
  const antes = deletes.length;
  await abrirExclusao('1');
  await confirmar().evaluate((botao) => { botao.click(); botao.click(); });
  await dialogo().getByRole('button', { name: 'Excluindo...', exact: true }).waitFor();
  assert.equal(await dialogo().getByRole('button', { name: 'Excluindo...', exact: true }).isDisabled(), true);
  assert.equal(await dialogo().getByRole('button', { name: 'Cancelar', exact: true }).isDisabled(), true);
  assert.equal(await cartao('1').locator('select').isDisabled(), true);
  await pagina.keyboard.press('Escape');
  assert.equal(await dialogo().isVisible(), true);
  await conferirCartoes(['1', '2', '3']);
  // O request já foi enviado, mas a resposta continua retida.
  await exclusaoRecebida.promessa;
  assert.equal(deletes.length, antes + 1);
  assert.deepEqual(deletes.at(-1), { caminho: '/tarefas/1', corpo: null });
  atrasoExclusao.liberar();
  atrasoExclusao = null;
  await conferirCartoes(['2', '3']);
  assert.match(await pagina.locator('.resumo').textContent(), /^2 tarefas\./);
  await pagina.reload();
  await conferirCartoes(['2', '3']);
  await capturar('02-lista-apos-exclusao.png');

  // Quadro: a coluna e o total são recalculados. DELETE 200 também é aceito.
  statusExclusao = 200;
  await pagina.goto(`${origem}/quadro`);
  await conferirCartoes(['2', '3']);
  await excluir('2');
  await conferirCartoes(['3']);
  assert.equal((await pagina.locator('section.coluna.em-revisao .contagem').textContent()).trim(), '0');
  assert.match(await pagina.locator('.resumo').textContent(), /^1 tarefa\./);
  await capturar('03-quadro-apos-exclusao.png');

  // Projeto: remover a última tarefa atualiza a contagem e o estado vazio.
  await pagina.goto(`${origem}/projetos/2`);
  await conferirCartoes(['3']);
  await pagina.setViewportSize({ width: 390, height: 844 });
  await abrirExclusao('3');
  assert.equal(await pagina.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await capturar('04-confirmacao-mobile.png');
  await confirmar().click();
  await conferirCartoes([]);
  await pagina.getByText('Este projeto ainda não tem tarefas.', { exact: true }).waitFor();
  assert.equal((await pagina.locator('dl > div').filter({ has: pagina.getByText('Tarefas', { exact: true }) }).locator('dd').textContent()).trim(), '0');
  await capturar('05-projeto-vazio-mobile.png');
  await pagina.goto(origem);
  await pagina.getByText('Nenhuma tarefa cadastrada.', { exact: true }).waitFor();

  // Voltar pelo histórico enquanto o DELETE aguarda não executa callbacks da tela antiga.
  tarefas = structuredClone(iniciais);
  await pagina.goto(origem);
  await conferirCartoes(['1', '2', '3']);
  await pagina.getByRole('navigation', { name: 'Visão das tarefas' }).getByRole('link', { name: 'Quadro', exact: true }).click();
  await pagina.waitForURL(`${origem}/quadro`);
  await conferirCartoes(['1', '2', '3']);
  atrasoExclusao = portao();
  exclusaoRecebida = portao();
  await abrirExclusao('1');
  await confirmar().click();
  await exclusaoRecebida.promessa;
  await pagina.goBack();
  await pagina.waitForURL(`${origem}/`);
  await conferirCartoes(['1', '2', '3']);
  await pagina.locator('#busca').focus();
  const exclusaoAntiga = pagina.waitForResponse((resposta) => resposta.request().method() === 'DELETE');
  atrasoExclusao.liberar();
  atrasoExclusao = null;
  await (await exclusaoAntiga).finished();
  await pagina.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await pagina.locator('#busca').evaluate((item) => item === document.activeElement), true);
  assert.equal(await pagina.locator('dialog[open]').count(), 0);
  assert.deepEqual(erros, []);
  await pagina.reload();
  await conferirCartoes(['2', '3']);

  // Detalhe e edição: 404 é diferente de 500 e falha de rede em ambas as entidades.
  tarefas = structuredClone(iniciais);
  await pagina.setViewportSize({ width: 1440, height: 1000 });
  for (const entidade of ['tarefas', 'projetos']) {
    const inexistente = entidade === 'tarefas' ? 'Tarefa não encontrada.' : 'Projeto não encontrado.';
    const falha = entidade === 'tarefas' ? 'Não foi possível carregar a tarefa.' : 'Não foi possível carregar o projeto.';
    for (const sufixo of ['', '/editar']) {
      await pagina.goto(`${origem}/${entidade}/999${sufixo}`);
      await pagina.getByRole('alert').filter({ hasText: inexistente }).waitFor();
      assert.equal(await pagina.getByText(/^Carregando (tarefa|projeto)\.\.\.$/).count(), 0);
      assert.equal(await pagina.locator('form').count(), 0);
      if (!sufixo) await capturar(`06-${entidade}-nao-encontrado.png`);
      for (const tipo of [500, 'rede']) {
        falhasLeitura.set(`/${entidade}/1`, tipo);
        await pagina.goto(`${origem}/${entidade}/1${sufixo}`);
        await pagina.getByRole('alert').filter({ hasText: falha }).waitFor();
        assert.equal(await pagina.getByText(inexistente, { exact: true }).count(), 0);
        assert.equal(await pagina.getByText(/^Carregando (tarefa|projeto)\.\.\.$/).count(), 0);
      }
      falhasLeitura.delete(`/${entidade}/1`);
    }
  }

  // Links comuns usam o roteador SvelteKit e reutilizam a rota dinâmica.
  async function navegarCliente(caminho) {
    await pagina.evaluate((href) => {
      document.getElementById('navegacao-de-teste')?.remove();
      const link = document.createElement('a');
      link.id = 'navegacao-de-teste'; link.href = href; link.textContent = 'Navegar para outro ID';
      document.body.append(link);
    }, caminho);
    await pagina.locator('#navegacao-de-teste').click();
    await pagina.waitForURL(`${origem}${caminho}`);
  }
  async function conferirRegistro(entidade, id, sufixo) {
    const registro = (entidade === 'tarefas' ? iniciais : projetos).find((item) => item.id === id);
    const nome = entidade === 'tarefas' ? registro.titulo : registro.nome;
    if (sufixo) {
      const seletor = entidade === 'tarefas' ? '#tarefa-titulo' : '#nome';
      await pagina.waitForFunction(({ seletor, nome }) => document.querySelector(seletor)?.value === nome, { seletor, nome });
    } else await pagina.getByRole('heading', { name: nome, exact: true }).waitFor();
  }
  for (const entidade of ['tarefas', 'projetos']) {
    for (const sufixo of ['', '/editar']) {
      await pagina.goto(`${origem}/${entidade}/1${sufixo}`);
      await conferirRegistro(entidade, '1', sufixo);
      await pagina.evaluate(() => { window.__paginaDeTeste = 'mesmo-documento'; });
      await navegarCliente(`/${entidade}/999${sufixo}`);
      await pagina.getByRole('alert').filter({ hasText: /não encontrad/ }).waitFor();
      await navegarCliente(`/${entidade}/2${sufixo}`);
      await conferirRegistro(entidade, '2', sufixo);
      assert.equal(await pagina.evaluate(() => window.__paginaDeTeste), 'mesmo-documento');

      // Respostas antigas (404 ou sucesso) não podem substituir o ID atual.
      for (const idAntigo of ['999', '2']) {
        const atraso = { recebido: portao(), responder: portao() };
        atrasosLeitura.set(`/${entidade}/${idAntigo}`, atraso);
        await navegarCliente(`/${entidade}/${idAntigo}${sufixo}`);
        await atraso.recebido.promessa;
        await navegarCliente(`/${entidade}/1${sufixo}`);
        await conferirRegistro(entidade, '1', sufixo);
        const respostaAntiga = pagina.waitForResponse((resposta) => new URL(resposta.url()).pathname === `/${entidade}/${idAntigo}`);
        atraso.responder.liberar();
        await (await respostaAntiga).finished();
        atrasosLeitura.delete(`/${entidade}/${idAntigo}`);
        await pagina.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await conferirRegistro(entidade, '1', sufixo);
        assert.equal(await pagina.getByRole('alert').count(), 0);
      }
    }
  }
  assert.deepEqual(erros, []);
  console.log('Issues 31/35: cancelar/Escape/foco, confirmação, DELETE único/204/200, falhas sem perder item, lista/quadro/projeto e contagens, celular, 404/500/rede em detalhe/edição, troca de IDs e respostas antigas: OK');
} finally {
  await navegador?.close();
  vite.kill();
  await encerrado;
}
