<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { criarTarefa, listarProjetos } from '../../../lib/servicos/api';
  import type { NovaTarefa, Projeto } from '../../../tipos';

  let projetos = $state<Projeto[]>([]);
  let carregando = $state(true);
  let erroProjetos = $state<string | null>(null);
  let erroSalvar = $state<string | null>(null);
  let avisoProjeto = $state<string | null>(null);
  let salvando = $state(false);
  let tarefaCriada = $state(false);
  let paginaAtiva = true;
  let dados = $state<NovaTarefa>({
    projetoId: '', titulo: '', descricao: '', status: 'a-fazer',
    prioridade: 'media', responsavel: '', prazo: ''
  });

  const projetoSugerido = $derived(page.url.searchParams.get('projetoId'));

  // A URL pode mudar sem desmontar esta página. A escolha manual não é uma dependência.
  $effect(() => {
    if (carregando || erroProjetos) return;
    const existe = projetos.some((projeto) => projeto.id === projetoSugerido);
    dados.projetoId = existe ? projetoSugerido! : '';
    avisoProjeto = projetoSugerido && !existe
      ? 'O projeto indicado no link não foi encontrado. Selecione outro projeto.'
      : null;
  });

  async function carregarProjetos() {
    carregando = true;
    erroProjetos = null;
    try {
      projetos = await listarProjetos();
    } catch {
      erroProjetos = 'Não foi possível carregar os projetos. Confira se a API está ligada e tente novamente.';
    } finally {
      carregando = false;
    }
  }

  onMount(() => { void carregarProjetos(); });
  onDestroy(() => { paginaAtiva = false; });

  async function salvar(evento: SubmitEvent) {
    evento.preventDefault();
    if (salvando || tarefaCriada || carregando || erroProjetos || projetos.length === 0) return;
    if (!projetos.some((projeto) => projeto.id === dados.projetoId)) return;

    salvando = true;
    erroSalvar = null;
    try {
      await criarTarefa({ ...dados });
      tarefaCriada = true;
    } catch {
      erroSalvar = 'Não foi possível salvar a tarefa. Seus dados foram mantidos. Tente novamente.';
    } finally {
      salvando = false;
    }

    // Se a navegação falhar após o POST, não oferecemos um segundo cadastro da mesma tarefa.
    if (tarefaCriada && paginaAtiva) {
      try { await goto('/'); } catch { /* O link de sucesso abaixo permite voltar à lista. */ }
    }
  }
</script>

<svelte:head><title>Nova tarefa | Gerenciador de Tarefas</title></svelte:head>

<main>
  <a href="/">← Voltar para as tarefas</a>
  <h1>Nova tarefa</h1>
  <p>Preencha os dados e escolha o projeto ao qual a tarefa pertence.</p>

  {#if carregando}
    <p role="status">Carregando projetos...</p>
  {:else if erroProjetos}
    <p class="erro" role="alert">{erroProjetos}</p>
    <button type="button" onclick={carregarProjetos}>Tentar novamente</button>
  {:else if projetos.length === 0}
    <p>Cadastre um projeto antes de criar uma tarefa.</p>
    <a href="/projetos">Ver projetos</a>
  {:else if tarefaCriada}
    <p role="status">Tarefa criada com sucesso. <a href="/">Ir para a lista de tarefas</a></p>
  {:else}
    {#if avisoProjeto}<p role="status">{avisoProjeto}</p>{/if}
    <form onsubmit={salvar} aria-busy={salvando}>
      <fieldset disabled={salvando}>
        <legend>Dados da tarefa</legend>
        <label for="projeto">Projeto</label>
        <select id="projeto" bind:value={dados.projetoId} required>
          <option value="" disabled>Selecione um projeto</option>
          {#each projetos as projeto (projeto.id)}
            <option value={projeto.id}>{projeto.nome}</option>
          {/each}
        </select>

        <label for="titulo">Título</label>
        <input id="titulo" bind:value={dados.titulo} required />

        <label for="descricao">Descrição</label>
        <textarea id="descricao" bind:value={dados.descricao} rows="4" required></textarea>

        <div class="colunas">
          <div>
            <label for="status">Status</label>
            <select id="status" bind:value={dados.status} required>
              <option value="a-fazer">A fazer</option>
              <option value="em-andamento">Em andamento</option>
              <option value="em-revisao">Em revisão</option>
              <option value="concluida">Concluída</option>
            </select>
          </div>
          <div>
            <label for="prioridade">Prioridade</label>
            <select id="prioridade" bind:value={dados.prioridade} required>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
        </div>

        <label for="responsavel">Responsável</label>
        <input id="responsavel" bind:value={dados.responsavel} required />

        <label for="prazo">Prazo</label>
        <input id="prazo" type="date" bind:value={dados.prazo} required />

        {#if erroSalvar}<p class="erro" role="alert">{erroSalvar}</p>{/if}
        <div class="acoes">
          <button type="submit">{salvando ? 'Salvando...' : 'Salvar tarefa'}</button>
          <a href="/">Cancelar</a>
        </div>
        {#if salvando}<p role="status">Salvando tarefa...</p>{/if}
      </fieldset>
    </form>
  {/if}
</main>

<style>
  main { max-width: 48rem; margin: 0 auto; padding: 1.5rem 1rem; }
  h1 { margin-bottom: 0.5rem; }
  form { margin-top: 1.5rem; }
  fieldset { min-width: 0; border: 1px solid #cbd5e1; border-radius: 0.5rem; padding: 1.25rem; }
  legend { padding: 0 0.4rem; font-weight: 700; }
  label { display: block; margin: 1rem 0 0.35rem; font-weight: 600; }
  input, select, textarea { display: block; width: 100%; min-height: 2.75rem; padding: 0.65rem; font: inherit; color: #0f172a; background: #fff; border: 1px solid #64748b; border-radius: 0.35rem; }
  textarea { resize: vertical; }
  .colunas { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
  .acoes { display: flex; align-items: center; flex-wrap: wrap; gap: 1.25rem; margin-top: 1.5rem; }
  button { padding: 0.75rem 1rem; font: inherit; font-weight: 600; background: #2563eb; color: #fff; border: 0; border-radius: 0.4rem; cursor: pointer; }
  button:hover { background: #1d4ed8; }
  button:disabled { cursor: wait; opacity: 0.7; }
  :is(input, select, textarea, button):focus-visible { outline: 3px solid #2563eb; outline-offset: 3px; }
  .erro { color: #991b1b; }
  @media (max-width: 480px) { .colunas { grid-template-columns: 1fr; gap: 0; } fieldset { padding: 1rem; } }
</style>
