<script lang="ts">
    import { page } from '$app/state';
  </script>
  
  {#if page.status === 404}
    <h1>Página não encontrada</h1>
    <p>O endereço acessado não existe.</p>
  {:else}
    <h1>Erro {page.status}</h1>
    <p>Não foi possível abrir esta página.</p>
  {/if}
  
  <a href="/">Voltar para o início</a>
  