// Requer build com VITE_API_URL=http://localhost:3000 e porta 3000 livre.
// A API usa somente memória e nunca altera o db.json do projeto.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { Low, Memory } from 'lowdb';
import { createApp } from 'json-server/lib/app.js';
import { chromium } from 'playwright';

const banco = new Low(new Memory(), {
  projetos: [{ id: '1', nome: 'Projeto de teste', descricao: 'Teste isolado', disciplina: 'Frontend', criadoEm: '2026-11-12' }],
  tarefas: [],
});
const app = createApp(banco);
const api = createServer(app.handler.bind(app));
const pasta = resolve('build');
const shell = await readFile(resolve(pasta, '200.html'));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
const site = createServer(async (req, res) => {
  try {
    const caminho = resolve(pasta, `.${decodeURIComponent(new URL(req.url, 'http://local').pathname)}`);
    if (caminho !== pasta && !caminho.startsWith(`${pasta}${sep}`)) return res.writeHead(403).end();
    let arquivo = false;
    try { arquivo = (await stat(caminho)).isFile(); } catch {}
    res.writeHead(200, { 'Content-Type': arquivo ? (mime[extname(caminho)] || 'application/octet-stream') : 'text/html' });
    res.end(arquivo ? await readFile(caminho) : shell);
  } catch { res.writeHead(500).end(); }
});
let navegador;
try {
  api.listen({ port: 3000, host: 'localhost', exclusive: true });
  await once(api, 'listening');
  site.listen(0, '127.0.0.1');
  await once(site, 'listening');
  const origem = `http://127.0.0.1:${site.address().port}`;
  navegador = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
  const pagina = await navegador.newPage();
  pagina.setDefaultTimeout(10000);
  const erros = [];
  pagina.on('pageerror', erro => erros.push(erro.message));
  await pagina.goto(`${origem}/`);
  await pagina.getByText('Nenhuma tarefa cadastrada', { exact: false }).waitFor();
  await pagina.getByRole('link', { name: 'Nova tarefa', exact: true }).click();
  await pagina.locator('#projeto').selectOption('1');
  await pagina.locator('#titulo').fill('Tarefa criada no teste do build');
  await pagina.locator('#descricao').fill('Dados temporários em memória');
  await pagina.locator('#responsavel').fill('Pessoa de teste');
  await pagina.locator('#prazo').fill('2026-12-01');
  await pagina.getByRole('button', { name: 'Salvar tarefa' }).click();
  await pagina.waitForURL(`${origem}/`);
  const cartao = pagina.locator('article').filter({ hasText: 'Tarefa criada no teste do build' });
  await cartao.waitFor();
  assert.equal(banco.data.tarefas.length, 1);
  await cartao.getByRole('combobox').selectOption('em-andamento');
  await pagina.getByText('Status salvo.', { exact: true }).waitFor();
  assert.equal(banco.data.tarefas[0].status, 'em-andamento');
  await cartao.getByRole('button', { name: /Excluir tarefa/ }).click();
  await pagina.getByRole('dialog').getByRole('button', { name: 'Excluir tarefa', exact: true }).click();
  await pagina.getByText('Nenhuma tarefa cadastrada', { exact: false }).waitFor();
  assert.equal(banco.data.tarefas.length, 0);
  assert.deepEqual(erros, []);
  console.log('PASS build com API real em memória: lista vazia, criação, mudança de status e exclusão');
} finally {
  await navegador?.close();
  if (site.listening) { site.closeAllConnections(); await new Promise(resolve => site.close(resolve)); }
  if (api.listening) { api.closeAllConnections(); await new Promise(resolve => api.close(resolve)); }
}
