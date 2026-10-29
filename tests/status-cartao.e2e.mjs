import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { Low, Memory } from 'lowdb';
import { createApp } from 'json-server/lib/app.js';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
// Banco em memória: preserva o db.json da equipe e os dados locais.
const banco = new Low(new Memory(), JSON.parse(await fs.readFile('db.json', 'utf8')));
const servidor = createApp(banco);
const api = createServer(servidor.handler.bind(servidor));
api.listen(3000); await once(api, 'listening');
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'], {windowsHide:true,stdio:'ignore'});
let navegador;
try {
  for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:4173')).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
  navegador = await chromium.launch({headless:true});
  const pagina=await navegador.newPage({viewport:{width:1440,height:1000}});
  const erros=[]; pagina.on('pageerror',e=>erros.push(e.message));
  const primeira=banco.data.tarefas[0];
  const seletor=()=>pagina.locator(`[id="status-tarefa-${primeira.id}"]`);
  const coluna=status=>pagina.locator('section.coluna').filter({has:pagina.locator(`[id="titulo-${status}"]`)});
  await pagina.goto('http://127.0.0.1:4173/quadro'); await seletor().waitFor();
  const novo=primeira.status==='concluida'?'a-fazer':'concluida';
  const corpoAntes=structuredClone(primeira);
  const resposta=pagina.waitForResponse(r=>r.request().method()==='PATCH');
  await seletor().selectOption(novo);
  const patch=await resposta;
  assert.deepEqual(patch.request().postDataJSON(),{status:novo});
  await coluna(novo).locator(`[id="status-tarefa-${primeira.id}"]`).waitFor();
  assert.equal(banco.data.tarefas[0].status,novo);
  assert.deepEqual({...banco.data.tarefas[0],status:corpoAntes.status},corpoAntes);
  assert.equal(await seletor().evaluate(el=>el===document.activeElement),true);
  await pagina.reload(); await coluna(novo).locator(`[id="status-tarefa-${primeira.id}"]`).waitFor();
  await pagina.route('**/tarefas/*',r=>r.request().method()==='PATCH'?r.fulfill({status:500,body:'{}'}):r.continue());
  await seletor().selectOption('em-revisao'); await pagina.getByRole('alert').waitFor();
  assert.equal(await seletor().inputValue(),novo);
  assert.equal(banco.data.tarefas[0].status,novo);
  await pagina.unroute('**/tarefas/*');
  await seletor().selectOption('em-revisao'); await coluna('em-revisao').locator(`[id="status-tarefa-${primeira.id}"]`).waitFor();
  await pagina.goto('http://127.0.0.1:4173'); await seletor().waitFor();
  await pagina.locator('#filtro-status').selectOption('em-revisao');
  await seletor().selectOption('concluida'); await seletor().waitFor({state:'detached'});
  assert.equal(await pagina.locator('#busca').evaluate(el=>el===document.activeElement),true);
  await pagina.goto('http://127.0.0.1:4173/projetos/'+primeira.projetoId); await seletor().waitFor();
  assert.equal(await pagina.locator('a select').count(),0);
  await seletor().selectOption('a-fazer');
  await pagina.waitForFunction(()=>document.querySelector('[role="status"]').textContent.includes('atualizado'));
  assert.equal(banco.data.tarefas[0].status,'a-fazer');
  await pagina.setViewportSize({width:390,height:844});
  assert.equal(await pagina.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await pagina.locator('.cartao h3 a').first().click(); await pagina.waitForURL('**/tarefas/*');
  assert.deepEqual(erros,[]);
  console.log('Issue 29: PATCH somente de status; campos preservados; mudança de coluna; persistência após recarregar; falha e nova tentativa; foco; filtros; página do projeto; celular e detalhe: OK');
}finally{
  await navegador?.close();vite.kill();api.closeAllConnections();await new Promise(r=>api.close(r));
}
