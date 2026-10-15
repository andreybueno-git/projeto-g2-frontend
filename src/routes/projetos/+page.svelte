<script lang="ts">
    import { onMount } from 'svelte';
    import { listarProjetos } from '../../lib/api';
    import type { Projeto } from '../../tipos';
  
    let projetos = $state<Projeto[]>([]);
    let carregando = $state(true);
    let erro = $state<string | null>(null);
  
    onMount(async () => {
      try {
        projetos = await listarProjetos();
      } catch {
        erro = 'Não foi possível carregar os projetos.';
      } finally {
        carregando = false;
      }
    });
  </script>
  
  <main>
    <h1>Projetos</h1>
  
    {#if carregando}
      <p>Carregando projetos...</p>
    {:else if erro}
      <p role="alert">{erro}</p>
    {:else if projetos.length === 0}
      <p>Nenhum projeto cadastrado.</p>
    {:else}
      <ul>
        {#each projetos as projeto (projeto.id)}
          <li>
            <h2>
              <a href={`/projetos/${projeto.id}`}>
                {projeto.nome}
              </a>
            </h2>
  
            <p>{projeto.descricao}</p>
            <p><strong>Disciplina:</strong> {projeto.disciplina}</p>
          </li>
        {/each}
      </ul>
    {/if}
  </main>
  
  <style>
    main {
      max-width: 72rem;
      margin: 0 auto;
      padding: 1.5rem 1rem;
    }
  </style>