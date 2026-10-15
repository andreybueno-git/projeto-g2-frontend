
<script lang="ts">
  import type { Tarefa } from "../../tipos";
  import {
    ROTULOS_STATUS,
    ROTULOS_PRIORIDADE,
    formatarPrazo
  } from "../rotulos";

  let { tarefa }: { tarefa: Tarefa } = $props();
</script>

<article class="cartao">
  <h3>{tarefa.titulo}</h3>

  <div class="selos">
    <span class="selo status">
      {ROTULOS_STATUS[tarefa.status]}
    </span>

    <span class="selo prioridade {tarefa.prioridade}">
      Prioridade {ROTULOS_PRIORIDADE[tarefa.prioridade].toLowerCase()}
    </span>
  </div>

  <dl>
    <div class="informacao">
      <dt>Responsável</dt>
      <dd>{tarefa.responsavel}</dd>
    </div>

    <div class="informacao">
      <dt>Prazo</dt>
      <dd>{formatarPrazo(tarefa.prazo)}</dd>
    </div>
  </dl>
</article>

<style>
  .cartao {
    height: 100%;
    min-width: 0;
    box-sizing: border-box;
    border: 1px solid #c9ced6;
    border-radius: 10px;
    padding: 1.25rem;
    background-color: #ffffff;
    color: #1f2328;
    overflow-wrap: anywhere;
  }

  h3 {
    margin: 0 0 0.75rem;
    font-size: 1.05rem;
    font-weight: 600;
    line-height: 1.5;
  }

  .selos {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .selo {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    box-sizing: border-box;
    padding: 0.25rem 0.65rem;
    border: 1px solid #c9ced6;
    border-radius: 999px;
    font-size: 0.8rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .status {
    background-color: #f8fafc;
    color: #1f2328;
  }

  .prioridade.alta {
    background-color: #ffe3e3;
    border-color: #d1242f;
    color: #8b1e27;
  }

  .prioridade.media {
    background-color: #fff4d6;
    border-color: #bf8700;
    color: #805900;
  }

  .prioridade.baixa {
    background-color: #e6f4ea;
    border-color: #1a7f37;
    color: #17652e;
  }

  dl {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    margin: 0;
  }

  .informacao {
    min-width: 0;
  }

  dt {
    margin-bottom: 0.25rem;
    font-size: 0.75rem;
    color: #59636e;
  }

  dd {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  @media (max-width: 480px) {
    .cartao {
      padding: 1rem;
      border-radius: 8px;
    }

    h3 {
      font-size: 1rem;
    }

    .selos {
      gap: 0.4rem;
      margin-bottom: 0.85rem;
    }

    .selo {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
    }

    dl {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    dd {
      font-size: 0.9rem;
    }
  }
</style>
