<script lang="ts">
    import { onMount } from 'svelte';
    import { listarProjetos } from '../../lib/servicos/api';
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
    <p><a href="/projetos/novo">Novo projeto</a></p>
  
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
main { max-width: 88rem; margin: 0 auto; padding: 2.75rem 2rem 4rem; }
  main > p { margin: 0 0 2rem; }
  ul { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem; list-style: none; margin: 0; padding: 0; counter-reset: projeto; }
  li { position: relative; min-width: 0; padding: 2rem; border: 1px solid var(--linha); border-top: 4px solid var(--azul); border-radius: 2px; background: var(--superficie); box-shadow: 4px 4px 0 #dedfd7; counter-increment: projeto; overflow-wrap: anywhere; }
  li:nth-child(2n) { border-top-color: var(--ocre); }
  li::before { content: counter(projeto, decimal-leading-zero); display: block; margin-bottom: 1.5rem; color: var(--secundario); font-family: ui-monospace, monospace; font-size: .75rem; letter-spacing: .08em; }
  h2 { margin: 0 0 1rem; font-size: 1.45rem; }
  h2 a { color: var(--tinta); text-decoration: none; }
  h2 a:hover { color: var(--azul-escuro); text-decoration: underline; }
  li p { margin: .7rem 0 0; color: var(--secundario); font-size: .92rem; line-height: 1.7; }
  li p:last-child { margin-top: 1.75rem; padding-top: 1rem; border-top: 1px solid var(--linha); font-size: .8rem; }
  strong { color: var(--tinta); }
  @media (max-width: 640px) { main { padding: 1.5rem 1rem 3rem; } ul { grid-template-columns: minmax(0,1fr); } li { padding: 1.5rem; } }
</style>