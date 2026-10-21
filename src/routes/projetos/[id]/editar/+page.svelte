<script lang="ts">
  import { page } from '$app/state';
  import { atualizarProjeto, buscarProjeto, ErroApi } from '../../../../lib/servicos/api';
  import type { AtualizacaoProjeto, Projeto } from '../../../../tipos';
  import type { CamposProjeto } from '../../../../lib/utils/projetos';
  import FormularioProjeto from '../../../../lib/componentes/FormularioProjeto.svelte';

  let projeto = $state<Projeto | null>(null);
  let carregando = $state(true);
  let erro = $state<string | null>(null);

  // Busca de novo sempre que o id da URL muda.
  $effect(() => {
    const id = page.params.id;
    if (!id) return;

    let ativo = true;
    projeto = null;
    erro = null;
    carregando = true;

    buscarProjeto(id)
      .then((dados) => {
        if (ativo) projeto = dados;
      })
      .catch((e) => {
        if (!ativo) return;
        erro =
          e instanceof ErroApi && e.status === 404
            ? 'Projeto não encontrado.'
            : 'Não foi possível carregar o projeto.';
      })
      .finally(() => {
        if (ativo) carregando = false;
      });

    return () => {
      ativo = false;
    };
  });

  // PATCH recebe só os campos alterados. O id e o criadoEm não mudam.
  async function salvar(dados: CamposProjeto): Promise<string> {
    const atual = projeto;
    if (!atual) throw new Error('Projeto não carregado.');

    const alteracoes: AtualizacaoProjeto = {};
    if (dados.nome !== atual.nome) alteracoes.nome = dados.nome;
    if (dados.descricao !== atual.descricao) alteracoes.descricao = dados.descricao;
    if (dados.disciplina !== atual.disciplina) alteracoes.disciplina = dados.disciplina;

    if (Object.keys(alteracoes).length > 0) {
      await atualizarProjeto(atual.id, alteracoes);
    }
    return `/projetos/${encodeURIComponent(atual.id)}`;
  }
</script>

<svelte:head><title>Editar projeto | Gerenciador de Tarefas</title></svelte:head>

<main>
  <a href="/projetos">← Voltar para os projetos</a>
  <h1>Editar projeto</h1>

  {#if carregando}
    <p role="status">Carregando projeto...</p>
  {:else if erro}
    <p role="alert">{erro}</p>
  {:else if projeto}
    {#key projeto.id}
      <FormularioProjeto
        inicial={{
          nome: projeto.nome,
          descricao: projeto.descricao,
          disciplina: projeto.disciplina
        }}
        rotuloSalvar="Salvar alterações"
        hrefCancelar={`/projetos/${encodeURIComponent(projeto.id)}`}
        aoSalvar={salvar}
      />
    {/key}
  {/if}
</main>

<style>
  main { max-width: 48rem; margin: 0 auto; padding: 1.5rem 1rem; }
  h1 { margin-bottom: 0.5rem; }
</style>
