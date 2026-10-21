<script lang="ts">
  import { criarProjeto } from '../../../lib/servicos/api';
  import { hojeLocal } from '../../../lib/utils/projetos';
  import type { CamposProjeto } from '../../../lib/utils/projetos';
  import FormularioProjeto from '../../../lib/componentes/FormularioProjeto.svelte';

  const inicial: CamposProjeto = { nome: '', descricao: '', disciplina: '' };

  // A API gera o id. A data de criação é a de hoje, no fuso do computador.
  async function salvar(dados: CamposProjeto): Promise<string> {
    const projeto = await criarProjeto({ ...dados, criadoEm: hojeLocal() });
    return `/projetos/${encodeURIComponent(projeto.id)}`;
  }
</script>

<svelte:head><title>Novo projeto | Gerenciador de Tarefas</title></svelte:head>

<main>
  <a href="/projetos">← Voltar para os projetos</a>
  <h1>Novo projeto</h1>
  <p>Informe o nome, a descrição e a disciplina do projeto.</p>

  <FormularioProjeto
    {inicial}
    rotuloSalvar="Salvar projeto"
    hrefCancelar="/projetos"
    aoSalvar={salvar}
  />
</main>

<style>
  main { max-width: 48rem; margin: 0 auto; padding: 1.5rem 1rem; }
  h1 { margin-bottom: 0.5rem; }
</style>
