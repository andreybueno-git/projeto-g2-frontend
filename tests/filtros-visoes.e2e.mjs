// Execute após npm run build, com Playwright disponível (ou PLAYWRIGHT_MODULE).
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origem = 'http://127.0.0.1:4174';
const vite = spawn(process.execPath, [
  'node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1',
  '--port', '4174', '--strictPort',
], { windowsHide: true, stdio: 'ignore' });
const encerrado = once(vite, 'exit');
const base = {
  projetoId: 'projeto-teste', descricao: 'Dado fictício',
  responsavel: 'Pessoa de teste', prazo: '2026-10-30',
};
let tarefas = [
  { ...base, id: '1', titulo: 'Relatório inicial', status: 'a-fazer', prioridade: 'alta' },
  { ...base, id: '2', titulo: 'Relatório final', status: 'em-revisao', prioridade: 'alta' },
  { ...base, id: '3', titulo: 'Relatório parcial', status: 'em-revisao', prioridade: 'media' },
  { ...base, id: '4', titulo: 'Preparar apresentação', status: 'em-andamento', prioridade: 'alta' },
  { ...base, id: '5', titulo: 'Revisar código', status: 'em-revisao', prioridade: 'alta' },
  { ...base, id: '6', titulo: 'Organizar arquivos', status: 'concluida', prioridade: 'baixa' },
];
let navegador;
try {
  let pronto = false;
  for (let tentativa = 0; tentativa < 60; tentativa++) {
    assert.equal(vite.exitCode, null, 'O preview encerrou antes de iniciar');
    try { pronto = (await fetch(origem)).ok; } catch {}
    if (pronto) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(pronto, 'O preview não iniciou');
  navegador = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
  });
  const pagina = await navegador.newPage({ viewport: { width: 1440, height: 1000 } });
  pagina.setDefaultTimeout(5000);
  const erros = [];
  pagina.on('pageerror', (erro) => erros.push(erro.message));
  let falharLeitura = false;
  let falharPatch = false;
  const patches = [];

  // Intercepta somente a API local: não lê/grava db.json nem exige API em execução.
  await pagina.route('http://localhost:3000/**', async (rota) => {
    const pedido = rota.request();
    const caminho = new URL(pedido.url()).pathname;
    if (pedido.method() === 'GET' && caminho === '/tarefas') {
      await rota.fulfill({ status: falharLeitura ? 500 : 200, json: tarefas });
    } else if (pedido.method() === 'PATCH' && caminho.startsWith('/tarefas/')) {
      const dados = pedido.postDataJSON();
      patches.push({ caminho, dados });
      if (falharPatch) return rota.fulfill({ status: 500, json: {} });
      const tarefa = tarefas.find((item) => item.id === caminho.split('/').at(-1));
      assert.ok(tarefa);
      Object.assign(tarefa, dados);
      await rota.fulfill({ json: tarefa });
    } else {
      throw new Error(`Requisição inesperada: ${pedido.method()} ${caminho}`);
    }
  });

  const busca = pagina.locator('#busca');
  const status = pagina.locator('#filtro-status');
  const prioridade = pagina.locator('#filtro-prioridade');
  const limpar = pagina.getByRole('button', { name: 'Limpar filtros' });
  const visoes = pagina.getByRole('navigation', { name: 'Visão das tarefas' });
  const coluna = (valor) => pagina.locator(`section.coluna.${valor}`);
  const seletor = (id) => pagina.locator(`[id="status-tarefa-${id}"]`);
  async function conferirCartoes(ids) {
    await pagina.waitForFunction((esperados) => {
      const atuais = [...document.querySelectorAll('.cartao select')]
        .map((elemento) => elemento.id.replace('status-tarefa-', '')).sort();
      return JSON.stringify(atuais) === JSON.stringify(esperados);
    }, [...ids].sort());
  }
  async function conferirFiltros(termo, situacao, urgencia) {
    assert.equal(await busca.inputValue(), termo);
    assert.equal(await status.inputValue(), situacao);
    assert.equal(await prioridade.inputValue(), urgencia);
  }
  async function alternar(nome) {
    await visoes.getByRole('link', { name: nome, exact: true }).click();
    await pagina.waitForURL(`${origem}${nome === 'Quadro' ? '/quadro' : '/'}`);
    await busca.waitFor();
    assert.equal(await visoes.getByRole('link', { name: nome, exact: true })
      .getAttribute('aria-current'), 'page');
  }

  await pagina.goto(origem);
  await busca.waitFor();
  await conferirCartoes(['1', '2', '3', '4', '5', '6']);
  await busca.fill('  RELATORIO ');
  await status.selectOption('em-revisao');
  await prioridade.selectOption('alta');
  await conferirCartoes(['2']);
  await alternar('Quadro');
  await conferirFiltros('  RELATORIO ', 'em-revisao', 'alta');
  await conferirCartoes(['2']);
  assert.equal(await pagina.locator('section.coluna').count(), 4);
  assert.equal((await coluna('em-revisao').locator('.contagem').textContent()).trim(), '1');
  assert.equal((await coluna('a-fazer').locator('.contagem').textContent()).trim(), '0');
  assert.match(await pagina.locator('.resumo').textContent(), /Mostrando 1 de 6 tarefas/);

  // Alterações feitas no quadro voltam para a lista; não há estado por página.
  await status.selectOption('a-fazer');
  await conferirCartoes(['1']);
  await alternar('Lista');
  await conferirFiltros('  RELATORIO ', 'a-fazer', 'alta');
  await conferirCartoes(['1']);
  await pagina.goBack();
  await busca.waitFor();
  await conferirCartoes(['1']);
  await conferirFiltros('  RELATORIO ', 'a-fazer', 'alta');
  await pagina.goForward();
  await busca.waitFor();
  await conferirCartoes(['1']);
  await alternar('Quadro');

  // Sem resultados mantém as quatro colunas e permite limpar os filtros.
  await busca.fill('inexistente');
  await pagina.getByText('Nenhuma tarefa encontrada com esses filtros.', { exact: true }).waitFor();
  await conferirCartoes([]);
  assert.equal(await pagina.locator('section.coluna').count(), 4);
  assert.deepEqual((await pagina.locator('.contagem').allTextContents()).map((texto) => texto.trim()), ['0', '0', '0', '0']);
  await limpar.click();
  await conferirCartoes(['1', '2', '3', '4', '5', '6']);
  await conferirFiltros('', 'todos', 'todas');
  assert.equal(await limpar.isDisabled(), true);
  await alternar('Lista');
  await conferirFiltros('', 'todos', 'todas');
  await alternar('Quadro');

  // Regressão da issue 29: PATCH continua restrito ao status e respeita o filtro.
  await busca.fill('relatorio');
  await status.selectOption('a-fazer');
  await prioridade.selectOption('alta');
  const antes = structuredClone(tarefas[0]);
  await seletor('1').selectOption('concluida');
  await conferirCartoes([]);
  assert.deepEqual(patches.at(-1), { caminho: '/tarefas/1', dados: { status: 'concluida' } });
  assert.deepEqual(tarefas[0], { ...antes, status: 'concluida' });
  assert.equal(await busca.evaluate((elemento) => elemento === document.activeElement), true);
  await status.selectOption('todos');
  await conferirCartoes(['1', '2']);
  await coluna('concluida').locator('[id="status-tarefa-1"]').waitFor();
  falharPatch = true;
  await seletor('1').selectOption('em-andamento');
  await pagina.getByRole('alert').waitFor();
  assert.equal(await seletor('1').inputValue(), 'concluida');
  assert.equal(tarefas[0].status, 'concluida');
  falharPatch = false;
  await seletor('1').selectOption('em-andamento');
  await coluna('em-andamento').locator('[id="status-tarefa-1"]').waitFor();
  assert.equal(await seletor('1').evaluate((elemento) => elemento === document.activeElement), true);

  // Falha de carregamento e nova tentativa não apagam o estado compartilhado.
  await alternar('Lista');
  falharLeitura = true;
  await visoes.getByRole('link', { name: 'Quadro', exact: true }).click();
  await pagina.getByRole('alert').waitFor();
  falharLeitura = false;
  await pagina.getByRole('button', { name: 'Tentar novamente' }).click();
  await busca.waitFor();
  await conferirFiltros('relatorio', 'todos', 'alta');
  await conferirCartoes(['1', '2']);
  await pagina.setViewportSize({ width: 390, height: 844 });
  assert.equal(await pagina.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

  // Recarregar reinicia filtros, conforme o contrato do estado em memória.
  await pagina.reload();
  await busca.waitFor();
  await conferirFiltros('', 'todos', 'todas');
  await conferirCartoes(['1', '2', '3', '4', '5', '6']);
  tarefas = [];
  await pagina.reload();
  await pagina.getByText('Nenhuma tarefa cadastrada.', { exact: true }).waitFor();
  assert.equal(await pagina.locator('section.coluna').count(), 4);
  assert.deepEqual(erros, []);
  console.log('Issues 26/28: filtros combinados, alternância, histórico, limpeza, colunas vazias, PATCH, falha/nova tentativa, recarga e celular: OK');
} finally {
  await navegador?.close();
  vite.kill();
  await encerrado;
}
