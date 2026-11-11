// Testa os arquivos de build/ sem Vite ou servidor SvelteKit.
// Antes: VITE_API_URL=http://localhost:3000 npm run build
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { once } from 'node:events';
import { chromium } from 'playwright';

const pasta = resolve('build');
const redirecionamentos = await readFile(resolve(pasta, '_redirects'), 'utf8');
assert.match(redirecionamentos, /^\/\*\s+\/200\.html\s+200\s*$/m,
  'O build precisa incluir a regra de fallback da hospedagem');
const shell = await readFile(resolve(pasta, '200.html'));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.txt': 'text/plain' };

// Reproduz a regra de _redirects: arquivo existente primeiro, fallback depois.
const servidor = createServer(async (req, res) => {
  try {
    const caminho = resolve(pasta, `.${decodeURIComponent(new URL(req.url, 'http://local').pathname)}`);
    if (caminho !== pasta && !caminho.startsWith(`${pasta}${sep}`)) {
      res.writeHead(403).end(); return;
    }
    let arquivo = false;
    try { arquivo = (await stat(caminho)).isFile(); } catch {}
    res.writeHead(200, { 'Content-Type': arquivo ? (mime[extname(caminho)] || 'application/octet-stream') : 'text/html' });
    res.end(arquivo ? await readFile(caminho) : shell);
  } catch {
    res.writeHead(500).end();
  }
});
servidor.listen(0, '127.0.0.1');
await once(servidor, 'listening');
const origem = `http://127.0.0.1:${servidor.address().port}`;
const tarefa = { id: '2', projetoId: '1', titulo: 'Tarefa de publicação', descricao: 'Dado fictício',
  status: 'a-fazer', prioridade: 'media', responsavel: 'Pessoa de teste', prazo: '2026-11-15' };
const projeto = { id: '1', nome: 'Projeto de publicação', descricao: 'Dado fictício',
  disciplina: 'Frontend', criadoEm: '2026-11-10' };
let navegador;
try {
  navegador = await chromium.launch({ headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
  const pagina = await navegador.newPage({ viewport: { width: 1366, height: 900 } });
  pagina.setDefaultTimeout(7000);
  const erros = [];
  const requisicoes = [];
  pagina.on('pageerror', erro => erros.push(erro.message));
  await pagina.route('http://localhost:3000/**', async rota => {
    const req = rota.request();
    const url = new URL(req.url());
    requisicoes.push(url.pathname);
    assert.equal(req.method(), 'GET', 'O teste não deve gravar dados');
    const dados = {
      '/tarefas': [tarefa], '/tarefas/2': tarefa,
      '/projetos': [projeto], '/projetos/1': url.searchParams.has('_embed') ? { ...projeto, tarefas: [tarefa] } : projeto,
    }[url.pathname];
    await rota.fulfill({ status: dados ? 200 : 404, json: dados || {} });
  });
  const rotas = [
    ['/', 'Tarefas'], ['/quadro', 'Quadro de tarefas'], ['/projetos', 'Projetos'],
    ['/projetos/novo', 'Novo projeto'], ['/projetos/1', projeto.nome],
    ['/projetos/1/editar', 'Editar projeto'], ['/tarefas/2', tarefa.titulo],
    ['/tarefas/2/editar', 'Editar tarefa'], ['/tarefas/nova', 'Nova tarefa'],
    ['/tarefas/nova?projetoId=1', 'Nova tarefa'],
  ];
  for (const [caminho, titulo] of rotas) {
    const resposta = await pagina.goto(`${origem}${caminho}`);
    assert.equal(resposta.status(), 200, `Acesso direto: ${caminho}`);
    await pagina.getByRole('heading', { level: 1, name: titulo, exact: true }).waitFor();
    const recarga = await pagina.reload();
    assert.equal(recarga.status(), 200, `Recarga: ${caminho}`);
    await pagina.getByRole('heading', { level: 1, name: titulo, exact: true }).waitFor();
    console.log(`PASS direto e recarga: ${caminho}`);
  }
  assert.equal(await pagina.locator('#projeto').inputValue(), '1');
  await pagina.getByRole('link', { name: 'Cancelar', exact: true }).click();
  await pagina.waitForURL(`${origem}/`);
  await pagina.goBack();
  await pagina.waitForURL(`${origem}/tarefas/nova?projetoId=1`);
  await pagina.getByRole('heading', { name: 'Nova tarefa', exact: true }).waitFor();
  await pagina.goForward();
  await pagina.getByRole('heading', { name: 'Tarefas', exact: true }).waitFor();
  console.log('PASS Cancelar, Voltar e Avançar');

  await pagina.goto(`${origem}/tarefas/2/editar`);
  await pagina.getByRole('link', { name: 'Cancelar', exact: true }).click();
  await pagina.waitForURL(`${origem}/tarefas/2`);
  await pagina.getByRole('heading', { name: tarefa.titulo, exact: true }).waitFor();
  await pagina.goto(`${origem}/projetos/1/editar`);
  await pagina.getByRole('link', { name: 'Cancelar', exact: true }).click();
  await pagina.waitForURL(`${origem}/projetos/1`);
  await pagina.getByRole('heading', { name: projeto.nome, exact: true }).waitFor();
  console.log('PASS Cancelar edições sem gravação');

  await pagina.goto(`${origem}/tarefas/inexistente`);
  await pagina.getByRole('alert').filter({ hasText: 'Tarefa não encontrada.' }).waitFor();
  await pagina.goto(`${origem}/rota-inexistente`);
  await pagina.getByRole('heading', { name: 'Página não encontrada', exact: true }).waitFor();
  await pagina.getByRole('link', { name: 'Voltar para o início', exact: true }).click();
  await pagina.getByRole('heading', { name: 'Tarefas', exact: true }).waitFor();
  console.log('PASS inexistentes tratados pela aplicação');

  for (const largura of [390, 1366]) {
    await pagina.setViewportSize({ width: largura, height: 900 });
    await pagina.goto(`${origem}/tarefas/2`);
    await pagina.getByRole('heading', { name: tarefa.titulo, exact: true }).waitFor();
    assert.ok(await pagina.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Sem overflow em ${largura}px`);
  }
  assert.ok(requisicoes.includes('/tarefas/2'));
  assert.deepEqual(erros, [], 'Sem erros JavaScript no navegador');
  console.log('PASS celular, desktop e ausência de erros JavaScript');
} finally {
  await navegador?.close();
  servidor.closeAllConnections();
  await new Promise(resolve => servidor.close(resolve));
}
