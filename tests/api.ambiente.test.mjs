import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

test('a URL configurada é usada nas requisições sem duplicar a barra final', () => {
  const codigo = `
    import { listarTarefas } from './src/lib/servicos/api.ts';
    globalThis.fetch = async (url) => {
      console.log(url);
      return new Response('[]');
    };
    await listarTarefas();
  `;
  const resultado = execFileSync(process.execPath, ['--input-type=module', '-e', codigo], {
    env: { ...process.env, VITE_API_URL: 'https://api.teste.invalid/base/' },
    encoding: 'utf8',
  });
  assert.equal(resultado.trim(), 'https://api.teste.invalid/base/tarefas');
});
