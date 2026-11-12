import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mensagemFalha } from '../src/lib/utils/mensagemFalha.ts';

// Mesmo formato do ErroApi de src/lib/servicos/api.ts: um Error com o status HTTP.
// Não importamos api.ts aqui porque ele lê variáveis de ambiente do Vite.
function erroApi(status) {
  return Object.assign(new Error(`Erro ${status}`), { status });
}

test('API fora do ar (TypeError do fetch) pede para conferir a API', () => {
  const texto = mensagemFalha(new TypeError('Failed to fetch'), 'salvar a tarefa', true);
  assert.match(texto, /^Não foi possível salvar a tarefa: sem resposta da API\./);
  assert.match(texto, /Seus dados foram mantidos\. Tente novamente\.$/);
});

test('erro HTTP da API mostra o código e pede para tentar de novo', () => {
  const texto = mensagemFalha(erroApi(500), 'excluir a tarefa');
  assert.equal(texto, 'Não foi possível excluir a tarefa: a API respondeu com erro 500. Tente novamente.');
});

test('404 diz que o registro não existe mais e não sugere tentar de novo', () => {
  const texto = mensagemFalha(erroApi(404), 'salvar as alterações', true);
  assert.match(texto, /não existe mais/);
  assert.doesNotMatch(texto, /Tente novamente|mantidos/);
});

test('qualquer outro erro vira mensagem genérica, sem vazar o texto técnico', () => {
  const texto = mensagemFalha(new Error('detalhe interno'), 'salvar o projeto', true);
  assert.match(texto, /erro inesperado/);
  assert.doesNotMatch(texto, /detalhe interno/);
});

test('sem dadosMantidos a mensagem não promete manter dados', () => {
  assert.doesNotMatch(mensagemFalha(erroApi(503), 'excluir a tarefa'), /mantidos/);
});
