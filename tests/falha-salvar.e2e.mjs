// Issue #36: falha ao salvar e ao excluir.
// Antes: VITE_API_URL=http://localhost:3000 npm run build  (e Playwright disponível, ou PLAYWRIGHT_MODULE).
// A API é interceptada: nenhum teste altera o db.json da equipe.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origem = 'http://127.0.0.1:4176';
const vite = spawn(process.execPath, [
  'node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1',
  '--port', '4176', '--strictPort',
], { windowsHide: true, stdio: 'ignore' });
const encerrado = once(vite, 'exit');

const projetos = [{ id: '1', nome: 'Projeto de interface', descricao: 'Dado fictício.', disciplina: 'Frontend', criadoEm: '2026-10-20' }];
const base = { descricao: 'Dado fictício', responsavel: 'Pessoa de teste', prazo: '2026-11-03', prioridade: 'alta', projetoId: '1', status: 'a-fazer' };
let tarefas = [{ ...base, id: '1', titulo: 'Tarefa de teste' }];
let navegador;

try {
  let pronto = false;
  for (let i = 0; i < 60 && !pronto; i++) {
    assert.equal(vite.exitCode, null, 'O preview encerrou antes de iniciar');
    try { pronto = (await fetch(origem)).ok; } catch {}
    if (!pronto) await new Promise((r) => setTimeout(r, 250));
  }
  assert.ok(pronto, 'O preview não iniciou');
  navegador = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
  });
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 900 } });
  pagina.setDefaultTimeout(5000);
  const erros = [];
  pagina.on('pageerror', (e) => erros.push(e.message));

  // Próxima resposta de escrita: 'rede', um status HTTP, ou null para a API normal.
  let falhaEscrita = null;
  await pagina.route('http://localhost:3000/**', async (rota) => {
    const pedido = rota.request();
    const caminho = new URL(pedido.url()).pathname;
    const metodo = pedido.method();
    const idDaUrl = caminho.split('/').at(-1);
    if (metodo !== 'GET') {
      if (falhaEscrita === 'rede') return rota.abort('failed');
      if (falhaEscrita) return rota.fulfill({ status: falhaEscrita, body: '{}' });
      if (metodo === 'DELETE') {
        tarefas = tarefas.filter((t) => t.id !== idDaUrl);
        return rota.fulfill({ status: 204 });
      }
      const corpo = pedido.postDataJSON();
      if (metodo === 'POST') return rota.fulfill({ status: 201, json: { ...corpo, id: '7' } });
      const atual = tarefas.find((t) => t.id === idDaUrl);
      return rota.fulfill({ json: { ...atual, ...corpo } });
    }
    if (caminho === '/tarefas') return rota.fulfill({ json: tarefas });
    if (caminho === '/projetos') return rota.fulfill({ json: projetos });
    if (caminho.startsWith('/tarefas/')) return rota.fulfill({ json: tarefas.find((t) => t.id === idDaUrl) });
    if (caminho.startsWith('/projetos/')) return rota.fulfill({ json: { ...projetos[0], id: idDaUrl, tarefas: [] } });
    return rota.fulfill({ status: 404, body: '{}' });
  });

  const alerta = (texto) => pagina.getByRole('alert').filter({ hasText: texto });
  const focoNoAlerta = (texto) => pagina.waitForFunction(
    (t) => document.activeElement?.getAttribute('role') === 'alert' && document.activeElement.textContent.includes(t), texto);

  // 1) Nova tarefa: a falha avisa, mantém os campos e leva o foco ao aviso. O reenvio funciona.
  await pagina.goto(`${origem}/tarefas/nova`);
  await pagina.locator('#projeto').selectOption('1');
  await pagina.locator('#titulo').fill('Título que não pode sumir');
  await pagina.locator('#descricao').fill('Descrição digitada');
  await pagina.locator('#responsavel').fill('Ana');
  await pagina.locator('#prazo').fill('2026-11-10');
  for (const falha of [500, 'rede']) {
    falhaEscrita = falha;
    await pagina.getByRole('button', { name: 'Salvar tarefa' }).click();
    await alerta('Não foi possível salvar a tarefa').waitFor();
    await focoNoAlerta('Seus dados foram mantidos');
    assert.equal(await pagina.locator('#titulo').inputValue(), 'Título que não pode sumir');
    assert.equal(await pagina.locator('#descricao').inputValue(), 'Descrição digitada');
    assert.equal(await pagina.locator('#responsavel').inputValue(), 'Ana');
    assert.equal(await pagina.getByRole('button', { name: 'Salvar tarefa' }).isEnabled(), true);
    assert.equal(pagina.url(), `${origem}/tarefas/nova`);
  }
  assert.match(await alerta('Não foi possível').textContent(), /sem resposta da API/);
  falhaEscrita = null;
  await pagina.getByRole('button', { name: 'Salvar tarefa' }).click();
  await pagina.waitForURL(`${origem}/`);

  // 2) Editar tarefa: erro de API, 404 e sucesso. O texto editado permanece até salvar.
  await pagina.goto(`${origem}/tarefas/1/editar`);
  await pagina.locator('#tarefa-titulo').fill('Título editado');
  falhaEscrita = 500;
  await pagina.getByRole('button', { name: 'Salvar alterações' }).click();
  await alerta('Não foi possível salvar as alterações').waitFor();
  await focoNoAlerta('Seus dados foram mantidos');
  assert.equal(await pagina.locator('#tarefa-titulo').inputValue(), 'Título editado');
  falhaEscrita = 404;
  await pagina.getByRole('button', { name: 'Salvar alterações' }).click();
  await alerta('não existe mais').waitFor();
  assert.equal(await pagina.locator('#tarefa-titulo').inputValue(), 'Título editado');
  falhaEscrita = null;
  await pagina.getByRole('button', { name: 'Salvar alterações' }).click();
  await pagina.waitForURL(`${origem}/tarefas/1`);

  // 3) Novo projeto: mesma garantia.
  await pagina.goto(`${origem}/projetos/novo`);
  await pagina.locator('#nome').fill('Projeto digitado');
  await pagina.locator('#descricao').fill('Descrição do projeto');
  await pagina.locator('#disciplina').fill('Frontend');
  falhaEscrita = 500;
  await pagina.getByRole('button', { name: 'Salvar projeto' }).click();
  await alerta('Não foi possível salvar o projeto').waitFor();
  await focoNoAlerta('Seus dados foram mantidos');
  assert.equal(await pagina.locator('#nome').inputValue(), 'Projeto digitado');
  assert.equal(await pagina.locator('#disciplina').inputValue(), 'Frontend');
  falhaEscrita = null;
  await pagina.getByRole('button', { name: 'Salvar projeto' }).click();
  await pagina.waitForURL(`${origem}/projetos/7`);

  // 4) Excluir: a falha avisa, a tarefa continua na lista e o foco volta ao botão de confirmar.
  await pagina.goto(origem);
  const cartao = pagina.locator('.cartao').filter({ has: pagina.locator('[id="status-tarefa-1"]') });
  const dialogo = pagina.getByRole('dialog', { name: 'Excluir tarefa?', exact: true });
  const confirmar = dialogo.getByRole('button', { name: 'Excluir tarefa', exact: true });
  await cartao.getByRole('button', { name: /Excluir tarefa/ }).click();
  falhaEscrita = 500;
  await confirmar.click();
  await dialogo.getByRole('alert').filter({ hasText: 'A tarefa continua na lista' }).waitFor();
  assert.equal(await cartao.count(), 1);
  await pagina.waitForFunction(() => document.activeElement?.classList.contains('confirmar-exclusao'));

  // 5) Excluir uma tarefa que outra pessoa já apagou (404) tira o cartão da tela.
  falhaEscrita = 404;
  await confirmar.click();
  await cartao.waitFor({ state: 'detached' });
  await dialogo.waitFor({ state: 'hidden' });

  assert.deepEqual(erros, []);
  console.log('Issue 36: salvar (tarefa nova/edição, projeto) e excluir com erro de API, rede e 404: aviso, foco, dados mantidos e reenvio: OK');
} finally {
  await navegador?.close();
  vite.kill();
  await encerrado;
}
